// Every texture in the scene is drawn here at runtime on a <canvas>.
// No image files, no third-party textures.
import * as THREE from 'three';

export const FONT_UI = '"Quicksand", system-ui, sans-serif';
export const FONT_PIXEL = '"Press Start 2P", ui-monospace, monospace';
export const FONT_MONO = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

export function toTexture(c, { srgb = true, repeat } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16; // clamped to the GPU's max; keeps angled signs crisp
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

// Deterministic PRNG so the scene looks the same on every visit.
export function rng(seed = 1) {
  return () => { // mulberry32
    seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function fitFont(ctx, text, weight, size, family, maxW) {
  ctx.font = `${weight} ${size}px ${family}`;
  const m = ctx.measureText(text).width;
  if (m > maxW) ctx.font = `${weight} ${Math.floor(size * maxW / m)}px ${family}`;
}

/** Solid colored arrow sign for the signpost. */
export function arrowSign(text, color, dir) {
  const W = 1024, H = 256;
  const [c, ctx] = canvas(W, H);
  const tip = 96, pad = 10;
  ctx.beginPath();
  if (dir === 'right') {
    ctx.moveTo(pad + 24, pad); ctx.lineTo(W - tip, pad); ctx.lineTo(W - pad, H / 2); ctx.lineTo(W - tip, H - pad); ctx.lineTo(pad + 24, H - pad);
    ctx.quadraticCurveTo(pad, H - pad, pad, H - pad - 24); ctx.lineTo(pad, pad + 24); ctx.quadraticCurveTo(pad, pad, pad + 24, pad);
  } else {
    ctx.moveTo(W - pad - 24, pad); ctx.lineTo(tip, pad); ctx.lineTo(pad, H / 2); ctx.lineTo(tip, H - pad); ctx.lineTo(W - pad - 24, H - pad);
    ctx.quadraticCurveTo(W - pad, H - pad, W - pad, H - pad - 24); ctx.lineTo(W - pad, pad + 24); ctx.quadraticCurveTo(W - pad, pad, W - pad - 24, pad);
  }
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = 18; ctx.strokeStyle = '#16122b'; ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(0, 0, W, H * .42);
  ctx.restore();
  ctx.fillStyle = '#16122b';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  fitFont(ctx, text, 400, 76, FONT_PIXEL, W - tip - 150);
  ctx.fillText(text, dir === 'right' ? (W - tip) / 2 + 20 : (W + tip) / 2 - 20, H / 2 + 6);
  return toTexture(c);
}

/** The shop's name billboard: cyan tube lines behind bold pink pixel lettering. */
export function shopSign(top, main) {
  const W = 2048, H = 512;
  const [c, ctx] = canvas(W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1a1030'); g.addColorStop(1, '#0c0818');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // horizontal neon tubes running behind the text
  for (let i = 0; i < 6; i++) {
    const y = 70 + i * 74;
    ctx.shadowColor = '#2af3ff'; ctx.shadowBlur = 18; ctx.strokeStyle = 'rgba(42,243,255,.55)'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(220,255,255,.45)'; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  // small top line
  ctx.font = `700 78px ${FONT_UI}`;
  ctx.lineWidth = 14; ctx.strokeStyle = '#0c0818'; ctx.strokeText(top, W / 2, 110);
  ctx.fillStyle = '#e9fdff'; ctx.shadowColor = '#2af3ff'; ctx.shadowBlur = 16; ctx.fillText(top, W / 2, 110);
  // main lettering: dark keyline, white outline, pink fill, soft pink glow
  fitFont(ctx, main, 400, 170, FONT_PIXEL, W - 260);
  const y = 318;
  ctx.shadowBlur = 0; ctx.lineWidth = 34; ctx.strokeStyle = '#0c0818'; ctx.strokeText(main, W / 2, y);
  ctx.lineWidth = 14; ctx.strokeStyle = '#fff4fb'; ctx.strokeText(main, W / 2, y);
  const grad = ctx.createLinearGradient(0, y - 80, 0, y + 80);
  grad.addColorStop(0, '#ff9ae0'); grad.addColorStop(1, '#e0268f');
  ctx.shadowColor = '#ff4fcf'; ctx.shadowBlur = 36; ctx.fillStyle = grad; ctx.fillText(main, W / 2, y);
  return toTexture(c);
}

/** A plain label (vending machine header, arcade marquee...). */
export function label(text, { w = 1024, h = 256, bg = '#111', fg = '#fff', glow = null, font = FONT_PIXEL, size = 90, weight = 400 } = {}) {
  const [c, ctx] = canvas(w, h);
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 28; }
  ctx.fillStyle = fg;
  fitFont(ctx, text, weight, size, font, w * .88);
  ctx.fillText(text, w / 2, h / 2 + 4);
  return toTexture(c);
}

/** Striped awning fabric with a scalloped hem (alpha). */
export function awning(a = '#19b3ad', b = '#e9fbff') {
  const [c, ctx] = canvas(1024, 256);
  const stripes = 10, sw = c.width / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 ? b : a;
    ctx.fillRect(i * sw, 0, sw, c.height);
  }
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, 'rgba(0,0,0,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 256);
  const map = toTexture(c);
  const [al, actx] = canvas(1024, 256);
  actx.fillStyle = '#fff';
  actx.fillRect(0, 0, al.width, al.height - 50);
  for (let i = 0; i < stripes; i++) {
    actx.beginPath(); actx.arc(i * sw + sw / 2, al.height - 50, sw / 2, 0, Math.PI); actx.fill();
  }
  return { map, alphaMap: toTexture(al, { srgb: false }) };
}

/** Wooden planks. */
export function planks(base = '#b86a3c', seed = 2) {
  const [c, ctx] = canvas(512, 512);
  const r = rng(seed);
  const n = 8, h = 512 / n;
  for (let i = 0; i < n; i++) {
    const col = new THREE.Color(base).offsetHSL(0, 0, (r() - .5) * .06);
    ctx.fillStyle = '#' + col.getHexString();
    ctx.fillRect(0, i * h, 512, h);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, i * h, 512, 3);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, i * h + 3, 512, 2);
    for (let k = 0; k < 14; k++) {
      ctx.strokeStyle = `rgba(60,25,10,${r() * .15})`; ctx.lineWidth = 1 + r() * 2;
      const y = i * h + 6 + r() * (h - 12);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(170, y + (r() - .5) * 8, 340, y + (r() - .5) * 8, 512, y); ctx.stroke();
    }
  }
  return toTexture(c);
}

/** Painted wall with panel seams and a few stickers. */
export function wall(base = '#3a2f6e', seed = 3, stickers = true) {
  const [c, ctx] = canvas(1024, 1024);
  ctx.fillStyle = base; ctx.fillRect(0, 0, 1024, 1024);
  const r = rng(seed);
  for (let x = 0; x < 1024; x += 256) {
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x, 0, 4, 1024);
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(x + 4, 0, 3, 1024);
  }
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(0,0,0,${r() * .06})`;
    ctx.fillRect(r() * 1024, r() * 1024, 4 + r() * 30, 2 + r() * 10);
  }
  const g = ctx.createLinearGradient(0, 700, 0, 1024);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.3)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 1024);
  if (stickers) {
    const labels = ['0xDEADBEEF', 'NO PWN NO FUN', '</>', '127.0.0.1', 'CTF', 'sudo !!', 'rm -rf /fear'];
    const colors = ['#2af3ff', '#ff4fa3', '#b6ff3b', '#ffb020', '#ffffff'];
    labels.forEach((text, i) => {
      ctx.save();
      ctx.translate(90 + r() * 840, 120 + r() * 780);
      ctx.rotate((r() - .5) * .5);
      ctx.font = `700 ${30 + r() * 12 | 0}px ${FONT_MONO}`;
      const tw = ctx.measureText(text).width + 30;
      ctx.fillStyle = colors[i % colors.length];
      roundRect(ctx, -tw / 2, -26, tw, 52, 10); ctx.fill();
      ctx.fillStyle = '#15112a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 2);
      ctx.restore();
    });
  }
  return toTexture(c);
}

/** Graffiti mural for the back wall: circuit traces and a big tag. */
export function mural(tag) {
  const [c, ctx] = canvas(1024, 1024);
  const g = ctx.createLinearGradient(0, 0, 1024, 1024);
  g.addColorStop(0, '#5a2233'); g.addColorStop(1, '#2a1740');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 1024);
  const r = rng(31);
  ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    ctx.strokeStyle = ['#2af3ff', '#b6ff3b', '#ff4fa3'][i % 3];
    ctx.globalAlpha = .35;
    let x = r() * 1024, y = r() * 1024;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      if (k % 2) y += (r() - .5) * 400; else x += (r() - .5) * 400;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = .7; ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(460, 360); ctx.rotate(-.12);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 150px ${FONT_UI}`;
  const t2 = tag.replace('_', ' ');
  ctx.lineJoin = 'round';
  ctx.lineWidth = 34; ctx.strokeStyle = '#16122b'; ctx.strokeText(t2, 0, 0);
  ctx.lineWidth = 16; ctx.strokeStyle = '#ffffff'; ctx.strokeText(t2, 0, 0);
  const tg = ctx.createLinearGradient(0, -80, 0, 80);
  tg.addColorStop(0, '#ffe066'); tg.addColorStop(.5, '#ff4fa3'); tg.addColorStop(1, '#8a7bff');
  ctx.fillStyle = tg; ctx.fillText(t2, 0, 0);
  ctx.restore();
  // drips
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = ['#ff4fa3', '#ffe066', '#8a7bff'][i % 3];
    const x = 160 + r() * 620, y = 420 + r() * 40, h = 40 + r() * 140;
    ctx.fillRect(x, y, 8, h); ctx.beginPath(); ctx.arc(x + 4, y + h, 7, 0, 7); ctx.fill();
  }
  return toTexture(c);
}

