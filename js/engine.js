'use strict';
// ============ ДВИЖОК: экран, ввод, звук, утилиты, частицы, текст ============
const W = 640, H = 360;
const G = { W, H, t: 0, dt: 0, debug: false, VER: '68' };
window.G = G;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W * 2; canvas.height = H * 2;
ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
G.ctx = ctx;

function fitCanvas() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// ---------- утилиты ----------
const U = {
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a, b) => a + Math.random() * (b - a),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  choice: arr => arr[Math.floor(Math.random() * arr.length)],
  approach: (v, t, d) => (v < t ? Math.min(v + d, t) : Math.max(v - d, t)),
  overlap: (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y,
  dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
  easeOut: t => 1 - (1 - t) * (1 - t),
  easeInOut: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  seeded(seed) {
    let a = seed >>> 0;
    const f = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.range = (lo, hi) => lo + f() * (hi - lo);
    f.int = (lo, hi) => Math.floor(lo + f() * (hi - lo + 1));
    f.pick = arr => arr[Math.floor(f() * arr.length)];
    return f;
  },
};
G.U = U;

// ---------- ввод ----------
const Input = {
  down: {}, hit: {}, lastDevice: 'keyboard',
  bind: {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    KeyZ: 'jump', Space: 'jump', KeyK: 'jump',
    KeyX: 'punch', KeyJ: 'punch',
    KeyC: 'throw', KeyL: 'throw',
    KeyQ: 'switch', KeyV: 'switch', ShiftLeft: 'switch',
    Enter: 'start', NumpadEnter: 'start', Escape: 'pause', KeyP: 'pause', KeyM: 'mute',
  },
  press(a) { if (!this.down[a]) this.hit[a] = true; this.down[a] = true; },
  release(a) { this.down[a] = false; },
  held(a) { return !!this.down[a]; },
  pressed(a) { return !!this.hit[a]; },
  anyPressed() { return this.hit.start || this.hit.jump || this.hit.punch; },
  endFrame() { this.hit = {}; },
  gpPrev: {},
  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && pads[0];
    if (!p) return;
    const b = i => p.buttons[i] && p.buttons[i].pressed;
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    const map = {
      left: b(14) || ax < -0.4, right: b(15) || ax > 0.4, up: b(12) || ay < -0.5, down: b(13) || ay > 0.5,
      jump: b(0), punch: b(2), throw: b(1), switch: b(3) || b(5), start: b(9), pause: b(8),
    };
    for (const k in map) {
      if (map[k] && !this.gpPrev[k]) { this.press(k); this.lastDevice = 'gamepad'; }
      if (!map[k] && this.gpPrev[k]) this.release(k);
      this.gpPrev[k] = map[k];
    }
  },
};
window.addEventListener('keydown', e => {
  const a = Input.bind[e.code];
  if (a) { e.preventDefault(); if (!e.repeat) Input.press(a); Input.lastDevice = 'keyboard'; }
  Sound.unlock();
});
window.addEventListener('keyup', e => { const a = Input.bind[e.code]; if (a) Input.release(a); });
window.addEventListener('blur', () => { Input.down = {}; });
// сенсорные кнопки
(function setupTouch() {
  const box = document.getElementById('touch');
  if (!box) return;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) document.body.classList.add('touch');
  box.querySelectorAll('[data-a]').forEach(el => {
    const a = el.dataset.a;
    const on = e => { e.preventDefault(); Input.press(a); Input.lastDevice = 'touch'; el.classList.add('on'); Sound.unlock(); };
    const off = e => { e.preventDefault(); Input.release(a); el.classList.remove('on'); };
    el.addEventListener('touchstart', on, { passive: false });
    el.addEventListener('touchend', off, { passive: false });
    el.addEventListener('touchcancel', off, { passive: false });
    el.addEventListener('mousedown', on);
    el.addEventListener('mouseup', off);
    el.addEventListener('mouseleave', off);
  });
  canvas.addEventListener('touchstart', e => { Sound.unlock(); Input.press('start'); setTimeout(() => Input.release('start'), 50); }, { passive: true });
  canvas.addEventListener('mousedown', () => { Sound.unlock(); Input.press('start'); setTimeout(() => Input.release('start'), 50); });
})();
G.Input = Input;

