// Capture every slide of the presentation, fully revealed, as high-resolution PNGs.
// usage: node capture.mjs <outDir> [scale]
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const out = path.resolve(process.argv[2]); const SCALE = +(process.argv[3] || 2);
fs.mkdirSync(out, { recursive: true });
const p = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=9343', '--allow-file-access-from-files',
  '--autoplay-policy=no-user-gesture-required', `--user-data-dir=${path.join(out, '_prof')}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms)); let ws;
for (let i = 0; i < 60; i++) { try { const j = await (await fetch('http://127.0.0.1:9343/json')).json(); const pg = j.find(x => x.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break } } catch (e) { } await sleep(200) }
const s = new WebSocket(ws); await new Promise(r => s.onopen = r); let id = 0; const pend = new Map();
s.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id) } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); s.send(JSON.stringify({ id: i, method, params })) });
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.result?.value;

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: SCALE, mobile: false });
const file = path.join(here, '..', 'index.html');
await send('Page.navigate', { url: 'file:///' + path.resolve(file).split(path.sep).join('/') + '#1' }); await sleep(3000);
await ev('document.fonts.ready.then(()=>1)');
const n = await ev('document.querySelectorAll(".slide").length');
console.log('slides', n);
const mode = process.argv[4] || 'shot';
if (mode === 'probe') { console.log(await ev(`[...document.body.children].map(e=>e.tagName+'#'+e.id+'.'+e.className).join(' | ')`)); }
const key = async () => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37, nativeVirtualKeyCode: 37 }); };
// the myths slide (10) hides its statements once revealed, so it also gets a page at its first step
const plan = [];
for (let i = 0; i < n; i++) { if (i === 9) plan.push([i, 0, '-0']); plan.push([i, null, '']); }
for (const [i, upto, suffix] of plan) {
  await send('Page.navigate', { url: 'file:///' + path.resolve(file).split(path.sep).join('/') + '#' + (i + 1) }); await sleep(2200);
  await send('Page.reload', {}); await sleep(2600); await ev('document.fonts.ready.then(()=>1)');
  const all = await ev(`+(document.querySelector('.slide.active')?.dataset.steps||0)`);
  const steps = upto === null ? all : upto;
  for (let k = 0; k < steps; k++) { await key(); await sleep(900); }
  await ev(`document.querySelector('#notes')?.classList.remove('open'); document.querySelector('#toast')?.remove(); const st=document.createElement('style'); st.textContent='.track,.ctrl{visibility:hidden!important}'; document.head.appendChild(st); 1`);
  await sleep(3500);
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1600, height: 900, scale: 1 } });
  fs.writeFileSync(path.join(out, `slide-${String(i + 1).padStart(2, '0')}${suffix}.png`), Buffer.from(shot.result.data, 'base64'));
  console.log('slide', i + 1, steps, await ev(`document.querySelector('.slide.active')?.dataset.title||''`));
}
s.close(); p.kill();
