import Foundation

struct Module: Codable, Identifiable, Equatable {
    var id: String
    var name: String
    var description: String?
    var version: String
    var entry: String
    var minHostVersion: String
    var bridgeVersion: Int
    var stateSchemaVersion: Int
    var allowedOrigins: [String]
    var downloadUrl: String?
    var size: Int?
    var sha256: String?
    var minimumAllowedVersion: String?
    func validate() throws {
        guard id.range(of: "^[a-z0-9][a-z0-9-]{0,63}$", options: .regularExpression) != nil,
              Version(version) != nil, Version(minHostVersion) != nil,
              entry == "index.html", bridgeVersion == 1, stateSchemaVersion == 1,
              allowedOrigins.count <= 30 else { throw ModuleError.invalid("模块信息无效或协议不兼容") }
        if let minimumAllowedVersion, Version(minimumAllowedVersion) == nil { throw ModuleError.invalid("最低版本无效") }
        for origin in allowedOrigins { guard NetworkPolicy.origin(origin) == origin else { throw ModuleError.invalid("域名配置无效") } }
    }
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
struct HostConfiguration: Codable {
    static let currentVersion = "1.3.0"
    var catalogURL: String
    static var bundled: Self {
        guard let url = Bundle.main.url(forResource: "HostConfig", withExtension: "json"), let data = try? Data(contentsOf: url), let config = try? JSONDecoder().decode(Self.self, from: data) else { return .init(catalogURL: "") }
        return config
    }
}
enum NetworkPolicy {
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
            if let url = module.downloadUrl { add(url, source: "子应用更新") }
        }
        add(catalogURL, source: "更新目录")
        if let modelURL { add(modelURL, source: "大模型服务") }
        if let debugURL, let normalized = try? DebugServer.normalized(debugURL),
           !normalized.isEmpty, var components = URLComponents(string: normalized) {
            components.path = ""
            components.host = components.host?.lowercased()
            if (components.scheme == "http" && components.port == 80) || (components.scheme == "https" && components.port == 443) {
                components.port = nil
            }
            if let origin = components.string { record(origin, source: "调试资源") }
        }
        return domains.values.sorted { $0.origin == $1.origin ? $0.id < $1.id : $0.origin < $1.origin }
    }
}

// Only Debug builds can load executable child-app resources from a server.
enum DebugServer {
    static let preferenceKey = "debug.serverURL"
    static let enabledPreferenceKey = "debug.enabled"
    static var enabled: Bool {
        available && (UserDefaults.standard.object(forKey: enabledPreferenceKey) as? Bool ?? true)
    }
    static var available: Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }
    static func normalized(_ raw: String) throws -> String {
        let value = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if value.isEmpty { return "" }
        guard let components = URLComponents(string: value),
              ["http", "https"].contains(components.scheme ?? ""),
              let host = components.host, !host.isEmpty,
              components.user == nil, components.password == nil,
              components.query == nil, components.fragment == nil,
              let url = components.url else { throw ModuleError.invalid("请输入完整的 HTTP 或 HTTPS 服务器根地址，不含账号、查询参数或片段。") }
        return url.absoluteString.hasSuffix("/") ? url.absoluteString : url.absoluteString + "/"
    }
    static func testConnection(_ raw: String, modules: [Module]) async throws -> String {
        let address = try normalized(raw)
        guard !address.isEmpty, let base = URL(string: address) else {
            throw ModuleError.invalid("请先填写调试服务器地址。")
        }
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 5
        configuration.timeoutIntervalForResource = 8
        let session = URLSession(configuration: configuration, delegate: NoRedirect(), delegateQueue: nil)
        defer { session.invalidateAndCancel() }
        let urls = modules.isEmpty ? [base] : modules.map {
            base.appendingPathComponent($0.id).appendingPathComponent($0.entry)
        }
        for url in urls {
            try Task.checkCancellation()
            var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData)
            request.httpMethod = "HEAD"
            let (_, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else {
                throw ModuleError.invalid("服务器未返回有效的 HTTP 响应。")
            }
            guard (200..<300).contains(http.statusCode) else {
                throw ModuleError.invalid("\(url.path) 返回 HTTP \(http.statusCode)，请确认服务已启动且已运行 npm run build。")
            }
        }
        return modules.isEmpty ? "连接成功，服务器可访问。" : "连接成功，\(modules.count) 个子应用入口均可访问。"
    }
    static func entryURL(for module: Module) -> URL? {
        guard enabled, let base = try? normalized(UserDefaults.standard.string(forKey: preferenceKey) ?? ""),
              !base.isEmpty, let url = URL(string: base) else { return nil }
        return url.appendingPathComponent(module.id).appendingPathComponent(module.entry)
    }
    static func allows(_ url: URL, entry: URL) -> Bool {
        url.scheme == entry.scheme && url.host == entry.host && url.port == entry.port
            && url.user == nil && url.password == nil
            && url.standardized.path == entry.standardized.path
    }
}
