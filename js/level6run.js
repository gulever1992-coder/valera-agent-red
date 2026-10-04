'use strict';
// ============ УРОВЕНЬ 6: мир, режим прохождения ============
// платформы-холмы: [кадр plat6, доля высоты от верха до поверхности, ширина поверхности]
const PLATDEF = { hill: [0, 0.26, 0.8], moss: [1, 0.3, 0.72], log: [2, 0.38, 0.86], log2: [3, 0.42, 0.86], stump: [4, 0.14, 0.62], boulder: [5, 0.26, 0.7], dune: [6, 0.36, 0.7], drift: [7, 0.35, 0.8], slab: [8, 0.32, 0.8], plank: [9, 0.2, 0.9], island: [10, 0.4, 0.7] };
const DECO = { mush: 0, fern: 1, cattail: 2, sign: 3, camp: 4, tire: 5, bones: 6, birch: 7 };
L6.EAT_X = 1900;
L6.WIZ_X = 7000;
L6.ZONES = [{ id: 'forest', x0: 0, x1: 3600 }, { id: 'bog', x0: 3600, x1: 6400 }, { id: 'forest', x0: 6400, x1: 9400 }, { id: 'dunes', x0: 9400, x1: L6.W }];
L6.zoneW = function (x) {
  // веса зон forest/bog/dunes с плавным переходом ±250 px
  const w = { forest: 0, bog: 0, dunes: 0 };
  for (const z of L6.ZONES) {
    const a = U.clamp((x - (z.x0 - 250)) / 500, 0, 1), b = U.clamp(((z.x1 + 250) - x) / 500, 0, 1);
    const k = z.x0 === 0 ? b : z.x1 >= L6.W ? a : Math.min(a, b);
    w[z.id] = Math.max(w[z.id], U.easeInOut(U.clamp(k, 0, 1)));
  }
  const s = w.forest + w.bog + w.dunes || 1;
  w.forest /= s; w.bog /= s; w.dunes /= s;
  return w;
};

