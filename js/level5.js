'use strict';
// ============ УРОВЕНЬ 5: «ПОГОНЯ» — вид сверху с псевдообъёмом: маршрут, мир, здания-«коробки» ============
const L5 = {};
G.L5 = L5;
L5.img = {};
const K5 = 11; // 1 пиксель спутникового снимка = 11 пикселей мира
const mulberry = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const aDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
L5.has = n => !!Spr.sheets[n];
L5.PERSP = 270;                                  // сила перспективы: точка на высоте z уезжает от центра экрана в (1+z/PERSP) раз
L5.zk = z => 1 + z / L5.PERSP;

// ---------- маршрут по схеме с карты (координаты — пиксели снимка) ----------
L5.ROUTE_IMG = [[1075, 520], [855, 520], [855, 245], [610, 245], [610, 325], [430, 325], [430, 640], [190, 640], [190, 215], [395, 215], [395, 140]];
L5.NAMES = [[0, 'ЮЖНАЯ УЛИЦА'], [1, 'ПРОСПЕКТ ВОЖДЯ'], [3, 'СКВЕР ВЕТЕРАНОВ'], [5, 'АЛЛЕЯ МОЛОДЁЖИ'], [6, 'УЛИЦА ЛОМОНОСОВА'], [7, 'ВЫБОРГСКОЕ ШОССЕ'], [9, 'К ЗАВОДУ «СЕВМОЛОТ»']];
L5.HW = 64; L5.SW = 36;
L5.ROUTE = L5.ROUTE_IMG.map(p => [p[0] * K5, p[1] * K5]);
L5.segs = [];
{
  let s = 0;
  for (let i = 0; i < L5.ROUTE.length - 1; i++) {
    const [ax, ay] = L5.ROUTE[i], [bx, by] = L5.ROUTE[i + 1], len = Math.hypot(bx - ax, by - ay);
    L5.segs.push({ ax, ay, bx, by, len, dx: (bx - ax) / len, dy: (by - ay) / len, s0: s, ang: Math.atan2(by - ay, bx - ax) });
    s += len;
  }
  L5.LEN = s;
  L5.NODE_S = [0]; for (const g of L5.segs) L5.NODE_S.push(g.s0 + g.len);
}
L5.S_START = 560;
L5.S_RACE = Math.round(L5.LEN / 2);      // линия старта гонки — ровно середина маршрута (там и договариваются погоняться)
L5.S_MATCH = L5.S_RACE - 1170;      // здесь появляется Граблионок и догоняет
L5.S_END = L5.LEN - 170;            // финиш у заводоуправления
L5.at = function (s, o = {}) {
  s = U.clamp(s, 0, L5.LEN);
  let g = L5.segs[L5.segs.length - 1];
  for (const q of L5.segs) if (s <= q.s0 + q.len) { g = q; break; }
  const t = s - g.s0, lane = o.lane || 0;
  return { x: g.ax + g.dx * t - g.dy * lane, y: g.ay + g.dy * t + g.dx * lane, ang: g.ang, dx: g.dx, dy: g.dy, nx: -g.dy, ny: g.dx };
};
L5.proj = function (x, y, hint, win = 900) {
  let best = null;
  for (const g of L5.segs) {
    if (hint != null && (g.s0 > hint + win || g.s0 + g.len < hint - win)) continue;
    const t = U.clamp((x - g.ax) * g.dx + (y - g.ay) * g.dy, 0, g.len);
    const px = g.ax + g.dx * t, py = g.ay + g.dy * t, d = Math.hypot(x - px, y - py);
    if (!best || d < best.d) best = { s: g.s0 + t, d, side: (x - px) * -g.dy + (y - py) * g.dx };
  }
  return best || { s: hint || 0, d: 0, side: 0 };
};

// ---------- сетка для быстрых запросов ----------
L5.Grid = class {
  constructor(cell = 512) { this.cell = cell; this.m = new Map(); this.mark = 0; }
  add(o, x0, y0, x1, y1) {
    const c = this.cell;
    for (let gx = Math.floor(x0 / c); gx <= Math.floor(x1 / c); gx++) for (let gy = Math.floor(y0 / c); gy <= Math.floor(y1 / c); gy++) {
      const k = gx * 100003 + gy; let a = this.m.get(k); if (!a) this.m.set(k, a = []); a.push(o);
    }
  }
  remove(o) { for (const a of this.m.values()) { const i = a.indexOf(o); if (i >= 0) a.splice(i, 1); } }
  query(x0, y0, x1, y1, fn) {
    const c = this.cell; this.mark++;
    for (let gx = Math.floor(x0 / c); gx <= Math.floor(x1 / c); gx++) for (let gy = Math.floor(y0 / c); gy <= Math.floor(y1 / c); gy++) {
      const a = this.m.get(gx * 100003 + gy); if (!a) continue;
      for (const o of a) { if (o._m === this.mark) continue; o._m = this.mark; fn(o); }
    }
  }
};

// ---------- загрузка картинок ----------
L5.load = async function () {
  const names = [['l5_tiles', '.png'], ['l5_tiles2', '.png'], ['l5_facades', '.png'], ['l5_elev', '.png'], ['l5_roofs', '.png'], ['l5_rail', '.png'], ['l5_hq', '.jpg'], ['l5_cliff_bg', '.jpg'], ['l5_comic_end1', '.jpg'], ['l5_comic_end2', '.jpg'], ['l5_card', '.jpg']];
  await Promise.all(names.map(async ([k, ext]) => { try { L5.img[k] = await G.loadImage('assets/' + k + ext); } catch (e) {} }));
  L5.tc = [];
  for (const [key, off] of [['l5_tiles', 0], ['l5_tiles2', 20]]) {
    if (!L5.img[key]) continue;
    for (let i = 0; i < 20; i++) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 128;
      cv.getContext('2d').drawImage(L5.img[key], (i % 5) * 128, Math.floor(i / 5) * 128, 128, 128, 0, 0, 128, 128);
      L5.tc[off + i] = cv;
    }
  }
  try { L5.kopImg = await G.loadImage('assets/l5_kop.png'); } catch (e) {}
  G.portraits = G.portraits || {};
  for (const k of ['cop', 'cop2', 'kop', 'kop2']) { try { G.portraits[k] = await G.loadImage('assets/spr/p_' + k + '.png'); } catch (e) {} }
  for (const k of ['vova', 'valera4']) if (!G.portraits[k]) { try { G.portraits[k] = await G.loadImage('assets/spr/p_' + k + '.png'); } catch (e) {} }
  G.portraits = G.portraits || {};
  try { G.portraits.grab = await G.loadImage('assets/spr/p_grab.png'); } catch (e) {}
  if (new URLSearchParams(location.search).has('stub') && window.STUB_SPRITES) { // заглушки вместо ненарисованного арта (только для проверки кода)
    await Promise.all(Object.entries(window.STUB_SPRITES).map(async ([n, s]) => { if (!Spr.sheets[n]) Spr.sheets[n] = { img: await G.loadImage(s.img), f: s.f }; }));
  }
};
Object.assign(WHO, {
  grab: { name: 'ГРАБЛИОНОК', color: '#e8c040', voice: 140 },
  cop: { name: 'МИЛИЦИЯ', color: '#7aa8ff', voice: 130 },
  vip: { name: 'ГОСТЬ СЪЕЗДА', color: '#e8d8a0', voice: 220 },
});
L5.TILECOL = { 0: '#3a3d42', 4: '#8a8a82', 5: '#6b6a2e', 6: '#6a5a3c', 7: '#1c3a52', 8: '#5a5e66', 9: '#7a4030', 10: '#6e6e66', 11: '#9a8a6a', 12: '#7a4a1a', 14: '#6a6c70', 15: '#3e4a2c', 16: '#7c7a74', 17: '#8a4a38', 18: '#7a5a48', 19: '#6a6e74' };
L5.getPat = function (c, i) {
  L5.pat = L5.pat || {};
  if (L5.pat[i] !== undefined) return L5.pat[i];
  let p;
  if (L5.tc && L5.tc[i]) { p = c.createPattern(L5.tc[i], 'repeat'); try { p.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, 0, 0])); } catch (e) {} } else p = L5.TILECOL[i % 20] || '#555';
  return L5.pat[i] = p;
};
// текстура стены: {img, sx, sy, sw, sh}; id: 'f0'..'f15' (фасады домов), 'e0'..'e7' (фасады знаковых зданий), 't16'..'t19' (запасные плитки)
L5.tex = function (id) {
  L5._tex = L5._tex || {};
  if (L5._tex[id]) return L5._tex[id];
  let t = null;
  const k = +id.slice(1);
  if (id[0] === 'f' && L5.img.l5_facades) t = { img: L5.img.l5_facades, sx: (k % 4) * 256, sy: Math.floor(k / 4) * 170, sw: 256, sh: 170 };
  else if (id[0] === 'e' && L5.img.l5_elev) t = { img: L5.img.l5_elev, sx: (k % 4) * 512, sy: Math.floor(k / 4) * 340, sw: 512, sh: 340 };
  else if (id[0] === 'r' && L5.img.l5_roofs) t = { img: L5.img.l5_roofs, sx: (k % 2) * 640, sy: Math.floor(k / 2) * 240, sw: 640, sh: 240 };
  else if (id[0] === 't' && L5.tc && L5.tc[k]) t = { img: L5.tc[k], sx: 0, sy: 0, sw: 128, sh: 128 };
  return L5._tex[id] = t || { img: null, sx: 0, sy: 0, sw: 1, sh: 1, color: L5.TILECOL[k] || '#6a6a6a' };
};