/** Back panel for machines: vent slots and a service sticker. */
export function backPanel(base = '#123c3c', seed = 4) {
  const [c, ctx] = canvas(256, 640);
  ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 640);
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  for (let y = 60; y < 300; y += 26) { roundRect(ctx, 40, y, 176, 10, 5); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(16, 16, 224, 2); ctx.fillRect(16, 622, 224, 2);
  const r = rng(seed);
  ctx.save(); ctx.translate(128, 420); ctx.rotate((r() - .5) * .3);
  ctx.fillStyle = '#ffd35a'; roundRect(ctx, -80, -40, 160, 80, 8); ctx.fill();
  ctx.fillStyle = '#16122b'; ctx.textAlign = 'center'; ctx.font = `700 22px ${FONT_MONO}`;
  ctx.fillText('DO NOT', 0, -6); ctx.fillText('JAILBREAK', 0, 22);
  ctx.restore();
  return toTexture(c);
}

/** Chalkboard menu. */
export function menuBoard() {
  const [c, ctx] = canvas(512, 768);
  ctx.fillStyle = '#1c2422'; ctx.fillRect(0, 0, c.width, c.height);
  const r = rng(11);
  for (let i = 0; i < 4000; i++) { ctx.fillStyle = `rgba(255,255,255,${r() * .04})`; ctx.fillRect(r() * 512, r() * 768, 2, 2); }
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffd35a';
  ctx.font = `700 70px ${FONT_UI}`; ctx.fillText('MENU', 256, 100);
  ctx.textAlign = 'left'; ctx.font = `600 32px ${FONT_UI}`;
  const items = [['cutting chai', '₹10'], ['xss samosa', '₹15'], ['sqli vada pav', "' OR 1"], ['rce pakora', 'root'], ['idor lassi', '#1337'], ['uart bun maska', '115200']];
  items.forEach(([name, price], i) => {
    const y = 190 + i * 88;
    ctx.fillStyle = '#f2f2f2'; ctx.fillText(name, 44, y);
    ctx.fillStyle = '#7ff8ff'; ctx.textAlign = 'right'; ctx.fillText(price, 468, y + 36); ctx.textAlign = 'left';
  });
  return toTexture(c);
}

