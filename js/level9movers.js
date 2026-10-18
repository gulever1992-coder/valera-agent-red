// Уровень 9, движущиеся платформы лаборатории: огромный грузовой лифт вниз (на него сыплются орды), бесконечные лифты (патерностер)
// и лифт-колесо. Все платформы — записи в M.lifts (по ним ходят floorBelow и враги); Валеру платформа везёт с собой.
// Описание в карте: M.movers = { big: {x, w, y0, y1, waves}, pater: [{x, up, top, bot}], wheel: [{x, y, r, n, w}] }.
(() => {
  const S = L9.spr, clamp = L9.clamp, LAB = L9.LAB;
  const PAT_SP = 48, PAT_GAP = 122, STEP_W = 64, CRAD_W = 54, CRAD_HANG = 52;

  LAB.moversInit = (M, atBottom) => {
    const V = M.movers; if (!V) return;
    if (V.big) { const b = V.big; V.bigL = { kind: 'big', x: b.x + (atBottom ? b.dx || 0 : 0), w: b.w, y: atBottom ? b.y1 : b.y0, on: atBottom ? 2 : 0, wv: 0 }; M.lifts.push(V.bigL); }
    V.steps = []; for (const c of V.pater || []) { const L = c.bot - c.top, n = Math.ceil(L / PAT_GAP); for (let i = 0; i < n; i++) { const s = { kind: 'step', col: c, ph: i * PAT_GAP, x: c.x - STEP_W / 2, w: STEP_W, y: c.top }; V.steps.push(s); M.lifts.push(s); } }
    V.crads = []; for (const w of V.wheel || []) for (let i = 0; i < w.n; i++) { const s = { kind: 'cradle', wh: w, a0: i * Math.PI * 2 / w.n, x: 0, w: CRAD_W, y: 0 }; V.crads.push(s); M.lifts.push(s); }
    LAB.moversUpdate(M, null, 0);
  };

  const carry = (P, l, ox, oy) => { if (P && P.onG && !P.climb && P.x > ox - 4 && P.x < ox + l.w + 4 && Math.abs(P.y - oy) < 4) { P.x += l.x - ox; P.y = l.y; } };

  LAB.moversUpdate = (M, P, dt, lv) => {
    const V = M.movers; if (!V) return; const t = (M.mvT = (M.mvT || 0) + dt);
    for (const s of V.steps) {      // патерностер: колонна вверх или вниз, ступени по кругу (внизу уходят в кислоту, вверху — в шестерню)
      const c = s.col, L = c.bot - c.top, q = ((s.ph + t * PAT_SP) % L + L) % L, ox = s.x, oy = s.y;
      s.y = c.up ? c.bot - q : c.top + q; s.hid = s.y > c.bot - 8 || s.y < c.top + 8; s.w = s.hid ? 0 : STEP_W;
      carry(P, s, ox, oy);
    }
    for (const s of V.crads) {     // колесо: люльки висят на ободе и всегда смотрят вниз
      const w = s.wh, a = s.a0 + t * w.w, ox = s.x, oy = s.y; s.px = w.x + Math.cos(a) * w.r; s.py = w.y + Math.sin(a) * w.r;
      s.x = s.px - CRAD_W / 2; s.y = s.py + CRAD_HANG; carry(P, s, ox, oy);
    }
    const L = V.bigL; if (!L || !P) return; const b = V.big, oy = L.y, ox = L.x;
    if (L.on === 0 && P.onG && P.x > L.x && P.x < L.x + L.w && Math.abs(P.y - L.y) < 3) { L.on = 1; Sound.play('crane'); lv.say('ГРУЗОВОЙ ЛИФТ! ВНИЗ!', 2); }
    if (L.on === 1) {
      L.y = Math.min(b.y1, L.y + 42 * dt); L.x = b.x + (L.y - b.y0) / (b.y1 - b.y0) * (b.dx || 0);     // по наклонным рельсам: вбок и вниз
      while (L.wv < b.waves.length && L.y >= b.waves[L.wv][0]) {      // волна: охрана прыгает сверху на платформу
        for (const [tp, dx, o] of b.waves[L.wv][1]) P.foes.push(new (L9.FOES[tp])(M, L.x + dx, L.y - (tp === 'Fly' ? 150 : 300), Object.assign({}, o || {})));
        if (L.wv) lv.say('СВЕРХУ!', 1); L.wv++;
      }
      if (L.y >= b.y1) { L.on = 2; Sound.play('clank'); G.shake(3, 0.2); }
      if (P.onG && P.x > ox - 4 && P.x < ox + L.w + 4 && Math.abs(P.y - oy) < 4) { P.y = L.y; P.x += L.x - ox; }
      for (const f of P.foes) if (!f.dead && !f.air && f.onG && f.x > ox && f.x < ox + L.w && Math.abs(f.y - oy) < 5) { f.y = L.y; f.x += L.x - ox; }
    }
  };

  LAB.moversDraw = (c, M, P) => {
    const V = M.movers; if (!V) return; const x0 = P.cam.x - 200, x1 = P.cam.x + 840; c.imageSmoothingEnabled = true;
    // патерностер: цепь от верхней шестерни до кислоты, ступени
    for (const col of V.pater || []) {
      if (col.x < x0 || col.x > x1) continue; const [, ch] = L9.size('lift9b', 'chain'), k = 0.55, [, hh] = L9.size('lift9b', 'hub');
      for (let y = col.top; y < col.bot + 30; y += ch * k - 2) S(c, 'lift9b', 'chain', col.x + (col.up ? -20 : 20), y + ch * k / 2, k);
      S(c, 'lift9b', 'hub', col.x, col.top - 10, 0.42, { rot: (M.mvT || 0) * (col.up ? -1.2 : 1.2) });
    }
    for (const s of V.steps) { if (s.hid || s.x < x0 || s.x > x1) continue; const [, h] = L9.size('lift9b', 'step'), k = 0.9; S(c, 'lift9b', 'step', s.x + STEP_W / 2, s.y - h * k * 0.18, k, { flip: !s.col.up }); }
    // колесо: спицы (штоки) от ступицы к люлькам, ступица, люльки
    for (const w of V.wheel || []) {
      if (w.x + w.r < x0 || w.x - w.r > x1) continue; const [, rh] = L9.size('trap9a', 'rod');
      for (const s of V.crads) if (s.wh === w) S(c, 'trap9a', 'rod', (w.x + s.px) / 2, (w.y + s.py) / 2, 0.5, { rot: Math.atan2(s.py - w.y, s.px - w.x) - Math.PI / 2, sy: w.r / (rh * 0.5) });
      S(c, 'lift9b', 'hub', w.x, w.y, 0.75, { rot: (M.mvT || 0) * w.w });
      for (const s of V.crads) if (s.wh === w) { const [, h] = L9.size('lift9b', 'cradle'), k = 0.9; S(c, 'lift9b', 'cradle', s.px, s.py + h * k / 2 - 4, k); }
    }
    c.imageSmoothingEnabled = false;
  };

  // наклонный грузовой лифт: тележка (настил горизонтальный, колёса на уклоне 0.3) едет по рельсу вбок и вниз; рельс — тайлами вдоль пути
  const INC_K = 1.35, INC = { deckL: 0.22, deckR: 0.97, deckT: 0.122, railY: 0.72, slope: 0.3 };
  const carBox = (L, f) => { const FW = f[2] * 0.5 * INC_K, FH = f[3] * 0.5 * INC_K, dw = (INC.deckR - INC.deckL) * FW, kx = L.w / dw; return { FW: FW * kx, FH: FH * kx, x0: L.x - INC.deckL * FW * kx, top: L.y - INC.deckT * FH * kx }; };
  LAB.bigLiftDraw = (c, L, P) => {
    const im = L9.img.inc9, M = P.M, b = M.movers.big; if (!im) return; const f = L9D.inc9.f[L9.fi('inc9', 'car')], fr = L9D.inc9.f[L9.fi('inc9', 'rail')];
    c.imageSmoothingEnabled = true;
    // рельс: линия через рельс тележки в начале пути
    const c0 = carBox({ x: b.x, y: b.y0, w: L.w }, f), ry0 = c0.top + INC.railY * c0.FH, rk = c0.FW / (f[2] * 0.5) * 0.5, rw = fr[2] * rk, rh = fr[3] * rk;
    { const RK = 0.95, [tw] = L9.size('part9', 'rail'), th = Math.atan(INC.slope), len = tw * RK - 1.5, ux = Math.cos(th), uy = Math.sin(th);     // рельс одной линией: бесшовная полоса, повёрнутая под уклон
      const x0 = c0.x0 - 200, y0 = ry0 - 200 * INC.slope; for (let i = 0; ; i++) { const cx = x0 + (i + 0.5) * len * ux, cy = y0 + (i + 0.5) * len * uy; if (cx - len > b.x + b.dx + L.w + 300) break; if (cx + len < P.cam.x - 40 || cx - len > P.cam.x + 680) continue; S(c, 'part9', 'rail', cx, cy, RK, { rot: th }); } }
    const cb = carBox(L, f); c.drawImage(im, f[0], f[1], f[2], f[3], cb.x0, cb.top, cb.FW, cb.FH);
    c.imageSmoothingEnabled = false;
  };

  // рычаги: сбоку на стойке; Валера проходит рядом — рычаг перекидывается
  LAB.leversUpdate = (M, P, lv) => {
    for (const l of M.levers || []) if (!l.on && Math.abs(P.x - l.x) < 26 && Math.abs(P.y - l.y) < 30) {
      l.on = 1; Sound.play('clank'); const n = M.levers.filter(q => q.on).length; lv.say('РЫЧАГ ' + n + ' ИЗ ' + M.levers.length + (n === M.levers.length ? ' — ДВЕРЬ ОТКРЫТА!' : ''), 2.2);
    }
  };
  LAB.leversDraw = (c, M, P) => {
    for (const l of M.levers || []) { const n = l.on ? 'levOn' : 'levOff', [, h] = L9.size('part9', n), k = 0.6; S(c, 'part9', n, l.x, l.y + 2 - h * k / 2, k); }     // рычаг на тумбе, привинченной к полу
  };
})();
