import Foundation
import Security
import SwiftUI
import Charts

struct LLMConfiguration: Codable {
    var provider = "openAi"
    var baseURL = ""
    var model = ""
    var token = ""
    // nil lets the provider choose its default reasoning effort.
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
        else { body["stream_options"] = ["include_usage": true] }
        if !anthropic, let effort = reasoningEffort { body["reasoning_effort"] = effort }
        let data = try JSONSerialization.data(withJSONObject: body)
        guard data.count <= 1024 * 1024 else { throw ModuleError.invalid("模型请求内容过大") }
        var request = URLRequest(url: try endpoint())
        if let value = params["timeoutSeconds"] {
            guard let seconds = value as? Double, seconds.isFinite, (1...600).contains(seconds) else {
                throw ModuleError.invalid("模型请求超时必须为 1–600 秒")
            }
            request.timeoutInterval = seconds
        }
        request.httpMethod = "POST"; request.httpBody = data
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        request.setValue(anthropic ? "claude-code" : "codex-cli", forHTTPHeaderField: "User-Agent")
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
    static func load(service: String = "me.stackli.lingrove.host.llm") throws -> LLMConfiguration {
        guard let data = try read(service, "configuration") else { return LLMConfiguration() }
        return try JSONDecoder().decode(LLMConfiguration.self, from: data)
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
                Text(LocalizedStringKey(configuration.provider == "openAi"
                     ? "仅适用于支持推理强度的模型；不确定时请选择默认。Kimi Code 的 k3 建议先选低；选择关闭会由服务端切换为非思考模型。"
                     : "推理强度设置仅用于 OpenAI 兼容接口，当前协议不会发送此参数。"))
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
                if !message.isEmpty { Text(AppLanguage.text(message)).font(.footnote) }
            }
        }.navigationTitle("大模型服务")
        .task {
            do { configuration = try LLMStore.load(); loaded = true }
            catch { message = error.localizedDescription }
        }
    }
}

// Stores only counters and attribution, never prompts, responses or credentials.
struct LLMUsageTotals: Codable {
    var requests = 0
    var inputTokens = 0
    var outputTokens = 0
    var reportedRequests = 0

    var tokens: Int { inputTokens + outputTokens }

    mutating func add(_ other: Self) {
        requests += other.requests
        inputTokens += other.inputTokens
        outputTokens += other.outputTokens
        reportedRequests += other.reportedRequests
    }
}

struct LLMUsageRecord: Codable {
    let appID: String
    var appName: String
    let provider: String
    var totals = LLMUsageTotals()
}

struct LLMUsageGroup: Identifiable {
    let id: String
    let name: String
    let totals: LLMUsageTotals
}

struct LLMDailyUsage: Codable, Identifiable {
    let day: Date
    let appID: String
    var tokens: Int
    var id: String { "\(day.timeIntervalSince1970):\(appID)" }
}

// Stream usage values are cumulative snapshots, not per-chunk increments.
struct LLMUsageCollector {
    let protocolName: String
    var inputTokens: Int?
    var outputTokens: Int?
    private var eventData = ""

    init(protocolName: String) { self.protocolName = protocolName }

    mutating func consumeLine(_ line: String) {
        let line = line.trimmingCharacters(in: .newlines)
        if line.isEmpty { flushEvent(); return }
        guard line.hasPrefix("data:") else { return }
        if !eventData.isEmpty { eventData += "\n" }
        eventData += String(line.dropFirst(5)).trimmingCharacters(in: .whitespaces)
    }

    mutating func flushEvent() {
        consumeJSON(Data(eventData.utf8))
        eventData = ""
    }

    mutating func consumeJSON(_ data: Data) {
        guard let object = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return }
        let message = object["message"] as? [String: Any]
        guard let usage = (object["usage"] ?? message?["usage"]) as? [String: Any] else { return }
        func count(_ key: String) -> Int? {
            guard let value = usage[key] as? Int, value >= 0 else { return nil }
            return value
        }
        if protocolName == "anthropic" {
            if let input = count("input_tokens") {
                inputTokens = max(inputTokens ?? 0, input + (count("cache_creation_input_tokens") ?? 0) + (count("cache_read_input_tokens") ?? 0))
            }
            if let output = count("output_tokens") { outputTokens = max(outputTokens ?? 0, output) }
        } else {
            if let input = count("prompt_tokens") { inputTokens = max(inputTokens ?? 0, input) }
            if let output = count("completion_tokens") { outputTokens = max(outputTokens ?? 0, output) }
        }
    }
}

