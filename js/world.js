// Builds the street: wet reflective ground, the stall, the signpost and set dressing.
// All geometry is procedural (Three.js primitives), all textures come from textures.js.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import * as T from './textures.js';

export const SECTIONS = [
  { id: 'about', label: 'ABOUT', color: '#2af3ff', dir: 'right' },
  { id: 'projects', label: 'PROJECTS', color: '#ff2bd6', dir: 'left' },
  { id: 'research', label: 'RESEARCH', color: '#b6ff3b', dir: 'right' },
  { id: 'contact', label: 'CONTACT', color: '#ffb020', dir: 'left' },
];

const STALL_X = 0.7;

// Material helpers -----------------------------------------------------------

function glow(color, intensity = 2, extra = {}) {
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), ...extra });
  m.userData.base = new THREE.Color(color);
  m.userData.intensity = intensity;
  return m;
}
function setGlow(m, intensity) {
  m.userData.intensity = intensity;
  m.color.copy(m.userData.base).multiplyScalar(intensity);
}
const std = (color, roughness = .7, metalness = .2, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}
function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}
function tube(points, radius, mat, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', 0.01);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, points.length * 12, radius, 8, closed), mat);
}

// ---------------------------------------------------------------------------

export function buildWorld(scene, renderer) {
  const updaters = [];
  const clickables = []; // meshes with userData.section

  scene.background = new THREE.Color('#05060a');
  scene.fog = new THREE.FogExp2('#05060a', 0.045);
  scene.add(new THREE.HemisphereLight('#2a3050', '#000000', 0.55));

  const mirror = buildGround(scene, renderer);
  const stall = buildStall(scene, updaters, clickables);
  buildSignpost(scene, updaters, clickables);
  buildDressing(scene, updaters);
  buildSkyline(scene);
  const rain = buildRain(scene);

  return {
    clickables,
    screen: stall.screen,
    terminal: stall.terminal,
    rain,
    resize(w, h) {
      const dpr = Math.min(renderer.getPixelRatio(), 1.5);
      mirror.getRenderTarget().setSize(Math.max(1, w * dpr * .5 | 0), Math.max(1, h * dpr * .5 | 0));
    },
    update(t, dt) { for (const u of updaters) u(t, dt); },
  };
}

// Ground ---------------------------------------------------------------------

function buildGround(scene, renderer) {
  const dpr = Math.min(renderer.getPixelRatio(), 1.5);
  const mirror = new Reflector(new THREE.PlaneGeometry(90, 90), {
    textureWidth: Math.max(1, innerWidth * dpr * .5 | 0),
    textureHeight: Math.max(1, innerHeight * dpr * .5 | 0),
    color: new THREE.Color('#6b707c'),
    clipBias: 0.003,
    multisample: 4,
  });
  mirror.rotation.x = -Math.PI / 2;
  scene.add(mirror);

  // Asphalt over the mirror: mostly opaque, thin where it's "wet".
  const { map, alphaMap } = T.wetGround();
  const asphalt = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    new THREE.MeshStandardMaterial({ map, alphaMap, transparent: true, roughness: .55, metalness: 0, color: '#9aa0ad', depthWrite: false }),
  );
  map.repeat.set(30, 30);
  alphaMap.repeat.set(12, 12);
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.position.y = 0.002;
  scene.add(asphalt);

  // Curb running behind the stall.
  const curb = box(40, .16, .5, std('#2a2d35', .9, 0), 0, .08, -2.6);
  scene.add(curb);
  const sidewalk = box(40, .14, 8, std('#15171d', .95, 0), 0, .07, -6.8);
  scene.add(sidewalk);
  return mirror;
}

// Stall ----------------------------------------------------------------------