// ---------- звук (синтез WebAudio, без файлов) ----------
const NOTE = (() => {
  const names = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  return s => {
    const m = /^([A-G]#?)(\d)$/.exec(s);
    if (!m) return 0;
    const n = names[m[1]] + (parseInt(m[2], 10) + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  };
})();

const Sound = {
  ac: null, master: null, sfxG: null, musG: null, muted: false, noiseBuf: null,
  unlock() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ac = new AC();
    this.master = this.ac.createGain(); this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(this.ac.destination);
    this.sfxG = this.ac.createGain(); this.sfxG.gain.value = 0.55; this.sfxG.connect(this.master);
    this.musG = this.ac.createGain(); this.musG.gain.value = 0.55; this.musG.connect(this.master);
    const len = this.ac.sampleRate;
    this.noiseBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (Music.pending) { const p = Music.pending; Music.pending = null; Music.play(p); }
  },
  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem('valera_mute', this.muted ? '1' : '0'); } catch (e) {}
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.8;
  },
  tone(freq, dur, o = {}) {
    if (!this.ac) return;
    const t0 = this.ac.currentTime + (o.delay || 0);
    const osc = this.ac.createOscillator();
    const g = this.ac.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t0 + dur);
    const v = o.vol == null ? 0.3 : o.vol;
    g.gain.setValueAtTime(v, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g); g.connect(o.bus || this.sfxG);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  },
  noise(dur, o = {}) {
    if (!this.ac) return;
    const t0 = this.ac.currentTime + (o.delay || 0);
    const src = this.ac.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ac.createBiquadFilter();
    f.type = o.filter || 'lowpass';
    f.frequency.setValueAtTime(o.freq || 2000, t0);
    if (o.slide) f.frequency.exponentialRampToValueAtTime(o.slide, t0 + dur);
    const g = this.ac.createGain();
    const v = o.vol == null ? 0.3 : o.vol;
    g.gain.setValueAtTime(v, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || this.sfxG);
    src.start(t0, Math.random() * 0.5); src.stop(t0 + dur + 0.02);
  },
  play(name, p = 1) {
    if (!this.ac) return;
    const s = this;
    switch (name) {
      case 'jump': s.tone(220 * p, 0.14, { slide: 520 * p, vol: 0.16 }); break;
      case 'land': s.noise(0.07, { freq: 500, vol: 0.18 }); break;
      case 'punch': s.noise(0.08, { freq: 1800, slide: 400, vol: 0.2 }); s.tone(160, 0.05, { type: 'triangle', vol: 0.2, slide: 80 }); break;
      case 'hit': s.noise(0.12, { freq: 1200, slide: 200, vol: 0.35 }); s.tone(110, 0.1, { vol: 0.25, slide: 50 }); break;
      case 'hurt': s.tone(300, 0.25, { type: 'sawtooth', slide: 90, vol: 0.2 }); s.noise(0.15, { freq: 900, vol: 0.2 }); break;
      case 'pickup': s.tone(660, 0.07, { vol: 0.15 }); s.tone(990, 0.1, { vol: 0.15, delay: 0.06 }); break;
      case 'coin': s.tone(1320, 0.05, { vol: 0.12 }); s.tone(1760, 0.12, { vol: 0.12, delay: 0.05 }); break;
      case 'heal': [523, 659, 784, 1046].forEach((f, i) => s.tone(f, 0.12, { type: 'triangle', vol: 0.18, delay: i * 0.06 })); break;
      case 'throw': s.noise(0.12, { freq: 3000, slide: 800, vol: 0.12, filter: 'bandpass' }); break;
      case 'glass': for (let i = 0; i < 5; i++) s.tone(U.rand(2200, 4200), 0.06, { type: 'triangle', vol: 0.08, delay: i * 0.02 }); s.noise(0.2, { freq: 6000, vol: 0.12, filter: 'highpass' }); break;
      case 'brick': s.noise(0.18, { freq: 400, slide: 100, vol: 0.4 }); s.tone(70, 0.15, { type: 'sine', vol: 0.3 }); break;
      case 'clank': s.tone(1400 * p, 0.12, { type: 'square', vol: 0.08, slide: 1100 * p }); s.tone(2100 * p, 0.2, { type: 'triangle', vol: 0.08 }); break;
      case 'warn': s.tone(880, 0.06, { vol: 0.08 }); break;
      case 'blip': s.tone(p, 0.035, { type: 'square', vol: 0.05 }); break;
      case 'stomp': s.noise(0.1, { freq: 300, vol: 0.4 }); s.tone(60, 0.12, { type: 'sine', vol: 0.35 }); break;
      case 'boom': s.noise(0.6, { freq: 800, slide: 60, vol: 0.5 }); s.tone(55, 0.5, { type: 'sine', vol: 0.4, slide: 30 }); break;
      case 'shout': s.tone(180, 0.35, { type: 'sawtooth', vol: 0.12, slide: 240 }); s.tone(186, 0.35, { type: 'sawtooth', vol: 0.1, slide: 250 }); break;
      case 'deflect': s.tone(900, 0.08, { vol: 0.15 }); s.tone(1800, 0.15, { type: 'triangle', vol: 0.15, delay: 0.04 }); break;
      case 'crane': s.tone(70, 0.8, { type: 'sawtooth', vol: 0.12, slide: 90 }); s.noise(0.8, { freq: 300, vol: 0.1 }); break;
      case 'lever': s.tone(300, 0.05, { vol: 0.15 }); s.noise(0.1, { freq: 2000, vol: 0.1, delay: 0.05 }); break;
      case 'checkpoint': [392, 523, 659, 784].forEach((f, i) => s.tone(f, 0.15, { vol: 0.14, delay: i * 0.08 })); break;
      case 'swig': for (let i = 0; i < 3; i++) s.tone(200, 0.08, { type: 'sine', vol: 0.2, slide: 120, delay: i * 0.18 }); break;
      case 'rope': s.noise(0.9, { freq: 2500, slide: 600, vol: 0.12, filter: 'bandpass' }); break;
      case 'bird': s.tone(2400, 0.05, { type: 'sine', vol: 0.06, slide: 3000 }); s.tone(2600, 0.05, { type: 'sine', vol: 0.06, slide: 3200, delay: 0.1 }); break;
      case 'gull': s.tone(1300, 0.18, { type: 'sawtooth', vol: 0.06, slide: 900 }); s.tone(1250, 0.15, { type: 'sawtooth', vol: 0.05, slide: 800, delay: 0.2 }); break;
      case 'squeak': s.tone(2000, 0.06, { type: 'square', vol: 0.06, slide: 2600 }); break;
      case 'steam': s.noise(0.5, { freq: 5000, vol: 0.12, filter: 'highpass' }); break;
      case 'zap': s.tone(120, 0.15, { type: 'sawtooth', vol: 0.12, slide: 900 }); s.noise(0.15, { freq: 4000, vol: 0.1, filter: 'highpass' }); break;
      case 'crumble': s.noise(0.3, { freq: 700, slide: 200, vol: 0.25 }); break;
      case 'select': s.tone(520, 0.05, { vol: 0.12 }); break;
      case 'confirm': s.tone(520, 0.06, { vol: 0.14 }); s.tone(780, 0.1, { vol: 0.14, delay: 0.06 }); break;
      case 'fart': s.noise(0.7, { freq: 220, slide: 90, vol: 0.4 }); s.tone(70, 0.6, { type: 'sawtooth', vol: 0.12, slide: 50 }); break;
      case 'bark': s.tone(520 * p, 0.08, { type: 'square', vol: 0.12, slide: 300 }); s.noise(0.08, { freq: 1500, vol: 0.12 }); break;
      case 'honk': s.tone(392, 0.25, { type: 'square', vol: 0.12 }); s.tone(466, 0.25, { type: 'square', vol: 0.1 }); break;
      case 'shot': s.noise(0.25, { freq: 3000, slide: 200, vol: 0.45 }); s.tone(90, 0.2, { type: 'sine', vol: 0.3, slide: 40 }); break;
      case 'glassHit': s.noise(0.12, { freq: 1200, slide: 200, vol: 0.35 }); s.tone(2600, 0.08, { type: 'triangle', vol: 0.1 }); break;
      case 'bell': s.tone(1320, 0.4, { type: 'triangle', vol: 0.15 }); s.tone(1760, 0.5, { type: 'triangle', vol: 0.12, delay: 0.12 }); break;
      case 'door': s.noise(0.3, { freq: 500, vol: 0.3 }); s.tone(90, 0.3, { type: 'square', vol: 0.12, slide: 60 }); break;
      case 'splash': s.noise(0.8, { freq: 1400, slide: 200, vol: 0.35 }); s.tone(300, 0.4, { type: 'sine', vol: 0.15, slide: 90 }); break;
      case 'sting': [[220, 0], [233, 0.25], [220, 0.5]].forEach(([f, d]) => { s.tone(f, 0.5, { type: 'sawtooth', vol: 0.15, delay: d }); s.tone(f / 2, 0.6, { type: 'square', vol: 0.12, delay: d }); }); break;
    }
  },
};
try { Sound.muted = localStorage.getItem('valera_mute') === '1'; } catch (e) {}
G.Sound = Sound;

