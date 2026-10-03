const fs = require('fs'); let s = fs.readFileSync('js/level5scenes.js', 'utf8');
function rep(a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 50)); s = s.replace(a, b); }
rep("val.visible = vov.visible = false;\n  let scroll = 0,", "val.visible = vov.visible = false;\n  const vg = new G.Actor('vovagun', 0, 0, -1); try { vg.setAnim('hold'); } catch (e) {}\n  let wh = 0, scroll = 0,");
rep("1, 1, t);\n    L5.drawCar(c, carFr, carX + sway, GY + 4 + bob, 1, 1, t);", "1, 1, t, { speed: 1, wheel: wh * 0.9 });\n    L5.drawCar(c, carFr, carX + sway, GY + 4, 1, 1, t, { speed: speed > 20 ? 1 : 0, wheel: wh, rot: Math.sin(t * 2.2) * 0.02 * Math.min(1, speed / 150) + (carFr >= 4 && carFr <= 5 ? -0.012 : 0) });\n    if (carFr >= 3 && carFr <= 5) L5.drawVovaWindow(c, carX + sway, GY + 4, 1, vg, carFr === 4);");
rep("t += dt; scroll += speed * dt;", "t += dt; wh += speed * dt / 20; vg.update && vg.update(dt); scroll += speed * dt;");
rep("L5.drawCar(c, 5, carX, GY + 22, 1, 0.82);", "L5.drawCar(c, 2, carX, GY + 22, 1, 1, G.t, { speed: 0 });");
fs.writeFileSync('js/level5scenes.js', s);
