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
  const W = 640, GY = 330, BR0 = 110, BR1 = 420, LAD_X = 22, VAT_X0 = 92, REFILL = 9, DMG_K = 0.85;     // схема владельца: слева бетонный пол с лестницей, мостик на опорах над котлом, справа — открытый котёл
  const LAD_H = 64, BEAM_T = GY - 228, BEAM_H = 22, HOIST_H = 40, PUL_H = 34, LAD_TOP = BEAM_T + BEAM_H + HOIST_H - 4, LAD_LIP = 16, PUL_Y = BEAM_T + BEAM_H + PUL_H * 0.66, VAT_R = 600;     // балка у потолка: на тали висит чан, на кронштейне — блок троса     // чаны под потолком; блок стропы у потолка     // ковш: высота кадра, верх (крюк), смещение струи от центра
  const LADLES = [{ x: 280, sl: 336 }];     // по просьбе владельца — один чан со стропой
  const MID_H = 250, MK = MID_H / 768;     // средний план: высота слоя и масштаб пикселей исходника
  const MID_VATS = [[146, 350], [778, 330]], MID_CASC = [], MID_W = 1236, RAIL_Y = GY - 190;     // RAIL_Y — монорельс у потолка
  const has = (sh, fr) => { const d = L9D[sh]; return d && (!fr || (d.n || []).includes(fr)); };
  const SH = (c, sh, fr, x, y, h, o) => { if (!has(sh, fr)) return; const [, fh] = L9.size(sh, fr); S(c, sh, fr, x, y, h / fh, o); };
  const SW = (c, sh, fr, x, y, w, o) => { if (!has(sh, fr)) return; const [fw] = L9.size(sh, fr); S(c, sh, fr, x, y, w / fw, o); };
  const inPit = x => x > BR1 + 2 && x < VAT_R;     // за краем мостика — открытый котёл
  const overPit = inPit;
  // бесшовная струя жижи: средняя часть кадра каскада (Flow) повторяется по высоте и смещается вниз — течёт, без стыков и растяжения
  const stream = (c, x, y0, y1, w, t, sp) => {
    const im = L9.img.kFx9, d = L9D.kFx9; if (!im || !d || y1 <= y0) return; const f = d.f[d.n.indexOf('c0')], k = w / f[2], sy = f[1] + f[3] * 0.22, sh = f[3] * 0.5, segH = sh * k;
    c.save(); c.beginPath(); c.rect(x - w, y0, w * 2, y1 - y0); c.clip();
    for (let y = y0 - segH + ((t * sp * 60) % segH); y < y1; y += segH - 0.5) c.drawImage(im, f[0], sy, f[2], sh, Math.round(x - w / 2), y, w, segH);
    c.restore();
  };
  WHO.semen = WHO.semen || { name: 'СЕМЁН', color: '#e05050', voice: 120 };
  WHO.semen2 = WHO.semen2 || WHO.semen;
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
    drench(t) { if (this.form) this.unmorph(); this.slime = t; this.slT = 0; this.act = 'run'; this.ext = 0; this.vx = 0; this.invT = 0; this.vis = 1; }
    enrage() {     // серия окончена: стряхивает жижу и звереет
      const lv = LP().lv; this.slime = 0; this.ph++; PH_SAVE = Math.min(5, this.ph); G.shake(5, 0.5); Sound.play('boom', 0.6);
      if (this.ph > 5) { this.dying = 1; this.M.finish(); return; }
      if (this.ph === 3 && !this.M.illOn) this.M.dartPend = 1;     // минус две фазы — дротик и иллюзии
      this.act = 'roar'; this.stT = 0; this.cd = 0.6; this.vis = 1; this.invT = 0; this.auraT = 1.1;
      lv.say(['', '', 'СЕМЁН ЗВЕРЕЕТ!', 'СЕМЁН В ЯРОСТИ!', 'СЕМЁН В БЕШЕНСТВЕ!', 'ПОСЛЕДНИЙ РЫВОК СЕМЁНА!'][this.ph] || 'СЕМЁН ЗВЕРЕЕТ!', 2);
    }
    shoulder() { return [this.x + this.dir * 12, this.y - 56]; }
    fist() { const [sx, sy] = this.shoulder(); return [sx + this.dir * this.ext, sy]; }
    pick(P) {     // все способности с первой фазы; с фазой растут вес опасных атак
      const ph = this.ph, fo = P.foes.filter(f => !f.dead && f !== this).length;
      const L = [['punch', 3], ['bolt', 3], ['rocket', 2 + ph * 0.3], ['dash', 2 + ph * 0.3], ['light', 2 + ph * 0.4], ['fly', 1.5 + ph * 0.3], ['rain', 1 + ph * 0.4],
        ['invis', this.invT > 0 ? 0 : 1 + ph * 0.2], ['summon', this.sumCd <= 0 && fo < 1 + (ph >> 1) ? 2 : 0], ['morph', this.morphCd > 0 ? 0 : 2.5 + ph * 0.4]];
      let s = L.reduce((a, b) => a + b[1], 0) * Math.random(); for (const [n, w] of L) { s -= w; if (s <= 0) return n; } return 'bolt';
    }
    update(dt, P, lv) {
      this.t += dt; this.stT += dt; this.fl -= dt; this.sumCd -= dt; this.auraT -= dt; this.morphCd = (this.morphCd || 0) - dt;
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
        this.vx = T > 0.5 && T < D ? this.dir * (190 + ph * 15) : 0; if (this.x <= 60 || this.x >= VAT_R - 40) this.dir = this.x <= 60 ? 1 : -1;
        if (T > 0.6 && T < D && (T / iv | 0) !== this.lastB) { this.lastB = T / iv | 0; M.eb(this.x, this.y - 10, (P.x - this.x) * 0.5, 260, { kind: 'bolt', dmg: 8 }); Sound.play('zap', 0.3); }
        if (T > D + 0.5) { this.fly = 0; this.done(); } }
      else if (a === 'morph') { this.vx = 0;     // превращение в одного из прошлых боссов
        if (this.stT < dt * 1.5) { Sound.play('zap'); G.shake(3, 0.3); for (let i = 0; i < 5; i++) P.fx.push({ t: 0, sh: 'kFx9', fr: [i % 2 ? 'st0' : 'st1'], x: this.x + rnd(-20, 20), y: this.y - rnd(10, 70), vx: rnd(-30, 30), vy: -20, s: 0.3, life: 0.7, fade: 1 }); }
        if (this.stT > 0.45) { const f = FORMS[(Math.random() * FORMS.length) | 0]; this.form = f; this.formT = 5 + ph * 0.6; this.fcd = 0.6; this.fm = 'walk'; this.fmT = 0; this.fjy = 0; this.fjv = 0; this.sniffed = 0; this.shots = 0; this.runDir = 0; this.rayR = null; this.act = 'form'; this.stT = 0; lv.say('СЕМЁН ПРЕВРАТИЛСЯ: ' + f.n + '!', 1.6); } }
      else if (a === 'form') {     // в облике босса: его же приёмы (как в своих уровнях)
        const f = this.form, k = f.kind, sp2 = f.sp * (1 + ph * 0.1), dx = P.x - this.x, adx = Math.abs(dx), near = adx < 46 && Math.abs(P.y - this.y) < 60;
        this.formT -= dt; this.fmT += dt; this.fan = null;
        const go = (m, an) => { this.fm = m; this.fmT = 0; this.fmN = 0; this.fan = an || null; }, face = () => { this.dir = dx < 0 ? -1 : 1; }, walkTo = (x, s) => { this.vx = Math.abs(x - this.x) > 10 ? Math.sign(x - this.x) * (s || sp2) : 0; };
        if (this.fjy > 0 || this.fjv) { this.fjv += 1500 * dt; this.fjy = Math.max(0, this.fjy - this.fjv * dt); if (this.fjy <= 0) { this.fjv = 0; this.fjy = 0; } }
        const m = this.fm || 'walk', T = this.fmT;
        if (k === 'kesha') {     // Кеша: двоечка рукой и ногой, три выстрела и «патроны!», занюх для силы
          if (m === 'walk') { walkTo(P.x - Math.sign(dx || 1) * 30); face(); this.fan = Math.abs(this.vx) > 1 ? 'run' : 'stand';
            if (near && T > 0.3) go('punch', 'punch'); else if (adx > 140 && T > 0.8) go('aim', 'aim'); else if (!this.sniffed && this.hp < this.maxHp && T > 1.2 && Math.random() < dt) { this.sniffed = 1; go('sniff', 'sniff'); lv.say('СЕМЁН-КЕША: ЩА, ЗАНЮХНУ ДЛЯ СИЛЫ...', 1.4); } }
          else if (m === 'punch') { this.vx = 0; this.fan = 'punch'; if (T > 0.15 && !this.fmN) { this.fmN = 1; Sound.play('punch'); if (near) P.hurt(9, this.x); }
            if (T > 0.35) { this.fan = 'kick'; if (this.fmN === 1) { this.fmN = 2; Sound.play('punch'); if (adx < 54) { P.hurt(12, this.x); G.shake(3, 0.2); } } } if (T > 0.7) go('walk'); }
          else if (m === 'aim') { this.vx = 0; face(); this.fan = 'aim'; if (T > 0.4 - ph * 0.04) go('shoot', 'shoot'); }
          else if (m === 'shoot') { this.vx = 0; this.fan = 'shoot'; if (!this.fmN) { this.fmN = 1; this.shots = (this.shots || 0) + 1; M.eb(this.x + this.dir * 26, this.y - 50, this.dir * 380, 0, { kind: 'bolt', dmg: 9 }); Sound.play('shot', 0.6); }
            if (T > 0.3) { if (this.shots < 3) go('aim', 'aim'); else { this.shots = 0; go('reload', 'shout'); lv.say('СЕМЁН-КЕША: ПАТРОНЫ! ГДЕ ПАТРОНЫ?!', 1.3); } } }
          else if (m === 'reload') { this.vx = 0; this.fan = 'shout'; if (T > 1.4 - ph * 0.15) go('walk'); }
          else if (m === 'sniff') { this.vx = 0; this.fan = 'sniff'; if (T > 1.6) { this.hp = Math.min(this.maxHp, this.hp + 3); Sound.play('pickup', 0.5); lv.say('У-У-УХ! БОДРИТ!', 1.2); this.formT += 1.5; go('walk'); } } }
        else if (k === 'biker') {     // Байкер: носится от стены к стене с прыжками, радужный луч изо рта, бросок
          if (m === 'walk') { if (!this.runDir) this.runDir = dx < 0 ? -1 : 1; if (this.x <= 40) this.runDir = 1; else if (this.x >= BR1 - 24) this.runDir = -1;
            this.vx = this.runDir * (230 + ph * 25); this.dir = this.runDir; this.fan = this.fjy > 0 ? 'jump' : 'run';
            if (!this.fjy && Math.random() < dt * 0.9) { this.fjv = -470; this.fjy = 0.01; }
            if (!this.fjy && T > 1.6 && Math.random() < dt * 1.5) { this.vx = 0; if (Math.random() < 0.6) { go('rainbow', 'roar'); Sound.play('zap', 0.8); } else go('throw', 'throw'); } }
          else if (m === 'rainbow') { this.vx = 0; face(); this.fan = 'roar'; const mx = this.x + this.dir * 12, my = this.y - 100, want = Math.atan2(P.y - 44 - my, P.x - mx);
            if (this.ray == null || T < 0.05) this.ray = want; let da = want - this.ray; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; this.ray += clamp(da, -1.1 * dt, 1.1 * dt);
            this.rayR = T > 0.4 && T < 1.8 + ph * 0.2 ? { x0: mx, y0: my, ang: this.ray, len: 420 } : null;
            if (this.rayR) { const ux = Math.cos(this.ray), uy = Math.sin(this.ray), px = P.x - mx, py = P.y - 40 - my, along = px * ux + py * uy, off = Math.abs(px * uy - py * ux);
              if (along > 0 && along < 420 && off < 16 && (this.rayHit || 0) <= 0) { P.hurt(9, this.x); this.rayHit = 0.4; } }
            this.rayHit = (this.rayHit || 0) - dt; if (T > 2.1 + ph * 0.2) { this.rayR = null; go('walk'); } }
          else if (m === 'throw') { this.vx = 0; face(); this.fan = 'throw'; if (T > 0.3 && !this.fmN) { this.fmN = 1; M.eb(this.x + this.dir * 16, this.y - 70, dx * 0.9, -300, { kind: 'rocket', dmg: 10, grav: 0.55 }); Sound.play('throw', 0.6); } if (T > 0.7) go('walk'); } }
        else if (k === 'vande') {     // Ванделорд: мухоморы из-под земли, веер, самонаводящиеся споры, кислотный дождь
          if (m === 'walk') { walkTo(P.x + (this.x < P.x ? -180 : 180), 110); face(); this.fan = Math.abs(this.vx) > 1 ? 'walk' : 'idle';
            if (T > 1.1 - ph * 0.1) { const r = Math.random(); if (r < 0.3) { go('quake', 'punchGround'); lv.say('ГРИБЫ, ВСТАВАЙТЕ!', 1.2); } else if (r < 0.55) go('volley', 'beam'); else if (r < 0.8) { go('spore', 'orbA'); lv.say('СПОРА ТЬМЫ!', 1.2); } else go('acid', 'skyArms'); } }
          else if (m === 'quake') { this.vx = 0; this.fan = 'punchGround'; if (T > 0.35 && !this.fmN) { this.fmN = 1; G.shake(5, 0.3); Sound.play('boom', 0.8); M.quakes.push({ x0: this.x, dir: this.dir, sp: 230 + ph * 20, t: 0, next: 0, pops: [] }); } if (T > 0.8) go('walk'); }
          else if (m === 'volley') { this.vx = 0; face(); this.fan = 'beam'; if (T > 0.35 && !this.fmN) { this.fmN = 1; const ang = Math.atan2(P.y - 44 - (this.y - 56), dx), n = 4 + ph; for (let i = 0; i < n; i++) { const a2 = ang + (i - (n - 1) / 2) * 0.17; M.eb(this.x + this.dir * 20, this.y - 56, Math.cos(a2) * 260, Math.sin(a2) * 260, { kind: 'bolt', dmg: 8 }); } Sound.play('zap', 0.8); } if (T > 0.8) go('walk'); }
          else if (m === 'spore') { this.vx = 0; this.fan = 'orbA'; if (T > 0.5 && !this.fmN) { this.fmN = 1; for (let i = 0; i < (ph > 2 ? 3 : 2); i++) M.eb(this.x, this.y - 70, rnd(-60, 60), -90, { kind: 'spore', dmg: 10, home: 1, life: 4.5, draw: (c, e) => { if (Spr.sheets.proj6) Spr.drawC(c, 'proj6', 5, e.x, e.y, Math.atan2(e.vy, e.vx), 0.8); else SH(c, 'semP9', 'bolt', e.x, e.y, 16, { add: 1 }); } }); Sound.play('zap', 1); } if (T > 0.9) go('walk'); }
          else if (m === 'acid') { this.vx = 0; this.fan = 'skyArms'; if (T > 0.5 && !this.fmN) { this.fmN = 1; for (let i = 0; i < 6 + ph * 2; i++) M.drops.push({ x: rnd(10, BR1), t: -i * 0.18 - 0.6, y: -40 }); M.drops.push({ x: P.x, t: -0.7, y: -40 }); } if (T > 1.0) go('walk'); } }
        else if (k === 'chief') {     // главарь спецназа: двоечка, рывок, кувырок, очередь из автомата, граната, прыжок с ударом об пол
          if (m === 'walk') { walkTo(adx > 200 ? P.x : P.x - Math.sign(dx || 1) * 30, sp2); face(); this.fan = Math.abs(this.vx) > 1 ? 'run' : 'stand';
            if (near && T > 0.25) go('hit', 'punch'); else if (T > 0.7 && Math.random() < dt * 2.2) { const r = Math.random();
              if (r < 0.3 && adx > 110) go('rush', 'run'); else if (r < 0.55) go('aim', 'aim'); else if (r < 0.75) go('nade', 'grenade'); else { go('slam', 'jump'); this.fjv = -620; this.fjy = 0.01; this.vx = dx * 1.2; Sound.play('jump', 0.6); } } }
          else if (m === 'hit') { this.vx = 0; this.fan = 'punch'; if (T > 0.15 && !this.fmN) { this.fmN = 1; Sound.play('punch'); if (near) P.hurt(9, this.x); }
            if (T > 0.35) { this.fan = 'kick'; if (this.fmN === 1) { this.fmN = 2; Sound.play('punch'); if (adx < 54) { P.hurt(13, this.x); G.shake(3, 0.2); this.hitN = (this.hitN || 0) + 1; } } }
            if (T > 0.7) { if (this.hitN >= 2) { this.hitN = 0; go('roll', 'roll'); } else go('walk'); } }
          else if (m === 'rush') { this.fan = 'run'; if (!this.fmN) { this.fmN = 1; this.chg = dx < 0 ? -1 : 1; lv.say('ВЗЯТЬ ЕГО!', 1); } this.dir = this.chg; this.vx = this.chg * (330 + ph * 30); if (near && (this.rushHit || 0) <= 0) { P.hurt(14, this.x); this.rushHit = 0.6; G.shake(4, 0.2); Sound.play('punch'); } this.rushHit = (this.rushHit || 0) - dt; if (T > 0.9 || this.x <= 30 || this.x >= BR1 - 16) go('walk'); }
          else if (m === 'roll') { this.fan = 'roll'; this.vx = -this.dir * 300; if (T > 0.55) go('walk'); }
          else if (m === 'aim') { this.vx = 0; face(); this.fan = 'aim'; if (T > 0.35) go('burst', 'shoot'); }
          else if (m === 'burst') { this.vx = 0; this.fan = 'shoot'; const n = 3 + ph; if (this.fmN < n && T > this.fmN * 0.13) { this.fmN++; M.eb(this.x + this.dir * 30, this.y - 54, this.dir * 420, rnd(-20, 20), { kind: 'bolt', dmg: 7 }); Sound.play('shot', 0.5); } if (T > n * 0.13 + 0.3) go('walk'); }
          else if (m === 'nade') { this.vx = 0; face(); this.fan = 'grenade'; if (T > 0.3 && !this.fmN) { this.fmN = 1; M.eb(this.x + this.dir * 16, this.y - 70, dx * 0.85, -330, { kind: 'rocket', dmg: 12, grav: 0.6 }); Sound.play('throw', 0.6); } if (T > 0.7) go('walk'); }
          else if (m === 'slam') { this.fan = this.fjy > 0 ? 'jump' : 'land'; if (this.fjy <= 0 && T > 0.15) { this.vx = 0; G.shake(6, 0.35); Sound.play('boom', 0.8); for (const d of [-1, 1]) M.quakes.push({ x0: this.x, dir: d, sp: 300, t: 0, next: 0, pops: [], n: 4, dust: 1 }); go('walk'); } } }
        if (this.fm !== 'roll') this.roll = 0;
        if (this.formT <= 0 && !this.fjy) this.unmorph(); }
      else if (a === 'invis') { this.invT = 2 + ph * 0.6; Sound.play('zap', 0.4); this.done(); this.cd = 0.2; }
      else if (a === 'rain') { this.vx = 0;     // дождь из жижи по всей арене (тени-предупреждения)
        if (!this.shot && this.stT > 0.5) { this.shot = 1; const n = 8 + ph * 4; for (let i = 0; i < n; i++) M.drops.push({ x: rnd(10, VAT_R - 10), t: -i * (0.2 - ph * 0.02) - 0.6, y: -40 }); M.drops.push({ x: P.x, t: -0.7, y: -40 }); }
        if (this.stT > 0.9) this.done(); }
      this.x = this.fly > 0.3 ? clamp(this.x + this.vx * dt, 24, VAT_R - 20) : clamp(this.x + this.vx * dt, 24, BR1 - 12);     // по земле — только пол и мостик; над котлом — лишь в полёте
      if (this.fly < 0.3 && this.x > BR1 - 12) this.x = Math.max(BR1 - 12, this.x - 300 * dt);
      this.y = GY - this.fly * 120 - this.hop * 18 - (this.fjy || 0);
    }
    unmorph() { const P = LP(); this.form = null; this.fjy = 0; this.fjv = 0; this.rayR = null; this.roll = 0; this.fm = null; this.chg = 0; this.morphCd = 9 - this.ph; Sound.play('zap', 0.5);
      for (let i = 0; i < 5; i++) P.fx.push({ t: 0, sh: 'kFx9', fr: [i % 2 ? 'st0' : 'st1'], x: this.x + rnd(-20, 20), y: this.y - rnd(10, 70), vx: rnd(-30, 30), vy: -20, s: 0.3, life: 0.7, fade: 1 });
      if (this.act === 'form') this.done(); }
    drawForm(c) {     // облик прошлого босса — спрайты из прошлых уровней
      const f = this.form, t = this.t, mv = Math.abs(this.vx) > 1, atk = this.fa > 0, o = { scale: f.sc, alpha: this.vis };
      if (this.rayR && L4.drawRay) { c.save(); c.globalAlpha = 0.85 + Math.sin(t * 30) * 0.15; L4.drawRay(c, this.rayR, 0, 0, 0.3); c.restore(); }     // радуга Байкера
      if (f.set) Spr.drawAnim(c, f.set, this.fan || (mv ? f.walk : f.idle), t, this.x, this.y + 1, this.dir, o);
      else { const fr = atk || this.roll ? f.atkF : mv ? f.walkF[(t * 8 | 0) % f.walkF.length] : f.walkF[0];
        if (this.roll) { c.save(); c.translate(this.x, this.y - 30); c.rotate(this.dir * -this.roll * Math.PI * 2); Spr.draw(c, f.sheet, fr, 0, 30, this.dir, o); c.restore(); }
        else Spr.draw(c, f.sheet, fr, this.x, this.y + 1, this.dir * (f.flip ? -1 : 1), o); }
      if (this.formT > 0 && this.formT < 0.6 && (t * 14 | 0) % 2) SH(c, 'semB9', 'laugh', this.x, this.y + 1, 86, { flip: this.dir < 0, a: 0.5 });     // скоро вернётся в себя
    }
    done() { this.act = 'run'; this.stT = 0; this.cd = Math.max(0.15, 1.25 - this.ph * 0.22) + rnd(0, 0.35); this.ext = 0;
      if (this.ph >= 3 && Math.random() < 0.12 * (this.ph - 2)) this.cd = 0.05; }     // с 3-й фазы атаки идут сериями
    draw(c) {
      if (this.gone) return;
      const t = this.t, a = this.act; let fr = 'r' + ((t * (11 + this.ph) | 0) % 4), sh = 'semB9', hh = 86;
      if (this.form && !this.dying && this.slime <= 0) { this.drawForm(c); return; }
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
      if (sh === 'semB9') hh = fr === 'kneel' ? 66 : fr.startsWith('fly') ? 80 : fr === 'sky' ? 135 : 86;     // в «sky» над рукой молния — кадр выше
      const o = { flip: this.dir < 0, a: this.vis, rot: this.M.semRot || 0 };
      if (!this.dying && this.fly < 0.05 && !overPit(this.x)) S(c, 'props8', 'shadow', this.x, GY + 1, 0.8, { a: 0.4 * this.vis });
      SH(c, sh, fr, this.x, this.y + 1 + (this.M.semDy || 0), hh, o);
      if (this.fl > 0) SH(c, sh, fr, this.x, this.y + 1 + (this.M.semDy || 0), hh, Object.assign({}, o, { add: 1, a: 0.5 }));
      if (this.ext > 4 && has('semP9', 'seg')) { const [sx, sy] = this.shoulder(), [segW] = L9.size('semP9', 'seg'), k = 9 / L9.size('semP9', 'seg')[1], sw = segW * k;
        for (let d = 10; d < this.ext - 8; d += sw - 2) S(c, 'semP9', 'seg', sx + this.dir * (d + sw / 2), sy, k, { flip: this.dir < 0, a: this.vis });
        const [fx, fy] = this.fist(); SH(c, 'semP9', this.stT < 0.75 ? 'fistO' : 'fistC', fx, fy + 10, 20, { flip: this.dir < 0, a: this.vis }); }
      if (this.slime > 0 && (t * 10 | 0) % 3 === 0) LP().fx.push({ t: 0, sh: 'kFx9', fr: ['drops'], x: this.x + rnd(-14, 14), y: this.y - rnd(20, 70), vx: 0, vy: 40, g: 400, s: 0.1, life: 0.4 });
    }
  };

  // облики прошлых боссов (спрайты прошлых уровней): Кеша, Байкер, Ванделорд, Королева тараканов, Главарь спецназа
  if (!Spr.ANIM.chief9) { const A = (sh, fr, fps = 8) => ({ fr: fr.map(i => [sh, i]), fps }), r = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);     // главарь спецназа из ур.7
    Spr.ANIM.chief9 = { run: A('boss4a', r(0, 7), 11), shoot: A('boss4a', [8, 9], 10), roll: A('boss4a', [11]), aim: A('boss4a', [12]), grenade: A('boss4a', [18]),
      stand: A('boss4b', [0, 1], 2), taunt: A('boss4b', [2]), prejump: A('boss4b', [4]), jump: A('boss4b', [5]), punch: A('boss4b', [6, 7], 8), kick: A('boss4b', [8]), land: A('boss4b', [10]) }; }
  const FORMS = [
    { n: 'КЕША', set: 'kesha', idle: 'stand', walk: 'run', atk: 'kick', sc: 1, sp: 150, kind: 'kesha' },
    { n: 'БАЙКЕР', set: 'biker', idle: 'stand', walk: 'run', atk: 'throw', sc: 1, sp: 120, kind: 'biker' },
    { n: 'ВАНДЕЛОРД', set: 'vande', idle: 'stand', walk: 'run', atk: 'beam', sc: 1, sp: 130, kind: 'vande' },
    { n: 'ГЛАВАРЬ СПЕЦНАЗА', set: 'chief9', idle: 'stand', walk: 'run', sc: 0.95, sp: 170, kind: 'chief' },
  ];
  // иллюзии: враги прошлых уровней; убитые — растворяются, как мираж
  const ILLS = [
    { set: 'zomb5', walk: 'walk', atk: 'attack', sp: 70, hp: 6 },     // сумоист
    { set: 'zomb0', walk: 'walk', atk: 'attack', sp: 100, hp: 4 }, { set: 'zomb2', walk: 'walk', atk: 'attack', sp: 85, hp: 5 },
    { sheet: 'roach', walkF: [1, 2], atkF: 3, sc: 1, sp: 120, hp: 3 },     // таракан
    { set: 'gop7', walk: 'walk', atk: 'stand', sp: 110, hp: 4 }, { set: 'bomzh7', walk: 'walk', atk: 'stand', sp: 90, hp: 4 },
    { set: 'rat7', walk: 'walk', atk: 'slam', sp: 120, hp: 3 }, { set: 'viper', walk: 'walk', atk: 'strike', sp: 80, hp: 3 },
    { set: 'sailor', walk: 'walk', atk: 'attack', sp: 100, hp: 4 }, { set: 'whip', walk: 'walk', atk: 'attack', sp: 100, hp: 4 },
  ];
  let Ill = null;
  const mkIll = () => class extends F().Foe {
    constructor(M, x, y, d) { super(M, x, y, { maxHp: d.hp, w: 14, pts: 100 }); this.d = d; this.hp = d.hp; this.cd = 1; this.ap = 0; this.born = 0; this.ill = 1; }
    get h() { return 74; }
    ai(dt, P) { this.born += dt; this.cd -= dt; this.ap -= dt; const dx = P.x - this.x;
      this.vx = Math.abs(dx) > 30 && this.ap <= 0 ? Math.sign(dx) * this.d.sp : 0;
      if (Math.abs(dx) < 34 && Math.abs(P.y - this.y) < 50 && this.cd <= 0) { this.cd = 1.1; this.ap = 0.35; P.hurt(8, this.x); }
      this.phys(dt); }
    die() { this.dead = true; this.dis = 0; Sound.play('zap', 0.5); const lv = LP().lv; lv.stats.kills++; lv.score += 100;
      for (let i = 0; i < 4; i++) LP().fx.push({ t: 0, sh: has('kDart9', 'h0') ? 'kDart9' : 'fxL9', fr: [has('kDart9', 'h0') ? (i % 2 ? 'h0' : 'h1') : 'spark'], x: this.x + rnd(-14, 14), y: this.y - rnd(10, 60), vx: rnd(-20, 20), vy: -30, s: 0.25, life: 0.8, fade: 1, add: 1 }); }
    update(dt, P, lv) { if (this.dead) { this.dis += dt; if (this.dis > 0.8) this.gone = true; return; } super.update(dt, P, lv); }
    draw(c) {     // мерцает как мираж; растворяясь — расползается волнами и тает
      const d = this.d, t = this.t, u = this.dead ? this.dis / 0.8 : 0, a = (this.dead ? 1 - u : Math.min(1, this.born * 2)) * (0.78 + 0.12 * Math.sin(t * 7));
      const one = (ox, alpha) => { const o = { alpha }; if (d.set) Spr.drawAnim(c, d.set, this.ap > 0 ? d.atk : Math.abs(this.vx) > 1 ? d.walk : d.walk, t, this.x + ox, this.y + 1, this.dir, o); else Spr.draw(c, d.sheet, this.ap > 0 ? d.atkF : d.walkF[(t * 8 | 0) % d.walkF.length], this.x + ox, this.y + 1, -this.dir, Object.assign(o, { scale: d.sc })); };
      if (!this.dead) { one(0, a); c.save(); c.globalCompositeOperation = 'lighter'; one(Math.sin(t * 9) * 2, 0.12); c.restore(); return; }
      for (let i = 0; i < 8; i++) { const y0 = this.y - 90 + i * 12; c.save(); c.beginPath(); c.rect(this.x - 60, y0, 120, 12); c.clip(); one(Math.sin(i * 1.3 + t * 18) * u * 26, a); c.restore(); }
    }
  };
  L9.MAPS.semen = () => {
    const LM = L9.MAPS.lab();
    const M = {
      x0: 0, x1: W, y0: -40, y1: 460, killY: 2000,
      solids: [[0, GY, BR0, 260, 'hide'], [BR0, GY, BR1 - BR0, 16, 'hide'], [-40, -300, 40, 900, 'hide'], [VAT_R, -300, 60, 900, 'hide']],
      walks: [], ladders: [[LAD_X, GY - 190, GY]], cks: [[60, GY]], picks: [],
    };
    M.killAt = () => M.killY;
    M.dmgK = 0.65;     // долгий бой: урон по Валере x0.75
    M.camY = gy => GY - 180;
    M.init = (P, lv, ck) => {
      if (!Sem) Sem = mkSem();
      G.portraits = G.portraits || {};
      for (const k of ['semen', 'semen2']) if (!G.portraits[k]) G.loadImage('assets/spr/p_' + k + '.png').then(im => G.portraits[k] = im, () => {});
      M.t = 0; M.strikes = []; M.drops = []; M.quakes = []; M.cut = 1; M.started = 0; M.sitFr = null; M.semRot = 0; M.semDy = 0; M.melt = 0; M.boil = 0;
      M.lad = LADLES.map(l => { const d = l.sl < l.x ? 1 : -1; return { ...l, d, zx: l.x + d * LAD_LIP, st: 'full', t: 0, pull: 0, lvl: 1 }; });     // носик — в сторону от стропы
      M.caps = []; M.capT = 0.5; M.bubs = []; M.illOn = 0; M.illT = 2; M.dart = null; M.dartPend = 0;
      M.reveal = !KEEP; M.fig = null; M.cloak = null; M.fb = null;     // разоблачение — только при первом входе, после смерти бой сразу
      if (!KEEP) PH_SAVE = 1; KEEP = 0; if (PH_SAVE >= 3) { M.illOn = 1; M.illT = 3; } M.boss = new Sem(M, 760, GY); M.boss.ph = PH_SAVE; M.boss.hp = 100 - (PH_SAVE - 1) * 20; P.foes.push(M.boss);
      M.picks = [['kefir', 270, GY], ['rocket', 60, GY]].map(([kind, x, y]) => ({ kind, x, y, t: 0 })); M.pickT = 22;
      P.x = 60; P.dir = 1; P.hide = 0; P.melted = 0;
    };
    M.eb = (x, y, vx, vy, o) => LP().ebul.push(Object.assign({ x, y, vx, vy, t: 0, dmg: 10, s: 1,
      draw: (c, e) => { const fr = e.kind === 'rocket' ? 'rocket' : 'bolt'; SH(c, 'semP9', fr, e.x, e.y, fr === 'rocket' ? 12 : 16, { rot: Math.atan2(e.vy, e.vx), add: fr === 'bolt' ? 1 : 0 }); },
      onLand: e => { LP().fx.push({ t: 0, sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2'], x: e.x, y: e.y - 6, s: e.kind === 'rocket' ? 0.5 : 0.25, life: 0.3, add: 1 }); } }, o));
    // ---------- сцены ----------
    const throwMask = (fr, x) => { const P = LP(); P.fx.push({ t: 0, sh: 'maskZ9', fr: [fr], x, y: GY - 72, vx: 70, vy: -300, g: 640, s: 1, life: 1.5, rot: 0.4 }); Sound.play('punch'); G.shake(2, 0.15); };
    const puff = (x, y, n = 6) => { const P = LP(); for (let i = 0; i < n; i++) P.fx.push({ t: 0, sh: 'fxZ9', fr: ['sm1'], x: x + rnd(-24, 24), y: y + rnd(-50, 10), vx: rnd(-20, 20), vy: rnd(-40, -10), g: 0, s: rnd(0.35, 0.6), life: 1.1, fade: 1 }); };
    M.revealScript = function* () {     // разоблачение (дословно по ТЗ, перенесено из части «закрытый завод»): Икс -> Кеша -> Граблионок -> Семён; речь с флешбеками
      const P = LP(), D = 0.016, b = M.boss, MEET = 250; Scene.dialogTop = false;
      b.vis = 0; b.x = 900; P.vx = 0; P.st = 'stand'; P.dir = 1; P.inv = 0;     // неуязвимость в сцене не убывает — иначе Валера мигает всю сцену
      const f = M.fig = { sh: 'maskZ9', fr: 'hood', x: MEET + 130, a: 0, dir: -1 };
      for (let t = 0; t < 1.2; t += D) { f.a = t / 1.2 * 0.55; yield D; }
      yield* Scene.say('mrx', 'Ну, пора бы раскрыть все карты.', null);
      Sound.play('door', 0.5); while (f.x > MEET) { f.x -= 55 * D; f.a = Math.min(1, f.a + D * 0.6); f.walk = (f.walk || 0) + D; yield D; } f.walk = 0; f.a = 1;
      yield 0.4; Sound.play('zap'); G.flash(0.12, '#8f8'); puff(f.x, GY - 40, 8); M.cloak = { x: f.x + 6 }; f.fr = 'k0'; yield 0.9;
      yield* Scene.say('valera', 'Кеша, не может быть!', null);
      f.fr = 'k1'; yield 0.9; f.fr = 'k0';
      P.st = 'run'; while (P.x < f.x - 64) { P.x += 120 * D; yield D; } P.st = 'butt'; P.stT = 0; yield 0.12;
      throwMask('mk', f.x); f.fr = 'g0'; puff(f.x, GY - 70, 3); yield 0.4; P.st = 'stand'; yield 0.4;
      yield* Scene.say('valera', 'Это всё был ты?', null);
      f.fr = 'g1'; yield 1.0; f.fr = 'g0'; yield 0.2;
      P.st = 'butt'; P.stT = 0; yield 0.12; throwMask('mg', f.x); f.sh = 'semZ9'; f.fr = 'talk'; puff(f.x, GY - 70, 3); yield 0.4; P.st = 'stand';
      for (let t = 0; t < 0.6; t += D) { P.x -= 90 * D; yield D; }
      yield 0.5; f.fr = 'laugh'; yield 0.6; f.fr = 'talk';
      yield* Scene.say('valera', 'Семён, это ты? Ты же большой человек в приёмке завода!', null);
      M.fb = { img: 'zfbA', t: 0 }; f.fr = 'talk';
      yield* Scene.say('semen', 'Да, Валера, я всё это время был рядом, изучал тебя, смотрел твои возможности, пытался сломать тебя, унизить, совратить!', null);
      while (M.fb.t < 7.2) yield D; M.fb = null; f.fr = 'point';
      yield* Scene.say('semen', 'Я устал быть пешкой на этом заводе, я договорился со столицей, что принесу им все деньги этого города!', null);
      f.fr = 'fist'; G.shake(2, 0.3);
      yield* Scene.say('semen2', 'Звёзды на погонах меня изменили!', null);
      f.fr = 'talk'; M.fb = { img: 'zfbB', t: 0 };
      yield* Scene.say('semen', 'У меня созрел план, нужно было, правда, Граблионка и Кешу подчинить и устранить…', null);
      while (M.fb.t < 7.2) yield D; M.fb = null; f.fr = 'laugh'; Sound.play('confirm', 0.5); yield 1.0;
      yield* Scene.say('valera', 'Я не дам сбыться твоей мечте! Я не продам свою родину!', null);
      f.fr = 'fist'; yield 0.6;
      b.x = f.x; b.dir = P.x < b.x ? -1 : 1; b.vis = 1; M.fig = null; M.cloak = null;     // дальше — сам босс на месте фигуры
    };
    M.introScript = function* () {
      if (M.reveal) { M.reveal = 0; yield* M.revealScript(); }
      const P = LP(), b = M.boss; Scene.dialogTop = true; P.st = 'stand';
      b.act = 'roar'; b.stT = 0; b.auraT = 1.6; yield 0.3; M.camT = 320; G.shake(3, 0.5); Sound.play('boom', 0.5); yield 1.4; M.camT = null; yield 0.3;
    };
    M.finish = () => { Scene.run(M.endScript, () => LP().lv.next()); };
    M.endScript = function* () {     // Семён шатается к щели и падает в котёл; Валера садится на пирс
      const P = LP(), D = 0.016, b = M.boss; M.cut = 1; Scene.dialogTop = true; P.foes = P.foes.filter(f => f === b); P.ebul = []; M.strikes = []; M.drops = []; M.quakes = [];
      b.fly = 0; b.hop = 0; b.y = GY; b.vis = 1; b.ext = 0; b.slime = 0; b.auraT = 0;
      const gx = BR1 + 16; b.dir = 1; M.camT = W - 640;     // шатается к краю мостика и падает в котёл
      const spd = Math.max(60, Math.abs(gx - b.x) / 2.4); for (let t = 0; t < 4 && Math.abs(b.x - gx) > 3; t += D) { b.x += b.dir * spd * D; M.semRot = Math.sin(t * 9) * 0.16; M.semFr = (t * 4 | 0) % 2 ? 'stagger' : 'kneel'; yield D; }
      M.semFr = 'stagger'; Sound.play('shout'); let vy = -140;
      for (let t = 0; t < 1.6; t += D) { vy += 900 * D; M.semDy += vy * D; M.semRot += 2.5 * D * b.dir; yield D; if (M.semDy > 110) break; }
      b.gone = true; Sound.play('stomp'); G.shake(6, 0.6); M.splash(b.x, 2.2);
      yield 1.0; const sx = 330; M.camT = W - 640;
      P.st = 'run'; P.dir = sx > P.x ? 1 : -1; for (let t = 0; t < 5 && Math.abs(P.x - sx) > 4; t += D) { P.x += P.dir * 120 * D; if (overPit(P.x)) P.y = GY; yield D; }
      P.st = 'stand'; yield 0.4; P.hide = 1; M.sitFr = 'sit'; Sound.play('land'); yield 1.0; M.sitFr = 'belly';
      yield* Scene.say('valera', 'Что-то я проголодался.', null);
      M.boil = 1; Sound.play('thunder'); G.shake(5, 1.6); yield 0.8; M.sitFr = 'look'; M.camT = 160;
      yield* Scene.say('semen2', 'Валера, я тебе не какой-то там проходнячок.', null);
      yield 0.6;
    };
    M.cutUpdate = (dt, P) => { P.t += dt; M.t += dt; if (M.fb) M.fb.t += dt; M.mech(dt, P, true); M.bgUpd(dt);
      if (M.camT != null) P.cam.x += (clamp(M.camT, 0, W - 640) - P.cam.x) * Math.min(1, dt * 2.5); else P.camera(dt); P.updFx(dt); };
    // всплеск в котле
    M.splash = (x, s = 1) => { const P = LP(); P.fx.push({ t: 0, sh: 'kCap9', fr: ['splash'], x, y: GY + 44, s: 0.5 * s, life: 0.6 });
      for (let i = 0; i < 6 * s; i++) P.fx.push({ t: 0, sh: 'kFx9', fr: ['drops'], x: x + rnd(-30, 30) * s, y: GY + 46, vx: rnd(-80, 80), vy: rnd(-280, -140), g: 700, s: rnd(0.12, 0.22), life: 0.9 });
      P.fx.push({ t: 0, sh: 'kFx9', fr: ['st0'], x, y: GY + 40, vx: 0, vy: -30, s: 0.5 * s, life: 1.2, fade: 1 }); Sound.play('splash'); };
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
      for (const q of M.quakes || []) { q.t += dt; const hd = q.sp * q.t;     // мухоморы из-под земли бегут по полу (приём Ванделорда / волна главаря)
        while (q.next * 30 < hd && (!q.n || q.next < q.n)) { const x = q.x0 + q.dir * (36 + q.next * 30); q.next++; if (x > 6 && x < BR1 + 4) { q.pops.push({ x, t: 0 }); if (q.dust) P.fx.push({ t: 0, sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2'], x, y: GY - 10, s: 0.35, life: 0.3, add: 1 }); if (q.next % 2) Sound.play('punch', 0.3); } }
        for (const p of q.pops) { p.t += dt; if (!cut && !p.hit && p.t > 0.08 && p.t < 0.45 && Math.abs(P.x - p.x) < 16 && P.y > GY - 40) { p.hit = 1; P.hurt(9, p.x); } }
        q.pops = q.pops.filter(p => p.t < 0.8); q.dead = q.pops.length === 0 && (q.n ? q.next >= q.n : hd > 700); }
      M.quakes = (M.quakes || []).filter(q => !q.dead);
      for (const d of M.drops) { d.t += dt; if (d.t > 0) { d.y += (300 + d.t * 600) * dt; const fy = inPit(d.x) ? GY + 44 : GY - 4; if (d.y > fy) { d.dead = 1; P.fx.push({ t: 0, sh: 'kFx9', fr: ['spl'], x: d.x, y: fy, s: 0.2, life: 0.3 }); if (!cut && Math.abs(P.x - d.x) < 16 && Math.abs(P.y - GY) < 30) P.hurt(6, d.x); } } }
      M.drops = M.drops.filter(d => !d.dead);
      for (const e of P.ebul) if (e.home && e.t > 0.3 && e.t < 2.4) { const ang = Math.atan2(P.y - 40 - e.y, P.x - e.x), sp = Math.hypot(e.vx, e.vy) + 140 * dt, cur = Math.atan2(e.vy, e.vx); let da = ang - cur; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; const na = cur + clamp(da, -2.2 * dt, 2.2 * dt); e.vx = Math.cos(na) * Math.min(330, sp); e.vy = Math.sin(na) * Math.min(330, sp); }
    };
    // фон: капсулы на монорельсе среднего плана (координаты — пиксели исходника kMid)
    M.bgUpd = dt => {
      M.capT -= dt; if (M.capT <= 0) { M.capT = rnd(3.5, 5.5); M.caps.push({ x: -30, v: rnd(38, 52), tg: rnd(450, 570), st: 'go', t: 0 }); }
      for (const q of M.caps) { q.t += dt;     // капсулы на рельсе у потолка: над котлом раскрываются, человек падает в жижу
        if (q.st === 'go') { q.x += q.v * dt; if (q.tg && Math.abs(q.x - q.tg) < 2) { q.st = 'open'; q.t = 0; } }
        else if (q.st === 'open' && q.t > 0.45) { q.st = 'fall'; q.t = 0; q.my = RAIL_Y + 30; q.vy = 0; }
        else if (q.st === 'fall') { q.vy += 900 * dt; q.my += q.vy * dt; if (q.my > GY + 36) { q.st = 'go'; q.tg = null; q.empty = 1; Sound.play('splash', 0.25);
          for (let i = 0; i < 3; i++) LP().fx.push({ t: 0, sh: 'kFx9', fr: ['spl'], x: q.x + rnd(-8, 8), y: GY + 30, s: 0.25, life: 0.35 }); } }
        if (q.x > W + 60) q.dead = 1; }
      M.caps = M.caps.filter(q => !q.dead);
    };
    M.update = (dt, P, lv) => {
      M.t += dt; M.bgUpd(dt);
      if (M.dartPend && !M.cut && !Scene.active && M.boss && M.boss.slime <= 0) { M.dartPend = 0; Scene.run(M.dartScript, () => { M.cut = 0; M.illOn = 1; M.illT = 1.5; lv.say('ИЛЛЮЗИИ! БЕЙ ИХ — ОНИ РАСТВОРЯЮТСЯ', 2.5); }); return; }
      if (M.illOn) M.illUpd(dt, P, lv);
      if (M.cut === 1 && !M.started) { M.started = 1; Scene.run(M.introScript, () => { M.cut = 0; lv.say('ДЁРНИ СТРОПУ — ОБЛЕЙ СЕМЁНА ЖИЖЕЙ!', 3); }); return; }
      if (M.melt) { M.melt += dt; P.vx = 0; P.vy = 0; P.y = GY + 48; return; }
      M.mech(dt, P, false);
      if (P.st === 'hurt' && P.vx > 0 && P.x > BR1 - 70) P.vx *= 0.25;     // у края мостика удар почти не отбрасывает в котёл
      // упал в котёл — сразу растворяется
      if (inPit(P.x) && P.y > GY + 40) { M.melt = 0.001; P.hide = 1; P.melted = 1; P.inv = 0; M.splash(P.x, 1.2); for (let i = 0; i < 4; i++) P.fx.push({ t: 0, sh: 'kFx9', fr: ['st1'], x: P.x + rnd(-12, 12), y: GY + 50, vx: 0, vy: -40, s: 0.3, life: 1.4, fade: 1 }); lv.say('ВАЛЕРА РАСТВОРИЛСЯ', 2); lv.hurt(999); return; }
      for (const l of M.lad) if (Math.abs(P.x - l.sl) < 26 && P.onG) {
        if (l.st === 'full') { P.hintAt('ВВЕРХ — ДЁРНУТЬ СТРОПУ', 0.3); if (G.Input.pressed('up')) { l.st = 'tilt'; l.t = 0; l.pull = 0.6; Sound.play('clank'); } }
        else P.hintAt('КОВШ НАПОЛНЯЕТСЯ...', 0.3); }
      for (const k of M.picks) { k.t += dt; if (!k.dead && Math.abs(P.x - k.x) < 22 && Math.abs(P.y - k.y) < 40) LM.take(k, P, lv); }
      M.picks = M.picks.filter(k => !k.dead);
      M.pickT -= dt; if (M.pickT <= 0 && M.picks.length < 2) { M.pickT = 15; M.picks.push({ kind: ['kefir', 'grenades', 'plasma', 'pies'][rnd(0, 4) | 0], x: [50, 250, 400][rnd(0, 3) | 0], y: GY, t: 0 }); }
    };
    // иллюзии: появляются по одной, не больше 3 сразу (с 4-й фазы — до 4)
    M.illUpd = (dt, P, lv) => {
      if (!Ill) Ill = mkIll(); M.illT -= dt; const n = P.foes.filter(f => f.ill && !f.dead).length, mx = M.boss && M.boss.ph >= 4 ? 4 : 3;
      if (M.illT <= 0 && n < mx) { M.illT = rnd(3, 5) - (M.boss ? M.boss.ph * 0.3 : 0); let x = 0; for (let k = 0; k < 6; k++) { x = rnd(30, BR1 - 30); if (Math.abs(x - P.x) > 90) break; }
        P.foes.push(new Ill(M, x, GY, ILLS[(Math.random() * ILLS.length) | 0])); Sound.play('zap', 0.3);
        for (let i = 0; i < 3; i++) P.fx.push({ t: 0, sh: has('kDart9', 'h0') ? 'kDart9' : 'fxL9', fr: [has('kDart9', 'h0') ? 'h0' : 'spark'], x: x + rnd(-12, 12), y: GY - rnd(10, 60), vx: 0, vy: -20, s: 0.25, life: 0.6, fade: 1, add: 1 }); }
    };
    // мини-катсцена: Семён стреляет в Валеру дротиком — начинаются галлюцинации
    M.dartScript = function* () {
      const P = LP(), b = M.boss, D = 0.016; M.cut = 1; Scene.dialogTop = true; P.ebul = []; M.strikes = []; M.drops = []; M.quakes = [];
      if (b.form) b.unmorph(); b.fly = 0; b.y = GY; b.act = 'bolt'; b.stT = 0; b.dir = P.x < b.x ? -1 : 1; b.invT = 0; b.vis = 1; P.st = 'stand';
      yield 0.5; Sound.play('throw');
      const [fx, fy] = b.fist(); M.dart = { x: fx + b.dir * 20, y: fy, vx: b.dir * 420 };
      while (M.dart && Math.abs(M.dart.x - P.x) > 8) { M.dart.x += M.dart.vx * D; M.dart.y += ((P.y - 50) - M.dart.y) * 0.08; yield D; }
      M.dart = null; Sound.play('hurt'); G.flash(0.25, '#7f7'); G.shake(4, 0.4); P.st = 'hurt';
      for (let i = 0; i < 6; i++) P.fx.push({ t: 0, sh: has('kDart9', 'h0') ? 'kDart9' : 'fxL9', fr: [has('kDart9', 'h0') ? (i % 2 ? 'h0' : 'h1') : 'spark'], x: P.x + rnd(-20, 20), y: P.y - rnd(30, 80), vx: rnd(-30, 30), vy: -20, s: 0.35, life: 1.4, fade: 1, add: 1 });
      yield 0.6; P.st = 'stand';
      yield* Scene.say('semen', 'Сладких снов, Валерий. Поздоровайся со старыми друзьями.', null);
      M.illOn = 1; if (!Ill) Ill = mkIll();
      for (let i = 0; i < 3; i++) { const x = [40, 220, BR1 - 30][i]; P.foes.push(new Ill(M, x, GY, ILLS[(Math.random() * ILLS.length) | 0])); Sound.play('zap', 0.3); yield 0.35; }
      yield* Scene.say('valera', 'Чё за... Тараканы? Зомби?! Опять вы?!', null);
      b.act = 'run'; b.stT = 0;
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
      const fim = L9.img.kCave || L9.img.kFar; if (fim) { const h = 480, w = fim.width * h / fim.height, y = -112 - (cy - 150) * 0.05; for (let x = -((cx * 0.12 % w) + w) % w; x < 640; x += w) c.drawImage(fim, Math.floor(x), Math.round(y), Math.ceil(w) + 1, h); }     // вдали — пещера (середина кадра с просветом — в видимой полосе над средним планом)
      haze(c, 0.18);
      for (let i = 0; i < 6; i++) { const X = ((i * 190 - cx * 0.15) % 1140 + 1140) % 1140 - 100, u = ((t * 0.1 + i * 0.31) % 1); S(c, 'fxZ9', 'sm0', X, fy - 120 - u * 190, 0.9 + u, { a: 0.2 * (1 - u) }); }
      fog(c, t, 5, 60, 200, 6, 0.10, 2.4, 0.15, cx);
      // средний план: котлы, трубы, монорельс; капсулы едут и сбрасывают людей
      // монорельс у потолка (чистый отрезок рельса из старого среднего плана) и капсулы со спящими
      if (has('kRail9', 'rail')) { const rk = 0.56, [rw] = L9.size('kRail9', 'rail'), tw = rw * rk, ry = RAIL_Y - cy;
        for (let x = -((cx % tw) + tw) % tw - tw / 2; x < 640 + tw; x += tw) S(c, 'kRail9', 'rail', Math.round(x + tw / 2), ry, rk);
        for (const q of M.caps) { const qx = q.x - cx; if (qx < -40 || qx > 680) continue;
          const fr = q.st === 'open' ? (q.t < 0.22 ? 'hang' : 'open') : q.st === 'fall' && q.t < 0.15 ? 'drop' : q.empty || q.st === 'fall' ? 'empty' : 'hang';
          SH(c, 'kCap9', fr, qx, ry + 22, 34);
          if (q.st === 'fall' && q.t >= 0.15) SH(c, 'kCap9', 'man', qx, q.my - cy, 13, { rot: q.t * 3 }); } }
      haze(c, 0.22);
      fog(c, t, 6, 120, 260, 9, 0.12, 2.0, 0.35, cx);
    };
    M.drawMid = (c, P) => {
      if (M.cloak) SH(c, 'maskZ9', 'cloak', M.cloak.x, GY + 2, 22);
      { const f = M.fig; if (f) { const bob = f.walk ? Math.abs(Math.sin(f.walk * 8)) * 2 : 0, h = f.sh === 'semZ9' ? 86 : f.fr === 'hood' ? 92 : 84; SH(c, f.sh, f.fr, f.x, GY + 2 - bob, h, { flip: f.sh === 'semZ9', a: f.a ?? 1 }); } }
      const t = M.t;
      // пол и мостик — одна картинка Flow строго сбоку (мостик без перил, труба с жижей из пола); затем котёл перекрывает низ опор
      const vy = GY + 34;     // верх края котла
      if (has('kFB9', 'fb')) { const [fw0, fh0] = L9.size('kFB9', 'fb'), kb = (BR1 - BR0) / (fw0 * 420 / 680), w0 = fw0 * kb, h0 = fh0 * kb, x0 = BR0 - w0 * 252 / 680; S(c, 'kFB9', 'fb', x0 + w0 / 2, GY - 22 * kb * 0.5 + h0 / 2, kb); }     // пол с мостиком — картинка владельца: стена пола до 252 px, мостик до 672 px
      if (has('kSet9', 'vat')) { const vw = 470, [fw, fh] = L9.size('kSet9', 'vat'), k = vw / fw, vh = fh * k; S(c, 'kSet9', 'vat', 370, vy - vh * 0.13 + vh / 2, k); }
      for (let i = 0; i < (M.boil ? 9 : 5); i++) { const u = (t * (M.boil ? 1.4 : 0.5) + i * 0.27) % 1; S(c, 'kFx9', i % 2 ? 'st0' : 'st1', 160 + i * 52 + Math.sin(i * 3 + t) * 10, vy - 4 - u * 70, 0.15 + u * 0.35, { a: 0.5 * (1 - u) }); }
      for (let i = 0; i < 4; i++) { const u = (t * 0.8 + i * 0.41) % 1; if (u < 0.25) S(c, 'kFx9', 'spl', 170 + ((i * 131 + (t * 0.8 | 0) * 77) % 400), vy + 2, 0.14 + u * 0.4, { a: 1 - u * 4 }); }
      if (has('kFl9', 'ladder')) { const [lw, lh] = L9.size('kFl9', 'ladder'), lk = 34 / lw, h2 = lh * lk; for (let y = GY + 2; y > P.cam.y - 40; y -= h2 - 6) S(c, 'kFl9', 'ladder', LAD_X, y - h2 / 2, lk); }
      // чаны под потолком; стропа: блок у потолка, двойной трос вниз к ручке, от блока трос к краю чана (дёрнул — чан наклоняется)
      const rope = (x0, y0, x1, y1) => { if (!has('kSl9', 'rope')) return; const rk = 0.26, st = 184 * rk * 0.5, L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0) - Math.PI / 2;
        for (let dd = st / 2; dd < L + st / 2; dd += st) { const u = Math.min(dd, Math.max(st / 2, L - st / 2)) / L, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; S(c, 'kSl9', 'rope', x + 26.5 * rk * 0.5 * Math.cos(a), y + 26.5 * rk * 0.5 * Math.sin(a), rk, { rot: a }); } };
      for (const l of M.lad) {
        const cyL = LAD_TOP + LAD_H / 2, d = l.d, tilt = l.st === 'tilt' || l.st === 'pour' || l.st === 'thin' || l.st === 'tE';
        // патрубок в потолке: пока чан наполняется — струя в него
        if (has('kFl9', 'pipe')) { const pk = 0.25, ox = l.x - d * 26, py0 = LAD_TOP - 14;
          // патрубок убран: наполнение — струя из-за балки
          if (l.st === 'fill') stream(c, ox, P.cam.y - 4, cyL + 16 - l.lvl * 12, 7, t, 0.8); }
        // кадр чана (носик — в сторону от стропы)
        let fr = 'full', fr2 = null, fa = 0;
        if (l.st === 'fill') { const q = l.lvl * 3, i0 = Math.min(2, q | 0); fr = ['e', 'q1', 'q2'][i0]; fr2 = ['q1', 'q2', 'full'][i0]; fa = q - i0; }
        else if (l.st === 'tilt') fr = 't25'; else if (l.st === 'pour') fr = 'pour'; else if (l.st === 'thin') fr = 'thin'; else if (l.st === 'tE') fr = 'tE';
        SH(c, 'kLad9', fr, l.x, cyL, LAD_H, { flip: d < 0 }); if (fr2 && fa > 0.02) SH(c, 'kLad9', fr2, l.x, cyL, LAD_H, { a: fa, flip: d < 0 });
        if (l.st === 'full' && (t * 3 | 0) % 2) SH(c, 'kFx9', 'drops', l.x - 3 * d, LAD_TOP + 24, 7, { a: 0.6 });
        if (l.st === 'pour' || l.st === 'thin') stream(c, l.zx, cyL - 6, GY + 2, l.st === 'pour' ? 15 : 6, t, 1.6);     // от носика до пола одной текущей струёй
        // стропа
        if (has('kSl9', 'rest')) { const sk = 0.42, q = sk * 0.5, sg = l.sl > l.x ? -1 : 1, fx = l.sl - sg * (122 - 84) * q, pul = l.pull > 0 ? Math.min(1, l.pull * 3) : 0;
          const y0 = PUL_Y - 23 * q, hy = GY - 36 + pul * 8, y1 = hy - 350 * q;
          rope(l.sl - 14, PUL_Y - 6, l.x - d * 20, LAD_TOP + (tilt ? 20 : 30));     // от блока к краю чана
          for (const qq of [-1]) rope(l.sl + qq * 23 * q, PUL_Y, l.sl + qq * 23 * q, y1 + 258 * q);     // трос вниз (правый убран по просьбе владельца)
          c.save(); c.beginPath(); c.rect(l.sl - 30, y1 + 255 * q, 60, 100 * q); c.clip(); S(c, 'kSl9', 'rest', fx, y1 + 190 * q, sk, { flip: sg < 0 }); c.restore();     // кольцо и ручка
          if (l.st === 'full' && Math.abs(P.x - l.sl) < 70) S(c, 'fxL9', 'spark', l.sl, hy - 6, 0.4 + Math.sin(t * 6) * 0.1, { add: 1, a: 0.6 }); }
        if (l.st === 'fill') G.text(Math.ceil(REFILL * (1 - l.lvl)) + '', l.sl, GY - 100, { align: 'center', size: 8, color: '#7fe0c0', outline: true });
      }
      if (has('kBeam9', 'bM')) { const bw = n => { const [w, h] = L9.size('kBeam9', n); return BEAM_H * w / h; }, yb = BEAM_T + BEAM_H / 2, x0 = 150, x1 = 640;     // балка: концы и тайл середины
        for (const l of M.lad) { const [hw, hh] = L9.size('kBeam9', 'hoist'); SH(c, 'kBeam9', 'hoist', l.x + 2, BEAM_T + BEAM_H - 2 + HOIST_H / 2, HOIST_H);
          SH(c, 'kBeam9', 'pulley', l.sl - 13, BEAM_T + BEAM_H - 2 + PUL_H / 2, PUL_H); }
        const wl = bw('bL'), wm = bw('bM'); SH(c, 'kBeam9', 'bL', x0 + wl / 2, yb, BEAM_H);
        for (let x = x0 + wl; x < x1; x += wm - 0.5) SH(c, 'kBeam9', 'bM', x + wm / 2, yb, BEAM_H); }
      for (const q of M.quakes || []) if (!q.dust) for (const p of q.pops) { const k = p.t, fr = k < 0.08 ? 6 : k < 0.18 ? 7 : 8, rise = k < 0.18 ? k / 0.18 : 1, ff = Spr.frame && Spr.frame('vfx6', fr), h = ff ? ff[3] / 2 : 40;
        c.save(); c.globalAlpha = k > 0.55 ? Math.max(0, 1 - (k - 0.55) / 0.25) : 1; Spr.drawC(c, 'vfx6', fr, p.x, GY + 6 - h * 0.5 * rise, 0, 0.75); c.restore(); }
      // молнии: метка на полу, затем разряд сверху
      for (const s of M.strikes) { if (s.t < 0) continue; if (s.t < 0.7) { if ((t * 14 | 0) % 2) S(c, 'fxZ9', 'sp0', s.x, GY - 4, 0.3 + s.t * 0.4, { add: 1 }); }
        else if (has('semP9', 'light')) { const [, lh] = L9.size('semP9', 'light'), k = 26 / L9.size('semP9', 'light')[0]; const top = P.cam.y - 4, hh = GY - top; S(c, 'semP9', 'light', s.x, top + hh / 2, k, { add: 1, sy: hh / (lh * k), flip: (t * 20 | 0) % 2 }); } }
      for (const d of M.drops) { if (d.t < 0) { if (d.t > -0.6 && !inPit(d.x)) S(c, 'props8', 'shadow', d.x, GY + 1, 0.4 + (0.6 + d.t), { a: 0.5 }); continue; } SH(c, 'semP9', 'drop', d.x, d.y, 18); }
      if (M.dart) SH(c, has('kDart9', 'd0') ? 'kDart9' : 'semP9', has('kDart9', 'd0') ? ((t * 12 | 0) % 2 ? 'd0' : 'd1') : 'bolt', M.dart.x, M.dart.y, 10, { flip: M.dart.vx < 0 });
      if (M.sitFr) SH(c, 'vSit9', M.sitFr, P.x, GY + 2, 56);
      for (const k of M.picks) { const bob = Math.sin(k.t * 4) * 2; if (k.kind === 'pelmeni' || k.kind === 'kefir' || k.kind === 'pies') Art.item(c, k.kind, k.x, k.y - 14 + bob, 0, 1); else { S(c, 'fxL9', 'spark', k.x, k.y - 14, 0.4, { add: 1 }); S(c, 'pick9', k.kind, k.x, k.y - 16 + bob, 1); } }
    };
    M.drawFront = () => {};
    M.drawFb = (c) => {     // флешбеки: панели комикса по очереди, медленный наезд, затемнение по краям
      const fb = M.fb, im = fb && L9.img[fb.img]; if (!im) return;
      const t = fb.t, i = Math.min(3, t / 1.8 | 0), u = (t % 1.8) / 1.8, a = clamp(Math.min(t / 0.4, (7.6 - t) / 0.4), 0, 1);
      const pw = im.width / 2, ph = im.height / 2, sx = (i % 2) * pw, sy = (i / 2 | 0) * ph, z = 1.04 + u * 0.06, dw = 640 * z, dh = 360 * z;
      c.save(); c.globalAlpha = a; c.fillStyle = '#000'; c.fillRect(0, 0, 640, 360);
      c.drawImage(im, sx + 4, sy + 4, pw - 8, ph - 8, 320 - dw / 2 - (i % 2 ? 1 : -1) * u * 10, 180 - dh / 2, dw, dh);
      const g = c.createRadialGradient(320, 180, 120, 320, 180, 380); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,6,0,0.75)'); c.fillStyle = g; c.fillRect(0, 0, 640, 360);
      c.restore();
    };
    M.drawOver = (c, cx) => { M.drawFb(c); const t = M.t; if (M.illOn && has('kDart9', 'h0')) for (let i = 0; i < 3; i++) { const u = (t * 0.07 + i * 0.33) % 1; S(c, 'kDart9', i % 2 ? 'h0' : 'h1', ((i * 230 + t * 18) % 760) - 60, 60 + i * 90 + Math.sin(t + i) * 20, 1.6, { a: 0.07 + 0.04 * Math.sin(t * 2 + i), add: 1, rot: t * 0.2 * (i % 2 ? 1 : -1) }); } fog(c, t, 4, 230, 330, 14, 0.09, 2.6, 1.1, cx); };     // ближняя дымка у пола поверх всего
    M.drawHud = (c) => {     // шкала Семёна: 5 серий
      const b = M.boss; if (!b || M.cut === 1 && !M.started) return;
      const x = 420, y = 24, w = 200; c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x - 4, y - 14, w + 8, 24);     // шкала сверху — котёл внизу не закрыт
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
