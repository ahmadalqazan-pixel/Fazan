// Dermavia · Dark Spots — Scratchboard Long Take, 26 s, 1080×1920.
// One take: a night sky over Baghdad rooftops with the hook cut into it; dawn carved open; a woman walks out into the sun;
// a ray of light leads through steam into the skin, where ink pools (melanin) spread with each pulse of sun; through a
// pore-arch to a bathroom shelf with the cream and its ingredients; out of the window over the rooftops by day; the seal;
// the sheet peels to the real product photo.
import * as THREE from 'three';
import { mulberry, clamp, lerp, ss, eio, seg, track, hash } from '/core/lib.js';
import { C, U, carveMat, skinMat, skyMat, billboardMat, wallMat, groundMat, woodMat, tileMat, inkMat, paperMat, rayMat } from './look.js';
import { palmAtlas, womanAtlas, sunCanvas } from './textures.js';
import { lineCanvas, sealCanvas, panelCanvas, drawPanel, labelCanvas, noticeCanvas, AR } from './props.js';
import { T, BEAT } from './timeline.js';

const Q = new URLSearchParams(location.search);
const W_ = innerWidth || 1080, H_ = innerHeight || 1920, SS = +(Q.get('ss') || 2);
window.DUR = T.DUR;

// ---------------------------------------------------------------- fonts and the photo, before anything is drawn
for (const [fam, file] of [['NaskhB', 'NotoNaskhArabic-Bold.ttf'], ['SerifB', 'NotoSerif-Bold.ttf']]) {
  const f = await new FontFace(fam, `url(./fonts/${file})`, { weight: '700' }).load(); document.fonts.add(f);
}
const PHOTO = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = './assets/product.jpg'; });

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W_, H_, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
document.body.appendChild(renderer.domElement);
const rtA = new THREE.WebGLRenderTarget(W_ * SS, H_ * SS, { samples: 4 });
const scene = new THREE.Scene(); scene.background = C.ink;
const camera = new THREE.PerspectiveCamera(60, W_ / H_, .3, 9000);
export function canvasTex(c, mips = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; t.generateMipmaps = mips;
  t.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
  return t;
}
function billboards(count, mat) {
  const base = new THREE.PlaneGeometry(1, 1); base.translate(0, .5, 0);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
  g.setAttribute('aOff', new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('aSize', new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2));
  g.setAttribute('aTile', new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4));
  g.setAttribute('aRot', new THREE.InstancedBufferAttribute(new Float32Array(count), 1));
  g.instanceCount = count;
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}
function fillBoards(mesh, list, cols) {
  const a = mesh.geometry.attributes;
  list.forEach(([x, y, z, w, h, v], i) => {
    a.aOff.array.set([x, y, z], i * 3); a.aSize.array.set([w, h], i * 2);
    a.aTile.array.set([(v % cols) / cols, 0, 1 / cols, 1], i * 4);
  });
  mesh.geometry.instanceCount = list.length;
  for (const k in a) a[k].needsUpdate = true;
}
const box = (parent, w, h, d, x, y, z, mat, ry = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m; };

// ---------------------------------------------------------------- the sky (travels with the camera)
const sky = new THREE.Mesh(new THREE.SphereGeometry(8000, 64, 32), skyMat); sky.frustumCulled = false; scene.add(sky);
const sunM = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: canvasTex(sunCanvas()), transparent: true, depthWrite: false, alphaTest: .4 }));
sunM.renderOrder = 1; scene.add(sunM);

