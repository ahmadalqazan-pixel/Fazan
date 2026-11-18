// Things that carry words, all drawn on canvas in ink and paper: plates of type for the sky, the board on the water tank,
// the carved stone in the skin, the ingredient tiles, the bottle's label, the two red seals, and the pasted notice
// under the peeled sheet. Arabic is cut right to left, Latin left to right.
import { mulberry } from '/core/lib.js';
import { INK, PAPER, RED, cut } from './textures.js';

export const AR = `'NaskhB', serif`, LA = `'SerifB', serif`;
const fontOf = (f, px) => `700 ${px}px ${f === 'la' ? LA : AR}`;

// measure a line: width and the ink box above/below the baseline
function measure(g, text, f, px) {
  g.font = fontOf(f, px); g.direction = f === 'la' ? 'ltr' : 'rtl';
  const m = g.measureText(text);
  return { w: m.width, asc: Math.max(m.actualBoundingBoxAscent, px * .6), desc: Math.max(m.actualBoundingBoxDescent, px * .12) };
}
// paper letters with a few ink knife nicks inside them
function letters(g, text, f, px, x, y, align, col, R, nicks = true) {
  g.save();
  g.font = fontOf(f, px); g.direction = f === 'la' ? 'ltr' : 'rtl'; g.textAlign = align; g.textBaseline = 'alphabetic';
  g.fillStyle = col; g.fillText(text, x, y);
  g.restore();
}
function nicksIn(g, x0, x1, y0, y1, R, col) {
  g.save(); g.globalCompositeOperation = 'source-atop';
  const n = Math.max(2, (x1 - x0) / 26);
  for (let i = 0; i < n; i++) { const xx = x0 + R() * (x1 - x0), yy = y0 + R() * (y1 - y0); cut(g, xx, yy, xx + 6 + R() * 12, yy + (R() - .5) * 2, 1.8, R, col); }
  g.restore();
}

// ------------------------------------------------------------------ one line of type for a sky plate (transparent ground)
export function lineCanvas(text, px, f = 'ar') {
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const m = measure(g, text, f, px), padX = px * .35, padT = px * .25, padB = px * .25;
  c.width = Math.ceil(m.w + padX * 2); c.height = Math.ceil(m.asc + m.desc + padT + padB);
  const R = mulberry(text.length * 13 + px);
  const base = padT + m.asc;
  letters(g, text, f, px, f === 'la' ? padX : c.width - padX, base, f === 'la' ? 'left' : 'right', PAPER, R);
  nicksIn(g, padX, c.width - padX, base - m.asc, base, R, INK);
  return { c, text, box: { u0: padX / c.width, u1: 1 - padX / c.width, v0: padT / c.height, v1: 1 - padB / c.height } };
}

// ------------------------------------------------------------------ the red seals: a square of red, a ragged edge, a glyph cut in paper
export function sealCanvas(kind, S = 512) {
  const c = document.createElement('canvas'); c.width = S; c.height = S;
  const g = c.getContext('2d'), R = mulberry(kind === 'x' ? 5 : 9), m = S / 2, h = S * .42;
  g.fillStyle = RED; g.beginPath();
  const n = 48;
  for (let i = 0; i < n * 4; i++) {
    const side = Math.floor(i / n), s = (i % n) / n, j = (R() - .5) * S * .012;
    const p = [[-h + 2 * h * s, -h + j], [h + j, -h + 2 * h * s], [h - 2 * h * s, h + j], [-h + j, h - 2 * h * s]][side];
    g.lineTo(m + p[0], m + p[1]);
  }
  g.closePath(); g.fill();
  // the inner rim, cut in paper
  g.strokeStyle = PAPER; g.lineWidth = S * .018; g.strokeRect(m - h * .82, m - h * .82, h * 1.64, h * 1.64);
  g.fillStyle = PAPER; g.strokeStyle = PAPER; g.lineCap = 'butt';
  if (kind === 'x') {
    g.lineWidth = S * .12;
    for (const [a, b] of [[[-1, -1], [1, 1]], [[1, -1], [-1, 1]]]) {
      g.beginPath(); g.moveTo(m + a[0] * h * .52, m + a[1] * h * .52); g.lineTo(m + b[0] * h * .52, m + b[1] * h * .52); g.stroke();
    }
  } else {
    // the Dermavia mark: a bar and a D-bowl beside it
    const bw = S * .085, top = m - h * .55, bot = m + h * .55;
    g.fillRect(m - h * .5, top, bw, bot - top);
    g.lineWidth = S * .085;
    g.beginPath(); g.moveTo(m - h * .5 + bw + S * .045, top + g.lineWidth / 2);
    g.lineTo(m - h * .02, top + g.lineWidth / 2);
    g.arc(m - h * .02, m, (bot - top) / 2 - g.lineWidth / 2, -Math.PI / 2, Math.PI / 2);
    g.lineTo(m - h * .5 + bw + S * .045, bot - g.lineWidth / 2); g.stroke();
  }
  // ink not quite taken: paper specks in the red
  for (let i = 0; i < 140; i++) { const x = m + (R() - .5) * 2 * h, y = m + (R() - .5) * 2 * h; g.fillStyle = PAPER; g.globalAlpha = .55; g.fillRect(x, y, 2 + R() * 4, 1 + R() * 3); }
  g.globalAlpha = 1;
  return c;
}

