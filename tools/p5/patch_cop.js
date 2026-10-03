const fs = require('fs'); let s = fs.readFileSync('js/level5.js', 'utf8');
s = s.replace("  for (const k of ['vova', 'valera4']) if", "  try { G.portraits.cop = await G.loadImage('assets/spr/p_cmd.png'); } catch (e) {}\n  for (const k of ['vova', 'valera4']) if");
fs.writeFileSync('js/level5.js', s);
let c = fs.readFileSync('js/level5scenes.js', 'utf8');
c = c.replace("pol.tx = carX - 330;", "pol.tx = carX - 215;").replace("pol.tx = carX - 270;", "pol.tx = carX - 200;");
c = c.replace("yield () => pol.x > carX - 380;", "yield () => pol.x > carX - 235;");
fs.writeFileSync('js/level5scenes.js', c);
