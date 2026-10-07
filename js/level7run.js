'use strict';
// ============ УРОВЕНЬ 7: прохождение — обнаружение, поимка, чекпоинты, переходы (улица / канализация / коридоры) ============
L7.Run = class {
  constructor(level, map, x) {
    this.level = level; L7.run = this;
    this.flags = {}; this.ko = new Set(); this.t = 0; this.fade = 1; this.trans = null; this.mg = null; this.caught = null; this.susp = 0;
    this.code = String(U.randi(1000, 9999));
    this.rain = new L7.Rain(150);
    this.cp = { map, x }; this.saved = { flags: {}, ko: new Set(), bones: 0, nuts: 5 };
    this.load(map, x);
  }
  get outside() { return this.map === 'out'; }
  // ---------- построение карты ----------
  load(map, x, keepPlayer) {
    this.map = map;
    const D = this.D = map === 'out' ? L7.buildOut() : map === 'sewer' ? L7.buildSewer() : L7.buildIn();
    const wd = this.world = new Game.World(D.w, 1200);
    wd.run = this; wd.stats = this.level.stats; wd.score = this.level.score;
    wd.addScore = n => { wd.score += n; this.level.score = wd.score; };
    wd.playerAttack = (hb, dmg, atk, pl) => this.playerAttack(hb, dmg, atk, pl);
    wd.spawnPlayerProj = () => {};
    for (const p of D.plats) wd.addPlat(Object.assign({ look: 'none' }, p));
    wd.ladders = D.ladders;
    this.guards = D.guards.map(o => new L7.Guard(o));
    for (const g of this.guards) if (this.ko.has(g.id)) g.state = 'ko';
    this.dogs = D.dogs.map(o => new L7.Dog(o));
    this.cams = D.cams.map(o => new L7.Cam(o));
    this.drones = D.drones.map(o => new L7.Drone(o));
    this.lasers = D.lasers.map(o => new L7.Laser(o));
    this.beavers = this.flags['sewerDone'] ? [] : D.beavers.map(o => new L7.Beaver(o));
    this.hides = D.hides; this.covers = D.covers; this.cars = D.cars; this.ints = D.ints; this.props = D.props;
    this.pickups = D.pickups.filter(p => !this.flags['pk:' + map + p.x]).map(p => Object.assign({ t: Math.random() * 6, y: L7.GY }, p));
    this.cps = D.cps.map(c => Object.assign({ active: this.cp.map === map && Math.abs(this.cp.x - c.x) < 4 }, c));
    this.hints = D.hints.map(h => Object.assign({ shown: 0 }, h));
    this.items = [];
    const pl = keepPlayer || new L7.Player(x, L7.GY);
    pl.x = x; pl.y = L7.GY; pl.vx = pl.vy = 0; pl.hidden = null; pl.climb = null; pl.dead = false; pl.controls = true; pl.forcePose = null;
    this.player = pl;
    wd.cam.x = U.clamp(x - W / 2, 0, D.w - W); wd.cam.y = 0;
    this.hint = null; this.hintA = 0;
    Music.play('stealth');
  }
  // ---------- запросы мира ----------
  coverAt(x, y) { return this.covers.some(c => Math.abs(c.y - y) < 20 && x > c.x1 && x < c.x2); }
  coverBetween(ex, px, y) {   // укрытие между врагом и присевшим Валерой (или Валера в нём)
    const a = Math.min(ex, px), b = Math.max(ex, px);
    return this.covers.some(c => Math.abs(c.y - y) < 20 && ((px > c.x1 && px < c.x2) || (c.x2 > a + 6 && c.x1 < b - 6)));
  }
  wallBetween(x0, x1, y) {
    const a = Math.min(x0, x1), b = Math.max(x0, x1);
    if (this.map === 'out' && Math.abs(y - L7.GY) < 40 && L7.FENCE_X > a && L7.FENCE_X < b) return true;
    return false;
  }
  carAt(x, y) { return this.cars.find(c => x > c.x1 + 8 && x < c.x2 - 8 && y > c.top && y < L7.GY); }
  carAlarm(car) {
    car.alarm = 4; Sound.play('honk'); G.shake(1, 0.2);
    FX.popText(car.x, car.top - 10, 'БИ-БИП! БИ-БИП!', '#ffd84a');
    this.noise(car.x, L7.GY, 420, 'alarm');
  }
  dogNear(x, y, r) { return this.dogs.some(d => Math.abs(d.x - x) < r && Math.abs(d.y - y) < 40); }
  noise(x, y, r, kind) {
    for (const e of [...this.guards, ...this.dogs]) if (Math.abs(e.y - y) < 60 && Math.abs(e.x - x) < r && !this.wallBetween(e.x, x, y)) e.hear(x, r, kind);
  }
  throwItem(pl, kind) { this.items.push(new L7.Item(pl.x + pl.facing * 14, pl.y - 50, pl.facing, kind)); }
  tryTakedown(pl) {
    for (const g of this.guards) {
      if (!g.alive || g.state === 'stagger' || Math.abs(g.y - pl.y) > 30) continue;
      const dx = pl.x - g.x;
      if (Math.abs(dx) < 58 && (Math.sign(dx) === -g.facing || g.state === 'sleep') && g.see < 0.6) {
        g.ko(); this.ko.add(g.id); this.level.stats.kills++; this.world.addScore(300);
        Sound.play('hit'); G.hitStop = 0.06; G.shake(3, 0.15); FX.burst(g.x, g.y - 70, 8, { colors: ['#fff', '#ffd84a'], speed: 120, life: 0.3, grav: 0 });
        FX.popText(g.x, g.y - 110, 'ВЫРУБЛЕН! +300', '#8cf08c');
        pl.facing = Math.sign(g.x - pl.x) || pl.facing;
        if (Math.random() < 0.5) G.say(pl, U.choice(['Спокойной ночи.', 'Тихо-тихо...', 'Отдохни, служивый.', 'Стропальщики не сдаются.']), 1.2);
        return true;
      }
    }
    return false;
  }
  playerAttack(hb, dmg, atk, pl) {
    for (const b of this.beavers) {
      if (atk.hit.has(b) || b.state === 'ko') continue;
      if (U.overlap(hb, b.box)) { atk.hit.add(b); if (b.hit(dmg, pl.facing)) { this.world.addScore(150); FX.popText(b.x, b.y - 50, '+150'); this.level.stats.kills++; } Sound.play('hit'); G.hitStop = 0.04; }
    }
    for (const g of this.guards) if (g.alive && g.state !== 'stagger' && g.state !== 'sleep' && Math.sign(pl.x - g.x) === g.facing && U.overlap(hb, { x: g.x - 12, y: g.y - 80, w: 24, h: 80 })) this.catchBy(g);
  }
  // ---------- взаимодействие ----------
  nearInt(pl) {
    let best = null;
    for (const it of this.ints) if ((!it.cond || it.cond(this)) && Math.abs(it.y - pl.y) < 24 && Math.abs(it.x - pl.x) < it.r && (!best || Math.abs(it.x - pl.x) < Math.abs(best.x - pl.x))) best = it;
    for (const h of this.hides) if (Math.abs(h.y - pl.y) < 24 && Math.abs(h.x - pl.x) < h.w / 2 + 6 && (!best || Math.abs(h.x - pl.x) < Math.abs(best.x - pl.x))) best = { hide: h, x: h.x, label: h.label };
    return best;
  }
  hideIn(h) {
    if (h.mg) { if (this.flags.camsB > 0) { G.say(this.player, 'Камеры и так спят. Бегом!', 1.2); return; } this.startMG(h.mg); return; }
    const pl = this.player;
    pl.hidden = { kind: h.kind, x: h.x, t: 0, h, blown: this.susp > 0.55 };   // спрятался на глазах — не поможет
    pl.x = h.x; pl.crouch = false; pl.atk = null; Sound.play('door');
    h.anim = 0.5;   // дверца открылась-закрылась
  }
  unhide() { const pl = this.player; if (pl.hidden.h) pl.hidden.h.anim = 0.4; pl.hidden = null; pl.inv = 0; Sound.play('door'); }
  crawlHole() { this.transition(() => { this.player.x = L7.FENCE_X + 50; this.player.facing = 1; G.say(this.player, 'Пролез! Матиз Граблионка... Где же он сам?', 2); }, 'Ползём...'); }
  goSewer() { this.transition(() => { this.saveCP('sewer', 90); this.load('sewer', 90, this.player); G.say(this.player, 'Фу-у... Ну и вонь. Кто тут шуршит?', 1.8); }, 'Вниз по скобам...'); }
  leaveSewer() { this.flags.sewerDone = 1; this.transition(() => { this.saveCP('out', 1700); this.load('out', 1700, this.player); G.say(this.player, 'Вылез у них за спинами. Тише...', 1.8); }, 'Вверх по скобам...'); }
  goVent(x) { Sound.play('clank'); this.transition(() => { this.player.x = x; this.player.vy = 0; G.say(this.player, 'Апчхи! Пыльно тут...', 1.4); }, 'Ползём по вентиляции...'); }
  reachGate() { if (this.done) return; this.done = true; this.player.controls = false; this.player.vx = 0; this.level.reachGate(this); }
  readNote() { this.flags.note = 1; Sound.play('pickup'); this.level.playScene(L7.sceneNote(this.level, this), () => this.level.backToRun()); }
  lockedHall() { G.say(this.player, 'Кодовый замок. Четыре цифры... Код наверняка где-то записан. В кабинетах поискать?', 2.4); Sound.play('warn'); }
  startMG(kind) { this.mg = new L7.MG(kind, this); this.player.controls = false; this.player.vx = 0; Sound.play('select'); }
  endMG(ok) {
    const k = this.mg.kind; this.mg = null; this.player.controls = true;
    if (!ok) return;
    if (k === 'wires') { this.flags.camsB = 15; Sound.play('zap'); this.world.addScore(500); G.say(this.player, 'Камеры погасли! 15 секунд — бегом!', 2); }
    if (k === 'lasers') { this.flags.lasC = 1; Sound.play('confirm'); this.world.addScore(500); G.say(this.player, 'Лучи на выходе выключены. Ну, почти все...', 2.2); }
    if (k === 'code') { this.done = true; this.player.controls = false; Sound.play('lever'); this.level.reachHall(this); }
  }
  // ---------- чекпоинты, поимка, рестарт ----------
  saveCP(map, x) { this.cp = { map, x }; this.saved = { flags: Object.assign({}, this.flags, { camsB: 0 }), ko: new Set(this.ko), bones: this.player ? this.player.bones : 0, nuts: this.player ? this.player.nuts : 5 }; }
  activateCP(cp) {
    for (const c of this.cps) c.active = false;
    cp.active = true; this.saveCP(this.map, cp.x);
    Sound.play('checkpoint'); this.player.heal(25); FX.popText(cp.x, cp.y - 90, 'КОНТРОЛЬНАЯ ТОЧКА', '#8cf08c');
  }
  catchBy(by) {
    if (this.caught || this.done) return;
    const pl = this.player;
    this.caught = { t: 0, by, phase: 'spot' };
    pl.controls = false; pl.vx = 0; pl.atk = null; pl.climb = null; if (pl.hidden) { if (pl.hidden.h) pl.hidden.h.anim = 0.4; pl.hidden = null; }
    Sound.play('warn'); Music.play('alarm'); G.flash(0.15, '#ff2010');
    this.level.stats.caught = (this.level.stats.caught || 0) + 1;
    // вязать идёт ближайший спецназовец, иначе — новый прибегает из-за края экрана
    let g = by instanceof L7.Guard ? by : null;
    if (!g) { for (const q of this.guards) if (q.alive && q.state !== 'stagger' && Math.abs(q.x - pl.x) < 420 && !this.wallBetween(q.x, pl.x, pl.y) && (!g || Math.abs(q.x - pl.x) < Math.abs(g.x - pl.x))) g = q; }
    if (!g) { const side = pl.x - this.world.cam.x > W / 2 ? -1 : 1; g = new L7.Guard({ x: side > 0 ? this.world.cam.x - 40 : this.world.cam.x + W + 40, kind: 'post', facing: side }); this.guards.push(g); }
    this.caught.g = g; g.state = 'catch'; g.facing = Math.sign(pl.x - g.x) || 1;
    if (by instanceof L7.Dog) { by.state = 'catch'; Sound.play('bark'); }
    G.say(g, U.choice(['Стоять! Это он, по фотороботу!', 'Попался, Мистер Рэд!', 'Лежать! Руки за спину!']), 1.6);
  }
  updateCaught(dt) {
    const c = this.caught, pl = this.player, g = c.g;
    c.t += dt; g.animT += dt;
    if (c.by instanceof L7.Dog) c.by.animT += dt;
    if (c.phase === 'spot') { pl.forcePose = 'handsUp'; pl.setAnim('handsUp'); pl.animT += dt; pl.y = Math.min(L7.GY, pl.y + 200 * dt); if (c.t > 0.7) c.phase = 'run'; }
    else if (c.phase === 'run') {
      g.anim = 'run'; g.facing = Math.sign(pl.x - g.x) || g.facing;
      const tx = pl.x - g.facing * 30; g.x = U.approach(g.x, tx, 200 * dt); pl.y = L7.GY;
      if (Math.abs(g.x - tx) < 2) { c.phase = 'tie'; c.t = 0; Sound.play('rope'); }
    } else if (c.phase === 'tie') {
      g.anim = 'tie'; pl.forcePose = 'tied'; pl.setAnim('tied'); pl.facing = g.facing; pl.animT += dt;
      if (c.t > 1.3) { c.phase = 'drag'; c.t = 0; g.facing = -g.facing; G.say(pl, U.choice(['Пустите! Я свой, стропальщик!', 'Я просто мимо шёл!', 'Ай! Наручники жмут!']), 1.6); }
    } else if (c.phase === 'drag') {
      g.anim = 'drag'; g.x += g.facing * 60 * dt; pl.x = g.x - g.facing * 34; pl.facing = g.facing;
      if (c.t > 1.2) this.fade = Math.min(1, this.fade + dt * 2);
      if (c.t > 1.8 && this.fade >= 1) this.respawn();
    }
  }
  respawn() {
    const cp = this.cp, sv = this.saved;
    this.flags = Object.assign({}, sv.flags); this.ko = new Set(sv.ko); this.caught = null; this.susp = 0; this.mg = null;
    this.level.stats.deaths++;
    this.load(cp.map, cp.x);
    this.player.bones = Math.max(sv.bones, 1); this.player.nuts = Math.max(sv.nuts, 3);
    G.say(this.player, U.choice(['Еле вырвался! Ещё разок, потише.', 'Наручники у них китайские. Пробую снова!', 'Сбежал из автозака. Теперь аккуратнее.']), 2);
  }
  transition(mid, text) { if (this.trans) return; this.trans = { t: 0, mid, text, did: false }; this.player.controls = false; this.player.vx = 0; }
  // ---------- обновление ----------
  update(dt) {
    const wd = this.world, pl = this.player, I = G.Input;
    this.t += dt; wd.t += dt;
    if (this.outside) this.rain.update(dt);
    if (!this.done) this.level.stats.time += dt;
    for (const h of this.hides) if (h.anim > 0) h.anim -= dt;
    for (const c of this.cars) if (c.alarm > 0) { c.alarm -= dt; if ((c.alarm * 4 | 0) !== ((c.alarm + dt) * 4 | 0)) Sound.play('honk'); }
    if (this.trans) {
      const tr = this.trans; tr.t += dt;
      if (tr.t < 0.4) this.fade = tr.t / 0.4;
      else if (!tr.did) { tr.did = true; tr.mid(); this.fade = 1; wd.cam.x = U.clamp(this.player.x - W / 2, 0, this.D.w - W); }
      else if (tr.t > (tr.text ? 1.3 : 0.6)) { this.fade = Math.max(0, this.fade - dt * 3); if (this.fade <= 0) { this.trans = null; this.player.controls = true; } }
      return;
    }
    if (this.fade > 0 && !this.caught) this.fade = Math.max(0, this.fade - dt * 2);
    if (this.mg) { const r = this.mg.update(dt, I); if (r) this.endMG(r === 'ok'); return; }
    if (this.caught) { this.updateCaught(dt); this.camFollow(dt); return; }
    if (this.flags.camsB > 0) { this.flags.camsB -= dt; if (this.flags.camsB <= 0) { this.flags.camsB = 0; Sound.play('zap'); G.say(pl, 'Камеры снова включились!', 1.2); } }
    wd.updatePlats(dt);
    const near = !pl.hidden && pl.onGround && !pl.climb && !this.done ? this.nearInt(pl) : null;
    this.near = near;
    const onLadder = wd.ladders.some(l => Math.abs(pl.x - (l.x + l.w / 2)) < 14 && pl.y >= l.y - 2 && pl.y - 30 <= l.y + l.h);
    if (near && pl.controls && I.pressed('up') && !onLadder) {
      if (near.hide) this.hideIn(near.hide); else near.act(this);
      I.hit.up = false;
    }
    pl.update(dt, wd);
    // подбор
    for (const p of this.pickups) { p.t += dt; if (!p.dead && Math.abs(p.x - pl.x) < 18 && Math.abs(p.y - pl.y) < 30) { p.dead = true; this.flags['pk:' + this.map + p.x] = 1;
      if (p.kind === 'bone') { pl.bones += p.n; FX.popText(p.x, p.y - 30, 'КОСТИ +' + p.n, '#f4f0e4'); } else { pl.nuts += p.n; FX.popText(p.x, p.y - 30, 'ГАЙКИ +' + p.n, '#c8d0d8'); } Sound.play('pickup'); } }
    this.pickups = this.pickups.filter(p => !p.dead);
    for (const b of this.items) b.update(dt, this);
    this.items = this.items.filter(b => !b.gone || (b.taken && !b.gone));
    for (const g of this.guards) g.update(dt, this);
    for (const d of this.dogs) d.update(dt, this, pl);
    for (const b of this.beavers) b.update(dt, this, pl);
    this.beavers = this.beavers.filter(b => !b.dead);
    for (const c of this.cams) c.update(dt);
    for (const d of this.drones) d.update(dt);
    for (const l of this.lasers) { l.update(dt); if (l.hits(this, pl)) { Sound.play('zap'); FX.burst(pl.x, pl.y - 40, 10, { colors: ['#ff3030', '#fff'], speed: 120, life: 0.3, grav: 0 }); this.catchBy(l); return; } }
    // заметность
    let rate = 0, who = null;
    for (const e of [...this.guards, ...this.dogs, ...this.cams, ...this.drones]) {
      const r = e.sees ? e.sees(this, pl) : 0; e.see = r > 0 ? Math.min(1, this.susp) : Math.max(0, (e.see || 0) - dt * 2);
      if (r > rate) { rate = r; who = e; }
    }
    if (pl.hidden && pl.hidden.blown && this.susp < 0.3) pl.hidden.blown = false;
    if (rate > 0) { this.susp += rate * dt; if (who instanceof L7.Dog && this.susp > 0.4 && Math.random() < dt * 3) Sound.play('bark'); }
    else this.susp = Math.max(0, this.susp - dt * 0.45);
    if (this.susp >= 1) { this.susp = 1; this.catchBy(who); return; }
    for (const cp of this.cps) if (!cp.active && Math.abs(pl.x - cp.x) < 26 && Math.abs(pl.y - cp.y) < 20 && !pl.dead) this.activateCP(cp);
    let hint = null;
    for (const h of this.hints) if (!h.done && pl.x > h.x && pl.x < h.x + h.w) { hint = h; h.shown += dt; if (h.shown > 8) h.done = true; }
    if (hint) { this.hint = hint; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
    if (pl.dead && pl.deadT > 1.4) { this.fade = Math.min(1, this.fade + dt * 2); if (this.fade >= 1) this.respawn(); }
    this.camFollow(dt);
  }
  camFollow(dt) {
    const wd = this.world, pl = this.player;
    const tx = U.clamp(pl.x - W * 0.45 + pl.facing * 24, 0, this.D.w - W);
    wd.cam.x += (tx - wd.cam.x) * Math.min(1, dt * 5); wd.cam.y = 0;
  }
  // ---------- рисование ----------
  // фон 640x360 (земля на 300): верх — параллакс 0.5 зеркальными тайлами, полоса земли — 1:1; зоны режутся по x мира
  drawBG(c, cx) {
    const zones = L7.ZONES[this.map];
    c.fillStyle = '#10141c'; c.fillRect(0, 0, W, H);
    zones.forEach(([x0, key], i) => {
      const x1 = i + 1 < zones.length ? zones[i + 1][0] : 1e9;
      const sx0 = Math.max(0, x0 - cx), sx1 = Math.min(W, x1 - cx); if (sx1 <= sx0) return;
      const img = L7.img[key]; if (!img) return;
      c.save(); c.beginPath(); c.rect(sx0, 0, sx1 - sx0, H); c.clip();
      const tile = (px, y0, h) => {   // px — смещение камеры для слоя
        const w = W; let x = -(((px % (w * 2)) + w * 2) % (w * 2));
        for (; x < W; x += w) {
          const odd = Math.floor((px + x) / w + 0.001) % 2 !== 0;
          const sy = y0 * 2, sh = h * 2;
          if (odd) { c.save(); c.translate(Math.round(x) + w, 0); c.scale(-1, 1); c.drawImage(img, 0, sy, 1280, sh, 0, y0, w, h); c.restore(); }
          else c.drawImage(img, 0, sy, 1280, sh, Math.round(x), y0, w, h);
        }
      };
      if (this.outside) { tile((cx - x0) * 0.5, 0, 292); tile(cx - x0, 292, 68); } else tile(cx - x0, 0, H);   // внутри и в канализации стена и пол — одна плоскость
      c.restore();
    });
  }
  drawProps(c, cx, cy, pass) {
    for (const p of this.props) {
      const isFront = !!p.front, isBehind = !!p.behind;
      if ((pass === 'front') !== isFront || (pass === 'behind') !== isBehind) continue;
      const x = p.x - cx, y = p.y - cy; if (x < -300 || x > W + 300) continue;
      let fr = p.fr;
      const h = this.hides.find(q => q.p === p);
      if (h) fr = h.anim > 0 ? h.frOpen : h.frClosed;
      if (h && this.player.hidden && this.player.hidden.h === h && (G.t * 8 | 0) % 6 === 0) { Spr.draw(c, p.sheet, fr, x + 1, y + 2, p.flip || 1, { scale: p.s }); continue; }   // дверца дрожит
      const car = this.cars.find(q => q.p === p);
      Spr.draw(c, p.sheet, fr, x, y + 2, p.flip || 1, { scale: p.s, rot: p.rot });
      if (car && car.alarm > 0 && (G.t * 6 | 0) % 2) { c.fillStyle = 'rgba(255,200,60,0.35)'; c.beginPath(); c.arc(x + (car.x2 - car.x1) * 0.45 * (p.flip || 1), y - 20, 14, 0, 7); c.fill(); c.beginPath(); c.arc(x - (car.x2 - car.x1) * 0.45 * (p.flip || 1), y - 20, 10, 0, 7); c.fill(); }
    }
  }
  draw(c) {
    const wd = this.world, cx = Math.round(wd.cam.x), cy = 0, pl = this.player;
    this.drawBG(c, cx);
    if (this.map === 'sewer') { c.fillStyle = 'rgba(0,20,0,0.25)'; c.fillRect(0, 0, W, H); }
    this.drawProps(c, cx, cy, 'behind');
    this.drawProps(c, cx, cy, 'mid');
    for (const cp of this.cps) Art.checkpoint(c, cp.x - cx, cp.y - cy, cp.active, wd.t);
    for (const p of this.pickups) { const bob = Math.sin(p.t * 3) * 2; Spr.drawC(c, 'po7', p.kind === 'bone' ? 6 : 7, p.x - cx, p.y - cy - 8 + bob, 0, 1.4); }
    for (const b of this.items) b.draw(c, cx, cy);
    for (const g of this.guards) if (Math.abs(g.x - cx - W / 2) < W) g.drawBeam(c, cx, cy, this);
    for (const l of this.lasers) l.draw(c, cx, cy, this);
    for (const g of this.guards) if (Math.abs(g.x - cx - W / 2) < W) g.draw(c, cx, cy);
    for (const d of this.dogs) if (Math.abs(d.x - cx - W / 2) < W) d.draw(c, cx, cy);
    for (const b of this.beavers) b.draw(c, cx, cy);
    pl.draw(c, cx, cy);
    this.drawProps(c, cx, cy, 'front');
    for (const cm of this.cams) cm.draw(c, cx, cy, this);
    for (const d of this.drones) d.draw(c, cx, cy, this);
    c.save(); c.translate(-cx, -cy); FX.draw(c); c.restore();
    // передний план — тёмные силуэты, едут быстрее
    c.filter = 'brightness(0.22)';
    for (const q of this.D.fg) { const sx = (q.x - cx) * 1.35; if (sx < -200 || sx > W + 200) continue; Spr.draw(c, 'fg7', q.fr, sx, H + 18, 1, { scale: q.s }); }
    c.filter = 'none';
    if (this.outside) this.rain.draw(c);
    G.drawBubbles(c, cx, cy);
    this.drawHUD(c);
    if (this.caught) { const k = Math.min(1, this.caught.t * 3); G.bigTitle(c, 'ПОПАЛСЯ!', k, { size: 24, color: '#ff5a3a', y: 110 }); }
    if (this.mg) this.mg.draw(c);
    if (this.fade > 0) { c.fillStyle = `rgba(0,0,0,${this.fade})`; c.fillRect(0, 0, W, H); }
    if (this.trans && this.trans.text && this.fade > 0.6) G.text(this.trans.text, W / 2, H / 2 - 4, { align: 'center', color: '#c8d0d8' });
  }
  drawHUD(c) {
    const pl = this.player, R = Art.R;
    Game.drawHUD(c, pl, this.world);
    // гайки и кости
    R(c, 172, 6, 74, 22, '#111'); R(c, 173, 7, 72, 20, '#23262b');
    Spr.drawC(c, 'po7', 7, 184, 17, 0, 1.4); G.text('x' + pl.nuts, 192, 13, { size: 8, color: pl.nuts > 0 ? '#fff' : '#777' });
    Spr.drawC(c, 'po7', 6, 218, 17, 0, 1.2); G.text('x' + pl.bones, 228, 13, { size: 8, color: pl.bones > 0 ? '#fff' : '#777' });
    // заметность
    const k = U.clamp(this.susp, 0, 1);
    R(c, 254, 8, 150, 12, '#111'); R(c, 256, 10, 146, 8, '#1a2a1a');
    R(c, 256, 10, Math.round(146 * k), 8, k < 0.4 ? '#e0c040' : k < 0.75 ? '#f08a30' : '#ff3020');
    G.text(pl.hidden ? (pl.hidden.blown ? 'ВИДЕЛИ, КАК ТЫ ПРЯТАЛСЯ!' : 'СПРЯТАН') : k > 0 ? 'ТЕБЯ ЗАМЕЧАЮТ!' : pl.crouch ? 'КРАДЁШЬСЯ' : 'НЕЗАМЕТНОСТЬ', 329, 23, { align: 'center', size: 8, color: pl.hidden && !pl.hidden.blown ? '#8cf08c' : k > 0 ? '#ff8a6a' : '#c8d0d8' });
    if (this.flags.camsB > 0) G.text('КАМЕРЫ ВЫКЛ: ' + Math.ceil(this.flags.camsB), W - 8, 22, { align: 'right', size: 8, color: '#8cf08c' });
    const task = this.map === 'sewer' ? 'Канализация: пройти к люку' : this.map === 'in' ? (this.flags.note ? 'Код замка: ' + this.code : 'Найти код от главного зала') : (pl.x < L7.FENCE_X ? 'Найти проход к зданию' : pl.x < L7.YARD_X ? 'Пробраться вдоль стены' : 'Во двор, к воротам');
    G.text(task, W - 8, 34, { align: 'right', size: 8, color: '#e8e0c8' });
    if (this.near && !this.mg && !this.caught) Game.drawHint(c, '{up} — ' + this.near.label, 1, H - 52);
    else if (this.hint && !this.caught) Game.drawHint(c, this.hint.text, this.hintA);
  }
};
