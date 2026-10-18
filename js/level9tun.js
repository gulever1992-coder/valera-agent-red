// Уровень 9, часть A «ПОГОНЯ В ТОННЕЛЕ» (v3 по отзыву владельца): как погоня на байке в Terminator 2D (34–37 мин).
// Один длинный тоннель с трубами, ~1:20. Валера разбил стекло своей капсулы на магнитной подушке и стреляет из автомата вперёд, назад и вверх.
// Капсулы со спящими (анабиоз) бомжами, алкашами и гопниками — мирные: в них главное не врезаться. Враги — киберзаводчане
// на бронетехнике: ховербайки, малые БТР, тележки с бомбистами и тяжёлый БТР охраны. Поезд везёт капсулы со спящими.
// Подъёмы — наклон всей сцены. Стыки фона не видны: тайлы склеены при сборке, передний план — арка и колонны во всю высоту экрана.
(() => {
  const S = L9.spr, rnd = L9.rnd, clamp = L9.clamp;
  const Y0 = 262, Y1 = 344;                      // дорога: дальний и ближний край (низ капсулы)
  const sc = y => 0.8 + 0.2 * (y - Y0) / (Y1 - Y0);   // масштаб по глубине
  const DUR = 76;                                // длительность погони, с (вдвое короче v2)
  const speedAt = t => 560 + 560 * clamp(t / 60, 0, 1);   // px/с: разгон 560 -> 1120
  const HILLS = [[24, 30, -0.045], [30, 33, 0.035], [52, 58, -0.045], [58, 61, 0.035]];   // подъёмы: [t0, t1, наклон]
  const tiltAt = t => { for (const h of HILLS) if (t >= h[0] && t < h[1]) { const k = (t - h[0]) / (h[1] - h[0]); return h[2] * Math.sin(k * Math.PI); } return 0; };
  const CKS = [0, 26, 50];
  const BTR_K = 1.5, BTR_OFF = 100;     // БТР крупнее (стрелок в башне ростом с Валеру), стоит левее, чтобы нос не наезжал
  const CYB = {   // враги-киберзаводчане: лист, здоровье, оружие
    bike: { sh: 'cybA9', hp: 8, gun: 'smg', sz: 1.9 }, apc: { sh: 'cybB9', hp: 16, gun: 'mg', sz: 1.2 }, cart: { sh: 'cybC9', hp: 10, gun: 'bomb', sz: 1.4 },     // sz — чтобы люди в машинах были ростом с Валеру
  };

  // сценарий: [t, что, параметры]; sleep — мирная капсула со спящим (from 1 — обгоняем, -1 — обгоняет нас)
  const SCRIPT = [
    [2, 'bar', { y: 300 }], [4, 'sleep', { k: 'A', from: 1, y: 280 }], [6, 'cyb', { k: 'bike', from: 1, y: 320 }], [8, 'bar', { y: 270 }],
    [9, 'sleep', { k: 'B', from: -1, y: 330 }], [11, 'cyb', { k: 'bike', from: -1, y: 290 }], [13, 'beam', { y: 300 }], [14, 'sleep', { k: 'C', from: 1, y: 300 }],
    [15, 'train', { y: 266 }], [17, 'cyb', { k: 'apc', from: 1, y: 330 }], [19, 'bar', { y: 320, kind: 'barrel2' }], [20, 'sleep', { k: 'A', from: 1, y: 270 }],
    [22, 'tv', { line: 'Мистер Валера, зачем эти жалкие попытки? Зачем вы тратите моё время?' }], [23, 'cyb', { k: 'cart', from: 1, y: 290 }],
    [27, 'btr', { hp: 70, leave: 16 }], [29, 'sleep', { k: 'B', from: 1, y: 320 }], [31, 'bar', { y: 280 }], [32, 'cyb', { k: 'cart', from: -1, y: 270 }], [33, 'cyb', { k: 'bike', from: 1, y: 300 }],
    [35, 'slime', { y: 310 }], [37, 'train', { y: 266 }], [38, 'sleep', { k: 'C', from: -1, y: 290 }], [40, 'cyb', { k: 'apc', from: -1, y: 300 }],
    [42, 'wreck', { y: 330 }], [44, 'cyb', { k: 'cart', from: 1, y: 320 }], [46, 'tv', { line: 'Тебе всё равно не накопить на квартиру в столице!' }],
    [47, 'bar', { y: 300 }], [47.5, 'cyb', { k: 'bike', from: 1, y: 290 }], [48, 'bar', { y: 270 }], [49, 'sleep', { k: 'A', from: 1, y: 330 }], [52, 'cyb', { k: 'bike', from: -1, y: 280 }],
    [55, 'train', { y: 266 }], [56, 'sleep', { k: 'B', from: 1, y: 300 }], [58, 'btr', { hp: 110, final: 1 }], [62, 'cyb', { k: 'bike', from: 1, y: 320 }],
    [65, 'bar', { y: 290 }], [66, 'cyb', { k: 'apc', from: -1, y: 300 }], [67, 'sleep', { k: 'C', from: 1, y: 330 }], [69, 'cyb', { k: 'cart', from: 1, y: 280 }],
  ];
  const HEAL = [21, 43, 63];

  const P = L9.PARTS.tun = {
    deathText: 'КАПСУЛА РАЗБИТА', tvTop: true,
    start(lv, ck) {
      const t0 = CKS[ck] || 0;
      Object.assign(P, { lv, hp: 100, inv: 1.2, t: t0, dist: 0, v: speedAt(t0), x: 170, y: 300, z: 0, vz: 0, fireT: 0, fireA: 0, aim: 'fwd', shots: [], eb: [], fx: [], o: [], si: SCRIPT.findIndex(s => s[0] > t0), hi: HEAL.findIndex(h => h > t0), ck: ck || 0, endT: 0, truck: null, tilt: 0, scroll: { wall: 0, ceil: 0, floor: 0, arch: 0 } });
      if (P.si < 0) P.si = SCRIPT.length; if (P.hi < 0) P.hi = HEAL.length;
      try { Music.play('chase'); } catch (e) {}
      if (!ck) { lv.say('ДВИЖЕНИЕ — СТРЕЛКИ   ПРЫЖОК {jump}', 3.5); P.tut = 1; }
    },
    onDie(lv) { lv.ck = P.ck; Sound.play('boom'); P.boom(P.x, P.y - 30, 1.5); },
    deadUpdate(lv, dt) { P.updFx(dt); },
    boom(x, y, s = 1.2) { P.fx.push({ sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2', 'boom3'], x, y, s, t: 0, life: 0.6, scroll: 1 }); },
    update(lv, dt) {
      const I = G.Input; P.t += dt; P.inv -= dt; P.fireT -= dt; P.fireA -= dt;
      if (P.tut && P.t > 3.6) { P.tut = 0; lv.say('ОГОНЬ ВПЕРЁД {punch}   НАЗАД {throw}   ВВЕРХ: {up}+{punch}   НЕ ВРЕЖЬСЯ В КАПСУЛЫ СО СПЯЩИМИ!', 4.5); }
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
      // огонь из автомата через разбитое стекло: {punch} — вперёд ({up} — по диагонали), {throw} — назад
      const back = I.held('throw'), fire = I.held('punch') || back;
      if (fire && P.fireT <= 0) {
        P.fireT = 0.1; P.fireA = 0.14; P.aim = back ? 'back' : I.held('up') ? 'up' : 'fwd'; Sound.play('shot'); lv.stats.shots++;
        const k = sc(P.y), mz = P.MUZ[P.aim], mx = P.x + mz[0] * k, my = P.y - P.z - mz[1] * k;
        const a = back ? Math.PI : P.aim === 'up' ? -0.45 : 0;
        P.shots.push({ x: mx, y: my, vx: Math.cos(a) * 1100, vy: Math.sin(a) * 1100, t: 0, gy: P.y });
      }
      while (P.si < SCRIPT.length && SCRIPT[P.si][0] <= P.t) { P.spawn(SCRIPT[P.si][1], SCRIPT[P.si][2]); P.si++; }
      while (P.hi < HEAL.length && HEAL[P.hi] <= P.t) { P.o.push({ type: 'heal', x: 700, y: rnd(Y0 + 10, Y1 - 10), t: 0, hp: 99 }); P.hi++; }
      P.updObjs(lv, dt); P.updShots(lv, dt); P.updFx(dt);
      if (P.truck && P.truck.final && P.t > DUR + 4) { P.killBtr(P.truck); lv.say('БТР врезался в опору!', 2); }
      if (P.t > DUR && !P.endT && !P.truck) { P.endT = 0.001; lv.say('ВПЕРЕДИ ШЛЮЗ ЛАБОРАТОРИИ...', 2.5); }
      if (P.endT) { P.endT += dt; if (P.endT > 3.2) lv.next(); }
    },
    // ствол автомата Валеры для каждого прицела: [x, высота над низом капсулы] при масштабе 1
    MUZ: { fwd: [70, 92], back: [-66, 92], up: [52, 112] },
    spawn(what, o) {
      if (what === 'bar' || what === 'beam' || what === 'slime' || what === 'wreck') P.o.push({ type: 'obst', kind: o.kind || ({ bar: 'barrel', beam: 'beam', slime: 'slime', wreck: 'wreck' })[what], x: 700, y: o.y, t: 0, hp: what === 'bar' ? 2 : 99 });
      else if (what === 'sleep') P.o.push({ type: 'sleep', kind: o.k, x: o.from > 0 ? 700 : -160, y: o.y, ty: o.y, vx: o.from > 0 ? -rnd(170, 240) : rnd(150, 210), t: 0, hp: 99, cr: 0 });
      else if (what === 'cyb') { const d = CYB[o.k]; P.o.push({ type: 'cyb', kind: o.k, sh: d.sh, sz: d.sz || 1, gun: d.gun, x: o.from > 0 ? 700 : -140, y: o.y, ty: o.y, rel: (o.from > 0 ? rnd(120, 200) : -rnd(150, 210)) * (0.6 + 0.4 * (d.sz || 1)), hold: rnd(6, 9), t: 0, hp: d.hp, cd: rnd(0.8, 1.4), fireA: 0 }); }
      else if (what === 'train') { P.o.push({ type: 'train', y: o.y, x: -2200, wt: 1.6, t: 0, hp: 999 }); Sound.play('warn'); }
      else if (what === 'tv') P.o.push({ type: 'tv', x: 700, y: 52, line: o.line, t: 0, hp: 2 });
      else if (what === 'btr') { P.truck = { type: 'btr', x: -360, y: 300, hp: o.hp, max: o.hp, leave: o.leave, final: o.final, t: 0, cd: 2, burst: 0 }; P.o.push(P.truck); Sound.play('warn'); P.lv.say(o.final ? 'БТР ОХРАНЫ! УНИЧТОЖЬ ЕГО — СТРЕЛЯЙ НАЗАД {throw}' : 'СЗАДИ БТР! БЫСТРЕЕ!', 3); }
    },
    ebul(x, y, tx, ty, sp = 440, dmg = 6) { const a = Math.atan2(ty - y, tx - x); P.eb.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, dmg }); },
    bomb(x, y) {   // бомба бомбиста: летит дугой в точку, где сейчас Валера, и взрывается на полу
      const tx = P.x + rnd(-30, 30) + P.v * 0, ty = clamp(P.y + rnd(-12, 12), Y0, Y1), T = 0.9;
      P.eb.push({ bomb: 1, x, y, x0: x, y0: y, tx, ty, T, t: 0, dmg: 16 });
    },
    hitP(d) { if (P.inv > 0) return; P.lv.hurt(d); },
    updObjs(lv, dt) {
      const k0 = sc(P.y), pb = [P.x - 56 * k0, P.y - P.z - 96 * k0, 112 * k0, 70 * k0];
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
        } else if (q.type === 'sleep') {     // мирная капсула: плывёт своей скоростью, слегка виляет; опасно только столкновение
          q.x += q.vx * dt; if (q.x < -220 || q.x > 860) q.dead = true;
          q.ty += rnd(-1, 1) * 20 * dt; q.y = clamp(q.y + clamp(q.ty - q.y, -20, 20) * dt, Y0 + 8, Y1);
          if (Math.abs(q.x - P.x) < 104 * k0 && Math.abs(q.y - P.y) < 15 && P.z < 34 && (q.ram = (q.ram || 0) - dt) <= 0) {
            q.ram = 1; q.cr = 1; P.hitP(10); Sound.play('glass'); G.shake(4, 0.2);
            const s = Math.sign(P.y - q.y) || 1; P.y = clamp(P.y + s * 26, Y0, Y1); q.ty = clamp(q.y - s * 30, Y0 + 8, Y1);
          }
        } else if (q.type === 'cyb') {     // киберзаводчане: держатся рядом и стреляют, потом уходят
          q.hold -= dt; const tgtX = q.hold > 0 ? clamp(P.x + q.rel, 30, 610) : (q.rel > 0 ? 820 : -220);
          q.x += clamp(tgtX - q.x, -300, 300) * dt * 1.5; if (q.hold <= 0 && (q.x < -200 || q.x > 800)) q.dead = true;
          q.y += clamp((q.hold > 0 ? P.y + Math.sin(q.t * 0.8 + q.rel) * 36 : q.ty) - q.y, -60, 60) * dt; q.y = clamp(q.y, Y0, Y1);
          q.cd -= dt; q.fireA -= dt;
          if (q.cd <= 0 && q.x > -30 && q.x < 650) {
            const k = sc(q.y) * q.sz; q.back = P.x < q.x; q.fireA = 0.3;
            if (q.gun === 'bomb') { q.cd = rnd(1.7, 2.3); P.bomb(q.x + (q.back ? -30 : 30) * k, q.y - 90 * k); Sound.play('throw'); }
            else { q.cd = q.gun === 'mg' ? rnd(0.9, 1.3) : rnd(1.1, 1.6); P.ebul(q.x + (q.back ? -60 : 60) * k, q.y - 80 * k, P.x + rnd(-20, 20), P.y - P.z - 60 * k0 + rnd(-18, 18)); Sound.play('shot', 0.7); }
          }
          if (Math.abs(q.x - P.x) < 96 * k0 * (0.5 + 0.5 * q.sz) && Math.abs(q.y - P.y) < 15 && P.z < 30 && (q.ram = (q.ram || 0) - dt) <= 0) { q.ram = 1.2; P.hitP(8); q.hp -= 2; q.y += Math.sign(q.y - P.y || 1) * 30; Sound.play('crash'); G.shake(4, 0.2); if (q.hp <= 0) P.killCyb(q); }
        } else if (q.type === 'train') {     // поезд с капсулами спящих по дальней полосе: предупреждение 1.6 с, потом обгоняет
          if (q.wt > 0) { q.wt -= dt; continue; }
          if (!q.go) { q.go = 1; Sound.play('crane'); }
          q.x += 1500 * dt; if (q.x > 900) q.dead = true;
          if (Math.abs(q.y - P.y) < 22 && P.x > q.x && P.x < q.x + 1800 && P.z < 60) { P.hitP(30); P.y = clamp(P.y + (P.y > q.y ? 40 : -40), Y0, Y1); G.shake(8, 0.4); Sound.play('crash'); }
          for (const g of P.o) if (g.type === 'cyb' && !g.dead && Math.abs(g.y - q.y) < 22 && g.x > q.x && g.x < q.x + 1800) P.killCyb(g);
        } else if (q.type === 'btr') {     // тяжёлый БТР сзади: подъезжает, очереди из турели; уходит по таймеру или взрывается
          q.leave = q.leave != null ? q.leave - dt : null;
          const tx = q.leave != null && q.leave <= 0 ? -480 - BTR_OFF : clamp(P.x - 480 - BTR_OFF, -200 - BTR_OFF, -BTR_OFF);
          q.x += clamp(tx - q.x, -140, 140) * dt; q.y += clamp(P.y - q.y, -40, 40) * dt; q.y = clamp(q.y, Y0 + 6, Y1);
          if (q.leave != null && q.leave <= 0 && q.x < -440 - BTR_OFF) { q.dead = true; P.truck = null; continue; }
          q.cd -= dt;
          if (q.cd <= 0) { q.burst = 4; q.cd = rnd(2.6, 3.4); }
          q.fireA = (q.fireA || 0) - dt;
          if (q.burst > 0 && (q.bt = (q.bt || 0) - dt) <= 0) { q.bt = 0.14; q.burst--; q.fireA = 0.07; const k = sc(q.y) * BTR_K; P.ebul(q.x + 237 * k, q.y - 166 * k, P.x + rnd(-45, 45), P.y - P.z - 60 * k0, 560, 5); Sound.play('shot', 0.8); }
          if (Math.abs(q.x + 310 * sc(q.y) * BTR_K - P.x) < 60 && Math.abs(q.y - P.y) < 22 && (q.ram = (q.ram || 0) - dt) <= 0) { q.ram = 1; P.hitP(20); P.x += 60; Sound.play('crash'); }
        }
      }
      for (const g of P.o) if ((g.type === 'cyb') && !g.dead) for (const q of P.o) if (q.type === 'obst' && !q.dead && q.kind.startsWith('barrel') && Math.abs(q.x - g.x) < 60 && Math.abs(q.y - g.y) < 16) { P.explode(q); P.killCyb(g); }
      P.o = P.o.filter(q => !q.dead);
      for (const e of P.eb) {
        e.t += dt;
        if (e.bomb) {   // дуга к точке падения, взрыв на полу
          const u = Math.min(1, e.t / e.T); e.x = e.x0 + (e.tx - e.x0) * u - P.v * 0 * e.t; e.y = e.y0 + (e.ty - e.y0) * u - Math.sin(u * Math.PI) * 70;
          if (u >= 1) { e.dead = true; P.boom(e.tx, e.ty - 20, 1); Sound.play('boom'); if (Math.abs(e.tx - P.x) < 56 && Math.abs(e.ty - P.y) < 20 && P.z < 30) P.hitP(e.dmg); }
          continue;
        }
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (e.x > pb[0] && e.x < pb[0] + pb[2] && e.y > pb[1] && e.y < pb[1] + pb[3]) { e.dead = true; P.hitP(e.dmg); P.fx.push({ sh: 'fxA9', fr: ['spark'], x: e.x, y: e.y, s: 0.5, t: 0, life: 0.12 }); }
        if (e.t > 2 || e.x < -40 || e.x > 680) e.dead = true;
      }
      P.eb = P.eb.filter(e => !e.dead);
    },
    explode(q) { q.dead = true; P.boom(q.x, q.y - 30); Sound.play('boom'); G.shake(5, 0.3); P.lv.score += 100; if (Math.abs(q.x - P.x) < 90 && Math.abs(q.y - P.y) < 30 && P.z < 40) P.hitP(20); P.o.push({ type: 'fire', x: q.x, y: q.y, t: 0, life: 1.5 }); },
    killCyb(q) { if (q.dead) return; q.dead = true; P.lv.stats.kills++; P.lv.score += 300; Sound.play('crash'); P.boom(q.x, q.y - 40, 1); P.fx.push({ wreck: q.sh, sz: q.sz, x: q.x, y: q.y, t: 0, life: 0.9, vx: -P.v * 0.6, rot: rnd(-0.5, 0.5) }); },
    killBtr(q) { q.dead = true; P.truck = null; P.lv.score += 2000; for (let i = 0; i < 4; i++) P.boom(q.x + (60 + i * 60) * BTR_K, q.y - (60 + i * 15) * BTR_K, 1.6); Sound.play('boom'); G.shake(10, 0.6); P.fx.push({ wreck: 'btr9', sz: BTR_K, fr: 'boom', x: q.x + 140 * BTR_K, y: q.y, t: 0, life: 1.4, vx: -400, rot: 0.4 }); },
    updShots(lv, dt) {
      for (const s of P.shots) {
        s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
        for (const q of P.o) {
          if (s.dead || q.dead || q.hp >= 99) continue;    // капсулы со спящими (hp 99) пули не задевают
          const k = sc(q.y), box = q.type === 'cyb' ? [q.x - 70 * k * q.sz, q.y - 110 * k * q.sz, 140 * k * q.sz, 106 * k * q.sz] : q.type === 'btr' ? [q.x, q.y - 160 * k * BTR_K, 300 * k * BTR_K, 160 * k * BTR_K] : q.type === 'tv' ? [q.x - 28, q.y - 26, 56, 52] : [q.x - 20 * k, q.y - 56 * k, 40 * k, 56 * k];
          if (q.type !== 'tv' && Math.abs(q.y - s.gy) > 40 && q.type !== 'btr') continue;   // пуля летит на своей глубине
          if (s.x > box[0] && s.x < box[0] + box[2] && s.y > box[1] && s.y < box[1] + box[3]) {
            s.dead = true; q.hp--; q.fl = 0.07; lv.stats.hits++; P.fx.push({ sh: 'fxA9', fr: ['spark'], x: s.x, y: s.y, s: 0.5, t: 0, life: 0.1 });
            if (q.hp <= 0) {
              if (q.type === 'cyb') P.killCyb(q);
              else if (q.type === 'obst') P.explode(q);
              else if (q.type === 'tv') { q.type = 'tvBroken'; q.hp = 99; Sound.play('glass'); lv.score += 150; if (!P.tvBroke) { P.tvBroke = 1; lv.xsay('Я устал прощать.', 3); } }
              else if (q.type === 'btr') { P.killBtr(q); lv.say(q.final ? 'БТР УНИЧТОЖЕН!' : 'Отстал, железяка!', 2); }
            } else if (q.type === 'cyb' && Math.random() < 0.4) Sound.play('hit');
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
      P.layer(c, 'tunWall', P.scroll.wall, 0, 250);      // дальняя стена с трубами
      P.layer(c, 'tunCeil', P.scroll.ceil, -6, 150);     // свод с трубами
      P.layer(c, 'tunFloor', P.scroll.floor, 216, 154);  // пол с магнитной полосой
      const items = [];
      for (const q of P.o) items.push([q.type === 'train' ? q.y - 1 : q.y, () => P.drawObj(c, q)]);
      items.push([P.y + 0.5, () => P.drawCap(c)]);
      for (const f of P.fx) if (f.wreck) items.push([f.y, () => S(c, f.wreck, f.fr || 'run', f.x, f.y - Math.sin(f.t / f.life * Math.PI) * 30, sc(clamp(f.y, Y0, Y1)) * (f.sz || 1), { rot: f.t * f.rot, a: clamp((f.life - f.t) / 0.3, 0, 1) })]);
      items.sort((a, b) => a[0] - b[0]); for (const it of items) it[1]();
      for (const f of P.fx) if (!f.wreck) { const i = Math.min(f.fr.length - 1, f.t / f.life * f.fr.length | 0); S(c, f.sh, f.fr[i], f.x, f.y, f.s); }
      for (const s of P.shots) S(c, 'fxL9', 'tracer', s.x, s.y, 0.4, { rot: Math.atan2(s.vy, s.vx) });
      for (const e of P.eb) {
        if (e.bomb) { S(c, 'props8', 'shadow', e.tx, e.ty, 0.3, { a: 0.35 + 0.4 * Math.min(1, e.t / e.T) }); S(c, 'pick9', 'grenades', e.x, e.y, 0.3, { rot: e.t * 12 }); }
        else S(c, 'fxL9', 'fireball', e.x, e.y, 0.24, { rot: Math.atan2(e.vy, e.vx) });
      }
      for (const q of P.o) if (q.type === 'train' && q.wt > 0 && (q.t * 6 | 0) % 2) S(c, 'prop9', 'lampOn', 16, q.y - 40, 0.8);
      P.drawArches(c);
      c.restore();
      if (P.truck && !P.truck.dead) { const b = P.truck; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(220, 26, 200, 14); c.fillStyle = '#501'; c.fillRect(223, 29, 194, 8); c.fillStyle = '#e33'; c.fillRect(223, 29, 194 * clamp(b.hp / b.max, 0, 1), 8); G.text('БТР ОХРАНЫ', 320, 29, { align: 'center', size: 8 }); }
      if (P.endT) { c.fillStyle = `rgba(0,0,0,${clamp((P.endT - 1.6) / 1.4, 0, 1)})`; c.fillRect(0, 0, 640, 360); }
    },
    layer(c, name, off, y, h) {   // бесшовный тайл (склеен при сборке)
      const im = L9.img[name]; if (!im) return; const w = im.width / im.height * h, x0 = -((off % w) + w) % w;
      for (let x = x0 - w; x < 700; x += w) c.drawImage(im, Math.floor(x), y, Math.ceil(w) + 1, h);
    },
    drawArches(c) {   // передний план: одна большая арка (край за пределами кадра) и колонны от края до края экрана
      const step = 760, off = P.scroll.arch, i0 = Math.floor(off / step), names = ['rib', 'glass', 'pillar', 'glass', 'pillar'];   // одна арка за цикл
      for (let i = i0 - 1; i <= i0 + 2; i++) {
        const x = i * step - off + 300, n = names[((i % names.length) + names.length) % names.length];
        S(c, 'arch9', n, x, 392, n === 'rib' ? 1.45 : 1.1);
      }
    },
    drawObj(c, q) {
      let k = sc(clamp(q.y, Y0, Y1)); const bob = Math.sin(q.t * 7) * 2;
      if (q.type === 'obst') { S(c, 'props8', 'shadow', q.x, q.y, 0.4 * k, { a: 0.4 }); S(c, 'hbar9', q.kind, q.x, q.y + 2, k); return; }
      if (q.type === 'fire') { S(c, 'fxA9', 'fire' + ((q.t * 10 | 0) % 4), q.x, q.y - 14, 0.9 * k); return; }
      if (q.type === 'heal') { S(c, 'props8', 'shadow', q.x, q.y, 0.25 * k, { a: 0.4 }); S(c, 'pick9', 'kefir', q.x, q.y - 14 + Math.sin(q.t * 5) * 3, 0.9 * k); return; }
      if (q.type === 'tv' || q.type === 'tvBroken') { S(c, 'tv9', q.type === 'tvBroken' ? ((q.t * 3 | 0) % 2 ? 'broken' : 'smoke') : q.x > 560 ? 'noise' : 'x' + ((q.t * 6 | 0) % 4), q.x, q.y, 1); if (q.type === 'tv' && q.x < 560 && !q.said) { q.said = 1; P.lv.xsay(q.line); } return; }
      if (q.type === 'sleep') { S(c, 'props8', 'shadow', q.x, q.y + 2, 0.75 * k, { a: 0.45 }); S(c, 'sleep9', (q.cr ? 'cr' : 'ok') + q.kind, q.x, q.y - 3 + Math.sin(q.t * 3) * 2, k); return; }
      if (q.type === 'cyb') { k *= q.sz; const fr = q.fireA > 0 ? (q.back ? 'fireBack' : 'fire') : 'run'; S(c, 'props8', 'shadow', q.x, q.y + 2, 0.75 * k, { a: 0.45 }); S(c, q.sh, fr, q.x, q.y - 4 + bob, k); if (q.fl > 0) S(c, q.sh, fr, q.x, q.y - 4 + bob, k, { add: 1, a: 0.5 }); return; }
      if (q.type === 'train') { if (q.wt > 0) return; const kk = 1.6 * k, step = L9.size('trn9', 'wagon')[0] * kk - 3; ['tail', 'wagon', 'wagon', 'loco'].forEach((p, i) => S(c, 'trn9', p, q.x + step * i + step / 2, q.y + 6, kk)); return; }
      if (q.type === 'btr') { k *= BTR_K; const fr = q.fireA > 0 ? 'fire' : q.hp < q.max * 0.35 ? 'dmg' : 'run'; S(c, 'props8', 'shadow', q.x + 140 * k, q.y + 2, 1.6 * k, { a: 0.45 }); S(c, 'btr9', fr, q.x + 140 * k, q.y - 4 + Math.sin(q.t * 6) * 2, k); if (q.fl > 0) S(c, 'btr9', fr, q.x + 140 * k, q.y - 4 + Math.sin(q.t * 6) * 2, k, { add: 1, a: 0.45 }); }
    },
    drawCap(c) {
      const k = sc(P.y), y = P.y - P.z;
      S(c, 'props8', 'shadow', P.x, P.y + 2, (0.8 - Math.min(0.4, P.z / 250)) * k, { a: 0.5 });
      // все кадры — капсула с разбитым верхом (кадры bankUp/bankDown/hit на листе с целой капсулой не берём): крен и тормоз — поворотом, удар — вспышкой
      const fr = P.fireA > 0 ? (P.aim === 'back' ? 'fireBack' : P.aim === 'up' ? 'fireUp' : 'fire') : 'run', rot = clamp(P.bank || 0, -1, 1) * 0.1;
      const blink = P.inv > 0 && (P.t * 14 | 0) % 2, yy = y - 4 + Math.sin(P.t * 9) * 1.5;
      S(c, 'hcap9', fr, P.x, yy, k, { a: blink ? 0.5 : 1, rot });
      if (P.inv > 0.5 && P.lv.stats.dmg) S(c, 'hcap9', fr, P.x, yy, k, { rot, add: 1, a: 0.35 });
    },
    drawHud(lv, c) {
      const k = clamp(P.t / DUR, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(220, 6, 200, 16); c.fillStyle = '#123'; c.fillRect(223, 15, 194, 4); c.fillStyle = '#3cf'; c.fillRect(223, 15, 194 * k, 4);
      G.text('ДО ЛАБОРАТОРИИ', 320, 7, { align: 'center', size: 8, color: '#9cf' });
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(6, 25, 96, 14); G.text(Math.round(P.v / 4) + ' КМ/Ч', 12, 28, { size: 8, color: P.v > 850 ? '#ff6a4a' : P.v > 650 ? '#ffd84a' : '#fff' });
      if (P.truck && P.truck.x > P.x - 330 && (P.t * 3 | 0) % 2) G.text('БЫСТРЕЕ! >>>', 320, 60, { align: 'center', size: 16, color: '#ff4a3a', outline: true });
    },
  };
  L9.TUN = { DUR, speedAt, Y0, Y1 };
})();
