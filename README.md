# openGym-IPA

用 **GitHub Actions** 每天自动从上游 [DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym)
构建 **未签名 iOS 安装包（`openGym-x.y.z-unsigned.ipa`）**，并发布到本仓库的
[Releases](../../releases)。

[![Build iOS IPA](https://github.com/y08lin4/openGym-IPA/actions/workflows/build-ipa.yml/badge.svg)](https://github.com/y08lin4/openGym-IPA/actions/workflows/build-ipa.yml)

## 背景

[openGym](https://github.com/DuarteSantos8/openGym) 是自托管的健身/自重训练记录应用（网页 + 移动端）。
官方发布 Android APK，但 **iOS 没有官方 IPA 下载**：上游的 `build:ios` CI 任务需要自建 Mac runner，
GitLab 免费档跑不了 macOS。本仓库做的事就是把同一个官方构建流程搬到 GitHub Actions 的 macOS
托管 runner 上（公开仓库免费），产出上游文档
[docs/MOBILE.md](https://github.com/DuarteSantos8/openGym/blob/main/docs/MOBILE.md#iphone--whats-actually-possible)
里为 AltStore / Sideloadly 用户描述的未签名 IPA。

构建内容与上游完全一致：上游自带的 Capacitor iOS 工程（bundle id `ch.duartesantos.opengym`），
`VITE_MOBILE=1` 移动构建，`xcodebuild` 归档时不带签名身份（`CODE_SIGNING_ALLOWED=NO`）。

## 怎么用

1. 到 [Releases](../../releases) 下载 `openGym-<版本>-unsigned.ipa`（建议顺手核对 `.sha256`）。
2. 用下面任一**免费**方式签名安装（未签名 IPA 无法直接安装）。
3. 打开 App，首次启动选模式：
   - **本地模式**：免注册，数据存手机端；
   - **连接自己的服务器**：在你已登录的 openGym 网页端 → 设置 → 账户 → 「配对手持设备」
     生成一次性配对码（5 分钟有效），在 App 里输入服务器地址 + 配对码。App 内用配对令牌，
     **不需要 passkey**（详见上游 MOBILE.md）。

### 安装方法

| 方式 | 适合 | 说明 |
|---|---|---|
| **Sideloadly**（Windows/Mac） | 大多数人 | 用免费 Apple ID 签名安装；免费账号签出的 App 7 天有效、同时最多 3 个 App，到期用同一工具点一次刷新即可 |
| **AltStore / AltServer**（需一台 Mac 或 PC 常开） | 想全自动续期 | 自动在 Wi-Fi 下每 3 天帮你刷新签名 |
| **TrollStore** | iOS 14.0–16.6.1（及部分 17.0）机型 | 免签名、永久有效、不占免费签名名额，最省事（看你的 iOS 版本是否支持） |
| **ESign**（iPhone 上直接签） | 无电脑 | 需要自己准备签名证书（自签证书需装描述文件，有一定门槛） |

> 注意：签名时**不能改 bundle id** 也能装；改 id 也可以，但更新时要保持一致。
> 免费 Apple ID 的 7 天限制是苹果策略，与本仓库无关。

## 更新策略

- 每天定时（UTC 07:13）检查上游最新 Release，发现新版本自动构建并发一个同名 tag 的 Release。
- 也可在 Actions 页面手动 **Run workflow**：可指定任意上游 tag / 分支（如 `main`），
  `force` 选项可强制重建已发布版本的产物。
- 上游是活跃项目，APK/IPA 每次都是全新完整包，覆盖安装不丢数据。

## 构建步骤（workflow 里实际执行的命令）

```sh
cd frontend
npm ci                      # Node 22
npm run build:mobile        # VITE_MOBILE=1 vite build + cap sync（含 pod install）
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath build/App.xcarchive \
  MARKETING_VERSION=<ver> CURRENT_PROJECT_VERSION=<build> \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" archive
# App.app 放入 Payload/ 目录压缩即得 .ipa
```

与上游 `.gitlab-ci.yml` 中 `build:ios` 任务一一对应。

## 许可与声明

- IPA 里的一切来自上游 openGym（AGPL-3.0，见上游 [LICENSE](https://github.com/DuarteSantos8/openGym/blob/main/LICENSE)）；本仓库的构建脚本与文档为 MIT（见 [LICENSE](LICENSE)）。
- 本仓库是第三方自动构建，与 openGym 官方无隶属关系；使用中遇到 App 本身的问题请先查[上游 issues](https://github.com/DuarteSantos8/openGym/issues)。
- 官方 iOS 替代方案提醒：如果你本来就自建服务器，Safari「添加到主屏幕」的 PWA 也是完整可用的（免签名、不过期），见上游文档。
