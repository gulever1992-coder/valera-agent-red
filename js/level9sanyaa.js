// Уровень 9, часть 4 «ПРОФЕССОР САНЯ» — АРЕНА по эскизу владельца (2026-10-20, третья версия).
// Пещера-лаборатория чуть выше экрана: внизу пол и мастерская Сани (по центру), над ней парящие острова с 3D-принтерами
// (на два нижних — по лестнице, на остальные запрыгивать), по стенам и на потолке — живучие аккумуляторы: разбит — его принтер взрывается.
// Саня в сканере ездит по рельсу под потолком: плазма (одна или веер из пяти) и молния — пол или остров под Валерой бьёт током.
// Клоны лезут из принтеров один за другим, карабкаются по лестницам и прыгают на острова; собаки стреляют лазером, пауки — паутиной (жми стрелки).
// Все аккумуляторы разбиты — Саня взрывается, в мастерской включаются телевизоры с мистером Иксом и открывается потайной ход.
// Откат: ?h=2 — вертикальная башня (level9sanyav.js), ?h=1 — первая горизонтальная (level9sanya.js).
// Арт — Flow (tools/p9/flow9s.js: l9afar/amid/apipe/anear, l9asteam, l9avat, l9aisl, l9astrip, l9aws, l9afx -> build_l9.py).
(() => {
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd, F = () => L9.FOES;
  const W = 1280, GY = 930, RY = 190, RM = 600, RB = 790, SCAN_H = 134, WS_X = 640, DOCK_X = 890;
  // сеть рельсов (по эскизу): под потолком, по середине карты и вертикали у стен — сканер всегда едет к ближайшей к Валере точке
  const RN = { TL: [40, RY], TR: [1240, RY], ML: [40, RM], MR: [1240, RM], BL: [40, RB], BR: [1240, RB] };
  const RE = [['TL', 'TR'], ['ML', 'MR'], ['TL', 'ML'], ['ML', 'BL'], ['TR', 'MR'], ['MR', 'BR']].map(([a, b]) => ({ a, b, A: RN[a], B: RN[b], len: Math.hypot(RN[b][0] - RN[a][0], RN[b][1] - RN[a][1]), vert: RN[a][0] === RN[b][0] }));
  const rPos = (e, f) => [e.A[0] + (e.B[0] - e.A[0]) * f, e.A[1] + (e.B[1] - e.A[1]) * f];
  const rNear = (x, y) => { let best = null; for (const e of RE) { const dx = e.B[0] - e.A[0], dy = e.B[1] - e.A[1], f = clamp(((x - e.A[0]) * dx + (y - e.A[1]) * dy) / (e.len * e.len), 0, 1), [px, py] = rPos(e, f), d = Math.hypot(px - x, py - y) * (e.vert ? 1.1 : 1); if (!best || d < best.d) best = { e, f, d }; } return best; };
  const rDist = t => {     // кратчайшие расстояния от узлов сети до точки t (по рельсам)
    const D = {}; for (const n in RN) D[n] = 1e9; D[t.e.a] = t.f * t.e.len; D[t.e.b] = (1 - t.f) * t.e.len;
    for (let k = 0; k < 6; k++) for (const e of RE) { D[e.a] = Math.min(D[e.a], D[e.b] + e.len); D[e.b] = Math.min(D[e.b], D[e.a] + e.len); }
    return D;
  };
  const rMove = (s, t, step) => {     // сдвинуть сканер s {e, f} по сети к цели t на step px
    for (let k = 0; k < 4 && step > 0.01; k++) {
      if (s.e === t.e) { const d = (t.f - s.f) * s.e.len; const m = clamp(d, -step, step); s.f += m / s.e.len; return; }
      const D = rDist(t), toA = s.f * s.e.len + D[s.e.a], toB = (1 - s.f) * s.e.len + D[s.e.b], goB = s.f <= 0 ? toB <= toA : s.f >= 1 ? !(toA <= toB) : toB < toA,     // стоим в узле — при равенстве уезжаем с него, а не обратно
         rest = goB ? (1 - s.f) * s.e.len : s.f * s.e.len;
      if (rest > step) { s.f += (goB ? step : -step) / s.e.len; return; }
      step -= rest; const n = goB ? s.e.b : s.e.a;
      let bestE = null, bestC = 1e9; for (const e of RE) { if (e.a !== n && e.b !== n) continue; const c = e === t.e ? (e.a === n ? t.f : 1 - t.f) * e.len : e.len + D[e.a === n ? e.b : e.a]; if (c < bestC) { bestC = c; bestE = e; } }
      s.e = bestE; s.f = bestE.a === n ? 0 : 1;
    }
  };
  // острова: x, y (настил), ширина, кадр isl9; prn — x принтера
  const ISL = [
    { x: 70, y: 790, w: 300, fr: 'big0', prn: 190 },      // 0 нижний левый (лестница)
    { x: 910, y: 790, w: 300, fr: 'big1', prn: 1090 },    // 1 нижний правый (лестница)
    { x: 500, y: 636, w: 280, fr: 'big2', prn: 640 },     // 2 центр
    { x: 70, y: 476, w: 280, fr: 'big1', prn: 180 },      // 3 верхний левый
    { x: 930, y: 476, w: 280, fr: 'big0', prn: 1100 },    // 4 верхний правый
    { x: 405, y: 712, w: 90, fr: 'small0' }, { x: 785, y: 712, w: 90, fr: 'small1' },     // ступеньки
    { x: 375, y: 556, w: 90, fr: 'small1' }, { x: 815, y: 556, w: 90, fr: 'small0' },
  ];
  const LADS = [[340, 790, GY], [940, 790, GY]];
  // аккумуляторы: x, y, остров-принтер, на потолке ли
  const BATS = [[640, 380, 2, 1], [24, 431, 3], [1256, 431, 4], [24, 745, 0], [1256, 745, 1]];
  const BAT_HP = 24;
  let SAVE = [];

  // ---------- клон для арены: лезет по лестницам и прыгает на острова к Валере ----------
  class AClone extends L9.FOES.Clone {
    ai(dt, P) {
      const M = this.M;
      if (this.lad) { this.vx = 0; this.vy = 0; this.y -= 105 * dt; this.set('run'); if (this.y <= this.lad[1]) { this.y = this.lad[1]; this.lad = null; this.onG = true; } return; }
      if (this.st === 'leap') { if (this.onG && this.stT > 0.12) this.set('run'); this.phys(dt); return; }
      const dy = P.y - this.y;
      this.jumps = dy > 30 ? 1 : 0;     // Валера ниже — можно сходить с края
      if (this.onG && dy < -30 && !P.climb) {
        const r = M.route(this, P);
        if (r) {
          const dx = r.x - this.x;
          if (Math.abs(dx) < 10) {
            if (r.l) { this.lad = r.l; this.x = r.l[0]; this.set('run'); return; }
            this.set('leap'); this.vy = -660; this.vx = r.dir * 135; this.onG = false; Sound.play('jump', 0.35); this.phys(dt); return;
          }
          this.set('run'); this.vx = Math.sign(dx) * this.sp; this.phys(dt); return;
        }
      }
      super.ai(dt, P);
    }
    phys(dt) { if (this.lad) return; super.phys(dt); }
    frame() { if (this.lad) return this.walkFr(6, 11); if (this.st === 'leap' && !this.dead) return 'grab'; return super.frame(); }
  }

  L9.MAPS.sanyaA = () => {
    const LM = L9.MAPS.lab();
    const M = {
      x0: 0, x1: W, y0: 50, y1: 1010, killY: 1300,
      solids: [[0, GY, W, 120, 'hide'], [-40, -200, 40, 1400, 'hide'], [W, -200, 40, 1400, 'hide'], [0, -200, W, 320, 'hide']],
      walks: [], ladders: LADS.map(l => l.slice()),
      cks: [[60, GY], [300, GY]], picks: [],
      spdWeb: null,
    };
    for (const s of ISL) { const w = [s.x, s.y, s.w]; w.thru = 1; w.own = 1; M.walks.push(w); }
    // поверхности для поиска пути клонов и для молнии
    const SURF = [{ x0: 0, x1: W, y: GY }].concat(ISL.map((s, i) => ({ x0: s.x, x1: s.x + s.w, y: s.y, i })));
    const surfAt = (x, y) => SURF.find(s => Math.abs(s.y - y) < 4 && x >= s.x0 - 2 && x <= s.x1 + 2);
    M.route = (f, P) => {
      const cur = surfAt(f.x, f.y); if (!cur) return null;
      const want = surfAt(P.x, P.y) || SURF.reduce((a, s) => (s.y >= P.y - 4 && (!a || s.y < a.y) && P.x >= s.x0 && P.x <= s.x1 ? s : a), null);
      const opts = [];
      for (const l of M.ladders) if (Math.abs(l[2] - cur.y) < 4 && l[0] >= cur.x0 && l[0] <= cur.x1) opts.push({ x: l[0], l, to: surfAt(l[0], l[1]) });
      for (const s of SURF) {
        const h = cur.y - s.y; if (h < 20 || h > 150 || s === cur) continue;
        const ov0 = Math.max(cur.x0, s.x0 + 14), ov1 = Math.min(cur.x1, s.x1 - 14);
        if (ov0 < ov1) opts.push({ x: clamp(f.x, ov0, ov1), dir: 0, to: s });                 // остров прямо над нами — прыжок вверх сквозь настил
        else if (s.x0 > cur.x1 && s.x0 - cur.x1 < 90) opts.push({ x: cur.x1 - 8, dir: 1, to: s });
        else if (s.x1 < cur.x0 && cur.x0 - s.x1 < 90) opts.push({ x: cur.x0 + 8, dir: -1, to: s });
      }
      if (!opts.length) return null;
      const score = o => { const s = o.to; if (!s) return 1e9; const tx = want ? clamp(P.x, want.x0, want.x1) : P.x; return Math.abs(s.y - P.y) * 2.2 + Math.abs(clamp(tx, s.x0, s.x1) - tx) + Math.abs(o.x - f.x) * 0.4; };
      return opts.sort((a, b) => score(a) - score(b))[0];
    };
    const ebulDraw = (fr, s) => (c, e) => S(c, 'afx9', fr, e.x, e.y, s, { add: 1, rot: fr === 'web' ? Math.atan2(e.vy, e.vx) + Math.PI : 0 });
    M.spdWeb = { fr: 'web', dmg: 3, draw: ebulDraw('web', 0.55), onHit: (e, P) => { if (!P.lv.dead) { P.web = 1; P.hintAt('ПАУТИНА! Жми стрелки, чтобы вырваться', 2.5); } } };

    M.init = (P, lv, ck) => {
      if (!ck) SAVE = [];
      M.fight = ck > 0; M.cut = ck > 0; M.fin = null; M.leaving = 0; M.zap = null; M.zapCd = 0; M.robT = 10; M.tv = 0;
      M.picks = [['kefir', 250, ISL[0].y], ['grenades', 1000, ISL[1].y], ['pelmeni', 600, ISL[2].y], ['rocket', 140, ISL[3].y], ['kefir', 1150, ISL[4].y], ['pelmeni', 1200, GY]].map(([kind, x, y]) => ({ kind, x, y, t: 0 }));
      M.bats = BATS.map(([x, y, isl, ceil], i) => ({ x, y, isl, ceil, i, hp: SAVE.includes(i) ? 0 : BAT_HP }));
      M.prn = ISL.filter(s => s.prn).map((s, i) => ({ x: s.prn, y: s.y, isl: i, st: SAVE.some(b => BATS[b][2] === i) ? 'wreck' : 'idle', t: rnd(0, 2), cd: rnd(0.5, 2.5) }));
      M.robots = ck > 0 ? [] : [{ fr: 'dogSit', dead: 'dogDead', x: 470, hp: 99, wake: 1 }];
      M.san = { x: WS_X, fr: 'fix0', dir: -1, gone: ck > 0 };
      M.scan = { x: ck > 0 ? 400 : DOCK_X, bot: ck > 0 ? RM + SCAN_H : GY, fr: ck > 0 ? 'glass' : 'open', cd: 2, dead: 0, e: RE[1], f: ((ck > 0 ? 400 : DOCK_X) - 40) / 1200 };
      const foes = [['RDog', 1100, GY], ['RSpd', 640, ISL[2].y], ['RSpd', 200, ISL[3].y, 1], ['RSpd', 1080, ISL[4].y, 1], ['RDog', 1050, ISL[1].y]];
      if (ck > 0) foes.push(['RDog', 500, GY]);
      for (const [tp, x, y, ceil] of foes) P.foes.push(new (F()[tp])(M, x, y, ceil ? { ceil: y - 200 } : {}));
      if (ck > 0) lv.say('СТРЕЛЯЙ ПО АККУМУЛЯТОРАМ НА СТЕНАХ И ПОТОЛКЕ!', 3);
      M.vent = [...Array(6)].map(() => ({ t: rnd(-4, 0), sp: rnd(0.9, 1.4) }));
    };
    M.camY = gy => gy - 300 - clamp((700 - gy) * 0.25, 0, 60);     // у верхних островов камера выше — видно рельс и потолок
    M.left = () => M.bats.filter(b => b.hp > 0).length;
    M.hazAt = (x, y, P) => {     // пол/остров под током
      const z = M.zap; if (!z || z.st !== 'on' || !P.onG || Math.abs(y - z.y) > 3 || x < z.x0 || x > z.x1) return null;
      if (M.zapHitT > 0) return null; M.zapHitT = 0.7; return [7, null];
    };
    const surfFor = P => { const s = surfAt(P.x, P.y); if (!s) return null; if (s.i == null) return { x0: clamp(P.x - 170, 0, W), x1: clamp(P.x + 170, 0, W), y: GY }; return { x0: s.x0, x1: s.x1, y: s.y }; };
    M.update = (dt, P, lv) => {
      if (!M.cut && P.x > 200) { M.cut = 1; P.vx = 0; Scene.dialogTop = true; Scene.run(M.script, () => { M.fight = true; P.st = 'stand'; lv.say('СТРЕЛЯЙ ПО АККУМУЛЯТОРАМ НА СТЕНАХ И ПОТОЛКЕ!', 3); }); return; }
      for (const k of M.picks) { k.t += dt; if (!k.dead && Math.abs(P.x - k.x) < 22 && Math.abs(P.y - k.y) < 40) LM.take(k, P, lv); }
      M.picks = M.picks.filter(k => !k.dead);
      M.zapHitT = (M.zapHitT || 0) - dt;
      for (const v of M.vent) { v.t += dt * v.sp; if (v.t > 1.3) v.t = rnd(-4, -1); }
      if (!M.fight) return;
      const clones = P.foes.filter(f => !f.dead && f instanceof AClone).length;
      if (M.wasClimb && !P.climb) P.inv = Math.max(P.inv, 0.5); M.wasClimb = !!P.climb;
      // принтеры печатают клонов один за другим
      M.prnCd = (M.prnCd || 0) - dt;
      for (const p of M.prn) {
        p.t += dt; if (p.st === 'wreck') continue;
        const near = Math.abs(P.x - p.x) < 100 && Math.abs(P.y - p.y) < 10;
        if (p.st === 'idle') { p.cd -= dt; if (p.cd <= 0 && !near && clones < 5 && M.prnCd <= 0 && !M.fin && Math.abs(P.y - p.y) < 330 && Math.abs(P.x - p.x) < 620) { p.st = 'print'; p.t = 0; M.prnCd = 2.1; Sound.play('zap', 0.4); } }
        else if (p.st === 'print' && M.fin) p.st = 'idle';
        else if (p.st === 'print' && p.t > 1.6) { p.st = 'out'; p.t = 0; const f = new AClone(M, p.x + 8, p.y); f.dir = P.x < p.x ? -1 : 1; P.foes.push(f); Sound.play('door', 0.4); }
        else if (p.st === 'out' && p.t > 0.6) { p.st = 'idle'; p.cd = rnd(2.2, 3.8); }
      }
      // роботы подбегают из краёв арены, пока их меньше трёх
      M.robT -= dt;
      if (M.robT <= 0 && !M.fin) { M.robT = rnd(10, 15); const n = P.foes.filter(f => !f.dead && !(f instanceof AClone)).length;
        if (n < 3) { const x = P.x < W / 2 ? 1230 : 50, f = new (F()[Math.random() < 0.5 ? 'RDog' : 'RSpd'])(M, x, GY); f.dir = x > W / 2 ? -1 : 1; P.foes.push(f); } }
      // сканер с Саней: едет по рельсу к Валере, стреляет плазмой (одна / веер из пяти) или бьёт молнией
      const s = M.scan;
      if (!s.dead) {
        const t = rNear(clamp(P.x + (P.x < W / 2 ? 120 : -120), 40, 1240), P.y - 150), sp = M.fin ? 40 : 150;
        rMove(s, t, sp * dt); const [rx, ry] = rPos(s.e, s.f); s.x = rx; s.bot = ry + SCAN_H;
        if (!M.fin) {
          s.cd -= dt; s.fr = s.cd < 0.5 || (M.zap && M.zap.st === 'warn') ? 'press' : 'glass';
          if (s.cd <= 0 && !P.climb && !P.lv.dead && Math.hypot(P.x - s.x, P.y - 40 - (s.bot - 60)) < 400) {
            const r = Math.random(), a0 = Math.atan2(P.y - 40 - (s.bot - 14), P.x - s.x);
            const shot = (a, sp, dmg) => P.ebul.push({ x: s.x, y: s.bot - 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, dmg, draw: ebulDraw('plasma', 0.42) });
            if (r < 0.28 && !M.zap && P.onG && M.zapCd <= 0) { const sf = surfFor(P); if (sf) { M.zap = Object.assign(sf, { st: 'warn', t: 0, bx: P.x }); M.zapCd = 6; Sound.play('warn', 0.6); s.cd = 3.2; } else s.cd = 0.5; }
            else if (r < 0.62) { for (let i = -2; i <= 2; i++) shot(a0 + i * 0.24, 210, 8); Sound.play('zap'); s.cd = rnd(2.6, 3.4); }
            else { shot(a0, 270, 10); Sound.play('zap', 0.7); s.cd = rnd(1.6, 2.4); }
          }
        }
      } else if (s.vy != null && s.bot < s.floorY) { s.vy += 900 * dt; s.bot = Math.min(s.floorY, s.bot + s.vy * dt); if (s.bot >= s.floorY) { Sound.play('crash'); G.shake(5, 0.3); } }
      M.zapCd -= dt;
      const z = M.zap;
      if (z) { z.t += dt;
        if (z.st === 'warn' && z.t > 0.9) { z.st = 'bolt'; z.t = 0; Sound.play('boom', 0.5); G.shake(3, 0.25); G.flash(0.06, '#9cf'); }
        else if (z.st === 'bolt' && z.t > 0.22) { z.st = 'on'; z.t = 0; }
        else if (z.st === 'on' && z.t > 3) M.zap = null; }
      if (!M.fin && M.left() === 0) { M.fin = { t: 0 }; M.zap = null; s.fr = 'spark'; lv.say('ПИТАНИЕ ОТКЛЮЧЕНО!', 2); Sound.play('warn'); }
      if (M.fin) {
        const f = M.fin; f.t += dt;
        if (!s.dead && (P.t * 20 | 0) % 2) P.fx.push({ sh: 'fxA9', fr: ['spark'], x: s.x + rnd(-30, 30), y: s.bot - 128 + rnd(-6, 6), s: rnd(0.5, 0.9), t: 0, life: 0.15, add: 1 });
        if (f.t > 0.4 && !f.l1) { f.l1 = 1; lv.say('САНЯ: «Нет-нет-нет! Вагонетка! Выпустите меня!»', 2.6); }
        if (f.t > 2.2 && s.fr === 'spark') { s.fr = 'fire'; Sound.play('glass'); }
        if (f.t > 3.4 && !s.dead) {
          s.dead = 1; s.fr = 'wreck'; s.vy = 0; const under = SURF.filter(q => q.y > s.bot && s.x >= q.x0 && s.x <= q.x1).sort((a, b) => a.y - b.y)[0]; s.floorY = under ? under.y : GY;
          G.shake(9, 0.7); G.flash(0.25, '#fff');
          for (let i = 0; i < 6; i++) P.fx.push({ sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2', 'boom3'], x: s.x + rnd(-50, 50), y: s.bot - rnd(20, 130), s: rnd(1.3, 2), t: -i * 0.08, life: 0.6 });
          Sound.play('boom'); lv.score += 3000;
          for (const c of P.foes) if (!c.dead) c.hit(99, Math.sign(c.x - s.x) || 1, 'blast');
        }
        if (f.t > 5 && !M.tv) { M.tv = 0.01; Sound.play('zap'); }
        if (M.tv) { M.tv += dt; if (M.tv > 1.6 && !f.l2) { f.l2 = 1; Sound.play('door'); lv.say('В МАСТЕРСКОЙ ОТКРЫЛСЯ ПОТАЙНОЙ ХОД!', 2.8); } }
      }
      // потайной ход в мастерской: подойти к люку
      if (M.tv > 1.6 && !M.leaving && Math.abs(P.x - (WS_X + 40)) < 30 && Math.abs(P.y - GY) < 4) { M.leaving = 1; lv.next(); }
    };
    M.batHit = (b, dmg, P) => {
      b.hp -= dmg; Sound.play('clank', 0.5); b.fl = 0.06;
      if (b.hp > 0) return;
      b.hp = 0; SAVE.push(b.i); Sound.play('boom'); G.shake(5, 0.35); P.lv.score += 500;
      P.fx.push({ sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2', 'boom3'], x: b.x, y: b.y, s: 0.9, t: 0, life: 0.55 });
      const p = M.prn.find(q => q.isl === b.isl); if (p && p.st !== 'wreck') {
        p.st = 'wreck'; p.t = 0;
        for (let i = 0; i < 4; i++) P.fx.push({ sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2', 'boom3'], x: p.x + rnd(-40, 40), y: p.y - rnd(20, 120), s: rnd(1, 1.5), t: -0.25 - i * 0.12, life: 0.6 });
        for (const c of P.foes) if (!c.dead && Math.abs(c.x - p.x) < 70 && Math.abs(c.y - p.y) < 40) c.hit(99, Math.sign(c.x - p.x) || 1, 'blast');
      }
      const n = M.left(); P.lv.say(n ? 'АККУМУЛЯТОР РАЗБИТ! ОСТАЛОСЬ ' + n : 'ВСЕ АККУМУЛЯТОРЫ РАЗБИТЫ!', 1.8);
    };
    M.shootProps = (b, P) => {
      for (const bt of M.bats) if (bt.hp > 0 && Math.abs(b.x - bt.x) < 28 && Math.abs(b.y - bt.y) < 28) { b.dead = true; if (b.w === 'rocket' || b.w === 'gren') P.blast(b.x, b.y, b.blast || 46, b.dmg); else M.batHit(bt, b.dmg, P); return; }
      const s = M.scan; if (M.fight && !s.dead && Math.abs(b.x - s.x) < 34 && b.y > s.bot - 130 && b.y < s.bot) {
        b.dead = true; Sound.play('deflect'); P.fx.push({ sh: 'fxL9', fr: ['spark'], x: b.x, y: b.y, s: 0.45, t: 0, life: 0.1, add: 1 });
        if (!M.glassHint) { M.glassHint = 1; P.hintAt('Бронестекло! Бей по аккумуляторам на стенах и потолке!', 3); } return; }
    };
    M.blast = (x, y, r, dmg, P) => { for (const bt of M.bats) if (bt.hp > 0 && Math.hypot(bt.x - x, bt.y - y) < r + 28) M.batHit(bt, dmg, P); };

    // ---------- катсцена (диалог дословно по ТЗ) ----------
    M.script = function* () {
      const P = L9.PARTS.lab, s = M.san, sc = M.scan, D = 0.016;
      P.dir = 1; P.st = 'run';
      while (P.x < 380) { P.x += 140 * D; yield D; }
      P.st = 'stand'; P.vx = 0;
      for (let i = 0; i < 3; i++) { s.fr = 'fix1'; Sound.play('clank', 0.5); yield 0.35; s.fr = 'fix0'; yield 0.3; }
      s.dir = -1; s.fr = 'talk'; yield 0.4;
      yield* Scene.say('valera', 'Саня, ты тоже, что ли, с ними?', null);
      s.fr = 'finger';
      yield* Scene.say('sanya', 'Нет, Валера, я всегда был с ними, ты не должен был об этом узнать! Ты должен был тоже попасть ко мне на хирургический стол!', null);
      s.fr = 'talk';
      yield* Scene.say('sanya', 'Мистер Икс верит в меня, это я разработал проект реновации завода! Это я создал по запросу Мистера Икса киберзаводчан — им не нужна еда, им нужен только стиральный порошок, и внутри них течёт чистый концентрат 99% спирта!', null);
      s.fr = 'shout';
      yield* Scene.say('valera', 'Не может быть, что ты наделал! Я думал, ты единственный из столицы нормальный! Ты приглашал меня в гости!', null);
      s.fr = 'finger';
      yield* Scene.say('sanya2', 'Всё кончено, мистер Валерий.', null);
      M.camT = 400; s.dir = 1; let k = 0;
      while (s.x < sc.x - 6) { s.x += 75 * D; s.fr = 'w' + ((k++ / 14 | 0) % 2); yield D; }
      s.gone = 1; Sound.play('door'); sc.fr = 'press'; yield 0.7;
      Sound.play('confirm'); G.flash(0.1, '#7f7'); yield 0.3;
      sc.fr = 'glass'; Sound.play('zap'); G.shake(3, 0.4); yield 0.8;
      Sound.play('crane');
      for (const p of M.prn) if (p.st !== 'wreck' && p.isl < 2) { p.st = 'print'; p.t = 0.6; }
      const top = RM + SCAN_H; while (sc.bot > top) { sc.bot = Math.max(top, sc.bot - 160 * D); yield D; }
      const dg = M.robots.find(r => r.wake); if (dg) { M.robots = M.robots.filter(r => r !== dg); const f = new (F().RDog)(M, dg.x, GY, { wake: 1 }); f.dir = -1; P.foes.push(f); Sound.play('zap'); }
      Sound.play('clank'); yield 0.5; M.camT = null;
    };
    M.cutUpdate = (dt, P) => { P.t += dt; for (const p of M.prn) p.t += dt; for (const v of M.vent) { v.t += dt * v.sp; if (v.t > 1.3) v.t = rnd(-4, -1); } if (M.camT != null) P.cam.x += (M.camT - P.cam.x) * Math.min(1, dt * 2.5); else P.camera(dt); P.updFx(dt); };

    // ---------- отрисовка: 4 слоя параллакса + анимация (пар из труб, кипящие чаны, капсулы на конвейере) ----------
    const T = () => L9.PARTS.lab.t;
    const lay = (X, Y, k, cx, cy) => [320 + (X - (cx + 320)) * k, 180 + (Y - (cy + 180)) * k];
    // слой-лента: повтор по x; v0..v1 — какая часть картинки по высоте берётся; низ куска на высоте Ybot мира (в своей глубине k)
    const tileX = (c, n, w, h, X, Ybot, k, cx, cy, v0 = 0, v1 = 1) => {
      const im = L9.img[n]; if (!im) return; const [x, y] = lay(X, Ybot, k, cx, cy), hh = h * (v1 - v0); if (y < 0 || y - hh > 360) return;
      for (let xx = ((x % w) + w) % w - w; xx < 640; xx += w) c.drawImage(im, 0, im.height * v0, im.width, im.height * (v1 - v0), Math.floor(xx), Math.round(y - hh), Math.ceil(w) + 1, hh);
      return [x, y];
    };
    const haze = (c, a) => { c.fillStyle = 'rgba(3,8,12,' + a + ')'; c.fillRect(0, 0, 640, 360); };
    // фон разнесён по высоте, чтобы планы не лезли друг на друга: верх — дальняя пещера и трубы с потолка, середина — пещера и конвейер с капсулами вдали, низ — чаны/цистерны и трубы у пола
    M.drawBack = (c, cx, cy) => {
      c.fillStyle = '#03070a'; c.fillRect(0, 0, 640, 360);
      const t = T();
      // 1) дальний зал пещеры: цистерны, чаны, капсулы на конвейерах
      const fim = L9.img.saFar; if (fim) { const w = 880, h = fim.height * w / fim.width, [x, y] = lay(640, 560, 0.15, cx, cy); c.drawImage(fim, Math.round(x - w / 2), Math.round(y - h / 2), w, h); }
      haze(c, 0.12);
      // 2) вдали по середине пещеры — конвейер, по нему едут капсулы с телами
      { const ry = 470, k = 0.3, [, sy] = lay(0, ry, k, cx, cy), rim = L9.img.saRail;
        if (sy > -40 && sy < 420) {
          if (rim) { const rh = 7, rw = rim.width * rh / rim.height; for (let xx = -((cx * k) % rw) - rw; xx < 640; xx += rw) c.drawImage(rim, Math.floor(xx), Math.round(sy - rh / 2), Math.ceil(rw) + 1, rh); }
          for (let i = 0; i < 8; i++) { const X = ((i * 240 + t * 22) % 1920 + 1920) % 1920 - 300, [px, py] = lay(X, ry, k, cx, cy); if (px > -40 && px < 680) S(c, 'vatA9', 'c' + ((t * 3 + i | 0) % 4), px, py + 55, 0.3, { a: 0.7 }); }
        } }
      haze(c, 0.14);
      // 3) низ: ряд чанов, капсул и шаровых цистерн (средний план)
      tileX(c, 'saMid', 600, 335, 0, 1100, 0.42, cx, cy);
      haze(c, 0.22);
      // 4) кипящие чаны перед ними
      for (const [X, ph] of [[150, 0], [560, 1.3], [1010, 2.1]]) { const [px, py] = lay(X, 1050, 0.58, cx, cy); if (px > -120 && px < 760 && py > -20 && py < 460) S(c, 'vatA9', 'v' + ((t * 6 + ph * 3 | 0) % 4), px, py, 0.5); }
      // 5) ближе: трубы у пола (нижняя часть кадра) — из сопел под давлением бьёт пар; трубы, свисающие с потолка (верх кадра)
      const pw = 690, ph = 385, r = tileX(c, 'saPipe', pw, ph, 0, 1060, 0.72, cx, cy, 0.6, 1);
      if (r) { const [x0, yb] = r;
        for (let n = -1; n < 3; n++) for (const [fx, fy, vi] of [[0.106, 0.69, 0], [0.464, 0.69, 1]]) {
          const v = M.vent[(vi + (n & 1) * 2) % M.vent.length]; if (v.t < 0) continue;
          const px = ((x0 % pw) + pw) % pw - pw + n * pw + fx * pw, py = yb - ph + fy * ph; if (px < -60 || px > 700) continue;
          S(c, 'steam9', 's' + Math.min(7, v.t / 1.3 * 8 | 0), px, py - 26, 0.55, { a: 0.7 }); } }
      tileX(c, 'saPipe', pw, ph, 345, 230, 0.72, cx, cy, 0, 0.3);
      haze(c, 0.12);
    };
    // ближний план (быстрее мира): сталактиты у потолка, скальные колонны у стен, камни у пола — части кадра saNear
    M.drawOver = (c, cx, cy) => {
      const im = L9.img.saNear; if (!im) return; const iw = im.width, ih = im.height, k = 1.3;
      const part = (sx, sy, sw, sh, X, Y, w, ax, ay) => { const h = sh * w / sw, [x, y] = lay(X, Y, k, cx, cy), dx = x - ax * w, dy = y - ay * h; if (dx > 640 || dx + w < 0 || dy > 360 || dy + h < 0) return; c.drawImage(im, sx, sy, sw, sh, Math.round(dx), Math.round(dy), Math.round(w), Math.round(h)); };
      for (let X = -200; X < W + 400; X += 520) part(iw * 0.18, 0, iw * 0.64, ih * 0.3, X, 150, 540, 0.5, 0.25);     // сталактиты
      part(0, 0, iw * 0.2, ih, -30, 560, 150, 0.5, 0.5); part(iw * 0.8, 0, iw * 0.2, ih, W + 30, 560, 150, 0.5, 0.5);     // колонны у стен
      for (let X = 100; X < W; X += 560) part(iw * 0.25, ih * 0.8, iw * 0.5, ih * 0.2, X, 1010, 420, 0.5, 1);     // камни у пола
    };
    const isl = (c, s) => { const [fw, fh] = L9.size('isl9', s.fr), k = s.w / fw * 1.04; S(c, 'isl9', s.fr, s.x + s.w / 2, s.y - 6 + fh * k * 0.6, k, { sy: 0.6 }); };
    M.drawMid = (c, P) => {
      const x0 = P.cam.x - 200, x1 = P.cam.x + 840, y0 = P.cam.y - 200, y1 = P.cam.y + 560, vis = (x, y) => x > x0 && x < x1 && y > y0 && y < y1, t = P.t;
      // потолок пещеры
      const ce = L9.img.saCeil; if (ce) { const h = 110, w = ce.width * h / ce.height; for (let x = Math.floor(x0 / w) * w; x < x1; x += w) c.drawImage(ce, Math.floor(x), 40, Math.ceil(w) + 1, h); }
      // мастерская Сани (внизу по центру): телевизоры и люк — в финале с Иксом и открытым ходом
      const on = M.tv > 0.6 || (M.tv > 0 && (t * 14 | 0) % 2);
      S(c, 'ws9', on ? 'on' : 'off', WS_X, GY + 4, 0.62);
      // пол
      const fl = L9.img.saFloor; if (fl) { const h = 86, w = fl.width * h / fl.height; for (let x = Math.floor(x0 / w) * w; x < x1; x += w) c.drawImage(fl, Math.floor(x), GY - 9, Math.ceil(w) + 1, h); }
      // рельс под потолком
      const rl = L9.img.saRail; if (rl) { const h = 30, w = rl.width * h / rl.height;
        for (const e of RE) { c.save(); c.translate(e.A[0], e.A[1]); if (e.vert) c.rotate(Math.PI / 2); for (let x = -h / 2; x < e.len + h / 2; x += w) c.drawImage(rl, 0, 0, Math.min(1, (e.len + h / 2 - x) / w) * rl.width, rl.height, Math.floor(x), -h / 2, Math.min(Math.ceil(w) + 1, e.len + h / 2 - x), h); c.restore(); } }
      // стойка потолочного аккумулятора
      const b0 = M.bats.find(b => b.ceil); if (b0 && rl) { const h = 14, len = b0.y - 120; c.save(); c.translate(b0.x, 120); c.rotate(Math.PI / 2); c.drawImage(rl, 0, 0, rl.width * 0.3, rl.height, 0, -h / 2, len - 20, h); c.restore(); }
      // острова, лестницы
      for (const s of ISL) if (s.x < x1 && s.x + s.w > x0) isl(c, s);
      for (const l of M.ladders) { const [, lh] = L9.size('plat9', 'ladder'); for (let y = l[2]; y > l[1] + lh * 0.5; y -= lh - 2) S(c, 'plat9', 'ladder', l[0], y + 4, 1); S(c, 'plat9', 'ladderTop', l[0], l[1] + 4, 1); }
      // аккумуляторы
      for (const b of M.bats) if (vis(b.x, b.y)) { const fr = b.hp <= 0 ? 'dead' : b.hp <= BAT_HP / 2 ? 'hit' : 'on';
        S(c, 'bat9', fr, b.x, b.y, 1, { rot: b.ceil ? 0 : b.x < W / 2 ? 0 : 0, flip: b.x > W / 2 });
        if (b.hp > 0) S(c, 'fxL9', 'spark', b.x, b.y, 0.5 + Math.sin(t * 6 + b.i) * 0.1, { add: 1, a: 0.35 });
        if (b.fl > 0) { b.fl -= 0.016; S(c, 'bat9', fr, b.x, b.y, 1, { add: 1, a: 0.5, flip: b.x > W / 2 }); } }
      // принтеры
      for (const p of M.prn) if (vis(p.x, p.y)) {
        S(c, 'prn9', p.st === 'wreck' ? 'wreck' : p.st === 'print' ? 'print' : p.st === 'out' ? 'out' : 'idle', p.x, p.y + 2, 0.72);
        if (p.st === 'print') S(c, 'fxL9', 'spark', p.x + rnd(-14, 14), p.y - 95 + (p.t * 40 % 65), 0.45, { add: 1 });
        if (p.st === 'wreck' && (t * 8 | 0) % 3 === 0) S(c, 'fxA9', (t * 10 | 0) % 2 ? 'fire0' : 'fire1', p.x + 8, p.y - 24, 0.7, { add: 1, a: 0.6 });
      }
      for (const r of M.robots) { S(c, 'props8', 'shadow', r.x, GY + 1, 1.2, { a: 0.4 }); S(c, 'robo9', r.fr, r.x, GY + 2, 0.8); }
      const s = M.san; if (!s.gone) { S(c, 'props8', 'shadow', s.x, GY + 1, 0.4, { a: 0.5 }); S(c, 'san9', s.fr, s.x, GY + 1, 1, { flip: s.dir < 0 }); }
      // ток: предупреждение (искры по поверхности), молния из сканера, поверхность под током
      const z = M.zap;
      if (z) { const [aw] = L9.size('afx9', 'arc'), n = Math.max(1, Math.round((z.x1 - z.x0) / (aw * 0.6)));
        if (z.st === 'warn') { for (let i = 0; i < n; i++) if (((t * 20 | 0) + i) % 3 === 0) S(c, 'afx9', 'arc', z.x0 + (i + 0.5) * (z.x1 - z.x0) / n, z.y - 4, 0.45, { add: 1, a: 0.5 }); }
        else if (z.st === 'bolt') { const sc = M.scan, [, bh] = L9.size('afx9', 'bolt0'), len = z.y - sc.bot; S(c, 'afx9', 'bolt' + ((t * 30 | 0) % 3), (sc.x + z.bx) / 2, sc.bot + len / 2, 1, { add: 1, sy: len / bh, rot: Math.atan2(z.bx - sc.x, len) * -1 }); }
        else for (let i = 0; i < n; i++) S(c, 'afx9', 'arc', z.x0 + (i + 0.5) * (z.x1 - z.x0) / n, z.y - 6 + ((t * 25 + i) % 2), 0.6, { add: 1, flip: ((t * 12 | 0) + i) % 2 }); }
      const sc = M.scan; if (vis(sc.x, sc.bot)) S(c, 'scan9', sc.fr, sc.x, sc.bot, 1);
      for (const k of M.picks) { if (!vis(k.x, k.y)) continue; const bob = Math.sin(k.t * 4) * 2;
        if (k.kind === 'pelmeni' || k.kind === 'kefir') { Art.item(c, k.kind, k.x, k.y - 14 + bob, 0, 1); continue; }
        S(c, 'fxL9', 'spark', k.x, k.y - 14, 0.4 + Math.sin(k.t * 5) * 0.08, { add: 1 }); S(c, 'pick9', k.kind, k.x, k.y - 16 + bob, 1); }
    };
    M.drawFront = (c, P) => { if (P.web > 0) S(c, 'afx9', P.web > 0.45 ? 'cocoon' : 'cocoonT', P.x, P.y - 42, 1, { add: 1, a: 0.9 }); };
    M.drawHud = (c, P) => { if (M.fight && !M.fin) G.text('АККУМУЛЯТОРЫ: ' + (BATS.length - M.left()) + ' / ' + BATS.length, 320, 30, { align: 'center', size: 8, color: '#7fe0c0', outline: true }); };
    return M;
  };
})();
