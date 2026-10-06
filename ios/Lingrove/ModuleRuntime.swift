import SwiftUI
import WebKit
import CryptoKit

enum AppLanguage {
    static func text(_ source: String) -> String {
        guard let path = Bundle.main.path(forResource: current, ofType: "lproj"),
              let bundle = Bundle(path: path) else { return source }
        return bundle.localizedString(forKey: source, value: source, table: nil)
    }

    static func resolve(_ language: String) -> String {
        let code = language.lowercased().replacingOccurrences(of: "_", with: "-")
        if code == "zh" || code.hasPrefix("zh-") {
            return "zh-Hans"
        }
        return code == "ja" || code.hasPrefix("ja-") ? "ja" : "en"
    }

    static let preferenceKey = "app.language"
    static var current: String {
        let selected = UserDefaults.standard.string(forKey: preferenceKey) ?? "system"
        return resolve(selected == "system" ? (Locale.preferredLanguages.first ?? "en") : selected)
    }
}

@MainActor final class ModulePageCache: ObservableObject {
    private var pages: [String: ModulePage] = [:]
    @Published var reloadMessages: [String: String] = [:]
    var isReloading: Bool { pages.values.contains { $0.isReloading } }
    var reloadMessage: String? {
        reloadMessages.isEmpty ? nil : reloadMessages.keys.sorted().compactMap { reloadMessages[$0] }.joined(separator: "\n")
    }

    func page(for module: Module, store: ModuleStore, refreshing: Bool = false) -> ModulePage {
        if let page = pages[module.id], page.matches(module), page.failure == nil,
           page.directory == store.directory(for: module) {
            if refreshing { page.reload() }
            return page
        }
        pages.removeValue(forKey: module.id)?.close()
        let page = ModulePage(module: module, directory: store.directory(for: module),
                              onReady: { [weak store] in store?.markHealthy(module) },
                              onFailure: { [weak store] _ in store?.clearLaunchMarker(module) },
                              onStartupFailure: { [weak store] in store?.rollback(module) },
                              onReloadResult: { [weak self] message in self?.reloadMessages[module.id] = "\(module.name)：\(message)" },
                              refreshing: refreshing)
        pages[module.id] = page
        return page
    }

    func updateLanguage() {
        for page in pages.values {
            page.webView.callAsyncJavaScript(
                "window.dispatchEvent(new CustomEvent('lingrove:languagechange', { detail: { language } }))",
                arguments: ["language": AppLanguage.current], in: nil, in: .page,
                completionHandler: nil)
        }
    }

    func reloadAll(store: ModuleStore) {
        reloadMessages.removeAll()
        reconcile(modules: store.modules, blocked: store.blocked)
        if DebugServer.enabled && store.modules.isEmpty {
            reloadMessages["empty"] = "暂无已安装的应用。"
        }
        for module in store.modules {
            guard !store.blocked.contains(module.id) else {
                if DebugServer.enabled { reloadMessages[module.id] = "\(module.name)：刷新失败，当前版本已被停用，请更新后重试。" }
                continue
            }
            _ = page(for: module, store: store, refreshing: true)
        }
    }

    func reconcile(modules: [Module], blocked: Set<String>) {
        for id in Array(pages.keys) {
            guard let page = pages[id] else { continue }
            if blocked.contains(id) || !modules.contains(where: { page.matches($0) }) {
                pages.removeValue(forKey: id)?.close()
            }
        }
    }
}

@MainActor final class ModulePage: ObservableObject {
    let module: Module
    let directory: URL
    @Published private(set) var failure: String?
    @Published private(set) var isLoading = true
    @Published private(set) var isRootPage = true
    private(set) var runtime: Runtime!
    private(set) var webView: WKWebView!
    private var offset: CGPoint?
    @Published private(set) var generation = UUID()
    @Published var reloadMessage: String?
    private var awaitingReloadResult = false
    var isReloading: Bool { awaitingReloadResult }
    private let onReloadResult: (String) -> Void

    private func reportReload(_ message: String) {
        guard DebugServer.enabled else { return }
        reloadMessage = message
        onReloadResult(message)
    }
    private func finishReload(_ message: String) {
        guard awaitingReloadResult else { return }
        awaitingReloadResult = false
        reportReload(message)
    }
    private var onReady: () -> Void
    private var onFailure: (String) -> Void
    private var onStartupFailure: () -> Void

    init(module: Module, directory: URL, onReady: @escaping () -> Void, onFailure: @escaping (String) -> Void, onStartupFailure: @escaping () -> Void = {}, onReloadResult: @escaping (String) -> Void = { _ in }, refreshing: Bool = false) {
        self.onReloadResult = onReloadResult
        self.module = module
        self.directory = directory
        self.onReady = onReady
        self.onFailure = onFailure
        self.onStartupFailure = onStartupFailure
        awaitingReloadResult = refreshing
        if refreshing { reportReload("正在刷新…") }
        load()
    }

