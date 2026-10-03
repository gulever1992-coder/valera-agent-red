const fs = require('fs');
function edit(f, fn) { let s = fs.readFileSync(f, 'utf8'); s = fn(s); fs.writeFileSync(f, s); }
function lines(s, a, b, fn) { const L = s.split('\n'); for (let i = a - 1; i <= b - 1; i++) L[i] = fn ? fn(L[i], i) : ''; return L.join('\n'); }

edit('js/level5ent.js', s => {
  // тень машины — спрайт; вспышка урона и тонировка кодом — убрать
  const L = s.split('\n');
  const i0 = L.findIndex(l => l.includes("c.save(); c.translate(this.x + 3, this.y + 5); c.rotate(this.ang); c.fillStyle = 'rgba(0,0,0,'"));
  if (i0 < 0) throw new Error('нет тени');
  // блок тени: строка i0 и i0+1 (c.moveTo ... c.fill(); c.restore();)
  L[i0] = "    if (L5.R.SH) L5.R.SH(1, this.x + 3, this.y + 5, this.L * 1.18, this.Wd * 1.3, Math.max(0.2, 0.62 - zA * 0.012), this.ang);";
  L[i0 + 1] = '';
  s = L.join('\n');
  s = s.replace(/    if \(tint\) \{ c\.fillStyle = tint;[^\n]*\n/, '');
  s = s.replace(/    if \(this\.flash > 0\) \{ c\.save\(\); c\.translate\(this\.x, this\.y - zA\);[^\n]*\n/, '');
  s = s.replace("c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(p.x + 2, p.y + 1, 8 * sc * 2, 3.2, 0, 0, 7); c.fill();", "if (L5.R.SH) L5.R.SH(0, p.x + 2, p.y + 2, 18 * sc * 2, 9, 0.55);");
  return s;
});

edit('js/level5scenes.js', s => {
  s = s.replace(/ if \(pol\.siren\) \{ c\.fillStyle = Math\.floor\(t \* 6\) % 2 \? [^\n]*?c\.fillRect\(0, 0, W, H\); \}/, '');
  s = s.replace(/for \(const b of bullets\) \{ c\.save\(\); c\.globalCompositeOperation = 'lighter';[^\n]*\n/, "for (const b of bullets) Spr.drawC(c, 'l5dec', 21, b.x, b.y, 0, 0.9);\n");
  // запасной фон заводоуправления кодом — убрать
  const a = s.indexOf("    else { // запасной вариант: дом культуры"), b = s.indexOf("    // дорогие машины по краям");
  if (a > 0 && b > a) s = s.slice(0, a) + s.slice(b);
  s = s.replace(/    if \(!bg\) rich\.forEach\([^\n]*\n/, '');
  return s;
});

edit('js/level5extra.js', s => {
  s = s.replace("c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,40,30,0.55)'; c.beginPath(); c.arc(bx, by, 22, 0, 7); c.fill(); c.restore();", "if (L5.has('l5lights')) { c.save(); c.globalCompositeOperation = 'lighter'; Spr.drawC(c, 'l5lights', 2, bx, by, 0, 0.5); c.restore(); }");
  s = s.replace("c.save(); c.globalAlpha = 0.28; c.fillStyle = '#000'; c.beginPath(); c.ellipse(h.x + 24, h.y + 20, 70, 26, h.ang, 0, 7); c.fill(); c.restore();", "if (L5.R.SH) L5.R.SH(1, h.x + 26, h.y + 22, 150, 80, 0.5, h.ang);");
  return s;
});
console.log('ok');
