# Lingrove

SwiftUI 原生语言学习宿主（iOS 17+），使用 WKWebView 运行可独立更新的 Vue 3 + TypeScript + Vite 子应用。没有 Lingrove 账号或登录服务。

应用对外名称为 **Lingrove**，子应用源码统一位于 `app/`。工程和 Scheme 为 `Lingrove`，Bundle ID 为 `me.stackli.lingrove`，SDK 为 `@lingrove/host-sdk`，本地数据目录为 `Lingrove`；更新域名使用 `lingrove.stackli.me`。

## 运行

需要 Node.js 24 LTS、npm、Python 3；原生构建需要 Xcode。

```sh
npm ci
npm run dev                  # 浏览器预览 Sentra
npm run dev -w @lingrove/alphi # 浏览器预览 Alphi
npm run build                # Debug 网页、ZIP、调试目录及 iOS 内置资源
npm run debug:serve          # 自动构建并监听源码，启动调试服务（端口 8000）
npm run build:watch          # 只监听并自动构建，配合已经运行的调试服务
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

原生冷启动及回到前台时通过 HTTPS 请求 `HostConfig.json` 中的更新目录：调试模式使用 `snapshotCatalogURL`（`snapshot/catalog.snapshot.json`），正常模式使用 `catalogURL`（`catalog.json`）。目录可以是 CDN 上的静态 `catalog.json`，无需动态业务服务器、登录鉴权或发布密钥。接口返回 HTTP 200 和普通 JSON：

```json
{"modules": []}
```

每个模块包含 `id`、`name`、`version`、`entry`、`minHostVersion`、`bridgeVersion`、`stateSchemaVersion`、`allowedOrigins`、`downloadUrl`、`size`、`sha256`。构建工具会自动生成完整目录。可选 `minimumAllowedVersion` 强制淘汰旧版。子应用 `version` 由构建工具按北京时间（Asia/Shanghai）的构建日期生成，格式为 `yyyyMMdd`，例如 `20261020`；`minimumAllowedVersion` 也使用日期格式。源 manifest 不再维护版本号。宿主版本及 `minHostVersion` 仍使用三段数字。同一天再次构建时，日期相同但哈希不同仍会更新，哈希相同则跳过。一次构建的所有模块及调试目录、正式目录共用同一日期。调试和正式目录均包含 `downloadUrl`、`size`、`sha256`、`webUrl`，分别指向本渠道的 ZIP 与 HTML 入口。

应用介绍由各子应用的 `manifest.json` 管理：`description` 是默认中文介绍，`localizedDescriptions` 保存 `en`、`ja` 等语言的介绍。宿主按当前界面语言直接读取元数据，缺少该语言时使用默认介绍；首页显示首句，应用详情显示全文。这些内容随目录、ZIP 和内置 manifest 一起打包更新，无需加入共享翻译字典。

子应用可独立更新：业务代码、翻译和教材随各自的 ZIP 一起发布，各应用词库位于 `app/<id>/src/locales/messages.json`。SDK 仅提供桥接 API、公共 UI 与语言切换能力；宿主的 `Localizable.xcstrings` 独立维护，宿主只消费应用显式提供的元数据，不在构建时从子应用源码、词库或内容中提取文案。纯子应用更新只发布 Web/ZIP，不触发 iOS 构建与 Ad Hoc 发布。

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
{"catalogURL":"https://your-domain.example/catalog.json","snapshotCatalogURL":"https://your-domain.example/snapshot/catalog.snapshot.json"}
```

4. 构建原生 App。以后修改子应用后直接构建发布，即可在下一次冷启动自动更新。

发布顺序：先上传不可变版本 ZIP，再替换目录。`catalog.json`、`catalog.snapshot.json` 建议 `Cache-Control: no-cache`。GitHub Actions 直接构建并发布普通 JSON 目录，不需要配置发布密钥 Secret。

## GitHub Actions 发布

iOS Ad Hoc 打包及 Safari 网页安装见 [配置说明](docs/ios-adhoc.md)。在 Actions 手动运行 **Build and publish iOS Ad Hoc**，默认构建 Debug，成功后发布到 `https://lingrove.stackli.me/ios/`。需先配置分发证书及 Ad Hoc 描述文件三个 Secrets；只有已登记设备可安装。Web 发布保留已有 iOS 安装包，iOS 发布保留现有子应用网页及更新目录。

快速开发阶段，Web 和 iOS 打包均跳过自动测试，直接安装依赖、构建、校验产物并发布；构建或校验失败会阻止发布。iOS 的 PR 验证仍保留测试和无签名模拟器编译，`master` 不再重复编译模拟器。内置子应用统一在 Xcode 构建阶段生成一次。

