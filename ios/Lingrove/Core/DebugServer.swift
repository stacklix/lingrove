import Foundation
import Security

#if DEBUG
struct DebugServerAddress: Codable, Equatable, Identifiable {
    var id = UUID().uuidString
    var url = ""
    var requiresToken: Bool?
}

struct DebugServerSettings: Codable, Equatable {
    var addresses: [DebugServerAddress] = []
    var activeID: String?
    var activeAddress: String? { addresses.first { $0.id == activeID }?.url }
    var activeServer: DebugServerAddress? { addresses.first { $0.id == activeID } }

    static func load(defaults: UserDefaults = .standard) -> Self {
        guard let json = defaults.string(forKey: DebugServer.preferenceKey),
              let data = json.data(using: .utf8),
              let settings = try? JSONDecoder().decode(Self.self, from: data) else { return Self() }
        return settings
    }
    func save(defaults: UserDefaults = .standard) {
        var saved = self
        saved.addresses = addresses.compactMap { address in
            let url = address.url.trimmingCharacters(in: .whitespacesAndNewlines)
            var saved = address
            saved.url = url
            return url.isEmpty ? nil : saved
        }
        if !saved.addresses.contains(where: { $0.id == saved.activeID }) { saved.activeID = nil }
        guard !saved.addresses.isEmpty else {
            defaults.removeObject(forKey: DebugServer.preferenceKey)
            return
        }
        guard let data = try? JSONEncoder().encode(saved), let json = String(data: data, encoding: .utf8) else { return }
        defaults.set(json, forKey: DebugServer.preferenceKey)
    }
    mutating func updateAddress(id: String, url: String) {
        guard let index = addresses.firstIndex(where: { $0.id == id }), addresses[index].url != url else { return }
        addresses[index].url = url
        addresses[index].requiresToken = nil
    }
    mutating func removeAddress(id: String) {
        if activeID == id { activeID = nil }
        addresses.removeAll { $0.id == id }
    }
}

enum DebugServerAuthenticationError: LocalizedError {
    case required
    case invalidFormat
    var errorDescription: String? {
        switch self {
        case .required: return "调试服务器需要有效的 Token，请输入后重试。"
        case .invalidFormat: return "Token 必须为 6 位英文字母或数字，区分大小写。"
        }
    }
}

enum DebugServerTokenStore {
    private static func query(_ address: String) throws -> [String: Any] {
        let normalized = try DebugServer.normalized(address)
        guard !normalized.isEmpty else { throw ModuleError.invalid("请先填写调试服务器地址。") }
        return [kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: "me.stackli.lingrove.debug-server",
                kSecAttrAccount as String: normalized]
    }
    static func load(address: String) throws -> String {
        var request = try query(address)
        request[kSecReturnData as String] = true
        request[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(request as CFDictionary, &result)
        if status == errSecItemNotFound { return "" }
        guard status == errSecSuccess, let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            throw ModuleError.invalid("无法读取调试 Token，请解锁设备后重试。")
        }
        return token
    }
    static func save(_ token: String, address: String) throws {
        let token = try DebugServer.validatedToken(token)
        let itemQuery = try query(address)
        if token.isEmpty {
            let status = SecItemDelete(itemQuery as CFDictionary)
            guard status == errSecSuccess || status == errSecItemNotFound else {
                throw ModuleError.invalid("无法删除调试 Token。")
            }
            return
        }
        let attributes: [String: Any] = [kSecValueData as String: Data(token.utf8),
                                        kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly]
        var status = SecItemUpdate(itemQuery as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            status = SecItemAdd(itemQuery.merging(attributes) { _, value in value } as CFDictionary, nil)
        }
        guard status == errSecSuccess else { throw ModuleError.invalid("无法保存调试 Token。") }
    }
}

struct DebugServerConnection {
    let message: String
    let requiresToken: Bool
}

