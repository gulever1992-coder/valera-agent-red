'use strict';
// ============ УРОВЕНЬ 7, версия 4 (по наброскам 2026-10-08): гроза, КПП → забор → люк ... ============
// Весь арт — Google Flow (art_src/l7/v4_* → py tools/build_l7v4.py → assets/l7v4 + листы cmd4/rich4/press4/cars4/props4/fx4).
// Кодом — только движение, анимация кадров, свет (вспышки/конусы) и компоновка слоёв.
const V4 = {};
G.V4 = V4;
V4.GY = 300;
V4.img = {};

V4.load = async function () {
  const f = { sky: 'sky.jpg', far: 'far.png', kpp: 'kpp.png', fence: 'fence.png', admin: 'admin.png', sewer: 'sewer.jpg', park: 'park.png', shop: 'shop.png', roof: 'roof.png', scaff: 'scaff.png',
    hall: 'hall.jpg', hall_fg: 'hall_fg.png', hall_dr1: 'hall_dr1.png', hall_dr2: 'hall_dr2.png', hl_lift: 'hl_lift.png', hl_hook: 'hl_hook.png', hl_box: 'hl_box.png', hl_scan: 'hl_scan.png', hl_belt: 'hl_belt.png', hl_sign: 'hl_sign.png', hl_chain: 'hl_chain.png', hl_cam: 'hl_cam.png', hl_locker: 'hl_locker.png', st_well: 'st_well.jpg', st_well_fg: 'st_well_fg.png', st2_brick: 'st2_brick.png', st2_beam: 'st2_beam.png', st2_gate: 'st2_gate.png', st2_land: 'st2_land.png', st2_crate: 'st2_crate.png', st2_barrel: 'st2_barrel.png', st2_cam: 'st2_cam.png', st2_lamp: 'st2_lamp.png', mgw_panel: 'mgw_panel.jpg', mgw_plug0: 'mgw_plug0.png', mgw_plug1: 'mgw_plug1.png', mgw_plug2: 'mgw_plug2.png', mgw_sock0: 'mgw_sock0.png', mgw_sock1: 'mgw_sock1.png', mgw_sock2: 'mgw_sock2.png', mgw_wire0: 'mgw_wire0.png', mgw_wire1: 'mgw_wire1.png', mgw_wire2: 'mgw_wire2.png', mgw_hand: 'mgw_hand.png', mgw_spark: 'mgw_spark.png', mgw_lamp: 'mgw_lamp.png', st_wall: 'st_wall.jpg', st_flight: 'st_flight.png', st_plat: 'st_plat.png', st_floor: 'st_floor.png', st_door0: 'st_door0.png', st_door1: 'st_door1.png', st_box: 'st_box.png', st_lamp: 'st_lamp.png', stair: 'stair.jpg', stair_rail: 'stair_rail.png', sew_ladder: 'sew_ladder.png', corner: 'corner.png', shopbig: 'shopbig.jpg', shopfar: 'shopfar.png', corner_b: 'corner_b.png', corr0: 'corr0.jpg', corr1: 'corr1.jpg', hall: 'hall.jpg', mg0: 'mg0.jpg', mg1: 'mg1.jpg', mg2: 'mg2.jpg', road: 'road.png', vanin: 'vanin.jpg', campole: 'campole.png', camhead: 'camhead.png', shopcap: 'shopcap.png', shopdoor_l: 'shopdoor_l.png', shopdoor_r: 'shopdoor_r.png', van_big: 'van_big.png', van_empty: 'van_empty.png', van_wheels: 'van_wheels.png', cabin: 'cabin.png', wiper: 'wiper.png' };
  for (let i = 1; i <= 4; i++) f['fl' + i] = 'fl' + i + '.png'; for (const n in (window.V4_PROPS || {})) f['pr_' + n] = 'pr/' + n + '.png';
  Object.assign(f, { tw_sign: 'tw_sign.png', tw_door: 'tw_door.png', tw_cam: 'tw_cam.png' }); for (let i = 0; i < 6; i++) f['tw_win' + i] = 'tw_win' + i + '.png';
  for (let i = 0; i < 4; i++) { f['roomA' + i] = 'roomA' + i + '.jpg'; f['roomB' + i] = 'roomB' + i + '.jpg'; }
  try { V4.pCmd = await G.loadImage('assets/spr/p_cmd.png'); } catch (e) {}   // портрет спецназовца ур.2 (усатый) — для охраны v4
  await Promise.all(Object.entries(f).map(async ([k, n]) => { try { V4.img[k] = await G.loadImage('assets/l7v4/' + n); } catch (e) {} }));
};

