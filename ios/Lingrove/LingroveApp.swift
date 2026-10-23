import SwiftUI
import Security

// Dynamic colors shared by the native shell and the embedded page background.
enum LingroveTheme {
    static let onAccent = UIColor { $0.userInterfaceStyle == .dark
        ? UIColor(red: 21/255, green: 28/255, blue: 25/255, alpha: 1)
        : .white }

    static let background = UIColor { $0.userInterfaceStyle == .dark
        ? UIColor(red: 21/255, green: 28/255, blue: 25/255, alpha: 1)
        : UIColor(red: 245/255, green: 243/255, blue: 236/255, alpha: 1) }
    static let surface = UIColor { $0.userInterfaceStyle == .dark
        ? UIColor(red: 32/255, green: 42/255, blue: 36/255, alpha: 1)
        : UIColor(red: 1, green: 254/255, blue: 249/255, alpha: 1) }
    static let accent = UIColor { $0.userInterfaceStyle == .dark
        ? UIColor(red: 170/255, green: 213/255, blue: 188/255, alpha: 1)
        : UIColor(red: 40/255, green: 112/255, blue: 82/255, alpha: 1) }
}

extension View {
    /// Match the Home app list surface while retaining native grouped row shapes.
    func hostSettingsRowBackground() -> some View {
        listRowBackground(Color(uiColor: LingroveTheme.surface))
    }

    /// Shared canvas for native settings, including pushed pages and sheets.
    func hostSettingsBackground() -> some View {
        scrollContentBackground(.hidden)
            .background(Color(uiColor: LingroveTheme.background).ignoresSafeArea())
            // Settings has its own navigation bar; do not inherit Home's hidden
            // bar or rely on automatic large-title layout over a custom canvas.
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.visible, for: .navigationBar)
            .toolbarBackground(Color(uiColor: LingroveTheme.background), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
    }
}


enum AppAppearance: String, CaseIterable, Identifiable {
    static let preferenceKey = "app.appearance"
    case system, light, dark
    var id: String { rawValue }
    var title: String {
        switch self { case .system: return "跟随系统"; case .light: return "浅色"; case .dark: return "深色" }
    }
    var colorScheme: ColorScheme? {
        switch self { case .system: return nil; case .light: return .light; case .dark: return .dark }
    }
}

