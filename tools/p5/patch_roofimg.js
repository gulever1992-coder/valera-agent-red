const fs = require('fs');
function edit(f, fn) { let s = fs.readFileSync(f, 'utf8'); s = fn(s); fs.writeFileSync(f, s); }
function rep(s, a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 60)); return s.replace(a, b); }
edit('js/level5render.js', s => {
  s = rep(s, "  c.fillStyle = L5.getPat(c, tile); c.fillRect(0, 0, w, d);\n  if (o.tint)", "  if (o.img && o.img.img) c.drawImage(o.img.img, o.img.sx, o.img.sy, o.img.sw, o.img.sh, 0, 0, w, d); else { c.fillStyle = L5.getPat(c, tile); c.fillRect(0, 0, w, d); }\n  if (o.tint && !(o.img && o.img.img))");
  s = rep(s, "{ tint: b.glass ? '#4a7090' : b.tint, tintA: b.glass ? 0.45 : 0.2 });", "{ tint: b.glass ? '#4a7090' : b.tint, tintA: b.glass ? 0.45 : 0.2, img: b.roofImg ? L5.tex(b.roofImg) : null });");
  return s;
});
edit('js/level5.js', s => {
  s = rep(s, "  else if (id[0] === 't' && L5.tc", "  else if (id[0] === 'r' && L5.img.l5_roofs) t = { img: L5.img.l5_roofs, sx: (k % 2) * 640, sy: Math.floor(k / 2) * 240, sw: 640, sh: 240 };\n  else if (id[0] === 't' && L5.tc");
  s = rep(s, "land: lm.name, elev:", "land: lm.name, roofImg: p.r, elev:");
  s = rep(s, "e: o.e, tex: o.tex || 't19', tint: o.tint }", "e: o.e, r: o.r, tex: o.tex || 't19', tint: o.tint }");
  const R = { 'РЫНОК': 'r6', 'РАДУГА': 'r7', 'ДВОРЕЦ': 'r3', 'ТЦ «ГРАНД»': 'r8', 'КИНО «РОДИНА»': 'r10', 'МУЗЕЙ': 'r2', 'ДОМ-ДУГА': 'r11', 'СТЕЛА': 'r17', 'БОЛЬНИЦА': 'r9', 'ТЕАТР': 'r12', 'КИНО «РОССИЯ»': 'r1', 'МАКСИ': 'r4', 'ПАНЕЛЬНАЯ': 'r13', 'ЦУМ': 'r0', 'ПОРТ': 'r14', 'ВЕРФЬ': 'r15', 'СБОРОЧНЫЙ': 'r16', 'ДК «СТРОИТЕЛЬ»': 'r3', 'ЗАВОДОУПРАВЛЕНИЕ': 'r5' };
  for (const k in R) s = s.replace("name: '" + k, "r: '" + R[k] + "', name: '" + k);
  return s;
});
