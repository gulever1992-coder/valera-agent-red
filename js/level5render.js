'use strict';
// ============ УРОВЕНЬ 5: отрисовка — псевдообъём (здания, деревья, фонари) только из спрайтов и текстур Codex ============
L5.R = {};
const RP = () => L5.PERSP;

// аффинная «полоска» текстуры: исходный прямоугольник -> параллелограмм (P0 — низ слева, P1 — низ справа, P2 — верх слева, P3 — верх справа)
L5.R.slice = function (c, img, sx, sy, sw, sh, p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {
  c.save();
  const ax = p3x == null ? p1x - p0x : ((p1x - p0x) + (p3x - p2x)) / 2, ay = p3y == null ? p1y - p0y : ((p1y - p0y) + (p3y - p2y)) / 2;
  c.transform(ax / sw, ay / sw, -(p2x - p0x) / sh, -(p2y - p0y) / sh, p2x, p2y);
  c.drawImage(img, sx, sy, sw, sh, -0.4, 0, sw + 1.1, sh);
  c.restore();
};
// проекция точки на высоте z относительно центра экрана C
const PX = (x, C, k) => C.x + (x - C.x) * k;
const PY = (y, C, k) => C.y + (y - C.y) * k;

// ---------- стена ----------
// (lx,ly)-(rx,ry): основание стены слева направо, если смотреть снаружи; z0..z1 — высоты
// Фасад растягивается ровно на длину стены (элевации) или повторяется по длине с неизменным масштабом окон.
L5.R.wall = function (c, C, lx, ly, rx, ry, z0, z1, tex, o = {}) {
  if (!tex || !tex.img) return;
  const P = RP(), k0 = 1 + z0 / P, k1 = 1 + z1 / P;
  const b0x = PX(lx, C, k0), b0y = PY(ly, C, k0), b1x = PX(rx, C, k0), b1y = PY(ry, C, k0);
  const t0x = PX(lx, C, k1), t0y = PY(ly, C, k1), t1x = PX(rx, C, k1), t1y = PY(ry, C, k1);
  const len = Math.hypot(rx - lx, ry - ly), hgt = z1 - z0;
  if (len < 1) return;
  const stretch = o.stretch, tileW = stretch ? len : Math.max(40, (o.tileH || 62) * tex.sw / tex.sh);
  const step = Math.max(5, Math.min(11, len / 22));
  // вертикаль: для повторяющихся фасадов показываем нижнюю часть плитки пропорционально высоте стены
  const vh = stretch ? tex.sh : Math.min(tex.sh, tex.sh * hgt / (o.tileH || 62)), vy = tex.sy + tex.sh - vh;
  let a = 0;
  while (a < len - 0.01) {
    let a2 = Math.min(len, a + step);
    if (!stretch) a2 = Math.min(a2, (Math.floor(a / tileW + 1e-6) + 1) * tileW);
    const u0 = stretch ? a / len : (a % tileW) / tileW, u1 = stretch ? a2 / len : u0 + (a2 - a) / tileW;
    const f0 = a / len, f1 = a2 / len;
    L5.R.slice(c, tex.img, tex.sx + u0 * tex.sw, vy, Math.max(0.5, (u1 - u0) * tex.sw), vh,
      b0x + (b1x - b0x) * f0, b0y + (b1y - b0y) * f0, b0x + (b1x - b0x) * f1, b0y + (b1y - b0y) * f1, t0x + (t1x - t0x) * f0, t0y + (t1y - t0y) * f0, t0x + (t1x - t0x) * f1, t0y + (t1y - t0y) * f1);
    a = a2;
  }
  // боковая сторона чуть темнее (освещение), одной заливкой
  if (o.shade) { c.beginPath(); c.moveTo(b0x, b0y); c.lineTo(b1x, b1y); c.lineTo(t1x, t1y); c.lineTo(t0x, t0y); c.closePath(); c.fillStyle = 'rgba(8,6,24,' + o.shade + ')'; c.fill(); }
};

// ---------- крыша: картинка крыши здания (вид сверху) или повтор плитки, приподнятая на высоту ----------
L5.R.roof = function (c, C, x, y, w, d, z, tile, o = {}) {
  const k = 1 + z / RP(), rx = PX(x, C, k), ry = PY(y, C, k);
  c.save(); c.translate(rx, ry); c.scale(k, k);
  if (o.img && o.img.img) {
    const I = o.img, f = o.front;
    if (f === 'W') { c.translate(w, 0); c.rotate(Math.PI / 2); c.drawImage(I.img, I.sx, I.sy, I.sw, I.sh, 0, 0, d, w); }
    else if (f === 'E') { c.translate(0, d); c.rotate(-Math.PI / 2); c.drawImage(I.img, I.sx, I.sy, I.sw, I.sh, 0, 0, d, w); }
    else if (f === 'N') { c.translate(w, d); c.rotate(Math.PI); c.drawImage(I.img, I.sx, I.sy, I.sw, I.sh, 0, 0, w, d); }
    else c.drawImage(I.img, I.sx, I.sy, I.sw, I.sh, 0, 0, w, d);
  } else { c.fillStyle = L5.getPat(c, tile); c.fillRect(0, 0, w, d); }
  c.restore();
  return { x: rx, y: ry, w: w * k, d: d * k, k };
};

// ---------- здание: стены-фасады, крыша ----------
L5.R.box = function (c, C, b, t) {
  const z0 = b.z0, z1 = b.z0 + b.H, x0 = b.x, x1 = b.x + b.w, y0 = b.y, y1 = b.y + b.d;
  const T = L5.tex(b.tex || 't19');
  const elev = b.elev && T.img;
  const wo = side => ({ stretch: elev && b.front === side, shade: { N: 0.1, W: 0.2, E: 0.34, S: 0.26 }[side] });
  if (b.H < 8) { if (!b.arch) L5.R.roof(c, C, x0, y0, b.w, b.d, z1, b.roof || 8, { img: b.roofImg ? L5.tex(b.roofImg) : null, front: b.front }); return; }
  if (C.y < y0) L5.R.wall(c, C, x1, y0, x0, y0, z0, z1, T, wo('N'));
  if (C.y > y1) L5.R.wall(c, C, x0, y1, x1, y1, z0, z1, T, wo('S'));
  if (C.x < x0) L5.R.wall(c, C, x0, y0, x0, y1, z0, z1, T, wo('W'));
  if (C.x > x1) L5.R.wall(c, C, x1, y1, x1, y0, z0, z1, T, wo('E'));
  if (b.arch) return; // арка: только лицо
  L5.R.roof(c, C, x0, y0, b.w, b.d, z1, b.roof || 8, { img: b.roofImg ? L5.tex(b.roofImg) : null, front: b.front });
};

// ---------- дерево: ствол (мелкая крона у земли) + крона на высоте, качается ----------
L5.R.tree = function (c, C, o, t) {
  if (!L5.has('l5props')) return;
  const kind = o.tk, z = kind === 'spruce' ? 22 : kind === 'birch' ? 19 : 20, k = 1 + z / RP(), km = 1 + z * 0.5 / RP();
  const cx = PX(o.x, C, k), cy = PY(o.y, C, k), sway = Math.sin(t * 1.3 + o.ph) * 0.035 + Math.sin(t * 2.9 + o.ph * 2) * 0.012 + (o.hitT != null ? Math.max(0, 0.7 - (G.t - o.hitT)) * Math.sin(G.t * 38) * 0.12 : 0);
  const fr = kind === 'spruce' ? 3 : kind === 'birch' ? 5 : L5.PR.tree[o.col % 3];
  const T2 = L5.has('l5trees2') && (kind === 'spruce' || kind === 'birch'), sh = T2 ? 'l5trees2' : 'l5props', fr2 = T2 ? (kind === 'spruce' ? 2 : 0) + (o.col % 2) : fr;
  // нижний ярус (у ствола): уменьшенная тёмная крона
  c.save(); c.translate(o.x, o.y - 4); c.scale(0.5 * o.sz, 0.5 * o.sz); Spr.drawC(c, sh, fr2, 0, 0, 0, 1); c.restore();
  // средний ярус: крона непрерывно «растёт» из ствола, не отрываясь от земли
  c.save(); c.translate(PX(o.x, C, km), PY(o.y, C, km) - 2); c.rotate(sway * 0.5); c.scale(0.78 * o.sz * km, 0.78 * o.sz * km); Spr.drawC(c, sh, fr2, 0, 0, 0, 1); c.restore();
  c.save(); c.globalAlpha = Math.max(0.35, Math.min(1, Math.hypot(o.x - C.x, o.y - C.y) / 110)); c.translate(cx, cy); c.rotate(sway);
  Spr.drawC(c, sh, fr2, 0, 0, 0, k * o.sz);
  c.restore();
};

// ---------- фонарь: спрайт l5props ----------
L5.R.lamp = function (c, C, o, t) {
  if (L5.has('l5props')) Spr.drawC(c, 'l5props', 6, o.x + 6, o.y - 8, 0, 1);
};
