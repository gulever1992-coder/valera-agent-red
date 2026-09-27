'use strict';
// ============ ГЕЙМПЛЕЙ: мир, Валера, враги, снаряды, предметы, HUD ============
const Game = {};
G.Game = Game;

const GRAV = 1500, MAXFALL = 720, RUN = 165, JUMPV = 560;

// ---------- речевые пузыри ----------
G.bubbles = [];
G.say = function (target, text, dur = 2.2, o = {}) {
  G.bubbles = G.bubbles.filter(b => b.target !== target);
  G.bubbles.push({ target, text, t: 0, dur, shout: !!o.shout, color: o.color });
  if (o.sound !== false) Sound.play('blip', target.voice || 300);
};
G.updateBubbles = dt => { for (const b of G.bubbles) b.t += dt; G.bubbles = G.bubbles.filter(b => b.t < b.dur && !(b.target && b.target.gone)); };
G.drawBubble = function (c, x, y, text, o = {}) {
  const size = o.shout ? 16 : 8;
  const lines = G.wrap(text, o.shout ? 300 : 170, size);
  const lh = size + 4;
  let w = 0; for (const l of lines) w = Math.max(w, G.textWidth(l, size));
  const bw = w + 12, bh = lines.length * lh + 8;
  let bx = Math.round(U.clamp(x - bw / 2, 4, W - bw - 4)), by = Math.round(y - bh - 10);
  if (by < 4) by = 4;
  const jx = o.shout ? U.rand(-2, 2) : 0, jy = o.shout ? U.rand(-2, 2) : 0;
  bx += jx; by += jy;
  c.fillStyle = '#111';
  if (o.shout) {
    c.beginPath();
    const cx = bx + bw / 2, cy = by + bh / 2, n = 22;
    for (let i = 0; i <= n; i++) {
      const a = i / n * Math.PI * 2, r = i % 2 ? 1 : 1.18;
      c.lineTo(cx + Math.cos(a) * (bw / 2 + 6) * r, cy + Math.sin(a) * (bh / 2 + 6) * r);
    }
    c.fill();
    c.fillStyle = '#fff8d0';
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = i / n * Math.PI * 2, r = i % 2 ? 1 : 1.16;
      c.lineTo(cx + Math.cos(a) * (bw / 2 + 4) * r, cy + Math.sin(a) * (bh / 2 + 4) * r);
    }
    c.fill();
  } else {
    c.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    c.fillStyle = '#f4f0e4'; c.fillRect(bx, by, bw, bh);
    // хвостик
    const tx = U.clamp(x, bx + 6, bx + bw - 6);
    c.fillStyle = '#111'; c.beginPath(); c.moveTo(tx - 5, by + bh); c.lineTo(tx + 5, by + bh); c.lineTo(tx, by + bh + 8); c.fill();
    c.fillStyle = '#f4f0e4'; c.beginPath(); c.moveTo(tx - 3, by + bh - 1); c.lineTo(tx + 3, by + bh - 1); c.lineTo(tx, by + bh + 5); c.fill();
  }
  lines.forEach((l, i) => G.text(l, bx + bw / 2, by + 5 + i * lh, { size, color: o.color || (o.shout ? '#c01818' : '#1a1a1a'), align: 'center', shadow: false }));
};
G.drawBubbles = function (c, camX, camY) {
  for (const b of G.bubbles) {
    const tg = b.target;
    const hx = (tg.bx != null ? tg.bx : tg.x) - camX;
    const hy = (tg.by != null ? tg.by : tg.y - (tg.headH || 70)) - camY;
    const k = Math.min(1, b.t * 8);
    c.globalAlpha = k;
    G.drawBubble(c, hx, hy, b.text, { shout: b.shout, color: b.color });
    c.globalAlpha = 1;
  }
};

// ---------- мир ----------
Game.World = class {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.plats = []; this.ladders = []; this.enemies = []; this.pickups = []; this.projs = []; this.hazards = [];
    this.warnings = []; this.checkpoints = []; this.hints = []; this.vents = []; this.sparks = [];
    this.cam = { x: 0, y: 0 }; this.camFixed = false;
    this.t = 0;
  }
  addPlat(o) {
    const p = Object.assign({ x: 0, y: 0, w: 60, h: 8, oneway: true, look: 'girder', dx: 0, dy: 0 }, o);
    if (p.mover) { p.mover.t = p.mover.t || 0; p.baseX = p.x; p.baseY = p.y; }
    this.plats.push(p); return p;
  }
  updatePlats(dt) {
    for (const p of this.plats) {
      p.dx = 0; p.dy = 0;
      if (p.mover) {
        const m = p.mover;
        m.t += dt;
        const len = Math.hypot(m.x2 - m.x1, m.y2 - m.y1);
        const period = len / m.speed;
        const pause = m.pause || 0.8;
        const cyc = (period + pause) * 2;
        const tt = m.t % cyc;
        let k;
        if (tt < pause) k = 0; else if (tt < pause + period) k = U.easeInOut((tt - pause) / period);
        else if (tt < pause * 2 + period) k = 1; else k = 1 - U.easeInOut((tt - pause * 2 - period) / period);
        const nx = m.x1 + (m.x2 - m.x1) * k, ny = m.y1 + (m.y2 - m.y1) * k;
        p.dx = nx - p.x; p.dy = ny - p.y; p.x = nx; p.y = ny;
      }
      if (p.crumble) {
        const cr = p.crumble;
        if (cr.state === 'shake') { cr.t -= dt; p.crumbling = true; if (cr.t <= 0) { cr.state = 'fall'; cr.vy = 0; Sound.play('crumble'); FX.dust(p.x + p.w / 2, p.y, 8); } }
        else if (cr.state === 'fall') { cr.vy += GRAV * dt; p.y += cr.vy * dt; cr.fallen = (cr.fallen || 0) + dt; if (cr.fallen > 3.5) { cr.state = 'idle'; p.y = cr.y0; p.crumbling = false; cr.fallen = 0; FX.burst(p.x + p.w / 2, p.y, 6, { colors: ['#b89060'], speed: 40, grav: 0, life: 0.4 }); } }
      }
    }
  }
  solidPlats() { return this.plats.filter(p => !(p.crumble && p.crumble.state === 'fall')); }
  // приземление предметов/врагов на платформы
  groundAt(x, prevY, y, w = 0) {
    let best = null;
    for (const p of this.plats) {
      if (p.crumble && p.crumble.state === 'fall') continue;
      if (x + w < p.x || x - w > p.x + p.w) continue;
      if (prevY <= p.y + 1 && y >= p.y) { if (!best || p.y < best.y) best = p; }
    }
    return best;
  }
};

