// Dermavia B3 serum — anime cel film, 1080×1920, 20 s. Every frame is a pure function of t.
// Shot list: SHOT_SHEET.md. Palette is fixed there; shades below are the same hues, darker/lighter only.
import { clamp, lerp, seg, ss, eo, ei, eio, mulberry } from '/core/lib.js';

const W = 1080, H = 1920;
const P = {
  night: '#0E1420', skin: '#D8A47F', accent: '#2FA062', navy: '#212C51', light: '#F7F5F0', shadow: '#2A1E2E',
  // derived tones (same hues)
  skinSh: '#B9845F', skinHi: '#E9C2A2', hair: '#17131C', line: '#2A1E2E', coatSh: '#D9DCE3', navySh: '#18203D', accentHi: '#7FD3A2',
};
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const loadImg = s => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => j(new Error(s)); i.src = s; });
const PACK = await loadImg('assets/serum_packshot.png'); await PACK.decode();
await Promise.all(['700 60px AR', '500 40px AR', '500 40px BC'].map(f => document.fonts.load(f, 'الجلد الميت B3 0774')));

// ---------------------------------------------------------------- timing helpers
const on2 = t => Math.floor(t * 12) / 12, on3 = t => Math.floor(t * 8) / 8;
const blink = (t, every = 2.7, off = 0) => { const u = (t + off) % every; return u > every - 0.125 ? 1 : 0; }; // 3 frames closed
const sway = (t, per = 2.2, amp = 1) => Math.sin(t * 2 * Math.PI / per) * amp;

// ---------------------------------------------------------------- grain (seeded, 8 fixed tiles)
const GR = []; { const r = mulberry(7); for (let k = 0; k < 8; k++) { const c = document.createElement('canvas'); c.width = 270; c.height = 480; const g = c.getContext('2d'), d = g.createImageData(270, 480);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() - 0.5) * 70; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); GR.push(c); } }
function grade(t, tint, op = 0.16, mode = 'soft-light') {
  if (tint) { ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha = op; ctx.fillStyle = tint; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(GR[Math.floor(t * 24) % 8], 0, 0, W, H); ctx.restore();
}

// ---------------------------------------------------------------- drawing kit
function path(pts, fill, stroke, lw = 3, close = true) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 4) ctx.quadraticCurveTo(p[0], p[1], p[2], p[3]); else ctx.lineTo(p[0], p[1]); }
  if (close) ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
}
function card(s, y, a = 1, size = 64, color = P.light) {      // Arabic title card on a navy plate, RTL
  if (a <= 0.01) return;
  ctx.save(); ctx.font = `700 ${size}px AR`; ctx.direction = 'rtl'; ctx.textAlign = 'center';
  const w = ctx.measureText(s).width + 70, h = size * 1.6;
  ctx.globalAlpha = a; ctx.fillStyle = P.navy; ctx.beginPath(); ctx.roundRect(540 - w / 2, y - h / 2, w, h, 18); ctx.fill();
  ctx.fillStyle = P.accent; ctx.fillRect(540 + w / 2 - 12, y - h / 2 + 14, 6, h - 28);
  ctx.fillStyle = color; ctx.fillText(s, 540, y + size * 0.36); ctx.restore();
}

