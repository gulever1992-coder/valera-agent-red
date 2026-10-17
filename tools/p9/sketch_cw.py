# Эскиз-раскладка мостков на опорах с лестницей (точные пропорции) — референс для Flow. Логич. px * S = px картинки.
from PIL import Image, ImageDraw
S = 3.2; W, H = 1376, 768
L, END, RAIL, DECK, BEAM, LEGW, FEET = 120, 10, 40, 12, 8, 12, 100   # пролёт, вынос торца, перила, глубина настила, балка, ширина опоры, высота ног над полом
im = Image.new('RGB', (W, H), (255, 0, 255)); d = ImageDraw.Draw(im)
p = lambda v: round(v * S)
floor = H - 60; x0 = (W - p(3 * L + 2 * END)) // 2 + p(END)
legs = [x0 + p(i * L) for i in range(4)]
feet = floor - p(FEET); back = feet - p(DECK / 2); front = feet + p(DECK / 2)
L0, L1 = legs[0] - p(END), legs[3] + p(END)
def rail(y, col, gap=None):
    for yy in (y - p(RAIL), y - p(RAIL / 2)):
        if gap: d.rectangle((L0, yy, gap[0], yy + p(3)), col); d.rectangle((gap[1], yy, L1, yy + p(3)), col)
        else: d.rectangle((L0, yy, L1, yy + p(3)), col)
    xs = [L0] + [l for l in legs] + [l + p(L / 2) for l in legs[:3]] + [L1 - p(3)]
    for x in xs:
        if gap and gap[0] - p(3) < x < gap[1]: continue
        d.rectangle((x, y - p(RAIL), x + p(3), y), col)
    if gap:
        for x in (gap[0] - p(3), gap[1]): d.rectangle((x, y - p(RAIL), x + p(3), y), col)
lad = legs[2] + p(LEGW / 2 + 4)
rail(back, (110, 118, 126))
d.polygon([(L0, front), (L1, front), (L1 - p(4), back), (L0 + p(4), back)], (78, 86, 94))       # верх настила (решётка)
for x in range(L0 + p(6), L1, p(6)): d.line((x, back, x - p(2), front), (58, 64, 70), 2)
d.rectangle((L0, front, L1, front + p(BEAM)), (46, 51, 56))                                       # передняя балка
for l in legs:
    d.rectangle((l - p(LEGW / 2), front + p(BEAM), l + p(LEGW / 2), floor), (70, 77, 85))
    d.rectangle((l - p(2), front + p(BEAM), l + p(2), floor), (52, 57, 63))
    d.rectangle((l - p(LEGW / 2 + 5), floor - p(4), l + p(LEGW / 2 + 5), floor), (60, 66, 72))     # опорная плита
    for sx in (-1, 1):
        if (l == legs[0] and sx < 0) or (l == legs[3] and sx > 0): continue
        d.line((l + sx * p(LEGW / 2), front + p(BEAM + 26), l + sx * p(LEGW / 2 + 24), front + p(BEAM)), (70, 77, 85), p(3))   # косынки
lw = p(22); d.rectangle((lad, front - p(RAIL), lad + p(3), floor), (96, 104, 112)); d.rectangle((lad + lw - p(3), front - p(RAIL), lad + lw, floor), (96, 104, 112))
for y in range(floor - p(10), front - p(RAIL), -p(14)): d.rectangle((lad, y, lad + lw, y + p(2)), (96, 104, 112))
rail(front, (232, 192, 32), gap=(lad - p(2), lad + lw + p(2)))
im.save('tmp/up9/l9cwsketch.png')
print('legs', legs, 'feet', feet, 'floor', floor, 'ladder', lad, 'L0 L1', L0, L1)
