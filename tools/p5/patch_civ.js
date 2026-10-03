const fs = require('fs'); let s = fs.readFileSync('js/level5ent.js', 'utf8');
s = s.replace("  tractor: {", `  tram: { sh: 'l5cars3', fr: [4], L: 230, Wd: 40, max: 95, acc: 80, grip: 9, turn: 0.9, hp: 220, m: 5 },
  tow: { sh: 'l5cars3', fr: [6], L: 100, Wd: 36, max: 180, acc: 180, grip: 6.5, turn: 1.9, hp: 70, m: 1.8 },
  limo: { sh: 'l5cars3', fr: [7], L: 100, Wd: 32, max: 190, acc: 190, grip: 7, turn: 1.8, hp: 60, m: 1.6 },
  mixer: { sh: 'l5cars3', fr: [8], L: 110, Wd: 38, max: 105, acc: 100, grip: 6, turn: 1.6, hp: 100, m: 2.5 },
  crane: { sh: 'l5cars3', fr: [9], L: 120, Wd: 38, max: 95, acc: 90, grip: 6, turn: 1.5, hp: 110, m: 2.8 },
  paz: { sh: 'l5cars3', fr: [10], L: 90, Wd: 34, max: 150, acc: 150, grip: 6.5, turn: 1.9, hp: 60, m: 1.6 },
  icecream: { sh: 'l5cars3', fr: [11], L: 80, Wd: 32, max: 140, acc: 140, grip: 6.5, turn: 2, hp: 44, m: 1.2 },
  tractor: {`);
s = s.replace("'moskvich', 'minibus'];", "'moskvich', 'minibus', 'tram', 'tow', 'limo', 'mixer', 'crane', 'paz', 'icecream', 'limo', 'paz'];\nL5.civTypes = () => L5.CIV_TYPES.filter(k => L5.has(L5.CARDEF[k].sh));");
fs.writeFileSync('js/level5ent.js', s);
let l = fs.readFileSync('js/level5logic.js', 'utf8');
l = l.split('U.choice(L5.CIV_TYPES)').join('U.choice(L5.civTypes())');
fs.writeFileSync('js/level5logic.js', l);
