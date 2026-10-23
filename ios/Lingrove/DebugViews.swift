import SwiftUI
import Security

#if DEBUG
struct DebugAddressRow: View {
    let serverID: String
    @Binding var address: String
    let selected: Bool
    let testing: Bool
    let message: String?
    let failed: Bool
    let onSelect: () -> Void
    let onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Button(action: onSelect) {
                    Image(systemName: selected ? "largecircle.fill.circle" : "circle")
                        .font(.system(size: 22))
                        .frame(width: 44, height: 44)
                }
                .buttonStyle(.borderless)
                .accessibilityLabel("选择此地址")
                .accessibilityAddTraits(selected ? [.isSelected] : [])
                .accessibilityIdentifier("debug-address-select-\(serverID)")
                TextField("", text: $address)
                    .textInputAutocapitalization(.never).autocorrectionDisabled().keyboardType(.URL)
                    .submitLabel(.done)
                    .accessibilityLabel("调试服务器地址")
                    .accessibilityIdentifier("debug-address-\(serverID)")
                Button(role: .destructive, action: onDelete) { Image(systemName: "trash") }
                    .buttonStyle(.borderless)
                    .frame(minWidth: 44, minHeight: 44)
                    .accessibilityLabel("删除调试地址")
                    .accessibilityIdentifier("debug-address-delete-\(serverID)")
            }
            if testing {
                HStack(spacing: 6) { ProgressView(); Text("正在测试…") }
                    .font(.footnote)
            } else if let message {
                Text(message).foregroundStyle(failed ? Color.red : Color.secondary)
                    .font(.footnote)
                    .accessibilityIdentifier("debug-address-result-\(serverID)")
            }
        }
        .alignmentGuide(.listRowSeparatorLeading) { $0[.leading] }
        .alignmentGuide(.listRowSeparatorTrailing) { $0[.trailing] }
    }
}

struct HostAppUpdateSection: View {
    @State private var release: HostAppRelease?
    @State private var checking = false
    @State private var failed = false
    @State private var updateCheckID = 0

    private var currentVersion: String {
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? ""
        return "\(HostConfiguration.currentVersion) (\(build))"
    }

    var body: some View {
        Section {
            HStack(spacing: 16) {
                LabeledContent("当前版本", value: currentVersion)
                Button("检测更新") { updateCheckID += 1 }
                    .buttonStyle(.borderedProminent)
                    .tint(.blue)
                    .fixedSize()
                    .disabled(checking)
                    .accessibilityIdentifier("host-app-check-update")
            }
            if let release, release.isNewer(than: HostConfiguration.currentVersion,
                                           build: Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "") {
                Button {
                    guard let url = release.installURL else { return }
                    UIApplication.shared.open(url, options: [:]) { opened in
                        Task { @MainActor in failed = !opened }
                    }
                } label: {
                    HStack {
                        Image(systemName: "arrow.down.circle.fill")
                            .foregroundStyle(.green)
                            .accessibilityHidden(true)
                        Text("安装最新版")
                        Spacer()
                        VStack(alignment: .trailing, spacing: 4) {
                            Text("\(release.version) (\(release.build))")
                            Text(release.builtAt.formatted(date: .numeric, time: .shortened))
                                .font(.footnote).foregroundStyle(.secondary)
                        }
                        .multilineTextAlignment(.trailing)
                    }
                }
                .accessibilityIdentifier("host-app-install-update")
            }
            if checking {
                ProgressView().frame(maxWidth: .infinity)
            } else if !failed, let release,
                      !release.isNewer(than: HostConfiguration.currentVersion,
                                       build: Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "") {
                Text("已是最新版本").font(.footnote).foregroundStyle(.secondary)
            }
            Link("查看下载页面", destination: URL(string: "https://lingrove.stackli.me/ios/")!)
            if failed {
                Text("无法获取或打开安装包，请稍后重试，或通过安装页面更新。")
                    .font(.footnote).foregroundStyle(.red)
            }
        } header: {
            Text("更新 App")
        } footer: {
            Text("更新 Lingrove 宿主 App。安装需系统确认，且设备必须已登记；安装期间请返回主屏幕等待完成。")
        }
        .task(id: updateCheckID) { await checkForUpdate() }
    }

