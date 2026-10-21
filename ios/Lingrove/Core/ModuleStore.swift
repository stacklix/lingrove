import Foundation
import CryptoKit
import Combine

private enum ModuleTransferTimeout {
    static let catalog: TimeInterval = 60
    static let package: TimeInterval = 5 * 60
    static let resource: TimeInterval = 15 * 60
}

final class NoRedirect: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}
private final class ModuleDownloadTransfer: NSObject, @unchecked Sendable {
    private static let progressUpdateInterval = 64 * 1024
    private let limit: Int
    private let onProgress: (@Sendable (Int) -> Void)?
    private let lock = NSLock()
    private var continuation: CheckedContinuation<Data, Error>?
    private var task: URLSessionDataTask?
    private var data = Data()
    private var lastReportedBytes = 0
    private var finished = false

    init(limit: Int, onProgress: (@Sendable (Int) -> Void)?) {
        self.limit = limit
        self.onProgress = onProgress
        super.init()
    }

    func download(using session: ModuleDownloadSession, request: URLRequest) async throws -> Data {
        try Task.checkCancellation()
        return try await withTaskCancellationHandler {
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Data, Error>) in
                lock.lock()
                guard !Task.isCancelled else {
                    lock.unlock()
                    continuation.resume(throwing: CancellationError())
                    return
                }
                self.continuation = continuation
                let task = session.makeTask(for: self, request: request)
                self.task = task
                lock.unlock()
                task.resume()
            }
        } onCancel: {
            lock.lock()
            let task = self.task
            lock.unlock()
            task?.cancel()
        }
    }

    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse,
                    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
        guard let response = response as? HTTPURLResponse else {
            completionHandler(.cancel)
            finish(.failure(ModuleError.invalid("服务器未返回有效的 HTTP 响应")))
            return
        }
        guard response.statusCode == 200 else {
            completionHandler(.cancel)
            finish(.failure(ModuleError.invalid("服务器返回 HTTP \(response.statusCode)")))
            return
        }
        guard response.expectedContentLength < 0 || response.expectedContentLength <= Int64(limit) else {
            completionHandler(.cancel)
            finish(.failure(ModuleError.invalid("资源超过大小限制")))
            return
        }
        completionHandler(.allow)
    }

    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive incomingData: Data) {
        lock.lock()
        guard !finished else {
            lock.unlock()
            return
        }
        guard incomingData.count <= limit - data.count else {
            lock.unlock()
            dataTask.cancel()
            finish(.failure(ModuleError.invalid("资源超过大小限制")))
            return
        }
        data.append(incomingData)
        let received = data.count
        let reportProgress = received - lastReportedBytes >= Self.progressUpdateInterval
        if reportProgress { lastReportedBytes = received }
        lock.unlock()
        if reportProgress { onProgress?(received) }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(nil)
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        lock.lock()
        guard !finished else {
            lock.unlock()
            return
        }
        let result: Result<Data, Error>
        if let error { result = .failure(error) }
        else { result = .success(data) }
        let downloadedBytes = data.count
        lock.unlock()
        if error == nil { onProgress?(downloadedBytes) }
        finish(result)
    }

    private func finish(_ result: Result<Data, Error>) {
        lock.lock()
        guard !finished else {
            lock.unlock()
            return
        }
        finished = true
        let continuation = self.continuation
        self.continuation = nil
        task = nil
        lock.unlock()
        continuation?.resume(with: result)
    }
}
private final class ModuleDownloadSession: @unchecked Sendable {
    private let dispatcher: ModuleDownloadDispatcher
    private let session: URLSession

    init(configuration: URLSessionConfiguration) {
        let dispatcher = ModuleDownloadDispatcher()
        self.dispatcher = dispatcher
        let transferConfiguration = configuration.copy() as! URLSessionConfiguration
        transferConfiguration.timeoutIntervalForRequest = ModuleTransferTimeout.package
        transferConfiguration.timeoutIntervalForResource = ModuleTransferTimeout.resource
        session = URLSession(configuration: transferConfiguration, delegate: dispatcher, delegateQueue: nil)
    }