@MainActor final class LLMUsageStore: ObservableObject {
    static let shared = LLMUsageStore()
    @Published private(set) var records: [LLMUsageRecord] = []
    @Published private(set) var dailyRecords: [LLMDailyUsage] = []
    @Published private(set) var storageError: String?
    private let defaults: UserDefaults
    private let key = "host.llm.usage"
    private let dailyKey = "host.llm.usage.daily"

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        loadDaily()
        if let data = defaults.data(forKey: key) {
            do { records = try JSONDecoder().decode([LLMUsageRecord].self, from: data) }
            catch { storageError = "无法读取已保存的用量统计，未覆盖原数据。" }
        }
    }

    private func loadDaily() {
        guard let data = defaults.data(forKey: dailyKey) else { return }
        do { dailyRecords = try JSONDecoder().decode([LLMDailyUsage].self, from: data) }
        catch { storageError = "无法读取已保存的用量统计，未覆盖原数据。" }
    }

    static func providerID(_ endpoint: URL) -> String {
        let host = endpoint.host?.lowercased() ?? "未知服务商"
        return host + (endpoint.port.flatMap { $0 == 443 ? nil : ":\($0)" } ?? "")
    }

    func begin(appID: String, appName: String, provider: String) {
        guard storageError == nil else { return }
        if let index = records.firstIndex(where: { $0.appID == appID && $0.provider == provider }) {
            records[index].appName = appName
            records[index].totals.requests += 1
        } else {
            records.append(LLMUsageRecord(appID: appID, appName: appName, provider: provider, totals: LLMUsageTotals(requests: 1)))
        }
        save()
    }

    func finish(appID: String, provider: String, usage: LLMUsageCollector, date: Date = Date(), calendar: Calendar = .current) {
        guard storageError == nil, let index = records.firstIndex(where: { $0.appID == appID && $0.provider == provider }) else { return }
        records[index].totals.inputTokens += usage.inputTokens ?? 0
        records[index].totals.outputTokens += usage.outputTokens ?? 0
        if usage.inputTokens != nil && usage.outputTokens != nil { records[index].totals.reportedRequests += 1 }
        let tokens = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)
        if tokens > 0 {
            let day = calendar.startOfDay(for: date)
            if let dailyIndex = dailyRecords.firstIndex(where: { $0.day == day && $0.appID == appID }) {
                dailyRecords[dailyIndex].tokens += tokens
            } else {
                dailyRecords.append(LLMDailyUsage(day: day, appID: appID, tokens: tokens))
            }
        }
        save()
    }

    private func save() {
        do {
            let data = try JSONEncoder().encode(records)
            let dailyData = try JSONEncoder().encode(dailyRecords)
            defaults.set(data, forKey: key)
            defaults.set(dailyData, forKey: dailyKey)
        }
        catch { storageError = "无法保存用量统计。" }
    }

    var total: LLMUsageTotals {
        records.reduce(into: LLMUsageTotals()) { $0.add($1.totals) }
    }

    func groups(byProvider: Bool, provider: String? = nil) -> [LLMUsageGroup] {
        let filtered = records.filter { provider == nil || $0.provider == provider }
        return Dictionary(grouping: filtered, by: { byProvider ? $0.provider : $0.appID }).map { id, rows in
            LLMUsageGroup(id: id, name: byProvider ? id : rows.last!.appName,
                          totals: rows.reduce(into: LLMUsageTotals()) { $0.add($1.totals) })
        }.sorted { $0.totals.requests == $1.totals.requests ? $0.id < $1.id : $0.totals.requests > $1.totals.requests }
    }
}

struct LLMUsageMetrics: View {
    let totals: LLMUsageTotals
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            LabeledContent("请求数", value: totals.requests.formatted())
            LabeledContent("发送 Token", value: totals.inputTokens.formatted())
            LabeledContent("接收 Token", value: totals.outputTokens.formatted())
            if totals.reportedRequests < totals.requests {
                Text("\((totals.requests - totals.reportedRequests).formatted()) 次请求用量未完整返回")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }.monospacedDigit()
    }
}

