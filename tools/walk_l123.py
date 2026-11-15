# Ур.1–3: новые циклы ходьбы Валеры (Flow, ноги меняются местами) -> атласы v_run (ур.1–2) и v4_run (ур.3).
# Масштаб — по росту от ступней до лба стоящего Валеры того же уровня x0.95 (на ходу колени согнуты).
# Запускать после build_assets.py (он перезаписывает эти атласы старыми кадрами). Старые — art_src/l123walk/*_old.png
import os, sys, json, glob, subprocess, numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from p4v_height import face_h
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SPR = os.path.join(ROOT, 'assets', 'spr'); FR = os.path.join(ROOT, 'art_src/l123walk/frames')
p = os.path.join(ROOT, 'js', 'sprites_data.js'); s = open(p, encoding='utf-8').read(); i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); D = json.loads(s[i:j])
def ref_h(sheet, k):
    d = D[sheet]; f = d['f'][k]; a = np.array(Image.open(os.path.join(ROOT, d['img'])).convert('RGBA'))[f[1]:f[1] + f[3], f[0]:f[0] + f[2]]; return face_h(a)
def build(name, ref):
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools/p4v_grid.py'), os.path.join(ROOT, 'art_src/l123walk', name + '.jpg'), name, '2', '4', FR], check=True)
    fr = [Image.open(x).convert('RGBA') for x in sorted(glob.glob(os.path.join(FR, name + '_[0-9][0-9].png')))]
    hs = [face_h(np.array(f)) for f in fr]; k = 0.95 * ref_h(*ref) / float(np.median([h for h in hs if h]))
    imgs, meta = [], []
    for f in fr:
        f = f.resize((round(f.width * k), round(f.height * k)), Image.LANCZOS); a = np.array(f); a[..., 3] = np.where(a[..., 3] > 90, 255, 0)
        al = a[..., 3] > 0; ys = np.where(al.any(1))[0]; bot = ys[-1]; band = al[max(0, int(bot - f.height * 0.12)):bot + 1]; xs = np.where(band.any(0))[0]
        hx = np.where(al[ys[0]:ys[0] + 4].any(0))[0]; imgs.append(Image.fromarray(a)); meta.append(((xs[0] + xs[-1]) / 2, bot + 1, (hx[0] + hx[-1]) / 2, ys[0]))
    W = sum(m.width + 2 for m in imgs); H = max(m.height for m in imgs); at = Image.new('RGBA', (W, H)); x = 0; out = []
    for m, (ax, ay, hx, hy) in zip(imgs, meta):
        at.paste(m, (x, 0)); out.append([x, 0, m.width, m.height, round(float(ax), 1), float(ay), round(float(hx), 1), int(hy)]); x += m.width + 2
    at.save(os.path.join(SPR, name + '.png'), optimize=True); print(name, 'k', round(k, 3), [o[3] for o in out])
    D[name] = {'img': 'assets/spr/%s.png' % name, 'f': out}
build('v_run', ('v_jump', 0))
build('v4_run', ('v4_act', 0))
open(p, 'w', encoding='utf-8').write(s[:i] + json.dumps(D) + s[j:]); print('ok')
