// Materials: every surface is a scratchboard print — ink, paper, one red (only in the two seals) and a warm yellow
// for sunlight. Knife lines are fixed in world space (or direction space for the sky) so they never slide.
// Adapted from the Scratchboard Long Take print kit (look.js): carveMat, skyMat, billboardMat, concreteMat, woodMat.
import * as THREE from 'three';

THREE.ColorManagement.enabled = false;

export const C = {
  ink: new THREE.Color('#16171b'), paper: new THREE.Color('#ede5cd'),
  red: new THREE.Color('#c4332b'), yellow: new THREE.Color('#dfa443'),
};
const v3 = c => new THREE.Vector3(c.r, c.g, c.b);
export const U = {
  uInk: { value: v3(C.ink) }, uPaper: { value: v3(C.paper) }, uYellow: { value: v3(C.yellow) },
  uL: { value: new THREE.Vector3(-0.92, 0.36, 0.3).normalize() },
  uWarm: { value: 0 }, uCam: { value: new THREE.Vector3() }, uSun: { value: new THREE.Vector3(0, .02, -1).normalize() },
  uNight: { value: 1 },
};

export const GLSL_HASH = /* glsl */`
  float h11(float n){ return fract(sin(n*127.1+311.7)*43758.5453); }
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
`;
const VS_WORLD = `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const VS_WN = `varying vec3 vW; varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;

// fall-line knife cuts on a flat face (shared by carveMat and the skin)
const SCRATCH = /* glsl */`
  float scratches(vec3 p, vec3 n, float spacing, float density, float wmax, float seed){
    vec3 down = vec3(0.,-1.,0.);
    vec3 d = down - n*dot(down,n); float dl = length(d); d = dl > 1e-3 ? d/dl : vec3(0.,0.,1.);
    vec3 side = normalize(cross(n, d));
    float u = dot(p, d), s0 = dot(p, side) / spacing, id = floor(s0), cov = 0.;
    for (int k=-1; k<=1; k++){
      float i = id + float(k);
      float r1 = h11(i*1.13+seed), r2 = h11(i*2.71+seed+3.), r3 = h11(i*5.3+seed+7.), r4 = h11(i*9.1+seed+1.);
      float s = s0 - i - .5 - (r1-.5)*.6 - u*(r3-.5)*.35/spacing;
      float segL = spacing*(8.+r2*14.), uj = u/segL + r4*7., j = floor(uj), f = fract(uj);
      float on = step(1.-density, h11(j*3.7+i*.71+seed));
      float taper = smoothstep(0.,.08,f) * (1.-smoothstep(.35+.5*r2, .95, f));
      float w = wmax*(.35+.65*r1)*taper, aa = fwidth(s);
      cov = max(cov, on*(1.-smoothstep(w-aa, w+aa, abs(s))) * (1.-smoothstep(.3,.8,aa)));
    }
    return cov;
  }
`;

// ------------------------------------------------------------------ faceted solids: domes, the pore arch, stones
export const carveMat = (scale = 1) => new THREE.ShaderMaterial({
  uniforms: { ...U, uScale: { value: scale } }, side: THREE.DoubleSide,
  vertexShader: VS_WORLD,
  fragmentShader: GLSL_HASH + SCRATCH + `
    uniform vec3 uInk, uPaper, uYellow, uL; uniform float uWarm, uScale; varying vec3 vW;
    void main(){
      vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
      float ndl = dot(n, uL);
      vec3 lit = mix(uPaper, mix(uPaper, uYellow, .35), uWarm*smoothstep(.3,.8,ndl));
      vec3 col;
      if (ndl > 0.12) { float k = scratches(vW*uScale, n, 3.2, .22*smoothstep(.55,.12,ndl), .07, 11.); col = mix(lit, uInk, k); }
      else { float dens = mix(.8, .3, smoothstep(.12,-.5,ndl)); float k = scratches(vW*uScale, n, 2.4, dens, .16, 3.); col = mix(uInk, uPaper, k*.95); }
      gl_FragColor = vec4(col, 1.);
    }`,
});

