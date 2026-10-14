// «Валера: Агент RED» — уровень 7, ФИНАЛ: главный зал. Катсцена из нескольких планов:
//   wide  — общий план зала (afhall.jpg): сцена, экран со слайдами, море голов (толпа со спины, 3 слоя), аплодисменты, дротики, зомби
//   stage — крупный план сцены: Денисы у экрана, потом спецназ на тросах и главарь
//   rear  — задняя часть зала (hrear.jpg): лифт, Валера пробирается сквозь толпу гостей (вид сбоку), прожектор, гости-зомби
//   box   — ложа Господина Икс (вставка поверх общего плана): лицо в тени, механическая кисть перебирает пальцами
// Весь арт — Flow (tools/p7v4/flowH.js -> py tools/l7v5_hall.py -> assets/l7v4/h*.* + js/l7v4_hall_data.js).
(() => {
  const load0 = V4.load;
  V4.load = async function () {
    await load0();
    const f = { hc0: 'hc0.png', hc1: 'hc1.png', hz0: 'hz0.png', hz1: 'hz1.png', hhands: 'hhands.png', hslides: 'hslides.jpg', hmrx: 'hmrx.jpg', hrear: 'hrear.jpg', hguests: 'hguests.png', hzomb: 'hzomb.png', hallscr: 'hallscr.png', hrap: 'hrap.png', hshoot: 'hshoot.png' };
    await Promise.all(Object.entries(f).map(async ([k, n]) => { try { V4.img[k] = await G.loadImage('assets/l7v4/' + n); } catch (e) {} }));
  };
  const HD = () => window.V4_HALL || {};
  const SCR = { wide: [244.5, 148, 151, 93], stage: [176.7, 84.5, 287, 174] };   // экран на сцене (общий план / крупный план)
  const CROP = [303, 205, 674, 379];                                             // крупный план сцены: кусок afhall.jpg (px картинки)
  const LIFT = [58.6, 126.6, 53, 180];                                           // проём лифта на hrear.jpg (лог. px)
  // слои толпы со спины: картинка, масштаб, верх голов, сдвиг, яркость
  const LAYERS = { wide: [['hc1', 0.3, 281, -60, 0.5], ['hc0', 0.38, 293, -150, 0.72], ['hc1', 0.5, 311, -24, 1]], stage: [['hc0', 0.66, 313, -130, 0.8]] };
  const ZOF = { hc0: 'hz0', hc1: 'hz1' };

  // гость зала (вид сбоку): 6 типов, кадры «руки врозь / хлопок»; зомби — тот же тип, 2 кадра шага
  class Guest {
    constructor(i, x, y, hgt, z, br) { Object.assign(this, { i, x, y, x0: x, hgt, z, br, f: 1, t: U.rand(0, 9), clap: false, zomb: false, walk: false, push: 0, headH: hgt, voice: 200 + i * 30 }); }
    update(dt) { this.t += dt; if (this.zomb && this.walk && this.tx != null && Math.abs(this.tx - this.x) > 2) this.x += Math.sign(this.tx - this.x) * 13 * dt; }
    draw(c) {
      const d = HD(), im = this.zomb ? V4.img.hzomb : V4.img.hguests, fr = (this.zomb ? d.hzomb : d.hguests); if (!im || !fr) return;
      const ph = this.zomb ? (this.walk ? Math.floor(this.t * 3) % 2 : 0) : this.clap ? Math.floor(this.t * 7) % 2 : 0, q = fr[this.i + 6 * ph], k = this.hgt / 300;
      const bob = this.clap && !this.zomb ? -Math.abs(Math.sin(this.t * 7)) * 2 : 0;
      c.save(); c.translate(Math.round(this.x + this.push), Math.round(this.y + bob)); c.scale(this.f * k, k);
      if (this.br < 1) c.filter = `brightness(${this.br})`;
      c.drawImage(im, q[0], q[1], q[2], q[3], -q[4], -(q[3] - 2), q[2], q[3]); c.restore();
    }
  }

  // спецназовец финала: съезжает по верёвке (hrap), стоит (спрайт игры), стреляет дротиками (hshoot); верёвка остаётся висеть
  class Tr {
    constructor(x, floor, f, sc, chief, top = 0) {
      Object.assign(this, { x, y: floor, floor, f, sc, chief, top, mode: 'off', rope: 0, t: U.rand(0, 3), z: chief ? 3 : 2, headH: 84 * sc, voice: 150 });
      this.a = new G.Actor(chief ? 'boss4' : 'cmd4', x, floor, f); this.a.scale = sc * (chief ? 169 / 177 : 1); this.a.setAnim('stand');
    }
    setAnim(n) { this.a.setAnim(n); }
    update(dt) { this.t += dt; this.a.x = this.x; this.a.y = this.y; this.a.facing = this.f; this.a.update(dt); }
    draw(c) {
      if (this.mode === 'off') return;
      const d = HD(), R = d.hrap, im = V4.img.hrap, PX = 84.5 * this.sc, k = PX / 430;
      if (R && im && this.rope > 0) { const q = R[4], w = q[1] * k, hh = d.hrapH * k, y1 = this.mode === 'rap' ? this.y - PX * 1.1 : this.rope; for (let y = this.top; y < y1; y += hh) { const h = Math.min(hh, y1 - y); c.drawImage(im, q[0], 0, q[1], h / k, this.x - w / 2, y, w, h); } }
      if (this.mode === 'rap' && R && im) { const q = R[(this.chief ? 2 : 0) + Math.floor(this.t * 5) % 2]; c.save(); c.beginPath(); c.rect(0, this.top, W, this.floor - 3 - this.top); c.clip(); c.translate(this.x, this.y); c.scale(this.f * k, k); c.drawImage(im, q[0], 0, q[1], d.hrapH, -q[2], -q[4], q[1], d.hrapH); c.restore(); }
      else if (this.mode === 'shoot' && d.hshoot && V4.img.hshoot) { const q = d.hshoot[[0, 1, 2, 0, 3, 0][Math.floor(this.t * 9) % 6]], kk = PX / 300; c.save(); c.translate(this.x, this.y); c.scale(this.f * kk, kk); c.drawImage(V4.img.hshoot, q[0], q[1], q[2], q[3], -q[4], -(q[3] - 2), q[2], q[3]); c.restore(); }
      else this.a.draw(c, 0, 0);
    }
  }

  V4.sceneHall = function (level) {
    const Im = V4.img, st = L7.stage(level, { bg: c => draw(c), over: c => over(c) });
    Object.assign(st, { shot: 'wide', sl: 0, slp: 0, slk: 1, deck: [0], deckT: 0, clap: 0, clapK: 0, zk: 0, dark: 0, spot: 0, box: 0, boxT: 0, lift: 1, ropes: [], darts: [], alarm: 0, beam: null });
    const A = { wide: [], stage: [], rear: [] };
    const act = (shot, style, x, y, f, sc, z = 2) => { const a = new G.Actor(style, x, y, f); Object.assign(a, { scale: sc, z }); a.setAnim('stand'); A[shot].push(a); return a; };
    // общий план: Денисы на сцене; крупный план: они же крупно
    const SY = 262, SY2 = 300, KW = 0.62, KS = 1.15;
    const wO = act('wide', 'deniso', 264, SY - 2, 1, KW, 1), wC = act('wide', 'denisch', 378, SY - 2, -1, KW, 1);
    const sO = act('stage', 'deniso', 213, SY2 - 3, 1, KS, 1), sC = act('stage', 'denisch', 431, SY2 - 3, -1, KS, 1);
    const TX = [140, 268, 372, 500];   // верёвки спецназа (крупный план) — мимо трибун
    const sT = TX.map(x => { const t = new Tr(x, SY2, x < 320 ? 1 : -1, KS, false); A.stage.push(t); return t; }), sB = new Tr(320, SY2, 1, KS, true); A.stage.push(sB);
    const wT = TX.map(x => { const t = new Tr(320 + (x - 320) * 0.5, SY + 2, x < 320 ? -1 : 1, KW, false, 100); A.wide.push(t); return t; }), wB = new Tr(320, SY + 2, 1, KW, true, 100); A.wide.push(wB);
    // задняя часть зала: гости тремя рядами, Валера между средним и ближним
    const guests = [];
    const row = (n, x0, dx, y, h, z, br, sh) => { for (let i = 0; i < n; i++) { const g = new Guest((i * 5 + sh) % 6, x0 + i * dx + ((i * 37 + sh * 11) % 9) - 4, y, h * (0.96 + ((i * 13 + sh) % 7) * 0.012), z, br); guests.push(g); A.rear.push(g); } };
    row(15, 196, 31, 322, 104, 1, 0.5, 0); row(13, 182, 37, 336, 118, 2, 0.78, 2); row(10, 205, 50, 376, 142, 5, 1, 4);
    const v = act('rear', 'valera7', 86, 304, 1, 1.3, 3); v.visible = false;
    const cut = (name) => { st.shot = name; st.actors = A[name]; G.bubbles = []; };
    const slide = (...d) => { st.deck = d; st.deckT = 0; if (st.sl !== d[0]) { st.slp = st.sl; st.sl = d[0]; st.slk = 0; } };
    const proxy = (x, y, voice = 220) => ({ x, y, headH: 0, voice });
    const shout = (list, dur = 1.5) => list.forEach(([x, y, t], i) => G.say(proxy(x, y, 180 + i * 40), t, dur));

    // ---------- отрисовка ----------
    const drawSlide = (c, r0) => {
      const q0 = HD().hallscr, stg = st.shot === 'stage', m = q0 && (stg ? [(q0[0] - CROP[0]) * W / CROP[2], (q0[1] - CROP[1]) * H / CROP[3], q0[2] * W / CROP[2], q0[3] * H / CROP[3]] : [q0[0] / 2, q0[1] * H / 714, q0[2] / 2, q0[3] * H / 714]), r = m || r0;
      const im = Im.hslides; if (!im) return; const one = (i, a) => { if (a <= 0) return; c.globalAlpha = a; c.drawImage(im, (i % 3) * 448, Math.floor(i / 3) * 252, 448, 252, r[0], r[1], r[2], r[3]); };
      c.save(); const fl = 0.93 + 0.07 * Math.sin(st.t * 23) * Math.sin(st.t * 7.3);
      if (st.slk < 1) one(st.slp, fl); one(st.sl, fl * st.slk);
      c.globalAlpha = 0.5 * (1 - st.slk) * (st.slk > 0 ? 1 : 0); c.globalCompositeOperation = 'lighter'; c.fillStyle = '#bfe'; if (st.slk < 1) c.fillRect(r[0], r[1], r[2], r[3]);   // вспышка смены слайда
      c.restore();
      if (m && Im.hallscr) c.drawImage(Im.hallscr, m[0], m[1], m[2], m[3]);   // трибуны, микрофоны и рама экрана — поверх картинки
    };
    const drawStrip = (c, key, s, top, off, br, amp) => {   // полоса толпы зеркальной плиткой, волна по столбцам; слева от st.zk*W — зомби
      const d = HD(), q = d[key]; if (!Im[key] || !q) return; const w = q[0] * s, hN = q[1] * s, zq = d[ZOF[key]], bottom = top + hN, SL = 16, zx = st.zk * (W + 60) - 30;
      c.save(); if (br < 1) c.filter = `brightness(${br})`;
      for (let x = 0; x < W; x += SL) {
        const zomb = x < zx, im = zomb ? Im[ZOF[key]] : Im[key], hh = zomb ? zq[1] * s : hN, u = ((x - off) % (2 * w) + 2 * w) % (2 * w), su = (u < w ? u : 2 * w - u) / s;
        const wob = Math.round(Math.sin(st.t * (zomb ? 2.2 : 7) + x * 0.37 + top) * (zomb ? 1.6 : amp));
        const sw = Math.min(SL / s, q[0] - su); if (sw <= 0) continue;
        if (u < w) c.drawImage(im, su, 0, sw, (zomb ? zq[1] : q[1]), x, bottom - hh + wob, SL, hh);
        else { const s0 = Math.max(0, su - SL / s); c.save(); c.translate(x + SL, 0); c.scale(-1, 1); c.drawImage(im, s0, 0, su - s0, (zomb ? zq[1] : q[1]), 0, bottom - hh + wob, SL, hh); c.restore(); }
      }
      c.restore();
    };
    const drawHands = (c, s, top, off, n) => {   // руки-аплодисменты поднимаются из-за голов
      const im = Im.hhands, q = HD().hhands; if (!im || !q || st.clapK <= 0) return; const k = s * 0.3, w = q[0] * k, h = q[1] * k;
      for (let i = 0; i < n; i++) { const x = ((i + 0.5) / n) * W + ((i * 53 + top) % 17) - 8 + off * 0.1, ph = Math.floor(st.t * 8 + i * 1.7) % 2, t = (i * 7 + Math.round(top)) % 6;
        if (x < st.zk * (W + 60) - 30) continue;
        const up = U.clamp(st.clapK * 1.4 - ((i * 31) % 10) * 0.04, 0, 1); c.drawImage(im, t * q[0], ph * q[1], q[0], q[1], x - w / 2, top + h * 0.55 - h * 0.8 * up + Math.sin(st.t * 9 + i) * 1.5, w, h); }
    };
    const drawCrowd = (c, shot) => { for (const [key, s, top, off, br] of LAYERS[shot]) { drawHands(c, s, top, off, Math.round(9 / s * 0.5)); drawStrip(c, key, s, top, off, br * (1 - st.dark * 0.5), st.clapK > 0 ? 1.6 : 0.5); } };
    const beam = (c, lx, ly, tx, ty, a, r = 30) => {   // луч прожектора: световой конус и пятно (свет, не текстура)
      const dx = tx - lx, dy = ty - ly, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(lx, ly, tx, ty); g.addColorStop(0, `rgba(255,244,200,${0.5 * a})`); g.addColorStop(1, `rgba(255,244,200,${0.13 * a})`);
      c.fillStyle = g; c.beginPath(); c.moveTo(lx + nx * 3, ly + ny * 3); c.lineTo(tx + nx * r, ty + ny * r); c.lineTo(tx - nx * r, ty - ny * r); c.lineTo(lx - nx * 3, ly - ny * 3); c.closePath(); c.fill();
      const rg = c.createRadialGradient(tx, ty, 2, tx, ty, r * 1.5); rg.addColorStop(0, `rgba(255,246,210,${0.4 * a})`); rg.addColorStop(1, 'rgba(255,246,210,0)');
      c.fillStyle = rg; c.translate(tx, ty); c.scale(1, 0.42); c.beginPath(); c.arc(0, 0, r * 1.5, 0, 7); c.fill(); c.restore();
    };
    const draw = c => {
      const hall = Im.hall;
      if (st.shot === 'stage') { if (hall) c.drawImage(hall, CROP[0], CROP[1], CROP[2], CROP[3], 0, 0, W, H); drawSlide(c, SCR.stage); }
      else if (st.shot === 'rear') {
        if (Im.hrear) c.drawImage(Im.hrear, -2.5, 0, 645, 360);
        if (st.lift < 1 && Im.liftd4) { const d = Im.liftd4, [x, y, w, h] = LIFT, k = st.lift; c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.drawImage(d, 0, 0, d.width / 2, d.height, x - k * w / 2, y, w / 2, h); c.drawImage(d, d.width / 2, 0, d.width / 2, d.height, x + w / 2 + k * w / 2, y, w / 2, h); c.restore(); }
      }
      else { if (hall) c.drawImage(hall, 0, 0, W, H); drawSlide(c, SCR.wide); }
      if (st.alarm > 0) { c.fillStyle = `rgba(150,0,0,${st.alarm * (0.12 + 0.08 * Math.sin(st.t * 9))})`; c.fillRect(0, 0, W, H); }
    };
    const over = c => {
      if (st.shot !== 'rear') { const q0 = HD().hallscr; if (q0 && Im.hallscr) { if (st.shot === 'stage') c.drawImage(Im.hallscr, (q0[0] - CROP[0]) * W / CROP[2], (q0[1] - CROP[1]) * H / CROP[3], q0[2] * W / CROP[2], q0[3] * H / CROP[3]); else c.drawImage(Im.hallscr, q0[0] / 2, q0[1] * H / 714, q0[2] / 2, q0[3] * H / 714); } }   // Денисы стоят и ходят ЗА трибунами
      if (st.shot !== 'rear') drawCrowd(c, st.shot);
      for (const d of st.darts) { c.save(); c.translate(d.x, d.y); c.rotate(d.a); Spr.draw(c, 'bfx4', 10, 0, 3, 1, { scale: d.s || 0.2 }); c.restore(); }
      if (st.dark > 0) { c.fillStyle = `rgba(0,0,8,${st.dark})`; c.fillRect(0, 0, W, H); }
      if (st.beam && st.spot > 0) { const b = st.beam; beam(c, b.lx, b.ly, b.x, b.y, st.spot * 0.9, b.r); if (st.shot === 'rear' && b.lit) { for (const g of guests) if (Math.abs(g.x - v.x) < 46 && g.z < 5) g.draw(c); v.draw(c, 0, 0); for (const g of guests) if (Math.abs(g.x - v.x) < 46 && g.z >= 5) { c.save(); c.globalAlpha = 0.85; g.draw(c); c.restore(); } } }
      if (st.box > 0 && Im.hmrx) {   // ложа Господина Икс: вставка-кадр
        const q = HD().hmrx, k = st.box, w = 440 * (0.9 + 0.1 * k) * (1 + st.boxT * 0.008), h = w * q[1] / q[0], x = (W - w) / 2, y = 96 + (1 - k) * 20, KF = [[0, 0], [0.9, 1], [1.5, 2], [2.4, 3], [3.5, 2]]; let ki = 0; while (ki < KF.length - 1 && st.boxT >= KF[ki + 1][0]) ki++; const fr = KF[ki][1], fp = ki ? KF[ki - 1][1] : fr, fk = Math.min(1, (st.boxT - KF[ki][0]) / 0.35);
        c.save(); c.globalAlpha = k; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 0, W, H); c.fillStyle = '#07070a'; c.fillRect(x - 5, y - 5, w + 10, h + 10); c.fillStyle = '#6a5222'; c.fillRect(x - 3, y - 3, w + 6, h + 6);
        c.drawImage(Im.hmrx, fp * q[0], 0, q[0], q[1], x, y, w, h); c.globalAlpha = k * fk; c.drawImage(Im.hmrx, fr * q[0], 0, q[0], q[1], x, y, w, h); c.restore();
      }
    };
    st.tick = dt => {
      if (st.slk < 1) st.slk = Math.min(1, st.slk + dt * 3);
      if (st.deck.length > 1) { st.deckT += dt; if (st.deckT > 1.9) { st.deckT = 0; const i = (st.deck.indexOf(st.sl) + 1) % st.deck.length; st.slp = st.sl; st.sl = st.deck[i]; st.slk = 0; } }
      st.clapK = U.approach(st.clapK, st.clap, dt * 3); if (st.box > 0) st.boxT += dt;
      if (st.clap && Math.random() < dt * 9) Sound.play('blip', 500 + Math.random() * 500);
      for (const g of guests) { const d = g.x0 - v.x; const R = st.part ? 58 : 26; g.push = U.approach(g.push, v.visible && !g.zomb && Math.abs(d) < R && (st.part || g.z !== 1) ? Math.sign(d || 1) * (R - Math.abs(d)) * (st.part ? 0.9 : 0.45) : 0, dt * (st.part ? 90 : 40)); }
    };
    const talk = function* (a, who, text, anim = 'talk') { a.setAnim(anim); yield* Scene.say(who, text, a); a.setAnim('stand'); };
    const applause = function* (dur, lines) { st.clap = 1; for (const g of guests) g.clap = true; if (lines) { yield 0.5; shout(lines, dur - 0.4); } yield dur; st.clap = 0; for (const g of guests) g.clap = false; yield 0.3; };

    // ---------- сценарий ----------
    return function* () {
      Music.play('cutscene'); cut('wide'); slide(0);
      st.title = 'Главный зал. Вся элита Выборгска и гости из Столицы'; st.titleY = 30; st.titleSize = 12;
      yield* Scene.tween(1.2, k => { st.fade = 1 - k; st.titleK = k; });
      yield 1.4; st.title = null;
      // 1. Денис О.
      cut('stage'); slide(0, 6, 0);
      yield* talk(sO, 'deniso', 'Жители Выборгска! Вы здесь собрались, чтобы лицезреть главное событие в вашей жизни!');
      cut('wide'); slide(1); wO.setAnim('fist');
      yield* applause(2.6, [[120, 300, 'Да, да!'], [330, 318, 'Вещай, радио Столицы!'], [520, 304, 'Ухх, заживём!']]);
      wO.setAnim('stand');
      // 2. Валера приезжает на лифте
      cut('rear'); st.lift = 0; v.visible = false; yield 0.5;
      Sound.play('bell'); yield 0.3; v.visible = true; Sound.play('door'); yield* Scene.tween(0.8, k => { st.lift = k; });
      yield 0.3; v.setAnim('walk'); yield* Scene.tween(1.1, k => { v.x = U.lerp(86, 150, k); v.y = U.lerp(304, 344, k); v.scale = U.lerp(1.3, 1.5, k); });
      v.setAnim('look'); yield 0.4;
      yield* Scene.say('valera', 'Ничего себе... Тут весь город. И все смотрят этим двоим в рот.', v);
      // 3. Денис Ч.
      cut('stage'); slide(1, 2); sC.setAnim('talk');
      yield* Scene.say('denisch', 'Жители Выборгска! Мы улучшим качество вашей жизни!', sC);
      slide(2); sC.setAnim('rub');
      yield* Scene.say('denisch', 'Наши технологии высосут все соки из жителей этого города!', sC);
      sC.setAnim('stand');
      // 4. Денис О.: завод — Господину Икс
      slide(3, 6);
      yield* talk(sO, 'deniso', 'Завод будет перепрофилирован и станет принадлежать нашему покровителю — Господину Икс!', 'talk');
      sO.setAnim('fist'); sC.setAnim('fist');
      // 5. толпа славит, Валера пробирается
      cut('rear'); v.setAnim('walk'); st.clap = 1; for (const g of guests) g.clap = true;
      shout([[250, 250, 'Слава Господину Икс!'], [470, 262, 'Слава! Слава!']], 2.2);
      yield* Scene.tween(1.6, k => { v.x = U.lerp(150, 236, k); v.y = U.lerp(344, 352, k); });
      G.say(v, 'Разрешите... Пардон, мадам... Подвинься, пузо!', 2);
      yield* Scene.tween(2.6, k => { v.x = U.lerp(236, 352, k); });
      v.setAnim('stand'); yield 0.3;
      // 6. ложа Господина Икс
      cut('wide'); slide(3); st.boxT = 0; wO.setAnim('fist'); wC.setAnim('fist');
      shout([[150, 300, 'Слава Господину Икс!'], [480, 310, 'Сла-ва! Сла-ва!']], 1.6); yield 1.2;
      Sound.play('lever'); yield* Scene.tween(0.5, k => { st.box = k; });
      st.clap = 0; for (const g of guests) g.clap = false;
      yield 2.6;
      yield* Scene.say('mrx', 'Не нужно благодарности. Всё ради общества.', null);
      yield* Scene.tween(0.4, k => { st.box = 1 - k; });
      wO.setAnim('stand'); wC.setAnim('stand');
      // 7. сюрприз и прожектор
      cut('stage'); slide(4); sO.setAnim('stand');
      yield* talk(sC, 'denisch', 'А сейчас — сюрприз!', 'point');
      cut('wide'); slide(5); Sound.play('lever');
      st.beam = { lx: 320, ly: 96, x: 120, y: 300 };
      yield* Scene.tween(0.5, k => { st.dark = k * 0.6; st.spot = k; });
      yield* Scene.tween(0.9, k => { st.beam.x = U.lerp(120, 560, k); st.beam.y = 300 + Math.sin(k * 3.1) * 26; });
      yield* Scene.tween(0.8, k => { st.beam.x = U.lerp(560, 392, k); st.beam.y = U.lerp(300, 326, k); });
      yield 0.3;
      cut('rear'); st.beam = { lx: 660, ly: -60, x: v.x, y: v.y - 4, lit: true, r: 46 }; st.part = 1; st.dark = 0.62; st.spot = 1; Sound.play('zap');
      for (const g of guests) if (Math.abs(g.x - v.x) < 90) g.f = Math.sign(v.x - g.x) || 1;
      v.setAnim('dazed'); yield 0.9;
      cut('stage'); st.dark = 0; st.spot = 0; slide(5, 6);
      yield* talk(sO, 'deniso', 'Вот он — Агент Ред!', 'point');
      slide(6); sO.setAnim('talk');
      yield* Scene.say('deniso', 'Мы избавим ваш город от таких парней. Вы все будете одинаковые, послушные и подкупные!', sO);
      sO.setAnim('stand');
      // 8. ответ Валеры
      cut('rear'); st.dark = 0.62; st.spot = 1; v.setAnim('shoutFist'); slide(7);
      yield* Scene.say('valera', 'Это мой город и мои правила! Вы меня не победите!', v);
      yield* Scene.say('valera', 'Туалетная бумага больше не подорожает! Я буду сражаться!', v);
      v.setAnim('stand');
      // 9. Денисы уходят в тень, на сцену спускается спецназ
      cut('stage'); st.dark = 0; st.spot = 0; slide(7); sO.setAnim('scared'); sC.setAnim('scared'); yield 0.7;
      sO.facing = -1; sC.facing = 1; sO.setAnim('walk'); sC.setAnim('walk');
      yield* Scene.tween(2.4, k => { sO.x = U.lerp(213, 96, k); sC.x = U.lerp(431, 548, k); const a = U.clamp(1.5 - k * 1.6, 0, 1); sO.alpha = sC.alpha = a; });
      sO.visible = sC.visible = wO.visible = wC.visible = false;
      slide(8); Music.play('alarm'); Sound.play('warn');
      const squad = sT.concat([sB]);
      squad.forEach(t => { t.mode = 'rap'; t.rope = 1; t.y = -40; });
      yield* Scene.tween(1.5, k => { const q = k * (2 - k); squad.forEach((t, i) => { t.y = U.lerp(-40 - i * 26, SY2, Math.min(1, q * (1 + (4 - i) * 0.06))); }); st.alarm = k; });
      G.shake(5, 0.3); Sound.play('land'); squad.forEach(t => { t.y = SY2; t.mode = 'stand'; t.rope = SY2 - 10; }); sB.setAnim('land'); sT.forEach(t => t.setAnim('alert')); yield 0.45;
      sB.setAnim('point');
      yield* Scene.say('cmdr7', 'ВЗЯТЬ ЕГО!!!', sB);
      sT.forEach(t => { t.mode = 'shoot'; t.f = t.x < 320 ? -1 : 1; });
      { let acc = 0; yield* Scene.tween(1.3, k => { acc += G.dt; if (acc > 0.09) { acc = 0; Sound.play('shot'); const t = U.choice(sT), tx = t.x + t.f * U.rand(60, 200), ty = 380; st.darts.push({ x0: t.x + t.f * 40, y0: t.y - 62, x1: tx, y1: ty, t: 0, x: t.x, y: t.y - 62, a: Math.atan2(ty - t.y + 62, tx - t.x - t.f * 40), s: 0.34 }); }
        for (const d of st.darts) { d.t += G.dt / 0.2; d.x = U.lerp(d.x0, d.x1, d.t); d.y = U.lerp(d.y0, d.y1, d.t); } st.darts = st.darts.filter(d => d.t < 1); }); st.darts = []; }
      // 10. дротики в зал: толпа превращается в зомби
      cut('wide'); wT.forEach(t => { t.mode = 'shoot'; t.rope = SY - 4; }); wB.mode = 'stand'; wB.rope = SY - 4; wB.setAnim('point');
      {
        let acc = 0, T = 3.2;
        yield* Scene.tween(T, k => {
          st.zk = Math.max(0, (k - 0.12) / 0.88); acc += G.dt;
          if (acc > 0.07) { acc = 0; Sound.play('shot'); const t = U.choice(wT), tx = U.clamp(st.zk * W + U.rand(-10, 70), 6, W - 6), ty = U.rand(292, 340); st.darts.push({ x0: t.x, y0: t.y - 30, x1: tx, y1: ty, t: 0, x: t.x, y: t.y - 30, a: Math.atan2(ty - t.y + 30, tx - t.x) }); }
          for (const d of st.darts) { d.t += G.dt / 0.22; d.x = U.lerp(d.x0, d.x1, d.t); d.y = U.lerp(d.y0, d.y1, d.t); if (d.t >= 1 && !d.hit) { d.hit = 1; FX.burst(d.x, d.y, 5, { colors: ['#8cf08c', '#3a8a3a', '#c8ffb0'], speed: 70, life: 0.45, grav: -40 }); } }
          st.darts = st.darts.filter(d => d.t < 1);
        });
        st.darts = []; st.zk = 1;
      }
      shout([[130, 300, 'Бюдже-е-ет...'], [340, 312, 'Отка-а-аты...'], [530, 300, 'Мозги-и-и...']], 1.6); yield 1.5;
      // 11. вокруг Валеры
      cut('rear'); st.dark = 0.3; st.spot = 0; st.beam = null; v.setAnim('look');
      {
        const near = guests.slice().sort((a, b) => Math.abs(b.x - v.x) - Math.abs(a.x - v.x));   // сначала дальние, потом ближние
        for (let i = 0; i < near.length; i++) {
          const g = near[i], d = { x: 660, y: U.rand(40, 120), a: 0, s: 0.3 }, tx = g.x, ty = g.y - g.hgt * 0.8; d.a = Math.atan2(ty - d.y, tx - d.x); st.darts = [d]; if (i % 2 === 0) Sound.play('shot');
          const x0 = d.x, y0 = d.y; yield* Scene.tween(0.07, k => { d.x = U.lerp(x0, tx, k); d.y = U.lerp(y0, ty, k); });
          st.darts = []; FX.burst(tx, ty, 6, { colors: ['#8cf08c', '#3a8a3a', '#c8ffb0'], speed: 90, life: 0.4, grav: -30 });
          g.zomb = true; g.clap = false; g.f = Math.sign(v.x - g.x) || 1; g.x += g.push; g.x0 = g.x; g.push = 0; g.t = U.rand(0, 3);
          if (i === 12) G.say(v, 'Эй, вы чего?!', 1.2);
        }
      }
      yield 0.4;
      for (const g of guests) { g.walk = true; g.tx = v.x - g.f * (g.z >= 5 ? 74 + (g.i * 9) % 30 : 40 + (g.i * 7) % 24); }
      shout([[v.x - 120, 240, 'Откаты-ы-ы...'], [v.x + 130, 250, 'Мозги-и-и...']], 1.8);
      v.setAnim('shoutFist');
      yield* Scene.say('valera', 'Ну всё, бомонд... Сами напросились!', v);
      yield 0.8;
      st.title = 'КОНЕЦ УРОВНЯ 7'; st.titleY = H / 2 - 40; st.titleSize = 24; st.titleK = 0;
      yield* Scene.tween(0.6, k => { st.titleK = k; }); Sound.play('sting'); yield 1.8;
      yield* Scene.tween(0.6, k => { st.fade = k; });
    };
  };
})();