// ---------- анимации ----------
const A4 = (sheet, fr, fps = 8, o = {}) => Object.assign({ fr: fr.map(i => [sheet, i]), fps }, o);
const r4 = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
V4.setupAnims = function () {
  L7.setupAnims();
  Spr.ANIM.cmd4 = { walk: A4('cmd4', r4(0, 6), 9), drag: A4('cmd4', r4(0, 6), 6), stand: A4('cmd4', [7, 8], 1.5), look: A4('cmd4', [9]), alert: A4('cmd4', [11]), point: A4('cmd4', [11]),
    run: A4('cmd4', [12, 13], 9), stagger: A4('cmd4', [14]), fall: A4('cmd4', [15]), ko: A4('cmd4', [16]), tie: A4('cmd4', [17]), sit: A4('cmd4', [16]), aim: A4('cmd4', [11]),
    talk: A4('cmd4', [19, 7], 2.5), radio: A4('cmd4', [19]) };
  Spr.ANIM.richm4 = { walk: A4('rich4', r4(0, 7), 9), stand: A4('rich4', [8]), laugh: A4('rich4', [8, 9], 3), talk: A4('rich4', [10, 11], 2.5) };
  Spr.ANIM.richw4 = { walk: A4('rich4', r4(15, 21), 9), stand: A4('rich4', [12, 13, 14, 13], 1.5), talk: A4('rich4', [12, 13], 2) };
  Spr.ANIM.photo4 = { walk: A4('press4', r4(0, 4), 8), stand: A4('press4', [5]), shoot: A4('press4', [6]) };
  Spr.ANIM.tv4 = { walk: A4('press4', r4(7, 11), 8), stand: A4('press4', [12]), film: A4('press4', [12, 13], 1.5) };
  Spr.ANIM.rep4 = { walk: A4('press4', r4(14, 18), 8), stand: A4('press4', [19]), talk: A4('press4', [19, 20], 2.5) };
  // Валера v4: на четвереньках (ползком), лай, протискивание в будку, кнопки, удар ногой в прыжке
  Object.assign(Spr.ANIM.valera7, { crouch: A4('val4', [0]), sneak: A4('val4', r4(0, 5), 9), bark4: A4('val4', [6, 7], 7), squeeze4: A4('val4', [11, 12], 5),
    panel4: A4('val4', [13, 14], 3), kick4: A4('val4', [9, 10], 6), hang4: A4('v7b', [4, 5], 3) });
  // канализация: крысы и бомжи ур.2 (новые циклы ходьбы из Flow, удар/нокаут — кадры ур.2)
  const M = (sh, i) => ({ fr: [[sh, i]], fps: 1 });
  Spr.ANIM.rat4 = { walk: A4('rat7', [0, 1, 2, 3], 12), stand: A4('rat7', [8, 9], 3), attack: A4('rat7', [5]), hurt: A4('rat7', [6]), ko: A4('rat7', [7]) };
  Spr.ANIM.bomzh4 = { walk: A4('bums4', r4(0, 5), 8), stand: A4('bums4', [0]), attack: A4('bums4', [6, 7], 6), hurt: M('bomzh', 0), ko: M('bomzh', 3) };
  Spr.ANIM.alk4 = { walk: A4('bums4', r4(8, 13), 8), stand: A4('bums4', [8]), attack: A4('bums4', [14, 15], 6), hurt: M('bomzh', 6), ko: M('bomzh', 7) };
  Spr.ANIM.gop4 = { walk: A4('bums4', r4(16, 21), 9), stand: A4('bums4', [16]), attack: A4('bums4', [22, 23], 6), hurt: M('gopnik', 5), ko: M('gopnik', 6) };
  // босс — главарь спецназа
  Spr.ANIM.boss4 = { run: A4('boss4a', r4(0, 7), 11), shoot: A4('boss4a', [8, 9], 10), crouchShoot: A4('boss4a', [10]), roll: A4('boss4a', [11]), aim: A4('boss4a', [12]), dodge: A4('boss4a', [13]),
    reload: A4('boss4a', [14, 15], 2), eat: A4('boss4a', [16, 17], 4), grenade: A4('boss4a', [18]), hurt: A4('boss4a', [19]),
    stand: A4('boss4b', [0, 1], 2), taunt: A4('boss4b', [2]), laugh: A4('boss4b', [3]), prejump: A4('boss4b', [4]), jump: A4('boss4b', [5]), punch: A4('boss4b', [6, 7], 8), kick: A4('boss4b', [8]),
    block: A4('boss4b', [9]), land: A4('boss4b', [10]), cart: A4('boss4b', [11]), dizzy: A4('boss4b', [12]), ko: A4('boss4b', [13]), sit: A4('boss4b', [14, 15], 1), point: A4('boss4b', [16]), walk: A4('boss4a', r4(0, 7), 8) };
  Object.assign(WHO, { cmd4: { name: 'СПЕЦНАЗОВЕЦ', color: '#8ac070', voice: 170 }, rep4: { name: 'РЕПОРТЁРША', color: '#e0b080', voice: 360 } });
};