L6.build = function () {
  const D = { plats: [], props: [], foes: [], pickups: [], checkpoints: [], hints: [], clouds: [] };
  const G0 = L6.GROUND;
  const plat = (name, x, sx, sy) => { D.plats.push({ name, x, sx: sx || 1, sy: sy || 1 }); };
  [['hill', 720], ['moss', 1260], ['log', 1520],
    ['hill', 2450], ['stump', 2900], ['log2', 3250],
    ['island', 3900], ['island', 4330], ['plank', 4720], ['moss', 5120], ['island', 5520], ['slab', 5960],
    ['hill', 6700], ['boulder', 7340], ['log', 7680], ['hill', 8300], ['stump', 8760], ['moss', 9120],
    ['dune', 9700], ['drift', 10120], ['dune', 10620], ['dune', 11200], ['drift', 11700], ['dune', 12220], ['boulder', 12720], ['dune', 13220], ['dune', L6.ARENA_X + 75, 1.25, 2.1], ['log2', L6.ARENA_X + 205], ['dune', L6.ARENA_X + 320, 1.15, 2.6], ['drift', L6.ARENA_X + 445], ['dune', L6.ARENA_X + 565, 1.25, 2.1]].forEach(p => plat(p[0], p[1], p[2], p[3]));   // на арене дюны высокие: многоуровневый бой
  // декор по зонам (спрайты deco6)
  const r = U.seeded(66);
  for (let x = 120; x < L6.ARENA_X; x += r.int(45, 105)) {
    const z = L6.zoneW(x);
    let kind;
    if (z.dunes > 0.6) kind = r.pick(['bones', 'tire', 'fern', 'sign', 'mush']);
    else if (z.bog > 0.5) kind = r.pick(['cattail', 'cattail', 'mush', 'fern', 'tire']);
    else kind = r.pick(['fern', 'mush', 'fern', 'camp', 'mush', 'fern']);
    if (kind === 'camp' && r() < 0.6) kind = 'fern';
    if (x < L6.EAT_X + 60 && kind === 'mush') kind = 'fern';   // до сюжетного гриба грибов нет
    D.props.push({ kind, x, y: G0 + r.int(-1, 6), s: r.range(0.8, 1.25), back: true });
  }
  // фоновые брёвна/камни/кочки (без коллизии) для глубины
  D.scen = [];
  for (let x = 300; x < L6.ARENA_X; x += r.int(260, 520)) { const z = L6.zoneW(x); D.scen.push({ fr: z.dunes > 0.6 ? r.pick([6, 7, 8]) : z.bog > 0.5 ? r.pick([1, 2, 9]) : r.pick([0, 1, 2, 3, 4, 5]), x, s: r.range(0.55, 0.8) }); }
  const f = (type, x, o) => D.foes.push({ type, x, o: o || {} });
  const pick = (kind, x) => D.pickups.push({ kind, x });
  // лес: враги после гриба
  f('amanita', 2250); f('amanita', 2380); f('mowgli', 2450, { plat: 'hill' }); f('crow', 2700); f('yeti', 2780); f('rose', 3050); f('nettle', 3330); f('mowgli', 3250, { plat: 'log2' });
  // болото
  f('beaver', 3800); f('beaver', 3960); f('amanita', 4200); f('crow', 4300); f('rose', 4520); f('mowgli', 4720, { plat: 'plank' }); f('beaver', 4900); f('nettle', 5050); f('yeti', 5400); f('amanita', 5600); f('amanita', 5700); f('crow', 5800); f('rose', 6100);
  // лес до и после палочки
  f('nettle', 6600); f('beaver', 6850);
  f('mowgli', 7340, { plat: 'boulder' }); f('amanita', 7500); f('amanita', 7640); f('crow', 7800); f('yeti', 8000); f('mowgli', 8300, { plat: 'hill' }); f('rose', 8450); f('nettle', 8650); f('amanita', 8900); f('crow', 9000);
  // дюны
  f('yeti', 9800); f('mowgli', 10120, { plat: 'drift' }); f('nettle', 10000); f('rose', 10300); f('beaver', 10450); f('crow', 10550); f('amanita', 10750); f('amanita', 10860); f('yeti', 11050); f('nettle', 11350); f('crow', 11450); f('mowgli', 11700, { plat: 'drift' }); f('rose', 11900); f('amanita', 12050); f('beaver', 12300); f('yeti', 12500); f('nettle', 12800); f('crow', 12900); f('amanita', 13050); f('rose', 13400); f('nettle', 13600);
  [2450, 3700, 4700, 5800, 6900, 8000, 9100, 10200, 11300, 12200, 12900, 13600].forEach(x => pick('growshroom', x));
  // предметы для итоговой статистики: монеты, еда, значки-секреты (на верхушках деревьев-ворот)
  { const rc = U.seeded(17); for (let x = 400; x < L6.ARENA_X - 200; x += rc.int(240, 420)) { if (L6.GATES.some(g => x > g.x - 200 && x < g.x + 400)) continue; pick('coin', x); } }
  [1300, 5200, 8600, 12000].forEach(x => pick('pie', x)); pick('kefir', 10500);
  D.pickups.push({ kind: 'badge', x: 60 });
  if (window.TREE6) for (const g of L6.GATES) { const pl_ = window.TREE6.plats;
    for (const [dx, hh, ww] of pl_) if (hh > 150 && hh < 500) D.pickups.push({ kind: 'coin', x: g.x + dx + ww * 0.5, y: L6.GROUND - hh - 40 });
    const top = pl_[pl_.length - 1]; D.pickups.push({ kind: 'badge', x: g.x + top[0] + top[2] / 2, y: L6.GROUND - top[1] - 40 }); }
  [3400, 6250, 9350, 11550].forEach(x => D.checkpoints.push({ x }));
  // гадюки ползают по земле
  for (let vx = 1450; vx < L6.ARENA_X - 300; vx += 620 + (vx * 13) % 180) { if (D.checkpoints.some(k => Math.abs(k.x - vx) < 100)) continue; f('viper', vx);  }
  // усложнение: вторая волна врагов между основными
  { const T = ['amanita', 'nettle', 'rose', 'beaver', 'crow', 'amanita', 'yeti', 'nettle', 'crow', 'rose'], r2 = U.seeded ? null : null; let i = 0;
    for (let x = 2500; x < 13500; x += 215 + (i * 37) % 90, i++) { if (D.foes.some(q => Math.abs(q.x - x) < 90)) continue; if (D.checkpoints.some(k => Math.abs(k.x - x) < 120)) continue; f(T[i % T.length], x); } }
  // ориентиры по маршруту
  D.lms = []; D.gates = L6.GATES;
  { const rl = U.seeded(77); let x = 260, last = -1;
    D.lms.push({ fr: 4, x: 520, s: 1 });   // разбитая машина у начала пути
    for (; x < L6.ARENA_X - 200; x += rl.int(150, 300)) {
      if (Math.abs(x - L6.EAT_X) < 140 || Math.abs(x - L6.WIZ_X) < 140 || Math.abs(x - 520) < 160) continue;
      if (D.checkpoints.some(k => Math.abs(k.x - x) < 110) || L6.GATES.some(g => x > g.x - 160 && x < g.x + 470)) continue;
      const z = L6.zoneW(x), pool = z.dunes > 0.5 ? LMPOOL.dunes : z.bog > 0.5 ? LMPOOL.bog : LMPOOL.forest;
      let fr; do { fr = rl.pick(pool); } while (fr === last); last = fr;
      D.lms.push({ fr, x, s: rl.range(0.92, 1.08) });
    }
  }
  for (const g of L6.GATES) D.lms.push({ fr: 5, x: g.x + 90, s: 1 });
  // маугли живут на деревьях-воротах: сидят на ветках, швыряются шишками, прыгают на героя
  if (window.TREE6) for (const g of L6.GATES) { const pls = window.TREE6.plats, br = pls.filter(p_ => p_[1] <= 290).map(([dx, hh, ww]) => ({ x: g.x + dx + ww / 2, y: L6.GROUND + 3 - hh, w: ww }));   // маугли на нижних ветках (видны с земли), прыгают по веткам
    for (const i of [0, 3, 6]) { const q = br[i]; if (q) D.foes.push({ type: 'mowgli', x: q.x, o: { at: q, branches: br } }); } }
  D.hints.push({ x: 0, w: 420, text: 'Идти по следам: {left} {right}. Прыжок — {jump}.' });
  D.hints.push({ x: 2000, w: 500, text: 'Бей кулаками {punch}. Вороны пикируют — уворачивайся!' });
  D.hints.push({ x: 4700, w: 300, text: 'Бобёр бьёт хвостом, а струю пускает назад — не стой за ним!' });
  D.hints.push({ x: 9400, w: 500, text: 'Дюны. Где-то здесь логово Ванделорда. Впереди — мост.' });
  return D;
};

