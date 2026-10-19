// Уровень 9, ловушки лаборатории: гидропресс, лазерные ворота, паровой клапан, пила в полу, искрящий кабель.
// Описание в карте: M.traps = { press: [[x, пол, фаза]], laser: [[x, пол, верх, фаза]], vent: [[x, пол, фаза]], saw: [[x0, x1, пол]], cable: [[x, настил, фаза]] }.
(() => {
  const S = L9.spr, clamp = L9.clamp, LAB = L9.LAB;
  const PH = 78, near = (P, x, w) => Math.abs(P.x - x) < w;
  const hit = (P, d, x) => { if (P.inv > 0 || P.lv.dead) return; if (P.st === 'roll') P.st = 'stand'; P.hurt(d, x); };     // от ловушек перекат не спасает (только если пролез под лучом)

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

  // зелёный огонь: столб из решётки в полу и струя из настенного сопла; горизонтальный лазер ходит вверх-вниз между стойками
  const FC_T = 2.4, JET_T = 2.6;
  const bodyTop = P => P.y - (P.st === 'crouch' || P.st === 'roll' ? 50 : PH);
  const hlaserY = (h, t) => { const [, , fl, lo, hi, per, f] = h; return fl - (lo + (hi - lo) * (0.5 - 0.5 * Math.cos((t + f) / per * Math.PI * 2))); };
  LAB.trapsUpdate2 = (M, P, dt) => {
    const T = M.traps; if (!T) return; const t = P.t;
    for (const [x, fl, f] of T.fcol || []) { const u = (t + f) % FC_T; if (u > 1.6 && near(P, x, 16) && P.y <= fl + 2 && P.y > fl - 118) hit(P, 18, x); }
    for (const [x, y, d, f, len] of T.jet || []) { const u = (t + f) % JET_T; if (u >= 1.6) { const a = Math.min(x, x + d * len), b = Math.max(x, x + d * len); if (P.x > a && P.x < b && y > bodyTop(P) && y < P.y) hit(P, 20, x); } }
    for (const h of T.hlaser || []) { h.by = hlaserY(h, t); h.by2 = h.by - 14;     /* лучи идут парой (зазор 14): когда пара выше роста Валеры (78) — проходишь под ней, окно ~40% периода */ for (const yy of [h.by, h.by2]) if (P.x > h[0] && P.x < h[1] && yy > bodyTop(P) && yy < P.y - 2) hit(P, 15, P.x - P.dir * 20); }     // два луча в противофазе
  };
  LAB.pressCeil = (M, P, x) => {     // низ головки пресса над x (в прыжке Валера упирается в неё головой); null — пресса нет
    let best = null; for (const [px, fl, f] of (M.traps && M.traps.press) || []) if (Math.abs(x - px) < 44 && P.y <= fl + 2 && P.y > fl - 200) { const hb = pressY(fl, (P.t + f) % PRESS_T); if (best === null || hb > best) best = hb; }
    return best;
  };
  LAB.trapsUpdate = (M, P, dt) => {
    const T = M.traps; if (!T) return; const t = P.t, ph = P.y - PH;
    LAB.trapsUpdate2(M, P, dt);
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
    const slice = (sh, n, s0, s1, dx, dy, dw, dh, flip, add, al) => { const F = fr(sh, n), im = L9.img[sh]; if (!im) return; c.save(); if (al != null) c.globalAlpha = al; if (add) c.globalCompositeOperation = 'lighter'; if (flip) { c.translate(dx * 2 + dw, 0); c.scale(-1, 1); } c.drawImage(im, F[0] + F[2] * s0, F[1], F[2] * (s1 - s0), F[3], dx, dy, dw, dh); c.restore(); };
    for (const [x, fl, f] of T.fcol || []) {      // решётка в полу; перед выбросом — вспышки, потом столб огня
      if (x < x0 || x > x1) continue; const u = (t + f) % FC_T, k = 0.9;
      if (u > 1.6) { const n = (t * 10 | 0) % 2 ? 'col0' : 'col1', [, h] = L9.size('fire9', n); S(c, 'fire9', n, x, fl + 3 - h * k / 2, k); }
      else { const [, gh] = L9.size('fire9', 'grate'); S(c, 'fire9', 'grate', x, fl + 2 - gh * k / 2, k); if (u > 1.2 && (t * 16 | 0) % 2) { const [, h] = L9.size('fire9', 'col0'); S(c, 'fire9', 'col0', x, fl + 3 - h * 0.3 / 2, 0.3, { a: 0.7 }); } }
    }
    for (const [x, y, d, f, len] of T.jet || []) {     // сопло на стене; раскаляется, потом бьёт струёй (пламя тянется на len)
      if (Math.max(x, x + d * len) < x0 || Math.min(x, x + d * len) > x1) continue; const u = (t + f) % JET_T, k = 0.6, [nw, nh] = L9.size('fire9', 'noz');
      if (u >= 1.6) { const n = (t * 12 | 0) % 2 ? 'jet0' : 'jet1', [jw, jh] = L9.size('fire9', n), fh = jh * k * 1.1; slice('fire9', n, 0.2, 1, d > 0 ? x + nw * k * 0.6 : x - nw * k * 0.6 - len, y - fh / 2, len, fh, d < 0, 0, 1); }
      S(c, 'fire9', u >= 1.2 ? 'nozHot' : 'noz', x + d * nw * k * 0.3, y, k, { flip: d < 0 });
    }
    for (const h of T.hlaser || []) {     // стойки с излучателями, луч поперёк
      const [a, b, fl, lo, hi] = h; if (b < x0 || a > x1) continue; const yy = h.by ?? hlaserY(h, t), [, rh] = L9.size('trap9a', 'rod'), [, bh] = L9.size('trap9a', 'beam');
      for (const px of [a, b]) for (let y = fl; y > Math.min(fl - hi - 26, P.cam.y - 30); y -= rh * 0.35 - 1) S(c, 'trap9a', 'rod', px, y - rh * 0.35 / 2, 0.35);     // стойки до потолка (выше края экрана)
      for (const y of [yy, h.by2 ?? (yy - 14)]) {
        c.filter = 'hue-rotate(115deg) saturate(1.3)';     // лазеры по ТЗ зелёные
        S(c, 'trap9a', 'beam', (a + b) / 2, y, 0.8, { rot: Math.PI / 2, sy: (b - a - 16) / (bh * 0.8), add: 1, a: 0.8 + Math.sin(t * 40) * 0.15 });
        c.filter = 'none';
        S(c, 'trap9a', 'emU', a + 6, y, 0.42, { rot: Math.PI / 2 }); S(c, 'trap9a', 'emU', b - 6, y, 0.42, { rot: -Math.PI / 2 });
      }
    }
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
      if (on || warn) { const [, bh] = L9.size('trap9a', 'beam'); c.filter = 'hue-rotate(115deg) saturate(1.3)'; S(c, 'trap9a', 'beam', x, (eb + et) / 2, 0.8, { sy: (eb - et) / (bh * 0.8), add: 1, a: on ? 0.75 + Math.sin(t * 40) * 0.2 : ((t * 20 | 0) % 2) * 0.35 }); c.filter = 'none'; }
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
