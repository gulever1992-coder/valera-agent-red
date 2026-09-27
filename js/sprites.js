'use strict';
// ============ СПРАЙТЫ: атласы из tools/build_assets.py, анимации, отрисовка ============
// Атласы хранятся в «реальных» пикселях холста (x2), рисуем в логических координатах 640x360.
const Spr = { sheets: {}, flashCache: new Map() };
G.Spr = Spr;

Spr.load = async function () {
  const list = Object.entries(window.SPRITES || {});
  await Promise.all(list.map(async ([name, s]) => {
    const img = await G.loadImage(s.img);
    Spr.sheets[name] = { img, f: s.f };
  }));
};

// кадр: [x, y, w, h, ax, ay]
Spr.frame = (sheet, i) => { const s = Spr.sheets[sheet]; return s && s.f[i]; };

function flashImg(sheet, i, color) {
  const key = sheet + ':' + i + ':' + color;
  let cv = Spr.flashCache.get(key);
  if (cv) return cv;
  const s = Spr.sheets[sheet], f = s.f[i];
  cv = document.createElement('canvas'); cv.width = f[2]; cv.height = f[3];
  const x = cv.getContext('2d');
  x.drawImage(s.img, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]);
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = color; x.fillRect(0, 0, f[2], f[3]);
  Spr.flashCache.set(key, cv);
  return cv;
}

// рисует кадр так, что его «якорь» (ноги) оказывается в точке x,y
Spr.draw = function (c, sheet, i, x, y, facing = 1, o = {}) {
  const s = Spr.sheets[sheet];
  if (!s || !s.img) return;
  const f = s.f[i];
  if (!f) return;
  const k = (o.scale || 1) / 2;
  c.save();
  c.translate(x, y);
  if (o.rot) c.rotate(o.rot);
  if (facing < 0) c.scale(-1, 1);
  if (o.alpha != null) c.globalAlpha *= o.alpha;
  if (o.flash) c.drawImage(flashImg(sheet, i, o.flash), -f[4] * k, -f[5] * k, f[2] * k, f[3] * k);
  else c.drawImage(s.img, f[0], f[1], f[2], f[3], -f[4] * k, -f[5] * k, f[2] * k, f[3] * k);
  c.restore();
};
// по центру кадра (для предметов)
Spr.drawC = function (c, sheet, i, x, y, rot = 0, scale = 1) {
  const s = Spr.sheets[sheet];
  if (!s || !s.img) return;
  const f = s.f[i], k = scale / 2;
  c.save(); c.translate(x, y); if (rot) c.rotate(rot);
  c.drawImage(s.img, f[0], f[1], f[2], f[3], -f[2] * k / 2, -f[3] * k / 2, f[2] * k, f[3] * k);
  c.restore();
};
Spr.size = (sheet, i) => { const f = Spr.frame(sheet, i); return f ? [f[2] / 2, f[3] / 2] : [0, 0]; };

