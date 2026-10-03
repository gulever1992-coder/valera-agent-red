'use strict';
// ============ УРОВЕНЬ 5: машины (разные типы, милиция разных видов), прохожие и собаки из уровня 2 ============
// sh/fr — лист и кадры (список — мигалка), alt — запасной спрайт, пока не нарисован лист: [лист, кадр, масштаб X, масштаб Y, оттенок]
L5.CARDEF = {
  player: { sh: 'l5cars', fr: [0], L: 66, Wd: 30, max: 300, acc: 330, grip: 8, turn: 2.7, hp: 100, m: 1 },
  matiz: { sh: 'l5cars', fr: [4], L: 54, Wd: 28, max: 296, acc: 340, grip: 8, turn: 2.9, hp: 90, m: 0.7 },
  // милиция — разных видов
  patrol: { sh: 'l5cars', fr: [2, 3], L: 66, Wd: 30, max: 282, acc: 300, grip: 7, turn: 2.5, hp: 55, m: 1, cop: 1, siren: 1, score: 500, name: 'ПАТРУЛЬ' },
  interceptor: { sh: 'l5cars2', fr: [6], alt: ['l5cars', 2, 1.0, 0.95, 'rgba(10,10,40,0.5)'], L: 70, Wd: 30, max: 322, acc: 370, grip: 8, turn: 2.8, hp: 48, m: 1, cop: 1, siren: 1, score: 600, name: 'ПЕРЕХВАТЧИК', ram: 1 },
  moto: { sh: 'l5cars2', fr: [8], alt: ['l5cars', 2, 0.62, 0.42, null], L: 40, Wd: 16, max: 345, acc: 430, grip: 11, turn: 3.6, hp: 22, m: 0.35, cop: 1, score: 300, name: 'МОТОЦИКЛ' },
  riot: { sh: 'l5cars2', fr: [7], alt: ['l5cars', 7, 1.2, 1.25, 'rgba(20,70,110,0.5)'], L: 92, Wd: 40, max: 250, acc: 260, grip: 6, turn: 1.9, hp: 260, m: 2.6, cop: 1, siren: 1, score: 2000, name: 'ОМОН-УАЗ', boss: 1, turret: 1 },
  copbus: { sh: 'l5zak', fr: [0], alt: ['l5cars', 7, 2.0, 1.4, 'rgba(30,50,160,0.55)'], L: 118, Wd: 40, max: 215, acc: 200, grip: 5.5, turn: 1.5, hp: 200, m: 3.2, cop: 1, siren: 1, score: 2500, name: 'АВТОЗАК', boss: 1 },
  // гражданские
  civ5: { sh: 'l5cars', fr: [5], L: 66, Wd: 30, max: 150, acc: 160, grip: 7, turn: 2.2, hp: 36, m: 1 },
  civ6: { sh: 'l5cars', fr: [6], L: 62, Wd: 28, max: 160, acc: 170, grip: 7, turn: 2.3, hp: 32, m: 0.9 },
  civ7: { sh: 'l5cars', fr: [7], L: 76, Wd: 33, max: 130, acc: 140, grip: 6, turn: 1.9, hp: 46, m: 1.4 },
  civ8: { sh: 'l5cars', fr: [8], L: 66, Wd: 30, max: 170, acc: 180, grip: 7, turn: 2.3, hp: 34, m: 1 },
  bus: { sh: 'l5cars2', fr: [0], alt: ['l5cars', 7, 2.0, 1.35, 'rgba(200,160,20,0.5)'], L: 118, Wd: 40, max: 120, acc: 110, grip: 6, turn: 1.5, hp: 120, m: 3 },
  minibus: { sh: 'l5cars2', fr: [10], alt: ['l5cars', 7, 0.95, 1.0, 'rgba(240,240,240,0.2)'], L: 76, Wd: 32, max: 165, acc: 170, grip: 6.5, turn: 2, hp: 50, m: 1.3 },
  moskvich: { sh: 'l5cars2', fr: [11], alt: ['l5cars', 5, 0.95, 1.0, 'rgba(210,190,150,0.45)'], L: 66, Wd: 30, max: 150, acc: 160, grip: 7, turn: 2.2, hp: 34, m: 1 },
  dump: { sh: 'l5cars2', fr: [2], alt: ['l5cars', 7, 1.3, 1.1, 'rgba(30,60,150,0.5)'], L: 96, Wd: 38, max: 110, acc: 100, grip: 6, turn: 1.6, hp: 90, m: 2.4 },
  ambulance: { sh: 'l5cars2', fr: [3], alt: ['l5cars', 7, 1.0, 1.0, 'rgba(255,255,255,0.35)'], L: 76, Wd: 32, max: 230, acc: 240, grip: 7, turn: 2.2, hp: 60, m: 1.5, siren: 1, fast: 1 },
  firetruck: { sh: 'l5cars2', fr: [4], alt: ['l5cars', 7, 1.4, 1.15, 'rgba(210,30,20,0.55)'], L: 104, Wd: 38, max: 200, acc: 190, grip: 6, turn: 1.7, hp: 110, m: 2.6, siren: 1, fast: 1 },
  garbage: { sh: 'l5cars2', fr: [5], alt: ['l5cars', 7, 1.2, 1.1, 'rgba(230,120,20,0.5)'], L: 92, Wd: 38, max: 100, acc: 100, grip: 6, turn: 1.6, hp: 90, m: 2.3 },
  tram: { sh: 'l5cars2', fr: [1], L: 150, Wd: 40, max: 95, acc: 80, grip: 9, turn: 0.9, hp: 220, m: 5 },
  tow: { sh: 'l5cars3', fr: [3], L: 90, Wd: 36, max: 180, acc: 180, grip: 6.5, turn: 1.9, hp: 70, m: 1.8 },
  limo: { sh: 'l5cars3', fr: [5], L: 96, Wd: 32, max: 190, acc: 190, grip: 7, turn: 1.8, hp: 60, m: 1.6 },
  mixer: { sh: 'l5cars3', fr: [7], L: 92, Wd: 38, max: 105, acc: 100, grip: 6, turn: 1.6, hp: 100, m: 2.5 },
  crane: { sh: 'l5cars3', fr: [9], L: 104, Wd: 38, max: 95, acc: 90, grip: 6, turn: 1.5, hp: 110, m: 2.8 },
  paz: { sh: 'l5cars3', fr: [10], L: 84, Wd: 34, max: 150, acc: 150, grip: 6.5, turn: 1.9, hp: 60, m: 1.6 },
  icecream: { sh: 'l5cars3', fr: [11], L: 76, Wd: 32, max: 140, acc: 140, grip: 6.5, turn: 2, hp: 44, m: 1.2 },
  tractor: { sh: 'l5cars2', fr: [9], alt: ['l5cars', 6, 1.25, 1.0, 'rgba(160,40,20,0.5)'], L: 100, Wd: 34, max: 70, acc: 90, grip: 6, turn: 1.6, hp: 80, m: 2 },
};
L5.CIV_TYPES = ['civ5', 'civ6', 'civ7', 'civ8', 'civ6', 'civ5', 'bus', 'minibus', 'moskvich', 'dump', 'garbage', 'tractor', 'ambulance', 'firetruck', 'moskvich', 'minibus', 'tram', 'tow', 'limo', 'mixer', 'crane', 'paz', 'icecream', 'limo', 'paz'];
L5.civTypes = () => L5.CIV_TYPES.filter(k => L5.has(L5.CARDEF[k].sh));
L5.Car = class {
  constructor(kind, x, y, ang) {
    this.kind = kind; this.d = L5.CARDEF[kind]; this.x = x; this.y = y; this.ang = ang; this.vx = 0; this.vy = 0;
    this.hp = this.d.hp; this.maxhp = this.d.hp; this.L = this.d.L; this.Wd = this.d.Wd; this.fixSize();
    this.thr = 0; this.brk = 0; this.str = 0; this.hand = 0; this.t = Math.random() * 6; this.flash = 0; this.dead = false; this.s = 0;
    this.stuck = 0; this.rev = 0; this.skid = 0; this.wild = 0; this.cool = 0; this.maxMul = 1; this.air = 0; this.airT = 0; this.nitro = 0; this.invul = 0;
    this.cop = !!this.d.cop; this.flatT = 0; this.shoot = 0; this.slip = 0; this.pitch = 0; this.honk = 0;
  }
  get speed() { return Math.hypot(this.vx, this.vy); }
  get fwd() { return this.vx * Math.cos(this.ang) + this.vy * Math.sin(this.ang); }
  circles() {
    const c = Math.cos(this.ang), s = Math.sin(this.ang), r = this.Wd * 0.55 + 1, n = Math.max(3, Math.round(this.L / (this.Wd * 0.85))), out = [];
    const span = this.L / 2 - r;
    for (let i = 0; i < n; i++) { const k = n === 1 ? 0 : (-span + span * 2 * i / (n - 1)); out.push({ x: this.x + c * k, y: this.y + s * k, r }); }
    return out;
  }
  physics(dt) {
    const d = this.d, fx = Math.cos(this.ang), fy = Math.sin(this.ang), rx = -fy, ry = fx;
    let vf = this.vx * fx + this.vy * fy, vl = this.vx * rx + this.vy * ry;
    this.slip = vl;
    const sf = this.air > 0 ? 'road' : L5.surface(this.x, this.y), nit = this.nitro > 0 ? 1.4 : 1, mul = (sf === 'road' ? 1 : sf === 'walk' ? 0.9 : 0.62) * this.maxMul * nit * (this.flatT > 0 ? 0.55 : 1), max = d.max * mul;
    if (this.air <= 0) {
      if (this.thr > 0) vf += this.thr * d.acc * (this.nitro > 0 ? 2.2 : 1) * Math.max(0.08, 1 - Math.max(0, vf) / max) * dt;
      if (this.brk > 0) { if (vf > 8) vf -= this.brk * 520 * dt; else vf -= this.brk * 150 * dt; }
      if (vf < -120) vf = -120;
      if (this.traffic && vf < 0) vf = 0; // гражданский трафик никогда не едет задним ходом
      vf -= vf * 0.35 * dt;
      if (vf > max) vf -= (vf - max) * 2.5 * dt;
      const gr = this.hand ? 1.6 : d.grip + (sf === 'grass' ? -3 : 0) - (this.flatT > 0 ? 3 : 0);
      if (this.flatT > 0) this.ang += Math.sin(this.t * 11) * 0.5 * dt * U.clamp(vf / 150, 0, 1);
      if (Math.abs(vl) > 90 && this.hand) this.skid = 1;
      vl *= Math.exp(-gr * dt);
      const turn = this.str * d.turn * U.clamp(vf / 110, -1, 1) / (1 + Math.abs(vf) / 480) * (this.hand ? 1.45 : 1);
      this.ang += turn * dt;
    } else { this.airT += dt; this.air -= dt; if (this.air <= 0) this.landed = true; }
    const fx2 = Math.cos(this.ang), fy2 = Math.sin(this.ang);
    this.vx = fx2 * vf + -fy2 * vl; this.vy = fy2 * vf + fx2 * vl;
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.skid > 0) this.skid -= dt * 3;
    if (this.nitro > 0) this.nitro -= dt;
    if (this.honk > 0) this.honk -= dt;
    this.pitch += (U.clamp((this.thr - this.brk) * 1.4, -1, 1) - this.pitch) * Math.min(1, dt * 6);
  }
  damage(n, src) {
    if (this.dead || this.invul > 0) return;
    this.hp -= n; this.flash = 0.12; if (this === L5.level.pl && n >= 6) this.invul = 0.35;
    if (this.hp <= 0) L5.level.explode(this, src);
  }
  fixSize() {
    const d = this.d, sh = L5.has(d.sh) ? d.sh : (d.alt ? d.alt[0] : 'l5cars'), fr = L5.has(d.sh) ? d.fr[0] : (d.alt ? d.alt[1] : 0), f = Spr.frame(sh, fr);
    if (!f) return;
    const fw = f[2] / 2, fh = f[3] / 2;
    this.sk = this.L / fw; this.Wd = Math.max(14, Math.min(this.Wd, fh * this.sk * 0.92)); if (fh * this.sk * 0.8 > this.Wd) this.Wd = fh * this.sk * 0.8;
  }
  sprite() {
    const d = this.d;
    if (L5.has(d.sh)) return [d.sh, d.fr.length > 1 ? d.fr[Math.floor(this.t * 6) % d.fr.length] : d.fr[0], this.sk || 1, this.sk || 1, null];
    if (d.alt) return d.alt;
    return ['l5cars', d.fr[Math.floor(this.t * 6) % d.fr.length] || 0, 1, 1, null];
  }
  draw(c) {
    const [sh, fr, sx, sy, tint] = this.sprite();
    const zA = this.air > 0 ? Math.sin(Math.PI * Math.min(1, this.airT / (this.airT + this.air))) * 28 : 0;
    const bob = Math.sin(this.t * (6 + this.speed * 0.05)) * Math.min(0.9, this.speed / 220) + this.pitch * 0.8;
    const roll = U.clamp(this.slip * 0.03, -3, 3);
    // тень на земле
    if (L5.R.SH) L5.R.SH(1, this.x + 3, this.y + 5, this.L * 1.18, this.Wd * 1.3, Math.max(0.2, 0.62 - zA * 0.012), this.ang);

    c.save(); c.translate(this.x - Math.sin(this.ang) * roll, this.y + Math.cos(this.ang) * roll - zA - bob); c.rotate(this.ang);
    const sc = 1 + zA / 90 + this.pitch * 0.01; c.scale(sc * sx, sc * sy);
    Spr.drawC(c, sh, fr, 0, 0, 0, 1);
    c.restore();
    // дым из повреждённых, огонь, выхлоп
    if (this.hp < this.maxhp * 0.45 && Math.random() < 0.5) FX.spawn({ x: this.x + Math.cos(this.ang) * this.L * 0.3, y: this.y + Math.sin(this.ang) * this.L * 0.3, vx: U.rand(-10, 10), vy: U.rand(-30, -10), life: 0.8, size: 5, grav: -20, color: this.hp < this.maxhp * 0.22 ? '#222' : '#777', type: 'puff' });
    if (this.thr > 0.5 && this.speed > 60 && Math.random() < 0.3 && !this.d.fast) FX.spawn({ x: this.x - Math.cos(this.ang) * this.L * 0.52, y: this.y - Math.sin(this.ang) * this.L * 0.52, vx: -this.vx * 0.1 + U.rand(-8, 8), vy: -this.vy * 0.1 + U.rand(-14, -4), life: 0.5, size: 2.5, grav: -10, color: '#b0aca4', type: 'puff' });
    if (this.nitro > 0) for (let i = 0; i < 2; i++) FX.spawn({ x: this.x - Math.cos(this.ang) * this.L * 0.55, y: this.y - Math.sin(this.ang) * this.L * 0.55, vx: -Math.cos(this.ang) * 160 + U.rand(-20, 20), vy: -Math.sin(this.ang) * 160 + U.rand(-20, 20), life: 0.25, size: 3, grav: 0, color: U.choice(['#ffe050', '#ff8a2a', '#60b0ff']) });
    if (this.skid > 0.3 && this.speed > 70 && Math.random() < 0.6) FX.spawn({ x: this.x - Math.cos(this.ang) * 14, y: this.y - Math.sin(this.ang) * 14, vx: U.rand(-12, 12), vy: U.rand(-24, -6), life: 0.7, size: 4, grav: -12, color: '#cfcac0', type: 'puff' });
  }
};

