// Dermavia · Dark Spots — Scratchboard Long Take, 26 s, 1080×1920.
// One take in three places: her face at dawn on a Baghdad rooftop, the hook cut into the sky above her; the sun on her
// cheek and the camera into it, where the spots spread with each pulse of light and the cause is cut into their ink;
// a dive into the ink, carved open onto the pack, its ingredients cut into the wall behind it; up into the sky for the
// call to action, the seal, and the sheet peeled to the real product photo.
import * as THREE from 'three';
import { mulberry, clamp, lerp, ss, eio, seg, track } from '/core/lib.js';
import { C, U, carveMat, skyMat, billboardMat, wallMat, groundMat, inkMat, paperMat, woodMat, rayMat } from './look.js';
import { palmAtlas, sunCanvas } from './textures.js';
import { lineCanvas, sealCanvas, panelCanvas, drawPanel, noticeCanvas } from './props.js';
import { faceCanvas, faceMask, cheekMat, sunlightMat, FW, FH, CHEEK } from './face.js';
import { buildPack, CARTON_LINES } from './product.js';
import { T, BEAT } from './timeline.js';

const Q = new URLSearchParams(location.search);
const W_ = innerWidth || 1080, H_ = innerHeight || 1920, SS = +(Q.get('ss') || 2);
window.DUR = T.DUR;

for (const [fam, file, w] of [['NaskhB', 'NotoNaskhArabic-Bold.ttf', '700'], ['SerifB', 'NotoSerif-Bold.ttf', '700'], ['SansP', 'NotoSans-SemiBold.ttf', '600'], ['SansR', 'NotoSans-Regular.ttf', '400']]) {
  const f = await new FontFace(fam, `url(./fonts/${file})`, { weight: w }).load(); document.fonts.add(f);
}
const PHOTO = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = './assets/product.jpg'; });

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W_, H_, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
document.body.appendChild(renderer.domElement);
const rtA = new THREE.WebGLRenderTarget(W_ * SS, H_ * SS, { samples: 4 });
const scene = new THREE.Scene(); scene.background = C.ink;
const camera = new THREE.PerspectiveCamera(50, W_ / H_, .05, 9000);
function canvasTex(c, mips = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; t.generateMipmaps = mips;
  t.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
  return t;
}
function billboards(count, mat) {
  const base = new THREE.PlaneGeometry(1, 1); base.translate(0, .5, 0);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
  for (const [n, k] of [['aOff', 3], ['aSize', 2], ['aTile', 4], ['aRot', 1]]) g.setAttribute(n, new THREE.InstancedBufferAttribute(new Float32Array(count * k), k));
  g.instanceCount = count;
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}
function fillBoards(mesh, list, cols) {
  const a = mesh.geometry.attributes;
  list.forEach(([x, y, z, w, h, v], i) => { a.aOff.array.set([x, y, z], i * 3); a.aSize.array.set([w, h], i * 2); a.aTile.array.set([(v % cols) / cols, 0, 1 / cols, 1], i * 4); });
  mesh.geometry.instanceCount = list.length; for (const k in a) a[k].needsUpdate = true;
}
const box = (parent, w, h, d, x, y, z, mat, ry = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m; };

// ---------------------------------------------------------------- the sky (travels with the camera), the sun
const sky = new THREE.Mesh(new THREE.SphereGeometry(8000, 64, 32), skyMat); sky.frustumCulled = false; scene.add(sky);
const sunM = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: canvasTex(sunCanvas()), transparent: true, depthWrite: false, alphaTest: .4 }));
sunM.renderOrder = 1; scene.add(sunM);