    func reload() {
        close()
        failure = nil
        isLoading = true
        isRootPage = true
        offset = nil
        awaitingReloadResult = true
        reportReload("正在刷新…")
        generation = UUID()
        load()
    }

    private func load(usingLocalFallback: Bool = false) {
        let remote = usingLocalFallback ? nil : DebugServer.entryURL(for: module)
        let loadGeneration = generation
        runtime = Runtime(module: module, directory: directory,
                          onReady: { [weak self] in
                              guard let self, self.generation == loadGeneration else { return }
                              self.isLoading = false
                              self.finishReload(usingLocalFallback ? "服务器不可用，已加载本地资源" : (remote == nil ? "本地资源重新加载成功" : "服务器资源刷新成功"))
                              if remote == nil { self.onReady() }
                          },
                          onFailure: { [weak self] message in
                              guard let self, self.generation == loadGeneration else { return }
                              if remote != nil {
                                  self.close()
                                  self.isLoading = true
                                  self.isRootPage = true
                                  self.offset = nil
                                  self.generation = UUID()
                                  self.load(usingLocalFallback: true)
                                  return
                              }
                              self.failure = message
                              self.isLoading = false
                              self.finishReload((remote == nil ? "本地资源重新加载失败：" : "服务器资源刷新失败：") + message)
                              if remote == nil { self.onFailure(message) }
                          },
                          onStartupFailure: { [weak self] in if remote == nil { self?.onStartupFailure() } },
                          debugEntryURL: remote, onReload: { [weak self] in self?.reload() },
                          onNavigation: { [weak self] isRoot in
                              guard let self, self.generation == loadGeneration else { return }
                              self.isRootPage = isRoot
                          })
        configureWebView(remote: remote)
    }

    private func configureWebView(remote: URL?) {

        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.ignoresViewportScaleLimits = false
        configuration.userContentController.addUserScript(WKUserScript(source: """
            for (const name of ['gesturestart', 'gesturechange', 'gestureend']) {
                document.addEventListener(name, event => event.preventDefault(), { passive: false, capture: true });
            }
            for (const name of ['touchstart', 'touchmove']) {
                document.addEventListener(name, event => {
                    if (event.touches.length > 1) event.preventDefault();
                }, { passive: false, capture: true });
            }
            """, injectionTime: .atDocumentStart, forMainFrameOnly: false))
        configuration.userContentController.addUserScript(WKUserScript(source: """
            (() => {
            let viewport = document.querySelector('meta[name="viewport"]');
            if (!viewport) {
                viewport = document.createElement('meta');
                viewport.name = 'viewport';
                viewport.content = 'width=device-width,initial-scale=1';
                document.head.appendChild(viewport);
            }
            const rules = viewport.content.split(',').filter(rule =>
                !['minimum-scale', 'maximum-scale', 'user-scalable'].includes(rule.split('=')[0].trim()));
            viewport.content = [...rules, 'minimum-scale=1', 'maximum-scale=1', 'user-scalable=no'].join(',');
            })();
            """, injectionTime: .atDocumentEnd, forMainFrameOnly: false))
        configuration.setURLSchemeHandler(runtime, forURLScheme: "lingrove")
        configuration.userContentController.addScriptMessageHandler(runtime, contentWorld: .page, name: "lingrove")
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.keyboardDismissMode = .onDrag
        webView.scrollView.pinchGestureRecognizer?.isEnabled = false
        webView.isOpaque = false
        webView.backgroundColor = LingroveTheme.background
        webView.navigationDelegate = runtime
        runtime.webView = webView
        #if DEBUG
        webView.isInspectable = DebugServer.enabled
        #endif
        let request = URLRequest(url: remote ?? URL(string: "lingrove://\(module.id)/\(module.entry)")!, cachePolicy: .reloadIgnoringLocalCacheData)
        // Give SwiftUI a turn to present the loading shell before starting page work.
        let currentWebView = webView!
        let currentRuntime = runtime!
        DispatchQueue.main.async { [weak self, weak currentWebView, weak currentRuntime] in
            guard let self, let currentWebView, let currentRuntime,
                  self.webView === currentWebView, currentWebView.navigationDelegate != nil else { return }
            currentWebView.load(request)
            currentRuntime.startWatchdog()
        }
    }

