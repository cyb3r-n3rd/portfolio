// The diorama: a little night stall floating in the dark, built entirely from
// Three.js primitives with canvas textures (see textures.js). No external assets.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from './textures.js';
import { profile, projects } from './content.js';

// Signpost boards → which section they open.
export const SECTIONS = [
  { id: 'projects', label: 'projects', color: '#ff4fa3', dir: 'right' },
  { id: 'research', label: 'research', color: '#b6ff3b', dir: 'left' },
  { id: 'about', label: 'about me', color: '#2af3ff', dir: 'right' },
  { id: 'contact', label: 'contact', color: '#ffb020', dir: 'left' },
];

const G = 0; // ground level (no slab: the stall sits straight on the glowing floor)

// Helpers ---------------------------------------------------------------------

// Lambert instead of PBR: much cheaper per pixel and gives the soft, painted,
// "baked" look rather than glossy CG. (roughness/metalness args are ignored.)
const std = (color, roughness, metalness, extra = {}) =>
  new THREE.MeshLambertMaterial({ color, ...extra });
const glow = (color, intensity = 2) =>
  new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), toneMapped: false });

function rbox(w, h, d, mat, x = 0, y = 0, z = 0, r = .04) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), mat);
  m.position.set(x, y, z);
  return m;
}
function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}
function plane(w, h, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  return m;
}
function tube(points, radius, mat, closed = false, tension = .5) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', tension);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, points.length * 16), radius, 8, closed), mat);
}
function sag(a, b, amount, n = 20) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n; const p = A.clone().lerp(B, u); p.y -= Math.sin(u * Math.PI) * amount; pts.push(p); }
  return pts;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------------------

export function buildWorld(scene, renderer) {
  const updaters = [];
  const clickables = [];
  const screens = {};

  scene.background = new THREE.Color('#050407');
  scene.fog = new THREE.Fog('#050407', 18, 40);

  const root = new THREE.Group();
  scene.add(root);

  buildGround(root);
  buildLights(root);
  buildShop(root, updaters, clickables, screens);
  buildRoof(root, updaters);
  buildVending(root, updaters, clickables, screens);
  buildArcade(root, updaters, clickables, screens);
  buildTV(root, updaters, clickables, screens);
  buildSignpost(root, updaters, clickables);
  buildProps(root, updaters);


  return {
    clickables,
    screens,
    update(t, dt) { for (const u of updaters) u(t, dt); },
  };
}

// Ground & lights ------------------------------------------------------------------

function buildGround(root) {
  // Light pools and contact shadows are painted into the texture ("baked"),
  // so the floor costs one unlit draw and no shadow maps.
  const size = 32;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: T.bakedFloor(size), fog: false }),
  );
  floor.rotation.x = -Math.PI / 2;
  root.add(floor);
}

function buildLights(root) {
  // Warm plum fill from above, dark below: dark areas read purple, not grey.
  root.add(new THREE.HemisphereLight('#6b4a86', '#140a18', 1.1));
  const key = new THREE.DirectionalLight('#ffd0e6', .9);
  key.position.set(-6, 10, 8);
  root.add(key);
  const rim = new THREE.DirectionalLight('#3fd6e0', .55);
  rim.position.set(7, 5, -6);
  root.add(rim);
}

// Shop -------------------------------------------------------------------------

