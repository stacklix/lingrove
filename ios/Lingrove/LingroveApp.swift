import SwiftUI

// Dynamic colors shared by the native shell and the embedded page background.
enum LingroveTheme {
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
    @State private var debugAddress = UserDefaults.standard.string(forKey: DebugServer.preferenceKey) ?? ""
    @State private var debugError = ""
    @State private var connectionMessage = ""
    @State private var connectionFailed = false
    @State private var connectionTest: Task<Void, Never>?
    @State private var connectionTestID = UUID()
    @AppStorage(DebugServer.enabledPreferenceKey) private var debugEnabled = true
    @State private var draftDebugEnabled = true
    @State private var initialDebugAddress = ""
    @State private var initialDebugEnabled = true
    @State private var draftAppLanguage = "system"
    @State private var draftAppearance = AppAppearance.system
    @State private var draftModules: [Module] = []
    @State private var networkSummaryRevision = 0
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 26) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("YOUR LANGUAGE POCKET").font(.caption2.weight(.semibold)).tracking(3).foregroundStyle(.secondary)
                        Text("一点好奇，\n每天一点进步。").font(.system(size: 34, weight: .semibold, design: .serif))
                        Text("从一句话开始，找到适合你的学习方式。").font(.subheadline).foregroundStyle(.secondary)
                    }.padding(.top, 20)
                    Text("我的学习工具").font(.headline)
                    ForEach(store.modules) { module in
                        NavigationLink { ModuleScreen(module: module, store: store, pages: pages) } label: {
                            VStack(alignment: .leading, spacing: 18) {
                                HStack(spacing: 15) {
                                    Group {
                                        if let icon = UIImage(contentsOfFile: store.directory(for: module).appendingPathComponent("logo.png").path) {
                                            Image(uiImage: icon).resizable().scaledToFill()
                                        } else {
                                            Text(String(module.name.prefix(1))).font(.system(size: 34, weight: .medium, design: .serif)).frame(maxWidth: .infinity, maxHeight: .infinity).background(Color(red: 0.20, green: 0.32, blue: 0.25)).foregroundStyle(.white)
                                        }
                                    }.frame(width: 60, height: 64).clipShape(RoundedRectangle(cornerRadius: 16))
                                    VStack(alignment: .leading, spacing: 4) { Text(module.name).font(.title2.weight(.semibold)); Text("语言学习 · v\(module.version)").font(.caption).foregroundStyle(.secondary) }
                                    Spacer(); Image(systemName: "arrow.up.right").foregroundStyle(.secondary)
                                }
                                Text(AppLanguage.text(module.description ?? "学习应用")).font(.subheadline).foregroundStyle(.secondary)
                                if store.blocked.contains(module.id) {
                                    Label("暂时无法打开", systemImage: "exclamationmark.circle").font(.caption).foregroundStyle(.secondary)
                                }
                            }.padding(22).background(Color(uiColor: LingroveTheme.surface)).clipShape(RoundedRectangle(cornerRadius: 22))
                        }.buttonStyle(.plain).disabled(store.blocked.contains(module.id))
                    }
                }.padding(24)
            }.background(Color(uiColor: LingroveTheme.background)).navigationTitle("Lingrove")
            .toolbar { if DebugServer.available && debugEnabled { Button { pages.reloadAll(store: store) } label: { Image(systemName: "arrow.clockwise") }.accessibilityLabel("重新加载子应用") }; Button { resetSettingsDraft(); showingSettings = true } label: { Image(systemName: "gearshape") }.accessibilityLabel("应用设置") }
            .safeAreaInset(edge: .bottom) {
                if DebugServer.available && debugEnabled, let message = pages.reloadMessage {
                    ReloadFeedbackView(message: message, autoDismiss: !pages.isReloading) { pages.reloadMessages.removeAll() }.padding()
                }
            }
            .sheet(isPresented: $showingSettings, onDismiss: finishSettings) {
                NavigationStack {
                    Form {
                        if DebugServer.available {
                            Section("调试模式") {
                                Toggle("调试模式", isOn: $draftDebugEnabled)
                                    .accessibilityIdentifier("debug-mode-toggle")
                                    .onChange(of: draftDebugEnabled) { _, value in
                                        if showingSettings { debugEnabled = value }
                                    }
                                Text("开启后显示刷新按钮并使用配置的服务器资源；关闭后使用本地资源，仍可编辑和保存服务器地址。").font(.footnote)
                                TextField("http://192.168.1.10:8000", text: $debugAddress)
                                    .textInputAutocapitalization(.never).autocorrectionDisabled().keyboardType(.URL)
                                    .accessibilityLabel("调试服务器地址")
                                    .onChange(of: debugAddress) { _, value in
                                        guard showingSettings else { return }
                                        clearConnectionTest()
                                        UserDefaults.standard.set(value, forKey: DebugServer.preferenceKey)
                                        do { _ = try DebugServer.normalized(value); debugError = "" }
                                        catch { debugError = error.localizedDescription }
                                    }
                                Button(action: testDebugConnection) {
                                    HStack {
                                        if connectionTest != nil { ProgressView() }
                                        Text(LocalizedStringKey(connectionTest == nil ? "测试连接" : "正在测试…"))
                                    }
                                }
                                .disabled(connectionTest != nil || debugAddress.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                                .accessibilityIdentifier("debug-test-connection")
                                if !connectionMessage.isEmpty {
                                    Text(connectionMessage)
                                        .font(.footnote)
                                        .foregroundStyle(connectionFailed ? Color.red : Color.secondary)
                                        .accessibilityIdentifier("debug-connection-result")
                                }
                                Text("填写服务器根地址，子应用从 /子应用ID/index.html 加载。留空使用内置资源。").font(.footnote)
                                if let message = pages.reloadMessage {
                                    ReloadFeedbackView(message: message, autoDismiss: !pages.isReloading) { pages.reloadMessages.removeAll() }
                                }
                                if !debugError.isEmpty { Text(debugError).foregroundStyle(.red).accessibilityIdentifier("debug-settings-error") }
                            }
                        }
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
                            Text("用于应用界面和新生成的讲解，已有学习记录保留原语言。").font(.footnote)
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
                                    Text("通用模型使用统计")
                                    Spacer()
                                    Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
                                }.contentShape(Rectangle())
                            }.buttonStyle(.plain)
                        }
                        ModuleManagementSection(store: store, modules: $draftModules)
                        NetworkAuthorizationSection(modules: store.modules).id(networkSummaryRevision)
                        Section("关于") { Text("Lingrove \(HostConfiguration.currentVersion)") }
                    }
                    .environment(\.editMode, .constant(.active))
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
    }
    private func clearConnectionTest() {
        connectionTest?.cancel()
        connectionTest = nil
        connectionTestID = UUID()
        connectionMessage = ""
        connectionFailed = false
    }
    private func testDebugConnection() {
        clearConnectionTest()
        let id = connectionTestID
        let address = debugAddress
        let modules = store.modules
        connectionTest = Task { @MainActor in
            do {
                let message = try await DebugServer.testConnection(address, modules: modules)
                guard !Task.isCancelled, connectionTestID == id else { return }
                connectionMessage = message
            } catch {
                guard !Task.isCancelled, connectionTestID == id else { return }
                connectionFailed = true
                connectionMessage = "连接失败：\(error.localizedDescription)"
            }
            connectionTest = nil
        }
    }
    private func resetSettingsDraft() {
        clearConnectionTest()
        debugAddress = UserDefaults.standard.string(forKey: DebugServer.preferenceKey) ?? ""
        initialDebugAddress = debugAddress
        initialDebugEnabled = debugEnabled
        draftDebugEnabled = debugEnabled
        draftAppLanguage = UserDefaults.standard.string(forKey: AppLanguage.preferenceKey) ?? "system"
        draftAppearance = AppAppearance(rawValue: UserDefaults.standard.string(forKey: AppAppearance.preferenceKey) ?? "") ?? .system
        draftModules = store.modules
        debugError = ""
    }
    private func finishSettings() {
        clearConnectionTest()
        if DebugServer.available,
           initialDebugAddress != debugAddress || initialDebugEnabled != debugEnabled {
            pages.reloadAll(store: store)
        }
    }


}