/**
 * The floor, "baked": coloured light pools under the lamps and machines plus
 * soft contact shadows, painted once. `size` is the floor's width in metres.
 */
export function bakedFloor(size) {
  const N = 1024, k = N / size;
  const [c, ctx] = canvas(N, N);
  const X = (x) => (x + size / 2) * k, Z = (z) => (z + size / 2) * k;
  ctx.fillStyle = '#050407'; ctx.fillRect(0, 0, N, N);

  // Light pools, added on top of each other like real light.
  ctx.globalCompositeOperation = 'lighter';
  const pool = (x, z, r, rgb, a) => {
    const g = ctx.createRadialGradient(X(x), Z(z), 0, X(x), Z(z), r * k);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(.45, `rgba(${rgb},${a * .45})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, N, N);
  };
  pool(0, 1.2, 10, '88,46,138', .7);      // broad violet wash
  pool(-3.3, 1.6, 6, '185,50,145', .55);  // pink lamps
  pool(-3.3, 1.8, 1.8, '255,190,235', .35);
  pool(3.4, .6, 5.5, '28,150,165', .7);    // teal machines
  pool(0, 1.6, 2.6, '255,150,70', .35);    // warm spill from the counter
  pool(1, -2.6, 2.6, '255,190,120', .2);   // back door lamp

  // Contact shadows: draw each shape far off-canvas and keep only its blurred shadow.
  ctx.globalCompositeOperation = 'source-over';
  const off = N * 2;
  const shadow = (blur, alpha, draw) => {
    ctx.save();
    ctx.shadowColor = `rgba(3,0,6,${alpha})`; ctx.shadowBlur = blur; ctx.shadowOffsetX = off;
    ctx.translate(-off, 0); ctx.fillStyle = '#000'; ctx.beginPath(); draw(); ctx.fill();
    ctx.restore();
  };
  const rect = (x, z, w, d, rot = 0) => () => {
    ctx.translate(X(x) , Z(z)); ctx.rotate(rot); ctx.rect(-w * k / 2, -d * k / 2, w * k, d * k);
  };
  const disc = (x, z, r) => () => ctx.arc(X(x), Z(z), r * k, 0, Math.PI * 2);
  shadow(40, .85, rect(0, -.2, 3.9, 2.9));          // stall
  shadow(18, .7, rect(2.5, -.25, 1.1, .9, .18));    // vending machine
  shadow(18, .7, rect(3.7, .75, .95, .8, .6));      // arcade
  shadow(14, .7, disc(-3.3, 1.55, .35));            // signpost base
  shadow(14, .6, rect(-2.3, -.9, .7, 1.4));         // crates
  for (const x of [-1.1, 0, 1.1]) shadow(10, .55, disc(x, 1.38, .22)); // stools
  shadow(10, .5, rect(-2.2, .55, .7, .45, -.95));   // menu board
  shadow(10, .5, disc(1.95, 1.6, .22));             // plant
  shadow(14, .6, rect(2.3, -1.2, .9, .6));          // bin bags

  // Fade the edges into the void.
  const fade = ctx.createRadialGradient(N / 2, N / 2 + 1.2 * k, 5 * k, N / 2, N / 2 + 1.2 * k, 14 * k);
  fade.addColorStop(0, 'rgba(5,4,7,0)'); fade.addColorStop(1, 'rgba(5,4,7,1)');
  ctx.fillStyle = fade; ctx.fillRect(0, 0, N, N);
  return toTexture(c);
}

// ---------------------------------------------------------------------------
// Screens in "attract mode": what each screen shows before you fly into it.
// Each returns { texture, update(t) }; update redraws only when the frame changes.

function animated(w, h, draw, fps = 8) {
  const [c, ctx] = canvas(w, h);
  const texture = toTexture(c);
  let last = -1;
  const update = (t) => {
    const frame = Math.floor(t * fps);
    if (frame === last) return;
    last = frame;
    ctx.save(); draw(ctx, t, frame); ctx.restore();
    texture.needsUpdate = true;
  };
  update(0);
  return { texture, update };
}

function codeBars(ctx, x, y, s, seed) {
  const r = rng(seed);
  const cols = ['#ff4fa3', '#2af3ff', '#b6ff3b', '#ffb020', '#8a7bff', '#8b91a6'];
  for (let row = 0; row < 2; row++) {
    let cx = x + (row ? 18 * s : 0);
    for (let k = 0; k < 3; k++) {
      const w = (30 + r() * 110) * s;
      ctx.fillStyle = cols[(r() * cols.length) | 0];
      roundRect(ctx, cx, y + row * 16 * s, w, 8 * s, 4 * s); ctx.fill();
      cx += w + 10 * s;
    }
  }
}

export function monitorScreen(name) {
  return animated(1280, 800, (ctx, t, f) => {
    ctx.fillStyle = '#0f1017'; ctx.fillRect(0, 0, 1280, 800);
    codeBars(ctx, 170, 200, 1.6, 4);
    ctx.fillStyle = '#ffffff'; ctx.font = `700 100px ${FONT_UI}`; ctx.textBaseline = 'alphabetic';
    ctx.fillText(`Hi, I'm ${name.split(' ')[0]}.`, 170, 370);
    codeBars(ctx, 170, 410, 1.6, 9);
    ctx.fillStyle = '#8b91a6'; ctx.font = `600 36px ${FONT_UI}`;
    ctx.fillText('security researcher  ·  cyb3r_n3rd', 170, 520);
    ctx.fillStyle = f % 2 ? '#2af3ff' : '#1d6f78';
    ctx.font = `600 30px ${FONT_MONO}`;
    ctx.fillText('> click to open about_me', 170, 620);
    ctx.translate(1190, 160); ctx.rotate(Math.PI / 2);
    ctx.font = `600 36px ${FONT_UI}`;
    ['About', 'Skills', 'Experience'].forEach((s, i) => { ctx.fillStyle = i ? '#cfd3e0' : '#2af3ff'; ctx.fillText(s, i * 190, 0); });
  }, 2);
}

