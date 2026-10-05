import Foundation
import CryptoKit

final class MockProtocol: URLProtocol, @unchecked Sendable {
    static var responses: [String: (Int, Data)] = [:]
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
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
        check(NetworkPolicy.allows(URL(string: "https://api.example.com/a")!, origins: ["https://api.example.com"]), "allowed origin")
        check(!NetworkPolicy.allows(URL(string: "https://api.example.com.evil.test")!, origins: ["https://api.example.com"]), "suffix spoof rejected")
        check(!NetworkPolicy.allows(URL(string: "https://api.example.com:444/a")!, origins: ["https://api.example.com"]), "port mismatch rejected")
        for name in ["traversal", "absolute", "compressed", "symlink", "truncated"] {
            let destination = fixtures.appendingPathComponent("extract-\(name)")
            try FileManager.default.createDirectory(at: destination, withIntermediateDirectories: true)
            rejects("reject ZIP \(name)") { try StoredZIP.extract(Data(contentsOf: fixtures.appendingPathComponent("\(name).zip")), to: destination) }
        }
        var module = try JSONDecoder().decode(Module.self, from: Data(contentsOf: fixtures.appendingPathComponent("builtin/sentra/manifest.json")))
        let networkSuite = "network-policy-test." + UUID().uuidString
        let networkDefaults = UserDefaults(suiteName: networkSuite)!
        defer { networkDefaults.removePersistentDomain(forName: networkSuite) }
        networkDefaults.set(["https://API.example.com:443", "https://custom.test:8443"], forKey: "origins.sentra")
        networkDefaults.set(["https://api.example.com"], forKey: "origins.old-app")
        LegacyModelAuthorizationMigration.run(["https://api.example.com/v1"], defaults: networkDefaults)
        check(networkDefaults.stringArray(forKey: "origins.sentra") == ["https://custom.test:8443"] && networkDefaults.object(forKey: "origins.old-app") == nil, "migration removes model grants across child apps and preserves other domains")
        networkDefaults.set(["https://api.example.com"], forKey: "origins.sentra")
        LegacyModelAuthorizationMigration.run(["https://api.example.com/v1"], defaults: networkDefaults)
        check(networkDefaults.stringArray(forKey: "origins.sentra") == ["https://api.example.com"], "migration runs once and preserves subsequent explicit authorizations")
        check(networkDefaults.object(forKey: "network.hostModelOrigins") == nil, "obsolete reserved-domain registry removed")
        networkDefaults.removePersistentDomain(forName: networkSuite)
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
        LegacyModelAuthorizationMigration.run(["https://API.example.com:443/v1"], defaults: networkDefaults)
        let sharedSummary = NetworkAccessDomain.snapshot(modules: [networkModule], customOrigins: [module.id: ["https://api.example.com", "https://custom.test:8443"]], catalogURL: "", modelURL: "https://API.example.com:443/v1", debugURL: nil)
        let modelDomains = sharedSummary.filter { $0.origin == "https://api.example.com" }
        check(modelDomains.count == 2 && modelDomains.contains { $0.moduleID == module.id } && modelDomains.contains { $0.moduleID == nil }, "summary shows actual authorizations without model-domain filtering")
        check(sharedSummary.contains { $0.origin == "https://custom.test:8443" && $0.moduleID == module.id }, "other child app domains remain visible")
        networkDefaults.removePersistentDomain(forName: networkSuite)
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
        let hostConfig = HostConfiguration(catalogURL: "https://updates.test/catalog.json")
        let store = ModuleStore(root: root, config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(store.modules.first?.version == "1.0.0", "bundled module available offline")
        let archive = try Data(contentsOf: fixtures.appendingPathComponent("valid.zip"))
        module.version = "1.1.0"; module.downloadUrl = "https://updates.test/module.zip"; module.size = archive.count
        module.sha256 = SHA256.hash(data: archive).map { String(format: "%02x", $0) }.joined()
        MockProtocol.responses = ["/catalog.json": (200, try catalog(module)), "/module.zip": (200, archive)]
        let insecureStore = ModuleStore(root: fixtures.appendingPathComponent("http-state"), config: HostConfiguration(catalogURL: "http://updates.test/catalog.json"), session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        await insecureStore.checkForUpdates()
        check(insecureStore.modules.first?.version == "1.0.0" && insecureStore.notice.contains("HTTPS"), "HTTP catalog rejected before download")
        await store.checkForUpdates()
        check(store.modules.first?.version == "1.1.0", "HTTPS plain catalog update installed and activated")
        check(FileManager.default.fileExists(atPath: store.directory(for: module).appendingPathComponent("index.html").path), "installed resources readable")
        store.markHealthy(module)
        store.rollback(module)
        check(store.modules.first?.version == module.version && !store.blocked.contains(module.id), "healthy version is never rejected after a runtime failure")
        let restarted = ModuleStore(root: root, config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(restarted.modules.first?.version == "1.1.0", "active version survives restart")
        let legacyRoot = fixtures.appendingPathComponent("legacy-rejected")
        try FileManager.default.copyItem(at: root, to: legacyRoot)
        try JSONEncoder().encode(["sentra": module.version]).write(to: legacyRoot.appendingPathComponent("rejected.json"))
        let legacy = ModuleStore(root: legacyRoot, config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(!legacy.blocked.contains("sentra"), "previously rejected version opens directly without a recovery action")
        let retryRestart = ModuleStore(root: legacyRoot, config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(!retryRestart.blocked.contains("sentra"), "previous failure does not block opening after host restart")
        let upgradedBuiltin = fixtures.appendingPathComponent("upgraded-builtin")
        try FileManager.default.copyItem(at: fixtures.appendingPathComponent("builtin"), to: upgradedBuiltin)
        var bundledUpgrade = module; bundledUpgrade.version = "1.3.0"
        try JSONEncoder().encode(bundledUpgrade).write(to: upgradedBuiltin.appendingPathComponent("sentra/manifest.json"))
        let upgradeRoot = fixtures.appendingPathComponent("upgrade-state")
        try FileManager.default.copyItem(at: root, to: upgradeRoot)
        let upgradedHost = ModuleStore(root: upgradeRoot, config: hostConfig, session: session, builtinRoot: upgradedBuiltin)
        check(upgradedHost.modules.first?.version == "1.3.0", "new bundled version supersedes older persisted registry")
        MockProtocol.responses["/catalog.json"] = (200, Data("{}".utf8))
        await store.checkForUpdates()
        check(store.modules.first?.version == "1.1.0" && store.notice.contains("更新检查失败"), "invalid JSON catalog preserves active module")
        check(store.statuses.isEmpty, "failed update check clears previous per-module results")
        module.version = "1.2.0"; module.sha256 = String(repeating: "0", count: 64)
        MockProtocol.responses["/catalog.json"] = (200, try catalog(module))
        await store.checkForUpdates()
        check(store.modules.first?.version == "1.1.0", "bad hash preserves old version")
        let newer = try Data(contentsOf: fixtures.appendingPathComponent("newer.zip"))
        module.size = newer.count; module.sha256 = SHA256.hash(data: newer).map { String(format: "%02x", $0) }.joined()
        MockProtocol.responses = ["/catalog.json": (200, try catalog(module)), "/module.zip": (200, newer)]
        await store.checkForUpdates(); check(store.modules.first?.version == "1.2.0", "next update installed")
        store.rollback(module); check(store.modules.first?.version == "1.1.0", "failed startup rolls back to previous version")
        await store.checkForUpdates(); check(store.modules.first?.version == "1.1.0", "known bad version is not reinstalled")
        MockProtocol.responses["/catalog.json"] = (500, Data())
        await store.checkForUpdates(); check(store.modules.first?.version == "1.1.0", "offline update failure preserves available module")
        module.minimumAllowedVersion = "1.2.0"
        MockProtocol.responses["/catalog.json"] = (200, try catalog(module))
        await store.checkForUpdates()
        check(store.blocked.contains("sentra"), "mandatory minimum blocks retired fallback")
        let blockedRestart = ModuleStore(root: root, config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(blockedRestart.blocked.contains("sentra"), "minimum version enforced while offline after restart")
        module.version = "2.0.0"; module.minHostVersion = "2.0.0"
        MockProtocol.responses["/catalog.json"] = (200, try catalog(module))
        await store.checkForUpdates()
        check(store.modules.first?.version == "1.1.0", "incompatible host version never installed")
        let brokenRoot = fixtures.appendingPathComponent("broken-registry")
        try FileManager.default.createDirectory(at: brokenRoot, withIntermediateDirectories: true)
        try Data("broken".utf8).write(to: brokenRoot.appendingPathComponent("registry.json"))
        let brokenStore = ModuleStore(root: brokenRoot, config: hostConfig, session: session, builtinRoot: fixtures.appendingPathComponent("builtin"))
        check(brokenStore.modules.first?.version == "1.0.0", "corrupt registry still exposes bundled module")
        await brokenStore.checkForUpdates()
        check(try! String(contentsOf: brokenRoot.appendingPathComponent("registry.json"), encoding: .utf8) == "broken", "corrupt registry preserved without overwrite")
        print("All native core checks passed")
    }
}
