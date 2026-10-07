'use strict';
// ============ УРОВЕНЬ 7: раскладка карт ============
// Листы предметов (номера кадров):
//  pr7: 0 биотуалет, 1 открытый, 2 будка-щиток, 3 открытая, 4 ящик, 5 коробки, 6 столбик, 7 конус, 8 куст, 9 люк, 10 камера, 11 дрон
//  po7: 0 кондиционер, 1 забор, 2 забор с дырой, 3 мусорный бак, 4 водосточная труба, 5 поддоны, 6 кость, 7 гайка, 8 лазер-коробка, 9 открытый люк,
//       10 лазер на столбе, 11 будка собачья, 12 пульт с проводами, 13 шлагбаум, 14 фонарь
//  pi7: 0 шкаф, 1 открытый, 2 кулер, 3 фикус, 4 дверь, 5 открытая, 6 колонна, 7 кабинка, 8 открытая, 9 решётка вентиляции, 10 кодовый замок, 11 камера, 12 канат, 13 кресло
//  car7: 0 лимузин, 1 седан, 2 белый седан, 3 джип, 4 спорткар, 5 синий седан;  fg7: 0 столбик, 1 куст, 2 конус, 3 сетка, 4 труба, 5 блок, 6 фикус, 7 колонна, 8 трава, 9 гидрант
L7.OUT_W = 5700;
L7.FENCE_X = 1900; L7.YARD_X = 3640; L7.GATE_X = 5560;
L7.ZONES = { out: [[0, 'parking'], [L7.FENCE_X, 'wall1'], [L7.YARD_X, 'yard']], sewer: [[0, 'sewer']], in: [[0, 'corr']] };

const mk7 = w => ({ w, plats: [], ladders: [], guards: [], dogs: [], cams: [], drones: [], lasers: [], beavers: [], hides: [], covers: [], cars: [], ints: [], pickups: [], props: [], cps: [], hints: [], fg: [] });