// ---------- панорама ближнего плана: куски Flow стыкуются плавным перетеканием, без швов ----------
// seg: { k: картинка, s: масштаб (px картинки -> лог. px), fy: линия ног в px картинки, ov: нахлёст с предыдущим (лог. px), flip }
V4.buildStrip = function (segs) {
  let x = 0; const placed = [];
  for (const s of segs) {
    const img = V4.img[s.k]; if (!img) continue;
    const w = img.width * s.s, h = img.height * s.s;
    if (placed.length) x -= s.ov || 0;
    placed.push(Object.assign({ x, y: V4.GY - s.fy * s.s, w, h, img }, s)); x += w;
  }
  const total = Math.ceil(x), cv = document.createElement('canvas');
  cv.width = total * 2; cv.height = H * 2;
  const c = cv.getContext('2d'); c.imageSmoothingEnabled = true;
  const tmp = document.createElement('canvas'), t = tmp.getContext('2d');
  for (const p of placed) {
    tmp.width = Math.ceil(p.w * 2); tmp.height = Math.ceil(p.h * 2); t.clearRect(0, 0, tmp.width, tmp.height);
    t.save(); if (p.flip) { t.translate(tmp.width, 0); t.scale(-1, 1); } t.drawImage(p.img, 0, 0, tmp.width, tmp.height); t.restore();
    if (p.ov) {   // мягкий левый край — растворяется в предыдущем куске
      const g = t.createLinearGradient(0, 0, tmp.width, 0), k = p.ov * 2 / tmp.width; g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(k, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,1)');
      t.globalCompositeOperation = 'destination-in'; t.fillStyle = g; t.fillRect(0, 0, tmp.width, tmp.height); t.globalCompositeOperation = 'source-over';
    }
    c.drawImage(tmp, Math.round(p.x * 2), Math.round(p.y * 2));
    if (p.hardY) {   // стена здания — с чётким левым краем (растворяется только земля ниже hardY); слева приставлен угловой пилон cap
      c.drawImage(p.img, 0, 0, p.img.width, p.hardY, Math.round(p.x * 2), Math.round(p.y * 2), tmp.width, Math.round(p.hardY * p.s * 2));
      const cap = V4.img[p.cap]; if (cap) { const cw = cap.width * p.s * 2, ch = cap.height * p.s * 2; c.drawImage(cap, Math.round(p.x * 2 - cw), Math.round((p.y + p.capY * p.s) * 2 - ch), cw, ch); }
    }
    const bot = p.y + p.h; if (bot < H) { const k = Math.ceil((H - bot) * 2) + 4, sy = tmp.height - k;
      const B = Math.round(bot * 2); c.save(); c.translate(0, 2 * B); c.scale(1, -1); c.drawImage(tmp, 0, sy, tmp.width, k, Math.round(p.x * 2), B - k, tmp.width, k); c.restore(); }
  }
  return { cv, w: total, placed };
};