// ================================================================ the city: flat roofs, tanks, domes, minarets, palms
const CITY = new THREE.Group(); scene.add(CITY);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), groundMat); ground.rotation.x = -Math.PI / 2; CITY.add(ground);
const PALMS = [];
{
  const R = mulberry(1258);
  const house = (x, z, w, d, h, tank) => {
    box(CITY, w, h, d, x, h / 2, z, wallMat);
    for (const [ww, dd, xx, zz] of [[w, .3, x, z + d / 2], [w, .3, x, z - d / 2], [.3, d, x + w / 2, z], [.3, d, x - w / 2, z]]) box(CITY, ww, .7, dd, xx, h + .35, zz, wallMat);
    if (tank) { const tx = x + (R() - .5) * w * .5, tz = z + (R() - .5) * d * .5; box(CITY, 1.6, 1.1, 1.6, tx, h + .55, tz, wallMat); const c = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, 1.5, 14), inkMat); c.position.set(tx, h + 1.85, tz); CITY.add(c); }
  };
  for (let i = -8; i <= 8; i++) for (let j = -16; j <= 0; j++) {
    const x = i * 16 + (R() - .5) * 3, z = j * 16 - 10 + (R() - .5) * 3;
    if (Math.hypot(x + 40, z + 120) < 22 || Math.hypot(x - 30, z + 200) < 26) continue;
    const w = 10 + R() * 4, d = 10 + R() * 4, h = 5 + R() * 6 + (j < -9 ? R() * 4 : 0);
    house(x, z, w, d, h, R() < .55);
    if (R() < .3) PALMS.push([x + w / 2 + 2.5, 0, z + (R() - .5) * d, 6 + R() * 2.5, 13 + R() * 6, Math.floor(R() * 4)]);
  }
  const dome = (x, z, r, base) => {
    box(CITY, r * 2.4, base, r * 2.4, x, base / 2, z, wallMat);
    const dr = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, r * .5, 16), carveMat(1)); dr.position.set(x, base + r * .25, z); CITY.add(dr);
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 7, 0, Math.PI * 2, 0, Math.PI / 2).toNonIndexed(), carveMat(1)); m.position.set(x, base + r * .5, z); m.scale.y = 1.15; CITY.add(m);
    const s = new THREE.Mesh(new THREE.ConeGeometry(r * .08, r * .5, 6), inkMat); s.position.set(x, base + r * 1.85, z); CITY.add(s);
  };
  dome(-40, -120, 11, 8); dome(30, -200, 15, 10);
  const minaret = (x, z, h) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, h, 10), carveMat(1)); c.position.set(x, h / 2, z); CITY.add(c);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 1.6, 1.2, 12), inkMat); b.position.set(x, h * .78, z); CITY.add(b);
    const t = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.2, 10), carveMat(1)); t.position.set(x, h + 1.6, z); CITY.add(t);
  };
  minaret(-22, -132, 40); minaret(8, -206, 46); minaret(-70, -180, 34);
}
const palms = billboards(PALMS.length, billboardMat(canvasTex(palmAtlas()), {})); CITY.add(palms);
fillBoards(palms, PALMS, 4);
// her roof: she stands on a parapet-edged roof at (0, 9, 0); the face is a carved plate 2 × 3 m standing on it
const ROOF = 9;
box(CITY, 16, ROOF, 12, 0, ROOF / 2, 2, wallMat);
const FACE = new THREE.Vector3(.35, 10.55, 0), FACE_W = 2, FACE_H = 3;
const faceTex = canvasTex(faceCanvas());
const faceM = new THREE.Mesh(new THREE.PlaneGeometry(FACE_W, FACE_H), new THREE.MeshBasicMaterial({ map: faceTex, transparent: true, alphaTest: .5 }));
faceM.position.copy(FACE); scene.add(faceM);
const maskTex = canvasTex(faceMask(), false);
const cheek = new THREE.Mesh(new THREE.PlaneGeometry(FACE_W, FACE_H), cheekMat(maskTex)); cheek.position.copy(FACE).add(new THREE.Vector3(0, 0, .002)); cheek.renderOrder = 3; scene.add(cheek);
const sunlight = new THREE.Mesh(new THREE.PlaneGeometry(FACE_W, FACE_H), sunlightMat(maskTex)); sunlight.position.copy(FACE).add(new THREE.Vector3(0, 0, .003)); sunlight.renderOrder = 4; scene.add(sunlight);
// canvas px → world on the face plate
const facePt = (x, y, z = 0) => new THREE.Vector3(FACE.x + (x / FW - .5) * FACE_W, FACE.y + (.5 - y / FH) * FACE_H, FACE.z + z);
// the spots: centres (canvas px) and starting radii (in face widths)
const POOLS = [[965, 1180, .0105], [918, 1140, .006], [1008, 1222, .0075], [985, 1110, .005], [930, 1238, .0045], [1036, 1150, .005], [900, 1196, .0035], [1010, 1290, .004]];
cheek.material.uniforms.uPools.value.forEach((v, i) => { const [x, y, r] = POOLS[i]; v.set(x / FW, y / FH, r, mulberry(i + 5)()); });
// the cause, cut into the spot's ink
const MAIN = facePt(965, 1180, .004);
const CHEEK_W = .3, CHEEK_H = .2;
const cheekP = panelCanvas({ W: 1200, H: 800, ground: 'pool', seed: 12, lines: [
  { id: 'cheek-1', text: 'الشمس ←', f: 'ar', px: 120, x: 960, y: 270, align: 'right' },
  { id: 'cheek-2', text: 'ميلانين أكثر ←', f: 'ar', px: 120, x: 960, y: 450, align: 'right' },
  { id: 'cheek-3', text: 'بقعة أغمق', f: 'ar', px: 120, x: 960, y: 630, align: 'right' },
] });
const cheekTex = canvasTex(cheekP.c);
const cheekText = new THREE.Mesh(new THREE.PlaneGeometry(CHEEK_W, CHEEK_H), new THREE.MeshBasicMaterial({ map: cheekTex, transparent: true, alphaTest: .3, depthWrite: false }));
cheekText.position.copy(MAIN); cheekText.renderOrder = 5; scene.add(cheekText);
// rays of sun falling on her cheek
const rayGeo = new THREE.PlaneGeometry(1, 1);
const RAYS = [0, 1, 2].map(() => { const m = new THREE.Mesh(rayGeo, rayMat.clone()); m.matrixAutoUpdate = false; m.renderOrder = 2; scene.add(m); return m; });
function aimRay(mesh, a, b, width) {
  const A = b.clone().sub(a), len = A.length(); A.normalize();
  const m = a.clone().add(b).multiplyScalar(.5), toCam = camera.position.clone().sub(m).normalize();
  let side = new THREE.Vector3().crossVectors(A, toCam); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
  const nrm = new THREE.Vector3().crossVectors(side, A);
  mesh.matrix.makeBasis(A.multiplyScalar(len), side.multiplyScalar(width), nrm).setPosition(m); mesh.matrixWorldNeedsUpdate = true;
}

