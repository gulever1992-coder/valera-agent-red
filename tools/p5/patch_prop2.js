const fs = require('fs'); let s = fs.readFileSync('js/level5scenes.js', 'utf8');
function rep(a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); s = s.replace(a, b); }
rep("Spr.drawC(c, 'l5vrear', fr, -58 + (fr === 2 ? 3 : 0), -65.5 + 33 - f[1] * 0.85 + 2, 0, 1.7);", "Spr.drawC(c, 'l5vrear', fr, -78 + (fr === 2 ? 2 : 0), -30 - f[1] * 0.46, 0, 0.92);");
rep("Spr.drawC(c, 'l5kop', 7, wx, -bh + 3 + w[2] + 2, (o.wheel || 0), 0.68);", "Spr.drawC(c, 'l5kop', 7, wx, -bh + 3 + w[2] - 0.5, (o.wheel || 0), 0.5);");
rep("bullets.push({ x: carX + sway - 118, y: GY - 62,", "bullets.push({ x: carX + sway - 122, y: GY - 54,");
fs.writeFileSync('js/level5scenes.js', s);
