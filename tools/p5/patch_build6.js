const fs = require('fs'); let s = fs.readFileSync('tools/build_l5.py', 'utf8');
s = s.replace("if have('l5_fx.png'):", `if have('l5_vova_rear.png'):
    S['l5vrear'] = build_sheet('l5vrear', 'l5_vova_rear.png', 4, 56, ref=1, grid=(2, 2), anchors=['feet'] * 4)
if have('l5_signs.png'):
    S['l5sign'] = build_sheet('l5sign', 'l5_signs.png', 6, [-60, -60, -90, -90, -80, -80], grid=(3, 2), anchors=['center'] * 6)
if have('l5_fx.png'):`);
fs.writeFileSync('tools/build_l5.py', s);