function buildShop(root, updaters, clickables, screens) {
  const g = new THREE.Group();
  g.position.y = G;
  root.add(g);

  const wallMat = std('#ffffff', .75, 0, { map: T.wall('#9a3a2b', 3) });
  const wallMatPlain = std('#ffffff', .75, 0, { map: T.wall('#7e2f25', 8, false) });
  const wood = std('#ffffff', .7, 0, { map: T.planks('#c8703e') });
  const darkWood = std('#ffffff', .7, 0, { map: T.planks('#6b3a26', 5) });
  const trim = std('#ff5c9a', .45, .1);
  const cream = std('#efe6d6', .5, 0);

  // Shell
  g.add(rbox(3.4, 3.1, .14, wallMatPlain, 0, 1.55, -1.3, .02));
  g.add(rbox(.14, 3.1, 2.3, wallMat, -1.64, 1.55, -.2, .02));
  g.add(rbox(.14, 3.1, 2.3, wallMat, 1.64, 1.55, -.2, .02));
  g.add(rbox(3.3, .04, 2.2, darkWood, 0, .02, -.2, .01)); // inner floor

  // Counter
  g.add(rbox(3.4, 1.0, .5, wood, 0, .5, .75, .03));
  g.add(rbox(3.62, .09, .72, cream, 0, 1.04, .75, .03));
  g.add(rbox(3.42, .05, .05, trim, 0, .06, 1.01, .02));
  g.add(plane(3.3, .03, glow('#2af3ff', 3), 0, .98, 1.112));

  // Corner posts
  for (const x of [-1.64, 1.64]) g.add(rbox(.18, 3.1, .18, trim, x, 1.55, .92, .04));

  // Fascia + name sign
  g.add(rbox(3.62, .78, .2, std('#2a1730', .6, .1), 0, 2.8, .95, .04));
  const signTex = T.shopSign("SHIVAM'S", profile.handle.toUpperCase());
  const sign = plane(3.4, .72, new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false }), 0, 2.8, 1.052);
  sign.material.color.setScalar(1.1);
  g.add(sign);
  // Faulty sign: dims for a beat every few seconds.
  let nextGlitch = 4;
  updaters.push((t) => {
    if (t < nextGlitch) return;
    sign.material.color.setScalar(Math.sin(t * 70) > 0 ? 1.1 : .4);
    if (t > nextGlitch + .35) { nextGlitch = t + 4 + Math.random() * 6; sign.material.color.setScalar(1.1); }
  });

  // Awning
  const { map, alphaMap } = T.awning('#7a55e6', '#b7a4ff');
  const awn = new THREE.Mesh(new THREE.PlaneGeometry(3.7, .7, 1, 1),
    std('#ffffff', .8, 0, { map, alphaMap, alphaTest: .5, side: THREE.DoubleSide }));
  awn.rotation.x = -1.3;
  awn.position.set(0, 2.3, 1.36);
  g.add(awn);

  // Lanterns under the awning
  const lanternCols = ['#ff4fa3', '#ffb020', '#ff4fa3'];
  [-1.15, 0, 1.15].forEach((x, i) => {
    const l = new THREE.Group();
    l.add(cyl(.004, .004, .22, std('#111'), 0, .22, 0, 6));
    const body = new THREE.Mesh(new THREE.SphereGeometry(.13, 20, 14), glow(lanternCols[i], 1.6));
    body.scale.y = 1.25;
    l.add(body);
    l.add(cyl(.07, .07, .04, std('#222'), 0, .16, 0), cyl(.07, .07, .04, std('#222'), 0, -.16, 0));
    l.position.set(x, 1.98, 1.3);
    g.add(l);
    updaters.push((t) => { l.rotation.z = Math.sin(t * 1.3 + i) * .05; });
  });

  // About monitor on the back wall
  const mon = new THREE.Group();
  mon.position.set(0, 1.78, -1.16);
  mon.add(rbox(1.42, .9, .1, std('#1b6f73', .4, .3), 0, 0, 0, .05));
  mon.add(rbox(1.3, .78, .02, std('#0a0a0f', .3, 0), 0, 0, .05, .01));
  mon.add(rbox(.3, .16, .12, std('#1b6f73', .4, .3), 0, -.5, -.02, .03));
  const monTex = T.monitorScreen(profile.name);
  const monScreen = plane(1.24, .74, new THREE.MeshBasicMaterial({ map: monTex.texture, toneMapped: false }), 0, 0, .062);
  monScreen.material.color.setScalar(1.1);
  mon.add(monScreen);
  g.add(mon);
  updaters.push((t) => monTex.update(t));
  monScreen.userData.section = 'about';
  screens.about = monScreen;
  clickables.push(monScreen);

  // Shelves either side of the monitor
  const bowlMat = std('#f2efe8', .35, 0);
  const shelfCols = ['#ff4fa3', '#2af3ff', '#ffb020', '#b6ff3b', '#8a7bff'];
  let n = 0;
  for (const side of [-1, 1]) {
    for (const y of [1.45, 1.95, 2.45]) {
      g.add(rbox(.8, .04, .26, darkWood, side * 1.15, y, -1.12, .01));
      for (let k = 0; k < 3; k++, n++) {
        const x = side * 1.15 + (k - 1) * .24;
        if (n % 3 !== 1) {
          g.add(cyl(.06, .06, .16, std(shelfCols[n % 5], .3, 0), x, y + .1, -1.1, 16));
        } else {
          const b = new THREE.Mesh(new THREE.SphereGeometry(.09, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bowlMat);
          b.rotation.x = Math.PI; b.position.set(x, y + .11, -1.1);
          g.add(b);
        }
      }
    }
  }

  // Counter props: ramen, chopsticks, a rubber duck (for debugging, obviously), keyboard
  const noodle = std('#ffd98a', .6, 0);
  [-1.1, .1].forEach((x) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(.14, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std('#d8384f', .35, 0, { side: THREE.DoubleSide }));
    b.rotation.x = Math.PI; b.position.set(x, 1.23, .78);
    g.add(b);
    g.add(cyl(.13, .13, .01, noodle, x, 1.2, .78));
    g.add(cyl(.006, .006, .34, std('#e9d3a8'), x + .04, 1.32, .78).rotateZ(1.1));
    g.add(cyl(.006, .006, .34, std('#e9d3a8'), x + .06, 1.33, .76).rotateZ(1.2));
  });
  const duck = new THREE.Group();
  duck.add(new THREE.Mesh(new THREE.SphereGeometry(.09, 20, 14), std('#ffd23a', .3)).translateY(.08));
  duck.add(new THREE.Mesh(new THREE.SphereGeometry(.06, 20, 14), std('#ffd23a', .3)).translateY(.19).translateX(.04));
  duck.add(new THREE.Mesh(new THREE.ConeGeometry(.025, .06, 12), std('#ff7a1a', .4)).translateY(.19).translateX(.11).rotateZ(-Math.PI / 2));
  duck.position.set(1.15, 1.09, .75);
  duck.rotation.y = -.6;
  g.add(duck);
  g.add(rbox(.5, .03, .18, std('#2b2b3a', .5), -.5, 1.1, .72, .01));

  // Stools
  for (const x of [-1.1, 0, 1.1]) {
    g.add(cyl(.2, .2, .07, wood, x, .74, 1.38));
    g.add(cyl(.03, .04, .7, std('#2a2240', .4, .5), x, .37, 1.38, 10));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.13, .012, 8, 24), std('#2a2240', .4, .5));
    ring.position.set(x, .28, 1.38); ring.rotation.x = Math.PI / 2;
    g.add(ring);
  }

  // Warm light inside
  const warm = new THREE.PointLight('#ffb36b', 9, 6, 1.4);
  warm.position.set(0, 2.5, 0);
  g.add(warm);

  // Back: mural, door and a lamp so the stall is worth orbiting around
  const mural = plane(3.3, 2.9, std('#ffffff', .8, 0, { map: T.mural(profile.handle) }), 0, 1.5, -1.375);
  mural.rotation.y = Math.PI;
  g.add(mural);
  const door = new THREE.Group();
  door.add(rbox(.8, 1.75, .06, std('#1f7a78', .5, .2), 0, .875, 0, .03));
  door.add(rbox(.1, .03, .05, std('#d7dbe4', .3, .8), -.28, .9, -.04, .01));
  door.add(rbox(.5, .25, .02, std('#e9fbff', .6), 0, 1.45, -.035, .01));
  door.add(plane(.46, .2, new THREE.MeshBasicMaterial({ map: T.label('STAFF ONLY', { bg: '#e9fbff', fg: '#16122b', size: 70, font: T.FONT_UI, weight: 700, w: 512, h: 220 }) }), 0, 1.45, -.047).rotateY(Math.PI));
  door.position.set(.95, 0, -1.4);
  g.add(door);
  const backLamp = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), glow('#ffd9a3', 2));
  backLamp.rotation.x = Math.PI;
  backLamp.position.set(.95, 2.1, -1.47);
  g.add(backLamp, rbox(.28, .05, .16, std('#2a2240', .5, .4), .95, 2.13, -1.44, .02));
  const backLight = new THREE.PointLight('#ffc98a', 5, 5, 1.6);
  backLight.position.set(.95, 1.95, -1.9);
  g.add(backLight);

  // Vertical "HACK" sign on the right corner
  const [vc, vctx] = T.canvas(256, 1024);
  vctx.fillStyle = '#1b1440'; vctx.fillRect(0, 0, 256, 1024);
  vctx.strokeStyle = '#b6ff3b'; vctx.lineWidth = 10; vctx.shadowColor = '#b6ff3b'; vctx.shadowBlur = 20;
  vctx.strokeRect(18, 18, 220, 988);
  vctx.fillStyle = '#eaffc4'; vctx.font = `120px ${T.FONT_PIXEL}`; vctx.textAlign = 'center'; vctx.textBaseline = 'middle';
  'HACK'.split('').forEach((ch, i) => vctx.fillText(ch, 128, 150 + i * 240));
  const vs = new THREE.Group();
  vs.add(rbox(.4, 1.5, .1, std('#1b1440', .6), 0, 0, 0, .03));
  const vsMat = new THREE.MeshBasicMaterial({ map: T.toTexture(vc), toneMapped: false });
  const vsFace = plane(.38, 1.46, vsMat, 0, 0, .052);
  const vsBack = plane(.38, 1.46, vsMat, 0, 0, -.052); vsBack.rotation.y = Math.PI;
  vs.add(vsFace, vsBack);
  vs.add(rbox(.5, .05, .05, std('#2a2240', .4, .5), -.25, .8, 0, .02));
  vs.position.set(2.0, 2.35, .98);
  vs.rotation.y = -Math.PI / 2 + .25;
  g.add(vs);
}

