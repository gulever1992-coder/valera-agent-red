// Раскладка кадров ур.10 для критика: await __film(шаг_с, кадров, 'имя', {bot:1}) -> art_src/l10/_crit2/имя.jpg (нужен py tools/p10/recv_crit.py)
window.__film = async (step, n, name, o = {}) => {
  const I = G.Input, lv = App.level, cv = document.querySelector('canvas');
  const cols = o.cols || 4, W = 480, H = 270;
  const out = document.createElement('canvas'); out.width = W * cols; out.height = H * Math.ceil(n / cols);
  const x = out.getContext('2d');
  for (let k = 0; k < n; k++) {
    if (o.bot && window.__t10) await __t10.sim(step, { god: 1 });
    else for (let i = 0; i < step * 60; i++) { o.each && o.each(lv); lv.update(1 / 60); G.t += 1 / 60; if (G.flashT > 0) G.flashT -= 1 / 60; if (G.shakeT > 0) { G.shakeT -= 1 / 60; if (G.shakeT <= 0) G.shakeAmt = 0; } I.endFrame(); }
    const pz = App.paused; App.paused = false; draw(); App.paused = pz;
    x.drawImage(cv, (k % cols) * W, ((k / cols) | 0) * H, W, H);
    x.fillStyle = '#ff0'; x.font = '16px monospace'; x.fillText(lv.partName + ' ' + ((k + 1) * step).toFixed(1) + 's', (k % cols) * W + 6, ((k / cols) | 0) * H + 18);
    await new Promise(q => setTimeout(q, 0));
  }
  const du = out.toDataURL('image/jpeg', 0.85);
  const b64 = du.split(',')[1], CH = 60000;     // кусками, кратными 4 — каждый декодируется отдельно
  for (let i = 0; i < b64.length; i += CH) await fetch('http://localhost:18799/', { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: 'x=' + (i ? '+' : '') + name + '.jpg|' + b64.slice(i, i + CH) });
  return name;
};
window.__load10 = async () => { await new Promise(r => setTimeout(r, 6000)); for (const f of ['test10', 'film10']) if (f !== 'film10' || !window.__film) { const s = document.createElement('script'); s.src = '/tools/p10/' + f + '.js?' + Date.now(); document.body.appendChild(s); await new Promise(r => s.onload = r); } };
