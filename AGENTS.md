# 麦田（Maitian）Windows 专用版 · AI Agent 交接与使用指南

> 本仓库基于 [CzzzzzzJ/mdldm-maitian](https://github.com/CzzzzzzJ/mdldm-maitian) 适配 **Windows 10/11** 环境，配套扩展仓库为 `mdldm-maitian-publisher-win`。
> 任何 AI Agent（Antigravity / Claude Code / Codex / Cursor）在 Windows 上接手部署或使用时，**请严格按本文件流程执行**。

---

## 一、Windows 专属改造与新增能力（审计清单）

原版项目仅在 macOS 实测，本仓库已完成以下 Windows 全链路适配与功能增强：

| 模块 | 文件 | 改造 / 新增内容 |
|---|---|---|
| ESM 路径加载 | `src/driver.mjs` | 动态 `import()` 改用 `pathToFileURL(...).href`，修复 Windows `Received protocol 'c:'` 报错 |
| Chrome 路径 | `src/chrome-shim.mjs` | 自动识别 Windows 下 `C:\Program Files\Google\Chrome\...` 路径 |
| 插件桥接拉起 | `src/bridge.mjs` | `ensureBridge()` 在 `win32` 下改用 `cmd /c start`，替代 macOS `open` |
| 中控主程序 | `src/hub.mjs` | 1) `new URL(...).pathname` 改用 `fileURLToPath`；<br>2) `ensureNas()` 增加 `win32` 保护，避免读取 `/Volumes` 报错；<br>3) `ALL` 与 `LOGIN_PAGES` 接入 `kuaishou` |
| 网页控制台 | `src/web.mjs` | `/cover` 与 `/shot` 路径前缀校验在 `win32` 下改用 `path.resolve(...).toLowerCase()`，修复盘符大小写 404 |
| 大屏前端 | `src/web/board.html`, `mt.js`, `pages.html` | 1) 将原 `X` 替换为 **快手（`kuaishou`）** 及橙色图标；<br>2) `board.html` 自动轮询间隔从 60s 优化为 **15s**；<br>3) `pages.html` 加 `?v=2` 防缓存 |
| 截图超时 | `src/driver.mjs` | `plugin` 模式下 `Page.captureScreenshot` 超时放宽至 `60000ms` |
| 数据库映射 | `src/db.mjs` | `NAMES` 映射新增 `kuaishou: '快手'` |

配套插件仓库（`mdldm-maitian-publisher-win`）同步完成：
- `video.js`：盘符路径校验兼容 Windows（`C:\...`、`Y:\...`、`\\server\...`）；
- `lib/publish.js`：`abs()` 按 `rootPath` 分隔符统一拼接 `\`，预检改为前台标签页 `active: true` + `120s` 超时；
- `tools/make-publish.mjs`、`tools/validate.mjs`：目录扫描统一转为 `/` 相对路径，修复 Windows 找不到 `封面/cover-*.png` 的问题，并支持 `pathToFileURL` 加载 `make-publish.local.mjs`；
- **新增快手全流程**：`lib/platforms/kuaishou.js`、`extra.js`、`extra-specs.js`、`tools/make-publish.local.mjs`；
- `lib/platforms/douyin.js`：先设定时，待视频抽帧就绪再开「选择封面」弹窗，失败时前台重试一次；
- `lib/platforms/channels.js`：3:4 封面不重复上传，找不到 4:3 编辑按钮时温和提示不标红异常。

---

## 二、Windows 环境一键安装与部署（Agent 执行步骤）

### 1. 前置依赖
- **Node.js `>= 22.5`**（必须，用到内置 `node:sqlite`）
- **Git**、**Google Chrome**
- **ffmpeg**（必须用于给成片做 `-movflags +faststart`，否则小红书报「无视频流信息」）

### 2. 克隆两个仓库（建议放在 `%USERPROFILE%\maitian\`）
```powershell
mkdir "$env:USERPROFILE\maitian" -Force
cd "$env:USERPROFILE\maitian"
git clone https://github.com/arb989822/mdldm-maitian-win.git mdldm-maitian
git clone https://github.com/arb989822/mdldm-maitian-publisher-win.git mdldm-maitian-publisher
```
或直接运行：
```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-win.ps1
```

### 3. 加载 Chrome 插件（需用户操作一次）
1. 在 Chrome 打开 `chrome://extensions`
2. 开启右上角「开发者模式」→「加载已解压的扩展程序」→ 选择 `mdldm-maitian-publisher` 目录
3. 记下扩展卡片上的 **ID**（32 位字母），写入 `config.json` 的 `extensionId`

