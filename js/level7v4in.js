'use strict';
// ============ Ур.7 v4: внутри — цех: вертикальная карта D, заводоуправление (F4..F1 + комнаты), спящие, босс, финал ============
// Геометрия фонов (Flow): stair.jpg 1376x768 (пол y=600, дверь x=270, пролёт 680..1300), corr0.jpg 1376x768 (ковёр y=620,
// двери x=130/304, лифт x=824, статуи 266/960, шторы 430..690/1000..1280), комнаты 1280x720 (пол y≈620).
// лестничная клетка: 6 кусков стены (левые 470 px картинки, без пролёта, через раз зеркально) + целая картинка с пролётом в конце.
// Пол — дорожка перед перилами (y=680 картинки). Передние перила — отдельный слой stair_rail.png (смещение 640,460).
V4.ST = { s: 0.4, fy: 680, wallPx: 470, nWall: 6 };
V4.ST.S = V4.ST.wallPx * V4.ST.s * V4.ST.nWall;   // x начала целой картинки
V4.stX = px => V4.ST.S + px * V4.ST.s;
V4.stY = py => V4.GY - (V4.ST.fy - py) * V4.ST.s;
V4.drawStairBG = function (c, cx) {
  const img = V4.img.stair; if (!img) return;
  const T = V4.ST, s = T.s, y = V4.GY - T.fy * s, h = img.height * s;
  const piece = (sx, sw, dx, flip) => {
    const w = sw * s; if (dx > W || dx + w < 0) return;
    c.save(); if (flip) { c.translate(Math.round(dx) + w, 0); c.scale(-1, 1); } else c.translate(Math.round(dx), 0);
    c.drawImage(img, sx, 0, sw, img.height, 0, y, w, h);
    c.drawImage(img, sx, 0, sw, 24, 0, 0, w, y + 1);   // потолок — продолжение верхней кромки
    c.drawImage(img, sx, img.height - 24, sw, 24, 0, y + h - 1, w, H - y - h + 1);
    c.restore();
  };
  for (let i = 0; i < T.nWall; i++) piece(0, T.wallPx, i * T.wallPx * s - cx, i % 2 === 1);
  piece(0, img.width, T.S - cx, false);
};
V4.drawStairRail = function (c, cx) {
  const r = V4.img.stair_rail; if (!r) return; const s = V4.ST.s;
  c.drawImage(r, Math.round(V4.stX(640) - cx), Math.round(V4.stY(460)), r.width * s, r.height * s);
};
V4.CO = { s: 0.42, fy: 620, tw: 1376 * 0.42 };
V4.coX = px => Math.round(px * V4.CO.s);   // x на фоне коридора (px картинки) -> мир

// ---------- спящий персонал: ползком (на четвереньках) не проснётся ----------
V4.Sleeper = class {
  constructor(o) { Object.assign(this, { fr: 0, frW: 1, s: 1.2, r: 110, wake: 0, awake: false, t: 0, line: 'А?! Кто здесь?! ОХРАНА!!!' }, o); this.y = this.y || V4.GY; }
  update(dt, run) {
    const pl = run.player; this.t += dt;
    if (this.awake) { this.awT += dt; if (this.awT > 0.9 && !run.caught) run.catchBy(this); return; }
    const d = Math.abs(pl.x - this.x), loud = !pl.crouch && Math.abs(pl.vx) > 10 && !pl.hidden;
    if (d < this.r && loud && !run.level.scene) this.wake += dt * (d < this.r * 0.5 ? 1.6 : 0.9);
    else this.wake = Math.max(0, this.wake - dt * 0.4);
    if (this.wake > 0.35 && !this.mumble) { this.mumble = true; G.say(this, U.choice(['Мм... ещё пять минуточек...', 'Хр-р... мама, не буди...', 'Хр-р-р... квартальный отчёт...']), 1.4); }
    if (this.wake >= 1) { this.awake = true; this.awT = 0; Sound.play('warn'); G.say(this, this.line, 1.4, { shout: true }); }
  }
  draw(c, cx) {
    const x = this.x - cx; if (x < -120 || x > W + 120) return;
    Spr.draw(c, 'sleep4', this.awake ? this.frW : this.fr, x, this.y, this.flip || 1, { scale: this.s });
    if (!this.awake && (this.t * 1.5 | 0) % 2) G.text(this.wake > 0.35 ? 'z?' : 'Zz', x + 14 + Math.sin(this.t * 2) * 3, this.y - this.h - 6 - (this.t * 8 % 8), { size: 8, color: '#c8d8ff' });
    if (this.wake > 0.05 && !this.awake) { Art.R(c, x - 15, this.y - this.h - 22, 30, 4, '#111'); Art.R(c, x - 14, this.y - this.h - 21, Math.round(28 * this.wake), 2, '#ff8a3a'); }
  }
  get h() { const f = Spr.frame('sleep4', this.fr); return f ? f[3] / 2 * this.s : 60; }
};
V4.updSleepers = (dt, run) => { for (const s of (run.D.sleepers || [])) s.update(dt, run); };
V4.drawSleepers = (c, cx, run) => { for (const s of (run.D.sleepers || [])) s.draw(c, cx); };

// подбираемые предметы (курица, конверт, записка, ключ): sh/fr — спрайт; take(run) — эффект
V4.updPicks = (dt, run) => {
  const pl = run.player;
  for (const p of (run.D.picks || [])) if (!run.flags['pick:' + p.id] && (!p.cond || p.cond(run)) && Math.abs(pl.x - p.x) < 22) { run.flags['pick:' + p.id] = 1; Sound.play('coin'); p.take(run); }
};
V4.drawPicks = (c, cx, run) => {
  for (const p of (run.D.picks || [])) if (!run.flags['pick:' + p.id] && (!p.cond || p.cond(run)) && p.sh) {
    const bob = Math.sin(G.t * 3 + p.x) * 2; Spr.draw(c, p.sh, p.fr, p.x - cx, (p.y || V4.GY - 2) + bob, 1, { scale: p.s || 1 });
  }
};