function buildStall(scene, updaters, clickables) {
  const g = new THREE.Group();
  g.position.x = STALL_X;
  scene.add(g);

  const metal = std('#ffffff', .6, .35, { map: T.panel('#1f2433', 3) });
  const dark = std('#14161d', .8, .3);
  const chrome = std('#b9c0cc', .25, .9);
  const wood = std('#3a2a22', .8, 0);

  // Cabinet + counter
  g.add(box(3.2, 1.0, 1.3, metal, 0, .5, -.05));
  g.add(box(3.5, .07, 1.62, std('#2c313e', .35, .6), 0, 1.035, 0));
  g.add(box(3.5, .03, .06, glow('#2af3ff', 2.2), 0, 1.0, .82)); // neon edge under the counter lip

  // Posts
  for (const x of [-1.6, 1.6]) for (const z of [-.72, .72]) g.add(cyl(.035, .035, 1.55, chrome, x, 1.82, z));

  // Back wall and shelf with glowing jars
  g.add(box(3.2, 1.5, .06, std('#ffffff', .7, .3, { map: T.panel('#171a24', 9, { stickers: false }) }), 0, 1.8, -.74));
  g.add(box(2.8, .04, .26, wood, 0, 1.62, -.6));
  g.add(box(2.8, .04, .26, wood, 0, 2.1, -.6));
  const jarCols = ['#ff2bd6', '#2af3ff', '#b6ff3b', '#ffb020', '#8a7bff'];
  const r = T.rng(4);
  for (const y of [1.64, 2.12]) {
    for (let i = 0; i < 9; i++) {
      const h = .12 + r() * .12;
      const jar = cyl(.05, .05, h, glow(jarCols[(i + (y > 2 ? 2 : 0)) % 5], .9 + r() * .6), -1.25 + i * .31, y + h / 2, -.6 + (r() - .5) * .08, 10);
      g.add(jar);
    }
  }

  // Roof, fascia and roof sign
  g.add(box(3.7, .12, 2.0, dark, 0, 2.6, .1));
  const sign = box(3.0, .72, .12, std('#0b0c12', .6, .4), 0, 3.06, .72);
  g.add(sign);
  const nameTex = T.neonText('cyb3r_n3rd', '#ff2bd6', { font: T.FONT_MONO, weight: 800, size: 170 });
  const namePlane = new THREE.Mesh(new THREE.PlaneGeometry(2.8, .7), glow('#ffffff', 1.3, { map: nameTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  namePlane.position.set(0, 3.06, .785);
  g.add(namePlane);
  const border = tube([
    new THREE.Vector3(-1.45, 2.75, .8), new THREE.Vector3(1.45, 2.75, .8),
    new THREE.Vector3(1.45, 3.37, .8), new THREE.Vector3(-1.45, 3.37, .8),
  ], .018, glow('#2af3ff', 2.2), true);
  g.add(border);
  // Faulty tube: the name sign stutters every few seconds.
  let nextGlitch = 3;
  updaters.push((t) => {
    if (t > nextGlitch) {
      const on = Math.sin(t * 90) > -.2;
      setGlow(namePlane.material, on ? 1.3 : .3);
      if (t > nextGlitch + .45) { nextGlitch = t + 3 + Math.random() * 6; setGlow(namePlane.material, 1.3); }
    }
  });

  // Awning
  const { map: awnMap, alphaMap: awnAlpha } = T.awning();
  const awning = new THREE.Mesh(
    new THREE.PlaneGeometry(3.7, .9),
    std('#ffffff', .85, 0, { map: awnMap, alphaMap: awnAlpha, alphaTest: .5, side: THREE.DoubleSide }),
  );
  awning.rotation.x = -1.05;
  awning.position.set(0, 2.36, 1.33);
  g.add(awning);

  // Monitor: the "screen" the camera flies into.
  g.add(box(.4, .05, .34, dark, 0, 1.095, .05));
  g.add(cyl(.05, .07, .16, dark, 0, 1.19, .05));
  g.add(box(.98, .76, .6, std('#262a36', .5, .4), 0, 1.62, .08));
  g.add(box(.7, .5, .3, std('#1d212b', .6, .3), 0, 1.62, -.3)); // CRT hump
  const term = T.terminal([]);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(.84, .6), glow('#ffffff', 1.25, { map: term.texture }));
  screen.position.set(0, 1.62, .381);
  screen.userData.section = 'about';
  g.add(screen);
  clickables.push(screen);
  updaters.push((t) => term.update(t));
  const screenLight = new THREE.PointLight('#2af3ff', 2.2, 4, 1.6);
  screenLight.position.set(0, 1.6, .9);
  g.add(screenLight);

  // Keyboard and a mug
  g.add(box(.62, .03, .2, std('#20242e', .6, .3), 0, 1.085, .58));
  g.add(cyl(.05, .045, .11, std('#ffb020', .5, .1), .6, 1.125, .5));

  // Warm work light under the roof
  const warm = new THREE.PointLight('#ffb36b', 7, 6, 1.5);
  warm.position.set(0, 2.35, .1);
  g.add(warm);
  g.add(cyl(.12, .2, .12, dark, 0, 2.48, .1));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), glow('#ffd9a3', 3)).translateY(2.4).translateZ(.1));

  // Stools
  for (const x of [-.8, .9]) {
    g.add(cyl(.22, .22, .06, std('#8a1b5c', .5, .2), x, .76, 1.35, 20));
    g.add(cyl(.03, .03, .72, chrome, x, .38, 1.35));
    g.add(cyl(.18, .18, .02, chrome, x, .01, 1.35, 20));
  }

  // String lights along the front of the awning
  const bulbs = [];
  const a = new THREE.Vector3(-1.85, 2.02, 1.78), b = new THREE.Vector3(1.85, 2.02, 1.78);
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const u = i / 20;
    const p = a.clone().lerp(b, u);
    p.y -= Math.sin(u * Math.PI) * .12;
    pts.push(p);
  }
  g.add(tube(pts, .006, std('#111111', .8, 0)));
  const bulbCols = ['#ffd27a', '#ff6fd8', '#6ff4ff'];
  for (let i = 1; i < 20; i += 2) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), glow(bulbCols[i % 3], 3));
    m.position.copy(pts[i]).add(new THREE.Vector3(0, -.04, 0));
    g.add(m); bulbs.push(m);
  }
  updaters.push((t) => bulbs.forEach((m, i) => setGlow(m.material, 2.4 + Math.sin(t * 1.7 + i * 1.3) * .8)));

  // Menu A-frame
  const menu = new THREE.Group();
  const menuTex = T.menuBoard();
  menu.add(box(.62, .92, .04, std('#ffffff', .9, 0, { map: menuTex, emissiveMap: menuTex, emissive: '#ffffff', emissiveIntensity: .35 }), 0, .55, 0));
  menu.add(box(.64, .03, .06, wood, 0, 1.02, 0));
  menu.children[0].rotation.x = -.18;
  menu.add(box(.04, .9, .04, wood, -.28, .45, -.18).rotateX(.2));
  menu.add(box(.04, .9, .04, wood, .28, .45, -.18).rotateX(.2));
  menu.position.set(-1.5, 0, 2.05);
  menu.rotation.y = .4;
  g.add(menu);

  return { screen, terminal: term };
}