    func matches(_ candidate: Module) -> Bool {
        module.id == candidate.id && module.version == candidate.version && module.entry == candidate.entry
            && module.allowedOrigins == candidate.allowedOrigins && module.stateSchemaVersion == candidate.stateSchemaVersion
    }
    func detach() {
        offset = webView.scrollView.contentOffset
        webView.endEditing(true)
        runtime.stopTTSPlayback()
        // Keep the DOM, JavaScript state, open sheet and in-flight requests alive.
    }
    func restorePosition() {
        guard let offset else { return }
        DispatchQueue.main.async { [weak self] in
            guard let self, self.failure == nil else { return }
            self.webView.scrollView.setContentOffset(offset, animated: false)
        }
    }
    func close() {
        runtime.close()
        webView.stopLoading()
        webView.navigationDelegate = nil
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "lingrove", contentWorld: .page)
    }
}

struct ModuleScreen: View {
    let module: Module
    @ObservedObject var store: ModuleStore
    @StateObject private var page: ModulePage
    @AppStorage(DebugServer.enabledPreferenceKey) private var debugEnabled = true
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(module: Module, store: ModuleStore, pages: ModulePageCache) {
        self.module = module
        self.store = store
        _page = StateObject(wrappedValue: pages.page(for: module, store: store))
    }
    var body: some View {
        Group {
            if let failure = page.failure {
                ContentUnavailableView { Label("暂时无法打开此应用。", systemImage: "exclamationmark.triangle") } description: { Text(failure) } actions: { if DebugServer.available && debugEnabled { Button("重新加载") { page.reload() } }; Button("返回应用列表") { dismiss() } }
            } else {
                ZStack {
                    ModuleWebView(page: page).id(page.generation)
                        .opacity(page.isLoading ? 0 : 1)
                        .allowsHitTesting(!page.isLoading)
                        .accessibilityHidden(page.isLoading)
                    if page.isLoading {
                        VStack(spacing: 16) {
                            ProgressView().controlSize(.large)
                            Text("正在打开 \(module.name)…").font(.headline)
                            Text("正在加载页面").font(.subheadline).foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color(uiColor: LingroveTheme.background))
                        .accessibilityIdentifier("module-loading")
                        .transition(.opacity)
                    }
                }
                .animation(reduceMotion ? nil : .easeOut(duration: 0.22), value: page.isLoading)
            }
        }
        .ignoresSafeArea(.container, edges: .bottom)
        .background(Color(uiColor: LingroveTheme.background).ignoresSafeArea())
        .overlay(alignment: .topLeading) {
            HStack(spacing: 8) {
                if page.isRootPage || page.failure != nil || page.isLoading {
                    Button { dismiss() } label: {
                        Image(systemName: "house")
                            .frame(width: 44, height: 44)
                            .background(.ultraThinMaterial, in: Circle())
                            .overlay(Circle().strokeBorder(Color.primary.opacity(0.10), lineWidth: 0.5))
                            .contentShape(Rectangle())
                    }
                    .accessibilityLabel("返回 Lingrove")
                    .accessibilityIdentifier("module-home")
                }

            }
            .font(.system(size: 18, weight: .medium))
            .buttonStyle(.plain)
            .foregroundStyle(Color(uiColor: LingroveTheme.accent))
            .padding(.leading, 16)
            .padding(.top, 8)
        }
        .overlay(alignment: .bottom) {
            if DebugServer.available && debugEnabled, let message = page.reloadMessage {
                ReloadFeedbackView(message: message, autoDismiss: !page.isReloading) { page.reloadMessage = nil }
                    .padding(.horizontal, 16).padding(.bottom, 80)
            }
        }
        // This native edge stays above WebKit, including child dialogs and loading errors.
        // It never depends on JavaScript or the child-controlled Home visibility.
        .overlay(alignment: .leading) {
            ModuleExitEdge(onExit: { dismiss() })
                .frame(width: 24)
                .ignoresSafeArea()
        }
        .toolbar(.hidden, for: .navigationBar)
        .navigationBarBackButtonHidden(true)
        .onAppear { store.begin(module, trackingStartup: DebugServer.entryURL(for: module) == nil) }.onDisappear { store.end(module) }
    }
}

private struct ModuleExitEdge: UIViewRepresentable {
    let onExit: () -> Void
    func makeUIView(context: Context) -> ModuleExitEdgeView {
        ModuleExitEdgeView(onExit: onExit)
    }
    func updateUIView(_ view: ModuleExitEdgeView, context: Context) {
        view.onExit = onExit
    }
    static func dismantleUIView(_ view: ModuleExitEdgeView, coordinator: ()) {
        view.onExit = {}
    }
}

