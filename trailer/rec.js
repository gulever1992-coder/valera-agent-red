// Покадровая запись игры для трейлера: 30 кадров/с, 1920x1080, кадры уходят на recv.py.
// Вместе с кадрами пишется дорожка «где Валера на экране» — по ней камера трейлера держит его крупно.
window.__R = {
  q: null, fn: 0, track: [], pos: null,
  hook() {
    if (this.q) return;
    this.q = []; this.now = performance.now();
    window.requestAnimationFrame = cb => { this.q.push(cb); return 1; };
    // холст 1920x1080 вместо 1280x720: все трансформации умножаются на 1.5
    const cv = document.querySelector('canvas'), c = cv.getContext('2d');
    cv.width = 1920; cv.height = 1080;
    const st = c.setTransform.bind(c);
    c.setTransform = (a, b, cc, d, e, f) => (typeof a === 'object' || a === undefined) ? st(1.5, 0, 0, 1.5, 0, 0) : st(a * 1.5, b * 1.5, cc * 1.5, d * 1.5, e * 1.5, f * 1.5);
    c.resetTransform = () => st(1.5, 0, 0, 1.5, 0, 0);
    c.imageSmoothingEnabled = false;
  },
  step(n = 1) {
    for (let k = 0; k < n; k++) {
      this.fn++;
      if (window.__clean && this.fn % 10 === 1) __clean();
      if (this.fn % 10 === 1) this.wrapPlayer();
      let q = this.q; this.q = [];
      if (!q.length && window.frame) q = [window.frame];
      this.now += 1000 / 30;
      this.pos = null;
      q.forEach(cb => cb(this.now));
    }
  },
  // ---- где игрок и враги ----
  ctxOf() {
    const L = App.level; if (!L) return {};
    const host = L.arena && L.arena.player ? L.arena : L.run && L.run.player ? L.run : L.stage && L.stage.player ? L.stage : null;
    if (host) {
      const en = (host.world && host.world.enemies) || [];
      return { pl: host.player, foes: host.boss ? en.concat([host.boss]) : en, host };
    }
    if (L.P && typeof L.P.x === 'number') return { pl: L.P, foes: L.P.foes || [], part: true };
    return {};
  },
  wrapPlayer() {
    const { pl, part } = this.ctxOf();
    if (!pl || pl.__wrapped || part || typeof pl.draw !== 'function') return;
    const d = pl.draw, self = this; pl.__wrapped = true;
    pl.draw = function (c, cx = 0, cy = 0) { self.pos = [Math.round(this.x - cx), Math.round(this.y - cy)]; return d.apply(this, arguments); };
  },
  // ---- боты ----
  bot(t, f, opt = {}) {
    const I = G.Input, set = (a, on) => on ? I.press(a) : I.release(a);
    const { pl, foes } = this.ctxOf();
    if (pl && opt.god !== false) { const m = pl.maxHp || 100; if (pl.hp < m * 0.5) pl.hp = m * 0.8; }
    if (opt.smart && pl) {
      let best = null, bd = 1e9;
      for (const e of foes) {
        if (!e || e.dead || e.hp <= 0 || e.dieT != null) continue;
        const dx = e.x - pl.x, dy = e.y - pl.y;
        if (Math.abs(dx) > (opt.range || 420) || Math.abs(dy) > 160) continue;
        const d = Math.abs(dx) + Math.abs(dy) * 0.5; if (d < bd) { bd = d; best = e; }
      }
      let dir = 0, hit = false;
      if (best) {
        const dx = best.x - pl.x, near = opt.near || 44;
        if (Math.abs(dx) > near) dir = Math.sign(dx); else { hit = true; if ((f % 20) === 0) dir = Math.sign(dx) || 1; }
        if (opt.shoot && Math.abs(dx) < 300) hit = true;
        if (best.y < pl.y - 50 && (f % 24) === 0) I.press('jump'); else if ((f % 24) === 3) I.release('jump');
      } else dir = opt.idle === 'stay' ? 0 : 1;
      set('right', dir > 0); set('left', dir < 0);
      set('punch', (hit || opt.always) && (f % (opt.rate || 5)) < 2);
      if (opt.jump) set('jump', (t % opt.jump) < 0.2);
      if (opt.thr) set('throw', (t % opt.thr) < 0.1);
      return;
    }
    const dir = opt.dir || 'right';
    set(dir, opt.walk !== false && !(opt.stopEvery && (t % opt.stopEvery) > opt.stopEvery - 0.6));
    if (opt.up) set('up', true);
    set(opt.fire || 'punch', opt.hold ? true : (f % (opt.rate || 6)) < 2);
    if (opt.jump) set('jump', (t % opt.jump) < 0.25);
    if (opt.thr) set('throw', (t % opt.thr) < 0.1);
    if (opt.weave) { const s = Math.sin(t * opt.weave); set('up', s > 0.5); set('down', s < -0.5); }
  },
  async rec(name, secs, opt) {
    const cv = document.querySelector('canvas');
    const N = Math.round(secs * 30); let pend = []; this.track = [];
    for (let i = 0; i < N; i++) {
      if (opt) this.bot(i / 30, i, opt);
      this.step(1);
      this.track.push(this.pos);
      pend.push(cv.toDataURL('image/jpeg', 0.9));       // toDataURL синхронный — не тормозит в скрытой вкладке
      if (pend.length >= 10 || i === N - 1) {
        await fetch(`http://127.0.0.1:18910/b?c=${name}&i=${i - pend.length + 1}`, { method: 'POST', body: pend.join('\n') });
        pend = [];
      }
    }
    await fetch(`http://127.0.0.1:18910/j?c=${name}&i=0`, { method: 'POST', body: JSON.stringify(this.track) });
    for (const k in G.Input.down) G.Input.release(k);
    return N;
  },
  skip(secs, opt) { const N = Math.round(secs * 30); for (let i = 0; i < N; i++) { if (opt) this.bot(i / 30, i, opt); this.step(1); } },
  state() { return { st: typeof App !== 'undefined' && App.state }; },
};
