# Lingrove

SwiftUI 原生语言学习宿主（iOS 17+），使用 WKWebView 运行可独立更新的 Vue 3 + TypeScript + Vite 子应用。没有 Lingrove 账号或登录服务。

应用对外名称为 **Lingrove**，子应用源码统一位于 `app/`。工程和 Scheme 为 `Lingrove`，Bundle ID 为 `me.stackli.lingrove`，SDK 为 `@lingrove/host-sdk`，本地数据目录为 `Lingrove`；更新域名使用 `lingrove.stackli.me`。

## 运行

需要 Node.js 24 LTS、npm、Python 3；原生构建需要 Xcode。

```sh
npm ci
npm run dev                  # 浏览器预览 Sentra
npm run dev -w @lingrove/glyphora # 浏览器预览 Glyphora
npm run build                # Debug 网页、ZIP、目录及 iOS 内置资源
npm run debug:serve          # 用 dist/ 启动宿主调试服务，默认端口 8000
open ios/Lingrove.xcodeproj   # 选择 Lingrove scheme，运行 iPhone/iPad 模拟器
```

Xcode 项目已提交，不需要安装工程生成器。Xcode 的 Run、Build、Archive 会自动构建 `modules.json` 中的所有子应用，校验后嵌入 App 的 `BuiltinModules/`，无需提前运行 `npm run build`。首次构建缺少 `node_modules/` 时自动执行 `npm ci`（需要联网）；依赖变动后运行 `npm ci` 同步依赖。子应用构建或资源校验失败会中止 iOS 打包，内置子应用可在首次离线启动时打开。Node 安装在非标准位置时，可在 Xcode Build Settings 设置 `NODE_BINARY` 为 Node 可执行文件绝对路径。真机运行时在 Xcode 选择自己的签名 Team 和 Bundle ID。可选工程重生成：`ruby scripts/generate-xcode.rb`（需要 Ruby xcodeproj gem）。

## 一键安装到 iPhone / iPad

手机连接电脑并解锁，信任此电脑并开启“设置 → 隐私与安全性 → 开发者模式”。首次使用先在 Xcode 登录 Apple ID，并确认 Lingrove 的 Signing & Capabilities 中 Team 和 Bundle ID 可用于开发签名。

```sh
npm run ios:install                            # 自动选择唯一已配对设备，构建并安装 Debug
npm run ios:install -- --list                   # 查看设备名称和 Identifier
npm run ios:install -- --device '李乔的 iPhone'  # 多台设备时指定名称，也可使用 UDID / Identifier
npm run ios:install -- --team YOUR_TEAM_ID      # 可选：覆盖本次构建的签名 Team
```

支持 USB 和已在 Xcode 配对的无线连接；安装时设备须在线。多台已配对设备时需要明确指定目标。脚本从任意目录通过 `node /项目路径/scripts/install-ios.mjs` 运行也可。构建会自动更新并校验所有内置子应用，成功后才安装到设备；签名或构建失败会停止。Debug 产物保留在 `build/ios-device/Build/Products/Debug-iphoneos/Lingrove.app`，安装后在手机上打开 Lingrove。

## 子应用界面规范

所有子应用遵守 [子应用 UI 规范](docs/child-app-ui.md)：统一底部导航、完整浅色/暗黑模式、宿主 Home 避让和二级页返回。新应用复用 `@lingrove/host-sdk/ui.css`，具体实施要求见根目录 `AGENTS.md`。

## 仓库布局

- `ios/Lingrove/`：原生首页、模块更新、安装器、WebView、网络桥、本地存储。
- `app/`：所有子应用源码，每个应用有独立版本与 manifest。
- `packages/host-sdk/`：子应用公共 TypeScript SDK。
- `scripts/package-modules.mjs`：生成 ZIP、普通 JSON 目录和原生内置资源。
- `dist/`：可部署到 HTTPS 静态服务器/CDN 的发布产物。

