# Приёмник кадров для записи трейлера: POST /f?c=clip&i=N (jpeg)
import http.server, os, urllib.parse
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frames')
class H(http.server.BaseHTTPRequestHandler):
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()
    def do_POST(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        c = ''.join(ch for ch in q['c'][0] if ch.isalnum() or ch in '_-'); i = int(q['i'][0])
        d = self.rfile.read(int(self.headers['Content-Length']))
        os.makedirs(os.path.join(OUT, c), exist_ok=True)
        if self.path.startswith('/j'):  # дорожка положения героя
            open(os.path.join(OUT, c, 'track.json'), 'wb').write(d)
        elif self.path.startswith('/b'):  # пачка dataURL через перевод строки
            import base64
            for k, line in enumerate(d.split(b'\n')):
                open(os.path.join(OUT, c, '%05d.jpg' % (i + k)), 'wb').write(base64.b64decode(line.split(b',', 1)[1]))
        else:
            open(os.path.join(OUT, c, '%05d.jpg' % i), 'wb').write(d)
        self.send_response(200); self.cors(); self.end_headers(); self.wfile.write(b'ok')
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', 18910), H).serve_forever()
