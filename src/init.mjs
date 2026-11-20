// 安装向导（Windows 适配版）：检查环境 → 问几个问题 → 生成 config.json
//   node src/init.mjs
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CFG = path.join(ROOT, 'config.json');
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });

const rl = readline.createInterface({ input: process.stdin, terminal: process.stdin.isTTY });
const lines = [], waiters = []; let closed = false;
rl.on('line', (l) => { const w = waiters.shift(); w ? w(l) : lines.push(l); });
rl.on('close', () => { closed = true; while (waiters.length) waiters.shift()(''); });
const readLine = () => lines.length ? Promise.resolve(lines.shift()) : closed ? Promise.resolve('') : new Promise(r => waiters.push(r));
const prompt = async (q) => { process.stdout.write(q); const l = await readLine(); if (!process.stdin.isTTY) process.stdout.write(l + '\n'); return l; };
const ask = async (q, def = '') => (await prompt(`${q}${def ? `（回车用：${def}）` : ''}\n> `)).trim() || def;
const yes = async (q, def = true) => { def = def && !!process.stdin.isTTY; const a = (await prompt(`${q} ${def ? '[Y/n]' : '[y/N]'} `)).trim() || (def ? 'y' : 'n'); return /^(y|yes|是|好)$/i.test(a); };
const ok = (t) => console.log(`  ✅ ${t}`), bad = (t) => console.log(`  ❌ ${t}`), tip = (t) => console.log(`  ·  ${t}`);
const home = (p) => p.replace(/^~(?=[\\/]|$)/, os.homedir());

console.log('\n麦田（Windows 专用版）· 安装向导\n');
console.log('一、检查环境');
const [maj, min] = process.versions.node.split('.').map(Number);
if (maj > 22 || (maj === 22 && min >= 5)) ok(`Node.js ${process.versions.node}`); else { bad(`Node.js ${process.versions.node}，需要 22.5 以上（用到内置 node:sqlite）`); process.exit(1); }

const chromeCandidates = process.platform === 'win32'
  ? ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')]
  : ['/Applications/Google Chrome.app', path.join(os.homedir(), 'Applications/Google Chrome.app')];
const chrome = chromeCandidates.find(fs.existsSync);
chrome ? ok(`Google Chrome (${chrome})`) : bad('没找到 Google Chrome，请先安装');

if (fs.existsSync(CFG) && !(await yes('\n已经有 config.json，要重新生成吗？（旧的会备份成 config.json.bak）', false))) {
  console.log('\n保留现有配置。'); rl.close(); process.exit(0);
}

console.log('\n二、配置项（直接回车使用默认值，之后可随时改 config.json）');
const ex = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.example.json'), 'utf8'));
const cfg = { ...ex };
const guess = ['../mdldm-maitian-publisher', '../mdldm-maitian-publisher-win', '~/maitian/mdldm-maitian-publisher'].map(p => path.resolve(ROOT, home(p))).find(p => fs.existsSync(path.join(p, 'lib/publish.js')));
let plugin = home(await ask('1. 麦田发布助手（插件仓库）目录在哪？（没装的话先 git clone https://github.com/arb989822/mdldm-maitian-publisher-win.git mdldm-maitian-publisher）', guess || path.resolve(ROOT, '../mdldm-maitian-publisher')));
fs.existsSync(path.join(plugin, 'lib/publish.js')) ? ok('找到插件仓库') : bad('这个目录里没有 lib/publish.js；请检查路径');
cfg.pluginDir = plugin;
cfg.driver = 'plugin';
const extId = await ask('2. Chrome 扩展 ID（在 chrome://extensions 加载 mdldm-maitian-publisher 后看到的 32 位 ID；稍后填也可回车）', '');
if (extId) cfg.extensionId = extId; else delete cfg.extensionId;
cfg.rootPath = home(await ask('3. 发布工程放在哪个文件夹？（每期一个子目录，里面有成片.mp4、封面/、publish.json）', path.join(os.homedir(), 'Movies', '发布工程')));
fs.mkdirSync(cfg.rootPath, { recursive: true });
const hook = await ask('4. 飞书群机器人的 Webhook 地址（可选，不用就回车）');
if (hook) cfg.feishuWebhook = hook; else delete cfg.feishuWebhook;
cfg.web = { port: +(await ask('5. 麦田网页用哪个端口？', '8787')), key: crypto.randomBytes(12).toString('base64url') };
cfg.chromeProfile = path.join(ROOT, 'chrome-profile');

if (fs.existsSync(CFG)) fs.copyFileSync(CFG, CFG + '.bak');
fs.writeFileSync(CFG, JSON.stringify(cfg, null, 2) + '\n');
ok(`已写入 config.json（网页口令：${cfg.web.key}）`);

if (chrome && await yes('现在打开专用 Chrome 和各平台页面去登录？（每个平台扫码或登录一次）')) {
  spawnSync(process.execPath, [path.join(ROOT, 'src/hub.mjs'), 'login'], { stdio: 'inherit' });
}
console.log(`
完成。接下来：
  · 启动网页控制台：node src/hub.mjs web
  · 打开 http://localhost:${cfg.web.port}/?key=${cfg.web.key}
  · 准备发布工程并运行：node src/hub.mjs plan <工程目录> && node src/hub.mjs run <工程目录>
`);
rl.close();
