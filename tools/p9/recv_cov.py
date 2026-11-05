# Приёмник снимков холста для обложек: POST "name|dataURL" -> art_src/covers/shots/name
import base64, os, http.server
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'art_src', 'covers', 'shots'); os.makedirs(OUT, exist_ok=True)
class H(http.server.BaseHTTPRequestHandler):
    def _c(self):
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', '*'); self.send_header('Access-Control-Allow-Private-Network', 'true')
    def do_OPTIONS(self): self.send_response(204); self._c(); self.end_headers()
    def do_POST(self):
        name, b64 = self.rfile.read(int(self.headers['Content-Length'])).decode().split('|', 1)
        open(os.path.join(OUT, os.path.basename(name)), 'wb').write(base64.b64decode(b64.split(',', 1)[1]))
        self.send_response(200); self._c(); self.end_headers(); self.wfile.write(b'ok')
    def log_message(self, *a): pass
http.server.HTTPServer(('127.0.0.1', 8791), H).serve_forever()