// ================= D: «Цех сортировки» v5 — здание в разрезе, 4 этажа (как Terminator 2D: No Fate), стелс =================
// Вся графика из Flow (стиль finestyle), сборка tools/l7v5_rooms.py:
//   flN.png — полоса этажа: комнаты (каждая — отдельный кадр Flow, мебель в самой картинке) и половина лестничной клетки;
//   лестничная клетка — ОДИН кадр 9:16 сразу на два этажа, лестница нарисована вместе с фоном (спрайта лестницы нет);
//   assets/l7v4/pr/*.png — спрайты (размеры — js/l7v4_props.js): стена-перегородка, шкаф/дверь-укрытия по 3 кадра, предметы переднего плана, излучатели.
// Раскладка — window.V4_LAY (создаёт сборщик): комнаты разной ширины (масштаб подобран так, чтобы двери были одной высоты), этажи 2-3 короче.
//   1: проходная | приёмная | шлюз с гермодверью | клетка A;  2: клетка B | раздевалка | склад вещей | клетка A (приход);
//   3: клетка B (приход) | мониторная | пультовая | клетка C;  4: тамбур (дверь на крышу) | коридор с лазерами | вентиляционная | клетка C (приход).
V4.ROOMS = { pitch: 190, top: 176, junc: 15, low: 14 };
V4.MAPS.D = function (run) {
  const RM = V4.ROOMS, G0 = V4.GY, I = () => V4.img, PS = window.V4_PROPS || {}, NF = 4, T = [0, 1, 2, 3].map(i => G0 - i * RM.pitch), CEIL = 158;
  const LAY = window.V4_LAY, ROW = LAY.rows, RX = (m, k, f) => { const q = ROW[f || 0][m - 1]; return q[0] + (k || 0) * q[1]; };   // x: комната m (1..4) этажа f (0..3), доля ширины k
  const R1 = (m, k) => RX(m, k, 0), R2 = (m, k) => RX(m, k, 1), R3 = (m, k) => RX(m, k, 2), R4 = (m, k) => RX(m, k, 3), ZM = (m, f) => ROW[f][m - 1][2];   // ZM — масштаб кадра комнаты
  const D = { w: LAY.w, RX, vertical: true, topY: Math.round(T[NF - 1] - RM.top - 4), dark: 0.03, suspK: 0.85, minX: 24, maxX: LAY.w - 24 };
  const floorOf = y => { for (let i = NF - 1; i > 0; i--) if (y < T[i] + 6) return i; return 0; };
  const ZD = ZM(3, 0), DOOR = { x: R1(3, 0.5), y: T[0] - 15 - 69 * ZD, w: 66 * ZD, h: 29 * ZD }, PANEL = R3(3, 0.5), LOCK = R4(1, 0.365), ROOFDOOR = R4(1, 0.52), LZ = [R4(2, 0.66), R4(2, 0.5), R4(2, 0.34)];
  // ---------- лестницы (единая геометрия): марш от пола к площадке у торцевой стены, второй марш обратно — к площадке следующего этажа ----------
  // ступени сняты с кадра v4_ndwa_0.jpg (768x1376, x0.2762; кадр опущен на WDY = WELLDY сборщика)
  const SW = 212, WS = 380 / 1376, WDY = 14, HY = y => (1321 - y) * WS - WDY;   // HY: строка кадра -> высота над полом нижнего этажа клетки
  const LOW = [[234, 1231], [277, 1185], [315, 1147], [357, 1106], [399, 1065], [440, 1020], [483, 973], [523, 936]].map(([x, y]) => [x * WS, HY(y)]);   // нижний марш: [x подступёнка, высота проступи]
  const UPP = [[529, 849], [489, 805], [453, 767], [418, 726], [376, 690], [343, 646], [305, 607], [270, 578]].map(([x, y]) => [x * WS, Math.min(RM.pitch, HY(y))]);   // верхний марш (идём влево), последняя — площадка этажа
  const LAND = LOW[7][1], FOOT = LOW[0][0] - 5, L0 = LOW[7][0], LMID = 590 * WS, U0 = UPP[0][0], TOPE = UPP[7][0], TOPX = TOPE - 22;
  const ST = [{ f: 0, x0: R1(4), dir: 1 }, { f: 1, x0: R2(1), dir: -1 }, { f: 2, x0: R3(4), dir: 1 }];
  const SX = (s, lx) => s.dir > 0 ? s.x0 + lx : s.x0 + SW - lx, LXof = (s, x) => s.dir > 0 ? x - s.x0 : s.x0 + SW - x;
  const stepH = (lx, upper) => {   // высота нарисованной ступени под ногой: нога встаёт точно на проступь
    let h = upper ? LAND : 0;
    if (!upper) { for (const [x, y] of LOW) if (lx >= x + 3) h = y; } else for (const [x, y] of UPP) if (lx <= x - 3) h = y;
    return upper && lx <= TOPE - 3 ? RM.pitch : h;
  };
  const climb = (r, s, up) => { const pl = r.player, a = { x: SX(s, FOOT), y: T[s.f] }, m = { x: SX(s, LMID), y: T[s.f] - LAND }, b = { x: SX(s, TOPX), y: T[s.f + 1] };
    pl.crouch = false; pl.auto = { i: 0, sp: 52, stair: s, up, path: up ? [a, m, b] : [b, m, a], done: () => { pl.setAnim('stand'); pl.y = up ? T[s.f + 1] : T[s.f]; } }; };
  // ---------- предметы: [имя, x, этаж, план('f' — передний, стоит на полу, за ним прячутся | 'n' — висит под потолком выше голов)] ----------
  const PR = [
    ['crates', R1(2, 0.8), 0, 'f'], ['handcart', R1(3, 0.82), 0, 'f'],
    ['laundry', R2(2, 0.32), 1, 'f'], ['sacks', R2(3, 0.38), 1, 'f'], ['toolbox', R2(3, 0.9), 1, 'f'],
    ['spool', R3(2, 0.42), 2, 'f'], ['gas', R3(3, 0.18), 2, 'f'], ['barrier', R3(3, 0.68), 2, 'f'],
    ['crates', R4(1, 0.84), 3, 'f'], ['barrels', R4(3, 0.36), 3, 'f'],
    ['cables', R2(3, 0.75), 1, 'n'], ['cables', R1(2, 0.62), 0, 'n'],
  ].map(([n, x, f, pl, flip]) => ({ n, x, f, pl, flip, w: (PS[n] || [40, 40])[0], h: (PS[n] || [40, 40])[1] }));
  const BACK = 12, FRONT = 12, FSC = 1.1;   // у стены — выше линии ног; передний план — ниже линии ног и чуть крупнее (стоит на полу, не двигается)
  const pimg = n => I()['pr_' + n];
  const drawProp = (c, cx, p) => { const im = pimg(p.n); if (!im) return;
    if (p.pl === 'n') { const x = p.x - cx, k = 0.8; if (x + p.w < -20 || x - p.w > W + 20) return; c.drawImage(im, Math.round(x - p.w * k / 2), T[p.f] - RM.top + 8, p.w * k, p.h * k); return; }
    const w = p.w * FSC, h = p.h * FSC, base = T[p.f] + FRONT, x = p.x - cx;
    if (x + w < -20 || x - w > W + 20) return;
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x, base - 1, w * 0.52, 3.5, 0, 0, 6.3); c.fill();
    c.drawImage(im, Math.round(x - w / 2), base - h, w, h); };
  // ---------- укрытия: дверь/шкаф открываются по кадрам, Валера заходит вглубь и стоит в тени ----------
  D.hides = [
    { x: R1(2, 0.45), y: T[0], f: 0, a3: 'cab', fr: 0, label: 'в шкаф' },
    { x: R2(3, 0.5), y: T[1], f: 1, a3: 'door', fr: 0, label: 'в кладовку' },
    { x: R2(2, 0.72), y: T[1], f: 1, a3: 'pic', fr: 0, label: 'в душевую' },
    { x: R3(2, 0.72), y: T[2], f: 2, a3: 'door', fr: 0, label: 'в кладовку' },
  ];
  const drawA3 = (c, cx, n, x, f, left) => { const im = pimg(n), s = PS[n]; if (im && s) c.drawImage(im, Math.round((left ? x - 29 : x - s[0] / 2) - cx), T[f] - BACK - s[1], s[0], s[1]); };
  const drawHide = (c, cx, h) => { if (h.a3 === 'door') drawA3(c, cx, 'door' + h.fr, h.x, h.f, true); else if (h.a3 === 'cab') drawA3(c, cx, 'cab' + h.fr, h.x, h.f); };
  // награды (значки «Ударник» — в статистику, еда лечит) и пасхалки; собранное не возвращается после поимки
  const got = r => r.level.got || (r.level.got = new Set());
  const COLL = [
    { id: 'b1', n: 'badge', x: R1(2, 0.45), f: 0, hid: 0 }, { id: 'b2', n: 'badge', x: R2(2, 0.86), f: 1 }, { id: 'b3', n: 'badge', x: R4(1, 0.1), f: 3 },
    { id: 'kefir', n: 'kefir', x: R2(3, 0.25), f: 1, say: 'Кефир! Ночная смена забыла.' }, { id: 'can', n: 'can', x: R3(2, 0.5), f: 2, say: 'Тушёнка. Стратегический запас.' },
    { id: 'roll', n: 'roll', x: R3(3, 0.3), f: 2, say: 'Туалетка за три рубля! Улика.' },
  ];
  const take = (r, p) => { const pl = r.player, st = r.level.stats; got(r).add(p.id); Sound.play('coin');
    if (p.n === 'badge') { st.secrets++; r.world.addScore(1000); FX.popText(p.x, T[p.f] - 70, 'ЗНАЧОК «УДАРНИК» +1000', '#ffd84a'); }
    else if (p.n === 'roll') { st.eggs = (st.eggs || 0) + 1; r.world.addScore(500); FX.popText(p.x, T[p.f] - 70, 'ПАСХАЛКА +500', '#ffd84a'); G.say(pl, p.say, 2); }
    else { pl.heal(30); st.food++; G.say(pl, p.say, 1.6); } };
  const egg = (id, x, f, txt) => ({ x, y: T[f], r: 14, label: 'осмотреть', quiet: true, act: r => { if (!got(r).has(id)) { got(r).add(id); r.level.stats.eggs = (r.level.stats.eggs || 0) + 1; r.world.addScore(200); FX.popText(x, T[f] - 96, 'ПАСХАЛКА +200', '#ffd84a'); Sound.play('coin'); } G.say(r.player, txt, 2.6); } });
  const EGGS = [egg('vend', R1(1, 0.64), 0, 'Автомат с газировкой. Сироп кончился ещё при прошлом директоре.'), egg('reg', R1(2, 0.2), 0, 'Регистратура. Талончики кончились в девяносто восьмом.'),
    egg('socks', R2(2, 0.32), 1, 'Чьи-то носки. Химическое оружие, запрещённое всеми конвенциями.'), egg('box', R4(1, 0.66), 3, 'Щиток «Не влезай — убьёт». Влез. Не убило. Даже обидно.')];
  D.voidAt = (x, y) => ST.some(s => { const lx = LXof(s, x); return lx > 0 && lx < SW && ((Math.abs(y - T[s.f + 1]) < 8 && lx > TOPE - 4) || (Math.abs(y - T[s.f]) < 8 && lx > FOOT + 6) || (y < T[s.f] - 8 && y > T[s.f + 1] + 8)); });   // шахта лестницы: ровного пола нет
  D.plats = [1, 2, 3].map(i => ({ x: 0, y: T[i], w: RM.w, h: 20, oneway: false }));
  const alive = (r, f, x0 = 0, x1 = 9999) => r.guards.some(g => g.alive && g.state !== 'stagger' && Math.abs(g.y - T[f]) < 5 && g.x > x0 && g.x < x1);
  D.task = r => { const f = floorOf(r.player.y); return f === 0 ? (alive(r, 0) ? 'этаж 1: выруби часового со спины' : 'этаж 1: к лестнице справа') : f === 1 ? 'этаж 2: мимо собаки, камеры и кладовщика — к лестнице слева'
    : f === 2 ? (r.flags.twL3 ? 'этаж 3: лазер отключён — к лестнице справа' : 'этаж 3: сними охрану и отключи лазер на пульте') : r.flags.roofOpen ? 'выйти на крышу' : 'этаж 4: пройди лазеры, сними постового и взломай замок двери'; };
  D.guards = [
    { x: R1(2, 0.6), y: T[0], x1: R1(2, 0.12), x2: R1(3, 0.25), facing: -1, range: 120, sp: 36 },          // 1: часовой (приёмная — шлюз)
    { x: R2(2, 0.3), y: T[1], x1: R2(2, 0.08), x2: R2(2, 0.62), facing: 1, range: 120, sp: 34 },           // 2: кладовщик (раздевалка)
    { x: R3(2, 0.4), y: T[2], x1: R3(2, 0.1), x2: R3(2, 0.9), facing: 1, range: 120, sp: 34 },             // 3: мониторная
    { x: PANEL - 50, y: T[2], kind: 'post', facing: -1, range: 116, x1: PANEL - 50, x2: PANEL - 50 },       // 3: у пульта, вертит головой
    { x: R3(3, 0.7), y: T[2], x1: R3(3, 0.62), x2: R3(3, 0.78), facing: 1, range: 110, sp: 28 },           // 3: между пультом и лазером
    { x: R4(1, 0.7), y: T[3], kind: 'post', facing: 1, range: 122, x1: R4(1, 0.7), x2: R4(1, 0.7) },       // 4: у двери на крышу
  ];
  D.dogs = [{ x: R2(3, 0.6), y: T[1], x1: R2(3, 0.1), x2: R2(3, 0.8), range: 100, facing: 1 }, { x: R4(3, 0.5), y: T[3], x1: R4(3, 0.3), x2: R4(3, 0.78), range: 100, facing: -1 }];
  D.cams = [{ x: R2(2, 0.9), y: T[1] - 126, floorY: T[1], a0: 1.5, a1: 2.6, per: 6, range: 160, half: 0.19 }];
  D.lasers = [{ x: R3(3, 0.93), y0: T[2] - CEIL, y1: T[2] + 6, group: 'twL3', v5: 1 }, ...LZ.map((x, i) => ({ x, y0: T[3] - CEIL, y1: T[3] + 6, blink: [2.9, 1.3], ph: [0, 2.8, 1.4][i], v5: 1 }))];
  const glow = (c, x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
  const stairImg = (c, cx, s) => { const im = pimg(s.dir > 0 ? 'stair' : 'stair_l'), z = PS.stair; if (im && z) c.drawImage(im, Math.round(s.x0 - cx), T[s.f] + 2.8 - z[1], z[0], z[1]); };
  D.bgFn = (c, cx, r) => {
    const Im = I();
    for (let n = 0; n < NF; n++) { const im = Im['fl' + (n + 1)]; if (im) c.drawImage(im, -cx, T[n] - RM.top, LAY.w, RM.pitch); }
    c.fillStyle = '#05070a'; c.fillRect(0, T[0] + RM.low, W, 80);   // под зданием — фундамент
    if (Im.tw_sign) { c.globalAlpha = U.clamp(0.9 + 0.1 * Math.sin(G.t * 9) * (Math.sin(G.t * 1.7) > 0.93 ? 4 : 1), 0.4, 1); c.drawImage(Im.tw_sign, DOOR.x - 32 * ZD - cx, T[0] - 15 - 109.5 * ZD, 64 * ZD, 11.6 * ZD); c.globalAlpha = 1; }
    const fr = D.winFr; if (fr != null) {   // за стеклом гермодвери: бомж с ур.2 стучит -> сползает -> зелёный газ (всё строго в раме стекла)
      const gx = DOOR.x - DOOR.w / 2 - cx, gy = DOOR.y - DOOR.h / 2, k = D.winK || 0, gas = fr >= 4 ? 1 : fr >= 2 ? 0.55 : 0.12;
      c.save(); c.beginPath(); c.rect(gx, gy, DOOR.w, DOOR.h); c.clip();
      c.fillStyle = '#0b1210'; c.fillRect(gx, gy, DOOR.w, DOOR.h);
      if (k < 1) { const sh = (D.winShake || 0) * 2, by = gy + 62 * ZD + k * 46;   // бомж и алкаш с ур.2: стучат в стекло, потом сползают
        Spr.draw(c, 'bomzh', fr === 1 ? 5 : 4, DOOR.x + 15 * ZD - cx - sh, by + 2 + k * 10, -1, { scale: 0.8 * ZD });
        Spr.draw(c, 'bomzh', fr === 1 ? 1 : 0, DOOR.x - 13 * ZD - cx + sh, by, 1, { scale: 0.8 * ZD }); }
      c.fillStyle = `rgba(70,230,90,${gas * (0.34 + 0.1 * Math.sin(G.t * 1.3))})`; c.fillRect(gx, gy, DOOR.w, DOOR.h);
      if (Im.tw_win5 && gas > 0.5) { c.globalAlpha = 0.5 * (D.winMix || 0.6); c.drawImage(Im.tw_win5, gx, gy, DOOR.w, DOOR.h); c.globalAlpha = 1; }
      c.fillStyle = 'rgba(190,230,255,0.07)'; c.beginPath(); c.moveTo(gx + 8, gy); c.lineTo(gx + 22, gy); c.lineTo(gx + 6, gy + DOOR.h); c.lineTo(gx - 8, gy + DOOR.h); c.fill();
      c.restore();
    }
    for (const h of D.hides) drawHide(c, cx, h);
    for (const p of COLL) if (!got(r).has(p.id) && p.hid == null) { const im = pimg(p.n), z = PS[p.n]; if (im && z) { const y = T[p.f] - 6 + Math.sin(G.t * 3 + p.x) * 1.5; c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(p.x - cx, T[p.f] - 5, z[0] * 0.5, 2.5, 0, 0, 6.3); c.fill(); c.drawImage(im, Math.round(p.x - z[0] / 2 - cx), y - z[1], z[0], z[1]); } }
    if (r.flags.roofOpen && Im.roofopen && window.V4_ROOFOPEN) { const q = window.V4_ROOFOPEN; c.drawImage(Im.roofopen, q[0] - cx, T[3] - RM.top + q[1], q[2], q[3]); }   // та же дверь распахнута, за ней — крыша под дождём
    c.save(); c.globalCompositeOperation = 'lighter';   // живой свет: бак, пульт, газ за стеклом
    const p = 0.5 + 0.5 * Math.sin(G.t * 2.2);
    glow(c, R1(3, 0.8) - cx, T[0] - 15 - 45 * ZD, 40, '80,255,120', 0.07 + 0.09 * p); glow(c, R3(3, 0.83) - cx, T[2] - 15 - 47 * ZM(3, 2), 40, '80,255,120', 0.07 + 0.09 * (1 - p));
    if (!r.flags.twL3) glow(c, PANEL - cx, T[2] - 44, 30, '255,40,30', 0.10 + 0.14 * (0.5 + 0.5 * Math.sin(G.t * 5))); else glow(c, PANEL - cx, T[2] - 44, 26, '60,255,90', 0.16);
    if (fr >= 2) glow(c, DOOR.x - cx, DOOR.y, 60, '90,255,90', (fr >= 4 ? 0.2 : 0.1) + 0.05 * p);
    c.restore();
  };
  D.drawFront = (c, cx, r) => {
    const cy = r.camY || 0, pl = r.player, col = pimg('wall'), z = PS.wall, Im = I();
    for (let n = 0; n < NF; n++) { const im = Im['fl' + (n + 1)]; if (im) for (const [x, w] of (LAY.occ[n] || [])) c.drawImage(im, x * 2, 0, w * 2, im.height, x - cx, T[n] - RM.top, w, RM.pitch); }   // простенки у проёмов — поверх персонажей: вошёл в проём, вышел из соседнего
    if (col && z) for (let n = 0; n < NF; n++) for (let m = 0; m <= 4; m++) { const q = ROW[n][Math.min(m, 3)], x = m < 4 ? q[0] : q[0] + q[1], well = m === 4 || (m === 0 && n > 0 && n < 3);   // тонкие стены-перегородки в разрезе — поверх персонажей
      c.drawImage(col, Math.round(x - z[0] / 2 - cx), T[n] - RM.top + (well && n % 2 === 0 ? 0 : 0), z[0], z[1]); }
    for (const p of PR) if (p.pl === 'f') drawProp(c, cx, p);   // передний план — поверх всех персонажей
    for (const p of PR) if (p.pl === 'n') drawProp(c, cx, p);   // ближний план
    c.save(); c.translate(0, cy);
    if (r.storm.flash > 0.05) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(120,130,190,${0.05 * r.storm.flash})`; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
    // значок опасности: враг на этом этаже за краем экрана
    if (!r.level.scene) for (const e of [...r.guards, ...r.dogs]) { if (e.alive === false || e.state === 'stagger' || Math.abs(e.y - pl.y) > 40) continue; const ex = e.x - cx; if ((ex > -8 && ex < W + 8) || Math.abs(e.x - pl.x) > 560) continue;
      const x = ex < 0 ? 16 : W - 16, y = e.y - cy - 60 + Math.sin(G.t * 8) * 2; c.fillStyle = '#e02818'; c.beginPath(); c.moveTo(x, y - 11); c.lineTo(x + 11, y + 8); c.lineTo(x - 11, y + 8); c.closePath(); c.fill(); G.text('!', x, y - 5, { align: 'center', size: 8, color: '#fff' }); }
    c.restore();
  };
  const door = { x: DOOR.x, y: T[0] - 20, headH: 108, voice: 400 };   // реплика — над табло, окно не закрывает
  D.update = (dt, r) => {
    const pl = r.player, f = floorOf(pl.y), a = pl.auto;
    r.storm.update(dt, false); if (r.stairT > 0) r.stairT -= dt;
    if (!r.level.scene && !r.caught) for (const p of COLL) if (!got(r).has(p.id) && (p.hid != null ? pl.seq && pl.seq.phase === 'hid' && pl.seq.h === r.hides[p.hid] : Math.abs(pl.x - p.x) < 18 && Math.abs(pl.y - T[p.f]) < 8)) take(r, p); if (a && a.stair) r.stairT = 4;
    if (a && a.stair) {   // шаг по ступеням: высота ног — по ступени под ногой
      const s = a.stair, seg = a.up ? a.i : 3 - a.i, lx = LXof(s, pl.x);
      if (a.i > 0 && a.i < 3) pl.y = T[s.f] - stepH(lx, seg === 2);
    } else if (!r.level.scene) for (const s of ST) {   // шахта: сквозь лестницу не пройти, на верхнем этаже над шахтой пола нет
      const lx = LXof(s, pl.x); let lim = null;
      if (f === s.f && lx > FOOT + 2) lim = FOOT + 2; else if (f === s.f + 1 && lx > TOPE - 8) lim = TOPE - 8;
      if (lim != null) { pl.x = SX(s, lim); if (pl.vx * s.dir > 0) pl.vx = 0; }
    }
    if (r.flags.dDoor === 2 && Math.random() < dt * 6) FX.burst(DOOR.x + U.rand(-40, 40), T[0] - 2, 1, { angle: -Math.PI / 2, spread: 1.6, speed: 12, colors: ['#5cd65c', '#8cf08c', '#3a9a3a'], grav: -10, life: 1.3, size: 3, drag: 1, type: 'puff' });
    if (!r.flags.dDoor && f === 0 && pl.x > R1(3, 0.16) && pl.onGround && !pl.auto && !r.caught && !r.level.scene) { r.flags.dDoor = 1; r.level.playOnMap(V4.sceneGasDoor(r.level, r, D)); }
    const ds = D.ds;
    if (ds) {   // сцена в окошке: бомж стучит и зовёт на помощь -> сползает -> зелёный газ
      ds.t += dt; const t = ds.t; D.winShake = 0; D.winMix = 0;
      const say = (n, text, dur) => { if (ds.said < n) { ds.said = n; G.say(door, text, dur, { shout: true }); } };
      if (t < 2.7) { D.winK = 0; D.winFr = (t * 5.5 | 0) % 2; const k = t / 0.36 | 0; if (k >= ds.k) { ds.k = k + 1; Sound.play('land'); G.shake(1.2, 0.1); } D.winShake = D.winFr ? 1 : 0; say(1, 'ПОМОГИТЕ!!! ОТКРОЙТЕ!', 1.6); }
      else if (t < 3.9) { D.winFr = 2; D.winK = (t - 2.7) / 1.2; say(2, 'Я ПЕРЕДУМАЛ! Не надо мне вашей рабо...', 1.2); if (ds.k < 100) { ds.k = 100; Sound.play('zap'); } }
      else if (t < 5.1) { D.winFr = 3; D.winK = 1; }
      else { D.winFr = 4; if (t > 6.2) { r.flags.dDoor = 2; D.ds = null; } }
    } else if (r.flags.dDoor) { D.winFr = 4; D.winK = 1; D.winMix = 0.5 + 0.5 * Math.sin(G.t * 1.3); if (r.flags.dDoor === 1 && !r.level.scene) r.flags.dDoor = 2; }
    if (!r.caught && pl.onGround && !pl.auto && f > (r.flags.dCp || 0)) {   // чекпоинт — каждый новый этаж
      r.flags.dCp = f; r.cp = { id: 'D', x: SX(ST[f - 1], TOPX), face: -ST[f - 1].dir }; r.saved = { flags: Object.assign({}, r.flags), ko: new Set(r.ko) }; FX.popText(pl.x, pl.y - 96, 'ЭТАЖ ' + (f + 1), '#8cf08c');
    }
  };
  D.onLoad = r => {
    const pl = r.player, wd = r.world, cp = r.flags.dCp || 0;
    r.level.stats.secretsTotal = 5; r.level.stats.eggsTotal = EGGS.length + 1;
    for (const p of PR) if (p.pl === 'f') r.covers.push({ x1: p.x - p.w * 0.45, x2: p.x + p.w * 0.45, y: T[p.f] });
    for (const cam of r.cams) cam.draw = function (c, cx, cy, rr) {   // камера из Flow + луч (свет)
      const x = this.x - cx, y = this.y - cy, mid = (this.a0 + this.a1) / 2, left = Math.cos(mid) < 0, im = V4.img.tw_cam;   // сторона — по середине сектора, головка плавно поворачивается
      const g = c.createRadialGradient(x, y, 4, x, y, this.range), col = this.see > 0.05 ? '255,60,40' : '150,255,235';
      g.addColorStop(0, `rgba(${col},0.34)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.arc(x, y, this.range, this.a - this.half, this.a + this.half); c.closePath(); c.fill();
      if (im) { const k = 0.2, sw = im.width, hy = 64, px = 66;   // кронштейн неподвижен (нижняя часть картинки), поворачивается только головка камеры вокруг шарнира
        c.save(); c.translate(x, y - 6); if (left) c.scale(-1, 1); c.drawImage(im, 0, hy, sw, im.height - hy, -18, -8 + hy * k, sw * k, (im.height - hy) * k);
        c.translate(-18 + px * k, -8 + hy * k); c.rotate((left ? -1 : 1) * (this.a - mid) * 0.8); c.drawImage(im, 0, 0, sw, hy, -px * k, -hy * k, sw * k, hy * k); c.restore(); }
    };
    if (cp) { pl.y = T[cp]; wd.cam.y = U.clamp(pl.y - 236, D.topY, 0); }
    else { pl.x = 50; if (!r.flags.dIn) { r.flags.dIn = 1; G.say(pl, 'Цех сортировки... Тихо, как в морге.', 2.6); } }
    wd.cam.x = U.clamp(pl.x - W / 2, 0, D.w - W);
  };
  const on = f => r => Math.abs(r.player.y - T[f]) < 8;
  D.ints = [
    ...ST.map(s => ({ x: SX(s, FOOT), y: T[s.f], r: 18, label: 'наверх', act: r => climb(r, s, true) })),
    ...ST.map(s => ({ x: SX(s, TOPX), y: T[s.f + 1], r: 14, key: 'down', label: 'вниз', cond: r => !(r.stairT > 0), act: r => climb(r, s, false) })),
    { x: PANEL, y: T[2], r: 22, label: 'пульт лазеров', cond: r => !r.flags.twL3 && !alive(r, 2, R3(3), R3(4)), act: r => { r.player.setAnim('panel4'); r.startMG('lasers', ok => { if (ok) { r.flags.twL3 = 1; Sound.play('zap'); G.say(r.player, 'Лазер сдох. Путь свободен.', 1.8); } }); } },
    { x: LOCK, y: T[3], r: 16, label: 'замок двери', cond: r => !r.flags.roofOpen && !alive(r, 3), act: r => { r.player.setAnim('panel4'); r.startMG('wires', ok => { if (ok) { r.flags.roofOpen = 1; Sound.play('zap'); Sound.play('door'); G.say(r.player, 'Коротнуло — и открыто!', 1.6); } }); r.mg.title = 'ДВЕРЬ НА КРЫШУ: ЗАМКНИ ПРОВОДА'; r.mg.okMsg = 'ЗАМОК СГОРЕЛ. ОТКРЫТО!'; } },
    { x: ROOFDOOR, y: T[3], r: 20, label: 'на крышу', cond: r => r.flags.roofOpen, act: r => r.level.roofExit(r) },
    ...EGGS,
  ];
  D.hints = [];   // текстовых подсказок нет — только указатели у объектов
  return D;
};

