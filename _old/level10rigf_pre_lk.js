// Уровень 10, фаза 3: Семён АНФАС, по пузо в море, потрёпанный после фаз 1–2 (сборка tools/p10/rig/build_rig3.py -> L10.RIG3).
// Те же принципы, что в level10rig.js: каналы догоняют цели пружинами, сетки с весами костей рисует L10.Skin (WebGL).
// Кости: торс (дыхание, покачивание на волне), голова (наклон к Валере), пасть (оверлей), глаза (свечение лазера),
// руки (плечо-локоть-кисть, IK к цели; кисть меняется на ладонь/кулак), паучьи лапы (две группы), миниган в металлической руке, шланг-лента.
// x, y — точка на линии воды под центром тела (экран), H — высота над водой (экран). P(k): 'e','e2' глаза, 'm' пасть, 'mg' дуло,
// 'hL','hR' кисти, 'hose' конец шланга, 'legL','legR' концы паучьих лап.
(() => {
  const clamp = L10.clamp, lerp = L10.lerp, D2R = Math.PI / 180;
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  const rotAt = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, p[0] - c * p[0] + s * p[1], p[1] - s * p[0] - c * p[1]]; };
  const sclAt = (p, sx, sy) => [sx, 0, 0, sy, p[0] * (1 - sx), p[1] * (1 - sy)];
  const tr = (x, y) => [1, 0, 0, 1, x, y], ID = [1, 0, 0, 1, 0, 0];
  const ap = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
  const inv = m => { const d = m[0] * m[3] - m[1] * m[2]; return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d, (m[2] * m[5] - m[3] * m[4]) / d, (m[1] * m[4] - m[0] * m[5]) / d]; };
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]), dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const sm = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const wrap = d => ((d + 540) % 360) - 180;

  const CH = ['rx', 'ry', 'torso', 'head', 'mouth', 'eye', 'ua', 'fa', 'ha', 'ua2', 'fa2', 'ha2', 'spL', 'spR', 'mg', 'pL', 'pR', 'belly'];
  const BASE = { rx: 0, ry: 0, torso: 0, head: 0, mouth: 0, eye: 0, ua: 0, fa: 0, ha: 0, ua2: 0, fa2: 0, ha2: 0, spL: 0, spR: 0, mg: 0, pL: 0, pR: 0, belly: 0 };
  // ua>0 — рука уходит наружу и вверх (у правой руки зеркально). pL/pR: 0 когти, 1 ладонь к зрителю, -1 кулак.
  // ik: 'L'/'R'/'LR' — кисти тянутся к aimL/aimR. hose: 'up' — шланг занесён над головой, 'hit' — бьёт в hoseT.
  const POSE = {
    idle: { k: 20, z: 1 },
    roar: { t: { torso: -4, head: -8, mouth: 1, ua: 38, fa: 30, ua2: 38, fa2: 30, spL: -10, spR: 10, ry: -8, pL: -1, pR: -1 }, k: 50, z: 0.7 },
    plasma: { t: { torso: 3, mouth: 1, ua: 14, fa: 24, ua2: 14, fa2: 24, ry: -4 }, k: 40, z: 0.85, look: 1 },
    laser: { t: { torso: 2, head: 3, eye: 1, mouth: 0.15, ua: 8, ua2: 8 }, k: 40, z: 0.9, look: 1 },
    clapUp: { t: { torso: -3, head: -5, mouth: 0.6, ua: 150, fa: 10, ha: 0, ua2: 150, fa2: 10, ha2: 0, pL: 1, pR: 1, ry: -10, spL: -14, spR: 14 }, k: 22, z: 1 },
    clapOut: { t: { torso: 4, mouth: 0.4, ua: 78, fa: -6, ua2: 78, fa2: -6, pL: 1, pR: 1, ry: 2 }, k: 60, z: 0.75 },
    clap: { t: { torso: 8, head: 6, mouth: 0.9, pL: 1, pR: 1, ry: 10 }, k: 200, z: 0.6, ik: 'LR' },
    hoseUp: { t: { torso: -6, head: -6, mouth: 0.5, ua: 26, fa: 34, ua2: 26, fa2: 34, ry: -6, pL: -1, pR: -1 }, k: 30, z: 1, hose: 'up', look: 1 },
    hoseHit: { t: { torso: 10, head: 8, mouth: 0.9, ua: 10, ua2: 10, ry: 8 }, k: 160, z: 0.6, hose: 'hit' },
    gun: { t: { torso: 2, mouth: 0.2, ua: 6, ua2: 6 }, k: 60, z: 0.85, look: 1, gun: 1 },
    grab: { t: { torso: 8, mouth: 0.7, pL: 1 }, k: 70, z: 0.8, ik: 'L' },
    connect: { t: { torso: -2, mouth: 0.3, spL: -26, spR: 26, ry: -4, ua: 20, ua2: 20 }, k: 26, z: 0.9 },
    hurt: { t: { torso: -9, head: -16, mouth: 1, ua: 46, fa: 40, ua2: 52, fa2: 36, ry: -14, spL: -8, spR: 12, pL: -1 }, k: 110, z: 0.55 },
  };
  const HOSE_N = 16, HOSE_LEN = 700, HOSE_W = 70;

  L10.RigFront = class {
    constructor(o = {}) {
      const R = this.R = L10.RIG3, J = this.J = R.J;
      this.x = o.x || 320; this.y = o.y || 260; this.H = o.H || 240; this.t = 0;
      this.v = {}; this.w = {}; for (const k of CH) { this.v[k] = BASE[k]; this.w[k] = 0; }
      this.pose = 'idle'; this.poseT = 0; this.watch = null; this.aimL = null; this.aimR = null; this.hoseT = null; this.gunT = null;
      this.L1 = dist(J.sh, J.el); this.L2 = dist(J.el, J.wr); this.A1 = ang(J.sh, J.el); this.A2 = ang(J.el, J.wr);
      this.L1b = dist(J.sh2, J.el2); this.L2b = dist(J.el2, J.wr2); this.A1b = ang(J.sh2, J.el2); this.A2b = ang(J.el2, J.wr2);
      this.hA = []; this.hAV = []; for (let i = 0; i < HOSE_N; i++) { this.hA.push(this.hoseRest(i, 0)); this.hAV.push(0); }
      this.legs = [0, 1, 2, 3].map(() => ({ reach: 0, tgt: null, grow: 1, hot: 0 }));
      this.hoseW = 0; this.mgRec = 0; this.mgFlash = 0; this.flashT = 0; this.shield = 0; this.M = null;
    }
    setPose(p) { if (!POSE[p]) p = 'idle'; if (p !== this.pose) { this.pose = p; this.poseT = 0; } }
    scale() { return this.H / (this.J.water - this.J.top); }
    mats() {
      const J = this.J, v = this.v, s = this.scale();
      const T0 = mul(mul(tr(this.x, this.y), [s, 0, 0, s, 0, 0]), tr(-J.root[0], -J.water));
      const Mr = mul(T0, tr(v.rx, v.ry)), Mt = mul(Mr, rotAt(J.root, v.torso * D2R)), Mh = mul(Mt, rotAt(J.neck, v.head * D2R));
      const MsL = mul(Mt, rotAt(J.spL, v.spL * D2R)), MsR = mul(Mt, rotAt(J.spR, v.spR * D2R));
      const Mb = mul(Mt, sclAt(J.belly, 1 + v.belly, 1 + v.belly * 0.6));
      // левая (у зрителя) рука: наружу = по часовой (угол растёт), правая — зеркально
      const Mu = mul(Mt, rotAt(J.sh, v.ua * D2R)), Mf = mul(Mu, rotAt(J.el, v.fa * D2R)), Mha = mul(Mf, rotAt(J.wr, v.ha * D2R));
      const Mu2 = mul(Mt, rotAt(J.sh2, -v.ua2 * D2R)), Mf2 = mul(Mu2, rotAt(J.el2, -v.fa2 * D2R)), Mh2 = mul(Mf2, rotAt(J.wr2, -v.ha2 * D2R));
      const k = 1 + this.mgRec * 0.05, gk = this.gunK || 1, Mg = mul(mul(mul(Mh, rotAt(J.mgp, v.mg * D2R)), sclAt(J.mgp, gk, gk)), sclAt(J.mgm, k, k));     // gunK — размер минигана (владелец: меньше)     // отдача — ствол «прыгает» на зрителя
      // порядок = R.bones: id root torso head spL spR belly uarm farm hand uarm2 farm2 hand2 gun
      // четыре лапы к станциям: поворот вокруг корня на цель + растяжение вдоль лапы (reach 0..1), grow — отросла/отломана
      const ML = this.legs.map((lg, i) => {
        const base = i < 2 ? MsL : MsR, r = J['lgR' + i], tp = J['lgT' + i], a0 = ang(r, tp), l0 = dist(r, tp);
        let a = a0 + Math.sin(this.t * 1.3 + i * 1.7) * 0.03, k = 1;
        if (lg.tgt && lg.reach > 0.001) { const q = ap(inv(base), lg.tgt), a1 = ang(r, q); a = a0 + wrap((a1 - a0) / D2R) * D2R * lg.reach + Math.sin(this.t * 7 + i) * 0.015 * lg.reach; k = 1 + (dist(r, q) / l0 - 1) * lg.reach; }
        const g = Math.max(0.001, lg.grow);
        return mul(base, mul(tr(r[0], r[1]), mul(rotAt([0, 0], a), mul([k * g, 0, 0, (1 + (k - 1) * 0.15) * g, 0, 0], mul(rotAt([0, 0], -a0), tr(-r[0], -r[1]))))));
      });
      const list = [ID, Mr, Mt, Mh, MsL, MsR, Mb, Mu, Mf, Mha, Mu2, Mf2, Mh2, Mg].concat(ML);
      return (this.M = { T0, Mr, Mt, Mh, Mf, Mha, Mf2, Mh2, Mg, MsL, MsR, ML, list, s });
    }
    m() { return this.M || this.mats(); }
    P(k) {
      const M = this.m(), J = this.J;
      if (k === 'e') return ap(M.Mh, J.e); if (k === 'e2') return ap(M.Mh, J.e2);
      if (k === 'm') return ap(M.Mh, J.mouthO);
      if (k === 'mg' || k === 'h') return ap(M.Mg, J.mgm); if (k === 'gp') return ap(M.Mg, J.mgp);
      if (k === 'hL') return ap(M.Mha, J.wr); if (k === 'hR') return ap(M.Mh2, J.wr2);
      if (k === 'hose') return this.hP ? this.hP[this.hP.length - 1].slice() : ap(M.Mt, J.hose);
      if (k[0] === 'l' && k[1] === 'g') { const i = +k[2]; return ap(M.ML[i], J['lgT' + i]); }     // 'lg0'..'lg3' — кончик лапы
      if (k === 'legL') return ap(M.MsL, [95, 880]); if (k === 'legR') return ap(M.MsR, [2 * J.root[0] - 95, 880]);
      return ap(M.Mt, J.belly);
    }
    box() { const M = this.m(), pts = [[200, 120], [570, 120], [600, J0(this).water], [170, J0(this).water]].map(p => ap(M.Mt, p)); const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; }
    // IK руки к точке экрана: локоть наружу от тела
    ik(side, target) {
      const M = this.mats(), J = this.J, q = ap(inv(M.Mt), target), L = side === 'L';
      const sh = L ? J.sh : J.sh2, l1 = L ? this.L1 : this.L1b, l2 = L ? this.L2 : this.L2b, A1 = L ? this.A1 : this.A1b, A2 = L ? this.A2 : this.A2b;
      const d = clamp(dist(sh, q), Math.abs(l1 - l2) + 1, l1 + l2 - 0.5), base = ang(sh, q);
      const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), B2 = Math.acos(clamp((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2), -1, 1));
      const up = L ? base + A : base - A, fore = L ? up - (Math.PI - B2) : up + (Math.PI - B2);     // локоть наружу
      const ua = wrap((up - A1) / D2R), fa = wrap((fore - up - (A2 - A1)) / D2R);
      return L ? { ua, fa } : { ua: -ua, fa: -fa };
    }
    lookX(p) { return clamp((p.x != null ? p.x : p[0]) - this.x, -400, 400) / 400; }
    hoseRest(i, t) { const f = i / (HOSE_N - 1); return 90 + 14 * Math.sin(t * 0.9 - f * 4) * f + 8 * Math.sin(t * 0.4) * f; }     // в покое — свисает в воду и шевелится
    update(dt) {
      this.t += dt; this.poseT += dt; this.flashT = Math.max(0, this.flashT - dt);
      const t = this.t, Pz = POSE[this.pose] || POSE.idle, tgt = Object.assign({}, BASE, Pz.t || {}), neutral = !Pz.t;
      // волна: тело покачивается на воде, дышит; в покое руки чуть шевелятся
      tgt.ry += Math.sin(t * 1.3) * 5; tgt.rx += Math.sin(t * 0.55) * 4; tgt.torso += Math.sin(t * 0.8) * 1.4; tgt.belly += Math.sin(t * 1.9) * 0.012;
      tgt.spL += Math.sin(t * 1.1) * 3; tgt.spR += Math.sin(t * 1.1 + 1.2) * 3;
      if (neutral) { tgt.ua += 4 + Math.sin(t * 1.2) * 3; tgt.ua2 += 4 + Math.sin(t * 1.2 + 1) * 3; tgt.fa += Math.sin(t * 1.5) * 4; tgt.fa2 += Math.sin(t * 1.5 + 0.7) * 4; tgt.mouth = 0.06 + Math.max(0, Math.sin(t * 0.4)) * 0.15; }
      const look = Pz.look && (this.gunT || this.aimL) ? (this.gunT || this.aimL) : this.watch;
      if (look) { const lx = this.lookX(look); tgt.head += lx * (Pz.look ? 16 : 8); tgt.torso += lx * 3; }
      if (Pz.gun && this.gunT) tgt.mg = clamp(this.lookX(this.gunT) * 22, -22, 22);
      if (Pz.ik) {
        if (Pz.ik.includes('L') && this.aimL) Object.assign(tgt, this.ik('L', this.aimL));
        if (Pz.ik.includes('R')) { const r = this.ik('R', this.aimR || this.aimL); tgt.ua2 = r.ua; tgt.fa2 = r.fa; }
      }
      // наложения поверх позы рук: атаки идут одновременно (пасть — плазма, глаза — лазер, шланг — удар, лапы — к станциям)
      const O = this.ovr || {};
      if (O.mouth != null) tgt.mouth = Math.max(tgt.mouth, O.mouth); if (O.eye != null) tgt.eye = Math.max(tgt.eye, O.eye);
      if (O.legs) { tgt.spL += -22 * O.legs; tgt.spR += 22 * O.legs; }
      const drag = (w, k) => clamp(-w * k, -24, 24);     // кисть и предплечье отстают от плеча
      tgt.fa += drag(this.w.ua, 0.06); tgt.ha += drag(this.w.fa, 0.08); tgt.fa2 += drag(this.w.ua2, 0.06); tgt.ha2 += drag(this.w.fa2, 0.08);
      const k0 = Pz.k || 20, z = Pz.z || 1, h = Math.min(dt, 1 / 30);
      for (const c of CH) {
        const k = c === 'mouth' || c === 'eye' ? 60 : c === 'pL' || c === 'pR' ? 30 : /^sp/.test(c) ? 18 : c === 'mg' ? 80 : k0 * (/^(fa|ha)2?$/.test(c) ? 0.8 : 1);
        const zz = /^sp/.test(c) ? 0.4 : c === 'mouth' || c === 'eye' || c === 'pL' || c === 'pR' ? 1 : z;
        const a = k * (tgt[c] - this.v[c]) - 2 * zz * Math.sqrt(k) * this.w[c]; this.w[c] += a * h; this.v[c] += this.w[c] * h;
      }
      this.v.mouth = clamp(this.v.mouth, 0, 1); this.v.eye = clamp(this.v.eye, 0, 1);
      this.mgRec = Math.max(0, this.mgRec - dt * 12); this.mgFlash = Math.max(0, this.mgFlash - dt);
      this.M = null; this.hoseUpd(dt, O.hose || Pz.hose);
    }
    hoseUpd(dt, mode) {
      const M = this.mats(), J = this.J, t = this.t, seg = HOSE_LEN / HOSE_N, root = J.hose, I = inv(M.Mt);
      this.hoseW = lerp(this.hoseW, mode ? 1 : 0, clamp(dt * (mode === 'hit' ? 12 : 3), 0, 1));
      let tq = null;
      if (mode === 'up') tq = [root[0] + (this.hoseT ? clamp((ap(I, [this.hoseT.x, this.hoseT.y])[0] - root[0]) * 0.3, -160, 160) : 0), J.top - 220];     // занесён над головой, чуть в сторону цели
      else if (mode === 'hit' && this.hoseT) tq = ap(I, [this.hoseT.x, this.hoseT.y]);
      const stretch = tq ? clamp(dist(root, tq) / HOSE_LEN * 1.05, 1, 2.4) : 1, want = []; let px = root[0], py = root[1];
      for (let i = 0; i < HOSE_N; i++) {
        const f = i / (HOSE_N - 1); let a = this.hoseRest(i, t);
        if (tq) { let aim = ang([px, py], tq) / D2R; if (mode === 'up') aim += (f - 0.5) * 60 * (tq[0] < root[0] ? -1 : 1); a += wrap(aim - a) * this.hoseW * (0.25 + 0.75 * sm(f / 0.35)); }
        want.push(a); px += Math.cos(a * D2R) * seg; py += Math.sin(a * D2R) * seg;
      }
      const h = Math.min(dt, 1 / 30);
      for (let i = 0; i < HOSE_N; i++) { const f = i / (HOSE_N - 1), k = lerp(60, 16, f) * (1 + this.hoseW * (mode === 'hit' ? 6 : 1.5)), d = wrap(want[i] - this.hA[i]); this.hAV[i] += (k * d - 2 * 0.7 * Math.sqrt(k) * this.hAV[i]) * h; this.hA[i] += this.hAV[i] * h; }
      const L = seg * lerp(1, stretch, this.hoseW), P = [ap(M.Mt, root)]; px = root[0]; py = root[1];
      for (let i = 0; i < HOSE_N; i++) { px += Math.cos(this.hA[i] * D2R) * L; py += Math.sin(this.hA[i] * D2R) * L; P.push(ap(M.Mt, [px, py])); }
      this.hP = P;
    }
    fireGun() { this.mgRec = 1; this.mgFlash = 0.06; this.M = null; return this.P('mg'); }
    skin() { if (L10._skin3 === undefined) { try { L10._skin3 = new L10.Skin(L10.img.rig30, this.R); if (!L10._skin3.ok) L10._skin3 = null; } catch (e) { console.warn(e); L10._skin3 = null; } } return L10._skin3; }
    drawHose(S, tint) {
      const P = this.hP; if (!P) return; const r = this.R.rect.hose, s = this.m().s, n = P.length, Q = [];
      for (let i = 0; i < n - 1; i++) { const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n - 1, i + 2)];
        for (let j = 0; j < 3; j++) { const u = j / 3, u2 = u * u, u3 = u2 * u; Q.push([0, 1].map(c => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * u + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * u2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * u3))); } }
      Q.push(P[n - 1]);
      const half = HOSE_W * s * 0.5 * (r[3] / 210), v = [], idx = [];
      for (let i = 0; i < Q.length; i++) {
        const a = Q[Math.max(0, i - 1)], b = Q[Math.min(Q.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, nx = -ty / l * half, ny = tx / l * half;
        const u = (r[0] + r[2] * i / (Q.length - 1)) / this.R.aw, v0 = r[1] / this.R.ah, v1 = (r[1] + r[3]) / this.R.ah;
        v.push(Q[i][0] - nx, Q[i][1] - ny, u, v0, 0, 0, 0, 1, 0, Q[i][0] + nx, Q[i][1] + ny, u, v1, 0, 0, 0, 1, 0);
        if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
      }
      S.dyn(v, idx, tint);
    }
    // кисть-спрайт у запястья: пальцы — по направлению предплечья
    drawPalm(S, side, tint) {
      const p = this.v[side === 'L' ? 'pL' : 'pR'], k = p >= 0 ? 'palm' : 'fist', a = Math.abs(p); if (a < 0.03) return;
      const M = this.m(), J = this.J, Mf = side === 'L' ? M.Mha : M.Mh2, el = ap(Mf, side === 'L' ? J.el : J.el2), wr = ap(Mf, side === 'L' ? J.wr : J.wr2);
      const r = this.R.rect[k], o = J[k], hh = (k === 'palm' ? 250 : 190) * M.s, sc = hh / r[3], dx = wr[0] - el[0], dy = wr[1] - el[1], l = Math.hypot(dx, dy) || 1;
      const ux = dx / l, uy = dy / l, rx = side === 'L' ? -uy : uy, ry = side === 'L' ? ux : -ux;     // «вверх» спрайта = вдоль предплечья
      const at = (x, y) => [wr[0] + ((x - o[0]) * rx + -(y - o[1]) * ux) * sc, wr[1] + ((x - o[0]) * ry + -(y - o[1]) * uy) * sc];
      S.quad([at(0, 0), at(r[2], 0), at(r[2], r[3]), at(0, r[3])], r, tint, a);
    }
    drawHoseOnly(c) { const S = this.skin(); if (!S) return; S.begin(this.mats().list); this.drawHose(S, this.flashT > 0 ? [1, 0.5, 0.4, 0.13] : null); S.end(c); }
    draw(c, o = {}) {
      const S = this.skin(); if (!S) return;
      const M = this.mats(), red = this.flashT > 0 ? [1, 0.5, 0.4, 0.13] : null, sh = this.shield > 0 ? [0.35, 0.8, 1, 0.25 + Math.sin(this.t * 12) * 0.1] : red;
      S.begin(M.list);
      S.layer('legs', red);     // паучьи лапы за спиной
      this.legs.forEach((lg, i) => { if (lg.grow > 0.02) S.layer('lg' + i, lg.hot ? [0.4, 0.9, 1, Math.max(0, Math.sin(this.t * 9 + i * 1.7)) ** 6 * 0.28] : red, Math.min(1, lg.grow * 1.5)); });     // подключённая лапа — по ней бежит ток
      S.layer('body', red); this.drawHose(S, red);
      S.layer('headO', red, sm((this.v.mouth - 0.45) / 0.1)); S.layer('eyes', null, this.v.eye);
      S.layer('gun', red);
      S.layer('arm', red); S.layer('hand', red, 1 - Math.abs(this.v.pL)); this.drawPalm(S, 'L', red);
      S.layer('arm2', red); S.layer('hand2', red, 1 - Math.abs(this.v.pR)); this.drawPalm(S, 'R', red);
      S.layer('epaul', red);
      S.end(c);
      c.save(); c.globalCompositeOperation = 'lighter';
      const glow = (p, r, col, a) => { const g = c.createRadialGradient(p[0], p[1], 0.5, p[0], p[1], r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); };
      if (this.v.eye > 0.05) for (const e of ['e', 'e2']) glow(this.P(e), this.H * 0.06 * (0.6 + this.v.eye), '255,90,40', this.v.eye * 0.8);
      if (this.v.mouth > 0.55) glow(this.P('m'), this.H * 0.12, '120,255,220', (this.v.mouth - 0.55) * 1.3);
      if (this.mgFlash > 0) glow(this.P('mg'), this.H * 0.1, '255,220,120', 1);
      c.restore();
    }
  };
  const J0 = b => b.J;
})();
