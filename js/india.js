// The Indian street-stall details: a chai tapri instead of a ramen bar.
// Everything is procedural, like the rest of the scene.
import * as THREE from 'three';
import * as T from './textures.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lam = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const glow = (color, k = 2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false });
function tube(points, r, mat, closed = false, tension = .5) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', tension);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, points.length * 16), r, 8, closed), mat);
}
function sag(a, b, amount, n = 24) {
  const A = V(...a), B = V(...b), pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n; const p = A.clone().lerp(B, u); p.y -= Math.sin(u * Math.PI) * amount; pts.push(p); }
  return pts;
}

let spriteTex;
const haloTex = () => (spriteTex ||= T.glowSprite());

/** Additive soft glow sprite (lamp halos, flame glow). */
export function halo(color, size, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  }));
  s.scale.setScalar(size);
  return s;
}

// Shop front ---------------------------------------------------------------------------

/** Glowing green menu cards hanging in the opening (either side of the monitor). */
export function hindiPanels(g, updaters) {
  const items = [['चाय', 'chai', -1.36], ['समोसा', 'samosa', -.93], ['वड़ा पाव', 'vada pav', .93], ['लस्सी', 'lassi', 1.36]];
  items.forEach(([hi, en, x], i) => {
    const p = new THREE.Group();
    const card = new THREE.Mesh(new THREE.PlaneGeometry(.36, .45), new THREE.MeshBasicMaterial({ map: T.hindiPanel(hi, en), side: THREE.DoubleSide, toneMapped: false }));
    card.position.y = -.26;
    p.add(card);
    p.add(new THREE.Mesh(new THREE.CylinderGeometry(.003, .003, .06, 4), lam('#111')).translateY(.0));
    p.position.set(x, 2.26, 1.24);
    g.add(p);
    updaters.push((t) => { p.rotation.z = Math.sin(t * 1.1 + i * 1.7) * .03; });
  });
}

/** Marigold garland swagged along the awning hem. */
export function garland(g) {
  const swags = [sag([-1.8, 2.16, 1.72], [0, 2.16, 1.72], .12), sag([0, 2.16, 1.72], [1.8, 2.16, 1.72], .12)];
  const pts = swags.flatMap((s) => s);
  const geo = new THREE.IcosahedronGeometry(.036, 1);
  const mesh = new THREE.InstancedMesh(geo, lam('#ffffff', { emissive: '#ff8a00', emissiveIntensity: .35 }), pts.length * 2);
  const m = new THREE.Matrix4(), c = new THREE.Color();
  let n = 0;
  pts.forEach((p, i) => {
    for (const o of [0, .5]) {
      const q = i < pts.length - 1 ? p.clone().lerp(pts[i + 1], o) : p;
      m.makeTranslation(q.x, q.y, q.z);
      mesh.setMatrixAt(n, m);
      mesh.setColorAt(n, c.set((n % 3) ? '#ff9a1f' : '#ffd23a'));
      n++;
    }
  });
  mesh.count = n;
  g.add(mesh);
  // tassels at the ends and the middle
  for (const x of [-1.8, 0, 1.8]) {
    for (let k = 0; k < 4; k++) {
      const b = new THREE.Mesh(geo, lam(k % 2 ? '#ffd23a' : '#ff9a1f', { emissive: '#ff8a00', emissiveIntensity: .35 }));
      b.position.set(x, 2.1 - k * .065, 1.72);
      g.add(b);
    }
  }
}

/** Nimbu-mirchi: a lemon and green chillies on a thread, for good luck. */
export function nimbuMirchi(g, updaters) {
  const n = new THREE.Group();
  n.add(new THREE.Mesh(new THREE.CylinderGeometry(.003, .003, .55, 4), lam('#222')).translateY(-.27));
  const lemon = new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), lam('#ffe23a', { emissive: '#665500', emissiveIntensity: .3 }));
  lemon.scale.set(1, 1.2, 1); lemon.position.y = -.08;
  n.add(lemon);
  for (let i = 0; i < 5; i++) {
    const chilli = new THREE.Mesh(new THREE.ConeGeometry(.018, .14, 8), lam('#2fb540'));
    chilli.position.set(0, -.18 - i * .075, 0);
    chilli.rotation.set(Math.PI, i * 1.3, .25 * (i % 2 ? 1 : -1));
    n.add(chilli);
  }
  const lemon2 = lemon.clone(); lemon2.position.y = -.6; n.add(lemon2);
  n.position.set(-1.64, 2.38, 1.05);
  g.add(n);
  updaters.push((t) => { n.rotation.z = Math.sin(t * 1.6) * .06; n.rotation.y = Math.sin(t * .7) * .4; });
}

