'use strict';
// ============ Ур.7 v4: ЗАВОДОУПРАВЛЕНИЕ v5 — здание в разрезе (карта F) по наброску владельца 3.bmp ============
// Вся графика из Flow (стиль finestyle), сборка tools/l7v5_adm.py:
//   afN.png — полоса этажа (комнаты разной площади, каждая — отдельный кадр Flow; лифтовой холл на каждом этаже — одна шахта);
//   afN_open.png — та же полоса с открытыми дверями запертых комнат (спортзал 46, кабинет директора 13);
//   assets/l7v4/pa/*.png — спрайты (размеры — js/l7v4_adm_props.js): шкаф-укрытие, предметы переднего плана, вода, ключ-карты, спящий на стуле, детали мини-игр.
// Структура (как в наброске): между этажами ездим на ЛИФТЕ (и по лестницам у торцов), на каждом этаже — своя ключ-карта;
// все 4 карты открывают спец-лифт в главный зал. По этажам ходит ГЛАВАРЬ спецназа — его не вырубить, только прятаться.
//   4: клетка A | умывальная | пост охраны (спящий, КРАСНАЯ карта, щиток камер) | фотолаборатория | спортзал | [синяя дверь] лифт | радиоузел | архив (вход через окно)
//   3: клетка A | бойлерная (ВОДОПРОВОД) | медпункт | комната отдыха (спящий) | столовая (двое спина к спине, ЗЕЛЁНАЯ карта) | лифт | бильярдная | клетка B
//   2: клетка C | галерея (лазеры, СИНЯЯ карта) | касса | бухгалтерия (собака) | серверная (охранник, пульт лазеров) | лифт | класс (на доске мелом — КОД СЕЙФА) | клетка B
//   1: клетка C | приёмная | музей | гардероб | [красная дверь] кабинет директора (сейф: код -> ЗОЛОТАЯ карта -> ГЛАВАРЬ, бой) [красная дверь] | лифт | вахта (спящий) | холл спец-лифта в зал
// Порядок: синяя (эт.2) -> синяя дверь (эт.4) -> красная (эт.4) -> по лестнице A в бойлерную -> потоп -> зелёная (эт.3) -> код на доске в классе (эт.2) -> красная дверь (эт.1) -> сейф -> золотая -> бой с главарём -> спец-лифт.
(function () {
  const V4 = G.V4, W = 640, H = 360;
  const load0 = V4.load;
  V4.load = async function () {
    await load0();
    const f = { mgp: 'mgp.jpg', mgk: 'mgk.jpg', mgs: 'mgs.jpg', hall: 'afhall.jpg', liftp: 'liftp.jpg', aboss: 'aboss.jpg' };   // hall — фон финального зала (старый ключ был затёрт фоном цеха)
    for (let i = 1; i <= 4; i++) { f['af' + i] = 'af' + i + '.png'; f['liftd' + i] = 'liftd' + i + '.png'; f['liftc' + i] = 'liftc' + i + '.png'; } f.af1o = 'af1_open.png'; f.af4o = 'af4_open.png';
    for (const n in (window.V4_APROPS || {})) f['pa_' + n] = 'pa/' + n + '.png';
    await Promise.all(Object.entries(f).map(async ([k, n]) => { try { V4.img[k] = await G.loadImage('assets/l7v4/' + n); } catch (e) {} }));
  };
  // главаря не вырубить со спины
  const td0 = V4.Run.prototype.tryTakedown;
  V4.Run.prototype.tryTakedown = function (pl) { const gs = this.guards, ch = gs.find(g => g.chief);
    if (ch && Math.abs(pl.x - ch.x) < 58 && Math.abs(pl.y - ch.y) < 44) { if (!(this.chiefSayT > 0)) { this.chiefSayT = 3; G.say(pl, 'Этого не вырубить. Бронежилет до ушей. Прятаться!', 1.8); } return false; }
    this.guards = gs.filter(g => !g.chief && !g.noKO); try { return td0.call(this, pl); } finally { const rest = this.guards; this.guards = gs.filter(g => g.chief || g.noKO || rest.includes(g)); } };

  const CARDS = [['b', 'СИНЯЯ', '#58b8ff'], ['r', 'КРАСНАЯ', '#ff5a48'], ['g', 'ЗЕЛЁНАЯ', '#58e078'], ['y', 'ЗОЛОТАЯ', '#ffd84a']];
  V4.MAPS.F = function (run) {
    const G0 = V4.GY, PITCH = 190, TOP = 176, LOWB = 14, NF = 4, T = [0, 1, 2, 3].map(i => G0 - i * PITCH), I = () => V4.img, PS = window.V4_APROPS || {}, PC = window.V4_PROPS || {};
    const LAY = window.V4_LAYF, ROW = LAY.rows, SEG = LAY.segs;
    const cell = n => { for (let f = 0; f < NF; f++) { const i = SEG[f].indexOf(n); if (i >= 0) return { f, q: ROW[f][i] }; } };
    const X = (n, k) => { const c = cell(n); return c.q[0] + (k || 0) * c.q[1]; }, Y = n => T[cell(n).f], CEIL = n => Y(n) - TOP + cell(n).q[3];   // x в комнате n (доля ширины), её пол и потолок
    const D = { w: LAY.w, X, T, vertical: true, topY: Math.round(T[NF - 1] - TOP - 4), dark: 0.03, suspK: 0.85, minX: 16, maxX: LAY.w - 16 };
    const floorOf = y => { for (let i = NF - 1; i > 0; i--) if (y < T[i] + 6) return i; return 0; };
    const has = (r, c) => !!r.flags['card_' + c], ncards = r => CARDS.filter(c => has(r, c[0])).length;
    // ---------- лестницы: высота ступени под ногой — по профилю красной дорожки кадра (LAY.wells) ----------
    const SW = LAY.wellw || 212, ST = [];
    for (let f = 0; f < NF - 1; f++) SEG[f].forEach((s, i) => { if (typeof s === 'string' && s[1] === '0') ST.push({ f, k: s[0], x0: ROW[f][i][0], dir: LAY.flip[s[0]] ? -1 : 1, P: LAY.wells[s[0]] }); });
    const SX = (s, lx) => s.dir > 0 ? s.x0 + lx : s.x0 + SW - lx, LXof = (s, x) => s.dir > 0 ? x - s.x0 : s.x0 + SW - x;
    // путь по лестнице — ломаная из опорных точек кадра: подножие -> верх нижнего марша (передний край площадки) -> начало верхнего марша (задний край площадки) -> верхний этаж.
    // WFIX — поправки критика по кадрам клеток: глубина площадки и точные концы маршей (лог. px)
    const WFIX = { A: { u0: 125, dB: 14 }, B: { u0: 126, dB: 6 }, C: { ltop: 129, dF: -10 } };
    const WP = s => { const P = s.P, q = WFIX[s.k] || {}; return { foot: P.foot, ltop: q.ltop || P.ltop, u0: q.u0 || P.u0, utop: P.utop, hF: P.land + (q.dF || 0), hB: P.land + (q.dB || 0) }; };
    const FOOT = s => s.P.foot - 8, TOPX = s => s.P.utop - 8;
    const climb = (r, s, up) => { const pl = r.player, w = WP(s), y0 = T[s.f], pt = (lx, h) => ({ x: SX(s, lx), y: y0 - h });
      const path = [pt(FOOT(s), 0), pt(w.foot, 0), pt(w.ltop, w.hF), pt(w.u0, w.hB), pt(w.utop, 190), pt(TOPX(s), 190)];
      pl.crouch = false; pl.auto = { i: 0, sp: 60, stair: s, up, path: up ? path : path.reverse(), done: () => { pl.setAnim('stand'); pl.y = up ? T[s.f + 1] : T[s.f]; } }; };
    D.voidAt = (x, y) => ST.some(s => { const lx = LXof(s, x); return lx > 0 && lx < SW && ((Math.abs(y - T[s.f + 1]) < 8 && lx > s.P.utop - 4) || (Math.abs(y - T[s.f]) < 8 && lx > FOOT(s) + 6) || (y < T[s.f] - 8 && y > T[s.f + 1] + 8)); });
    D.plats = [1, 2, 3].map(i => ({ x: 0, y: T[i], w: LAY.w, h: 20, oneway: false }));
    // ---------- ключевые точки ----------
    const LOB = [11, 21, 31, 41], LX = LAY.xc, START = X(44, 0.42), SWB = X(43, 0.19), PIPEP = X(32, 0.5), VALVE = X(33, 0.7), BOARD = X(26, 0.49), RADIO = X(48, 0.3), LPAN = X(24, 0.5), LZ = [X(22, 0.08), X(22, 0.62), X(22, 0.93)], SAFE = X(13, 0.86), HLIFT = X(14, 0.77);
    const DOORS = [{ id: 'b', f: 3, x: X(41, 0), from: 1 }, { id: 'r', f: 0, x: X(13, 1), from: 1 }, { id: 'r', f: 0, x: X(13, 0), from: -1 }];   // запертые двери: карта, этаж, x стены, с какой стороны подходим
    const SLEEP = [[X(43, 0.62), 3], [X(34, 0.74), 2], [X(16, 0.62), 0]];
    D.LX = LX; D.KEY = { WIN: X(44, 0.5), LOCKER: X(43, 0.335), SWB, PIPEP, VALVE, BOARD, RADIO, LPAN, SAFE, HLIFT, START };
    // ---------- предметы переднего плана (стоят на полу, за ними прячутся): [имя, x, этаж] ----------
    const PR = [['boxes', X(44, 0.22), 3], ['trolley', X(46, 0.5), 3], ['luggage', X(43, 0.92), 3], ['cooler', X(47, 0.85), 3], ['armchair', X(48, 0.78), 3], ['boxes', X(43, 0.5), 3], ['ficus', X(42, 0.5), 3],
      ['cooler', X(33, 0.1), 2], ['armchair', X(34, 0.14), 2], ['ficus', LX - 44, 2], ['luggage', X(35, 0.2), 2], ['boxes', X(36, 0.12), 2], ['globe', X(36, 0.9), 2], ['trolley', X(33, 0.42), 2], ['armchair', X(35, 0.75), 2], ['anchor', X(32, 0.85), 2],
      ['boxes', X(23, 0.9), 1], ['ficus', X(23, 0.3), 1], ['luggage', X(24, 0.12), 1], ['anchor', X(21, 0.12), 1], ['trolley', X(25, 0.85), 1], ['globe', X(26, 0.3), 1], ['boxes', X(23, 0.5), 1], ['cooler', X(24, 0.85), 1],
      ['anchor', X(12, 0.1), 0], ['trolley', X(12, 0.92), 0], ['globe', X(13, 0.12), 0], ['armchair', X(13, 0.45), 0], ['luggage', X(14, 0.14), 0], ['boxes', LX + 46, 0], ['anchor', X(17, 0.86), 0], ['ficus', X(16, 0.9), 0], ['cooler', X(15, 0.85), 0], ['ficus', X(17, 0.2), 0], ['boxes', X(12, 0.5), 0]].map(([n, x, f]) => ({ n, x, f, w: (PS[n] || [40, 40])[0], h: (PS[n] || [40, 40])[1] }));
    const BACK = 12, FRONT = 12, FSC = 1.1, pimg = n => I()['pa_' + n];
    const drawProp = (c, cx, p) => { const im = pimg(p.n); if (!im) return; const w = p.w * FSC, h = p.h * FSC, base = T[p.f] + FRONT, x = p.x - cx; if (x + w < -20 || x - w > W + 20) return;
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x, base - 1, w * 0.52, 3.5, 0, 0, 6.3); c.fill(); c.drawImage(im, Math.round(x - w / 2), base - h, w, h); };
    // ---------- укрытия ----------
    D.hides = [{ x: X(15, 0.36), y: T[0], f: 0, a3: 'pic', fr: 0, label: 'в шубы' }];   // шкафов-укрытий на уровне нет (слишком громоздкие) — только шубы в гардеробе
    const drawHide = (c, cx, h) => { if (h.a3 !== 'cab') return; const im = pimg('acab' + h.fr), s = PS['acab' + h.fr]; if (im && s) c.drawImage(im, Math.round(h.x - (h.fr === 2 ? s[0] / 2 : PS.acab0[0] / 2) - cx), T[h.f] - BACK - s[1], s[0], s[1]); };
    // ---------- ключ-карты, награды, пасхалки (собранное не возвращается после поимки) ----------
    const got = r => r.level.got || (r.level.got = new Set());
    const KC = [{ c: 'b', x: X(22, 0.3), f: 1 }, { c: 'g', x: VALVE, f: 2 }];   // красная — в шкафчике охраны (отмычка), золотая — в сейфе (код)
    const LOCKER = X(43, 0.335);
    D.KC = KC;
    const COLL = [
      { id: 'ab1', n: 'badge', x: X(43, 0.8), f: 3 }, { id: 'ab2', n: 'badge', x: X(42, 0.3), f: 3 }, { id: 'ab3', n: 'badge', x: X(15, 0.36), f: 0, hid: 0 }, { id: 'ab4', n: 'badge', x: X(17, 0.2), f: 0 },
      { id: 'akef', n: 'kefir', x: X(33, 0.4), f: 2, say: 'Кефир из буфета начальства. Жирность — как у их премий.' }, { id: 'acan', n: 'can', x: X(12, 0.78), f: 0, say: 'Тушёнка в приёмной. Взятка натурой.' },
      { id: 'aroll', n: 'roll', x: X(42, 0.72), f: 3, say: 'Туалетка за три рубля! И здесь она. Улика номер два.' },
      { id: 'amed', n: 'kefir', x: X(35, 0.45), f: 2, say: 'Кефир в медпункте. Лечит всё, кроме начальства.' }, { id: 'acan2', n: 'can', x: X(36, 0.7), f: 2, say: 'Тушёнка на бильярде. Играли на интерес.' },
    ];
    const take = (r, p) => { const pl = r.player, st = r.level.stats; got(r).add(p.id); Sound.play('coin');
      if (p.n === 'badge') { st.secrets++; r.world.addScore(1000); FX.popText(p.x, T[p.f] - 70, 'ЗНАЧОК «УДАРНИК» +1000', '#ffd84a'); }
      else if (p.n === 'roll') { st.eggs = (st.eggs || 0) + 1; r.world.addScore(500); FX.popText(p.x, T[p.f] - 70, 'ПАСХАЛКА +500', '#ffd84a'); G.say(pl, p.say, 2); }
      else { pl.heal(30); st.food++; G.say(pl, p.say, 1.8); } };
    const save = r => { r.cp = { id: 'F', x: START, face: -1 }; r.saved = { flags: Object.assign({}, r.flags, { fAt: 3 }), ko: new Set(r.ko) }; };   // прогресс сохраняется, но после поимки Валера снова начинает у окна архива (эт.4)
    const giveCard = (r, c, x, y) => { const q = CARDS.find(q => q[0] === c); r.flags['card_' + c] = 1; save(r); Sound.play('coin'); r.world.addScore(500); FX.popText(x, y - 80, q[1] + ' КАРТА  ' + ncards(r) + '/4', q[2]);
      if (!r.flags.chief) { r.flags.chief = 1; save(r); r.level.playOnMap(function* () { yield 0.5; Sound.play('warn'); G.say({ x: r.player.x, y: r.player.y - 150, headH: 0, voice: 120 }, 'РАЦИЯ: «Говорит Главный. В здании посторонний. Иду искать лично.»', 3.4, { shout: true }); yield 2.6; G.say(r.player, 'Главарь спецназа... Этого со спины не возьмёшь. Услышу шаги — прячусь.', 3.2); yield 1.6; }); } };
    const egg = (id, x, f, txt) => ({ x, y: T[f], r: 14, label: 'осмотреть', quiet: true, act: r => { if (!got(r).has(id)) { got(r).add(id); r.level.stats.eggs = (r.level.stats.eggs || 0) + 1; r.world.addScore(200); FX.popText(x, T[f] - 96, 'ПАСХАЛКА +200', '#ffd84a'); Sound.play('coin'); } G.say(r.player, txt, 2.8); } });
    const EGGS = [egg('asam', X(33, 0.2), 2, 'Самовар. Пока цех мёрзнет — тут чаи гоняют.'), egg('atv', X(34, 0.62), 2, 'По телевизору — помехи. Как и в отчётах заводоуправления.'),
      egg('aabac', X(23, 0.62), 1, 'Счёты. На них и насчитали туалетку по три рубля.'), egg('aship', X(13, 0.6), 0, 'Модель корабля. Единственное, что тут достроили в срок.'), egg('agym', X(46, 0.72), 3, 'Спортзал начальства. Качают тут в основном бюджет.'),
      egg('aphoto', X(47, 0.45), 3, 'Фотолаборатория. Проявляют компромат. В основном — друг на друга.'), egg('aeye', X(35, 0.22), 2, 'Таблица для зрения. Нижняя строка: «премии не будет».'), egg('abill', X(36, 0.5), 2, 'Бильярд. Шары катают — как и рабочих.'),
      egg('akassa', X(25, 0.5), 1, 'Касса. Окошко закрыто. Как всегда в день зарплаты.'), egg('amus', X(17, 0.5), 0, 'Музей трудовой славы. Слава есть, труда не видно.'), egg('akeys', X(16, 0.36), 0, 'Доска с ключами. От всего, кроме совести.')];
    const alive = (r, f, x0 = 0, x1 = 9999) => r.guards.some(g => !g.chief && g.alive && g.state !== 'stagger' && g.state !== 'sleep' && Math.abs(g.y - T[f]) < 5 && g.x > x0 && g.x < x1);
    // ---------- враги ----------
    D.guards = [
      { x: SLEEP[0][0], y: T[3], kind: 'sleep', facing: -1, range: 110, x1: SLEEP[0][0], x2: SLEEP[0][0] },                       // 4: спит на стуле у мониторов
      { x: X(46, 0.5), y: T[3], x1: X(47, 0.25), x2: X(46, 0.86), facing: 1, range: 115, sp: 30 },                         // 4: фотолаборатория — спортзал
      { x: SLEEP[1][0], y: T[2], kind: 'sleep', facing: -1, range: 110, x1: SLEEP[1][0], x2: SLEEP[1][0] },                       // 3: спит перед телевизором
      { x: SLEEP[2][0], y: T[0], kind: 'sleep', facing: -1, range: 100, x1: SLEEP[2][0], x2: SLEEP[2][0] },                       // 1: вахтёр спит на вахте
      { x: X(36, 0.5), y: T[2], x1: X(36, 0.16), x2: X(36, 0.84), facing: 1, range: 110, sp: 28 },                          // 3: бильярдная
      { x: X(26, 0.7), y: T[1], x1: X(26, 0.2), x2: X(26, 0.82), facing: -1, range: 110, sp: 26 },                         // 2: класс с доской
      { x: VALVE - 13, y: T[2], kind: 'post', facing: -1, range: 150, x1: VALVE - 13, x2: VALVE - 13 },                    // 3: двое спина к спине под трубой — не подойти ни с какой стороны
      { x: VALVE + 13, y: T[2], kind: 'post', facing: 1, range: 150, x1: VALVE + 13, x2: VALVE + 13 },
      { x: X(24, 0.4), y: T[1], x1: X(23, 0.66), x2: X(24, 0.86), facing: -1, range: 120, sp: 34 },                       // 2: серверная — бухгалтерия
      { x: X(13, 0.5), y: T[0], x1: X(13, 0.2), x2: X(13, 0.72), facing: 1, range: 115, sp: 30 },                         // 1: в запертом кабинете директора
      { x: X(12, 0.5), y: T[0], x1: X(12, 0.2), x2: X(17, 0.8), facing: 1, range: 115, sp: 32 },                          // 1: приёмная — музей
    ];
    D.dogs = [{ x: X(23, 0.3), y: T[1], x1: X(23, 0.08), x2: X(23, 0.56), range: 100, facing: -1 }, { x: X(14, 0.5), y: T[0], x1: X(14, 0.22), x2: X(14, 0.8), range: 90, facing: 1 }];
    const cam = (n, k, o) => Object.assign({ x: X(n, k), y: CEIL(n) + 12, floorY: Y(n), a0: 1.0, a1: 2.15, per: 6, range: 160, half: 0.2, group: 'camsOff' }, o);
    D.cams = [cam(42, 0.5, { per: 5, range: 140 }), cam(34, 0.3), cam(25, 0.5, { per: 7 }), cam(15, 0.5), cam(14, 0.45, { per: 5 }), cam(35, 0.5, { per: 8, range: 140 })];
    D.lasers = LZ.map(x => ({ x, y0: CEIL(22), y1: T[1] + 6, group: 'lasersOff', v5: 1 }));
    const glow = (c, x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
    const COLRGB = { b: '70,170,255', r: '255,70,50', g: '70,255,110', y: '255,210,70' };
    const strip = (r, n) => (n === 0 && r.flags.door_r && I().af1o) || (n === 3 && r.flags.door_b && I().af4o) || I()['af' + (n + 1)];
    D.bgFn = (c, cx, r) => {
      const Im = I();
      for (let n = 0; n < NF; n++) { const im = strip(r, n); if (im) c.drawImage(im, -cx, T[n] - TOP, LAY.w, PITCH); }
      c.fillStyle = '#05070a'; c.fillRect(0, T[0] + LOWB, W, 80); { const im = Im.af1, sx = 440, sw = 560; if (im) for (let k = 0; k < 4; k++) for (let x = -(cx % (sw / 2)); x < W; x += sw / 2) c.drawImage(im, sx, 2, sw, 24, x, T[0] + LOWB + k * 12, sw / 2, 12); }   // цоколь: тот же бетон, что в перекрытиях
      for (const h of D.hides) drawHide(c, cx, h);
      for (const p of COLL) if (!got(r).has(p.id) && p.hid == null) { const im = Im['pr_' + p.n], z = PC[p.n]; if (im && z) { const y = T[p.f] - 6 + Math.sin(G.t * 3 + p.x) * 1.5; c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(p.x - cx, T[p.f] - 5, z[0] * 0.5, 2.5, 0, 0, 6.3); c.fill(); c.drawImage(im, Math.round(p.x - z[0] / 2 - cx), y - z[1], z[0], z[1]); } }
      for (const k of KC) if (!has(r, k.c)) { const im = Im['pa_card_' + k.c], z = PS['card_' + k.c]; if (im && z) { const y = T[k.f] - 34 + Math.sin(G.t * 3 + k.x) * 2; c.drawImage(im, Math.round(k.x - z[0] / 2 - cx), y - z[1], z[0], z[1]); } }
      { const lf = r.lift; if (lf && lf.ph !== 3) { const f = lf.ph < 3 ? lf.from : lf.to, q = LAY.lift[f], Im2 = I(), cab = Im2['liftc' + (f + 1)], dr = Im2['liftd' + (f + 1)], x = q[0] - cx, y = T[f] - TOP + q[1], w = q[2], h = q[3], k = lf.k, pl = r.player;   // лифт: кабина, Валера в кабине, раздвижные створки
        if (cab) c.drawImage(cab, x, y, w, h); else { c.fillStyle = '#2a1a10'; c.fillRect(x, y, w, h); }
        if (lf.pk != null && r.hidePlayer) { const sc = 1 - 0.2 * lf.pk, px = pl.x - cx, py = T[f]; c.save(); c.translate(px, py - lf.pk * (TOP - q[1] - q[3] + 1)); c.scale(sc, sc); c.translate(-px, -py); pl.draw(c, cx, 0); c.restore(); }
        if (dr) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); const dw = dr.width / 2; c.drawImage(dr, 0, 0, dw, dr.height, x - k * w / 2, y, w / 2, h); c.drawImage(dr, dw, 0, dw, dr.height, x + w / 2 + k * w / 2, y, w / 2, h); c.restore(); } } }
      for (const g of r.guards) if (g.chair && g.state !== 'sleep') { const im = Im.pa_chair, z = PS.chair; if (im && z) c.drawImage(im, Math.round(g.home - z[0] / 2 - cx + 4), g.y - z[1] + 1, z[0], z[1]); }
      for (const x of (r.flags.chairs || [])) { const im = Im.pa_chair, z = PS.chair; if (im && z && !r.guards.some(g => g.chair && Math.abs(g.home - x[0]) < 2)) c.drawImage(im, Math.round(x[0] - z[0] / 2 - cx + 4), T[x[1]] - z[1] + 1, z[0], z[1]); }
      c.save(); c.globalCompositeOperation = 'lighter';   // живой свет: карты, телевизор, мониторы, пульт лазеров, замки дверей, лифты
      const p = 0.5 + 0.5 * Math.sin(G.t * 2.2), tv = 0.5 + 0.5 * Math.sin(G.t * 31) * Math.sin(G.t * 7.3);
      for (const k of KC) if (!has(r, k.c)) glow(c, k.x - cx, T[k.f] - 40, 20, COLRGB[k.c], 0.25 + 0.2 * p);
      glow(c, X(34, 0.62) - cx, T[2] - 48, 46, '170,200,230', 0.05 + 0.08 * tv); glow(c, X(43, 0.6) - cx, T[3] - 70, 60, '120,220,230', 0.05 + 0.04 * p);
      if (!r.flags.lasersOff) glow(c, LPAN - cx, T[1] - 62, 34, '255,40,30', 0.10 + 0.14 * (0.5 + 0.5 * Math.sin(G.t * 5))); else glow(c, LPAN - cx, T[1] - 62, 28, '60,255,90', 0.14);
      for (const d of DOORS) glow(c, d.x - d.from * 9 - cx, T[d.f] - 52, 9, r.flags['door_' + d.id] ? COLRGB.g : COLRGB[d.id], 0.55 + 0.3 * p);
      glow(c, HLIFT + 24 - cx, T[0] - 50, 12, ncards(r) >= 4 ? COLRGB.g : COLRGB.r, 0.3 + 0.2 * p);
      c.restore();
    };
    D.drawMid = (c, cx, r) => { for (const q of (D.runners || [])) Spr.drawAnim(c, 'cmd4', 'run', q.t, q.x - cx, T[2], q.dir, { alpha: q.a }); };
    D.drawFront = (c, cx, r) => {
      const cy = r.camY || 0, pl = r.player, col = I().pr_wall, z = PC.wall, Im = I();
      if (r.flags.flood) {   // прорванная труба над столовой: струя (2 кадра), брызги, лужа
        const k = Math.min(1, (r.floodT || 0) / 0.5), fr = (G.t * 9 | 0) % 2, im = Im['pa_jet' + fr], s = PS['jet' + fr], top = CEIL(33) + 4, hh = (T[2] + 6 - top) * k;
        const pd = Im.pa_puddle, ps = PS.puddle; if (pd && ps) { const w = ps[0] * 2.2 * k; c.globalAlpha = 0.85; c.drawImage(pd, VALVE - w / 2 - cx, T[2] + 2 - ps[1] * 0.5, w, ps[1] * 1.2); c.globalAlpha = 1; }
        if (im && s && hh > 4) { const s0 = im.height * 0.145, w = s[0] * (T[2] + 6 - top) / (s[1] * 0.855); c.globalAlpha = 0.92; c.drawImage(im, 0, s0, im.width, (im.height - s0) * k, Math.round(VALVE - w / 2 - cx), top, w, hh); c.globalAlpha = 1; }
      }
      for (let n = 0; n < NF; n++) { const im = strip(r, n); if (im) for (const [x, w] of (LAY.occ[n] || [])) c.drawImage(im, x * 2, 0, w * 2, im.height, x - cx, T[n] - TOP, w, PITCH); }   // простенки у проёмов — поверх персонажей
      if (col && z) for (let n = 0; n < NF; n++) for (let m = 1; m < ROW[n].length; m++) { const q = ROW[n][m - 1], x = q[0] + q[1]; c.drawImage(col, Math.round(x - z[0] / 2 - cx), T[n] - TOP, z[0], z[1]); }   // тонкие бетонные стены-перегородки в разрезе
      for (const p of PR) drawProp(c, cx, p);
      c.save(); c.globalCompositeOperation = 'lighter'; for (const d of DOORS) { const k = 0.6 + 0.3 * Math.sin(G.t * 4), col = r.flags['door_' + d.id] ? COLRGB.g : COLRGB[d.id]; glow(c, d.x + d.from * 5 - cx, T[d.f] - 50, 16, col, k); glow(c, d.x + d.from * 5 - cx, T[d.f] - 50, 5, col, 1); } c.restore();
      c.save(); c.translate(0, cy);
      if (r.storm.flash > 0.05) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(120,130,190,${0.05 * r.storm.flash})`; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
      if (!r.level.scene) for (const e of [...r.guards, ...r.dogs]) { if (e.alive === false || e.state === 'stagger' || e.state === 'sleep' || Math.abs(e.y - pl.y) > 40) continue; const ex = e.x - cx; if ((ex > -8 && ex < W + 8) || Math.abs(e.x - pl.x) > (e.chief ? 760 : 560)) continue;
        const x = ex < 0 ? 16 : W - 16, y = e.y - cy - 60 + Math.sin(G.t * 8) * 2, big = e.chief ? 1.5 : 1; c.fillStyle = e.chief ? '#ff9a18' : '#e02818'; c.beginPath(); c.moveTo(x, y - 11 * big); c.lineTo(x + 11 * big, y + 8 * big); c.lineTo(x - 11 * big, y + 8 * big); c.closePath(); c.fill(); G.text('!', x, y - 5, { align: 'center', size: 8, color: '#fff' }); }
      // ключ-карты: 4 гнезда в углу экрана
      for (let i = 0; i < 4; i++) { const q = CARDS[i], im = Im['pa_card_' + q[0]], x = W - 92 + i * 21, y = 30; c.fillStyle = 'rgba(8,10,14,0.7)'; c.fillRect(x - 1, y - 1, 19, 15); c.strokeStyle = has(r, q[0]) ? q[2] : 'rgba(255,255,255,0.22)'; c.lineWidth = 1; c.strokeRect(x - 0.5, y - 0.5, 18, 14);
        if (im) { c.globalAlpha = has(r, q[0]) ? 1 : 0.16; c.drawImage(im, x + 1, y + 1, 16, 12); c.globalAlpha = 1; } }
      c.restore();
    };
    // ---------- главарь спецназа: обходит этажи, приезжает на лифте; его не вырубить — прятаться ----------
    const WESTF = (r, f) => f === 3 && !r.flags.door_b ? X(41, 0) + 22 : f === 0 && !r.flags.door_r ? X(13, 1) + 22 : 236, EAST = f => f === 0 ? X(14, 1) - 28 : f === 3 ? X(44, 1) - 28 : X(f === 1 ? 26 : 36, 1) - 12;
    const chiefUpd = function (dt, r) {
      const pl = r.player, pf = floorOf(pl.y); this.animT += dt; if (this.mark > 0) this.mark -= dt;
      if (this.state === 'catch' || this.mode === 'scene') return;
      if (this.mode === 'ride') {   // в лифте: едет на следующий этаж (чаще — туда, где Валера)
        this.y = -5000; this.rideT -= dt;
        if (this.rideT <= 0) { let f = Math.random() < 0.8 ? pf : U.randi(0, 3); if (f === this.lastF && Math.random() < 0.7) f = (f + 1 + U.randi(0, 2)) % 4; if (this.forceF != null) { f = this.forceF; this.forceF = null; }
          if ((pf === f && Math.abs(pl.x - LX) < 250 && !(pl.seq && pl.seq.phase === 'hid')) || r.lift) { this.rideT = 1.5; return; }   // не выходит из лифта прямо на Валеру
          this.f = this.lastF = f; this.x = LX; this.y = T[f]; this.mode = 'out'; this.t = 0.7; this.facing = pl.x < LX ? -1 : 1; this.legs = [Math.random() < 0.5 ? -1 : 1]; this.legs.push(-this.legs[0]); this.anim = 'stand';
          if (pf === f) { Sound.play('bell'); G.say(this, U.choice(['Этаж ' + (f + 1) + '. Проверим.', 'Я знаю, что ты здесь, стропальщик.', 'Выходи. Всё равно найду.', 'Посторонний, я иду.']), 1.8); } }
        return;
      }
      if (this.mode === 'out') { this.t -= dt; this.anim = 'stand'; if (this.t <= 0) { this.mode = 'sweep'; this.facing = this.legs[0]; } return; }
      if (this.mode === 'look') { this.t -= dt; this.anim = this.t > 0.9 ? 'stand' : 'point'; if (this.t <= 0) { if (this.legs.length) { this.mode = 'sweep'; this.facing = this.legs[0]; } else { this.mode = 'back'; this.facing = Math.sign(LX - this.x) || 1; } } return; }
      const tx = this.mode === 'sweep' ? (this.legs[0] < 0 ? WESTF(r, this.f) : EAST(this.f)) : LX;
      this.anim = 'walk'; this.facing = Math.sign(tx - this.x) || this.facing; this.x = U.approach(this.x, tx, this.sp * dt);
      if (pf === this.f) { this.stepT -= dt; if (this.stepT <= 0) { this.stepT = 0.3; const d = Math.abs(pl.x - this.x); if (d < 520) { Sound.play('land'); if (d < 300) G.shake(0.6, 0.06); } } }
      if (Math.abs(this.x - tx) < 2) { if (this.mode === 'sweep') { this.legs.shift(); this.mode = 'look'; this.t = 0.8; } else { this.mode = 'ride'; this.rideT = U.rand(1.4, 2.6); if (pf === this.f) Sound.play('door'); } }
    };
    const BSC = 169 / 177, chiefDraw = function (c, cx, cy) { if (this.y < -1000) return; Spr.drawAnim(c, 'boss4', this.anim, this.animT, this.x - cx, this.y - cy, this.facing, { scale: BSC });   // ростом как рядовые (кадры boss4 выше кадров cmd4)
      if (this.see > 0.05 || this.mark > 0) G.text(this.see > 0.6 ? '!' : '?', this.x - cx, this.y - cy - 100, { align: 'center', size: 16, color: this.see > 0.6 ? '#ff4030' : '#ffd84a', outline: true }); };
    const addChief = r => { if (r.guards.some(g => g.chief)) return; const g = new L7.Guard({ x: LX, y: -5000, range: 190, sp: 98 });
      Object.assign(g, { chief: true, id: 'chief', cmd4: true, mode: 'ride', rideT: 3, stepT: 0, lastF: -1, headH: 92, voice: 110, update: chiefUpd, draw: chiefDraw, hear: () => {}, ko: () => {}, sees: function (run, pl) { return this.mode === 'out' || this.mode === 'ride' || this.mode === 'scene' || run.lift ? 0 : L7.Guard.prototype.sees.call(this, run, pl); } });
      r.guards.push(g); };
    D.addChief = addChief;
    const sleepDraw = function (c, cx, cy) { const Im = I();
      if (this.state === 'sleep') { const fr = (G.t * 0.5 + this.home) % 1 < 0.5 ? 0 : 1, im = Im['pa_sleep' + fr], z = PS['sleep' + fr]; if (im && z) c.drawImage(im, Math.round(this.x - z[0] / 2 - cx), this.y - cy - z[1] + 1, z[0], z[1]); return; }
      V4.drawGuard.call(this, c, cx, cy); };
    D.update = (dt, r) => {
      const pl = r.player, f = floorOf(pl.y), a = pl.auto;
      r.storm.update(dt, false); if (r.stairT > 0) r.stairT -= dt; if (r.chiefSayT > 0) r.chiefSayT -= dt; if (r.radioT > 0) r.radioT -= dt; if (r.flags.flood) r.floodT = (r.floodT || 0) + dt; liftUpd(dt, r);
      if (r.flags.chief && !r.flags.bossDone && !r.level.scene) addChief(r);
      if (!r.level.scene && !r.caught) {
        for (const p of COLL) if (!got(r).has(p.id) && (p.hid != null ? pl.seq && pl.seq.phase === 'hid' && pl.seq.h === r.hides[p.hid] : Math.abs(pl.x - p.x) < 18 && Math.abs(pl.y - T[p.f]) < 8)) take(r, p);
        for (const k of KC) if (!has(r, k.c) && Math.abs(pl.x - k.x) < 16 && Math.abs(pl.y - T[k.f]) < 8) giveCard(r, k.c, k.x, T[k.f]);
        if (!r.flags.note && f === 1 && Math.abs(pl.x - BOARD) < 30) { r.flags.note = 1; save(r); Sound.play('coin'); G.say(pl, 'На доске мелом — четыре цифры: 3719. Похоже на чей-то код. Запомню.', 3.2); }
      }
      if (a && a.stair) r.stairT = 4;
      if (a && a.stair) pl.animT -= dt * 0.4;   // шаг на лестнице реже: ноги не проскальзывают
      else if (!r.level.scene) for (const s of ST) {   // шахта: сквозь лестницу не пройти, на верхнем этаже над шахтой пола нет
        const lx = LXof(s, pl.x); let lim = null;
        if (f === s.f && lx > FOOT(s) + 2) lim = FOOT(s) + 2; else if (f === s.f + 1 && lx > s.P.utop - 8) lim = s.P.utop - 8;
        if (lim != null) { pl.x = SX(s, lim); if (pl.vx * s.dir > 0) pl.vx = 0; }
      }
      for (const d of DOORS) if (!r.flags['door_' + d.id] && f === d.f) {   // запертая дверь: не пройти ни с какой стороны
        const px = r.prevX == null ? pl.x : r.prevX, side = Math.sign(px - d.x) || d.from; if ((pl.x - d.x) * side < 9) { pl.x = d.x + side * 9; if (pl.vx * side < 0) pl.vx = 0; } }
      r.prevX = pl.x;
      D.runners = (D.runners || []).filter(q => { q.t += dt; q.x += 150 * dt * q.dir; if (q.t > 1.6) q.a = Math.max(0, q.a - dt * 3); if (Math.random() < dt * 14) FX.burst(q.x - 8 * q.dir, T[2] - 4, 1, { angle: -Math.PI / 2, spread: 1.2, speed: 40, colors: ['#bfe6ff', '#8cc8f0'], grav: 300, life: 0.4, size: 2 }); return q.a > 0; });
      if (r.flags.flood && Math.random() < dt * 20) FX.burst(VALVE + U.rand(-20, 20), T[2] - 2, 1, { angle: -Math.PI / 2, spread: 1.4, speed: 60, colors: ['#dff4ff', '#9fd4f4', '#6fb0e0'], grav: 380, life: 0.45, size: 2 });
      if (!r.caught && pl.onGround && !pl.auto && !r.level.scene && f !== r.flags.fAt) {   // чекпоинт — каждый раз, когда пришли на другой этаж
        r.flags.fAt = f; save(r); FX.popText(pl.x, pl.y - 96, 'ЭТАЖ ' + (f + 1), '#8cf08c');
      }
    };
    D.onLoad = r => {
      const pl = r.player, wd = r.world, first = !r.flags.fIn, fl = r.flags.fAt == null ? 3 : r.flags.fAt;
      if (first) { r.level.stats.secretsTotal = (r.level.stats.secretsTotal || 0) + 3; r.level.stats.eggsTotal = (r.level.stats.eggsTotal || 0) + EGGS.length + 1; }
      for (const p of PR) r.covers.push({ x1: p.x - p.w * 0.45, x2: p.x + p.w * 0.45, y: T[p.f] });
      r.flags.chairs = SLEEP.map(s => [s[0], s[1]]); r.code = '3719'; r.lift = null; r.hidePlayer = false; r.camLock = false;   // код сейфа нарисован мелом на доске в классе (эт.2)
      for (const g of r.guards) if (g.kind === 'sleep') { g.chair = true; g.draw = sleepDraw; } else if (g.kind === 'post') { g.noKO = true; g.stT = 1e9; }   // пост «спина к спине»: не отворачиваются, со спины не взять
      if (r.flags.flood) { r.guards = r.guards.filter(g => !(g.kind === 'post')); r.floodT = 9; }
      r.drawMenu = function (c) { const m = this.menu, im = I().liftp; if (!m.lift || !im) return V4.Run.prototype.drawMenu.call(this, c);   // панель лифта — картинка из Flow, подсвечивается выбранная кнопка
        const k = 300 / im.height, pw = im.width * k, px = (W - pw) / 2, py = 30, BY = [133, 241, 351, 462]; c.fillStyle = 'rgba(0,0,0,0.62)'; c.fillRect(0, 0, W, H); c.drawImage(im, px, py, pw, 300);
        c.save(); c.globalCompositeOperation = 'lighter'; m.items.forEach((it, i) => { const x = px + 400 * k, y = py + BY[i] * k; if (i === m.sel) glow(c, x, y, 44, '255,170,50', 0.32 + 0.14 * Math.sin(G.t * 7)); else if (it.cur) glow(c, x, y, 26, '70,255,110', 0.35); }); c.restore();
        const it = m.items[m.sel]; G.text(it.cur ? 'ЭТАЖ ' + (it.n + 1) + ' — ВЫ ЗДЕСЬ' : 'ЭТАЖ ' + (it.n + 1), W / 2, 12, { align: 'center', size: 8, color: '#ffd84a' }); G.text(Game.fmtHint('{up}/{down}, {jump} — ехать, {throw} — выйти'), W / 2, H - 14, { align: 'center', size: 8, color: '#b8b0a0' }); };
      for (const cam of r.cams) cam.draw = function (c, cx, cy, rr) {
        const x = this.x - cx, y = this.y - cy, mid = (this.a0 + this.a1) / 2, left = Math.cos(mid) < 0, im = V4.img.tw_cam, off = this.group && rr.flags[this.group];
        if (!off) { const g = c.createRadialGradient(x, y, 4, x, y, this.range), col = this.see > 0.05 ? '255,60,40' : '150,255,235';
          g.addColorStop(0, `rgba(${col},0.34)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.arc(x, y, this.range, this.a - this.half, this.a + this.half); c.closePath(); c.fill(); }
        if (im) { const k = 0.2, sw = im.width, hy = 64, px = 66; c.save(); c.translate(x, y - 6); if (left) c.scale(-1, 1); c.drawImage(im, 0, hy, sw, im.height - hy, -18, -8 + hy * k, sw * k, (im.height - hy) * k);
          c.translate(-18 + px * k, -8 + hy * k); c.rotate((left ? -1 : 1) * (off ? 0.5 : (this.a - mid) * 0.8)); c.drawImage(im, 0, 0, sw, hy, -px * k, -hy * k, sw * k, hy * k); c.restore(); }
      };
      r.wallBetween = (x0, x1, y) => DOORS.some(d => !r.flags['door_' + d.id] && (y == null || Math.abs(y - T[d.f]) < 40) && d.x > Math.min(x0, x1) && d.x < Math.max(x0, x1));   // сквозь запертую дверь не видно
      pl.y = T[fl]; r.flags.fAt = fl; r.prevX = null;
      if (first) { r.flags.fIn = 1; pl.x = START; pl.facing = -1; r.cp = { id: 'F', x: START, face: -1 }; r.saved = { flags: Object.assign({}, r.flags), ko: new Set(r.ko) }; }
      wd.cam.y = U.clamp(pl.y - 236, D.topY, 0); wd.cam.x = U.clamp(pl.x - W / 2, 0, D.w - W);
    };
    // потоп: труба над постом лопается, оба убегают за сантехником (в разные стороны)
    const flood = r => { r.flags.flood = 1; save(r); r.floodT = 0; Sound.play('zap'); G.shake(3, 0.3); D.runners = [];
      for (const g of r.guards.filter(g => g.kind === 'post')) { r.ko.add(g.id); D.runners.push({ x: g.x, t: 0, a: 1, dir: g.homeF }); }
      r.guards = r.guards.filter(g => !(g.kind === 'post'));
      r.level.playOnMap(function* () { yield 0.5; G.say({ x: VALVE, y: T[2] - 20, headH: 100, voice: 170 }, 'ТВОЮ Ж!.. Стояк прорвало! Сантехника сюда!!!', 2.4, { shout: true }); yield 1.4; G.say(r.player, 'Зажурчало. Пост в столовой смыло — путь свободен.', 2.6); yield 1.2; }); };
    D.flood = flood;
    // ---------- лифт: створки расходятся, Валера заходит, камера едет по шахте на нужный этаж, створки открываются (без перезагрузки карты) ----------
    const ride = (r, to) => { if (r.level.scene || r.lift) return; const pl = r.player; pl.controls = false; pl.vx = 0; pl.crouch = false; pl.auto = null; r.lift = { ph: 0, t: 0, k: 0, from: floorOf(pl.y), to }; Sound.play('door'); };
    const liftUpd = (dt, r) => { const lf = r.lift; if (!lf) return; const pl = r.player, wd = r.world; lf.t += dt; pl.vx = 0; pl.controls = false;
      if (r.caught) { r.lift = null; r.hidePlayer = false; r.camLock = false; return; }
      const next = () => { lf.ph++; lf.t = 0; }, ease = k => k * k * (3 - 2 * k);
      const walk = () => { pl.setAnim('walk'); pl.animT += dt; };
      if (lf.ph === 0) { lf.k = Math.min(1, lf.t / 0.5); if (Math.abs(pl.x - LX) > 1) { pl.facing = Math.sign(LX - pl.x); pl.x = U.approach(pl.x, LX, 70 * dt); walk(); } else pl.setAnim('stand'); if (lf.t > 0.55 && Math.abs(pl.x - LX) <= 1) { r.hidePlayer = true; lf.pk = 0; next(); } }
      else if (lf.ph === 1) { pl.x = LX; lf.pk = Math.min(1, lf.t / 0.6); walk(); if (lf.t > 0.6) { pl.setAnim('stand'); pl.facing = 1; next(); } }   // заходит в кабину
      else if (lf.ph === 2) { lf.k = 1 - Math.min(1, lf.t / 0.45); r.susp = 0; if (lf.t > 0.5) { r.camLock = true; lf.y0 = wd.cam.y; lf.y1 = U.clamp(T[lf.to] - 236, D.topY, 0); lf.x0 = wd.cam.x; lf.dur = 0.5 + 0.55 * Math.abs(lf.to - lf.from); Sound.play('lever'); next(); } }
      else if (lf.ph === 3) { const k = ease(Math.min(1, lf.t / lf.dur)); wd.cam.y = lf.y0 + (lf.y1 - lf.y0) * k; wd.cam.x = lf.x0 + (U.clamp(LX - W / 2, 0, D.w - W) - lf.x0) * k; r.susp = 0;
        lf.hum = (lf.hum || 0) - dt; if (lf.hum <= 0) { lf.hum = 0.5; Sound.play('land'); }
        if (lf.t >= lf.dur) { pl.x = LX; pl.y = T[lf.to]; pl.vy = 0; pl.onGround = true; r.prevX = null; Sound.play('bell'); next(); } }
      else if (lf.ph === 4) { lf.k = Math.min(1, lf.t / 0.5); r.susp = 0; if (lf.t > 0.55) { r.camLock = false; next(); } }
      else if (lf.ph === 5) { lf.pk = 1 - Math.min(1, lf.t / 0.5); walk(); if (lf.t > 0.5) { r.hidePlayer = false; lf.pk = null; pl.setAnim('stand'); pl.controls = true; next(); } }   // выходит из кабины
      else { pl.controls = !r.level.scene && !r.menu && !r.mg; lf.k = 1 - Math.min(1, lf.t / 0.45); if (lf.t > 0.5) { r.lift = null; Sound.play('door'); } } };
    const liftMenu = r => { if (r.lift) return; const cur = floorOf(r.player.y); Sound.play('bell');
      r.openMenu('ЛИФТ', [3, 2, 1, 0].map(n => ({ label: 'Этаж ' + (n + 1) + (n === cur ? ' (вы здесь)' : ''), n, cur: n === cur })), it => { if (it.n !== cur) ride(r, it.n); }); r.menu.lift = true; r.menu.sel = 3 - cur; };
    const doorInt = d => ({ x: d.x + d.from * 14, y: T[d.f], r: 18, label: 'дверь', cond: r => !r.flags['door_' + d.id], act: r => { const q = CARDS.find(q => q[0] === d.id);
      if (!has(r, d.id)) { G.say(r.player, 'Заперто. Замок светится ' + (d.id === 'b' ? 'синим' : 'красным') + ' — нужна ' + q[1].toLowerCase() + ' карта.', 2.2); Sound.play('warn'); return; }
      r.flags['door_' + d.id] = 1; save(r); Sound.play('door'); Sound.play('lever'); FX.popText(d.x, T[d.f] - 100, 'ОТКРЫТО', q[2]); } });
    D.ints = [
      ...ST.map(s => ({ x: SX(s, FOOT(s)), y: T[s.f], r: 18, label: 'наверх', act: r => climb(r, s, true) })),
      ...ST.map(s => ({ x: SX(s, TOPX(s)), y: T[s.f + 1], r: 16, key: 'down', label: 'вниз', cond: r => !(r.stairT > 0), act: r => climb(r, s, false) })),
      ...LOB.map((n, f) => ({ x: LX, y: T[f], r: 22, label: 'лифт', cond: r => !r.lift, act: liftMenu })),
      ...DOORS.map(doorInt),
      { x: SWB, y: T[3], r: 20, label: 'щиток камер', cond: r => !r.flags.camsOff, act: r => { r.player.setAnim('panel4'); r.startMG('wires', ok => { if (ok) { r.flags.camsOff = 1; save(r); Sound.play('lever'); G.say(r.player, 'Камеры ослепли по всему зданию. Даже та, что в умывальной. Извращенцы.', 2.6); } }); } },
      { x: LOCKER, y: T[3], r: 16, label: 'шкафчик', cond: r => !has(r, 'r'), act: r => { r.player.setAnim('panel4'); r.startMG('pick', ok => { if (ok) { Sound.play('door'); giveCard(r, 'r', LOCKER, T[3]); G.say(r.player, 'Красная карта. А замок — тьфу, скрепкой открыл.', 2.4); } }); } },
      { x: PIPEP, y: T[2], r: 20, label: 'водопровод', cond: r => !r.flags.flood, act: r => { r.player.setAnim('panel4'); r.startMG('pipes', ok => { if (ok) flood(r); }); } },
      { x: LPAN, y: T[1], r: 22, label: 'пульт лазеров', cond: r => !r.flags.lasersOff && !alive(r, 1, X(24, 0), X(24, 1)), act: r => { r.player.setAnim('panel4'); r.startMG('lasers', ok => { if (ok) { r.flags.lasersOff = 1; save(r); Sound.play('zap'); G.say(r.player, 'Лазеры в галерее погасли. Сэкономил им электричество.', 2); } }); } },
      { x: RADIO, y: T[3], r: 20, label: 'радиоузел', cond: r => !!r.flags.chief && !r.flags.bossDone, act: r => { const ch = r.guards.find(g => g.chief), pf = floorOf(r.player.y);
        if (r.radioT > 0 || !ch) { G.say(r.player, 'Передатчик ещё греется. Лампы старые.', 1.8); return; } r.radioT = 30; const f = pf >= 2 ? 0 : 3; ch.forceF = f; if (ch.mode !== 'ride') { ch.mode = 'back'; } else ch.rideT = Math.min(ch.rideT, 1.5);
        Sound.play('warn'); G.say({ x: r.player.x, y: r.player.y - 150, headH: 0, voice: 170 }, 'ГРОМКАЯ СВЯЗЬ: «Главного просят срочно пройти на этаж ' + (f + 1) + '!»', 3, { shout: true }); G.say(r.player, 'Пусть побегает. Радио — великая сила.', 2.4); } },
      { x: SAFE, y: T[0], r: 20, label: 'сейф', cond: r => !has(r, 'y') && !alive(r, 0, X(13, 0), X(13, 1)), act: r => {
        if (!r.flags.note) G.say(r.player, 'Кодовый замок. Код где-то написан — начальство вечно забывает...', 2.2);
        r.player.setAnim('panel4'); r.startMG('code', ok => { if (ok) { Sound.play('door'); giveCard(r, 'y', SAFE, T[0]); r.level.playOnMap(bossCall(r)); } }); } },
      { x: HLIFT, y: T[0], r: 22, label: 'лифт в зал', act: r => { const n = ncards(r); if (n < 4) { G.say(r.player, 'Лифт в главный зал. Нужны все четыре ключ-карты — у меня ' + n + '.', 2.4); Sound.play('warn'); return; } if (!r.flags.bossDone) { r.level.playOnMap(bossCall(r)); return; } r.level.toHall(r); } },
      ...EGGS,
    ];
    // сейф открыт — главарь находит Валеру: катсцена и бой тут же, в кабинете директора (карта FB — тот же кабинет крупным планом)
    const say4 = (who, text, actor, auto = 2.4) => Scene.say(who, text, actor, { auto });
    const bossCall = r => function* () { const pl = r.player; addChief(r); const ch = r.guards.find(g => g.chief); r.camLock = false; pl.controls = false; pl.vx = 0;
      yield 0.9; G.say(pl, 'Золотая карта директора! Теперь — к лифту в главный зал.', 2.2); yield 1.6;
      Sound.play('door'); G.shake(3, 0.25); ch.mode = 'scene'; ch.see = 0; ch.x = pl.x < X(13, 0.5) ? X(13, 1) - 14 : X(13, 0) + 14; ch.y = T[0]; ch.f = 0; ch.facing = Math.sign(pl.x - ch.x) || 1; ch.anim = 'run'; pl.facing = -ch.facing; r.susp = 0;
      const tx = pl.x - ch.facing * 86; while (Math.abs(ch.x - tx) > 3) { ch.x = U.approach(ch.x, tx, 190 * (G.dt || 1 / 60)); ch.animT += G.dt || 1 / 60; yield 0.001; }
      ch.anim = 'point'; yield* say4('cmdr7', 'Вот ты где, Мистер Рэд. Весь завод из-за тебя на ушах.', ch, 2.6);
      yield* say4('valera', 'Главный... А я как раз закончил. Сейф у вас — одно название.', pl, 2.6);
      ch.anim = 'laugh'; yield* say4('cmdr7', 'Карту — на стол. Двери я запер. Отсюда выйдет один.', ch, 3.2);
      yield* say4('valera', 'Я стропальщик шестого разряда. Я и тебя застроплю!', pl, 2.4);
      ch.anim = 'taunt'; yield 0.5; r.flags.bossGo = 1; save(r); r.go('FB', 270, 'Кабинет директора', 1); };
    D.hints = [];
    return D;
  };

  // ---------- БОЙ С ГЛАВАРЁМ (карта FB, фон assets/l7v4/aboss.jpg): очень живучий, очень быстрый, почти не оглушается ----------
  const BSC = 169 / 177;   // ростом как рядовые спецназовцы
  V4.Chief = class extends V4.Boss {
    constructor(x, run) { super(x, run); this.hp = this.max = 22; this.table = { x1: 94, x2: 216, y: V4.GY - 31 }; this.row = 0; }
    get box() { return { x: this.x - 13, y: this.y - 78, w: 26, h: 78 }; }
    think(run, pl) {   // здоровье упало до половины — ест курицу; доел — здоров полностью (сбить можно только ударом, пока жуёт)
      if (this.hp <= this.max / 2 && this.cool <= 0) { this.face(pl); this.set('eat'); G.say(this, U.choice(['Перерыв на обед. Курочка!', 'Без курицы — не бой. Ням.', 'Сейчас подкреплюсь — и продолжим.']), 1.4); return; }
      super.think(run, pl); }
    update(dt, run) { const pl = run.player, was = this.state;
      if (this.state === 'escape') { this.set('roll'); this.rollDir = Math.sign(this.x - pl.x) || 1; if (this.ammo <= 0) this.ammo = 4; this.row = 0; if (Math.random() < 0.5) G.say(this, U.choice(['Не дождёшься!', 'Хватит с тебя!', 'Дважды — и хватит!']), 0.9); }
      if (!this.vuln) this.row = 0;
      super.update(dt * (this.vuln ? 1.2 : this.hp <= this.max / 2 ? 1.85 : 1.6), run);
      if (was === 'eat' && this.state === 'idle') { this.hp = this.max; Sound.play('coin'); FX.popText(this.x, this.y - 112, 'ГЛАВАРЬ ЗДОРОВ!', '#ff8a6a'); G.say(this, U.choice(['Как новенький!', 'Курица — сила!', 'Ну что, сначала?']), 1.2); } }   // всё делает быстрее; во второй половине боя — ещё быстрее
    playerHit(hb, dmg, atk, pl) { const hp0 = this.hp; super.playerHit(hb, dmg, atk, pl);
      if (this.hp < hp0 && this.state === 'hurt') { this.row++; if (this.combo >= 3 && Math.random() > 0.08) this.combo = 0;   // оглушить почти нереально
        if (this.row >= 3) { this.row = 0; this.after = 'escape'; } } }
    draw(c, cx) { const d0 = Spr.drawAnim; Spr.drawAnim = (c2, sh, an, t, x, y, f, o) => d0.call(Spr, c2, sh, an, t, x, y, f, sh === 'boss4' ? Object.assign({ scale: BSC }, o) : o); try { super.draw(c, cx); } finally { Spr.drawAnim = d0; } }
  };
  const say4 = (who, text, actor, auto = 2.4) => Scene.say(who, text, actor, { auto });
  V4.MAPS.FB = run => ({
    w: W, minX: 16, maxX: W - 16, music: false, suspK: 0, dark: 0, ints: [], hints: [], plats: [{ x: 94, y: V4.GY - 31, w: 122, h: 8 }],
    bgFn: (c, cx, r) => { const im = V4.img.aboss; if (im) c.drawImage(im, 0, 0, W, H); },
    drawMid: (c, cx, r) => { const d = r.hpDrop, im = V4.img.pr_kefir, z = (window.V4_PROPS || {}).kefir; if (d && im && z) { c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(d.x, V4.GY + 1, z[0] * 0.5, 2.5, 0, 0, 6.3); c.fill(); c.drawImage(im, Math.round(d.x - z[0] / 2), d.y - z[1] + (d.y >= V4.GY ? Math.sin(G.t * 4) * 1.5 - 2 : 0), z[0], z[1]); } },
    onLoad: r => { const pl = r.player; r.hpT = 0; r.hpDrop = null; r.arrow = null; r.lift = null; r.hidePlayer = false; r.camLock = false; r.cp = { id: 'FB', x: 270, face: 1 }; r.saved = { flags: Object.assign({}, r.flags), ko: new Set(r.ko) };
      if (r.flags.bossDone) { r.boss = null; return; } r.boss = new V4.Chief(500, r); r.bossWon = false;
      if (r.level.chiefSeen) { r.boss.set('idle'); Music.play('boss'); r.bossHint = 5; } else { r.level.chiefSeen = true; r.level.playOnMap(function* () { const b = r.boss; r.camLock = true; pl.facing = 1; b.set('wait', 'stand'); b.facing = -1; yield 0.7;
        yield* say4('cmdr7', 'И это буду я. Потанцуем, стропальщик.', b, 2.6); b.set('wait', 'taunt'); yield 0.6; G.hint = null; b.set('idle'); Music.play('boss'); r.bossHint = 7; }); } },
    update: (dt, r) => { const b = r.boss; if (b && b.state === 'ko' && !r.level.scene && !r.bossWon) { r.bossWon = true; r.level.playOnMap(function* () { const pl = r.player; r.camLock = true; b.bullets = []; b.nades = []; b.smokes = []; yield 1.0;
        yield* say4('cmdr7', 'Ох... Кто ж знал, что стропальщики... так бьют...', b, 2.6); yield* say4('valera', 'Отдыхай, Главный. Мне ещё в главный зал — на собрание.', pl, 2.6);
        r.flags.bossDone = 1; r.flags.fAt = 0; Music.play('stealth'); r.go('F', window.V4_LAYF.xc - 120, 'Этаж 1', 1); }); }
      if (b && !r.level.scene && !['sit', 'wait', 'ko'].includes(b.state)) {   // раз в 40 с сверху падает кефир (+30 здоровья)
        const pl = r.player; r.hpT = (r.hpT || 0) + dt; if (r.hpT >= 40 && !r.hpDrop) { r.hpT = 0; r.hpDrop = { x: U.rand(60, W - 60), y: -20, vy: 0 }; }
        const d = r.hpDrop; if (d) { if (d.y < V4.GY) { d.vy += 500 * dt; d.y = Math.min(V4.GY, d.y + d.vy * dt); if (d.y >= V4.GY) Sound.play('land'); }
          else if (Math.abs(pl.x - d.x) < 20 && Math.abs(pl.y - V4.GY) < 12 && !pl.dead) { pl.heal(30); Sound.play('coin'); FX.popText(d.x, V4.GY - 70, '+30 ЗДОРОВЬЯ', '#8cf08c'); r.hpDrop = null; } } }
      if (r.bossHint > 0) { r.bossHint -= dt; r.hint = 'Бей, когда перезаряжается или ест! Не дай доесть курицу — вылечится'; r.hintA = 1; } },
  });

  // ---------- мини-игры: «водопровод» (поверни трубы, пусти воду в стояк) и «отмычка» (поймай момент) ----------
  const Base = V4.MG, DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]], OPEN = { S: [1, 3], E: [3, 2], X: [0, 1, 2, 3] };
  V4.MG = class extends Base {
    constructor(kind, run) {
      super(kind, run);
      if (kind === 'pipes') {   // сетка 5x3; вода входит слева в (0,0), должна выйти справа из (4,2)
        const sol = { '0,0': ['S', 0], '1,0': ['S', 0], '2,0': ['E', 0], '2,1': ['S', 1], '2,2': ['E', 2], '3,2': ['S', 0], '4,2': ['S', 0] };
        this.cols = 5; this.rows = 3; this.g = []; this.sel = [0, 0];
        for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) { const s = sol[x + ',' + y], t = s ? s[0] : U.choice(['S', 'E', 'E', 'X']); let rot = U.randi(0, 3); if (s && t !== 'X' && this.same(t, rot, s[1])) rot = (rot + 1) % 4; this.g.push({ t, rot }); }
        this.flow();
      }
      if (kind === 'pick') { this.a = 0; this.sp = 2.6; this.pin = 0; this.zone = U.rand(0, 6.28); this.zw = 0.62; }
    }
    same(t, a, b) { return t === 'S' ? a % 2 === b % 2 : a === b; }
    opens(cell) { return OPEN[cell.t].map(d => (d + cell.rot) % 4); }
    flow() {   // какие клетки заполнены водой; вышла ли вода в стояк
      const wet = new Set(), q = []; this.out = false;
      if (this.opens(this.g[0]).includes(3)) { wet.add(0); q.push(0); }
      while (q.length) { const i = q.pop(), x = i % 5, y = i / 5 | 0;
        for (const d of this.opens(this.g[i])) { const nx = x + DIRS[d][0], ny = y + DIRS[d][1]; if (x === 4 && y === 2 && d === 1) this.out = true; if (nx < 0 || ny < 0 || nx > 4 || ny > 2) continue; const j = ny * 5 + nx; if (!wet.has(j) && this.opens(this.g[j]).includes((d + 2) % 4)) { wet.add(j); q.push(j); } } }
      this.wet = wet;
    }
    update(dt, I) {
      if (this.kind !== 'pipes' && this.kind !== 'pick') return super.update(dt, I);
      this.t += dt; if (this.msgT > 0) this.msgT -= dt;
      if (this.done) { this.done -= dt; return this.done <= 0 ? 'ok' : null; }
      if (I.pressed('throw') || I.pressed('pause')) { I.hit.pause = false; return 'quit'; }
      const ok = I.pressed('jump') || I.pressed('punch');
      if (this.kind === 'pipes') {
        if (I.pressed('left')) this.sel[0] = (this.sel[0] + 4) % 5; if (I.pressed('right')) this.sel[0] = (this.sel[0] + 1) % 5;
        if (I.pressed('up')) this.sel[1] = (this.sel[1] + 2) % 3; if (I.pressed('down')) this.sel[1] = (this.sel[1] + 1) % 3;
        if (ok) { const c = this.g[this.sel[1] * 5 + this.sel[0]]; c.rot = (c.rot + 1) % 4; Sound.play('lever'); this.flow(); if (this.out) { this.say('ВОДА ПОШЛА В СТОЯК!', 2); Sound.play('zap'); this.done = 1.3; } }
      } else {
        this.a = (this.a + this.sp * dt) % 6.2832;
        if (ok) { let d = Math.abs(this.a - this.zone) % 6.2832; d = Math.min(d, 6.2832 - d);
          if (d < this.zw / 2 + 0.06) { this.pin++; Sound.play('lever'); if (this.pin >= 3) { this.say('ЗАМОК ОТКРЫТ!', 2); this.done = 1.1; } else { this.say('ЩЁЛК! Штифт ' + this.pin + ' из 3', 0.9); this.zone = U.rand(0, 6.28); this.zw -= 0.1; this.sp = -this.sp * 1.1; } }
          else { this.say('ДЗЫНЬ! Мимо', 0.8); Sound.play('warn'); this.run.noise(this.run.player.x, this.run.player.y, 120, 'clink'); } }
      }
      return null;
    }
    draw(c) {
      if (this.kind === 'pipes') return this.drawPipes(c);
      if (this.kind === 'pick') return this.drawPick(c);
      if (this.kind === 'code' && V4.img.mgs) return this.drawCode(c);
      return super.draw(c);
    }
    drawPipes(c) {
      const Im = V4.img, px = 105, py = 50, pw = 430, ph = 240, CS = 38, gx = px + 120, gy = py + 62, th = CS * 0.36;
      c.fillStyle = 'rgba(0,0,0,0.72)'; c.fillRect(0, 0, W, H);
      if (Im.mgp) c.drawImage(Im.mgp, px, py, pw, ph);
      G.text('ВОДОМЕРНЫЙ УЗЕЛ', W / 2, py - 18, { align: 'center', size: 8, color: '#ffd84a', outline: true });
      const tile = (cell, x, y, wet) => { c.save(); c.translate(x + CS / 2, y + CS / 2); c.rotate(cell.rot * Math.PI / 2);
        const im = Im['pa_pipe_' + cell.t.toLowerCase()];
        if (im) { if (cell.t === 'S') c.drawImage(im, -CS / 2, -th / 2, CS, th); else if (cell.t === 'E') c.drawImage(im, -CS / 2, -th / 2, CS / 2 + th / 2, CS / 2 + th / 2); else c.drawImage(im, -CS / 2, -CS / 2, CS, CS); }
        c.restore();
        if (wet) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x + CS / 2, y + CS / 2, 2, x + CS / 2, y + CS / 2, CS * 0.6); g.addColorStop(0, `rgba(60,160,255,${0.34 + 0.1 * Math.sin(this.t * 6 + x)})`); g.addColorStop(1, 'rgba(60,160,255,0)'); c.fillStyle = g; c.fillRect(x, y, CS, CS); c.restore(); } };
      const v = Im.pa_pipe_v, gg = Im.pa_pipe_g;
      if (v) c.drawImage(v, gx - CS - 2, gy + CS / 2 - CS * 0.62, CS, CS * 0.86);                  // вентиль: вход воды
      if (gg) c.drawImage(gg, gx + 5 * CS + 2, gy + 2 * CS + CS / 2 - CS * 0.66, CS, CS * 0.95);   // манометр: стояк столовой
      for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) tile(this.g[y * 5 + x], gx + x * CS, gy + y * CS, this.wet.has(y * 5 + x));
      if (!this.done) { const t = 0.6 + 0.4 * Math.sin(this.t * 8); c.strokeStyle = `rgba(255,216,74,${t})`; c.lineWidth = 2; c.strokeRect(gx + this.sel[0] * CS + 1.5, gy + this.sel[1] * CS + 1.5, CS - 3, CS - 3); }
      G.text('ВХОД', gx - CS / 2 - 2, gy - 12, { align: 'center', size: 8, color: '#9fd4f4', outline: true }); G.text('СТОЯК', gx + 5.5 * CS + 2, gy + 3 * CS + 4, { align: 'center', size: 8, color: '#9fd4f4', outline: true });
      G.text(Game.fmtHint('Стрелки — выбор, {jump} — повернуть трубу'), W / 2, py + ph + 10, { align: 'center', size: 8, color: '#c8d0d8', outline: true });
      G.text(Game.fmtHint('{throw} — отойти'), W / 2, py + ph + 24, { align: 'center', size: 8, color: '#9aa0a8', outline: true });
      if (this.msgT > 0) G.text(this.msg, W / 2, py + 28, { align: 'center', color: '#8cf08c', outline: true });
    }
    drawCode(c) {   // кодовый замок сейфа: хромированная планка с четырьмя окошками (фон из Flow), цифры — в окошках
      const Im = V4.img, px = 105, py = 50, pw = 430, ph = 240, WX = [0.3376, 0.4459, 0.5541, 0.6624], wy = py + ph * 0.4167, ww = pw * 0.0807, wh = ph * 0.1536;
      c.fillStyle = 'rgba(0,0,0,0.72)'; c.fillRect(0, 0, W, H); c.drawImage(Im.mgs, px, py, pw, ph);
      G.text('СЕЙФ ДИРЕКТОРА', W / 2, py - 18, { align: 'center', size: 8, color: '#ffd84a', outline: true });
      for (let i = 0; i < 4; i++) { const x = px + pw * WX[i];
        if (this.sel === i) { c.strokeStyle = `rgba(255,216,74,${0.7 + 0.3 * Math.sin(this.t * 8)})`; c.lineWidth = 2; c.strokeRect(x - ww / 2 - 1, wy - wh / 2 - 1, ww + 2, wh + 2); }
        G.text(String(this.dig[i]), x, wy - 9, { align: 'center', size: 16, color: this.sel === i ? '#b8ffb8' : '#6fd86f' }); }
      if (this.msgT > 0) G.text(this.msg, W / 2, py + ph - 26, { align: 'center', color: this.done ? '#8cf08c' : '#ff8a6a', outline: true });
      G.text(Game.fmtHint('{up}/{down} — цифра, стрелки — окошко, {jump} — ввод'), W / 2, py + ph + 10, { align: 'center', size: 8, color: '#c8d0d8', outline: true });
      G.text(Game.fmtHint('{throw} — отойти'), W / 2, py + ph + 24, { align: 'center', size: 8, color: '#9aa0a8', outline: true });
    }
    drawPick(c) {
      const Im = V4.img, px = 105, py = 50, pw = 430, ph = 240, cx = px + pw * 0.512, cy = py + ph * 0.48, R = 62;
      c.fillStyle = 'rgba(0,0,0,0.72)'; c.fillRect(0, 0, W, H);
      if (Im.mgk) c.drawImage(Im.mgk, px, py, pw, ph);
      G.text('ЗАМОК ШКАФЧИКА', W / 2, py - 18, { align: 'center', size: 8, color: '#ffd84a', outline: true });
      const z0 = this.zone - this.zw / 2 - Math.PI / 2, z1 = this.zone + this.zw / 2 - Math.PI / 2;   // зелёная зона на латунном кольце
      c.strokeStyle = 'rgba(6,30,10,0.85)'; c.lineWidth = 17; c.beginPath(); c.arc(cx, cy, R, z0 - 0.03, z1 + 0.03); c.stroke(); c.strokeStyle = `rgba(70,${225 + 30 * Math.sin(this.t * 7) | 0},100,0.95)`; c.lineWidth = 12; c.beginPath(); c.arc(cx, cy, R, z0, z1); c.stroke();
      const pk = Im.pa_pick; if (pk) { c.save(); c.translate(cx, cy); c.rotate(this.a); c.drawImage(pk, -6, -R - 12, 12, 88); c.restore(); }
      for (let i = 0; i < 3; i++) { c.fillStyle = i < this.pin ? '#8cf08c' : 'rgba(20,20,20,0.8)'; c.beginPath(); c.arc(W / 2 - 16 + i * 16, py + ph - 14, 5, 0, 6.3); c.fill(); c.strokeStyle = '#d8b860'; c.lineWidth = 1; c.stroke(); }
      G.text(Game.fmtHint('{jump} — когда отмычка в зелёной зоне. Три штифта'), W / 2, py + ph + 10, { align: 'center', size: 8, color: '#c8d0d8', outline: true });
      G.text(Game.fmtHint('{throw} — отойти'), W / 2, py + ph + 24, { align: 'center', size: 8, color: '#9aa0a8', outline: true });
      if (this.msgT > 0) G.text(this.msg, W / 2, py + 26, { align: 'center', color: /Мимо/.test(this.msg) ? '#ff8a6a' : '#8cf08c', outline: true });
    }
  };
})();