// ================================================================ the city (origin): flat roofs, tanks, domes, a minaret, palms
const CITY = new THREE.Group(); scene.add(CITY);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), groundMat); ground.rotation.x = -Math.PI / 2; CITY.add(ground);
const HERO = { roof: 9, half: 6.5 };
const PALMS = [];
{
  const R = mulberry(1258);
  const house = (x, z, w, d, h, tank, stair) => {
    box(CITY, w, h, d, x, h / 2, z, wallMat);
    // parapet
    const ph = .7, t = .3;
    box(CITY, w, ph, t, x, h + ph / 2, z + d / 2 - t / 2, wallMat); box(CITY, w, ph, t, x, h + ph / 2, z - d / 2 + t / 2, wallMat);
    box(CITY, t, ph, d, x + w / 2 - t / 2, h + ph / 2, z, wallMat); box(CITY, t, ph, d, x - w / 2 + t / 2, h + ph / 2, z, wallMat);
    if (tank) { const tx = x + (R() - .5) * w * .5, tz = z + (R() - .5) * d * .5; box(CITY, 1.6, 1.1, 1.6, tx, h + .55, tz, wallMat); const c = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, 1.5, 14), inkMat); c.position.set(tx, h + 1.85, tz); CITY.add(c); }
    if (stair) box(CITY, 2.6, 2.6, 2.6, x + (R() - .5) * w * .4, h + 1.3, z + (R() - .5) * d * .4, wallMat);
  };
  for (let i = -7; i <= 7; i++) for (let j = -16; j <= 4; j++) {
    const x = i * 16 + (R() - .5) * 3, z = j * 16 + (R() - .5) * 3;
    if (i === 0 && j === 0) continue;
    if (Math.hypot(x + 25, z + 110) < 22 || Math.hypot(x - 42, z + 190) < 26) continue;   // the mosques' courts
    if (i === 0 && j >= 1 && j <= 3) continue;   // keep the camera's lane over the street clear
    const w = 10 + R() * 4, d = 10 + R() * 4, h = 6 + R() * 7 + (j < -9 ? R() * 4 : 0);
    house(x, z, w, d, h, R() < .55, R() < .3);
    if (R() < .3) PALMS.push([x + w / 2 + 2.5, 0, z + (R() - .5) * d, 5 + R() * 2.5, 12 + R() * 6, Math.floor(R() * 4)]);
  }
  // the hero house: the stairwell with its door, the tank on a stand, the board
  box(CITY, 13, HERO.roof, 13, 0, HERO.roof / 2, 0, wallMat);
  for (const [w, d, x, z] of [[13, .3, 0, 6.35], [13, .3, 0, -6.35], [.3, 13, 6.35, 0], [.3, 13, -6.35, 0]]) box(CITY, w, .8, d, x, HERO.roof + .4, z, wallMat);
  box(CITY, 2.8, 2.7, 2.8, -3.5, HERO.roof + 1.35, -2.6, wallMat);
  // mosques: a ribbed dome on a drum, a minaret with its balcony
  const dome = (x, z, r, base) => {
    box(CITY, r * 2.4, base, r * 2.4, x, base / 2, z, wallMat);
    const dr = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, r * .5, 16), carveMat(1)); dr.position.set(x, base + r * .25, z); CITY.add(dr);
    const g = new THREE.SphereGeometry(r, 16, 7, 0, Math.PI * 2, 0, Math.PI / 2).toNonIndexed();
    const m = new THREE.Mesh(g, carveMat(1)); m.position.set(x, base + r * .5, z); m.scale.y = 1.15; CITY.add(m);
    const s = new THREE.Mesh(new THREE.ConeGeometry(r * .08, r * .5, 6), inkMat); s.position.set(x, base + r * .5 + r * 1.15 + r * .2, z); CITY.add(s);
  };
  dome(-25, -110, 10, 9); dome(42, -190, 14, 11);
  const minaret = (x, z, h) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, h, 10), carveMat(1)); c.position.set(x, h / 2, z); CITY.add(c);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 1.6, 1.2, 12), inkMat); b.position.set(x, h * .78, z); CITY.add(b);
    const t = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.2, 10), carveMat(1)); t.position.set(x, h + 1.6, z); CITY.add(t);
  };
  minaret(-6, -122, 38); minaret(20, -196, 44);
  // palms along the lane and in courtyards near the hero house
  for (const p of [[-9, 0, 9, 6, 14, 0], [9.5, 0, -4, 6, 15, 2], [-10, 0, -14, 6, 13, 1], [10, 0, 14, 6, 16, 3], [-24, 0, -96, 7, 17, 2], [-36, 0, -118, 7, 16, 0]]) PALMS.push(p);
}
const palms = billboards(PALMS.length, billboardMat(canvasTex(palmAtlas()), {})); CITY.add(palms);
fillBoards(palms, PALMS.map(([x, y, z, w, h, v]) => [x, y, z, w, h, v]), 4);
// the stairwell door (a paper leaf hinged on its left edge, an ink opening behind it)
const doorHole = new THREE.Mesh(new THREE.PlaneGeometry(1, 2.1), inkMat); doorHole.position.set(-3.5, HERO.roof + 1.05, -1.19); CITY.add(doorHole);
const doorPivot = new THREE.Group(); doorPivot.position.set(-4.0, HERO.roof + 1.05, -1.18); CITY.add(doorPivot);
const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(1, 2.1, .06), woodMat); doorLeaf.position.x = .5; doorPivot.add(doorLeaf);
// the tank on its stand and the board hung on it
{
  for (const [dx, dz] of [[-.7, -.7], [.7, -.7], [-.7, .7], [.7, .7]]) box(CITY, .14, 1.3, .14, 3.4 + dx, HERO.roof + .65, -3 + dz, inkMat);
  box(CITY, 1.8, .15, 1.8, 3.4, HERO.roof + 1.35, -3, inkMat);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, 1.8, 18), inkMat); c.position.set(3.4, HERO.roof + 2.35, -3); CITY.add(c);
}
const BOARD = { w: 3.4, h: 1.7 };
const boardP = panelCanvas({ W: 1024, H: 512, ground: 'wood', seed: 4, lines: [
  { id: 'board-1', text: 'كريم تفتيح…', f: 'ar', px: 150, x: 930, y: 215, align: 'right' },
  { id: 'board-2', text: 'بلا واقي شمس', f: 'ar', px: 150, x: 930, y: 420, align: 'right' },
] });
const boardTex = canvasTex(boardP.c);
const boardM = new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w, BOARD.h), new THREE.MeshBasicMaterial({ map: boardTex }));
boardM.position.set(3.25, HERO.roof + 2.3, -1.98); boardM.rotation.y = -.12; CITY.add(boardM);
const boardBack = new THREE.Mesh(new THREE.BoxGeometry(BOARD.w + .12, BOARD.h + .12, .08), inkMat); boardBack.position.copy(boardM.position).add(new THREE.Vector3(0, 0, -.05)); boardBack.rotation.y = -.12; CITY.add(boardBack);
// the woman
const WOMAN_H = 1.72;
const woman = billboards(1, billboardMat(canvasTex(womanAtlas()), {})); CITY.add(woman);
const womanAt = t => {
  const u = ss(seg(t, T.walk[0], T.walk[1]));
  const x = lerp(-3.5, -1.4, u), z = lerp(-1.0, 1.4, u);
  let pose = 2;
  if (t >= T.walk[0] && t < T.walk[1]) pose = Math.floor((t - T.walk[0]) / .3) % 2;
  if (t >= T.shade) pose = 3;
  return { x, y: HERO.roof, z, pose, out: t >= T.walk[0] - .05 };
};
// the ray of sunlight: a strip of yellow cuts from the sun to her face
const rayGeo = new THREE.PlaneGeometry(1, 1);
const rayCity = new THREE.Mesh(rayGeo, rayMat.clone()); rayCity.matrixAutoUpdate = false; rayCity.renderOrder = 2; scene.add(rayCity);
function aimRay(mesh, a, b, width) {
  const A = b.clone().sub(a), len = A.length(); A.normalize();
  const m = a.clone().add(b).multiplyScalar(.5), toCam = camera.position.clone().sub(m).normalize();
  let side = new THREE.Vector3().crossVectors(A, toCam); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
  const nrm = new THREE.Vector3().crossVectors(side, A);
  mesh.matrix.makeBasis(A.multiplyScalar(len), side.multiplyScalar(width), nrm).setPosition(m);
  mesh.matrixWorldNeedsUpdate = true;
}