    @MainActor private func checkForUpdate() async {
        checking = true
        failed = false
        release = nil
        defer { checking = false }
        do {
            var request = URLRequest(url: URL(string: "https://lingrove.stackli.me/ios/latest.json")!,
                                     cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 20)
            request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
            let (data, response) = try await URLSession.shared.data(for: request)
            try Task.checkCancellation()
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { failed = true; return }
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let latest = try decoder.decode(HostAppRelease.self, from: data)
            guard latest.installURL != nil else { failed = true; return }
            release = latest
        } catch is CancellationError {
            return
        } catch {
            guard !Task.isCancelled else { return }
            failed = true
        }
    }
}

struct ModuleDownloadStatusView: View {
    let state: ModuleDownloadState?
    var progress: Double? = nil
    var installed = false

    var body: some View {
        HStack(spacing: 5) {
            switch state {
            case .checking:
                ProgressView().controlSize(.small)
                Text("正在检查更新…")
            case .waiting:
                Text("等待下载…")
            case .downloading:
                ProgressView().controlSize(.small)
                Text("正在下载…")
                if let progress { Text(progress, format: .percent.precision(.fractionLength(0))).monospacedDigit() }
            case .succeeded:
                Label("下载成功", systemImage: "checkmark.circle.fill").foregroundStyle(.green)
            case .failed:
                Label("下载失败", systemImage: "exclamationmark.circle.fill").foregroundStyle(.red)
            case .unchanged:
                Text("已是最新版本")
            case .deferred:
                Text("暂未下载")
            case nil:
                Text(AppLanguage.text(installed ? "已下载" : "尚未下载"))
            }
        }
        .font(.subheadline)
        .foregroundStyle(.secondary)
        .accessibilityElement(children: .combine)
    }
}

struct ModuleListDownloadStatusView: View {
    let record: ModuleDownloadRecord?
    let progress: Double?
    @State private var expiredRecord: ModuleDownloadRecord?

    var body: some View {
        if let record, record != expiredRecord, record.isVisible(at: Date()) {
            ModuleDownloadStatusView(state: record.state, progress: progress)
                .task(id: record) {
                    guard !record.state.isInProgress, let completedAt = record.completedAt else { return }
                    do {
                        try await Task.sleep(for: .seconds(max(0, completedAt.timeIntervalSinceNow + 5)))
                        guard !Task.isCancelled else { return }
                        expiredRecord = record
                    } catch { }
                }
        }
    }
}

struct ModuleListReloadStatusView: View {
    let record: ModuleReloadRecord?
    @State private var expiredRecord: ModuleReloadRecord?

    var body: some View {
        Group {
            if let record, record != expiredRecord, let state = record.listState(at: Date()) {
                ModuleReloadStatusView(state: state)
                    .task(id: record) {
                        guard state != .loading, let completedAt = record.completedAt else { return }
                        do {
                            try await Task.sleep(for: .seconds(max(0, completedAt.timeIntervalSinceNow + 5)))
                            guard !Task.isCancelled else { return }
                            expiredRecord = record
                        } catch {
                            // A new refresh or leaving the list cancels the previous countdown.
                        }
                    }
            }
        }
    }
}

struct ModuleReloadStatusView: View {
    let state: ModuleLoadState?

    var body: some View {
        HStack(spacing: 5) {
            switch state {
            case .loading:
                ProgressView().controlSize(.small)
                Text("正在刷新…")
            case .succeeded:
                Label("刷新成功", systemImage: "checkmark.circle.fill").foregroundStyle(.green)
            case .failed:
                Label("刷新失败", systemImage: "exclamationmark.circle.fill").foregroundStyle(.red)
            case nil:
                Text("尚未刷新")
            }
        }
        .font(.subheadline)
        .foregroundStyle(.secondary)
        .accessibilityElement(children: .combine)
    }
}

struct ModuleDeveloperDetailsView: View {
    @ObservedObject var store: ModuleStore
    @ObservedObject var pages: ModulePageCache
    @AppStorage(HostConfiguration.resourceModePreferenceKey) private var resourceMode = ChildAppResourceMode.bundled
    let moduleID: String
    private var module: Module? { store.modules.first { $0.id == moduleID } }

    private func localSource(_ module: Module) -> String {
        store.isDownloaded(module) ? "下载包" : "宿主内置"
    }

    private func resourceSource(_ module: Module) -> ModuleResourceSource {
        switch pages.resourceSources[moduleID] {
        case nil, .failed:
            // Use the same target as the next load; no page has finished loading.
            return .loading(store.remoteEntryURL(for: module))
        case let source?: return source
        }
    }

