# Приёмник картинок из Flow: POST тело "name|base64" -> art_src/l7/name (срез до FFD8/PNG)
import base64, os, http.server
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'art_src', 'l7')
class H(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()
    def do_POST(self):
        body = self.rfile.read(int(self.headers['Content-Length'])).decode()
        name, b64 = body.split('|', 1)
        if ',' in b64[:100]: b64 = b64.split(',', 1)[1]
        data = base64.b64decode(b64)
        for sig in (b'\xff\xd8', b'\x89PNG'):
            i = data.find(sig)
            if 0 <= i < 64: data = data[i:]; break
        p = os.path.join(OUT, os.path.basename(name))
        open(p, 'wb').write(data)
        self.send_response(200); self._cors(); self.end_headers()
        self.wfile.write(f'{p} {len(data)}'.encode())
    def log_message(self, *a): pass
http.server.HTTPServer(('127.0.0.1', 8783), H).serve_forever()