// ================================================================ SHOT 1 · ECU nose in the mirror (0–1.5)
function shot1(t) {
  const z = lerp(1.0, 1.08, t / 1.5);                            // PUSH IN (camera on ones)
  ctx.save(); ctx.fillStyle = '#1B2236'; ctx.fillRect(0, 0, W, H);
  ctx.translate(540, 900); ctx.scale(z, z); ctx.translate(-540, -900);
  // BG: bathroom tiles in the mirror
  ctx.strokeStyle = 'rgba(247,245,240,0.08)'; ctx.lineWidth = 3;
  for (let y = 0; y < H; y += 150) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  // CHAR: CU of the young man's face in the mirror — eyes at the top, the nose in the middle (the subject)
  ctx.fillStyle = P.skin; ctx.fillRect(-50, 150, W + 100, H);                                   // cheeks fill the frame
  path([[760, 150], [W + 60, 150], [W + 60, H], [800, H], [860, 1100, 760, 150]], P.skinSh);   // right cheek in shadow
  // hair fringe and brows
  path([[-50, 150], [W + 60, 150], [W + 60, 230], [800, 260], [700, 215], [560, 250], [420, 210], [280, 255], [-50, 230]], P.hair, P.line, 4);
  for (const s2 of [-1, 1]) path([[540 + s2 * 330, 345], [540 + s2 * 230, 300, 540 + s2 * 110, 330], [540 + s2 * 110, 350], [540 + s2 * 230, 330, 540 + s2 * 330, 370]], P.hair);
  // eyes (tired, looking down at the nose), blink on cue
  const bl = blink(t, 1.4, 0.2);
  for (const s2 of [-1, 1]) {
    const ex = 540 + s2 * 220, ey = 450;
    if (bl) { path([[ex - 80, ey], [ex, ey + 22, ex + 80, ey]], null, P.line, 7, false); continue; }
    path([[ex - 82, ey], [ex, ey - 46, ex + 82, ey], [ex, ey + 40, ex - 82, ey]], P.light);
    ctx.beginPath(); ctx.ellipse(ex - s2 * 6, ey + 6, 30, 34, 0, 0, 7); ctx.fillStyle = P.shadow; ctx.fill();
    ctx.fillStyle = P.light; ctx.beginPath(); ctx.arc(ex - s2 * 6 - 10, ey - 6, 9, 0, 7); ctx.fill();
    path([[ex - 86, ey + 2], [ex, ey - 50, ex + 86, ey - 6]], null, P.line, 9, false);
    path([[ex - 70, ey + 8], [ex, ey + 28, ex + 70, ey + 8]], P.skinSh);                    // heavy lower lid = tired
  }
  // nose: bridge, ball of the tip, the wings, nostrils — hard cel shading, light from the left
  path([[560, 420], [600, 760], [650, 980], [700, 1040], [640, 1050], [590, 820], [545, 430]], P.skinSh);   // bridge shadow
  path([[495, 430], [470, 820], [430, 990]], null, P.line, 4, false);
  path([[585, 430], [640, 900], [690, 1010]], null, P.line, 3, false);
  path([[400, 1040], [380, 980, 430, 950], [540, 900, 650, 950], [700, 980, 690, 1040], [700, 1110, 640, 1150], [540, 1185, 440, 1150], [380, 1110, 400, 1040]], P.skin, P.line, 4);  // tip ball
  path([[600, 930], [690, 980, 690, 1050], [680, 1120, 630, 1150], [600, 1100, 640, 1040], [640, 980, 600, 930]], P.skinSh);
  path([[470, 960], [520, 930, 570, 950], [520, 965, 470, 960]], P.skinHi);                 // oily shine on the tip
  path([[300, 1050], [270, 1160, 360, 1200], [440, 1205]], null, P.line, 5, false);          // left wing
  path([[780, 1050], [810, 1160, 720, 1200], [640, 1205]], null, P.line, 5, false);          // right wing
  path([[350, 1060], [300, 1150, 380, 1195], [430, 1180], [420, 1100]], P.skin);
  path([[730, 1060], [780, 1150, 700, 1195], [650, 1180], [660, 1100]], P.skinSh);
  path([[420, 1200], [460, 1170, 510, 1205], [470, 1225, 420, 1200]], P.shadow);            // nostrils
  path([[660, 1200], [620, 1170, 570, 1205], [610, 1225, 660, 1200]], P.shadow);
  path([[380, 1400], [540, 1440, 700, 1400]], null, P.line, 5, false);                       // upper lip line (low)
  // blackheads (seeded) on the tip and wings, a few on the bridge
  const r = mulberry(31);
  for (let i = 0; i < 70; i++) { const a2 = r() * Math.PI * 2, d = Math.sqrt(r()), x = 540 + Math.cos(a2) * d * 290, y = 1060 + Math.sin(a2) * d * 150 - (i % 7 === 0 ? 220 * r() : 0), rr = 2.5 + r() * 4.5;
    if (Math.hypot(x - 520, y - 950) < 45) continue;
    ctx.fillStyle = r() < 0.65 ? P.shadow : P.skinSh; ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill(); }
  ctx.restore();
  // FX: the bathroom light flickers (the one small motion)
  const fl = (Math.floor(t * 12) % 9 === 4) ? 0.12 : 0;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.18 + fl;
  const g = ctx.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, P.light); g.addColorStop(1, 'rgba(247,245,240,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 900); ctx.restore();
  // mirror frame edge
  ctx.fillStyle = P.night; ctx.fillRect(0, 0, 36, H); ctx.fillRect(W - 36, 0, 36, H);
  card('الرأس الأسود… من الجلد الميت', 680, ss(seg(t, 0.15, 0.35)), 58);
  grade(t, '#3A5A8A', 0.22);                                     // cold bathroom grade
}