    var body: some View {
        Form {
            if let module {
                if resourceMode != .debug {
                    Section {
                        HStack(spacing: 12) {
                            Text("下载状态")
                            Spacer(minLength: 8)
                            ModuleDownloadStatusView(state: store.downloadRecords[moduleID]?.state,
                                                     progress: store.downloadProgress[moduleID],
                                                     installed: store.isDownloaded(module))
                        }
                        .fixedSize(horizontal: false, vertical: true)
                        .alignmentGuide(.listRowSeparatorLeading) { _ in 0 }
                        ModuleInformationRow(title: "最近下载时间", value: store.lastUpdatedAt(for: module).map {
                            $0.formatted(Date.FormatStyle(date: .abbreviated, time: .standard).locale(Locale(identifier: AppLanguage.current)))
                        } ?? AppLanguage.text("暂无记录"))
                        .accessibilityIdentifier("module-download-time")
                        if let record = store.downloadRecords[moduleID],
                           record.state == .failed || record.state == .deferred {
                            Text(AppLanguage.text(record.message))
                                .font(.footnote).foregroundStyle(.secondary)
                                .accessibilityIdentifier("module-download-result")
                        }
                    }
                } else {
                    Section {
                        HStack(spacing: 12) {
                            Text("刷新状态")
                            Spacer(minLength: 8)
                            ModuleReloadStatusView(state: pages.reloadRecords[moduleID]?.state)
                        }
                        .fixedSize(horizontal: false, vertical: true)
                        .alignmentGuide(.listRowSeparatorLeading) { _ in 0 }
                        ModuleInformationRow(title: "最近刷新时间", value: pages.reloadRecords[moduleID]?.completedAt.map {
                            $0.formatted(Date.FormatStyle(date: .abbreviated, time: .standard).locale(Locale(identifier: AppLanguage.current)))
                        } ?? AppLanguage.text("暂无记录"))
                        .accessibilityIdentifier("module-refresh-time")
                        if let record = pages.reloadRecords[moduleID] {
                            Text(AppLanguage.text(record.message))
                                .font(.footnote).foregroundStyle(.secondary)
                                .accessibilityIdentifier("module-refresh-result")
                        }
                    }
                }
                Section {
                    let source = resourceSource(module)
                    let value = source.remoteURL == nil ? localSource(module) : "网页资源"
                    LabeledContent("应用来源", value: AppLanguage.text(value))
                        .accessibilityElement(children: .ignore)
                        .accessibilityLabel(Text(verbatim: AppLanguage.text("应用来源")))
                        .accessibilityValue(Text(verbatim: AppLanguage.text(value)))
                        .accessibilityIdentifier("module-resource-source")
                    if let address = source.remoteURL {
                        ModuleInformationRow(title: "目录版本", value: store.catalogVersion(for: module))
                        ModuleInformationRow(title: "资源地址", value: address.absoluteString)
                    } else {
                        ModuleInformationRow(title: "版本", value: module.version)
                        ModuleInformationRow(title: "文件名", value: store.isDownloaded(module)
                            ? (module.downloadUrl.flatMap(URL.init(string:))?.lastPathComponent ?? module.entry)
                            : module.entry)
                        if store.isDownloaded(module), let address = module.downloadUrl {
                            ModuleInformationRow(title: "下载地址", value: address)
                        }
                    }
                }
            } else {
                Text("暂无已安装的应用").foregroundStyle(.secondary)
            }
        }
        .hostSettingsBackground()
        .navigationTitle(module?.name ?? moduleID)
        .navigationBarTitleDisplayMode(.inline)
    }
}
private struct BuildStatusError: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

private enum GitHubBuildTokenStore {
    private static var query: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: "me.stackli.lingrove.github-build",
         kSecAttrAccount as String: "token"]
    }

    static func load() throws -> String {
        var request = query
        request[kSecReturnData as String] = true
        request[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(request as CFDictionary, &result)
        if status == errSecItemNotFound { return "" }
        guard status == errSecSuccess, let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            throw BuildStatusError(message: "无法读取 GitHub Token，请解锁设备后重试（\(status)）。")
        }
        return token
    }

    static func save(_ token: String) throws {
        if token.isEmpty {
            let status = SecItemDelete(query as CFDictionary)
            guard status == errSecSuccess || status == errSecItemNotFound else {
                throw BuildStatusError(message: "无法删除 GitHub Token（\(status)）。")
            }
            return
        }
        let attributes: [String: Any] = [kSecValueData as String: Data(token.utf8),
                                        kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly]
        var status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            status = SecItemAdd(query.merging(attributes) { _, value in value } as CFDictionary, nil)
        }
        guard status == errSecSuccess else {
            throw BuildStatusError(message: "无法保存 GitHub Token（\(status)）。")
        }
    }
}

