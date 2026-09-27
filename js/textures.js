// Every texture in the scene is drawn here at runtime on a <canvas>.
// No image files, no third-party textures.
import * as THREE from 'three';

export const FONT_SANS = '"Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const FONT_MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "DejaVu Sans Mono", monospace';

function mix(a, b, t) {
  return '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(c, { srgb = true, repeat } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
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

/** Glowing text on transparent background. Used additively on dark boards. */
export function neonText(text, color, { w = 1024, h = 256, size = 150, font = FONT_SANS, weight = 900, outline = null } = {}) {
  const [c, ctx] = canvas(w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${weight} ${size}px ${font}`;
  // Shrink to fit.
  const maxW = w * (outline ? .74 : .9);
  const measured = ctx.measureText(text).width;
  if (measured > maxW) ctx.font = `${weight} ${Math.floor(size * maxW / measured)}px ${font}`;

  const cx = outline === 'arrow-left' ? w * .54 : outline === 'arrow-right' ? w * .46 : w / 2;
  const draw = (fn) => {
    // Wide soft glow, tighter glow, then a near-white core, like a real tube.
    const core = mix(color, '#ffffff', .55);
    for (const [blur, col, lw] of [[44, color, 9], [16, color, 6], [3, core, 2.5]]) {
      ctx.shadowColor = color; ctx.shadowBlur = blur;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
      fn(col === core);
    }
  };
  draw((core) => {
    ctx.globalAlpha = core ? .75 : 1;
    ctx.fillText(text, cx, h / 2 + size * .04);
  });
  if (outline) {
    ctx.lineJoin = 'round';
    const p = 22, tip = h * .42;
    draw((core) => {
      ctx.globalAlpha = core ? .75 : 1;
      ctx.beginPath();
      if (outline === 'arrow-right') {
        ctx.moveTo(p, p); ctx.lineTo(w - tip, p); ctx.lineTo(w - p, h / 2); ctx.lineTo(w - tip, h - p); ctx.lineTo(p, h - p);
      } else {
        ctx.moveTo(w - p, p); ctx.lineTo(tip, p); ctx.lineTo(p, h / 2); ctx.lineTo(tip, h - p); ctx.lineTo(w - p, h - p);
      }
      ctx.closePath(); ctx.stroke();
    });
  }
  ctx.globalAlpha = 1;
  return toTexture(c);
}

/** Striped awning fabric with a scalloped hem (alpha). */
export function awning() {
  const [c, ctx] = canvas(1024, 256);
  const stripes = 12, sw = c.width / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 ? '#1a0f2b' : '#7a1460';
    ctx.fillRect(i * sw, 0, sw, c.height);
  }
  // Fabric grime.
  const r = rng(7);
  for (let i = 0; i < 2500; i++) {
    ctx.fillStyle = `rgba(0,0,0,${r() * .12})`;
    ctx.fillRect(r() * c.width, r() * c.height, 2 + r() * 6, 1 + r() * 3);
  }
  const map = toTexture(c);
  // Scalloped hem as an alpha map.
  const [a, actx] = canvas(1024, 256);
  actx.fillStyle = '#fff';
  actx.fillRect(0, 0, a.width, a.height - 40);
  for (let i = 0; i < stripes; i++) {
    actx.beginPath();
    actx.arc(i * sw + sw / 2, a.height - 40, sw / 2, 0, Math.PI);
    actx.fill();
  }
  return { map, alphaMap: toTexture(a, { srgb: false }) };
}

/** Painted sheet metal with rivets, stickers and wear. */
export function panel(base = '#1b1e29', seed = 3, { stickers = true } = {}) {
  const [c, ctx] = canvas(1024, 512);
  ctx.fillStyle = base; ctx.fillRect(0, 0, c.width, c.height);
  const r = rng(seed);
  // Vertical seams
  for (let x = 0; x < c.width; x += 128) {
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, 0, 3, c.height);
    ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x + 3, 0, 2, c.height);
    for (let y = 20; y < c.height; y += 60) {
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(x + 12, y, 3, 0, 7); ctx.fill();
    }
  }
  // Scratches and grime
  for (let i = 0; i < 900; i++) {
    ctx.strokeStyle = `rgba(${r() > .5 ? '255,255,255' : '0,0,0'},${r() * .08})`;
    ctx.lineWidth = r() * 2;
    const x = r() * c.width, y = r() * c.height;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - .5) * 40, y + (r() - .5) * 8); ctx.stroke();
  }
  const g = ctx.createLinearGradient(0, c.height * .6, 0, c.height);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);

  if (stickers) {
    const labels = ['0xDEADBEEF', 'rm -rf /fear', 'NO PWN NO FUN', '</>', 'sudo make me a sandwich', '127.0.0.1', 'CTF', '#!'];
    const colors = ['#2af3ff', '#ff2bd6', '#b6ff3b', '#ffb020', '#e9ecf5'];
    for (let i = 0; i < 7; i++) {
      const text = labels[i];
      ctx.save();
      ctx.translate(80 + r() * (c.width - 200), 60 + r() * (c.height - 160));
      ctx.rotate((r() - .5) * .4);
      ctx.font = `bold ${22 + r() * 10 | 0}px ${FONT_MONO}`;
      const tw = ctx.measureText(text).width + 24;
      const col = colors[i % colors.length];
      ctx.fillStyle = col; ctx.globalAlpha = .85;
      ctx.fillRect(-tw / 2, -20, tw, 40);
      ctx.globalAlpha = 1; ctx.fillStyle = '#0b0c12'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 1);
      ctx.restore();
    }
  }
  return toTexture(c);
}

/** Menu board: chalk-ish list of "dishes". */
export function menuBoard() {
  const [c, ctx] = canvas(512, 768);
  ctx.fillStyle = '#0c0f10'; ctx.fillRect(0, 0, c.width, c.height);
  const r = rng(11);
  for (let i = 0; i < 4000; i++) { ctx.fillStyle = `rgba(255,255,255,${r() * .03})`; ctx.fillRect(r() * 512, r() * 768, 2, 2); }
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 4; ctx.strokeRect(16, 16, 480, 736);
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffb020';
  ctx.font = `900 64px ${FONT_SANS}`; ctx.fillText('MENU', 256, 100);
  ctx.textAlign = 'left'; ctx.font = `bold 30px ${FONT_MONO}`;
  const items = [['xss soup', '0.00'], ['sqli noodles', "' OR 1"], ['rce ramen', 'root'], ['idor bowl', '#1337'], ['ssrf tea', '169.254'], ['uart buns', '115200']];
  items.forEach(([name, price], i) => {
    const y = 190 + i * 88;
    ctx.fillStyle = '#e9ecf5'; ctx.fillText(name, 44, y);
    ctx.fillStyle = '#2af3ff'; ctx.textAlign = 'right'; ctx.fillText(price, 468, y + 34); ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; ctx.setLineDash([4, 8]);
    ctx.beginPath(); ctx.moveTo(44, y + 50); ctx.lineTo(468, y + 50); ctx.stroke(); ctx.setLineDash([]);
  });
  return toTexture(c);
}

/** Vending machine front: rows of glowing cans. */
export function vending() {
  const [c, ctx] = canvas(512, 1024);
  ctx.fillStyle = '#060810'; ctx.fillRect(0, 0, 512, 1024);
  const cols = ['#ff2bd6', '#2af3ff', '#b6ff3b', '#ffb020', '#ff4b4b', '#8a7bff'];
  const r = rng(5);
  for (let row = 0; row < 6; row++) {
    const y = 60 + row * 130;
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(30, y + 96, 452, 6);
    for (let i = 0; i < 5; i++) {
      const col = cols[(row * 2 + i + (r() * 2 | 0)) % cols.length];
      const x = 50 + i * 88;
      ctx.shadowColor = col; ctx.shadowBlur = 20;
      ctx.fillStyle = col; ctx.fillRect(x, y + 14, 56, 82);
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x + 8, y + 20, 8, 70);
    }
  }
  ctx.fillStyle = '#0d1018'; ctx.fillRect(0, 850, 512, 174);
  ctx.fillStyle = '#000'; ctx.fillRect(60, 900, 392, 80);
  ctx.font = `bold 40px ${FONT_MONO}`; ctx.fillStyle = '#2af3ff'; ctx.textAlign = 'center';
  ctx.shadowColor = '#2af3ff'; ctx.shadowBlur = 16;
  ctx.fillText('C0FFEE', 256, 818);
  return toTexture(c);
}

/** Wet asphalt: rough where dry, transparent where puddles (so the reflector shows through). */
export function wetGround() {
  const size = 1024;
  const [c, ctx] = canvas(size, size);
  const [a, actx] = canvas(size, size);
  ctx.fillStyle = '#0d0f14'; ctx.fillRect(0, 0, size, size);
  const r = rng(21);
  for (let i = 0; i < 60000; i++) {
    const v = 8 + r() * 30 | 0;
    ctx.fillStyle = `rgb(${v},${v},${v + 4})`;
    ctx.fillRect(r() * size, r() * size, 1 + r() * 2, 1 + r() * 2);
  }
  // Alpha: mostly semi-opaque asphalt with blotchy puddles.
  actx.fillStyle = 'rgb(200,200,200)'; actx.fillRect(0, 0, size, size);
  for (let i = 0; i < 70; i++) {
    const x = r() * size, y = r() * size, rad = 30 + r() * 160;
    const g = actx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(40,40,40,.9)'); g.addColorStop(1, 'rgba(40,40,40,0)');
    actx.fillStyle = g;
    actx.beginPath(); actx.ellipse(x, y, rad, rad * (.5 + r() * .5), r() * 3, 0, 7); actx.fill();
  }
  return { map: toTexture(c, { repeat: [6, 6] }), alphaMap: toTexture(a, { srgb: false, repeat: [3, 3] }) };
}

/** Distant building facade with random lit windows. */
export function facade(seed) {
  const [c, ctx] = canvas(256, 512);
  ctx.fillStyle = '#07080d'; ctx.fillRect(0, 0, 256, 512);
  const r = rng(seed);
  const warm = ['#ffcf7a', '#ffe2b0', '#9fd8ff', '#ff9fe6'];
  for (let y = 12; y < 512; y += 22) {
    for (let x = 10; x < 250; x += 20) {
      if (r() < .09) {
        ctx.fillStyle = warm[r() * warm.length | 0];
        ctx.globalAlpha = .25 + r() * .5;
        ctx.fillRect(x, y, 12, 14);
      }
    }
  }
  ctx.globalAlpha = 1;
  return toTexture(c);
}

/**
 * The stall's monitor: a little terminal that types a boot script,
 * then idles with a blinking cursor. Returns { texture, update(t), setLine(text) }.
 */
export function terminal(lines) {
  const W = 768, H = 560;
  const [c, ctx] = canvas(W, H);
  const texture = toTexture(c);
  let script = lines;
  let start = 0;
  let lastDrawn = '';

  function draw(t) {
    const elapsed = (t - start) * 38; // characters per second
    let budget = Math.floor(elapsed);
    const shown = [];
    for (const line of script) {
      if (budget <= 0) break;
      shown.push(line.slice(0, budget));
      budget -= line.length + 6; // brief pause at end of each line
    }
    const cursorOn = Math.floor(t * 2) % 2 === 0;
    const key = shown.join('\n') + cursorOn;
    if (key === lastDrawn) return;
    lastDrawn = key;

    ctx.fillStyle = '#021013'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * .7);
    g.addColorStop(0, 'rgba(42,243,255,.10)'); g.addColorStop(1, 'rgba(0,0,0,.6)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    ctx.font = `bold 34px ${FONT_MONO}`;
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#2af3ff'; ctx.shadowBlur = 10;
    let y = 40;
    shown.forEach((line, i) => {
      ctx.fillStyle = line.startsWith('$') ? '#b6ff3b' : '#bdf8ff';
      ctx.fillText(line, 40, y);
      if (i === shown.length - 1 && cursorOn) {
        ctx.fillRect(40 + ctx.measureText(line).width + 6, y + 2, 18, 34);
      }
      y += 50;
    });
    if (!shown.length && cursorOn) { ctx.fillStyle = '#bdf8ff'; ctx.fillRect(40, 42, 18, 34); }
    ctx.shadowBlur = 0;
    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    for (let sy = 0; sy < H; sy += 4) ctx.fillRect(0, sy, W, 2);
    texture.needsUpdate = true;
  }

  return {
    texture,
    update: draw,
    run(newLines, t) { script = newLines; start = t; lastDrawn = ''; },
  };
}
