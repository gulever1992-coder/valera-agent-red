const fs = require('fs'); let s = fs.readFileSync('js/level5world.js', 'utf8');
const a = s.indexOf('L5.R.drawFx = function (c) {'), b = s.indexOf('L5.R.PXY = ');
if (a < 0 || b < 0) throw new Error('нет блока');
const blk = `L5.R.drawFx = function (c) {
  if (!L5.has('l5fx')) return;
  for (const e of L5.fxs) {
    const k = e.t / e.dur;
    let fr = 0;
    if (e.k === 'boom') fr = Math.min(7, Math.floor(k * 8));
    else if (e.k === 'fire') fr = 8 + Math.floor(e.t * 10) % 4;
    else if (e.k === 'smoke') fr = 12 + Math.min(3, Math.floor(k * 4));
    else if (e.k === 'muzzle') fr = 16 + Math.floor(e.t * 30) % 2;
    else if (e.k === 'glass') fr = 21;
    else if (e.k === 'splash') fr = 24 + Math.min(3, Math.floor(k * 4));
    else if (e.k === 'dust') fr = 28 + Math.min(1, Math.floor(k * 2));
    else if (e.k === 'splinter') fr = 30 + Math.min(1, Math.floor(k * 2));
    c.save(); c.globalAlpha = e.k === 'smoke' ? 0.85 * (1 - k * 0.6) : e.k === 'glass' || e.k === 'dust' ? 1 - k : 1;
    Spr.drawC(c, 'l5fx', fr, e.x, e.y - (e.k === 'smoke' ? e.t * 30 : 0), e.rot, e.sc);
    c.restore();
    if (e.k === 'boom' && L5.has('l5lights')) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8 * (1 - k); Spr.drawC(c, 'l5lights', 5, e.x, e.y, 0, 2.4 * e.sc); c.restore(); }
  }
};

// ---------- мелкие предметы: только спрайты (l5props) ----------
L5.R.prop = function (c, C, o, t) {
  if (!L5.has('l5props')) return;
  const PS = L5.PR;
  switch (o.kind) {
    case 'dumpster': Spr.drawC(c, 'l5props', PS.dumpster, o.x, o.y - 4, o.rot || 0, 1); break;
    case 'crate': Spr.drawC(c, 'l5props', PS.crates, o.x, o.y - 4, 0, 1); break;
    case 'bench': Spr.drawC(c, 'l5props', PS.bench, o.x, o.y - 3, 0, 1); break;
    case 'barrel': Spr.drawC(c, 'l5props', PS.barrels, o.x, o.y - 4, 0, 0.55); break;
    case 'cone': Spr.drawC(c, 'l5props', PS.cones, o.x, o.y - 4, o.rot || 0, 0.7); break;
    case 'barricade': Spr.drawC(c, 'l5props', PS.barricade, o.x, o.y - 5, 0, 1); break;
    case 'ramp': Spr.drawC(c, 'l5props', PS.ramp, o.x, o.y, o.rot || 0, 1); break;
    case 'fence': Spr.drawC(c, 'l5props', PS.fence, o.x, o.y - 4, o.rot || 0, 0.8); break;
    case 'puddle': c.save(); c.globalAlpha = 0.85; Spr.drawC(c, 'l5props', PS.puddle, o.x, o.y, o.ph || 0, 0.8); c.restore(); break;
    case 'billboard': { const kp = 1 + 40 / L5.PERSP, q = L5.R.PXY(o.x, o.y, C, kp); Spr.drawC(c, 'l5props', PS.billboard, q[0], q[1] - 8, 0, kp); break; }
  }
};
`;
s = s.slice(0, a) + blk + s.slice(b);
fs.writeFileSync('js/level5world.js', s);
console.log('ok');
