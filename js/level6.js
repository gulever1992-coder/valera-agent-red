'use strict';
// ============ УРОВЕНЬ 6: «ГРИБНОЙ ДОЖДЬ» — лес, болото, дюны, Ванделорд ============
// Вся графика — спрайты/текстуры из Flow (tools/build_l6.py). Кодом только логика, HUD и частицы движка.
const L6 = {};
G.L6 = L6;
L6.GROUND = 300;
L6.ARENA_X = 14000;
L6.W = L6.ARENA_X + 640;
L6.img = {};

const A6 = (sheet, fr, fps = 8, o = {}) => Object.assign({ fr: fr.map(i => [sheet, i]), fps }, o);
const rng = n => Array.from({ length: n }, (_, i) => i);

// ---------- загрузка ----------
L6.load = async function () {
  const names = { bgf: 'bgf.jpg', bgb: 'bgb.jpg', bgd: 'bgd.jpg', sky: 'sky.jpg', city: 'city.png', far: 'far.png', forest: 'forest.png', bog: 'bog.png', dunefar: 'dunefar.png', dunes: 'dunes.png', fg: 'fg.png', gr_forest: 'gr_forest.jpg', gr_bog: 'gr_bog.jpg', gr_sand: 'gr_sand.jpg', arena: 'arena.jpg', heli: 'heli.jpg', sky_forest: 'sky_forest.jpg', sky_bog: 'sky_bog.jpg', sky_dunes: 'sky_dunes.jpg', mg_forest: 'mg_forest.png', mg_bog: 'mg_bog.png', mg_dunes: 'mg_dunes.png' };
  await Promise.all(Object.entries(names).map(async ([k, f]) => { try { L6.img[k] = await G.loadImage('assets/l6/' + f); } catch (e) {} }));
  for (const k of ['valera6', 'vande', 'vova6', 'wiz']) { try { G.portraits[k] = await G.loadImage('assets/spr/p_' + k + '.png'); } catch (e) {} }
  try { L6.img.card = await G.loadImage('assets/l6_card.jpg'); } catch (e) {}
  try { L6.img.treeT = await G.loadImage('assets/spr/tree_tall.png'); L6.img.wallT = await G.loadImage('assets/spr/wall_tall.png'); } catch (e) {}
};

