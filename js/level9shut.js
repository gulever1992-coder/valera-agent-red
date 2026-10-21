// Уровень 9, часть 6 «ЗАКРЫТАЯ ЧАСТЬ ЗАВОДА» (L9_TZ.md, п.6): врагов нет — раскалённая зелёная жижа, зелёный огонь, дым, всё работает.
// Путь: сопла зелёного огня -> паровые вентили -> река жижи (подвесные поддоны на цепях, капает жижа) -> прессы -> мостик над огромным чаном.
// На середине мостика Икс выходит из темноты: Кеша -> маска -> Граблионок -> маска -> Семён; речь с флешбеками (дословно по ТЗ) -> часть 7.
// Движок платформера — L9.PARTS.lab (level9lab.js) с картой L9.MAPS.shut. Арт — Flow (tools/p9/flow9s.js: l9z* -> build_l9.py).
(() => {
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd;
  const W = 3400, GY = 330, PIT0 = 1150, PIT1 = 1750, BR0 = 2560, MEET = 3010, STOP = 2880;
  WHO.semen = WHO.semen || { name: 'СЕМЁН', color: '#e05050', voice: 120 };
  WHO.semen2 = WHO.semen2 || WHO.semen;
  // ловушки: [x, фаза]
  const VENTS = [[430, 0], [560, 0.85], [700, 1.7], [880, 0.4], [1010, 1.3]], VP = 2.6, VON = 1.1, VWARN = 0.45;
  const STEAM = [[640, 0], [960, 1.4]], SP = 3.2, SON = 0.9;
  const PRESS = [[1880, 0], [2040, 0.7], [2200, 1.4], [2360, 2.1]], PP = 2.8, PLIFT = 150;
  const DRIPS = [[1300, 0], [1590, 0.8]];
  const GEARS = [[260, 70, 1], [1240, 60, -1], [1980, 80, 1], [2700, 64, -1]];
  const LP = () => L9.PARTS.lab;
  const has = (sh, fr) => { const d = L9D[sh]; return d && (!fr || (d.n || []).includes(fr)); };
  const SH = (c, sh, fr, x, y, h, o) => { if (!has(sh, fr)) return; const [, fh] = L9.size(sh, fr); S(c, sh, fr, x, y, h / fh, o); };     // кадр заданной высоты, якорь — ноги
  // прессы: высота подъёма плиты над полом по времени цикла (вверху -> удар -> держит -> подъём)
  const pressLift = (t, ph) => { const u = ((t + ph) % PP + PP) % PP; return u < 1.3 ? PLIFT : u < 1.5 ? PLIFT * (1 - (u - 1.3) / 0.2) : u < 1.95 ? 0 : PLIFT * (u - 1.95) / 0.85; };
  const ventSt = (t, ph) => { const u = ((t + ph) % VP + VP) % VP; return u < VWARN ? 'warn' : u < VWARN + VON ? 'on' : 'off'; };

  L9.MAPS.shut = () => {
    const LM = L9.MAPS.lab();     // подбор предметов — общий с лабораторией
    const M = {
      x0: 0, x1: W, y0: -60, y1: 520, killY: 900,
      solids: [[0, GY, PIT0, 140, 'hide'], [PIT1, GY, BR0 - PIT1, 140, 'hide'], [BR0, GY, W - BR0, 10, 'hide'], [-40, -300, 40, 900, 'hide'], [W, -300, 40, 900, 'hide']],
      walks: [], ladders: [], cks: [[70, GY], [1080, GY], [1790, GY], [BR0 + 40, GY]], picks: [],
      lifts: [{ x: PIT0 + 10, y: GY, w: 92, a: PIT0 + 10, b: 1360, sp: 0.55, ph: 0 }, { x: 1440, y: GY, w: 92, a: 1420, b: PIT1 - 102, sp: 0.55, ph: Math.PI }],
    };
    M.killAt = x => x > PIT0 && x < PIT1 ? GY + 50 : M.killY;
    M.camY = gy => gy - (LP().x > BR0 - 200 ? 236 : 276);
    M.init = (P, lv, ck) => {
      G.portraits = G.portraits || {};
      for (const k of ['semen', 'semen2']) if (!G.portraits[k]) G.loadImage('assets/spr/p_' + k + '.png').then(im => G.portraits[k] = im, () => {});
      M.t = 0; M.drops = []; M.fig = null; M.cloak = null; M.fb = null; M.camT = null; M.intro = ck === 0; M.met = 0;
      M.picks = [['kefir', 1090, GY], ['pelmeni', 2470, GY]].map(([kind, x, y]) => ({ kind, x, y, t: 0 }));
      if (ck === 0) { P.x = -20; P.hide = 0; }
    };
    // ---------- сцены ----------
    M.introScript = function* () {
      const P = LP(), D = 0.016; Scene.dialogTop = true; P.dir = 1; P.st = 'run';
      while (P.x < 90) { P.x += 120 * D; yield D; } P.st = 'stand'; yield 0.3;
    };
    const throwMask = (fr, x) => { const P = LP(); P.fx.push({ sh: 'maskZ9', fr: [fr], x, y: GY - 72, vx: 70, vy: -300, g: 640, s: 1, life: 1.5, rot: 0.4 }); Sound.play('punch'); G.shake(2, 0.15); };
    const puff = (x, y, n = 6) => { const P = LP(); for (let i = 0; i < n; i++) P.fx.push({ sh: 'fxZ9', fr: ['sm1'], x: x + rnd(-24, 24), y: y + rnd(-50, 10), vx: rnd(-20, 20), vy: rnd(-40, -10), g: 0, s: rnd(0.35, 0.6), life: 1.1, fade: 1 }); };
    M.revealScript = function* () {     // разоблачение (дословно по ТЗ): Икс в темноте -> Кеша -> Граблионок -> Семён; речь с флешбеками
      const P = LP(), D = 0.016; Scene.dialogTop = false;
      P.vx = 0; P.st = 'stand'; P.dir = 1; M.camT = STOP - 200;
      const f = M.fig = { sh: 'maskZ9', fr: 'hood', x: MEET + 110, a: 0, dir: -1 };
      for (let t = 0; t < 1.2; t += D) { f.a = t / 1.2 * 0.55; yield D; }
      yield* Scene.say('mrx', 'Ну, пора бы раскрыть все карты.', null);
      Sound.play('door', 0.5); while (f.x > MEET) { f.x -= 55 * D; f.a = Math.min(1, f.a + D * 0.6); f.walk = (f.walk || 0) + D; yield D; } f.walk = 0; f.a = 1;
      yield 0.4; Sound.play('zap'); G.flash(0.12, '#8f8'); puff(f.x, GY - 40, 8); M.cloak = { x: f.x + 6 }; f.fr = 'k0'; yield 0.9;
      yield* Scene.say('valera', 'Кеша, не может быть!', null);
      f.fr = 'k1'; yield 0.9; f.fr = 'k0';
      P.st = 'run'; while (P.x < f.x - 64) { P.x += 120 * D; yield D; } P.st = 'butt'; P.stT = 0; yield 0.12;
      throwMask('mk', f.x); f.fr = 'g0'; puff(f.x, GY - 70, 3); yield 0.4; P.st = 'stand'; yield 0.4;
      yield* Scene.say('valera', 'Это всё был ты?', null);
      f.fr = 'g1'; yield 1.0; f.fr = 'g0'; yield 0.2;
      P.st = 'butt'; P.stT = 0; yield 0.12; throwMask('mg', f.x); f.sh = 'semZ9'; f.fr = 'talk'; puff(f.x, GY - 70, 3); yield 0.4; P.st = 'stand';
      for (let t = 0; t < 0.6; t += D) { P.x -= 90 * D; yield D; }
      yield 0.5; f.fr = 'laugh'; yield 0.6; f.fr = 'talk';
      yield* Scene.say('valera', 'Семён, это ты? Ты же большой человек в приёмке завода!', null);
      M.fb = { img: 'zfbA', t: 0 }; f.fr = 'talk';
      yield* Scene.say('semen', 'Да, Валера, я всё это время был рядом, изучал тебя, смотрел твои возможности, пытался сломать тебя, унизить, совратить!', null);
      while (M.fb.t < 7.2) yield D; M.fb = null; f.fr = 'point';
      yield* Scene.say('semen', 'Я устал быть пешкой на этом заводе, я договорился со столицей, что принесу им все деньги этого города!', null);
      f.fr = 'fist'; G.shake(2, 0.3);
      yield* Scene.say('semen2', 'Звёзды на погонах меня изменили!', null);
      f.fr = 'talk'; M.fb = { img: 'zfbB', t: 0 };
      yield* Scene.say('semen', 'У меня созрел план, нужно было, правда, Граблионка и Кешу подчинить и устранить…', null);
      while (M.fb.t < 7.2) yield D; M.fb = null; f.fr = 'laugh'; Sound.play('confirm', 0.5); yield 1.0;
      yield* Scene.say('valera', 'Я не дам сбыться твоей мечте! Я не продам свою родину!', null);
      f.fr = 'fist'; yield 0.6;
    };
    M.cutUpdate = (dt, P) => { P.t += dt; M.t += dt; if (M.fb) M.fb.t += dt; M.mech(dt, P, true);
      if (M.camT != null) { P.cam.x += (M.camT - P.cam.x) * Math.min(1, dt * 2.5); P.cam.y += (M.camY(GY) - P.cam.y) * Math.min(1, dt * 3); } else P.camera(dt); P.updFx(dt); };
    // ---------- механизмы (работают и во время сцен) ----------
    M.mech = (dt, P, cut) => {
      for (const l of M.lifts) { const nx = l.a + (l.b - l.a) * (0.5 - 0.5 * Math.cos(M.t * l.sp * 2 + l.ph)), dx = nx - l.x;
        if (!cut && P.onG && Math.abs(P.y - l.y) < 2 && P.x >= l.x - 2 && P.x < l.x + l.w + 2) P.x += dx;
        l.x = nx; }
      for (const d of DRIPS) { const u = ((M.t + d[1]) % 1.6 + 1.6) % 1.6; if (u < dt) M.drops.push({ x: d[0] + 6, y: 70, vy: 0 }); }
      for (const d of M.drops) { d.vy += 700 * dt; d.y += d.vy * dt; if (d.y > GY + 40) { d.dead = 1; P.fx.push({ sh: 'fxZ9', fr: ['sp0', 'sp1'], x: d.x, y: GY + 30, s: 0.5, life: 0.4 }); } }
      if (!cut) for (const d of M.drops) if (!d.dead && Math.abs(d.x - P.x) < 12 && d.y > P.y - 80 && d.y < P.y) { d.dead = 1; P.hurt(10, d.x); }
      M.drops = M.drops.filter(d => !d.dead);
    };
    M.hazAt = (x, y, P) => {
      if (y > GY + 2) return null;
      for (const [vx, ph] of VENTS) if (ventSt(M.t, ph) === 'on' && Math.abs(x - vx) < 16 && y > GY - 110) return [16, vx - P.dir];
      for (const [sx, ph] of STEAM) { const u = ((M.t + ph) % SP + SP) % SP; if (u < SON && x > sx - 6 && x < sx + 64 && y > GY - 60) return [6, sx]; }
      const box = P.box();
      for (const [px, ph] of PRESS) { const lf = pressLift(M.t, ph); if (lf < 60 && Math.abs(x - px) < 34 && box[1] < GY - lf) return [28, px]; }
      return null;
    };
    M.update = (dt, P, lv) => {
      M.t += dt;
      if (M.intro) { M.intro = 0; Scene.run(M.introScript, () => lv.say('ЗАКРЫТАЯ ЧАСТЬ ЗАВОДА', 2.5)); return; }
      M.mech(dt, P, false);
      // пресс опустился на Валеру — выталкивает в сторону
      for (const [px, ph] of PRESS) { const lf = pressLift(M.t, ph); if (lf < 40 && Math.abs(P.x - px) < 34) P.x = px + (P.x < px ? -36 : 36); }
      for (const k of M.picks) { k.t += dt; if (!k.dead && Math.abs(P.x - k.x) < 22 && Math.abs(P.y - k.y) < 40) LM.take(k, P, lv); }
      M.picks = M.picks.filter(k => !k.dead);
      if (!M.met && P.x > STOP && P.onG) { M.met = 1; P.vx = 0; P.x = STOP; Scene.run(M.revealScript, () => lv.next()); }
      if (P.x > STOP + 20 && !M.met) P.x = STOP + 20;
    };
    M.shootProps = () => {};
    M.blast = () => {};
    // ---------- отрисовка ----------
    const haze = (c, a) => { c.fillStyle = 'rgba(3,10,6,' + a + ')'; c.fillRect(0, 0, 640, 360); };
    M.drawBack = (c, cx, cy) => {
      c.fillStyle = '#030805'; c.fillRect(0, 0, 640, 360);
      const fy = GY - cy, t = M.t;
      const fim = L9.img.zFar; if (fim) { const h = fim.height / 2, w = fim.width / 2, y = clamp(-20 - cy * 0.05, 360 - h, 0); for (let x = -((cx * 0.1 % w) + w) % w; x < 640; x += w) c.drawImage(fim, Math.floor(x), Math.round(y), Math.ceil(w) + 1, h); }
      haze(c, 0.12);
      // дальний дым: медленно поднимается
      for (let i = 0; i < 6; i++) { const X = ((i * 190 - cx * 0.2) % 1140 + 1140) % 1140 - 120, u = ((t * 0.12 + i * 0.37) % 1); S(c, 'fxZ9', 'sm0', X, fy - 120 - u * 220, 0.9 + u, { a: 0.25 * (1 - u) }); }
      const mim = L9.img.zMid; if (mim) { const h = 250, w = mim.width * h / mim.height, yb = fy - 6; for (let x = -((cx * 0.4 % w) + w) % w; x < 640; x += w) c.drawImage(mim, Math.floor(x), Math.round(yb - h), Math.ceil(w) + 1, h); }
      haze(c, 0.22);
    };
    const strip = (c, im, y, h, x0, x1) => { if (!im) return; const w = im.width * h / im.height; for (let x = Math.floor(x0 / w) * w; x < x1; x += w) c.drawImage(im, Math.floor(x), Math.round(y), Math.ceil(w) + 1, h); };
    const vat = (c, cx2, w, rimY, t) => { if (!has('vatZ9', 'vat')) return; const [vw, vh] = L9.size('vatZ9', 'vat'), k = w / vw; S(c, 'vatZ9', 'vat', cx2, rimY + vh * k * 0.97, k);
      for (let i = 0; i < 3; i++) { const u = (t * 0.7 + i * 0.33) % 1; S(c, 'fxZ9', 'sp0', cx2 + Math.sin(i * 7 + t) * w * 0.3, rimY + 6, 0.35 + u * 0.3, { a: 1 - u, add: 1 }); } };
    M.drawMid = (c, P) => {
      const x0 = P.cam.x - 220, x1 = P.cam.x + 860, t = M.t;
      strip(c, L9.img.zCeil, -60, 110, x0, x1);
      for (const [gx, gy, dr] of GEARS) if (gx > x0 - 100 && gx < x1 + 100) SH(c, 'hazZ9', 'gear', gx, gy + 40, 80, { rot: t * 0.6 * dr });
      // река жижи под поддонами — длинный чан во всю яму
      vat(c, (PIT0 + PIT1) / 2, PIT1 - PIT0 + 60, GY + 22, t);
      // огромный чан под мостиком и струя жижи из сопла сверху
      vat(c, 3000, 900, GY + 34, t);
      if (has('vatZ9', 'spout')) { const [, sh] = L9.size('vatZ9', 'spout'), k = (GY + 60 + 60) / sh; S(c, 'vatZ9', 'spout', 2740, GY + 60, k); S(c, 'vatZ9', 'spout', 2740, GY + 60, k, { add: 1, a: 0.12 + Math.sin(t * 9) * 0.06 }); }
      if ((t * 12 | 0) % 2) S(c, 'fxZ9', 'sp1', 2740 + rnd(-10, 10), GY + 40, 0.6, { add: 1, a: 0.7 });
      // пол цеха и мостик
      strip(c, L9.img.zFloor, GY - 12, 64, x0, Math.min(x1, PIT0)); if (x1 > PIT1) { c.save(); c.beginPath(); c.rect(PIT1, -400, BR0 - PIT1, 1200); c.clip(); strip(c, L9.img.zFloor, GY - 12, 64, Math.max(x0, PIT1), x1); c.restore(); }
      if (x1 > BR0) { c.save(); c.beginPath(); c.rect(BR0, -400, W - BR0, 1200); c.clip(); strip(c, L9.img.zBridge, GY - 40, 70, Math.max(x0, BR0), x1); c.restore(); }
      // сопла огня
      for (const [vx, ph] of VENTS) { if (vx < x0 || vx > x1) continue; const st = ventSt(t, ph);
        SH(c, 'hazZ9', 'vent', vx, GY + 2, 14);
        if (st === 'warn' && (t * 16 | 0) % 2) S(c, 'fxZ9', 'sp0', vx, GY - 6, 0.35, { add: 1 });
        if (st === 'on') { const fr = 'f' + ((t * 14 | 0) % 4); SH(c, 'fxZ9', fr, vx, GY - 52, 112, { add: 1 }); SH(c, 'fxZ9', fr, vx, GY - 36, 80, { add: 1, a: 0.6 }); } }     // кадры огня с якорем по центру
      // паровые вентили (струя пара вправо)
      for (const [sx, ph] of STEAM) { if (sx < x0 || sx > x1) continue; SH(c, 'hazZ9', 'steam', sx, GY + 2, 40); const u = ((t + ph) % SP + SP) % SP;
        if (u < SON) for (let i = 0; i < 4; i++) S(c, 'fxZ9', 'sm0', sx + 16 + i * 14 + (t * 60 % 14), GY - 26 - i * 2, 0.3 + i * 0.08, { a: 0.7 - i * 0.12 }); }
      // капающие трубы над рекой
      for (const [dx] of DRIPS) SH(c, 'hazZ9', 'drip', dx, 120, 90);
      for (const d of M.drops) S(c, 'fxZ9', 'sp0', d.x, d.y, 0.18, { add: 1 });
      // прессы
      for (const [px, ph] of PRESS) { if (px < x0 - 60 || px > x1 + 60) continue; const lf = pressLift(t, ph); SH(c, 'hazZ9', 'pressDn', px, GY + 2 - lf, 190); if (lf < 4 && ((t + ph) % PP) < 1.6) S(c, 'fxZ9', 'sm0', px + rnd(-30, 30), GY - 8, 0.4, { a: 0.6 }); }
      // фигура разоблачения и сброшенный плащ
      if (M.cloak) SH(c, 'maskZ9', 'cloak', M.cloak.x, GY + 2, 22);
      const f = M.fig; if (f) { const bob = f.walk ? Math.abs(Math.sin(f.walk * 8)) * 2 : 0, h = f.sh === 'semZ9' ? 86 : f.fr === 'hood' ? 92 : 84; SH(c, f.sh, f.fr, f.x, GY + 2 - bob, h, { flip: f.sh === 'semZ9', a: f.a ?? 1 }); }
      for (const k of M.picks) { const bob = Math.sin(k.t * 4) * 2; Art.item(c, k.kind, k.x, k.y - 14 + bob, 0, 1); }
    };
    M.drawCar = (c, l) => { if (!has('hazZ9', 'pallet')) return; const [pw, ph] = L9.size('hazZ9', 'pallet'), k = (l.w + 16) / pw, h = ph * k; S(c, 'hazZ9', 'pallet', l.x + l.w / 2, l.y + h * 0.12, k); };
    M.drawFront = () => {};
    // флешбеки: панели комикса по очереди, медленный наезд; затемнение по краям
    M.drawOver = (c) => {
      const fb = M.fb, im = fb && L9.img[fb.img]; if (!im) return;
      const t = fb.t, i = Math.min(3, t / 1.8 | 0), u = (t % 1.8) / 1.8, a = clamp(Math.min(t / 0.4, (7.6 - t) / 0.4), 0, 1);
      const pw = im.width / 2, ph = im.height / 2, sx = (i % 2) * pw, sy = (i / 2 | 0) * ph, z = 1.04 + u * 0.06, dw = 640 * z, dh = 360 * z;
      c.save(); c.globalAlpha = a; c.fillStyle = '#000'; c.fillRect(0, 0, 640, 360);
      c.drawImage(im, sx + 4, sy + 4, pw - 8, ph - 8, 320 - dw / 2 - (i % 2 ? 1 : -1) * u * 10, 180 - dh / 2, dw, dh);
      const g = c.createRadialGradient(320, 180, 120, 320, 180, 380); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,6,0,0.75)'); c.fillStyle = g; c.fillRect(0, 0, 640, 360);
      c.restore();
    };
    M.drawHud = () => {};
    return M;
  };

  L9.PARTS.shut = {
    deathText: 'ВАЛЕРУ ПЕРЕПЛАВИЛИ',
    get hp() { return LP().hp; }, set hp(v) { LP().hp = v; },
    get inv() { return LP().inv; }, set inv(v) { LP().inv = v; },
    start(lv, ck) { LP().start(lv, ck, 'shut'); },
    onDie(lv) { LP().onDie(lv); },
    deadUpdate(lv, dt) { LP().deadUpdate(lv, dt); },
    update(lv, dt) { LP().update(lv, dt); },
    cutUpdate(lv, dt) { const P = LP(); P.M.cutUpdate && P.M.cutUpdate(dt, P); },
    draw(lv, c) { LP().draw(lv, c); },
    drawHud(lv, c) { LP().drawHud(lv, c); },
  };
  if (!L9.ORDER.includes('shut')) L9.ORDER.push('shut');
})();