// =====================================================================
// СПРАВОЧНИКИ ПО ВНЕШНЕМУ ВИДУ
// =====================================================================
// типы домов: фасад (атлас f#, запасная плитка t#), размеры, высота, крыша, детали
L5.HTYPES = [
  { n: 'panel5', f: 'f0', t: 't16', w: [220, 330], d: [78, 96], H: [62, 72], roof: 8 },
  { n: 'panel5b', f: 'f1', t: 't16', w: [200, 300], d: [78, 96], H: [62, 72], roof: 8, tint: '#c9a050' },
  { n: 'brick4', f: 'f2', t: 't17', w: [150, 230], d: [80, 100], H: [50, 58], roof: 9 },
  { n: 'stalin', f: 'f3', t: 't18', w: [200, 280], d: [90, 110], H: [64, 76], roof: 8, pitch: 12, tint: '#d0c070' },
  { n: 'tower9', f: 'f4', t: 't16', w: [110, 130], d: [96, 110], H: [112, 130], roof: 8, feats: ['machine', 'antenna'], tint: '#7aa0c8' },
  { n: 'shops', f: 'f5', t: 't18', w: [180, 260], d: [80, 100], H: [42, 52], roof: 9, feats: ['vents'] },
  { n: 'garages', f: 'f6', t: 't19', w: [220, 320], d: [64, 76], H: [34, 40], roof: 8 },
  { n: 'wood', f: 'f7', t: 't17', w: [110, 150], d: [84, 104], H: [38, 46], roof: 9, pitch: 14, tint: '#b08050' },
  { n: 'school', f: 'f8', t: 't18', w: [240, 300], d: [80, 100], H: [42, 50], roof: 8, feats: ['flag'], tint: '#e0d0a0' },
  { n: 'kinder', f: 'f9', t: 't18', w: [190, 240], d: [76, 92], H: [36, 44], roof: 9, tint: '#e8a0b0' },
  { n: 'boiler', f: 'f10', t: 't19', w: [140, 190], d: [80, 100], H: [44, 52], roof: 8, feats: ['chimney'] },
  { n: 'church', f: 'f11', t: 't16', w: [110, 130], d: [100, 120], H: [74, 86], roof: 9, feats: ['dome'], tint: '#f0f0e8' },
  { n: 'office', f: 'f12', t: 't19', w: [160, 220], d: [70, 90], H: [70, 86], roof: 8, feats: ['vents', 'antenna'], tint: '#80a0b8' },
  { n: 'hospital', f: 'f13', t: 't18', w: [200, 260], d: [80, 100], H: [54, 64], roof: 8, feats: ['vents'], tint: '#e8e0d0' },
  { n: 'hotel', f: 'f14', t: 't18', w: [150, 200], d: [70, 90], H: [60, 72], roof: 8, feats: ['neon'], tint: '#a090c0' },
  { n: 'hangar', f: 'f15', t: 't19', w: [260, 360], d: [100, 130], H: [50, 60], roof: 14 },
  { n: 'pink9', f: 'f16', t: 't16', w: [200, 280], d: [84, 100], H: [100, 124], roof: 8, feats: ['machine', 'antenna'] },
  { n: 'blue9', f: 'f17', t: 't16', w: [200, 280], d: [84, 100], H: [100, 124], roof: 8, feats: ['machine'] },
  { n: 'white9', f: 'f18', t: 't16', w: [120, 140], d: [90, 104], H: [118, 140], roof: 8, feats: ['antenna'] },
  { n: 'khrush', f: 'f19', t: 't17', w: [180, 260], d: [70, 84], H: [50, 58], roof: 9, pitch: 8 },
  { n: 'khrushY', f: 'f20', t: 't18', w: [180, 260], d: [70, 84], H: [50, 58], roof: 9, pitch: 8 },
  { n: 'brick12', f: 'f21', t: 't17', w: [116, 136], d: [96, 112], H: [124, 150], roof: 8, feats: ['machine', 'antenna'] },
  { n: 'longblock', f: 'f22', t: 't16', w: [340, 460], d: [84, 100], H: [96, 116], roof: 8, feats: ['vents', 'antenna'] },
  { n: 'barrack', f: 'f23', t: 't17', w: [150, 210], d: [60, 76], H: [34, 40], roof: 9, pitch: 12 },
  { n: 'canteen', f: 'f24', t: 't17', w: [150, 200], d: [70, 90], H: [38, 46], roof: 8, feats: ['chimney'] },
  { n: 'bank', f: 'f25', t: 't19', w: [160, 200], d: [76, 92], H: [48, 58], roof: 8 },
  { n: 'pharm', f: 'f26', t: 't18', w: [170, 230], d: [76, 92], H: [60, 72], roof: 8, feats: ['vents'] },
  { n: 'busst', f: 'f27', t: 't18', w: [180, 240], d: [70, 90], H: [30, 38], roof: 8 },
  { n: 'carwash', f: 'f28', t: 't19', w: [160, 200], d: [80, 96], H: [38, 46], roof: 14 },
  { n: 'college', f: 'f29', t: 't18', w: [220, 300], d: [80, 100], H: [54, 64], roof: 8, feats: ['flag'] },
  { n: 'pavil', f: 'f30', t: 't19', w: [180, 230], d: [76, 92], H: [36, 44], roof: 14, feats: ['awnings'] },
  { n: 'newb', f: 'f31', t: 't16', w: [120, 150], d: [96, 112], H: [110, 140], roof: 8, feats: ['machine'] },
];
L5.ZONEW = { // вес типа дома по району
  center: [2, 1, 3, 3, 1, 3, 0.1, 0, 1, 0.6, 0, 0.3, 2, 1, 1, 0, 1.5, 1.2, 1.2, 0.8, 0.8, 1, 1.5, 0, 0.5, 1.2, 1.2, 0.7, 0.2, 0.4, 0.8, 1],
  resid: [4, 3, 2, 0.7, 3, 1, 0.2, 0.5, 1, 2, 0, 0, 0.3, 0.7, 0, 0, 3, 2.4, 2, 2.4, 2, 1.5, 1.2, 0.6, 0.3, 0.2, 0.6, 0.3, 0.1, 0.4, 0.5, 2],
  industrial: [0.5, 0, 0, 0, 0, 0, 0.8, 0, 0, 0, 3, 0, 0.5, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.6, 0, 0, 0, 1, 0, 0.5, 0],
  private: [0, 0, 0, 0, 0, 0.5, 1, 5, 0, 0, 0, 0.6, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.3, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0.3, 0],
};
// знаковые здания по карте (реальные здания Северодвинска, в шуточной манере). Координаты — пиксели снимка.
// parts: dx,dy — смещение центра от якоря (мир), w,d — размеры основания, H — высота, e — фасад-элевация (атлас e#), tint — окраска
// Знаковые здания ставятся ВПЛОТНУЮ К МАРШРУТУ: axis h: y=c, v: x=c; t — позиция вдоль дороги; side -1 = север|запад, +1 = юг|восток.
// fw — ширина фасада, dp — глубина, H — высота, e — фасад-элевация (атлас e#), tint — окраска, x — доп. поля основной части.
L5.landAt = function (o) {
  const hor = o.axis === 'h', off = 10.6 + o.dp / 22, side = o.side;
  const ax = hor ? o.t : o.c + side * off, ay = hor ? o.c + side * off : o.t;
  const front = hor ? (side < 0 ? 'S' : 'N') : (side < 0 ? 'E' : 'W');
  const w = hor ? o.fw : o.dp, d = hor ? o.dp : o.fw;
  const main = Object.assign({ dx: 0, dy: 0, w, d, H: o.H, e: o.e, r: o.r, tex: o.tex || 't19', tint: o.tint }, o.x || {});
  return { name: o.name, ax, ay, front, parts: [main].concat(o.extra || []), feats: o.feats || [], sign: o.sign };
};
L5.LAND = [
  // Южная улица (с востока на запад, y=520)
  { axis: 'h', c: 520, t: 985, side: -1, r: 'r6', name: 'РЫНОК «ЮЖНЫЙ»', fw: 300, dp: 110, H: 28, e: 'e6', tint: '#b09060', x: { sign: 'ЮЖНЫЙ', signColor: '#40a030' }, feats: ['awnings'] },
  { axis: 'h', c: 520, t: 940, side: 1, r: 'r7', name: 'РАДУГА', fw: 290, dp: 110, H: 70, e: 'e8', tint: '#e8dcc0', x: { sign: 'РАДУГА', signColor: '#e04040' }, feats: ['antenna'] },
  // проспект Вождя (на север, x=855)
  { axis: 'v', c: 855, t: 445, side: 1, r: 'r3', name: 'ДВОРЕЦ «СТРОИТЕЛЬ»', fw: 230, dp: 120, H: 44, e: 'e3', tint: '#5878d0', x: { sign: 'СТРОЙКА' }, feats: ['masts'] },
  { axis: 'v', c: 855, t: 370, side: -1, r: 'r8', name: 'ТЦ «ГРАНД»', fw: 260, dp: 110, H: 76, e: 'e9', tint: '#d8b090', x: { sign: 'ГРАНД', signColor: '#e03030' } },
  { axis: 'v', c: 855, t: 300, side: 1, r: 'r10', name: 'КИНО «РОДИНА»', fw: 240, dp: 130, H: 72, e: 'e12', tint: '#d8e0d0', x: { sign: 'РОДИНА', signColor: '#e8f4ff', pitch: 16, roofTile: 8 } },
  // улица Ленина (на запад, y=245) и Сквер ветеранов
  { axis: 'h', c: 245, t: 780, side: -1, r: 'r2', name: 'МУЗЕЙ', fw: 280, dp: 100, H: 46, e: 'e2', tint: '#c06050', x: { pitch: 14, roofTile: 8 }, feats: ['chimneys'] },
  { axis: 'h', c: 245, t: 690, side: 1, r: 'r11', name: 'ДОМ-ДУГА', fw: 520, dp: 110, H: 150, e: 'e13', tint: '#e6e6e0', feats: ['antenna', 'vents'] },
  { axis: 'h', c: 245, t: 625, side: -1, r: 'r17', name: 'СТЕЛА', fw: 100, dp: 90, H: 210, e: 'e19', tint: '#3a3a40', x: { spire: true } },
  // Железнодорожная (на запад, y=325)
  { axis: 'h', c: 325, t: 520, side: -1, r: 'r9', name: 'БОЛЬНИЦА', fw: 360, dp: 110, H: 70, e: 'e10', tint: '#e8d8a0', x: { portico: true }, feats: ['vents'] },
  { axis: 'h', c: 325, t: 500, side: 1, r: 'r12', name: 'ТЕАТР', fw: 300, dp: 130, H: 66, e: 'e14', tint: '#b09080' },
  // Аллея Молодёжи (на юг, x=430) и кинотеатр «Россия»
  { axis: 'v', c: 430, t: 395, side: 1, r: 'r1', name: 'КИНО «РОССИЯ»', fw: 250, dp: 120, H: 92, e: 'e1', tint: '#e6e6e0', x: { sign: 'РОССИЯ', signColor: '#d02818', signRot: true }, feats: ['mast'] },
  { axis: 'v', c: 430, t: 480, side: -1, r: 'r4', name: 'МАКСИ', fw: 300, dp: 150, H: 42, e: 'e4', tint: '#e05030', x: { sign: 'МАКСИ', signColor: '#ffe030', signRot: true } },
  { axis: 'v', c: 430, t: 580, side: 1, r: 'r13', name: 'ПАНЕЛЬНАЯ 9-ЭТАЖКА', fw: 210, dp: 100, H: 150, e: 'e15', tint: '#e8c8c8', feats: ['machine', 'antenna'] },
  // Ломоносова (на запад, y=640): ЦУМ
  { axis: 'h', c: 640, t: 310, side: -1, r: 'r0', name: 'ЦУМ', fw: 340, dp: 130, H: 120, e: 'e0', tint: '#cfd2d6', x: { sign: 'ЦУМ' }, extra: [{ dx: 40, dy: 82, w: 110, d: 56, H: 26, tex: 't19', tint: '#7a6048', glass: true }] },
  // шоссе у воды (на север, x=190): порт и верфь
  { axis: 'v', c: 190, t: 350, side: 1, r: 'r16', name: 'СБОРОЧНЫЙ ЦЕХ', fw: 400, dp: 140, H: 120, e: 'e18', tint: '#b8b098', feats: ['vents'] },
  { axis: 'h', c: 215, t: 270, side: -1, r: 'r3', name: 'ДК «СТРОИТЕЛЬ»', fw: 220, dp: 100, H: 40, e: 'e3', tint: '#5878d0' },
].map(o => o.parts ? o : L5.landAt(o));
L5.LAKES = [[940, 655, 105, 75], [330, 790, 80, 70], [1215, 610, 60, 80]];
L5.PARKS = [[445, 395, 545, 520], [650, 262, 770, 322], [880, 470, 1040, 505]];

