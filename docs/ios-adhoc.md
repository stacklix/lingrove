# GitHub Actions 打包与网页安装

工作流 `.github/workflows/ios-adhoc.yml` 在宿主相关文件推送到 `master` 时自动构建 Debug Ad Hoc IPA，发布到现有 `gh-pages` 分支的 `/ios/`，安装地址为 **https://lingrove.stackli.me/ios/**。在 iPhone / iPad 的 Safari 打开后点击安装；也可单独下载 IPA。

Ad Hoc 只允许描述文件列出的设备安装，不是任意访客都能安装。Pages 上的安装包公开可下载；IPA 内的描述文件包含已登记的设备 UDID。新增测试设备后必须更新描述文件并重新打包。

## Debug 与 Release 隔离

Ad Hoc 安装包继续使用 Debug 配置，包含调试服务器、snapshot catalog、开发者详情和构建状态查询。`Core/DebugServer.swift`、`DebugViews.swift` 的完整实现由 `#if DEBUG` 包围，并从 Release 的源文件列表排除；调试地址选择和刷新历史只在 Debug 中编译；ZIP 下载、hash 比较、安装、本地加载及没有 ZIP 时的 HTML 加载和回退由两个构建共用。Release 的远程资源仍只允许 HTTPS。

Xcode 的资源构建阶段按配置复制 `HostConfig.json`：Debug 使用包含两种目录地址的配置，Release 使用 `HostConfig.release.json`，只保留正式目录。Release 使用 `ReleaseInfo.plist`，不包含调试用 HTTP 放行和本地网络配置。

PR 检查与 master 的 Ad Hoc 工作流都会独立编译 Release 模拟器应用，并执行 `scripts/verify-ios-release.py`，检查实际可执行文件、配置和 Info.plist。该检查不会改变 Ad Hoc 的 Debug 产物。新增调试功能时，应同步维护 `scripts/tests/release-isolation.test.mjs` 和产物校验器中的禁止项。

## 一次性配置

需要有效的 Apple Developer Program 会员资格。

1. Apple Developer → Identifiers：注册 Explicit App ID `me.stackli.lingrove`。现有 `XC Wildcard` 可以保留。
2. Devices：登记每台测试 iPhone / iPad 的 UDID。
3. 在 Mac 的 Xcode → Settings → Accounts → Manage Certificates 创建或选用 **Apple Distribution** 证书。通过钥匙串访问导出证书及其私钥为 `.p12`，设置非空导出密码。不能仅上传 `.cer`，也不能使用缺少私钥的证书。
4. Apple Developer → Profiles → ＋ → **Ad Hoc**：选择上述 App ID、与 `.p12` 对应的分发证书和目标设备，生成并下载 `.mobileprovision`。
5. GitHub 仓库 → Settings → Secrets and variables → Actions → Repository secrets，添加：

| 名称 | 内容 |
| --- | --- |
| `BUILD_CERTIFICATE_BASE64` | `.p12` 文件的 Base64 |
| `P12_PASSWORD` | `.p12` 的导出密码 |
| `BUILD_PROVISION_PROFILE_BASE64` | Ad Hoc `.mobileprovision` 的 Base64 |

在 Mac 上将文件转为 Base64 并复制到剪贴板（按实际文件位置修改路径）：

```sh
base64 -i /path/to/Distribution.p12 | pbcopy
base64 -i /path/to/Lingrove-AdHoc.mobileprovision | pbcopy
```

分别执行并粘贴到对应 Secret。无需提供 Apple ID 密码、App Store Connect API Key 或额外 PAT；临时钥匙串密码由工作流每次随机生成。不要将签名文件、密码或 UDID 清单提交到源码仓库。

Pages 的 **Settings → Pages → Build and deployment → Source** 需选择 **GitHub Actions**，自定义域名保留 `lingrove.stackli.me`，确保安装页、manifest 和 IPA 均可通过有效证书的公开 HTTPS 地址访问。保留现有 DNS 和 HTTPS 配置；`github-pages` environment 的部署规则需允许 `master` 和正式发布 tag。`gh-pages` 仍保存完整产物，仓库规则需允许工作流写入、强推此分支。部署任务通过内置 `GITHUB_TOKEN` 的 `pages: write`、`id-token: write` 权限直接部署完整站点，不再请求分支式 Pages 构建。先成功运行一次 Web Pages 工作流，再发布 iOS 安装包。

## 打包与发布

推送到 `master` 时，仅在宿主源码或资源、Xcode 工程、共享原生文案、宿主构建/签名/发布脚本或此工作流发生变化时自动打包。`BuiltinModules/` 生成资源不触发打包；只修改子应用源码、manifest、`modules.json` 或 SDK 的 Web/TypeScript/CSS 时不会触发 iOS 打包。没有匹配文件变化时，整个工作流不启动。

