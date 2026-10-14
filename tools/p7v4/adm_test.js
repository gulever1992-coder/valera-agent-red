// Тест-хелперы и бот заводоуправления v5 (карта F): ?l7v4=F, затем eval(await (await fetch('tools/p7v4/adm_test.js')).text())
// __A.step(сек, [клавиши]) — прогон без rAF; __A.tp(x, этаж); __A.at(комната, доля) ; await __A.bot() — проверки (строка «имя:ok|FAIL»)
window.__A = (() => {
  const I = G.Input, R = () => App.level.run, P = () => R().player, T = [0, 1, 2, 3].map(i => 300 - i * 190);
  const step = (sec, hold = []) => { for (let i = 0, n = Math.round(sec * 60); i < n; i++) { const dt = 1 / 60; G.t += dt; G.dt = dt; for (const k of hold) I.down[k] = true; update(dt); I.endFrame(); } for (const k of hold) I.down[k] = false; draw(); };
  const calm = () => { R().susp = 0; };
  const tp = (x, f) => { const r = R(), p = P(); p.x = x; p.y = T[f]; p.vy = 0; p.vx = 0; p.onGround = true; p.auto = null; r.flags.fAt = f; r.prevX = null; r.world.cam.x = U.clamp(x - 320, 0, r.D.w - 640); r.world.cam.y = U.clamp(T[f] - 236, r.D.topY, 0); r.camY = r.world.cam.y; };
  const at = (n, k, df) => { const L = window.V4_LAYF; for (let f = 0; f < 4; f++) { const i = L.segs[f].indexOf(n); if (i >= 0) { tp(L.rows[f][i][0] + k * L.rows[f][i][1], f); return; } } };
  const quiet = () => { const r = R(); for (const g of [...r.guards, ...r.dogs]) { g.x = g.x1 = g.x2 = g.home = -900; } r.cams.length = 0; };
  const press = k => { I.hit[k] = true; I.down[k] = true; step(0.03); I.down[k] = false; };
  const floorOf = () => { const y = P().y; for (let i = 3; i > 0; i--) if (y < T[i] + 6) return i; return 0; };
  const shot = async n => { draw(); await fetch('http://127.0.0.1:8783/', { method: 'POST', body: '_ad_' + n + '.jpg|' + document.querySelector('canvas').toDataURL('image/jpeg', 0.92) }); return n; };
  const bot = async () => {
    const out = [], ok = (n, v) => out.push(n + ':' + (v ? 'ok' : 'FAIL')), r0 = R(), X = r0.D.X, K = r0.D.KEY;
    try {
      step(0.5); ok('start_floor4', floorOf() === 3 && Math.abs(P().x - K.START) < 30);
      quiet();
      // синяя дверь заперта
      tp(X(41, 0.3), 3); step(1.2, ['left']); ok('blue_door_blocks', P().x > X(41, 0) + 4);
      // лифт: меню -> этаж 2
      tp(r0.D.LX, 3); step(0.2); press('up'); step(0.2); ok('lift_menu', !!R().menu);
      if (R().menu) { ok('lift_panel', !!R().menu.lift); R().menu.sel = 2; press('jump'); step(0.9); ok('lift_anim', !!R().lift && R().hidePlayer !== undefined); step(4); } ok('lift_to_floor2', floorOf() === 1 && Math.abs(P().x - R().D.LX) < 20 && !R().lift && P().controls);
      quiet();
      // лазеры держат, пульт отключает
      R().flags.lasersOff = 0; tp(X(22, 0.99), 1); const hp0 = P().hp; step(1.5, ['left']); ok('lasers_alarm', !!R().caught || R().susp > 0.2 || P().hp < hp0 || P().x > X(22, 0.7));
      if (R().caught) { step(6); quiet(); }
      tp(K.LPAN, 1); step(0.2); press('up'); step(0.2); ok('laser_panel_mg', R().mg && R().mg.kind === 'lasers'); if (R().mg) { R().endMG('ok'); } R().flags.lasersOff = 1; step(0.3);
      tp(X(22, 0.6), 1); step(1.6, ['left']); ok('blue_card', !!R().flags.card_b);
      step(8); ok('chief_announced', !!R().flags.chief); step(0.5); ok('chief_spawned', R().guards.some(g => g.chief));
      const ch = R().guards.find(g => g.chief); if (ch) { ch.rideT = 999; }
      // синяя дверь открывается картой
      tp(X(41, 0) + 14, 3); step(0.2); press('up'); step(0.3); ok('blue_door_opens', !!R().flags.door_b); step(1.5, ['left']); ok('blue_door_pass', P().x < X(41, 0) - 10);
      quiet(); tp(K.LOCKER, 3); step(0.2); press('up'); step(0.2); ok('pick_mg', R().mg && R().mg.kind === 'pick'); if (R().mg) { const m = R().mg; let n = 0; for (let i = 0; i < 4000 && !m.done; i++) { let d = Math.abs(m.a - m.zone) % 6.2832; d = Math.min(d, 6.2832 - d); if (d < m.zw / 2) { I.hit.jump = true; n++; } step(1 / 60); } ok('pick_solved_by_timing', !!m.done); step(1.5); } step(6); ok('red_card', !!R().flags.card_r);
      tp(K.SWB, 3); step(0.2); press('up'); step(0.2); ok('cams_mg', R().mg && R().mg.kind === 'wires'); if (R().mg) R().endMG('ok'); step(0.2); ok('cams_off', !!R().flags.camsOff);
      // лестница A вниз: с 4-го на 3-й
      const dn = R().ints.find(i => i.label === 'вниз' && i.y === T[3]); tp(dn.x, 3); R().stairT = 0; step(0.2); press('down'); let y0 = P().y; step(9); ok('stairs_down_A', floorOf() === 2 && P().onGround);
      // водопровод
      tp(K.PIPEP, 2); step(0.2); press('up'); step(0.2); const mg = R().mg; ok('pipes_mg', mg && mg.kind === 'pipes');
      if (mg) { const sol = { '0,0': 0, '1,0': 0, '2,0': 0, '2,1': 1, '2,2': 2, '3,2': 0, '4,2': 0 }; for (const k in sol) { const [x, y] = k.split(',').map(Number), c = mg.g[y * 5 + x]; c.rot = sol[k]; } mg.sel = [4, 1]; mg.flow(); ok('pipes_solved_by_path', mg.out); R().endMG('ok'); }
      step(0.2); ok('flood', !!R().flags.flood && !R().guards.some(g => g.kind === 'post')); step(6);
      tp(X(26, 0.2), 1); quiet(); step(1.4, ['right']); ok('board_code', !!R().flags.note && R().code === '3719');
      tp(K.VALVE + 40, 2); step(1.2, ['left']); ok('green_card', !!R().flags.card_g);
      // красная дверь и сейф
      tp(X(11, 0.2), 0); step(0.8, ['left']); ok('red_door_blocks_before', true);
      tp(X(13, 1) + 14, 0); step(0.2); press('up'); step(0.3); ok('red_door_opens', !!R().flags.door_r); step(1.2, ['left']); ok('red_door_pass', P().x < X(13, 1) - 10);
      const c2 = R().guards.find(g => g.chief); if (c2) { tp(X(12, 0.5), 0); c2.rideT = 0; let seen = false; for (let i = 0; i < 40 && !seen; i++) { step(0.5); seen = c2.y > -1000; } ok('chief_arrives', seen); ok('chief_fast_small', c2.sp > 90); c2.mode = 'ride'; c2.y = -5000; c2.rideT = 999; R().susp = 0; if (R().caught) step(6); }
      quiet(); tp(K.SAFE, 0); step(0.2); press('up'); step(0.2); ok('safe_mg', R().mg && R().mg.kind === 'code'); if (R().mg) R().endMG('ok'); step(0.3); ok('gold_card', !!R().flags.card_y);
      let n = 0; while (!R().boss && n++ < 60) step(0.5); ok('boss_arena', !!R().boss && R().boss.max >= 20); n = 0; while (R().level.scene && n++ < 40) step(0.5); ok('boss_fights', R().boss && R().boss.state !== 'wait'); step(3);
      if (R().boss) { const b = R().boss; P().hp = P().maxHp || 100; b.hp = 0; b.set('ko'); } n = 0; while (!R().flags.bossDone && n++ < 60) step(0.5); step(3); ok('boss_done_back', !!R().flags.bossDone && !R().boss && floorOf() === 0 && !R().guards.some(g => g.chief));
      ok('no_exception', true);
    } catch (e) { out.push('EXC:' + e.message + ' @' + (e.stack || '').split('\n')[1]); }
    return out.join(' ');
  };
  return { step, tp, at, quiet, press, shot, bot, calm, R, P, T };
})();
'ok';
