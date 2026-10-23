// Уровень 9, часть 5 «ЗАЛ СЛАВЫ» (L9_TZ.md, п.5; правки владельца 2026-10-22): врагов нет.
// Капсула-лифт спускается по стеклянной трубе; сразу рядом огромный экран — Господин Икс (только глаза и улыбка) говорит речь дословно по ТЗ.
// Дальше — зал (v3 по эскизу владельца): на стене три телевизора с Иксом, ниже ряд из 7 колб с уменьшенными боссами; пьедестал с туалетной бумагой.
// В конце зала — проём в полу с лестницей вниз: спуститься -> следующая часть.
// Движок платформера — L9.PARTS.lab (level9lab.js) с картой L9.MAPS.hall. Арт — Flow (l9hheap, l9hfloor2, l9hobj, l9hbig, l9htp, l9hfar2).
(() => {
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd;
  const W = 1900, GY = 330, CAP_X = 120, TP_X = 1120, FL_X = 330, FL_DX = 72, TV_X = [380, 556, 732], LAD_X = 1780, HEAP_H = 430, FLOOR_K = 46 / 154;
  // все враги Валеры по игре — на экранах груды, перечёркнуты
  // v3 (эскиз владельца 2026-10-24): на стене три телевизора — на них говорит Икс; ниже ряд из 7 колб с уменьшенными боссами
  const FLASKS = ['natasha', 'roach', 'toilet', 'vande', 'wiz', 'biker', 'leather'];
  const BOSSES = ['roach', 'vande', 'cmdr7', 'grab', 'kesha', 'leather', 'biker7', 'wiz', 'sanya', 'seller', 'cop', 'denisch', 'maxim', 'stas'];
  const has = (sh, fr) => { const d = L9D[sh]; return d && (!fr || (d.n || []).includes(fr)); };
  const SH = (c, sh, fr, x, y, h, o) => { if (!has(sh, fr)) return; const [, fh] = L9.size(sh, fr); S(c, sh, fr, x, y, h / fh, o); };

  L9.MAPS.hall = () => {
    const M = {
      x0: 0, x1: W, y0: -60, y1: 470, killY: 900,
      solids: [[0, GY, LAD_X - 16, 140, 'hide'], [LAD_X + 16, GY, W - LAD_X - 16, 140, 'hide'], [-40, -300, 40, 900, 'hide'], [W, -300, 40, 900, 'hide']],
      walks: [], ladders: [[LAD_X, GY, GY + 170]], cks: [[CAP_X + 60, GY]], picks: [],
    };
    M.killAt = () => M.killY;
    M.camY = gy => clamp(gy, GY, GY + 200) - 276;
    M.init = (P, lv, ck) => {
      G.portraits = G.portraits || {};
      for (const k of ['mrx']) if (!G.portraits[k]) { G.portraits[k] = 1; G.loadImage('assets/spr/p_' + k + '.png').then(im => G.portraits[k] = im, () => { delete G.portraits[k]; }); }
      M.big = { on: 0, t: 0 }; M.t = 0; M.intro = 1; M.cap = { y: -200, door: 0, st: 'down' }; P.hide = 1; P.x = CAP_X; M.left = 0;
    };
    // ---------- сцена: капсула спускается по трубе, двери, Валера выходит; экран включается, речь Икса ----------
    M.introScript = function* () {
      const P = L9.PARTS.lab, c = M.cap, D = 0.016; Scene.dialogTop = false;     // окно реплик снизу — сверху телевизоры с Иксом
      P.hide = 1; P.x = CAP_X; P.y = GY; P.dir = 1; M.camT = 0;
      Sound.play('crane'); while (c.y < GY) { c.y = Math.min(GY, c.y + 220 * D); yield D; } Sound.play('clank'); G.shake(3, 0.3);
      yield 0.4; Sound.play('door'); for (let t = 0; t < 0.6; t += D) { c.door = t / 0.6; yield D; } c.door = 1;
      P.hide = 0; P.st = 'run'; while (P.x < CAP_X + 80) { P.x += 120 * D; yield D; } P.st = 'stand';
      for (let t = 0; t < 0.6; t += D) { c.door = 1 - t / 0.6; yield D; } c.door = 0; c.st = 'up'; Sound.play('crane');
      yield 0.3; Sound.play('zap'); M.big.on = 0.01; yield 1.0;
      M.camT = 170; yield 0.8;
      yield* Scene.say('mrx', 'Мистер Валерий, я собрал зал славы в вашу честь, вы достойно несёте звание стропальщика.', null);
      yield* Scene.say('mrx', 'Здесь все, кого вы победили. Я бережно их законсервировал.', null);
      M.camT = TP_X - 320; yield 1.2; M.tpSpot = 1; Sound.play('confirm');
      yield* Scene.say('mrx', 'Я даже в вашу честь выпустил туалетную бумагу, мы в столице будем постоянно помнить о вас!', null);
      M.camT = null; yield 0.2;
    };
    M.cutUpdate = (dt, P) => { P.t += dt; M.t += dt; if (M.big.on) M.big.t += dt; const c = M.cap; if (c && c.st === 'up') { c.y -= 240 * dt; if (c.y < -260) M.cap = null; }
      if (M.camT != null) P.cam.x += (clamp(M.camT, 0, W - 640) - P.cam.x) * Math.min(1, dt * 2.5); else P.camera(dt); P.updFx(dt); };
    M.update = (dt, P, lv) => {
      M.t += dt; if (M.big.on) M.big.t += dt;
      const c = M.cap; if (c && c.st === 'up') { c.y -= 240 * dt; if (c.y < -260) M.cap = null; }
      if (M.intro) { M.intro = 0; Scene.run(M.introScript, () => lv.say('ЗАЛ СЛАВЫ', 2)); return; }
      if (Math.abs(P.x - LAD_X) < 30 && P.onG && !P.climb) P.hintAt('ВНИЗ — СПУСТИТЬСЯ ПО ЛЕСТНИЦЕ', 0.3);
      if (P.y > GY + 90 && !M.left) { M.left = 1; lv.next(); }
    };
    M.shootProps = () => {};
    M.blast = () => {};
    // ---------- отрисовка ----------
    const haze = (c, a) => { c.fillStyle = 'rgba(3,8,12,' + a + ')'; c.fillRect(0, 0, 640, 360); };
    M.drawBack = (c, cx, cy) => {
      c.fillStyle = '#03070a'; c.fillRect(0, 0, 640, 360);
      const im = L9.img.haWall; if (im) { const h = 340, k = h / im.height, w = im.width * k, y = Math.round(GY - 10 - cy - h); for (let x = -((cx % w) + w) % w; x < 640; x += w) c.drawImage(im, Math.floor(x), y, Math.ceil(w) + 1, h); }
    };
    // колба: сама колба, внутри — уменьшенный босс в жидкости, сверху ещё раз стекло полупрозрачно (блик и зелёный оттенок)
    const drawFlask = (c, x, i, t) => {
      if (!has('hFlask9', 'f')) return; const [, fh] = L9.size('hFlask9', 'f'), h = 100, k = h / fh, top = GY - 4 - h;
      S(c, 'hFlask9', 'f', x, GY - 4, k);
      const b = FLASKS[i]; if (has('hBos9', b)) { const bh = b === 'toilet' ? 46 : 38, bob = Math.sin(t * 1.3 + i * 1.7) * 1.5;
        SH(c, 'hBos9', b, x, top + h * 0.56 + bob, bh, { a: 0.9, flip: i % 2 === 1 }); }
      S(c, 'hFlask9', 'f', x, GY - 4, k, { a: 0.38 });
    };
    M.drawMid = (c, P) => {
      const x1 = P.cam.x + 860, t = M.t;
      // пол до самого низа (цельная картинка Flow); проём с лестницей
      const ft = L9.img.haFloor3 || L9.img.haFloorT; if (ft) { const h = ft.height * FLOOR_K, w = ft.width * FLOOR_K; for (let x = Math.floor((P.cam.x - 200) / w) * w; x < x1; x += w) c.drawImage(ft, Math.floor(x), GY - 14, Math.ceil(w) + 1, h); }
      SH(c, 'hoZ9', 'hole', LAD_X, GY + 28, 62);
      // три телевизора на стене: на них говорит Икс
      if (has('hTv9', 'on')) { const [tw, th] = L9.size('hTv9', 'on'), k = 150 / tw, q = k * 0.5, r = L9D.hTv9.scr, im = G.portraits.mrx;
        TV_X.forEach((x, j) => { const on = M.big.on && (M.big.t > 0.5 + j * 0.15 || (t * 14 | 0) % 2), y = GY - 186;
          S(c, 'hTv9', on ? 'on' : 'off', x, y, k);
          if (on && r && im && im !== 1) { const fw = tw * k, fh = th * k, sx = x - fw / 2 + r[0] * fw, sy = y - fh / 2 + r[1] * fh, sw = r[2] * fw, sh = r[3] * fh, s2 = Math.min(sw / im.width, sh / im.height) * 0.95;
            c.save(); c.beginPath(); c.rect(sx, sy, sw, sh); c.clip(); c.globalAlpha = 0.9 + Math.sin(t * 13 + j) * 0.08; c.drawImage(im, sx + (sw - im.width * s2) / 2, sy + (sh - im.height * s2) / 2, im.width * s2, im.height * s2); c.restore(); } }); }
      // ряд колб с уменьшенными боссами
      for (let i = 0; i < FLASKS.length; i++) drawFlask(c, FL_X + i * FL_DX, i, t);
      // пьедестал с туалетной бумагой Валеры
      { const [, ph] = L9.size('tpA9', 'pyr'), k = 130 / ph; S(c, 'tpA9', 'pyr', TP_X, GY + 2, k); if (M.tpSpot) S(c, 'fxL9', 'spark', TP_X, GY - 70, 2.2 + Math.sin(t * 4) * 0.2, { add: 1, a: 0.18 }); }
      // стеклянная труба лифта от потолка до пола и капсула в ней
      if (has('hoZ9', 'tube')) { const [tw, th] = L9.size('hoZ9', 'tube'), k = 64 / tw, hh = th * k; for (let y = GY + 6; y > -120; y -= hh - 2) S(c, 'hoZ9', 'tube', CAP_X, y, k); }
      const cp = M.cap; if (cp) { const [, ch] = L9.size('capL9', 'c0'), kc = 128 / ch, fr = cp.door > 0.5 ? 'c2' : 'c1';
        S(c, 'capL9', fr, CAP_X, cp.y, kc); if (L9.PARTS.lab.hide) S(c, 'vAim9', 'stand', CAP_X, cp.y - 12, 1); if (cp.door < 0.5 && L9.PARTS.lab.hide) S(c, 'capL9', 'c1', CAP_X, cp.y, kc, { a: 0.7 }); }
    };
    M.drawFront = () => {};
    M.drawOver = () => {};
    M.drawHud = () => {};
    return M;
  };

  const LP = () => L9.PARTS.lab;
  L9.PARTS.hall = {
    deathText: 'ВАЛЕРУ ЗАБЫЛИ В ЗАЛЕ СЛАВЫ',
    get hp() { return LP().hp; }, set hp(v) { LP().hp = v; },
    get inv() { return LP().inv; }, set inv(v) { LP().inv = v; },
    start(lv, ck) { LP().start(lv, ck, 'hall'); },
    onDie(lv) { LP().onDie(lv); },
    deadUpdate(lv, dt) { LP().deadUpdate(lv, dt); },
    update(lv, dt) { LP().update(lv, dt); },
    cutUpdate(lv, dt) { const P = LP(); P.M.cutUpdate && P.M.cutUpdate(dt, P); },
    draw(lv, c) { LP().draw(lv, c); },
    drawHud(lv, c) { LP().drawHud(lv, c); },
  };
  if (!L9.ORDER.includes('hall')) L9.ORDER.push('hall');
})();
