'use strict';
// ============ УРОВЕНЬ 4: «ДИКИЕ КОШКИ» — клуб, башня с паролем, чёрная комната, байкер, эскорт Вовы ============
const L4 = {};
G.L4 = L4;
L4.GROUND = 300;
L4.img = {};
// анимации персонажей уровня 4 (листы нарисованы лицом ВЛЕВО → flip)
{
  const A = (sheet, fr, fps = 1, o = {}) => Object.assign({ fr: fr.map(i => [sheet, i]), fps }, o);
  const F = { flip: true };
  Spr.ANIM.whip = { stand: A('l4a', [0], 1, F), walk: A('l4a', [1, 0], 5, F), wind: A('l4a', [2], 1, F), attack: A('l4a', [3], 1, F) };
  Spr.ANIM.sailor = { stand: A('l4a', [4], 1, F), walk: A('l4a', [5, 4], 5, F), attack: A('l4a', [6], 1, F), ko: A('l4a', [7], 1, F) };
  Spr.ANIM.sumo = { stand: A('l4b', [0], 1, F), walk: A('l4b', [1], 1, F), air: A('l4b', [2], 1, F), ko: A('l4b', [3], 1, F) };
  Spr.ANIM.bouncy = { stand: A('l4b', [4], 1, F), walk: A('l4b', [5], 1, F), air: A('l4b', [6], 1, F), ko: A('l4b', [7], 1, F) };
  Spr.ANIM.biker = { stand: A('biker', [0], 1, F), run: A('biker', [1, 0], 8, F), jump: A('biker', [2], 1, F), throw: A('biker', [3], 1, F), roar: A('biker', [4], 1, F), hurt: A('biker', [5], 1, F), land: A('biker', [6], 1, F), ko: A('biker', [7], 1, F) };
  Spr.ANIM.zombie = { stand: A('patrons', [4], 1, F), walk: A('patrons', [5, 6], 4, F), attack: A('patrons', [4], 1, F), ko: A('patrons', [7], 1, F) };
  Spr.ANIM.maid = { stand: A('hostess', [0], 1, F), walk: A('hostess', [1, 2], 5, F), beckon: A('hostess', [3], 1, F) };
  Spr.ANIM.nurse = { stand: A('hostess', [4], 1, F), walk: A('hostess', [5, 6], 5, F), shrug: A('hostess', [7], 1, F) };
  Spr.ANIM.vova = { stand: A('vova', [0]), walk: A('vova', [1, 2, 3, 4], 8), hurt: A('vova', [5]), ko: A('vova', [6]), chained: A('vova', [7]) };
}
// скины: набор анимаций и имена поз
L4.SKIN = {
  whip: { set: 'whip', stand: 'stand', walk: 'walk', wind: 'wind', attack: 'attack', hurt: 'stand', ko: 'stand', koRot: true },
  sailor: { set: 'sailor', stand: 'stand', walk: 'walk', attack: 'attack', hurt: 'stand', ko: 'ko' },
  sumo: { set: 'sumo', stand: 'stand', walk: 'walk', air: 'air', attack: 'walk', hurt: 'stand', ko: 'ko' },
  bouncy: { set: 'bouncy', stand: 'stand', walk: 'walk', air: 'air', attack: 'walk', hurt: 'stand', ko: 'ko' },
  zombie: { set: 'zombie', stand: 'stand', walk: 'walk', attack: 'attack', hurt: 'stand', ko: 'ko' },
  biker: { set: 'biker', stand: 'stand', walk: 'run', jump: 'jump', attack: 'throw', hurt: 'hurt', ko: 'ko', throw: 'throw', shout: 'roar', land: 'land' },
  vova: { set: 'vova', stand: 'stand', walk: 'walk', hurt: 'hurt', ko: 'ko', chained: 'chained' },
};
Object.assign(WHO, {
  vova: { name: 'ВОВА', color: '#8cd0ff', voice: 250 },
  maid: { name: 'ГОРНИЧНАЯ', color: '#ff9ad0', voice: 380 },
  nurse: { name: 'МЕДСЕСТРА', color: '#ffd0e0', voice: 400 },
  hatch: { name: '??? ИЗ ЛЮКА', color: '#c0c0c0', voice: 120 },
  biker: { name: 'БАЙКЕР', color: '#ff7040', voice: 110 },
});
L4.load = async function () {
  const W3 = window.WALLS3 || {};
  await Promise.all(['club_lobby', 'club_hall', 'club_vip'].map(async k => { if (W3[k]) L3.img[k] = await G.loadImage(W3[k].img); }));
  await Promise.all(['club_back', 'club_floor', 'biker_bg', 'club_room'].map(async k => { L4.img[k] = await G.loadImage('assets/' + k + '.jpg'); }));
  G.portraits = G.portraits || {};
  await Promise.all(['maid', 'nurse', 'vova', 'biker'].map(async k => { G.portraits[k] = await G.loadImage('assets/spr/p_' + k + '.png'); }));
};

// ---------- Валера с «Осеменителем 3000» (пока — старые кадры с автоматом и баком) ----------
Spr.ANIM.valera3gun = Object.assign({}, Spr.ANIM.valera3, {
  stand: { fr: [['v5_gun', 0]], fps: 1 }, angry: { fr: [['v5_gun', 0]], fps: 1 },
  run: { fr: [1, 2, 3, 4].map(i => ['v5_gun', i]), fps: 10 }, walk: { fr: [1, 2, 3, 4].map(i => ['v5_gun', i]), fps: 7 },
  shoot: { fr: [['v5_gun', 5]], fps: 1 }, jump: { fr: [['v5_gun', 6]], fps: 1 }, fall: { fr: [['v5_gun', 6]], fps: 1 },
  crouch: { fr: [['v5_gun', 7]], fps: 1 }, land: { fr: [['v5_gun', 7]], fps: 1 },
});
Game.PICK.seedgun = { name: '«ОСЕМЕНИТЕЛЬ 3000»!', special: 'seedgun' };
Game.PICK.tank = { name: 'Бак +60', ammo3: ['seed', 60] };
L4.WNAME = { swatter: 'МУХОБОЙКА', chalk: 'МЕЛОК', seed: 'ОСЕМЕНИТЕЛЬ 3000' };
L4.Player = class extends L3.Player {
  constructor(x, y) { super(x, y); this.ammo3.seed = 0; this.hasSeed = false; this.green = false; }
  switchWeapon() {
    const order = ['swatter', 'chalk', 'seed'];
    let i = order.indexOf(this.weapon);
    for (let k = 1; k <= 3; k++) { const n = order[(i + k) % 3]; if (n === 'swatter' || (n === 'seed' ? this.hasSeed && this.ammo3.seed > 0 : this.ammo3[n] > 0)) { this.weapon = n; Sound.play('select'); FX.popText(this.x, this.y - 96, L4.WNAME[n], '#ffd84a'); return; } }
  }
  attackUpdate(dt, world, ctl, I) {
    this.animSet = this.weapon === 'seed' ? 'valera3gun' : 'valera3';
    if (this.weapon === 'seed') {
      if (this.fireT > 0) this.fireT -= dt;
      if (this.shootT > 0) this.shootT -= dt;
      if (ctl && I.pressed('switch')) { this.switchWeapon(); return; }
      if (this.ammo3.seed <= 0) { this.weapon = 'swatter'; return; }
      if (ctl && I.held('punch') && this.fireT <= 0) {
        // пять струй веером; вверх — веер задирается
        this.fireT = this.green ? 0.2 : 0.26; this.ammo3.seed--; this.shootT = 0.2;
        const up = I.held('up'), base = up ? (I.held('left') || I.held('right') ? -0.8 : -1.45) : 0;
        for (const a of [-0.34, -0.17, 0, 0.17, 0.34]) {
          const ang = base + a, sp = 480;
          const s = new L3.Shot('juice', this.x + this.facing * 30, this.y - (this.crouch ? 28 : 48), this.facing);
          s.vx = Math.cos(ang) * sp * this.facing; s.vy = Math.sin(ang) * sp; if (up && base < -1.2) s.vx = Math.sin(a) * sp * 0.6 + this.facing * 20;
          s.grav = 120; s.dmg = this.green ? 2 : 1; s.green = this.green; s.seed = true; s.pierce = this.green ? 1 : 0;
          world.projs.push(s);
        }
        Sound.play('squeak');
      }
      return;
    }
    super.attackUpdate(dt, world, ctl, I);
  }
  choosePose(dt) { if (this.weapon === 'seed' && this.shootT > 0 && this.onGround && Math.abs(this.vx) < 20 && !this.crouch && this.hurtT <= 0) { this.setAnim('shoot'); return; } super.choosePose(dt); }
};
// струя зелёная после смены режима бака
{
  const drawOld = L3.Shot.prototype.draw;
  L3.Shot.prototype.draw = function (c, cx) {
    if (this.kind === 'juice' && this.seed) { c.save(); c.translate(this.x - cx, this.y); c.rotate(Math.atan2(this.vy, this.vx) + Math.PI); if (this.green) Spr.drawC(c, 'moth2', 4, 0, 0, 0, 0.55); else Spr.draw(c, 'moth2', 4, 0, 3, 1, { scale: 0.55, flash: '#f6f6ee' }); c.restore(); return; }
    drawOld.call(this, c, cx);
  };
}
L4.drawHUD = function (c, pl, wd) {
  L3.drawHUD(c, pl, wd);
  if (pl.hasSeed) {
    const x = 336, sel = pl.weapon === 'seed';
    Art.R(c, x - 1, 5, 64, 24, sel ? '#ffd84a' : '#111'); Art.R(c, x, 6, 62, 22, sel ? '#3a3020' : '#1c1f24');
    G.text('О-3000', x + 31, 9, { size: 8, align: 'center', color: pl.green ? '#9cff60' : '#f4f0e4' });
    G.text(String(pl.ammo3.seed), x + 31, 18, { size: 8, align: 'center', color: '#fff' });
  }
};