@main struct LingroveApp: App {
    @StateObject private var store = ModuleStore()
    @AppStorage(AppLanguage.preferenceKey) private var language = "system"
    @AppStorage(AppAppearance.preferenceKey) private var appearance = AppAppearance.system.rawValue
    var body: some Scene {
        WindowGroup {
            HomeView(store: store)
                .environment(\.locale, Locale(identifier: AppLanguage.resolve(language == "system" ? (Locale.preferredLanguages.first ?? "en") : language)))
                .preferredColorScheme((AppAppearance(rawValue: appearance) ?? .system).colorScheme)
        }
    }
}
struct HomeView: View {
    @Environment(\.scenePhase) private var scenePhase
    @ObservedObject var store: ModuleStore
    @StateObject private var pages = ModulePageCache()
    @State private var didCheck = false
    @State private var showingSettings = false
    @State private var showingLLMSettings = false
    @State private var showingTTSSettings = false
    @State private var showingLLMUsage = false
    @State private var modelError = ""
    #if DEBUG
    @State private var debugServers = DebugServerSettings.load()
    @State private var debugSettingsExpanded = false
    @State private var testingAddressID: String?
    @State private var connectionMessages: [String: String] = [:]
    @State private var failedAddresses: Set<String> = []
    @State private var connectionTest: Task<Void, Never>?
    @State private var connectionTestID = UUID()
    @AppStorage(HostConfiguration.resourceModePreferenceKey) private var resourceMode = ChildAppResourceMode.bundled
    private var debugEnabled: Bool { resourceMode == .debug }
    @State private var initialResourceMode = ChildAppResourceMode.bundled
    @State private var initialDebugAddress: String?
    #endif
    @State private var draftAppLanguage = "system"
    @State private var draftAppearance = AppAppearance.system
    @State private var draftModules: [Module] = []
    @State private var moduleEditMode: EditMode = .inactive
    @State private var networkSummaryRevision = 0
    #if DEBUG
    @State private var refreshingModules = false
    @State private var refreshSucceeded = false
    @State private var refreshFailed = false
    @State private var waitingForReloadResults = false
    @State private var updateCheckSucceeded = true
    #endif
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    ForEach(store.modules) { module in
                        NavigationLink { ModuleScreen(module: module, store: store, pages: pages) } label: {
                            HStack(spacing: 16) {
                                Group {
                                    if let icon = UIImage(contentsOfFile: store.directory(for: module).appendingPathComponent("logo.png").path) {
                                        Image(uiImage: icon).resizable().scaledToFill()
                                    } else {
                                        Text(String(module.name.prefix(1)))
                                            .font(.system(size: 27, weight: .medium, design: .serif))
                                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                                            .background(Color(uiColor: LingroveTheme.accent).opacity(0.12))
                                            .foregroundStyle(Color(uiColor: LingroveTheme.accent))
                                    }
                                }
                                .frame(width: 50, height: 50)
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                                .accessibilityHidden(true)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(module.name).font(.headline)
                                    Text(moduleSummary(module))
                                        .font(.subheadline).foregroundStyle(.secondary)
                                        .lineLimit(1)
                                    if store.blocked.contains(module.id) {
                                        Label("暂时无法打开", systemImage: "exclamationmark.circle")
                                            .font(.caption).foregroundStyle(.secondary)
                                    }
                                }
                                Spacer(minLength: 0)
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 14)
                            .frame(maxWidth: .infinity, minHeight: 86, alignment: .leading)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(ModuleListButtonStyle())
                        .disabled(store.blocked.contains(module.id))
                        if module.id != store.modules.last?.id {
                            Divider().padding(.horizontal, 16).accessibilityHidden(true)
                        }
                    }
                }
                .background(Color(uiColor: LingroveTheme.surface))
                .clipShape(RoundedRectangle(cornerRadius: 22))
                .padding(.horizontal, 20)
                .padding(.top, 20)
                .padding(.bottom, 24)
            }
            .background(Color(uiColor: LingroveTheme.background))
            .navigationTitle("Lingrove")
            .toolbar(.hidden, for: .navigationBar)
            .safeAreaInset(edge: .top, spacing: 0) {
                HStack(spacing: 8) {
                    Image("Logo")
                        .resizable().scaledToFit()
                        .frame(width: 32, height: 32)
                        .foregroundStyle(Color(uiColor: LingroveTheme.accent))
                        .accessibilityHidden(true)
                    Text("Lingrove").font(.title2.weight(.semibold)).accessibilityAddTraits(.isHeader)
                    Spacer(minLength: 8)
                    #if DEBUG
                    if debugEnabled {
                        Button(action: refreshModules) {
                            Group {
                                if refreshingModules { ProgressView() }
                                else if refreshSucceeded { Image(systemName: "checkmark") }
                                else if refreshFailed { Image(systemName: "exclamationmark.circle.fill") }
                                else { Image(systemName: "arrow.clockwise") }
                            }
                            .frame(width: 44, height: 44)
                            .background(Color(uiColor: LingroveTheme.surface), in: Circle())
                        }
                        .foregroundStyle(Color(uiColor: refreshFailed ? .systemRed : (refreshSucceeded ? .systemGreen : LingroveTheme.accent)))
                        .accessibilityIdentifier(refreshFailed ? "module-refresh-failure" : (refreshSucceeded ? "module-refresh-success" : "module-refresh"))
                        .accessibilityValue(refreshFailed ? Text("刷新失败") : (refreshSucceeded ? Text("刷新成功") : Text("")))
                        .accessibilityLabel("重新加载子应用").disabled(refreshingModules)
                    }
                    #endif
                    Button { resetSettingsDraft(); showingSettings = true } label: {
                        Image(systemName: "gearshape")
                            .frame(width: 44, height: 44)
                            .background(Color(uiColor: LingroveTheme.surface), in: Circle())
                    }
                    .foregroundStyle(Color(uiColor: LingroveTheme.accent))
                    .accessibilityLabel("应用设置")
                }
                .buttonStyle(.plain)
                .font(.system(size: 19, weight: .medium))
                .padding(.horizontal, 20)
                .padding(.vertical, 4)
                .background(Color(uiColor: LingroveTheme.background))
            }
            .safeAreaInset(edge: .bottom) {
                HostPlaybackControls()
            }
            .sheet(isPresented: $showingSettings, onDismiss: finishSettings) {
                NavigationStack {
                    Form {
                        #if DEBUG
                        Group {
                            Section("开发模式") {
                                HStack(spacing: 12) {
                                    Button {
                                        withAnimation { debugSettingsExpanded.toggle() }
                                    } label: {
                                        HStack(spacing: 10) {
                                            Image(systemName: debugSettingsExpanded ? "chevron.down" : "chevron.right")
                                                .font(.footnote.weight(.semibold))
                                                .frame(width: 16)
                                                .accessibilityHidden(true)
                                            Text("调试模式")
                                        }
                                        .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                                        .contentShape(Rectangle())
                                    }
                                    .buttonStyle(.plain)
                                    .accessibilityValue(debugSettingsExpanded ? Text("已展开") : Text("已折叠"))
                                    .accessibilityIdentifier("debug-settings-disclosure")
                                    if testingAddressID != nil { ProgressView().accessibilityLabel("正在测试…") }
                                    Toggle("开启调试模式", isOn: Binding(get: { debugEnabled }, set: setDebugEnabled))
                                        .labelsHidden()
                                        .disabled(debugServers.activeID == nil || testingAddressID != nil)
                                        .accessibilityIdentifier("debug-mode-toggle")
                                }
                                if debugSettingsExpanded {
                                    ForEach(debugServers.addresses) { server in
                                        DebugAddressRow(
                                            serverID: server.id,
                                            address: Binding(
                                                get: { debugServers.addresses.first { $0.id == server.id }?.url ?? "" },
                                                set: { updateDebugAddress(server.id, url: $0) }
                                            ),
                                            selected: debugServers.activeID == server.id,
                                            testing: testingAddressID == server.id,
                                            message: connectionMessages[server.id],
                                            failed: failedAddresses.contains(server.id),
                                            onSelect: { selectDebugAddress(server.id) },
                                            onDelete: { removeDebugAddress(server.id) }
                                        )
                                    }
                                    Button("添加调试地址", systemImage: "plus") {
                                        debugServers.addresses.append(DebugServerAddress())
                                    }
                                    .accessibilityIdentifier("debug-add-address")
                                    Text("选择地址后开启调试模式，连接成功才会启用。关闭设置时保存非空地址。")
                                        .font(.footnote).foregroundStyle(.secondary)
                                }
                                if !store.notice.isEmpty {
                                    Text(store.notice).font(.footnote).foregroundStyle(.secondary)
                                }
                            }
                            .hostSettingsRowBackground()
                            HostAppUpdateSection()
                        }
                        Section {
                            ForEach(store.modules) { module in
                                NavigationLink {
                                    ModuleDeveloperDetailsView(store: store, pages: pages, moduleID: module.id)
                                        .environment(\.editMode, .constant(.inactive))
                                } label: {
                                    HStack(spacing: 12) {
                                        Text(module.name)
                                        Spacer(minLength: 8)
                                        if !debugEnabled {
                                            ModuleListDownloadStatusView(record: store.downloadRecords[module.id], progress: store.downloadProgress[module.id])
                                                .accessibilityIdentifier("module-download-status-\(module.id)")
                                        } else {
                                            ModuleListReloadStatusView(record: pages.reloadRecords[module.id])
                                                .accessibilityIdentifier("module-refresh-status-\(module.id)")
                                        }
                                    }
                                }
                                .alignmentGuide(.listRowSeparatorLeading) { _ in 0 }
                                .accessibilityIdentifier("module-developer-details-\(module.id)")
                            }
                        }
                        .hostSettingsRowBackground()
                        GitHubBuildStatusSection(isPresented: showingSettings)
                        #endif
                        Section("外观") {
                            Picker("主题", selection: $draftAppearance) {
                                ForEach(AppAppearance.allCases) { appearance in
                                    Text(LocalizedStringKey(appearance.title)).tag(appearance)
                                }
                            }.accessibilityIdentifier("appearance-picker")
                            .onChange(of: draftAppearance) { _, value in
                                if showingSettings { UserDefaults.standard.set(value.rawValue, forKey: AppAppearance.preferenceKey) }
                            }
                        }
                        .hostSettingsRowBackground()
                        Section("App 语言") {
                            Picker("App 语言", selection: $draftAppLanguage) {
                                Text("跟随系统").tag("system")
                                Text(verbatim: "简体中文").tag("zh-Hans")
                                Text("English").tag("en")
                                Text("日本語").tag("ja")
                            }
                            .onChange(of: draftAppLanguage) { _, value in
                                guard showingSettings else { return }
                                UserDefaults.standard.set(value, forKey: AppLanguage.preferenceKey)
                                pages.updateLanguage()
                            }
                        }
                        .hostSettingsRowBackground()
                        Section("模型服务") {
                            Button { showingLLMSettings = true } label: {
                                HStack {
                                    Text("通用模型")
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
                                }.contentShape(Rectangle())
                            }.buttonStyle(.plain)
                            Button { showingTTSSettings = true } label: {
                                HStack {
                                    Text("语音合成")
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
                                }.contentShape(Rectangle())
                            }.buttonStyle(.plain).accessibilityIdentifier("tts-settings-entry")
                            Button { showingLLMUsage = true } label: {
                                HStack {
                                    Text("模型使用统计")
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
                                }.contentShape(Rectangle())
                            }.buttonStyle(.plain)
                        }
                        .hostSettingsRowBackground()
                        ModuleManagementSection(store: store, modules: $draftModules, editMode: $moduleEditMode)
                        NetworkAuthorizationSection(modules: store.modules).id(networkSummaryRevision)
                        Section("关于") { Text("Lingrove \(HostConfiguration.currentVersion)") }
                            .hostSettingsRowBackground()
                    }
                    .hostSettingsBackground()
                    .environment(\.editMode, $moduleEditMode)
                    .navigationDestination(isPresented: $showingLLMSettings) {
                        LLMSettingsView()
                            .environment(\.editMode, .constant(.inactive))
                            .onDisappear { networkSummaryRevision += 1 }
                    }
                    .navigationDestination(isPresented: $showingTTSSettings) {
                        TTSSettingsView().environment(\.editMode, .constant(.inactive))
                    }
                    .navigationDestination(isPresented: $showingLLMUsage) {
                        LLMUsageView().environment(\.editMode, .constant(.inactive))
                    }
                    .navigationTitle("设置").toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            Button { showingSettings = false } label: {
                                Image(systemName: "chevron.left")
                            }.accessibilityLabel("返回").accessibilityIdentifier("settings-back")
                        }
                    }
                }
                .presentationBackground(Color(uiColor: LingroveTheme.background))
            }
            .task { guard !didCheck else { return }; didCheck = true; do { _ = try LLMStore.load() } catch { modelError = error.localizedDescription }; await store.checkForUpdates() }
            .alert("通用模型设置读取失败", isPresented: Binding(get: { !modelError.isEmpty }, set: { if !$0 { modelError = "" } })) { Button("好") { modelError = "" } } message: { Text(AppLanguage.text(modelError)) }
        }.tint(Color(uiColor: LingroveTheme.accent))
        .onChange(of: store.modules) { _, modules in pages.reconcile(modules: modules, blocked: store.blocked) }
        .onChange(of: scenePhase) { _, phase in
            guard phase == .active, didCheck else { return }
            Task { await store.checkForUpdates() }
        }
        .onChange(of: store.blocked) { _, blocked in pages.reconcile(modules: store.modules, blocked: blocked) }
        #if DEBUG
        .onChange(of: pages.reloadStates) { _, _ in finishRefreshIfNeeded() }
        .task(id: refreshSucceeded || refreshFailed) {
            guard refreshSucceeded || refreshFailed else { return }
            do { try await Task.sleep(for: .seconds(5)) } catch { return }
            refreshSucceeded = false
            refreshFailed = false
        }
        #endif
    }
    private func moduleSummary(_ module: Module) -> String {
        let description = module.description(for: AppLanguage.current) ?? AppLanguage.text("学习应用")
        var summary = description
        description.enumerateSubstrings(in: description.startIndex..<description.endIndex, options: .bySentences) { sentence, _, _, stop in
            if let sentence { summary = sentence.trimmingCharacters(in: .whitespacesAndNewlines) }
            stop = true
        }
        return summary.trimmingCharacters(in: CharacterSet(charactersIn: "。.").union(.whitespacesAndNewlines))
    }
    #if DEBUG
    private func clearConnectionTest() {
        connectionTest?.cancel()
        connectionTest = nil
        connectionTestID = UUID()
        testingAddressID = nil
    }
    private func refreshModules() {
        guard !refreshingModules else { return }
        refreshSucceeded = false
        refreshFailed = false
        refreshingModules = true
        waitingForReloadResults = false
        Task { @MainActor in
            // Finish fetching the selected channel's catalog before choosing and
            // reloading application resources, including the local fallback.
            updateCheckSucceeded = await store.checkForUpdates(forceRefresh: true)
            waitingForReloadResults = true
            pages.reloadAll(store: store)
            finishRefreshIfNeeded()
        }
    }
    private func finishRefreshIfNeeded() {
        guard waitingForReloadResults, !pages.reloadStates.values.contains(.loading) else { return }
        waitingForReloadResults = false
        refreshingModules = false
        refreshSucceeded = updateCheckSucceeded && !pages.reloadStates.isEmpty && pages.reloadStates.values.allSatisfy { $0 == .succeeded }
        refreshFailed = !refreshSucceeded
    }
    private func setResourceMode(_ mode: ChildAppResourceMode) {
        resourceMode = mode
        store.resourceModeChanged()
        draftModules = store.modules
    }
    private func setDebugEnabled(_ enabled: Bool) {
        guard showingSettings else { return }
        clearConnectionTest()
        connectionMessages.removeAll()
        failedAddresses.removeAll()
        guard enabled else {
            setResourceMode(.bundled)
            return
        }
        guard let addressID = debugServers.activeID,
              let server = debugServers.addresses.first(where: { $0.id == addressID }) else { return }
        testingAddressID = addressID
        let testID = connectionTestID
        connectionTest = Task { @MainActor in
            do {
                let message = try await DebugServer.testConnection(server.url)
                guard !Task.isCancelled, connectionTestID == testID, showingSettings else { return }
                // Publish the verified address before enabling server resource loading.
                debugServers.save()
                setResourceMode(.debug)
                connectionMessages[addressID] = message
            } catch {
                guard !Task.isCancelled, connectionTestID == testID, showingSettings else { return }
                debugSettingsExpanded = true
                failedAddresses.insert(addressID)
                connectionMessages[addressID] = "连接失败：\(error.localizedDescription)"
            }
            connectionTest = nil
            testingAddressID = nil
        }
    }
    private func selectDebugAddress(_ id: String) {
        guard debugServers.activeID != id else { return }
        clearConnectionTest()
        if debugEnabled { setResourceMode(.bundled) }
        debugServers.activeID = id
        connectionMessages.removeAll()
        failedAddresses.removeAll()
    }
    private func updateDebugAddress(_ id: String, url: String) {
        if testingAddressID == id { clearConnectionTest() }
        if debugServers.activeID == id && debugEnabled { setResourceMode(.bundled) }
        connectionMessages[id] = nil
        failedAddresses.remove(id)
        debugServers.updateAddress(id: id, url: url)
    }
    private func removeDebugAddress(_ id: String) {
        if testingAddressID == id { clearConnectionTest() }
        if debugServers.activeID == id && debugEnabled { setResourceMode(.bundled) }
        debugServers.removeAddress(id: id)
        connectionMessages[id] = nil
        failedAddresses.remove(id)
    }
    #endif
    private func resetSettingsDraft() {
        #if DEBUG
        clearConnectionTest()
        debugServers = DebugServerSettings.load()
        debugSettingsExpanded = false
        initialDebugAddress = DebugServer.activeAddress
        connectionMessages.removeAll()
        failedAddresses.removeAll()
        initialResourceMode = resourceMode
        #endif
        draftAppLanguage = UserDefaults.standard.string(forKey: AppLanguage.preferenceKey) ?? "system"
        draftAppearance = AppAppearance(rawValue: UserDefaults.standard.string(forKey: AppAppearance.preferenceKey) ?? "") ?? .system
        moduleEditMode = .inactive
        draftModules = store.modules
    }
    private func finishSettings() {
        #if DEBUG
        clearConnectionTest()
        if DebugServer.available { debugServers.save() }
        guard DebugServer.available,
              initialResourceMode != resourceMode || initialDebugAddress != DebugServer.activeAddress else { return }
        let expectedMode = resourceMode
        let expectedAddress = DebugServer.activeAddress
        Task { @MainActor in
            await store.checkForUpdates()
            guard resourceMode == expectedMode, DebugServer.activeAddress == expectedAddress else { return }
            pages.reloadAll(store: store)
        }
        #endif
    }


}

