'use strict';
// ============ УРОВЕНЬ 4: «ДИКИЕ КОШКИ» — клуб, отель с паролем, закрытый зал, чёрная комната, байкер, эскорт Вовы ============
const L4 = {};
G.L4 = L4;
L4.GROUND = 300;
L4.img = {};
// анимации персонажей уровня 4 (листы нарисованы лицом ВЛЕВО → flip)
{
  const A = (sheet, fr, fps = 1, o = {}) => Object.assign({ fr: fr.map(i => [sheet, i]), fps }, o);
  const F = { flip: true };
  Spr.ANIM.whip = { stand: A('l4a', [0], 1, F), walk: A('girls2', [0, 1], 5, F), wind: A('l4a', [2], 1, F), attack: A('l4a', [3], 1, F) };
  Spr.ANIM.sailor = { stand: A('l4a', [4], 1, F), walk: A('l4c', [4, 5], 5, F), attack: A('l4c', [6], 1, F), throw: A('l4a', [6], 1, F), salute: A('l4c', [7], 1, F), ko: A('l4a', [7], 1, F) };
  Spr.ANIM.sumo = { stand: A('l4b', [0], 1, F), walk: A('l4b', [1], 1, F), air: A('l4b', [2], 1, F), ko: A('l4b', [3], 1, F) };
  Spr.ANIM.gum = { stand: A('l4c', [0, 3], 1.5, F), walk: A('girls2', [2, 3], 5, F), air: A('l4b', [6], 1, F), wind: A('girls2', [4, 5, 6], 4.3, F), attack: A('girls2', [7], 1, F), ko: A('l4b', [7], 1, F) };
  Spr.ANIM.biker = { stand: A('biker', [0], 1, F), run: A('biker', [1, 0], 8, F), jump: A('biker', [2], 1, F), throw: A('biker', [3], 1, F), roar: A('biker', [4], 1, F), hurt: A('biker', [5], 1, F), land: A('biker', [6], 1, F), ko: A('biker', [7], 1, F) };
  Spr.ANIM.zombie = { stand: A('patrons', [4], 1, F), walk: A('patrons', [5, 6], 4, F), attack: A('patrons', [4], 1, F), ko: A('patrons', [7], 1, F) };
  // 9 видов клубных зомби: [ходьба, атака, падение] (null — падение поворотом)
  L4.ZV = [['zomba', 0, 'zombb', 0, 'zombb', 1], ['zomba', 1, 'zombb', 0, null], ['zomba', 2, 'zombb', 2, 'zombb', 3], ['zomba', 3, 'zombb', 4, 'zombb', 5], ['zomba', 4, 'zomba', 4, null], ['zomba', 5, 'zomba', 5, null], ['zomba', 6, 'zomba', 6, null], ['zomba', 7, 'zomba', 7, null], ['zombb', 6, 'zombb', 6, 'zombb', 7]];
  L4.ZV.forEach((z, i) => { Spr.ANIM['zomb' + i] = { stand: A(z[0], [z[1]], 1, F), walk: A(z[0], [z[1]], 1, F), attack: A(z[2], [z[3]], 1, F), ko: z[4] ? A(z[4], [z[5]], 1, F) : A(z[0], [z[1]], 1, F) }; });
  Spr.ANIM.maid = { stand: A('hostess', [0], 1, F), walk: A('hostess', [1, 2], 5, F), beckon: A('hostess', [3], 1, F) };
  Spr.ANIM.nurse = { stand: A('hostess', [4], 1, F), walk: A('hostess', [5, 6], 5, F), shrug: A('hostess', [7], 1, F) };
  Spr.ANIM.vova = { stand: A('vova', [0]), walk: A('vova', [1, 2, 3, 4], 8), hurt: A('vova', [5]), ko: A('vova', [6]), chained: A('vova', [7]) };
  Spr.ANIM.bouncerA = { stand: A('bouncers', [0], 1, F), shove: A('bouncers', [1], 1, F), aside: A('bouncers', [2], 1, F), flex: A('bouncers', [3], 1, F) };
  Spr.ANIM.bouncerB = { stand: A('bouncers', [4], 1, F), shove: A('bouncers', [5], 1, F), lean: A('bouncers', [6], 1, F), laugh: A('bouncers', [7], 1, F) };
  Spr.ANIM.biker.sing = A('l4fx2', [4], 1, F); Spr.ANIM.biker.taunt = A('l4fx2', [5], 1, F);
  Spr.ANIM.couple = { walk: A('couple', [0, 1, 2, 3], 7), climb: A('couple', [4, 5], 4), wink: A('couple', [6]), kiss: A('couple', [7]) };
  Spr.ANIM.vovagun = { hold: A('vovagun2', [0]), open: A('vovagun2', [1]), flip: A('vovagun2', [2]), green: A('vovagun2', [3]), proud: A('vovagun2', [4]), give: A('vovagun2', [5]) };
  Spr.ANIM.zharness = { crawl: A('zharness', [0, 1], 5), drop: A('zharness', [2]), pounce: A('zharness', [3], 1, F), land: A('zharness', [4], 1, F), bite: A('zharness', [5], 1, F), leap: A('zharness', [6]), ko: A('zharness', [7]) };
  Spr.ANIM.kesha4 = { sniff: A('kesha_a', [5]), thumbs: A('kesha_b', [5]) };
  Spr.ANIM.guy = { stand: A('patrons', [0]), walk: A('patrons', [0]) };
  Spr.ANIM.girl = { stand: A('patrons', [1]), walk: A('patrons', [1]) };
  // Валера: ползком, по лестнице, кулаками, в чужих руках, неловкий танец
  // Валера в полицейской фуражке — основной набор уровня 4
  const V = { crawl: A('v7_mv', [0, 1], 6), climb: A('v7_mv', [2, 3], 6), punchA: A('v7_mv', [4]), punchB: A('v7_mv', [5]), held: A('v7_mv', [6]), dance: A('v7_mv', [7, 6], 3) };
  Spr.ANIM.valera4 = Object.assign({}, V, {
    stand: A('v7_act', [0]), angry: A('v7_idle', [7]), hips: A('v7_idle', [0, 1], 4.5), stomp: A('v7_idle', [0, 1], 4.5), scratch: A('v7_idle', [5]), yawn: A('v7_idle', [6]), belly: A('v7_idle', [2, 3, 2, 3, 4], 3),
    run: A('v8_run', [0, 1, 2, 3, 4, 5, 6, 7], 14), walk: A('v8_run', [0, 1, 2, 3, 4, 5, 6, 7], 9),
    crouch: A('v7_act', [1]), land: A('v7_act', [1]), jump: A('v7_act', [2]), fall: A('v7_act', [3]), hurt: A('v7_act', [4]), ko: A('v7_act', [5]),
    swatWind: A('v7_cap', [6]), swat: A('v7_act', [7]), fart: A('v7_cap', [7]), shoot: A('v7_act', [7]),
    capGrab: A('v7_cap', [0]), capOff: A('v7_cap', [1]), capThrow: A('v7_cap', [2]), capHold: A('v7_cap', [3]), capOn: A('v7_cap', [4]), capFix: A('v7_cap', [5]),
  });
  const GUN = g => ({ stand: A(g, [0]), angry: A(g, [0]), hips: A(g, [0]), scratch: A(g, [0]), yawn: A(g, [0]), belly: A(g, [0]), run: A(g, [1, 2, 3, 4], 10), walk: A(g, [1, 2, 3, 4], 7), shoot: A(g, [5]), jump: A(g, [6]), fall: A(g, [6]), crouch: A(g, [7]), land: A(g, [7]) });
  Spr.ANIM.valera4green = Object.assign({}, Spr.ANIM.valera4, V, GUN('v11_gun'));
  Spr.ANIM.valera3gun = Object.assign({}, Spr.ANIM.valera4, V, GUN('v10_gun'));
  Spr.ANIM.valera3gunOld = Object.assign({}, Spr.ANIM.valera4, V, {
    stand: A('v8_gun', [0]), angry: A('v8_gun', [0]), run: A('v8_gun', [1, 2, 3, 4], 10), walk: A('v8_gun', [1, 2, 3, 4], 7),
    shoot: A('v8_gun', [5]), jump: A('v8_gun', [6]), fall: A('v8_gun', [6]), crouch: A('v8_gun', [7]), land: A('v8_gun', [7]),
  });
}
L4.SKIN = {
  whip: { set: 'whip', stand: 'stand', walk: 'walk', wind: 'wind', attack: 'attack', hurt: 'stand', ko: 'stand', koRot: true },
  sailor: { set: 'sailor', stand: 'salute', walk: 'walk', wind: 'walk', attack: 'attack', throw: 'throw', hurt: 'stand', ko: 'ko' },
  sumo: { set: 'sumo', stand: 'stand', walk: 'walk', air: 'air', attack: 'walk', hurt: 'stand', ko: 'ko' },
  gum: { set: 'gum', stand: 'stand', walk: 'walk', air: 'air', wind: 'wind', attack: 'attack', hurt: 'stand', ko: 'ko' },
  zombie: { set: 'zombie', stand: 'stand', walk: 'walk', attack: 'attack', hurt: 'stand', ko: 'ko' },
};
L4.ZV.forEach((z, i) => { L4.SKIN['zomb' + i] = { set: 'zomb' + i, stand: 'stand', walk: 'walk', wind: 'stand', attack: 'attack', hurt: 'stand', ko: 'ko', koRot: !z[4], shamble: true }; });
Object.assign(WHO, {
  vova: { name: 'ВОВА', color: '#8cd0ff', voice: 250 },
  maid: { name: 'ГОРНИЧНАЯ', color: '#ff9ad0', voice: 380 },
  nurse: { name: 'МЕДСЕСТРА', color: '#ffd0e0', voice: 400 },
  hatch: { name: 'ГЛАЗА ИЗ ЛЮКА', color: '#c0c0c0', voice: 120 },
  biker: { name: 'БАЙКЕР', color: '#ff7040', voice: 110 },
  bouncer: { name: 'ОХРАННИК', color: '#b0b0b0', voice: 130 },
});
L4.load = async function () {
  const W3 = window.WALLS3 || {};
  await Promise.all(['club_lobby', 'club_hall', 'club_vip', 'club_leather', 'club_dark', 'club_lobby_z', 'club_hall_z', 'club_leather_z'].map(async k => { if (W3[k]) L3.img[k] = await G.loadImage(W3[k].img); }));
  await Promise.all(['club_back', 'club_back2', 'club_back3', 'club_floor', 'hotel_floor2', 'biker_bg', 'club_room', 'club_wc', 'club_wc2', 'comic4_darts', 'comic4_raid', 'comic4_end', 'room0', 'room1', 'room2', 'room3'].map(async k => { L4.img[k] = await G.loadImage('assets/' + k + '.jpg'); }));
  await Promise.all(['cone_m', 'cone_c', 'cone_g'].map(async k => { L4.img[k] = await G.loadImage('assets/spr/' + k + '.png'); }));
  G.portraits = G.portraits || {};
  await Promise.all(['maid', 'nurse', 'vova', 'biker', 'hatch', 'valera4'].map(async k => { G.portraits[k] = await G.loadImage('assets/spr/p_' + k + '.png'); }));
  G.portraits.valeraOrig = G.portraits.valeraOrig || G.portraits.valera;
  WHO.kesha = WHO.kesha || { name: 'КЕША', color: '#8cc8ff', voice: 210 };
};

