# GitHub Actions 打包与网页安装

工作流 `.github/workflows/ios-adhoc.yml` 手动构建 Ad Hoc IPA，发布到现有 `gh-pages` 分支的 `/ios/`，安装地址为 **https://lingrove.stackli.me/ios/**。在 iPhone / iPad 的 Safari 打开后点击安装；也可单独下载 IPA。

Ad Hoc 只允许描述文件列出的设备安装，不是任意访客都能安装。Pages 上的安装包公开可下载；IPA 内的描述文件包含已登记的设备 UDID。新增测试设备后必须更新描述文件并重新打包。

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

Pages 保持从 `gh-pages` 根目录发布，自定义域名为 `lingrove.stackli.me`，确保安装页、manifest 和 IPA 均可通过有效证书的公开 HTTPS 地址访问。当前域名经 Cloudflare 提供 HTTPS；GitHub 尚未签发源站证书，因此暂时无法开启 Pages 的 Enforce HTTPS 开关，工作流直接使用已可访问的 HTTPS 域名。仓库规则需要允许工作流写入、强推 `gh-pages`；流程通过内置 `GITHUB_TOKEN` 请求 Pages 构建。先成功运行一次现有 Web Pages 工作流，再发布 iOS 安装包。

## 打包与发布

GitHub → Actions → **Build and publish iOS Ad Hoc** → Run workflow，选择 **master**：

- 默认 `Debug`：保留宿主调试功能，内置子应用也使用 Debug 构建。
- 明确需要正式功能构建时选择 `Release`。两者均通过 Apple Distribution 证书进行 Ad Hoc 签名，安装范围相同。

工作流读取描述文件中的 Team ID、UUID；验证它为未过期的、对应独立 App ID 的 Ad Hoc 文件，然后创建临时钥匙串。Archive 自动构建内置子应用；`xcodebuild -exportArchive` 使用当前 Xcode 的 `release-testing` 导出方式（Ad Hoc）。构建号使用 Actions 的运行编号与重试编号。

导出后再从 IPA 读取版本及描述文件，生成 HTTPS OTA manifest、带哈希文件名的 IPA、图标和安装页。页面显示版本、大小、有效期及 SHA-256，不展示 UDID 清单。构建成功后保存 `lingrove-ios-adhoc` artifact（14 天），再发布 Pages；Pages 构建成功后在运行摘要给出安装地址。

Web 与 iOS 发布共用 `publish-gh-pages` 互斥锁，并在获得锁后读取最新远端产物：Web 更新保留 `/ios/`；iOS 更新只替换 `/ios/`。仍保留 gh-pages 单提交策略，并使用 force-with-lease 防止覆盖其他写入者的更新。网页保留最新一份 IPA，旧版本可从尚未过期的 Actions artifact 获取。安装时请打开最新页面，已缓存的旧安装链接在下次发布后可能失效。

首次尚未发布 IPA 时，首页安装入口展示“安装包尚未发布”。签名或打包失败不会发布新的安装包。IPA 达到 100 MiB 会提前失败，因为此方案将文件直接推送到 GitHub 分支。

## 常见问题

Debug 宿主设置中“开发模式”下方的“更新 App”分组包含“安装最新版”和“查看下载页面”。每次打开设置会重新获取 `/ios/latest.json`，在“安装最新版”右侧按设备本地时区显示构建时间；获取期间或失败时禁用安装按钮，下载页面始终可打开。发布脚本生成的更新信息包含版本、构建号、构建时间及当前 manifest 地址，安装按钮通过系统 OTA 入口直接发起安装，仍需系统确认及已登记设备。首次使用此功能前，需要发布包含 `latest.json` 的新安装包。

- **Missing repository secret**：补齐上表三个 Secrets，再重新运行。
- **描述文件类型 / App ID 不匹配**：下载 Ad Hoc 文件，不能使用现有通配符 Development 文件。
- **No signing certificate / profile doesn't include signing certificate**：确认 `.p12` 带私钥，且描述文件选择了同一张 Apple Distribution 证书。
- **设备无法安装**：用 Safari 打开；确认 iOS / iPadOS 17+、UDID 已在此次描述文件中、证书和描述文件未过期或撤销。
- **Pages 发布失败**：检查分支权限、Pages 发布源和自定义域名 HTTPS；IPA artifact 仍可下载。

本地验证：`python3 scripts/tests/test-ios-distribution.py`。此测试覆盖 OTA 元数据、签名文件类型检查和两个发布者交替发布时的内容保留；真实 Apple 签名、设备安装仍需要上述签名材料及真机验证。