private struct ModuleListButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(Color(uiColor: LingroveTheme.accent).opacity(configuration.isPressed ? 0.08 : 0))
    }
}

struct HostAppRelease: Decodable {
    let version: String
    let build: String
    let configuration: String
    let builtAt: Date
    let manifestURL: URL

    func isNewer(than currentVersion: String, build currentBuild: String) -> Bool {
        guard let remote = Version(version), let current = Version(currentVersion) else { return false }
        if remote != current { return remote > current }
        func parts(_ value: String) -> [Int]? {
            let components = value.split(separator: ".", omittingEmptySubsequences: false)
            guard !components.isEmpty, components.allSatisfy({ !$0.isEmpty && $0.utf8.allSatisfy { (48...57).contains($0) } }) else { return nil }
            let numbers = components.compactMap { Int($0) }
            return numbers.count == components.count ? numbers : nil
        }
        guard var remoteBuild = parts(build), var localBuild = parts(currentBuild) else { return false }
        let count = max(remoteBuild.count, localBuild.count)
        remoteBuild += Array(repeating: 0, count: count - remoteBuild.count)
        localBuild += Array(repeating: 0, count: count - localBuild.count)
        return localBuild.lexicographicallyPrecedes(remoteBuild)
    }

    var installURL: URL? {
        guard manifestURL.scheme == "https", manifestURL.host == "lingrove.stackli.me",
              manifestURL.user == nil, manifestURL.password == nil,
              manifestURL.port == nil, manifestURL.query == nil, manifestURL.fragment == nil,
              manifestURL.path.hasPrefix("/ios/manifest-"), manifestURL.path.hasSuffix(".plist") else { return nil }
        var components = URLComponents()
        components.scheme = "itms-services"
        components.host = ""
        components.queryItems = [URLQueryItem(name: "action", value: "download-manifest"),
                                 URLQueryItem(name: "url", value: manifestURL.absoluteString)]
        return components.url
    }
}