// ---------- анимации ----------
Spr.ANIM.valera6 = {
  stand: A6('v6_tap', [0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7], 5), walk: A6('v6_run', rng(8), 9), run: A6('v6_run', rng(8), 14),
  jump: A6('v6_jump', [2]), fall: A6('v6_jump', [3]), land: A6('v6_jump', [4]), crouch: A6('v6_jump', [4]), hurt: A6('v6_jump', [5]),
  jab: A6('v6_fight', [0]), cross: A6('v6_fight', [1]), upper: A6('v6_fight', [2]), throwA: A6('v6_fight', [3]), throwB: A6('v6_fight', [4]), ko: A6('v6_fight', [5]),
  stomp: A6('v6_tap', [1, 2, 3, 4, 5], 8), hips: A6('v6_jump', [0, 1], 3), scratch: A6('v6_jump', [3]), yawn: A6('v6_jump', [1]), belly: A6('v6_jump', [1]),
  dazed: A6('v6_jump', [3]), scared: A6('v6_jump', [3]), shout: A6('v6_eat', [6]), climb: A6('v6_jump', [3]),
  eat0: A6('v6_eat', [0]), eat1: A6('v6_eat', [1]), eat2: A6('v6_eat', [2]), eat3: A6('v6_eat', [3]), eat4: A6('v6_eat', [4]), eat5: A6('v6_eat', [5]),
  roar: A6('v6_eat', [6]), kneel: A6('v6_eat', [7]), look: A6('v6_eat', [3]), py0: A6('v6_py', [0]), py1: A6('v6_py', [1, 2, 3, 2], 7), py2: A6('v6_py', [4]),
  chew: A6('v6_eat', [1, 2, 1, 2], 6), glow: A6('v6_eat', [4, 5], 8),
  kicked: A6('v6_kick', [0]), rubKnees: A6('v6_kick', [1]), lookBack: A6('v6_kick', [2]), headScratch: A6('v6_kick', [3]),
};
Spr.ANIM.wiz6 = { stand: A6('wiz6', [0]), sneak: A6('wizrun', [0, 1, 2, 3], 10), kick: A6('wiz6', [1]), grab: A6('wiz6', [2]), run: A6('wizrun', [4, 6, 7, 6], 10) };   // бежит без палочки; после подбора — с палочкой   // очкарик — хозяин палочки
Spr.ANIM.valera6w = Object.assign({}, Spr.ANIM.valera6, {   // (кадры пинка — общие)
  stand: A6('v6_tap', [0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7], 5),
  look: A6('v6_eat', [8]), castWind: A6('v6_wand', [2]), castFire: A6('v6_wand', [3]), castRecoil: A6('v6_wand', [4]), castUp: A6('v6_wand', [5]),
  castDown: A6('v6_wand', [6]), castCrouch: A6('v6_wand', [7]), castAir: A6('v6_wand', [8]), flourish: A6('v6_wand', [9]), victory: A6('v6_wand', [10]), laugh: A6('v6_wand', [11]),
});
Spr.ANIM.vova6 = {
  stand: A6('vova6', [0]), run: A6('vovarun', [0, 1, 2, 3], 10), walk: A6('vovarun', [0, 1, 2, 3], 7), point: A6('vova6', [3]), push: A6('vova6', [4]), laugh: A6('vova6', [5]), head: A6('vova6', [6]), shroom: A6('vova6', [7]),
};
Spr.ANIM.vande = {
  idle: A6('b_loco', [0, 1, 2, 3], 4), walk: A6('b_loco', [4, 5, 6, 7, 8, 9, 10, 11], 11),
  crouch: A6('b_evade', [0]), jumpUp: A6('b_evade', [1]), apex: A6('b_evade', [2]), fall: A6('b_evade', [3]), land: A6('b_evade', [4]),
  side: A6('b_evade', [5]), flip: A6('b_evade', [6, 7], 8, { once: true }), dash: A6('b_evade', [8]), slide: A6('b_evade', [9]), duck: A6('b_evade', [10]), vanish: A6('b_evade', [11]),
  raise: A6('b_cast', [0]), draw: A6('b_cast', [1]), slam: A6('b_cast', [2]), glow: A6('b_cast', [3]), kneelCast: A6('b_cast', [4]), burst: A6('b_cast', [5]), orbA: A6('b_cast', [6]),
  punchGround: A6('b_cast', [7]), pointGround: A6('b_cast', [8]), beam: A6('b_cast', [9]), orbUp: A6('b_cast', [10]), recoil: A6('b_cast', [11]),
  pyPull: A6('b_py', [0]), pyWind: A6('b_py', [1]), pyWhip: A6('b_py', [2]), pyFollow: A6('b_py', [3]), beckon: A6('b_py', [8]), smirk: A6('b_py', [9]), hiss: A6('b_py', [10]), stroke: A6('b_py', [11]),
  skyArms: A6('b_taunt', [0]), laugh: A6('b_taunt', [1]), shout: A6('b_taunt', [2]), aura: A6('b_taunt', [3]), rage: A6('b_taunt', [4]), point: A6('b_taunt', [5]), crossed: A6('b_taunt', [6]), cackle: A6('b_taunt', [7]),
  hood: A6('b_taunt', [8]), stare: A6('b_taunt', [9]), clap: A6('b_taunt', [10]), bow: A6('b_taunt', [11]),
  hurt1: A6('b_hurt', [0]), hurt2: A6('b_hurt', [1]), stagger: A6('b_hurt', [2]), dizzy: A6('b_hurt', [3]), knee: A6('b_hurt', [4]), clutch: A6('b_hurt', [5]), fallBack: A6('b_hurt', [6]),
  lieShrooms: A6('b_hurt', [7]), lieSide: A6('b_hurt', [8]), sit: A6('b_hurt', [9]), reach: A6('b_hurt', [10]), ko: A6('b_hurt', [11]),
};
Spr.ANIM.vande.stand = Spr.ANIM.vande.idle;

