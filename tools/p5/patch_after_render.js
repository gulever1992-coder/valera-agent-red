const fs = require('fs'); let s = fs.readFileSync('js/level5world.js', 'utf8');
s = s.replace("L5.R.box(c, C, b, t)", "L5.R.box(c, C, b, t)");
s = s.replace(": L5.R.lamp(c, C, o, t, false)", ": L5.R.lamp(c, C, o, t)");
s = s.replace("L5.R.tree(c, C, o, t, L5.has('l5props'))", "L5.R.tree(c, C, o, t)");
fs.writeFileSync('js/level5world.js', s);
