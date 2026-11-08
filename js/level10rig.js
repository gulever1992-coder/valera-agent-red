// Уровень 10: Семён на костях v2 (стиль boss_hd_side). Тело — одна картинка на сетке с весами костей (L10.Skin, WebGL):
// суставы гнутся плавно, без швов. Руки — свои сетки, пасть — плавный оверлей, погон поверх руки, шланг — живое щупальце.
// Анимация: позы задают цели, каналы догоняют их пружинами (замах -> удар -> дотяжка -> возврат), без случайной дрожи;
// голова следит за Валерой, вторичные движения: костяные лапы на спине и брюхо отстают от корпуса.
// API как у L10.Boss (setPose, P, box, weak, hitAt, pimps/onPop, glowE/glowM) + aim (цель руки/взгляда), hoseT (цель шланга), watch (Валера).
(() => {
  const clamp = L10.clamp, lerp = L10.lerp, rnd = L10.rnd, D2R = Math.PI / 180;
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  const rotAt = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, p[0] - c * p[0] + s * p[1], p[1] - s * p[0] - c * p[1]]; };
  const sclAt = (p, sx, sy) => [sx, 0, 0, sy, p[0] * (1 - sx), p[1] * (1 - sy)];
  const tr = (x, y) => [1, 0, 0, 1, x, y], ID = [1, 0, 0, 1, 0, 0];
  const ap = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
  const inv = m => { const d = m[0] * m[3] - m[1] * m[2]; return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d, (m[2] * m[5] - m[3] * m[4]) / d, (m[1] * m[4] - m[0] * m[5]) / d]; };
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]), dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const sm = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

  const CH = ['rx', 'ry', 'rr', 'torso', 'head', 'mouth', 'ua', 'fa', 'ha', 'ua2', 'fa2', 'ha2', 'thL', 'shL', 'ftL', 'thR', 'shR', 'ftR', 'st', 'spider', 'belly', 'mg'];
  const BASE = { rx: 0, ry: 0, rr: 0, torso: 0, head: 0, mouth: 0, ua: 50, fa: -6, ha: 10, ua2: -6, fa2: 0, ha2: 0, thL: 0, shL: 0, ftL: 0, thR: 0, shR: 0, ftR: 0, st: 1, spider: 0, belly: 0, mg: 0 };
  // k — жёсткость, z — затухание (<1: перелёт и дотяжка). look: голова на aim; ik: рука на aim
  const POSE = {
    idle: { k: 26, z: 1 }, walk: { k: 26, z: 1 },
    roar: { t: { torso: -13, head: -24, mouth: 1, ua: -26, fa: -38, ha: -16, ua2: -58, fa2: -30, ry: -6 }, k: 55, z: 0.75 },
    raise: { t: { torso: -11, mouth: 0.55, ua: -96, fa: -44, ha: -24, ua2: 22, rx: -24, ry: -4 }, k: 16, z: 1, look: 1 },
    slam: { t: { torso: 24, head: 8, mouth: 0.9, ha: 14, ua2: 34, rx: 70, ry: 10, thL: -10, thR: 12 }, k: 240, z: 0.62, ik: 1 },
    eyes: { t: { torso: 5, mouth: 0.15, ua: 64, fa: -30, ua2: 6 }, k: 34, z: 1, look: 1 },
    plasma: { t: { torso: 11, mouth: 1, ua: 22, fa: -52, ha: -14, ua2: -8, fa2: -20, rx: 22 }, k: 34, z: 0.9, look: 1, mlook: 1 },
    lunge: { t: { torso: 17, head: 6, mouth: 0.6, ua: 108, fa: -8, ua2: 38, rx: 34 }, k: 90, z: 0.72 },
    hurt: { t: { torso: -19, head: -28, mouth: 1, ua: -58, fa: -22, ha: -26, ua2: -66, fa2: -12, rx: -38, ry: -4 }, k: 120, z: 0.55 },
    grab: { t: { torso: 14, mouth: 0.7, ha: 6, ua2: 26, rx: 34 }, k: 70, z: 0.8, ik: 1 },
    pick: { t: { torso: 22, head: 12, mouth: 0.5, ha: 18, ua2: 34, rx: 46, ry: 14, thL: -8, thR: 10 }, k: 70, z: 0.85, ik: 1 },     // бросок будки: нагнулся, рука к крыше
    wind: { t: { torso: -18, head: -12, mouth: 0.85, ua: -128, fa: -58, ha: -34, ua2: 28, rx: -34, ry: -8 }, k: 42, z: 0.8 },     // замах будкой над головой
    toss: { t: { torso: 24, head: 8, mouth: 1, ua: 70, fa: -14, ha: 16, ua2: 36, rx: 44, ry: 8 }, k: 260, z: 0.6 },     // швыряет
    gun: { t: { torso: 6, mouth: 0.45, ua: 40, fa: -20, ua2: 10 }, k: 70, z: 0.85, look: 1, gun: 1 },     // стреляет миниган на голове, голова наводит
  };
  const ALIAS = { front: 'roar', taunt: 'roar', tired: 'hurt', hit: 'hurt', eat0: 'roar', eat1: 'roar', eat2: 'hurt', idle2: 'idle', walk0: 'walk', walk1: 'walk', walk2: 'walk' };
  const AO = { ua: -52, fa: 42, ha: -16 };     // арт руки висит вниз: углы поз заданы для руки вперёд — сдвиг
  const AK = 1;     // длина руки относительно арта
  const HOSE_N = 16, HOSE_LEN = 640, HOSE_W = 74;     // канон: длина и толщина шланга у корня

  L10.RigBoss = class extends L10.Boss {
    constructor(look = 1, o = {}) {
      super(look, o);
      const R = this.R = L10.RIG2; this.rig = 2; this.J = R.J;
      this.v = {}; this.w = {}; for (const k of CH) { this.v[k] = BASE[k]; this.w[k] = 0; }
      this.aim = null; this.watch = null; this.hoseT = null; this.hoseW = 0; this.lw = 0; this.M = null; this.pose = 'idle';
      const J = R.J; this.L1 = dist(J.sh, J.el); this.L2 = dist(J.el, J.tip); this.A1 = ang(J.sh, J.el); this.A2 = ang(J.el, J.tip);
      // только настоящие прыщи арта: у каждого своя текстура со своего места (владелец)
      this.pimps = R.pimps.map(p => ({ u: p[0], v: p[1], sc: 1, bone: p[3], rect: p[4], c: [p[5], p[6]], base: 1, st: rnd(0, 6), sp: rnd(0.3, 0.5), ph: rnd(0, 6) }));
      this.hA = []; this.hAV = []; for (let i = 0; i < HOSE_N; i++) { this.hA.push(this.hoseShape(i, 0)); this.hAV.push(0); }
      this.flick = { t: 9, next: rnd(2, 4), dir: 1 };
      this.gunT = null; this.mgRec = 0; this.mgFlash = 0; this.mgJit = 0;     // миниган: цель, отдача, вспышка, дрожь стволов
    }
    setPose(p, hold = 0) { p = ALIAS[p] || p; if (!POSE[p]) p = 'roar'; if (p === this.pose) { this.hold = Math.max(this.hold, hold); return; } this.prev = this.pose; this.pose = p; this.hold = hold; this.poseT = 0; }
    bob() { return 0; }
    scale() { return this.H / (this.J.ground[1] - this.J.top); }
    mats() {
      const J = this.J, v = this.v, s = this.scale(), g = J.ground;
      const T0 = mul(mul(tr(this.x, this.y), [this.flip ? -s : s, 0, 0, s, 0, 0]), tr(-g[0], -g[1]));
      const Mr = mul(mul(T0, tr(v.rx, v.ry)), rotAt(J.hip, v.rr * D2R));
      const Mt = mul(Mr, rotAt(J.hip, v.torso * D2R));
      const Mh = mul(Mt, rotAt(J.neck, v.head * D2R));
      const Msp = mul(Mt, rotAt(J.spider, v.spider * D2R));
      const b = v.belly, Mb = mul(Mt, mul(tr(0, -b * 30), sclAt(J.belly, 1 + b, 1 - b * 0.5)));
      const leg = (a, b2, c, hp, kn, hk) => { const T = mul(Mr, rotAt(hp, a * D2R)), S2 = mul(T, rotAt(kn, b2 * D2R)); return [T, S2, mul(S2, rotAt(hk, c * D2R))]; };
      const [ML1, ML2, ML3] = leg(v.thL, v.shL, v.ftL, J.hipL, J.kneeL, J.hockL), [MR1, MR2, MR3] = leg(v.thR, v.shR, v.ftR, J.hipR, J.kneeR, J.hockR);
      const st = v.st * AK, S = mul(tr(J.sh[0], J.sh[1]), mul([st, 0, 0, 1 + (v.st - 1) * 0.3, 0, 0], tr(-J.sh[0], -J.sh[1])));
      const Mu = mul(mul(Mt, rotAt(J.sh, (v.ua + AO.ua) * D2R)), mul(rotAt(J.sh, this.A1), mul(S, rotAt(J.sh, -this.A1))));
      const Mf = mul(Mu, rotAt(J.el, (v.fa + AO.fa) * D2R)), Mha = mul(Mf, rotAt(J.wr, (v.ha + AO.ha) * D2R));
      const Mu2 = mul(Mt, rotAt(J.sh2, (v.ua2 + 45) * D2R)), Mf2 = mul(Mu2, rotAt(J.el2, (v.fa2 + 31) * D2R)), Mh2 = mul(Mf2, rotAt(J.wr2, (v.ha2 + 22) * D2R));
      const Mg = mul(mul(Mh, rotAt(J.mgp, v.mg * D2R)), tr(-this.mgRec * 14, this.mgJit));     // миниган: поворот у запястья + отдача
      // порядок = R.bones: id root torso head spider belly thighL shinL footL thighR shinR footR uarm farm hand uarm2 farm2 hand2 gun
      const list = [ID, Mr, Mt, Mh, Msp, Mb, ML1, ML2, ML3, MR1, MR2, MR3, Mu, Mf, Mha, Mu2, Mf2, Mh2, Mg];
      return (this.M = { T0, Mr, Mt, Mh, Msp, Mb, Mu, Mf, Mha, Mg, list, s, by: Object.fromEntries(this.R.bones.map((n, i) => [n, list[i]])) });
    }
    m() { return this.M || this.mats(); }
    pt(u, v) { const M = this.m(); if (u > 2) return ap(M.Mt, [u, v]); return ap(M.T0, [lerp(120, 700, u), lerp(this.J.top, this.J.ground[1], v)]); }
    P(k) {
      const M = this.m(), J = this.J;
      if (k === 'e') return ap(M.Mh, J.eye);
      if (k === 'e2') return ap(M.Mh, J.eye2 || [664, 444]);     // второй глаз (дальний, у брови)
      if (k === 'm') return ap(M.Mh, this.v.mouth > 0.5 ? [600, 536] : J.mouth);     // открытая пасть: точка внутри, а не на кромке губ
      if (k === 'h' || k === 'mg') return ap(M.Mg, J.mgm);     // дуло минигана
      if (k === 'gp') return ap(M.Mg, J.mgp);
      if (k === 'g' || k === 'v') return ap(M.Mha, J.tip);
      if (k === 'hose') return this.hP ? this.hP[this.hP.length - 1].slice() : ap(M.Mt, J.hose);
      return ap(M.Mt, [400, 720]);
    }
    box() {
      const M = this.m(), pts = [[150, 520], [640, 520], [640, 990], [150, 990]].map(p => ap(M.Mt, p)).concat([[470, 200], [740, 200], [740, 570]].map(p => ap(M.Mh, p)));
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys); return [x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0];
    }
    ik(target, stretchMax) {
      const M = this.mats(), q = ap(inv(M.Mt), target), J = this.J;
      const d0 = dist(J.sh, q), L = (this.L1 + this.L2) * AK, st = clamp(d0 / L, 1, stretchMax), l1 = this.L1 * AK * st, l2 = this.L2 * AK * st;
      const d = clamp(d0, Math.abs(l1 - l2) + 1, l1 + l2 - 0.5), base = ang(J.sh, q);
      const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), B2 = Math.acos(clamp((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2), -1, 1));
      const up = base - A, fore = up + (Math.PI - B2);
      return { ua: (up - this.A1) / D2R - AO.ua, fa: (fore - up - (this.A2 - this.A1)) / D2R - AO.fa, st };
    }
    lookAng(from, target) { const M = this.m(), I = inv(M.Mt), q = ap(I, target), f = ap(I, from); return ang(f, q) / D2R; }
    // форма шланга в покое: вниз-вперёд, к концу закручивается вверх (как хвост скорпиона), по длине бежит волна
    hoseShape(i, t) {
      const f = i / (HOSE_N - 1);
      const r = sm(f / 0.3);     // корень жёстко в устье вздутия, качается только дальше
      return 4 + 80 * sm((f - 0.03) / 0.3) - 22 * sm((f - 0.78) / 0.22) + (Math.sin(t * 1.7 - f * 5.5) * 24 * f + Math.sin(t * 0.63 + 1.3) * 9 * f) * r;     // владелец: из вздутия вперёд, плавной дугой вниз
    }
    update(dt) {
      const walk = this.walk; this.walk = 0; super.update(dt); this.walk = walk;
      const t = this.t; if (walk) this.walkT += dt * walk * 0.8;
      this.poseT = (this.poseT || 0) + dt; this.lw = lerp(this.lw, walk ? 1 : 0, clamp(dt * 3, 0, 1));
      const Pz = POSE[this.pose] || {}, tgt = Object.assign({}, BASE, Pz.t || {}), neutral = !Pz.t;
      // тяжёлый шаг: ноги, таз дважды за шаг вниз (вес), корпус и руки в противофазе
      const ph = this.walkT * Math.PI, lw = this.lw;
      tgt.thL += Math.sin(ph) * 17 * lw; tgt.shL += Math.max(0, Math.sin(ph + 1.4)) * 22 * lw; tgt.ftL += -Math.sin(ph + 0.6) * 10 * lw;
      tgt.thR += -Math.sin(ph) * 17 * lw; tgt.shR += Math.max(0, -Math.sin(ph + 1.4)) * 22 * lw; tgt.ftR += Math.sin(ph + 0.6) * 10 * lw;
      tgt.ry += (Math.cos(ph * 2) * 0.5 + 0.5) * 12 * lw; tgt.rr += Math.sin(ph) * 1.6 * lw;
      // «живое» ожидание: дыхание, медленное покачивание
      tgt.torso += Math.sin(t * 0.9) * 1.6 + Math.sin(ph * 2 + 0.5) * 2 * lw;
      if (neutral) { tgt.ua += -Math.sin(ph) * 14 * lw + Math.sin(t * 1.1) * 4; tgt.ua2 += Math.sin(ph) * 12 * lw + Math.sin(t * 1.1 + 1) * 3; tgt.fa += Math.sin(t * 1.3 + 0.7) * 4; tgt.mouth = 0.08 + Math.max(0, Math.sin(t * 0.37)) * 0.18; }
      // голова: следит за Валерой; при атаках — за целью
      const look = Pz.look && this.aim ? this.aim : (this.watch || null);
      if (look) { const a = this.lookAng(this.P(Pz.mlook ? 'm' : 'e'), look); tgt.head = clamp(a * (Pz.look ? 0.95 : 0.5) - this.v.torso * 0.4, Pz.look ? -38 : -18, Pz.look ? 42 : 24) + (Pz.t && Pz.t.head && !Pz.look ? Pz.t.head : 0); }
      if (Pz.ik && this.aim) { const r = this.ik(this.aim, Pz.gun ? 1.15 : 1.45); tgt.ua = r.ua; tgt.fa = r.fa; tgt.st = r.st; }
      // гибкость рук: предплечье и кисть отстают от плеча (захлёст), в ходьбе болтаются с запаздыванием
      const drag = (w, k) => clamp(-w * k, -28, 28);
      tgt.fa += drag(this.w.ua, 0.07); tgt.ha += drag(this.w.fa, 0.09) + drag(this.w.ua, 0.04);
      tgt.fa2 += drag(this.w.ua2, 0.07); tgt.ha2 += drag(this.w.fa2, 0.09);
      if (neutral) { tgt.fa += -Math.sin(ph - 0.9) * 10 * lw; tgt.ha += -Math.sin(ph - 1.7) * 14 * lw + Math.sin(t * 1.7) * 3; tgt.fa2 += Math.sin(ph - 0.9) * 9 * lw; tgt.ha2 += Math.sin(ph - 1.7) * 12 * lw; }
      // миниган: при стрельбе наводится на gunT, в покое чуть покачивается и поглядывает на Валеру
      { const tg = this.gunT || this.watch, a = tg ? this.lookAng(this.P('gp'), tg) - this.v.head : 0;
        tgt.mg = this.gunT ? clamp(a, -48, 32) : clamp(a * 0.3, -10, 8) + Math.sin(t * 0.8) * 3;
        this.mgRec = Math.max(0, this.mgRec - dt * 14); this.mgFlash = Math.max(0, this.mgFlash - dt); this.mgJit = this.mgFlash > 0 ? rnd(-1.6, 1.6) : this.mgJit * 0.8; }
      // вторичное: лапы на спине и брюхо отстают от корпуса
      tgt.spider = -this.w.torso * 0.09 - this.w.ry * 0.05 + Math.sin(t * 1.15) * 2.2;
      tgt.belly = clamp(this.w.ry * 0.0025, -0.06, 0.06) + Math.sin(t * 2.2) * 0.012;
      const k0 = Pz.k || 26, z = Pz.z || 1, h = Math.min(dt, 1 / 30);
      for (const c of CH) {
        const leg = /^(th|sh|ft)[LR]$/.test(c);
        const soft = c === 'ha' || c === 'ha2' ? 0.55 : c === 'head' ? 0.7 : c === 'fa' || c === 'fa2' ? 0.8 : leg ? 1.4 : 1;
        const k = c === 'mg' ? (this.gunT ? 90 : 30) : c === 'mouth' ? 70 : c === 'spider' ? 20 : c === 'belly' ? 60 : k0 * soft, zz = c === 'spider' || c === 'belly' ? 0.35 : c === 'mouth' ? 1 : /^(fa|ha)2?$/.test(c) ? Math.min(z, 0.6) : z;
        const a = k * (tgt[c] - this.v[c]) - 2 * zz * Math.sqrt(k) * this.w[c];
        this.w[c] += a * h; this.v[c] += this.w[c] * h;
      }
      this.v.mouth = clamp(this.v.mouth, 0, 1);
      this.M = null; this.hoseUpd(dt);
    }
    hoseUpd(dt) {
      const M = this.mats(), J = this.J, t = this.t, F = this.flick;
      this.hoseW = lerp(this.hoseW, this.hoseT ? 1 : 0, clamp(dt * (this.hoseT ? 9 : 2.5), 0, 1));
      // щелчок: время от времени по шлангу пробегает рывок
      F.t += dt; if (!this.hoseT && F.t > F.next) { F.t = 0; F.next = rnd(2.5, 5); F.dir = Math.random() < 0.5 ? -1 : 1; }
      const T = this.hoseT || this.lastHT; if (this.hoseT) this.lastHT = this.hoseT;
      const I = inv(M.Mt), root = J.hose, seg = HOSE_LEN / HOSE_N;
      let tq = null, stretch = 1; if (T) { tq = ap(I, [T.x, T.y]); stretch = clamp(dist(root, tq) / HOSE_LEN * 1.05, 1, 2.1); }
      const want = []; let px = root[0], py = root[1];
      for (let i = 0; i < HOSE_N; i++) {
        const f = i / (HOSE_N - 1); let a = this.hoseShape(i, t);
        const rr = sm(f / 0.25); a += F.t < 0.9 ? Math.exp(-Math.pow((F.t * 1.6 - f) * 4, 2)) * 38 * F.dir * rr : 0;     // бегущий рывок
        if (tq && this.hoseW > 0.01) { const aim = ang([px, py], tq) / D2R + Math.sin(t * 14 - f * 6) * 6 * (1 - f) - (1 - f) * 10; let d = aim - a; d = ((d + 540) % 360) - 180; a += d * this.hoseW * (0.15 + 0.85 * rr); }
        want.push(a); px += Math.cos(a * D2R) * seg; py += Math.sin(a * D2R) * seg;
      }
      // углы догоняют форму: корень жёсткий, кончик мягкий (запаздывание)
      const h = Math.min(dt, 1 / 30);
      for (let i = 0; i < HOSE_N; i++) {
        const f = i / (HOSE_N - 1), k = lerp(70, 18, f) * (1 + this.hoseW * 2.5), z = 0.7;
        let d = want[i] - this.hA[i]; d = ((d + 540) % 360) - 180;
        this.hAV[i] += (k * d - 2 * z * Math.sqrt(k) * this.hAV[i]) * h; this.hA[i] += this.hAV[i] * h;
      }
      const L = seg * lerp(1, stretch, this.hoseW), P = [ap(M.Mt, root)]; px = root[0]; py = root[1];
      for (let i = 0; i < HOSE_N; i++) { px += Math.cos(this.hA[i] * D2R) * L; py += Math.sin(this.hA[i] * D2R) * L; P.push(ap(M.Mt, [px, py])); }
      this.hP = P;
    }
    // выстрел минигана: отдача + вспышка; вернёт [x, y, угол ствола] на экране
    fireGun() { this.mgRec = 1; this.mgFlash = 0.06; this.M = null; const m = this.P('mg'), g = this.P('gp'); return [m[0], m[1], Math.atan2(m[1] - g[1], m[0] - g[0])]; }
    // ---- рисование
    skin() { if (L10._skin === undefined) { try { L10._skin = new L10.Skin(L10.img.rig20, this.R); if (!L10._skin.ok) L10._skin = null; } catch (e) { console.warn(e); L10._skin = null; } } return L10._skin; }
    drawHose(S, tint) {
      const P = this.hP; if (!P) return; const r = this.R.rect.hose, s = this.m().s, n = P.length;
      const Q = []; for (let i = 0; i < n - 1; i++) { const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n - 1, i + 2)];
        for (let j = 0; j < 3; j++) { const u = j / 3, u2 = u * u, u3 = u2 * u; Q.push([0, 1].map(c => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * u + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * u2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * u3))); } }
      Q.push(P[n - 1]);
      const half = HOSE_W * s * 0.5 * (r[3] / 210), v = [], idx = [], fl = this.flip ? -1 : 1;
      for (let i = 0; i < Q.length; i++) {
        const a = Q[Math.max(0, i - 1)], b = Q[Math.min(Q.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, nx = -ty / l * half * fl, ny = tx / l * half * fl;
        const u = (r[0] + r[2] * i / (Q.length - 1)) / this.R.aw, v0 = r[1] / this.R.ah, v1 = (r[1] + r[3]) / this.R.ah;
        v.push(Q[i][0] - nx, Q[i][1] - ny, u, v0, 0, 0, 0, 1, 0, Q[i][0] + nx, Q[i][1] + ny, u, v1, 0, 0, 0, 1, 0);
        if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
      }
      S.dyn(v, idx, tint);
    }
    drawPimps(S, M, tint) {
      const R = this.R, sc = [0.38, 0.12, 0.06, 0.5];
      for (const p of this.pimps) {
        const r = R.rect[p.rect], c = p.c; if (!r) continue;
        const s = p.st; let k = 0, a = 1, scar = 0;
        // живой: дышит; 3..4 набухает и дрожит; 4 лопается; 4..7 тёмный рубец; 7..9 отрастает заново
        if (p.base) { if (s < 3) k = 1 + Math.max(0, Math.sin(this.t * 2.2 + p.ph)) * 0.06; else if (s < 4) k = 1 + sm(s - 3) * 0.45 + Math.sin(s * 30) * 0.03; else if (s < 8) { k = 1.05; scar = 1; a = s < 7 ? 1 : 8 - s; } else k = 1 + Math.max(0, Math.sin(this.t * 2.2 + p.ph)) * 0.06; }
        else { if (s < 3) { k = 0.2 + sm(s / 3) * 0.8; a = sm(s / 0.5); } else if (s < 4) k = 1 + sm(s - 3) * 0.45 + Math.sin(s * 30) * 0.03; else if (s < 6) { k = lerp(0.9, 0.3, (s - 4) / 2); scar = 1; a = 1 - (s - 4) / 2; } }
        if (k <= 0 || a <= 0.01) continue;
        const B = M.by[p.bone] || M.Mt, kk = k * p.sc, q = [[0, 0], [r[2], 0], [r[2], r[3]], [0, r[3]]].map(o => ap(B, [p.u + (o[0] - c[0]) * kk, p.v + (o[1] - c[1]) * kk]));
        S.quad(q, r, scar ? sc : tint, a);
      }
    }
    drawOver(c, names = ['gun', 'arm', 'epaul']) {     // дорисовать слои поверх (луч из глаз идёт ЗА миниганом, но перед лицом)
      if (this.hidden) return; const S = this.skin(); if (!S) return;
      const M = this.mats(), fl = this.flashT > 0 ? 0.13 : 0, red = fl ? [1, 0.5, 0.4, fl] : null;
      S.begin(M.list); for (const n of names) S.layer(n, red); S.end(c);
    }
    draw(c, o = {}) {
      if (this.hidden) return; const S = this.skin(); if (!S) return;
      const M = this.mats(), fl = this.flashT > 0 ? 0.13 : 0, red = fl ? [1, 0.5, 0.4, fl] : null, dark = [0.06, 0.03, 0.1, 0.3];
      S.begin(M.list);
      S.layer('arm2', dark); S.layer('sticks', red);     // трость и тонкая паучья лапа — за телом, отдельно от задней ноги
      S.layer('body', red);
      this.drawPimps(S, M, red);
      this.drawHose(S, red); S.layer('hroot', red);     // шланг выходит из воспалённого вздутия на пузе (кусок арта поверх корня)
      S.layer('headO', red, sm((this.v.mouth - 0.3) / 0.08));     // резкое переключение: при полупрозрачном слое челюсть двоилась
      S.layer('gun', red);     // миниган в металлической руке на голове
      S.layer('arm', red); S.layer('epaul', red);
      c.save(); if (o.clipY != null) { c.beginPath(); c.rect(-200, -400, 1100, o.clipY + 400); c.clip(); }
      S.end(c);
      const bf = L10.fr('fx10', 'acid'), bim = bf && L10.tintFrame('fx10', bf, 'blood', '#6a0808');
      if (bim) for (const b of this.blood) { const yy = this.y + b.y + b.t * b.t * 120, k = 0.1 + b.t * 0.03; c.globalAlpha = 1 - b.t / 1.4; c.drawImage(bim, 0, 0, bf[2], bf[3], this.x + b.x - bf[2] * k / 4, yy - bf[3] * k / 4, bf[2] * k / 2, bf[3] * k / 2); }
      c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
      const [hx, hy] = this.P('h'), pulse = 0.3 + Math.sin(this.t * 4) * 0.15 + (this.weakT > 0 ? 0.5 : 0), g = c.createRadialGradient(hx, hy, 1, hx, hy, this.H * 0.05);
      g.addColorStop(0, `rgba(255,${this.weakT > 0 ? 255 : 90},60,${pulse})`); g.addColorStop(1, 'rgba(255,60,30,0)'); c.fillStyle = g; c.fillRect(hx - 60, hy - 60, 120, 120);
      const eg = Math.max(this.glowE || 0, 0.45);     // глаза светятся зелёным всегда (как на артах), сильнее при лазере
      { const [ex, ey] = this.P('e'), r = this.H * (0.022 + (this.glowE || 0) * 0.05); const g2 = c.createRadialGradient(ex, ey, 0.5, ex, ey, r); g2.addColorStop(0, `rgba(190,255,130,${eg})`); g2.addColorStop(0.4, `rgba(90,255,90,${eg * 0.5})`); g2.addColorStop(1, 'rgba(40,255,60,0)'); c.fillStyle = g2; c.fillRect(ex - r, ey - r, r * 2, r * 2); }
      if (this.mgFlash > 0 && L10.has('fx10')) { const [fx2, fy2, fa] = (() => { const m = this.P('mg'), g = this.P('gp'); return [m[0], m[1], Math.atan2(m[1] - g[1], m[0] - g[0])]; })();     // вспышка из стволов
        c.save(); L10.spr(c, 'fx10', 'flash', fx2 + Math.cos(fa) * this.H * 0.03, fy2 + Math.sin(fa) * this.H * 0.03, this.H * 0.0009, { add: 1, rot: fa }); c.restore(); }
      if (this.glowM > 0) { const [mx, my] = this.P('m'), r = this.H * 0.08; const g3 = c.createRadialGradient(mx, my, 1, mx, my, r); g3.addColorStop(0, `rgba(200,255,140,${this.glowM})`); g3.addColorStop(1, 'rgba(60,255,80,0)'); c.fillStyle = g3; c.fillRect(mx - r, my - r, r * 2, r * 2); }
      if ((this.shieldT > 0 || this.inv) && L10.fr('fx10', 'ball')) { const b = this.box(), f = L10.fr('fx10', 'ball'), im = L10.tintFrame('fx10', f, 'shield', '#5ad0ff');
        c.globalAlpha = this.inv ? 0.22 + Math.sin(this.t * 9) * 0.08 : 0.35; c.imageSmoothingEnabled = true; c.drawImage(im, 0, 0, f[2], f[3], b[0] - b[2] * 0.12, b[1] - b[3] * 0.12, b[2] * 1.24, b[3] * 1.24); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.restore();
    }
  };
  L10.makeBoss = (look, o) => (L10.RIG2 && L10.img.rig20 && look <= 2) ? new L10.RigBoss(look, o) : new L10.Boss(look, o);
})();