struct GitHubBuildStatusClient {
    var session: URLSession = .shared
    let workflow: String
    let token: String

    struct Run: Decodable {
        let id: Int
        let runNumber: Int
        let runAttempt: Int
        let status: String
        let conclusion: String?
        let updatedAt: Date

        var refreshInterval: Int {
            status == "completed" || conclusion != nil ? 30 : 5
        }
    }
    struct Job: Decodable, Identifiable {
        struct Step: Decodable {
            let name: String
            let status: String
        }
        let id: Int
        let name: String
        let status: String
        let conclusion: String?
        let steps: [Step]?

        var activeStep: String? {
            steps?.first { $0.status == "in_progress" }?.name
        }
    }
    struct Snapshot {
        let run: Run
        let jobs: [Job]
    }

    private func get<T: Decodable>(_ path: String, as type: T.Type) async throws -> T {
        try Task.checkCancellation()
        let url = URL(string: "https://api.github.com/repos/stacklix/lingrove/" + path)!
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 15)
        request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        request.setValue("2022-11-28", forHTTPHeaderField: "X-GitHub-Api-Version")
        request.setValue("Lingrove-iOS", forHTTPHeaderField: "User-Agent")
        if !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, response) = try await session.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard status == 200 else {
            switch status {
            case 401:
                throw BuildStatusError(message: "GitHub Token 无效或已过期，请重新配置并保存。")
            case 403, 404:
                throw BuildStatusError(message: "无法读取构建状态（HTTP \(status)）。请检查 Token 是否可访问 stacklix/lingrove 并具有 Actions 读取权限；也可能遇到 API 限流。")
            case 429:
                throw BuildStatusError(message: "GitHub 请求频率受限，请稍后刷新。")
            default:
                throw BuildStatusError(message: "读取构建状态失败（HTTP \(status)），请稍后刷新。")
            }
        }
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(type, from: data)
    }

    func latest() async throws -> Snapshot? {
        struct Runs: Decodable { let workflowRuns: [Run] }
        struct Jobs: Decodable { let jobs: [Job] }
        let result = try await get("actions/workflows/\(workflow)/runs?branch=master&per_page=1", as: Runs.self)
        guard let run = result.workflowRuns.first else { return nil }
        // Pin jobs to this attempt so a rerun never mixes old and new steps.
        let jobs = try await get("actions/runs/\(run.id)/attempts/\(run.runAttempt)/jobs?per_page=100", as: Jobs.self)
        return Snapshot(run: run, jobs: jobs.jobs)
    }

    static func statusText(_ status: String, conclusion: String?) -> String {
        if let conclusion {
            switch conclusion {
            case "success": return "已完成"
            case "failure": return "失败"
            case "cancelled": return "已取消"
            case "skipped": return "已跳过"
            case "timed_out": return "超时"
            case "action_required": return "需要操作"
            case "neutral": return "已结束"
            default: return conclusion
            }
        }
        switch status {
        case "queued": return "排队中"
        case "in_progress": return "执行中"
        case "waiting", "pending", "requested": return "等待中"
        case "completed": return "已结束"
        default: return status
        }
    }
}

struct GitHubBuildStatusSection: View {
    let isPresented: Bool
    @State private var workflow = "ios-adhoc.yml"
    @State private var draftToken = ""
    @State private var savedToken = ""
    @State private var tokenRevision = 0
    @State private var tokenError: String?
    @State private var tokenLoaded = false