private enum LLMUsageColors {
    static let palette: [Color] = [.blue, .orange, .green, .purple, .pink, .cyan, .indigo, .brown, .mint, .red]
    static func color(_ id: String, in groups: [LLMUsageGroup]) -> Color {
        let index = groups.map(\.id).sorted().firstIndex(of: id) ?? 0
        return palette[index % palette.count]
    }
}

struct LLMUsagePieChart: View {
    let groups: [LLMUsageGroup]
    private var total: Int { groups.reduce(0) { $0 + $1.totals.tokens } }
    private var sortedGroups: [LLMUsageGroup] {
        groups.sorted { $0.totals.tokens == $1.totals.tokens ? $0.id < $1.id : $0.totals.tokens > $1.totals.tokens }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if total > 0 {
                Chart(sortedGroups.filter { $0.totals.tokens > 0 }) { group in
                    SectorMark(angle: .value("Token", group.totals.tokens), angularInset: 1)
                        .foregroundStyle(LLMUsageColors.color(group.id, in: groups))
                        .accessibilityLabel(group.name)
                        .accessibilityValue("\(group.totals.tokens.formatted()) Token")
                }.frame(height: 220)
            } else {
                Text("暂无已返回的 Token 用量。") .foregroundStyle(.secondary)
            }
            ForEach(sortedGroups) { group in
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Circle().fill(LLMUsageColors.color(group.id, in: groups)).frame(width: 8, height: 8)
                    Text(group.name).frame(maxWidth: .infinity, alignment: .leading)
                    Text((total > 0 ? Double(group.totals.tokens) / Double(total) : 0).formatted(.percent.precision(.fractionLength(1))))
                        .monospacedDigit().foregroundStyle(.secondary)
                }.font(.subheadline)
            }
        }.padding(.vertical, 8)
    }
}

struct LLMDailyUsageChart: View {
    let records: [LLMDailyUsage]
    let groups: [LLMUsageGroup]
    private var today: Date { Calendar.current.startOfDay(for: Date()) }
    private var start: Date {
        min(records.map(\.day).min() ?? today, Calendar.current.date(byAdding: .day, value: -13, to: today)!)
    }
    private var end: Date { Calendar.current.date(byAdding: .day, value: 1, to: today)! }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if records.isEmpty {
                Text("暂无每日用量，新的请求结束后将自动记录。") .foregroundStyle(.secondary)
            } else {
                Chart(records.sorted { $0.day == $1.day ? $0.appID < $1.appID : $0.day < $1.day }) { record in
                    BarMark(x: .value("Date", record.day, unit: .day), y: .value("Token", record.tokens))
                        .foregroundStyle(LLMUsageColors.color(record.appID, in: groups))
                        .accessibilityLabel("\(record.day.formatted(date: .abbreviated, time: .omitted)), \(groups.first { $0.id == record.appID }?.name ?? record.appID)")
                        .accessibilityValue("\(record.tokens.formatted()) Token")
                }
                .chartXScale(domain: start...end)
                .chartScrollableAxes(.horizontal)
                .chartXVisibleDomain(length: 14 * 24 * 60 * 60)
                .chartScrollPosition(initialX: Calendar.current.date(byAdding: .day, value: -13, to: today)!)
                .chartXAxis { AxisMarks(values: .stride(by: .day, count: 2)) { _ in
                    AxisGridLine()
                    AxisTick()
                    AxisValueLabel(format: .dateTime.month(.defaultDigits).day())
                } }
                .chartYAxis { AxisMarks(position: .leading) }
                .frame(height: 240)
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 120), alignment: .leading)], alignment: .leading, spacing: 8) {
                    ForEach(groups.sorted { $0.id < $1.id }) { group in
                        Label { Text(group.name) } icon: {
                            Circle().fill(LLMUsageColors.color(group.id, in: groups)).frame(width: 8, height: 8)
                        }.font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
        }.padding(.vertical, 8)
    }
}

struct LLMUsageSummary: View {
    let totals: LLMUsageTotals
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 4) {
                Text("累计 Token").font(.subheadline).foregroundStyle(.secondary)
                Text(totals.tokens.formatted()).font(.system(.largeTitle, design: .rounded, weight: .semibold)).monospacedDigit()
            }
            LLMUsageMetrics(totals: totals).font(.subheadline)
        }.padding(.vertical, 8)
    }
}