// ================================================================ the skin (x = 4000): faceted paper terrain, ink pools
const SK = new THREE.Vector3(4000, 0, 0);
const skinH = (x, z) => { const X = x - SK.x, Z = z; return 1.6 * Math.sin(X * .11 + Z * .05) + 1.1 * Math.sin(Z * .17 - X * .07 + 1.3) + .7 * Math.sin((X + Z) * .31) + 0.5 * Math.sin(X * .53 - Z * .41 + .4); };
{
  const n = 90, size = 240, pos = [];
  const P = (i, j) => { const x = SK.x - size / 2 + i * size / n, z = -150 + j * size / n; const r = mulberry(i * 997 + j)(); return [x + (r - .5) * 1.1, skinH(x, z) + (r - .5) * .35, z + (mulberry(i * 31 + j * 7)() - .5) * 1.1]; };
  const grid = []; for (let i = 0; i <= n; i++) { grid.push([]); for (let j = 0; j <= n; j++) grid[i].push(P(i, j)); }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const a = grid[i][j], b = grid[i + 1][j], c = grid[i][j + 1], d = grid[i + 1][j + 1]; pos.push(...a, ...c, ...b, ...b, ...c, ...d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.Mesh(g, skinMat); m.frustumCulled = false; scene.add(m);
}
// the pools (melanin): centres near the glide path; uGrow spreads them with each pulse
{
  const R = mulberry(77), pools = skinMat.uniforms.uPools.value;
  const fixed = [[4001.5, 44, 3.2], [3994, 30, 4.2], [4007, 25, 2.6], [3999, 12, 2.4], [4006.5, 2, 3.4], [3993.5, -6, 3.8], [4002, -36, 5.0], [3990, -30, 4.4], [4013, -18, 3.2], [3985, 10, 3.6], [4016, 34, 4.0], [3998, 64, 3.0], [4008, -60, 5.5], [3992, -64, 6]];
  fixed.forEach(([x, z, r], i) => pools[i].set(x, z, r, R()));
}
// the carved stone and the pore-arch with its dark passage
const STONE = { x: 3998.6, z: 8.2, w: 4.6, h: 3.1 };
const stoneP = panelCanvas({ W: 1024, H: 690, ground: 'stone', seed: 9, lines: [
  { id: 'stone-1', text: 'الشمس ←', f: 'ar', px: 132, x: 950, y: 190, align: 'right' },
  { id: 'stone-2', text: 'ميلانين أكثر ←', f: 'ar', px: 132, x: 950, y: 400, align: 'right' },
  { id: 'stone-3', text: 'بقعة أغمق', f: 'ar', px: 132, x: 950, y: 610, align: 'right' },
] });
const stoneTex = canvasTex(stoneP.c);
const stoneY = skinH(STONE.x, STONE.z) + STONE.h / 2 + .3;
const stoneBody = new THREE.Mesh(new THREE.BoxGeometry(STONE.w + .3, STONE.h + .3, 1.0).toNonIndexed(), carveMat(1)); stoneBody.position.set(STONE.x, stoneY - .1, STONE.z - .55); stoneBody.rotation.set(-.06, .3, .02); scene.add(stoneBody);
const stoneM = new THREE.Mesh(new THREE.PlaneGeometry(STONE.w, STONE.h), new THREE.MeshBasicMaterial({ map: stoneTex }));
stoneM.position.set(STONE.x, stoneY - .1, STONE.z - .55); stoneM.rotation.copy(stoneBody.rotation); stoneM.translateZ(.505); scene.add(stoneM);
const ARCH = new THREE.Vector3(4004, 0, -16); ARCH.y = skinH(ARCH.x, ARCH.z) - .6;
{
  const a = new THREE.Mesh(new THREE.TorusGeometry(3.6, 1.2, 8, 22, Math.PI).toNonIndexed(), carveMat(1)); a.position.copy(ARCH); scene.add(a);
  const tun = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 16, 20, 1, false), new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.DoubleSide }));
  tun.rotation.x = Math.PI / 2; tun.position.set(ARCH.x, ARCH.y + .1, ARCH.z - 8); scene.add(tun);
}
// rays of sun falling on the pools
const skinRays = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(rayGeo, rayMat.clone()); m.matrixAutoUpdate = false; m.renderOrder = 2; scene.add(m); return m; });
const RAY_T = [[3994, 30], [4001.5, 44], [4006.5, 2], [3993.5, -6]];