    var body: some View {
        Section {
            HStack(spacing: 16) {
                SecureField("GitHub Token", text: $draftToken)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .accessibilityIdentifier("github-build-token")
                    .task {
                        defer { tokenLoaded = true }
                        do {
                            let token = try GitHubBuildTokenStore.load()
                            draftToken = token
                            savedToken = token
                        } catch { tokenError = error.localizedDescription }
                    }
                Button("保存") {
                    let token = draftToken.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard token.utf8.count <= 16384, token.rangeOfCharacter(from: .controlCharacters) == nil else {
                        tokenError = "GitHub Token 格式无效。"
                        return
                    }
                    do {
                        try GitHubBuildTokenStore.save(token)
                        draftToken = token
                        savedToken = token
                        tokenError = nil
                        tokenRevision += 1
                    } catch { tokenError = error.localizedDescription }
                }
                .buttonStyle(.borderedProminent)
                .tint(.blue)
                .fixedSize()
                .accessibilityIdentifier("github-build-save-token")
            }
            .alignmentGuide(.listRowSeparatorLeading) { $0[.leading] }
            .alignmentGuide(.listRowSeparatorTrailing) { $0[.trailing] }
            if let tokenError {
                Text(tokenError).font(.footnote).foregroundStyle(.secondary)
            }
            Picker("构建流程", selection: $workflow) {
                Text("iOS 安装包").tag("ios-adhoc.yml")
                Text("子应用发布").tag("build-gh-pages.yml")
            }
            .pickerStyle(.menu)
            .accessibilityIdentifier("github-workflow-picker")
            if isPresented && tokenLoaded {
                GitHubBuildStatusView(workflow: workflow, token: savedToken, isPresented: isPresented)
                    .id("\(workflow)-\(tokenRevision)")
            }
        } header: {
            Text("GitHub 构建进度")
        } footer: {
            Text("Token 仅保存在本机 Keychain，清空后保存可删除 Token。未配置 Token 时，进入页面或切换构建流程读取一次，不自动刷新。配置 Token 后，仅设置页打开且 App 在前台时自动拉取：运行中每 5 秒刷新，结束后每 30 秒刷新，失败后每 120 秒重试。")
        }
    }
}

struct GitHubBuildStatusView: View {
    let workflow: String
    let token: String
    let isPresented: Bool
    @Environment(\.scenePhase) private var scenePhase
    @State private var snapshot: GitHubBuildStatusClient.Snapshot?
    @State private var errorMessage: String?
    @State private var loading = false
    @State private var loaded = false
    @State private var refreshID = 0
    @State private var checkedAt: Date?

    var body: some View {
        Group {
            if let snapshot {
                LabeledContent("构建 #\(snapshot.run.runNumber)", value: GitHubBuildStatusClient.statusText(snapshot.run.status, conclusion: snapshot.run.conclusion))
                ForEach(snapshot.jobs) { job in
                    VStack(alignment: .leading, spacing: 4) {
                        LabeledContent(job.name == "build" ? "打包" : job.name == "deploy" ? "发布下载页面" : job.name,
                                       value: GitHubBuildStatusClient.statusText(job.status, conclusion: job.conclusion))
                        if let step = job.activeStep {
                            Text(step).font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            } else if !loaded {
                ProgressView("读取构建进度…")
            } else if errorMessage == nil {
                Text("暂无构建记录").foregroundStyle(.secondary)
            }
            if let errorMessage {
                Text(errorMessage).font(.footnote).foregroundStyle(.secondary)
            }
            if !token.isEmpty || loading || checkedAt != nil {
                HStack {
                    if !token.isEmpty {
                        Button("刷新进度") { refreshID += 1 }.disabled(loading)
                    }
                    Spacer()
                    if loading { ProgressView() }
                    else if let checkedAt {
                        Text("更新于 \(checkedAt.formatted(date: .omitted, time: .standard))")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
            Link("在 GitHub 查看", destination: URL(string: snapshot.map {
                "https://github.com/stacklix/lingrove/actions/runs/\($0.run.id)"
            } ?? "https://github.com/stacklix/lingrove/actions/workflows/\(workflow)")!)
                .task(id: "\(isPresented)-\(scenePhase)-\(refreshID)") {
                    guard isPresented && scenePhase == .active else { return }
                    if token.isEmpty {
                        guard !loaded else { return }
                        await refresh()
                        return
                    }
                    repeat {
                        await refresh()
                        // Back off after errors instead of repeatedly hitting a rate limit.
                        let interval = errorMessage == nil ? (snapshot?.run.refreshInterval ?? 30) : 120
                        do { try await Task.sleep(for: .seconds(interval)) }
                        catch { return }
                    } while !Task.isCancelled
                }
        }
    }

    @MainActor private func refresh() async {
        guard isPresented && scenePhase == .active && !Task.isCancelled else { return }
        loading = true
        defer { loading = false }
        do {
            let latest = try await GitHubBuildStatusClient(workflow: workflow, token: token).latest()
            try Task.checkCancellation()
            snapshot = latest
            errorMessage = nil
            checkedAt = .now
            loaded = true
        } catch {
            guard !Task.isCancelled else { return }
            errorMessage = error.localizedDescription
            loaded = true
        }
    }
}


#endif
