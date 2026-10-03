const fs = require('fs');
function edit(f, fn) { let s = fs.readFileSync(f, 'utf8'); s = fn(s); fs.writeFileSync(f, s); }
function rep(s, a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); return s.replace(a, b); }
edit('js/level5extra.js', s => {
  s = rep(s, "    this.trains = []; this.heli = null; this.heliDone = {};", "    this.trains = []; this.heli = null; this.heliDone = {}; this.spikes = []; this.spikeDone = {};");
  s = rep(s, "    if (!this.trains) this.extraReset();", `    if (!this.trains) this.extraReset();
    this.spikeTick(dt);`);
  s = rep(s, "  // ---------- логика ----------", `  // ---------- засада с шипами: милиционеры у обочины раскидывают шипованную ленту ----------
  L5.SPIKE_S = [3500, 6600, 9900, 11300, 13200, 16500, 19500, 22300];
  LV.spawnSpikes = function (s) {
    const g = Math.random() < 0.5 ? 1 : -1, HW = L5.HW, len = HW * 2 - 56;
    const a = L5.at(s, { lane: 0 }), sp = { s, state: 'wait', t: 0, cops: [], bursts: [], x: a.x, y: a.y, ang: a.ang };
    for (const sd of [-1, 1]) {
      const p = L5.at(s + (sd > 0 ? 12 : -12), { lane: sd * (HW + 14) });
      sp.cops.push({ x: p.x, y: p.y, rot: Math.atan2(-p.ny * sd, -p.nx * sd) - Math.PI / 2, fr: 0, side: sd });
    }
    const cc = L5.at(s - 40, { lane: g * (HW + 64) }), car = new L5.Car('patrol', cc.x, cc.y, cc.ang + 0.18 * g);
    car.parkedCop = true; car.brk = 1; car.s = s; car.shooter = true; this.cars.push(car); sp.car = car;
    const c0 = L5.at(s, { lane: -g * (HW - len / 2) });
    sp.strip = { x: c0.x, y: c0.y, ang: a.ang + Math.PI / 2, len, ax: Math.cos(a.ang + Math.PI / 2), ay: Math.sin(a.ang + Math.PI / 2), rx: Math.cos(a.ang), ry: Math.sin(a.ang) };
    this.spikes.push(sp);
  };
  LV.spikeTick = function (dt) {
    const pl = this.pl;
    if (this.mode === 'drive') for (const s of L5.SPIKE_S) if (!this.spikeDone[s] && s < L5.S_MATCH - 600 && pl.s > s - 1100 && pl.s < s - 600) { this.spikeDone[s] = 1; this.spawnSpikes(s); }
    for (const sp of (this.spikes || [])) {
      sp.t += dt;
      const d = sp.s - pl.s;
      if (sp.state === 'wait') {
        for (const c of sp.cops) c.fr = d < 750 ? 3 : 0;
        if (d < 420 && d > 0) { sp.state = 'throw'; sp.t = 0; G.say(this.pl, 'Менты! Шипы!', 1.4, { sound: false }); this.titleText = 'ШИПЫ НА ДОРОГЕ!'; this.titleT = 1.6; Sound.play('warn'); }
      } else if (sp.state === 'throw') {
        for (const c of sp.cops) c.fr = sp.t < 0.4 ? 1 : 2;
        if (sp.t > 0.7) { sp.state = 'lay'; sp.t = 0; for (const c of sp.cops) c.fr = 0; Sound.play('stomp'); }
      } else {
        if (sp.t > 2 && sp.cops[0].fr === 0) for (const c of sp.cops) c.fr = 3;
        const st = sp.strip;
        for (const c of this.cars) {
          if (c.dead || c.air > 0 || c.flatT > 0 || c.d.boss || (c.parked || c.parkedCop)) continue;
          for (const ci of c.circles()) {
            const rx = ci.x - st.x, ry = ci.y - st.y, lx = rx * st.ax + ry * st.ay, ly = rx * st.rx + ry * st.ry;
            if (Math.abs(lx) < st.len / 2 + 4 && Math.abs(ly) < 12 + ci.r * 0.4) {
              c.flatT = 5; sp.bursts.push({ x: ci.x, y: ci.y, t: 0 }); Sound.play('hit');
              if (c === pl) { c.damage(5, 'spike'); this.stats.dmg += 5; FX.popText(c.x, c.y - 34, 'ШИНЫ ПРОБИТЫ!', '#ff6a4a'); G.shake(3, 0.2); }
              break;
            }
          }
        }
      }
      for (const b of sp.bursts) b.t += dt;
      sp.bursts = sp.bursts.filter(b => b.t < 0.6);
    }
    this.spikes = (this.spikes || []).filter(sp => pl.s - sp.s < 1600);
    for (const c of this.cars) if (c.flatT > 0) c.flatT -= dt;
  };

  // ---------- логика ----------`);
  return s;
});
edit('js/level5ent.js', s => {
  s = rep(s, "this.cop = !!this.d.cop; this.shoot = 0;", "this.cop = !!this.d.cop; this.flatT = 0; this.shoot = 0;");
  s = rep(s, "* this.maxMul * nit, max = d.max * mul;", "* this.maxMul * nit * (this.flatT > 0 ? 0.55 : 1), max = d.max * mul;");
  s = rep(s, "const gr = this.hand ? 1.6 : d.grip + (sf === 'grass' ? -3 : 0);", "const gr = this.hand ? 1.6 : d.grip + (sf === 'grass' ? -3 : 0) - (this.flatT > 0 ? 3 : 0);\n      if (this.flatT > 0) this.ang += Math.sin(this.t * 11) * 0.5 * dt * U.clamp(vf / 150, 0, 1);");
  return s;
});
edit('js/level5world.js', s => {
  s = rep(s, "  for (const sg of (lv.signs || [])) gl.push({ kind: 'sign', sg, by: sg.y });", "  for (const sg of (lv.signs || [])) gl.push({ kind: 'sign', sg, by: sg.y });\n  for (const sp of (lv.spikes || [])) { if (sp.state === 'lay') gl.push({ kind: 'spikeStrip', sp, by: sp.strip.y - 200 }); for (const cp of sp.cops) gl.push({ kind: 'spikeCop', cp, by: cp.y }); for (const b of sp.bursts) gl.push({ kind: 'spikeBurst', b, by: b.y + 40 }); }");
  s = rep(s, "      case 'sign':", `      case 'spikeStrip': if (L5.has('l5spike')) { const f = Spr.size('l5spike', 5), st = o.sp.strip; if (f[0]) Spr.drawC(c, 'l5spike', Math.floor(G.t * 2.5) % 2 ? 5 : 6, st.x, st.y, st.ang - Math.PI / 2 + Math.PI / 2, st.len / f[0]); } break;
      case 'spikeCop': if (L5.has('l5spike')) Spr.drawC(c, 'l5spike', o.cp.fr, o.cp.x, o.cp.y, o.cp.rot, 1); break;
      case 'spikeBurst': if (L5.has('l5spike')) Spr.drawC(c, 'l5spike', 7, o.b.x, o.b.y, 0, 0.6 + o.b.t * 1.6); break;
      case 'sign':`);
  return s;
});
edit('tools/build_l5.py', s => rep(s, "if have('l5_signs.png'):", "if have('l5_spikes.png'):\n    S['l5spike'] = build_sheet('l5spike', 'l5_spikes.png', 8, [-44, -44, -44, -44, -60, -150, -150, -56], grid=(4, 2), anchors=['center'] * 8)\nif have('l5_signs.png'):"));
console.log('ok');
