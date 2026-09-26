'use strict';
// ============ ГЛАВНЫЙ ЦИКЛ, МЕНЮ, ИТОГИ, МУЗЫКА ============

// ---------- музыка (чиптюн) ----------
const bar = s => s.trim().split(/\s+/).join(' ');
Music.songs = {
  level: {
    bpm: 148, loop: true, tracks: [
      { wave: 'square', vol: 0.06, notes: bar(`
        A4 - - . C5 - E5 - D5 - C5 - B4 - C5 -   A4 - - - - - . . F4 - A4 - C5 - A4 -
        G4 - - . E4 - G4 - C5 - B4 - G4 - E4 -   D4 - - - G4 - B4 - D5 - - - B4 - - -
        A4 - - . C5 - E5 - A5 - G5 - E5 - C5 -   F5 - - - E5 - C5 - A4 - C5 - F5 - - -
        E5 - - . G5 - E5 - C5 - - - G4 - C5 -   B4 - - - D5 - B4 - G4 - - - . . . .`) },
      { wave: 'triangle', vol: 0.16, notes: bar(`
        A2 . A3 . A2 . A3 . A2 . A3 . G2 . G3 .   F2 . F3 . F2 . F3 . F2 . F3 . E2 . E3 .
        C3 . C4 . C3 . C4 . C3 . C4 . B2 . B3 .   G2 . G3 . G2 . G3 . G2 . G3 . E2 . G2 .
        A2 . A3 . A2 . A3 . A2 . A3 . G2 . G3 .   F2 . F3 . F2 . F3 . F2 . F3 . E2 . E3 .
        C3 . C4 . C3 . C4 . C3 . C4 . B2 . B3 .   G2 . G3 . G2 . G3 . G2 . G3 . E2 . G2 .`) },
      { drum: true, vol: 0.12, notes: 'k . h . s . h . k k h . s . h h' },
    ],
  },
  boss: {
    bpm: 172, loop: true, tracks: [
      { wave: 'square', vol: 0.06, notes: bar(`
        E5 - E5 - D5 - E5 - G5 - - - F#5 - E5 -   C5 - - - E5 - G5 - C6 - B5 - G5 - E5 -
        D5 - - - F#5 - A5 - D6 - - - C6 - A5 -   B4 - D#5 - F#5 - B5 - A5 - G5 - F#5 - D#5 -`) },
      { wave: 'sawtooth', vol: 0.07, notes: bar(`
        E2 E2 E3 E2 E2 E3 E2 E3 E2 E2 E3 E2 E2 E3 E2 E3   C2 C2 C3 C2 C2 C3 C2 C3 C2 C2 C3 C2 C2 C3 C2 C3
        D2 D2 D3 D2 D2 D3 D2 D3 D2 D2 D3 D2 D2 D3 D2 D3   B1 B1 B2 B1 B1 B2 B1 B2 B1 B1 B2 B1 D#2 D#2 F#2 F#2`) },
      { drum: true, vol: 0.13, notes: 'k . h k s . h . k . h k s . s s' },
    ],
  },
  cutscene: {
    bpm: 84, loop: true, tracks: [
      { wave: 'triangle', vol: 0.12, notes: bar(`A3 - - - - - - - E4 - - - - - - -   F3 - - - - - - - C4 - - - - - - -   C4 - - - - - - - G3 - - - - - - -   G3 - - - - - - - E3 - - - D3 - - -`) },
      { wave: 'square', vol: 0.025, notes: bar(`. . . . A4 . C5 . . . E5 . . . D5 .   . . . . A4 . F4 . . . C5 . . . A4 .   . . . . G4 . E4 . . . C5 . . . B4 .   . . . . D5 . B4 . . . G4 . . . . .`) },
    ],
  },
  intro: {
    bpm: 76, loop: true, tracks: [
      { wave: 'triangle', vol: 0.14, notes: bar(`D3 - - - - - - - - - - - - - - -   A#2 - - - - - - - - - - - - - - -   F3 - - - - - - - - - - - - - - -   C3 - - - - - - - - - - - A2 - - -`) },
      { wave: 'square', vol: 0.03, notes: bar(`D5 - - - F5 - - - A5 - - - G5 - F5 -   F5 - - - - - D5 - - - - - . . . .   C5 - - - D5 - - - F5 - - - A5 - G5 -   E5 - - - - - - - . . . . . . . .`) },
    ],
  },
  title: {
    bpm: 112, loop: true, tracks: [
      { wave: 'square', vol: 0.05, notes: bar(`
        E4 - G4 - A4 - - - G4 - E4 - D4 - E4 -   C4 - - - - - D4 - E4 - - - . . . .
        E4 - G4 - A4 - - - C5 - B4 - A4 - G4 -   A4 - - - - - - - . . . . . . . .`) },
      { wave: 'triangle', vol: 0.15, notes: bar(`
        A2 . A2 . E3 . A2 . A2 . A2 . E3 . A2 .   F2 . F2 . C3 . F2 . G2 . G2 . D3 . G2 .
        A2 . A2 . E3 . A2 . A2 . A2 . E3 . A2 .   E2 . E2 . B2 . E2 . E2 . G#2 . B2 . E3 .`) },
      { drum: true, vol: 0.09, notes: 'k . . . s . . . k . k . s . . h' },
    ],
  },
  sting: {
    bpm: 120, loop: false, tracks: [
      { wave: 'sawtooth', vol: 0.08, notes: 'A2 - - - - - - - A#2 - - - - - - - A2 - - - - - - - - - - - - - - -' },
      { wave: 'square', vol: 0.05, notes: 'E4 - - - - - - - F4 - - - - - - - E4 - - - - - - - - - - - - - - -' },
    ],
  },
  victory: {
    bpm: 150, loop: false, tracks: [
      { wave: 'square', vol: 0.07, notes: 'C5 . C5 . C5 . C5 - - - G#4 - - - A#4 - - - C5 - - A#4 C5 - - - - - - - - -' },
      { wave: 'triangle', vol: 0.15, notes: 'C3 . C3 . C3 . C3 - - - G#2 - - - A#2 - - - C3 - - - - - - - - - - - - -' },
    ],
  },
};