// =====================================================================
// ВАЛЕРА: мухобойка, кулаки, потом «Осеменитель 3000»; умеет ползать
// =====================================================================
Game.PICK.seedgun = { name: '«ОСЕМЕНИТЕЛЬ 3000»!', special: 'seedgun' };
Game.PICK.tank = { name: 'Бак +60', ammo3: ['seed', 60] };
{ const dOld = Game.Pickup.prototype.draw; Game.Pickup.prototype.draw = function (c, cx, cy) { if (this.kind === 'tank') { Spr.drawC(c, 'icons4', 2, this.x - cx, this.y - cy - 12 + Math.sin(this.t * 4) * 2, 0, 1); return; } dOld.call(this, c, cx, cy); }; }
L4.WNAME = { swatter: 'МУХОБОЙКА', fists: 'КУЛАКИ', seed: 'ОСЕМЕНИТЕЛЬ 3000' };
L4.Player = class extends L3.Player {
  constructor(x, y) { super(x, y); this.animSet = 'valera4'; this.portraitKey = 'valera4'; this.ammo3 = { swatter: 100, chalk: 0, seed: 0 }; this.hasSeed = false; this.green = false; this.weapon = 'swatter'; this.punchN = 0; }
  switchWeapon() {
    const order = ['swatter', 'fists', 'seed'];
    let i = order.indexOf(this.weapon);
    for (let k = 1; k <= 3; k++) { const n = order[(i + k) % 3]; if (n !== 'seed' || (this.hasSeed && this.ammo3.seed > 0)) { this.weapon = n; Sound.play('select'); FX.popText(this.x, this.y - 96, L4.WNAME[n], '#ffd84a'); return; } }
  }
  attackUpdate(dt, world, ctl, I) {
    this.animSet = this.weapon === 'seed' ? (this.green ? 'valera4green' : 'valera3gun') : 'valera4'; this.portraitKey = 'valera4';
    const dir = ctl ? (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0) : 0;
    this.crawling = this.crouch && this.onGround && dir !== 0 && !this.atk;
    if (this.crawling) { this.x += dir * 80 * dt; this.facing = dir; }
    if (this.weapon === 'fists') {
      if (this.fartCool > 0) this.fartCool -= dt; if (this.fartT > 0) this.fartT -= dt;
      if (ctl && I.pressed('switch')) { this.switchWeapon(); return; }
      if (ctl && I.pressed('throw') && this.fartCool <= 0 && !this.atk) { this.fartT = 0.6; this.fartCool = 9; Sound.play('fart'); G.say(this, U.choice(['Газовая атака!', 'Получите!']), 1.2); world.clouds.push({ x: this.x - this.facing * 10, y: this.y - 30, t: 0, life: 3.5, r: 70, player: true, row: 0 }); }
      if (ctl && I.pressed('punch') && !this.atk && this.fartT <= 0) { this.atk = { t: 0, dur: 0.22, kind: 'punch', hit: new Set(), side: this.punchN++ % 2 }; Sound.play('punch'); }
      if (this.atk) {
        const a = this.atk; a.t += dt;
        if (a.kind === 'punch' && a.t > 0.06 && a.t < 0.14) world.playerAttack({ x: this.x + (this.facing > 0 ? 6 : -40), y: this.y - (this.crouch ? 40 : 66), w: 34, h: 30 }, 2, a, this);
        if (a.t >= a.dur) this.atk = null;
      }
      return;
    }
    if (this.weapon === 'seed') {
      if (this.fireT > 0) this.fireT -= dt;
      if (this.shootT > 0) this.shootT -= dt;
      if (ctl && I.pressed('switch')) { this.switchWeapon(); return; }
      if (this.ammo3.seed <= 0) { this.weapon = 'swatter'; return; }
      if (ctl && I.held('punch') && this.fireT <= 0) {
        this.fireT = this.green ? 0.22 : 0.2; this.ammo3.seed--; this.shootT = 0.2;
        const up = I.held('up'), base = up ? (I.held('left') || I.held('right') ? -0.8 : -1.45) : 0;
        for (const a of this.green ? [-0.15, 0, 0.15] : [0]) {
          const ang = base + a, sp = 480;
          const s = new L3.Shot('juice', this.x + this.facing * 30, this.y - (this.crouch ? 28 : 48), this.facing);
          s.vx = Math.cos(ang) * sp * this.facing; s.vy = Math.sin(ang) * sp; if (up && base < -1.2) s.vx = Math.sin(a) * sp * 0.6 + this.facing * 20;
          s.grav = 60; s.dmg = this.green ? 2 : 3; s.green = this.green; s.seed = true; s.pierce = this.green ? 1 : 0;
          world.projs.push(s);
        }
        Sound.play('squeak');
      }
      return;
    }
    if (this.weapon === 'chalk') this.weapon = 'swatter';
    super.attackUpdate(dt, world, ctl, I);
  }
  choosePose(dt) {
    if (this.held) { this.setAnim(this.held === 'dance' ? 'dance' : 'held'); return; }
    if (this.crawling && this.hurtT <= 0) { this.setAnim('crawl'); return; }
    if (this.atk && this.atk.kind === 'punch' && this.hurtT <= 0) { this.setAnim(this.atk.side ? 'punchB' : 'punchA'); return; }
    if (this.weapon === 'seed' && this.shootT > 0 && this.onGround && Math.abs(this.vx) < 20 && !this.crouch && this.hurtT <= 0) { this.setAnim('shoot'); return; }
    super.choosePose(dt);
  }
};
{
  const drawOld = L3.Shot.prototype.draw;
  L3.Shot.prototype.draw = function (c, cx) {
    if (this.kind === 'juice' && this.seed) { c.save(); c.translate(this.x - cx, this.y); c.rotate(Math.atan2(this.vy, this.vx) + Math.PI); if (this.green) Spr.drawC(c, 'moth2', 4, 0, 0, 0, 0.7); else Spr.draw(c, 'moth2', 4, 0, 3, 1, { scale: 0.7, flash: '#f6f6ee' }); c.restore(); return; }
    drawOld.call(this, c, cx);
  };
}
L4.drawHUD = function (c, pl, wd) {
  const R = Art.R;
  Game.drawHUD(c, pl, wd);
  const ws = [['swatter', pl.ammo3.swatter + '%'], ['fists', ''], ['seed', pl.hasSeed ? String(pl.ammo3.seed) : '']];
  ws.forEach(([wn, n], i) => {
    const x = 174 + i * 56, sel = pl.weapon === wn, has = wn !== 'seed' || pl.hasSeed;
    R(c, x - 1, 5, 54, 24, sel ? '#ffd84a' : '#111'); R(c, x, 6, 52, 22, sel ? '#3a3020' : '#1c1f24');
    c.save(); if (!has) c.globalAlpha = 0.35;
    if (wn === 'swatter') Art.item(c, 'swatter', x + 12, 17, -0.5, 0.8); else Spr.drawC(c, 'icons4', wn === 'fists' ? 0 : pl.green ? 2 : 1, x + 12, 17, 0, 0.9);
    c.restore();
    G.text(n, x + 24, 13, { size: 8, color: has ? '#fff' : '#666' });
  });
  const fc = pl.fartCool > 0 ? pl.fartCool / 9 : 0;
  R(c, 346, 6, 40, 22, '#111'); R(c, 347, 7, 38, 20, fc > 0 ? '#1c2418' : '#2a4a1a');
  G.text('ГАЗ', 366, 13, { size: 8, align: 'center', color: fc > 0 ? '#5a6a50' : '#b8ff70' });
  if (fc > 0) R(c, 347, 25, Math.round(38 * (1 - fc)), 2, '#8cd040');
};

// =====================================================================
// ВРАГИ
// =====================================================================
L4.FOE = {
  whip: { hp: 5, w: 26, h: 80, speed: 95, reach: 54, dmg: 10, score: 250, lines: ['Плохой мальчик!', 'На колени, рыжий!', 'Сейчас отшлёпаю!', 'Вон отсюда, это наш номер!'] },
  sailor: { hp: 5, w: 26, h: 80, speed: 75, reach: 46, dmg: 9, score: 250, march: true, lines: ['Полундра!', 'Раз-два, левой!', 'Свистать всех наверх!', 'Пшёл вон с палубы!'] },
  sumo: { hp: 10, w: 50, h: 96, speed: 55, bounce: true, dmg: 14, score: 450, lines: ['Хаккейо-о-о!', 'Раздавлю, как пельмень!'] },
  gum: { hp: 6, w: 40, h: 84, speed: 60, gum: true, dmg: 9, score: 300, lines: ['Хочешь жвачку, пупсик?', 'Бабл-гам атака!', 'Чпок!'] },
  zombie: { hp: 3, w: 26, h: 80, speed: 120, reach: 38, dmg: 7, score: 150, lines: ['Ы-ы-ы... танцуем...', 'Мозги-и... и коктейль...', 'Ам-ам-ам!', 'Вовочка-а-а...', 'Скушаю!'] },
  eyes: { hp: 2, w: 30, h: 22, speed: 55, dark: true, dmg: 5, score: 200, lines: ['Ты мне так нравишься...', 'Какой брутальный!', 'Третьим будешь?', 'Давай дружить!', 'Я тебя давно заметил...', 'Не уходи-и-и...'] },
};
L4.Foe = class {
  constructor(type, x, y, o = {}) {
    const d = L4.FOE[type];
    Object.assign(this, { type, d, x, y, facing: -1, hp: Math.round(d.hp * (o.hpMul || 1)), st: 0, t: Math.random() * 5, state: 'idle', vx: 0, vy: 0, flash: 0, dieT: null, dead: false, cool: 0.8 + Math.random(), score: d.score, headH: d.h + 14, voice: 250 + Math.random() * 150, said: false, onGround: true, home: x, pair: 0 }, o);
    if (d.dark) this.baseY = y;
  }
  get box() { const d = this.d; if (this.zv === 9 && (this.state === 'crawl' || this.state === 'drop')) return { x: this.x - 16, y: this.y, w: 32, h: 70 }; return d.dark ? { x: this.x - d.w / 2, y: this.y - d.h / 2, w: d.w, h: d.h } : { x: this.x - d.w / 2, y: this.y - d.h, w: d.w, h: d.h }; }
  set(s) { this.state = s; this.st = 0; }
  hit(dmg, dir) {
    if (this.dieT != null) return false;
    this.hp -= dmg; this.flash = 0.12;
    if (this.hp <= 0) { this.dieT = 0; this.vx = dir * 140; this.vy = -220; Sound.play('squeak'); if (this.d.dark) G.say(this, U.choice(['Ай! Грубиян...', 'Злюка!']), 1); return true; }
    if (!this.d.bounce && !this.d.dark) { this.set('hurt'); this.vx = dir * 110; }
    return false;
  }
  target(r) {
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
    if (this.dieT != null) { this.dieT += dt; this.x += this.vx * dt; this.vx *= 0.95; if (!d.dark && (this.zv !== 9 || this.y < L4.GROUND)) this.fall(dt, wd); else this.y += 60 * dt; if (this.dieT > 1.6) this.dead = true; return; }
    const tg = this.target(r), dx = tg.x - this.x, adx = Math.abs(dx);
    const aware = adx < 380 && Math.abs(tg.y - this.y) < 160 && !tg.dead;
    const face = () => { this.facing = dx > 0 ? 1 : -1; };
    const talk = () => { if (!this.said && d.lines.length && Math.random() < 0.7) { this.said = true; G.say(this, U.choice(d.lines), 1.8); } };
    const hurtT = (dmg, from) => { if (tg.hurt) tg.hurt(dmg, from, wd); };
    if (this.state === 'hurt') { this.x += this.vx * dt; this.vx *= 0.85; this.fall(dt, wd); if (this.st > 0.3) this.set('chase'); return; }
    if (this.type === 'zombie') { this.zombieAI(dt, r, tg, dx, adx, face, hurtT); return; }
    if (d.dark) { // влюблённые глаза гуляют парами, признаются в любви и лезут обниматься
      const inDark = tg.x > L4.DARK_X0 + 10;
      if (!aware || !inDark) { this.x = this.home + Math.sin(this.t * 0.6 + this.pair) * 60; this.y = this.baseY + Math.sin(this.t * 2) * 8; return; }
      face();
      if (!this.said && adx < 200) { this.said = true; G.say(this, U.choice(d.lines), 2); }
      if (this.state === 'hug') { this.x = Math.max(L4.DARK_X0 + 40, this.x + this.vx * dt); this.y += this.vy * dt; if (U.overlap(this.box, tg.box)) hurtT(d.dmg, this.x); if (this.st > 0.6) { this.set('idle'); this.cool = U.rand(1.6, 2.6); this.said = false; } return; }
      this.x += U.clamp(dx, -d.speed, d.speed) * dt * 0.6; this.y = U.lerp(this.y, tg.y - 64 + Math.sin(this.t * 3 + this.pair) * 16, dt);
      this.x = Math.max(this.x, L4.DARK_X0 + 40);
      if (this.cool <= 0 && adx < 150) { this.set('hug'); const a = Math.atan2(tg.y - 50 - this.y, dx); this.vx = Math.cos(a) * 220; this.vy = Math.sin(a) * 220; G.say(this, U.choice(['Обнимашки!', 'Иди ко мне!']), 1); }
      return;
    }
    this.fall(dt, wd);
    if (!aware) { this.state = 'idle'; this.moving = false; return; }
    talk();
    if (d.bounce) {
      face();
      if (this.onGround) {
        this.vx *= 0.8;
        if (this.cool <= 0) { this.vy = -520; this.vx = U.clamp(dx * 1.4, -230, 230); this.onGround = false; this.cool = U.rand(0.8, 1.4); Sound.play('jump'); this.air = true; }
        else if (this.air) { this.air = false; G.shake(10, 0.35); Sound.play('stomp'); Sound.play('boom'); FX.dust(this.x, this.y, 12); if (Math.abs(tg.x - this.x) < 70 && tg.onGround) hurtT(d.dmg, this.x); }
      } else { this.x += this.vx * dt; if (this.vy > 0 && U.overlap(this.box, tg.box)) hurtT(d.dmg, this.x); }
      return;
    }
    if (d.gum) {
      face();
      if (this.state === 'wind') { if (this.st > 0.7) { this.set('attack'); r.world.globs.push(new L4.Missile('gum', this.x + this.facing * 20, this.y - 62, this.facing * 230, 0)); Sound.play('squeak'); } return; }
      if (this.state === 'attack') { if (this.st > 0.4) { this.set('idle'); this.cool = U.rand(1.5, 2.4); } return; }
      const want = adx < 170 ? -1 : adx > 260 ? 1 : 0;
      this.x += this.facing * want * d.speed * dt; this.moving = want !== 0;
      if (this.cool <= 0 && adx < 360 && Math.abs(tg.y - this.y) < 40) this.set('wind');
      return;
    }
    face();
    if (this.state === 'wind') { if (this.st > 0.3) { this.set('attack'); Sound.play('punch'); } return; }
    if (this.state === 'attack') { if (this.st < 0.15) { const hb = { x: this.x + (this.facing > 0 ? 4 : -d.reach), y: this.y - (d.march ? 40 : 64), w: d.reach, h: d.march ? 36 : 44 }; if (U.overlap(hb, tg.box)) hurtT(d.dmg, this.x); } if (this.st > 0.4) { this.set('chase'); this.cool = 0.7; } return; }
    if (this.state === 'throw') { if (this.st > 0.35 && !this.thrown) { this.thrown = true; r.world.globs.push(new L4.Missile('cap', this.x + this.facing * 14, this.y - 60, dx / 0.8, -300)); Sound.play('throw'); } if (this.st > 0.6) { this.thrown = false; this.set('chase'); this.cool = 1; } return; }
    if (d.march && adx > 150 && this.cool <= 0 && Math.random() < dt * 1.2) { this.set('throw'); return; }
    if (adx > d.reach * 0.7) { this.x += this.facing * d.speed * dt; this.moving = true; } else this.moving = false;
    if (adx < d.reach && this.cool <= 0 && Math.abs(tg.y - this.y) < 40) this.set('wind');
  }
  // зомби: 0 горничная, 1 медсестра, 2 охранник, 3 морячка, 4 толстушка, 5 сумоист, 6 бандана, 7 усач, 8 диско
  zombieAI(dt, r, tg, dx, adx, face, hurtT) {
    const wd = r.world, z = this.zv || 0;
    if (z === 9) { this.ceilingAI(dt, r, tg, dx, adx, hurtT); return; }
    const speed = [135, 130, 95, 110, 85, 70, 140, 125, 150][z], reach = z === 2 ? 50 : z === 5 ? 56 : 38, dmg = z === 2 ? 12 : z === 5 ? 14 : 7;
    if (this.drop) { if (this.fall(dt, r.world)) { this.drop = false; G.shake(10, 0.4); Sound.play('boom'); FX.dust(this.x, this.y, 14); if (Math.abs(tg.x - this.x) < 60) hurtT(14, this.x); } else return; }
    this.fall(dt, wd); face();
    if (!this.said && adx < 260 && Math.random() < 0.02) { this.said = true; G.say(this, U.choice(this.d.lines), 1.4); }
    if (this.state === 'wind') { this.moving = false; if (this.st > (z === 4 ? 0.8 : 0.25)) { this.set('attack');
        if (z === 3) { wd.globs.push(new L4.Missile('brain', this.x + this.facing * 14, this.y - 60, dx / 0.7, -280)); Sound.play('throw'); }
        else if (z === 4) { wd.globs.push(new L4.Missile('snot', this.x + this.facing * 20, this.y - 62, this.facing * 220, 0)); Sound.play('squeak'); }
        else Sound.play(z === 2 ? 'punch' : 'squeak'); }
      return; }
    if (this.state === 'attack') {
      if (z !== 3 && z !== 4 && this.st < 0.15) { const hb = { x: this.x + (this.facing > 0 ? 4 : -reach), y: this.y - 64, w: reach, h: 48 }; if (U.overlap(hb, tg.box) && hurtT(dmg, this.x) && z === 2 && tg.vx != null) tg.vx = this.facing * 260; }
      if (this.st > 0.35) { this.set('chase'); this.cool = z === 3 || z === 4 ? U.rand(1.4, 2.2) : U.rand(0.5, 0.9); }
      return;
    }
    const ranged = z === 3 || z === 4;
    if (ranged && adx > 90 && adx < 330 && this.cool <= 0) { this.set('wind'); return; }
    if (adx > reach * 0.7) { this.x += this.facing * speed * dt; this.moving = true; } else this.moving = false;
    if (adx < reach && this.cool <= 0 && Math.abs(tg.y - this.y) < 40) this.set('wind');
  }
  ceilingAI(dt, r, tg, dx, adx, hurtT) {
    const wd = r.world, CEIL = 0;
    if (this.state === 'idle' || this.state === 'crawl') { this.state = 'crawl'; this.y = CEIL; this.facing = dx > 0 ? 1 : -1; this.x += this.facing * 90 * dt; if (adx < 40 && this.cool <= 0) { this.set('drop'); this.vy = 0; G.say(this, U.choice(['Сверху!', 'Ам!']), 0.8); } return; }
    if (this.state === 'drop') { this.vy += 1500 * dt; this.y += this.vy * dt; if (this.y >= L4.GROUND) { this.y = L4.GROUND; this.set('bite'); G.shake(3, 0.15); } return; }
    if (this.state === 'bite') { this.facing = dx > 0 ? 1 : -1; if (this.st > 0.1 && this.st < 0.3 && adx < 44) hurtT(9, this.x); if (this.st > 0.7) { this.set('leap'); this.vy = -700; } return; }
    if (this.state === 'leap') { this.y += this.vy * dt; this.vy += 400 * dt; if (this.y <= CEIL) { this.y = CEIL; this.set('crawl'); this.cool = U.rand(1.5, 2.5); } return; }
  }
  draw(c, cx, cy) {
    const x = this.x - cx, y = this.y - cy;
    if (this.type === 'zombie' && this.zv === 9) {
      const s = this.state, fl = this.flash > 0 ? '#ffffff' : null, a = this.dieT != null ? Math.max(0, 1 - this.dieT / 1.6) : 1;
      if (this.dieT != null) Spr.draw(c, 'zharness', 7, x, y, this.facing, { alpha: a });
      else if (s === 'crawl') Spr.drawC(c, 'zharness', Math.floor(this.t * 6) % 2, x, y + 40, 0, 1);
      else if (s === 'drop') Spr.drawC(c, 'zharness', 2, x, y - 40, 0, 1);
      else if (s === 'leap') Spr.draw(c, 'zharness', 6, x, y, 1, { flash: fl });
      else Spr.draw(c, 'zharness', this.st < 0.15 ? 4 : 5, x, y, -this.facing, { flash: fl });
      return;
    }
    if (this.d.dark) { L4.drawEyes(c, x, y, this.facing, this.dieT != null ? 1 - this.dieT / 1.6 : 1, 'love'); return; }
    const sk = L4.SKIN[this.type === 'zombie' ? 'zomb' + (this.zv || 0) : this.type] || L4.SKIN.whip, s = this.state;
    const bounceAir = this.d.bounce && !this.onGround, crouch = this.d.bounce && this.onGround && this.cool < 0.25;
    const anim = this.dieT != null ? sk.ko : s === 'hurt' ? sk.hurt : s === 'wind' ? (sk.wind || sk.attack) : s === 'attack' ? sk.attack : s === 'throw' ? (sk.throw || sk.attack) : bounceAir ? sk.air : crouch ? sk.walk : this.moving ? sk.walk : sk.stand;
    const alpha = this.dieT != null && this.dieT > 1.1 ? (1.6 - this.dieT) / 0.5 : 1;
    const rot = this.dieT != null && sk.koRot ? -this.facing * Math.min(1.4, this.dieT * 5) : 0;
    const breathe = this.moving || this.dieT != null ? 1 : 1 + Math.sin(this.t * 3) * 0.015;
    const sh = sk.shamble && this.dieT == null ? Math.sin(this.t * (this.moving ? 11 : 3) + (this.zv || 0)) : 0;
    c.save(); c.translate(x, y - (sk.shamble && this.moving ? Math.abs(sh) * 3 : 0)); c.rotate(sh * 0.07); c.scale(1, breathe);
    Spr.drawAnim(c, sk.set, anim, this.t, 0, 0, this.facing, { flash: this.flash > 0 ? '#ffffff' : null, alpha, rot });
    c.restore();
  }
};
L4.drawEyes = function (c, x, y, facing, a = 1, kind) {
  c.save(); c.globalAlpha = a;
  const blink = kind !== 'hero' && (G.t * 0.7 + x * 0.01) % 3 < 0.08;
  if (!blink) { if (kind === 'love') Spr.drawC(c, 'l4fx2', Math.floor(G.t * 1.5 + x * 0.01) % 3, x, y, Math.sin(G.t * 2 + x) * 0.08, 0.9); else Spr.drawC(c, 'l4fx', kind === 'hero' ? 2 : kind === 'angry' ? 1 : 0, x, y, 0, kind === 'hero' ? 0.8 : 0.95); }
  c.restore();
};
L4.Missile = class {
  constructor(kind, x, y, vx, vy) { Object.assign(this, { kind, x, y, vx, vy, dead: false, t: 0, rot: 0, grav: kind === 'gum' || kind === 'snot' ? 0 : 800 }); }
  update(dt, wd, pl, floorY = L4.GROUND, r) {
    this.t += dt; this.vy += this.grav * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.rot += dt * 10;
    if (this.kind === 'gum' || this.kind === 'snot') this.y += Math.sin(this.t * 8) * 0.6;
    const tgs = [pl, r && r.vova].filter(v => v && !v.dead);
    for (const tg of tgs) if (U.overlap({ x: this.x - 8, y: this.y - 8, w: 16, h: 16 }, tg.box)) { this.dead = true; tg.hurt(this.kind === 'toy' ? 10 : 8, this.x, wd); if (this.kind === 'gum' || this.kind === 'snot') G.say(tg, this.kind === 'snot' ? 'Фу-у! Сопли!' : 'Фу! Липкая!', 1); return; }
    if (this.y > floorY || this.t > 3) { this.dead = true; FX.dust(this.x, floorY, 4); }
  }
  draw(c, cx, cy = 0) {
    if (this.kind === 'gum') { Spr.drawC(c, 'gumball', 0, this.x - cx, this.y - cy, 0, 1 + Math.sin(this.t * 12) * 0.08); return; }
    if (this.kind === 'snot') { Art.item(c, 'acid3', this.x - cx, this.y - cy, Math.sin(this.t * 10) * 0.3, 1.6); return; }
    if (this.kind === 'brain') { Spr.drawC(c, 'brain', Math.floor(this.t * 10) % 4, this.x - cx, this.y - cy, 0, 1); return; }
    Spr.drawC(c, 'l4fx', this.kind === 'cap' ? 3 : 4, this.x - cx, this.y - cy, this.kind === 'cap' ? this.rot * 0.3 : Math.sin(this.rot) * 0.4, 1);
  }
};

