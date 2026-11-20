#!/bin/bash
# 麦田（Windows 适配版）一行安装（Git Bash / WSL）：
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/arb989822/mdldm-maitian-win/main/scripts/install.sh)"
# Windows PowerShell 推荐直接运行 scripts/install-win.ps1
set -e
DIR=${MAITIAN_HOME:-$HOME/maitian}
say() { echo; echo "== $1"; }

say "麦田（Windows 适配版）· 一行安装（装到 $DIR）"
command -v git >/dev/null || { echo "需要 git：请先安装 Git for Windows"; exit 1; }
if ! command -v node >/dev/null; then echo "需要 Node.js 22.5 以上：请去 https://nodejs.org 下载"; exit 1; fi
node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=5)?0:1)' || { echo "Node.js 版本是 $(node -v)，需要 22.5 以上"; exit 1; }

mkdir -p "$DIR"; cd "$DIR"
for PAIR in "mdldm-maitian:mdldm-maitian-win" "mdldm-maitian-publisher:mdldm-maitian-publisher-win"; do
  R="${PAIR%%:*}"
  REPO="${PAIR##*:}"
  if [ -d "$R/.git" ]; then say "更新 $R"; git -C "$R" pull --ff-only -q; else say "下载 $R (from arb989822/$REPO)"; for i in 1 2 3; do git clone "https://github.com/arb989822/$REPO.git" "$R" && break; echo "下载失败，第 $i 次重试"; rm -rf "$R"; sleep 3; done; [ -d "$R/.git" ] || { echo "$R 下载失败，检查网络后重跑这条命令"; exit 1; }; fi
done

mkdir -p "$DIR/mdldm-maitian/data"

say "麦田发布助手（Chrome 插件）"
echo "Chrome 打开 chrome://extensions → 打开右上角「开发者模式」→「加载已解压的扩展程序」→ 选 $DIR/mdldm-maitian-publisher"

say "发布 skill"
L="$HOME/.claude/skills/maitian-publish"
if [ -e "$L" ] || [ -L "$L" ]; then echo "~/.claude/skills/maitian-publish 已经存在，没动它"
elif [ -d "$HOME/.claude/skills" ]; then cp -r "$DIR/mdldm-maitian/skills/maitian-publish" "$L"; echo "已复制到 ~/.claude/skills/maitian-publish"
else echo "没找到 ~/.claude/skills；用 Claude Code 的话，把 $DIR/mdldm-maitian/skills/maitian-publish 放进 ~/.claude/skills/"; fi

say "安装向导"
[ -t 0 ] || { echo "安装向导需要在终端里交互：cd $DIR/mdldm-maitian && node src/init.mjs（或运行 powershell -ExecutionPolicy Bypass -File scripts/install-win.ps1）"; exit 0; }
cd "$DIR/mdldm-maitian" && node src/init.mjs
