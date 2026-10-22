// Уровень 9, часть 7 «БОСС СЕМЁН» v2 (2026-10-22, по заданию владельца): небольшая арена над котлом.
// Два стальных пирса по краям, посередине — мостик над огромным котлом с жижей; между мостиком и пирсами узкие щели.
// Упал в котёл — Валера сразу растворяется (смерть). По краям пирсов висят стропы: ВВЕРХ у стропы -> ковш над пирсом
// наклоняется и выливает жижу; Семён под струёй — облит и уязвим. Ковши наполняются по трубам (видно, как растёт уровень).
// Семён с самого начала применяет все способности; с каждой фазой (5 фаз) быстрее, чаще и злее.
// Фон: дальний зал (kFar), средний план с котлами (kMid): капсулы с людьми едут по монорельсу и сбрасываются в котлы,
// жижа стекает из котла в котёл, пар, густая дымка. Арт — Flow (l9kfar/kmid/kcap/kfx/kbridge/kvat/kladle/ksling/ksem).
// Финал: Семён шатается и падает в котёл; Валера садится: «Что-то я проголодался.»; из котла: «Валера, я тебе не какой-то там проходнячок.»
(() => {
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd, LP = () => L9.PARTS.lab;
  const W = 720, GY = 330, BR0 = 104, BR1 = 424, LAD_X = 22, VAT_X0 = 92, REFILL = 9, DMG_K = 0.85;     // схема владельца: слева бетонный пол с лестницей, мостик на опорах над котлом, справа — открытый котёл
  const LAD_H = 125, LAD_TOP = GY - 215, LAD_LIP = 31;     // ковш: высота кадра, верх (крюк), смещение струи от центра
  const LADLES = [{ x: 161, sl: 119 }, { x: 325, sl: 384 }];
  const MID_H = 250, MK = MID_H / 768;     // средний план: высота слоя и масштаб пикселей исходника
  const MID_VATS = [[273, 340], [685, 169], [1110, 374]], MID_CASC = [[268, 540], [1107, 560]], MID_W = 1236;
  const has = (sh, fr) => { const d = L9D[sh]; return d && (!fr || (d.n || []).includes(fr)); };
  const SH = (c, sh, fr, x, y, h, o) => { if (!has(sh, fr)) return; const [, fh] = L9.size(sh, fr); S(c, sh, fr, x, y, h / fh, o); };
  const SW = (c, sh, fr, x, y, w, o) => { if (!has(sh, fr)) return; const [fw] = L9.size(sh, fr); S(c, sh, fr, x, y, w / fw, o); };
  const inPit = x => x > BR1 + 2;     // за краем мостика — открытый котёл
  const overPit = inPit;
  let Sem = null, PH_SAVE = 1, KEEP = 0;     // после смерти бой продолжается с достигнутой фазы
  const F = () => L9.FOES;

  // ---------- Семён ----------
  const mkSem = () => class extends F().Foe {
    constructor(M, x, y) { super(M, x, y, { sh: 'semB9', maxHp: 100, w: 18, pts: 5000 }); this.hp = 100; this.ph = 1; this.slime = 0; this.slT = 0; this.act = 'run'; this.cd = 1.0; this.tx = 200; this.fly = 0; this.vis = 1; this.invT = 0; this.ext = 0; this.dir = -1; this.sumCd = 5; this.auraT = 0; this.hop = 0; }
    get h() { return this.fly > 0.5 ? 70 : 82; }
    thr() { return 100 - this.ph * 20; }
    blocks() { return this.slime <= 0 || this.dying; }      // пока не облит жижей — пули отскакивают
    hit(d, dir, kind) {
      if (this.dying || this.dead) return;
      if (this.slime <= 0) { if (kind === 'blast' || kind === 'melee') Sound.play('deflect'); return; }
      this.hp = Math.max(this.thr(), this.hp - d * DMG_K); this.fl = 0.08; if (Math.random() < 0.35) Sound.play('hit');
      if (this.hp <= this.thr()) this.enrage();
    }
    drench(t) { this.slime = t; this.slT = 0; this.act = 'run'; this.ext = 0; this.vx = 0; this.invT = 0; this.vis = 1; }
    enrage() {     // серия окончена: стряхивает жижу и звереет
      const lv = LP().lv; this.slime = 0; this.ph++; PH_SAVE = Math.min(5, this.ph); G.shake(5, 0.5); Sound.play('boom', 0.6);
      if (this.ph > 5) { this.dying = 1; this.M.finish(); return; }
      this.act = 'roar'; this.stT = 0; this.cd = 0.6; this.vis = 1; this.invT = 0; this.auraT = 1.1;
      lv.say(['', '', 'СЕМЁН ЗВЕРЕЕТ!', 'СЕМЁН В ЯРОСТИ!', 'СЕМЁН В БЕШЕНСТВЕ!', 'ПОСЛЕДНИЙ РЫВОК СЕМЁНА!'][this.ph] || 'СЕМЁН ЗВЕРЕЕТ!', 2);
    }
    shoulder() { return [this.x + this.dir * 12, this.y - 56]; }
    fist() { const [sx, sy] = this.shoulder(); return [sx + this.dir * this.ext, sy]; }
    pick(P) {     // все способности с первой фазы; с фазой растут вес опасных атак
      const ph = this.ph, fo = P.foes.filter(f => !f.dead && f !== this).length;
      const L = [['punch', 3], ['bolt', 3], ['rocket', 2 + ph * 0.3], ['dash', 2 + ph * 0.3], ['light', 2 + ph * 0.4], ['fly', 1.5 + ph * 0.3], ['rain', 1 + ph * 0.4],
        ['invis', this.invT > 0 ? 0 : 1 + ph * 0.2], ['summon', this.sumCd <= 0 && fo < 1 + (ph >> 1) ? 2 : 0]];
      let s = L.reduce((a, b) => a + b[1], 0) * Math.random(); for (const [n, w] of L) { s -= w; if (s <= 0) return n; } return 'bolt';
    }
    update(dt, P, lv) {
      this.t += dt; this.stT += dt; this.fl -= dt; this.sumCd -= dt; this.auraT -= dt;
      if (this.invT > 0) { this.invT -= dt; this.vis = this.invT > 0 ? 0.12 + Math.abs(Math.sin(this.t * 9)) * 0.1 : 1; }
      if (this.dying || this.M.cut) return;
      const M = this.M, ph = this.ph, sp = 130 + ph * 28, dx = P.x - this.x;
      if (this.slime > 0) { this.slime -= dt; this.slT += dt; this.vx = 0; this.ext = Math.max(0, this.ext - 900 * dt); this.fly = Math.max(0, this.fly - dt * 2.5);
        if (this.slime <= 0) { this.act = 'roar'; this.stT = 0; this.cd = 0.5; this.auraT = 0.9; lv.say('СЕМЁН СТРЯХНУЛ ЖИЖУ', 1.4); }
        this.y = GY - this.fly * 120; return; }
      const a = this.act;
      if (a === 'roar') { this.vx = 0; if (this.stT > 0.8) this.act = 'run'; }
      else if (a === 'run') {
        if (Math.abs(this.tx - this.x) < 12 || this.stT > 2.2) { this.tx = clamp(P.x + (Math.random() < 0.5 ? -1 : 1) * rnd(100, 220), 30, BR1 - 20); this.stT = 0;
          const lz = M.lad.find(l => l.st === 'full' && Math.abs(P.x - l.sl) < 50); if (lz && Math.abs(this.tx - lz.zx) < 90 && Math.random() < 0.1 + ph * 0.08) this.tx = clamp(lz.zx + (this.tx < lz.zx ? -110 : 110), 30, BR1 - 20); }
        this.vx = Math.sign(this.tx - this.x) * sp; this.dir = Math.sign(this.vx) || this.dir;
        this.cd -= dt; if (this.cd <= 0) { this.act = this.pick(P); this.stT = 0; this.shot = 0; this.dir = dx < 0 ? -1 : 1; }
      }
      else if (a === 'punch') {     // кибер-рука вылетает вперёд на тросе
        this.vx = 0; const reach = 230 + ph * 20, T0 = 0.38 - ph * 0.04;
        if (this.stT < T0) this.ext = 0; else if (this.stT < T0 + 0.3) this.ext = Math.min(reach, (this.stT - T0) * (900 + ph * 80)); else if (this.stT < T0 + 0.45) this.ext = reach; else this.ext = Math.max(0, this.ext - 800 * dt);
        if (this.stT > T0 && !this.shot) { const [fx, fy] = this.fist(), bx = P.box(); if (fx > bx[0] - 8 && fx < bx[0] + bx[2] + 8 && fy > bx[1] - 8 && fy < bx[1] + bx[3] + 8) { this.shot = 1; P.hurt(12, this.x); G.shake(3, 0.2); Sound.play('punch'); } }
        if (this.stT > T0 + 0.85) this.done();
      }
      else if (a === 'bolt') { this.vx = 0;
        const n = [1, 2, 3, 3, 5][ph - 1], vol = ph >= 4 ? 2 : 1;
        if (this.shot < vol && this.stT > 0.35 + this.shot * 0.35) { this.shot++; const [sx, sy] = this.fist(), ang = Math.atan2(P.y - 40 - sy, P.x - sx);
          for (let i = 0; i < n; i++) { const a2 = ang + (i - (n - 1) / 2) * 0.15; M.eb(sx + this.dir * 30, sy, Math.cos(a2) * (290 + ph * 20), Math.sin(a2) * (290 + ph * 20), { kind: 'bolt', dmg: 7 }); } Sound.play('zap', 0.5); }
        if (this.stT > 0.5 + vol * 0.35) this.done(); }
      else if (a === 'rocket') { this.vx = 0; const n = ph >= 4 ? 3 : ph >= 2 ? 2 : 1;
        if (this.stT > 0.4 && this.shot < n && this.stT > 0.4 + this.shot * 0.3) { this.shot++; const [sx, sy] = this.fist(); M.eb(sx + this.dir * 40, sy, this.dir * 170, -60 - this.shot * 30, { kind: 'rocket', dmg: 12, home: 1, life: 4 }); Sound.play('throw', 0.6); }
        if (this.stT > 0.5 + n * 0.3) this.done(); }
      else if (a === 'dash') {     // рывок сквозь Валеру (с 3-й фазы — туда и обратно)
        this.vx = this.dir * (340 + ph * 30); if (!this.shot && Math.abs(P.x - this.x) < 26 && Math.abs(P.y - this.y) < 60) { this.shot = 1; P.hurt(12, this.x); }
        if (this.stT > 0.6 || this.x <= 30 || this.x >= BR1 - 16) { if (ph >= 3 && !this.back) { this.back = 1; this.dir = -this.dir; this.stT = 0.15; this.shot = 0; } else { this.back = 0; this.done(); } } }
      else if (a === 'light') { this.vx = 0;     // зелёные молнии туда, где Валера
        if (!this.shot && this.stT > 0.5 - ph * 0.05) { this.shot = 1; const n = 2 + ph; for (let i = 0; i < n; i++) M.strikes.push({ x: clamp(P.x + (i - (n - 1) / 2) * 62 + rnd(-10, 10), 10, BR1), t: -i * (0.3 - ph * 0.03) }); Sound.play('zap'); }
        if (this.stT > 1.0) this.done(); }
      else if (a === 'summon') { this.vx = 0;
        if (!this.shot && this.stT > 0.6) { this.shot = 1; this.sumCd = 22 - ph * 2; const kinds = [['Hat'], ['Hat', 'Arm'], ['Arm', 'Spit'], ['Crawl', 'Spit'], ['Crawl', 'Spit', 'Hat']][ph - 1];
          kinds.forEach((k, i) => { const x = i % 2 ? BR1 - 40 : 40; const f = new (F()[k])(this.M, x, GY); f.dir = i % 2 ? -1 : 1; P.foes.push(f); }); Sound.play('warn', 0.6); lv.say(ph >= 4 ? 'МУТАНТЫ!' : 'КИБЕРЗАВОДЧАНЕ!', 1.4); }
        if (this.stT > 1.1) this.done(); }
      else if (a === 'fly') {     // взлёт на реактивных ботинках, пролёт над ареной с выстрелами вниз
        const T = this.stT, D = 2.6 + ph * 0.3, iv = 0.5 - ph * 0.05; this.fly = T < 0.5 ? T / 0.5 : T < D ? 1 : Math.max(0, 1 - (T - D) / 0.5);
        this.vx = T > 0.5 && T < D ? this.dir * (190 + ph * 15) : 0; if (this.x <= 60 || this.x >= W - 70) this.dir = this.x <= 60 ? 1 : -1;
        if (T > 0.6 && T < D && (T / iv | 0) !== this.lastB) { this.lastB = T / iv | 0; M.eb(this.x, this.y - 10, (P.x - this.x) * 0.5, 260, { kind: 'bolt', dmg: 8 }); Sound.play('zap', 0.3); }
        if (T > D + 0.5) { this.fly = 0; this.done(); } }
      else if (a === 'invis') { this.invT = 2 + ph * 0.6; Sound.play('zap', 0.4); this.done(); this.cd = 0.2; }
      else if (a === 'rain') { this.vx = 0;     // дождь из жижи по всей арене (тени-предупреждения)
        if (!this.shot && this.stT > 0.5) { this.shot = 1; const n = 8 + ph * 4; for (let i = 0; i < n; i++) M.drops.push({ x: rnd(10, W - 60), t: -i * (0.2 - ph * 0.02) - 0.6, y: -40 }); M.drops.push({ x: P.x, t: -0.7, y: -40 }); }
        if (this.stT > 0.9) this.done(); }
      this.x = this.fly > 0.3 ? clamp(this.x + this.vx * dt, 24, W - 40) : clamp(this.x + this.vx * dt, 24, BR1 - 12);     // по земле — только пол и мостик; над котлом — лишь в полёте
      if (this.fly < 0.3 && this.x > BR1 - 12) this.x = Math.max(BR1 - 12, this.x - 300 * dt);
      this.y = GY - this.fly * 120 - this.hop * 18;
    }
    done() { this.act = 'run'; this.stT = 0; this.cd = Math.max(0.15, 1.25 - this.ph * 0.22) + rnd(0, 0.35); this.ext = 0;
      if (this.ph >= 3 && Math.random() < 0.12 * (this.ph - 2)) this.cd = 0.05; }     // с 3-й фазы атаки идут сериями
    draw(c) {
      if (this.gone) return;
      const t = this.t, a = this.act; let fr = 'r' + ((t * (11 + this.ph) | 0) % 4), sh = 'semB9', hh = 86;
      if (this.dying) fr = this.M.semFr || 'stagger';
      else if (this.slime > 0) { sh = 'kSem9'; fr = this.slT < 0.55 ? 'pourHit' : this.slime > 1.6 ? 'drench' : 'kneelS'; hh = fr === 'pourHit' ? 122 : fr === 'kneelS' ? 70 : 88; }
      else if (this.auraT > 0) { sh = 'kSem9'; fr = 'aura'; hh = 88; }
      else if (this.fly > 0.05) fr = (t * 8 | 0) % 2 ? 'fly0' : 'fly1';
      else if (a === 'roar') fr = 'laugh';
      else if (a === 'punch') fr = this.stT < 0.3 ? 'aim' : 'armOff';
      else if (a === 'bolt') fr = 'aim';
      else if (a === 'rocket') fr = this.stT > 0.4 ? 'fireR' : 'aim';
      else if (a === 'dash') fr = 'dash';
      else if (a === 'light' || a === 'rain' || a === 'summon') fr = a === 'summon' ? 'laugh' : 'sky';
      else if (!this.vx) fr = 'laugh';
      if (sh === 'semB9') hh = fr === 'kneel' ? 66 : fr.startsWith('fly') ? 80 : 86;
      const o = { flip: this.dir < 0, a: this.vis, rot: this.M.semRot || 0 };
      if (!this.dying && this.fly < 0.05 && !overPit(this.x)) S(c, 'props8', 'shadow', this.x, GY + 1, 0.8, { a: 0.4 * this.vis });
      SH(c, sh, fr, this.x, this.y + 1 + (this.M.semDy || 0), hh, o);
      if (this.fl > 0) SH(c, sh, fr, this.x, this.y + 1 + (this.M.semDy || 0), hh, Object.assign({}, o, { add: 1, a: 0.5 }));
      if (this.fly > 0.05) for (const s of [-6, 8]) SH(c, 'semP9', 'jet', this.x + s * this.dir, this.y + 18 + Math.sin(t * 30) * 2, 22 + Math.sin(t * 40) * 4, { add: 1, a: this.vis });
      if (this.ext > 4 && has('semP9', 'seg')) { const [sx, sy] = this.shoulder(), [segW] = L9.size('semP9', 'seg'), k = 9 / L9.size('semP9', 'seg')[1], sw = segW * k;
        for (let d = 10; d < this.ext - 8; d += sw - 2) S(c, 'semP9', 'seg', sx + this.dir * (d + sw / 2), sy, k, { flip: this.dir < 0, a: this.vis });
        const [fx, fy] = this.fist(); SH(c, 'semP9', this.stT < 0.75 ? 'fistO' : 'fistC', fx, fy + 10, 20, { flip: this.dir < 0, a: this.vis }); }
      if (this.slime > 0 && (t * 10 | 0) % 3 === 0) LP().fx.push({ t: 0, sh: 'kFx9', fr: ['drops'], x: this.x + rnd(-14, 14), y: this.y - rnd(20, 70), vx: 0, vy: 40, g: 400, s: 0.1, life: 0.4 });
    }
  };

  L9.MAPS.semen = () => {
    const LM = L9.MAPS.lab();
    const M = {
      x0: 0, x1: W, y0: -40, y1: 460, killY: 2000,
      solids: [[0, GY, BR0, 260, 'hide'], [BR0, GY, BR1 - BR0, 16, 'hide'], [-40, -300, 40, 900, 'hide'], [W, -300, 40, 900, 'hide']],
      walks: [], ladders: [[LAD_X, GY - 190, GY]], cks: [[60, GY]], picks: [],
    };
    M.killAt = () => M.killY;
    M.dmgK = 0.65;     // долгий бой: урон по Валере x0.75
    M.camY = gy => clamp(gy, GY - 90, GY) - 256;
    M.init = (P, lv, ck) => {
      if (!Sem) Sem = mkSem();
      G.portraits = G.portraits || {};
      for (const k of ['semen', 'semen2']) if (!G.portraits[k]) G.loadImage('assets/spr/p_' + k + '.png').then(im => G.portraits[k] = im, () => {});
      M.t = 0; M.strikes = []; M.drops = []; M.cut = 1; M.started = 0; M.sitFr = null; M.semRot = 0; M.semDy = 0; M.melt = 0; M.boil = 0;
      M.lad = LADLES.map(l => ({ ...l, zx: l.x + LAD_LIP, st: 'full', t: 0, pull: 0, lvl: 1 }));
      M.caps = []; M.capT = 0.5; M.bubs = [];
      if (!KEEP) PH_SAVE = 1; KEEP = 0; M.boss = new Sem(M, 760, GY); M.boss.ph = PH_SAVE; M.boss.hp = 100 - (PH_SAVE - 1) * 20; P.foes.push(M.boss);
      M.picks = [['kefir', 270, GY], ['rocket', 60, GY]].map(([kind, x, y]) => ({ kind, x, y, t: 0 })); M.pickT = 22;
      P.x = 60; P.dir = 1; P.hide = 0; P.melted = 0;
    };
    M.eb = (x, y, vx, vy, o) => LP().ebul.push(Object.assign({ x, y, vx, vy, t: 0, dmg: 10, s: 1,
      draw: (c, e) => { const fr = e.kind === 'rocket' ? 'rocket' : 'bolt'; SH(c, 'semP9', fr, e.x, e.y, fr === 'rocket' ? 12 : 16, { rot: Math.atan2(e.vy, e.vx), add: fr === 'bolt' ? 1 : 0 }); },
      onLand: e => { LP().fx.push({ t: 0, sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2'], x: e.x, y: e.y - 6, s: e.kind === 'rocket' ? 0.5 : 0.25, life: 0.3, add: 1 }); } }, o));
    // ---------- сцены ----------
    M.introScript = function* () {
      const P = LP(), b = M.boss; Scene.dialogTop = true; P.st = 'stand';
      b.act = 'roar'; b.stT = 0; b.auraT = 1.6; yield 0.3; M.camT = 320; G.shake(3, 0.5); Sound.play('boom', 0.5); yield 1.4; M.camT = null; yield 0.3;
    };
    M.finish = () => { Scene.run(M.endScript, () => LP().lv.next()); };
    M.endScript = function* () {     // Семён шатается к щели и падает в котёл; Валера садится на пирс
      const P = LP(), D = 0.016, b = M.boss; M.cut = 1; Scene.dialogTop = true; P.foes = P.foes.filter(f => f === b); P.ebul = []; M.strikes = []; M.drops = [];
      b.fly = 0; b.hop = 0; b.y = GY; b.vis = 1; b.ext = 0; b.slime = 0; b.auraT = 0;
      const gx = BR1 + 16; b.dir = 1; M.camT = W - 640;     // шатается к краю мостика и падает в котёл
      const spd = Math.max(60, Math.abs(gx - b.x) / 2.4); for (let t = 0; t < 4 && Math.abs(b.x - gx) > 3; t += D) { b.x += b.dir * spd * D; M.semRot = Math.sin(t * 9) * 0.16; M.semFr = (t * 4 | 0) % 2 ? 'stagger' : 'kneel'; yield D; }
      M.semFr = 'stagger'; Sound.play('shout'); let vy = -140;
      for (let t = 0; t < 1.6; t += D) { vy += 900 * D; M.semDy += vy * D; M.semRot += 2.5 * D * b.dir; yield D; if (M.semDy > 90) break; }
      b.gone = true; Sound.play('stomp'); G.shake(6, 0.6); M.splash(b.x, 2.2);
      yield 1.0; const sx = 330; M.camT = W - 640;
      P.st = 'run'; P.dir = sx > P.x ? 1 : -1; for (let t = 0; t < 5 && Math.abs(P.x - sx) > 4; t += D) { P.x += P.dir * 120 * D; if (overPit(P.x)) P.y = GY; yield D; }
      P.st = 'stand'; yield 0.4; P.hide = 1; M.sitFr = 'sit'; Sound.play('land'); yield 1.0; M.sitFr = 'belly';
      yield* Scene.say('valera', 'Что-то я проголодался.', null);
      M.boil = 1; Sound.play('thunder'); G.shake(5, 1.6); yield 0.8; M.sitFr = 'look'; M.camT = 160;
      yield* Scene.say('semen2', 'Валера, я тебе не какой-то там проходнячок.', null);
      yield 0.6;
    };
    M.cutUpdate = (dt, P) => { P.t += dt; M.t += dt; M.mech(dt, P, true); M.bgUpd(dt);
      if (M.camT != null) P.cam.x += (clamp(M.camT, 0, W - 640) - P.cam.x) * Math.min(1, dt * 2.5); else P.camera(dt); P.updFx(dt); };
    // всплеск в котле
    M.splash = (x, s = 1) => { const P = LP(); P.fx.push({ t: 0, sh: 'kCap9', fr: ['splash'], x, y: GY + 36, s: 0.5 * s, life: 0.6 });
      for (let i = 0; i < 6 * s; i++) P.fx.push({ t: 0, sh: 'kFx9', fr: ['drops'], x: x + rnd(-30, 30) * s, y: GY + 40, vx: rnd(-80, 80), vy: rnd(-280, -140), g: 700, s: rnd(0.12, 0.22), life: 0.9 });
      P.fx.push({ t: 0, sh: 'kFx9', fr: ['st0'], x, y: GY + 10, vx: 0, vy: -30, s: 0.5 * s, life: 1.2, fade: 1 }); Sound.play('splash'); };
    // ---------- механика арены ----------
    M.mech = (dt, P, cut) => {
      for (const l of M.lad) { l.t += dt; l.pull -= dt;
        if (l.st === 'tilt' && l.t > 0.3) { l.st = 'pour'; l.t = 0; Sound.play('stomp', 0.5); }
        else if (l.st === 'pour' || l.st === 'thin') { const b = M.boss;
          if (!cut && b && !b.dying && b.slime <= 0 && l.st === 'pour' && l.t < dt * 1.5 && Math.abs(b.x - l.zx) < 90 && Math.random() < 0.08 + b.ph * 0.05) { b.act = 'dash'; b.stT = 0; b.shot = 1; b.dir = b.x < l.zx ? -1 : 1; b.fly = 0; }     // отскакивает из-под струи
          if (!cut && b && !b.dying && b.slime <= 0 && Math.abs(b.x - l.zx) < 44 && l.t > 0.1) { b.drench(5.8 - b.ph * 0.4); Sound.play('splash'); LP().lv.say('ОБЛИТ ЖИЖЕЙ! БЕЙ!', 1.6); }
          if (!cut && Math.abs(P.x - l.zx) < 26 && l.t > 0.1) P.hurt(6, l.zx);
          if ((l.t * 12 | 0) % 2) P.fx.push({ t: 0, sh: 'kFx9', fr: ['spl'], x: l.zx + rnd(-10, 10), y: GY - 6, s: 0.22, life: 0.25 });
          if (l.st === 'pour' && l.t > 1.2) { l.st = 'thin'; l.t = 0; } else if (l.st === 'thin' && l.t > 0.4) { l.st = 'tE'; l.t = 0; } }
        else if (l.st === 'tE' && l.t > 0.5) { l.st = 'fill'; l.t = 0; l.lvl = 0; }
        else if (l.st === 'fill') { l.lvl = clamp(l.t / REFILL, 0, 1); if (l.lvl >= 1) { l.st = 'full'; l.t = 0; Sound.play('confirm', 0.4); } } }
      for (const s of M.strikes) { s.t += dt; if (!cut && s.t > 0.7 && s.t < 0.95 && Math.abs(P.x - s.x) < 18) P.hurt(12, s.x); if (s.t > 0.7 && s.t - dt <= 0.7) { Sound.play('zap', 0.6); G.shake(2, 0.15); } }
      M.strikes = M.strikes.filter(s => s.t < 1.0);
      for (const d of M.drops) { d.t += dt; if (d.t > 0) { d.y += (300 + d.t * 600) * dt; const fy = inPit(d.x) ? GY + 40 : GY - 4; if (d.y > fy) { d.dead = 1; P.fx.push({ t: 0, sh: 'kFx9', fr: ['spl'], x: d.x, y: fy, s: 0.2, life: 0.3 }); if (!cut && Math.abs(P.x - d.x) < 16 && Math.abs(P.y - GY) < 30) P.hurt(6, d.x); } } }
      M.drops = M.drops.filter(d => !d.dead);
      for (const e of P.ebul) if (e.home && e.t > 0.3 && e.t < 2.4) { const ang = Math.atan2(P.y - 40 - e.y, P.x - e.x), sp = Math.hypot(e.vx, e.vy) + 140 * dt, cur = Math.atan2(e.vy, e.vx); let da = ang - cur; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; const na = cur + clamp(da, -2.2 * dt, 2.2 * dt); e.vx = Math.cos(na) * Math.min(330, sp); e.vy = Math.sin(na) * Math.min(330, sp); }
    };
    // фон: капсулы на монорельсе среднего плана (координаты — пиксели исходника kMid)
    M.bgUpd = dt => {
      M.capT -= dt; if (M.capT <= 0) { M.capT = rnd(1.6, 2.8); M.caps.push({ x: -120, v: rnd(70, 95), tg: MID_VATS[rnd(0, 3) | 0], st: 'go', t: 0 }); }
      for (const q of M.caps) { q.t += dt;
        if (q.st === 'go') { q.x += q.v * dt; if (q.tg && Math.abs(q.x - q.tg[0]) < 4) { q.st = 'open'; q.t = 0; } }
        else if (q.st === 'open' && q.t > 0.45) { q.st = 'fall'; q.t = 0; q.my = 75 + 150; q.vy = 0; }
        else if (q.st === 'fall') { q.vy += 900 * dt; q.my += q.vy * dt; if (q.my > q.tg[1] + 10) { q.st = 'spl'; q.t = 0; } }
        else if (q.st === 'spl' && q.t > 0.55) { q.st = 'go'; q.tg = null; q.empty = 1; }
        if (q.x > MID_W + 140) q.dead = 1; }
      M.caps = M.caps.filter(q => !q.dead);
    };
    M.update = (dt, P, lv) => {
      M.t += dt; M.bgUpd(dt);
      if (M.cut === 1 && !M.started) { M.started = 1; Scene.run(M.introScript, () => { M.cut = 0; lv.say('ДЁРНИ СТРОПУ — ОБЛЕЙ СЕМЁНА ЖИЖЕЙ!', 3); }); return; }
      if (M.melt) { M.melt += dt; P.vx = 0; P.vy = 0; P.y = GY + 40; return; }
      M.mech(dt, P, false);
      // упал в котёл — сразу растворяется
      if (inPit(P.x) && P.y > GY + 26) { M.melt = 0.001; P.hide = 1; P.melted = 1; P.inv = 0; M.splash(P.x, 1.2); for (let i = 0; i < 4; i++) P.fx.push({ t: 0, sh: 'kFx9', fr: ['st1'], x: P.x + rnd(-12, 12), y: GY + 20, vx: 0, vy: -40, s: 0.3, life: 1.4, fade: 1 }); lv.say('ВАЛЕРА РАСТВОРИЛСЯ', 2); lv.hurt(999); return; }
      for (const l of M.lad) if (Math.abs(P.x - l.sl) < 26 && P.onG) {
        if (l.st === 'full') { P.hintAt('ВВЕРХ — ДЁРНУТЬ СТРОПУ', 0.3); if (G.Input.pressed('up')) { l.st = 'tilt'; l.t = 0; l.pull = 0.6; Sound.play('clank'); } }
        else P.hintAt('КОВШ НАПОЛНЯЕТСЯ...', 0.3); }
      for (const k of M.picks) { k.t += dt; if (!k.dead && Math.abs(P.x - k.x) < 22 && Math.abs(P.y - k.y) < 40) LM.take(k, P, lv); }
      M.picks = M.picks.filter(k => !k.dead);
      M.pickT -= dt; if (M.pickT <= 0 && M.picks.length < 2) { M.pickT = 15; M.picks.push({ kind: ['kefir', 'grenades', 'plasma', 'pies'][rnd(0, 4) | 0], x: [50, 250, 400][rnd(0, 3) | 0], y: GY, t: 0 }); }
    };
    M.hazAt = () => null;
    M.shootProps = () => {};
    M.blast = () => {};
    // ---------- отрисовка ----------
    const haze = (c, a, col = '4,12,8') => { c.fillStyle = 'rgba(' + col + ',' + a + ')'; c.fillRect(0, 0, 640, 360); };
    const fog = (c, t, n, y0, y1, sp, a, sc, par, cx) => {     // густая дымка: крупные клубы пара медленно плывут
      for (let i = 0; i < n; i++) { const X = ((i * 271 + t * sp * (1 + (i % 3) * 0.3) - cx * par) % 900 + 900) % 900 - 130, Y = y0 + ((i * 97) % Math.max(1, y1 - y0)) + Math.sin(t * 0.4 + i) * 6;
        S(c, 'kFx9', i % 2 ? 'st0' : 'st1', X, Y, sc * (0.8 + (i % 4) * 0.15), { a: a * (0.7 + 0.3 * Math.sin(t * 0.5 + i * 2)) }); } };
    M.drawBack = (c, cx, cy) => {
      c.fillStyle = '#030805'; c.fillRect(0, 0, 640, 360); const fy = GY - cy, t = M.t;
      // дальний зал
      const fim = L9.img.kFar; if (fim) { const h = 400, w = fim.width * h / fim.height, y = clamp(-28 - (cy - 94) * 0.05, 360 - h, 0); for (let x = -((cx * 0.12 % w) + w) % w; x < 640; x += w) c.drawImage(fim, Math.floor(x), Math.round(y), Math.ceil(w) + 1, h); }
      haze(c, 0.18);
      for (let i = 0; i < 6; i++) { const X = ((i * 190 - cx * 0.15) % 1140 + 1140) % 1140 - 100, u = ((t * 0.1 + i * 0.31) % 1); S(c, 'fxZ9', 'sm0', X, fy - 120 - u * 190, 0.9 + u, { a: 0.2 * (1 - u) }); }
      fog(c, t, 5, 60, 200, 6, 0.10, 2.4, 0.15, cx);
      // средний план: котлы, трубы, монорельс; капсулы едут и сбрасывают людей
      const mim = L9.img.kMid; if (mim) { const h = MID_H, w = mim.width * h / mim.height, k = h / mim.height, top = fy + 34 - h, ox = -((cx * 0.42 % w) + w) % w;
        for (let X = ox - w; X < 640 + w; X += w) {
          if (X + w < -60 || X > 700) continue;
          c.drawImage(mim, Math.floor(X), Math.round(top), Math.ceil(w) + 1, h);
          for (const [vx, vy] of MID_CASC) { const n = 'c' + ((t * 9 + vx) | 0) % 3, len = (768 - vy) * k; S(c, 'kFx9', n, X + vx * k, top + vy * k + len / 2, 0.42, { sy: len / (L9.size('kFx9', n)[1] * 0.42), a: 0.9 }); }
          MID_VATS.forEach(([vx, vy], i) => { for (let j = 0; j < 2; j++) { const u = (t * 0.25 + i * 0.37 + j * 0.5) % 1; S(c, 'kFx9', j ? 'st0' : 'st1', X + (vx + (j - 0.5) * 90) * k, top + vy * k - 10 - u * 60, 0.25 + u * 0.35, { a: 0.35 * (1 - u) }); } });
          for (const q of M.caps) { const qx = X + q.x * k, cy0 = top + 75 * k + 26; if (qx < -60 || qx > 700) continue;
            const fr = q.st === 'open' ? (q.t < 0.22 ? 'hang' : 'open') : q.st === 'fall' && q.t < 0.15 ? 'drop' : q.empty || q.st === 'fall' || q.st === 'spl' ? 'empty' : 'hang';
            SH(c, 'kCap9', fr, qx, cy0, 56);
            if (q.st === 'fall' && q.t >= 0.15) SH(c, 'kCap9', 'man', qx, top + q.my * k, 18, { rot: q.t * 3 });
            if (q.st === 'spl') SH(c, 'kCap9', 'splash', qx, top + q.tg[1] * k - 10, 30 * (0.6 + q.t), { a: 1 - q.t / 0.55 }); }
        } }
      haze(c, 0.22);
      fog(c, t, 6, 120, 260, 9, 0.12, 2.0, 0.35, cx);
    };
    M.drawMid = (c, P) => {
      const t = M.t;
      // котёл: от края бетонного пола до правого края арены; кипящая поверхность (3 кадра Flow с перетеканием), пар, пузыри
      const vx0 = VAT_X0, vw = W + 80 - vx0, vcx = vx0 + vw / 2, vy = GY + 50;
      const surf = a0 => { const [sw] = L9.size('kVat9', 's0'), sk = (vw * 0.93) / sw, ph = t * 2.2, i0 = (ph | 0) % 3, fa = ph % 1;
        S(c, 'kVat9', 's' + i0, vcx + 8, vy + 10, sk, { a: a0 }); S(c, 'kVat9', 's' + (i0 + 1) % 3, vcx + 8, vy + 10, sk, { a: fa * a0 }); };
      { const [fw, fh] = L9.size('kVat9', 'vat'), k = vw / fw, vh = fh * k; S(c, 'kVat9', 'vat', vcx, vy + vh / 2 - 6, k); surf(1); }
      // труба из-под пола: жижа льётся в котёл
      if (has('kFl9', 'pipe')) { const [pw0, ph0] = L9.size('kFl9', 'pipe'), pk = 58 / ph0; S(c, 'kFl9', 'pipe', BR0 + 18, vy + 4 - 29, pk); }
      // мостик с перилами: опоры стоят в котле
      if (has('kFl9', 'bridge')) { const bw = BR1 - BR0 + 10, [bfw, bfh] = L9.size('kFl9', 'bridge'), bk = bw / bfw, bh = bfh * bk; S(c, 'kFl9', 'bridge', (BR0 + BR1) / 2 + 2, GY - bh * 0.26 + bh / 2, bk); }
      surf(0.9);     // поверхность поверх опор — опоры уходят в жижу
      for (let i = 0; i < (M.boil ? 9 : 5); i++) { const u = (t * (M.boil ? 1.4 : 0.5) + i * 0.27) % 1; S(c, 'kFx9', i % 2 ? 'st0' : 'st1', vx0 + 40 + i * 70 + Math.sin(i * 3 + t) * 10, vy - u * 70, 0.15 + u * 0.35, { a: 0.5 * (1 - u) }); }
      for (let i = 0; i < 4; i++) { const u = (t * 0.8 + i * 0.41) % 1; if (u < 0.25) S(c, 'kFx9', 'spl', vx0 + 30 + ((i * 131 + (t * 0.8 | 0) * 77) % (vw - 120)), vy + 6, 0.14 + u * 0.4, { a: 1 - u * 4 }); }
      // бетонный пол слева и лестница на стене
      if (has('kFl9', 'floor')) { const [ffw, ffh] = L9.size('kFl9', 'floor'), fk = 150 / ffh, fw2 = ffw * fk; S(c, 'kFl9', 'floor', BR0 + 8 - fw2 / 2, GY - 4 + 75, fk); }
      if (has('kFl9', 'ladder')) { const [lw, lh] = L9.size('kFl9', 'ladder'), lk = 34 / lw, h2 = lh * lk; for (let y = GY + 2; y > P.cam.y - 40; y -= h2 - 6) S(c, 'kFl9', 'ladder', LAD_X, y - h2 / 2, lk); }
      // ковши: подача жижи по стеклянной трубе сверху, уровень растёт; наклон и струя на арену
      for (const l of M.lad) {
        const cyL = LAD_TOP + LAD_H / 2, px = l.x - 16;
        // трос от крюка вверх и стеклянная труба подачи
        if (has('kSl9', 'rope')) { const [rw, rh] = L9.size('kSl9', 'rope'), rk = 4 / rw * 3; for (let y = LAD_TOP + 4; y > P.cam.y - 60; y -= rh * rk * 0.9) S(c, 'kSl9', 'rope', l.x, y - rh * rk / 2, rk); }
        // стеклянная труба подачи сбоку (с внешней стороны арены), по ней течёт жижа; из носика — струя в ковш, пока он наполняется
        const sd = l.x < 243 ? -1 : 1, py = LAD_TOP + 14, pe = l.x - sd * 4;
        if (l.st === 'fill') { const n = 'c' + ((t * 10) | 0) % 3, top = py + 6, bot = cyL + 30 - l.lvl * 24, len = bot - top; S(c, 'kFx9', n, pe + sd * 4, top + len / 2, 0.2, { sy: len / (L9.size('kFx9', n)[1] * 0.2) }); }
        if (has('kFx9', 'pipe')) { const [pw2, ph2] = L9.size('kFx9', 'pipe'), pk = 64 / pw2, seg = pw2 * pk - 4; for (let i = 0; i < 4; i++) S(c, 'kFx9', 'pipe', pe + sd * (seg / 2 + i * seg), py, pk, { flip: sd > 0 });
          for (let i = 0; i < 6; i++) { const u = (t * (l.st === 'fill' ? 0.9 : 0.25) + i / 6) % 1; S(c, 'kFx9', 'drops', pe + sd * (4 * seg) * (1 - u), py + Math.sin(i * 7 + t * 3), 0.05, { a: 0.85 }); } }
        // кадр ковша
        let fr = 'full', fr2 = null, fa = 0;
        if (l.st === 'fill') { const q = l.lvl * 3, i0 = Math.min(2, q | 0); fr = ['e', 'q1', 'q2'][i0]; fr2 = ['q1', 'q2', 'full'][i0]; fa = q - i0; }
        else if (l.st === 'tilt') fr = 't25'; else if (l.st === 'pour') fr = 'pour'; else if (l.st === 'thin') fr = 'thin'; else if (l.st === 'tE') fr = 'tE';
        SH(c, 'kLad9', fr, l.x, cyL, LAD_H); if (fr2 && fa > 0.02) SH(c, 'kLad9', fr2, l.x, cyL, LAD_H, { a: fa });
        if (l.st === 'full' && (t * 3 | 0) % 2) SH(c, 'kFx9', 'drops', l.x - 4, LAD_TOP + 34, 10, { a: 0.6 });
        // струя от носика до пола
        if (l.st === 'pour' || l.st === 'thin') { const n = 'c' + ((t * 12) | 0) % 3, top = LAD_TOP + LAD_H - 12, len = GY - top, wk = l.st === 'pour' ? 0.46 : 0.18; S(c, 'kFx9', n, l.zx, top + len / 2, wk, { sy: len / (L9.size('kFx9', n)[1] * wk) }); }
        // стропа: шкив, трос, ручка
        if (has('kSl9', 'rest')) { const fr3 = l.pull > 0.35 ? 'pull' : l.pull > 0 ? 'mid' : 'rest', [, sh3] = L9.size('kSl9', fr3), sk = 236 / sh3, cy3 = GY - 42 - (326 / 380 - 0.5) * 236;
          const cut3 = cy3 - 236 / 2 + 236 * 0.31, sg = l.sl > 243 ? -1 : 1, off = { rest: 38, mid: 18, pull: 6 }[fr3] * sk * 0.5;     // трос пары держим на месте, кадры смещены
          c.save(); c.beginPath(); c.rect(l.sl - 60, cut3, 120, 400); c.clip(); S(c, 'kSl9', fr3, l.sl - sg * off, cy3, sk, { flip: sg < 0 }); c.restore();     // без шкива: только трос и ручка (по схеме)
          if (has('kSl9', 'rope')) { const [, rh] = L9.size('kSl9', 'rope'), rk = 0.42, rs = 26.5 * rk * 0.5; const st = 184 * rk * 0.5; for (let y = cut3 + 4; y > P.cam.y - 60; y -= st) for (const q of [-1, 1]) S(c, 'kSl9', 'rope', l.sl + q * 23 * sk * 0.5 + rs, y - st / 2 - 4 * rk * 0.5, rk); }     // в кадре троса он занимает строки 100..288
          if (l.st === 'full' && Math.abs(P.x - l.sl) < 70) S(c, 'fxL9', 'spark', l.sl, GY - 48, 0.5 + Math.sin(t * 6) * 0.1, { add: 1, a: 0.6 }); }
        if (l.st === 'fill') G.text(Math.ceil(REFILL * (1 - l.lvl)) + '', l.sl, GY - 132, { align: 'center', size: 8, color: '#7fe0c0', outline: true });
      }
      // молнии: метка на полу, затем разряд сверху
      for (const s of M.strikes) { if (s.t < 0) continue; if (s.t < 0.7) { if ((t * 14 | 0) % 2) S(c, 'fxZ9', 'sp0', s.x, GY - 4, 0.3 + s.t * 0.4, { add: 1 }); }
        else if (has('semP9', 'light')) { const [, lh] = L9.size('semP9', 'light'), k = 26 / L9.size('semP9', 'light')[0]; S(c, 'semP9', 'light', s.x, GY + 2, k, { add: 1, sy: (GY + 30) / (lh * k), flip: (t * 20 | 0) % 2 }); } }
      for (const d of M.drops) { if (d.t < 0) { if (d.t > -0.6 && !inPit(d.x)) S(c, 'props8', 'shadow', d.x, GY + 1, 0.4 + (0.6 + d.t), { a: 0.5 }); continue; } SH(c, 'semP9', 'drop', d.x, d.y, 18); }
      if (M.sitFr) SH(c, 'vSit9', M.sitFr, P.x, GY + 2, 56);
      for (const k of M.picks) { const bob = Math.sin(k.t * 4) * 2; if (k.kind === 'pelmeni' || k.kind === 'kefir' || k.kind === 'pies') Art.item(c, k.kind, k.x, k.y - 14 + bob, 0, 1); else { S(c, 'fxL9', 'spark', k.x, k.y - 14, 0.4, { add: 1 }); S(c, 'pick9', k.kind, k.x, k.y - 16 + bob, 1); } }
    };
    M.drawFront = () => {};
    M.drawOver = (c, cx) => { const t = M.t; fog(c, t, 4, 230, 330, 14, 0.09, 2.6, 1.1, cx); };     // ближняя дымка у пола поверх всего
    M.drawHud = (c) => {     // шкала Семёна: 5 серий
      const b = M.boss; if (!b || M.cut === 1 && !M.started) return;
      const x = 170, y = 340, w = 300; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x - 4, y - 14, w + 8, 24);
      G.text('СЕМЁН · ФАЗА ' + Math.min(5, b.ph), x, y - 11, { size: 8, color: b.slime > 0 ? '#7fff7f' : '#ff7070' });
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
    onDie(lv) { KEEP = 1; LP().onDie(lv); },
    deadUpdate(lv, dt) { LP().deadUpdate(lv, dt); const M = LP().M; if (M && M.bgUpd) { M.t += dt; M.bgUpd(dt); } },
    update(lv, dt) { LP().update(lv, dt); },
    cutUpdate(lv, dt) { const P = LP(); P.M.cutUpdate && P.M.cutUpdate(dt, P); },
    draw(lv, c) { LP().draw(lv, c); },
    drawHud(lv, c) { LP().drawHud(lv, c); },
  };
  if (!L9.ORDER.includes('semen')) L9.ORDER.push('semen');
})();
