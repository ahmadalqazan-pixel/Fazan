// The Dermavia Dark Spots pack as carved props: the carton and the pump bottle, their labels redrawn from the client's own
// pack (assets/product.jpg) in ink and paper. The brand prints in a sans, so the labels use Noto Sans (OFL).
import * as THREE from 'three';
import { mulberry } from '/core/lib.js';
import { INK, PAPER, cut } from './textures.js';
import { C, inkMat, paperMat } from './look.js';

const SANS = `'SansP', sans-serif`, SANSR = `'SansR', sans-serif`;
function spaced(g, text, x, y, px, weight, track, align = 'center', font = SANS) {
  g.font = `${weight} ${px}px ${font}`;
  if ('letterSpacing' in g) { g.letterSpacing = `${track}px`; g.textAlign = align; g.fillText(text, x + (align === 'center' ? track / 2 : 0), y); g.letterSpacing = '0px'; return; }
  g.textAlign = align; g.fillText(text, x, y);
}
function mark(g, cx, top, h, col) {   // the D mark: a bar and a bowl
  const bw = h * .2, lw = h * .2;
  g.fillStyle = col; g.fillRect(cx - h * .5, top, bw, h);
  g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'butt'; g.beginPath();
  g.moveTo(cx - h * .5 + bw + h * .08, top + lw / 2); g.lineTo(cx - h * .02, top + lw / 2);
  g.arc(cx - h * .02, top + h / 2, h / 2 - lw / 2, -Math.PI / 2, Math.PI / 2); g.lineTo(cx - h * .5 + bw + h * .08, top + h - lw / 2); g.stroke();
}
function molecules(g, R, x0, y0, x1, y1, n) {   // the pack's dotted molecule pattern, as ink stabs and hairlines
  const pts = []; for (let i = 0; i < n; i++) pts.push([x0 + R() * (x1 - x0), y0 + R() * (y1 - y0)]);
  g.strokeStyle = INK; g.lineWidth = 1.5; g.globalAlpha = .55;
  pts.forEach((p, i) => { const q = pts[(i * 7 + 3) % n]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 160) { g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke(); } });
  g.globalAlpha = 1; g.fillStyle = INK; pts.forEach(p => { g.beginPath(); g.arc(p[0], p[1], 3 + R() * 6, 0, 7); g.fill(); });
}
// the front of the carton (1024 × 2988, the face is 0.6 × 1.75)
export function cartonFront() {
  const W = 1024, H = 2988, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), R = mulberry(51), cx = W / 2;
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  molecules(g, R, 60, 1050, W - 60, 1650, 46); molecules(g, R, 60, 2150, W - 60, 2600, 30);
  // the shadow side of the face: knife hatching toward the right edge
  for (let x = W * .78; x < W; x += 10) for (let y = 0; y < H; y += 40 + R() * 40) if (R() < (x - W * .78) / (W * .22)) cut(g, x, y, x + 2, y + 60 + R() * 90, 2.5 + 4 * (x - W * .78) / (W * .22), R, INK);
  g.fillStyle = INK; g.textBaseline = 'alphabetic';
  mark(g, cx, 250, 190, INK);
  spaced(g, 'DERMAVIA', cx, 610, 150, 400, 6, 'center', SANSR);
  spaced(g, 'DERMATOLOGY LABORATORY', cx, 680, 34, 600, 14);
  spaced(g, 'CARE CREAM FOR', cx, 930, 64, 600, 2);
  spaced(g, 'DARK SPOTS', cx, 1060, 112, 400, 2, 'center', SANSR);
  g.font = `italic 400 58px ${SANSR}`; g.textAlign = 'center'; g.fillText('Against Pigmentation', cx, 1240); g.fillText('Damage', cx, 1310);
  // the dark band, cut with fine paper lines, its words in paper
  g.fillStyle = INK; g.fillRect(0, 1640, W, 420);
  for (let y = 1655; y < 2050; y += 13) if (R() < .5) cut(g, 20 + R() * 300, y, 600 + R() * 400, y + 1, 2, R, PAPER, .9);
  g.fillStyle = PAPER; g.textAlign = 'left';
  for (const [t, y] of [['ANTI DARK SPOT', 1770], ['AND WHITENING', 1880], ['CREAM', 1990]]) { g.fillStyle = PAPER; spaced(g, t, 110, y, 84, 600, 1, 'left'); }
  // the lighter band: hatched ink, paper letters
  g.fillStyle = INK; g.fillRect(0, 2060, W, 200);
  for (let x = 0; x < W; x += 9) cut(g, x, 2062, x + 3, 2258, 4, R, PAPER, .1);
  g.fillStyle = INK; g.fillRect(140, 2110, W - 280, 100); g.fillStyle = PAPER; spaced(g, 'ANTI-DARK SPOT', cx, 2185, 62, 600, 2);
  g.fillStyle = INK; spaced(g, 'For Balanced Skin Tone', cx, 2420, 64, 400, 0, 'center', SANSR);
  spaced(g, 'DERMATOLOGICALLY TESTED', cx, 2740, 34, 600, 4);
  spaced(g, '50 ML  ℮  1.69 FL. OZ.', cx, 2860, 48, 400, 1, 'center', SANSR);
  return c;
}
// the carton's shadow side: ink, its small print as rows of paper ticks, the brand set vertically
export function cartonSide() {
  const W = 1024, H = 2988, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), R = mulberry(52);
  g.fillStyle = INK; g.fillRect(0, 0, W, H);
  g.fillStyle = PAPER; mark(g, W / 2, 140, 120, PAPER);
  g.save(); g.translate(W / 2 + 40, 860); g.rotate(-Math.PI / 2); spaced(g, 'DERMAVIA', 0, 0, 110, 400, 6, 'center', SANSR); g.restore();
  for (let y = 1300; y < 2800; y += 34) { if (R() < .12) { y += 40; continue; } let x = 120; while (x < W - 120) { const L = 20 + R() * 70; cut(g, x, y, Math.min(W - 120, x + L), y, 7, R, PAPER, .2); x += L + 14; } }
  return c;
}
// the bottle's label, wrapped round the body (front at u = .5); 2048 × 1024 for a 1.0 m tall body
export function bottleLabel() {
  const W = 2048, H = 1024, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), R = mulberry(53), cx = W / 2;
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  // shading: the body turns away into ink on the right (sun from the left) and at the far edges
  for (let x = 0; x < W; x += 8) {
    const u = x / W, k = Math.min(1, Math.max(Math.max(0, (u - .58) / .16), Math.max(0, (.3 - u) / .1)));
    if (k <= 0) continue;
    for (let y = 0; y < H; y += 26 + R() * 26) if (R() < k) cut(g, x, y, x + (R() - .5) * 3, y + 30 + R() * 80 * k, 2 + 6 * k, R, INK);
  }
  g.fillStyle = INK; g.textBaseline = 'alphabetic';
  mark(g, cx, 40, 92, INK);
  spaced(g, 'DERMAVIA', cx, 220, 78, 400, 3, 'center', SANSR);
  spaced(g, 'DERMATOLOGY LABORATORY', cx, 252, 17, 600, 6);
  spaced(g, 'CARE CREAM FOR', cx, 330, 32, 600, 1);
  spaced(g, 'DARK SPOTS', cx, 392, 56, 400, 1, 'center', SANSR);
  g.font = `italic 400 26px ${SANSR}`; g.textAlign = 'center'; g.fillText('Against Pigmentation Damage', cx, 446);
  spaced(g, 'For Balanced Skin Tone', cx, 492, 22, 400, 0, 'center', SANSR);
  g.fillStyle = INK; g.fillRect(cx - 180, 518, 360, 150);
  g.fillStyle = PAPER; for (const [t, y] of [['ANTI DARK SPOT', 568], ['AND WHITENING', 610], ['CREAM', 652]]) spaced(g, t, cx - 160, y, 36, 600, 1, 'left');
  g.fillStyle = INK; g.fillRect(cx - 180, 674, 360, 54); for (let x = cx - 180; x < cx + 180; x += 7) cut(g, x, 676, x + 2, 726, 3, R, PAPER, .1);
  g.fillStyle = INK; g.fillRect(cx - 120, 684, 240, 36); g.fillStyle = PAPER; spaced(g, 'ANTI-DARK SPOT', cx, 712, 24, 600, 1);
  g.fillStyle = INK; spaced(g, 'CİLT LEKELERİNE KARŞI', cx, 780, 22, 600, 1); spaced(g, 'BAKIM KREMİ', cx, 822, 38, 400, 1, 'center', SANSR);
  spaced(g, '50 ML  ℮  1.69 FL. OZ.', cx, 900, 22, 400, 1, 'center', SANSR);
  // the silver band at the top and the base: ink with a paper hairline
  g.fillStyle = INK; g.fillRect(0, 0, W, 14); g.fillRect(0, H - 60, W, 60); g.fillStyle = PAPER; g.fillRect(0, H - 52, W, 3);
  return c;
}