    deinit { session.invalidateAndCancel() }

    func download(request: URLRequest, limit: Int, onProgress: (@Sendable (Int) -> Void)?) async throws -> Data {
        try await ModuleDownloadTransfer(limit: limit, onProgress: onProgress).download(using: self, request: request)
    }

    fileprivate func makeTask(for transfer: ModuleDownloadTransfer, request: URLRequest) -> URLSessionDataTask {
        let task = session.dataTask(with: request)
        dispatcher.register(transfer, for: task.taskIdentifier)
        return task
    }
}
private final class ModuleDownloadDispatcher: NSObject, URLSessionDataDelegate, @unchecked Sendable {
    private let lock = NSLock()
    private var transfers: [Int: ModuleDownloadTransfer] = [:]

    func register(_ transfer: ModuleDownloadTransfer, for taskID: Int) {
        lock.lock(); defer { lock.unlock() }
        transfers[taskID] = transfer
    }

    private func transfer(for taskID: Int, removing: Bool = false) -> ModuleDownloadTransfer? {
        lock.lock(); defer { lock.unlock() }
        if removing { return transfers.removeValue(forKey: taskID) }
        return transfers[taskID]
    }

    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse,
                    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
        guard let transfer = transfer(for: dataTask.taskIdentifier) else {
            completionHandler(.cancel)
            return
        }
        transfer.urlSession(session, dataTask: dataTask, didReceive: response, completionHandler: completionHandler)
    }

    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        transfer(for: dataTask.taskIdentifier)?.urlSession(session, dataTask: dataTask, didReceive: data)
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        guard let transfer = transfer(for: task.taskIdentifier) else {
            completionHandler(nil)
            return
        }
        transfer.urlSession(session, task: task, willPerformHTTPRedirection: response, newRequest: request, completionHandler: completionHandler)
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        transfer(for: task.taskIdentifier, removing: true)?.urlSession(session, task: task, didCompleteWithError: error)
    }
}
enum ModuleDownloadState: String, Codable {
    case checking, waiting, downloading, succeeded, failed, unchanged, deferred

    var isInProgress: Bool { self == .checking || self == .waiting || self == .downloading }
}

struct ModuleDownloadRecord: Codable, Equatable {
    let state: ModuleDownloadState
    let message: String
    let completedAt: Date?

    func isVisible(at date: Date) -> Bool {
        state.isInProgress || completedAt.map { date < $0.addingTimeInterval(5) } == true
    }
}