// ================================================================ the bathroom (x = −4000; units ×10)
const BA = new THREE.Vector3(-4000, 0, 0);
{
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(120, 90), tileMat); wall.position.set(BA.x, 45, 0); scene.add(wall);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), tileMat); w.rotation.y = -s * Math.PI / 2; w.position.set(BA.x + s * 40, 45, 45); scene.add(w); }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), inkMat); floor.rotation.x = -Math.PI / 2; floor.position.set(BA.x, 0, 50); scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), inkMat); ceil.rotation.x = Math.PI / 2; ceil.position.set(BA.x, 70, 50); scene.add(ceil);
  box(scene, 30, 1.4, 6, BA.x, 14.3, 3, woodMat);                                   // the shelf
  for (const s of [-1, 1]) box(scene, 1, 3, 4, BA.x + s * 12, 12.2, 2, inkMat);    // its brackets
  // the window above the tiles: a paper opening crossed by ink bars
  const win = new THREE.Mesh(new THREE.PlaneGeometry(16, 11), paperMat); win.position.set(BA.x, 60, .1); scene.add(win);
  box(scene, 17, .8, .6, BA.x, 54.4, .3, inkMat); box(scene, 17, .8, .6, BA.x, 65.6, .3, inkMat);
  box(scene, .8, 12, .6, BA.x - 8.2, 60, .3, inkMat); box(scene, .8, 12, .6, BA.x + 8.2, 60, .3, inkMat); box(scene, .6, 11, .5, BA.x, 60, .3, inkMat);
  // the arched passage the camera comes out of
  const tun = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 40, 24, 1, true), new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.DoubleSide }));
  tun.rotation.x = Math.PI / 2; tun.position.set(BA.x + 8, 31, 92); scene.add(tun);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(9.2, 24), inkMat); cap.position.set(BA.x + 8, 31, 112); scene.add(cap);
  const rim = new THREE.Mesh(new THREE.RingGeometry(9, 11, 24, 1, 0, Math.PI * 2), paperMat); rim.position.set(BA.x + 8, 31, 71.9); rim.rotation.y = Math.PI; scene.add(rim);
}
// the bottle: a carved prop. Body with the label wrapped round it, a collar, the pump and its clear cap drawn as cuts
const LABEL = labelCanvas();
const BOT = { x: BA.x - 2, y: 15.0, r: 2.25, h: 7.6, yaw: .25 };
const bottle = new THREE.Group(); bottle.position.set(BOT.x, BOT.y, 3.2); bottle.rotation.y = Math.PI + BOT.yaw; scene.add(bottle);
{
  const body = new THREE.Mesh(new THREE.CylinderGeometry(BOT.r, BOT.r, BOT.h, 48, 1, true), new THREE.MeshBasicMaterial({ map: canvasTex(LABEL.c) }));
  body.position.y = BOT.h / 2; bottle.add(body); bottle.userData.body = body;
  const lid = new THREE.Mesh(new THREE.CircleGeometry(BOT.r, 48), inkMat); lid.rotation.x = Math.PI / 2; lid.position.y = .02; bottle.add(lid);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(BOT.r * .98, BOT.r, 1.0, 48), new THREE.MeshBasicMaterial({ color: C.ink })); collar.position.y = BOT.h + .5; bottle.add(collar);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(BOT.r * .99, .07, 6, 48), paperMat); ring.rotation.x = Math.PI / 2; ring.position.y = BOT.h + .2; bottle.add(ring);
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(.8, 1.0, 2.0, 24), paperMat); pump.position.y = BOT.h + 2.0; bottle.add(pump);
  const nozzle = new THREE.Mesh(new THREE.BoxGeometry(1.8, .5, .6), paperMat); nozzle.position.set(-.6, BOT.h + 3.2, 0); bottle.add(nozzle);
  // the clear cap: only its edges, cut in ink
  const capG = new THREE.EdgesGeometry(new THREE.CylinderGeometry(BOT.r * .98, BOT.r * .98, 4.2, 18), 1);
  const capE = new THREE.LineSegments(capG, new THREE.LineBasicMaterial({ color: C.ink })); capE.position.y = BOT.h + 3.1; bottle.add(capE);
  const capIn = new THREE.Mesh(new THREE.CylinderGeometry(BOT.r * .97, BOT.r * .97, 4.2, 36, 1, true), new THREE.MeshBasicMaterial({ color: C.paper, transparent: true, opacity: .0 })); capIn.position.y = BOT.h + 3.1; bottle.add(capIn);
}
// the ingredient tiles and the strip under them
const TILE = 8.0, TILES = [
  { id: 'tile-1', text: 'Alpha-arbutin', x: -4.4, y: 44.6 }, { id: 'tile-2', text: 'Vitamin C', x: 4.4, y: 44.6 },
  { id: 'tile-3', text: 'Lactic acid', x: -4.4, y: 35.8 }, { id: 'tile-4', text: 'Panthenol', x: 4.4, y: 35.8 },
].map((d, i) => {
  const P = panelCanvas({ W: 512, H: 512, ground: 'tile', seed: 30 + i, lines: [{ ...d, f: 'la', px: 60, x: 256, y: 280, align: 'center' }] });
  const tex = canvasTex(P.c), m = new THREE.Mesh(new THREE.PlaneGeometry(TILE, TILE), new THREE.MeshBasicMaterial({ map: tex }));
  m.position.set(BA.x + d.x, d.y, .15); scene.add(m);
  return { ...d, P, tex, m };
});
const STRIP = { w: 17, h: 3.2 };
const stripP = panelCanvas({ W: 1700, H: 320, ground: 'tile', seed: 41, lines: [{ id: 'strip', text: 'يقللون إنتاج الصبغة', f: 'ar', px: 150, x: 850, y: 210, align: 'center' }] });
const stripTex = canvasTex(stripP.c);
const stripM = new THREE.Mesh(new THREE.PlaneGeometry(STRIP.w, STRIP.h), new THREE.MeshBasicMaterial({ map: stripTex })); stripM.position.set(BA.x, 29.4, .15); scene.add(stripM);