// Roof clutter ---------------------------------------------------------------------

function buildRoof(root, updaters) {
  const g = new THREE.Group();
  g.position.y = G + 3.1;
  root.add(g);
  const roofMat = std('#3a2238', .7, .1);
  const metal = std('#8d97b5', .45, .6);
  const darkMetal = std('#3b3558', .5, .5);

  g.add(rbox(3.9, .2, 2.75, roofMat, 0, .1, -.18, .05));
  g.add(rbox(3.9, .12, .12, std('#ff4fa3', .45), 0, .26, 1.14, .03));

  // Water tank on legs
  const tank = new THREE.Group();
  tank.add(cyl(.42, .42, .8, std('#5f7fb0', .5, .3), 0, .95, 0));
  tank.add(new THREE.Mesh(new THREE.ConeGeometry(.46, .25, 24), std('#46618d', .5, .3)).translateY(1.47));
  for (const [x, z] of [[-.3, -.3], [.3, -.3], [-.3, .3], [.3, .3]]) tank.add(cyl(.03, .03, .6, darkMetal, x, .4, z, 8));
  for (const y of [.75, 1.15]) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(.43, .015, 6, 32), darkMetal);
    hoop.position.y = y; hoop.rotation.x = Math.PI / 2;
    tank.add(hoop);
  }
  tank.position.set(-1.1, .1, -.8);
  g.add(tank);

  // AC units with spinning fans
  [[.95, -.85, 0], [1.4, -.05, -.4]].forEach(([x, z, ry], i) => {
    const ac = new THREE.Group();
    ac.add(rbox(.7, .5, .45, std('#c9cfdc', .5, .2), 0, .25, 0, .04));
    ac.add(new THREE.Mesh(new THREE.CircleGeometry(.18, 24), std('#2a2a33', .6)).translateY(.25).translateZ(.231));
    const fan = new THREE.Group();
    for (let b = 0; b < 3; b++) { const blade = rbox(.3, .06, .01, darkMetal, 0, 0, 0, .005); blade.rotation.z = b * Math.PI / 1.5; fan.add(blade); }
    fan.position.set(0, .25, .235);
    ac.add(fan);
    ac.position.set(x, .2, z); ac.rotation.y = ry;
    g.add(ac);
    updaters.push((t) => { fan.rotation.z = t * (6 + i * 2); });
  });

  // Satellite dish
  const dish = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(.42, 32, 12, 0, Math.PI * 2, 0, .75), std('#e8ecf5', .4, .2, { side: THREE.DoubleSide }));
  bowl.rotation.x = Math.PI / 2 + .5;
  dish.add(bowl);
  dish.add(cyl(.04, .05, .6, darkMetal, 0, -.35, -.1, 8));
  dish.position.set(.1, .75, -1.05);
  dish.rotation.y = .5;
  g.add(dish);

  // Antenna mast with a blinking beacon
  const mast = new THREE.Group();
  mast.add(cyl(.025, .035, 2.2, metal, 0, 1.1, 0, 8));
  for (const [y, w] of [[1.5, .7], [1.8, .5], [2.05, .3]]) { const bar = cyl(.012, .012, w, metal, 0, y, 0, 6); bar.rotation.z = Math.PI / 2; mast.add(bar); }
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(.05, 12, 8), glow('#ff3b3b', 3));
  beacon.position.y = 2.24;
  mast.add(beacon);
  mast.position.set(-.35, .2, -1.2);
  g.add(mast);
  updaters.push((t) => { beacon.visible = (t % 1.6) < .8; });

  // Rooftop neon: a padlock on a board
  const lock = new THREE.Group();
  const neon = glow('#b6ff3b', 1.25);
  const w = .62, h = .5, r = .09;
  const body = [
    V(-w / 2 + r, -h / 2, 0), V(w / 2 - r, -h / 2, 0), V(w / 2, -h / 2 + r, 0), V(w / 2, h / 2 - r, 0),
    V(w / 2 - r, h / 2, 0), V(-w / 2 + r, h / 2, 0), V(-w / 2, h / 2 - r, 0), V(-w / 2, -h / 2 + r, 0),
  ];
  lock.add(tube(body, .024, neon, true, .2));
  const shackle = [];
  for (let i = 0; i <= 20; i++) { const a = Math.PI * i / 20; shackle.push(V(Math.cos(a) * .19, h / 2 + .04 + Math.sin(a) * .24, 0)); }
  lock.add(tube([V(.19, h / 2, 0), ...shackle, V(-.19, h / 2, 0)], .024, neon));
  const pinkNeon = glow('#ff4fa3', 2.6);
  lock.add(tube([V(0, .02, 0), V(0, -.12, 0)], .026, pinkNeon));
  lock.add(new THREE.Mesh(new THREE.SphereGeometry(.055, 16, 12), pinkNeon).translateY(.06));
  lock.add(rbox(.9, 1.15, .05, std('#1b1440', .6, .2), 0, .17, -.07, .03));
  lock.add(cyl(.025, .025, 1.0, darkMetal, -.3, -.75, -.12, 8), cyl(.025, .025, 1.0, darkMetal, .3, -.75, -.12, 8));
  lock.position.set(.95, 1.45, .45);
  lock.rotation.y = -.25;
  g.add(lock);
  updaters.push((t) => { neon.color.setRGB(.71, 1, .23).multiplyScalar(1.2 + Math.sin(t * 3) * .12); });

  // Pipes down the side wall
  const pipe = std('#8d97b5', .4, .6);
  g.add(tube([V(-1.78, .1, -1.1), V(-1.78, -1.5, -1.1), V(-1.78, -3.0, -1.1)], .05, pipe));

  // Cables from the roof to the lamp post and across to the arcade
  const cable = std('#111018', .8);
  g.add(tube(sag([-1.9, .15, .9], [-3.2, .95, 1.5], .2), .012, cable));
  g.add(tube(sag([1.9, .2, .8], [3.55, -.9, .7], .2), .012, cable));
  // String lights along the front edge
  const pts = sag([-1.85, .05, 1.22], [1.85, .05, 1.22], .12);
  g.add(tube(pts, .006, cable));
  const bulbs = [];
  pts.forEach((p, i) => {
    if (i % 2 || i === 0 || i === pts.length - 1) return;
    const b = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), glow(['#ffd27a', '#ff6fd8', '#6ff4ff'][i % 3], 2.4));
    b.position.copy(p).add(V(0, -.04, 0));
    g.add(b); bulbs.push(b);
  });
  updaters.push((t) => bulbs.forEach((b, i) => { b.visible = Math.sin(t * 2 + i * 1.7) > -.85; }));
}

