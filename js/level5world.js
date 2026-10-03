'use strict';
// ============ УРОВЕНЬ 5: отрисовка мира — земля, дороги, тени, предметы, здания с объёмом, свет, ветер, листья ============
L5.fxs = [];
L5.fx = (k, x, y, o = {}) => L5.fxs.push(Object.assign({ k, x, y, t: 0, dur: k === 'boom' ? 0.75 : k === 'smoke' ? 1.2 : k === 'dust' ? 0.5 : 0.6, sc: 1, rot: 0 }, o));
// кадры листа l5fx: взрыв 0-7, огонь 8-11, дым 12-15, вспышка 16-17, слизь 18-19, клякса 20, стекло 21, обломки 22, искры 23, брызги 24-27, пыль 28-29, щепки 30-31
L5.R.drawFx = function (c) {
  if (!L5.has('l5fx')) return;
  for (const e of L5.fxs) {
    const k = e.t / e.dur;
    let fr = 0;
    if (e.k === 'boom') fr = Math.min(7, Math.floor(k * 8));
    else if (e.k === 'fire') fr = 8 + Math.floor(e.t * 10) % 4;
    else if (e.k === 'smoke') fr = 12 + Math.min(3, Math.floor(k * 4));
    else if (e.k === 'muzzle') fr = 16 + Math.floor(e.t * 30) % 2;
    else if (e.k === 'glass') fr = 21;
    else if (e.k === 'splash') fr = 24 + Math.min(3, Math.floor(k * 4));
    else if (e.k === 'dust') fr = 28 + Math.min(1, Math.floor(k * 2));
    else if (e.k === 'splinter') fr = 30 + Math.min(1, Math.floor(k * 2));
    c.save(); c.globalAlpha = e.k === 'smoke' ? 0.85 * (1 - k * 0.6) : e.k === 'glass' || e.k === 'dust' ? 1 - k : 1;
    Spr.drawC(c, 'l5fx', fr, e.x, e.y - (e.k === 'smoke' ? e.t * 30 : 0), e.rot, e.sc);
    c.restore();
    if (e.k === 'boom' && L5.has('l5lights')) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8 * (1 - k); Spr.drawC(c, 'l5lights', 5, e.x, e.y, 0, 2.4 * e.sc); c.restore(); }
  }
};

// ---------- мелкие предметы: только спрайты (l5props) ----------
// спрайты пустыря (лист l5waste): 0 мёртвое дерево, 1 валуны, 2 остов машины, 3 перекати-поле, 4 вагончик, 5 плиты, 6 шины, 7 бак, 8 столб, 9 сухая трава, 10 мусор
L5.WASTE_SC = [0.62, 0.52, 0.56, 0.4, 0.68, 0.5, 0.44, 0.56, 0.6, 0.42, 0.42];
L5.R.prop = function (c, C, o, t) {
  if (!L5.has('l5props')) return;
  const PS = L5.PR;
  switch (o.kind) {
    case 'dumpster': Spr.drawC(c, 'l5props', PS.dumpster, o.x, o.y - 4, o.rot || 0, 1); break;
    case 'crate': Spr.drawC(c, 'l5props', PS.crates, o.x, o.y - 4, 0, 1); break;
    case 'bench': Spr.drawC(c, 'l5props', PS.bench, o.x, o.y - 3, 0, 1); break;
    case 'barrel': Spr.drawC(c, 'l5props', PS.barrels, o.x, o.y - 4, 0, 0.55); break;
    case 'cone': Spr.drawC(c, 'l5props', PS.cones, o.x, o.y - 4, o.rot || 0, 0.7); break;
    case 'barricade': Spr.drawC(c, 'l5props', PS.barricade, o.x, o.y - 5, 0, 1); break;
    case 'ramp': Spr.drawC(c, 'l5props', PS.ramp, o.x, o.y, o.rot || 0, 1); break;
    case 'fence': Spr.drawC(c, 'l5props', PS.fence, o.x, o.y - 4, o.rot || 0, 0.8); break;
    case 'puddle': c.save(); c.globalAlpha = 0.85; Spr.drawC(c, 'l5props', PS.puddle, o.x, o.y, o.ph || 0, 0.8); c.restore(); break;
    case 'billboard': Spr.drawC(c, 'l5props', PS.billboard, o.x, o.y - 8, 0, 1); break;
    case 'waste': Spr.drawC(c, 'l5waste', o.fr, o.x, o.y - 4, 0, L5.WASTE_SC[o.fr]); break;
  }
};
L5.R.PXY = (x, y, C, k) => [C.x + (x - C.x) * k, C.y + (y - C.y) * k];

