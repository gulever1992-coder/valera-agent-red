'use strict';
// ============ УРОВЕНЬ 5: игровая часть — управление, ИИ, милиция разных видов, столкновения, события ============
const L5R = { lines: ['Подвинься, колхоз!', 'Я трезвый как стёклышко!', 'Би-би, ёлы-палы!', 'Пыль глотай, рыжий!', 'Сейчас обгоню — не заметишь!'], vova: ['Минус один!', 'Горит как свечка!', 'Осеменил!', 'Ещё хочешь?!', 'Ментов — не жалко!'] };

L5.Level = class {
  constructor() {
    this.id = 5; this.stats = { time: 0, dmg: 0, kills: 0, deflect: 0, secrets: 0, food: 0, deaths: 0 }; this.score = 0;
    this.mode = null; this.cam = { x: 0, y: 0 }; this.zoom = 1; this.smashed = false; this.cp = L5.S_START; this.titleT = 0; this.titleText = '';
    this.cars = []; this.wrecks = []; this.bullets = []; this.ebullets = []; this.clouds = []; this.pick = []; this.decals = []; this.skids = []; this.delayed = []; this.ramps = [];
    this.aim = 0; this.ammo = 120; this.fireT = 0; this.shotN = 0; this.nameIdx = -1; this.t = 0; this.race = null; this.gasCd = 0;
    this.bossesDone = {}; this.rbDone = {};
    L5.level = this;
  }
  start(opts = {}) {
    L5.buildWorld();
    this.smashed = true;
    if (opts.end) { this.playScene(L5.sceneEnd(this), () => G.onLevelComplete(this)); return; }
    if (opts.race) { this.beginDrive(L5.S_MATCH - 200); this.bossesDone = { riot: 1, copbus: 1 }; return; }
    if (opts.drive) { this.beginDrive(L5.S_START); return; }
    this.smashed = false;
    this.beginDrive(L5.S_START, { silent: true });
    this.playScene(L5.sceneIntro(this), () => { this.smashed = true; this.beginDrive(L5.S_START); });
  }
  playScene(gen, next) { this.mode = 'scene'; Scene.run(gen, next); }
  get canPause() { return this.mode === 'drive' || this.mode === 'race' || this.mode === 'count'; }

  // ---------- старт заезда ----------
  beginDrive(s, o = {}) {
    const wd = L5.buildWorld();
    this.cars = []; this.trains = []; this.heli = null; this.heliDone = {}; this.wrecks = []; this.bullets = []; this.ebullets = []; this.clouds = []; this.pick = []; this.decals = []; this.skids = []; this.delayed = []; this.ramps = []; L5.fxs.length = 0; FX.list = []; G.bubbles = [];
    this.race = null; this.spawned = 0; this.matiz = null; this.copTimer = 2; this.trafTimer = 0; this.crossT = 0; this.dead = false; this.fade = 0; this.raceStarted = false; this.matchStarted = false; this.loseRace = false; this.warnT = 0;
    const p = L5.at(s, { lane: 26 });
    const pl = this.pl = new L5.Car('player', p.x, p.y, p.ang);
    pl.vx = p.dx * 120; pl.vy = p.dy * 120; pl.s = s; this.cars.push(pl);
    this.ammo = Math.max(this.ammo, 120); this.aim = p.ang + Math.PI; this.gasCd = 0;
    this.cam.x = pl.x; this.cam.y = pl.y; this.zoom = 0.8;
    for (const o2 of wd.cars) o2.dyn = null;
    const PK = ['ammo', 'wrench', 'ammo', 'wrench', 'nitro', 'wrench'];
    for (let q = s + 450, i = 0; q < L5.LEN - 400; q += 520, i++) {
      const a = L5.at(q, { lane: (i % 3 - 1) * 28 });
      this.pick.push({ x: a.x, y: a.y, kind: PK[i % 6], t: Math.random() * 6 });
    }
    this.nameIdx = -1;
    if (!o.silent) { this.mode = 'drive'; Music.play('chase'); this.hint = 7; }
    for (let i = 0; i < 2 && !o.silent && s < L5.S_MATCH - 700; i++) this.spawnCop('patrol', true);
    if (!o.silent && s > L5.S_MATCH - 300) this.spawned = 99;
    this.fillTraffic(true);
  }

  // ---------- создание машин ----------
  carFree(a, r = 120) { return !this.cars.some(c => Math.hypot(c.x - a.x, c.y - a.y) < r); }
  spawnCop(type, behind, forceS) {
    const pl = this.pl, big = L5.CARDEF[type].L > 100, ahead = !behind && Math.random() < (this.mode === 'race' ? 0.45 : 0.3);
    const ds = forceS != null ? forceS : ahead ? U.rand(900, 1300) : -U.rand(420 + (big ? 120 : 0), 700);
    const s = U.clamp(pl.s + ds, 0, L5.LEN), lane = ahead ? -26 : U.rand(-20, 30), a = L5.at(s, { lane });
    if (!this.carFree(a, 90)) return null;
    const c = new L5.Car(type, a.x, a.y, ahead ? a.ang + Math.PI : a.ang);
    c.vx = Math.cos(c.ang) * 200; c.vy = Math.sin(c.ang) * 200; c.s = s; c.shooter = type !== 'interceptor' && !L5.CARDEF[type].boss; c.shoot = U.rand(0.8, 2); c.sideSign = Math.random() < 0.5 ? 1 : -1;
    this.cars.push(c); this.spawned++; return c;
  }
  copPool() {
    const pl = this.pl;
    if (this.mode === 'race' || this.mode === 'count') {
      const f = U.clamp((pl.s - L5.S_RACE) / (L5.S_END - L5.S_RACE), 0, 1);
      if (f < 0.3) return [['patrol', 4], ['moto', 2], ['interceptor', 1]];
      if (f < 0.6) return [['patrol', 2], ['interceptor', 3], ['moto', 1], ['riot', 1]];
      return [['interceptor', 2], ['riot', 2], ['copbus', 2], ['patrol', 1]];
    }
    const s = pl.s;
    if (s < 2800) return [['patrol', 5], ['moto', 1]];
    if (s < 5200) return [['patrol', 4], ['interceptor', 2], ['moto', 2]];
    if (s < 7400) return [['patrol', 3], ['interceptor', 3], ['moto', 2], ['riot', 0.7]];
    return [['patrol', 3], ['interceptor', 3], ['riot', 1], ['copbus', 0.8], ['moto', 1]];
  }
  wantCops() {
    const pl = this.pl;
    if (this.mode === 'race' || this.mode === 'count') return Math.min(4, 1 + Math.floor(U.clamp((pl.s - L5.S_RACE) / (L5.S_END - L5.S_RACE), 0, 1) * 4.2));
    return Math.min(4, 1 + Math.floor(pl.s / 2300));
  }
  fillTraffic(initial) {
    const pl = this.pl, want = this.mode === 'race' || this.mode === 'count' ? 11 : 9;
    let n = this.cars.filter(c => c.traffic).length;
    for (let tries = 0; n < want && tries < 8; tries++) {
      const s = pl.s + (initial ? U.rand(500, 2400) : U.rand(1000, 1700));
      if (s > L5.LEN - 300) continue;
      const fwd = Math.random() < 0.6, a = L5.at(s, { lane: fwd ? 32 : -32 }), kind = U.choice(L5.civTypes());
      if (!this.carFree(a, 150)) continue;
      const c = new L5.Car(kind, a.x, a.y, fwd ? a.ang : a.ang + Math.PI); c.traffic = true; c.dirSign = fwd ? 1 : -1; c.s = s; c.cruise = (fwd ? 105 : 125) * (c.d.fast ? 1.8 : 1) * (c.d.max < 130 ? 0.7 : 1) + U.rand(0, 40);
      c.vx = Math.cos(c.ang) * c.cruise; c.vy = Math.sin(c.ang) * c.cruise; this.cars.push(c); n++;
    }
  }
  spawnMatiz() {
    const pl = this.pl, s = Math.max(0, pl.s - 520), a = L5.at(s, { lane: -30 });
    const m = this.matiz = new L5.Car('matiz', a.x, a.y, a.ang); m.invul = 1e9; m.s = s; m.isMatiz = true; m.lane = -30; m.maxMul = 1.3;
    m.vx = a.dx * 300; m.vy = a.dy * 300; this.cars.push(m); Sound.play('honk'); m.headH = 24;
    G.say(m, 'Эй, посоны!', 2, { sound: false });
  }
  spawnRoadblock(s) { // две милицейские машины поперёк дороги + конусы и трамплин перед лазейкой
    const gap = Math.floor(Math.random() * 3) - 1;
    for (let i = -1; i <= 1; i++) {
      if (i === gap) continue;
      const a = L5.at(s, { lane: i * 38 }), c = new L5.Car('patrol', a.x, a.y, a.ang + Math.PI / 2 + (i * 0.25)); c.parkedCop = true; c.brk = 1; c.s = s; this.cars.push(c);
    }
    for (let i = -2; i <= 2; i++) { const a = L5.at(s - 70, { lane: i * 26 }); const q = { kind: 'cone', x: a.x, y: a.y, w: 26, vx: 0, vy: 0, rot: 0, hit: 0, by: a.y }; L5.world.cones.push(q); L5.world.objs.add(q, q.x - 14, q.y - 14, q.x + 14, q.y + 14); }
    this.signs = this.signs || [];
    // щитовые стрелки стоят на обочине (не на асфальте): указывают на свободный проезд
    const nb = L5.at(s, { lane: 0 });
    
  }
  spawnCross(j) { // машина выезжает со второстепенной улицы и вливается в поток
    const kind = U.choice(L5.civTypes()), px = j.end[0], py = j.end[1], ang = Math.atan2(j.y - py, j.x - px);
    if (!this.carFree({ x: px, y: py }, 120)) return;
    const c = new L5.Car(kind, px, py, ang);
    c.traffic = true; c.cross = { tx: j.x, ty: j.y }; c.cruise = 150; c.s = j.s; c.vx = Math.cos(ang) * 150; c.vy = Math.sin(ang) * 150; c.dirSign = Math.random() < 0.5 ? 1 : -1; this.cars.push(c);
  }

  // ---------- ввод и ИИ ----------
  control(dt) {
    const I = G.Input, pl = this.pl;
    pl.thr = I.held('up') ? 1 : 0; pl.brk = I.held('down') ? 1 : 0;
    pl.str = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0); pl.hand = I.held('jump') ? 1 : 0;
    if (I.pressed('switch')) { Sound.play('honk'); pl.honk = 0.4; for (const c of this.cars) if (c.traffic && !c.parked && Math.hypot(c.x - pl.x, c.y - pl.y) < 260) { c.cruise = (c.cruise || 120) * 1.15; c.wild = 0; } for (const p of L5.world.folk) if (Math.hypot(p.x - pl.x, p.y - pl.y) < 200 && p.kind === 'folk') this.folkDodge(p, pl); }
    if (I.pressed('throw') && this.gasCd <= 0 && (this.mode === 'drive' || this.mode === 'race')) this.throwGas();
  }
  throwGas() {
    const pl = this.pl; this.gasCd = 7;
    const cl = { x: pl.x - Math.cos(pl.ang) * 90, y: pl.y - Math.sin(pl.ang) * 90, t: 0, life: 4.6, r: 82 };
    this.clouds.push(cl); Sound.play('steam'); G.say(this.pl, 'Газовая! Ловите!', 1.5, { sound: false });
    FX.burst(cl.x, cl.y, 14, { colors: ['#9cff40', '#58d020', '#d8ff70'], speed: 120, life: 0.8, grav: 0 });
  }
  blocked(x, y) {
    const wd = L5.world; let hit = false;
    wd.solids.query(x - 2, y - 2, x + 2, y + 2, b => { if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) hit = true; });
    if (!hit) wd.circs.query(x - 20, y - 20, x + 20, y + 20, c => { if (Math.hypot(c.x - x, c.y - y) < c.r + 12) hit = true; });
    return hit;
  }
  copAI(c, dt) {
    const pl = this.pl;
    if (c.parkedCop) { c.thr = 0; c.brk = 1; if (Math.hypot(c.x - pl.x, c.y - pl.y) < 300 || c.hp < c.maxhp) { c.parkedCop = false; c.brk = 0; G.say(c, 'Стоять!', 1.4, { sound: false }); } return; }
    let tx = pl.x + pl.vx * 0.3, ty = pl.y + pl.vy * 0.3;
    const dist0 = Math.hypot(tx - c.x, ty - c.y);
    if (c.kind === 'moto') { const wv = Math.sin(c.t * 2.4) * 55; tx += -Math.sin(pl.ang) * wv; ty += Math.cos(pl.ang) * wv; }
    else if (c.kind === 'interceptor' && dist0 > 100) { tx += -Math.sin(pl.ang) * 40 * c.sideSign; ty += Math.cos(pl.ang) * 40 * c.sideSign; }
    const dx = tx - c.x, dy = ty - c.y, dist = Math.hypot(dx, dy), da = aDiff(Math.atan2(dy, dx), c.ang);
    c.str = U.clamp(da * 2.2, -1, 1); c.brk = 0;
    c.thr = (Math.abs(da) > 1.7 && c.speed > 110) ? 0 : 1;
    if (Math.abs(da) > 2.0 && c.speed > 150) c.brk = 1;
    const ca = Math.cos(c.ang), sa = Math.sin(c.ang);
    if (this.blocked(c.x + ca * 85, c.y + sa * 85)) {
      const l = this.blocked(c.x + Math.cos(c.ang - 0.8) * 80, c.y + Math.sin(c.ang - 0.8) * 80), r = this.blocked(c.x + Math.cos(c.ang + 0.8) * 80, c.y + Math.sin(c.ang + 0.8) * 80);
      c.str = l && !r ? 1 : r && !l ? -1 : (Math.random() < 0.5 ? 1 : -1); c.thr = 0.55;
    }
    if (c.speed < 28 && dist > 55) c.stuck += dt; else c.stuck = Math.max(0, c.stuck - dt);
    if (c.stuck > 0.7) { c.rev = 0.9; c.stuck = 0; c.revDir = Math.random() < 0.5 ? 1 : -1; }
    if (c.rev > 0) { c.rev -= dt; c.thr = 0; c.brk = 1; c.str = c.revDir; }
    c.shoot -= dt;
    if ((c.shooter || c.d.turret) && c.shoot <= 0 && dist < 420 && !pl.dead) {
      c.shoot = c.d.turret ? 2.2 : U.rand(1.0, 1.9);
      const n = c.d.turret ? 3 : 1, aim = Math.atan2(pl.y - c.y, pl.x - c.x);
      for (let i = 0; i < n; i++) this.delayed.push({ t: i * 0.12, fn: () => { if (c.dead) return; const a = aim + U.rand(-0.07, 0.07); this.ebullets.push({ x: c.x + Math.cos(a) * 30, y: c.y + Math.sin(a) * 30, vx: Math.cos(a) * 390, vy: Math.sin(a) * 390, t: 0, dmg: c.d.turret ? 4 : 3 }); L5.fx('muzzle', c.x + Math.cos(a) * 34, c.y + Math.sin(a) * 34, { dur: 0.06, rot: a, sc: 0.5 }); Sound.play('throw'); } });
    }
    if (dist > 1300 && !this.onScreen(c, 200) && !c.d.boss) { const a = L5.at(pl.s - U.rand(420, 600), { lane: U.rand(-20, 30) }); c.x = a.x; c.y = a.y; c.ang = a.ang; c.vx = a.dx * 220; c.vy = a.dy * 220; }
  }
  cornerSpeed(s) { for (let i = 1; i < L5.NODE_S.length - 1; i++) { const d = L5.NODE_S[i] - s; if (d > 0 && d < 360) return 110 + d * 0.55; } return 9999; }
  cornerSpeedRev(s) { for (let i = L5.NODE_S.length - 2; i >= 1; i--) { const d = s - L5.NODE_S[i]; if (d > 0 && d < 360) return 110 + d * 0.55; } return 9999; }
  trafAI(c, dt) {
    if (c.parked) { c.thr = 0; c.brk = 1; return; }
    if (c.wild > 0) { c.wild -= dt; c.thr = 0; c.str = 0; c.brk = 0.3; return; }
    if (c.cross) {
      const ang = Math.atan2(c.cross.ty - c.y, c.cross.tx - c.x); c.str = U.clamp(aDiff(ang, c.ang) * 2.4, -1, 1); c.thr = c.fwd < 150 ? 0.9 : 0; c.brk = 0;
      if (Math.hypot(c.cross.tx - c.x, c.cross.ty - c.y) < 70) { delete c.cross; c.s = L5.proj(c.x, c.y).s; }
      return;
    }
    const dir = c.dirSign || 1, pr = L5.proj(c.x, c.y, c.s, 500); c.s = pr.s;
    const tg = L5.at(pr.s + dir * 120, { lane: dir > 0 ? 32 : -32 });
    c.str = U.clamp(aDiff(Math.atan2(tg.y - c.y, tg.x - c.x), c.ang) * 2.4, -1, 1);
    let cruise = c.cruise || 120; cruise = Math.min(cruise, dir > 0 ? this.cornerSpeed(pr.s) : this.cornerSpeedRev(pr.s));
    c.thr = c.fwd < cruise ? 0.8 : 0; c.brk = c.fwd > cruise + 30 ? 0.5 : 0;
    const ca = Math.cos(c.ang), sa = Math.sin(c.ang);
    // дистанция до впереди идущего (по своей полосе), скорость-зависимая
    const look = 80 + Math.max(0, c.fwd) * 0.6 + c.L * 0.3;
    for (const o of this.cars) {
      if (o === c || o.dead || o.air > 0) continue;
      const rx = o.x - c.x, ry = o.y - c.y;
      if (Math.abs(rx) > look + 60 || Math.abs(ry) > look + 60) continue;
      const fwd = rx * ca + ry * sa, lat = -rx * sa + ry * ca;
      if (fwd > 0 && fwd < look + o.L * 0.5 && Math.abs(lat) < 28 + o.Wd * 0.3) { c.thr = 0; c.brk = fwd < 70 + o.L * 0.4 ? 1 : 0.5; }
    }
    // пешеходы на проезжей части — пропускаем
    for (const p of L5.world.folk) {
      if (p.gone || Math.abs(p.x - c.x) > 130 || Math.abs(p.y - c.y) > 130) continue;
      const rx = p.x - c.x, ry = p.y - c.y, fwd = rx * ca + ry * sa, lat = -rx * sa + ry * ca;
      if (fwd > 10 && fwd < 70 + Math.max(0, c.fwd) * 0.5 && Math.abs(lat) < 34) { c.thr = 0; c.brk = 1; }
    }
    // закрытый шлагбаум на переезде — стоим до отхода поезда
    for (const r of (L5.world.rails || [])) {
      if (r.bar < 0.15) continue;
      const rx = r.x - c.x, ry = r.y - c.y;
      if (Math.abs(rx) > 400 || Math.abs(ry) > 400) continue;
      const fwd = rx * ca + ry * sa, lat = -rx * sa + ry * ca;
      if (fwd > 70 && fwd < 70 + 90 + Math.max(0, c.fwd) * 0.6 && Math.abs(lat) < 60) { c.thr = 0; c.brk = 1; }
    }
    if (c.d.siren && c.d.fast && Math.random() < dt * 0.15) Sound.play('honk');
  }
  matAI(c, dt) {
    const pl = this.pl, pr = L5.proj(c.x, c.y, c.s, 600); c.s = pr.s;
    const racing = this.mode === 'race';
    let k = 1.0;
    if (racing) { const gap = c.s - pl.s; k = U.clamp(1 - gap * 0.0004, 0.88, 1.12); } else k = 1.3;
    c.maxMul = c.maxMul == null ? k : c.maxMul + (k - c.maxMul) * Math.min(1, dt * 1.2);
    let want = c.lane || -20; const ca = Math.cos(c.ang), sa = Math.sin(c.ang); let brk = 0;
    for (const o of this.cars) {
      if (o === c) continue;
      const rx = o.x - c.x, ry = o.y - c.y, fwd = rx * ca + ry * sa, lat = -rx * sa + ry * ca;
      if (fwd > 0 && fwd < 170 && Math.abs(lat) < 34) { want = lat > 0 ? Math.min(want, -34) : Math.max(want, 34); if (fwd < 62 && Math.abs(o.fwd) < c.fwd - 30) brk = Math.max(brk, 0.6); }
    }
    const look = 95 + c.speed * 0.18, tg = L5.at(pr.s + look, { lane: U.clamp(want, -48, 48) });
    c.str = U.clamp(aDiff(Math.atan2(tg.y - c.y, tg.x - c.x), c.ang) * 2.6, -1, 1);
    const cs = this.cornerSpeed(pr.s) * 1.25;
    c.thr = c.fwd < cs ? 1 : 0; c.brk = brk || (c.fwd > cs + 50 ? 0.8 : 0);
    if (c.fwd < 20 && c.speed < 25) c.stuck += dt; else c.stuck = Math.max(0, c.stuck - dt);
    if (c.stuck > 0.9) { c.rev = 0.8; c.stuck = 0; }
    if (c.rev > 0) { c.rev -= dt; c.thr = 0; c.brk = 1; c.str = -c.str; }
    c.talk = (c.talk || 3) - dt;
    if (racing && c.talk < 0) { c.talk = U.rand(5, 9); G.say(c, U.choice(L5R.lines), 1.8, { sound: false }); c.honk = 0.3; }
  }
  onScreen(o, m = 0) { return Math.abs(o.x - this.cam.x) < W / 2 + m && Math.abs(o.y - this.cam.y) < H / 2 + m; }

  // ---------- Вова стреляет ----------
  vova(dt) {
    const pl = this.pl, I = G.Input;
    let tgt = null, bd = 460;
    for (const c of this.cars) if (c.cop && !c.dead && !c.parkedCop) { const d = Math.hypot(c.x - pl.x, c.y - pl.y); if (d < bd) { bd = d; tgt = c; } }
    const hl = this.heli; if (hl && !hl.dying) { const d = Math.hypot(hl.x - pl.x, hl.y - pl.y); if (d < bd) { bd = d; tgt = { x: hl.x, y: hl.y, vx: hl.vx, vy: hl.vy }; } }
    let want = pl.ang + Math.PI;
    if (tgt) { const t = bd / 560; want = Math.atan2(tgt.y + tgt.vy * t - pl.y - pl.vy * t * 0.2, tgt.x + tgt.vx * t - pl.x - pl.vx * t * 0.2); }
    this.aim += U.clamp(aDiff(want, this.aim), -9 * dt, 9 * dt);
    this.tgt = tgt; this.fireT -= dt; this.gasCd = Math.max(0, this.gasCd - dt);
    this.ammo = Math.min(150, this.ammo + dt * 1.2);
    const firing = (this.mode === 'drive' || this.mode === 'race') && I.held('punch') && this.ammo >= 1;
    this.firing = firing;
    if (firing && this.fireT <= 0) {
      this.fireT = 0.13; this.ammo -= 1; this.shotN++;
      const ca = Math.cos(this.aim), sa = Math.sin(this.aim), px = pl.x - Math.cos(pl.ang) * 16, py = pl.y - Math.sin(pl.ang) * 16, a = this.aim + U.rand(-0.04, 0.04);
      this.bullets.push({ x: px + ca * 34, y: py + sa * 34, vx: Math.cos(a) * 600 + pl.vx * 0.3, vy: Math.sin(a) * 600 + pl.vy * 0.3, t: 0 });
      L5.fx('muzzle', px + ca * 40, py + sa * 40, { dur: 0.07, rot: this.aim, sc: 0.8 });
      if (this.shotN % 3 === 0) Sound.play('zap');
    }
    if (I.pressed('punch') && this.ammo < 1 && (this.mode === 'drive' || this.mode === 'race')) Sound.play('warn');
  }
  updateBullets(dt) {
    const wd = L5.world;
    for (const b of this.bullets) {
      b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.t > 0.8) { b.dead = true; continue; }
      if (Math.random() < 0.6) FX.spawn({ x: b.x, y: b.y, vx: U.rand(-15, 15), vy: U.rand(-15, 15), life: 0.25, size: 2, grav: 0, color: U.choice(['#9cff40', '#d8ff70', '#58d020']) });
      for (const c of this.cars) {
        if (c === this.pl || c.dead || c.isMatiz) continue;
        if (Math.abs(c.x - b.x) < c.L && Math.abs(c.y - b.y) < c.L) {
          const ca = Math.cos(c.ang), sa = Math.sin(c.ang), rx = b.x - c.x, ry = b.y - c.y, fx = rx * ca + ry * sa, lx = -rx * sa + ry * ca;
          if (Math.abs(fx) < c.L / 2 + 3 && Math.abs(lx) < c.Wd / 2 + 3) {
            b.dead = true; c.damage(c.cop ? 12 : 8, 'bullet'); c.wild = Math.max(c.wild, 0.4); if (c.parkedCop) c.parkedCop = false;
            FX.burst(b.x, b.y, 7, { colors: ['#9cff40', '#ffffff', '#58d020'], speed: 120, life: 0.4, grav: 0 }); Sound.play('hit'); break;
          }
        }
      }
      if (b.dead) continue;
      wd.circs.query(b.x - 14, b.y - 14, b.x + 14, b.y + 14, c => {
        if (b.dead || Math.hypot(c.x - b.x, c.y - b.y) > c.r + 3 || c.wall) return;
        b.dead = true; FX.burst(b.x, b.y, 5, { colors: ['#ffd84a', '#fff'], speed: 90, life: 0.3, grav: 0 });
        if (c.barrel && c.obj.hp > 0) this.blowBarrel(c.obj); else if (c.brk) this.smash(c, 1);
      });
      if (!b.dead) wd.solids.query(b.x - 2, b.y - 2, b.x + 2, b.y + 2, s => { if (!b.dead && b.x > s.x && b.x < s.x + s.w && b.y > s.y && b.y < s.y + s.h) { b.dead = true; FX.burst(b.x, b.y, 5, { colors: ['#ffd84a', '#fff'], speed: 90, life: 0.3, grav: 0 }); if (s.box && s.box.kiosk) this.smashKiosk(s); } });
      if (!b.dead) for (const p of wd.folk) if (!p.gone && p.hit <= 0 && Math.abs(p.x - b.x) < 10 && Math.abs(p.y - b.y) < 16) { b.dead = true; this.folkHit(p, b.vx * 0.2, b.vy * 0.2); break; }
    }
    this.bullets = this.bullets.filter(b => !b.dead);
    for (const b of this.ebullets) {
      b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt;
      const pl = this.pl;
      if (b.t > 0.9) b.dead = true;
      else if (!pl.dead && pl.air <= 0) {
        const ca = Math.cos(pl.ang), sa = Math.sin(pl.ang), rx = b.x - pl.x, ry = b.y - pl.y, fx = rx * ca + ry * sa, lx = -rx * sa + ry * ca;
        if (Math.abs(fx) < pl.L / 2 && Math.abs(lx) < pl.Wd / 2) { b.dead = true; pl.damage(b.dmg, 'shot'); this.stats.dmg += b.dmg; Sound.play('hit'); FX.burst(b.x, b.y, 4, { colors: ['#ffd84a', '#fff'], speed: 100, life: 0.3, grav: 0 }); G.shake(1.5, 0.12); }
      }
    }
    this.ebullets = this.ebullets.filter(b => !b.dead);
  }

  // ---------- взрывы, газ, ломающиеся предметы ----------
  blowBarrel(o) { if (o.hp <= 0) return; o.hp = 0; o.gone = true; L5.world.circs.remove(o.c); this.delayed.push({ t: 0.12, fn: () => this.boom(o.x, o.y, 95, 34, null) }); }
  smash(circ) {
    const o = circ.obj; if (!o || o.gone) return; o.gone = true; L5.world.circs.remove(circ); Sound.play('crumble');
    L5.fx('splinter', o.x, o.y, { sc: 0.9, dur: 0.5 });
    FX.burst(o.x, o.y, 10, { colors: ['#a0702a', '#d8a850', '#6a4a1a'], speed: 150, life: 0.7, grav: 0, size: 3 });
  }
  smashKiosk(sol) {
    const b = sol.box; if (!b || b.gone) return; b.gone = true; L5.world.solids.remove(sol); L5.world.boxes.remove(b); Sound.play('brick'); G.shake(2, 0.2);
    FX.burst(b.cx, b.cy, 20, { colors: ['#4078c0', '#fff', '#ffd84a'], speed: 190, life: 0.9, grav: 0, size: 3 }); L5.fx('splinter', b.cx, b.cy, { sc: 1.4, dur: 0.6 });
    this.pick.push({ x: b.cx, y: b.cy + 22, kind: 'ammo', t: 0 }); FX.popText(b.cx, b.cy - 20, 'КИОСК ВДРЕБЕЗГИ', '#ffd84a');
  }
  boom(x, y, R, dmg, ex) {
    L5.fx('boom', x, y, { sc: R / 52, rot: Math.random() * 6 });
    Sound.play('boom'); const pd = Math.hypot(x - this.pl.x, y - this.pl.y); if (pd < 500) G.shake(Math.max(1, 6 - pd / 100), 0.35);
    FX.burst(x, y, 22, { colors: ['#ffd84a', '#ff8a2a', '#ff5a1a', '#333'], speed: 260, life: 0.8, grav: 0, size: 3 });
    this.decals.push({ x, y, r: R * 0.6, t: 0 });
    for (const c of this.cars) {
      if (c === ex || c.dead) continue;
      const d = Math.hypot(c.x - x, c.y - y); if (d > R + 20) continue;
      const k = 1 - d / (R + 20), nx = (c.x - x) / (d || 1), ny = (c.y - y) / (d || 1);
      c.vx += nx * 260 * k / c.d.m; c.vy += ny * 260 * k / c.d.m; c.wild = 1;
      c.damage(dmg * k * (c === this.pl ? 0.55 : 1.2), 'boom');
    }
    for (const p of L5.world.folk) if (!p.gone && Math.hypot(p.x - x, p.y - y) < R) this.folkHit(p, (p.x - x) * 2, (p.y - y) * 2);
    for (const b of L5.world.barrels) if (!b.gone && b.hp > 0 && Math.hypot(b.x - x, b.y - y) < R) this.blowBarrel(b);
  }
  explode(car) {
    if (car.dead) return; car.dead = true;
    this.boom(car.x, car.y, car.L > 100 ? 110 : car.kind === 'player' ? 95 : 82, car.cop ? 26 : 18, car);
    if (car.cop) {
      this.stats.kills++; this.score += car.d.score || 500; FX.popText(car.x, car.y - 22, '+' + (car.d.score || 500), '#ffd84a');
      if (car.d.name && car.d.boss) FX.popText(car.x, car.y - 40, car.d.name + ' УНИЧТОЖЕН!', '#ff8a5a');
      if (Math.random() < 0.5) G.say(this.pl, U.choice(L5R.vova), 1.6, { sound: false });
      if (car.d.boss || Math.random() < 0.3) this.pick.push({ x: car.x, y: car.y, kind: 'wrench', t: 0 });
      if (car.d.boss) { this.ammo = Math.min(150, this.ammo + 50); G.flash(0.15, '#ffffff'); }
      if (car.kind === 'copbus') for (let i = 0; i < 2; i++) { const m = new L5.Car('moto', car.x + U.rand(-30, 30), car.y + U.rand(-30, 30), car.ang); m.vx = U.rand(-120, 120); m.vy = U.rand(-120, 120); m.sideSign = 1; this.cars.push(m); }
    } else if (car.kind === 'player') { this.onPlayerDead(); return; }
    else if (car.isMatiz) { car.dead = false; car.hp = car.maxhp; return; }
    const sp = car.sprite();
    this.wrecks.push({ x: car.x, y: car.y, ang: car.ang, sh: sp[0], fr: car.cop && !car.d.boss && car.kind !== 'moto' ? 10 : 9, t: 0, fire: 11, L: car.L, sx: sp[2], sy: sp[3] });
    if (this.wrecks.length > 10) this.wrecks.shift();
    for (let i = 0; i < 6; i++) FX.spawn({ x: car.x, y: car.y, vx: U.rand(-200, 200), vy: U.rand(-200, 200), life: 1.1, size: 3, grav: 0, drag: 2.2, color: U.choice(['#333', '#777', '#a0522d']) });
    this.cars = this.cars.filter(c => c !== car);
  }
  onPlayerDead() { this.mode = 'dead'; this.deadT = 0; this.stats.deaths++; this.cars = this.cars.filter(c => c !== this.pl); }

  // ---------- столкновения ----------
  collideStatic(car) {
    if (car.air > 0) return;
    const wd = L5.world; let maxImp = 0;
    for (const ci of car.circles()) {
      wd.solids.query(ci.x - ci.r, ci.y - ci.r, ci.x + ci.r, ci.y + ci.r, b => {
        const px = U.clamp(ci.x, b.x, b.x + b.w), py = U.clamp(ci.y, b.y, b.y + b.h);
        let dx = ci.x - px, dy = ci.y - py, d = Math.hypot(dx, dy), nx, ny, pen;
        if (d > 0.001) { if (d >= ci.r) return; nx = dx / d; ny = dy / d; pen = ci.r - d; }
        else { const l = ci.x - b.x, r = b.x + b.w - ci.x, t = ci.y - b.y, bt = b.y + b.h - ci.y, m = Math.min(l, r, t, bt); nx = m === l ? -1 : m === r ? 1 : 0; ny = m === t ? -1 : m === bt ? 1 : 0; if (!nx && !ny) ny = 1; pen = m + ci.r; }
        const vn0 = car.vx * nx + car.vy * ny;
        if (b.box && b.box.kiosk && -vn0 > 105 / Math.sqrt(car.d.m)) { this.smashKiosk(b); car.vx *= 0.7; car.vy *= 0.7; return; }
        car.x += nx * pen; car.y += ny * pen; ci.x += nx * pen; ci.y += ny * pen;
        const vn = car.vx * nx + car.vy * ny;
        if (vn < 0) { car.vx -= 1.25 * vn * nx; car.vy -= 1.25 * vn * ny; car.vx *= 0.96; car.vy *= 0.96; maxImp = Math.max(maxImp, -vn); }
      });
      wd.circs.query(ci.x - ci.r - 20, ci.y - ci.r - 20, ci.x + ci.r + 20, ci.y + ci.r + 20, o => {
        const dx = ci.x - o.x, dy = ci.y - o.y, d = Math.hypot(dx, dy), min = ci.r + o.r;
        if (d >= min || d < 0.001) return;
        const nx = dx / d, ny = dy / d, vn0 = car.vx * nx + car.vy * ny;
        if (o.brk && -vn0 > (o.soft ? 35 : 62) / Math.sqrt(car.d.m)) { this.smash(o); car.vx *= 0.9; car.vy *= 0.9; return; }
        const pen = min - d; car.x += nx * pen; car.y += ny * pen; ci.x += nx * pen; ci.y += ny * pen;
        const vn = car.vx * nx + car.vy * ny;
        if (vn < 0) { car.vx -= 1.2 * vn * nx; car.vy -= 1.2 * vn * ny; maxImp = Math.max(maxImp, -vn); if (o.obj && o.obj.kind === 'tree' && -vn > 40) { o.obj.hitT = G.t; FX.burst(o.x, o.y, 12, { colors: ['#e8602a', '#f0b030', '#c03020', '#8a5a1a'], speed: 130, life: 1.0, grav: 70, size: 3 }); if (-vn > 90) { G.shake(3, 0.2); Sound.play('crash'); } } if (o.barrel && o.obj.hp > 0 && -vn > 55) this.blowBarrel(o.obj); }
      });
    }
    for (const w of this.wrecks) {
      if (w.t > 6) continue;
      for (const ci of car.circles()) for (const k of [-0.28, 0.28]) {
        const wx = w.x + Math.cos(w.ang) * w.L * k, wy = w.y + Math.sin(w.ang) * w.L * k, dx = ci.x - wx, dy = ci.y - wy, d = Math.hypot(dx, dy), min = ci.r + 15;
        if (d >= min || d < 0.001) continue;
        const nx = dx / d, ny = dy / d, pen = min - d; car.x += nx * pen; car.y += ny * pen; ci.x += nx * pen; ci.y += ny * pen;
        const vn = car.vx * nx + car.vy * ny; if (vn < 0) { car.vx -= 1.15 * vn * nx; car.vy -= 1.15 * vn * ny; maxImp = Math.max(maxImp, -vn); }
      }
    }
    if (maxImp > 75 && car.cool <= 0) {
      car.cool = 0.25;
      const dmg = (maxImp - 75) * (car.kind === 'player' ? 0.035 : car.cop ? 0.2 : 0.12) / Math.sqrt(car.d.m);
      if (car.kind === 'player') { this.stats.dmg += dmg; G.shake(Math.min(5, maxImp / 70), 0.25); }
      car.damage(dmg, 'wall'); car.wild = Math.max(car.wild, 0.3);
      Sound.play(maxImp > 150 ? 'brick' : 'hit'); FX.burst(car.x, car.y, 6, { colors: ['#ffd84a', '#fff', '#ff8a2a'], speed: 140, life: 0.35, grav: 0 });
    }
  }
  collideCars() {
    const cs = this.cars;
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
      const a = cs[i], b = cs[j];
      if (Math.abs(a.x - b.x) > 140 || Math.abs(a.y - b.y) > 140 || a.dead || b.dead || a.air > 0 || b.air > 0) continue;
      let hit = false, maxImp = 0;
      for (const ca of a.circles()) for (const cb of b.circles()) {
        const dx = cb.x - ca.x, dy = cb.y - ca.y, d = Math.hypot(dx, dy), min = ca.r + cb.r;
        if (d >= min || d < 0.001) continue;
        hit = true; const nx = dx / d, ny = dy / d, pen = (min - d) * 0.5;
        const ma = a.d.m * (a.parked || a.parkedCop ? 3 : 1), mb = b.d.m * (b.parked || b.parkedCop ? 3 : 1), ka = mb / (ma + mb), kb = ma / (ma + mb);
        a.x -= nx * pen * 2 * ka; a.y -= ny * pen * 2 * ka; b.x += nx * pen * 2 * kb; b.y += ny * pen * 2 * kb;
        const rv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (rv > 0) { const j2 = rv * 1.25 / (1 / ma + 1 / mb); a.vx -= j2 * nx / ma; a.vy -= j2 * ny / ma; b.vx += j2 * nx / mb; b.vy += j2 * ny / mb; maxImp = Math.max(maxImp, rv); }
      }
      if (hit && maxImp > 55) {
        a.parked = false; b.parked = false; a.parkedCop = false; b.parkedCop = false;
        const f = (c, o) => { if (c.cool <= 0) { c.cool = 0.22; const k = c.kind === 'player' ? 0.04 : c.cop ? 0.15 : 0.12; const share = o.d.m / (c.d.m + o.d.m) * 2; const d = (maxImp - 50) * k * share * (o.d.ram ? 1.3 : 1); if (c.kind === 'player') { this.stats.dmg += d; G.shake(3, 0.2); } c.damage(d, o); c.wild = Math.max(c.wild, 0.8); } };
        f(a, b); f(b, a); Sound.play('hit'); FX.burst((a.x + b.x) / 2, (a.y + b.y) / 2, 6, { colors: ['#ffd84a', '#fff'], speed: 130, life: 0.3, grav: 0 });
        if (b.isMatiz || a.isMatiz) { if (Math.random() < 0.5 && this.matiz) G.say(this.matiz, U.choice(['Куда прёшь?!', 'Ты чё творишь!', 'Моя тачка!']), 1.5, { sound: false }); }
        if ((a.kind === 'player' && b.traffic) || (b.kind === 'player' && a.traffic)) { const t = a.traffic ? a : b; t.honk = 0.6; if (Math.random() < 0.4) G.say(t, U.choice(['Ослеп?!', 'Права купил?!', 'Моя машина!', 'Пешеход!']), 1.4, { sound: false }); }
      }
    }
  }
  updateRamps() {
    const wd = L5.world, all = wd.ramps.concat(this.ramps);
    for (const c of this.cars) {
      if (c.air > 0 || c.fwd < 110) continue;
      for (const r of all) {
        if (r.gone || Math.abs(r.x - c.x) > 60 || Math.abs(r.y - c.y) > 60) continue;
        const dx = c.x - r.x, dy = c.y - r.y, lx = dx * Math.cos(r.rot) + dy * Math.sin(r.rot), ly = -dx * Math.sin(r.rot) + dy * Math.cos(r.rot);
        if (Math.abs(lx) < 40 && Math.abs(ly) < 26 && Math.cos(aDiff(c.ang, r.rot)) > 0.35) {
          c.air = 0.32 + Math.min(0.6, c.fwd / 520); c.airT = 0; c.landed = false; c.hand = 0;
          if (c === this.pl) { G.say(c, 'Лети-и-и!', 1.2, { sound: false }); Sound.play('jump'); this.score += 200; FX.popText(c.x, c.y - 30, 'ПРЫЖОК +200', '#ffd84a'); }
          break;
        }
      }
    }
    for (const c of this.cars) if (c.landed) {
      c.landed = false; Sound.play('stomp'); FX.dust(c.x, c.y, 8); G.shake(c === this.pl ? 3 : 1, 0.15); L5.fx('dust', c.x, c.y, { sc: 0.9, dur: 0.5 });
      for (const o of this.cars) if (o !== c && Math.hypot(o.x - c.x, o.y - c.y) < (c.L + o.L) * 0.45) { o.damage(c === this.pl ? 55 : 20, c); o.wild = 1; o.vx += (o.x - c.x) * 4; o.vy += (o.y - c.y) * 4; if (c === this.pl && o.cop) FX.popText(o.x, o.y - 22, 'РАЗДАВИЛ!', '#ff8a5a'); }
    }
  }

  // ---------- люди и собаки (из уровня 2) ----------
  folkHit(p, vx, vy) {
    if (p.hit > 0 || p.gone) return;
    p.hit = 2; p.state = 'hit'; p.vx = vx; p.vy = vy; p.t = 0; p.flash = 0.1; Sound.play(p.kind === 'dog' ? 'bark' : 'punch', p.kind === 'dog' ? 700 : 1);
    if (p.kind === 'dog') G.say(p, 'Кяв!', 1.2, { sound: false }); else G.say(p, U.choice(['ААА!', 'Ой-ёй!', 'Зашибли!', 'Мама!']), 1.3, { sound: false });
  }
  folkDodge(p, car) {
    if (p.hit > 0 || p.state === 'dodge') return;
    p.state = 'dodge'; p.t = 0; const dx = p.x - car.x, dy = p.y - car.y;
    const sx = -car.vy / (car.speed || 1), sy = car.vx / (car.speed || 1), sg = (dx * sx + dy * sy) >= 0 ? 1 : -1;
    p.vx = sx * sg * 130; p.vy = sy * sg * 130;
    if (!p.said || this.t - p.said > 5) { p.said = this.t; if (p.kind === 'folk') G.say(p, U.choice(['Ты чё, ослеп?!', 'Держись левее!', 'Куда прёшь!', 'Уф!']), 1.3, { sound: false }); }
  }
  // пешеходы, собаки и рабочие никогда не заходят в здания: шаг внутрь стены откатывается, прогулка разворачивается
  updateFolk(dt) {
    const wd = L5.world, pl = this.pl, near = [];
    for (const p of wd.folk) if (!p.gone && Math.abs(p.x - pl.x) < 1300 && Math.abs(p.y - pl.y) < 1000) { p.ox = p.x; p.oy = p.y; near.push(p); }
    this.updateFolk0(dt);
    for (const p of near) {
      let inside = false;
      wd.solids.query(p.x - 2, p.y - 2, p.x + 2, p.y + 2, b => { if (!inside && p.x > b.x - 4 && p.x < b.x + b.w + 4 && p.y > b.y - 4 && p.y < b.y + b.h + 4) inside = true; });
      if (inside) {
        // старая позиция тоже могла быть у самой стены: тогда выталкиваем наружу
        let still = false;
        wd.solids.query(p.ox - 2, p.oy - 2, p.ox + 2, p.oy + 2, b => { if (!still && p.ox > b.x - 4 && p.ox < b.x + b.w + 4 && p.oy > b.y - 4 && p.oy < b.y + b.h + 4) still = true; });
        if (!still) { p.x = p.ox; p.y = p.oy; } else wd.solids.query(p.x - 2, p.y - 2, p.x + 2, p.y + 2, b => { const dl = p.x - b.x, dr = b.x + b.w - p.x, dt2 = p.y - b.y, db = b.y + b.h - p.y, m = Math.min(dl, dr, dt2, db); if (m === dl) p.x = b.x - 6; else if (m === dr) p.x = b.x + b.w + 6; else if (m === dt2) p.y = b.y - 6; else p.y = b.y + b.h + 6; });
        if (p.dir) p.dir = -p.dir; if (p.vx != null) { p.vx = -p.vx; p.vy = -p.vy; }
      }
    }
  }
  updateFolk0(dt) {
    const wd = L5.world, pl = this.pl;
    for (const p of wd.folk) {
      if (p.gone) continue;
      if (Math.abs(p.x - pl.x) > 1300 || Math.abs(p.y - pl.y) > 1000) continue;
      p.ph += dt; p.t += dt; if (p.flash > 0) p.flash -= dt;
      if (p.hit > 0) {
        p.hit -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.93; p.vy *= 0.93;
        if (p.hit <= 0) { p.state = p.kind === 'dog' ? 'idle' : 'walk'; if (p.kind === 'folk') G.say(p, U.choice(L5.FOLK[p.type].lines), 1.8, { sound: false }); }
        continue;
      }
      let near = null, nd = p.kind === 'dog' ? 240 : 110;
      for (const c of this.cars) { const d = Math.hypot(c.x - p.x, c.y - p.y) - c.L * 0.3; if (d < nd && c.speed > (p.kind === 'dog' ? 20 : 70)) { nd = d; near = c; } }
      if (near) { for (const ci of near.circles()) if (Math.hypot(ci.x - p.x, ci.y - p.y) < ci.r + 6 && near.speed > 85) { this.folkHit(p, near.vx * 0.9, near.vy * 0.9); if (near === pl) { this.score += 50; FX.popText(p.x, p.y - 30, p.kind === 'dog' ? 'ПЁС +50' : 'ПРОХОЖИЙ +50', '#c8d0d8'); } break; } }
      if (p.hit > 0) continue;
      if (p.kind === 'dog') this.dogAI(p, dt, near);
      else if (p.kind === 'worker') {
        if (near && nd < 90 && p.state !== 'dodge') { this.folkDodge(p, near); p.workSave = p.work; p.work = null; }
        if (p.state === 'dodge') { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; if (p.t > 0.8) { p.state = 'idle'; p.work = p.workSave || L5.WORK[0]; } }
      } else this.folkAI(p, dt, near, nd);
    }
  }
  folkAI(p, dt, near, nd) {
    const f = L5.FOLK[p.type];
    if (near && nd < 100 && p.state !== 'dodge') { this.folkDodge(p, near); p.t = 0; }
    if (p.state === 'dodge') { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.face = p.vx >= 0 ? 1 : -1; if (p.t > 0.7) { p.state = 'walk'; p.t = 0; } return; }
    if (near === this.pl && nd < 170 && (!p.said || this.t - p.said > 7) && Math.random() < dt * 1.4) { p.said = this.t; G.say(p, U.choice(f.lines), 1.7, { sound: false }); }
    if (p.state === 'stroll') {
      if (p.t > U.rand(2, 5)) { p.t = 0; const a = Math.random() * 6.28; p.vx = Math.cos(a) * f.sp * 0.6; p.vy = Math.sin(a) * f.sp * 0.6; if (Math.random() < 0.3) { p.vx = p.vy = 0; } }
      p.x += p.vx * dt; p.y += p.vy * dt; if (p.vx) p.face = p.vx > 0 ? 1 : -1;
      const pk = p.park; if (pk) { if (p.x < pk.x0 + 30 || p.x > pk.x1 - 30) p.vx *= -1; if (p.y < pk.y0 + 30 || p.y > pk.y1 - 30) p.vy *= -1; }
      return;
    }
    if (p.state === 'talk') { if (p.t > 2.5) { p.state = 'walk'; p.t = 0; } return; }
    if (p.state === 'cross') {
      p.x += p.vx * dt; p.y += p.vy * dt; p.face = p.vx >= 0 ? 1 : -1;
      if (p.t > p.crossT) { p.state = 'walk'; p.t = 0; p.sd = -p.sd; }
      return;
    }
    const g = p.g;
    p.x += g.dx * p.dir * f.sp * dt; p.y += g.dy * p.dir * f.sp * dt; p.face = Math.abs(g.dx) > 0.5 ? (g.dx * p.dir >= 0 ? 1 : -1) : p.face;
    const tpar = (p.x - g.ax) * g.dx + (p.y - g.ay) * g.dy; if (tpar < 5 || tpar > g.len - 5) p.dir *= -1;
    if (p.cross && p.t > 4 && Math.random() < dt * 0.4 && !near) {
      p.state = 'cross'; p.t = 0; const sd = p.sd, nx = -g.dy, ny = g.dx, dist = (L5.HW + L5.SW * 0.55) * 2; p.vx = -nx * sd * 38; p.vy = -ny * sd * 38; p.crossT = dist / 38;
    } else if (p.t > 6 && Math.random() < dt * 0.3) { p.state = 'talk'; p.t = 0; }
  }
  dogAI(p, dt, near) {
    const d = L5.DOGS[p.type];
    if (p.state === 'flee') { p.x += p.vx * dt; p.y += p.vy * dt; if (p.t > 1.2) { p.state = 'idle'; p.t = 0; } p.face = p.vx >= 0 ? 1 : -1; return; }
    if (near && p.state !== 'chase' && p.state !== 'bark' && Math.random() < dt * 2.4) { p.state = 'chase'; p.t = 0; p.target = near; if (this.t - (p.said || 0) > 4) { p.said = this.t; G.say(p, 'ГАВ-ГАВ!', 1.1, { sound: false }); Sound.play('bark', p.type === 'dogS' ? 700 : 380); } }
    if (p.state === 'chase') {
      const c = p.target; if (!c || p.t > 3.6) { p.state = 'idle'; p.t = 0; return; }
      const dx = c.x + c.vx * 0.3 - p.x, dy = c.y + c.vy * 0.3 - p.y, dist = Math.hypot(dx, dy) || 1;
      if (dist < 34) { p.state = 'flee'; p.t = 0; p.vx = -dx / dist * 140; p.vy = -dy / dist * 140; if (Math.random() < 0.5) Sound.play('bark', 600); return; }
      p.x += dx / dist * d.sp * dt; p.y += dy / dist * d.sp * dt; p.face = dx >= 0 ? 1 : -1; return;
    }
    if (p.state === 'idle') { if (p.t > U.rand(1.5, 4)) { p.state = Math.random() < 0.6 ? 'walk' : 'bark'; p.t = 0; if (p.state === 'bark' && Math.random() < 0.5) Sound.play('bark', p.type === 'dogS' ? 800 : 420); p.dir = Math.random() < 0.5 ? 1 : -1; } return; }
    if (p.state === 'bark') { if (p.t > 1.3) { p.state = 'idle'; p.t = 0; } return; }
    if (p.state === 'walk') { const g = p.g; p.x += g.dx * p.dir * 30 * dt; p.y += g.dy * p.dir * 30 * dt; p.face = (Math.abs(g.dx) > 0.5 ? g.dx * p.dir : p.face) >= 0 ? 1 : -1; if (p.t > 3.5) { p.state = 'idle'; p.t = 0; } }
  }

  // ---------- мир, частицы, события ----------
  updateWorldBits(dt) {
    const wd = L5.world, pl = this.pl;
    for (const q of wd.cones) {
      if (q.hit > 0) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.94; q.vy *= 0.94; q.rot += q.vx * dt * 0.05; q.hit -= dt; q.by = q.y; }
      else if (Math.abs(q.x - pl.x) < 900) for (const c of this.cars) if (Math.abs(c.x - q.x) < 50 && Math.abs(c.y - q.y) < 50 && c.speed > 30 && Math.hypot(c.x - q.x, c.y - q.y) < c.L * 0.6) { q.hit = 1.4; q.vx = c.vx * 0.9 + U.rand(-30, 30); q.vy = c.vy * 0.9 + U.rand(-30, 30); Sound.play('clank'); break; }
    }
    for (const cl of this.clouds) {
      cl.t += dt; if (Math.random() < dt * 30) FX.spawn({ x: cl.x + U.rand(-cl.r, cl.r) * 0.8, y: cl.y + U.rand(-cl.r, cl.r) * 0.8, vx: U.rand(-10, 10), vy: U.rand(-16, -4), life: 1.0, size: 7, grav: -6, color: '#58d020', type: 'puff' });
      for (const c of this.cars) if (c !== pl && !c.isMatiz && Math.hypot(c.x - cl.x, c.y - cl.y) < cl.r) { c.damage((c.d.boss ? 7 : 14) * dt, 'gas'); c.gasT = 0.3; }
      for (const p of wd.folk) if (!p.gone && p.hit <= 0 && Math.hypot(p.x - cl.x, p.y - cl.y) < cl.r && Math.random() < dt) { p.state = 'dodge'; p.t = 0; p.vx = (p.x - cl.x) * 2; p.vy = (p.y - cl.y) * 2; if (Math.random() < 0.3) G.say(p, 'Кха-кха!', 1, { sound: false }); }
    }
    this.clouds = this.clouds.filter(cl => cl.t < cl.life);
    for (const c of this.cars) { if (c.gasT > 0) { c.gasT -= dt; if (!c.isMatiz) c.maxMul = 0.62; } else if (!c.isMatiz && c.maxMul < 1) c.maxMul = 1; }
    for (const s of wd.smokers) {
      if (!s.steam || Math.abs(s.x - pl.x) > 700 || Math.abs(s.y - pl.y) > 500) continue;
      s.t -= dt; if (s.t > 0) continue;
      s.t = U.rand(0.1, 0.25); FX.spawn({ x: s.x + U.rand(-4, 4), y: s.y, vx: U.rand(-8, 8), vy: U.rand(-34, -14), life: 1.3, size: 5, grav: -8, color: '#d8dce4', type: 'puff' });
    }
    for (const b of wd.boxList) { // трубы котельных дымят
      if (!b.feats || !b.feats.includes('chimney') || Math.abs(b.cx - pl.x) > 700 || Math.abs(b.cy - pl.y) > 500) continue;
      b._sm = (b._sm || 0) - dt; if (b._sm > 0) continue; b._sm = U.rand(0.15, 0.3);
      const k = 1 + (b.H + 100) / L5.PERSP, C = this.cam;
      FX.spawn({ x: C.x + (b.x + b.w * 0.72 - C.x) * k, y: C.y + (b.y + b.d * 0.4 - C.y) * k, vx: U.rand(14, 26), vy: U.rand(-24, -10), life: 2.4, size: 8, grav: -3, color: '#6a6a70', type: 'puff' });
    }
    // припаркованные машины оживают рядом с игроком
    for (const o of wd.cars) {
      if (o.dyn) { if (!this.cars.includes(o.dyn)) o.dyn = null; continue; }
      if (Math.abs(o.x - pl.x) < 1100 && Math.abs(o.y - pl.y) < 900 && !o.destroyed) {
        const kind = U.choice(['civ5', 'civ6', 'civ7', 'civ8', 'moskvich', 'minibus']), car = new L5.Car(kind, o.x, o.y, o.ang); car.parked = true; car.brk = 1; car.s = L5.proj(o.x, o.y).s; this.cars.push(car); o.dyn = car; o.hidden = true;
      }
    }
  }
  update(dt) {
    if (this.mode === 'scene') { Scene.tick(dt); if (this.updateScene) this.updateScene(dt); FX.update(dt); G.updateBubbles(dt); L5.fxs.forEach(e => e.t += dt); const keep = L5.fxs.filter(e => e.t < e.dur); L5.fxs.length = 0; L5.fxs.push(...keep); return; }
    this.t += dt; if (this.titleT > 0) this.titleT -= dt; if (this.hint > 0) this.hint -= dt;
    L5.fxs.forEach(e => e.t += dt); { const keep = L5.fxs.filter(e => e.t < e.dur); L5.fxs.length = 0; L5.fxs.push(...keep); }
    for (const d of this.delayed) d.t -= dt; for (const d of this.delayed.filter(d => d.t <= 0)) d.fn(); this.delayed = this.delayed.filter(d => d.t > 0);
    for (const d of this.decals) d.t += dt;
    if (this.decals.length > 20) this.decals.shift();
    if (this.mode === 'dead') {
      this.deadT += dt; FX.update(dt); G.updateBubbles(dt); this.worldTick(dt, true);
      if (this.deadT > 2.4 && (G.Input.pressed('start') || G.Input.pressed('jump') || G.Input.pressed('punch') || this.deadT > 4)) this.respawn();
      return;
    }
    if (this.mode === 'race' || this.mode === 'count' || this.mode === 'drive') { if (this.mode !== 'count') this.stats.time += dt; this.worldTick(dt, false); }
    if (this.mode === 'win' || this.mode === 'lose') { this.endT += dt; this.worldTick(dt, true); if (this.endT > 2.2) this.modeDone(); }
    FX.update(dt); G.updateBubbles(dt);
  }
  respawn() { if (this.raceStarted) { this.startRaceSetup(); return; } this.beginDrive(this.cp); this.hint = 0; }
  worldTick(dt, frozen) {
    const pl = this.pl;
    if (!frozen && this.extraTick) this.extraTick(dt);
    if (!frozen && this.mode !== 'count') this.control(dt); else if (pl) { pl.thr = 0; pl.brk = 0; pl.str = 0; pl.hand = 0; }
    if (!frozen && this.mode !== 'count') this.vova(dt); else this.firing = false;
    for (const c of this.cars) { c.t += dt; if (c.cool > 0) c.cool -= dt; if (c.flash > 0) c.flash -= dt; if (c === pl && c.invul > 0 && c.invul < 100) c.invul -= dt; if (c !== pl && !c.isMatiz && Math.abs(c.x - pl.x) > 2000 && Math.abs(c.y - pl.y) > 2000) c.far = true; }
    if (this.cars.some(c => c.far)) this.cars = this.cars.filter(c => !c.far);
    if (!frozen) {
      for (const c of this.cars) {
        if (c === pl) continue;
        if (c.cop) this.copAI(c, dt);
        else if (c.isMatiz) { if (this.mode === 'count') { c.thr = 0; c.brk = 1; c.str = 0; } else this.matAI(c, dt); }
        else this.trafAI(c, dt);
      }
    }
    for (const c of this.cars) {
      c.physics(dt); this.collideStatic(c);
      if (this.mode === 'count' && (c === pl || c.isMatiz)) { c.vx = c.vy = 0; }
      if (c.skid > 0 && c.speed > 80 && Math.random() < 0.7) this.skids.push({ x: c.x - Math.cos(c.ang) * 16, y: c.y - Math.sin(c.ang) * 16, a: c.ang, t: 0 });
    }
    if (this.skids.length > 260) this.skids.splice(0, this.skids.length - 260);
    this.collideCars(); this.updateRamps();
    this.updateFolk(dt); this.updateWorldBits(dt);
    this.wrecks = this.wrecks.filter(w => w.t < 22); for (const w of this.wrecks) { w.t += dt; if (w.fire > 0) { w.fire -= dt; if (Math.random() < dt * 4) L5.fx('smoke', w.x + U.rand(-10, 10), w.y + U.rand(-8, 8), { sc: 0.6, dur: 1.3 }); } }
    this.updateBullets(dt);
    for (const p of this.pick) {
      if (p.got || Math.hypot(p.x - pl.x, p.y - pl.y) > 34 || pl.dead) continue;
      p.got = true;
      if (p.kind === 'ammo') { this.ammo = Math.min(150, this.ammo + 45); FX.popText(p.x, p.y - 18, 'ПАТРОНЫ +45', '#9cff40'); Sound.play('pickup'); }
      else if (p.kind === 'nitro') { pl.nitro = 3.2; FX.popText(p.x, p.y - 18, 'НИТРО!', '#60b0ff'); Sound.play('checkpoint'); G.flash(0.08, '#60b0ff'); }
      else { pl.hp = Math.min(pl.maxhp, pl.hp + 35); FX.popText(p.x, p.y - 18, 'РЕМОНТ +35', '#8cf08c'); Sound.play('heal'); }
    }
    this.pick = this.pick.filter(p => !p.got);
    if (this.mode === 'drive' || this.mode === 'race') this.events(dt);
    this.trafTimer -= dt; if (this.trafTimer <= 0 && !frozen) { this.trafTimer = 1.2; this.fillTraffic(false); }
    if (this.mode === 'race') this.raceTick(dt);
    if (this.mode === 'count') { this.race.t -= dt; if (this.race.t <= 0) { this.mode = 'race'; this.titleText = 'ГОНИ!'; this.titleT = 1.2; Sound.play('shout'); this.matiz.talk = 6; this.copTimer = 5; } else if (Math.ceil(this.race.t) !== this.race.last) { this.race.last = Math.ceil(this.race.t); Sound.play('select'); } }
    if (!frozen) {
      const sNow = pl.s = L5.proj(pl.x, pl.y, pl.s, 700).s;
      L5.NAMES.forEach(([ni, name], i) => { if (i > this.nameIdx && sNow > L5.NODE_S[ni] - 120 && sNow < L5.NODE_S[ni] + 1200 || (i > this.nameIdx && i === 0)) { this.nameIdx = i; this.titleText = name; this.titleT = 2.4; } });
    }
    const tx = pl.x + pl.vx * 0.38, ty = pl.y + pl.vy * 0.38, k = Math.min(1, dt * 4.5);
    this.cam.x += (tx - this.cam.x) * k; this.cam.y += (ty - this.cam.y) * k;
    const zt = 0.8 - Math.min(0.16, pl.speed / 1800) - (pl.nitro > 0 ? 0.05 : 0); this.zoom += (zt - this.zoom) * Math.min(1, dt * 2.5);
  }
  events(dt) {
    const pl = this.pl, racing = this.mode === 'race';
    const alive = this.cars.filter(c => c.cop && !c.parkedCop).length;
    this.copTimer -= dt;
    const limit = racing ? 999 : 24;
    if (this.copTimer <= 0 && alive < this.wantCops() && this.spawned < limit && (racing || pl.s < L5.S_MATCH - 700)) {
      let tot = 0; const pool = this.copPool(); for (const [, w] of pool) tot += w; let r = Math.random() * tot, type = 'patrol';
      for (const [tp, w] of pool) { r -= w; if (r <= 0) { type = tp; break; } }
      this.spawnCop(type, Math.random() < 0.7); this.copTimer = racing ? U.rand(4, 7) : U.rand(2.5, 5);
    }
    if (!racing) {
      for (const ps of [5500, 7300]) if (!this.bossesDone['sup' + ps] && pl.s > ps - 900 && pl.s < ps) { this.bossesDone['sup' + ps] = 1; for (const [k, ln] of [['wrench', -26], ['ammo', 0], ['ammo', 26], ['nitro', 0]]) { const a = L5.at(ps + (k === 'nitro' ? 160 : k === 'wrench' ? 0 : 70), { lane: ln }); this.pick.push({ x: a.x, y: a.y, kind: k, t: 0 }); } this.cp = Math.max(this.cp, ps - 700); FX.popText(pl.x, pl.y - 40, 'ПЕРЕДЫШКА: РЕМОНТ И ПАТРОНЫ', '#9cff40'); }
      if (!this.bossesDone.riot && pl.s > 6200) { this.bossesDone.riot = 1; const b = this.spawnCop('riot', true); if (b) { this.titleText = 'ОМОН-УАЗ ИДЁТ НА ВЫ!'; this.titleT = 2.4; Sound.play('sting'); } }
      if (!this.bossesDone.copbus && pl.s > 7900) { this.bossesDone.copbus = 1; const b = this.spawnCop('copbus', true); if (b) { this.titleText = 'АВТОЗАК В ПОГОНЕ!'; this.titleT = 2.4; Sound.play('sting'); } }
      for (const rb of [2400, 5200, 7600]) if (!this.rbDone[rb] && pl.s > rb - 1200 && pl.s < rb) { this.rbDone[rb] = 1; this.spawnRoadblock(rb); this.titleText = 'БЛОКПОСТ ВПЕРЕДИ'; this.titleT = 1.8; Sound.play('warn'); }
      if (pl.s > this.cp + 2800 && pl.s < L5.S_MATCH - 800) { this.cp = pl.s - 150; FX.popText(pl.x, pl.y - 40, 'КОНТРОЛЬНАЯ ТОЧКА', '#ffd84a'); Sound.play('checkpoint'); }
      const bosses = this.cars.filter(c => c.d.boss).length;
      // середина маршрута: всегда в одном месте начинается катсцена с Граблионком, там же стартует гонка
      if (pl.s >= L5.S_RACE - 170 && !this.matchStarted && !pl.dead) { this.matchStarted = true; this.playScene(L5.sceneMatch(this), () => this.startRaceSetup()); }
    } else {
      const f = Math.floor((pl.s - L5.S_RACE) / 3400);
      if (f >= 1 && !this.rbDone['r' + f] && pl.s < L5.S_END - 1500) { this.rbDone['r' + f] = 1; this.spawnRoadblock(pl.s + 1300); }
    }
    this.crossT -= dt;
    if (this.crossT <= 0) { this.crossT = racing ? 2.5 : 4; for (const j of L5.world.junctions) if (j.s > pl.s + 420 && j.s < pl.s + 1100 && !j.used && Math.random() < 0.5) { j.used = 1; this.spawnCross(j); break; } for (const j of L5.world.junctions) if (j.s < pl.s - 1500) j.used = 0; }
  }

  // ---------- гонка ----------
  startRaceSetup() {
    const pl = this.pl; this.trains = []; this.heli = null; this.heliDone = {}; this.heliCrashDone = false; for (const r of (L5.world.rails || [])) { r.done = false; r.bar = 0; }
    this.mode = 'count'; this.raceStarted = true; this.race = { t: 3.4, last: 4, done: false };
    this.cars = this.cars.filter(c => c === pl); this.wrecks = []; this.bullets = []; this.ebullets = []; this.clouds = []; L5.fxs.length = 0; FX.list = [];
    const a = L5.at(L5.S_RACE, { lane: 24 }), b = L5.at(L5.S_RACE, { lane: -24 });
    pl.x = a.x; pl.y = a.y; pl.ang = a.ang; pl.vx = pl.vy = 0; pl.hp = pl.maxhp; pl.dead = false; pl.s = L5.S_RACE; pl.invul = 0; pl.air = 0; pl.nitro = 0; pl.maxMul = 1; pl.flatT = 0; // старт гонки без ускорения: ни нитро, ни остатков бонусов
    this.pick = this.pick.filter(p => !(p.kind === 'nitro' && Math.abs(L5.proj(p.x, p.y).s - L5.S_RACE) < 1200));
    this.cars.push(pl);
    const m = this.matiz = new L5.Car('matiz', b.x, b.y, b.ang); m.invul = 1e9; m.s = L5.S_RACE; m.isMatiz = true; m.lane = -24; this.cars.push(m);
    this.cam.x = pl.x; this.cam.y = pl.y; this.ammo = Math.max(this.ammo, 100); this.spawned = 0; this.copTimer = 6;
    for (const o of L5.world.cars) o.dyn = null;
    this.fillTraffic(true);
    this.cars = this.cars.filter(c => c === pl || c === m || Math.abs(L5.proj(c.x, c.y).s - L5.S_RACE) > 420);
    this.dead = false; Music.play('chase');
  }
  raceTick() {
    const pl = this.pl, m = this.matiz;
    if (this.race.done) return;
    const pw = pl.s >= L5.S_END, mw = m.s >= L5.S_END;
    if (pw || mw) {
      this.race.done = true; this.endT = 0; this.mode = pw ? 'win' : 'lose';
      if (this.mode === 'win') { this.score += 6000; Sound.play('checkpoint'); G.flash(0.3, '#ffffff'); this.titleText = 'ПОБЕДА!'; } else { Sound.play('sting'); this.titleText = 'ГРАБЛИОНОК ПЕРВЫЙ'; G.say(m, 'Ха! Кто тут пешеход?!', 2.4, { sound: false }); }
      this.titleT = 3;
    }
  }
  modeDone() {
    if (this.mode === 'win') { this.mode = 'x'; this.playScene(L5.sceneEnd(this), () => G.onLevelComplete(this)); }
    else { this.mode = 'dead'; this.deadT = 2.4; this.loseRace = true; this.stats.deaths++; }
  }

  // ---------- отрисовка и интерфейс ----------
  draw(c) {
    if (this.mode === 'scene') { if (this.drawScene) this.drawScene(c); Scene.drawDialog(c); if (Scene.t < 3) G.text('Esc — пропустить', 8, H - 12, { size: 8, color: 'rgba(255,255,255,0.5)' }); return; }
    L5.R.world(this, c);
    this.drawHUD(c);
    if (this.mode === 'dead') {
      const k = Math.min(1, this.deadT / 1.2); c.fillStyle = 'rgba(0,0,0,' + (k * 0.78) + ')'; c.fillRect(0, 0, W, H);
      if (this.deadT > 0.8) { G.text(this.loseRace ? 'ГРАБЛИОНОК ПРИЕХАЛ ПЕРВЫМ' : 'КОПЕЙКА РАЗБИТА', W / 2, 150, { size: 16, align: 'center', color: '#ff5a3a' }); if (this.deadT > 2.4 && (G.t * 2 | 0) % 2) G.text('Нажми ПРОБЕЛ — ещё раз', W / 2, 200, { size: 8, align: 'center', color: '#ffd84a' }); }
    }
  }
  drawHUD(c) {
    const R = Art.R, pl = this.pl;
    if (this.mode === 'scene') return;
    // шкала здоровья копейки — как на прошлых уровнях: портрет-аватар в рамке + полоса с делениями
    const hp = U.clamp(pl.hp / pl.maxhp, 0, 1), kp = G.portraits && (hp < 0.35 ? G.portraits.kop2 : G.portraits.kop);
    R(c, 5, 5, 34, 34, '#0a0a0c'); R(c, 6, 6, 32, 32, '#c8601a'); R(c, 7, 7, 30, 30, '#3a2414');
    if (kp) { c.save(); c.beginPath(); c.rect(7, 7, 30, 30); c.clip(); c.drawImage(kp, 4, 6, 36, 36); c.restore(); }
    if (hp < 0.3 && (G.t * 4 | 0) % 2) R(c, 7, 7, 30, 30, 'rgba(220,40,40,0.35)');
    R(c, 42, 8, 124, 12, '#111'); R(c, 44, 10, 120, 8, '#3a1010');
    R(c, 44, 10, Math.round(120 * hp), 8, hp > 0.5 ? '#48c048' : hp > 0.25 ? '#e0b020' : '#e03030'); R(c, 44, 10, Math.round(120 * hp), 2, 'rgba(255,255,255,0.35)');
    for (let i = 1; i < 10; i++) R(c, 44 + i * 12, 10, 1, 8, 'rgba(0,0,0,0.4)');
    G.text('КОПЕЙКА', 42, 23, { size: 8, color: '#ffb070' });
    // оружие Вовы: патроны «Осеменителя» и газовая граната
    R(c, 172, 6, 64, 22, '#111'); R(c, 173, 7, 62, 20, '#23262b');
    Spr.drawC(c, Spr.sheets.seedcan ? 'seedcan' : 'icons4', Spr.sheets.seedcan ? 0 : 2, 186, 17, 0, 1);
    G.text('x' + Math.floor(this.ammo), 198, 13, { size: 8, color: this.ammo >= 1 ? '#fff' : '#777' });
    const gk = 1 - this.gasCd / 7;
    R(c, 240, 6, 60, 22, '#111'); R(c, 241, 7, 58, 20, '#1c2a1c'); G.text('C', 246, 13, { size: 8, color: gk >= 1 ? '#9cff40' : '#667' }); R(c, 258, 14, 36, 6, '#111'); R(c, 259, 15, Math.round(34 * gk), 4, gk >= 1 ? '#9cff40' : '#587030');
    if (pl.nitro > 0) { const ny = (this.mode === 'race' || this.mode === 'win' || this.mode === 'lose') ? 58 : 36; R(c, 42, ny, 124, 8, '#0a0a0c'); R(c, 44, ny + 2, Math.round(120 * pl.nitro / 3.2), 4, '#60b0ff'); }
    G.text(Math.round(pl.speed * 0.4) + ' км/ч', 164, 23, { size: 8, align: 'right', color: '#c8d0d8' });
    const boss = this.cars.find(b => b.d.boss && !b.dead && this.onScreen(b, 120));
    if (boss) { const bw = 200, bx = (W - bw) / 2; R(c, bx - 2, H - 34, bw + 4, 14, '#0a0a0c'); R(c, bx, H - 32, bw, 10, '#2a1010'); R(c, bx, H - 32, Math.round(bw * U.clamp(boss.hp / boss.maxhp, 0, 1)), 10, '#e03030'); G.text(boss.d.name, W / 2, H - 31, { size: 8, align: 'center', color: '#fff' }); }
    const mx = W - 134, my = 6, mw = 128, mh = 74, bx0 = 190, by0 = 140, bw0 = 1075 - 190, bh0 = 640 - 140, sc = Math.min((mw - 12) / bw0, (mh - 12) / bh0);
    R(c, mx - 2, my - 2, mw + 4, mh + 4, '#0a0a0c'); R(c, mx, my, mw, mh, 'rgba(24,30,28,0.9)');
    const P = (x, y) => [mx + 6 + (x / K5 - bx0) * sc, my + 6 + (y / K5 - by0) * sc];
    for (const lm of L5.world.lands) { const [a, b] = P(lm.x, lm.y); R(c, a - 1, b - 1, 3, 3, '#7a7a52'); }
    c.strokeStyle = '#5a6068'; c.lineWidth = 3; c.beginPath(); L5.ROUTE.forEach(([x, y], i) => { const [a, b] = P(x, y); i ? c.lineTo(a, b) : c.moveTo(a, b); }); c.stroke();
    c.strokeStyle = '#f06a14'; c.lineWidth = 2; c.beginPath(); let started = false;
    for (let s = 0; s <= pl.s; s += 200) { const q = L5.at(s), [a, b] = P(q.x, q.y); started ? c.lineTo(a, b) : c.moveTo(a, b); started = true; } { const q = L5.at(pl.s), [a, b] = P(q.x, q.y); c.lineTo(a, b); } c.stroke();
    const fq = L5.at(L5.LEN), [fx, fy] = P(fq.x, fq.y); R(c, fx - 2, fy - 2, 4, 4, ((G.t * 3 | 0) % 2) ? '#fff' : '#222');
    for (const k of this.cars) { if (k.cop && !k.dead) { const [a, b] = P(k.x, k.y); R(c, a - 1, b - 1, k.d.boss ? 4 : 3, k.d.boss ? 4 : 3, ((G.t * 4 | 0) % 2) ? '#4a7aff' : '#ff3a3a'); } if (k.isMatiz) { const [a, b] = P(k.x, k.y); R(c, a - 2, b - 2, 4, 4, '#ffd020'); } }
    { const [a, b] = P(pl.x, pl.y); R(c, a - 2, b - 2, 5, 5, '#fff'); R(c, a - 1, b - 1, 3, 3, '#f06a14'); }
    if (this.mode === 'count') { const n = Math.ceil(this.race.t); if (n <= 3 && n > 0) G.text(String(n), W / 2, 120, { size: 48, align: 'center', color: '#ffd84a', outline: true }); else G.text('ПРИГОТОВИЛСЯ!', W / 2, 130, { size: 16, align: 'center', color: '#fff', outline: true }); }
    if (this.mode === 'race' || this.mode === 'win' || this.mode === 'lose') {
      const m = this.matiz, gap = Math.round((pl.s - m.s) / 10); const ahead = gap >= 0;
      G.text(ahead ? 'ВПЕРЕДИ НА ' + gap + ' м' : 'ОТСТАВАНИЕ ' + (-gap) + ' м', 42, 36, { size: 8, color: ahead ? '#8cf08c' : '#ff7a5a' });
      const left = Math.max(0, Math.round((L5.S_END - pl.s) / 10)); G.text('ДО ФИНИША: ' + left + ' м', 42, 47, { size: 8, color: '#fff' });
    }
    if (this.hint > 0 && (this.mode === 'drive' || this.mode === 'race')) { const t = this.hintText || 'Стрелки — руль.  Пробел — ручник.  X — Вова стреляет.  C — газовая граната.  Q — гудок'; G.text(t, W / 2, H - 20, { size: 8, align: 'center', color: '#fff', outline: true }); }
    if (this.titleT > 0) G.bigTitle(c, this.titleText, Math.min(1, this.titleT), { size: this.titleText === 'ГОНИ!' || this.titleText === 'ПОБЕДА!' ? 32 : 16, y: 70, color: this.titleText === 'ГОНИ!' ? '#6adc50' : '#ffd84a' });
  }
};