// =====================================================================
// МИРНЫЕ: тусовщики, горничная-проводник, охранники, флиртующие в закрытом зале
// =====================================================================
L4.Patron = class {
  constructor(x, o = {}) { Object.assign(this, { x, y: L4.GROUND, t: Math.random() * 6, facing: Math.random() < 0.5 ? 1 : -1, home: x, dance: true, headH: 90, voice: 300 + Math.random() * 100, said: false, fr: U.randi(0, 3), sheet: 'patrons' }, o); }
  update(dt, r) {
    this.t += dt;
    if (!this.dance) { this.x = this.home + Math.sin(this.t * 0.5) * 40; this.facing = Math.cos(this.t * 0.5) > 0 ? 1 : -1; }
    const pl = r.player;
    if (!this.said && Math.abs(pl.x - this.x) < 70 && Math.random() < dt * 2) { this.said = true; G.say(this, U.choice(r.patronLines || ['Приве-е-ет, рыжий!', 'Классная каска!', 'Потанцуем?']), 1.8); }
  }
  draw(c, cx, cy = 0) {
    const x = this.x - cx; if (x < -80 || x > W + 80) return;
    c.save(); c.translate(x, this.y - cy);
    if (this.sheet === 'patrons') Spr.draw(c, 'dancers', this.fr + (Math.floor(this.t * 2.6) % 2) * 4, 0, 0, this.facing);
    else Spr.draw(c, this.sheet, this.fr, 0, 0, this.sheet === 'men' ? -this.facing : this.facing);
    c.restore();
  }
};
L4.Guide = class {
  constructor(st) { Object.assign(this, { st, x: 250, y: L4.GROUND, t: 0, facing: 1, headH: 96, voice: 380, said: 0, done: false }); }
  update(dt, st) {
    this.t += dt; const pl = st.player, target = L4.DOOR_X - 70;
    const gap = this.x - pl.x;
    if (this.x < target && gap < 150) { this.x += 62 * dt; this.moving = true; this.facing = 1; } else { this.moving = false; this.facing = pl.x > this.x ? 1 : -1; if (gap >= 150 && Math.random() < dt * 0.4) G.say(this, U.choice(['Ну где ты там?', 'Не отставай, красавчик!']), 1.4); }
    const lines = [[700, 'Проходи-проходи, не стесняйся.'], [1180, 'Столики гостей обходи, не мешай людям отдыхать.'], [1640, 'Мальчики на баре — свои. Тебя не пустят, так что ползи под стойкой, хи-хи.'], [2380, 'Смотри, у нас даже кабаре есть!'], [target - 2, 'Вова — там, за железной дверью. Только тебя без пароля не пустят. И не забудь зайти убраться в туалете — твой друг там что-то химичил.']];
    if (this.said < lines.length && this.x >= lines[this.said][0]) { G.say(this, lines[this.said][1], this.said === lines.length - 1 ? 5 : 3); this.said++; if (this.said === lines.length) { this.done = true; st.level.guided = true; } }
  }
  draw(c, cx, cy = 0) { Spr.drawAnim(c, 'maid', this.moving ? 'walk' : this.done ? 'beckon' : 'stand', this.t, this.x - cx, this.y - cy, this.facing); }
};
L4.Bouncer = class {
  constructor(x, set, o = {}) { Object.assign(this, { x, y: L4.GROUND, set, t: Math.random() * 3, pose: 'stand', poseT: 0, facing: o.facing || -1, headH: 108, voice: 130 }, o); }
  update(dt, st) {
    this.t += dt; if (this.poseT > 0) this.poseT -= dt; else this.pose = this.idle || 'stand';
    const pl = st.player, g = st.guide;
    if (g && Math.abs(g.x - this.x) < 50) { this.pose = this.set === 'bouncerA' ? 'aside' : 'lean'; this.poseT = 0.2; }
    if (this.guard && !pl.crouch && !pl.dead && Math.abs(pl.x - this.x) < 34 && pl.onGround) {
      this.pose = 'shove'; this.poseT = 0.5; pl.x -= (this.x > pl.x ? 1 : -1) * 22; pl.vx = 0; Sound.play('punch'); G.shake(2, 0.1);
      if (!this.saidT || G.t - this.saidT > 2.5) { this.saidT = G.t; G.say(this, U.choice(['Куда прёшь? Бар для своих!', 'Стоять! Лицо не проходит.', 'Ты не в списке, рыжий.']), 1.6); }
    }
    if (this.pose === 'stand' && this.set === 'bouncerA' && (this.t % 7) < 1.2) this.pose = 'flex';
  }
  draw(c, cx, cy = 0) { const x = this.x - cx; if (x < -80 || x > W + 80) return; c.save(); c.translate(x, this.y - cy); c.scale(1, 1 + Math.sin(this.t * 2.5) * 0.012); Spr.drawAnim(c, this.set, this.pose, this.t, 0, 0, this.facing); c.restore(); }
};
L4.Flirt = class {
  constructor(x, kind, o = {}) { Object.assign(this, { x, y: L4.GROUND, kind, t: Math.random() * 5, facing: -1, st: 'idle', stT: 0, home: x, headH: 96, voice: 180 + Math.random() * 80 }, o); }
  get lines() { return ['Какой мужчина! Угостить коктейлем?', 'Привет, капитан! *подмигивает*', 'Пойдём ко мне на омлет?', 'Давай знакомиться!', 'Какая фуражка... Мне нравится.', 'Потанцуем, рыжий?']; }
  update(dt, st) {
    const pl = st.player; this.t += dt; this.stT += dt; const dx = pl.x - this.x, adx = Math.abs(dx);
    if (this.st === 'idle') {
      this.x = this.home + Math.sin(this.t * 0.8) * 26; this.facing = dx > 0 ? 1 : -1;
      if (!this.said && adx < 170) { this.said = true; G.say(this, U.choice(this.lines), 2); }
      if (!pl.held && !pl.dead && adx < (this.kind === 'carrier' ? 200 : 36) && Math.abs(pl.y - this.y) < 20 && !pl.crawling && (!this.coolT || G.t > this.coolT)) { this.st = this.kind === 'carrier' ? 'run' : 'grab'; this.stT = 0; }
    } else if (this.st === 'run') {
      this.facing = dx > 0 ? 1 : -1; this.x += this.facing * 230 * dt;
      if (pl.crawling && adx < 34) { this.st = 'back'; this.stT = 0; G.say(this, 'Эй, куда поднырнул?!', 1.2); }
      else if (adx < 24) { this.st = 'carry'; this.stT = 0; pl.held = 'carry'; pl.breakN = 0; G.say(this, U.choice(['Берём его, он стеснительный!', 'Ты с нами, капитан!']), 1.6); }
      if (this.stT > 2) { this.st = 'back'; this.stT = 0; }
    } else if (this.st === 'grab') {
      pl.held = 'dance'; pl.x = this.x + this.facing * 26; pl.facing = -this.facing;
      if (this.stT > 2 || this.freed(pl)) { pl.held = null; this.st = 'idle'; this.coolT = G.t + 3; G.say(this, 'Эх, до встречи на танцполе!', 1.2); }
    } else if (this.st === 'carry') {
      // несут над головой к выходу; можно вырваться
      this.facing = -1; this.x -= 110 * dt; pl.x = this.x; pl.y = this.y; pl.vy = 0;
      if (this.freed(pl)) { pl.held = null; pl.y = L4.GROUND; this.st = 'back'; this.stT = 0; pl.vy = -300; G.say(pl, 'Отстаньте, я по делу!', 1.2); }
      else if (this.stT > 2.4 || this.x < 90) { this.st = 'drop'; this.stT = 0; }
    } else if (this.st === 'drop') { // скидывают и уходят обратно
      if (this.stT > 0.25 && pl.held) { pl.held = null; pl.y = L4.GROUND - 40; pl.vy = -200; pl.vx = -120; G.say(this, 'Остынь на входе, красавчик!', 1.4); }
      if (this.stT > 0.7) { this.st = 'back'; this.stT = 0; }
    } else if (this.st === 'back') {
      this.facing = this.home > this.x ? 1 : -1; this.x += this.facing * 160 * dt; if (Math.abs(this.x - this.home) < 8) { this.st = 'idle'; this.coolT = G.t + 2.5; }
    }
  }
  freed(pl) { const I = G.Input; if (I.pressed('punch') || I.pressed('jump') || I.pressed('left') || I.pressed('right')) { pl.breakN = (pl.breakN || 0) + 1; FX.popText(pl.x, pl.y - 100, 'ВЫРЫВАЙСЯ!', '#ffd84a'); } return pl.breakN >= 6; }
  draw(c, cx, cy = 0) {
    const x = this.x - cx; if (x < -160 || x > W + 160) return;
    const y = this.y - cy, f = -this.facing; // листы мужчин смотрят влево
    if (this.kind === 'carrier') {
      if (this.st === 'idle') { const b = -Math.abs(Math.sin(this.t * 3)) * 2; Spr.draw(c, 'men', 0, x - 22, y + b, f); Spr.draw(c, 'men', 6, x + 22, y + b, f); return; }
      if (this.st === 'carry' || this.st === 'drop') {
        const b = -Math.abs(Math.sin(this.t * 10)) * 3;
        Spr.draw(c, 'men', 0, x - 30, y + b, 1); Spr.draw(c, 'men', 6, x + 30, y - b, -1);
        if (this.st === 'carry' || this.stT < 0.25) Spr.drawAnim(c, 'valera4', 'ko', G.t, x, y - 64 + b, 1);
        return;
      }
      Spr.draw(c, 'menact', this.st === 'drop' ? 6 : 4, x, y - (this.st === 'run' || this.st === 'back' ? Math.abs(Math.sin(this.t * 14)) * 3 : 0), this.st === 'back' ? -f : f);
      return;
    }
    if (this.st === 'grab') { Spr.draw(c, 'spin', Math.floor(this.stT * 8) % 6, x, y, 1); return; }
    const fr = this.st === 'idle' ? (Math.floor(this.t * 2) % 2 ? 1 : 0) : 7;
    const beat = this.st === 'idle' ? -Math.abs(Math.sin(this.t * 4)) * 3 : 0;
    c.save(); c.translate(x, y + beat); c.rotate(this.st === 'idle' ? Math.sin(this.t * 2.2) * 0.05 : 0);
    Spr.draw(c, 'menact', fr, 0, 0, f); c.restore();
  }
};
L4.Vova = class {
  constructor(x, y) { Object.assign(this, { x, y, vx: 0, vy: 0, facing: 1, hp: 100, maxHp: 100, dead: false, hurtT: 0, inv: 0, t: 0, headH: 92, voice: 250 }); }
  get box() { return { x: this.x - 12, y: this.y - 80, w: 24, h: 80 }; }
  hurt(dmg, from) {
    if (this.dead || this.inv > 0) return false;
    this.hp -= Math.round(dmg * (G.DMG_MULT || 1) * 0.3); this.inv = 1.2; this.hurtT = 0.3; this.vx = (this.x > from ? 1 : -1) * 120;
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
    if (this.inv > 0 && (G.t * 20 | 0) % 2) return;
    Spr.drawAnim(c, 'vova', this.dead ? 'ko' : this.hurtT > 0 ? 'hurt' : this.moving ? 'walk' : 'stand', this.t, this.x - cx, this.y - cy, this.facing);
  }
};

