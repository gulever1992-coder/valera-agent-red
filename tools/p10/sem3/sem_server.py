# Сервер «Редактора фазы 3» (tools/p10/sem3/editor.html). Порт 18803. Запуск из корня игры: py tools/p10/sem3/sem_server.py
# POST /save   {data, images: {имя: dataURL}, sem: {x, y, H} | null} -> js/sem3_data.js, assets/l10/sem3/<имя>.png (+ копия в art_src/l10/sem3)
# POST /layout {layout} -> js/sea3_layout.js (сцена: слои, станции, Семён, вода, атаки)
# POST /upload {name, url} -> assets/l10/sea3/<name>.png (своя картинка для слоя сцены)
# POST /img    {path: 'assets/l10/stat10.png', url} -> перезаписать картинку игры (оригинал один раз копируется в art_src/l10/sea3/_orig)
# POST /shot   {name, url} -> art_src/l10/sem3/_shots/<name> (снимок для проверки)
# POST /build  -> optimize_assets.py + поднять G.VER и ?v=; ответ {ok, log, ver}
import base64, io, json, os, re, shutil, subprocess, http.server

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
IMG = os.path.join(ROOT, 'assets', 'l10', 'sem3'); SRC = os.path.join(ROOT, 'art_src', 'l10', 'sem3')
SEA = os.path.join(ROOT, 'assets', 'l10', 'sea3'); ORIG = os.path.join(ROOT, 'art_src', 'l10', 'sea3', '_orig')
HEAD = ('// Семён анфас для фазы 3 (уровень 10). Пишет «Редактор фазы 3» (Редактор фазы 3.bat -> tools/p10/sem3/editor.html).\n'
        '// Части — assets/l10/sem3/<img>.png; кости в координатах модели; анимации: k{кость:[[t,угол,dx,dy,масштаб]]}, c{mouth|eye:[[t,v]]}, v{группа:[[t,вариант]]}.\n'
        '// use: true — игра рисует этого Семёна (L10.Sem3), иначе старый риг L10.RigFront.\n')
LHEAD = ('// Раскладка и параметры фазы 3 «МОРЕ». Пишут «Редактор фазы 3.bat» (tools/p10/sem3/editor.html) и «Конструктор моря.bat».\n'
         '// layers — слои сцены по порядку (см. LAYERS в level10sea.js); WY — вода у плотов; sem — Семён (x, y = линия воды, H); stations — станции (x, y, s, leg);\n'
         '// bg — горизонт и море; lanes — ряды плотов; atk — параметры атак.\n')
NAME = re.compile(r'[A-Za-z0-9_-]+')
PATH = re.compile(r'assets/l10/(sea3/|sem3/)?[A-Za-z0-9_-]+\.(png|jpg)')


def dataurl(u): return base64.b64decode(u.split(',', 1)[1])


def bump():
    eng = os.path.join(ROOT, 'js', 'engine.js'); idx = os.path.join(ROOT, 'index.html')
    s = open(eng, encoding='utf-8').read(); m = re.search(r"VER: '(\d+)'", s); old = m.group(1); new = str(int(old) + 1)
    open(eng, 'w', encoding='utf-8').write(s.replace("VER: '%s'" % old, "VER: '%s'" % new, 1))
    h = open(idx, encoding='utf-8').read(); open(idx, 'w', encoding='utf-8').write(h.replace('?v=' + old, '?v=' + new))
    return new


def save_sem(sem):
    fp = os.path.join(ROOT, 'js', 'sea3_layout.js'); s = open(fp, encoding='utf-8').read()
    new = '"sem": ' + json.dumps({k: round(float(sem[k]), 1) for k in ('x', 'y', 'H')})
    s2, n = re.subn(r'"sem":\s*\{[^}]*\}', new, s, count=1)
    if n: open(fp, 'w', encoding='utf-8').write(s2)


class H(http.server.BaseHTTPRequestHandler):
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', 'Content-Type'); self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')

    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()

    def reply(self, obj):
        b = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(200); self.cors(); self.send_header('Content-Type', 'application/json; charset=utf-8'); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)

    def do_POST(self):
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)) or 0)
        try:
            d = json.loads(body.decode('utf-8') or '{}')
            if self.path.startswith('/save'):
                os.makedirs(IMG, exist_ok=True); os.makedirs(SRC, exist_ok=True)
                for name, url in (d.get('images') or {}).items():
                    if not NAME.fullmatch(name): continue
                    raw = dataurl(url); open(os.path.join(IMG, name + '.png'), 'wb').write(raw); open(os.path.join(SRC, name + '.png'), 'wb').write(raw)
                if d.get('data'):
                    open(os.path.join(ROOT, 'js', 'sem3_data.js'), 'w', encoding='utf-8').write(HEAD + 'L10.SEM3 = ' + json.dumps(d['data'], ensure_ascii=False, separators=(',', ':')) + ';\n')
                if d.get('sem'): save_sem(d['sem'])
                return self.reply({'ok': True})
            if self.path.startswith('/layout'):
                open(os.path.join(ROOT, 'js', 'sea3_layout.js'), 'w', encoding='utf-8').write(LHEAD + 'L10.SEA3 = ' + json.dumps(d['layout'], ensure_ascii=False, indent=1) + ';\n')
                return self.reply({'ok': True})
            if self.path.startswith('/upload'):
                n = d.get('name', '')
                if not NAME.fullmatch(n): return self.reply({'ok': False, 'log': 'bad name'})
                os.makedirs(SEA, exist_ok=True); open(os.path.join(SEA, n + '.png'), 'wb').write(dataurl(d['url']))
                return self.reply({'ok': True})
            if self.path.startswith('/img'):
                rel = d.get('path', '').replace('\\', '/')
                if not PATH.fullmatch(rel): return self.reply({'ok': False, 'log': 'path not allowed'})
                fp = os.path.join(ROOT, rel); os.makedirs(ORIG, exist_ok=True); bk = os.path.join(ORIG, rel.replace('/', '__'))
                if os.path.exists(fp) and not os.path.exists(bk): shutil.copyfile(fp, bk)
                raw = dataurl(d['url'])
                if rel.endswith('.jpg'):
                    from PIL import Image
                    Image.open(io.BytesIO(raw)).convert('RGB').save(fp, quality=92)
                else: open(fp, 'wb').write(raw)
                return self.reply({'ok': True})
            if self.path.startswith('/shot'):
                out = os.path.join(SRC, '_shots'); os.makedirs(out, exist_ok=True)
                open(os.path.join(out, os.path.basename(d['name'])), 'wb').write(dataurl(d['url']))
                return self.reply({'ok': True})
            if self.path.startswith('/build'):
                r = subprocess.run(['py', 'tools/optimize_assets.py'], cwd=ROOT, capture_output=True, text=True, encoding='utf-8', errors='replace')
                log = r.stdout[-800:] + r.stderr[-2000:]
                if r.returncode: return self.reply({'ok': False, 'log': log})
                return self.reply({'ok': True, 'log': log, 'ver': bump()})
            self.reply({'ok': False, 'log': 'unknown path'})
        except Exception as e:
            self.reply({'ok': False, 'log': repr(e)})

    def log_message(self, *a): pass


print('phase3 editor server on http://localhost:18803', flush=True)
http.server.ThreadingHTTPServer(('127.0.0.1', 18803), H).serve_forever()
