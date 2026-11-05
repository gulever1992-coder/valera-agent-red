# Лист нырка Валеры (Flow, art_src/l10/vdive.png, 2x4 на пурпурном) -> assets/l10/vDive10.png + запись в js/l10_data.js
# (только этот лист: остальные данные l10_data.js сохраняются как есть). Запуск: py tools/p10/build_vdive.py
import sys, os, json, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import build_l10 as B
s = open(os.path.join(B.ROOT, 'js', 'l10_data.js'), encoding='utf-8').read()
B.DATA.clear(); B.DATA.update(json.loads(re.search(r'window\.L10D = (\{.*\});', s, re.S).group(1)))
im = B.key(B.load('vdive.png'), 'magenta')
frs = B.grid(im, 2, 4)
names = ['dive0', 'swim0', 'swim1', 'swim2', 'glide', 'panic', 'up0', 'up1']
print('кадров', len(frs))
B.pack('vDive10', frs[:8], names[:len(frs)], 0.5, 'c')
B.write_data(); print('листов', len(B.DATA))