// ------------------------------------------------------------------ the skin: faceted paper terrain with ink pools (melanin)
// uPools[i] = (x, z, radius, seed); uGrow scales every radius; uPulse lights the cut rings as the sun pulses
export const skinMat = new THREE.ShaderMaterial({
  uniforms: { ...U, uPools: { value: Array.from({ length: 14 }, () => new THREE.Vector4(0, 0, 0, 0)) }, uGrow: { value: 1 }, uPulse: { value: 0 }, uT: { value: 0 } },
  side: THREE.DoubleSide,
  vertexShader: VS_WORLD,
  fragmentShader: GLSL_HASH + SCRATCH + `
    uniform vec3 uInk, uPaper, uYellow, uL, uCam; uniform float uWarm, uGrow, uPulse, uT; uniform vec4 uPools[14]; varying vec3 vW;
    void main(){
      vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
      float ndl = dot(n, uL);
      vec3 col;
      if (ndl > 0.1) { float k = scratches(vW*.9, n, 2.6, .3*smoothstep(.6,.1,ndl), .08, 11.); col = mix(uPaper, uInk, k); }
      else { float k = scratches(vW*.9, n, 2.2, .6, .17, 3.); col = mix(uInk, uPaper, k*.95); }
      // pores: small ink stabs scattered over the lit facets
      vec2 pc = floor(vW.xz/2.6), pf = fract(vW.xz/2.6)-.5;
      float pore = step(.86, h21(pc*1.7)) * (1.-smoothstep(.06,.1,length(pf*vec2(1.,1.6))));
      pore *= 1.-smoothstep(40., 90., distance(vW, uCam));
      col = mix(col, uInk, pore*step(.1, ndl));
      // the pools: ink fields carrying paper rings cut around their centres; the rings run outward when they spread
      for (int i = 0; i < 14; i++){
        vec4 P = uPools[i]; if (P.z <= 0.) continue;
        vec2 q = vW.xz - P.xy; float a = atan(q.y, q.x), r = length(q);
        float R = P.z*uGrow*(1. + .16*sin(a*3.+P.w*6.) + .09*sin(a*7.+P.w*11.) + .05*sin(a*13.+P.w*3.));
        if (r < R){
          float u = r/R;
          float ring = fract(u*5. - uT*.0 - uPulse*.6);
          float aa = fwidth(u*5.);
          float seg = step(.35, h21(vec2(floor(u*5.-uPulse*.6), floor(a*3.)+P.w*9.)));
          float k = seg*(1.-smoothstep(.06-aa, .06+aa, abs(ring-.5)))*smoothstep(.15,.4,u)*(1.-smoothstep(.85,.97,u));
          k *= 1.-smoothstep(.3,.7,aa);
          vec3 cut = mix(uPaper, uYellow, uPulse*.7);
          col = mix(uInk, cut, k*.9);
          // the rim: a ragged paper lip where the ink stops
        } else if (r < R + .35) col = mix(col, uInk, .55);
      }
      gl_FragColor = vec4(col, 1.);
    }`,
});

