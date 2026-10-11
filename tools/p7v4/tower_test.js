// Бот-прогон карты D («Цех сортировки», 4 этажа): открыть ?l7v4=D, в консоли: eval(await (await fetch('tools/p7v4/tower_test.js')).text()); await __tower()
// Снимки уходят в приёмник tools/p7/recv7.py (art_src/l7/_tw_*.jpg).
window.__tower = async () => {
  const log = [], I = G.Input, R = () => App.level.run, P = () => R().player;
  const shot = async n => { try { await fetch('http://127.0.0.1:8783/', { method: 'POST', body: '_tw_' + n + '.jpg|' + document.querySelector('canvas').toDataURL('image/jpeg', 0.9) }); } catch (e) { log.push('shot fail ' + n); } };
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
  const tp = x => { const r = R(); P().x = x; r.world.cam.x = U.clamp(x - W / 2, 0, r.D.w - W); };
  const ko = fy => { const r = R(); for (const g of r.guards.filter(g => g.alive && Math.abs(g.y - fy) < 5)) { r.susp = 0; tp(g.x - g.facing * 30); P().facing = g.facing; tap('punch'); step(0.8); } return r.guards.filter(g => g.alive && Math.abs(g.y - fy) < 5).length; };
  const chk = (name, ok) => log.push((ok ? 'ok   ' : 'FAIL ') + name);
  step(0.5); await shot('f1_start');
  chk('F1 часовой вырублен', ko(300) === 0);
  tp(800); step(1, ['right']); await shot('f1_door1'); step(2.2); await shot('f1_door2'); step(1.4); await shot('f1_door3'); step(3); await shot('f1_gas');
  chk('сцена у двери', R().flags.dDoor === 2);
  tp(860); step(2.2, ['up']); chk('на 2 этаже', Math.abs(P().y - 160) < 2 && R().flags.dCp === 1); R().susp = 0; tp(700); step(0.3); await shot('f2');
  chk('F2 кладовщик вырублен', ko(160) === 0); tp(100); step(2.2, ['up']); chk('на 3 этаже', Math.abs(P().y - 20) < 2 && R().flags.dCp === 2); await shot('f3');
  tp(650); step(0.2); chk('пульт закрыт, пока охрана рядом', !R().near);
  chk('F3 трое вырублены', ko(20) === 0); tp(650); step(0.2); chk('пульт доступен', !!R().near); await shot('f3_panel');
  tap('up'); step(0.3); chk('мини-игра лазеров', !!R().mg); await shot('f3_mg'); tap('jump'); tap('left'); tap('jump'); step(2); chk('лазер 3 этажа отключён', R().flags.twL3 === 1 && !R().mg);
  tp(880); step(0.6, ['right']); chk('прошёл выключенный лазер', !R().caught && P().x > 900);
  tp(1091); step(2.2, ['up']); chk('на 4 этаже', Math.abs(P().y + 120) < 2 && R().flags.dCp === 3); R().susp = 0;
  tp(624); P().crouch = false; let caught = false; step(6, [], () => { R().susp = 0; if (R().caught) caught = true; }); chk('в промежутке между лазерами безопасно', !caught); await shot('f4_lasers');
  // честный проход трёх лазеров: ждать, пока ближайший слева погаснет, перебежать в следующий промежуток
  tp(680); for (const [lx, to] of [[652, 624], [596, 568], [540, 500]]) { const L = R().lasers.find(l => l.x === lx); let n = 0; while (L.on(R()) && n++ < 600) { step(1 / 60); R().susp = 0; } step(2, ['left'], () => { R().susp = 0; return P().x <= to ? 'stop' : 0; }); }
  chk('три лазера пройдены по таймингу', !R().caught && P().x <= 505);
  if (R().caught) { step(6); }
  chk('F4 постовой вырублен', ko(-120) === 0); tp(127); step(0.2); tap('up'); step(0.3); chk('мини-игра замка', !!R().mg); await shot('f4_mg');
  log.push('mg kind ' + (R().mg && R().mg.kind) + ' near ' + (R().near && R().near.label) + ' x ' + P().x + ' y ' + P().y);
  for (let i = 0; i < 3 && R().mg && R().mg.right; i++) { const m = R().mg; m.sel = i; tap('jump'); m.rsel = m.right.indexOf(i); tap('jump'); } step(2);
  chk('дверь на крышу открыта', R().flags.roofOpen === 1); step(1.2); tp(80); step(0.2); await shot('f4_door'); chk('выход доступен', !!R().near);
  // проверка поимки и возврата на чекпоинт
  const r = R(); r.catchBy(r.dogs[1]); step(7); chk('после поимки — снова на 4 этаже', Math.abs(P().y + 120) < 2 && !R().caught); await shot('f4_respawn');
  return log.join('\n');
};
