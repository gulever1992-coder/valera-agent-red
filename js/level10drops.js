// Уровень 10: падающие бонусы в боевых частях (run, jet, sea) — аптечки (кефир/пельмени) и значок «Ударник».
// Всё в экранных координатах 640x360. Собранное идёт в статистику: food, secrets/secretsTotal.
(() => {
  const PARTS = ['run', 'jet', 'sea'];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const KIND = {
    kefir: { heal: 20, text: 'КЕФИР +20', col: '#8cf08c' },
    pelmeni: { heal: 40, text: 'ПЕЛЬМЕШКИ +40', col: '#8cf08c' },
    badge: { score: 1000, text: 'ЗНАЧОК «УДАРНИК» +1000', col: '#ffd84a' },
  };

  // центр Валеры на экране и полуразмеры зоны подбора
  const body = (lv) => {
    const P = lv.P, n = lv.partName;
    if (n === 'run') { const M = P.M; if (!M || !M.toScr) return null; const [x, y] = M.toScr(P.x, P.y); return [x, y - 20, 18, 26]; }
    if (n === 'jet') return [P.x, P.y, 22, 26];
    if (n === 'sea') return [P.x, P.y - 40 * (P.K || 1), 22, 34];
    return null;
  };

  const D = L10.Drops = {
    reset(lv) {
      lv.drops = []; lv.dropTxt = []; lv.dropT = rnd(6, 9); lv.dropPartT = 0;
      lv.stats.secretsTotal = PARTS.length;
      lv.badgeGot = lv.badgeGot || {};
      lv.badgeAt = rnd(20, 50);      // значок падает один раз за часть (пока не поймали — после смерти снова)
    },
    spawn(lv, kind) {
      const n = lv.partName, x = n === 'run' ? rnd(40, Math.min(400, lv.P && lv.P.M && lv.P.M.touchX ? lv.P.M.touchX() - 90 : 400)) : n === 'jet' ? rnd(60, 420) : rnd(40, 600);
      lv.drops.push({ kind, x, x0: x, y: -14, t: 0, vy: kind === 'badge' ? 34 : rnd(38, 52), ph: rnd(0, 6), float: 0 });
    },
    update(lv, dt) {
      if (!PARTS.includes(lv.partName) || !lv.drops) return;
      const P = lv.P, n = lv.partName;
      for (const f of lv.dropTxt) { f.t += dt; f.y -= 20 * dt; }
      lv.dropTxt = lv.dropTxt.filter(f => f.t < 1.2);
      if (P.cine || P.grab || P.eat || (P.M && P.M.eat) || lv.done) return;
      lv.dropPartT += dt;
      // аптечки: чаще, когда здоровья мало
      lv.dropT -= dt;
      if (lv.dropT <= 0) {
        const sea = n === 'sea'; lv.dropT = sea ? rnd(4, 6) : rnd(8, 12);     // в море (фаза 3) аптечек больше
        if (Math.random() < (P.hp < 70 ? (sea ? 0.9 : 0.85) : (sea ? 0.6 : 0.4))) D.spawn(lv, Math.random() < (sea ? 0.45 : 0.25) ? 'pelmeni' : 'kefir');
      }
      if (!lv.badgeGot[n] && lv.badgeAt != null && lv.dropPartT > lv.badgeAt) { lv.badgeAt = null; D.spawn(lv, 'badge'); }
      // падение
      const WY = n === 'sea' ? (P.swimY ? P.swimY() : P.WY) : null, b = body(lv);
      for (const d of lv.drops) {
        d.t += dt;
        if (d.raft) { if (d.raft.sink || d.raft.x > 660) { d.raft = null; d.float = 0.001; } else { d.x = d.raft.x + d.off; d.y = d.raft.top - 8 + Math.sin(d.t * 3) * 1.5; } }     // лежит на плоту и плывёт с ним
        else if (d.float > 0) { d.float += dt; d.y = WY - 6 + Math.sin(d.t * 3) * 2; if (d.float > 6) d.dead = 1; }     // на воде покачивается и тонет
        else { const y0 = d.y; d.y += d.vy * dt; d.x = d.x0 + Math.sin(d.t * 1.6 + d.ph) * 14;
          const r = n === 'sea' && P.rafts && P.rafts.find(r => !r.sink && Math.abs(d.x - r.x) < r.w / 2 - 6 && y0 <= r.top - 8 && d.y >= r.top - 8);
          if (r) { d.raft = r; d.off = d.x - r.x; } else if (WY != null && d.y >= WY - 6) d.float = 0.001; }
        if (d.y > 380) d.dead = 1;
        if (!d.dead && b && !lv.dead && Math.abs(d.x - b[0]) < b[2] && Math.abs(d.y - b[1]) < b[3]) { d.dead = 1; D.take(lv, d); }
      }
      lv.drops = lv.drops.filter(d => !d.dead);
    },
    take(lv, d) {
      const k = KIND[d.kind], P = lv.P, st = lv.stats;
      if (k.heal) { P.hp = Math.min(100, P.hp + k.heal); st.food++; Sound.play('heal'); }
      if (k.score) lv.score += k.score;
      if (d.kind === 'badge') { st.secrets++; lv.badgeGot[lv.partName] = 1; Sound.play('checkpoint'); lv.say('ЗНАЧОК «УДАРНИК»!', 1.6); }
      lv.dropTxt.push({ x: d.x, y: d.y - 14, s: k.text, col: k.col, t: 0 });
    },
    draw(lv, c) {
      if (!lv.drops || !PARTS.includes(lv.partName)) return;
      for (const d of lv.drops) {
        const a = d.float > 4 ? Math.max(0, 1 - (d.float - 4) / 2) : 1;
        c.save();
        c.globalAlpha = a * (0.28 + Math.sin(d.t * 6) * 0.12); c.fillStyle = d.kind === 'badge' ? '#fff6a0' : '#b8ffb0';
        c.beginPath(); c.arc(d.x, d.y, d.kind === 'badge' ? 14 : 11, 0, Math.PI * 2); c.fill(); c.globalAlpha = a;
        G.Art.item(c, d.kind, d.x, d.y, Math.sin(d.t * 2 + d.ph) * 0.15, 1.2);
        c.restore();
      }
      for (const f of lv.dropTxt) G.text(f.s, f.x, f.y, { align: 'center', size: 8, color: f.col, outline: true });
    },
    hud(lv, c) {
      if (!PARTS.includes(lv.partName) || !lv.drops || !lv.stats.secrets) return;
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(594, 24, 40, 16);
      G.Art.item(c, 'badge', 606, 32, 0, 0.8); G.text(String(lv.stats.secrets), 630, 28, { align: 'right', size: 8, color: '#ffd84a' });
    },
  };
})();
