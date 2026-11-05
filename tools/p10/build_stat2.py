# Станции-платформы по образцу владельца (Flow, art_src/l10/stat2_1.jpg, 2x2 на пурпурном: ok/plug/dmg/dead) -> assets/l10/stat10.png
# (пишет только свой лист в js/l10_data.js). Запуск: py tools/p10/build_stat2.py
import sys, os, json, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import build_l10 as B
s = open(os.path.join(B.ROOT, 'js', 'l10_data.js'), encoding='utf-8').read()
B.DATA.clear(); B.DATA.update(json.loads(re.search(r'window\.L10D = (\{.*\});', s, re.S).group(1)))
old = B.DATA.get('stat10')
frs = B.grid(B.key(B.load('stat2_1.jpg'), 'magenta'), 2, 2)
print('кадров', len(frs), [f.size for f in frs])
B.pack('stat10', frs[:4], ['ok', 'plug', 'dmg', 'dead'], 0.5, 'bc')
B.write_data(); print('было', old and old['f'][:1], 'стало', B.DATA['stat10']['f'][:1])