// сцена у гермодвери: камера отъезжает к окошку, бомж стучит, газ; затем возвращается к Валере
V4.sceneGasDoor = function (level, run, D) {
  const wd = run.world, pl = run.player;
  return function* () {
    run.camLock = true; pl.vx = 0; pl.facing = 1;
    const tx = U.clamp(pl.x - 60, 0, D.w - W), pan = () => { wd.cam.x += (tx - wd.cam.x) * Math.min(1, G.dt * 5); };
    for (let t = 0; t < 0.7; t += G.dt) { pan(); yield; }
    D.ds = { t: 0, k: 0, said: 0 };
    let said = false;
    while (D.ds) { pan(); if (!said && D.ds.t > 1.5) { said = true; G.say(pl, 'Мужик?! Ты чего там?..', 1.6); } yield; }
    yield 0.3; G.say(pl, '...Вот тебе и «сортировка». Наверх, Валера. Тихо и быстро.', 3); yield 1.2;
    run.camLock = false;
  };
};

// ================= F: заводоуправление, коридоры =================
// двери коридора: [x, комната или null(заперто)]; лифты V4.coX(824) и зеркально
V4.FLOORS = {
  4: { rooms: { L: 'RA1', R: 'RA3' }, names: { L: 'Пост охраны', R: 'Спортзал' } },
  3: { rooms: { L: 'RA2', R: 'RB0' }, names: { L: 'Серверная', R: 'Кухня' } },
  2: { rooms: { L: 'RB1', R: 'RB2' }, names: { L: 'Комната отдыха', R: 'Бухгалтерия' } },
  1: { rooms: { L: 'RA0', R: 'RB3' }, names: { L: 'Кабинет директора', R: 'Переговорная' } },
};
V4.F_TASK = r => !r.flags.camsOff ? 'отключить камеры (пост охраны, этаж 4)' : !r.flags.lasersOff ? 'отключить лазеры (серверная, этаж 3)'
  : !r.flags.note ? 'найти код от сейфа (комната отдыха, этаж 2)' : !r.flags.key ? 'открыть сейф (кабинет директора, этаж 1)'
  : !r.flags.card ? 'отнять ключ-карту у главаря (переговорная, этаж 1)' : 'к лифту — в главный зал!';