// ================================================================ the pharmacist (resembles Ahmed)
function pharmacist(cx, cy, t, { turn = 0, smile = 0 } = {}) {
  const tt = on2(t), br = 1 + 0.008 * Math.sin(tt * 2 * Math.PI / 3);
  ctx.save(); ctx.translate(cx, cy + 260); ctx.scale(br, br); ctx.translate(-cx, -cy - 260);
  // body: navy shirt + white coat
  path([[cx - 300, 1500], [cx - 290, 900], [cx - 230, 830, cx - 70, 805], [cx + 70, 805], [cx + 230, 830, cx + 290, 900], [cx + 300, 1500]], P.light, P.line, 4);
  path([[cx + 120, 815], [cx + 230, 840, cx + 285, 900], [cx + 300, 1500], [cx + 150, 1500]], P.coatSh);           // coat shadow
  path([[cx - 75, 800], [cx, 960], [cx + 75, 800]], P.navy, P.line, 3);                                             // shirt V
  path([[cx - 75, 800], [cx - 30, 830], [cx, 960]], P.navySh);
  path([[cx - 75, 800], [cx - 120, 840], [cx - 40, 1060], [cx, 960]], P.light, P.line, 3);                          // lapels
  path([[cx + 75, 800], [cx + 120, 840], [cx + 40, 1060], [cx, 960]], P.coatSh, P.line, 3);
  ctx.fillStyle = P.accent; ctx.fillRect(cx + 150, 980, 70, 8);                                                     // pen in pocket (accent)
  // neck
  path([[cx - 55, 700], [cx - 55, 820], [cx, 850], [cx + 55, 820], [cx + 55, 700]], P.skinSh, P.line, 3);
  // head (turn shifts features a little, on twos)
  const tx = turn * 18;
  ctx.save(); ctx.translate(tx * 0.4, 0);
  // ears
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + s * 128, cy + 20, 20, 44, 0, 0, 7); ctx.fillStyle = s > 0 ? P.skinSh : P.skin; ctx.fill(); ctx.strokeStyle = P.line; ctx.lineWidth = 3; ctx.stroke(); }
  // face
  path([[cx - 120, cy - 120], [cx, cy - 178, cx + 120, cy - 120], [cx + 126, cy + 10], [cx + 116, cy + 110, cx + 60, cy + 165], [cx, cy + 196, cx - 60, cy + 165], [cx - 116, cy + 110, cx - 126, cy + 10]], P.skin, P.line, 4);
  path([[cx + 70, cy - 150], [cx + 120, cy - 120], [cx + 126, cy + 10], [cx + 116, cy + 110, cx + 60, cy + 165], [cx + 80, cy + 60, cx + 70, cy - 150]], P.skinSh);
  // hair: short dark top, low fade on the sides, slightly receding temples
  for (const s of [-1, 1]) {                                      // faded sides: hair tone over skin, partial
    ctx.save(); ctx.globalAlpha = 0.45; path([[cx + s * 124, cy - 110], [cx + s * 132, cy - 40], [cx + s * 128, cy + 20], [cx + s * 112, cy - 30], [cx + s * 108, cy - 100]], P.hair); ctx.restore();
  }
  path([[cx - 124, cy - 100], [cx - 132, cy - 150, cx - 90, cy - 200], [cx, cy - 232, cx + 90, cy - 200], [cx + 132, cy - 150, cx + 124, cy - 100],
    [cx + 106, cy - 112], [cx + 74, cy - 132], [cx + 34, cy - 126], [cx + tx * 0.2, cy - 140], [cx - 34, cy - 126], [cx - 74, cy - 132], [cx - 106, cy - 112]], P.hair, P.line, 3);
  for (let i = 0; i < 7; i++) {                                    // clumps on top, each sways
    const x = cx - 96 + i * 32, sw = sway(on3(t) + i * 0.3, 2.4, 3);
    path([[x - 22, cy - 196], [x + 4 + sw, cy - 244 - (i % 2) * 8], [x + 24, cy - 198]], P.hair, P.line, 2.5);
  }
  // brows
  for (const s of [-1, 1]) path([[cx + s * 98, cy - 44], [cx + s * 62, cy - 58, cx + s * 26, cy - 50], [cx + s * 26, cy - 40], [cx + s * 62, cy - 46, cx + s * 98, cy - 36]], P.hair);
  // eyes
  const bl = blink(t, 2.6, 0.4);
  for (const s of [-1, 1]) {
    const ex = cx + s * 60 + tx, ey = cy - 4;
    if (bl) { path([[ex - 30, ey + 4], [ex, ey + 12, ex + 30, ey + 4]], null, P.line, 5, false); continue; }
    path([[ex - 32, ey + 2], [ex, ey - 22, ex + 32, ey + 2], [ex, ey + 26, ex - 32, ey + 2]], P.light);
    ctx.beginPath(); ctx.ellipse(ex + s * 2, ey + 3, 14, 17, 0, 0, 7); ctx.fillStyle = P.shadow; ctx.fill();
    ctx.fillStyle = P.light; ctx.beginPath(); ctx.arc(ex + s * 2 - 5, ey - 4, 5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(ex + s * 2 + 5, ey + 8, 2.4, 0, 7); ctx.fill();
    path([[ex - 34, ey + 2], [ex, ey - 24, ex + 34, ey - 2]], null, P.line, 6, false);   // lash line
  }
  // glasses: black rectangular frames, small silver hinge accents
  ctx.save(); ctx.strokeStyle = P.night; ctx.lineWidth = 7;
  for (const s of [-1, 1]) { const ex = cx + s * 60 + tx; ctx.beginPath(); ctx.roundRect(ex - 50, cy - 36, 100, 70, 14); ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = P.light; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.moveTo(ex + s * 50, cy - 28); ctx.lineTo(cx + s * 126, cy - 18); ctx.stroke();
    ctx.fillStyle = P.coatSh; ctx.fillRect(ex + s * 50 - (s > 0 ? 0 : 14), cy - 34, 14, 6); }   // silver hinge
  ctx.beginPath(); ctx.moveTo(cx - 10 + tx, cy - 12); ctx.quadraticCurveTo(cx + tx, cy - 20, cx + 10 + tx, cy - 12); ctx.stroke(); ctx.restore();
  // nose
  path([[cx + 2 + tx, cy + 10], [cx + 14 + tx, cy + 62], [cx + 2 + tx, cy + 70]], null, P.line, 3, false);
  path([[cx + 4 + tx, cy + 14], [cx + 16 + tx, cy + 62], [cx + 4 + tx, cy + 68]], P.skinSh);
  // beard: full, trimmed, with mustache; mouth inside
  path([[cx - 126, cy + 6], [cx - 122, cy + 110], [cx - 64, cy + 182], [cx, cy + 212, cx + 64, cy + 182], [cx + 122, cy + 110], [cx + 126, cy + 6],
    [cx + 108, cy + 30], [cx + 96, cy + 70, cx + 52, cy + 84], [cx + 18, cy + 78], [cx + tx * 0.3, cy + 86], [cx - 18, cy + 78], [cx - 52, cy + 84], [cx - 96, cy + 70, cx - 108, cy + 30]], P.hair, P.line, 3);
  const sm = smile * 10;
  path([[cx - 30 + tx * 0.3, cy + 112 - sm * 0.4], [cx + tx * 0.3, cy + 122 + sm * 0.4, cx + 30 + tx * 0.3, cy + 112 - sm * 0.4], [cx + tx * 0.3, cy + 128 + sm, cx - 30 + tx * 0.3, cy + 112 - sm * 0.4]], '#7A4E44');
  ctx.restore(); ctx.restore();
}

