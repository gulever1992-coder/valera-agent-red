// Уровень 8 «ЗАКУЛИСЬЕ» — тир со спины (референс The Punisher, NES). Концепт: L8_CONCEPT.md.
// Пробный кусок: зал (зомби-гости, стрелки за столами и в ложах, гранатомётчики, люстры, вазы, подборы).
// Координаты логические 640x360; листы L8D (js/l8_data.js) нарисованы в пикселях холста — рисуются с k=0.5.
const L8 = { img: {}, ready: false };
L8.mouse = { x: 320, y: 180, moved: false, down: false, click: false, gren: false };
(() => {
  const cv = document.querySelector('canvas'); if (!cv) return; const M = L8.mouse;
  const at = e => { const r = cv.getBoundingClientRect(); if (!(r.width > 0)) return; M.x = (e.clientX - r.left) / r.width * 640; M.y = (e.clientY - r.top) / r.height * 360; };
  const on = () => typeof App !== 'undefined' && App.level instanceof L8.Level && !App.level.done;
  cv.addEventListener('mousemove', e => { at(e); M.moved = true; cv.style.cursor = on() ? 'none' : ''; });
  cv.addEventListener('mousedown', e => { at(e); M.moved = true; if (e.button === 2) M.gren = true; else { M.down = true; M.click = true; } });
  window.addEventListener('mouseup', e => { if (e.button !== 2) M.down = false; });
  cv.addEventListener('contextmenu', e => { if (on()) e.preventDefault(); });
})();
G.loadImage('assets/l8/card.jpg').then(im => { L8.card = im; });
(() => {
  const D = () => window.L8D;
  const FXN = {}, PRN = {};
  const VAL = { aimC: 2, aimL: 1, aimR: 0, fire: 3, stepL: 4, stepR: 5, roll: 6, butt: 7, hurt: 8, reload: 9 };
  const HORIZ = 236, NEAR = 352;            // ноги дальнего и ближнего ряда
  const zy = z => HORIZ + (NEAR - HORIZ) * z;
  const zs = z => 0.5 + 0.5 * z;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  L8.load = async () => {
    if (L8.ready) return;
    const names = Object.keys(D()).filter(n => n[0] !== '_');
    await Promise.all(names.map(async n => { L8.img[n] = await G.loadImage('assets/l8/' + n + '.png'); }));
    await Promise.all(Object.keys(D()._bg).map(async n => { L8.img[n] = await G.loadImage('assets/l8/' + n + '.jpg'); }));
    D().fx8.n.forEach((n, i) => FXN[n] = i); D().props8.n.forEach((n, i) => PRN[n] = i);
    L8.ready = true;
  };
  // кадр листа: якорь в (x, y); s — масштаб
  L8.spr = (c, sh, i, x, y, s = 1, o = {}) => {
    const f = D()[sh].f[i], im = L8.img[sh]; if (!f || !im) return;
    const k = s * 0.5;
    c.save(); c.translate(Math.round(x), Math.round(y));
    if (o.rot) c.rotate(o.rot);
    if (o.flip) c.scale(-1, 1);
    if (o.sy) c.scale(1, o.sy);
    if (o.a != null) c.globalAlpha = o.a;
    c.imageSmoothingEnabled = s < 0.97 || !!o.rot;
    c.drawImage(im, f[0], f[1], f[2], f[3], -f[4] * k, -f[5] * k, f[2] * k, f[3] * k);
    c.restore(); c.imageSmoothingEnabled = false;
  };
  const fsize = (sh, i, s) => { const f = D()[sh].f[i]; return [f[2] * s * 0.5, f[3] * s * 0.5]; };

  // ------------------------------------------------------------------ враги
  class Foe {
    constructor(lv, x, z) { this.lv = lv; this.x = x; this.z = z; this.t = 0; this.st = 'in'; this.stT = 0; this.dead = false; this.gone = false; this.flashT = 0; this.sc = 1; this.clipY = null; }
    get y() { return this.fy != null ? this.fy : zy(this.z); }
    get s() { return (this.fs != null ? this.fs : zs(this.z)) * this.sc; }
    set(st) { this.st = st; this.stT = 0; }
    box() {       // прямоугольник попадания (мир)
      const [w, h] = fsize(this.sh, this.frame(), this.s); const y1 = this.clipY != null ? Math.min(this.y + (this.off || 0), this.clipY) : this.y;
      return [this.x - w * 0.32, this.y + (this.off || 0) - h, w * 0.64, y1 - (this.y + (this.off || 0) - h)];
    }
    hit(dmg, src) {
      if (this.dead) return; this.hp -= dmg; this.flashT = 0.1;
      if (this.hp <= 0) { this.dead = true; this.set('die'); this.lv.kill(this); } else this.onHit && this.onHit();
    }
    drawBase(c, cam) {
      const sx = this.x - cam, o = {};
      if (this.st === 'die') { if (this.stT > 0.9) o.a = clamp(1 - (this.stT - 0.9) / 0.9, 0, 1); }
      else if (this.fade != null && this.fade < 1) { this.fade += 0.03; o.a = clamp(this.fade, 0, 1); }
      if (this.flip) o.flip = true;
      if (this.clipY != null) { c.save(); c.beginPath(); c.rect(sx - 60, 0, 120, this.clipY); c.clip(); }
      else if (this.st !== 'die') L8.spr(c, 'props8', PRN.shadow, sx, this.y + 2, this.s * 0.62, { a: 0.45 });
      L8.spr(c, this.sh, this.frame(), sx + (this.flashT > 0 ? rnd(-1.5, 1.5) : 0), this.y + (this.off || 0), this.s, o);
      if (this.clipY != null) c.restore();
    }
  }
  class Zombie extends Foe {
    constructor(lv, x, z, skin) { super(lv, x, z); this.sh = skin; this.n7 = D()[skin].f.length >= 7; this.hp = 3; this.vz = rnd(0.055, 0.085); this.vx = rnd(13, 20); this.ph = rnd(0, 6); this.pts = 100; }
    frame() { const n = this.n7; if (this.st === 'die') return this.stT < 0.16 ? (n ? 5 : 3) : (n ? 6 : 4); if (this.st === 'hit') return n ? 5 : 3; if (this.st === 'bite') return n ? 4 : 2; return n ? (this.t * 5.2 + this.ph | 0) % 4 : (this.t * 2.6 + this.ph | 0) % 2; }
    onHit() { this.set('hit'); this.z = Math.max(0, this.z - 0.02); }
    update(dt) {
      this.t += dt; this.stT += dt; this.flashT -= dt;
      const pl = this.lv.pl, px = pl.x + this.lv.cam;
      if (this.st === 'die') { if (this.stT > 1.8) this.gone = true; return; }
      if (this.st === 'hit') { if (this.stT > 0.14) this.set('walk'); return; }
      if (this.st === 'in') this.set('walk');
      const dx = px - this.x;
      if (this.st === 'walk') {
        const S = this.lv.S, zm = S.zMax || 0.94; if (this.stun > 0) { this.stun -= dt; this.off = Math.sin(this.t * 30) * 1.5; return; }
        this.z = Math.min(zm, this.z + this.vz * (S.zSpeed || 1) * dt);
        if (Math.abs(dx) > 6) this.x += Math.sign(dx) * this.vx * (S.zSpeed ? 1.8 : 1) * zs(this.z) * dt;
        this.off = Math.abs(Math.sin(this.t * 2.6 * Math.PI + this.ph)) * -1.5;
        if (this.z >= zm && Math.abs(dx) < 34) this.set('bite');
      } else if (this.st === 'bite') {
        if (Math.abs(dx) > 46) { this.set('walk'); return; }
        if (this.stT > 0.55) { this.stT = -0.5; this.lv.hurt(this.lv.S.bite || 8, this.x); }
      }
      this.flip = false;
    }
    draw(c, cam) { this.drawBase(c, cam); }
  }
  // стрелок: прячется (за столом / за балюстрадой ложи), встаёт, предупреждение, выстрел
  class Rifle extends Foe {
    constructor(lv, x, o) { super(lv, x, o.z || 0); this.sh = 'cmdR8'; this.hp = 3; this.pts = 250; Object.assign(this, o); this.wait = o.wait != null ? o.wait : rnd(0.6, 1.4); this.hide = 1; this.cover = o.cover || null; }
    frame() { if (this.st === 'run') return (this.t * 12 | 0) % 6; if (this.st === 'die') return this.stT < 0.18 ? 3 : 4; if (this.st === 'hit') return 3; if (this.st === 'fire') return 2; if (this.st === 'duck' || this.st === 'in') return 0; return 1; }
    set(st) { super.set(st); this.sh = st === 'run' ? 'cmdRun8' : 'cmdR8'; }
    onHit() { this.set('hit'); }
    box() { const b = super.box(); if (this.st === 'duck' || this.st === 'in') { if (this.clipY != null || (this.cover && !this.cover.broken)) return [0, 0, 0, 0]; } return b; }
    update(dt) {
      this.t += dt; this.stT += dt; this.flashT -= dt;
      if (this.st === 'die') { if (this.clipY != null) this.off = (this.off || 0) + 60 * dt; if (this.stT > 1.8) this.gone = true; return; }
      const loge = this.clipY != null;
      if (this.st === 'in' && this.from != null) { this.tx = this.x; this.x = this.from; this.from = null; this.set('run'); }
      if (this.st === 'run') { const d = this.tx - this.x; this.flip = d < 0; if (Math.abs(d) > 3) this.x += Math.sign(d) * 95 * this.s * dt; else { this.x = this.tx; this.flip = false; this.set('duck'); } return; }
      if (this.st === 'in' || this.st === 'duck') { if (loge) this.off = Math.min(26, (this.off || 26) + 120 * dt); if (this.stT > this.wait) { this.set('rise'); } return; }
      if (loge) this.off = Math.max(0, (this.off || 0) - 160 * dt);
      if (this.st === 'hit') { if (this.stT > 0.16) this.set('aim'); return; }
      if (this.st === 'rise') { if (this.stT > 0.22) { this.set('aim'); Sound.play('warn'); } return; }
      if (this.st === 'aim') { if (this.stT > 0.7) { this.set('fire'); this.lv.enemyShot(this); } return; }
      if (this.st === 'fire') { if (this.stT > 0.25) { this.set('duck'); this.wait = rnd(1.1, 2.2); } }
    }
    muzzle() { const [w, h] = fsize(this.sh, 1, this.s); return [this.x + w * 0.18, this.y + (this.off || 0) - h * 0.66]; }
    draw(c, cam) {
      this.drawBase(c, cam);
      if (this.st === 'aim' && (this.stT * 12 | 0) % 2 === 0) { const m = this.muzzle(); const [, h] = fsize(this.sh, 1, this.s); L8.spr(c, 'fx8', FXN.warn, this.x - cam, this.y + (this.off || 0) - h - 8, 0.45 + this.s * 0.45); }
      if (this.st === 'fire' && this.stT < 0.09) { const m = this.muzzle(); L8.spr(c, 'fx8', FXN.flash2, m[0] - cam, m[1], this.s); }
    }
  }
  class Trooper extends Foe {
    constructor(lv, x, o) { super(lv, x, o.z || 0.05); this.sh = 'cmdAdv8'; this.hp = 4; this.pts = 350; Object.assign(this, o); this.stopZ = o.stopZ || rnd(0.35, 0.6); this.tx = o.tx != null ? o.tx : x; this.x = o.from != null ? o.from : x; this.shots = 0; this.set('adv'); }
    frame() { if (this.st === 'die') return this.stT < 0.18 ? 3 : 4; if (this.st === 'hit') return 3; if (this.st === 'fire') return 5; if (this.st === 'aim' || this.st === 'wait') return 4; return (this.t * 8 | 0) % 4; }
    set(st) { super.set(st); this.sh = st === 'die' || st === 'hit' ? 'cmdR8' : 'cmdAdv8'; }
    onHit() { this.set('hit'); }
    update(dt) {
      this.t += dt; this.stT += dt; this.flashT -= dt;
      if (this.st === 'die') { if (this.stT > 1.8) this.gone = true; return; }
      if (this.st === 'hit') { if (this.stT > 0.16) this.set(this.z >= this.stopZ ? 'aim' : 'adv'); return; }
      if (this.st === 'adv') {
        this.z = Math.min(this.stopZ, this.z + 0.11 * dt); const d = this.tx - this.x; if (Math.abs(d) > 3) this.x += Math.sign(d) * 55 * this.s * dt;
        this.off = -Math.abs(Math.sin(this.t * 4 * Math.PI)) * 1.5;
        if (this.z >= this.stopZ && Math.abs(d) <= 3) { this.off = 0; this.set('aim'); Sound.play('warn'); }
        return;
      }
      if (this.st === 'aim') { if (this.stT > 0.75) { this.set('fire'); this.lv.enemyShot(this); this.shots++; } return; }
      if (this.st === 'fire') { if (this.stT > 0.25) { if (this.shots % 2 === 0 && this.stopZ < 0.7) { this.stopZ = Math.min(0.75, this.stopZ + 0.15); this.tx += rnd(-60, 60); this.set('adv'); } else this.set('wait'); } return; }
      if (this.st === 'wait') { if (this.stT > 0.9) { this.set('aim'); Sound.play('warn'); } }
    }
    muzzle() { const [w, h] = fsize('cmdAdv8', 4, this.s); return [this.x + w * 0.3, this.y - h * 0.62]; }
    draw(c, cam) {
      this.drawBase(c, cam);
      if (this.st === 'aim' && (this.stT * 12 | 0) % 2 === 0) { const [, h] = fsize('cmdAdv8', 4, this.s); L8.spr(c, 'fx8', FXN.warn, this.x - cam, this.y - h - 8, 0.45 + this.s * 0.45); }
      if (this.st === 'fire' && this.stT < 0.09) { const m = this.muzzle(); L8.spr(c, 'fx8', FXN.flash2, m[0] - cam, m[1], this.s); }
    }
  }
  class Grenadier extends Foe {
    constructor(lv, x, o) { super(lv, x, o.z || 0); this.sh = 'cmdG8'; this.hp = 3; this.pts = 300; Object.assign(this, o); this.tx = o.tx != null ? o.tx : x; this.wait = rnd(0.5, 1.0); this.x = o.from != null ? o.from : x; }
    frame() { if (this.st === 'die') return this.stT < 0.18 ? 3 : 4; if (this.st === 'hit') return 3; if (this.st === 'wind') return 1; if (this.st === 'throw') return 2; return 0; }
    onHit() { this.set('hit'); }
    update(dt) {
      this.t += dt; this.stT += dt; this.flashT -= dt;
      if (this.st === 'die') { if (this.stT > 1.8) this.gone = true; return; }
      if (this.st === 'in') { const d = this.tx - this.x; if (Math.abs(d) > 2) { this.x += Math.sign(d) * 70 * dt; this.off = -Math.abs(Math.sin(this.t * 14)) * 2; } else { this.off = 0; this.set('idle'); } return; }
      if (this.st === 'hit') { if (this.stT > 0.16) this.set('idle'); return; }
      if (this.st === 'idle') { if (this.stT > this.wait) this.set('wind'); return; }
      if (this.st === 'wind') { if (this.stT > 0.55) { this.set('throw'); this.lv.throwGrenade(this); } return; }
      if (this.st === 'throw') { if (this.stT > 0.4) { this.set('idle'); this.wait = rnd(1.6, 2.6); } }
    }
    hand() { const [w, h] = fsize(this.sh, 2, this.s); return [this.x + w * 0.2, this.y - h * 0.75]; }
    draw(c, cam) { this.drawBase(c, cam); }
  }
  // ------------------------------------------------------------------ предметы
  // виды предметов: лист, кадры (целый / падает / разбит), висит ли, масштаб, звук, эффект при разрушении
  const PDEF = {
    chand: { sh: 'props8', f: 'chand', fall: 'chandFall', dead: 'chandDead', hang: 1, s: 0.62, snd: 'glass' },
    vase: { sh: 'props8', f: 'vase', dead: 'vaseDead', s: 0.78, snd: 'glass' },
    table: { sh: 'props8', f: 'table', dead: 'tableDead', s: 0.78, snd: 'crash' },
    sandbag: { sh: 'prBack8', f: 'sandbag', fall: 'sandbag', dead: 'sandbagDead', hang: 1, s: 0.72, snd: 'rope' },
    lights: { sh: 'prBack8', f: 'lights', fall: 'lights', dead: 'lightsDead', hang: 1, s: 0.85, snd: 'glass' },
    case: { sh: 'prBack8', f: 'case', dead: 'caseDead', s: 0.85, snd: 'crash' },
    flat: { sh: 'prBack8', f: 'flat', dead: 'flatDead', s: 0.85, snd: 'crash' },
    crate: { sh: 'prTech8', f: 'crate', dead: 'crateDead', s: 0.8, snd: 'crash' },
    powder: { sh: 'prTech8', f: 'powder', dead: 'powderDead', s: 1.0, snd: 'steam', fx: 'foam' },
    vodka: { sh: 'prTech8', f: 'vodka', dead: 'vodkaDead', s: 0.9, snd: 'glass', fx: 'fire' },
    capsule: { sh: 'prTech8', f: 'capsule', dead: 'capsuleDead', s: 1.0, snd: 'glass', fx: 'glass' },
  };
  class Prop {
    constructor(lv, kind, x, o = {}) { this.lv = lv; this.kind = kind; this.d = PDEF[kind]; this.x = x; this.z = o.z || 0; this.hp = o.hp || 4; this.broken = false; this.drop = o.drop || null; this.sc = o.sc || 1; this.vy = 0; this.yy = o.y != null ? o.y : null; this.flashT = 0; this.t = 0; this.hang = !!this.d.hang; this.fallZ = o.fallZ; this.spawn = o.spawn; }
    get y() { return this.hang ? this.yy : zy(this.z); }
    get s() { return (this.hang ? this.d.s : zs(this.z) * this.d.s) * this.sc; }
    frame() { const d = this.d, n = D()[d.sh].n; return n.indexOf(this.landed || (this.broken && !d.hang) ? d.dead : this.broken ? d.fall : d.f); }
    box() { if (this.broken) return [0, 0, 0, 0]; const [w, h] = fsize(this.d.sh, this.frame(), this.s); return this.hang ? [this.x - w * 0.4, this.yy, w * 0.8, h] : [this.x - w * 0.42, this.y - h, w * 0.84, h]; }
    hit(d) {
      if (this.broken) return; this.hp -= d; this.flashT = 0.08;
      if (this.hp > 0) return;
      const lv = this.lv; this.broken = true; Sound.play(this.d.snd); lv.score += 50;
      if (this.hang) return;
      lv.puff(this.x, this.y - 14 * this.s, 1.2); if (this.drop) lv.pickup(this.drop, this.x, this.z);
      if (this.d.fx === 'foam') lv.foams.push({ x: this.x, z: this.z, t: 0, life: 6 });
      if (this.d.fx === 'fire') { lv.boom(this.x, this.y - 24, 1); lv.blast(this.x, this.y - 20, 70, 4); lv.fires.push({ x: this.x, z: this.z, t: 0, life: 6 }); for (const o of lv.props) if (o !== this && o.kind === 'vodka' && !o.broken && Math.abs(o.x - this.x) < 170) lv.later(0.3, () => o.hit(99)); }
      if (this.d.fx === 'glass') { lv.fx.push({ sh: 'fxD8', fr: [6], x: this.x, y: this.y - 40 * this.s, s: 1, t: 0, life: 0.35, fade: 1 }); if (this.spawn) lv.later(0.4, () => this.spawn(this)); }
    }
    update(dt) {
      this.t += dt; this.flashT -= dt;
      if (this.hang && this.broken && !this.landed) {
        this.vy += 900 * dt; this.yy += this.vy * dt; const fz = this.fallZ != null ? this.fallZ : 0.35, gy = zy(fz);
        if (this.yy + 40 >= gy) { this.landed = true; this.z = fz; this.hang = false; this.lv.crush(this.x, this.z); }
      }
    }
    draw(c, cam) {
      const sx = this.x - cam + (this.flashT > 0 ? rnd(-1, 1) : 0), sh = this.d.sh;
      if (this.hang) { const f = D()[sh].f[this.frame()]; L8.spr(c, sh, this.frame(), sx, this.yy + f[5] * 0.5 * this.s, this.s, { rot: this.broken ? 0 : Math.sin(this.t * 1.3 + this.x) * 0.03 }); }
      else L8.spr(c, sh, this.frame(), sx, this.y, this.s);
    }
  }
  // мини-босс: щитовик. За щитом неуязвим для пуль; открывается перед очередью; граната оглушает.
  class Shield extends Foe {
    constructor(lv, x, o = {}) { super(lv, x, o.z || 0.08); this.sh = 'shield8'; this.hp = this.max = o.hp || 30; this.pts = 3000; this.name = 'ЩИТОВИК'; this.x = o.from != null ? o.from : x; this.tx = x; this.stopZ = 0.42; this.cd = 2.5; this.n = 0; this.set('adv'); lv.boss = this; }
    frame() { if (this.st === 'die') return this.stT < 0.5 ? 6 : 7; if (this.st === 'stag') return 6; if (this.st === 'open') return 4; if (this.st === 'fire') return (this.stT * 10 | 0) % 2 ? 5 : 4; return (this.t * 7 | 0) % 4; }
    hit(d, src) {
      if (this.dead) return;
      if (this.st === 'adv') { if (src === 'blast') { this.set('stag'); this.hp -= d; this.flashT = 0.1; if (this.hp <= 0) super.hit(0); } else { this.flashT = 0.05; if (Math.random() < 0.3) Sound.play('deflect'); } return; }
      super.hit(d);
    }
    update(dt) {
      this.t += dt; this.stT += dt; this.flashT -= dt; const px = this.lv.pl.x + this.lv.cam;
      if (this.st === 'die') { if (this.stT > 2.4) this.gone = true; return; }
      if (this.st === 'stag') { if (this.stT > 1.7) this.set('adv'); return; }
      if (this.st === 'adv') {
        this.z = Math.min(this.stopZ, this.z + 0.07 * dt); const d = px - this.x; if (Math.abs(d) > 30) this.x += Math.sign(d) * 34 * this.s * dt;
        this.cd -= dt; if (this.cd <= 0 && this.z >= this.stopZ - 0.02) { this.set('open'); Sound.play('warn'); }
        return;
      }
      if (this.st === 'open') { if (this.stT > 0.75) { this.set('fire'); this.n = 0; } return; }
      if (this.st === 'fire') { if (this.n < 3 && this.stT > this.n * 0.3) { this.n++; this.lv.enemyShot(this); } if (this.stT > 1.1) { this.set('adv'); this.cd = rnd(2.2, 3.2); this.stopZ = Math.min(0.7, this.stopZ + 0.07); } }
    }
    muzzle() { const [w, h] = fsize('shield8', 5, this.s); return [this.x + w * 0.22, this.y - h * 0.6]; }
    draw(c, cam) {
      this.drawBase(c, cam);
      if (this.st === 'open' && (this.stT * 12 | 0) % 2 === 0) { const [, h] = fsize('shield8', 4, this.s); L8.spr(c, 'fx8', FXN.warn, this.x - cam, this.y - h - 8, 0.9); }
      if (this.st === 'fire' && (this.stT * 10 | 0) % 2) { const m = this.muzzle(); L8.spr(c, 'fx8', FXN.flash2, m[0] - cam, m[1], this.s); }
    }
  }

  // ------------------------------------------------------------------ уровень
  L8.Level = class {
    constructor() { this.id = 8; this.canPause = true; this.stats = { time: 0, dmg: 0, kills: 0, deflect: 0, secrets: 0, food: 0, deaths: 0, stash: 0, shots: 0, hits: 0 }; this.score = 0; }
    start(opts = {}) {
      Scene.active = false; Scene.dialog = null;
      this.opts = opts; this.loading = true; this.stage = L8.STAGES[opts.stage] ? opts.stage : L8.FIRST; this.carry = null;
      L8.load().then(() => { this.loading = false; this.reset(); });
      try { Music.play('alarm'); } catch (e) {}
    }
    reset() {
      const S = this.S = L8.STAGES[this.stage], bg = D()._bg[S.bg];
      this.panW = bg.w / 2; this.exitT = 0; this.endT = 0; this.cam = 0; this.t = 0; this.done = false; this.dead = 0; this.fadeIn = 0.6;
      this.pl = { x: 320, hp: 100, ammo: 30, res: 180, vog: 3, vest: 0, inv: 0, st: 'idle', stT: 0, dir: 1, fireT: 0, fireAnim: 0, rollCd: 0, reload: 0, stashT: 0, moving: false, stepT: 0 };
      if (this.carry) Object.assign(this.pl, this.carry, { hp: Math.max(this.carry.hp, 60), res: Math.max(this.carry.res, 90) });
      this.cx = 320; this.cy = 180;
      this.foes = []; this.props = []; this.shots = []; this.grens = []; this.fx = []; this.picks = []; this.tracers = []; this.vogs = []; this.foams = []; this.fires = []; this.timers = []; this.haz = []; this.bars = null; this.cutImg = null; this.cutFade = 0; this.cutVal = null; this.cling = 0; this.wind = 0; this.boss = null; this.dark = 0; this.darkK = 0; this.flareT = 0; this.cut = null;
      this.ei = 0; this.msg = null; this.msgT = 0; this.over = [];
      this.events = S.build(this).sort((a, b) => a[0] - b[0]);
      this.fgList = S.fg ? S.fg(this).map(f => [D()[S.fgSheet].n.indexOf(f[0]), f[1], f[2], f[3]]) : [];
      if (S.title) this.say(S.title, 2.4);
    }
    say(s, t = 2) { this.msg = s; this.msgT = t; }
    later(t, fn) { this.timers.push([t, fn]); }
    // ---- события боя
    kill(f) { this.stats.kills++; this.score += f.pts || 100; Sound.play('hit'); if (Math.random() < (f instanceof Zombie ? 0.3 : 0.55)) this.pickup(Math.random() < 0.55 ? 'kefir' : Math.random() < 0.75 ? 'mag' : 'vog', f.x, clamp(f.z || 0.2, 0.1, 0.8)); }
    puff(x, y, s = 1, big) { this.fx.push({ sh: 'fx8', fr: [big ? FXN.puff2 : FXN.puff], x, y, s, t: 0, life: 0.18 }); }
    boom(x, y, s = 1) { this.fx.push({ sh: 'boom8', fr: [0, 1, 2, 3, 4], x, y, s, t: 0, life: 0.55, fade: 1 }); Sound.play('boom'); G.shake(4 * s, 0.25); }
    pickup(kind, x, z) { this.picks.push({ kind, x, z, t: 0, vy: -90, oy: 0 }); }
    hurt(d, fromX) {
      const p = this.pl; if (p.inv > 0 || this.dead || this.done) return;
      if (p.vest > 0) { p.vest--; d = Math.ceil(d * 0.3); Sound.play('deflect'); }
      p.hp -= d; this.stats.dmg += d; p.inv = 0.7; p.st = 'hurt'; p.stT = 0; Sound.play('hurt'); G.flash(0.08, '#f33'); G.shake(3, 0.2);
      if (p.hp <= 0) { p.hp = 0; this.dead = 0.001; this.stats.deaths++; }
    }
    enemyShot(f) {
      const m = f.muzzle(), p = this.pl; Sound.play('shot');
      this.shots.push({ x0: m[0], y0: m[1], tx: p.x + this.cam, ty: 300, t: 0, life: 0.5 + (1 - (f.fs || zs(f.z))) * 0.25, s0: f.s * 0.5 });
    }
    throwGrenade(f) {
      const h = f.hand(), p = this.pl; Sound.play('throw');
      this.grens.push({ x0: h[0], y0: h[1], tx: p.x + this.cam, ty: NEAR - 6, t: 0, life: 1.5, s0: f.s * 0.5, x: h[0], y: h[1], s: 0.3 });
    }
    crush(x, z) {
      this.boom(x, zy(z) - 20, 0.8); Sound.play('crash');
      for (const f of this.foes) if (!f.dead && f.clipY == null && Math.abs(f.x - x) < 70 && Math.abs((f.z || 0) - z) < 0.45) f.hit(9);
    }
    blast(x, y, r, dmg) {
      for (const f of this.foes) { if (f.dead) continue; const b = f.box(); if (!b[2]) continue; const cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2; if (Math.hypot(cx - x, (cy - y) * 1.4) < r) f.hit(dmg, 'blast'); }
      for (const o of this.props) { if (o.broken) continue; const b = o.box(); if (Math.hypot(b[0] + b[2] / 2 - x, b[1] + b[3] / 2 - y) < r) o.hit(dmg); }
    }
    // ---- выстрел игрока в точку прицела
    shootAt(wx, wy) {
      const inb = b => b[2] > 0 && wx >= b[0] && wx <= b[0] + b[2] && wy >= b[1] && wy <= b[1] + b[3];
      for (const g of this.grens) if (!g.hitT && Math.hypot(g.x - wx, g.y - wy) < 9 + 10 * g.s) { g.dead = true; this.boom(g.x, g.y, 0.55); this.score += 150; this.stats.deflect++; return true; }
      for (const h of this.haz) if (h.shoot && !h.dead && Math.hypot(h.x - wx, h.y - wy) < 10 + 8 * h.s) { h.dead = true; this.puff(h.x, h.y, 1); this.score += 50; this.stats.deflect++; if (Math.random() < 0.3) this.pickup('mag', clamp(h.x, 60, 580), 0.6); return true; }
      for (const k of this.picks) { const y = zy(k.z) + k.oy - 10; if (Math.hypot(k.x - wx, y - wy) < 16) { this.take(k); return true; } }
      let best = null, bz = -9;
      for (const f of this.foes) { if (f.dead) continue; if (inb(f.box())) { const zz = f.clipY != null ? -1 : f.z; if (zz > bz) { bz = zz; best = f; } } }
      for (const o of this.props) { if (o.broken) continue; if (inb(o.box())) { const zz = o.hang ? -2 : o.z + 0.001; if (zz > bz) { bz = zz; best = o; } } }
      if (best) { best.hit(1); this.stats.hits++; if (best instanceof Zombie) this.fx.push({ sh: 'fx8', fr: [FXN.slime], x: wx, y: wy, s: 0.8, t: 0, life: 0.2 }); else this.puff(wx, wy, 0.8); return true; }
      this.puff(wx, wy, 0.7); return false;
    }
    take(k) {
      const p = this.pl; k.dead = true; Sound.play('pickup'); this.score += 50;
      if (k.kind === 'flare') { this.flareT = 7; return; }
      if (k.kind === 'mag') p.res = Math.min(400, p.res + 30); else if (k.kind === 'vog') p.vog = Math.min(6, p.vog + 1); else if (k.kind === 'kefir') { p.hp = Math.min(100, p.hp + 50); this.stats.food++; } else if (k.kind === 'vest') p.vest = 3;
    }
    // ---- обновление
    update(dt) {
      if (this.loading) return;
      const I = G.Input, p = this.pl; this.t += dt; this.fadeIn -= dt;
      if (this.msgT > 0) this.msgT -= dt;
      if (Scene.active) { Scene.tick(dt); this.updFx(dt); if (this.cut) this.cut.t += dt; if (this.cutVal) this.cutVal.t += dt; return; }
      if (this.dead) { this.dead += dt; if (this.dead > 2.2) this.reset(); this.updFx(dt); return; }
      if (this.done) { this.doneT += dt; if (this.doneT > 1.5 && (I.pressed('start') || I.pressed('jump') || I.pressed('punch'))) { Sound.play('confirm'); this.stats.deaths = 0; this.score = 0; this.stage = L8.FIRST; this.carry = null; this.reset(); } this.updFx(dt); return; }
      this.stats.time += dt;
      // события по времени
      while (this.ei < this.events.length && this.events[this.ei][0] <= this.t) { this.events[this.ei][1](); this.ei++; }
      if (this.S.trickle && this.ei < this.events.length) { this.trT = (this.trT || 0) + dt; if (this.trT > this.S.trickle && this.foes.filter(f => !f.dead).length < 9) { this.trT = 0; L8.mk(this).far(); } }
      // камера едет вправо
      this.cam = Math.min(this.panW - 640, this.cam + (this.S.speed || 8.6) * dt);
      // прицел
      const sp = 210, ax = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0), ay = (I.held('down') ? 1 : 0) - (I.held('up') ? 1 : 0);
      this.cx = clamp(this.cx + ax * sp * dt, 14, 626); this.cy = clamp(this.cy + ay * sp * dt, 14, 318);
      const MS = L8.mouse; if (MS.moved) { MS.moved = false; this.cx = clamp(MS.x, 14, 626); this.cy = clamp(MS.y, 14, 318); }
      const mClick = MS.click, mGren = MS.gren; MS.click = false; MS.gren = false;
      if (ax) p.dir = ax;
      p.inv -= dt; p.rollCd -= dt; p.stT += dt; p.fireT -= dt;
      // состояния Валеры
      if (p.st === 'roll') { p.x = clamp(p.x + p.rollDir * 300 * dt, this.S.xmin || 40, this.S.xmax || 600); if (p.stT > 0.34) p.st = 'idle'; }
      else if (p.st === 'butt' || p.st === 'hurt') { if (p.stT > 0.24) p.st = 'idle'; }
      else if (p.st === 'reload') { if (p.stT > 0.75) { const n = Math.min(30, p.res); p.ammo = n; p.res -= n; p.st = 'idle'; Sound.play('lever'); } }
      if (p.st === 'idle') {
        const d = this.cx - p.x; p.moving = Math.abs(d) > 14;
        if (p.moving) { p.x += Math.sign(d) * Math.min(Math.abs(d), 175 * dt); p.stepT += dt; }
        p.x = clamp(p.x, this.S.xmin || 40, this.S.xmax || 600);
        if (I.pressed('jump') && p.rollCd <= 0) { p.st = 'roll'; p.stT = 0; p.rollDir = ax || p.dir; p.inv = 0.38; p.rollCd = 1.1; Sound.play('jump'); }
        else if ((I.pressed('throw') || mGren) && p.vog > 0) { p.vog--; Sound.play('throw'); const m = this.muzzle(); this.vogs.push({ x0: m[0] + this.cam, y0: m[1], tx: this.cx + this.cam, ty: this.cy, t: 0, life: 0.45 }); p.fireAnim = 0.12; }
        else if ((I.held('punch') || MS.down) && !this.cling) this.fire(dt, I.pressed('punch') || mClick);
      }
      p.fireAnim -= dt;
      // «заначка» при пустом боезапасе
      if (p.ammo <= 0 && p.res <= 0) { p.stashT += dt; if (p.stashT > 2) { p.stashT = 0; p.ammo = 6; this.stats.stash++; } }
      for (const tm of this.timers) { tm[0] -= dt; if (tm[0] <= 0) tm[1](); } this.timers = this.timers.filter(tm => tm[0] > 0);
      this.hazards(dt);
      for (const f of this.foes) f.update(dt);
      for (const o of this.props) o.update(dt);
      // остались за кадром: позади камеры — убираем; в конце локации — убираем всех, кто вне экрана
      const atEnd = this.cam >= this.panW - 641 && this.ei >= this.events.length;
      for (const f of this.foes) if (f.x < this.cam - 70 || (atEnd && f.clipY == null && (f.x < this.cam - 20 || f.x > this.cam + 660))) f.gone = true;
      this.foes = this.foes.filter(f => !f.gone);
      // конец локации, а враги ещё живы: подсказка, метки, через 20 с недобитые разбегаются
      this.left = atEnd && !this.S.arena ? this.foes.filter(f => !f.dead).length : 0;
      if (this.left) { this.endT += dt; if (this.endT > 20) { for (const f of this.foes) if (!f.dead) { f.gone = true; this.puff(f.x, f.y - 20, 1); } this.say('ОСТАЛЬНЫЕ РАЗБЕЖАЛИСЬ!', 2); } } else this.endT = 0;
      this.updShots(dt); this.updFx(dt);
      for (const o of this.over) o.update && o.update(dt);
      if (this.S.update) this.S.update(this, dt);
      if (this.ei >= this.events.length && !this.foes.some(f => !f.dead) && this.t > this.events[this.events.length - 1][0] + 1.5 && (!this.S.hold || this.S.hold(this)) && this.cam >= this.panW - 641) {
        this.exitT += dt; if (this.exitT > 0.2 && this.exitT - dt <= 0.2) { Sound.play('checkpoint'); if (this.S.outro) this.say(this.S.outro, 2); }
        const fn = typeof this.S.next === 'function'; if (this.exitT > (fn ? 1.0 : 2.2)) { this.exitT = -1e9; this.next(); }
      }
    }
    next() {
      const p = this.pl, n = this.S.next;
      if (!n || (typeof n === 'string' && !L8.STAGES[n])) { this.done = true; this.doneT = 0; return; }
      this.carry = { hp: p.hp, ammo: p.ammo, res: p.res, vog: p.vog, vest: p.vest };
      if (typeof n === 'function') return n(this);
      this.stage = n; this.reset();
    }
    muzzle() { const p = this.pl, L = this.cx - p.x < -30; return [p.x + (L ? -34 : 36), 364 - (L ? 108 : this.cy < 150 ? 118 : 104)]; }
    fire(dt, first) {
      const p = this.pl;
      // удар прикладом по ближнему
      if (first) { const near = this.foes.find(f => !f.dead && f.clipY == null && f.z > 0.86 && Math.abs(f.x - this.cam - p.x) < 52); if (near) { p.st = 'butt'; p.stT = 0; near.hit(3); near.z = Math.max(0, near.z - 0.12); Sound.play('punch'); G.shake(2, 0.12); return; } }
      if (p.fireT > 0) return;
      if (p.ammo <= 0) { if (p.res > 0) { p.st = 'reload'; p.stT = 0; } else if (first) Sound.play('blip'); return; }
      p.ammo--; p.fireT = 0.105; p.fireAnim = 0.09; this.stats.shots++; Sound.play('shot');
      const wx = this.cx + this.cam + rnd(-3, 3), wy = this.cy + rnd(-3, 3), m = this.muzzle();
      this.tracers.push({ x0: m[0], y0: m[1], x1: this.cx, y1: this.cy, t: 0 });
      this.fx.push({ sh: 'fx8', fr: [FXN.shell], x: m[0] + this.cam - 8, y: m[1] + 8, s: 0.7, t: 0, life: 0.4, vx: rnd(-50, -20), vy: -90, g: 500, rot: rnd(0, 6) });
      this.shootAt(wx, wy);
    }
    updShots(dt) {
      const p = this.pl, px = p.x + this.cam;
      for (const s of this.shots) { s.t += dt; if (s.t >= s.life) { s.dead = true; if (Math.abs(px - s.tx) < 24) this.hurt(10, s.tx); else this.puff(s.tx, 340, 0.9); } }
      for (const g of this.grens) {
        g.t += dt; const k = g.t / g.life; g.x = g.x0 + (g.tx - g.x0) * k; g.y = g.y0 + (g.ty - g.y0) * k - Math.sin(k * Math.PI) * 120; g.s = g.s0 + (1 - g.s0) * k;
        if (k >= 1 && !g.dead) { g.dead = true; this.boom(g.tx, g.ty - 20, 1); if (Math.abs(px - g.tx) < 50) this.hurt(20, g.tx); this.blast(g.tx, g.ty - 20, 50, 2); }
      }
      for (const h of this.haz) {
        h.t += dt; const k = clamp(h.t / h.life, 0, 1); h.x = h.x0 + (h.tx - h.x0) * k; h.y = h.y0 + (h.ty - h.y0) * k - Math.sin(k * Math.PI) * h.arc; h.s = h.s0 + (h.s1 - h.s0) * k;
        if (k >= 1 && !h.dead) { h.dead = true; if (h.dmg && Math.abs(px - h.tx) < h.r) this.hurt(h.dmg, h.tx); if (h.boom) this.boom(h.tx, h.ty - 14, h.boom); else if (h.dmg) this.puff(h.tx, h.ty - 6, 1.2, 1); }
      }
      this.haz = this.haz.filter(h => !h.dead);
      for (const v of this.vogs) { v.t += dt; if (v.t >= v.life) { v.dead = true; this.boom(v.tx, v.ty, 0.9); this.blast(v.tx, v.ty, 62, 6); } }
      for (const k of this.picks) { k.t += dt; k.vy += 420 * dt; k.oy = Math.min(0, k.oy + k.vy * dt); if (k.oy === 0 && k.vy > 0) k.vy = 0; if (k.t > 8) k.dead = true; }
      for (const t of this.tracers) t.t += dt;
      this.shots = this.shots.filter(s => !s.dead); this.grens = this.grens.filter(g => !g.dead); this.vogs = this.vogs.filter(v => !v.dead);
      this.picks = this.picks.filter(k => !k.dead); this.tracers = this.tracers.filter(t => t.t < 0.07);
    }
    hazards(dt) {
      for (const h of this.foams) { h.t += dt; for (const f of this.foes) if (f instanceof Zombie && !f.dead && Math.abs(f.x - h.x) < 62 && Math.abs(f.z - h.z) < 0.22) f.stun = 0.5; }
      for (const h of this.fires) { h.t += dt; h.tick = (h.tick || 0) + dt; if (h.tick > 0.4) { h.tick = 0; for (const f of this.foes) if (!f.dead && f.clipY == null && Math.abs(f.x - h.x) < 48 && Math.abs((f.z || 0) - h.z) < 0.2) f.hit(1, 'fire'); } }
      this.foams = this.foams.filter(h => h.t < h.life); this.fires = this.fires.filter(h => h.t < h.life);
      // темнота: плавно к цели, редкие вспышки света, фальшфейер
      this.flareT -= dt; let tgt = this.dark; if (tgt && Math.sin(this.t * 1.9) > 0.985) tgt = 0.25; if (this.flareT > 0) tgt = Math.min(tgt, 0.3);
      this.darkK += (tgt - this.darkK) * Math.min(1, dt * 6);
    }
    updFx(dt) { for (const f of this.fx) { f.t += dt; if (f.vx != null) { f.x += f.vx * dt; f.vy += (f.g || 0) * dt; f.y += f.vy * dt; } } this.fx = this.fx.filter(f => f.t < f.life); }
    // ---- отрисовка
    draw(c) {
      if (this.loading) { c.fillStyle = '#000'; c.fillRect(0, 0, 640, 360); G.text('ЗАГРУЗКА...', 320, 170, { align: 'center' }); return; }
      const cam = Math.round(this.cam), p = this.pl;
      c.drawImage(L8.img[this.S.bg], cam * 2, 0, 1280, 720, 0, 0, 640, 360);
      if (this.S.drawBack) this.S.drawBack(this, c, cam);
      // ложи (дальний план), люстры
      for (const f of this.foes) if (f.clipY != null) f.draw(c, cam);
      for (const o of this.props) if (o.hang) o.draw(c, cam);
      // пол: всё по глубине
      const list = [];
      for (const f of this.foes) if (f.clipY == null) list.push([f.y + (f.st === 'die' ? -30 : 0), f]);
      for (const o of this.props) if (!o.hang) list.push([o.y + (o.broken ? -20 : 0), o]);
      for (const h of this.foams) list.push([zy(h.z) + 1, { draw: (c, cam) => L8.spr(c, 'fxD8', h.t < 0.5 ? 4 : 5, h.x - cam, zy(h.z) - 22 * zs(h.z), zs(h.z) * (0.9 + Math.sin(h.t * 4) * 0.05), { a: clamp((h.life - h.t) / 1.2, 0, 0.9) }) }]);
      for (const h of this.fires) list.push([zy(h.z) + 1, { draw: (c, cam) => { L8.spr(c, 'fxD8', 3, h.x - cam, zy(h.z), zs(h.z)); L8.spr(c, 'fxD8', (h.t * 9 | 0) % 3, h.x - cam, zy(h.z) - 24 * zs(h.z), zs(h.z), { a: clamp((h.life - h.t) / 0.8, 0, 1) }); } }]);
      list.sort((a, b) => a[0] - b[0]);
      for (const g of this.grens) { const k = g.t / g.life; L8.spr(c, 'props8', PRN.shadow, g.tx - cam, g.ty + 3, 0.25 + 0.5 * k, { a: 0.35 + 0.4 * k }); }
      for (const [, o] of list) o.draw(c, cam);
      for (const k of this.picks) { if (k.t > 6 && (k.t * 10 | 0) % 2) continue; const y = zy(k.z) + k.oy; L8.spr(c, 'props8', PRN.shadow, k.x - cam, y + 2, 0.3, { a: 0.5 }); if (k.kind === 'flare') L8.spr(c, 'fxC8', 3, k.x - cam, y - 14, 0.4); else L8.spr(c, 'fx8', FXN[k.kind], k.x - cam, y - 12 + Math.sin(k.t * 5) * 1.5, 0.75); }
      for (const h of this.haz) { const k = h.t / h.life; L8.spr(c, 'props8', PRN.shadow, h.tx - cam, h.ty + 4, (0.3 + 0.5 * k) * (h.r / 26), { a: 0.3 + 0.5 * k }); if ((h.t * 10 | 0) % 2) L8.spr(c, 'fx8', FXN.warn, h.tx - cam, h.ty - 6, 0.5); if (h.sh) L8.spr(c, h.sh, h.fr, h.x - cam, h.y, h.s, { rot: h.rot != null ? h.rot : h.t * h.spin }); }
      for (const g of this.grens) L8.spr(c, 'fx8', (g.t * 12 | 0) % 2 ? FXN.gren : FXN.gren2, g.x - cam, g.y, 0.35 + g.s * 0.85, { rot: g.t * 9 });
      for (const s of this.shots) { const k = s.t / s.life, x = s.x0 + (s.tx - s.x0) * k, y = s.y0 + (s.ty - s.y0) * k; L8.spr(c, 'fx8', k > 0.7 ? FXN.ebul2 : FXN.ebul, x - cam, y, k > 0.7 ? 0.5 + k * 0.5 : 0.4 + k * 1.1); }
      for (const v of this.vogs) { const k = v.t / v.life, x = v.x0 + (v.tx - v.x0) * k, y = v.y0 + (v.ty - v.y0) * k - Math.sin(k * Math.PI) * 26; L8.spr(c, 'fx8', FXN.vog, x - cam, y, 0.75 - 0.45 * k, { rot: k * 7 }); }
      for (const f of this.fx) { const i = Math.min(f.fr.length - 1, f.t / f.life * f.fr.length | 0); L8.spr(c, f.sh, f.fr[i], f.x - cam, f.y, f.grow ? f.s + f.grow * f.t : f.s, { rot: f.rot ? f.rot + f.t * 12 : 0, a: f.fade && f.t > f.life * 0.75 ? (f.life - f.t) / (f.life * 0.25) : 1 }); }
      if (this.S.drawMid) this.S.drawMid(this, c, cam);
      // Валера
      this.drawValera(c);
      for (const t of this.tracers) { const k = 0.25 + t.t / 0.07 * 0.75, x = t.x0 + (t.x1 - t.x0) * k, y = t.y0 + (t.y1 - t.y0) * k; L8.spr(c, 'fx8', FXN.tracer, x, y, 1.1 - k * 0.6, { rot: Math.atan2(t.y1 - t.y0, t.x1 - t.x0) + Math.PI / 2 }); }
      L8.spr(c, 'fx8', p.fireAnim > 0 ? FXN.cross2 : FXN.cross, Math.round(this.cx), Math.round(this.cy), p.fireAnim > 0 ? 0.9 : 0.62);
      if (this.S.fg) for (const f of this.fgList) { const sx = f[1] - this.cam * 1.7; if (sx > -200 && sx < 840) L8.spr(c, this.S.fgSheet, f[0], sx, 384 + (f[2] || 0), f[3] || 1, { a: Math.abs(sx - p.x) < 120 ? 0.35 : 1 }); }
      if (this.S.drawFront) this.S.drawFront(this, c, cam);
      if (this.darkK > 0.02) this.drawDark(c, cam);
      this.drawHud(c);
      if (this.exitT > 1.4 && typeof this.S.next !== 'function') { c.fillStyle = `rgba(0,0,0,${clamp((this.exitT - 1.4) / 0.7, 0, 1)})`; c.fillRect(0, 0, 640, 360); }
      if (this.fadeIn > 0) { c.fillStyle = `rgba(0,0,0,${clamp(this.fadeIn / 0.6, 0, 1)})`; c.fillRect(0, 0, 640, 360); }
      Scene.drawDialog(c);
      if (this.dead) { c.fillStyle = `rgba(0,0,0,${clamp(this.dead / 1.4, 0, 0.92)})`; c.fillRect(0, 0, 640, 360); if (this.dead > 0.8) G.text('ВАЛЕРУ СЪЕЛИ', 320, 160, { align: 'center', size: 16, color: '#f55' }); }
      if (this.done) { c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 120, 640, 110); G.text('ПРОДОЛЖЕНИЕ СЛЕДУЕТ', 320, 138, { align: 'center', size: 16, color: '#ffd84a' }); G.text('СЧЁТ ' + this.score + '   УБИТО ' + this.stats.kills + '   ТОЧНОСТЬ ' + (this.stats.shots ? Math.round(this.stats.hits / this.stats.shots * 100) : 0) + '%', 320, 172, { align: 'center' }); if (this.doneT > 1.5) G.text('ОГОНЬ — ЕЩЁ РАЗ', 320, 200, { align: 'center', color: '#9cf' }); }
    }
    // темнота: чёрный слой, в котором свет (спрайты Flow) прорезает окна
    drawDark(c, cam) {
      if (!this.dk) this.dk = G.makeCanvas(640, 360);
      const [cv, x] = this.dk, p = this.pl, LN = n => D().fxC8.n.indexOf(n);
      x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, 640, 360); x.fillStyle = `rgba(3,5,12,${0.9 * this.darkK})`; x.fillRect(0, 0, 640, 360);
      x.globalCompositeOperation = 'destination-out';
      const cut = (n, sx, sy, sc, o) => { const f = D().fxC8.f[n], k = sc * 0.5; x.save(); x.translate(sx, sy); if (o && o.rot) x.rotate(o.rot); x.globalAlpha = o && o.a != null ? o.a : 1; if (o && o.cone) x.drawImage(L8.img.fxC8, f[0], f[1], f[2], f[3], -f[2] * k * 0.5, -f[3] * k * o.len, f[2] * k, f[3] * k * o.len); else x.drawImage(L8.img.fxC8, f[0], f[1], f[2], f[3], -f[2] * k * 0.5, -f[3] * k * 0.5, f[2] * k, f[3] * k); x.restore(); };
      cut(LN('pool'), p.x, 310, 2.3, { a: 0.95 });
      const m = this.muzzle(), ang = Math.atan2(this.cy - m[1], this.cx - m[0]) + Math.PI / 2, len = Math.hypot(this.cy - m[1], this.cx - m[0]);
      cut(LN('cone'), m[0], m[1], 2.6, { rot: ang, cone: 1, len: Math.max(0.5, len / 190), a: 0.95 });
      cut(LN('pool'), this.cx, this.cy, 1.5, { a: 0.9 });
      if (p.fireAnim > 0) { cut(LN('pool'), m[0], m[1], 2.6); cut(LN('pool'), this.cx, this.cy, 1.5); }
      for (const f of this.fx) if (f.sh === 'boom8') cut(LN('pool'), f.x - cam, f.y, 3.2 * f.s, { a: 1 - f.t / f.life });
      for (const h of this.fires) cut(LN('pool'), h.x - cam, zy(h.z) - 20, 2.2, { a: 0.9 });
      for (const k of this.picks) if (k.kind === 'flare') cut(LN('pool'), k.x - cam, zy(k.z) - 12, 1.1, { a: 0.8 });
      if (this.S.lamps) for (const lx of this.S.lamps) cut(LN('pool'), lx - cam, 96, 0.9, { a: 0.35 + 0.3 * Math.sin(this.t * 5 + lx) });
      c.drawImage(cv, 0, 0);
      // поверх темноты: красные аварийные лампы, глаза зомби, лучи прицелов
      const a = this.darkK;
      if (this.S.lamps) for (const lx of this.S.lamps) L8.spr(c, 'fxC8', LN('redlamp'), lx - cam, 96, 0.8, { a: a * (0.55 + 0.45 * Math.sin(this.t * 5 + lx)) });
      for (const f of this.foes) { if (f.dead || f.clipY != null) continue; const b = f.box(); if (!b[2]) continue; if (f instanceof Zombie) L8.spr(c, 'fxC8', LN('eyes'), f.x - cam, b[1] + b[3] * 0.17, f.s * 0.62, { a }); else if (f.st === 'aim' || f.st === 'open') { const mz = f.muzzle(), tx = p.x, ty = 300, an = Math.atan2(ty - mz[1], tx - (mz[0] - cam)) - Math.PI / 2, ln = Math.hypot(ty - mz[1], tx - (mz[0] - cam)), fr = D().fxC8.f[LN('laser')]; c.save(); c.translate(mz[0] - cam, mz[1]); c.rotate(an); c.globalAlpha = 0.9; c.drawImage(L8.img.fxC8, fr[0] + fr[2] * 0.35, fr[1], fr[2] * 0.3, fr[3], -3, 0, 6, ln); c.restore(); L8.spr(c, 'fxC8', LN('dot'), tx, ty, 0.5); } }
    }
    drawValera(c) {
      const p = this.pl; let fr, ox = 0, rot = 0, sheet = 'val8', flip = false; const dx = this.cx - p.x;
      if (p.st === 'roll') { fr = VAL.roll; rot = p.rollDir * p.stT / 0.34 * Math.PI * 2; }
      else if (p.st === 'butt') fr = VAL.butt; else if (p.st === 'hurt') fr = VAL.hurt; else if (p.st === 'reload') fr = VAL.reload;
      else {
        const L = dx < -30; fr = L ? VAL.aimL : this.cy < 150 ? VAL.aimC : VAL.aimR;
        if (p.fireAnim > 0) { if (L) ox = rnd(-1.5, 1.5); else fr = VAL.fire; }
        else if (p.moving && !G.Input.held('punch') && !L8.mouse.down) { sheet = 'valS8'; fr = (p.stepT * 10 | 0) % 4; flip = dx > 0; }
      }
      if (this.dead) fr = VAL.hurt;
      if (p.inv > 0 && p.st !== 'roll' && (this.t * 20 | 0) % 2) return;
      L8.spr(c, 'props8', PRN.shadow, p.x, 357, 1.25, { a: 0.6 });
      if (rot) { const f = D().val8.f[fr]; c.save(); c.translate(p.x, 364 - f[3] * 0.25); c.rotate(rot); L8.spr(c, 'val8', fr, 0, f[3] * 0.25, 1); c.restore(); }
      else L8.spr(c, sheet, fr, p.x + ox, 364 + (p.fireAnim > 0 ? 1 : 0), 1, { flip });
      if (p.fireAnim > 0.04 && p.st === 'idle') { const m = this.muzzle(); L8.spr(c, 'fx8', (this.t * 30 | 0) % 2 ? FXN.flash : FXN.flash2, m[0], m[1], 0.55, { rot: rnd(0, 6) }); }
    }
    drawHud(c) {      // интерфейс — единственное, что рисуется кодом
      const p = this.pl; if (this.cutImg) return;
      if (this.bars) this.bars.forEach((b, i, a) => { const w = a.length > 1 ? 150 : 240, x0 = 320 - (a.length * (w + 8) - 8) / 2 + i * (w + 8); c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x0, 6, w, 16); c.fillStyle = '#501'; c.fillRect(x0 + 3, 9, w - 6, 10); c.fillStyle = b.inv ? '#3bd' : '#e33'; c.fillRect(x0 + 3, 9, (w - 6) * clamp(b.hp / b.max, 0, 1), 10); if (b.half != null) { c.fillStyle = '#fff'; c.fillRect(x0 + 3 + (w - 6) * b.half / b.max, 8, 1, 12); } G.text(b.name, x0 + w / 2, 10, { align: 'center', size: 8 }); });
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(6, 6, 148, 16); c.fillStyle = '#400'; c.fillRect(9, 9, 142, 10);
      c.fillStyle = p.hp > 35 ? '#3c3' : '#e33'; c.fillRect(9, 9, 142 * p.hp / 100, 10);
      G.text('ВАЛЕРА', 12, 10, { size: 8 });
      if (p.vest > 0) for (let i = 0; i < p.vest; i++) L8.spr(c, 'fx8', FXN.vest, 166 + i * 14, 14, 0.28);
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(574, 6, 60, 16); G.text(String(this.score).padStart(6, '0'), 630, 10, { align: 'right', size: 8, color: '#ffd84a' });
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(6, 25, 148, 20);
      L8.spr(c, 'fx8', FXN.mag, 18, 35, 0.34); G.text(p.st === 'reload' ? '--' : String(p.ammo).padStart(2, '0'), 30, 31, { size: 8, color: p.ammo <= 6 ? '#f66' : '#fff' }); G.text('/' + p.res, 48, 31, { size: 8, color: '#aaa' });
      L8.spr(c, 'fx8', FXN.vog, 104, 35, 0.34); G.text('x' + p.vog, 118, 31, { size: 8 });
      if (this.boss && !this.boss.gone) { const b = this.boss; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(220, 6, 200, 16); c.fillStyle = '#501'; c.fillRect(223, 9, 194, 10); c.fillStyle = '#e33'; c.fillRect(223, 9, 194 * clamp(b.hp / b.max, 0, 1), 10); G.text(b.name, 320, 10, { align: 'center', size: 8 }); }
      if (this.left && !this.done) { G.text('ДОБЕЙ ВРАГОВ: ' + this.left, 320, 62, { align: 'center', size: 8, color: (this.t * 3 | 0) % 2 ? '#ff6a4a' : '#ffd84a', outline: true });
        if (this.endT > 6 && (this.t * 4 | 0) % 2) for (const f of this.foes) if (!f.dead) { const b = f.box(); L8.spr(c, 'fx8', FXN.warn, clamp(f.x - this.cam, 12, 628), Math.max(12, (b[3] > 0 ? b[1] : f.y - 60) - 10), 0.4); } }
      if (this.msgT > 0) G.text(this.msg, 320, this.bars ? 48 : 40, { align: 'center', size: 8, color: '#ffd84a', outline: true });
      if (p.ammo <= 0 && p.res <= 0) G.text('ПАТРОНЫ КОНЧИЛИСЬ!', 320, 320, { align: 'center', size: 8, color: '#f66', outline: true });
    }
  };

  L8.K = { Zombie, Rifle, Grenadier, Trooper, Shield, PDEF, Prop, Foe, zy, zs, rnd, clamp, FXN, PRN, fsize, VAL, HORIZ, NEAR };
  L8.STAGES = {}; L8.FIRST = 'hall';
})();

function startLevel8(opts = {}) {
  if (G.portraits && G.portraits.valera6) G.portraits.valera = G.portraits.valera6;
  App.level = new L8.Level();
  setState('play');
  App.paused = false;
  App.level.start(opts);
}