/** Steam: soft points that rise, drift and fade. */
function steam(count, height, spread, color = '#ffffff', size = 90) {
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) seeds.set([Math.random(), Math.random() * Math.PI * 2, .6 + Math.random() * .8], i * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uH: { value: height }, uS: { value: spread }, uSize: { value: size } },
    vertexShader: `
      attribute vec3 aSeed; uniform float uTime, uH, uS, uSize; varying float vA;
      void main() {
        float h = fract(aSeed.x + uTime * .35 * aSeed.z);
        vec3 p = vec3(sin(aSeed.y + uTime * .8 + h * 4.) * uS * (.3 + h), h * uH, cos(aSeed.y * 1.7 + h * 3.) * uS * (.3 + h) * .6);
        vA = smoothstep(0., .15, h) * (1. - h) * .5;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_PointSize = uSize * (.5 + h) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; varying float vA;
      void main() { float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(uColor, vA * (1. - d * 2.)); }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.userData.tick = (t) => { mat.uniforms.uTime.value = t; };
  return pts;
}

/** Kadai on a stove, pakoras sizzling in oil, flame underneath, steam above. */
export function kadaiStove(g, updaters) {
  const k = new THREE.Group();
  const metal = lam('#34313d');
  k.add(new THREE.Mesh(new THREE.BoxGeometry(.4, .07, .32), lam('#2b2a33')).translateY(.035));
  for (const x of [-.14, .14]) k.add(new THREE.Mesh(new THREE.BoxGeometry(.03, .05, .3), metal).translateX(x).translateY(.095));
  // flame ring
  const flame = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2;
    const f = new THREE.Mesh(new THREE.ConeGeometry(.018, .07, 6), glow(i % 2 ? '#4fb6ff' : '#ffb13b', 2.2));
    f.position.set(Math.cos(a) * .08, .12, Math.sin(a) * .08);
    flame.add(f);
  }
  k.add(flame);
  const flameGlow = halo('#ff9a3b', .45, .8); flameGlow.position.y = .13; k.add(flameGlow);
  // kadai (a wide, shallow bowl) with two ring handles
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(.2, 28, 10, 0, Math.PI * 2, Math.PI * .58, Math.PI * .42), lam('#2a2830', { side: THREE.DoubleSide }));
  bowl.position.y = .3;
  k.add(bowl);
  for (const x of [-.215, .215]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(.04, .01, 6, 16), metal);
    h.position.set(x, .28, 0); h.rotation.y = Math.PI / 2;
    k.add(h);
  }
  const oil = new THREE.Mesh(new THREE.CircleGeometry(.16, 24), lam('#d99a2b', { emissive: '#7a4a00', emissiveIntensity: .6 }));
  oil.rotation.x = -Math.PI / 2; oil.position.y = .235;
  k.add(oil);
  const pakoras = [];
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.032, 0), lam(i % 2 ? '#c9761e' : '#e09a33'));
    const a = i / 6 * Math.PI * 2;
    p.position.set(Math.cos(a) * .08, .25, Math.sin(a) * .08);
    p.userData.base = p.position.clone();
    k.add(p); pakoras.push(p);
  }
  const st = steam(40, .9, .12);
  st.position.y = .28;
  k.add(st);
  k.position.set(-1.12, 1.085, .75);
  g.add(k);

  updaters.push((t) => {
    st.userData.tick(t);
    flame.children.forEach((f, i) => { f.scale.y = .7 + .5 * Math.abs(Math.sin(t * 13 + i * 1.9)); });
    flameGlow.material.opacity = .6 + .25 * Math.sin(t * 17);
    // pakoras bubble, and every few seconds one gets tossed
    const toss = (t % 4.5) / 4.5;
    pakoras.forEach((p, i) => {
      p.position.y = p.userData.base.y + Math.abs(Math.sin(t * 9 + i * 2)) * .012;
      p.rotation.x = t * (1 + i * .2);
      if (i === Math.floor(t / 4.5) % 6 && toss < .12) {
        const u = toss / .12;
        p.position.y += Math.sin(u * Math.PI) * .22;
        p.rotation.z = u * Math.PI * 2;
      }
    });
  });
  return k;
}

/** Chai kettle, a row of kulhads and a plate of samosas. */
export function chaiSet(g, updaters) {
  const clay = lam('#b5532e');
  const steel = lam('#c6ccd8');
  const kettle = new THREE.Group();
  kettle.add(new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, .2, 20), steel).translateY(.1));
  kettle.add(new THREE.Mesh(new THREE.SphereGeometry(.09, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), steel).translateY(.2));
  kettle.add(new THREE.Mesh(new THREE.SphereGeometry(.02, 10, 8), lam('#222')).translateY(.3));
  kettle.add(tube([V(.09, .08, 0), V(.16, .14, 0), V(.2, .22, 0)], .014, steel));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.08, .012, 8, 20, Math.PI), lam('#222'));
  handle.position.y = .26;
  kettle.add(handle);
  kettle.position.set(.42, 1.085, .66);
  kettle.rotation.y = -2.4;
  g.add(kettle);
  const kst = steam(18, .5, .05, '#ffffff', 60);
  kst.position.set(.62, 1.31, .6);
  g.add(kst);
  updaters.push((t) => kst.userData.tick(t + 3));

  const cup = new THREE.CylinderGeometry(.04, .03, .075, 14);
  const tea = new THREE.CircleGeometry(.036, 14);
  [[.06, .86], [.16, .88], [.1, .76], [.2, .77]].forEach(([x, z]) => {
    g.add(new THREE.Mesh(cup, clay).translateX(x).translateY(1.125).translateZ(z));
    const t = new THREE.Mesh(tea, lam('#c98a4b'));
    t.rotation.x = -Math.PI / 2; t.position.set(x, 1.158, z);
    g.add(t);
  });

  const plate = new THREE.Mesh(new THREE.CylinderGeometry(.15, .12, .02, 24), lam('#e9eef5'));
  plate.position.set(.8, 1.095, .78);
  g.add(plate);
  [[-.05, -.03, .3], [.06, -.02, 1.9], [0, .06, 3.6]].forEach(([dx, dz, ry]) => {
    const s = new THREE.Mesh(new THREE.TetrahedronGeometry(.07), lam('#e3a23a'));
    s.position.set(.8 + dx, 1.135, .78 + dz);
    s.rotation.set(.62, ry, .2);
    s.scale.set(1, .7, 1);
    g.add(s);
  });
}

// Roof -----------------------------------------------------------------------------------

/** Neon "cutting chai" glass with rising steam, on a board. */
export function chaiNeon(g, updaters) {
  const n = new THREE.Group();
  n.add(new THREE.Mesh(new THREE.BoxGeometry(.95, 1.15, .05), lam('#1b1030')).translateY(.12).translateZ(-.07));
  n.add(new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.0, 8), lam('#3b3558')).translateX(-.3).translateY(-.8).translateZ(-.12));
  n.add(new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.0, 8), lam('#3b3558')).translateX(.3).translateY(-.8).translateZ(-.12));
  const glass = glow('#bff6ff', 1.6);
  n.add(tube([V(-.17, -.32, 0), V(.17, -.32, 0), V(.23, .18, 0), V(-.23, .18, 0)], .022, glass, true, 0));
  for (const y of [-.2, -.08]) n.add(tube([V(-.19 + (y + .32) * .12, y, 0), V(.19 - (y + .32) * -.12, y, 0)], .01, glass));
  n.add(tube([V(-.215, .07, 0), V(.215, .07, 0)], .02, glow('#ffb13b', 2.2)));
  const steamMat = glow('#ff6fcf', 1.8);
  const wisps = [-.1, 0, .1].map((x, i) => {
    const pts = [];
    for (let k = 0; k <= 12; k++) pts.push(V(x + Math.sin(k * .8 + i) * .04, .26 + k * .03, 0));
    const w = tube(pts, .014, steamMat);
    n.add(w);
    return w;
  });
  // "चाय" in pink neon underneath
  const [c, ctx] = T.canvas(512, 200);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `800 150px ${T.FONT_HINDI}`;
  ctx.shadowColor = '#ff4fa3'; ctx.shadowBlur = 24; ctx.fillStyle = '#ffd0ea';
  ctx.fillText('चाय', 256, 110);
  const word = new THREE.Mesh(new THREE.PlaneGeometry(.6, .24), new THREE.MeshBasicMaterial({ map: T.toTexture(c), transparent: true, toneMapped: false, depthWrite: false }));
  word.position.set(0, -.44, .01);
  n.add(word);
  n.position.set(.95, 1.45, .45);
  n.rotation.y = -.25;
  g.add(n);
  updaters.push((t) => wisps.forEach((w, i) => { w.position.y = Math.sin(t * 2 + i) * .02; w.scale.x = 1 + Math.sin(t * 3 + i * 2) * .25; }));
  return n;
}

/** Holographic swirl of particles spiralling up around the neon sign. */
export function hologram(g, updaters, { count = 1400, height = 1.7, color = '#5ff6ff' } = {}) {
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) seeds.set([Math.random() * Math.PI * 2, Math.random(), .5 + Math.random()], i * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uH: { value: height }, uPR: { value: Math.min(devicePixelRatio, 1.5) } },
    vertexShader: `
      attribute vec3 aSeed; uniform float uTime, uH, uPR; varying float vA;
      void main() {
        float h = fract(aSeed.y + uTime * .07 * aSeed.z);
        float a = aSeed.x + uTime * (.9 + .5 * aSeed.z) + h * 8.;
        float r = mix(.22, .85, h) * (.9 + .1 * sin(aSeed.x * 13.));
        vec3 p = vec3(cos(a) * r, h * uH, sin(a) * r);
        vA = smoothstep(0., .1, h) * (1. - smoothstep(.8, 1., h));
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_PointSize = 26. * uPR / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; varying float vA;
      void main() { float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(uColor * 1.6, vA * (1. - d * 2.)); }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  g.add(pts);
  updaters.push((t) => { mat.uniforms.uTime.value = t; });
  return pts;
}

