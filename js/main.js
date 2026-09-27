import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld, SECTIONS } from './world.js';

const $ = (s) => document.querySelector(s);
const root = document.documentElement;
const body = document.body;
const canvas = $('#scene');
const loader = $('#loader');
const loaderFill = $('#loader-fill');
const loaderText = $('#loader-text');
const screenPath = $('#screen-path');
const closeBtn = $('#screen-close');
const panels = [...document.querySelectorAll('[data-panel]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const IDLE_SCRIPT = [
  '$ whoami',
  'shivam verma // cyb3r_n3rd',
  'security researcher',
  '$ ls ./signs',
  'about  projects  research  contact',
  '$ ',
];

function progress(p, text) {
  loaderFill.style.width = `${p * 100}%`;
  if (text) loaderText.textContent = text;
}

function goFlat(reason) {
  console.warn('3D disabled:', reason);
  root.classList.add('flat');
  loader.classList.add('done');
}

// Renderer -----------------------------------------------------------------------

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  goFlat(e);
}

if (renderer) start();

function start() {
  const isSmall = () => Math.min(innerWidth, innerHeight) < 600;
  renderer.setPixelRatio(Math.min(devicePixelRatio, isSmall() ? 1.5 : 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .05, 120);

  progress(.3, 'building the stall…');
  const world = buildWorld(scene, renderer);
  if (reducedMotion) world.rain.object.visible = false;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .6, .5, .9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Camera rig ---------------------------------------------------------------------

  const home = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  const view = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  const cam = { pos: new THREE.Vector3(), target: new THREE.Vector3() }; // current, before parallax

  function layout() {
    const aspect = innerWidth / innerHeight;
    const portrait = aspect < 1;
    camera.fov = portrait ? 52 : 38;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    // Frame the signpost + stall. On portrait screens, bias toward the signpost.
    home.target.set(portrait ? -.95 : -.1, portrait ? 1.6 : 1.75, .5);
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfW = portrait ? 3.55 : 4.9, halfH = 2.3;
    const dist = Math.max(7.5, halfW / (tanH * aspect), halfH / tanH);
    home.pos.copy(home.target).add(new THREE.Vector3(.09, .24, 1).normalize().multiplyScalar(dist));

    // The close-up: the monitor's screen fills the viewport.
    world.screen.updateWorldMatrix(true, false);
    const center = new THREE.Vector3().setFromMatrixPosition(world.screen.matrixWorld);
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(world.screen.matrixWorld);
    const { width: sw, height: sh } = world.screen.geometry.parameters;
    const d = Math.min((sh / 2) / tanH, (sw / 2) / (tanH * aspect)) * .92;
    view.target.copy(center);
    view.pos.copy(center).addScaledVector(normal, d);
  }
  layout();

  // Intro: start high and far, glide in.
  cam.pos.copy(home.pos).add(new THREE.Vector3(-3, 3.5, 9));
  cam.target.copy(home.target).add(new THREE.Vector3(0, 1.2, 0));
  camera.position.copy(cam.pos);
  camera.lookAt(cam.target);

  // State machine: intro → home ⇄ flying → viewing
  let state = 'intro';
  let current = null; // open section id
  let tween = null;

  const ease = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  function flyTo(dest, duration, done) {
    tween = {
      fromPos: cam.pos.clone(), fromTarget: cam.target.clone(),
      dest, t: 0, duration: reducedMotion ? .01 : duration, done,
    };
  }

  function stepTween(dt) {
    if (!tween) return;
    tween.t = Math.min(1, tween.t + dt / tween.duration);
    const k = ease(tween.t);
    const destPos = tween.dest.pos, destTarget = tween.dest.target;
    cam.pos.lerpVectors(tween.fromPos, destPos, k);
    // A gentle arc so the move reads as travel, not a zoom.
    if (tween.dest === view || tween.dest === home) cam.pos.y += Math.sin(k * Math.PI) * .35;
    cam.target.lerpVectors(tween.fromTarget, destTarget, k);
    if (tween.t >= 1) { const cb = tween.done; tween = null; cb && cb(); }
  }

  function showPanel(id) {
    panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === id));
    screenPath.textContent = `~/${id}`;
    $('#screen-body').scrollTop = 0;
  }

  function open(id, { push = true } = {}) {
    if (!SECTIONS.some((s) => s.id === id)) return;
    if (push && location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    if (state === 'viewing') { current = id; showPanel(id); return; }
    if (state === 'intro') { pendingOpen = id; return; }
    current = id;
    state = 'flying';
    body.classList.add('flying');
    setHover(null);
    world.terminal.run([`$ cd ~/${id}`, `$ cat README`, 'loading…'], clock.elapsedTime);
    flyTo(view, 1.7, () => {
      state = 'viewing';
      body.classList.remove('flying');
      showPanel(current);
      body.classList.add('viewing');
      closeBtn.focus({ preventScroll: true });
    });
  }

  function close({ push = true } = {}) {
    if (state !== 'viewing') return;
    if (push && location.hash) history.pushState(null, '', location.pathname + location.search);
    body.classList.remove('viewing');
    state = 'flying';
    body.classList.add('flying');
    world.terminal.run(IDLE_SCRIPT, clock.elapsedTime + .6);
    setTimeout(() => flyTo(home, 1.4, () => {
      state = 'home';
      body.classList.remove('flying');
      const link = current && document.querySelector(`[data-open="${current}"]`);
      current = null;
      link && link.focus({ preventScroll: true });
    }), reducedMotion ? 0 : 250);
  }

  let pendingOpen = location.hash.slice(1) || null;

  // Input -------------------------------------------------------------------------

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 }; // raw and smoothed, -1..1
  let hovered = null;

  function setHover(obj) {
    if (hovered === obj) return;
    if (hovered) hovered.userData.hover = false;
    hovered = obj;
    if (hovered) hovered.userData.hover = true;
    canvas.classList.toggle('pointing', !!hovered);
  }

  function pick(e) {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(world.clickables, false)[0];
    return hit ? hit.object : null;
  }

  canvas.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
    if (state === 'home' && e.pointerType === 'mouse') setHover(pick(e));
  });
  canvas.addEventListener('pointerleave', () => setHover(null));

  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
    down = null;
    if (state !== 'home') return;
    const obj = pick(e);
    if (obj) open(obj.userData.section);
  });

  document.querySelectorAll('[data-open]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    open(a.dataset.open);
  }));
  $('[data-home]').addEventListener('click', (e) => { e.preventDefault(); close(); });
  closeBtn.addEventListener('click', () => close());
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  addEventListener('popstate', () => {
    const id = location.hash.slice(1);
    if (id) open(id, { push: false }); else close({ push: false });
  });

  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
    bloom.resolution.set(innerWidth / 2, innerHeight / 2);
    world.resize(innerWidth, innerHeight);
    layout();
    if (state === 'home' && !tween) { cam.pos.copy(home.pos); cam.target.copy(home.target); }
    if (state === 'viewing') { cam.pos.copy(view.pos); cam.target.copy(view.target); }
    renderOnce = true;
  });

  // Loop --------------------------------------------------------------------------

  const clock = new THREE.Clock();
  let renderOnce = false;
  world.terminal.run(IDLE_SCRIPT, 1.2);

  function frame() {
    const rawDt = clock.getDelta();
    const dt = Math.min(rawDt, .05);
    const t = clock.elapsedTime;

    stepTween(Math.min(rawDt, .25)); // real time, so moves keep their duration at low fps

    // While the content overlay covers the screen there's nothing to see: idle the GPU.
    if (state === 'viewing' && !renderOnce) return;
    renderOnce = false;

    world.update(t, dt);
    if (!reducedMotion) world.rain.update(dt);

    // Parallax only when standing on the street.
    const k = Math.min(1, dt * 3);
    const amount = state === 'home' ? 1 : 0;
    pointer.sx += (pointer.x * amount - pointer.sx) * k;
    pointer.sy += (pointer.y * amount - pointer.sy) * k;
    camera.position.copy(cam.pos).add(new THREE.Vector3(pointer.sx * .7, -pointer.sy * .35, 0));
    camera.lookAt(cam.target);

    composer.render();
  }

  progress(.7, 'compiling shaders…');
  renderer.compile(scene, camera);
  composer.render();
  progress(1, 'open for business');

  setTimeout(() => {
    loader.classList.add('done');
    renderer.setAnimationLoop(frame);
    flyTo(home, reducedMotion ? .01 : 3.2, () => {
      state = 'home';
      if (pendingOpen) { const id = pendingOpen; pendingOpen = null; open(id, { push: false }); }
    });
  }, 350);

  if (location.search.includes('debug')) window.__app = { scene, camera, renderer, world, get state() { return state; } };

  // Lose the context (e.g. GPU reset)? Fall back to the plain page.
  canvas.addEventListener('webglcontextlost', () => { renderer.setAnimationLoop(null); goFlat('context lost'); });
}