struct LLMUsageGroupRow: View {
    let group: LLMUsageGroup
    let groups: [LLMUsageGroup]
    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Circle().fill(LLMUsageColors.color(group.id, in: groups)).frame(width: 8, height: 8)
            Text(group.name).font(.subheadline.weight(.medium)).frame(maxWidth: .infinity, alignment: .leading)
            VStack(alignment: .trailing, spacing: 2) {
                Text(group.totals.tokens.formatted()).font(.subheadline.weight(.semibold)).monospacedDigit()
                Text("Token").font(.caption2).foregroundStyle(.secondary)
            }
        }.padding(.vertical, 4)
    }
}

struct LLMUsageAppRows: View {
    let groups: [LLMUsageGroup]
    var body: some View {
        ForEach(groups.sorted { $0.totals.tokens == $1.totals.tokens ? $0.id < $1.id : $0.totals.tokens > $1.totals.tokens }) { group in
            DisclosureGroup {
                LLMUsageMetrics(totals: group.totals).font(.subheadline).padding(.vertical, 8)
            } label: {
                LLMUsageGroupRow(group: group, groups: groups)
            }
        }
    }
}

struct LLMUsageView: View {
    @ObservedObject private var store = LLMUsageStore.shared
    @State private var showingNotes = false
    private var apps: [LLMUsageGroup] { store.groups(byProvider: false) }
    private var providers: [LLMUsageGroup] { store.groups(byProvider: true) }

    var body: some View {
        List {
            if let error = store.storageError { Section { Text(AppLanguage.text(error)).foregroundStyle(.red) } }
            Section("用量总览") {
                LLMUsageSummary(totals: store.total)
                if !store.records.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("每日 Token 用量").font(.subheadline.weight(.semibold))
                        LLMDailyUsageChart(records: store.dailyRecords, groups: apps)
                    }.padding(.vertical, 8)
                }
            }
            if store.records.isEmpty {
                Section { Text("暂无使用记录，子应用调用大模型后将自动统计。").foregroundStyle(.secondary) }
            } else {
                Section {
                    LLMUsageAppRows(groups: apps)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Token 占比").font(.subheadline.weight(.semibold))
                        LLMUsagePieChart(groups: apps)
                    }.padding(.vertical, 8)
                } header: { Text("按应用") }

                Section {
                    ForEach(providers.sorted { $0.totals.tokens == $1.totals.tokens ? $0.id < $1.id : $0.totals.tokens > $1.totals.tokens }) { group in
                        NavigationLink {
                            List {
                                Section("服务商累计") { LLMUsageSummary(totals: group.totals) }
                                Section("各应用用量") {
                                    LLMUsageAppRows(groups: store.groups(byProvider: false, provider: group.id))
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Token 占比").font(.subheadline.weight(.semibold))
                                        LLMUsagePieChart(groups: store.groups(byProvider: false, provider: group.id))
                                    }.padding(.vertical, 8)
                                }
                            }.listStyle(.insetGrouped)
                                .navigationTitle(group.name).navigationBarTitleDisplayMode(.inline)
                        } label: {
                            LLMUsageGroupRow(group: group, groups: providers)
                        }
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Token 占比").font(.subheadline.weight(.semibold))
                        LLMUsagePieChart(groups: providers)
                    }.padding(.vertical, 8)
                } header: { Text("按服务提供商") }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("大模型使用统计").navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showingNotes = true } label: { Image(systemName: "info.circle") }
                    .accessibilityLabel(Text("统计说明"))
            }
        }
        .sheet(isPresented: $showingNotes) {
            NavigationStack {
                List {
                    Section("累计用量") {
                        Text("从启用统计后开始累计，仅记录本机宿主大模型服务请求。请求数含失败和取消；Token 以服务商返回为准，含缓存输入与推理用量，未返回的部分不估算。")
                    }
                    Section("每日 Token 用量") {
                        Text("按请求结束时的本地日期归集发送与接收 Token。左右滑动可查看其他日期。")
                    }
                    Section("按服务提供商") {
                        Text("按 API 服务域名及端口归集。同一地址下的模型和接口协议合并统计；切换服务商后保留历史累计。")
                    }
                }.navigationTitle("统计说明").navigationBarTitleDisplayMode(.inline)
                    .toolbar { ToolbarItem(placement: .confirmationAction) { Button("完成") { showingNotes = false } } }
            }
        }
    }
}