// ------------------------------------------------------------------ carved panels on meshes: board, stone, tiles, strip
// spec = { W, H, ground: 'wood'|'stone'|'tile', seed, lines: [{ id, text, f, px, x, y, align }] }
// amts[i] 0..1: how much of line i has been cut (Arabic from the right, Latin from the left)
export function panelCanvas(spec) {
  const c = document.createElement('canvas'); c.width = spec.W; c.height = spec.H;
  const g = c.getContext('2d');
  const boxes = spec.lines.map(L => {
    const m = measure(g, L.text, L.f, L.px);
    const x0 = L.align === 'right' ? L.x - m.w : L.align === 'center' ? L.x - m.w / 2 : L.x;
    return { id: L.id, text: L.text, x0, x1: x0 + m.w, y0: L.y - m.asc, y1: L.y + m.desc };
  });
  return { c, spec, boxes, key: '' };
}
function ground(g, spec, R) {
  const { W, H } = spec;
  g.fillStyle = INK; g.fillRect(0, 0, W, H);
  if (spec.ground === 'wood') {
    for (let y = 8; y < H; y += 10 + R() * 12) { let x = -20; while (x < W) { const L = 40 + R() * 220; if (R() < .45) cut(g, x, y, x + L, y + (R() - .5) * 3, 2 + R() * 2.5, R, PAPER, .9); x += L + 20 + R() * 120; } }
    g.strokeStyle = PAPER; g.lineWidth = 5; g.strokeRect(14, 14, W - 28, H - 28);
  } else if (spec.ground === 'stone') {
    // chisel marks across the face and a paper rim where the edge was dressed
    for (let i = 0; i < W * H / 9000; i++) { const x = R() * W, y = R() * H, a = -.6 + R() * .3, L = 10 + R() * 28; cut(g, x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, 2.5 + R() * 2, R, PAPER, .9); }
    g.strokeStyle = PAPER; g.lineWidth = 7; g.beginPath(); g.moveTo(10, H - 10); g.lineTo(10, 10); g.lineTo(W - 10, 10); g.stroke();
  } else {   // a glazed tile: ink with a cut paper border
    g.strokeStyle = PAPER; g.lineWidth = 6; g.strokeRect(18, 18, W - 36, H - 36);
    for (let i = 0; i < 10; i++) { const x = 30 + R() * (W - 60), y = 30 + R() * (H - 60); cut(g, x, y, x + 14 + R() * 20, y + 8 + R() * 6, 3, R, PAPER); }
  }
}
export function drawPanel(P, amts) {
  const key = amts.map(a => a.toFixed(3)).join();
  if (key === P.key) return false; P.key = key;
  const { spec, c } = P, g = c.getContext('2d'), R = mulberry(spec.seed || 1);
  ground(g, spec, R);
  spec.lines.forEach((L, i) => {
    const a = amts[i] ?? 0, b = P.boxes[i]; if (a <= 0) return;
    const w = b.x1 - b.x0, rtl = L.f !== 'la';
    const kx = rtl ? b.x1 - w * a : b.x0 + w * a;          // where the knife is
    g.save(); g.beginPath();
    if (rtl) g.rect(kx, 0, spec.W - kx, spec.H); else g.rect(0, 0, kx, spec.H);
    g.clip();
    letters(g, L.text, L.f, L.px, L.x, L.y, L.align, PAPER, R);
    nicksIn(g, b.x0, b.x1, b.y0, L.y, mulberry(i + 7), INK);
    g.restore();
    if (a < 1) {   // chips flying off the knife
      const Rc = mulberry(Math.floor(a * 40) + i * 99);
      for (let k = 0; k < 10; k++) { const x = kx + (Rc() - .5) * 30 + (rtl ? -1 : 1) * Rc() * 24, y = b.y0 + Rc() * (b.y1 - b.y0); cut(g, x, y, x + 6 + Rc() * 10, y - 4 - Rc() * 6, 3, Rc, PAPER); }
      g.fillStyle = PAPER; g.fillRect(kx - 2, b.y0 - 6, 4, b.y1 - b.y0 + 12);
    }
  });
  return true;
}