// =====================================================================
// ПРОХОЖИЕ ИЗ УРОВНЯ 2, СОБАКИ, РАБОЧИЕ: разные анимации и реакции
// =====================================================================
L5.drawFolk = function (c, p, t) {
  if (p.gone) return;
  let sheet, fr, sc, rot = 0, lift = 0, sq = 1, face = p.face || 1, bob = 0;
  if (p.kind === 'worker') {
    const w = p.work || p.workSave || L5.WORK[0]; sheet = w[0]; sc = 0.5; const arr = w[1]; fr = arr[w[2] > 0 ? Math.floor(t * w[2]) % arr.length : 0];
    if (p.hit > 0) { rot = Math.PI / 2 * face; lift = 0; }
  } else if (p.kind === 'dog') {
    const d = L5.DOGS[p.type]; sheet = d.sheet; sc = d.sc;
    if (p.state === 'chase' || p.state === 'flee') { fr = d.walk[Math.floor(t * 12 + p.ph) % 2]; bob = Math.abs(Math.sin(t * 12 + p.ph)) * 2.2; }
    else if (p.state === 'bark') { fr = d.idle; bob = Math.abs(Math.sin(t * 16 + p.ph)) * 2.5; }
    else if (p.state === 'walk') fr = d.walk[Math.floor(t * 6 + p.ph) % 2]; else fr = d.idle;
    if (p.hit > 0) { rot = Math.PI; lift = 4; }
  } else {
    const f = L5.FOLK[p.type]; sheet = f.sheet; sc = f.sc;
    if (p.hit > 0) { fr = f.hit; rot = Math.min(1.5, (2 - p.hit) * 2.2) * face * 0.9 + Math.sin(t * 22) * 0.04; lift = Math.sin(Math.min(1, (2 - p.hit)) * Math.PI) * 14; }
    else if (p.state === 'dodge') { const w4 = f.ws && L5.has(f.ws); if (w4) sheet = f.ws; const W = w4 ? f.wk4 : f.walk; fr = W[Math.floor(t * 12) % W.length]; lift = Math.abs(Math.sin(t * 14)) * 9; sq = 0.92; }
    else if (p.state === 'walk' || p.state === 'stroll' || p.state === 'cross' || p.state === 'flee') {
      const w4 = f.ws && L5.has(f.ws); if (w4) sheet = f.ws; const W = w4 ? f.wk4 : f.walk;
      fr = W[Math.floor(t * (p.state === 'flee' ? 12 : 7) + p.ph) % W.length]; bob = Math.abs(Math.sin(t * (p.state === 'flee' ? 11 : 5.5) + p.ph)) * (f.hop ? 4 : 1.6);
      if (f.sway) rot = Math.sin(t * 3 + p.ph) * 0.12;
    } else { fr = f.idle; if (f.sway) rot = Math.sin(t * 2 + p.ph) * 0.1; if (p.state === 'talk') bob = Math.abs(Math.sin(t * 9)) * 1.2; }
  }
  // тень и сам спрайт, стоящий на земле
  if (L5.R.SH) L5.R.SH(0, p.x + 2, p.y + 2, 18 * sc * 2, 9, 0.55);
  Spr.draw(c, sheet, fr, p.x, p.y - lift - bob + (rot ? -6 : 0), face, { scale: sc * sq, rot, flash: p.flash > 0 ? '#ffffff' : null });
};
