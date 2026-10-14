# Приёмник пачки картинок из Flow обычной формой (когда fetch на localhost запрещён): POST text/plain "x=name|base64;name|base64;..." -> art_src/l7
import base64, os, http.server
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'art_src', 'l7')
class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers['Content-Length'])).decode('latin-1').strip()
        if body.startswith('x='): body = body[2:]
        res = []
        for part in body.split(';'):
            if '|' not in part: continue
            name, b64 = part.split('|', 1)
            if ',' in b64[:100]: b64 = b64.split(',', 1)[1]
            data = base64.b64decode(b64.strip() + '=' * (-len(b64.strip()) % 4))
            open(os.path.join(OUT, os.path.basename(name)), 'wb').write(data); res.append('%s %d' % (name, len(data)))
        self.send_response(200); self.send_header('Content-Type', 'text/plain; charset=utf-8'); self.end_headers(); self.wfile.write('\n'.join(res).encode())
    def log_message(self, *a): pass
http.server.HTTPServer(('127.0.0.1', 18799), H).serve_forever()