L7.buildOut = function () {
  const GY = L7.GY, D = mk7(L7.OUT_W);
  const prop = (sheet, fr, x, o = {}) => { const p = Object.assign({ sheet, fr, x, y: GY, s: 1 }, o); D.props.push(p); return p; };
  const cover = (sheet, fr, x, o = {}) => { const p = prop(sheet, fr, x, o); const [w, h] = Spr.size(sheet, fr); D.covers.push({ x1: x - w / 2 + 6, x2: x + w / 2 - 6, y: o.y || GY, h }); return p; };
  const car = (fr, x, flip) => {   // машина: укрытие + крыша-платформа + сигналка от гайки
    const [w, h] = Spr.size('car7', fr); const p = prop('car7', fr, x, { flip: flip ? -1 : 1 });
    D.covers.push({ x1: x - w / 2 + 10, x2: x + w / 2 - 10, y: GY, h });
    D.plats.push({ x: x - w / 2 + 24, y: GY - h + 12, w: w - 48, h: 8, oneway: true });
    D.cars.push({ x1: x - w / 2, x2: x + w / 2, top: GY - h, x, p, alarm: 0 });
  };
  const hide = (sheet, fr, frOpen, x, label, o = {}) => { const p = prop(sheet, fr, x, o); D.hides.push({ x, y: GY, w: Spr.size(sheet, fr)[0], kind: 'booth', label, p, frClosed: fr, frOpen }); return p; };
  D.plats.push({ x: 0, y: GY, w: L7.OUT_W, h: 80, oneway: false });

  // ===== A. ПАРКОВКА =====
  D.cps.push({ x: 70, y: GY });
  prop('po7', 14, 30); prop('pr7', 6, 150); prop('pr7', 7, 190); prop('po7', 14, 640); prop('po7', 14, 1250);
  car(0, 330); car(1, 620, true); car(3, 900); prop('pr7', 8, 1040); car(2, 1180, true);
  D.guards.push({ id: 'a1', x: 470, x1: 420, x2: 780, facing: 1 });
  D.guards.push({ id: 'a2', x: 1060, kind: 'post', facing: -1 });
  D.pickups.push({ kind: 'nut', x: 230, n: 3 }, { kind: 'nut', x: 1000, n: 2 });
  D.hints.push({ x: 40, w: 230, text: '{down} — красться. За машиной присел — не видно. Бегом шумно!' });
  D.hints.push({ x: 270, w: 200, text: 'На машину можно запрыгнуть {jump} и пройти по крыше.' });
  D.hints.push({ x: 470, w: 260, text: 'Подкрадись к спецназовцу СЗАДИ и нажми {punch} — вырубишь.' });
  D.hints.push({ x: 840, w: 260, text: 'Кинь гайку {throw} в машину: сработает сигналка, охранник пойдёт проверять.' });
  // трое у люка: в обход — по канализации
  for (const [x, f] of [[1450, 1], [1500, -1], [1555, -1]]) D.guards.push({ id: 'a3' + x, x, kind: 'post', facing: f, range: 180 });
  prop('pr7', 9, 1300); D.ints.push({ x: 1300, y: GY, r: 26, label: 'СПУСТИТЬСЯ В ЛЮК', act: run => run.goSewer() });
  D.hints.push({ x: 1220, w: 150, text: 'Там трое — не пройти. Пригнись {down} и к люку: {up} — обойдём по канализации.' });
  prop('pr7', 9, 1700); car(4, 1790, true);
  // ===== забор с дырой и разбитым Матизом Граблионка =====
  D.plats.push({ x: L7.FENCE_X - 8, y: GY - 98, w: 16, h: 98, oneway: false });
  prop('po7', 1, L7.FENCE_X - 90, { front: false }); prop('po7', 2, L7.FENCE_X, { front: true }); prop('po7', 1, L7.FENCE_X + 90);
  prop('l5msd', 0, L7.FENCE_X - 128, { rot: -0.22, s: 0.55, behind: true });
  D.ints.push({ x: L7.FENCE_X - 30, y: GY, r: 34, label: 'ПРОЛЕЗТЬ В ДЫРУ', act: run => run.crawlHole() });
  D.hints.push({ x: 1800, w: 100, text: 'Это же золотой Матиз Граблионка!.. Дыра в заборе — {up}.' });

  // ===== B. БОКОВАЯ СТЕНА: камеры, карнизы, собака, дрон =====
  const B0 = L7.FENCE_X + 60;
  D.cps.push({ x: B0, y: GY });
  D.hints.push({ x: B0 - 20, w: 240, text: 'Камеры! Свет нельзя пересекать. Лезь по трубе {up} на кондиционеры — сверху не видят.' });
  const ac = (x, y) => { prop('po7', 0, x, { y: y + 34 }); D.plats.push({ x: x - 20, y, w: 40, h: 8, oneway: true }); };
  const pipe = (x, top) => { prop('po7', 4, x, { y: GY + 4 }); D.ladders.push({ x: x - 10, y: top, w: 20, h: GY - top }); ac(x, top); };   // наверху трубы — кондиционер-площадка
  pipe(B0 + 150, 186); for (let i = 0; i < 9; i++) ac(B0 + 194 + i * 44, 186);   // ряд кондиционеров почти вплотную — идти поверху
  D.cams.push({ x: B0 + 330, y: 214, a0: 1.95, a1: 1.15, per: 5, range: 150, group: 'camsB' });
  pipe(B0 + 590, 186);
  hide('pr7', 0, 1, B0 + 660, 'СПРЯТАТЬСЯ В БИОТУАЛЕТ');
  cover('pr7', 4, B0 + 760); prop('pr7', 5, B0 + 800);
  D.dogs.push({ id: 'bd1', x: B0 + 900, x1: B0 + 820, x2: B0 + 1100 });
  D.pickups.push({ kind: 'bone', x: B0 + 520, n: 2 });
  D.hints.push({ x: B0 + 620, w: 220, text: 'Собака учует вблизи даже за ящиком. Кинь кость {throw} — отвлечётся.' });
  hide('pr7', 2, 3, B0 + 1180, 'ЩИТОК: ВЫКЛЮЧИТЬ КАМЕРЫ');
  D.hides[D.hides.length - 1].mg = 'wires';
  D.cams.push({ x: B0 + 1300, y: 214, a0: 2.1, a1: 1.0, per: 4.5, range: 170, group: 'camsB' });
  D.cams.push({ x: B0 + 1420, y: 214, a0: 2.0, a1: 1.1, per: 3.5, range: 160, group: 'camsB', ph: 1.7 });
  D.hints.push({ x: B0 + 1100, w: 140, text: 'Щиток! {up} — соедини провода, камеры погаснут на 15 секунд.' });
  D.drones.push({ x: B0 + 1550, x1: B0 + 1460, x2: B0 + 1680, y: 110, sp: 55 });
  cover('po7', 3, B0 + 1500); hide('pr7', 0, 1, B0 + 1610, 'СПРЯТАТЬСЯ В БИОТУАЛЕТ');
  pipe(L7.YARD_X - 30, 186);   // шов фонов прячет труба

  // ===== C. ДВОР: лазеры, пульт, спецназ, собака, дрон =====
  const C0 = L7.YARD_X + 30;
  D.cps.push({ x: C0, y: GY });
  D.hints.push({ x: C0, w: 200, text: 'Лазеры! Мигающий — проходи, когда погаснет. Ездящий — проскочи за ним.' });
  D.lasers.push({ x: C0 + 160, blink: [1.4, 1.1] });
  D.lasers.push({ x: C0 + 260, x1: C0 + 230, x2: C0 + 420, sp: 45 });
  cover('po7', 5, C0 + 480);
  D.guards.push({ id: 'c1', x: C0 + 620, x1: C0 + 540, x2: C0 + 860, facing: -1 });
  cover('pr7', 4, C0 + 700);
  prop('po7', 12, C0 + 940); D.ints.push({ x: C0 + 940, y: GY, r: 26, label: 'ПУЛЬТ ЛАЗЕРОВ', act: run => run.startMG('lasers'), cond: run => !run.flags.lasC });
  D.hints.push({ x: C0 + 870, w: 120, text: 'Пульт лазеров! {up} — выключи лучи по схеме.' });
  for (const x of [1030, 1070, 1110]) D.lasers.push({ x: C0 + x, group: 'lasC' });
  D.lasers.push({ x: C0 + 1160, group: 'lasC', blink: [0.9, 0.9] });
  hide('pr7', 0, 1, C0 + 1250, 'СПРЯТАТЬСЯ В БИОТУАЛЕТ');
  D.cps.push({ x: C0 + 1200, y: GY });
  D.guards.push({ id: 'c2', x: C0 + 1420, kind: 'post', facing: -1 });
  D.dogs.push({ id: 'cd1', x: C0 + 1560, x1: C0 + 1480, x2: C0 + 1720 });
  D.pickups.push({ kind: 'bone', x: C0 + 1300, n: 1 }, { kind: 'nut', x: C0 + 1180, n: 2 });
  cover('po7', 5, C0 + 1500); car(3, C0 + 1640);
  D.drones.push({ x: C0 + 1700, x1: C0 + 1620, x2: C0 + 1880, y: 105, sp: 60 });
  D.cams.push({ x: C0 + 1790, y: 200, a0: 2.2, a1: 1.3, per: 4, range: 150 });
  // ворота с конвейером: подслушать
  prop('bus7', 7, L7.GATE_X); prop('bus7', 9, L7.GATE_X, { y: GY - 108 });
  D.ints.push({ x: L7.GATE_X - 70, y: GY, r: 50, label: 'ВЫГЛЯНУТЬ ИЗ-ЗА ЯЩИКА', act: run => run.reachGate() });
  cover('pr7', 4, L7.GATE_X - 90);
  D.plats.push({ x: L7.GATE_X + 40, y: -200, w: 400, h: 600, oneway: false });

  // свет фонарей и прочий реквизит
  for (const x of [B0 + 60, B0 + 1000, C0 + 120, C0 + 820, C0 + 1400]) prop('po7', 14, x);
  // передний план (тёмные предметы у камеры)
  const F = [[0, 120], [2, 520], [1, 860], [5, 1230], [8, 1600], [3, 2100], [4, 2500], [9, 2860], [0, 3200], [8, 3500], [3, 3900], [5, 4300], [1, 4700], [2, 5000], [4, 5300]];
  for (const [fr, x] of F) D.fg.push({ fr, x, s: 1 });
  return D;
};