// ---------- враги ----------
L4.FOE = {
  whip: { hp: 5, w: 26, h: 80, speed: 95, reach: 54, dmg: 10, score: 250, lines: ['Плохой мальчик!', 'На колени, рыжий!', 'Сейчас отшлёпаю!'] },
  sailor: { hp: 4, w: 26, h: 80, speed: 70, ranged: true, dmg: 8, score: 250, lines: ['Полундра!', 'Лови фуражку, юнга!', 'Свистать всех наверх!'] },
  sumo: { hp: 12, w: 50, h: 96, speed: 55, bounce: true, dmg: 14, score: 450, lines: ['Хаккейо-о-о!', 'Раздавлю, как пельмень!'] },
  bouncy: { hp: 7, w: 40, h: 84, speed: 80, bounce: true, dmg: 10, score: 300, lines: ['Прыг-скок, красавчик!', 'Иди к мамочке!'] },
  zombie: { hp: 3, w: 26, h: 80, speed: 52, reach: 34, dmg: 7, score: 150, lines: ['Ы-ы-ы... танцуем...', 'Мозги-и... и коктейль...'] },
  eyes: { hp: 2, w: 30, h: 22, speed: 70, dark: true, dmg: 8, score: 200, lines: [] },
};
L4.Foe = class {
  constructor(type, x, y, o = {}) {
    const d = L4.FOE[type];
    Object.assign(this, { type, d, x, y, facing: -1, hp: Math.round(d.hp * (o.hpMul || 1)), st: 0, t: Math.random() * 5, state: 'idle', vx: 0, vy: 0, flash: 0, dieT: null, dead: false, cool: 0.8 + Math.random(), score: d.score, headH: d.h + 14, voice: 250 + Math.random() * 150, said: false, onGround: true }, o);
    if (d.dark) { this.baseY = y; }
  }
  get box() { const d = this.d; return d.dark ? { x: this.x - d.w / 2, y: this.y - d.h / 2, w: d.w, h: d.h } : { x: this.x - d.w / 2, y: this.y - d.h, w: d.w, h: d.h }; }
  set(s) { this.state = s; this.st = 0; }
  hit(dmg, dir) {
    if (this.dieT != null) return false;
    this.hp -= dmg; this.flash = 0.12;
    if (this.hp <= 0) { this.dieT = 0; this.vx = dir * 140; this.vy = -220; Sound.play('squeak'); return true; }
    if (!this.d.bounce && !this.d.dark) { this.set('hurt'); this.vx = dir * 110; }
    return false;
  }
  target(r) { // ближайшая цель: Валера или Вова (при эскорте)
    const pl = r.player, v = r.vova;
    if (v && !v.dead && (pl.dead || Math.abs(v.x - this.x) < Math.abs(pl.x - this.x))) return v;
    return pl;
  }
  fall(dt, wd) {
    const py = this.y; this.vy = Math.min(700, this.vy + 1500 * dt); this.y += this.vy * dt;
    const g = wd.groundAt(this.x, py, this.y, 4);
    if (g && this.vy > 0) { this.y = g.y; this.vy = 0; this.onGround = true; return true; }
    this.onGround = false; return false;
  }
  update(dt, r) {
    const wd = r.world, d = this.d;
    this.t += dt; this.st += dt; if (this.flash > 0) this.flash -= dt; this.cool -= dt;
    if (this.dieT != null) { this.dieT += dt; this.x += this.vx * dt; this.vx *= 0.95; if (!d.dark) this.fall(dt, wd); else this.y += 60 * dt; if (this.dieT > 1.6) this.dead = true; return; }
    const tg = this.target(r), dx = tg.x - this.x, adx = Math.abs(dx);
    const aware = adx < 400 && Math.abs(tg.y - this.y) < 140 && !tg.dead;
    const face = () => { this.facing = dx > 0 ? 1 : -1; };
    const talk = () => { if (!this.said && d.lines.length && Math.random() < 0.6) { this.said = true; G.say(this, U.choice(d.lines), 1.6); } };
    const hurtT = (dmg, from) => { if (tg.hurt) tg.hurt(dmg, from, wd); };
    if (this.state === 'hurt') { this.x += this.vx * dt; this.vx *= 0.85; this.fall(dt, wd); if (this.st > 0.3) this.set('chase'); return; }
    if (d.dark) { // глаза во тьме: подплывают и кидаются
      if (!aware) { this.y = this.baseY + Math.sin(this.t * 2) * 10; return; }
      face();
      if (this.state === 'lunge') { this.x += this.vx * dt; this.y += this.vy * dt; if (U.overlap(this.box, tg.box)) hurtT(d.dmg, this.x); if (this.st > 0.5) { this.set('idle'); this.cool = U.rand(1.4, 2.4); } return; }
      this.x += U.clamp(dx, -d.speed, d.speed) * dt * 0.6; this.y = U.lerp(this.y, tg.y - 60 + Math.sin(this.t * 3) * 20, dt);
      if (this.cool <= 0 && adx < 160) { this.set('lunge'); const a = Math.atan2(tg.y - 50 - this.y, dx); this.vx = Math.cos(a) * 260; this.vy = Math.sin(a) * 260; Sound.play('squeak'); }
      return;
    }
    this.fall(dt, wd);
    if (!aware) { this.state = 'idle'; return; }
    talk();
    if (d.bounce) { // прыгает мячиком и пытается придавить
      face();
      if (this.onGround) {
        this.vx *= 0.8;
        if (this.cool <= 0) { this.vy = this.type === 'sumo' ? -520 : -460; this.vx = U.clamp(dx * 1.4, -230, 230); this.onGround = false; this.cool = U.rand(0.6, 1.2); Sound.play('jump'); this.air = true; }
        else if (this.air) { this.air = false; G.shake(this.type === 'sumo' ? 6 : 3, 0.25); Sound.play('stomp'); FX.dust(this.x, this.y, 8); if (Math.abs(tg.x - this.x) < d.w && Math.abs(tg.y - this.y) < 30) hurtT(d.dmg, this.x); }
      } else { this.x += this.vx * dt; if (this.vy > 0 && U.overlap(this.box, tg.box)) hurtT(d.dmg, this.x); }
      return;
    }
    if (d.ranged) { // держит дистанцию и кидает фуражки
      face();
      const want = adx < 150 ? -1 : adx > 240 ? 1 : 0;
      this.x += this.facing * want * d.speed * dt; this.moving = want !== 0;
      if (this.cool <= 0 && adx < 330) { this.set('throw'); this.cool = U.rand(1.6, 2.4); const T = 0.8; r.world.globs.push(new L4.Missile('cap', this.x + this.facing * 14, this.y - 60, dx / T, -300)); Sound.play('throw'); }
      if (this.state === 'throw' && this.st > 0.35) this.set('chase');
      return;
    }
    // ближний бой (плётка, зомби)
    face();
    if (this.state === 'wind') { if (this.st > 0.35) { this.set('attack'); Sound.play('punch'); } return; }
    if (this.state === 'attack') { if (this.st < 0.15) { const hb = { x: this.x + (this.facing > 0 ? 4 : -d.reach), y: this.y - 64, w: d.reach, h: 44 }; if (U.overlap(hb, tg.box)) hurtT(d.dmg, this.x); } if (this.st > 0.4) { this.set('chase'); this.cool = 0.6; } return; }
    if (adx > d.reach * 0.7) { this.x += this.facing * d.speed * dt; this.moving = true; } else this.moving = false;
    if (adx < d.reach && this.cool <= 0 && Math.abs(tg.y - this.y) < 40) this.set('wind');
  }
  draw(c, cx, cy, dark) {
    const x = this.x - cx, y = this.y - cy;
    if (this.d.dark) { L4.drawEyes(c, x, y, this.facing, this.dieT != null ? 1 - this.dieT / 1.6 : 1, this.state === 'lunge'); return; }
    const sk = L4.SKIN[this.type] || L4.SKIN.whip, s = this.state;
    const bounceAir = this.d.bounce && !this.onGround, crouch = this.d.bounce && this.onGround && this.cool < 0.25;
    const anim = this.dieT != null ? sk.ko : s === 'hurt' ? sk.hurt : s === 'wind' ? (sk.wind || sk.attack) : s === 'attack' || s === 'throw' ? sk.attack : bounceAir ? sk.air : crouch ? sk.walk : this.moving ? sk.walk : sk.stand;
    const alpha = this.dieT != null && this.dieT > 1.1 ? (1.6 - this.dieT) / 0.5 : 1;
    const rot = this.dieT != null && sk.koRot ? -this.facing * Math.min(1.4, this.dieT * 5) : 0;
    Spr.drawAnim(c, sk.set, anim, this.t, x, y, this.facing, { flash: this.flash > 0 ? '#ffffff' : null, alpha, rot });
  }
};
// глаза в темноте (временно — кодом; заменятся нарисованными)
L4.drawEyes = function (c, x, y, facing, a = 1, angry, hero) {
  c.save(); c.globalAlpha = a;
  const blink = !hero && (G.t * 0.7 + x * 0.01) % 3 < 0.08;
  if (!blink) Spr.drawC(c, 'l4fx', hero ? 2 : angry ? 1 : 0, x, y, 0, hero ? 0.8 : 1);
  c.restore();
};
// снаряды: фуражка, игрушка байкера, радуга
L4.Missile = class {
  constructor(kind, x, y, vx, vy) { Object.assign(this, { kind, x, y, vx, vy, dead: false, t: 0, rot: 0 }); }
  update(dt, wd, pl, floorY = L4.GROUND, r) {
    this.t += dt; this.vy += 800 * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.rot += dt * 10;
    const tgs = [pl, r && r.vova].filter(v => v && !v.dead);
    for (const tg of tgs) if (U.overlap({ x: this.x - 8, y: this.y - 8, w: 16, h: 16 }, tg.box)) { this.dead = true; tg.hurt(this.kind === 'toy' ? 10 : 8, this.x, wd); FX.burst(this.x, this.y, 5, { colors: ['#fff', '#ddd'], speed: 80, life: 0.3 }); return; }
    if (this.y > floorY || this.t > 3) { this.dead = true; FX.dust(this.x, floorY, 4); }
  }
  draw(c, cx, cy = 0) { Spr.drawC(c, 'l4fx', this.kind === 'cap' ? 3 : 4, this.x - cx, this.y - cy, this.kind === 'cap' ? this.rot * 0.3 : Math.sin(this.rot) * 0.4, 1); }
};

