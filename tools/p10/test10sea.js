// Бот фазы 3 «МОРЕ» v2 (вставлять в страницу игры на ?l10=sea): await __t10s.sim(сек, {god, dmg, atk}) -> отчёт
// Автопилот: берёт гранатомёт, держится на плотах (против течения, прыгает на плот слева), бьёт станции, потом Семёна;
// от хлопка, шланга, лазера и шаров уходит под воду. __t10s.shot('имя') — кадр в art_src/l10/<имя>.jpg (recv_art.py, 18799).
window.__t10s = (() => {
  const I = G.Input, set = (a, v) => v ? I.press(a) : I.release(a);
  let jT = 0;
  const threat = (P) => {
    for (const a of P.atks) {
      if (a.k === 'clap' && Math.abs((a.tx ?? P.x) - P.x) < 90 && (a.st === 'swing' || a.st === 'shut' || (a.st === 'up' && a.t > 0.45))) return 'clap';
      if (a.k === 'hose' && a.mark && Math.abs(a.mark.x - P.x) < 70 && a.st === 'up' && a.t > 0.35) return 'hose';
      if (a.k === 'laser' && !a.warn && Math.abs(a.x - P.x) < 90) return 'laser';
    }
    if (P.balls.some(b => Math.hypot(b.x - P.x, b.y - P.y + 40) < (P.onG && P.gun ? 34 : 70))) return 'ball';
    if (P.waves.some(w => w.h > 0.3 && !w.hit && Math.sign(P.x - w.x) === w.d && Math.abs(P.x - w.x) < 46)) return 'wave';     // волна от кулака — прыжок
    return null;
  };
  const bot = (lv, st) => {
    const P = L10.PARTS.sea; ['left', 'right', 'jump', 'punch', 'up', 'down', 'throw'].forEach(a => set(a, 0));
    if (lv.dead || P.climbT > 0) return;
    const th = threat(P); if (th) st.th[th] = (st.th[th] || 0) + 1;
    if (!P.swim && !P.dive && !(P.swingT > 0)) { const nb = P.balls.find(b => !b.ref && Math.hypot(b.x - P.x, b.y - (P.y - 70 * P.K)) < 80); if (nb) { P.wpn = 'racket'; P.dir = nb.x < P.x ? -1 : 1; set('up', nb.y < P.y - 90 * P.K); set('punch', 1); st.swings = (st.swings || 0) + 1; return; } }     // ракетка: шар рядом — отбить
    if (P.onG && P.gun) {     // на плоту — стреляет всегда: шары рядом, станции под щитом, иначе Семён
      const B = P.B, stn = P.stations.filter(s => s.st === 'plug' || s.st === 'float').sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x))[0];
      const bl = P.balls.filter(b => Math.hypot(b.x - P.x, b.y - P.y) < 220).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0];
      const fo = P.foes.filter(f => !f.dead && Math.hypot(f.x - P.x, f.y - P.y) < 200)[0], tg = fo;     /* шары — только ракеткой */
      const tx = tg ? tg.x : B.inv && stn ? stn.x : L10.SEA3.sem.x, ty = tg ? tg.y : B.inv && stn ? stn.y - 40 : 150, dx = tx - P.x;
      if (Math.abs(dx) > 20) P.dir = dx < 0 ? -1 : 1; const low = !tg && B.inv && stn && stn.y - 50 > P.y + 20; set('up', !tg && !B.inv && Math.abs(dx) < 160); set('down', low && Math.abs(dx) < 260); P.wpn = 'rpg'; set('punch', 1);
    }
    if (P.dive) { set('down', !!th || P.dive.t < 0.4); if (P.x > 420) set('left', 1); return; }
    if (th === 'wave' && P.onG) { set('jump', 1); st.jumps++; return; }
    if (th && P.swim) { set('down', 1); st.dives++; return; }
    if (th && P.onG && (th === 'clap' || th === 'laser')) { const r0 = P.raft; set(r0 && P.x < r0.x ? 'left' : 'right', 1); set('punch', 0); set('down', 0); return; }     // с плота — сойти в воду, потом нырнуть
    if (th === 'hose' && P.onG) { const m = P.atks.find(a => a.k === 'hose').mark; set(m.x < P.x ? 'right' : 'left', 1); return; }
    if (P.swim) {     // к ближайшему плоту и залезть
      const r = P.rafts.filter(r => !r.sink && r.x < P.x + 30 && r.x > 40).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x))[0];
      if (r) { set(r.x < P.x ? 'left' : 'right', Math.abs(r.x - P.x) > 10); if (Math.abs(r.x - P.x) < r.w / 2 + 10) set('jump', 1); } else set('left', 1);
      return;
    }
    if (!P.onG) { set('left', P.airL); return; }
    P.airL = 0;
    // гранатомёт: прыгнуть на его плот
    const goal = !P.gun && P.gunRaft ? P.gunRaft : null, r = P.raft;
    const leftRaft = P.rafts.filter(q => !q.sink && q !== r && q.x < P.x && P.x - q.x < 190).sort((a, b) => b.x - a.x)[0];
    const want = goal || (P.x > 330 && leftRaft) || (r && r.sink ? leftRaft : null);
    if (!want && P.x > 430 && r) { set('left', 1); if (P.x < r.x - r.w / 2 + 16 && jT <= 0) { set('jump', 1); jT = 20; P.airL = 1; } jT--; return; }     // унесёт — в воду и плыть влево
    if (want && r) { const dx = want.x - P.x; if (Math.abs(dx) < 20 && want === r) return; set(dx < 0 ? 'left' : 'right', 1); const edge = dx < 0 ? P.x < r.x - r.w / 2 + 16 : P.x > r.x + r.w / 2 - 16; if (edge && jT <= 0) { set('jump', 1); jT = 20; P.airL = dx < 0 ? 1 : 0; st.jumps++; } jT--; return; }
    jT--;
    if (r && P.x > r.x + 10) set('left', 1);
    // цель: станции под щитом, иначе Семён
    const B = P.B, stn = P.stations.filter(s => s.st === 'plug' || s.st === 'float').sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x))[0];
    const bl = P.balls.filter(b => Math.hypot(b.x - P.x, b.y - P.y) < 220).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0];
    const tx = bl ? bl.x : B.inv && stn ? stn.x : L10.SEA3.sem.x, ty = bl ? bl.y : B.inv && stn ? stn.y - 40 : 150;
    const dx = tx - P.x; if (Math.abs(dx) > 30) { P.dir = dx < 0 ? -1 : 1; }
    set('up', ty < P.y - 130 && Math.abs(dx) < 160); set('punch', P.gun ? 1 : 0);
  };
  const sim = async (sec, o = {}) => {
    const lv = App.level, P0 = L10.PARTS.sea, st = { th: {}, dives: 0, jumps: 0 }, r = { deaths0: lv.stats.deaths, minHp: 100, hp0: P0.B && P0.B.hp };
    const steps = Math.round(sec * 60); let atkN = {};
    for (let i = 0; i < steps; i++) {
      if (lv.partName !== 'sea') break;
      const P = L10.PARTS.sea; bot(lv, st);
      if (o.atk && P.B && !P.atks.length && P.B.hp > 0) P.startAtk(o.atk);
      if (o.dmg && P.B) P.B.damage(o.dmg / 60);
      if (o.god && lv.P) lv.P.hp = 100;
      for (const a of (P.atks || [])) if (a.t === 0 || !a.seen) { a.seen = 1; atkN[a.k] = (atkN[a.k] || 0) + 1; }
      lv.update(1 / 60); G.t += 1 / 60; if (G.flashT > 0) G.flashT -= 1 / 60; if (G.shakeT > 0) { G.shakeT -= 1 / 60; if (G.shakeT <= 0) G.shakeAmt = 0; } I.endFrame();
      if (lv.P && lv.P.hp != null) r.minHp = Math.min(r.minHp, lv.P.hp);
      if (o.until && o.until()) break;
      if (i % 600 === 0) await new Promise(q => setTimeout(q, 0));
    }
    ['left', 'right', 'jump', 'punch', 'up', 'down', 'throw'].forEach(a => set(a, 0));
    const P = L10.PARTS.sea; r.deaths = lv.stats.deaths - r.deaths0; r.part = lv.partName; r.t = lv.stats.time | 0; r.dmgTaken = lv.stats.dmg;
    if (P.B) { r.bhp = P.B.hp | 0; r.seg = P.B.seg; r.inv = P.B.inv; r.stations = P.stations.map(s => s.st).join(','); }
    r.gun = P.gun; r.atk = atkN; r.threats = st.th; r.dives = st.dives; r.jumps = st.jumps; r.shots = lv.stats.shots;
    return r;
  };
  const shot = async (name = 'sea3_shot') => {
    const pz = App.paused; App.paused = false; draw(); App.paused = pz; const cv = document.querySelector('canvas'), b64 = cv.toDataURL('image/jpeg', 0.85).split(',')[1];
    for (let i = 0; i < b64.length; i += 60000) await fetch('http://localhost:18799/', { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: (i ? '+' : '') + name + '.jpg|' + b64.slice(i, i + 60000) });
    return name;
  };
  return { sim, shot, bot };
})();
