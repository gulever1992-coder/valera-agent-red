// Уровень 10, фаза 3 «МОРЕ» (смесь Cuphead и Terminator 2D): Семён по пояс из воды в центре, плоты-обломки плывут слева направо.
// Стрелять (гранатомёт) — только с плота; в воде Валера плывёт и может залезть на плот; унесло за правый край — утонул.
// Плавучие электростанции: Семён втыкает в них щупальца -> неуязвим (щит), станции надо взорвать. Подлодки бьют ракетами — без толку.
(() => {
  const S = L10.spr, S9 = L9.spr, clamp = L10.clamp, rnd = L10.rnd;
  const WY = 292, GRAV = 1300, RUN = 140, JUMP = 500, HP = 2000;
  const P = L10.PARTS.sea = {
    deathText: 'ВАЛЕРА УТОНУЛ',
    start(lv, ck) {
      Object.assign(P, { lv, hp: 100, inv: 1.5, x: 200, y: WY - 30, vx: 0, vy: 0, dir: 1, t: 0, onG: false, raft: null, swim: false, climbT: 0, fireT: 0, fireA: 0, aim: 'fwd', st: 'stand', cam: 0,
        rafts: [], bul: [], ebul: [], foes: [], fx: [], cols: [], stations: [], subs: [], missiles: [], marks: [], scared: 0, scN: 0, gun: false });
      P.W = new L10.Weather(260);
      const B = P.B = new L10.Boss(3, { H: 290, x: 420, y: WY + 12, hp: HP, segs: 3, segLimit: 150, flip: true }); B.setPose('idle');
      P.A = { cur: null, cd: 2.2, t: 0 };
      if (ck) B.hp = B.maxHp - ck * B.segHp;     // чекпоинт: после смерти — с начала сегмента
      B.onSeg = (s) => { if (B.hp > 0) { lv.ck = s; lv.say('СЕМЁН МУТИРУЕТ!', 2); B.setPose('roar', 1.2); G.shake(10, 1); Sound.play('stomp'); } };
      B.onPop = (x, y) => { if (B.hp > 0 && P.foes.length < 3 + B.seg * 2) P.foes.push(new L10.Minion(['bat', 'eye', 'worm', 'blob'][(Math.random() * 4) | 0], x, y, { env: P.env })); };
      P.env = { px: () => P.x, py: () => P.y - 40, shoot: e => P.ebul.push(e), hurt: d => P.hurt(d), ground: null, lv };
      // стартовые плоты
      for (let x = 60; x < 640; x += rnd(120, 170)) P.addRaft(x);
      P.raft = P.rafts[1]; P.x = P.raft.x; P.y = P.raft.top; P.onG = true;
      P.gunRaft = P.rafts[2] || P.rafts[0]; lv.say('ГРАНАТОМЁТ НА СОСЕДНЕМ ПЛОТУ — ПРЫГАЙ!', 3);     // владелец: Валера поднимает гранатомёт
      P.stT = 6; P.subT = 8;
      for (let i = 0; i < 3; i++) P.subs.push({ x: 60 + i * 210 + rnd(-30, 30), y: 248 + rnd(-6, 6), s: rnd(0.16, 0.22), fireT: rnd(4, 14) });
      try { Music.play('epicBoss'); } catch (e) {}
      lv.say('ВЗОРВИ ЭЛЕКТРОСТАНЦИИ! СТРЕЛЯТЬ МОЖНО ТОЛЬКО С ПЛОТА', 4);
    },
    addRaft(x) {
      const n = (Math.random() * 8) | 0, f = L10.fr('raft10', 'raft' + n), s = f ? rnd(110, 160) / (f[2] * 0.5) : 0.8;
      const w = f ? f[2] * 0.5 * s : 90, h = f ? f[3] * 0.5 * s : 30;
      const r = { x, n, s, w: w * 0.92, h, top: WY - h * 0.55, vx: rnd(32, 48), bob: rnd(0, 6), sink: 0 }; P.rafts.push(r); return r;
    },
    addStation(x) { P.stations.push({ x, y: WY + 6, hp: 30 + P.B.seg * 10, st: 'ok', t: 0, plugT: 0 }); },
    hurt(d, x) { if (P.inv > 0) return; P.lv.hurt(Math.ceil(d * 0.8)); P.inv = 0.9; P.hurtT = 0.3; },
    onDie() {},
    raftUnder(x, y0, y1) { return P.rafts.find(r => !r.sink && x > r.x - r.w / 2 && x < r.x + r.w / 2 && r.top >= y0 && r.top <= y1); },
    update(lv, dt) {
      for (const s of P.stations) s.dmgT = (s.dmgT || 0) - dt;
      const I = G.Input, B = P.B, A = P.A; P.t += dt; P.inv -= dt; P.fireT -= dt; P.fireA -= dt; P.hurtT -= dt; P.cam += dt * 40;
      P.W.update(dt, 1.6); B.update(dt); B.segT += dt;
      if (B.hold <= 0 && !A.cur) B.setPose('idle');
      // ---- течение: плоты
      P.spawnT = (P.spawnT || 0) - dt; if (P.spawnT <= 0) { P.spawnT = rnd(2.4, 3.6); const nr = P.addRaft(-60); if (!P.gun && (!P.gunRaft || P.gunRaft.x > 660 || P.gunRaft.sink)) P.gunRaft = nr; }
      if (!P.gun && P.gunRaft && P.raft === P.gunRaft && P.onG && Math.abs(P.x - P.gunRaft.x) < P.gunRaft.w * 0.45) { P.gun = true; P.gunRaft = null; Sound.play('pickup'); lv.say('ГРАНАТОМЁТ!', 1.5); }
      for (const r of P.rafts) { r.x += r.vx * dt; r.bob += dt * 2; r.top = WY - r.h * 0.55 + Math.sin(r.bob) * 2 + r.sink * 40; if (r.sink) r.sink += dt * 0.8; }
      P.rafts = P.rafts.filter(r => r.x < 720 && r.sink < 1.5);
      // ---- станции
      P.stT -= dt; if (P.stT <= 0 && P.stations.filter(s => s.st !== 'dead').length < 2 && B.hp > 0) { P.stT = rnd(26, 34); P.addStation(-80); lv.say('СТАНЦИЯ! СЕМЁН ПОДКЛЮЧИТСЯ К НЕЙ!', 2); }
      for (const s of P.stations) { s.t += dt; if (s.st !== 'dead') s.x += (s.x < 140 ? 40 : 6) * dt; if (s.st === 'ok' && s.x > 120) { s.st = 'plug'; Sound.play('zap'); G.shake(4, 0.4); } if (s.st === 'dead') s.sink = (s.sink || 0) + dt; }
      P.stations = P.stations.filter(s => !(s.st === 'dead' && s.sink > 4) && s.x < 760);
      B.inv = P.stations.some(s => s.st === 'plug');
      // ---- подлодки бьют по неуязвимому Семёну
      P.scared = (P.scared || 0) - dt; P.subT -= dt; if (P.subT <= 0 && B.hp > 0) { P.subT = rnd(9, 15); const sb = P.subs[(Math.random() * P.subs.length) | 0]; sb.fireT = 0.8; P.missiles.push({ x: sb.x, y: sb.y - 8, t: 0, tx: B.x + rnd(-40, 40), ty: B.y - B.H * rnd(0.4, 0.8) }); Sound.play('crane', 0.4); }
      for (const m of P.missiles) { m.t += dt; const p = clamp(m.t / 1.6, 0, 1); m.cx = L10.lerp(m.x, m.tx, p); m.cy = L10.lerp(m.y, m.ty, p) - Math.sin(p * Math.PI) * 140; if (p >= 1 && !m.hit) { m.hit = 1; P.fx.push({ k: 'boom', x: m.cx, y: m.cy, t: 0, life: 0.7, s: 0.6 }); G.shake(5, 0.3); Sound.play('boom'); if (!B.inv) B.damage(30); else { B.shieldT = 0.5; P.scN = (P.scN || 0) + 1; if (P.scN % 3 === 1) P.scared = 2.4; } } }     // ракета в щит — подводники в ужасе
      P.missiles = P.missiles.filter(m => m.t < 1.8);
      for (const s of P.subs) s.fireT -= dt;
      // ---- Валера
      if (P.climbT > 0) { P.climbT -= dt; if (P.climbT <= 0 && P.raft) { P.swim = false; P.y = P.raft.top; P.onG = true; } if (P.raft) P.x = P.raft.x + (P.climbOff || 0); }
      else if (P.swim) {
        const mv = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0); if (mv) P.dir = mv;
        P.x += (mv * 70 + 38) * dt; P.y = WY + 6 + Math.sin(P.t * 4) * 2; P.st = 'swim';
        const near = P.rafts.find(r => !r.sink && Math.abs(r.x - P.x) < r.w / 2 + 14);
        if (near && I.pressed('jump')) { P.raft = near; P.climbOff = clamp(P.x - near.x, -near.w / 2 + 8, near.w / 2 - 8); P.climbT = 0.5; Sound.play('splash', 0.5); }
      } else {
        const mv = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0), U = I.held('up');
        if (mv && !I.held('punch')) P.dir = mv;
        P.vx = mv * RUN + (P.onG && P.raft ? P.raft.vx : 0);
        if (I.pressed('jump') && P.onG) { P.vy = -JUMP; P.onG = false; P.raft = null; Sound.play('jump'); }
        P.vy = Math.min(900, P.vy + GRAV * dt);
        P.x += P.vx * dt;
        const ny = P.y + P.vy * dt;
        if (P.vy >= 0) { const r = P.raftUnder(P.x, P.y - 2, ny + 2); if (r) { P.y = r.top; P.vy = 0; if (!P.onG) Sound.play('land', 0.5); P.onG = true; P.raft = r; } else { P.y = ny; P.onG = false; P.raft = null; } } else { P.y = ny; P.onG = false; }
        if (P.onG && P.raft && (P.raft.sink || P.x < P.raft.x - P.raft.w / 2 - 2 || P.x > P.raft.x + P.raft.w / 2 + 2)) { P.onG = false; P.raft = null; }
        if (P.onG && P.raft) P.y = P.raft.top;
        if (P.y > WY + 4) { P.swim = true; P.vy = 0; P.raft = null; Sound.play('splash'); P.fx.push({ k: 'splash', x: P.x, y: WY, t: 0, life: 0.5 }); }
        P.aim = !P.onG ? (U ? 'diag' : 'fwd') : U && mv ? 'diag' : U ? 'up' : 'fwd';
        P.st = !P.onG ? 'jump' : mv ? 'run' : 'stand';
        if (I.held('punch') && P.fireT <= 0 && P.onG && P.gun) P.fire(lv);
        else if (I.pressed('punch') && !P.onG) lv.say('СТРЕЛЯТЬ — ТОЛЬКО С ПЛОТА', 1);
      }
      P.x = Math.max(P.x, 14);
      if (P.x > 650 && !lv.dead) lv.kill('ВАЛЕРУ УНЕСЛО ТЕЧЕНИЕМ');
      if (B.hp > 0 && B.segT > B.segLimit && !lv.dead && !P.eat) { P.eat = { t: 0 }; B.setPose(L10.fr('sem3', 'grab') ? 'grab' : 'roar', 9); Sound.play('rope'); }
      if (P.eat) { P.eat.t += dt; P.hide = P.eat.t > 0.5; if (P.eat.t > 1.6 && !P.eat.ch) { P.eat.ch = 1; Sound.play('punch'); G.shake(8, 0.4); } if (P.eat.t > 2) { P.eat = null; P.hide = 0; lv.kill('СЕМЁН СЪЕЛ ВАЛЕРУ — СЛИШКОМ ДОЛГО'); } return; }
      // ---- победа
      if (B.hp <= 0) { P.winT = (P.winT || 0) + dt; B.setPose('idle', 1); if (P.winT > 1.5) lv.next(); }
      // ---- атаки
      if (B.hp > 0) { if (!A.cur) { A.cd -= dt; if (A.cd <= 0) P.startAtk(P.pick()); } else P.atkUpd(dt); }
      // ---- пули/снаряды
      for (const b of P.bul) {
        b.t += dt; b.vy += 300 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
        let hit = false;
        for (const s of P.stations) if (s.st !== 'dead' && Math.abs(b.x - s.x) < 70 && b.y > s.y - 90 && b.y < s.y) { hit = true; s.hp -= 6; if (s.hp <= 0) { s.st = 'dead'; lv.score += 500; P.fx.push({ k: 'boom', x: s.x, y: s.y - 50, t: 0, life: 0.8, s: 1 }); G.shake(10, 0.6); Sound.play('boom'); lv.say('СТАНЦИЯ ВЗОРВАНА!', 1.5); } else s.st = s.st === 'plug' ? 'plug' : 'dmg'; s.dmgT = 0.3; }
        if (!hit) for (const f of P.foes) if (!f.dead) { const bx = f.box(); if (b.x > bx[0] && b.x < bx[0] + bx[2] && b.y > bx[1] && b.y < bx[1] + bx[3]) { f.hit(6); hit = true; break; } }
        if (!hit) { const r = B.hitAt(b.x, b.y, 7); if (r) { hit = true; lv.score += r === 'weak' ? 40 : 15; } }
        if (hit || b.y > WY + 6 || b.x > 680 || b.x < -40 || b.y < -60) { b.dead = 1; P.fx.push({ k: b.y > WY ? 'splash' : 'boom', x: b.x, y: Math.min(b.y, WY), t: 0, life: 0.45, s: 0.35 }); if (hit) Sound.play('boom', 0.5); }
      }
      P.bul = P.bul.filter(b => !b.dead);
      for (const e of P.ebul) { e.t = (e.t || 0) + dt; if (e.grav) e.vy += 900 * e.grav * dt; e.x += e.vx * dt; e.y += e.vy * dt; if (Math.abs(e.x - P.x) < 14 && e.y > P.y - 70 && e.y < P.y) { e.dead = 1; P.hurt(e.dmg || 8); } if (e.x < -40 || e.x > 700 || e.y > 380 || e.y < -60 || e.t > 5) e.dead = 1; }
      P.ebul = P.ebul.filter(e => !e.dead);
      for (const f of P.foes) f.update(dt); P.foes = P.foes.filter(f => !f.gone);
      for (const c of P.cols) { c.t += dt; if (c.t > 0.7 && !c.hit) { c.hit = 1; G.shake(3, 0.2); Sound.play('boom', 0.5); if (Math.abs(P.x - c.x) < 22) P.hurt(14); const r = P.rafts.find(r => Math.abs(r.x - c.x) < r.w / 2); if (r && Math.random() < 0.3) r.sink = 0.01; } }
      P.cols = P.cols.filter(c => c.t < 1.5);
      for (const f of P.fx) f.t += dt; P.fx = P.fx.filter(f => f.t < f.life);
      for (const m of P.marks) m.t += dt; P.marks = P.marks.filter(m => m.t < m.life);
    },
    fire(lv) {
      P.fireT = 0.55; P.fireA = 0.15; lv.stats.shots++;
      const a = P.aim === 'up' ? -Math.PI / 2 + 0.3 : P.aim === 'diag' ? -Math.PI / 4 : -0.06, d = P.dir;
      const mx = P.x + d * 30, my = P.y - (P.aim === 'up' ? 86 : P.aim === 'diag' ? 74 : 58);
      P.bul.push({ x: mx, y: my, vx: Math.cos(a) * 430 * d, vy: Math.sin(a) * 430, t: 0 }); Sound.play('throw', 0.8);
    },
    pick() { const sg = P.B.seg, L = [['claw', 3], ['eyes', 1.8], ['plasma', 1.4 + sg * 0.4], ['gun', 1.6], ['cols', 1.8 + sg * 0.5], ['spawn', 1 + sg * 0.5]]; let r = Math.random() * L.reduce((a, b) => a + b[1], 0); for (const [k, w] of L) if ((r -= w) <= 0) return k; return 'claw'; },
    startAtk(k) {
      const B = P.B, A = P.A; A.cur = k; A.t = 0; A.done = 0; A.n = 0;
      if (k === 'claw') { B.setPose('raise', 1.2); A.tx = P.x; P.marks.push({ x: P.x, t: 0, life: 1 }); Sound.play('warn', 0.6); }
      if (k === 'eyes') { B.setPose('roar', 2.4); A.from = 0; }
      if (k === 'plasma') { B.setPose('roar', 2.8); A.tx = P.x; }
      if (k === 'gun') { B.setPose('roar', 2.4); Sound.play('warn', 0.4); }
      if (k === 'cols') { B.setPose('raise', 1.4); for (let i = 0; i < 3 + B.seg; i++) P.cols.push({ x: clamp(P.x + (i - 1) * rnd(70, 110) + rnd(-20, 20), 20, 620), t: -i * 0.25 }); Sound.play('stomp'); G.shake(5, 0.5); }
      if (k === 'spawn') { B.setPose('roar', 1); for (const p of B.pimps) p.st = Math.max(p.st, 3.3); }
    },
    atkUpd(dt) {
      const A = P.A, B = P.B, sg = B.seg, end = cd => { A.cur = null; A.cd = cd - sg * 0.35; B.glowE = B.glowM = 0; P.beam = null; P.arm = null; };
      A.t += dt;
      if (A.cur === 'claw') { if (A.t > 0.9 && !P.arm) P.arm = { x: A.tx, t: 0 }; if (P.arm) { P.arm.t += dt; if (P.arm.t > 0.2 && !P.arm.hit) { P.arm.hit = 1; G.shake(9, 0.5); Sound.play('stomp'); P.fx.push({ k: 'splash', x: P.arm.x, y: WY, t: 0, life: 0.6, big: 1 }); const r = P.rafts.find(r => Math.abs(r.x - P.arm.x) < r.w / 2 + 10); if (r) r.sink = 0.01; if (Math.abs(P.x - P.arm.x) < 50) P.hurt(22); } } if (A.t > 1.9) end(1.5); }
      if (A.cur === 'eyes') { B.glowE = Math.min(1, A.t * 1.5); if (A.t > 0.7) { const p = clamp((A.t - 0.7) / 1.4, 0, 1), x = 640 - p * 640; P.beam = { k: 'laser', from: B.P('e'), to: [x, WY - 10] }; if (Math.abs(P.x - x) < 14 && P.y > WY - 40 && !P.swim) P.hurt(14); if (p >= 1) end(1.3); } }
      if (A.cur === 'plasma') { B.glowM = Math.min(1, A.t); if (A.t > 1.0) { A.tx += (P.x - A.tx) * dt * (0.5 + sg * 0.3); P.beam = { k: 'plasma', from: B.P('m'), to: [A.tx, WY - 6] }; if (Math.abs(P.x - A.tx) < 22) P.hurt(26); const r = P.rafts.find(r => Math.abs(r.x - A.tx) < r.w / 2); if (r && Math.random() < dt * 0.6) r.sink = 0.01; if (A.t > 2.6) end(1.6); } }
      if (A.cur === 'gun') { if (A.t > 0.5 && A.t < 2.2) { A.n += dt; if (A.n > 0.08) { A.n = 0; const [hx, hy] = B.P('h'), a = Math.atan2(P.y - 40 - hy, P.x - hx) + rnd(-0.2, 0.2); P.ebul.push({ x: hx, y: hy, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, dmg: 5, draw: (c, e) => L10.has('fx10') ? S(c, 'fx10', 'tracer', e.x, e.y, 0.12, { rot: Math.atan2(e.vy, e.vx), add: 1 }) : 0 }); Sound.play('shot', 0.2); } } if (A.t > 2.5) end(1.2); }
      if (A.cur === 'cols' || A.cur === 'spawn') { if (A.t > 1.4) end(1.1); }
    },
    draw(lv, c) {
      const B = P.B;
      L10.bgTile(c, 'bg3', P.cam, 0.15, 0, 360);
      P.W.drawBolt(c);
      for (const s of P.subs) { const fr = s.fireT > 0 ? 'subFire' : 'sub'; if (L10.has('sub10')) S(c, 'sub10', fr, s.x, s.y, s.s); }
      for (const m of P.missiles) if (m.cx != null && L10.has('sub10')) S(c, 'sub10', 'missile', m.cx, m.cy, 0.12, { rot: m.t < 0.8 ? 0 : Math.PI });
      // станции позади Семёна и щупальца к ним
      for (const s of P.stations) { const fr = s.st === 'dead' ? 'dead' : s.dmgT > 0 ? 'dmg' : 'ok'; if (L10.has('stat10')) S(c, 'stat10', fr, s.x, s.y + (s.sink || 0) * 20, 0.34); }
      for (const s of P.stations) if (s.st === 'plug') P.drawTent(c, B.pt(0.3, 0.55), [s.x + 20, s.y - 40]);
      if (P.eat && P.eat.t < 0.7) P.drawTent(c, B.pt(0.3, 0.55), [P.x, P.y - 40]);     // шланг хватает Валеру
      B.draw(c);
      if (P.beam) P.drawBeam(c, P.beam);
      // вода перед Семёном
      if (L10.img.water10) L10.bgTile(c, 'water10', P.cam * 2, 1, WY - 24, 130);
      for (const r of P.rafts) { if (L10.has('raft10')) S(c, 'raft10', 'raft' + r.n, r.x, r.top + r.h * 0.55 + 6, r.s, { a: 1 - r.sink * 0.6 }); }
      if (!P.gun && P.gunRaft) { const r = P.gunRaft, b = Math.sin(P.t * 4) * 2; S9(c, 'fxL9', 'spark', r.x, r.top - 14, 0.45 + Math.sin(P.t * 5) * 0.08, { add: 1 }); S9(c, 'pick9', 'rocket', r.x, r.top - 14 + b, 1); }
      for (const m of P.marks) L10.Minion.mark(c, m.x, WY - 5, 68, 0.4 + 0.4 * Math.sin(m.t * 18));
      for (const cl of P.cols) { if (cl.t < 0.7) { c.fillStyle = `rgba(255,120,40,${0.3 + 0.3 * Math.sin(cl.t * 30)})`; c.fillRect(cl.x - 10, WY - 4, 20, 4); } else { const k = Math.min(3, ((cl.t - 0.7) / 0.8 * 4) | 0); for (let j = 0; j < 4; j++) if (L10.has('boom10')) S(c, 'boom10', 'b' + Math.min(3, k + (j > 1 ? 1 : 0)), cl.x + Math.sin(j * 2) * 6, WY - 20 - j * 34, 0.32, { add: 1 }); } }
      for (const f of P.foes) f.draw(c);
      P.drawValera(c);
      if (P.arm) { const a = P.arm, p = clamp(a.t / 0.2, 0, 1), y = L10.lerp(-150, WY + 10, p * p); if (L10.has('arm10')) S(c, 'arm10', p < 1 ? (p < 0.5 ? 'a0' : 'a1') : 'a2', a.x, y, 0.62, { flip: true }); }
      for (const b of P.bul) { if (L10.has('rocketL9')) S9(c, 'rocketL9', 'rocket', b.x, b.y, 0.45, { rot: Math.atan2(b.vy, b.vx) }); else S9(c, 'fxL9', 'rocket', b.x, b.y, 0.45, { rot: Math.atan2(b.vy, b.vx) }); }
      for (const e of P.ebul) e.draw ? e.draw(c, e) : 0;
      for (const f of P.fx) { if (f.k === 'boom' && L10.has('boom10')) S(c, 'boom10', 'b' + Math.min(3, (f.t / f.life * 4) | 0), f.x, f.y, f.s || 0.5, { add: 1 }); if (f.k === 'splash' && L10.has('fx10')) S(c, 'fx10', 'splash', f.x, f.y - 10, f.big ? 0.5 : 0.25, { add: 1, a: 1 - f.t / f.life }); }
      P.W.draw(c);
      if (B.segLimit - B.segT < 25 && B.hp > 0) { c.strokeStyle = `rgba(255,30,30,${0.3 + 0.3 * Math.sin(B.t * 10)})`; c.lineWidth = 6; c.strokeRect(3, 3, 634, 354); }
    },
    drawBeam(c, bm) { const [x0, y0] = bm.from, [x1, y1] = bm.to, a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0); c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x0, y0); c.rotate(a); if (L10.has('fx10')) { const f = L10.fr('fx10', bm.k === 'plasma' ? 'plasma' : 'laser'); c.imageSmoothingEnabled = true; const th = bm.k === 'plasma' ? 30 : 8; c.drawImage(L10.img.fx10, f[0], f[1], f[2], f[3], 0, -th / 2, L, th); } c.restore(); },
    drawTent(c, [x0, y0], [x1, y1]) { const L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0); if (!L10.has('tent10')) return; const f = L10.fr('tent10', 'seg'); c.save(); c.translate(x0, y0); c.rotate(a); c.imageSmoothingEnabled = true; for (let x = 0; x < L - 20; x += 40) c.drawImage(L10.img.tent10, f[0], f[1], f[2], f[3], x, -10 + Math.sin(x * 0.08 + P.t * 6) * 4, 42, 20); c.restore(); S(c, 'tent10', 'sucker', x1, y1, 0.22, { rot: a }); if ((P.t * 10 | 0) % 2) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(120,255,140,0.6)'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x0, y0); c.stroke(); c.restore(); } },
    drawValera(c) {
      if (P.hide) return;
      if (P.inv > 0 && (P.t * 16 | 0) % 2) return;
      const fl = P.dir < 0;
      if (P.climbT > 0) { S(c, 'vSea10', P.climbT > 0.25 ? 'climb0' : 'climb1', P.x, (P.raft ? P.raft.top : WY) + 20, 0.42, { flip: fl }); return; }
      if (P.swim) { S(c, 'vSea10', ((P.t * 3) | 0) % 2 ? 'swim0' : 'swim1', P.x, WY + 18, 0.42, { flip: fl }); return; }
      if (P.gun && P.st === 'stand' && P.aim === 'fwd') { S(c, 'vSea10', P.fireA > 0 ? 'fire' : 'aim', P.x, P.y + 1, 0.5, { flip: fl }); return; }
      let sh = 'vAim9_rocket', fr = P.aim === 'diag' ? 'diag' : P.aim === 'up' ? 'up' : 'stand';
      if (P.st === 'run') { sh = 'vRun9_rocket'; fr = 'r' + ((P.t * 12 | 0) % 8); if (P.aim === 'diag') { sh = 'vRunUD9_rocket'; fr = 'u' + ((P.t * 10 | 0) % 4); } }
      if (P.st === 'jump') { sh = 'vJump9_rocket'; fr = P.vy < -200 ? 'rise' : ['flip1', 'flip2', 'flip3'][(P.t * 9 | 0) % 3]; }
      if (!P.gun) { sh = sh.replace('_rocket', '').replace('vRunUD9', 'vRun9'); if (sh === 'vRun9' && fr[0] === 'u') fr = 'r' + ((P.t * 12 | 0) % 8); if (sh === 'vAim9') fr = 'stand'; }     // до подбора — без оружия
      S9(c, sh, fr, P.x, P.y + 1, 1, { flip: fl });
    },
    drawHud(lv, c) {
      if (P.scared > 0 && L10.has('chSub')) {     // вставка: подводники в ужасе
        const x = 424, y = 48, w = 200, h = 112, a = clamp(Math.min(P.scared, 2.4 - P.scared) * 4, 0, 1);
        c.save(); c.globalAlpha = a; c.fillStyle = '#2a0606'; c.fillRect(x, y, w, h); c.beginPath(); c.rect(x, y, w, h); c.clip();
        const [, sh] = L10.size('chSub', 'sb1'); S(c, 'chSub', 'sb1', x + 62, y + h + 4, 120 / sh); S(c, 'chSub', 'sb3', x + 146, y + h + 4, 120 / sh);
        c.fillStyle = `rgba(255,0,0,${0.12 + 0.08 * Math.sin(P.t * 12)})`; c.fillRect(x, y, w, h); c.restore();
        c.save(); c.globalAlpha = a; c.strokeStyle = '#c9a54a'; c.lineWidth = 2; c.strokeRect(x, y, w, h); c.restore();
      }
      L10.bossBar(c, P.B, P.B.inv ? 'СЕМЁН — ЩИТ! ВЗОРВИ СТАНЦИИ' : 'СЕМЁН');
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(6, 25, 148, 16); G.text(P.gun ? 'ГРАНАТОМЁТ' : 'БЕЗ ОРУЖИЯ', 12, 29, { size: 8, color: P.gun ? '#ffd84a' : '#999' });
    },
  };
})();
