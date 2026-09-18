#!/usr/bin/env node
/*
 * MusicLab 自动化检查（npm test）
 *  1. 静态检查：所有 HTML 里的本地链接 / 资源 / 锚点是否存在，搜索索引的目标是否存在
 *  2. 运行时检查：用本机 Chrome / Edge 无头模式打开每个页面，收集控制台错误
 *  3. 交互检查：注册登录、章节小测计入进度、游乐园总控与存档、四轨示例
 *
 * 只依赖 Node 内置模块 + 本机已安装的 Chrome 或 Edge，不需要 npm install。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const failures = [];
const notes = [];
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => { failures.push(msg); console.log(`  ✗ ${msg}`); };

/* ---------------- 1. 静态检查 ---------------- */
console.log('\n[1/3] 静态检查');
const htmlFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'tests') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
})(ROOT);

let linkProblems = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (/^(https?:|mailto:|data:|javascript:|#)/.test(raw) || !raw) continue;
    const [target, hash] = raw.split('#');
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
    if (!fs.existsSync(resolved)) { fail(`${path.relative(ROOT, file)} → 缺少文件 ${raw}`); linkProblems += 1; continue; }
    if (hash && resolved.endsWith('.html')) {
      const targetHtml = resolved === file ? html : fs.readFileSync(resolved, 'utf8');
      if (!new RegExp(`id="${hash}"`).test(targetHtml)) { fail(`${path.relative(ROOT, file)} → 缺少锚点 ${raw}`); linkProblems += 1; }
    }
  }
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    if (!ids.has(m[1]) && m[1] !== 'OpenQA') { fail(`${path.relative(ROOT, file)} → 页内锚点 #${m[1]} 不存在`); linkProblems += 1; }
  }
}
if (!linkProblems) ok(`${htmlFiles.length} 个页面的链接与锚点全部有效`);

// 搜索索引
const uiSource = fs.readFileSync(path.join(ROOT, 'js/musiclab-ui.js'), 'utf8');
let indexProblems = 0;
for (const m of uiSource.matchAll(/href: '([^']+)'/g)) {
  const [target, hash] = m[1].split('#');
  if (!target) continue;
  const resolved = path.join(ROOT, target);
  if (!fs.existsSync(resolved)) { fail(`搜索索引指向缺失页面 ${m[1]}`); indexProblems += 1; continue; }
  if (hash && !new RegExp(`id="${hash}"`).test(fs.readFileSync(resolved, 'utf8'))) { fail(`搜索索引指向缺失锚点 ${m[1]}`); indexProblems += 1; }
}
if (!indexProblems) ok('站内搜索索引目标全部存在');

// 每个页面都应引入共享层
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  if (!html.includes('musiclab-ui.js')) fail(`${rel} 未引入 js/musiclab-ui.js`);
  if (!html.includes('css/ui.css')) fail(`${rel} 未引入 css/ui.css`);
  if (!/<html lang="zh-CN">/.test(html)) notes.push(`${rel} 的 <html lang> 不是 zh-CN`);
}

/* ---------------- 2/3. 无头浏览器 ---------------- */
const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);
const browser = candidates.find((p) => fs.existsSync(p));

const PAGES = [
  'index.html', 'login/login.html', 'login/registration.html', 'login/terms.html', 'settings/settings.html', 'contact/contact.html',
  'introduction/intro.html', 'introduction/Aaron.html', 'introduction/Abdulkadir.html', 'introduction/Heak.html', 'introduction/Omar.html',
  'Start Learning/index.html', 'Start Learning/pitches.html', 'Start Learning/beat.html', 'Start Learning/beat-instruments.html',
  'Start Learning/beat-track.html', 'Start Learning/chords.html', 'Start Learning/chords-intervals.html', 'Start Learning/chords-chords.html',
  'Start Learning/chords-track.html', 'Start Learning/tones.html', 'Start Learning/others.html',
  'The Playground/index.html'
];

const fileURL = (rel) => 'file:///' + path.join(ROOT, rel).replace(/\\/g, '/').split('/').map((seg, i) => (i === 0 ? seg : encodeURIComponent(seg))).join('/');

const runHeadless = (url, extraArgs = [], timeout = 60000) => {
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files',
    '--autoplay-policy=no-user-gesture-required', '--enable-logging=stderr', '--v=0', '--virtual-time-budget=6000',
    '--window-size=1300,900', ...extraArgs, '--dump-dom', url];
  const result = spawnSync(browser, args, { encoding: 'utf8', timeout, maxBuffer: 64 * 1024 * 1024 });
  const consoleLines = (result.stderr || '').split('\n').filter((l) => /INFO:CONSOLE/.test(l));
  const errors = consoleLines.filter((l) => /Uncaught|TypeError|ReferenceError|SyntaxError|Failed to load resource|is not defined/.test(l));
  return { dom: result.stdout || '', errors, consoleLines };
};

if (!browser) {
  console.log('\n[2/3] 跳过：未找到 Chrome / Edge（可用 CHROME_PATH 指定）');
} else {
  console.log(`\n[2/3] 页面控制台检查（${path.basename(browser)}）`);
  for (const page of PAGES) {
    const { errors } = runHeadless(fileURL(page));
    if (errors.length) fail(`${page}: ${errors[0].replace(/^.*CONSOLE[^"]*/, '').slice(0, 160)}`);
    else ok(page);
  }

  /* 交互检查：把用例页写到临时目录，用 iframe 驱动真实页面 */
  console.log('\n[3/3] 交互检查');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'musiclab-test-'));
  const harness = fs.readFileSync(path.join(__dirname, 'harness.html'), 'utf8').replace(/__ROOT__/g, fileURL('').replace(/\/$/, ''));
  const harnessPath = path.join(tmp, 'harness.html');
  fs.writeFileSync(harnessPath, harness);
  const { dom, errors } = runHeadless('file:///' + harnessPath.replace(/\\/g, '/'), ['--virtual-time-budget=20000'], 120000);
  const match = dom.match(/<pre id="results">([\s\S]*?)<\/pre>/);
  if (!match) fail('交互用例没有产出结果（harness 未完成）');
  else {
    const lines = match[1].trim().split('\n').map((l) => l.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&'));
    for (const line of lines) {
      if (line.startsWith('PASS ')) ok(line.slice(5));
      else if (line.startsWith('FAIL ')) fail(line.slice(5));
      else if (line.trim()) notes.push(line);
    }
  }
  if (errors.length) notes.push(`harness 控制台：${errors[0].slice(0, 160)}`);
  fs.rmSync(tmp, { recursive: true, force: true });
}

/* ---------------- 汇总 ---------------- */
if (notes.length) { console.log('\n备注：'); notes.forEach((n) => console.log(`  · ${n}`)); }
console.log(failures.length ? `\n✗ ${failures.length} 项失败` : '\n✓ 全部通过');
process.exit(failures.length ? 1 : 0);
