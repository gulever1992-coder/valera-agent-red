// Уровень 10, фаза 1 «КРЫШИ»: Валера бежит ВЛЕВО по крышам завода (движок платформера ур.9 L9.PARTS.lab, карта x10run),
// Семён справа на пол-экрана гонится и рушит дома позади. Крыши генерируются процедурно (без повторов).
(() => {
  const S = L10.spr, S9 = L9.spr, clamp = L10.clamp, rnd = L10.rnd;
  const LAB = () => L9.PARTS.lab;
  const SPEED0 = 58;                 // скорость прокрутки (px/с), растёт с сегментом
  const HP = 2000;
  const DS = 4;                      // шаг профиля выбоин (мировые ед.)
  const Z = 0.5, VW = 640 / Z, CY = 360 - 360 / Z;     // владелец: Валера в разы меньше домов — мир в масштабе 0.5 (физика в мировых единицах)
  const ROOFV = [0.196, 0.362, 0.19, 0.324, 0.204, 0.119];     // линия крыши в кадре roof10 (доля высоты сверху)

  L9.MAPS = L9.MAPS || {};
  L9.MAPS.x10run = () => {
    const M = { zoom: Z, x0: -1e7, x1: 1e7, y0: CY, y1: 360, solids: [], walks: [], ladders: [], lifts: [], pits: [], cks: [[60, 260]], killY: 1e9, strafe: true, dmgK: 1.15,     /* критик: фаза 1 была прогулкой (25 урона за 74 с) */ noFloor: [] };
    M.camY = () => CY;
    const W = M.weather = new L10.Weather(230);
    let camX = -150;                               // левый край экрана в мире (уменьшается)
    M.camLock = () => [camX, camX + VW];
    M.toScr = (x, y) => [sx(x), sy(y)];     // для падающих бонусов (level10drops.js)
    const sx = x => (x - camX) * Z, sy = y => (y - CY) * Z, wx = s => camX + s / Z, wy = s => s / Z + CY;     // мир <-> экран
    M.sx = sx; M.sy = sy; M.touchX = () => B.x - B.H * (B.rig ? 0.3 : 0.28);     // экранная линия передней ноги Семёна
    const JP = new Image(); JP.src = 'assets/l10/jetpack10.png?v=' + G.VER;     // джетпак на площадке (вырезан из кадра vJetUp10 j0)
    const B = M.boss = L10.makeBoss(1, L10.RIG2 ? { H: 360, x: 520, y: 405, hp: HP / 2, segs: 2, segLimit: 75 } : { H: 560, x: 560, y: 600, hp: HP / 2, segs: 1, segLimit: 100 });     // владелец: «за 2 минуты не убьёт первую часть — съедает»
    B.barSegs = 1;     // одна шкала, но 2 скрытых чекпоинта (тестировщик: смерть = заново всё)
    B.setPose(L10.fr('sem1', 'walk0') ? 'walk0' : 'roar');
    // ---- здания
    const blds = M.blds = [];
    let seed = 0;
    // типы домов: 0,1,3,4 — старый лист roof10 (r2 «пила» не для ходьбы, 5 — финальное здание); 10..15 — новый лист bld10. Масштаб у всех единый (рост Валеры 78 = 1.8 м)
    const B2 = L10.BLD2, PXM = 78 / 1.8, OLD_S = 2.3, OBJ_S = 0.55, OBJ_K = [1.15, 1, 1, 1, 1.2, 1],     /* будки с дверью крупнее — дверь выше героя (критик) */ OBJ = B2 && L10.img.rtop10 && B2.obj.length;
    const TYPES = [0, 1, 3].concat(B2 && L10.img.bld10 ? B2.bld.map((_, i) => 10 + i).filter(t => t !== 13) : []);     // 13 — жёлтый дом, 4 — ангар из гофры со скатной крышей: владелец убрал
    const NEW_K = 0.72;     // владелец: все новые дома слишком огромные — общий масштаб нового листа
    const typeW = t => t >= 10 ? Math.round(B2.bld[t - 10][2] * B2.bld[t - 10][6] * PXM / B2.bld[t - 10][5] * NEW_K) : Math.round(L10.size('roof10', 'r' + t)[0] * OLD_S);
    const bag = [], pickType = prev => { if (!bag.length) { bag.push(...TYPES.filter(t => t !== 11 || Math.random() < 0.3).sort(() => Math.random() - 0.5)); if (bag.length > 1 && bag[bag.length - 1] === prev) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]]; } return bag.pop(); };     // владелец: дома без повторов — колода, пока не выйдут все виды; панелька (11) редко     // панелька среди цехов — редко (критик)
    const addObj = b => {     // предмет на крыше: спрайт стоит на линии крыши; если лестница нарисована слева — зеркалим, чтобы была справа
      if (b.type === 0 || b.type === 1 || b.type === 4) return;     // критик: у type 0 своя надстройка, у type 1 свой бак, у type 4 скатная крыша
      let i; do i = (Math.random() * B2.obj.length) | 0; while (i === 3 || (b.type === 1 && i === 1));     // 3 — билборд, владелец убрал     // на доме с баком — без второго бака
      const k = OBJ_S * OBJ_K[i], r = B2.obj[i], w = r[2] * k, h = r[3] * k, flip = r[5] < 0.5, lf = flip ? 1 - r[5] : r[5];
      if (b.w < w + 150) return;
      const [m0, m1] = b.main || [b.x, b.x + b.w]; if (m1 - m0 < w + 150) return;
      const x = b.type === 3 ? b.x + rnd(30, Math.max(40, b.w / 3 - w)) : m0 + rnd(50, m1 - m0 - w - 90), top = b.y - (r[3] - r[4]) * k;     // type 3: только левая треть (трубы)
      (b.objs = b.objs || []).push({ i, x, w, h, top, flip, lx: x + lf * w, sx1: x + (lf - 0.06) * w });
    };
    const addB = (x, w, y, type) => { const b = { x, w, y, type, st: 'ok', t: 0, id: seed++, holes: [] }; if (type >= 10) setProf(b); blds.push(b); return b; };
    const setProf = b => {     // крыша ступенями (ТЭЦ, завод с трубой, эллинг): смещение от основной крыши по столбцам DS; высокие ступени — лестница
      const r = B2.bld[b.type - 10], P = r[7]; if (!P || P.length < 2) return;
      const s = b.w / r[2], n = Math.ceil(b.w / DS) + 2; b.prof = new Float32Array(n);
      for (let i = 0; i < n; i++) { const f = i * DS / b.w, q = P.find(q => f >= q[0] && f < q[1]) || P[P.length - 1]; b.prof[i] = (q[2] - r[4]) * s; }
      b.steps = []; for (let k = 0; k + 1 < P.length; k++) { const yl = (P[k][2] - r[4]) * s, yr = (P[k + 1][2] - r[4]) * s; if (yr - yl > 90) b.steps.push([b.x + P[k][1] * b.w, yl, yr]); }     // справа ниже слева больше прыжка
      const main = P.reduce((a, q) => q[1] - q[0] > a[1] - a[0] ? q : a); b.main = [b.x + main[0] * b.w, b.x + main[1] * b.w];
    };
    const prof = (b, i) => b.prof ? b.prof[Math.max(0, Math.min(b.prof.length - 1, i))] : 0;
    addB(170 - typeW(0), typeW(0), 170, 0);                      // стартовая крыша под Валерой (x 60)
    M.final = null; M.finalWanted = false; M.toJet = 0; M.lift = 0; M.jetT = 0;
    const gen = () => {
      let L = blds.filter(b => !b.top).reduce((a, b) => b.x < a.x ? b : a);
      while (L.x > camX - 900) {
        if (M.finalWanted && !M.final) { const g = 46; const b = addB(L.x - g - 700, 700, clamp(L.y - 30, 60, 170), 5); M.final = b; L = b; break; }
        if (M.final) break;
        const twin = false;     /* владелец: без повторов — близнецов вплотную больше нет */     /* только узкие дома — иначе крыша слишком длинная (владелец) */     // владелец: где-то крыши длиннее — тот же дом вплотную, крыша продолжается
        const step = Math.random(), type = twin ? L.type : pickType(L.type), w = typeW(type), g = twin ? 0 : step < 0.18 ? 0 : rnd(28, 80);
        let y = twin ? L.y : L.y + (step < 0.18 ? rnd(-62, -30) * (Math.random() < 0.5 ? 1 : -1) : rnd(-58, 70)); y = clamp(y, 60, 190);
        L = addB(L.x - g - w, w, y, type);
        if (OBJ && Math.random() < 0.5) addObj(L);     // предмет на крыше (будка, бак, щит…) — залезть по лестнице справа
      }
      M.ladders = blds.filter(b => b.st === 'ok' && (b.objs || b.steps)).flatMap(b => (b.objs || []).map(o => [o.lx, o.top, b.y, o.sx1 - 16]).concat((b.steps || []).map(q => [q[0] + 15, b.y + q[1], b.y + q[2], q[0] - 16])));     // [x, верх, низ, куда шагнуть наверху]
      M.solids = blds.filter(b => b.st === 'ok' || b.t < 0.35).flatMap(b => {     // выбоины: пол опускается ступенями по дну
        const os = (b.objs || []).map(o => [o.x, o.top, o.sx1 - o.x, b.y - o.top + 2, 'hide']);     // корпус предмета — стена, лестница снаружи
        if (!b.dmg && !b.prof) return [[b.x, b.y, b.w, 600, 'hide'], ...os];
        const out = [], D = b.dmg, N = Math.ceil(b.w / DS) + 2, dy = i => i < 0 || i >= N ? 0 : prof(b, i) + (D && D[i] > 6 ? D[i] : 0); let st = 0;
        for (let i = 1; i <= N; i++) if (i === N || dy(i) !== dy(st)) { const x0 = Math.max(b.x, b.x + st * DS - DS / 2), x1 = Math.min(b.x + b.w, b.x + i * DS - DS / 2); if (x1 > x0) out.push([x0, b.y + dy(st), x1 - x0, 600, 'hide']); st = i; }
        return out.concat(os);
      });
    };
    gen();
    // ---- атаки
    const A = M.atk = { cd: 1.6, cur: null, t: 0 };
    const fx = M.fx = [];              // эффекты мира: {k, x, y, t, life, ...}
    const marks = [], throws = [];     // throws — предметы с крыш, которые швыряет Семён
                     // метки удара на крышах
    const roofAt = x => { let y = null; for (const b of blds) if (b.st === 'ok' && x >= b.x && x < b.x + b.w) { for (const o of b.objs || []) if (x >= o.x && x < o.sx1 && (y == null || o.top < y)) y = o.top; const ii = Math.round((x - b.x) / DS), d = b.dmg ? b.dmg[ii] || 0 : 0, by = b.y + prof(b, ii) + (d > 6 ? d : 0); if (y == null || by < y) y = by; } return y; };     // самая верхняя крыша (надстройки)
    M.roofAt = roofAt;
    const crumble = (b) => { if (b.st !== 'ok') return; b.st = 'fall'; b.t = 0; if (b.kids) b.kids.forEach(k => crumble(k)); G.shake(3, 0.3); Sound.play('crumble', 0.7); for (let i = 0; i < 8; i++) fx.push({ k: 'deb', fr: 'd' + ((Math.random() * 12) | 0), x: b.x + rnd(0, b.w), y: b.y + rnd(-10, 30), vx: rnd(-60, 140), vy: rnd(-260, -60), r: rnd(-4, 4), t: 0, life: 2.2, s: rnd(0.25, 0.5) }); };
    // владелец: разрушение рваными кусками, а не ровной полосой. b.dmg — глубина выбоины от крыши в каждой точке (шаг DS):
    // середина выбита до низа, края — рваные ступени «кирпичными рядами»; соседние попадания сливаются в одну воронку.
    const crater = (b, x, r) => {
      if (!b.dmg) b.dmg = new Float32Array(Math.ceil(b.w / DS) + 2);
      const n = b.dmg.length, core = r * rnd(0.5, 0.85), span = r * rnd(1.9, 2.6), H0 = rnd(60, 95), D = b.dmg;     // владелец: выбоины кусками, не до земли (мельче прыжка — не застрять)
      let blk = 0, dep = 0;     // ступени: блок постоянной глубины 2–5 отсчётов (8–20 ед.), глубина рядами по 18
      for (let i = 0; i < n; i++) {
        const d = Math.abs(b.x + i * DS - x); if (d > span) { blk = 0; continue; }
        if (blk <= 0) { blk = 2 + ((Math.random() * 4) | 0); const k = d < core ? 1 : 1 - (d - core) / (span - core); dep = d < core ? Math.round(H0 * rnd(0.85, 1) / 18) * 18 : Math.max(0, Math.round((H0 * Math.pow(k, 1.2) + rnd(-50, 50)) / 18) * 18); }
        blk--; D[i] = Math.min(Math.max(D[i], dep), 96);     // не глубже 96: выпрыгнуть можно
      }
      // узкие уцелевшие перемычки между выбоинами осыпаются (не торчат шпилями)
      const E = Float32Array.from(D);
      for (let i = 0; i < n; i++) { let L = 0, R = 0; for (let k = 1; k <= 7; k++) { if (i - k >= 0) L = Math.max(L, E[i - k]); if (i + k < n) R = Math.max(R, E[i + k]); } D[i] = Math.min(96, Math.max(D[i], Math.min(L, R) * 0.85)); }
      b.holes = []; let st = -1;     // для ходьбы и крыш: где выбоина глубже 6 — дыра
      for (let i = 0; i <= n; i++) { const on = i < n && D[i] > 6; if (on && st < 0) st = i; if (!on && st >= 0) { b.holes.push([b.x + st * DS - DS / 2, b.x + i * DS - DS / 2]); st = -1; } }
    };
    M.crater = crater;
    const hole = (x, r) => { const b = blds.find(b => b.st === 'ok' && x >= b.x - r && x < b.x + b.w + r); if (b) { crater(b, x, r); for (let i = 0; i < 6; i++) fx.push({ k: 'deb', fr: 'd' + ((Math.random() * 12) | 0), x: x + rnd(-r, r), y: b.y, vx: rnd(-80, 80), vy: rnd(-200, -40), r: rnd(-5, 5), t: 0, life: 1.8, s: rnd(0.2, 0.4) }); } };
    const dust = (x, y, n = 14) => { for (let i = 0; i < n; i++) fx.push({ k: 'dust', x: x + rnd(-14, 14), y: y + rnd(-8, 8), vx: rnd(-50, 50), vy: rnd(-90, -10), t: 0, life: rnd(0.6, 1.2) }); };
    const boom = (x, y, s = 0.5) => { fx.push({ k: 'boom', x, y, t: 0, life: 0.6, s }); Sound.play('boom', 0.6); G.shake(4, 0.25); };
    const pickAtk = () => {
      const sg = B.seg, list = [['slam', 3], ['eyes', 2.2], ['plasma', 1.6 + sg], ['lunge', 1.6], ['rain', 1.2 + sg * 0.6], ['spawn', 0.8 + sg * 0.5], ['gun', 1.8 + sg * 0.4]].concat(OBJ ? [['throw', 1.8]] : []);
      let tot = list.reduce((a, b) => a + b[1], 0), r = Math.random() * tot; for (const [k, w] of list) { if ((r -= w) <= 0) return k; } return 'slam';
    };
    M.startAtk = (k, P) => {
      A.cur = k; A.t = 0; A.done = 0;
      if (k === 'slam') { B.setPose('raise', 1.0); A.tx = P.x + P.vx * 0.5; marks.push({ x: A.tx, t: 0, life: 1.0 }); Sound.play('warn', 0.6); }
      if (k === 'eyes') { B.setPose('eyes', 2.4); Sound.play('zap', 0.5); }
      if (k === 'plasma') { B.setPose('plasma', 2.8); A.tx = P.x; Sound.play('steam', 0.6); }
      if (k === 'lunge') { B.setPose('lunge', 1.3); A.ty = (roofAt(P.x) || P.y) - 34; Sound.play('warn', 0.5); }
      if (k === 'rain') { B.setPose('roar', 1.2); Sound.play('stomp'); G.shake(5, 0.6); A.n = 6 + B.seg * 4; }
      if (k === 'spawn') { B.setPose('roar', 1.0); for (const p of B.pimps) if (p.st < 3.5) p.st = Math.max(p.st, 3.4); }
      if (k === 'throw') { A.n = 2; A.i = 0; M.held = null; Sound.play('warn', 0.5); }     // срывает будки с крыш и швыряет в Валеру
      if (k === 'gun') { B.setPose('gun', 2.6); A.n = 0; Sound.play('warn', 0.4); }     // очередь из минигана на голове
    };
    // ---- Семён как «враг» движка ур.9 (пули попадают через box/blocks/hit)
    const foe = M.bossFoe = {
      dead: false, gone: false, behind: true, h: 300, x: 0, y: 0, lastB: null,
      box() { const b = B.box(); return [wx(b[0]), wy(b[1]), b[2] / Z, b[3] / Z]; },
      blocks(b) { this.lastB = b; return false; },
      hit(d, dir, w) {
        const b = this.lastB || { x: this.x, y: this.y }; const r = B.hitAt(sx(b.x), sy(b.y), d * 1.6);
        if (r === 'weak') { LAB().fx.push({ sh: 'fxL9', fr: ['plasmaHit'], x: b.x, y: b.y, s: 0.7, t: 0, life: 0.15, add: 1 }); M.lv && (M.lv.score += 25); }
        else if (r) M.lv && (M.lv.score += 10);
      },
      update() {}, draw() {},
    };
    M.init = (P, lv) => {
      M.lv = lv; P.weap = 'plasma'; P.ammo.plasma = 99999; P.gren = 3; P.foes.push(foe); P.x = 60; P.y = 170; P.dir = -1;
      if (lv.runSeg) B.hp = B.maxHp - lv.runSeg * B.segHp;     // чекпоинт фазы 1: после смерти — с начала сегмента
      B.onSeg = (s) => { if (B.hp <= 0) return; lv.runSeg = s; lv.say('СЕМЁН В ЯРОСТИ!', 2); B.setPose('hurt', 0.8); G.shake(8, 0.8); Sound.play('stomp'); for (const p of B.pimps) p.sp *= 1.3; };
      B.onPop = (x, y) => { const wX = wx(x); y = wy(y); if (B.hp > 0 && P.foes.filter(f => f.minion).length < 3 + B.seg * 2) P.foes.push(new L10.Minion(Math.random() < 0.5 ? 'spider' : 'toad', wX, y, { world: true, M, P, lv })); };
      try { Music.play('epicBoss'); } catch (e) {}
      lv.say('БЕГИ ВЛЕВО! ЗАЖМИ ОГОНЬ — СТРЕЛЯЙ НАЗАД', 4);
    };
    M.update = (dt, P, lv) => {
      const sp = SPEED0 + B.seg * 10 + (B.hp <= 0 ? 30 : 0);
      if (!(M.final && M.final.x + M.final.w / 2 > wx(300))) camX -= sp * dt;     // финальное здание встало в центр — стоп
      else M.stopT = (M.stopT || 0) + dt;
      B.watch = [sx(P.x), sy(P.y - 24)];     // голова следит за Валерой
      W.update(dt, 1.2); B.update(dt); B.segT += dt;
      B.walk = A.cur ? 0 : 1.8;
      if (!A.cur && B.hold <= 0 && !L10.fr('sem1', 'walk0')) B.setPose('roar');
      // владелец: Семён коснулся дома — дом сразу рушится
      const touch = wx(M.touchX());
      for (const b of blds) { if (b.st === 'ok' && b.x + Math.min(b.w, 520) > touch) crumble(b); if (b.st === 'fall') b.t += dt; }     // широкий дом рушится, когда к Семёну подходит его левая часть (иначе с длинной крыши не успеть)
      for (let i = blds.length - 1; i >= 0; i--) if (blds[i].st === 'fall' && blds[i].t > 3) blds.splice(i, 1);
      gen();
      // не отставать / не убегать за край
      P.x = Math.max(P.x, camX + 12);
      if (sx(P.x) > M.touchX() + 30 && !lv.dead && !M.eat) { M.eatStart(P, lv, 'СЕМЁН РАЗДАВИЛ ВАЛЕРУ'); }
      if (P.y > 420 && !lv.dead) {     // сорвался: -25 и обратно на ближайшую целую крышу (полная смерть только если здоровья нет)
        let rx = null; for (let d = 0; d < 420 && rx == null; d += 6) for (const x of [P.x - d, P.x + d]) { const sx2 = sx(x); if (sx2 > 40 && sx2 < M.touchX() - 40 && roofAt(x) != null && roofAt(x + 14) != null && roofAt(x - 14) != null) { rx = x; break; } }
        if (rx == null || P.hp <= 25) lv.kill('ВАЛЕРА СОРВАЛСЯ С КРЫШИ');
        else { P.hp -= 25; lv.stats.dmg += 25; P.x = rx; P.y = roofAt(rx) - 2; P.vx = 0; P.vy = 0; P.inv = 1.5; Sound.play('hurt'); G.flash(0.12, '#f33'); lv.say('ОСТОРОЖНО, ПРОВАЛ!', 1.2); }
      }
      if (M.eat) { M.eatUpd(dt, P, lv); return; }
      // время сегмента
      if (B.hp > 0 && B.segT > B.segLimit && !M.eat) { M.eatStart(P, lv, 'СЕМЁН СЪЕЛ ВАЛЕРУ — НЕ УСПЕЛ'); return; }
      if (B.hp > 0 && B.segLimit - B.segT < 20 && ((B.segT * 2) | 0) % 2 === 0 && (B.segT % 0.5) < dt) Sound.play('warn', 0.4);
      // победа в фазе
      if (B.hp <= 0 && !M.finalWanted) { M.finalWanted = true; for (let i = blds.length - 1; i >= 0; i--) if (blds[i].x + blds[i].w < camX - 20) blds.splice(i, 1); gen();     /* владелец: площадка с джетпаком — сразу следующий дом */ B.setPose('hurt', 2.5); lv.say('ОН РАНЕН! БЕГИ К ДЖЕТПАКУ!', 4); Sound.play('stomp'); G.shake(10, 1.2); A.cur = null; }
      if (M.final && P.onG && Math.abs(P.y - M.final.y) < 3 && P.x < M.final.x + M.final.w * 0.45 && !M.toJet) { M.toJet = 1; P.x = M.final.x + M.final.w * 0.42 + 34; P.dir = -1;     /* стоит рядом с джетпаком — видно, как он перелетает на спину */ lv.say('ДЖЕТПАК!', 1.5); Sound.play('pickup'); M.jetT = 0; }
      if (M.toJet) { M.jetT += dt; P.vx = 0; P.hide = M.jetT > 0.4; if (M.jetT > 1.5 && !M.lift) { M.lift = 1; Sound.play('steam', 0.8); dust(P.x, P.y, 14); } if (M.jetT > 2.9) { P.hide = false; lv.next(); } return; }     // взлёт на джетпаке
      // атаки
      if (B.hp > 0) {
        if (!A.cur) { A.cd -= dt; if (A.cd <= 0) M.startAtk(pickAtk(), P); }
        else M.atkUpd(dt, P, lv);
      }
      // эффекты
      for (const o of throws) { o.t += dt; if (o.t >= o.dur && !o.hit) { o.hit = 1; const ry = roofAt(o.tx); boom(o.tx, (ry ?? o.ty) - 14, 0.7); if (ry != null) hole(o.tx, 18); G.shake(7, 0.35);
          if (Math.abs(P.x - o.tx) < 32 && Math.abs(P.y - (ry ?? o.ty)) < 60 && !lv.dead) LAB().hurt(18, o.tx); } }
      for (let i = throws.length - 1; i >= 0; i--) if (throws[i].hit) throws.splice(i, 1);
      for (const m of marks) m.t += dt;
      for (let i = marks.length - 1; i >= 0; i--) if (marks[i].t > marks[i].life) marks.splice(i, 1);
      for (const f of fx) { f.t += dt; if (f.vx != null) { f.x += f.vx * dt; f.vy += (f.k === 'dust' ? -20 : f.k === 'bul' ? 0 : 700) * dt; f.y += f.vy * dt; } if (f.k === 'fall' && !f.hit) { const ry = roofAt(f.x); if (ry != null && f.y > ry - 6) { f.hit = 1; f.t = f.life; boom(f.x, ry - 10, 0.35); if (Math.abs(P.x - f.x) < 26 && Math.abs(P.y - ry) < 50) LAB().hurt(12, f.x); } } }
      for (const f of fx) if (f.k === 'bul' && f.t < f.life) {     // пули минигана: попадание в Валеру или в крышу
        if (Math.abs(f.x - P.x) < 9 && f.y > P.y - 50 && f.y < P.y + 2 && !lv.dead) { LAB().hurt(5, f.x); f.t = f.life; }
        else { const ry = roofAt(f.x); if (ry != null && f.y > ry && f.y < ry + 40) { f.t = f.life; if (Math.random() < 0.5) fx.push({ k: 'dust', x: f.x, y: ry - 2, vx: rnd(-30, 30), vy: rnd(-60, -10), t: 0, life: 0.4 }); } }
      }
      for (let i = fx.length - 1; i >= 0; i--) if (fx[i].t > fx[i].life) fx.splice(i, 1);
    };
    M.atkUpd = (dt, P, lv) => {
      A.t += dt; const k = A.cur, sg = B.seg, end = (cd) => { A.cur = null; A.cd = (cd - sg * 0.35) * 0.75; B.glowE = 0; B.glowM = 0; M.beam = null; M.whip = null; M.arm = null; B.aim = null; B.hoseT = null; B.gunT = null; };
      if (k === 'slam') {
        B.aim = [sx(A.tx), sy((roofAt(A.tx) ?? 330) - 6)];     // риг: голова и рука целятся в метку
        if (A.t > 0.85 && !A.done) { A.done = 1; B.setPose('slam', 0.8); M.arm = { x: A.tx, t: 0 }; }
        if (M.arm) { M.arm.t += dt; if (M.arm.t > 0.18 && !M.arm.hit) { M.arm.hit = 1; if (B.rig) M.arm.x = wx(B.P('g')[0]);     // удар там, куда реально дотянулась рука
           const ry = roofAt(M.arm.x) ?? 330; boom(M.arm.x, ry - 6, 0.6); dust(M.arm.x, ry, 20); G.shake(9, 0.45); Sound.play('stomp'); hole(M.arm.x, 26 + sg * 6);
          if (Math.abs(P.x - M.arm.x) < 46 && P.y > ry - 70) LAB().hurt(24, M.arm.x); } }
        if (A.t > 1.9) end(1.6);
      }
      if (k === 'eyes') {
        B.glowE = Math.min(1, A.t * 1.6);
        if (A.t > 0.7) { const p = clamp((A.t - 0.7) / (1.5 - sg * 0.15), 0, 1), x = wx(M.touchX() - p * (M.touchX() - 10)), ry = roofAt(x) ?? 330; M.beam = { k: 'laser', from: B.P('e'), from2: B.P('e2'), to: [sx(x), sy(ry - 2)], x };     /* владелец: лазер из двух глаз */ B.aim = M.beam.to; if (Math.random() < 0.6) dust(x, ry, 1);
          if (Math.abs(P.x - x) < 14 && P.onG && Math.abs(P.y - ry) < 6) LAB().hurt(16, x); if (p >= 1) end(1.4); }
      }
      if (k === 'plasma') {
        B.glowM = Math.min(1, A.t); if (A.t < 0.9) { if (Math.random() < 0.4) fx.push({ k: 'spark', x: wx(B.P('m')[0]) + rnd(-30, 30), y: wy(B.P('m')[1]) + rnd(-30, 30), vx: 0, vy: 0, t: 0, life: 0.3 }); }
        else { if (!A.done) { A.done = 1; Sound.play('zap'); G.shake(6, 1.2); } const p = clamp((A.t - 0.9) / 1.6, 0, 1); A.tx += (P.x - A.tx) * dt * (0.6 + sg * 0.4) - 40 * dt; const ry = roofAt(A.tx) ?? 330;
          M.beam = { k: 'plasma', from: B.P('m'), to: [sx(A.tx), sy(ry - 4)], x: A.tx }; B.aim = M.beam.to; if (Math.random() < 0.5) hole(A.tx, 14); for (let i = 0; i < 3; i++) fx.push({ k: 'atom', x: A.tx + rnd(-16, 16), y: ry + rnd(-10, 4), vx: rnd(-40, 40), vy: rnd(-120, -30), t: 0, life: rnd(0.5, 1) });
          if (Math.abs(P.x - A.tx) < 22 && P.y > ry - 80) LAB().hurt(30, A.tx); if (p >= 1) end(1.8); }
      }
      if (k === 'lunge') {
        if (A.t > 0.55) { const p = clamp((A.t - 0.55) / 0.45, 0, 1), reach = M.touchX() - Math.sin(p * Math.PI) * (300 + sg * 60); M.whip = { y: A.ty, x0: wx(reach), p }; B.hoseT = { x: reach, y: sy(A.ty) };     // риг: хлещет сам шланг
          if (P.x > wx(reach) && Math.abs((P.y - 30) - A.ty) < 26 && P.st !== 'crouch') LAB().hurt(20, P.x + 40); if (p >= 1) end(1.3); }
      }
      if (k === 'rain') { if (A.n > 0 && A.t > 0.4 + (6 + sg * 4 - A.n) * 0.18) { A.n--; const x = P.x + rnd(-220, 220); marks.push({ x, t: 0, life: 0.9, small: 1 }); fx.push({ k: 'fall', fr: 'd' + ((Math.random() * 12) | 0), x, y: wy(-40), vx: 0, vy: 120, r: rnd(-3, 3), t: 0, life: 3, s: rnd(0.3, 0.5) }); } if (A.t > 3.2) end(1.2); }
      if (k === 'throw') {     // владелец: нагибается, срывает будку с крыши у ног, замахивается над головой и швыряет
        const C = 1.3, c = A.t - A.i * C, hand = () => B.rig ? B.P('g') : B.P('h');
        if (A.i >= A.n) { B.setPose('roar', 0.2); M.held = null; if (c > 0.35) end(1.3); }
        else if (c < 0.5) { const gx = M.touchX() - 40, gy = sy((roofAt(wx(gx)) ?? 330) - 4); B.setPose('pick', 0.3); B.aim = [gx, gy];
          if (c > 0.4 && !M.held) { const oi = (Math.random() * B2.obj.length) | 0, r = B2.obj[oi], h = 84; M.held = { i: oi, w: r[2] * h / r[3], h, rot: 0 }; const x = wx(gx), ry = roofAt(x) ?? 330; hole(x, 18); Sound.play('crumble', 0.7); G.shake(4, 0.2);
            for (let j = 0; j < 7; j++) fx.push({ k: 'deb', fr: 'd' + ((Math.random() * 12) | 0), x: x + rnd(-14, 14), y: ry - 6, vx: rnd(-90, 90), vy: rnd(-200, -80), g: 600, r: rnd(-6, 6), t: 0, life: 1.1, s: rnd(0.2, 0.35) });
            for (let j = 0; j < 3; j++) fx.push({ k: 'dust', x: x + rnd(-16, 16), y: ry - 4, t: 0, life: 0.7 }); } }
        else if (c < 1.0) { B.setPose('wind', 0.3); B.aim = [sx(P.x), sy(P.y - 24)]; if (M.held) M.held.rot += (-0.9 - M.held.rot) * 0.08; }
        else { B.setPose('toss', 0.3); B.aim = [sx(P.x), sy(P.y - 24)];
          if (c > 1.1 && M.held) { const [hx, hy] = hand(), tx = P.x + P.vx * 0.55 + rnd(-20, 20), ty = roofAt(tx) ?? P.y, o = M.held; M.held = null;
            throws.push({ x0: wx(hx), y0: wy(hy), tx, ty, t: 0, dur: 1.0, i: o.i, w: o.w, h: o.h, rot: o.rot }); marks.push({ x: tx, t: 0, life: 1.0 }); Sound.play('throw', 0.7); }
          if (c >= C) A.i++; } }
      if (k === 'spawn') { if (A.t > 1.0) end(1.0); }
      if (k === 'gun') {
        B.aim = B.gunT = [sx(P.x), sy(P.y - 24)];
        if (A.t > 0.6 && A.t < 2.2) { A.n += dt; if (A.n > 0.1 - sg * 0.012) { A.n = 0;
          const [mx, my] = B.rig ? B.fireGun() : B.P('h'), x0 = wx(mx), y0 = wy(my), a = Math.atan2(P.y - 24 - y0, P.x - x0) + rnd(-0.1, 0.1);
          fx.push({ k: 'bul', x: x0, y: y0, vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, t: 0, life: 1.6 }); Sound.play('shot', 0.18); } }
        if (A.t > 2.6) end(1.3);
      }
    };
    // ---- «съел»: владелец — Валера рядом с Семёном как муха; Семён втягивает его в пасть (кадры eat* с большим Валерой не используем)
    M.eatStart = (P, lv, text) => { M.eat = { t: 0, text, x0: P.x, y0: P.y - 30 }; B.setPose('roar', 9); A.cur = null; M.beam = null; M.whip = null; M.arm = null; Sound.play('rope'); P.hide = 1; };
    M.eatUpd = (dt, P, lv) => {
      const e = M.eat; e.t += dt; B.update(dt * 0.3); P.vx = 0; P.vy = 0;
      const [mx, my] = B.P('m'), p = clamp((e.t - 0.25) / 1.3, 0, 1), q = p * p * (3 - 2 * p);
      e.wx = L10.lerp(e.x0, wx(mx), q) + Math.sin(e.t * 23) * 6 * (1 - q); e.wy = L10.lerp(e.y0, wy(my), q) - Math.sin(q * Math.PI) * 60; e.r = e.t * 9;
      B.hoseT = e.t < 1.5 ? { x: sx(e.wx), y: sy(e.wy + 40) } : null;     // шланг ловит Валеру и тащит к пасти
      if (Math.random() < dt * 30) fx.push({ k: 'dust', x: e.wx + rnd(-8, 8), y: e.wy + rnd(-8, 8), vx: rnd(-20, 20), vy: rnd(-30, 10), t: 0, life: 0.5 });
      if (e.t > 1.6 && !e.chomp) { e.chomp = 1; B.setPose('hurt', 9); Sound.play('punch'); G.shake(8, 0.4); G.flash(0.2, '#300'); }
      if (e.t > 2.2) { M.eat = null; P.hide = 0; lv.kill(e.text); }
    };
    // ---- рисование
    M.drawBack = (c, cx, cy, P) => {
      if (L10.img.bg1sky) M.drawBg1(c, cx);     // владелец: 4 слоя — небо с грозой, море с кораблями, краны, набережная
      else { if (L10.img.port) L10.bgTile(c, 'port', cx, 0.05, -90, 420); else L10.bgTile(c, 'bg1f', cx, 0.08, 0, 360); W.drawBolt(c); }
      B.draw(c);
      if (M.beam) M.drawBeam(c, M.beam);
      if (M.beam && (M.beam.k === 'laser' || M.beam.k === 'plasma') && B.rig && B.drawOver) B.drawOver(c);     // луч из глаз — за миниганом и рукой
    };
    // ---- фон фазы 1: параллакс из 4 слоёв (арт Flow, tools/p10/build_bg1.py)
    const storm = L10.makeStorm(W);     // небо с грозой, море, корабли — общий фон (фаза 2 берёт его же)
    M.drawBg1 = (c, cx) => {
      storm(c, cx);
      c.imageSmoothingEnabled = false;
      // 2 — краны чуть возвышаются над домами
      const ci = L10.img.bg1cranes, CR = L10.BG1 && L10.BG1.cranes;     // портальные краны поштучно, редко, на кромке причала
      if (ci && CR) { const PER = 980, H = 220, base = 304, o = cx * 0.22; c.save(); c.globalAlpha = 0.9; c.imageSmoothingEnabled = true;
        for (let i = Math.floor((o - 300) / PER); i <= Math.floor((o + 940) / PER); i++) {
          const h = ((i * 7919) % 97 + 97) % 97 / 97, r = CR[(i & 1)], s = H * (0.86 + h * 0.2) / r[3], w = r[2] * s, x = i * PER + h * 380 - o;
          if (x + w < -20 || x > 660) continue;
          c.save(); c.translate(x + w / 2, base); if (h > 0.5) c.scale(-1, 1); c.drawImage(ci, r[0], r[1], r[2], r[3], -w / 2, -r[3] * s, w, r[3] * s); c.restore(); }
        c.restore(); }
      // 1 — ближняя набережная завода внизу: домики к зрителю, причал дальше
      L10.bgTile(c, 'bg1quay', cx, 0.3, 300, 64);
    };
    M.drawBackWorld = (c, P) => {
      for (const b of blds) M.drawBld(c, b);
      for (const b of blds) if (b.st === 'ok' && b.steps && L9D.lad9) for (const q of b.steps) { const [lw, lh] = L9.size('lad9', 'l'), k = 30 / lw, len = q[2] - q[1] + 8; S9(c, 'lad9', 'l', q[0] + 15, b.y + q[2] + 2, k, { sy: len / (lh * k) }); }     // лестница на высокую ступень крыши (у предметов лестницы нарисованы)
      if (M.final && (!M.toJet || M.jetT < 0.4) && JP.complete && JP.naturalWidth) {     // джетпак стоит на площадке крупно: соплами вниз, свечение и стрелка
        const b = M.final, q = M.toJet ? Math.min(1, M.jetT / 0.4) : 0, e = q * q * (3 - 2 * q), P0 = L9.PARTS.lab, x = L10.lerp(b.x + b.w * 0.42, P0.x - P0.dir * 8, e), y = L10.lerp(b.y, P0.y - 18, e), h = L10.lerp(112, 44, e), w = h * JP.naturalHeight / JP.naturalWidth, t = G.t;     // при подборе джетпак перелетает со стойки Валере на спину (критик: раньше пропадал)
        c.save(); c.globalCompositeOperation = 'lighter'; const gl = c.createRadialGradient(x, y - h / 2, 4, x, y - h / 2, h); gl.addColorStop(0, `rgba(120,255,200,${0.35 + 0.15 * Math.sin(t * 6)})`); gl.addColorStop(1, 'rgba(120,255,200,0)'); c.fillStyle = gl; c.fillRect(x - h, y - h * 1.5, h * 2, h * 2); c.restore();
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x, y, w * 0.9, 5, 0, 0, Math.PI * 2); c.fill();
        c.save(); c.translate(x, y - h / 2); c.rotate(-Math.PI / 2); c.imageSmoothingEnabled = true; c.drawImage(JP, -h / 2, -w / 2, h, w); c.restore();
        if (!M.toJet) { const ay = y - h - 26 + Math.sin(t * 5) * 6; c.fillStyle = '#ffd84a'; c.strokeStyle = '#3a2a00'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 14, ay - 16); c.lineTo(x + 14, ay - 16); c.lineTo(x, ay); c.closePath(); c.stroke(); c.fill(); }
      }
      for (const m of marks) { const ry = roofAt(m.x); if (ry == null) continue; const a = 0.4 + 0.4 * Math.sin(m.t * 18); L10.Minion.mark(c, m.x, ry - 2, m.small ? 24 : 68, a); }
    };
    M.drawBld = (c, b) => {
      const sink = b.st === 'fall' ? b.t * b.t * 160 : 0, rot = b.st === 'fall' ? b.t * 0.06 * (b.id % 2 ? 1 : -1) : 0;
      c.save();
      c.translate(b.x + b.w / 2, b.y + sink); c.rotate(rot); c.translate(-(b.x + b.w / 2), -b.y);     // маска выбоин едет вместе с падающим домом (иначе выбоины «зарастали»)
      if (b.dmg) {     // рваная выбоина: обрезаем дом по профилю глубины
        c.beginPath(); c.moveTo(b.x - 80, 3000); c.lineTo(b.x - 80, -600);
        const yy = i => b.dmg[i] > 6 ? b.y + prof(b, i) + b.dmg[i] : -600;
        for (let i = 0; i < b.dmg.length; i++) { c.lineTo(b.x + i * DS - DS / 2, yy(i)); c.lineTo(b.x + i * DS + DS / 2, yy(i)); }     // ступенями — как отбитые блоки
        c.lineTo(b.x + b.w + 80, -600); c.lineTo(b.x + b.w + 80, 3000); c.closePath(); c.clip();
      }
      c.translate(b.x + b.w / 2, b.y);
      if (b.type >= 10) {     // новый лист: кадр в своём масштабе, ниже — повтор нижней полосы
        const r = B2.bld[b.type - 10], im = L10.img.bld10, s = b.w / r[2], h = r[3] * s, top = -r[4] * s + 1, band = r[3] * 0.3, bh = band * s;
        for (let y = top + h - 2; y < 360 - b.y + 80; y += bh - 1) c.drawImage(im, r[0], r[1] + r[3] - band, r[2], band, -b.w / 2, y, b.w, bh);
        c.drawImage(im, r[0], r[1], r[2], r[3], -b.w / 2, top, b.w, h);
      } else if (L10.has('roof10')) {
        const fr = 'r' + b.type, [fw, fh] = L10.size('roof10', fr), s = b.w / fw, h = fh * s, top = -h * ROOFV[b.type] + 1;     // высота дома не зависит от ширины (узкие не мельчают)     // линия крыши кадра = b.y: Валера стоит ровно на крыше
        // стена ниже нарисованного куска — повтор нижней полосы кадра до низа экрана
        const f = L10.fr('roof10', fr), im = L10.img.roof10, band = f[3] * 0.3, bh = band * 0.5 * s;
        for (let y = top + h - 2; y < 360 - b.y + 80; y += bh - 1) c.drawImage(im, f[0], f[1] + f[3] - band, f[2], band, -b.w / 2, y, b.w, bh);
        c.drawImage(im, f[0], f[1], f[2], f[3], -b.w / 2, top, b.w, h);
      } else { c.fillStyle = '#20262b'; c.fillRect(-b.w / 2, 0, b.w, 400); c.fillStyle = '#3a4248'; c.fillRect(-b.w / 2, 0, b.w, 6); }
      if (b.dmg) {     // тёмная кромка по линии слома (половина штриха внутри дома — рваный край)
        const D = b.dmg, x0 = -b.w / 2, bot = 360 - b.y + 80, yl = i => D[i] > 6 ? Math.min(D[i] + prof(b, i), bot) : null;
        c.strokeStyle = 'rgba(24,14,10,0.75)'; c.lineWidth = 8; c.lineJoin = 'miter'; c.beginPath();
        for (let i = 0; i < D.length; i++) {
          const y = yl(i), xa = x0 + i * DS - DS / 2, xb = xa + DS; if (y == null) continue;
          if (y < bot) { c.moveTo(xa, y); c.lineTo(xb, y); }
          const yp = i > 0 ? (yl(i - 1) ?? 0) : 0, yn = i < D.length - 1 ? (yl(i + 1) ?? 0) : 0;
          if (yp !== y) { c.moveTo(xa, yp); c.lineTo(xa, y); } if (yn !== y) { c.moveTo(xb, y); c.lineTo(xb, yn); }
        }
        c.stroke();
      }
      if (b.objs && L10.img.rtop10) for (const o of b.objs) {     // предметы на крыше падают вместе с домом
        const r = B2.obj[o.i], cx = o.x + o.w / 2 - (b.x + b.w / 2); c.save(); c.translate(cx, 0); if (o.flip) c.scale(-1, 1);
        c.drawImage(L10.img.rtop10, r[0], r[1], r[2], r[3], -o.w / 2, -o.h + 2, o.w, o.h); c.restore();
      }
      c.restore();
    };
    M.drawBeam = (c, bm) => {
      const [x0, y0] = bm.from, [x1, y1] = bm.to, ang = Math.atan2(y1 - y0, x1 - x0), len = Math.hypot(x1 - x0, y1 - y0);
      c.save(); c.globalCompositeOperation = 'lighter';
      if (L10.has('fx10')) { const fr = bm.k === 'plasma' ? 'plasma' : 'laser', [fw, fh] = L10.size('fx10', fr); c.translate(x0, y0); c.rotate(ang); const f = L10.fr('fx10', fr); c.imageSmoothingEnabled = true; const th = bm.k === 'plasma' ? 34 + Math.sin(B.t * 40) * 4 : 10; c.drawImage(L10.img.fx10, f[0], f[1], f[2], f[3], 0, -th / 2, len, th); if (bm.k === 'laser' && bm.from2) { const a2 = Math.atan2(bm.to[1] - bm.from2[1], bm.to[0] - bm.from2[0]), l2 = Math.hypot(bm.to[0] - bm.from2[0], bm.to[1] - bm.from2[1]); c.rotate(-ang); c.translate(bm.from2[0] - x0, bm.from2[1] - y0); c.rotate(a2); c.drawImage(L10.img.fx10, f[0], f[1], f[2], f[3], 0, -th / 2, l2, th); }     /* оба луча сходятся в одну точку (критик) */ }
      else { c.strokeStyle = bm.k === 'plasma' ? 'rgba(140,255,120,0.9)' : 'rgba(255,90,60,0.9)'; c.lineWidth = bm.k === 'plasma' ? 18 : 4; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
      c.restore();
    };
    M.drawFront = (c, P) => {
      if (M.toJet && M.jetT > 0.4) {     // надевает джетпак (vJetUp10: 0-2 надевает, 3-5 запуск, 7 взлёт)
        const k = M.jetT - 0.4, up = Math.max(0, k - 1.75), y = P.y - up * up * 140;
        const f = k < 0.8 ? 1 : k < 1.15 ? 2 : k < 1.4 ? 3 : k < 1.6 ? 4 : k < 1.75 ? 5 : 7;
        if (L10.has('vJetUp10')) S(c, 'vJetUp10', 'j' + f, P.x, y, 0.95, { flip: P.dir < 0 });
        else if (L10.has('vJet10')) S(c, 'vJet10', 'up', P.x, y - 46, 0.5);
      }
      if (L10.img.rtop10) for (const o of throws) { const u = Math.min(1, o.t / o.dur), x = o.x0 + (o.tx - o.x0) * u, y = o.y0 + (o.ty - o.h / 2 - o.y0) * u - Math.sin(u * Math.PI) * 120, r = B2.obj[o.i];
        c.save(); c.translate(x, y); c.rotate(o.rot + u * 6); c.drawImage(L10.img.rtop10, r[0], r[1], r[2], r[3], -o.w / 2, -o.h / 2, o.w, o.h); c.restore(); }     // летящая будка
      if (L10.img.rtop10 && M.held && A.cur === 'throw') { const o = M.held, r = B2.obj[o.i], [hx, hy] = B.rig ? B.P('g') : B.P('h'); c.save(); c.translate(wx(hx), wy(hy)); c.rotate(o.rot); c.drawImage(L10.img.rtop10, r[0], r[1], r[2], r[3], -o.w / 2, -o.h * 0.7, o.w, o.h); c.restore(); }     // будка в руке
      for (const f of fx) {
        if (f.k === 'deb' || f.k === 'fall') { if (L10.has('deb10')) S(c, 'deb10', f.fr, f.x, f.y, f.s, { rot: f.r * f.t }); else { c.fillStyle = '#4a4440'; c.fillRect(f.x - 6, f.y - 6, 12, 12); } }
        else if (f.k === 'dust') { if (L10.has('fx10')) S(c, 'fx10', 'dust', f.x, f.y, 0.1 + f.t * 0.08, { a: 0.55 * (1 - f.t / f.life) }); }
        else if (f.k === 'atom') { const a = 1 - f.t / f.life; if (L10.has('fx10')) S(c, 'fx10', 'dust', f.x, f.y, 0.12, { a, add: 1 }); else { c.fillStyle = `rgba(140,255,120,${a})`; c.fillRect(f.x, f.y, 2, 2); } }
        else if (f.k === 'bul') { if (L10.has('fx10')) S(c, 'fx10', 'tracer', f.x, f.y, 0.22, { rot: Math.atan2(f.vy, f.vx), add: 1 }); else { c.fillStyle = '#ff6'; c.fillRect(f.x - 4, f.y - 1, 8, 2); } }
        else if (f.k === 'spark') { if (L10.has('fx10')) S(c, 'fx10', 'dust', f.x, f.y, 0.05, { add: 1, a: 0.8 }); }
        else if (f.k === 'boom') { const fr = 'b' + Math.min(3, (f.t / f.life * 4) | 0); if (L10.has('boom10')) S(c, 'boom10', fr, f.x, f.y, f.s, { add: 1 }); else S(c, 'fxA9', 'boom' + Math.min(3, (f.t / f.life * 4) | 0), f.x, f.y, f.s * 1.4); }
      }
      if (M.arm && !B.rig) {     // клешня падает сверху на метку (без рига)
        const a = M.arm, ry = roofAt(a.x) ?? 330, p = clamp(a.t / 0.18, 0, 1), y = L10.lerp(wy(-120), ry + 8, p * p);
        if (L10.has('arm10')) S(c, 'arm10', p < 1 ? (p < 0.5 ? 'a0' : 'a1') : 'a2', a.x, y, 0.62 / Z, { flip: true });
        else { c.fillStyle = '#3d3326'; c.fillRect(a.x - 18, y - 260, 36, 260); }
      }
      if (M.whip && !B.rig) {     // шланг хлещет поперёк крыш (без рига)
        const w = M.whip, y = w.y; const x1 = wx(M.touchX());
        if (L10.has('tent10')) { const f = L10.fr('tent10', 'seg'), im = L10.img.tent10, th = 30; c.save(); c.imageSmoothingEnabled = true; for (let x = w.x0; x < x1; x += 60) c.drawImage(im, f[0], f[1], f[2], f[3], x, y - th / 2 + Math.sin((x - w.x0) * 0.04 + B.t * 12) * 6, 62, th); c.restore(); S(c, 'tent10', 'tip', w.x0 - 20, y, 0.4, { flip: true }); }
        else { c.fillStyle = '#56603a'; c.fillRect(w.x0, y - 12, x1 - w.x0, 24); }
      }
      if (M.eat && M.eat.wx != null && !M.eat.chomp) { const e = M.eat; S9(c, 'vClimb9', 'hit', e.wx, e.wy + 40, 1, { rot: e.r }); }     // крошечный Валера летит в пасть
    };
    M.drawOver = (c, cx, cy, P) => {
      W.draw(c);
      if (B.segLimit - B.segT < 25 && B.hp > 0) { c.strokeStyle = `rgba(255,30,30,${0.3 + 0.3 * Math.sin(B.t * 10)})`; c.lineWidth = 6; c.strokeRect(3, 3, 634, 354); }
    };
    M.drawHud = (c, P, lv) => L10.bossBar(c, B);
    M.onFall = () => {};
    return M;
  };

  // часть уровня: движок платформера ур.9 с картой x10run
  L10.PARTS.run = new Proxy(L9.PARTS.lab, { get(t, k) { if (k === 'start') return (lv, ck) => t.start(lv, ck, 'x10run'); if (k === 'deathText') return 'СЕМЁН ПОБЕДИЛ'; if (k === 'drawHud') return (lv, c) => { c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(6, 25, 148, 16); G.text('ПЛАЗМОГАН', 12, 29, { size: 8, color: '#ffd84a' }); t.M.drawHud && t.M.drawHud(c, t, lv); }; return t[k]; }, set(t, k, v) { t[k] = v; return true; } });
})();
