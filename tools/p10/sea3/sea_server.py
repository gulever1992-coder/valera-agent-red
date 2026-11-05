# Сервер конструктора фазы 3 «МОРЕ» (tools/p10/sea3/editor.html). Порт 18802.
# POST /save  {layout: {...L10.SEA3}, overrides: {J, R}, masks: {<слой>_erase|<слой>_add: dataURL png | null}}
#   -> js/sea3_layout.js, art_src/l10/rig3/edit/overrides.json и маски
# POST /build -> build_rig3.py + apply_masks.py + optimize_assets.py + поднять G.VER и ?v=; ответ {ok, log, ver}
# Запуск из корня игры: py tools/p10/sea3/sea_server.py
import base64, json, os, re, subprocess, http.server

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
EDIT = os.path.join(ROOT, 'art_src', 'l10', 'rig3', 'edit')
HEAD = ('// Раскладка и параметры фазы 3 «МОРЕ» (Семён анфас). Пишет конструктор «Конструктор моря.bat» (tools/p10/sea3/editor.html).\n'
        '// WY — линия воды у плотов; sem — Семён (x, y = его линия воды, H — высота над водой); stations — станции (x, y, s — масштаб);\n'
        '// legA — откуда из спины выходят лапы; bg — фон моря; raftX0 — откуда выплывают плоты; atk — параметры атак (см. вкладку «Атаки»).\n')


def bump():
    eng = os.path.join(ROOT, 'js', 'engine.js'); idx = os.path.join(ROOT, 'index.html')
    s = open(eng, encoding='utf-8').read(); m = re.search(r"VER: '(\d+)'", s); old = m.group(1); new = str(int(old) + 1)
    open(eng, 'w', encoding='utf-8').write(s.replace("VER: '%s'" % old, "VER: '%s'" % new, 1))
    h = open(idx, encoding='utf-8').read(); open(idx, 'w', encoding='utf-8').write(h.replace('?v=' + old, '?v=' + new))
    return new


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
            if self.path.startswith('/save'):
                d = json.loads(body.decode('utf-8')); os.makedirs(EDIT, exist_ok=True)
                if d.get('layout'):
                    txt = HEAD + 'L10.SEA3 = ' + json.dumps(d['layout'], ensure_ascii=False, indent=1) + ';\n'
                    open(os.path.join(ROOT, 'js', 'sea3_layout.js'), 'w', encoding='utf-8').write(txt)
                if 'overrides' in d: json.dump(d['overrides'], open(os.path.join(EDIT, 'overrides.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
                for name, url in (d.get('masks') or {}).items():
                    if not re.fullmatch(r'[A-Za-z0-9]+_(erase|add)', name): continue
                    fp = os.path.join(EDIT, name + '.png')
                    if url is None:
                        if os.path.exists(fp): os.remove(fp)
                        continue
                    open(fp, 'wb').write(base64.b64decode(url.split(',', 1)[1]))
                return self.reply({'ok': True})
            if self.path.startswith('/build'):
                log = ''
                for cmd in (['py', 'tools/p10/rig/build_rig3.py'], ['py', 'tools/p10/sea3/apply_masks.py'], ['py', 'tools/optimize_assets.py']):
                    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding='utf-8', errors='replace')
                    log += '$ ' + ' '.join(cmd) + '\n' + r.stdout[-800:] + r.stderr[-3000:]
                    if r.returncode: return self.reply({'ok': False, 'log': log})
                return self.reply({'ok': True, 'log': log, 'ver': bump()})
            self.reply({'ok': False, 'log': 'unknown path'})
        except Exception as e:
            self.reply({'ok': False, 'log': repr(e)})

    def log_message(self, *a): pass


print('sea editor server on http://localhost:18802', flush=True)
http.server.ThreadingHTTPServer(('127.0.0.1', 18802), H).serve_forever()
