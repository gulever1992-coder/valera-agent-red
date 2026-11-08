// Уровень 10: гигант-Семён — рисовка позами Flow (листы sem1/sem2/sem3, смотрят вправо) + «кукольная» анимация кодом:
// дыхание, покачивание, плавная смена поз, вспышка попадания, свечение глаз/рта, прыщи (pimp10) с вылуплением миньонов.
(() => {
  const S = L10.spr, clamp = L10.clamp, rnd = L10.rnd;
  // нормированные точки поз (кадр смотрит вправо): h — рука на лбу (слабое место), e — глаза, m — рот, b — тело [x0,y0,x1,y1]
  const PT = {
    sem1: {
      front: { h: [.55, .08], e: [.53, .22], m: [.53, .30], b: [.12, .1, .88, .78] }, roar: { h: [.80, .15], e: [.80, .22], m: [.83, .30], b: [.2, .12, .9, .78] },
      raise: { h: [.70, .20], e: [.70, .25], m: [.70, .31], b: [.2, .15, .9, .78] }, slam: { h: [.75, .22], e: [.73, .29], m: [.72, .34], b: [.15, .2, .9, .8] },
      eyes: { h: [.87, .12], e: [.86, .22], m: [.86, .30], b: [.2, .1, .92, .78] }, plasma: { h: [.73, .15], e: [.72, .25], m: [.80, .33], b: [.15, .12, .85, .8] },
      lunge: { h: [.55, .10], e: [.53, .20], m: [.53, .28], b: [.15, .1, .85, .78] }, grab: { h: [.82, .18], e: [.82, .24], m: [.83, .31], v: [.92, .43], b: [.2, .12, .9, .78] },
      hurt: { h: [.85, .13], e: [.82, .24], m: [.82, .30], b: [.2, .12, .9, .78] },
      walk0: { h: [.78, .14], e: [.78, .22], m: [.78, .30], b: [.2, .12, .9, .78] }, walk1: { h: [.78, .14], e: [.78, .22], m: [.78, .30], b: [.2, .12, .9, .78] }, walk2: { h: [.78, .14], e: [.78, .22], m: [.78, .30], b: [.2, .12, .9, .78] },
      eat0: { h: [.80, .16], e: [.80, .24], m: [.82, .31], b: [.2, .12, .9, .78] }, eat1: { h: [.80, .16], e: [.80, .24], m: [.82, .31], b: [.2, .12, .9, .78] }, eat2: { h: [.80, .16], e: [.80, .24], m: [.82, .31], b: [.2, .12, .9, .78] },
      idle: { h: [.78, .14], e: [.78, .22], m: [.78, .30], b: [.2, .12, .9, .78] }, idle2: { h: [.78, .14], e: [.78, .22], m: [.78, .30], b: [.2, .12, .9, .78] }, taunt: { h: [.78, .14], e: [.78, .22], m: [.78, .30], b: [.2, .12, .9, .78] },
    },
    sem2: { idle: { h: [.55, .15], e: [.55, .28], m: [.55, .36], b: [.1, .1, .9, .8] }, roar: { h: [.82, .12], e: [.80, .30], m: [.85, .36], b: [.12, .1, .9, .8] }, gun: { h: [.86, .22], e: [.75, .30], m: [.75, .36], b: [.12, .1, .88, .8] },
      lunge: { h: [.55, .15], e: [.55, .28], m: [.55, .36], b: [.1, .1, .9, .8] }, eyes: { h: [.85, .20], e: [.85, .30], m: [.85, .36], b: [.12, .1, .92, .8] }, hurt: { h: [.82, .20], e: [.78, .30], m: [.80, .38], b: [.1, .1, .9, .8] } },
    sem3: { idle: { h: [.55, .25], e: [.55, .45], m: [.55, .55], b: [.1, .1, .9, 1] }, raise: { h: [.52, .42], e: [.52, .55], m: [.52, .65], b: [.1, .05, .9, 1] }, roar: { h: [.60, .30], e: [.60, .45], m: [.65, .58], b: [.1, .1, .9, 1] },
      tired: { h: [.80, .30], e: [.78, .50], m: [.78, .60], b: [.1, .15, .9, 1] }, hit: { h: [.80, .15], e: [.80, .35], m: [.85, .50], b: [.1, .1, .9, 1] }, grab: { h: [.60, .15], e: [.60, .30], m: [.62, .40], v: [.80, .50], b: [.1, .1, .9, 1] } },
  };
  // точки прыщей на видимой стороне (норм., кадр вправо) — общие для поз облика
  const PIMPS = { sem1: [[.30, .42], [.38, .62], [.62, .30], [.22, .55]], sem2: [[.30, .40], [.48, .55], [.65, .42], [.25, .60], [.55, .68], [.40, .30]], sem3: [[.30, .40], [.50, .58], [.68, .38], [.42, .28], [.62, .62], [.25, .62]] };

  L10.tinted = {};      // красные копии КАДРОВ (не целых листов) для вспышки попадания
  L10.tintFrame = (sh, f, key, col = '#ff2a1a') => {
    const id = sh + ':' + key; if (L10.tinted[id]) return L10.tinted[id]; const im = L10.img[sh]; if (!im) return null;
    const cv = document.createElement('canvas'); cv.width = f[2]; cv.height = f[3]; const g = cv.getContext('2d');
    g.drawImage(im, f[0], f[1], f[2], f[3], 0, 0, f[2], f[3]); g.globalCompositeOperation = 'source-atop'; g.fillStyle = col; g.fillRect(0, 0, cv.width, cv.height);
    return (L10.tinted[id] = cv);
  };

  L10.Boss = class {
    constructor(look = 1, o = {}) {
      this.look = look; this.sh = 'sem' + look; this.pose = o.pose || (look === 1 ? 'roar' : 'idle'); this.prev = null; this.fade = 1;
      this.H = o.H || 560; this.x = o.x || 470; this.y = o.y || 560; this.flip = o.flip ?? true;      // flip: смотрит влево
      this.t = 0; this.flashT = 0; this.walk = 0; this.walkT = 0; this.hold = 0;
      this.maxHp = o.hp || 300; this.hp = this.maxHp; this.segs = o.segs || 2; this.segHp = this.maxHp / this.segs; this.inv = false;
      this.segT = 0; this.segLimit = o.segLimit || 150;
      this.pimps = (PIMPS[this.sh] || []).map((p, i) => ({ u: p[0], v: p[1], st: rnd(0, 6), sp: rnd(0.35, 0.6), dead: 0 }));
      this.blood = [];
    }
    get seg() { return Math.min(this.segs - 1, Math.floor((this.maxHp - this.hp) / this.segHp + 1e-6)); }
    setPose(p, hold = 0) { if (p === this.pose) { this.hold = Math.max(this.hold, hold); return; } if (!L10.fr(this.sh, p)) return; this.prev = this.pose; this.pose = p; this.fade = 0; this.hold = hold; }
    frame(p = this.pose) { return L10.fr(this.sh, p); }
    scale() { const f = L10.fr(this.sh, 0); return f ? this.H / (f[3] * 0.5) : 1; }     // общий масштаб листа (по первому кадру) — тело не «прыгает» между позами
    // точка позы в экранных координатах (u, v — нормированные в кадре, смотрящем вправо)
    pt(u, v, p = this.pose) {
      const f = this.frame(p); if (!f) return [this.x, this.y]; const s = this.scale(), w = f[2] * 0.5 * s, h = f[3] * 0.5 * s;
      const bx = this.x - (f[4] * 0.5 * s), by = this.y - h; const lx = u * w;
      const breath = 1 + Math.sin(this.t * 2.1) * 0.012, yy = this.y - (1 - v) * h * breath;
      return [this.flip ? this.x + (f[4] * 0.5 * s) - lx : bx + lx, yy + this.bob()];
    }
    P(k) { const q = (PT[this.sh][this.pose] || {})[k]; return q ? this.pt(q[0], q[1]) : [this.x, this.y - this.H * 0.7]; }
    bob() { return this.walk ? Math.abs(Math.sin(this.walkT * Math.PI)) * -10 : 0; }
    box() { const q = (PT[this.sh][this.pose] || {}).b || [.15, .1, .9, .8]; const a = this.pt(q[0], q[1]), b = this.pt(q[2], q[3]); return [Math.min(a[0], b[0]), a[1], Math.abs(b[0] - a[0]), b[1] - a[1]]; }
    weak() { const [x, y] = this.P('h'), r = this.H * 0.045; return [x - r, y - r, r * 2, r * 2.2]; }
    // попадание в точку (x, y) экрана: true, если попало
    hitAt(x, y, dmg) {
      if (this.dead || this.hp <= 0) return false;
      const w = this.weak(), inW = x > w[0] && x < w[0] + w[2] && y > w[1] && y < w[1] + w[3];
      const b = this.box(); if (!inW && !(x > b[0] && x < b[0] + b[2] && y > b[1] && y < b[1] + b[3])) return false;
      if (this.inv) { this.shieldT = 0.25; return 'shield'; }
      this.damage(dmg * (inW ? 1.5 : 1)); if (inW) this.weakT = 0.2;
      return inW ? 'weak' : 'body';
    }
    damage(d) {
      const s0 = this.seg; this.hp = Math.max(0, this.hp - d); if (this.t - (this.lastFlash || 0) > 0.22) { this.flashT = 0.06; this.lastFlash = this.t; }
      if (Math.random() < 0.25) { const b = this.box(); this.blood.push({ x: rnd(b[0], b[0] + b[2]) - this.x, y: rnd(b[1], b[1] + b[3] * 0.6) - this.y, t: 0 }); }
      if (this.seg !== s0 || this.hp <= 0) { this.segT = 0; this.onSeg && this.onSeg(this.seg); }
    }
    update(dt) {
      this.t += dt; this.fade = Math.min(1, this.fade + dt * 7); this.flashT -= dt; this.weakT -= dt; this.shieldT -= dt; this.hold -= dt;
      if (this.walk) { this.walkT += dt * this.walk; const w = ['walk0', 'walk1', 'walk2', 'walk1']; if (L10.fr(this.sh, 'walk0') && this.hold <= 0) { const p = w[(this.walkT | 0) % 4]; if (p !== this.pose) { this.prev = null; this.pose = p; this.fade = 1; } } }
      for (const b of this.blood) b.t += dt; this.blood = this.blood.filter(b => b.t < 1.4).slice(-30);
      for (const p of this.pimps) {     // цикл прыща: 0..3 рост, 4 лопается -> миньон, 5..6 рубец, потом новый
        p.st += dt * p.sp;
        if (p.st >= 4 && !p.popped) { p.popped = 1; if (this.onPop) { const [x, y] = this.pt(p.u, p.v); this.onPop(x, y, p); } }
        if (p.st >= 9) { p.st = 0; p.popped = 0; p.sp = rnd(0.35, 0.6) * (1 + this.look * 0.15); }
      }
    }
    pimpFrame(p) { const s = p.st; if (!L10.fr('pimp10', 'p6')) return s < 1 ? 'p0' : s < 3 ? 'p1' : s < 3.6 ? 'p2' : s < 4.2 ? 'p3' : s < 4.8 ? 'p4' : s < 7 ? 'p5' : null;     // лист с вылуплением миньона
      return s < 1 ? 'p0' : s < 2 ? 'p1' : s < 3 ? 'p2' : s < 4 ? 'p3' : s < 4.5 ? 'p4' : s < 5.2 ? 'p5' : s < 7 ? 'p6' : null; }
    drawPose(c, p, a, tint) {
      const f = this.frame(p); if (!f) return; const s = this.scale(), k = s * 0.5, br = 1 + Math.sin(this.t * 2.1) * 0.012, sway = Math.sin(this.t * 1.3) * 0.012;
      const im = tint ? L10.tintFrame(this.sh, f, p) : L10.img[this.sh]; if (!im) return; const sx = tint ? 0 : f[0], sy = tint ? 0 : f[1];
      c.save(); c.translate(this.x, this.y + this.bob()); c.rotate(sway * (this.flip ? -1 : 1)); if (this.flip) c.scale(-1, 1); c.scale(1, br); c.globalAlpha *= a; c.imageSmoothingEnabled = true;
      c.drawImage(im, sx, sy, f[2], f[3], -f[4] * k, -f[5] * k, f[2] * k, f[3] * k); c.restore();
    }
    draw(c, o = {}) {
      if (this.hidden) return;
      c.save(); if (o.clipY != null) { c.beginPath(); c.rect(-200, -400, 1100, o.clipY + 400); c.clip(); }
      if (this.prev && this.fade < 1) this.drawPose(c, this.prev, 1 - this.fade);
      this.drawPose(c, this.pose, this.prev ? this.fade : 1);
      if (this.flashT > 0) { c.globalAlpha = 0.18; this.drawPose(c, this.pose, 1, true); c.globalAlpha = 1; }
      // прыщи (поверх тела)
      if (L10.has('pimp10')) for (const p of this.pimps) { const fr = this.pimpFrame(p); if (!fr) continue; const [x, y] = this.pt(p.u, p.v); S(c, 'pimp10', fr, x, y, this.H / 900 * (0.22 + Math.min(p.st, 4) * 0.04), { a: p.st < 0.4 ? p.st / 0.4 : 1 }); }
      // кровь — капли из ран (растёт с уроном)
      const bf = L10.fr('fx10', 'acid'), bim = bf && L10.tintFrame('fx10', bf, 'blood', '#6a0808');     // кровь — кадр кислоты, перекрашенный в тёмно-красный
      if (bim) for (const b of this.blood) { const yy = this.y + b.y + b.t * b.t * 120, k = 0.1 + b.t * 0.03; c.globalAlpha = 1 - b.t / 1.4; c.drawImage(bim, 0, 0, bf[2], bf[3], this.x + b.x - bf[2] * k / 4, yy - bf[3] * k / 4, bf[2] * k / 2, bf[3] * k / 2); }
      c.globalAlpha = 1;
      // слабое место — пульс на руке
      const [hx, hy] = this.P('h'); const pulse = 0.35 + Math.sin(this.t * 6) * 0.2 + (this.weakT > 0 ? 0.5 : 0);
      c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(hx, hy, 1, hx, hy, this.H * 0.06); g.addColorStop(0, `rgba(255,${this.weakT > 0 ? 255 : 90},60,${pulse})`); g.addColorStop(1, 'rgba(255,60,30,0)'); c.fillStyle = g; c.fillRect(hx - 60, hy - 60, 120, 120);
      if (this.glowE > 0) { const [ex, ey] = this.P('e'), r = this.H * 0.07; const g2 = c.createRadialGradient(ex, ey, 1, ex, ey, r); g2.addColorStop(0, `rgba(160,255,120,${this.glowE})`); g2.addColorStop(1, 'rgba(60,255,80,0)'); c.fillStyle = g2; c.fillRect(ex - r, ey - r, r * 2, r * 2); }
      if (this.glowM > 0) { const [mx, my] = this.P('m'), r = this.H * 0.1; const g3 = c.createRadialGradient(mx, my, 1, mx, my, r); g3.addColorStop(0, `rgba(200,255,140,${this.glowM})`); g3.addColorStop(1, 'rgba(60,255,80,0)'); c.fillStyle = g3; c.fillRect(mx - r, my - r, r * 2, r * 2); }
      if ((this.shieldT > 0 || this.inv) && L10.fr('fx10', 'ball')) {     // щит — растянутый кадр плазменного шара, голубой
        const b = this.box(), f = L10.fr('fx10', 'ball'), im = L10.tintFrame('fx10', f, 'shield', '#5ad0ff');
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = this.inv ? 0.22 + Math.sin(this.t * 9) * 0.08 : 0.35; c.imageSmoothingEnabled = true;
        c.drawImage(im, 0, 0, f[2], f[3], b[0] - b[2] * 0.12, b[1] - b[3] * 0.12, b[2] * 1.24, b[3] * 1.24); c.restore(); }
      c.globalCompositeOperation = 'source-over';
      c.restore();
    }
  };
})();
