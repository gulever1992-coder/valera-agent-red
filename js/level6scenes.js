'use strict';
// ============ УРОВЕНЬ 6: катсцены и класс уровня ============
WHO.vande = { name: 'ВАНДЕЛОРД', color: '#d8a0ff', voice: 150 };
WHO.vova6 = { name: 'ВОВА', color: '#ff7a7a', voice: 300 };
WHO.vova = WHO.vova || { name: 'ВОВА', color: '#ffb070', voice: 300 };

// сцена в мире уровня: фон + игрок/актёры + диалог
L6.sceneDraw = function (level, run, extra) {
  const st = level.sc = { fade: 0, title: null, flash: 0, extra: null };
  level.drawScene = c => {
    const cx = Math.round(run.world.cam.x);
    run.drawWorld(c, cx);
    for (const e of run.world.enemies) if (e.x - cx > -160 && e.x - cx < W + 160) e.draw(c, cx, 0);
    for (const f of run.fx) f.draw(c, cx);
    run.player.draw(c, cx, 0);
    c.save(); c.translate(-cx, 0); FX.draw(c); c.restore();
    if (extra && extra.draw) extra.draw(c, cx);
    G.drawBubbles(c, cx, 0);
    Scene.drawDialog(c);
    if (st.title) { c.globalAlpha = Math.min(1, st.title.k); Art.R(c, 0, 130, W, 70, 'rgba(0,0,0,0.72)'); G.text(st.title.a, W / 2, 140, { align: 'center', color: '#ffd84a' }); G.text(st.title.b, W / 2, 158, { align: 'center', size: 16, outline: true }); G.text(st.title.c, W / 2, 182, { align: 'center', color: '#c8d0d8' }); c.globalAlpha = 1; }
    if (st.flash > 0) { c.fillStyle = `rgba(255,255,255,${st.flash})`; c.fillRect(0, 0, W, H); }
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => { run.player.animT += dt; if (extra && extra.update) extra.update(dt); FX.update(dt); G.updateBubbles(dt); for (const f of run.fx) f.alive = f.update(dt, run); run.fx = run.fx.filter(f => f.alive); };
  return st;
};

// ---------- 1. старт: «наверно Вову похитили» ----------
L6.sceneStart = function (level, run) {
  const st = L6.sceneDraw(level, run);
  const pl = run.player; pl.controls = false; pl.x = 70; pl.facing = 1; pl.onGround = true;
  return function* () {
    Music.play('city');
    st.fade = 1; pl.setAnim('walk');
    yield* Scene.tween(0.9, k => { st.fade = 1 - k; });
    yield* Scene.moveTo(pl, 190, 55, 'walk');
    pl.forcePose = 'hurt'; pl.setAnim('hurt'); yield 0.4; pl.forcePose = 'scratch'; pl.setAnim('scratch');
    yield* Scene.say('valera', 'Ох... после аварии вся спина болит. А Вовы нигде нет.', pl);
    pl.forcePose = null; pl.setAnim('stand');
    yield* Scene.say('valera', 'Наверно, его похитили! Или он опять потерялся! Нужно найти его срочно!', pl);
    pl.forcePose = 'dazed'; pl.setAnim('dazed'); yield 0.7; pl.forcePose = null;
    yield* Scene.say('valera', 'Следы на земле ведут в лес. Пойду по ним.', pl);
    st.title = { k: 0, a: 'УРОВЕНЬ 6', b: 'ГРИБНОЙ ДОЖДЬ', c: 'Лес за городом. Утро.' };
    yield* Scene.tween(0.4, k => { st.title.k = k; });
    yield 1.6;
    yield* Scene.tween(0.4, k => { st.title.k = 1 - k; });
    st.title = null;
  };
};

// ---------- 2. надкусанный мухомор: Валера вырастает вдвое ----------
L6.sceneEat = function (level, run) {
  const st = L6.sceneDraw(level, run);
  const pl = run.player; pl.controls = false; pl.vx = 0;
  return function* () {
    Music.play('city');
    yield* Scene.moveTo(pl, L6.EAT_X - 36, 70, 'walk');
    pl.facing = 1; pl.forcePose = 'look'; pl.setAnim('look'); yield 0.6;
    yield* Scene.say('valera', 'Надкусанный мухомор! Здесь точно был Вова!', pl);
    yield* Scene.say('valera', 'Очевидно, еды тут нет. Нужно выживать! Съем и я этот гриб!', pl);
    run.eatProp = null;
    pl.forcePose = 'eat0'; pl.setAnim('eat0'); yield 0.9;
    pl.forcePose = 'eat1'; pl.setAnim('eat1'); Sound.play('swig'); yield 0.5;
    pl.forcePose = 'chew'; pl.setAnim('chew'); yield 1.1;
    pl.forcePose = 'eat3'; pl.setAnim('eat3'); yield 0.7;
    G.say(pl, 'Что-то мне нехорошо...', 1.3);
    pl.forcePose = 'eat4'; pl.setAnim('eat4'); Sound.play('boom', 0.5);
    yield* Scene.tween(0.9, k => { pl.sc = U.lerp(1, 1.25, k); G.shake(2, 0.1); });
    pl.forcePose = 'glow'; pl.setAnim('glow');
    yield* Scene.tween(1.1, k => { pl.sc = U.lerp(1.25, 1.5, U.easeOut(k)); if (Math.random() < 0.5) FX.burst(pl.x, pl.y - 70 * pl.sc, 2, { colors: ['#9fd4ff', '#ffffff', '#ff7a7a'], speed: 140, life: 0.5, grav: 0 }); st.flash = Math.sin(k * 9) * 0.25 > 0 ? Math.sin(k * 9) * 0.25 : 0; });
    st.flash = 0; G.shake(8, 0.6); G.flash(0.25); Sound.play('boom');
    pl.sc = 1.5; pl.grow();
    pl.forcePose = 'roar'; pl.setAnim('roar'); yield 0.8;
    yield* Scene.say('valera', 'Я стал огромным! Но, похоже, ненадолго. Вова, я иду!', pl);
    pl.forcePose = null; pl.setAnim('stand');
    level.grown = true;
    run.hints.push({ x: pl.x - 10, w: 700, text: 'Теперь ты вдвое больше и сильнее. Но лес полон врагов!', shown: 0 });
  };
};

// ---------- 3. очкарик без сознания и волшебная палочка ----------
L6.sceneWand = function (level, run) {
  const prop = run.wizProp;
  const wiz = { x: prop.x, y: L6.GROUND, headH: 36, voice: 350 };
  const st = L6.sceneDraw(level, run);
  const pl = run.player; pl.controls = false; pl.vx = 0;
  return function* () {
    yield* Scene.moveTo(pl, L6.WIZ_X - 60 * pl.sc, 70, 'walk');
    pl.facing = 1; pl.forcePose = 'look'; pl.setAnim('look'); yield 0.5;
    yield* Scene.say('valera', 'Это ещё кто? Очкарик в чёрной мантии лежит без сознания.', pl);
    yield* Scene.say('valera', 'А в руке у него... волшебная палочка!', pl);
    pl.forcePose = 'kneel'; pl.setAnim('kneel'); yield 0.9;
    prop.fr = 1; Sound.play('pickup'); FX.burst(prop.x, L6.GROUND - 20, 14, { colors: ['#9fd4ff', '#ffffff', '#c8a0ff'], speed: 130, life: 0.6, grav: 0 });
    level.wand = true; pl.hasWand = true;
    pl.forcePose = 'look'; pl.setAnim('look'); yield 0.7;
    yield* Scene.say('valera', 'Заберу. Ему она всё равно ни к чему.', pl);
    pl.forcePose = 'flourish'; pl.setAnim('flourish'); Sound.play('zap'); yield 0.9;
    yield* Scene.say('valera', 'Абра-кадабра! Посмотрим, что будет.', pl);
    pl.forcePose = 'victory'; pl.setAnim('victory'); yield 0.8;
    prop.fr = 5;
    G.say(wiz, 'Мои... очки?..', 2.0);
    yield 1.2;
    pl.forcePose = null; pl.setAnim('stand');
    run.hints.push({ x: pl.x - 10, w: 900, text: 'Держи {punch} или {throw} — колдовать палочкой. {switch} — сменить на кулаки и обратно.', shown: 0 });
  };
};

// ---------- 4. арена: Ванделорд на берегу ----------
L6.sceneBossIntro = function (level) {
  const ar = level.arena, b = ar.boss, pl = ar.player;
  const st = level.sc = { fade: 0, title: 0 };
  level.drawScene = c => {
    ar.draw(c);
    Scene.drawDialog(c);
    if (st.title > 0) { c.globalAlpha = Math.min(1, st.title); Art.R(c, 0, 130, W, 70, 'rgba(0,0,0,0.75)'); G.text('БОСС', W / 2, 140, { align: 'center', color: '#ff6a4a' }); G.text('ВАНДЕЛОРД', W / 2, 158, { align: 'center', size: 16, outline: true, color: '#d8a0ff' }); G.text('Грибной некромант', W / 2, 182, { align: 'center', color: '#c8d0d8' }); c.globalAlpha = 1; }
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => { b.animT += dt; b.t += dt; pl.animT += dt; FX.update(dt); G.updateBubbles(dt); };
  return function* () {
    Music.play('boss');
    b.state = 'wait'; b.play('stroke'); b.facing = -1;
    pl.x = L6.ARENA_X + 120; pl.facing = 1; pl.setAnim('stand'); pl.forcePose = null;
    st.fade = 1; yield* Scene.tween(0.8, k => { st.fade = 1 - k; });
    yield 0.5;
    yield* Scene.say('valera', 'Не нужно было догадываться: раз есть грибы, значит есть Ванделорд.', pl);
    b.play('smirk');
    yield* Scene.say('vande', 'Валера, ты мешаешь нашему раю в шалаше с Вовой. После того как он попробовал гриб, его мозг навсегда изменился.', b);
    yield* Scene.say('valera', 'Я заберу от тебя Вову.', pl);
    b.play('skyArms'); Sound.play('boom', 0.7); G.shake(3, 0.4);
    yield* Scene.say('vande', 'ДНК графа Вальдемара никогда не станет прежним! Теперь он гриб!', b);
    b.play('laugh'); yield 0.8;
    b.play('crossed');
    yield* Scene.tween(0.4, k => { st.title = k; });
    yield 1.3;
    yield* Scene.tween(0.4, k => { st.title = 1 - k; });
    st.title = 0; b.play('idle');
  };
};

// ---------- 5. финал: Вова-мухомор и вертолёт ----------
L6.sceneFinale = function (level) {
  const ar = level.arena, b = ar.boss, pl = ar.player;
  const st = level.sc = { fade: 0, heli: 0, poof: 0 };
  const vova = new G.Actor('vova6', L6.ARENA_X - 40, L6.GROUND, 1); vova.setAnim('run'); vova.voice = 300; vova.visible = false; vova.scale = 1;
  let poofT = -1;
  level.drawScene = c => {
    if (st.heli > 0) {
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      c.globalAlpha = Math.min(1, st.heli);
      if (L6.img.heli) c.drawImage(L6.img.heli, 0, 0, W, H);
      c.globalAlpha = 1;
      Scene.drawDialog(c);
    } else {
      ar.draw(c);
      const cx = L6.ARENA_X;
      vova.draw(c, cx, 0);
      if (poofT >= 0 && poofT < 0.6) { const k = poofT / 0.6; c.globalAlpha = 1 - k; Spr.drawC(c, 'vfx6', 11, vova.x - cx, vova.y - 50, 0, 0.8 + k); Spr.drawC(c, 'gibs6', 6, vova.x - cx, vova.y - 50, 0, 1.2 + k * 1.6); c.globalAlpha = 1; }
      G.drawBubbles(c, cx, 0);
      Scene.drawDialog(c);
    }
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => { b.animT += dt; pl.animT += dt; vova.update(dt); if (poofT >= 0) poofT += dt; FX.update(dt); G.updateBubbles(dt); };
  return function* () {
    Music.play('city');
    b.state = 'down'; b.play('ko'); pl.forcePose = null; pl.setAnim('stand'); pl.hasWand = true;
    yield 1.0;
    yield* Scene.say('valera', 'Готов... Теперь Вова свободен!', pl);
    vova.visible = true; vova.x = L6.ARENA_X - 30; vova.facing = 1;
    yield* Scene.moveTo(vova, pl.x - 90, 110, 'run');
    vova.setAnim('laugh');
    yield 0.6;
    yield* Scene.say('valera', 'Вова! Ты хотел куда-то меня привезти?', pl);
    vova.setAnim('point');
    yield* Scene.say('vova6', 'Отстань от меня! Иди в свой заводоуправление!', vova);
    poofT = 0; Sound.play('boom', 0.9); G.shake(5, 0.4); G.flash(0.15);
    yield 0.35;
    vova.setAnim('shroom'); vova.scale = 1.5;
    yield 0.9;
    pl.forcePose = 'dazed'; pl.setAnim('dazed');
    yield 0.8;
    yield* Scene.say('valera', 'Ладно... Пойду дальше один.', pl);
    yield* Scene.tween(0.7, k => { st.fade = k; });
    yield 0.3;
    st.heli = 1; st.fade = 1;
    yield* Scene.tween(0.8, k => { st.fade = 1 - k; });
    yield* Scene.say('commando', 'Ха-ха! Он остался один!', null);
    yield* Scene.say('commando2', 'Всё идёт по нашему плану!', null);
    yield 0.6;
    yield* Scene.tween(0.8, k => { st.fade = k; });
  };
};

// ---------- уровень ----------
L6.Level = class {
  constructor(carry) {
    this.id = 6;
    this.stats = { time: 0, dmg: 0, kills: 0, deflect: 0, secrets: 0, food: 0, deaths: 0 };
    this.score = 0; this.mode = null; this.grown = false; this.wand = false; this.startX = 90;
  }
  start(opts = {}) {
    G.portraits.valera = G.portraits.valera6 || G.portraits.valera;
    if (opts.boss || opts.wand || opts.grown || opts.dunes) { this.grown = true; this.wand = !!(opts.boss || opts.wand || opts.dunes); this.startX = opts.boss ? L6.ARENA_X - 80 : opts.dunes ? 9450 : opts.wand ? L6.WIZ_X + 120 : 1800; this.startRun(); return; }
    this.startRun(true);
  }
  playScene(gen, next) { this.mode = 'scene'; Scene.run(gen, next); }
  startRun(intro) {
    FX.list = []; G.bubbles = [];
    this.run = new L6.Run(this);
    if (intro) { this.mode = 'scene'; this.playScene(L6.sceneStart(this, this.run), () => { this.mode = 'run'; this.run.player.controls = true; this.run.player.forcePose = null; Music.play('city'); }); }
    else { this.mode = 'run'; Music.play('city'); }
    if (!intro) this.run.player.controls = true;
  }
  sceneEat(run) { this.mode = 'scene'; run.player.controls = false; this.playScene(L6.sceneEat(this, run), () => { this.mode = 'run'; run.player.controls = true; run.player.forcePose = null; this.hp = run.player.hp; }); }
  sceneWand(run) { this.mode = 'scene'; run.player.controls = false; this.playScene(L6.sceneWand(this, run), () => { this.mode = 'run'; run.player.controls = true; run.player.forcePose = null; }); }
  reachArena(run) {
    this.carry = { hp: run.player.hp };
    this.arena = new L6.Arena(this, run);
    this.mode = 'boss';
    this.playScene(L6.sceneBossIntro(this), () => { this.mode = 'boss'; this.arena.player.forcePose = null; this.arena.startFight(); });
  }
  restartBoss() {
    const run = this.run;
    const pl = new L6.Player(L6.ARENA_X + 140, L6.GROUND); pl.hasWand = true;
    run.player = pl;
    this.arena = new L6.Arena(this, run);
    this.arena.boss.hp = this.arena.boss.maxHp;
    this.arena.startFight();
    Music.play('boss');
    G.say(pl, 'Второй раунд, Ванделорд!', 1.5);
  }
  bossDefeated() { this.playScene(L6.sceneFinale(this), () => { this.mode = 'done'; G.onLevelComplete(this); }); }
  update(dt) {
    if (this.mode === 'scene') { Scene.tick(dt); if (this.updateScene) this.updateScene(dt); }
    else if (this.mode === 'run') { this.run.update(dt); FX.update(dt); G.updateBubbles(dt); }
    else if (this.mode === 'boss') { this.arena.update(dt); FX.update(dt); G.updateBubbles(dt); }
  }
  draw(c) {
    if (this.mode === 'scene' && this.drawScene) { this.drawScene(c); if (Scene.t < 3) G.text('Esc — пропустить', W - 8, H - 12, { align: 'right', size: 8, color: 'rgba(255,255,255,0.5)' }); }
    else if (this.mode === 'run') this.run.draw(c);
    else if (this.mode === 'boss') this.arena.draw(c);
  }
  get canPause() { return this.mode === 'run' || this.mode === 'boss'; }
};
