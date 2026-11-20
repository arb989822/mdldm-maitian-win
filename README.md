# 麦田（Maitian）· Windows 专用适配版

> **致 AI Agent（Antigravity / Claude Code / Codex / Cursor）与使用者**：
> 本仓库是 **Windows 10/11 专用修改版**（基于原版 macOS 项目深度适配 Windows 路径、Chrome 调试桥接、计划任务后台常驻，并新增 **快手** 平台与各平台最优封面自动选择）。
> - **麦田中控（本仓库）**：`https://github.com/arb989822/mdldm-maitian-win`
> - **麦田发布助手（Chrome 插件 Windows 版）**：`https://github.com/arb989822/mdldm-maitian-publisher-win`
> - **AI Agent 详细部署与排障手册**：请优先阅读本仓库根目录的 **[AGENTS.md](./AGENTS.md)**。
> - ⚠️ **切勿执行原版 `CzzzzzzJ` 的 `install.sh` 或克隆 `CzzzzzzJ` 仓库**，否则会拉取未修改的 macOS 版代码与旧配置。

---

## 一、Windows 一键安装（PowerShell）

在 Windows PowerShell 中直接执行以下命令（要求已安装 **Node.js >= 22.5**、**Git**、**Google Chrome**）：

```powershell
$dir = "$env:USERPROFILE\maitian"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Set-Location $dir
git clone https://github.com/arb989822/mdldm-maitian-win.git mdldm-maitian
git clone https://github.com/arb989822/mdldm-maitian-publisher-win.git mdldm-maitian-publisher
Set-Location "$dir\mdldm-maitian"
powershell -ExecutionPolicy Bypass -File scripts/install-win.ps1
```

如果使用 Git Bash，也可运行：
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/arb989822/mdldm-maitian-win/main/scripts/install.sh)"
```

---

## 二、安装后必做的 3 步配置

1. **在 Chrome 加载插件**：
   - 打开 `chrome://extensions` → 开启右上角「开发者模式」→「加载已解压的扩展程序」→ 选择 `%USERPROFILE%\maitian\mdldm-maitian-publisher`。
   - 复制扩展卡片上的 **32 位扩展 ID**，填入 `%USERPROFILE%\maitian\mdldm-maitian\config.json` 的 `"extensionId"` 字段。
2. **确认 `config.json` 关键配置（必须使用 `"driver": "plugin"`）**：
   - `"driver": "plugin"`
   - `"pluginDir": "C:\\Users\\<用户名>\\maitian\\mdldm-maitian-publisher"`
   - `"extensionId": "<32位Chrome扩展ID>"`
   - `"rootPath": "<你的发布工程根目录，如 Y:\\AI励志\\最终定稿\\麦田工程>"`
   - `"batches": [["bilibili", "douyin"], ["xhs", "channels", "kuaishou"], ["youtube"], ["instagram"]]`
   - `"manual": ["bilibili", "douyin", "xhs", "channels", "kuaishou"]`
3. **登录各平台与启动网页大屏**：
   ```powershell
   cd "$env:USERPROFILE\maitian\mdldm-maitian"
   node src/hub.mjs login   # 弹出专用 Chrome，扫码登录抖音/小红书/视频号/快手等
   node src/hub.mjs web     # 启动 http://localhost:8787 控制台（建议按 AGENTS.md 注册为 Windows 计划任务常驻）
   ```

---

## 三、Windows 版相比原版的全部改动

1. **Windows 全面兼容**：
   - 修复 `driver.mjs`、`make-publish.mjs` 在 Windows 下动态 `import()` 报 `Received protocol 'c:'` 的问题（统一改用 `pathToFileURL`）；
   - 修复 `hub.mjs`、`tunnel.mjs` 中 `new URL(import.meta.url).pathname` 在 Windows 下多出前导 `/` 的问题（统一改用 `fileURLToPath`）；
   - 修复 `chrome-shim.mjs` 在 Windows 下自动定位 `chrome.exe`，`bridge.mjs` 用 `cmd /c start` 替代 macOS `open`，`hub.mjs` 屏蔽 macOS `/Volumes` 与 `diskutil`；
   - 修复 `web.mjs` `/cover` 与 `/shot` 在 Windows 下盘符大小写校验导致 404 的问题；
   - 修复 `video.js` 盘符路径校验与目录层级自动补齐/去重，`publish.js` 反斜杠路径拼接与前台标签页预检（防止 Chrome 后台标签页节流超时）。
2. **新增快手（`kuaishou`）支持与大屏展示**：
   - 网页大屏（`board.html` / `mt.js` / `web.mjs` / `db.mjs` / `hub.mjs`）已将原 `X` 替换为 **快手（`kuaishou`）**，大屏轮询间隔优化为 **15 秒**；
   - 插件端新增 `lib/platforms/kuaishou.js`、`extra.js`、`extra-specs.js`、`tools/make-publish.local.mjs`，支持快手自动上传视频、填描述与话题、设定时、上传并确认 **`9:16` 封面**。
3. **各平台最优封面自动选择与防错位**：
   - **小红书（`xhs`）**：自动选 `3:4`；
   - **抖音（`douyin`）**：自动选 `4:3 + 3:4`，并显式切换「设置横封面 / 设置竖封面」页签防止互相覆盖；
   - **视频号（`channels`）**：自动选 `3:4 + 4:3`，并修复微信 `weui-desktop-picker` 时间面板展开与时/分滚动点选；
   - **快手（`kuaishou`）**：自动优先选 `9:16`（无则回退 `3:4`）。

完整技术细节与排障指南请查阅 **[AGENTS.md](./AGENTS.md)**。
