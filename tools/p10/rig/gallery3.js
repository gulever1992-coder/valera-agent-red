// Галерея поз рига анфас (фаза 3): await __rig3Gal('имя') -> art_src/l10/имя.jpg (через recv_art.py на 18799)
window.__rig3Gal = async (name = 'rig3_gal', poses = ['idle', 'roar', 'plasma', 'laser', 'gun', 'clapUp', 'clapOut', 'clap', 'hoseUp', 'hoseHit', 'connect', 'hurt']) => {
  if (!L10.img.rig30) L10.img.rig30 = await G.loadImage('assets/l10/rig30.png');
  const W = 400, H = 330, cols = 4, out = document.createElement('canvas'); out.width = W * cols; out.height = H * Math.ceil(poses.length / cols);
  const c = out.getContext('2d'); c.fillStyle = '#26343c'; c.fillRect(0, 0, out.width, out.height);
  const pre = { clap: 'clapOut', hoseHit: 'hoseUp' };
  for (let i = 0; i < poses.length; i++) {
    const p = poses[i], B = new L10.RigFront({ x: 200, y: 250, H: 225 }), ox = (i % cols) * W, oy = ((i / cols) | 0) * H;
    B.watch = { x: 300, y: 300 }; B.gunT = { x: 90, y: 300 }; B.aimL = [200, 252]; B.aimR = [204, 252]; B.hoseT = { x: 320, y: 255 };
    if (pre[p]) { B.setPose(pre[p]); for (let t = 0; t < 1.2; t += 1 / 60) B.update(1 / 60); }
    B.setPose(p); for (let t = 0; t < (pre[p] ? 0.3 : 1.3); t += 1 / 60) B.update(1 / 60);
    if (p === 'gun') B.fireGun(); if (p === 'connect') B.shield = 1;
    c.save(); c.translate(ox, oy); c.beginPath(); c.rect(0, 0, W, H); c.clip(); B.draw(c);
    c.fillStyle = 'rgba(20,70,110,0.78)'; c.fillRect(0, 250, W, H - 250); c.fillStyle = '#7fc8ff'; c.fillRect(0, 249, W, 2);     // море по пузо
    for (const k of ['e', 'e2', 'm', 'mg', 'hL', 'hR', 'hose', 'legL', 'legR']) { const q = B.P(k); c.fillStyle = '#0ff'; c.fillRect(q[0] - 2, q[1] - 2, 4, 4); }
    c.fillStyle = '#ff0'; c.font = '16px monospace'; c.fillText(p, 8, 20); c.restore();
  }
  const b64 = out.toDataURL('image/jpeg', 0.88).split(',')[1];
  for (let i = 0; i < b64.length; i += 60000) await fetch('http://localhost:18799/', { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: (i ? '+' : '') + name + '.jpg|' + b64.slice(i, i + 60000) });
  return [out.width, out.height];
};