// ---------- Валера ----------
Game.Player = class {
  constructor(x, y) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.facing = 1;
    this.anim = 'stand'; this.animT = 0;
    this.hp = 100; this.maxHp = 100; this.inv = 0; this.onGround = false; this.ground = null;
    this.coyote = 0; this.jumpBuf = 0; this.climb = null; this.atk = null; this.combo = 0; this.comboT = 0;
    this.throwT = 0; this.throwDone = false; this.hurtT = 0; this.idleT = 0; this.idle = null; this.dropT = 0;
    this.ammo = { nuts: 0, wrench: 0, bricks: 0, bottles: 0 }; this.weapon = 'nuts'; this.bottleHits = 0; this.crouch = false;
    this.dead = false; this.deadT = 0; this.controls = true; this.headH = 86; this.voice = 260;
    this.anim = 'stand'; this.animT = 0; this.landT = 0; this.stompPh = 0; this.forcePose = null;
  }
  get box() { return this.crouch ? { x: this.x - 11, y: this.y - 44, w: 22, h: 43 } : { x: this.x - 10, y: this.y - 70, w: 20, h: 69 }; }
  hurt(dmg, fromX, world) {
    if (this.inv > 0 || this.dead) return false;
    this.hp -= dmg; world.stats.dmg += dmg;
    this.inv = 1.3; this.hurtT = 0.35; this.atk = null; this.climb = null;
    const dir = this.x < fromX ? -1 : 1;
    this.vx = dir * 170; this.vy = -230; this.onGround = false;
    Sound.play('hurt'); G.shake(4, 0.2); G.hitStop = 0.04;
    FX.burst(this.x, this.y - 40, 8, { colors: ['#fff', '#ffd84a'], speed: 150, grav: 300, life: 0.4 });
    this.idleT = 0; this.idle = null;
    if (this.hp <= 0) { this.hp = 0; this.dead = true; this.deadT = 0; Sound.play('boom'); G.say(this, U.choice(['Эх...', 'Ну ё-моё...', 'Я прилягу...']), 1.8); }
    else if (Math.random() < 0.35) G.say(this, U.choice(['Ай!', 'Больно же!', 'Кто кидает?!', 'Ну ёлки!', 'Моя голова!']), 1.1);
    return true;
  }
  heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); }
  update(dt, world) {
    const I = G.Input;
    this.animT += dt;
    if (this.inv > 0) this.inv -= dt;
    if (this.comboT > 0) this.comboT -= dt;
    if (this.dropT > 0) this.dropT -= dt;
    if (this.landT > 0) this.landT -= dt;
    if (this.dead) {
      this.deadT += dt;
      this.vy = Math.min(MAXFALL, this.vy + GRAV * dt); this.vx *= 0.9;
      this.moveY(dt, world);
      this.setAnim('ko');
      return;
    }
    const ctl = this.controls && this.hurtT <= 0;
    if (this.hurtT > 0) this.hurtT -= dt;
    const L = ctl && I.held('left'), Rr = ctl && I.held('right'), Up = ctl && I.held('up'), Dn = ctl && I.held('down');
    const anyInput = L || Rr || Up || Dn || (ctl && (I.held('jump') || I.held('punch') || I.held('throw')));
    if (anyInput) { this.idleT = 0; if (this.idle) { this.idle = null; } }

    // ---- лестница ----
    if (!this.climb && (Up || (Dn && this.onGround)) && !this.atk) {
      for (const l of world.ladders) {
        if (Math.abs(this.x - (l.x + l.w / 2)) < 12 && this.y >= l.y - 2 && this.y - 30 <= l.y + l.h) {
          const atTop = this.y <= l.y + 3;
          if (Up && atTop) continue;
          if (Dn && !atTop) continue;
          if (Up && this.y > l.y + l.h + 2) continue;
          this.climb = l; this.vx = 0; this.vy = 0; this.x = l.x + l.w / 2;
          if (Dn && atTop) this.y += 6;
          break;
        }
      }
    }
    if (this.climb) {
      const l = this.climb;
      const sp = 95;
      let moving = 0;
      if (Up) { this.y -= sp * dt; moving = 1; }
      if (Dn) { this.y += sp * dt; moving = 1; }
      if (moving) { this.climbAnimT = (this.climbAnimT || 0) + dt; if (world.ev) world.ev('climb'); }
      this.onGround = false;
      if (this.y <= l.y) { this.y = l.y; this.climb = null; this.onGround = true; this.vy = 0; }
      else if (this.y >= l.y + l.h) { this.y = l.y + l.h; this.climb = null; }
      if (ctl && I.pressed('jump') && this.climb) { this.climb = null; this.vy = -JUMPV * 0.7; this.vx = (Rr ? 1 : L ? -1 : 0) * RUN; Sound.play('jump'); }
      if (this.climb) {
        this.setAnim('climb'); this.animT = this.climbAnimT || 0;
        return;
      }
    }

    // ---- присед ----
    const wasCrouch = this.crouch;
    this.crouch = !!(Dn && this.onGround && !this.climb && ctl && !I.held('jump'));
    if (this.crouch && !wasCrouch) world.ev && world.ev('crouch');
    // ---- горизонталь ----
    const busy = this.atk && this.onGround;
    let target = 0;
    if (L) target -= RUN; if (Rr) target += RUN;
    if ((L || Rr) && world.ev) world.ev('move');
    if (busy) target *= 0.25;
    if (this.crouch) target = 0;
    if (this.hurtT > 0) target = this.vx;
    const acc = this.onGround ? 1500 : 900;
    this.vx = U.approach(this.vx, target, acc * dt);
    if (ctl && !this.atk && this.throwT <= 0) { if (L && !Rr) this.facing = -1; if (Rr && !L) this.facing = 1; }

    // ---- прыжок ----
    if (this.onGround) this.coyote = 0.1; else this.coyote -= dt;
    if (ctl && I.pressed('jump')) this.jumpBuf = 0.13; else this.jumpBuf -= dt;
    if (this.jumpBuf > 0 && this.coyote > 0) {
      if (Dn && this.ground && this.ground.oneway) { this.dropT = 0.25; this.onGround = false; this.y += 2; }
      else { this.vy = -JUMPV; this.onGround = false; this.coyote = 0; Sound.play('jump'); FX.dust(this.x, this.y, 4); world.ev && world.ev('jump'); }
      this.jumpBuf = 0;
    }
    if (!I.held('jump') && this.vy < -200 && ctl) this.vy += GRAV * 1.3 * dt; // короткий прыжок
    this.vy = Math.min(MAXFALL, this.vy + GRAV * dt);

    // перенос движущейся платформой
    if (this.onGround && this.ground) { this.x += this.ground.dx; this.y += this.ground.dy; }

    this.x += this.vx * dt;
    this.x = U.clamp(this.x, 10, world.w - 10);
    this.moveY(dt, world);

    // ---- удар ----
    if (ctl && I.pressed('punch') && (!this.atk || this.atk.t > this.atk.dur * 0.7) && this.throwT <= 0) {
      const idx = this.comboT > 0 || this.atk ? (this.combo + 1) % 3 : 0;
      this.combo = idx;
      const bottle = this.bottleHits > 0;
      this.atk = { t: 0, dur: bottle ? 0.32 : idx === 2 ? 0.34 : 0.24, kind: bottle ? 'bottle' : idx === 2 ? 'upper' : 'punch', side: idx % 2, hit: new Set(), low: this.crouch };
      Sound.play('punch');
      if (world.ev) world.ev(idx === 2 && !bottle ? 'upper' : 'punch');
      if (this.onGround) this.vx += this.facing * 40;
    }
    if (this.atk) {
      const a = this.atk;
      a.t += dt;
      const on = a.kind === 'upper' ? a.t > 0.08 && a.t < 0.22 : a.kind === 'bottle' ? a.t > 0.12 && a.t < 0.24 : a.t > 0.05 && a.t < 0.15;
      if (on) {
        const hb = a.kind === 'upper'
          ? { x: this.x + (this.facing > 0 ? 2 : -30), y: this.y - 72, w: 28, h: 42 }
          : a.kind === 'bottle' ? { x: this.x + (this.facing > 0 ? 4 : -44), y: this.y - 62, w: 40, h: 40 }
          : a.low ? { x: this.x + (this.facing > 0 ? 6 : -36), y: this.y - 34, w: 30, h: 24 }
          : { x: this.x + (this.facing > 0 ? 6 : -36), y: this.y - 52, w: 30, h: 24 };
        const before = a.hit.size;
        world.playerAttack(hb, a.kind === 'upper' ? 2 : a.kind === 'bottle' ? 2 : 1, a, this);
        if (a.kind === 'bottle' && a.hit.size > before) {
          this.bottleHits--;
          if (this.bottleHits <= 0) { Sound.play('glass'); FX.burst(this.x + this.facing * 20, this.y - 48, 12, { colors: ['#2f8a3a', '#7fd08a', '#e8e0c0'], speed: 150, type: 'shard', size: 2 }); G.say(this, U.choice(['Эх, бутылочка...', 'Тара кончилась!']), 1.3); }
        }
      }
      if (a.t >= a.dur) { this.atk = null; this.comboT = 0.35; }
    }
    // ---- бросок ----
    if (ctl && I.pressed('switch')) this.switchWeapon();
    if (ctl && I.pressed('throw') && this.throwT <= 0 && !this.atk) {
      if (this.ammo[this.weapon] <= 0) this.switchWeapon(true);
      if (this.ammo[this.weapon] > 0) { this.throwT = 0.32; this.throwDone = false; }
      else { FX.popText(this.x, this.y - 80, 'НЕТ СНАРЯДОВ', '#ff6a4a'); Sound.play('warn'); }
    }
    if (this.throwT > 0) {
      this.throwT -= dt;
      if (!this.throwDone && this.throwT < 0.2) {
        this.throwDone = true;
        this.ammo[this.weapon]--;
        world.spawnPlayerProj(this.weapon, this.x + this.facing * 12, this.y - 48, this.facing);
        if (world.ev) world.ev('throw');
        Sound.play('throw');
      }
    }

    // ---- idle-кривляния ----
    if (this.onGround && !anyInput && !this.atk && this.throwT <= 0 && Math.abs(this.vx) < 5) {
      this.idleT += dt;
      if (!this.idle && this.idleT > 3.2) {
        const kinds = ['hips', 'hips', 'scratch', 'yawn', 'belly'];
        const k = U.choice(kinds);
        this.idle = { kind: k, t: 0, dur: k === 'hips' ? 3.4 : 2.6 };
        const lines = {
          hips: ['Ну?! Долго ещё?', 'Я жду!', 'Чё смотришь? Играй!', 'Эй! Там, за экраном!'],
          scratch: ['Хмм...', 'Так, куда я шёл?', 'Где мои пельмени?'],
          yawn: ['Ааааууу...', 'Скукотища...'],
          belly: ['Пельменей бы...', 'Урчит...', 'Обед скоро?'],
        };
        if (Math.random() < 0.8) G.say(this, U.choice(lines[k]), 1.8);
        this.facing = k === 'hips' ? this.facing : this.facing;
      }
      if (this.idle) {
        this.idle.t += dt;
        if (this.idle.kind === 'hips') {
          const ph = (this.animT * 4.5 / 5) % 1;
          if (this.stompPh < 0.6 && ph >= 0.6) { Sound.play('stomp'); FX.dust(this.x + 6, this.y, 3); G.shake(1, 0.08); }
          this.stompPh = ph;
        }
        if (this.idle.t > this.idle.dur) { this.idle = null; this.idleT = 1.0; }
      }
    } else if (!anyInput && this.idle && !this.onGround) this.idle = null;

    this.choosePose(dt);
  }
  switchWeapon(silent) {
    const order = ['nuts', 'wrench', 'bricks', 'bottles'];
    let i = order.indexOf(this.weapon);
    for (let k = 1; k <= order.length; k++) {
      const n = order[(i + k) % order.length];
      if (this.ammo[n] > 0) { this.weapon = n; if (!silent) Sound.play('select'); return; }
    }
  }
  moveY(dt, world) {
    const prevY = this.y;
    this.y += this.vy * dt;
    const wasGround = this.onGround;
    this.onGround = false; this.ground = null;
    if (this.vy >= 0) {
      for (const p of world.plats) {
        if (p.crumble && p.crumble.state === 'fall') continue;
        if (this.x + 7 < p.x || this.x - 7 > p.x + p.w) continue;
        if (p.oneway && this.dropT > 0) continue;
        const top = p.y;
        const prevTop = top - p.dy;
        if (prevY <= prevTop + 2 && this.y >= top) {
          if (!this.ground || top < this.ground.y) this.ground = p;
        }
      }
      if (this.ground) {
        const p = this.ground;
        if (!wasGround && this.vy > 250) { Sound.play('land'); FX.dust(this.x, p.y, 5); this.landT = 0.12; }
        this.y = p.y; this.vy = 0; this.onGround = true;
        if (p.crumble && p.crumble.state === 'idle') { p.crumble.state = 'shake'; p.crumble.t = 0.55; p.crumble.y0 = p.y; Sound.play('crumble'); }
      }
    }
    // «потолок»: твёрдые блоки снизу
    if (this.vy < 0) {
      for (const p of world.plats) {
        if (p.oneway) continue;
        if (this.x + 7 < p.x || this.x - 7 > p.x + p.w) continue;
        const bottom = p.y + p.h;
        if (prevY - 70 >= bottom - 1 && this.y - 70 < bottom) { this.y = bottom + 70; this.vy = 40; }
      }
    }
    // боковые стенки твёрдых блоков
    for (const p of world.plats) {
      if (p.oneway) continue;
      if (this.y > p.y + 1 && this.y - 68 < p.y + p.h) {
        if (this.x + 8 > p.x && this.x - 8 < p.x + p.w) {
          if (this.x < p.x + p.w / 2) this.x = p.x - 8; else this.x = p.x + p.w + 8;
          this.vx = 0;
        }
      }
    }
  }
  setAnim(a) { if (this.anim !== a) { this.anim = a; this.animT = 0; } }
  choosePose(dt) {
    let a;
    if (this.forcePose) a = this.forcePose;
    else if (this.hurtT > 0) a = 'hurt';
    else if (this.atk) a = this.atk.kind === 'bottle' ? (this.atk.t < 0.12 ? 'bWind' : 'bSwing') : this.atk.kind === 'upper' ? 'upper' : this.atk.side ? 'cross' : 'jab';
    else if (this.throwT > 0) a = this.weapon === 'bottles' ? (this.throwT > 0.2 ? 'bWind' : 'bThrow') : this.throwT > 0.2 ? 'throwA' : 'throwB';
    else if (this.crouch) a = this.bottleHits > 0 ? 'bCrouch' : 'crouch';
    else if (!this.onGround) a = this.vy < 0 ? 'jump' : 'fall';
    else if (this.landT > 0) a = 'land';
    else if (Math.abs(this.vx) > 20) a = 'run';
    else if (this.idle) a = this.idle.kind === 'hips' ? 'stomp' : this.idle.kind;
    else a = this.bottleHits > 0 ? 'bIdle' : 'stand';
    this.setAnim(a);
  }
  draw(c, camX, camY) {
    if (this.inv > 0 && !this.dead && ((this.inv * 16) | 0) % 2 === 0) return;
    Spr.drawAnim(c, 'valera', this.anim, this.animT, this.x - camX, this.y - camY, this.facing);
  }
};

