// The woman's profile as a scratchboard print: paper face lit by the sun from the left, engraved contour cuts toward the
// scarf, an ink scarf and abaya with paper fold cuts. Drawn on a 2048×3072 canvas (a 2 × 3 m plane in the world).
// The cheek carries a shader overlay (cheekMat) so pores, fine cuts and the spreading spots stay sharp when the camera
// pushes in close. Facing left (toward the sun).
import * as THREE from 'three';
import { mulberry } from '/core/lib.js';
import { INK, PAPER, YELLOW, cut } from './textures.js';
import { U, GLSL_HASH } from './look.js';

export const FW = 2048, FH = 3072;
// Catmull-Rom through points → dense polyline
export function spline(P, closed = false, n = 10) {
  const out = [], L = P.length, g = i => P[closed ? (i + L) % L : Math.max(0, Math.min(L - 1, i))];
  for (let i = 0; i < (closed ? L : L - 1); i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  if (!closed) out.push(P[L - 1]);
  return out;
}
const path = (g, pts, close = true) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };

// the profile (facing left), from the scarf's edge at the forehead down the nose and lips to the chin, then back up the scarf edge
export const PROFILE = [[905, 610], [866, 690], [838, 790], [822, 870], [816, 925], [818, 962], [790, 1035], [748, 1110], [712, 1160], [716, 1188], [748, 1204], [772, 1222], [774, 1258], [756, 1284], [750, 1302], [782, 1318], [760, 1336], [756, 1360], [780, 1392], [800, 1412], [792, 1450], [796, 1494], [834, 1540], [902, 1568], [990, 1560], [1062, 1478], [1106, 1360], [1122, 1230], [1112, 1090], [1082, 960], [1034, 820], [972, 690]];
export const SCARF_EDGE = PROFILE.slice(24).concat([PROFILE[0]]);     // under the chin, up the cheek, to the forehead
export const CHEEK = { x: 965, y: 1180, r: 150 };                     // where the spots live (canvas px)

