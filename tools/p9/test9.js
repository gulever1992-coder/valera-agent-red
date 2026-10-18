// Тест-бот ур.9, погоня v2 (свободное движение). В консоли превью: eval(await (await fetch('tools/p9/test9.js')).text()); __t9.tun({skill, secs, ck})
window.__t9 = {
  // skill 0..1 — как хорошо бот уворачивается; возвращает смерти, мин. здоровье, урон по источникам
  tun(o = {}) {
    const lv = App.level, P = L9.PARTS.tun, I = G.Input, T = L9.TUN, skill = o.skill ?? 0.8;
    App.paused = true; Scene.active = false; Scene.dialog = null; lv.partName = 'tun'; lv.ck = o.ck || 0; lv.reset();
    const log = { deaths: 0, minHp: 100, t: 0, hits: [], end: false, kills: 0 };
    let lastHp = P.hp, ty = 300, think = 0;
    const danger = y => {
      let s = 0;
      for (const q of P.o) {
        if (q.dead) continue;
        if (q.type === 'train' && Math.abs(q.y - y) < 30) s += q.wt > 0 || (q.x < P.x + 200) ? 20 : 0;
        if (q.type === 'obst' && q.x > P.x - 20 && q.x < P.x + 420 && Math.abs(q.y - y) < 26) s += q.kind === 'slime' ? 2 : 6;
        if ((q.type === 'cyb' || q.type === 'sleep') && Math.abs(q.x - P.x) < 190 && Math.abs(q.y - y) < 26) s += q.type === 'sleep' ? 5 : 3;
        if (q.type === 'heal' && q.x > P.x && Math.abs(q.y - y) < 20) s -= 3;
      }
      for (const e of P.eb) if (e.bomb ? Math.abs(e.ty - y) < 22 && (s += 2, false) : Math.abs(e.y - (y - 60)) < 34 && Math.sign(P.x - e.x) === Math.sign(e.vx)) s += 1.5;
      return s + Math.abs(y - 300) * 0.004;
    };
    const dt = 1 / 60, max = (o.secs || 200) * 60;
    for (let i = 0; i < max; i++) {
      I.down = {}; I.hit = {};
      if (lv.dead) { }
      else if (lv.partName !== 'tun' || lv.done) { log.end = true; break; }
      else {
        if ((think -= dt) <= 0) { think = 0.15 + (1 - skill) * 0.4; if (Math.random() < skill) { let best = ty, bs = 1e9; for (let y = T.Y0; y <= T.Y1; y += 8) { const d = danger(y); if (d < bs) { bs = d; best = y; } } ty = best; } }
        if (ty < P.y - 4) I.down.up = true; else if (ty > P.y + 4) I.down.down = true;
        const behind = P.o.some(q => !q.dead && (q.type === 'btr' || (q.type === 'cyb' && q.x < P.x - 30)));
        const ahead = P.o.some(q => !q.dead && (q.type === 'cyb' && q.x > P.x + 30 || q.type === 'tv' || (q.type === 'obst' && q.kind.startsWith('barrel'))));
        if (behind && (!ahead || (i >> 4) % 2)) I.down.throw = true; else I.down.punch = true;
        if (P.o.some(q => !q.dead && q.type === 'obst' && q.kind !== 'slime' && q.x > P.x + 40 && q.x < P.x + 110 && Math.abs(q.y - P.y) < 18) && Math.random() < skill) I.hit.jump = true;
      }
      lv.update(dt);
      if (lv.dead === 0.001) log.deaths++;
      if (lv.partName === 'tun') { log.minHp = Math.min(log.minHp, P.hp); if (P.hp < lastHp) log.hits.push([Math.round(P.t), lastHp - P.hp]); lastHp = P.hp; }
      log.t += dt;
    }
    log.T = Math.round(P.t); log.kills = lv.stats.kills; log.dmgTotal = log.hits.reduce((a, b) => a + b[1], 0); log.hits = log.hits.slice(0, 50); return log;
  },
  // лаборатория: бежит вправо, прыгает через ямы, стреляет по ближайшему врагу (в т.ч. по диагонали), едет на подъёмнике, выходит в дверь
  lab(o = {}) {
    const lv = App.level, I = G.Input, skill = o.skill ?? 0.8; let P = L9.PARTS.lab;
    App.paused = true; Scene.active = false; Scene.dialog = null; lv.partName = 'lab'; lv.ck = o.ck || 0; lv.done = false; lv.reset(); P = L9.PARTS.lab;
    const log = { deaths: 0, minHp: 100, t: 0, end: false, maxX: 0, stuck: 0, hits: [] };
    let lastHp = P.hp, lastX = P.x, stuckT = 0, jumpCd = 0;
    const dt = 1 / 60, max = (o.secs || 300) * 60;
    for (let i = 0; i < max; i++) {
      I.down = {}; I.hit = {};
      if (lv.dead) { }
      else if (lv.partName !== 'lab' || lv.done) { log.end = true; break; }
      else {
        const M = P.M, L = M.lifts[0];
        const foes = P.foes.filter(f => !f.dead && !f.__ign && Math.abs(f.x - P.x) < 340 && Math.abs(f.y - P.y) < 200).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x));
        const f = foes[0]; if (f) { f.__eng = (f.__eng || 0) + dt; if (f.__eng > 5) f.__ign = 1; }
        let mv = 1;
        const onLift = L.on === 1 && P.x > L.x && P.x < L.x + L.w;
        if (onLift || (L.on === 0 && P.x > L.x + 30 && P.x < L.x + L.w - 30)) mv = 0;
        if (f) {
          const dx = f.x - P.x, dy = (f.y - 30) - (P.y - 40);
          if (Math.abs(dx) < 140 && Math.random() < skill) mv = 0;     // встал и стреляет
          I.down[dx < 0 ? 'left' : 'right'] = true; if (!mv) { P.dir = dx < 0 ? -1 : 1; }
          if (dy < -50 && Math.abs(dx) > 30) { I.down.up = true; if (!mv) I.down[dx < 0 ? 'left' : 'right'] = true; }
          else if (dy < -50) I.down.up = true;
          I.down.punch = true;
          if (Math.random() < 0.004 * skill && P.gren > 0) I.hit.throw = true;
          if (!mv && !(dy < -50)) { I.down.left = false; I.down.right = false; }
        }
        if (mv) { const back = L.on !== 1 && P.y > 250 && P.x > L.x + L.w + 20 && P.x < 5230; I.down.right = !back; I.down.left = back; }   // подъёмник ушёл — вернуться к шахте
        // арена: искать оставшихся врагов по всему цеху (на мостки — по ближайшей лестнице)
        if (M.ar && !M.ar.done && !f && !P.climb) { const g = P.foes.filter(e => !e.dead && e.x > 10330).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x))[0];
          if (g) { let tx = g.x; if (g.y < 260 && P.y > 300) { const l = M.ladders.filter(l => l[0] > 10330).sort((a, b) => Math.abs(a[0] - g.x) - Math.abs(b[0] - g.x))[0]; if (l) tx = l[0]; if (Math.abs(tx - P.x) < 6) I.down.up = true; }
            I.down.right = tx > P.x + 5; I.down.left = tx < P.x - 5; } }
        // широкий чан (не перепрыгнуть): к лестнице перед ним и наверх, на мост
        const wp = M.pits.find(p => p[1] - p[0] > 120 && P.y > 300 && P.x < p[0] && P.x > p[0] - 260);
        if (wp && !P.climb) { const lad = M.ladders.find(l => l[0] < wp[0] && l[0] > P.x - 40 && l[2] === 330); if (lad) { const d = lad[0] - P.x; if (Math.abs(d) > 5) { I.down.right = d > 0; I.down.left = d < 0; } else { I.down.left = I.down.right = false; I.down.up = true; } } }
        if (P.climb) { I.down.up = true; I.down.left = I.down.right = false; }
        // ловушки: переждать пресс/лазер/пар/кабель впереди, пилу перепрыгнуть
        const T = M.traps || {}, tt = P.t, ahead = x => x - P.x > 0 && x - P.x < 75;
        let wait = false;
        for (const [x, fl, f] of T.press || []) if (ahead(x + 30) && Math.abs(P.y - fl) < 5) { const u = (tt + f) % 2.6; if (u > 1.0 && u < 2.3) wait = true; }
        for (const [x, fl, top, f] of T.laser || []) if (ahead(x) && Math.abs(P.y - fl) < 5) { const u = (tt + f) % 2.8; if (u < 1.75 || u > 2.4) wait = true; }
        for (const [x, fl, f] of T.vent || []) if (ahead(x + 10) && Math.abs(P.y - fl) < 5) { const u = (tt + f) % 3.4; if (u > 1.5) wait = true; }
        for (const [x, fl, f] of T.cable || []) if (ahead(x + 10) && Math.abs(P.y - fl) < 5) { const u = (tt + f) % 2.2; if (u < 1.0 || u > 2.0) wait = true; }
        if (wait && !f) { I.down.left = I.down.right = false; mv = 0; }
        for (const s of T.saw || []) if (s.bx && Math.abs(P.y - s[2]) < 5 && Math.abs(s.bx - P.x) < 70 && P.onG && jumpCd <= 0) { I.hit.jump = true; jumpCd = 0.5; }
        // горизонтальный лазер: низко — прыжок, высоко — перекат, иначе ждать
        for (const h of (M.traps || {}).hlaser || []) if (h[0] - P.x > 0 && h[0] - P.x < 45 && Math.abs(P.y - h[2]) < 5 && P.onG && h.by != null) {
          const per = h[5], ph = ((P.t + h[6]) % per) / per; if (ph > 0.3 && ph < 0.4) { I.down.right = true; I.down.left = false; } else { I.down.left = I.down.right = false; mv = 0; } }
        // большой лифт: встать в середину платформы (струи огня из стен до середины не достают)
        if (M.movers && M.movers.bigL && M.movers.bigL.on === 1 && P.x > 14790 && P.x < 15410 && (!f || Math.abs(P.x - 15100) > 60)) { const d = 15100 - P.x; if (Math.abs(d) > 8) { I.down.right = d > 0; I.down.left = d < 0; } else { I.down.left = I.down.right = false; } mv = 0; }
        // реакторная: патерностер и колесо — ждать подходящую платформу и прыгать
        if (P.y > 1000 && M.movers) {
          const V = M.movers, on = l => P.onG && Math.abs(P.y - l.y) < 4 && P.x >= l.x - 4 && P.x <= l.x + l.w + 4;
          const stA = V.steps.find(on), cr = V.crads.find(on);
          const go = (dir, j) => { I.down.right = dir > 0; I.down.left = dir < 0; if (j && P.onG && jumpCd <= 0) { I.hit.jump = true; jumpCd = 0.4; } };
          const hold = () => { I.down.left = I.down.right = false; mv = 0; };
          if (!P.onG) { const ts = V.steps.filter(s => !s.hid).concat(V.crads).filter(s => s.y >= P.y - 6 && Math.abs(s.x + s.w / 2 - P.x) < 110).sort((p, q) => Math.abs(p.x + p.w / 2 - P.x) - Math.abs(q.x + q.w / 2 - P.x))[0];
            const lg = M.solids.filter(r => r[1] > 1000 && r[1] < 1500 && r[1] >= P.y - 6 && P.x > r[0] - 80 && P.x < r[0] + r[2]);
            if (lg.length) go(1, false); else if (ts) { const d = ts.x + ts.w / 2 - P.x; if (Math.abs(d) > 8) go(Math.sign(d), false); else hold(); } }
          else if (stA && stA.col.up) { const nb = V.steps.find(s => !s.col.up && !s.hid && Math.abs(s.y - stA.y) < 26); if (nb) go(1, true); else hold(); }
          else if (stA) { if (stA.y > 1228 && stA.y < 1262) go(1, true); else if (stA.y > 1480) go(1, true); else hold(); }
          else if (cr) { if (cr.px > 16630 && cr.py < 1250) go(1, true); else hold(); }
          else if (P.onG && P.x > 15540 && P.x < 15605 && Math.abs(P.y - 1530) < 4) { const a = V.steps.find(s => s.col.up && !s.hid && s.y > 1470 && s.y < 1528); if (a) go(1, true); else hold(); }
          else if (P.onG && P.x > 16230 && P.x < 16300 && Math.abs(P.y - 1530) < 4) { const c = V.crads.find(c => c.px > 16360 && c.px < 16420 && c.py < 1450); if (c) go(1, true); else { hold(); if (P.x < 16285) go(1, false); } }
        }
        // ямы и стены
        jumpCd -= dt;
        const pitAhead = M.pits.some(p => p[0] !== 4610 && p[1] - p[0] <= 120 && P.x > p[0] - 26 && P.x < p[0] - 4) || (L.on === 2 && P.y > 300 && P.x > 4560 && P.x < 4610);
        if (mv && P.onG && jumpCd <= 0 && pitAhead) { I.hit.jump = true; jumpCd = 0.5; }
        if (P.x <= lastX + 0.2 && mv && !onLift) stuckT += dt; else stuckT = 0;
        if (stuckT > 0.6 && P.onG && jumpCd <= 0) { I.hit.jump = true; jumpCd = 0.6; log.stuck++; stuckT = 0; }
        lastX = P.x;
      }
      for (const k in I.hit) if (I.hit[k]) I.down[k] = I.down[k] || false;
      lv.update(dt);
      if (lv.dead === 0.001) { log.deaths++; (log.dx = log.dx || []).push(Math.round(P.x)); }
      if (lv.partName === 'lab') { P = L9.PARTS.lab; log.minHp = Math.min(log.minHp, P.hp); if (P.hp < lastHp) log.hits.push([Math.round(P.x), lastHp - P.hp]); lastHp = P.hp; log.maxX = Math.max(log.maxX, Math.round(P.x)); }
      log.t += dt;
    }
    log.T = Math.round(log.t); log.x = Math.round(P.x); log.y = Math.round(P.y); log.foesLeft = P.foes.filter(f => !f.dead).length; log.dmgTotal = log.hits.reduce((a, b) => a + b[1], 0); log.hits = log.hits.slice(0, 40); return log;
  },
};
