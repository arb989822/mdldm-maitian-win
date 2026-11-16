# 麦田（Maitian）Windows 一键初始化脚本
$ErrorActionPreference = "Stop"
$Base = Split-Path -Parent $PSScriptRoot
New-Item -ItemType Directory -Force -Path (Join-Path $Base "data") | Out-Null

$NodeVer = (node -v).TrimStart("v").Split(".")
if ([int]$NodeVer[0] -lt 22 -or ([int]$NodeVer[0] -eq 22 -and [int]$NodeVer[1] -lt 5)) {
  Write-Error "需要 Node.js >= 22.5，当前为 $(node -v)"
}

$CfgPath = Join-Path $Base "config.json"
if (-not (Test-Path $CfgPath)) {
  $Ex = Get-Content (Join-Path $Base "config.example.json") -Raw | ConvertFrom-Json
  $PubDir = Join-Path (Split-Path -Parent $Base) "mdldm-maitian-publisher"
  $Key = -join ((48..57 + 65..90 + 97..122) | Get-Random -Count 16 | ForEach-Object {[char]$_})
  $Ex.pluginDir = $PubDir
  $Ex.driver = "plugin"
  $Ex.rootPath = Join-Path $env:USERPROFILE "Movies\发布工程"
  $Ex.chromeProfile = Join-Path $Base "chrome-profile"
  $Ex.batches = @(@("bilibili","douyin"), @("xhs","channels","kuaishou"), @("youtube"), @("instagram"))
  $Ex.manual = @("bilibili","douyin","xhs","channels","kuaishou")
  $Ex.web = @{ port = 8787; key = $Key }
  $Ex.PSObject.Properties.Remove("nasUrl")
  $Ex.PSObject.Properties.Remove("feishuWebhook")
  $Ex.PSObject.Properties.Remove("xHandle")
  $Ex.PSObject.Properties.Remove("site")
  $Ex.PSObject.Properties.Remove("board")
  New-Item -ItemType Directory -Force -Path $Ex.rootPath | Out-Null
  $Ex | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 $CfgPath
  Write-Host "已生成 config.json，网页访问：http://localhost:8787/?key=$Key"
} else {
  Write-Host "已存在 config.json，跳过生成。"
}

Write-Host "`n下一步："
Write-Host "1. 在 Chrome 打开 chrome://extensions 加载 mdldm-maitian-publisher，并把扩展 ID 填入 config.json 的 extensionId。"
Write-Host "2. 运行 node src/hub.mjs login 登录各平台。"
Write-Host "3. 运行 node src/hub.mjs web（或注册为 Windows 计划任务常驻）。"