// ---------- мирные посетители (танцуют, машут) ----------
L4.Patron = class {
  constructor(x, o = {}) { Object.assign(this, { x, y: L4.GROUND, t: Math.random() * 6, facing: Math.random() < 0.5 ? 1 : -1, home: x, dance: Math.random() < 0.5, headH: 90, voice: 300 + Math.random() * 100, said: false, fr: U.randi(0, 3) }, o); }
  update(dt, r) {
    this.t += dt;
    if (!this.dance) { this.x = this.home + Math.sin(this.t * 0.5) * 40; this.facing = Math.cos(this.t * 0.5) > 0 ? 1 : -1; }
    const pl = r.player;
    if (!this.said && Math.abs(pl.x - this.x) < 70 && Math.random() < dt * 2) { this.said = true; G.say(this, U.choice(r.patronLines || ['Приве-е-ет, рыжий!', 'Классная каска!', 'Потанцуем?', 'Бар — налево!']), 1.8); }
  }
  draw(c, cx, cy = 0) {
    const x = this.x - cx; if (x < -80 || x > W + 80) return;
    // танец: подпрыгивание и покачивание в ритм музыки
    const beat = Math.abs(Math.sin(this.t * 4.2)), bob = this.dance ? -beat * 4 : -Math.abs(Math.sin(this.t * 6)) * 2;
    c.save(); c.translate(x, this.y - cy + bob); c.rotate(this.dance ? Math.sin(this.t * 2.1) * 0.08 : 0); c.scale(1, this.dance ? 1 - beat * 0.03 : 1);
    Spr.draw(c, 'patrons', this.fr, 0, 0, this.facing);
    c.restore();
  }
};

// ---------- горничная ведёт Валеру через клуб к кулисам ----------
L4.Guide = class {
  constructor(st) { Object.assign(this, { st, x: 330, y: L4.GROUND, t: 0, facing: 1, headH: 96, voice: 380, said: 0 }); }
  update(dt, st) {
    this.t += dt; const pl = st.player, target = L4.DOOR_X - 90;
    const gap = this.x - pl.x;
    if (this.x < target && gap < 160) { this.x += 70 * dt; this.moving = true; this.facing = 1; } else { this.moving = false; this.facing = pl.x > this.x ? 1 : -1; }
    const lines = [[1500, 'Не отставай, красавчик.'], [3200, 'Руками ничего не трогать!'], [5200, 'Почти пришли.'], [target - 2, 'Вова — там, за железной дверью. Только тебя не пустят без пароля. Хи-хи.']];
    if (this.said < lines.length && this.x >= lines[this.said][0]) { G.say(this, lines[this.said][1], 2.6); this.said++; if (this.said === lines.length) st.level.guided = true; }
  }
  draw(c, cx, cy = 0) { Spr.drawAnim(c, 'maid', this.moving ? 'walk' : this.said >= 4 ? 'beckon' : 'stand', this.t, this.x - cx, this.y - cy, this.facing); }
};
// ---------- Вова (эскорт) ----------
L4.Vova = class {
  constructor(x, y) { Object.assign(this, { x, y, vx: 0, vy: 0, facing: 1, hp: 100, maxHp: 100, dead: false, hurtT: 0, inv: 0, t: 0, headH: 92, voice: 250 }); }
  get box() { return { x: this.x - 12, y: this.y - 80, w: 24, h: 80 }; }
  hurt(dmg, from) {
    if (this.dead || this.inv > 0) return false;
    this.hp -= Math.round(dmg * (G.DMG_MULT || 1) * 0.8); this.inv = 0.8; this.hurtT = 0.3; this.vx = (this.x > from ? 1 : -1) * 120;
    Sound.play('hurt'); if (Math.random() < 0.5) G.say(this, U.choice(['Ай! Валера, прикрой!', 'Они кусаются!', 'Я слишком молод!']), 1.2);
    if (this.hp <= 0) { this.hp = 0; this.dead = true; }
    return true;
  }
  update(dt, r) {
    const pl = r.player, wd = r.world; this.t += dt; if (this.inv > 0) this.inv -= dt; if (this.hurtT > 0) this.hurtT -= dt;
    if (this.dead) return;
    const want = pl.x - pl.facing * 46, d = want - this.x;
    if (this.hurtT > 0) this.x += this.vx * dt;
    else if (Math.abs(d) > 12) { this.x += Math.sign(d) * Math.min(Math.abs(d) * 3, 175) * dt; this.facing = Math.sign(d); this.moving = true; } else this.moving = false;
    const py = this.y; this.vy = Math.min(700, this.vy + 1500 * dt); this.y += this.vy * dt;
    const g = wd.groundAt(this.x, py, this.y, 4); if (g && this.vy > 0) { this.y = g.y; this.vy = 0; }
  }
  draw(c, cx, cy = 0) {
    const sk = L4.SKIN.vova;
    if (this.inv > 0 && (G.t * 20 | 0) % 2) return;
    Spr.drawAnim(c, sk.set, this.dead ? sk.ko : this.hurtT > 0 ? sk.hurt : this.moving ? sk.walk : sk.stand, this.t, this.x - cx, this.y - cy, this.facing);
  }
};

