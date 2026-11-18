// Бот-проверка босса ур.6 (Ванделорд). Запуск в консоли на ?l6boss:
//   await (0, eval)(await (await fetch('tools/p6/boss6_bot.js', {cache:'no-store'})).text());
//   await BT.run('smart', 240)   // 'smart' | 'stand' | 'spam'
// Симуляция без rAF (App.paused = true), шаг 1/60; кадры спрайтов считаются отрисовкой в скрытый холст.
window.BT = {
  errs: [],
  step(n, ctl) { const lv = App.level; for (let i = 0; i < n; i++) { G.t += 1 / 60; G.dt = 1 / 60; if (ctl) ctl(lv); try { lv.update(1 / 60); } catch (e) { BT.errs.push(String(e.stack || e)); } G.Input.endFrame(); } },
  toBoss() { App.paused = true; const I = G.Input; let k = 0; while (App.level.mode !== 'boss' && k < 60 * 120) { this.step(1, () => { I.press('right'); if (k % 20 === 0) { I.release('jump'); I.press('jump'); } else I.release('jump'); }); k++; } I.release('right'); I.release('jump'); return App.level.mode === 'boss'; },
  async load(fresh) {
    if (fresh) { const src = await (await fetch('js/level6boss.js?x=' + Date.now(), { cache: 'no-store' })).text(); (0, eval)(src.replace(/^'use strict';/, '').replace(/^const BG6 = .*$/m, '')); }
    for (let i = 0; i < 4; i++) { startLevel6({ boss: true }); if (this.toBoss()) return true; }
    throw new Error('toBoss failed');
  },
  SHEETS: { b_loco: [0, 1, 2, 3], b_evade: [...Array(12).keys()], b_cast: [...Array(12).keys()], b_py: [...Array(12).keys()], b_taunt: [...Array(12).keys()], b_hurt: [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11], vandewalk: [...Array(8).keys()], vande2: [...Array(6).keys()] },
  fight(bot, maxT, o = {}) {
    const I = G.Input; let t = 0; const ar0 = App.level.arena, b = ar0.boss; const phT = {}; const fr = {}; let b7 = 0;
    const cv = document.createElement('canvas'); cv.width = 640; cv.height = 360; const cx = cv.getContext('2d');
    const d0 = Spr.draw; Spr.draw = function (c, sheet, i, ...r) { if (c === cx && BT.SHEETS[sheet]) { const k = sheet + ':' + i; fr[k] = (fr[k] || 0) + 1; if (sheet === 'b_hurt' && i === 7) b7++; } return d0.call(this, c, sheet, i, ...r); };
    const dc0 = Spr.drawC; Spr.drawC = function (c, sheet, i, ...r) { if (c === cx && BT.SHEETS[sheet]) { const k = sheet + ':' + i; fr[k] = (fr[k] || 0) + 1; } return dc0.call(this, c, sheet, i, ...r); };
    let res = 'TIMEOUT', endT = null;
    try {
      while (t < maxT) {
        const ar = App.level.arena, pl = ar.player;
        if (ar !== ar0 || pl.dead) { res = 'LOSE'; break; }
        if (b.state === 'down') { res = 'WIN'; break; }
        if (b.state === 'dying' && endT == null) endT = t;
        if (!phT[b.phase]) phT[b.phase] = +t.toFixed(0);
        BT.step(1, () => { for (const k of ['left', 'right', 'jump', 'punch', 'throw', 'up', 'down']) I.release(k); if (b.state !== 'dying') bot(ar, pl, b, t); });
        try { ar.draw(cx); } catch (e) { BT.errs.push('draw: ' + e); }
        t += 1 / 60;
      }
    } finally { Spr.draw = d0; Spr.drawC = dc0; }
    const missing = []; for (const s in BT.SHEETS) for (const i of BT.SHEETS[s]) if (!fr[s + ':' + i]) missing.push(s + ':' + i);
    return { res, t: +(endT != null ? endT : t).toFixed(1), bossHpPct: Math.round(b.hp / b.maxHp * 100), plHp: App.level.arena.player.hp, phT, dodges: b.stats.dodges, react: b.stats.react || 0, missing, b_hurt7: b7, frames: fr, errs: BT.errs.length };
  },
  async run(name, maxT = 240, fresh = false) { await this.load(fresh); return this.fight(this[name], maxT); },
};
BT.stand = (ar, pl, b, t) => { pl.facing = b.x > pl.x ? 1 : -1; const f = Math.round(t * 60); if (f % 14 === 0) G.Input.press('throw'); if (pl.stuck && f % 4 === 0) G.Input.press('jump'); };
BT.spam = (ar, pl, b, t) => { const I = G.Input, f = Math.round(t * 60); if (pl.stuck) { if (f % 4 === 0) I.press('jump'); return; }
  if (BT.dir == null || pl.x < BG6() + 40) BT.dir = 1; if (pl.x > BG6() + 600) BT.dir = -1; I.press(BT.dir > 0 ? 'right' : 'left'); if (f % 90 === 0) I.press('jump');
  if (f % 14 === 0) { pl.facing = b.x > pl.x ? 1 : -1; I.press('throw'); } };