// ================================================================ SHOT 3 · MS pharmacist behind the counter (3.5–5.5)
function shot3(t) {
  const pan = lerp(0, 1, eio(t / 2));                              // PAN R, three parallax layers (camera on ones)
  // BG: clinic wall, night→navy, soft window light
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.navy); g.addColorStop(1, P.night);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(-60 * pan, 0);
  ctx.globalAlpha = 0.18; ctx.fillStyle = P.light; ctx.fillRect(760, 160, 300, 520); ctx.globalAlpha = 1;
  ctx.restore();
  // MG: shelves with plain bottles (no brand marks)
  ctx.save(); ctx.translate(-150 * pan, 0);
  for (const y of [420, 640, 860]) { ctx.fillStyle = P.navySh; ctx.fillRect(-100, y, 1400, 18);
    for (let i = 0; i < 14; i++) { const x = -60 + i * 96, h = 70 + (i * 37) % 50; ctx.fillStyle = i % 4 === 0 ? P.accent : i % 2 ? P.light : P.coatSh;
      ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.roundRect(x, y - h, 50, h, 8); ctx.fill(); ctx.globalAlpha = 1; } }
  ctx.restore();
  // CHAR: head turn + smile on twos, after a short anticipation
  const tu = on2(t), turn = lerp(-1, 0.6, eo(seg(tu, 0.35, 0.9))) - 0.15 * Math.sin(Math.PI * seg(tu, 0.2, 0.4));
  pharmacist(540 - 30 * pan, 600, t, { turn, smile: eo(seg(tu, 0.8, 1.2)) });
  // FG: counter
  ctx.save(); ctx.translate(-260 * pan, 0);
  path([[-200, 1330], [1500, 1330], [1500, 1920], [-200, 1920]], P.light, P.line, 4);
  ctx.fillStyle = P.coatSh; ctx.fillRect(-200, 1360, 1700, 40); ctx.fillStyle = P.accent; ctx.fillRect(-200, 1330, 1700, 10);
  ctx.restore();
  card('من داخل عيادة ديرمافيا', 300, ss(seg(t, 0.2, 0.45)), 54);
  grade(t, '#F2C58A', 0.12);                                      // warm clinic light
}

