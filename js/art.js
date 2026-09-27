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

// индексы в атласе props
const PROP = { girder: 0, scaffold: 1, pallet: 2, pipe: 3, hook: 4, ladder: 5, crate: 6, lift: 7, flag: 8, valve: 9 };
Art.PROP = PROP;
Art.platform = function (c, p, t) {
  const x = Math.round(p.x), y = Math.round(p.y), w = p.w;
  switch (p.look) {
    case 'girder': case 'cab': Spr.slice3(c, 'props', PROP.girder, x, y - 1, w, { h: 13 }); break;
    case 'scaffold': Spr.slice3(c, 'props', PROP.scaffold, x, y - 2, w, { h: 26 }); break;
    case 'pipe': Spr.slice3(c, 'props', PROP.pipe, x, y - 1, w, { h: 13 }); break;
    case 'pallet': {
      const sh = p.crumbling ? Math.sin(t * 60) * 1.2 : 0;
      Spr.slice3(c, 'props', PROP.pallet, x + sh, y - 1, w, { h: 12 });
      break;
    }
    case 'hook': {
      R(c, x + w / 2 - 1, y - 420, 2, 380, '#1c1c1c');
      const [sw, sh] = Spr.size('props', PROP.hook);
      const k = w / sw;
      Spr.drawC(c, 'props', PROP.hook, x + w / 2, y - sh * k * 0.84 + sh * k / 2, 0, k);
      break;
    }
    case 'lift': {
      R(c, x + w / 2 - 1, y - 800, 2, 760, '#1c1c1c');
      const [sw, sh] = Spr.size('props', PROP.lift);
      const k = w / sw;
      Spr.drawC(c, 'props', PROP.lift, x + w / 2, y - sh * k * 0.9 + sh * k / 2, 0, k);
      break;
    }
    case 'crate': {
      const f = Spr.frame('props', PROP.crate);
      if (f) c.drawImage(Spr.sheets.props.img, f[0], f[1], f[2], f[3], x - 2, y - 2, w + 4, p.h + 2);
      break;
    }
    case 'floor':
      // пол уже нарисован на фоне цеха — только лёгкая тень у ног
      c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x, y, w, 3);
      break;
  }
};

Art.ladder = function (c, l) {
  const [sw, sh] = Spr.size('props', PROP.ladder);
  const k = 26 / sw;
  const segH = sh * k;
  const cx = l.x + l.w / 2;
  c.save(); c.beginPath(); c.rect(cx - 20, l.y - 4, 40, l.h + 4); c.clip();
  for (let yy = l.y - 4; yy < l.y + l.h; yy += segH - 1) Spr.drawC(c, 'props', PROP.ladder, cx, yy + segH / 2, 0, k);
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

Art.valve = function (c, x, y) {
  const [sw, sh] = Spr.size('props', PROP.valve);
  Spr.drawC(c, 'props', PROP.valve, x, y - sh / 2, 0, 1);
};