// Vending machine (Projects) ---------------------------------------------------------

function buildVending(root, updaters, clickables, screens) {
  const g = new THREE.Group();
  g.position.set(2.5, G, -.25);
  g.rotation.y = -.18;
  root.add(g);

  g.add(rbox(1.0, 2.0, .82, std('#17b8b0', .45, .15), 0, 1.0, 0, .06));
  g.add(rbox(.86, 1.08, .06, std('#0e5e5e', .5), 0, 1.2, .4, .03));
  const tex = T.vendingScreen(projects);
  const screen = plane(.72, .96, new THREE.MeshBasicMaterial({ map: tex.texture, toneMapped: false }), 0, 1.2, .435);
  g.add(screen);
  updaters.push((t) => tex.update(t));
  screen.userData.section = 'projects';
  screens.projects = screen;
  clickables.push(screen);

  g.add(rbox(.9, .26, .06, std('#2640a8', .5), 0, 1.84, .41, .03));
  g.add(plane(.84, .2, new THREE.MeshBasicMaterial({ map: T.label('0xC0FFEE', { bg: '#2640a8', fg: '#fff6a8', glow: '#ffb020', size: 80 }), toneMapped: false }), 0, 1.84, .442));
  g.add(rbox(.62, .2, .08, std('#0b3b3a', .6), 0, .38, .41, .03));
  g.add(rbox(.5, .08, .06, std('#05191a', .6), 0, .38, .44, .02));
  g.add(rbox(.12, .2, .05, std('#d7dbe4', .3, .6), .38, .75, .41, .02));
  const vBack = plane(.9, 1.9, std('#ffffff', .6, .1, { map: T.backPanel('#0f5f5b', 4) }), 0, 1.0, -.414);
  vBack.rotation.y = Math.PI;
  g.add(vBack);
  // One teal light covers both the vending machine and the arcade.
  const l = new THREE.PointLight('#3fe6d8', 6, 6, 1.4);
  l.position.set(.7, 1.5, 1.4);
  g.add(l);
}