// ================================================================ type in the sky: plates placed in direction space
const DEG = Math.PI / 180, F = (H_ / 2) / Math.tan(30 * DEG);
// a plate whose right edge sits at azimuth azR, top at elevation elTop, drawn so it reads at `px` screen pixels per canvas px
function plateRect(lc, azR, elTop, k, pitch) {
  const hS = lc.c.height * k, wS = lc.c.width * k;
  const elSpan = hS / F, elMid = elTop - elSpan / 2;
  const kAz = Math.cos(elMid) / (Math.cos(elMid) * Math.cos(pitch) + Math.sin(elMid) * Math.sin(pitch));
  const azSpan = wS / (F * kAz);
  return new THREE.Vector4(azR - azSpan, elTop - elSpan, azR, elTop);
}
const HOOK_PITCH = 17 * DEG, END_PITCH = 14 * DEG;
const PL = {
  hookA: lineCanvas('هاي الغلطة', 190), hookB: lineCanvas('تخلي البقع تغمق', 190),
  endA: lineCanvas('من داخل عيادة ديرمافيا', 160), endB: lineCanvas('اطلب عبر الواتساب', 140), endC: lineCanvas('أو الدايركت', 140),
};
const sealX = { c: sealCanvas('x') }, sealD = sealCanvas('d');
const HK = 96 / 190, EK = 74 / 160;
const R_ = {
  hookA: plateRect(PL.hookA, 9 * DEG, 40 * DEG, HK, HOOK_PITCH),
  hookB: plateRect(PL.hookB, 9 * DEG, 33.4 * DEG, HK, HOOK_PITCH),
  endA: plateRect(PL.endA, 9.5 * DEG, 35.5 * DEG, EK, END_PITCH),
  endB: plateRect(PL.endB, 9.5 * DEG, 30.0 * DEG, EK, END_PITCH),
  endC: plateRect(PL.endC, 9.5 * DEG, 25.3 * DEG, EK, END_PITCH),
};
R_.sealX = plateRect(sealX, R_.hookA.x - 1.2 * DEG, 40.6 * DEG, 150 / 512, HOOK_PITCH);
const SLOT = { hookA: 0, hookB: 1, sealX: 2, endA: 3, endB: 4, endC: 5 };
for (const [k, s] of Object.entries(SLOT)) {
  skyMat.uniforms['tP' + s].value = canvasTex(k === 'sealX' ? sealX.c : PL[k].c, true);
  skyMat.uniforms['uR' + s].value = R_[k];
  skyMat.uniforms['uM' + s].value = k === 'sealX' ? 1 : 0;
}

// ================================================================ the camera: one take in five movements
const CITY_KEYS = [
  [0.0, [0, 22, 36, 0, 22 + Math.tan(HOOK_PITCH) * 100, -64]],
  [3.5, [0, 22.4, 35.6, 0, 22.4 + Math.tan(HOOK_PITCH) * 100, -64.4]],
  [4.9, [.6, 25, 31, 1.5, 6, -60]],
  [6.3, [-1.6, 14.6, 15.2, 1.0, 10.1, -1.2]],
  [7.2, [-1.7, 14.4, 14.6, .9, 10.2, -1.2]],
  [7.6, [-.8, 12.4, 7.6, -1.2, 10.6, 1.0]],
  [8.1, [-1.25, 10.95, 3.2, -1.4, 10.7, 1.2]],
];
const camCity1 = track(CITY_KEYS);
const SKIN_KEYS = [
  [8.1, [4002, 6.6, 70, 4000.5, 2.5, 20]],
  [9.5, [4002.8, 5.6, 45, 4000.5, 2.2, 0]],
  [10.7, [4002.4, 5.3, 25, 3999.6, 2.8, 0]],
  [11.0, [4000.6, 5.0, 19.4, 3998.4, 3.3, 3]],
  [13.75, [4000.4, 4.9, 18.6, 3998.5, 3.4, 3]],
  [14.0, [4003.6, 3.9, 6, ARCH.x, ARCH.y + 1.2, -30]],
  [14.22, [ARCH.x, ARCH.y + .9, ARCH.z - 2.5, ARCH.x, ARCH.y + .9, -60]],
];
const camSkin = track(SKIN_KEYS);
const BATH_KEYS = [
  [14.22, [BA.x + 8, 31, 100, BA.x + 6, 30, 0]],
  [14.7, [BA.x + 9, 31, 64, BA.x + 3, 30, 0]],
  [15.2, [BA.x + 11, 30.5, 41, BA.x + .5, 28.4, 0]],
  [20.6, [BA.x + 10.5, 30.5, 40, BA.x + .5, 28.4, 0]],
  [21.15, [BA.x + 2, 56, 14, BA.x, 60, 0]],
];
const camBath = track(BATH_KEYS);
const DAY_KEYS = [
  [21.15, [-.5, 13.5, 9, -.5, 13.5 + Math.tan(4 * DEG) * 100, -91]],
  [22.3, [0, 21.6, 33.4, 0, 21.6 + Math.tan(END_PITCH) * 100, -66.6]],
  [26.0, [0, 22, 34, 0, 22 + Math.tan(END_PITCH) * 100, -66]],
];
const camDay = track(DAY_KEYS);
function shotAt(t) {
  if (t < T.cut1) return { k: 'city', c: camCity1(t), fov: t < 5 ? 60 : lerp(60, 52, ss(seg(t, 5, 6.5))) };
  if (t < T.cut2) return { k: 'skin', c: camSkin(t), fov: 54 };
  if (t < T.cut3) return { k: 'bath', c: camBath(t), fov: 58 };
  return { k: 'day', c: camDay(t), fov: 60 };
}
window.CAMAT = t => { const s = shotAt(t); return { x: s.c[0], y: s.c[1], z: 1 }; };

