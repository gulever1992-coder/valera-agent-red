// Уровень 10: кинокатсцены — «анимация из картинок» (Flow), НЕ видео. Шот = фон-план + камера (наезд/панорама/наклон)
// + покадровые слои (листы Flow и спрайты прошлых уровней) + дождь/молнии/тряска/кинорамка + реплики. Раскадровка: L10_STORYBOARD.md.
(() => {
  const S = L10.spr, S9 = L9.spr, clamp = L10.clamp, rnd = L10.rnd, lerp = L10.lerp, ease = L10.ease;
  const SP = (c, sh, i, x, y, f = 1, sc = 1) => Spr.draw(c, sh, i, x, y, f, { scale: sc });     // спрайты ур.1–8
  const fr = (t, fps, n) => ((t * fps) | 0) % n;
  const H = (c, sh, f, x, y, h, o = {}) => { const z = L10.size(sh, f)[1]; if (z) S(c, sh, f, x, y, h / z, o); };     // персонаж высотой h px

  // ---------- движок ----------
  L10.Cine = (name, shots, o = {}) => {
    const P = {
      noHud: true, cine: true, deathText: '',
      start(lv) { P.lv = lv; P.i = 0; P.t = 0; P.hp = 100; P.inv = 0; P.W = new L10.Weather(230); P.fx = []; P.sub = null; P.flash = 0; P.fade = 0; P.shake = 0; if (o.music) try { Music.play(o.music); } catch (e) {} P.enter(); },
      enter() { const s = shots[P.i]; P.t = 0; P.st = {}; if (s && s.on) s.on(P.st, P); },
      update(lv, dt) {
        const I = G.Input;
        if (I.pressed('pause') || I.pressed('start')) { P.i = shots.length; }
        const s = shots[P.i]; if (!s) { lv.next(); return; }
        P.t += dt; P.W.update(dt, s.storm || 1); P.flash = Math.max(0, P.flash - dt * 2.2); P.shake = Math.max(0, P.shake - dt * 6);
        if (s.up) s.up(P.st, P.t, dt, P);
        for (const f of P.fx) { f.t += dt; if (f.vx != null) { f.x += f.vx * dt; f.vy += (f.g ?? 600) * dt; f.y += f.vy * dt; } } P.fx = P.fx.filter(f => f.t < f.life);
        if (s.lines) for (const L of s.lines) if (P.t >= L[0] && !L.shown) { L.shown = 1; P.sub = { who: L[1], text: L[2], t: 0, d: L[3] || 3.2 }; Sound.play('blip', WHO[L[1]] ? WHO[L[1]].voice : 90); }
        if (P.sub) { P.sub.t += dt; if (P.sub.t > P.sub.d) P.sub = null; }
        if (s.sfx) for (const q of s.sfx) if (P.t >= q[0] && !q.done) { q.done = 1; Sound.play(q[1], q[2] ?? 1); if (q[3]) G.shake(q[3], q[4] || 0.4); if (q[5]) P.flash = q[5]; }
        if (P.t >= s.d) { P.i++; P.sub = null; for (const L of (shots[P.i] || {}).lines || []) L.shown = 0; for (const q of (shots[P.i] || {}).sfx || []) q.done = 0; P.enter(); }
      },
      draw(lv, c) {
        const s = shots[P.i]; c.fillStyle = '#000'; c.fillRect(0, 0, 640, 360); if (!s) return;
        const k = clamp(P.t / s.d, 0, 1), e = s.lin ? k : ease(k), cm = s.cam || [320, 180, 1, 320, 180, 1];
        const z = Math.max(1, lerp(cm[2], cm[5], e)), cx = clamp(lerp(cm[0], cm[3], e), 320 / z, 640 - 320 / z), cy = clamp(lerp(cm[1], cm[4], e), 180 / z, 360 - 180 / z);     // камера не выходит за край фона
        const sh = (s.shake ? s.shake(P.t) : 0) + P.shake * 4 + (G.shakeAmt || 0) * 0;
        c.save(); c.translate(320 + rnd(-sh, sh), 180 + rnd(-sh, sh)); c.scale(z, z); c.translate(-cx, -cy);
        if (s.plate) { const im = L10.img[s.plate]; if (im) { c.imageSmoothingEnabled = true; c.drawImage(im, 0, 0, 640, 360); c.imageSmoothingEnabled = false; } }
        if (s.plate === 'cpShore') P_far(c, P.t);
        if (s.draw) s.draw(c, P.t, P.st, P);
        for (const f of P.fx) P.drawFx(c, f);
        c.restore();
        if (s.over) s.over(c, P.t, P.st, P);
        if (s.rain !== false) { P.W.draw(c, s.rainA ?? 1); }
        if (P.flash > 0) { c.fillStyle = `rgba(255,255,255,${P.flash})`; c.fillRect(0, 0, 640, 360); }
        // кинорамка
        c.fillStyle = '#000'; c.fillRect(0, 0, 640, 26); c.fillRect(0, 334, 640, 26);
        // затемнение на склейках
        const fi = clamp(P.t / 0.25, 0, 1), fo = clamp((s.d - P.t) / 0.25, 0, 1), a = 1 - Math.min(fi, s.cutOut === false ? 1 : fo);
        if (a > 0 && !s.hard) { c.fillStyle = `rgba(0,0,0,${a})`; c.fillRect(0, 0, 640, 360); }
        if (P.sub) P.drawSub(c, P.sub);
        if (s.title) s.title(c, P.t);
        if (P.i === 0 && P.t < 3) G.text('ESC — ПРОПУСТИТЬ', 632, 340, { align: 'right', size: 8, color: '#666' });
      },
      drawSub(c, d) {
        const w = WHO[d.who] || { name: d.who, color: '#fff' }, a = clamp(Math.min(d.t, d.d - d.t) / 0.2, 0, 1); c.globalAlpha = a;
        c.fillStyle = 'rgba(8,10,14,0.88)'; c.fillRect(70, 272, 500, 58); c.fillStyle = w.color || '#f06a14'; c.fillRect(70, 272, 500, 2);
        if (G.portraits && G.portraits[d.who]) G.drawPortrait(c, d.who, 76, 276, (d.t * 6 | 0) % 2 === 0 && d.t < d.d - 0.6);
        const tx = G.portraits && G.portraits[d.who] ? 146 : 82;
        G.text(w.name, tx, 278, { size: 8, color: w.color || '#ffb070' });
        G.wrap(d.text.slice(0, Math.floor(d.t * 40)), 560 - tx, 8).slice(0, 3).forEach((l, i) => G.text(l, tx, 294 + i * 12, { size: 8, color: '#f4f0e4' }));
        c.globalAlpha = 1;
      },
      drawFx(c, f) {
        const k = f.t / f.life;
        if (f.k === 'deb' && L10.has('deb10')) S(c, 'deb10', f.fr, f.x, f.y, f.s, { rot: f.r * f.t });
        else if (f.k === 'boom' && L10.has('boom10')) S(c, 'boom10', 'b' + Math.min(3, (k * 4) | 0), f.x, f.y, f.s, { add: 1 });
        else if (f.k === 'nuke' && L10.has('boom10')) S(c, 'boom10', 'n' + Math.min(3, (k * 4) | 0), f.x, f.y, f.s, { add: 1 });
        else if (f.k === 'spark' && L10.has('fx10')) S(c, 'fx10', 'flash', f.x, f.y, f.s || 0.1, { add: 1, a: 1 - k });
        else if (f.k === 'splash' && L10.has('fx10')) S(c, 'fx10', 'splash', f.x, f.y, f.s || 0.4, f.soft ? { a: 0.6 * (1 - k) } : { add: 1, a: 1 - k });
        else if (f.k === 'glass') { c.fillStyle = `rgba(160,220,170,${1 - k})`; c.fillRect(f.x, f.y, 2, 2); }
      },
      boom(x, y, s = 0.6) { P.fx.push({ k: 'boom', x, y, s, t: 0, life: 0.7 }); },
      debris(x, y, n = 8, sp = 1) { for (let i = 0; i < n; i++) P.fx.push({ k: 'deb', fr: 'd' + ((Math.random() * 12) | 0), x: x + rnd(-30, 30), y: y + rnd(-10, 10), vx: rnd(-160, 160) * sp, vy: rnd(-420, -120) * sp, r: rnd(-5, 5), s: rnd(0.2, 0.45), t: 0, life: 2.2 }); },
    };
    return P;
  };
  // затемнение «тень накрывает» — волна темноты справа налево
  const shadow = (c, p, a = 0.75) => { const x = 640 - p * 900; const g = c.createLinearGradient(x, 0, x + 260, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,6,${a})`); c.fillStyle = g; c.fillRect(Math.max(0, x), 0, 640 - Math.max(0, x) + 2, 360); if (x + 260 < 640) { c.fillStyle = `rgba(0,0,6,${a})`; c.fillRect(Math.max(0, x + 260), 0, 640, 360); } };
  // тень сверху вниз (Семён заслоняет небо)
  const shadowDown = (c, p, a = 0.6) => { const y = -260 + p * 620; const g = c.createLinearGradient(0, y, 0, y + 260); g.addColorStop(0, `rgba(0,0,6,${a})`); g.addColorStop(1, 'rgba(0,0,6,0)'); if (y > 0) { c.fillStyle = `rgba(0,0,6,${a})`; c.fillRect(0, 0, 640, y); } c.fillStyle = g; c.fillRect(0, Math.max(0, y), 640, 260 + Math.min(0, y)); };
  const title = (txt, sub) => (c, t) => { const a = clamp(t / 0.5, 0, 1); c.globalAlpha = a; G.text(txt, 320, 150, { align: 'center', size: 24, color: '#ff4040', outline: true }); if (sub) G.text(sub, 320, 190, { align: 'center', size: 8, color: '#ffd84a', outline: true }); c.globalAlpha = 1; };

  // ================= ИНТРО =================
  L10.PARTS.intro = L10.Cine('intro', [
    // владелец: 1 бомж на скамейке с водкой -> 2 запрокинул голову, пьёт, тень накрывает сверху вниз -> 3 бутылка бьётся -> 4 испуганный взгляд крупно
    { d: 3.4, plate: 'in1', cam: [320, 185, 1.0, 330, 200, 1.12], rain: true, rainA: 0.35 },
    { d: 3.0, plate: 'in2', cam: [330, 190, 1.08, 345, 180, 1.2], rain: true, rainA: 0.4, sfx: [[1.4, 'warn', 0.4]],
      over(c, t) { if (t > 1.0) shadowDown(c, clamp((t - 1.0) / 1.6, 0, 1), 0.6); } },
    { d: 1.9, plate: 'in3', cam: [320, 200, 1.12, 320, 205, 1.0], hard: true, rain: true, rainA: 0.4, shake: t => t < 0.4 ? 2 : 0.4, sfx: [[0.05, 'glass', 1, 3, 0.25]],
      over(c) { shadowDown(c, 1, 0.45); } },
    { d: 2.2, plate: 'in4', cam: [320, 180, 1.0, 320, 170, 1.1], hard: true, rain: true, rainA: 0.5, shake: t => 1.2, sfx: [[0.05, 'stomp', 0.5, 2]],
      over(c, t) { shadowDown(c, 1, 0.4 + 0.1 * Math.min(1, t)); } },
    { d: 4.6, plate: 'cpAlley', cam: [300, 200, 1.15, 360, 190, 1.05], sfx: [[2.4, 'stomp', 0.6, 3]],
      draw(c, t) { const lk = t > 2.6; H(c, 'chGop', lk ? 'n2' : t % 0.6 < 0.3 ? 'n0' : 'n1', 360, 300, 80); H(c, 'chGop', lk ? 'g2' : t % 0.6 < 0.3 ? 'g0' : 'g1', 300, 300, 118); H(c, 'chGop', lk ? 'g2' : t % 0.7 < 0.35 ? 'g1' : 'g0', 420, 300, 118, { flip: true }); },
      over(c, t) { if (t > 2.2) shadowDown(c, clamp((t - 2.2) / 1.4, 0, 1), 0.55); } },     // тень на гопников сверху вниз
    // владелец: стриптиз убран; улица сразу в тени — алкаши, бомжи, гопники, девицы в панике разбегаются в разные стороны
    { d: 4.0, plate: 'cpStreet', cam: [320, 200, 1.1, 320, 200, 1.18], shake: t => 1.5 + t, sfx: [[0.2, 'shout', 0.6], [2.2, 'shout', 0.5]],
      draw(c, t) {
        // [лист, первый кадр, масштаб, x старта, направление, глубина 0..1, задержка]
        const R = [['l5walkA', 4, 1.0, 120, 1, 0.2, 0.0], ['l5walkB1', 0, 0.84, 520, -1, 0.1, 0.1], ['l5walkA', 0, 1.0, 330, -1, 0.5, 0.25], ['l5walkB2', 0, 0.8, 200, 1, 0.35, 0.4],
          ['l5walkA', 8, 1.0, 470, -1, 0.75, 0.05], ['l5walkB2', 4, 0.82, 60, 1, 0.9, 0.3], ['l5walkA', 12, 1.0, 600, -1, 0.6, 0.5], ['l5walkB1', 4, 0.84, 260, 1, 0.65, 0.15],
          ['l5walkA', 4, 1.0, 420, 1, 1.0, 0.6], ['l5walkA', 0, 1.0, 380, -1, 0.0, 0.7]];
        R.slice().sort((a, b) => a[5] - b[5]).forEach(([sh, f0, sc, x0, d, z, o]) => {
          const tt = Math.max(0, t - o), k = 0.82 + z * 0.3, x = x0 + d * tt * (150 + z * 70), wob = Math.abs(Math.sin((tt + o) * 11)) * -4;
          SP(c, sh, f0 + fr(tt + o, 14, 4), x, 282 + z * 34 + wob, d, sc * k);     // все листы смотрят вправо
        });
      },
      over(c, t) { shadowDown(c, 1, 0.5); c.fillStyle = `rgba(255,255,255,${Math.random() < 0.04 ? 0.18 : 0})`; c.fillRect(0, 0, 640, 360); } },
    // владелец (наброски): 1 — строго сбоку: бушующее небо, море, набережная, крыша; слева надстройка; Валера с плазмоганом за спиной бежит в ужасе
    { d: 4.6, plate: null, rain: true, shake: t => 0.6 + (t % 1.1 < 0.15 ? 3 : 0), sfx: [[0.4, 'stomp', 0.6, 3], [1.5, 'stomp', 0.7, 4], [2.6, 'stomp', 0.8, 5], [3.7, 'stomp', 0.9, 6], [2.0, 'crumble', 0.5, 2]],
      on(st, P) { st.storm = L10.makeStorm(P.W, { seaY: 168, seaH: 120, shipZ: 40, ships: 6 }); },
      draw(c, t, st, P) { runSet(c, t, st, P); } },
    // 2 — зловещий завод: дрожит, крыша взрывается, из крыши вылезает яростный Семён
    { d: 2.4, plate: 'rsf0', cam: [320, 190, 1.0, 320, 180, 1.06], lin: true, shake: t => t > 1.2 ? 1 + (t - 1.2) * 2 : 0.3, sfx: [[0.3, 'stomp', 0.7, 4], [1.3, 'stomp', 0.9, 6], [2.0, 'crumble', 0.8, 3]] },
    { d: 1.5, plate: 'rsf1', cam: [320, 175, 1.12, 320, 170, 1.04], hard: true, shake: t => 7 - t * 3, sfx: [[0.02, 'boom', 1, 12, 0.6], [0.3, 'crumble', 1, 3]],
      on(st, P) { P.flash = 0.8; P.debris(320, 70, 18, 1.4); } },
    { d: 2.0, plate: 'rsf2', cam: [320, 175, 1.04, 320, 165, 1.1], hard: true, shake: t => 3, sfx: [[0.1, 'stomp', 1, 7], [1.2, 'crumble', 0.8, 3]],
      draw(c, t, st, P) { if (Math.random() < 0.25) P.debris(rnd(200, 440), 80, 1, 0.9); } },
    { d: 3.0, plate: 'rsf3', cam: [320, 170, 1.0, 320, 140, 1.22], hard: true, shake: t => t < 0.3 ? 2 : 5, sfx: [[0.15, 'boom', 1, 12, 0.6], [0.2, 'zap', 1]],
      on(st, P) { P.flash = 0.5; },
      draw(c, t, st, P) { if (Math.random() < 0.3) P.debris(rnd(180, 460), 90, 1, 1); } },
    { d: 2.2, plate: null, rain: true, hard: true, title: title('ФИНАЛ', 'БЕГИ! СЕМЁН РУШИТ ВСЁ ПОЗАДИ'), on(st, P) { st.storm = L10.makeStorm(P.W, { seaY: 168, seaH: 120, shipZ: 40, ships: 6 }); }, draw(c, t, st, P) { runSet(c, t + 4.6, st, P); }, over(c) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 0, 640, 360); } },
  ], { music: 'cutscene' });

  // ================= ДЖЕТПАК СЛОМАН -> МОРЕ =================
  L10.PARTS.mid = L10.Cine('mid', [
    { d: 3.4, plate: 'bg2', cam: [330, 170, 1.2, 330, 170, 1.4], sfx: [[1.2, 'crash', 1, 6], [1.3, 'zap', 0.8]],
      on(st) { st.B = new L10.Boss(2, { H: 700, x: 560, y: 700 }); st.B.setPose('roar'); },
      up(st, t, dt, P) { st.B.update(dt); if (t > 1.2 && t < 2.4 && Math.random() < 0.5) P.fx.push({ k: 'spark', x: 300 + rnd(-30, 30), y: 170 + rnd(-30, 30), t: 0, life: 0.2, s: 0.12 }); },
      draw(c, t, st) { st.B.draw(c); S(c, 'vJet10', 'grab', 300, 175, 0.5); S(c, 'tent10', 'coil', 300, 190, 0.5); if (t > 0.6) S(c, 'arm10', t < 1.2 ? 'a0' : 'a1', 330, lerp(-60, 120, clamp((t - 0.6) / 0.6, 0, 1)), 0.5, { flip: true }); } },
    { d: 3, plate: 'bg3', cam: [320, 120, 1.0, 320, 240, 1.0], sfx: [[0.2, 'shout', 0.7]],
      draw(c, t, st, P) { const y = -40 + t * t * 60, x = 300 + t * 20; S(c, 'vSea10', 'fall', x, y + 40, 0.42, { rot: t * 2 }); if (Math.random() < 0.4) P.fx.push({ k: 'deb', fr: 'd' + ((Math.random() * 12) | 0), x: x + rnd(-40, 40), y: y - 30, vx: rnd(-40, 40), vy: 50, r: 2, s: 0.18, t: 0, life: 1.4 }); } },
    { d: 1.6, plate: 'bg3', cam: [320, 250, 1.6, 320, 250, 1.6], sfx: [[0.1, 'splash', 1, 4]],
      on(st, P) { P.fx.push({ k: 'splash', x: 320, y: 255, s: 1.0, t: 0, life: 1.2 }); } },
    { d: 4.4, plate: 'bg3', cam: [320, 230, 1.3, 330, 220, 1.2], sfx: [[2.2, 'splash', 0.5]],
      draw(c, t) { L10.bgTile(c, 'water10', t * 60, 1, 250, 120); S(c, 'raft10', 'raft0', 330 + t * 10, 270, 0.6); const f = t < 2.2 ? (((t * 3) | 0) % 2 ? 'swim0' : 'swim1') : t < 3.2 ? 'climb0' : 'climb1'; S(c, 'vSea10', f, t < 2.2 ? 230 + t * 40 : 330 + t * 10, t < 2.2 ? 280 : 258, 0.42); } },
    { d: 4.2, plate: 'bg3', cam: [320, 220, 1.1, 330, 175, 1.0], sfx: [[0.4, 'splash', 1, 8], [1.6, 'stomp', 1, 10], [1.8, 'zap', 1, 0, 0, 0.6]],
      on(st) { st.B = new L10.Boss(3, { H: 300, x: 380, y: 300 }); st.B.setPose('raise'); },
      up(st, t, dt, P) { st.B.update(dt); st.B.y = lerp(560, 300, ease(clamp(t / 1.4, 0, 1))); if (t > 1.6) st.B.setPose('roar'); if (t < 1.4 && Math.random() < dt * 8) P.fx.push({ k: 'splash', x: rnd(260, 500), y: 300, s: 0.5, t: 0, life: 0.6, soft: 1 }); },
      draw(c, t, st) { st.B.draw(c); L10.bgTile(c, 'water10', t * 60, 1, 280, 100); S(c, 'raft10', 'raft0', 160, 300, 0.6); S(c, 'vSea10', 'aim', 160, 284, 0.42); } },
    { d: 3.4, plate: 'cpScope', cam: [320, 180, 1.0, 322, 182, 1.06], rain: false, sfx: [[0.2, 'steam', 0.4]] },
    { d: 8, plate: 'cpSub', cam: [320, 190, 1.1, 320, 190, 1.2], rain: false,
      lines: [[0.4, 'sub1', 'Товарищ капитан... Оно размером с завод! Что это?!', 3.2], [3.8, 'sub2', 'Не знаю. Готовьте шахты. Если штаб даст добро — бьём ядерным.', 3.8]],
      draw(c, t) { H(c, 'chSub', t < 3.6 ? (t < 1 ? 'sb0' : 'sb1') : 'sb2', t < 3.6 ? 220 : 430, 340, 260); if (t > 3.6) H(c, 'chSub', t < 6.5 ? 'sb2' : 'sb3', 430, 340, 260); if (t > 3.6) H(c, 'chSub', 'sb1', 200, 340, 260); c.fillStyle = `rgba(255,0,0,${0.08 + 0.06 * Math.sin(t * 4)})`; c.fillRect(0, 0, 640, 360); } },
    { d: 2, plate: 'bg3', hard: true, draw(c) { c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, 640, 360); }, title: title('ФАЗА 3', 'ВЗОРВИ СТАНЦИИ И ДЕРЖИСЬ НА ПЛОТАХ') },
  ], { music: 'cutscene' });

  // ================= ЯДЕРНЫЙ ФИНАЛ =================
  L10.PARTS.nuke = L10.Cine('nuke', [
    { d: 3.4, plate: 'bg3', cam: [360, 190, 1.2, 380, 210, 1.3], sfx: [[0.5, 'stomp', 0.5, 2]],
      on(st) { st.B = new L10.Boss(3, { H: 300, x: 400, y: 300 }); st.B.setPose(L10.fr('sem3', 'tired') ? 'tired' : 'idle'); },
      up(st, t, dt) { st.B.update(dt); st.B.y = 300 + t * 6; },
      draw(c, t, st) { c.save(); c.translate(400, 300); c.rotate(-0.08 * Math.min(1, t)); c.translate(-400, -300); st.B.draw(c); c.restore(); L10.bgTile(c, 'water10', t * 40, 1, 280, 100); } },
    { d: 4, plate: 'bg3', cam: [300, 220, 1.4, 300, 160, 1.2], sfx: [[0.6, 'crane', 1, 3], [1.4, 'crane', 1, 3], [2.2, 'crane', 1, 3]],
      draw(c, t) { for (let i = 0; i < 3; i++) { const x = 120 + i * 180; S(c, 'sub10', t > 0.5 + i * 0.8 ? 'subFire' : 'subOpen', x, 280, 0.32); for (let j = 0; j < 3; j++) { const tt = t - 0.6 - i * 0.8 - j * 0.3; if (tt > 0) S(c, 'sub10', 'missile', x + 10, 250 - tt * tt * 260, 0.16); } } L10.bgTile(c, 'water10', t * 30, 1, 280, 100); } },
    { d: 4.4, plate: 'bg3', cam: [380, 170, 1.0, 380, 170, 1.1], shake: t => t > 1.4 ? 6 : 0,
      on(st) { st.B = new L10.Boss(3, { H: 300, x: 400, y: 312 }); st.B.setPose(L10.fr('sem3', 'hit') ? 'hit' : 'roar'); st.n = 0; },
      up(st, t, dt, P) { st.B.update(dt); if (t > 1.2 && t < 3.8 && (st.n += dt) > 0.12) { st.n = 0; P.boom(rnd(300, 500), rnd(60, 260), rnd(0.6, 1.1)); Sound.play('boom', 0.5); } if (t > 3.6) P.flash = Math.min(1, P.flash + dt * 3); },
      draw(c, t, st) { st.B.draw(c); for (let i = 0; i < 10; i++) { const tt = t - i * 0.15; if (tt > 0 && tt < 1.3) S(c, 'sub10', 'warhead', 300 + i * 22, -40 + tt * 260, 0.14); } L10.bgTile(c, 'water10', t * 40, 1, 280, 100); } },
    { d: 5.5, plate: 'cpNuke', cam: [320, 180, 1.0, 320, 170, 1.08], hard: true, shake: t => t < 1.5 ? 4 : 1, sfx: [[0.1, 'boom', 1, 8, 1]],
      on(st, P) { P.fx.push({ k: 'nuke', x: 330, y: 150, s: 0.7, t: 0, life: 5 }); } },
    { d: 2.6, plate: 'cpNuke', cam: [320, 170, 1.08, 320, 166, 1.1], hard: true, draw(c) { c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, 640, 360); }, title: title('СЕМЁН ПОБЕЖДЁН') },
  ], { music: 'cutscene' });

  // ================= ФИНАЛ ИГРЫ =================
  L10.PARTS.outro = L10.Cine('outro', [
    { d: 5.5, plate: 'cpShore', cam: [260, 250, 1.4, 320, 240, 1.25],
      draw(c, t) { const x = 80 + t * 40; S(c, 'raft10', 'raft1', x, 300, 0.5); S(c, 'vSea10', 'ko', x, 288, 0.42); } },
    { d: 4.2, plate: 'cpShore', cam: [300, 240, 1.3, 300, 240, 1.3],
      draw(c, t) { S(c, 'raft10', 'raft1', 300, 300, 0.5); if (t < 1.5) S(c, 'vSea10', 'ko', 300, 288, 0.42); else if (t < 2.4) S9(c, 'vClimb9', 'stagger', 300, 290, 1); else Spr.drawAnim(c, 'valera', 'walk', t, 300 + (t - 2.4) * 22, 292, 1); } },
    { d: 9, plate: 'cpShore', cam: [380, 230, 1.15, 400, 230, 1.2], storm: 1.5, sfx: [[2, 'boom', 0.3, 2], [5, 'boom', 0.3, 2]],
      draw(c, t) { P_vova(c, t, 400, 300); H(c, 'chBasov', t % 1 < 0.5 ? 'bs0' : 'bs1', 470, 300, 62);
        if (t < 1.2) Spr.drawAnim(c, 'valera', 'walk', t, 340 + t * 27, 300, 1); else S9(c, 'vSit9', 0, 372, 302, 1); } },
    { d: 3.6, plate: 'cuValera', cam: [300, 185, 1.0, 290, 190, 1.08], rain: true, rainA: 0.5 },     // крупный план: Валера у Вовы-мухомора
    { d: 4.5, plate: 'cpShore', cam: [400, 230, 1.15, 400, 230, 1.15], sfx: [[0.2, 'zap', 1, 3, 0.4], [1.6, 'zap', 1, 2]],
      draw(c, t) { P_vova(c, t, 400, 300); S9(c, 'vSit9', 0, 372, 302, 1); H(c, 'chBasov', t > 1.5 ? 'bs3' : 'bs0', 470, 300, 62);
        const a = clamp(t / 1.6, 0, 1); H(c, 'chBox', t < 1.6 ? 'x0' : 'x1', 250, 300, 150, { a: t < 1.6 ? a * (0.5 + 0.5 * Math.sin(t * 30)) : 1 }); } },
    { d: 6.5, plate: 'cpShore', cam: [300, 240, 1.4, 300, 240, 1.4],
      lines: [[1.6, 'yurik', 'Опять не тот год... Я должен всё исправить.', 3.6]],
      draw(c, t) { H(c, 'chBox', 'x2', 250, 300, 150); S9(c, 'vSit9', 0, 372, 302, 1); const x = Math.min(300, 252 + t * 50); H(c, 'chYurik', t < 1 ? 'y1' : t < 1.4 ? 'y2' : 'y3', x, 300, 92, { flip: true }); } },
    { d: 4, plate: 'cpShore', cam: [330, 240, 1.4, 330, 240, 1.4],
      lines: [[1.2, 'valera', 'Это что такое?', 2.6]],
      draw(c, t) { H(c, 'chBox', 'x2', 250, 300, 150); H(c, 'chYurik', 'y0', 300, 300, 92, { flip: true }); Spr.drawAnim(c, 'valera', t < 1.1 ? 'walk' : 'stand', t, t < 1.1 ? 372 - t * 30 : 340, 300, -1); } },
    { d: 6, plate: 'cpShore', cam: [320, 240, 1.5, 320, 240, 1.5],
      lines: [[0.3, 'yurik', 'Валера, нам нужно вернуться назад в прошлое, изменить прошлое. Пошли со мной!', 5]],
      draw(c, t) { H(c, 'chBox', 'x2', 250, 300, 150); H(c, 'chYurik', t < 3 ? 'y4' : 'y6', 300, 300, 92, { flip: true }); Spr.drawAnim(c, 'valera', 'stand', t, 340, 300, -1); } },
    { d: 5, plate: 'cpShore', cam: [320, 240, 1.3, 340, 235, 1.15], sfx: [[3, 'zap', 1, 3, 0.5]],
      draw(c, t) { const out = t > 3; H(c, 'chBox', out ? 'x3' : 'x2', 250, 300, 150, { a: out ? clamp(1 - (t - 3) / 1.2, 0, 1) * (0.5 + 0.5 * Math.sin(t * 40)) : 1 });
        if (t < 2.2) { H(c, 'chYurik', 'y7', 300 - t * 25, 300, 92, { flip: true }); Spr.drawAnim(c, 'valera', 'walk', t, 340 - t * 38, 300, -1); }
        P_vova(c, t, 400, 300); H(c, 'chBasov', t > 3.2 ? 'bs3' : 'bs0', 470, 300, 62); } },
    { d: 6, plate: 'cpShore', cam: [430, 250, 1.3, 400, 220, 1.0], sfx: [[1, 'boom', 0.3, 2]],
      draw(c, t) { P_vova(c, t, 400, 300); H(c, 'chBasov', t < 1.6 ? 'bs3' : t % 1 < 0.5 ? 'bs0' : 'bs1', 470, 300, 62); } },
    { d: 6, plate: null, hard: true, rain: false, title: (c, t) => { const a = clamp(t / 1, 0, 1); c.globalAlpha = a; G.text('КОНЕЦ ИГРЫ', 320, 150, { align: 'center', size: 24, color: '#ffd84a', outline: true }); if (t > 1.5) G.text('ПРОДОЛЖЕНИЕ СЛЕДУЕТ...', 320, 192, { align: 'center', size: 8, color: '#c8d0d8' }); c.globalAlpha = 1; } },
  ], { music: 'cutscene' });
  // крыша завода из слоёв фазы 1 (вид строго сбоку): небо, цеха, ряд крыш; broken — пролом справа
  // бег по крыше строго сбоку: небо+море (гроза фазы 1), набережная, край крыши, надстройка слева, Валера крупно (лист rsrun)
  function runSet(c, t, st, P) {
    c.save(); c.translate(640, 0); c.scale(-1, 1);     // владелец: бежит справа налево — вся сцена зеркально
    const V = 130, cx = t * V;
    if (st.storm) st.storm(c, cx * 0.4);
    const ci = L10.img.bg1cranes, CR = L10.BG1 && L10.BG1.cranes;     // портовые краны вдали (владелец), на кромке причала
    if (ci && CR) { const PER = 430, H = 150, base = 282, o = cx * 0.3; c.save(); c.globalAlpha = 0.85; c.imageSmoothingEnabled = true;
      for (let i = Math.floor((o - 300) / PER); i <= Math.floor((o + 940) / PER); i++) {
        const h = ((i * 7919) % 97 + 97) % 97 / 97, r = CR[i & 1], sc = H * (0.8 + h * 0.3) / r[3], w = r[2] * sc, x = i * PER + h * 160 - o;
        if (x + w < -20 || x > 660) continue;
        c.save(); c.translate(x + w / 2, base); if (h > 0.5) c.scale(-1, 1); c.drawImage(ci, r[0], r[1], r[2], r[3], -w / 2, -r[3] * sc, w, r[3] * sc); c.restore(); }
      c.restore(); }
    if (L10.img.bg1quay) L10.bgTile(c, 'bg1quay', cx, 0.45, 273, 84);     // набережная втрое ниже (видна полоса 273..296)
    c.imageSmoothingEnabled = true;
    const B2 = L10.BLD2, bi = L10.img.bld10;     // крыша — бетонный корпус с вентиляцией (bld10 №10), бесшовно в ряд
    if (B2 && bi) { const r = B2.bld[10], k = 0.62, w = r[2] * k, y0 = 300 - r[4] * k, o = (cx % w + w) % w;
      const sy = r[4] + 6; for (let x = -o; x < 660; x += w - 1) c.drawImage(bi, r[0], r[1] + sy, r[2], r[3] - sy, x, 296, w, (r[3] - sy) * k); }
    const ri = L10.img.rtop10; if (B2 && ri) { const r = B2.obj[0], h = 235, w = r[2] * h / r[3]; c.drawImage(ri, r[0], r[1], r[2], r[3], 470 - cx, 300 - h, w, h); }     // надстройка-лифтовая слева
    const R = L10.RSC && L10.RSC.run, im = L10.img.rsrun;
    if (R && im) { const f = R[Math.floor(t * 13) % R.length], h = 176, k = h / 372, bob = Math.abs(Math.sin(t * 13 * Math.PI / 4)) * -2;
      c.drawImage(im, f[0], f[1], f[2], f[3], 372 - f[2] * k / 2, 302 - f[3] * k + bob, f[2] * k, f[3] * k); }
    if (Math.random() < 0.2) P.debris(rnd(520, 660), 290, 1, 0.7);     // позади (справа) что-то рушится
    c.imageSmoothingEnabled = false; c.restore();
  }
  function roofSet(c, t, broken) {
    c.imageSmoothingEnabled = true; if (L10.img.bg1f) c.drawImage(L10.img.bg1f, -40, -10, 720, 405); if (L10.img.mid10) c.drawImage(L10.img.mid10, -40, 120, 720 * 1.0, 200);
    if (L10.has('roof10')) { const xs = [[-30, 'r0', 260], [235, 'r1', 210], [450, 'r4', 260]]; for (const [x, n, w] of xs) { if (broken && n === 'r4') continue; const [fw, fh] = L10.size('roof10', n), k = w / fw; S(c, 'roof10', n, x + w / 2, 270 - 6, k); } }
    c.imageSmoothingEnabled = false; }
  // Вова-мухомор с тараканом на шляпке, дальние ядерные вспышки
  function P_vova(c, t, x, y) { SP(c, 'vova6', 7, x, y, 1, 1.15); const rx = x - 26 + Math.abs(((t * 22) % 52) - 26) * 2 - 26; SP(c, 'roach', [1, 2][fr(t, 8, 2)], rx + 26, y - 120, ((t * 22) % 104) < 52 ? 1 : -1, 0.32); }
  function P_far(c, t) {     // далёкие ядерные взрывы, дым, небо затянуто
    c.fillStyle = 'rgba(20,24,30,0.35)'; c.fillRect(-200, -100, 1040, 560);
    if (!L10.has('boom10')) return;
    for (const [x, y, o] of [[560, 200, 0], [120, 210, 1.1], [330, 190, 2.1]]) { const k = (t * 0.6 + o) % 3.2; if (k < 1.4) S(c, 'boom10', 'n' + Math.min(3, (k * 3) | 0), x, y, 0.4, { add: 1, a: 0.75 * (1 - k / 1.4) }); }
  }
})();