// ---------- враги ----------
Game.Rat = class {
  constructor(x, y, x1, x2) { this.x = x; this.y = y; this.x1 = x1; this.x2 = x2; this.dir = 1; this.hp = 1; this.t = 0; this.dead = false; this.score = 50; this.kind = 'rat'; }
  get box() { return { x: this.x - 12, y: this.y - 9, w: 24, h: 9 }; }
  update(dt, world, pl) {
    this.t += dt;
    if (this.dieT != null) { this.dieT += dt; this.y += this.vy * dt; this.vy += GRAV * dt; if (this.dieT > 1) this.dead = true; return; }
    this.x += this.dir * 55 * dt;
    if (this.x < this.x1) { this.x = this.x1; this.dir = 1; }
    if (this.x > this.x2) { this.x = this.x2; this.dir = -1; }
    if (this.t % 2 < dt) Sound.play('squeak');
    if (U.overlap(this.box, pl.box)) pl.hurt(8, this.x, world);
  }
  hit(dmg, dir) { this.hp -= dmg; if (this.hp <= 0 && this.dieT == null) { this.dieT = 0; this.vy = -250; this.dir = dir; Sound.play('squeak'); return true; } return false; }
  draw(c, cx, cy) {
    if (this.dieT != null) { Spr.draw(c, 'enemies', 0, this.x - cx, this.y - cy - 6, this.dir, { rot: Math.PI * this.dir }); return; }
    Spr.draw(c, 'enemies', (this.t * 10 | 0) % 2, this.x - cx, this.y - cy, this.dir);
  }
};

