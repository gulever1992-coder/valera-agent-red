// Лог боя с боссом (для разбора ИИ). Включается параметром ?flog. Пишет каждые 0.25 с и по событиям,
// отправляет JSON на локальный приёмник tools/p4/recv_flog.py (порт 8794) — каждые 10 с и в конце боя.
// Запасной вариант — localStorage 'flog_last'.
(function () {
  if (!/[?&]flog/.test(location.search)) return;
  const URL_ = 'http://localhost:8794/';
  const PL = ['стол_лев', 'стол_прав', 'мосток'];
  let L = null, cur = null, sampT = 0, sendT = 0, prevThrow = 0, prevState = null, prevPh = 1, prevDead = false;
  const r1 = v => Math.round(v * 10) / 10;
  const where = (st, p) => { if (!p.onGround) return 'воздух'; const q = (st.platsB || []).findIndex(q => p.x > q[0] - 10 && p.x < q[0] + q[2] + 10 && Math.abs(p.y - q[1]) < 16); return q >= 0 ? PL[q] : 'пол'; };
  function newFight(b) {
    if (L) flush('прервано');
    L = { id: 'l4_' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19), ver: G.VER, start: Date.now(), gt: 0, boss: 'biker', maxHp: b.maxHp, samples: [], events: [], result: null };
    cur = b; sampT = 0; sendT = 0; prevState = null; prevPh = 1; prevDead = false;
  }
  const T = () => L ? r1(L.gt) : 0;
  const ev = (k, o) => { if (L) L.events.push(Object.assign({ t: T(), k }, o)); };
  function summary() {
    const e = L.events, hits = e.filter(x => x.k === 'hit_boss'), hurt = e.filter(x => x.k === 'hurt_pl');
    const by = (a, f) => a.reduce((m, x) => (m[f(x)] = r1((m[f(x)] || 0) + (x.dmg || 1)), m), {});
    return { dur: T(), result: L.result, bossHpLeft: cur ? Math.round(cur.hp) : null,
      dmgToBoss_byBossState: by(hits, x => x.bs), dmgToBoss_byWeapon: by(hits, x => x.w), dmgToBoss_byPlace: by(hits, x => x.pw),
      dmgToPl_bySource: by(hurt, x => x.src), dmgToPl_byPlace: by(hurt, x => x.pw), throws: e.filter(x => x.k === 'throw').length,
      timeByPlace: L.samples.reduce((m, s) => (m[s.pw] = r1((m[s.pw] || 0) + 0.25), m), {}) };
  }
  function flush(res) {
    if (!L) return; if (res) L.result = res; L.summary = summary();
    const body = JSON.stringify(L);
    try { localStorage.setItem('flog_last', body); } catch (e) {}
    try { fetch(URL_ + L.id, { method: 'POST', body, headers: { 'Content-Type': 'text/plain' } }).catch(() => {}); } catch (e) {}
    if (res) { G.say && App.level && App.level.stage && G.say(App.level.stage.player, 'Лог боя записан', 2); L = null; }
  }
  const hook = () => {
    if (typeof L4 === 'undefined' || !L4.Biker || typeof Game === 'undefined' || !Game.Player) return setTimeout(hook, 300);
    const B = L4.Biker.prototype, P = Game.Player.prototype;
    const up = B.update, th = B.takeHit, hu = P.hurt, fl = P.fling;
    B.update = function (dt, st) {
      if (cur !== this) newFight(this);
      if (!L) return up.call(this, dt, st);
      L.gt += dt;
      const pl = st.player;
      if (this.s !== prevState) { ev('boss_state', { s: this.s, bx: Math.round(this.x), px: Math.round(pl.x), pw: where(st, pl) }); prevState = this.s; }
      if (this.phase !== prevPh) { ev('phase', { ph: this.phase, hp: Math.round(this.hp) }); prevPh = this.phase; }
      if ((pl.throwT || 0) > prevThrow + 0.1) ev('throw', { w: pl.weapon, pw: where(st, pl), dx: Math.round(this.x - pl.x), bs: this.s, low: !!pl.throwLow });
      prevThrow = pl.throwT || 0;
      if ((sampT -= dt) <= 0) { sampT = 0.25; L.samples.push({ t: T(), px: Math.round(pl.x), py: Math.round(pl.y), pw: where(st, pl), hp: pl.hp, w: pl.weapon, cr: pl.crouch ? 1 : 0,
        bx: Math.round(this.x), by: Math.round(this.y), bs: this.s, bhp: Math.round(this.hp), still: r1(this.stillT || 0), zone: r1(this.zoneT || 0), tires: this.tires.length }); }
      if (pl.dead && !prevDead) { ev('pl_dead', {}); prevDead = true; up.call(this, dt, st); flush('валера_погиб'); return; }
      const r = up.call(this, dt, st);
      if (this.dieT != null && L && !L.result) { ev('boss_dead', {}); flush('босс_побеждён'); return r; }
      if ((sendT += dt) > 10) { sendT = 0; flush(); }
      return r;
    };
    B.takeHit = function (dmg, fx, melee) {
      const hp0 = this.hp, st = this.st, pl = st.player, s0 = this.s, still = this.stillT;
      const r = th.call(this, dmg, fx, melee);
      if (cur === this) ev('hit_boss', { dmg: r1(hp0 - this.hp), raw: dmg, melee: !!melee, w: melee ? 'кулак' : pl.weapon, bs: s0, pw: where(st, pl), dx: Math.round(this.x - pl.x), camp: still > this.K.still + 1.2 });
      return r;
    };
    P.hurt = function (dmg, fromX, world) {
      const st = App.level && App.level.stage, b = st && st.boss, pw0 = st ? where(st, this) : '?', hp0 = this.hp, r = hu.call(this, dmg, fromX, world);
      if (b && b === cur && this.hp < hp0) ev('hurt_pl', { dmg: hp0 - this.hp, src: b.tires.length ? 'колёса/' + b.s : b.s, pw: pw0, dx: Math.round(b.x - this.x), hp: this.hp });
      return r;
    };
    P.fling = function (fromX, vx, vy) { const st = App.level && App.level.stage; if (st && st.boss === cur) ev('fling', { pw: where(st, this) }); return fl.call(this, fromX, vx, vy); };
    window.FLOG = { get: () => L, flush: () => flush() };
  };
  hook();
  // Ванделорд (ур.6) и Шеф (ур.7): урон ловим по разнице HP за кадр — без патча атак
  const gen = (getCls, pre, name, gy) => {
    const C = getCls(); if (!C) return setTimeout(() => gen(getCls, pre, name, gy), 300);
    const up = C.prototype.update; let hp0 = null, php0 = null;
    const pw = pl => pl.onGround === false || Math.abs(pl.y - gy()) > 6 && (pl.vy || 0) !== 0 ? 'воздух' : Math.abs(pl.y - gy()) < 6 ? 'пол' : 'возвышение';
    C.prototype.update = function (dt, ar) {
      if (cur !== this) { newFight(this); L.id = pre + L.id.slice(3); L.boss = name; L.maxHp = this.maxHp || this.max; hp0 = this.hp; php0 = null; }
      if (!L) return up.apply(this, arguments);
      const pl = ar && ar.player; L.gt += dt;
      if (pl) {
        const st = this.state;
        if (st !== prevState) { ev('boss_state', { s: st, a: this.anim, bx: Math.round(this.x), px: Math.round(pl.x), pw: pw(pl) }); prevState = st; }
        const ph = this.phase || this.ph; if (ph !== prevPh) { ev('phase', { ph, hp: Math.round(this.hp) }); prevPh = ph; }
        if ((sampT -= dt) <= 0) { sampT = 0.25; L.samples.push({ t: T(), px: Math.round(pl.x), py: Math.round(pl.y), pw: pw(pl), hp: pl.hp, bx: Math.round(this.x), by: Math.round(this.y), bs: st, ba: this.anim, bhp: Math.round(this.hp), vuln: this.vuln ? 1 : 0 }); }
        if (php0 != null && pl.hp < php0) ev('hurt_pl', { dmg: php0 - pl.hp, src: st, pw: pw(pl), dx: Math.round(this.x - pl.x), hp: pl.hp });
        if (pl.dead && !prevDead) { ev('pl_dead', {}); prevDead = true; const r = up.apply(this, arguments); flush('валера_погиб'); return r; }
      }
      const s0 = this.state, a0 = this.anim, r = up.apply(this, arguments);
      if (pl) php0 = pl.hp;
      if (L && this.hp < hp0) ev('hit_boss', { dmg: r1(hp0 - this.hp), bs: s0, ba: a0, vuln: this.vuln ? 1 : 0, pw: pl ? pw(pl) : '?', dx: pl ? Math.round(this.x - pl.x) : 0 });
      hp0 = this.hp;
      if (L && !L.result && this.hp <= 0) { ev('boss_dead', {}); flush('босс_побеждён'); return r; }
      if (L && (sendT += dt) > 10) { sendT = 0; flush(); }
      return r;
    };
  };
  gen(() => typeof L6 !== 'undefined' && L6.Vande, 'l6_', 'vande', () => L6.GROUND);
  gen(() => typeof V4 !== 'undefined' && V4.Chief, 'l7_', 'chief', () => V4.GY);
})();
