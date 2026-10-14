'use strict';
// ============ Ур.7 v4: общий «прогон» по картам — стелс, драки, укрытия, переходы, мини-игры, лифт ============
// Карты описаны в level7v4maps.js (V4.MAPS[id](run) -> D). Катсцены — level7v4scenes.js.

// ---------- Валера: на четвереньках (ползком) + лай, вход/выход из будок ----------
V4.Player = class extends L7.Player {
  constructor(x, y) { super(x, y); this.barkT = 0; this.barkAnim = 0; this.seq = null; this.crawlSpeed = 58; }
  update(dt, world) {
    const run = world.run, I = G.Input;
    if (this.barkT > 0) this.barkT -= dt;
    if (run.level.scene || run.hidePlayer || !this.controls) { this.idleT = 0; this.idle = null; }   // в катсценах без кривляний
    if (this.seq) return this.updateSeq(dt, run, I);
    if (this.auto) {   // движение по ломаной (подъём по лестнице и т.п.)
      const a = this.auto, p = a.path[a.i], dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy), st = a.sp * dt;
      this.onFlight = !!p.flight; this.clipY = a.clipY; this.vx = 0; this.vy = 0; this.onGround = true; this.setAnim(p.anim || a.anim || 'walk'); this.animT += dt;
      if (Math.abs(dx) > 0.5 && !(p.anim || a.anim)) this.facing = Math.sign(dx);
      if (d <= st) { this.x = p.x; this.y = p.y; if (++a.i >= a.path.length) { this.auto = null; if (!a.keepClip) this.clipY = null; if (a.done) a.done(); } }
      else { this.x += dx / d * st; this.y += dy / d * st; }
      return;
    }
    const P = run.D.path;
    if (!P) return super.update(dt, world);
    // вертикальная карта: Валера сам идёт по отрезкам (площадки и марши лестниц), без переходов. Отрезок: { a: [x, y], b: [x, y] } (a левее b),
    // L / R — номер соседнего отрезка за левым / правым концом (или функция run => номер). Пол под ним — подвижная платформа на высоте отрезка.
    if (this.seg == null) this.seg = 0;
    const fp = run.D.floorPlat, x0 = this.x; fp.y = this.y; if (this.onGround) this.vy = 0;
    super.update(dt, world);
    let nx = this.x;
    for (let guard = 0; guard < 4; guard++) {
      const s = P[this.seg], side = nx < s.a[0] ? 'L' : nx > s.b[0] ? 'R' : null; if (!side) break;
      let nb = s[side]; if (typeof nb === 'function') nb = nb(run);
      if (nb == null) { nx = side === 'L' ? s.a[0] : s.b[0]; break; }
      this.prevSeg = this.seg; this.seg = nb;
    }
    this.x = nx;
    { const s = P[this.seg], k = (this.x - s.a[0]) / Math.max(1, s.b[0] - s.a[0]), gy = s.a[1] + (s.b[1] - s.a[1]) * k;
      this.onFlight = s.a[1] !== s.b[1]; if (this.onGround || this.y > gy) { this.y = gy; this.vy = 0; this.onGround = true; } fp.y = gy; }
  }
  // вход в будку/туалет/шкаф: дверь открылась -> протиснулся -> дверь закрылась; выход — наоборот
  updateSeq(dt, run, I) {
    const q = this.seq, h = q.h; q.t += dt; this.animT += dt; this.vx = 0; this.vy = 0;
    if (h.a3) {   // дверь/шкаф по кадрам: открылась -> Валера заходит вглубь (уменьшается и темнеет) -> стоит в тени; выход — наоборот
      if (q.phase === 'in') {
        h.fr = q.t < 0.12 ? 1 : 2;
        if (q.t < 0.24) this.setAnim('stand');
        else { const k = Math.min(1, (q.t - 0.24) / 0.6); this.setAnim('walk'); this.facing = Math.sign(h.x - this.x) || this.facing; this.x = U.approach(this.x, h.x, 80 * dt); this.depthK = k;
          if (k >= 1) { q.phase = 'hid'; q.t = 0; this.x = h.x; this.facing = 1; this.setAnim('stand'); this.hidden = { kind: 'booth', h, t: 0, blown: run.susp > 0.55 }; } }
      } else if (q.phase === 'hid') {
        this.hidden.t += dt; this.depthK = 1; this.setAnim('stand');
        if (this.controls && q.t > 0.3 && (I.pressed('up') || I.pressed('down') || I.pressed('jump') || I.pressed('left') || I.pressed('right'))) { q.phase = 'out'; q.t = 0; this.facing = I.held('left') ? -1 : 1; this.hidden = null; }
      } else { const k = Math.min(1, q.t / 0.36); this.depthK = 1 - k; if (k < 1) this.setAnim('walk'); else { this.setAnim('stand'); h.fr = q.t < 0.48 ? 1 : 0; if (q.t >= 0.6) { h.fr = 0; this.seq = null; this.depthK = 0; Sound.play('door'); } } }
      return;
    }
    if (q.phase === 'in') { h.open = true; this.setAnim('squeeze4'); this.x = U.approach(this.x, h.x, 60 * dt); if (q.t > 0.55) { q.phase = 'hid'; q.t = 0; h.open = false; Sound.play('door'); this.hidden = { kind: 'booth', h, t: 0, blown: run.susp > 0.55 }; } }
    else if (q.phase === 'hid') {
      this.hidden.t += dt;
      if (this.controls && q.t > 0.3 && (I.pressed('up') || I.pressed('down') || I.pressed('jump') || I.pressed('left') || I.pressed('right'))) { q.phase = 'out'; q.t = 0; h.open = true; Sound.play('door'); this.facing = I.held('left') ? -1 : 1; }
    } else if (q.phase === 'out') { this.hidden = null; this.setAnim('squeeze4'); this.x += this.facing * 50 * dt; if (q.t > 0.45) { h.open = false; this.seq = null; this.setAnim('stand'); } }
  }
  attackUpdate(dt, world, ctl, I) {
    if (ctl && this.crouch && I.pressed('throw')) {   // лай на четвереньках
      this.barkT = 3.2; this.barkAnim = 0.45; Sound.play('bark'); G.say(this, U.choice(['ГАВ!', 'ГАВ-ГАВ!', 'Р-р-р... ГАВ!']), 0.9);
      world.run.noise(this.x, this.y, 110, 'bark'); return;
    }
    if (ctl && I.pressed('throw') && !world.run.D.throws) return;   // гаек/костей в v4 нет
    super.attackUpdate(dt, world, ctl, I);
  }
  choosePose(dt) {
    if (this.barkAnim > 0) { this.barkAnim -= dt; return this.setAnim('bark4'); }
    super.choosePose(dt);
  }
  drawOpts() { return this.anim === 'crouch' || this.anim === 'sneak' ? { scale: 0.84 } : {}; }   // на четвереньках — в тех же пропорциях, что и стоя
  draw(c, camX, camY) {
    if (this.depthK > 0) { const k = this.depthK, x = this.x - camX, y = this.y - (camY || 0) - 9 * k, o = { scale: 1 - 0.15 * k };   // в проёме: глубже, мельче, темнее
      Spr.drawAnim(c, this.animSet, this.anim, this.animT, x, y, this.facing, o); Spr.drawAnim(c, this.animSet, this.anim, this.animT, x, y, this.facing, { scale: o.scale, flash: '#05080a', alpha: 0.82 * k }); return; }
    if (this.seq && this.seq.phase === 'hid') return;   // внутри — не видно
    if (this.clipY != null) { const y = this.clipY; this.clipY = null; c.save(); c.beginPath(); c.rect(0, -2000, W, y - (camY || 0) + 2000); c.clip(); this.draw(c, camX, camY); c.restore(); this.clipY = y; return; }   // уходит в люк
    if (this.hidden && this.hidden.kind === 'cover') { super.draw(c, camX, camY); return; }
    Game.Player.prototype.draw.call(this, c, camX, camY);
  }
};