// Arcade cabinet (Contact) ------------------------------------------------------------

function buildArcade(root, updaters, clickables, screens) {
  const g = new THREE.Group();
  g.position.set(3.7, G, .75);
  g.rotation.y = -.6;
  root.add(g);

  // Side profile (x = toward the front, y = height), extruded across the width.
  const s = new THREE.Shape();
  s.moveTo(-.35, 0); s.lineTo(.35, 0); s.lineTo(.35, .95); s.lineTo(.52, 1.02); s.lineTo(.5, 1.12);
  s.lineTo(.3, 1.14); s.lineTo(.2, 1.78); s.lineTo(.32, 1.84); s.lineTo(.32, 2.12); s.lineTo(-.35, 2.12); s.closePath();
  const W = .8;
  const geo = new THREE.ExtrudeGeometry(s, { depth: W, bevelEnabled: true, bevelSize: .015, bevelThickness: .015, bevelSegments: 2 });
  geo.rotateY(-Math.PI / 2);
  geo.translate(W / 2, 0, 0);
  g.add(new THREE.Mesh(geo, std('#6b3fd6', .45, .1)));
  // Neon trim on both sides
  const edge = [[.35, 0], [.35, .95], [.52, 1.02], [.5, 1.12], [.3, 1.14], [.2, 1.78], [.32, 1.84], [.32, 2.12]];
  for (const x of [-W / 2 - .03, W / 2 + .03]) g.add(tube(edge.map(([z, y]) => V(x, y, z)), .012, glow('#ff4fa3', 2.4), false, 0));

  // Screen on the slanted face
  const face = new THREE.Group();
  face.position.set(0, 1.46, .255);
  face.rotation.x = -Math.atan2(.1, .64);
  face.add(rbox(.72, .62, .02, std('#0a0a12', .4), 0, 0, 0, .01));
  const tex = T.arcadeScreen();
  const screen = plane(.62, .48, new THREE.MeshBasicMaterial({ map: tex.texture, toneMapped: false }), 0, 0, .012);
  face.add(screen);
  g.add(face);
  updaters.push((t) => tex.update(t));
  screen.userData.section = 'contact';
  screens.contact = screen;
  clickables.push(screen);

  // Marquee
  g.add(plane(.76, .24, new THREE.MeshBasicMaterial({ map: T.label('CONTACT', { bg: '#1b1440', fg: '#ffe066', glow: '#ff4fa3', size: 70, w: 768, h: 240 }), toneMapped: false }), 0, 1.98, .336));
  // Controls
  const cp = new THREE.Group();
  cp.position.set(0, 1.08, .42);
  cp.rotation.x = .35;
  cp.add(rbox(.76, .03, .18, std('#1b1440', .5), 0, 0, 0, .01));
  cp.add(cyl(.012, .012, .08, std('#222'), -.2, .05, 0, 8));
  cp.add(new THREE.Mesh(new THREE.SphereGeometry(.03, 16, 12), std('#ff3b3b', .3)).translateX(-.2).translateY(.1));
  ['#2af3ff', '#ffb020', '#b6ff3b', '#ff4fa3'].forEach((c, i) => cp.add(cyl(.025, .025, .025, std(c, .3), .04 + (i % 2) * .09 + (i > 1 ? .04 : 0), .02, i > 1 ? .04 : -.04, 16)));
  g.add(cp);
  // Coin door
  g.add(rbox(.3, .34, .02, std('#1b1440', .5), 0, .5, .36, .01));
  g.add(plane(.05, .1, glow('#ff3b3b', 1.5), -.06, .55, .372), plane(.05, .1, glow('#ff3b3b', 1.5), .06, .55, .372));

  const aBack = plane(.7, 1.95, std('#ffffff', .6, .1, { map: T.backPanel('#3d2185', 8) }), 0, 1.06, -.37);
  aBack.rotation.y = Math.PI;
  g.add(aBack);
}