// ЖИЗНЬ: уличные персонажи из уровня 2 (летят прямо в город!) — кадры листов gopnik, bomzh, punk, girls2, maidw, walk4, wk_a, wk_b
L5.FOLK = {
  gopnik: { sheet: 'gopnik', ws: 'l5walkA', wk4: [0, 1, 2, 3], walk: [2, 3], idle: 1, hit: 6, sc: 0.5, sp: 26, lines: ['Э, слышь!', 'Семки есть?', 'Ты с какого района?', 'Чё, самый умный?'] },
  bomzh: { sheet: 'bomzh', ws: 'l5walkA', wk4: [4, 5, 6, 7], walk: [0, 1], idle: 0, hit: 3, sc: 0.5, sp: 18, lines: ['Подай на хлебушек!', 'Ой... простите...', 'Пардон муа...'] },
  alkash: { sheet: 'bomzh', ws: 'l5walkA', wk4: [8, 9, 10, 11], walk: [4], idle: 4, hit: 7, sc: 0.5, sp: 14, sway: true, lines: ['Гуляем, мужики!', 'Я не пьяный, я устал!', 'За Лемурию!'] },
  punk: { sheet: 'punk', ws: 'l5walkA', wk4: [12, 13, 14, 15], walk: [0], idle: 0, hit: 3, sc: 0.5, sp: 30, hop: true, lines: ['Панки хой!', 'Жги, байкер!', 'Бардак — наш лад!'] },
  showgirl: { sheet: 'girls2', ws: 'l5walkB2', wk4: [0, 1, 2, 3], walk: [2, 3], idle: 4, hit: 7, sc: 0.46, sp: 26, lines: ['Привет, красавчик!', 'Угостишь шампанским?', 'Дорогой, не гони!', 'Ах, какая машина!'] },
  domina: { sheet: 'girls2', ws: 'l5walkB2', wk4: [4, 5, 6, 7], walk: [0, 1], idle: 0, hit: 1, sc: 0.5, sp: 28, lines: ['Ну-ка, смирно!', 'Плохой мальчик!', 'Осторожнее на дороге!'] },
  maid: { sheet: 'maidw', ws: 'l5walkB1', wk4: [0, 1, 2, 3], walk: [0, 1, 2, 3], idle: 0, hit: 5, sc: 0.5, sp: 28, lines: ['Ой, а я с работы!', 'Постойте, подвезите!', 'Ах, вы ж мои хорошие!'] },
  nurse: { sheet: 'walk4', ws: 'l5walkB1', wk4: [4, 5, 6, 7], walk: [4, 5, 6, 7], idle: 4, hit: 7, sc: 0.5, sp: 28, lines: ['Больной, вам лежать!', 'Таблеточку не желаете?', 'Я на смену, не гоните!'] },
};
// рабочие сцены (стоят и занимаются делом): лист, кадры, скорость смены кадров, фраза
L5.WORK = [['wk_a', [0, 1], 7, 'weld'], ['wk_a', [2, 3], 3, 'lathe'], ['wk_a', [4, 5], 0.8, 'drink'], ['wk_a', [6], 0, 'smoke'], ['wk_b', [0, 1], 2.5, 'argue'], ['wk_b', [2, 3], 0.9, 'domino'], ['wk_b', [4, 5], 1.8, 'hammer'], ['wk_b', [6, 7], 0.8, 'foreman']];
L5.DOGS = { dogS: { sheet: 'punk', walk: [4, 5], idle: 5, sc: 0.55, sp: 120 }, dogB: { sheet: 'punk', walk: [7, 6], idle: 7, sc: 0.55, sp: 100 } };
// предметы: кадры листа l5props
L5.PR = { tree: [0, 1, 2], spruce: 3, bush: 4, birch: 5, lamp: 6, bench: 7, dumpster: 8, barrels: 9, cones: 10, barrier: 11, barricade: 12, kiosk: 13, stop: 14, hydrant: 15, crates: 16, puddle: 17, fence: 18, billboard: 19, trafo: 20, ramp: 21, tyres: 22, leaves: 23 };
// сверху-вниз жизнь (лист l5life): по два кадра ходьбы
L5.LIFE = { ped: [0, 2, 4, 6, 8, 12, 14], bike: 10, dog: 16, cat: 18, hen: 20, goose: 22, pigeonSit: 24, pigeonFly: 25, crow: 28, down: 30, hat: 31 };