// ---------- Валера (грязный, с палочкой, после гриба — вдвое больше) ----------
const SPELLS = [
  { id: 'fire', name: 'ОГНЕННЫЙ ШАР', fr: 0, sp: 440, cool: 0.32, dmg: 5 },
  { id: 'ice', name: 'ЛЕДЯНАЯ ГЛЫБА', fr: 1, sp: 560, cool: 0.34, dmg: 5 },
  { id: 'bolt', name: 'МОЛНИЯ', fr: 2, sp: 900, cool: 0.3, dmg: 4 },
  { id: 'slime', name: 'ЗАЙКА-ПРЕВРАТИН', fr: 3, sp: 320, cool: 0.4, dmg: 5 },
  { id: 'skull', name: 'ПОРТАЛ В НИКУДА', fr: 4, sp: 270, cool: 0.45, dmg: 6 },
  { id: 'star', name: 'РАЗРЫВНАЯ ЗВЕЗДА', fr: 5, sp: 400, cool: 0.4, dmg: 6 },
  { id: 'rainbow', name: 'РАДУЖНЫЙ ЛУЧ', fr: 6, sp: 620, cool: 0.5, dmg: 5 },
  { id: 'bats', name: 'ЛЕТУЧИЕ МЫШИ', fr: 7, sp: 280, cool: 0.5, dmg: 5 },
];
L6.SPELLS = SPELLS;

