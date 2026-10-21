// Уровень 9, часть 7 «БОСС СЕМЁН» (L9_TZ.md, п.7). Арена у края огромного чана с жижей.
// Семён почти неуловим и всё время движется; пули от него отскакивают. Урон — только так: по бокам висят стропы,
// дёрнуть (ВВЕРХ у стропы) -> ковш над своей половиной арены опрокидывается; попал под жижу — Семён уязвим, бей его.
// За одну серию — максимум 20% HP, затем он злится: 5 фаз, растёт агрессия (удар рукой издалека, выстрелы из руки, ракеты,
// зелёные молнии, призыв киберзаводчан и мутантов, полёт на реактивных ботинках, невидимость, дождь из жижи). Ковши наполняются не сразу.
// Финал: Семён шатается и падает в чан; Валера садится: «Что-то я проголодался.»; из чана: «Валера, я тебе не какой-то там проходнячок.»
// Арт — Flow (tools/p9/flow9s.js: l9bsem1/2, l9barena, l9bvsit -> build_l9.py: semB9, semP9, arZ9, vSit9).
(() => {
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd, LP = () => L9.PARTS.lab;
  const W = 960, GY = 330, EDGE = 880, LADLE_Y = 172, REFILL = 11, DMG_K = 0.85;
  const LADLES = [{ x: 250, sl: 44 }, { x: 610, sl: 836 }];
  const COVERS = [['crate', 150, 54, 50], ['plat', 470, 80, 56], ['barrels', 720, 52, 46]];     // кадр, центр x, ширина, высота верха
  const has = (sh, fr) => { const d = L9D[sh]; return d && (!fr || (d.n || []).includes(fr)); };
  const SH = (c, sh, fr, x, y, h, o) => { if (!has(sh, fr)) return; const [, fh] = L9.size(sh, fr); S(c, sh, fr, x, y, h / fh, o); };

  // ---------- Семён ----------
  const F = () => L9.FOES;
  let Sem = null;
  const mkSem = () => class extends F().Foe {
    constructor(M, x, y) { super(M, x, y, { sh: 'semB9', maxHp: 100, w: 18, pts: 5000 }); this.hp = 100; this.ph = 1; this.slime = 0; this.act = 'run'; this.cd = 1.6; this.tx = 200; this.fly = 0; this.vis = 1; this.invT = 0; this.ext = 0; this.dir = -1; this.sumCd = 6; }
    get h() { return this.fly > 0.5 ? 70 : 82; }
    thr() { return 100 - this.ph * 20; }
    blocks() { return this.slime <= 0 || this.dying; }      // пока не облит жижей — пули отскакивают
    hit(d, dir, kind) {
      if (this.dying || this.dead) return;
      if (this.slime <= 0) { if (kind === 'blast' || kind === 'melee') Sound.play('deflect'); return; }
      this.hp = Math.max(this.thr(), this.hp - d * DMG_K); this.fl = 0.08; if (Math.random() < 0.35) Sound.play('hit');
      if (this.hp <= this.thr()) this.enrage();
    }
    enrage() {     // серия окончена: стряхивает жижу и звереет
      const lv = LP().lv; this.slime = 0; this.ph++; G.shake(5, 0.5); Sound.play('boom', 0.6);
      if (this.ph > 5) { this.dying = 1; this.M.finish(); return; }
      this.act = 'roar'; this.stT = 0; this.cd = 1.2; this.vis = 1; this.invT = 0;
      lv.say(['', '', 'СЕМЁН ЗВЕРЕЕТ!', 'СЕМЁН ВЫЗЫВАЕТ ПОДМОГУ!', 'РЕАКТИВНЫЕ БОТИНКИ!', 'ПОСЛЕДНИЙ РЫВОК СЕМЁНА!'][this.ph] || 'СЕМЁН ЗВЕРЕЕТ!', 2);
    }
    // плечо кибер-руки и кулак
    shoulder() { return [this.x + this.dir * 12, this.y - 56 - this.fly * 0]; }
    fist() { const [sx, sy] = this.shoulder(); return [sx + this.dir * this.ext, sy]; }
    pick(P) {     // выбор атаки по фазе
      const ph = this.ph, L = [['punch', 3], ['bolt', 3]];
      if (ph >= 2) L.push(['rocket', 3], ['dash', 2]);
      if (ph >= 3) L.push(['light', 3]);
      if (ph >= 3 && this.sumCd <= 0 && P.foes.filter(f => !f.dead && f !== this).length < 2) L.push(['summon', 4]);
      if (ph >= 4) L.push(['fly', 3], ['invis', this.invT > 0 ? 0 : 2]);
      if (ph >= 5) L.push(['rain', 3]);
      let s = L.reduce((a, b) => a + b[1], 0) * Math.random(); for (const [n, w] of L) { s -= w; if (s <= 0) return n; } return 'bolt';
    }
    update(dt, P, lv) {
      this.t += dt; this.stT += dt; this.fl -= dt; this.sumCd -= dt; if (this.invT > 0) { this.invT -= dt; this.vis = this.invT > 0 ? 0.14 + Math.abs(Math.sin(this.t * 9)) * 0.1 : 1; }
      if (this.dying || this.M.cut) return;
      const M = this.M, sp = 115 + this.ph * 22, dx = P.x - this.x;
      // облит жижей: оглушён, уязвим
      if (this.slime > 0) { this.slime -= dt; this.vx = 0; this.ext = Math.max(0, this.ext - 900 * dt);
        if (this.fly > 0) { this.fly = Math.max(0, this.fly - dt * 2.5); }
        if (this.slime <= 0) { this.act = 'roar'; this.stT = 0; this.cd = 0.8; lv.say('СЕМЁН СТРЯХНУЛ ЖИЖУ', 1.4); }
        this.y = GY; return; }
      const a = this.act;
      if (a === 'roar') { this.vx = 0; if (this.stT > 0.9) this.act = 'run'; }
      else if (a === 'run') {
        if (Math.abs(this.tx - this.x) < 12 || this.stT > 2.6) { this.tx = clamp(P.x + (Math.random() < 0.5 ? -1 : 1) * rnd(140, 320), 60, EDGE - 30); this.stT = 0;
          const lz = M.lad.find(l => l.st === 'full' && Math.abs(P.x - l.sl) < 40); if (lz && Math.abs(this.tx - (lz.x + 22)) < 80 && Math.random() < 0.12 + this.ph * 0.08) this.tx = clamp(lz.x + 22 + (this.tx < lz.x + 22 ? -130 : 130), 60, EDGE - 30); }
        this.vx = Math.sign(this.tx - this.x) * sp; this.dir = Math.sign(this.vx) || this.dir;
        this.cd -= dt; if (this.cd <= 0) { this.act = this.pick(P); this.stT = 0; this.shot = 0; this.dir = dx < 0 ? -1 : 1; }
      }
      else if (a === 'punch') {     // кибер-рука вылетает вперёд на тросе, бьёт издалека
        this.vx = 0; const reach = 230 + this.ph * 15, T0 = 0.35;
        if (this.stT < T0) this.ext = 0; else if (this.stT < T0 + 0.32) this.ext = Math.min(reach, (this.stT - T0) * 900); else if (this.stT < T0 + 0.5) this.ext = reach; else this.ext = Math.max(0, this.ext - 800 * dt);
        if (this.stT > T0 && !this.shot) { const [fx, fy] = this.fist(), bx = P.box(); if (fx > bx[0] - 8 && fx < bx[0] + bx[2] + 8 && fy > bx[1] - 8 && fy < bx[1] + bx[3] + 8) { this.shot = 1; P.hurt(12, this.x); G.shake(3, 0.2); Sound.play('punch'); } }
        if (this.stT > T0 + 0.9) this.done();
      }
      else if (a === 'bolt') { this.vx = 0;
        if (this.stT > 0.4 && !this.shot) { this.shot = 1; const [sx, sy] = this.fist(), ang = Math.atan2(P.y - 40 - sy, P.x - sx), n = this.ph >= 3 ? 3 : 1;
          for (let i = 0; i < n; i++) { const a2 = ang + (i - (n - 1) / 2) * 0.16; M.eb(sx + this.dir * 30, sy, Math.cos(a2) * 300, Math.sin(a2) * 300, { kind: 'bolt', dmg: 7 }); } Sound.play('zap', 0.5); }
        if (this.stT > 0.8) this.done(); }
      else if (a === 'rocket') { this.vx = 0;
        if (this.stT > 0.45 && this.shot < (this.ph >= 4 ? 2 : 1) && this.stT > 0.45 + this.shot * 0.35) { this.shot++; const [sx, sy] = this.fist(); M.eb(sx + this.dir * 40, sy, this.dir * 170, -60, { kind: 'rocket', dmg: 12, home: 1, life: 4 }); Sound.play('throw', 0.6); }
        if (this.stT > 1.3) this.done(); }
      else if (a === 'dash') {     // рывок сквозь Валеру
        this.vx = this.dir * (330 + this.ph * 20); if (!this.shot && Math.abs(P.x - this.x) < 26 && Math.abs(P.y - this.y) < 60) { this.shot = 1; P.hurt(12, this.x); }
        if (this.stT > 0.6 || this.x <= 60 || this.x >= EDGE - 30) this.done(); }
      else if (a === 'light') { this.vx = 0;     // зелёные молнии туда, где Валера
        if (!this.shot && this.stT > 0.5) { this.shot = 1; for (let i = 0; i < 3; i++) M.strikes.push({ x: clamp(P.x + (i - 1) * 70 * (Math.random() < 0.5 ? 1 : -1), 30, EDGE - 10), t: -i * 0.35 }); Sound.play('zap'); }
        if (this.stT > 1.1) this.done(); }
      else if (a === 'summon') { this.vx = 0;
        if (!this.shot && this.stT > 0.6) { this.shot = 1; this.sumCd = 16; const kinds = this.ph >= 5 ? ['Crawl', 'Spit'] : ['Hat', 'Arm'];
          kinds.forEach((k, i) => { const x = i ? EDGE - 60 : 60; const f = new (F()[k])(M, x, GY); f.dir = i ? -1 : 1; P.foes.push(f); }); Sound.play('warn', 0.6); lv.say(this.ph >= 5 ? 'МУТАНТЫ!' : 'КИБЕРЗАВОДЧАНЕ!', 1.4); }
        if (this.stT > 1.2) this.done(); }
      else if (a === 'fly') {     // взлёт на реактивных ботинках, пролёт над ареной с выстрелами вниз
        const T = this.stT; this.fly = T < 0.5 ? T / 0.5 : T < 3.2 ? 1 : Math.max(0, 1 - (T - 3.2) / 0.5);
        this.vx = T > 0.5 && T < 3.2 ? this.dir * 190 : 0; if (this.x <= 70 || this.x >= EDGE - 40) this.dir = -this.dir;
        if (T > 0.6 && T < 3.2 && (T * 2 | 0) !== (this.lastB | 0)) { this.lastB = T * 2; M.eb(this.x, this.y - 10, (P.x - this.x) * 0.5, 260, { kind: 'bolt', dmg: 8 }); Sound.play('zap', 0.3); }
        if (T > 3.7) { this.fly = 0; this.done(); } }
      else if (a === 'invis') { this.invT = 4.5; Sound.play('zap', 0.4); this.done(); }
      else if (a === 'rain') { this.vx = 0;     // дождь из жижи по всей арене (тени-предупреждения)
        if (!this.shot && this.stT > 0.5) { this.shot = 1; for (let i = 0; i < 16; i++) M.drops.push({ x: rnd(30, EDGE - 10), t: -i * 0.18 - 0.6, y: -40 }); M.drops.push({ x: P.x, t: -0.7, y: -40 }); }
        if (this.stT > 1.0) this.done(); }
      // движение (по земле или в воздухе)
      this.x = clamp(this.x + this.vx * dt, 40, EDGE - 24);
      this.y = GY - this.fly * 120;
    }
    done() { this.act = 'run'; this.stT = 0; this.cd = Math.max(0.35, 1.5 - this.ph * 0.22) + rnd(0, 0.5); this.ext = 0; }
    draw(c) {
      if (this.gone) return;
      const t = this.t, a = this.act; let fr = 'r' + ((t * 11 | 0) % 4);
      if (this.dying) fr = this.M.semFr || 'stagger';
      else if (this.slime > 0) fr = this.slime > 2 ? 'slimed' : 'kneel';
      else if (this.fly > 0.05) fr = (t * 8 | 0) % 2 ? 'fly0' : 'fly1';
      else if (a === 'roar') fr = 'laugh';
      else if (a === 'punch') fr = this.stT < 0.35 ? 'aim' : 'armOff';
      else if (a === 'bolt') fr = 'aim';
      else if (a === 'rocket') fr = this.stT > 0.4 ? 'fireR' : 'aim';
      else if (a === 'dash') fr = 'dash';
      else if (a === 'light' || a === 'rain' || a === 'summon') fr = a === 'summon' ? 'laugh' : 'sky';
      else if (!this.vx) fr = 'laugh';
      const o = { flip: this.dir < 0, a: this.vis, rot: this.M.semRot || 0 };
      if (!this.dying && this.fly < 0.05) S(c, 'props8', 'shadow', this.x, GY + 1, 0.8, { a: 0.4 * this.vis });
      SH(c, 'semB9', fr, this.x, this.y + 1 + (this.M.semDy || 0), fr === 'kneel' ? 66 : fr.startsWith('fly') ? 80 : 86, o);
      if (this.fl > 0) SH(c, 'semB9', fr, this.x, this.y + 1 + (this.M.semDy || 0), fr === 'kneel' ? 66 : fr.startsWith('fly') ? 80 : 86, Object.assign({}, o, { add: 1, a: 0.5 }));
      if (this.fly > 0.05) for (const s of [-6, 8]) SH(c, 'semP9', 'jet', this.x + s * this.dir, this.y + 18 + Math.sin(t * 30) * 2, 22 + Math.sin(t * 40) * 4, { add: 1, a: this.vis });
      // кибер-рука на тросе: сегменты поршня от плеча до кулака
      if (this.ext > 4 && has('semP9', 'seg')) { const [sx, sy] = this.shoulder(), [segW] = L9.size('semP9', 'seg'), k = 9 / L9.size('semP9', 'seg')[1], sw = segW * k;
        for (let d = 10; d < this.ext - 8; d += sw - 2) S(c, 'semP9', 'seg', sx + this.dir * (d + sw / 2), sy, k, { flip: this.dir < 0, a: this.vis });
        const [fx, fy] = this.fist(); SH(c, 'semP9', this.stT < 0.75 ? 'fistO' : 'fistC', fx, fy + 10, 20, { flip: this.dir < 0, a: this.vis }); }
      // облит жижей: капли стекают
      if (this.slime > 0 && (t * 10 | 0) % 3 === 0) LP().fx.push({ sh: 'semP9', fr: ['drop'], x: this.x + rnd(-14, 14), y: this.y - rnd(20, 70), vx: 0, vy: 40, g: 400, s: 0.12, life: 0.4 });
    }
  };

  L9.MAPS.semen = () => {
    const LM = L9.MAPS.lab();
    const M = {
      x0: 0, x1: W, y0: -40, y1: 400, killY: 900,
      solids: [[0, GY, EDGE, 140, 'hide'], [-40, -300, 40, 900, 'hide'], [W, -300, 40, 900, 'hide']],
      walks: COVERS.map(([fr, x, w, h]) => Object.assign([x - w / 2, GY - h, w], { thru: 1, own: 1 })), ladders: [], cks: [[120, GY]], picks: [],
    };
    M.killAt = x => x > EDGE ? GY + 40 : M.killY;
    M.dmgK = 0.75;     // долгий бой: урон по Валере x0.75
    M.camY = gy => gy - 262;
    M.init = (P, lv, ck) => {
      if (!Sem) Sem = mkSem();
      G.portraits = G.portraits || {};
      for (const k of ['semen', 'semen2']) if (!G.portraits[k]) G.loadImage('assets/spr/p_' + k + '.png').then(im => G.portraits[k] = im, () => {});
      M.t = 0; M.strikes = []; M.drops = []; M.lad = LADLES.map(l => ({ ...l, st: 'full', t: 0, pull: 0 })); M.cut = 1; M.sitFr = null; M.semRot = 0; M.semDy = 0;
      M.boss = new Sem(M, 700, GY); P.foes.push(M.boss);
      M.picks = [['kefir', 470, GY - 56], ['rocket', 150, GY - 50]].map(([kind, x, y]) => ({ kind, x, y, t: 0 })); M.pickT = 25;
      P.x = 120; P.dir = 1;
    };
    // вражеские снаряды Семёна (рисуются листом semP9)
    M.eb = (x, y, vx, vy, o) => LP().ebul.push(Object.assign({ x, y, vx, vy, t: 0, dmg: 10, s: 1,
      draw: (c, e) => { const fr = e.kind === 'rocket' ? 'rocket' : 'bolt'; SH(c, 'semP9', fr, e.x, e.y, fr === 'rocket' ? 12 : 16, { rot: Math.atan2(e.vy, e.vx), add: fr === 'bolt' ? 1 : 0 }); },
      onLand: e => { LP().fx.push({ sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2'], x: e.x, y: e.y - 6, s: e.kind === 'rocket' ? 0.5 : 0.25, life: 0.3, add: 1 }); } }, o));
    // ---------- сцены ----------
    M.introScript = function* () {
      const P = LP(), D = 0.016, b = M.boss; Scene.dialogTop = true; P.st = 'stand';
      b.act = 'roar'; b.stT = 0; yield 0.4; M.camT = 320; G.shake(3, 0.5); Sound.play('boom', 0.5); yield 1.2; M.camT = null;
    };
    M.finish = () => { Scene.run(M.endScript, () => LP().lv.next()); };
    M.endScript = function* () {     // Семён шатается и падает в чан; Валера садится на пол
      const P = LP(), D = 0.016, b = M.boss; M.cut = 1; Scene.dialogTop = true; P.foes = P.foes.filter(f => f === b); P.ebul = []; M.strikes = []; M.drops = [];
      b.fly = 0; b.y = GY; b.vis = 1; b.ext = 0; b.dir = 1; M.camT = W - 640;
      const spd = Math.max(70, (EDGE - 4 - b.x) / 2.4); for (let t = 0; t < 4 && b.x < EDGE - 4; t += D) { b.x += spd * D; M.semRot = Math.sin(t * 9) * 0.16; M.semFr = (t * 4 | 0) % 2 ? 'stagger' : 'kneel'; yield D; }
      M.semFr = 'stagger'; Sound.play('shout'); let vy = -120;
      for (let t = 0; t < 1.4; t += D) { vy += 900 * D; b.x += 60 * D; M.semDy += vy * D; M.semRot += 3 * D; yield D; if (M.semDy > 140) break; }
      b.gone = true; Sound.play('stomp'); G.shake(6, 0.6);
      for (let i = 0; i < 10; i++) P.fx.push({ sh: 'fxZ9', fr: ['sp1', 'sp0'], x: b.x + rnd(-40, 40), y: GY + 30, vx: rnd(-60, 60), vy: rnd(-260, -120), g: 700, s: rnd(0.4, 0.8), life: 0.9 });
      yield 1.0; M.camT = 160;
      P.st = 'run'; P.dir = 1; while (P.x < 520) { P.x += 110 * D; yield D; } while (P.x > 530) { P.x -= 110 * D; yield D; }
      P.st = 'stand'; yield 0.4; P.hide = 1; M.sitFr = 'sit'; Sound.play('land'); yield 1.0; M.sitFr = 'belly';
      yield* Scene.say('valera', 'Что-то я проголодался.', null);
      M.boil = 1; Sound.play('thunder'); G.shake(5, 1.6); yield 0.8; M.sitFr = 'look'; M.camT = W - 640;
      yield* Scene.say('semen2', 'Валера, я тебе не какой-то там проходнячок.', null);
      yield 0.6;
    };
    M.cutUpdate = (dt, P) => { P.t += dt; M.t += dt; M.mech(dt, P, true);
      if (M.camT != null) P.cam.x += (clamp(M.camT, 0, W - 640) - P.cam.x) * Math.min(1, dt * 2.5); else P.camera(dt); P.updFx(dt); };
    // ---------- механика арены ----------
    M.mech = (dt, P, cut) => {
      for (const l of M.lad) { l.t += dt; l.pull -= dt;
        if (l.st === 'pour') { const zx = l.x + 22, b = M.boss;
          if (!cut && b && !b.dying && b.slime <= 0 && l.t < dt * 1.5 && Math.abs(b.x - zx) < 90 && Math.random() < 0.1 + b.ph * 0.06) { b.act = 'dash'; b.stT = 0; b.shot = 1; b.dir = b.x < zx ? -1 : 1; b.fly = 0; }     // почти неуловим: отскакивает из-под струи
          if (!cut && b && !b.dying && b.slime <= 0 && Math.abs(b.x - zx) < 46 && l.t > 0.15) { b.slime = 5.6 - b.ph * 0.4; b.act = 'run'; b.ext = 0; Sound.play('stomp'); LP().lv.say('ОБЛИТ ЖИЖЕЙ! БЕЙ!', 1.6); }
          if (!cut && Math.abs(P.x - zx) < 30 && l.t > 0.15) P.hurt(6, zx);
          if ((l.t * 12 | 0) % 2) P.fx.push({ sh: 'fxZ9', fr: ['sp1'], x: zx + rnd(-16, 16), y: GY - 4, s: 0.45, life: 0.3 });
          if (l.t > 1.5) { l.st = 'empty'; l.t = 0; } }
        else if (l.st === 'empty' && l.t > REFILL) { l.st = 'full'; l.t = 0; Sound.play('confirm', 0.4); } }
      for (const s of M.strikes) { s.t += dt; if (!cut && s.t > 0.7 && s.t < 0.95 && Math.abs(P.x - s.x) < 18) P.hurt(12, s.x); if (s.t > 0.7 && s.t - dt <= 0.7) { Sound.play('zap', 0.6); G.shake(2, 0.15); } }
      M.strikes = M.strikes.filter(s => s.t < 1.0);
      for (const d of M.drops) { d.t += dt; if (d.t > 0) { d.y += (300 + d.t * 600) * dt; if (d.y > GY - 4) { d.dead = 1; P.fx.push({ sh: 'fxZ9', fr: ['sp0', 'sp1'], x: d.x, y: GY - 4, s: 0.4, life: 0.35 }); if (!cut && Math.abs(P.x - d.x) < 16) P.hurt(6, d.x); } } }
      M.drops = M.drops.filter(d => !d.dead);
      // самонаводка ракет
      for (const e of P.ebul) if (e.home && e.t > 0.3 && e.t < 2.4) { const ang = Math.atan2(P.y - 40 - e.y, P.x - e.x), sp = Math.hypot(e.vx, e.vy) + 140 * dt, cur = Math.atan2(e.vy, e.vx); let da = ang - cur; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; const na = cur + clamp(da, -2.2 * dt, 2.2 * dt); e.vx = Math.cos(na) * Math.min(330, sp); e.vy = Math.sin(na) * Math.min(330, sp); }
    };
    M.update = (dt, P, lv) => {
      M.t += dt;
      if (M.cut === 1 && !M.started) { M.started = 1; Scene.run(M.introScript, () => { M.cut = 0; lv.say('ДЁРНИ СТРОПУ — ОБЛЕЙ СЕМЁНА ЖИЖЕЙ!', 3); }); return; }
      M.mech(dt, P, false);
      // стропы: подойти и нажать ВВЕРХ
      for (const l of M.lad) if (Math.abs(P.x - l.sl) < 24 && P.onG) {
        if (l.st === 'full') { P.hintAt('ВВЕРХ — ДЁРНУТЬ СТРОПУ', 0.3); if (G.Input.pressed('up')) { l.st = 'pour'; l.t = 0; l.pull = 0.5; Sound.play('clank'); Sound.play('stomp', 0.5); } }
        else P.hintAt('КОВШ НАПОЛНЯЕТСЯ...', 0.3); }
      for (const k of M.picks) { k.t += dt; if (!k.dead && Math.abs(P.x - k.x) < 22 && Math.abs(P.y - k.y) < 40) LM.take(k, P, lv); }
      M.picks = M.picks.filter(k => !k.dead);
      M.pickT -= dt; if (M.pickT <= 0 && M.picks.length < 2) { M.pickT = 16; M.picks.push({ kind: ['kefir', 'grenades', 'plasma', 'pies'][rnd(0, 4) | 0], x: [150, 470, 720][rnd(0, 3) | 0], y: GY - 60, t: 0 }); }
    };
    M.hazAt = () => null;
    M.shootProps = () => {};
    M.blast = () => {};
    // ---------- отрисовка ----------
    const haze = (c, a) => { c.fillStyle = 'rgba(3,10,6,' + a + ')'; c.fillRect(0, 0, 640, 360); };
    const strip = (c, im, y, h, x0, x1) => { if (!im) return; const w = im.width * h / im.height; for (let x = Math.floor(x0 / w) * w; x < x1; x += w) c.drawImage(im, Math.floor(x), Math.round(y), Math.ceil(w) + 1, h); };
    M.drawBack = (c, cx, cy) => {
      c.fillStyle = '#030805'; c.fillRect(0, 0, 640, 360); const fy = GY - cy, t = M.t;
      const fim = L9.img.zFar; if (fim) { const h = fim.height / 2, w = fim.width / 2, y = clamp(-20 - cy * 0.05, 360 - h, 0); for (let x = -((cx * 0.1 % w) + w) % w; x < 640; x += w) c.drawImage(fim, Math.floor(x), Math.round(y), Math.ceil(w) + 1, h); }
      haze(c, 0.14);
      for (let i = 0; i < 5; i++) { const X = ((i * 210 - cx * 0.2) % 1050 + 1050) % 1050 - 100, u = ((t * 0.12 + i * 0.37) % 1); S(c, 'fxZ9', 'sm0', X, fy - 110 - u * 200, 0.9 + u, { a: 0.22 * (1 - u) }); }
      const mim = L9.img.zMid; if (mim) { const h = 240, w = mim.width * h / mim.height; for (let x = -((cx * 0.4 % w) + w) % w; x < 640; x += w) c.drawImage(mim, Math.floor(x), Math.round(fy - 6 - h), Math.ceil(w) + 1, h); }
      haze(c, 0.24);
    };
    M.drawMid = (c, P) => {
      const x0 = P.cam.x - 200, x1 = P.cam.x + 840, t = M.t;
      strip(c, L9.img.zCeil, -60, 110, x0, x1);
      // чан у правого края арены
      if (has('vatZ9', 'vat')) { const [vw, vh] = L9.size('vatZ9', 'vat'), k = 300 / vw, cx2 = EDGE + 110; S(c, 'vatZ9', 'vat', cx2, GY + 26 + vh * k * 0.97, k);
        for (let i = 0; i < (M.boil ? 8 : 3); i++) { const u = (t * (M.boil ? 1.6 : 0.7) + i * 0.29) % 1; S(c, 'fxZ9', 'sp0', cx2 - 110 + i * 30 + Math.sin(i * 5 + t) * 10, GY + 30 - u * (M.boil ? 30 : 8), 0.35 + u * 0.3, { a: 1 - u, add: 1 }); } }
      // пол
      c.save(); c.beginPath(); c.rect(-100, -400, EDGE + 100, 1200); c.clip(); strip(c, L9.img.zFloor, GY - 12, 64, x0, Math.min(x1, EDGE + 10)); c.restore();
      // стропы и ковши
      for (const l of M.lad) {
        if (has('arZ9', 'sling')) { const fr = l.pull > 0 ? 'slingPull' : 'sling', [sw, sh] = L9.size('arZ9', fr), k = 14 / sw, bot = GY - 34 + (l.pull > 0 ? 10 : 0); S(c, 'arZ9', fr, l.sl, bot, k, { sy: (bot + 40) / (sh * k) });
          if (l.st === 'full' && Math.abs(P.x - l.sl) < 60) S(c, 'fxL9', 'spark', l.sl, bot - 6, 0.5 + Math.sin(t * 6) * 0.1, { add: 1, a: 0.6 }); }
        const fr = l.st === 'pour' ? 'ladleTilt' : l.st === 'empty' ? 'ladleEmpty' : 'ladle';
        SH(c, 'arZ9', fr, l.x, LADLE_Y, 128);
        if (l.st === 'pour' && has('vatZ9', 'spout')) { const [spw, sph] = L9.size('vatZ9', 'spout'), k = 34 / spw, top = LADLE_Y - 30, len = GY - top, zx = l.x + 22;
          c.save(); c.beginPath(); c.rect(zx - 30, top, 60, len + 4); c.clip(); S(c, 'vatZ9', 'spout', zx, GY + 4, k, { sy: len / (sph * k * 0.55) }); c.restore(); }
        if (l.st === 'empty') { const q = clamp(l.t / REFILL, 0, 1); G.text(Math.ceil(REFILL - l.t) + '', l.sl, GY - 120, { align: 'center', size: 8, color: '#7fe0c0', outline: true }); }
      }
      // укрытия: на них можно запрыгнуть
      for (const [fr, x, w, h] of COVERS) SH(c, 'arZ9', fr, x, GY + 2, h + 4);
      // молнии: метка на полу, затем разряд сверху
      for (const s of M.strikes) { if (s.t < 0) continue; if (s.t < 0.7) { if ((t * 14 | 0) % 2) S(c, 'fxZ9', 'sp0', s.x, GY - 4, 0.3 + s.t * 0.4, { add: 1 }); }
        else if (has('semP9', 'light')) { const [, lh] = L9.size('semP9', 'light'), k = 26 / L9.size('semP9', 'light')[0]; S(c, 'semP9', 'light', s.x, GY + 2, k, { add: 1, sy: (GY + 30) / (lh * k), flip: (t * 20 | 0) % 2 }); } }
      // дождь из жижи: тень-предупреждение и капля
      for (const d of M.drops) { if (d.t < 0) { if (d.t > -0.6) S(c, 'props8', 'shadow', d.x, GY + 1, 0.4 + (0.6 + d.t), { a: 0.5 }); continue; } SH(c, 'semP9', 'drop', d.x, d.y, 18); S(c, 'props8', 'shadow', d.x, GY + 1, 0.5, { a: 0.5 }); }
      // Валера сидит (финал)
      if (M.sitFr) SH(c, 'vSit9', M.sitFr, P.x, GY + 2, 56);
      for (const k of M.picks) { const bob = Math.sin(k.t * 4) * 2; if (k.kind === 'pelmeni' || k.kind === 'kefir' || k.kind === 'pies') Art.item(c, k.kind, k.x, k.y - 14 + bob, 0, 1); else { S(c, 'fxL9', 'spark', k.x, k.y - 14, 0.4, { add: 1 }); S(c, 'pick9', k.kind, k.x, k.y - 16 + bob, 1); } }
    };
    M.drawFront = () => {};
    M.drawOver = () => {};
    M.drawHud = (c) => {     // шкала Семёна: 5 серий
      const b = M.boss; if (!b || M.cut === 1 && !M.started) return;
      const x = 170, y = 330, w = 300; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x - 4, y - 14, w + 8, 26);
      G.text('СЕМЁН', x, y - 11, { size: 8, color: b.slime > 0 ? '#7fff7f' : '#ff7070' });
      c.fillStyle = '#300'; c.fillRect(x, y, w, 7); c.fillStyle = b.slime > 0 ? '#5f5' : '#d33'; c.fillRect(x, y, w * Math.max(0, b.hp) / 100, 7);
      c.fillStyle = '#000'; for (let i = 1; i < 5; i++) c.fillRect(x + w * i / 5 - 1, y, 2, 7);
    };
    return M;
  };

  L9.PARTS.semen = {
    deathText: 'СЕМЁН ОКАЗАЛСЯ СИЛЬНЕЕ',
    get hp() { return LP().hp; }, set hp(v) { LP().hp = v; },
    get inv() { return LP().inv; }, set inv(v) { LP().inv = v; },
    start(lv, ck) { LP().start(lv, ck, 'semen'); },
    onDie(lv) { LP().onDie(lv); },
    deadUpdate(lv, dt) { LP().deadUpdate(lv, dt); },
    update(lv, dt) { LP().update(lv, dt); },
    cutUpdate(lv, dt) { const P = LP(); P.M.cutUpdate && P.M.cutUpdate(dt, P); },
    draw(lv, c) { LP().draw(lv, c); },
    drawHud(lv, c) { LP().drawHud(lv, c); },
  };
  if (!L9.ORDER.includes('semen')) L9.ORDER.push('semen');
})();