struct ModuleManagementSection: View {
    @ObservedObject var store: ModuleStore
    @Binding var modules: [Module]
    @Binding var editMode: EditMode
    private var uninstalledIDs: [String] {
        Set(store.statuses.keys).subtracting(store.modules.map(\.id)).sorted()
    }
    var body: some View {
        Section {
            ForEach(modules) { module in
                if editMode.isEditing {
                    moduleRow(id: module.id, module: module)
                } else {
                    NavigationLink {
                        ModuleDetailsView(store: store, moduleID: module.id)
                            .environment(\.editMode, .constant(.inactive))
                    } label: {
                        moduleRow(id: module.id, module: module)
                    }.accessibilityIdentifier("module-details-\(module.id)")
                }
            }
            .onMove { source, destination in
                modules.move(fromOffsets: source, toOffset: destination)
                store.setDisplayOrder(modules.map(\.id))
            }
            .moveDisabled(!editMode.isEditing)
            ForEach(uninstalledIDs, id: \.self) { id in
                moduleRow(id: id, module: nil)
            }
            if modules.isEmpty { Text("暂无已安装的应用").foregroundStyle(.secondary) }
            if !store.notice.isEmpty {
                Text(AppLanguage.text(store.notice)).font(.footnote)
                    .accessibilityIdentifier("module-update-notice")
            }
        } header: {
            HStack {
                Text("应用")
                Spacer()
                Button {
                    withAnimation { editMode = editMode.isEditing ? .inactive : .active }
                } label: {
                    Text(LocalizedStringKey(editMode.isEditing ? "完成" : "编辑"))
                        .font(.body).textCase(nil)
                        .frame(minWidth: 44, minHeight: 44)
                }
                .disabled(modules.isEmpty)
                .accessibilityIdentifier("module-edit-button")
            }
        } footer: {
            if editMode.isEditing {
                Text("拖动排序，自动保存。")
            }
        }
        .hostSettingsRowBackground()
        .onAppear { refreshModules() }
        .onChange(of: store.modules) { _, _ in refreshModules() }
    }
    private func moduleRow(id: String, module: Module?) -> some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text(module?.name ?? id)
                if let status = store.statuses[id] {
                    Text(status).font(.footnote).foregroundStyle(.secondary)
                } else if store.blocked.contains(id) {
                    Text("当前版本已停用，请检查更新。").font(.footnote).foregroundStyle(.secondary)
                }
                if let progress = store.downloadProgress[id] {
                    HStack(spacing: 8) {
                        ProgressView(value: progress)
                        Text("\(Int(progress * 100))%")
                            .monospacedDigit()
                    }
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                }
            }
            Spacer(minLength: 8)
            if module == nil {
                Text("未安装")
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: true, vertical: false)
            }

        }
    }
    private func refreshModules() {
        let current = Dictionary(uniqueKeysWithValues: store.modules.map { ($0.id, $0) })
        let draftIDs = Set(modules.map(\.id))
        modules = modules.compactMap { current[$0.id] }
            + store.modules.filter { !draftIDs.contains($0.id) }
    }
}