// ------------------------------------------------------------------ the sky: knife cuts in direction space, with plates of type
// six plates: tPk (RGBA canvas: paper letters, or a red seal), uRk = (az0, el0, az1, el1) radians, uAk the reveal 0..1,
// uMk: 0 = an ink block cleared out of the sky with letters cut right to left; 1 = a seal pressed at once (no block)
const PLATE_U = {}; for (let k = 0; k < 8; k++) { PLATE_U['tP' + k] = { value: null }; PLATE_U['uR' + k] = { value: new THREE.Vector4() }; PLATE_U['uA' + k] = { value: 0 }; PLATE_U['uM' + k] = { value: 0 }; }
export const skyMat = new THREE.ShaderMaterial({
  uniforms: { ...U, uFront: { value: -1 }, uStars: { value: 1 }, uDense: { value: 0 }, ...PLATE_U },
  side: THREE.BackSide, depthWrite: false,
  vertexShader: VS_WORLD,
  fragmentShader: GLSL_HASH + `
    uniform vec3 uInk, uPaper, uYellow, uCam, uSun; uniform float uFront, uStars, uDense, uWarm; varying vec3 vW;
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `uniform sampler2D tP${k}; uniform vec4 uR${k}; uniform float uA${k}, uM${k};`).join('\n')}
    vec3 plate(vec3 col, sampler2D tex, vec4 rect, float amt, float mode, float az, float el){
      if (amt <= 0.) return col;
      vec2 uv = vec2((az - rect.x)/(rect.z - rect.x), (el - rect.y)/(rect.w - rect.y));
      if (uv.x < -.05 || uv.x > 1.05 || uv.y < -.14 || uv.y > 1.14) return col;
      if (mode < .5) {
        float e = min(min(uv.x + .04, 1.04 - uv.x)*4., min(uv.y + .12, 1.12 - uv.y));
        float rag = (h21(floor(vec2(az, el)*900.)) - .5)*.014;
        col = mix(col, uInk, smoothstep(0., .004, e + rag) * clamp(amt*4., 0., 1.));
      }
      if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) return col;
      vec4 t = texture2D(tex, uv);
      float shown = mode < .5 ? step(1. - amt*1.04, uv.x) : 1.;     // Arabic: the knife runs right to left
      return mix(col, t.rgb, t.a*shown);
    }
    float lineRow(float el, float az, float rows, float prob, float seed, float wmul, float segMin, float segMax){
      float v = el*rows; float row = floor(v);
      float ph = h11(row*1.7+seed)*6.28, amp = .18 + h11(row*3.1+seed)*.25, fr = 4. + h11(row*5.3+seed)*9.;
      v += sin(ph + az*fr)*amp;
      row = floor(v); float f = fract(v)-.5;
      float segL = segMin + h11(row*2.9+seed)*(segMax-segMin);
      float s = az/segL + h11(row*7.7+seed)*9.; float j = floor(s), sf = fract(s);
      float on = step(1.-prob, h11(j*3.1+row*.71+seed));
      float taper = smoothstep(0.,.06,sf)*(1.-smoothstep(.55,.98,sf));
      float w = (.07 + .1*h11(j+row*1.3+seed))*wmul*taper*on;
      float aa = fwidth(v)*.9;
      return 1.-smoothstep(w-aa, w+aa, abs(f));
    }
    void main(){
      vec3 d = normalize(vW - uCam);
      float el = asin(clamp(d.y,-1.,1.)), az = atan(d.x, -d.z);
      vec3 col;
      if (el < -.004) col = uInk;
      else {
        float kn = lineRow(el, az, 105., .45, 0., 1., .06, .32) * (1.-uDense);
        float sunA0 = max(dot(normalize(d.xz), normalize(uSun.xz)), 0.);
        float glow0 = pow(sunA0, 24.) * (1.-smoothstep(.0, .3, el)) * uWarm;
        float rows = 260.;
        float v = el*rows + sin(az*2.3 + floor(el*rows)*1.7)*.06;
        float row = floor(v), f = fract(v)-.5;
        float re = (row+.5)/rows;
        float cov = mix(.5, .1, smoothstep(.0, .36, el)) * mix(.85, 1., uDense) + glow0*.3;
        float segL = .5 + h11(row*2.9+21.)*1.1;
        float sg = az/segL + h11(row*7.7)*9.; float sj = floor(sg), sf = fract(sg);
        float on = step(.12, h11(sj*3.1+row*.71+21.));
        float taper = smoothstep(0.,.03,sf)*(1.-smoothstep(.9,1.,sf));
        float w = cov*.5*mix(.55, 1., taper)*on;
        float aa = fwidth(v)*.9;
        float kd = 1.-smoothstep(w-aa, w+aa, abs(f));
        float carved = step(re, uFront);
        float edge = step(uFront - 1./rows, re);
        float run = clamp((uFront - re)*rows, 0., 1.);
        float sweep = step(az, mix(-3.2, 3.2, run));
        kd *= carved * mix(1., sweep, edge);
        vec2 sc = vec2(az, el)*vec2(140., 140.); vec2 cid = floor(sc), cf = fract(sc)-.5;
        float sr = h21(cid), ss = mix(.1, .2, step(.92, h21(cid+3.)));
        float star = step(.965, sr) * step(max(abs(cf.x),abs(cf.y)*1.1), ss) * uStars * smoothstep(.0, .05, el);
        float k = max(max(kn, kd), star);
        float sunA = max(dot(normalize(d.xz), normalize(uSun.xz)), 0.);
        float glow = pow(sunA, 26.) * (1.-smoothstep(.0, .3, el)) * uWarm;
        vec3 lineCol = mix(uPaper, uYellow, clamp(glow*1.3, 0., .85));
        col = mix(uInk, lineCol, k);
      }
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `col = plate(col, tP${k}, uR${k}, uA${k}, uM${k}, az, el);`).join('\n      ')}
      gl_FragColor = vec4(col, 1.);
    }`,
});