// ================================================================ the pack on a sunlit ledge (x = −4000), a shadowed wall behind
const PK = new THREE.Vector3(-4000, 0, 0);
const packScene = new THREE.Group(); packScene.position.copy(PK); scene.add(packScene);
const darkWall = woodMat.clone(); darkWall.uniforms.uScale.value = .55;
box(packScene, 7, 1, 2.4, 0, -.5, 0, darkWall);               // the ledge
{ const top = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.4), paperMat); top.rotation.x = -Math.PI / 2; top.position.y = .001; packScene.add(top); }   // its sunlit top
box(packScene, 9, 3.75, .6, 0, 1.875, -2.2, darkWall);          // the wall behind, in shadow
const pack = buildPack(canvasTex); packScene.add(pack.grp);
// the ingredients cut into the wall (paper letters straight into the shadowed wall), and the line under them
const TAGS = [
  { id: 'tag-1', text: 'Alpha-arbutin', x: -.72, y: 3.38 }, { id: 'tag-2', text: 'Vitamin C', x: .5, y: 3.38 },
  { id: 'tag-3', text: 'Lactic acid', x: -.72, y: 3.03 }, { id: 'tag-4', text: 'Panthenol', x: .5, y: 3.03 },
].map((d, i) => {
  const P = panelCanvas({ W: 1024, H: 256, ground: 'none', seed: 30 + i, lines: [{ ...d, f: 'la', px: 120, x: 512, y: 170, align: 'center' }] });
  const tex = canvasTex(P.c), m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .3), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .3 }));
  m.position.set(d.x, d.y, -1.89); packScene.add(m); return { ...d, P, tex, m };
});
const stripP = panelCanvas({ W: 1600, H: 260, ground: 'none', seed: 41, lines: [{ id: 'strip', text: 'يقللون إنتاج الصبغة', f: 'ar', px: 150, x: 800, y: 175, align: 'center' }] });
const stripTex = canvasTex(stripP.c);
const stripM = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .26), new THREE.MeshBasicMaterial({ map: stripTex, transparent: true, alphaTest: .3 })); stripM.position.set(-.1, 2.6, -1.89); packScene.add(stripM);
// a cut rule between the ingredients and the line
{ const r = new THREE.Mesh(new THREE.PlaneGeometry(2.3, .012), new THREE.MeshBasicMaterial({ color: C.paper })); r.position.set(-.1, 2.8, -1.889); packScene.add(r); }