`.github/workflows/build-gh-pages.yml` 在推送 `master` 或 tag 时执行，也可手动选择 master 或 tag 触发。每次只构建触发渠道：master 使用该次提交生成 `snapshot/` 下的 Debug HTML、JS/CSS、`packages/` ZIP 和 `catalog.snapshot.json`，不重建 tag；tag 使用该 tag 的提交在根目录生成正式 HTML、`app/` 网页资源、`packages/` ZIP、`catalog.json` 和 `publication.json`，不生成 `release/` 目录，不构建调试渠道。两种发布共用 `publish-gh-pages` 并发锁，发布时读取远端最新文件树，只替换目标渠道，保留另一渠道及 `ios/`。每个渠道记录来源提交，拒绝旧提交或分叉提交覆盖已发布的新提交。正式发布后根首页直接展示正式网页；尚无正式产物时跳转调试网页。

发布后的分支结构：

```text
gh-pages/
├── .nojekyll
├── CNAME
├── index.html                    # tag 的正式首页；暂无正式产物时跳转 snapshot/
├── catalog.json                  # tag 的正式目录
├── publication.json              # 正式来源 tag 和提交
├── app/<id>/                     # tag 的正式 HTML、JS、CSS 等网页资源
├── packages/<id>-<日期>.zip        # tag 的正式 ZIP
├── snapshot/                     # master，只更新此目录
│   ├── index.html
│   ├── packages/<id>-<日期>.zip # Debug ZIP
│   ├── catalog.snapshot.json     # 调试清单，包含 ZIP、SHA-256 和 HTML 地址
│   ├── publication.json          # 调试来源提交
│   └── app/<id>/                 # 调试 HTML、JS、CSS 和其他网页资源
└── ios/                          # 独立维护的 iOS 安装文件
```

沿用仓库的域名 `lingrove.stackli.me`，对应地址为：

- 调试应用目录：`https://lingrove.stackli.me/snapshot/catalog.snapshot.json`
- 正式版更新目录：`https://lingrove.stackli.me/catalog.json`
- Sentra ZIP：`https://lingrove.stackli.me/packages/sentra-20261020.zip`（版本变化后文件名相应变化）
- Sentra 网页：`https://lingrove.stackli.me/snapshot/app/sentra/`
- Alphi 网页：`https://lingrove.stackli.me/snapshot/app/alphi/`

目录为普通 `{ "modules": [...] }` JSON；两种目录均包含应用元数据、版本、ZIP 地址 `downloadUrl`、包大小、SHA-256 和 HTML 入口 `webUrl`。正式资源位于 `/packages/`、`/app/`；snapshot 资源位于 `/snapshot/packages/`、`/snapshot/app/`。`npm run verify:release` 对两种渠道都校验 ZIP、hash 和网页文件的一致性。

每次运行还保存一份 `lingrove-channels` Actions artifact，保留 14 天。发布保留既有的单提交策略：只替换 `gh-pages` 产物分支，`master` 源码历史不变。仓库规则须允许 Actions 的 `GITHUB_TOKEN` 写入及强推 `gh-pages`；部署任务申请 `pages: write` 和 `id-token: write`，使用 `github-pages` environment。

首次使用新发布流程前，在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**，保留自定义域名 `lingrove.stackli.me` 和现有 DNS。`github-pages` environment 的部署规则需允许 `master` 和正式发布 tag。

Web 和 iOS 共用 `.github/actions/publish-pages`：先只读检查发布源，仍为分支发布时会在写入前失败并提示设置地址；之后读取最新远端文件树、合并本次渠道、更新 `gh-pages`，同时导出与本次产物提交完全一致的完整站点，再由 `actions/upload-pages-artifact` 上传、`actions/deploy-pages` 部署一次并等待成功。互斥锁覆盖合并、上传和部署全过程，失败或超时会使工作流失败。不再调用 Pages 构建 API，也不再依赖分支式自动部署。Web 和 iOS 各自更新时可以各部署一次，但同一次发布不会主动请求两次部署。

新增子应用时，在 `app/<子应用ID>/` 下创建项目；根 `package.json` 已通过 `app/*` 自动识别工作区。在 `modules.json` 中加入子应用 ID（不带 `app/` 前缀），提供 `package.json` 中的 `build` 命令和 `manifest.json`，并将 Vite 的 `outDir` 设置为 `../../dist/app/<子应用ID>`；manifest 的 `id` 与子目录名保持一致。添加工作区后运行 `npm install` 更新锁文件。统一构建脚本会依次构建清单中的所有子应用并生成相应 ZIP、网页目录和原生内置资源。

## 更新行为