struct ModuleManagementSection: View {
    @ObservedObject var store: ModuleStore
    @Binding var modules: [Module]
    private var uninstalledIDs: [String] {
        Set(store.statuses.keys).subtracting(store.modules.map(\.id)).sorted()
    }
    var body: some View {
        Section {
            ForEach(modules) { module in
                moduleRow(id: module.id, module: module)
            }
            .onMove { source, destination in
                modules.move(fromOffsets: source, toOffset: destination)
                store.setDisplayOrder(modules.map(\.id))
            }
            ForEach(uninstalledIDs, id: \.self) { id in
                moduleRow(id: id, module: nil)
            }
            if modules.isEmpty { Text("暂无已安装的应用").foregroundStyle(.secondary) }
            Button {
                Task { await store.checkForUpdates() }
            } label: {
                HStack {
                    if store.checking { ProgressView() }
                    Text(LocalizedStringKey(store.checking ? "正在检查更新…" : "检查更新"))
                }
            }.disabled(store.checking)
            if !store.notice.isEmpty {
                Text(store.notice).font(.footnote)
                    .accessibilityIdentifier("module-update-notice")
            }
        } header: {
            Text("应用")
        } footer: {
            Text("拖动右侧手柄调整首页显示顺序，调整后自动保存。")
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
            }
            Spacer(minLength: 8)
            Group {
                if let module { Text(verbatim: "v\(module.version)") }
                else { Text("未安装") }
            }
            .foregroundStyle(.secondary)
            .fixedSize(horizontal: true, vertical: false)

        }
    }
    private func refreshModules() {
        let current = Dictionary(uniqueKeysWithValues: store.modules.map { ($0.id, $0) })
        let draftIDs = Set(modules.map(\.id))
        modules = modules.compactMap { current[$0.id] }
            + store.modules.filter { !draftIDs.contains($0.id) }
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
            Text("公共服务包括 AI 和应用更新。其他网络地址按应用分别列出。撤销自定义授权后，再次连接时需要重新授权。")
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
            modules: modules, customOrigins: custom, catalogURL: HostConfiguration.bundled.catalogURL,
            modelURL: modelURL,
            debugURL: DebugServer.enabled ? defaults.string(forKey: DebugServer.preferenceKey) : nil
        )
    }
}