/** Rooftop TV playing a sunset, on two legs. */
export function rooftopTV(g, updaters) {
  const tv = new THREE.Group();
  tv.add(new THREE.Mesh(new THREE.BoxGeometry(1.16, .74, .08), lam('#1d1a26')));
  const tex = T.sunsetTV();
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.06, .64), new THREE.MeshBasicMaterial({ map: tex.texture, toneMapped: false }));
  screen.position.z = .041;
  tv.add(screen);
  for (const x of [-.4, .4]) tv.add(new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .7, 8), lam('#3b3558')).translateX(x).translateY(-.7).translateZ(-.04));
  tv.position.set(-.85, 1.07, .55);
  tv.rotation.y = .2;
  g.add(tv);
  updaters.push((t) => tex.update(t));
}

/** Solar panel leaning off the back-left corner. */
export function solarPanel(g) {
  const [c, ctx] = T.canvas(256, 160);
  ctx.fillStyle = '#1b3f9e'; ctx.fillRect(0, 0, 256, 160);
  ctx.strokeStyle = '#8fb3ff'; ctx.lineWidth = 3;
  for (let x = 0; x <= 256; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 160); ctx.stroke(); }
  for (let y = 0; y <= 160; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke(); }
  const p = new THREE.Group();
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.1, .03, .68), [lam('#c9cfdc'), lam('#c9cfdc'), lam('#ffffff', { map: T.toTexture(c), emissive: '#1b3f9e', emissiveIntensity: .4 }), lam('#c9cfdc'), lam('#c9cfdc'), lam('#c9cfdc')]);
  panel.rotation.x = .7;
  panel.position.y = .45;
  p.add(panel);
  p.add(new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .45, 8), lam('#3b3558')).translateY(.22));
  p.position.set(-1.35, .2, -.55);
  p.rotation.y = .5;
  g.add(p);
}

// Ground -----------------------------------------------------------------------------------

/** Name and roles written on the floor in front of the stall. */
export function groundText(root, name, lines) {
  const tex = T.groundText(name, lines);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 3.7 * 1100 / 2048), new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false, fog: false, toneMapped: false, color: new THREE.Color(.8, .78, .86),
  }));
  m.rotation.set(-Math.PI / 2, 0, -.4);
  m.position.set(2.2, .01, 3.25);
  root.add(m);
}
