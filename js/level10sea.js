// Уровень 10, фаза 3 «МОРЕ» v2 (ТЗ docs/L10_P3_TZ.md): потрёпанный Семён АНФАС по пузо в море (риг L10.RigFront), плоты плывут слева направо.
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
        rafts: [], bul: [], ebul: [], foes: [], fx: [], balls: [], marks: [], waves: [], hoses: [], atks: [], stations: [], tosses: [], miss: [], scr: [], sub: null, subT: 25, stunT: 0, gun: false, minT: 3, winT: 0, startT: 0 });
      P.W = new L10.Weather(260); P.mkStorm();
      P.edit = /seaedit/.test(location.search);     // режим конструктора: Валера бессмертен, атаки только по кнопке
      const sm = L.sem, R = P.R = L10.SEM3 && L10.SEM3.use && L10.Sem3 ? new L10.Sem3({ x: sm.x, y: sm.y, H: sm.H }) : new L10.RigFront({ x: sm.x, y: sm.y, H: sm.H }); R.setPose('idle'); R.ovr = {}; if (R.alphaFn) { const af = R.alphaFn.bind(R); R.alphaFn = () => { const f = af(); return p => p.tag === 'hose' || p.id === 'hroot' ? 0 : f(p); }; }     // шланг теперь отдельно — вылезает из моря;
      // показатели босса (полоска HP, сегменты, щит)
      const B = P.B = { maxHp: L.hp, hp: L.hp, segs: L.segs, barSegs: 1,     /* владелец: одна шкала; segs — только ступени ярости */  segHp: L.hp / L.segs, inv: false, shieldT: 0, flashT: 0, t: 0,
        get seg() { return Math.min(this.segs - 1, Math.floor((this.maxHp - this.hp) / this.segHp + 1e-6)); },     // 1e-6: после чекпоинта 1333.33 давало сегмент 0 (критик)
        damage(d) { const s0 = this.seg; this.hp = Math.max(0, this.hp - d); if (this.t - (this.lf || 0) > 0.2) { this.flashT = 0.06; this.lf = this.t; R.flashT = 0.08; } if (this.seg !== s0 && this.hp > 0) P.onSeg(this.seg); } };
      if (ck) B.hp = B.maxHp - ck * B.segHp;     // чекпоинт: после смерти — с начала сегмента
      P.K = L.valeraK || 1;     // масштаб Валеры (владелец: в 2–3 раза меньше)
      P.env = { px: () => P.x, py: () => P.y - 40 * P.K, shoot: e => P.ebul.push(e), hurt: d => P.hurt(d * AT().minionDmgK, 'minion'), ground: null, lv };
      P.laneX = C().lanes.map((ln, i) => { const pt = P.lanePitch(i), x0 = 20 + (i % 2) * pt * 0.25; for (let x = x0; x < 680; x += pt) P.addRaft(x, i); return x0; });     // laneX — самый левый плот ряда
      P.raft = P.rafts[1]; P.x = P.raft.x; P.y = P.raft.top; P.onG = true;
      P.gun = true; P.gunRaft = null; P.wpn = 'rpg';     // владелец: в фазе 3 гранатомёт у Валеры сразу; wpn — в руках гранатомёт или ракетка (C — сменить)
      // станции: в начале Семён уже подключён (лапы выходят и впиваются)
      const DS = lv.deadSt && lv.deadSt.seg === B.seg ? lv.deadSt.set : (lv.deadSt = { seg: B.seg, set: new Set() }).set;     // критик: смерть больше не включает щит заново — взорванные в этом сегменте станции остаются взорванными
      L.stations.forEach((s, i) => P.stations.push({ slot: i, leg: s.leg ?? i, x: s.x, y: s.y, s: s.s, hp: AT().stationHp + B.seg * 10, st: DS.has(i) ? 'dead' : 'plug', t: 0, link: 0, dmgT: 0, sink: DS.has(i) ? 99 : 0 }));
      P.A = { cd: 3.2 };
      try { Music.play('epicBoss'); } catch (e) {}
      lv.say('СТРЕЛЯЙ! ВВЕРХ / ВНИЗ + СТРЕЛКА — ПО ДИАГОНАЛИ', 3);
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
    onSeg(s) { P.lv.ck = s;     // критик: в каждом сегменте снова «сломай щит» — приплывают 2 новые станции
      { const T = AT(), L = C(), dead = P.stations.filter(q => q.st === 'dead').sort(() => Math.random() - 0.5).slice(0, 2); for (const q of dead) { const sl = L.stations[q.slot]; Object.assign(q, { st: 'float', x: sl.x < 320 ? -90 : 730, y: sl.y, sink: 0, hp: T.stationHp + s * 10, link: 0 }); }
        P.lv.deadSt = { seg: s, set: new Set(P.stations.filter(q => q.st === 'dead').map(q => q.slot)) }; if (dead.length) setTimeout(() => P.B.hp > 0 && P.lv.say('ПРИПЛЫЛИ НОВЫЕ СТАНЦИИ!', 1.8), 2200); }
      P.lv.say(s === 1 ? 'СЕМЁН В ЯРОСТИ!' : 'СЕМЁН НА ПРЕДЕЛЕ!', 2); P.R.setPose('roar'); P.roarT = 1.2; P.shk(10, 1); Sound.play('stomp'); },
    addRaft(x, lane) {
      const L = C(), n = (Math.random() * 8) | 0, f = L10.fr(L.raftSheet, 'raft' + n), s = f ? P.raftW0() / (f[2] * 0.5) : 0.8;
      const w = f ? f[2] * 0.5 * s : 90, h = f ? f[3] * 0.5 * s : 30;
      const ln = lane == null ? P.pickLane(x) : lane, LN = L.lanes[ln], sk = LN.k;
      const r = { x, n, s: s * sk, w: w * 0.92 * sk, h: h * sk, lane: ln, ly: LN.y, top: LN.y - h * sk * L.raftTop, vx: P.laneV(ln), bob: rnd(0, 6), sink: 0 }; P.rafts.push(r); return r;
    },
    // ровные ряды: все плоты одной ширины, в ряду одна скорость и одинаковый зазор (raftGap — между краями)
    raftW0() { const L = C(); return (L.raftW[0] + L.raftW[1]) / 2; },
    // у всех рядов один шаг и одна скорость (ряды не разъезжаются), ряды сдвинуты на четверть шага — под каждым дальним плотом есть ближний
    laneV(ln) { const L = C(); return (L.raftSpeed[0] + L.raftSpeed[1]) / 2; },
    lanePitch(ln) { const L = C(), k = Math.max(...L.lanes.map(l => l.k)); return (P.raftW0() * 0.92 + (L.raftGap ?? 46)) * k; },
    laneBack(ln) { const L = C(), y = L.lanes[ln].y, b = L.lanes.map((l, i) => [l.y, i]).filter(q => q[0] < y).sort((a, b) => b[0] - a[0])[0]; return b ? b[1] : ln; },     // ряд дальше
    laneFront(ln) { const L = C(), y = L.lanes[ln].y, f = L.lanes.map((l, i) => [l.y, i]).filter(q => q[0] > y).sort((a, b) => a[0] - b[0])[0]; return f ? f[1] : ln; },     // ряд ближе
    // линия воды для Валеры — у переднего ряда (плавает перед плотами, падает в воду только ниже переднего ряда)
    // плывёт только между плотами переднего ряда: упирается в край плота (залезть — прыжок); вынырнул под плотом — выталкивает к ближнему краю
    outOfRaft() { const fy = Math.max(...C().lanes.map(l => l.y)); for (const r of P.rafts) if (!r.sink && r.ly === fy) { const e = r.w / 2 + 7, d = P.x - r.x; if (Math.abs(d) < e) P.x = r.x + (d < 0 ? -e : e); } },
    swimY() { return Math.max(...C().lanes.map(l => l.y)) - 6; },
    // ряд для нового плота: не тот, где плот рядом, чтобы не кучей
    stW() { return L10.has('stat10') ? L10.size('stat10', 'ok')[0] * 2 : 546; }, stH() { return L10.has('stat10') ? L10.size('stat10', 'ok')[1] * 2 : 304; },     // размер кадра станции (лист меняется)
    pickLane(x) { const L = C(), n = L.lanes.length, busy = new Set(P.rafts.filter(r => Math.abs(r.x - x) < 120).map(r => r.lane)); const free = [...Array(n).keys()].filter(i => !busy.has(i)); return free.length ? free[(Math.random() * free.length) | 0] : (Math.random() * n) | 0;
    },
    hurt(d, src = '?') { if (P.inv > 0 || P.dive) return; P.lv.hurt(Math.ceil(d)); P.hurtT = 0.3; const D = P.dmgBy || (P.dmgBy = {}); D[src] = (D[src] || 0) + Math.ceil(d); },
    under: () => !!P.dive,     // под водой — неуязвим к хлопку, шлангу, лазеру; шары теряют цель
    onSurface: () => !P.dive,
    raftUnder(x, y0, y1) { return P.rafts.find(r => !r.sink && (P.jl == null || r.lane === P.jl) && x > r.x - r.w / 2 - 6 && x < r.x + r.w / 2 + 6 && r.top >= y0 && r.top <= y1); },
    // отдельный шланг: тот же рисунок и физика, что у Семёна, но со своим корнем в воде (мини-риг из костей шланга)
    hoseRig() { if (P.hoseD) return P.hoseD; const S3 = L10.SEM3, hb = (S3.roles || {}).hose || [], ids = new Set(['root', 'torso', ...hb]);
      const hs = new Set(hb), Y0 = (S3.bones.find(b => b.id === hb[0]) || { y: 585 }).y, up = y => 2 * Y0 - y;     // у Семёна шланг висит вниз — здесь в покое смотрит вверх (выезжает из воды столбом)
      return P.hoseD = { cx: S3.cx, water: S3.water, top: S3.water - 306, size: S3.size, bob: { x: 0, y: 0, r: 0 },
        bones: S3.bones.filter(b => ids.has(b.id)).map(b => hs.has(b.id) ? Object.assign({}, b, { y: up(b.y), ty: up(b.ty) }) : Object.assign({}, b)),
        parts: S3.parts.filter(p => p.tag === 'hose').map(p => Object.assign({}, p, { y: up(p.y), r: (p.r || 0) - 180 })), roles: { torso: 'torso', hose: hb }, clips: { idle: { len: 1, loop: 1, k: {}, c: {}, v: {}, f: {} } }, pts: {} }; },
    hoseAt(a) {     // новое место: случайная точка моря в 70–230 от Валеры, на одной из линий воды
      const L = C(), ys0 = [P.WY].concat(L.lanes.map(l => l.y - 4)).filter(y => y < P.y - 10), ys = ys0.length ? ys0 : [P.WY], sd = Math.random() < 0.5 ? -1 : 1; let x = P.x + sd * rnd(70, 230); if (x < 30 || x > 610) x = P.x - sd * rnd(70, 230);
      x = clamp(x, 30, 610); const y = ys[(Math.random() * ys.length) | 0];
      const D = P.hoseRig(), hh = 121 * (AT().hoseK ?? 1.5), b0 = D.bones.find(b => b.id === (D.roles.hose || [])[0]), dy = b0 ? (D.water - b0.y) * hh / (D.water - D.top) + 6 : 0;     // корень шланга — под водой
      const H = L10.Sem3 ? new L10.Sem3({ D, x, y: y + dy, H: hh }) : null; if (H) H.setPose('idle');
      for (const o of (P.hoses || [])) if (!o.out) o.out = 1e-3;     // на экране — один шланг: прежний уходит под воду
      a.h = { a, x, y, H, t: 0, by: y + dy, L: 440 * hh / (D.water - D.top), rise: 0 }; if (H) H.y = a.h.by + a.h.L; (P.hoses = P.hoses || []).push(a.h); a.tx = P.x; a.ty = P.y; },
    // волна от кулака: бежит в обе стороны по всем рядам, поднимает плоты; бьёт стоящего/плывущего (прыжок или нырок спасают)
    slamWave(x, big = 1) { const v = (AT().waveV ?? 150) * (1 + P.B.seg * 0.15); for (const d of [-1, 1]) P.waves.push({ x, d, v, t: 0, a: big, h: 0, hit: 0 });
      for (const dx of [-12, 0, 12]) P.fx.push({ k: 'splash', x: x + dx, y: P.WY, t: 0, life: 0.7, big: 1 }); },
    waveLift(x) { let h = 0; for (const w of P.waves) { const u = (x - w.x) / 26; h += w.h * Math.exp(-u * u); } return h * (AT().waveLift ?? 9); },
    sinkRaftAt(x, w) { for (const r of P.rafts) if (!r.sink && Math.abs(r.x - x) < r.w / 2 + w) { r.sink = 0.01; P.fx.push({ k: 'boom', x: r.x, y: r.top, t: 0, life: 0.5, s: 0.4 }); } },
    // ---------------- Валера ----------------
    updValera(lv, dt) {
      const I = G.Input, WY = P.swimY();
      if (P.climbT > 0) { P.climbT -= dt; if (P.climbT <= 0 && P.raft) { P.swim = false; P.y = P.raft.top; P.onG = true; } if (P.raft) P.x = P.raft.x + (P.climbOff || 0); return; }
      if (P.dive) {     // нырок: держи «вниз»; дыхание кончилось или отпустил — всплывает
        const d = P.dive, mv = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0); if (mv) P.dir = mv;
        d.t += dt; P.x += (mv * 55 + 30) * dt; P.y = WY + 30 * P.K + Math.sin(P.t * 3) * 2; P.st = 'dive';
        if (d.t > AT().breath || (!I.held('down') && d.t > 0.25)) { P.dive = null; P.diveCd = 0.6; P.surfT = 0.35; P.outOfRaft(); P.y = WY + 6; P.fx.push({ k: 'splash', x: P.x, y: WY, t: 0, life: 0.5 }); Sound.play('splash', 0.6); if (d.t > AT().breath) lv.say('ВОЗДУХ!', 0.8); }
        return;
      }
      if (P.swim) {
        const mv = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0); if (mv) P.dir = mv;
        P.x += (mv * 70 + 38) * dt; P.outOfRaft(); P.y = WY + 6 * P.K + Math.sin(P.t * 4) * 2; P.st = 'swim';
        if (I.held('down') && P.diveCd <= 0) { P.dive = { t: 0 }; Sound.play('splash', 0.7); P.fx.push({ k: 'splash', x: P.x, y: WY, t: 0, life: 0.5 }); return; }
        const near = P.rafts.filter(r => !r.sink && Math.abs(r.x - P.x) < r.w / 2 + 14).sort((a, b) => b.ly - a.ly)[0];     // из воды — на ближний плот
        if (near && I.pressed('jump')) { P.raft = near; P.climbOff = clamp(P.x - near.x, -near.w / 2 + 8, near.w / 2 - 8); P.climbT = 0.5; Sound.play('splash', 0.5); }
        return;
      }
      const mv = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0), U = I.held('up');
      if (mv) P.dir = mv;     // разворот и при стрельбе — влево/вправо во всех 8 направлениях
      const RK = P.wpn === 'racket' || !P.gun, lock = !RK && P.onG && mv && (U || I.held('down')) && I.held('punch');     /* диагональ + выстрел: стоит и стреляет под 45°, не идёт */
      P.vx = (lock ? 0 : mv * RUN) + (P.onG && P.raft ? P.raft.vx : 0);
      // прыжки по рядам: обычный прыжок — в своём ряду; зажата «вверх» — на дальний ряд, «вниз» — на ближний (можно нажать и в полёте)
      if (I.pressed('jump') && P.onG && P.raft) { const ln = P.jl0 = P.raft.lane; P.jl = U ? P.laneBack(ln) : I.held('down') ? P.laneFront(ln) : ln;
        P.vy = I.held('down') && P.jl !== ln ? -260 : -JUMP; P.onG = false; P.raft = null; Sound.play('jump'); }
      if (!P.onG && P.jl != null) { if (U) P.jl = P.laneBack(P.jl0 ?? P.jl); else if (I.held('down')) P.jl = P.laneFront(P.jl0 ?? P.jl); }
      P.vy = Math.min(900, P.vy + GRAV * dt); P.x += P.vx * dt;
      const ny = P.y + P.vy * dt;
      if (P.vy >= 0) { const r = P.raftUnder(P.x, P.y - 2, ny + 2); if (r) { P.y = r.top; P.vy = 0; if (!P.onG) Sound.play('land', 0.5); P.onG = true; P.raft = r; P.jl = P.jl0 = null; } else { P.y = ny; P.onG = false; P.raft = null; } } else { P.y = ny; P.onG = false; }
      if (P.onG && P.raft && (P.raft.sink || P.x < P.raft.x - P.raft.w / 2 - 2 || P.x > P.raft.x + P.raft.w / 2 + 2)) { P.jl = P.jl0 = P.raft.lane; P.onG = false; P.raft = null; }     // сошёл с края — падает в своём ряду
      if (P.onG && P.raft) P.y = P.raft.top;
      if (P.y > WY + 4) { P.jl = P.jl0 = null; P.outOfRaft(); P.swim = true; P.vy = 0; P.raft = null; Sound.play('splash'); P.fx.push({ k: 'splash', x: P.x, y: WY, t: 0, life: 0.5 }); }
      const D = I.held('down'); P.aim = U && mv ? 'diag' : U ? 'up' : D && mv ? 'ddiag' : D ? 'down' : 'fwd';     // 8 направлений: вверх, вверх-вбок, вбок, вниз-вбок, вниз (влево — зеркально)
      P.st = !P.onG ? 'jump' : mv && !lock ? 'run' : 'stand';
      if (I.pressed('throw')) { if (P.gun) { P.wpn = RK ? 'rpg' : 'racket'; P.swingT = 0; Sound.play('clank', 0.6); } else lv.say('ГРАНАТОМЁТА ПОКА НЕТ', 1); }     // владелец: оружие переключается; с ракеткой гранатомёт висит за спиной
      if (RK) { if (I.pressed('punch') && !(P.swingT > 0)) { P.swingT = AT().swingT ?? 0.34; P.swUp = U; Sound.play('throw', 0.6); } }     // электроракетка как в ур.3 — отбивает шары в Семёна
      else if (I.held('punch') && P.fireT <= 0 && P.onG) P.fire(lv);
      else if (I.pressed('punch') && !P.onG) lv.say('СТРЕЛЯТЬ — ТОЛЬКО С ПЛОТА', 1);
    },
    shk(a, t) { G.shake(a * 0.35, t * 0.6); },     // владелец: экран трясся слишком сильно
    fire(lv) {
      P.fireT = AT().fireCd ?? 0.3;     /* владелец: не пулемёт */ P.fireA = 0.08; lv.stats.shots++;     // очередь: пуля за пулей, патроны бесконечные
      const AIM = { up: [-Math.PI / 2, 46, 84], diag: [-Math.PI / 4, 30, 76], fwd: [0, 49, 54], ddiag: [Math.PI / 4, 57, 54], down: [Math.PI / 2, 54, 60] }[P.aim] || [0, 49, 54];     // вылет — конец трубы РПГ в кадре
      const WYb = P.WY + 6, a = AIM[0], d = P.dir, v = AT().bulV ?? 620, mx = P.x + d * AIM[1] * P.K, my = P.y - AIM[2] * P.K;
      // мягкое наведение: ближайшая по углу цель в секторе ±0.8 рад от направления ствола (шары, миньоны, станции, Семён) — пули летят туда, куда видно
      let wa = d > 0 ? a : Math.PI - a, best = null, bd = AT().aimCone ?? 0.45; const B = P.B, R = P.R, T = [];
      for (const f of P.foes) if (!f.dead) { const bx = f.box(); T.push([bx[0] + bx[2] / 2, bx[1] + bx[3] / 2, 0.7]); }
      for (const st of P.stations) if (st.st === 'plug' || st.st === 'float') T.push([st.x, st.y - P.stH() * st.s * 0.22, 0.9]);
      if (B && B.hp > 0) { const m = R.P('m'); T.push([m[0], Math.min(m[1] + 34, C().sem.y - 14), 1]); }
      for (const [tx, ty, w] of T) { const df = Math.abs(((Math.atan2(ty - my, tx - mx) - wa + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * w; if (df < bd) { bd = df; best = Math.atan2(ty - my, tx - mx); } }
      if (best != null) wa = best; wa += rnd(-0.025, 0.025);
      P.bul.push({ x: mx, y: my, vx: Math.cos(wa) * v, vy: Math.sin(wa) * v, t: 0, g: 0, wy: Math.max(WYb, my + (wa > 0.2 && wa < Math.PI - 0.2 ? 18 : 60)) });     P.fx.push({ k: 'mz', x: mx, y: my, t: 0, life: 0.07 }); Sound.play('shot', 0.25);     // wy — где пуля уходит в воду: с переднего плота (ниже линии воды) выстрел вперёд не гаснет сразу (критик)
    },
    // ---------------- атаки ----------------
    pick() {
      const busy = new Set(P.atks.map(a => a.k)), sg = P.B.seg, L = [['plasma', AT().plasmaEvery ?? 2.4], ['laser', 1.4], ['hose', 1.8 + sg * 0.3], ['clap', AT().clapEvery * (1 + sg * 0.3)], ['smash', AT().smashEvery ?? 1.3], ['gun', AT().gunEvery ?? 1.5]]     /* владелец: царапание экрана убрано (атака 'scratch' осталась в коде) */.filter(([k]) => !busy.has(k));
      if (!L.length) return null; let r = Math.random() * L.reduce((a, b) => a + b[1], 0); for (const [k, w] of L) if ((r -= w) <= 0) return k; return L[0][0];
    },
    startAtk(k) {
      const a = { k, t: 0, n: 0, ph: 0 }, sg = P.B.seg;
      if (k === 'laser') { a.dir = P.x < 320 ? -1 : 1; a.x0 = a.dir < 0 ? 660 : -20; a.x1 = a.dir < 0 ? -20 : 660; Sound.play('warn', 0.5); }     // идёт на Валеру с дальней стороны
      if (k === 'hose') { a.n = AT().hoseN[sg]; a.i = 0; a.st = 'bub'; P.hoseAt(a); Sound.play('warn', 0.4); }     // шланг вылезает из моря в случайной точке и бьёт по Валере
      if (k === 'smash') { a.st = 'up'; a.n = (AT().smashN ?? [2, 3, 4])[sg] ?? 3; a.side = Math.random() < 0.5 ? 'L' : 'R'; Sound.play('warn', 0.6); if ((P.hintW = (P.hintW || 0) + 1) <= 2) P.lv.say('ВОЛНА — ПРЫГАЙ!', 1.2); }
      if (k === 'clap') { a.st = 'up'; a.i = 0; a.n = sg >= 2 ? 2 : 1; a.tx = P.x; a.ty = P.y; P.lv.say('НЫРЯЙ!', 1.2); Sound.play('warn', 0.8); }
      if (k === 'plasma') Sound.play('warn', 0.3);
      if (k === 'scratch') Sound.play('warn', 0.5);     /* владелец: Семён царапает экран — царапины висят и мешают смотреть */
      if (k === 'gun') { a.n = (AT().gunN ?? [8, 11, 14])[sg] ?? 10; a.i = 0; a.ax = P.x; a.fT = 0; Sound.play('warn', 0.5); if ((P.hintG = (P.hintG || 0) + 1) <= 2) P.lv.say('ПУЛЕМЁТ — НЫРЯЙ!', 1.2); }     /* пулемёт на голове: прицел, затем очередь */
      P.atks.push(a);
    },
    updAtk(a, dt) {
      const R = P.R, WY = P.WY, sg = P.B.seg, T = AT(); a.t += dt;
      if (a.k === 'scratch') { R.ovr.pose = 'clapOpen'; R.ovr.mouth = 1;
        if (a.t > 0.6 && !a.q) { const i = (Math.random() * 3) | 0, x = rnd(170, 470), y = rnd(110, 230), L = 150, d = [[-1, -1], [1, -1], [-1, 0]][i], k = i === 2 ? 1 : 0.7071;     // направление ведения — как у рисунка царапины
          a.q = { i, x, y, s: rnd(0.9, 1.1), rot: rnd(-0.12, 0.12), t: 0, life: AT().scrLife ?? 9, x0: x + d[0] * k * L, y0: y + d[1] * k * L, x1: x - d[0] * k * L, y1: y - d[1] * k * L, r: 0, hand: 0 };
          P.scr.push(a.q); Sound.play('glass', 0.9); if ((P.hintS = (P.hintS || 0) + 1) <= 1) P.lv.say('СЕМЁН ЦАРАПАЕТ ЭКРАН!', 1.2); }
        if (a.q) { const k = a.t - 0.6; a.q.hand = k < 1.35 ? 1 : 0; a.q.hk = k; a.q.r = clamp((k - 0.3) / 0.75, 0, 1);     // 0.3 с — прижал лапу, 0.75 с — ведёт когтями, потом убирает
          if (k > 0.3 && k < 1.05) { P.shk(1.5, 0.05); if (((k * 8) | 0) !== a.snd) { a.snd = (k * 8) | 0; Sound.play('crumble', 0.25); } } }
        return a.t > 2.1;
      }
      if (a.k === 'gun') {     // ствол догоняет Валеру с запаздыванием: можно убежать или нырнуть
        const W = T.gunWarn ?? 0.7; a.ax = lerp(a.ax, P.x, clamp(dt * (T.gunTrack ?? 2.6), 0, 1)); const ty = P.y - 34 * P.K; R.gunT = [a.ax, ty]; a.warn = a.t < W;
        if (!a.warn) a.fT -= dt; if (!a.warn && a.i < a.n && a.fT <= 0) { a.fT = T.gunRate ?? 0.09; a.i++; const m = R.fireGun(), an = Math.atan2(ty - m[1], a.ax - m[0]) + rnd(-0.05, 0.05), v = T.gunSpeed ?? 330;
          P.ebul.push({ x: m[0], y: m[1], vx: Math.cos(an) * v, vy: Math.sin(an) * v, t: 0, dmg: T.gunDmg ?? 6, raw: 1, src: 'gun', gun: 1 }); P.fx.push({ k: 'mz', x: m[0], y: m[1], t: 0, life: 0.06 }); Sound.play('shot', 0.3); }
        return a.i >= a.n && a.fT < -0.25;
      }
      if (a.k === 'plasma') {
        R.ovr.mouth = 1;
        if (a.t > 0.8 && !a.ph) { a.ph = 1; const m = R.P('m'); for (let i = 0; i < T.balls[sg]; i++) { const an = -Math.PI / 2 + (i - (T.balls[sg] - 1) / 2) * 0.9; P.balls.push({ x: m[0], y: m[1], vx: Math.cos(an) * 90, vy: Math.sin(an) * 90 - 40, t: 0, hp: T.ballHp, lost: 0 }); } Sound.play('zap', 0.6); if ((P.hintB = (P.hintB || 0) + 1) <= 3) P.lv.say(P.wpn === 'racket' ? 'ШАРЫ — ОТБЕЙ РАКЕТКОЙ (X)!' : 'ШАРЫ! ВОЗЬМИ РАКЕТКУ (C) И ОТБЕЙ', 1.6); }
        return a.t > 1.4;
      }
      if (a.k === 'laser') {
        R.ovr.eye = 1;
        const p = clamp((a.t - T.laserWarn) / T.laserTime, 0, 1), x = lerp(a.x0, a.x1, p * p * (3 - 2 * p));
        a.warn = a.t < T.laserWarn; a.x = x;
        if (!a.warn) { for (const dx of [0]) if (Math.abs(P.x - (x + dx)) < 22 && P.onSurface() && P.y > WY - 120) P.hurt(T.laserDmg, 'laser'); if (Math.random() < dt * 20) P.fx.push({ k: 'splash', x: x, y: WY - 2, t: 0, life: 0.3 }); }
        return p >= 1;
      }
      if (a.k === 'smash') {     // кулаки по воде: замах обоими -> попеременно левым/правым (последний — двумя) -> от каждого удара волны в обе стороны: перепрыгнуть или поднырнуть
        const T2 = AT(), tw = T2.smashWarn ?? 0.9, per = T2.smashPer ?? 0.62;
        if (a.st === 'up') { a.pose = 'smashUp'; if (a.t > tw) { a.st = 'hit'; a.t = 0; a.k2 = -1; } return false; }
        const k = Math.floor(a.t / per), u = a.t - k * per;
        if (k >= a.n) { a.pose = 'idle'; return a.t > a.n * per + 0.25; }
        const side = k === a.n - 1 && sg >= 1 ? 'B' : (k % 2 ? (a.side === 'L' ? 'R' : 'L') : a.side);
        a.pose = 'pound' + side; if (a.k2 !== k) { a.k2 = k; a.hit = 0; }
        if (!a.hit && u > 0.09) { a.hit = 1; P.shk(side === 'B' ? 14 : 9, 0.4); Sound.play('boom');
          for (const sd of side === 'B' ? ['L', 'R'] : [side]) P.slamWave(clamp(R.P('h' + sd)[0], 20, 620), side === 'B' ? 1.3 : 1); }
        return false;
      }
      if (a.k === 'hose') {     // бурлит вода (место появления) -> шланг вырывается и встаёт, тень следит за Валерой -> удар -> уходит под воду, следующий — в другом месте
        const h = a.h, T2 = AT();
        if (a.st === 'bub') { if (Math.random() < dt * 22) P.fx.push({ k: 'foam', x: h.x + rnd(-10, 10), y: h.y + rnd(-2, 2), t: 0, life: 0.5, s: rnd(0.2, 0.32) });
          if (a.t > (T2.hoseBub ?? 0.7)) { a.st = 'up'; a.t = 0; h.up = 1; Sound.play('splash', 0.8); for (const dx of [-8, 0, 8]) P.fx.push({ k: 'splash', x: h.x + dx, y: h.y, t: 0, life: 0.6, big: 1 }); } }
        else if (a.st === 'up') { h.H.ovr.hose = 'up'; if (a.t < T2.hoseWarn * 0.6) { const k = clamp(dt * 8, 0, 1); a.tx = lerp(a.tx, P.x, k); a.ty = lerp(a.ty, P.onG || P.swim ? P.y : a.ty, k); } h.H.hoseT = { x: a.tx, y: a.ty };
          if (!a.mark) { a.mark = { x: a.tx, t: 0, life: 9 }; P.marks.push(a.mark); } a.mark.x = a.tx; a.mark.y = a.ty;
          if (a.t > T2.hoseWarn + 0.25) { a.st = 'hit'; a.t = 0; } }
        else if (a.st === 'hit') { h.H.ovr.hose = 'hit'; h.H.hoseT = { x: a.tx, y: a.ty };
          if (a.t > 0.2 && !a.hit) { a.hit = 1; P.shk(8, 0.4); Sound.play('stomp'); P.fx.push({ k: 'splash', x: a.tx, y: a.ty, t: 0, life: 0.6, big: 1 }); P.sinkRaftAt(a.tx, 6);
            if (Math.abs(P.x - a.tx) < 36 && P.onSurface() && !(P.y < a.ty - 50)) P.hurt(T2.hoseDmg, 'hose'); if (a.mark) a.mark.life = 0; }
          if (a.t > 0.5 && !a.tossed && Math.random() < (T2.tossP ?? [0.35, 0.5, 0.6])[sg]) { a.tossed = 1; P.toss(h); }     // шланг швыряет плот: тень на воде — уходи
          if (a.t > 0.5) { h.out = 1e-3; a.i++;     /* 1e-3: шланг плавно уходит под воду (было 1 — пропадал за кадр) */ a.tossed = 0; a.hit = 0; a.mark = null; a.t = 0; if (a.i < a.n) { a.st = 'bub'; P.hoseAt(a); } else a.st = 'done'; } }
        return a.st === 'done';
      }
      if (a.k === 'clap') {     // хлопок-давилка: ладони вверх (тень на Валере) -> руки летят к нему раскрытыми -> схлопываются (спасает нырок) -> растирают -> назад
        const T2 = AT(), tw = (T2.clapWarn ?? 1) * (a.i ? 0.7 : 1), aim = (sp, dy) => { R.aimL = [a.tx - sp, a.ty - dy]; R.aimR = [a.tx + sp, a.ty - dy]; };
        if (a.st === 'up') { a.pose = 'clapUp';
          if (a.t < tw * 0.8 && !P.dive) { const k = clamp(dt * 5, 0, 1), sx = C().sem.x; a.tx = clamp(lerp(a.tx, P.x, k), sx - 170, sx + 170); a.ty = lerp(a.ty, P.y, k); }     /* ладони дотягиваются только на ±170 от Семёна (тестировщик) */
          if (!a.mark) { a.mark = { x: a.tx, t: 0, life: 9 }; P.marks.push(a.mark); } a.mark.x = a.tx; a.mark.y = a.ty + 4;
          if (a.t > tw) { a.st = 'swing'; a.t = 0; Sound.play('jump', 0.6); } }
        else if (a.st === 'swing') { a.pose = 'clapOpen'; aim(lerp(110, 70, a.t / 0.24), 16); if (a.t > 0.24) { a.st = 'shut'; a.t = 0; } }
        else if (a.st === 'shut') { a.pose = 'clapShut'; aim(5 + (a.t > 0.12 ? Math.sin(a.t * 38) * 3 : 0), 12);
          if (!a.hit) { a.hit = 1; P.shk(16, 0.6); G.flash(0.06, '#fff'); Sound.play('boom'); P.sinkRaftAt(a.tx, 2);
            for (const dx of [-14, 0, 14]) P.fx.push({ k: 'splash', x: a.tx + dx, y: Math.max(WY, a.ty), t: 0, life: 0.7, big: 1 });
            if (!P.swim && !P.dive && !(P.climbT > 0)) {     /* владелец: не спрыгнул в воду — ладони бьют */ P.hurt(T2.clapDmg ?? 30, 'clap'); if (P.inv <= 0 || P.hurtT > 0.2) P.lv.say('РАЗДАВИЛ!', 0.9); } }
          if (Math.random() < dt * 14) P.fx.push({ k: 'foam', x: a.tx + rnd(-16, 16), y: Math.max(WY, a.ty) + rnd(-2, 4), t: 0, life: 0.5, s: 0.25 });
          if (a.t > 0.45) { a.st = 'back'; a.t = 0; if (a.mark) a.mark.life = 0; } }
        else if (a.st === 'back') { a.pose = 'clapBack'; if (a.t > 0.45) { if (++a.i < a.n) { a.st = 'up'; a.t = 0; a.hit = 0; a.mark = null; a.tx = P.x; a.ty = P.y; Sound.play('warn', 0.6); } else return true; } }
        return false;
      }
      return true;
    },
    toss(h) { const x1 = clamp(P.x + (P.vx || 0) * 0.3, 30, 610), y1 = P.onG || P.swim ? P.y : P.WY, dur = AT().tossT ?? 1.15;
      P.tosses.push({ x0: h.x, y0: h.y - 110, x1, y1, t: 0, dur, n: (Math.random() * 8) | 0, r0: rnd(-1, 1) }); P.marks.push({ x: x1, y: y1, t: 0, life: dur }); Sound.play('warn', 0.4); },
    // подлодка-союзник: всплывает и даёт залп ракет по Семёну (щит их гасит)
    updSub(lv, dt) { const B = P.B, R = P.R;      /* владелец: всплывающая подлодка в бою не нужна (subOn) */
      if (!AT().subOn) P.sub = null; else if (!P.sub) { P.subT -= dt; if (P.subT <= 0 && B.hp > 0) { P.subT = (AT().subEvery ?? 40) * rnd(0.85, 1.15); const x = P.x < 320 ? rnd(380, 520) : rnd(120, 260); P.sub = { x, t: 0, n: 0 }; lv.say('ПОДЛОДКА НА ПОДМОГУ!', 1.6); Sound.play('splash', 0.7); } }
      else { const s = P.sub; s.t += dt;
        if (s.t > 1 + s.n * 0.35 && s.n < (AT().subN ?? 4) && B.hp > 0) { s.n++; P.miss.push({ x: s.x + rnd(-10, 10), y: P.WY - 14, vx: rnd(-40, 40), vy: -320, t: 0 }); Sound.play('shot', 0.5); P.fx.push({ k: 'boom', x: s.x, y: P.WY - 12, t: 0, life: 0.3, s: 0.25 }); }
        if (s.t > 3.8) P.sub = null; }
      for (const m of P.miss) { m.t += dt; const st = null, tg = R.P('m');     /* владелец: станции не должны взрываться сами — ракеты подлодки бьют только в Семёна, щит их гасит */
        if (m.t > 0.35) { const a = Math.atan2(tg[1] - m.y, tg[0] - m.x), k = clamp(dt * 5, 0, 1); m.vx = lerp(m.vx, Math.cos(a) * 380, k); m.vy = lerp(m.vy, Math.sin(a) * 380, k); }
        m.x += m.vx * dt; m.y += m.vy * dt;
        if (Math.hypot(tg[0] - m.x, tg[1] - m.y) < 22 || m.t > 3) { m.dead = 1; P.fx.push({ k: 'boom', x: m.x, y: m.y, t: 0, life: 0.6, s: 0.55 }); Sound.play('boom', 0.5);
          if (m.t <= 3 && B.hp > 0) { if (B.inv && !(P.stunT > 0)) B.shieldT = 0.4; else B.damage(AT().subDmg ?? 18); } } }
      P.miss = P.miss.filter(m => !m.dead);
      for (const o of P.tosses) { o.t += dt; if (o.t >= o.dur) { o.dead = 1; P.shk(6, 0.3); Sound.play('splash', 0.8); for (const dx of [-14, 0, 14]) P.fx.push({ k: 'splash', x: o.x1 + dx, y: o.y1, t: 0, life: 0.6, big: 1 });
          if (Math.abs(P.x - o.x1) < 34 && P.onSurface() && !P.dive) P.hurt(AT().tossDmg ?? 14, 'toss'); } }
      P.tosses = P.tosses.filter(o => !o.dead); },
    hitStation(s, lv, d) {
      s.hp -= d; s.dmgT = 0.3; if (s.hp > 0) return;
      { const lg = P.R.legs[s.leg]; if (lg && lg.gs > 0.3) {     // лапа отрывается: взрывы по суставам (колено, лодыжка, коготь)
        for (let j = 1; j <= 3; j++) { const w = P.R.P('lg' + s.leg + '.' + j); P.fx.push({ k: 'boom', x: w[0], y: w[1], t: -(3 - j) * 0.08, life: 0.7, s: 0.5 }); }
        P.R.flashT = 0.15; } }
      s.st = 'dead'; s.sink = 0; lv.score += 500; if (lv.deadSt) lv.deadSt.set.add(s.slot); P.fx.push({ k: 'boom', x: s.x, y: s.y - 80 * s.s, t: 0, life: 0.8, s: 1 }); P.shk(10, 0.6); Sound.play('boom');
      P.stunT = AT().stunT ?? 2.6; P.atks = []; P.balls = P.balls.filter(b => b.ref);     /* взрыв станции оглушает Семёна: атаки сбиты, рот открыт — пули в рот бьют даже сквозь щит */
      lv.say(P.stations.some(q => q.st === 'plug') ? 'СЕМЁН ОГЛУШЁН! СТРЕЛЯЙ В РОТ!' : 'ЩИТ ПРОПАЛ! БЕЙ СЕМЁНА!', 1.8);
    },
    // ---------------- кадр ----------------
    update(lv, dt) {
      P.liveLayout(); if (P.freeze) return;     // конструктор: «стоп-кадр»
      const B = P.B, R = P.R, L = C(), T = AT(), WY = P.WY;
      if (P.edit) { lv.P.hp = 100; P.A.cd = 99; }
      P.t += dt; B.t += dt; P.inv -= dt; P.fireT -= dt; P.fireA -= dt; P.swingT = (P.swingT || 0) - dt; for (const q of P.scr) q.t += dt; P.scr = P.scr.filter(q => q.t < q.life); P.hurtT -= dt; P.diveCd -= dt; P.surfT -= dt; P.stunT -= dt; P.cam += dt * 40; B.flashT -= dt; B.shieldT -= dt;
      P.W.update(dt, 1.6);
      // течение: плоты; гранатомёт — на одном из плотов, пока не подобран
      L.lanes.forEach((ln, i) => { const pt = P.lanePitch(i); let x = P.laneX[i] + P.laneV(i) * dt;     // следующий плот ряда — ровно через шаг за предыдущим (даже если тот потоплен)
        if (x - pt > (L.raftX0 ?? -60)) { x -= pt; const nr = P.addRaft(x, i); if (!P.gun && (!P.gunRaft || P.gunRaft.x > 660 || P.gunRaft.sink)) P.gunRaft = nr; }
        P.laneX[i] = x; });
      if (!P.gun && P.gunRaft && P.raft === P.gunRaft && P.onG && Math.abs(P.x - P.gunRaft.x) < P.gunRaft.w * 0.45) { P.gun = true; P.gunRaft = null; P.wpn = 'rpg'; Sound.play('pickup'); lv.say('ГРАНАТОМЁТ! СТРЕЛЯЙ ПО СТАНЦИЯМ', 2); }
      for (const r of P.rafts) { r.x += r.vx * dt; r.bob += dt * 2; r.top = r.ly - r.h * L.raftTop + Math.sin(r.bob) * 1.5 + r.sink * 40 - P.waveLift(r.x) * r.s; if (r.sink) r.sink += dt * 0.8; }
      P.rafts = P.rafts.filter(r => r.x < 720 && r.sink < 1.5);
      // станции и лапы: пока хоть одна подключена — щит
      for (const s of P.stations) {
        s.t += dt; s.dmgT -= dt;
        if (s.st === 'float') { const tx = L.stations[s.slot].x; s.x += clamp(tx - s.x, -60 * dt, 60 * dt); if (Math.abs(tx - s.x) < 2) { s.st = 'plug'; s.link = 0; Sound.play('zap'); P.shk(4, 0.4); lv.say('СЕМЁН СНОВА ПОДКЛЮЧИЛСЯ!', 1.8); } }
        if (s.st === 'plug') s.link = Math.min(1, s.link + dt * 1.5);
        if (s.st === 'dead') { s.sink += dt; s.link = Math.max(0, s.link - dt * 2.5); }
      }
      for (const s of P.stations) if (T.stationRespawn && s.st === 'dead' && s.sink > T.stationBack && B.hp > 0) {     /* владелец: разрушенная станция больше не приплывает (stationRespawn: false) */ const sl = L.stations[s.slot]; Object.assign(s, { st: 'float', x: sl.x < 320 ? -90 : 730, y: sl.y, sink: 0, hp: T.stationHp + B.seg * 10, link: 0 }); lv.say('ПРИПЛЫЛА НОВАЯ СТАНЦИЯ!', 1.6); }
      B.inv = P.stations.some(s => s.st === 'plug' && s.link > 0.6);
      // Семён: поза рук от хлопка (или рык), наложения — от остальных атак
      R.ovr = {}; R.shield = 0; R.watch = { x: P.x, y: P.y }; R.aimL = R.aimR = null; R.gunT = null;     /* хлопок выставит прицел заново в этом кадре */
      // лапы Семёна: каждая тянется к своей станции; станция взорвана — лапа отламывается, новая станция — лапа отрастает
      for (const s of P.stations) { const lg = R.legs[s.leg]; if (!lg) continue; const sk = L.sock || [15, -67]; lg.tgt = [s.x + sk[0] * s.s * 0.5, s.y + s.sink * 18 + sk[1] * s.s * 0.5];     // коготь — в гнездо генератора (sock: точка кадра stat10 от низа-центра)
        if (s.st === 'plug') { lg.grow = Math.min(1, lg.grow + dt * 1.2); lg.reach = lg.grow < 1 ? 0 : s.link; lg.hot = s.link > 0.6; }
        else if (s.st === 'dead') { lg.grow = 0; lg.reach = 0; lg.hot = 0; }
        else { lg.grow = Math.min(1, lg.grow + dt * 0.8); lg.reach = 0; lg.hot = 0; } }
      for (const h of (P.hoses || [])) { h.t += dt; if (!h.out && (!P.atks.includes(h.a) || h.t > 5)) h.out = 1e-3;     // атаку прервали (смерть, сегмент, победа) — уходит сам
        if (h.out) { h.out += dt; h.H.ovr.hose = null; h.H.hoseT = null; }
        h.rise = clamp(h.rise + dt * (h.out ? -1.5 : h.up ? 2.8 : 0), 0, 1); const u = h.rise; if (h.H) { h.H.y = h.by + (1 - u * u * (3 - 2 * u)) * h.L; h.H.update(dt); } }     // выезжает из воды / уходит под воду
      P.hoses = (P.hoses || []).filter(h => !(h.out > 0.9));
      // волны бьются о основание станций
      for (const s of P.stations) if (s.st !== 'dead' && s.sink < 1.5) { s.foamT = (s.foamT || rnd(0, 0.5)) - dt; if (s.foamT <= 0) { s.foamT = rnd(0.2, 0.5); const hw = P.stW() * s.s * 0.2;
        P.fx.push({ k: Math.random() < 0.35 ? 'splash' : 'foam', x: s.x + rnd(-hw, hw), y: s.y + s.sink * 18 - 3 * s.s, t: 0, life: rnd(0.5, 0.8), s: rnd(0.2, 0.32) * s.s }); } }
      // волны бьются о пузо Семёна
      P.foamT = (P.foamT || 0) - dt; if (P.foamT <= 0) { const sm = L.sem, hw = sm.H * 0.2; P.foamT = rnd(0.08, 0.2); P.fx.push({ k: 'foam', x: sm.x + rnd(-hw, hw), y: sm.y + rnd(-2, 3), t: 0, life: rnd(0.5, 0.9), s: rnd(0.18, 0.3) }); }
      let pose = 'idle';
      if (B.hp > 0) {
        if (P.stunT > 0) { R.ovr.mouth = 1; P.A.cd = Math.max(P.A.cd, 0.6); }
        else if (P.atks.length < T.tracks[B.seg]) { P.A.cd -= dt; if (P.A.cd <= 0) { const k = P.pick(); if (k) P.startAtk(k); P.A.cd = T.cd[B.seg] * rnd(0.8, 1.2); } }
        P.atks = P.atks.filter(a => !P.updAtk(a, dt));
        const cl = P.atks.find(a => a.k === 'clap' || a.k === 'smash'); if (cl) pose = cl.pose || 'clapUp';
        else if (R.ovr.pose) pose = R.ovr.pose;
        else if (P.atks.some(a => a.k === 'gun')) pose = 'gun'; else if (P.atks.some(a => a.k === 'laser')) pose = 'laser'; else if (P.atks.some(a => a.k === 'plasma')) pose = 'plasma';
      }
      // в паузах дразнится: бьёт себя в грудь, тычет пальцем в Валеру, рычит
      P.tauntCd = (P.tauntCd ?? 3) - dt;
      if (P.taunt) { P.taunt.t += dt; if (pose !== 'idle' || P.taunt.t > P.taunt.len) P.taunt = null; else pose = P.taunt.k; }
      else if (pose === 'idle' && B.hp > 0 && P.tauntCd <= 0) { const k = ['chest', 'point', 'chest', 'roar'][(Math.random() * 4) | 0]; P.taunt = { k, t: 0, len: k === 'point' ? 2.2 : k === 'roar' ? 1.2 : 1.6 }; P.tauntCd = rnd(3.5, 7);
        if (k === 'point') lv.say(['ТЫ СЛЕДУЮЩИЙ, ВАЛЕРКА!', 'РАЗДАВЛЮ КАК МУХУ!', 'ИДИ СЮДА!'][(Math.random() * 3) | 0], 1.6); else Sound.play('stomp', 0.4); }
      if (P.roarT > 0) { P.roarT -= dt; if (pose === 'idle') pose = 'roar'; }
      if (B.hp <= 0 || P.stunT > 0) pose = 'hurt';
      R.setPose(pose); R.update(dt);
      // Валера
      P.updValera(lv, dt);
      P.x = Math.max(P.x, 14);
      if (P.x > 650 && !lv.dead) { if (P.edit) { P.x = 200; P.swim = true; } else if (lv.P.hp <= 25) lv.kill('ВАЛЕРУ УНЕСЛО ТЕЧЕНИЕМ'); else { lv.P.hp -= 25; const r = P.rafts.filter(q => q.x < 400 && !q.sink).sort((a, b) => b.x - a.x)[0]; if (r) { P.x = r.x; P.y = r.top - 2; P.swim = false; } else { P.x = 200; P.swim = true; } P.inv = 1.5; lv.say('ТЕЧЕНИЕ! ДЕРЖИСЬ ЛЕВЕЕ', 1.5); } }     /* тестировщик: было мгновенной смертью */
      // плазменные шары: летят за Валерой 10 с; под водой теряют его и кружат
      for (const b of P.balls) {
        if (b.ref) { b.t += dt; const m = R.P('m'), a = Math.atan2(m[1] - b.y, m[0] - b.x), k = clamp(dt * 6, 0, 1); b.vx = lerp(b.vx, Math.cos(a) * 320, k); b.vy = lerp(b.vy, Math.sin(a) * 320, k); b.x += b.vx * dt; b.y += b.vy * dt;
          if (Math.hypot(m[0] - b.x, m[1] - b.y) < 24 && B.hp > 0) { b.dead = 1; if (B.inv && !(P.stunT > 0)) B.shieldT = 0.4; else B.damage(T.reflDmg2 ?? 60); lv.score += 120; P.shk(6, 0.3); Sound.play('boom', 0.6); P.fx.push({ k: 'boom', x: b.x, y: b.y, t: 0, life: 0.6, s: 0.6 }); }
          if (b.t > 3) b.dead = 1; if (b.dead) P.fx.push({ k: 'pop', x: b.x, y: b.y, t: 0, life: 0.4 }); continue; }
        b.t += dt; const tx = P.x, ty = P.y - 40 * P.K, inW = P.under() || P.swim || P.climbT > 0, lost = !!b.pass;     /* владелец: шары всегда летят на Валеру; Валера в воде — шар проносится мимо вниз и уходит в воду */
        if (b.pass) { b.vy += 260 * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.y > WY + 6) { b.dead = 1; P.fx.push({ k: 'splash', x: b.x, y: WY, t: 0, life: 0.5 }); Sound.play('splash', 0.3); continue; } if (b.x < -40 || b.x > 680) { b.dead = 1; continue; } continue; }
        if (b.t > 0.4) { const a = Math.atan2(ty - b.y, tx - b.x), sp = T.ballSpeed * (1 + B.seg * 0.15), k = clamp(T.ballTurn * dt, 0, 1); b.vx = lerp(b.vx, Math.cos(a) * sp, k); b.vy = lerp(b.vy, Math.sin(a) * sp, k); }
        b.x += b.vx * dt; b.y = inW ? b.y + b.vy * dt : Math.min(WY - 10, b.y + b.vy * dt);
        if (P.swingT > 0.04 && P.swingT < (AT().swingT ?? 0.34) - 0.06 && !P.swim && !P.dive) { const hx = P.x + P.dir * 30 * P.K, hy = P.y - (P.swUp ? 96 : 58) * P.K;
          if (Math.hypot(b.x - hx, b.y - hy) < (AT().swingR ?? 52) * P.K + 12) { b.ref = 1; b.t = 0; const m = R.P('m'), a = Math.atan2(m[1] - b.y, m[0] - b.x); b.vx = Math.cos(a) * 340; b.vy = Math.sin(a) * 340; lv.score += 30; Sound.play('zap', 0.8); P.shk(2, 0.12);
            for (let i = 0; i < 6; i++) P.fx.push({ k: 'spark', x: b.x, y: b.y, vx: rnd(-120, 120), vy: rnd(-120, 60), g: 0, t: 0, life: 0.3, s: 0.06 }); if ((P.hintR = (P.hintR || 0) + 1) <= 2) lv.say('ОТБИЛ! ШАР ЛЕТИТ В СЕМЁНА!', 1.2); continue; } }
        const dB = Math.hypot(P.x - b.x, P.y - 40 * P.K - b.y), hitR = (AT().ballHitR ?? 22) + 14 * P.K;
        if (inW && (dB < hitR + 18 || b.y > WY - 14)) { b.pass = 1; b.vy = Math.max(b.vy, 120); }     // в воде: шар проскакивает мимо и ныряет за ним
        else if (!inW && dB < hitR) {     /* радиус по видимому шару (владелец: шары не били) */ P.hurt(T.ballDmg, 'ball'); b.dead = 1; }
        if (b.t > T.ballLife) b.dead = 1;
        if (b.dead) P.fx.push({ k: 'pop', x: b.x, y: b.y, t: 0, life: 0.4 });
      }
      P.balls = P.balls.filter(b => !b.dead);
      // волна хлопка бежит по воде от центра: задевает всё на поверхности (спасает только нырок)
      for (const w of P.waves) { w.t += dt; w.x += w.d * w.v * dt; w.h = clamp(w.t / 0.35, 0, 1) * w.a * (w.x < -20 || w.x > 660 ? 0.5 : 1);
        if (!w.hit && w.h > 0.5 && Math.abs(P.x - w.x) < 12 && !P.dive && (P.onG || P.swim) && !(P.climbT > 0)) { w.hit = 1;     /* владелец: волна скидывает Валеру в воду */
          P.fx.push({ k: 'splash', x: P.x, y: P.y, t: 0, life: 0.5, big: 1 }); if (P.onG) { P.jl = P.jl0 = null; P.outOfRaft(); P.onG = false; P.raft = null; P.swim = true; P.vy = 0; P.x += w.d * 20; P.y = P.WY + 6; Sound.play('splash'); lv.say('СМЫЛО ВОЛНОЙ!', 0.9); } }
        if (Math.random() < dt * 10) P.fx.push({ k: 'foam', x: w.x + rnd(-10, 10), y: P.WY + rnd(0, 46), t: 0, life: 0.5, s: 0.22 }); }
      P.waves = P.waves.filter(w => w.x > -90 && w.x < 730);
      // миньоны
      P.minT -= dt; if (P.minT <= 0 && B.hp > 0) { P.minT = T.minionEvery * rnd(0.7, 1.3); if (P.foes.filter(f => !f.dead).length < T.minions[B.seg]) { const sp = R.P(Math.random() < 0.5 ? 'legL' : 'legR'), k = ['bat', 'eye', 'bat', 'worm', 'blob'][(Math.random() * 5) | 0]; P.foes.push(new L10.Minion(k, clamp(sp[0], 30, 610), Math.min(sp[1], 200), { env: P.env })); } }
      for (const f of P.foes) f.update(dt); P.foes = P.foes.filter(f => !f.gone);
      // победа
      if (B.hp <= 0) { P.winT += dt; P.atks = []; P.balls = []; if (P.winT > 2.2) lv.next(); }
      // гранаты
      for (const b of P.bul) {
        b.t += dt; b.vy += (b.g ?? 700) * dt; const BK = AT().bulK ?? 0.8;     /* выстрелы реже — урон пули выше */ b.x += b.vx * dt; b.y += b.vy * dt; let hit = false;     // BK — урон пули как доля урона прежней гранаты
        for (const s of P.stations) if ((s.st === 'plug' || s.st === 'float') && Math.abs(b.x - s.x) < P.stW() / 2 * s.s * 0.6 && b.y > s.y - P.stH() * 1.08 * s.s * 0.5 - 14 && b.y < s.y + 6) { hit = true; P.hitStation(s, lv, 6 * BK); break; }
        if (!hit) for (const f of P.foes) if (!f.dead) { const bx = f.box(); if (b.x > bx[0] && b.x < bx[0] + bx[2] && b.y > bx[1] && b.y < bx[1] + bx[3]) { f.hit(6 * BK); hit = true; break; } }
        if (!hit && B.hp > 0) { const bx = R.box(); if (b.x > bx[0] + bx[2] * 0.12 && b.x < bx[0] + bx[2] * 0.88 && b.y > bx[1] && b.y < C().sem.y) { const m = R.P('m'), nearM = Math.hypot(b.x - m[0], b.y - m[1]) < (P.stunT > 0 ? 38 : 30), weak = nearM && (R.v.mouth > 0.5 || P.stunT > 0); if (B.inv && !(weak && P.stunT > 0)) B.shieldT = 0.3; else { hit = true;     /* щит не глотает пули (критик); оглушённому — в рот и сквозь щит */ B.damage((weak ? AT().dmgWeak : AT().dmg) * BK * (AT().rocketK ?? 0.12));     /* владелец: ракеты почти не отнимают — главное отбитые шары */ lv.score += weak ? 40 : 15; } } }
        if (!hit && b.y > (b.wy ?? WY + 6)) for (const s of P.stations) if ((s.st === 'plug' || s.st === 'float') && Math.abs(b.x - s.x) < P.stW() / 2 * s.s * 0.5 + AT().splash) { P.hitStation(s, lv, 4 * BK); break; }     // граната рвётся в воде рядом — задевает станцию
        if (hit) lv.stats.hits = (lv.stats.hits || 0) + 1;     // точность в итогах (критик: было 0%)
        if (hit || b.y > (b.wy ?? WY + 6) || b.x > 680 || b.x < -40 || b.y < -60) { b.dead = 1; P.fx.push({ k: b.y > WY ? 'splash' : 'boom', x: b.x, y: Math.min(b.y, WY), t: 0, life: 0.45, s: 0.35 }); if (hit) Sound.play('boom', 0.5); }
      }
      P.bul = P.bul.filter(b => !b.dead); P.balls = P.balls.filter(b => !b.dead);
      for (const e of P.ebul) { e.t = (e.t || 0) + dt; if (e.grav) e.vy += 900 * e.grav * dt; e.x += e.vx * dt; e.y += e.vy * dt; if (Math.abs(e.x - P.x) < 14 * P.K && e.y > P.y - 70 * P.K && e.y < P.y && !P.under()) { e.dead = 1; P.hurt((e.dmg || 8) * (e.raw ? 1 : AT().minionDmgK), e.src || 'shot'); } if (e.x < -40 || e.x > 700 || e.y > 380 || e.y < -60 || e.t > 5) e.dead = 1; }
      P.ebul = P.ebul.filter(e => !e.dead);
      P.updSub(lv, dt);
      for (const f of P.fx) f.t += dt; P.fx = P.fx.filter(f => f.t < f.life);
      for (const m of P.marks) m.t += dt; P.marks = P.marks.filter(m => m.t < m.life);
    },
    drawWaves(c, ln) { if (!P.waves.length || !L10.has('wave10')) return;
      for (const w of P.waves) { if (w.h < 0.05) continue; const f = w.t < 0.18 ? 'w0' : ['w1', 'w2', 'w1', 'w3'][((w.t * 5) | 0) % 4];
        P.waveSpr(c, f, w.x, ln.y + 7 * ln.k, (AT().waveS ?? 0.85) * ln.k * (0.5 + 0.5 * w.h), w.d < 0, Math.min(1, w.h * 1.5)); } },
    // волна с плавно растворённым низом (владелец: у волн снизу были видны прямые обрезы и стыки между рядами)
    waveSpr(c, n, x, y, s, flip, a) { const fr = L10.fr('wave10', n), im = L10.img.wave10; if (!fr || !im) return; const k = s * 0.5, w = Math.ceil(fr[2] * k), h = Math.ceil(fr[3] * k); if (w < 2 || h < 2) return;
      const o = P.wvC || (P.wvC = document.createElement('canvas')); if (o.width < w || o.height < h) { o.width = Math.max(o.width, w); o.height = Math.max(o.height, h); } const g = o.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, o.width, o.height); g.imageSmoothingEnabled = true; g.drawImage(im, fr[0], fr[1], fr[2], fr[3], 0, 0, w, h);
      const gr = g.createLinearGradient(0, h * 0.5, 0, h); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = gr; g.fillRect(0, 0, w, h);
      c.save(); c.translate(x, y); if (flip) c.scale(-1, 1); c.globalAlpha *= a; c.imageSmoothingEnabled = true; c.drawImage(o, 0, 0, w, h, -fr[4] * k, -fr[5] * k, w, h); c.restore(); },
    drawBeam(c, from, to, k = 'laser', th = 8) { const [x0, y0] = from, [x1, y1] = to, a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0), f = L10.fr('fx10', k); if (!f) return; c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x0, y0); c.rotate(a); c.imageSmoothingEnabled = true; c.drawImage(L10.img.fx10, f[0], f[1], f[2], f[3], 0, -th / 2, L, th); c.restore(); },
    // лапа со спины к станции: кольчатая лента tent10, по ней бежит ток, пока подключена
    drawLeg(c, s) {
      if (s.link <= 0.01 || !L10.has('tent10')) return;
      const sm = C().sem, la = C().legA[s.x < sm.x ? 0 : 1], k = sm.H / 236, x0 = sm.x + la[0] * k, y0 = sm.y + la[1] * k, x1t = s.x, y1t = s.y - P.stH() * s.s * 0.5 * 0.85;
      const x1 = lerp(x0, x1t, s.link), y1 = lerp(y0, y1t, s.link), L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0), f = L10.fr('tent10', 'seg'), sag = Math.min(60, L * 0.25);
      c.save(); c.imageSmoothingEnabled = true; const n = Math.max(2, (L / 26) | 0), pts = [];
      for (let i = 0; i <= n; i++) { const u = i / n; pts.push([lerp(x0, x1, u) + Math.sin(u * 6 + P.t * 3) * 3, lerp(y0, y1, u) - Math.sin(u * Math.PI) * sag + Math.sin(u * 9 + P.t * 4) * 2]); }
      for (let i = 0; i < n; i++) { const p = pts[i], q = pts[i + 1], aa = Math.atan2(q[1] - p[1], q[0] - p[0]), l = Math.hypot(q[0] - p[0], q[1] - p[1]); c.save(); c.translate(p[0], p[1]); c.rotate(aa); c.drawImage(L10.img.tent10, f[0], f[1], f[2], f[3], -2, -9 * (1 - i / n * 0.4), l + 4, 18 * (1 - i / n * 0.4)); c.restore(); }
      c.restore(); S(c, 'tent10', 'sucker', x1, y1, 0.2, { rot: a });
      if (s.st === 'plug' && s.link > 0.6) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(140,220,255,${0.5 + Math.random() * 0.4})`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i <= n; i++) c.lineTo(pts[i][0] + rnd(-4, 4), pts[i][1] + rnd(-4, 4)); c.stroke(); c.restore(); }
    },
    // СЛОИ СЦЕНЫ (порядок рисования). Правит «Редактор фазы 3» (L.layers); без него — порядок по умолчанию.
    // k: sky — небо, sea — полоса моря, ships — корабли, img — своя картинка (assets/l10/sea3/<img>.png), stFar/stNear — дальние/ближние станции,
    // sem — Семён, semWater — вода перед Семёном, laser, rafts — плоты, hose — шланг над водой, actors — Валера, миньоны, пули, arms — руки у зрителя, fx — взрывы и брызги, rain — дождь
    LAYERS: [{ k: 'sky' }, { k: 'sea' }, { k: 'sea', sp: -190, dx: 700, dy: 3, a: 0.33, w: 1.3 }, { k: 'ships' }, { k: 'stFar' }, { k: 'sem' }, { k: 'semWater' }, { k: 'laser' }, { k: 'stNear' }, { k: 'rafts' }, { k: 'hose' }, { k: 'actors' }, { k: 'arms' }, { k: 'fx' }, { k: 'rain' }],
    draw(lv, c) {
      P.armsF = P.R.armsFront ? P.R.armsFront() : false;
      for (const ly of C().layers || P.LAYERS) {
        if (ly.hide) continue; const a = ly.a ?? 1; if (a <= 0.001) continue;
        c.save(); if (a < 1 && ly.k !== 'sea' && ly.k !== 'rain') c.globalAlpha *= a; try { P.drawLayer(c, ly, lv); } catch (e) { console.warn('layer', ly.k, e); } c.restore();
      }
      if (P.atks.some(a => a.k === 'clap' && a.st === 'up')) { c.strokeStyle = `rgba(255,40,30,${0.35 + 0.35 * Math.sin(P.t * 22)})`; c.lineWidth = 8; c.strokeRect(4, 4, 632, 352); }     // предупреждение хлопка
    },
    // владелец: кораблей нет — только пара подлодок, стоящих у горизонта (fix — без хода и без параллакса)
    ships(n) { if (!P.shipL) P.shipL = [{ k: 'sub', x: 34, sp: 1, z: 0.02, ph: 0.7, fix: 1, sc: 1.4 }, { k: 'sub', x: 84, sp: -1, z: 0, ph: 3.1, fix: 1, sc: 1.05 }]; return P.shipL; },
    drawLayer(c, ly, lv) {
      const R = P.R, WY = P.WY, sm = C().sem, bg = C().bg || {}, t = G.t, seaY = bg.seaY ?? 150, cam = P.cam;
      const far = s => s.y < sm.y;
      const drawSt = s => { const fr = s.st === 'dead' ? 'dead' : s.dmgT > 0 ? 'dmg' : s.st === 'plug' ? 'plug' : 'ok', by = s.y + s.sink * 18, a = clamp(1 - (s.sink - 2) / 2, 0, 1); S(c, 'stat10', fr, s.x, by, s.s, { a });
        if (L10.has('fx10') && a > 0.05) { const hw = P.stW() * s.s * 0.22, n = 9; for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, x = s.x - hw + 2 * hw * u + Math.sin(t * 1.4 + i * 2.1 + s.x) * 4;     // пена и волны у основания, как у пояса Семёна
          S(c, 'fx10', 'splash', x, by - 3 * s.s + (i % 2) * 3 + Math.sin(t * 2.3 + i) * 1.5, (0.2 + 0.06 * Math.sin(t * 2.1 + i * 1.7)) * s.s, { add: 1, a: a * (0.5 + 0.2 * Math.sin(t * 3 + i)), sy: 0.45 }); } } };
      switch (ly.k) {
        case 'sky': { const y = ly.y ?? -24, h = ly.h ?? seaY + 56, sp = ly.sp ?? 260, im = ly.img ? 'sea3_' + ly.img : 'bg1sky';
          L10.bgTile(c, im, cam + t * sp, ly.par ?? 0.01, y, h);
          if (P.W.flash > 0 && ly.flash !== 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = P.W.flash * 0.5; L10.bgTile(c, im, cam + t * sp, ly.par ?? 0.01, y, h); c.restore(); }
          if (ly.bolt !== 0) P.W.drawBolt(c); break; }
        case 'sea': { const h = ly.h ?? bg.seaH ?? 230, sp = ly.sp ?? 140, w = ly.w ?? 0.9, im = ly.img ? 'sea3_' + ly.img : 'bg1sea';
          c.globalAlpha *= ly.a ?? 1; L10.bgTile(c, im, cam + t * sp + (ly.dx || 0), ly.par ?? 0.05, (ly.y ?? seaY) + (ly.dy || 0) + Math.sin(t * w + (ly.dx ? 1 : 0)) * (ly.wave ?? 1.5), h); break; }
        case 'ships': { const SEA_W = 1500, dz = ly.dz ?? bg.shipZ ?? 70, y0 = ly.y ?? seaY, k = ly.s ?? 1, im = L10.img.bg1ships, RR = L10.BG1 && L10.BG1.ships;
          for (const sh of P.ships(ly.n ?? bg.ships ?? 7)) {
            const x = sh.fix ? sh.x : ((sh.x + sh.sp * t - cam * 0.05 * (0.6 + sh.z)) % SEA_W + SEA_W) % SEA_W - 250, y = y0 + 9 + sh.z * dz + Math.sin(t * 1.1 + sh.ph) * (1 + sh.z * 2), s = (0.12 + sh.z * 0.16) * k * (sh.sc || 1), rot = Math.sin(t * 0.9 + sh.ph) * 0.025;
            if (x < -200 || x > 840) continue;
            c.save(); c.translate(x, y); c.rotate(rot); c.imageSmoothingEnabled = true;
            if (sh.k === 'sub') { if (L10.has('sub10')) L10.spr(c, 'sub10', 'sub', 0, 6 * s, s * 0.9, { flip: sh.sp < 0 }); }
            else if (im && RR) { const r = RR[sh.k], w = r[2] * s, h = r[3] * s; if (sh.sp < 0) c.scale(-1, 1); c.drawImage(im, r[0], r[1], r[2], r[3], -w / 2, -h, w, h); }
            c.restore();
          }
          c.imageSmoothingEnabled = false; break; }
        case 'img': { const im = L10.img['sea3_' + ly.img]; if (!im) break; const s = ly.s ?? 0.5, w = im.width * s, h = im.height * s, y = (ly.y ?? 180) + Math.sin(t * (ly.bobW ?? 1) + (ly.x || 0)) * (ly.bob || 0);
          if (ly.add) c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true;
          if (ly.tile) { const sp = ly.sp || 0, x0 = (((ly.x ?? 0) - cam * (ly.par ?? 0) - t * sp) % w + w) % w - w; for (let x = x0; x < 640; x += w) { if (ly.flip) { c.save(); c.translate(x + w, y - h / 2); c.scale(-1, 1); c.drawImage(im, 0, 0, w, h); c.restore(); } else c.drawImage(im, x, y - h / 2, w, h); } }
          else { const x = (ly.x ?? 320) - cam * (ly.par ?? 0) + Math.sin(t * 0.3) * (ly.drift || 0); c.save(); c.translate(x, y); if (ly.r) c.rotate(ly.r * Math.PI / 180); if (ly.flip) c.scale(-1, 1); c.drawImage(im, -w / 2, -h / 2, w, h); c.restore(); }
          c.imageSmoothingEnabled = false; break; }
        case 'stFar': for (const s of P.stations) if (far(s)) drawSt(s); break;
        case 'stNear': for (const s of P.stations) if (!far(s)) drawSt(s); break;
        case 'sem': c.beginPath(); c.rect(-50, -400, 740, sm.y + 400); c.clip(); R.draw(c, { arms: P.armsF ? 'skip' : null }); break;     // всё, что ниже его линии воды, — под водой
        case 'semWater': { const im = ly.img ? 'sea3_' + ly.img : 'bg1sea';
          { const a0 = c.globalAlpha; for (const [dy, a] of [[-11, 0.2], [-8, 0.4], [-6, 0.65]]) { c.globalAlpha = a0 * a; L10.bgTile(c, im, cam + t * 140, 0.05, sm.y + dy + Math.sin(t * 0.9 + dy) * 1.5, 380 - sm.y); } c.globalAlpha = a0; }     // мягкий край воды у пояса
          L10.bgTile(c, im, cam + t * 140, 0.05, sm.y - 4 + Math.sin(t * 0.9) * 1.5, 380 - sm.y);
          c.globalAlpha *= 0.33; L10.bgTile(c, im, cam - t * 190 + 700, 0.05, sm.y - 1, 380 - sm.y); c.globalAlpha = 1;
          if (L10.has('fx10') && ly.foam !== 0) { const bx = R.box(), n = 20; for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, x = bx[0] + bx[2] * (0.03 + 0.94 * u) + Math.sin(t * 1.3 + i * 2) * 5; S(c, 'fx10', 'splash', x, sm.y + 1 + (i % 2) * 4, 0.2 + 0.05 * Math.sin(t * 2.1 + i * 1.7), { add: 1, a: 0.5 + 0.2 * Math.sin(t * 3 + i), sy: 0.4 }); } }     // пена у пояса — нет резкого шва
          break; }
        case 'laser': for (const a of P.atks) if (a.k === 'laser') { const p1 = R.P('e'), p2 = R.P('e2'), em = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]; if (a.warn) { c.save(); c.globalAlpha = 0.35 + 0.3 * Math.sin(P.t * 30); c.fillStyle = '#ff3020'; c.fillRect(Math.min(a.x0, a.x1), WY - 3, 680, 2); c.restore(); P.drawBeam(c, p1, [a.x0 - 12, WY - 4], 'laser', 2); P.drawBeam(c, p2, [a.x0 + 12, WY - 4], 'laser', 2); } else { P.drawBeam(c, p1, [a.x - 12, WY - 4], 'laser', 9); P.drawBeam(c, p2, [a.x + 12, WY - 4], 'laser', 9);     /* владелец: лазер из двух глаз */ if (L10.has('fx10')) S(c, 'fx10', 'lhit', a.x, WY - 6, 0.4, { add: 1 }); } } break;
        case 'rafts': { P.rafts.sort((a, b) => a.ly - b.ly); const RS = r => S(c, C().raftSheet, 'raft' + r.n, r.x, r.top + r.h * C().raftTop + C().raftSub, r.s, { a: 1 - r.sink * 0.6 });
          const lanes = [{ y: WY, k: 0.62 }].concat(C().lanes.slice().sort((a, b) => a.y - b.y)); let i = 0;
          for (const ln of lanes) { P.drawWaves(c, ln); for (; i < P.rafts.length && P.rafts[i].ly <= ln.y + 1; i++) RS(P.rafts[i]); }
          for (; i < P.rafts.length; i++) RS(P.rafts[i]); break; }
        case 'hose': for (const h of (P.hoses || [])) if (h.H) { c.save(); c.beginPath(); c.rect(-50, -400, 740, 800); const cw = h.H.ovr.hose === 'hit' ? 30 : 160; c.rect(h.x - cw, h.y, cw * 2, 140); c.clip('evenodd'); h.H.drawHoseOnly(c); c.restore();     /* под водой прячется только то, что прямо под корнем; удар вперёд-вниз виден */
            const w = clamp(h.H.hoseW * 1.6, 0, 1) * (h.out ? Math.max(0, 1 - h.out) : 1); if (w > 0.05 && L10.has('fx10')) for (let i = 0; i < 6; i++) S(c, 'fx10', 'splash', h.x + (i - 2.5) * 6 + Math.sin(t * 5 + i * 2) * 2, h.y + (i % 2) * 2 + Math.sin(t * 7 + i) * 1.2, 0.2 + 0.05 * Math.sin(t * 6 + i), { add: 1, a: w * (0.65 + 0.2 * Math.sin(t * 9 + i)), sy: 0.5 }); } break;     // пена там, где шланг выходит из воды     // шланги из моря: ниже линии воды не видно     // шланг, вылетевший из воды к цели, — поверх воды и плотов
        case 'actors':
          if (!P.gun && P.gunRaft) { const r = P.gunRaft, b = Math.sin(P.t * 4) * 2; S9(c, 'fxL9', 'spark', r.x, r.top - 14, 0.45 + Math.sin(P.t * 5) * 0.08, { add: 1 }); S9(c, 'pick9', 'rocket', r.x, r.top - 10 + b, 0.6); }
          for (const m of P.marks) L10.Minion.mark(c, m.x, (m.y || WY) - 5, 60, 0.4 + 0.4 * Math.sin(m.t * 18));
          for (const f of P.foes) f.draw(c);
          if (P.sub) { const s = P.sub, u = s.t < 0.7 ? s.t / 0.7 : s.t > 3.1 ? Math.max(0, 1 - (s.t - 3.1) / 0.7) : 1, f = s.t > 1 && s.t < 2.6 ? ((s.t * 8 | 0) % 2 ? 'subFire' : 'subOpen') : 'sub';
            c.save(); c.beginPath(); c.rect(-20, -400, 680, WY + 6 + 400); c.clip(); S(c, 'sub10', f, s.x, WY + 4 + (1 - u) * 34 + Math.sin(P.t * 3) * 1.5, 0.34); c.restore(); }
          P.drawValera(c);
          for (const o of P.tosses) { const u = o.t / o.dur, x = lerp(o.x0, o.x1, u), y = lerp(o.y0, o.y1, u) - Math.sin(u * Math.PI) * 150; S(c, C().raftSheet, 'raft' + o.n, x, y, 0.42, { rot: o.r0 + u * 5 }); }
          for (const m of P.miss) { const r = Math.atan2(m.vy, m.vx); S(c, 'sub10', 'missile', m.x, m.y, 0.15, { rot: r + Math.PI / 2 }); S(c, 'fx10', 'flash', m.x - Math.cos(r) * 14, m.y - Math.sin(r) * 14, 0.08, { add: 1 }); }
          if (P.stunT > 0 && P.B.hp > 0) { const e = R.P('e'), e2 = R.P('e2'), cx = (e[0] + e2[0]) / 2, cy = Math.min(e[1], e2[1]) - 30; for (let i = 0; i < 4; i++) { const a = P.t * 4 + i * Math.PI / 2; S9(c, 'fxL9', 'spark', cx + Math.cos(a) * 34, cy + Math.sin(a) * 9, 0.4, { add: 1 }); } }     // звёзды над оглушённым
          for (const b of P.balls) { const k = 0.32 + Math.sin(b.t * 9) * 0.04, end = !b.ref && b.t > AT().ballLife - 1.5 && (b.t * 10 | 0) % 2; if (b.ref) S(c, 'fx10', 'flash', b.x - b.vx * 0.03, b.y - b.vy * 0.03, 0.18, { add: 1 }); if (!end) S(c, 'fx10', 'ball', b.x, b.y, b.ref ? k * 1.2 : k, { add: 1, rot: b.t * 3 }); }
          for (const b of P.bul) { const r = Math.atan2(b.vy, b.vx); S(c, 'fx10', 'tracer', b.x - Math.cos(r) * 10, b.y - Math.sin(r) * 10, 0.42, { rot: r, add: 1 }); S(c, 'fx10', 'tracer', b.x - Math.cos(r) * 6, b.y - Math.sin(r) * 6, 0.3, { rot: r, add: 1 }); S(c, 'fx10', 'flash', b.x, b.y, 0.1, { add: 1 }); }     // трассер: огненный след + яркая головка
          for (const a of P.atks) if (a.k === 'gun' && a.warn && R.gunT) { const m = R.P('mg'); c.save(); c.globalAlpha = 0.55 + 0.35 * Math.sin(P.t * 40); c.strokeStyle = '#ff2a1a'; c.lineWidth = 2; c.setLineDash([6, 4]); c.beginPath(); c.moveTo(m[0], m[1]); c.lineTo(R.gunT[0], R.gunT[1]); c.stroke(); c.restore(); }     // красный прицел перед очередью
          for (const e of P.ebul) if (e.gun) { const r = Math.atan2(e.vy, e.vx); S(c, 'fx10', 'tracer', e.x - Math.cos(r) * 8, e.y - Math.sin(r) * 8, 0.36, { rot: r, add: 1 }); } else if (e.draw) e.draw(c, e);
          break;
        case 'arms': if (P.armsF) R.draw(c, { arms: 'only' });
          for (const a of P.atks) if (a.k === 'hose' && a.sweep && a.st === 'up') { c.save(); c.globalAlpha = 0.35 + 0.3 * Math.sin(P.t * 30); c.fillStyle = '#ff3020'; c.fillRect(0, WY + 2, 640, 3); c.restore(); }     // предупреждение: шланг пойдёт по воде
          break;
        case 'fx': for (const f of P.fx) { const u = f.t / f.life; if (f.k === 'boom') S(c, 'boom10', 'b' + Math.min(3, (u * 4) | 0), f.x, f.y, f.s || 0.5, { add: 1 }); if (f.k === 'splash') S(c, 'fx10', 'splash', f.x, f.y - 10, f.big ? 0.5 : 0.25, { add: 1, a: 1 - u }); if (f.k === 'foam') S(c, 'fx10', 'splash', f.x, f.y - 6, f.s * (0.6 + u * 0.6), { add: 1, a: (1 - u) * 0.8, sy: 0.6 }); if (f.k === 'pop') S(c, 'fx10', 'flash', f.x, f.y, 0.3 + u * 0.4, { add: 1, a: 1 - u }); if (f.k === 'mz') S(c, 'fx10', 'flash', f.x, f.y, 0.16 + u * 0.08, { add: 1, a: 1 - u }); } break;
        case 'rain': P.W.draw(c, ly.a ?? 1); break;
      }
    },
    drawValera(c) {     // неуязвимость после удара — полупрозрачный, а не пропадает (при вакханалии мигал почти всё время — критик)
      const blink = P.inv > 0 && !P.dive && (P.t * 16 | 0) % 2; if (blink) { c.save(); c.globalAlpha = 0.45; } try { P.drawV(c); } finally { if (blink) c.restore(); }
    },
    drawV(c) {
      const DK = 0.95;     // лист vDive10 нарисован мельче vSea10 — без поправки нырок и всплытие в 2.5 раза меньше Валеры (критик)
      const fl = P.dir < 0, WY = P.swimY();
      if (P.climbT > 0) { S(c, 'vSea10', P.climbT > 0.25 ? 'climb0' : 'climb1', P.x, (P.raft ? P.raft.top : WY) + 20 * P.K, 0.42 * P.K, { flip: fl }); return; }
      if (P.dive) {     // под водой: полупрозрачный (вода поверх), гребки; воздух кончается — паника
        const d = P.dive, left = AT().breath - d.t, fr = d.t < 0.22 ? 'dive0' : left < 0.6 ? 'panic' : ['swim0', 'swim1', 'swim2', 'swim1'][((d.t * 6) | 0) % 4];
        S(c, 'vDive10', fr, P.x, WY + (34 + (d.t < 0.22 ? -12 + d.t * 50 : 0)) * P.K, DK * P.K, { flip: fl, a: 0.85 }); return;
      }
      if (P.surfT > 0) { S(c, 'vDive10', 'up1', P.x, WY + 8 * P.K, DK * P.K, { flip: fl }); return; }     // вынырнул — хватает воздух
      if (P.swim) { S(c, 'vSea10', ((P.t * 3) | 0) % 2 ? 'swim0' : 'swim1', P.x, WY + 18 * P.K, 0.42 * P.K, { flip: fl }); return; }
      // владелец: гранатомёт всегда один и тот же — РПГ из листов ур.9 во всех позах (раньше стоя был другой, барабанный vAim10)
      let sh = 'vAim9_rocket', fr = { diag: 'diag', up: P.fireA > 0 ? 'up' : 'diag', ddiag: P.fireA > 0 ? 'crouchFire' : 'crouch', down: 'down' }[P.aim] || (P.fireA > 0 ? 'fire' : 'stand');     // в кадре up вшит дым — только при выстреле
      if (P.st === 'run') { sh = 'vRun9_rocket'; fr = 'r' + [0, 1, 2, 4, 5, 6][(P.t * 9 | 0) % 6];     /* r3, r7 — со вшитым выхлопом */ if (P.aim === 'ddiag' || P.aim === 'down') { sh = 'vRunUD9_rocket'; fr = ['u0', 'u1', 'd0', 'u1'][(P.t * 10 | 0) % 4]; }     /* в листе все кадры смотрят вниз-вперёд; без кадров со вшитым пламенем (критик) */ }
      if (P.st === 'jump') { sh = 'vJump9_rocket'; fr = P.vy < -200 ? 'rise' : ['flip1', 'flip2', 'flip3'][(P.t * 9 | 0) % 3]; }
      if (!P.gun) { sh = sh.replace('_rocket', '').replace('vRunUD9', 'vRun9'); if (sh === 'vRun9' && fr[0] === 'u') fr = 'r' + ((P.t * 12 | 0) % 8); if (sh === 'vAim9') fr = 'stand'; }
      if ((P.wpn === 'racket' || !P.gun) && L10.img.mid_ri0) {     // ракетка в руке, гранатомёт за спиной (лист fin2/src/rkS*.jpg)
        const T0 = AT().swingT ?? 0.34; let n;
        if (P.swingT > 0) { const u = 1 - P.swingT / T0; n = P.swUp ? (u < 0.18 ? 'rw3' : u < 0.62 ? 'rw4' : 'rw5') : (u < 0.18 ? 'rw0' : u < 0.62 ? 'rw1' : 'rw2'); }
        else if (P.st === 'jump') n = P.vy < 0 ? 'rj0' : 'rj1'; else if (P.st === 'run') n = 'rr' + ((P.t * 9 | 0) % 6); else n = 'ri' + ((P.t * 1.6 | 0) % 2);
        const im = L10.img['mid_' + n]; if (im) { const H = P.K * 0.5 * (AT().rkH ?? 172) * im.height / L10.img.mid_ri0.height, w = im.width * H / im.height; c.save(); c.translate(P.x, P.y + 1); if (fl) c.scale(-1, 1); c.imageSmoothingEnabled = true; c.drawImage(im, -w * 0.5, -H, w, H); c.restore(); return; } }
      S9(c, sh, fr, P.x, P.y + 1, P.K, { flip: fl });
    },
    drawHud(lv, c) {
      for (const q of P.scr) { const im = L10.img['mid_scr' + q.i]; if (!im) continue; const r = q.r ?? 1; if (r <= 0) continue; const h = 230 * q.s, w = im.width * h / im.height;     // царапины на «стекле» экрана: проявляются за когтями, тают последние 2 с
        c.save(); c.globalAlpha = clamp((q.life - q.t) / 2, 0, 1); c.translate(q.x, q.y);
        if (r < 1) { const an = Math.atan2(q.y1 - q.y0, q.x1 - q.x0), Lh = 400; c.rotate(an); c.beginPath(); c.rect(-180, -Lh, 360 * r, Lh * 2); c.clip(); c.rotate(-an); }     // проявляется полосой от начала к концу ведения
        c.rotate(q.rot); c.imageSmoothingEnabled = true; c.drawImage(im, -w / 2, -h / 2, w, h); c.restore(); }
      for (const q of P.scr) if (q.hand) { const k = q.hk || 0, n = k < 0.15 ? 0 : k < 0.3 ? 1 : 2 + (((k * 10) | 0) % 2), im = L10.img['mid_cl' + n]; if (!im) continue;     // лапа Семёна у самого «стекла»: прижал, впился когтями, ведёт
        const u = clamp((k - 0.3) / 0.75, 0, 1), x = lerp(q.x0, q.x1, u), y = lerp(q.y0, q.y1, u), sIn = clamp(k / 0.2, 0, 1), sOut = clamp((1.35 - k) / 0.3, 0, 1), h = (AT().clawH ?? 330) * (0.6 + 0.4 * sIn), w = im.width * h / im.height;
        c.save(); c.globalAlpha = Math.min(sIn, sOut); c.translate(x, y); c.imageSmoothingEnabled = true; c.drawImage(im, -w * 0.5, -h * 0.18, w, h); c.restore(); }
      L10.bossBar(c, P.B, P.B.inv ? 'СЕМЁН — ЩИТ! ВЗОРВИ СТАНЦИИ' : 'СЕМЁН', 346);     /* владелец 2026-11-08: шкала снизу, у самого края — под плотами */
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(6, 25, 148, 16); const RKh = P.wpn === 'racket' || !P.gun; G.text(RKh ? 'РАКЕТКА' : 'ГРАНАТОМЁТ', 12, 29, { size: 8, color: RKh ? '#7fd8ff' : '#ffd84a' }); c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(6, 42, 148, 14); G.text(P.gun ? 'C — СМЕНИТЬ ОРУЖИЕ' : 'X — УДАР', 12, 45, { size: 8, color: '#c8d0d8' });
      if (P.dive) { const k = 1 - P.dive.t / AT().breath; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(P.x - 22, P.swimY() - 18, 44, 6); c.fillStyle = k > 0.3 ? '#7fd8ff' : '#ff5a3a'; c.fillRect(P.x - 21, P.swimY() - 17, 42 * k, 4); }     // запас воздуха
    },
  };
})();