V4.F_GOAL = r => !r.flags.camsOff ? { floor: 4, side: 'L' } : !r.flags.lasersOff ? { floor: 3, side: 'L' } : !r.flags.note ? { floor: 2, side: 'L' } : !r.flags.key ? { floor: 1, side: 'L' } : !r.flags.card ? { floor: 1, side: 'R' } : { floor: 0 };
V4.lift = function (r) {
  const items = [4, 3, 2, 1].map(n => ({ label: 'Этаж ' + n + (n === r.D.floor ? ' (вы здесь)' : ''), n })).concat([{ label: r.flags.card ? 'ГЛАВНЫЙ ЗАЛ' : 'Главный зал (нужна ключ-карта)', hall: true, locked: !r.flags.card }]);
  Sound.play('bell');
  r.openMenu('ЛИФТ', items, it => {
    if (it.hall) { if (!r.flags.card) { G.say(r.player, 'Нужна ключ-карта. Она у главаря спецназа.', 1.8); return; } r.level.toHall(r); return; }
    if (it.n === r.D.floor) return;
    r.go('F' + it.n, r.player.x, 'Лифт... Этаж ' + it.n);
  });
};
V4.floorMap = function (run, n) {
  const C = V4.CO, F = V4.FLOORS[n], D = { w: Math.round(C.tw * 2), bg: { k: 'corr0', s: C.s, fy: C.fy }, floor: n, task: V4.F_TASK, suspK: 0.8 };
  D.maxX = D.w - 20;
  const X = V4.coX, M = x => D.w - x, dL = X(130), dR = M(X(130)), lift = X(824);
  D.dL = dL; D.dR = dR; D.lift = lift;
  D.props = [
    { x: X(266), cover: true, cw: 14 }, { x: X(960), cover: true, cw: 14 }, { x: M(X(266)), cover: true, cw: 14 }, { x: M(X(960)), cover: true, cw: 14 },   // статуи на фоне
    { sh: 'inp4', fr: 4, x: X(1130), y: V4.GY + 2, s: 0.8, cover: true, cw: 14 }, { sh: 'inp4', fr: 4, x: M(X(1130)), y: V4.GY + 2, s: 0.8, cover: true, cw: 14 },
  ];
  D.hides = [
    { x: X(540), label: 'спрятаться за шторой' }, { x: M(X(540)), label: 'спрятаться за шторой' },
    { x: D.w / 2 + 14, sh: 'inp4', frC: 1, frO: 2, s: 0.72, label: 'спрятаться в шкаф' },
  ];
  const door = (x, side) => {
    const id = F.rooms[side];
    return { x, r: 22, label: 'войти: ' + F.names[side], act: r => {
      if (id === 'RB3' && !r.flags.key) { G.say(r.player, 'Заперто. Ключ — в сейфе директора.', 1.8); return; }
      r.go(id, side === 'L' ? 600 : 40, F.names[side], side === 'L' ? -1 : 1);
    } };
  };
  const locked = x => ({ x, r: 18, label: 'дверь', act: r => G.say(r.player, U.choice(['Заперто.', 'Закрыто. Тут только швабры.', 'Заперто. И к лучшему.']), 1.2) });
  D.ints = [door(dL, 'L'), door(dR, 'R'), locked(X(304)), locked(M(X(304))),
    { x: lift, r: 26, label: 'вызвать лифт', act: r => V4.lift(r) }, { x: M(lift), r: 26, label: 'вызвать лифт', act: r => V4.lift(r) }];
  const cam = (x, ph) => ({ x, y: 66, a0: 0.9, a1: 2.25, per: 7, ph, range: 240, half: 0.22, group: 'camsOff' });
  const las = (x, o) => Object.assign({ x, y0: V4.GY - 96, y1: V4.GY, group: 'lasersOff' }, o);
  if (n === 4) {
    D.guards = [{ x: 600, x1: 420, x2: 900, facing: -1, range: 160, sp: 30 }];
    D.cams = [cam(300, 0), cam(760, 3)];
    D.hints = [{ x1: 900, x2: 1300, text: 'Заводоуправление! Укрытия: шторы и шкаф ({up}), статуи и фикусы ({down})', cond: r => !r.flags.camsOff },
      { x1: 0, x2: 300, text: 'Пост охраны — тут. Отключи камеры на щитке', cond: r => !r.flags.camsOff }];
  } else if (n === 3) {
    D.guards = [{ x: 300, x1: 160, x2: 600, facing: 1, range: 160, sp: 32 }];
    D.dogs = [{ x: 900, x1: 760, x2: 1120, range: 130 }];
    D.cams = [cam(640, 1)];
    D.lasers = [las(240, { blink: [1.6, 1.2] })];
    D.hints = [{ x1: 0, x2: 360, text: 'Лазер мигает — проскочи, когда погаснет. Пульт — в серверной', cond: r => !r.flags.lasersOff }];
  } else if (n === 2) {
    D.guards = [{ x: 200, x1: 120, x2: 520, facing: 1, range: 160, sp: 30 }, { x: 1000, x1: 760, x2: 1180, facing: -1, range: 160, sp: 34 }];
    D.cams = [cam(640, 2)];
    D.lasers = [las(700, { x1: 600, x2: 800, sp: 36 })];
  } else {
    D.guards = [{ x: D.w - 200, kind: 'post', facing: -1, range: 180, x1: D.w - 200, x2: D.w - 200 }];
    D.cams = [cam(300, 0), cam(1000, 2)];
    D.lasers = [las(240), las(290), las(D.w - 300), las(D.w - 250)];
    D.hints = [{ x1: 300, x2: 1000, text: 'Лазеры! Отключаются пультом в серверной (этаж 3)', cond: r => !r.flags.lasersOff },
      { x1: 300, x2: 1000, text: 'Переговорная — справа. Там главарь с ключ-картой', cond: r => r.flags.key && !r.flags.card }];
  }
  D.onLoad = r => { const g = V4.F_GOAL(r), x = g.floor === n ? (g.side === 'L' ? dL : dR) : lift; r.arrow = { x, y: 190 }; };
  return D;
};
for (let n = 1; n <= 4; n++) V4.MAPS['F' + n] = run => V4.floorMap(run, n);

