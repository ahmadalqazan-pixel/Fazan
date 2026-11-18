// Reels safe-zone check: text meant to be read must stay out of the bottom 20 % (y > 1536) and the right 12 % (x > 950)
// of the 1080×1920 frame, and at least 5 % inside the other edges. usage (from $LIB): node <project>/tools/safezone.mjs <project>
import path from 'path';
const LIB = process.env.LIB || '/root/lemo-opuscar';
const { openDemo, closeServer } = await import(LIB + '/core/render/page.mjs');
const DIR = path.resolve(process.argv[2]);
const { browser: b, page: p } = await openDemo(DIR, { w: 1080, h: 1920, gl: true });
const res = await p.evaluate(() => { const out = []; for (let t = 0; t <= window.DUR; t += 0.1) { window.render(t);
  for (const b of window.TEXTS(t)) { const vis = b.x1 > 0 && b.x0 < 1080 && b.y1 > 0 && b.y0 < 1920; if (!vis) continue;
    if (b.x1 > 950 || b.y1 > 1536 || b.x0 < 54 || b.y0 < 96) out.push({ t: +t.toFixed(2), text: b.text, box: [b.x0, b.y0, b.x1, b.y1].map(Math.round) }); } } return out; });
const m = {}; for (const r of res) (m[r.text] ??= []).push(r);
for (const [k, v] of Object.entries(m)) console.log(`${k}: ${v[0].t}–${v[v.length - 1].t} s (${v.length} steps) e.g. box ${v[0].box}`);
console.log(res.length ? 'safe zone: see above' : 'safe zone ok');
await b.close(); closeServer(); process.exit(res.length ? 1 : 0);