// ================================================================ light and sky per shot
const sunDir = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
function setSky(t, k) {
  const u = skyMat.uniforms;
  for (let s = 0; s < 6; s++) u['uA' + s].value = 0;
  if (k === 'city') {
    const dawn = seg(t, T.dawn[0], T.dawn[1]);
    u.uFront.value = lerp(-.02, .55, dawn);
    u.uStars.value = 1 - ss(seg(t, T.dawn[0], T.dawn[0] + 2.4));
    u.uDense.value = ss(seg(t, 6.0, 8.0)) * .5;
    U.uNight.value = 1 - ss(seg(t, 4.0, 6.0));
    const el = lerp(-3.5, 3.2, ss(seg(t, 4.2, 7.0))) * DEG;
    U.uSun.value.copy(sunDir(4 * DEG, el));
    U.uWarm.value = ss(seg(t, 4.4, 6.0));
    const moon = new THREE.Vector3(-0.92, 0.36, 0.3).normalize(), sunL = new THREE.Vector3(.2, .35, -.9).normalize();
    U.uL.value.copy(moon).lerp(sunL, ss(seg(t, 3.8, 5.6))).normalize();
    u.uA0.value = ss(seg(t, T.hookA[0], T.hookA[1])); u.uA1.value = ss(seg(t, T.hookB[0], T.hookB[1]));
    u.uA2.value = t >= T.sealX ? 1 : 0;
    // the hook is lifted out of the sky as the dawn reaches it
    if (t > 5.2) { u.uA0.value = u.uA1.value = u.uA2.value = 1 - ss(seg(t, 5.2, 5.9)); }
    sunM.visible = t > 4.0;
  } else if (k === 'skin') {
    u.uFront.value = 2; u.uStars.value = 0; u.uDense.value = 1; U.uNight.value = 0;
    U.uSun.value.copy(sunDir(0, 40 * DEG));
    U.uL.value.set(.35, .85, .4).normalize();
    U.uWarm.value = .3 + .7 * pulseEnv(t);
    sunM.visible = false;
  } else if (k === 'bath') {
    u.uFront.value = 2; u.uStars.value = 0; u.uDense.value = 1; U.uNight.value = 0; U.uWarm.value = 0;
    U.uL.value.set(-.25, .55, .8).normalize();
    sunM.visible = false;
  } else {
    u.uFront.value = 2; u.uStars.value = 0; u.uDense.value = 1; U.uNight.value = 0; U.uWarm.value = .12;
    U.uSun.value.copy(sunDir(-50 * DEG, 50 * DEG));
    U.uL.value.set(-.45, .75, .5).normalize();
    u.uA3.value = ss(seg(t, T.endA[0], T.endA[1])); u.uA4.value = ss(seg(t, T.endB[0], T.endB[1])); u.uA5.value = ss(seg(t, T.endC[0], T.endC[1]));
    sunM.visible = false;
  }
  sky.position.copy(camera.position); U.uCam.value.copy(camera.position);
  const sd = U.uSun.value; sunM.position.copy(camera.position).addScaledVector(sd, 3000); sunM.lookAt(camera.position); sunM.scale.setScalar(620);
}
const pulseEnv = t => Math.max(Math.exp(-Math.pow((t - T.pulse1 - .15) / .35, 2)), Math.exp(-Math.pow((t - T.pulse2 - .15) / .35, 2)));

