const fs = require('fs');
let s = fs.readFileSync('js/level5logic.js', 'utf8');
function rep(a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); s = s.replace(a, b); }
const i = s.indexOf("      if (pl.s >= L5.S_MATCH && !this.matiz && alive === 0");
const j = s.indexOf("    } else {", i);
if (i < 0 || j < 0) throw new Error('блок');
s = s.slice(0, i) + "      // середина маршрута: всегда в одном месте начинается катсцена с Граблионком, там же стартует гонка\n      if (pl.s >= L5.S_RACE - 170 && !this.matchStarted && !pl.dead) { this.matchStarted = true; this.playScene(L5.sceneMatch(this), () => this.startRaceSetup()); }\n" + s.slice(j);
fs.writeFileSync('js/level5logic.js', s);

let t = fs.readFileSync('js/level5scenes.js', 'utf8');
const a = t.indexOf('L5.sceneMatch = level => function* () {');
const b = t.indexOf('// --- 3. Финал');
if (a < 0 || b < 0) throw new Error('scene');
t = t.slice(0, a) + `L5.sceneMatch = level => function* () {
  const pl0 = level.pl, SR = L5.S_RACE;
  // милиция исчезает, «копейка» плавно встаёт ровно на линию старта, сзади догоняет Граблионок и встаёт рядом
  level.cars = level.cars.filter(c => c === pl0 || !(c.cop || c.d.boss)); level.ebullets = []; level.bullets = []; level.clouds = [];
  const pA = L5.at(SR, { lane: 24 }), mB = L5.at(SR, { lane: -24 }), back = L5.at(SR - 780, { lane: -24 });
  const m0 = level.matiz = new L5.Car('matiz', back.x, back.y, back.ang); m0.invul = 1e9; m0.isMatiz = true; m0.lane = -24; m0.s = SR - 780; level.cars.push(m0);
  const p0 = { x: pl0.x, y: pl0.y, ang: pl0.ang }, angD = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  pl0.vx = pl0.vy = 0; pl0.thr = pl0.brk = pl0.str = 0;
  level.drawScene = c => { L5.R.world(level, c); level.drawHUD(c); };
  level.updateScene = dt => { level.t += dt; for (const e of L5.fxs) e.t += dt; level.cam.x = pl0.x; level.cam.y = pl0.y; };
  Sound.play('honk');
  yield* Scene.tween(2.0, k => {
    const e1 = 1 - Math.pow(1 - Math.min(1, k * 1.5), 3), e2 = 1 - Math.pow(1 - k, 2.2);
    pl0.x = p0.x + (pA.x - p0.x) * e1; pl0.y = p0.y + (pA.y - p0.y) * e1; pl0.ang = p0.ang + angD(p0.ang, pA.ang) * e1; pl0.vx = pl0.vy = 0; pl0.s = L5.proj(pl0.x, pl0.y, SR, 400).s;
    m0.x = back.x + (mB.x - back.x) * e2; m0.y = back.y + (mB.y - back.y) * e2; m0.ang = back.ang; m0.vx = m0.vy = 0; m0.s = SR - 780 + 780 * e2;
  });
  pl0.x = pA.x; pl0.y = pA.y; pl0.ang = pA.ang; pl0.s = SR; m0.x = mB.x; m0.y = mB.y; m0.ang = mB.ang; m0.s = SR;
  Sound.play('honk');
  yield* Scene.say('grab', 'Эй, посоны! Ставлю Валерину задницу на то, что я на матизе вас обгоню!', null);
  yield* Scene.say('valera', 'Не подведи меня.', null);
  G.flash(0.2, '#ffffff'); Sound.play('honk');
};

` + t.slice(b);
fs.writeFileSync('js/level5scenes.js', t);
console.log('ok');