Game.Gull = class {
  constructor(x, y, dir) { this.x = x; this.y = y; this.dir = dir; this.hp = 1; this.t = 0; this.dead = false; this.state = 'fly'; this.score = 80; this.vx = dir * 90; this.vy = 0; this.kind = 'gull'; }
  get box() { return { x: this.x - 12, y: this.y - 7, w: 24, h: 14 }; }
  update(dt, world, pl) {
    this.t += dt;
    if (this.dieT != null) { this.dieT += dt; this.vy += GRAV * dt; this.x += this.vx * dt; this.y += this.vy * dt; if (this.dieT > 1.5) this.dead = true; return; }
    if (this.state === 'fly') {
      this.y += Math.sin(this.t * 3) * 20 * dt;
      if (Math.abs(pl.x - this.x) < 90 && pl.y - this.y > 20 && pl.y - this.y < 220 && this.t > 0.6) {
        this.state = 'dive'; Sound.play('gull');
        const a = Math.atan2(pl.y - 40 - this.y, pl.x - this.x);
        this.vx = Math.cos(a) * 230; this.vy = Math.sin(a) * 230;
      }
    } else if (this.state === 'dive') {
      if (this.vy > 0 && this.y > pl.y - 20) this.state = 'up';
    } else if (this.state === 'up') {
      this.vy = U.approach(this.vy, -120, 500 * dt); this.vx = U.approach(this.vx, this.dir * 120, 300 * dt);
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.x < -60 || this.x > world.w + 60) this.dead = true;
    if (U.overlap(this.box, pl.box)) pl.hurt(10, this.x, world);
  }
  hit(dmg, dir) { this.hp -= dmg; if (this.hp <= 0 && this.dieT == null) { this.dieT = 0; this.vy = -150; this.vx = dir * 120; FX.burst(this.x, this.y, 8, { colors: ['#fff', '#ddd'], speed: 90, grav: 60, life: 1, size: 2 }); return true; } return false; }
  draw(c, cx, cy) {
    const fr = this.state === 'dive' ? 3 : 2 + ((this.t * 7 | 0) % 2);
    Spr.draw(c, 'enemies', fr, this.x - cx, this.y - cy + 8, this.vx >= 0 ? 1 : -1, { rot: this.dieT != null ? this.dieT * 8 : 0 });
  }
};