// Signpost ---------------------------------------------------------------------

function arrowShape(w, h, dir) {
  const s = new THREE.Shape();
  const tip = h * .45;
  if (dir === 'right') {
    s.moveTo(0, 0); s.lineTo(w - tip, 0); s.lineTo(w, h / 2); s.lineTo(w - tip, h); s.lineTo(0, h);
  } else {
    s.moveTo(0, 0); s.lineTo(-(w - tip), 0); s.lineTo(-w, h / 2); s.lineTo(-(w - tip), h); s.lineTo(0, h);
  }
  s.closePath();
  return s;
}

function buildSignpost(scene, updaters, clickables) {
  const g = new THREE.Group();
  g.position.set(-2.55, 0, 1.25);
  g.rotation.y = .28;
  scene.add(g);

  const post = std('#2a2f3b', .45, .7);
  g.add(cyl(.06, .07, 3.9, post, 0, 1.95, 0));
  g.add(box(.36, .12, .36, std('#15171d', .8, .3), 0, .06, 0));
  g.add(cyl(.09, .06, .1, post, 0, 3.95, 0));

  // Street sign on top, not clickable
  const street = box(1.0, .22, .03, std('#0e5a3a', .6, .2), 0, 3.72, 0);
  g.add(street);
  const stTex = T.neonText('0DAY AVE', '#e9ecf5', { w: 512, h: 112, size: 70 });
  const st = new THREE.Mesh(new THREE.PlaneGeometry(.95, .2), glow('#ffffff', .55, { map: stTex, transparent: true, depthWrite: false }));
  st.position.set(0, 3.72, .02);
  g.add(st);

  const W = 1.55, H = .4;
  const boardMat = std('#0b0d13', .55, .5);
  SECTIONS.forEach((sec, i) => {
    const sg = new THREE.Group();
    sg.position.y = 3.2 - i * .56;
    sg.rotation.y = (i % 2 ? -1 : 1) * (.12 + i * .03);
    g.add(sg);

    const x0 = sec.dir === 'right' ? .07 : -.07;
    const board = new THREE.Mesh(
      new THREE.ExtrudeGeometry(arrowShape(W, H, sec.dir), { depth: .05, bevelEnabled: true, bevelSize: .01, bevelThickness: .01, bevelSegments: 1 }),
      boardMat,
    );
    board.position.set(x0, -H / 2, -.025);
    sg.add(board);
    // Bracket to the pole
    sg.add(box(.14, .05, .05, post, 0, 0, 0));

    const tex = T.neonText(sec.label, sec.color, { outline: `arrow-${sec.dir}`, size: 140 });
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      glow('#ffffff', 1.1, { map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    face.position.set(x0 + (sec.dir === 'right' ? W / 2 : -W / 2), 0, .045);
    sg.add(face);

    // Invisible, slightly padded hit box (easier to click on phones)
    const hit = new THREE.Mesh(new THREE.BoxGeometry(W + .1, H + .12, .2), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.copy(face.position);
    hit.userData.section = sec.id;
    hit.userData.face = face;
    sg.add(hit);
    clickables.push(hit);

    const light = new THREE.PointLight(sec.color, 1.2, 2.2, 2);
    light.position.set(face.position.x, 0, .45);
    sg.add(light);

    // Hover: brighten and swing a little. Driven by main.js via userData.hover.
    let swing = 0;
    updaters.push((t, dt) => {
      const target = hit.userData.hover ? 2.2 : 1.1 + Math.sin(t * 2.3 + i) * .06;
      const cur = face.material.userData.intensity;
      setGlow(face.material, cur + (target - cur) * Math.min(1, dt * 10));
      light.intensity = face.material.userData.intensity * .9;
      swing += ((hit.userData.hover ? .06 : 0) - swing) * Math.min(1, dt * 6);
      sg.rotation.z = Math.sin(t * 3 + i) * swing * .25;
      sg.position.z = swing;
    });
  });
}

// Dressing ------------------------------------------------------------------------

function buildDressing(scene, updaters) {
  // Street lamp
  const pole = std('#1e222c', .5, .6);
  const lamp = new THREE.Group();
  lamp.position.set(5.6, 0, -.8);
  lamp.add(cyl(.07, .1, 4.8, pole, 0, 2.4, 0));
  lamp.add(box(1.2, .06, .06, pole, -.55, 4.75, 0));
  lamp.add(box(.42, .1, .22, pole, -1.1, 4.7, 0));
  lamp.add(box(.36, .02, .16, glow('#cfe3ff', 3), -1.1, 4.64, 0));
  scene.add(lamp);
  const spot = new THREE.SpotLight('#a9c8ff', 60, 12, .75, .6, 1.4);
  spot.position.set(5.6 - 1.1, 4.6, -.8);
  spot.target.position.set(2.6, 0, .8);
  scene.add(spot, spot.target);

  // Vending machine
  const vend = new THREE.Group();
  vend.position.set(3.95, 0, -1.35);
  vend.rotation.y = -.3;
  vend.add(box(1.0, 1.95, .8, std('#20232d', .5, .4), 0, .975, 0));
  const front = new THREE.Mesh(new THREE.PlaneGeometry(.84, 1.64), glow('#ffffff', 1.1, { map: T.vending() }));
  front.position.set(0, 1.03, .401);
  vend.add(front);
  const vl = new THREE.PointLight('#8a7bff', 2.5, 3.5, 1.8);
  vl.position.set(0, 1.1, .9);
  vend.add(vl);
  scene.add(vend);

  // Crates, barrel, traffic cone, bin
  const crate = std('#4a3526', .85, 0);
  scene.add(box(.55, .45, .55, crate, -1.3, .225, -1.4).rotateY(.3));
  scene.add(box(.5, .4, .5, crate, -1.25, .65, -1.35).rotateY(-.2));
  scene.add(box(.6, .5, .6, crate, -.6, .25, -1.65));
  scene.add(cyl(.3, .3, .85, std('#1b4d6b', .5, .5), -3.9, .425, -.6, 20));
  const cone = new THREE.Group();
  cone.add(new THREE.Mesh(new THREE.ConeGeometry(.16, .5, 20), std('#ff5a1f', .6, 0)).translateY(.28));
  cone.add(box(.34, .04, .34, std('#ff5a1f', .6, 0), 0, .02, 0));
  cone.add(new THREE.Mesh(new THREE.CylinderGeometry(.1, .12, .08, 20, 1, true), std('#e9ecf5', .4, 0)).translateY(.28));
  cone.position.set(2.6, 0, 2.1);
  scene.add(cone);

  // Overhead cables
  const cableMat = new THREE.LineBasicMaterial({ color: '#0a0b10' });
  for (const [a, b, sag] of [
    [[-12, 6.2, -3], [5.6, 4.8, -.8], .8],
    [[5.6, 4.7, -.8], [14, 6.5, -4], .6],
    [[-10, 7, -6], [12, 7.4, -7], 1.2],
  ]) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), pts = [];
    for (let i = 0; i <= 24; i++) { const u = i / 24; const p = A.clone().lerp(B, u); p.y -= Math.sin(u * Math.PI) * sag; pts.push(p); }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), cableMat));
  }

  // Puddle ripples: a few expanding rings on the ground.
  const ringMat = new THREE.MeshBasicMaterial({ color: '#6d7a92', transparent: true, opacity: .3, depthWrite: false });
  const rings = [];
  const rr = T.rng(99);
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 32), ringMat.clone());
    m.rotation.x = -Math.PI / 2;
    m.position.set(-4 + rr() * 9, .01, -1 + rr() * 5);
    m.userData.phase = rr();
    scene.add(m); rings.push(m);
  }
  updaters.push((t) => rings.forEach((m) => {
    const p = (t * .7 + m.userData.phase) % 1;
    if (p < .02) m.position.set(-4 + Math.random() * 9, .01, -1 + Math.random() * 5);
    m.scale.setScalar(.02 + p * .22);
    m.material.opacity = (1 - p) * .35;
  }));
}

