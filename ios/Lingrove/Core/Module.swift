import Foundation

struct Module: Codable, Identifiable, Equatable {
    var id: String
    var name: String
    var description: String?
    var localizedDescriptions: [String: String]?
    var version: String
    var entry: String
    var minHostVersion: String
    var bridgeVersion: Int
    var stateSchemaVersion: Int
    var allowedOrigins: [String]
    var downloadUrl: String?
    var webUrl: String?
    var size: Int?
    var sha256: String?
    var minimumAllowedVersion: String?
    var resourceIdentity: String { "\(version)-release-\(sha256 ?? "builtin")" }
    func description(for language: String) -> String? {
        localizedDescriptions?[language] ?? description
    }
    func validate() throws {
        guard id.range(of: "^[a-z0-9][a-z0-9-]{0,63}$", options: .regularExpression) != nil,
              ModuleVersion(version) != nil, Version(minHostVersion) != nil,
              entry == "index.html", bridgeVersion == 1, stateSchemaVersion == 1,
              allowedOrigins.count <= 30 else { throw ModuleError.invalid("模块信息无效或协议不兼容") }
        if let sha256, sha256.range(of: "^[a-f0-9]{64}$", options: .regularExpression) == nil { throw ModuleError.invalid("安装包哈希无效") }
        if let minimumAllowedVersion, ModuleVersion(minimumAllowedVersion) == nil { throw ModuleError.invalid("最低版本无效") }
        for origin in allowedOrigins { guard NetworkPolicy.origin(origin) == origin else { throw ModuleError.invalid("域名配置无效") } }
        if downloadUrl != nil {
            guard let size, size > 0, size <= 50 * 1024 * 1024, sha256 != nil else { throw ModuleError.invalid("下载元数据无效") }
        }
        if let webUrl {
            guard let url = URL(string: webUrl), ["https", "http"].contains(url.scheme ?? ""),
                  url.host != nil, url.user == nil, url.password == nil else { throw ModuleError.invalid("网页地址无效") }
        }
    }
}
// Child-app versions are Gregorian build dates; host versions remain semantic versions.
struct ModuleVersion: Comparable {
    let value: Int
    init?(_ raw: String) {
        guard raw.utf8.count == 8, raw.utf8.allSatisfy({ (48...57).contains($0) }), let value = Int(raw) else { return nil }
        let year = value / 10000, month = value / 100 % 100, day = value % 100
        guard year > 0, (1...12).contains(month) else { return nil }
        let leap = year % 400 == 0 || (year % 4 == 0 && year % 100 != 0)
        let days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        guard (1...days[month - 1]).contains(day) else { return nil }
        self.value = value
    }
    static func < (lhs: Self, rhs: Self) -> Bool { lhs.value < rhs.value }
}
struct Version: Comparable {
    let parts: [Int]
    init?(_ value: String) {
        let items = value.split(separator: ".", omittingEmptySubsequences: false)
        guard items.count == 3, items.allSatisfy({ !$0.isEmpty && $0.allSatisfy(\.isNumber) }), items.allSatisfy({ Int($0) != nil }) else { return nil }
        parts = items.map { Int($0)! }
    }
    static func < (lhs: Self, rhs: Self) -> Bool { lhs.parts.lexicographicallyPrecedes(rhs.parts) }
}
enum ModuleError: LocalizedError {
    case invalid(String)
    var errorDescription: String? { if case .invalid(let message) = self { return message }; return nil }
}
struct Catalog: Codable {
    var modules: [Module]
    func validate() throws {
        guard modules.count <= 100, Set(modules.map(\.id)).count == modules.count else { throw ModuleError.invalid("模块目录重复或过大") }
        for module in modules { try module.validate() }
    }
}
enum ChildAppResourceMode: String {
    case bundled
    #if DEBUG
    case debug
    #endif
}
struct HostConfiguration: Codable {
    static let currentVersion = "1.3.0"
    var catalogURL: String
    #if DEBUG
    var snapshotCatalogURL: String = ""
    #endif
    func updateCatalogURL(defaults: UserDefaults = .standard) -> String {
        #if DEBUG
        return Self.resourceMode(defaults: defaults) == .bundled ? catalogURL : (DebugServer.catalogURL(defaults: defaults)?.absoluteString ?? snapshotCatalogURL)
        #else
        return catalogURL
        #endif
    }
    #if DEBUG
    static let resourceModePreferenceKey = "resources.mode"
    #endif
    static func resourceMode(defaults: UserDefaults = .standard) -> ChildAppResourceMode {
        #if DEBUG
        return ChildAppResourceMode(rawValue: defaults.string(forKey: resourceModePreferenceKey) ?? "") ?? .bundled
        #else
        return .bundled
        #endif
    }
    static var bundled: Self {
        guard let url = Bundle.main.url(forResource: "HostConfig", withExtension: "json"), let data = try? Data(contentsOf: url), let config = try? JSONDecoder().decode(Self.self, from: data) else { return .init(catalogURL: "") }
        return config
    }
}
enum NetworkPolicy {
    static func allowsPage(_ url: URL, entry: URL) -> Bool {
        url.scheme == entry.scheme && url.host == entry.host && url.port == entry.port
            && url.user == nil && url.password == nil
            && url.standardized.path == entry.standardized.path
    }
    static func origin(_ raw: String) -> String? {
        guard let u = URLComponents(string: raw), u.scheme == "https", let host = u.host, !host.isEmpty, u.user == nil, u.password == nil else { return nil }
        let wrapped = host.contains(":") && !host.hasPrefix("[") ? "[\(host)]" : host
        return "https://\(wrapped.lowercased())" + (u.port.map { $0 == 443 ? "" : ":\($0)" } ?? "")
    }
    static func allows(_ url: URL, origins: [String]) -> Bool {
        guard let origin = origin(url.absoluteString) else { return false }
        return origins.contains(origin)
    }
}

