// Снимки уровня 9 из превью: (0,eval)(await (await fetch('http://127.0.0.1:8790/snap9.js')).text()); await __snap('имя', x, y, тиков, оружие, pre)
// Кадр -> art_src/l9/_имя.jpg через приёмник 8790. Враги убираются, Валера держится в точке (камера успевает доехать).
window.__snap = async (name, x, y, n = 150, w, pre, keepFoes) => {
  const cv = document.querySelector('canvas'), lv = App.level, P = lv.P;
  if (!keepFoes) { P.foes = []; P.ebul = []; }
  if (pre) pre(P);
  for (let i = 0; i < n; i++) { P.x = x; if (i < 2) P.y = y; P.inv = 0; P.hp = 100; if (w) P.weap = w; lv.update(1 / 60); if (window.Scene && Scene.active && Scene.closeDialog) Scene.closeDialog(); }
  const c = G.ctx || cv.getContext('2d'); c.save(); c.setTransform(cv.width / 640, 0, 0, cv.height / 360, 0, 0); lv.draw(c); c.restore();
  const d = cv.toDataURL('image/jpeg', 0.88);
  return (await fetch('http://127.0.0.1:8790', { method: 'POST', body: '_' + name + '.jpg|' + d })).text();
};