### 4. 生成 `config.json`（禁止直接跑 macOS 版 `init.mjs` 跳过 Chrome 检查）
创建 `mdldm-maitian/data` 目录，并生成 `config.json`（参考 `config.example.json`）：
- `"driver": "plugin"`（推荐：直接联动 Chrome 插件）
- `"pluginDir"`: `"C:\\Users\\<用户名>\\maitian\\mdldm-maitian-publisher"`
- `"extensionId"`: `"<Chrome 扩展 ID>"`
- `"rootPath"`: `"<你的发布工程根目录>"`（例如 `"Y:\\AI励志\\最终定稿"`）
- `"batches"`: `[["bilibili", "douyin"], ["xhs", "channels", "kuaishou"], ["youtube"], ["instagram"]]`
- `"manual"`: `["bilibili", "douyin", "xhs", "channels", "kuaishou"]`
- `"web"`: `{ "port": 8787, "key": "<随机口令>" }`

### 5. 注册 Windows 后台常驻服务（推荐）
不要仅在临时终端里跑 `node src/hub.mjs web`（终端关闭即停）。应注册 Windows 计划任务 `MaitianWeb`：
- 创建无黑框启动脚本 `silent-web.vbs`（不入 git），用 `Register-ScheduledTask` 设 `AtLogOn` 触发，这样开机/登录后 `http://localhost:8787/?key=<key>` 永远在线。

---

## 三、日常使用与避坑铁律（Agent 必读）

1. **视频必须 `faststart`**：
   打包工程前检查 `moov` 位置，若非 `faststart` 务必先执行：
   ```powershell
   ffmpeg -v error -y -i input.mp4 -c copy -movflags +faststart 成片.mp4
   ```
2. **国内 4 平台人工点发布红线**：
   小红书、抖音、视频号、快手永远停在 **`待你点发布`**，由人工核对封面、AI 声明、定时后手动点击发布，**严禁改为全自动点击发布**。
3. **修改插件代码后必须重载 Service Worker**：
   仅刷新侧边栏不会重载 `background.js`，必须在 `chrome://extensions` 点刷新图标（或通过 CDP 在 `sidepanel.html` 上执行 `chrome.runtime.reload()`）。
4. **插件侧边栏手动运行时的路径对齐**：
   因为 Chrome `showDirectoryPicker()` 不暴露完整盘符路径，侧边栏顶部「NAS 发布目录」选中的文件夹必须与下方「本机路径」输入框的 Windows 绝对路径**完全一致**（例如上面选 `麦田工程`，下面填 `Y:\AI励志\最终定稿\麦田工程`）。
5. **网络与 DNS 排查（抖音上传页超时）**：
   如果 `creator.douyin.com/creator-micro/content/upload` 长期空白转圈（>60s）：
   - 用 `nslookup creator.douyin.com` 检查 DNS 是否被 Tailscale MagicDNS（`fd7a:115c:a1e0::53`）劫持；
   - 若是，关闭 Tailscale 的「Use Tailscale DNS settings」，并确保代理处于 Rule（规则）模式、国内创作平台走 `DIRECT`。

---

## 四、标准发布流水线命令

```powershell
# 1. 生成并校验 publish.json（在 mdldm-maitian-publisher 下）
node tools/make-publish.mjs "<工程目录>\发布素材.md" "<工程目录>" --require <账号标签>
node tools/validate.mjs "<工程目录>"

# 2. 登记并执行分发（在 mdldm-maitian 下）
node src/hub.mjs plan "<工程目录>"
node src/hub.mjs run "<工程目录>" --only douyin,xhs,channels,kuaishou

# 3. 查看状态 / 取链接 / 采数据
node src/hub.mjs status --logs
node src/hub.mjs sync <episode_id>
node src/hub.mjs followers
```
