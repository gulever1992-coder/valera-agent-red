'use strict';
// ============ УРОВЕНЬ 7: раскладка улицы и здания ============
// Предметы: props7out (0 куст, 1 мусорный бак, 2 ящики, 3 седан, 4 джип, 5 забор с дырой, 6 будка, 7 фонарь, 8 кость, 9 будка-собачья, 10 кирпичи, 11 купе)
//           props7in  (0 фикус, 1 штора, 2 шкаф, 3 стол, 4 камера, 5 лазер, 6 кнопка, 7 рычаг, 8 сейф, 9 сервер, 10 пульт, 11 дверь, 12 дверь открыта, 13 лифт, 14 карта, 15 бюст)
L7.FENCE_X = 1890;
L7.FAC_X = 4400;                                   // левый край фасада со строительными лесами
L7.FAC_K = 0.44;                                   // масштаб фасада (лог. px на px исходника 768x1376)
L7.FAC_W = Math.round(768 * L7.FAC_K);
L7.DECK = [194, 80, -35];                          // настилы лесов (ноги), по картинке facade7
L7.WIN = { x: L7.FAC_X + 254, y: -35 };            // открытое окно 4-го этажа (над верхним настилом)

L7.buildOut = function () {
  const GY = L7.GY, D = { w: L7.OW, plats: [], ladders: [], guards: [], dogs: [], cams: [], lasers: [], hides: [], covers: [], ints: [], pickups: [], props: [], cps: [], hints: [], fg: [] };
  const prop = (fr, x, o = {}) => { const p = Object.assign({ sheet: 'props7out', fr, x, y: GY, s: 1 }, o); D.props.push(p); return p; };
  const cover = (fr, x, w, o = {}) => { prop(fr, x, o); D.covers.push({ x1: x - w / 2, x2: x + w / 2, y: o.y || GY }); };
  D.plats.push({ x: 0, y: GY, w: L7.OW, h: 80, oneway: false });
  // --- A. подворотни: бродячие собаки (драка), кости ---
  D.cps.push({ x: 60, y: GY });
  for (const [x, a, b] of [[560, 440, 760], [1000, 880, 1160], [1380, 1260, 1560], [1640, 1560, 1800]]) D.dogs.push({ x, y: GY, x1: a, x2: b, stray: true });
  for (const x of [330, 1220, 1760]) D.pickups.push({ kind: 'bone', x, y: GY, n: 2 });
  prop(1, 420); prop(2, 760); prop(10, 1180); prop(1, 1500); prop(7, 250); prop(7, 1080);
  D.hints.push({ x: 40, w: 340, text: '{down} + стрелки — красться (тихо). Идти в полный рост — шумно.' });
  D.hints.push({ x: 400, w: 500, text: 'Бродячие собаки! Бей {punch} или кинь кость {throw} — отвлечёт.' });
  // забор с дырой: сплошной, пролезть — {up} у дыры
  D.plats.push({ x: L7.FENCE_X - 10, y: GY - 128, w: 20, h: 128, oneway: false });
  prop(5, L7.FENCE_X, { front: true });
  D.ints.push({ x: L7.FENCE_X - 34, y: GY, r: 30, label: 'ПРОЛЕЗТЬ В ДЫРУ', act: run => run.crawlHole() });
  D.hints.push({ x: 1700, w: 200, text: 'Дыра в заборе! Подойди и нажми {up}.' });
  // --- B. двор: сторожевые собаки, спецназ, укрытия ---
  D.cps.push({ x: L7.FENCE_X + 70, y: GY });
  D.hints.push({ x: 1930, w: 260, text: 'Не попадайся на глаза! Присядь {down} за кустом или машиной — не заметят.' });
  D.hints.push({ x: 2200, w: 260, text: 'Подкрадись к спецназовцу СЗАДИ и нажми {punch} — вырубишь.' });
  D.hints.push({ x: 2560, w: 260, text: 'Кинь кость {throw} в зону собаки — убежит грызть.' });
  cover(0, 2120, 56); cover(3, 2440, 120); prop(7, 2280); cover(1, 2860, 56);
  D.guards.push({ id: 'y1', x: 2560, y: GY, x1: 2330, x2: 2760, facing: 1 });
  D.dogs.push({ id: 'yd1', x: 2800, y: GY, x1: 2620, x2: 3060 });
  cover(2, 3120, 60); cover(0, 3260, 56); prop(7, 3020);
  D.guards.push({ id: 'y2', x: 3380, y: GY, kind: 'post', facing: -1 });
  prop(9, 3520); D.dogs.push({ id: 'yd2', x: 3600, y: GY, x1: 3460, x2: 3820 });
  cover(4, 3720, 130); prop(7, 3640);
  prop(6, 3960); D.hides.push({ x: 3960, y: GY, w: 40, kind: 'wardrobe', label: 'СПРЯТАТЬСЯ В БУДКУ' });
  D.dogs.push({ id: 'yd3', x: 4150, y: GY, x1: 4020, x2: 4360 });
  cover(0, 4250, 56); cover(11, 4080, 100);
  for (const x of [2980, 3880]) D.pickups.push({ kind: 'bone', x, y: GY, n: 2 });
  // --- C. строительные леса ---
  const fx = L7.FAC_X, [d1, d2, d3] = L7.DECK;
  D.cps.push({ x: fx - 40, y: GY });
  D.hints.push({ x: fx - 60, w: 220, text: 'Лезь по лесам {up} к открытому окну. Наверху патруль и камера.' });
  for (const y of L7.DECK) D.plats.push({ x: fx + 112, y, w: 215, h: 8, oneway: true });
  // к первому настилу — по ящикам и кирпичам (лестницы на картинке только между настилами)
  prop(10, fx + 20); D.plats.push({ x: fx + 2, y: GY - 28, w: 36, h: 8, oneway: true });
  prop(2, fx + 72); D.plats.push({ x: fx + 46, y: GY - 58, w: 52, h: 8, oneway: true });
  D.ladders.push({ x: fx + 152, y: d2, w: 20, h: d1 - d2 }, { x: fx + 254, y: d3, w: 20, h: d2 - d3 });
  D.plats.push({ x: fx + L7.FAC_W, y: -400, w: 400, h: 800, oneway: false });   // край здания
  D.guards.push({ id: 's1', x: fx + 230, y: d2, x1: fx + 125, x2: fx + 315, facing: -1 });
  D.dogs.push({ id: 'sd1', x: fx + 200, y: GY, x1: fx + 110, x2: fx + 320 });
  D.cams.push({ x: fx + 200, y: d1 - 96, floorY: d1, a0: 2.4, a1: 0.75, per: 7, range: 200 });
  prop(10, fx + 300, { y: d1 }); D.covers.push({ x1: fx + 280, x2: fx + 322, y: d1 });
  prop(10, fx + 140, { y: d3 }); D.covers.push({ x1: fx + 120, x2: fx + 160, y: d3 });
  D.ints.push({ x: L7.WIN.x, y: L7.WIN.y, r: 34, label: 'ЗАЛЕЗТЬ В ОКНО', act: run => run.enterBuilding() });
  // передний план: тёмные силуэты
  D.fgSheet = 'props7out';
  for (let x = 200; x < L7.OW; x += 380 + (x * 7) % 160) D.fg.push({ fr: [0, 2, 10, 0][(x / 380 | 0) % 4], x, s: 1.3 });
  return D;
};

