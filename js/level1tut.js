'use strict';
// ============ УРОВЕНЬ 1: ОБУЧЕНИЕ В ЦЕХУ — Юрик принимает «экзамен по технике безопасности» ============
// Встроено в катсцену L1.sceneIntro: присесть 10 раз -> проползти к Юрику -> подпрыгнуть 3 раза ->
// падает кирпич -> сбить кирпичом голубя и чайку, голубя на полу — кулаком из приседа.
// Арт (Codex): листы yurik1, pigeon1, v1_crawl — сборка py tools/build_l1tut.py. Пока листа нет — запасной кадр.
(function () {
  const has = n => !!(window.SPRITES && window.SPRITES[n]);
  const A = (sheet, frames, fps = 8, o = {}) => Object.assign({ fr: frames.map(i => [sheet, i]), fps }, o);
  WHO.yurik1 = { name: 'ЮРИК, ИНЖЕНЕР ПО ТБ', color: '#7fd0ff', voice: 105 };
  Spr.ANIM.yurik1 = has('yurik1')
    ? { stand: A('yurik1', [0]), walk: A('yurik1', [1, 2, 3, 2], 7), talk: A('yurik1', [4]), point: A('yurik1', [5]), arms: A('yurik1', [6]), ok: A('yurik1', [7]) }
    : { stand: A('wk_b', [1]), walk: A('wk_b', [1, 3], 5), talk: A('wk_b', [3]), point: A('wk_b', [1]), arms: A('wk_b', [1]), ok: A('wk_b', [3]) };
  // ползком — цикл ур.7 (val4), перерисованный в одежде ур.1 (tools/build_crawl14.py)
  const CR = has('v1_crawl6') ? 'v1_crawl6' : 'val4';
  Spr.ANIM.valera.crawl = A(CR, [0, 1, 2, 3, 4, 5], 9);
  Spr.ANIM.valera.crawlIdle = A(CR, [0]);

  const NUM = ['', 'Раз!', 'Два!', 'Три!', 'Четыре!', 'Пять!', 'Шесть!', 'Семь!', 'Восемь!', 'Девять!', 'Десять!'];

  // ---------- птица-мишень ----------
  class Bird {
    constructor(type, x, y, facing) { this.type = type; this.x = x; this.y = y; this.x0 = x; this.y0 = y; this.facing = facing; this.t = Math.random() * 5; this.dead = false; this.gone = false; this.vy = 0; this.vx = 0; this.hop = 0; this.rot = 0; }
    get box() {
      if (this.type === 'gull') return { x: this.x - 14, y: this.y - 10, w: 28, h: 20 };
      return { x: this.x - 12, y: this.y - 18, w: 24, h: 18 };
    }
    update(dt, FL) {
      this.t += dt;
      if (this.dead) {
        this.vy += GRAV * 0.7 * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.rot += 9 * dt * (this.vx >= 0 ? 1 : -1);
        if (this.y >= FL) { this.y = FL; this.vy = 0; this.vx = 0; this.rot = 0; this.lieT = (this.lieT || 0) + dt; if (this.lieT > 2.2) this.gone = true; }
        return;
      }
      if (this.type === 'gull') { this.x = this.x0 + Math.sin(this.t * 0.9) * 26; this.y = this.y0 + Math.sin(this.t * 2.3) * 5; this.facing = Math.cos(this.t * 0.9) >= 0 ? 1 : -1; }
      if (this.hop > 0) { this.hop -= dt; this.y = this.y0 - Math.sin(Math.max(0, this.hop) / 0.4 * Math.PI) * 14; }
    }
    kill(dir) {
      if (this.dead) return;
      this.dead = true; this.vy = -190; this.vx = dir * 70;
      Sound.play(this.type === 'gull' ? 'gull' : 'bird'); Sound.play('punch'); G.shake(3, 0.15);
      FX.burst(this.x, this.y - 8, 14, { colors: this.type === 'gull' ? ['#fff', '#e8ecee', '#c8d0d8'] : ['#8a94a0', '#b8c0c8', '#fff'], speed: 110, grav: 90, life: 0.9, size: 2 });
      FX.popText(this.x, this.y - 26, 'ЕСТЬ!', '#8cf08c');
    }
    startle() { if (this.hop <= 0 && !this.dead) { this.hop = 0.4; Sound.play('bird'); } }
    draw(c) {
      if (this.gone) return;
      if (this.dead && this.lieT > 1.6 && ((G.t * 14) | 0) % 2) return;
      if (this.type === 'gull') { Spr.draw(c, 'enemies', this.dead ? 3 : 2 + ((this.t * 7 | 0) % 2), this.x, this.y + 8, this.facing, { rot: this.rot }); return; }
      if (!has('pigeon1')) { Spr.draw(c, 'enemies', 3, this.x, this.y, this.facing, { scale: 0.6, rot: this.dead ? Math.PI : 0 }); return; }
      let fr;
      if (this.dead) fr = this.y >= this.y0 && this.vy === 0 ? 5 : 4;
      else if (this.hop > 0) fr = 3;
      else { const k = this.t % 4.2; fr = this.type === 'floor' ? (k > 2.6 && (k * 5 | 0) % 2 ? 2 : 0) : (k > 3.2 ? 1 : 0); }
      Spr.draw(c, 'pigeon1', fr, this.x, this.y, this.facing, { rot: this.dead && fr === 4 ? this.rot : 0 });
    }
  }

  // ---------- площадка обучения ----------
  L1.Tut = class {
    constructor(FL, v) {
      L1.tut = this;   // для тест-бота tools/p1/tut_test.js
      this.FL = FL; this.live = false; this.step = null; this.n = 0; this.need = 0; this.grace = 0; this.maxX = W - 30; this.goalX = 0;
      const wd = this.world = new Game.World(W, H);
      wd.stats = { time: 0, dmg: 0, kills: 0, deflect: 0, secrets: 0, food: 0, deaths: 0 }; wd.score = 0; wd.addScore = () => {};
      wd.addPlat({ x: -60, y: FL, w: W + 120, h: 150, oneway: false, look: 'none' });
      wd.playerAttack = (hb, dmg, atk, pl) => this.attack(hb, atk, pl);
      wd.spawnPlayerProj = (k, x, y, d) => { const p = new Game.Proj(k, x, y, d); p.poof = () => {}; wd.projs.push(p); };
      wd.ev = id => this.ev(id);
      const pl = this.pl = new Game.Player(v.x, FL); pl.onGround = true; pl.controls = false; pl.facing = 1;
      if (!has('v1_crawl6')) pl.drawOpts = () => (pl.anim === 'crawl' || pl.anim === 'crawlIdle' ? { scale: 0.84 } : {});
      this.yurik = new G.Actor('yurik1', W + 40, FL, -1); this.yurik.headH = 90;
      this.brick = null; this.warnT = 0; this.dodged = false; this.told = false;
      // голубь на ящике у левой стены, чайка под потолком, голубь на полу
      this.birds = [new Bird('box', 123, 279, 1), new Bird('gull', 330, FL - 185, 1), new Bird('floor', 470, FL, -1)];
      if (!G.portraits.yurik1) G.loadImage(has('yurik1') ? 'assets/spr/p_yurik1.png' : 'assets/spr/p_yurik.png').then(im => { G.portraits.yurik1 = im; }).catch(() => {});
    }
    get left() { return this.birds.filter(b => !b.dead).length; }
    // игрок вместо актёра катсцены и обратно
    take(v) { this.pl.x = v.x; this.pl.y = this.FL; this.pl.facing = v.facing; v.visible = false; this.live = true; }
    release(v) { v.x = this.pl.x; v.y = this.FL; v.facing = this.pl.facing; v.visible = true; this.live = false; this.step = null; }
    begin(step, need) { this.step = step; this.n = 0; this.need = need || 0; this.grace = 0.3; this.pl.forcePose = null; }
    stop() { this.step = null; this.pl.controls = false; this.pl.forcePose = null; this.pl.crawlSpeed = 0; }
    ev(id) {
      if (this.grace > 0) return;
      if ((this.step === 'squat' && id === 'crouch') || (this.step === 'jump' && id === 'jump')) {
        if (this.n >= this.need) return;
        this.n++; Sound.play('coin');
        G.say(this.yurik, NUM[this.n] || this.n + '!', 0.7);
      }
    }
    dropBrick(x, y) { this.brick = { x: U.clamp(x, 24, W - 40), y: Math.min(y, this.FL - 6), vy: 0, r: 0, rest: false }; }
    attack(hb, atk, pl) {
      if (this.step !== 'birds') return;
      for (const b of this.birds) {
        if (b.dead || b.type !== 'floor' || atk.hit.has(b) || !U.overlap(hb, b.box)) continue;
        atk.hit.add(b);
        if (atk.low) b.kill(pl.facing); else b.startle();
      }
    }
    update(dt) {
      const pl = this.pl, wd = this.world, FL = this.FL, I = G.Input;
      wd.t += dt;
      if (this.grace > 0) { this.grace -= dt; if (this.grace <= 0 && this.step) pl.controls = true; }
      if (this.warnT > 0) this.warnT -= dt;
      this.yurik.update(dt);
      for (const b of this.birds) b.update(dt, FL);
      // кирпич: падение
      const br = this.brick;
      if (br && !br.rest) {
        br.vy += 1400 * dt; br.y += br.vy * dt; br.r += 6 * dt;
        if (br.y > FL - 5) { br.y = FL - 5; br.rest = true; br.r = 0.2; Sound.play('brick'); FX.dust(br.x, FL, 6); if (br.big) { G.shake(6, 0.3); FX.burst(br.x, FL - 4, 8, { colors: ['#a8452e', '#7a2e1e'], speed: 120, size: 3 }); } }
      }
      if (!this.live) return;
      const x0 = pl.x;
      pl.crawlSpeed = this.step === 'crawl' ? 62 : 0;
      pl.update(dt, wd);
      if (this.step === 'crawl') {
        if (!pl.crouch && pl.onGround) {   // стоя идти нельзя — только на четвереньках
          pl.x = x0; pl.vx = 0;
          if (pl.controls && (I.held('left') || I.held('right')) && this.warnT <= 0) { this.warnT = 1.6; FX.popText(pl.x, pl.y - 86, 'ТОЛЬКО ПОЛЗКОМ!', '#ff6a4a'); Sound.play('warn'); }
        }
        pl.forcePose = pl.crouch ? (Math.abs(pl.vx) > 5 ? 'crawl' : 'crawlIdle') : null;
        if (pl.forcePose) pl.setAnim(pl.forcePose);
        if (pl.x >= this.goalX) this.n = 1;
      }
      pl.x = U.clamp(pl.x, 16, this.maxX);
      if (this.step === 'birds') {
        // подобрать кирпич
        if (br && br.rest && pl.onGround && Math.abs(pl.x - br.x) < 16 && pl.ammo.bricks <= 0) {
          this.brick = null; pl.ammo.bricks = 1; pl.weapon = 'bricks'; Sound.play('pickup'); FX.popText(pl.x, pl.y - 86, 'КИРПИЧ!', '#8cd0ff');
        }
        // кирпич в полёте
        for (const p of wd.projs) {
          p.update(dt, wd, pl);
          for (const b of this.birds) {
            if (b.dead || p.dead) continue;
            if (b.type === 'floor') {   // этот уворачивается — только кулаком
              if (Math.abs(p.x - b.x) < 46 && p.y > FL - 60 && b.hop <= 0) { b.startle(); FX.popText(b.x, b.y - 30, 'УВЕРНУЛСЯ!', '#ffd84a'); this.dodged = true; }
            } else if (U.overlap(p.box, b.box)) { b.kill(p.dir); p.dead = true; }
          }
          if (p.dead) this.dropBrick(p.x, p.y);
        }
        wd.projs = wd.projs.filter(p => !p.dead);
        const only = this.left === 1 && !this.birds[2].dead;
        if ((this.dodged || only) && !this.told) { this.told = true; G.say(this.yurik, 'Этого кирпичом не возьмёшь! Присядь и дай кулаком!', 3.2); }
      }
    }
    // мир: птицы, Юрик, кирпич, Валера, снаряды
    draw(c) {
      for (const b of this.birds) if (b.type !== 'floor') b.draw(c);
      this.yurik.draw(c);
      if (G.bg.hallFg) c.drawImage(G.bg.hallFg, 520, 278, 120, 72);     // ящики справа: Юрик выходит из-за них (tools/p1/build_hall_fg.py)
      this.birds[2].draw(c);
      const br = this.brick;
      if (br) {
        Art.item(c, 'brick', br.x, br.y, br.r, 1.3);
        if (br.rest && this.step === 'birds' && this.pl.ammo.bricks <= 0) this.arrow(c, br.x, br.y - 16);
      }
      if (this.live) this.pl.draw(c, 0, 0);
      for (const p of this.world.projs) p.draw(c, 0, 0);
      if (this.step === 'crawl') this.arrow(c, this.goalX + 8, this.FL - 104);
    }
    arrow(c, x, y) {   // указатель «сюда» (интерфейс)
      const b = Math.abs(Math.sin(G.t * 5)) * 4;
      c.fillStyle = '#111'; c.beginPath(); c.moveTo(x - 7, y - 9 + b); c.lineTo(x + 7, y - 9 + b); c.lineTo(x, y + 2 + b); c.fill();
      c.fillStyle = '#ffd84a'; c.beginPath(); c.moveTo(x - 5, y - 8 + b); c.lineTo(x + 5, y - 8 + b); c.lineTo(x, y + b); c.fill();
    }
    // что делать и какие кнопки жать
    prompt() {
      const pl = this.pl;
      if (this.step === 'squat') return { caps: ['D'], text: 'ПРИСЯДЬ 10 РАЗ: нажимай {down}', cnt: 'ПРИСЕДАНИЯ ' + this.n + ' / ' + this.need };
      if (this.step === 'crawl') return { caps: ['D', 'R'], text: 'ПОЛЗИ К ЮРИКУ: держи {down} и жми ВПРАВО', cnt: '' };
      if (this.step === 'jump') return { caps: Game.keyCaps('jump'), text: 'ПОДПРЫГНИ 3 РАЗА: {jump}', cnt: 'ПРЫЖКИ ' + this.n + ' / ' + this.need };
      if (this.step === 'birds') {
        const cnt = 'ПТИЦЫ ' + (3 - this.left) + ' / 3';
        const only = this.left === 1 && !this.birds[2].dead;
        if (only || (this.dodged && Math.abs(pl.x - this.birds[2].x) < 70 && !this.birds[2].dead))
          return { caps: ['D'].concat(Game.keyCaps('punch')), text: 'ГОЛУБЬ НА ПОЛУ: кирпич не поможет, смени оружие на кулак. Подойди, присядь {down} и бей {punch}', cnt };
        if (pl.ammo.bricks <= 0 && this.brick) return { caps: Game.keyCaps('move'), text: 'ПОДБЕРИ КИРПИЧ: подойди к нему. Промазал? Кирпич можно поднять снова', cnt };
        if (!this.birds[1].dead && this.birds[0].dead) return { caps: Game.keyCaps('jump').concat(Game.keyCaps('throw')), text: 'ЧАЙКА ВЫСОКО: подпрыгни {jump} и в прыжке бросай кирпич {throw}', cnt };
        return { caps: Game.keyCaps('throw'), text: 'БРОСЬ КИРПИЧ В ПТИЦУ: {throw}. В чайку бросай в прыжке: {jump}, затем {throw}', cnt };
      }
      return null;
    }
    drawUI(c) {
      const p = this.live && this.step && !Scene.dialog ? this.prompt() : null;
      if (!p) return;
      if (this.step === 'birds') Game.drawHUD(c, this.pl, this.world);
      const lines = G.wrap(Game.fmtHint(p.text), 440, 8);
      const bw = 460, bh = 20 + lines.length * 12 + (p.cnt ? 22 : 4), bx = (W - bw) / 2, by = 44;
      Art.R(c, bx - 2, by - 2, bw + 4, bh + 4, '#111'); Art.R(c, bx, by, bw, bh, 'rgba(30,34,40,0.92)'); Art.R(c, bx, by, bw, 2, '#c8a020');
      G.text('ЭКЗАМЕН ПО ТЕХНИКЕ БЕЗОПАСНОСТИ', W / 2, by + 6, { align: 'center', size: 8, color: '#ffd84a' });
      lines.forEach((l, i) => G.text(l, W / 2, by + 19 + i * 12, { align: 'center', color: '#f0e8c8' }));
      if (p.cnt) G.text(p.cnt, W / 2, by + 22 + lines.length * 12, { align: 'center', size: 12, color: '#8cf08c', outline: true });
      // клавиши над головой Валеры
      const total = Game.capsWidth(p.caps);
      let kx = Math.round(U.clamp(this.pl.x - total / 2, 6, W - total - 6));
      const ky = Math.round(Math.max(by + bh + 8, this.pl.y - 118));
      for (const k of p.caps) kx += G.keycap(c, kx, ky, k, 1) + 2;
      G.text('Esc — пропустить обучение', W - 8, H - 12, { align: 'right', size: 8, color: 'rgba(255,255,255,0.5)' });
    }
  };

  // ---------- сценарий (вставка в L1.sceneIntro) ----------
  L1.tutScene = function* (st, v, FL) {
    const T = st.tut, y = T.yurik, pl = T.pl;
    Sound.play('stomp');
    yield* Scene.moveTo(y, v.x + 96, 85, 'walk');
    y.facing = -1; v.facing = 1; y.setAnim('point');
    yield* Scene.say('yurik1', 'Валера! Ты не сдал экзамен по технике безопасности. Давай проверим твои колени — присядь 10 раз!', y);
    y.setAnim('arms');
    T.take(v); T.maxX = y.x - 44;
    // 1. приседания
    T.begin('squat', 10);
    yield () => T.n >= T.need;
    T.stop(); Sound.play('checkpoint');
    yield 0.7;
    y.setAnim('talk');
    yield* Scene.say('yurik1', 'Колени гнутся. Годится!', y);
    yield* Scene.moveTo(y, 498, 95, 'walk');     // ящики начинаются с x 521 — Юрик стоит левее
    y.facing = -1; y.setAnim('point');
    yield* Scene.say('yurik1', 'А теперь проползи на четвереньках ко мне!', y);
    y.setAnim('arms');
    // 2. ползком до Юрика
    T.maxX = y.x - 44; T.goalX = y.x - 56;
    if (pl.x > T.goalX - 120) pl.x = T.goalX - 120;
    T.begin('crawl', 1);
    yield () => T.n >= 1;
    T.stop(); Sound.play('checkpoint');
    yield 0.6;
    y.setAnim('talk');
    yield* Scene.say('yurik1', 'Ползаешь как по уставу. Далее — подпрыгни 3 раза!', y);
    y.setAnim('arms');
    // 3. прыжки
    T.begin('jump', 3);
    yield () => T.n >= T.need && pl.onGround;
    T.stop(); Sound.play('checkpoint');
    yield 0.5;
    // 4. кирпич с крана
    Sound.play('warn');
    T.brick = { x: U.clamp(pl.x - 34, 30, W - 40), y: -20, vy: 200, r: 0, rest: false, big: true };
    yield () => T.brick.rest;
    pl.forcePose = 'scared'; pl.setAnim('scared');
    G.say(pl, '!!!', 1.0, { shout: true });
    yield 1.0;
    pl.forcePose = null;
    y.setAnim('point');
    yield* Scene.say('yurik1', 'О, кирпич! Очень кстати. Подними этот кирпич и убери этих птиц — весь цех загадили!', y);
    T.birds.forEach(b => b.startle());
    yield* Scene.moveTo(y, 500, 95, 'walk');
    y.facing = -1; y.setAnim('arms');
    // 5. птицы
    T.maxX = 584;
    T.begin('birds', 3);
    yield () => T.left === 0;
    T.stop(); Sound.play('checkpoint');
    yield 0.9;
    pl.facing = 1;
    y.setAnim('ok');
    yield* Scene.say('yurik1', 'Экзамен сдан! Допуск к работе получен. Только каску подними.', y);
    T.release(v);
    yield* Scene.moveTo(y, W + 50, 95, 'walk');
  };
})();