// =====================================================================
// ЛОКАЦИИ
// =====================================================================
L4.WALL1 = 900; L4.BACK_X = 2660; L4.CLUB_W = 3300; L4.STAIRS_X = 2660 + 512; L4.DOOR_X = 2660 + 580; L4.HATCH_Y = 150;
L4.WC_X = 2660 + 434; L4.INNER_W = 3600; L4.DARK_X0 = 1800; L4.LEVER_X = 3480;
L4.ZONES = {
  club: [{ name: 'РЕСЕПШЕН', x0: 0, x1: L4.WALL1, wall: 'club_lobby' }, { name: 'ТАНЦПОЛ', x0: L4.WALL1, x1: L4.BACK_X, wall: 'club_hall' }, { name: 'ЗА КУЛИСАМИ', x0: L4.BACK_X, x1: L4.CLUB_W, wall: 'club_back' }],
  inner: [{ name: 'ЗАКРЫТЫЙ ЗАЛ', x0: 0, x1: L4.DARK_X0, wall: 'club_leather' }, { name: 'ЧЁРНАЯ КОМНАТА', x0: L4.DARK_X0, x1: L4.INNER_W, wall: 'club_dark' }],
};
L4.PROP = {
  pole: { sheet: 'cprops', fr: 0, crawl: true, scale: 1.3 }, speakers: { sheet: 'cprops', fr: 1, solid: [40, 88], scale: 1.35 }, bigspk: { sheet: 'cprops', fr: 1, solid: [52, 118], scale: 1.8 },
  bar: { sheet: 'cprops', fr: 4, crawl: true, scale: 1.2 }, rope: { sheet: 'cprops', fr: 6, scale: 1.3 },
  sofaA: { sheet: 'panim', fr: 0, anim: 4, scale: 0.62 }, tableA: { sheet: 'panim', fr: 1, anim: 4, scale: 0.62 }, table2A: { sheet: 'panim', fr: 2, anim: 4, scale: 0.62 }, djA: { sheet: 'panim', fr: 3, anim: 4, scale: 0.7 },
  slime: { sheet: 'acid', fr: 0, scale: 1.2 },
  wcdoor: { sheet: 'stalls', fr: 7 }, stall: { sheet: 'stalls', fr: 0 },
};
L4.Stage = class {
  constructor(level, kind, o = {}) {
    this.level = level; this.kind = kind; this.o = o;
    const W0 = kind === 'club' ? L4.CLUB_W : kind === 'inner' ? L4.INNER_W : 640; // tower/room/wc/boss — один экран
    const wd = this.world = new Game.World(W0, H);
    this.W = W0;
    wd.stats = level.stats; wd.score = level.score; wd.addScore = n => { wd.score += n; level.score = wd.score; };
    wd.globs = []; wd.clouds = []; wd.pickups = []; wd.enemies = [];
    wd.playerAttack = (hb, dmg, atk, pl) => this.playerAttack(hb, dmg, atk, pl);
    this.patrons = []; this.npcs = []; this.doors = []; this.props = []; this.walls = []; this.lights = []; this.dancers = [];
    this.fade = 1; this.hint = null; this.hintA = 0; this.hintT = 0; this.zoneIdx = -1; this.zoneT = 0; this.vova = null; this.dark = false;
    L4.BUILD[kind].call(this, wd, o);
    for (const p of this.props) { const d = L4.PROP[p.type]; p.d = d; if (p.scale == null && d.scale) p.scale = d.scale; if (d.solid) { const [w, h] = d.solid; p.box = { x0: p.x - w / 2, x1: p.x + w / 2, top: (p.y || L4.GROUND) - h }; wd.addPlat({ x: p.box.x0, y: p.box.top, w, h: 8, oneway: true, look: 'none' }); } if (d.crawl) { const [w] = Spr.size(d.sheet, d.fr); const ww = w * (p.scale || 1); p.cr = { x0: p.x - ww / 2 + 8, x1: p.x + ww / 2 - 8 }; } }
    const pl = this.player = new L4.Player(o.x != null ? o.x : 80, o.y != null ? o.y : L4.GROUND);
    if (level.carry) { Object.assign(pl.ammo3, level.carry.ammo3); pl.hasSeed = level.carry.hasSeed; pl.green = level.carry.green; pl.weapon = level.carry.weapon === 'chalk' ? 'swatter' : level.carry.weapon; pl.hp = Math.max(level.carry.hp || pl.hp, 40); }
    if (o.facing) pl.facing = o.facing;
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
    const ty = 0;
    wd.cam.x = snap ? tx : U.lerp(wd.cam.x, tx, 0.12); wd.cam.y = snap ? ty : U.lerp(wd.cam.y, ty, 0.12);
  }
  blockers(pl, prevX) {
    for (const p of this.props) {
      if (p.box && pl.y > p.box.top + 3 && pl.x > p.box.x0 - 10 && pl.x < p.box.x1 + 10) { pl.x = prevX; pl.vx = 0; }
      if (p.cr && !pl.crouch && pl.onGround && pl.x > p.cr.x0 && pl.x < p.cr.x1) { pl.x = prevX; pl.vx = 0; if (!this.crawlHintT || G.t > this.crawlHintT) { this.crawlHintT = G.t + 4; this.say('Тут не пройти в полный рост — пригнись {down} и ползи.', 3); } }
    }
    if (this.guide && !this.guide.done && pl.x > this.guide.x - 26) { pl.x = Math.min(prevX, this.guide.x - 26); pl.vx = 0; }
  }
  update(dt) {
    const wd = this.world, pl = this.player, I = G.Input;
    wd.t += dt; this.level.stats.time += dt;
    if (this.fade > 0) this.fade = Math.max(0, this.fade - dt * 2);
    wd.updatePlats(dt);
    if (!pl.climb && (I.held('up') || I.held('down'))) for (const l of wd.ladders) { const cxl = l.x + l.w / 2; if (Math.abs(pl.x - cxl) < 30 && pl.y >= l.y - 4 && pl.y - 30 <= l.y + l.h && !(I.held('up') && pl.y <= l.y + 3) && !(I.held('down') && pl.y > l.y + 10)) pl.x = cxl; }
    const prevX = pl.x;
    if (!this.frozen && !pl.held) pl.update(dt, wd);
    else if (pl.held) { pl.animT += dt; pl.choosePose(dt); }
    this.blockers(pl, prevX);
    pl.x = this.kind === 'boss' ? U.clamp(pl.x, 62, 578) : U.clamp(pl.x, 12, this.kind === 'tower' ? 428 : this.W - 12);
    for (const p of wd.projs) {
      p.update(dt, wd);
      if (p.dead) continue;
      if (this.boss && this.boss.dieT == null && U.overlap(p.box, this.boss.box)) { this.boss.takeHit(p.dmg, p.x - p.vx, false); p.dead = true; p.poof(); continue; }
      for (const e of wd.enemies) if (e.dieT == null && !(p.hitSet && p.hitSet.has(e)) && U.overlap(p.box, e.box)) {
        const killed = e.hit(p.dmg, Math.sign(p.vx) || 1); Sound.play('hit');
        if (killed) { wd.addScore(e.score); wd.stats.kills++; FX.popText(e.x, e.y - 50, '+' + e.score); if (e.type === 'zombie' && Math.random() < 0.18) wd.pickups.push(new Game.Pickup(Math.random() < 0.75 ? 'tank' : 'bread', e.x, L4.GROUND)); }
        if (p.pierce > 0) { p.pierce--; (p.hitSet || (p.hitSet = new Set())).add(e); } else { p.dead = true; p.poof(); break; }
      }
    }
    wd.projs = wd.projs.filter(p => !p.dead && p.x > wd.cam.x - 60 && p.x < wd.cam.x + W + 60);
    for (const e of wd.enemies) if (e.update) e.update(dt, this);
    wd.enemies = wd.enemies.filter(e => !e.dead);
    for (const g of wd.globs) g.update(dt, wd, pl, this.floorY || L4.GROUND, this);
    wd.globs = wd.globs.filter(g => !g.dead);
    for (const p of wd.pickups) p.update(dt, wd, pl);
    wd.pickups = wd.pickups.filter(p => !p.dead);
    for (const p of this.patrons) p.update(dt, this);
    for (const n of this.npcs) n.update(dt, this);
    if (this.guide) this.guide.update(dt, this);
    if (this.vova) this.vova.update(dt, this);
    for (const cl of wd.clouds) { cl.t += dt; cl.dmgT = (cl.dmgT || 0) - dt; if (cl.dmgT <= 0) { cl.dmgT = 0.4; for (const e of wd.enemies) if (e.dieT == null && Math.abs(e.x - cl.x) < cl.r && e.hit(1, e.x > cl.x ? 1 : -1)) { wd.addScore(e.score); wd.stats.kills++; } } }
    wd.clouds = wd.clouds.filter(cl => cl.t < cl.life);
    if (this.onUpdate) this.onUpdate(dt);
    if (this.onTick) this.onTick(dt);
    if (this.zombieSpawner) this.spawnZombies(dt);
    this.nearDoor = null;
    if (this.kind === 'tower' && pl.onGround && I.pressed('down') && Math.abs(pl.x - 418) < 40 && pl.controls) this.level.stairs(-1);
    for (const d of this.doors) if (Math.abs(pl.x - d.x) < 28 && Math.abs(pl.y - d.y) < 10 && pl.onGround) this.nearDoor = d;
    if (this.nearDoor && I.pressed('up') && pl.controls && !pl.dead && !pl.climb) this.nearDoor.use(this);
    const zs = L4.ZONES[this.kind];
    if (zs) { const zi = zs.findIndex(z => pl.x >= z.x0 && pl.x < z.x1); if (zi !== this.zoneIdx) { this.zoneIdx = zi; this.zoneT = 2.2; } if (this.zoneT > 0) this.zoneT -= dt; }
    if (this.hintT > 0) { this.hintT -= dt; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
    if (pl.dead && pl.deadT > 1.6 && !this.respawning) { this.respawning = true; this.level.stats.deaths++; setTimeout(() => { this.respawning = false; this.level.restartStage(); }, 300); }
    if (this.vova && this.vova.dead && !this.lost) { this.lost = true; pl.controls = false; G.say(this.vova, 'Валера-а-а... я всё...', 2); setTimeout(() => this.level.vovaDied(), 1800); }
    this.camTo(false);
  }
  drawProps(c, cx, cy, layer) {
    for (const p of this.props) {
      if ((p.layer || 'mid') !== layer) continue;
      const sx = p.x - cx; if (sx < -300 || sx > W + 300) continue;
      const fr = p.d.anim ? p.d.fr + (Math.floor(G.t * 1.4 + p.x * 0.01) % 2) * p.d.anim : p.d.fr;
      if (p.type === 'slime') { c.save(); c.translate(sx, (p.y || L4.GROUND) - cy + 6); c.scale(1, 0.45); Spr.draw(c, 'acid', Math.floor(G.t * 4 + p.x) % 4, 0, 0, 1, { scale: 1.2 }); c.restore(); continue; }
      Spr.draw(c, p.d.sheet, fr, sx, (p.y || L4.GROUND) - cy + 2, p.flip ? -1 : 1, { alpha: p.alpha, scale: p.scale });
    }
  }
  drawDancers(c, cx, cy, layer) {
    for (const d of this.dancers) {
      if (d.layer !== layer) continue;
      const sx = d.x - cx * d.par; if (sx < -200 || sx > W + 200) continue;
      Spr.draw(c, 'pole', Math.floor(G.t * 2.4 + d.ph) % 6, sx, d.y - cy, 1, { scale: d.scale, alpha: d.alpha });
    }
  }
  drawLights(c, cx) {
    if (!this.lights.length) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const L of this.lights) {
      const sx = L.x - cx; if (sx < -200 || sx > W + 200) continue;
      const a = Math.sin(G.t * L.sp + L.ph) * 0.55, on = (Math.sin(G.t * 3.1 + L.ph * 2) + 1) / 2;
      const img = L4.img[this.o.escort ? 'cone_g' : L.col ? 'cone_c' : 'cone_m']; if (!img) continue;
      c.save(); c.translate(sx, 22); c.rotate(a); c.globalAlpha = 0.45 + on * 0.4;
      c.drawImage(img, -img.width / 4, 8, img.width / 2, img.height / 2 * 1.4); c.restore();
    }
    c.restore();
    for (const L of this.lights) { const sx = L.x - cx; if (sx > -40 && sx < W + 40) Spr.drawC(c, 'pole', 8, sx, 14, Math.sin(G.t * L.sp + L.ph) * 0.55, 0.8); }
  }
  draw(c) {
    const wd = this.world, cx = Math.round(wd.cam.x), cy = Math.round(wd.cam.y);
    c.fillStyle = '#0d0a10'; c.fillRect(0, 0, W, H);
    c.save(); c.imageSmoothingEnabled = false;
    L4.DRAW_BG[this.kind].call(this, c, cx, cy);
    this.drawDancers(c, cx, cy, 'bg');
    this.drawProps(c, cx, cy, 'bg');
    for (const d of this.doors) d.draw(c, cx, cy, this.nearDoor === d);
    for (const p of this.patrons) p.draw(c, cx, cy);
    for (const w of this.walls) { const [wx, sp] = Array.isArray(w) ? w : [w, 'cdoorwall'], sx = wx - cx; if (sx > -200 && sx < W + 200) Spr.draw(c, sp, 0, sx, H - cy, 1); }
    this.drawProps(c, cx, cy, 'mid');
    for (const p of wd.pickups) p.draw(c, cx, cy);
    for (const n of this.npcs) n.draw(c, cx, cy);
    if (this.guide) this.guide.draw(c, cx, cy);
    const dark = this.isDark();
    for (const e of wd.enemies) if (!dark || !e.d || e.d.dark) e.draw(c, cx, cy);
    if (this.boss) this.boss.draw(c, cx, cy);
    if (this.vova) this.vova.draw(c, cx, cy);
    if (!this.player.held && this.player.visible !== false) this.player.draw(c, cx, cy);
    this.drawProps(c, cx, cy, 'front');
    for (const g of wd.globs) g.draw(c, cx, cy);
    for (const cl of wd.clouds) L3.drawCloud(c, cl, cx, cy);
    c.save(); c.translate(0, -cy); for (const p of wd.projs) p.draw(c, cx); c.restore();
    if (this.drawOverlay) this.drawOverlay(c, cx, cy);
    c.save(); c.translate(-cx, -cy); FX.draw(c); c.restore();
    this.drawLights(c, cx);
    this.drawDancers(c, cx, cy, 'fg');
    this.drawProps(c, cx, cy, 'fg');
    if (this.fgItems) for (const f of this.fgItems) Spr.draw(c, f.sheet, f.fr, f.x - cx * (f.par || 1), f.y - cy, 1, { scale: f.scale });
    if (dark) this.drawDark(c, cx, cy);
    G.drawBubbles(c, cx, cy);
    c.restore();
    L4.drawHUD(c, this.player, wd);
    if (this.boss && this.boss.dieT == null && !this.lairDark) {
      const b = this.boss;
      Art.R(c, 160, H - 26, 320, 16, '#111'); Art.R(c, 162, H - 24, 316, 12, '#3a1010');
      Art.R(c, 162, H - 24, Math.round(316 * b.hp / b.maxHp), 12, b.hp < b.maxHp * 0.25 ? '#ff4020' : '#c85020');
      G.text('БАЙКЕР', W / 2, H - 40, { align: 'center', color: '#ffb080', outline: true });
    }
    if (this.vova) { Art.R(c, 440, 34, 190, 12, '#111'); Art.R(c, 442, 36, Math.round(186 * this.vova.hp / this.vova.maxHp), 8, '#5ab8ff'); G.text('ВОВА', 436, 35, { align: 'right', size: 8, color: '#8cd0ff' }); }
    const zs = L4.ZONES[this.kind];
    if (zs && this.zoneT > 0 && this.zoneIdx >= 0) G.bigTitle(c, zs[this.zoneIdx].name, Math.min(1, this.zoneT), { size: 24, y: 110, color: '#ff8ad8' });
    if (this.nearDoor && this.nearDoor.label) G.text(this.nearDoor.label + '  [ВВЕРХ]', W / 2, H - 28, { align: 'center', color: '#ffd84a', outline: true });
    if (this.player.held === 'carry') G.text('ЖМИ КНОПКИ — ВЫРЫВАЙСЯ!', W / 2, 80, { align: 'center', color: '#ffd84a', outline: true, size: 16 });
    if (this.hint) Game.drawHint(c, this.hint, this.hintA);
    if (this.fade > 0) { c.fillStyle = `rgba(0,0,0,${this.fade})`; c.fillRect(0, 0, W, H); }
  }
  spawnZombies(dt) {
    const wd = this.world, pl = this.player, alive = wd.enemies.filter(e => e.dieT == null).length;
    this.spawnT = (this.spawnT == null ? 1 : this.spawnT) - dt;
    if (this.spawnT > 0 || alive >= 16) return;
    this.spawnT = U.rand(0.35, 0.75);
    const r0 = Math.random(), zv = r0 < 0.22 ? 9 : r0 < 0.4 ? 5 : U.randi(0, 8), cx = wd.cam.x;
    if (zv === 9) { wd.enemies.push(new L4.Foe('zombie', U.clamp(pl.x + (Math.random() < 0.5 ? -1 : 1) * U.rand(200, 320), 20, this.W - 20), 0, { zv, state: 'crawl' })); return; }
    if (zv === 5) { const z = new L4.Foe('zombie', U.clamp(pl.x + U.rand(-120, 120), 20, this.W - 20), -40, { zv, drop: true }); z.onGround = false; wd.enemies.push(z); G.say(z, 'У-у-у!', 0.8); return; }
    const side = Math.random() < 0.5 ? -1 : 1, x = U.clamp(side < 0 ? cx - 30 : cx + W + 30, 10, this.W - 10);
    wd.enemies.push(new L4.Foe('zombie', x, L4.GROUND, { zv }));
  }
  isDark() { return (this.dark && this.player.x > L4.DARK_X0 + 20) || (this.boss && this.boss.blackout) || this.lairDark; }
  drawDark(c, cx, cy) {
    const wd = this.world, pl = this.player;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.save(); c.translate(0, -cy); for (const p of wd.projs) p.draw(c, cx); c.restore();
    for (const e of wd.enemies) if (e.d && e.d.dark) e.draw(c, cx, cy);
    if (this.boss) L4.drawEyes(c, this.boss.x - cx + this.boss.facing * 6, this.boss.y - cy - 112, this.boss.facing, 1, 'angry');
    L4.drawEyes(c, pl.x - cx + pl.facing * 4, pl.y - cy - 70 + Math.sin(G.t * 9), pl.facing, 1, 'hero');
  }
};
L4.Door = class {
  constructor(x, y, label, use, o = {}) { Object.assign(this, { x, y, label, use, done: false }, o); }
  draw(c, cx, cy, near) {
    const x = this.x - cx, y = this.y - cy;
    if (x < -80 || x > W + 80) return;
    if (this.tag) G.text(this.tag, x, y - 112, { align: 'center', size: 8, color: this.done ? '#6a6e74' : '#ffd84a', outline: true });
    if (near) Spr.drawC(c, 'uiicons', this.icon != null ? this.icon : 0, x, y - 118 - Math.abs(Math.sin(G.t * 5)) * 5, 0, 1);
  }
};

