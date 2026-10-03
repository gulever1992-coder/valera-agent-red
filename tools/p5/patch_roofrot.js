const fs = require('fs'); let s = fs.readFileSync('js/level5render.js', 'utf8');
function rep(a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 60)); s = s.replace(a, b); }
rep("if (o.img && o.img.img) c.drawImage(o.img.img, o.img.sx, o.img.sy, o.img.sw, o.img.sh, 0, 0, w, d); else",
`if (o.img && o.img.img) {
    const I = o.img, f = o.front;
    c.save();
    if (f === 'W') { c.translate(w, 0); c.rotate(Math.PI / 2); c.drawImage(I.img, I.sx, I.sy, I.sw, I.sh, 0, 0, d, w); }
    else if (f === 'E') { c.translate(0, d); c.rotate(-Math.PI / 2); c.drawImage(I.img, I.sx, I.sy, I.sw, I.sh, 0, 0, d, w); }
    else if (f === 'N') { c.translate(w, d); c.rotate(Math.PI); c.drawImage(I.img, I.sx, I.sy, I.sw, I.sh, 0, 0, w, d); }
    else c.drawImage(I.img, I.sx, I.sy, I.sw, I.sh, 0, 0, w, d);
    c.restore();
  } else`);
rep("img: b.roofImg ? L5.tex(b.roofImg) : null }", "img: b.roofImg ? L5.tex(b.roofImg) : null, front: b.front }");
fs.writeFileSync('js/level5render.js', s);
