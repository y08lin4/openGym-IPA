# openGym-lite

[上游 openGym](https://github.com/DuarteSantos8/openGym)（自托管健身记录，AGPL-3.0）的**二开 lite 客户端发行仓库**：包内不再携带 6554 个动作演示媒体（约 190MB，这正是官方 APK/IPA 要 200MB 的原因），配对服务器后**按需拉取 + 动态缓存**。产物是 **Android 签名 APK + iOS 未签名 IPA**，各约 10MB。

[![release](https://github.com/y08lin4/openGym-lite/actions/workflows/release.yml/badge.svg?branch=dev)](https://github.com/y08lin4/openGym-lite/actions/workflows/release.yml)

## 怎么用

1. 从 [Releases](../../releases) 下载对应平台的包：
   - **Android**：APK 用[开源 keystore](ci/android-release.keystore)（别名/密码 `opengym-lite` / `opengym-lite-public`）签名，浏览器下载后直接安装；
   - **iOS**：IPA 未签名，用 **AltStore / Sideloadly**（免费 Apple ID，7 天）重签安装，或 TrollStore（受限 iOS 版本）直装、ESign 自签。
2. 打开 App → 选「连接服务器」→ 在已登录的 openGym 网页 **设置 → 账户 → 配对手持设备** 生成一次性配对码 → 在 App 填服务器地址 + 配对码。
3. 动作演示在第一次看到时自动从你的服务器拉取（图 ~5KB、视频 ~25KB），Service Worker 缓存（30MB LRU），课表内动作会预取（并发 2）。App 内登录走配对令牌，不需要 passkey。

## 服务器配套（一次性）

- 官方 openGym Docker 镜像**自带全部媒体**并已在 `/exercise-media/` 提供服务，无需额外部署；建议服务端版本与客户端同代（`GET /api/config` 返回 404 说明太旧）。
- **必须改一行 nginx**：媒体 location 的 CORP 头从 `same-origin` 改为 `cross-origin`（官方模板按"手机自带媒体"设计写死了同源，lite 客户端是跨源取用，iOS/Android 新版内核都会拦截）。`web/nginx.conf.template` 两处 `add_header Cross-Origin-Resource-Policy "same-origin"` → `"cross-origin"`，重建/重启 web 容器即可；自查：

  ```sh
  curl -sI https://你的服务器/exercise-media/still/5986.webp | grep -i cross-origin
  # 期望：Cross-Origin-Resource-Policy: cross-origin
  ```

## 分支模型与发布流

| 分支 | 内容 | 构建 |
|---|---|---|
| `upstream` | 纯上游镜像，快进到上游最新 release tag | 不构建 |
| `dev` | 上游 + 二开 patch；sync.yml 每日跟进上游，冲突自动开 issue | push 即发 `vX.Y.Z-dev.N`（prerelease），真机验证装它 |
| `main` | dev 验证通过后合入 | 发正式 `vX.Y.Z`（覆盖式） |

Release 流水线：`meta → web（全量前端测试 + 共享移动 Web 包）→ iOS ∥ Android → 发 Release`。iOS 走无签名 `xcodebuild archive`；Android Gradle 产物 zipalign + `ci/android-release.keystore` 签名（keystore 已入库，换钥匙会导致老用户无法覆盖安装）。

## 二开内容（patch 都在干净 commit 里，随时可向上游发 PR）

1. `media-origin.js` + `exercises.js`：演示媒体基址改为**运行时解析**——配对谁就拉谁，断开回退默认，包与服务器地址解耦（媒体在站点根，与上游 `normalizeServerUrl` 语义一致）。
2. `api.js`：`setRemoteAuth` 单点挂钩（配对/续期/断开/开机恢复四条路径的咽喉），换服务器顺带清空旧媒体缓存。
3. `sw.js`：媒体缓存上限 150MB/3000 项 → **30MB/4096 项**，跨源记账估算 64KB→24KB（贴近真实单价，上限名实相符）；LRU 淘汰机制沿用上游。
4. 构建不 stage 媒体（未配对时 `Media.jsx` 现成降级链兜底：动画→静图→占位块+点击重试，不会出现常驻碎图）。

## 许可证

本仓库整体为 **AGPL-3.0**（上游源码 + 我们的衍生修改与 CI）；Android keystore 刻意开源。与 openGym 官方无隶属关系；App 本身的问题请先到[上游 issues](https://github.com/DuarteSantos8/openGym/issues) 核对。

## 本地开发

```sh
cd frontend && npm ci && npm test        # vitest（媒体改动相关的钉测试：sw-media / media-prefetch / api-base / clip-ext）
VITE_MOBILE=1 npx vite build && npx cap sync   # lite Web 包
```

上游同步：`sync.yml` 每日执行 `git merge -X ours`（我们的 README/LICENSE 恒胜）；patch 触点漂移时人工按 issue 提示合并。
