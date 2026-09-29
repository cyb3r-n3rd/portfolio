import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld } from './world.js';
import { mountUI } from './ui.js';
import { audio } from './audio.js';

const $ = (s) => document.querySelector(s);
const root = document.documentElement;
const body = document.body;
const canvas = $('#scene');
const uiRoot = $('#ui');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SECTION_IDS = ['about', 'projects', 'research', 'training', 'contact'];

const progress = (p, note) => {
  $('#gate-fill').style.width = `${p * 100}%`;
  if (note) $('#gate-note').textContent = note;
};

// Canvas textures need the web fonts before they're drawn.
async function loadFonts() {
  const faces = ['800 40px "Baloo 2"', '700 40px Quicksand', '600 40px Quicksand', '500 40px Quicksand', '40px "Press Start 2P"', '600 40px "JetBrains Mono"', '700 40px "JetBrains Mono"'];
  const timeout = new Promise((r) => setTimeout(r, 4000));
  await Promise.race([Promise.all([...faces.map((f) => document.fonts.load(f)), document.fonts.load('800 40px "Baloo 2"', 'चाय समोसा')]), timeout]);
}

let renderer = null;
try {
  // No canvas MSAA: the scene is drawn into the composer's target, which does its own.
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
} catch (e) {
  console.warn('WebGL unavailable, showing the flat page.', e);
}

if (renderer) start().catch((e) => { console.error(e); goFlat(); });
else goFlat();

function goFlat() {
  root.classList.add('flat');
  const ui = mountUI(uiRoot, { onBack() {} });
  uiRoot.querySelectorAll('.panel').forEach((p) => p.classList.add('active'));
  document.querySelectorAll('[data-open]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    uiRoot.querySelector(`[data-screen="${a.dataset.open}"]`)?.scrollIntoView({ behavior: 'smooth' });
  }));
  void ui;
}

