const fs = require('fs'); let s = fs.readFileSync('js/level5extra.js', 'utf8');
const a = "c.drawImage(RI, cell * 256, 0, 256, 256, mid - TS / 2, -TS / 2, TS + 0.6, TS);";
if (!s.includes(a)) throw new Error('нет');
s = s.replace(a, "c.drawImage(RI, cell * 256, 72, 256, 98, mid - TS / 2, -TS * 0.218, TS + 0.6, TS * 0.383);");
fs.writeFileSync('js/level5extra.js', s);
