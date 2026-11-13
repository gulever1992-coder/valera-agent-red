// «Чистый кадр» для трейлера: убирает весь интерфейс игры (текст, реплики, диалоги, подсказки, HUD, шкалы боссов)
window.__clean = function () {
  const no = function () {};
  if (!window.__cleanOnce) {
    window.__cleanOnce = true;
    G.text = no; G.drawBubble = no; G.drawBubbles = no; G.drawPortrait = no; G.bigTitle = no; G.keycap = no;
    Game.drawHUD = no; Game.drawHint = no;
    if (typeof L3 !== 'undefined') L3.drawHUD = no;
    if (typeof L4 !== 'undefined') L4.drawHUD = no;
    if (G.Scene) G.Scene.drawDialog = no;
    // прямоугольники интерфейса: шкала босса внизу, панель здоровья слева сверху
    const R0 = Art.R;
    Art.R = function (c, x, y, w, h) {
      if (y >= H - 30 && w >= 100 && h <= 20) return;
      if (y < 80 && x < 260 && w >= 20 && h <= 40) return;
      return R0.apply(this, arguments);
    };
  }
  const names = ['drawHUD', 'drawHud', 'drawHint'];
  const seen = new Set();
  const patch = (o, depth) => {
    if (!o || typeof o !== 'object' || seen.has(o) || depth > 2) return;
    seen.add(o);
    for (const k of names) if (typeof o[k] === 'function' && o[k] !== no) { try { o[k] = no; } catch (e) {} }
    const p = Object.getPrototypeOf(o);
    if (p && p !== Object.prototype) for (const k of names) if (Object.prototype.hasOwnProperty.call(p, k)) p[k] = no;
    for (const k in o) { let v; try { v = o[k]; } catch (e) { continue; } if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof HTMLElement) && !(v instanceof Image)) patch(v, depth + 1); }
  };
  try { patch(App.level, 0); } catch (e) {}
  for (const n of ['L9', 'L10']) {
    let L; try { L = eval(n); } catch (e) {}
    if (L && L.PARTS) for (const k in L.PARTS) { const P = L.PARTS[k]; try { patch(P, 0); if (P.M) P.M.drawHud = no; } catch (e) {} }
  }
};
