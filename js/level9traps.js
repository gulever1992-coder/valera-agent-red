// Уровень 9, ловушки лаборатории: гидропресс, лазерные ворота, паровой клапан, пила в полу, искрящий кабель.
// Описание в карте: M.traps = { press: [[x, пол, фаза]], laser: [[x, пол, верх, фаза]], vent: [[x, пол, фаза]], saw: [[x0, x1, пол]], cable: [[x, настил, фаза]] }.
(() => {
  const S = L9.spr, clamp = L9.clamp, LAB = L9.LAB;
  const PH = 78, near = (P, x, w) => Math.abs(P.x - x) < w;
  const hit = (P, d, x) => { if (P.inv > 0 || P.lv.dead) return; P.hurt(d, x); };

  // гидропресс: стоит вверху -> дрожит (предупреждение) -> бьёт в пол -> держит -> поднимается
  const PRESS_T = 2.6, PK = 0.95;
  const pressY = (fl, u) => {     // низ головки
    const up = fl - 112;
    if (u < 1.5) return up; if (u < 1.62) return up + (fl - up) * ((u - 1.5) / 0.12); if (u < 2) return fl; return fl - (fl - up) * ((u - 2) / 0.6);
  };
  // лазер: включён ON с, перед включением мигает
  const LAS_T = 2.8, LAS_ON = 1.6;
  // пар: тихо -> струйка (предупреждение) -> выброс -> рассеивается
  const VENT_T = 3.4;
  const ventFr = u => u < 1.6 ? 'vent0' : u < 2.3 ? 'vent1' : u < 3.1 ? 'vent2' : 'vent3';
  // кабель: искрит часть цикла
  const CAB_T = 2.2, CAB_ON = 0.9;

  LAB.trapsUpdate = (M, P, dt) => {
    const T = M.traps; if (!T) return; const t = P.t, ph = P.y - PH;
    for (const [x, fl, f] of T.press || []) {
      const u = (t + f) % PRESS_T, hb = pressY(fl, u), pu = ((t - dt) + f) % PRESS_T;
      if (pu < 1.62 && u >= 1.62 && Math.abs(P.x - x) < 420) { Sound.play('crash', 0.5); G.shake(3, 0.15); }
      if (near(P, x, 46) && Math.abs(P.y - fl) < 4 && hb > ph + 10 && u > 1.5 && u < 2.1) { hit(P, 35, x); P.x = x + (P.x < x ? -62 : 62); }
    }
    for (const [x, fl, top, f] of T.laser || []) {
      const u = (t + f) % LAS_T; if (u < LAS_ON && near(P, x, 9) && P.y > top && ph < fl) hit(P, 20, x - P.dir * 10);
    }
    for (const [x, fl, f] of T.vent || []) {
      const u = (t + f) % VENT_T, pu = ((t - dt) + f) % VENT_T;
      if (pu < 2.3 && u >= 2.3 && Math.abs(P.x - x) < 360) Sound.play('warn', 0.25);
      if (u >= 2.3 && u < 3.1 && near(P, x, 17) && P.y <= fl + 2 && P.y > fl - 112) hit(P, 15, x);
    }
    for (const s of T.saw || []) {
      const [x0, x1, fl] = s, L = x1 - x0 - 40, q = (t * 120) % (2 * L); s.bx = x0 + 20 + (q < L ? q : 2 * L - q);
      if (near(P, s.bx, 26) && P.y > fl - 22 && P.y <= fl + 2) hit(P, 20, s.bx);
      if (Math.random() < dt * 8 && Math.abs(s.bx - P.x) < 400) P.fx.push({ sh: 'fxL9', fr: ['spark'], x: s.bx + L9.rnd(-10, 10), y: fl - 8, s: 0.25, t: 0, life: 0.18, add: 1, fade: 1 });
    }
    for (const [x, fl, f] of T.cable || []) {
      const u = (t + f) % CAB_T; if (u < CAB_ON && near(P, x, 16) && Math.abs(P.y - fl) < 6 && ph < fl - 50) hit(P, 18, x);
    }
  };

  const fr = (sh, n) => L9D[sh].f[L9.fi(sh, n)];
  LAB.trapsDraw = (c, M, P) => {
    const T = M.traps; if (!T) return; const t = P.t, x0 = P.cam.x - 120, x1 = P.cam.x + 760, cy = P.cam.y;
    c.imageSmoothingEnabled = true;
    // пила: желоб тайлом по полу, диск ездит туда-сюда (кадр отражается — зубья «бегут»)
    for (const s of T.saw || []) {
      const [a, b, fl] = s; if (b < x0 || a > x1) continue; const [tw, th] = L9.size('trap9b', 'track');
      const [, bh] = L9.size('trap9b', 'saw0'), bx = s.bx || a;
      S(c, 'trap9b', 'saw0', bx, fl - 4 - bh * 2.4 / 2, 2.4, { flip: (t * 14 | 0) % 2 === 0 });
      c.save(); c.beginPath(); c.rect(a, fl - 20, b - a, 40); c.clip(); for (let x = a; x < b; x += tw * 1.3 - 1) S(c, 'trap9b', 'track', x + tw * 0.65, fl - th * 0.65 + 5, 1.3); c.restore();
    }
    // паровой клапан: низ трубы на полу
    for (const [x, fl, f] of T.vent || []) {
      if (x < x0 || x > x1) continue; const n = ventFr((t + f) % VENT_T), [, h] = L9.size('trap9b', n);
      S(c, 'trap9b', n, x, fl + 2 - h / 2, 1);
    }
    // лазерные ворота: излучатель на полу, второй над ним (подвешен), луч между ними
    for (const [x, fl, top, f] of T.laser || []) {
      if (x < x0 || x > x1) continue; const u = (t + f) % LAS_T, on = u < LAS_ON, warn = !on && u > LAS_T - 0.35, k = 0.55;
      const [, eh] = L9.size('trap9a', 'emU'), eb = fl - eh * k + 6, et = top + eh * k - 6;
      if (on || warn) { const [, bh] = L9.size('trap9a', 'beam'); S(c, 'trap9a', 'beam', x, (eb + et) / 2, 0.8, { sy: (eb - et) / (bh * 0.8), add: 1, a: on ? 0.75 + Math.sin(t * 40) * 0.2 : ((t * 20 | 0) % 2) * 0.35 }); }
      S(c, 'trap9a', on || warn ? 'emU' : 'emOff', x, fl + 2 - eh * k / 2, k);
      const [rw, rh] = L9.size('trap9a', 'rod'); for (let y = top; y > cy - rh * 0.4; y -= rh * 0.4 - 1) S(c, 'trap9a', 'rod', x, y - rh * 0.4 / 2, 0.4);     // подвес верхнего излучателя
      S(c, 'trap9a', 'emD', x, top + eh * k / 2, k);
    }
    // гидропресс: шток от головки вверх за край экрана
    for (const [x, fl, f] of T.press || []) {
      if (x < x0 || x > x1) continue; const u = (t + f) % PRESS_T, sh = u > 1.2 && u < 1.5 ? Math.sin(t * 90) * 1.5 : 0;
      const n = u >= 1.62 && u < 1.8 ? 'slam' : 'head', [, hh] = L9.size('trap9a', 'head'), hb = pressY(fl, u) + (n === 'slam' ? 12 : 0);
      const [, rh] = L9.size('trap9a', 'rod'), top = hb - hh * PK;
      for (let y = top + 6; y > cy - rh * PK; y -= rh * PK - 2) S(c, 'trap9a', 'rod', x + sh, y - rh * PK / 2, PK);
      S(c, 'trap9a', n, x + sh, hb - hh * PK / 2 + (n === 'slam' ? 0 : 0), PK);
    }
    // кабель: свисает сверху; искрит — весь кадр, затих — без искр (только верх)
    const im = L9.img.trap9b;
    for (const [x, fl, f] of T.cable || []) {
      if (x < x0 || x > x1 || !im) continue; const on = (t + f) % CAB_T < CAB_ON, F = fr('trap9b', 'cable'), k = 0.5, w = F[2] * k, h = F[3] * k;
      const end = fl - 50, top = end - h * 0.78, sw = Math.sin(t * 2 + x) * 2, xl = x - w * 0.62 + sw;     // торец кабеля ~ на 78% высоты кадра
      c.drawImage(im, F[0], F[1], F[2], F[3] * 0.2, xl, cy - 10, w, top + h * 0.2 - cy + 10);     // жила кабеля до верха экрана
      c.drawImage(im, F[0], F[1], F[2], F[3] * (on ? 1 : 0.62), xl, top, w, h * (on ? 1 : 0.62));
    }
    c.imageSmoothingEnabled = false;
  };
})();