// ================= комнаты (на весь экран) =================
V4.room = function (run, k, floor, side, o) {
  const D = Object.assign({ w: W, bg: { k, s: 0.45, fy: 620, x0: 32 }, task: V4.F_TASK, suspK: 0.9 }, o);
  const back = side === 'L' ? V4.coX(130) : Math.round(V4.CO.tw * 2) - V4.coX(130), exitX = side === 'L' ? 612 : 28;
  D.minX = 0; D.maxX = W;
  D.ints = [{ x: exitX, r: 26, label: 'выйти в коридор', act: r => r.go('F' + floor, back, 'Коридор, этаж ' + floor, side === 'L' ? 1 : -1) }].concat(D.ints || []);
  const up = D.update, dr = D.drawMid;
  D.update = (dt, r) => { V4.updSleepers(dt, r); V4.updPicks(dt, r); if (up) up(dt, r); };
  D.drawMid = (c, cx, r) => { V4.drawSleepers(c, cx, r); V4.drawPicks(c, cx, r); if (dr) dr(c, cx, r); };
  return D;
};
const pkFood = (id, x, txt) => ({ id, x, sh: 'bfx4', fr: 14, s: 0.5, take: r => { r.player.heal(30); r.level.stats.food++; G.say(r.player, txt, 1.4); } });
const pkBonus = (id, x, txt, sc = 1000) => ({ id, x, take: r => { r.world.addScore(sc); r.level.stats.secrets++; FX.popText(x, V4.GY - 70, '+' + sc, '#ffd84a'); G.say(r.player, txt, 1.8); } });
// этаж 4: пост охраны (щиток камер; охранник спит у мониторов) и спортзал
V4.MAPS.RA1 = run => V4.room(run, 'roomA1', 4, 'L', {
  sleepers: [new V4.Sleeper({ x: 330, fr: 6, frW: 7, line: 'Э! Ты кто?! Пост 4, тревога!!!' })],
  ints: [{ x: 120, r: 30, label: 'щиток камер', cond: r => !r.flags.camsOff, act: r => { r.player.setAnim('panel4'); r.startMG('wires', ok => { if (ok) { r.flags.camsOff = 1; Sound.play('lever'); G.say(r.player, 'Камеры во всём здании — спят. Как этот охранник.', 2); } }); } }],
  hints: [{ x1: 160, x2: 640, text: 'Охранник спит! {down} — ползком, иначе проснётся', cond: r => !r.flags.camsOff }],
  onLoad: r => { r.arrow = r.flags.camsOff ? null : { x: 120, y: 180 }; },
});
V4.MAPS.RA3 = run => V4.room(run, 'roomA3', 4, 'R', {
  guards: [{ x: 420, x1: 260, x2: 560, facing: -1, range: 150, sp: 26 }],
  hides: [{ x: 140, sh: 'inp4', frC: 1, frO: 2, s: 0.8, label: 'спрятаться в шкаф' }],
  picks: [pkFood('gymchick', 520, 'Куриная грудка качка. Белок!'), pkBonus('gymsec', 300, 'Абонемент «Безлимит для начальства». Сувенир!')],
  hints: [{ x1: 0, x2: 640, text: 'Спортзал. Охранник качает пресс глазами — не попадайся' }],
});
// этаж 3: серверная (пульт лазеров) и кухня (повар спит)
V4.MAPS.RA2 = run => V4.room(run, 'roomA2', 3, 'L', {
  guards: [{ x: 300, x1: 230, x2: 470, facing: 1, range: 140, sp: 24 }],
  ints: [{ x: 520, r: 30, label: 'пульт лазеров', cond: r => !r.flags.lasersOff, act: r => { r.player.setAnim('panel4'); r.startMG('lasers', ok => { if (ok) { r.flags.lasersOff = 1; Sound.play('lever'); G.say(r.player, 'Лазеры погасли. Сэкономил им электричество.', 2); } }); } }],
  hints: [{ x1: 0, x2: 640, text: 'Пульт лазеров у компьютера. Охранник ходит между стойками', cond: r => !r.flags.lasersOff }],
  onLoad: r => { r.arrow = r.flags.lasersOff ? null : { x: 520, y: 200 }; },
});
V4.MAPS.RB0 = run => V4.room(run, 'roomB0', 3, 'R', {
  sleepers: [new V4.Sleeper({ x: 250, fr: 4, frW: 5, line: 'Вор!!! Половником его! ОХРАНА!!!' })],
  picks: [pkFood('kitch1', 420, 'Курица для банкета. Банкет перебьётся.'), pkFood('kitch2', 470, 'Ещё ножка! Стропальщику нужны силы.')],
  hints: [{ x1: 0, x2: 640, text: 'Повар спит. Ползком ({down}) — к еде' }],
});
// этаж 2: комната отдыха (спящие; записка с кодом) и бухгалтерия
V4.MAPS.RB1 = run => V4.room(run, 'roomB1', 2, 'L', {
  sleepers: [new V4.Sleeper({ x: 222, y: V4.GY - 8, s: 1.55, fr: 2, frW: 3, line: 'А?! Чужой! ОХРАНА-А-А!!!' })],
  picks: [{ id: 'note', x: 470, sh: 'inp4', fr: 9, s: 1, take: r => { r.flags.note = 1; G.say(r.player, 'Записка: «Код сейфа шефа — ' + r.code + '. Не забыть!» Спасибо, растяпа.', 3); r.arrow = null; } }],
  hints: [{ x1: 0, x2: 640, text: 'Тихо! Кто-то спит на диване. Ползком ({down})', cond: r => !r.flags.note }],
  onLoad: r => { r.arrow = r.flags.note ? null : { x: 470, y: 230 }; },
});
V4.MAPS.RB2 = run => V4.room(run, 'roomB2', 2, 'R', {
  sleepers: [new V4.Sleeper({ x: 330, fr: 0, frW: 1, line: 'Посторонний в бухгалтерии!!! ОХРАНА!!!' })],
  picks: [pkBonus('premia', 520, 'Конверт «Премия руководству». Это моя премия — за вредность.', 1500)],
  hints: [{ x1: 0, x2: 640, text: 'Бухгалтер спит над отчётом. Ползком!' }],
});
// этаж 1: кабинет директора (сейф с кодом) и переговорная (босс)
V4.MAPS.RA0 = run => V4.room(run, 'roomA0', 1, 'L', {
  cams: [{ x: 330, y: 50, a0: 0.9, a1: 2.25, per: 6, range: 240, half: 0.22, group: 'camsOff' }],
  ints: [{ x: 520, r: 30, label: 'сейф', cond: r => !r.flags.key, act: r => {
    if (!r.flags.note) { G.say(r.player, 'Кодовый сейф. Код где-то записан — люди же забывают...', 2); return; }
    r.player.setAnim('panel4'); r.startMG('code', ok => { if (ok) { r.flags.key = 1; Sound.play('door'); FX.popText(520, V4.GY - 90, 'КЛЮЧ ОТ ПЕРЕГОВОРНОЙ', '#ffd84a'); G.say(r.player, 'Ключ от переговорной! Главарь там.', 2); } }); } }],
  onLoad: r => { r.arrow = r.flags.key ? null : { x: 520, y: 170 }; },
});
V4.MAPS.RB3 = run => V4.room(run, 'roomB3', 1, 'R', {
  music: false, suspK: 0,
  plats: [{ x: 250, y: V4.GY - 34, w: 140, h: 8 }],
  onLoad: r => { r.arrow = null; if (!r.flags.card) { r.boss = new V4.Boss(470, r); if (r.level.bossSeen) { r.boss.set('idle'); Music.play('boss'); } else { r.level.bossSeen = true; r.level.playOnMap(V4.sceneBossIntro(r.level, r)); } } else r.boss = null; },
  update: (dt, r) => { if (r.boss && r.boss.state === 'ko' && !r.flags.card && !r.level.scene && !r.bossWon) { r.bossWon = true; r.level.playOnMap(V4.sceneBossWin(r.level, r)); } if (r.bossHint > 0) { r.bossHint -= dt; r.hint = 'Бей, когда перезаряжается или ест! Пули: {down} — пригнись, {jump} — прыгай'; r.hintA = 1; } },
  drawMid: (c, cx, r) => { if (r.cardDrop) Spr.draw(c, 'inp4', 9, r.cardDrop.x - cx, V4.GY - 2, 1); },
  task: r => r.flags.card ? 'к лифту — в главный зал!' : 'победить главаря спецназа',
});