// пьяный слесарь — дерётся гаечным ключом
Game.Drunk = class {
  constructor(x, y, x1, x2, name) {
    this.x = x; this.y = y; this.x1 = x1; this.x2 = x2; this.hp = 3; this.t = 0; this.dead = false; this.facing = -1; this.state = 'idle'; this.st = 0; this.score = 250; this.kind = 'drunk';
    this.anim = 'stand';
    this.headH = 76; this.voice = 180; this.name = name; this.flash = 0; this.vx = 0; this.vy = 0;
  }
  get box() { return { x: this.x - 11, y: this.y - 66, w: 22, h: 66 }; }
  update(dt, world, pl) {
    this.t += dt; this.st += dt; if (this.flash > 0) this.flash -= dt;
    let pose;
    if (this.dieT != null) {
      this.dieT += dt; this.vy += GRAV * dt; this.y += this.vy * dt; this.x += this.vx * dt;
      if (this.dieT > 1.6) this.dead = true;
      this.anim = 'ko'; return;
    }
    const dx = pl.x - this.x, near = Math.abs(pl.y - this.y) < 40 && !pl.dead;
    switch (this.state) {
      case 'idle':
        pose = 'stand';
        if (near && Math.abs(dx) < 170) { this.state = 'walk'; this.st = 0; if (Math.random() < 0.7) G.say(this, U.choice(['Ты чё, с какого цеха?!', 'Иди сюда, стропаль!', 'Ик! Щас как дам!', 'Моя бутылка! Не трожь!']), 1.8); }
        break;
      case 'walk':
        this.facing = dx > 0 ? 1 : -1;
        this.x += this.facing * 55 * dt * (0.7 + Math.sin(this.t * 4) * 0.3);
        this.x = U.clamp(this.x, this.x1, this.x2);
        pose = 'walk';
        if (Math.abs(dx) < 38 && near) { this.state = 'wind'; this.st = 0; }
        else if (!near || Math.abs(dx) > 220) { this.state = 'idle'; this.st = 0; }
        break;
      case 'wind':
        pose = 'wind';
        if (this.st > 0.55) { this.state = 'swing'; this.st = 0; Sound.play('throw'); }
        break;
      case 'swing':
        pose = 'swing';
        if (this.st < 0.15) {
          const hb = { x: this.x + (this.facing > 0 ? 4 : -34), y: this.y - 50, w: 30, h: 30 };
          if (U.overlap(hb, pl.box)) pl.hurt(12, this.x, world);
        }
        if (this.st > 0.45) { this.state = 'walk'; this.st = 0; }
        break;
      case 'stun':
        pose = 'hurt';
        this.x = U.clamp(this.x + this.vx * dt, this.x1, this.x2); this.vx *= 0.9;
        if (this.st > 0.4) { this.state = 'walk'; this.st = 0; }
        break;
    }
    this.anim = pose || 'stand';
  }
  hit(dmg, dir) {
    if (this.dieT != null) return false;
    this.hp -= dmg; this.flash = 0.12; this.state = 'stun'; this.st = 0; this.vx = dir * 120;
    if (this.hp <= 0) { this.dieT = 0; this.vy = -260; this.vx = dir * 90; G.say(this, U.choice(['Уууу...', 'Я на больничный...', 'Мама...']), 1.4); return true; }
    return false;
  }
  draw(c, cx, cy) {
    const fr = this.anim === 'ko' ? 6 : this.anim === 'swing' ? 5 : 4;
    let x = this.x - cx, y = this.y - cy, rot = 0;
    if (this.anim === 'walk') y -= Math.abs(Math.sin(this.t * 8)) * 2;
    if (this.anim === 'stand') rot = Math.sin(this.t * 2) * 0.05;
    if (this.anim === 'wind') { rot = -0.12; x += Math.sin(this.t * 40) * 1; }
    if (this.anim === 'hurt') rot = -0.2 * this.facing;
    Spr.draw(c, 'enemies', fr, x, y, this.facing, { rot, flash: this.flash > 0 ? '#ffffff' : null });
  }
};

