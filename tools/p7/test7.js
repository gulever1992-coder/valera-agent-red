// Тест-хелперы ур.7 для превью (вставить в консоль страницы игры): шаг игрового цикла без rAF, снимки холста в приёмник recv7.py
window.__shot = async n => { const cv = document.querySelector('canvas'); const r = await fetch('http://127.0.0.1:8783/', { method: 'POST', body: n + '|' + cv.toDataURL('image/jpeg', 0.85) }); return r.text(); };
window.__step = (sec, onFrame) => {
  const n = Math.round(sec * 60);
  for (let i = 0; i < n; i++) {
    const dt = 1 / 60; G.t += dt; let gdt = dt;
    if (G.hitStop > 0) { G.hitStop -= dt; gdt = dt * 0.1; }
    if (G.shakeT > 0) { G.shakeT -= dt; if (G.shakeT <= 0) G.shakeAmt = 0; }
    if (G.flashT > 0) G.flashT -= dt;
    G.dt = gdt;
    try { update(gdt); } catch (e) { return 'ERR ' + e.message + ' ' + e.stack.split('\n')[1]; }
    if (onFrame) { const r = onFrame(i); if (r === 'stop') break; }
    G.Input.endFrame();
  }
  try { draw(); } catch (e) { return 'DRAWERR ' + e.message + ' ' + e.stack.split('\n')[1]; }
  return 'ok';
};
window.__autoDlg = () => { if (Scene.dialog && Scene.dialog.shown >= Scene.dialog.text.length && Scene.dialog.t > Scene.dialog.text.length / 38 + 0.4) Scene.closeDialog(); };
window.__film = async (prefix, n, every) => { const out = []; for (let i = 0; i < n; i++) { const r = window.__step(every, window.__autoDlg); if (r !== 'ok') out.push(i + ':' + r); await window.__shot(prefix + i + '.jpg'); } return out.join('|') + ' mode=' + (App.level && App.level.mode) + ' state=' + App.state; };
