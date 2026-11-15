# Ур.4, новые номера: фон assets/roomNn.jpg + анимированная кровать с ботаником (атлас nerdbedN) -> sprites_data.js
import os, json, glob, numpy as np
from PIL import Image
import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from defringe import defringe
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SPR = os.path.join(ROOT, 'assets', 'spr')
ROOMS = {4: ('art_src/room_variants/room_brick_door.jpg', 'nerd4')}   # номер картинки комнаты -> (фон, кадры ботаника)
for k in (5, 6, 7, 8, 9, 10, 11, 0): ROOMS[k] = ('art_src/rooms_new/room%d_new.jpg' % k, 'nerd%d' % k)
BEDFR = {4: 0, 5: 1, 6: 2, 7: 3, 8: 4, 9: 6, 10: 7, 11: 8, 0: 5}   # кадр старой кровати beds9: ширина нового спрайта = ширине старой кровати
_s = open(os.path.join(ROOT, 'js', 'sprites_data.js'), encoding='utf-8').read(); _i = _s.find('window.SPRITES = ') + 17; OLD = json.loads(_s[_i:_s.find(';\nwindow.BGS', _i)])['beds9']['f']
S = {}
for k, (bg, nerd) in ROOMS.items():
    if not glob.glob(os.path.join(ROOT, 'art_src/l4v/frames/%s_00.png' % nerd)): print('нет кадров', nerd); continue
    Image.open(os.path.join(ROOT, bg)).convert('RGB').resize((1280, 720), Image.LANCZOS).save(os.path.join(ROOT, 'assets', 'room%dn.jpg' % k), quality=88, optimize=True)
    fr = [Image.open(p).convert('RGBA') for p in sorted(glob.glob(os.path.join(ROOT, 'art_src/l4v/frames/%s_[0-9][0-9].png' % nerd)))]
    sc = OLD[BEDFR[k]][2] / float(np.median([f.width for f in fr])); fr = [f.resize((round(f.width * sc), round(f.height * sc)), Image.LANCZOS) for f in fr]
    W = sum(f.width + 2 for f in fr); H = max(f.height for f in fr); at = Image.new('RGBA', (W, H), (0, 0, 0, 0)); x = 0; meta = []
    for f in fr:
        a = np.array(f); a[..., 3] = np.where(a[..., 3] > 90, 255, 0); f = Image.fromarray(defringe(a)); at.paste(f, (x, 0))
        meta.append([x, 0, f.width, f.height, round(f.width / 2, 1), float(f.height), round(f.width / 2, 1), 0]); x += f.width + 2
    at.save(os.path.join(SPR, 'nerdbed%d.png' % k), optimize=True); S['nerdbed%d' % k] = {'img': 'assets/spr/nerdbed%d.png' % k, 'f': meta}
    print('room', k, at.size)
p = os.path.join(ROOT, 'js', 'sprites_data.js'); s = open(p, encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); D = json.loads(s[i:j]); D.update(S)
open(p, 'w', encoding='utf-8').write(s[:i] + json.dumps(D) + s[j:]); print('ok', list(S))