let _leaves = null;
L5.R.world = function (lv, c) {
  const wd = L5.world, t = G.t, z = lv.zoom, C = { x: Math.round(lv.cam.x), y: Math.round(lv.cam.y) }, SW = L5.SW;
  const vw = W / z, vh = H / z, x0 = C.x - vw / 2 - 6, y0 = C.y - vh / 2 - 6, x1 = C.x + vw / 2 + 6, y1 = C.y + vh / 2 + 6;
  const PM = L5.prof ? (n) => { const now = performance.now(); L5.prof[n] = (L5.prof[n] || 0) + now - (L5._pt || now); L5._pt = now; } : () => {};
  L5._pt = performance.now();
  c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-C.x, -C.y);
  // --- земля
  c.fillStyle = L5.getPat(c, 5); c.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (const p of wd.parks) if (p.x1 > x0 && p.x0 < x1 && p.y1 > y0 && p.y0 < y1) { c.fillStyle = L5.getPat(c, 11); c.fillRect(p.x0, (p.y0 + p.y1) / 2 - 22, p.x1 - p.x0, 44); c.fillRect((p.x0 + p.x1) / 2 - 22, p.y0, 44, p.y1 - p.y0); }
  const M = 220, boxes = [];
  wd.boxes.query(x0 - M, y0 - M, x1 + M, y1 + M, b => { if (!b.gone) boxes.push(b); });
  c.fillStyle = L5.getPat(c, 10);
  for (const b of boxes) if (b.yard) c.fillRect(b.x - 24, b.y - 18, b.w + 48, b.d + 50);
  for (const L of wd.lakes) if (L.x + L.rx > x0 && L.x - L.rx < x1 && L.y + L.ry > y0 && L.y - L.ry < y1) {
    c.fillStyle = L5.getPat(c, 15); c.beginPath(); c.ellipse(L.x, L.y, L.rx + 26, L.ry + 22, 0, 0, 7); c.fill();
    c.save(); c.beginPath(); c.ellipse(L.x, L.y, L.rx, L.ry, 0, 0, 7); c.clip();
    c.fillStyle = L5.getPat(c, 7); c.fillRect(L.x - L.rx, L.y - L.ry, L.rx * 2, L.ry * 2);
    c.globalAlpha = 0.45; c.translate(Math.sin(t * 0.6) * 9, Math.cos(t * 0.45) * 6); c.fillRect(L.x - L.rx - 12, L.y - L.ry - 12, L.rx * 2 + 24, L.ry * 2 + 24);
    c.translate(-Math.sin(t * 0.9) * 14, Math.sin(t * 0.7) * 8); c.globalAlpha = 0.3; c.fillRect(L.x - L.rx - 20, L.y - L.ry - 20, L.rx * 2 + 40, L.ry * 2 + 40);
    c.restore();
  }
  PM('ground');
  // --- дороги
  const vis = wd.roads.filter(r => r.x1 + SW > x0 && r.x0 - SW < x1 && r.y1 + SW > y0 && r.y0 - SW < y1);
  c.fillStyle = L5.getPat(c, 4); for (const r of vis) c.fillRect(r.x0 - SW, r.y0 - SW, r.x1 - r.x0 + SW * 2, r.y1 - r.y0 + SW * 2);
  c.fillStyle = L5.getPat(c, 0); for (const r of vis) c.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
  // финальная зона: песчаная площадка у обрыва над морем (рисунок Codex)
  if (L5.has('l5endzone') && !wd.endDraw) { const E = L5.at(L5.S_END, { lane: 0 }); wd.endDraw = { x: E.x + E.dx * 400, y: E.y + E.dy * 400, ang: Math.atan2(E.dy, E.dx) + Math.PI / 2 }; }
  if (wd.endDraw) { const e = wd.endDraw; if (e.x > x0 - 1800 && e.x < x1 + 1800 && e.y > y0 - 1800 && e.y < y1 + 1800) Spr.drawC(c, 'l5endzone', 0, e.x, e.y, e.ang, 1.375); }
  const inOther = (x, y, self) => wd.roads.some(q => q !== self && x > q.x0 + 1 && x < q.x1 - 1 && y > q.y0 + 1 && y < q.y1 - 1);
  const D = (i, x, y, rot, sc) => Spr.drawC(c, 'l5dec', i, x, y, rot, sc == null ? 1 : sc);
  if (L5.has('l5dec')) {
    for (const r of vis) {
      const len = Math.hypot(r.bx - r.ax, r.by - r.ay), dx = (r.bx - r.ax) / len, dy = (r.by - r.ay) / len;
      for (let tt = r.main ? 0 : r.hw + 10; tt < len; tt += 60) {
        const mx = r.ax + dx * (tt + 15), my = r.ay + dy * (tt + 15);
        if (mx < x0 - 40 || mx > x1 + 40 || my < y0 - 40 || my > y1 + 40 || inOther(mx, my, r)) continue;
        c.save(); c.globalAlpha = 0.9; D(0, mx, my, r.hor ? 0 : Math.PI / 2); c.restore();
      }
      if (r.side && r.parent) {
        const g = r.parent;
        for (const sd of [-1, 1]) {
          const ox = r.ax + g.dx * sd * (r.hw + 14), oy = r.ay + g.dy * sd * (r.hw + 14);
          if (ox < x0 - 80 || ox > x1 + 80 || oy < y0 - 80 || oy > y1 + 80) continue;
          D(3, ox, oy, Math.abs(g.dx) > 0.5 ? Math.PI / 2 : 0, 0.9);
        }
      }
    }
    for (const s2 of [L5.S_END]) { // стартовую линию убрали
      if (s2 === L5.S_RACE && !lv.raceStarted) continue;
      const a = L5.at(s2); if (a.x < x0 - 200 || a.x > x1 + 200 || a.y < y0 - 200 || a.y > y1 + 200) continue;
      D(s2 === L5.S_END ? 2 : 5, a.x, a.y, Math.abs(a.dx) > 0.5 ? Math.PI / 2 : 0, 1);
    }
  }
  if (L5.R.rails) L5.R.rails(c, lv, x0, y0, x1, y1, t);
  PM('roads');
  // --- тени (мягкие спрайты l5shad: 0 круг, 1 машина, 2 крона, 3 столб)
  const SH = (i, x, y, w, h, a, rot) => { const f = Spr.frame('l5shad', i); if (!f) return; const sh = Spr.sheets.l5shad; c.save(); c.globalAlpha = a; c.translate(x, y); if (rot) c.rotate(rot); c.drawImage(sh.img, f[0], f[1], f[2], f[3], -w / 2, -h / 2, w, h); c.restore(); };
  L5.R.SH = SH;
  for (const b of boxes) { const hz = Math.min(120, b.H) * 0.28; SH(1, b.x + b.w / 2 + hz * 0.7, b.y + b.d / 2 + hz * 0.7, b.w + hz * 1.6, b.d + hz * 1.6, 0.75); }
  const list = [], tall = [], pad = 140;
  wd.objs.query(x0 - pad, y0 - pad, x1 + pad, y1 + pad + 100, o => { if (!o.hidden && !o.gone) { if (o.kind === 'tree' || o.kind === 'lamp') tall.push(o); else list.push(o); } });
  for (const o of tall) { if (o.kind === 'tree') SH(2, o.x + 8, o.y + 6, 70 * o.sz, 52 * o.sz, 0.7); else SH(3, o.x + 16, o.y - 4, 56, 40, 0.6); }
  if (L5.has('l5dec')) {
    for (const d of lv.decals) { c.save(); c.globalAlpha = Math.max(0, 1 - d.t / 25); D(9, d.x, d.y, d.x * 0.01, Math.max(0.6, d.r / 26)); c.restore(); }
    for (const s2 of lv.skids) if (s2.x > x0 - 20 && s2.x < x1 + 20 && s2.y > y0 - 20 && s2.y < y1 + 20) { c.save(); c.globalAlpha = 0.7; D(7, s2.x, s2.y, s2.a, 0.35); c.restore(); }
  }
  PM('shadows');
  // --- наземные предметы и существа по глубине
  const gl = [];
  for (const o of list) gl.push(o);
  for (const r of lv.ramps) gl.push(r);
  for (const car of lv.cars) if (car.x > x0 - 100 && car.x < x1 + 100 && car.y > y0 - 100 && car.y < y1 + 100) gl.push({ kind: 'car', car, by: car.y });
  for (const w of lv.wrecks) gl.push({ kind: 'wreck', w, by: w.y - 30 });
  for (const p of wd.folk) if (!p.gone && p.x > x0 - 30 && p.x < x1 + 30 && p.y > y0 - 30 && p.y < y1 + 30) gl.push({ kind: 'folk', p, by: p.y });
  for (const p of lv.pick) gl.push({ kind: 'pick', p, by: p.y });
  for (const sg of (lv.signs || [])) gl.push({ kind: 'sign', sg, by: sg.y });
  if (L5.has('l5hole')) for (const h of (wd.holes || [])) if (h.x > x0 - 60 && h.x < x1 + 60 && h.y > y0 - 60 && h.y < y1 + 60) gl.push({ kind: 'hole', h, by: h.y - 420 });
  for (const sp of (lv.spikes || [])) { if (sp.state === 'lay') gl.push({ kind: 'spikeStrip', sp, by: sp.strip.y - 200 }); for (const cp of sp.cops) gl.push({ kind: 'spikeCop', cp, by: cp.y }); for (const b of sp.bursts) gl.push({ kind: 'spikeBurst', b, by: b.y + 40 }); }
  for (const tr of (lv.trains || [])) gl.push({ kind: 'train', tr, by: tr.parts && tr.parts[0] ? tr.parts[0].y : 0 });
  gl.sort((a, b) => a.by - b.by);
  for (const o of gl) {
    switch (o.kind) {
      case 'car': o.car.draw(c); if (o.car === lv.pl && lv.mode !== 'dead') lv.drawVova ? lv.drawVova(c) : L5.R.vova(lv, c); break;
      case 'wreck': { const w = o.w; c.save(); c.translate(w.x, w.y); c.rotate(w.ang); c.scale(w.sx || 1, w.sy || 1); if (L5.has(w.sh)) Spr.drawC(c, w.sh, w.fr, 0, 0, 0, 1); c.restore();
        if (w.fire > 0 && L5.has('l5fx')) { const k = Math.min(1, w.fire / 3); c.save(); c.globalAlpha = k; Spr.drawC(c, 'l5fx', 8 + Math.floor(w.t * 10) % 4, w.x - 6, w.y - 12, 0, 1); Spr.drawC(c, 'l5fx', 8 + Math.floor(w.t * 10 + 2) % 4, w.x + 12, w.y - 8, 0, 0.8); c.restore(); } break; }
      case 'folk': L5.drawFolk(c, o.p, t); break;
      case 'train': L5.R.train(c, o.tr); break;
      case 'hole': Spr.drawC(c, 'l5hole', o.h.fr, o.h.x, o.h.y, o.h.rot, 1); break;
      case 'spikeStrip': if (L5.has('l5spike')) { const f = Spr.size('l5spike', 5), st = o.sp.strip; if (f[0]) Spr.drawC(c, 'l5spike', 5, st.x, st.y, st.ang - Math.PI / 2 + Math.PI / 2, st.len / f[0]); } break;
      case 'spikeCop': if (L5.has('l5spike')) Spr.drawC(c, 'l5spike', o.cp.fr, o.cp.x, o.cp.y, o.cp.rot, 0.68); break;
      case 'spikeBurst': if (L5.has('l5spike')) Spr.drawC(c, 'l5spike', 7, o.b.x, o.b.y, 0, 0.6 + o.b.t * 1.6); break;
      case 'sign': break;
      case 'pick': { const p = o.p, b = Math.sin(p.t + t * 4) * 2;
        if (p.kind === 'ammo') Spr.drawC(c, Spr.sheets.seedcan ? 'seedcan' : 'l5dec', Spr.sheets.seedcan ? 0 : 16, p.x, p.y - 4 + b, 0, 1.1);
        else if (L5.has('l5dec')) Spr.drawC(c, 'l5dec', p.kind === 'nitro' ? 13 : 20, p.x, p.y - 4 + b, 0, 1);
        break; }
      default: if (o.kind === 'parked') break; L5.R.prop(c, C, o, t);
    }
  }
  // облако газа, пули
  for (const cl of lv.clouds) {
    const a = Math.min(1, (cl.life - cl.t) / 1.5);
    const sh = L5.has('l5gas') ? 'l5gas' : (L5.has('l5fx') ? 'l5fx' : null); if (!sh) break;
    c.save(); c.globalAlpha = 0.55 * a;
    for (let i = 0; i < 5; i++) { const an = cl.t * 0.5 + i * 1.257, rr2 = cl.r * 0.45; Spr.drawC(c, sh, sh === 'l5gas' ? (i % 4) : 13 + (i % 3), cl.x + Math.cos(an) * rr2, cl.y + Math.sin(an) * rr2 * 0.9, an, cl.r / 55); }
    c.restore();
  }
  if (L5.has('l5dec')) {
    for (const b of lv.bullets) Spr.drawC(c, 'l5dec', 19, b.x, b.y, Math.atan2(b.vy, b.vx), 0.9);
    for (const b of lv.ebullets) Spr.drawC(c, 'l5dec', 21, b.x, b.y, Math.atan2(b.vy, b.vx), 0.8);
  }
  L5.R.drawFx(c); FX.draw(c);
  PM('groundobj');
  // --- возвышающееся: здания, кроны деревьев, головки фонарей — от дальних к ближним
  const el = [];
  for (const b of boxes) el.push({ d: Math.hypot(b.cx - C.x, b.cy - C.y), f: () => L5.R.box(c, C, b, t) });
  for (const o of tall) el.push({ d: Math.hypot(o.x - C.x, o.y - C.y) - 5, f: () => o.kind === 'tree' ? L5.R.tree(c, C, o, t) : L5.R.lamp(c, C, o, t) });
  el.sort((a, b) => b.d - a.d);
  for (const e of el) e.f();
  if (lv.heli) L5.R.heli(c, C, lv.heli, t);
  PM('elevated');
  // --- свет: спрайты l5lights (0 фары, 1 фонарь, 2 красная сирена, 3 синяя, 4 стоп-сигнал)
  if (L5.has('l5lights')) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const LG = (i, x, y, rot, sc, a) => { c.globalAlpha = a; Spr.drawC(c, 'l5lights', i, x, y, rot, sc); };
    for (const o of tall) if (o.kind === 'lamp') { const fl = 0.8 + 0.2 * Math.sin(t * 9 + o.ph) * (Math.sin(t * 0.7 + o.ph) > 0.97 ? 1.6 : 0.3), q = [o.x + 6, o.y - 14]; LG(1, q[0], q[1], 0, 1, 0.8 * fl); }
    for (const car of lv.cars) {
      if (car.x < x0 - 200 || car.x > x1 + 200 || car.y < y0 - 200 || car.y > y1 + 200 || car.parked) continue;
      const ca = Math.cos(car.ang), sa = Math.sin(car.ang);
      if (car.speed > 15 || car.kind === 'player' || car.isMatiz) { const f = Spr.frame('l5lights', 0), hw = f ? f[2] / 4 : 100; const hx = car.x + ca * (car.L / 2 + hw * 0.6 - 8), hy = car.y + sa * (car.L / 2 + hw * 0.6 - 8), off = car.Wd * 0.42; for (const sd of [-1, 1]) LG(0, hx - sa * off * sd, hy + ca * off * sd, car.ang, 0.5, 0.6); }
      const br = car.brk > 0.2 || (car.thr === 0 && car.speed > 40);
      for (const sd of [-1, 1]) LG(4, car.x - ca * car.L / 2 - sa * sd * car.Wd * 0.34, car.y - sa * car.L / 2 + ca * sd * car.Wd * 0.34, 0, br ? 0.5 : 0.22, br ? 0.9 : 0.5);
      if (car.d.siren || car.cop) { const ph = Math.floor((G.t + car.t) * 6) % 2; LG(ph ? 2 : 3, car.x + ca * car.L * 0.05, car.y + sa * car.L * 0.05, 0, 0.55, 0.9); LG(ph ? 3 : 2, car.x - ca * car.L * 0.1, car.y - sa * car.L * 0.1, 0, 0.4, 0.55); }
    }
    c.restore();
  }
  c.restore();
  PM('lights');
  // --- листья на ветру (в координатах экрана)
  if (!_leaves) { _leaves = []; for (let i = 0; i < 26; i++) _leaves.push({ f: i % 8, x: Math.random() * W, y: Math.random() * H, s: 10 + Math.random() * 18, p: Math.random() * 6, col: U.choice(['#e07a18', '#c83a18', '#e8b020', '#a85a10']), r: Math.random() * 6 }); }
  const dt = G.dt || 0.016;
  for (const l of _leaves) { l.x += (l.s * 1.6 + 8) * dt; l.y += (Math.sin(t * 1.5 + l.p) * 14 + 10) * dt; l.r += dt * (1 + l.s * 0.1); if (l.x > W + 6) { l.x = -6; l.y = Math.random() * H; } if (l.y > H + 6) l.y = -6; if (L5.has('l5leaf')) Spr.drawC(c, 'l5leaf', l.f, l.x, l.y, l.r, 0.4 + l.s * 0.006); }
  PM('leaves');
  // --- реплики над головами
  const bl = G.bubbles.filter(b => b.target && b.target.x != null), key = b => (b.target === lv.pl || b.target.cop || b.target.d) ? -1 : Math.hypot(b.target.x - C.x, b.target.y - C.y), keep = new Set(bl.sort((a, b) => key(a) - key(b)).slice(0, 4));
  for (const b of G.bubbles) { if (!keep.has(b)) continue; const tg = b.target; if (!tg || tg.x == null) continue; const sx = (tg.x - C.x) * z + W / 2, sy = (tg.y - C.y) * z + H / 2 - (tg.headH != null ? tg.headH : (tg.kind === 'folk' || tg.kind === 'dog' ? 26 : 30)); if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue; G.drawBubble(c, sx, sy, b.text, { shout: b.shout }); }
};

// Вова с «Осеменителем» на заднем стекле
L5.R.vova = function (lv, c) {
  const pl = lv.pl, f = Spr.frame('l5cars', 11); if (!f) return;
  const fw = f[2] / 2, px = pl.x - Math.cos(pl.ang) * 14, py = pl.y - Math.sin(pl.ang) * 14, ca = Math.cos(lv.aim), sa = Math.sin(lv.aim);
  const rec = lv.firing ? Math.sin(G.t * 60) * 1.6 : 0;
  Spr.drawC(c, 'l5cars', 11, px + ca * (fw / 2 - 6 - rec), py + sa * (fw / 2 - 6 - rec), lv.aim, 1);
};
