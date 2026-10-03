'use strict';
// ============ КАТСЦЕНЫ: сценарии-генераторы, актёры, диалоги ============
const Scene = {
  active: false, gen: null, waitT: 0, pred: null, fast: false, dialog: null, onEnd: null, t: 0,
  run(genFn, onEnd) {
    this.active = true; this.gen = genFn(); this.waitT = 0; this.pred = null; this.fast = false; this.dialog = null; this.onEnd = onEnd; this.t = 0; this.dialogTop = true;
    G.bubbles = [];
  },
  tick(dt) {
    if (!this.active) return;
    this.t += dt;
    if (G.Input.pressed('pause') && this.t > 0.3) this.fast = true;
    if (this.dialog) this.updateDialog(dt);
    let guard = 0;
    while (this.active) {
      if (this.fast) { this.dialog = null; this.waitT = 0; this.pred = null; }
      if (this.waitT > 0) { this.waitT -= dt; if (this.waitT > 0) break; }
      if (this.pred) { if (!this.pred()) break; this.pred = null; }
      const r = this.gen.next();
      if (r.done) { this.active = false; G.bubbles = []; const f = this.onEnd; this.onEnd = null; if (f) f(); break; }
      const v = r.value;
      if (typeof v === 'number') { this.waitT = v; if (!this.fast) break; }
      else if (typeof v === 'function') this.pred = v;
      else if (!this.fast) break;
      if (++guard > 20000) break;
    }
  },
  updateDialog(dt) {
    const d = this.dialog;
    d.t += dt;
    const shown = Math.min(d.text.length, Math.floor(d.t * 38));
    if (shown > d.shown) {
      if (shown % 2 === 0) Sound.play('blip', d.voice);
      d.shown = shown;
    }
    const full = d.shown >= d.text.length;
    if (d.actor) d.actor.talking = !full;
    const I = G.Input;
    if (I.pressed('jump') || I.pressed('punch') || I.pressed('start')) {
      if (!full) { d.shown = d.text.length; d.t = d.text.length / 38; }
      else this.closeDialog();
    } else if (full && d.auto != null && d.t > d.text.length / 38 + d.auto) this.closeDialog();
  },
  closeDialog() { if (this.dialog && this.dialog.actor) this.dialog.actor.talking = false; this.dialog = null; },
  drawDialog(c) {
    const d = this.dialog;
    if (!d) return;
    const bx = 12, bw = W - 24, bh = 82, by = this.dialogTop ? 8 : H - 92;
    Art.R(c, bx - 2, by - 2, bw + 4, bh + 4, '#0a0a0c');
    Art.R(c, bx, by, bw, bh, 'rgba(24,26,32,0.95)');
    Art.R(c, bx, by, bw, 2, d.color || '#f06a14');
    G.drawPortrait(c, d.who, bx + 8, by + 9, !(d.shown >= d.text.length));
    G.text(d.name, bx + 84, by + 10, { size: 8, color: d.color || '#ffb070' });
    const lines = G.wrap(d.text.slice(0, d.shown), bw - 100, 8);
    lines.slice(0, 5).forEach((l, i) => G.text(l, bx + 84, by + 26 + i * 12, { size: 8, color: '#f4f0e4' }));
    if (d.shown >= d.text.length && (G.t * 3 | 0) % 2) G.text('>', bx + bw - 16, by + bh - 14, { color: '#ffd84a' });
  },
};
G.Scene = Scene;

