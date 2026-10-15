// Тест-бот ур.9, погоня v2 (свободное движение). В консоли превью: eval(await (await fetch('tools/p9/test9.js')).text()); __t9.tun({skill, secs, ck})
window.__t9 = {
  // skill 0..1 — как хорошо бот уворачивается; возвращает смерти, мин. здоровье, урон по источникам
  tun(o = {}) {
    const lv = App.level, P = L9.PARTS.tun, I = G.Input, T = L9.TUN, skill = o.skill ?? 0.8;
    App.paused = true; lv.partName = 'tun'; lv.ck = o.ck || 0; lv.reset();
    const log = { deaths: 0, minHp: 100, t: 0, hits: [], end: false, kills: 0 };
    let lastHp = P.hp, ty = 300, think = 0;
    const danger = y => {
      let s = 0;
      for (const q of P.o) {
        if (q.dead) continue;
        if (q.type === 'train' && Math.abs(q.y - y) < 30) s += q.wt > 0 || (q.x < P.x + 200) ? 20 : 0;
        if (q.type === 'obst' && q.x > P.x - 20 && q.x < P.x + 420 && Math.abs(q.y - y) < 26) s += q.kind === 'slime' ? 2 : 6;
        if (q.type === 'gang' && Math.abs(q.x - P.x) < 160 && Math.abs(q.y - y) < 24) s += 3;
        if (q.type === 'heal' && q.x > P.x && Math.abs(q.y - y) < 20) s -= 3;
      }
      for (const e of P.eb) if (Math.abs(e.y - (y - 40)) < 26 && Math.sign(P.x - e.x) === Math.sign(e.vx)) s += 1.5;
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
        const behind = P.o.some(q => !q.dead && (q.type === 'truck' || (q.type === 'gang' && q.x < P.x - 30)));
        const ahead = P.o.some(q => !q.dead && (q.type === 'gang' && q.x > P.x + 30 || q.type === 'tv' || (q.type === 'obst' && q.kind.startsWith('barrel'))));
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
};
