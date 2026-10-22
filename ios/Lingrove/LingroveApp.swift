import SwiftUI

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
        ? UIColor(red: 179/255, green: 211/255, blue: 164/255, alpha: 1)
        : UIColor(red: 0.20, green: 0.32, blue: 0.25, alpha: 1) }
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
    @ObservedObject var store: ModuleStore
    @StateObject private var pages = ModulePageCache()
    @State private var didCheck = false
    @State private var showingSettings = false
    @State private var showingLLMSettings = false
    @State private var showingTTSSettings = false
    @State private var showingLLMUsage = false
    @State private var modelError = ""
    @State private var debugServers = DebugServerSettings.load()
    @State private var debugSettingsExpanded = false
    @State private var testingAddressID: String?
    @State private var connectionMessages: [String: String] = [:]
    @State private var failedAddresses: Set<String> = []
    @State private var connectionTest: Task<Void, Never>?
    @State private var connectionTestID = UUID()
    @AppStorage(HostConfiguration.resourceModePreferenceKey) private var resourceMode = ChildAppResourceMode.bundled
    private var debugEnabled: Bool { resourceMode == .debug }
    private var snapshotEnabled: Bool { resourceMode == .snapshot }
    @State private var initialResourceMode = ChildAppResourceMode.bundled
    @State private var initialDebugAddress: String?
    @State private var draftAppLanguage = "system"
    @State private var draftAppearance = AppAppearance.system
    @State private var draftModules: [Module] = []
    @State private var moduleEditMode: EditMode = .inactive
    @State private var networkSummaryRevision = 0
    @State private var refreshingModules = false
    @State private var refreshSucceeded = false
    @State private var waitingForReloadResults = false
    @State private var updateCheckSucceeded = true
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
                    Text("Lingrove").font(.title2.weight(.semibold)).accessibilityAddTraits(.isHeader)
                    Spacer(minLength: 8)
                    if DebugServer.available && (debugEnabled || snapshotEnabled) {
                        Button(action: refreshModules) {
                            Group {
                                if refreshingModules { ProgressView() }
                                else if refreshSucceeded { Image(systemName: "checkmark") }
                                else { Image(systemName: "arrow.clockwise") }
                            }
                            .frame(width: 44, height: 44)
                            .background(Color(uiColor: LingroveTheme.surface), in: Circle())
                        }
                        .foregroundStyle(Color(uiColor: refreshSucceeded ? .systemGreen : LingroveTheme.accent))
                        .accessibilityIdentifier(refreshSucceeded ? "module-refresh-success" : "module-refresh")
                        .accessibilityLabel("重新加载子应用").disabled(refreshingModules)
                    }
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
                        if DebugServer.available {
                            Section("开发模式") {
                                Toggle("快照模式", isOn: Binding(get: { snapshotEnabled }, set: setSnapshotEnabled))
                                    .accessibilityIdentifier("snapshot-toggle")
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
                                if snapshotEnabled && !store.notice.isEmpty {
                                    Text(store.notice).font(.footnote).foregroundStyle(.secondary)
                                }
                            }
                            HostAppUpdateSection()
                        }
                        #if DEBUG
                        Section {
                            ForEach(store.modules) { module in
                                NavigationLink {
                                    ModuleDeveloperDetailsView(store: store, pages: pages, moduleID: module.id)
                                        .environment(\.editMode, .constant(.inactive))
                                } label: {
                                    HStack(spacing: 12) {
                                        Text(module.name)
                                        Spacer(minLength: 8)
                                        if snapshotEnabled {
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
                        ModuleManagementSection(store: store, modules: $draftModules, editMode: $moduleEditMode)
                        NetworkAuthorizationSection(modules: store.modules).id(networkSummaryRevision)
                        Section("关于") { Text("Lingrove \(HostConfiguration.currentVersion)") }
                    }
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
            }
            .task { guard !didCheck else { return }; didCheck = true; do { _ = try LLMStore.load() } catch { modelError = error.localizedDescription }; await store.checkForUpdates() }
            .alert("通用模型设置读取失败", isPresented: Binding(get: { !modelError.isEmpty }, set: { if !$0 { modelError = "" } })) { Button("好") { modelError = "" } } message: { Text(AppLanguage.text(modelError)) }
        }.tint(Color(uiColor: LingroveTheme.accent))
        .onChange(of: store.modules) { _, modules in pages.reconcile(modules: modules, blocked: store.blocked) }
        .onChange(of: store.blocked) { _, blocked in pages.reconcile(modules: store.modules, blocked: blocked) }
        .onChange(of: pages.reloadStates) { _, _ in finishRefreshIfNeeded() }
        .task(id: refreshSucceeded) {
            guard refreshSucceeded else { return }
            do { try await Task.sleep(for: .seconds(3)) } catch { return }
            refreshSucceeded = false
        }
    }
    private func moduleSummary(_ module: Module) -> String {
        let description = module.description(for: AppLanguage.current) ?? AppLanguage.text("学习应用")
        var summary = description
        description.enumerateSubstrings(in: description.startIndex..<description.endIndex, options: .bySentences) { sentence, _, _, stop in
            if let sentence { summary = sentence.trimmingCharacters(in: .whitespacesAndNewlines) }
            stop = true
        }
        return summary
    }
    private func clearConnectionTest() {
        connectionTest?.cancel()
        connectionTest = nil
        connectionTestID = UUID()
        testingAddressID = nil
    }
    private func refreshModules() {
        guard !refreshingModules else { return }
        refreshSucceeded = false
        refreshingModules = true
        waitingForReloadResults = false
        Task { @MainActor in
            updateCheckSucceeded = true
            if snapshotEnabled { updateCheckSucceeded = await store.checkForUpdates(forceSnapshot: true) }
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
    }
    private func setResourceMode(_ mode: ChildAppResourceMode) {
        resourceMode = mode
        store.resourceModeChanged()
        draftModules = store.modules
    }
    private func setSnapshotEnabled(_ enabled: Bool) {
        guard showingSettings else { return }
        clearConnectionTest()
        setResourceMode(enabled ? .snapshot : .bundled)
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
        let modules = store.modules
        connectionTest = Task { @MainActor in
            do {
                let message = try await DebugServer.testConnection(server.url, modules: modules)
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
    private func resetSettingsDraft() {
        clearConnectionTest()
        debugServers = DebugServerSettings.load()
        debugSettingsExpanded = false
        initialDebugAddress = DebugServer.activeAddress
        connectionMessages.removeAll()
        failedAddresses.removeAll()
        initialResourceMode = resourceMode
        draftAppLanguage = UserDefaults.standard.string(forKey: AppLanguage.preferenceKey) ?? "system"
        draftAppearance = AppAppearance(rawValue: UserDefaults.standard.string(forKey: AppAppearance.preferenceKey) ?? "") ?? .system
        moduleEditMode = .inactive
        draftModules = store.modules
    }
    private func finishSettings() {
        clearConnectionTest()
        if DebugServer.available { debugServers.save() }
        guard DebugServer.available,
              initialResourceMode != resourceMode || initialDebugAddress != DebugServer.activeAddress else { return }
        pages.reloadAll(store: store)
        if snapshotEnabled {
            Task { @MainActor in
                await store.checkForUpdates()
                guard snapshotEnabled else { return }
                pages.reloadAll(store: store)
            }
        }
    }


}

private struct ModuleListButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(Color(uiColor: LingroveTheme.accent).opacity(configuration.isPressed ? 0.08 : 0))
    }
}

private struct DebugAddressRow: View {
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

private struct HostAppRelease: Decodable {
    let version: String
    let build: String
    let configuration: String
    let builtAt: Date
    let manifestURL: URL

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

private struct HostAppUpdateSection: View {
    @State private var release: HostAppRelease?
    @State private var checking = false
    @State private var failed = false

    var body: some View {
        Section {
            Button {
                guard let url = release?.installURL else { return }
                UIApplication.shared.open(url, options: [:]) { opened in
                    Task { @MainActor in failed = !opened }
                }
            } label: {
                HStack {
                    Text("安装最新版")
                    Spacer()
                    if checking { ProgressView() }
                    else if let release {
                        Text(release.builtAt.formatted(date: .numeric, time: .shortened))
                            .font(.footnote).foregroundStyle(.secondary)
                            .multilineTextAlignment(.trailing)
                    }
                }
            }
            .disabled(checking || release == nil)
            .accessibilityIdentifier("host-app-install-update")
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
        .task { await checkForUpdate() }
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
            } else {
                Text("暂无已安装的应用").foregroundStyle(.secondary)
            }
        }
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

#if DEBUG
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
    let state: ModuleReloadState?

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

    private func installedSource(_ module: Module) -> String {
        store.isDownloaded(module) ? (module.isSnapshot ? "快照下载" : "Release 下载") : "宿主内置"
    }

    private func resourceSource(_ module: Module) -> ModuleResourceSource {
        switch pages.resourceSources[moduleID] {
        case nil, .failed:
            // Use the same target as the next load; no page has finished loading.
            return .loading(DebugServer.entryURL(for: module))
        case let source?: return source
        }
    }

    var body: some View {
        Form {
            if let module {
                if resourceMode == .snapshot {
                    Section {
                        HStack(spacing: 12) {
                            Text("下载状态")
                            Spacer(minLength: 8)
                            ModuleDownloadStatusView(state: store.downloadRecords[moduleID]?.state,
                                                     progress: store.downloadProgress[moduleID],
                                                     installed: module.isSnapshot && store.isDownloaded(module))
                        }
                        .fixedSize(horizontal: false, vertical: true)
                        .alignmentGuide(.listRowSeparatorLeading) { _ in 0 }
                        ModuleInformationRow(title: "最近下载时间", value: (module.isSnapshot ? store.lastUpdatedAt(for: module) : nil).map {
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
                    let title = source.isLoaded ? "实际来源" : "待加载来源"
                    let value = source.remoteURL == nil ? installedSource(module) : "调试服务器"
                    LabeledContent(AppLanguage.text(title), value: AppLanguage.text(value))
                        .accessibilityElement(children: .ignore)
                        .accessibilityLabel(Text(verbatim: AppLanguage.text(title)))
                        .accessibilityValue(Text(verbatim: AppLanguage.text(value)))
                        .accessibilityIdentifier("module-resource-source")
                    if let address = source.remoteURL {
                        ModuleInformationRow(title: source.isLoaded ? "当前资源地址" : "待加载地址", value: address.absoluteString)
                    }
                }
                Section("本机安装包") {
                    LabeledContent("安装来源", value: AppLanguage.text(installedSource(module)))
                    ModuleInformationRow(title: "版本", value: module.version)
                    ModuleInformationRow(title: "文件名", value: store.isDownloaded(module)
                        ? (module.downloadUrl.flatMap(URL.init(string:))?.lastPathComponent ?? module.entry)
                        : module.entry)
                    if store.isDownloaded(module), let address = module.downloadUrl {
                        ModuleInformationRow(title: "下载地址", value: address)
                    }
                }
            } else {
                Text("暂无已安装的应用").foregroundStyle(.secondary)
            }
        }
        .navigationTitle(module?.name ?? moduleID)
        .navigationBarTitleDisplayMode(.inline)
    }
}
#endif

private struct ModuleInformationRow: View {
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
        domains = NetworkAccessDomain.snapshot(
            modules: modules, customOrigins: custom, catalogURL: HostConfiguration.bundled.updateCatalogURL(),
            modelURL: modelURL,
            debugURL: DebugServer.activeAddress
        )
    }
}