// ---------- падающие предметы (кирпичи, болты, ключи, бутылки) ----------
Game.FALL_KINDS = {
  brick: { dmg: 14, w: 12, h: 8 },
  bolt: { dmg: 8, w: 6, h: 10 },
  wrench: { dmg: 11, w: 8, h: 16 },
  bottle: { dmg: 10, w: 6, h: 14 },
};
Game.Hazard = class {
  constructor(kind, x, y, vx = 0, vy = 0) {
    this.kind = kind; this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.rot = 0; this.vr = U.rand(-8, 8);
    const k = Game.FALL_KINDS[kind] || { dmg: 10, w: 8, h: 8 };
    this.dmg = k.dmg; this.w = k.w; this.h = k.h; this.dead = false; this.deflected = false; this.age = 0; this.grav = GRAV * 0.6;
  }
  get box() { return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h }; }
  update(dt, world, pl) {
    this.age += dt;
    const prevY = this.y;
    this.vy = Math.min(600, this.vy + this.grav * dt);
    this.x += this.vx * dt; this.y += this.vy * dt; this.rot += this.vr * dt;
    if (this.y > world.cam.y + H + 100 || this.x < -40 || this.x > world.w + 40) { this.dead = true; return; }
    if (this.vy > 0 && this.age > 0.05) {
      const g = world.groundAt(this.x, prevY + this.h / 2, this.y + this.h / 2, 2);
      if (g) { this.y = g.y - this.h / 2; this.shatter(world); return; }
    }
    if (!this.deflected && U.overlap(this.box, pl.box)) {
      if (pl.hurt(this.dmg, this.x, world)) this.shatter(world);
    }
    if (this.deflected && world.onDeflectedHazard) world.onDeflectedHazard(this);
  }
  shatter(world) {
    this.dead = true;
    if (this.kind === 'bottle') { Sound.play('glass'); FX.burst(this.x, this.y, 10, { colors: ['#2f8a3a', '#7fd08a', '#e8e8d0'], speed: 140, type: 'shard', size: 2, life: 0.6 }); FX.burst(this.x, this.y, 5, { colors: ['#e8c860'], speed: 60, life: 0.5, grav: 200 }); }
    else if (this.kind === 'brick') { Sound.play('brick'); FX.burst(this.x, this.y, 10, { colors: ['#a8452e', '#7a2e1e', '#c8664a'], speed: 120, size: 3, life: 0.6 }); FX.dust(this.x, this.y, 4); }
    else { Sound.play('clank', this.kind === 'bolt' ? 1.3 : 1); FX.burst(this.x, this.y, 5, { colors: ['#ffd84a', '#fff'], speed: 100, life: 0.3 }); }
  }
  draw(c, cx, cy) { Art.item(c, this.kind, this.x - cx, this.y - cy, this.rot); }
};

// ---------- снаряды Валеры ----------
Game.Proj = class {
  constructor(kind, x, y, dir) {
    this.kind = kind; this.x = x; this.y = y; this.dir = dir; this.t = 0; this.dead = false; this.rot = 0; this.hitSet = new Set();
    if (kind === 'nuts') { this.vx = dir * 430; this.vy = -30; this.dmg = 1; this.grav = 200; }
    if (kind === 'wrench') { this.vx = dir * 330; this.vy = 0; this.dmg = 2; this.grav = 0; this.pierce = true; }
    if (kind === 'bricks') { this.vx = dir * 250; this.vy = -330; this.dmg = 3; this.grav = GRAV * 0.8; }
    if (kind === 'bottles') { this.vx = dir * 300; this.vy = -260; this.dmg = 3; this.grav = GRAV * 0.7; }
  }
  get box() { return { x: this.x - 6, y: this.y - 6, w: 12, h: 12 }; }
  update(dt, world, pl) {
    this.t += dt;
    if (this.kind === 'wrench') {
      // бумеранг: улетает и возвращается
      this.vx -= this.dir * 520 * dt;
      this.vy = (pl.y - 48 - this.y) * (this.t > 0.6 ? 3 : 0);
      this.rot += 18 * dt;
      if (this.t > 0.5 && U.overlap(this.box, pl.box)) { this.dead = true; pl.ammo.wrench++; Sound.play('pickup'); }
      if (this.t > 3) { this.dead = true; pl.ammo.wrench++; }
    } else {
      this.vy += this.grav * dt; this.rot += 12 * dt * this.dir;
    }
    const prevY = this.y;
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.kind === 'wrench' && (this.x < 8 || this.x > world.w - 8)) { this.x = U.clamp(this.x, 8, world.w - 8); if (Math.sign(this.vx) === this.dir) { this.vx = -this.vx * 0.5; this.t = Math.max(this.t, 0.6); } }
    if (this.kind !== 'wrench' && this.vy > 0 && world.groundAt(this.x, prevY, this.y, 2)) { this.dead = true; this.poof(); }
    if (this.kind !== 'wrench' && (this.x < -20 || this.x > world.w + 20 || this.y > world.cam.y + H + 50)) this.dead = true;
  }
  poof() {
    if (this.kind === 'bottles') { Sound.play('glass'); FX.burst(this.x, this.y, 10, { colors: ['#2f8a3a', '#7fd08a', '#e8e0c0'], speed: 130, type: 'shard', size: 2 }); }
    else if (this.kind === 'bricks') { Sound.play('brick'); FX.burst(this.x, this.y, 8, { colors: ['#a8452e', '#7a2e1e'], speed: 100, size: 3 }); }
    else { Sound.play('clank'); FX.burst(this.x, this.y, 4, { colors: ['#ffd84a', '#fff'], speed: 80, life: 0.3 }); }
  }
  draw(c, cx, cy) {
    const k = this.kind === 'nuts' ? 'nut' : this.kind === 'wrench' ? 'wrench' : this.kind === 'bottles' ? 'bottle' : 'brick';
    Art.item(c, k, this.x - cx, this.y - cy, this.rot);
  }
};