export function faceCanvas() {
  const c = document.createElement('canvas'); c.width = FW; c.height = FH;
  const g = c.getContext('2d'), R = mulberry(2610);
  // ---- scarf and abaya: one ink shape from the crown to the bottom of the frame
  const outer = spline([[880, 600], [930, 470], [1060, 382], [1232, 360], [1402, 420], [1532, 560], [1604, 760], [1626, 1000], [1606, 1250], [1590, 1500], [1650, 1800], [1790, 2150], [1960, 2600], [2060, 3080], [260, 3080], [420, 2640], [600, 2250], [760, 1905], [880, 1722], [962, 1640], [992, 1562]], false, 12);
  g.fillStyle = INK; path(g, outer); g.fill();
  // the lit rim of the scarf along the top and the front (sun from the left): a wide paper cut, then thinner echoes
  const rim = spline([[1060, 382], [930, 470], [880, 600]], false, 16).concat(spline([[962, 1640], [880, 1722], [760, 1905], [600, 2250], [420, 2640]], false, 16));
  g.strokeStyle = PAPER; g.lineCap = 'round';
  for (let k = 0; k < 6; k++) {
    g.lineWidth = 9 - k * 1.3; g.beginPath();
    rim.forEach(([x, y], i) => { const o = 14 + k * 22; i ? g.lineTo(x + o, y + o * .35) : g.moveTo(x + o, y + o * .35); });
    g.setLineDash([60 + R() * 120, 18 + R() * 30]); g.stroke();
  }
  g.setLineDash([]);
  // folds of the scarf round the head: arcs centred behind the ear, broken knife strokes
  for (let k = 0; k < 16; k++) {
    const r = 300 + k * 13 + R() * 6, a0 = -2.4 + R() * .3, a1 = -.2 + R() * .5, cx = 1250, cy = 960;
    for (let a = a0; a < a1; a += .05 + R() * .07) {
      if (R() < .45) continue;
      const b = a + .03 + R() * .08;
      cut(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(b) * r, cy + Math.sin(b) * r, 3 + 3 * (1 - k / 16), R, PAPER);
    }
  }
  // the drape down the shoulders: long curved fold cuts
  for (let k = 0; k < 26; k++) {
    const x0 = 640 + k * 50 + R() * 20, y0 = 1700 + R() * 250, bend = (k - 12) * 6;
    const pts = spline([[x0, y0], [x0 + bend * .4, y0 + 400], [x0 + bend, y0 + 900 + R() * 300]], false, 10);
    for (let i = 1; i < pts.length; i++) if (R() < .75) cut(g, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 2.5 + (k < 8 ? 4 : 1.5) * R(), R, PAPER, .5);
  }
  // ---- the face: paper
  const face = spline(PROFILE, true, 8);
  g.fillStyle = PAPER; path(g, face); g.fill();
  g.save(); path(g, face); g.clip();
  // engraved contour cuts: lines following the scarf's edge, offset toward the profile, dense near the scarf (shadow side)
  const edge = spline(SCARF_EDGE, false, 14);
  for (let k = 0; k < 15; k++) {
    const off = 10 + k * 15 + k * k * .9, w = Math.max(.8, 7 - k * .55);
    for (let i = 1; i < edge.length; i++) {
      if (R() < .12 + k * .045) continue;
      const [x0, y0] = edge[i - 1], [x1, y1] = edge[i];
      const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = dy / l, ny = -dx / l;   // the normal pointing into the face
      cut(g, x0 - nx * off, y0 - ny * off, x1 - nx * off, y1 - ny * off, w, R, INK, .3);
    }
  }
  // under the jaw and the chin: short shadow cuts
  for (let i = 0; i < 22; i++) { const x = 812 + i * 8, y = 1500 + i * 2.6; cut(g, x, y, x + 40, y + 28, 4, R, INK); }
  // under the nose, under the lower lip
  for (let i = 0; i < 5; i++) { cut(g, 752 + i * 7, 1210 + i * 3, 790 + i * 6, 1214 + i * 3, 3, R, INK); cut(g, 770 + i * 6, 1378 + i * 3, 806 + i * 6, 1384 + i * 3, 3, R, INK); }
  g.restore();
  // ---- features
  g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round';
  // brow: a tapered carved stroke
  { const b = spline([[836, 902], [880, 884], [935, 890], [972, 906]], false, 10); for (let i = 1; i < b.length; i++) { const s = i / b.length; g.lineWidth = 16 * (1 - s * .7); g.beginPath(); g.moveTo(...b[i - 1]); g.lineTo(...b[i]); g.stroke(); } }
  // eye: the lid line, the iris wedge, lashes
  g.lineWidth = 7; g.beginPath(); g.moveTo(842, 972); g.quadraticCurveTo(872, 950, 912, 962); g.stroke();
  g.lineWidth = 4; g.beginPath(); g.moveTo(848, 986); g.quadraticCurveTo(876, 992, 906, 978); g.stroke();
  g.beginPath(); g.moveTo(846, 970); g.lineTo(872, 962); g.lineTo(870, 990); g.lineTo(850, 984); g.closePath(); g.fill();
  for (let i = 0; i < 5; i++) cut(g, 846 + i * 9, 966 - i * 2, 830 + i * 8, 948 - i * 3, 4, R, INK);
  cut(g, 912, 962, 950, 952, 4, R, INK);
  // nostril, mouth line, the lip shading
  g.beginPath(); g.ellipse(744, 1190, 13, 7, -.4, 0, 7); g.fill();
  g.lineWidth = 6; g.beginPath(); g.moveTo(752, 1304); g.quadraticCurveTo(774, 1314, 806, 1316); g.stroke();
  for (let i = 0; i < 4; i++) cut(g, 760 + i * 8, 1288 + i, 778 + i * 8, 1296 + i, 4, R, INK);
  // the profile line itself: a hairline of ink where the paper face meets the sky
  g.lineWidth = 3; g.strokeStyle = INK; path(g, spline(PROFILE.slice(0, 25), false, 8), false); g.stroke();
  return c;
}
// a low-resolution mask of the face (alpha), for the cheek overlay
export function faceMask() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 768;
  const g = c.getContext('2d'); g.scale(512 / FW, 768 / FH); g.fillStyle = '#fff'; path(g, spline(PROFILE, true, 8)); g.fill();
  return c;
}

// ------------------------------------------------------------------ the cheek: pores, fine cuts and the spreading spots, procedural
// uv in canvas space (0..1 across the face plane, y down). uPools[i] = (u, v, radius in u, seed); uGrow spreads them.
export function cheekMat(maskTex) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, tMask: { value: maskTex }, uPools: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) }, uGrow: { value: 1 }, uPulse: { value: 0 }, uAsp: { value: FH / FW } },
    transparent: true, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = vec2(uv.x, 1. - uv.y); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: GLSL_HASH + `
      uniform sampler2D tMask; uniform vec4 uPools[8]; uniform float uGrow, uPulse, uAsp; uniform vec3 uInk, uPaper, uYellow; varying vec2 vUv;
      void main(){
        float m = texture2D(tMask, vec2(vUv.x, 1. - vUv.y)).a; if (m < .5) discard;
        vec2 p = vec2(vUv.x, vUv.y*uAsp);          // isotropic, in face widths
        vec2 cc = vec2(${(CHEEK.x / FW).toFixed(4)}, ${(CHEEK.y / FW).toFixed(4)});
        float dc = length(p - cc);
        float k = 0.; vec3 col = uInk;
        // pores: tiny ink stabs that only show close up (they fade out where a pixel spans several of them)
        vec2 g = p*900.; vec2 gi = floor(g), gf = fract(g)-.5;
        float aa = fwidth(g.x);
        float pore = step(.72, h21(gi)) * (1.-smoothstep(.09, .14, length(gf*vec2(1.,1.5)))) * (1.-smoothstep(.15, .5, aa));
        // fine curved cuts round the cheek's swell
        float ang = atan(p.y - cc.y, p.x - cc.x), rr = dc*260.;
        float rf = abs(fract(rr)-.5), ra = fwidth(rr);
        float seg = step(.55, h21(vec2(floor(rr), floor(ang*14. + floor(rr)*.7))));
        float fine = seg * (1.-smoothstep(.06-ra*.5, .06+ra*.5, rf)) * (1.-smoothstep(.2, .6, ra)) * smoothstep(.04, .2, dc) * (1.-smoothstep(.13, .22, dc));
        k = max(pore*.9, fine*.55) * smoothstep(.3, .1, dc);
        // the spots
        float ink = 0., ring = 0.;
        for (int i = 0; i < 8; i++){
          vec4 P = uPools[i]; if (P.z <= 0.) continue;
          vec2 q = p - vec2(P.x, P.y*uAsp); float a = atan(q.y, q.x), r = length(q);
          float R = P.z*uGrow*(1. + .18*sin(a*3.+P.w*6.) + .1*sin(a*7.+P.w*11.) + .05*sin(a*13.+P.w*3.));
          if (r < R) {
            ink = 1.;
            float u = r/R, rv = u*6. - uPulse*.8, ff = abs(fract(rv)-.5), fa = fwidth(rv);
            float sg = step(.3, h21(vec2(floor(rv), floor(a*4.)+P.w*9.)));
            ring = max(ring, sg*(1.-smoothstep(.07-fa, .07+fa, ff))*smoothstep(.2,.45,u)*(1.-smoothstep(.85,.97,u))*(1.-smoothstep(.3,.7,fa)));
          } else if (r < R*1.08) k = max(k, .6);
        }
        if (ink > 0.) { gl_FragColor = vec4(mix(uInk, mix(uPaper, uYellow, uPulse*.8), ring*.85), 1.); return; }
        if (k < .05) discard;
        gl_FragColor = vec4(uInk, k);
      }`,
  });
}

// the sun's light on the cheek: a warm wash of yellow cuts that sweeps across the face plane (alpha overlay)
export function sunlightMat(maskTex) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, tMask: { value: maskTex }, uAmt: { value: 0 }, uT: { value: 0 } },
    transparent: true, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = vec2(uv.x, 1. - uv.y); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: GLSL_HASH + `
      uniform sampler2D tMask; uniform float uAmt, uT; uniform vec3 uYellow; varying vec2 vUv;
      void main(){
        if (uAmt <= 0.) discard;
        float m = texture2D(tMask, vec2(vUv.x, 1. - vUv.y)).a; if (m < .5) discard;
        // diagonal bands of yellow cuts falling from the upper left
        float d = (vUv.x*.8 + vUv.y*1.5)*90.;
        float row = floor(d), f = abs(fract(d)-.5), fa = fwidth(d);
        float s = (vUv.y - vUv.x*.5)*30. + h11(row)*5., on = step(.45, h11(floor(s)+row*1.7));
        float w = .07*uAmt*on*(.6 + .6*h11(row*3.));
        float band = smoothstep(.2, .0, abs(vUv.x - .44 + (vUv.y - .38)*.4) - .18);
        if (f > w || band < .5) discard;
        gl_FragColor = vec4(uYellow, 1.);
      }`,
  });
}
