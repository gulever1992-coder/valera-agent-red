// Уровень 9 «ПОДЗЕМКА». ТЗ: L9_TZ.md, концепт: L9_CONCEPT.md (раздел 10 — правки критика).
// Части: tun (капсула в тоннеле) -> arrive (катсцена) -> lab... Каждая часть — объект L9.PARTS[имя] с start/update/draw.
// Координаты логические 640x360; листы L9D (js/l9_data.js) в пикселях холста — рисуются с k=0.5.
const L9 = { img: {}, ready: false, PARTS: {} };
WHO.mrx = WHO.mrx || { name: 'ГОСПОДИН ИКС', color: '#ff4040', voice: 90 };
(() => {
  const D = () => window.L9D;
  L9.N = {};                         // имя кадра -> индекс, по листам
  L9.load = async () => {
    if (L9.ready) return;
    const names = Object.keys(D()).filter(n => n[0] !== '_');
    L9.img = L9.img || {};
    await Promise.all(names.map(async n => { L9.img[n] = await G.loadImage('assets/l9/' + n + (D()[n].add ? '.jpg' : '.png')); }));
    await Promise.all(Object.keys(D()._bg || {}).map(async n => { L9.img[n] = await G.loadImage('assets/l9/' + n + '.jpg'); }));
    await Promise.all(Object.keys(D()._bgp || {}).map(async n => { L9.img[n] = await G.loadImage('assets/l9/' + n + '.png'); }));
    for (const n of names) { L9.N[n] = {}; (D()[n].n || []).forEach((nm, i) => L9.N[n][nm] = i); }
    L9.img.props8 = await G.loadImage('assets/l8/props8.png');   // тень из ур.8 (Flow)
    G.portraits = G.portraits || {};
    await Promise.all(['mrx', 'valera6', 'kesha', 'grab'].filter(k => !G.portraits[k]).map(async k => { G.portraits[k] = await G.loadImage('assets/spr/p_' + k + '.png'); }));
    L9.ready = true;
  };
  L9.fi = (sh, name) => typeof name === 'number' ? name : L9.N[sh][name];
  // кадр листа: якорь (x, y); s — масштаб; o: rot, flip, a, sy, add (наложение lighter)
  L9.spr = (c, sh, i, x, y, s = 1, o = {}) => {
    const d = D()[sh] || (window.L8D && window.L8D[sh]); if (!d) return; const f = d.f[typeof i === 'number' ? i : (L9.N[sh] ? L9.N[sh][i] : (d.n || []).indexOf(i))], im = L9.img[sh]; if (!f || !im) return;
    const k = s * 0.5;
    c.save(); c.translate(Math.round(x), Math.round(y));
    if (o.rot) c.rotate(o.rot);
    if (o.flip) c.scale(-1, 1);
    if (o.sy) c.scale(1, o.sy);
    if (o.a != null) c.globalAlpha = o.a;
    if (d.add || o.add) c.globalCompositeOperation = 'lighter';
    c.imageSmoothingEnabled = s < 0.97 || !!o.rot;
    c.drawImage(im, f[0], f[1], f[2], f[3], -f[4] * k, -f[5] * k, f[2] * k, f[3] * k);
    c.restore(); c.imageSmoothingEnabled = false;
  };
  L9.size = (sh, i) => { const f = D()[sh].f[L9.fi(sh, i)]; return [f[2] * 0.5, f[3] * 0.5]; };
  L9.rnd = (a, b) => a + Math.random() * (b - a);
  L9.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  L9.ORDER = ['tun'];                // порядок частей (дополняется по мере сборки)

  L9.Level = class {
    constructor() { this.id = 9; this.canPause = true; this.stats = { time: 0, dmg: 0, kills: 0, deflect: 0, secrets: 0, food: 0, deaths: 0, shots: 0, hits: 0 }; this.score = 0; }
    start(opts = {}) {
      Scene.active = false; Scene.dialog = null;
      this.opts = opts; this.loading = true; this.partName = L9.PARTS[opts.part] ? opts.part : L9.ORDER[0]; this.ck = opts.ck || 0;
      L9.load().then(() => { this.loading = false; this.reset(); });
    }
    reset() {
      this.t = 0; this.dead = 0; this.done = false; this.fadeIn = 0.7; this.msg = null; this.msgT = 0; this.tv = null; this.tvT = 0;
      this.P = L9.PARTS[this.partName]; this.P.start(this, this.ck);
    }
    say(s, t = 2.2) { this.msg = s; this.msgT = t; }
    // реплика Икса без паузы (плашка сверху)
    xsay(s, t = 4.5) { this.tv = s; this.tvT = t; Sound.play('zap'); }
    next() {     // следующая часть уровня
      const i = L9.ORDER.indexOf(this.partName);
      if (i < L9.ORDER.length - 1) { this.partName = L9.ORDER[i + 1]; this.ck = 0; this.reset(); }
      else { this.done = true; G.onLevelComplete(this); }
    }
    hurt(d) {
      if (this.dead || this.done || this.P.inv > 0) return;
      this.P.hp -= d; this.stats.dmg += d; this.P.inv = 0.9; Sound.play('hurt'); G.flash(0.08, '#f33'); G.shake(4, 0.25);
      if (this.P.hp <= 0) { this.P.hp = 0; this.dead = 0.001; this.stats.deaths++; if (this.P.onDie) this.P.onDie(this); }
    }
    update(dt) {
      if (this.loading) return;
      this.t += dt; this.fadeIn -= dt; if (this.msgT > 0) this.msgT -= dt; if (this.tvT > 0) this.tvT -= dt;
      if (Scene.active) { Scene.tick(dt); if (this.P.cutUpdate) this.P.cutUpdate(this, dt); return; }
      if (this.dead) { this.dead += dt; if (this.P.deadUpdate) this.P.deadUpdate(this, dt); if (this.dead > 2.4) this.reset(); return; }
      this.stats.time += dt;
      this.P.update(this, dt);
    }
    draw(c) {
      if (this.loading) { c.fillStyle = '#000'; c.fillRect(0, 0, 640, 360); G.text('ЗАГРУЗКА...', 320, 170, { align: 'center' }); return; }
      this.P.draw(this, c);
      if (!Scene.active) this.drawHud(c);
      if (this.tvT > 0 && !Scene.active) {     // плашка Икса (в тоннеле — сверху, чтобы не закрывать полосы)
        const a = L9.clamp(Math.min(this.tvT, 0.4) / 0.4, 0, 1), Y = this.P.tvTop ? 26 : 300; c.globalAlpha = a;
        c.fillStyle = 'rgba(10,4,6,0.85)'; c.fillRect(80, Y, 480, 52); c.fillStyle = '#c22'; c.fillRect(80, Y, 480, 2);
        G.drawPortrait(c, 'mrx', 86, Y + 4, (this.t * 6 | 0) % 2 === 0);
        G.text('ГОСПОДИН ИКС', 156, Y + 6, { size: 8, color: '#ff5050' });
        G.wrap(this.tv, 390, 8).slice(0, 3).forEach((l, i) => G.text(l, 156, Y + 20 + i * 11, { size: 8, color: '#f4f0e4' }));
        c.globalAlpha = 1;
      }
      if (this.msgT > 0 && this.msg) G.text(Game.fmtHint(this.msg), 320, 70, { align: 'center', size: 8, color: '#ffd84a', outline: true });
      if (this.dead) { c.fillStyle = `rgba(0,0,0,${L9.clamp(this.dead / 1.4, 0, 0.92)})`; c.fillRect(0, 0, 640, 360); if (this.dead > 0.8) G.text(this.P.deathText || 'ВАЛЕРА ПОГИБ', 320, 160, { align: 'center', size: 16, color: '#f55' }); }
      if (this.fadeIn > 0) { c.fillStyle = `rgba(0,0,0,${L9.clamp(this.fadeIn / 0.7, 0, 1)})`; c.fillRect(0, 0, 640, 360); }
      Scene.drawDialog(c);
    }
    drawHud(c) {      // интерфейс — единственное, что рисуется кодом
      const P = this.P; if (P.noHud) return;
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(6, 6, 148, 16); c.fillStyle = '#400'; c.fillRect(9, 9, 142, 10);
      c.fillStyle = P.hp > 35 ? '#3c3' : '#e33'; c.fillRect(9, 9, 142 * L9.clamp(P.hp / 100, 0, 1), 10);
      G.text('ВАЛЕРА', 12, 10, { size: 8 });
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(574, 6, 60, 16); G.text(String(this.score).padStart(6, '0'), 630, 10, { align: 'right', size: 8, color: '#ffd84a' });
      if (P.drawHud) P.drawHud(this, c);
    }
  };
})();

function startLevel9(opts = {}) {
  if (G.portraits && G.portraits.valera6) G.portraits.valera = G.portraits.valera6;
  App.level = new L9.Level();
  setState('play');
  App.paused = false;
  App.level.start(opts);
}