// Skyline -----------------------------------------------------------------------

function buildSkyline(scene) {
  const r = T.rng(42);
  const darkSide = new THREE.MeshBasicMaterial({ color: '#07080d' });
  for (let row = 0; row < 2; row++) {
    let x = -34;
    while (x < 34) {
      const w = 3 + r() * 5, h = 7 + r() * (row ? 22 : 14), d = 4;
      const tex = T.facade(1 + (r() * 1000 | 0));
      tex.repeat.set(w / 3.5, h / 7);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      const front = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color().setScalar(row ? .22 : .32) });
      const mats = [darkSide, darkSide, darkSide, darkSide, front, darkSide];
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
      b.position.set(x + w / 2, h / 2, -12 - row * 9 - r() * 3);
      scene.add(b);
      // Occasional rooftop neon
      if (r() < .3) {
        const col = ['#ff2bd6', '#2af3ff', '#ffb020'][r() * 3 | 0];
        scene.add(box(w * .6, .25, .1, glow(col, 2.5), x + w / 2, h + .3, b.position.z + d / 2));
      }
      x += w + .3 + r() * 1.2;
    }
  }
}

// Rain ----------------------------------------------------------------------------

function buildRain(scene) {
  const N = 1400, len = .28;
  const pos = new Float32Array(N * 6);
  const speed = new Float32Array(N);
  const X = [-9, 9], Y = [0, 9], Z = [-6, 6];
  for (let i = 0; i < N; i++) {
    const x = X[0] + Math.random() * (X[1] - X[0]);
    const y = Math.random() * Y[1];
    const z = Z[0] + Math.random() * (Z[1] - Z[0]);
    pos.set([x, y, z, x + .02, y + len, z], i * 6);
    speed[i] = 9 + Math.random() * 5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#9fb4d6', transparent: true, opacity: .16, depthWrite: false }));
  lines.frustumCulled = false;
  scene.add(lines);
  return {
    object: lines,
    update(dt) {
      for (let i = 0; i < N; i++) {
        const o = i * 6;
        let y = pos[o + 1] - speed[i] * dt;
        if (y < 0) y += Y[1];
        pos[o + 1] = y; pos[o + 4] = y + len;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}
