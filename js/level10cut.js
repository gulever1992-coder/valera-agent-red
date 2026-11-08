// Уровень 10: кинокатсцены — «анимация из картинок» (Flow), НЕ видео. Шот = фон-план + камера (наезд/панорама/наклон)
// + покадровые слои (листы Flow и спрайты прошлых уровней) + дождь/молнии/тряска/кинорамка + реплики. Раскадровка: docs/L10_STORYBOARD.md.
(() => {
  const S = L10.spr, S9 = L9.spr, clamp = L10.clamp, rnd = L10.rnd, lerp = L10.lerp, ease = L10.ease;
  const SP = (c, sh, i, x, y, f = 1, sc = 1) => Spr.draw(c, sh, i, x, y, f, { scale: sc });     // спрайты ур.1–8
  const fr = (t, fps, n) => ((t * fps) | 0) % n;
  const H = (c, sh, f, x, y, h, o = {}) => { const z = L10.size(sh, f)[1]; if (!z) return; if (sh === 'chBox') { c.save(); c.filter = 'hue-rotate(150deg) saturate(0.75) brightness(0.95)'; S(c, sh, f, x, y, h / z, o); c.restore(); } else S(c, sh, f, x, y, h / z, o); };     // будка перекрашена из синей (критик: узнаваемая чужая франшиза)     // персонаж высотой h px

  L10.MIDA = { jpg: ['nk_capt', 'nk_back', 'nk_rage0', 'nk_rage1', 'nk_city', 'sky', 'eyes', 'sea', 'subp', 'subs', 'scope2', 'nukefar', 'beach', 'glade', 'cuvova'], png: ['nk_mush0', 'nk_mush1', 'nk_mush2', 'nk_mush3', 'vjet0', 'vjet1', 'vjet2', 'vjet3', 'vraft20', 'vraft21', 'vraft22', 'vraft23', 'crew21', 'crew22', 'crew23', 'tmach0', 'tmach1', 'tmach2', 'tmach3', 'yura0', 'yura1', 'yura2', 'yura3', 'yura4', 'yura5', 'basov0', 'basov1', 'basov2', 'basov3', 'vova0', 'vova1', 'vova2', 'vova3', 'vova4', 'vova5', 'vova6', 'vfin0', 'vfin1', 'vfin2', 'vfin3', 'vfin4', 'vfin5', 'vfin6', 'vfin7'].concat([...Array(4).keys()].map(i => 'vl' + i), [...Array(12).keys()].map(i => 'vw' + i), [...Array(8).keys()].map(i => 'vp' + i), [...Array(11).keys()].map(i => 'yw' + i), [...Array(8).keys()].map(i => 'bs' + i), ['ri0', 'ri1', 'rr0', 'rr1', 'rr2', 'rr3', 'rr4', 'rr5', 'rj0', 'rj1', 'rw0', 'rw1', 'rw2', 'rw3', 'rw4', 'rw5', 'cl0', 'cl1', 'cl2', 'cl3', 'scr0', 'scr1', 'scr2']) };     // катсцена mid: assets/l10/mid (tools/p10/build_mid.py)
  WHO.valera = WHO.valera || { name: 'ВАЛЕРА', color: '#f06a14', voice: 90 };
  // ---------- движок ----------
  L10.Cine = (name, shots, o = {}) => {
    const P = {
      noHud: true, cine: true, deathText: '',
      start(lv) { P.lv = lv; P.i = 0; P.t = 0; P.hp = 100; P.inv = 0; P.W = new L10.Weather(230); P.fx = []; P.sub = null; P.flash = 0; P.fade = 0; P.shake = 0; if (o.music) try { Music.play(o.music); } catch (e) {} P.enter(); },
      enter() { const s = shots[P.i]; P.t = 0; P.st = {}; if (s && !s.keepFx) P.fx = [];     /* частицы не переходят в следующий шот (режиссёр) */ if (s && s.on) s.on(P.st, P); },
      update(lv, dt) {
        const I = G.Input;
        if (I.pressed('pause') || I.pressed('start')) { P.i = shots.length; }
        const s = shots[P.i]; if (!s) { lv.next(); return; }
        P.t += dt; P.W.update(dt, s.storm || 1); P.flash = Math.max(0, P.flash - dt * 2.2); P.shake = Math.max(0, P.shake - dt * 6);
        if (s.up) s.up(P.st, P.t, dt, P);
        for (const f of P.fx) { f.t += dt; if (f.vx != null) { f.x += f.vx * dt; f.vy += (f.g ?? 600) * dt; f.y += f.vy * dt; } } P.fx = P.fx.filter(f => f.t < f.life);
        if (s.lines) for (const L of s.lines) if (P.t >= L[0] && !L.shown) { L.shown = 1; P.sub = { who: L[1], text: L[2], t: 0, d: L[3] || 3.2, at: L[4] }; Sound.play('blip', WHO[L[1]] ? WHO[L[1]].voice : 90); }
        if (P.sub) { P.sub.t += dt; if (P.sub.t > P.sub.d) P.sub = null; }
        if (s.sfx) for (const q of s.sfx) if (P.t >= q[0] && !q.done) { q.done = 1; Sound.play(q[1], q[2] ?? 1); if (q[3]) G.shake(q[3], q[4] || 0.4); if (q[5]) P.flash = q[5]; }
        if (P.t >= s.d) { P.i++; P.sub = null; for (const L of (shots[P.i] || {}).lines || []) L.shown = 0; for (const q of (shots[P.i] || {}).sfx || []) q.done = 0; P.enter(); }
      },
      draw(lv, c) {
        const s = shots[P.i]; c.fillStyle = '#000'; c.fillRect(0, 0, 640, 360); if (!s) return;
        const k = clamp(P.t / s.d, 0, 1), e = s.lin ? k : ease(k), cm = s.cam || [320, 180, 1, 320, 180, 1];
        const z = Math.max(1, lerp(cm[2], cm[5], e)), sw = s.sway ? [Math.sin(P.t * 0.7) * 3, Math.sin(P.t * 1.1) * 2] : [0, 0], cx = clamp(lerp(cm[0], cm[3], e) + sw[0], 320 / z, 640 - 320 / z), cy = clamp(lerp(cm[1], cm[4], e) + sw[1], 180 / z, 360 - 180 / z); P.cam = { cx, cy, z };     // камера не выходит за край фона; sway — «ручная» камера
        const sh = (s.shake ? s.shake(P.t) : 0) + P.shake * 4 + (G.shakeAmt || 0) * 0;
        c.save(); c.translate(320 + rnd(-sh, sh), 180 + rnd(-sh, sh)); c.scale(z, z); c.translate(-cx, -cy);
        if (s.plate) { const im = L10.img[s.plate]; if (im) { c.imageSmoothingEnabled = true; c.drawImage(im, 0, 0, 640, 360); c.imageSmoothingEnabled = false; } }
        if (s.plate === 'cpShore') P_far(c, P.t);
        if (s.draw) s.draw(c, P.t, P.st, P);
        for (const f of P.fx) P.drawFx(c, f);
        c.restore();
        if (s.over) s.over(c, P.t, P.st, P);
        if (s.rain !== false) { P.W.draw(c, s.rainA ?? (/^mid_(sky|sea|scope2|beach)$/.test(s.plate || '') ? 0.5 : 1)); }
        if (P.flash > 0) { c.fillStyle = `rgba(255,255,255,${P.flash})`; c.fillRect(0, 0, 640, 360); }
        // кинорамка
        if (s.plate) { const vg = c.createRadialGradient(320, 180, 150, 320, 180, 380); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)'); c.fillStyle = vg; c.fillRect(0, 0, 640, 360); }     // виньетка
        c.fillStyle = '#000'; c.fillRect(0, 0, 640, 26); c.fillRect(0, 334, 640, 26);
        // затемнение на склейках
        const fi = clamp(P.t / 0.25, 0, 1), fo = clamp((s.d - P.t) / (s.fadeOut || 0.25), 0, 1), a = 1 - Math.min(fi, s.cutOut === false ? 1 : fo);
        if (a > 0 && !s.hard) { c.fillStyle = `rgba(0,0,0,${a})`; c.fillRect(0, 0, 640, 360); }
        if (P.sub) P.drawSub(c, P.sub);
        if (s.title) s.title(c, P.t);
        if (P.i === 0 && P.t < 3) G.text('ESC — ПРОПУСТИТЬ', 632, 340, { align: 'right', size: 8, color: '#666' });
      },
      drawSub(c, d) {
        // владелец 2026-11-08: реплики снизу с аватаром, как везде в игре (пузыри drawBubble больше не используются)
        const w = WHO[d.who] || { name: d.who, color: '#fff' }, a = clamp(Math.min(d.t, d.d - d.t) / 0.2, 0, 1); c.globalAlpha = a;
        c.fillStyle = 'rgba(8,10,14,0.88)'; c.fillRect(40, 250, 560, 84); c.fillStyle = w.color || '#f06a14'; c.fillRect(40, 250, 560, 2);
        if (G.portraits && G.portraits[d.who]) G.drawPortrait(c, d.who, 46, 256, (d.t * 6 | 0) % 2 === 0 && d.t < d.d - 0.6);
        const tx = G.portraits && G.portraits[d.who] ? 116 : 52;
        G.text(w.name, tx, 256, { size: 10, color: w.color || '#ffb070' });
        G.wrap(d.text.slice(0, Math.floor(d.t * 40)), 590 - tx, 12).slice(0, 3).forEach((l, i) => G.text(l, tx, 274 + i * 17, { size: 12, color: '#f4f0e4' }));
        c.globalAlpha = 1;
      },
      drawBubble(c, d) {     // комикс-пузырь у говорящего (владелец: нижние окна реплик не нравились)
        const w = WHO[d.who] || { name: d.who, color: '#fff' }, a = clamp(Math.min(d.t, d.d - d.t) / 0.15, 0, 1), pop = 0.85 + 0.15 * clamp(d.t / 0.12, 0, 1);
        const FS = 12, LH = 16, lines = G.wrap(d.text, 260, FS).slice(0, 4), bw = Math.max(100, Math.min(284, Math.max(...lines.map(l => G.textWidth(l, FS))) + 22)), bh = 30 + lines.length * LH;     // крупный шрифт — читаемо
        const cm = P.cam || { cx: 320, cy: 180, z: 1 }, ax = 320 + (d.at[0] - cm.cx) * cm.z, ay = 180 + (d.at[1] - cm.cy) * cm.z,     /* точка пузыря — в координатах фона, едет с камерой */ bx = clamp(ax - bw / 2, 8, 632 - bw), by = clamp(ay - bh - 26, 30, 330 - bh);
        c.save(); c.globalAlpha = a; c.translate(ax, ay); c.scale(pop, pop); c.translate(-ax, -ay);
        c.fillStyle = '#f6f1e3'; c.strokeStyle = '#111'; c.lineWidth = 2;
        c.beginPath(); const r = 8; c.moveTo(bx + r, by); c.arcTo(bx + bw, by, bx + bw, by + bh, r); c.arcTo(bx + bw, by + bh, bx, by + bh, r); c.arcTo(bx, by + bh, bx, by, r); c.arcTo(bx, by, bx + bw, by, r); c.closePath(); c.fill(); c.stroke();
        const tx = clamp(ax, bx + 14, bx + bw - 14); c.beginPath(); c.moveTo(tx - 8, by + bh - 1); c.lineTo(ax, ay - 4); c.lineTo(tx + 8, by + bh - 1); c.closePath(); c.fill(); c.stroke(); c.fillRect(tx - 7, by + bh - 3, 14, 4);
        G.text(w.name, bx + 10, by + 7, { size: 9, color: w.color === '#fff' ? '#c04010' : '#a0400c' });
        const shown = Math.floor(d.t * 40); let left = shown; lines.forEach((l, i) => { const part = l.slice(0, Math.max(0, left)); left -= l.length + 1; G.text(part, bx + 11, by + 22 + i * LH, { size: FS, color: '#111', shadow: false }); });
        c.restore();
      },
      drawFx(c, f) {
        const k = f.t / f.life;
        if (f.k === 'deb' && L10.has('deb10')) S(c, 'deb10', f.fr, f.x, f.y, f.s, { rot: f.r * f.t });
        else if (f.k === 'boom' && L10.has('boom10')) S(c, 'boom10', 'b' + Math.min(3, (k * 4) | 0), f.x, f.y, f.s, { add: 1 });
        else if (f.k === 'nuke' && L10.has('boom10')) S(c, 'boom10', 'n' + Math.min(3, (k * 4) | 0), f.x, f.y, f.s, { add: 1 });
        else if (f.k === 'spark' && L10.has('fx10')) S(c, 'fx10', 'flash', f.x, f.y, f.s || 0.1, { add: 1, a: 1 - k });
        else if (f.k === 'splash' && L10.has('fx10')) S(c, 'fx10', 'splash', f.x, f.y, f.s || 0.4, f.soft ? { a: 0.6 * (1 - k) } : { add: 1, a: 1 - k });
        else if (f.k === 'smoke') { const r = f.s * (1 + k * 2), col = f.col || '40,38,38', g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, r); g.addColorStop(0, `rgba(${col},${0.5 * (1 - k)})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(f.x - r, f.y - r, r * 2, r * 2); f.x += 0.15; }
        else if (f.k === 'bolt' && L10.has('fx10')) S(c, 'fx10', 'ball', f.x, f.y, 0.07, { add: 1 });
        else if (f.k === 'drop') { c.fillStyle = `rgba(210,240,255,${0.8 * (1 - k)})`; c.fillRect(f.x, f.y, f.s, f.s * 1.6); }
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
  // Семён в катсценах фазы 3 — тот же анфас, что в бою (L10.Sem3), иначе старый риг; oy — сдвиг линии воды
  const mkSem = (x, y, H) => { if (L10.SEM3 && L10.SEM3.use && L10.Sem3) { const B = new L10.Sem3({ x, y: y - 40, H: H * 0.95 }); B.oy = 40; return B; } return new L10.Boss(3, { H, x, y }); };
  const title = (txt, sub, ty = 150) => (c, t) => { const a = clamp(t / 0.5, 0, 1); c.globalAlpha = a; G.text(txt, 320, ty, { align: 'center', size: 24, color: '#ff4040', outline: true }); if (sub) G.text(sub, 320, ty + 40, { align: 'center', size: 8, color: '#ffd84a', outline: true }); c.globalAlpha = 1; };

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
    { d: 2.2, plate: null, rain: true, hard: true, title: title('ФИНАЛ', 'БЕГИ! СЕМЁН РУШИТ ВСЁ ПОЗАДИ', 70),     /* критик: налезало на голову Валеры */ on(st, P) { st.storm = L10.makeStorm(P.W, { seaY: 168, seaH: 120, shipZ: 40, ships: 6 }); }, draw(c, t, st, P) { runSet(c, t + 4.6, st, P); }, over(c) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 0, 640, 360); } },
  ], { music: 'cutscene' });

  // ================= ДЖЕТПАК СБИТ -> ПЛОТ -> ПОДЛОДКА (владелец 2026-11-08: всё нарисовано заново во Flow, assets/l10/mid) =================
  const MI = (c, n, x, y, h, o = {}) => { const im = L10.img['mid_' + n]; if (!im) return; const k = h / im.height, w = im.width * k; c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot); if (o.flip) c.scale(-1, 1); c.globalAlpha = o.a ?? 1; c.imageSmoothingEnabled = true; c.drawImage(im, -w * (o.ax ?? 0.5), -h * (o.ay ?? 1), w, h); c.restore(); };
  // вода фона поверх того, что «в воде»: тот же фон ниже линии y0 с мягким краем
  const waterOver = (c, plate, y0, dy = 0) => { const im = L10.img[plate]; if (!im) return; const wc = waterOver.c || (waterOver.c = document.createElement('canvas')); wc.width = 640; wc.height = 360 - y0 + 30; const w = wc.getContext('2d'); w.imageSmoothingEnabled = true;
    w.drawImage(im, 0, -(y0 - 30) + dy, 640, 360); const g = w.createLinearGradient(0, 0, 0, 30); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); w.globalCompositeOperation = 'destination-in'; w.fillStyle = g; w.fillRect(0, 0, 640, wc.height); c.drawImage(wc, 0, y0 - 30); };
  const beam = (c, x0, y0, x1, y1, th) => { const f = L10.fr('fx10', 'laser'); if (!f) return; c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x0, y0); c.rotate(Math.atan2(y1 - y0, x1 - x0)); c.imageSmoothingEnabled = true; c.drawImage(L10.img.fx10, f[0], f[1], f[2], f[3], 0, -th / 2, Math.hypot(x1 - x0, y1 - y0), th); c.restore(); };
  const glow = (c, x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); };
  const smoke = (P, x, y, s = 1, col) => P.fx.push({ k: 'smoke', x: x + rnd(-4, 4), y, vx: rnd(-20, 20), vy: rnd(-60, -20), g: -10, t: 0, life: rnd(0.8, 1.4), s: rnd(8, 14) * s, col });
  const portMask = (c, t) => { const cx = 320, cy = 178, r = 132; c.save(); c.fillStyle = '#050403'; c.beginPath(); c.rect(0, 0, 640, 360); c.arc(cx, cy, r, 0, Math.PI * 2, true); c.fill('evenodd');
    const im = null; if (im) { c.save(); c.beginPath(); c.rect(0, 0, 640, 360); c.arc(cx, cy, r + 26, 0, Math.PI * 2, true); c.clip('evenodd'); c.globalAlpha = 0.9; c.drawImage(im, 0, 0, 640, 360); c.restore(); c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.rect(0, 0, 640, 360); c.arc(cx, cy, r + 26, 0, Math.PI * 2, true); c.fill('evenodd'); }
    const g = c.createLinearGradient(cx - r, cy - r, cx + r, cy + r); g.addColorStop(0, '#e8c070'); g.addColorStop(0.5, '#8a5a20'); g.addColorStop(1, '#4a2c10'); c.strokeStyle = g; c.lineWidth = 26; c.beginPath(); c.arc(cx, cy, r + 13, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, r + 1, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(cx, cy, r + 26, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.clip(); const gl = c.createLinearGradient(cx - r, cy - r, cx + r * 0.2, cy + r * 0.2); gl.addColorStop(0, 'rgba(255,255,255,0.18)'); gl.addColorStop(0.4, 'rgba(255,255,255,0)'); c.fillStyle = gl; c.fillRect(cx - r, cy - r, r * 2, r * 2);
    const vg = c.createRadialGradient(cx, cy, r * 0.62, cx, cy, r); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.75)'); c.fillStyle = vg; c.fillRect(cx - r, cy - r, r * 2, r * 2);     // окуляр перископа: тёмный край и прицельная сетка
    c.strokeStyle = 'rgba(10,20,10,0.65)'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - r, cy); c.lineTo(cx + r, cy); c.moveTo(cx, cy - r); c.lineTo(cx, cy + r); for (let i = -4; i <= 4; i++) { if (!i) continue; c.moveTo(cx + i * 26, cy - 4); c.lineTo(cx + i * 26, cy + 4); c.moveTo(cx - 4, cy + i * 26); c.lineTo(cx + 4, cy + i * 26); } c.stroke();
    c.restore(); };
  const scopeMask = (c, t) => { const cx = 320 + Math.sin(t * 0.9) * 6, cy = 180 + Math.sin(t * 1.3) * 3, r = 150; c.save(); c.fillStyle = '#000'; c.beginPath(); c.rect(0, 0, 640, 360); c.arc(cx, cy, r, 0, Math.PI * 2, true); c.fill('evenodd');
    const g = c.createRadialGradient(cx, cy, r * 0.7, cx, cy, r); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.85)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(20,30,20,0.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - r, cy); c.lineTo(cx + r, cy); c.moveTo(cx, cy - r); c.lineTo(cx, cy + r); for (let i = -4; i <= 4; i++) { if (!i) continue; c.moveTo(cx + i * 30, cy - 4); c.lineTo(cx + i * 30, cy + 4); c.moveTo(cx - 4, cy + i * 30); c.lineTo(cx + 4, cy + i * 30); } c.stroke();
    c.fillStyle = 'rgba(120,255,150,0.05)'; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill(); c.restore(); };
  WHO.sailor = WHO.sailor || { name: 'МАТРОС', color: '#9fc0d0', voice: 100 };
  WHO.capt = WHO.capt || { name: 'КАПИТАН', color: '#d0d8e0', voice: 72 };
  const EYES = [[288, 180], [392, 175]];     // глаза на крупном плане mid_eyes (640x360)
  L10.PARTS.mid = L10.Cine('mid', [
    // 1. общий план: Валера на джетпаке стреляет, у Семёна разгораются глаза
    { d: 3.2, plate: 'mid_sky', sway: 1, cam: [330, 190, 1.05, 320, 185, 1.12], sfx: [[0.3, 'shot', 0.4], [0.8, 'shot', 0.4], [1.3, 'shot', 0.4], [1.9, 'zap', 0.7]],
      on(st) { st.B = L10.makeBoss(2, { H: 330, x: 520, y: 430 }); st.B.setPose('roar'); },
      up(st, t, dt, P) { st.B.update(dt); st.B.glowE = clamp((t - 1.6) / 1.2, 0, 1); st.vy = Math.sin(t * 3) * 5; if (t < 1.8 && ((t * 6) | 0) !== st.sh) { st.sh = (t * 6) | 0; const mx = 207, my = 141 + st.vy, e = st.B.P('e'), tx = e[0] - 10, ty = e[1] + 70, d = Math.hypot(tx - mx, ty - my) || 1; P.fx.push({ k: 'bolt', x: mx, y: my, vx: (tx - mx) / d * 560, vy: (ty - my) / d * 560, g: 0, t: 0, life: d / 560 }); } },
      draw(c, t, st) { st.B.draw(c); waterOver(c, 'mid_sky', 300); MI(c, 'vjet0', 170, 190 + st.vy, 105); const e = st.B.P('e'); if (st.B.glowE > 0) glow(c, e[0], e[1], 14 + st.B.glowE * 26, '255,60,40', 0.5 * st.B.glowE + 0.3 * Math.sin(t * 30) * st.B.glowE); } },
    // 2. крупно: глаза Семёна наливаются красным — залп
    { d: 1.7, plate: 'mid_eyes', cam: [340, 178, 1.0, 340, 178, 1.18], lin: true, shake: t => t > 1.05 ? 3 : 0, sfx: [[0.1, 'warn', 0.6], [1.05, 'zap', 1, 6, 0.5, 0.35]],
      draw(c, t) { const k = clamp(t / 1.0, 0, 1); for (const [x, y] of EYES) glow(c, x, y, 20 + k * 40 + Math.sin(t * 40) * 4, '255,40,30', 0.35 + k * 0.5); if (t > 1.05) for (const [x, y] of EYES) { beam(c, x, y, x - 700, y + 80, 14); glow(c, x, y, 60, '255,200,180', 0.7); }     /* владелец: лазер из двух глаз */ } },
    // 3. луч бьёт в джетпак: искры, взрыв, Валеру встряхивает
    { d: 1.5, plate: 'mid_sky', cam: [200, 170, 1.6, 200, 170, 1.75], hard: true, shake: t => t > 0.2 && t < 0.9 ? 5 : 0, sfx: [[0.2, 'boom', 1, 6, 0.4, 0.5]],
      on(st, P) { st.fx = 0; },
      up(st, t, dt, P) { if (t > 0.2 && !st.fx) { st.fx = 2; P.boom(155, 120, 0.3); for (let i = 0; i < 14; i++) P.fx.push({ k: 'spark', x: 160, y: 125, vx: rnd(-200, 200), vy: rnd(-260, 60), g: 500, t: 0, life: rnd(0.3, 0.6), s: 0.06 }); } if (t > 0.3 && Math.random() < dt * 30) smoke(P, 156, 124, 0.8); },
      draw(c, t) { const jt = t > 0.2 ? Math.sin(t * 50) * clamp(1 - (t - 0.2) * 1.5, 0, 1) * 4 : 0; if (t < 0.45) beam(c, 330, -40, 155, 118, 10); MI(c, t < 0.2 ? 'vjet0' : 'vjet1', 200 + jt, 230, 150, { rot: t > 0.2 ? -0.12 * clamp((t - 0.2) * 3, 0, 1) : 0 }); } },
    // 4. падение: кувырок, дым тянется следом, камера ведёт вниз к морю
    { d: 2.4, plate: 'mid_sky', cam: [250, 175, 1.45, 290, 240, 1.45], lin: true, sfx: [[0.1, 'shout', 0.8]],
      up(st, t, dt, P) { st.x = 230 + t * 40; st.y = 70 + t * t * 55; if (Math.random() < dt * 40) smoke(P, st.x - 8, st.y - 50, 1); },
      draw(c, t, st) { MI(c, t < 1.3 ? 'vjet2' : 'vjet3', st.x, st.y, t < 1.3 ? 88 : 106, { ay: 0.6, rot: t < 1.3 ? t * 2.4 : 0.3 + Math.sin(t * 8) * 0.12 }); } },
    // 5. всплеск
    { d: 1.3, plate: 'mid_sea', cam: [320, 230, 1.3, 320, 230, 1.35], hard: true, sfx: [[0.05, 'splash', 1, 7]],
      on(st, P) { P.fx.push({ k: 'splash', x: 320, y: 260, s: 1.3, t: 0, life: 1.1 }); for (let i = 0; i < 16; i++) P.fx.push({ k: 'drop', x: 320 + rnd(-20, 20), y: 240, vx: rnd(-140, 140), vy: rnd(-360, -150), g: 700, t: 0, life: 1, s: rnd(2, 4) }); } },
    // 6. выныривает и залезает на плот (склейки разными планами)
    { d: 1.5, plate: 'mid_sea', sway: 1, cam: [300, 240, 1.25, 330, 240, 1.25], lin: true, sfx: [[0.1, 'splash', 0.5]],
      draw(c, t) { MI(c, 'vraft20', 300 + t * 20, 292 + Math.sin(t * 4) * 3, 109, { rot: Math.sin(t * 2.2) * 0.04 }); waterOver(c, 'mid_sea', 290); } },
    { d: 1.1, plate: 'mid_sea', sway: 1, cam: [300, 240, 1.9, 306, 236, 2.0], hard: true, sfx: [[0.3, 'splash', 0.4]],
      draw(c, t) { MI(c, 'vraft21', 320, 292 + Math.sin(t * 3) * 2, 110, { rot: Math.sin(t * 2.2) * 0.04 }); waterOver(c, 'mid_sea', 290); } },
    { d: 1.1, plate: 'mid_sea', sway: 1, cam: [320, 235, 1.3, 320, 230, 1.35], hard: true,
      draw(c, t) { MI(c, 'vraft22', 320, 292 + Math.sin(t * 3) * 2, 134, { rot: Math.sin(t * 2.2) * 0.04 }); waterOver(c, 'mid_sea', 290); } },
    { d: 2.8, plate: 'mid_sea', sway: 1, cam: [320, 232, 1.6, 320, 225, 1.7], hard: true, sfx: [[0.4, 'land', 0.6]],
      lines: [[0.5, 'valera', 'Кхе... Живой. Почти.', 2.0, [335, 168]]],
      draw(c, t) { MI(c, 'vraft23', 320, 292 + Math.sin(t * 2.5) * 3, 139, { rot: Math.sin(t * 2.2) * 0.04 }); waterOver(c, 'mid_sea', 290); } },
    // 7. подлодка: матрос прильнул к окуляру перископа на трубе; камера наезжает на окуляр (владелец 2026-11-08)
    { d: 4.4, plate: 'mid_subs', cam: [320, 180, 1.0, 352, 138, 1.9], rain: false, sfx: [[0.2, 'blip', 60]],
      lines: [[0.6, 'sailor', 'Товарищ капитан! Там, на волнах... что-то огромное!', 3.4, [312, 112]]],
      draw(c, t) { c.fillStyle = `rgba(255,0,0,${0.05 + 0.05 * Math.sin(t * 4)})`; c.fillRect(0, 0, 640, 360); } },
    // 8. вид в перископ: из пены вылезает побитый Семён и ревёт
    { d: 4.4, plate: 'mid_scope2', rain: false, cam: [320, 200, 1.0, 322, 212, 1.45], sfx: [[0.3, 'splash', 0.8, 3], [1.9, 'stomp', 1, 6]],
      on(st) { st.B = mkSem(322, 236, 150); if (st.B.alphaFn) { const af = st.B.alphaFn.bind(st.B); st.B.alphaFn = () => { const f = af(); return p => p.tag === 'hose' || p.id === 'hroot' ? 0 : f(p); }; } st.B.setPose(st.B.oy ? 'hurt' : 'roar'); },     /* шланг прячем, как в бою */
      up(st, t, dt, P) { st.B.update(dt); st.B.y = lerp(480, 262, ease(clamp(t / 1.8, 0, 1)));     /* ниже линии воды — обрез туловища не виден (владелец) */ if (t > 1.8) st.B.setPose('roar'); if (t < 2 && Math.random() < dt * 10) P.fx.push({ k: 'splash', x: rnd(250, 400), y: 225, s: 0.5, t: 0, life: 0.7, soft: 1 }); },
      draw(c, t, st) { st.B.draw(c); waterOver(c, 'mid_scope2', 238); },
      over(c, t) { portMask(c, t); } },
    // 9. подлодка: матрос отшатнулся, капитан командует
    { d: 5.8, plate: 'mid_subs', cam: [310, 185, 1.12, 450, 180, 1.12], rain: false, shake: t => t < 0.4 ? 2 : 0,     /* владелец: без иллюминатора, матрос так и смотрит в окуляр; камера с матроса на капитана */
      lines: [[0.2, 'sailor', 'Это он! Весь изодранный... и злой как чёрт!', 3.0], [3.2, 'capt', 'Готовьте боеголовки!', 2.4]],
      draw(c, t) { c.fillStyle = `rgba(255,0,0,${0.06 + 0.06 * Math.sin(t * 6)})`; c.fillRect(0, 0, 640, 360); } },
    { d: 2, plate: 'mid_sea', hard: true, draw(c) { c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, 640, 360); }, title: title('ФАЗА 3', 'ВЗОРВИ СТАНЦИИ И ДЕРЖИСЬ НА ПЛОТАХ') },
  ], { music: 'cutscene' });

  // ================= ЯДЕРНЫЙ ФИНАЛ (владелец 2026-11-08: перерисовано во Flow, assets/l10/mid) =================
  const GL = { vova: [330, 300], rock: [520, 318], sit: 262, tm: 118 };     /* sit — где сидит Валера (спиной к ножке Вовы слева), tm — машина времени */     // поляна mid_glade: где стоит Вова и сидит Басов
  const roachOn = (c, t, x, y) => { const p = (t * 0.6) % 2, u = p < 1 ? p : 2 - p, rx = x - 40 + u * 80; MI(c, 'vova' + (3 + fr(t, 10, 4)), rx, y + ((rx - x) / 40) ** 2 * 14 - 4, 32, { flip: p >= 1 }); };
  const gtr = (st, t) => { const b = (t / 0.6) | 0; if (b !== st.gb) { st.gb = b; Sound.play('blip', [180, 240, 200, 160][b % 4]); } };     // гитара Басова     // таракан бегает по шляпке
  const sadGtr = (st, t) => { const b = (t / 0.9) | 0; if (b !== st.gb) { st.gb = b; Sound.play('blip', [150, 120, 135, 100][b % 4]); } };     // грустная медленная мелодия Басова
  const glade = (c, t, o = {}) => { const [vx, vy] = GL.vova, [bx, by] = GL.rock;
    MI(c, 'vova' + (o.vf ?? (fr(t, 0.7, 6) === 5 ? 1 : 2)), vx, vy, 135); roachOn(c, t, vx, vy - 126);
    if (!o.noBasov) MI(c, 'bs' + (o.bf ?? fr(t, 2.2, 4)), bx, by + 2, 104); };     /* Басов (лист bs, лицом влево): bf — кадр, иначе грустная мелодия 0..3 */
  const shock = (c, x, y, t, t0) => { const k = t - t0; if (k < 0 || k > 2.2) return; const r = k * 260, a = clamp(1 - k / 2.2, 0, 1); c.save(); c.beginPath(); c.rect(0, 150, 640, 260); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,200,140,${a * 0.8})`; c.shadowBlur = 12; c.shadowColor = 'rgba(255,170,80,0.9)'; c.lineWidth = 8 + k * 10; c.beginPath(); c.ellipse(x, y, r, r * 0.12, 0, 0, Math.PI * 2); c.stroke(); c.restore(); };
  L10.PARTS.nuke = L10.Cine('nuke', [
    // ядерный финал v2 (владелец 2026-11-08): кнопка капитана -> подлодки вдали пускают ракеты -> со спины Семёна (город, завод) попадания -> дальний вид: растёт гриб
    // 1. капитан бьёт кулаком по красной кнопке и орёт «ОГОНЬ!»
    { d: 3.2, plate: 'mid_nk_capt', cam: [370, 262, 1.15, 330, 190, 1.0], rain: false, shake: t => t > 0.55 && t < 1.15 ? 4 : 0, sfx: [[0.2, 'warn', 0.8], [0.55, 'boom', 0.4], [1.1, 'shout', 1]],     /* сначала удар по кнопке крупно, потом камера к лицу и крик */
      lines: [[1.1, 'capt', 'ОГОНЬ!!!', 1.9]],
      draw(c, t) { c.fillStyle = `rgba(255,0,0,${0.08 + 0.12 * Math.abs(Math.sin(t * 7))})`; c.fillRect(0, 0, 640, 360); if (t > 0.55) glow(c, 376, 318, 34 + Math.sin(t * 30) * 4, '255,60,40', 0.55); } },
    // 2. Семён по центру, перед ним Валера на плоту с гранатомётом, по бокам сзади две подлодки дают залп — ракеты уходят вверх (попадут на следующем плане)
    { d: 3.6, plate: 'mid_sea', sway: 1, cam: [320, 200, 1.0, 320, 190, 1.06], sfx: [[0.5, 'boom', 0.35, 3], [0.5, 'shot', 0.5], [0.8, 'boom', 0.35, 3], [0.8, 'shot', 0.5], [1.4, 'boom', 0.35, 3], [1.4, 'shot', 0.5], [1.7, 'boom', 0.35, 3]],
      on(st) { st.B = mkSem(320, 262, 210); if (st.B.alphaFn) { const af = st.B.alphaFn.bind(st.B); st.B.alphaFn = () => { const f = af(); return p => p.tag === 'hose' || p.id === 'hroot' ? 0 : f(p); }; } st.B.setPose('roar'); st.B.y = 262; st.L = []; },
      up(st, t, dt, P) { st.B.update(dt); st.B.y = 262;
        for (const [k, x, t0] of [[0, 92, 0.5], [1, 548, 0.8], [2, 92, 1.4], [3, 548, 1.7], [4, 92, 2.3], [5, 548, 2.6]]) if (t > t0 && !st['f' + k]) { st['f' + k] = 1; for (let j = 0; j < 3; j++) st.L.push({ x: x + (j - 1) * 6, y: 150, vx: (x < 320 ? 1 : -1) * (30 + j * 15), vy: -190 - j * 25, t: -j * 0.08 }); P.fx.push({ k: 'splash', x, y: 158, s: 0.25, t: 0, life: 0.6 }); }
        for (const m of st.L) { m.t += dt; if (m.t < 0) continue; m.vy -= 260 * dt; m.x += m.vx * dt; m.y += m.vy * dt; if (Math.random() < dt * 25) smoke(P, m.x, m.y + 6, 0.4, '170,170,176'); } st.L = st.L.filter(m => m.y > -60); },
      draw(c, t, st) { st.B.draw(c); waterOver(c, 'mid_sea', 236);
        for (const [x, fl] of [[92, false], [548, true]]) { const fire = st.L.some(m => Math.abs(m.x - x) < 30 && m.y > 100); S(c, 'sub10', fire ? 'subFire' : 'subOpen', x, 160 + Math.sin(t * 2 + x) * 1.5, 0.24, { flip: fl }); }
        for (const m of st.L) if (m.t >= 0) { S(c, 'sub10', 'missile', m.x, m.y, 0.2, { rot: Math.atan2(m.vy, m.vx) + Math.PI / 2 }); glow(c, m.x - m.vx * 0.02, m.y - m.vy * 0.02, 9, '255,170,80', 0.55); }
        const ry = 318 + Math.sin(t * 2.2) * 3; S(c, 'slab10', 'raft2', 300, ry + 8, 1.4, { rot: Math.sin(t * 1.7) * 0.03 }); S9(c, 'vAim9_rocket', 'diag', 300, ry - 15, 1.0); waterOver(c, 'mid_sea', ry + 8); } },     /* Валера с РПГ на плоту перед Семёном */
    // 3. со спины Семёна (впереди город и завод): он в ярости трясёт кулаками, ракеты из-за спины зрителя бьют ему в спину (два кадра Flow чередуются)
    { d: 3.8, plate: 'mid_nk_rage0', cam: [310, 180, 1.0, 250, 165, 1.12], hard: true, shake: t => t > 0.8 ? 5 : 1.5,
      on(st) { st.n = 0; st.hits = [[220, 200], [265, 230], [180, 240], [240, 150], [280, 190], [170, 200], [250, 175], [215, 255]]; },
      up(st, t, dt, P) { if (t > 0.8 && t < 3.4 && (st.n += dt) > 0.22) { st.n = 0; const h = st.hits[(st.k = (st.k || 0) + 1) % st.hits.length]; P.boom(h[0] + rnd(-10, 10), h[1] + rnd(-10, 10), rnd(0.5, 0.9)); Sound.play('boom', rnd(0.3, 0.6)); } if (t > 3.3) P.flash = Math.min(1, P.flash + dt * 4); },
      draw(c, t, st) { const im = L10.img[((t * 5) | 0) % 2 ? 'mid_nk_rage1' : 'mid_nk_rage0'], jy = -Math.abs(Math.sin(t * 7)) * 10; if (im) { c.imageSmoothingEnabled = true; c.drawImage(im, -12, -12 + jy, 664, 384); }     /* прыгает в ярости: кадры чередуются + подскок */
        for (let i = 0; i < 10; i++) { const tt = t - i * 0.24; if (tt <= 0 || tt >= 0.8) continue; const h = st.hits[i % st.hits.length], sx = i % 2 ? 680 : -40, sy = 420, q = tt / 0.8, x = sx + (h[0] - sx) * q, y = sy + (h[1] - sy) * q;
          S(c, 'sub10', 'missile', x, y, 0.4 - q * 0.22, { rot: Math.atan2(h[1] - sy, h[0] - sx) + Math.PI / 2 }); glow(c, x, y, 14, '255,170,80', 0.5); } } },
    // 4. дальний вид на город и завод: вспышка, растёт ядерный гриб, ударная волна по воде
    { d: 6.5, plate: 'mid_nk_city', cam: [340, 220, 1.15, 330, 190, 1.0], hard: true, shake: t => t > 0.2 && t < 2.6 ? 3 : 0, sfx: [[0.05, 'boom', 1, 0, 0, 1], [1.2, 'boom', 1, 6]],
      draw(c, t) { const X = 375, Y = 292, K = 0.34, g = t / 1.0, f = Math.min(3, g | 0), u = clamp(g - f, 0, 1);
        glow(c, X, Y - 60, 150 + Math.sin(t * 6) * 10, '255,170,80', 0.35 * clamp(t / 0.3, 0, 1));
        for (const [n, a] of [[f, f < 3 ? 1 - u * 0.0 : 1], [f + 1, f < 3 ? u : 0]]) { if (n > 3 || a <= 0) continue; const im = L10.img['mid_nk_mush' + n]; if (!im) continue; const k = K * (1 + (n === f ? u * 0.08 : 0)); MI(c, 'nk_mush' + n, X, Y + 6, im.height * k, { a: n === f ? 1 - (f < 3 ? u : 0) : a }); }
        if (t < 0.5) { c.fillStyle = `rgba(255,250,230,${0.9 * (1 - t / 0.5)})`; c.fillRect(0, 0, 640, 360); }
        shock(c, X, Y + 4, t, 0.3); shock(c, X, Y + 4, t, 1.1); waterOver(c, 'mid_nk_city', 298); },
      /* надпись «СЕМЁН ПОБЕЖДЁН» убрана (владелец 2026-11-08) */ },
    // 5. Валера на плоту: зарево, вспышка, волна накрывает — в темноту (режиссёр: почему он потом без сознания)
    { d: 3, plate: 'mid_sea', sway: 1, cam: [320, 230, 1.6, 320, 222, 1.8], hard: true, fadeOut: 1, shake: t => t > 1.4 ? 5 : 0, sfx: [[1.4, 'boom', 1, 6, 0.6, 1]],
      lines: [[0.2, 'valera', 'Э... Это что ещё за...', 1.2, [335, 168]]],
      up(st, t, dt, P) { if (t > 1.4 && !st.w) { st.w = 1; for (let i = 0; i < 6; i++) P.fx.push({ k: 'splash', x: rnd(260, 380), y: 280, s: 1.2, t: 0, life: 1 }); } },
      draw(c, t) { glow(c, 600, 90, 420, '255,170,80', clamp(t / 1.2, 0, 1) * 0.6); MI(c, 'vraft23', 320, 292 + Math.sin(t * 2.5) * 3 + (t > 1.4 ? (t - 1.4) * 30 : 0), 139, { rot: t > 1.4 ? (t - 1.4) * 0.5 : 0 }); waterOver(c, 'mid_sea', 290); } },
  ], { music: 'cutscene' });

  // ================= КОНЦОВКА: берег -> грибное место -> машина времени =================
  L10.PARTS.outro = L10.Cine('outro', [
    // 1. Валеру без сознания несёт течением на плоту
    { d: 4.5, plate: 'mid_sea', sway: 1, cam: [260, 240, 1.4, 360, 235, 1.4], lin: true, rainA: 0.5,
      draw(c, t) { glow(c, 560, 120, 300, '255,140,60', 0.25); MI(c, 'vfin0', 220 + t * 40, 292 + Math.sin(t * 2) * 4, 70, { rot: Math.sin(t * 1.3) * 0.04 }); waterOver(c, 'mid_sea', 284); } },     /* вода скрывает поддон — плот тот же по смыслу */
    // 2. выброшен на песок
    { d: 3.4, plate: 'mid_beach', cam: [200, 290, 1.7, 220, 285, 1.6], rainA: 0.3, sfx: [[0.8, 'splash', 0.3], [2.4, 'splash', 0.3]],
      up(st, t, dt, P) { if (Math.random() < dt * 3) P.fx.push({ k: 'splash', x: rnd(230, 330), y: rnd(292, 304), s: 0.25, t: 0, life: 0.8, soft: 1 }); },
      draw(c, t) { const n = t > 2.3 && t < 3.0 ? 'vl1' : 'vl0', im = L10.img['mid_' + n]; MI(c, n, 214, 306, im ? 104 * im.height / im.width : 40); } },     /* владелец: лежит на песке — вынесло волной; кашляет */
    // 3. (владелец 2026-11-08, финал v2) очнулся и встаёт: сидит -> на колене -> стоит
    { d: 2.6, plate: 'mid_beach', cam: [220, 268, 1.6, 228, 258, 1.5], rainA: 0.25, sfx: [[0.9, 'land', 0.3]],
      draw(c, t) { MI(c, 'vp' + (t < 0.9 ? 0 : t < 1.7 ? 1 : 2), 222, 305, 96); } },
    // стоит спиной: над городом — ядерный гриб
    { d: 3.6, plate: 'mid_beach', cam: [250, 230, 1.35, 300, 200, 1.15], hard: true, rainA: 0.25,
      lines: [[1.4, 'valera', 'Ну и денёк...', 1.9, [224, 214]]],
      draw(c, t) { MI(c, 'vp3', 222, 305, 96); } },
    // 4. бредёт к грибному месту (цикл шагов) и сразу садится сбоку у ножки Вовы
    { d: 5.4, plate: 'mid_glade', cam: [230, 225, 1.25, 300, 222, 1.2], lin: true, rainA: 0.25,
      up(st, t, dt, P) { gtr(st, t); if (t < 4.2 && ((t * 3.4) | 0) !== st.stp) { st.stp = (t * 3.4) | 0; Sound.play('land', 0.2); } },
      draw(c, t) { glade(c, t); const x = Math.min(GL.sit, 40 + t * 52);
        if (t < 4.25) MI(c, 'vw' + fr(t, 6.8, 6), x, 306, 108); else MI(c, t < 4.75 ? 'vp4' : 'vp5', GL.sit, 306, 108, { flip: true }); } },
    // 5. сидит, облокотившись на Вову: грустный, уставший — закрывает глаза; Басов играет грустную мелодию
    { d: 5.2, plate: 'mid_glade', cam: [300, 245, 1.55, 330, 248, 1.75], rainA: 0.2,
      up(st, t, dt, P) { sadGtr(st, t); },
      draw(c, t) { glade(c, t, { vf: 2 }); MI(c, t < 2.2 ? 'vp5' : 'vp6', GL.sit, 306, 108, { flip: true }); } },
    // 6. из ниоткуда — машина времени; Валера открывает глаза
    { d: 3.6, plate: 'mid_glade', cam: [250, 222, 1.15, 230, 218, 1.18], sfx: [[0.2, 'zap', 1, 3, 0.4], [1.6, 'zap', 1, 2]],
      up(st, t, dt, P) { if (t < 1.8 && Math.random() < dt * 25) P.fx.push({ k: 'spark', x: GL.tm + rnd(-40, 40), y: 230 + rnd(-80, 60), vx: rnd(-60, 60), vy: rnd(-80, 20), g: 0, t: 0, life: 0.4, s: 0.08 }); },
      draw(c, t) { glade(c, t, { vf: 2, bf: 4 }); MI(c, t < 1.2 ? 'vp6' : 'vp7', GL.sit, 306, 108, { flip: true });
        if (t < 1.6) { glow(c, GL.tm, 230, 90, '120,180,255', 0.5); MI(c, 'tmach0', GL.tm, 306, 175, { a: clamp(t / 1.4, 0, 1) * (0.5 + 0.5 * Math.sin(t * 30)) }); } else MI(c, 'tmach1', GL.tm, 306, 175); } },
    // 7. дверь открывается — выходит Юра (шагает) и говорит
    { d: 5.2, plate: 'mid_glade', cam: [190, 228, 1.7, 205, 226, 1.75],
      lines: [[1.9, 'yurik', 'Опять не тот год... Я должен всё исправить.', 3.0, [200, 200]]],
      up(st, t, dt, P) { if (t < 1.5 && ((t * 3.6) | 0) !== st.stp) { st.stp = (t * 3.6) | 0; Sound.play('land', 0.2); } },
      draw(c, t) { glade(c, t, { bf: 4 }); MI(c, 'tmach2', GL.tm, 306, 175); glow(c, GL.tm, 240, 60, '255,255,230', 0.25);
        const x = Math.min(195, GL.tm + 10 + t * 55), talk = t > 1.9 && t < 4.9;
        MI(c, t < 1.5 ? 'yw' + fr(t, 7, 6) : talk ? 'yw' + (8 + fr(t, 3, 2)) : 'yw6', x, 306, 110);
        MI(c, 'vp7', GL.sit, 306, 108, { flip: true }); } },
    // 8. Валера встаёт: «Это что такое?»
    { d: 2.8, plate: 'mid_glade', cam: [250, 228, 1.8, 250, 226, 1.85], hard: true,
      lines: [[0.8, 'valera', 'Это что такое?', 1.9, [255, 200]]],
      draw(c, t) { glade(c, t, { bf: 4 }); MI(c, 'tmach2', GL.tm, 306, 175); MI(c, 'yw6', 195, 306, 110);
        if (t < 0.6) MI(c, 'vp4', GL.sit, 306, 108, { flip: true }); else MI(c, 'vp2', GL.sit - 4, 306, 108, { flip: true }); } },
    // 9. Юра зовёт в прошлое
    { d: 6.6, plate: 'mid_glade', cam: [200, 226, 1.7, 230, 225, 1.4],
      lines: [[0.3, 'yurik', 'Валера, нам нужно вернуться назад в прошлое, изменить прошлое. Пошли со мной!', 5.8, [200, 200]]],
      draw(c, t) { glade(c, t, { bf: 4 }); MI(c, 'tmach2', GL.tm, 306, 175); MI(c, t < 4.2 ? 'yw' + (8 + fr(t, 3, 2)) : 'yw10', 195, 306, 110); MI(c, 'vp2', GL.sit - 4, 306, 108, { flip: true }); } },
    // 10. уходят в машину (оба шагают влево), она исчезает
    { d: 6.2, plate: 'mid_glade', cam: [230, 225, 1.25, 260, 222, 1.15], sfx: [[4.6, 'zap', 1, 3, 0.5]],
      lines: [[0.2, 'valera', 'Хуже уже не будет. Пошли.', 2.0, [255, 200]]],
      up(st, t0, dt, P) { const t = t0 - 2; if (t > 0 && t < 2.4 && ((t * 3.6) | 0) !== st.stp) { st.stp = (t * 3.6) | 0; Sound.play('land', 0.2); } if (t > 2.6 && t < 3.8 && Math.random() < dt * 30) P.fx.push({ k: 'spark', x: GL.tm + rnd(-40, 40), y: 230 + rnd(-80, 60), vx: rnd(-60, 60), vy: rnd(-80, 20), g: 0, t: 0, life: 0.4, s: 0.08 }); },
      draw(c, t0) { const t = Math.max(0, t0 - 2), out = t > 2.6; glade(c, t0, { bf: 4 });
        MI(c, out ? 'tmach3' : 'tmach2', GL.tm, 306, 175, { a: out ? clamp(1 - (t - 2.6) / 1.2, 0, 1) * (0.5 + 0.5 * Math.sin(t * 40)) : 1 });
        const yx = 195 - t * 52, vx = GL.sit - 4 - t * 58, door = GL.tm + 6;
        if (t0 < 2) { MI(c, 'yw10', 195, 306, 110); MI(c, 'vp2', GL.sit - 4, 306, 108, { flip: true }); }
        else { if (yx > door) MI(c, 'yw' + fr(t, 7, 6), yx, 306, 110, { flip: true, a: clamp((yx - door) / 20, 0, 1) }); if (vx > door) MI(c, 'vw' + fr(t + 0.3, 6.8, 6), vx, 306, 108, { flip: true, a: clamp((vx - door) / 20, 0, 1) }); } } },
    // 11. Басов смотрит вслед, машет рукой («ну и ладно») и продолжает играть
    { d: 5.6, plate: 'mid_glade', cam: [470, 250, 1.8, 455, 248, 1.85],
      up(st, t, dt, P) { if (t > 2.6) sadGtr(st, t); },
      draw(c, t) { glade(c, t, { vf: 2, bf: t < 0.8 ? 4 : t < 2.2 ? 5 + fr(t, 3, 2) : t < 2.6 ? 7 : undefined }); } },
    // 12. камера отъезжает: Вова, таракан и Басов с гитарой
    { d: 4.4, plate: 'mid_glade', cam: [400, 240, 1.3, 330, 190, 1.0], fadeOut: 1.4,
      up(st, t) { sadGtr(st, t); },
      draw(c, t) { glade(c, t, { vf: 2 }); } },
    // чёрный экран
    { d: 5, plate: null, hard: true, rain: false, title: (c, t) => { c.fillStyle = '#000'; c.fillRect(0, 0, 640, 360); c.globalAlpha = clamp((t - 0.6) / 1, 0, 1); G.text('ПРОДОЛЖЕНИЕ СЛЕДУЕТ...', 320, 172, { align: 'center', size: 16, color: '#ffd84a', outline: true }); c.globalAlpha = 1; } },
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
      c.save(); c.translate(372, 0); c.scale(-1, 1); c.drawImage(im, f[0], f[1], f[2], f[3], -f[2] * k / 2, 302 - f[3] * k + bob, f[2] * k, f[3] * k); c.restore(); }     // лицом по ходу бега — влево, как в игре (критик)
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