// ================= БОСС: главарь спецназа =================
// уязвим: перезарядка, курица, оглушение, приземление. Иначе уворачивается «по-матричному».
V4.Boss = class {
  constructor(x, run) {
    this.x = x; this.y = V4.GY; this.vy = 0; this.facing = -1; this.hp = this.max = 10; this.state = 'sit'; this.t = 0; this.animT = 0; this.anim = 'sit';
    this.ammo = 6; this.bullets = []; this.nades = []; this.smokes = []; this.cool = 0; this.ate = 0; this.combo = 0; this.voice = 120; this.air = false; this.table = { x1: 250, x2: 390, y: V4.GY - 34 };
  }
  get box() { return { x: this.x - 14, y: this.y - 82, w: 28, h: 82 }; }
  get vuln() { return ['reload', 'eat', 'dizzy', 'land', 'hurt'].includes(this.state); }
  set(s, anim) { this.state = s; this.t = 0; this.anim = anim || s; this.animT = 0; }
  face(pl) { this.facing = Math.sign(pl.x - this.x) || this.facing; }
  fire(run, low) {
    const y = this.y - (low ? 26 : this.air ? 50 : 56);
    this.bullets.push({ x: this.x + this.facing * 30, y, vx: this.facing * 330, life: 2.2 }); this.flashT = 0.08; this.ammo--; Sound.play('shot'); G.shake(1.5, 0.05);
  }
  think(run, pl) {
    const d = Math.abs(pl.x - this.x); this.face(pl);
    if (this.ammo <= 0) { this.set('reload'); G.say(this, U.choice(['Перезарядка!', 'Магазин пустой... Секунду!', 'Не подходи, я перезаряжаюсь!']), 1.2); Sound.play('clank'); return; }
    if (this.hp <= 5 && this.ate < 2 && this.cool <= 0 && Math.random() < 0.4) { this.set('eat'); this.ate++; G.say(this, U.choice(['Перерыв на обед. Курочка!', 'Без курицы — не бой. Ням.']), 1.4); return; }
    if (d < 64) { this.set(Math.random() < 0.5 ? 'punch' : 'kick'); return; }
    const r = Math.random();
    if (r < 0.32) this.set('aim');
    else if (r < 0.5) { this.set('roll'); this.rollDir = Math.random() < 0.5 ? this.facing : -this.facing; }
    else if (r < 0.7) this.set('prejump');
    else if (r < 0.82 && !this.smokes.length && !this.nades.length) this.set('grenade');
    else if (r < 0.9) { this.set('taunt'); G.say(this, U.choice(['Стропальщик? Ха! Я стропы на завтрак ем!', 'Ну давай, Мистер Рэд, удиви меня!', 'Я в армии пять лет в карри-роте служил!']), 1.6); }
    else this.set('run');
  }
  update(dt, run) {
    const pl = run.player; this.t += dt; this.animT += dt; if (this.cool > 0) this.cool -= dt; if (this.flashT > 0) this.flashT -= dt;
    // физика
    if (this.air) { this.vy += 900 * dt; this.y += this.vy * dt; this.x += this.vx * dt;
      const tb = this.table; if (this.vy > 0 && this.x > tb.x1 && this.x < tb.x2 && this.y >= tb.y && this.y - this.vy * dt <= tb.y + 1) { this.y = tb.y; this.air = false; this.set('land'); Sound.play('land'); }
      else if (this.y >= V4.GY) { this.y = V4.GY; this.air = false; this.set('land'); Sound.play('land'); G.shake(2, 0.1); } }
    else if (this.y < V4.GY && (this.x < this.table.x1 || this.x > this.table.x2)) { this.air = true; this.vy = 0; this.vx = 0; }
    this.x = U.clamp(this.x, 30, W - 30);
    const S = this.state;
    if (S === 'sit' || S === 'wait') {}
    else if (S === 'idle') { this.anim = 'stand'; this.face(pl); if (this.t > (this.hp > 5 ? 0.7 : 0.45)) this.think(run, pl); }
    else if (S === 'aim') { this.face(pl); if (this.t > 0.4) { this.set('shoot'); this.shots = Math.min(this.ammo, 3); this.low = Math.random() < 0.35; this.anim = this.low ? 'crouchShoot' : 'shoot'; } }
    else if (S === 'shoot') { this.face(pl); if (this.shots > 0 && this.t > 0.18) { this.t = 0; this.shots--; this.fire(run, this.low); } else if (this.shots <= 0 && this.t > 0.3) this.set('idle'); }
    else if (S === 'roll') { this.anim = 'roll'; this.x += this.rollDir * 190 * dt; if (this.t > 0.45) { this.set('shoot'); this.face(pl); this.shots = Math.min(this.ammo, 2); this.low = true; this.anim = 'crouchShoot'; } }
    else if (S === 'run') { this.anim = 'run'; const tx = pl.x < W / 2 ? W - 80 : 80; this.facing = Math.sign(tx - this.x) || 1; this.x = U.approach(this.x, tx, 170 * dt); if (Math.abs(this.x - tx) < 4 || this.t > 1.6) this.set('idle'); }
    else if (S === 'prejump') { if (this.t > 0.3) { const onT = this.y < V4.GY - 1; const tx = onT ? (pl.x < W / 2 ? W - 90 : 90) : (this.table.x1 + this.table.x2) / 2;
        this.air = true; this.vy = -400; this.vx = (tx - this.x) / 0.85; this.set('jump'); this.jumpShot = !onT; } }
    else if (S === 'jump') { this.anim = 'jump'; if (this.jumpShot && this.t > 0.3 && this.ammo > 0) { this.jumpShot = false; this.face(pl); this.fire(run, false); } }
    else if (S === 'land') { this.anim = 'land'; if (this.t > 0.55) this.set('idle'); }
    else if (S === 'punch' || S === 'kick') { this.face(pl);
      if (!this.hitDone && this.t > 0.22) { this.hitDone = true; if (Math.abs(pl.x - this.x) < 60 && Math.abs(pl.y - this.y) < 40) { pl.hurt(S === 'kick' ? 14 : 10, this.x, run.world); G.shake(3, 0.12); } Sound.play('swing'); }
      if (this.t > 0.5) { this.hitDone = false; this.set('idle'); } }
    else if (S === 'grenade') { if (this.t > 0.35 && !this.thrown) { this.thrown = true; this.face(pl); const T = 0.9; this.nades.push({ x: this.x + this.facing * 20, y: this.y - 60, vx: (pl.x - this.x) / T, vy: -330, t: 0 }); G.say(this, 'Граната с карри! Острая!', 1.2); }
      if (this.t > 0.7) { this.thrown = false; this.set('idle'); } }
    else if (S === 'reload') { if (this.t > 2.4) { this.ammo = 6; this.set('idle'); } }
    else if (S === 'eat') { if (this.t > 2.6) { this.hp = Math.min(this.max, this.hp + 2); FX.popText(this.x, this.y - 100, '+ЗДОРОВЬЕ', '#8cf08c'); this.cool = 10; this.set('idle'); } }
    else if (S === 'dodge') { if (this.t > 0.45) this.set(Math.random() < 0.5 ? 'idle' : 'aim'); }
    else if (S === 'hurt') { this.anim = 'hurt'; if (this.t > 0.35) { if (this.combo >= 3) { this.combo = 0; this.set('dizzy'); G.say(this, 'Звёздочки...', 1); } else this.set(this.after || 'idle'); } }
    else if (S === 'dizzy') { if (this.t > 1.6) this.set('idle'); }
    else if (S === 'taunt') { if (this.t > 1.0) this.set('aim'); }
    else if (S === 'ko') { this.anim = 'ko'; }
    // пули
    for (const b of this.bullets) { b.x += b.vx * dt; b.life -= dt; const pb = pl.box; if (!pl.dead && b.x > pb.x && b.x < pb.x + pb.w && b.y > pb.y && b.y < pb.y + pb.h) { b.life = 0; pl.hurt(9, b.x - b.vx * 0.1, run.world); } }
    this.bullets = this.bullets.filter(b => b.life > 0 && b.x > -40 && b.x < W + 40);
    // гранаты карри -> облако
    for (const n of this.nades) { n.t += dt; n.vy += 900 * dt; n.x += n.vx * dt; n.y += n.vy * dt; if (n.y >= V4.GY - 4) { n.done = true; this.smokes.push({ x: n.x, t: 0 }); Sound.play('boom'); G.shake(3, 0.2); } }
    this.nades = this.nades.filter(n => !n.done);
    for (const s of this.smokes) { s.t += dt; if (s.t > 0.4 && s.t < 3.6 && Math.abs(pl.x - s.x) < 56 && !pl.dead) { s.hurtT = (s.hurtT || 0) - dt; if (s.hurtT <= 0) { s.hurtT = 0.5; pl.hurt(5, s.x, run.world); if (Math.random() < 0.5) G.say(pl, U.choice(['Кха-кха! Острое!', 'Глаза! Карри в глаза!', 'Это не дым — это приправа!']), 1); } } }
    this.smokes = this.smokes.filter(s => s.t < 4);
  }
  playerHit(hb, dmg, atk, pl) {
    if (this.state === 'ko' || this.state === 'sit' || this.state === 'wait' || atk.hit.has(this) || !U.overlap(hb, this.box)) return;
    atk.hit.add(this);
    if (!this.vuln) {   // уклонение «Матрица»
      if (this.air) return;
      const prev = this.state; this.set('dodge', Math.random() < 0.4 ? 'block' : 'dodge'); G.hitStop = 0.05;
      if (Math.random() < 0.35) G.say(this, U.choice(['Мимо!', 'Матрица, детка!', 'Слишком медленно!', 'Хе-хе!']), 0.9);
      if (prev === 'punch' || prev === 'kick') this.hitDone = false;
      return;
    }
    this.hp--; this.combo++; Sound.play('hit'); G.hitStop = 0.06; G.shake(3, 0.12); FX.burst(this.x, this.y - 50, 6, { colors: ['#fff', '#ffd84a'], speed: 120, life: 0.3, grav: 0 });
    this.after = this.state === 'reload' ? 'reload' : 'idle';
    if (this.state === 'eat') { G.say(this, 'Моя курица!!!', 1); this.cool = 6; this.after = 'idle'; }
    if (this.state === 'reload') this.t0 = this.t;
    if (this.hp <= 0) { this.hp = 0; this.set('ko'); this.koT = 0; return; }
    const keep = this.state === 'reload' ? Math.max(0, this.t - 0.6) : 0; this.set('hurt'); if (this.after === 'reload') this.afterT = keep;
    this.x += pl.facing * 10;
  }
  draw(c, cx) {
    for (const s of this.smokes) { const k = Math.min(1, s.t / 0.5), fr = s.t < 0.3 ? 2 : s.t < 1 ? 4 : 6; c.globalAlpha = s.t > 3.2 ? Math.max(0, (4 - s.t) / 0.8) : 0.85; Spr.draw(c, 'bfx4', fr, s.x - cx + Math.sin(s.t * 2) * 4, V4.GY + 6, 1, { scale: 0.7 + k * 0.3 }); c.globalAlpha = 1; }
    if (this.state === 'eat') Spr.draw(c, 'bfx4', 14, this.x - cx + this.facing * 16, this.y - 46, this.facing, { scale: 0.35 });
    Spr.drawAnim(c, 'boss4', this.anim, this.animT, this.x - cx, this.y, this.facing);
    if (this.state === 'dizzy' && (G.t * 4 | 0) % 2) G.text('* * *', this.x - cx, this.y - 98, { align: 'center', size: 8, color: '#ffd84a' });
    if (this.flashT > 0) Spr.draw(c, 'bfx4', 11, this.x - cx + this.facing * 44, this.y - (this.low ? 22 : 50), this.facing, { scale: 0.4 });
    for (const b of this.bullets) Spr.draw(c, 'bfx4', 10, b.x - cx, b.y + 5, Math.sign(b.vx), { scale: 0.4 });
    for (const n of this.nades) Spr.draw(c, 'bfx4', 0, n.x - cx, n.y + 10, 1, { scale: 0.45 });
    if (this.state !== 'sit' && this.state !== 'wait') {
      const R = Art.R, bw = 200, bx = W / 2 - bw / 2, by = H - 26;
      R(c, bx - 2, by - 2, bw + 4, 10, '#111'); R(c, bx, by, Math.round(bw * this.hp / this.max), 6, this.vuln ? '#ffd84a' : '#d83020');
      G.text('ГЛАВАРЬ СПЕЦНАЗА' + (this.vuln ? ' — БЕЙ!' : ''), W / 2, by - 12, { align: 'center', size: 8, color: this.vuln ? '#ffd84a' : '#f0d0c0' });
    }
  }
};