// Only Debug builds can load executable child-app resources from a server.
enum DebugServer {
    static let preferenceKey = "debug.servers"
    static var activeAddress: String? { enabled ? DebugServerSettings.load().activeAddress : nil }
    static var enabled: Bool {
        HostConfiguration.resourceMode() == .debug
    }
    static var canRefresh: Bool { available && enabled }
    static let available = true
    static func validatedToken(_ raw: String) throws -> String {
        let token = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard token.isEmpty || token.range(of: "^[A-Za-z0-9]{6}$", options: .regularExpression) != nil else {
            throw DebugServerAuthenticationError.invalidFormat
        }
        return token
    }
    // Match both origin and root path; never attach a debug credential to ordinary
    // update, model, TTS, or redirected requests.
    static func configuredAddress(for url: URL, defaults: UserDefaults = .standard) -> String? {
        guard HostConfiguration.resourceMode(defaults: defaults) == .debug,
              let address = DebugServerSettings.load(defaults: defaults).activeAddress,
              let normalizedAddress = try? normalized(address), let base = URL(string: normalizedAddress),
              url.scheme == base.scheme, url.host == base.host, url.port == base.port,
              url.user == nil, url.password == nil,
              url.standardized.path.hasPrefix(base.appendingPathComponent("snapshot").standardized.path + "/") else { return nil }
        return address
    }
    static func authorize(_ request: inout URLRequest, token: String) throws {
        let token = try validatedToken(token)
        if !token.isEmpty { request.setValue(token, forHTTPHeaderField: "Stack-Pass") }
    }
    static func authorize(_ request: inout URLRequest, defaults: UserDefaults = .standard) throws {
        guard let url = request.url, let address = configuredAddress(for: url, defaults: defaults) else { return }
        try authorize(&request, token: DebugServerTokenStore.load(address: address))
    }
    static func catalogURL(defaults: UserDefaults = .standard) -> URL? {
        guard let address = DebugServerSettings.load(defaults: defaults).activeAddress,
              let base = try? normalized(address), let url = URL(string: base) else { return nil }
        return url.appendingPathComponent("snapshot/catalog.snapshot.json")
    }
    static func resolve(_ catalog: Catalog, relativeTo catalogURL: URL) throws -> Catalog {
        let base = catalogURL.deletingLastPathComponent()
        var result = catalog
        for index in result.modules.indices {
            let module = result.modules[index]
            if module.downloadUrl != nil {
                result.modules[index].downloadUrl = base.appendingPathComponent("packages/\(module.id)-\(module.version).zip").absoluteString
            }
            if module.webUrl != nil {
                result.modules[index].webUrl = base.appendingPathComponent("app/\(module.id)/\(module.entry)").absoluteString
            }
        }
        try result.validate()
        return result
    }
    static func allowsResource(_ url: URL, catalogURL: URL) -> Bool {
        let base = catalogURL.deletingLastPathComponent()
        return url.scheme == "http" && catalogURL.scheme == "http"
            && url.host == catalogURL.host && url.port == catalogURL.port
            && url.user == nil && url.password == nil
            && catalogURL.path.hasSuffix("/snapshot/catalog.snapshot.json")
            && url.standardized.path.hasPrefix(base.standardized.path + "/")
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
    static func testConnection(_ raw: String, token: String = "", configuration: URLSessionConfiguration = .ephemeral) async throws -> DebugServerConnection {
        let address = try normalized(raw)
        guard !address.isEmpty, let base = URL(string: address) else {
            throw ModuleError.invalid("请先填写调试服务器地址。")
        }
        let configuration = configuration.copy() as! URLSessionConfiguration
        configuration.timeoutIntervalForRequest = 5
        configuration.timeoutIntervalForResource = 8
        let session = URLSession(configuration: configuration, delegate: NoRedirect(), delegateQueue: nil)
        defer { session.invalidateAndCancel() }
        // Test the selected server's current applications, independently of the
        // installed packages or the ordinary release catalog.
        let catalogURL = base.appendingPathComponent("snapshot/catalog.snapshot.json")
        var request = URLRequest(url: catalogURL, cachePolicy: .reloadIgnoringLocalCacheData)
        try authorize(&request, token: token)
        let (data, response) = try await session.data(for: request)
        if (response as? HTTPURLResponse)?.statusCode == 401 { throw DebugServerAuthenticationError.required }
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw ModuleError.invalid("无法读取调试目录 \(catalogURL.path)，请确认服务已启动且已运行 npm run build。")
        }
        let catalog = try resolve(JSONDecoder().decode(Catalog.self, from: data), relativeTo: catalogURL)
        let requiresToken = http.value(forHTTPHeaderField: "X-Lingrove-Debug-Auth")?.lowercased() == "stack-pass"
        try catalog.validate()
        let modules = catalog.modules
        let urls = modules.map {
            if let raw = $0.downloadUrl ?? $0.webUrl, let url = URL(string: raw) { return url }
            return base.appendingPathComponent("snapshot/app").appendingPathComponent($0.id).appendingPathComponent($0.entry)
        }
        for url in urls {
            try Task.checkCancellation()
            var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData)
            request.httpMethod = "HEAD"
            try authorize(&request, token: token)
            let (_, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else {
                throw ModuleError.invalid("服务器未返回有效的 HTTP 响应。")
            }
            if http.statusCode == 401 { throw DebugServerAuthenticationError.required }
            guard (200..<300).contains(http.statusCode) else {
                throw ModuleError.invalid("\(url.path) 返回 HTTP \(http.statusCode)，请确认服务已启动且已运行 npm run build。")
            }
        }
        return DebugServerConnection(message: "连接成功，\(modules.count) 个子应用入口均可访问。", requiresToken: requiresToken)
    }
    static func entryURL(for module: Module, defaults: UserDefaults = .standard) -> URL? {
        guard HostConfiguration.resourceMode(defaults: defaults) == .debug,
              let base = try? normalized(DebugServerSettings.load(defaults: defaults).activeAddress ?? ""),
              !base.isEmpty, let url = URL(string: base) else { return nil }
        return url.appendingPathComponent("snapshot/app").appendingPathComponent(module.id).appendingPathComponent(module.entry)
    }
    static func allows(_ url: URL, entry: URL) -> Bool {
        url.scheme == entry.scheme && url.host == entry.host && url.port == entry.port
            && url.user == nil && url.password == nil
            && url.standardized.path == entry.standardized.path
    }
}
#endif