@MainActor final class ModuleStore: ObservableObject {
    static let displayOrderKey = "modules.displayOrder"
    private static let maxConcurrentDownloads = 3
    struct Installed: Codable {
        var active: Module
        var previous: Module?
        var healthy: Bool
        var minimumAllowedVersion: String?
        var updatedAt: Date? = nil
        var previousUpdatedAt: Date? = nil
    }
    @Published var modules: [Module] = []
    @Published var checking = false
    @Published var statuses: [String: String] = [:]
    @Published private(set) var downloadRecords: [String: ModuleDownloadRecord] = [:]
    private var completedDownloads: [String: ModuleDownloadRecord] = [:]
    @Published var downloadProgress: [String: Double] = [:]
    @Published var notice = ""
    @Published var blocked = Set<String>()
    private var registry: [String: Installed] = [:]
    private var builtins: [String: Module] = [:]
    private var activeSessions = Set<String>()
    private var rejectedVersions: [String: String] = [:]
    private var downloadStatusOwners: [String: UUID] = [:]
    private var registryReadable = true
    private var updateTask: Task<Bool, Never>?
    private var updateID = UUID()
    private let root: URL
    private let config: HostConfiguration
    private let session: ModuleDownloadSession
    private let builtinRoot: URL?
    private let defaults: UserDefaults
    private var downloadHistoryURL: URL { root.appendingPathComponent("snapshot-download-history.json") }
    private var registryURL: URL { root.appendingPathComponent("registry.json") }
    init(root: URL? = nil, config: HostConfiguration = .bundled, session: URLSession? = nil, builtinRoot: URL? = nil, defaults: UserDefaults = .standard) {
        self.defaults = defaults
        self.session = ModuleDownloadSession(configuration: session?.configuration ?? .ephemeral)
        self.builtinRoot = builtinRoot ?? Bundle.main.resourceURL?.appendingPathComponent("BuiltinModules")
        self.config = config
        self.root = root ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("Lingrove")
        do {
            try FileManager.default.createDirectory(at: self.root, withIntermediateDirectories: true)
            completedDownloads = (try? JSONDecoder().decode([String: ModuleDownloadRecord].self, from: Data(contentsOf: downloadHistoryURL))) ?? [:]
            downloadRecords = completedDownloads
            if let builtinRoot = self.builtinRoot, let dirs = try? FileManager.default.contentsOfDirectory(at: builtinRoot, includingPropertiesForKeys: nil) {
                for directory in dirs { if let data = try? Data(contentsOf: directory.appendingPathComponent("manifest.json")), let module = try? JSONDecoder().decode(Module.self, from: data) { try module.validate(); builtins[module.id] = module } }
            }
            if FileManager.default.fileExists(atPath: registryURL.path) {
                do {
                    registry = try JSONDecoder().decode([String: Installed].self, from: Data(contentsOf: registryURL))
                    for (id, install) in registry {
                        try install.active.validate()
                        if let previous = install.previous { try previous.validate() }
                        guard id == install.active.id, install.previous.map({ $0.id == id }) ?? true else { throw ModuleError.invalid("模块注册表身份不一致") }
                    }
                } catch {
                    registryReadable = false; registry = [:]
                    notice = "应用安装记录格式无效或无法读取，已保留原文件；暂时使用内置应用，自动更新已暂停。"
                }
            }
            // A newly installed host may bundle a newer module than its persisted registry.
            var adoptedBuiltin = false
            for (id, builtin) in builtins {
                if let installed = registry[id], !installed.active.isSnapshot && ModuleVersion(builtin.version)! > ModuleVersion(installed.active.version)! {
                    var replacement = Installed(active: builtin, healthy: true)
                    replacement.minimumAllowedVersion = installed.minimumAllowedVersion
                    registry[id] = replacement
                    adoptedBuiltin = true
                }
            }
            if adoptedBuiltin && registryReadable { try persist() }
            rejectedVersions = (try? JSONDecoder().decode([String: String].self, from: Data(contentsOf: self.root.appendingPathComponent("rejected.json")))) ?? [:]
            refresh()
            if !HostConfiguration.usesBundledResources(defaults: defaults) {
                for install in registry.values where !install.healthy && UserDefaults.standard.bool(forKey: "launching.\(install.active.id).\(install.active.resourceIdentity)") { rollback(install.active) }
            }
        } catch { notice = "本地模块读取失败：\(error.localizedDescription)"; refresh() }
    }
    private func refresh() {
        var all = builtins
        let bundledOnly = HostConfiguration.usesBundledResources(defaults: defaults)
        if !bundledOnly {
            for (id, install) in registry { all[id] = install.active }
        }
        let order = defaults.stringArray(forKey: Self.displayOrderKey) ?? []
        modules = all.values.sorted {
            let left = order.firstIndex(of: $0.id) ?? Int.max
            let right = order.firstIndex(of: $1.id) ?? Int.max
            return left == right ? $0.id < $1.id : left < right
        }
        blocked = bundledOnly ? [] : Set(registry.compactMap { id, install in
            guard let minimum = install.minimumAllowedVersion.flatMap(ModuleVersion.init), let current = ModuleVersion(install.active.version), current < minimum else { return nil }; return id
        })
    }
    func resourceModeChanged() {
        updateTask?.cancel()
        updateTask = nil
        updateID = UUID()
        checking = false
        statuses.removeAll()
        downloadProgress.removeAll()
        downloadStatusOwners.removeAll()
        downloadRecords = completedDownloads
        if registryReadable { notice = "" }
        refresh()
    }
    private func recordDownload(_ moduleID: String, state: ModuleDownloadState, message: String) {
        guard HostConfiguration.usesSnapshot(defaults: defaults) else { return }
        let record = ModuleDownloadRecord(state: state, message: message, completedAt: state.isInProgress ? nil : Date())
        downloadRecords[moduleID] = record
        if !state.isInProgress {
            completedDownloads[moduleID] = record
            if let data = try? JSONEncoder().encode(completedDownloads) {
                try? data.write(to: downloadHistoryURL, options: .atomic)
            }
        }
    }

