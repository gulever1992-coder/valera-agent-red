# Маски целых рук: кадр позы (Flow, правка от Т-позы без пулемёта) минус исходный кадр t_nogun_a.
# Кадры совпадают пиксель в пиксель (проверено по голове), поэтому разница = новые руки.
import os, sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SH = os.path.join(ROOT, 'art_src', 'l10', 'sem3', '_shots'); OUTD = os.path.join(ROOT, 'art_src', 'l10', 'sem3', 'arms')
POSES = ['hang', 'roar', 'low', 'palmUp', 'clap', 'fistUp', 'smash', 'guard', 'grab', 'clapOpen', 'clapShut', 'pound', 'chest', 'point']
CX = 690

def magenta(a):
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    return (r > 150) & (b > 150) & (g < 110) & (np.abs(r - b) < 90)

def mask(k):
    base = np.asarray(Image.open(os.path.join(SH, 't_nogun_a.jpg')).convert('RGB').filter(ImageFilter.GaussianBlur(1.5))).astype(int)
    im = Image.open(os.path.join(SH, 'arm_%s_full.jpg' % k)).convert('RGB')
    a = np.asarray(im.filter(ImageFilter.GaussianBlur(1.5))).astype(int)
    d = np.abs(a - base).max(2)
    m = (d > 42) & ~magenta(np.asarray(im))
    # бывшая зона рук Т-позы (не фон в исходнике и не тело): там всё, что не фон, — новая рука
    raw = np.asarray(Image.open(os.path.join(SH, 't_nogun_a.jpg')).convert('RGB'))
    body = np.zeros(raw.shape[:2], bool); ba = np.asarray(Image.open(os.path.join(ROOT, 'assets', 'l10', 'sem3', 'p_body.png')).getchannel('A')) > 60
    body[23:23 + ba.shape[0], 490:490 + ba.shape[1]] = ba
    tarm = nd.binary_dilation(~magenta(raw) & ~body, iterations=4) & ~body; tarm[548:] = False     # без воды у пояса
    m |= tarm & ~magenta(np.asarray(im))
    m = nd.binary_opening(m, iterations=2)
    lab, n = nd.label(m); sz = nd.sum(m, lab, range(1, n + 1))
    m = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s > 1500])
    m = nd.binary_closing(m, iterations=6); m = nd.binary_fill_holes(m)
    m &= ~magenta(np.asarray(im))
    return im, m

if __name__ == '__main__':
    ks = sys.argv[1:] or POSES
    W, H = 460, 257; sheet = Image.new('RGB', (W * 3, H * ((len(ks) + 2) // 3)), (40, 40, 40))
    for n, k in enumerate(ks):
        im, m = mask(k)
        show = np.asarray(im).copy(); show[~m] = (show[~m] * 0.25).astype(np.uint8)
        sheet.paste(Image.fromarray(show).resize((W, H)), ((n % 3) * W, (n // 3) * H))
    sheet.save(os.path.join(SH, 'arm_masks.jpg'), quality=85)
