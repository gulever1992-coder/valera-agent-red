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
        // ямы и стены
        jumpCd -= dt;
        const pitAhead = M.pits.some(p => p[0] !== 4610 && P.x > p[0] - 26 && P.x < p[0] - 4) || (L.on === 2 && P.y > 300 && P.x > 4560 && P.x < 4610);
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
