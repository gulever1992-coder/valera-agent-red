const fs = require('fs'); let s = fs.readFileSync('tools/build_l5.py', 'utf8');
s = s.replace("if have('l5_fx.png'):", `if have('l5_cars3.png'):
    S['l5cars3'] = build_sheet('l5cars3', 'l5_cars3.png', 12, [-190, -150, -150, -150, -230, -170, -100, -100, -110, -120, -90, -80], grid=(4, 3), anchors=['center'] * 12)
if have('l5_props2.png'):
    S['l5props2'] = build_sheet('l5props2', 'l5_props2.png', 24, [-70, -70, -70, -60, -80, -60, -60, -50, -90, -60, -60, -60, -70, -80, -90, -160, -80, -50, -50, -40, -60, -80, -50, -70], grid=(4, 6), anchors=['center'] * 24)
if have('l5_fx.png'):`);
fs.writeFileSync('tools/build_l5.py', s);
