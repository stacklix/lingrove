import Foundation
import Security
import SwiftUI

struct LLMConfiguration: Codable {
    var provider = "openAi"
    var baseURL = ""
    var model = ""
    var token = ""
    // Optional so configurations saved before this setting still decode.
    var reasoningEffort: String? = nil

    func endpoint() throws -> URL {
        let base = baseURL.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: "/+$", with: "", options: .regularExpression)
        guard let parts = URLComponents(string: base), parts.scheme == "https", let host = parts.host, !host.isEmpty,
              parts.user == nil, parts.password == nil, parts.query == nil, parts.fragment == nil,
              ["openAi", "anthropic"].contains(provider) else { throw ModuleError.invalid("请填写有效的 HTTPS API 地址，不能包含账号、查询参数或片段") }
        let path: String
        if provider == "anthropic" {
            guard !base.hasSuffix("/chat/completions") else { throw ModuleError.invalid("接口地址与协议不匹配") }
            path = base.hasSuffix("/messages") ? base : base + (base.hasSuffix("/v1") ? "" : "/v1") + "/messages"
        } else {
            guard !base.hasSuffix("/messages") else { throw ModuleError.invalid("接口地址与协议不匹配") }
            path = base.hasSuffix("/chat/completions") ? base : base + "/chat/completions"
        }
        guard let url = URL(string: path) else { throw ModuleError.invalid("接口地址无效") }
        return url
    }
    func validate() throws {
        _ = try endpoint()
        if let effort = reasoningEffort, !["none", "low", "high", "max"].contains(effort) {
            throw ModuleError.invalid("推理强度无效")
        }
        guard !model.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, model.utf8.count <= 256,
              token.utf8.count <= 16384, token.rangeOfCharacter(from: .controlCharacters) == nil else { throw ModuleError.invalid("模型名称或 API Key 无效") }
    }
    func request(_ params: [String: Any]) throws -> URLRequest {
        try validate()
        guard let messages = params["messages"] as? [[String: String]], !messages.isEmpty, messages.count <= 100,
              messages.allSatisfy({ ["user", "assistant"].contains($0["role"] ?? "") && $0["content"] != nil }),
              let maxTokens = params["maxTokens"] as? Int, (1...32768).contains(maxTokens),
              let system = params["system"] as? String else { throw ModuleError.invalid("模型请求参数无效") }
        let anthropic = provider == "anthropic"
        var body: [String: Any] = ["model": model.trimmingCharacters(in: .whitespacesAndNewlines), "stream": true, "max_tokens": maxTokens,
                                  "messages": anthropic ? messages : [["role": "system", "content": system]] + messages]
        if anthropic { body["system"] = system }
        if !anthropic, let effort = reasoningEffort { body["reasoning_effort"] = effort }
        let data = try JSONSerialization.data(withJSONObject: body)
        guard data.count <= 1024 * 1024 else { throw ModuleError.invalid("模型请求内容过大") }
        var request = URLRequest(url: try endpoint())
        request.httpMethod = "POST"; request.httpBody = data
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        if anthropic { request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version") }
        let key = token.trimmingCharacters(in: .whitespacesAndNewlines)
        if !key.isEmpty { request.setValue(anthropic ? key : "Bearer \(key)", forHTTPHeaderField: anthropic ? "x-api-key" : "Authorization") }
        return request
    }
}