L4.HOTEL_G = 242; L4.BOSS_G = 296; L4.TOWER_FH = 300; L4.FLOORS = 3; L4.TOWER_H = L4.FLOORS * L4.TOWER_FH + 60;
L4.floorY = i => L4.TOWER_H - 40 - i * L4.TOWER_FH;
L4.BUILD = {
  club(wd, o) {
    wd.addPlat({ x: 0, y: L4.GROUND, w: L4.CLUB_W, h: 60, oneway: false, look: 'none' });
    this.walls = [30, L4.WALL1, L4.BACK_X];
    const P = (type, x, o2 = {}) => this.props.push(Object.assign({ type, x }, o2));
    const esc = !!o.escort;
    // ресепшен: диван с гостем и хостес (задний план); колонки; канат
    P('rope', 330, { layer: 'bg' }); if (!esc) P('sofaA', 560, { layer: 'bg', y: L4.GROUND - 16 }); P('speakers', 800);
    // танцпол: столики с гостями — задний план; перепрыгнуть колонки; проползти под сценой шеста и стойкой
    if (!esc) { P('tableA', 1060, { layer: 'bg', y: L4.GROUND - 18 }); P('djA', 1620, { layer: 'bg', y: L4.GROUND - 22 }); P('table2A', 2150, { layer: 'bg', y: L4.GROUND - 18 }); P('tableA', 2290, { layer: 'bg', y: L4.GROUND - 18, flip: true }); }
    P('pole', 1320, { layer: 'front' }); P('speakers', 1500); P('bar', 1880, { layer: 'front' }); P('speakers', 2260);
    if (esc) for (const x of [420, 700, 1100, 1450, 1700, 2100, 2500, 2800, 3050]) P('slime', x + U.rand(-40, 40), { layer: 'bg' });
    this.fgItems = [{ sheet: 'fg2', fr: 1, x: 680, y: H + 20, par: 1.3, scale: 1.1 }, { sheet: 'fg2', fr: 3, x: 1250, y: H + 30, par: 1.3 }, { sheet: 'fg2', fr: 0, x: 2520, y: H + 34, par: 1.3 }, { sheet: 'fg2', fr: 4, x: 1150, y: H + 30, par: 1.3 }, { sheet: 'fg2', fr: 5, x: 2900, y: H + 30, par: 1.3 }];
    this.dancers = [
      { x: 1180, y: L4.GROUND - 40, par: 0.85, scale: 0.72, alpha: 0.8, layer: 'bg', ph: 0 },
      { x: 1760, y: L4.GROUND - 40, par: 0.85, scale: 0.72, alpha: 0.8, layer: 'bg', ph: 2 },
      { x: 1450, y: H + 70, par: 1.3, scale: 1.25, alpha: 1, layer: 'fg', ph: 4 },
    ];
    if (esc) this.dancers = [];
    for (let x = 1000; x < 2600; x += 160) if (esc) this.lights.push({ x, sp: 0.9 + Math.random(), ph: Math.random() * 6 });
    for (let x = 1000; x < 2600; x += 160) this.lights.push({ x, sp: 0.6 + Math.random() * 0.8, ph: Math.random() * 6, col: Math.random() < 0.5 });
    [[1000, 0], [1240, 1], [1600, 2], [2050, 3], [2200, 1], [620, 2]].forEach(([x, fr]) => this.patrons.push(new L4.Patron(x, { fr })));
    this.npcs.push(new L4.Bouncer(1702, 'bouncerA', { guard: true, facing: -1 }), new L4.Bouncer(2062, 'bouncerB', { guard: true, facing: -1 }));
    this.npcs.push(new L4.Bouncer(L4.STAIRS_X - 46, 'bouncerB', { idle: 'lean', facing: 1 }));
    if (!this.level.stairsOpen) this.props.push({ type: 'rope', x: L4.STAIRS_X, layer: 'mid' });
    this.doors.push(new L4.Door(L4.STAIRS_X, L4.GROUND, 'ЛЕСТНИЦА В ОТЕЛЬ', st => st.level.enterTower(), { icon: 1 }));
    this.doors.push(new L4.Door(L4.DOOR_X, L4.GROUND, 'ЖЕЛЕЗНАЯ ДВЕРЬ', st => st.level.metalDoor()));
    this.doors.push(new L4.Door(L4.WC_X, L4.GROUND, 'ТУАЛЕТ', st => st.level.enterWC(), { icon: 4 }));
    if (!o.escort && !o.scene && !this.level.guided) this.guide = new L4.Guide(this);
    if (o.escort) { this.patrons = []; this.npcs = []; this.zombieSpawner = true; }
    this.patronLines = ['Приве-е-ет, рыжий!', 'Классная фуражка!', 'Потанцуем?', 'Бар — налево!', 'Ты к кому, красавчик?'];
    this.drawOverlay = (c, cx, cy) => { const hx = L4.DOOR_X - cx; if (hx > -40 && hx < W + 40) Spr.drawC(c, 'hatch', this.hatchFr || 0, hx, L4.HATCH_Y - cy, 0, 1); };
  },
  tower(wd, o) {
    const lv = this.level, fl = this.floor = o.floor || 0;
    wd.addPlat({ x: 0, y: L4.HOTEL_G, w: 640, h: 60, oneway: false, look: 'none' });
    [91, 224, 357].forEach((x, k) => {
      const id = fl * 3 + k, room = lv.rooms[id];
      this.doors.push(new L4.Door(x, L4.HOTEL_G, 'НОМЕР ' + (fl + 1) + '0' + (k + 1) + (room.cleared ? ' (ПУСТО)' : ''), st => st.level.enterRoom(id), { icon: 4 }));
    });
    // лестница справа: {up} — выше, {down} — ниже (на 1 этаже вниз — выход в клуб)
    this.doors.push(new L4.Door(418, L4.HOTEL_G, fl < L4.FLOORS - 1 ? 'ЛЕСТНИЦА: ВВЕРХ / ВНИЗ' : 'ЛЕСТНИЦА: ВНИЗ', st => st.level.stairs(1), { icon: fl < L4.FLOORS - 1 ? 1 : 2 }));
    this.fgItems = [{ sheet: 'fg2', fr: 6, x: 30, y: H + 30, scale: 1 }];
  },
  room(wd, o) {
    const r = o.room;
    wd.addPlat({ x: 0, y: L4.GROUND, w: 640, h: 60, oneway: false, look: 'none' });
    this.doors.push(new L4.Door(100, L4.GROUND, 'ВЫЙТИ', st => st.level.leaveRoom()));
    this.fgItems = [{ sheet: 'fg2', fr: [7, 1, 5, 4][o.room.id % 4], x: 600, y: H + 30, scale: 1 }];
    if (!r.cleared) r.foes.forEach((t, k) => wd.enemies.push(new L4.Foe(t, k ? 560 : 300, L4.GROUND)));
    this.nerd = r.id % 4;
    this.roomData = r;
  },
  inner(wd, o) {
    wd.addPlat({ x: 0, y: L4.GROUND, w: L4.INNER_W, h: 60, oneway: false, look: 'none' });
    this.walls = [[30, 'ddoorwall'], [L4.DARK_X0, 'ddoorwall']];
    this.dark = !o.lightsOn;
    if (!o.escort) {
      for (const x of [460, 1000, 1480]) this.npcs.push(new L4.Flirt(x, 'dancer'));
      for (const x of [720, 1260]) this.npcs.push(new L4.Flirt(x, 'carrier'));
      // остальные гости зала: подмигивают, машут, зовут выпить
      [[300, 1], [600, 3], [880, 4], [1130, 7], [1380, 5], [1640, 2]].forEach(([x, fr]) => this.patrons.push(new L4.Patron(x, { sheet: 'men', fr, dance: Math.random() < 0.5 })));
      this.patronLines = ['Какой мужчина!', 'Коктейль «Северное сияние» — за мой счёт!', 'Приходи ко мне на омлет!', 'Подмигну-ка я тебе...', 'Капитан, вы к нам надолго?', 'Какие плечи!'];
      let pair = 0;
      for (let x = 2000; x < 3300; x += U.randi(240, 320)) { const y = L4.GROUND - U.rand(60, 120); wd.enemies.push(new L4.Foe('eyes', x, y, { pair })); wd.enemies.push(new L4.Foe('eyes', x + 36, y + 6, { pair })); pair++; }
      this.doors.push(new L4.Door(L4.LEVER_X, L4.GROUND, 'ДВЕРЬ', st => st.level.enterLair()));
    }
    for (let x = 200; x < L4.DARK_X0; x += 200) this.lights.push({ x, sp: 0.5 + Math.random(), ph: Math.random() * 6, col: Math.random() < 0.5 });
    this.fgItems = [{ sheet: 'fg2', fr: 2, x: 500, y: H + 30, par: 1.3 }, { sheet: 'fg2', fr: 0, x: 900, y: H + 34, par: 1.3 }, { sheet: 'fg2', fr: 4, x: 1200, y: H + 30, par: 1.3 }, { sheet: 'fg2', fr: 3, x: 1600, y: H + 30, par: 1.3 }];
    for (const x of [560, 1180]) this.props.push({ type: 'speakers', x });
    this.props.push({ type: 'rope', x: 330, layer: 'bg' }, { type: 'rope', x: 1390, layer: 'bg' });
    if (o.escort) { this.zombieSpawner = true; for (const x of [400, 900, 1500, 2300, 3000]) this.props.push({ type: 'slime', x, layer: 'bg' }); }
  },
  wc(wd, o) {
    wd.addPlat({ x: 0, y: L4.GROUND, w: 640, h: 60, oneway: false, look: 'none' });
    this.doors.push(new L4.Door(82, L4.GROUND, 'ВЫЙТИ', st => st.level.leaveWC()));
    const esc = !!o.escort;
    this.stalls = [{ x: 231, what: 'kesha', locked: esc }, { x: 336, what: 'hookah' }, { x: 443, what: 'bum' }, { x: 553, what: 'gun' }];
    for (const s of this.stalls) { s.open = this.level.stallsOpen && this.level.stallsOpen[s.what] && !s.locked; this.doors.push(new L4.Door(s.x, L4.GROUND, s.locked ? 'ЗАПЕРТО' : 'ОТКРЫТЬ КАБИНКУ', st => st.level.openStall(s), { icon: s.locked ? 5 : 3 })); }
    this.fgItems = [{ sheet: 'fg2', fr: 5, x: 20, y: H + 30, scale: 1.1 }];
  },
  boss(wd) {
    wd.addPlat({ x: -40, y: L4.BOSS_G, w: 720, h: 60, oneway: false, look: 'none' });
    this.platsB = [[22, 212, 160], [456, 212, 164], [222, 116, 196]];
    for (const [x, y, w] of this.platsB) wd.addPlat({ x, y, w, h: 10, oneway: true, look: 'none' });
    for (const x of [26, 614]) this.props.push({ type: 'bigspk', x, y: L4.BOSS_G });
    this.floorY = L4.BOSS_G;
  },
};
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
  wc(c) {
    if (L4.img.club_wc2) c.drawImage(L4.img.club_wc2, 0, 0, W, H);
    for (const s of this.stalls) {
      if (!s.open) continue;
      const fr = s.what === 'hookah' ? 1 : s.what === 'gun' ? (this.level.gunTaken ? 0 : 2) : s.what === 'bum' ? 3 + Math.floor(G.t * 1.2) % 2 : 0;
      { const f = Spr.frame('stalls2', fr), w = f[2] * 0.43; c.save(); c.beginPath(); c.rect(s.x - w / 2 + w * 0.13, 0, w, H); c.clip(); Spr.draw(c, 'stalls2', fr, s.x, 250, 1, { scale: 0.86 }); c.restore(); }
      if (s.what === 'kesha') Spr.drawAnim(c, 'kesha4', Math.floor(G.t * 0.7) % 2 ? 'thumbs' : 'sniff', G.t, s.x, 248, 1, { scale: 0.9 });
    }
  },
  club(c, cx) {
    for (const z of L4.ZONES.club) if (z.wall !== 'club_back') L4.drawWallStrip(c, this.o.escort && L3.img[z.wall + '_z'] ? z.wall + '_z' : z.wall, z.x0, z.x1, cx, 0, null);
    const bx = L4.BACK_X - cx; if (bx < W && L4.img.club_back3) c.drawImage(L4.img.club_back3, bx, 0, W, H);
    const kx = 2470 - cx; if (kx > -200 && kx < W + 200) Spr.draw(c, 'cabstage', this.o.escort ? 3 : [0, 1, 0, 2, 0, 3][Math.floor(G.t * 2.4) % 6], kx, L4.GROUND - 10, 1, { scale: 0.7 });
  },
  tower(c) { if (L4.img.hotel_floor2) c.drawImage(L4.img.hotel_floor2, 0, 0, W, H); G.text('ЭТАЖ ' + (this.floor + 1), 20, 44, { size: 8, color: '#ff8ad8', outline: true }); },
  room(c) { const r = this.roomData; const img = L4.img['room' + (r.id % 4)]; if (img) c.drawImage(img, 0, 0, W, H); Spr.draw(c, 'nerds', this.nerd + (Math.floor(G.t * 1.2 + this.nerd) % 2) * 4, 430, L4.GROUND + 6, 1); },
  inner(c, cx) {
    for (const z of L4.ZONES.inner) L4.drawWallStrip(c, this.o.escort && L3.img[z.wall + '_z'] ? z.wall + '_z' : z.wall, z.x0, z.x1, cx, 0, z.x0 > 0 && !this.o.escort ? 'rgba(0,0,0,0.5)' : null);
    if (this.dark) { const dx0 = L4.DARK_X0 - cx; if (dx0 < W) { c.fillStyle = '#000'; c.fillRect(Math.max(0, dx0), 0, W, H); } }
  },
  boss(c) {
    if (L4.img.biker_bg) c.drawImage(L4.img.biker_bg, 0, 0, W, H);
    c.save(); c.translate(70, 170); if (this.level.leverOn) c.scale(1, -1); Spr.draw(c, 'l4fx', 7, 0, this.level.leverOn ? 40 : 0, 1); c.restore();
    if (!this.level.vovaFree) Spr.drawAnim(c, 'vova', 'chained', G.t, 320, L4.BOSS_G - 150, 1, { alpha: 0.95 });
    else if (this.level.bikerDown) Spr.drawAnim(c, 'biker', 'ko', G.t, this.level.bikerDown, L4.BOSS_G, -1);
  },
};