struct ModuleDetailsView: View {
    @ObservedObject var store: ModuleStore
    let moduleID: String
    private var module: Module? { store.modules.first { $0.id == moduleID } }

    var body: some View {
        Form {
            if let module {
                Section {
                    ModuleInformationRow(title: "更新日期", value: updateDate(for: module))
                    ModuleInformationRow(title: "应用介绍", value: module.description(for: AppLanguage.current) ?? AppLanguage.text("学习应用"))
                }
                .hostSettingsRowBackground()
            } else {
                Text("暂无已安装的应用").foregroundStyle(.secondary)
                    .hostSettingsRowBackground()
            }
        }
        .hostSettingsBackground()
        .navigationTitle(module?.name ?? moduleID)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func updateDate(for module: Module) -> String {
        let locale = Locale(identifier: AppLanguage.current)
        if let installedAt = store.lastUpdatedAt(for: module) {
            return installedAt.formatted(Date.FormatStyle(date: .abbreviated, time: .shortened).locale(locale))
        }
        let parser = DateFormatter()
        parser.locale = Locale(identifier: "en_US_POSIX")
        parser.calendar = Calendar(identifier: .gregorian)
        parser.timeZone = TimeZone(identifier: "Asia/Shanghai")
        parser.dateFormat = "yyyyMMdd"
        guard let date = parser.date(from: module.version) else { return AppLanguage.text("暂无记录") }
        var format = Date.FormatStyle(date: .abbreviated, time: .omitted).locale(locale)
        format.timeZone = TimeZone(identifier: "Asia/Shanghai")!
        return date.formatted(format)
    }

}



struct ModuleInformationRow: View {
    let title: LocalizedStringKey
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.subheadline).foregroundStyle(.secondary)
            Text(verbatim: value).textSelection(.enabled)
                .frame(maxWidth: .infinity, alignment: .leading)
                .fixedSize(horizontal: false, vertical: true)
        }.padding(.vertical, 2)
    }
}

