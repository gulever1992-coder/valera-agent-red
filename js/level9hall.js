// Уровень 9, часть 5 «ЗАЛ СЛАВЫ» (L9_TZ.md, п.5; правки владельца 2026-10-22): врагов нет.
// Капсула-лифт спускается по стеклянной трубе; сразу рядом огромный экран — Господин Икс (только глаза и улыбка) говорит речь дословно по ТЗ.
// Дальше — зал: груда телевизоров до потолка, на экранах все враги Валеры, перечёркнутые красным крестом; пьедестал с туалетной бумагой.
// В конце зала — проём в полу с лестницей вниз: спуститься -> следующая часть.
// Движок платформера — L9.PARTS.lab (level9lab.js) с картой L9.MAPS.hall. Арт — Flow (l9hheap, l9hfloor2, l9hobj, l9hbig, l9htp, l9hfar2).
(() => {
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd;
  const W = 1900, GY = 330, CAP_X = 120, BIG_X = 380, TP_X = 1180, LAD_X = 1780, HEAP_H = 430, FLOOR_K = 46 / 154;
  // все враги Валеры по игре — на экранах груды, перечёркнуты
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
      for (const k of BOSSES) if (!G.portraits[k]) { G.portraits[k] = 1; G.loadImage('assets/spr/p_' + k + '.png').then(im => G.portraits[k] = im, () => { delete G.portraits[k]; }); }
      M.big = { on: 0, t: 0 }; M.t = 0; M.intro = 1; M.cap = { y: -200, door: 0, st: 'down' }; P.hide = 1; P.x = CAP_X; M.left = 0;
    };
    // ---------- сцена: капсула спускается по трубе, двери, Валера выходит; экран включается, речь Икса ----------
    M.introScript = function* () {
      const P = L9.PARTS.lab, c = M.cap, D = 0.016; Scene.dialogTop = true; P.hide = 1; P.x = CAP_X; P.y = GY; P.dir = 1; M.camT = 0;
      Sound.play('crane'); while (c.y < GY) { c.y = Math.min(GY, c.y + 220 * D); yield D; } Sound.play('clank'); G.shake(3, 0.3);
      yield 0.4; Sound.play('door'); for (let t = 0; t < 0.6; t += D) { c.door = t / 0.6; yield D; } c.door = 1;
      P.hide = 0; P.st = 'run'; while (P.x < CAP_X + 80) { P.x += 120 * D; yield D; } P.st = 'stand';
      for (let t = 0; t < 0.6; t += D) { c.door = 1 - t / 0.6; yield D; } c.door = 0; c.st = 'up'; Sound.play('crane');
      yield 0.3; Sound.play('zap'); M.big.on = 0.01; yield 1.0;
      yield* Scene.say('mrx', 'Мистер Валерий, я собрал зал славы в вашу честь, вы достойно несёте звание стропальщика.', null);
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
      const fim = L9.img.haFar; if (fim) { const h = fim.height / 2, w = fim.width / 2, y = clamp(-10 - cy * 0.05, 360 - h, 0); for (let x = -((cx * 0.1 % w) + w) % w; x < 640; x += w) c.drawImage(fim, Math.floor(x), Math.round(y), Math.ceil(w) + 1, h); }
      haze(c, 0.2);
    };
    // груда телевизоров до потолка: на каждом экране — враг Валеры, перечёркнутый красным крестом
    const drawHeap = (c, P) => {
      const im = L9.img.haHeap, d = L9D._bg.haHeap; if (!im || !d) return;
      const t = M.t, h = HEAP_H, k = h / im.height, w = im.width * k, top = GY - 8 - h, x0 = P.cam.x - 40, x1 = P.cam.x + 680;
      for (let X = Math.floor(x0 / w) * w, n = Math.floor(x0 / w); X < x1; X += w, n++) {
        c.drawImage(im, Math.floor(X), Math.round(top), Math.ceil(w) + 1, h);
        d.scr.forEach((r, j) => { const sx = X + r[0] * k, sy = top + r[1] * k, sw = r[2] * k, sh = r[3] * k; if (sx > x1 || sx + sw < x0) return;
          const im2 = G.portraits[BOSSES[((j * 7 + n * 5) % BOSSES.length + BOSSES.length) % BOSSES.length]]; if (!im2 || im2 === 1) return;
          c.save(); c.beginPath(); c.rect(sx, sy, sw, sh); c.clip(); c.fillStyle = '#000'; c.fillRect(sx, sy, sw, sh);
          const s2 = Math.max(sw / im2.width, sh / im2.height); c.globalAlpha = 0.82 + Math.sin(t * 17 + j) * 0.07; c.drawImage(im2, sx + (sw - im2.width * s2) / 2, sy + (sh - im2.height * s2) / 2, im2.width * s2, im2.height * s2); c.restore();
          SH(c, 'hoZ9', 'cross', sx + sw / 2, sy + sh * 0.92, sh * 0.86); });
      }
    };
    M.drawMid = (c, P) => {
      const x1 = P.cam.x + 860, t = M.t;
      drawHeap(c, P);
      // пол до самого низа (цельная картинка Flow); проём с лестницей
      const ft = L9.img.haFloorT; if (ft) { const h = ft.height * FLOOR_K, w = ft.width * FLOOR_K; for (let x = Math.floor((P.cam.x - 200) / w) * w; x < x1; x += w) c.drawImage(ft, Math.floor(x), GY - 14, Math.ceil(w) + 1, h); }
      SH(c, 'hoZ9', 'hole', LAD_X, GY + 28, 62);
      // огромный экран с Иксом — у трубы лифта, в самом начале
      { const on = M.big.on && (M.big.t > 0.5 || (t * 14 | 0) % 2), [, bh] = L9.size('bigA9', 'off'), k = 210 / bh, q = k * 0.5, ff = L9D.bigA9.f[0], r = L9D.bigA9.scr;
        S(c, 'bigA9', 'off', BIG_X, GY + 2, k);
        const im = G.portraits.mrx; if (on && r && im && im !== 1) { const sx = BIG_X - ff[4] * q + r[0] * q, sy = GY + 2 - ff[5] * q + r[1] * q, sw = r[2] * q, sh = r[3] * q, s2 = Math.min(sw / im.width, sh / im.height) * 0.95;
          c.save(); c.beginPath(); c.rect(sx, sy, sw, sh); c.clip(); c.fillStyle = '#000'; c.fillRect(sx, sy, sw, sh); c.globalAlpha = 0.9 + Math.sin(t * 13) * 0.08; c.drawImage(im, sx + (sw - im.width * s2) / 2, sy + (sh - im.height * s2) / 2, im.width * s2, im.height * s2); c.restore(); } }
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
