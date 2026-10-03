const fs = require('fs'); let s = fs.readFileSync('js/level5.js', 'utf8');
s = s.replace("  { n: 'hangar', f: 'f15', t: 't19', w: [260, 360], d: [100, 130], H: [50, 60], roof: 14, feats: ['crane'] },\n];",
`  { n: 'hangar', f: 'f15', t: 't19', w: [260, 360], d: [100, 130], H: [50, 60], roof: 14, feats: ['crane'] },
  { n: 'pink9', f: 'f16', t: 't16', w: [200, 280], d: [84, 100], H: [100, 124], roof: 8, feats: ['machine', 'antenna'] },
  { n: 'blue9', f: 'f17', t: 't16', w: [200, 280], d: [84, 100], H: [100, 124], roof: 8, feats: ['machine'] },
  { n: 'white9', f: 'f18', t: 't16', w: [90, 110], d: [84, 100], H: [118, 140], roof: 8, feats: ['antenna'] },
  { n: 'khrush', f: 'f19', t: 't17', w: [180, 260], d: [70, 84], H: [50, 58], roof: 9, pitch: 8 },
  { n: 'khrushY', f: 'f20', t: 't18', w: [180, 260], d: [70, 84], H: [50, 58], roof: 9, pitch: 8 },
  { n: 'brick12', f: 'f21', t: 't17', w: [96, 120], d: [90, 110], H: [124, 150], roof: 8, feats: ['machine', 'antenna'] },
  { n: 'longblock', f: 'f22', t: 't16', w: [340, 460], d: [84, 100], H: [96, 116], roof: 8, feats: ['vents', 'antenna'] },
  { n: 'barrack', f: 'f23', t: 't17', w: [150, 210], d: [60, 76], H: [34, 40], roof: 9, pitch: 12 },
  { n: 'canteen', f: 'f24', t: 't17', w: [150, 200], d: [70, 90], H: [38, 46], roof: 8, feats: ['chimney'] },
  { n: 'bank', f: 'f25', t: 't19', w: [120, 160], d: [70, 90], H: [44, 54], roof: 8 },
  { n: 'pharm', f: 'f26', t: 't18', w: [170, 230], d: [76, 92], H: [60, 72], roof: 8, feats: ['vents'] },
  { n: 'busst', f: 'f27', t: 't18', w: [180, 240], d: [70, 90], H: [30, 38], roof: 8 },
  { n: 'carwash', f: 'f28', t: 't19', w: [100, 140], d: [60, 80], H: [28, 34], roof: 14 },
  { n: 'college', f: 'f29', t: 't18', w: [220, 300], d: [80, 100], H: [54, 64], roof: 8, feats: ['flag'] },
  { n: 'pavil', f: 'f30', t: 't19', w: [140, 200], d: [60, 80], H: [22, 28], roof: 14, feats: ['awnings'] },
  { n: 'newb', f: 'f31', t: 't16', w: [100, 130], d: [90, 110], H: [110, 140], roof: 8, feats: ['machine'] },
];`);
s = s.replace(/  center: \[([^\]]*)\],/, (m, a) => `  center: [${a}, 1.5, 1.2, 1.2, 0.8, 0.8, 1, 1.5, 0, 0.5, 1.2, 1.2, 0.7, 0.2, 0.4, 0.8, 1],`);
s = s.replace(/  resid: \[([^\]]*)\],/, (m, a) => `  resid: [${a}, 3, 2.4, 2, 2.4, 2, 1.5, 1.2, 0.6, 0.3, 0.2, 0.6, 0.3, 0.1, 0.4, 0.5, 2],`);
s = s.replace(/  industrial: \[([^\]]*)\],/, (m, a) => `  industrial: [${a}, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.6, 0, 0, 0, 1, 0, 0.5, 0],`);
s = s.replace(/  private: \[([^\]]*)\],/, (m, a) => `  private: [${a}, 0, 0, 0, 0.3, 0.3, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0.3, 0],`);
const a = s.indexOf('L5.LAND = ['), b = s.indexOf('L5.LAKES');
const land = fs.readFileSync('tools/p5/land_new.js', 'utf8');
s = s.slice(0, a) + land + s.slice(b);
fs.writeFileSync('js/level5.js', s);
