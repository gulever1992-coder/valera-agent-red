// Уровень 9, часть 5 «ЗАЛ СЛАВЫ» (L9_TZ.md, п.5): капсула-лифт из мастерской Сани спускается в зал, повсюду телевизоры со всеми боссами игры.
// По залу ходит охрана (киберзаводчане); телевизоры и пирамиду туалетной бумаги можно расстрелять.
// В середине зала включается огромный экран — Господин Икс (только глаза и улыбка) говорит речь дословно по ТЗ; затем открываются ворота дальше.
// Движок платформера — L9.PARTS.lab (level9lab.js) с картой L9.MAPS.hall. Арт — Flow (tools/p9/flow9s.js: l9hfar, l9hmid, l9htv, l9hbig, l9htp, l9hfloor -> build_l9.py).
(() => {
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd, F = () => L9.FOES;
  const W = 2300, GY = 330, BIG_X = 1240, TP_X = 1560, GATE_X = 2190, CAP_X = 150;
  // телевизоры: x, кадр стойки, портреты боссов на экранах (по кругу)
  const BOSSES = ['roach', 'vande', 'cmdr7', 'grab', 'kesha', 'leather', 'biker7', 'wiz', 'sanya', 'seller', 'cop', 'denisch', 'maxim', 'stas'];
  const TVS = [[400, 0], [560, 1], [760, 3], [930, 2], [1700, 1], [1860, 0], [2010, 3]];

  L9.MAPS.hall = () => {
    const LM = L9.MAPS.lab();
    const M = {
      x0: 0, x1: W, y0: -40, y1: 390, killY: 900,
      solids: [[0, GY, W, 120, 'hide'], [-40, -300, 40, 800, 'hide'], [W, -300, 40, 800, 'hide']],
      walks: [], ladders: [], cks: [[CAP_X, GY], [1100, GY]], picks: [], door: { x: GATE_X, y: GY, open: 0, t: 0 },
    };
    M.init = (P, lv, ck) => {
      G.portraits = G.portraits || {};
      for (const k of BOSSES) if (!G.portraits[k]) { G.portraits[k] = 1; G.loadImage('assets/spr/p_' + k + '.png').then(im => G.portraits[k] = im, () => { delete G.portraits[k]; }); }
      M.tvs = TVS.map(([x, f], i) => ({ x, f, hp: 3, i, ph: rnd(0, 6) }));
      M.tp = { x: TP_X, hp: 6 }; M.big = { on: 0, t: 0 };
      M.intro = ck === 0; M.speech = ck > 0; M.cap = ck === 0 ? { y: -160, door: 0, st: 'down' } : null;
      M.picks = [['kefir', 700, GY], ['grenades', 1450, GY], ['pelmeni', 1950, GY]].map(([kind, x, y]) => ({ kind, x, y, t: 0 }));
      const guards = ck === 0 ? [['Hat', 640], ['Arm', 860], ['Hat', 1020]] : [];
      for (const [tp, x] of guards) P.foes.push(new (F()[tp])(M, x, GY));
      if (ck > 0) { M.big.on = 1; M.wave = 0; M.waveT = 1; }
      if (ck === 0) P.hide = 1;
    };
    M.camY = gy => gy - 280;
    // ---------- сцены ----------
    M.introScript = function* () {     // капсула-лифт спускается сверху, двери открываются, Валера выходит
      const P = L9.PARTS.lab, c = M.cap, D = 0.016; P.hide = 1; P.x = CAP_X; P.y = GY; P.dir = 1;
      Sound.play('crane'); while (c.y < GY) { c.y = Math.min(GY, c.y + 220 * D); yield D; } Sound.play('clank'); G.shake(3, 0.3);
      yield 0.4; Sound.play('door'); for (let t = 0; t < 0.6; t += D) { c.door = t / 0.6; yield D; } c.door = 1;
      P.hide = 0; P.st = 'run'; while (P.x < CAP_X + 90) { P.x += 120 * D; yield D; } P.st = 'stand';
      for (let t = 0; t < 0.6; t += D) { c.door = 1 - t / 0.6; yield D; } c.door = 0; c.st = 'up'; Sound.play('crane');
      while (c.y > -170) { c.y -= 240 * D; yield D; } M.cap = null;
    };
    M.speechScript = function* () {     // огромный экран: Господин Икс (дословно по ТЗ), камера на экран, затем на пирамиду бумаги
      const P = L9.PARTS.lab, D = 0.016; P.vx = 0; P.st = 'stand';
      M.camT = BIG_X - 320; yield 0.7; Sound.play('zap'); M.big.on = 0.01; yield 1.0;
      yield* Scene.say('mrx', 'Мистер Валерий, я собрал зал славы в вашу честь, вы достойно несёте звание стропальщика.', null);
      M.camT = TP_X - 320; yield 0.8; M.tp.spot = 1; Sound.play('confirm');
      yield* Scene.say('mrx', 'Я даже в вашу честь выпустил туалетную бумагу, мы в столице будем постоянно помнить о вас!', null);
      M.camT = null; yield 0.2;
    };
    M.cutUpdate = (dt, P) => { P.t += dt; if (M.big.on) M.big.t += dt; if (M.camT != null) P.cam.x += (M.camT - P.cam.x) * Math.min(1, dt * 2.5); else P.camera(dt); P.updFx(dt); };
    M.update = (dt, P, lv) => {
      if (M.intro) { M.intro = 0; Scene.dialogTop = true; Scene.run(M.introScript, () => { lv.say('ЗАЛ СЛАВЫ', 2); }); return; }
      if (!M.speech && P.x > BIG_X - 200) { M.speech = 1; P.vx = 0; Scene.dialogTop = false; Scene.run(M.speechScript, () => { M.wave = 0; M.waveT = 1.2; lv.say('ОХРАНА ЗАЛА СЛАВЫ!', 2.5); }); return; }
      if (M.big.on) M.big.t += dt;
      // после речи — волны охраны с обоих концов зала; ворота открываются, когда охрана перебита
      if (M.wave != null && !M.door.open) {
        const alive = P.foes.filter(f => !f.dead).length;
        M.waveAge = (M.waveAge || 0) + dt; const clear = alive === 0 || M.waveAge > 25;     // застрявший/улетевший враг не блокирует зал
        if (clear) M.waveT -= dt;
        if (clear && M.waveT <= 0) { M.waveAge = 0;
          const W3 = [[['Hat', 1, 0], ['Arm', 1, 60], ['Hat', -1, 0]], [['Weld', 1, 0], ['Fly', 1, 40], ['Hat', -1, 0], ['Arm', -1, 60]], [['Super', 1, 0], ['Hat', 1, 70], ['Weld', -1, 0], ['Fly', -1, 40]]][M.wave];
          if (W3) { for (const [tp, side, dx] of W3) { const x = side > 0 ? Math.min(W - 160, P.x + 330 + dx) : Math.max(60, P.x - 330 - dx); const f = new (F()[tp])(M, x, GY); f.dir = side > 0 ? -1 : 1; P.foes.push(f); } M.wave++; M.waveT = 1.5; Sound.play('warn', 0.5); }
          else { M.door.open = 1; M.door.t = 0; Sound.play('door'); lv.say('ВОРОТА В КОНЦЕ ЗАЛА ОТКРЫТЫ', 2.5); }
        }
      }
      for (const k of M.picks) { k.t += dt; if (!k.dead && Math.abs(P.x - k.x) < 22 && Math.abs(P.y - k.y) < 40) LM.take(k, P, lv); }
      M.picks = M.picks.filter(k => !k.dead);
      const d = M.door; if (d.open) d.t += dt;
      if (!d.open && P.x > GATE_X - 120) P.hintAt('Ворота закрыты', 1.5);
      if ((!d.open || d.t <= 1.4) && P.x > GATE_X - 46) P.x = GATE_X - 46;
      if (d.open && d.t > 1.4 && P.x > GATE_X - 50 && !M.leaving) { M.leaving = 1; lv.next(); }
    };
    const hitTv = (tv, dmg, P) => {
      tv.hp -= dmg; Sound.play('glass', 0.5); if (tv.hp > 0) return;
      tv.hp = 0; Sound.play('boom', 0.6); P.lv.score += 200; G.shake(2, 0.2);
      for (let i = 0; i < 3; i++) P.fx.push({ sh: 'fxL9', fr: ['spark'], x: tv.x + rnd(-20, 20), y: GY - rnd(40, 110), s: rnd(0.5, 0.9), t: -i * 0.05, life: 0.25, add: 1 });
    };
    const tvH = f => [150, 160, 110, 175][f];
    M.shootProps = (b, P) => {
      for (const tv of M.tvs) if (tv.hp > 0 && Math.abs(b.x - tv.x) < 34 && b.y > GY - tvH(tv.f) && b.y < GY) { b.dead = true; hitTv(tv, b.dmg, P); return; }
      const tp = M.tp; if (tp.hp > 0 && Math.abs(b.x - tp.x) < 60 && b.y > GY - 120) { b.dead = true; tp.hp -= b.dmg; Sound.play('punch', 0.4); if (tp.hp <= 0) { Sound.play('boom', 0.6); P.lv.score += 300; P.lv.say('БУМАГА ПОРВАНА!', 1.5); } return; }
    };
    M.blast = (x, y, r, dmg, P) => { for (const tv of M.tvs) if (tv.hp > 0 && Math.abs(tv.x - x) < r + 30) hitTv(tv, dmg, P); if (M.tp.hp > 0 && Math.abs(M.tp.x - x) < r + 60) M.tp.hp = 0; };
    // ---------- отрисовка ----------
    const T = () => L9.PARTS.lab.t;
    const haze = (c, a) => { c.fillStyle = 'rgba(3,8,12,' + a + ')'; c.fillRect(0, 0, 640, 360); };
    M.drawBack = (c, cx, cy) => {
      c.fillStyle = '#03070a'; c.fillRect(0, 0, 640, 360);
      const fy = GY - cy;
      const fim = L9.img.haFar; if (fim) { const h = fim.height / 2, w = fim.width / 2, y = clamp(-10 - cy * 0.05, 360 - h, 0); for (let x = -((cx * 0.1 % w) + w) % w; x < 640; x += w) c.drawImage(fim, Math.floor(x), Math.round(y), Math.ceil(w) + 1, h); }
      haze(c, 0.12);
      const mim = L9.img.haMid; if (mim) { const h = 300, w = mim.width * h / mim.height, yb = fy + 6 + (fy - 300) * -0.3; for (let x = -((cx * 0.4 % w) + w) % w; x < 640; x += w) c.drawImage(mim, Math.floor(x), Math.round(yb - h), Math.ceil(w) + 1, h); }
      haze(c, 0.34);
    };
    M.drawMid = (c, P) => {
      const x0 = P.cam.x - 220, x1 = P.cam.x + 860, t = P.t;
      const ce = L9.img.haCeil; if (ce) { const h = 70, w = ce.width * h / ce.height; for (let x = Math.floor(x0 / w) * w; x < x1; x += w) c.drawImage(ce, Math.floor(x), -40, Math.ceil(w) + 1, h); }
      // огромный экран с Иксом
      { const on = M.big.on && (M.big.t > 0.5 || (t * 14 | 0) % 2), [, bh] = L9.size('bigA9', 'off'), k = 205 / bh; S(c, 'bigA9', on ? 'on' : 'off', BIG_X, GY + 2, k); if (on) S(c, 'bigA9', 'on', BIG_X, GY + 2, k, { add: 1, a: 0.12 + Math.sin(t * 9) * 0.05 }); }
      // пол
      const fl = L9.img.haFloor; if (fl) { const h = 46, w = fl.width * h / fl.height; for (let x = Math.floor(x0 / w) * w; x < x1; x += w) c.drawImage(fl, Math.floor(x), GY - 14, Math.ceil(w) + 1, h); }
      // телевизоры с боссами: портрет в каждом зелёном экране (прямоугольники экранов — из сборки), помехи, разбитые — кадр b*
      for (const tv of M.tvs) { if (tv.x < x0 || tv.x > x1) continue; const fr = (tv.hp > 0 ? 't' : 'b') + tv.f, [, th] = L9.size('tvA9', 't' + tv.f), k = tvH(tv.f) / th, ff = L9D.tvA9.f[tv.f];
        S(c, 'tvA9', fr, tv.x, GY + 2, k);
        if (tv.hp > 0) { const scr = (L9D.tvA9.scr || [])[tv.f] || [], q = k * 0.5, lx = tv.x - ff[4] * q, ty = GY + 2 - ff[5] * q;
          scr.forEach((r, j) => { const im = G.portraits[BOSSES[(tv.i * 3 + j + ((t / 6 + tv.ph) | 0)) % BOSSES.length]]; if (!im || im === 1) return;
            const sx = lx + r[0] * q, sy = ty + r[1] * q, sw = r[2] * q, sh = r[3] * q;
            c.save(); c.beginPath(); c.rect(sx, sy, sw, sh); c.clip(); c.fillStyle = '#000'; c.fillRect(sx, sy, sw, sh); const s2 = Math.max(sw / im.width, sh / im.height); c.globalAlpha = 0.85 + Math.sin(t * 20 + j) * 0.08; c.drawImage(im, sx + (sw - im.width * s2) / 2, sy + (sh - im.height * s2) / 2, im.width * s2, im.height * s2); c.globalAlpha = 1; c.restore(); }); } }
      // пирамида туалетной бумаги с лицом Валеры
      { const tp = M.tp, fr = tp.hp > 0 ? 'pyr' : 'pile', [, ph] = L9.size('tpA9', 'pyr'), k = 120 / ph; S(c, 'tpA9', fr, tp.x, GY + 2, k); if (tp.spot && tp.hp > 0) S(c, 'fxL9', 'spark', tp.x, GY - 70, 2.2 + Math.sin(t * 4) * 0.2, { add: 1, a: 0.18 }); }
      // капсула-лифт (прибытие)
      const cp = M.cap; if (cp) { const [, ch] = L9.size('capL9', 'c0'), kc = 128 / ch, fr = cp.door > 0.5 ? 'c2' : 'c1';
        S(c, 'capL9', fr, CAP_X, cp.y, kc); if (L9.PARTS.lab.hide) S(c, 'vAim9', 'stand', CAP_X, cp.y - 12, 1); if (cp.door < 0.5 && L9.PARTS.lab.hide) S(c, 'capL9', 'c1', CAP_X, cp.y, kc, { a: 0.7 }); }
      for (const k of M.picks) { const bob = Math.sin(k.t * 4) * 2;
        if (k.kind === 'pelmeni' || k.kind === 'kefir') { Art.item(c, k.kind, k.x, k.y - 14 + bob, 0, 1); continue; }
        S(c, 'fxL9', 'spark', k.x, k.y - 14, 0.4 + Math.sin(k.t * 5) * 0.08, { add: 1 }); S(c, 'pick9', k.kind, k.x, k.y - 16 + bob, 1); }
    };
    M.drawFront = (c, P) => { const d = M.door, f = d.open ? Math.min(5, d.t / 1.4 * 6 | 0) : 0; S(c, 'gate9', 'g' + f, d.x, d.y + 2, 0.62); };
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
