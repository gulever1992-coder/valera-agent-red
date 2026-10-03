const fs = require('fs'); let s = fs.readFileSync('js/level5scenes.js', 'utf8');
const a = s.indexOf('// «Копейка» из конца 4 уровня'), b = s.indexOf('// слои города');
const blk = `// «Копейка» из конца 4 уровня — отдельный объект: кузов (спрайт l5kop 0..6) + вращающиеся колёса (l5kop 7), без людей внутри.
// кадры сцены: 0,1,2 цела; 3,4,5 заднее стекло выбито; 6,7 милицейская (красная/синяя мигалка); 8 милицейская разбитая
L5.KOP_BODY = [0, 0, 0, 1, 1, 1, 4, 5, 6];
L5.KOP_W = { 0: [-56, 68, 23.3], 1: [-56, 68, 23.3], 4: [-56, 68, 37], 5: [-56, 68, 37], 6: [-56, 68, 37] };
L5.drawCar = function (c, fr, x, y, flip = 1, sc = 1, t = 0, o = {}) {
  const body = L5.KOP_BODY[fr] != null ? L5.KOP_BODY[fr] : 0, w = L5.KOP_W[body] || L5.KOP_W[0];
  const bob = Math.sin(t * 17) * (o.speed ? 0.7 : 0) + (o.bob || 0), rot = o.rot || 0;
  c.save(); c.translate(x, y + bob); c.rotate(rot); c.scale(sc, sc);
  const bh = (body >= 4 ? 93 : 65.5) / 2; // половина высоты кадра в логических px
  Spr.drawC(c, 'l5kop', body, 0, -bh + 3, 0, 1);
  for (const wx of [w[0], w[1]]) Spr.drawC(c, 'l5kop', 7, wx, -bh + 3 + w[2] - (body >= 4 ? 0 : 0), (o.wheel || 0), 1);
  c.restore();
};
// Вова с «Осеменителем 3000» вылезает из заднего окна (спрайт vovagun, обрезан линией окна)
L5.drawVovaWindow = function (c, x, y, sc, vg, firing) {
  c.save(); c.translate(x, y); c.scale(sc, sc);
  c.beginPath(); c.rect(-200, -300, 400, 300 - 24); c.clip();
  vg.x = -58; vg.y = -16 + (firing ? Math.sin(G.t * 50) * 1.2 : 0); vg.facing = -1; vg.draw(c);
  c.restore();
};

`;
s = s.slice(0, a) + blk + s.slice(b);
fs.writeFileSync('js/level5scenes.js', s);
