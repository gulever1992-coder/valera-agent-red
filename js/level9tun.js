// Уровень 9, часть A «ПОГОНЯ В ТОННЕЛЕ» (v2 по отзыву владельца): как погоня на байке в Terminator 2D (34–37 мин).
// Один длинный тоннель с трубами. Капсула на магнитной подушке свободно ходит по дороге (вверх/вниз — глубина, влево/вправо — по кадру),
// скорость сама растёт; банды на капсулах и бронегрузовик охраны стреляют, Валера отстреливается вперёд, назад и по диагонали.
// Подъёмы — наклон всей сцены (без рваных кусков пути). Стыки фона не видны: тайлы склеены при сборке, сверху — арки переднего плана.
(() => {
  const S = L9.spr, rnd = L9.rnd, clamp = L9.clamp;
  const Y0 = 262, Y1 = 344;                      // дорога: дальний и ближний край (ноги капсулы)
  const sc = y => 0.8 + 0.2 * (y - Y0) / (Y1 - Y0);   // масштаб по глубине
  const DUR = 152;                               // длительность погони, с
  const speedAt = t => 520 + 520 * clamp(t / 130, 0, 1);   // px/с: разгон 520 -> 1040
  // подъёмы: [t0, t1, наклон]
  const HILLS = [[52, 64, -0.045], [64, 70, 0.035], [104, 116, -0.045], [116, 122, 0.035]];
  const tiltAt = t => { for (const h of HILLS) if (t >= h[0] && t < h[1]) { const k = (t - h[0]) / (h[1] - h[0]); return h[2] * Math.sin(k * Math.PI); } return 0; };
  const CKS = [0, 58, 108];

  // сценарий: [t, что, параметры]
  const SCRIPT = [
    [3, 'bar', { y: 300 }], [6, 'bar', { y: 270 }], [8, 'bar', { y: 330 }], [10, 'gang', { k: 'A', from: 1, y: 280 }], [14, 'gang', { k: 'B', from: -1, y: 320 }],
    [17, 'bar', { y: 300, kind: 'barrel2' }], [19, 'gang', { k: 'C', from: 1, y: 300 }], [22, 'beam', { y: 290 }], [24, 'gang', { k: 'A', from: -1, y: 270 }], [26, 'gang', { k: 'B', from: 1, y: 330 }],
    [29, 'train', { y: 266 }], [33, 'slime', { y: 320 }], [35, 'gang', { k: 'C', from: -1, y: 290 }], [37, 'bar', { y: 270 }], [39, 'train', { y: 266 }], [42, 'gang', { k: 'A', from: 1, y: 300 }], [44, 'gang', { k: 'B', from: 1, y: 270 }],
    [47, 'tv', { line: 'Мистер Валера, зачем эти жалкие попытки? Зачем вы тратите моё время?' }], [50, 'wreck', { y: 300 }],
    [55, 'truck', { hp: 45, leave: 30 }], [58, 'gang', { k: 'C', from: 1, y: 330 }], [63, 'bar', { y: 280, kind: 'barrel2' }], [67, 'gang', { k: 'A', from: 1, y: 300 }], [71, 'slime', { y: 290 }], [74, 'gang', { k: 'B', from: -1, y: 330 }], [78, 'beam', { y: 320 }],
    [86, 'train', { y: 266 }], [90, 'gang', { k: 'A', from: 1, y: 270 }], [92, 'gang', { k: 'C', from: 1, y: 330 }], [95, 'tv', { line: 'Тебе всё равно не накопить на квартиру в столице!' }], [97, 'bar', { y: 300 }], [99, 'bar', { y: 270 }], [100, 'bar', { y: 330 }],
    [106, 'gang', { k: 'B', from: -1, y: 290 }], [110, 'wreck', { y: 280 }], [112, 'gang', { k: 'A', from: 1, y: 320 }], [116, 'train', { y: 266 }], [119, 'gang', { k: 'C', from: -1, y: 300 }],
    [124, 'truck', { hp: 70, final: 1 }], [130, 'gang', { k: 'B', from: 1, y: 330 }], [134, 'bar', { y: 300 }], [138, 'gang', { k: 'A', from: 1, y: 270 }],
  ];
  const HEAL = [30, 66, 103, 130];

  const P = L9.PARTS.tun = {
    deathText: 'КАПСУЛА РАЗБИТА', tvTop: true,
    start(lv, ck) {
      const t0 = CKS[ck] || 0;
      Object.assign(P, { lv, hp: 100, inv: 1.2, t: t0, dist: 0, v: speedAt(t0), x: 170, y: 300, z: 0, vz: 0, fireT: 0, fireA: 0, aim: 'fwd', shots: [], eb: [], fx: [], o: [], si: SCRIPT.findIndex(s => s[0] > t0), hi: HEAL.findIndex(h => h > t0), ck: ck || 0, endT: 0, truck: null, tilt: 0, scroll: { wall: 0, ceil: 0, floor: 0, arch: 0 } });
      if (P.si < 0) P.si = SCRIPT.length; if (P.hi < 0) P.hi = HEAL.length;
      try { Music.play('chase'); } catch (e) {}
      if (!ck) { lv.say('ДВИЖЕНИЕ — СТРЕЛКИ   ПРЫЖОК {jump}', 3.5); P.lv.later = null; P.tut = 1; }
    },
    onDie(lv) { lv.ck = P.ck; Sound.play('boom'); P.boom(P.x, P.y - 30, 1.5); },
    deadUpdate(lv, dt) { P.updFx(dt); },
    boom(x, y, s = 1.2) { P.fx.push({ sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2', 'boom3'], x, y, s, t: 0, life: 0.6, scroll: 1 }); },
    update(lv, dt) {
      const I = G.Input; P.t += dt; P.inv -= dt; P.fireT -= dt; P.fireA -= dt;
      if (P.tut && P.t > 3.6) { P.tut = 0; lv.say('ОГОНЬ ВПЕРЁД {punch}   НАЗАД {throw}   ВВЕРХ: {up}+{punch}', 4); }
      for (let i = 1; i < CKS.length; i++) if (P.t >= CKS[i] && P.ck < i) { P.ck = i; lv.ck = i; lv.say('КОНТРОЛЬНАЯ ТОЧКА', 1.2); }
      // скорость: растёт со временем; {right} — газ (+15 %), {left} — тормоз (−20 %)
      const acc = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0);
      const tv = (P.endT ? 260 : speedAt(P.t)) * (1 + acc * (acc > 0 ? 0.15 : 0.2));
      P.v += (tv - P.v) * Math.min(1, dt * 2); const dd = P.v * dt; P.dist += dd;
      P.scroll.floor += dd; P.scroll.wall += dd * 0.7; P.scroll.ceil += dd * 0.75; P.scroll.arch += dd * 1.6;
      // движение капсулы по дороге (как байк): вверх/вниз — глубина, влево/вправо — положение в кадре
      const ux = acc, uy = (I.held('down') ? 1 : 0) - (I.held('up') ? 1 : 0);
      P.x = clamp(P.x + ux * 240 * dt, 70, 380); if (!ux) P.x += (170 - P.x) * dt * 0.4;
      P.y = clamp(P.y + uy * 150 * dt, Y0, Y1); P.bank = uy;
      if (I.pressed('jump') && P.z <= 0.5) { P.vz = 340; Sound.play('jump'); }
      P.vz -= 1000 * dt; P.z = Math.max(0, P.z + P.vz * dt); if (P.z === 0) P.vz = 0;
      P.tilt += (tiltAt(P.t) - P.tilt) * Math.min(1, dt * 3);
      // огонь: {punch} — вперёд ({up} — по диагонали), {throw} — назад
      const back = I.held('throw'), fire = I.held('punch') || back;
      if (fire && P.fireT <= 0) {
        P.fireT = 0.1; P.fireA = 0.14; P.aim = back ? 'back' : I.held('up') ? 'up' : 'fwd'; Sound.play('shot'); lv.stats.shots++;
        const k = sc(P.y), mx = P.x + (back ? -40 : 46) * k, my = P.y - P.z - 62 * k;
        const a = back ? Math.PI : P.aim === 'up' ? -0.45 : 0;
        P.shots.push({ x: mx, y: my, vx: Math.cos(a) * 1100, vy: Math.sin(a) * 1100, t: 0, gy: P.y });
      }
      // сценарий
      while (P.si < SCRIPT.length && SCRIPT[P.si][0] <= P.t) { P.spawn(SCRIPT[P.si][1], SCRIPT[P.si][2]); P.si++; }
      while (P.hi < HEAL.length && HEAL[P.hi] <= P.t) { P.o.push({ type: 'heal', x: 700, y: rnd(Y0 + 10, Y1 - 10), t: 0, hp: 99 }); P.hi++; }
      P.updObjs(lv, dt); P.updShots(lv, dt); P.updFx(dt);
      if (P.truck && P.truck.final && P.t > DUR + 15) { const q = P.truck; q.dead = true; P.truck = null; for (let i = 0; i < 4; i++) P.boom(q.x + 40 + i * 50, q.y - 60 - i * 15, 1.6); Sound.play('boom'); G.shake(10, 0.6); P.fx.push({ wreck: 'hcop9', fr: 'boom', x: q.x + 120, y: q.y, t: 0, life: 1.4, vx: -400, rot: 0.6 }); lv.say('Бронегрузовик врезался в опору!', 2); }
      if (P.t > DUR && !P.endT && !P.truck) { P.endT = 0.001; lv.say('ВПЕРЕДИ ШЛЮЗ ЛАБОРАТОРИИ...', 2.5); }
      if (P.endT) { P.endT += dt; if (P.endT > 3.2) lv.next(); }
    },
    spawn(what, o) {
      if (what === 'bar' || what === 'beam' || what === 'slime' || what === 'wreck') P.o.push({ type: 'obst', kind: o.kind || ({ bar: 'barrel', beam: 'beam', slime: 'slime', wreck: 'wreck' })[what], x: 700, y: o.y, t: 0, hp: what === 'bar' ? 2 : 99 });
      else if (what === 'gang') {
        const k = o.k, from = o.from;   // from 1 — догоняем спереди (их скорость ниже), -1 — догоняют сзади
        P.o.push({ type: 'gang', kind: 'hen' + k + '9', x: from > 0 ? 700 : -120, y: o.y, ty: o.y, rel: from > 0 ? -rnd(140, 200) : rnd(180, 240), hold: rnd(5, 8), t: 0, hp: 7, cd: rnd(0.6, 1.2), fireA: 0 });
      } else if (what === 'train') { P.o.push({ type: 'train', y: o.y, x: -2200, wt: 1.6, t: 0, hp: 999 }); Sound.play('warn'); }
      else if (what === 'tv') P.o.push({ type: 'tv', x: 700, y: 52, line: o.line, t: 0, hp: 2 });
      else if (what === 'truck') { P.truck = { type: 'truck', x: -320, y: 300, hp: o.hp, max: o.hp, leave: o.leave, final: o.final, t: 0, cd: 2, burst: 0 }; P.o.push(P.truck); Sound.play('warn'); P.lv.say(o.final ? 'БРОНЕГРУЗОВИК! УНИЧТОЖЬ ЕГО — СТРЕЛЯЙ НАЗАД {throw}' : 'СЗАДИ БРОНЕГРУЗОВИК! БЫСТРЕЕ!', 3); }
    },
    ebul(x, y, tx, ty, sp = 420, dmg = 6) { const a = Math.atan2(ty - y, tx - x); P.eb.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, dmg }); },
    hitP(d) { if (P.inv > 0) return; P.lv.hurt(d); },
    updObjs(lv, dt) {
      const k0 = sc(P.y), pb = [P.x - 62 * k0, P.y - P.z - 70 * k0, 124 * k0, 70 * k0];
      for (const q of P.o) {
        q.t += dt; if (q.fl > 0) q.fl -= dt;
        if (q.type === 'obst' || q.type === 'heal' || q.type === 'tv') {
          q.x -= P.v * dt; if (q.x < -150) q.dead = true;
          if (q.type === 'tv') continue;
          const k = sc(q.y), w = (q.kind === 'beam' || q.kind === 'wreck' ? 70 : q.kind === 'slime' ? 50 : 22) * k;
          if (Math.abs(q.x - P.x) < w + 50 * k0 && Math.abs(q.y - P.y) < 16) {
            if (q.type === 'heal') { q.dead = true; P.hp = Math.min(100, P.hp + 30); Sound.play('swig'); lv.say('Кефир! +30', 1.2); lv.stats.food++; }
            else if (P.z < (q.kind === 'slime' ? 6 : 26) && !q.hitP) { q.hitP = 1; if (q.kind === 'slime') { P.y = clamp(P.y + rnd(-40, 40), Y0, Y1); Sound.play('splash'); P.hitP(6); } else if (q.kind.startsWith('barrel')) P.explode(q); else { P.hitP(18); Sound.play('crash'); G.shake(4, 0.2); } }
          }
        } else if (q.type === 'gang') {
          // держатся рядом и стреляют; потом отстают или уходят вперёд
          q.hold -= dt; const tgtX = q.hold > 0 ? clamp(P.x + q.rel, 40, 600) : (q.rel < 0 ? -200 : 800);
          q.x += clamp(tgtX - q.x, -260, 260) * dt * 1.4; if (q.hold <= 0 && (q.x < -180 || q.x > 780)) q.dead = true;
          q.ty += (rnd(-1, 1) * 30) * dt; q.y += clamp((q.hold > 0 ? P.y + Math.sin(q.t * 0.9) * 40 : q.ty) - q.y, -60, 60) * dt; q.y = clamp(q.y, Y0, Y1);
          q.cd -= dt; q.fireA -= dt;
          if (q.cd <= 0 && q.x > -40 && q.x < 660) { q.cd = rnd(1.4, 2.2); q.fireA = 0.25; q.back = P.x < q.x; const k = sc(q.y); P.ebul(q.x + (q.back ? -40 : 40) * k, q.y - 60 * k, P.x, P.y - P.z - 40 * k0); Sound.play('shot', 0.7); }
          // таран
          if (Math.abs(q.x - P.x) < 120 * k0 && Math.abs(q.y - P.y) < 18 && P.z < 30 && (q.ram = (q.ram || 0) - dt) <= 0) { q.ram = 0.8; P.hitP(12); q.hp -= 2; q.y += Math.sign(q.y - P.y || 1) * 30; Sound.play('crash'); G.shake(4, 0.2); if (q.hp <= 0) P.killGang(q); }
        } else if (q.type === 'train') {     // поезд по полосе y: предупреждение 1.6 с, потом обгоняет на огромной скорости
          if (q.wt > 0) { q.wt -= dt; continue; }
          if (!q.go) { q.go = 1; Sound.play('crane'); }
          q.x += 1500 * dt; if (q.x > 900) q.dead = true;
          if (Math.abs(q.y - P.y) < 22 && P.x > q.x && P.x < q.x + 1800 && P.z < 60) { P.hitP(30); P.y = clamp(P.y + (P.y > q.y ? 40 : -40), Y0, Y1); G.shake(8, 0.4); Sound.play('crash'); }
          for (const g of P.o) if (g.type === 'gang' && !g.dead && Math.abs(g.y - q.y) < 22 && g.x > q.x && g.x < q.x + 1800) P.killGang(g);
        } else if (q.type === 'truck') {     // бронегрузовик сзади: подъезжает, очереди из турели; уходит по таймеру или взрывается
          q.leave = q.leave != null ? q.leave - dt : null;
          const tx = q.leave != null && q.leave <= 0 ? -420 : clamp(P.x - 330, -60, 120);
          q.x += clamp(tx - q.x, -140, 140) * dt; q.y += clamp(P.y - q.y, -40, 40) * dt; q.y = clamp(q.y, Y0 + 6, Y1);
          if (q.leave != null && q.leave <= 0 && q.x < -380) { q.dead = true; P.truck = null; continue; }
          q.cd -= dt;
          if (q.cd <= 0) { q.burst = 4; q.cd = rnd(2.6, 3.4); }
          if (q.burst > 0 && (q.bt = (q.bt || 0) - dt) <= 0) { q.bt = 0.12; q.burst--; q.fireA = 0.12; const k = sc(q.y); P.ebul(q.x + 80 * k, q.y - 120 * k, P.x + rnd(-45, 45), P.y - P.z - 40 * k0, 560, 5); Sound.play('shot', 0.8); }
          if (Math.abs(q.x + 120 - P.x) < 90 && Math.abs(q.y - P.y) < 22 && (q.ram = (q.ram || 0) - dt) <= 0) { q.ram = 1; P.hitP(20); P.x += 60; Sound.play('crash'); }
        }
      }
      for (const g of P.o) if (g.type === 'gang' && !g.dead) for (const q of P.o) if (q.type === 'obst' && !q.dead && q.kind.startsWith('barrel') && Math.abs(q.x - g.x) < 60 && Math.abs(q.y - g.y) < 16) { P.explode(q); P.killGang(g); }
      P.o = P.o.filter(q => !q.dead);
      for (const e of P.eb) { e.t += dt; e.x += e.vx * dt; e.y += e.vy * dt; if (e.x > pb[0] && e.x < pb[0] + pb[2] && e.y > pb[1] && e.y < pb[1] + pb[3]) { e.dead = true; P.hitP(e.dmg); P.fx.push({ sh: 'fxA9', fr: ['spark'], x: e.x, y: e.y, s: 0.5, t: 0, life: 0.12 }); } if (e.t > 2 || e.x < -40 || e.x > 680) e.dead = true; }
      P.eb = P.eb.filter(e => !e.dead);
    },
    explode(q) { q.dead = true; P.boom(q.x, q.y - 30); Sound.play('boom'); G.shake(5, 0.3); P.lv.score += 100; if (Math.abs(q.x - P.x) < 90 && Math.abs(q.y - P.y) < 30 && P.z < 40) P.hitP(20); P.o.push({ type: 'fire', x: q.x, y: q.y, t: 0, life: 1.5 }); },
    killGang(q) { if (q.dead) return; q.dead = true; P.lv.stats.kills++; P.lv.score += 300; Sound.play('crash'); P.fx.push({ wreck: q.kind, x: q.x, y: q.y, t: 0, life: 0.9, vx: -P.v * 0.6, rot: rnd(-4, 4) }); },
    updShots(lv, dt) {
      for (const s of P.shots) {
        s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
        for (const q of P.o) {
          if (s.dead || q.dead || q.hp >= 99) continue;
          const k = sc(q.y), box = q.type === 'gang' ? [q.x - 70 * k, q.y - 80 * k, 140 * k, 80 * k] : q.type === 'truck' ? [q.x - 20, q.y - 150 * k, 280 * k, 150 * k] : q.type === 'tv' ? [q.x - 28, q.y - 26, 56, 52] : [q.x - 20 * k, q.y - 56 * k, 40 * k, 56 * k];
          if (q.type !== 'tv' && Math.abs(q.y - s.gy) > 40 && q.type !== 'truck') continue;   // пуля летит на своей глубине
          if (s.x > box[0] && s.x < box[0] + box[2] && s.y > box[1] && s.y < box[1] + box[3]) {
            s.dead = true; q.hp--; q.fl = 0.07; lv.stats.hits++; P.fx.push({ sh: 'fxA9', fr: ['spark'], x: s.x, y: s.y, s: 0.5, t: 0, life: 0.1 });
            if (q.hp <= 0) {
              if (q.type === 'gang') P.killGang(q);
              else if (q.type === 'obst') P.explode(q);
              else if (q.type === 'tv') { q.type = 'tvBroken'; q.hp = 99; Sound.play('glass'); lv.score += 150; if (!P.tvBroke) { P.tvBroke = 1; lv.xsay('Я устал прощать.', 3); } }
              else if (q.type === 'truck') { q.dead = true; P.truck = null; lv.score += 2000; for (let i = 0; i < 4; i++) P.boom(q.x + 40 + i * 50, q.y - 60 - i * 15, 1.6); Sound.play('boom'); G.shake(10, 0.6); P.fx.push({ wreck: 'hcop9', fr: 'boom', x: q.x + 120, y: q.y, t: 0, life: 1.4, vx: -400, rot: 0.6 }); lv.say(q.final ? 'БРОНЕГРУЗОВИК УНИЧТОЖЕН!' : 'Отстал, железяка!', 2); }
            } else if (q.type === 'gang' && Math.random() < 0.4) Sound.play('hit');
          }
        }
        if (s.x < -20 || s.x > 660 || s.y < -20) s.dead = true;
      }
      P.shots = P.shots.filter(s => !s.dead);
    },
    updFx(dt) { for (const f of P.fx) { f.t += dt; if (f.vx) f.x += f.vx * dt; if (f.scroll) f.x -= (P.v || 0) * dt * 0.6; } P.fx = P.fx.filter(f => f.t < f.life); for (const q of P.o || []) if (q.type === 'fire') { q.x -= P.v * dt; if ((q.life -= dt) <= 0) q.dead = true; } },
    // ---------- отрисовка ----------
    draw(lv, c) {
      c.fillStyle = '#04070a'; c.fillRect(0, 0, 640, 360);
      c.save(); c.translate(320, 300); c.rotate(P.tilt); if (P.tilt) { const z = 1 + Math.abs(P.tilt) * 2.4; c.scale(z, z); } c.translate(-320, -300);
      P.layer(c, 'tunWall', P.scroll.wall, 0, 250);      // дальняя стена с трубами (0.55)
      P.layer(c, 'tunCeil', P.scroll.ceil, -6, 150);     // свод с трубами (0.75)
      P.layer(c, 'tunFloor', P.scroll.floor, 216, 154);  // пол с магнитной полосой (1.0)
      // по глубине: дальние раньше
      const items = [];
      for (const q of P.o) items.push([q.type === 'train' ? q.y - 1 : q.y, () => P.drawObj(c, q)]);
      items.push([P.y + 0.5, () => P.drawCap(c)]);
      for (const f of P.fx) if (f.wreck) items.push([f.y, () => S(c, f.wreck, f.fr || 'run', f.x, f.y - Math.sin(f.t / f.life * Math.PI) * 30, sc(clamp(f.y, Y0, Y1)), { rot: f.t * f.rot, a: clamp((f.life - f.t) / 0.3, 0, 1) })]);
      items.sort((a, b) => a[0] - b[0]); for (const it of items) it[1]();
      for (const f of P.fx) if (!f.wreck) { const i = Math.min(f.fr.length - 1, f.t / f.life * f.fr.length | 0); S(c, f.sh, f.fr[i], f.x, f.y, f.s); }
      for (const s of P.shots) S(c, 'fxL9', 'tracer', s.x, s.y, 0.4, { rot: Math.atan2(s.vy, s.vx) });
      for (const e of P.eb) S(c, 'fxL9', 'fireball', e.x, e.y, 0.24, { rot: Math.atan2(e.vy, e.vx) });
      for (const q of P.o) if (q.type === 'train' && q.wt > 0 && (q.t * 6 | 0) % 2) S(c, 'prop9', 'lampOn', 16, q.y - 40, 0.8);
      P.drawArches(c);
      c.restore();
      if (P.truck && !P.truck.dead) { const b = P.truck; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(220, 26, 200, 14); c.fillStyle = '#501'; c.fillRect(223, 29, 194, 8); c.fillStyle = '#e33'; c.fillRect(223, 29, 194 * clamp(b.hp / b.max, 0, 1), 8); G.text('БРОНЕГРУЗОВИК', 320, 29, { align: 'center', size: 8 }); }
      if (P.endT) { c.fillStyle = `rgba(0,0,0,${clamp((P.endT - 1.6) / 1.4, 0, 1)})`; c.fillRect(0, 0, 640, 360); }
    },
    // слой тоннеля: бесшовный тайл (склеен при сборке), ширина по пропорции
    layer(c, name, off, y, h) {
      const im = L9.img[name]; if (!im) return; const w = im.width / im.height * h, x0 = -((off % w) + w) % w;
      for (let x = x0 - w; x < 700; x += w) c.drawImage(im, Math.floor(x), y, Math.ceil(w) + 1, h);
    },
    drawArches(c) {   // передний план: опорные арки и трубы проносятся мимо (1.6) — ощущение скорости
      const step = 700, off = P.scroll.arch, i0 = Math.floor(off / step), names = ['rib', 'glass', 'rib', 'pillar'], s = 0.95;
      for (let i = i0 - 1; i <= i0 + 2; i++) {
        const x = i * step - off + 300, n = names[((i % names.length) + names.length) % names.length], w = L9.size('arch9', n)[0] * s;
        const over = xx => Math.abs(xx - P.x) < w / 2 + 50 ? 0.4 : 1;     // колонна над капсулой — полупрозрачная, игрок всегда виден
        if (n === 'rib') { S(c, 'arch9', n, x, 380, s, { a: over(x) }); const f = L9D.arch9.f[L9.fi('arch9', n)], dx = 2 * (f[2] - f[4]) * 0.5 * s - 2; S(c, 'arch9', n, x + dx, 380, s, { flip: 1, a: over(x + dx) }); }   // целая арка из двух зеркальных половин
        else S(c, 'arch9', n, x, 380, s, { a: over(x) });
      }
    },
    drawObj(c, q) {
      const k = sc(clamp(q.y, Y0, Y1)), a = 1;
      if (q.type === 'obst') { S(c, 'props8', 'shadow', q.x, q.y, 0.4 * k, { a: 0.4 }); S(c, 'hbar9', q.kind, q.x, q.y + 2, k, { a }); return; }
      if (q.type === 'fire') { S(c, 'fxA9', 'fire' + ((q.t * 10 | 0) % 4), q.x, q.y - 14, 0.9 * k); return; }
      if (q.type === 'heal') { S(c, 'props8', 'shadow', q.x, q.y, 0.25 * k, { a: 0.4 }); S(c, 'pick9', 'kefir', q.x, q.y - 14 + Math.sin(q.t * 5) * 3, 0.9 * k); return; }
      if (q.type === 'tv' || q.type === 'tvBroken') { S(c, 'tv9', q.type === 'tvBroken' ? ((q.t * 3 | 0) % 2 ? 'broken' : 'smoke') : q.x > 560 ? 'noise' : 'x' + ((q.t * 6 | 0) % 4), q.x, q.y, 1); if (q.type === 'tv' && q.x < 560 && !q.said) { q.said = 1; P.lv.xsay(q.line); } return; }
      if (q.type === 'gang') { S(c, 'props8', 'shadow', q.x, q.y + 2, 0.75 * k, { a: 0.45 }); S(c, q.kind, q.fireA > 0 ? (q.back ? 'fireBack' : 'fire') : 'run', q.x, q.y - 4 + Math.sin(q.t * 7) * 2, k, { a }); if (q.fl > 0) S(c, q.kind, q.fireA > 0 ? (q.back ? 'fireBack' : 'fire') : 'run', q.x, q.y - 4 + Math.sin(q.t * 7) * 2, k, { add: 1, a: 0.5 }); return; }
      if (q.type === 'train') { if (q.wt > 0) return; const kk = 1.6 * k, step = 366 * kk - 3; ['tail', 'wagon', 'wagon', 'wagon', 'loco'].forEach((p, i) => S(c, 'train9', p, q.x + step * i + step / 2, q.y + 6, kk)); return; }
      if (q.type === 'truck') { S(c, 'props8', 'shadow', q.x + 120 * k, q.y + 2, 1.4 * k, { a: 0.45 }); S(c, 'hcop9', q.hp < q.max * 0.35 ? 'dmg' : q.fireA > 0 ? 'fire' : 'run', q.x + 120 * k, q.y - 4 + Math.sin(q.t * 6) * 2, k, { a }); if (q.fl > 0) S(c, 'hcop9', 'run', q.x + 120 * k, q.y - 4 + Math.sin(q.t * 6) * 2, k, { add: 1, a: 0.45 }); }
    },
    drawCap(c) {
      const k = sc(P.y), y = P.y - P.z;
      S(c, 'props8', 'shadow', P.x, P.y + 2, (0.8 - Math.min(0.4, P.z / 250)) * k, { a: 0.5 });
      let fr = P.fireA > 0 ? (P.aim === 'back' ? 'fireBack' : P.aim === 'up' ? 'fireUp' : 'fire') : P.bank < 0 ? 'bankUp' : P.bank > 0 ? 'bankDown' : 'run';
      if (P.inv > 0.5 && P.lv.stats.dmg) fr = 'hit';
      const blink = P.inv > 0 && (P.t * 14 | 0) % 2;
      S(c, 'hcap9', fr, P.x, y - 4 + Math.sin(P.t * 9) * 1.5, k, { a: blink ? 0.5 : 1 });
    },
    drawHud(lv, c) {
      const k = clamp(P.t / DUR, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(220, 6, 200, 16); c.fillStyle = '#123'; c.fillRect(223, 15, 194, 4); c.fillStyle = '#3cf'; c.fillRect(223, 15, 194 * k, 4);
      G.text('ДО ЛАБОРАТОРИИ', 320, 7, { align: 'center', size: 8, color: '#9cf' });
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(6, 25, 96, 14); G.text(Math.round(P.v / 4) + ' КМ/Ч', 12, 28, { size: 8, color: P.v > 850 ? '#ff6a4a' : P.v > 650 ? '#ffd84a' : '#fff' });
      if (P.truck && P.truck.x > P.x - 300 && (P.t * 3 | 0) % 2) G.text('БЫСТРЕЕ! >>>', 320, 60, { align: 'center', size: 16, color: '#ff4a3a', outline: true });
    },
  };
  L9.TUN = { DUR, speedAt, Y0, Y1 };
})();