// =====================================================================
// СЦЕНЫ-ЛОКАЦИИ: club (клуб), tower (5 этажей), room (комната), inner (за железной дверью), escort
// =====================================================================
L4.BACK_X = 6100; L4.CLUB_W = 6740; L4.DOOR_X = 6660; L4.STAIRS_X = 6520;
L4.INNER_W = 7200; L4.DARK_X0 = 3500; L4.LEVER_X = 7000;
L4.ZONES = {
  club: [{ name: 'РЕСЕПШЕН', x0: 0, x1: 1400, wall: 'club_lobby' }, { name: 'ТАНЦПОЛ', x0: 1400, x1: 6100, wall: 'club_hall' }, { name: 'ЗА КУЛИСАМИ', x0: 6100, x1: 6740, wall: 'club_back' }],
  inner: [{ name: 'VIP-ЛАУНЖ', x0: 0, x1: 3500, wall: 'club_vip' }, { name: 'ЧЁРНАЯ КОМНАТА', x0: 3500, x1: 7200, wall: 'wall_corridor' }],
};
L4.Stage = class {
  constructor(level, kind, o = {}) {
    this.level = level; this.kind = kind; this.o = o;
    const W = kind === 'club' ? L4.CLUB_W : kind === 'inner' ? L4.INNER_W : kind === 'tower' ? 640 : 640;
    const wd = this.world = new Game.World(W, kind === 'tower' ? L4.TOWER_H : H);
    this.W = W;
    wd.stats = level.stats; wd.score = level.score; wd.addScore = n => { wd.score += n; level.score = wd.score; };
    wd.globs = []; wd.clouds = []; wd.pickups = []; wd.enemies = [];
    wd.playerAttack = (hb, dmg, atk, pl) => this.playerAttack(hb, dmg, atk, pl);
    this.patrons = []; this.doors = []; this.fade = 1; this.hint = null; this.hintA = 0; this.hintT = 0; this.zoneIdx = -1; this.zoneT = 0; this.vova = null; this.dark = false;
    L4.BUILD[kind].call(this, wd, o);
    const pl = this.player = new L4.Player(o.x != null ? o.x : 80, o.y != null ? o.y : L4.GROUND);
    if (level.carry) { Object.assign(pl.ammo3, level.carry.ammo3); pl.hasSeed = level.carry.hasSeed; pl.green = level.carry.green; pl.weapon = level.carry.weapon; pl.hp = Math.max(level.carry.hp || pl.hp, 40); }
    if (o.facing) pl.facing = o.facing;
    this.respawn = { x: pl.x, y: pl.y };
    this.camTo(true);
  }
  carry() { const p = this.player; this.level.carry = { ammo3: Object.assign({}, p.ammo3), hasSeed: p.hasSeed, green: p.green, weapon: p.weapon, hp: p.hp }; }
  say(text, t = 5) { this.hint = text; this.hintT = t; }
  playerAttack(hb, dmg, atk, pl) {
    const wd = this.world;
    if (this.boss && this.boss.dieT == null && !atk.hit.has(this.boss) && U.overlap(hb, this.boss.box)) { atk.hit.add(this.boss); this.boss.takeHit(dmg, pl.x, true); }
    for (const e of wd.enemies) {
      if (atk.hit.has(e) || e.dieT != null) continue;
      if (U.overlap(hb, e.box)) {
        atk.hit.add(e);
        const killed = e.hit(dmg, pl.facing);
        Sound.play('hit'); G.hitStop = 0.04; G.shake(2, 0.1);
        if (killed) { wd.addScore(e.score); wd.stats.kills++; FX.popText(e.x, e.y - 50, '+' + e.score); }
      }
    }
  }
  camTo(snap) {
    const wd = this.world, pl = this.player;
    const tx = U.clamp(pl.x - W * 0.42 + pl.facing * 24, 0, Math.max(0, this.W - W));
    const ty = this.kind === 'tower' ? U.clamp(pl.y - 230, 0, L4.TOWER_H - H) : 0;
    wd.cam.x = snap ? tx : U.lerp(wd.cam.x, tx, 0.12); wd.cam.y = snap ? ty : U.lerp(wd.cam.y, ty, 0.12);
  }
  update(dt) {
    const wd = this.world, pl = this.player, I = G.Input;
    wd.t += dt; this.level.stats.time += dt;
    if (this.fade > 0) this.fade = Math.max(0, this.fade - dt * 2);
    wd.updatePlats(dt);
    if (!this.frozen) pl.update(dt, wd);
    pl.x = U.clamp(pl.x, 12, this.W - 12);
    for (const p of wd.projs) {
      p.update(dt, wd);
      if (p.dead) continue;
      if (this.boss && this.boss.dieT == null && U.overlap(p.box, this.boss.box)) { this.boss.takeHit(p.dmg, p.x - p.vx, false); p.dead = true; p.poof(); continue; }
      for (const e of wd.enemies) if (e.dieT == null && !(p.hitSet && p.hitSet.has(e)) && U.overlap(p.box, e.box)) {
        const killed = e.hit(p.dmg, Math.sign(p.vx) || 1); Sound.play('hit');
        if (killed) { wd.addScore(e.score); wd.stats.kills++; FX.popText(e.x, e.y - 50, '+' + e.score); }
        if (p.pierce > 0) { p.pierce--; (p.hitSet || (p.hitSet = new Set())).add(e); } else { p.dead = true; p.poof(); break; }
      }
    }
    wd.projs = wd.projs.filter(p => !p.dead && p.x > wd.cam.x - 60 && p.x < wd.cam.x + W + 60);
    for (const e of wd.enemies) if (e.update) e.update(dt, this);
    wd.enemies = wd.enemies.filter(e => !e.dead);
    for (const g of wd.globs) g.update(dt, wd, pl, this.floorOf ? this.floorOf(g.x, g.y) : L4.GROUND, this);
    wd.globs = wd.globs.filter(g => !g.dead);
    for (const p of wd.pickups) p.update(dt, wd, pl);
    wd.pickups = wd.pickups.filter(p => !p.dead);
    for (const p of this.patrons) p.update(dt, this);
    if (this.vova) this.vova.update(dt, this);
    if (this.onUpdate) this.onUpdate(dt);
    // двери: {up} у двери
    this.nearDoor = null;
    for (const d of this.doors) if (Math.abs(pl.x - d.x) < 26 && Math.abs(pl.y - d.y) < 10 && pl.onGround) this.nearDoor = d;
    if (this.nearDoor && I.pressed('up') && pl.controls && !pl.dead) this.nearDoor.use(this);
    // зоны
    const zs = L4.ZONES[this.kind];
    if (zs) { const zi = zs.findIndex(z => pl.x >= z.x0 && pl.x < z.x1); if (zi !== this.zoneIdx) { this.zoneIdx = zi; this.zoneT = 2.2; } if (this.zoneT > 0) this.zoneT -= dt; }
    if (this.hintT > 0) { this.hintT -= dt; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
    // смерть
    if (pl.dead && pl.deadT > 1.6 && !this.respawning) {
      this.respawning = true; this.level.stats.deaths++;
      setTimeout(() => { this.respawning = false; this.level.restartStage(); }, 300);
    }
    if (this.vova && this.vova.dead && !this.lost) { this.lost = true; pl.controls = false; G.say(this.vova, 'Валера-а-а... я всё...', 2); setTimeout(() => this.level.vovaDied(), 1800); }
    this.camTo(false);
  }
  draw(c) {
    const wd = this.world, cx = Math.round(wd.cam.x), cy = Math.round(wd.cam.y);
    c.fillStyle = '#0d0a10'; c.fillRect(0, 0, W, H);
    c.save(); c.imageSmoothingEnabled = false;
    L4.DRAW_BG[this.kind].call(this, c, cx, cy);
    for (const d of this.doors) d.draw(c, cx, cy, this.nearDoor === d);
    for (const p of wd.pickups) p.draw(c, cx, cy);
    for (const p of this.patrons) p.draw(c, cx, cy);
    const dark = this.dark && this.player.x > L4.DARK_X0 - 40;
    for (const e of wd.enemies) if (!dark || !e.d || e.d.dark) e.draw(c, cx, cy, dark);
    if (this.boss) this.boss.draw(c, cx, cy);
    if (this.vova) this.vova.draw(c, cx, cy);
    this.player.draw(c, cx, cy);
    for (const g of wd.globs) g.draw(c, cx, cy);
    c.save(); c.translate(0, -cy); for (const p of wd.projs) p.draw(c, cx); c.restore();
    c.save(); c.translate(-cx, -cy); FX.draw(c); c.restore();
    if (dark) this.drawDark(c, cx, cy);
    G.drawBubbles(c, cx, cy);
    c.restore();
    L4.drawHUD(c, this.player, wd);
    if (this.vova) { Art.R(c, 440, 34, 190, 12, '#111'); Art.R(c, 442, 36, Math.round(186 * this.vova.hp / this.vova.maxHp), 8, '#5ab8ff'); G.text('ВОВА', 436, 35, { align: 'right', size: 8, color: '#8cd0ff' }); }
    const zs = L4.ZONES[this.kind];
    if (zs && this.zoneT > 0 && this.zoneIdx >= 0) G.bigTitle(c, zs[this.zoneIdx].name, Math.min(1, this.zoneT), { size: 24, y: 110, color: '#ff8ad8' });
    if (this.nearDoor && this.nearDoor.label) G.text(this.nearDoor.label + '  [ВВЕРХ]', W / 2, H - 28, { align: 'center', color: '#ffd84a', outline: true });
    if (this.hint) Game.drawHint(c, this.hint, this.hintA);
    if (this.fade > 0) { c.fillStyle = `rgba(0,0,0,${this.fade})`; c.fillRect(0, 0, W, H); }
  }
  // чёрная комната: всё черно, видны только глаза (врагов и Валеры) и вспышки выстрелов
  drawDark(c, cx, cy) {
    const wd = this.world, pl = this.player;
    c.fillStyle = 'rgba(0,0,0,0.97)'; c.fillRect(0, 0, W, H);
    c.save(); c.translate(0, -cy); for (const p of wd.projs) p.draw(c, cx); c.restore();
    for (const e of wd.enemies) if (e.d && e.d.dark) e.draw(c, cx, cy, true);
    const scared = Math.sin(G.t * 9) * 1;
    L4.drawEyes(c, pl.x - cx + pl.facing * 4, pl.y - cy - 70 + scared, pl.facing, 1, false, true);
  }
};
// ---------- двери ----------
L4.Door = class {
  constructor(x, y, label, use, o = {}) { Object.assign(this, { x, y, label, use, sprite: o.sprite || 'door', done: false }, o); }
  draw(c, cx, cy, near) {
    const x = this.x - cx, y = this.y - cy;
    if (x < -80 || x > W + 80) return;
    if (this.sprite === 'door') Spr.draw(c, 'f_corr', 5, x, y + 2, 1, { scale: 0.85, alpha: this.done ? 0.55 : 1 });
    if (this.tag) G.text(this.tag, x, y - 112, { align: 'center', size: 8, color: this.done ? '#6a6e74' : '#ffd84a', outline: true });
    if (near) G.text('▲', x, y - 124, { align: 'center', size: 8, color: '#fff' });
  }
};

// ---------- постройка локаций ----------
L4.BOSS_G = 296; L4.TOWER_FH = 300; L4.TOWER_H = 5 * L4.TOWER_FH + 60;
L4.floorY = i => L4.TOWER_H - 40 - i * L4.TOWER_FH;
L4.BUILD = {
  club(wd, o) {
    wd.addPlat({ x: 0, y: L4.GROUND, w: L4.CLUB_W, h: 60, oneway: false, look: 'none' });
    // сцена с шестами — платформа, барная стойка
    this.poles = [2060, 2140, 3260, 3340, 4460, 4540];
    for (let x = 400; x < 5500; x += U.randi(170, 260)) this.patrons.push(new L4.Patron(x, { dance: x > 1400 || Math.random() < 0.3 }));
    // выход наверх — в башню с комнатами
    this.doors.push(new L4.Door(L4.STAIRS_X, L4.GROUND, 'ЛЕСТНИЦА НАВЕРХ', st => st.level.enterTower(), { sprite: 'none' }));
    this.doors.push(new L4.Door(L4.DOOR_X, L4.GROUND, 'ЖЕЛЕЗНАЯ ДВЕРЬ', st => st.level.metalDoor(), { sprite: 'none' }));
    // горничная ведёт к кулисам
    if (!o.escort && !o.scene && !this.level.guided) this.patrons.push(new L4.Guide(this));
    // эскорт назад: зомби
    if (o.escort) { for (let x = 600; x < 6400; x += U.randi(260, 420)) wd.enemies.push(new L4.Foe('zombie', x, L4.GROUND)); this.patrons = []; }
    this.patronLines = ['Приве-е-ет, рыжий!', 'Классная каска!', 'Потанцуем?', 'Бар — налево!', 'Ты к кому, красавчик?'];
  },
  tower(wd) {
    const lv = this.level; // лестницы нарисованы на фоне по краям
    for (let i = 0; i < 5; i++) {
      const y = L4.floorY(i), lx = i % 2 ? 604 : 36;
      if (i === 0) wd.addPlat({ x: 0, y, w: 640, h: 60, oneway: false, look: 'none' });
      else wd.addPlat({ x: 0, y, w: 640, h: 10, oneway: true, look: 'none' });
      if (i < 4) wd.ladders.push({ x: lx - 8, y: L4.floorY(i + 1), w: 16, h: L4.TOWER_FH });
      // три двери в комнаты
      [165, 320, 475].forEach((x, k) => {
        const id = i * 3 + k, room = lv.rooms[id];
        this.doors.push(new L4.Door(x, y, 'КОМНАТА ' + (i + 1) + '0' + (k + 1), st => st.level.enterRoom(id), { tag: room.cleared ? 'ПУСТО' : (i + 1) + '0' + (k + 1), done: room.cleared, sprite: 'none' }));
      });
    }
    this.doors.push(new L4.Door(560, L4.floorY(0), 'ВЫХОД В КЛУБ', st => st.level.leaveTower(), { tag: 'ВЫХОД', sprite: 'none' }));
  },
  room(wd, o) {
    const r = o.room;
    wd.addPlat({ x: 0, y: L4.GROUND, w: 640, h: 60, oneway: false, look: 'none' });
    this.doors.push(new L4.Door(60, L4.GROUND, 'ВЫЙТИ', st => st.level.leaveRoom(), { tag: 'ВЫХОД' }));
    if (!r.cleared) for (let k = 0; k < r.count; k++) wd.enemies.push(new L4.Foe(r.type, 300 + k * 90, L4.GROUND, { hpMul: 1 }));
    this.roomData = r;
  },
  inner(wd, o) {
    wd.addPlat({ x: 0, y: L4.GROUND, w: L4.INNER_W, h: 60, oneway: false, look: 'none' });
    this.dark = !o.lightsOn;
    if (!o.escort) {
      for (let x = 300; x < 3300; x += U.randi(160, 240)) this.patrons.push(new L4.Patron(x, { dance: Math.random() < 0.5 }));
      for (let x = 3800; x < 6800; x += U.randi(230, 330)) wd.enemies.push(new L4.Foe('eyes', x, L4.GROUND - U.rand(70, 150)));
      this.doors.push(new L4.Door(L4.LEVER_X, L4.GROUND, 'РЫЧАГ', st => st.level.pullLever(), { tag: 'РЫЧАГ', sprite: 'none' }));
      this.patronLines = ['Сюда без пароля не пускают, а ты молодец!', 'Коктейль «Северное сияние» — рекомендую!', 'В чёрную комнату? Смельчак!', 'Мы просто отдыхаем, рыжий.'];
    } else {
      for (let x = 400; x < 6800; x += U.randi(240, 380)) wd.enemies.push(new L4.Foe('zombie', x, L4.GROUND));
    }
  },
  boss(wd) {
    wd.addPlat({ x: -40, y: L4.BOSS_G, w: 720, h: 60, oneway: false, look: 'none' });
    this.platsB = [[22, 212, 160], [456, 212, 164], [222, 116, 196]];
    for (const [x, y, w] of this.platsB) wd.addPlat({ x, y, w, h: 10, oneway: true, look: 'none' });
  },
};
// ---------- фоны (ВРЕМЕННО: стены третьего уровня; заменятся клубом из Codex) ----------
L4.drawWallStrip = function (c, key, x0, x1, cx, cy, tint) {
  const W3 = window.WALLS3, m = W3 && W3[key], img = L3.img[key];
  if (!img) return;
  const hd = L4.GROUND / m.floor, wd = m.w / m.h * hd, sx0 = x0 - cx, sx1 = x1 - cx;
  if (sx1 < 0 || sx0 > W) return;
  c.save(); c.beginPath(); c.rect(Math.max(0, sx0), 0, Math.min(W, sx1) - Math.max(0, sx0), H); c.clip();
  for (let x = sx0 + Math.floor(Math.max(0, -sx0) / wd) * wd; x < Math.min(W, sx1); x += wd) c.drawImage(img, Math.floor(x), -cy, Math.ceil(wd) + 1, hd);
  if (tint) { c.fillStyle = tint; c.fillRect(0, 0, W, H); }
  c.restore();
};
L4.DRAW_BG = {
  club(c, cx) {
    for (const z of L4.ZONES.club) if (z.wall !== 'club_back') L4.drawWallStrip(c, z.wall, z.x0, z.x1, cx, 0, null);
    const bx = L4.BACK_X - cx; if (bx < W && L4.img.club_back) c.drawImage(L4.img.club_back, bx, 0, W, H);
    // мигающий свет клуба
    const k = (Math.sin(G.t * 6) + 1) / 2;
    c.fillStyle = `rgba(${200 + 55 * k | 0},40,${160 + 80 * (1 - k) | 0},0.12)`; c.fillRect(0, 0, W, H);
  },
  tower(c, cx, cy) {
    for (let i = 0; i < 5; i++) {
      const y = L4.floorY(i);
      if (L4.img.club_floor) c.drawImage(L4.img.club_floor, -cx, y - L4.GROUND - cy, W, H);
      G.text('ЭТАЖ ' + (i + 1), 320, y - cy - 250, { align: 'center', size: 8, color: '#ff8ad8', outline: true });
    }
  },
  room(c) { if (L4.img.club_room) c.drawImage(L4.img.club_room, 0, 0, W, H); },
  inner(c, cx) {
    for (const z of L4.ZONES.inner) L4.drawWallStrip(c, z.wall, z.x0, z.x1, cx, 0, z.x0 > 0 ? 'rgba(0,0,0,0.5)' : 'rgba(20,0,40,0.25)');
    const lx = L4.LEVER_X - cx; if (lx > -40 && lx < W + 40) { c.save(); c.translate(lx, L4.GROUND - 40); if (this.lever) c.scale(1, -1); Spr.draw(c, 'l4fx', 7, 0, this.lever ? 40 : 0, 1); c.restore(); }
  },
  boss(c) {
    if (L4.img.biker_bg) c.drawImage(L4.img.biker_bg, 0, 0, W, H);
    if (!this.level.vovaFree) Spr.drawAnim(c, 'vova', 'chained', G.t, 320, L4.BOSS_G, 1, { alpha: 0.92 });
    else if (this.level.bikerDown) Spr.drawAnim(c, 'biker', 'ko', G.t, this.level.bikerDown, L4.BOSS_G, -1);
  },
};
L4.BUILD.escortClub = L4.BUILD.club;

// =====================================================================
// БОСС: БАЙКЕР (в 1.5 раза больше Валеры), бьётся только в спину
// =====================================================================
L4.Biker = class {
  constructor(st) {
    Object.assign(this, { st, x: 520, y: L4.BOSS_G, vx: 0, vy: 0, facing: -1, hp: Math.round(120 * (G.BOSS_MULT || 1)), t: 0, s: 'idle', stT: 0, cool: 1.5, onGround: true, flash: 0, headH: 140, voice: 110, dieT: null, d: { w: 44, h: 120 } });
    this.maxHp = this.hp;
  }
  get box() { return { x: this.x - 24, y: this.y - 124, w: 48, h: 124 }; }
  hit() { return false; }
  set(s) { this.s = s; this.stT = 0; }
  takeHit(dmg, fromX, melee) {
    if (this.dieT != null) return;
    const fromBack = (fromX - this.x) * this.facing < 0; // удар пришёл со стороны спины
    if (!fromBack) { if (!this.dingT || this.dingT <= 0) { this.dingT = 0.8; Sound.play('clank'); FX.popText(this.x, this.y - 140, 'В ЛОБ НЕ БЕРЁТ! ЗАЙДИ СЗАДИ!', '#ff8a4a'); if (Math.random() < 0.4) G.say(this, U.choice(['Ха! Щекотно!', 'Это всё, что ты можешь?']), 1.2); } return; }
    this.hp -= dmg; this.flash = 0.1; Sound.play('hit'); this.st.world.addScore(40 * dmg);
    if (Math.random() < 0.15) G.say(this, U.choice(['Ай! Моя спина!', 'Нечестно, сзади!', 'Ну всё, рыжий!']), 1.2);
    if (this.hp <= 0) { this.hp = 0; this.dieT = 0; this.st.level.bossDown(); }
  }
  update(dt, st) {
    const pl = st.player, wd = st.world; this.t += dt; this.stT += dt; if (this.flash > 0) this.flash -= dt; if (this.dingT > 0) this.dingT -= dt;
    if (this.dieT != null) { this.dieT += dt; return; }
    // гравитация
    const py = this.y; this.vy = Math.min(800, this.vy + 1500 * dt); this.y += this.vy * dt; this.x += this.vx * dt;
    const g = wd.groundAt(this.x, py, this.y, 4); if (g && this.vy > 0) { if (!this.onGround && this.vy > 300) { G.shake(6, 0.25); Sound.play('stomp'); FX.dust(this.x, g.y, 10); } this.y = g.y; this.vy = 0; this.onGround = true; } else if (!g) this.onGround = false;
    this.x = U.clamp(this.x, 30, 610);
    if (U.overlap(this.box, pl.box) && this.s === 'charge') pl.hurt(14, this.x, wd);
    this.cool -= dt;
    switch (this.s) {
      case 'idle':
        this.vx *= 0.8; this.facing = pl.x > this.x ? 1 : -1;
        if (this.cool <= 0) {
          const r = Math.random();
          if (r < 0.28) { this.set('charge'); this.vx = this.facing * 320; Sound.play('shout'); G.say(this, U.choice(['ВР-Р-РУМ!', 'С дороги!']), 1); }
          else if (r < 0.5) { this.set('jump'); const p = U.choice(this.st.platsB); this.jx = p[0] + p[2] / 2; this.vy = -620; this.vx = (this.jx - this.x) / 0.8; this.onGround = false; Sound.play('jump'); }
          else if (r < 0.72) this.set('throw');
          else if (r < 0.86) this.set('snakes');
          else this.set('rainbow');
        }
        break;
      case 'charge': if (this.stT > 1.1 || this.x <= 32 || this.x >= 608) { this.vx = 0; this.set('idle'); this.cool = U.rand(0.8, 1.4); } break;
      case 'jump': if (this.onGround && this.stT > 0.3) { this.vx = 0; this.set('idle'); this.cool = U.rand(0.5, 1); } break;
      case 'throw':
        if (this.stT > 0.35 && !this.thrown) { this.thrown = true; for (let k = 0; k < 3; k++) { const T = 0.8 + k * 0.12, tx = pl.x + U.rand(-60, 60); wd.globs.push(new L4.Missile('toy', this.x + this.facing * 20, this.y - 100, (tx - this.x) / T, -360 - k * 40)); } Sound.play('throw'); G.say(this, U.choice(['Лови сувенир!', 'Подарочки!']), 1); }
        if (this.stT > 0.8) { this.thrown = false; this.set('idle'); this.cool = U.rand(0.8, 1.5); }
        break;
      case 'snakes':
        if (this.stT > 0.3 && !this.thrown) { this.thrown = true; for (let k = 0; k < 2; k++) wd.enemies.push(new L4.Snake(this.x + this.facing * 20, this.y - 40, this.facing * (120 + k * 60))); Sound.play('squeak'); G.say(this, 'Знакомься — мои змейки!', 1.2); }
        if (this.stT > 0.8) { this.thrown = false; this.set('idle'); this.cool = U.rand(1, 1.6); }
        break;
      case 'rainbow': // радуга изо рта: предупреждение, потом луч по горизонтали
        this.vx = 0;
        if (this.stT > 0.7 && this.stT < 1.6) { const y0 = this.y - 80, x1 = this.facing > 0 ? 640 : 0, b = pl.box; if (!pl.dead && y0 + 6 > b.y && y0 - 6 < b.y + b.h && (pl.x - this.x) * this.facing > 0) pl.hurt(12, this.x, wd); this.beam = [this.x + this.facing * 20, y0, x1]; if (!this.said2) { this.said2 = true; Sound.play('steam'); } }
        else this.beam = null;
        if (this.stT > 1.8) { this.beam = null; this.said2 = false; this.set('idle'); this.cool = U.rand(1, 1.6); }
        break;
    }
  }
  draw(c, cx, cy) {
    const sk = L4.SKIN.biker, s = this.s;
    const anim = this.dieT != null ? sk.ko : this.flash > 0 ? sk.hurt : s === 'charge' ? sk.walk : s === 'throw' || s === 'snakes' ? sk.throw : s === 'rainbow' ? sk.shout : !this.onGround ? sk.jump : sk.stand;
    Spr.drawAnim(c, sk.set, anim, this.t, this.x - cx, this.y - cy, this.facing, { flash: this.flash > 0 ? '#ffffff' : null });
    if (s === 'rainbow' && this.stT < 0.7) { c.save(); c.globalAlpha = 0.25 + Math.sin(G.t * 30) * 0.2; const a = Math.min(this.x + this.facing * 20, this.facing > 0 ? 640 : 0), len = Math.abs((this.facing > 0 ? 640 : 0) - this.x); c.translate(0, -cy); for (let x = a; x < a + len; x += 76) Spr.draw(c, 'l4fx', 6, x + 38 - cx, this.y - 78, 1, { scale: 0.2 }); c.restore(); }
    if (this.beam) { const [x0, y0, x1] = this.beam, a = Math.min(x0, x1), len = Math.abs(x1 - x0); for (let x = a; x < a + len; x += 76) Spr.drawC(c, 'l4fx', 6, x + 38 - cx, y0 - cy + Math.sin(G.t * 30 + x) * 1.5, 0, 1); }
    // стрелка «бить сюда» у спины
    if ((G.t * 3 | 0) % 2 && this.dieT == null) G.text('БЕЙ СЗАДИ', this.x - this.facing * 44 - cx, this.y - 90 - cy, { align: 'center', size: 8, color: '#ffd84a', outline: true });
  }
};
L4.Snake = class {
  constructor(x, y, vx) { Object.assign(this, { x, y, vx, vy: -200, hp: 2, dieT: null, dead: false, t: 0, flash: 0, d: { w: 30, h: 12 }, score: 100, facing: Math.sign(vx) }); }
  get box() { return { x: this.x - 15, y: this.y - 12, w: 30, h: 12 }; }
  hit(dmg) { this.hp -= dmg; this.flash = 0.1; if (this.hp <= 0) { this.dieT = 0; return true; } return false; }
  update(dt, st) {
    this.t += dt; if (this.dieT != null) { this.dieT += dt; if (this.dieT > 0.6) this.dead = true; return; }
    const wd = st.world, pl = st.player, py = this.y; this.vy = Math.min(700, this.vy + 1500 * dt); this.y += this.vy * dt;
    const g = wd.groundAt(this.x, py, this.y, 4); if (g && this.vy > 0) { this.y = g.y; this.vy = 0; }
    this.facing = pl.x > this.x ? 1 : -1; this.x += this.facing * 70 * dt;
    if (U.overlap(this.box, pl.box)) pl.hurt(6, this.x, wd);
    if (this.t > 9) this.dead = true;
  }
  draw(c, cx, cy) { c.save(); c.translate(this.x - cx, this.y - cy - 8); if (this.facing > 0) c.scale(-1, 1); c.rotate(Math.sin(this.t * 10) * 0.08); if (this.dieT != null) c.globalAlpha = 1 - this.dieT / 0.6; Spr.drawC(c, 'l4fx', 5, 0, 0, 0, 1); c.restore(); }
};

// =====================================================================
// КОНТРОЛЛЕР УРОВНЯ
// =====================================================================
L4.Level = class {
  constructor() {
    this.id = 4;
    this.stats = { time: 0, dmg: 0, kills: 0, deflect: 0, secrets: 0, food: 0, deaths: 0 };
    this.score = 0; this.mode = null; this.hasPassword = false; this.carry = null;
    this.makeRooms();
  }
  // 15 комнат: в одной (случайной) — пароль, в другой — «Осеменитель 3000», остальные — с сюрпризами
  makeRooms() {
    const types = ['whip', 'sailor', 'sumo', 'bouncy'];
    this.rooms = [];
    for (let i = 0; i < 15; i++) this.rooms.push({ id: i, type: types[i % 4 === 3 && Math.random() < 0.5 ? 2 : U.randi(0, 3)], count: U.randi(2, 3), cleared: false, loot: U.choice(['pelmeni3', 'bread', 'chalkbox', 'chalkbox', 'battery']) });
    this.passRoom = U.randi(6, 14); // пароль — выше второго этажа, каждый запуск в новом месте
    do { this.gunRoom = U.randi(0, 8); } while (this.gunRoom === this.passRoom);
    this.rooms[this.passRoom].loot = 'password'; this.rooms[this.gunRoom].loot = 'seedgun';
    this.rooms[this.passRoom].type = 'sumo'; this.rooms[this.passRoom].count = 1;
  }
  start(opts = {}) {
    L4.shuffleTaunts();
    if (opts.boss) { this.carry = { ammo3: { swatter: 100, chalk: 30, seed: 150 }, hasSeed: true, green: false, weapon: 'seed' }; this.startBoss(); return; }
    if (opts.escort) { this.carry = { ammo3: { swatter: 100, chalk: 30, seed: 200 }, hasSeed: true, green: true, weapon: 'seed' }; this.startEscort(); return; }
    if (opts.tower) { this.hasPassword = false; this.setStage('tower', { x: 520, y: L4.floorY(0) }); return; }
    if (opts.inner) { this.carry = { ammo3: { swatter: 100, chalk: 30, seed: 150 }, hasSeed: true, weapon: 'seed' }; this.setStage('inner', { x: 80 }); return; }
    this.playScene(L4.sceneIntro(this), () => { this.setStage('club', { x: 120 }); this.stage.say('Иди за горничной к кулисам. {jump} — прыжок, {punch} — удар, {switch} — сменить оружие.', 6); Music.play('epic'); });
  }
  playScene(gen, next) { this.mode = 'scene'; Scene.run(gen, next); }
  setStage(kind, o = {}) {
    if (this.stage && this.stage.player) this.stage.carry();
    this.stageArgs = [kind, o];
    this.stage = new L4.Stage(this, kind, o); this.mode = 'stage'; FX.list = []; G.bubbles = [];
  }
  restartStage() { const [k, o] = this.stageArgs; if (this.carry) this.carry.hp = 100; const r = this.stage.roomData; this.stage = null; this.setStage(k, Object.assign({}, o)); if (r) this.stage.roomData = r; }
  enterTower() { this.clubX = this.stage.player.x; this.setStage('tower', { x: 520, y: L4.floorY(0) }); if (!this.hasPassword) this.stage.say('Пять этажей, пятнадцать комнат. Где-то тут пароль. Лестницы — {up}/{down}.', 6); }
  leaveTower() { this.setStage('club', { x: L4.STAIRS_X, facing: 1 }); if (this.hasPassword) this.stage.say('Пароль есть! Теперь — к железной двери.', 4); }
  enterRoom(id) {
    const r = this.rooms[id], st = this.stage; this.towerPos = { x: st.player.x, y: st.player.y };
    this.setStage('room', { x: 90, room: r, facing: 1 });
    if (!r.cleared) { const s = { whip: 'Опа... Дамы с плётками!', sailor: 'Морячки! Полундра!', sumo: 'Это что за пельмень?!', bouncy: 'Они прыгают как мячики!' }[r.type]; G.say(this.stage.player, s, 1.8); }
    this.stage.onUpdate = dt => this.roomTick(dt);
  }
  roomTick() {
    const st = this.stage, r = st.roomData;
    if (!r.cleared && st.world.enemies.every(e => e.dieT != null)) {
      r.cleared = true;
      const loot = r.loot;
      if (loot === 'password') { this.hasPassword = true; st.world.pickups.push(new Game.Pickup('tp', 330, L4.GROUND)); G.say(st.player, 'Записка: «Пароль — ЧЁРНАЯ КОМНАТА». Ага!', 3); st.say('Пароль найден! Возвращайся к железной двери за кулисами.', 6); Sound.play('checkpoint'); }
      else if (loot === 'seedgun') { const p = new Game.Pickup('seedgun', 330, L4.GROUND); st.world.pickups.push(p); }
      else { st.world.pickups.push(new Game.Pickup(loot, 330, L4.GROUND)); if (!this.hasPassword && Math.random() < 0.6) G.say(st.player, U.choice(['Пароля тут нет...', 'Пусто. Дальше!', 'Эх, не тут...']), 1.6); }
    }
  }
  leaveRoom() { const p = this.towerPos || { x: 320, y: L4.floorY(0) }; this.setStage('tower', { x: p.x, y: p.y }); }
  metalDoor() {
    const st = this.stage; st.carry();
    this.playScene(L4.sceneHatch(this, this.hasPassword), () => {
      if (this.hasPassword) this.setStage('inner', { x: 80 });
      else { this.setStage('club', { x: L4.DOOR_X - 60, facing: -1 }); this.stage.say('Пароль где-то наверху: лестница у кулис — [ВВЕРХ] у двери «ЭТАЖИ».', 6); }
    });
  }
  pullLever() { this.stage.carry(); this.playScene(L4.sceneLever(this), () => this.startBoss()); }
  startBoss() {
    this.setStage('boss', { x: 80, y: L4.BOSS_G });
    const st = this.stage; st.boss = new L4.Biker(st);
    st.onUpdate = dt => st.boss.update(dt, st);
    Music.play('epicBoss'); st.say('Байкер непробиваем спереди — бей в СПИНУ! Перепрыгивай его и стреляй вслед.', 7);
  }
  bossDown() {
    const st = this.stage; this.bikerDown = st.boss.x; st.player.controls = false; Music.stop(); G.shake(8, 0.6);
    setTimeout(() => { st.carry(); this.playScene(L4.sceneAfterBoss(this), () => this.startEscort()); }, 1400);
  }
  startEscort() {
    if (this.carry) { this.carry.green = true; this.carry.hasSeed = true; this.carry.ammo3.seed = Math.max(this.carry.ammo3.seed || 0, 200); this.carry.weapon = 'seed'; }
    this.escortPart = 1; this.setStage('inner', { x: L4.INNER_W - 120, escort: true, lightsOn: true, facing: -1 });
    this.addVova();
    this.stage.say('Выведи Вову из клуба! Если Вова погибнет — миссия провалена.', 6);
    Music.play('epic');
  }
  addVova() {
    const st = this.stage; st.vova = new L4.Vova(st.player.x + 40, L4.GROUND);
    st.onUpdate = () => {
      if (st.player.x < 40 && !st.leaving) {
        st.leaving = true;
        if (this.escortPart === 1) { this.escortPart = 2; const hp = st.vova.hp; st.carry(); this.setStage('club', { x: L4.CLUB_W - 140, escort: true, facing: -1 }); this.addVova(); this.stage.vova.hp = hp; this.stage.say('Ещё немного — к выходу из клуба!', 4); }
        else { st.carry(); this.playScene(L4.sceneEnd(this), () => { this.mode = 'done'; G.onLevelComplete(this); }); }
      }
    };
  }
  vovaDied() { this.stats.deaths++; this.playScene(function* () { yield* Scene.say('valera', 'Вова-а-а! Нет! Попробуем ещё раз...', null); }, () => this.startEscort()); }
  update(dt) {
    if (this.mode === 'scene') { Scene.tick(dt); if (this.updateScene) this.updateScene(dt); FX.update(dt); G.updateBubbles(dt); }
    else if (this.mode === 'stage') { this.stage.update(dt); FX.update(dt); G.updateBubbles(dt); }
  }
  draw(c) {
    if (this.mode === 'scene') { if (this.drawScene) this.drawScene(c); Scene.drawDialog(c); if (Scene.t < 3) G.text('Esc — пропустить', 8, H - 12, { size: 8, color: 'rgba(255,255,255,0.5)' }); }
    else if (this.mode === 'stage') this.stage.draw(c);
  }
  get canPause() { return this.mode === 'stage'; }
};
L4.shuffleTaunts = () => {};
// «Осеменитель 3000»: подбор
{
  const upd = Game.Pickup.prototype.update;
  Game.Pickup.prototype.update = function (dt, world, pl) {
    if (this.kind === 'seedgun' && !this.dead && !pl.dead && U.overlap(this.box, pl.box)) {
      this.dead = true; pl.hasSeed = true; pl.ammo3.seed = (pl.ammo3.seed || 0) + 150; pl.weapon = 'seed';
      Sound.play('checkpoint'); G.flash(0.2, '#ffffff');
      G.say(pl, 'О! Это же «Осеменитель 3000» — Вовина разработка!', 2.6);
      FX.popText(this.x, this.y - 30, '«ОСЕМЕНИТЕЛЬ 3000»', '#ffffff');
      return;
    }
    upd.call(this, dt, world, pl);
  };
}

// =====================================================================
// КАТСЦЕНЫ (пока движковые; комиксы добавятся из Codex)
// =====================================================================
L4.sceneStage = (level, kind, o) => { const st = new L4.Stage(level, kind, o); st.fade = 0; level.drawScene = c => st.draw(c); level.updateScene = dt => { for (const p of st.patrons) p.update(dt, st); st.world.t += dt; }; return st; };
L4.sceneIntro = level => function* () {
  const st = L4.sceneStage(level, 'club', { x: 60, scene: true }); st.player.controls = false;
  const v = st.player, maid = new G.Actor('maid', 300, L4.GROUND, -1), nurse = new G.Actor('nurse', 350, L4.GROUND, -1);
  st.patrons.push({ update() {}, draw: (c, cx) => { maid.draw(c, cx, 0); nurse.draw(c, cx, 0); } });
  yield* Scene.moveTo(v, 230, 90, 'walk'); v.setAnim('stand');
  yield* Scene.say('maid', 'Добро пожаловать в «Дикие кошки»! Вы к кому, молодой человек?', maid);
  yield* Scene.say('valera', 'Я к Вове.', v);
  yield* Scene.say('nurse', '...', nurse);
  maid.setAnim('beckon');
  yield* Scene.say('maid', 'Следуйте за мной.', maid);
  nurse.setAnim('shrug');
  yield* Scene.say('nurse', 'Ещё один голубчик... Сколько их тут уже.', nurse);
};
L4.sceneHatch = (level, hasPass) => function* () {
  const st = L4.sceneStage(level, 'club', { x: L4.DOOR_X - 40, facing: 1, scene: true }); st.player.controls = false;
  let eyesA = 0; const draw0 = st.draw.bind(st);
  level.drawScene = c => { draw0(c); const x = L4.DOOR_X - st.world.cam.x; Art.R(c, x - 13, 141, 26, 12, '#050505'); L4.drawEyes(c, x, 147, -1, eyesA, false); };
  Sound.play('door');
  yield* Scene.tween(0.6, k => { eyesA = k; });
  yield* Scene.say('hatch', 'ПАРОЛЬ?', null);
  if (hasPass) {
    yield* Scene.say('valera', 'Чёрная комната.', st.player);
    yield* Scene.say('hatch', '...Проходи.', null);
    Sound.play('door'); G.shake(4, 0.4);
  } else {
    yield* Scene.say('valera', 'Э-э-э... Я к Вове?', st.player);
    yield* Scene.say('hatch', 'Без пароля — никак. Иди отсюда, рыжий.', null);
    yield* Scene.tween(0.4, k => { eyesA = 1 - k; });
    yield* Scene.say('valera', 'Ладно... Где-то тут наверняка записан этот пароль.', st.player);
  }
};
L4.sceneLever = level => function* () {
  const st = L4.sceneStage(level, 'inner', { x: L4.LEVER_X - 20 }); st.player.controls = false; st.lever = false;
  yield* Scene.say('valera', 'Тут рычаг... Ну-ка...', st.player);
  Sound.play('lever'); st.lever = true; st.dark = false; G.flash(0.5, '#ffffff'); G.shake(4, 0.3);
  yield 0.3;
  const st2 = L4.sceneStage(level, 'boss', { x: 90, y: L4.BOSS_G }); st2.player.controls = false;
  const biker = new G.Actor('biker', 540, L4.BOSS_G, -1); biker.headH = 140; biker.voice = 110;
  level.drawScene = c => { st2.draw(c); biker.draw(c, 0, 0); };
  yield 0.5;
  yield* Scene.say('vova', 'Валера! Друг! Я больше уже не могу! Меня тут держат на цепях третий день!', null);
  yield* Scene.say('valera', 'Держись, Вова! Сейчас освобожу!', st.player);
  biker.setAnim('roar'); G.shake(5, 0.4);
  yield* Scene.say('biker', 'Не так быстро, рыжий. Я с вами справлюсь!', biker);
};
L4.sceneAfterBoss = level => function* () {
  const st = L4.sceneStage(level, 'boss', { x: 200, y: L4.BOSS_G }); st.player.controls = false;
  yield* Scene.say('valera', 'Отдыхай, железный конь. Вова, я иду!', st.player);
  yield* Scene.moveTo(st.player, 300, 120, 'run'); st.player.setAnim('stand');
  Sound.play('rope'); level.vovaFree = true; const vv = new G.Actor('vova', 340, L4.BOSS_G, -1); st.patrons.push({ update() {}, draw: (c, cx) => vv.draw(c, cx, 0) });
  yield* Scene.say('vova', 'Свобода! Валера, ты лучший!', null);
  Sound.play('glassHit'); G.shake(4, 0.4);
  yield* Scene.say('commando2', 'Отряд, огонь дротиками по всему клубу! Операция «Кошки»!', null);
  yield* Scene.say('vova', 'Смотри — от их яда все посетители превратились в зомби! Шатаются и рычат!', null);
  yield* Scene.say('vova', 'Дай-ка сюда «Осеменитель 3000». У этих зомби совсем другой обмен веществ...', null);
  Sound.play('lever'); G.flash(0.3, '#8cff60');
  yield* Scene.say('vova', 'Щёлк — переключил бак на зелёный режим! Теперь бьёт в два раза злее. Выводи меня отсюда!', null);
};
L4.sceneEnd = level => function* () {
  level.drawScene = c => { if (G.img.street) c.drawImage(G.img.street, 0, 0, W, H); else { c.fillStyle = '#0a0a14'; c.fillRect(0, 0, W, H); } };
  level.updateScene = () => {};
  yield* Scene.say('vova', '(затягивается из бульбулятора) Валера... спасибо. Нам нужно кое с кем срочно встретиться.', null);
  yield* Scene.say('valera', 'С кем?', null);
  yield* Scene.say('vova', 'Садись назад. По дороге расскажу. Я за рулём.', null);
  Sound.play('door'); yield 0.6;
};
