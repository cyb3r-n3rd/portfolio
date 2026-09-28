// All sounds are synthesized with the Web Audio API: no audio files to download or license.
// Browsers only allow audio after a user gesture, so init() is called from the Start click.

let ctx = null;
let master = null;
let ambient = null;
let muted = false;
try { muted = localStorage.getItem('muted') === '1'; } catch { /* storage blocked */ }

function noiseBuffer(seconds, crackle = 0) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let pop = 0;
  for (let i = 0; i < len; i++) {
    // Hiss, plus random decaying pops: the "oil crackle" of frying.
    if (crackle && Math.random() < crackle) pop = (Math.random() * .9 + .1) * (Math.random() < .5 ? -1 : 1);
    pop *= .985;
    d[i] = (Math.random() * 2 - 1) * .35 + pop;
  }
  return buf;
}

export const audio = {
  get muted() { return muted; },

  init() {
    if (ctx) { ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : .9;
    master.connect(ctx.destination);
    this.startAmbient();
  },

  setMuted(m) {
    muted = m;
    try { localStorage.setItem('muted', m ? '1' : '0'); } catch { /* ignore */ }
    if (master) master.gain.setTargetAtTime(m ? 0 : .9, ctx.currentTime, .05);
  },

  /** The intro: something hits hot oil, sizzles hard, then settles. */
  sizzle(duration = 2.6) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(duration, .0009);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.55, t + .06);
    g.gain.exponentialRampToValueAtTime(.18, t + .9);
    g.gain.exponentialRampToValueAtTime(.001, t + duration);
    src.connect(hp).connect(lp).connect(g).connect(master);
    src.start(t);
    // A low "clank" of the pan on the stove.
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(90, t + .25);
    const og = ctx.createGain(); og.gain.setValueAtTime(.25, t); og.gain.exponentialRampToValueAtTime(.001, t + .3);
    o.connect(og).connect(master); o.start(t); o.stop(t + .32);
  },

  /** Quiet, continuous kadai sizzle while you're on the street. */
  startAmbient() {
    if (!ctx || ambient) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(4, .0004);
    src.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(hp).connect(g).connect(master);
    src.start();
    ambient = g;
    this.ambientLevel(.035, 3);
  },
  ambientLevel(v, secs = .6) {
    if (ambient) ambient.gain.setTargetAtTime(v, ctx.currentTime, secs / 3);
  },

  /** Camera flying to a screen. */
  whoosh(duration = 1.4) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(duration);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(250, t); bp.frequency.exponentialRampToValueAtTime(1400, t + duration * .6); bp.frequency.exponentialRampToValueAtTime(500, t + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.22, t + duration * .45); g.gain.exponentialRampToValueAtTime(.001, t + duration);
    src.connect(bp).connect(g).connect(master); src.start(t);
  },

  /** Tiny blip when hovering a sign. */
  blip(pitch = 880) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(pitch, t); o.frequency.exponentialRampToValueAtTime(pitch * .75, t + .07);
    const g = ctx.createGain(); g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.001, t + .09);
    o.connect(g).connect(master); o.start(t); o.stop(t + .1);
  },
};