// ------------------------------------------------------------------ the bottle's label, wrapped round the cylinder (front at u = .5)
export function labelCanvas() {
  const W = 2048, H = 1024, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), R = mulberry(23), cx = W / 2;
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  // the round body in print: knife hatching grows toward the shadow side (u > .62) and the far edge
  for (let x = 0; x < W; x += 9) {
    const u = x / W, shade = Math.max(0, (u - .6) / .2), back = Math.max(0, (.32 - u) / .1);
    const k = Math.min(1, Math.max(shade, back));
    if (k <= 0) continue;
    for (let y = 0; y < H; y += 30 + R() * 30) if (R() < k) cut(g, x, y, x + (R() - .5) * 3, y + 40 + R() * 90 * k, 2 + 5 * k, R, INK);
  }
  // top and bottom bands (the silver collar is ink with a paper hairline)
  g.fillStyle = INK; g.fillRect(0, 0, W, 38); g.fillRect(0, H - 30, W, 30);
  g.fillStyle = PAPER; g.fillRect(0, 44, W, 4);
  // the mark: a bar and a D-bowl
  const top = 150, bot = 290, bw = 30;
  g.fillStyle = INK; g.fillRect(cx - 70, top, bw, bot - top);
  g.strokeStyle = INK; g.lineWidth = 30; g.beginPath();
  g.moveTo(cx - 70 + bw + 14, top + 15); g.lineTo(cx - 2, top + 15); g.arc(cx - 2, (top + bot) / 2, (bot - top) / 2 - 15, -Math.PI / 2, Math.PI / 2); g.lineTo(cx - 70 + bw + 14, bot - 15); g.stroke();
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = `700 104px ${LA}`; if ('letterSpacing' in g) g.letterSpacing = '10px';
  g.fillText('DERMAVIA', cx, 430);
  g.font = `700 64px ${LA}`; if ('letterSpacing' in g) g.letterSpacing = '6px';
  g.fillText('DARK SPOTS', cx, 560);
  if ('letterSpacing' in g) g.letterSpacing = '0px';
  // the dark band from the pack, cut with fine lines
  g.fillStyle = INK; g.fillRect(cx - 290, 630, 580, 150);
  for (let y = 650; y < 770; y += 14) cut(g, cx - 270 + R() * 40, y, cx + 120 + R() * 140, y + 1, 3, R, PAPER, .9);
  return { c, box: [{ id: 'label-brand', text: 'DERMAVIA', u0: .44, u1: .56, v0: 350 / H, v1: 440 / H }, { id: 'label-spots', text: 'DARK SPOTS', u0: .455, u1: .545, v0: 505 / H, v1: 565 / H }] };
}

// ------------------------------------------------------------------ the pasted notice under the peeled sheet (screen sized)
export function noticeCanvas(img, W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), R = mulberry(88);
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  // fibre and a few stray knife marks on the sheet
  for (let i = 0; i < 2400; i++) { g.fillStyle = `rgba(22,23,27,${.02 + R() * .04})`; g.fillRect(R() * W, R() * H, 1 + R() * 3, 1); }
  for (let i = 0; i < 26; i++) { const x = R() * W, y = R() * H; cut(g, x, y, x + 20 + R() * 60, y + (R() - .5) * 4, 2.5, R, INK, .9); }
  // the photo, pasted at a slight angle with a hard ink edge, two hatched tape strips over its corners
  const pw = W * .76, ph = pw * img.height / img.width, px = W * .46, py = H * .43, rot = -.025;
  g.save(); g.translate(px, py); g.rotate(rot);
  g.fillStyle = 'rgba(22,23,27,.28)'; g.fillRect(-pw / 2 + 10, -ph / 2 + 14, pw, ph);
  g.drawImage(img, -pw / 2, -ph / 2, pw, ph);
  // a light print grade so the photo sits in the paper: warm it toward the paper tone
  g.globalCompositeOperation = 'multiply'; g.fillStyle = PAPER; g.fillRect(-pw / 2, -ph / 2, pw, ph); g.globalCompositeOperation = 'source-over';
  g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(-pw / 2, -ph / 2, pw, ph);
  for (const [tx, ty, ta] of [[pw / 2 - 30, -ph / 2 + 10, .5], [-pw / 2 + 40, ph / 2 - 8, .45]]) {
    g.save(); g.translate(tx, ty); g.rotate(ta);
    g.fillStyle = PAPER; g.fillRect(-90, -26, 180, 52);
    for (let k = -80; k < 80; k += 12) cut(g, k, -20, k + 10, 20, 3, R, INK);
    g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(-90, -26, 180, 52);
    g.restore();
  }
  g.restore();
  return c;
}