struct NetworkAuthorizationSection: View {
    let modules: [Module]
    @State private var domains: [NetworkAccessDomain] = []
    @State private var modelConfigurationError = ""
    @State private var hasCustomOrigins = false

    var body: some View {
        Section {

            if domains.contains(where: { $0.moduleID == nil }) {
                domainGroup("公共", icon: "globe", moduleID: nil)
            }
            ForEach(modules) { module in
                if domains.contains(where: { $0.moduleID == module.id }) {
                    domainGroup(module.name, icon: "square.grid.2x2", moduleID: module.id)
                }
            }
            if domains.isEmpty { Text("暂无已配置的网络域名").foregroundStyle(.secondary) }
            if !modelConfigurationError.isEmpty {
                Text(modelConfigurationError).font(.footnote).foregroundStyle(.red)
            }
            Button("撤销自定义域名授权", role: .destructive) {
                for module in modules { UserDefaults.standard.removeObject(forKey: "origins.\(module.id)") }
                refresh()
            }.disabled(!hasCustomOrigins)
        } header: {
            Text("网络授权")
        } footer: {
            Text("撤销后，再次连接需重新授权。")
        }
        .hostSettingsRowBackground()
        .onAppear(perform: refresh)
        .onChange(of: modules) { _, _ in refresh() }
        .onReceive(NotificationCenter.default.publisher(for: UserDefaults.didChangeNotification)) { _ in refresh() }
    }

