import XCTest
import WebKit
import Security
import Network
import Combine
@testable import Lingrove

final class StubNetwork: URLProtocol, @unchecked Sendable {
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        if request.url?.host == "api.minimax.cn" {
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer tts-native-secret")
            XCTAssertEqual(request.url?.path, "/v1/t2a_v2")
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: Data(#"{"base_resp":{"status_code":0},"data":{"status":2,"audio":"4944330102"}}"#.utf8))
            client?.urlProtocolDidFinishLoading(self)
            return
        }
        if request.url?.path == "/public" {
            XCTAssertNil(request.value(forHTTPHeaderField: "Authorization"))
        } else if request.url?.host == "model.example" {
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer native-only-token")
            XCTAssertEqual(request.url?.path, "/v1/chat/completions")
        }
        let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "text/event-stream"])!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        for chunk in ["data: {\"text\":\"你", "好\"}\n\n", "data: [DONE]\n\n"] { client?.urlProtocol(self, didLoad: Data(chunk.utf8)) }
        client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}
final class RuntimeTests: XCTestCase {
    @MainActor func testModuleDisplayOrderPersistsAndAppendsNewModules() throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let builtin = root.appendingPathComponent("builtin")
        let suite = "module-order-\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer {
            defaults.removePersistentDomain(forName: suite)
            try? FileManager.default.removeItem(at: root)
        }
        func addModule(_ id: String) throws {
            let directory = builtin.appendingPathComponent(id)
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            let module = Module(id: id, name: id, version: "1.0.0", entry: "index.html", minHostVersion: "1.0.0", bridgeVersion: 1, stateSchemaVersion: 1, allowedOrigins: [])
            try JSONEncoder().encode(module).write(to: directory.appendingPathComponent("manifest.json"))
        }
        try addModule("beta")
        try addModule("gamma")
        let store = ModuleStore(root: root.appendingPathComponent("state"), config: HostConfiguration(catalogURL: ""), builtinRoot: builtin, defaults: defaults)
        XCTAssertEqual(store.modules.map(\.id), ["beta", "gamma"])
        store.setDisplayOrder(["gamma", "gamma", "missing", "beta"])
        XCTAssertEqual(store.modules.map(\.id), ["gamma", "beta"])
        try addModule("alpha")
        let reopened = ModuleStore(root: root.appendingPathComponent("state"), config: HostConfiguration(catalogURL: ""), builtinRoot: builtin, defaults: defaults)
        XCTAssertEqual(reopened.modules.map(\.id), ["gamma", "beta", "alpha"])
        reopened.setDisplayOrder(["beta", "gamma"])
        XCTAssertEqual(reopened.modules.map(\.id), ["beta", "gamma", "alpha"])
    }

    @MainActor func testUnavailableDebugServerFallsBackLocallyAndReloadRetriesServer() async throws {
        try XCTSkipUnless(DebugServer.available)
        let defaults = UserDefaults.standard
        let originalEnabled = defaults.object(forKey: DebugServer.enabledPreferenceKey)
        let originalAddress = defaults.object(forKey: DebugServer.preferenceKey)
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        defer {
            defaults.set(originalEnabled, forKey: DebugServer.enabledPreferenceKey)
            defaults.set(originalAddress, forKey: DebugServer.preferenceKey)
            try? FileManager.default.removeItem(at: directory)
        }
        defaults.set(true, forKey: DebugServer.enabledPreferenceKey)
        defaults.set("http://127.0.0.1:59999", forKey: DebugServer.preferenceKey)
        try Data("<html><head></head><body>local resource<script src='ready.js'></script></body></html>".utf8).write(to: directory.appendingPathComponent("index.html"))
        try Data("window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'runtime.ready',params:{}})".utf8).write(to: directory.appendingPathComponent("ready.js"))
        let module = Module(id: "fallback-test", name: "Fallback", version: "1.0.0", entry: "index.html", minHostVersion: "1.0.0", bridgeVersion: 1, stateSchemaVersion: 1, allowedOrigins: [])
        let ready = expectation(description: "Local fallback bridge ready")
        var startupFailures = 0
        var failures = 0
        let page = ModulePage(module: module, directory: directory, onReady: { ready.fulfill() }, onFailure: { _ in failures += 1 }, onStartupFailure: { startupFailures += 1 }, refreshing: true)
        defer { page.close() }
        let remoteRuntime = page.runtime!
        await fulfillment(of: [ready], timeout: 30)
        let localURL = URL(string: "lingrove://fallback-test/index.html")!
        XCTAssertEqual(page.webView.url, localURL)
        XCTAssertTrue(page.runtime.accepts(localURL))
        XCTAssertFalse(page.runtime.accepts(DebugServer.entryURL(for: module)!))
        XCTAssertNil(page.failure)
        XCTAssertFalse(page.isLoading)
        XCTAssertFalse(page.isReloading)
        XCTAssertEqual(page.reloadMessage, "服务器不可用，已加载本地资源")
        XCTAssertEqual(startupFailures, 0)
        XCTAssertEqual(failures, 0)
        remoteRuntime.onFailure("stale failure")
        XCTAssertNil(page.failure)
        page.reload()
        XCTAssertTrue(page.runtime.accepts(DebugServer.entryURL(for: module)!))
        page.runtime.webView(page.webView, didFailProvisionalNavigation: nil, withError: URLError(.cannotConnectToHost))
        page.runtime.webView(page.webView, didFailProvisionalNavigation: nil, withError: URLError(.fileDoesNotExist))
        XCTAssertNotNil(page.failure)
        XCTAssertEqual(startupFailures, 1)
        XCTAssertEqual(failures, 1)
    }

    @MainActor func testBundledPronunciationDecodesOffline() async throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let assets = try XCTUnwrap(Bundle.main.resourceURL).appendingPathComponent("BuiltinModules/glyphora/assets")
        let scripts = try FileManager.default.contentsOfDirectory(at: assets, includingPropertiesForKeys: nil)
            .filter { $0.pathExtension == "js" }
            .map { try String(contentsOf: $0, encoding: .utf8) }.joined()
        let audioRange = try XCTUnwrap(scripts.range(of: "data:audio/wav;base64,[A-Za-z0-9+/=]+", options: .regularExpression))
        let audioSource = String(scripts[audioRange])
        try Data("<html><head></head><body><script src='ready.js'></script></body></html>".utf8).write(to: directory.appendingPathComponent("index.html"))
        try Data("window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'runtime.ready',params:{}})".utf8).write(to: directory.appendingPathComponent("ready.js"))
        let module = Module(id: "audio-test", name: "Audio", version: "1.0.0", entry: "index.html", minHostVersion: "1.3.0", bridgeVersion: 1, stateSchemaVersion: 1, allowedOrigins: [])
        let ready = expectation(description: "audio page ready")
        let page = ModulePage(module: module, directory: directory, onReady: { ready.fulfill() }, onFailure: { XCTFail($0) })
        defer { page.close() }
        await fulfillment(of: [ready], timeout: 15)
        let result = try await page.webView.callAsyncJavaScript("""
          const audio = new Audio();
          if (!audio.canPlayType('audio/wav')) throw new Error('WAV is unsupported');
          const context = new (window.AudioContext || window.webkitAudioContext)();
          try {
            const bytes = Uint8Array.from(atob(audioSource.split(',')[1]), c => c.charCodeAt(0));
            const decoded = await context.decodeAudioData(bytes.buffer);
            return decoded.duration;
          } finally { await context.close(); }
        """, arguments: ["audioSource": audioSource], in: nil, contentWorld: .page)
        XCTAssertGreaterThan(try XCTUnwrap(result as? Double), 0.1)
    }

    @MainActor func testInlineHandwritingRestoresAndDetachesBySession() async throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at:directory,withIntermediateDirectories:true)
        defer { try? FileManager.default.removeItem(at:directory) }
        try Data("<html><body><script src='ready.js'></script></body></html>".utf8).write(to:directory.appendingPathComponent("index.html"))
        try Data("window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'runtime.ready',params:{}})".utf8).write(to:directory.appendingPathComponent("ready.js"))
        let module = Module(id:"ink-test", name:"Ink", version:"1.0.0",entry:"index.html",minHostVersion:"1.3.0",bridgeVersion:1,stateSchemaVersion:1,allowedOrigins:[])
        let loaded = expectation(description:"ink page ready")
        let page = ModulePage(module:module,directory:directory,onReady:{loaded.fulfill()},onFailure:{XCTFail($0)})
        defer {page.close()}
        await fulfillment(of:[loaded],timeout:15)
        XCTAssertTrue(page.isRootPage)
        _ = try await page.webView.callAsyncJavaScript("return await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'runtime.navigation',params:{isRoot:false}})",arguments:[:],in:nil,contentWorld:.page)
        XCTAssertFalse(page.isRootPage)
        _ = try await page.webView.callAsyncJavaScript("return await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'runtime.navigation',params:{isRoot:true}})",arguments:[:],in:nil,contentWorld:.page)
        XCTAssertTrue(page.isRootPage)
        let result = try await page.webView.callAsyncJavaScript("return await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'handwriting.inline',params:{id:'inline-test',action:'attach',rect:{x:20,y:100,width:300,height:300},strokes:[[{x:0.2,y:0.2},{x:0.7,y:0.8}]]}})",arguments:[:],in:nil,contentWorld:.page)
        XCTAssertEqual(result as? Bool,true)
        XCTAssertEqual(page.webView.scrollView.subviews.filter {$0 is InlineHandwriting}.count,1)
        let inkView = try XCTUnwrap(page.webView.scrollView.subviews.first { $0 is InlineHandwriting })
        _ = try await page.webView.callAsyncJavaScript("return await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'handwriting.inline',params:{id:'inline-test',action:'configure',hidden:true,locked:true}})",arguments:[:],in:nil,contentWorld:.page)
        XCTAssertTrue(inkView.isHidden)
        _ = try await page.webView.callAsyncJavaScript("return await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'handwriting.inline',params:{id:'inline-test',action:'configure',hidden:false}})",arguments:[:],in:nil,contentWorld:.page)
        XCTAssertFalse(inkView.isHidden)
        XCTAssertTrue(page.webView.scrollView.subviews.contains { $0 === inkView })
        _ = try await page.webView.callAsyncJavaScript("return await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'handwriting.inline',params:{id:'old-session',action:'detach'}})",arguments:[:],in:nil,contentWorld:.page)
        XCTAssertEqual(page.webView.scrollView.subviews.filter {$0 is InlineHandwriting}.count,1)
        _ = try await page.webView.callAsyncJavaScript("return await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'handwriting.inline',params:{id:'inline-test',action:'detach'}})",arguments:[:],in:nil,contentWorld:.page)
        XCTAssertEqual(page.webView.scrollView.subviews.filter {$0 is InlineHandwriting}.count,0)
    }

    @MainActor func testDebugHTTPPageCanUseHostBridge() async throws {
        let server = try NWListener(using: .tcp, on: .any)
        let listening = expectation(description: "HTTP server ready")
        server.stateUpdateHandler = { if case .ready = $0 { listening.fulfill() } }
        server.newConnectionHandler = { connection in
            connection.start(queue: .global())
            connection.receive(minimumIncompleteLength: 1, maximumLength: 8192) { _, _, _, _ in
                let html = "<html><head></head><body>remote resource<script>window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'runtime.ready',params:{}})</script></body></html>"
                let response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nCache-Control: no-store\r\nContent-Length: \(html.utf8.count)\r\nConnection: close\r\n\r\n" + html
                connection.send(content: Data(response.utf8), completion: .contentProcessed { _ in connection.cancel() })
            }
        }
        server.start(queue: .global())
        defer { server.cancel() }
        await fulfillment(of: [listening], timeout: 5)
        let port = try XCTUnwrap(server.port)
        let entry = URL(string: "http://127.0.0.1:\(port.rawValue)/remote-test/index.html")!
        let module = Module(id: "remote-test", name: "Remote", version: "1.0.0", entry: "index.html", minHostVersion: "1.0.0", bridgeVersion: 1, stateSchemaVersion: 1, allowedOrigins: [])
        let ready = expectation(description: "Remote HTTP page bridge handshake")
        let runtime = Runtime(module: module, directory: FileManager.default.temporaryDirectory, onReady: { ready.fulfill() }, onFailure: { XCTFail($0) }, debugEntryURL: entry)
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .nonPersistent()
        config.userContentController.addScriptMessageHandler(runtime, contentWorld: .page, name: "lingrove")
        let webView = WKWebView(frame: .zero, configuration: config)
        runtime.webView = webView
        webView.navigationDelegate = runtime
        defer { runtime.close(); config.userContentController.removeScriptMessageHandler(forName: "lingrove", contentWorld: .page) }
        webView.load(URLRequest(url: entry))
        await fulfillment(of: [ready], timeout: 15)
        XCTAssertEqual(webView.url, entry)
        XCTAssertTrue(runtime.accepts(entry))
        XCTAssertFalse(runtime.accepts(URL(string: "lingrove://remote-test/index.html")!))
    }
    func testDebugModeSwitchDefaultsOnAndDisablesRemoteResources() throws {
        try XCTSkipUnless(DebugServer.available)
        let defaults = UserDefaults.standard
        let originalEnabled = defaults.object(forKey: DebugServer.enabledPreferenceKey)
        let originalAddress = defaults.object(forKey: DebugServer.preferenceKey)
        defer {
            defaults.set(originalEnabled, forKey: DebugServer.enabledPreferenceKey)
            defaults.set(originalAddress, forKey: DebugServer.preferenceKey)
        }
        defaults.removeObject(forKey: DebugServer.enabledPreferenceKey)
        defaults.set("http://localhost:8000", forKey: DebugServer.preferenceKey)
        let module = Module(id: "switch-test", name: "Switch", version: "1.0.0", entry: "index.html", minHostVersion: "1.0.0", bridgeVersion: 1, stateSchemaVersion: 1, allowedOrigins: [])
        XCTAssertTrue(DebugServer.enabled)
        XCTAssertNotNil(DebugServer.entryURL(for: module))
        defaults.set(false, forKey: DebugServer.enabledPreferenceKey)
        XCTAssertTrue(DebugServer.available)
        XCTAssertFalse(DebugServer.enabled)
        XCTAssertNil(DebugServer.entryURL(for: module))
        XCTAssertEqual(defaults.string(forKey: DebugServer.preferenceKey), "http://localhost:8000")
        defaults.set(true, forKey: DebugServer.enabledPreferenceKey)
        XCTAssertEqual(DebugServer.entryURL(for: module)?.absoluteString, "http://localhost:8000/switch-test/index.html")
    }
    func testDebugServerAddressAndNavigationIsolation() throws {
        XCTAssertEqual(try DebugServer.normalized("  http://192.168.1.2:8000/assets  "), "http://192.168.1.2:8000/assets/")
        XCTAssertEqual(try DebugServer.normalized("  "), "")
        for raw in ["file:///tmp", "javascript:alert(1)", "https://u:p@example.com", "http://example.com?key=x", "http://example.com/#x", "example.com"] {
            XCTAssertThrowsError(try DebugServer.normalized(raw))
        }
        let entry = URL(string: "http://localhost:8000/sentra/index.html")!
        XCTAssertTrue(DebugServer.allows(entry, entry: entry))
        XCTAssertTrue(DebugServer.allows(URL(string: entry.absoluteString + "#history")!, entry: entry))
        for raw in ["http://localhost:8001/sentra/index.html", "https://localhost:8000/sentra/index.html", "http://localhost:8000/other/index.html", "http://example.com:8000/sentra/index.html"] {
            XCTAssertFalse(DebugServer.allows(URL(string: raw)!, entry: entry))
        }
    }
    @MainActor func testDebugReloadReportsReadyAndFailureOnlyAfterReload() throws {
        try XCTSkipUnless(DebugServer.enabled)
        let module = Module(id: "feedback-test", name: "Feedback", version: "1.0.0", entry: "index.html", minHostVersion: "1.0.0", bridgeVersion: 1, stateSchemaVersion: 1, allowedOrigins: [])
        var messages: [String] = []
        let page = ModulePage(module: module, directory: FileManager.default.temporaryDirectory, onReady: {}, onFailure: { _ in }, onReloadResult: { messages.append($0) })
        defer { page.close() }
        XCTAssertTrue(page.isLoading)
        XCTAssertNotEqual(page.webView.scrollView.pinchGestureRecognizer?.isEnabled, true)
        page.runtime.onReady()
        XCTAssertFalse(page.isLoading)
        XCTAssertTrue(messages.isEmpty)
        let oldRuntime = page.runtime!
        page.reload()
        oldRuntime.onReady()
        oldRuntime.onFailure("旧页面失败")
        XCTAssertTrue(page.isLoading)
        XCTAssertNil(page.failure)
        XCTAssertEqual(page.reloadMessage, "正在刷新…")
        page.runtime.onReady()
        XCTAssertEqual(page.reloadMessage, "本地资源重新加载成功")
        XCTAssertFalse(page.isLoading)
        page.runtime.onReady()
        XCTAssertEqual(messages, ["正在刷新…", "本地资源重新加载成功"])
        page.reload()
        page.runtime.onFailure("服务器无法连接")
        XCTAssertFalse(page.isLoading)
        XCTAssertEqual(page.reloadMessage, "本地资源重新加载失败：服务器无法连接")
        XCTAssertEqual(messages.count, 4)
        page.reload()
        XCTAssertEqual(page.reloadMessage, "正在刷新…")
        page.runtime.onReady()
        XCTAssertEqual(page.reloadMessage, "本地资源重新加载成功")
    }
    @MainActor func testDebugReloadReportsServerSuccessAndLocalFallback() throws {
        try XCTSkipUnless(DebugServer.enabled)
        let original = UserDefaults.standard.object(forKey: DebugServer.preferenceKey)
        defer { UserDefaults.standard.set(original, forKey: DebugServer.preferenceKey) }
        UserDefaults.standard.set("http://127.0.0.1:8000", forKey: DebugServer.preferenceKey)
        let module = Module(id: "server-feedback", name: "Server", version: "1.0.0", entry: "index.html", minHostVersion: "1.0.0", bridgeVersion: 1, stateSchemaVersion: 1, allowedOrigins: [])
        let page = ModulePage(module: module, directory: FileManager.default.temporaryDirectory, onReady: {}, onFailure: { _ in })
        defer { page.close() }
        page.reload()
        XCTAssertTrue(page.isReloading)
        page.runtime.onReady()
        XCTAssertEqual(page.reloadMessage, "服务器资源刷新成功")
        XCTAssertFalse(page.isReloading)
        page.reload()
        UserDefaults.standard.removeObject(forKey: DebugServer.preferenceKey)
        page.runtime.onFailure("服务器无法连接")
        XCTAssertNil(page.failure)
        XCTAssertTrue(page.isReloading)
        page.runtime.onReady()
        XCTAssertEqual(page.reloadMessage, "服务器不可用，已加载本地资源")
        XCTAssertFalse(page.isReloading)
    }
    @MainActor func testDebugReloadAllIncludesUnopenedModulesAndReportsIndividualResults() async throws {
        try XCTSkipUnless(DebugServer.enabled)
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let builtin = root.appendingPathComponent("builtin")
        defer { try? FileManager.default.removeItem(at: root) }
        for id in ["refresh-alpha", "refresh-beta"] {
            let directory = builtin.appendingPathComponent(id)
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            let module = Module(id: id, name: id, version: "1.0.0", entry: "index.html", minHostVersion: "1.0.0", bridgeVersion: 1, stateSchemaVersion: 1, allowedOrigins: [])
            try JSONEncoder().encode(module).write(to: directory.appendingPathComponent("manifest.json"))
            try Data("<html><head></head><body><script src='ready.js'></script></body></html>".utf8).write(to: directory.appendingPathComponent("index.html"))
            try Data("window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'runtime.ready',params:{}})".utf8).write(to: directory.appendingPathComponent("ready.js"))
        }
        let store = ModuleStore(root: root.appendingPathComponent("state"), config: HostConfiguration(catalogURL: ""), builtinRoot: builtin)
        let pages = ModulePageCache()
        defer { pages.reconcile(modules: [], blocked: []) }
        pages.reloadAll(store: store)
        XCTAssertEqual(pages.reloadMessages.count, 2)
        let loaded = expectation(description: "All unopened child apps finish loading")
        let subscription = pages.$reloadMessages.sink { messages in
            if messages.count == 2 && messages.values.allSatisfy({ $0.hasSuffix("本地资源重新加载成功") }) { loaded.fulfill() }
        }
        await fulfillment(of: [loaded], timeout: 15)
        subscription.cancel()
        let first = pages.page(for: store.modules[0], store: store)
        XCTAssertEqual(first.reloadMessage, "本地资源重新加载成功")
        XCTAssertFalse(first.isLoading)
        XCTAssertEqual(first.webView.scrollView.pinchGestureRecognizer?.isEnabled, false)
        let generation = first.generation
        store.blocked = [store.modules[1].id]
        pages.reloadAll(store: store)
        XCTAssertNotEqual(first.generation, generation)
        XCTAssertEqual(pages.reloadMessages[store.modules[1].id], "refresh-beta：刷新失败，当前版本已被停用，请更新后重试。")
        first.runtime.onFailure("服务器无法连接")
        XCTAssertEqual(pages.reloadMessages[store.modules[0].id], "refresh-alpha：本地资源重新加载失败：服务器无法连接")
        store.modules = []
        pages.reloadAll(store: store)
        XCTAssertEqual(pages.reloadMessage, "暂无已安装的应用。")
    }
    @MainActor func testReloadRecreatesWebViewAndClosesOldRuntime() throws {
        let module = Module(id: "reload-test", name: "Reload", version: "1.0.0", entry: "index.html", minHostVersion: "1.0.0", bridgeVersion: 1, stateSchemaVersion: 1, allowedOrigins: [])
        let page = ModulePage(module: module, directory: FileManager.default.temporaryDirectory, onReady: {}, onFailure: { _ in })
        let previous = page.webView
        let generation = page.generation
        page.reload()
        XCTAssertFalse(previous === page.webView)
        XCTAssertNil(previous?.navigationDelegate)
        XCTAssertNotEqual(generation, page.generation)
        XCTAssertNil(page.failure)
        page.close()
    }

    func testLLMReasoningEffortDefaultsAndRequests() throws {
        let defaultConfiguration = Data(#"{"provider":"openAi","baseURL":"https://api.kimi.com/coding/v1","model":"k3","token":""}"#.utf8)
        var config = try JSONDecoder().decode(LLMConfiguration.self, from: defaultConfiguration)
        XCTAssertNil(config.reasoningEffort)
        let params: [String: Any] = ["system": "test", "messages": [["role": "user", "content": "hello"]], "maxTokens": 512]
        func body(_ config: LLMConfiguration) throws -> [String: Any] {
            try XCTUnwrap(JSONSerialization.jsonObject(with: config.request(params).httpBody!) as? [String: Any])
        }
        XCTAssertNil(try body(config)["reasoning_effort"])
        for effort in ["none", "low", "high", "max"] {
            config.reasoningEffort = effort
            XCTAssertEqual(try body(config)["reasoning_effort"] as? String, effort)
            let restored = try JSONDecoder().decode(LLMConfiguration.self, from: JSONEncoder().encode(config))
            XCTAssertEqual(restored.reasoningEffort, effort)
        }
        config.provider = "anthropic"
        XCTAssertNil(try body(config)["reasoning_effort"])
        config.reasoningEffort = "invalid"
        XCTAssertThrowsError(try config.validate())
    }

    func testLLMUsageStreamSnapshotsAndMissingUsage() {
        var openAI = LLMUsageCollector(protocolName: "openAi")
        for line in ["data: {\"usage\":null}\n", "\n", "data: {\"usage\":{\"prompt_tokens\":42,\"completion_tokens\":12}}\n", "\n", "data: {\"usage\":{\"prompt_tokens\":42,\"completion_tokens\":12}}\n", "\n", "data: [DONE]\n", "\n"] {
            openAI.consumeLine(line)
        }
        XCTAssertEqual(openAI.inputTokens, 42)
        XCTAssertEqual(openAI.outputTokens, 12)
        var anthropic = LLMUsageCollector(protocolName: "anthropic")
        anthropic.consumeJSON(Data(#"{"type":"message_start","message":{"usage":{"input_tokens":10,"output_tokens":1,"cache_read_input_tokens":20,"cache_creation_input_tokens":5}}}"#.utf8))
        anthropic.consumeJSON(Data(#"{"type":"message_delta","usage":{"output_tokens":8}}"#.utf8))
        XCTAssertEqual(anthropic.inputTokens, 35)
        XCTAssertEqual(anthropic.outputTokens, 8)
        var missing = LLMUsageCollector(protocolName: "openAi")
        missing.consumeJSON(Data(#"{"choices":[]}"#.utf8))
        XCTAssertNil(missing.inputTokens)
        XCTAssertNil(missing.outputTokens)
    }

    @MainActor func testLLMUsageAttributionAndPersistence() throws {
        let suite = "usage-test." + UUID().uuidString
        let defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        let store = LLMUsageStore(defaults: defaults)
        var usage = LLMUsageCollector(protocolName: "openAi")
        usage.consumeJSON(Data(#"{"usage":{"prompt_tokens":30,"completion_tokens":7}}"#.utf8))
        store.begin(appID: "a", appName: "A", provider: "one.example")
        store.begin(appID: "a", appName: "A", provider: "two.example")
        store.begin(appID: "b", appName: "B", provider: "one.example")
        store.finish(appID: "a", provider: "one.example", usage: usage)
        store.finish(appID: "b", provider: "one.example", usage: usage)
        let restored = LLMUsageStore(defaults: defaults)
        XCTAssertEqual(restored.total.requests, 3)
        XCTAssertEqual(restored.total.inputTokens, 60)
        XCTAssertEqual(restored.total.outputTokens, 14)
        XCTAssertEqual(restored.total.reportedRequests, 2)
        XCTAssertEqual(restored.groups(byProvider: true).first?.totals.requests, 2)
        XCTAssertEqual(restored.groups(byProvider: false).first?.totals.requests, 2)
        XCTAssertEqual(restored.groups(byProvider: false, provider: "two.example").count, 1)
        XCTAssertEqual(LLMUsageStore.providerID(URL(string: "https://API.example:443/v1/messages")!), "api.example")
        XCTAssertEqual(LLMUsageStore.providerID(URL(string: "https://api.example:8443/v1")!), "api.example:8443")
    }

    @MainActor func testDailyTokenUsageAcrossDatesProvidersAndReload() throws {
        let suite = "daily-usage-test." + UUID().uuidString
        let defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        // Undated cumulative counters remain intact and are never assigned to today.
        let historical = LLMUsageRecord(appID: "a", appName: "A", provider: "one", totals: LLMUsageTotals(inputTokens: 100))
        defaults.set(try JSONEncoder().encode([historical]), forKey: "host.llm.usage")
        let store = LLMUsageStore(defaults: defaults)
        XCTAssertTrue(store.dailyRecords.isEmpty)
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 8 * 3600)!
        let day = calendar.date(from: DateComponents(year: 2026, month: 10, day: 6))!
        var usage = LLMUsageCollector(protocolName: "openAi")
        usage.consumeJSON(Data(#"{"usage":{"prompt_tokens":30,"completion_tokens":7}}"#.utf8))
        for provider in ["one", "two"] {
            store.begin(appID: "a", appName: "A", provider: provider)
            store.finish(appID: "a", provider: provider, usage: usage, date: day.addingTimeInterval(86399), calendar: calendar)
        }
        store.begin(appID: "b", appName: "B", provider: "one")
        store.finish(appID: "b", provider: "one", usage: usage, date: day, calendar: calendar)
        store.begin(appID: "a", appName: "A", provider: "one")
        store.finish(appID: "a", provider: "one", usage: usage, date: day.addingTimeInterval(86400), calendar: calendar)
        store.begin(appID: "b", appName: "B", provider: "one")
        store.finish(appID: "b", provider: "one", usage: LLMUsageCollector(protocolName: "openAi"), date: day, calendar: calendar)
        let restored = LLMUsageStore(defaults: defaults)
        XCTAssertEqual(restored.dailyRecords.count, 3)
        XCTAssertEqual(restored.dailyRecords.first { $0.appID == "a" && $0.day == day }?.tokens, 74)
        XCTAssertEqual(restored.dailyRecords.reduce(0) { $0 + $1.tokens }, 148)
        XCTAssertEqual(restored.total.tokens, 248)
        XCTAssertEqual(restored.groups(byProvider: false).reduce(0) { $0 + $1.totals.tokens }, 248)
        XCTAssertEqual(restored.groups(byProvider: true).reduce(0) { $0 + $1.totals.tokens }, 248)
    }

    func testLLMRequestTimeout() throws {
        let config = LLMConfiguration(provider: "openAi", baseURL: "https://model.example/v1/", model: "test", token: "test-secret")
        var params: [String: Any] = ["system": "", "messages": [["role": "user", "content": "hello"]], "maxTokens": 512, "timeoutSeconds": 600.0]
        XCTAssertEqual(try config.request(params).timeoutInterval, 600)
        for invalid: Any in [0.0, 601.0, -1.0, "600"] {
            params["timeoutSeconds"] = invalid
            XCTAssertThrowsError(try config.request(params))
        }
    }

    func testLLMRequestValidationAndProviderHeaders() throws {
        var config = LLMConfiguration(provider: "openAi", baseURL: "https://model.example/v1/", model: "test", token: "test-secret")
        let params: [String: Any] = ["system": "system prompt", "messages": [["role": "user", "content": "hello"]], "maxTokens": 512]
        let request = try config.request(params)
        XCTAssertEqual(request.url?.absoluteString, "https://model.example/v1/chat/completions")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer test-secret")
        var body = try XCTUnwrap(JSONSerialization.jsonObject(with: request.httpBody!) as? [String: Any])
        XCTAssertEqual((body["messages"] as? [[String: String]])?.first?["role"], "system")
        XCTAssertEqual((body["stream_options"] as? [String: Bool])?["include_usage"], true)
        config.provider = "anthropic"; config.baseURL = "https://model.example"
        let anthropic = try config.request(params)
        XCTAssertEqual(anthropic.url?.path, "/v1/messages")
        XCTAssertEqual(anthropic.value(forHTTPHeaderField: "x-api-key"), "test-secret")
        XCTAssertNil(anthropic.value(forHTTPHeaderField: "Authorization"))
        body = try XCTUnwrap(JSONSerialization.jsonObject(with: anthropic.httpBody!) as? [String: Any])
        XCTAssertEqual(body["system"] as? String, "system prompt")
        XCTAssertNil(body["stream_options"])
        XCTAssertEqual((body["messages"] as? [[String: String]])?.count, 1)
        for base in ["http://model.example", "https://user:pass@model.example", "https://model.example?token=x", "https://model.example/#fragment", "https://model.example/chat/completions"] {
            config.baseURL = base
            XCTAssertThrowsError(try config.request(params))
        }
        config.baseURL = "https://model.example"
        var invalid = params; invalid["messages"] = [["role": "system", "content": "override"]]
        XCTAssertThrowsError(try config.request(invalid))
        invalid = params; invalid["maxTokens"] = 0
        XCTAssertThrowsError(try config.request(invalid))
        config.token = "bad\r\nheader"
        XCTAssertThrowsError(try config.request(params))
    }
    func testHostModelConfigurationDefaultsAndRoundTrips() throws {
        let service = "llm-test." + UUID().uuidString
        defer { SecItemDelete([kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service] as CFDictionary) }
        let empty = try LLMStore.load(service: service)
        XCTAssertEqual(empty.model, "")
        XCTAssertEqual(empty.token, "")
        let configuration = LLMConfiguration(provider: "anthropic", baseURL: "https://model.example", model: "host-model", token: "test-secret", reasoningEffort: "high")
        try LLMStore.save(configuration, service: service)
        let restored = try LLMStore.load(service: service)
        XCTAssertEqual(restored.provider, configuration.provider)
        XCTAssertEqual(restored.baseURL, configuration.baseURL)
        XCTAssertEqual(restored.model, configuration.model)
        XCTAssertEqual(restored.token, configuration.token)
        XCTAssertEqual(restored.reasoningEffort, configuration.reasoningEffort)
    }
    @MainActor func testProcessTerminationDoesNotRejectVersionBeforeReady() {
        let module = Module(id: "termination-test", name: "Test", version: "1.0.0", entry: "index.html", minHostVersion: "1.0.0", bridgeVersion: 1, stateSchemaVersion: 1, allowedOrigins: [])
        var failures = 0
        var startupFailures = 0
        let runtime = Runtime(module: module, directory: FileManager.default.temporaryDirectory, onReady: {}, onFailure: { _ in failures += 1 }, onStartupFailure: { startupFailures += 1 })
        runtime.webViewWebContentProcessDidTerminate(WKWebView())
        XCTAssertEqual(failures, 1)
        XCTAssertEqual(startupFailures, 0)
    }
    @MainActor func testPagePreservesDOMAndJavaScriptAfterDetaching() async throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let module = Module(id: "state-test", name: "State", version: "1.0.0", entry: "index.html", minHostVersion: "1.0.0", bridgeVersion: 1, stateSchemaVersion: 1, allowedOrigins: [])
        try Data("<html><head></head><body><textarea id='draft'></textarea><dialog id='sheet'>Unsaved settings</dialog><script src='state.js'></script></body></html>".utf8).write(to: directory.appendingPathComponent("index.html"))
        try Data("window.state={tab:'grammar',result:'saved result'};window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'runtime.ready',params:{}});".utf8).write(to: directory.appendingPathComponent("state.js"))
        let ready = expectation(description: "page ready")
        let page = ModulePage(module: module, directory: directory, onReady: { ready.fulfill() }, onFailure: { XCTFail($0) })
        defer { page.close() }
        await fulfillment(of: [ready], timeout: 15)
        _ = try await page.webView.evaluateJavaScript("document.getElementById('draft').value='keep my sentence';document.getElementById('sheet').showModal()")
        page.detach()
        page.restorePosition()
        let restored = try await page.webView.evaluateJavaScript("({draft:document.getElementById('draft').value,tab:state.tab,result:state.result,sheet:document.getElementById('sheet').open})") as? [String: Any]
        XCTAssertEqual(restored?["draft"] as? String, "keep my sentence")
        XCTAssertEqual(restored?["tab"] as? String, "grammar")
        XCTAssertEqual(restored?["result"] as? String, "saved result")
        XCTAssertEqual(restored?["sheet"] as? Bool, true)
    }
    @MainActor func testCachedPageIsReusedAndInvalidatedOnUpgrade() throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let directory = root.appendingPathComponent("builtin/cache-test")
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }
        var module = Module(id: "cache-test", name: "Test", version: "1.0.0", entry: "index.html", minHostVersion: "1.0.0", bridgeVersion: 1, stateSchemaVersion: 1, allowedOrigins: [])
        try JSONEncoder().encode(module).write(to: directory.appendingPathComponent("manifest.json"))
        try Data("<html><head></head><body>cache test</body></html>".utf8).write(to: directory.appendingPathComponent("index.html"))
        let store = ModuleStore(root: root.appendingPathComponent("state"), config: HostConfiguration(catalogURL: ""), builtinRoot: root.appendingPathComponent("builtin"))
        let cache = ModulePageCache()
        defer { cache.reconcile(modules: [], blocked: []) }
        let first = cache.page(for: module, store: store)
        first.detach()
        XCTAssertTrue(cache.page(for: module, store: store) === first)
        first.runtime.webViewWebContentProcessDidTerminate(first.webView)
        XCTAssertNotNil(first.failure)
        XCTAssertFalse(store.blocked.contains(module.id))
        let retried = cache.page(for: module, store: store)
        XCTAssertFalse(retried === first)
        XCTAssertNil(retried.failure)
        module.version = "1.1.0"
        cache.reconcile(modules: [module], blocked: [])
        let upgraded = cache.page(for: module, store: store)
        XCTAssertFalse(upgraded === first)
        XCTAssertNil(first.webView.navigationDelegate)
        cache.reconcile(modules: [module], blocked: [module.id])
        XCTAssertNil(upgraded.webView.navigationDelegate)
    }
    @MainActor func testWebKitBridgeStreamsAndRestrictsOrigins() async throws {
        let module = Module(id: "runtime-test", name: "Test", version: "1.0.0", entry: "index.html", minHostVersion: "1.0.0", bridgeVersion: 1, stateSchemaVersion: 1, allowedOrigins: ["https://allowed.example", "https://model.example"])
        let suite = UUID().uuidString
        let networkDefaults = UserDefaults(suiteName: suite)!
        networkDefaults.set(["https://model.example"], forKey: "origins.runtime-test")
        defer { networkDefaults.removePersistentDomain(forName: suite) }
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let html = "<html><head></head><body><script src='test.js'></script></body></html>"
        try Data(html.utf8).write(to: directory.appendingPathComponent("index.html"))
        try Data("window.__testChunks=[];window.__lingroveChunk=(id,chunk)=>{window.__testChunks.push(chunk)};window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'runtime.ready',params:{}});".utf8).write(to: directory.appendingPathComponent("test.js"))
        let loaded = expectation(description: "JS host handshake")
        let networkConfig = URLSessionConfiguration.ephemeral; networkConfig.protocolClasses = [TTSStreamNetworkStub.self, StubNetwork.self]
        var ttsToken = "tts-native-secret"
        let runtime = Runtime(module: module, directory: directory, onReady: { loaded.fulfill() }, onFailure: { XCTFail($0) }, networkSession: URLSession(configuration: networkConfig), networkDefaults: networkDefaults, llmConfiguration: { LLMConfiguration(provider: "openAi", baseURL: "https://model.example/v1", model: "shared-test", token: "native-only-token") }, ttsConfiguration: { TTSConfiguration(token: ttsToken) })
        let config = WKWebViewConfiguration(); config.websiteDataStore = .nonPersistent()
        config.setURLSchemeHandler(runtime, forURLScheme: "lingrove")
        config.userContentController.addScriptMessageHandler(runtime, contentWorld: .page, name: "lingrove")
        let webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 390, height: 844), configuration: config)
        runtime.webView = webView; webView.navigationDelegate = runtime
        webView.load(URLRequest(url: URL(string: "lingrove://runtime-test/index.html")!))
        await fulfillment(of: [loaded], timeout: 15)
        defer { runtime.close(); config.userContentController.removeScriptMessageHandler(forName: "lingrove", contentWorld: .page) }
        let result = try await webView.callAsyncJavaScript("const r=await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'http.request',params:{id:'stream-1',url:'https://allowed.example/test',stream:true}});return {status:r.status,chunks:window.__testChunks.join('')};", arguments: [:], in: nil, contentWorld: .page) as? [String: Any]
        XCTAssertEqual(result?["status"] as? Int, 200)
        XCTAssertEqual(result?["chunks"] as? String, "data: {\"text\":\"你好\"}\n\ndata: [DONE]\n\n")
        let denied = try await webView.callAsyncJavaScript("try{await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'http.request',params:{id:'denied',url:'https://allowed.example.evil.test'}});return false;}catch(e){return true;}", arguments: [:], in: nil, contentWorld: .page)
        XCTAssertEqual(denied as? Bool, true)
        let authorized = try await webView.callAsyncJavaScript("return await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'network.authorize',params:{origin:'https://model.example'}});", arguments: [:], in: nil, contentWorld: .page)
        XCTAssertEqual(authorized as? Bool, true)
        let direct = try await webView.callAsyncJavaScript("return await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'http.request',params:{id:'direct-model',url:'https://model.example/public'}});", arguments: [:], in: nil, contentWorld: .page) as? [String: Any]
        XCTAssertEqual(direct?["status"] as? Int, 200)
        XCTAssertEqual(networkDefaults.stringArray(forKey: "origins.runtime-test"), ["https://model.example"])
        let llm = try await webView.callAsyncJavaScript("const status=await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'llm.status',params:{}});const r=await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'llm.request',params:{id:'llm-test',system:'Test',messages:[{role:'user',content:'hello'}],maxTokens:32,url:'https://evil.example',headers:{Authorization:'evil'},model:'override'}});return {status,result:r};", arguments: [:], in: nil, contentWorld: .page) as? [String: Any]
        let status = llm?["status"] as? [String: Any]
        XCTAssertEqual(status?["configured"] as? Bool, true)
        XCTAssertEqual(status?["model"] as? String, "shared-test")
        XCTAssertNil(status?["token"])
        XCTAssertEqual((llm?["result"] as? [String: Any])?["model"] as? String, "shared-test")
        XCTAssertFalse(String(describing: llm).contains("native-only-token"))
        let tts = try await webView.callAsyncJavaScript("const status=await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'tts.status',params:{}});const result=await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'tts.synthesize',params:{id:'tts-test',text:'こんにちは',url:'https://evil.example',token:'evil',model:'evil'}});return {status,result};", arguments: [:], in: nil, contentWorld: .page) as? [String: Any]
        XCTAssertEqual((tts?["status"] as? [String: Any])?["configured"] as? Bool, true)
        XCTAssertNil((tts?["status"] as? [String: Any])?["token"])
        XCTAssertEqual((tts?["result"] as? [String: Any])?["audioBase64"] as? String, "SUQzAQI=")
        XCTAssertEqual((tts?["result"] as? [String: Any])?["model"] as? String, "speech-2.8-hd")
        XCTAssertFalse(String(describing: tts).contains("tts-native-secret"))
        ttsToken = "tts-stream-fast"
        let playback = try await webView.callAsyncJavaScript("const bridge=window.webkit.messageHandlers.lingrove;const states=[];window.__lingroveChunk=(id,chunk)=>states.push(JSON.parse(chunk).state);const p=bridge.postMessage({version:1,method:'tts.play',params:{id:'tts-play',text:'test'}});await bridge.postMessage({version:1,method:'tts.pause',params:{id:'tts-play'}});await bridge.postMessage({version:1,method:'tts.resume',params:{id:'tts-play'}});const result=await p;return {states,result};", arguments: [:], in: nil, contentWorld: .page) as? [String: Any]
        XCTAssertTrue((playback?["states"] as? [String])?.contains("paused") == true)
        XCTAssertTrue((playback?["states"] as? [String])?.contains("playing") == true)
        XCTAssertEqual((playback?["states"] as? [String])?.last, "ended")
        XCTAssertEqual((playback?["result"] as? [String: Any])?["provider"] as? String, "minimax")
        let stopped = try await webView.callAsyncJavaScript("const bridge=window.webkit.messageHandlers.lingrove;const p=bridge.postMessage({version:1,method:'tts.play',params:{id:'tts-stop',text:'test'}}).then(()=>false,()=>true);await bridge.postMessage({version:1,method:'tts.stop',params:{id:'tts-stop'}});return await p;", arguments: [:], in: nil, contentWorld: .page)
        XCTAssertEqual(stopped as? Bool, true)
        let state = try await webView.callAsyncJavaScript("await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'state.set',params:{key:'check',value:'{\"ok\":true}'}});return await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'state.get',params:{key:'check'}});", arguments: [:], in: nil, contentWorld: .page)
        XCTAssertEqual(state as? String, "{\"ok\":true}")
    }
}


final class TTSNetworkStub: URLProtocol, @unchecked Sendable {
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        XCTAssertTrue(["Bearer tts-native-secret", "Bearer denied"].contains(request.value(forHTTPHeaderField: "Authorization") ?? ""))
        let code = request.value(forHTTPHeaderField: "Authorization") == "Bearer denied" ? 401 : 200
        let response = HTTPURLResponse(url: request.url!, statusCode: code, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Data(#"{"base_resp":{"status_code":0},"data":{"status":2,"audio":"4944330102"}}"#.utf8))
        client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}

final class TTSTests: XCTestCase {
    func testSavingConfigurationWithoutKeyDoesNotEnableSynthesis() throws {
        let configuration = TTSConfiguration()
        XCTAssertNoThrow(try configuration.validate(requiresToken: false))
        XCTAssertThrowsError(try configuration.request(["text": "hello"]))
    }

    func testPreviewSamplesCoverEverySupportedLanguage() {
        for provider in TTSProvider.allCases {
            for model in provider.models {
                for language in provider.languages(for: model) {
                    XCTAssertNotNil(TTSPreviewSamples.texts[language], "Missing preview for \(language)")
                    XCTAssertFalse(TTSPreviewSamples.text(for: language).isEmpty)
                }
            }
        }
        XCTAssertEqual(TTSPreviewSamples.text(for: "", appLanguage: "zh-Hans"), TTSPreviewSamples.texts["zh"])
        XCTAssertEqual(TTSPreviewSamples.text(for: "", appLanguage: "en"), TTSPreviewSamples.texts["en"])
        XCTAssertEqual(TTSPreviewSamples.text(for: "ja", appLanguage: "zh-Hans"), TTSPreviewSamples.texts["ja"])
    }

    func config(_ provider: TTSProvider = .minimax) -> TTSConfiguration {
        var value = TTSConfiguration.defaults(for: provider); value.token = "tts-native-secret"; return value
    }
    func testLanguageVoiceRoutingAndPersistence() throws {
        for provider in TTSProvider.allCases {
            var value = config(provider)
            value.languageVoices = ["ja": "japanese-test", "zh": "chinese-test", "en": "english-test"]
            let restored = try JSONDecoder().decode(TTSConfiguration.self, from: JSONEncoder().encode(value))
            XCTAssertEqual(restored.languageVoices, value.languageVoices)
            for (language, expected) in [("ja-JP", "japanese-test"), ("ZH-Hans-CN", "chinese-test"), ("en-US", "english-test"), ("fr", value.voice)] {
                for streaming in [false, true] {
                    let request = try restored.request(["text": "hello", "language": language], streaming: streaming)
                    let body = try XCTUnwrap(JSONSerialization.jsonObject(with: request.httpBody!) as? [String: Any])
                    let selected = provider == .minimax ? (body["voice_setting"] as? [String: Any])?["voice_id"] : body["voice"]
                    XCTAssertEqual(selected as? String, expected)
                }
            }
            let override = try XCTUnwrap(provider.voices(for: value.model).first).id
            let overridden = try value.request(["text": "hello", "language": "ja", "voice": override])
            let overrideBody = try XCTUnwrap(JSONSerialization.jsonObject(with: overridden.httpBody!) as? [String: Any])
            let actual = provider == .minimax ? (overrideBody["voice_setting"] as? [String: Any])?["voice_id"] : overrideBody["voice"]
            XCTAssertEqual(actual as? String, override)
            XCTAssertEqual(value.languageVoices?["ja"], "japanese-test")
            XCTAssertThrowsError(try value.request(["text": "hello", "voice": "untrusted"]))
            XCTAssertEqual(value.voice(for: nil), value.voice)
            for language: Any in [true, 1, "", "日语", "en/US", String(repeating: "a", count: 64)] {
                XCTAssertThrowsError(try value.request(["text": "hello", "language": language]))
            }
            value.languageVoices = nil
            XCTAssertEqual(value.voice(for: "ja"), value.voice)
        }
        var value = config(.openAICompatible)
        value.voice = "cedar"
        value.languageVoices = ["ja": "marin", "en": "echo"]
        value.selectModel("tts-1")
        XCTAssertEqual(value.voice, "coral")
        XCTAssertNil(value.languageVoices?["ja"])
        XCTAssertEqual(value.languageVoices?["en"], "echo")
    }

    func testConfiguredLanguagesAndRouting() throws {
        for provider in TTSProvider.allCases {
            for model in provider.models {
                XCTAssertEqual(provider.languages(for: model), ["zh", "en", "ja", "ru", "el"])
                for language in provider.languages(for: model) {
                    XCTAssertFalse(provider.voiceOptions(for: model, language: language).isEmpty)
                }
            }
            var value = config(provider)
            value.languageVoices = ["ru": "russian-test", "el": "greek-test", "fr": "french-test"]
            XCTAssertEqual(value.voice(for: "ru-RU"), "russian-test")
            XCTAssertEqual(value.voice(for: "el-GR"), "greek-test")
            XCTAssertEqual(value.voice(for: "fr-FR"), value.voice)
            XCTAssertEqual(value.languageVoices?["fr"], "french-test")
        }
    }

    func testProviderModelAndVoiceOptions() {
        for provider in TTSProvider.allCases {
            XCTAssertTrue(provider.models.contains(provider.defaultModel))
            for model in provider.models {
                let voices = provider.voices(for: model)
                XCTAssertTrue(voices.contains { $0.id == provider.defaultVoice })
                XCTAssertEqual(Set(voices.map(\.id)).count, voices.count)
            }
        }
        XCTAssertFalse(TTSProvider.openAICompatible.voices(for: "tts-1").contains { $0.id == "cedar" })
        XCTAssertTrue(TTSProvider.openAICompatible.voices(for: "gpt-4o-mini-tts").contains { $0.id == "cedar" })
    }
    func testProviderRequestsAndInputValidation() throws {
        for provider in TTSProvider.allCases {
            let value = config(provider)
            let request = try value.request(["text": "こんにちは", "speed": 0.8, "model": "evil", "url": "https://evil.example", "token": "evil"])
            XCTAssertEqual(request.url?.path, provider == .minimax ? "/v1/t2a_v2" : "/v1/audio/speech")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer tts-native-secret")
            let body = try XCTUnwrap(JSONSerialization.jsonObject(with: request.httpBody!) as? [String: Any])
            XCTAssertEqual(body["model"] as? String, provider.defaultModel)
            if provider == .minimax {
                XCTAssertEqual(body["text"] as? String, "こんにちは")
                XCTAssertEqual((body["voice_setting"] as? [String: Any])?["speed"] as? Double, 0.8)
                XCTAssertEqual(body["output_format"] as? String, "hex")
            } else { XCTAssertEqual(body["input"] as? String, "こんにちは") }
            for params: [String: Any] in [["text": " "], ["text": String(repeating: "あ", count: 4001)], ["text": "test", "speed": true], ["text": "test", "speed": "fast"], ["text": "test", "speed": 3]] {
                XCTAssertThrowsError(try value.request(params))
            }
            XCTAssertEqual(request.url?.host, provider == .minimax ? "api.minimax.cn" : "api.openai.com")
            let encoded = try JSONEncoder().encode(value)
            let saved = try XCTUnwrap(JSONSerialization.jsonObject(with: encoded) as? [String: Any])
            XCTAssertNil(saved["baseURL"])
            XCTAssertEqual(try JSONDecoder().decode(TTSConfiguration.self, from: encoded).endpoint(), value.endpoint())
        }
        XCTAssertThrowsError(try TTSConfiguration().validate())
    }
    func testAudioDecodingAndProviderErrors() throws {
        let valid = Data(#"{"base_resp":{"status_code":0},"data":{"status":2,"audio":"4944330102"}}"#.utf8)
        let audio = try TTSService.decode(valid, configuration: config())
        XCTAssertEqual(audio.data, Data([0x49, 0x44, 0x33, 1, 2]))
        XCTAssertFalse(String(describing: audio.bridgeResult).contains("tts-native-secret"))
        for json in [#"{"base_resp":{"status_code":1008,"status_msg":"secret"}}"#, #"{"base_resp":{"status_code":0},"data":{"status":1,"audio":"494433"}}"#, #"{"base_resp":{"status_code":0},"data":{"status":2,"audio":"494433z0"}}"#, #"{"base_resp":{"status_code":0},"data":{"status":2,"audio":"49443"}}"#, #"{"base_resp":{"status_code":0},"data":{"status":2,"audio":""}}"#] {
            XCTAssertThrowsError(try TTSService.decode(Data(json.utf8), configuration: config()))
        }
        XCTAssertThrowsError(try TTSService.decode(Data("{\"error\":\"bad\"}".utf8), configuration: config(.openAICompatible)))
        XCTAssertEqual(try TTSService.decode(audio.data, configuration: config(.openAICompatible)).data, audio.data)
    }
    func testSynthesisAndHTTPFailure() async throws {
        let settings = URLSessionConfiguration.ephemeral; settings.protocolClasses = [TTSNetworkStub.self]
        let session = URLSession(configuration: settings)
        defer { session.invalidateAndCancel() }
        let audio = try await TTSService.synthesize(["text": "test"], configuration: config(), session: session)
        XCTAssertEqual(audio.data.count, 5)
        var denied = config(); denied.token = "denied"
        do { _ = try await TTSService.synthesize(["text": "test"], configuration: denied, session: session); XCTFail("Expected HTTP failure") }
        catch { XCTAssertTrue(error.localizedDescription.contains("朗读失败")) }
    }
    func testKeychainRoundTrip() throws {
        let service = "tts-test-" + UUID().uuidString
        defer { SecItemDelete([kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service] as CFDictionary) }
        XCTAssertEqual(try TTSStore.load(service: service).token, "")
        try TTSStore.save(config(), service: service)
        XCTAssertEqual(try TTSStore.load(service: service).token, "tts-native-secret")
        var updated = config(.openAICompatible); updated.token = ""
        try TTSStore.save(updated, service: service)
        XCTAssertEqual(try TTSStore.load(service: service).provider, .openAICompatible)
        XCTAssertEqual(try TTSStore.load(service: service).token, "")
    }
}

final class TTSStreamNetworkStub: URLProtocol, @unchecked Sendable {
    private var completion: DispatchWorkItem?
    private static let lock = NSLock()
    private static var ended = false
    static var responseEnded: Bool { lock.lock(); defer { lock.unlock() }; return ended }
    private static func setEnded(_ value: Bool) { lock.lock(); ended = value; lock.unlock() }
    override class func canInit(with request: URLRequest) -> Bool { request.value(forHTTPHeaderField: "Authorization")?.hasPrefix("Bearer tts-stream-") == true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        Self.setEnded(false)
        let pcm = request.url?.host == "api.openai.com"
        let contentType = pcm ? "audio/pcm" : "text/event-stream"
        let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": contentType])!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        if request.value(forHTTPHeaderField: "Authorization") == "Bearer tts-stream-jitter" {
            // A tiny first burst should be held until enough audio has arrived.
            self.client?.urlProtocol(self, didLoad: Data(repeating: 0, count: 4800))
            let work = DispatchWorkItem { [weak self] in
                guard let self else { return }
                self.client?.urlProtocol(self, didLoad: Data(repeating: 0, count: 43200))
                Self.setEnded(true)
                self.client?.urlProtocolDidFinishLoading(self)
            }
            completion = work
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15, execute: work)
            return
        }
        // Half a second of silence. An initial odd-byte packet tests sample alignment.
        let data = pcm ? Data(repeating: 0, count: 24000) : Data(("data: {\"base_resp\":{\"status_code\":0},\"data\":{\"status\":1,\"audio\":\"" + String(repeating: "0000", count: 12000) + "\"}}\r\n\r\n").utf8)
        client?.urlProtocol(self, didLoad: Data(data.prefix(13)))
        client?.urlProtocol(self, didLoad: Data(data.dropFirst(13)))
        let work = DispatchWorkItem { [weak self] in
            guard let self else { return }
            Self.setEnded(true)
            if !pcm && self.request.value(forHTTPHeaderField: "Authorization") != "Bearer tts-stream-truncated" {
                // This aggregate must not be scheduled a second time.
                self.client?.urlProtocol(self, didLoad: Data("data: {\"base_resp\":{\"status_code\":0},\"data\":{\"status\":2,\"audio\":\"00000000\"}}\n\n".utf8))
            }
            self.client?.urlProtocolDidFinishLoading(self)
        }
        completion = work
        DispatchQueue.main.asyncAfter(deadline: .now() + (request.value(forHTTPHeaderField: "Authorization") == "Bearer tts-stream-fast" ? 0.05 : 1.0), execute: work)
    }
    override func stopLoading() { completion?.cancel() }
}

extension TTSTests {
    func streamingSession() -> URLSession {
        let settings = URLSessionConfiguration.ephemeral; settings.protocolClasses = [TTSStreamNetworkStub.self]
        return URLSession(configuration: settings)
    }
    func streamConfig(_ path: String = "normal", provider: TTSProvider = .minimax) -> TTSConfiguration {
        var value = config(provider); value.token = "tts-stream-" + path; return value
    }
    func testStreamingRequestsUsePCMAndExcludeAggregate() throws {
        for provider in TTSProvider.allCases {
            let request = try config(provider).request(["text": "hello"], streaming: true)
            let body = try XCTUnwrap(JSONSerialization.jsonObject(with: request.httpBody!) as? [String: Any])
            if provider == .minimax {
                XCTAssertEqual(body["stream"] as? Bool, true)
                XCTAssertEqual((body["stream_options"] as? [String: Bool])?["exclude_aggregated_audio"], true)
                XCTAssertEqual((body["audio_setting"] as? [String: Any])?["format"] as? String, "pcm")
                XCTAssertEqual((body["audio_setting"] as? [String: Any])?["sample_rate"] as? Int, 24000)
            } else { XCTAssertEqual(body["response_format"] as? String, "pcm") }
        }
    }
    func testMiniMaxStreamingParserFragmentsErrorsAndAggregate() throws {
        var parser = MiniMaxPCMStream()
        let event = "data: {\"base_resp\":{\"status_code\":0},\"data\":{\"status\":1,\"audio\":\"01020304\"}}\r\n\r\n"
        var received = Data()
        for byte in event.utf8 { for data in try parser.feed(Data([byte])) { received.append(data) } }
        XCTAssertEqual(received, Data([1, 2, 3, 4]))
        let final = "data: {\"base_resp\":{\"status_code\":0},\"data\":{\"status\":2,\"audio\":\"01020304\"}}\n\n"
        XCTAssertTrue(try parser.feed(Data(final.utf8)).isEmpty)
        XCTAssertTrue(try parser.finish().isEmpty)
        var truncated = MiniMaxPCMStream()
        _ = try truncated.feed(Data(event.utf8))
        XCTAssertThrowsError(try truncated.finish())
        for event in ["data: {\"base_resp\":{\"status_code\":1008}}\n\n", "data: [DONE]\n\n", "data: {bad}\n\n"] {
            var invalid = MiniMaxPCMStream()
            XCTAssertThrowsError(try invalid.feed(Data(event.utf8)))
        }
        var frames = TTSPCMFrames()
        XCTAssertEqual(try frames.append(Data([1])), Data())
        XCTAssertEqual(try frames.append(Data([2, 3, 4])), Data([1, 2, 3, 4]))
        XCTAssertNoThrow(try frames.finish())
        _ = try frames.append(Data([5]))
        XCTAssertThrowsError(try frames.finish())
    }
    func testPCMIsDeliveredBeforeHTTPResponseEndsForBothProviders() async throws {
        let session = streamingSession(); defer { session.invalidateAndCancel() }
        for provider in TTSProvider.allCases {
            var count = 0
            try await TTSService.streamPCM(["text": "test"], configuration: streamConfig(provider == .minimax ? "normal" : "raw", provider: provider), session: session) { data in
                XCTAssertFalse(TTSStreamNetworkStub.responseEnded)
                count += data.count
            }
            XCTAssertEqual(count, 24000)
        }
    }
    func testTruncatedStreamFailsAfterPartialAudio() async throws {
        let session = streamingSession(); defer { session.invalidateAndCancel() }
        var count = 0
        do {
            try await TTSService.streamPCM(["text": "test"], configuration: streamConfig("truncated"), session: session) { count += $0.count }
            XCTFail("A disconnected stream must fail")
        } catch { XCTAssertTrue(error.localizedDescription.contains("中断")) }
        XCTAssertEqual(count, 24000)
    }
    @MainActor func testNativeStreamingPlaybackPauseResumeAndStop() async throws {
        let session = streamingSession(); defer { session.invalidateAndCancel() }
        let playing = expectation(description: "Plays before response ends")
        var states: [TTSPlaybackState] = []
        let player = TTSPlayback { state in
            if state == .playing, !states.contains(.playing) {
                XCTAssertFalse(TTSStreamNetworkStub.responseEnded)
                playing.fulfill()
            }
            states.append(state)
        }
        let task = Task { try await player.run(["text": "test"], configuration: streamConfig(), session: session) }
        await fulfillment(of: [playing], timeout: 5)
        player.pause(); XCTAssertEqual(player.state, .paused)
        player.resume(); XCTAssertEqual(player.state, .playing)
        player.stop()
        do { try await task.value; XCTFail("Stop should cancel playback") } catch { XCTAssertTrue(error is CancellationError) }
        XCTAssertEqual(states.last, .stopped)
        XCTAssertFalse(states.contains(.ended))
    }
    @MainActor func testNativePlaybackWaitsForAudioDrain() async throws {
        let session = streamingSession(); defer { session.invalidateAndCancel() }
        var states: [TTSPlaybackState] = []
        let player = TTSPlayback { states.append($0) }
        let start = Date()
        try await player.run(["text": "test"], configuration: streamConfig("fast"), session: session)
        XCTAssertGreaterThanOrEqual(Date().timeIntervalSince(start), 0.45)
        XCTAssertTrue(states.contains(.playing))
        XCTAssertEqual(states.last, .ended)
    }
}

extension TTSTests {
    @MainActor func testSmallAudioBurstsAreBufferedBeforePlayback() async throws {
        let session = streamingSession(); defer { session.invalidateAndCancel() }
        var states: [TTSPlaybackState] = []
        let start = Date()
        let player = TTSPlayback { state in
            if state == .playing { XCTAssertGreaterThanOrEqual(Date().timeIntervalSince(start), 0.1) }
            states.append(state)
        }
        try await player.run(["text": "test"], configuration: streamConfig("jitter", provider: .openAICompatible), session: session)
        XCTAssertEqual(states.filter { $0 == .buffering }.count, 1)
        XCTAssertEqual(states.last, .ended)
    }
    @MainActor func testPreparedShortAudioFlushesWithoutAnotherNetworkRequest() async throws {
        var states: [TTSPlaybackState] = []
        let audio = Task<Data, Error> { Data(repeating: 0, count: 960) }
        let player = TTSPlayback { states.append($0) }
        try await player.run(["text": "test"], configuration: config(), prepared: audio)
        XCTAssertEqual(states, [.buffering, .playing, .ended])
    }
    func testPrefetchIdentityIncludesVoiceAndUsesStableRequestBodies() throws {
        let value = config()
        let first = try value.request(["text": "next", "language": "ja", "id": "one"], streaming: true)
        let same = try value.request(["language": "ja", "text": "next", "id": "two", "nextText": "later"], streaming: true)
        XCTAssertEqual(TTSRequestIdentity(first), TTSRequestIdentity(same))
        let otherVoice = try XCTUnwrap(value.provider.voices(for: value.model).first { $0.id != value.voice }).id
        XCTAssertNotEqual(TTSRequestIdentity(first), TTSRequestIdentity(try value.request(["text": "next", "language": "ja", "voice": otherVoice], streaming: true)))
    }
}

extension TTSTests {
    @MainActor func testStoppingWhileWaitingForPrefetchCancelsTheDownload() async throws {
        let cancelled = expectation(description: "Prepared audio cancelled")
        let prepared = Task<Data, Error> {
            do {
                try await Task.sleep(nanoseconds: 30_000_000_000)
                return Data(repeating: 0, count: 960)
            } catch { cancelled.fulfill(); throw error }
        }
        let player = TTSPlayback()
        let run = Task { try await player.run(["text": "test"], configuration: config(), prepared: prepared) }
        await Task.yield()
        player.stop()
        await fulfillment(of: [cancelled], timeout: 3)
        do { try await run.value; XCTFail("Stopped playback must fail") } catch { XCTAssertTrue(error is CancellationError) }
    }
}
