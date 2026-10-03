'use strict';
// ============ УРОВЕНЬ 5: железнодорожные переезды с поездом и полицейский вертолёт ============
// Вся графика — спрайты l5cars3 (поезд, вертолёт) и l5props2 (шлагбаум, светофор), нарисованные через Codex.
L5.CROSS_S = [2300, 5600, 8300, 14800, 18500, 21500]; // где пути пересекают маршрут (по длине маршрута)
L5.RAIL_HW = 46; L5.RAIL_LEN = 1500;
L5.TRAIN = [0, 4, 2, 4, 2, 4]; // кадры в l5cars3: тепловоз, вагоны
L5.TRAIN_L = [190, 150, 150, 150, 150, 150];

// Пути: длинные прямые магистрали от края карты до края. Ищем линии, которые не задевают здания, озёра, боковые улицы
// и не идут вдоль маршрута; пересечения с маршрутом — переезды (шлагбаум, поезд).
L5.buildRails = function (Wd) {
  Wd.rails = []; Wd.tracks = [];
  const HW = L5.RAIL_HW, H = HW + 54;
  const bbr = Wd.roads.reduce((q, r) => ({ x0: Math.min(q.x0, r.x0), y0: Math.min(q.y0, r.y0), x1: Math.max(q.x1, r.x1), y1: Math.max(q.y1, r.y1) }), { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 });
  const BB = { x0: bbr.x0 - 3000, y0: bbr.y0 - 3000, x1: bbr.x1 + 3000, y1: bbr.y1 + 3000 };
  const roadHor = q => (q.x1 - q.x0) > (q.y1 - q.y0);
  // ok: линия не задевает объекты; возвращает список пересечений с магистральными дорогами или null
  const test = (horiz, c) => {
    for (const L of Wd.lakes) if ((horiz ? Math.abs(c - L.y) - L.ry : Math.abs(c - L.x) - L.rx) < H + 80) return null;
    for (const bx of Wd.boxList) if (horiz ? (bx.y < c + H && bx.y + bx.d > c - H) : (bx.x < c + H && bx.x + bx.w > c - H)) return null;
    const cross = [];
    for (const q of Wd.roads) {
      const lo = horiz ? q.y0 : q.x0, hi = horiz ? q.y1 : q.x1;
      if (c < lo - 230 || c > hi + 230) continue;
      const par = roadHor(q) === horiz;
      if (par) return null; // идёт вдоль дороги
      if (!q.main) { if (c > (horiz ? q.y0 : q.x0) - H - 60 && c < (horiz ? q.y1 : q.x1) + H + 60) return null; continue; }
      const alo = horiz ? q.y0 : q.x0, ahi = horiz ? q.y1 : q.x1;
      // пересекает магистральную улицу поперёк: не рядом с её концами (углами)
      if (c < alo + 320 || c > ahi - 320) return null;
      cross.push(q);
    }
    return cross;
  };
  const found = [];
  for (const horiz of [true, false]) {
    const lo = horiz ? BB.y0 + 300 : BB.x0 + 300, hi = horiz ? BB.y1 - 300 : BB.x1 - 300;
    let run = null;
    for (let c = lo; c <= hi + 1; c += 25) {
      const cr = test(horiz, c);
      if (cr && cr.length) { if (!run) run = { horiz, c0: c, c1: c, cr }; run.c1 = c; } else if (run) { found.push(run); run = null; }
    }
    if (run) found.push(run);
  }
  // выбираем до трёх линий с разными пересечениями, подальше друг от друга по маршруту
  const chosen = []; const usedS = [];
  found.sort((p, q) => (q.c1 - q.c0) - (p.c1 - p.c0));
  for (const f of found) {
    if (chosen.length >= 5) break;
    const c = (f.c0 + f.c1) / 2, pts = f.cr.map(q => {
      const x = f.horiz ? (q.x0 + q.x1) / 2 : c, y = f.horiz ? c : (q.y0 + q.y1) / 2, pr = L5.proj(x, y);
      return { x, y, s: pr.s };
    }).filter(p => p.s > 600 && p.s < L5.S_END - 600 && !(p.s > L5.S_MATCH - 350 && p.s < L5.S_RACE + 800));
    if (!pts.length || pts.some(p => usedS.some(u => Math.abs(u - p.s) < 1800))) continue;
    for (const p of pts) usedS.push(p.s);
    chosen.push({ f, c, pts });
  }
  for (const { f, c, pts } of chosen) {
    const horiz = f.horiz, a0 = horiz ? BB.x0 : BB.y0, a1 = horiz ? BB.x1 : BB.y1;
    const tk = { horiz, c, a0, a1, ang: horiz ? 0 : Math.PI / 2, cross: pts.map(p => horiz ? p.x : p.y) };
    Wd.tracks.push(tk);
    for (const p of pts) {
      const dx = horiz ? 1 : 0, dy = horiz ? 0 : 1;
      Wd.rails.push({ s: p.s, x: p.x, y: p.y, dx, dy, ang: tk.ang, tk, x0: p.x - L5.RAIL_LEN - HW, x1: p.x + L5.RAIL_LEN + HW, y0: p.y - L5.RAIL_LEN - HW, y1: p.y + L5.RAIL_LEN + HW, done: false, bar: 0 });
    }
  }
  Wd.rails.sort((p, q) => p.s - q.s);
  L5.CROSS_S = Wd.rails.map(r => r.s);
};
L5.railHit = (Wd, r, m) => (Wd.tracks || []).some(t => t.horiz
  ? (r.y < t.c + L5.RAIL_HW + m && r.y + r.h > t.c - L5.RAIL_HW - m)
  : (r.x < t.c + L5.RAIL_HW + m && r.x + r.w > t.c - L5.RAIL_HW - m));