Debug 宿主设置的“开发模式”分区只提供调试模式，默认关闭。冷启动、回到前台及切换模式后关闭设置页时都刷新当前目录：调试模式读取 `snapshot/catalog.snapshot.json`，正常模式读取 `catalog.json`。两种目录均提供 `downloadUrl`、`size`、`sha256` 和 `webUrl`（HTML 入口）。宿主共用安装与加载逻辑：有 ZIP 时优先安装并从本地加载，SHA-256 与下载包或内置资源相同时跳过下载；没有 ZIP 时才直接加载 HTML。调试模式使用所选服务器下的 snapshot 目录及资源，支持本地 HTTP；正式模式只允许 HTTPS。调试目录未配置或请求失败时不回退到正式目录。Release 宿主始终使用正式目录。

目录按 URL 分别缓存，刷新应用名称、介绍和列表成员，新增应用会出现，下架应用从列表隐藏；不删除已有学习数据或为同步列表删除安装包。请求失败时保留当前渠道的缓存列表，尚无缓存时保留可用本地应用。切换模式会取消旧请求，防止旧渠道的响应覆盖新列表。

调试模式左侧箭头展开地址列表，右侧开关控制启用。可添加多个服务器地址，单选地址后开启调试；连接和入口检测通过后才启用，失败时保持关闭。切换、修改或删除当前地址会关闭调试并取消旧检测。关闭设置时保存非空地址。调试开启时显示刷新按钮；点击后先绕过缓存拉取 `snapshot/catalog.snapshot.json` 并同步应用列表，再重新加载子应用。正常模式仅在版本或 SHA-256 变化时下载正式 ZIP，并保留上一构建用于启动失败回退。

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

同一宿主同时仅有一个流式播放会话；开始新播放会停止上一会话。暂停保留播放位置，网络可继续接收（仍受大小及超时限制）；停止会立即清空播放队列并取消网络。返回宿主首页、子应用关闭或重载、进入后台、音频中断或拔下耳机会停止播放，不自动恢复。`finished` 在暂停时保持未完成，须继续或停止。设置页试听使用相同实现。Verso 阅读页提供朗读与位置滑块：按文本长度比例定位到句子，松手后取消旧请求，从目标句子重新流式生成并顺序朗读后文；百分比代表文本位置，并非音频时间。

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

默认 `npm run build` 在 `snapshot/` 下输出不压缩的 JS/CSS、source map、`catalog.snapshot.json` 和 `packages/` ZIP，并更新离线内置资源及其 ZIP hash 索引。`npm run build:release` 在 `dist/` 根目录输出正式 HTML、`app/` 下的压缩网页资源、`packages/` 下的 ZIP 和 `catalog.json`。Xcode 的 Run 和默认构建使用 Debug，Archive 使用 Release。宿主设置只有调试模式开关，默认关闭；开启时显示刷新按钮。展开调试模式可添加和选择服务器地址，连接检测通过后才启用。切换、修改或删除当前地址会关闭调试；关闭设置时保存非空地址并重新加载子应用。Release 构建不提供调试服务器设置；ZIP 更新和缺少 ZIP 时的 HTTPS HTML 加载与 Debug 共用。

1. 执行 `npm run debug:serve`，默认使用端口 8000（可用 `npm run debug:serve -- --port 8080` 修改）。构建前先检测端口；若被占用，显示 PID、用户、启动时间和完整命令，并提示 `[Y/n]`，直接回车或输入 `y` 确认后发送终止请求，等待端口释放再继续；输入 `n` 或按 Ctrl+C 取消启动。非交互运行不会终止占用进程。首次 Debug 构建成功后自动启动服务，并持续监听源码修改，启动时打印可用的局域网 IP 地址；若构建期间端口被其他进程占用，会再次询问确认。按 Ctrl+C 同时停止监听、构建和服务。若已有服务在运行，可另开终端执行 `npm run build:watch`，只启用自动构建。
2. 在宿主“设置 → 开发模式”展开“调试模式”，添加服务器根地址，例如 `http://192.168.1.10:8000`；单选地址后打开“开启调试模式”，连接检查成功才启用，失败时保持关闭，可修改后重试。关闭设置会保存填写的地址并忽略空白行；点击左上角“返回”加载已启用的资源。手机和电脑需要能互相访问；真机地址不能填电脑的 localhost。
3. `npm run debug:serve` 以整个 `dist/` 为服务根目录，为 `modules.json` 中的所有子应用提供服务。本地自动构建使用 `npm run build -- --no-zip`，不生成 ZIP，snapshot catalog 只提供 HTML 地址。宿主先读取 `<根地址>/snapshot/catalog.snapshot.json`，再请求 `<根地址>/snapshot/app/<子应用ID>/index.html` 及其 JS/CSS。普通 `npm run build` 和 CI 发布仍生成 ZIP。新增子应用并更新 `modules.json` 后会自动构建，同一个服务地址即可访问，无需为每个子应用单独启动服务。