// ---------- анимации ----------
// fr: [лист, кадр] или массив таких пар; fps; flip — кадр нарисован «лицом влево»
const A = (sheet, frames, fps = 8, o = {}) => Object.assign({ fr: frames.map(i => [sheet, i]), fps }, o);
Spr.ANIM = {
  valera: {
    stand: A('v_jump', [0, 1], 1.6),
    run: A('v_run', [0, 1, 2, 3, 4, 5, 6, 7], 14),
    walk: A('v_run', [0, 1, 2, 3, 4, 5, 6, 7], 9),
    jump: A('v_jump', [2]), fall: A('v_jump', [3]), land: A('v_jump', [4]), hurt: A('v_jump', [5]),
    jab: A('v_fight', [0]), cross: A('v_fight', [1]), upper: A('v_fight', [2]),
    throwA: A('v_fight', [2]), throwB: A('v_fight', [4]), ko: A('v_fight', [5]),
    hips: A('v_idle', [0]), stomp: A('v_idle', [0, 1, 1, 2, 0], 4.5), scratch: A('v_idle', [3]), yawn: A('v_idle', [4]), belly: A('v_idle', [5]),
    climb: A('v_climb2', [0, 1], 5), crouch: A('v_bottle', [6]), bCrouch: A('v_bottle', [5]),
    bIdle: A('v_bottle', [0]), bWind: A('v_bottle', [1]), bSwing: A('v_bottle', [2]), bThrow: A('v_bottle', [3]), drink: A('v_bottle', [4]),
    hang: A('v_climb2', [2]), walkAway: A('v_climb2', [3]), backDoor: A('v_climb2', [4]),
    sting: A('v_story3', [0]), beerHappy: A('v_story3', [1]), shoutFist: A('v_story3', [2]), tiredStand: A('v_story3', [3]), dazed: A('v_story3', [4]), victory: A('v_story3', [5]),
    shout: A('v_story', [2]), point: A('v_story', [3]), slamHat: A('v_story', [4]), scared: A('v_story', [5]),
    work: A('v_story2', [0]), lookUpHat: A('v_story2', [1]), lever: A('v_story2', [2], 1, { flip: true }), sitChair: A('v_story2', [3], 1, { flip: true }),
    tired: A('v_story2', [4]), lookUp: A('v_story2', [5]),
  },
  natasha: {
    stand: A('n_a', [0]), idle: A('n_a', [0]), walk: A('n_a', [1, 2], 5), run: A('n_a', [1, 2], 9),
    wind: A('n_a', [3]), slap: A('n_a', [4]), throw: A('n_a', [5]),
    drink: A('n_b', [0]), dizzy: A('n_b', [1]), hurt: A('n_b', [2]), sitFloor: A('n_b', [3]), sitChair: A('n_b', [4]), charge: A('n_b', [5]), jump: A('n_b', [5]),
  },
  commando: {
    rappel: A('cmd', [0]), rifle: A('cmd', [1]), rifleL: A('cmd', [2], 1, { flip: true }), point: A('cmd', [3], 1, { flip: true }), surprised: A('cmd', [4]),
  },
  drunk: { stand: A('enemies', [4]), swing: A('enemies', [5]), ko: A('enemies', [6]) },
  kesha: {
    stand: A('kesha_a', [0]), idle: A('kesha_a', [0]), walk: A('kesha_a', [1, 0], 5), master: A('kesha_a', [2]), punch: A('kesha_a', [3]), kick: A('kesha_a', [4]),
    sniff: A('kesha_a', [5]), shout: A('kesha_a', [6]), hurt: A('kesha_a', [7]),
    aim: A('kesha_b', [0]), shoot: A('kesha_b', [1]), run: A('kesha_b', [2]), ko: A('kesha_b', [3]), sit: A('kesha_b', [4]), thumbs: A('kesha_b', [5]), talk: A('kesha_b', [6]),
  },
  valeraBig: {
    stand: A('vb_story3', [3]), walk: A('vb_run', [0, 1, 2, 3, 4, 5, 6, 7], 9), tiredStand: A('vb_story3', [3]), dazed: A('vb_story3', [4]), shoutFist: A('vb_story3', [2]), beerHappy: A('vb_story3', [1]),
  },
  spy: { peek: A('cmd_hide', [0]), bush: A('cmd_hide', [1]), prone: A('cmd_hide', [2]), dart: A('cmd_hide', [3]), rope: A('cmd_hide', [4]), run: A('cmd_hide', [5]) },
};
Spr.frameOf = function (anim, t) {
  const n = anim.fr.length;
  if (n === 1) return anim.fr[0];
  const i = anim.once ? Math.min(n - 1, Math.floor(t * anim.fps)) : Math.floor(t * anim.fps) % n;
  return anim.fr[i];
};
Spr.drawAnim = function (c, set, name, t, x, y, facing, o = {}) {
  const anim = (Spr.ANIM[set] || {})[name] || Spr.ANIM[set].stand;
  const [sheet, i] = Spr.frameOf(anim, t);
  Spr.draw(c, sheet, i, x, y, anim.flip ? -facing : facing, o);
};

// ---------- 3-slice для платформ ----------
Spr.slice3 = function (c, sheet, i, x, y, w, o = {}) {
  const s = Spr.sheets[sheet];
  if (!s || !s.img) return;
  const f = s.f[i];
  const hh = (o.h || f[3] / 2);
  const cap = Math.min(Math.round(f[2] * 0.14), f[2] / 2 - 2);
  const capL = cap / f[3] * hh * 2 / 2; // логическая ширина торца
  const img = s.img, sx = f[0], sy = f[1], sw = f[2], sh = f[3];
  if (w <= capL * 2 + 2) { c.drawImage(img, sx, sy, sw, sh, x, y, w, hh); return; }
  c.drawImage(img, sx, sy, cap, sh, x, y, capL, hh);
  c.drawImage(img, sx + sw - cap, sy, cap, sh, x + w - capL, y, capL, hh);
  const midSw = sw - cap * 2, midW = midSw / sh * hh;
  let cx = x + capL;
  const end = x + w - capL;
  while (cx < end - 0.5) {
    const dw = Math.min(midW, end - cx);
    c.drawImage(img, sx + cap, sy, midSw * dw / midW, sh, cx, y, dw, hh);
    cx += dw;
  }
};

// фоновые картинки
G.bg = {};
Spr.loadBGs = async function () {
  const names = { aerial: 'assets/bg_aerial.jpg', hall: 'assets/bg_hall.jpg', arena: 'assets/bg_arena.jpg', climbBottom: 'assets/bg_climb_bottom.jpg', climbTop: 'assets/bg_climb_top.jpg', shop: 'assets/bg_shop.jpg', l1floor: 'assets/l1_floor.jpg', sky: 'assets/bg_sky.jpg', fgCars: 'assets/fg_cars.png' };
  await Promise.all(Object.entries(names).map(async ([k, src]) => { G.bg[k] = await G.loadImage(src); }));
  const ps = { valera: 'assets/spr/p_valera.png', natasha: 'assets/spr/p_natasha.png', commando: 'assets/spr/p_cmd.png', commando2: 'assets/spr/p_cmd2.png', kesha: 'assets/spr/p_kesha.png', seller: 'assets/spr/p_seller.png' };
  G.portraits = {};
  await Promise.all(Object.entries(ps).map(async ([k, src]) => { G.portraits[k] = await G.loadImage(src); }));
};