// ---------- состояния ----------
const App = { state: 'loading', t: 0, menu: 0, level: null, paused: false, pauseSel: 0, results: null };
G.App = App;
const titleActor = { a: null, dir: 1 };
const snow = [];
for (let i = 0; i < 90; i++) snow.push({ x: Math.random() * W, y: Math.random() * H, s: 10 + Math.random() * 25, d: Math.random() * 6 });

function setState(s) { App.state = s; App.t = 0; }

G.onLevelComplete = function (level) {
  const st = level.stats;
  const timeBonus = Math.max(0, Math.round((480 - st.time) * 10));
  const noDeath = st.deaths === 0 ? 3000 : 0;
  const total = level.score + timeBonus + noDeath;
  let rank = 'C', title = 'Практикант';
  if (total > 22000 && st.deaths === 0) { rank = 'S'; title = 'Бригадир от Бога'; }
  else if (total > 16000) { rank = 'A'; title = 'Стропальщик 6-го разряда'; }
  else if (total > 10000) { rank = 'B'; title = 'Крепкий середнячок'; }
  App.results = { st, score: level.score, timeBonus, noDeath, total, rank, title, shown: 0 };
  try {
    const best = JSON.parse(localStorage.getItem('valera_best_l1') || 'null');
    App.results.best = best;
    if (!best || total > best.total) localStorage.setItem('valera_best_l1', JSON.stringify({ total, rank, time: st.time }));
    localStorage.setItem('valera_progress', '2');
  } catch (e) {}
  Music.play('victory');
  setState('results');
};

function startLevel1(opts = {}) {
  App.level = new L1.Level();
  setState('play');
  App.paused = false;
  if (opts.boss) {
    App.level.carry = { ammo: { nuts: 10, wrench: 1, bricks: 4 }, weapon: 'nuts', hp: 100 };
    App.level.arena = new L1.Arena(App.level);
    App.level.startBoss();
  } else App.level.start(opts.skip);
}