BT.smart = (ar, pl, b, t) => {   // уворачивается, ломает грибы, бьёт в окна, лечится, следит за нагревом палочки
  const I = G.Input, f = Math.round(t * 60), X0 = BG6() + 14, X1 = BG6() + 626;
  if (pl.stuck) { if (f % 4 === 0) I.press('jump'); return; }
  let mv = 0, jump = false, duck = false;
  const away = x => (pl.x < x ? -1 : 1) * ((pl.x < X0 + 60 && x > pl.x) || (pl.x > X1 - 60 && x < pl.x) ? -1 : 1);
  { const pend = ar.marks.filter(m => m.t - m.delay < 0.32); if (pend.length) { const lo = Math.min(...pend.map(m => m.x)) - 34, hi = Math.max(...pend.map(m => m.x)) + 34; if (pl.x > lo && pl.x < hi) { const gl = lo > X0 + 10 ? pl.x - lo : 1e9, gr = hi < X1 - 10 ? hi - pl.x : 1e9; mv = gl < gr ? -1 : 1; } } }
  for (const q of ar.quakes) for (const p of q.pops) if (Math.abs(p.x - pl.x) < 50) jump = true;
  for (const q of ar.quakes) { const head = q.x0 + q.dir * q.sp * q.t; if ((pl.x - head) * q.dir > 0 && Math.abs(pl.x - head) < 70) jump = true; }
  for (const s of ar.shots) { const dx = pl.x - s.x; if (s.grav > 0) { const lx = s.x + s.vx * 0.8; if (Math.abs(lx - pl.x) < 45) mv = away(lx); continue; }
    if (dx * s.vx > 0 && Math.abs(dx) < 140 && Math.abs(dx) > 5) { const yAt = s.y + s.vy * (dx / s.vx); if (yAt < pl.y - 78 || yAt > pl.y + 4) continue; if (Math.abs(s.vy) > 60) { mv = s.vx > 0 ? -1 : 1; if (Math.abs(dx) < 50 && yAt < pl.y - 40) duck = true; } else if (yAt < pl.y - 46) duck = true; else jump = true; } }
  for (const p of ar.portals) if (Math.abs(p.x - pl.x) < 60 && p.t > 0.5) mv = away(p.x);
  for (const p of ar.pyshots) if (p.mode === 'fly' && (pl.x - p.x) * p.dir > 0 && Math.abs(pl.x - p.x) < 100) jump = true;
  for (const e of ar.foes) if (!e.dead && Math.abs(e.x - pl.x) < 40) jump = true;
  if (b.state === 'hop' && b.hp0 && Math.abs(b.hp0.x1 - pl.x) < 70) mv = away(b.hp0.x1);
  if (b.state === 'act' && b.seq && b.seq[b.sq]) { const s = b.seq[b.sq]; const adx = Math.abs(b.x - pl.x);
    if ((b.lastAct === 'palm' || b.lastAct === 'blink') && s.a === 'palmWind' && adx < 110) mv = away(b.x);
    if ((b.lastAct === 'dash' || b.lastAct === 'ram') && (s.a === 'dash' || s.a === 'crouch' && b.sqT > 0.2) && (pl.x - b.x) * b.facing > 0 && adx < 125) jump = true; }
  const sh = ar.shrooms.filter(s => s.grown && !s.dead).sort((a, c) => Math.abs(a.x - pl.x) - Math.abs(c.x - pl.x))[0];
  const pk = ar.world.pickups.find(p => !p.dead && !p.falling); if (pk && !mv) mv = pk.x > pl.x + 6 ? 1 : pk.x < pl.x - 6 ? -1 : 0;
  const tgt = sh ? sh.x : b.x, open = b.vuln > 0 || b.state === 'tired' || b.anim === 'slamLand' || b.stun > 0;
  const want = sh ? 70 : open ? 130 : 150 + 40 * Math.sin(t * 0.9), d = Math.abs(tgt - pl.x);
  if (!mv) { if (d > want + 25) mv = tgt > pl.x ? 1 : -1; else if (d < want - 25) mv = tgt > pl.x ? -1 : 1; }
  if (mv < 0) I.press('left'); else if (mv > 0) I.press('right');
  if (jump && pl.onGround) { I.press('jump'); BT.jh = true; } else if (BT.jh && !pl.onGround && pl.vy < 0) I.press('jump'); else BT.jh = false;
  if (duck && !jump) I.press('down');
  const heatOk = open || sh || (pl.heat || 0) < 0.6;   // вне окон бережёт палочку от перегрева
  if (heatOk && (open || !mv || d < want + 60)) { pl.facing = tgt > pl.x ? 1 : -1; if (f % 14 === 0) I.press('throw'); }
};
'BT ready';