// ---------- музыка: простой трекер ----------
// ноты по 1/16: 'A3' — нота, '.' — пауза, '-' — тянуть; барабаны: k s h
const Music = {
  cur: null, name: null, step: 0, next: 0, pending: null,
  songs: {},
  play(name) {
    if (this.name === name) return;
    this.name = name;
    if (!Sound.ac) { this.pending = name; return; }
    const song = this.songs[name];
    this.cur = song ? { song, tracks: song.tracks.map(t => ({ ...t, seq: t.notes.trim().split(/\s+/) })) } : null;
    this.step = 0; this.next = Sound.ac.currentTime + 0.05;
  },
  stop() { this.name = null; this.cur = null; },
  update() {
    if (!this.cur || !Sound.ac) return;
    const song = this.cur.song;
    const stepDur = 60 / song.bpm / 4;
    while (this.next < Sound.ac.currentTime + 0.12) {
      for (const tr of this.cur.tracks) {
        const len = tr.seq.length;
        if (!song.loop && this.step >= len) continue;
        const tok = tr.seq[this.step % len];
        if (tok === '.' || tok === '-') continue;
        let hold = 1;
        while (tr.seq[(this.step + hold) % len] === '-' && hold < 16) hold++;
        const d = this.next - Sound.ac.currentTime;
        if (tr.drum) {
          if (tok === 'k') { Sound.tone(120, 0.12, { type: 'sine', slide: 40, vol: tr.vol * 1.6, delay: d, bus: Sound.musG }); }
          else if (tok === 's') Sound.noise(0.1, { freq: 1800, vol: tr.vol, delay: d, bus: Sound.musG, filter: 'bandpass' });
          else if (tok === 'h') Sound.noise(0.03, { freq: 7000, vol: tr.vol * 0.5, delay: d, bus: Sound.musG, filter: 'highpass' });
        } else {
          Sound.tone(NOTE(tok), stepDur * hold * 0.95, { type: tr.wave, vol: tr.vol, delay: d, bus: Sound.musG });
        }
      }
      this.step++;
      if (!song.loop && this.cur.tracks.every(t => this.step >= t.seq.length)) { this.cur = null; return; }
      this.next += stepDur;
    }
  },
};
G.Music = Music;