// ===== канализация: бобры, выход за спинами троих =====
L7.buildSewer = function () {
  const GY = L7.GY, D = mk7(1500);
  D.plats.push({ x: 0, y: GY, w: 1500, h: 80, oneway: false });
  D.props.push({ sheet: 'po7', fr: 9, x: 70, y: GY, s: 1 }, { sheet: 'po7', fr: 9, x: 1420, y: GY, s: 1 });
  for (const [x, a, b, rat] of [[380, 260, 520, 1], [520, 400, 640, 1], [780, 640, 920], [1000, 900, 1150, 1], [1180, 1040, 1300]]) D.beavers.push({ x, x1: a, x2: b, rat });
  D.hints.push({ x: 60, w: 300, text: 'Крысы и бобры! Тут можно драться: {punch}. Выход — люк в конце.' });
  D.ints.push({ x: 1420, y: GY, r: 30, label: 'ВЫЛЕЗТИ', act: run => run.leaveSewer(), cond: run => run.beavers.length === 0 });
  D.ints.push({ x: 1420, y: GY, r: 30, label: 'СНАЧАЛА РАЗБЕРИСЬ С ЖИВНОСТЬЮ', act: () => {}, cond: run => run.beavers.length > 0 });
  return D;
};

// ===== коридоры заводоуправления =====
L7.IN_W = 3300;
L7.buildIn = function () {
  const GY = L7.GY, D = mk7(L7.IN_W);
  const prop = (sheet, fr, x, o = {}) => { const p = Object.assign({ sheet, fr, x, y: GY, s: 1 }, o); D.props.push(p); return p; };
  const cover = (sheet, fr, x) => { prop(sheet, fr, x); const [w, h] = Spr.size(sheet, fr); D.covers.push({ x1: x - w / 2 + 4, x2: x + w / 2 - 4, y: GY, h }); };
  const hide = (fr, frOpen, x, label) => { const p = prop('pi7', fr, x); D.hides.push({ x, y: GY, w: Spr.size('pi7', fr)[0], kind: 'booth', label, p, frClosed: fr, frOpen }); };
  D.plats.push({ x: 0, y: GY, w: L7.IN_W, h: 80, oneway: false });
  D.plats.push({ x: -400, y: -200, w: 400, h: 600, oneway: false });
  D.cps.push({ x: 70, y: GY });
  D.hints.push({ x: 40, w: 300, text: 'Я внутри. Где-то тут главный зал... Прячься в шкафы {up}.' });
  cover('pi7', 2, 260); prop('pi7', 3, 330);
  D.guards.push({ id: 'i1', x: 560, x1: 440, x2: 820, facing: 1 });
  hide(0, 1, 640, 'СПРЯТАТЬСЯ В ШКАФ');
  D.cams.push({ x: 1000, y: 196, a0: 2.0, a1: 1.15, per: 4.5, range: 160, sheet: 'pi7', fr: 11 });
  cover('pi7', 13, 1080);
  D.lasers.push({ x: 1200, blink: [1.2, 1.0] }); D.lasers.push({ x: 1280, blink: [1.2, 1.0], ph: 1.1 });
  hide(7, 8, 1380, 'СПРЯТАТЬСЯ В КАБИНКУ');
  D.cps.push({ x: 1460, y: GY });
  // трое у двери — в обход по вентиляции
  prop('pi7', 9, 1540, { y: GY - 40 });
  D.ints.push({ x: 1540, y: GY, r: 30, label: 'ЛЕЗТЬ В ВЕНТИЛЯЦИЮ', act: run => run.goVent(2060) });
  for (const [x, f] of [[1760, 1], [1820, -1], [1880, -1]]) D.guards.push({ id: 'iv' + x, x, kind: 'post', facing: f, range: 200 });
  prop('pi7', 6, 1640, { front: true });
  prop('pi7', 9, 2060, { y: GY - 40 });
  D.cps.push({ x: 2100, y: GY });
  // кабинет с запиской
  prop('pi7', 5, 2240); D.ints.push({ x: 2240, y: GY, r: 30, label: 'ПОРЫТЬСЯ В КАБИНЕТЕ', act: run => run.readNote(), cond: run => !run.flags.note });
  D.guards.push({ id: 'i2', x: 2500, x1: 2340, x2: 2780, facing: -1 });
  D.cams.push({ x: 2620, y: 196, a0: 2.1, a1: 1.1, per: 4, range: 160, sheet: 'pi7', fr: 11, ph: 2 });
  hide(0, 1, 2420, 'СПРЯТАТЬСЯ В ШКАФ'); cover('pi7', 2, 2700); prop('pi7', 3, 2860);
  prop('pi7', 12, 3000);
  prop('pi7', 4, 3160); prop('pi7', 10, 3110, { y: GY - 50 });
  D.ints.push({ x: 3130, y: GY, r: 40, label: 'КОДОВЫЙ ЗАМОК', act: run => run.flags.note ? run.startMG('code') : run.lockedHall() });
  D.hints.push({ x: 2950, w: 150, text: 'Дверь в главный зал — на кодовом замке. Код где-то записан...' });
  for (const [fr, x] of [[6, 200], [7, 900], [6, 1500], [7, 2300], [6, 2950]]) D.fg.push({ fr, x, s: 1 });
  return D;
};