// Read-only summary of configured destinations; this does not grant network access.
struct NetworkAccessDomain: Identifiable, Equatable {
    // nil identifies host-owned, shared services; module IDs identify child-app permissions.
    var moduleID: String?
    var origin: String
    var sources: [String]
    var id: String { "\(moduleID ?? "")|\(origin)" }

    static func snapshot(modules: [Module], customOrigins: [String: [String]], catalogURL: String,
                         modelURL: String?, debugURL: String?) -> [Self] {
        var domains: [String: Self] = [:]
        func record(_ origin: String, moduleID: String? = nil, source: String) {
            let entry = Self(moduleID: moduleID, origin: origin, sources: [])
            var existing = domains[entry.id] ?? entry
            existing.sources = Array(Set(existing.sources + [source])).sorted()
            domains[entry.id] = existing
        }
        func add(_ raw: String, moduleID: String? = nil, source: String) {
            guard let origin = NetworkPolicy.origin(raw) else { return }
            record(origin, moduleID: moduleID, source: source)
        }
        for module in modules {
            for origin in module.allowedOrigins { add(origin, moduleID: module.id, source: "清单授权") }
            for origin in customOrigins[module.id] ?? [] { add(origin, moduleID: module.id, source: "自定义授权") }
            if let url = module.downloadUrl { add(url, source: "应用更新") }
        }
        add(catalogURL, source: "更新目录")
        if let modelURL { add(modelURL, source: "通用模型") }
        #if DEBUG
        if let debugURL, let normalized = try? DebugServer.normalized(debugURL),
           !normalized.isEmpty, var components = URLComponents(string: normalized) {
            components.path = ""
            components.host = components.host?.lowercased()
            if (components.scheme == "http" && components.port == 80) || (components.scheme == "https" && components.port == 443) {
                components.port = nil
            }
            if let origin = components.string { record(origin, source: "调试资源") }
        }
        #endif
        return domains.values.sorted { $0.origin == $1.origin ? $0.id < $1.id : $0.origin < $1.origin }
    }
}