async function start() {
  progress(.15, 'loading fonts…');
  await loadFonts();

  const small = Math.min(innerWidth, innerHeight) < 600;
  // Full device resolution (up to 2x): rendering below it and upscaling is what made v2 look soft.
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  // Neutral keeps hues true (ACES pushes neon toward white/yellow and reads "CG").
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, .05, 100);

  progress(.45, 'building the stall…');
  await new Promise((r) => setTimeout(r, 20));
  const world = buildWorld(scene, renderer);

  const target = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: devicePixelRatio >= 2 ? 2 : 4 }); // hi-DPI needs less MSAA
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .32, .1, .92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Orbit controls: free 360° around the stall, never under the floor.
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(.3, 1.8, 0);
  controls.enableDamping = true;
  controls.dampingFactor = .12;
  controls.enablePan = false;
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.0;
  controls.minPolarAngle = .35;
  controls.maxPolarAngle = 1.48;
  controls.autoRotateSpeed = .35;
  controls.enabled = false;

  const aspect = () => innerWidth / innerHeight;
  const homeDistance = () => (aspect() < .8 ? 17.5 : aspect() < 1.2 ? 15.5 : 13.5);
  // Portrait screens get a wider lens so the whole stall fits.
  function applyLens() {
    camera.fov = aspect() < .8 ? 50 : 35;
    camera.aspect = aspect();
    camera.updateProjectionMatrix();
  }
  applyLens();
  function applyDistanceLimits() {
    controls.minDistance = 5;
    controls.maxDistance = homeDistance() + 5;
  }
  applyDistanceLimits();

  const homeDir = () => new THREE.Vector3(aspect() < .8 ? -.25 : -.42, .33, 1).normalize();
  // On portrait, frame the signpost and shop; the arcade is a drag away.
  const homeTarget = () => (aspect() < .8 ? new THREE.Vector3(-1.3, 2.3, .5) : new THREE.Vector3(.3, 2.15, 0));
  const homePose = () => ({
    pos: homeTarget().addScaledVector(homeDir(), homeDistance()),
    target: homeTarget(),
  });

  // Start far away and high; the intro glides in after Start.
  const intro = homePose();
  camera.position.copy(intro.target).addScaledVector(new THREE.Vector3(.2, .9, 1).normalize(), homeDistance() * 2.1);
  camera.lookAt(intro.target);

  progress(.8, 'warming up the neon…');
  // Compile shaders in parallel where the GPU driver allows it, without freezing the page.
  // Start compiling now but don't wait: the Start button appears right away and the
  // shaders finish while the kadai animation plays. Start waits for it if clicked early.
  let warm = false;
  const warmedUp = renderer.compileAsync(scene, camera).then(() => { warm = true; composer.render(); });

  // State ---------------------------------------------------------------------------
  let state = 'gate'; // gate → intro → home ⇄ flying ⇄ viewing
  let current = null;
  let returnPose = null;
  let tween = null;
  let pending = SECTION_IDS.includes(location.hash.slice(1)) ? location.hash.slice(1) : null;

  const ui = mountUI(uiRoot, { onBack: () => close() });
  const ease = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  function flyTo(pose, duration, done) {
    tween = { fromPos: camera.position.clone(), fromTarget: controls.target.clone(), pose, t: 0, duration: reducedMotion ? .01 : duration, done };
  }
  function stepTween(dt) {
    if (!tween) return;
    tween.t = Math.min(1, tween.t + dt / tween.duration);
    const k = ease(tween.t);
    camera.position.lerpVectors(tween.fromPos, tween.pose.pos, k);
    controls.target.lerpVectors(tween.fromTarget, tween.pose.target, k);
    camera.lookAt(controls.target);
    if (tween.t >= 1) { const cb = tween.done; tween = null; cb && cb(); }
  }

  // Where to park the camera so a given screen fills ~80% of the view.
  const tmp = new THREE.Vector3();
  function dockPose(id) {
    const screen = world.screens[id];
    screen.updateWorldMatrix(true, false);
    const center = new THREE.Vector3().setFromMatrixPosition(screen.matrixWorld);
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(screen.matrixWorld);
    const { width: w, height: h } = screen.geometry.parameters;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const fill = .8;
    const d = Math.max((h / 2) / (tanV * fill), (w / 2) / (tanV * camera.aspect * fill));
    return { pos: center.clone().addScaledVector(normal, d), target: center };
  }

  // Pin the HTML screen over the projected 3D screen rectangle.
  function placeUI() {
    if (!current) return;
    const screen = world.screens[current];
    const { width: w, height: h } = screen.geometry.parameters;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]) {
      tmp.set(x, y, 0).applyMatrix4(screen.matrixWorld).project(camera);
      const sx = (tmp.x + 1) / 2 * innerWidth, sy = (1 - tmp.y) / 2 * innerHeight;
      minX = Math.min(minX, sx); maxX = Math.max(maxX, sx); minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
    }
    let rect = { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
    // Too small to read (phones): use the whole window, keeping the screen's look.
    const tooSmall = rect.width < 420 || rect.height < 300;
    uiRoot.classList.toggle('expanded', tooSmall);
    if (tooSmall) {
      const m = 10;
      rect = { left: m, top: m, width: innerWidth - m * 2, height: innerHeight - m * 2 };
    }
    Object.assign(uiRoot.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  }

  function open(id, { push = true } = {}) {
    if (!SECTION_IDS.includes(id)) return;
    if (push && location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    if (state === 'gate' || state === 'intro') { pending = id; return; }
    if (state === 'flying') return;
    if (state === 'home') returnPose = { pos: camera.position.clone(), target: controls.target.clone() };
    if (state === 'viewing') body.classList.remove('viewing');
    current = id;
    state = 'flying';
    body.classList.add('flying');
    controls.enabled = false;
    controls.autoRotate = false;
    setHover(null);
    audio.whoosh(1.9);
    audio.ambientLevel(.01);
    flyTo(dockPose(id), 1.9, () => {
      state = 'viewing';
      body.classList.remove('flying');
      ui.show(id);
      placeUI();
      body.classList.add('viewing');
      ui.focus(id);
    });
  }

  function close({ push = true } = {}) {
    if (state !== 'viewing') return;
    if (push && location.hash) history.pushState(null, '', location.pathname + location.search);
    body.classList.remove('viewing');
    state = 'flying';
    body.classList.add('flying');
    const back = returnPose || homePose();
    audio.whoosh(1.6);
    audio.ambientLevel(.035, 1.5);
    setTimeout(() => flyTo(back, 1.6, () => {
      state = 'home';
      current = null;
      body.classList.remove('flying');
      controls.enabled = true;
      idleSince = clock.elapsedTime;
    }), reducedMotion ? 0 : 200);
  }

  // Input -----------------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = null;

  function setHover(obj) {
    if (hovered === obj) return;
    if (hovered) hovered.userData.hover = false;
    hovered = obj;
    if (hovered) { hovered.userData.hover = true; if (hovered.userData.sign) audio.blip(); }
    canvas.classList.toggle('pointing', !!hovered);
  }
  function pick(e) {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(world.clickables, false)[0];
    return hit ? hit.object : null;
  }

  canvas.addEventListener('pointermove', (e) => {
    if (state === 'home' && e.pointerType === 'mouse' && !e.buttons) setHover(pick(e));
  });
  canvas.addEventListener('pointerleave', () => setHover(null));
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; body.classList.add('touched'); });
  canvas.addEventListener('pointerup', (e) => {
    const d = down; down = null;
    if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || state !== 'home') return;
    const obj = pick(e);
    if (obj) open(obj.userData.section);
  });
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  controls.addEventListener('end', () => { idleSince = clock.elapsedTime; });

  document.querySelectorAll('[data-open]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); open(a.dataset.open); }));
  $('[data-home]').addEventListener('click', (e) => { e.preventDefault(); close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  addEventListener('popstate', () => {
    const id = location.hash.slice(1);
    if (SECTION_IDS.includes(id)) open(id, { push: false }); else close({ push: false });
  });

  addEventListener('resize', () => {
    applyLens();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
    bloom.resolution.set(innerWidth / 2, innerHeight / 2);
    applyDistanceLimits();
    if (state === 'viewing') {
      const p = dockPose(current);
      camera.position.copy(p.pos); controls.target.copy(p.target); camera.lookAt(p.target);
      placeUI();
    }
  });

  // Loop -------------------------------------------------------------------------------
  const clock = new THREE.Clock();
  let idleSince = 0;

  // Adaptive resolution: keep dragging smooth on slower GPUs by trading a little
  // sharpness for frame rate, and win it back when there's headroom.
  const maxPR = Math.min(devicePixelRatio, 2);
  let pr = maxPR, frames = 0, elapsed = 0;
  function adaptResolution(raw) {
    frames++; elapsed += raw;
    if (elapsed < 1) return;
    const fps = frames / elapsed;
    frames = 0; elapsed = 0;
    const next = fps < 45 ? Math.max(1, pr - .25) : fps > 58 ? Math.min(maxPR, pr + .25) : pr;
    if (next !== pr) { pr = next; renderer.setPixelRatio(pr); composer.setPixelRatio(pr); }
  }

  renderer.setAnimationLoop(() => {
    if (!warm) return; // nothing to see behind the gate yet; don't force a blocking compile
    const raw = clock.getDelta();
    const dt = Math.min(raw, .05);
    adaptResolution(raw);
    const t = clock.elapsedTime;
    stepTween(Math.min(raw, .25));
    if (state === 'home') {
      // Drift slowly after ~10s of no input, like a shop window.
      if (!reducedMotion && !controls.autoRotate && t - idleSince > 10) controls.autoRotate = true;
      controls.update(dt);
    }
    world.update(t, dt);
    composer.render();
  });

  // Gate --------------------------------------------------------------------------------
  progress(1, '');
  const startBtn = $('#gate-start');
  $('#gate-bar').hidden = true;
  startBtn.hidden = false;
  startBtn.focus();
  const soundBtn = $('#sound');
  const syncSound = () => { soundBtn.setAttribute('aria-pressed', String(audio.muted)); soundBtn.setAttribute('aria-label', audio.muted ? 'Unmute sound' : 'Mute sound'); };
  syncSound();
  soundBtn.addEventListener('click', () => { audio.init(); audio.setMuted(!audio.muted); syncSound(); });

  startBtn.addEventListener('click', async () => {
    // Pan hits the flame: sizzle and one big toss, then the gate fades.
    audio.init();
    audio.sizzle();
    $('#gate').classList.add('go');
    await Promise.all([warmedUp, new Promise((r) => setTimeout(r, reducedMotion ? 0 : 650))]);
    $('#gate').classList.add('gone');
    body.classList.add('ready');
    state = 'intro';
    flyTo(homePose(), 3.4, () => {
      state = 'home';
      controls.enabled = true;
      idleSince = clock.elapsedTime;
      if (pending) { const id = pending; pending = null; open(id, { push: false }); }
    });
  }, { once: true });

  if (location.search.includes('debug')) {
    window.__app = { scene, camera, controls, world, renderer, open, close, get state() { return state; } };
  }
}