// гриб-усилитель: Валера вырастает на 5 секунд
L6.GrowPick = class extends Game.Pickup {
  constructor(x, y) { super('coin', x, y); }
  update(dt, world, pl) {
    this.t += dt;
    if (this.falling) { const py = this.y; this.vy = Math.min(500, this.vy + GRAV * 0.6 * dt); this.y += this.vy * dt; const g = world.groundAt(this.x, py, this.y, 2); if (g) { this.y = g.y; this.falling = false; this.vy = 0; } }
    if (!pl.dead && U.overlap(this.box, pl.box)) { this.dead = true; pl.heal(25); pl.grow(); Sound.play('heal'); G.flash(0.12); FX.popText(this.x, this.y - 24, 'ГРИБ! +ЗДОРОВЬЕ, x2 на 5 сек', '#ff9a9a'); }
  }
  draw(c, cx, cy) { Spr.drawC(c, 'items6', 3, this.x - cx, this.y - cy + Math.sin(this.t * 4) * 2, 0, 1.0); }
};

// ориентиры lm6 (большие цельные объекты, как здания в ур.2): кадр -> опорная площадка (доля высоты сверху, доля ширины)
const LMDEF = { 4: [0.4, 0.5], 5: [0.36, 0.8], 7: [0.4, 0.7], 10: [0.1, 0.5], 11: [0.3, 0.9], 12: [0.3, 0.75], 13: [0.2, 0.5], 14: [0.08, 0.6], 16: [0.28, 0.7], 17: [0.3, 0.6] };
const LMPOOL = { forest: [0, 1, 2, 3, 1, 2, 5, 0, 3, 1], bog: [6, 7, 8, 9, 10, 11, 6, 9, 7], dunes: [12, 14, 15, 17, 12, 15, 14, 17] };
L6.SINK = 12;   // насколько основания объектов утоплены в землю (иначе «висят»)
L6.FRONT = { log: 1, log2: 1 };   // коряги (drift) — позади персонажей   // брёвна и коряги — перед персонажами, стоящими на земле
// персонажи, стоящие НА таком бревне, перерисовываются поверх него
L6.drawFront = (c, plats, cx, actors) => { let any = false; for (const p of plats) if (L6.FRONT[p.name] && p.x - cx > -300 && p.x - cx < W + 300) { L6.drawPlat(c, p, cx); any = true; }
  if (!any) return;
  for (const a of actors) { if (!a) continue;
    const pl = plats.find(p => L6.FRONT[p.name] && Math.abs(a.x - p.x) < p.sw / 2 + 20);
    if (a.force || (pl && a.y < L6.GROUND - 6)) { a.redraw(); continue; }
    if (pl) { c.save(); c.beginPath(); c.rect(-50, -400, W + 100, pl.top + 4 + 400); c.clip(); a.redraw(); c.restore(); } } };   // стоит за бревном: видно всё выше бревна
L6.drawPlat = (c, p, cx) => { c.save(); c.translate(Math.round(p.x - cx), L6.GROUND + 2 + L6.SINK); c.scale(p.sx || 1, p.sy || 1); Spr.draw(c, 'plat6', p.fr, 0, 0, 1); c.restore(); };
L6.GATES = [{ x: 3050, tree: 0, wall: 3 }, { x: 7550, tree: 0, wall: 3 }, { x: 12650, tree: 15, wall: 14 }];