// Wall TV (Research) ----------------------------------------------------------------

function buildTV(root, updaters, clickables, screens) {
  const g = new THREE.Group();
  g.position.set(-1.74, G + 2.05, -.35);
  g.rotation.y = -Math.PI / 2;
  root.add(g);

  g.add(rbox(.3, .06, .3, std('#3b3558', .5, .5), 0, -.1, -.1, .02));
  g.add(rbox(1.02, .78, .5, std('#e3d7c3', .5, 0), 0, 0, .12, .08));
  g.add(rbox(.9, .66, .04, std('#2b2b33', .5), 0, 0, .37, .03));
  const tex = T.tvScreen();
  const screen = plane(.82, .6, new THREE.MeshBasicMaterial({ map: tex.texture, toneMapped: false }), 0, 0, .392);
  g.add(screen);
  const earMat = std('#aaaaaa', .3, .8);
  const ear1 = cyl(.008, .008, .5, earMat, -.15, .55, .1, 6); ear1.rotation.z = .5;
  const ear2 = cyl(.008, .008, .5, earMat, .15, .55, .1, 6); ear2.rotation.z = -.5;
  g.add(ear1, ear2);
  updaters.push((t) => tex.update(t));
  screen.userData.section = 'research';
  screens.research = screen;
  clickables.push(screen);

}

