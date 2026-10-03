const fs = require('fs');
function edit(f, fn) { let s = fs.readFileSync(f, 'utf8'); s = fn(s); fs.writeFileSync(f, s); }
function rep(s, a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); return s.replace(a, b); }
edit('js/level5.js', s => {
  // люки больше не прячутся: бывают закрытые (декор) и открытые (препятствие); рядом ямы
  s = rep(s, "const man = R() < 0.4; addProp(man ? 'manhole' : 'puddle', p.x, p.y, { w: 40, deco: true, by: p.y - 400, ph: R() * 6 }); if (man) Wd.smokers.push({ x: p.x, y: p.y, t: R(), steam: true }); }",
    "addProp('puddle', p.x, p.y, { w: 40, deco: true, by: p.y - 400, ph: R() * 6 }); }\n  Wd.holes = [];\n  for (let s = 380; s < L5.LEN - 300; s += rr(230, 480)) {\n    const p = L5.at(s, { lane: rr(-46, 46) }), t = R();\n    if (L5.railHit(Wd, { x: p.x - 50, y: p.y - 50, w: 100, h: 100 }, 30)) continue;\n    if (t < 0.58) { const fr = Math.floor(R() * 6); Wd.holes.push({ x: p.x, y: p.y, r: 22 + (fr === 2 ? 8 : 0), fr, haz: 'pothole', rot: R() * 6.28 }); }\n    else if (t < 0.84) Wd.holes.push({ x: p.x, y: p.y, r: 14, fr: 6, haz: null, rot: R() * 6.28 });\n    else { Wd.holes.push({ x: p.x, y: p.y, r: 18, fr: 7, haz: 'open', rot: 0 }); Wd.smokers.push({ x: p.x, y: p.y, t: R(), steam: true }); }\n  }");
  return s;
});
edit('js/level5world.js', s => {
  s = rep(s, "  for (const sg of (lv.signs || [])) gl.push({ kind: 'sign', sg, by: sg.y });\n  for (const sp of", "  for (const sg of (lv.signs || [])) gl.push({ kind: 'sign', sg, by: sg.y });\n  if (L5.has('l5hole')) for (const h of (wd.holes || [])) if (h.x > x0 - 60 && h.x < x1 + 60 && h.y > y0 - 60 && h.y < y1 + 60) gl.push({ kind: 'hole', h, by: h.y - 420 });\n  for (const sp of");
  s = rep(s, "      case 'spikeStrip':", "      case 'hole': Spr.drawC(c, 'l5hole', o.h.fr, o.h.x, o.h.y, o.h.rot, 1); break;\n      case 'spikeStrip':");
  return s;
});
edit('js/level5extra.js', s => {
  s = rep(s, "    this.spikeTick(dt);", "    this.spikeTick(dt);\n    this.holeTick(dt);");
  s = rep(s, "  LV.spawnSpikes = function", `  // ямы и открытые люки: удар сбрасывает скорость, трясёт и слегка ломает машину
  LV.holeTick = function (dt) {
    const pl = this.pl, wd = L5.world;
    for (const c of this.cars) if (c.holeCool > 0) c.holeCool -= dt;
    for (const h of (wd.holes || [])) {
      if (!h.haz || Math.abs(h.x - pl.x) > 700 || Math.abs(h.y - pl.y) > 500) continue;
      for (const c of this.cars) {
        if (c.dead || c.air > 0 || c.holeCool > 0 || c.speed < 70 || Math.abs(c.x - h.x) > 80 || Math.abs(c.y - h.y) > 80) continue;
        if (!c.circles().some(ci => Math.hypot(ci.x - h.x, ci.y - h.y) < h.r + ci.r * 0.5)) continue;
        c.holeCool = 0.7; const open = h.haz === 'open', k = open ? 0.55 : 0.72;
        c.vx *= k; c.vy *= k; c.skid = 1;
        if (c === pl) { pl.damage(open ? 9 : 4, 'hole'); this.stats.dmg += open ? 9 : 4; G.shake(open ? 5 : 3.5, 0.25); FX.popText(c.x, c.y - 30, open ? 'ЛЮК!' : 'ЯМА!', '#ffb070'); }
        else if (c.cop || c.traffic) c.damage(open ? 6 : 3, 'hole');
        Sound.play('hit'); FX.burst(c.x, c.y, 5, { colors: ['#8a7a60', '#5a5048', '#3a3028'], speed: 90, life: 0.4, grav: 60 });
      }
    }
  };
  LV.spawnSpikes = function`);
  return s;
});
console.log('ok');