private final class ModuleExitEdgeView: UIView {
    var onExit: () -> Void
    init(onExit: @escaping () -> Void) {
        self.onExit = onExit
        super.init(frame: .zero)
        backgroundColor = .clear
        isAccessibilityElement = true
        accessibilityLabel = "边缘返回应用列表"
        accessibilityHint = "从屏幕左边缘向右滑动，也可以返回应用列表"
        accessibilityTraits = .button
        accessibilityIdentifier = "module-exit-edge"
        let pan = UIScreenEdgePanGestureRecognizer(target: self, action: #selector(exitFromEdge(_:)))
        pan.edges = .left
        addGestureRecognizer(pan)
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    @objc private func exitFromEdge(_ gesture: UIScreenEdgePanGestureRecognizer) {
        guard gesture.state == .ended else { return }
        let distance = gesture.translation(in: self)
        let velocity = gesture.velocity(in: self)
        guard distance.x > abs(distance.y),
              distance.x >= 72 || (distance.x >= 30 && velocity.x >= 600) else { return }
        onExit()
    }
    override func accessibilityActivate() -> Bool {
        onExit()
        return true
    }
}
struct ReloadFeedbackView: View {
    let message: String
    var autoDismiss = true
    let dismiss: () -> Void
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text(message).font(.subheadline).frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityIdentifier("debug-reload-feedback")
            Button(action: dismiss) { Image(systemName: "xmark") }
                .accessibilityLabel("关闭刷新提示")
        }
        .padding(16)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14))
        .task(id: autoDismiss ? message : nil) {
            guard autoDismiss else { return }
            do { try await Task.sleep(for: .seconds(3)) }
            catch { return }
            guard !Task.isCancelled else { return }
            dismiss()
        }
    }
}