// ---------- режим прохождения ----------
L6.Run = class {
  constructor(level) {
    this.level = level;
    const D = this.D = L6.build();
    const wd = this.world = new Game.World(L6.W, H);
    wd.stats = level.stats; wd.score = level.score;
    level.stats.secretsTotal = D.pickups.filter(p => p.kind === 'badge').length;
    wd.addScore = n => { wd.score += n; level.score = wd.score; };
    wd.addPlat({ x: 0, y: L6.GROUND, w: L6.W, h: 80, oneway: false, look: 'none' });
    wd.castSpell = (k, x, y, dir, up, o) => { const sp = new L6.Spell(k, x, y, dir, up, o); this.spells.push(sp); return sp; };
    wd.targets = () => this.world.enemies.filter(e => !e.dead && e.dieT == null && e.awake);
    wd.playerAttack = (hb, dmg, atk, pl) => this.playerAttack(hb, dmg, atk, pl);
    wd.spawnPlayerProj = () => {};
    this.props = D.props; this.fx = []; this.spells = []; this.shots = []; this.clouds = [];
    // платформы
    this.platSpr = D.plats.map(p => {
      const def = PLATDEF[p.name], f = Spr.frame('plat6', def[0]); const w = f ? f[2] / 2 : 100, h = f ? f[3] / 2 : 40;
      const top = L6.GROUND + L6.SINK - h * p.sy * (1 - def[1]), sw = w * p.sx * def[2];
      wd.addPlat({ x: p.x - sw / 2, y: top, w: sw, h: 8, oneway: true, look: 'none' });
      return Object.assign({}, p, { fr: def[0], top, w, h, sw });
    });
    this.lms = D.lms;
    { const rf = U.seeded(91); this.fgs = []; let fx = 150;
      for (; fx < L6.ARENA_X; fx += rf.int(260, 440)) {
        const dn = L6.zoneW(fx).dunes > 0.5, r = rf();
        if (dn) { this.fgs.push({ fr: rf.pick([8, 9, 10, 11, 12, 13, 8, 10]), x: fx, s: rf.range(0.8, 1.3), dy: rf.int(30, 66) }); continue; }
        if (r < 0.2) this.fgs.push({ fr: 2, x: fx, s: rf.range(0.8, 1.2), top: true, dy: 0 });
        else this.fgs.push({ fr: rf.pick([0, 1, 4, 5, 6, 7, 4]), x: fx, s: rf.range(0.85, 1.35), dy: rf.int(34, 70) });
      } }
    D.foes = D.foes.filter(f => (f.o && f.o.at) || !L6.GATES.some(g => f.x > g.x - 180 && f.x < g.x + 450));
    const GY = L6.GROUND + 3;
    for (const m of this.lms) { const d = LMDEF[m.fr], f = Spr.frame('lm6', m.fr); if (!d || !f) continue; const w = f[2] / 2 * m.s, h = f[3] / 2 * m.s; wd.addPlat({ x: m.x - w * d[1] / 2, y: GY + L6.SINK - h * (1 - d[0]), w: w * d[1], h: 8, oneway: true, look: 'none' }); }
    // «ворота»: огромное дерево + высокая стена-ствол. Надо залезть по веткам до кроны, перепрыгнуть на стену и спрыгнуть вниз
    this.gateSpr = [];
    const T6 = window.TREE6;
    L6.HELP = [];   // одна доска-ступенька до первой ветки   // доски-ступени, чтобы достать до нижних веток
    if (T6) for (const g of L6.GATES) {
      const wx = g.x + 250;
      for (const [dx, hh, ww] of T6.plats) wd.addPlat({ x: g.x + dx, y: GY - hh, w: ww, h: 8, oneway: true, look: 'none' });
      for (const [dx, hh, ww] of L6.HELP) wd.addPlat({ x: g.x + dx, y: GY - hh, w: ww, h: 8, oneway: true, look: 'none' });
      { const bh = Math.max(T6.blockH, T6.wallPlat[1] - 16); wd.addPlat({ x: wx - T6.blockW / 2, y: GY - bh, w: T6.blockW, h: bh, oneway: false, look: 'none' }); }          // ствол-преграда (твёрдый)
      wd.addPlat({ x: wx + T6.wallPlat[0], y: GY - T6.wallPlat[1], w: T6.wallPlat[2], h: 8, oneway: true, look: 'none' });          // верх кроны
      this.gateSpr.push({ g, wx });
    }
    wd.enemies = D.foes.map(fd => {
      const o = Object.assign({}, fd.o);
      if (o.at) { o.y = o.at.y; o.x1 = o.at.x - o.at.w * 0.4; o.x2 = o.at.x + o.at.w * 0.4; o.perch = true; o.baseOnPlat = o.at.y; delete o.at; }
      if (o.plat) { const pl = this.platSpr.reduce((b, p) => (!b || Math.abs(p.x - fd.x) < Math.abs(b.x - fd.x)) && p.name === o.plat ? p : b, null); if (pl) { o.y = pl.top; o.x1 = fd.x - pl.sw * 0.4; o.x2 = fd.x + pl.sw * 0.4; o.perch = true; o.baseOnPlat = pl.top; } delete o.plat; }
      return new L6.Foe(fd.type, fd.x, o);
    });
    wd.pickups = D.pickups.map(p => { const k = p.kind === 'growshroom' ? new L6.GrowPick(p.x, 0) : new Game.Pickup(p.kind, p.x, p.y || 0); k.falling = true; return k; });
    wd.checkpoints = D.checkpoints.map(c => Object.assign({ active: false, y: L6.GROUND }, c));
    this.hints = D.hints.map(h => Object.assign({ shown: 0 }, h));
    this.player = new L6.Player(level.startX || 90, L6.GROUND);
    if (level.grown) { this.player.sc = 1.5; this.player.grow(); }
    if (level.wand) this.player.hasWand = true;
    if (level.hp) this.player.hp = level.hp;
    this.respawn = { x: this.player.x };
    wd.cam.x = U.clamp(this.player.x - 200, 0, L6.W - W);
    this.fade = 1; this.hint = null; this.hintA = 0; this.quipT = 22; this.done = false; this.eatDone = !!level.grown; this.wizDone = !!level.wand; this.t = 0;
    this.eatProp = this.eatDone ? null : { x: L6.EAT_X }; this.wizProp = { x: L6.WIZ_X, fr: this.wizDone ? 1 : 0 };
    this.skip = null; this.chain = false; this.deadFoes = 0;
  }
  // эффект превращения врага (вместо обычной смерти)
  transform(foe, id) {
    const s = foe.snap();
    this.skip = foe;
    const E = L6.Fx;
    let fx;
    switch (id) {
      case 'fire': fx = new E.Ash(s, this); break;
      case 'ice': fx = new E.Ice(s, this); break;
      case 'bolt': fx = new E.Bolt(s, this); break;
      case 'slime': fx = new E.Bunny(s, this); break;
      case 'skull': fx = new E.Portal(s, this); break;
      case 'star': fx = new E.Burst(s, this); break;
      case 'rainbow': fx = Math.random() < 0.5 ? new E.Flower(s, this) : new E.Balloon(s, this); break;
      default: fx = new E.Bats(s, this);
    }
    this.skip = null;
    this.fx.push(fx);
    this.world.addScore(foe.score); this.world.stats.kills++;
    foe.gone = true;
  }
  playerAttack(hb, dmg, atk, pl) {
    for (const e of this.world.enemies) {
      if (atk.hit.has(e) || e.dieT != null || e.dead) continue;
      if (U.overlap(hb, e.box)) {
        atk.hit.add(e);
        const killed = e.hit(dmg, pl.facing);
        Sound.play('hit'); G.hitStop = 0.05; G.shake(2, 0.1);
        FX.burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 6, { colors: ['#fff', '#ffd84a'], speed: 120, life: 0.25, grav: 0 });
        if (killed) { this.world.addScore(e.score); this.world.stats.kills++; FX.popText(e.x, e.y - e.d.h - 10, '+' + e.score); }
      }
    }
  }
  update(dt) {
    const wd = this.world, pl = this.player;
    this.t += dt;
    wd.t += dt; if (!this.done) this.level.stats.time += dt;
    if (this.fade > 0 && !this.respawning) this.fade = Math.max(0, this.fade - dt * 2);
    wd.updatePlats(dt);
    pl.update(dt, wd);
    pl.x = U.clamp(pl.x, 10, L6.ARENA_X + 40);
    for (const e of wd.enemies) e.update(dt, this, pl);
    wd.enemies = wd.enemies.filter(e => !e.dead);
    for (const sp of this.spells) {
      sp.update(dt, wd);
      if (sp.dead) continue;
      for (const e of wd.targets()) {
        if (sp.hitSet.has(e)) continue;
        if (U.overlap(sp.box, e.box)) {
          sp.hitSet.add(e);
          L6.zapMul = sp.mul; e.zap(sp.k, this); L6.zapMul = 1;
          Sound.play('hit'); G.hitStop = 0.04;
          if (sp.hitSet.size > sp.pierce) { sp.dead = true; FX.burst(sp.x, sp.y, 8, { colors: ['#fff', '#c8a0ff', '#ffd84a'], speed: 140, life: 0.3, grav: 0 }); break; }
        }
      }
    }
    this.spells = this.spells.filter(s => !s.dead);
    for (const s of this.shots) s.update(dt, this, pl);
    this.shots = this.shots.filter(s => !s.dead);
    for (const f of this.fx) f.alive = f.update(dt, this);
    this.fx = this.fx.filter(f => f.alive);
    for (const p of wd.pickups) p.update(dt, wd, pl);
    wd.pickups = wd.pickups.filter(p => !p.dead);
    for (const cl of this.clouds) {
      cl.t += dt;
      if (cl.t < cl.life && Math.abs(pl.x - cl.x) < cl.r && Math.abs(pl.y - 36 * pl.sc - cl.y) < 46 * pl.sc) { cl.dmgT = (cl.dmgT || 0) - dt; if (cl.dmgT <= 0) { cl.dmgT = 0.5; pl.hurt(4, cl.x, wd); } }
    }
    this.clouds = this.clouds.filter(cl => cl.t < cl.life);
    for (const cp of wd.checkpoints) if (!cp.active && Math.abs(pl.x - cp.x) < 24 && !pl.dead) { cp.active = true; this.respawn = { x: cp.x }; Sound.play('checkpoint'); pl.heal(15); FX.popText(cp.x, L6.GROUND - 70, 'КОНТРОЛЬНАЯ ТОЧКА', '#8cf08c'); }
    let hint = null;
    for (const h of this.hints) if (!h.done && pl.x > h.x && pl.x < h.x + h.w) { hint = h; h.shown += dt; if (h.shown > 6) h.done = true; }
    if (hint) { this.hint = hint; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
    // сюжетные точки
    if (!this.eatDone && pl.x > L6.EAT_X - 30 && pl.onGround && !pl.dead) { this.eatDone = true; this.level.sceneEat(this); }
    else if (!this.wizDone && pl.x > L6.WIZ_X - 70 && pl.onGround && !pl.dead) { this.wizDone = true; this.level.sceneWand(this); }
    this.quipT -= dt;
    if (this.quipT <= 0 && !pl.dead && this.eatDone) { this.quipT = U.rand(20, 30); G.say(pl, U.choice(['Вова, где ты?!', 'Грибной лес какой-то...', 'Следы ведут дальше.', 'Выживу — съем пельменей.']), 2); }
    const tx = U.clamp(pl.x - W * 0.4 + pl.facing * 30, 0, L6.W - W);
    wd.cam.x += (tx - wd.cam.x) * Math.min(1, dt * 5);
    { const tgt = Math.max(0, Math.min(760, 175 - pl.y)); this.camUp = (this.camUp || 0) + (tgt - (this.camUp || 0)) * Math.min(1, dt * 6); }
    if (pl.dead && pl.deadT > 1.6 && !this.respawning) this.respawning = true;
    if (this.respawning) {
      this.fade = Math.min(1, this.fade + dt * 2.5);
      if (this.fade >= 1) {
        this.respawning = false; this.level.stats.deaths++;
        const np = new L6.Player(this.respawn.x, L6.GROUND);
        np.sc = 1; np.scT = 1; np.hasWand = pl.hasWand;
        this.player = np; this.shots = []; this.clouds = []; this.spells = [];
        wd.cam.x = U.clamp(np.x - 200, 0, L6.W - W);
        G.say(np, U.choice(['Так, ещё разок!', 'Я не сдамся!', 'Вова ждёт!']), 1.5);
      }
    }
    if (!this.done && pl.x > L6.ARENA_X + 30 && !pl.dead) { this.done = true; pl.controls = false; this.level.reachArena(this); }
  }
  // ---------- рисование ----------
  tile(c, img, off, y, w, h, alpha) {
    if (!img) return;
    let x = -((off % w) + w) % w;
    if (alpha != null) c.globalAlpha = alpha;
    for (; x < W; x += w) c.drawImage(img, Math.floor(x), y, Math.ceil(w) + 1, h);
    c.globalAlpha = 1;
  }
  // смена зоны «шторкой»: граница едет с параллаксом слоя, мягкий край ±soft — без полупрозрачных призраков и видимых стыков
  wipe(c, camX, p, layerOf, soft, vfade) {
    const cx = camX + W / 2, Zs = L6.ZONES;
    let i = 0; while (i < Zs.length - 1 && cx > Zs[i].x1) i++;
    let b = null;   // ближайшая граница зон к центру кадра
    if (i < Zs.length - 1 && Zs[i].x1 - cx < W / p) b = { x: Zs[i].x1, A: Zs[i].id, B: Zs[i + 1].id };
    if (i > 0 && cx - Zs[i].x0 < W / p && (!b || cx - Zs[i].x0 < Zs[i].x1 - cx)) b = { x: Zs[i].x0, A: Zs[i - 1].id, B: Zs[i].id };
    const cur = Zs[i].id;
    const sb = b ? (b.x - cx) * p + W / 2 : 0, one = !b ? cur : sb < -soft ? b.B : sb > W + soft ? b.A : null;
    if (one && !vfade) { layerOf(one)(c); return; }
    const m = c.getTransform(), oc = L6._oc || (L6._oc = document.createElement('canvas'));
    if (oc.width !== c.canvas.width || oc.height !== c.canvas.height) { oc.width = c.canvas.width; oc.height = c.canvas.height; }
    const ox = oc.getContext('2d');
    for (const [id, left] of one ? [[one, null]] : [[b.A, true], [b.B, false]]) {
      const fn = layerOf(id); if (!fn) continue;
      ox.setTransform(1, 0, 0, 1, 0, 0); ox.clearRect(0, 0, oc.width, oc.height);
      ox.setTransform(m); ox.imageSmoothingEnabled = false; fn(ox);
      ox.setTransform(1, 0, 0, 1, 0, 0); ox.globalCompositeOperation = 'destination-in';
      if (left !== null) { const x0 = (sb - soft) * m.a, x1 = (sb + soft) * m.a, g = ox.createLinearGradient(x0, 0, x1, 0);
        g.addColorStop(0, left ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)'); g.addColorStop(1, left ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,1)');
        ox.fillStyle = g; ox.fillRect(0, 0, oc.width, oc.height); }
      if (vfade) { const y0 = vfade[0] * m.d + m.f, y1 = vfade[1] * m.d + m.f, g = ox.createLinearGradient(0, y0, 0, y1);   // верх слоя растворяется в небе
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); ox.fillStyle = g; ox.fillRect(0, 0, oc.width, oc.height); }
      ox.globalCompositeOperation = 'source-over';
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(oc, 0, 0); c.restore();
    }
  }
  drawBackdrop(c, camX) {
    const I = L6.img, GRD = L6.GROUND, gy = GRD - 5;
    const cu = this.camUp || 0;
    // слой с вертикальным параллаксом f (0 — прибит к экрану, 1 — едет с миром)
    const lay = (f, fn) => { c.save(); c.translate(0, -cu * (1 - f)); fn(); c.restore(); };
    const top = im => { if (!im) return '#000'; if (!im._top) { const cv = document.createElement('canvas'); cv.width = 1; cv.height = 1; const x = cv.getContext('2d'); x.drawImage(im, 0, 0, im.width, 1, 0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; im._top = `rgb(${d[0]},${d[1]},${d[2]})`; } return im._top; };
    const tileOn = (cc, im, off, y, w, h) => { let x = -((off % w) + w) % w; for (; x < W; x += w) cc.drawImage(im, Math.floor(x), y, Math.ceil(w) + 1, h); };
    // 1) небо (отдельный слой, почти неподвижен)
    lay(0.02, () => { const im = I.sky; if (!im) return; c.fillStyle = top(im); c.fillRect(0, -cu - 10, W, cu + 12);   // небо одним широким кадром — без стыков тайлов
      const off = camX * 0.03, n0 = Math.floor(off / 640);   // тайлы через один зеркально: края совпадают, стыка не видно
      for (let n = n0; n * 640 - off < W; n++) { const x = Math.floor(n * 640 - off); if (n % 2) { c.save(); c.translate(x + 640, 0); c.scale(-1, 1); c.drawImage(im, 0, 0, 641, 480); c.restore(); } else c.drawImage(im, x, 0, 641, 480); } });
    // 2) далёкий город в дымке + 3) лесистые холмы — только над лесом и болотом
    const farOf = id => id === 'dunes' ? null : cc => {
      if (I.city) { const h = I.city.height / 2, w = I.city.width / 2; cc.globalAlpha = 0.9; tileOn(cc, I.city, camX * 0.07, GRD - 40 - h, w, h); cc.globalAlpha = 1; }
      if (I.far) { const h = I.far.height / 2, w = I.far.width / 2; tileOn(cc, I.far, camX * 0.16, GRD - 22 - h, w, h); } };
    lay(0.04, () => this.wipe(c, camX, 0.16, id => farOf(id) || (() => {}), 140));
    // 4) средний план зоны (исходные слои)
    const midOf = id => cc => { const im = I[id]; if (!im) return;
      const tw = im.width / 2, th = im.height / 2, ty = gy + 8 - th;
      tileOn(cc, im, camX * 0.36, ty, tw, th);
      if (cu > 1) { let x = -(((camX * 0.36) % tw) + tw) % tw; const sh = im.height * 0.35;   // низ слоя продлён зеркальным отражением подлеска (без растянутых полос)
        for (; x < W; x += tw) { cc.save(); cc.translate(0, ty + th * 2 - 2); cc.scale(1, -1); cc.drawImage(im, 0, im.height - sh, im.width, sh, Math.floor(x), th - sh / 2, Math.ceil(tw) + 1, sh / 2); cc.restore(); } } };
    { const mt = gy + 8 - Math.max(...['forest', 'bog', 'dunes'].map(k => I[k] ? I[k].height / 2 : 0));   // верх самого высокого слоя
      lay(0.07, () => this.wipe(c, camX, 0.36, midOf, 110, [mt - 4, mt + 130])); }   // по вертикали почти неподвижен: при лазании по деревьям верх слоя не открывается
    // 5) земля
    const grOf = id => cc => { const im = I[{ forest: 'gr_forest', bog: 'gr_bog', dunes: 'gr_sand' }[id]]; if (im) tileOn(cc, im, camX, gy, 640, Math.round(im.height / 2)); };
    this.wipe(c, camX, 1, grOf, 160);
    c.fillStyle = '#0c0d10'; c.fillRect(0, gy + 75, W, H);
    this.grOf = grOf;
  }
  // кромка земли с неровным (травяным) верхом поверх оснований объектов — нет ровной линии и «висящих» низов
  drawGroundLip(c, camX) {
    if (!this.grOf) return; const gy = L6.GROUND - 5;
    c.save(); c.beginPath(); c.moveTo(0, H);
    for (let sx = 0; sx <= W + 4; sx += 4) { const wx = sx + camX; const n = Math.sin(wx * 0.071) * 2.5 + Math.sin(wx * 0.193 + 1.3) * 2 + ((wx * 7919 | 0) % 7 === 0 ? -5 : 0) + ((wx * 104729 | 0) % 11 === 0 ? -3 : 0); c.lineTo(sx, gy + 6 + n); }
    c.lineTo(W + 4, H); c.closePath(); c.clip();
    this.wipe(c, camX, 1, this.grOf, 160); c.restore();
  }
  drawWorld(c, camX, o = {}) {
    this.drawBackdrop(c, camX);
    for (const m of this.lms) if (m.x - camX > -260 && m.x - camX < W + 260) Spr.draw(c, 'lm6', m.fr, m.x - camX, L6.GROUND + 3 + L6.SINK, 1, { scale: m.s });
    for (const gs of this.gateSpr) { const g = gs.g, T6 = window.TREE6, I = L6.img; if (g.x - camX > -300 && g.x - camX < W + 300) {
      if (I.treeT) c.drawImage(I.treeT, Math.round(g.x - camX - T6.w / 2), Math.round(L6.GROUND + 3 - T6.h), T6.w, T6.h);
      if (I.wallT) c.drawImage(I.wallT, Math.round(gs.wx - camX - T6.ww / 2), Math.round(L6.GROUND + 3 - T6.wh), T6.ww, T6.wh);
      const pf = Spr.frame('plat6', 9) || [0, 0, 160]; for (const [dx, hh, ww] of L6.HELP) Spr.draw(c, 'plat6', 9, g.x + dx + ww / 2 - camX, L6.GROUND + 3 - hh + 9, 1, { scale: ww / (pf[2] / 2) }); } }
    for (const q of this.D.scen || []) if (q.x - camX > -300 && q.x - camX < W + 300) Spr.draw(c, 'plat6', q.fr, q.x - camX, L6.GROUND + 3 + L6.SINK, 1, { scale: q.s });   // фон-декор стоит на земле и не «едет» за камерой
    for (const p of this.props) if (p.back && p.x - camX > -120 && p.x - camX < W + 120) Spr.draw(c, 'deco6', DECO[p.kind], p.x - camX, p.y + L6.SINK * 0.6, 1, { scale: p.s });
    for (const p of this.platSpr) if (!L6.FRONT[p.name] && p.x - camX > -300 && p.x - camX < W + 300) L6.drawPlat(c, p, camX);
    for (const p of this.props) if (!p.back && p.x - camX > -120 && p.x - camX < W + 120) Spr.draw(c, 'deco6', DECO[p.kind], p.x - camX, p.y + L6.SINK * 0.6, 1, { scale: p.s });
    this.drawGroundLip(c, camX);
    if (this.eatProp) Spr.drawC(c, 'items6', 4, this.eatProp.x - camX, L6.GROUND - 10, 0, 1.2);
    if (L6.EAT_X - camX < W + 200 && this.eatProp) for (const dx of [-22, 26]) Spr.drawC(c, 'items6', 3, this.eatProp.x + dx - camX, L6.GROUND - 8, 0, 0.9);
    Spr.drawC(c, 'items6', this.wizProp.fr === 0 ? 0 : this.wizProp.fr, this.wizProp.x - camX, L6.GROUND - 14, 0, 1.2);
  }
  draw(c) {
    const wd = this.world, cx = Math.round(wd.cam.x), cu = this.camUp || 0;
    c.save(); c.translate(0, cu);
    this.drawWorld(c, cx);
    for (const cp of wd.checkpoints) Art.checkpoint(c, cp.x - cx, L6.GROUND, cp.active, wd.t);
    for (const cl of this.clouds) L3.drawCloud(c, cl, cx, 0);
    for (const p of wd.pickups) p.draw(c, cx, 0);
    for (const e of wd.enemies) if (e.x - cx > -160 && e.x - cx < W + 160) e.draw(c, cx, 0);
    for (const f of this.fx) f.draw(c, cx);
    this.player.draw(c, cx, 0);
    L6.drawFront(c, this.platSpr, cx, [Object.assign(Object.create(null), { x: this.player.x, y: this.player.y, redraw: () => this.player.draw(c, cx, 0) }), ...wd.enemies.filter(e => !e.dead && Math.abs(e.x - cx - W / 2) < W).map(e => ({ x: e.x, y: e.y, redraw: () => e.draw(c, cx, 0) }))]);
    for (const s of this.shots) s.draw(c, cx);
    for (const s of this.spells) s.draw(c, cx);
    c.save(); c.translate(-cx, 0); FX.draw(c); c.restore();
    c.restore();
    c.save(); c.translate(0, cu * 1.3);
    const I = L6.img, zw = L6.zoneW(cx + W / 2);
    if (false && I.fg) { const fgA = Math.min(1, zw.forest + zw.bog); if (fgA > 0.01) this.tile(c, I.fg, cx * 1.35, 0, I.fg.width / 2, 360, fgA); }
    c.filter = 'brightness(0.5) saturate(0.85)';   // передний план — притемнённые силуэты (как на ур. 2)
    for (const q of this.fgs) { const sx = (q.x - cx) * 1.3; if (sx < -200 || sx > W + 200) continue;
      const f = Spr.frame('fg6', q.fr); if (!f) continue; const hh = f[3] / 2 * q.s;
      Spr.draw(c, 'fg6', q.fr, sx, q.top ? hh * 0.8 - 6 : Math.max(H + q.dy, 288 + hh), 1, { scale: q.s }); }
    c.filter = 'none';
    c.restore();
    G.drawBubbles(c, cx, -cu);
    Game.drawHUD(c, this.player, wd);
    const left = Math.max(0, Math.round((L6.ARENA_X - this.player.x) / 16));
    G.text('ДО ЛОГОВА: ' + left + ' м', W - 8, 22, { align: 'right', color: '#c8d0d8' });
    L6.drawWeaponHUD(c, this.player);
    if (this.hint) Game.drawHint(c, this.hint.text, this.hintA);
    if (this.fade > 0) { c.fillStyle = `rgba(0,0,0,${this.fade})`; c.fillRect(0, 0, W, H); }
  }
};