// Signpost ----------------------------------------------------------------------

function arrowShape(w, h, dir) {
  const s = new THREE.Shape(), tip = h * .4;
  if (dir === 'right') { s.moveTo(0, -h / 2); s.lineTo(w - tip, -h / 2); s.lineTo(w, 0); s.lineTo(w - tip, h / 2); s.lineTo(0, h / 2); }
  else { s.moveTo(0, -h / 2); s.lineTo(-(w - tip), -h / 2); s.lineTo(-w, 0); s.lineTo(-(w - tip), h / 2); s.lineTo(0, h / 2); }
  s.closePath();
  return s;
}

function buildSignpost(root, updaters, clickables) {
  const g = new THREE.Group();
  g.position.set(-3.3, G, 1.55);
  g.rotation.y = .3;
  root.add(g);

  const post = std('#2b2350', .4, .5);
  g.add(rbox(.42, .22, .42, std('#1b1535', .6, .3), 0, .11, 0, .05));
  g.add(cyl(.075, .09, 4.3, post, 0, 2.3, 0, 16));
  g.add(cyl(.11, .11, .1, std('#ff4fa3', .4), 0, 1.0, 0));

  // Twin globe lamps
  g.add(rbox(1.4, .07, .07, post, 0, 4.25, 0, .03));
  const globes = [];
  [[-.62, '#ffa3ea'], [.62, '#fff2e6']].forEach(([x, col]) => {
    g.add(cyl(.05, .07, .12, post, x, 4.18, 0, 12));
    const globe = new THREE.Mesh(new THREE.SphereGeometry(.26, 32, 20), glow(col, 2.2));
    globe.position.set(x, 3.9, 0);
    g.add(globe);
    globes.push(globe);
  });
  // One pink light between the two globes.
  const lampLight = new THREE.PointLight('#ff6fcf', 16, 12, 1.4);
  lampLight.position.set(0, 3.6, .2);
  g.add(lampLight);

  // Status box on the pole
  g.add(rbox(.34, .42, .18, std('#1fae63', .45, .1), 0, 3.35, .08, .04));
  g.add(plane(.26, .12, new THREE.MeshBasicMaterial({ map: T.label('OPEN', { bg: '#062417', fg: '#b6ff3b', glow: '#b6ff3b', size: 110, w: 512, h: 240 }), toneMapped: false }), 0, 3.43, .175));
  g.add(plane(.26, .1, new THREE.MeshBasicMaterial({ map: T.label('24/7', { bg: '#062417', fg: '#ffffff', size: 100, w: 512, h: 200 }), toneMapped: false }), 0, 3.27, .175));

  // Arrow boards
  const W = 1.35, H = .34;
  SECTIONS.forEach((sec, i) => {
    const sg = new THREE.Group();
    sg.position.y = 2.85 - i * .47;
    sg.rotation.y = (i % 2 ? -1 : 1) * (.15 + i * .05);
    g.add(sg);
    const x0 = sec.dir === 'right' ? .06 : -.06;

    const board = new THREE.Mesh(
      new THREE.ExtrudeGeometry(arrowShape(W, H, sec.dir), { depth: .05, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 2 }),
      std(new THREE.Color(sec.color).multiplyScalar(.55), .5),
    );
    board.position.set(x0, 0, -.025);
    sg.add(board);
    sg.add(rbox(.16, .06, .06, post, 0, 0, 0, .02));

    const cx = x0 + (sec.dir === 'right' ? W / 2 : -W / 2);
    const face = (dir, z, ry) => {
      const tex = T.arrowSign(sec.label, sec.color, dir);
      const m = new THREE.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: .45, alphaTest: .5 });
      const p = plane(W + .02, H + .02, m, cx, 0, z);
      p.rotation.y = ry;
      p.userData.noShadow = true;
      sg.add(p);
      return m;
    };
    const mats = [face(sec.dir, .04, 0), face(sec.dir === 'right' ? 'left' : 'right', -.04, Math.PI)];

    const hit = new THREE.Mesh(new THREE.BoxGeometry(W + .1, H + .12, .2), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(cx, 0, 0);
    hit.userData.section = sec.id;
    hit.userData.sign = true;
    sg.add(hit);
    clickables.push(hit);

    let k = 0;
    updaters.push((t, dt) => {
      k += ((hit.userData.hover ? 1 : 0) - k) * Math.min(1, dt * 10);
      mats.forEach((m) => { m.emissiveIntensity = .45 + k * .7; });
      sg.scale.setScalar(1 + k * .06);
      sg.rotation.z = Math.sin(t * 2.2 + i) * .012 + k * Math.sin(t * 8) * .02;
    });
  });

  updaters.push((t) => globes.forEach((gl, i) => gl.scale.setScalar(1 + Math.sin(t * 2 + i * 2) * .015)));
}