// ---------- подбираемые предметы ----------
Game.PICK = {
  pie: { name: 'Пирожок', heal: 15 },
  kefir: { name: 'Кефир', heal: 30 },
  pelmeni: { name: 'Пельмени!', heal: 60 },
  coin: { name: '+100', score: 100 },
  badge: { name: 'Значок «Ударник»!', score: 1000, secret: true },
  nutsbox: { name: 'Гайки +10', ammo: ['nuts', 10] },
  wrenchpk: { name: 'Гаечный ключ', ammo: ['wrench', 1] },
  bricks: { name: 'Кирпичи +4', ammo: ['bricks', 4] },
  beer: { name: 'Пиво! +бутылка', ammo: ['bottles', 2], bottle: 8 },
};
Game.Pickup = class {
  constructor(kind, x, y) { this.kind = kind; this.x = x; this.y = y; this.t = Math.random() * 6; this.dead = false; this.vy = 0; this.falling = false; }
  get box() { return { x: this.x - 8, y: this.y - 16, w: 16, h: 16 }; }
  update(dt, world, pl) {
    this.t += dt;
    if (this.falling) {
      const py = this.y; this.vy = Math.min(500, this.vy + GRAV * 0.6 * dt); this.y += this.vy * dt;
      const g = world.groundAt(this.x, py, this.y, 2); if (g) { this.y = g.y; this.falling = false; this.vy = 0; }
      if (this.y > world.h + 100) this.dead = true;
    }
    if (!pl.dead && U.overlap(this.box, pl.box)) {
      const d = Game.PICK[this.kind];
      this.dead = true;
      if (d.heal) { pl.heal(d.heal); Sound.play('heal'); world.stats.food++; }
      if (d.score) { world.addScore(d.score); Sound.play(d.secret ? 'checkpoint' : 'coin'); if (d.secret) world.stats.secrets++; }
      if (d.bottle) pl.bottleHits = Math.max(pl.bottleHits, 0) + d.bottle;
      if (d.ammo) { const had = pl.ammo[d.ammo[0]]; pl.ammo[d.ammo[0]] += d.ammo[1]; if (had <= 0 && pl.ammo[pl.weapon] <= 0 || had <= 0) pl.weapon = d.ammo[0]; Sound.play('pickup'); }
      FX.popText(this.x, this.y - 24, d.name, d.heal ? '#8cf08c' : d.ammo ? '#8cd0ff' : '#ffd84a');
      if (this.kind === 'pelmeni') G.say(pl, 'Пельмешки!!!', 1.4);
      if (this.kind === 'kefir' && Math.random() < 0.5) G.say(pl, 'Кефирчик — сила!', 1.4);
    }
  }
  draw(c, cx, cy) {
    const bob = Math.sin(this.t * 4) * 2;
    const x = this.x - cx, y = this.y - cy - 9 + bob;
    if (this.kind === 'badge' || this.kind === 'pelmeni') { c.globalAlpha = 0.3 + Math.sin(this.t * 6) * 0.15; c.fillStyle = '#fff6a0'; c.beginPath(); c.arc(x, y, 12, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
    Art.item(c, this.kind, x, y, 0);
  }
};

// ---------- HUD ----------
Game.drawHUD = function (c, pl, world) {
  // портрет
  R(c, 6, 6, 32, 32, '#111'); R(c, 7, 7, 30, 30, '#5a2a10');
  if (G.img.valeraHud) c.drawImage(G.img.valeraHud, 9, 9, 26, 27);
  // здоровье
  R(c, 42, 8, 124, 12, '#111');
  const k = pl.hp / pl.maxHp;
  R(c, 44, 10, 120, 8, '#3a1010');
  R(c, 44, 10, Math.round(120 * k), 8, k > 0.5 ? '#48c048' : k > 0.25 ? '#e0b020' : '#e03030');
  R(c, 44, 10, Math.round(120 * k), 2, 'rgba(255,255,255,0.35)');
  for (let i = 1; i < 10; i++) R(c, 44 + i * 12, 10, 1, 8, 'rgba(0,0,0,0.4)');
  G.text('ВАЛЕРА', 42, 23, { size: 8, color: '#ffb070' });
  // оружие
  R(c, 172, 6, 60, 22, '#111'); R(c, 173, 7, 58, 20, '#23262b');
  const wk = pl.weapon === 'nuts' ? 'nut' : pl.weapon === 'wrench' ? 'wrench' : pl.weapon === 'bottles' ? 'bottle' : 'brick';
  Art.item(c, wk, 186, 17, pl.weapon === 'wrench' ? 0.7 : 0);
  G.text('x' + pl.ammo[pl.weapon], 198, 13, { size: 8, color: pl.ammo[pl.weapon] > 0 ? '#fff' : '#777' });
  if (pl.bottleHits > 0) {
    R(c, 236, 6, 64, 22, '#111'); R(c, 237, 7, 62, 20, '#1c2a1c');
    Art.item(c, 'bottle', 248, 17, -0.6);
    G.text('БЬЁТ ' + pl.bottleHits, 258, 13, { size: 8, color: '#8cf08c' });
  }
  // очки
  G.text('ОЧКИ ' + String(world.score).padStart(6, '0'), W - 8, 8, { size: 8, align: 'right', color: '#ffd84a' });
};

// ---------- клавиши на экране ----------
G.keycap = function (c, x, y, label, pulse = 0) {
  const isArrow = label === 'L' || label === 'R' || label === 'U' || label === 'D';
  const w = isArrow ? 16 : Math.max(16, G.textWidth(label, 8) + 8), h = 16;
  const yy = y - (pulse > 0 ? Math.abs(Math.sin(G.t * 6)) * 2 : 0);
  R(c, x, yy + 2, w, h, '#0c0c0e');
  R(c, x, yy, w, h, '#1c1f24'); R(c, x + 1, yy + 1, w - 2, h - 3, pulse ? '#f4e8c8' : '#d8d4c8'); R(c, x + 1, yy + 1, w - 2, 2, '#fff');
  c.fillStyle = '#1a1a1a';
  const cx = x + w / 2, cy = yy + 7;
  if (label === 'L') { c.beginPath(); c.moveTo(cx - 4, cy); c.lineTo(cx + 3, cy - 4); c.lineTo(cx + 3, cy + 4); c.fill(); }
  else if (label === 'R') { c.beginPath(); c.moveTo(cx + 4, cy); c.lineTo(cx - 3, cy - 4); c.lineTo(cx - 3, cy + 4); c.fill(); }
  else if (label === 'U') { c.beginPath(); c.moveTo(cx, cy - 4); c.lineTo(cx - 4, cy + 3); c.lineTo(cx + 4, cy + 3); c.fill(); }
  else if (label === 'D') { c.beginPath(); c.moveTo(cx, cy + 4); c.lineTo(cx - 4, cy - 3); c.lineTo(cx + 4, cy - 3); c.fill(); }
  else G.text(label, cx, yy + 4, { align: 'center', color: '#1a1a1a', shadow: false });
  return w;
};
Game.keyCaps = function (a) {
  const d = G.Input.lastDevice;
  if (d === 'touch') return { move: ['L', 'R'], jump: ['A'], crouch: ['D'], punch: ['B'], upper: ['B', 'B', 'B'], throw: ['C'], climb: ['U'], switch: ['SW'] }[a];
  if (d === 'gamepad') return { move: ['L', 'R'], jump: ['A'], crouch: ['D'], punch: ['X'], upper: ['X', 'X', 'X'], throw: ['B'], climb: ['U'], switch: ['Y'] }[a];
  return { move: ['L', 'R'], jump: ['Z'], crouch: ['D'], punch: ['X'], upper: ['X', 'X', 'X'], throw: ['C'], climb: ['U'], switch: ['Q'] }[a];
};
Game.capsWidth = caps => caps.reduce((s, k) => s + ((k.length === 1 && 'LRUD'.indexOf(k) >= 0) ? 16 : Math.max(16, G.textWidth(k, 8) + 8)) + 2, 0);

// обучение: список заданий с галочками
Game.Tutorial = class {
  constructor(tasks) { this.tasks = tasks.map(t => Object.assign({ done: false }, t)); this.alpha = 1; this.finishedT = 0; this.hidden = false; }
  ev(id) {
    const cur = this.current;
    if (!cur || cur.id !== id) return;
    cur.done = true; Sound.play('coin');
  }
  update(dt) {
    if (!this.current) { this.finishedT += dt; if (this.finishedT > 2.5) this.alpha = Math.max(0, this.alpha - dt * 2); }
    if (this.hidden) this.alpha = Math.max(0, this.alpha - dt * 2);
  }
  get current() { return this.tasks.find(t => !t.done); }
  draw(c, px, py) {
    if (this.alpha <= 0) return;
    c.save(); c.globalAlpha = this.alpha;
    const x = 6, y = 44, w = 196, h = 22 + this.tasks.length * 19;
    R(c, x, y, w, h, 'rgba(12,14,18,0.82)'); R(c, x, y, w, 2, '#c8a020');
    G.text('ОБУЧЕНИЕ', x + 6, y + 6, { size: 8, color: '#ffd84a' });
    const cur = this.current;
    this.tasks.forEach((t, i) => {
      const ry = y + 20 + i * 19;
      if (t === cur) R(c, x + 2, ry - 2, w - 4, 18, 'rgba(240,106,20,0.25)');
      R(c, x + 6, ry + 2, 10, 10, '#0c0c0e'); R(c, x + 7, ry + 3, 8, 8, t.done ? '#48c048' : '#3a3f45');
      let kx = x + 20;
      for (const k of Game.keyCaps(t.id)) kx += G.keycap(c, kx, ry, k, t === cur ? 1 : 0) + 2;
      G.text(t.text, kx + 3, ry + 4, { size: 8, color: t.done ? '#7a8a7a' : '#f0e8c8' });
    });
    if (!cur) G.text('ОТЛИЧНО! ВПЕРЁД, НА КРАН!', W / 2, 70, { align: 'center', size: 8, color: '#8cf08c', outline: true });
    if (cur && px != null) {
      const caps = Game.keyCaps(cur.id);
      const label = cur.prompt || cur.text;
      const total = Game.capsWidth(caps) + G.textWidth(label, 8) + 8;
      let bx = Math.round(U.clamp(px - total / 2, this.alpha > 0.5 ? 208 : 4, W - total - 4));
      const by = Math.round(Math.max(96, py - 116));
      R(c, bx - 4, by - 5, total + 8, 25, 'rgba(12,14,18,0.85)');
      for (const k of caps) bx += G.keycap(c, bx, by, k, 1) + 2;
      G.text(label, bx + 6, by + 4, { size: 8, color: '#ffd84a' });
    }
    c.restore();
  }
};

// ---------- подсказки обучения ----------
Game.keyName = function (a) {
  const d = G.Input.lastDevice;
  if (d === 'touch') return { left: 'ВЛЕВО', right: 'ВПРАВО', jump: '[A]', punch: '[B]', throw: '[C]', up: 'ВВЕРХ', down: 'ВНИЗ', switch: '[SW]' }[a];
  if (d === 'gamepad') return { left: 'ВЛЕВО', right: 'ВПРАВО', jump: '(A)', punch: '(X)', throw: '(B)', up: 'ВВЕРХ', down: 'ВНИЗ', switch: '(Y)' }[a];
  return { left: 'СТРЕЛКИ', right: '(или A/D)', jump: '[Z]/[ПРОБЕЛ]', punch: '[X]', throw: '[C]', up: '[ВВЕРХ]', down: '[ВНИЗ]', switch: '[Q]' }[a];
};
Game.fmtHint = s => s.replace(/\{(\w+)\}/g, (m, a) => Game.keyName(a) || a);
Game.drawHint = function (c, text, alpha, top) {
  if (alpha <= 0) return;
  c.globalAlpha = Math.min(1, alpha);
  const lines = G.wrap(Game.fmtHint(text), 440, 8);
  const bh = lines.length * 12 + 10, bw = 460, bx = (W - bw) / 2, by = top != null ? top : H - bh - 10;
  R(c, bx - 2, by - 2, bw + 4, bh + 4, '#111'); R(c, bx, by, bw, bh, 'rgba(30,34,40,0.92)'); R(c, bx, by, 4, bh, '#c8a020');
  lines.forEach((l, i) => G.text(l, W / 2, by + 6 + i * 12, { align: 'center', color: '#f0e8c8' }));
  c.globalAlpha = 1;
};
