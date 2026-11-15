# Снимает пурпурную кайму (остаток маджента-фона) по краю спрайта. a — RGBA uint8 numpy, возвращает его же.
# 1) внешний слой пикселей с пурпурным оттенком — прозрачный; 2) следующие слои с оттенком — нейтральный тёмный контур.
import numpy as np
from scipy import ndimage
def _tint(a):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    return (r - g > 14) & (b - g > 14) & (np.abs(r - b) < 120)
def defringe(a, width=3):
    for _ in range(2):   # внешний слой — убрать (дважды: после первого прохода край сдвигается)
        al = a[..., 3] > 0; edge = al & ndimage.binary_dilation(~al, iterations=1)
        a[edge & _tint(a), 3] = 0
    al = a[..., 3] > 0; edge = al & ndimage.binary_dilation(~al, iterations=width); t = edge & _tint(a)
    lum = (a[..., 0].astype(int) + a[..., 1] + a[..., 2]) // 3
    v = np.clip(lum * 0.55, 18, 60).astype(np.uint8)
    a[t, 0] = v[t]; a[t, 1] = (v[t] * 0.92).astype(np.uint8); a[t, 2] = (v[t] * 0.88).astype(np.uint8)
    return a
