const fs = require('fs');
let s = fs.readFileSync('js/level5scenes.js', 'utf8');
const a = s.indexOf('// --- 3. Финал');
if (a < 0) throw new Error('нет финала');
s = s.slice(0, a) + `// --- 3. Финал: финиш на краю обрыва у моря, Граблионок сбрасывает «копейку» вниз, затем комикс
L5.sceneEnd = level => function* () {
  const bg = L5.img.l5_cliff_bg, GY = 300, FY = GY + 18;
  const val = new G.Actor('valera4', 150, FY, 1), vov = new G.Actor('vova', 118, FY, 1);
  let carX = 330, carY = GY + 4, carRot = 0, carVis = true, carFr = 2, mx = -260, mFr = 0, mVis = true, fade = 1, shake = 0, t = 0, fall = 0, vy = 0;
  level.drawScene = c => {
    c.save(); c.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    if (bg) c.drawImage(bg, 0, 0, W, H); else { c.fillStyle = '#c8a070'; c.fillRect(0, 0, W, H); }
    if (carVis) L5.drawCar(c, carFr, carX, carY, 1, 1, t, { speed: 0, rot: carRot });
    if (mVis && L5.has('l5msd')) Spr.drawC(c, 'l5msd', mFr, mx, GY + 12 - (Spr.size('l5msd', mFr)[1] || 60) / 2 + 10, 0, 1);
    vov.draw(c); val.draw(c);
    FX.draw(c);
    c.restore();
    if (fade > 0) { c.fillStyle = 'rgba(0,0,0,' + fade + ')'; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => {
    t += dt; if (shake > 0) shake = Math.max(0, shake - dt * 10); val.update(dt); vov.update(dt); FX.update(dt);
    if (fall) { vy += 380 * dt; carX += 70 * dt; carY += vy * dt; carRot += 1.3 * dt; }
  };
  Music.play('cutscene');
  yield* Scene.tween(0.8, k => { fade = 1 - k; });
  val.facing = 1; vov.facing = 1; val.setAnim('stand'); vov.setAnim('stand');
  yield* Scene.say('valera', 'Финиш! Граблионок остался где-то там, в пыли. Мы его сделали!', null);
  yield* Scene.say('vova', 'Скромность — наше второе имя. А «Осеменитель» — первое!', null);
  yield* Scene.say('valera', 'Ты только глянь: море, лес, мост вдали, пустыня... Красота-то какая.', null);
  yield* Scene.say('vova', 'Я таким видом даже не напьюсь. Ну... почти. Поехали домой.', null);
  // садятся в «копейку»
  yield* Scene.moveTo(val, carX - 40, 55, 'walk'); Sound.play('door'); val.visible = false; yield 0.3;
  yield* Scene.moveTo(vov, carX - 70, 55, 'walk'); Sound.play('door'); vov.visible = false; carFr = 2; yield 0.6;
  // из-за кадра несётся разъярённый Граблионок
  Sound.play('honk'); mFr = 0; const tm = { v: 0 };
  yield* Scene.tween(1.5, k => { mx = -260 + k * (carX - 235 + 260); });
  yield* Scene.say('grab', 'Я НЕ ПРОИГРАЛ!!! ТАК НЕ ЧЕСТНО!!! ЭТО БЫЛО НЕ ПО ПРАВИЛАМ!!!', null);
  Sound.play('honk'); yield 0.5;
  yield* Scene.tween(0.55, k => { mx = carX - 235 + k * 170; });
  // удар
  mFr = 1; Sound.play('crash'); G.shake(8, 0.5); shake = 14; G.flash(0.2, '#ffffff'); FX.burst(carX - 90, GY - 20, 22, { colors: ['#ffd84a', '#ff8a2a', '#fff', '#8a8a90'], speed: 220, life: 0.7, grav: 120 });
  fall = 1; vy = -40; Sound.play('boom');
  FX.popText(carX, GY - 80, 'А-А-А-А!!!', '#ffd84a');
  yield 0.9; G.say(this, '', 0);
  yield* Scene.tween(0.9, k => { fade = k; });
  carVis = false; mVis = false; fall = 0;
  // комикс — как на уровне 3
  L3.img.l5c1 = L5.img.l5_comic_end1; L3.img.l5c2 = L5.img.l5_comic_end2;
  yield* L3.comic(level, [
    { img: 'l5c1', sfx: 'crash', cap: 'Где-то внизу, на пустыре...', lines: [['Ох... голова... Вова? Ты живой?', 140, 60]] },
    { img: 'l5c2', sfx: 'wind', cap: 'Тишина. Только ветер.', lines: [['Вова?.. Куда он делся? Только следы...', 150, 56], ['Сколько я был в отключке?', 150, 120]], title: 'КОНЕЦ УРОВНЯ 5' }
  ])();
  Scene.dialog = null;
};
`;
fs.writeFileSync('js/level5scenes.js', s);
let l = fs.readFileSync('js/level5.js', 'utf8');
l = l.replace("['l5_hq', '.jpg']];", "['l5_hq', '.jpg'], ['l5_cliff_bg', '.jpg'], ['l5_comic_end1', '.jpg'], ['l5_comic_end2', '.jpg']];");
fs.writeFileSync('js/level5.js', l);
let b = fs.readFileSync('tools/build_l5.py', 'utf8');
b = b.replace("if have('l5_signs.png'):", "if have('l5_matiz_side.png'):\n    S['l5msd'] = build_sheet('l5msd', 'l5_matiz_side.png', 2, [-150, -150], grid=(2, 1), anchors=['feet'] * 2)\nif have('l5_signs.png'):");
fs.writeFileSync('tools/build_l5.py', b);
console.log('ok');