// ---------- здание в разрезе ----------
// комнаты [этаж][колонка]: картинка, табличка
L7.LAYOUT = {
  4: [['stairs', 'ЛЕСТНИЦА'], ['reception', 'ПРИЁМНАЯ'], ['accounting', 'БУХГАЛТЕРИЯ'], ['deputy2', 'ЗАМ. ЗАМ. ДИРЕКТОРА'], ['corridor', 'КОРИДОР'], ['archive', 'АРХИВ']],
  3: [['stairs', 'ЛЕСТНИЦА'], ['corridor', 'КОРИДОР'], ['deputy', 'ЗАМ. ДИРЕКТОРА'], ['canteen', 'БУФЕТ'], ['server', 'СЕРВЕРНАЯ'], ['stairs', 'ЛЕСТНИЦА']],
  2: [['stairs', 'ЛЕСТНИЦА'], ['director', 'ДИРЕКТОР'], ['archive', 'АРХИВ-2'], ['security', 'ОХРАНА'], ['corridor', 'МРАМОРНЫЙ КОРИДОР'], ['stairs', 'ЛЕСТНИЦА']],
  1: [['stairs', 'ЛЕСТНИЦА'], ['reception', 'ВЕСТИБЮЛЬ'], ['corridor', 'КОРИДОР'], ['deputy2', 'ЗАМ. ЗАМ. ЗАМ. ДИРЕКТОРА'], ['corridor', 'КОРИДОР'], ['hall', 'АКТОВЫЙ ЗАЛ']],
};
L7.buildIn = function () {
  const RW = L7.RW, D = { w: L7.IW, plats: [], ladders: [], guards: [], dogs: [], cams: [], lasers: [], hides: [], covers: [], ints: [], pickups: [], props: [], cps: [], hints: [], doors: [], fg: [] };
  const prop = (fr, x, f, o = {}) => { const p = Object.assign({ sheet: 'props7in', fr, x, y: fy(f), s: 1 }, o); D.props.push(p); return p; };
  const hide = (kind, x, f) => { prop({ ficus: 0, curtain: 1, wardrobe: 2 }[kind], x, f, { hide: true }); D.hides.push({ x, y: fy(f), w: kind === 'curtain' ? 34 : 30, kind, label: kind === 'ficus' ? 'ЗА ФИКУС' : kind === 'curtain' ? 'ЗА ШТОРУ' : 'В ШКАФ' }); };
  const desk = (x, f) => { prop(3, x, f); D.covers.push({ x1: x - 30, x2: x + 30, y: fy(f) }); };
  const top = f => fy(f) - L7.RTOP;
  const cam = (x, f, a0, a1, o = {}) => D.cams.push(Object.assign({ x, y: top(f) + 10, floorY: fy(f), a0, a1, per: 6, range: 230 }, o));
  const vlaser = (x, f, o = {}) => D.lasers.push(Object.assign({ x, y0: top(f) + 4, y1: fy(f) }, o));
  for (let f = 1; f <= 4; f++) {
    D.plats.push({ x: 0, y: fy(f), w: L7.IW, h: 25, oneway: false });                           // пол = потолок этажа ниже
    D.plats.push({ x: -40, y: top(f), w: 40, h: L7.RTOP, oneway: false }, { x: L7.IW, y: top(f), w: 40, h: L7.RTOP, oneway: false });   // наружные стены
    for (let c = 1; c < 6; c++) D.doors.push({ id: f + ':' + c, f, x: c * RW, lock: null });
  }
  D.plats.push({ x: 0, y: top(4) - 25, w: L7.IW, h: 25, oneway: false });                       // крыша
  const door = (f, c) => D.doors.find(d => d.id === f + ':' + c);
  const stairs = (x, f, tf, label) => D.ints.push({ x, y: fy(f), r: 30, label, act: run => run.goStairs(tf, x) });
  // ===== 4 этаж: вход через окно архива =====
  D.cps.push({ x: 1800, y: fy(4), name: '4 ЭТАЖ' });
  D.hints.push({ x: 1640, w: 300, f: 4, text: 'Внутри здания! Спрятаться: {up} у фикуса, шторы или шкафа. Камер и лазеров — избегай.' });
  hide('ficus', 1350, 4); hide('curtain', 1556, 4);
  cam(1440, 4, 2.35, 0.8, { per: 6.5 });
  prop(8, 1060, 4); D.ints.push({ x: 1060, y: fy(4), r: 26, label: 'СЕЙФ', act: run => run.startMG('safe'), cond: run => !run.flags.card });
  hide('wardrobe', 1180, 4);
  desk(690, 4); desk(830, 4);
  D.ints.push({ x: 760, y: fy(4), r: 22, label: 'КАЛЕНДАРЬ', act: run => run.readNote(), cond: run => !run.flags.note });
  D.guards.push({ id: 'f4g', x: 700, y: fy(4), x1: 400, x2: 1000, facing: 1 });
  vlaser(500, 4, { blink: [1.4, 1.3] }); hide('curtain', 580, 4);
  stairs(150, 4, 3, 'ВНИЗ НА 3 ЭТАЖ');
  // ===== 3 этаж =====
  D.cps.push({ x: 150, y: fy(3), name: '3 ЭТАЖ' });
  D.guards.push({ id: 'f3g', x: 470, y: fy(3), x1: 360, x2: 610, facing: 1 });
  cam(615, 3, 2.5, 1.7, { per: 5 }); hide('ficus', 420, 3);
  prop(6, 905, 3, { y: fy(3) - 50 }); D.ints.push({ x: 905, y: fy(3), r: 24, label: 'КРАСНАЯ КНОПКА', act: run => run.pressButton() });
  hide('wardrobe', 760, 3);
  door(3, 4).lock = 'btn';
  D.hints.push({ x: 830, w: 140, f: 3, text: 'Кнопка открывает дверь серверной на 12 секунд. В буфете спит охранник — не шуми!' });
  D.guards.push({ id: 'f3s', x: 1130, y: fy(3), kind: 'sleep', facing: -1 });
  D.pickups.push({ kind: 'bone', x: 1010, y: fy(3), n: 3 });
  prop(9, 1450, 3); D.ints.push({ x: 1450, y: fy(3), r: 28, label: 'ЩИТОК ЛАЗЕРОВ', act: run => run.startMG('wires'), cond: run => !run.flags.lasF2 });
  stairs(1760, 3, 2, 'ВНИЗ НА 2 ЭТАЖ'); stairs(150, 3, 4, 'НАВЕРХ НА 4 ЭТАЖ');
  // ===== 2 этаж =====
  D.cps.push({ x: 1760, y: fy(2), name: '2 ЭТАЖ' });
  for (const x of [1350, 1430, 1510]) vlaser(x, 2, { group: 'lasF2' });
  D.lasers.push({ horiz: true, x0: 1290, x1: 1590, y: fy(2) - 58 });
  D.hints.push({ x: 1600, w: 140, f: 2, text: 'Низкий луч — проползи под ним {down}. Красные столбы гаснут от щитка серверной (3 этаж).' });
  D.guards.push({ id: 'f2g', x: 1100, y: fy(2), kind: 'post', facing: -1 });
  prop(10, 1010, 2); D.ints.push({ x: 1010, y: fy(2), r: 26, label: 'ПУЛЬТ КАМЕР', act: run => run.startMG('simon'), cond: run => !run.flags.camsF1 });
  hide('wardrobe', 860, 2);
  D.ints.push({ x: 720, y: fy(2), r: 24, label: 'ВЕНТИЛЯЦИЯ (НА 1 ЭТАЖ)', act: run => run.goVent(1, 1080) });
  door(2, 2).lock = 'card';
  prop(15, 400, 2); prop(7, 500, 2, { y: fy(2) - 46 });
  D.ints.push({ x: 500, y: fy(2), r: 24, label: 'РЫЧАГ ЗА ПОРТРЕТОМ', act: run => run.pullLever(), cond: run => !run.flags.hall });
  stairs(150, 2, 1, 'ВНИЗ НА 1 ЭТАЖ'); stairs(1760, 2, 3, 'НАВЕРХ НА 3 ЭТАЖ');
  // ===== 1 этаж =====
  D.cps.push({ x: 150, y: fy(1), name: '1 ЭТАЖ' });
  D.guards.push({ id: 'f1g', x: 600, y: fy(1), x1: 380, x2: 900, facing: 1 });
  cam(560, 1, 2.3, 1.0, { group: 'camsF1', per: 6 }); cam(1500, 1, 2.4, 0.9, { group: 'camsF1', per: 5.5, ph: 2 });
  vlaser(760, 1, { blink: [1.6, 1.3] }); hide('curtain', 890, 1);
  D.ints.push({ x: 1080, y: fy(1), r: 22, label: 'ВЕНТИЛЯЦИЯ (НА 2 ЭТАЖ)', act: run => run.goVent(2, 720) });
  D.dogs.push({ id: 'f1d', x: 1250, y: fy(1), x1: 1000, x2: 1560 });
  desk(1180, 1); hide('ficus', 1440, 1);
  D.ints.push({ x: 1760, y: fy(1), r: 36, label: 'СЛУЖЕБНЫЙ ВХОД В АКТОВЫЙ ЗАЛ', act: run => run.hallDoor() });
  stairs(150, 1, 2, 'НАВЕРХ НА 2 ЭТАЖ');
  // передний план: силуэты фикусов и штор у нижнего края
  D.fgSheet = 'props7in';
  for (let x = 140, i = 0; x < L7.IW; x += 300 + (i * 97) % 140, i++) D.fg.push({ fr: i % 3 === 2 ? 1 : 0, x, s: 1.4 });
  return D;
};