// build both props; returns { group, boxes } where boxes are the label lines to read, in local coordinates
export function buildPack(canvasTex) {
  const grp = new THREE.Group();
  // carton: 0.6 × 1.75 × 0.6, turned so its front faces the camera at a 3/4 angle
  const front = new THREE.MeshBasicMaterial({ map: canvasTex(cartonFront()) }), side = new THREE.MeshBasicMaterial({ map: canvasTex(cartonSide()) });
  const top = new THREE.MeshBasicMaterial({ color: C.paper });
  const carton = new THREE.Mesh(new THREE.BoxGeometry(.6, 1.75, .6), [side, side, top, inkMat, front, side]);
  carton.position.set(-.42, .875, -.25); carton.rotation.y = .42; grp.add(carton);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(carton.geometry), new THREE.LineBasicMaterial({ color: C.ink })); carton.add(edges);
  // bottle: body r .26, 1.0 m, then the silver collar, the pump, the clear cap (drawn as its edges and two paper glints)
  const bottle = new THREE.Group(); bottle.position.set(.36, 0, .22); bottle.rotation.y = Math.PI + .1; grp.add(bottle);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, 1.0, 64, 1, true), new THREE.MeshBasicMaterial({ map: canvasTex(bottleLabel()) }));
  body.position.y = .5; bottle.add(body);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.255, .26, .14, 64), new THREE.MeshBasicMaterial({ color: C.ink })); collar.position.y = 1.07; bottle.add(collar);
  const hair = new THREE.Mesh(new THREE.TorusGeometry(.257, .006, 6, 64), paperMat); hair.rotation.x = Math.PI / 2; hair.position.y = 1.03; bottle.add(hair);
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(.1, .13, .26, 32), paperMat); pump.position.y = 1.27; bottle.add(pump);
  
  const nozzle = new THREE.Mesh(new THREE.BoxGeometry(.2, .07, .08), paperMat); nozzle.position.set(.1, 1.42, 0); bottle.add(nozzle);
  const capG = new THREE.CylinderGeometry(.252, .252, .48, 40, 1, true);
  // the clear cap: a faint ink tint, its rim rings and one paper glint down the lit side
  const capM = new THREE.Mesh(capG, new THREE.MeshBasicMaterial({ color: C.ink, transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false })); capM.position.y = 1.38; bottle.add(capM);
  const capR = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(.252, .252, .48, 40), 40), new THREE.LineBasicMaterial({ color: C.ink })); capR.position.y = 1.38; bottle.add(capR);
  { const gl = new THREE.Mesh(new THREE.PlaneGeometry(.018, .36), paperMat); const a = -.75; gl.position.set(Math.sin(a + Math.PI) * .256, 1.38, Math.cos(a + Math.PI) * .256); gl.rotation.y = a + Math.PI; bottle.add(gl); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.252, .01, 6, 48), inkMat); ring.rotation.x = Math.PI / 2; ring.position.y = 1.62; bottle.add(ring);
  return { grp, carton, bottle, body };
}
// lines on the carton front to report to the reading check (fractions of the 1024 × 2988 face, y from the top)
export const CARTON_LINES = [
  { id: 'pack-brand', text: 'DERMAVIA', u0: .12, u1: .88, v0: 480 / 2988, v1: 615 / 2988 },
  { id: 'pack-spots', text: 'DARK SPOTS', u0: .15, u1: .85, v0: 975 / 2988, v1: 1065 / 2988 },
];
