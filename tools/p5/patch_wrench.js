const fs = require('fs');
let s = fs.readFileSync('js/level5logic.js', 'utf8');
function rep(a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 60)); s = s.replace(a, b); }
rep("for (let q = s + 500, i = 0; q < L5.LEN - 400; q += 760, i++) {", "const PK = ['ammo', 'wrench', 'ammo', 'wrench', 'nitro', 'wrench'];\n    for (let q = s + 450, i = 0; q < L5.LEN - 400; q += 520, i++) {");
rep("kind: i % 6 === 5 ? 'nitro' : i % 3 === 2 ? 'wrench' : 'ammo', t: Math.random() * 6 });", "kind: PK[i % 6], t: Math.random() * 6 });");
rep("      if (car.d.boss) { this.ammo", "      if (car.d.boss || Math.random() < 0.3) this.pick.push({ x: car.x, y: car.y, kind: 'wrench', t: 0 });\n      if (car.d.boss) { this.ammo");
fs.writeFileSync('js/level5logic.js', s);