本地调试服务强制使用 Token 认证，所有请求（包括 GET、HEAD）都必须携带 `Stack-Pass: <Token>`，缺失或错误返回 `401`。默认每次启动生成 6 位随机字母数字 Token 并在终端显示；可在 PowerShell 中先执行 `$env:LINGROVE_DEBUG_TOKEN = 'Ab12Cd'` 再启动服务，Token 必须恰好为 6 位英文字母或数字（`A–Z`、`a–z`、`0–9`），区分大小写。目录列表已关闭，认证后访问没有首页的目录返回 `403`。开启手机调试模式时，若服务器返回 `401`，会弹框要求输入 Token；输入错误或已保存的 Token 失效时会再次弹出，只有连接和认证均成功才开启调试模式，取消或下滑关闭输入框会保持调试模式关闭；也可在调试地址下点击“设置 Token”或“Token 认证”修改。Token 按完整服务器根地址保存在本机 Keychain，不写入地址或查询参数；当前地址会显示 Token 认证状态。宿主为目录、ZIP、HTML 和相对资源请求附加认证头，拒绝跟随重定向，不向正式更新站点或模型、语音接口附加调试 Token。公网入口使用 HTTPS 时需保留 Stack-Pass 请求头。此认证仅属于本地调试服务器，不影响静态发布站点。修改服务器脚本或 Token 后需要重启 `npm run debug:serve`；修改原生客户端后需要更新宿主 App。
调试模式在启动、启用和刷新时读取调试服务器的 `catalog.json`，同步首页名称及各语言介绍。显示信息仅在当前调试会话中使用；关闭调试或切换服务器时恢复本地安装信息，不改写安装记录、资源版本或域名授权。

4. 保存子应用源码、静态资源、manifest、共享 SDK 或构建配置后，自动执行 `npm run build`。连续保存会合并处理，构建期间的新修改会在当前构建完成后再执行一次。生成产物、依赖目录和测试文件不触发构建。构建完成后点击宿主设置旁的“重新加载子应用”，先拉取调试目录、更新应用列表，再刷新所有应用。设置页在调试模式显示页面刷新状态，正常模式显示正式包检查和下载状态；详情保留最近完成时间和失败原因。应用来源为调试服务器、宿主内置或 Release 下载。调试详情展示调试目录版本和实际资源地址，本地详情展示资源版本、文件名及下载地址。调试服务器回退时跟随实际资源更新来源，已保存学习数据不受刷新影响。

正式安装包下载请求超时为 5 分钟，单次传输总时限为 15 分钟；更新目录查询超时为 1 分钟。切换调试模式会立即取消旧请求。

调试服务禁用 HTTP 缓存且不压缩响应；每次重载会重建 WebView 并取消旧请求，未保存的页面状态会清空，已保存数据保留。服务器地址会持久保存；清空即可恢复本地资源。调试失败时可在错误页重新加载。Debug 支持局域网 HTTP 和 Safari Web Inspector。

正式发布请使用 `npm run build:release`（压缩资源）及 `xcodebuild ... -configuration Release`，或直接在 Xcode 执行 Archive（已配置为 Release）。原生 Release 构建阶段会自动使用压缩的正式资源，并忽略此前保存的调试地址。

### 按语言选择朗读音色

语音合成设置可选择默认音色，并进入可搜索的“按语言设置音色”页面，为中文、英语、日语、俄语、希腊语分别选择音色；各语言可选择“使用默认音色”。MiniMax 优先列出对应语言的系统音色，没有专属音色的语言可选择多语言系统音色。模型和 API Key 共用，切换服务商仍保留各自的表单草稿，点击右上角“保存”后生效。

`tts.play()` 与 `tts.synthesize()` 共用可选 `language` 参数，传入朗读文本的 BCP 47 语言代码（如 `ja`、`ja-JP`、`zh-CN`、`en-US`），不要传界面语言。宿主按上述五种语言选择音色；省略、未单独设置或其他语言使用默认音色，不自动猜测文本语言。混合语言内容由子应用按语言分段请求。Verso 使用文章语言为每个朗读分段传参。子应用不能通过该参数覆盖密钥、模型或音色 ID。

试听可选择语言，切换时自动填入对应语言的示例文本并停止当前播放，使用当前对应音色设置；选择默认音色时，示例文本跟随界面语言。切换模型会保留支持的音色；不受新模型支持的语言音色改为使用默认音色。
