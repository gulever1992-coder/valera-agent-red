const fs = require('fs'); let s = fs.readFileSync('js/level5render.js', 'utf8');
function rep(a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); s = s.replace(a, b); }
// слайс: ось X — среднее между нижним и верхним ребром (стена — трапеция, а не параллелограмм)
rep("L5.R.slice = function (c, img, sx, sy, sw, sh, p0x, p0y, p1x, p1y, p2x, p2y) {\n  c.save();\n  c.transform((p1x - p0x) / sw, (p1y - p0y) / sw, -(p2x - p0x) / sh, -(p2y - p0y) / sh, p2x, p2y);\n  c.drawImage(img, sx, sy, sw, sh, 0, 0, sw + 0.5, sh);",
"L5.R.slice = function (c, img, sx, sy, sw, sh, p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {\n  c.save();\n  const ax = p3x == null ? p1x - p0x : ((p1x - p0x) + (p3x - p2x)) / 2, ay = p3y == null ? p1y - p0y : ((p1y - p0y) + (p3y - p2y)) / 2;\n  c.transform(ax / sw, ay / sw, -(p2x - p0x) / sh, -(p2y - p0y) / sh, p2x, p2y);\n  c.drawImage(img, sx, sy, sw, sh, -0.4, 0, sw + 1.1, sh);");
rep("const step = Math.max(32, Math.min(80, len / 3));", "const step = Math.max(5, Math.min(11, len / 22));");
rep("b0x + (b1x - b0x) * f0, b0y + (b1y - b0y) * f0, b0x + (b1x - b0x) * f1, b0y + (b1y - b0y) * f1, t0x + (t1x - t0x) * f0, t0y + (t1y - t0y) * f0);",
    "b0x + (b1x - b0x) * f0, b0y + (b1y - b0y) * f0, b0x + (b1x - b0x) * f1, b0y + (b1y - b0y) * f1, t0x + (t1x - t0x) * f0, t0y + (t1y - t0y) * f0, t0x + (t1x - t0x) * f1, t0y + (t1y - t0y) * f1);");
fs.writeFileSync('js/level5render.js', s);
console.log('ok');