const fmtTime = s => { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

// ---------- обновление ----------
function update(dt) {
  const I = G.Input;
  App.t += dt;
  if (I.pressed('mute')) Sound.toggleMute();
  switch (App.state) {
    case 'title': {
      if (I.pressed('up')) { App.menu = (App.menu + 2) % 3; Sound.play('select'); }
      if (I.pressed('down')) { App.menu = (App.menu + 1) % 3; Sound.play('select'); }
      if (I.pressed('start') || I.pressed('jump') || I.pressed('punch')) {
        Sound.unlock(); Sound.play('confirm');
        if (App.menu === 0) startLevel1();
        else if (App.menu === 1) setState('controls');
        else Sound.toggleMute();
      }
      const a = titleActor.a;
      if (a) {
        a.update(dt);
        if (a.anim === 'walk') { a.x += a.facing * 40 * dt; if (a.x > 560 || a.x < 80) { a.setAnim('hips'); a.facing *= -1; a.idleT = 0; } }
        else { a.idleT = (a.idleT || 0) + dt; if (a.idleT > 3) a.setAnim('walk'); }
      }
      break;
    }
    case 'controls':
      if (App.t > 0.2 && (I.pressed('start') || I.pressed('jump') || I.pressed('punch') || I.pressed('pause'))) { Sound.play('select'); setState('title'); }
      break;
    case 'play': {
      const lv = App.level;
      if (App.paused) {
        if (I.pressed('up') || I.pressed('down')) { App.pauseSel = 1 - App.pauseSel; Sound.play('select'); }
        if (I.pressed('pause')) App.paused = false;
        if (I.pressed('start') || I.pressed('jump')) {
          if (App.pauseSel === 0) App.paused = false;
          else { App.paused = false; Music.play('title'); setState('title'); }
        }
        return;
      }
      if (lv.canPause && I.pressed('pause')) { App.paused = true; App.pauseSel = 0; Sound.play('select'); return; }
      lv.update(dt);
      break;
    }
    case 'results': {
      const r = App.results;
      r.shown += dt;
      if (r.shown > 1 && (I.pressed('start') || I.pressed('jump') || I.pressed('punch'))) { Sound.play('confirm'); setState('soon'); Music.play('title'); }
      break;
    }
    case 'soon':
      if (App.t > 0.5 && (I.pressed('start') || I.pressed('jump') || I.pressed('punch'))) { Sound.play('select'); setState('title'); }
      break;
  }
}

// ---------- отрисовка ----------
function drawTitle(c) {
  if (G.img.street) c.drawImage(G.img.street, 0, 0, W, H);
  c.fillStyle = 'rgba(10,12,16,0.45)'; c.fillRect(0, 0, W, H);
  for (const s of snow) {
    s.y += s.s * G.dt; s.x += Math.sin(G.t + s.d) * 8 * G.dt;
    if (s.y > H) { s.y = -4; s.x = Math.random() * W; }
    Art.R(c, s.x, s.y, 2, 2, 'rgba(230,236,240,0.8)');
  }
  // логотип
  const bob = Math.sin(G.t * 2) * 2;
  G.text('ВАЛЕРА', W / 2, 36 + bob, { size: 40, align: 'center', color: '#f06a14', outline: true });
  G.text('АГЕНТ RED', W / 2, 84 + bob, { size: 16, align: 'center', color: '#e03030', outline: true });
  G.text('СЕВЕРОДВИНСК · 2000-е', W / 2, 108, { size: 8, align: 'center', color: '#c8d0d8' });
  if (titleActor.a) titleActor.a.draw(c);
  // меню
  const items = ['НАЧАТЬ ИГРУ', 'УПРАВЛЕНИЕ', 'ЗВУК: ' + (Sound.muted ? 'ВЫКЛ' : 'ВКЛ')];
  items.forEach((s, i) => {
    const y = 160 + i * 22, sel = App.menu === i;
    if (sel) { Art.R(c, W / 2 - 110, y - 5, 220, 18, 'rgba(240,106,20,0.25)'); G.text('>', W / 2 - 100 + Math.sin(G.t * 8) * 2, y, { color: '#ffd84a' }); }
    G.text(s, W / 2, y, { align: 'center', color: sel ? '#fff' : '#9aa4ae' });
  });
  let best = null;
  try { best = JSON.parse(localStorage.getItem('valera_best_l1') || 'null'); } catch (e) {}
  if (best) G.text('Рекорд ур.1: ' + best.total + ' (' + best.rank + ')', W / 2, 232, { align: 'center', size: 8, color: '#ffd84a' });
  if ((G.t * 2 | 0) % 2) G.text('Нажми ENTER', W / 2, H - 22, { align: 'center', color: '#e8e0c8' });
  G.text('v0.1 · уровень 1', 6, H - 12, { size: 8, color: 'rgba(255,255,255,0.4)' });
}

function drawControls(c) {
  Art.R(c, 0, 0, W, H, '#16191e');
  G.text('УПРАВЛЕНИЕ', W / 2, 20, { size: 16, align: 'center', color: '#f06a14', outline: true });
  const rows = [
    ['СТРЕЛКИ / A D', 'Бег'],
    ['ВВЕРХ ВНИЗ / W S', 'Лестницы'],
    ['Z / ПРОБЕЛ / K', 'Прыжок (держи — выше)'],
    ['ВНИЗ + ПРЫЖОК', 'Спрыгнуть с балки'],
    ['X / J', 'Удар (3 раза — апперкот)'],
    ['C / L', 'Бросить гайку/ключ/кирпич'],
    ['Q / V', 'Сменить снаряд'],
    ['ESC / P', 'Пауза, пропуск сценки'],
    ['ENTER', 'Далее в диалогах'],
    ['M', 'Звук вкл/выкл'],
  ];
  rows.forEach(([k, v], i) => { G.text(k, 60, 60 + i * 20, { color: '#ffd84a' }); G.text(v, 300, 60 + i * 20, { color: '#e8e0c8' }); });
  G.text('Геймпад: A — прыжок, X — удар, B — бросок, Y — смена', W / 2, 272, { align: 'center', size: 8, color: '#9aa4ae' });
  G.text('На телефоне — кнопки на экране', W / 2, 288, { align: 'center', size: 8, color: '#9aa4ae' });
  if ((G.t * 2 | 0) % 2) G.text('ENTER — назад', W / 2, H - 28, { align: 'center' });
}

function drawResults(c) {
  const r = App.results, st = r.st;
  Art.R(c, 0, 0, W, H, '#14171c');
  if (G.img.street) { c.globalAlpha = 0.18; c.drawImage(G.img.street, 0, 0, W, H); c.globalAlpha = 1; }
  G.text('УРОВЕНЬ 1 ПРОЙДЕН!', W / 2, 18, { size: 16, align: 'center', color: '#ffd84a', outline: true });
  G.text('«Севмаш. День первый»', W / 2, 42, { align: 'center', color: '#c8d0d8' });
  const rows = [
    ['Время', fmtTime(st.time)],
    ['Врагов повержено', st.kills],
    ['Отбито предметов', st.deflect],
    ['Съедено вкусняшек', st.food],
    ['Значков «Ударник»', st.secrets + ' / 3'],
    ['Получено урона', Math.round(st.dmg)],
    ['Падений (смертей)', st.deaths],
    ['Очки', r.score],
    ['Бонус за время', r.timeBonus],
    ['Без смертей', r.noDeath],
  ];
  const n = Math.min(rows.length, Math.floor(r.shown * 5));
  rows.slice(0, n).forEach(([k, v], i) => {
    G.text(k, 110, 66 + i * 17, { color: '#c8d0d8' });
    G.text(String(v), 530, 66 + i * 17, { color: '#fff', align: 'right' });
  });
  if (r.shown > 2.3) {
    G.text('ИТОГО: ' + r.total, W / 2, 242, { size: 16, align: 'center', color: '#ffd84a', outline: true });
    const k = Math.min(1, (r.shown - 2.6) * 3);
    if (k > 0) {
      c.save(); c.translate(560, 250); c.scale(1 + (1 - k) * 2, 1 + (1 - k) * 2);
      G.text(r.rank, 0, -20, { size: 40, align: 'center', color: r.rank === 'S' ? '#ffd84a' : r.rank === 'A' ? '#8cf08c' : '#8cd0ff', outline: true });
      c.restore();
      G.text('Звание: ' + r.title, W / 2, 268, { align: 'center', color: '#f06a14' });
    }
  }
  if (r.shown > 1 && (G.t * 2 | 0) % 2) G.text('ENTER — дальше', W / 2, H - 24, { align: 'center' });
}

function drawSoon(c) {
  Art.R(c, 0, 0, W, H, '#0e1014');
  G.text('УРОВЕНЬ 2', W / 2, 90, { size: 24, align: 'center', color: '#e03030', outline: true });
  G.text('СКОРО', W / 2, 126, { size: 16, align: 'center', color: '#f4f0e4', outline: true });
  G.text('Индийский спецназ уже идёт по следу агента RED...', W / 2, 180, { align: 'center', color: '#c8d0d8' });
  G.text('(жду описание следующего уровня)', W / 2, 200, { align: 'center', color: '#8a929a' });
  if ((G.t * 2 | 0) % 2) G.text('ENTER — в меню', W / 2, H - 28, { align: 'center' });
}

// отладка: все позы крупно (?sprites)
const spriteRigs = {};
function drawSprites(c) {
  Art.R(c, 0, 0, W, H, '#6a7078');
  const names = App.spriteList;
  const sc = App.spriteScale || 2;
  const cols = Math.floor(W / (40 * sc));
  names.forEach((n, i) => {
    const key = App.spriteStyle + n;
    if (!spriteRigs[key]) spriteRigs[key] = new Hum.Rig(App.spriteStyle);
    const r = spriteRigs[key];
    r.update(G.dt, Hum.P[n](G.t % 3), true);
    const x = (i % cols) * 40 * sc + 20 * sc, y = Math.floor(i / cols) * 84 * sc + 78 * sc;
    c.save(); c.translate(x, y); c.scale(sc, sc);
    r.draw(c, 0, 0, 1, { t: G.t });
    c.restore();
    G.text(n, x, y + 2, { size: 8, align: 'center' });
  });
}

function drawPause(c) {
  c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 0, W, H);
  G.text('ПАУЗА', W / 2, 110, { size: 24, align: 'center', color: '#ffd84a', outline: true });
  ['ПРОДОЛЖИТЬ', 'ВЫЙТИ В МЕНЮ'].forEach((s, i) => {
    const sel = App.pauseSel === i;
    G.text((sel ? '> ' : '  ') + s, W / 2, 170 + i * 22, { align: 'center', color: sel ? '#fff' : '#8a929a' });
  });
  G.text('M — звук: ' + (Sound.muted ? 'ВЫКЛ' : 'ВКЛ'), W / 2, 240, { align: 'center', color: '#8a929a' });
}

