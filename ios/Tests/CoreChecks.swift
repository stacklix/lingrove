import Foundation
import CryptoKit

final class MockProtocol: URLProtocol, @unchecked Sendable {
    static var responses: [String: (Int, Data)] = [:]
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    static var intercept: ((MockProtocol) -> Bool)?
    override func startLoading() {
        if Self.intercept?(self) == true { return }
        respond()
    }
    func respond() {
        let (status, data) = Self.responses[request.url!.path] ?? (404, Data())
        client?.urlProtocol(self, didReceive: HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: ["Content-Length": "\(data.count)"])!, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: data); client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}
@main struct CoreChecks {
    @MainActor static func main() async throws {
        let fixtures = URL(fileURLWithPath: CommandLine.arguments[1])
        let root = fixtures.appendingPathComponent("state")
        #if DEBUG
        let originalMode = UserDefaults.standard.object(forKey: HostConfiguration.resourceModePreferenceKey)
        UserDefaults.standard.set(ChildAppResourceMode.bundled.rawValue, forKey: HostConfiguration.resourceModePreferenceKey)
        defer { UserDefaults.standard.set(originalMode, forKey: HostConfiguration.resourceModePreferenceKey) }
        #endif
        func hostConfiguration(catalogURL: String, snapshotCatalogURL: String) -> HostConfiguration {
            #if DEBUG
            return HostConfiguration(catalogURL: catalogURL, snapshotCatalogURL: snapshotCatalogURL)
            #else
            return HostConfiguration(catalogURL: catalogURL)
            #endif
        }
        func check(_ condition: @autoclosure () -> Bool, _ message: String) { precondition(condition(), message); print("PASS \(message)") }
        func rejects(_ message: String, _ operation: () throws -> Void) { do { try operation(); fatalError("Expected rejection: \(message)") } catch { print("PASS \(message)") } }
        #if DEBUG
        let debugSettingsSuite = "debug-addresses-\(UUID().uuidString)"
        let debugSettingsDefaults = UserDefaults(suiteName: debugSettingsSuite)!
        defer { debugSettingsDefaults.removePersistentDomain(forName: debugSettingsSuite) }
        var debugSettings = DebugServerSettings(addresses: [.init(id: "one", url: "http://localhost:8000"), .init(id: "two", url: "http://localhost:9000")], activeID: "one")
        debugSettings.activeID = "two"
        debugSettings.save(defaults: debugSettingsDefaults)
        check(DebugServerSettings.load(defaults: debugSettingsDefaults) == debugSettings && debugSettings.activeAddress == "http://localhost:9000", "multiple debug addresses persist with one active selection")
        debugSettings.updateAddress(id: "two", url: "http://localhost:9001")
        check(debugSettings.activeAddress == "http://localhost:9001" && debugSettings.addresses.count == 2, "editing a debug address preserves the radio selection")
        debugSettings.activeID = "one"
        debugSettings.removeAddress(id: "one")
        check(debugSettings.activeAddress == nil && debugSettings.addresses.map(\.id) == ["two"], "removing an active debug address clears its selection")
        debugSettings.addresses.append(.init(id: "blank", url: " \n "))
        debugSettings.activeID = "blank"
        debugSettings.save(defaults: debugSettingsDefaults)
        let savedDebugSettings = DebugServerSettings.load(defaults: debugSettingsDefaults)
        check(savedDebugSettings.addresses.map(\.id) == ["two"] && savedDebugSettings.activeID == nil, "empty debug rows are not saved and cannot remain selected")
        debugSettings = .init(addresses: [.init(id: "space", url: "  http://localhost:8000 \n")], activeID: "space")
        debugSettings.save(defaults: debugSettingsDefaults)
        check(DebugServerSettings.load(defaults: debugSettingsDefaults).activeAddress == "http://localhost:8000", "saved debug addresses trim surrounding whitespace")
        debugSettings = .init(addresses: [.init(id: "empty", url: "  ")], activeID: "empty")
        debugSettings.save(defaults: debugSettingsDefaults)
        check(debugSettingsDefaults.object(forKey: DebugServer.preferenceKey) == nil, "no debug configuration is saved when every row is empty")
        debugSettings = .init(addresses: [.init(id: "auth", url: "https://debug.example/development", requiresToken: true)], activeID: "auth")
        debugSettings.save(defaults: debugSettingsDefaults)
        check(DebugServerSettings.load(defaults: debugSettingsDefaults).activeServer?.requiresToken == true, "debug authentication status persists per address")
        debugSettingsDefaults.set(ChildAppResourceMode.debug.rawValue, forKey: HostConfiguration.resourceModePreferenceKey)
        for path in ["catalog.snapshot.json", "app/verso/assets/index.js", "packages/verso.zip"] {
            check(DebugServer.configuredAddress(for: URL(string: "https://debug.example/development/snapshot/\(path)")!, defaults: debugSettingsDefaults) != nil, "debug authentication covers \(path)")
        }
        for raw in ["https://other.example/development/snapshot/app/verso/index.html", "http://debug.example/development/snapshot/app/verso/index.html", "https://debug.example:444/development/snapshot/app/verso/index.html", "https://debug.example/snapshot/catalog.snapshot.json", "https://debug.example/development/snapshot-evil/app/index.html", "https://debug.example/development/catalog.json", "https://debug.example/v1/chat/completions"] {
            check(DebugServer.configuredAddress(for: URL(string: raw)!, defaults: debugSettingsDefaults) == nil, "debug Token excluded from \(raw)")
        }
        debugSettingsDefaults.set(ChildAppResourceMode.bundled.rawValue, forKey: HostConfiguration.resourceModePreferenceKey)
        check(DebugServer.configuredAddress(for: URL(string: "https://debug.example/development/snapshot/catalog.snapshot.json")!, defaults: debugSettingsDefaults) == nil, "bundled mode never attaches debug credentials")
        var authenticatedRequest = URLRequest(url: URL(string: "https://debug.example/")!)
        try DebugServer.authorize(&authenticatedRequest, token: " Ab12Cd\n")
        check(authenticatedRequest.value(forHTTPHeaderField: "Stack-Pass") == "Ab12Cd", "debug Token is sent in Stack-Pass header")
        check(authenticatedRequest.value(forHTTPHeaderField: "Authorization") == nil, "debug authentication does not set Authorization")
        rejects("debug Token rejects header injection") { _ = try DebugServer.validatedToken("token\r\nX-Injected: true") }
        for token in ["Ab12Cd", "123456", "ABCdef"] {
            let validated = try DebugServer.validatedToken(token)
            check(validated == token, "debug Token accepts six ASCII letters or digits: \(token)")
        }
        for token in ["abc12", "abcd123", "abc-12", "中文1234"] {
            rejects("debug Token rejects invalid format: \(token)") { _ = try DebugServer.validatedToken(token) }
        }
        #endif
        check(Version("1.10.0")! > Version("1.2.0")!, "semantic version ordering")
        check(Version("../1") == nil && Version("1.2") == nil, "invalid versions rejected")
        check(ModuleVersion("20261231")! < ModuleVersion("20270101")!, "build-date versions sort across years")
        check(ModuleVersion("20240229") != nil && ModuleVersion("20260229") == nil && ModuleVersion("20261301") == nil && ModuleVersion("20260431") == nil && ModuleVersion("00000101") == nil && ModuleVersion("1.2.0") == nil, "module versions require valid yyyyMMdd dates")
        check(NetworkPolicy.allows(URL(string: "https://api.example.com/a")!, origins: ["https://api.example.com"]), "allowed origin")
        check(!NetworkPolicy.allows(URL(string: "https://api.example.com.evil.test")!, origins: ["https://api.example.com"]), "suffix spoof rejected")
        check(!NetworkPolicy.allows(URL(string: "https://api.example.com:444/a")!, origins: ["https://api.example.com"]), "port mismatch rejected")
        for name in ["traversal", "absolute", "compressed", "symlink", "truncated"] {
            let destination = fixtures.appendingPathComponent("extract-\(name)")
            try FileManager.default.createDirectory(at: destination, withIntermediateDirectories: true)
            rejects("reject ZIP \(name)") { try StoredZIP.extract(Data(contentsOf: fixtures.appendingPathComponent("\(name).zip")), to: destination) }
        }
        var module = try JSONDecoder().decode(Module.self, from: Data(contentsOf: fixtures.appendingPathComponent("builtin/sentra/manifest.json")))
        check(module.description(for: "zh-Hans") == module.description, "Chinese introduction comes from default module metadata")
        check(module.description(for: "en") == module.localizedDescriptions?["en"] && module.description(for: "en") != module.description, "English introduction comes from module metadata")
        check(module.description(for: "ja") == module.localizedDescriptions?["ja"] && module.description(for: "ja") != module.description, "Japanese introduction comes from module metadata")
        check(module.description(for: "fr") == module.description, "missing introduction language uses the module default")
        var networkModule = module
        networkModule.allowedOrigins = ["https://api.example.com", "https://api.example.com"]
        networkModule.downloadUrl = "https://updates.test/module.zip"
        let domainSummary = NetworkAccessDomain.snapshot(
            modules: [networkModule],
            customOrigins: [module.id: ["https://api.example.com", "https://custom.test:8443", "http://invalid.test"], "uninstalled": ["https://old.test"]],
            catalogURL: "https://updates.test/catalog.json", modelURL: "https://model.test/v1/chat/completions",
            debugURL: "http://192.168.1.10:8000/apps/"
        )
        #if DEBUG
        let debugOrigins = ["http://192.168.1.10:8000"]
        #else
        let debugOrigins: [String] = []
        #endif
        check(domainSummary.map(\.origin) == debugOrigins + ["https://api.example.com", "https://custom.test:8443", "https://model.test", "https://updates.test"], "network summary includes only services available in this build")
        check(domainSummary.first(where: { $0.origin == "https://api.example.com" })?.sources.count == 2, "network summary retains manifest and custom authorization sources")
        check(domainSummary.filter { $0.moduleID == nil }.map(\.origin) == debugOrigins + ["https://model.test", "https://updates.test"], "host model and update destinations belong to public group")
        check(domainSummary.filter { $0.moduleID == module.id }.map(\.origin) == ["https://api.example.com", "https://custom.test:8443"], "child app domains retain their owner")
        let sharedSummary = NetworkAccessDomain.snapshot(modules: [networkModule], customOrigins: [module.id: ["https://api.example.com", "https://custom.test:8443"]], catalogURL: "", modelURL: "https://API.example.com:443/v1", debugURL: nil)
        let modelDomains = sharedSummary.filter { $0.origin == "https://api.example.com" }
        check(modelDomains.count == 2 && modelDomains.contains { $0.moduleID == module.id } && modelDomains.contains { $0.moduleID == nil }, "summary shows actual authorizations without model-domain filtering")
        check(sharedSummary.contains { $0.origin == "https://custom.test:8443" && $0.moduleID == module.id }, "other child app domains remain visible")
        let revokedSummary = NetworkAccessDomain.snapshot(modules: [networkModule], customOrigins: [:], catalogURL: "", modelURL: nil, debugURL: nil)
        check(revokedSummary.map(\.origin) == ["https://api.example.com", "https://updates.test"], "revocation removes only custom origins; disabled services omitted")
        func catalog(_ module: Module) throws -> Data {
            try JSONEncoder().encode(Catalog(modules: [module]))
        }
        let decoded = try JSONDecoder().decode(Catalog.self, from: catalog(module))
        try decoded.validate()
        check(decoded.modules.count == 1, "plain JSON catalog accepted without keys")
        rejects("duplicate modules rejected") { try Catalog(modules: [module, module]).validate() }
        rejects("malformed catalog rejected") { _ = try JSONDecoder().decode(Catalog.self, from: Data("{}".utf8)) }
        let config = URLSessionConfiguration.ephemeral; config.protocolClasses = [MockProtocol.self]
        let session = URLSession(configuration: config)
        #if DEBUG
        let metadataSuite = "debug-metadata-\(UUID().uuidString)"
        let metadataDefaults = UserDefaults(suiteName: metadataSuite)!
        defer { metadataDefaults.removePersistentDomain(forName: metadataSuite) }
        metadataDefaults.set(ChildAppResourceMode.debug.rawValue, forKey: HostConfiguration.resourceModePreferenceKey)
        let metadataConfig = hostConfiguration(catalogURL: "https://updates.test/catalog.json", snapshotCatalogURL: "https://updates.test/snapshot/catalog.snapshot.json")
        let metadataRoot = fixtures.appendingPathComponent("debug-metadata")
        let metadataStore = ModuleStore(root: metadataRoot, config: metadataConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"), defaults: metadataDefaults)
        var renamedDebugModule = module
        renamedDebugModule.name = "Lexis"
        renamedDebugModule.localizedDescriptions = ["en": "English introduction", "ja": "Japanese introduction"]
        renamedDebugModule.webUrl = "https://updates.test/snapshot/app/sentra/index.html"
        var added = module
        added.id = "new-app"; added.name = "New App"
        added.webUrl = "https://updates.test/snapshot/app/new-app/index.html"
        MockProtocol.responses = ["/snapshot/catalog.snapshot.json": (200, try JSONEncoder().encode(Catalog(modules: [renamedDebugModule, added])))]
        var metadataRequests: [URLRequest] = []
        MockProtocol.intercept = { request in metadataRequests.append(request.request); return false }
        let metadataSucceeded = await metadataStore.checkForUpdates()
        check(metadataSucceeded, "debug snapshot catalog refresh succeeds without a configured debug server")
        check(Set(metadataStore.modules.map(\.id)) == Set([module.id, added.id]), "debug catalog adds new apps")
        check(metadataStore.modules.first { $0.id == module.id }?.name == "Lexis", "snapshot catalog refreshes existing names")
        check(metadataStore.modules.first { $0.id == module.id }?.description(for: "ja") == "Japanese introduction", "catalog refreshes translated descriptions")
        check(metadataRequests.count == 1 && metadataRequests[0].url?.path == "/snapshot/catalog.snapshot.json", "debug mode fetches snapshot catalog without downloading ZIPs")
        let metadataRestart = ModuleStore(root: metadataRoot, config: metadataConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"), defaults: metadataDefaults)
        check(metadataRestart.modules == [module], "debug restart starts with local builtins until snapshot catalog succeeds")
        MockProtocol.responses["/snapshot/catalog.snapshot.json"] = (503, Data())
        let metadataFailed = await metadataStore.checkForUpdates()
        check(!metadataFailed && metadataStore.modules == metadataRestart.modules, "failed snapshot catalog uses local builtins")
        MockProtocol.responses["/snapshot/catalog.snapshot.json"] = (200, try catalog(added))
        await metadataStore.checkForUpdates()
        check(metadataStore.modules.map(\.id) == [added.id], "catalog removes retired apps from the displayed list")
        var heldMetadataRequest: MockProtocol?
        MockProtocol.intercept = { request in
            guard request.request.url?.path == "/snapshot/catalog.snapshot.json" else { return false }
            heldMetadataRequest = request
            return true
        }
        let pendingMetadata = Task { await metadataStore.checkForUpdates() }
        for _ in 0..<1_000 {
            if heldMetadataRequest != nil { break }
            try await Task.sleep(for: .milliseconds(10))
        }
        check(heldMetadataRequest != nil, "catalog check is in flight before mode switch")
        metadataDefaults.set(ChildAppResourceMode.bundled.rawValue, forKey: HostConfiguration.resourceModePreferenceKey)
        metadataStore.resourceModeChanged()
        let cancelledMetadata = await pendingMetadata.value
        MockProtocol.intercept = nil
        check(!cancelledMetadata && metadataStore.modules.map(\.id) == [module.id], "cancelled snapshot request cannot overwrite the normal list")
        check(metadataConfig.updateCatalogURL(defaults: metadataDefaults).hasSuffix("/catalog.json"), "normal mode selects release catalog")
        #endif
        var localizedUpdate = try JSONDecoder().decode(Module.self, from: Data(contentsOf: fixtures.appendingPathComponent("localized-update.json")))
        let localizedArchive = try Data(contentsOf: fixtures.appendingPathComponent("localized-update.zip"))
        localizedUpdate.downloadUrl = "https://updates.test/localized-update.zip"
        localizedUpdate.size = localizedArchive.count
        localizedUpdate.sha256 = SHA256.hash(data: localizedArchive).map { String(format: "%02x", $0) }.joined()
        let localizedConfig = hostConfiguration(catalogURL: "https://updates.test/localized-catalog.json", snapshotCatalogURL: "https://updates.test/localized-catalog.json")
        let localizedRoot = fixtures.appendingPathComponent("localized-state")
        let localizedStore = ModuleStore(root: localizedRoot, config: localizedConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        MockProtocol.responses = ["/localized-catalog.json": (200, try catalog(localizedUpdate)), "/localized-update.zip": (200, localizedArchive)]
        await localizedStore.checkForUpdates()
        check(localizedStore.modules.first?.description(for: "en") == "Updated description delivered by the child app.", "child-app update replaces introduction without a host translation")
        let localizedRestart = ModuleStore(root: localizedRoot, config: localizedConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(localizedRestart.modules.first?.localizedDescriptions == module.localizedDescriptions, "restart initially uses builtin introductions")
        await localizedRestart.checkForUpdates()
        check(localizedRestart.modules.first?.localizedDescriptions == localizedUpdate.localizedDescriptions, "fresh catalog restores updated introductions")
        let hostConfig = hostConfiguration(catalogURL: "https://updates.test/catalog.json", snapshotCatalogURL: "https://updates.test/catalog.json")
        let store = ModuleStore(root: root, config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(store.modules.first?.version == "20260101", "bundled module available offline")
        let archive = try Data(contentsOf: fixtures.appendingPathComponent("valid.zip"))
        module.version = "20260102"; module.downloadUrl = "https://updates.test/module.zip"; module.size = archive.count
        module.sha256 = SHA256.hash(data: archive).map { String(format: "%02x", $0) }.joined()
        MockProtocol.responses = ["/catalog.json": (200, try catalog(module)), "/module.zip": (200, archive)]
        let insecureStore = ModuleStore(root: fixtures.appendingPathComponent("http-state"), config: hostConfiguration(catalogURL: "http://updates.test/catalog.json", snapshotCatalogURL: "http://updates.test/catalog.json"), session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        await insecureStore.checkForUpdates()
        check(insecureStore.modules.first?.version == "20260101" && insecureStore.notice.contains("HTTPS"), "HTTP catalog rejected before download")
        let bundledModule = store.modules[0]
        MockProtocol.intercept = { request in
            guard request.request.url?.path == "/module.zip" else { return false }
            Task { @MainActor in
                store.begin(bundledModule)
                request.respond()
            }
            return true
        }
        let deferredUpdateSucceeded = await store.checkForUpdates()
        check(!deferredUpdateSucceeded, "deferred update must not report refresh success")
        check(store.modules.first?.version == "20260101", "opening during download preserves the running version")
        check(store.statuses[module.id] == "发现更新，退出模块后再检查", "update is deferred while module is open")
        store.end(bundledModule)
        MockProtocol.intercept = nil
        let updateSucceeded = await store.checkForUpdates()
        check(updateSucceeded, "successful update reports refresh success")
        check(store.modules.first?.version == "20260102", "HTTPS plain catalog update installed and activated")
        check(store.lastUpdatedAt(for: store.modules[0]) != nil, "successful ZIP install records its update time")
        check(FileManager.default.fileExists(atPath: store.directory(for: module).appendingPathComponent("index.html").path), "installed resources readable")
        var parallel = try JSONDecoder().decode(Module.self, from: Data(contentsOf: fixtures.appendingPathComponent("concurrent/builtin/parallel/manifest.json")))
        parallel.version = "20260102"
        parallel.downloadUrl = "https://updates.test/parallel.zip"
        let parallelArchive = try Data(contentsOf: fixtures.appendingPathComponent("parallel.zip"))
        parallel.size = parallelArchive.count
        parallel.sha256 = SHA256.hash(data: parallelArchive).map { String(format: "%02x", $0) }.joined()
        var concurrentModule = module
        concurrentModule.downloadUrl = "https://updates.test/module.zip"
        concurrentModule.size = archive.count
        concurrentModule.sha256 = SHA256.hash(data: archive).map { String(format: "%02x", $0) }.joined()
        let concurrentConfig = hostConfiguration(catalogURL: "https://updates.test/concurrent-catalog.json", snapshotCatalogURL: "https://updates.test/concurrent-catalog.json")
        let concurrentStore = ModuleStore(root: fixtures.appendingPathComponent("concurrent/state"), config: concurrentConfig, session: session,
                                          builtinRoot: fixtures.appendingPathComponent("concurrent/builtin"))
        MockProtocol.responses["/concurrent-catalog.json"] = (200, try JSONEncoder().encode(Catalog(modules: [concurrentModule, parallel])))
        MockProtocol.responses["/parallel.zip"] = (200, parallelArchive)
        let lock = NSLock()
        var heldDownloads: [MockProtocol] = []
        MockProtocol.intercept = { request in
            guard ["/module.zip", "/parallel.zip"].contains(request.request.url?.path ?? "") else { return false }
            lock.lock()
            heldDownloads.append(request)
            lock.unlock()
            return true
        }
        let concurrentCheck = Task { await concurrentStore.checkForUpdates() }
        func heldDownloadCount() -> Int {
            lock.lock(); defer { lock.unlock() }
            return heldDownloads.count
        }
        for _ in 0..<500 where heldDownloadCount() < 2 { try await Task.sleep(for: .milliseconds(10)) }
        check(heldDownloadCount() == 2 && concurrentStore.downloadProgress.count == 2, "parallel ZIP downloads expose per-app progress")
        lock.lock()
        let pendingDownloads = heldDownloads
        lock.unlock()
        pendingDownloads.forEach { $0.respond() }
        await concurrentCheck.value
        MockProtocol.intercept = nil
        check(concurrentStore.modules.count == 2 && concurrentStore.modules.allSatisfy { $0.version == "20260102" }, "multiple app ZIPs download concurrently and install")
        check(concurrentStore.modules.allSatisfy { concurrentStore.lastUpdatedAt(for: $0) != nil }, "parallel installs record each app update time")
        store.markHealthy(module)
        store.rollback(module)
        check(store.modules.first?.version == module.version && !store.blocked.contains(module.id), "healthy version is never rejected after a runtime failure")
        let restarted = ModuleStore(root: root, config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(restarted.modules.first?.version == "20260101", "restart uses bundled version before a fresh catalog succeeds")
        let rejectedRoot = fixtures.appendingPathComponent("rejected-state")
        try FileManager.default.copyItem(at: root, to: rejectedRoot)
        try JSONEncoder().encode(["sentra": module.version]).write(to: rejectedRoot.appendingPathComponent("rejected.json"))
        let restartedStore = ModuleStore(root: rejectedRoot, config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(!restartedStore.blocked.contains("sentra"), "previously rejected version opens directly without a recovery action")
        let retryRestart = ModuleStore(root: rejectedRoot, config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(!retryRestart.blocked.contains("sentra"), "previous failure does not block opening after host restart")
        let upgradedBuiltin = fixtures.appendingPathComponent("upgraded-builtin")
        try FileManager.default.copyItem(at: fixtures.appendingPathComponent("builtin"), to: upgradedBuiltin)
        var bundledUpgrade = module; bundledUpgrade.version = "20260104"
        try JSONEncoder().encode(bundledUpgrade).write(to: upgradedBuiltin.appendingPathComponent("sentra/manifest.json"))
        let upgradeRoot = fixtures.appendingPathComponent("upgrade-state")
        try FileManager.default.copyItem(at: root, to: upgradeRoot)
        let upgradedHost = ModuleStore(root: upgradeRoot, config: hostConfig, session: session, builtinRoot: upgradedBuiltin)
        check(upgradedHost.modules.first?.version == "20260104", "new bundled version supersedes older persisted registry")
        MockProtocol.responses["/catalog.json"] = (200, Data("{}".utf8))
        await store.checkForUpdates()
        check(store.modules.first?.version == "20260102" && store.notice.contains("更新检查失败"), "invalid JSON catalog preserves active module")
        check(store.statuses.isEmpty, "failed update check clears previous per-module results")
        module.version = "20260103"; module.sha256 = String(repeating: "0", count: 64)
        MockProtocol.responses["/catalog.json"] = (200, try catalog(module))
        let badHashSucceeded = await store.checkForUpdates()
        check(!badHashSucceeded, "failed package installation must not report refresh success")
        check(store.modules.first?.version == "20260102", "bad hash preserves old version")
        let newer = try Data(contentsOf: fixtures.appendingPathComponent("newer.zip"))
        module.size = newer.count; module.sha256 = SHA256.hash(data: newer).map { String(format: "%02x", $0) }.joined()
        MockProtocol.responses = ["/catalog.json": (200, try catalog(module)), "/module.zip": (200, newer)]
        await store.checkForUpdates(); check(store.modules.first?.version == "20260103", "next update installed")
        store.rollback(module); check(store.modules.first?.version == "20260102", "failed startup rolls back to previous version")
        await store.checkForUpdates(); check(store.modules.first?.version == "20260102", "known bad version is not reinstalled")
        MockProtocol.responses["/catalog.json"] = (500, Data())
        let offlineSucceeded = await store.checkForUpdates()
        check(!offlineSucceeded, "offline update must not report refresh success")
        check(store.modules.first?.version == "20260101", "failed formal catalog uses builtin version")
        module.minimumAllowedVersion = "20260103"
        MockProtocol.responses["/catalog.json"] = (200, try catalog(module))
        await store.checkForUpdates()
        check(store.blocked.contains("sentra"), "mandatory minimum blocks retired fallback")
        let blockedRestart = ModuleStore(root: root, config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(!blockedRestart.blocked.contains("sentra"), "offline builtin fallback does not inherit downloaded-package blocking")
        module.version = "20260105"; module.minHostVersion = "2.0.0"
        MockProtocol.responses["/catalog.json"] = (200, try catalog(module))
        await store.checkForUpdates()
        check(store.modules.first?.version == "20260102", "incompatible host version never installed")
        let brokenRoot = fixtures.appendingPathComponent("broken-registry")
        try FileManager.default.createDirectory(at: brokenRoot, withIntermediateDirectories: true)
        try Data("broken".utf8).write(to: brokenRoot.appendingPathComponent("registry.json"))
        let brokenStore = ModuleStore(root: brokenRoot, config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(brokenStore.modules.first?.version == "20260101", "corrupt registry still exposes bundled module")
        await brokenStore.checkForUpdates()
        check(try! String(contentsOf: brokenRoot.appendingPathComponent("registry.json"), encoding: .utf8) == "broken", "corrupt registry preserved without overwrite")
        let releaseDefaults = UserDefaults(suiteName: "release-date-tests-\(UUID().uuidString)")!
        #if DEBUG
        releaseDefaults.set(ChildAppResourceMode.bundled.rawValue, forKey: HostConfiguration.resourceModePreferenceKey)
        #endif
        let releaseStore = ModuleStore(root: fixtures.appendingPathComponent("release-dates"), config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"), defaults: releaseDefaults)
        var sameDayRelease = bundledModule
        sameDayRelease.version = "20260102"
        sameDayRelease.downloadUrl = "https://updates.test/module.zip"
        sameDayRelease.size = archive.count
        sameDayRelease.sha256 = SHA256.hash(data: archive).map { String(format: "%02x", $0) }.joined()
        MockProtocol.responses = ["/catalog.json": (200, try catalog(sameDayRelease)), "/module.zip": (200, archive)]
        await releaseStore.checkForUpdates()
        releaseStore.markHealthy(sameDayRelease)
        let revisedRelease = try Data(contentsOf: fixtures.appendingPathComponent("rebuilt.zip"))
        sameDayRelease.size = revisedRelease.count
        sameDayRelease.sha256 = SHA256.hash(data: revisedRelease).map { String(format: "%02x", $0) }.joined()
        MockProtocol.responses = ["/catalog.json": (200, try catalog(sameDayRelease)), "/module.zip": (200, revisedRelease)]
        await releaseStore.checkForUpdates()
        check(releaseStore.modules.first?.sha256 == sameDayRelease.sha256, "same-day release updates when package hash changes")
        releaseStore.rollback(sameDayRelease)
        check(releaseStore.modules.first?.sha256 != sameDayRelease.sha256 && releaseStore.modules.first?.version == sameDayRelease.version, "same-day release rollback retains the previous package")
        let channelSuite = "channel-tests-\(UUID().uuidString)"
        let channelDefaults = UserDefaults(suiteName: channelSuite)!
        defer { channelDefaults.removePersistentDomain(forName: channelSuite) }
        let channelConfig = hostConfiguration(catalogURL: "https://updates.test/catalog.json", snapshotCatalogURL: "https://updates.test/snapshot/catalog.snapshot.json")
        check(channelConfig.updateCatalogURL(defaults: channelDefaults).hasSuffix("/catalog.json"), "normal mode selects release catalog")
        let channelRoot = fixtures.appendingPathComponent("channels")
        let channelStore = ModuleStore(root: channelRoot, config: channelConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"), defaults: channelDefaults)
        var release = module
        release.version = "20260102"; release.minHostVersion = bundledModule.minHostVersion; release.minimumAllowedVersion = nil
        release.downloadUrl = "https://updates.test/module.zip"
        release.size = archive.count
        release.sha256 = SHA256.hash(data: archive).map { String(format: "%02x", $0) }.joined()
        MockProtocol.responses = ["/catalog.json": (200, try catalog(release)), "/module.zip": (200, archive)]
        var channelRequests: [URLRequest] = []
        MockProtocol.intercept = { request in channelRequests.append(request.request); return false }
        await channelStore.checkForUpdates()
        check(channelRequests.first { $0.url?.path == "/catalog.json" }?.timeoutInterval == 60, "catalog requests allow one minute without a response")
        check(channelRequests.first { $0.url?.path == "/module.zip" }?.timeoutInterval == 300, "package requests allow five minutes without a response")
        check(channelStore.modules.first?.resourceIdentity == release.resourceIdentity && channelStore.isDownloaded(release), "normal mode installs release package")
        channelStore.markHealthy(release)
        let firstDownloadTime = channelStore.lastUpdatedAt(for: release)
        check(firstDownloadTime != nil && channelStore.downloadRecords[release.id]?.state == .succeeded, "release records successful download and install time")
        let downloadRecord = channelStore.downloadRecords[release.id]!
        check(downloadRecord.isVisible(at: downloadRecord.completedAt!.addingTimeInterval(4.999)), "download result is visible for five seconds")
        check(!downloadRecord.isVisible(at: downloadRecord.completedAt!.addingTimeInterval(5)), "download result expires after five seconds")
        let restartedNormal = ModuleStore(root: channelRoot, config: channelConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"), defaults: channelDefaults)
        check(restartedNormal.modules == [bundledModule] && restartedNormal.downloadRecords[release.id] == downloadRecord, "restart uses builtins and preserves download history")
        channelRequests.removeAll()
        await channelStore.checkForUpdates(forceRefresh: true)
        check(channelRequests.count == 1 && channelRequests[0].url?.path == "/catalog.json", "manual normal refresh fetches catalog and skips identical ZIP")
        check(channelRequests[0].url?.query?.contains("_refresh=") == true && channelRequests[0].value(forHTTPHeaderField: "Cache-Control") == "no-cache", "manual refresh bypasses intermediary caches")
        check(channelStore.lastUpdatedAt(for: release) == firstDownloadTime, "checking without downloading preserves download time")
        var blockedRequest = false
        MockProtocol.intercept = { request in
            if !blockedRequest && request.request.url?.path == "/catalog.json" { blockedRequest = true; return true }
            return false
        }
        let backgroundCheck = Task { await channelStore.checkForUpdates() }
        while !blockedRequest { try await Task.sleep(for: .milliseconds(10)) }
        await channelStore.checkForUpdates(forceRefresh: true)
        await backgroundCheck.value
        check(!channelStore.checking && channelStore.notice.isEmpty, "manual refresh supersedes an in-flight automatic check")
        MockProtocol.intercept = nil
        MockProtocol.responses["/catalog.json"] = (503, Data())
        await channelStore.checkForUpdates()
        check(channelStore.downloadRecords[release.id]?.state == .failed && channelStore.modules == [bundledModule] && channelStore.lastUpdatedAt(for: release) == nil, "failed catalog refresh uses builtin resources without deleting downloads")
        #if DEBUG
        channelDefaults.set(ChildAppResourceMode.debug.rawValue, forKey: HostConfiguration.resourceModePreferenceKey)
        channelStore.resourceModeChanged()
        var debugModule = module
        debugModule.id = "debug-app"; debugModule.name = "Debug App"
        debugModule.downloadUrl = nil; debugModule.size = nil; debugModule.sha256 = nil
        debugModule.webUrl = "https://updates.test/snapshot/app/debug-app/index.html"
        MockProtocol.responses["/snapshot/catalog.snapshot.json"] = (200, try catalog(debugModule))
        channelRequests.removeAll()
        MockProtocol.intercept = { request in channelRequests.append(request.request); return false }
        await channelStore.checkForUpdates(forceRefresh: true)
        check(channelRequests.count == 1 && channelRequests[0].url?.path == "/snapshot/catalog.snapshot.json", "manual debug refresh fetches an HTML-only snapshot without ZIPs")
        check(channelRequests[0].url?.query?.contains("_refresh=") == true && channelRequests[0].value(forHTTPHeaderField: "Cache-Control") == "no-cache", "manual debug refresh bypasses cached catalog responses")
        check(channelStore.modules.map(\.id) == [debugModule.id], "debug catalog owns list independently of normal catalog")
        check(channelStore.remoteEntryURL(for: debugModule) != nil, "HTML-only snapshot uses the shared remote loader")
        MockProtocol.responses["/snapshot/catalog.snapshot.json"] = (503, Data())
        channelRequests.removeAll()
        await channelStore.checkForUpdates()
        check(channelRequests.map { $0.url!.path } == ["/snapshot/catalog.snapshot.json"] && channelStore.modules == [bundledModule], "failed snapshot catalog uses local resources without consulting release channel")
        channelDefaults.set(ChildAppResourceMode.bundled.rawValue, forKey: HostConfiguration.resourceModePreferenceKey)
        channelStore.resourceModeChanged()
        check(channelStore.modules == [bundledModule], "leaving debug uses builtins until formal catalog refresh succeeds")
        MockProtocol.intercept = nil
        let cancellationSuite = "cancel-tests-\(UUID().uuidString)"
        let cancellationDefaults = UserDefaults(suiteName: cancellationSuite)!
        defer { cancellationDefaults.removePersistentDomain(forName: cancellationSuite) }
        cancellationDefaults.set(ChildAppResourceMode.bundled.rawValue, forKey: HostConfiguration.resourceModePreferenceKey)
        var cancellableModule = bundledModule
        cancellableModule.version = "20260102"
        cancellableModule.downloadUrl = "https://updates.test/cancel-module.zip"
        cancellableModule.size = archive.count
        cancellableModule.sha256 = SHA256.hash(data: archive).map { String(format: "%02x", $0) }.joined()
        let cancellationConfig = hostConfiguration(
            catalogURL: "https://updates.test/cancel-catalog.json",
            snapshotCatalogURL: "https://updates.test/cancel-snapshot-catalog.json"
        )
        let cancellationStore = ModuleStore(
            root: fixtures.appendingPathComponent("cancel-state"),
            config: cancellationConfig,
            session: session,
            builtinRoot: fixtures.appendingPathComponent("builtin"),
            defaults: cancellationDefaults
        )
        MockProtocol.responses["/cancel-catalog.json"] = (200, try catalog(cancellableModule))
        MockProtocol.responses["/cancel-snapshot-catalog.json"] = (200, try JSONEncoder().encode(Catalog(modules: [])))
        let cancellationLock = NSLock()
        var cancelledTransfer: MockProtocol?
        MockProtocol.intercept = { request in
            guard request.request.url?.path == "/cancel-module.zip" else { return false }
            cancellationLock.lock()
            cancelledTransfer = request
            cancellationLock.unlock()
            return true
        }
        let pendingCheck = Task { await cancellationStore.checkForUpdates() }
        for _ in 0..<500 {
            cancellationLock.lock()
            let isHeld = cancelledTransfer != nil
            cancellationLock.unlock()
            if isHeld { break }
            try await Task.sleep(for: .milliseconds(10))
        }
        cancellationLock.lock()
        let isHeld = cancelledTransfer != nil
        cancellationLock.unlock()
        check(isHeld && cancellationStore.downloadProgress["sentra"] == 0, "in-flight ZIP exposes progress before cancellation")
        cancellationDefaults.set(ChildAppResourceMode.debug.rawValue, forKey: HostConfiguration.resourceModePreferenceKey)
        cancellationStore.resourceModeChanged()
        await pendingCheck.value
        MockProtocol.intercept = nil
        check(cancellationStore.modules.first?.version == "20260101", "enabling debug cancels an in-flight release ZIP without installing it")
        check(cancellationStore.downloadProgress.isEmpty && cancellationStore.statuses["sentra"] != "正在下载 1.1.0…",
              "cancelling a ZIP download clears progress and stale status")
        #else
        check(channelConfig.updateCatalogURL(defaults: channelDefaults).hasSuffix("/catalog.json"), "Release always uses formal catalog")
        #endif
        #if DEBUG
        let sharedModes: [ChildAppResourceMode] = [.bundled, .debug]
        #else
        let sharedModes: [ChildAppResourceMode] = [.bundled]
        #endif
        for mode in sharedModes {
            let suite = "shared-resources-\(UUID().uuidString)"
            let defaults = UserDefaults(suiteName: suite)!
            defer { defaults.removePersistentDomain(forName: suite) }
            #if DEBUG
            defaults.set(mode.rawValue, forKey: HostConfiguration.resourceModePreferenceKey)
            if mode == .debug {
                DebugServerSettings(addresses: [.init(id: "local", url: "http://localhost:8000/dev")], activeID: "local").save(defaults: defaults)
            }
            #endif
            let config = hostConfiguration(catalogURL: "https://updates.test/shared-catalog.json",
                                           snapshotCatalogURL: "https://updates.test/snapshot/catalog.snapshot.json")
            let catalogURL = URL(string: config.updateCatalogURL(defaults: defaults))!
            let sharedRoot = fixtures.appendingPathComponent("shared-\(mode.rawValue)")
            let builtin = sharedRoot.appendingPathComponent("builtin/sentra")
            try FileManager.default.createDirectory(at: builtin, withIntermediateDirectories: true)
            try StoredZIP.extract(archive, to: builtin)
            var remote = try JSONDecoder().decode(Module.self, from: Data(contentsOf: builtin.appendingPathComponent("manifest.json")))
            remote.downloadUrl = "https://updates.test/packages/sentra-\(remote.version).zip"
            remote.webUrl = "https://updates.test/app/sentra/index.html"
            remote.size = archive.count
            remote.sha256 = SHA256.hash(data: archive).map { String(format: "%02x", $0) }.joined()
            #if DEBUG
            let resolved = mode == .debug ? (try DebugServer.resolve(Catalog(modules: [remote]), relativeTo: catalogURL).modules[0]) : remote
            #else
            let resolved = remote
            #endif
            let zipURL = URL(string: resolved.downloadUrl!)!
            MockProtocol.responses = [catalogURL.path: (200, try catalog(remote)), zipURL.path: (200, archive)]
            var requests: [URLRequest] = []
            MockProtocol.intercept = { request in requests.append(request.request); return false }
            defer { MockProtocol.intercept = nil }
            let identicalBuiltin = ModuleStore(root: sharedRoot.appendingPathComponent("same"), config: config, session: session,
                builtinRoot: builtin.deletingLastPathComponent(), builtinHashes: [remote.id: remote.sha256!], defaults: defaults)
            let builtinSucceeded = await identicalBuiltin.checkForUpdates()
            check(builtinSucceeded && requests.map { $0.url!.path } == [catalogURL.path], "\(mode.rawValue): identical builtin ZIP hash skips download")
            check(identicalBuiltin.remoteEntryURL(for: remote) == nil, "\(mode.rawValue): ZIP takes priority over advertised HTML")
            requests.removeAll()
            let downloaded = ModuleStore(root: sharedRoot.appendingPathComponent("download"), config: config, session: session,
                builtinRoot: fixtures.appendingPathComponent("builtin"), defaults: defaults)
            let installed = await downloaded.checkForUpdates()
            check(installed && requests.map { $0.url!.path } == [catalogURL.path, zipURL.path], "\(mode.rawValue): catalog is fetched before ZIP using the shared installer")
            check(downloaded.isDownloaded(downloaded.modules[0]), "\(mode.rawValue): ZIP resources are active")
            downloaded.markHealthy(downloaded.modules[0])
            requests.removeAll()
            let unchanged = await downloaded.checkForUpdates()
            check(unchanged && requests.map { $0.url!.path } == [catalogURL.path], "\(mode.rawValue): installed ZIP hash skips a repeat download")
            let originalHash = remote.sha256
            let rebuiltArchive = try Data(contentsOf: fixtures.appendingPathComponent("rebuilt.zip"))
            remote.sha256 = SHA256.hash(data: rebuiltArchive).map { String(format: "%02x", $0) }.joined()
            remote.size = rebuiltArchive.count
            MockProtocol.responses[catalogURL.path] = (200, try catalog(remote))
            MockProtocol.responses[zipURL.path] = (200, rebuiltArchive)
            let replaced = await downloaded.checkForUpdates()
            check(replaced && downloaded.modules[0].sha256 == remote.sha256, "\(mode.rawValue): changed hash installs even on the same build date")
            downloaded.markHealthy(downloaded.modules[0])
            remote.sha256 = originalHash; remote.size = archive.count
            MockProtocol.responses[catalogURL.path] = (200, try catalog(remote))
            requests.removeAll()
            let reused = await downloaded.checkForUpdates()
            check(reused && requests.map { $0.url!.path } == [catalogURL.path] && downloaded.modules[0].sha256 == originalHash,
                  "\(mode.rawValue): matching retained ZIP is reused without downloading")
            remote.downloadUrl = nil; remote.size = nil; remote.sha256 = nil
            MockProtocol.responses[catalogURL.path] = (200, try catalog(remote))
            requests.removeAll()
            let htmlOnly = await downloaded.checkForUpdates()
            check(htmlOnly && downloaded.remoteEntryURL(for: remote) != nil && requests.count == 1, "\(mode.rawValue): absent ZIP selects shared HTML loading")
        }
        print("All native core checks passed")
    }
}