// ---------- камера: pole=true — простой столб с камерой (props4 13) вместо отдельной камеры ----------
V4.Cam = class extends L7.Cam {
  constructor(o) { super(o); this.pole = o.pole; }
  draw(c, cx, cy, run) {
    if (!this.pole) return super.draw(c, cx, cy, run);
    const x = this.x - cx, y = this.y - cy, off = this.off(run); if (x < -300 || x > W + 300) return;
    // прежняя камера (props4 13: тонкий столб слева x 0..23, камера на кронштейне справа). Столб стоит неподвижно и доходит до земли
    // (нижний пролёт столба повторяется), разворачивается только камера с кронштейном — зеркалится вокруг оси столба
    const sh = Spr.sheets.props4, f = sh && sh.f[13], base = this.floorY + 4, left = Math.cos(this.a) < 0, top = y - 22;
    if (f) {
      const im = sh.img, px = x - 5.5;
      c.drawImage(im, f[0], f[1], 23, 220, px, top, 11.5, 110);
      for (let yy = top + 110; yy < base; yy += 50) { const h = Math.min(50, base - yy); c.drawImage(im, f[0], f[1] + 110, 23, h * 2, px, yy, 11.5, h); }
      c.save(); c.translate(x, top); if (left) c.scale(-1, 1); c.drawImage(im, f[0] + 23, f[1], 101, 106, 6, 0, 50.5, 53); c.restore();
    }
    if (!off) {
      const g = c.createRadialGradient(x, y, 4, x, y, this.range), col = this.see > 0.05 ? '255,60,40' : '255,230,120';
      g.addColorStop(0, `rgba(${col},0.30)`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.arc(x, y, this.range, this.a - this.half, this.a + this.half); c.closePath(); c.fill();
    }
  }
};

// ---------- собака: ползущего и лающего Валеру принимает за своего ----------
V4.Dog = class extends L7.Dog {
  // Валеру на четвереньках собака НЕ замечает (принимает за своего); залаял рядом — отвечает. Заметит только стоящего/идущего в рост.
  sees(run, pl) {
    if (pl.crouch && !pl.dead) {
      if (pl.barkT > 0 && Math.abs(pl.x - this.x) < this.range + 40 && !(this.friendT > 0)) { this.friendT = 2.5; G.say(this, U.choice(['Гав?', 'Р-р... гав.', 'Уф! Свой.']), 1.2); }
      return 0;
    }
    return super.sees(run, pl);
  }
  update(dt, run) { if (this.friendT > 0) this.friendT -= dt; super.update(dt, run); }
};

// ---------- лазер: излучатель из Flow сверху, луч — свет ----------
V4.Laser = class extends L7.Laser {
  draw(c, cx, cy, run) {
    const on = this.on(run), x = this.x - cx; if (x < -40 || x > W + 40) return;
    if (on) { const fl = 0.7 + Math.sin(G.t * 40) * 0.3; c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,30,30,${0.35 * fl})`; c.fillRect(x - 2, this.y0 - cy, 5, this.y1 - this.y0); c.fillStyle = '#ff6060'; c.fillRect(x, this.y0 - cy, 1, this.y1 - this.y0); c.restore(); }
    else if (this.blink && !(this.group && run.flags[this.group] > 0)) { const left = this.blink[0] + this.blink[1] - this.t % (this.blink[0] + this.blink[1]); if (left < 0.5 && (G.t * 18 | 0) % 2) { c.fillStyle = 'rgba(255,90,90,0.45)'; c.fillRect(x, this.y0 - cy, 1, this.y1 - this.y0); } }   // вот-вот включится
    if (this.v5 && V4.img.pr_las_top) { const P = window.V4_PROPS, off = on ? '' : '_off', t = P.las_top, b = P.las_bot;   // излучатели из Flow: на потолке смотрит вниз, на полу — вверх
      c.drawImage(V4.img['pr_las_top' + off], Math.round(x - t[0] / 2), this.y0 - cy, t[0], t[1]); c.drawImage(V4.img['pr_las_bot' + off], Math.round(x - b[0] / 2), this.y1 - cy - b[1], b[0], b[1]); return; }
    Spr.draw(c, 'inp4', 5, x, this.y0 - cy + 4, 1);
    Spr.draw(c, 'inp4', 6, x, this.y1 - cy + 8, 1, { scale: 0.8 });
  }
};

// ---------- драчуны канализации: крысы и бомжи/алкаши/гопники ур.2 ----------
V4.Brawler = class {
  constructor(o) {
    Object.assign(this, { x: o.x, y: V4.GY, kind: o.kind, x1: o.x1 != null ? o.x1 : o.x - 140, x2: o.x2 != null ? o.x2 : o.x + 140 });
    this.rat = this.kind === 'rat'; this.hp = this.rat ? 2 : 4; this.facing = -1; this.state = 'walk'; this.anim = 'walk'; this.animT = Math.random(); this.inv = 0; this.atkT = U.rand(1, 1.8); this.t = 0; this.dead = false; this.voice = 160;
    this.set = { rat: 'rat4', bomzh: 'bomzh4', alk: 'alk4', gop: 'gop4' }[this.kind];
    this.lines = { rat: ['Пи-пи!'], bomzh: ['Моё место!', 'Подай на хлебушек!', 'Это наша труба!'], alk: ['Полундра!', 'Ик! Ты кто?', 'Тут наш кубрик!'], gop: ['Э, слышь!', 'Ты с какого района?', 'Семки есть?'] }[this.kind];
  }
  get box() { return this.rat ? { x: this.x - 16, y: this.y - 24, w: 32, h: 24 } : { x: this.x - 14, y: this.y - 76, w: 28, h: 76 }; }
  hit(dmg, dir) {
    if (this.inv > 0 || this.state === 'ko') return false;
    this.hp -= dmg; this.inv = 0.3; this.x += dir * 14; Sound.play(this.rat ? 'squeak' : 'hurt');
    if (this.hp <= 0) { this.state = 'ko'; this.anim = 'ko'; this.t = 0; return true; }
    this.state = 'hurt'; this.t = 0.3; return false;
  }
  update(dt, run, pl) {
    this.animT += dt; if (this.inv > 0) this.inv -= dt;
    if (this.state === 'ko') { this.t += dt; if (this.t > 1.6) this.dead = true; return; }
    if (this.state === 'hurt') { this.anim = 'hurt'; this.t -= dt; if (this.t <= 0) this.state = 'walk'; return; }
    const d = pl.x - this.x;
    if (Math.abs(d) < 240 && !pl.dead && !run.caught) {
      if (!this.said && !this.rat) { this.said = true; G.say(this, U.choice(this.lines), 1.4); }
      this.facing = Math.sign(d) || 1;
      if (Math.abs(d) > (this.rat ? 24 : 36)) { this.anim = 'walk'; this.x += this.facing * (this.rat ? 110 : 58) * dt; }
      else { this.atkT -= dt; this.anim = this.atkT < 0.35 ? 'attack' : 'stand'; if (this.atkT <= 0) { this.atkT = U.rand(1.1, 1.8); if (U.overlap(this.box, pl.box)) pl.hurt(this.rat ? 5 : 8, this.x, run.world); Sound.play(this.rat ? 'squeak' : 'punch'); } }
    } else { this.anim = 'walk'; this.x += this.facing * (this.rat ? 40 : 26) * dt; if (this.x < this.x1) this.facing = 1; if (this.x > this.x2) this.facing = -1; }
  }
  draw(c, cx, cy) {
    if (this.state === 'ko' && this.t > 1 && (G.t * 10 | 0) % 2) return;
    Spr.drawAnim(c, this.set, this.anim, this.animT, this.x - cx, this.y - cy, this.facing, { flash: this.inv > 0.15 ? '#fff' : null });
  }
};

// ---------- мини-игры: старые (провода/тумблеры/код) + домофон; фон — крупный план из Flow ----------
V4.MG = class extends L7.MG {
  constructor(kind, run) {
    super(kind === 'bell' ? 'code' : kind, run); this.kind = kind;
    if (kind === 'bell') { this.seq = Array.from({ length: 4 }, () => U.randi(0, 2)); this.inp = []; this.show = 0; this.showT = 0.8; this.sel = 0; }
  }
  update(dt, I) {
    if (this.kind !== 'bell') return super.update(dt, I);
    this.t += dt; if (this.msgT > 0) this.msgT -= dt;
    if (this.done) { this.done -= dt; return this.done <= 0 ? 'ok' : null; }
    if (I.pressed('throw') || I.pressed('pause')) { I.hit.pause = false; return 'quit'; }
    if (this.show === 0 && !this.p0) { this.p0 = true; Sound.play('blip', 500 + this.seq[0] * 200); }
    if (this.show < this.seq.length) { this.showT -= dt; if (this.showT <= 0) { this.show++; this.showT = 0.75; if (this.show < this.seq.length) Sound.play('blip', 500 + this.seq[this.show] * 200); } return null; }
    if (I.pressed('up')) this.sel = (this.sel + 2) % 3;
    if (I.pressed('down')) this.sel = (this.sel + 1) % 3;
    if (I.pressed('jump') || I.pressed('punch')) {
      Sound.play('blip', 500 + this.sel * 200); this.inp.push(this.sel);
      const k = this.inp.length - 1;
      if (this.inp[k] !== this.seq[k]) { this.say('НЕВЕРНО! СЛУШАЙ ЕЩЁ РАЗ', 1.4); Sound.play('warn'); this.inp = []; this.show = 0; this.showT = 1.2; this.p0 = false; }
      else if (this.inp.length === this.seq.length) { this.say('ЗАМОК ЩЁЛКНУЛ!'); Sound.play('lever'); this.done = 1; }
    }
    return null;
  }
  // «провода»: вся графика — картинки Flow (tools/l7v4_mg.py): коробка, клеммы с проводом слева, гнёзда справа, провод, перчатка-указатель
  // пульт лазерной защиты: панель из Flow (mgl_a — всё выключено, mgl_b — всё включено; горящие трубки, лампы и поднятые рычаги берутся кусками из mgl_b)
  drawLasers(c) {
    const A = V4.img.mgl_a, B = V4.img.mgl_b, k = 430 / 1376, px = 105, py = 62, ph = 768 * k, CX = [226, 536, 840, 1149];
    const part = (sx, sy, sw, sh, dx) => c.drawImage(B, sx, sy, sw, sh, px + dx * k, py + sy * k, sw * k, sh * k);
    c.fillStyle = 'rgba(0,0,0,0.72)'; c.fillRect(0, 0, W, H);
    c.drawImage(A, px, py, 430, ph);
    G.text('ПУЛЬТ ЛАЗЕРНОЙ ЗАЩИТЫ', W / 2, py - 18, { align: 'center', color: '#ffd84a', outline: true });
    for (let i = 0; i < 4; i++) {
      const x = CX[i];
      if (this.beam[i] && B) part(x - 70, 100, 140, 250, x - 70);                                  // трубка с лучом
      if (this.sw[i] && B) { part(x - 32, 432, 64, 64, x - 32); part(840 - 46, 488, 92, 128, x - 46); }   // зелёная лампа и рычаг вверх
      const sx = px + x * k, on = this.beam[i];
      G.text('Л' + (i + 1), sx, py + 384 * k, { align: 'center', size: 8, color: on ? '#ff9a8a' : '#c8ccd2', outline: true });
      G.text(this.map[i].map(b => 'Л' + (b + 1)).join('+'), sx, py + 660 * k, { align: 'center', size: 8, color: '#ffe9a8', outline: true });
      if (this.sel === i) { const y0 = py + 425 * k, s = 78 * k, t = 0.6 + 0.4 * Math.sin(this.t * 8); c.strokeStyle = `rgba(255,216,74,${t})`; c.lineWidth = 2; c.strokeRect(Math.round(sx - s) + 0.5, Math.round(y0) + 0.5, Math.round(s * 2), Math.round(205 * k)); }
    }
    G.text('СХЕМА: тумблер переключает два луча', W / 2, py + ph + 8, { align: 'center', size: 8, color: '#c8ccd2', outline: true });
    G.text(Game.fmtHint('Стрелки — выбор, {jump} — щёлкнуть. Погаси все лучи.'), W / 2, py + ph + 22, { align: 'center', size: 8, color: '#9aa0a8', outline: true });
    if (this.msgT > 0) G.text(this.msg, W / 2, py + ph / 2 - 4, { align: 'center', color: '#8cf08c', outline: true });
  }
  drawWires(c) {
    const I = V4.img, px = 105, py = 62, pw = 430, ph = 240, lx = px + 118, rx = px + pw - 104, row = i => py + 62 + i * 58;
    const P = (im, x, y, k) => { if (im) c.drawImage(im, x - im.width * k / 2, y - im.height * k / 2, im.width * k, im.height * k); };
    c.fillStyle = 'rgba(0,0,0,0.72)'; c.fillRect(0, 0, W, H);
    c.drawImage(I.mgw_panel, px, py, pw, ph);
    G.text(this.title || 'ЩИТОК КАМЕР НАБЛЮДЕНИЯ', W / 2, py - 18, { align: 'center', color: '#ffd84a', outline: true });
    for (let i = 0; i < 3; i++) {   // сначала провода (под клеммами и гнёздами)
      if (this.link[i] < 0) continue;
      const w = I['mgw_wire' + i], x0 = lx + 22, y0 = row(i) + 4, x1 = rx - 10, y1 = row(this.link[i]), d = Math.hypot(x1 - x0, y1 - y0);
      if (w) { c.save(); c.translate(x0, y0); c.rotate(Math.atan2(y1 - y0, x1 - x0)); c.drawImage(w, 0, -5, d, 10); c.restore(); }
    }
    for (let i = 0; i < 3; i++) {
      const y = row(i);
      P(I['mgw_plug' + i], lx, y, 0.2); P(I['mgw_sock' + this.right[i]], rx, y, 0.2);
      if (this.link[i] >= 0) P(I.mgw_lamp, lx - 4, y - 24, 0.1);
      if (this.link.includes(i)) P(I.mgw_lamp, rx, y - 24, 0.1);
      if (this.pick === i && this.stage === 'R') P(I.mgw_lamp, lx - 4, y - 24, 0.1 + 0.02 * Math.sin(this.t * 10));
    }
    const hx = (this.stage === 'L' ? lx - 62 : rx - 46) + Math.sin(this.t * 7) * 2.5;
    if (!this.done) P(I.mgw_hand, hx, row(this.stage === 'L' ? this.sel : this.rsel) + 2, 0.17);
    if (this.msgT > 0 && !this.done && /БЗЗ|ТОКОМ/.test(this.msg)) P(I.mgw_spark, rx, row(this.rsel), 0.26 + 0.05 * Math.sin(this.t * 40));
    G.text(Game.fmtHint(this.stage === 'L' ? 'Провод слева {up}/{down}, {jump} — взять' : 'Куда подключить? {up}/{down}, {jump}'), W / 2, py + ph + 10, { align: 'center', size: 8, color: '#c8d0d8', outline: true });
    G.text(Game.fmtHint('{throw} — отойти'), W / 2, py + ph + 24, { align: 'center', size: 8, color: '#9aa0a8', outline: true });
    if (this.msgT > 0) G.text(this.msg, W / 2, py + 22, { align: 'center', color: this.done ? '#8cf08c' : '#ff8a6a', outline: true });
  }
  draw(c) {
    if (this.kind === 'wires' && V4.img.mgw_panel) return this.drawWires(c);
    if (this.kind === 'lasers' && V4.img.mgl_a) return this.drawLasers(c);
    const img = V4.img[{ wires: 'mg0', lasers: 'mg0', code: 'mg2', bell: 'mg1' }[this.kind]];
    c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 0, W, H);
    if (img) { c.globalAlpha = 0.9; c.drawImage(img, W / 2 - 150, 18, 300, 324); c.globalAlpha = 1; }
    if (this.kind !== 'bell') return super.draw(c);
    const R = Art.R, bx = W / 2 - 120, by = 90;
    R(c, bx, by, 240, 170, 'rgba(20,18,12,0.82)');
    G.text('ДОМОФОН НА КРЫШУ: повтори мелодию', W / 2, by + 10, { align: 'center', size: 8, color: '#ffd84a' });
    for (let i = 0; i < 3; i++) {
      const lit = (this.show < this.seq.length && this.seq[this.show] === i && this.showT > 0.3) || (this.show >= this.seq.length && this.sel === i);
      R(c, W / 2 - 30, by + 34 + i * 34, 60, 26, lit ? '#ffd84a' : '#5a4a20'); G.text(['ДЗЫНЬ', 'ДИНЬ', 'ДОН'][i], W / 2, by + 42 + i * 34, { align: 'center', size: 8, color: lit ? '#111' : '#d8c890' });
    }
    G.text(this.show < this.seq.length ? 'Слушай...' : Game.fmtHint('{up}/{down} — кнопка, {jump} — нажать  (' + this.inp.length + '/' + this.seq.length + ')'), W / 2, by + 146, { align: 'center', size: 8, color: '#c8d0d8' });
    if (this.msgT > 0) G.text(this.msg, W / 2, by + 160, { align: 'center', color: this.done ? '#8cf08c' : '#ff8a6a', outline: true });
  }
};

// ---------- прогон по карте ----------
V4.Run = class {
  constructor(level) {
    this.level = level; this.t = 0; this.fade = 1; this.storm = new V4.Storm(); this.flags = {}; this.ko = new Set(); this.code = String(U.randi(1000, 9999));
    this.susp = 0; this.caught = null; this.mg = null; this.trans = null; this.menu = null; this.hint = null; this.hintA = 0; this.items = [];
  }
  get outside() { return !!(this.D && this.D.rain); }
  // ---------- загрузка карты ----------
  load(id, x, face = 1) {
    const D = this.D = V4.MAPS[id](this); D.id = id; this.mapId = id;
    const wd = this.world = new Game.World(D.w, 1200);
    wd.run = this; wd.stats = this.level.stats; wd.score = this.level.score; wd.addScore = n => { wd.score += n; this.level.score = wd.score; };
    wd.playerAttack = (hb, dmg, atk, pl) => this.playerAttack(hb, dmg, atk, pl); wd.spawnPlayerProj = () => {};
    wd.addPlat({ x: -400, y: V4.GY, w: D.w + 800, h: 80, oneway: false, look: 'none' });
    for (const p of (D.plats || [])) wd.addPlat(Object.assign({ look: 'none', oneway: true }, p));
    wd.addPlat({ x: (D.minX || 0) - 20, y: -600, w: 20, h: 1000, oneway: false, look: 'none' });
    wd.addPlat({ x: (D.maxX != null ? D.maxX : D.w), y: -600, w: 20, h: 1000, oneway: false, look: 'none' });
    wd.ladders = [];
    const keep = this.player;
    const pl = this.player = new V4.Player(x, V4.GY); pl.facing = face;
    if (keep) { pl.hp = keep.hp; }
    this.guards = (D.guards || []).map(o => Object.assign(new L7.Guard(o), { cmd4: true })).filter(g => !this.ko.has(D.id + g.home));
    for (const g of this.guards) { g.id = D.id + g.home; g.draw = V4.drawGuard; }
    this.dogs = (D.dogs || []).map(o => new V4.Dog(o));
    this.cams = (D.cams || []).map(o => new V4.Cam(Object.assign({ sheet: 'pprops4', fr: 9 }, o)));
    this.lasers = (D.lasers || []).map(o => new V4.Laser(o));
    this.enemies = this.flags['clear:' + id] ? [] : (D.enemies || []).map(o => new V4.Brawler(o));
    this.crowd = D.crowd ? D.crowd(this) : [];
    this.hides = D.hides || []; this.ints = D.ints || []; this.trig = (D.trig || []).map(t => Object.assign({ done: false }, t)); this.hints = D.hints || [];
    this.covers = (D.props || []).filter(p => p.cover).map(p => ({ x1: p.x - (p.cw || 30), x2: p.x + (p.cw || 30), y: p.gy != null ? p.gy : V4.GY }));
    this.items = [];
    wd.cam.x = U.clamp(x - W / 2, 0, Math.max(0, D.w - W)); wd.cam.y = 0;
    this.cp = { id, x, face }; this.saved = { flags: Object.assign({}, this.flags), ko: new Set(this.ko) };
    if (D.music !== false) Music.play(this.enemies.length ? 'boss' : 'stealth');
    if (this.arrive) { const a = this.arrive; this.arrive = null; a(pl, this); }
    this.boss = null; this.bossHint = 0; this.bossWon = false; this.cardDrop = null; this.arrow = null;
    if (D.onLoad) D.onLoad(this);
  }
  go(id, x, text, face = 1) {
    if (this.trans) return;
    this.trans = { t: 0, did: false, text, mid: () => this.load(id, x, face) };
    this.player.controls = false; this.player.vx = 0;
  }
  // ---------- запросы для L7.Guard / L7.Dog / L7.Cam ----------
  noise(x, y, r, kind) {
    for (const d of this.dogs) if (Math.abs(d.x - x) < r && Math.abs(d.y - y) < 50) { if (kind === 'bark') { if (d.friendT > 0) continue; } d.hear(x, r, kind); }
    if (kind === 'bark') return;
    for (const g of this.guards) if (Math.abs(g.x - x) < r && Math.abs(g.y - y) < 50) g.hear(x, r, kind);
  }
  wallBetween(x0, x1) { return (this.D.walls || []).some(w => w > Math.min(x0, x1) && w < Math.max(x0, x1)); }
  coverAt(x, y = V4.GY) { return this.covers.some(c => Math.abs(c.y - y) < 40 && x > c.x1 && x < c.x2); }
  coverBetween(ex, px, y = V4.GY) { const a = Math.min(ex, px), b = Math.max(ex, px); return this.covers.some(c => Math.abs(c.y - y) < 40 && ((px > c.x1 && px < c.x2) || (c.x2 > a + 6 && c.x1 < b - 6))); }
  dogNear() { return false; }
  throwItem() {}
  carAt() { return null; }
  tryTakedown(pl) {
    for (const g of this.guards) {
      if (!g.alive || g.state === 'stagger') continue;
      const dx = pl.x - g.x;
      if (Math.abs(dx) < 58 && Math.abs(pl.y - g.y) < 44 && (Math.sign(dx) === -g.facing || g.state === 'sleep') && g.see < 0.6) {
        g.ko(); this.ko.add(g.id); this.level.stats.kills++; this.world.addScore(300);
        Sound.play('hit'); G.hitStop = 0.06; G.shake(3, 0.15); FX.popText(g.x, g.y - 110, 'ВЫРУБЛЕН! +300', '#8cf08c');
        pl.facing = Math.sign(g.x - pl.x) || pl.facing; if (Math.random() < 0.6) G.say(pl, U.choice(['Спокойной ночи.', 'Тихо-тихо...', 'Отдохни, служивый.', 'Стропальщики не сдаются.']), 1.2);
        if (this.D.onKO) this.D.onKO(this, g);
        return true;
      }
    }
    return false;
  }
  playerAttack(hb, dmg, atk, pl) {
    for (const b of this.enemies) {
      if (atk.hit.has(b) || b.state === 'ko') continue;
      if (U.overlap(hb, b.box)) { atk.hit.add(b); if (b.hit(dmg, pl.facing)) { this.world.addScore(150); FX.popText(b.x, b.y - 60, '+150'); this.level.stats.kills++; } G.hitStop = 0.04; }
    }
    if (this.boss) this.boss.playerHit(hb, dmg, atk, pl);
  }
  // ---------- укрытия-будки, взаимодействия ----------
  nearInt(pl) {
    let best = null;
    for (const it of this.ints) if ((!it.cond || it.cond(this)) && Math.abs(it.x - pl.x) < (it.r || 30) && (it.y == null || Math.abs(it.y - pl.y) < 30) && (!best || Math.abs(it.x - pl.x) < Math.abs(best.x - pl.x))) best = it;
    for (const h of this.hides) if (Math.abs(h.x - pl.x) < 34 && Math.abs((h.y || V4.GY) - 3 - pl.y) < 30 && (!best || Math.abs(h.x - pl.x) < Math.abs(best.x - pl.x))) best = { hide: h, x: h.x, label: h.label || 'спрятаться' };
    return best;
  }
  hideIn(h) { const pl = this.player; pl.seq = { h, phase: 'in', t: 0 }; pl.crouch = false; pl.atk = null; Sound.play('door'); }
  startMG(kind, cb) { this.mg = new V4.MG(kind, this); this.mgCb = cb; this.player.controls = false; this.player.vx = 0; Sound.play('select'); }
  endMG(r) { const cb = this.mgCb; this.mg = null; this.mgCb = null; this.player.controls = true; if (cb) cb(r === 'ok'); }
  openMenu(title, items, cb) { this.menu = { title, items, sel: 0, cb }; this.player.controls = false; this.player.vx = 0; }
  // ---------- поимка ----------
  catchBy(by) {
    if (this.caught || this.done) return;
    const pl = this.player, g0 = by instanceof L7.Guard ? by : null;
    if (g0 && Math.abs(g0.y - pl.y) > 40) by = null;
    this.caught = { t: 0, by, phase: 'spot' }; pl.controls = false; pl.vx = 0; pl.atk = null; pl.seq = null; pl.hidden = null;
    Sound.play('warn'); Music.play('alarm'); G.flash(0.15, '#ff2010'); this.level.stats.caught = (this.level.stats.caught || 0) + 1;
    let g = by instanceof L7.Guard ? by : null;
    if (!g) for (const q of this.guards) if (q.alive && q.state !== 'stagger' && Math.abs(q.x - pl.x) < 420 && Math.abs(q.y - pl.y) < 40 && (!g || Math.abs(q.x - pl.x) < Math.abs(g.x - pl.x))) g = q;
    if (!g) { let side = pl.x - this.world.cam.x > W / 2 ? -1 : 1; const vd = this.D.voidAt, sx0 = s => s > 0 ? this.world.cam.x - 40 : this.world.cam.x + W + 40;
      const bad = s => { if (!vd) return false; for (let x = pl.x; (sx0(s) - x) * -s > 0; x -= s * 10) if (vd(x, pl.y)) return true; return false; };   // охранник не бежит над шахтой лестницы — заходит с той стороны, где есть пол
      if (bad(side) && !bad(-side)) side = -side;
      g = new L7.Guard({ x: sx0(side), kind: 'post', facing: side, y: pl.y }); g.draw = V4.drawGuard; this.guards.push(g); }
    this.caught.g = g; g.state = 'catch'; g.facing = Math.sign(pl.x - g.x) || 1;
    if (by instanceof L7.Dog) { by.state = 'catch'; Sound.play('bark'); }
    G.say(g, U.choice(['Стоять! Мистер Рэд!', 'Попался! Руки за спину!', 'Тревога! Это он, по фотороботу!']), 1.6);
  }
  updateCaught(dt) {
    const c = this.caught, pl = this.player, g = c.g; c.t += dt; g.animT += dt; pl.animT += dt;
    if (c.by instanceof L7.Dog) c.by.animT += dt;
    if (c.phase === 'spot') { pl.forcePose = 'handsUp'; pl.setAnim('handsUp'); if (c.t > 0.7) c.phase = 'run'; }
    else if (c.phase === 'run') { g.anim = 'run'; g.facing = Math.sign(pl.x - g.x) || g.facing; const tx = pl.x - g.facing * 30; g.x = U.approach(g.x, tx, 190 * dt); if (Math.abs(g.x - tx) < 2) { c.phase = 'tie'; c.t = 0; Sound.play('rope'); } }
    else if (c.phase === 'tie') { g.anim = 'tie'; pl.forcePose = 'tied'; pl.setAnim('tied'); pl.facing = g.facing; if (c.t > 1.3) { c.phase = 'drag'; c.t = 0; g.facing = -g.facing; G.say(pl, U.choice(['Пустите! Я стропальщик!', 'Ай! Наручники жмут!', 'Я просто мимо шёл!']), 1.5); } }
    else { g.anim = 'drag'; g.x += g.facing * 60 * dt; pl.x = g.x - g.facing * 34; pl.facing = g.facing; if (c.t > 1.1) this.fade = Math.min(1, this.fade + dt * 2); if (c.t > 1.7 && this.fade >= 1) this.respawn(); }
  }
  respawn() {
    this.caught = null; this.susp = 0; this.mg = null; this.level.stats.deaths++;
    this.flags = Object.assign({}, this.saved.flags); this.ko = new Set(this.saved.ko);
    const cp = this.cp; this.player = null; this.load(cp.id, cp.x, cp.face);
    G.say(this.player, U.choice(['Еле вырвался! Теперь потише.', 'Наручники у них китайские. Ещё разок!', 'Сбежал из автозака. Аккуратнее...']), 2);
  }
  // ---------- обновление ----------
  update(dt) {
    const wd = this.world, pl = this.player, I = G.Input, D = this.D;
    this.t += dt; wd.t += dt;
    if (D.rain) this.storm.update(dt, true);
    for (const q of this.crowd) { q.update(dt); if (q.tick) q.tick(dt, this); }
    if (this.trans) {
      const tr = this.trans; tr.t += dt;
      if (tr.t < 0.4) this.fade = tr.t / 0.4;
      else if (!tr.did) { tr.did = true; tr.mid(); this.fade = 1; }
      else if (tr.t > (tr.text ? 1.4 : 0.7)) { this.fade = Math.max(0, this.fade - dt * 3); if (this.fade <= 0) { this.trans = null; if (!this.level.scene) this.player.controls = true; } }
      return;
    }
    if (this.fade > 0 && !this.caught) this.fade = Math.max(0, this.fade - dt * 1.8);
    if (this.mg) { const r = this.mg.update(dt, I); if (r) this.endMG(r); return; }
    if (this.menu) { const m = this.menu; if (I.pressed('up')) m.sel = (m.sel + m.items.length - 1) % m.items.length; if (I.pressed('down')) m.sel = (m.sel + 1) % m.items.length;
      if (I.pressed('jump') || I.pressed('punch')) { const it = m.items[m.sel]; this.menu = null; pl.controls = true; m.cb(it); } else if (I.pressed('throw') || I.pressed('pause')) { I.hit.pause = false; this.menu = null; pl.controls = true; } return; }
    if (this.caught) { this.updateCaught(dt); this.camFollow(dt); return; }
    wd.updatePlats(dt);
    const near = !pl.seq && pl.onGround && pl.controls ? this.nearInt(pl) : null; this.near = near;
    const nk = near && (near.key || 'up');   // клавиша по смыслу: вниз по лестнице — «вниз»
    if (near && I.pressed(nk)) { if (near.hide) this.hideIn(near.hide); else near.act(this); I.hit[nk] = false; }
    pl.update(dt, wd);
    if (D.update) D.update(dt, this);
    for (const g of this.guards) g.update(dt, this);
    for (const d of this.dogs) d.update(dt, this);
    for (const b of this.enemies) b.update(dt, this, pl);
    if (this.enemies.length && this.enemies.every(b => b.dead || b.state === 'ko')) { if (!this.flags['clear:' + D.id]) { this.flags['clear:' + D.id] = 1; Music.play('stealth'); } }
    this.enemies = this.enemies.filter(b => !b.dead);
    if (this.boss) this.boss.update(dt, this);
    for (const c of this.cams) c.update(dt);
    for (const l of this.lasers) { l.update(dt); if (l.hits(this, pl)) { Sound.play('zap'); FX.burst(pl.x, pl.y - 40, 10, { colors: ['#ff3030', '#fff'], speed: 120, life: 0.3, grav: 0 }); this.catchBy(l); return; } }
    if (this.level.scene) { this.camFollow(dt); return; }   // в катсцене не замечают
    // заметность
    let rate = 0, who = null;
    for (const e of [...this.guards, ...this.dogs, ...this.cams]) { const r = e.sees ? e.sees(this, pl) : 0; e.see = r > 0 ? Math.min(1, this.susp) : Math.max(0, (e.see || 0) - dt * 2); if (r > rate) { rate = r; who = e; } }
    if (pl.hidden && pl.hidden.blown && this.susp < 0.3) pl.hidden.blown = false;
    if (rate > 0) { this.susp += rate * dt * (D.suspK || 0.85); if (who instanceof L7.Dog && this.susp > 0.4 && Math.random() < dt * 3) Sound.play('bark'); }
    else this.susp = Math.max(0, this.susp - dt * 0.5);
    if (this.susp >= 1 && who) { this.susp = 1; this.catchBy(who); return; }
    if (pl.dead && pl.deadT > 1.4) { this.fade = Math.min(1, this.fade + dt * 2); if (this.fade >= 1) { this.player = null; this.respawn(); } return; }
    for (const t of this.trig) if (!t.done && pl.x > t.x && (!t.cond || t.cond(this))) { t.done = true; t.fn(this); }
    let hint = null;
    for (const h of this.hints) if (pl.x > h.x1 && pl.x < h.x2 && (!h.cond || h.cond(this))) { hint = h.text; break; }
    if (hint) { this.hint = hint; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
    this.camFollow(dt);
  }
  camFollow(dt) { if (this.camLock) return; const wd = this.world, pl = this.player;
    if (this.D.vertical) { const mx = Math.max(0, this.D.w - W), tx = U.clamp(pl.x - W * 0.5 + pl.facing * 24, 0, mx); wd.cam.x = mx ? wd.cam.x + (tx - wd.cam.x) * Math.min(1, dt * 4) : 0; const ty = U.clamp(pl.y - 236, this.D.topY != null ? this.D.topY : -4000, 0); wd.cam.y += (ty - wd.cam.y) * Math.min(1, dt * 5); return; } const tx = U.clamp(pl.x - W * 0.45 + pl.facing * 24, 0, Math.max(0, this.D.w - W)); wd.cam.x += (tx - wd.cam.x) * Math.min(1, dt * 4); }
  // ---------- рисование ----------
  drawBG(c, cx) {
    const D = this.D;
    if (D.rain) this.storm.drawSky(c, cx);
    if (D.far) V4.drawFar(c, cx);
    if (D.admin) V4.drawAdmin(c, cx, D.admin);
    if (D.layers) for (const L of D.layers) V4.drawLayer(c, cx, L);
    if (D.trees) { c.save(); c.filter = 'brightness(0.62) saturate(0.8)'; for (const q of D.trees) if (q.back) V4.drawTree(c, q, cx, this.t); c.restore(); for (const q of D.trees) if (!q.back) V4.drawTree(c, q, cx, this.t); }
    if (D.strip) {
      if (D.stripCut) {   // за углом прямой забор не рисуется (только дорога ниже cut.y)
        const k = D.stripCut, sx = Math.max(0, Math.min(W, k.x - cx));
        if (sx > 0) c.drawImage(D.strip.cv, cx * 2, 0, sx * 2, H * 2, 0, 0, sx, H);
        if (sx < W) c.drawImage(D.strip.cv, (cx + sx) * 2, k.y * 2, (W - sx) * 2, (H - k.y) * 2, sx, k.y, W - sx, H - k.y);
      } else c.drawImage(D.strip.cv, cx * 2, 0, W * 2, H * 2, 0, 0, W, H);
    }
    if (D.bg) V4.drawRoomBG(c, cx, D.bg);
    if (D.bgFn) D.bgFn(c, cx, this);
    if (D.seam) for (const q of D.seam) V4.drawTree(c, q, cx, this.t);
  }
  drawProps(c, cx, pass) {
    for (const p of (this.D.props || [])) {
      if ((p.pass || (p.cover ? 'cover' : 'back')) !== pass) continue;
      const x = p.x - cx; if (x < -400 || x > W + 400) continue;
      if (p.car) V4.drawCar(c, p.car.fr, x, V4.GY + 10, p.car.flip || 1);
      else if (p.sh) Spr.draw(c, p.sh, p.fr, x, p.y, p.flip || 1, { scale: p.s });
    }
    if (pass === 'back') for (const h of this.hides) {
      const x = h.x - cx; if (!h.sh || x < -200 || x > W + 200) continue;
      const shake = this.player.seq && this.player.seq.h === h && this.player.seq.phase === 'hid' && (G.t * 8 | 0) % 7 === 0 ? 1 : 0;
      Spr.draw(c, h.sh, h.open ? h.frO : h.frC, x + shake, h.y || V4.GY + 3, 1, { scale: h.s });
    }
  }
  draw(c) {
    const wd = this.world, cx = Math.round(wd.cam.x), D = this.D, pl = this.player;
    if (D.customDraw) { D.customDraw(c, this); return; }
    const cy = D.vertical ? Math.round(wd.cam.y) : 0; this.camY = cy;
    c.save(); c.translate(0, -cy);
    this.drawBG(c, cx);
    this.drawProps(c, cx, 'back');
    for (const q of this.crowd) if (!q.front && Math.abs(q.x - cx - W / 2) < W) q.draw(c, cx, 0);
    if (D.drawMid) D.drawMid(c, cx, this);
    for (const l of this.lasers) l.draw(c, cx, 0, this);
    for (const d of this.dogs) if (Math.abs(d.x - cx - W / 2) < W) d.draw(c, cx, 0);
    for (const b of this.enemies) b.draw(c, cx, 0);
    if (this.boss) this.boss.draw(c, cx);
    if (!this.hidePlayer) pl.draw(c, cx, 0);
    if (D.overPlayer) D.overPlayer(c, cx, this);
    this.drawProps(c, cx, 'cover');
    for (const g of this.guards) if (Math.abs(g.x - cx - W / 2) < W) { g.drawBeam(c, cx, 0, this); g.draw(c, cx, 0); }
    for (const q of this.crowd) if (q.front && Math.abs(q.x - cx - W / 2) < W) q.draw(c, cx, 0);
    for (const cm of this.cams) cm.draw(c, cx, 0, this);
    if (D.drawFront) D.drawFront(c, cx, this);
    this.drawProps(c, cx, 'front');
    if (D.cars) for (const q of D.cars) Spr.draw(c, 'cars4', q.fr, q.x - cx, q.y, q.flip || 1);
    if (D.rain) this.storm.drawFlash(c);
    if (D.fg) { c.save(); c.filter = 'brightness(0.2) saturate(0.5)'; for (const q of D.fg) { const sx = q.x - cx * 1.35; if (sx < -300 || sx > W + 300) continue; Spr.draw(c, q.sh || 'props4', q.fr, sx, H + (q.dy != null ? q.dy : 34), 1, { scale: q.s }); } c.restore(); }
    c.save(); c.translate(-cx, 0); FX.draw(c); c.restore();
    c.restore();
    if (D.dark) { c.fillStyle = `rgba(0,0,10,${D.dark})`; c.fillRect(0, 0, W, H); }
    if (D.rain) this.storm.drawRain(c, cx);
    G.drawBubbles(c, cx, cy);
    if (!this.level.scene) this.drawHUD(c);
    if (this.caught) G.bigTitle(c, 'ПОПАЛСЯ!', Math.min(1, this.caught.t * 3), { size: 24, color: '#ff5a3a', y: 110 });
    if (this.mg) this.mg.draw(c);
    if (this.menu) this.drawMenu(c);
    if (this.fade > 0) { c.fillStyle = `rgba(0,0,0,${this.fade})`; c.fillRect(0, 0, W, H); }
    if (this.trans && this.trans.text && this.fade > 0.6) G.text(this.trans.text, W / 2, H / 2 - 4, { align: 'center', color: '#c8d0d8' });
  }
  drawMenu(c) {
    const m = this.menu, R = Art.R, bw = 260, bh = 30 + m.items.length * 18, bx = W / 2 - bw / 2, by = 90;
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, W, H);
    R(c, bx - 2, by - 2, bw + 4, bh + 4, '#0a0a0c'); R(c, bx, by, bw, bh, '#2a2418'); R(c, bx, by, bw, 2, '#c8a020');
    G.text(m.title, W / 2, by + 8, { align: 'center', size: 8, color: '#ffd84a' });
    m.items.forEach((it, i) => G.text((i === m.sel ? '> ' : '  ') + it.label, bx + 20, by + 26 + i * 18, { size: 8, color: it.locked ? '#7a6a50' : i === m.sel ? '#fff' : '#c8c0a8' }));
    G.text(Game.fmtHint('{up}/{down}, {jump} — выбрать, {throw} — выйти'), W / 2, by + bh - 10, { align: 'center', size: 8, color: '#8a8070' });
  }
  // указатели взаимодействия у самих объектов: клавиша-стрелка (вверх/вниз) и короткая подпись; вдалеке — маленькая стрелка
  drawMarks(c) {
    const pl = this.player; if (!pl || this.mg || this.caught || this.menu || this.level.scene || pl.seq || pl.auto) return;
    const talk = G.bubbles.some(b => b.target === pl);   // пока Валера говорит, подпись не лезет в реплику
    const cx = this.world.cam.x, cy = this.camY || 0, nr = this.near, list = this.ints.filter(it => !it.cond || it.cond(this)).concat(this.hides.map(h => ({ x: h.x, y: h.y, hide: h, label: h.label || 'спрятаться' })));
    const tri = (x, y, s, down) => { c.beginPath(); c.moveTo(x, y + (down ? s : -s)); c.lineTo(x + s, y + (down ? -s : s) * 0.7); c.lineTo(x - s, y + (down ? -s : s) * 0.7); c.closePath(); c.fill(); };
    for (const it of list) {
      const y0 = it.y == null ? V4.GY : it.y; if (Math.abs(y0 - pl.y) > 30) continue;
      const on = nr && (nr === it || (it.hide && nr.hide === it.hide)), x = it.x - cx, down = it.key === 'down', y = y0 - cy - 100 + Math.sin(G.t * 5) * 2;
      if (x < -20 || x > W + 20) continue;
      if (!on) { if (it.quiet || Math.abs(it.x - pl.x) > 190) continue; c.globalAlpha = 0.55; c.fillStyle = '#0a0c10'; tri(x, y + 1, 6.5, down); c.fillStyle = '#ffd84a'; tri(x, y, 5, down); c.globalAlpha = 1; continue; }
      if (talk) continue;
      c.fillStyle = '#0a0c10'; c.fillRect(x - 10, y - 10, 20, 20); c.fillStyle = '#ffd84a'; c.fillRect(x - 9, y - 9, 18, 18); c.fillStyle = '#1a1e26'; c.fillRect(x - 7.5, y - 7.5, 15, 15); c.fillStyle = '#ffd84a'; tri(x, y, 5, down);
      G.text(it.label.toUpperCase(), U.clamp(x, 50, W - 50), y - 22, { align: 'center', size: 8, color: '#fff', outline: true });
    }
  }
  drawHUD(c) {
    const R = Art.R, pl = this.player, k = U.clamp(this.susp, 0, 1);
    Game.drawHUD(c, pl, this.world);
    if (!this.enemies.length && !this.boss) {
      R(c, 245, 8, 150, 12, '#111'); R(c, 247, 10, 146, 8, '#1a2a1a'); R(c, 247, 10, Math.round(146 * k), 8, k < 0.4 ? '#e0c040' : k < 0.75 ? '#f08a30' : '#ff3020');
      G.text(pl.seq && pl.seq.phase === 'hid' ? 'СПРЯТАН' : k > 0 ? 'ТЕБЯ ЗАМЕЧАЮТ!' : pl.crouch ? 'НА ЧЕТВЕРЕНЬКАХ' : 'НЕЗАМЕТНОСТЬ', 320, 23, { align: 'center', size: 8, color: pl.seq ? '#8cf08c' : k > 0 ? '#ff8a6a' : '#c8d0d8' });
    }
    this.drawMarks(c);
    if (this.hint && !this.near && !this.caught && !this.mg) Game.drawHint(c, this.hint, this.hintA);
    if (this.arrow) { const a = this.arrow, x = a.x - this.world.cam.x, bob = Math.sin(G.t * 6) * 4 - (this.camY || 0); if (x > -20 && x < W + 20) G.text('V', x, a.y - 30 + bob, { align: 'center', size: 16, color: '#ffd84a', outline: true }); else G.text(x > W ? '>>' : '<<', x > W ? W - 20 : 20, 150, { align: 'center', size: 16, color: '#ffd84a', outline: true }); }
  }
};

// охранник v4 рисуется листом cmd4 (спецназ как на ур.2)
V4.drawGuard = function (c, cx, cy) {
  Spr.drawAnim(c, 'cmd4', this.anim, this.animT, this.x - cx, this.y - cy, this.facing);
  if (this.state === 'ko' && (G.t * 2 | 0) % 2) G.text('Z', this.x - cx + 22, this.y - cy - 24, { size: 8, color: '#c8d8ff' });
  if (this.see > 0.05 || this.mark > 0) G.text(this.see > 0.6 ? '!' : '?', this.x - cx, this.y - cy - 104, { align: 'center', size: 16, color: this.see > 0.6 ? '#ff4030' : '#ffd84a', outline: true });
};

// ---------- слои ----------
V4.drawFar = function (c, cx) {
  const img = V4.img.far; if (!img) return;
  const s = 0.5, w = img.width * s, h = img.height * s, off = cx * 0.18 + 200, y = 236 - h;
  let x = -(((off % (w * 2)) + w * 2) % (w * 2));
  for (; x < W; x += w) { const odd = Math.floor((off + x) / w + 0.001) % 2 !== 0;
    if (odd) { c.save(); c.translate(Math.round(x) + w, 0); c.scale(-1, 1); c.drawImage(img, 0, y, w, h); c.restore(); } else c.drawImage(img, Math.round(x), y, w, h); }
  c.fillStyle = 'rgba(30,36,70,0.28)'; c.fillRect(0, 0, W, V4.GY);
};
// заводоуправление (с аллеей): a = { x: центр аллеи при cam=0, par, s, y }
V4.drawAdmin = function (c, cx, a) {
  const img = V4.img.admin; if (!img) return;
  const s = a.s || 0.4, w = img.width * s, h = img.height * s, x = a.x - w / 2 - cx * (a.par || 0.35), y = (a.y || 284) - h;
  if (x > W || x + w < 0) return;
  c.drawImage(img, Math.round(x), Math.round(y), w, h);
};
// одиночный слой-картинка (без тайлинга): L = { k, x, s, fy, par }
V4.drawLayer = function (c, cx, L) {
  const img = V4.img[L.k]; if (!img) return;
  const w = img.width * L.s, h = img.height * L.s, x = L.x - cx * (L.par == null ? 1 : L.par), y = (L.gy || V4.GY) - L.fy * L.s;
  if (x > W || x + w < 0) return;
  if (L.alpha != null) c.globalAlpha = L.alpha;
  c.drawImage(img, Math.round(x), Math.round(y), w, h); c.globalAlpha = 1;
};
// фон помещения: картинка, ноги на GY; по ширине — зеркальные тайлы; сверху недостающее — растяжка верхней кромки
V4.drawRoomBG = function (c, cx, b) {
  const img = V4.img[b.k]; if (!img) { c.fillStyle = '#15161c'; c.fillRect(0, 0, W, H); return; }
  const s = b.s, w = img.width * s, h = img.height * s, y = V4.GY - b.fy * s, par = b.par == null ? 1 : b.par;
  const off = cx * par - (b.x0 || 0);
  let x = b.tile === false ? -off : -(((off % (w * 2)) + w * 2) % (w * 2));
  for (; x < W; x += w) {
    const odd = b.tile !== false && Math.floor((off + x) / w + 0.001) % 2 !== 0;
    c.save(); if (odd) { c.translate(Math.round(x) + w, 0); c.scale(-1, 1); } else c.translate(Math.round(x), 0);
    c.drawImage(img, 0, y, w, h);
    if (y > 0) c.drawImage(img, 0, 0, img.width, img.height * 0.04, 0, 0, w, y + 1);
    if (y + h < H) c.drawImage(img, 0, img.height * 0.96, img.width, img.height * 0.04, 0, y + h - 1, w, H - y - h + 1);
    c.restore();
    if (b.tile === false) break;
  }
};