// ---------- гроза: небо, молнии, дождь, брызги ----------
V4.Storm = class {
  constructor() { this.t = 0; this.next = 2.5; this.bolt = null; this.flash = 0; this.thunder = []; this.spl = []; this.rainT = 0; }
  strike(force) {
    this.bolt = { fr: U.randi(0, 3), x: U.rand(60, W - 60), t: 0, s: U.rand(1.1, 1.7), flip: Math.random() < 0.5 ? -1 : 1 };
    this.flash = force ? 1 : U.rand(0.6, 1);
    this.thunder.push(U.rand(0.35, 1.1));
    this.next = U.rand(5, 10);
  }
  update(dt, ground) {
    this.t += dt; this.next -= dt; this.rainT += dt;
    if (this.next <= 0) this.strike();
    if (this.bolt) { this.bolt.t += dt; if (this.bolt.t > 0.45) this.bolt = null; }
    this.flash = Math.max(0, this.flash - dt * 2.6);
    this.thunder = this.thunder.map(x => x - dt).filter(x => { if (x <= 0) { Sound.play('thunder'); G.shake(1.5, 0.4); return false; } return true; });
    if (ground) for (let i = 0; i < 3; i++) if (Math.random() < dt * 30) this.spl.push({ x: U.rand(0, W), y: U.rand(V4.GY - 2, H - 4), t: 0 });
    for (const s of this.spl) s.t += dt; this.spl = this.spl.filter(s => s.t < 0.24);
  }
  // небо (тайлы-зеркала, медленный дрейф) + молния за дальним планом
  drawSky(c, cx) {
    const img = V4.img.sky; if (!img) { c.fillStyle = '#1a1c2c'; c.fillRect(0, 0, W, H); return; }
    const off = cx * 0.05 + this.t * 3;
    let x = -(((off % (W * 2)) + W * 2) % (W * 2));
    for (; x < W; x += W) { const odd = Math.floor((off + x) / W + 0.001) % 2 !== 0;
      if (odd) { c.save(); c.translate(Math.round(x) + W, 0); c.scale(-1, 1); c.drawImage(img, 0, 0, W, H); c.restore(); } else c.drawImage(img, Math.round(x), 0, W, H); }
    if (this.flash > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(150,160,230,${0.45 * this.flash})`; c.fillRect(0, 0, W, H); c.restore(); }
    const b = this.bolt;
    if (b && ((b.t * 22) | 0) % 3 !== 1) { c.save(); c.globalCompositeOperation = 'lighter'; Spr.draw(c, 'fx4', b.fr, b.x, 20, b.flip, { scale: b.s * 1.3, alpha: 1 - b.t / 0.5 }); c.restore(); }
  }
  // подсветка всей сцены вспышкой (поверх слоёв, до дождя)
  drawFlash(c) { if (this.flash > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(120,130,190,${0.22 * this.flash})`; c.fillRect(0, 0, W, H); c.restore(); } }
  // дождь — тайлы из Flow (fx4: 12 крупный, 13 мелкий), два слоя с разной скоростью
  drawRain(c, cx, a = 1) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const lay = (fr, sp, drift, par, alpha, sc) => {
      const [tw, th] = Spr.size('fx4', fr).map(v => v * sc); if (!tw) return;
      const ox = ((-cx * par - this.rainT * drift) % tw + tw) % tw, oy = (this.rainT * sp) % th;
      for (let y = oy - th; y < H; y += th) for (let x = ox - tw; x < W + tw; x += tw) Spr.draw(c, 'fx4', fr, x + tw / 2, y + th, 1, { scale: sc, alpha: alpha * a });
    };
    lay(13, 260, 50, 0.6, 0.35, 1.0);
    lay(12, 520, 110, 1.0, 0.55, 1.4);
    for (const s of this.spl) Spr.draw(c, 'fx4', 4 + Math.min(3, (s.t / 0.06) | 0), s.x, s.y, 1, { scale: 0.45, alpha: 0.7 * a });
    c.restore();
  }
};