// No bridge method exposes this record. All modules use the host-selected destination.
enum LLMStore {
    private static func query(_ service: String, _ account: String) -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: account]
    }
    private static func read(_ service: String, _ account: String) throws -> Data? {
        var q = query(service, account); q[kSecReturnData as String] = true; q[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        let status = SecItemCopyMatching(q as CFDictionary, &item)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess, let data = item as? Data else { throw ModuleError.invalid("无法读取模型配置，请解锁设备后重试（\(status)）") }
        return data
    }
    static func save(_ configuration: LLMConfiguration, service: String = "me.stackli.lingrove.host.llm") throws {
        let q = query(service, "configuration")
        let attributes: [String: Any] = [kSecValueData as String: try JSONEncoder().encode(configuration), kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly]
        var status = SecItemUpdate(q as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound { status = SecItemAdd(q.merging(attributes) { _, new in new } as CFDictionary, nil) }
        guard status == errSecSuccess else { throw ModuleError.invalid("无法保存模型配置（\(status)）") }
    }
    static func load(service: String = "me.stackli.lingrove.host.llm", legacyService: String = "me.stackli.lingrove.module.sentra", preferencesURL: URL? = nil) throws -> LLMConfiguration {
        let file = preferencesURL ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("Lingrove/State/sentra/preferences.v2.json")
        if let data = try read(service, "configuration") {
            let configuration = try JSONDecoder().decode(LLMConfiguration.self, from: data)
            // Retry interrupted cleanup without preventing use of a successfully saved host record.
            try? cleanLegacy(file, service: legacyService)
            return configuration
        }
        guard FileManager.default.fileExists(atPath: file.path) else { return LLMConfiguration() }
        let prefs = try JSONSerialization.jsonObject(with: Data(contentsOf: file)) as? [String: Any] ?? [:]
        guard let base = prefs["baseUrl"] as? String, !base.isEmpty, let model = prefs["model"] as? String, !model.isEmpty else { return LLMConfiguration() }
        let token = try read(legacyService, "model-token").flatMap { String(data: $0, encoding: .utf8) } ?? ""
        let migrated = LLMConfiguration(provider: prefs["protocol"] as? String ?? "openAi", baseURL: base, model: model, token: token)
        try save(migrated, service: service)
        try cleanLegacy(file, service: legacyService)
        return migrated
    }
    private static func cleanLegacy(_ file: URL, service: String) throws {
        if FileManager.default.fileExists(atPath: file.path) {
            var prefs = try JSONSerialization.jsonObject(with: Data(contentsOf: file)) as? [String: Any] ?? [:]
            let keys = ["protocol", "baseUrl", "model", "token"]
            if keys.contains(where: { prefs[$0] != nil }) {
                for key in keys { prefs.removeValue(forKey: key) }
                try JSONSerialization.data(withJSONObject: prefs).write(to: file, options: .atomic)
            }
        }
        let status = SecItemDelete(query(service, "model-token") as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else { throw ModuleError.invalid("旧模型凭据清理失败（\(status)）") }
    }

}

struct LLMSettingsView: View {
    @State private var configuration = LLMConfiguration()
    @State private var message = ""
    @State private var loaded = false
    var body: some View {
        Form {
            Section {
                Picker("接口协议", selection: $configuration.provider) {
                    Text("OpenAI 兼容").tag("openAi")
                    Text("Anthropic 兼容").tag("anthropic")
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text("API Base URL").font(.subheadline).foregroundStyle(.secondary)
                    TextField("输入服务商的接口地址", text: $configuration.baseURL)
                        .keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
                        .accessibilityLabel("API Base URL")
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text("模型名称").font(.subheadline).foregroundStyle(.secondary)
                    TextField("输入模型名称", text: $configuration.model)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                        .accessibilityLabel("模型名称")
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text("API Key").font(.subheadline).foregroundStyle(.secondary)
                    SecureField("服务商需要时填写", text: $configuration.token)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                        .accessibilityLabel("API Key（服务商需要时填写）")
                }
            } header: { Text("模型服务") } footer: { Text("所有子应用共用此配置。提交的内容会发送到此服务商，API Key 仅保存在本机宿主的安全存储中。") }
            Section {
                Picker("推理强度", selection: $configuration.reasoningEffort) {
                    Text("默认（由模型决定）").tag(String?.none)
                    Text("关闭").tag(String?.some("none"))
                    Text("低（更快）").tag(String?.some("low"))
                    Text("高").tag(String?.some("high"))
                    Text("最高").tag(String?.some("max"))
                }
                .disabled(configuration.provider != "openAi")
                .accessibilityIdentifier("llm-reasoning-effort")
            } header: { Text("推理设置") } footer: {
                Text(configuration.provider == "openAi"
                     ? "仅适用于支持推理强度的模型；不确定时请选择默认。Kimi Code 的 k3 建议先选低；选择关闭会由服务端切换为非思考模型。"
                     : "推理强度设置仅用于 OpenAI 兼容接口，当前协议不会发送此参数。")
            }
            Section {
                Button("保存") {
                    do { try configuration.validate(); try LLMStore.save(configuration); message = "已保存，所有子应用将使用此模型服务。" }
                    catch { message = error.localizedDescription }
                }.disabled(!loaded)
                Button("移除 API Key", role: .destructive) {
                    do { var saved = try LLMStore.load(); saved.token = ""; try LLMStore.save(saved); configuration.token = ""; message = "API Key 已移除。" }
                    catch { message = error.localizedDescription }
                }.disabled(!loaded)
                if !message.isEmpty { Text(message).font(.footnote) }
            }
        }.navigationTitle("大模型服务")
        .task {
            do { configuration = try LLMStore.load(); loaded = true }
            catch { message = error.localizedDescription }
        }
    }
}