export function vendingScreen(projects) {
  return animated(640, 860, (ctx, t, f) => {
    const g = ctx.createLinearGradient(0, 0, 0, 860);
    g.addColorStop(0, '#5cf0bf'); g.addColorStop(1, '#22b6a0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 640, 860);
    projects.slice(0, 8).forEach((p, i) => {
      const x = 28 + (i % 4) * 148, y = 36 + Math.floor(i / 4) * 290;
      ctx.fillStyle = 'rgba(255,255,255,.3)'; roundRect(ctx, x, y, 136, 270, 16); ctx.fill();
      drawItem(ctx, p, x + 68, y + 130, 1);
      ctx.fillStyle = '#0f3b36'; ctx.font = `700 24px ${FONT_UI}`; ctx.textAlign = 'center';
      ctx.fillText(p.code, x + 68, y + 248); ctx.textAlign = 'left';
    });
    ctx.fillStyle = '#26257a'; roundRect(ctx, 28, 640, 584, 180, 20); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `700 42px ${FONT_UI}`; ctx.fillText('Pick a project', 60, 718);
    ctx.font = `600 28px ${FONT_UI}`; ctx.fillStyle = f % 2 ? '#b6ff3b' : '#9feedd'; ctx.fillText('tap to browse  →', 60, 775);
  }, 2);
}

/** Can / bottle / carton, drawn on the vending screen canvas. */
export function drawItem(ctx, p, cx, cy, s = 1) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  const shade = (a) => '#' + new THREE.Color(p.color).offsetHSL(0, 0, a).getHexString();
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, 80, 44, 10, 0, 0, 7); ctx.fill();
  if (p.kind === 'bottle') {
    ctx.fillStyle = shade(-.1);
    roundRect(ctx, -30, -40, 60, 116, 18); ctx.fill();
    roundRect(ctx, -12, -84, 24, 50, 6); ctx.fill();
    ctx.fillStyle = '#222'; roundRect(ctx, -14, -96, 28, 16, 4); ctx.fill();
    ctx.fillStyle = '#fff'; roundRect(ctx, -30, -4, 60, 40, 4); ctx.fill();
  } else if (p.kind === 'carton') {
    ctx.fillStyle = shade(0);
    ctx.fillRect(-34, -40, 68, 116);
    ctx.beginPath(); ctx.moveTo(-34, -40); ctx.lineTo(0, -80); ctx.lineTo(34, -40); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-34, -2, 68, 36);
  } else {
    ctx.fillStyle = shade(0);
    roundRect(ctx, -32, -60, 64, 136, 10); ctx.fill();
    ctx.fillStyle = '#d7dbe4'; roundRect(ctx, -30, -66, 60, 12, 5); ctx.fill();
    ctx.fillStyle = '#fff'; roundRect(ctx, -32, -6, 64, 36, 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-22, -30, 8, 90);
  ctx.fillStyle = '#15112a'; ctx.font = `700 13px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(p.name.toUpperCase().slice(0, 9), 0, 14);
  ctx.restore();
}

export function arcadeScreen() {
  return animated(640, 500, (ctx, t, f) => {
    ctx.fillStyle = '#0b0620'; ctx.fillRect(0, 0, 640, 500);
    ctx.strokeStyle = 'rgba(255,79,163,.5)'; ctx.lineWidth = 2;
    const scroll = (t * .6) % 1;
    for (let i = 0; i < 12; i++) { const k = (i + scroll) / 12; const y = 300 + k * k * 200; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke(); }
    for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(320 + i * 20, 300); ctx.lineTo(320 + i * 90, 500); ctx.stroke(); }
    ctx.fillStyle = '#ffb020'; ctx.beginPath(); ctx.arc(320, 300, 70, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#0b0620'; for (let k = 0; k < 5; k++) ctx.fillRect(250, 250 + k * 11, 140, 3 + k);
    ctx.textAlign = 'center';
    ctx.font = `14px ${FONT_PIXEL}`; ctx.fillStyle = '#ff4b4b';
    ctx.fillText('SCORE', 100, 44); ctx.fillText('HI-SCORE', 320, 44); ctx.fillText('LEVEL', 540, 44);
    ctx.fillStyle = '#fff'; ctx.fillText('0000', 100, 70); ctx.fillText('1337', 320, 70); ctx.fillText('01', 540, 70);
    const g = ctx.createLinearGradient(0, 140, 0, 200);
    g.addColorStop(0, '#fff6a8'); g.addColorStop(.5, '#ffb020'); g.addColorStop(1, '#ff4fa3');
    ctx.fillStyle = g; ctx.shadowColor = '#ff4fa3'; ctx.shadowBlur = 18;
    ctx.font = `50px ${FONT_PIXEL}`; ctx.fillText('CONTACT', 320, 190);
    ctx.shadowBlur = 0;
    if (f % 2) { ctx.fillStyle = '#fff'; ctx.font = `16px ${FONT_PIXEL}`; ctx.fillText('INSERT COIN', 320, 232); }
  }, 2);
}

export function tvScreen() {
  const r = rng(77);
  return animated(800, 600, (ctx, t, f) => {
    ctx.fillStyle = '#081a14'; ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#b6ff3b'; ctx.shadowColor = '#b6ff3b'; ctx.shadowBlur = 14;
    ctx.font = `700 70px ${FONT_MONO}`; ctx.fillText('RESEARCH', 60, 140);
    ctx.shadowBlur = 0;
    ctx.font = `500 30px ${FONT_MONO}`;
    const lines = ['$ ls ~/writeups', 'finding_01.md', 'finding_02.md', 'teardown_03.md', 'ctf_04.md'];
    lines.forEach((l, i) => { ctx.fillStyle = i ? '#9dffcf' : '#b6ff3b'; ctx.fillText(l, 60, 230 + i * 56); });
    if ((f >> 2) % 2) ctx.fillRect(60, 230 + lines.length * 56 - 26, 18, 32);
    const y = (t * 120) % 640 - 40;
    ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(0, y, 800, 40);
    for (let i = 0; i < 300; i++) { ctx.fillStyle = `rgba(255,255,255,${r() * .08})`; ctx.fillRect(r() * 800, r() * 600, 2, 2); }
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    for (let sy = 0; sy < 600; sy += 4) ctx.fillRect(0, sy, 800, 2);
  }, 4);
}

// ---------------------------------------------------------------------------
// v3: the Indian chai stall

export const FONT_HINDI = '"Baloo 2", "Noto Sans Devanagari", system-ui, sans-serif';

/** Glowing green menu panel with a Hindi dish name and its English below. */
export function hindiPanel(hindi, english) {
  const [c, ctx] = canvas(256, 320);
  const g = ctx.createRadialGradient(128, 150, 20, 128, 160, 200);
  g.addColorStop(0, '#c8ffd6'); g.addColorStop(1, '#5fe39a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 320);
  ctx.strokeStyle = 'rgba(8,60,30,.5)'; ctx.lineWidth = 8; ctx.strokeRect(10, 10, 236, 300);
  ctx.fillStyle = '#0b4a26'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  fitFont(ctx, hindi, 800, 118, FONT_HINDI, 210);
  ctx.fillText(hindi, 128, 150);
  ctx.font = `700 30px ${FONT_UI}`; ctx.fillStyle = 'rgba(11,74,38,.8)';
  ctx.fillText(english, 128, 262);
  return toTexture(c);
}

/** Rooftop TV: a looping sunset over the sea with a city skyline. */
export function sunsetTV() {
  const r = rng(51);
  const skyline = [];
  for (let x = 0; x < 640;) { const w = 18 + r() * 40; skyline.push([x, w, 30 + r() * 110]); x += w + 2; }
  return animated(640, 400, (ctx, t) => {
    const sky = ctx.createLinearGradient(0, 0, 0, 260);
    sky.addColorStop(0, '#2b1b5e'); sky.addColorStop(.55, '#ff6f61'); sky.addColorStop(1, '#ffc46b');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 640, 260);
    const sunY = 205 + Math.sin(t * .2) * 6;
    ctx.fillStyle = '#fff1b8'; ctx.shadowColor = '#ffd27a'; ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.arc(420, sunY, 46, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#1d1233';
    for (const [x, w, h] of skyline) ctx.fillRect(x, 260 - h * (x > 300 && x < 520 ? .45 : 1), w, h);
    // a dome and a couple of palms, for the seaside-city feel
    ctx.beginPath(); ctx.arc(120, 170, 26, Math.PI, 0); ctx.fill(); ctx.fillRect(94, 170, 52, 90);
    const sea = ctx.createLinearGradient(0, 260, 0, 400);
    sea.addColorStop(0, '#ff8a5c'); sea.addColorStop(1, '#3a1f5c');
    ctx.fillStyle = sea; ctx.fillRect(0, 260, 640, 140);
    ctx.fillStyle = 'rgba(255,236,180,.8)';
    for (let i = 0; i < 18; i++) {
      const y = 270 + i * 7, w = (60 - i * 2) * (1 + .25 * Math.sin(t * 3 + i));
      ctx.fillRect(420 - w / 2 + Math.sin(t * 2 + i) * 8, y, w, 2);
    }
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    for (let y = 0; y < 400; y += 4) ctx.fillRect(0, y, 640, 1);
  }, 12);
}

/** Name and roles written on the ground, like chalk under a streetlight. */
export function groundText(name, lines, blurred = false) {
  const [c, ctx] = canvas(2048, 1100);
  if (blurred) ctx.filter = 'blur(14px)'; // soft shadow copy (browsers without canvas filters get a crisp one)
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 230px ${FONT_UI}`;
  ctx.fillText(name, 40, 250);
  ctx.font = `600 96px ${FONT_UI}`;
  ctx.fillStyle = 'rgba(255,255,255,.82)';
  lines.forEach((l, i) => ctx.fillText(l, 60, 420 + i * 130));
  return toTexture(c);
}

/** Square sticker with a barcode and the handle. */
export function barcodeSticker(handle) {
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = '#ff7ad1'; ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#fff4fb'; ctx.fillRect(22, 22, 212, 212);
  const r = rng(9);
  ctx.fillStyle = '#16122b';
  for (let x = 50; x < 206;) { const w = 2 + (r() * 7 | 0); ctx.fillRect(x, 50, w, 110); x += w + 2 + (r() * 5 | 0); }
  ctx.font = `700 26px ${FONT_MONO}`; ctx.textAlign = 'center';
  ctx.fillText(handle, 128, 200);
  return toTexture(c);
}

/** Soft round glow for sprites (lamp halos, flames). */
export function glowSprite() {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)');
  g.addColorStop(.6, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return toTexture(c);
}
