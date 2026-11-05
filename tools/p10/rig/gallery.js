// Галерея поз рига: await __rigGal('имя') -> art_src/l10/имя.jpg (через recv_art.py на 18799)
window.__rigGal = async (name, poses = ['walk', 'roar', 'raise', 'slam', 'eyes', 'plasma', 'lunge', 'hurt', 'gun', 'grab']) => {
  const W = 400, H = 360, cols = 5, out = document.createElement('canvas'); out.width = W * cols; out.height = H * Math.ceil(poses.length / cols);
  const c = out.getContext('2d'); c.fillStyle = '#26343c'; c.fillRect(0, 0, out.width, out.height);
  for (let i = 0; i < poses.length; i++) {
    const p = poses[i], B = new L10.RigBoss(1, { H: 300, x: 230, y: 330, flip: true });
    const ox = (i % cols) * W, oy = ((i / cols) | 0) * H;
    B.aim = [60, 260]; if (p === 'lunge') B.hoseT = { x: 40, y: 250 };
    B.setPose(p === 'walk' ? 'idle' : p); B.walk = p === 'walk' ? 1.8 : 0;
    for (let t = 0; t < (p === 'slam' ? 0.25 : 1.2); t += 1 / 60) B.update(1 / 60);
    c.save(); c.translate(ox, oy); c.beginPath(); c.rect(0, 0, W, H); c.clip(); B.draw(c);
    c.fillStyle = '#f33'; c.fillRect(B.aim[0] - 3, B.aim[1] - 3, 6, 6); for (const k of ['e', 'm', 'h', 'g']) { const q = B.P(k); c.fillStyle = '#0ff'; c.fillRect(q[0] - 2, q[1] - 2, 4, 4); }
    c.fillStyle = '#ff0'; c.font = '16px monospace'; c.fillText(p, 8, 20); c.restore();
  }
  const b64 = out.toDataURL('image/jpeg', 0.88).split(',')[1];
  for (let i = 0; i < b64.length; i += 60000) await fetch('http://localhost:18799/', { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: 'x=' + (i ? '+' : '') + name + '.jpg|' + b64.slice(i, i + 60000) });
  return name;
};
// Крупная галерея: await __rigZoom('имя', [['idle',1],['roar',1.2]...], [x,y,w,h] кроп логики 640x360) -> art_src/l10/имя.jpg
window.__rigZoom = async (name, list, cr = [100, 60, 280, 280], only) => {
  const S0 = L10.Skin.prototype.layer, cols = 4, out = document.createElement('canvas'); out.width = 400 * Math.min(cols, list.length); out.height = 400 * Math.ceil(list.length / cols);
  const c = out.getContext('2d'); c.fillStyle = '#26343c'; c.fillRect(0, 0, out.width, out.height);
  if (only) L10.Skin.prototype.layer = function (k, t, a) { if (!only.includes(k)) return; return S0.call(this, k, t, a); };
  list.forEach(([p, T], i) => {
    const B = new L10.RigBoss(1, { H: 330, x: 330, y: 350, flip: true }); B.aim = [60, 230]; B.setPose(p); B.walk = p === 'idle' ? 1.8 : 0;
    for (let t = 0; t < T; t += 1 / 60) B.update(1 / 60);
    const tmp = document.createElement('canvas'); tmp.width = 640; tmp.height = 360; B.draw(tmp.getContext('2d'));
    c.drawImage(tmp, cr[0], cr[1], cr[2], cr[3], (i % cols) * 400, ((i / cols) | 0) * 400, 400, 400); c.fillStyle = '#ff0'; c.font = '16px monospace'; c.fillText(p + ' ' + T, (i % cols) * 400 + 6, ((i / cols) | 0) * 400 + 18);
  });
  L10.Skin.prototype.layer = S0;
  const b64 = out.toDataURL('image/jpeg', 0.88).split(',')[1];
  for (let i = 0; i < b64.length; i += 60000) await fetch('http://localhost:18799/', { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: 'x=' + (i ? '+' : '') + name + '.jpg|' + b64.slice(i, i + 60000) });
  return name;
};
