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
        XCTAssertEqual(pages.reloadMessage, "暂无已安装的子应用。")
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

    func testLLMRequestValidationAndProviderHeaders() throws {
        var config = LLMConfiguration(provider: "openAi", baseURL: "https://model.example/v1/", model: "test", token: "test-secret")
        let params: [String: Any] = ["system": "system prompt", "messages": [["role": "user", "content": "hello"]], "maxTokens": 512]
        let request = try config.request(params)
        XCTAssertEqual(request.url?.absoluteString, "https://model.example/v1/chat/completions")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer test-secret")
        var body = try XCTUnwrap(JSONSerialization.jsonObject(with: request.httpBody!) as? [String: Any])
        XCTAssertEqual((body["messages"] as? [[String: String]])?.first?["role"], "system")
        config.provider = "anthropic"; config.baseURL = "https://model.example"
        let anthropic = try config.request(params)
        XCTAssertEqual(anthropic.url?.path, "/v1/messages")
        XCTAssertEqual(anthropic.value(forHTTPHeaderField: "x-api-key"), "test-secret")
        XCTAssertNil(anthropic.value(forHTTPHeaderField: "Authorization"))
        body = try XCTUnwrap(JSONSerialization.jsonObject(with: anthropic.httpBody!) as? [String: Any])
        XCTAssertEqual(body["system"] as? String, "system prompt")
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
        let networkConfig = URLSessionConfiguration.ephemeral; networkConfig.protocolClasses = [StubNetwork.self]
        let runtime = Runtime(module: module, directory: directory, onReady: { loaded.fulfill() }, onFailure: { XCTFail($0) }, networkSession: URLSession(configuration: networkConfig), networkDefaults: networkDefaults, llmConfiguration: { LLMConfiguration(provider: "openAi", baseURL: "https://model.example/v1", model: "shared-test", token: "native-only-token") })
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
        let state = try await webView.callAsyncJavaScript("await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'state.set',params:{key:'check',value:'{\"ok\":true}'}});return await window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'state.get',params:{key:'check'}});", arguments: [:], in: nil, contentWorld: .page)
        XCTAssertEqual(state as? String, "{\"ok\":true}")
    }
}