    private func domainGroup(_ title: String, icon: String, moduleID: String?) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Label(title, systemImage: icon)
                .font(.headline)
                .foregroundStyle(Color(uiColor: LingroveTheme.accent))
                .accessibilityAddTraits(.isHeader)
            VStack(alignment: .leading, spacing: 12) {
                ForEach(domains.filter { $0.moduleID == moduleID }) { domain in
                    VStack(alignment: .leading, spacing: 5) {
                        Text(domain.origin).font(.subheadline).textSelection(.enabled)
                        Text(domain.sources.joined(separator: " · ")).font(.caption).foregroundStyle(.secondary)
                    }.accessibilityElement(children: .combine)
                }
            }
            .padding(.leading, 28)
        }
        .padding(.vertical, 6)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func refresh() {
        let defaults = UserDefaults.standard
        var modelURL: String?
        modelConfigurationError = ""
        do {
            let configuration = try LLMStore.load()
            if !configuration.baseURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                modelURL = try configuration.endpoint().absoluteString
            }
        } catch { modelConfigurationError = "模型服务域名读取失败：\(error.localizedDescription)" }
        let custom = Dictionary(uniqueKeysWithValues: modules.map {
            ($0.id, defaults.stringArray(forKey: "origins.\($0.id)") ?? [])
        })
        hasCustomOrigins = custom.values.contains { !$0.isEmpty }
        #if DEBUG
        let debugURL = DebugServer.activeAddress
        #else
        let debugURL: String? = nil
        #endif
        domains = NetworkAccessDomain.snapshot(
            modules: modules, customOrigins: custom, catalogURL: HostConfiguration.bundled.updateCatalogURL(),
            modelURL: modelURL,
            debugURL: debugURL
        )
    }
}
