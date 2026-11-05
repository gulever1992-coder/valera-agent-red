// Уровень 10, фаза 2 «ДЖЕТПАК»: шмап как Cuphead (Кала Мария). Экранные координаты 640x360.
// Семён (облик 2: раны, сломан рог, оторван погон) справа по пояс; из прыщей лезут миньоны; шланг хватает (вырываться влево-вправо);
// плазма изо рта, миниган руки на лбу, молнии. Завис на месте 1.5 с — шланг съедает сразу.
(() => {
  const S = L10.spr, clamp = L10.clamp, rnd = L10.rnd;
  const HP = 2800, SPD = 175;
  const P = L10.PARTS.jet = {
    deathText: 'СЕМЁН СЪЕЛ ВАЛЕРУ',
    start(lv, ck) {
      Object.assign(P, { lv, hp: 100, inv: 1.5, x: 140, y: 170, vx: 0, vy: 0, dir: 1, t: 0, fireT: 0, fireA: 0, still: 0, cam: 0, bul: [], ebul: [], foes: [], fx: [], grab: null, eat: null, strikes: [] });
      P.W = new L10.Weather(240);
      P.W.flashK = 0.35;     // молний много — общая вспышка слабее, чтобы кадр не засвечивало
      P.storm = L10.makeStorm(P.W, { seaY: 150, seaH: 230, shipZ: 70, ships: 9 });     // фон как в фазе 1: гроза и море до низа кадра, набережной нет
      const B = P.B = L10.makeBoss(2, L10.RIG2 ? { H: 400, x: 545, y: 505, hp: HP, segs: 2, segLimit: 150 } : { H: 640, x: 540, y: 650, hp: HP, segs: 2, segLimit: 150 });
      B.setPose('idle'); P.A = { cur: null, cd: 2.5, t: 0 };
      if (ck) B.hp = B.maxHp - ck * B.segHp;     // чекпоинт: после смерти — с начала сегмента
      B.onSeg = (s) => { if (B.hp > 0) { lv.ck = s; lv.say('СЕМЁН ЗВЕРЕЕТ!', 2); B.setPose(L10.fr('sem2', 'hurt') ? 'hurt' : 'roar', 1.2); G.shake(8, 0.8); Sound.play('stomp'); } };
      B.onPop = (x, y) => { if (B.hp > 0 && P.foes.length < 4 + B.seg * 3) { const k = ['bat', 'worm', 'eye', 'blob'][(Math.random() * 4) | 0]; P.foes.push(new L10.Minion(k, x, y, { env: P.env, hpK: 1 })); } };
      P.env = { px: () => P.x, py: () => P.y, shoot: e => P.ebul.push(e), hurt: (d) => P.hurt(d), ground: null, lv };
      try { Music.play('epicBoss'); } catch (e) {}
      lv.say('ЛЕТИ И СТРЕЛЯЙ! НЕ ЗАВИСАЙ НА МЕСТЕ!', 3.5);
    },
    onDie() {},
    hurt(d) { if (P.inv > 0 || P.grab || P.eat) return; P.lv.hurt(Math.ceil(d * 0.5)); P.inv = 1.2; P.hurtT = 0.3; P.calm = 0; },
    startAtk(k) {
      const B = P.B, A = P.A; A.cur = k; A.t = 0; A.n = 0; A.done = 0;
      if (k === 'grab') { B.setPose(L10.fr('sem2', 'lunge') ? 'lunge' : 'roar', 1.6); A.tx = P.x; A.ty = P.y; Sound.play('warn', 0.6); }
      if (k === 'eyes') { B.setPose(L10.fr('sem2', 'eyes') ? 'eyes' : 'roar', 3.0); A.ang = Math.atan2(P.y - B.P('e')[1], P.x - B.P('e')[0]) - 0.35; A.dirA = 1; Sound.play('zap', 0.5); }
      if (k === 'plasma') { B.setPose('roar', 3.2); A.ang = Math.atan2(P.y - B.P('m')[1], P.x - B.P('m')[0]); A.dirA = P.y < 180 ? 1 : -1; Sound.play('steam', 0.6); }
      if (k === 'gun') { B.setPose('gun', 2.6); Sound.play('warn', 0.4); }
      if (k === 'bolt') { B.setPose('roar', 1.2); for (let i = 0; i < 3 + B.seg * 2; i++) P.strikes.push({ x: clamp(P.x + rnd(-160, 160), 20, 420), t: -i * 0.35 }); Sound.play('zap', 0.5); }
      if (k === 'spawn') { B.setPose('roar', 1.0); for (const p of B.pimps) p.st = Math.max(p.st, 3.3); }
    },
    update(lv, dt) {
      const I = G.Input, B = P.B, A = P.A; P.t += dt; P.inv -= dt; P.calm = (P.calm || 0) + dt; if (P.calm > 4 && P.hp < 100) P.hp = Math.min(100, P.hp + 2 * dt); P.fireT -= dt; P.fireA -= dt; P.hurtT -= dt; P.cam += dt * 60;
      B.watch = [P.x, P.y]; P.W.update(dt, 4);     /* молнии чаще (владелец) */ B.update(dt); B.segT += dt; B.walk = 0;
      if (B.hold <= 0 && !A.cur) B.setPose('idle');
      // ---- съедение (анимация) / захват
      if (P.eat) { const e = P.eat; e.t += dt; const [mx, my] = B.P('m'), [hx, hy] = B.pt(0.45, 0.75); P.tent = e.t < 1.1 ? { x0: hx, y0: hy, x1: P.x, y1: P.y } : null; if (B.rig) B.hoseT = P.tent ? { x: P.x, y: P.y } : null;     // шланг тянет Валеру в пасть
        P.x = L10.lerp(e.x0, mx, clamp(e.t / 1.0, 0, 1)); P.y = L10.lerp(e.y0, my, clamp(e.t / 1.0, 0, 1)); if (e.t > 1.1 && !e.ch) { e.ch = 1; Sound.play('punch'); G.shake(10, 0.5); G.flash(0.25, '#300'); } if (e.t > 1.4) { P.eat = null; lv.kill(e.text); } return; }
      if (P.grab) {
        const g = P.grab; g.t += dt; B.setPose('roar', 0.5); if (B.rig) B.hoseT = { x: P.x, y: P.y + 4 };
        const want = g.last === 'left' ? 'right' : 'left'; if (I.pressed(want)) { g.last = want; g.n++; Sound.play('clank', 0.3); G.shake(2, 0.1); }
        P.x = L10.lerp(P.x, g.x - g.t * 30, dt * 3); P.y += Math.sin(P.t * 20) * 0.6;
        if (g.n >= g.need) { P.grab = null; P.inv = 1.4; B.damage(20); lv.say('ВЫРВАЛСЯ!', 1.2); Sound.play('punch'); P.vx = -200; }
        else if (g.t > g.lim) { P.grab = null; P.eat = { t: 0, x0: P.x, y0: P.y, text: 'СЕМЁН СЪЕЛ ВАЛЕРУ' }; }
        return;
      }
      // ---- управление
      const mx = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0), my = (I.held('down') ? 1 : 0) - (I.held('up') ? 1 : 0);
      P.vx += (mx * SPD - P.vx) * dt * 8; P.vy += (my * SPD - P.vy) * dt * 8;
      P.x = clamp(P.x + P.vx * dt, 24, 400); P.y = clamp(P.y + P.vy * dt, 24, 330);
      if (Math.hypot(P.vx, P.vy) < 14) P.still += dt; else P.still = Math.max(0, P.still - dt * 2);
      if (P.still > 1.5 && !P.warnS && B.hp > 0) { P.warnS = 1; lv.say('НЕ ЗАВИСАЙ!', 1.5); B.setPose('roar', 0.8); Sound.play('warn', 0.5); } else if (P.still < 0.5) P.warnS = 0;
      if (P.still > 3 && B.hp > 0) { P.still = 0; P.warnS = 0; P.eat = { t: 0, x0: P.x, y0: P.y, text: 'ЗАВИС — И СЕМЁН ЕГО СЪЕЛ' }; Sound.play('rope'); B.setPose('roar', 2); return; }
      if (I.held('punch') && P.fireT <= 0) { P.fireT = 0.12; P.fireA = 0.08; lv.stats.shots++; for (const oy of [-11, 2]) P.bul.push({ x: P.x + 24, y: P.y + oy, vx: 640, vy: 0, dmg: 1 }); Sound.play('shot', 0.35); }
      // ---- время / победа
      if (B.hp > 0 && B.segT > B.segLimit) { P.eat = { t: 0, x0: P.x, y0: P.y, text: 'НЕ УСПЕЛ — СЕМЁН СЪЕЛ ВАЛЕРУ' }; return; }
      if (B.hp <= 0) { P.winT = (P.winT || 0) + dt; B.setPose('roar', 1); if (P.winT > 1.2) lv.next(); }
      // ---- атаки
      if (B.hp > 0) { if (!A.cur) { A.cd -= dt; if (A.cd <= 0) P.startAtk(P.pick()); } else P.atkUpd(dt); }
      // ---- пули
      for (const b of P.bul) {
        b.x += b.vx * dt; b.y += b.vy * dt;
        for (const f of P.foes) if (!f.dead) { const bx = f.box(); if (b.x > bx[0] && b.x < bx[0] + bx[2] && b.y > bx[1] && b.y < bx[1] + bx[3]) { f.hit(b.dmg); b.dead = 1; P.fx.push({ k: 'hit', x: b.x, y: b.y, t: 0, life: 0.12 }); break; } }
        if (!b.dead) { const r = B.hitAt(b.x, b.y, b.dmg); if (r) { b.dead = 1; lv.score += r === 'weak' ? 15 : 5; P.fx.push({ k: r === 'weak' ? 'whit' : 'hit', x: b.x, y: b.y, t: 0, life: 0.15 }); } }
        if (b.x > 680) b.dead = 1;
      }
      P.bul = P.bul.filter(b => !b.dead);
      for (const e of P.ebul) { e.t = (e.t || 0) + dt; if (e.grav) e.vy += 900 * e.grav * dt; e.x += e.vx * dt; e.y += e.vy * dt; if (Math.abs(e.x - P.x) < 16 && Math.abs(e.y - P.y) < 24) { e.dead = 1; P.hurt(e.dmg || 8); } if (e.x < -40 || e.x > 700 || e.y < -40 || e.y > 400 || e.t > 5) e.dead = 1; }
      P.ebul = P.ebul.filter(e => !e.dead);
      for (const f of P.foes) { f.update(dt); if (!f.dead && f.kind !== 'eye' && Math.abs(f.x - P.x) < 20 && Math.abs(f.y - P.y) < 24) P.hurt(8); }
      P.foes = P.foes.filter(f => !f.gone);
      for (const s of P.strikes) { s.t += dt; if (s.t > 0.8 && !s.hit) { s.hit = 1; G.shake(4, 0.2); Sound.play('zap', 0.6); P.W.flash = 0.8; if (Math.abs(P.x - s.x) < 22) P.hurt(14); } }
      P.strikes = P.strikes.filter(s => s.t < 1.1);
      for (const f of P.fx) f.t += dt; P.fx = P.fx.filter(f => f.t < f.life);
    },
    pick() { const sg = P.B.seg, L = [['grab', 2.2], ['plasma', 1.8 + sg * 0.5], ['eyes', 1.4], ['gun', 2], ['bolt', 1.3], ['spawn', 1 + sg]]; let r = Math.random() * L.reduce((a, b) => a + b[1], 0); for (const [k, w] of L) if ((r -= w) <= 0) return k; return 'gun'; },
    atkUpd(dt) {
      const A = P.A, B = P.B, sg = B.seg, end = cd => { A.cur = null; A.cd = cd - sg * 0.4; B.glowE = B.glowM = 0; P.beam = null; P.tent = null; B.aim = null; B.hoseT = null; B.gunT = null; };
      A.t += dt;
      if (A.cur === 'grab') {     // шланг из-под брюха летит в точку, где был Валера
        const [bx, by] = B.rig ? B.P('hose') : B.pt(0.45, 0.75), p = clamp((A.t - 0.6) / 0.45, 0, 1), back = clamp((A.t - 1.25) / 0.5, 0, 1), k = p * (1 - back);
        if (!A.locked && A.t > 0.45) { A.locked = 1; A.tx = P.x; A.ty = P.y; }
        P.tent = { x0: bx, y0: by, x1: L10.lerp(bx, A.tx ?? P.x, k), y1: L10.lerp(by, A.ty ?? P.y, k) };
        if (B.rig) { B.hoseT = k > 0.02 ? { x: P.tent.x1, y: P.tent.y1 } : null; if (k > 0.02) { P.tent.x1 = B.P('hose')[0]; P.tent.y1 = B.P('hose')[1]; } }     // риг: летит сам шланг
        if (p >= 1 && !back && !A.done && Math.hypot(P.x - P.tent.x1, P.y - P.tent.y1) < 34 && P.inv <= 0) { A.done = 1; P.grab = { t: 0, n: 0, need: 9 + sg * 3, lim: 2.6, x: P.x, last: 'right' }; P.tent = null; Sound.play('rope'); P.lv.say('ЖМИ ВЛЕВО-ВПРАВО!', 2); end(2); return; }
        if (A.t > 1.8) end(1.4);
      }
      if (A.cur === 'plasma') {
        B.glowM = Math.min(1, A.t);
        if (A.t > 1.0) { if (!A.done) { A.done = 1; Sound.play('zap'); } A.ang += A.dirA * dt * (0.22 + sg * 0.06); const [mx, my] = B.P('m'); P.beam = { x0: mx, y0: my, a: A.ang }; B.aim = [mx + Math.cos(A.ang) * 300, my + Math.sin(A.ang) * 300];
          const px = P.x - mx, py = P.y - my, ux = Math.cos(A.ang), uy = Math.sin(A.ang), along = px * ux + py * uy, off = Math.abs(px * uy - py * ux); if (along > 0 && off < 22) P.hurt(18);
          if (A.t > 3.0) end(1.6); }
      }
      if (A.cur === 'eyes') {
        B.glowE = Math.min(1, A.t * 1.5);
        if (A.t > 0.8) { A.ang += A.dirA * dt * 0.35; const [ex, ey] = B.P('e'), [ex2, ey2] = B.P('e2'); P.beam = { x0: ex, y0: ey, x1: ex2, y1: ey2, a: A.ang, laser: 1 }; B.aim = [ex + Math.cos(A.ang) * 300, ey + Math.sin(A.ang) * 300];
          const px = P.x - ex, py = P.y - ey, ux = Math.cos(A.ang), uy = Math.sin(A.ang); if (px * ux + py * uy > 0 && Math.abs(px * uy - py * ux) < 9) P.hurt(12);
          if (A.t > 2.8) end(1.3); }
      }
      if (A.cur === 'gun') {
        B.aim = [P.x, P.y]; B.gunT = [P.x, P.y];     // риг: голова и миниган наводятся на Валеру
        if (A.t > 0.5 && A.t < 2.3) { A.n += dt; if (A.n > 0.07 - sg * 0.01) { A.n = 0; const [hx, hy] = B.rig ? B.fireGun() : B.P('h'); const a = Math.atan2(P.y - hy, P.x - hx) + rnd(-0.18, 0.18); P.ebul.push({ x: hx, y: hy, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, dmg: 5, draw: (c, e) => L10.has('fx10') ? S(c, 'fx10', 'tracer', e.x, e.y, 0.12, { rot: Math.atan2(e.vy, e.vx), add: 1 }) : (c.fillStyle = '#ff6', c.fillRect(e.x - 3, e.y - 1, 6, 2)) }); Sound.play('shot', 0.2); if (!B.rig) P.fx.push({ k: 'flash', x: hx, y: hy, t: 0, life: 0.05 }); } }     // пули из стволов минигана
        if (A.t > 2.6) end(1.2);
      }
      if (A.cur === 'bolt' || A.cur === 'spawn') { if (A.t > 1.3) end(1.0); }
    },
    draw(lv, c) {
      const B = P.B;
      if (L10.img.bg1sky) P.storm(c, P.t * 90);     // летим — море и небо плывут
      else { L10.bgTile(c, 'bg2', -P.cam, 0.25, 0, 360); P.W.drawBolt(c); }
      for (const s of P.strikes) { if (s.t < 0.8) { if (L10.has('fx10')) S(c, 'fx10', ((s.x | 0) % 2) ? 'bolt0' : 'bolt1', s.x, 180, 1.2, { add: 1, a: 0.12 + 0.12 * Math.abs(Math.sin(s.t * 30)) }); } else if (L10.has('fx10')) S(c, 'fx10', ((s.x | 0) % 2) ? 'bolt0' : 'bolt1', s.x, 180, 1.2, { add: 1, a: 1 - (s.t - 0.8) / 0.3 }); else { c.fillStyle = '#eef'; c.fillRect(s.x - 3, 0, 6, 360); } }
      B.draw(c);
      if (P.beam) { const b = P.beam; c.save(); c.globalCompositeOperation = 'lighter'; c.translate(b.x0, b.y0); c.rotate(b.a); if (L10.has('fx10')) { const f = L10.fr('fx10', b.laser ? 'laser' : 'plasma'); c.imageSmoothingEnabled = true; const th = b.laser ? 9 : 48 + Math.sin(P.t * 50) * 6; c.drawImage(L10.img.fx10, f[0], f[1], f[2], f[3], 0, -th / 2, 800, th); if (b.laser) { c.rotate(-b.a); c.translate(b.x1 - b.x0, b.y1 - b.y0); c.rotate(b.a); c.drawImage(L10.img.fx10, f[0], f[1], f[2], f[3], 0, -th / 2, 800, th); } } else { c.fillStyle = 'rgba(140,255,120,0.8)'; c.fillRect(0, -16, 800, 32); } c.restore(); }     // лазер: второй луч — из второго глаза
      if (P.beam && B.rig && B.drawOver) B.drawOver(c);     // луч из глаз — за миниганом и рукой
      if (P.tent && !B.rig) P.drawTent(c, P.tent);
      for (const f of P.foes) f.draw(c);
      for (const e of P.ebul) e.draw ? e.draw(c, e) : (c.fillStyle = '#f80', c.fillRect(e.x - 3, e.y - 3, 6, 6));
      for (const b of P.bul) { if (L10.has('fx10')) S(c, 'fx10', 'ball', b.x, b.y, 0.08, { add: 1 }); else S(c, 'fxL9', 'plasma', b.x, b.y, 0.3); }
      for (const f of P.fx) { if (f.k === 'flash' && L10.has('fx10')) S(c, 'fx10', 'flash', f.x, f.y, 0.12, { add: 1 }); else if (L10.has('fx10')) S(c, 'fx10', f.k === 'whit' ? 'lhit' : 'splash', f.x, f.y, 0.1, { add: 1 }); }
      P.drawValera(c);
      P.W.draw(c);
      if (B.segLimit - B.segT < 25 && B.hp > 0) { c.strokeStyle = `rgba(255,30,30,${0.3 + 0.3 * Math.sin(B.t * 10)})`; c.lineWidth = 6; c.strokeRect(3, 3, 634, 354); }
      if (P.grab) { G.text('ЖМИ ВЛЕВО-ВПРАВО!', 320, 120, { align: 'center', size: 16, color: '#ff5050', outline: true }); c.fillStyle = '#300'; c.fillRect(220, 140, 200, 8); c.fillStyle = '#ffd84a'; c.fillRect(220, 140, 200 * P.grab.n / P.grab.need, 8); }
    },
    drawTent(c, t) {
      const L = Math.hypot(t.x1 - t.x0, t.y1 - t.y0), a = Math.atan2(t.y1 - t.y0, t.x1 - t.x0);
      c.save(); c.translate(t.x0, t.y0); c.rotate(a);
      if (L10.has('tent10')) { const f = L10.fr('tent10', 'seg'), im = L10.img.tent10; c.imageSmoothingEnabled = true; for (let x = 0; x < L - 30; x += 56) c.drawImage(im, f[0], f[1], f[2], f[3], x, -16 + Math.sin(x * 0.05 + P.t * 14) * 5, 58, 32); c.restore(); S(c, 'tent10', 'tip', t.x1, t.y1, 0.45, { rot: a }); return; }
      c.fillStyle = '#56603a'; c.fillRect(0, -12, L, 24); c.restore();
    },
    drawValera(c) {
      if (P.eat && P.eat.t > 1.0) return;
      if (P.inv > 0 && !P.grab && !P.eat && (P.t * 16 | 0) % 2) return;
      const fr = P.grab || P.eat ? 'grab' : P.hurtT > 0 ? 'hurt' : P.vy < -60 ? 'up' : P.vy > 60 ? 'down' : ((P.t * 8 | 0) % 2 ? 'hover' : 'hover2');
      const can = L10.has('can10') && !P.grab && !P.eat && P.hurtT <= 0, cf = P.fireA > 0 ? ((P.t * 20 | 0) % 2 ? 'fire0' : 'fire1') : 'idle';
      const k = P.eat ? L10.lerp(0.6, 0.18, clamp(P.eat.t / 0.9, 0, 1)) : 0.6;     // владелец: Валера намного меньше Семёна, а в пасть летит как муха
      if (can) S(c, 'can10', cf, P.x + 8 * k, P.y - 14 * k, 0.22 * k);     // дальний плазмоган на ранце
      if (L10.has('vJet10')) S(c, 'vJet10', fr, P.x, P.y, 0.5 * k); else S(c, 'vJump9_plasma', 'rise', P.x, P.y + 40 * k, k);
      if (can) S(c, 'can10', cf, P.x + 12 * k, P.y + 8 * k, 0.25 * k);     // ближний плазмоган
      if (P.grab && !P.B.rig) { const [x, y] = [P.x, P.y]; if (L10.has('tent10')) S(c, 'tent10', 'coil', x, y + 2, 0.24); }
    },
    drawHud(lv, c) { L10.bossBar(c, P.B); },
  };
})();
