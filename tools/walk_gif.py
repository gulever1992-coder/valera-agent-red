# GIF-превью ходьбы всех наборов: верхний ряд — стойка, нижний — ходьба (art_src/walkc/walk_preview.gif)
import os, json
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(ROOT, 'js/sprites_data.js'), encoding='utf-8').read(); i = s.find('window.SPRITES = ') + 17; D = json.loads(s[i:s.find(';\nwindow.BGS', i)])
sets = [('v_jump', 0, 'v_run'), ('v4_act', 0, 'v4_run'), ('v19_mact', 0, 'v19_mrun'), ('v7_act', 0, 'v17_runs'), ('v12_fist', 0, 'v12_run'), ('v10_gun', 0, 'v10_gunw'), ('v11_gun', 0, 'v11_gunw')]
def fr(n, k):
    d = D[n]; f = d['f'][k]; return Image.open(os.path.join(ROOT, d['img'])).convert('RGBA').crop((f[0], f[1], f[0] + f[2], f[1] + f[3])), f[4], f[5]
CW, H = 160, 225; out = []
n = len(D['v_run']['f'])
for t in range(n):
    o = Image.new('RGBA', (CW * 7, H * 2), (70, 72, 90, 255))
    for j_, (sn, sk, wn) in enumerate(sets):
        for row, (nm, k) in enumerate([(sn, sk), (wn, t % len(D[wn]['f']))]):
            im, ax, ay = fr(nm, k); o.paste(im, (int(j_ * CW + CW / 2 - ax), int(row * H + H - 8 - ay)), im)
    out.append(o.convert('RGB'))
out[0].save(os.path.join(ROOT, 'art_src/walkc/walk_preview.gif'), save_all=True, append_images=out[1:], duration=166, loop=0)
strip = Image.new('RGB', (CW * n, H * 2), (70, 72, 90))
for t in range(n):
    for row, (wn) in enumerate(['v17_runs', 'v12_run']):
        im, ax, ay = fr(wn, t); strip.paste(im, (int(t * CW + CW / 2 - ax), int(row * H + H - 8 - ay)), im)
strip.save(os.path.join(ROOT, 'art_src/walkc/walk_strip.png')); print('gif ok', n)
