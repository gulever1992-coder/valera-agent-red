// Знаковые здания ставятся ВПЛОТНУЮ К МАРШРУТУ: axis h: y=c, v: x=c; t — позиция вдоль дороги; side -1 = север|запад, +1 = юг|восток.
// fw — ширина фасада, dp — глубина, H — высота, e — фасад-элевация (атлас e#), tint — окраска, x — доп. поля основной части.
L5.landAt = function (o) {
  const hor = o.axis === 'h', off = 10.6 + o.dp / 22, side = o.side;
  const ax = hor ? o.t : o.c + side * off, ay = hor ? o.c + side * off : o.t;
  const front = hor ? (side < 0 ? 'S' : 'N') : (side < 0 ? 'E' : 'W');
  const w = hor ? o.fw : o.dp, d = hor ? o.dp : o.fw;
  const main = Object.assign({ dx: 0, dy: 0, w, d, H: o.H, e: o.e, tex: o.tex || 't19', tint: o.tint }, o.x || {});
  return { name: o.name, ax, ay, front, parts: [main].concat(o.extra || []), feats: o.feats || [], sign: o.sign };
};
L5.LAND = [
  // Южная улица (с востока на запад, y=520)
  { axis: 'h', c: 520, t: 985, side: -1, name: 'РЫНОК «ЮЖНЫЙ»', fw: 300, dp: 110, H: 28, e: 'e6', tint: '#b09060', x: { sign: 'ЮЖНЫЙ', signColor: '#40a030' }, feats: ['awnings'] },
  { axis: 'h', c: 520, t: 940, side: 1, name: 'РАДУГА', fw: 290, dp: 110, H: 70, e: 'e8', tint: '#e8dcc0', x: { sign: 'РАДУГА', signColor: '#e04040' }, feats: ['antenna'] },
  // проспект Вождя (на север, x=855)
  { axis: 'v', c: 855, t: 445, side: 1, name: 'ДВОРЕЦ «СТРОИТЕЛЬ»', fw: 230, dp: 120, H: 44, e: 'e3', tint: '#5878d0', x: { sign: 'СТРОЙКА' }, feats: ['masts'] },
  { axis: 'v', c: 855, t: 370, side: -1, name: 'ТЦ «ГРАНД»', fw: 260, dp: 110, H: 76, e: 'e9', tint: '#d8b090', x: { sign: 'ГРАНД', signColor: '#e03030' } },
  { axis: 'v', c: 855, t: 300, side: 1, name: 'КИНО «РОДИНА»', fw: 240, dp: 130, H: 72, e: 'e12', tint: '#d8e0d0', x: { sign: 'РОДИНА', signColor: '#e8f4ff', pitch: 16, roofTile: 8 } },
  // улица Ленина (на запад, y=245) и Сквер ветеранов
  { axis: 'h', c: 245, t: 780, side: -1, name: 'МУЗЕЙ', fw: 280, dp: 100, H: 46, e: 'e2', tint: '#c06050', x: { pitch: 14, roofTile: 8 }, feats: ['chimneys'] },
  { axis: 'h', c: 245, t: 690, side: 1, name: 'ДОМ-ДУГА', fw: 520, dp: 110, H: 150, e: 'e13', tint: '#e6e6e0', feats: ['antenna', 'vents'] },
  { axis: 'h', c: 245, t: 625, side: -1, name: 'СТЕЛА', fw: 100, dp: 90, H: 210, e: 'e17', tint: '#3a3a40', x: { spire: true } },
  // Железнодорожная (на запад, y=325)
  { axis: 'h', c: 325, t: 520, side: -1, name: 'БОЛЬНИЦА', fw: 360, dp: 110, H: 70, e: 'e10', tint: '#e8d8a0', x: { portico: true }, feats: ['vents'] },
  { axis: 'h', c: 325, t: 500, side: 1, name: 'ТЕАТР', fw: 300, dp: 130, H: 66, e: 'e14', tint: '#b09080' },
  // Аллея Молодёжи (на юг, x=430) и кинотеатр «Россия»
  { axis: 'v', c: 430, t: 395, side: 1, name: 'КИНО «РОССИЯ»', fw: 250, dp: 120, H: 92, e: 'e1', tint: '#e6e6e0', x: { sign: 'РОССИЯ', signColor: '#d02818', signRot: true }, feats: ['mast'] },
  { axis: 'v', c: 430, t: 480, side: -1, name: 'МАКСИ', fw: 300, dp: 150, H: 42, e: 'e4', tint: '#e05030', x: { sign: 'МАКСИ', signColor: '#ffe030', signRot: true } },
  { axis: 'v', c: 430, t: 580, side: 1, name: 'ПАНЕЛЬНАЯ 9-ЭТАЖКА', fw: 210, dp: 100, H: 150, e: 'e15', tint: '#e8c8c8', feats: ['machine', 'antenna'] },
  // Ломоносова (на запад, y=640): ЦУМ
  { axis: 'h', c: 640, t: 310, side: -1, name: 'ЦУМ', fw: 340, dp: 130, H: 120, e: 'e0', tint: '#cfd2d6', x: { sign: 'ЦУМ' }, extra: [{ dx: 40, dy: 82, w: 110, d: 56, H: 26, tex: 't19', tint: '#7a6048', glass: true }] },
  // шоссе у воды (на север, x=190): порт и верфь
  { axis: 'v', c: 190, t: 560, side: 1, name: 'ПОРТ', fw: 170, dp: 90, H: 190, e: 'e16', tint: '#b8a040', feats: ['crane'] },
  { axis: 'v', c: 190, t: 460, side: 1, name: 'ВЕРФЬ: СПУСК', fw: 330, dp: 100, H: 62, e: 'e18', tint: '#506070', feats: ['crane'] },
  { axis: 'v', c: 190, t: 350, side: 1, name: 'СБОРОЧНЫЙ ЦЕХ', fw: 400, dp: 140, H: 120, e: 'e19', tint: '#b8b098', feats: ['crane', 'vents'] },
  { axis: 'h', c: 215, t: 270, side: -1, name: 'ДК «СТРОИТЕЛЬ»', fw: 220, dp: 100, H: 40, e: 'e3', tint: '#5878d0' },
  // финал: заводоуправление (x=395, на север)
  { axis: 'h', c: 142, t: 395, side: -1, name: 'ЗАВОДОУПРАВЛЕНИЕ «СЕВМОЛОТ»', fw: 470, dp: 120, H: 112, e: 'e11', tint: '#b86048', x: { sign: 'СЕВЕРНОЕ МАШИНОСТРОИТЕЛЬНОЕ ПРЕДПРИЯТИЕ' }, feats: ['flags'] },
].map(o => o.parts ? o : L5.landAt(o));