// ================================================================ SHOT 5 ★ · the drop (7–10)
const WORDS = ['سالسليك', 'أزيليك', 'زنك', 'نياسيناميد'];
function shot5(t) {
  const T_FALL = 0.45, T_HIT = 0.8, T_DIP = 0.925, T_SHK = 1.05;
  const impact = t >= T_HIT && t < T_HIT + 0.125;                  // 3 frames, 2 colours only
  const dip = t >= T_DIP && t < T_DIP + 0.125;
  const shake = t >= T_SHK && t < T_SHK + 0.3 ? (1 - (t - T_SHK) / 0.3) : 0;
  const z = lerp(1, 1.12, eo(seg(t, 0, T_HIT)));                   // fast PUSH IN, on ones
  const r = mulberry(Math.floor(t * 24) + 3);
  ctx.save();
  if (shake) ctx.translate((r() - 0.5) * 28 * shake, (r() - 0.5) * 28 * shake);
  ctx.translate(540, 1100); ctx.scale(z, z); ctx.translate(-540, -1100);
  const bgc = impact ? P.light : P.night, ink = impact ? P.night : null;
  ctx.fillStyle = bgc; ctx.fillRect(-100, -100, W + 200, H + 200);
  if (!impact) { const g = ctx.createRadialGradient(540, 1150, 40, 540, 1150, 900); g.addColorStop(0, '#1C2A44'); g.addColorStop(1, P.night); ctx.fillStyle = g; ctx.fillRect(-100, -100, W + 200, H + 200); }
  // speed lines during the fall
  if (t > T_FALL && t < T_HIT + 0.3) { ctx.strokeStyle = impact ? P.night : 'rgba(247,245,240,0.35)'; ctx.lineWidth = 4;
    for (let i = 0; i < 14; i++) { const x = 300 + i * 34 + (r() - 0.5) * 20; ctx.beginPath(); ctx.moveTo(x, 200 + r() * 200); ctx.lineTo(x, 700 + r() * 300); ctx.stroke(); } }
  // pipette tip (generic glass) from the top
  path([[505, -50], [575, -50], [575, 360], [548, 430], [532, 430], [505, 360]], impact ? P.light : 'rgba(247,245,240,0.22)', ink || P.light, 4);
  // the fingertip from below
  path([[400, 1960], [410, 1300], [420, 1180, 540, 1160], [660, 1180, 670, 1300], [680, 1960]], impact ? P.night : P.skin, ink || P.line, 5);
  if (!impact) { path([[600, 1175], [660, 1180, 670, 1300], [680, 1960], [610, 1960], [630, 1400, 600, 1175]], P.skinSh); path([[470, 1250], [510, 1215, 550, 1222], [500, 1240, 470, 1250]], P.skinHi); }
  // the drop: swell (anticipation) → fall with smear → hit
  if (t < T_HIT) {
    const sw = eo(seg(t, 0, T_FALL)), fall = ei(seg(t, T_FALL, T_HIT));
    const y = lerp(450 + 30 * sw, 1150, fall), rr = 18 + 10 * sw;
    const v = t > T_FALL ? (1 / (T_HIT - T_FALL)) : 0, smear = t > T_FALL + 0.12 ? lerp(1, 2.6, fall) : 1;  // stretch along motion
    for (let k = 2; k >= 0; k--) {                                 // ghosts on the smear frames
      if (k && smear < 1.6) continue;
      ctx.save(); ctx.globalAlpha = k ? 0.25 / k : 1; ctx.translate(540, y - k * 70 * fall); ctx.scale(1 / Math.sqrt(smear), smear);
      ctx.beginPath(); ctx.moveTo(0, -rr * 1.4); ctx.quadraticCurveTo(rr, -rr * 0.2, rr, rr * 0.3); ctx.arc(0, rr * 0.3, rr, 0, Math.PI); ctx.quadraticCurveTo(-rr, -rr * 0.2, 0, -rr * 1.4);
      ctx.fillStyle = P.accentHi; ctx.fill(); ctx.strokeStyle = P.light; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = P.light; ctx.beginPath(); ctx.arc(-rr * 0.35, 0, rr * 0.22, 0, 7); ctx.fill(); ctx.restore();
    }
  }
  // impact: hard starburst in two colours
  if (impact) { ctx.fillStyle = P.night; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(540, 1160); ctx.lineTo(540 + Math.cos(a - 0.06) * 1400, 1160 + Math.sin(a - 0.06) * 1400); ctx.lineTo(540 + Math.cos(a + 0.06) * 1400, 1160 + Math.sin(a + 0.06) * 1400); ctx.fill(); } }
  // ripple rings (accent) spreading from the fingertip
  if (t >= T_HIT + 0.125) for (let k = 0; k < 3; k++) {
    const u = seg(t, T_HIT + 0.125 + k * 0.18, T_HIT + 1.3 + k * 0.18); if (u <= 0 || u >= 1) continue;
    ctx.save(); ctx.globalAlpha = 1 - u; ctx.strokeStyle = k ? P.accentHi : P.accent; ctx.lineWidth = 10 * (1 - u) + 2;
    ctx.beginPath(); ctx.ellipse(540, 1165, 60 + 520 * eo(u), (60 + 520 * eo(u)) * 0.32, 0, 0, 7); ctx.stroke(); ctx.restore();
  }
  // the drop sitting on the fingertip after the hit
  if (t >= T_HIT + 0.125) { ctx.fillStyle = P.accentHi; ctx.beginPath(); ctx.ellipse(540, 1162, 34, 12, 0, 0, 7); ctx.fill(); ctx.fillStyle = P.light; ctx.beginPath(); ctx.ellipse(528, 1158, 9, 3.5, 0, 0, 7); ctx.fill(); }
  ctx.restore();
  // ingredient words ride the wave (on twos), then hold
  WORDS.forEach((w, i) => {
    const t0 = 1.2 + i * 0.16, a = on2(t) >= t0 ? 1 : 0; if (!a) return;
    const pos = [[300, 760], [780, 860], [270, 980], [790, 640]][i], pop = 1 + 0.25 * (1 - eo(seg(on2(t), t0, t0 + 0.25)));
    ctx.save(); ctx.translate(pos[0], pos[1]); ctx.scale(pop, pop); ctx.font = '700 54px AR'; ctx.direction = 'rtl'; ctx.textAlign = 'center';
    const tw = ctx.measureText(w).width + 44; ctx.fillStyle = P.navy; ctx.beginPath(); ctx.roundRect(-tw / 2, -46, tw, 70, 14); ctx.fill();
    ctx.fillStyle = P.accentHi; ctx.fillText(w, 0, 6); ctx.restore();
  });
  if (dip) { ctx.fillStyle = P.accent; ctx.fillRect(0, 0, W, H); }   // COLOR DIP, 3 frames
  if (!impact && !dip) grade(t, '#2FA062', 0.1);
}