// =====================================================================
// БОСС: БАЙКЕР
// =====================================================================
L4.Biker = class {
  constructor(st) {
    Object.assign(this, { st, x: 520, y: L4.BOSS_G, vx: 0, vy: 0, facing: -1, hp: Math.round(320 * (G.BOSS_MULT || 1)), t: 0, s: 'idle', stT: 0, cool: 1.5, onGround: true, flash: 0, headH: 140, voice: 110, dieT: null, waves: [], rays: [], blackout: false, blackT: 0 });
    this.maxHp = this.hp;
  }
  get box() { return { x: this.x - 26, y: this.y - 126, w: 52, h: 126 }; }
  set(s) { this.s = s; this.stT = 0; }
  takeHit(dmg) {
    if (this.dieT != null) return;
    const mul = this.s === 'taunt' ? 3 : 1;
    this.hp -= dmg * mul; this.flash = 0.1; Sound.play('hit'); this.st.world.addScore(40 * dmg * mul);
    if (mul > 1) { FX.popText(this.x, this.y - 140, 'x3!', '#ffd84a'); if (Math.random() < 0.3) G.say(this, U.choice(['Ай-ай-ай!', 'Больно же!']), 1); }
    if (this.hp <= 0) { this.hp = 0; this.dieT = 0; this.blackout = false; this.blackT = 0; this.rays = []; this.waves = []; this.st.level.bossDown(); }
  }
  mouth() { return [this.x + this.facing * 16, this.y - 106]; }
  castRay(ang) {
    const [mx, my] = this.mouth(), dx = Math.cos(ang), dy = Math.sin(ang);
    let len = 900;
    for (const p of this.st.props) { if (!p.box) continue; for (let t = 10; t < len; t += 6) { const x = mx + dx * t, y = my + dy * t; if (x > p.box.x0 && x < p.box.x1 && y > p.box.top && y < L4.BOSS_G) { len = t; break; } } }
    for (let t = 10; t < len; t += 6) if (my + dy * t > L4.BOSS_G) { len = t; break; }
    return { x0: mx, y0: my, ang, len };
  }
  rayHits(r, pl) { const b = pl.box; for (let t = 0; t < r.len; t += 8) { const x = r.x0 + Math.cos(r.ang) * t, y = r.y0 + Math.sin(r.ang) * t; if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) return true; } return false; }
  update(dt, st) {
    const pl = st.player, wd = st.world; this.t += dt; this.stT += dt; if (this.flash > 0) this.flash -= dt;
    if (this.dieT != null) { this.dieT += dt; return; }
    const py = this.y; this.vy = Math.min(800, this.vy + 1500 * dt); this.y += this.vy * dt; this.x += this.vx * dt;
    const g = wd.groundAt(this.x, py, this.y, 6); if (g && this.vy > 0) { if (!this.onGround && this.vy > 300) { G.shake(6, 0.25); Sound.play('stomp'); FX.dust(this.x, g.y, 10); } this.y = g.y; this.vy = 0; this.onGround = true; } else if (!g) this.onGround = false;
    this.x = U.clamp(this.x, 70, 570); if (this.y > L4.BOSS_G) { this.y = L4.BOSS_G; this.vy = 0; this.onGround = true; } if (this.y < 40) this.y = 40;
    if (U.overlap(this.box, pl.box) && this.s === 'charge') pl.hurt(18, this.x, wd);
    this.cool -= dt;
    const rage = this.hp < this.maxHp * 0.4, fast = this.hp < this.maxHp * 0.6 ? 0.5 : 0.75;
    for (const w of this.waves) {
      w.t += dt;
      if (w.t < 10) { // преследуют Валеру
        const tx = pl.x, ty = pl.y - 40, a = Math.atan2(ty - w.y, tx - w.x), sp = 95;
        w.vx = U.lerp(w.vx, Math.cos(a) * sp, dt * 1.6); w.vy = U.lerp(w.vy, Math.sin(a) * sp, dt * 1.6);
        if ((w.hitT = (w.hitT || 0) - dt) <= 0 && !pl.dead && Math.hypot(pl.x - w.x, pl.y - 40 - w.y) < 20) { w.hitT = 1; pl.hurt(11, w.x, wd); G.shake(3, 0.15); }
      } else { w.vy -= 200 * dt; } // улетают
      w.x += w.vx * dt; w.y += w.vy * dt;
    }
    this.waves = this.waves.filter(w => w.y > -60 && w.t < 14);
    this.rays = [];
    switch (this.s) {
      case 'idle':
        this.vx *= 0.8; this.facing = pl.x > this.x ? 1 : -1;
        if (this.cool <= 0) {
          const r = Math.random();
          if (rage && r < 0.35) this.set('rage');
          else if (r < 0.2) { this.set('charge'); this.vx = this.facing * 320; Sound.play('shout'); G.say(this, U.choice(['ВР-Р-РУМ!', 'С дороги!']), 1); }
          else if (r < 0.36) { this.set('jump'); const p = U.choice(st.platsB); this.jx = p[0] + p[2] / 2; this.vy = -620; this.vx = (this.jx - this.x) / 0.8; this.onGround = false; Sound.play('jump'); }
          else if (r < 0.52) this.set('sing');
          else if (r < 0.64 && !this.blackT) this.set('remote');
          else if (r < 0.84) this.set('rainbow');
          else this.set('taunt');
        }
        break;
      case 'charge': if (this.stT > 1.1 || this.x <= 72 || this.x >= 568) { this.vx = 0; this.set('idle'); this.cool = U.rand(0.5, 1) * fast; } break;
      case 'jump': if (this.onGround && this.stT > 0.3) { this.vx = 0; this.set('idle'); this.cool = U.rand(0.5, 1); } break;
      case 'sing':
        this.vx = 0;
        if (this.stT - dt <= 0) G.say(this, U.choice(['♪ Я — байкер, я — ветер! ♪', '♪ Мой гараж — мой дом! ♪', '♪ Мото-мото-любовь! ♪']), 2.2);
        if (Math.random() < dt * 6) G.shake(3, 0.15);
        if (this.stT > 0.4 && Math.floor(this.stT * 1.2) !== Math.floor((this.stT - dt) * 1.2) && this.waves.length < 6) { for (const p of st.props) this.waves.push({ x: p.x, y: L4.BOSS_G - 80, vx: p.x < 320 ? 120 : -120, vy: -30, t: 0 }); Sound.play('boom'); G.shake(5, 0.3); }
        if (this.stT > 2.8) { this.set('idle'); this.cool = U.rand(0.5, 1) * fast; }
        break;
      case 'remote':
        this.vx = 0;
        if (this.stT > 0.4 && !this.blackT) { this.blackT = U.rand(5, 10); Sound.play('lever'); G.say(this, 'А теперь — интим!', 1.4); }
        if (this.stT > 0.9) { this.set('idle'); this.cool = U.rand(0.6, 1); }
        break;
      case 'rainbow': {
        this.vx = 0; this.facing = pl.x > this.x ? 1 : -1;
        const [mx, my] = this.mouth(), want = Math.atan2(pl.y - 50 - my, pl.x - mx);
        if (this.aim == null) this.aim = want;
        let dA = want - this.aim; while (dA > Math.PI) dA -= Math.PI * 2; while (dA < -Math.PI) dA += Math.PI * 2;
        this.aim += U.clamp(dA, -dt * 1.7, dt * 1.7);
        if (this.stT > 0.7 && this.stT < 2.2) { const ray = this.castRay(this.aim); this.rays.push(ray); if (!pl.dead && this.rayHits(ray, pl)) pl.hurt(16, this.x, wd); if (!this.snd) { this.snd = true; Sound.play('steam'); } }
        if (this.stT > 2.4) { this.snd = false; this.aim = null; this.set('idle'); this.cool = U.rand(0.6, 1.1) * fast; }
        break;
      }
      case 'taunt':
        this.vx = 0; this.facing = pl.x > this.x ? -1 : 1;
        if (this.stT - dt <= 0) G.say(this, U.choice(['Ну давай, ударь!', 'Слабо сюда, рыжий?', 'Вот сюда, по мишени!']), 2.4);
        if (this.stT > 1.8) { this.set('idle'); this.cool = U.rand(0.4, 0.8); }
        break;
      case 'rage':
        this.vx = 0;
        if (this.stT - dt <= 0) G.say(this, 'А-А-А! ВСЕХ РАСКРАШУ!', 1.6, { shout: true });
        if (this.stT > 0.5 && this.stT < 3.4) { for (let k = 0; k < 7; k++) { const ray = this.castRay(Math.PI + k * (Math.PI / 6) + Math.sin(this.stT * 1.2) * 0.3); this.rays.push(ray); if (!pl.dead && this.rayHits(ray, pl)) pl.hurt(13, this.x, wd); } if (Math.random() < dt * 8) G.shake(2, 0.1); }
        if (this.stT > 3.6) { this.set('idle'); this.cool = U.rand(0.6, 1); }
        break;
    }
    if (this.blackT > 0 && this.s === 'idle' && this.cool > 0.4) this.cool = 0.4;
    if (this.blackT > 0) { this.blackT -= dt; this.blackout = Math.floor(G.t * 1.6) % 2 === 0; if (this.blackT <= 0) { this.blackT = 0; this.blackout = false; } }
  }
  draw(c, cx, cy) {
    const s = this.s;
    const anim = this.dieT != null ? 'ko' : this.flash > 0 && s !== 'taunt' ? 'hurt' : s === 'charge' ? 'run' : s === 'remote' ? 'throw' : s === 'sing' ? 'sing' : s === 'rainbow' || s === 'rage' ? 'roar' : s === 'taunt' ? 'taunt' : !this.onGround ? 'jump' : 'stand';
    let tilt = 0;
    if (s === 'rainbow' && this.aim != null) { const a = this.facing > 0 ? this.aim : Math.PI - this.aim; let n = a; while (n > Math.PI) n -= Math.PI * 2; tilt = U.clamp(n * 0.35, -0.35, 0.35) * this.facing; }
    else if (s === 'sing') tilt = Math.sin(this.t * 8) * 0.06;
    Spr.drawAnim(c, 'biker', anim, this.t, this.x - cx, this.y - cy, this.facing, { flash: this.flash > 0 ? '#ffffff' : null, rot: tilt });
    if (s === 'taunt' && (G.t * 6 | 0) % 2) G.text('x3', this.x - this.facing * 26 - cx, this.y - 80 - cy, { align: 'center', size: 16, color: '#ffd84a', outline: true });
    if (s === 'rainbow' && this.stT < 0.7 && this.aim != null) { const r = this.castRay(this.aim); c.save(); c.globalAlpha = 0.3 + Math.sin(G.t * 30) * 0.2; L4.drawRay(c, r, cx, cy, 0.25); c.restore(); }
    for (const r of this.rays) L4.drawRay(c, r, cx, cy, 1);
    for (const w of this.waves) { c.save(); c.translate(w.x - cx, w.y - cy); c.rotate(Math.atan2(w.vy, w.vx)); c.globalAlpha = w.t > 10 ? Math.max(0, 1 - (w.t - 10) / 3) : 1; Spr.drawC(c, 'l4fx2', 3, 0, 0, 0, 1 + Math.sin(w.t * 8) * 0.1); c.restore(); }
  }
};
L4.drawRay = function (c, r, cx, cy, sc) {
  c.save(); c.translate(r.x0 - cx, r.y0 - cy); c.rotate(r.ang);
  for (let x = 0; x < r.len; x += 70) { const w = Math.min(76, r.len - x); c.save(); c.beginPath(); c.rect(x, -20, w, 40); c.clip(); Spr.draw(c, 'l4fx', 6, x + 38, 10 * sc, 1, { scale: sc }); c.restore(); }
  c.restore();
};

