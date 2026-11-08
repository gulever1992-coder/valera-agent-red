// Уровень 10 «ФИНАЛ» — гигант-Семён. ТЗ: docs/L10_TZ.md, раскадровка: docs/L10_STORYBOARD.md.
// Части: intro (кинокатсцена) -> run (ф1, крыши) -> jet (ф2, джетпак) -> mid (катсцена) -> sea (ф3, море) -> nuke -> outro.
// Листы L10D (js/l10_data.js) рисуются как L9D: координаты логические 640x360, кадры в пикселях холста (k=0.5).
const L10 = { img: {}, ready: false, PARTS: {} };
WHO.yurik = WHO.yurik || { name: 'ЮРИК', color: '#7fd0ff', voice: 105 };
WHO.basov = WHO.basov || { name: 'БАСОВ', color: '#e0b070', voice: 80 };
WHO.sub1 = WHO.sub1 || { name: 'ПОДВОДНИК', color: '#9fc0d0', voice: 95 };
WHO.sub2 = WHO.sub2 || { name: 'КАПИТАН', color: '#d0d8e0', voice: 75 };
WHO.semen = WHO.semen || { name: 'СЕМЁН', color: '#7cff6a', voice: 60 };
(() => {
  const D = () => window.L10D;
  L10.N = {};
  L10.load = async () => {
    if (L10.ready) return;
    await L9.load();                                       // Валера, оружие и эффекты — из ур.9
    const names = Object.keys(D()).filter(n => n[0] !== '_');
    await Promise.all(names.map(async n => { L10.img[n] = await G.loadImage('assets/l10/' + n + '.png'); }));
    await Promise.all(Object.keys(D()._bg || {}).map(async n => { L10.img[n] = await G.loadImage('assets/l10/' + n + '.jpg'); }));
    await Promise.all(Object.keys(D()._bgp || {}).map(async n => { L10.img[n] = await G.loadImage('assets/l10/' + n + '.png'); }));
    if (L10.RIG2) L10.img.rig20 = await G.loadImage('assets/l10/rig20.png');     // риг Семёна
    if (L10.RIG3) L10.img.rig30 = await G.loadImage('assets/l10/rig30.png');     // риг Семёна анфас (фаза 3)
    if (L10.SEA3 && L10.SEA3.layers) await Promise.all([...new Set(L10.SEA3.layers.map(l => l.img).filter(Boolean))].map(async n => { try { L10.img['sea3_' + n] = await G.loadImage('assets/l10/sea3/' + n + '.png'); } catch (er) {} }));     // свои картинки слоёв сцены фазы 3
    if (L10.SEM3 && L10.SEM3.use) await Promise.all([...new Set(L10.SEM3.parts.map(p => p.img))].map(async n => { try { L10.img['s3_' + n] = await G.loadImage('assets/l10/sem3/' + n + '.png'); } catch (er) {} }));     // Семён из «Редактора Семёна»
    if (L10.BLD2) await Promise.all(['bld10', 'rtop10'].map(async n => { try { L10.img[n] = await G.loadImage('assets/l10/' + n + '.png'); } catch (er) {} }));     // новые дома и предметы на крышах
    if (L10.RSC) await Promise.all([['rsrun', 'png']].concat(L10.RSC.plates.map(n => [n, 'jpg'])).map(async ([n, e]) => { try { L10.img[n] = await G.loadImage('assets/l10/' + n + '.' + e); } catch (er) {} }));     // катсцена: бег по крыше, завод и Семён
    if (L10.BG1) await Promise.all([['bg1sky', 'jpg'], ['bg1sea', 'jpg'], ['bg1cranes', 'png'], ['bg1quay', 'png'], ['bg1ships', 'png']].map(async ([n, e]) => { try { L10.img[n] = await G.loadImage('assets/l10/' + n + '.' + e); } catch (er) {} }));     // фон фазы 1: 4 слоя параллакса
    if (L10.MIDA) await Promise.all(['jpg', 'png'].flatMap(e => L10.MIDA[e].map(n => [n, e])).map(async ([n, e]) => { try { L10.img['mid_' + n] = await G.loadImage('assets/l10/mid/' + n + '.' + e + '?v=' + G.VER); } catch (er) {} }));     // катсцена mid (джетпак сбит)
    for (const n of names) { L10.N[n] = {}; (D()[n].n || []).forEach((nm, i) => L10.N[n][nm] = i); }
    G.portraits = G.portraits || {};
    await Promise.all(['yurik', 'basov', 'sub1', 'sub2', 'semen', 'valera6', 'sailor', 'capt'].filter(k => !G.portraits[k]).map(async k => { try { G.portraits[k] = await G.loadImage('assets/spr/p_' + k + '.png'); } catch (e) {} }));
    L10.ready = true;
  };
  L10.has = sh => !!(D()[sh] && L10.img[sh]);
  L10.fr = (sh, i) => { const d = D()[sh]; if (!d) return null; return d.f[typeof i === 'number' ? i : L10.N[sh][i]]; };
  // кадр листа: якорь (x, y); s — масштаб; o: rot, flip, a, sx, sy, add, comp
  L10.spr = (c, sh, i, x, y, s = 1, o = {}) => {
    const f = L10.fr(sh, i), im = L10.img[sh]; if (!f || !im) return;
    const k = s * 0.5;
    c.save(); c.translate(x, y);
    if (o.rot) c.rotate(o.rot);
    if (o.flip) c.scale(-1, 1);
    if (o.sx || o.sy) c.scale(o.sx || 1, o.sy || 1);
    if (o.a != null) c.globalAlpha *= o.a;
    if (o.add) c.globalCompositeOperation = 'lighter';
    if (o.comp) c.globalCompositeOperation = o.comp;
    c.imageSmoothingEnabled = true;
    c.drawImage(im, f[0], f[1], f[2], f[3], -f[4] * k, -f[5] * k, f[2] * k, f[3] * k);
    c.restore(); c.imageSmoothingEnabled = false;
  };
  L10.size = (sh, i) => { const f = L10.fr(sh, i); return f ? [f[2] * 0.5, f[3] * 0.5] : [0, 0]; };
  L10.rnd = (a, b) => a + Math.random() * (b - a);
  L10.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  L10.lerp = (a, b, t) => a + (b - a) * t;
  L10.ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  // фон-картинка, растянутая по высоте h, с повтором по x (параллакс k)
  L10.SEAMLESS = new Set(['bg1sea']);     // бесшовные по краям (сшиты перекрёстным растворением) — тайлятся без зеркала: у зеркальных копий на волнах видны стыки (владелец)
  L10.bgTile = (c, n, camx, k, y = 0, h = 360, flipEven = false) => {
    const im = L10.img[n]; if (!im) return;
    const w = im.width / im.height * h, x0 = -((camx * k) % w + w) % w;
    c.imageSmoothingEnabled = true;
    const i0 = Math.floor((camx * k) / w);
    const mir = !L10.SEAMLESS.has(n); for (let x = x0, i = i0; x < 640; x += w, i++) { if ((i & 1) && mir) { c.save(); c.translate(Math.floor(x) + Math.ceil(w) + 1, y); c.scale(-1, 1); c.drawImage(im, 0, 0, Math.ceil(w) + 1, h); c.restore(); } else c.drawImage(im, Math.floor(x), y, Math.ceil(w) + 1, h); }     // нечётные — зеркально: стыков не видно
    c.imageSmoothingEnabled = false;
  };
  L10.ORDER = ['intro', 'run', 'jet', 'mid', 'sea', 'nuke', 'outro'];
  L10.TAUNTS = {
    run: ['Я устал от этого города! От этого завода!', 'Мне нужно большего! Я еду в столицу!', 'Город продан, Валера. Контракт подписан!', 'Я выжму из него все соки. И из тебя тоже!', 'Это я скинул Граблионка в реку!', 'Беги, беги! Крыши тебя не спасут!'],
    jet: ['Кеша тоже был шустрый... пока не получил мой шприц!', 'Я носил маску Кеши и катался за тобой на Матизе!', 'В столовой я сидел рядом. Ты даже не заметил!', 'Наташке привет передать?', 'Я изучил тебя, Валера. Каждый твой шаг!', 'Лети-лети. Падать будет больнее!'],
    sea: ['Всё должно было быть идеально!', 'Я убрал твоих друзей, чтобы добраться до тебя!', 'Тони, Валера! Море моё, завод мой!', 'Олигархи заплатят за этот город сполна!', 'Твой плот — щепки, твой город — мой!', 'Ты мне весь контракт сорвал!'],
  };

  // ---------- погода: дождь и молнии (поверх всего, кроме HUD) ----------
  // бушующее море под грозой (фон фаз 1 и 2): слои bg1sky/bg1sea + корабли и подлодки; o.seaY — горизонт, o.seaH — высота моря
  L10.makeStorm = (W, o = {}) => {
    const SEA_Y = o.seaY ?? 194, SEA_H = o.seaH ?? 175, SEA_P = 0.05, SEA_W = 1500, rnd = L10.rnd;
    const ships = [];     // x — координата моря, sp — скорость, z — даль (0 у горизонта .. 1 ближе)
    for (let i = 0; i < (o.ships ?? 7); i++) ships.push({ k: i < 4 ? i : 'sub', x: rnd(0, SEA_W), sp: rnd(6, 18) * (Math.random() < 0.5 ? -1 : 1), z: rnd(0.05, 0.75), ph: rnd(0, 6) });
    ships.sort((a, b) => a.z - b.z);
    return (c, cx) => {
      const t = G.t;
      L10.bgTile(c, 'bg1sky', cx + t * 260, 0.01, -24, SEA_Y + 56);     // небо: облака ползут, вспышка грозы подсвечивает
      if (W.flash > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = W.flash * 0.5; L10.bgTile(c, 'bg1sky', cx + t * 260, 0.01, -24, SEA_Y + 56); c.restore(); }
      W.drawBolt(c);
      L10.bgTile(c, 'bg1sea', cx + t * 140, SEA_P, SEA_Y + Math.sin(t * 0.9) * 1.5, SEA_H);     // море: два слоя волн навстречу
      c.save(); c.globalAlpha = 0.33; L10.bgTile(c, 'bg1sea', cx - t * 190 + 700, SEA_P, SEA_Y + 3 + Math.sin(t * 1.3 + 1) * 2.5, SEA_H); c.restore();
      const im = L10.img.bg1ships, R = L10.BG1 && L10.BG1.ships, dz = o.shipZ ?? 30;
      for (const sh of ships) {
        const x = ((sh.x + sh.sp * t - cx * SEA_P * (0.6 + sh.z)) % SEA_W + SEA_W) % SEA_W - 250, y = SEA_Y + 9 + sh.z * dz + Math.sin(t * 1.1 + sh.ph) * (1 + sh.z * 2), s = 0.12 + sh.z * 0.16, rot = Math.sin(t * 0.9 + sh.ph) * 0.025;
        if (x < -200 || x > 840) continue;
        c.save(); c.translate(x, y); c.rotate(rot); c.imageSmoothingEnabled = true;
        if (sh.k === 'sub') { if (L10.has('sub10')) L10.spr(c, 'sub10', 'sub', 0, 6 * s, s * 0.9, { flip: sh.sp < 0 }); }
        else if (im && R) { const r = R[sh.k], w = r[2] * s, h = r[3] * s; if (sh.sp < 0) c.scale(-1, 1); c.drawImage(im, r[0], r[1], r[2], r[3], -w / 2, -h, w, h); }
        c.restore();
      }
      c.imageSmoothingEnabled = false;
    };
  };
  L10.Weather = class {
    constructor(n = 220) { this.d = []; for (let i = 0; i < n; i++) this.d.push({ x: Math.random() * 700, y: Math.random() * 380, v: 520 + Math.random() * 380, l: 8 + Math.random() * 12, z: Math.random() }); this.flash = 0; this.flashK = 1; this.next = 2 + Math.random() * 4; this.bolt = null; this.wind = -0.28; }
    update(dt, intensity = 1) {
      for (const p of this.d) { p.y += p.v * dt; p.x += p.v * this.wind * dt; if (p.y > 370) { p.y = -20 - Math.random() * 40; p.x = Math.random() * 760; } if (p.x < -40) p.x += 760; }
      this.flash = Math.max(0, this.flash - dt * 2.6); this.next -= dt * intensity;
      if (this.next <= 0) { this.next = 2.5 + Math.random() * 5; this.flash = 1; this.bolt = { x: 40 + Math.random() * 560, t: 0, seed: Math.random() * 1000 }; Sound.play('zap', 0.5); G.shake(2, 0.3); }
      if (this.bolt) { this.bolt.t += dt; if (this.bolt.t > 0.35) this.bolt = null; }
    }
    drawBolt(c) {     // молния на небе — кадр листа fx10, если есть
      if (!this.bolt) return;
      if (L10.has('fx10')) { const n = 'bolt' + ((this.bolt.seed | 0) % 2), f = L10.fr('fx10', n); L10.spr(c, 'fx10', n, this.bolt.x, f ? f[5] * 0.55 * 1.2 - 4 : 80, 1.1, { a: 1 - this.bolt.t / 0.35, add: 1, sy: 1.2 }); }     // верх молнии всегда у верхнего края кадра
    }
    draw(c, a = 1) {
      c.save(); c.globalAlpha = 0.42 * a; c.strokeStyle = '#a8c4d8'; c.lineWidth = 1; c.beginPath();
      for (const p of this.d) { const l = p.l * (0.6 + p.z * 0.6); c.moveTo(p.x, p.y); c.lineTo(p.x - l * this.wind * 1.1, p.y - l); }
      c.stroke(); c.restore();
      if (this.flash > 0) { c.fillStyle = `rgba(210,230,255,${this.flash * 0.35 * a * this.flashK})`; c.fillRect(0, 0, 640, 360); }
    }
  };

  L10.Level = class {
    constructor() { this.id = 10; this.stats = { time: 0, dmg: 0, kills: 0, deflect: 0, secrets: 0, food: 0, deaths: 0, shots: 0, hits: 0 }; this.score = 0; }
    start(opts = {}) {
      Scene.active = false; Scene.dialog = null;
      this.opts = opts; this.loading = true; this.partName = L10.PARTS[opts.part] ? opts.part : L10.ORDER[0]; this.ck = opts.ck || 0;
      L10.load().then(() => { this.loading = false; this.reset(); }).catch(e => { console.error(e); this.err = String(e); });
    }
    get canPause() { return !(this.P && this.P.cine); }     // в катсцене Esc = пропуск, не пауза
    reset() {
      this.t = 0; this.dead = 0; this.done = false; this.fadeIn = 0.7; this.msg = null; this.msgT = 0; this.tv = null; this.tvT = 0; this.eaten = 0; this.tn = null; this.tnT = 3.5;
      this.P = L10.PARTS[this.partName]; this.P.start(this, this.ck); if (L10.Drops) L10.Drops.reset(this);
    }
    say(s, t = 2.2) { this.msg = s; this.msgT = t; }
    // Семён бросается фразами во время боя (владелец 2026-11-08; по его истории: контракт олигархов, Граблионок, Кеша, Матиз, столовая)
    tauntUpd(dt) {
      const L = L10.TAUNTS[this.partName], P = this.P; if (!L || P.cine || this.dead || (P.B && P.B.hp <= 0)) { this.tn = null; return; }
      if (this.tn && (this.tn.t += dt) > this.tn.d) this.tn = null;
      if ((this.tnT -= dt) > 0 || this.tn) return;
      if (!this.tnQ || !this.tnQ.length) this.tnQ = L.slice().sort(() => Math.random() - 0.5);
      const text = this.tnQ.pop(); this.tn = { text, t: 0, d: 2.2 + text.length * 0.045 }; this.tnT = 11 + Math.random() * 5; Sound.play('blip', 90);
    }
    drawTaunt(c) {     // владелец: фразы без окна — просто крупный текст с обводкой
      const n = this.tn; if (!n) return; const a = L10.clamp(Math.min(n.t, n.d - n.t) / 0.2, 0, 1), sh = n.t < 0.15 ? (1 - n.t / 0.15) * 3 : 0; c.globalAlpha = a;
      G.wrap(n.text.slice(0, Math.floor(n.t * 40)), 520, 12).slice(0, 2).forEach((l, i) => G.text(l, 320 + (Math.random() - 0.5) * sh, 30 + i * 18, { align: 'center', size: 12, color: '#b8ff7a', outline: true, shadowColor: '#0a1a04' }));
      c.globalAlpha = 1;
    }
    xsay() {}
    next() {
      const i = L10.ORDER.indexOf(this.partName);
      if (i < L10.ORDER.length - 1) { const wasCine = this.P && this.P.cine; this.partName = L10.ORDER[i + 1]; this.ck = 0; this.reset(); if (wasCine) this.fadeIn = 0.15; }     // из катсцены — почти без затемнения
      else { this.done = true; G.onLevelComplete(this); }
    }
    hurt(d) {
      const P = this.P; if (this.dead || this.done || P.inv > 0) return;
      P.hp -= d; this.stats.dmg += d; P.inv = 0.9; Sound.play('hurt'); G.flash(0.08, '#f33'); G.shake(4, 0.25);
      if (P.hp <= 0) { P.hp = 0; this.dead = 0.001; this.stats.deaths++; if (P.onDie) P.onDie(this); }
    }
    kill(text) { const P = this.P; if (this.dead) return; P.hp = 0; this.dead = 0.001; this.stats.deaths++; this.deathText = text; if (P.onDie) P.onDie(this); }
    update(dt) {
      if (this.loading) return;
      this.t += dt; this.fadeIn -= dt; if (this.msgT > 0) this.msgT -= dt;
      if (Scene.active) { Scene.tick(dt); if (this.P.cutUpdate) this.P.cutUpdate(this, dt); return; }
      if (this.dead) { this.dead += dt; if (this.P.deadUpdate) this.P.deadUpdate(this, dt); if (this.dead > (this.P.deadTime || 2.6)) { this.deathText = null; this.reset(); } return; }
      this.stats.time += dt;
      this.P.update(this, dt);
      this.tauntUpd(dt);
      if (L10.Drops) L10.Drops.update(this, dt);
    }
    draw(c) {
      if (this.loading) { c.fillStyle = '#000'; c.fillRect(0, 0, 640, 360); G.text(this.err ? 'ОШИБКА: ' + this.err.slice(0, 60) : 'ЗАГРУЗКА...', 320, 170, { align: 'center' }); return; }
      this.P.draw(this, c);
      if (L10.Drops && !Scene.active) L10.Drops.draw(this, c);
      if (!Scene.active && !this.P.noHud) this.drawHud(c);
      if (!Scene.active) this.drawTaunt(c);
      const my = this.tn ? 70 : 44;     // под плашкой Семёна
      if (this.msgT > 0 && this.msg) { const m = Game.fmtHint(this.msg), w = m.length * 8 + 16; c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(320 - w / 2, my, w, 14); G.text(m, 320, my + 3, { align: 'center', size: 8, color: '#ffd84a', outline: true }); }     /* выше и на подложке — не на лице Семёна (арт-директор) */
      if (this.dead) { c.fillStyle = `rgba(0,0,0,${L10.clamp(this.dead / 1.4, 0, 0.92)})`; c.fillRect(0, 0, 640, 360); if (this.dead > 0.8) G.text(this.deathText || this.P.deathText || 'ВАЛЕРА ПОГИБ', 320, 160, { align: 'center', size: 16, color: '#ff5050', outline: true }); }
      if (this.fadeIn > 0) { c.fillStyle = `rgba(0,0,0,${L10.clamp(this.fadeIn / 0.7, 0, 1)})`; c.fillRect(0, 0, 640, 360); }
      Scene.drawDialog(c);
    }
    drawHud(c) {
      const P = this.P;
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(6, 6, 148, 16); c.fillStyle = '#400'; c.fillRect(9, 9, 142, 10);
      c.fillStyle = P.hp > 35 ? '#3c3' : '#e33'; c.fillRect(9, 9, 142 * L10.clamp(P.hp / 100, 0, 1), 10);
      G.text('ВАЛЕРА', 12, 10, { size: 8 });
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(574, 6, 60, 16); G.text(String(this.score).padStart(6, '0'), 630, 10, { align: 'right', size: 8, color: '#ffd84a' });
      if (P.drawHud) P.drawHud(this, c);
      if (L10.Drops) L10.Drops.hud(this, c);
    }
  };
  // шкала босса: сегменты фазы, таймер сегмента
  L10.bossBar = (c, B, label = 'СЕМЁН', y = 340) => {
    const x = 170, w = 300;
    c.fillStyle = 'rgba(0,0,0,0.65)'; c.fillRect(x - 4, y - 14, w + 8, 24);
    G.text(label, x, y - 12, { size: 8, color: '#9dff7a' });
    const n = B.barSegs || B.segs, seg = w / n, sh = B.maxHp / n;     // barSegs: рисовать одной шкалой (ф3)
    for (let i = 0; i < n; i++) {
      const v = L10.clamp(B.hp - i * sh, 0, sh) / sh;
      c.fillStyle = '#301010'; c.fillRect(x + i * seg + 1, y, seg - 2, 7);
      c.fillStyle = B.inv ? '#5ad0ff' : B.flashT > 0 ? '#fff' : '#d82020'; c.fillRect(x + i * seg + 1, y, (seg - 2) * v, 7);
    }
    if (B.segT != null && B.hp > 0) { const left = Math.max(0, B.segLimit - B.segT), m = left / 60 | 0, s = left % 60 | 0; G.text(m + ':' + String(s).padStart(2, '0'), x + w, y - 12, { align: 'right', size: 8, color: left < 30 ? '#ff4040' : '#ffd84a' }); }
  };
})();

function startLevel10(opts = {}) {
  if (G.portraits && G.portraits.valera6) G.portraits.valera = G.portraits.valera6;
  App.level = new L10.Level();
  setState('play');
  App.paused = false;
  App.level.start(opts);
}