// ================================================================ the hero (original young man, oily skin)
function hero(cx, cy, k, t, { blinkOff = 0, browDown = 0, look = 0, shine = 1, mouth = 0, bodyCol = P.light } = {}) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
  const L = 4 / k;
  // shoulders + tee
  path([[-260, 1400], [-250, 330], [-190, 250, -60, 230], [60, 230], [190, 250, 250, 330], [260, 1400]], bodyCol, P.line, L);
  path([[90, 236], [190, 255, 245, 330], [260, 1400], [140, 1400]], bodyCol === P.light ? P.coatSh : P.navySh);
  path([[-60, 230], [0, 290, 60, 230]], null, P.line, L, false);
  path([[-48, 150], [-48, 245], [0, 268], [48, 245], [48, 150]], P.skinSh, P.line, L);
  // ears, face
  for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s2 * 112, 10, 18, 38, 0, 0, 7); ctx.fillStyle = s2 > 0 ? P.skinSh : P.skin; ctx.fill(); ctx.strokeStyle = P.line; ctx.lineWidth = L; ctx.stroke(); }
  path([[-108, -110], [0, -165, 108, -110], [112, 10], [100, 110, 40, 160], [0, 175, -40, 160], [-100, 110, -112, 10]], P.skin, P.line, L);
  path([[60, -140], [108, -110], [112, 10], [100, 110, 40, 160], [70, 60, 60, -140]], P.skinSh);
  // oily shine (forehead, nose)
  if (shine) { ctx.save(); ctx.globalAlpha = shine; path([[-50, -95], [-10, -110, 30, -98], [-10, -88, -50, -95]], P.skinHi); path([[-6, 52], [6, 44, 14, 54], [4, 60, -6, 52]], P.skinHi); ctx.restore(); }
  // hair: messy fringe, 8 clumps, each sways (on threes)
  path([[-116, -40], [-130, -150, -60, -200], [20, -222, 100, -190], [140, -150, 116, -40], [100, -100], [-100, -100]], P.hair, P.line, L);
  for (let i = 0; i < 8; i++) { const x = -100 + i * 28, sw = sway(on3(t) + i * 0.25, 2, 4);
    path([[x - 6, -150], [x + 10 + sw, -62 - (i % 3) * 14], [x + 30, -140]], P.hair, P.line, L * 0.7); }
  // brows
  for (const s2 of [-1, 1]) path([[s2 * 86, -48 + browDown * (s2 > 0 ? 6 : 6)], [s2 * 54, -62 + browDown * 10, s2 * 22, -52 + browDown * 4], [s2 * 22, -44], [s2 * 54, -52 + browDown * 10, s2 * 86, -40]], P.hair);
  // eyes (big iris, two catchlights, thick lash stroke)
  const bl = blink(t, 2.4, blinkOff);
  for (const s2 of [-1, 1]) {
    const ex = s2 * 52, ey = -6;
    if (bl) { path([[ex - 28, ey + 4], [ex, ey + 14, ex + 28, ey + 4]], null, P.line, 6 / k * 1.2, false); continue; }
    path([[ex - 30, ey + 2], [ex, ey - 26, ex + 30, ey + 2], [ex, ey + 26, ex - 30, ey + 2]], P.light);
    ctx.beginPath(); ctx.ellipse(ex + look * 6, ey + 4 + Math.max(0, look) * 0, 15, 19, 0, 0, 7); ctx.fillStyle = P.shadow; ctx.fill();
    ctx.fillStyle = P.light; ctx.beginPath(); ctx.arc(ex + look * 6 - 5, ey - 4, 5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(ex + look * 6 + 5, ey + 9, 2.4, 0, 7); ctx.fill();
    path([[ex - 33, ey + 2], [ex, ey - 30, ex + 33, ey - 2]], null, P.line, 7 / k * 1.1, false);
  }
  // nose, mouth
  path([[4, 10], [14, 54], [2, 60]], null, P.line, L * 0.8, false);
  if (mouth > 0.5) path([[-26, 100], [0, 118, 26, 100], [0, 108, -26, 100]], '#7A4E44', P.line, L * 0.6);
  else path([[-22, 104], [0, 110 - mouth * 6, 22, 102]], null, P.line, L * 0.8, false);
  ctx.restore();
}

// ================================================================ SHOT 2 · CU eyes in the mirror, a sigh (1.5–3.5)
function shot2(t) {
  ctx.fillStyle = '#1B2236'; ctx.fillRect(0, 0, W, H);
  const tu = on2(t), sigh = Math.sin(Math.PI * seg(tu, 0.5, 1.4));
  hero(540, 760 + sigh * 10, 2.6, t, { browDown: sigh, blinkOff: 0.9, look: 0.2, shine: 1 });
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.16; const g = ctx.createLinearGradient(0, 0, 0, 800); g.addColorStop(0, P.light); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 800); ctx.restore();
  ctx.fillStyle = P.night; ctx.fillRect(0, 0, 36, H); ctx.fillRect(W - 36, 0, 36, H);
  grade(t, '#3A5A8A', 0.22);
}

