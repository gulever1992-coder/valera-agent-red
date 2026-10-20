// Уровень 9, часть 4 «ПРОФЕССОР САНЯ» (L9_TZ.md, п.4): мастерская Сани — верстак с роботом-пауком, робот-собака, огромные 3D-принтеры.
// Катсцена на движке (диалог дословно по ТЗ) -> Саня в сканере под бронестеклом уезжает к рельсу под потолком, принтеры печатают его копии.
// Бой: бежать вперёд и стрелять по аккумуляторам на стене — без питания принтер взрывается; сканер едет следом по рельсу и стреляет.
// Все аккумуляторы разбиты — вагонетка искрит, Санёк паникует, сканер взрывается, открывается дверь дальше.
// Движок платформера — L9.PARTS.lab (js/level9lab.js) с картой L9.MAPS.sanya. Арт — Flow (tools/p9/flow9s.js -> build_l9.py: san9, sclone9, scan9, prn9, bat9, srail9, robo9, p_sanya*).
(() => {
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd, LAB = L9.LAB;
  WHO.sanya = { name: 'САНЯ', color: '#7fe0c0', voice: 200 };
  WHO.sanya2 = { name: 'САНЯ', color: '#7fe0c0', voice: 200 };
  const FL = 330, WY = 200;          // пол и настил мостков
  const RAIL_Y = 66, HANG = 200;     // ось рельса; низ подвешенного сканера
  const SCAN_X = 930;                // где сканер стоит до катсцены
  const PRN = [1120, 1560, 2000, 2440, 2880, 3300];          // принтеры
  const BAT = [[1330, 172], [0, 128], [2210, 172], [0, 128], [3090, 172], [3490, 172]];     // аккумуляторы (x=0 — над серединой мостков)
  const CW = [[1600, WY, 2, 1], [2480, WY, 2, 1]];
  const DOOR_X = 3720;
  let SAVE = [];                     // какие аккумуляторы разбиты (после смерти не восстанавливаются)

  // ---------- копия Сани из принтера: бежит на Валеру, бьёт кулаком, иногда бросается ----------
  class Clone extends L9.FOES.Foe {
    constructor(M, x, y, o) { super(M, x, y, Object.assign({ sh: 'sclone9', maxHp: 4, touch: 0, w: 16, pts: 150 }, o)); this.cd = rnd(0.3, 0.8); this.sp = rnd(95, 125); this.born = 0; }
    get h() { return 82; }
    ai(dt, P) {
      const dx = P.x - this.x, ad = Math.abs(dx); this.cd -= dt; this.born += dt;
      if (P.climb && this.onG) { this.vx = 0; this.set(this.sh === 'rspd9' ? 'walk' : 'run'); this.phys(dt); return; }     // на лестнице Валеру не бьют — он не может отстреливаться
      if (this.st === 'wind') { this.vx = 0; if (this.stT > 0.28) { this.set('punch'); if (ad < 50 && Math.abs(P.y - this.y) < 40) P.hurt(9, this.x); Sound.play('punch', 0.6); } }
      else if (this.st === 'punch') { this.vx = 0; if (this.stT > 0.3) { this.set('run'); this.cd = rnd(0.7, 1.2); } }
      else if (this.st === 'grab') { this.vx = this.dir * 260; if (this.stT < 0.35 && ad < 26 && Math.abs(P.y - this.y) < 40) { P.hurt(11, this.x); this.set('punch'); } if (this.stT > 0.45) { this.set('run'); this.cd = 1; } }
      else {
        this.set('run');
        if (ad < 42 && this.cd <= 0 && Math.abs(P.y - this.y) < 40) { this.set('wind'); this.vx = 0; }
        else if (ad < 150 && ad > 90 && this.cd <= 0 && Math.random() < 0.02 && P.onG) { this.set('grab'); Sound.play('jump', 0.4); }
        else this.vx = ad > 30 ? Math.sign(dx) * this.sp : 0;
      }
      this.phys(dt);
    }
    die(dir, kind) { super.die(dir, kind); this.vy = -60; Sound.play('crash', 0.5); }
    frame() { if (this.dead) return this.stT < 0.35 ? 'fall' : 'dead'; if (this.fl > 0) return 'hit'; return ({ wind: 'wind', punch: 'punch', grab: 'grab' })[this.st] || (this.vx ? this.walkFr(6, 11) : 'w0'); }
  }
  L9.FOES.Clone = Clone;

  // ---------- робот-собака Сани: галоп, прыжок на Валеру, укус, лазер из камеры-головы ----------
  class RDog extends L9.FOES.Foe {
    constructor(M, x, y, o) { super(M, x, y, Object.assign({ sh: 'rdog9', maxHp: 5, touch: 0, w: 24, pts: 250 }, o)); this.cd = rnd(0.5, 1.2); this.wake = o && o.wake ? 0.8 : 0; }
    get h() { return 50; }
    ai(dt, P) {
      const dx = P.x - this.x, ad = Math.abs(dx), dy = Math.abs(P.y - this.y); this.cd -= dt;
      if (P.climb && this.onG) { this.vx = 0; this.set(this.sh === 'rspd9' ? 'walk' : 'run'); this.phys(dt); return; }     // на лестнице Валеру не бьют — он не может отстреливаться
      if (this.wake > 0) { this.wake -= dt; this.vx = 0; this.set('crouch'); this.phys(dt); return; }
      if (dy > 70) { this.set('run'); this.vx = 0; this.phys(dt); return; }     // Валера на другом этаже — ждёт
      if (this.st === 'crouch') { this.vx = 0; if (this.stT > 0.3) { this.set('leap'); this.vy = -380; this.vx = this.dir * 290; this.onG = false; Sound.play('jump', 0.5); } }
      else if (this.st === 'leap') { if (this.near(P, 30, 50)) { P.hurt(10, this.x); this.vx *= -0.3; } if (this.onG && this.stT > 0.1) { this.set('run'); this.cd = rnd(1, 1.6); } }
      else if (this.st === 'bite') { this.vx = 0; if (this.stT > 0.12 && !this.bit) { this.bit = 1; if (this.near(P, 40, 40)) P.hurt(9, this.x); Sound.play('punch', 0.6); } if (this.stT > 0.4) { this.set('run'); this.bit = 0; this.cd = rnd(0.6, 1); } }
      else if (this.st === 'laser') { this.vx = 0; if (this.stT > 0.25 && !this.shot) { this.shot = 1; this.ebul(this.x + this.dir * 30, this.y - 38, this.dir * 330, 0, { fr: 'laser', s: 0.45, dmg: 8 }); Sound.play('zap', 0.5); } if (this.stT > 0.55) { this.set('run'); this.shot = 0; this.cd = rnd(1.2, 2); } }
      else {
        this.set('run');
        if (ad < 40 && this.cd <= 0) this.set('bite');
        else if (ad > 130 && ad < 230 && this.cd <= 0 && Math.random() < 0.5) this.set('crouch');
        else if (ad > 230 && ad < 380 && this.cd <= 0) this.set('laser');
        else this.vx = ad > 26 ? Math.sign(dx) * 175 : 0;
        if (this.st !== 'run') this.cd = 0.3;
      }
      this.phys(dt);
    }
    frame() { if (this.dead) return 'dead'; if (this.fl > 0) return 'hit'; return ({ crouch: 'crouch', leap: 'leap', bite: 'bite', laser: 'laser' })[this.st] || (this.vx ? 'r' + ((this.t * 14 | 0) % 6) : 'r0'); }
  }
  // ---------- робот-паук: семенит, прыгает, стреляет лазером из глаз; может висеть на тросе под потолком и падать сверху ----------
  class RSpd extends L9.FOES.Foe {
    constructor(M, x, y, o) { super(M, x, y, Object.assign({ sh: 'rspd9', maxHp: 6, touch: 0, w: 28, pts: 300, jumps: 1 }, o)); this.cd = rnd(0.6, 1.4); if (this.ceil != null) { this.hang = 1; this.hy = this.y; this.y = this.ceil + 70; this.air = 1; } }
    get h() { return 48; }
    ai(dt, P) {
      const dx = P.x - this.x, ad = Math.abs(dx); this.cd -= dt;
      if (this.hang) { this.vx = 0; this.vy = 0; this.y = this.ceil + 70 + Math.sin(this.t * 2) * 4; if (ad < 90 && P.y > this.y && P.y - this.y < 260) { this.hang = 0; this.air = 0; this.set('jump'); Sound.play('clank', 0.5); } return; }
      if (Math.abs(P.y - this.y) > 70 && this.onG) { this.vx = 0; this.set('walk'); this.phys(dt); return; }
      if (P.climb && this.onG) { this.vx = 0; this.set(this.sh === 'rspd9' ? 'walk' : 'run'); this.phys(dt); return; }     // на лестнице Валеру не бьют — он не может отстреливаться
      if (this.st === 'crouch') { this.vx = 0; if (this.stT > 0.35) { this.set('jump'); this.vy = -460; this.vx = clamp(dx * 1.3, -240, 240); this.onG = false; Sound.play('jump', 0.4); } }
      else if (this.st === 'jump') { if (this.near(P, 32, 46)) { P.hurt(11, this.x); } if (this.onG && this.stT > 0.1) { this.set('walk'); this.cd = rnd(1, 1.8); } }
      else if (this.st === 'fire') { this.vx = 0; if (this.stT > 0.3 && !this.shot) { this.shot = 1; for (const a of [-0.08, 0.08]) this.ebul(this.x + this.dir * 26, this.y - 36, Math.cos(a) * this.dir * 320, Math.sin(a) * 320, { fr: 'laser', s: 0.4, dmg: 8 }); Sound.play('zap', 0.5); } if (this.stT > 0.6) { this.set('walk'); this.shot = 0; this.cd = rnd(1.6, 2.6); } }
      else {
        this.set('walk');
        if (ad < 150 && this.cd <= 0 && this.onG) this.set('crouch');
        else if (ad < 300 && this.cd <= 0) this.set('fire');
        else this.vx = ad > 60 ? Math.sign(dx) * 85 : 0;
      }
      this.phys(dt);
    }
    phys(dt) { if (this.hang) return; super.phys(dt); }
    frame() { if (this.dead) return 'dead'; if (this.hang) return 'hang'; if (this.fl > 0) return 'hit'; return ({ crouch: 'crouch', jump: 'jump', fire: 'fire' })[this.st] || (this.vx ? 'w' + ((this.t * 12 | 0) % 6) : 'w0'); }
  }
  L9.FOES.RDog = RDog; L9.FOES.RSpd = RSpd;

  L9.MAPS.sanya = () => {
    const LM = L9.MAPS.lab();     // общий фон, подборы и их отрисовка — как в лаборатории
    const M = {
      x0: 0, x1: 3800, y0: -420, y1: 760, killY: 1400,
      solids: [[0, FL, 3800, 80], [-40, -420, 40, 830, 'hide'], [3800, -420, 40, 830, 'hide']],
      walks: [], ladders: [],
      cks: [[110, FL], [455, FL], [1860, FL], [2760, FL]],
      picks: [{ kind: 'kefir', x: 1240, y: FL }, { kind: 'grenades', x: 1700, y: WY }, { kind: 'rocket', x: 2100, y: FL }, { kind: 'pelmeni', x: 2580, y: WY }, { kind: 'kefir', x: 3000, y: FL }, { kind: 'pelmeni', x: 3560, y: FL }],
      door: { x: DOOR_X, y: FL, open: 0, t: 0 },
    };
    for (const [x, y, n, l] of CW) { const r = LAB.cwBuild(x, y, n, l); M.walks.push(r.w); for (const q of r.lads) { q[2] = FL; M.ladders.push(q); } }
    M.init = (P, lv, ck) => {
      if (!ck) SAVE = [];
      M.fight = ck > 0; M.cut = ck > 0; M.fin = null; M.leaving = 0; M.hint = 0;
      M.picks = M.picks.filter(k => k.x > M.cks[ck][0] + 40); M.picks.forEach(k => k.t = 0);
      M.bats = BAT.map(([x, y], i) => { const w = M.walks[i === 1 ? 0 : 1]; const bx = x || Math.round(w[0] + w[2] / 2); return { x: bx, y, hp: SAVE.includes(i) ? 0 : 10, i }; });
      M.prn = PRN.map((x, i) => ({ x, st: SAVE.includes(i) ? 'wreck' : 'idle', t: rnd(0, 2), cd: rnd(0.5, 2.5) }));
      M.robots = [{ fr: 'bench', dead: 'benchDead', x: 640, hp: 6 }, { fr: 'dogSit', dead: 'dogDead', x: 800, hp: 4 }];
      M.san = { x: 690, fr: 'fix0', dir: 1, gone: ck > 0 };
      M.scan = { x: ck > 0 ? M.cks[ck][0] - 120 : SCAN_X, bot: ck > 0 ? HANG : FL, fr: ck > 0 ? 'glass' : 'open', cd: 2, vy: 0, dead: 0 };
      if (ck > 0) lv.say('СТРЕЛЯЙ ПО АККУМУЛЯТОРАМ НА СТЕНЕ!', 3);
    };
    M.left = () => M.bats.filter(b => b.hp > 0).length;
    // ---------- логика ----------
    M.update = (dt, P, lv) => {
      if (!M.cut && P.x > 420) { M.cut = 1; P.vx = 0; Scene.dialogTop = true; Scene.run(M.script, () => { M.fight = true; P.st = 'stand'; lv.say('СТРЕЛЯЙ ПО АККУМУЛЯТОРАМ НА СТЕНЕ!', 3); }); return; }
      for (const k of M.picks) { k.t += dt; if (!k.dead && Math.abs(P.x - k.x) < 22 && Math.abs(P.y - k.y) < 40) LM.take(k, P, lv); }
      M.picks = M.picks.filter(k => !k.dead);
      if (!M.fight) return;
      // принтеры: печатают копии, пока есть питание
      const alive = P.foes.filter(f => !f.dead).length;
      for (const p of M.prn) {
        p.t += dt; if (p.st === 'wreck') continue;
        if (p.st === 'idle') { p.cd -= dt; if (p.cd <= 0 && Math.abs(P.x - p.x) < 560 && alive < 6 && !M.fin) { p.st = 'print'; p.t = 0; Sound.play('zap', 0.5); } }
        else if (p.st === 'print' && M.fin) p.st = 'idle';
        else if (p.st === 'print' && p.t > 2.0) { p.st = 'out'; p.t = 0; const f = new Clone(M, p.x + 8, FL); f.dir = P.x < p.x ? -1 : 1; P.foes.push(f); Sound.play('door', 0.5); }
        else if (p.st === 'out' && p.t > 0.7) { p.st = 'idle'; p.cd = rnd(1.8, 3.2); }
      }
      // сканер: едет по рельсу следом за Валерой и стреляет зелёной плазмой вниз
      const s = M.scan;
      if (!s.dead) {
        const tx = clamp(P.x - 90, 700, 3620), sp = M.fin ? 260 : 95; s.x += clamp(tx - s.x, -sp * dt, sp * dt);     // в финале вагонетку несёт к Валере — взрыв в кадре
        if (!M.fin) { s.cd -= dt; s.fr = s.cd < 0.5 ? 'press' : 'glass';
          if (s.cd <= 0 && Math.abs(P.x - s.x) < 300) { s.cd = rnd(1.6, 2.4); const a = Math.atan2(P.y - 40 - (s.bot - 20), P.x - s.x); P.ebul.push({ x: s.x, y: s.bot - 14, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, t: 0, dmg: 10, fr: 'plasma', s: 0.5 }); Sound.play('zap'); } }
      } else if (s.bot < FL) { s.vy += 900 * dt; s.bot = Math.min(FL, s.bot + s.vy * dt); if (s.bot >= FL) { Sound.play('crash'); G.shake(5, 0.3); } }
      // финал: все аккумуляторы разбиты
      if (!M.fin && M.left() === 0) { M.fin = { t: 0 }; s.fr = 'spark'; lv.say('ПИТАНИЕ ОТКЛЮЧЕНО!', 2); Sound.play('warn'); }
      if (M.fin) {
        const f = M.fin; f.t += dt;
        if (!s.dead && (P.t * 20 | 0) % 2) P.fx.push({ sh: 'fxA9', fr: ['spark'], x: s.x + rnd(-30, 30), y: s.bot - 128 + rnd(-6, 6), s: rnd(0.5, 0.9), t: 0, life: 0.15, add: 1 });
        if (f.t > 0.4 && !f.l1) { f.l1 = 1; lv.say('САНЯ: «Нет-нет-нет! Вагонетка! Выпустите меня!»', 2.6); }
        if (f.t > 2.2 && s.fr === 'spark') { s.fr = 'fire'; Sound.play('glass'); }
        if (f.t > 3.4 && !s.dead) {
          s.dead = 1; s.fr = 'wreck'; G.shake(8, 0.6); G.flash(0.2, '#fff');
          for (let i = 0; i < 5; i++) P.fx.push({ sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2', 'boom3'], x: s.x + rnd(-40, 40), y: s.bot - rnd(20, 120), s: rnd(1.2, 1.8), t: -i * 0.08, life: 0.6 });
          Sound.play('boom'); lv.score += 3000;
          for (const c of P.foes) if (!c.dead) c.hit(99, Math.sign(c.x - s.x) || 1, 'blast');     // копии без хозяина рассыпаются
        }
        if (f.t > 5 && !M.door.open) { M.door.open = 1; M.door.t = 0; Sound.play('door'); lv.say('ДВЕРЬ ОТКРЫТА — ВПЕРЁД!', 2.5); }
      }
      const d = M.door;
      if (d.open) d.t += dt;
      if (!d.open && P.x > d.x - 120) { P.hintAt('Дверь заперта — разбей аккумуляторы (' + (BAT.length - M.left()) + '/' + BAT.length + ')', 2); }
      if ((!d.open || d.t <= 1.4) && P.x > d.x - 46) P.x = d.x - 46;
      if (d.open && d.t > 1.4 && P.x > d.x - 50 && !M.leaving) { M.leaving = 1; lv.next(); }
    };
    M.batHit = (b, dmg, P) => {
      b.hp -= dmg; Sound.play('clank', 0.6);
      if (b.hp > 0) return;
      b.hp = 0; SAVE.push(b.i); Sound.play('boom'); G.shake(5, 0.35); P.lv.score += 500;
      P.fx.push({ sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2', 'boom3'], x: b.x, y: b.y, s: 0.9, t: 0, life: 0.55 });
      const p = M.prn[b.i]; if (p && p.st !== 'wreck') {     // без питания принтер идёт вразнос и взрывается
        p.st = 'wreck'; p.t = 0;
        for (let i = 0; i < 4; i++) P.fx.push({ sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2', 'boom3'], x: p.x + rnd(-50, 50), y: FL - rnd(30, 160), s: rnd(1, 1.6), t: -0.25 - i * 0.12, life: 0.6 });
        for (const c of P.foes) if (!c.dead && Math.abs(c.x - p.x) < 70) c.hit(99, Math.sign(c.x - p.x) || 1, 'blast');
      }
      const n = M.left(); P.lv.say(n ? 'АККУМУЛЯТОР РАЗБИТ! ОСТАЛОСЬ ' + n : 'ВСЕ АККУМУЛЯТОРЫ РАЗБИТЫ!', 1.8);
    };
    M.shootProps = (b, P) => {
      for (const bt of M.bats) if (bt.hp > 0 && Math.abs(b.x - bt.x) < 26 && Math.abs(b.y - bt.y) < 26) { b.dead = true; if (b.w === 'rocket' || b.w === 'gren') P.blast(b.x, b.y, b.blast || 46, b.dmg); else M.batHit(bt, b.dmg, P); return; }
      const s = M.scan; if (M.fight && !s.dead && Math.abs(b.x - s.x) < 34 && b.y > s.bot - 130 && b.y < s.bot) {     // бронестекло: пули отлетают
        b.dead = true; Sound.play('deflect'); P.fx.push({ sh: 'fxL9', fr: ['spark'], x: b.x, y: b.y, s: 0.45, t: 0, life: 0.1, add: 1 });
        if (!M.glassHint) { M.glassHint = 1; P.hintAt('Бронестекло! Бей по аккумуляторам на стенах!', 3); } return; }
      if (M.fight) for (const r of M.robots) if (r.hp > 0 && Math.abs(b.x - r.x) < 50 && b.y > FL - 60 && b.y < FL) { b.dead = true; r.hp -= b.dmg; Sound.play('clank', 0.5); if (r.hp <= 0) { Sound.play('crash'); P.lv.score += 100; P.fx.push({ sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2', 'boom3'], x: r.x, y: FL - 30, s: 0.8, t: 0, life: 0.5 }); } return; }
    };
    M.blast = (x, y, r, dmg, P) => { for (const bt of M.bats) if (bt.hp > 0 && Math.hypot(bt.x - x, bt.y - y) < r + 26) M.batHit(bt, dmg, P); };
    // ---------- катсцена (диалог — дословно по ТЗ) ----------
    M.script = function* () {
      const P = L9.PARTS.lab, s = M.san, sc = M.scan, D = 0.016;
      P.dir = 1; P.st = 'run';
      while (P.x < 455) { P.x += 140 * D; yield D; }
      P.st = 'stand'; P.vx = 0;
      for (let i = 0; i < 3; i++) { s.fr = 'fix1'; Sound.play('clank', 0.5); yield 0.35; s.fr = 'fix0'; yield 0.3; }
      s.dir = -1; s.fr = 'talk'; yield 0.4;
      yield* Scene.say('valera', 'Саня, ты тоже, что ли, с ними?', null);
      s.fr = 'finger';
      yield* Scene.say('sanya', 'Нет, Валера, я всегда был с ними, ты не должен был об этом узнать! Ты должен был тоже попасть ко мне на хирургический стол!', null);
      s.fr = 'talk';
      yield* Scene.say('sanya', 'Мистер Икс верит в меня, это я разработал проект реновации завода! Это я создал по запросу Мистера Икса киберзаводчан — им не нужна еда, им нужен только стиральный порошок, и внутри них течёт чистый концентрат 99% спирта!', null);
      s.fr = 'shout';
      yield* Scene.say('valera', 'Не может быть, что ты наделал! Я думал, ты единственный из столицы нормальный! Ты приглашал меня в гости!', null);
      s.fr = 'finger';
      yield* Scene.say('sanya2', 'Всё кончено, мистер Валерий.', null);
      // заходит в сканер под бронестекло
      M.camT = 400; s.dir = 1; let k = 0;
      while (s.x < sc.x - 6) { s.x += 75 * D; s.fr = 'w' + ((k++ / 14 | 0) % 2); yield D; }
      s.gone = 1; Sound.play('door'); sc.fr = 'press'; yield 0.7;
      Sound.play('confirm'); G.flash(0.1, '#7f7'); yield 0.3;
      sc.fr = 'glass'; Sound.play('zap'); G.shake(3, 0.4); yield 0.8;
      // сканер поднимается к рельсу под потолком; принтеры начинают печать
      Sound.play('crane');
      for (const p of M.prn.slice(0, 2)) if (p.st !== 'wreck') { p.st = 'print'; p.t = 0.8; }
      while (sc.bot > HANG) { sc.bot = Math.max(HANG, sc.bot - 120 * D); yield D; }
      Sound.play('clank'); yield 0.6; M.camT = null;
    };
    M.cutUpdate = (dt, P) => { P.t += dt; for (const p of M.prn) p.t += dt; if (M.camT != null) P.cam.x += (M.camT - P.cam.x) * Math.min(1, dt * 2.5); else P.camera(dt); P.updFx(dt); };
    // ---------- отрисовка ----------
    M.drawBack = (c, cx, cy, P) => LM.drawBack(c, cx + 2600, cy, P);     // фон лаборатории (другой участок слоёв, тот же стиль)
    M.drawMid = (c, P) => {
      const x0 = P.cam.x - 200, x1 = P.cam.x + 840;
      // рельс под потолком
      const [rw] = L9.size('srail9', 'rail'); for (let x = 660; x < 3760; x += rw - 1) if (x > x0 - rw && x < x1) S(c, 'srail9', 'rail', x + rw / 2, RAIL_Y, 1);
      // аккумуляторы на стене (за принтерами)
      for (const b of M.bats) if (b.x > x0 && b.x < x1) { const fr = b.hp <= 0 ? 'dead' : b.hp <= 5 ? 'hit' : 'on'; S(c, 'bat9', fr, b.x, b.y, 1);
        if (b.hp > 0) S(c, 'fxL9', 'spark', b.x, b.y, 0.5 + Math.sin(P.t * 6 + b.i) * 0.1, { add: 1, a: 0.35 }); }
      // принтеры
      for (const p of M.prn) if (p.x > x0 - 120 && p.x < x1 + 120) {
        const fr = p.st === 'wreck' ? 'wreck' : p.st === 'print' ? 'print' : p.st === 'out' ? 'out' : 'idle';
        S(c, 'prn9', fr, p.x, FL + 3, 1);
        if (p.st === 'print') S(c, 'fxL9', 'spark', p.x + rnd(-20, 20), FL - 130 + (p.t * 40 % 90), 0.5, { add: 1 });
        if (p.st === 'wreck' && p.t < 30 && (P.t * 8 | 0) % 3 === 0) S(c, 'fxA9', (P.t * 10 | 0) % 2 ? 'fire0' : 'fire1', p.x + 10, FL - 30, 0.8, { add: 1, a: 0.6 });
      }
      // верстак с роботом-пауком и робот-собака
      for (const r of M.robots) if (r.x > x0 - 150 && r.x < x1 + 150) { S(c, 'props8', 'shadow', r.x, FL + 1, 1.6, { a: 0.4 }); S(c, 'robo9', r.hp > 0 ? r.fr : r.dead, r.x, FL + 2, 1); }
      // Саня
      const s = M.san; if (!s.gone) { S(c, 'props8', 'shadow', s.x, FL + 1, 0.4, { a: 0.5 }); S(c, 'san9', s.fr, s.x, FL + 1, 1, { flip: s.dir < 0 }); }
      // сканер (на полу или на рельсе); на рельсе — штанга-подвес к вагонетке
      const sc = M.scan; S(c, 'scan9', sc.fr, sc.x, sc.bot, 1);
      // подборы
      for (const k of M.picks) { const bob = Math.sin(k.t * 4) * 2;
        if (k.kind === 'pelmeni' || k.kind === 'kefir') { Art.item(c, k.kind, k.x, k.y - 14 + bob, 0, 1); continue; }
        S(c, 'fxL9', 'spark', k.x, k.y - 14, 0.4 + Math.sin(k.t * 5) * 0.08, { add: 1 }); S(c, 'pick9', k.kind, k.x, k.y - 16 + bob, 1); }
    };
    M.drawFront = (c, P) => { const d = M.door, f = d.open ? Math.min(5, d.t / 1.4 * 6 | 0) : 0; S(c, 'gate9', 'g' + f, d.x, d.y + 2, 0.62); };
    M.drawHud = (c, P) => { if (M.fight && !M.fin) G.text('АККУМУЛЯТОРЫ: ' + (BAT.length - M.left()) + ' / ' + BAT.length, 320, 30, { align: 'center', size: 8, color: '#7fe0c0', outline: true }); };
    return M;
  };

  // часть уровня: движок лаборатории с картой Сани
  const LP = () => L9.PARTS.lab;
  L9.PARTS.sanya = {
    deathText: 'ВАЛЕРУ РАСПЕЧАТАЛИ',
    get hp() { return LP().hp; }, set hp(v) { LP().hp = v; },
    get inv() { return LP().inv; }, set inv(v) { LP().inv = v; },
    start(lv, ck) { LP().start(lv, ck, L9.SANYA_VERT && !/[?&]h=1/.test(location.search) ? 'sanyaV' : 'sanya'); },     // вертикальная версия; ?h=1 или L9.SANYA_VERT=false — прежняя горизонтальная
    onDie(lv) { LP().onDie(lv); },
    deadUpdate(lv, dt) { LP().deadUpdate(lv, dt); },
    update(lv, dt) { LP().update(lv, dt); },
    cutUpdate(lv, dt) { const P = LP(); P.M.cutUpdate && P.M.cutUpdate(dt, P); },
    draw(lv, c) { LP().draw(lv, c); },
    drawHud(lv, c) { LP().drawHud(lv, c); },
  };
})();