// Props ---------------------------------------------------------------------------

function buildProps(root, updaters) {
  // Chalkboard A-frame
  const menu = new THREE.Group();
  const menuTex = T.menuBoard();
  const board = rbox(.62, .92, .04, std('#ffffff', .9, 0, { map: menuTex, emissiveMap: menuTex, emissive: '#ffffff', emissiveIntensity: .25 }), 0, .58, .05, .01);
  board.rotation.x = -.16;
  menu.add(board);
  const frameMat = std('#8a4b2a', .7);
  for (const x of [-.33, .33]) {
    const front = rbox(.05, 1.0, .05, frameMat, x, .5, .02, .02); front.rotation.x = -.16; menu.add(front);
    const back = rbox(.05, 1.0, .05, frameMat, x, .5, -.3, .02); back.rotation.x = .2; menu.add(back);
  }
  menu.position.set(-1.35, G, 2.0);
  menu.rotation.y = .3;
  root.add(menu);

  // Crates
  const crate = std('#ffffff', .8, 0, { map: T.planks('#a0643c', 9) });
  const c1 = rbox(.55, .45, .55, crate, -2.35, G + .225, -1.1, .03); c1.rotation.y = .3;
  const c2 = rbox(.5, .42, .5, crate, -2.3, G + .66, -1.05, .03); c2.rotation.y = -.1;
  const c3 = rbox(.5, .45, .5, crate, -2.25, G + .225, -.45, .03); c3.rotation.y = .1;
  root.add(c1, c2, c3);

  // Bin bags
  const bag = std('#2a2838', .75, 0);
  [[2.1, -1.35, .32], [2.5, -1.25, .26], [2.25, -1.0, .22]].forEach(([x, z, r]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), bag);
    m.scale.y = .75; m.position.set(x, G + r * .7, z);
    root.add(m);
  });

  // Potted plant
  const plant = new THREE.Group();
  plant.add(cyl(.2, .15, .35, std('#d45a3c', .7), 0, .175, 0));
  const leaf = std('#2fbf71', .6);
  for (let i = 0; i < 9; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 8), leaf);
    l.scale.set(.5, 1.4, .25);
    const a = i / 9 * Math.PI * 2;
    l.position.set(Math.cos(a) * .12, .55 + (i % 3) * .08, Math.sin(a) * .12);
    l.rotation.set(Math.sin(a) * .5, a, Math.cos(a) * .5);
    plant.add(l);
  }
  plant.position.set(1.95, G, 1.6);
  root.add(plant);

  // Traffic cone
  const cone = new THREE.Group();
  cone.add(new THREE.Mesh(new THREE.ConeGeometry(.15, .48, 24), std('#ff6a1f', .5)).translateY(.28));
  cone.add(rbox(.34, .04, .34, std('#ff6a1f', .5), 0, .02, 0, .01));
  cone.add(new THREE.Mesh(new THREE.CylinderGeometry(.085, .11, .07, 24, 1, true), std('#ffffff', .4)).translateY(.28));
  cone.position.set(-3.7, G, .1);
  root.add(cone);
}