快速开发阶段，验证与打包按事件分工：

- PR 命中 `.github/workflows/ios.yml` 的路径名单时，运行 TypeScript、应用测试、分发脚本测试和原生核心测试，再进行无签名模拟器编译。此工作流不再由 `master` 推送自动触发，仍可手动运行作诊断。
- `master` 命中现有 Ad Hoc 宿主路径名单时，安装依赖后直接导入签名材料、Archive 并导出 IPA，不运行自动测试。构建或产物校验失败会阻止发布。保持原有自动打包路径范围，纯子应用和 SDK Web 修改仍只走 Web 发布。
- Web 发布同样跳过自动测试，安装依赖后直接构建并校验产物，再发布 Pages。
- iOS 的内置子应用由 Xcode 构建阶段统一构建并校验，避免重复生成资源。`master` 不再额外编译模拟器版本。

需要更新证书或描述文件、重打安装包时，仍可在 GitHub → Actions → **Build and publish iOS Ad Hoc** → Run workflow，选择 **master** 手动强制构建。

工作流只构建 `Debug`，保留宿主调试功能，内置子应用也使用 Debug 构建。安装包通过 Apple Distribution 证书进行 Ad Hoc 签名。

工作流读取描述文件中的 Team ID、UUID；验证它为未过期的、对应独立 App ID 的 Ad Hoc 文件，然后创建临时钥匙串。Archive 自动构建内置子应用；`xcodebuild -exportArchive` 使用当前 Xcode 的 `release-testing` 导出方式（Ad Hoc）。构建号使用 Actions 的运行编号与重试编号。

导出后再从 IPA 读取版本及描述文件，生成 HTTPS OTA manifest、带哈希文件名的 IPA、图标和安装页。页面显示版本、大小、有效期及 SHA-256，不展示 UDID 清单。构建成功后保存 `lingrove-ios-adhoc` artifact（14 天），再发布 Pages；Pages 构建成功后在运行摘要给出安装地址。

Web 与 iOS 发布共用 `publish-gh-pages` 互斥锁，并在获得锁后读取最新远端产物：Web 更新保留 `/ios/`；iOS 更新只替换 `/ios/`。共用 `.github/actions/publish-pages`，导出完整的合并站点后上传 Pages artifact，每次发布只调用一次 `actions/deploy-pages`，锁一直持有到部署结束。仍保留 gh-pages 单提交策略，并使用 force-with-lease 防止覆盖其他写入者的更新。网页保留最新一份 IPA，旧版本可从尚未过期的 Actions artifact 获取。安装时请打开最新页面，已缓存的旧安装链接在下次发布后可能失效。

首次尚未发布 IPA 时，首页安装入口展示“安装包尚未发布”。签名或打包失败不会发布新的安装包。IPA 达到 100 MiB 会提前失败，因为此方案将文件直接推送到 GitHub 分支。

## 常见问题

Debug 宿主设置的应用列表后提供 GitHub 构建进度，可切换 iOS 安装包和子应用发布流程。首次使用需配置 GitHub Token 并点击“保存 Token”；Token 仅存入设备 Keychain，清空后保存可删除。Token 需能够访问此仓库并具有 Actions 读取权限。只有设置页打开且 App 在前台时才请求进度，关闭页面、切到后台或删除 Token 后停止拉取；未配置 Token 时不发送匿名请求。

Debug 宿主设置中“开发模式”下方的“更新 App”分组每次打开设置会重新获取 `/ios/latest.json`。仅当远端版本号更高，或版本号相同且构建号更高时，显示带绿色图标的“安装最新版”；右侧显示版本号和构建号，下一行按设备本地时区显示构建时间。“查看下载页面”始终可打开。发布脚本生成的更新信息包含版本、构建号、构建时间及当前 manifest 地址，安装按钮通过系统 OTA 入口直接发起安装，仍需系统确认及已登记设备。首次使用此功能前，需要发布包含 `latest.json` 的新安装包。

- **Missing repository secret**：补齐上表三个 Secrets，再重新运行。
- **描述文件类型 / App ID 不匹配**：下载 Ad Hoc 文件，不能使用现有通配符 Development 文件。
- **No signing certificate / profile doesn't include signing certificate**：确认 `.p12` 带私钥，且描述文件选择了同一张 Apple Distribution 证书。
- **设备无法安装**：用 Safari 打开；确认 iOS / iPadOS 17+、UDID 已在此次描述文件中、证书和描述文件未过期或撤销。
- **Pages 发布失败**：检查分支权限、Pages 发布源和自定义域名 HTTPS；IPA artifact 仍可下载。

本地验证：`python3 scripts/tests/test-ios-distribution.py`。此测试覆盖 OTA 元数据、签名文件类型检查和两个发布者交替发布时的内容保留；真实 Apple 签名、设备安装仍需要上述签名材料及真机验证。