(function () {
  const LV = L5.Level.prototype;
  const PX = (v, c, k) => c + (v - c) * k;

  LV.extraReset = function () {
    this.trains = []; this.heli = null; this.heliDone = {}; this.heliCrashDone = false; this.spikes = []; this.spikeDone = {};
    for (const r of (L5.world.rails || [])) { r.done = false; r.bar = 0; }
  };

  // ---------- засада с шипами: милиционеры у обочины раскидывают шипованную ленту ----------
  L5.SPIKE_S = [1500, 2950, 4350, 5900, 7000, 8300, 9000, 10300, 13400, 14700, 15900, 17700, 19300, 21000, 22500, 23700]; // засады с шипами: проверяются на удалённость от переездов и блокпостов
  // ямы и открытые люки: удар сбрасывает скорость, трясёт и слегка ломает машину
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
    if (!this.spikes) { this.spikes = []; this.spikeDone = {}; }
    if (this.mode === 'drive' || this.mode === 'race') for (const s of L5.SPIKE_S) if (!this.spikeDone[s] && s < L5.S_END - 900 && !(s > L5.S_MATCH - 400 && s < L5.S_RACE + 900) && !(L5.world.rails || []).some(r => Math.abs(r.s - s) < 650) && ![2400, 5200, 7600].some(b => Math.abs(b - s) < 600) && pl.s > s - 1100 && pl.s < s - 600) { this.spikeDone[s] = 1; this.spawnSpikes(s); }
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

  // ---------- логика ----------
  LV.extraTick = function (dt) {
    const pl = this.pl, wd = L5.world;
    if (!this.trains) this.extraReset();
    this.spikeTick(dt);
    this.holeTick(dt);
    for (const r of (wd.rails || [])) {
      // шлагбаум опущен, пока поезд рядом или скоро приедет
      const want = this.trains.some(t => t.r === r) ? 1 : 0;
      r.bar += (want - r.bar) * Math.min(1, dt * 6);
      if (!r.done && (this.mode === 'drive' || this.mode === 'race') && pl.s > r.s - 1150 && pl.s < r.s - 850) {
        r.done = true;
        const dir = Math.random() < 0.5 ? 1 : -1, sp = 520;
        this.trains.push({ r, dir, head: -dir * (L5.RAIL_LEN - 100), sp, t: 0 });
        this.titleText = 'ПЕРЕЕЗД! ПОЕЗД!'; this.titleT = 1.6; Sound.play('warn');
      }
    }
    for (const tr of this.trains) {
      tr.t += dt; tr.head += tr.dir * tr.sp * dt;
      if (tr.t % 0.9 < dt) Sound.play('honk');
      // положения вагонов: голова — впереди по ходу
      let off = 0; tr.parts = [];
      for (let i = 0; i < L5.TRAIN.length; i++) {
        const L = L5.TRAIN_L[i], mid = tr.head - tr.dir * (off + L / 2);
        tr.parts.push({ fr: L5.TRAIN[i], L, x: tr.r.x + tr.r.dx * mid, y: tr.r.y + tr.r.dy * mid, ang: tr.r.ang + (tr.dir < 0 ? Math.PI : 0) });
        off += L + 4;
      }
      for (const c of this.cars) {
        if (c.dead || c.air > 0) continue;
        for (const p of tr.parts) {
          const ca = Math.cos(tr.r.ang), sa = Math.sin(tr.r.ang), rx = c.x - p.x, ry = c.y - p.y;
          if (Math.abs(rx * ca + ry * sa) < p.L / 2 + c.L * 0.3 && Math.abs(-rx * sa + ry * ca) < 26 + c.Wd / 2) {
            if (c === pl) { if (pl.invul <= 0) { pl.damage(45, 'train'); pl.invul = 1.2; pl.vx += tr.r.dx * tr.dir * 260; pl.vy += tr.r.dy * tr.dir * 260; G.shake(7, 0.4); Sound.play('crash'); G.flash(0.2, '#ffffff'); } }
            else if (!c.isMatiz) { c.invul = 0; c.hp = 0; this.explode(c, 'train'); if (c.cop) { this.score += c.d.score || 300; FX.popText(c.x, c.y - 30, 'ПОЕЗД! +' + (c.d.score || 300), '#ffd84a'); } }
            break;
          }
        }
      }
    }
    this.trains = this.trains.filter(tr => Math.abs(tr.head) < L5.RAIL_LEN + 1100 || tr.t < 1);
    this.trains = this.trains.filter(tr => (tr.dir > 0 ? tr.head - 1000 : -tr.head - 1000) < L5.RAIL_LEN);
    this.heliTick(dt);
  };

  // ---------- вертолёт ----------
  LV.heliTick = function (dt) {
    const pl = this.pl;
    if (!this.heliDone) this.heliDone = {};
    const trig = this.mode === 'race' ? L5.S_RACE + 3800 : 6900;
    if (!this.heli && !this.heliDone[trig] && (this.mode === 'drive' || this.mode === 'race') && pl.s > trig && L5.has('l5cars3') && !(this.mode === 'drive' && pl.s > L5.S_MATCH - 700)) {
      this.heliDone[trig] = 1; this.heli = { x: pl.x - 700, y: pl.y - 500, vx: 0, vy: 0, hp: 90, maxhp: 90, ang: 0, t: 0, shoot: 2.5, burst: 0, flash: 0, rot: 0 };
      this.titleText = 'ВЕРТОЛЁТ МИЛИЦИИ!'; this.titleT = 2; Sound.play('sting');
    }
    // ближе к финалу вертолёт на глазах у игрока врезается в здание у трассы и взрывается
    if (this.mode === 'race' && !this.heliCrashDone && pl.s > L5.S_END - 2700) {
      this.heliCrashDone = true;
      const ts = Math.min(L5.S_END - 650, pl.s + 1250), tg = L5.at(ts, { lane: 0 });
      let best = null, bd = 520;
      for (const b of L5.world.boxList) { if (b.H < 28 || b.arch) continue; const d = Math.hypot(b.cx - tg.x, b.cy - tg.y); if (d < bd) { bd = d; best = b; } }
      const tx = best ? best.cx : tg.x + tg.nx * 170, ty = best ? best.cy : tg.y + tg.ny * 170;
      if (!this.heli) this.heli = { x: tx + tg.nx * 520 - tg.dx * 260, y: ty + tg.ny * 520 - tg.dy * 260, vx: 0, vy: 0, hp: 90, maxhp: 90, ang: 0, t: 0, shoot: 99, burst: 0, flash: 0, rot: 0 };
      this.heli.x = tx + tg.nx * 520 - tg.dx * 260; this.heli.y = ty + tg.ny * 520 - tg.dy * 260; this.heli.vx = this.heli.vy = 0; this.heli.dying = 0; this.heli.hp = Math.min(this.heli.hp, 22); this.heli.crash = { tx, ty, ts }; this.heli.shoot = 99;
      this.titleText = 'ВЕРТОЛЁТ ПОДБИТ!'; this.titleT = 1.8; Sound.play('sting');
    }
    const h = this.heli; if (!h) return;
    h.t += dt; h.rot += dt * 40; if (h.flash > 0) h.flash -= dt;
    if (h.dying) { h.dying -= dt; h.x += h.vx * dt; h.y += h.vy * dt; h.ang += dt * 7; if (h.dying <= 0) { this.boom(h.x, h.y, 150, 40, true); G.shake(7, 0.5); G.flash(0.25, '#ffd070'); Sound.play('boom'); this.wrecks.push({ x: h.x, y: h.y, ang: h.ang, sh: 'l5cars3', fr: 8, t: 0, fire: 11, L: 60, sx: 0.8, sy: 0.8 }); this.heli = null; } return; }
    if (h.crash) {
      const c = h.crash, dx = c.tx - h.x, dy = c.ty - h.y, dist = Math.hypot(dx, dy);
      const spd = dist > 260 ? 300 : 0, hx = dist > 260 ? dx / Math.max(1, dist) : Math.cos(h.t * 1.4), hy = dist > 260 ? dy / Math.max(1, dist) : Math.sin(h.t * 1.4); // издалека летит к зданию, у цели кружит, пока игрок не подъедет
      h.vx += ((spd ? hx * spd : hx * 70) - h.vx) * dt * 1.3; h.vy += ((spd ? hy * spd : hy * 70) - h.vy) * dt * 1.3;
      h.x += h.vx * dt; h.y += h.vy * dt; h.ang = Math.atan2(h.vy, h.vx) + Math.sin(h.t * 9) * 0.25;
      if (Math.random() < dt * 22) FX.spawn({ x: h.x, y: h.y, vx: U.rand(-30, 30), vy: U.rand(-30, 30), life: 0.9, size: 5, grav: -10, color: '#44464c', type: 'puff' });
      if (Math.hypot(c.tx - pl.x, c.ty - pl.y) < 460 && dist < 560) {
        h.dying = 0.9; h.vx = dx / 0.9; h.vy = dy / 0.9; h.crash = null; this.score += 1500;
        FX.popText(h.x, h.y - 40, 'ВЕРТОЛЁТ РАЗБИЛСЯ!', '#ffd84a'); Sound.play('warn');
      }
      return;
    }
    const tx = pl.x + pl.vx * 0.7 + Math.cos(h.t * 0.6) * 260, ty = pl.y + pl.vy * 0.7 + Math.sin(h.t * 0.6) * 200;
    h.vx += (tx - h.x) * dt * 1.6; h.vy += (ty - h.y) * dt * 1.6;
    const sp = Math.hypot(h.vx, h.vy), mx = 330; if (sp > mx) { h.vx *= mx / sp; h.vy *= mx / sp; }
    h.vx *= 1 - dt * 1.1; h.vy *= 1 - dt * 1.1;
    h.x += h.vx * dt; h.y += h.vy * dt;
    const want = Math.atan2(pl.y - h.y, pl.x - h.x); let da = want - h.ang; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2; h.ang += da * Math.min(1, dt * 3);
    h.shoot -= dt;
    if (h.shoot <= 0 && Math.hypot(pl.x - h.x, pl.y - h.y) < 520) { h.shoot = 3.2; h.burst = 6; }
    if (h.burst > 0 && (h.burstT = (h.burstT || 0) - dt) <= 0) { h.burstT = 0.1; h.burst--; const a = Math.atan2(pl.y + pl.vy * 0.25 - h.y, pl.x + pl.vx * 0.25 - h.x) + U.rand(-0.12, 0.12); this.ebullets.push({ x: h.x + Math.cos(a) * 30, y: h.y + Math.sin(a) * 30, vx: Math.cos(a) * 400, vy: Math.sin(a) * 400, t: 0, dmg: 3 }); Sound.play('throw'); }
    // пули Вовы
    for (const b of this.bullets) {
      if (!b.dead && Math.abs(b.x - h.x) < 70 && Math.abs(b.y - h.y) < 50) { b.dead = true; h.hp -= 6; h.flash = 0.1; FX.burst(b.x, b.y, 5, { colors: ['#9cff40', '#fff'], speed: 110, life: 0.3, grav: 0 }); Sound.play('hit'); }
    }
    if (h.hp <= 0 && !h.dying) { h.dying = 1.1; h.vx *= 0.4; h.vy = 160; this.score += 2500; FX.popText(h.x, h.y - 40, 'ВЕРТОЛЁТ СБИТ! +2500', '#ffd84a'); Sound.play('sting'); }
  };

  // ---------- рисование ----------
  // рельсы, шпалы, шлагбаумы — на земле, под тенями и машинами
  L5.R.rails = function (c, lv, x0, y0, x1, y1, t) {
    const wd = L5.world, RI = L5.img.l5_rail, TS = 243;
    if (RI) for (const tk of (wd.tracks || [])) {
      if (tk.horiz ? (tk.c + 80 < y0 || tk.c - 80 > y1) : (tk.c + 80 < x0 || tk.c - 80 > x1)) continue;
      const lo = Math.max(tk.a0, (tk.horiz ? x0 : y0) - TS), hi = Math.min(tk.a1, (tk.horiz ? x1 : y1) + TS), u0 = tk.a0 + Math.floor((lo - tk.a0) / TS) * TS;
      c.save(); c.translate(tk.horiz ? 0 : tk.c, tk.horiz ? tk.c : 0); c.rotate(tk.ang);
      for (let u = u0; u < hi; u += TS) c.drawImage(RI, 0, 72, 256, 98, u, -TS * 0.218, TS + 0.6, TS * 0.383);
      for (const cu of tk.cross) if (cu > lo - TS && cu < hi + TS) c.drawImage(RI, 256, 72, 256, 98, cu - TS / 2, -TS * 0.218, TS + 0.6, TS * 0.383);
      c.restore();
    }
    for (const r of (wd.rails || [])) {
      if (r.x1 < x0 || r.x0 > x1 || r.y1 < y0 || r.y0 > y1) continue;
      if (L5.has('l5props2')) {
        const a = L5.at(r.s, { lane: 0 });
        for (const sd of [-1, 1]) {
          const bx = r.x + a.nx * sd * 112 + a.dx * sd * 40, by = r.y + a.ny * sd * 112 + a.dy * sd * 40;
          Spr.drawC(c, 'l5props2', 2, bx, by - 4, 0, 0.62);
          // шлагбаум (кадр 1, стойка слева): поднят вдоль дороги, опущен поперёк
          { const fs1 = Spr.size('l5props2', 1), sc = fs1[0] ? 54 / fs1[0] : 1, raised = Math.atan2(a.dy, a.dx) + (sd < 0 ? Math.PI : 0), lowered = Math.atan2(-sd * a.ny, -sd * a.nx), diff = ((lowered - raised + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
            c.save(); c.translate(r.x + a.nx * sd * 92 + a.dx * sd * 30, r.y + a.ny * sd * 92 + a.dy * sd * 30); c.rotate(raised + diff * r.bar); Spr.drawC(c, 'l5props2', 1, fs1[0] * sc / 2 - 6, 0, 0, sc); c.restore(); }
          if (r.bar > 0.5 && Math.floor(t * 3) % 2) { if (L5.has('l5lights')) { c.save(); c.globalCompositeOperation = 'lighter'; Spr.drawC(c, 'l5lights', 2, bx, by - 10, 0, 0.35); c.restore(); } }
        }
      }
    }
  };
  L5.R.train = function (c, tr) {
    if (!tr.parts) return;
    for (const p of tr.parts) { c.save(); c.translate(p.x, p.y); c.rotate(p.ang); if (L5.has('l5cars3')) Spr.drawC(c, 'l5cars3', p.fr, 0, 0, 0, 1); c.restore(); }
  };
  L5.R.heli = function (c, C, h, t) {
    const z = 150, k = 1 + z / L5.PERSP, x = PX(h.x, C.x, k), y = PX(h.y, C.y, k);
    if (L5.R.SH) L5.R.SH(1, h.x + 26, h.y + 22, 150, 80, 0.5, h.ang);
    c.save(); c.translate(x, y); c.rotate(h.ang);
    if (h.flash > 0) c.globalAlpha = 0.7;
    Spr.drawC(c, 'l5cars3', 8, 0, 0, 0, k);
    c.restore();
  };
})();