// ---------- сцены босса ----------
V4.sceneBossIntro = function (level, run) {
  const b = run.boss, pl = run.player;
  return function* () {
    run.camLock = true; pl.facing = 1; b.set('sit'); b.facing = -1;
    yield 0.6;
    yield* say4('cmdr7', 'Ну здравствуй, Мистер Рэд. Я тебя с первого дня на заводе ищу.', b, 2.6);
    b.set('wait', 'laugh');
    yield* say4('cmdr7', 'Ключ-карта от зала — вот она. Отними, если сможешь!', b, 2.4);
    yield* say4('valera', 'Я стропальщик шестого разряда. Я и тебя застроплю!', pl, 2.2);
    b.set('wait', 'taunt'); yield 0.6;
    G.hint = null;
    b.set('idle'); Music.play('boss');
    run.bossHint = 6;
  };
};
V4.sceneBossWin = function (level, run) {
  const b = run.boss, pl = run.player;
  return function* () {
    run.camLock = true; b.bullets = []; b.nades = []; b.smokes = []; yield 1.0;
    yield* say4('cmdr7', 'Ох... Кто ж знал, что стропальщики... так бьют...', b, 2.4);
    run.cardDrop = { x: b.x + 20, t: 0 }; Sound.play('coin');
    yield* Scene.moveTo(pl, b.x - 10, 90, 'walk');
    run.cardDrop = null; run.flags.card = 1; FX.popText(pl.x, pl.y - 100, 'КЛЮЧ-КАРТА!', '#ffd84a');
    yield* say4('valera', 'Ключ-карта моя. Теперь — в главный зал, на лифте!', pl, 2.2);
    Music.play('stealth');
  };
};

