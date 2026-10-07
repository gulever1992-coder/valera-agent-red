'use strict';
// ============ УРОВЕНЬ 7: прохождение (улица + здание), обнаружение, поимка, чекпоинты ============
L7.Run = class {
  constructor(level, map, x, y) {
    this.level = level; L7.run = this;
    this.flags = {}; this.ko = new Set(); this.t = 0; this.fade = 1; this.trans = null; this.mg = null; this.caught = null; this.susp = 0;
    this.code = String(U.randi(100, 999));
    this.cp = { map, x, y }; this.saved = { flags: {}, ko: new Set(), bones: 0 };
    this.load(map, x, y);
  }
  // ---------- построение карты ----------
  load(map, x, y, keepPlayer) {
    this.map = map;
    const D = this.D = map === 'out' ? L7.buildOut() : L7.buildIn();
    const wd = this.world = new Game.World(D.w, 1200);
    wd.run = this; wd.stats = this.level.stats; wd.score = this.level.score;
    wd.addScore = n => { wd.score += n; this.level.score = wd.score; };
    wd.playerAttack = (hb, dmg, atk, pl) => this.playerAttack(hb, dmg, atk, pl);
    wd.spawnPlayerProj = () => {};
    for (const p of D.plats) wd.addPlat(Object.assign({ look: 'none' }, p));
    wd.ladders = D.ladders;
    this.guards = D.guards.map(o => new L7.Guard(o));
    this.dogs = D.dogs.map(o => new L7.Dog(o));
    for (const g of this.guards) if (this.ko.has(g.id)) g.state = 'ko';
    this.cams = D.cams.map(o => new L7.Cam(o));
    this.lasers = D.lasers.map(o => new L7.Laser(o));
    this.hides = D.hides; this.covers = D.covers; this.ints = D.ints; this.props = D.props;
    this.pickups = D.pickups.filter(p => !this.flags['pk:' + map + p.x]).map(p => Object.assign({ t: Math.random() * 6 }, p));
    this.cps = D.cps.map(c => Object.assign({ active: this.cp.map === map && Math.abs(this.cp.x - c.x) < 4 && Math.abs(this.cp.y - c.y) < 4 }, c));
    this.hints = D.hints.map(h => Object.assign({ shown: 0 }, h));
    this.doors = (D.doors || []).map(d => { const p = wd.addPlat({ x: d.x - 5, y: L7.fy(d.f) - L7.RTOP, w: 10, h: L7.RTOP, oneway: false, look: 'none' }); return Object.assign({ plat: p, open: true, t: 0 }, d); });
    this.bones = [];
    const pl = keepPlayer || new L7.Player(x, y);
    pl.x = x; pl.y = y; pl.vx = pl.vy = 0; pl.hidden = null; pl.climb = null; pl.dead = false; pl.controls = true; pl.forcePose = null;
    this.player = pl;
    this.syncDoors();
    wd.cam.x = U.clamp(x - W / 2, 0, D.w - W); wd.cam.y = this.camTargetY();
    this.hint = null; this.hintA = 0;
    Music.play('stealth');
  }
  syncDoors() {
    for (const d of this.doors) {
      d.open = !d.lock || (d.lock === 'card' && this.flags.card && this.flags.cardUsed) || (d.lock === 'btn' && (this.flags.btnT > 0 || this.flags.srv));
      d.plat.x = d.open ? -9999 : d.x - 5;
    }
  }
  // ---------- запросы мира ----------
  coverAt(x, y) { return this.covers.some(c => Math.abs(c.y - y) < 20 && x > c.x1 && x < c.x2); }
  wallBetween(x0, x1, y) {
    const a = Math.min(x0, x1), b = Math.max(x0, x1);
    for (const d of this.doors) if (!d.open && Math.abs(L7.fy(d.f) - y) < 40 && d.x > a && d.x < b) return true;
    if (this.map === 'out' && Math.abs(y - L7.GY) < 40 && L7.FENCE_X > a && L7.FENCE_X < b) return true;
    return false;
  }
  noise(x, y, r, kind) {
    for (const e of [...this.guards, ...this.dogs]) if (Math.abs(e.y - y) < 40 && Math.abs(e.x - x) < r && !this.wallBetween(e.x, x, y)) e.hear(x, r);
  }
  throwBone(pl) { this.bones.push(new L7.Bone(pl.x + pl.facing * 14, pl.y - 50, pl.facing)); }
  tryTakedown(pl) {
    for (const g of this.guards) {
      if (!g.alive || g.state === 'stagger' || Math.abs(g.y - pl.y) > 30) continue;
      const dx = pl.x - g.x;
      if (Math.abs(dx) < 58 && Math.sign(dx) === -g.facing && !(g.state === 'look' && g.turnT <= 0)) {
        g.ko(); this.ko.add(g.id); this.level.stats.kills++; this.world.addScore(300);
        Sound.play('hit'); G.hitStop = 0.06; G.shake(3, 0.15); FX.burst(g.x, g.y - 70, 8, { colors: ['#fff', '#ffd84a'], speed: 120, life: 0.3, grav: 0 });
        FX.popText(g.x, g.y - 110, 'ВЫРУБЛЕН! +300', '#8cf08c');
        pl.facing = Math.sign(g.x - pl.x) || pl.facing;
        if (Math.random() < 0.5) G.say(pl, U.choice(['Спокойной ночи.', 'Тихо-тихо...', 'Отдохни, служивый.']), 1.2);
        return true;
      }
    }
    return false;
  }
  playerAttack(hb, dmg, atk, pl) {
    for (const d of this.dogs) {
      if (!d.stray || atk.hit.has(d) || !d.alive) continue;
      if (U.overlap(hb, d.box)) { atk.hit.add(d); if (d.hit(dmg, pl.facing)) { this.world.addScore(100); FX.popText(d.x, d.y - 50, '+100'); } Sound.play('hit'); G.hitStop = 0.04; }
    }
    // удар спецназовца спереди — заметит
    for (const g of this.guards) if (g.alive && g.state !== 'stagger' && g.state !== 'sleep' && Math.sign(pl.x - g.x) === g.facing && U.overlap(hb, { x: g.x - 12, y: g.y - 80, w: 24, h: 80 })) this.catchBy(g);
  }
  // ---------- взаимодействие ----------
  nearInt(pl) {
    let best = null;
    for (const it of this.ints) if ((!it.cond || it.cond(this)) && Math.abs(it.y - pl.y) < 24 && Math.abs(it.x - pl.x) < it.r && (!best || Math.abs(it.x - pl.x) < Math.abs(best.x - pl.x))) best = it;
    for (const h of this.hides) if (Math.abs(h.y - pl.y) < 24 && Math.abs(h.x - pl.x) < h.w / 2 + 6 && (!best || Math.abs(h.x - pl.x) < Math.abs(best.x - pl.x))) best = { hide: h, x: h.x, label: h.label || 'СПРЯТАТЬСЯ' };
    return best;
  }
  hideIn(h) {
    const pl = this.player;
    pl.hidden = { kind: h.kind, x: h.x, t: 0, blown: this.susp > 0.55 };   // спрятался на глазах — не поможет
    pl.x = h.x; pl.crouch = false; pl.atk = null; Sound.play('door');
  }
  unhide() { const pl = this.player; pl.hidden = null; pl.inv = 0; Sound.play('door'); }
  crawlHole() { this.transition(() => { this.player.x = L7.FENCE_X + 50; this.player.facing = 1; G.say(this.player, 'Пролез! Теперь тихо...', 1.6); }, 'Ползём...'); }
  enterBuilding() {
    this.transition(() => {
      this.saveCP('in', 1830, L7.fy(4));
      this.load('in', 1830, L7.fy(4), this.player); this.player.facing = -1;
      G.say(this.player, 'Я внутри. Где у них тут актовый зал?..', 2);
    }, 'Валера влез в окно...');
  }
  goStairs(f, x) { this.transition(() => { this.player.y = L7.fy(f); this.player.x = x; this.player.vy = 0; this.reachedFloor(f); }); }
  goVent(f, x) { Sound.play('clank'); this.transition(() => { this.player.y = L7.fy(f); this.player.x = x; this.player.vy = 0; this.reachedFloor(f); G.say(this.player, 'Апчхи! Пыльно тут...', 1.4); }, 'Ползём по вентиляции...'); }
  reachedFloor(f) { const cp = this.cps.find(c => c.y === L7.fy(f) && Math.abs(c.x - this.player.x) < 60); if (cp && !cp.active) this.activateCP(cp); }
  readNote() {
    this.flags.note = true; Sound.play('pickup');
    this.level.playScene(L7.sceneNote(this.level, this), () => this.level.backToRun());
  }
  pressButton() {
    this.flags.btnT = 12; this.syncDoors(); Sound.play('lever'); G.shake(1, 0.1);
    FX.popText(this.player.x, this.player.y - 100, 'ДВЕРЬ СЕРВЕРНОЙ ОТКРЫТА: 12 С', '#ffd84a');
  }
  pullLever() {
    this.flags.hall = true; Sound.play('lever'); G.shake(3, 0.3);
    G.say(this.player, 'Щёлк! Где-то внизу открылась дверь. Служебный вход в актовый зал!', 2.6); this.world.addScore(500);
  }
  hallDoor() {
    if (!this.flags.hall) { G.say(this.player, 'Заперто. Говорят, директор открывает её рычагом из кабинета...', 2.4); Sound.play('warn'); return; }
    this.done = true; this.player.controls = false; this.level.reachHall(this);
  }
  startMG(kind) { this.mg = new L7.MG(kind, this); this.player.controls = false; this.player.vx = 0; Sound.play('select'); }
  endMG(ok) {
    const k = this.mg.kind; this.mg = null; this.player.controls = true;
    if (!ok) return;
    if (k === 'safe') { this.flags.card = true; this.flags.cardUsed = true; this.syncDoors(); Sound.play('coin'); this.world.addScore(500); G.say(this.player, 'Ключ-карта директора! Теперь кабинет на 2 этаже мой.', 2.4); }
    if (k === 'wires') { this.flags.lasF2 = true; this.flags.srv = true; this.syncDoors(); Sound.play('zap'); this.world.addScore(500); G.say(this.player, 'Лазеры на втором этаже обесточены! Ну, почти все...', 2.4); }
    if (k === 'simon') { this.flags.camsF1 = true; Sound.play('confirm'); this.world.addScore(500); G.say(this.player, 'Камеры первого этажа выключены. Смотрите свои сериалы, ребята.', 2.4); }
  }
  // ---------- чекпоинты, поимка, рестарт ----------
  saveCP(map, x, y) { this.cp = { map, x, y }; this.saved = { flags: Object.assign({}, this.flags, { btnT: 0 }), ko: new Set(this.ko), bones: this.player.bones }; }
  activateCP(cp) {
    for (const c of this.cps) c.active = false;
    cp.active = true; this.saveCP(this.map, cp.x, cp.y);
    Sound.play('checkpoint'); this.player.heal(25); FX.popText(cp.x, cp.y - 90, 'КОНТРОЛЬНАЯ ТОЧКА', '#8cf08c');
  }
  catchBy(by) {
    if (this.caught || this.done) return;
    const pl = this.player;
    this.caught = { t: 0, by, phase: 'spot' };
    pl.controls = false; pl.vx = 0; pl.atk = null; if (pl.hidden) pl.hidden = null;
    Sound.play('warn'); Music.play('alarm'); G.flash(0.15, '#ff2010');
    this.level.stats.caught = (this.level.stats.caught || 0) + 1;
    // кто придёт вязать: ближайший спецназовец на этом ярусе, иначе — новый прибегает из-за края экрана
    let g = by instanceof L7.Guard ? by : null;
    if (!g) { for (const q of this.guards) if (q.alive && q.state !== 'stagger' && Math.abs(q.y - pl.y) < 30 && Math.abs(q.x - pl.x) < 420 && !this.wallBetween(q.x, pl.x, pl.y) && (!g || Math.abs(q.x - pl.x) < Math.abs(g.x - pl.x))) g = q; }
    if (!g) { const side = pl.x - this.world.cam.x > W / 2 ? -1 : 1; g = new L7.Guard({ x: pl.x + side * -360, y: pl.y, kind: 'post', facing: side }); g.x = side > 0 ? this.world.cam.x - 40 : this.world.cam.x + W + 40; this.guards.push(g); }
    this.caught.g = g; g.state = 'catch'; g.facing = Math.sign(pl.x - g.x) || 1;
    if (by instanceof L7.Dog) { by.state = 'bark'; by.anim = 'bark'; Sound.play('bark'); }
    G.say(g, U.choice(['Стоять! Это он!', 'Попался, Валера!', 'Лежать! Руки!']), 1.6);
  }
  updateCaught(dt) {
    const c = this.caught, pl = this.player, g = c.g;
    c.t += dt; g.animT += dt;
    if (c.by instanceof L7.Dog) { c.by.animT += dt; c.by.anim = 'bark'; }
    if (c.phase === 'spot') { pl.setAnim('scared'); pl.animT += dt; if (c.t > 0.7) c.phase = 'run'; }
    else if (c.phase === 'run') {
      g.anim = 'run'; g.facing = Math.sign(pl.x - g.x) || g.facing;
      g.x = U.approach(g.x, pl.x - g.facing * 30, 190 * dt);
      if (Math.abs(g.x - (pl.x - g.facing * 30)) < 2) { c.phase = 'tie'; c.t = 0; Sound.play('rope'); }
    } else if (c.phase === 'tie') {
      g.anim = 'tie'; pl.forcePose = 'tied'; pl.setAnim('tied'); pl.animT += dt;
      if (c.t > 1.3) { c.phase = 'drag'; c.t = 0; g.facing = -g.facing; G.say(pl, U.choice(['Пустите! Я свой!', 'Я просто мимо шёл!', 'Ай! Верёвка жмёт!']), 1.6); }
    } else if (c.phase === 'drag') {
      g.anim = 'drag'; g.x += g.facing * 60 * dt; pl.x = g.x - g.facing * 34;
      if (c.t > 1.2) this.fade = Math.min(1, this.fade + dt * 2);
      if (c.t > 1.8 && this.fade >= 1) this.respawn();
    }
  }
  respawn() {
    const cp = this.cp, bones = this.saved.bones;
    this.flags = Object.assign({}, this.saved.flags); this.ko = new Set(this.saved.ko); this.caught = null; this.susp = 0; this.mg = null;
    this.level.stats.deaths++;
    this.load(cp.map, cp.x, cp.y);
    this.player.bones = Math.max(bones, 2);
    this.player.hp = Math.max(this.player.hp, 60);
    G.say(this.player, U.choice(['Еле вырвался! Ещё разок, потише.', 'Развязался! Теперь аккуратнее.', 'Верёвки у них гнилые. Пробую снова!']), 2);
  }
  transition(mid, text) { if (this.trans) return; this.trans = { t: 0, mid, text, did: false }; this.player.controls = false; this.player.vx = 0; }
  camTargetY() {
    const pl = this.player;
    if (this.map === 'out') return U.clamp(pl.y - 250, -420, 0);
    return U.clamp(pl.y - 236, -20, L7.fy(1) + 60 - H);
  }
  // ---------- обновление ----------
  update(dt) {
    const wd = this.world, pl = this.player, I = G.Input;
    this.t += dt; wd.t += dt;
    if (!this.done) this.level.stats.time += dt;
    if (this.trans) {
      const tr = this.trans; tr.t += dt;
      if (tr.t < 0.4) this.fade = tr.t / 0.4;
      else if (!tr.did) { tr.did = true; tr.mid(); this.fade = 1; wd.cam.x = U.clamp(this.player.x - W / 2, 0, this.D.w - W); this.world.cam.y = this.camTargetY(); }
      else if (tr.t > (tr.text ? 1.3 : 0.6)) { this.fade = Math.max(0, this.fade - dt * 3); if (this.fade <= 0) { this.trans = null; this.player.controls = true; } }
      return;
    }
    if (this.fade > 0 && !this.caught) this.fade = Math.max(0, this.fade - dt * 2);
    if (this.mg) { const r = this.mg.update(dt, I); if (r) this.endMG(r === 'ok'); return; }
    if (this.caught) { this.updateCaught(dt); this.camFollow(dt); return; }
    if (this.flags.btnT > 0) { this.flags.btnT -= dt; if (this.flags.btnT <= 0) { this.flags.btnT = 0; this.syncDoors(); Sound.play('door'); if (pl.x > 1270 && pl.x < 1290) pl.x = 1265; } }
    wd.updatePlats(dt);
    // взаимодействие ({up}); на лестницах лесов {up} — лезть
    const near = !pl.hidden && pl.onGround && !pl.climb ? this.nearInt(pl) : null;
    this.near = near;
    const onLadder = this.map === 'out' && wd.ladders.some(l => Math.abs(pl.x - (l.x + l.w / 2)) < 14 && pl.y >= l.y - 2 && pl.y - 30 <= l.y + l.h);
    if (near && pl.controls && I.pressed('up') && !onLadder) {
      if (near.hide) this.hideIn(near.hide); else near.act(this);
      I.hit.up = false;
    }
    pl.update(dt, wd);
    // предметы
    for (const p of this.pickups) { p.t += dt; if (!p.dead && Math.abs(p.x - pl.x) < 18 && Math.abs(p.y - pl.y) < 30) { p.dead = true; this.flags['pk:' + this.map + p.x] = true; if (p.kind === 'bone') { pl.bones += p.n; FX.popText(p.x, p.y - 30, 'КОСТИ +' + p.n, '#f4f0e4'); Sound.play('pickup'); } } }
    this.pickups = this.pickups.filter(p => !p.dead);
    for (const b of this.bones) b.update(dt, this);
    this.bones = this.bones.filter(b => !b.gone || (b.taken && !b.gone));
    for (const g of this.guards) g.update(dt, this);
    for (const d of this.dogs) d.update(dt, this, pl);
    this.dogs = this.dogs.filter(d => !d.dead);
    for (const c of this.cams) c.update(dt);
    for (const l of this.lasers) { l.update(dt); if (l.hits(this, pl)) { Sound.play('zap'); FX.burst(pl.x, pl.y - 40, 10, { colors: ['#ff3030', '#fff'], speed: 120, life: 0.3, grav: 0 }); this.catchBy(l); return; } }
    // заметность
    let rate = 0, who = null;
    for (const e of [...this.guards, ...this.dogs, ...this.cams]) {
      const r = e.sees ? e.sees(this, pl) : 0; e.see = r > 0 ? Math.min(1, this.susp) : Math.max(0, (e.see || 0) - dt * 2);
      if (r > rate) { rate = r; who = e; }
    }
    if (pl.hidden && pl.hidden.blown && this.susp < 0.3) pl.hidden.blown = false;
    if (rate > 0) { this.susp += rate * dt; if (who instanceof L7.Dog && this.susp > 0.4 && Math.random() < dt * 3) Sound.play('bark'); }
    else this.susp = Math.max(0, this.susp - dt * 0.45);
    if (this.susp >= 1) { this.susp = 1; this.catchBy(who); return; }
    // чекпоинты
    for (const cp of this.cps) if (!cp.active && Math.abs(pl.x - cp.x) < 26 && Math.abs(pl.y - cp.y) < 20 && !pl.dead) this.activateCP(cp);
    // подсказки
    let hint = null;
    for (const h of this.hints) if (!h.done && pl.x > h.x && pl.x < h.x + h.w && (h.f == null || Math.abs(L7.fy(h.f) - pl.y) < 30)) { hint = h; h.shown += dt; if (h.shown > 7) h.done = true; }
    if (hint) { this.hint = hint; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
    // смерть от собак
    if (pl.dead && pl.deadT > 1.4) { this.fade = Math.min(1, this.fade + dt * 2); if (this.fade >= 1) this.respawn(); }
    this.camFollow(dt);
  }
  camFollow(dt) {
    const wd = this.world, pl = this.player;
    const tx = U.clamp(pl.x - W * 0.45 + pl.facing * 24, 0, this.D.w - W);
    wd.cam.x += (tx - wd.cam.x) * Math.min(1, dt * 5);
    wd.cam.y += (this.camTargetY() - wd.cam.y) * Math.min(1, dt * 5);
  }
  // ---------- рисование ----------
  tile(c, img, x0, y, w, h, mirror = true) {
    if (!img) return;
    let x = -((x0 % (w * 2)) + w * 2) % (w * 2);
    for (let i = 0; x + i * w < W; i++) {
      const xx = Math.round(x + i * w);
      if (xx + w < 0) continue;
      const odd = mirror && ((Math.floor((x0 + xx) / w) % 2 + 2) % 2 === 1);
      if (odd) { c.save(); c.translate(xx + w, y); c.scale(-1, 1); c.drawImage(img, 0, 0, w, h); c.restore(); } else c.drawImage(img, xx, y, w, h);
    }
  }
  drawOut(c, cx, cy) {
    const I = L7.img, GY = L7.GY;
    // небо
    c.fillStyle = '#2a1e3a'; c.fillRect(0, 0, W, H);
    if (I.sky) { const h = 640, w = h * I.sky.width / I.sky.height; this.tile(c, I.sky, cx * 0.06, Math.round(GY - h + 40 - cy * 0.12), w, h); }
    // средний план: подворотни | двор (шов прячет забор)
    const fxs = L7.FENCE_X - cx;
    const mid = (img, x0, x1) => { if (!img || x1 <= 0 || x0 >= W) return; const h = 280, w = h * img.width / img.height; c.save(); c.beginPath(); c.rect(Math.max(0, x0), -500, Math.min(W, x1) - Math.max(0, x0), 1400); c.clip(); this.tile(c, img, cx * 0.5, Math.round(GY + 4 - h - cy * 0.5), w, h); c.restore(); };
    mid(I.alley, -1, fxs); mid(I.yard, fxs, W + 1);
    // фасад со строительными лесами (игровой слой)
    if (I.facade) { const w = L7.FAC_W, h = w * I.facade.height / I.facade.width; c.drawImage(I.facade, Math.round(L7.FAC_X - cx), Math.round(GY - h - cy), w, h); }
    // земля
    const gr = (img, x0, x1) => { if (!img) { c.fillStyle = '#3a3634'; c.fillRect(Math.max(0, x0), GY - cy, Math.min(W, x1) - Math.max(0, x0), 80); return; } const h = 70, w = h * img.width / img.height; c.save(); c.beginPath(); c.rect(Math.max(0, x0), 0, Math.min(W, x1) - Math.max(0, x0), H + 500); c.clip(); this.tile(c, img, cx, Math.round(GY - 6 - cy), w, h, false); c.restore(); };
    gr(I.gr_alley, -1, fxs); gr(I.gr_yard, fxs, W + 1);
  }
  drawIn(c, cx, cy) {
    const I = L7.img;
    c.fillStyle = '#140e0c'; c.fillRect(0, 0, W, H);
    for (let f = 1; f <= 4; f++) {
      const y = L7.fy(f) - L7.RTOP - cy;
      if (y > H || y + L7.RH < 0) continue;
      L7.LAYOUT[f].forEach(([room, name], col) => {
        const x = col * L7.RW - cx; if (x > W || x + L7.RW < 0) return;
        const img = I['room_' + room];
        if (img) c.drawImage(img, Math.round(x), Math.round(y), L7.RW, L7.RH);
        else { c.fillStyle = ['#4a3428', '#3e2c22'][(col + f) % 2]; c.fillRect(Math.round(x), Math.round(y), L7.RW, L7.RH); c.fillStyle = '#2a1c16'; c.fillRect(Math.round(x), Math.round(y + L7.RTOP), L7.RW, 25); }
        G.text(name, Math.round(x + L7.RW / 2), Math.round(y + 6), { align: 'center', size: 8, color: 'rgba(255,230,170,0.75)' });
      });
      // перекрытие (тень)
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, Math.round(L7.fy(f) - cy + 20), W, 5);
    }
    for (const d of this.doors) {
      const x = d.x - cx, y = L7.fy(d.f) - cy; if (x < -60 || x > W + 60 || y < -40 || y > H + 160) continue;
      if (L7.has('props7in')) Spr.draw(c, 'props7in', d.open ? 12 : 11, x, y, 1);
      else { c.fillStyle = d.open ? '#120a08' : '#6a4024'; c.fillRect(x - 16, y - 112, 32, 112); }
      if (!d.open) G.text(d.lock === 'card' ? 'КАРТА' : 'ЗАКРЫТО', x, y - 124, { align: 'center', size: 8, color: '#ff8a6a', outline: true });
      if (d.lock === 'btn' && this.flags.btnT > 0) G.text(Math.ceil(this.flags.btnT) + ' С', x, y - 124, { align: 'center', size: 8, color: '#8cf08c', outline: true });
    }
  }
  drawProps(c, cx, cy, front) {
    for (const p of this.props) {
      if (!!p.front !== !!front) continue;
      const x = p.x - cx, y = p.y - cy; if (x < -200 || x > W + 200 || y < -200 || y > H + 300) continue;
      if (L7.has(p.sheet)) Spr.draw(c, p.sheet, p.fr, x, y + 2, 1, { scale: p.s });
      else { c.fillStyle = 'rgba(60,70,60,0.8)'; c.fillRect(x - 20, y - 40, 40, 40); }
    }
  }
  draw(c) {
    const wd = this.world, cx = Math.round(wd.cam.x), cy = Math.round(wd.cam.y), pl = this.player;
    if (this.map === 'out') this.drawOut(c, cx, cy); else this.drawIn(c, cx, cy);
    this.drawProps(c, cx, cy, false);
    for (const cp of this.cps) Art.checkpoint(c, cp.x - cx, cp.y - cy, cp.active, wd.t);
    for (const p of this.pickups) { const bob = Math.sin(p.t * 3) * 2; if (L7.has('props7out')) Spr.drawC(c, 'props7out', 8, p.x - cx, p.y - cy - 8 + bob, 0, 1); else Art.R(c, p.x - cx - 6, p.y - cy - 10 + bob, 12, 4, '#f4f0e4'); }
    for (const b of this.bones) b.draw(c, cx, cy);
    for (const l of this.lasers) l.draw(c, cx, cy, this);
    for (const g of this.guards) if (Math.abs(g.x - cx - W / 2) < W) g.draw(c, cx, cy);
    for (const d of this.dogs) if (Math.abs(d.x - cx - W / 2) < W) d.draw(c, cx, cy);
    pl.draw(c, cx, cy);
    // укрытия-«занавески» поверх спрятавшегося
    for (const p of this.props) if (p.hide && pl.hidden && Math.abs(p.x - pl.hidden.x) < 4 && Math.abs(p.y - pl.y) < 30) Spr.draw(c, p.sheet, p.fr, p.x - cx, p.y - cy + 2, 1, { scale: p.s });
    this.drawProps(c, cx, cy, true);
    for (const cm of this.cams) cm.draw(c, cx, cy);
    c.save(); c.translate(-cx, -cy); FX.draw(c); c.restore();
    // передний план — тёмные силуэты
    if (L7.has(this.D.fgSheet)) { c.filter = this.map === 'in' ? 'brightness(0.16)' : 'brightness(0.3)'; const dy = this.map === 'in' ? 78 : 26; for (const q of this.D.fg) { const sx = (q.x - cx) * 1.3; if (sx < -200 || sx > W + 200) continue; Spr.draw(c, this.D.fgSheet, q.fr, sx, H + dy, 1, { scale: q.s }); } c.filter = 'none'; }
    G.drawBubbles(c, cx, cy);
    this.drawHUD(c);
    if (this.caught) { const k = Math.min(1, this.caught.t * 3); G.bigTitle(c, 'ПОПАЛСЯ!', k, { size: 24, color: '#ff5a3a', y: 110 }); }
    if (this.mg) this.mg.draw(c);
    if (this.fade > 0) { c.fillStyle = `rgba(0,0,0,${this.fade})`; c.fillRect(0, 0, W, H); }
    if (this.trans && this.trans.text && this.fade > 0.6) G.text(this.trans.text, W / 2, H / 2 - 4, { align: 'center', color: '#c8d0d8' });
  }
  drawHUD(c) {
    const pl = this.player;
    Game.drawHUD(c, pl, this.world);
    const R = Art.R;
    // кости
    R(c, 172, 6, 58, 22, '#111'); R(c, 173, 7, 56, 20, '#23262b');
    if (L7.has('props7out')) Spr.drawC(c, 'props7out', 8, 188, 17, 0, 1); else R(c, 182, 15, 12, 4, '#f4f0e4');
    G.text('x' + pl.bones, 200, 13, { size: 8, color: pl.bones > 0 ? '#fff' : '#777' });
    // заметность
    const k = U.clamp(this.susp, 0, 1);
    R(c, 240, 8, 160, 12, '#111'); R(c, 242, 10, 156, 8, '#1a2a1a');
    R(c, 242, 10, Math.round(156 * k), 8, k < 0.4 ? '#e0c040' : k < 0.75 ? '#f08a30' : '#ff3020');
    G.text(pl.hidden ? (pl.hidden.blown ? 'ВИДЕЛИ, КАК ТЫ ПРЯТАЛСЯ!' : 'СПРЯТАН') : k > 0 ? 'ТЕБЯ ЗАМЕЧАЮТ!' : pl.crouch ? 'КРАДЁШЬСЯ' : 'НЕЗАМЕТНОСТЬ', 320, 23, { align: 'center', size: 8, color: pl.hidden && !pl.hidden.blown ? '#8cf08c' : k > 0 ? '#ff8a6a' : '#c8d0d8' });
    // задачи
    const tasks = this.map === 'out'
      ? [[this.player.x > L7.FENCE_X, 'Дыра в заборе'], [false, 'Окно на 4 этаже']]
      : [[this.flags.card, 'Ключ-карта (сейф)' + (this.flags.note ? ' КОД ' + this.code : '')], [this.flags.lasF2, 'Лазеры 2 эт. (щиток)'], [this.flags.camsF1, 'Камеры 1 эт. (пульт)'], [this.flags.hall, 'Рычаг директора'], [false, 'Актовый зал, 1 эт.']];
    tasks.forEach(([ok, t], i) => G.text((ok ? '+ ' : '- ') + t, W - 8, 34 + i * 11, { align: 'right', size: 8, color: ok ? '#8cf08c' : '#e8e0c8' }));
    if (this.map === 'in') G.text(L7.floorOf(pl.y) + ' ЭТАЖ', W - 8, 22, { align: 'right', size: 8, color: '#ffd84a' });
    // взаимодействие
    if (this.near && !this.mg && !this.caught) Game.drawHint(c, '{up} — ' + this.near.label, 1, H - 52);
    else if (this.hint && !this.caught) Game.drawHint(c, this.hint.text, this.hintA);
  }
};
