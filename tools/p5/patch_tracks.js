const fs = require('fs');
let s = fs.readFileSync('js/level5extra.js', 'utf8');
const a = s.indexOf('// пути ставим до домов');
const b = s.indexOf('(function () {');
if (a < 0 || b < 0) throw new Error('нет');
const neu = `// Пути: длинные прямые магистрали от края карты до края. Ищем линии, которые не задевают здания, озёра, боковые улицы
// и не идут вдоль маршрута; пересечения с маршрутом — переезды (шлагбаум, поезд).
L5.buildRails = function (Wd) {
  Wd.rails = []; Wd.tracks = [];
  const HW = L5.RAIL_HW, H = HW + 54;
  const bbr = Wd.roads.reduce((q, r) => ({ x0: Math.min(q.x0, r.x0), y0: Math.min(q.y0, r.y0), x1: Math.max(q.x1, r.x1), y1: Math.max(q.y1, r.y1) }), { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 });
  const BB = { x0: bbr.x0 - 1800, y0: bbr.y0 - 1800, x1: bbr.x1 + 1800, y1: bbr.y1 + 1800 };
  const roadHor = q => (q.x1 - q.x0) > (q.y1 - q.y0);
  // ok: линия не задевает объекты; возвращает список пересечений с магистральными дорогами или null
  const test = (horiz, c) => {
    for (const L of Wd.lakes) if ((horiz ? Math.abs(c - L.y) - L.ry : Math.abs(c - L.x) - L.rx) < H + 80) return null;
    for (const bx of Wd.boxList) if (horiz ? (bx.y < c + H && bx.y + bx.d > c - H) : (bx.x < c + H && bx.x + bx.w > c - H)) return null;
    const cross = [];
    for (const q of Wd.roads) {
      const lo = horiz ? q.y0 : q.x0, hi = horiz ? q.y1 : q.x1;
      if (c < lo - 230 || c > hi + 230) continue;
      const par = roadHor(q) === horiz;
      if (par) return null; // идёт вдоль дороги
      if (!q.main) { if (c > (horiz ? q.y0 : q.x0) - H - 60 && c < (horiz ? q.y1 : q.x1) + H + 60) return null; continue; }
      const alo = horiz ? q.y0 : q.x0, ahi = horiz ? q.y1 : q.x1;
      // пересекает магистральную улицу поперёк: не рядом с её концами (углами)
      if (c < alo + 320 || c > ahi - 320) return null;
      cross.push(q);
    }
    return cross;
  };
  const found = [];
  for (const horiz of [true, false]) {
    const lo = horiz ? BB.y0 + 300 : BB.x0 + 300, hi = horiz ? BB.y1 - 300 : BB.x1 - 300;
    let run = null;
    for (let c = lo; c <= hi + 1; c += 25) {
      const cr = test(horiz, c);
      if (cr && cr.length) { if (!run) run = { horiz, c0: c, c1: c, cr }; run.c1 = c; } else if (run) { found.push(run); run = null; }
    }
    if (run) found.push(run);
  }
  // выбираем до трёх линий с разными пересечениями, подальше друг от друга по маршруту
  const chosen = []; const usedS = [];
  found.sort((p, q) => (q.c1 - q.c0) - (p.c1 - p.c0));
  for (const f of found) {
    if (chosen.length >= 4) break;
    const c = (f.c0 + f.c1) / 2, pts = f.cr.map(q => {
      const x = f.horiz ? (q.x0 + q.x1) / 2 : c, y = f.horiz ? c : (q.y0 + q.y1) / 2, pr = L5.proj(x, y);
      return { x, y, s: pr.s };
    }).filter(p => p.s > 600 && p.s < L5.S_MATCH - 500);
    if (!pts.length || pts.some(p => usedS.some(u => Math.abs(u - p.s) < 1800))) continue;
    for (const p of pts) usedS.push(p.s);
    chosen.push({ f, c, pts });
  }
  for (const { f, c, pts } of chosen) {
    const horiz = f.horiz, a0 = horiz ? BB.x0 : BB.y0, a1 = horiz ? BB.x1 : BB.y1;
    const tk = { horiz, c, a0, a1, ang: horiz ? 0 : Math.PI / 2, cross: pts.map(p => horiz ? p.x : p.y) };
    Wd.tracks.push(tk);
    for (const p of pts) {
      const dx = horiz ? 1 : 0, dy = horiz ? 0 : 1;
      Wd.rails.push({ s: p.s, x: p.x, y: p.y, dx, dy, ang: tk.ang, tk, x0: p.x - L5.RAIL_LEN - HW, x1: p.x + L5.RAIL_LEN + HW, y0: p.y - L5.RAIL_LEN - HW, y1: p.y + L5.RAIL_LEN + HW, done: false, bar: 0 });
    }
  }
  Wd.rails.sort((p, q) => p.s - q.s);
  L5.CROSS_S = Wd.rails.map(r => r.s);
};
L5.railHit = (Wd, r, m) => (Wd.tracks || []).some(t => t.horiz
  ? (r.y < t.c + L5.RAIL_HW + m && r.y + r.h > t.c - L5.RAIL_HW - m)
  : (r.x < t.c + L5.RAIL_HW + m && r.x + r.w > t.c - L5.RAIL_HW - m));

`;
s = s.slice(0, a) + neu + s.slice(b);
// отрисовка: непрерывные пути на всю длину
const r0 = s.indexOf('  L5.R.rails = function');
const r1 = s.indexOf("      if (L5.has('l5props2')) {", r0);
if (r0 < 0 || r1 < 0) throw new Error('rails draw');
s = s.slice(0, r0) + `  L5.R.rails = function (c, lv, x0, y0, x1, y1, t) {
    const wd = L5.world, RI = L5.img.l5_rail, TS = 243;
    if (RI) for (const tk of (wd.tracks || [])) {
      if (tk.horiz ? (tk.c + 80 < y0 || tk.c - 80 > y1) : (tk.c + 80 < x0 || tk.c - 80 > x1)) continue;
      const lo = Math.max(tk.a0, (tk.horiz ? x0 : y0) - TS), hi = Math.min(tk.a1, (tk.horiz ? x1 : y1) + TS), u0 = tk.a0 + Math.floor((lo - tk.a0) / TS) * TS;
      c.save(); c.translate(tk.horiz ? 0 : tk.c, tk.horiz ? tk.c : 0); c.rotate(tk.ang);
      for (let u = u0; u < hi; u += TS) c.drawImage(RI, 0, 72, 256, 98, u, -TS * 0.218, TS + 0.6, TS * 0.383);
      for (const cu of tk.cross) if (cu > lo - TS && cu < hi + TS) c.drawImage(RI, 256, 72, 256, 98, cu - TS / 2, -TS * 0.218, TS + 0.6, TS * 0.383);
      c.restore();
    }
    for (const r of (wd.rails || [])) {
      if (r.x1 < x0 || r.x0 > x1 || r.y1 < y0 || r.y0 > y1) continue;
` + s.slice(r1);
fs.writeFileSync('js/level5extra.js', s);
console.log('ok');