L6.Player = class extends Game.Player {
  constructor(x, y) {
    super(x, y);
    this.animSet = 'valera6'; this.customAttack = true; this.ammo3 = {}; this.portraitKey = 'valera6';
    this.sc = 1; this.scT = 1; this.hasWand = false; this.wmode = 'wand'; this.castT = 0; this.castCool = 0; this.lastSpell = -1; this.aimUp = false; this.spellName = ''; this.spellT = 0;
    this.stuck = null;
  }
  get box() { const s = this.sc; return this.crouch ? { x: this.x - 11 * s, y: this.y - 44 * s, w: 22 * s, h: 43 * s } : { x: this.x - 10 * s, y: this.y - 70 * s, w: 20 * s, h: 69 * s }; }
  drawOpts() { return { scale: this.sc }; }
  grow() { this.scT = 1.5; this.growT = 5; }
  hurt(dmg, fromX, world) { return super.hurt(Math.round(dmg * 1.3 * (this.sc > 1.2 ? 0.75 : 1)), fromX, world); }
  update(dt, world) {
    if (this.growT > 0) { this.growT -= dt; if (this.growT <= 0) { this.scT = 1; G.say(this, 'Эффект гриба прошёл...', 1.2); } }
    this.sc = U.approach(this.sc, this.scT, dt * 0.9);
    this.headH = 86 * this.sc;
    this.animSet = this.hasWand ? 'valera6w' : 'valera6';
    if (this.spellT > 0) this.spellT -= dt;
    if (this.freeT > 0) this.freeT -= dt;
    if (this.stuck) { this.stuckUpdate(dt, world); return; }
    super.update(dt, world);
  }
  // питон сдавил: нужно вырваться (долбить прыжок/удар)
  stuckUpdate(dt, world) {
    const st = this.stuck, I = G.Input;
    this.animT += dt; this.vx = 0; this.crouch = false;
    st.t += dt; st.tick -= dt;
    if (I.pressed('jump') || I.pressed('punch') || I.pressed('throw')) { st.free += 1; FX.burst(this.x, this.y - 40 * this.sc, 3, { colors: ['#ffd84a', '#fff'], speed: 90, life: 0.25, grav: 0 }); Sound.play('select'); }
    if (st.tick <= 0) { st.tick = 0.55; this.hurtDirect(3, world); }
    st.jolt = Math.max(0, (st.jolt || 0) - dt * 6); if (I.pressed('jump') || I.pressed('punch') || I.pressed('throw')) st.jolt = 1;
    this.setAnim(st.t < 0.45 ? 'py0' : 'py1');   // сдавил -> борьба (кадры качаются), каждое нажатие — рывок
    this.onGround = true; this.vy = 0;
    if (st.free >= st.need) { this.stuck = null; this.inv = 0.8; this.freeT = 0.55; this.setAnim('py2'); if (st.onFree) st.onFree(); }
    if (this.hp <= 0) { this.stuck = null; if (st.onFree) st.onFree(true); }
  }
  hurtDirect(n, world) {
    this.hp -= Math.round(n * (G.DMG_MULT || 1.5)); world.stats.dmg += n; Sound.play('hurt'); G.shake(2, 0.1);
    if (this.hp <= 0) { this.hp = 0; this.dead = true; this.deadT = 0; Sound.play('boom'); }
  }
  attackUpdate(dt, world, ctl, I) {
    if (this.castCool > 0) this.castCool -= dt;
    if (this.castT > 0) this.castT -= dt;
    const s = this.sc, big = s > 1.2 ? 2 : 1;
    if (ctl && this.hasWand && I.pressed('switch')) { this.wmode = this.wmode === 'wand' ? 'fist' : 'wand'; Sound.play('select'); FX.popText(this.x, this.y - 92 * s, this.wmode === 'wand' ? 'ПАЛОЧКА' : 'КУЛАКИ', '#ffffff'); }
    const wandOn = this.hasWand && this.wmode === 'wand' && (this.rapid || this.castCool <= 0);   // пока палочка перезаряжается — бьём кулаками
    if (ctl && !wandOn && I.pressed('punch') && (!this.atk || this.atk.t > this.atk.dur * 0.7) && this.castT <= 0) {
      const idx = this.comboT > 0 || this.atk ? (this.combo + 1) % 3 : 0;
      this.combo = idx;
      this.atk = { t: 0, dur: idx === 2 ? 0.34 : 0.24, kind: idx === 2 ? 'upper' : 'punch', side: idx % 2, hit: new Set(), low: this.crouch };
      Sound.play('punch');
      if (this.onGround) this.vx += this.facing * 40;
    }
    if (this.atk) {
      const a = this.atk; a.t += dt;
      const on = a.kind === 'upper' ? a.t > 0.08 && a.t < 0.22 : a.t > 0.05 && a.t < 0.15;
      if (on) {
        const f = this.facing;
        const hb = a.kind === 'upper' ? { x: this.x + (f > 0 ? 2 * s : -30 * s), y: this.y - 72 * s, w: 28 * s, h: 42 * s }
          : a.low ? { x: this.x + (f > 0 ? 6 * s : -36 * s), y: this.y - 34 * s, w: 30 * s, h: 24 * s }
          : { x: this.x + (f > 0 ? 6 * s : -36 * s), y: this.y - 52 * s, w: 30 * s, h: 24 * s };
        world.playerAttack(hb, (a.kind === 'upper' ? 2 : 1) * big, a, this);
      }
      if (a.t >= a.dur) { this.atk = null; this.comboT = 0.35; }
    }
    const want = this.rapid ? (I.pressed('throw') || (wandOn && I.pressed('punch'))) : (I.held('throw') || (wandOn && I.held('punch')));
    if (ctl && this.hasWand && want && this.castCool <= 0 && !this.atk) { this.cast(world, I); this.castMax = this.castCool = this.rapid ? 0.22 : 5; }   // в бою с боссом — выстрел на каждое нажатие, иначе перезарядка 5 с
    else if (ctl && this.hasWand && !this.rapid && I.pressed('throw') && this.castCool > 0) FX.popText(this.x, this.y - 92 * this.sc, 'ПЕРЕЗАРЯДКА ' + Math.ceil(this.castCool) + ' С', '#8a93a0');
  }
  cast(world, I) {
    let k; do { k = U.randi(0, SPELLS.length - 1); } while (k === this.lastSpell);
    this.lastSpell = k;
    const sp = SPELLS[k], s = this.sc;
    this.aimUp = I.held('up') && !this.crouch;
    this.castT = 0.3; this.castCool = sp.cool;
    this.spellName = sp.name; this.spellT = 1.1;
    const x = this.x + this.facing * 26 * s, y = this.y - (this.crouch ? 32 : 56) * s;
    // форма выстрела — случайна: обычный / тройной веер / медленный самонаводящийся / волна
    const r = Math.random(), pat = r < 0.5 ? 'one' : r < 0.72 ? 'tri' : r < 0.88 ? 'seek' : 'wave';
    if (pat === 'tri') { for (const a of [-0.2, 0, 0.2]) world.castSpell(k, x, y, this.facing, this.aimUp, { ang: a, mul: 0.6 }); this.castCool = sp.cool * 1.6; }
    else if (pat === 'seek') { world.castSpell(k, x, y, this.facing, this.aimUp, { seek: true, mul: 1.4, speedK: 0.45, life: 3.2 }); this.castCool = sp.cool * 2; }
    else if (pat === 'wave') { world.castSpell(k, x, y, this.facing, this.aimUp, { wave: true, mul: 0.9, speedK: 0.6, life: 1.9, pierce: 3, sc: 1.4 }); this.castCool = sp.cool * 1.8; }
    else world.castSpell(k, x, y, this.facing, this.aimUp);
    const pre = { tri: 'ТРОЙНОЙ: ', seek: 'САМОНАВОДКА: ', wave: 'ВОЛНА: ', one: '' }[pat];
    this.spellName = pre + sp.name;
    Sound.play('zap');
    FX.popText(this.x, this.y - 92 * s, pre + sp.name, pat === 'one' ? '#c8a0ff' : '#ffd84a');
  }
  choosePose() {
    let a;
    if (this.stuck) return;
    if (this.forcePose) a = this.forcePose;
    else if (this.freeT > 0) a = 'py2';   // вырвался: кольца питона разлетаются
    else if (this.hurtT > 0) a = 'hurt';
    else if (this.castT > 0 && this.hasWand) a = this.crouch ? 'castCrouch' : !this.onGround ? 'castAir' : this.aimUp ? 'castUp' : this.castT > 0.17 ? 'castWind' : 'castFire';
    else if (this.atk) a = this.atk.kind === 'upper' ? 'upper' : this.atk.side ? 'cross' : 'jab';
    else if (this.crouch) a = 'crouch';
    else if (!this.onGround) a = this.vy < 0 ? 'jump' : 'fall';
    else if (this.landT > 0) a = 'land';
    else if (Math.abs(this.vx) > 20) a = 'run';
    else a = 'stand';
    this.setAnim(a);
  }
  draw(c, camX, camY) {
    if (this.controls === false) this.inv = 0;       // в катсценах update не идёт, inv «замерзал» и Валера мигал/пропадал
    const hit = this.inv > 0 && this.hurtT > 0 && !this.dead && !this.stuck;   // после удара — короткая красная вспышка, без мигания и прозрачности
    const sc = Number.isFinite(this.sc) && this.sc > 0.3 ? this.sc : 1;
    if (this.stuck) camX -= Math.sin(this.stuck.t * 40) * (1 + (this.stuck.jolt || 0) * 3);   // дёргается в кольцах
    Spr.drawAnim(c, this.animSet, this.anim, this.animT, this.x - camX, this.y - camY, this.facing, { scale: sc });
    if (hit) Spr.drawAnim(c, this.animSet, this.anim, this.animT, this.x - camX, this.y - camY, this.facing, { scale: sc, flash: '#ff3030', alpha: 0.3 });
  }
};

