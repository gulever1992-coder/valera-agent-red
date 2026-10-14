// Бот-прогон карты D («Цех сортировки», 4 этажа из комнат): открыть ?l7v4=D, в консоли: eval(await (await fetch('tools/p7v4/rooms5_test.js')).text()); await __rooms()
// Снимки уходят в приёмник tools/p7/recv7.py (art_src/l7/_r5_*.jpg).
window.__rooms = async () => {
  const X = (m, k, f) => App.level.run.D.RX(m, k, f), log = [], I = G.Input, R = () => App.level.run, P = () => R().player, PT = 190, T = [0, 1, 2, 3].map(i => 300 - i * PT);
  const shot = async n => { try { await fetch('http://127.0.0.1:8783/', { method: 'POST', body: '_r5_' + n + '.jpg|' + document.querySelector('canvas').toDataURL('image/jpeg', 0.9) }); } catch (e) { log.push('shot fail ' + n); } };
  const step = (sec, hold = [], each) => {
    for (let i = 0, n = Math.round(sec * 60); i < n; i++) {
      const dt = 1 / 60; G.t += dt; G.dt = dt; for (const k of hold) I.down[k] = true;
      try { update(dt); } catch (e) { log.push('ERR ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]); return false; }
      I.endFrame(); if (each && each(i) === 'stop') break;
    }
    for (const k of hold) I.down[k] = false;
    try { draw(); } catch (e) { log.push('DRAWERR ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]); return false; }
    return true;
  };
  const tap = k => { I.hit[k] = true; I.down[k] = true; step(1 / 60); I.down[k] = false; };
  const calm = () => { R().susp = 0; };
  const tp = x => { const r = R(); P().x = x; r.world.cam.x = U.clamp(x - W / 2, 0, r.D.w - W); calm(); };
  const ko = f => { const r = R(); for (const g of r.guards.filter(g => g.alive && Math.abs(g.y - T[f]) < 5)) { calm(); tp(g.x - g.facing * 30); P().facing = g.facing; tap('punch'); step(0.8, [], calm); } return r.guards.filter(g => g.alive && Math.abs(g.y - T[f]) < 5).length; };
  const chk = (name, ok) => log.push((ok ? 'ok   ' : 'FAIL ') + name);
  const stairs = async (name, f) => { const it = R().ints.find(i => /наверх/.test(i.label) && Math.abs(i.y - T[f]) < 3); tp(it.x); step(0.2, [], calm); chk(name + ': лестница рядом', R().near && /наверх/.test(R().near.label)); tap('up');
    step(1.2, [], calm); await shot(name + '_a'); step(2.4, [], calm); await shot(name + '_b'); step(5, [], calm); chk(name + ': поднялся', Math.abs(P().y - T[f + 1]) < 2 && !P().auto && R().flags.dCp === f + 1); };
  const hide = async (name, x) => { tp(x - 16); step(0.2, [], calm); chk(name + ': укрытие рядом', R().near && !!R().near.hide); tap('up'); step(0.2, [], calm); await shot(name + '_1'); step(0.3, [], calm); await shot(name + '_2'); step(0.8, [], calm); await shot(name + '_3');
    chk(name + ': спрятан', !!P().hidden); tap('left'); step(1, [], calm); chk(name + ': вышел', !P().seq && !P().hidden); };
  step(0.6); await shot('1_start'); step(3, [], calm); await shot('1_guard');
  await hide('1_cab', X(2, 0.45, 0));
  chk('1: часовой вырублен', ko(0) === 0); await shot('1_ko');
  tp(X(3, 0.16, 0) - 14); step(1.2, ['right'], calm); chk('1: сцена у гермодвери началась', !!App.level.scene);
  step(1.6); await shot('1_door1'); step(2.2); await shot('1_door2'); step(6); await shot('1_gas'); chk('1: сцена закончилась', !App.level.scene && R().flags.dDoor === 2);
  await stairs('1_st', 0); await shot('2_arrive');
  tp(X(2, 0.85, 1)); step(0.4, [], calm); await shot('2_cam'); await hide('2_shower', X(2, 0.72, 1)); await hide('2_door', X(3, 0.5, 1));
  chk('2: кладовщик вырублен', ko(1) === 0); tp(X(2, 0.3, 1)); step(0.3, [], calm); await shot('2_lockers'); tp(X(3, 0.5, 1)); step(0.3, [], calm); await shot('2_storage');
  await stairs('2_st', 1); await shot('3_arrive');
  tp(X(3, 0.5, 2)); step(0.2, [], calm); chk('3: пульт закрыт, пока охрана рядом', !R().near || !/пульт/.test(R().near.label)); tp(X(2, 0.5, 2)); step(0.3, [], calm); await shot('3_monitors');
  chk('3: трое вырублены', ko(2) === 0); tp(X(3, 0.5, 2)); step(0.3, [], calm); chk('3: пульт доступен', R().near && /пульт/.test(R().near.label)); await shot('3_panel');
  tap('up'); step(0.3); chk('3: мини-игра лазеров', !!R().mg); tap('jump'); tap('left'); tap('jump'); step(2); chk('3: лазер отключён', R().flags.twL3 === 1 && !R().mg);
  tp(X(3, 0.8, 2)); step(1.4, ['right'], calm); chk('3: прошёл проём с лазером', !R().caught && P().x > X(4, 0, 2));
  await stairs('3_st', 2); await shot('4_arrive');
  tp(X(2, 0.58, 3)); let caught = false; step(6, [], () => { calm(); if (R().caught) caught = true; }); chk('4: в промежутке между лазерами безопасно', !caught); await shot('4_lasers');
  tp(X(2, 0.8, 3)); for (const [lx, to] of [[X(2, 0.66, 3), X(2, 0.58, 3)], [X(2, 0.5, 3), X(2, 0.42, 3)], [X(2, 0.34, 3), X(2, 0.26, 3)]]) { const L = R().lasers.find(l => Math.abs(l.x - lx) < 2); let n = 0; while (!L.on(R()) && n++ < 600) step(1 / 60, [], calm); while (L.on(R()) && n++ < 1200) step(1 / 60, [], calm); step(2, ['left'], () => { calm(); return P().x <= to ? 'stop' : 0; }); }
  chk('4: три лазера пройдены по таймингу', !R().caught && P().x <= X(2, 0.26, 3) + 4);
  if (R().caught) step(7);
  chk('4: постовой вырублен', ko(3) === 0); tp(X(1, 0.365, 3)); step(0.2, [], calm); chk('4: замок рядом', R().near && /замок/.test(R().near.label)); tap('up'); step(0.3); chk('4: мини-игра замка', !!R().mg && !!R().mg.right);
  for (let i = 0; i < 3 && R().mg && R().mg.right; i++) { const m = R().mg; m.sel = i; tap('jump'); m.rsel = m.right.indexOf(i); tap('jump'); } step(2);
  chk('4: дверь на крышу открыта', R().flags.roofOpen === 1); tp(X(1, 0.52, 3)); step(0.3, [], calm); await shot('4_door'); chk('4: выход доступен', R().near && /крыш/.test(R().near.label));
  const r = R(); r.catchBy(r.dogs[1]); step(7); chk('после поимки — снова на 4 этаже', Math.abs(P().y - T[3]) < 2 && !R().caught);
  const d = R().ints.find(i => /вниз/.test(i.label) && Math.abs(i.y - T[3]) < 3); R().stairT = 0; tp(d.x); step(0.2, [], calm); tap('down'); step(1.5, [], calm); await shot('4_down'); step(8, [], calm); chk('спуск на 3 этаж', Math.abs(P().y - T[2]) < 2 && !P().auto);
  return log.join('\n');
};