// ================================================================ the print pass (from the kit): fibre, mottling, flicker,
// the steam whiteout, the sheet peeled from the bottom-left corner onto the pasted notice, the seal laid on last
const noticeTex = canvasTex(noticeCanvas(PHOTO, W_, H_), false);
const overlay = document.createElement('canvas'); overlay.width = W_; overlay.height = H_;
const overlayTex = canvasTex(overlay, false);
const printMat = new THREE.ShaderMaterial({
  uniforms: { tA: { value: rtA.texture }, tB: { value: noticeTex }, tSub: { value: overlayTex }, uT: { value: 0 }, uRes: { value: new THREE.Vector2(W_, H_) },
    uPeel: { value: -1 }, uWhite: { value: 0 }, uPaper: U.uPaper, uInk: U.uInk },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.,1.); }`,
  fragmentShader: `
    float h11(float n){ return fract(sin(n*127.1+311.7)*43758.5453); }
    float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
    uniform sampler2D tA, tB, tSub; uniform float uT, uPeel, uWhite; uniform vec2 uRes; uniform vec3 uPaper, uInk; varying vec2 vUv;
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
      if (uWhite > 0.) {
        float row = floor(uv.y*200.), f = abs(fract(uv.y*200.)-.5);
        float r = h11(row*1.7), run = vn(vec2(uv.x*2. + r*20., row*.37));
        float w = smoothstep(.0, .25, uWhite*1.8 - r*.5 - run*.5 + (.5-f)*.3);
        c = mix(c, uPaper*(1. + (fib-.5)*.05), clamp(w, 0., 1.));
      }
      c *= 1. + (h11(tf*13.7)-.5)*.03;
      vec2 q = uv-.5; c *= 1. - dot(q,q)*.08;
      if (uPeel >= 0.) {
        // the sheet is peeled from the bottom-left corner; the pasted notice lies under it
        vec2 asp = vec2(uRes.x/uRes.y, 1.);
        vec2 p = uv*asp, D = normalize(asp);
        float diag = length(asp), s = uPeel*(diag+.15);
        float d = dot(p, D);
        vec3 under = texture2D(tB, uv).rgb;
        if (d < s) c = under * (1. - .35*smoothstep(.1, 0., s - d));
        else if (d < 2.*s) {
          vec2 pm = p - 2.*(d - s)*D, um = pm/asp;
          if (um.x <= 1. && um.y <= 1. && um.x >= 0. && um.y >= 0.) {
            float k = (d - s)/max(s, 1e-3);
            vec3 ghost = texture2D(tA, vec2(1.-um.x, um.y)).rgb;
            vec3 back = mix(uPaper, ghost, .13) * (.8 + .26*smoothstep(0., .5, k) - .1*smoothstep(.5, 1., k));
            back *= 1. + (fbm(um*vec2(300.,500.))-.5)*.05;
            c = back;
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

// ================================================================ the D seal: pressed onto the day sky, kept on top of the notice
const toScreen = v => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * W_, (1 - p.y) / 2 * H_, p.z]; };
const dirPt = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).multiplyScalar(1000).add(camera.position);
let overlayKey = '';
function drawOverlay(t, k) {
  const on = k === 'day' && t >= T.sealD;
  const press = on ? clamp((t - T.sealD) / .08) : 0;
  const key = on ? press.toFixed(2) + (t < T.sealD + .12 ? 'a' : 'b') : '';
  if (key === overlayKey) return; overlayKey = key;
  const g = overlay.getContext('2d'); g.clearRect(0, 0, W_, H_);
  if (on) {
    const S = 230 * (1.25 - .25 * press);
    const [x, y] = [215, 735];    // left, under the closing lines
    g.globalAlpha = press; g.drawImage(sealD, x - S / 2, y - S / 2, S, S); g.globalAlpha = 1;
  }
  overlayTex.needsUpdate = true;
}

// ================================================================ render
function applyCam(c, fov) {
  camera.position.set(c[0], c[1], c[2]); camera.lookAt(c[3], c[4], c[5]);
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
}
let SHOT = null;
const panelAmt = (t, [a, b]) => clamp((t - a) / (b - a));
window.render = (t) => {
  const shot = SHOT = shotAt(t);
  if (Q.get('cam')) shot.c = Q.get('cam').split(',').map(Number);
  // the seal lands: one frame of shake
  if (shot.k === 'day' && t >= T.sealD + .07 && t < T.sealD + .105) shot.c = shot.c.map((v, i) => i < 3 ? v + [.03, -.04, 0][i] : v);
  applyCam(shot.c, shot.fov);
  setSky(t, shot.k);
  rayMat.uniforms; // (each ray has its own clone)
  // the city: door, woman, board, ray
  const door = ss(seg(t, T.door, T.door + .35)); doorPivot.rotation.y = -door * 1.9;
  const w = womanAt(t);
  fillBoards(woman, w.out ? [[w.x, w.y, w.z, WOMAN_H * .5, WOMAN_H, w.pose]] : [], 4);
  if (drawPanel(boardP, [panelAmt(t, T.boardA), panelAmt(t, T.boardB)])) boardTex.needsUpdate = true;
  const rayOn = shot.k === 'city' && t > T.ray[0];
  rayCity.visible = rayOn;
  if (rayOn) {
    const head = new THREE.Vector3(w.x + .05, w.y + WOMAN_H * .9, w.z);
    aimRay(rayCity, head.clone().addScaledVector(U.uSun.value, 80), head, 1.3);
    rayCity.material.uniforms.uAmt.value = ss(seg(t, T.ray[0], T.ray[1])); rayCity.material.uniforms.uT.value = t;
  }
  // the skin: pools spread with each pulse of sun, rays thicken
  skinMat.uniforms.uGrow.value = 1 + .32 * ss(seg(t, T.pulse1, T.pulse1 + .45)) + .3 * ss(seg(t, T.pulse2, T.pulse2 + .45));
  skinMat.uniforms.uPulse.value = pulseEnv(t); skinMat.uniforms.uT.value = t;
  skinRays.forEach((m, i) => {
    m.visible = shot.k === 'skin';
    if (!m.visible) return;
    const [x, z] = RAY_T[i], a = new THREE.Vector3(x, skinH(x, z) + .2, z);
    aimRay(m, a.clone().addScaledVector(new THREE.Vector3(-.25, 1, .35).normalize(), 70), a, 1.6 + 1.6 * pulseEnv(t));
    m.material.uniforms.uThick.value = 1 + 1.4 * pulseEnv(t); m.material.uniforms.uT.value = t; m.material.uniforms.uAmt.value = 1;
  });
  if (drawPanel(stoneP, T.stone.map(s => panelAmt(t, s)))) stoneTex.needsUpdate = true;
  // the shelf
  TILES.forEach((d, i) => { if (drawPanel(d.P, [panelAmt(t, [T.tiles[i], T.tiles[i] + T.tileCut])])) d.tex.needsUpdate = true; });
  if (drawPanel(stripP, [panelAmt(t, T.strip)])) stripTex.needsUpdate = true;
  drawOverlay(t, shot.k);
  renderer.setRenderTarget(rtA); renderer.render(scene, camera);
  printMat.uniforms.uT.value = t;
  printMat.uniforms.uWhite.value = t < T.cut1 + 1 ? (t < T.cut1 ? ss(seg(t, T.whiteIn, T.cut1)) : 1 - ss(seg(t, T.cut1, T.whiteOut)))
    : (t < T.cut3 ? ss(seg(t, T.whiteIn2, T.cut3)) : 1 - ss(seg(t, T.cut3, T.whiteOut2)));
  printMat.uniforms.uPeel.value = t < T.peel[0] ? -1 : eio(seg(t, T.peel[0], T.peel[1]));
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
};

