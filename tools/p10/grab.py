# Ждать новый скачанный из Flow файл (новее метки) -> art_src/l10/<name>.png.  py tools/p10/grab.py name [сек=120]
import sys, os, glob, time
from PIL import Image
name = sys.argv[1]; wait = float(sys.argv[2]) if len(sys.argv) > 2 else 120
D = os.path.expanduser('~/Downloads'); MK = os.path.join(os.path.dirname(__file__), '.mark')
t0 = os.path.getmtime(MK) if os.path.exists(MK) else time.time() - 600
end = time.time() + wait
while True:
    fs = [f for f in glob.glob(D + '/*') if os.path.isfile(f) and os.path.getmtime(f) > t0 and not f.endswith(('.crdownload', '.jpg')) or (f.endswith('.jpg') and os.path.getmtime(f) > t0 and os.path.isfile(f))]
    fs = [f for f in fs if not f.endswith('.crdownload')]
    if fs:
        f = min(fs, key=os.path.getmtime); time.sleep(1)
        try: im = Image.open(f).convert('RGB'); break
        except Exception: pass
    if time.time() > end: sys.exit('нет файла')
    time.sleep(1.5)
out = os.path.join(os.path.dirname(__file__), '..', '..', 'art_src', 'l10', name + '.png')
im.save(out); mt = os.path.getmtime(f); os.remove(f)
open(MK, 'w').close(); os.utime(MK, (mt, mt))
print(name, im.size)
