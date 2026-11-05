# Сервер редактора рига Семёна (tools/p10/rig/editor.html). Порт 18801.
# POST /save  {overrides:{J,R}, masks:{слой_erase|слой_add: dataURL png или null}} -> art_src/l10/rig2/edit/
# POST /build -> build_rig2.py + optimize_assets.py + поднять G.VER и ?v=; ответ {ok, log, ver}
# Запуск из корня игры: py tools/p10/rig/edit_server.py
import base64, json, os, re, subprocess, http.server

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
EDIT = os.path.join(ROOT, 'art_src', 'l10', 'rig2', 'edit')


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
                if 'overrides' in d: json.dump(d['overrides'], open(os.path.join(EDIT, 'overrides.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
                for name, url in (d.get('masks') or {}).items():
                    if not re.fullmatch(r'[A-Za-z0-9_]+', name): continue
                    fp = os.path.join(EDIT, name + ('' if name.endswith(('_erase', '_add')) else '_erase') + '.png')
                    if url is None:
                        if os.path.exists(fp): os.remove(fp)
                        continue
                    open(fp, 'wb').write(base64.b64decode(url.split(',', 1)[1]))
                return self.reply({'ok': True})
            if self.path.startswith('/build'):
                log = ''
                for cmd in (['py', 'tools/p10/rig/build_rig2.py'], ['py', 'tools/optimize_assets.py']):
                    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding='utf-8', errors='replace')
                    log += '$ ' + ' '.join(cmd) + '\n' + r.stdout[-1500:] + r.stderr[-3000:]
                    if r.returncode: return self.reply({'ok': False, 'log': log})
                return self.reply({'ok': True, 'log': log, 'ver': bump()})
            self.reply({'ok': False, 'log': 'unknown path'})
        except Exception as e:
            self.reply({'ok': False, 'log': repr(e)})

    def log_message(self, *a): pass


print('rig editor server on http://localhost:18801', flush=True)
http.server.ThreadingHTTPServer(('127.0.0.1', 18801), H).serve_forever()