// ================================================================ reading check: every line meant to be read, with its screen box
function boxOf(pts) {
  const s = pts.map(toScreen); if (s.some(p => p[2] > 1 || p[2] < -1)) return null;
  return { x0: Math.min(...s.map(p => p[0])), y0: Math.min(...s.map(p => p[1])), x1: Math.max(...s.map(p => p[0])), y1: Math.max(...s.map(p => p[1])) };
}
function skyBox(id, lc, rect, amt) {
  if (amt <= 0) return [];
  const b = lc.box, az0 = lerp(rect.x, rect.z, b.u0), az1 = lerp(rect.x, rect.z, b.u1), el1 = lerp(rect.y, rect.w, 1 - b.v0), el0 = lerp(rect.y, rect.w, 1 - b.v1);
  const bb = boxOf([dirPt(az0, el0), dirPt(az1, el0), dirPt(az0, el1), dirPt(az1, el1)]);
  return bb ? [{ id, text: lc.text, ...bb }] : [];
}
function meshBoxes(mesh, w, h, P, W, H) {
  mesh.updateMatrixWorld();
  return P.boxes.map(p => {
    const c = [[p.x0, p.y0], [p.x1, p.y0], [p.x0, p.y1], [p.x1, p.y1]].map(([u, v]) => mesh.localToWorld(new THREE.Vector3((u / W - .5) * w, (.5 - v / H) * h, 0)));
    const bb = boxOf(c); return bb && { id: p.id, text: p.text, ...bb };
  }).filter(Boolean);
}
function labelBoxes() {
  const body = bottle.userData.body; body.updateMatrixWorld();
  return LABEL.box.map(b => {
    const pts = [];
    for (const u of [b.u0, (b.u0 + b.u1) / 2, b.u1]) for (const v of [b.v0, b.v1]) { const th = u * Math.PI * 2; pts.push(body.localToWorld(new THREE.Vector3(BOT.r * Math.sin(th), BOT.h / 2 - v * BOT.h, BOT.r * Math.cos(th)))); }
    const bb = boxOf(pts); return bb && { id: b.id, text: b.text, ...bb };
  }).filter(Boolean);
}
window.TEXTS = (t) => {
  const out = [], k = SHOT?.k, u = skyMat.uniforms;
  if (k === 'city' && t < 5.2) {
    out.push(...skyBox('hook-1', PL.hookA, R_.hookA, u.uA0.value), ...skyBox('hook-2', PL.hookB, R_.hookB, u.uA1.value));
  }
  if (k === 'city' && t >= T.boardA[0]) out.push(...meshBoxes(boardM, BOARD.w, BOARD.h, boardP, 1024, 512));
  if (k === 'skin' && t >= T.stone[0][0]) out.push(...meshBoxes(stoneM, STONE.w, STONE.h, stoneP, 1024, 690));
  if (k === 'bath') {
    out.push(...labelBoxes());
    TILES.forEach((d, i) => { if (t >= T.tiles[i]) out.push(...meshBoxes(d.m, TILE, TILE, d.P, 512, 512)); });
    if (t >= T.strip[0]) out.push(...meshBoxes(stripM, STRIP.w, STRIP.h, stripP, 1700, 320));
  }
  if (k === 'day' && t < T.peel[0]) out.push(...skyBox('end-1', PL.endA, R_.endA, u.uA3.value), ...skyBox('end-2', PL.endB, R_.endB, u.uA4.value), ...skyBox('end-3', PL.endC, R_.endC, u.uA5.value));
  return out;
};

// ================================================================ events for the sound
window.EV = (() => {
  const E = [], add = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
  add(0, 'start');
  const knives = (a, b, n, pan = 0) => { for (let i = 0; i < n; i++) add(a + (b - a) * i / n, 'knife', { pan }); };
  knives(...T.hookA, 5, .1); knives(...T.hookB, 6, .1);
  add(T.sealX, 'seal', { big: 0 });
  add(T.door, 'door'); for (let i = 0; i < 5; i++) add(T.walk[0] + i * .3, 'step', { pan: -.3 + i * .06 });
  knives(...T.boardA, 4, .3); knives(...T.boardB, 4, .3);
  add(T.ray[0], 'ray'); add(T.whiteIn, 'steam'); add(T.cut1, 'skin');
  add(T.pulse1, 'pulse', { i: 0 }); add(T.pulse2, 'pulse', { i: 1 });
  T.stone.forEach(([a, b]) => knives(a, b, 4, -.3));
  add(T.musicStop, 'silence'); add(T.arch, 'arch'); add(T.timp, 'timpani'); add(T.cut2, 'bath');
  add(T.settle, 'bottle');
  T.tiles.forEach(a => knives(a, a + T.tileCut, 3, 0)); knives(...T.strip, 5, 0);
  add(T.rise, 'rise'); add(T.whiteIn2, 'window'); add(T.cut3, 'day');
  knives(...T.endA, 5, .1); knives(...T.endB, 4, .1); knives(...T.endC, 3, .1);
  add(T.sealD, 'seal', { big: 1 }); add(T.peel[0], 'peel');
  return E.sort((a, b) => a.t - b.t);
})();

window.render(0);
window.READY = true;