// ------------------------------------------------------------------ billboards (palms, the woman), cylindrical, feet at the pivot
export function billboardMat(tex, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { tMap: { value: tex }, ...U },
    vertexShader: `
      attribute vec3 aOff; attribute vec2 aSize; attribute vec4 aTile; attribute float aRot;
      varying vec2 vUv; varying vec3 vW;
      void main(){
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        right = normalize(vec3(right.x,0.,right.z)); vec3 up = vec3(0.,1.,0.);
        vec2 q = position.xy*aSize;
        vec3 p = aOff + right*q.x + up*q.y;
        vUv = aTile.xy + uv*aTile.zw; vW = p;
        gl_Position = projectionMatrix*viewMatrix*vec4(p,1.);
      }`,
    fragmentShader: `
      uniform sampler2D tMap; uniform vec3 uCam; varying vec2 vUv; varying vec3 vW;
      void main(){
        vec4 c = texture2D(tMap, vUv, -1.6); if (c.a < .42) discard;
        ${opts.fade ? `if (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233)))*43758.5453) > smoothstep(${opts.fade[0].toFixed(1)}, ${opts.fade[1].toFixed(1)}, distance(vW, uCam))) discard;` : ''}
        gl_FragColor = vec4(c.rgb, 1.);
      }`,
    side: THREE.DoubleSide,
  });
}