// =====================================================================
// МИР
// =====================================================================
L5.buildWorld = function () {
  if (L5.world) return L5.world;
  const R = mulberry(20261002), rr = (a, b) => a + R() * (b - a), ri = (a, b) => Math.floor(rr(a, b + 1));
  const Wd = { roads: [], boxes: new L5.Grid(), objs: new L5.Grid(), solids: new L5.Grid(256), circs: new L5.Grid(256), lakes: [], parks: [], cars: [], folk: [], critters: [], pick: [], ramps: [], barrels: [], cones: [], breaks: [], smokers: [], lands: [], junctions: [], lamps: [], boxList: [], flags: [] };
  L5.world = Wd;
  const HW = L5.HW, SW = L5.SW;
  const hasProps = L5.has('l5props'), hasLife = L5.has('l5life');
  Wd.hasProps = hasProps;
  const mkBox = r => { r.x0 = Math.min(r.ax, r.bx) - r.hw; r.x1 = Math.max(r.ax, r.bx) + r.hw; r.y0 = Math.min(r.ay, r.by) - r.hw; r.y1 = Math.max(r.ay, r.by) + r.hw; return r; };
  for (const g of L5.segs) Wd.roads.push(mkBox({ ax: g.ax, ay: g.ay, bx: g.bx, by: g.by, hw: HW, main: true, hor: Math.abs(g.dy) < 0.01 }));
  for (const [lx, ly, rx, ry] of L5.LAKES) {
    const L = { x: lx * K5, y: ly * K5, rx: rx * K5, ry: ry * K5 }; Wd.lakes.push(L);
    const n = Math.round(Math.PI * (L.rx + L.ry) / 46);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const c = { x: L.x + Math.cos(a) * (L.rx - 8), y: L.y + Math.sin(a) * (L.ry - 8), r: 34, wall: true }; Wd.circs.add(c, c.x - 34, c.y - 34, c.x + 34, c.y + 34); }
  }
  for (const [x0, y0, x1, y1] of L5.PARKS) Wd.parks.push({ x0: x0 * K5, y0: y0 * K5, x1: x1 * K5, y1: y1 * K5 });
  const inLake = (x, y, m = 0) => Wd.lakes.some(L => ((x - L.x) / (L.rx + m)) ** 2 + ((y - L.y) / (L.ry + m)) ** 2 < 1);
  const inPark = (x, y, m = 0) => Wd.parks.some(p => x > p.x0 - m && x < p.x1 + m && y > p.y0 - m && y < p.y1 + m);
  const roadHit = (r, m) => L5.railHit(Wd, r, m + 16) || Wd.roads.some(q => r.x < q.x1 + SW + m && r.x + r.w > q.x0 - SW - m && r.y < q.y1 + SW + m && r.y + r.h > q.y0 - SW - m);
  const solidHit = (r, m) => { let hit = false; Wd.solids.query(r.x - m, r.y - m, r.x + r.w + m, r.y + r.h + m, b => { if (!hit && r.x < b.x + b.w + m && r.x + r.w > b.x - m && r.y < b.y + b.h + m && r.y + r.h > b.y - m) hit = true; }); return hit; };
  const addSolid = b => Wd.solids.add(b, b.x, b.y, b.x + b.w, b.y + b.h);
  const addCirc = (x, y, r, o = {}) => { const c = Object.assign({ x, y, r }, o); Wd.circs.add(c, x - r, y - r, x + r, y + r); return c; };
  const zoneAt = (x, y) => {
    const ix = x / K5, iy = y / K5;
    if (Wd.lakes.some(L => ((x - L.x) / (L.rx + 1700)) ** 2 + ((y - L.y) / (L.ry + 1700)) ** 2 < 1)) return 'private';
    if (ix > 1060 || (iy < 240 && ix < 570)) return 'industrial';
    if (ix > 250 && ix < 780 && iy > 230 && iy < 670) return 'center';
    return 'resid';
  };
  Wd.zoneAt = zoneAt;
  // коробка: здание с псевдообъёмом
  const addBox = b => {
    Object.assign(b, { kind: 'box', z0: b.z0 || 0, seed: R() });
    b.cx = b.x + b.w / 2; b.cy = b.y + b.d / 2; b.by = b.y + b.d;
    const m = (b.H + 60) * 0.6 + 40;
    Wd.boxes.add(b, b.x - m, b.y - m, b.x + b.w + m, b.y + b.d + m);
    Wd.boxList.push(b);
    if (!b.arch) addSolid({ x: b.x, y: b.y, w: b.w, h: b.d, box: b });
    return b;
  };
  Wd.addBox = addBox;
  // --- знаковые здания (ставим первыми)
  for (const lm of L5.LAND) {
    const ax = lm.ax * K5, ay = lm.ay * K5, rec = { name: lm.name, x: ax, y: ay, parts: [], front: lm.front };
    for (const p of lm.parts) {
      const b = addBox({ x: ax + p.dx - p.w / 2, y: ay + p.dy - p.d / 2, w: p.w, d: p.d, H: p.H, z0: p.z0 || 0, tex: p.e && L5.tex(p.e).img ? p.e : (p.tex || 't19'), front: lm.front, roof: p.roofTile || 14, tint: p.tint, pitch: p.pitch, sign: p.sign, signColor: p.signColor, signRot: p.signRot, glass: p.glass, spire: p.spire, portico: p.portico, arch: p.arch, land: lm.name, roofImg: p.r, elev: !!(p.e && L5.tex(p.e).img) });
      rec.parts.push(b);
    }
    rec.feats = lm.feats || []; rec.sign = lm.sign; Wd.lands.push(rec);
    for (const f of rec.feats) Wd.smokers.push({ x: ax, y: ay, t: 0, feat: f, land: rec });
  }
  L5.buildRails(Wd); // пути строим раньше боковых улиц и домов: они их обходят
  // --- боковые улицы
  for (const g of L5.segs) {
    for (let t = 520; t < g.len - 520; t += 760 + R() * 240) {
      const px = g.ax + g.dx * t, py = g.ay + g.dy * t;
      for (const sd of [-1, 1]) {
        const len = 760, q = mkBox({ ax: px, ay: py, bx: px + -g.dy * sd * len, by: py + g.dx * sd * len, hw: 40, side: true, hor: Math.abs(g.dx) < 0.01, dirx: -g.dy * sd, diry: g.dx * sd });
        const box = { x: q.x0 - 10, y: q.y0 - 10, w: q.x1 - q.x0 + 20, h: q.y1 - q.y0 + 20 };
        if (solidHit(box, 30)) continue; if (L5.railHit(Wd, box, 40)) continue;
        if (inLake(q.bx, q.by, 80) || inLake((q.ax + q.bx) / 2, (q.ay + q.by) / 2, 80)) continue;
        if (Wd.roads.some(o => o !== q && !o.main && o.hor === q.hor && Math.abs(o.ax - q.ax) < 160 && Math.abs(o.ay - q.ay) < 160)) continue;
        q.parent = g; Wd.roads.push(q); Wd.junctions.push({ x: px, y: py, g, dx: q.dirx, dy: q.diry, s: g.s0 + t, end: [q.bx, q.by] });
      }
    }
  }
  // --- обычные дома: коробки с фасадами (псевдообъём)
  const pickType = zone => { const w = L5.ZONEW[zone]; let tot = 0; for (const v of w) tot += v; let r = R() * tot; for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; } return 0; };
  const placeHouse = (cx, cy, ti, rot) => {
    const T = L5.HTYPES[ti]; let w = rr(T.w[0], T.w[1]), d = rr(T.d[0], T.d[1]);
    if (rot) [w, d] = [d, w];
    const b = { x: cx - w / 2, y: cy - d / 2, w, d, h: d };
    if (roadHit(b, 10) || solidHit(b, 18) || inLake(cx, cy, 140) || inPark(cx, cy, 40) || inLake(b.x, b.y, 60) || inLake(b.x + w, b.y + d, 60)) return false;
    const fac = L5.tex(T.f).img ? T.f : T.t;
    const front = rot ? (R() < 0.5 ? 'E' : 'W') : (R() < 0.5 ? 'S' : 'N');
    addBox({ x: b.x, y: b.y, w, d, H: rr(T.H[0], T.H[1]), tex: fac, front, roof: T.roof, tint: T.tint && !L5.tex(T.f).img ? T.tint : (R() < 0.35 && !L5.tex(T.f).img ? U.choice(['#c0a060', '#6090c0', '#a0c080', '#d08080']) : null), pitch: T.pitch, feats: T.feats, yard: R() < 0.6, type: T.n });
    return true;
  };
  for (const rd of Wd.roads) {
    const len = Math.hypot(rd.bx - rd.ax, rd.by - rd.ay), dx = (rd.bx - rd.ax) / len, dy = (rd.by - rd.ay) / len;
    for (const sd of [-1, 1]) for (let row = 0; row < 3; row++) {
      let t = rd.main ? 30 : rd.hw + 50;
      while (t < len - 40) {
        const mx = rd.ax + dx * t, my = rd.ay + dy * t, zone = zoneAt(mx, my), ti = pickType(zone), T = L5.HTYPES[ti];
        const w = rr(T.w[0], T.w[1]), d = rr(T.d[0], T.d[1]), base = rd.hw + SW + 20 + row * 175;
        const along = rd.hor ? w : d, off = base + (rd.hor ? d : w) / 2;
        const cx = rd.hor ? rd.ax + dx * (t + along / 2) : rd.ax + sd * off, cy = rd.hor ? rd.ay + sd * off : Math.min(rd.ay, rd.by) + t + along / 2;
        const T2 = ti;
        if (placeHouse(cx, cy, T2, !rd.hor)) t += along + rr(10, 46); else t += 80;
      }
    }
  }
  for (let i = 0; i < 9000; i++) {
    const rd = Wd.roads[Math.floor(R() * Wd.roads.length)], len = Math.hypot(rd.bx - rd.ax, rd.by - rd.ay), t = R() * len;
    const px = rd.ax + (rd.bx - rd.ax) / len * t, py = rd.ay + (rd.by - rd.ay) / len * t, off = rr(300, 1500) * (R() < 0.5 ? -1 : 1);
    const x = rd.hor ? px : px + off, y = rd.hor ? py + off : py;
    placeHouse(x, y, pickType(zoneAt(x, y)), R() < 0.4);
  }
  // --- зелень, фонари, предметы
  const free = (x, y, m = 16) => !roadHit({ x: x - m, y: y - m, w: m * 2, h: m * 2 }, 6) && !solidHit({ x: x - m, y: y - m, w: m * 2, h: m * 2 }, 4) && !inLake(x, y, 60);
  const bb = Wd.roads.reduce((a, r) => ({ x0: Math.min(a.x0, r.x0), y0: Math.min(a.y0, r.y0), x1: Math.max(a.x1, r.x1), y1: Math.max(a.y1, r.y1) }), { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 });
  Wd.bb = { x0: bb.x0 - 1800, y0: bb.y0 - 1800, x1: bb.x1 + 1800, y1: bb.y1 + 1800 };
  const PS = L5.PR;
  const addTree = (x, y, kind) => {
    const o = { kind: 'tree', x, y, tk: kind, by: y, ph: R() * 6, sz: rr(0.85, 1.2), col: ri(0, 3) };
    Wd.objs.add(o, x - 70, y - 90, x + 70, y + 20); addCirc(x, y, 12, { obj: o }); return o;
  };
  const addLamp = (x, y) => { const o = { kind: 'lamp', x, y, by: y, ph: R() * 6 }; Wd.objs.add(o, x - 40, y - 80, x + 40, y + 20); addCirc(x, y, 6, { obj: o }); Wd.lamps.push(o); return o; };
  const addProp = (kind, x, y, o = {}) => { const p = Object.assign({ kind, x, y, by: y, w: 40 }, o); Wd.objs.add(p, x - 50, y - 60, x + 50, y + 30); return p; };
  // деревья по всему городу, гуще в парках
  for (let gx = Wd.bb.x0; gx < Wd.bb.x1; gx += 120) for (let gy = Wd.bb.y0; gy < Wd.bb.y1; gy += 120) {
    const x = gx + R() * 120, y = gy + R() * 120, pk = inPark(x, y);
    if (R() > (pk ? 0.85 : 0.22) || !free(x, y, pk ? 26 : 48)) continue;
    addTree(x, y, R() < 0.12 ? 'spruce' : R() < 0.3 ? 'birch' : 'oak');
  }
  for (const g of L5.segs) {
    for (let t = 80; t < g.len - 60; t += rr(100, 170)) for (const sd of [-1, 1]) {
      if (R() < 0.4) continue;
      const x = g.ax + g.dx * t + -g.dy * sd * (HW + SW - 9), y = g.ay + g.dy * t + g.dx * sd * (HW + SW - 9);
      if (Wd.roads.some(q => !q.main && x > q.x0 - 30 && x < q.x1 + 30 && y > q.y0 - 30 && y < q.y1 + 30) || solidHit({ x: x - 8, y: y - 8, w: 16, h: 16 }, 4)) continue;
      addTree(x, y, R() < 0.25 ? 'birch' : 'oak');
    }
    for (let t = 120; t < g.len - 100; t += 210) {
      const sd = (Math.floor(t / 210) % 2) ? 1 : -1;
      const x = g.ax + g.dx * t + -g.dy * sd * (HW + 10), y = g.ay + g.dy * t + g.dx * sd * (HW + 10);
      if (Wd.roads.some(q => !q.main && x > q.x0 - 20 && x < q.x1 + 20 && y > q.y0 - 20 && y < q.y1 + 20)) continue;
      addLamp(x, y);
    }
  }
  for (const rd of Wd.roads) if (rd.side) {
    const len = Math.hypot(rd.bx - rd.ax, rd.by - rd.ay), dx = (rd.bx - rd.ax) / len, dy = (rd.by - rd.ay) / len;
    for (let t = rd.hw + 90; t < len - 30; t += rr(130, 200)) for (const sd of [-1, 1]) {
      if (R() < 0.35) continue;
      const x = rd.ax + dx * t + -dy * sd * (rd.hw + SW - 8), y = rd.ay + dy * t + dx * sd * (rd.hw + SW - 8);
      if (free(x, y, 10)) { if (R() < 0.35) addLamp(x, y); else addTree(x, y, 'oak'); }
    }
  }
  // дворовые мелочи
  for (const b of Wd.boxList) {
    if (b.land || b.type === 'garages') continue;
    if (false) { const x = b.cx + rr(-b.w * 0.4, b.w * 0.4), y = b.by + rr(10, 24); if (free(x, y, 14)) { const o = addProp(R() < 0.55 ? 'dumpster' : 'crate', x, y, { w: 40, hp: 1 }); o.c = addCirc(x, y, 12, { obj: o, brk: o.kind === 'crate' }); if (o.kind === 'crate') Wd.breaks.push(o); } }
    if (R() < 0.14) { const x = b.cx + rr(-b.w * 0.45, b.w * 0.45), y = b.by + rr(28, 46); if (free(x, y, 14)) { const o = addProp('bench', x, y, { w: 44 }); addCirc(x, y, 11, { obj: o }); } }
  }
  // препятствия на дороге
  for (let s = 700; s < L5.LEN - 500; s += rr(430, 800)) {
    const p = L5.at(s), kind = R(), side = R() < 0.5 ? -1 : 1, lane = side * rr(26, 44), bx = p.x + p.nx * lane, by = p.y + p.ny * lane;
    if (Wd.roads.some(q => !q.main && bx > q.x0 - 60 && bx < q.x1 + 60 && by > q.y0 - 60 && by < q.y1 + 60) || L5.railHit(Wd, { x: bx - 90, y: by - 90, w: 180, h: 180 }, 40)) continue;
    if (kind < 0.25) {
      for (let i = 0; i < 3; i++) { const o = { kind: 'barrel', x: bx + rr(-16, 16) + p.dx * i * 22, y: by + rr(-12, 12) + p.dy * i * 22, hp: 1, w: 34 }; o.by = o.y; Wd.objs.add(o, o.x - 18, o.y - 24, o.x + 18, o.y + 14); o.c = addCirc(o.x, o.y, 11, { obj: o, barrel: true }); Wd.barrels.push(o); }
    } else if (kind < 0.45) {
      for (let i = -2; i <= 2; i += 2) { const q = { kind: 'cone', x: bx - p.dx * 66 + p.dx * i * 30, y: by - p.dy * 66 + p.dy * i * 30, w: 26, vx: 0, vy: 0, rot: 0, hit: 0 }; q.by = q.y; Wd.objs.add(q, q.x - 14, q.y - 14, q.x + 14, q.y + 14); Wd.cones.push(q); }
    } else if (kind < 0.62) {
      /* трамплины убраны */
    } else if (kind < 0.82) {
      const o = { kind: 'parked', fr: 5 + Math.floor(R() * 4), x: bx, y: by, ang: Math.atan2(p.dy, p.dx) + (R() < 0.15 ? 0.25 : 0), by, w: 70 }; Wd.objs.add(o, bx - 45, by - 45, bx + 45, by + 45); Wd.cars.push(o);
    } else if (kind < 0.92) { const o = addProp('barrel', bx, by, { w: 30, hp: 1 }); }
    /* ящики убраны */
  }
  // вдоль дороги: киоски, остановки, билборды, заборы, будки (как коробки/спрайты)
  for (const g of L5.segs) for (let t = 260; t < g.len - 260; t += rr(480, 860)) {
    const sd = R() < 0.5 ? -1 : 1, off = HW + SW + 4 + rr(0, 14), x = g.ax + g.dx * t + -g.dy * sd * off, y = g.ay + g.dy * t + g.dx * sd * off;
    if (Wd.roads.some(q => !q.main && x > q.x0 - 60 && x < q.x1 + 60 && y > q.y0 - 60 && y < q.y1 + 60) || L5.railHit(Wd, { x: x - 70, y: y - 50, w: 140, h: 100 }, 30) || solidHit({ x: x - 30, y: y - 20, w: 60, h: 40 }, 4)) continue;
    const r = R();
    if (r < 0.3) { addBox({ x: x - 22, y: y - 14, w: 44, d: 28, H: 22, tex: 't18', front: 'S', roof: 9, tint: '#4078c0', type: 'kiosk', kiosk: true, hp: 1 }); }
    else if (r < 0.52) { addBox({ x: x - 30, y: y - 12, w: 60, d: 24, H: 16, tex: 't19', front: 'S', roof: 8, glass: true, tint: '#d0a030', type: 'stop' }); }
    else if (r < 0.68) { const o = addProp('billboard', x, y - 6, { w: 80 }); addCirc(x, y - 2, 14, { obj: o }); }
    else if (r < 0.86) { for (let i = -2; i <= 2; i++) { const fx = x + g.dx * i * 34, fy = y + g.dy * i * 34; const o = addProp('fence', fx, fy, { w: 60, rot: Math.atan2(g.dy, g.dx), hp: 1 }); o.c = addCirc(fx, fy, 12, { obj: o, brk: true, soft: true }); Wd.breaks.push(o); } }
    else { addBox({ x: x - 16, y: y - 12, w: 32, d: 24, H: 24, tex: 't19', front: 'S', roof: 8, tint: '#8a8e96', type: 'trafo' }); }
  }
  for (const p of Wd.parks) for (let i = 0; i < 10; i++) { const x = rr(p.x0 + 60, p.x1 - 60), y = rr(p.y0 + 60, p.y1 - 60); if (!free(x, y, 22)) continue; const o = addProp('bench', x, y, { w: 44 }); addCirc(x, y, 12, { obj: o }); }
  for (let s = 300; s < L5.LEN; s += rr(260, 520)) { const p = L5.at(s, { lane: rr(-40, 40) }); addProp('puddle', p.x, p.y, { w: 40, deco: true, by: p.y - 400, ph: R() * 6 }); }
  Wd.holes = [];
  for (let s = 380; s < L5.LEN - 300; s += rr(230, 480)) {
    const p = L5.at(s, { lane: rr(-46, 46) }), t = R();
    if (L5.railHit(Wd, { x: p.x - 50, y: p.y - 50, w: 100, h: 100 }, 30)) continue;
    if (t < 0.58) { const fr = Math.floor(R() * 6); Wd.holes.push({ x: p.x, y: p.y, r: 13 + (fr === 2 ? 5 : 0), fr, haz: 'pothole', rot: R() * 6.28 }); }
    else if (t < 0.84) { Wd.holes.push({ x: p.x, y: p.y, r: 8, fr: 6, haz: null, rot: R() * 6.28 }); Wd.smokers.push({ x: p.x, y: p.y, t: R(), steam: true }); }
    else { Wd.holes.push({ x: p.x, y: p.y, r: 11, fr: 7, haz: 'open', rot: 0 }); Wd.smokers.push({ x: p.x, y: p.y, t: R(), steam: true }); }
  }
  // --- уличная жизнь: прохожие и собаки из уровня 2, рабочие, плюс животные сверху (если нарисованы)
  const sidewalk = (s, sd) => { const p = L5.at(s); const off = HW + SW * 0.55; return { x: p.x + p.nx * sd * off, y: p.y + p.ny * sd * off, g: L5.segs.find(g => s >= g.s0 && s <= g.s0 + g.len) || L5.segs[0] }; };
  const crowd = s => { const p = L5.at(s); const near = (ix, iy, r) => Math.hypot(p.x / K5 - ix, p.y / K5 - iy) < r; return near(1150, 480, 150) || near(392, 380, 110) || near(300, 620, 130) || near(990, 420, 150) || near(705, 322, 90) ? 2 : 1; };
  const types = ['gopnik', 'gopnik', 'gopnik', 'bomzh', 'alkash', 'punk', 'showgirl', 'domina', 'maid', 'nurse'];
  for (let s = 40; s < L5.LEN - 40; s += rr(110, 220)) for (let k = 0; k < crowd(s); k++) {
    const sd = R() < 0.5 ? -1 : 1, sw = sidewalk(s + rr(-20, 20), sd), tp = types[Math.floor(R() * types.length)];
    Wd.folk.push({ kind: 'folk', type: tp, x: sw.x, y: sw.y, g: sw.g, dir: R() < 0.5 ? 1 : -1, state: 'walk', t: R() * 3, ph: R() * 6, vx: 0, vy: 0, hit: 0, said: 0, cross: R() < 0.1, sd, face: 1, z: 0 });
  }
  for (let s = 150; s < L5.LEN - 100; s += rr(230, 420)) { // собаки, иногда стаей
    const sd = R() < 0.5 ? -1 : 1, sw = sidewalk(s, sd), n = R() < 0.25 ? 3 : 1;
    for (let i = 0; i < n; i++) Wd.folk.push({ kind: 'dog', type: R() < 0.7 ? 'dogS' : 'dogB', x: sw.x + rr(-14, 14), y: sw.y + rr(-14, 14), g: sw.g, dir: R() < 0.5 ? 1 : -1, state: 'idle', t: R() * 2, ph: R() * 6, vx: 0, vy: 0, hit: 0, sd, face: 1, z: 0, home: { x: sw.x, y: sw.y } });
  }
  // рабочие у стройплощадок и заводов: сценки
  for (const b of Wd.boxList) if (b.type === 'boiler' || b.type === 'hangar' || b.type === 'garages' || b.land === 'ЗАВОД «СЕВМОЛОТ»') {
    if (R() < 0.7) { const w = L5.WORK[Math.floor(R() * L5.WORK.length)]; Wd.folk.push({ kind: 'worker', work: w, x: b.cx + rr(-b.w * 0.3, b.w * 0.3), y: b.by + rr(14, 28), t: R() * 3, ph: R() * 6, face: R() < 0.5 ? 1 : -1, hit: 0, z: 0 }); }
  }
  for (const p of Wd.parks) for (let i = 0; i < 5; i++) { const x = rr(p.x0 + 80, p.x1 - 80), y = rr(p.y0 + 80, p.y1 - 80); Wd.folk.push({ kind: 'folk', type: U.choice(['bomzh', 'alkash', 'showgirl', 'maid', 'nurse', 'gopnik']), x, y, g: L5.segs[0], dir: R() < 0.5 ? 1 : -1, state: 'stroll', t: R() * 4, ph: R() * 6, vx: 0, vy: 0, hit: 0, sd: 1, face: 1, z: 0, park: p }); }
  if (hasLife) {
    const spawnC = (kind, s, sd, n = 1) => { for (let i = 0; i < n; i++) { const sw = sidewalk(s + rr(-30, 30), sd); Wd.critters.push({ kind, x: sw.x + rr(-12, 12), y: sw.y + rr(-12, 12), g: sw.g, dir: R() < 0.5 ? 1 : -1, vx: 0, vy: 0, ph: R() * 6, state: 'idle', t: R() * 3, home: { x: sw.x, y: sw.y }, ang: R() * 6.28, fly: 0, a: 1 }); } };
    for (let s = 200; s < L5.LEN; s += rr(260, 420)) { const r = R(), sd = R() < 0.5 ? -1 : 1; if (r < 0.3) spawnC('pigeons', s, sd, 5 + Math.floor(R() * 4)); else if (r < 0.45) spawnC('cat', s, sd); else if (r < 0.57) spawnC('crow', s, sd, 2); else if (r < 0.68) spawnC('bike', s, sd); }
    for (let s = 120; s < 1900; s += rr(110, 190)) spawnC('hen', s, R() < 0.5 ? -1 : 1, 2 + Math.floor(R() * 3));
    for (const s of [L5.NODE_S[1] + 700, L5.NODE_S[6] + 900]) spawnC('goose', s, 1, 5);
  }
  // финальная зона у обрыва над морем: здания, деревья, фонари и боковые улицы убираем
  { const E = L5.at(L5.S_END, { lane: 0 }), px = -E.dy, py = E.dx, ax = [E.x - E.dx * 300 - px * 1150, E.x + E.dx * 1250 + px * 1150], ay = [E.y - E.dy * 300 - py * 1150, E.y + E.dy * 1250 + py * 1150];
    const rect = { x0: Math.min(ax[0], ax[1]), x1: Math.max(ax[0], ax[1]), y0: Math.min(ay[0], ay[1]), y1: Math.max(ay[0], ay[1]) }; Wd.endRect = rect;
    const inR = (x, y, m = 0) => x > rect.x0 - m && x < rect.x1 + m && y > rect.y0 - m && y < rect.y1 + m;
    const gone = new Set(Wd.boxList.filter(b => inR(b.cx, b.cy, 40)));
    for (const b of gone) Wd.boxes.remove(b); Wd.boxList = Wd.boxList.filter(b => !gone.has(b)); Wd.lands = Wd.lands.filter(l => !inR(l.x, l.y));
    const sol = []; Wd.solids.query(rect.x0 - 200, rect.y0 - 200, rect.x1 + 200, rect.y1 + 200, o => { if (o.box && gone.has(o.box)) sol.push(o); }); for (const o of sol) Wd.solids.remove(o);
    const dc = [], dob = []; Wd.circs.query(rect.x0, rect.y0, rect.x1, rect.y1, c => { if (!c.wall && inR(c.x, c.y)) dc.push(c); }); Wd.objs.query(rect.x0, rect.y0, rect.x1, rect.y1, o => { if (o.kind !== 'parked' && inR(o.x, o.y)) dob.push(o); });
    for (const c of dc) Wd.circs.remove(c); for (const o of dob) { Wd.objs.remove(o); const i = Wd.lamps.indexOf(o); if (i >= 0) Wd.lamps.splice(i, 1); const j = Wd.breaks.indexOf(o); if (j >= 0) Wd.breaks.splice(j, 1); }
    Wd.roads = Wd.roads.filter(r => r.main || !inR((r.ax + r.bx) / 2, (r.ay + r.by) / 2, 100)); Wd.holes = (Wd.holes || []).filter(h => !inR(h.x, h.y));
    for (const p of Wd.folk) if (inR(p.x, p.y)) p.gone = true; Wd.smokers = Wd.smokers.filter(m => !inR(m.x, m.y));
  }
  // застройка перед пустырём: плотные дворы жилых домов по обе стороны последнего отрезка дороги — чувствуется город
  for (const sd of [-1, 1]) for (let row = 0; row < 3; row++) {
    let s = L5.S_END - 2900 + row * 40;
    while (s < L5.S_END - 360) {
      const p = L5.at(s, { lane: 0 }), hor = Math.abs(p.dx) > 0.7, ti = pickType(row === 0 ? 'center' : 'resid'), T = L5.HTYPES[ti];
      const w = rr(T.w[0], T.w[1]), d = rr(T.d[0], T.d[1]), along = hor ? w : d, off = L5.HW + L5.SW + 20 + row * 175 + (hor ? d : w) / 2;
      const cx = p.x + p.dx * along / 2 - p.dy * sd * off, cy = p.y + p.dy * along / 2 + p.dx * sd * off;
      if (placeHouse(cx, cy, ti, !hor)) s += along + rr(10, 40); else s += 70;
    }
  }
  // объёмные предметы на пустыре (поверх картинки l5endzone): f — вперёд от финиша, u — вбок от оси дороги
  { const E = L5.at(L5.S_END, { lane: 0 }), px = -E.dy, py = E.dx, at = (f, u) => ({ x: E.x + E.dx * f + px * u, y: E.y + E.dy * f + py * u });
    const tree = (f, u, k) => { const p = at(f, u); return addTree(p.x, p.y, k); };
    for (const [f, u, k] of [[40, -330, 'oak'], [150, -400, 'spruce'], [260, -350, 'birch'], [370, -430, 'spruce'], [480, -380, 'oak'], [560, -250, 'spruce'], [60, 340, 'birch'], [190, 410, 'spruce'], [300, 360, 'oak'], [420, 440, 'birch'], [520, 330, 'spruce'], [575, 190, 'oak'], [330, -230, 'birch'], [235, 255, 'spruce']]) tree(f, u, k);
    const prop = (kind, f, u, o = {}) => { const p = at(f, u), q = addProp(kind, p.x, p.y, o); return q; };
    for (let i = 0; i < 3; i++) { const q = prop('barrel', 210 + i * 14, 235 + i * 20, { w: 30, hp: 1 }); addCirc(q.x, q.y, 10, { obj: q }); }
    for (let i = -3; i <= 3; i++) { if (Math.abs(i) < 1) continue; const q = prop('fence', 470, i * 62, { w: 60, rot: Math.atan2(py, px), hp: 1 }); }
    { const q = prop('billboard', 400, -150, { w: 80 }); addCirc(q.x, q.y, 14, { obj: q }); }
    { const q = prop('crate', 90, 290, { w: 40, hp: 1 }); addCirc(q.x, q.y, 14, { obj: q }); }
    { const q = prop('dumpster', 110, -290, { w: 40, hp: 1 }); addCirc(q.x, q.y, 16, { obj: q }); }
    { const q = prop('bench', 330, 120, { w: 44 }); addCirc(q.x, q.y, 11, { obj: q }); }
    for (const [f, u] of [[-60, -120], [-60, 120], [120, -120], [120, 120]]) { const p = at(f, u); addLamp(p.x, p.y); }
    // отдельные спрайты пустыря (Flow): [кадр l5waste, f, u, радиус столкновения]
    for (const [fr, f, u, rad] of [[0, 120, -300, 12], [0, 330, 300, 12], [0, 520, -120, 12], [1, 60, 190, 20], [1, 380, -310, 22], [1, 540, 290, 20], [2, 250, -200, 26], [3, 150, -230, 0], [3, 280, 190, 0], [3, 430, 110, 0], [3, 470, -70, 0], [4, 170, 330, 30], [5, 300, -380, 22], [6, 40, -250, 18], [6, 360, 400, 18], [7, 440, -330, 24], [8, 90, 250, 6], [8, 400, -420, 6], [9, 230, 90, 0], [9, 120, -130, 0], [9, 500, 190, 0], [9, 330, -90, 0], [10, 310, 330, 22]]) {
      const p = at(f, u), o = addProp('waste', p.x, p.y, { fr, w: 50 }); if (rad) addCirc(p.x, p.y, rad, { obj: o });
    }
    // боковые поля пустыря (продолжение картинки): ещё предметы и деревья
    for (let i = 0; i < 46; i++) {
      const sd = i % 2 ? 1 : -1, f = rr(-80, 470), u = sd * rr(520, 1080), fr = Math.floor(R() * 11);
      if (R() < 0.3) tree(f, u, ['spruce', 'oak', 'birch'][Math.floor(R() * 3)]);
      else { const p = at(f, u), rad = [12, 20, 26, 0, 30, 22, 18, 24, 6, 0, 22][fr], o = addProp('waste', p.x, p.y, { fr, w: 50 }); if (rad) addCirc(p.x, p.y, rad, { obj: o }); }
    }
  }
  // последняя страховка: на полотне путей не остаётся ни деревьев, ни фонарей, ни луж
  for (const t of (Wd.tracks || [])) {
    const on = (x, y, r) => t.horiz ? Math.abs(y - t.c) < L5.RAIL_HW + 14 + r : Math.abs(x - t.c) < L5.RAIL_HW + 14 + r;
    const dropC = [], dropO = [];
    Wd.circs.query(-1e6, -1e6, 1e6, 1e6, c => { if (!c.wall && on(c.x, c.y, c.r * 0.5)) dropC.push(c); });
    Wd.objs.query(-1e6, -1e6, 1e6, 1e6, o => { if (o.kind !== 'parked' && on(o.x, o.y, 0)) dropO.push(o); });
    for (const c of dropC) Wd.circs.remove(c);
    for (const o of dropO) { Wd.objs.remove(o); const i = Wd.lamps.indexOf(o); if (i >= 0) Wd.lamps.splice(i, 1); const j = Wd.breaks.indexOf(o); if (j >= 0) Wd.breaks.splice(j, 1); }
  }
  return Wd;
};
L5.roadMargin = function (x, y) {
  let m = 1e9;
  for (const r of L5.world.roads) {
    const dx = Math.max(r.x0 + r.hw - x, 0, x - (r.x1 - r.hw)), dy = Math.max(r.y0 + r.hw - y, 0, y - (r.y1 - r.hw));
    m = Math.min(m, Math.hypot(dx, dy) - r.hw);
  }
  return m;
};
L5.surface = function (x, y) {
  const m = L5.roadMargin(x, y);
  return m < 0 ? 'road' : m < L5.SW ? 'walk' : 'grass';
};
