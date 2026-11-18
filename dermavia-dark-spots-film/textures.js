// Canvas-drawn sprites: palms, the woman's silhouette, the sun. Ink, paper and the yellow; seeded, so every worker
// draws the same pixels. cut() and sunCanvas() come from the Scratchboard Long Take print kit.
import { mulberry } from '/core/lib.js';

export const INK = '#16171b', PAPER = '#ede5cd', RED = '#c4332b', YELLOW = '#dfa443';

// A short knife cut: blunt entry, tapered exit, a little wobble.
export function cut(g, x0, y0, x1, y1, w, R, col, taper = .85) {
  const n = 8, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len, wob = (R() - .5) * len * .04;
  g.fillStyle = col; g.beginPath();
  for (let i = 0; i <= n; i++) {
    const s = i / n, ww = w * (1 - s * taper) * .5, b = Math.sin(s * Math.PI) * wob;
    g.lineTo(x0 + dx * s + nx * (ww + b), y0 + dy * s + ny * (ww + b));
  }
  for (let i = n; i >= 0; i--) {
    const s = i / n, ww = w * (1 - s * taper) * .5, b = Math.sin(s * Math.PI) * wob;
    g.lineTo(x0 + dx * s - nx * (ww - b), y0 + dy * s - ny * (ww - b));
  }
  g.fill();
}

// ------------------------------------------------------------------ date palms: 4 variants, 512×1024 each, side by side
export function palmAtlas() {
  const W = 512, H = 1024, c = document.createElement('canvas'); c.width = W * 4; c.height = H;
  const g = c.getContext('2d');
  for (let v = 0; v < 4; v++) {
    const R = mulberry(300 + v * 17), ox = v * W, bx = ox + W / 2, lean = (R() - .5) * 60;
    const topX = bx + lean, topY = 300 + R() * 80;
    // trunk: a tapered ink column with paper notch cuts (old frond bases)
    g.fillStyle = INK; g.beginPath();
    g.moveTo(bx - 22, H); g.quadraticCurveTo(bx + lean * .2 - 20, (H + topY) / 2, topX - 13, topY);
    g.lineTo(topX + 13, topY); g.quadraticCurveTo(bx + lean * .2 + 20, (H + topY) / 2, bx + 22, H); g.fill();
    for (let y = topY + 30; y < H - 10; y += 22 + R() * 8) {
      const s = (y - topY) / (H - topY), x = topX + (bx - topX) * s, w = 13 + 9 * s;
      cut(g, x - w * .8, y, x + w * .7, y + 7 + R() * 4, 3.5, R, PAPER);
    }
    // fronds: arching ink blades with a paper midrib, leaflets as short knife strokes
    const n = 13;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI + (i / (n - 1)) * Math.PI + (R() - .5) * .25;
      const L = 170 + R() * 70, droop = 0.5 + R() * .5;
      const pts = [];
      for (let s = 0; s <= 1.0001; s += .1) {
        const ang = a + Math.sign(Math.cos(a)) * droop * s * s * 1.2;
        pts.push([topX + Math.cos(ang) * L * s, topY + Math.sin(ang) * L * s * .8 + droop * s * s * 90]);
      }
      g.strokeStyle = INK; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); pts.forEach(p => g.lineTo(p[0], p[1])); g.stroke();
      for (let k = 1; k < pts.length; k++) {
        const [x, y] = pts[k], [px, py] = pts[k - 1], dx = x - px, dy = y - py, l = Math.hypot(dx, dy) || 1;
        const nx = -dy / l, ny = dx / l, ll = 34 * (1 - k / pts.length * .6);
        for (const sgn of [-1, 1]) cut(g, x, y, x + nx * ll * sgn + dx * .6, y + ny * ll * sgn + dy * .6 + 14, 7, R, INK, .9);
      }
      g.strokeStyle = PAPER; g.lineWidth = 1.6; g.beginPath(); pts.slice(1, 7).forEach(p => g.lineTo(p[0], p[1])); g.stroke();
    }
    // a date cluster
    g.fillStyle = INK; g.beginPath(); g.ellipse(topX + 18, topY + 34, 18, 26, .3, 0, 7); g.fill();
    for (let k = 0; k < 5; k++) { g.fillStyle = PAPER; g.fillRect(topX + 8 + R() * 18, topY + 18 + R() * 30, 3, 3); }
  }
  return c;
}