// дерево из trees4: качается от ветра (скос от основания, порывы)
V4.drawTree = function (c, q, cx, t) {
  const x = q.x - cx; if (x < -200 || x > W + 200) return;
  const gust = 0.6 + 0.4 * Math.sin(t * 0.37 + q.ph * 0.2), k = (Math.sin(t * 1.9 + q.ph) * 0.035 + Math.sin(t * 3.7 + q.ph * 2) * 0.012) * gust - 0.02 * gust;
  c.save(); c.translate(x, q.y); c.transform(1, 0, k, 1, 0, 0); Spr.draw(c, 'trees4', q.fr, 0, 0, q.flip || 1, { scale: q.s }); c.restore();
};

// ---------- карта локации A: КПП → кирпичный забор → люк ----------
V4.buildA = function () {
  const D = { segs: [
    { k: 'kpp', s: 0.41, fy: 560 },
    { k: 'fence', s: 0.33, fy: 625, ov: 70 },
    { k: 'fence', s: 0.33, fy: 625, ov: 70, flip: true },
    { k: 'fence', s: 0.33, fy: 625, ov: 70 },
    { k: 'fence', s: 0.33, fy: 625, ov: 70, flip: true },
    { k: 'fence', s: 0.33, fy: 625, ov: 70 },
    { k: 'fence', s: 0.33, fy: 625, ov: 70, flip: true },
  ] };
  D.strip = V4.buildStrip(D.segs);
  D.w = D.strip.w;
  // на стыках кусков — берёза перед забором (прячет нахлёст)
  D.props = [];
  D.seam = D.strip.placed.slice(1).map((p, i) => ({ fr: i % 2 ? 1 : 0, x: p.x + p.ov / 2, y: V4.GY - 4, s: 0.8, ph: i * 1.7 }));
  // деревья за забором (основание прячется за кладкой), каждое качается со своей фазой
  D.trees = []; let tx = 20, i = 0;
  const seq = [0, 2, 4, 5, 1, 2, 3, 0, 5, 4, 2, 1, 4, 0];
  while (tx < D.w + 60) { const fr = seq[(i * 5 + 3) % seq.length]; D.trees.push({ fr, x: tx, y: 236, s: 0.72, ph: tx * 0.021, back: true }); tx += 44 + (tx * 7919 % 40); i++; }   // дальний ряд
  tx = 50; i = 0;
  while (tx < D.w + 60) { const fr = seq[i++ % seq.length]; D.trees.push({ fr, x: tx, y: 244, s: 0.95, ph: tx * 0.013 }); tx += 64 + (tx * 7919 % 50); }   // ближний ряд
  D.trees = D.trees.filter(q => q.x < 100 || q.x > 300);   // не загораживать аллею в проезде КПП
  // реквизит на тротуаре (на глубине Валеры)
  D.props.push({ sh: 'props4', fr: 1, x: 860, y: V4.GY + 2 }, { sh: 'props4', fr: 7, x: 1000, y: V4.GY + 2 }, { sh: 'props4', fr: 0, x: 1380, y: V4.GY + 8, cover: true, s: 1.6 }, { sh: 'props4', fr: 0, x: 1760, y: V4.GY + 8, cover: true, s: 1.6 }, { sh: 'props4', fr: 1, x: 2050, y: V4.GY + 2 });
  D.manX = D.w - 420;
  D.seam = D.seam.filter(q => Math.abs(q.x - D.manX) > 90);
  for (const q of D.seam) D.props.push({ sh: 'props4', fr: 0, x: q.x + 4, y: V4.GY + 6, s: 1.1 });   // куст у корней берёзы на стыке
  // дорога перед тротуаром: дорогие машины (ближе к камере — ниже по экрану)
  D.cars = [{ fr: 0, x: 420, y: H + 6 }, { fr: 2, x: 760, y: H + 8 }];
  // передний план — тёмные силуэты, параллакс 1.35
  D.fg = [{ fr: 0, x: 300, s: 1.4 }, { fr: 0, x: 1250, s: 1.3 }, { fr: 9, x: 2600, s: 0.9 }, { fr: 0, x: 3300, s: 1.4 }];
  D.manX = D.w - 420;
  D.props.push({ sh: 'props4', fr: 3, x: D.manX, y: V4.GY + 8, man: true, s: 1.4 });   // люк открыт
  D.cars.push({ fr: 0, x: D.manX + 250, y: H + 6 });
  return D;
};