// ---------- ФИНАЛ: главный зал ----------
V4.sceneHall = function (level) {
  const st = L7.stage(level, { bg: L7.fullBG(V4.img.hall) });
  const SY = 262;   // пол сцены (далеко — персонажи мельче)
  const dO = L7.actor(st, 'deniso', 290, 1, { y: SY, z: 1, scale: 0.62 }), dC = L7.actor(st, 'denisch', 352, -1, { y: SY, z: 1, scale: 0.62 });
  dO.setAnim('stand'); dC.setAnim('stand');
  const guests = [];
  const gx = [40, 92, 150, 470, 520, 575, 615];
  gx.forEach((x, i) => { const a = L7.actor(st, 'guest' + (i % 3), x, x < W / 2 ? 1 : -1, { y: 372, z: 3 }); a.setAnim('stand'); guests.push(a); });
  const v = L7.actor(st, 'valera7', 320, -1, { y: 372, z: 4, visible: false }); v.setAnim('stand');
  const troops = [L7.actor(st, 'cmd4', 200, 1, { y: SY + 4, z: 2, visible: false, scale: 0.7 }), L7.actor(st, 'cmd4', 440, -1, { y: SY + 4, z: 2, visible: false, scale: 0.7 })];
  st.dark = 0; st.spot = 0; st.box = 0;
  st.over = c => {
    if (st.dark > 0) { c.fillStyle = `rgba(0,0,0,${st.dark})`; c.fillRect(0, 0, W, H); }
    if (st.spot > 0) {   // прожектор на Валеру (спрайт луча)
      c.save(); c.globalAlpha = st.spot; c.globalCompositeOperation = 'lighter'; Spr.draw(c, 'bfx4', 26, v.x, v.y + 6, 1, { scale: 2.2 }); c.restore(); v.draw(c);
    }
    if (st.box > 0 && L7.img.mrx_box) {   // ложа Господина Икс
      const k = st.box, bw = 150 * k, bh = 168 * k;
      Art.R(c, W - bw - 24, 18, bw + 6, bh + 6, '#0a0a0c'); c.drawImage(L7.img.mrx_box, W - bw - 21, 21, bw, bh);
    }
    for (const d of st.darts || []) Spr.draw(c, 'bfx4', 10, d.x, d.y, d.f, { scale: 0.25 });
  };
  return function* () {
    Music.play('cutscene');
    st.title = 'Главный зал. Элита и гости из Столицы'; st.titleY = 330; st.titleSize = 12;
    yield* Scene.tween(1, k => { st.fade = 1 - k; st.titleK = k; });
    yield 0.6; st.title = null;
    dO.setAnim('talk');
    yield* Scene.say('deniso', 'Дамы и господа! С сегодняшнего дня завод и весь Выборгск переходят под управление Столицы и Господина Икс!', dO);
    dO.setAnim('stand'); dC.setAnim('talk');
    yield* Scene.say('denisch', 'Завод перепрофилируем: научная инженерия и биотехнологии! Новые возможности для населения!', dC);
    dC.setAnim('stand'); dO.setAnim('talk');
    yield* Scene.say('deniso', 'Все деньги города пойдут в Столицу — на улучшение качества жизни... Столицы.', dO);
    dO.setAnim('stand'); dC.setAnim('rub');
    yield* Scene.say('denisch', 'А из жителей Выборгска мы высосем все соки. Во благо науки!', dC);
    dO.setAnim('fist'); dC.setAnim('fist');
    for (const g of guests) g.setAnim('clap'); Sound.play('bell');
    yield* Scene.say('deniso', 'Слава Господину Икс!', dO);
    for (const g of guests) g.setAnim('stand');
    yield* Scene.tween(0.5, k => { st.box = k; });
    yield* Scene.say('mrx', '...А сейчас — сюрприз.', null);
    yield* Scene.tween(0.4, k => { st.box = 1 - k; });
    v.visible = true; Sound.play('lever'); yield* Scene.tween(0.6, k => { st.dark = k * 0.55; st.spot = k; });
    dO.setAnim('point');
    yield* Scene.say('deniso', 'Вот он — Агент Ред, собственной персоной! Мы вас ждали, Валерий.', dO);
    for (const g of guests) { g.setAnim('shock'); g.facing = Math.sign(v.x - g.x) || 1; }
    v.setAnim('shoutFist');
    yield* Scene.say('valera', 'Это мой город! Наши деньги останутся у нас! Вы уже совсем зажрались в своей столице!', v);
    yield* Scene.say('valera', 'Туалетная бумага стала неподъёмных денег — подорожала на три рубля!', v);
    dO.setAnim('scared'); dC.setAnim('scared');
    dO.facing = 1; dC.facing = 1;
    yield* Scene.tween(0.8, k => { dO.x = 290 + k * 140; dC.x = 352 + k * 140; dO.alpha = dC.alpha = 1 - k; dO.setAnim('run'); dC.setAnim('run'); });
    dO.visible = dC.visible = false;
    for (const t of troops) { t.visible = true; t.setAnim('alert'); }
    st.dark = 0.3;
    yield* Scene.say('cmdr7', 'ВЗЯТЬ ЕГО!!!', troops[0]);
    // дротики: гости превращаются в зомби
    Music.play('alarm'); st.darts = [];
    for (let i = 0; i < guests.length; i++) {
      const g = guests[i], t = troops[i % 2]; Sound.play('shot');
      const d = { x: t.x, y: t.y - 40, f: Math.sign(g.x - t.x) || 1 }; st.darts.push(d);
      yield* Scene.tween(0.16, k => { d.x = U.lerp(t.x, g.x, k); d.y = U.lerp(t.y - 40, g.y - 50, k); });
      st.darts = []; FX.burst(g.x, g.y - 50, 6, { colors: ['#8cf08c', '#3a8a3a'], speed: 90, life: 0.4, grav: 0 });
      g.style = 'zomb' + (i % 8); g.setAnim('stand'); g.facing = Math.sign(v.x - g.x) || 1;
      if (i % 3 === 0) G.say(g, U.choice(['Бюдже-е-ет...', 'Мозги-и-и...', 'Откаты-ы-ы...']), 1.2);
    }
    for (const g of guests) g.setAnim('walk');
    st.spot = 0;
    v.setAnim('duckRun'); G.say(v, 'Ну уж нет! Ноги в руки!', 1.2);
    yield* Scene.moveTo(v, -60, 160, 'duckRun');
    st.title = 'КОНЕЦ УРОВНЯ 7'; st.titleY = H / 2; st.titleSize = 24; st.titleK = 0;
    yield* Scene.tween(0.6, k => { st.titleK = k; }); Sound.play('sting'); yield 1.6;
    yield* Scene.tween(0.6, k => { st.fade = k; });
  };
};