struct ModuleWebView: UIViewRepresentable {
    let page: ModulePage
    func makeCoordinator() -> ModulePage { page }
    func makeUIView(context: Context) -> WKWebView {
        page.restorePosition()
        return page.webView
    }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
    static func dismantleUIView(_ uiView: WKWebView, coordinator: ModulePage) {
        coordinator.detach()
    }
}
@MainActor final class Runtime: NSObject, WKURLSchemeHandler, WKScriptMessageHandlerWithReply, WKNavigationDelegate {
    let module: Module
    let directory: URL
    let onReady: () -> Void
    let onFailure: (String) -> Void
    let onStartupFailure: () -> Void
    weak var webView: WKWebView?
    private var networkTasks: [String: Task<Any, Error>] = [:]
    private var ttsPlayers: [String: TTSPlayback] = [:]
    private var ttsPreload: (owner: String, request: TTSRequestIdentity, audio: Task<Data, Error>)?
    private var watchdog: Task<Void, Never>?
    private var inlineHandwriting: InlineHandwriting?
    private let debugEntryURL: URL?
    private let onReload: () -> Void
    private let onNavigation: (Bool) -> Void
    private var ready = false
    private var closed = false
    private let stateRoot: URL
    private var extraOrigins: [String] = []
    private let networkDefaults: UserDefaults
    private let ttsConfiguration: () throws -> TTSConfiguration
    private let llmConfiguration: () throws -> LLMConfiguration
    private let injectedSession: URLSession?
    private lazy var session: URLSession = {
        if let injectedSession { return injectedSession }
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 60; config.timeoutIntervalForResource = 120
        config.httpCookieStorage = nil; config.httpShouldSetCookies = false; config.urlCache = nil
        return URLSession(configuration: config, delegate: NoRedirect(), delegateQueue: nil)
    }()
    init(module: Module, directory: URL, onReady: @escaping () -> Void, onFailure: @escaping (String) -> Void, networkSession: URLSession? = nil, networkDefaults: UserDefaults = .standard, llmConfiguration: @escaping () throws -> LLMConfiguration = { try LLMStore.load() }, ttsConfiguration: @escaping () throws -> TTSConfiguration = { try TTSStore.load() }, onStartupFailure: @escaping () -> Void = {}, debugEntryURL: URL? = nil, onReload: @escaping () -> Void = {}, onNavigation: @escaping (Bool) -> Void = { _ in }) {
        self.debugEntryURL = DebugServer.enabled ? debugEntryURL : nil
        self.onReload = onReload
        self.onNavigation = onNavigation
        self.onStartupFailure = onStartupFailure
        self.injectedSession = networkSession
        self.networkDefaults = networkDefaults
        self.llmConfiguration = llmConfiguration
        self.ttsConfiguration = ttsConfiguration
        self.module = module; self.directory = directory; self.onReady = onReady; self.onFailure = onFailure
        stateRoot = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("Lingrove/State/\(module.id)")
        super.init()
        extraOrigins = networkDefaults.stringArray(forKey: "origins.\(module.id)") ?? []
    }
    func startWatchdog() {
        watchdog = Task { try? await Task.sleep(for: .seconds(20)); guard !Task.isCancelled, !ready, !closed else { return }; fail(debugEntryURL == nil ? "页面启动超时；如果是下载版本，已尝试回退。" : "调试页面启动超时，请检查服务器地址、资源和宿主桥接初始化。") }
    }
    func stopTTSPlayback() {
        ttsPreload?.audio.cancel(); ttsPreload = nil
        for (id, player) in ttsPlayers { player.stop(); networkTasks[id]?.cancel() }
    }
    func close() { stopTTSPlayback(); closed = true; inlineHandwriting?.detach(); inlineHandwriting = nil; watchdog?.cancel(); for task in networkTasks.values { task.cancel() }; networkTasks.removeAll(); session.invalidateAndCancel() }
    private func fail(_ reason: String, startupFailure: Bool = true) {
        guard !closed else { return }
        close()
        if startupFailure && !ready { onStartupFailure() }
        onFailure(reason)
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // WebKit may update its scroll configuration when a new document commits.
        webView.scrollView.pinchGestureRecognizer?.isEnabled = false
    }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { fail("页面进程已退出，请返回后重试。", startupFailure: false) }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { fail(error.localizedDescription) }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { fail(error.localizedDescription) }
    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        if debugEntryURL != nil, navigationResponse.isForMainFrame,
           let response = navigationResponse.response as? HTTPURLResponse,
           !(200..<300).contains(response.statusCode) {
            decisionHandler(.cancel)
            fail("调试服务器返回 HTTP \(response.statusCode)")
            return
        }
        decisionHandler(.allow)
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        let url = navigationAction.request.url
        decisionHandler(url.map { accepts($0) } == true ? .allow : .cancel)
    }
    func accepts(_ url: URL) -> Bool {
        if let debugEntryURL { return DebugServer.allows(url, entry: debugEntryURL) }
        return url.scheme == "lingrove" && url.host == module.id
    }
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        do {
            guard let url = urlSchemeTask.request.url, url.host == module.id else { throw ModuleError.invalid("资源来源无效") }
            let path = url.path.removingPercentEncoding ?? url.path
            guard !path.contains("\\"), !path.split(separator: "/").contains("..") else { throw ModuleError.invalid("资源路径无效") }
            let file = directory.appendingPathComponent(path == "/" ? module.entry : String(path.dropFirst())).standardizedFileURL.resolvingSymlinksInPath()
            guard file.path.hasPrefix(directory.standardizedFileURL.resolvingSymlinksInPath().path + "/") else { throw ModuleError.invalid("资源越界") }
            var data = try Data(contentsOf: file)
            let mime = ["html":"text/html", "js":"application/javascript", "css":"text/css", "json":"application/json", "svg":"image/svg+xml", "png":"image/png", "jpg":"image/jpeg", "woff2":"font/woff2", "otf":"font/otf", "ttf":"font/ttf", "mp3":"audio/mpeg", "wav":"audio/wav"][file.pathExtension] ?? "application/octet-stream"
            if file.pathExtension == "html", let html = String(data: data, encoding: .utf8) {
                let csp = "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'\">"
                data = Data(html.replacingOccurrences(of: "<head>", with: "<head>" + csp).utf8)
            }
            urlSchemeTask.didReceive(URLResponse(url: url, mimeType: mime, expectedContentLength: data.count, textEncodingName: mime.hasPrefix("text/") ? "utf-8" : nil))
            urlSchemeTask.didReceive(data); urlSchemeTask.didFinish()
        } catch { urlSchemeTask.didFailWithError(error) }
    }
    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
        guard !closed, message.frameInfo.isMainFrame, message.frameInfo.request.url.map({ accepts($0) }) == true,
              let body = message.body as? [String: Any], body["version"] as? Int == 1,
              let method = body["method"] as? String, let params = body["params"] as? [String: Any] else { replyHandler(nil, "非法通信请求"); return }
        Task {
            do { let result = try await handle(method, params); replyHandler(result, nil) }
            catch { replyHandler(nil, error.localizedDescription) }
        }
    }
    private func stateURL(_ key: String) throws -> URL {
        guard key.range(of: "^[a-zA-Z0-9._-]{1,100}$", options: .regularExpression) != nil else { throw ModuleError.invalid("存储键无效") }
        try FileManager.default.createDirectory(at: stateRoot, withIntermediateDirectories: true)
        return stateRoot.appendingPathComponent(key + ".json")
    }
    private func handle(_ method: String, _ params: [String: Any]) async throws -> Any {
        extraOrigins = networkDefaults.stringArray(forKey: "origins.\(module.id)") ?? []
        switch method {
        case "runtime.language": return AppLanguage.current
        case "runtime.navigation":
            guard let isRoot = params["isRoot"] as? Bool else { throw ModuleError.invalid("页面层级无效") }
            onNavigation(isRoot)
            return true
        case "runtime.reload":
            Task { @MainActor in
                try? await Task.sleep(for: .milliseconds(100))
                guard !self.closed else { return }
                self.onReload()
            }
            return true
        case "handwriting.inline":
            guard let webView, let id = params["id"] as? String, id.count <= 64,
                  let action = params["action"] as? String else { throw ModuleError.invalid("手写请求无效") }
            if action == "detach" {
                if inlineHandwriting?.sessionID == id { inlineHandwriting?.detach(); inlineHandwriting = nil }
                return true
            }
            if action == "attach" {
                inlineHandwriting?.detach()
                let view = InlineHandwriting(id:id, scrollView:webView.scrollView)
                inlineHandwriting = view; webView.scrollView.addSubview(view)
                view.changed = { [weak self] value in
                    guard let self, !self.closed, let data = try? JSONSerialization.data(withJSONObject:value),
                          let chunk = String(data:data, encoding:.utf8) else { return }
                    Task { try? await self.emit(id, chunk) }
                }
            }
            guard let view = inlineHandwriting, view.sessionID == id else { throw ModuleError.invalid("手写会话已结束") }
            if action == "attach" || action == "layout" {
                guard let rect = params["rect"] as? [String:Double],
                      let x = rect["x"], let y = rect["y"], let width = rect["width"], let height = rect["height"],
                      [x,y,width,height].allSatisfy({ $0.isFinite }), width > 0, width <= 2048, abs(width-height) < 2 else { throw ModuleError.invalid("画板位置无效") }
                view.place(CGRect(x:x,y:y,width:width,height:height), top:60, bottom:CGFloat(params["bottom"] as? Double ?? 88))
            }
            if action == "attach" {
                var reference: UIImage?
                if let encoded = params["reference"] as? String {
                    guard encoded.hasPrefix("data:image/png;base64,"), encoded.utf8.count < 1_000_000,
                          let data = Data(base64Encoded:String(encoded.dropFirst(22))), let image = UIImage(data:data), image.size.width <= 512, image.size.height <= 512 else { throw ModuleError.invalid("范字图片无效") }
                    reference = image
                }
                do { try view.restore(params["drawing"] as? String, reference:reference, strokes:params["strokes"] as? [[[String:Double]]]) }
                catch { view.detach(); inlineHandwriting = nil; throw error }
            }
            if action == "attach" || action == "configure" {
                view.configure(finger:params["finger"] as? Bool ?? false, eraser:params["eraser"] as? Bool ?? false, locked:params["locked"] as? Bool ?? false, hidden:params["hidden"] as? Bool ?? false)
            }
            if action == "clear" || action == "undo" { view.command(action) }
            return true
        case "runtime.ready": ready = true; watchdog?.cancel(); webView?.scrollView.pinchGestureRecognizer?.isEnabled = false; onReady(); return true
        case "state.get":
            guard let key = params["key"] as? String else { throw ModuleError.invalid("缺少存储键") }
            let url = try stateURL(key)
            if !FileManager.default.fileExists(atPath: url.path) { return NSNull() }
            return try String(contentsOf: url, encoding: .utf8)
        case "state.set":
            guard let key = params["key"] as? String, let value = params["value"] as? String, value.utf8.count <= 8 * 1024 * 1024 else { throw ModuleError.invalid("存储内容无效或过大") }
            try Data(value.utf8).write(to: stateURL(key), options: .atomic); return true
        case "clipboard.write":
            guard let text = params["text"] as? String, text.utf8.count <= 1024 * 1024 else { throw ModuleError.invalid("复制内容过大") }
            UIPasteboard.general.string = text; return true
        case "network.authorize":
            guard let raw = params["origin"] as? String, let origin = NetworkPolicy.origin(raw), origin == raw else { throw ModuleError.invalid("域名无效") }
            if (module.allowedOrigins + extraOrigins).contains(origin) { return true }
            guard extraOrigins.count < 20, let controller = webView?.window?.rootViewController else { throw ModuleError.invalid("无法添加域名") }
            var presenter = controller; while let presented = presenter.presentedViewController { presenter = presented }
            let allowed = await withCheckedContinuation { continuation in
                let alert = UIAlertController(title: "允许 \(module.name) 连接此服务？", message: "\(origin)\n\n你输入的句子和配置的服务商凭据将发送至此地址。", preferredStyle: .alert)
                alert.addAction(UIAlertAction(title: "取消", style: .cancel) { _ in continuation.resume(returning: false) })
                alert.addAction(UIAlertAction(title: "允许", style: .default) { _ in continuation.resume(returning: true) })
                presenter.present(alert, animated: true)
            }
            guard allowed, !closed else { throw ModuleError.invalid("未授权此域名") }
            extraOrigins.append(origin); networkDefaults.set(extraOrigins, forKey: "origins.\(module.id)"); return true
        case "tts.pause", "tts.resume", "tts.stop":
            guard let id = params["id"] as? String else { throw ModuleError.invalid("请求数量或标识无效") }
            guard let player = ttsPlayers[id] else { return false }
            if method == "tts.pause" { player.pause() }
            else if method == "tts.resume" { player.resume() }
            else {
                player.stop(); networkTasks[id]?.cancel()
                if ttsPreload?.owner == id { ttsPreload?.audio.cancel(); ttsPreload = nil }
            }
            return true
        case "tts.play":
            guard !closed else { throw CancellationError() }
            guard let id = params["id"] as? String, !id.isEmpty, id.count <= 80, networkTasks[id] == nil, networkTasks.count < 6 else { throw ModuleError.invalid("请求数量或标识无效") }
            let config = try ttsConfiguration()
            guard (try? config.validate()) != nil else { throw ModuleError.invalid("请先前往「应用设置 → 语音合成」完成设置。") }
            let currentRequest = try config.request(params, streaming: true)
            var nextParams: [String: Any]?
            var nextRequest: URLRequest?
            if let next = params["nextText"] {
                guard let text = next as? String else { throw ModuleError.invalid("朗读文本无效") }
                var candidate = params
                candidate["text"] = text
                candidate.removeValue(forKey: "nextText")
                nextRequest = try config.request(candidate, streaming: true)
                nextParams = candidate
            }
            let prepared: Task<Data, Error>?
            if ttsPreload?.request == TTSRequestIdentity(currentRequest) { prepared = ttsPreload?.audio }
            else { ttsPreload?.audio.cancel(); prepared = nil }
            ttsPreload = nil
            var prefetched = false
            let player = TTSPlayback { [weak self] state in
                guard let self, !self.closed else { return }
                if state == .playing, self.ttsPlayers[id]?.state == .playing, !prefetched, let nextParams, let nextRequest {
                    prefetched = true
                    self.ttsPreload?.audio.cancel()
                    let audio = Task { try await TTSService.preparePCM(nextParams, configuration: config, session: self.session) }
                    self.ttsPreload = (id, TTSRequestIdentity(nextRequest), audio)
                }
                guard let data = try? JSONSerialization.data(withJSONObject: ["state": state.rawValue]),
                      let chunk = String(data: data, encoding: .utf8) else { return }
                try? await self.emit(id, chunk)
            }
            ttsPlayers[id] = player
            let task = Task<Any, Error> {
                try await player.run(params, configuration: config, session: self.session, prepared: prepared)
                return ["model": config.model, "provider": config.provider.rawValue]
            }
            networkTasks[id] = task
            defer {
                networkTasks.removeValue(forKey: id); ttsPlayers.removeValue(forKey: id)
                if player.state != .ended, ttsPreload?.owner == id { ttsPreload?.audio.cancel(); ttsPreload = nil }
            }
            return try await task.value
        case "tts.status":
            let config = try ttsConfiguration()
            return ["configured": (try? config.validate()) != nil, "provider": config.provider.rawValue, "model": config.model, "voice": config.voice, "voices": config.provider.voices(for: config.model).map { ["id": $0.id, "title": $0.title, "language": $0.language] }]
        case "tts.synthesize":
            guard !closed else { throw CancellationError() }
            guard let id = params["id"] as? String, !id.isEmpty, id.count <= 80, networkTasks[id] == nil, networkTasks.count < 6 else { throw ModuleError.invalid("请求数量或标识无效") }
            let config = try ttsConfiguration()
            guard (try? config.validate()) != nil else { throw ModuleError.invalid("请先前往「应用设置 → 语音合成」完成设置。") }
            let task = Task<Any, Error> {
                let audio = try await TTSService.synthesize(params, configuration: config, session: self.session)
                try Task.checkCancellation()
                return audio.bridgeResult
            }
            networkTasks[id] = task
            defer { networkTasks.removeValue(forKey: id) }
            return try await task.value
        case "llm.status":
            let config = try llmConfiguration()
            return ["configured": (try? config.validate()) != nil, "model": config.model]
        case "llm.request":
            guard let id = params["id"] as? String, !id.isEmpty, id.count <= 80, networkTasks[id] == nil, networkTasks.count < 6 else { throw ModuleError.invalid("请求数量或标识无效") }
            let config = try llmConfiguration()
            guard (try? config.validate()) != nil else { throw ModuleError.invalid("请先前往「应用设置 → 通用模型」完成设置。") }
            let request = try config.request(params)
            let task = Task<Any, Error> {
                var result = try await self.perform(request, id: id, stream: true, llm: config, timeoutSeconds: params["timeoutSeconds"] as? Double)
                result["model"] = config.model
                result["protocol"] = config.provider
                return result
            }
            networkTasks[id] = task
            defer { networkTasks.removeValue(forKey: id) }
            return try await task.value
        case "tts.cancel", "llm.cancel", "http.cancel": if let id = params["id"] as? String { networkTasks[id]?.cancel() }; return true
        case "http.request":
            guard let id = params["id"] as? String, id.count <= 80, networkTasks[id] == nil, networkTasks.count < 6 else { throw ModuleError.invalid("请求数量或标识无效") }
            let task = Task<Any, Error> { try await self.request(params, id: id) }
            networkTasks[id] = task
            defer { networkTasks.removeValue(forKey: id) }
            return try await task.value
        default: throw ModuleError.invalid("此功能暂时不可用，请重新打开应用。")
        }
    }
    private func request(_ params: [String: Any], id: String) async throws -> Any {
        guard let raw = params["url"] as? String, let url = URL(string: raw) else { throw ModuleError.invalid("请求地址无效") }
        guard NetworkPolicy.allows(url, origins: module.allowedOrigins + extraOrigins) else { throw ModuleError.invalid("请求域名未授权，请在连接设置中保存此地址") }
        let method = (params["method"] as? String ?? "GET").uppercased()
        guard ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].contains(method) else { throw ModuleError.invalid("不支持的 HTTP 方法") }
        var request = URLRequest(url: url); request.httpMethod = method
        if let body = params["body"] as? String { guard body.utf8.count <= 1024 * 1024 else { throw ModuleError.invalid("请求内容过大") }; request.httpBody = Data(body.utf8) }
        for (key, value) in params["headers"] as? [String: String] ?? [:] {
            guard !["host", "cookie", "origin", "referer", "content-length", "connection"].contains(key.lowercased()), !key.contains("\n"), !value.contains("\n"), !value.contains("\r") else { throw ModuleError.invalid("不允许的请求头") }
            request.setValue(value, forHTTPHeaderField: key)
        }
        return try await perform(request, id: id, stream: params["stream"] as? Bool == true)
    }
    private func perform(_ request: URLRequest, id: String, stream: Bool, llm: LLMConfiguration? = nil, timeoutSeconds: TimeInterval? = nil) async throws -> [String: Any] {
        var usage = LLMUsageCollector(protocolName: llm?.provider ?? "")
        let provider = request.url.map(LLMUsageStore.providerID) ?? "未知服务商"
        if llm != nil { LLMUsageStore.shared.begin(appID: module.id, appName: module.name, provider: provider) }
        defer {
            if llm != nil {
                usage.flushEvent()
                LLMUsageStore.shared.finish(appID: module.id, provider: provider, usage: usage)
            }
        }
        // Both the idle wait and total resource deadline must honor long LLM requests.
        // A dedicated session keeps ordinary HTTP and other model requests unchanged.
        let timedSession: URLSession? = timeoutSeconds.map { seconds in
            let configuration = session.configuration
            configuration.timeoutIntervalForRequest = seconds
            configuration.timeoutIntervalForResource = seconds
            return URLSession(configuration: configuration, delegate: NoRedirect(), delegateQueue: nil)
        }
        defer { timedSession?.invalidateAndCancel() }
        let (bytes, response) = try await (timedSession ?? session).bytes(for: request)
        guard let response = response as? HTTPURLResponse else { throw ModuleError.invalid("无效 HTTP 响应") }
        let headers = response.allHeaderFields.reduce(into: [String: String]()) { result, entry in
            let key = String(describing: entry.key).lowercased()
            if key != "set-cookie" { result[key] = String(describing: entry.value) }
        }
        let streaming = stream && headers["content-type"]?.contains("text/event-stream") == true && (200..<300).contains(response.statusCode)
        var buffer = Data(), total = 0
        for try await byte in bytes {
            try Task.checkCancellation(); total += 1
            guard total <= 8 * 1024 * 1024 else { throw ModuleError.invalid("响应超过大小限制") }
            buffer.append(byte)
            if streaming && byte == 10 {
                if llm != nil { usage.consumeLine(String(decoding: buffer, as: UTF8.self)) }
                try await emit(id, String(decoding: buffer, as: UTF8.self)); buffer.removeAll(keepingCapacity: true)
            }
        }
        if streaming && !buffer.isEmpty {
            if llm != nil { usage.consumeLine(String(decoding: buffer, as: UTF8.self)) }
            try await emit(id, String(decoding: buffer, as: UTF8.self)); buffer.removeAll()
        }
        if llm != nil {
            if streaming { usage.flushEvent() }
            else if (200..<300).contains(response.statusCode) { usage.consumeJSON(buffer) }
        }
        return ["status": response.statusCode, "headers": headers, "body": String(decoding: buffer, as: UTF8.self)]
    }
    private func emit(_ id: String, _ chunk: String) async throws {
        guard !closed, let webView else { throw CancellationError() }
        _ = try await webView.callAsyncJavaScript("window.__lingroveChunk(id, chunk)", arguments: ["id": id, "chunk": chunk], in: nil, contentWorld: .page)
    }
}