// ================================================================ type in the sky
const DEG = Math.PI / 180;
function plateRect(lc, azR, elTop, pxScreen, pitch, fov) {
  const F = (H_ / 2) / Math.tan(fov / 2 * DEG), k = pxScreen;
  const hS = lc.c.height * k, wS = lc.c.width * k, elSpan = hS / F, elMid = elTop - elSpan / 2;
  const kAz = Math.cos(elMid) / (Math.cos(elMid) * Math.cos(pitch) + Math.sin(elMid) * Math.sin(pitch));
  return new THREE.Vector4(azR - wS / (F * kAz), elTop - elSpan, azR, elTop);
}
const FACE_PITCH = 5 * DEG, END_PITCH = 15 * DEG;
const PL = {
  hookA: lineCanvas('هاي الغلطة', 200), hookB: lineCanvas('تخلي البقع تغمق', 200),
  boardA: lineCanvas('كريم تفتيح…', 170), boardB: lineCanvas('بلا واقي شمس', 170),
  endA: lineCanvas('من داخل عيادة ديرمافيا', 160), endB: lineCanvas('اطلب عبر الواتساب', 150), endC: lineCanvas('أو الدايركت', 150),
};
const sealX = { c: sealCanvas('x') }, sealD = sealCanvas('d');
const HK = 100 / 200, BK = 84 / 170, EK = 76 / 160;
const R_ = {
  hookA: plateRect(PL.hookA, 7.5 * DEG, 27 * DEG, HK, FACE_PITCH, 50), hookB: plateRect(PL.hookB, 7.5 * DEG, 21 * DEG, HK, FACE_PITCH, 50),
  boardA: plateRect(PL.boardA, 7.5 * DEG, 26 * DEG, BK, FACE_PITCH, 50), boardB: plateRect(PL.boardB, 7.5 * DEG, 20.6 * DEG, BK, FACE_PITCH, 50),
  endA: plateRect(PL.endA, 9 * DEG, 35 * DEG, EK, END_PITCH, 50), endB: plateRect(PL.endB, 9 * DEG, 29.6 * DEG, EK, END_PITCH, 50), endC: plateRect(PL.endC, 9 * DEG, 24.4 * DEG, EK, END_PITCH, 50),
};
R_.sealX = plateRect(sealX, R_.hookA.x - .8 * DEG, 27.4 * DEG, 140 / 512, FACE_PITCH, 50);
const SLOT = { hookA: 0, hookB: 1, sealX: 2, boardA: 3, boardB: 4, endA: 5, endB: 6, endC: 7 };
for (const [k, s] of Object.entries(SLOT)) {
  skyMat.uniforms['tP' + s].value = canvasTex(k === 'sealX' ? sealX.c : PL[k].c, true);
  skyMat.uniforms['uR' + s].value = R_[k]; skyMat.uniforms['uM' + s].value = k === 'sealX' ? 1 : 0;
}

// ================================================================ the camera
const lookAhead = (e, pitch, yaw = 0) => [e[0], e[1], e[2], e[0] + Math.sin(yaw) * 100, e[1] + Math.tan(pitch) * 100, e[2] - Math.cos(yaw) * 100];
const C0 = MAIN.clone();
const FACE_KEYS = [
  [0.0, lookAhead([-.1, 10.75, 4.3], FACE_PITCH)],
  [6.6, lookAhead([0, 10.75, 3.85], FACE_PITCH)],
  [7.9, [C0.x + .02, C0.y + .01, C0.z + .82, C0.x + .02, C0.y + .01, C0.z]],
  [11.3, [C0.x, C0.y, C0.z + .74, C0.x, C0.y, C0.z]],
  [11.7, [C0.x, C0.y, C0.z + .07, C0.x, C0.y, C0.z]],
];
const camFace = track(FACE_KEYS);
const PACK_KEYS = [
  [11.7, [PK.x - 1.0, 1.0, 4.15, PK.x - .1, 1.05, 0]],
  [12.5, [PK.x - .8, 1.0, 4.35, PK.x - .08, 1.08, 0]],
  [18.35, [PK.x + .35, 1.05, 4.6, PK.x - .08, 1.12, 0]],
  [19.15, lookAhead([PK.x - .05, 3.0, 4.8], END_PITCH)],
  [26.0, lookAhead([PK.x - .05, 3.0, 4.85], END_PITCH)],
];
const camPack = track(PACK_KEYS);
function shotAt(t) {
  if (t < T.cutP) return { k: 'face', c: camFace(t), fov: 50 };
  return { k: 'pack', c: camPack(t), fov: 50 };
}
window.CAMAT = t => { const s = shotAt(t); return { x: s.c[0], y: s.c[1], z: 1 }; };