## 唯一的宿主后端接口

原生冷启动通过 HTTPS 请求 `HostConfig.json` 中的 `catalogURL`。目录可以是 CDN 上的静态 `catalog.json`，无需动态业务服务器、登录鉴权或发布密钥。接口返回 HTTP 200 和普通 JSON：

```json
{"modules": []}
```

每个模块包含 `id`、`name`、`version`、`entry`、`minHostVersion`、`bridgeVersion`、`stateSchemaVersion`、`allowedOrigins`、`downloadUrl`、`size`、`sha256`。构建工具会自动生成完整目录。可选 `minimumAllowedVersion` 强制淘汰旧版。版本号使用三段数字（例如 `1.2.0`），目前不接受预发布标签。

目录和 ZIP 都必须通过 HTTPS 获取，使用系统默认 TLS 证书校验，不接受重定向。下载后校验包大小和 SHA-256，确认包与目录中的元数据一致。

## 配置自动更新

App 默认从 `https://lingrove.stackli.me/catalog.json` 检查更新；首次发布前接口不可用时，仍可打开内置子应用（模型请求仍需联网）。更换部署地址时按以下步骤修改。

1. 指定部署域名并构建：

```sh
MODULE_BASE_URL=https://your-domain.example npm run build:release
```

2. 将 `dist/` 上传至上述 HTTPS 域名。
3. 在 `ios/Lingrove/Resources/HostConfig.json` 填入唯一配置：

```json
{"catalogURL":"https://your-domain.example/catalog.json"}
```

4. 构建原生 App。以后修改子应用并提升对应 `app/<子应用ID>/manifest.json` 中的版本，再构建发布，即可在下一次冷启动自动更新。

发布顺序：先上传不可变版本 ZIP，再替换目录。`catalog.json` 建议 `Cache-Control: no-cache`；版本包可设 immutable。GitHub Actions 直接构建并发布普通 JSON 目录，不需要配置发布密钥 Secret。

## GitHub Actions 发布

`.github/workflows/build-gh-pages.yml` 在推送 `master` 时自动执行，也可从 Actions 手动触发（选择 `master`）。流程安装锁定依赖、检查 TypeScript、运行测试，再构建并校验发布产物；校验通过才将 `dist/` 发布到 `gh-pages` 分支根目录。无需额外发布密钥 Secret。

发布后的分支结构：

```text
gh-pages/
├── .nojekyll
├── CNAME
├── index.html
├── catalog.json                  # App 启动拉取的包信息
├── packages/
│   ├── sentra-1.1.1.zip           # 每个子应用独立版本包
│   └── glyphora-1.0.0.zip
├── glyphora/                     # 子应用网页及资源
└── sentra/
    ├── index.html                # 浏览器可直接访问
    ├── manifest.json
    └── assets/                   # 与 ZIP 内文件逐字节一致
```

沿用仓库的域名 `lingrove.stackli.me`，对应地址为：

- App 更新目录：`https://lingrove.stackli.me/catalog.json`
- Sentra ZIP：`https://lingrove.stackli.me/packages/sentra-1.1.1.zip`（版本变化后文件名相应变化）
- Sentra 网页：`https://lingrove.stackli.me/sentra/`
- Glyphora 网页：`https://lingrove.stackli.me/glyphora/`

目录为普通 `{ "modules": [...] }` JSON；模块记录包含 `webUrl`、`downloadUrl`、版本、包大小和 SHA-256。原生根据 `downloadUrl` 下载；`webUrl` 供浏览器访问。`npm run verify:release` 验证目录与所有包一一对应、哈希及大小正确、ZIP 与网页目录一致、HTML 引用的资源存在。

每次运行还保存一份 `lingrove-release` Actions artifact，保留 14 天。发布保留既有的单提交策略：只替换 `gh-pages` 产物分支，`master` 源码历史不变。仓库规则须允许 Actions 的 `GITHUB_TOKEN` 写入及强推 `gh-pages`；工作流同时申请 `pages: write` 以请求 Pages 构建。

