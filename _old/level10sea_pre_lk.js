// Уровень 10, фаза 3 «МОРЕ» v2 (ТЗ L10_P3_TZ.md): потрёпанный Семён АНФАС по пузо в море (риг L10.RigFront), плоты плывут слева направо.
// Валера прыгает по плотам, падает в воду, плывёт, залезает на плот; в воде «вниз» — НЫРОК (неуязвим, дыхание ~2.5 с, потом выталкивает).
// Гранатомёт стреляет только с плота. Атаки Семёна: самонаводящиеся плазменные шары из пасти (10 с, сбиваются, нырок сбрасывает наведение),
// лазер из обоих глаз по воде, шланг «бей сурка» (тень-предупреждение, ломает плот), хлопок ладонями по воде (спасает только нырок).
// Бессмертие: паучьи лапы со спины подключены к электростанциям — пока хоть одна подключена, щит. Станции взрываются гранатами, потом приплывают новые.
// Параметры и раскладка — L10.SEA3 (js/sea3_layout.js). В сегменте 1 — одна атака за раз, в 2 — две, в 3 — всё вместе.
(() => {
  const S = L10.spr, S9 = L9.spr, clamp = L10.clamp, rnd = L10.rnd, lerp = L10.lerp;
  const GRAV = 1300, RUN = 140, JUMP = 500;
  const C = () => L10.SEA3, AT = () => L10.SEA3.atk;
  const P = L10.PARTS.sea = {
    deathText: 'ВАЛЕРА УТОНУЛ',
    start(lv, ck) {
      const L = C(), WY = P.WY = L.WY;
      Object.assign(P, { lv, hp: 100, inv: 1.5, x: 200, y: WY - 30, vx: 0, vy: 0, dir: 1, t: 0, onG: false, raft: null, swim: false, dive: null, diveCd: 0, climbT: 0, fireT: 0, fireA: 0, aim: 'fwd', st: 'stand', cam: 0,
        rafts: [], bul: [], ebul: [], foes: [], fx: [], balls: [], marks: [], waves: [], atks: [], stations: [], gun: false, minT: 3, winT: 0, startT: 0 });
      P.W = new L10.Weather(260); P.mkStorm();
      P.edit = /seaedit/.test(location.search);     // режим конструктора: Валера бессмертен, атаки только по кнопке
      const sm = L.sem, R = P.R = new L10.RigFront({ x: sm.x, y: sm.y, H: sm.H }); R.setPose('idle'); R.ovr = {};
      // показатели босса (полоска HP, сегменты, щит)
      const B = P.B = { maxHp: L.hp, hp: L.hp, segs: L.segs, segHp: L.hp / L.segs, inv: false, shieldT: 0, flashT: 0, t: 0,
        get seg() { return Math.min(this.segs - 1, Math.floor((this.maxHp - this.hp) / this.segHp)); },
        damage(d) { const s0 = this.seg; this.hp = Math.max(0, this.hp - d); if (this.t - (this.lf || 0) > 0.2) { this.flashT = 0.06; this.lf = this.t; R.flashT = 0.08; } if (this.seg !== s0 && this.hp > 0) P.onSeg(this.seg); } };
      if (ck) B.hp = B.maxHp - ck * B.segHp;     // чекпоинт: после смерти — с начала сегмента
      P.K = L.valeraK || 1;     // масштаб Валеры (владелец: в 2–3 раза меньше)
      P.env = { px: () => P.x, py: () => P.y - 40 * P.K, shoot: e => P.ebul.push(e), hurt: d => P.hurt(d * AT().minionDmgK, 'minion'), ground: null, lv };
      for (let x = 40; x < 640; x += rnd(70, 110)) P.addRaft(x);
      P.raft = P.rafts[1]; P.x = P.raft.x; P.y = P.raft.top; P.onG = true;
      P.gunRaft = P.rafts[2] || P.rafts[0];
      // станции: в начале Семён уже подключён (лапы выходят и впиваются)
      L.stations.forEach((s, i) => P.stations.push({ slot: i, leg: s.leg ?? i, x: s.x, y: s.y, s: s.s, hp: AT().stationHp + B.seg * 10, st: 'plug', t: 0, link: 0, dmgT: 0, sink: 0 }));
      P.A = { cd: 3.2 };
      try { Music.play('epicBoss'); } catch (e) {}
      lv.say('ГРАНАТОМЁТ НА СОСЕДНЕМ ПЛОТУ — ПРЫГАЙ!', 3);
      setTimeout(() => P.lv === lv && lv.say('СЕМЁН ПИТАЕТСЯ ОТ СТАНЦИЙ — ВЗОРВИ ИХ!', 3.5), 3200);
    },
    mkStorm() { const b = C().bg || {}; P.bgKey = JSON.stringify(b); P.storm = L10.makeStorm(P.W, { seaY: b.seaY ?? 150, seaH: b.seaH ?? 230, shipZ: b.shipZ ?? 70, ships: b.ships ?? 7 }); },
    // раскладка правится в конструкторе на лету: Семён, линия воды, станции, фон
    liveLayout() {
      const L = C(); P.WY = L.WY; const R = P.R; R.x = L.sem.x; R.y = L.sem.y; R.H = L.sem.H;
      for (const s of P.stations) { const sl = L.stations[s.slot]; if (!sl) continue; s.y = sl.y; s.s = sl.s; if (s.st === 'plug' || s.st === 'dead') s.x = sl.x; }
      R.gunK = L.gunK ?? 1;
      if (JSON.stringify(L.bg || {}) !== P.bgKey) P.mkStorm();
    },
    onSeg(s) { P.lv.ck = s; P.lv.say(s === 1 ? 'СЕМЁН В ЯРОСТИ!' : 'СЕМЁН НА ПРЕДЕЛЕ!', 2); P.R.setPose('roar'); P.roarT = 1.2; G.shake(10, 1); Sound.play('stomp'); },
    addRaft(x, lane) {
      const L = C(), n = (Math.random() * 8) | 0, f = L10.fr(L.raftSheet, 'raft' + n), s = f ? rnd(L.raftW[0], L.raftW[1]) / (f[2] * 0.5) : 0.8;
      const w = f ? f[2] * 0.5 * s : 90, h = f ? f[3] * 0.5 * s : 30;
      const ln = lane == null ? P.pickLane(x) : lane, LN = L.lanes[ln], sk = LN.k;
      const r = { x, n, s: s * sk, w: w * 0.92 * sk, h: h * sk, lane: ln, ly: LN.y, top: LN.y - h * sk * L.raftTop, vx: rnd(L.raftSpeed[0], L.raftSpeed[1]) * (0.8 + sk * 0.2), bob: rnd(0, 6), sink: 0 }; P.rafts.push(r); return r;
    },
    // ряд для нового плота: не тот, где плот рядом, чтобы не кучей
    pickLane(x) { const L = C(), n = L.lanes.length, busy = new Set(P.rafts.filter(r => Math.abs(r.x - x) < 120).map(r => r.lane)); const free = [...Array(n).keys()].filter(i => !busy.has(i)); return free.length ? free[(Math.random() * free.length) | 0] : (Math.random() * n) | 0;
    },
    hurt(d, src = '?') { if (P.inv > 0 || P.dive) return; P.lv.hurt(Math.ceil(d)); P.hurtT = 0.3; const D = P.dmgBy || (P.dmgBy = {}); D[src] = (D[src] || 0) + Math.ceil(d); },
    under: () => !!P.dive,     // под водой — неуязвим к хлопку, шлангу, лазеру; шары теряют цель
    onSurface: () => !P.dive,
    raftUnder(x, y0, y1) { return P.rafts.find(r => !r.sink && x > r.x - r.w / 2 && x < r.x + r.w / 2 && r.top >= y0 && r.top <= y1); },
    sinkRaftAt(x, w) { for (const r of P.rafts) if (!r.sink && Math.abs(r.x - x) < r.w / 2 + w) { r.sink = 0.01; P.fx.push({ k: 'boom', x: r.x, y: r.top, t: 0, life: 0.5, s: 0.4 }); } },
    // ---------------- Валера ----------------
    updValera(lv, dt) {
      const I = G.Input, WY = P.WY;
      if (P.climbT > 0) { P.climbT -= dt; if (P.climbT <= 0 && P.raft) { P.swim = false; P.y = P.raft.top; P.onG = true; } if (P.raft) P.x = P.raft.x + (P.climbOff || 0); return; }
      if (P.dive) {     // нырок: держи «вниз»; дыхание кончилось или отпустил — всплывает
        const d = P.dive, mv = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0); if (mv) P.dir = mv;
        d.t += dt; P.x += (mv * 55 + 30) * dt; P.y = WY + 30 * P.K + Math.sin(P.t * 3) * 2; P.st = 'dive';
        if (d.t > AT().breath || (!I.held('down') && d.t > 0.25)) { P.dive = null; P.diveCd = 0.6; P.surfT = 0.35; P.y = WY + 6; P.fx.push({ k: 'splash', x: P.x, y: WY, t: 0, life: 0.5 }); Sound.play('splash', 0.6); if (d.t > AT().breath) lv.say('ВОЗДУХ!', 0.8); }
        return;
      }
      if (P.swim) {
        const mv = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0); if (mv) P.dir = mv;
        P.x += (mv * 70 + 38) * dt; P.y = WY + 6 * P.K + Math.sin(P.t * 4) * 2; P.st = 'swim';
        if (I.held('down') && P.diveCd <= 0) { P.dive = { t: 0 }; Sound.play('splash', 0.7); P.fx.push({ k: 'splash', x: P.x, y: WY, t: 0, life: 0.5 }); return; }
        const near = P.rafts.find(r => !r.sink && Math.abs(r.x - P.x) < r.w / 2 + 14);
        if (near && I.pressed('jump')) { P.raft = near; P.climbOff = clamp(P.x - near.x, -near.w / 2 + 8, near.w / 2 - 8); P.climbT = 0.5; Sound.play('splash', 0.5); }
        return;
      }
      const mv = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0), U = I.held('up');
      if (mv && !I.held('punch')) P.dir = mv;
      P.vx = mv * RUN + (P.onG && P.raft ? P.raft.vx : 0);
      if (I.pressed('jump') && P.onG) { P.vy = -JUMP; P.onG = false; P.raft = null; Sound.play('jump'); }
      P.vy = Math.min(900, P.vy + GRAV * dt); P.x += P.vx * dt;
      const ny = P.y + P.vy * dt;
      if (P.vy >= 0) { const r = P.raftUnder(P.x, P.y - 2, ny + 2); if (r) { P.y = r.top; P.vy = 0; if (!P.onG) Sound.play('land', 0.5); P.onG = true; P.raft = r; } else { P.y = ny; P.onG = false; P.raft = null; } } else { P.y = ny; P.onG = false; }
      if (P.onG && P.raft && (P.raft.sink || P.x < P.raft.x - P.raft.w / 2 - 2 || P.x > P.raft.x + P.raft.w / 2 + 2)) { P.onG = false; P.raft = null; }
      if (P.onG && P.raft) P.y = P.raft.top;
      if (P.y > WY + 4) { P.swim = true; P.vy = 0; P.raft = null; Sound.play('splash'); P.fx.push({ k: 'splash', x: P.x, y: WY, t: 0, life: 0.5 }); }
      P.aim = !P.onG ? (U ? 'diag' : 'fwd') : U && mv ? 'diag' : U ? 'up' : I.held('down') ? 'down' : 'fwd';     // вниз — по станциям у воды
      P.st = !P.onG ? 'jump' : mv ? 'run' : 'stand';
      if (I.held('punch') && P.fireT <= 0 && P.onG && P.gun) P.fire(lv);
      else if (I.pressed('punch') && !P.onG) lv.say('СТРЕЛЯТЬ — ТОЛЬКО С ПЛОТА', 1);
    },
    fire(lv) {
      P.fireT = 0.55; P.fireA = 0.15; lv.stats.shots++;
      const a = P.aim === 'up' ? -Math.PI / 2 + 0.3 : P.aim === 'diag' ? -Math.PI / 4 : P.aim === 'down' ? 0.5 : -0.2, d = P.dir;     // гранатомёт навесной: граната ложится дугой
      P.bul.push({ x: P.x + d * 30 * P.K, y: P.y - (P.aim === 'up' ? 86 : P.aim === 'diag' ? 74 : P.aim === 'down' ? 44 : 58) * P.K, vx: Math.cos(a) * 430 * d, vy: Math.sin(a) * 430, t: 0 }); Sound.play('throw', 0.8);
    },
    // ---------------- атаки ----------------
    pick() {
      const busy = new Set(P.atks.map(a => a.k)), sg = P.B.seg, L = [['plasma', 1.6], ['laser', 1.4], ['hose', 1.8 + sg * 0.3], ['clap', AT().clapEvery * (1 + sg * 0.3)]].filter(([k]) => !busy.has(k));
      if (!L.length) return null; let r = Math.random() * L.reduce((a, b) => a + b[1], 0); for (const [k, w] of L) if ((r -= w) <= 0) return k; return L[0][0];
    },
    startAtk(k) {
      const a = { k, t: 0, n: 0, ph: 0 }, sg = P.B.seg;
      if (k === 'laser') { a.dir = P.x < 320 ? -1 : 1; a.x0 = a.dir < 0 ? 660 : -20; a.x1 = a.dir < 0 ? -20 : 660; Sound.play('warn', 0.5); }     // идёт на Валеру с дальней стороны
      if (k === 'hose') { a.n = AT().hoseN[sg]; a.i = 0; a.st = 'up'; a.tx = P.x; Sound.play('warn', 0.4); }
      if (k === 'clap') { a.st = 'up'; P.lv.say('НЫРЯЙ!', 1.2); Sound.play('warn', 0.8); }
      if (k === 'plasma') Sound.play('warn', 0.3);
      P.atks.push(a);
    },
    updAtk(a, dt) {
      const R = P.R, WY = P.WY, sg = P.B.seg, T = AT(); a.t += dt;
      if (a.k === 'plasma') {
        R.ovr.mouth = 1;
        if (a.t > 0.8 && !a.ph) { a.ph = 1; const m = R.P('m'); for (let i = 0; i < T.balls[sg]; i++) { const an = -Math.PI / 2 + (i - (T.balls[sg] - 1) / 2) * 0.9; P.balls.push({ x: m[0], y: m[1], vx: Math.cos(an) * 90, vy: Math.sin(an) * 90 - 40, t: 0, hp: T.ballHp, lost: 0 }); } Sound.play('zap', 0.6); }
        return a.t > 1.4;
      }
      if (a.k === 'laser') {
        R.ovr.eye = 1;
        const p = clamp((a.t - T.laserWarn) / T.laserTime, 0, 1), x = lerp(a.x0, a.x1, p * p * (3 - 2 * p));
        a.warn = a.t < T.laserWarn; a.x = x;
        if (!a.warn) { for (const dx of [-14, 14]) if (Math.abs(P.x - (x + dx)) < 13 && P.onSurface() && P.y > WY - 120) P.hurt(T.laserDmg, 'laser'); if (Math.random() < dt * 20) P.fx.push({ k: 'splash', x: x, y: WY - 2, t: 0, life: 0.3 }); }
        return p >= 1;
      }
      if (a.k === 'hose') {
        // замах (тень следит за Валерой) -> фиксация -> удар -> следующий
        if (a.st === 'up') { R.ovr.hose = 'up'; R.hoseT = { x: a.tx, y: WY }; if (a.t < T.hoseWarn * 0.5) { a.tx = lerp(a.tx, P.x, clamp(dt * 8, 0, 1)); a.ty = P.raft ? P.raft.ly : WY; } if (a.t === dt || !a.mark) { a.mark = { x: a.tx, t: 0, life: 9 }; P.marks.push(a.mark); } a.mark.x = a.tx; a.mark.y = a.ty;
          if (a.t > T.hoseWarn + 0.25) { a.st = 'hit'; a.t = 0; } }
        else if (a.st === 'hit') { R.ovr.hose = 'hit'; R.hoseT = { x: a.tx, y: a.ty || WY };
          if (a.t > 0.2 && !a.hit) { a.hit = 1; G.shake(8, 0.4); Sound.play('stomp'); P.fx.push({ k: 'splash', x: a.tx, y: WY, t: 0, life: 0.6, big: 1 }); P.sinkRaftAt(a.tx, 6); if (Math.abs(P.x - a.tx) < 36 && P.onSurface()) P.hurt(T.hoseDmg, 'hose'); if (a.mark) a.mark.life = 0; }
          if (a.t > 0.45) { a.i++; a.hit = 0; a.mark = null; a.st = a.i < a.n ? 'up' : 'done'; a.t = 0; a.tx = P.x; } }
        if (a.st === 'done') { R.ovr.hose = null; R.hoseT = null; return true; }
        return false;
      }
      if (a.k === 'clap') {
        // руки вверх ладонями (предупреждение) -> в стороны к воде -> хлопок у воды в центре -> волна по всей воде
        const sm = C().sem;
        if (a.st === 'up') { a.pose = 'clapUp'; if (a.t > T.clapWarn) { a.st = 'out'; a.t = 0; } }
        else if (a.st === 'out') { a.pose = 'clapOut'; if (a.t > 0.45) { a.st = 'clap'; a.t = 0; R.aimL = [sm.x - 4, sm.y]; R.aimR = [sm.x + 4, sm.y]; } }
        else if (a.st === 'clap') { a.pose = 'clap'; if (a.t > 0.18 && !a.hit) { a.hit = 1; G.shake(14, 0.7); G.flash(0.06, '#fff'); Sound.play('boom'); P.waves.push({ x: sm.x, r: 0, hit: 0 }); P.fx.push({ k: 'splash', x: sm.x, y: sm.y, t: 0, life: 0.7, big: 1 }); }
          if (a.t > 0.7) return true; }
        return false;
      }
      return true;
    },
    hitStation(s, lv, d) {
      s.hp -= d; s.dmgT = 0.3; if (s.hp > 0) return;
      { const lg = P.R.legs[s.leg]; if (lg && lg.grow > 0.3) { const M = P.R.mats(), J = P.R.J, a = M.ML[s.leg], r = J['lgR' + s.leg], tp = J['lgT' + s.leg];     // лапа отламывается: взрыв по её длине
        for (let i = 1; i <= 3; i++) { const q = [r[0] + (tp[0] - r[0]) * i / 4, r[1] + (tp[1] - r[1]) * i / 4], w = [a[0] * q[0] + a[2] * q[1] + a[4], a[1] * q[0] + a[3] * q[1] + a[5]]; P.fx.push({ k: 'boom', x: w[0], y: w[1], t: -i * 0.08, life: 0.7, s: 0.5 }); }
        P.R.flashT = 0.15; } }
      s.st = 'dead'; s.sink = 0; lv.score += 500; P.fx.push({ k: 'boom', x: s.x, y: s.y - 80 * s.s, t: 0, life: 0.8, s: 1 }); G.shake(10, 0.6); Sound.play('boom');
      lv.say(P.stations.some(q => q.st === 'plug') ? 'СТАНЦИЯ ВЗОРВАНА! ЕЩЁ!' : 'ЩИТ ПРОПАЛ! БЕЙ СЕМЁНА!', 1.8);
    },
    // ---------------- кадр ----------------
    update(lv, dt) {
      P.liveLayout(); if (P.freeze) return;     // конструктор: «стоп-кадр»
      const B = P.B, R = P.R, L = C(), T = AT(), WY = P.WY;
      if (P.edit) { lv.P.hp = 100; P.A.cd = 99; }
      P.t += dt; B.t += dt; P.inv -= dt; P.fireT -= dt; P.fireA -= dt; P.hurtT -= dt; P.diveCd -= dt; P.surfT -= dt; P.cam += dt * 40; B.flashT -= dt; B.shieldT -= dt;
      P.W.update(dt, 1.6);
      // течение: плоты; гранатомёт — на одном из плотов, пока не подобран
      P.spawnT = (P.spawnT || 0) - dt; if (P.spawnT <= 0) { P.spawnT = rnd(L.raftEvery[0], L.raftEvery[1]); const nr = P.addRaft(L.raftX0 ?? -60); if (!P.gun && (!P.gunRaft || P.gunRaft.x > 660 || P.gunRaft.sink)) P.gunRaft = nr; }
      if (!P.gun && P.gunRaft && P.raft === P.gunRaft && P.onG && Math.abs(P.x - P.gunRaft.x) < P.gunRaft.w * 0.45) { P.gun = true; P.gunRaft = null; Sound.play('pickup'); lv.say('ГРАНАТОМЁТ! СТРЕЛЯЙ ПО СТАНЦИЯМ', 2); }
      for (const r of P.rafts) { r.x += r.vx * dt; r.bob += dt * 2; r.top = r.ly - r.h * L.raftTop + Math.sin(r.bob) * 1.5 + r.sink * 40; if (r.sink) r.sink += dt * 0.8; }
      P.rafts = P.rafts.filter(r => r.x < 720 && r.sink < 1.5);
      // станции и лапы: пока хоть одна подключена — щит
      for (const s of P.stations) {
        s.t += dt; s.dmgT -= dt;
        if (s.st === 'float') { const tx = L.stations[s.slot].x; s.x += clamp(tx - s.x, -60 * dt, 60 * dt); if (Math.abs(tx - s.x) < 2) { s.st = 'plug'; s.link = 0; Sound.play('zap'); G.shake(4, 0.4); lv.say('СЕМЁН СНОВА ПОДКЛЮЧИЛСЯ!', 1.8); } }
        if (s.st === 'plug') s.link = Math.min(1, s.link + dt * 1.5);
        if (s.st === 'dead') { s.sink += dt; s.link = Math.max(0, s.link - dt * 2.5); }
      }
      for (const s of P.stations) if (s.st === 'dead' && s.sink > T.stationBack && B.hp > 0) { const sl = L.stations[s.slot]; Object.assign(s, { st: 'float', x: sl.x < 320 ? -90 : 730, y: sl.y, sink: 0, hp: T.stationHp + B.seg * 10, link: 0 }); lv.say('ПРИПЛЫЛА НОВАЯ СТАНЦИЯ!', 1.6); }
      B.inv = P.stations.some(s => s.st === 'plug' && s.link > 0.6);
      // Семён: поза рук от хлопка (или рык), наложения — от остальных атак
      R.ovr = {}; R.shield = 0; R.watch = { x: P.x, y: P.y };
      // лапы Семёна: каждая тянется к своей станции; станция взорвана — лапа отламывается, новая станция — лапа отрастает
      for (const s of P.stations) { const lg = R.legs[s.leg]; if (!lg) continue; lg.tgt = [s.x, s.y - 300 * s.s * 0.5 * 0.8];
        if (s.st === 'plug') { lg.grow = Math.min(1, lg.grow + dt * 1.2); lg.reach = lg.grow < 1 ? 0 : s.link; lg.hot = s.link > 0.6; }
        else if (s.st === 'dead') { lg.grow = 0; lg.reach = 0; lg.hot = 0; }
        else { lg.grow = Math.min(1, lg.grow + dt * 0.8); lg.reach = 0; lg.hot = 0; } }
      // волны бьются о пузо Семёна
      P.foamT = (P.foamT || 0) - dt; if (P.foamT <= 0) { const sm = L.sem, hw = sm.H * 0.2; P.foamT = rnd(0.08, 0.2); P.fx.push({ k: 'foam', x: sm.x + rnd(-hw, hw), y: sm.y + rnd(-2, 3), t: 0, life: rnd(0.5, 0.9), s: rnd(0.18, 0.3) }); }
      let pose = 'idle';
      if (B.hp > 0) {
        if (P.atks.length < T.tracks[B.seg]) { P.A.cd -= dt; if (P.A.cd <= 0) { const k = P.pick(); if (k) P.startAtk(k); P.A.cd = T.cd[B.seg] * rnd(0.8, 1.2); } }
        P.atks = P.atks.filter(a => !P.updAtk(a, dt));
        const cl = P.atks.find(a => a.k === 'clap'); if (cl) pose = cl.pose || 'clapUp';
        else if (P.atks.some(a => a.k === 'laser')) pose = 'laser'; else if (P.atks.some(a => a.k === 'plasma')) pose = 'plasma';
      }
      if (P.roarT > 0) { P.roarT -= dt; if (pose === 'idle') pose = 'roar'; }
      if (B.hp <= 0) pose = 'hurt';
      R.setPose(pose); R.update(dt);
      // Валера
      P.updValera(lv, dt);
      P.x = Math.max(P.x, 14);
      if (P.x > 650 && !lv.dead) { if (P.edit) { P.x = 200; P.swim = true; } else lv.kill('ВАЛЕРУ УНЕСЛО ТЕЧЕНИЕМ'); }
      // плазменные шары: летят за Валерой 10 с; под водой теряют его и кружат
      for (const b of P.balls) {
        b.t += dt; const tx = P.x, ty = P.y - 40 * P.K, lost = P.under();
        if (!lost && b.t > 0.4) { const a = Math.atan2(ty - b.y, tx - b.x), sp = T.ballSpeed * (1 + B.seg * 0.15), k = clamp(T.ballTurn * dt, 0, 1); b.vx = lerp(b.vx, Math.cos(a) * sp, k); b.vy = lerp(b.vy, Math.sin(a) * sp, k); }
        else if (lost) { b.vx = lerp(b.vx, Math.cos(b.t * 1.7) * 50, dt); b.vy = lerp(b.vy, -20 + Math.sin(b.t * 2.3) * 40, dt); }
        b.x += b.vx * dt; b.y = Math.min(WY - 10, b.y + b.vy * dt);
        if (!lost && Math.hypot(P.x - b.x, P.y - 40 * P.K - b.y) < 8 + 12 * P.K) { P.hurt(T.ballDmg, 'ball'); b.dead = 1; }
        if (b.t > T.ballLife) b.dead = 1;
        if (b.dead) P.fx.push({ k: 'pop', x: b.x, y: b.y, t: 0, life: 0.4 });
      }
      P.balls = P.balls.filter(b => !b.dead);
      // волна хлопка бежит по воде от центра: задевает всё на поверхности (спасает только нырок)
      for (const w of P.waves) { w.r += dt * 620; if (!w.hit && Math.abs(P.x - w.x) < w.r && Math.abs(P.x - w.x) > w.r - 40) { w.hit = 1; if (P.onSurface()) P.hurt(T.clapDmg, 'clap'); } if (Math.random() < dt * 30) for (const sx of [-1, 1]) P.fx.push({ k: 'splash', x: w.x + sx * w.r, y: WY, t: 0, life: 0.3 }); }
      P.waves = P.waves.filter(w => w.r < 700);
      // миньоны
      P.minT -= dt; if (P.minT <= 0 && B.hp > 0) { P.minT = T.minionEvery * rnd(0.7, 1.3); if (P.foes.filter(f => !f.dead).length < T.minions[B.seg]) { const sp = R.P(Math.random() < 0.5 ? 'legL' : 'legR'), k = ['bat', 'eye', 'bat', 'worm', 'blob'][(Math.random() * 5) | 0]; P.foes.push(new L10.Minion(k, clamp(sp[0], 30, 610), Math.min(sp[1], 200), { env: P.env })); } }
      for (const f of P.foes) f.update(dt); P.foes = P.foes.filter(f => !f.gone);
      // победа
      if (B.hp <= 0) { P.winT += dt; P.atks = []; P.balls = []; if (P.winT > 2.2) lv.next(); }
      // гранаты
      for (const b of P.bul) {
        b.t += dt; b.vy += 700 * dt; b.x += b.vx * dt; b.y += b.vy * dt; let hit = false;
        for (const s of P.stations) if ((s.st === 'plug' || s.st === 'float') && Math.abs(b.x - s.x) < 273 * s.s * 0.45 && b.y > s.y - 330 * s.s * 0.5 - 14 && b.y < s.y + 6) { hit = true; P.hitStation(s, lv, 6); break; }
        if (!hit) for (const bl of P.balls) if (Math.hypot(b.x - bl.x, b.y - bl.y) < 18) { hit = true; if (--bl.hp <= 0) { bl.dead = 1; lv.score += 30; } break; }
        if (!hit) for (const f of P.foes) if (!f.dead) { const bx = f.box(); if (b.x > bx[0] && b.x < bx[0] + bx[2] && b.y > bx[1] && b.y < bx[1] + bx[3]) { f.hit(6); hit = true; break; } }
        if (!hit && B.hp > 0) { const bx = R.box(); if (b.x > bx[0] + bx[2] * 0.12 && b.x < bx[0] + bx[2] * 0.88 && b.y > bx[1] && b.y < C().sem.y) { hit = true; if (B.inv) B.shieldT = 0.3; else { const m = R.P('m'), weak = R.v.mouth > 0.5 && Math.hypot(b.x - m[0], b.y - m[1]) < 30; B.damage(weak ? AT().dmgWeak : AT().dmg); lv.score += weak ? 40 : 15; } } }
        if (!hit && b.y > WY + 6) for (const s of P.stations) if ((s.st === 'plug' || s.st === 'float') && Math.abs(b.x - s.x) < 273 * s.s * 0.5 + AT().splash) { P.hitStation(s, lv, 4); break; }     // граната рвётся в воде рядом — задевает станцию
        if (hit || b.y > WY + 6 || b.x > 680 || b.x < -40 || b.y < -60) { b.dead = 1; P.fx.push({ k: b.y > WY ? 'splash' : 'boom', x: b.x, y: Math.min(b.y, WY), t: 0, life: 0.45, s: 0.35 }); if (hit) Sound.play('boom', 0.5); }
      }
      P.bul = P.bul.filter(b => !b.dead); P.balls = P.balls.filter(b => !b.dead);
      for (const e of P.ebul) { e.t = (e.t || 0) + dt; if (e.grav) e.vy += 900 * e.grav * dt; e.x += e.vx * dt; e.y += e.vy * dt; if (Math.abs(e.x - P.x) < 14 * P.K && e.y > P.y - 70 * P.K && e.y < P.y && !P.under()) { e.dead = 1; P.hurt(e.dmg || 8, 'shot'); } if (e.x < -40 || e.x > 700 || e.y > 380 || e.y < -60 || e.t > 5) e.dead = 1; }
      P.ebul = P.ebul.filter(e => !e.dead);
      for (const f of P.fx) f.t += dt; P.fx = P.fx.filter(f => f.t < f.life);
      for (const m of P.marks) m.t += dt; P.marks = P.marks.filter(m => m.t < m.life);
    },
    drawBeam(c, from, to, k = 'laser', th = 8) { const [x0, y0] = from, [x1, y1] = to, a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0), f = L10.fr('fx10', k); if (!f) return; c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x0, y0); c.rotate(a); c.imageSmoothingEnabled = true; c.drawImage(L10.img.fx10, f[0], f[1], f[2], f[3], 0, -th / 2, L, th); c.restore(); },
    // лапа со спины к станции: кольчатая лента tent10, по ней бежит ток, пока подключена
    drawLeg(c, s) {
      if (s.link <= 0.01 || !L10.has('tent10')) return;
      const sm = C().sem, la = C().legA[s.x < sm.x ? 0 : 1], k = sm.H / 236, x0 = sm.x + la[0] * k, y0 = sm.y + la[1] * k, x1t = s.x, y1t = s.y - 300 * s.s * 0.5 * 0.85;
      const x1 = lerp(x0, x1t, s.link), y1 = lerp(y0, y1t, s.link), L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0), f = L10.fr('tent10', 'seg'), sag = Math.min(60, L * 0.25);
      c.save(); c.imageSmoothingEnabled = true; const n = Math.max(2, (L / 26) | 0), pts = [];
      for (let i = 0; i <= n; i++) { const u = i / n; pts.push([lerp(x0, x1, u) + Math.sin(u * 6 + P.t * 3) * 3, lerp(y0, y1, u) - Math.sin(u * Math.PI) * sag + Math.sin(u * 9 + P.t * 4) * 2]); }
      for (let i = 0; i < n; i++) { const p = pts[i], q = pts[i + 1], aa = Math.atan2(q[1] - p[1], q[0] - p[0]), l = Math.hypot(q[0] - p[0], q[1] - p[1]); c.save(); c.translate(p[0], p[1]); c.rotate(aa); c.drawImage(L10.img.tent10, f[0], f[1], f[2], f[3], -2, -9 * (1 - i / n * 0.4), l + 4, 18 * (1 - i / n * 0.4)); c.restore(); }
      c.restore(); S(c, 'tent10', 'sucker', x1, y1, 0.2, { rot: a });
      if (s.st === 'plug' && s.link > 0.6) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(140,220,255,${0.5 + Math.random() * 0.4})`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i <= n; i++) c.lineTo(pts[i][0] + rnd(-4, 4), pts[i][1] + rnd(-4, 4)); c.stroke(); c.restore(); }
    },
    draw(lv, c) {
      const B = P.B, R = P.R, WY = P.WY, sm = C().sem;
      P.storm(c, P.cam);
      // дальние станции и лапы — за Семёном
      const far = s => s.y < sm.y;
      const drawSt = s => { const fr = s.st === 'dead' ? 'dead' : s.dmgT > 0 ? 'dmg' : s.st === 'plug' ? 'plug' : 'ok'; S(c, 'stat10', fr, s.x, s.y + s.sink * 18, s.s, { a: clamp(1 - (s.sink - 2) / 2, 0, 1) }); };
      for (const s of P.stations) if (far(s)) drawSt(s);
      // Семён: всё, что ниже его линии воды, — под водой
      c.save(); c.beginPath(); c.rect(-50, -400, 740, sm.y + 400); c.clip(); R.draw(c); c.restore();
      L10.bgTile(c, 'bg1sea', P.cam + G.t * 140, 0.05, sm.y - 4 + Math.sin(G.t * 0.9) * 1.5, 380 - sm.y);     // вода перед Семёном
      c.save(); c.globalAlpha = 0.33; L10.bgTile(c, 'bg1sea', P.cam - G.t * 190 + 700, 0.05, sm.y - 1, 380 - sm.y); c.restore();
      for (const a of P.atks) if (a.k === 'laser') { const e1 = R.P('e'), e2 = R.P('e2'); if (a.warn) { c.save(); c.globalAlpha = 0.35 + 0.3 * Math.sin(P.t * 30); c.fillStyle = '#ff3020'; c.fillRect(Math.min(a.x0, a.x1), WY - 3, 680, 2); c.restore(); P.drawBeam(c, e1, [a.x0 - 14, WY - 4], 'laser', 2); P.drawBeam(c, e2, [a.x0 + 14, WY - 4], 'laser', 2); } else { P.drawBeam(c, e1, [a.x - 14, WY - 4]); P.drawBeam(c, e2, [a.x + 14, WY - 4]); if (L10.has('fx10')) S(c, 'fx10', 'lhit', a.x, WY - 6, 0.4, { add: 1 }); } }
      for (const s of P.stations) if (!far(s)) drawSt(s);
      P.rafts.sort((a, b) => a.ly - b.ly);     // дальние ряды — раньше
      for (const r of P.rafts) S(c, C().raftSheet, 'raft' + r.n, r.x, r.top + r.h * C().raftTop + C().raftSub, r.s, { a: 1 - r.sink * 0.6 });
      if (R.hoseW > 0.3) R.drawHoseOnly(c);     // шланг, вылетевший из воды к цели, — поверх воды и плотов
      if (!P.gun && P.gunRaft) { const r = P.gunRaft, b = Math.sin(P.t * 4) * 2; S9(c, 'fxL9', 'spark', r.x, r.top - 14, 0.45 + Math.sin(P.t * 5) * 0.08, { add: 1 }); S9(c, 'pick9', 'rocket', r.x, r.top - 10 + b, 0.6); }
      for (const m of P.marks) L10.Minion.mark(c, m.x, (m.y || WY) - 5, 60, 0.4 + 0.4 * Math.sin(m.t * 18));
      for (const f of P.foes) f.draw(c);
      P.drawValera(c);
      for (const b of P.balls) { const k = 0.32 + Math.sin(b.t * 9) * 0.04, end = b.t > AT().ballLife - 1.5 && (b.t * 10 | 0) % 2; if (!end) S(c, 'fx10', 'ball', b.x, b.y, k, { add: 1, rot: b.t * 3 }); }
      for (const b of P.bul) S9(c, L10.has('rocketL9') ? 'rocketL9' : 'fxL9', 'rocket', b.x, b.y, 0.45, { rot: Math.atan2(b.vy, b.vx) });
      for (const e of P.ebul) e.draw ? e.draw(c, e) : 0;
      for (const f of P.fx) { const u = f.t / f.life; if (f.k === 'boom') S(c, 'boom10', 'b' + Math.min(3, (u * 4) | 0), f.x, f.y, f.s || 0.5, { add: 1 }); if (f.k === 'splash') S(c, 'fx10', 'splash', f.x, f.y - 10, f.big ? 0.5 : 0.25, { add: 1, a: 1 - u }); if (f.k === 'foam') S(c, 'fx10', 'splash', f.x, f.y - 6, f.s * (0.6 + u * 0.6), { add: 1, a: (1 - u) * 0.8, sy: 0.6 }); if (f.k === 'pop') S(c, 'fx10', 'flash', f.x, f.y, 0.3 + u * 0.4, { add: 1, a: 1 - u }); }
      P.W.draw(c);
      if (P.atks.some(a => a.k === 'clap' && a.st === 'up')) { c.strokeStyle = `rgba(255,40,30,${0.35 + 0.35 * Math.sin(P.t * 22)})`; c.lineWidth = 8; c.strokeRect(4, 4, 632, 352); }     // предупреждение хлопка
    },
    drawValera(c) {
      if (P.inv > 0 && !P.dive && (P.t * 16 | 0) % 2) return;
      const fl = P.dir < 0, WY = P.WY;
      if (P.climbT > 0) { S(c, 'vSea10', P.climbT > 0.25 ? 'climb0' : 'climb1', P.x, (P.raft ? P.raft.top : WY) + 20 * P.K, 0.42 * P.K, { flip: fl }); return; }
      if (P.dive) {     // под водой: полупрозрачный (вода поверх), гребки; воздух кончается — паника
        const d = P.dive, left = AT().breath - d.t, fr = d.t < 0.22 ? 'dive0' : left < 0.6 ? 'panic' : ['swim0', 'swim1', 'swim2', 'swim1'][((d.t * 6) | 0) % 4];
        S(c, 'vDive10', fr, P.x, WY + (34 + (d.t < 0.22 ? -12 + d.t * 50 : 0)) * P.K, 0.4 * P.K, { flip: fl, a: 0.55 }); return;
      }
      if (P.surfT > 0) { S(c, 'vDive10', 'up1', P.x, WY + 8 * P.K, 0.4 * P.K, { flip: fl }); return; }     // вынырнул — хватает воздух
      if (P.swim) { S(c, 'vSea10', ((P.t * 3) | 0) % 2 ? 'swim0' : 'swim1', P.x, WY + 18 * P.K, 0.42 * P.K, { flip: fl }); return; }
      if (P.gun && P.st === 'stand' && (P.aim === 'fwd' || P.aim === 'down')) { S(c, 'vSea10', P.fireA > 0 ? 'fire' : 'aim', P.x, P.y + 1, 0.5 * P.K, { flip: fl }); return; }
      let sh = 'vAim9_rocket', fr = P.aim === 'diag' ? 'diag' : P.aim === 'up' ? 'up' : 'stand';
      if (P.st === 'run') { sh = 'vRun9_rocket'; fr = 'r' + ((P.t * 12 | 0) % 8); if (P.aim === 'diag') { sh = 'vRunUD9_rocket'; fr = 'u' + ((P.t * 10 | 0) % 4); } }
      if (P.st === 'jump') { sh = 'vJump9_rocket'; fr = P.vy < -200 ? 'rise' : ['flip1', 'flip2', 'flip3'][(P.t * 9 | 0) % 3]; }
      if (!P.gun) { sh = sh.replace('_rocket', '').replace('vRunUD9', 'vRun9'); if (sh === 'vRun9' && fr[0] === 'u') fr = 'r' + ((P.t * 12 | 0) % 8); if (sh === 'vAim9') fr = 'stand'; }
      S9(c, sh, fr, P.x, P.y + 1, P.K, { flip: fl });
    },
    drawHud(lv, c) {
      L10.bossBar(c, P.B, P.B.inv ? 'СЕМЁН — ЩИТ! ВЗОРВИ СТАНЦИИ' : 'СЕМЁН');
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(6, 25, 148, 16); G.text(P.gun ? 'ГРАНАТОМЁТ' : 'БЕЗ ОРУЖИЯ', 12, 29, { size: 8, color: P.gun ? '#ffd84a' : '#999' });
      if (P.dive) { const k = 1 - P.dive.t / AT().breath; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(P.x - 22, P.WY - 18, 44, 6); c.fillStyle = k > 0.3 ? '#7fd8ff' : '#ff5a3a'; c.fillRect(P.x - 21, P.WY - 17, 42 * k, 4); }     // запас воздуха
    },
  };
})();
