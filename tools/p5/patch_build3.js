const fs = require('fs'); let s = fs.readFileSync('tools/build_l5.py', 'utf8');
const a = s.indexOf("    exec(open(os.path.join(HERE, 'p5', 'kop_prep.py')"); const b = s.indexOf("\n", a);
s = s.slice(0, a) + "    os.chdir(ROOT); exec(open(os.path.join(HERE, 'p5', 'kop_prep.py'), encoding='utf-8').read())" + s.slice(b);
fs.writeFileSync('tools/build_l5.py', s);