// индикатор оружия (кулаки / волшебная палочка) под шкалой здоровья
L6.drawWeaponHUD = function (c, pl) {   // в стиле ур. 3: ячейки оружия справа от здоровья, выбранная — в жёлтой рамке
  const R = Art.R, on = pl.hasWand && pl.wmode === 'wand', sel0 = v => v ? 1 + Math.sin(G.t * 6) * 0.06 : 0.9;   // выбранная иконка «дышит»
  const cell = (x, sel, icon, label) => {
    R(c, x - 1, 5, 54, 24, sel ? '#ffd84a' : '#111'); R(c, x, 6, 52, 22, sel ? '#3a3020' : '#1c1f24');
    c.save(); c.beginPath(); c.rect(x, 6, 52, 22); c.clip(); if (!sel) c.globalAlpha = 0.45; icon(x); c.restore();
    G.text(label, x + 50, 19, { size: 7, align: 'right', color: sel ? '#fff' : '#777' });
  };
  cell(174, !on, x => Spr.drawC(c, 'hud6', 0, x + 12, 17, 0, sel0(!on) * 0.8), 'УДАР');
  if (pl.hasWand) {
    cell(230, on, x => Spr.drawC(c, 'hud6', 1, x + 13, 17, 0, sel0(on)), pl.castCool > 0.2 && !pl.rapid ? Math.ceil(pl.castCool) + ' С' : 'ЧАРЫ');
    if (pl.castCool > 0 && !pl.rapid) { R(c, 230, 25, 52, 3, '#101216'); R(c, 230, 25, Math.round(52 * (1 - pl.castCool / (pl.castMax || 5))), 3, '#c8a0ff'); }
    G.text((Game.keyName('switch') || 'Q') + ' — смена', 174, 32, { size: 6, color: '#a8b0b8' });
    if (pl.spellT > 0) G.text(pl.spellName, 288, 13, { size: 7, color: '#c8a0ff' });
  }
};

