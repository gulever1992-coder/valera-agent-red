const fs = require('fs'); let s = fs.readFileSync('tools/build_l5.py', 'utf8');
s = s.replace("if have('l5_fx.png'):", `if have('l5_kop_parts.png'):
    exec(open(os.path.join(HERE, 'p5', 'kop_prep.py'), encoding='utf-8').read().replace("'art_src/", "SRC + '/").replace("SRC + '/l5_kop_parts.png'", "os.path.join(SRC, 'l5_kop_parts.png')"))
if have('l5_kop_grid.png'):
    S['l5kop'] = build_sheet('l5kop', 'l5_kop_grid.png', 9, [-300] * 7 + [-66, -66], grid=(3, 3), anchors=['center'] * 9)
if have('l5_fx.png'):`);
fs.writeFileSync('tools/build_l5.py', s);