// =====================================================================
// КОНТРОЛЛЕР УРОВНЯ
// =====================================================================
L4.Level = class {
  constructor() {
    this.id = 4;
    this.stats = { time: 0, dmg: 0, kills: 0, deflect: 0, secrets: 0, food: 0, deaths: 0 };
    this.score = 0; this.mode = null; this.hasPassword = false; this.carry = null; this.stairsOpen = false;
    this.makeRooms();
  }
  makeRooms() {
    const types = ['whip', 'sailor', 'sumo', 'gum'];
    const pal = [[0, 1], [40, 1.2], [300, 1.1], [200, 0.9], [120, 1.2], [260, 1.3], [170, 0.7], [80, 1.1], [330, 1.4]];
    this.rooms = [];
    for (let i = 0; i < 9; i++) { const a = U.choice(types); let b; do { b = U.choice(types); } while (b === a && Math.random() < 0.8); this.rooms.push({ id: i, foes: [a, b], cleared: false, loot: U.choice(['pelmeni3', 'bread', 'battery', 'pelmeni3']), hue: pal[i][0], sat: pal[i][1] }); }
    this.passRoom = U.randi(3, 8);
    this.rooms[this.passRoom].loot = 'password';
  }
  start(opts = {}) {
    if (opts.boss) { this.carry = { ammo3: { swatter: 100, chalk: 0, seed: 150 }, hasSeed: true, green: false, weapon: 'seed' }; this.startBoss(); return; }
    if (opts.escort) { this.carry = { ammo3: { swatter: 100, chalk: 0, seed: 200 }, hasSeed: true, green: true, weapon: 'seed' }; this.startEscort(); return; }
    if (opts.tower) { this.stairsOpen = true; this.setStage('tower', { x: 405, y: L4.HOTEL_G, floor: 0 }); return; }
    if (opts.inner) { this.carry = { ammo3: { swatter: 100, chalk: 0, seed: 150 }, hasSeed: true, weapon: 'seed' }; this.setStage('inner', { x: 80 }); return; }
    this.playScene(L4.sceneIntro(this), () => { this.setStage('club', { x: 120 }); this.stage.say('Иди за горничной. {jump} — прыжок, {down} — присесть и ползти, {punch} — удар, {switch} — оружие.', 7); Music.play('epic'); });
  }
  playScene(gen, next) { this.mode = 'scene'; Scene.run(gen, next); }
  setStage(kind, o = {}) {
    if (this.stage && this.stage.player) this.stage.carry();
    this.stageArgs = [kind, o];
    this.stage = new L4.Stage(this, kind, o); this.mode = 'stage'; FX.list = []; G.bubbles = [];
  }
  restartStage() { const [k, o] = this.stageArgs; if (this.carry) this.carry.hp = 100; const r = this.stage.roomData; if (k === 'boss') { this.startBoss(); return; } this.stage = null; this.setStage(k, Object.assign({}, o)); if (r && k === 'room') { this.stage.roomData = r; this.stage.onUpdate = dt => this.roomTick(dt); } }
  enterTower() {
    if (!this.stairsOpen) { const b = this.stage.npcs.find(n => n.idle === 'lean'); if (b) { b.pose = 'shove'; b.poseT = 0.6; G.say(b, 'Только для гостей отеля. Номер снимал? Нет? Гуляй.', 2.2); } return; }
    this.setStage('tower', { x: 405, y: L4.HOTEL_G, floor: 0, facing: -1 }); if (!this.hasPassword) this.stage.say('Три этажа, девять номеров. Где-то тут записан пароль. Лестница справа: {up} — выше, {down} — ниже.', 6);
  }
  stairs(dir) {
    const fl = this.stage.floor || 0;
    if (G.Input.held('down') || dir < 0) { if (fl === 0) { this.leaveTower(); return; } this.setStage('tower', { x: 405, y: L4.HOTEL_G, floor: fl - 1, facing: -1 }); Sound.play('jump'); return; }
    if (fl < L4.FLOORS - 1) { this.setStage('tower', { x: 405, y: L4.HOTEL_G, floor: fl + 1, facing: -1 }); Sound.play('jump'); }
  }
  leaveTower() { this.setStage('club', { x: L4.STAIRS_X, facing: -1 }); if (this.hasPassword) this.stage.say('Пароль есть! Теперь — к железной двери.', 4); }
  enterRoom(id) {
    const r = this.rooms[id], st = this.stage; this.towerPos = { x: st.player.x, y: st.player.y, floor: st.floor };
    this.setStage('room', { x: 90, room: r, facing: 1 });
    if (!r.cleared) G.say(this.stage.player, U.choice(['Опа... У вас тут весело.', 'Здрасьте! Я от Вовы.', 'Кажется, я не вовремя.']), 1.8);
    this.stage.onUpdate = dt => this.roomTick(dt);
  }
  roomTick() {
    const st = this.stage, r = st.roomData;
    if (!r.cleared && st.world.enemies.every(e => e.dieT != null)) {
      r.cleared = true;
      const loot = r.loot;
      if (loot === 'password') { this.hasPassword = true; st.world.pickups.push(new Game.Pickup('tp', 330, L4.GROUND)); G.say(st.player, 'Записка на тумбочке: «Пароль — ЧЁРНАЯ КОМНАТА». Ага!', 3); st.say('Пароль найден! Возвращайся к железной двери за кулисами.', 6); Sound.play('checkpoint'); }
      else if (loot === 'seedgun') st.world.pickups.push(new Game.Pickup('seedgun', 330, L4.GROUND));
      else { st.world.pickups.push(new Game.Pickup(loot, 330, L4.GROUND)); if (!this.hasPassword && Math.random() < 0.6) G.say(st.player, U.choice(['Пароля тут нет...', 'Пусто. Дальше!', 'Эх, не тут...']), 1.6); }
    }
  }
  leaveRoom() {
    const st = this.stage;
    if (!st.roomData.cleared) { G.say(st.player, 'Не выпускают! Сначала разберусь с ними.', 1.6); st.say('Из номера не уйти, пока не победишь обоих.', 3); return; }
    const p = this.towerPos || { x: 320, y: L4.HOTEL_G, floor: 0 }; this.setStage('tower', { x: p.x, y: L4.HOTEL_G, floor: p.floor || 0 });
  }
  metalDoor() {
    const st = this.stage; st.carry();
    const couple = !this.stairsOpen && !this.hasPassword;
    this.playScene(L4.sceneHatch(this, this.hasPassword, couple), () => {
      if (this.hasPassword) this.setStage('inner', { x: 80 });
      else { this.stairsOpen = true; this.setStage('club', { x: L4.DOOR_X - 60, facing: -1 }); this.stage.say('Отель наверху открыт — ищи пароль в номерах. Лестница — [ВВЕРХ] у двери рядом.', 6); }
    });
  }
  enterWC() {
    const esc = !!this.stage.vova, hp = esc ? this.stage.vova.hp : 0;
    this.setStage('wc', { x: 110, facing: 1, escort: esc });
    const st = this.stage;
    if (esc) { this.addVova(true); st.vova.hp = hp; st.zombieSpawner = true; }
    st.onTick = () => {
      if (esc && Math.random() < 1 / 240) G.say({ x: 231, y: 250, headH: 110, voice: 210 }, U.choice(['А-а-а! Они лезут!', 'Наташка! Забери меня отсюда скорее!', 'Наташ, я больше не буду нюхать! Спаси!', 'Не открывайте, тут занято-о-о!']), 2.2, { shout: true });
      const bum = st.stalls.find(s => s.what === 'bum' && s.open); if (bum && Math.random() < 1 / 200) { Sound.play('fart'); G.say({ x: bum.x, y: 250, headH: 100, voice: 120 }, U.choice(['*храп*', 'Хр-р-р... *пук*']), 1.2); }
    };
    if (!this.gunTaken && !esc) G.say(st.player, 'Фу-у... Ну и где тут Вова «химичил»? Проверю кабинки.', 2.2);
  }
  openStall(s) {
    const st = this.stage, pl = st.player;
    if (s.locked) { Sound.play('clank'); G.say(pl, 'Заперто. Кеша, держись там!', 1.4); return; }
    if (s.open) return;
    s.open = true; Sound.play('door'); (this.stallsOpen || (this.stallsOpen = {}))[s.what] = true;
    if (s.what === 'kesha') G.say({ x: s.x, y: 250, headH: 110, voice: 210 }, 'О! Валера! Ну Валера — настоящий мужчина! *шмыг*', 2.6);
    if (s.what === 'hookah') G.say(pl, 'Вовин самодельный бульбулятор! Значит, он тут был...', 2.4);
    if (s.what === 'bum') { Sound.play('fart'); st.world.clouds.push({ x: s.x, y: 230, t: 0, life: 2.5, r: 50, row: 0 }); G.say(pl, 'Фу-у-у! Бомж! Закрою обратно...', 2); }
    if (s.what === 'gun' && !this.gunTaken) {
      this.gunTaken = true; pl.hasSeed = true; pl.ammo3.seed = (pl.ammo3.seed || 0) + 150; pl.weapon = 'seed';
      Sound.play('checkpoint'); FX.popText(s.x, L4.GROUND - 130, '«ОСЕМЕНИТЕЛЬ 3000»', '#ffffff');
      G.say(pl, 'Селёдкой пахнет... «Осеменитель 3000» — Вовина наработка!', 3);
    }
  }
  leaveWC() { const esc = !!this.stage.vova, hp = esc && this.stage.vova.hp; this.setStage('club', { x: L4.WC_X, facing: -1, escort: esc }); if (esc) { this.addVova(); this.stage.vova.hp = hp; } }
  enterLair() {
    this.setStage('boss', { x: 150, y: L4.BOSS_G, facing: -1 });
    const st = this.stage; st.lairDark = true;
    st.doors.push(new L4.Door(70, L4.BOSS_G, 'РУБИЛЬНИК', s2 => s2.level.pullLever(), { icon: 3 }));
    st.say('Темно, хоть глаз выколи... На стене слева что-то нащупывается — рубильник?', 5);
  }
  pullLever() { this.stage.carry(); this.leverOn = false; this.playScene(L4.sceneLever(this), () => this.startBoss()); }
  startBoss() {
    this.setStage('boss', { x: 80, y: L4.BOSS_G });
    const st = this.stage; st.boss = new L4.Biker(st);
    st.onUpdate = dt => { st.boss.update(dt, st); st.dropT = (st.dropT == null ? 4 : st.dropT) - dt; if (st.dropT <= 0 && st.boss.dieT == null) { st.dropT = U.rand(7, 10); const pk = new Game.Pickup(Math.random() < 0.8 ? 'tank' : 'bread', U.rand(100, 540), 0); pk.falling = true; st.world.pickups.push(pk); } };
    Music.play('epicBoss'); st.say('Прячься за колонки от радуги и волн. Когда он подставляет зад — бей, урон втрое!', 7);
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
{
  const upd = Game.Pickup.prototype.update;
  Game.Pickup.prototype.update = function (dt, world, pl) {
    if (this.kind === 'seedgun' && !this.dead && !pl.dead && U.overlap(this.box, pl.box)) {
      this.dead = true; pl.hasSeed = true; pl.ammo3.seed = (pl.ammo3.seed || 0) + 150; pl.weapon = 'seed';
      Sound.play('checkpoint'); G.flash(0.2, '#ffffff');
      G.say(pl, 'Селёдкой пахнет... «Осеменитель 3000» — Вовина наработка!', 2.8);
      FX.popText(this.x, this.y - 30, '«ОСЕМЕНИТЕЛЬ 3000»', '#ffffff');
      return;
    }
    upd.call(this, dt, world, pl);
  };
}

// =====================================================================
// КАТСЦЕНЫ
// =====================================================================
L4.sceneStage = (level, kind, o) => { const st = new L4.Stage(level, kind, Object.assign({ scene: true }, o)); st.fade = 0; level.drawScene = c => st.draw(c); level.updateScene = dt => { for (const p of st.patrons) p.update(dt, st); for (const n of st.npcs) if (n.t != null) n.t += dt; st.world.t += dt; st.player.animT = (st.player.animT || 0) + dt; }; return st; };
L4.sceneIntro = level => function* () {
  const st = L4.sceneStage(level, 'club', { x: 60 }); st.player.controls = false; st.player.animSet = 'valera3';
  if (G.portraits.valera3) G.portraits.valera = G.portraits.valera3;
  const v = st.player, maid = new G.Actor('maid', 300, L4.GROUND, -1), nurse = new G.Actor('nurse', 350, L4.GROUND, -1);
  st.patrons.push({ update() {}, draw: (c, cx) => { maid.draw(c, cx, 0); nurse.draw(c, cx, 0); } });
  yield* Scene.moveTo(v, 230, 90, 'walk'); v.animSet = 'valera4'; v.setAnim('capGrab');
  yield 0.5;
  yield* Scene.say('valera', 'Так... В приличное заведение в арбузе не ходят.', v);
  v.setAnim('capOff'); yield 0.5;
  v.setAnim('capThrow'); Sound.play('throw');
  const melon = { x: v.x - 10, y: L4.GROUND - 100, vx: -140, vy: -260, rot: 0 };
  st.patrons.push({ update() {}, draw: (c, cx) => { if (melon.y < L4.GROUND - 6) { Art.item(c, 'melon', melon.x - cx, melon.y, melon.rot, 1.1); } } });
  yield* Scene.tween(0.8, k => { melon.vy += 900 * G.dt; melon.x += melon.vx * G.dt; melon.y += melon.vy * G.dt; melon.rot += G.dt * 9; });
  Sound.play('splash');
  v.animSet = 'valera4'; v.setAnim('capHold'); yield 0.6;
  v.setAnim('capOn'); Sound.play('pickup'); yield 0.5;
  v.setAnim('capFix'); if (G.portraits.valera4) G.portraits.valera = G.portraits.valera4;
  yield* Scene.say('valera', 'Вот. Совсем другое дело. Капитан Валера на службе.', v);
  v.setAnim('stand');
  yield* Scene.say('maid', 'Добро пожаловать в «Дикие кошки»! Вы к кому, товарищ капитан?', maid);
  yield* Scene.say('valera', 'Я к Вове.', v);
  yield* Scene.say('nurse', '...', nurse);
  maid.setAnim('beckon');
  yield* Scene.say('maid', 'Следуйте за мной. И не отставайте.', maid);
  nurse.setAnim('shrug');
  yield* Scene.say('nurse', 'Ещё один голубчик... Сколько их тут уже.', nurse);
};
L4.sceneHatch = (level, hasPass, showCouple) => function* () {
  const st = L4.sceneStage(level, 'club', { x: L4.DOOR_X - 40, facing: 1 }); st.player.controls = false;
  Sound.play('door'); st.hatchFr = 0;
  yield 0.4;
  Sound.play('clank'); st.hatchFr = 1;
  yield* Scene.say('hatch', 'ПАРОЛЬ?', null);
  if (hasPass) {
    yield* Scene.say('valera', 'Чёрная комната.', st.player);
    st.hatchFr = 3;
    yield* Scene.say('hatch', '...Проходи. Добро пожаловать в закрытый клуб.', null);
    Sound.play('door'); G.shake(4, 0.4);
    return;
  }
  yield* Scene.say('valera', 'Э-э-э... Я к Вове?', st.player);
  st.hatchFr = 2;
  yield* Scene.say('hatch', 'Без пароля — никак. Иди отсюда, рыжий.', null);
  Sound.play('clank'); st.hatchFr = 0;
  if (!showCouple) { yield* Scene.say('valera', 'Ладно... Пароль где-то в отеле наверху.', st.player); return; }
  const cp = new G.Actor('couple', L4.STAIRS_X - 260, L4.GROUND, 1); cp.setAnim('walk');
  st.patrons.push({ update(dt) { cp.update(dt); }, draw: (c, cx) => cp.draw(c, cx, 0) });
  yield* Scene.say('valera', 'Хм... А кто это там?', st.player);
  const guard = st.npcs.find(n => n.idle === 'lean'); if (guard) { guard.idle = 'stand'; guard.pose = 'stand'; }
  st.props = st.props.filter(p => !(p.type === 'rope' && p.x === L4.STAIRS_X));
  yield* Scene.tween(2.2, k => { cp.x = U.lerp(L4.STAIRS_X - 260, L4.STAIRS_X - 10, k); });
  cp.setAnim('wink'); G.say(cp, 'Мы в номер, не скучай, капитан!', 1.6); yield 1;
  cp.setAnim('kiss'); yield 0.6;
  Sound.play('door'); cp.setAnim('climb');
  yield* Scene.tween(1.2, k => { cp.x = L4.STAIRS_X - 10 + k * 12; cp.alpha = 1 - k; cp.y = L4.GROUND - k * 30; });
  cp.visible = false;
  yield* Scene.say('valera', 'Отель наверху! Пароль наверняка кто-то из постояльцев записал. Проскочу, пока открыто.', st.player);
};
L4.sceneLever = level => function* () {
  const st2 = L4.sceneStage(level, 'boss', { x: 96, y: L4.BOSS_G, facing: -1 }); st2.player.controls = false; st2.lairDark = true;
  yield* Scene.say('valera', 'Тут рубильник... Ну-ка...', st2.player);
  st2.player.setAnim('swatWind'); yield 0.35;
  st2.player.setAnim('swat'); level.leverOn = true; Sound.play('lever'); G.shake(3, 0.2);
  yield 0.45;
  Sound.play('clank'); yield 0.25;
  st2.lairDark = false; G.flash(0.5, '#ffffff'); Sound.play('boom');
  st2.player.setAnim('stand');
  yield 0.5;
  const biker = new G.Actor('biker', 540, L4.BOSS_G, -1); biker.headH = 140; biker.voice = 110;
  level.drawScene = c => { st2.draw(c); biker.draw(c, 0, 0); };
  yield 0.5;
  yield* Scene.say('vova', 'Валера! Друг! Я больше уже не могу! Меня тут держат на цепях третий день!', null);
  yield* Scene.say('valera', 'Держись, Вова! Сейчас освобожу!', st2.player);
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
  yield* L4.raidScene(level);
  level.drawScene = c => { st.draw(c); }; level.updateScene = dt => { for (const p of st.patrons) p.update(dt, st); st.world.t += dt; };
  yield* Scene.say('vova', 'Ты видел?! От их яда все в клубе превратились в зомби! И охрана, и танцовщицы — все!', null);
  st.patrons = st.patrons.filter(p => !p.vv); const vg = new G.Actor('vovagun', 340, L4.BOSS_G, -1); vg.setAnim('hold');
  st.patrons.push({ vv: true, update(dt) { vg.update(dt); }, draw: (c, cx) => vg.draw(c, cx, 0) });
  vv.visible = false;
  yield* Scene.say('vova', 'Дай-ка «Осеменитель 3000». У зомби совсем другой обмен веществ...', vg);
  vg.setAnim('open'); yield 0.7;
  vg.setAnim('flip'); Sound.play('lever'); G.shake(2, 0.2); yield 0.7;
  vg.setAnim('green'); G.flash(0.3, '#8cff60'); Sound.play('steam'); yield 0.8;
  vg.setAnim('proud');
  yield* Scene.say('vova', 'Щёлк — зелёный режим! Теперь бьёт в два раза злее.', vg);
  vg.setAnim('give'); yield 0.5;
  yield* Scene.say('vova', 'Держи и выводи меня отсюда!', vg);
};
// рейд: танцпол, все персонажи уровня отдыхают; спецназ спускается на тросах и стреляет дротиками; каждый поражённый превращается в зомби
L4.raidScene = function* (level) {
  const st = new L4.Stage(level, 'club', { x: 1500, scene: true }); st.fade = 0; st.player.visible = false; st.guide = null; st.npcs = []; st.patrons = [];
  st.world.cam.x = 1180;
  const crowd = [
    ['hostess', 0, 1250, 'zomba', 0], ['hostess', 4, 1330, 'zomba', 1], ['bouncers', 0, 1410, 'zomba', 2], ['l4a', 4, 1490, 'zomba', 3], ['l4c', 0, 1570, 'zomba', 4],
    ['l4b', 0, 1650, 'zomba', 5], ['men', 3, 1730, 'zomba', 6], ['men', 1, 1810, 'zomba', 7], ['dancers', 0, 1370, 'zombb', 6], ['dancers', 1, 1700, 'zomba', 1],
  ].map(([sh, fr, x, zs, zf], i) => ({ sh, fr, x, zs, zf, t: Math.random() * 6, hit: -1, flip: sh === 'dancers' || sh === 'patrons' ? 1 : -1 }));
  const cmd = [{ x: 1290, y: -90, tx: 1290, ty: 120 }, { x: 1560, y: -120, tx: 1560, ty: 100 }, { x: 1780, y: -80, tx: 1780, ty: 130 }];
  const darts = [];
  level.drawScene = c => {
    st.draw(c); const cx = st.world.cam.x;
    for (const p of crowd) {
      const x = p.x - cx, beat = p.hit < 0 ? -Math.abs(Math.sin(p.t * 4)) * 3 : Math.sin(p.t * 9) * 2;
      if (p.hit >= 0 && p.hit < 0.35) Spr.draw(c, p.sh, p.fr, x, L4.GROUND, p.flip, { flash: (G.t * 20 | 0) % 2 ? '#8cff60' : null });
      else if (p.hit >= 0.35) Spr.draw(c, p.zs, p.zf, x + beat, L4.GROUND, -1);
      else Spr.draw(c, p.sh, p.sh === 'dancers' ? p.fr + (Math.floor(p.t * 2.6) % 2) * 4 : p.fr, x, L4.GROUND + beat, p.flip);
    }
    for (const m of cmd) { Art.R(c, m.x - cx - 1, -10, 2, m.y + 10 - 170, '#1a1a1a'); Spr.drawAnim(c, 'commando', m.y >= m.ty - 2 ? 'rifle' : 'rappel', G.t, m.x - cx, m.y + 160, 1, { scale: 0.9 }); }
    for (const d of darts) { c.save(); c.translate(d.x - cx, d.y); c.rotate(Math.atan2(d.vy, d.vx)); Spr.drawC(c, 'moth2', 4, 0, 0, 0, 0.35); c.restore(); }
  };
  level.updateScene = dt => {
    st.world.t += dt;
    for (const p of crowd) { p.t += dt; if (p.hit >= 0) p.hit += dt; }
    for (const m of cmd) m.y = U.lerp(m.y, m.ty, Math.min(1, dt * 2));
    for (const d of darts) { d.x += d.vx * dt; d.y += d.vy * dt; if (!d.done && Math.abs(d.x - d.tg.x) < 10) { d.done = true; d.tg.hit = 0; Sound.play('squeak'); FX.burst(d.tg.x, L4.GROUND - 60, 6, { colors: ['#8cff60', '#c8ff90'], speed: 90, life: 0.4 }); } }
    for (let i = darts.length - 1; i >= 0; i--) if (darts[i].done) darts.splice(i, 1);
  };
  Sound.play('rope');
  yield 1.2;
  yield* Scene.say('commando2', 'Отряд, огонь дротиками по всему клубу! Операция «Кошки»!', null);
  const order = crowd.slice().sort(() => Math.random() - 0.5);
  for (const tg of order) {
    const m = cmd.reduce((a, b) => Math.abs(b.x - tg.x) < Math.abs(a.x - tg.x) ? b : a), sx = m.x + 14, sy = m.y + 110;
    const T = 0.35; darts.push({ x: sx, y: sy, vx: (tg.x - sx) / T, vy: (L4.GROUND - 60 - sy) / T, tg }); Sound.play('throw');
    yield 0.3;
  }
  yield 0.9;
  G.say({ x: 1500, y: L4.GROUND, headH: 110, voice: 140 }, 'Ы-ы-ы... МОЗГИ-И-И...', 1.8);
  yield 1.8;
};
L4.sceneEnd = level => function* () {
  level.drawScene = c => { if (L4.img.comic4_end) c.drawImage(L4.img.comic4_end, 0, 0, W, H); };
  level.updateScene = () => {};
  yield* Scene.say('vova', '(затягивается из бульбулятора) Валера... спасибо. Нам нужно кое с кем срочно встретиться.', null);
  yield* Scene.say('valera', 'С кем?', null);
  yield* Scene.say('vova', 'Садись назад. По дороге расскажу. Я за рулём.', null);
  Sound.play('door'); yield 0.6;
  level.titleK = 0;
  const d0 = level.drawScene; level.drawScene = c => { d0(c); G.bigTitle(c, 'КОНЕЦ УРОВНЯ 4', level.titleK, { size: 24, color: '#ffd84a' }); };
  yield* Scene.tween(0.5, k => { level.titleK = k; });
  yield 1.6;
};
