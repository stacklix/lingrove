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
        func check(_ condition: @autoclosure () -> Bool, _ message: String) { precondition(condition(), message); print("PASS \(message)") }
        func rejects(_ message: String, _ operation: () throws -> Void) { do { try operation(); fatalError("Expected rejection: \(message)") } catch { print("PASS \(message)") } }
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
        check(domainSummary.map(\.origin) == ["http://192.168.1.10:8000", "https://api.example.com", "https://custom.test:8443", "https://model.test", "https://updates.test"], "network summary includes configured services and deduplicates origins")
        check(domainSummary.first(where: { $0.origin == "https://api.example.com" })?.sources.count == 2, "network summary retains manifest and custom authorization sources")
        check(domainSummary.filter { $0.moduleID == nil }.map(\.origin) == ["http://192.168.1.10:8000", "https://model.test", "https://updates.test"], "host model and update destinations belong to public group")
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
        var localizedUpdate = try JSONDecoder().decode(Module.self, from: Data(contentsOf: fixtures.appendingPathComponent("localized-update.json")))
        let localizedArchive = try Data(contentsOf: fixtures.appendingPathComponent("localized-update.zip"))
        localizedUpdate.downloadUrl = "https://updates.test/localized-update.zip"
        localizedUpdate.size = localizedArchive.count
        localizedUpdate.sha256 = SHA256.hash(data: localizedArchive).map { String(format: "%02x", $0) }.joined()
        let localizedConfig = HostConfiguration(catalogURL: "https://updates.test/localized-catalog.json")
        let localizedRoot = fixtures.appendingPathComponent("localized-state")
        let localizedStore = ModuleStore(root: localizedRoot, config: localizedConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        MockProtocol.responses = ["/localized-catalog.json": (200, try catalog(localizedUpdate)), "/localized-update.zip": (200, localizedArchive)]
        await localizedStore.checkForUpdates()
        check(localizedStore.modules.first?.description(for: "en") == "Updated description delivered by the child app.", "child-app update replaces introduction without a host translation")
        let localizedRestart = ModuleStore(root: localizedRoot, config: localizedConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(localizedRestart.modules.first?.localizedDescriptions == localizedUpdate.localizedDescriptions, "updated introductions persist across host restart")
        let hostConfig = HostConfiguration(catalogURL: "https://updates.test/catalog.json")
        let store = ModuleStore(root: root, config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(store.modules.first?.version == "20260101", "bundled module available offline")
        let archive = try Data(contentsOf: fixtures.appendingPathComponent("valid.zip"))
        module.version = "20260102"; module.downloadUrl = "https://updates.test/module.zip"; module.size = archive.count
        module.sha256 = SHA256.hash(data: archive).map { String(format: "%02x", $0) }.joined()
        MockProtocol.responses = ["/catalog.json": (200, try catalog(module)), "/module.zip": (200, archive)]
        let insecureStore = ModuleStore(root: fixtures.appendingPathComponent("http-state"), config: HostConfiguration(catalogURL: "http://updates.test/catalog.json"), session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
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
        let concurrentConfig = HostConfiguration(catalogURL: "https://updates.test/concurrent-catalog.json")
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
        check(restarted.modules.first?.version == "20260102", "active version survives restart")
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
        check(store.modules.first?.version == "20260102", "offline update failure preserves available module")
        module.minimumAllowedVersion = "20260103"
        MockProtocol.responses["/catalog.json"] = (200, try catalog(module))
        await store.checkForUpdates()
        check(store.blocked.contains("sentra"), "mandatory minimum blocks retired fallback")
        let blockedRestart = ModuleStore(root: root, config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(blockedRestart.blocked.contains("sentra"), "minimum version enforced while offline after restart")
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
        let releaseStore = ModuleStore(root: fixtures.appendingPathComponent("release-dates"), config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"), defaults: releaseDefaults)
        var sameDayRelease = bundledModule
        sameDayRelease.version = "20260102"
        sameDayRelease.downloadUrl = "https://updates.test/module.zip"
        sameDayRelease.size = archive.count
        sameDayRelease.sha256 = SHA256.hash(data: archive).map { String(format: "%02x", $0) }.joined()
        MockProtocol.responses = ["/catalog.json": (200, try catalog(sameDayRelease)), "/module.zip": (200, archive)]
        await releaseStore.checkForUpdates()
        releaseStore.markHealthy(sameDayRelease)
        let revisedRelease = try Data(contentsOf: fixtures.appendingPathComponent("snapshot-next.zip"))
        sameDayRelease.size = revisedRelease.count
        sameDayRelease.sha256 = SHA256.hash(data: revisedRelease).map { String(format: "%02x", $0) }.joined()
        MockProtocol.responses = ["/catalog.json": (200, try catalog(sameDayRelease)), "/module.zip": (200, revisedRelease)]
        await releaseStore.checkForUpdates()
        check(releaseStore.modules.first?.sha256 == sameDayRelease.sha256, "same-day release updates when package hash changes")
        releaseStore.rollback(sameDayRelease)
        check(releaseStore.modules.first?.sha256 != sameDayRelease.sha256 && releaseStore.modules.first?.version == sameDayRelease.version, "same-day release rollback retains the previous package")
        let channelDefaults = UserDefaults(suiteName: "channel-tests-\(UUID().uuidString)")!
        channelDefaults.set(true, forKey: HostConfiguration.snapshotPreferenceKey)
        let channelConfig = HostConfiguration(catalogURL: "https://updates.test/catalog.json", snapshotCatalogURL: "https://updates.test/catalog.snapshot.json")
        #if DEBUG
        check(channelConfig.updateCatalogURL(defaults: channelDefaults).hasSuffix("catalog.snapshot.json"), "Debug selects Snapshot catalog")
        let channelStore = ModuleStore(root: fixtures.appendingPathComponent("channels"), config: channelConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"), defaults: channelDefaults)
        var snapshot = module
        snapshot.version = "20260102"; snapshot.minHostVersion = bundledModule.minHostVersion; snapshot.minimumAllowedVersion = nil
        snapshot.downloadUrl = "https://updates.test/module-snapshot.zip"
        func offerSnapshot(_ fixture: String) throws {
            let bytes = try Data(contentsOf: fixtures.appendingPathComponent(fixture))
            snapshot.size = bytes.count
            snapshot.sha256 = SHA256.hash(data: bytes).map { String(format: "%02x", $0) }.joined()
            MockProtocol.responses["/catalog.snapshot.json"] = (200, try catalog(snapshot))
            MockProtocol.responses["/module-snapshot.zip"] = (200, bytes)
        }
        try offerSnapshot("snapshot.zip")
        await channelStore.checkForUpdates()
        check(channelStore.modules.first?.resourceIdentity == snapshot.resourceIdentity, "Snapshot installs")
        let firstSnapshot = snapshot
        channelStore.markHealthy(snapshot)
        var forcedRequests: [URLRequest] = []
        MockProtocol.intercept = { request in
            forcedRequests.append(request.request)
            return false
        }
        await channelStore.checkForUpdates()
        check(forcedRequests.count == 1, "ordinary check skips identical Snapshot package")
        forcedRequests.removeAll()
        await channelStore.checkForUpdates(forceSnapshot: true)
        check(forcedRequests.count == 1 && forcedRequests.first?.url?.path == "/catalog.snapshot.json", "forced Snapshot refresh fetches catalog but skips identical package")
        check(forcedRequests.allSatisfy { $0.url?.query?.contains("_refresh=") == true && $0.value(forHTTPHeaderField: "Cache-Control") == "no-cache" }, "forced Snapshot requests bypass intermediary caches")
        check(channelStore.modules.first?.resourceIdentity == snapshot.resourceIdentity, "forced identical Snapshot remains installed")
        var blockedRequest = false
        MockProtocol.intercept = { request in
            if !blockedRequest && request.request.url?.path == "/catalog.snapshot.json" {
                blockedRequest = true
                return true
            }
            return false
        }
        let backgroundCheck = Task { await channelStore.checkForUpdates() }
        while !blockedRequest { try await Task.sleep(for: .milliseconds(10)) }
        await channelStore.checkForUpdates(forceSnapshot: true)
        await backgroundCheck.value
        check(!channelStore.checking && channelStore.notice.isEmpty, "forced Snapshot refresh supersedes a pending background check")
        MockProtocol.intercept = nil
        channelStore.markHealthy(snapshot)
        try offerSnapshot("snapshot-next.zip")
        await channelStore.checkForUpdates()
        check(channelStore.modules.first?.resourceIdentity == snapshot.resourceIdentity, "same-version Snapshot updates by hash")
        check(channelStore.directory(for: firstSnapshot) != channelStore.directory(for: snapshot), "same-version resources remain separate for rollback")
        channelStore.rollback(snapshot)
        check(channelStore.modules.first?.resourceIdentity == firstSnapshot.resourceIdentity, "same-version Snapshot startup failure rolls back")
        await channelStore.checkForUpdates()
        check(channelStore.modules.first?.resourceIdentity == firstSnapshot.resourceIdentity, "failed Snapshot hash is not reinstalled")
        var release = firstSnapshot
        release.downloadUrl = "https://updates.test/module.zip"
        release.size = archive.count
        release.sha256 = SHA256.hash(data: archive).map { String(format: "%02x", $0) }.joined()
        MockProtocol.responses["/catalog.json"] = (200, try catalog(release))
        MockProtocol.responses["/module.zip"] = (200, archive)
        channelDefaults.set(false, forKey: HostConfiguration.snapshotPreferenceKey)
        await channelStore.checkForUpdates()
        check(channelStore.modules.first?.resourceIdentity == release.resourceIdentity, "disabling Snapshot installs same-version release")
        channelStore.markHealthy(release)
        channelDefaults.set(true, forKey: HostConfiguration.snapshotPreferenceKey)
        try offerSnapshot("snapshot.zip")
        await channelStore.checkForUpdates()
        check(channelStore.modules.first?.isSnapshot == true, "reenabling Snapshot returns to Snapshot channel")
        channelStore.markHealthy(snapshot)
        snapshot.version = "20260103"
        try offerSnapshot("newer.zip")
        await channelStore.checkForUpdates()
        check(channelStore.modules.first?.version == "20260103", "newer Snapshot installs")
        channelStore.markHealthy(snapshot)
        channelDefaults.set(false, forKey: HostConfiguration.snapshotPreferenceKey)
        await channelStore.checkForUpdates()
        check(channelStore.modules.first?.resourceIdentity == release.resourceIdentity, "channel switch allows lower release version")
        let cancellationSuite = "cancel-tests-\(UUID().uuidString)"
        let cancellationDefaults = UserDefaults(suiteName: cancellationSuite)!
        defer { cancellationDefaults.removePersistentDomain(forName: cancellationSuite) }
        cancellationDefaults.set(false, forKey: HostConfiguration.snapshotPreferenceKey)
        var cancellableModule = bundledModule
        cancellableModule.version = "20260102"
        cancellableModule.downloadUrl = "https://updates.test/cancel-module.zip"
        cancellableModule.size = archive.count
        cancellableModule.sha256 = SHA256.hash(data: archive).map { String(format: "%02x", $0) }.joined()
        let cancellationConfig = HostConfiguration(
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
        cancellationDefaults.set(true, forKey: HostConfiguration.snapshotPreferenceKey)
        await cancellationStore.checkForUpdates(forceSnapshot: true)
        await pendingCheck.value
        MockProtocol.intercept = nil
        check(cancellationStore.modules.first?.version == "20260101", "superseded ZIP download does not install")
        check(cancellationStore.downloadProgress.isEmpty && cancellationStore.statuses["sentra"] != "正在下载 1.1.0…",
              "cancelling a ZIP download clears progress and stale status")
        #else
        check(channelConfig.updateCatalogURL(defaults: channelDefaults).hasSuffix("/catalog.json"), "Release ignores saved Snapshot preference")
        #endif
        print("All native core checks passed")
    }
}
