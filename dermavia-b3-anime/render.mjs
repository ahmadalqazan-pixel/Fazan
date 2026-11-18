// Playwright frame capture + ffmpeg (H.264, yuv420p). Usage: node render.mjs <abs index.html> <out.mp4> [W H FPS]
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const [,, html, out, W = 1080, H = 1920, FPS = 24] = process.argv;
fs.rmSync('frames', { recursive: true, force: true }); fs.mkdirSync('frames', { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +W, height: +H } });
await p.goto('file://' + html + '?render=1');
await p.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
const dur = await p.evaluate(() => window.DURATION);
const n = Math.round(dur * FPS);
for (let i = 0; i < n; i++) {
  await p.evaluate(t => window.seek(t), i / FPS);
  await p.screenshot({ path: `frames/${String(i).padStart(5, '0')}.png` });
}
await b.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', 'frames/%05d.png',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
console.log('wrote', out, n, 'frames');
