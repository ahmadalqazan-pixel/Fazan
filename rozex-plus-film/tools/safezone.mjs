// Reels safe-zone check: no on-page text may enter the bottom 340 px or right 150 px of the frame while on screen.
// Frames during camera gestures (text sweeping through) are reported separately from frames at rest.
// usage (from $LIB): node <project>/tools/safezone.mjs <project>
import path from 'path';
const LIB = process.env.LIB || '/root/lemo-opuscar';
const { openDemo, closeServer } = await import(LIB + '/core/render/page.mjs');
const DIR = path.resolve(process.argv[2]);
const { browser: b, page: p } = await openDemo(DIR, { w: 1080, h: 1920, gl: false });
const res = await p.evaluate(() => { const out = []; for (let t = 0; t <= window.DUR; t += 0.04) { const c0 = window.CAMAT(t), c1 = window.CAMAT(t + 0.04);
  const moving = Math.abs(c1.x - c0.x) + Math.abs(c1.y - c0.y) > 0.6 || Math.abs(Math.log(c1.z / c0.z)) > 0.002;
  for (const b of window.TEXTS(t)) { const vis = b.x1 > 0 && b.x0 < 1080 && b.y1 > 0 && b.y0 < 1920; if (!vis) continue;
    if (b.x1 > 930 || b.y1 > 1580) out.push({ t: +t.toFixed(2), moving, text: b.text, x1: Math.round(b.x1), y1: Math.round(b.y1) }); } } return out; });
const rest = res.filter(r => !r.moving), mov = res.filter(r => r.moving);
const sum = a => { const m = {}; for (const r of a) (m[r.text] ??= []).push(r.t); return Object.entries(m).map(([k, v]) => `${k}: ${v[0]}–${v[v.length - 1]} s (${v.length} steps)`); };
console.log('at rest:', rest.length ? '\n  ' + sum(rest).join('\n  ') : 'none');
console.log('during gestures:', mov.length ? '\n  ' + sum(mov).join('\n  ') : 'none');
await b.close(); closeServer(); process.exit(rest.length ? 1 : 0);