// ---------- текст (пиксельный шрифт) ----------
const FONT = '"Press Start 2P", "Courier New", monospace';
G.text = function (str, x, y, o = {}) {
  const size = o.size || 8;
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = 'top';
  if (o.shadow !== false) {
    ctx.fillStyle = o.shadowColor || '#000';
    const s = Math.max(1, Math.round(size / 8));
    ctx.fillText(str, Math.round(x) + s, Math.round(y) + s);
    if (o.outline) {
      ctx.fillText(str, Math.round(x) - s, Math.round(y));
      ctx.fillText(str, Math.round(x), Math.round(y) - s);
      ctx.fillText(str, Math.round(x) - s, Math.round(y) + s);
      ctx.fillText(str, Math.round(x) + s, Math.round(y) - s);
    }
  }
  ctx.fillStyle = o.color || '#fff';
  ctx.fillText(str, Math.round(x), Math.round(y));
};
G.textWidth = function (str, size = 8) { ctx.font = `${size}px ${FONT}`; return ctx.measureText(str).width; };
G.wrap = function (str, maxW, size = 8) {
  const out = [];
  for (const para of String(str).split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (G.textWidth(test, size) > maxW && line) { out.push(line); line = w; } else line = test;
    }
    out.push(line);
  }
  return out;
};

