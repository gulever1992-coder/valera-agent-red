// Уровень 9, часть 4 «ПРОФЕССОР САНЯ» — ВЕРТИКАЛЬНАЯ версия (2026-10-20): башня-лаборатория из 6 этажей, путь змейкой вверх по лестницам.
// Откат на горизонтальную: L9.SANYA_VERT = false (или ?h=1) — тогда карта L9.MAPS.sanya из level9sanya.js.
// Сканер с Саньком едет по рельсу у потолка каждого этажа; между этажами рельс поднимается по стене (змейка).
// Фон — три слоя Flow 9:16 с параллаксом: дальний зал (sxFarA снизу -> sxFarB сверху), средний ряд машин (sxMid, повтор по вертикали), ближние трубы (sxNear, быстрее мира).
(() => {
  L9.SANYA_VERT = true;
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd, LAB = L9.LAB, F = () => L9.FOES;
  const W = 960, GAP = 280, NF = 6;
  const FL = [...Array(NF + 1)].map((_, k) => 1800 - GAP * k);     // верх плиты этажа k (k=6 — потолок верхнего этажа)
  const LX = k => k % 2 ? 90 : 870;                                  // лестница с этажа k на k+1
  const RX = k => k % 2 ? 30 : 930;                                  // вертикальный участок рельса (у стены, рядом с лестницей)
  const RY = k => FL[k + 1] + 39;                                    // ось рельса под потолком этажа k
  const SCAN_H = 134;
  // этажи: принтер, аккумулятор (на задней стене), враги, подборы
  const FLOORS = [
    { prn: 770, bat: [540, -150], foes: [], picks: [] },
    { prn: 480, bat: [300, -150], foes: [['RDog', 200], ['RSpd', 640, { ceil: 1 }]], picks: [['kefir', 700]] },
    { prn: 520, bat: [700, -150], foes: [['RSpd', 300, { ceil: 1 }], ['RSpd', 430]], picks: [['grenades', 420]] },
    { prn: 430, bat: [240, -150], foes: [['RDog', 620], ['RDog', 150]], picks: [['pelmeni', 760], ['rocket', 330]] },
    { prn: 600, bat: [320, -150], foes: [['RSpd', 160], ['RDog', 760]], picks: [['kefir', 450]] },
    { prn: 600, bat: [350, -150], foes: [['RDog', 200], ['RSpd', 470, { ceil: 1 }], ['RSpd', 800]], picks: [['pelmeni', 780]] },
  ];
  const DOOR_X = 70;
  let SAVE = [];

  L9.MAPS.sanyaV = () => {
    const LM = L9.MAPS.lab();
    const M = {
      x0: 0, x1: W, y0: 0, y1: 1860, killY: 2200, vert: 1,
      solids: [[0, FL[0], W, 80], [-40, -100, 40, 2100, 'hide'], [W, -100, 40, 2100, 'hide']],
      walks: [], ladders: [],
      cks: [[100, FL[0]], [220, FL[0]]],
      picks: [], door: { x: DOOR_X, y: FL[NF - 1], open: 0, t: 0 },
    };
    for (let k = 1; k <= NF; k++) M.solids.push([0, FL[k], W, 30]);     // плиты этажей (и потолок верхнего)
    for (let k = 0; k < NF - 1; k++) M.ladders.push([LX(k), FL[k + 1], FL[k]]);
    for (let k = 1; k < NF; k++) M.cks.push([LX(k - 1) - (k % 2 ? 10 : 0), FL[k]]);
    // рельс-змейка: горизонталь под потолком этажа k, затем вверх по стене у лестницы
    const pts = [[RX(1), RY(0)]]; for (let k = 0; k < NF; k++) { pts.push([RX(k), RY(k)]); if (k < NF - 1) pts.push([RX(k), RY(k + 1)]); }
    const segL = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), cum = [0]; segL.forEach(l => cum.push(cum[cum.length - 1] + l));
    const at = u => { u = clamp(u, 0, cum[cum.length - 1]); let i = 0; while (i < segL.length - 1 && u > cum[i + 1]) i++; const f = segL[i] ? (u - cum[i]) / segL[i] : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]; };
    const uOn = (k, x) => { const a = pts[2 * k], b = pts[2 * k + 1], f = clamp((x - a[0]) / (b[0] - a[0]), 0, 1); return cum[2 * k] + f * segL[2 * k]; };     // точка рельса этажа k над x
    const floorOf = y => { let k = 0; for (let i = 0; i < NF; i++) if (FL[i] >= y - 2) k = i; return k; };
    M.floorOf = floorOf;
    M.init = (P, lv, ck) => {
      if (!ck) SAVE = [];
      const k0 = floorOf(M.cks[ck][1]);
      M.fight = ck > 0; M.cut = ck > 0; M.fin = null; M.leaving = 0;
      M.picks = []; FLOORS.forEach((f, k) => { if (k >= k0) for (const [kind, x] of f.picks) M.picks.push({ kind, x, y: FL[k], t: 0 }); });
      M.bats = FLOORS.map((f, i) => ({ x: f.bat[0], y: FL[i] + f.bat[1], hp: SAVE.includes(i) ? 0 : 8, i, k: i }));
      M.prn = FLOORS.map((f, i) => ({ x: f.prn, y: FL[i], st: SAVE.includes(i) ? 'wreck' : 'idle', t: rnd(0, 2), cd: rnd(0.5, 2.5), k: i }));
      M.robots = ck > 0 ? [] : [{ fr: 'bench', dead: 'benchDead', x: 330, hp: 6 }, { fr: 'dogSit', dead: 'dogDead', x: 520, hp: 99, wake: 1 }];
      if (ck > 0) M.robots = [{ fr: 'bench', dead: 'benchDead', x: 330, hp: 6 }];
      M.san = { x: 400, fr: 'fix0', dir: 1, gone: ck > 0 };
      const u0 = ck > 0 ? uOn(k0, M.cks[ck][0] - 120) : uOn(0, 640);
      M.scan = { u: u0, x: at(u0)[0], bot: ck > 0 ? at(u0)[1] + SCAN_H : FL[0], fr: ck > 0 ? 'glass' : 'open', cd: 2, vy: 0, dead: 0, docked: ck > 0 };
      if (ck > 0) M.scan.bot = at(u0)[1] + SCAN_H;
      FLOORS.forEach((f, k) => { if (k > k0 || (k === k0 && ck > 0)) for (const [tp, x, o] of f.foes) P.foes.push(new (F()[tp])(M, x, FL[k], o && o.ceil ? { ceil: FL[k + 1] + 30 } : {})); });
      if (ck > 0 && k0 === 0) P.foes.push(new (F().RDog)(M, 600, FL[0]));
      if (ck > 0) { lv.say('СТРЕЛЯЙ ПО АККУМУЛЯТОРАМ! НАВЕРХ — ПО ЛЕСТНИЦАМ', 3); }
      M.k0 = k0;
    };
    M.camY = gy => gy - 290;
    M.left = () => M.bats.filter(b => b.hp > 0).length;
    M.update = (dt, P, lv) => {
      if (!M.cut && P.x > 160) { M.cut = 1; P.vx = 0; Scene.dialogTop = true; Scene.run(M.script, () => { M.fight = true; P.st = 'stand'; M.scan.docked = 1; lv.say('СТРЕЛЯЙ ПО АККУМУЛЯТОРАМ! НАВЕРХ — ПО ЛЕСТНИЦАМ', 3); }); return; }
      for (const k of M.picks) { k.t += dt; if (!k.dead && Math.abs(P.x - k.x) < 22 && Math.abs(P.y - k.y) < 40) LM.take(k, P, lv); }
      M.picks = M.picks.filter(k => !k.dead);
      if (!M.fight) return;
      const kp = floorOf(P.y), alive = P.foes.filter(f => !f.dead).length;
      if (M.wasClimb && !P.climb) P.inv = Math.max(P.inv, 0.6); M.wasClimb = !!P.climb;     // вылез с лестницы — полсекунды на осмотреться
      for (const p of M.prn) {
        p.t += dt; if (p.st === 'wreck') continue;
        if (p.st === 'idle') { p.cd -= dt; if (p.cd <= 0 && p.k === kp && Math.abs(P.x - p.x) < 560 && Math.abs(P.x - p.x) > 110 && alive < 6 && !M.fin) { p.st = 'print'; p.t = 0; Sound.play('zap', 0.5); } }
        else if (p.st === 'print' && M.fin) p.st = 'idle';
        else if (p.st === 'print' && p.t > 2.0) { p.st = 'out'; p.t = 0; const f = new (F().Clone)(M, p.x + 8, p.y); f.dir = P.x < p.x ? -1 : 1; P.foes.push(f); Sound.play('door', 0.5); }
        else if (p.st === 'out' && p.t > 0.7) { p.st = 'idle'; p.cd = rnd(1.8, 3.2); }
      }
      // сканер: по рельсу к точке над Валерой (чуть позади), стреляет плазмой
      const s = M.scan;
      if (!s.dead) {
        const dir = kp % 2 ? -1 : 1, tu = uOn(kp, P.x - dir * 90), sp = M.fin ? 300 : 120;
        s.u += clamp(tu - s.u, -sp * dt, sp * dt); const [x, y] = at(s.u); s.x = x; s.bot = y + SCAN_H;
        if (!M.fin) { s.cd -= dt; s.fr = s.cd < 0.5 ? 'press' : 'glass';
          if (s.cd <= 0 && !P.climb && Math.abs(P.x - s.x) < 300 && Math.abs(P.y - s.bot) < 220) { s.cd = rnd(1.6, 2.4); const a = Math.atan2(P.y - 40 - (s.bot - 20), P.x - s.x); P.ebul.push({ x: s.x, y: s.bot - 14, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, t: 0, dmg: 10, fr: 'plasma', s: 0.5 }); Sound.play('zap'); } }
      } else if (s.vy != null && s.bot < s.floorY) { s.vy += 900 * dt; s.bot = Math.min(s.floorY, s.bot + s.vy * dt); if (s.bot >= s.floorY) { Sound.play('crash'); G.shake(5, 0.3); } }
      if (!M.fin && M.left() === 0) { M.fin = { t: 0 }; s.fr = 'spark'; lv.say('ПИТАНИЕ ОТКЛЮЧЕНО!', 2); Sound.play('warn'); }
      if (M.fin) {
        const f = M.fin; f.t += dt;
        if (!s.dead && (P.t * 20 | 0) % 2) P.fx.push({ sh: 'fxA9', fr: ['spark'], x: s.x + rnd(-30, 30), y: s.bot - 128 + rnd(-6, 6), s: rnd(0.5, 0.9), t: 0, life: 0.15, add: 1 });
        if (f.t > 0.4 && !f.l1) { f.l1 = 1; lv.say('САНЯ: «Нет-нет-нет! Вагонетка! Выпустите меня!»', 2.6); }
        if (f.t > 2.2 && s.fr === 'spark') { s.fr = 'fire'; Sound.play('glass'); }
        if (f.t > 3.4 && !s.dead) {
          s.dead = 1; s.fr = 'wreck'; s.vy = 0; s.floorY = FL[floorOf(s.bot + 20)]; G.shake(8, 0.6); G.flash(0.2, '#fff');
          for (let i = 0; i < 5; i++) P.fx.push({ sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2', 'boom3'], x: s.x + rnd(-40, 40), y: s.bot - rnd(20, 120), s: rnd(1.2, 1.8), t: -i * 0.08, life: 0.6 });
          Sound.play('boom'); lv.score += 3000;
          for (const c of P.foes) if (!c.dead && c instanceof F().Clone) c.hit(99, Math.sign(c.x - s.x) || 1, 'blast');
        }
        if (f.t > 5 && !M.door.open) { M.door.open = 1; M.door.t = 0; Sound.play('door'); lv.say('ДВЕРЬ НАВЕРХУ ОТКРЫТА!', 2.5); }
      }
      const d = M.door, onTop = Math.abs(P.y - d.y) < 10;
      if (d.open) d.t += dt;
      if (onTop && !d.open && P.x < d.x + 120) P.hintAt('Дверь заперта — разбей аккумуляторы (' + (FLOORS.length - M.left()) + '/' + FLOORS.length + ')', 2);
      if (onTop && (!d.open || d.t <= 1.4) && P.x < d.x + 46) P.x = d.x + 46;
      if (onTop && d.open && d.t > 1.4 && P.x < d.x + 50 && !M.leaving) { M.leaving = 1; lv.next(); }
    };
    M.batHit = (b, dmg, P) => {
      b.hp -= dmg; Sound.play('clank', 0.6);
      if (b.hp > 0) return;
      b.hp = 0; SAVE.push(b.i); Sound.play('boom'); G.shake(5, 0.35); P.lv.score += 500;
      P.fx.push({ sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2', 'boom3'], x: b.x, y: b.y, s: 0.9, t: 0, life: 0.55 });
      const p = M.prn[b.i]; if (p && p.st !== 'wreck') {
        p.st = 'wreck'; p.t = 0;
        for (let i = 0; i < 4; i++) P.fx.push({ sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2', 'boom3'], x: p.x + rnd(-50, 50), y: p.y - rnd(30, 160), s: rnd(1, 1.6), t: -0.25 - i * 0.12, life: 0.6 });
        for (const c of P.foes) if (!c.dead && Math.abs(c.x - p.x) < 70 && Math.abs(c.y - p.y) < 40) c.hit(99, Math.sign(c.x - p.x) || 1, 'blast');
      }
      const n = M.left(); P.lv.say(n ? 'АККУМУЛЯТОР РАЗБИТ! ОСТАЛОСЬ ' + n : 'ВСЕ АККУМУЛЯТОРЫ РАЗБИТЫ!', 1.8);
    };
    M.shootProps = (b, P) => {
      for (const bt of M.bats) if (bt.hp > 0 && Math.abs(b.x - bt.x) < 26 && Math.abs(b.y - bt.y) < 26) { b.dead = true; if (b.w === 'rocket' || b.w === 'gren') P.blast(b.x, b.y, b.blast || 46, b.dmg); else M.batHit(bt, b.dmg, P); return; }
      const s = M.scan; if (M.fight && !s.dead && Math.abs(b.x - s.x) < 34 && b.y > s.bot - 130 && b.y < s.bot) {
        b.dead = true; Sound.play('deflect'); P.fx.push({ sh: 'fxL9', fr: ['spark'], x: b.x, y: b.y, s: 0.45, t: 0, life: 0.1, add: 1 });
        if (!M.glassHint) { M.glassHint = 1; P.hintAt('Бронестекло! Бей по аккумуляторам на стенах!', 3); } return; }
      if (M.fight) for (const r of M.robots) if (r.hp > 0 && r.hp < 50 && Math.abs(b.x - r.x) < 50 && b.y > FL[0] - 60 && b.y < FL[0]) { b.dead = true; r.hp -= b.dmg; Sound.play('clank', 0.5); if (r.hp <= 0) { Sound.play('crash'); P.lv.score += 100; P.fx.push({ sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2', 'boom3'], x: r.x, y: FL[0] - 30, s: 0.8, t: 0, life: 0.5 }); } return; }
    };
    M.blast = (x, y, r, dmg, P) => { for (const bt of M.bats) if (bt.hp > 0 && Math.hypot(bt.x - x, bt.y - y) < r + 26) M.batHit(bt, dmg, P); };
    // ---------- катсцена (диалог дословно по ТЗ) ----------
    M.script = function* () {
      const P = L9.PARTS.lab, s = M.san, sc = M.scan, D = 0.016;
      P.dir = 1; P.st = 'run';
      while (P.x < 220) { P.x += 140 * D; yield D; }
      P.st = 'stand'; P.vx = 0;
      for (let i = 0; i < 3; i++) { s.fr = 'fix1'; Sound.play('clank', 0.5); yield 0.35; s.fr = 'fix0'; yield 0.3; }
      s.dir = -1; s.fr = 'talk'; yield 0.4;
      yield* Scene.say('valera', 'Саня, ты тоже, что ли, с ними?', null);
      s.fr = 'finger';
      yield* Scene.say('sanya', 'Нет, Валера, я всегда был с ними, ты не должен был об этом узнать! Ты должен был тоже попасть ко мне на хирургический стол!', null);
      s.fr = 'talk';
      yield* Scene.say('sanya', 'Мистер Икс верит в меня, это я разработал проект реновации завода! Это я создал по запросу Мистера Икса киберзаводчан — им не нужна еда, им нужен только стиральный порошок, и внутри них течёт чистый концентрат 99% спирта!', null);
      s.fr = 'shout';
      yield* Scene.say('valera', 'Не может быть, что ты наделал! Я думал, ты единственный из столицы нормальный! Ты приглашал меня в гости!', null);
      s.fr = 'finger';
      yield* Scene.say('sanya2', 'Всё кончено, мистер Валерий.', null);
      M.camT = 240; s.dir = 1; let k = 0;
      while (s.x < sc.x - 6) { s.x += 75 * D; s.fr = 'w' + ((k++ / 14 | 0) % 2); yield D; }
      s.gone = 1; Sound.play('door'); sc.fr = 'press'; yield 0.7;
      Sound.play('confirm'); G.flash(0.1, '#7f7'); yield 0.3;
      sc.fr = 'glass'; Sound.play('zap'); G.shake(3, 0.4); yield 0.8;
      Sound.play('crane');
      const p0 = M.prn[0]; if (p0.st !== 'wreck') { p0.st = 'print'; p0.t = 0.8; }
      const top = at(sc.u)[1] + SCAN_H; while (sc.bot > top) { sc.bot = Math.max(top, sc.bot - 120 * D); yield D; }
      // робот-собака у верстака оживает
      const dg = M.robots.find(r => r.wake); if (dg) { M.robots = M.robots.filter(r => r !== dg); const f = new (F().RDog)(M, dg.x, FL[0], { wake: 1 }); f.dir = -1; P.foes.push(f); Sound.play('zap'); }
      Sound.play('clank'); yield 0.6; M.camT = null;
    };
    M.cutUpdate = (dt, P) => { P.t += dt; for (const p of M.prn) p.t += dt; if (M.camT != null) P.cam.x += (M.camT - P.cam.x) * Math.min(1, dt * 2.5); else P.camera(dt); P.updFx(dt); };
    // ---------- отрисовка: параллакс ----------
    const ymax = M.y1 - 360;
    // полоса слоя (левая или правая треть картинки Flow), повторяется по вертикали; стоит в мире у стены X и сдвигается с параллаксом k
    const band = (c, n, side, X, wS, k, cx, cy, frac = 0.36) => {
      const im = L9.img[n]; if (!im) return; const sw = im.width * frac, sx0 = side < 0 ? 0 : im.width - sw, h = im.height * wS / sw;
      const mx = 320 + (X - (cx + 320)) * k, x = side < 0 ? mx - wS : mx; if (x > 640 || x + wS < 0) return;
      const y0 = -(((cy - M.y0) * k % h) + h) % h;
      for (let y = y0; y < 360; y += h) c.drawImage(im, sx0, 0, sw, im.height, Math.round(x), Math.floor(y), Math.round(wS), Math.ceil(h) + 1);
    };
    M.drawBack = (c, cx, cy) => {
      c.fillStyle = '#03070a'; c.fillRect(0, 0, 640, 360);
      // дальний зал: низ башни (A) -> верх (B), плавная смена по высоте камеры; весь кадр проходит за подъём (~0.5 скорости мира)
      const far = (n, a) => { const im = L9.img[n]; if (!im || a <= 0) return; const w = 680, h = im.height * w / im.width, x = -(cx / (W - 640)) * (w - 640), y = -(cy / ymax) * (h - 360);
        c.globalAlpha = a; c.drawImage(im, Math.round(x), Math.round(y), w, h); c.globalAlpha = 1; };
      const mix = clamp((ymax - cy) / ymax * 1.6 - 0.3, 0, 1);
      far('sxFarA', 1); far('sxFarB', mix);
      c.fillStyle = 'rgba(2,6,10,0.12)'; c.fillRect(0, 0, 640, 360);
      // средний план: башни машин у стен (параллакс 0.7)
      band(c, 'sxMid', -1, 150, 200, 0.7, cx, cy); band(c, 'sxMid', 1, W - 150, 200, 0.7, cx, cy);
      c.fillStyle = 'rgba(2,6,10,0.12)'; c.fillRect(0, 0, 640, 360);
    };
    M.drawOver = (c, cx, cy) => { band(c, 'sxNear', -1, 0, 110, 1.3, cx, cy, 0.3); band(c, 'sxNear', 1, W, 110, 1.3, cx, cy, 0.3); };     // ближние трубы у стен — быстрее мира (глубина)
    M.drawMid = (c, P) => {
      const x0 = P.cam.x - 200, x1 = P.cam.x + 840, y0 = P.cam.y - 200, y1 = P.cam.y + 560, vis = (x, y) => x > x0 && x < x1 && y > y0 && y < y1;
      // рельс-змейка (горизонталь — тайлы, вертикаль — те же тайлы, повёрнутые)
      const [rw] = L9.size('srail9', 'rail');
      for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], L = segL[i], n = Math.max(1, Math.round(L / (rw - 1))), vert = a[0] === b[0];
        for (let j = 0; j < n; j++) { const f = (j + 0.5) / n, x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f; if (vis(x, y)) S(c, 'srail9', 'rail', x, y, 1, { rot: vert ? Math.PI / 2 : 0 }); } }
      // лестницы между этажами
      for (const l of M.ladders) if (l[0] > x0 && l[0] < x1 && l[2] > y0 && l[1] < y1) { const [lw, lh] = L9.size('plat9', 'ladder');
        for (let y = l[2]; y > l[1] + lh * 0.5; y -= lh - 2) S(c, 'plat9', 'ladder', l[0], y + 4, 1); S(c, 'plat9', 'ladderTop', l[0], l[1] + 4, 1); }
      for (const b of M.bats) if (vis(b.x, b.y)) { const fr = b.hp <= 0 ? 'dead' : b.hp <= 4 ? 'hit' : 'on'; S(c, 'bat9', fr, b.x, b.y, 1); if (b.hp > 0) S(c, 'fxL9', 'spark', b.x, b.y, 0.5 + Math.sin(P.t * 6 + b.i) * 0.1, { add: 1, a: 0.35 }); }
      for (const p of M.prn) if (vis(p.x, p.y)) {
        S(c, 'prn9', p.st === 'wreck' ? 'wreck' : p.st === 'print' ? 'print' : p.st === 'out' ? 'out' : 'idle', p.x, p.y + 3, 1);
        if (p.st === 'print') S(c, 'fxL9', 'spark', p.x + rnd(-20, 20), p.y - 130 + (p.t * 40 % 90), 0.5, { add: 1 });
        if (p.st === 'wreck' && (P.t * 8 | 0) % 3 === 0) S(c, 'fxA9', (P.t * 10 | 0) % 2 ? 'fire0' : 'fire1', p.x + 10, p.y - 30, 0.8, { add: 1, a: 0.6 });
      }
      for (const r of M.robots) if (vis(r.x, FL[0])) { S(c, 'props8', 'shadow', r.x, FL[0] + 1, 1.6, { a: 0.4 }); S(c, 'robo9', r.hp > 0 ? r.fr : r.dead, r.x, FL[0] + 2, 1); }
      const s = M.san; if (!s.gone) { S(c, 'props8', 'shadow', s.x, FL[0] + 1, 0.4, { a: 0.5 }); S(c, 'san9', s.fr, s.x, FL[0] + 1, 1, { flip: s.dir < 0 }); }
      const sc = M.scan; if (vis(sc.x, sc.bot)) S(c, 'scan9', sc.fr, sc.x, sc.bot, 1);
      for (const k of M.picks) { if (!vis(k.x, k.y)) continue; const bob = Math.sin(k.t * 4) * 2;
        if (k.kind === 'pelmeni' || k.kind === 'kefir') { Art.item(c, k.kind, k.x, k.y - 14 + bob, 0, 1); continue; }
        S(c, 'fxL9', 'spark', k.x, k.y - 14, 0.4 + Math.sin(k.t * 5) * 0.08, { add: 1 }); S(c, 'pick9', k.kind, k.x, k.y - 16 + bob, 1); }
    };
    M.drawFront = (c, P) => { const d = M.door, f = d.open ? Math.min(5, d.t / 1.4 * 6 | 0) : 0; S(c, 'gate9', 'g' + f, d.x, d.y + 2, 0.62); };
    M.drawHud = (c, P) => { if (M.fight && !M.fin) G.text('АККУМУЛЯТОРЫ: ' + (FLOORS.length - M.left()) + ' / ' + FLOORS.length + '   ЭТАЖ ' + (floorOf(P.y) + 1) + ' / ' + NF, 320, 30, { align: 'center', size: 8, color: '#7fe0c0', outline: true }); };
    return M;
  };
})();