// ================================================================ SHOT 4 · the pack slides across the counter (5.5–7)
function shot4(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.navy); g.addColorStop(1, P.night); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  path([[-20, 1060], [W + 20, 1060], [W + 20, H], [-20, H]], P.light, P.line, 4);           // counter top
  ctx.fillStyle = P.coatSh; ctx.fillRect(0, 1240, W, H); ctx.fillStyle = P.accent; ctx.fillRect(0, 1056, W, 8);
  const u = eo(seg(t, 0.15, 0.95)), x = lerp(420, 540, u);                                   // slides 120 px, soft stop
  const h = 760, w = h * PACK.width / PACK.height, y = 1180 - h;
  ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = P.night; ctx.beginPath(); ctx.ellipse(x, 1182, w * 0.5, 22, 0, 0, 7); ctx.fill(); ctx.restore();
  ctx.drawImage(PACK, x - w / 2, y, w, h);                                                   // catalog image, untouched
  // the pharmacist's hand and coat cuff at the left edge of the box (on twos)
  const hx = on2(t) < 0.95 ? x - w / 2 - 10 : lerp(x - w / 2 - 10, x - w / 2 - 120, eo(seg(on2(t), 0.95, 1.4)));
  path([[hx - 520, 1000], [hx - 120, 960], [hx - 120, 1130], [hx - 520, 1170]], P.light, P.line, 4);                // cuff
  path([[hx - 130, 980], [hx - 20, 990], [hx + 18, 1030, hx + 10, 1080], [hx - 30, 1110], [hx - 130, 1120]], P.skin, P.line, 4);
  path([[hx - 60, 1000], [hx + 8, 1010], [hx + 2, 1040], [hx - 60, 1030]], null, P.line, 3, false);
  path([[hx - 130, 1080], [hx - 30, 1110], [hx - 130, 1120]], P.skinSh);
  ctx.save(); ctx.font = '500 58px BC'; ctx.textAlign = 'center'; const s2 = 'Azelaic & Salicylic – B3', tw = ctx.measureText(s2).width + 70;
  const a = ss(seg(t, 0.4, 0.6)); ctx.globalAlpha = a; ctx.fillStyle = P.navy; ctx.beginPath(); ctx.roundRect(540 - tw / 2, 230, tw, 96, 18); ctx.fill();
  ctx.fillStyle = P.light; ctx.fillText(s2, 540, 298); ctx.restore();
  grade(t, '#F2C58A', 0.1);
}

// ================================================================ SHOT 6 · applying the serum in the morning (10–13)
function shot6(t) {
  const tr = t / 3;                                                                          // TRUCK: three layers
  ctx.fillStyle = '#E9D9C4'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(-40 * tr, 0);                                                    // BG window
  path([[620, 120], [1100, 120], [1100, 980], [620, 980]], '#BFD8E8', P.line, 5);
  ctx.fillStyle = P.light; ctx.globalAlpha = 0.6; ctx.fillRect(650, 150, 420, 800); ctx.globalAlpha = 1;
  ctx.strokeStyle = P.line; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(860, 120); ctx.lineTo(860, 980); ctx.moveTo(620, 550); ctx.lineTo(1100, 550); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.translate(-110 * tr, 0);                                                   // MG plant
  path([[40, 1150], [120, 1150], [110, 1300], [50, 1300]], P.navy, P.line, 4);
  for (let i = 0; i < 6; i++) { const a = -1.9 + i * 0.35 + sway(on3(t) + i, 3, 0.05); path([[80, 1150], [80 + Math.cos(a) * 160, 1150 + Math.sin(a) * 200], [80 + Math.cos(a + 0.2) * 60, 1150 + Math.sin(a + 0.2) * 80]], P.accent, P.line, 3); }
  ctx.restore();
  hero(500, 640, 1.25, t, { blinkOff: 0.3, shine: 0.4, mouth: 0.4, look: 0.3 });
  // the hand pressing serum into the cheek: small circles on twos
  const tu = on2(t), hx = 600 + Math.cos(tu * 5) * 14, hy = 700 + Math.sin(tu * 5) * 10;
  // forearm from below, palm + three fingers resting on the cheek
  path([[hx + 60, 2000], [hx + 40, 880], [hx + 115, 880], [hx + 165, 2000]], P.skin, P.line, 4);
  path([[hx + 40, 890], [hx + 20, 820, hx + 30, 760], [hx + 60, 740], [hx + 100, 750], [hx + 120, 820, hx + 115, 885]], P.skin, P.line, 4);
  for (let i = 0; i < 3; i++) path([[hx + 34 + i * 26, 770], [hx + 30 + i * 26, 720 - (i === 1 ? 14 : 0)]], null, P.line, 3, false);
  path([[hx + 100, 760], [hx + 122, 820, hx + 118, 885], [hx + 165, 2000], [hx + 140, 2000], [hx + 100, 890]], P.skinSh);
  ctx.fillStyle = P.accentHi; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.ellipse(hx + 20, 760, 16, 8, -0.4, 0, 7); ctx.fill(); ctx.globalAlpha = 1;  // a little serum sheen
  ctx.save(); ctx.translate(-260 * tr, 0); ctx.globalAlpha = 0.85;                           // FG curtain
  path([[-80, -20], [140, -20], [100, 700, 160, 1920], [-80, 1920]], P.light, P.line, 4); ctx.restore();
  card('مرة أو مرتين باليوم', 260, ss(seg(t, 0.2, 0.45)), 58);
  grade(t, '#F2B66A', 0.2);                                                                  // warm morning
}

