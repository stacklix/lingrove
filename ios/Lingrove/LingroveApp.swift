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


@main struct LingroveApp: App {
    @StateObject private var store = ModuleStore()
    var body: some Scene { WindowGroup { HomeView(store: store) } }
}
struct HomeView: View {
    @ObservedObject var store: ModuleStore
    @StateObject private var pages = ModulePageCache()
    @State private var didCheck = false
    @State private var showingSettings = false
    @State private var modelError = ""
    @State private var debugAddress = UserDefaults.standard.string(forKey: DebugServer.preferenceKey) ?? ""
    @State private var debugError = ""
    @State private var connectionMessage = ""
    @State private var connectionFailed = false
    @State private var connectionTest: Task<Void, Never>?
    @State private var connectionTestID = UUID()
    @AppStorage(DebugServer.enabledPreferenceKey) private var debugEnabled = true
    @State private var draftDebugEnabled = true
    @State private var draftAppLanguage = "system"
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
                                Text(module.description ?? "独立学习子应用").font(.subheadline).foregroundStyle(.secondary)
                                if store.blocked.contains(module.id) {
                                    Label("暂时无法打开", systemImage: "exclamationmark.circle").font(.caption).foregroundStyle(.secondary)
                                }
                            }.padding(22).background(Color(uiColor: LingroveTheme.surface)).clipShape(RoundedRectangle(cornerRadius: 22))
                        }.buttonStyle(.plain).disabled(store.checking || !didCheck || store.blocked.contains(module.id))
                    }
                }.padding(24)
            }.background(Color(uiColor: LingroveTheme.background)).navigationTitle("Lingrove")
            .toolbar { if DebugServer.available && debugEnabled { Button { pages.reloadAll(store: store) } label: { Image(systemName: "arrow.clockwise") }.accessibilityLabel("重新加载子应用") }; Button { resetSettingsDraft(); showingSettings = true } label: { Image(systemName: "gearshape") }.accessibilityLabel("应用设置") }
            .safeAreaInset(edge: .bottom) {
                if DebugServer.available && debugEnabled, let message = pages.reloadMessage {
                    ReloadFeedbackView(message: message, autoDismiss: !pages.isReloading) { pages.reloadMessages.removeAll() }.padding()
                }
            }
            .sheet(isPresented: $showingSettings, onDismiss: resetSettingsDraft) {
                NavigationStack {
                    Form {
                        if DebugServer.available {
                            Section("调试模式") {
                                Toggle("调试模式", isOn: $draftDebugEnabled)
                                    .accessibilityIdentifier("debug-mode-toggle")
                                Text("开启后显示刷新按钮并使用配置的服务器资源；关闭后使用本地资源，仍可编辑和保存服务器地址。").font(.footnote)
                                TextField("http://192.168.1.10:8000", text: $debugAddress)
                                    .textInputAutocapitalization(.never).autocorrectionDisabled().keyboardType(.URL)
                                    .accessibilityLabel("调试服务器地址")
                                    .onChange(of: debugAddress) { _, _ in clearConnectionTest() }
                                Button(action: testDebugConnection) {
                                    HStack {
                                        if connectionTest != nil { ProgressView() }
                                        Text(connectionTest == nil ? "测试连接" : "正在测试…")
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
                        Section("应用语言") {
                            Picker("当前语言", selection: $draftAppLanguage) {
                                Text("跟随系统").tag("system")
                                Text("简体中文").tag("zh-Hans")
                                Text("繁體中文").tag("zh-Hant")
                                Text("English").tag("en")
                                Text("日本語").tag("ja")
                                Text("Русский").tag("ru")
                                Text("Ελληνικά").tag("el")
                            }
                            Text("用于子应用的句子成分翻译，修改后下次分析生效。").font(.footnote)
                        }
                        Section("模型服务") { NavigationLink("大模型配置") { LLMSettingsView() } }
                        Section("子应用版本") {
                            ForEach(store.modules) { module in
                                LabeledContent(module.name, value: "v\(module.version)")
                            }
                            if store.modules.isEmpty {
                                Text("暂无已安装的子应用").foregroundStyle(.secondary)
                            }
                        }
                        Section("更新服务") { Text(HostConfiguration.bundled.catalogURL.isEmpty ? "未配置更新地址，请在 HostConfig.json 中配置后构建。" : HostConfiguration.bundled.catalogURL).font(.footnote) }
                        Section("网络授权") { Text("子应用默认可访问发布清单内的域名。自定义服务商首次连接时需要确认。撤销后，再次连接需重新授权。").font(.footnote); Button("撤销自定义域名授权", role: .destructive) { for module in store.modules { UserDefaults.standard.removeObject(forKey: "origins.\(module.id)") } } }
                        Section("关于") { Text("Lingrove \(HostConfiguration.currentVersion)"); Text("Vue 学习工具 · Swift 原生宿主") }
                    }.navigationTitle("设置").toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            Button("取消") { resetSettingsDraft(); showingSettings = false }
                        }
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("完成") { saveSettings() }
                        }
                    }
                }
            }
            .task { guard !didCheck else { return }; do { _ = try LLMStore.load() } catch { modelError = error.localizedDescription }; await store.checkForUpdates(); didCheck = true }
            .alert("模型配置读取失败", isPresented: Binding(get: { !modelError.isEmpty }, set: { if !$0 { modelError = "" } })) { Button("好") { modelError = "" } } message: { Text(modelError) }
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
        draftDebugEnabled = debugEnabled
        draftAppLanguage = UserDefaults.standard.string(forKey: AppLanguage.preferenceKey) ?? "system"
        debugError = ""
    }
    private func saveSettings() {
        if DebugServer.available {
            do {
                let address = try DebugServer.normalized(debugAddress)
                UserDefaults.standard.set(address, forKey: DebugServer.preferenceKey)
                UserDefaults.standard.set(draftAppLanguage, forKey: AppLanguage.preferenceKey)
                debugAddress = address
                debugEnabled = draftDebugEnabled
                debugError = ""
                showingSettings = false
                pages.reloadAll(store: store)
            } catch { debugError = error.localizedDescription }
        } else {
            UserDefaults.standard.set(draftAppLanguage, forKey: AppLanguage.preferenceKey)
            showingSettings = false
        }
    }

}