// ---------- помощники для сценариев ----------
const WHO = {
  valera: { name: 'ВАЛЕРА', color: '#ff8a3a', voice: 240 },
  natasha: { name: 'НАТАШКА-КРАНОВЩИЦА', color: '#e06070', voice: 330 },
  kesha: { name: 'КЕША', color: '#8cc8ff', voice: 210 },
  seller: { name: 'ПРОДАВЩИЦА', color: '#d8a0d8', voice: 380 },
  commando: { name: 'СПЕЦНАЗОВЕЦ', color: '#8ac070', voice: 170 },
  commando2: { name: 'КОМАНДИР', color: '#8ac070', voice: 150 },
};
Scene.say = function* (who, text, actor, o = {}) {
  const w = WHO[who] || { name: who, color: '#fff', voice: 300 };
  Scene.dialog = { who, name: w.name, color: w.color, voice: w.voice, text, shown: 0, t: 0, actor, face: o.face, auto: o.auto };
  yield () => !Scene.dialog;
};
Scene.wait = s => s;
Scene.moveTo = function* (a, x, speed = 70, anim = 'walk') {
  a.setAnim(anim);
  a.facing = x > a.x ? 1 : -1;
  while (Math.abs(a.x - x) > 1) {
    if (Scene.fast) { a.x = x; break; }
    a.x = U.approach(a.x, x, speed * G.dt);
    yield;
  }
  a.setAnim('stand');
};
Scene.tween = function* (dur, fn) {
  let t = 0;
  while (t < dur) {
    if (Scene.fast) break;
    t += G.dt; fn(Math.min(1, t / dur)); yield;
  }
  fn(1);
};

// ---------- портреты ----------
G.drawPortrait = function (c, who, x, y, talking) {
  Art.R(c, x - 2, y - 2, 68, 68, '#0a0a0c');
  Art.R(c, x, y, 64, 64, { valera: '#4a2a14', natasha: '#3a2a34', kesha: '#1a2a3a', seller: '#3a2a3a' }[who] || '#1e2a1e');
  const bob = talking ? Math.round(Math.abs(Math.sin(G.t * 14)) * 1) : 0;
  c.save(); c.beginPath(); c.rect(x, y, 64, 64); c.clip();
  {
    const p = G.portraits && G.portraits[who];
    if (p) c.drawImage(p, x, y - bob, 64, 64);
  }
  c.restore();
};

// ---------- актёр (спрайтовый) ----------
G.Actor = class {
  constructor(style, x, y, facing = 1) {
    this.style = style;
    this.x = x; this.y = y; this.facing = facing; this.anim = 'stand'; this.animT = 0;
    this.talking = false; this.helmet = false; this.visible = true; this.alpha = 1; this.rot = 0;
    this.headH = style === 'valera' ? 92 : style === 'commando' ? 96 : 86; this.voice = 260;
  }
  setAnim(a) { if (this.anim !== a) { this.anim = a; this.animT = 0; } }
  update(dt) { this.animT += dt; }
  draw(c, cx = 0, cy = 0) {
    if (!this.visible) return;
    if (this.clipY != null) { c.save(); c.beginPath(); c.rect(-50, -50, W + 100, this.clipY - cy + 50); c.clip(); }
    const bob = this.talking ? -Math.abs(Math.sin(G.t * 12)) * 1 : 0;
    const x = this.x - cx, y = this.y - cy + bob;
    Spr.drawAnim(c, this.style, this.anim, this.animT, x, y, this.facing, { alpha: this.alpha, rot: this.rot, scale: this.scale });
    if (this.helmet && this.anim !== 'work' && this.anim !== 'lookUpHat') {
      const anim = Spr.ANIM[this.style][this.anim] || Spr.ANIM[this.style].stand;
      const [sh, i] = Spr.frameOf(anim, this.animT);
      const f = Spr.frame(sh, i);
      const fc = anim.flip ? -this.facing : this.facing;
      if (f) Art.item(c, 'helmet', x + (f[6] - f[4]) / 2 * fc, y + (f[7] - f[5]) / 2 + 4, 0, 1.15);
    }
    if (this.clipY != null) c.restore();
  }
};

// титры «ДЕНЬ ПЕРВЫЙ» и т.п.
G.bigTitle = function (c, text, k, o = {}) {
  if (k <= 0) return;
  const size = o.size || 32;
  const sc = k < 0.15 ? 1 + (0.15 - k) * 8 : 1;
  c.save();
  c.globalAlpha = Math.min(1, k * 6) * (o.alpha == null ? 1 : o.alpha);
  c.translate(W / 2, o.y || H / 2);
  c.scale(sc, sc);
  G.text(text, 0, -size / 2, { size, align: 'center', color: o.color || '#f4f0e4', outline: true, shadowColor: '#000' });
  c.restore();
};