// ================================================================ light and sky
const sunDir = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
const pulseEnv = t => Math.max(Math.exp(-Math.pow((t - T.pulse1 - .15) / .35, 2)), Math.exp(-Math.pow((t - T.pulse2 - .15) / .35, 2)));
function setSky(t, k) {
  const u = skyMat.uniforms;
  for (let s = 0; s < 8; s++) u['uA' + s].value = 0;
  if (k === 'face') {
    u.uFront.value = lerp(.06, .62, ss(seg(t, 0, 5.5))); u.uStars.value = 1 - ss(seg(t, 0, 3)); u.uDense.value = ss(seg(t, 4, 7)) * .4;
    U.uNight.value = 1 - ss(seg(t, 0, 2.5));
    const el = lerp(-2.5, 9, ss(seg(t, T.sunUp[0], 6.5))) * DEG;
    U.uSun.value.copy(sunDir(-11 * DEG, el));
    U.uWarm.value = ss(seg(t, T.sunUp[0], T.sunUp[1])) * (1 - .4 * ss(seg(t, 6.6, 7.9))) + .6 * pulseEnv(t);
    U.uL.value.set(-.85, .35, .4).normalize();
    const out = 1 - ss(seg(t, ...T.hookOut));
    u.uA0.value = ss(seg(t, ...T.hookA)) * out; u.uA1.value = ss(seg(t, ...T.hookB)) * out; u.uA2.value = (t >= T.sealX ? 1 : 0) * out;
    const bout = 1 - ss(seg(t, ...T.boardOut));
    u.uA3.value = ss(seg(t, ...T.boardA)) * bout; u.uA4.value = ss(seg(t, ...T.boardB)) * bout;
    sunM.visible = t > T.sunUp[0] - .2;
  } else {
    u.uFront.value = 2; u.uStars.value = 0; u.uDense.value = 1; U.uNight.value = 0; U.uWarm.value = .25;
    U.uSun.value.copy(sunDir(-35 * DEG, 35 * DEG));
    U.uL.value.set(-.8, .5, -.3).normalize();
    u.uA5.value = ss(seg(t, ...T.endA)); u.uA6.value = ss(seg(t, ...T.endB)); u.uA7.value = ss(seg(t, ...T.endC));
    sunM.visible = false;
  }
  sky.position.copy(camera.position); U.uCam.value.copy(camera.position);
  sunM.position.copy(camera.position).addScaledVector(U.uSun.value, 3000); sunM.lookAt(camera.position); sunM.scale.setScalar(560);
}

// ================================================================ the print pass: fibre, mottling, flicker, the ink dive carved
// open row by row, the sheet peeled from the bottom-left onto the pasted notice, the seal laid on last
const CTA = { text: 'اطلب عبر الواتساب أو الدايركت', px: 64, x: 905, y: 1400 };
const noticeTex = canvasTex(noticeCanvas(PHOTO, W_, H_, CTA), false);
const overlay = document.createElement('canvas'); overlay.width = W_; overlay.height = H_;
const overlayTex = canvasTex(overlay, false);
const printMat = new THREE.ShaderMaterial({
  uniforms: { tA: { value: rtA.texture }, tB: { value: noticeTex }, tSub: { value: overlayTex }, uT: { value: 0 }, uRes: { value: new THREE.Vector2(W_, H_) },
    uPeel: { value: -1 }, uCover: { value: 0 }, uCarve: { value: 0 }, uPaper: U.uPaper, uInk: U.uInk },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.,1.); }`,
  fragmentShader: `
    float h11(float n){ return fract(sin(n*127.1+311.7)*43758.5453); }
    float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
    uniform sampler2D tA, tB, tSub; uniform float uT, uPeel, uCover, uCarve; uniform vec2 uRes; uniform vec3 uPaper, uInk; varying vec2 vUv;
    float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*vn(p); p*=2.03; a*=.5; } return s; }
    void main(){
      vec2 uv = vUv;
      vec3 c = texture2D(tA, uv).rgb;
      float tf = floor(uT*12.)/12.;
      float lum = dot(c, vec3(.299,.587,.114)), dark = 1. - smoothstep(.18, .55, lum);
      float fib = fbm(uv*vec2(420.,700.));
      c *= 1. + (fib-.5)*.06*(1.-dark);
      c += dark*(fbm(uv*vec2(26.,46.) + 3.)-.5)*.05;
      float b = fbm(vec2(uv.x*2.2 + tf*.06, uv.y*4.2 - tf*.02) + 11.);
      c += dark*smoothstep(.5, .78, b)*smoothstep(.7, 1., uv.y)*.08;
      // the ink block over the frame, carved away row by row from the middle outward (the reveal of the pack)
      if (uCover > 0.) {
        float row = floor(uv.y*96.), f = abs(fract(uv.y*96.)-.5);
        float order = abs(row - 48.)/48. + h11(row)*.12;
        float cutRow = step(order, uCarve*1.15);
        float run = clamp((uCarve*1.15 - order)*6., 0., 1.);
        float side = abs(uv.x - .5)*2.;
        float carved = cutRow * step(side, run*1.05) * step(f, .5);
        vec3 inkc = uInk + (fbm(uv*vec2(30.,50.))-.5)*.04;
        // the knife's edge: a paper hairline where the row was just cut
        float edge = cutRow * (1. - step(side, run*1.05)) * step(side, run*1.05 + .015);
        c = mix(c, inkc, uCover*(1. - carved));
        c = mix(c, uPaper, edge*uCover);
      }
      c *= 1. + (h11(tf*13.7)-.5)*.03;
      vec2 q = uv-.5; c *= 1. - dot(q,q)*.08;
      if (uPeel >= 0.) {
        vec2 asp = vec2(uRes.x/uRes.y, 1.);
        vec2 p = uv*asp, D = normalize(asp);
        float diag = length(asp), s = uPeel*(diag+.15), d = dot(p, D);
        vec3 under = texture2D(tB, uv).rgb;
        if (d < s) c = under * (1. - .35*smoothstep(.1, 0., s - d));
        else if (d < 2.*s) {
          vec2 pm = p - 2.*(d - s)*D, um = pm/asp;
          if (um.x <= 1. && um.y <= 1. && um.x >= 0. && um.y >= 0.) {
            float k = (d - s)/max(s, 1e-3);
            vec3 ghost = texture2D(tA, vec2(1.-um.x, um.y)).rgb;
            vec3 back = mix(uPaper, ghost, .13) * (.8 + .26*smoothstep(0., .5, k) - .1*smoothstep(.5, 1., k));
            c = back * (1. + (fbm(um*vec2(300.,500.))-.5)*.05);
            float e = min(min(um.x, um.y), min(1.-um.x, 1.-um.y));
            c = mix(uInk, c, smoothstep(.0, .0025, e));
          } else c *= 1. - .3*smoothstep(.05, 0., d - 2.*s + .02);
        }
      }
      vec4 sb = texture2D(tSub, uv); c = mix(c, sb.rgb, sb.a);
      gl_FragColor = vec4(c, 1.);
    }`,
  depthTest: false, depthWrite: false,
});
const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), printMat));

// the D seal, pressed in screen space under the closing lines, kept on top of the notice
let overlayKey = '';
function drawOverlay(t) {
  const on = t >= T.sealD, press = on ? clamp((t - T.sealD) / .08) : 0;
  const key = on ? press.toFixed(2) : '';
  if (key === overlayKey) return; overlayKey = key;
  const g = overlay.getContext('2d'); g.clearRect(0, 0, W_, H_);
  if (on) { const S = 220 * (1.25 - .25 * press); g.globalAlpha = press; g.drawImage(sealD, 210 - S / 2, 760 - S / 2, S, S); g.globalAlpha = 1; }
  overlayTex.needsUpdate = true;
}

// ================================================================ render
function applyCam(c, fov) { camera.position.set(c[0], c[1], c[2]); camera.lookAt(c[3], c[4], c[5]); if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); } }
let SHOT = null;
const amt = (t, [a, b]) => clamp((t - a) / (b - a));
window.render = (t) => {
  const shot = SHOT = shotAt(t);
  if (Q.get('cam')) shot.c = Q.get('cam').split(',').map(Number);
  if (t >= T.sealD + .07 && t < T.sealD + .105) shot.c = shot.c.map((v, i) => i < 3 ? v + [.004, -.006, 0][i] : v);
  applyCam(shot.c, shot.fov);
  setSky(t, shot.k);
  // her cheek: sunlight sweeps across, the spots spread at each pulse
  sunlight.material.uniforms.uAmt.value = ss(seg(t, ...T.rays)) * (1 - .5 * ss(seg(t, 7.9, 8.6))) + 1.2 * pulseEnv(t);
  cheek.material.uniforms.uGrow.value = 1 + .25 * ss(seg(t, T.rays[0], T.push[0])) + 3.6 * ss(seg(t, T.pulse1, T.pulse1 + .45)) + 2.2 * ss(seg(t, T.pulse2, T.pulse2 + .45));
  cheek.material.uniforms.uPulse.value = pulseEnv(t);
  const ink = ss(seg(t, T.pulse1 + .2, T.pulse1 + .5));
  cheekText.visible = shot.k === 'face' && ink > 0;
  cheekText.scale.setScalar(.6 + .4 * ink);
  if (drawPanel(cheekP, T.cheek.map(s => amt(t, s)))) cheekTex.needsUpdate = true;
  RAYS.forEach((m, i) => {
    m.visible = shot.k === 'face' && t > T.rays[0] && t < T.push[1] + 1.4;
    if (!m.visible) return;
    const tgt = facePt(940 + i * 40, 1150 + i * 30, .01), from = tgt.clone().addScaledVector(new THREE.Vector3(-1, .2, .35).normalize(), 14);
    aimRay(m, from, tgt, (.16 + i * .05) * (1 + 1.5 * pulseEnv(t)));
    m.material.uniforms.uAmt.value = ss(seg(t, T.rays[0] + i * .2, T.rays[1] + i * .2)); m.material.uniforms.uT.value = t;
    m.material.uniforms.uThick.value = 1 + 1.5 * pulseEnv(t);
  });
  // the pack
  TAGS.forEach((d, i) => { if (drawPanel(d.P, [amt(t, [T.tags[i], T.tags[i] + T.tagCut])])) d.tex.needsUpdate = true; });
  if (drawPanel(stripP, [amt(t, T.strip)])) stripTex.needsUpdate = true;
  drawOverlay(t);
  renderer.setRenderTarget(rtA); renderer.render(scene, camera);
  printMat.uniforms.uT.value = t;
  printMat.uniforms.uCover.value = t < T.dive[0] + .2 ? 0 : t < T.carve[1] ? ss(seg(t, T.dive[0] + .2, T.cutP - .02)) : 0;
  printMat.uniforms.uCarve.value = seg(t, ...T.carve);
  printMat.uniforms.uPeel.value = t < T.peel[0] ? -1 : eio(seg(t, ...T.peel));
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
};

// ================================================================ reading check
const toScreen = v => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * W_, (1 - p.y) / 2 * H_, p.z]; };
const dirPt = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).multiplyScalar(1000).add(camera.position);
function boxOf(pts) { const s = pts.map(toScreen); if (s.some(p => p[2] > 1 || p[2] < -1)) return null; return { x0: Math.min(...s.map(p => p[0])), y0: Math.min(...s.map(p => p[1])), x1: Math.max(...s.map(p => p[0])), y1: Math.max(...s.map(p => p[1])) }; }
function skyBox(id, lc, rect, a) {
  if (a <= 0) return [];
  const b = lc.box, az0 = lerp(rect.x, rect.z, b.u0), az1 = lerp(rect.x, rect.z, b.u1), el1 = lerp(rect.y, rect.w, 1 - b.v0), el0 = lerp(rect.y, rect.w, 1 - b.v1);
  const bb = boxOf([dirPt(az0, el0), dirPt(az1, el0), dirPt(az0, el1), dirPt(az1, el1)]); return bb ? [{ id, text: lc.text, ...bb }] : [];
}
function meshBoxes(mesh, w, h, P, W, H) {
  mesh.updateMatrixWorld();
  return P.boxes.map(p => { const c = [[p.x0, p.y0], [p.x1, p.y0], [p.x0, p.y1], [p.x1, p.y1]].map(([u, v]) => mesh.localToWorld(new THREE.Vector3((u / W - .5) * w, (.5 - v / H) * h, 0))); const bb = boxOf(c); return bb && { id: p.id, text: p.text, ...bb }; }).filter(Boolean);
}
window.TEXTS = (t) => {
  const out = [], k = SHOT?.k, u = skyMat.uniforms;
  if (k === 'face') {
    if (t < T.hookOut[0]) out.push(...skyBox('hook-1', PL.hookA, R_.hookA, u.uA0.value), ...skyBox('hook-2', PL.hookB, R_.hookB, u.uA1.value));
    if (t < T.boardOut[0]) out.push(...skyBox('board-1', PL.boardA, R_.boardA, u.uA3.value), ...skyBox('board-2', PL.boardB, R_.boardB, u.uA4.value));
    if (t >= T.cheek[0][0] && t < T.dive[0]) out.push(...meshBoxes(cheekText, CHEEK_W, CHEEK_H, cheekP, 1200, 800));
  }
  if (k === 'pack') {
    if (t > T.carve[1] && t < T.tilt[0]) {
      pack.carton.updateMatrixWorld();
      for (const l of CARTON_LINES) { const pts = [[l.u0, l.v0], [l.u1, l.v0], [l.u0, l.v1], [l.u1, l.v1]].map(([a, b]) => pack.carton.localToWorld(new THREE.Vector3((a - .5) * .6, (.5 - b) * 1.75, .3))); const bb = boxOf(pts); if (bb) out.push({ id: l.id, text: l.text, ...bb }); }
      TAGS.forEach((d, i) => { if (t >= T.tags[i]) out.push(...meshBoxes(d.m, 1.2, .3, d.P, 1024, 256)); });
      if (t >= T.strip[0]) out.push(...meshBoxes(stripM, 1.6, .26, stripP, 1600, 260));
    }
    if (t < T.peel[0]) out.push(...skyBox('end-1', PL.endA, R_.endA, u.uA5.value), ...skyBox('end-2', PL.endB, R_.endB, u.uA6.value), ...skyBox('end-3', PL.endC, R_.endC, u.uA7.value));
    if (t >= T.peel[0] + .3) { const g = overlay.getContext('2d'); out.push({ id: 'notice-cta', text: CTA.text, x0: CTA.x - 760, y0: CTA.y - 70, x1: CTA.x, y1: CTA.y + 25 }); }
  }
  return out;
};

// ================================================================ events for the sound
window.EV = (() => {
  const E = [], add = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
  add(0, 'start');
  const knives = ([a, b], n, pan = 0) => { for (let i = 0; i < n; i++) add(a + (b - a) * i / n, 'knife', { pan }); };
  knives(T.hookA, 5, .1); knives(T.hookB, 6, .1); add(T.sealX, 'seal', { big: 0 });
  add(T.sunUp[0], 'sunrise'); add(T.rays[0], 'ray');
  knives(T.boardA, 4, .1); knives(T.boardB, 4, .1);
  add(T.push[0], 'push');
  add(T.pulse1, 'pulse', { i: 0 }); add(T.pulse2, 'pulse', { i: 1 });
  T.cheek.forEach(s => knives(s, 4, -.1));
  add(T.dive[0], 'dive'); add(T.silence[0], 'silence'); add(T.timp, 'timpani'); add(T.carve[0], 'carve');
  add(12.6, 'pack');
  T.tags.forEach(a => knives([a, a + T.tagCut], 4, 0)); knives(T.strip, 5, 0);
  add(T.tilt[0], 'tilt');
  knives(T.endA, 5, .1); knives(T.endB, 4, .1); knives(T.endC, 3, .1);
  add(T.sealD, 'seal', { big: 1 }); add(T.peel[0], 'peel');
  return E.sort((a, b) => a.t - b.t);
})();

window.render(0);
window.READY = true;