// ================================================================ SHOT 7 · WS out into the sun (13–15)
function shot7(t) {
  ctx.fillStyle = '#BFD8E8'; ctx.fillRect(0, 0, W, H);
  path([[-20, 300], [380, 300], [380, 1500], [-20, 1500]], '#E9D9C4', P.line, 4);             // buildings
  path([[700, 220], [1100, 220], [1100, 1500], [700, 1500]], '#E0C9AE', P.line, 4);
  for (let r2 = 0; r2 < 5; r2++) for (let c = 0; c < 2; c++) { ctx.fillStyle = P.navy; ctx.globalAlpha = 0.5; ctx.fillRect(60 + c * 160, 380 + r2 * 210, 110, 140); ctx.fillRect(760 + c * 170, 300 + r2 * 220, 120, 150); } ctx.globalAlpha = 1;
  ctx.fillStyle = '#CDBBA4'; ctx.fillRect(0, 1500, W, 420);
  // the hero, full body (small)
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 1460); ctx.clip();
  hero(540, 1010, 0.62, t, { blinkOff: 0.6, shine: 0, mouth: 0.6 }); ctx.restore();
  path([[420, 1450], [660, 1450], [640, 1880], [580, 1880], [540, 1560], [500, 1880], [440, 1880]], P.navy, P.line, 4);  // jeans
  // tree shadow moving across (the one motion)
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.35; ctx.fillStyle = '#6A5A7A';
  for (let i = 0; i < 9; i++) { const x = (i * 157 + on3(t) * 40) % 1300 - 100, y = 700 + (i * 211) % 900; ctx.beginPath(); ctx.ellipse(x, y, 90, 50, 0.4, 0, 7); ctx.fill(); } ctx.restore();
  card('وواقي شمس بالنهار', 260, ss(seg(t, 0.15, 0.4)), 58);
  grade(t, '#F7D27A', 0.18);
}

// ================================================================ SHOT 8 · CU typing on the phone (15–17)
function shot8(t) {
  const tilt = lerp(0, 120, eio(t / 2));                                                      // TILT D, on ones
  ctx.fillStyle = '#2A3048'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(0, -tilt);
  hero(540, 560, 1.5, t, { blinkOff: 1.1, look: 0, shine: 0.3, browDown: 0.2 });
  // phone in two hands
  path([[330, 1200], [750, 1200], [750, 1980], [330, 1980]], P.night, P.line, 6);
  ctx.fillStyle = '#E8F3EC'; ctx.fillRect(352, 1225, 376, 735);
  const lines = Math.floor(on2(t) * 6);                                                     // chat bubble grows as he types
  ctx.fillStyle = P.accent; ctx.beginPath(); ctx.roundRect(420, 1300, 280, 80 + Math.min(lines, 6) * 16, 18); ctx.fill();
  ctx.fillStyle = P.light; for (let i = 0; i < Math.min(lines, 6); i++) ctx.fillRect(445, 1325 + i * 16, 200 - (i % 3) * 40, 8);
  for (const s2 of [-1, 1]) { const fx = 540 + s2 * 200, fy = 1500 + (on2(t) * 12 % 2 < 1 ? 0 : 12) * (s2 > 0 ? 1 : 0);
    path([[fx - 70, 2000], [fx - 60, fy + 60], [fx - 20, fy], [fx + 30, fy + 20], [fx + 60, 2000]], P.skin, P.line, 4); }
  ctx.restore();
  card('دز نوع بشرتك', 300, ss(seg(t, 0.15, 0.4)), 60);
  grade(t, '#2FA062', 0.12);
}

// ================================================================ SHOT 9 · end card (17–20)
function shot9(t) {
  ctx.fillStyle = P.night; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(540, 780, 50, 540, 780, 760); g.addColorStop(0, '#1C2A44'); g.addColorStop(1, P.night); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const h = 820, w = h * PACK.width / PACK.height; ctx.drawImage(PACK, 540 - w / 2, 280, w, h);   // untouched
  card('استشارة صيدلاني مجانية', 1230, ss(seg(t, 0.2, 0.4)), 56);
  const a = ss(seg(t, 0.45, 0.6)), pop = 1 + 0.08 * Math.exp(-(t - 0.6) * 7) * Math.max(0, Math.sin(Math.max(0, t - 0.6) * 22));
  ctx.save(); ctx.globalAlpha = a; ctx.translate(540, 1395); ctx.scale(pop, pop); ctx.font = '500 92px BC'; ctx.textAlign = 'center'; ctx.fillStyle = P.accentHi; ctx.fillText('0774 105 0454', 0, 0); ctx.restore();
  ctx.save(); ctx.globalAlpha = ss(seg(t, 0.7, 0.9)); ctx.font = '500 38px AR'; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.fillStyle = P.light;
  ctx.fillText('واتساب · جرب على منطقة صغيرة أول', 540, 1480); ctx.restore();
  if (t < 0.125) { ctx.fillStyle = P.accent; ctx.fillRect(0, 0, W, H); }                    // COLOR DIP in, 3 frames
  grade(t, null);
}

// ================================================================ timeline
const SHOTS = [
  { t0: 0, d: 1.5, f: shot1 }, { t0: 1.5, d: 2, f: shot2 }, { t0: 3.5, d: 2, f: shot3 }, { t0: 5.5, d: 1.5, f: shot4 },
  { t0: 7, d: 3, f: shot5 }, { t0: 10, d: 3, f: shot6 }, { t0: 13, d: 2, f: shot7 }, { t0: 15, d: 2, f: shot8 }, { t0: 17, d: 3, f: shot9 },
];
window.DUR = 20;
window.render = T => {
  const i = SHOTS.findLastIndex(s => T >= s.t0), s = SHOTS[i];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (s.f) s.f(T - s.t0);
  else { ctx.fillStyle = P.night; ctx.fillRect(0, 0, W, H); ctx.fillStyle = P.light; ctx.font = '500 60px BC'; ctx.textAlign = 'center'; ctx.fillText('SHOT ' + (i + 1) + ' — next pass', 540, 960); }
};
window.render(0);
window.READY = true;