// ------------------------------------------------------------------ the woman: a flat ink silhouette in an abaya and scarf
// 4 poses (512×1024 each): 0 step (left foot forward), 1 step (right), 2 standing, 3 standing with a hand raised to shade her eyes
export function womanAtlas() {
  const W = 512, H = 1024, c = document.createElement('canvas'); c.width = W * 4; c.height = H;
  const g = c.getContext('2d');
  for (let v = 0; v < 4; v++) {
    const R = mulberry(71 + v), ox = v * W, cx = ox + W / 2, foot = H - 20;
    g.fillStyle = INK; g.strokeStyle = PAPER;
    // the long dress, slightly flared, the hem opened by the stride
    const stride = v === 0 ? 46 : v === 1 ? -46 : 0;
    g.beginPath();
    g.moveTo(cx - 60, 330); g.quadraticCurveTo(cx - 74, 600, cx - 100 - Math.max(0, -stride) * .5, foot - 8);
    g.lineTo(cx + 100 + Math.max(0, stride) * .5, foot - 8); g.quadraticCurveTo(cx + 74, 600, cx + 60, 330); g.closePath(); g.fill();
    // feet
    g.beginPath(); g.ellipse(cx - 30 - stride * .4, foot, 30, 9, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(cx + 30 + stride * .4, foot - (v < 2 ? 4 : 0), 30, 9, 0, 0, 7); g.fill();
    // shoulders and arms
    g.beginPath(); g.moveTo(cx - 64, 340); g.quadraticCurveTo(cx - 70, 250, cx, 238); g.quadraticCurveTo(cx + 70, 250, cx + 64, 340); g.fill();
    const armL = v === 0 ? 14 : v === 1 ? -14 : 0;
    g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 34;
    g.beginPath(); g.moveTo(cx - 58, 290); g.quadraticCurveTo(cx - 76 + armL, 420, cx - 66 + armL * 2, 540); g.stroke();
    if (v === 3) { // right arm raised, hand flat over the brow
      g.beginPath(); g.moveTo(cx + 58, 292); g.quadraticCurveTo(cx + 120, 250, cx + 70, 170); g.stroke();
      g.lineWidth = 20; g.beginPath(); g.moveTo(cx + 70, 172); g.lineTo(cx + 10, 160); g.stroke();
    } else { g.beginPath(); g.moveTo(cx + 58, 290); g.quadraticCurveTo(cx + 76 - armL, 420, cx + 66 - armL * 2, 540); g.stroke(); }
    // head in a scarf: a rounded shape over the shoulders, the face a paper profile line turned toward the light
    g.fillStyle = INK; g.beginPath(); g.ellipse(cx, 175, 52, 66, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(cx - 52, 180); g.quadraticCurveTo(cx - 70, 260, cx - 60, 300); g.lineTo(cx + 60, 300); g.quadraticCurveTo(cx + 70, 260, cx + 52, 180); g.fill();
    // knife cuts: the fold lines of the dress and the scarf's edge, in paper
    g.strokeStyle = PAPER; g.lineWidth = 3;
    g.beginPath(); g.arc(cx, 178, 44, -2.6, -.5); g.stroke();
    for (let k = 0; k < 6; k++) { const x = cx - 45 + k * 18 + (R() - .5) * 6; cut(g, x, 400 + R() * 60, x + (x - cx) * .25, 760 + R() * 120, 3.5, R, PAPER); }
    // a thin paper rim on the lit side, so she separates from ink behind her
    g.strokeStyle = PAPER; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(cx + 44, 140); g.quadraticCurveTo(cx + 56, 190, cx + 50, 230); g.stroke();
    g.beginPath(); g.moveTo(cx + 62, 340); g.quadraticCurveTo(cx + 76, 600, cx + 98, foot - 12); g.stroke();
  }
  return c;
}

// The sun: a warm disc crossed by ink dashes, with carved rays fanning out (from the print kit)
export function sunCanvas(S = 1024) {
  const c = document.createElement('canvas'); c.width = S; c.height = S;
  const g = c.getContext('2d'), R = mulberry(4401), m = S / 2;
  for (let i = 0; i < 56; i++) {
    const a = Math.PI + (i + .5) / 56 * Math.PI + (R() - .5) * .02;
    const r0 = 190 + R() * 30, r1 = 330 + R() * 170;
    cut(g, m + Math.cos(a) * r0, m + Math.sin(a) * r0, m + Math.cos(a) * r1, m + Math.sin(a) * r1, 5 + R() * 4, R, YELLOW);
  }
  g.strokeStyle = YELLOW; g.lineCap = 'round';
  for (let i = 0; i < 3; i++) { g.lineWidth = 4 - i; g.beginPath(); g.arc(m, m, 168 + i * 18, Math.PI * 1.02, Math.PI * 1.98); g.stroke(); }
  g.fillStyle = YELLOW; g.beginPath(); g.arc(m, m, 150, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 6; i++) { const y = m - 110 + i * 34, w = Math.sqrt(Math.max(0, 150 * 150 - (y - m) ** 2)); cut(g, m - w * .8, y, m + w * .55, y + 2, 6, R, INK); }
  return c;
}
