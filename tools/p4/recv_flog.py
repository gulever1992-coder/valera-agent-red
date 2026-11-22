# Приёмник логов боя (js/fightlog.js, ?flog): POST /<id> с JSON -> logs/<id>.json
import os, re
from http.server import BaseHTTPRequestHandler, HTTPServer
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'logs'); os.makedirs(OUT, exist_ok=True)
class H(BaseHTTPRequestHandler):
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()
    def do_POST(self):
        name = re.sub(r'[^\w\-]', '_', self.path.strip('/'))[:80] or 'flog'
        data = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        open(os.path.join(OUT, name + '.json'), 'wb').write(data)
        self.send_response(200); self.cors(); self.end_headers(); self.wfile.write(b'ok')
    def log_message(self, *a): pass
print('flog receiver :8794 ->', OUT, flush=True)
HTTPServer(('127.0.0.1', 8794), H).serve_forever()
