'use strict';
// ============ ГРАФИКА ОБЪЕКТОВ: платформы, лестницы, предметы (из атласов props/items) ============
const Art = {};
G.Art = Art;
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
Art.R = R;

// индексы в атласе items
const ITEM = { brick: 0, bolt: 1, wrench: 2, wrenchpk: 2, bottle: 3, beer: 3, shard: 4, pie: 5, kefir: 6, pelmeni: 7, nut: 8, nutsbox: 9, badge: 10, coin: 11, helmet: 12, helmetRaw: 12, bricks: 13, thermos: 14, extinguisher: 15 };
Art.item = function (c, kind, x, y, rot = 0, s = 1) {
  const i = ITEM[kind];
  if (i == null) return;
  Spr.drawC(c, 'items', i, x, y, rot, s);
};

// индексы в атласе props (лист собирает tools/build_l1props.py; разметка секций — window.L1PROPS)
const PROP = { girder: 0, scaffold: 1, pallet: 2, pipe: 3, hook: 4, ladder: 5, crate: 6, lift: 7, flag: 8, valve: 9 };
Art.PROP = PROP;
const hp = v => Math.round(v * 2) / 2;   // к пикселю холста (логика 640 -> холст 1280)
// Длинная платформа любой ширины: левый торец + целое число средних секций + правый торец.
// Секции режутся по рёбрам/стойкам/фланцам, поэтому стыков не видно; остаток ширины добирается лёгким растяжением.
Art.strip = function (c, name, x, y, w, hh) {
  const m = (window.L1PROPS || {})[name], s = Spr.sheets.props;
  if (!m || !s || !s.img) return;
  const f = s.f[m.i], k = (hh || m.h) / f[3], cu = m.cuts, n0 = cu.length - 1;
  const segs = []; let tot = (cu[0] + f[2] - cu[n0]) * k;
  for (let i = 0; i < 200; i++) { const sw = (cu[i % n0 + 1] - cu[i % n0]) * k; if (tot + sw / 2 > w) break; segs.push(i % n0); tot += sw; }
  const sx = w / tot, dy = y - m.top * k; let dx = x;
  const put = (a, b) => { const x0 = hp(dx); dx += (b - a) * k * sx; const x1 = hp(dx); if (x1 > x0) c.drawImage(s.img, f[0] + a, f[1], b - a, f[3], x0, dy, x1 - x0, f[3] * k); };
  put(0, cu[0]); for (const j of segs) put(cu[j], cu[j + 1]); put(cu[n0], f[2]);
};
// Подвешенная площадка (груз на крюке, люлька): ширина кадра = ширине платформы, линия опоры — на y, тросы тянутся вверх.
Art.hang = function (c, name, x, y, w, rope) {
  const m = (window.L1PROPS || {})[name], s = Spr.sheets.props;
  if (!m || !s || !s.img) return;
  const f = s.f[m.i], k = w / m.bw, x0 = x - m.x0 * k, top = y - m.top * k, r = s.f[m.rope];
  if (r) c.drawImage(s.img, r[0], r[1], r[2], r[3], x0, top - rope, f[2] * k, rope + 0.5);
  c.drawImage(s.img, f[0], f[1], f[2], f[3], x0, top, f[2] * k, f[3] * k);
};
// Тросы крана: кадр cable растягивается по вертикали от y0 до y1, ширина w (логич.), по центру x.
Art.cable = function (c, x, y0, y1, w) {
  const m = (window.L1PROPS || {}).cable, s = Spr.sheets.props;
  if (!m || !s || !s.img || y1 <= y0) return;
  const f = s.f[m.i];
  c.drawImage(s.img, f[0], f[1], f[2], f[3], hp(x - w / 2), y0, w, y1 - y0);
};
Art.platform = function (c, p, t) {
  const x = Math.round(p.x), y = Math.round(p.y), w = p.w;
  switch (p.look) {
    case 'girder': case 'cab': Art.strip(c, 'girder', x, y, w); break;
    case 'scaffold': Art.strip(c, 'scaffold', x, y, w); break;
    case 'pipe': Art.strip(c, 'pipe', x, y, w); break;
    case 'pallet': Art.strip(c, 'pallet', x + (p.crumbling ? Math.sin(t * 60) * 1.2 : 0), y, w); break;
    case 'hook': Art.hang(c, 'hook', x, y, w, 400); break;
    case 'lift': Art.hang(c, 'lift', x, y, w, 780); break;
    case 'crate': {
      const f = Spr.frame('props', PROP.crate);
      if (f) c.drawImage(Spr.sheets.props.img, f[0], f[1], f[2], f[3], x - 1, y - 1, w + 2, p.h + 2);
      break;
    }
    case 'floor': {
      // бесшовный пол цеха (жёлтая разметка, плиты, лужи)
      const img = G.bg.l1floor;
      if (img) { const tw = img.width / 2 * (p.h + 8) / (img.height / 2); for (let tx = x; tx < x + w; tx += tw) c.drawImage(img, Math.floor(tx), y - 6, Math.ceil(tw) + 1, p.h + 8); }
      else R(c, x, y, w, p.h, '#34322f');
      break;
    }
  }
};

Art.ladder = function (c, l) {
  const m = (window.L1PROPS || {}).ladder, s = Spr.sheets.props;
  if (!m || !s || !s.img) return;
  const f = s.f[m.i], k = m.w / f[2], segH = f[3] * k, x0 = hp(l.x + l.w / 2 - m.w / 2);
  c.save(); c.beginPath(); c.rect(x0 - 2, l.y - 4, m.w + 4, l.h + 4); c.clip();
  for (let i = 0, yy = l.y - 4; yy < l.y + l.h; i++, yy += segH) { const y0 = hp(yy), y1 = hp(yy + segH); c.drawImage(s.img, f[0], f[1], f[2], f[3], x0, y0, m.w, y1 - y0); }
  c.restore();
};

Art.checkpoint = function (c, x, y, active, t) {
  const [sw, sh] = Spr.size('props', PROP.flag);
  c.save();
  if (!active) { c.globalAlpha = 0.55; c.filter = 'grayscale(1)'; }
  const sway = active ? Math.sin(t * 5) * 0.03 : 0;
  Spr.drawC(c, 'props', PROP.flag, x + sw / 2 - 6, y - sh / 2, sway, 1);
  c.restore();
};

// Паровой отвод: участок той же трубы с вертикальным отводом (тройник), кладётся поверх трубы; x — центр раструба, y — верх трубы.
Art.teeK = () => { const L = window.L1PROPS || {}, s = Spr.sheets.props; return L.pipe && s ? L.pipe.h / s.f[L.pipe.i][3] : 0; };
Art.teeH = () => { const m = (window.L1PROPS || {}).tee; return m ? m.top * Art.teeK() : 20; };   // высота раструба над трубой
Art.tee = function (c, x, y) {
  const m = (window.L1PROPS || {}).tee, s = Spr.sheets.props;
  if (!m || !s || !s.img) return;
  const f = s.f[m.i], k = Art.teeK();
  c.drawImage(s.img, f[0], f[1], f[2], f[3], hp(x - m.x0 * k), hp(y - m.top * k), f[2] * k, f[3] * k);
};
