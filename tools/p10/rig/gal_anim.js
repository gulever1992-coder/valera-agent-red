// Раскадровка анимаций Семёна анфас (фаза 3) отдельным экземпляром рига. Вставлять в страницу игры (?l10=sea):
//   await __galA('имя')  -> art_src/l10/legs4/<имя>.jpg через приёмник py tools/p10/recv_legs4.py (порт 18799)
// Кадры: покой, рёв, хлопок (замах / летят / сошлись), удар кулаками (замах / удар), шланг метёт.
window.__galA = async (name = 'anim_gal', o = {}) => {
  const R = new L10.RigFront({ x: 320, y: 270, H: 236 }); R.gunK = 0.62; const WY = 330, tx = o.tx || 205;
  const out = document.createElement('canvas'); out.width = 320 * 4; out.height = 180 * 2; const g = out.getContext('2d');
  const cv = document.createElement('canvas'); cv.width = 640; cv.height = 360; const c = cv.getContext('2d');
  const run = (pose, sec, f) => { R.setPose(pose); for (let t = 0; t < sec; t += 1 / 60) { f && f(t); R.update(1 / 60); } };
  let n = 0;
  const shot = label => {
    c.fillStyle = '#1d3a40'; c.fillRect(0, 0, 640, 360); c.fillStyle = '#2a5560'; c.fillRect(0, 270, 640, 90);
    c.fillStyle = '#a87'; c.fillRect(150, WY - 6, 90, 8); c.fillRect(380, WY - 6, 90, 8);
    const front = R.armsFront(); R.draw(c, { arms: front ? 'skip' : null });
    c.fillStyle = '#ec4'; c.fillRect(tx - 5, WY - 30, 10, 30);     // «Валера»
    if (front) R.draw(c, { arms: 'only' }); if (R.hoseW > 0.3) R.drawHoseOnly(c);
    c.fillStyle = '#fff'; c.font = '22px sans-serif'; c.fillText(label, 10, 28);
    g.drawImage(cv, (n % 4) * 320, Math.floor(n / 4) * 180, 320, 180); n++;
  };
  R.legs.forEach(l => l.grow = 1);
  run('idle', 1); shot('покой');
  run('roar', 0.8); shot('рёв');
  run('clapUp', 1); shot('хлопок: замах');
  const cy = o.clapY || 215; R.aimL = [312, cy]; R.aimR = [328, cy]; run('clap', 0.1); shot('хлопок: летят');
  run('clap', 0.3); shot('хлопок: сошлись');
  run('smashUp', 1); shot('удар: замах');
  R.aimL = [tx - 9, WY - 62]; R.aimR = [tx + 9, WY - 62]; run('smash', 0.3); shot('удар кулаками');
  run('idle', 0.5); R.hoseT = { x: 120, y: WY + 8 }; run('hoseSweep', 0.5, t => R.hoseT.x = 120 + t * 500); shot('шланг метёт');
  const d = out.toDataURL('image/jpeg', 0.85).split(',')[1];
  return (await fetch('http://localhost:18799/', { method: 'POST', body: 'x=' + name + '.jpg|' + d })).text();
};