仓库现有 GitHub Pages 配置为 `gh-pages` 分支根目录、自定义域名 `lingrove.stackli.me`。因为 `GITHUB_TOKEN` 推送不会自动触发分支式 Pages 构建，工作流推送后通过 [GitHub Pages 构建 API](https://docs.github.com/en/rest/pages/pages#request-a-github-pages-build) 显式触发构建，并等待本次产物提交构建成功；失败或超时会使工作流失败。无需切换 Pages 发布源，也不会修改 DNS 设置。

新增子应用时，在 `app/<子应用ID>/` 下创建项目；根 `package.json` 已通过 `app/*` 自动识别工作区。在 `modules.json` 中加入子应用 ID（不带 `app/` 前缀），提供 `package.json` 中的 `build` 命令和 `manifest.json`，并将 Vite 的 `outDir` 设置为 `../../dist/<子应用ID>`；manifest 的 `id` 与子目录名保持一致。添加工作区后运行 `npm install` 更新锁文件。统一构建脚本会依次构建清单中的所有子应用并生成相应 ZIP、网页目录和原生内置资源。

## 更新行为

- 首页立即展示；冷启动检查完成前暂不进入模块。
- 检查目录中的所有模块，逐个下载兼容的新版本；目录中新模块也会安装。
- 验证目录结构、包大小和 SHA-256，在临时目录解包，验证 manifest 后原子切换注册表。
- ZIP 只接受发布工具生成的 **ZIP_STORED**（不压缩），拒绝加密、压缩、路径越界、符号链接和重复文件。单包最大 50 MiB、2000 个文件。
- 普通下载失败保留旧版本；低于最低允许版本则禁止进入。离线时沿用缓存的最低版本限制。
- 当前会话不替换资源；若手动检查时模块仍打开，更新会延后到下次检查。
- 页面 20 秒内未调用 `runtime.ready`、导航失败或 Web 内容进程退出时尝试回退；不会回退至已被强制淘汰版本。失败版本会被记录，等待更高版本。
- 记录、偏好与代码包分开保存，更新和回退不覆盖学习数据。目前只接受 stateSchemaVersion=1，未来数据迁移需显式升级协议。

## 宿主大模型服务

在原生首页的「应用设置 → 大模型配置」中统一设置接口协议（OpenAI / Anthropic 兼容）、HTTPS Base URL、模型名称、可选 API Key 和推理强度。推理强度由服务商支持情况决定，OpenAI 兼容协议按配置发送 `reasoning_effort`，默认选项不发送该字段。所有子应用共用此配置，修改后下一次请求生效；进行中的请求继续使用启动时的配置。

完整配置保存在宿主独立 Keychain 项中（仅本机、解锁后可访问），不会通过桥接返回 API Key。宿主负责选定请求地址、构造协议与鉴权头、发送请求和流式传输；子应用无需配置模型域名授权。通用 HTTP 桥仍遵守子应用各自的域名权限，不能获取宿主凭据。

任何子应用都可使用公共 SDK：

```ts
import { llm } from '@lingrove/host-sdk';

const status = await llm.status(); // { configured, model }，不包含凭据
const controller = new AbortController();
const result = await llm.complete({
  system: 'You are a helpful language tutor.',
  messages: [{ role: 'user', content: 'Explain this sentence.' }],
  maxTokens: 4096,
}, {
  signal: controller.signal,
  onProgress: (text) => console.log(text), // 累积文本
});
// result: { text, model }
// controller.abort() 可停止请求。
```

消息角色支持 `user`、`assistant`，系统指令通过 `system` 传入。宿主忽略子应用传入的 URL、鉴权头与模型覆盖值，统一使用已保存的配置。请求最多 100 条消息、1 MiB，输出上限参数为 1–32768；每个子应用最多 6 个并发网络请求，响应最大 8 MiB，超时最长 120 秒。SDK 统一解析 OpenAI / Anthropic 流式及普通 JSON 响应，截断、拒绝和断流会报错。

宿主模型配置仅从当前 Keychain 项读取；未配置时需在宿主设置中填写。模型调用需要 Lingrove 宿主。

桥接方法为 `llm.status`、`llm.request`、`llm.cancel`，现有桥协议版本保持 1。

## 宿主语音合成（TTS）

在「应用设置 → 语音合成」中选择 **minimax-cn** 或 **OpenAI**，从下拉菜单选择模型和音色，再填写 API Key 和默认语速。模型列表按服务商区分；minimax-cn 提供官方系统音色，OpenAI 音色按所选模型过滤。服务地址由服务商自动决定，不提供 URL 输入：MiniMax 使用国内 `https://api.minimax.cn/v1`，OpenAI 使用 `https://api.openai.com/v1`。MiniMax 暂仅支持国内账户，默认模型 `speech-2.8-hd`、音色 `Japanese_Whisper_Belle`；请填写国内账户对应的密钥。订阅密钥能否调用所选模型由服务商套餐决定。

语音合成设置独立于通用模型设置，保存在本机 Keychain。点击右上角“保存”后，下一次调用生效，进行中的请求使用原配置。切换服务商时采用独立表单草稿，不会把前一家密钥自动发给新地址；通用模型、语音合成及按语言设置音色页面均需点击右上角勾选图标写入配置，保存成功后返回上一级；直接返回不会自动保存。页面提供「试听」，边生成边播放，并支持暂停、继续和停止。试听使用当前配置并消耗服务商额度。

```ts
import { tts } from '@lingrove/host-sdk';

const status = await tts.status(); // { configured, provider, model, voice }，voice 是默认音色，无密钥
const controller = new AbortController();
const result = await tts.synthesize({ text: 'こんにちは。', language: 'ja', speed: 0.8 }, {
  signal: controller.signal,
});
const audio = new Audio(result.audioURL);
await audio.play(); // 在用户点击播放后调用，并处理浏览器可能的播放拒绝
// controller.abort() 取消生成；audio.pause() 停止已生成音频的播放。
```

统一接口返回 `{ audioURL, mimeType, model, provider }`，`audioURL` 为 MP3 data URL，可直接播放，也可由子应用自行保存。单次文本限制为 1–4000 个 UTF-16 单元，语速 0.5–2 倍（省略时使用宿主默认值），长文由调用方分段。`synthesize()` 生成完成后一次性返回文件，不自动播放或缓存。响应最多 17 MiB，解码音频最多 8 MiB，超时 120 秒；与其他宿主网络请求共享每个子应用 6 个并发上限。关闭子应用运行实例或调用取消接口会终止生成。调用方应标明音频为 AI 生成。

桥接方法为 `tts.status`、`tts.synthesize`、`tts.cancel`。宿主按服务商适配请求和响应，忽略子应用传入的地址、密钥、模型和音色覆盖值；仅接受文本、可选语速和可选语言。MiniMax 适配 `/t2a_v2` 的非流式十六进制音频，OpenAI 适配 `/audio/speech` 的二进制 MP3。服务商错误（包括 HTTP 200 内的 MiniMax 业务错误）、空音频和异常响应会拒绝请求，不向子应用透传供应商响应正文。浏览器预览的 `tts.status()` 返回未配置，生成须在宿主中执行。

### 流式播放

`tts.play()` 直接启动宿主原生播放：第一段音频到达后即可开始，不等待整段生成。MiniMax 使用 SSE 十六进制 PCM 分片，OpenAI 使用 `response_format: "pcm"` 的增量二进制响应（24 kHz、单声道、16 位小端 PCM）。

```ts
const playback = tts.play({ text: 'こんにちは。今日はいい天気ですね。', language: 'ja' }, {
  signal: controller.signal,
  onState: (state) => {
    // buffering / playing / paused / ended / stopped / error
    console.log(state);
  },
});
// UI 按钮可调用 await playback.pause() / resume() / stop()。
try {
  await playback.finished; // 音频全部播放完毕后才完成，不是网络下载完即完成
} catch (error) {
  // 主动停止、AbortSignal 或宿主中断对应 AbortError；服务商失败会拒绝 Promise。
}
```

音频由 `AVAudioEngine` 增量排队播放，不经 JavaScript 拼接音频文件；桥接方法为 `tts.play`、`tts.pause`、`tts.resume`、`tts.stop`，状态通过已有 chunk 通道按请求 ID 分发。MiniMax 请求排除末包聚合音频，且宿主不重复播放末包的整段数据。断流、业务错误、非法分片和样本字节不完整都会中止播放。流式 PCM 上限 24 MiB，传输上限 49 MiB，网络空闲超时 120 秒、总传输超时 600 秒。

同一宿主同时仅有一个流式播放会话；开始新播放会停止上一会话。暂停保留播放位置，网络可继续接收（仍受大小及超时限制）；停止会立即清空播放队列并取消网络。返回宿主首页、子应用关闭或重载、进入后台、音频中断或拔下耳机会停止播放，不自动恢复。`finished` 在暂停时保持未完成，须继续或停止。设置页试听使用相同实现。Lector 阅读页提供朗读与位置滑块：按文本长度比例定位到句子，松手后取消旧请求，从目标句子重新流式生成并顺序朗读后文；百分比代表文本位置，并非音频时间。

## 多域名网络桥

子应用通过 `host.http` 对应的 SDK `request()` 调用网络：

```ts
import { request } from '@lingrove/host-sdk';
const response = await request({
  url: 'https://dictionary.example.com/search?q=apple',
  method: 'GET'
});
```

原生使用 URLSession，不受浏览器 CORS 限制。每个模块支持多个 `allowedOrigins`，按 HTTPS 协议、域名和端口精确匹配，禁止重定向和隐式 Cookie。自定义服务商由子应用设置页触发 `authorizeOrigin()`，原生弹窗展示目标域名并记录用户授权，可从原生设置撤销。模块不能自行把任意域名加到可信发布清单。模型调用统一使用宿主 `llm.request`。通用网络请求沿用清单和用户授权，不对模型域名做额外禁止或展示过滤。网络授权按公共服务和各子应用分组展示。

桥支持 JSON/文本响应、SSE 分块、取消、超时及响应大小限制。原生注入 CSP，阻止网页绕过网络桥访问远程资源。浏览器开发模式使用 fetch，仍需要服务商正确配置 CORS。宿主模型调用使用上述独立大模型接口。子应用不能读取宿主模型凭据。

## 本地数据

子应用数据保存在本机，按模块 ID 独立存储，与代码包分开管理。原生数据位于 `Application Support/Lingrove/State/<模块 ID>`，浏览器数据保存在当前网站的本地存储中，两者不自动同步。不提供旧版数据迁移。

浏览器版用于网页预览，不注册 Service Worker，也不生成 `sw.js`。离线使用由原生宿主的内置或已下载子应用资源提供。

## 验证

```sh
npm run check                 # TypeScript、前端测试、Debug 构建及产物校验
scripts/test-native.sh        # Swift 核心：目录校验、安装、版本、域名、回滚、损坏包
xcodebuild -project ios/Lingrove.xcodeproj -scheme Lingrove \
  -sdk iphonesimulator -derivedDataPath build/ios CODE_SIGNING_ALLOWED=NO build
# 在可用的 iPhone 模拟器上运行 UI 测试：
xcodebuild -project ios/Lingrove.xcodeproj -scheme Lingrove \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' test
```

前端测试使用模拟模型响应，不调用收费服务。WebKit 集成测试使用本地模拟响应验证原生 SSE 转发、域名拦截和持久存储。iOS UI 测试检查内置 Vue 页面、通信桥和跨重启偏好保存；请在专用测试模拟器运行。

## 调试模式与服务器资源

默认 `npm run build` 输出不压缩的 JS/CSS 和 source map，同时保留离线内置包。Xcode 的 Run 和默认构建使用 Debug，Archive 使用 Release；宿主设置中显示“调试模式”，开关默认开启。关闭后隐藏宿主与子应用的刷新按钮，并使用本地资源，服务器地址仍可编辑，并可点击“测试连接”验证；调整后自动保存，左上角“返回”关闭设置；调试资源变更会在关闭设置时重新加载。Release 构建不提供服务器加载能力。

1. 执行 `npm run build`，然后 `npm run debug:serve`（默认端口 8000，可用 `npm run debug:serve -- --port 8080` 修改）。启动时会打印可用的局域网 IP 地址，按 Ctrl+C 可正常退出。
2. 在宿主“设置 → 调试模式”输入服务器根地址，例如 `http://192.168.1.10:8000`，地址输入后自动保存，可点击“测试连接”检查连通性；启用调试模式后使用服务器资源，点击左上角“返回”关闭设置。手机和电脑需要能互相访问；真机地址不能填电脑的 localhost。
3. `npm run debug:serve` 以整个 `dist/` 为服务根目录，为 `modules.json` 中的所有子应用提供服务。每个子应用直接请求 `<根地址>/<子应用ID>/index.html` 及其 JS/CSS（例如 `/sentra/index.html`），不下载或解压 ZIP。新增子应用并运行 `npm run build` 后，同一个服务地址即可访问，无需为每个子应用单独启动服务。
4. 修改源码后重新运行 `npm run build`，返回宿主点击设置旁的“重新加载子应用”，刷新全部已安装子应用（包括尚未打开的子应用）。子应用页面 Home 按钮右侧也提供原生刷新按钮，用于刷新当前子应用；Debug 模式下会显示刷新成功或失败的提示。

调试服务禁用 HTTP 缓存且不压缩响应；每次重载会重建 WebView 并取消旧请求，未保存的页面状态会清空，已保存数据保留。服务器地址会持久保存；清空即可恢复本地资源。调试失败时可在错误页重新加载。Debug 支持局域网 HTTP 和 Safari Web Inspector。

正式发布请使用 `npm run build:release`（压缩资源）及 `xcodebuild ... -configuration Release`，或直接在 Xcode 执行 Archive（已配置为 Release）。原生 Release 构建阶段会自动使用压缩的正式资源，并忽略此前保存的调试地址。

### 按语言选择朗读音色

语音合成设置可选择默认音色，并进入可搜索的“按语言设置音色”页面，为中文、英语、日语、俄语、希腊语分别选择音色；各语言可选择“使用默认音色”。MiniMax 优先列出对应语言的系统音色，没有专属音色的语言可选择多语言系统音色。模型和 API Key 共用，切换服务商仍保留各自的表单草稿，点击右上角“保存”后生效。

`tts.play()` 与 `tts.synthesize()` 共用可选 `language` 参数，传入朗读文本的 BCP 47 语言代码（如 `ja`、`ja-JP`、`zh-CN`、`en-US`），不要传界面语言。宿主按上述五种语言选择音色；省略、未单独设置或其他语言使用默认音色，不自动猜测文本语言。混合语言内容由子应用按语言分段请求。Lector 使用文章语言为每个朗读分段传参。子应用不能通过该参数覆盖密钥、模型或音色 ID。

试听可选择语言，切换时自动填入对应语言的示例文本并停止当前播放，使用当前对应音色设置；选择默认音色时，示例文本跟随界面语言。切换模型会保留支持的音色；不受新模型支持的语言音色改为使用默认音色。
