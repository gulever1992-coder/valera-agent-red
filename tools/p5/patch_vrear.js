const fs = require('fs'); let s = fs.readFileSync('js/level5scenes.js', 'utf8');
function rep(a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); s = s.replace(a, b); }
const a = s.indexOf('// Вова с «Осеменителем 3000» вылезает'), b = s.indexOf('// слои города');
s = s.slice(0, a) + `// Вова с «Осеменителем 3000» (режим против зомби) вылезает по пояс из ЗАДНЕГО окна: кадры l5vrear 0 вылезает, 1 целится, 2 стреляет, 3 смеётся
L5.drawVovaWindow = function (c, x, y, sc, fr) {
  const f = Spr.size('l5vrear', fr); if (!f[0]) return;
  c.save(); c.translate(x, y); c.scale(sc, sc);
  Spr.drawC(c, 'l5vrear', fr, -62 + (fr === 2 ? 3 : 0), -65.5 + 31 - f[1] / 2 + 2, 0, 1);
  c.restore();
};

` + s.slice(b);
rep("if (carFr >= 3 && carFr <= 5) L5.drawVovaWindow(c, carX + sway, GY + 4, 1, vg, carFr === 4);", "if (carFr >= 3 && carFr <= 5) L5.drawVovaWindow(c, carX + sway, GY + 4, 1, climb > 0 ? 0 : carFr === 4 ? 2 : carFr === 5 ? 3 : 1);");
rep("let wh = 0, scroll = 0,", "let climb = 0, wh = 0, scroll = 0,");
rep("t += dt; wh += speed * dt / 20;", "t += dt; if (climb > 0) climb -= dt; wh += speed * dt / 20;");
rep("carFr = 3; shake = 10;", "carFr = 3; climb = 0.9; shake = 10;");
rep("bullets.push({ x: carX + sway - 78, y: GY - 62,", "bullets.push({ x: carX + sway - 118, y: GY - 62,");
fs.writeFileSync('js/level5scenes.js', s);
let w = fs.readFileSync('js/level5world.js', 'utf8');
w = w.replace("Spr.drawC(c, 'l5sign', 2, o.sg.x, o.sg.y, o.sg.ang, 1.3)", "Spr.drawC(c, 'l5sign', 1, o.sg.x, o.sg.y, o.sg.ang, 1.5)");
fs.writeFileSync('js/level5world.js', w);
console.log('ok');