    private func finishPendingDownloadChecks(state: ModuleDownloadState, message: String) {
        for (moduleID, record) in downloadRecords where record.state == .checking {
            recordDownload(moduleID, state: state, message: message)
        }
    }

    func setDisplayOrder(_ ids: [String]) {
        var seen = Set<String>()
        let available = Set(modules.map(\.id))
        let order = (ids + modules.map(\.id)).filter { available.contains($0) && seen.insert($0).inserted }
        defaults.set(order, forKey: Self.displayOrderKey)
        refresh()
    }
    private func persist() throws { try JSONEncoder().encode(registry).write(to: registryURL, options: .atomic); refresh() }
    func isDownloaded(_ module: Module) -> Bool {
        guard !HostConfiguration.usesBundledResources(defaults: defaults) else { return false }
        let manifest = root.appendingPathComponent("Modules/\(module.id)/\(module.resourceIdentity)/manifest.json")
        return FileManager.default.fileExists(atPath: manifest.path)
    }
    func directory(for module: Module) -> URL {
        let downloaded = root.appendingPathComponent("Modules/\(module.id)/\(module.resourceIdentity)")
        if isDownloaded(module) { return downloaded }
        return builtinRoot!.appendingPathComponent(module.id)
    }
    func lastUpdatedAt(for module: Module) -> Date? {
        guard isDownloaded(module),
              let installed = registry[module.id],
              installed.active.resourceIdentity == module.resourceIdentity else { return nil }
        return installed.updatedAt
    }
    func begin(_ module: Module, trackingStartup: Bool = true) { activeSessions.insert(module.id); if trackingStartup && registry[module.id]?.healthy == false { UserDefaults.standard.set(true, forKey: "launching.\(module.id).\(module.resourceIdentity)") } }
    func end(_ module: Module) { activeSessions.remove(module.id) }
    func clearLaunchMarker(_ module: Module) {
        UserDefaults.standard.removeObject(forKey: "launching.\(module.id).\(module.resourceIdentity)")
    }
    func markHealthy(_ module: Module) {
        guard !HostConfiguration.usesBundledResources(defaults: defaults) else { return }
        guard registry[module.id]?.active.resourceIdentity == module.resourceIdentity else { return }
        registry[module.id]?.healthy = true
        UserDefaults.standard.removeObject(forKey: "launching.\(module.id).\(module.resourceIdentity)")
        do { try persist() } catch { notice = "模块状态保存失败" }
    }
    func rollback(_ module: Module) {
        guard !HostConfiguration.usesBundledResources(defaults: defaults) else { return }
        guard let install = registry[module.id], install.active.resourceIdentity == module.resourceIdentity, !install.healthy else { return }
        clearLaunchMarker(module)
        rejectedVersions[module.id] = module.resourceIdentity
        do {
            try JSONEncoder().encode(rejectedVersions).write(to: root.appendingPathComponent("rejected.json"), options: .atomic)
            let fallback = install.previous ?? builtins[module.id]
            if let fallback, fallback.resourceIdentity != module.resourceIdentity, rejectedVersions[module.id] != fallback.resourceIdentity, install.minimumAllowedVersion.flatMap(ModuleVersion.init).map({ ModuleVersion(fallback.version)! >= $0 }) ?? true {
                registry[module.id] = Installed(active: fallback, previous: nil, healthy: true, minimumAllowedVersion: install.minimumAllowedVersion,
                                                 updatedAt: install.previousUpdatedAt, previousUpdatedAt: nil)
                try persist(); statuses[module.id] = "启动失败，已回退至 \(fallback.version)"
            } else { refresh(); statuses[module.id] = "页面启动失败，可重新打开" }
        } catch { notice = "回退失败：\(error.localizedDescription)" }
    }
    nonisolated private static func fetch(session: ModuleDownloadSession, url: URL, limit: Int, forceRefresh: Bool = false,
                                          timeout: TimeInterval = ModuleTransferTimeout.catalog,
                                          onProgress: (@Sendable (Int) -> Void)? = nil) async throws -> Data {
        guard NetworkPolicy.origin(url.absoluteString) != nil else { throw ModuleError.invalid("更新地址必须使用 HTTPS") }
        var components = URLComponents(url: url, resolvingAgainstBaseURL: false)!
        if forceRefresh { components.queryItems = (components.queryItems ?? []) + [URLQueryItem(name: "_refresh", value: UUID().uuidString)] }
        var request = URLRequest(url: components.url!)
        if forceRefresh { request.setValue("no-cache", forHTTPHeaderField: "Cache-Control") }
        request.timeoutInterval = timeout; request.cachePolicy = .reloadIgnoringLocalCacheData
        return try await session.download(request: request, limit: limit, onProgress: onProgress)
    }
    @discardableResult func checkForUpdates(forceSnapshot: Bool = false) async -> Bool {
        if HostConfiguration.usesBundledResources(defaults: defaults) {
            resourceModeChanged()
            return true
        }
        guard registryReadable else { return false }
        let force = forceSnapshot && HostConfiguration.usesSnapshot(defaults: defaults)
        guard !checking || force else { return false }
        updateTask?.cancel()
        let id = UUID()
        updateID = id
        checking = true
        let task = Task { @MainActor in
            let succeeded = await self.performUpdateCheck(forceSnapshot: force, id: id)
            if self.updateID == id {
                self.checking = false
                self.updateTask = nil
            }
            return succeeded
        }
        updateTask = task
        return await task.value
    }
    private func performUpdateCheck(forceSnapshot: Bool, id: UUID) async -> Bool {
        guard updateID == id else { return false }
        statuses.removeAll()
        downloadProgress.removeAll()
        downloadRecords = completedDownloads
        for module in modules { recordDownload(module.id, state: .checking, message: "正在检查更新…") }
        let catalogURL = config.updateCatalogURL(defaults: defaults)
        guard !catalogURL.isEmpty, let url = URL(string: catalogURL) else {
            notice = "当前使用内置模块；尚未配置更新目录。"
            finishPendingDownloadChecks(state: .failed, message: notice)
            return false
        }
        do {
            let catalogData = try await Self.fetch(session: session, url: url, limit: 1024 * 1024, forceRefresh: forceSnapshot)
            let catalog = try JSONDecoder().decode(Catalog.self, from: catalogData)
            try Task.checkCancellation()
            try catalog.validate()
            // A settings change during a request must not install the previous channel.
            guard catalogURL == config.updateCatalogURL(defaults: defaults) else { return false }
            notice = ""
            var pending: [Module] = []
            var complete = true
            for remote in catalog.modules {
                try Task.checkCancellation()
                if let current = modules.first(where: { $0.id == remote.id }) {
                    var installed = registry[remote.id] ?? Installed(active: current, healthy: true)
                    installed.minimumAllowedVersion = remote.minimumAllowedVersion; registry[remote.id] = installed
                    try persist()
                }
                guard Version(remote.minHostVersion)! <= Version(HostConfiguration.currentVersion)! else { statuses[remote.id] = "请更新 Lingrove 后使用新版"; recordDownload(remote.id, state: .deferred, message: statuses[remote.id]!); complete = false; continue }
                if let current = modules.first(where: { $0.id == remote.id }), current.isSnapshot == remote.isSnapshot && (remote.isSnapshot
                    ? current.sha256 == remote.sha256
                    : (ModuleVersion(current.version)! > ModuleVersion(remote.version)! || (current.version == remote.version && current.sha256 == remote.sha256))) { statuses[remote.id] = "已是最新版本"; recordDownload(remote.id, state: .unchanged, message: "已是最新版本"); continue }
                guard rejectedVersions[remote.id] != remote.resourceIdentity else { statuses[remote.id] = "此版本曾启动失败，等待后续版本"; recordDownload(remote.id, state: .deferred, message: statuses[remote.id]!); complete = false; continue }
                if activeSessions.contains(remote.id) { statuses[remote.id] = "发现更新，退出模块后再检查"; recordDownload(remote.id, state: .deferred, message: statuses[remote.id]!); complete = false; continue }
                recordDownload(remote.id, state: .waiting, message: "等待下载…")
                pending.append(remote)
            }
            let installed = await downloadAndInstall(pending, catalogURL: catalogURL, forceRefresh: forceSnapshot, id: id)
            if !Task.isCancelled && updateID == id {
                finishPendingDownloadChecks(state: .deferred, message: "更新目录中暂无此应用")
            }
            return complete && installed && !Task.isCancelled && updateID == id
        } catch {
            if Task.isCancelled || updateID != id { return false }
            notice = "更新检查失败，继续使用可用本地模块：\(error.localizedDescription)"
            finishPendingDownloadChecks(state: .failed, message: notice)
            return false
        }
    }
    private func downloadAndInstall(_ modules: [Module], catalogURL: String, forceRefresh: Bool, id: UUID) async -> Bool {
        guard !modules.isEmpty else { return true }
        var succeeded = true
        let session = self.session
        func clearOwnedDownloads() {
            for module in modules where downloadStatusOwners[module.id] == id {
                if statuses[module.id]?.hasPrefix("正在下载") == true {
                    statuses.removeValue(forKey: module.id)
                }
                downloadProgress.removeValue(forKey: module.id)
                downloadStatusOwners.removeValue(forKey: module.id)
            }
        }
        defer {
            clearOwnedDownloads()
        }
        await withTaskGroup(of: (Module, Result<Data, Error>).self) { group in
            var nextIndex = 0
            @MainActor func addNext() {
                guard nextIndex < modules.count else { return }
                let module = modules[nextIndex]
                nextIndex += 1
                statuses[module.id] = "正在下载 \(module.version)…"
                recordDownload(module.id, state: .downloading, message: "正在下载…")
                downloadProgress[module.id] = 0
                downloadStatusOwners[module.id] = id
                group.addTask {
                    guard let rawURL = module.downloadUrl,
                          let url = URL(string: rawURL),
                          let expectedHash = module.sha256, expectedHash.count == 64,
                          let size = module.size, size > 0, size <= 50 * 1024 * 1024 else {
                        return (module, .failure(ModuleError.invalid("下载元数据无效")))
                    }
                    do {
                        let data = try await Self.fetch(session: session, url: url, limit: size, forceRefresh: forceRefresh,
                                                        timeout: ModuleTransferTimeout.package) { received in
                            Task { @MainActor [weak self] in
                                guard let self, self.updateID == id,
                                      self.downloadStatusOwners[module.id] == id,
                                      self.downloadProgress[module.id] != nil else { return }
                                let progress = min(Double(received) / Double(size), 1)
                                if progress > self.downloadProgress[module.id, default: 0] {
                                    self.downloadProgress[module.id] = progress
                                }
                            }
                        }
                        return (module, .success(data))
                    } catch {
                        return (module, .failure(error))
                    }
                }
            }
            @MainActor func cancelRemaining() {
                group.cancelAll()
                clearOwnedDownloads()
            }
            @MainActor func isSuperseded() -> Bool {
                Task.isCancelled || updateID != id
            }
            for _ in 0..<min(Self.maxConcurrentDownloads, modules.count) { addNext() }
            downloadLoop: while let (module, result) = await group.next() {
                if isSuperseded() {
                    succeeded = false
                    cancelRemaining()
                    break downloadLoop
                }
                let status: String
                let downloadState: ModuleDownloadState
                switch result {
                case .success(let data):
                    do {
                        let installed = try install(module, data: data, catalogURL: catalogURL)
                        succeeded = succeeded && installed
                        status = installed ? "已更新至 \(module.version)" : "发现更新，退出模块后再检查"
                        downloadState = installed ? .succeeded : .deferred
                    } catch {
                        succeeded = false
                        status = "更新失败，保留本地版本：\(error.localizedDescription)"
                        downloadState = .failed
                    }
                case .failure(let error):
                    succeeded = false
                    status = "更新失败，保留本地版本：\(error.localizedDescription)"
                    downloadState = .failed
                }
                if isSuperseded() {
                    succeeded = false
                    cancelRemaining()
                    break downloadLoop
                }
                statuses[module.id] = status
                recordDownload(module.id, state: downloadState, message: downloadState == .succeeded ? "下载成功" : status)
                downloadProgress.removeValue(forKey: module.id)
                downloadStatusOwners.removeValue(forKey: module.id)
                addNext()
            }
        }
        return succeeded
    }
    private func install(_ module: Module, data: Data, catalogURL: String) throws -> Bool {
        guard let expectedHash = module.sha256, expectedHash.count == 64,
              let expectedSize = module.size, expectedSize > 0, expectedSize <= 50 * 1024 * 1024 else { throw ModuleError.invalid("下载元数据无效") }
        try Task.checkCancellation()
        guard data.count == expectedSize, SHA256.hash(data: data).map({ String(format: "%02x", $0) }).joined() == expectedHash else { throw ModuleError.invalid("安装包哈希不匹配") }
        // A module may have been opened while its package was downloading.
        guard !activeSessions.contains(module.id), catalogURL == config.updateCatalogURL(defaults: defaults) else { return false }
        let stage = root.appendingPathComponent("staging-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: stage, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: stage) }
        try StoredZIP.extract(data, to: stage)
        let manifest = try JSONDecoder().decode(Module.self, from: Data(contentsOf: stage.appendingPathComponent("manifest.json")))
        try manifest.validate()
        guard manifest.id == module.id, manifest.version == module.version, manifest.entry == module.entry,
              manifest.allowedOrigins == module.allowedOrigins, manifest.minHostVersion == module.minHostVersion,
              FileManager.default.fileExists(atPath: stage.appendingPathComponent(module.entry).path) else { throw ModuleError.invalid("包内清单与目录不一致") }
        let destination = root.appendingPathComponent("Modules/\(module.id)/\(module.resourceIdentity)")
        try FileManager.default.createDirectory(at: destination.deletingLastPathComponent(), withIntermediateDirectories: true)
        if FileManager.default.fileExists(atPath: destination.path) { try FileManager.default.removeItem(at: destination) }
        try FileManager.default.moveItem(at: stage, to: destination)
        var values = URLResourceValues(); values.isExcludedFromBackup = true; var moduleDirectory = destination; try moduleDirectory.setResourceValues(values)
        let current = modules.first { $0.id == module.id }
        let existing = registry[module.id]
        let sameIdentity = current?.resourceIdentity == module.resourceIdentity
        let previous = sameIdentity ? existing?.previous : current
        let previousUpdatedAt = sameIdentity ? existing?.previousUpdatedAt : existing?.updatedAt
        let oldRegistry = registry
        registry[module.id] = Installed(active: module, previous: previous, healthy: false, minimumAllowedVersion: module.minimumAllowedVersion,
                                         updatedAt: Date(), previousUpdatedAt: previousUpdatedAt)
        do { try persist() } catch { registry = oldRegistry; refresh(); throw error }
        // Keep at most the active and rollback versions; never remove state files.
        let retained = Set([module.resourceIdentity, previous?.resourceIdentity].compactMap { $0 })
        if let versions = try? FileManager.default.contentsOfDirectory(at: destination.deletingLastPathComponent(), includingPropertiesForKeys: nil) {
            for version in versions where !retained.contains(version.lastPathComponent) { try? FileManager.default.removeItem(at: version) }
        }
        return true
    }
}