// ---------- частицы ----------
const FX = {
  list: [],
  spawn(p) {
    this.list.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, life: 0.6, t: 0, color: '#fff', size: 2, grav: 600, drag: 0, type: 'sq', rot: 0, vr: 0 }, p));
  },
  burst(x, y, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = o.angle != null ? o.angle + U.rand(-o.spread, o.spread) : U.rand(0, Math.PI * 2);
      const sp = U.rand(o.speedMin || 40, o.speed || 160);
      this.spawn({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: U.rand(0.3, o.life || 0.8),
        color: Array.isArray(o.colors) ? U.choice(o.colors) : (o.color || '#fff'), size: o.size || U.randi(1, 3),
        grav: o.grav == null ? 600 : o.grav, type: o.type || 'sq', drag: o.drag || 0, vr: U.rand(-10, 10),
      });
    }
  },
  dust(x, y, n = 6) { this.burst(x, y, n, { angle: -Math.PI / 2, spread: 1.4, speed: 70, colors: ['#9a938a', '#b5ada2', '#7d776f'], grav: -20, life: 0.6, size: 3, drag: 3, type: 'puff' }); },
  update(dt) {
    for (const p of this.list) {
      p.t += dt;
      p.vy += p.grav * dt;
      if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
    this.list = this.list.filter(p => p.t < p.life);
  },
  draw(c) {
    for (const p of this.list) {
      const k = 1 - p.t / p.life;
      c.globalAlpha = p.type === 'puff' ? k * 0.8 : Math.min(1, k * 2);
      c.fillStyle = p.color;
      if (p.type === 'puff') {
        const s = p.size * (1 + p.t * 3);
        if (G.Spr && G.Spr.sheets.gas) {
          if (p.gasRow == null) {
            const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(p.color) || [0, '88', '88', '88'];
            const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
            p.gasRow = g > r + 25 && g > b + 15 ? 0 : (r + g + b) / 3 > 190 ? 2 : 1;
            p.gasFr = Math.floor(Math.random() * 4); p.rot = Math.random() * 0.6 - 0.3;
          }
          G.Spr.drawC(c, 'gas', p.gasRow * 4 + p.gasFr, p.x, p.y, p.rot, s * 2.6 / 48);
        } else { c.beginPath(); c.arc(p.x, p.y, s, 0, Math.PI * 2); c.fill(); }
      } else if (p.type === 'shard') {
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillRect(-p.size, -1, p.size * 2, 2); c.restore();
      } else if (p.type === 'text') {
        c.globalAlpha = Math.min(1, k * 2);
        G.text(p.text, p.x, p.y, { size: p.size, color: p.color, align: 'center', outline: true });
      } else {
        c.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
    }
    c.globalAlpha = 1;
  },
  popText(x, y, text, color = '#ffd84a', size = 8) {
    this.spawn({ x, y, vy: -50, grav: 0, life: 1.0, type: 'text', text, color, size });
  },
};
G.FX = FX;

// ---------- тряска экрана и вспышки ----------
G.shakeAmt = 0; G.shakeT = 0;
G.shake = (a, t = 0.25) => { G.shakeAmt = Math.max(G.shakeAmt, a); G.shakeT = Math.max(G.shakeT, t); };
G.flashT = 0; G.flashColor = '#fff';
G.flash = (t = 0.1, color = '#fff') => { G.flashT = t; G.flashColor = color; };
G.hitStop = 0;

// ---------- изображения ----------
G.img = {};
G.loadImage = src => new Promise(res => {
  const im = new Image();
  im.onload = () => res(im);
  im.onerror = () => res(null);
  im.src = src + (src.indexOf('?') < 0 ? '?v=' + G.VER : '');
});
// качественное уменьшение (для «пиксельного» вида)
G.downscale = function (img, w, h) {
  let cur = img, cw = img.width, ch = img.height;
  while (cw / 2 > w && ch / 2 > h) {
    const c = document.createElement('canvas');
    c.width = Math.round(cw / 2); c.height = Math.round(ch / 2);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(cur, 0, 0, c.width, c.height);
    cur = c; cw = c.width; ch = c.height;
  }
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
  x.drawImage(cur, 0, 0, w, h);
  // выпрямляем альфу: пиксель либо есть, либо нет
  const d = x.getImageData(0, 0, w, h);
  for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0;
  x.putImageData(d, 0, 0);
  return c;
};
G.makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };
