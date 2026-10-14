// Снимки цеха v5 для проверки глазами: ?l7v4=D, затем eval(await (await fetch('tools/p7v4/shots5.js')).text()); await __shots5()
// Кадры уходят в приёмник tools/p7/recv7.py -> art_src/l7/_c5_<имя>.jpg
window.__shots5 = async (only) => {
  let D0; const X = (m, k, f) => App.level.run.D.RX(m, k, f), I = G.Input, R = () => App.level.run, P = () => R().player, T = [0, 1, 2, 3].map(i => 300 - i * 190), out = [];
  const step = (sec, hold = []) => { for (let i = 0, n = Math.round(sec * 60); i < n; i++) { const dt = 1 / 60; G.t += dt; G.dt = dt; for (const k of hold) I.down[k] = true; R().susp = 0; update(dt); I.endFrame(); } for (const k of hold) I.down[k] = false; draw(); };
  const shot = async n => { draw(); await fetch('http://127.0.0.1:8783/', { method: 'POST', body: '_c5_' + n + '.jpg|' + document.querySelector('canvas').toDataURL('image/jpeg', 0.92) }); out.push(n); };
  const tp = (x, f) => { const r = R(), p = P(); p.x = x; p.y = T[f]; p.vy = 0; p.onGround = true; r.flags.dCp = Math.max(r.flags.dCp || 0, f); r.flags.dDoor = r.flags.dDoor || 2; r.world.cam.x = U.clamp(x - W / 2, 0, r.D.w - W); r.world.cam.y = U.clamp(T[f] - 236, r.D.topY, 0); };
  const quiet = () => { for (const g of [...R().guards, ...R().dogs]) { g.x1 = g.x2 = g.x = -500; } };
  step(0.8); quiet();
  const S = {
    seam12: async () => { tp(X(2,0,0)-20, 0); step(0.5); await shot('seam12'); },
    crawl: async () => { tp(X(1,0.5,0), 0); step(0.4); await shot('stand'); step(0.5, ['down']); I.down.down = true; step(0.3, ['down']); await shot('crawl'); I.down.down = false; step(0.3); },
    cab: async () => { tp(X(2,0.45,0), 0); step(0.5); await shot('cab'); },
    gas: async () => { tp(X(3,0.16,0)-30, 0); R().flags.dDoor = 0; D0 = 1; step(1.2, ['right']); step(1.2); await shot('gas1'); step(2.2); await shot('gas2'); step(5); await shot('gas3'); },
    stair1: async () => { tp(X(4,0.2,0), 0); step(0.5); await shot('stair1'); },
    stair1top: async () => { tp(X(4,0.15,1), 1); step(0.5); await shot('stair1top'); },
    cam2: async () => { tp(X(2,0.85,1), 1); step(0.5); await shot('cam2a'); step(1.5); await shot('cam2b'); },
    stair2: async () => { tp(X(1,0.8,1), 1); step(0.5); await shot('stair2'); },
    laser3: async () => { tp(X(3,0.8,2), 2); step(0.5); await shot('laser3'); },
    lasers4: async () => { tp(X(2,0.58,3), 3); step(0.4); await shot('lasers4'); },
    roof: async () => { tp(X(1,0.6,3), 3); step(0.4); await shot('roof0'); R().flags.roofOpen = 1; step(0.3); await shot('roof1'); },
    ui: async () => { const up = R().ints.find(i => i.label === 'наверх' && i.y === T[0]); tp(up.x - 60, 0); step(0.3); await shot('ui_far'); tp(up.x, 0); step(0.3); await shot('ui_up');
      const dn = R().ints.find(i => i.label === 'вниз' && i.y === T[1]); R().stairT = 0; tp(dn.x, 1); step(0.3); await shot('ui_down'); tp(X(1,0.2,0), 0); step(0.3); await shot('ui_badge'); tp(X(1,0.64,0), 0); step(0.3); await shot('ui_egg'); I.hit.up = true; I.down.up = true; step(0.02); I.down.up = false; step(0.5); await shot('ui_egg2'); },
    catchair: async () => { const dn = R().ints.find(i => i.label === 'вниз' && i.y === T[1]); tp(dn.x - 30, 1); step(0.2); R().catchBy(null); step(1.3); await shot('catchair'); },
    dead4: async () => { tp(X(1,0.12,3), 3); step(0.4); await shot('dead4'); },
    mg: async () => { tp(X(3,0.5,2), 2); step(0.3); R().startMG('lasers', () => {}); step(0.3); await shot('mg'); R().mg = null; },
  };
  for (const k of (only || Object.keys(S))) { try { await S[k](); } catch (e) { out.push('ERR ' + k + ' ' + e.message); } }
  return out.join(' ');
};