// ------------------------------------------------------------------ brick and plaster walls of the city (no snow, no ice)
// lit faces paper with ink courses and chisel marks; shadow faces ink with paper joints and hatching; roofs paper.
// Windows: small ink openings on lit faces, paper-rimmed holes on shadow faces; at night a few lamps (the yellow).
export const wallMat = new THREE.ShaderMaterial({
  uniforms: { ...U },
  vertexShader: VS_WN,
  fragmentShader: GLSL_HASH + `
    uniform vec3 uInk, uPaper, uYellow, uL, uCam; uniform float uNight, uWarm; varying vec3 vW; varying vec3 vN;
    float ln(float v, float w){ float f = abs(fract(v)-.5), a = fwidth(v); return (1.-smoothstep(w-a, w+a, f)) * (1.-smoothstep(.25,.6,a)); }
    void main(){
      vec3 n = normalize(vN);
      float dist = distance(vW, uCam);
      if (n.y > .7) {   // roof: paper with sparse drift marks
        float v = vW.z*.9 + sin(vW.x*.3)*.6, row = floor(v), f = fract(v)-.5;
        float sg = vW.x*.5 + h11(row)*9., on = step(.72, h11(floor(sg)+row*3.1)) * smoothstep(0.,.1,fract(sg))*(1.-smoothstep(.4,.8,fract(sg)));
        float aa = fwidth(v), k = on*(1.-smoothstep(.05-aa,.05+aa,abs(f)))*(1.-smoothstep(.3,.6,aa));
        gl_FragColor = vec4(mix(uPaper, uInk, k*.85), 1.); return;
      }
      if (n.y < -.7) { gl_FragColor = vec4(uInk, 1.); return; }
      float along = abs(n.x) > abs(n.z) ? vW.z : vW.x;
      float joints = max(ln(vW.y/.5 + .5, .04), ln(along/1.1 + h11(floor(vW.y/.5))*.5 + .5, .035) * step(.12, fract(vW.y/.5)) * step(fract(vW.y/.5), .88));
      // windows on a 3.2 m bay, 3.1 m storey
      vec2 wc = vec2(along/3.2, (vW.y - 1.)/3.1); vec2 wi = floor(wc), wf = fract(wc);
      float hasW = step(.38, h21(wi*1.37 + floor(vW.xz/40.)*3.1)) * step(.5, vW.y);
      float win = hasW * step(.33, wf.x) * step(wf.x, .67) * step(.3, wf.y) * step(wf.y, .78);
      float rim = hasW * (1.-win) * step(.28, wf.x) * step(wf.x, .72) * step(.25, wf.y) * step(wf.y, .83);
      float lamp = step(.9, h21(wi*2.91 + 5.)) * uNight;
      float lit = dot(n, uL);
      vec3 col;
      if (lit <= .05) {
        float hatch = ln((along + vW.y*.8)*3., .14);
        col = mix(uInk, uPaper, max(joints*.7, hatch*.35) * (1.-smoothstep(60., 160., dist)));
        col = mix(col, uPaper, rim*.9*(1.-smoothstep(120., 260., dist)));
        col = mix(col, uInk, win);
      } else {
        vec2 cc = vec2(along, vW.y)*vec2(5., 8.); vec2 ci = floor(cc), cf = fract(cc)-.5;
        float chis = step(.82, h21(ci)) * (1.-smoothstep(.05, .09, abs(cf.x - cf.y*.6))) * (1.-smoothstep(30., 90., dist));
        float k = max(joints*.9*(1.-smoothstep(70., 180., dist)), chis*.7);
        col = mix(uPaper, uInk, k);
        col = mix(col, uInk, win);
      }
      col = mix(col, uYellow, win*lamp);
      gl_FragColor = vec4(col, 1.);
    }`,
});
// ink ground of the lanes between the houses, with sparse paper scuffs
export const groundMat = new THREE.ShaderMaterial({
  uniforms: { ...U },
  vertexShader: VS_WORLD,
  fragmentShader: GLSL_HASH + `
    uniform vec3 uInk, uPaper, uCam; varying vec3 vW;
    void main(){
      float v = vW.z*.5 + sin(vW.x*.05)*2., row = floor(v), f = fract(v)-.5;
      float sg = vW.x/(3.+h11(row)*8.) + h11(row*3.1)*9.;
      float on = step(.9, h11(floor(sg)*1.7+row*.37)) * smoothstep(0.,.1,fract(sg))*(1.-smoothstep(.3,.7,fract(sg)));
      float aa = fwidth(v), k = on*(1.-smoothstep(.04-aa,.04+aa,abs(f)))*(1.-smoothstep(.25,.6,aa));
      gl_FragColor = vec4(mix(uInk, uPaper, k*.8), 1.);
    }`,
});
// wood: dark boards with paper grain cuts along the board (the shelf, the board on the tank)
export const woodMat = new THREE.ShaderMaterial({
  uniforms: { ...U, uScale: { value: 1 } },
  vertexShader: VS_WN,
  fragmentShader: GLSL_HASH + `
    uniform vec3 uInk, uPaper, uL; uniform float uScale; varying vec3 vW; varying vec3 vN;
    void main(){
      vec3 n = normalize(vN); vec3 p = vW*uScale;
      float along = abs(n.x) > abs(n.z) ? p.z : p.x;
      if (abs(n.y) > .7) along = p.x;
      float vv = abs(n.y) > .7 ? p.z : p.y;
      float v = vv*7. + sin(along*1.3)*.3, row = floor(v), f = fract(v)-.5;
      float segs = along*(.8+h11(row)) + h11(row*2.)*5.;
      float on = step(.5, h11(floor(segs)+row*3.)) * smoothstep(0.,.1,fract(segs))*(1.-smoothstep(.4,.9,fract(segs)));
      float aa = fwidth(v), lit = dot(n, uL) > .05 ? 1. : .5;
      float k = on*(1.-smoothstep(.07*lit-aa, .07*lit+aa, abs(f)))*(1.-smoothstep(.3,.6,aa));
      gl_FragColor = vec4(mix(uInk, uPaper, k*.85), 1.);
    }`,
});
// bathroom wall tiles: paper squares with cut ink grout, a few chips; lit from the window
export const tileMat = new THREE.ShaderMaterial({
  uniforms: { ...U, uSize: { value: 1.5 } },
  vertexShader: VS_WN,
  fragmentShader: GLSL_HASH + `
    uniform vec3 uInk, uPaper, uL; uniform float uSize; varying vec3 vW; varying vec3 vN;
    void main(){
      vec3 n = normalize(vN);
      vec2 p = abs(n.z) > .5 ? vW.xy : abs(n.x) > .5 ? vW.zy : vW.xz;
      vec2 g = p/uSize, gi = floor(g), gf = abs(fract(g)-.5);
      float aa = fwidth(g.x)*1.2;
      float grout = smoothstep(.455-aa, .455+aa, max(gf.x, gf.y));
      // a few knife chips near tile corners
      vec2 cf = fract(g)-.5;
      float chip = step(.8, h21(gi*1.9)) * (1.-smoothstep(.02,.035, abs(cf.x - cf.y*.5 - .2))) * step(.25, cf.x) * step(abs(cf.y), .18);
      float k = max(grout, chip*.8);
      float lit = dot(n, uL);
      vec3 col = mix(uPaper, uInk, k*.9);
      if (lit < -.1) col = mix(uInk, uPaper, k*.8);
      gl_FragColor = vec4(col, 1.);
    }`,
});
export const inkMat = new THREE.MeshBasicMaterial({ color: C.ink });
export const paperMat = new THREE.MeshBasicMaterial({ color: C.paper });
export const hullMat = new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.BackSide });
// a band of yellow cuts along a strip (a ray of sunlight); uv.x along the ray, uv.y across
export const rayMat = new THREE.ShaderMaterial({
  uniforms: { ...U, uAmt: { value: 1 }, uThick: { value: 1 }, uT: { value: 0 } },
  side: THREE.DoubleSide, depthWrite: false,
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: GLSL_HASH + `
    uniform vec3 uYellow, uPaper; uniform float uAmt, uThick, uT; varying vec2 vUv;
    void main(){
      float v = vUv.y*9., row = floor(v), f = abs(fract(v)-.5);
      float s = vUv.x*(4.+h11(row)*5.) + h11(row*3.)*7. - uT*.6, sf = fract(s);
      float on = step(.35, h11(floor(s)+row*1.3)) * smoothstep(0.,.05,sf)*(1.-smoothstep(.5,.95,sf));
      float w = .14*uThick*(.6+.6*h11(row*7.))*on;
      float edge = smoothstep(.0,.12,vUv.y)*smoothstep(1.,.88,vUv.y) * smoothstep(0., .25, vUv.x) * step(vUv.x, uAmt);
      if (f > w || edge < .5) discard;
      gl_FragColor = vec4(mix(uYellow, uPaper, .15), 1.);
    }`,
});