function draw() {
  const c = ctx;
  c.save();
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  if (G.shakeT > 0) c.translate(Math.round(U.rand(-G.shakeAmt, G.shakeAmt)), Math.round(U.rand(-G.shakeAmt, G.shakeAmt)));
  switch (App.state) {
    case 'loading':
      G.text('ЗАГРУЗКА...', W / 2, H / 2, { align: 'center' });
      break;
    case 'title': drawTitle(c); break;
    case 'controls': drawControls(c); break;
    case 'play': App.level.draw(c); if (App.paused) drawPause(c); break;
    case 'results': drawResults(c); break;
    case 'soon': drawSoon(c); break;
    case 'sprites': drawSprites(c); break;
  }
  c.restore();
  if (G.flashT > 0) { c.globalAlpha = Math.min(0.7, G.flashT * 3); c.fillStyle = G.flashColor; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
}

// ---------- цикл ----------
let last = performance.now();
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  G.t += dt;
  G.Input.pollGamepad();
  let gdt = dt;
  if (G.hitStop > 0) { G.hitStop -= dt; gdt = dt * 0.1; }
  if (G.shakeT > 0) { G.shakeT -= dt; if (G.shakeT <= 0) G.shakeAmt = 0; }
  if (G.flashT > 0) G.flashT -= dt;
  G.dt = gdt;
  try { update(gdt); } catch (e) { console.error(e); }
  Music.update();
  try { draw(); } catch (e) { console.error(e); }
  G.Input.endFrame();
  requestAnimationFrame(frame);
}

// ---------- загрузка ----------
(async function boot() {
  requestAnimationFrame(frame);
  const [head, street] = await Promise.all([G.loadImage('assets/valera_head.png'), G.loadImage('assets/street.jpg')]);
  G.img.valeraHeadSrc = head; G.img.street = street;
  try { await Promise.race([document.fonts.load('8px "Press Start 2P"'), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
  Hum.initHead();
  G.img.aerial = Art.buildAerial();
  G.img.hall = Art.buildHallScene();
  G.img.arenaBG = L1.buildArenaBG();
  titleActor.a = new G.Actor('valera', 120, 330, 1);
  titleActor.a.setAnim('walk');
  const q = new URLSearchParams(location.search);
  if (q.has('sprites')) { App.spriteStyle = q.get('style') || 'valera'; App.spriteScale = +(q.get('scale') || 2); App.spriteList = (q.get('list') || 'stand,run,jump,fall,punch,uppercut,throw,hurt,climb,hips,shout,point,scratch,yawn,sitFloor,drink').split(','); setState('sprites'); return; }
  if (q.has('boss')) { Sound.unlock(); startLevel1({ boss: true }); }
  else if (q.has('climb')) { startLevel1({ skip: true }); }
  else { setState('title'); Music.play('title'); }
})();
