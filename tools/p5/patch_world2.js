const fs = require('fs'); let s = fs.readFileSync('js/level5world.js', 'utf8');
function between(startMark, endMark, repl, includeEnd = false) {
  const a = s.indexOf(startMark); if (a < 0) throw new Error('нет начала: ' + startMark.slice(0, 50));
  const b = s.indexOf(endMark, a + startMark.length); if (b < 0) throw new Error('нет конца: ' + endMark.slice(0, 50));
  s = s.slice(0, a) + repl + s.slice(includeEnd ? b + endMark.length : b);
}
// 1. бордюр-полоса кодом — убрать
between("  c.fillStyle = '#26262a'; for (const r of vis)", "  c.fillStyle = L5.getPat(c, 0); for (const r of vis)", '');
// 2. разметка — спрайты l5dec
between("  const inOther = ", "  if (L5.R.rails) L5.R.rails(", `  const inOther = (x, y, self) => wd.roads.some(q => q !== self && x > q.x0 + 1 && x < q.x1 - 1 && y > q.y0 + 1 && y < q.y1 - 1);
  const D = (i, x, y, rot, sc) => Spr.drawC(c, 'l5dec', i, x, y, rot, sc == null ? 1 : sc);
  if (L5.has('l5dec')) {
    for (const r of vis) {
      const len = Math.hypot(r.bx - r.ax, r.by - r.ay), dx = (r.bx - r.ax) / len, dy = (r.by - r.ay) / len;
      for (let tt = r.main ? 0 : r.hw + 10; tt < len; tt += 60) {
        const mx = r.ax + dx * (tt + 15), my = r.ay + dy * (tt + 15);
        if (mx < x0 - 40 || mx > x1 + 40 || my < y0 - 40 || my > y1 + 40 || inOther(mx, my, r)) continue;
        c.save(); c.globalAlpha = 0.9; D(0, mx, my, r.hor ? 0 : Math.PI / 2); c.restore();
      }
      if (r.side && r.parent) {
        const g = r.parent;
        for (const sd of [-1, 1]) {
          const ox = r.ax + g.dx * sd * (r.hw + 14), oy = r.ay + g.dy * sd * (r.hw + 14);
          if (ox < x0 - 80 || ox > x1 + 80 || oy < y0 - 80 || oy > y1 + 80) continue;
          D(2, ox, oy, Math.abs(g.dx) > 0.5 ? Math.PI / 2 : 0, 0.9);
        }
      }
    }
    for (const s2 of [L5.S_RACE, L5.S_END]) {
      if (s2 === L5.S_RACE && !lv.raceStarted) continue;
      const a = L5.at(s2); if (a.x < x0 - 200 || a.x > x1 + 200 || a.y < y0 - 200 || a.y > y1 + 200) continue;
      D(s2 === L5.S_END ? 6 : 7, a.x, a.y, Math.abs(a.dx) > 0.5 ? Math.PI / 2 : 0, 1);
    }
  }
`);
// 3. тени — спрайты l5shad
between("  // --- тени\n", "  PM('shadows');", `  // --- тени (мягкие спрайты l5shad: 0 круг, 1 машина, 2 крона, 3 столб)
  const SH = (i, x, y, w, h, a, rot) => { const f = Spr.frame('l5shad', i); if (!f) return; const sh = Spr.sheets.l5shad; c.save(); c.globalAlpha = a; c.translate(x, y); if (rot) c.rotate(rot); c.drawImage(sh.img, f[0], f[1], f[2], f[3], -w / 2, -h / 2, w, h); c.restore(); };
  L5.R.SH = SH;
  for (const b of boxes) { const hz = Math.min(120, b.H) * 0.28; SH(1, b.x + b.w / 2 + hz * 0.7, b.y + b.d / 2 + hz * 0.7, b.w + hz * 1.6, b.d + hz * 1.6, 0.75); }
  const list = [], tall = [], pad = 140;
  wd.objs.query(x0 - pad, y0 - pad, x1 + pad, y1 + pad + 100, o => { if (!o.hidden && !o.gone) { if (o.kind === 'tree' || o.kind === 'lamp') tall.push(o); else list.push(o); } });
  for (const o of tall) { if (o.kind === 'tree') SH(2, o.x + 8, o.y + 6, 70 * o.sz, 52 * o.sz, 0.7); else SH(3, o.x + 16, o.y - 4, 56, 40, 0.6); }
  if (L5.has('l5dec')) {
    for (const d of lv.decals) { c.save(); c.globalAlpha = Math.max(0, 1 - d.t / 25); D(9, d.x, d.y, d.x * 0.01, Math.max(0.6, d.r / 26)); c.restore(); }
    for (const s2 of lv.skids) if (s2.x > x0 - 20 && s2.x < x1 + 20 && s2.y > y0 - 20 && s2.y < y1 + 20) { c.save(); c.globalAlpha = 0.7; D(8, s2.x, s2.y, s2.a, 0.35); c.restore(); }
  }
`);
// 4. обломки и огонь без кодовых заглушек
between("      case 'wreck': {", "      case 'folk':", `      case 'wreck': { const w = o.w; c.save(); c.translate(w.x, w.y); c.rotate(w.ang); c.scale(w.sx || 1, w.sy || 1); if (L5.has(w.sh)) Spr.drawC(c, w.sh, w.fr, 0, 0, 0, 1); c.restore();
        if (w.fire > 0 && L5.has('l5fx')) { const k = Math.min(1, w.fire / 3); c.save(); c.globalAlpha = k; Spr.drawC(c, 'l5fx', 8 + Math.floor(w.t * 10) % 4, w.x - 6, w.y - 12, 0, 1); Spr.drawC(c, 'l5fx', 8 + Math.floor(w.t * 10 + 2) % 4, w.x + 12, w.y - 8, 0, 0.8); c.restore(); } break; }
`);
// 5. бонусы — спрайты
between("      case 'pick': {", "      default: if (o.kind === 'parked')", `      case 'pick': { const p = o.p, b = Math.sin(p.t + t * 4) * 2;
        if (p.kind === 'ammo') Spr.drawC(c, Spr.sheets.seedcan ? 'seedcan' : 'l5dec', Spr.sheets.seedcan ? 0 : 18, p.x, p.y - 4 + b, 0, 1.1);
        else if (L5.has('l5dec')) Spr.drawC(c, 'l5dec', p.kind === 'nitro' ? 16 : 17, p.x, p.y - 4 + b, 0, 1);
        break; }
`);
// 6. газ, пули
between("  // облако газа, пули", "  L5.R.drawFx(c); FX.draw(c);", `  // облако газа, пули
  for (const cl of lv.clouds) {
    const a = Math.min(1, (cl.life - cl.t) / 1.5);
    const sh = L5.has('l5gas') ? 'l5gas' : (L5.has('l5fx') ? 'l5fx' : null); if (!sh) break;
    c.save(); c.globalAlpha = 0.55 * a;
    for (let i = 0; i < 5; i++) { const an = cl.t * 0.5 + i * 1.257, rr2 = cl.r * 0.45; Spr.drawC(c, sh, sh === 'l5gas' ? (i % 4) : 13 + (i % 3), cl.x + Math.cos(an) * rr2, cl.y + Math.sin(an) * rr2 * 0.9, an, cl.r / 55); }
    c.restore();
  }
  if (L5.has('l5dec')) {
    for (const b of lv.bullets) Spr.drawC(c, 'l5dec', 21, b.x, b.y, Math.atan2(b.vy, b.vx), 0.9);
    for (const b of lv.ebullets) Spr.drawC(c, 'l5dec', 22, b.x, b.y, Math.atan2(b.vy, b.vx), 0.8);
  }
`);
// 7. вечерний свет — спрайты l5lights (аддитивно)
between("  // --- свет вечера\n", "  PM('lights');", `  // --- свет: спрайты l5lights (0 фары, 1 фонарь, 2 красная сирена, 3 синяя, 4 стоп-сигнал)
  if (L5.has('l5lights')) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const LG = (i, x, y, rot, sc, a) => { c.globalAlpha = a; Spr.drawC(c, 'l5lights', i, x, y, rot, sc); };
    for (const o of tall) if (o.kind === 'lamp') { const fl = 0.8 + 0.2 * Math.sin(t * 9 + o.ph) * (Math.sin(t * 0.7 + o.ph) > 0.97 ? 1.6 : 0.3), q = L5.R.PXY(o.x, o.y, C, 1 + 58 / L5.PERSP); LG(1, q[0], q[1], 0, 1, 0.8 * fl); }
    for (const car of lv.cars) {
      if (car.x < x0 - 200 || car.x > x1 + 200 || car.y < y0 - 200 || car.y > y1 + 200 || car.parked) continue;
      const ca = Math.cos(car.ang), sa = Math.sin(car.ang);
      if (car.speed > 15 || car.kind === 'player' || car.isMatiz) { const f = Spr.frame('l5lights', 0), hw = f ? f[2] / 4 : 100; LG(0, car.x + ca * (car.L / 2 + hw - 6), car.y + sa * (car.L / 2 + hw - 6), car.ang, 0.9, 0.7); }
      const br = car.brk > 0.2 || (car.thr === 0 && car.speed > 40);
      for (const sd of [-1, 1]) LG(4, car.x - ca * car.L / 2 - sa * sd * car.Wd * 0.34, car.y - sa * car.L / 2 + ca * sd * car.Wd * 0.34, 0, br ? 0.5 : 0.22, br ? 0.9 : 0.5);
      if (car.d.siren || car.cop) { const ph = Math.floor((G.t + car.t) * 6) % 2; LG(ph ? 2 : 3, car.x + ca * car.L * 0.05, car.y + sa * car.L * 0.05, 0, 0.55, 0.9); LG(ph ? 3 : 2, car.x - ca * car.L * 0.1, car.y - sa * car.L * 0.1, 0, 0.4, 0.55); }
    }
    c.restore();
  }
  c.restore();
`);
// 8. листья — спрайт
s = s.replace(/c\.save\(\); c\.translate\(l\.x, l\.y\); c\.rotate\(l\.r\); c\.fillStyle = l\.col; c\.fillRect\(-2, -1, 4, 2\); c\.restore\(\); \}/, "if (L5.has('l5props')) Spr.drawC(c, 'l5props', 23, l.x, l.y, l.r, 0.1 + l.s * 0.004); }");
fs.writeFileSync('js/level5world.js', s);
console.log('ok');