// ---------- заклинания ----------
L6.Spell = class {
  constructor(k, x, y, dir, up, o = {}) {
    this.k = k; this.sp = SPELLS[k]; this.x = x; this.y = y; this.y0 = y; this.dir = dir; this.t = 0; this.dead = false; this.hitSet = new Set(); this.pierce = 0; this.life = 1.3;
    this.mul = o.mul || 1; this.seek = !!o.seek; this.wave = !!o.wave; this.scl = o.sc || 1;
    const v = this.sp.sp * (o.speedK || 1), a = (up ? -0.55 : 0) + (o.ang || 0);
    this.vx = Math.cos(a) * v * dir; this.vy = Math.sin(a) * v; this.grav = 0;
    if (this.sp.id === 'slime') { this.vy = up ? -330 : -140; this.grav = 700; }
    if (this.sp.id === 'star') this.pierce = 2;
    if (this.sp.id === 'bolt') { this.pierce = 2; this.life = 0.55; }
    if (this.sp.id === 'rainbow') { this.pierce = 99; this.life = 0.5; }
    if (o.life) this.life = o.life; if (o.pierce) this.pierce = Math.max(this.pierce, o.pierce);
    if (this.seek || this.wave) this.grav = 0;
    this.rot = 0; this.phase = Math.random() * 6;
  }
  get box() { const r = this.sp.id === 'rainbow' ? 40 : this.sp.id === 'bolt' ? 26 : 12; return { x: this.x - r, y: this.y - 10, w: r * 2, h: 20 }; }
  update(dt, world) {
    this.t += dt;
    const id = this.sp.id;
    if (id === 'skull') this.y += Math.sin(this.t * 14 + this.phase) * 70 * dt;
    if (this.wave) this.y = this.y0 + Math.sin(this.t * 9 + this.phase) * 26 - this.vy * 0 ;
    if (this.seek || id === 'bats') {
      let best = null, bd = this.seek ? 520 : 260;
      for (const e of world.targets()) { if (this.seek && (e.x - this.x) * this.dir < -40 && this.t < 0.3) continue; const d = Math.abs(e.x - this.x) + Math.abs((e.y - 30) - this.y); if (d < bd) { bd = d; best = e; } }
      if (best) { const dx = best.x - this.x, dy = best.y - 30 - this.y, d = Math.hypot(dx, dy) || 1; const acc = this.seek ? 520 : 900; this.vx += dx / d * acc * dt; this.vy += dy / d * acc * dt; const sp = Math.hypot(this.vx, this.vy), cap = this.seek ? 230 : 330; if (sp > cap) { this.vx *= cap / sp; this.vy *= cap / sp; } }
      this.y += Math.sin(this.t * 18 + this.phase) * 40 * dt;
    }
    this.vy += this.grav * dt;
    this.x += this.vx * dt; if (this.wave) this.y0 += this.vy * dt; else this.y += this.vy * dt;
    this.rot = id === 'rainbow' || id === 'bolt' ? Math.atan2(this.vy, this.vx) : id === 'star' ? this.t * 14 : Math.atan2(this.vy, this.vx);
    if (this.t > this.life || this.x < -40 || this.x > world.w + 40 || this.y > 380 || this.y < this.y0 - 420) this.dead = true;
    if (Math.random() < dt * 40) FX.spawn({ x: this.x, y: this.y, vx: U.rand(-20, 20), vy: U.rand(-20, 20), grav: 0, life: 0.3, size: 2, color: ['#fff', '#c8a0ff', '#ffd84a'][U.randi(0, 2)] });
  }
  draw(c, cx) {
    const sc = (this.sp.id === 'rainbow' ? 1.3 : 1) * this.scl * (this.seek ? 1.25 + Math.sin(this.t * 12) * 0.1 : 1);
    if (this.seek || this.wave) { c.globalAlpha = 0.35; Spr.drawC(c, 'spells6', this.sp.fr, this.x - cx - this.vx * 0.04, this.y - (this.wave ? 0 : this.vy * 0.04), this.rot, sc * 0.8); c.globalAlpha = 1; }
    Spr.drawC(c, 'spells6', this.sp.fr, this.x - cx, this.y, this.rot, sc);
  }
};
