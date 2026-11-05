// Бот для ур.10 (вставлять в страницу игры): await __t10.sim(сек, {atk:'slam'}) — шаги lv.update(1/60) с автопилотом.
// Фаза 1 (run): бежит влево, смотрит на Семёна, прыгает через провалы/стены. Фаза 2 (jet): кружит и стреляет, вырывается из захвата.
window.__t10 = (() => {
  const I = G.Input, set = (a, v) => v ? I.press(a) : I.release(a);
  let jumpT = 0, mashT = 0;
  const botRun = (lv) => {
    const P = L9.PARTS.lab, M = P.M;
    if (lv.dead || Scene.active) { ['left', 'right', 'jump', 'punch', 'up'].forEach(a => set(a, 0)); return; }
    set('right', 0);
    const sx = P.x - P.cam.x, ahead = M.roofAt(P.x - 30), here = M.roofAt(P.x);
    const wall = ahead != null && here != null && ahead < here - 6, gap = ahead == null || (here != null && ahead > here + 90);
    const ub = M.blds && M.blds.find(b => b.st === 'ok' && P.x >= b.x && P.x < b.x + b.w), Zs = M.sx ? M.sx(P.x) : sx;
    const go = Zs > 110 || (ub && M.sx && M.sx(ub.x + ub.w) > M.touchX() - 90) || (M.atk.cur === 'slam' && Math.abs(P.x - M.atk.tx) < 60) || (M.atk.cur === 'plasma');
    if (P.climb) { set('left', 0); set('up', 1); set('punch', 0); return; }     // лезет по лестнице на надстройку
    const lad = (M.ladders || []).find(l => P.x > l[0] - 4 && P.x - l[0] < 70 && Math.abs(P.y - l[2]) < 6);
    if (lad && P.onG) { set('jump', 0); jumpT = 0; if (Math.abs(P.x - lad[0]) < 8) { set('punch', 0); set('left', 0); set('up', 1); } else { set('punch', 1); set('up', 0); set('left', 1); } return; }
    if (P.dir < 0 && !P.climb) { set('punch', 0); set('left', 0); set('right', 1); return; }
    const air = !P.onG && P.airGo; set('left', go || air); set('punch', 1); set('up', 0);
    if (P.onG) P.airGo = 0;
    if (jumpT > 0) { jumpT--; if (jumpT === 0) set('jump', 0); }
    else if (P.onG && ((wall || gap) && go || (M.atk.cur === 'eyes' && M.beam && Math.abs(M.beam.x - P.x) < 40) || (M.whip && M.whip.x0 < P.x + 40))) { set('jump', 1); jumpT = 6; P.airGo = (wall || gap) ? 1 : 0; if (P.airGo) set('left', 1); }
  };
  const botJet = (lv) => {
    const P = L10.PARTS.jet;
    if (lv.dead) return;
    if (P.grab) { mashT++; set('left', mashT % 4 < 2); set('right', mashT % 4 >= 2); return; }
    const t = lv.t; set('punch', 1);
    const ty = 180 + Math.sin(t * 1.3) * 120, tx = 140 + Math.sin(t * 0.9) * 90;
    let dodge = 0; for (const e of P.ebul) if (Math.abs(e.x - P.x) < 60 && Math.abs(e.y - P.y) < 30) dodge = e.y > P.y ? -1 : 1;
    set('up', P.y > ty + 10 || dodge < 0); set('down', P.y < ty - 10 || dodge > 0); set('left', P.x > tx + 10); set('right', P.x < tx - 10);
  };
  const sim = async (sec, o = {}) => {
    const lv = App.level, r = { deaths0: lv.stats.deaths, minHp: 100 };
    const steps = Math.round(sec * 60);
    for (let i = 0; i < steps; i++) {
      const part = lv.partName;
      if (part === 'run') { botRun(lv); if (o.atk && !L9.PARTS.lab.M.atk.cur && L9.PARTS.lab.M.boss.hp > 0) L9.PARTS.lab.M.startAtk(o.atk, L9.PARTS.lab); }
      if (part === 'jet') { botJet(lv); if (o.atk && !L10.PARTS.jet.A.cur) L10.PARTS.jet.startAtk(o.atk); }
      if (o.dmg && part === 'run') L9.PARTS.lab.M.boss.damage(o.dmg / 60);
      if (o.dmg && part === 'jet') L10.PARTS.jet.B.damage(o.dmg / 60);
      if (o.god && lv.P) { lv.P.hp = 100; }
      lv.update(1 / 60); G.t += 1 / 60; if (G.flashT > 0) G.flashT -= 1 / 60; if (G.shakeT > 0) { G.shakeT -= 1 / 60; if (G.shakeT <= 0) G.shakeAmt = 0; } I.endFrame();
      if (lv.P && lv.P.hp != null) r.minHp = Math.min(r.minHp, lv.P.hp);
      if (o.until && o.until()) break;
      if (i % 600 === 0) await new Promise(q => setTimeout(q, 0));
    }
    ['left', 'right', 'jump', 'punch', 'up', 'down'].forEach(a => set(a, 0));
    r.deaths = lv.stats.deaths - r.deaths0; r.part = lv.partName; r.t = lv.stats.time | 0;
    const B = lv.partName === 'run' ? L9.PARTS.lab.M.boss : lv.P.B; if (B) { r.bhp = B.hp | 0; r.seg = B.seg; r.segT = B.segT | 0; }
    return r;
  };
  // нарисовать текущий кадр (превью не крутит rAF, пока панель скрыта)
  const shot = () => { draw(); return 1; };
  return { sim, shot };
})();
