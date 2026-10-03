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
  city: {
    bpm: 118, loop: true, tracks: [
      { wave: 'square', vol: 0.07, notes: bar(`
        E4 - - G4 - - A4 - B4 - A4 - G4 - E4 -   D4 - - - E4 - - - G4 - - - . . . .
        E4 - - G4 - - A4 - B4 - D5 - B4 - A4 -   G4 - - - E4 - - - . . . . . . . .`) },
      { wave: 'triangle', vol: 0.2, notes: bar(`
        E2 . E3 . E2 . E3 . E2 . E3 . D2 . D3 .   C2 . C3 . C2 . C3 . D2 . D3 . D2 . B1 .
        E2 . E3 . E2 . E3 . E2 . E3 . D2 . D3 .   C2 . C3 . D2 . D3 . E2 . E3 . E2 . . .`) },
      { drum: true, vol: 0.14, notes: 'k . h . s . h k . k h . s . h h' },
    ],
  },
  epic: {
    bpm: 132, loop: true, tracks: [
      { wave: 'square', vol: 0.075, notes: bar(`
        D5 - - - A4 - D5 - F5 - E5 - D5 - C5 -   D5 - - - - - A4 - F4 - G4 - A4 - - -
        A#4 - - - A#4 - C5 - D5 - C5 - A#4 - A4 -   A4 - - - G4 - F4 - E4 - F4 - G4 - A4 -
        D5 - - - F5 - A5 - G5 - F5 - E5 - D5 -   C5 - - - D5 - E5 - F5 - - - E5 - D5 -
        A#4 - - - D5 - F5 - A5 - G5 - F5 - D5 -   E5 - - - C#5 - - - A4 - - - - - - -`) },
      { wave: 'sawtooth', vol: 0.05, notes: bar(`
        D4 - - - - - - - F4 - - - - - - -   D4 - - - - - - - A3 - - - - - - -
        A#3 - - - - - - - D4 - - - - - - -   A3 - - - - - - - C#4 - - - - - - -
        D4 - - - - - - - F4 - - - - - - -   C4 - - - - - - - F4 - - - - - - -
        A#3 - - - - - - - D4 - - - - - - -   A3 - - - - - - - E4 - - - - - - -`) },
      { wave: 'triangle', vol: 0.2, notes: bar(`
        D2 . D3 . D2 . D3 . D2 . D3 . D2 . D3 .   D2 . D3 . D2 . D3 . D2 . D3 . D2 . D3 .
        A#1 . A#2 . A#1 . A#2 . A#1 . A#2 . A#1 . A#2 .   A1 . A2 . A1 . A2 . A1 . A2 . A1 . A2 .
        D2 . D3 . D2 . D3 . D2 . D3 . D2 . D3 .   C2 . C3 . C2 . C3 . C2 . C3 . C2 . C3 .
        A#1 . A#2 . A#1 . A#2 . A#1 . A#2 . A#1 . A#2 .   A1 . A2 . A1 . A2 . A1 . A2 . C#2 . E2 .`) },
      { drum: true, vol: 0.15, notes: 'k . h . s . h k k . h . s . s s' },
    ],
  },
  chase: {
    bpm: 168, loop: true, tracks: [
      { wave: 'square', vol: 0.07, notes: bar(`
        A4 - A4 C5 - A4 E5 - D5 - C5 - B4 - G4 - -   A4 - A4 C5 - A4 E5 - F5 - E5 - D5 - C5 - -
        A4 - A4 C5 - A4 E5 - G5 - F5 - E5 - D5 - -   C5 - C5 E5 - C5 G5 - F5 - E5 - D5 - B4 - -
        A4 - A4 C5 - A4 E5 - D5 - C5 - B4 - G4 - -   A4 - A4 C5 - A4 E5 - F5 - E5 - D5 - C5 - -
        E5 - E5 D5 - C5 B4 - A4 - G4 - A4 - B4 - -   C5 - B4 A4 - G4 E4 - A4 - - - - - - - -`) },
      { wave: 'sawtooth', vol: 0.045, notes: bar(`
        A3 - - - E3 - - - A3 - - - E3 - - -   A3 - - - E3 - - - A3 - - - E3 - - -
        F3 - - - C3 - - - G3 - - - D3 - - -   A3 - - - E3 - - - A3 - - - E3 - - -
        A3 - - - E3 - - - A3 - - - E3 - - -   A3 - - - E3 - - - A3 - - - E3 - - -
        F3 - - - C3 - - - G3 - - - D3 - - -   A3 - - - E3 - - - A3 - - - - - - -`) },
      { wave: 'triangle', vol: 0.2, notes: bar(`
        A1 . A2 . A1 . A2 . A1 . A2 . A1 . A2 .   A1 . A2 . A1 . A2 . A1 . A2 . A1 . A2 .
        F1 . F2 . F1 . F2 . G1 . G2 . G1 . G2 .   A1 . A2 . A1 . A2 . A1 . A2 . A1 . A2 .
        A1 . A2 . A1 . A2 . A1 . A2 . A1 . A2 .   A1 . A2 . A1 . A2 . A1 . A2 . A1 . A2 .
        F1 . F2 . F1 . F2 . G1 . G2 . G1 . G2 .   A1 . A2 . A1 . A2 . E2 . E2 . A1 . A2 .`) },
      { drum: true, vol: 0.16, notes: 'k . h . s . h k k . h . s . s s' },
    ],
  },
  epicBoss: {
    bpm: 164, loop: true, tracks: [
      { wave: 'square', vol: 0.075, notes: bar(`
        E5 - E5 - G5 - E5 - B5 - - - A5 - G5 -   F#5 - - - D5 - F#5 - A5 - - - G5 - F#5 -
        E5 - E5 - G5 - B5 - E6 - - - D6 - B5 -   C6 - - - B5 - A5 - G5 - F#5 - D#5 - - -`) },
      { wave: 'sawtooth', vol: 0.06, notes: bar(`
        E2 E2 E3 E2 E2 E3 E2 E3 E2 E2 E3 E2 E2 E3 E2 E3   D2 D2 D3 D2 D2 D3 D2 D3 D2 D2 D3 D2 D2 D3 D2 D3
        E2 E2 E3 E2 E2 E3 E2 E3 E2 E2 E3 E2 E2 E3 E2 E3   C2 C2 C3 C2 C2 C3 C2 C3 B1 B1 B2 B1 B1 B2 D#2 F#2`) },
      { drum: true, vol: 0.16, notes: 'k . h k s . h . k k h k s . s s' },
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
  App.results = { st, score: level.score, timeBonus, noDeath, total, rank, title, shown: 0, id: level.id || 1 };
  try {
    const key = 'valera_best_l' + (level.id || 1);
    const best = JSON.parse(localStorage.getItem(key) || 'null');
    App.results.best = best;
    if (!best || total > best.total) localStorage.setItem(key, JSON.stringify({ total, rank, time: st.time }));
    const prog = +(localStorage.getItem('valera_progress') || 1);
    localStorage.setItem('valera_progress', String(Math.max(prog, (level.id || 1) + 1)));
  } catch (e) {}
  Music.play('victory');
  setState('results');
};

function startLevel5(opts = {}) {
  if (G.portraits && G.portraits.valera4) G.portraits.valera = G.portraits.valera4;
  App.level = new L5.Level();
  setState('play');
  App.paused = false;
  App.level.start(opts);
}
function startLevel4(opts = {}) {
  if (G.portraits && G.portraits.valera4) G.portraits.valera = G.portraits.valera4;
  App.level = new L4.Level();
  setState('play');
  App.paused = false;
  App.level.start(opts);
}
function startLevel3(opts = {}) {
  if (G.portraits && G.portraits.valeraOrig) G.portraits.valera = G.portraits.valeraOrig;
  App.level = new L3.Level();
  setState('play');
  App.paused = false;
  App.level.start(opts);
}
function startLevel2(opts = {}) {
  if (G.portraits && G.portraits.valeraOrig) G.portraits.valera = G.portraits.valeraOrig;
  App.level = new L2.Level();
  setState('play');
  App.paused = false;
  App.level.start(opts);
}
// ---------- сложность и выбор уровня ----------
const DIFFS = [
  { name: 'ВАЛЕРА ПОСЛЕ ОТПУСКА', tag: 'ЛЁГКИЙ', color: '#8cf08c', anim: 'beerHappy', dmg: 1.0, heal: 1.5, boss: 0.75, text: ['Отдохнул, выспался.', 'Враги бьют слабее,', 'еда лечит больше.'] },
  { name: 'ВАЛЕРА ПОСЛЕ СМЕНЫ', tag: 'НОРМАЛЬНЫЙ', color: '#ffd84a', anim: 'tiredStand', dmg: 1.5, heal: 1.0, boss: 1.0, text: ['Устал, но держится.', 'Честная драка', 'как задумано.'] },
  { name: 'ВАЛЕРА С ПОХМЕЛЬЯ', tag: 'ХАРДКОР', color: '#ff5a3a', anim: 'dazed', dmg: 2.2, heal: 0.7, boss: 1.3, text: ['Голова трещит.', 'Бьют очень больно,', 'боссы крепче.'] },
];
const LEVELS = [
  { id: 1, name: 'СЕВМОЛОТ', sub: 'День первый', start: () => startLevel1() },
  { id: 2, name: 'ДОРОГА ДОМОЙ', sub: 'Вечерний Выборгск', start: () => startLevel2() },
  { id: 3, name: 'ГЛЮКИ', sub: 'Квартира Валеры', start: () => startLevel3() },
  { id: 4, name: 'ДИКИЕ КОШКИ', sub: 'Клуб. Спасти Вову', start: () => startLevel4() },
  { id: 5, name: 'ПОГОНЯ', sub: 'Вид сверху. Гонка с Граблионком', start: () => startLevel5() },
  { id: 6, name: '???', sub: 'Скоро', start: null },
];
function progress() { try { return +(localStorage.getItem('valera_progress') || 1); } catch (e) { return 1; } }
function applyDiff(i) {
  const d = DIFFS[i];
  G.DMG_MULT = d.dmg; G.HEAL_MULT = d.heal; G.BOSS_MULT = d.boss; G.DIFF = i;
  try { localStorage.setItem('valera_diff', String(i)); } catch (e) {}
}
try { const sd = localStorage.getItem('valera_diff'); if (sd != null) applyDiff(+sd); else applyDiff(1); } catch (e) { applyDiff(1); }
function chooseDiff(levelIdx) { App.pendingLevel = levelIdx; App.diffSel = G.DIFF != null ? G.DIFF : 1; setState('difficulty'); }
function menuItems() {
  const it = [['НАЧАТЬ ИГРУ', () => chooseDiff(0)]];
  it.push(['ВЫБОР УРОВНЯ', () => { App.lvlSel = Math.min(progress(), 2) - 1; setState('levels'); }]);
  it.push(['УПРАВЛЕНИЕ', () => setState('controls')]);
  it.push(['ЗВУК: ' + (Sound.muted ? 'ВЫКЛ' : 'ВКЛ'), () => Sound.toggleMute()]);
  return it;
}
function startLevel1(opts = {}) {
  if (G.portraits && G.portraits.valeraOrig) G.portraits.valera = G.portraits.valeraOrig;
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
      const mi = menuItems(); App.menu = Math.min(App.menu, mi.length - 1);
      if (I.pressed('up')) { App.menu = (App.menu + mi.length - 1) % mi.length; Sound.play('select'); }
      if (I.pressed('down')) { App.menu = (App.menu + 1) % mi.length; Sound.play('select'); }
      if (I.pressed('start') || I.pressed('jump') || I.pressed('punch')) {
        Sound.unlock(); Sound.play('confirm');
        mi[App.menu][1]();
      }
      const a = titleActor.a;
      if (a) {
        a.update(dt);
        if (a.anim === 'walk') { a.x += a.facing * 50 * dt; if (a.x > 600 || a.x < 40) { a.setAnim(U.choice(['stomp', 'scratch', 'yawn', 'belly'])); a.facing *= -1; a.idleT = 0; } }
        else { a.idleT = (a.idleT || 0) + dt; if (a.idleT > 3) a.setAnim('walk'); }
      }
      break;
    }
    case 'difficulty': {
      if (I.pressed('left')) { App.diffSel = (App.diffSel + 2) % 3; Sound.play('select'); }
      if (I.pressed('right')) { App.diffSel = (App.diffSel + 1) % 3; Sound.play('select'); }
      if (App.t > 0.2 && I.pressed('pause')) { Sound.play('select'); setState('title'); }
      if (App.t > 0.2 && (I.pressed('start') || I.pressed('jump') || I.pressed('punch'))) { Sound.play('confirm'); applyDiff(App.diffSel); LEVELS[App.pendingLevel].start(); }
      break;
    }
    case 'levels': {
      const open = progress();
      if (I.pressed('left')) { App.lvlSel = (App.lvlSel + LEVELS.length - 1) % LEVELS.length; Sound.play('select'); }
      if (I.pressed('right')) { App.lvlSel = (App.lvlSel + 1) % LEVELS.length; Sound.play('select'); }
      if (App.t > 0.2 && I.pressed('pause')) { Sound.play('select'); setState('title'); }
      if (App.t > 0.2 && (I.pressed('start') || I.pressed('jump') || I.pressed('punch'))) {
        const L = LEVELS[App.lvlSel];
        if (L.start && L.id <= open) { Sound.play('confirm'); chooseDiff(App.lvlSel); }
        else { Sound.play('warn'); App.lockedT = 1; }
      }
      if (App.lockedT > 0) App.lockedT -= dt;
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
      if (r.shown > 1 && (I.pressed('start') || I.pressed('jump') || I.pressed('punch'))) { Sound.play('confirm'); if (r.id === 1) startLevel2(); else if (r.id === 2) startLevel3(); else if (r.id === 3) startLevel4(); else if (r.id === 4) startLevel5(); else { setState('soon'); Music.play('title'); } }
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
  G.text('ВЫБОРГСК · ЛЕМУРИЯ · 2000-е', W / 2, 108, { size: 8, align: 'center', color: '#c8d0d8' });
  if (titleActor.a) titleActor.a.draw(c);
  if (G.bg.fgCars) c.drawImage(G.bg.fgCars, 0, 0, W, H);
  // меню
  const items = menuItems().map(m => m[0]);
  items.forEach((s, i) => {
    const y = 160 + i * 22, sel = App.menu === i;
    if (sel) { Art.R(c, W / 2 - 110, y - 5, 220, 18, 'rgba(240,106,20,0.25)'); G.text('>', W / 2 - 100 + Math.sin(G.t * 8) * 2, y, { color: '#ffd84a' }); }
    G.text(s, W / 2, y, { align: 'center', color: sel ? '#fff' : '#9aa4ae' });
  });
  let best = null;
  try { best = JSON.parse(localStorage.getItem('valera_best_l1') || 'null'); } catch (e) {}
  if (best) G.text('Рекорд ур.1: ' + best.total + ' (' + best.rank + ')', W / 2, 258, { align: 'center', size: 8, color: '#ffd84a' });
  if ((G.t * 2 | 0) % 2) G.text('Нажми ENTER', W / 2, H - 22, { align: 'center', color: '#e8e0c8' });
  G.text('v0.3 · уровни 1–2', 6, H - 12, { size: 8, color: 'rgba(255,255,255,0.4)' });
}

function drawDifficulty(c) {
  if (G.img.street) c.drawImage(G.img.street, 0, 0, W, H);
  c.fillStyle = 'rgba(8,10,14,0.72)'; c.fillRect(0, 0, W, H);
  G.text('ВЫБЕРИ ВАЛЕРУ', W / 2, 16, { size: 16, align: 'center', color: '#f06a14', outline: true });
  G.text('Уровень: ' + LEVELS[App.pendingLevel].name, W / 2, 40, { align: 'center', color: '#c8d0d8' });
  DIFFS.forEach((d, i) => {
    const cw = 194, x = 16 + i * (cw + 11), y = 58, ch = 262, sel = App.diffSel === i;
    Art.R(c, x - 2, y - 2, cw + 4, ch + 4, sel ? d.color : '#2a2e34');
    Art.R(c, x, y, cw, ch, sel ? 'rgba(40,34,30,0.96)' : 'rgba(20,22,26,0.94)');
    // портрет-сцена
    Art.R(c, x + 6, y + 6, cw - 12, 150, '#15181e');
    c.save(); c.beginPath(); c.rect(x + 6, y + 6, cw - 12, 150); c.clip();
    const g = c.createLinearGradient(0, y + 6, 0, y + 156);
    g.addColorStop(0, i === 0 ? '#3a6a8a' : i === 1 ? '#5a3a2a' : '#2a1a2a'); g.addColorStop(1, '#101216');
    c.fillStyle = g; c.fillRect(x + 6, y + 6, cw - 12, 150);
    Spr.drawAnim(c, 'valeraBig', d.anim, G.t, x + cw / 2, y + 158, 1, { scale: sel ? 0.9 : 0.84, alpha: sel ? 1 : 0.65 });
    c.restore();
    G.text(d.tag, x + cw / 2, y + 166, { align: 'center', size: 16, color: d.color, outline: true });
    G.wrap(d.name, cw - 12, 8).forEach((l, k) => G.text(l, x + cw / 2, y + 190 + k * 12, { align: 'center', color: '#f4f0e4' }));
    d.text.forEach((l, k) => G.text(l, x + cw / 2, y + 216 + k * 12, { align: 'center', size: 8, color: '#9aa4ae' }));
    if (sel) G.text('<  >', x + cw / 2, y + ch - 12, { align: 'center', color: d.color });
  });
  if ((G.t * 2 | 0) % 2) G.text('ENTER — играть     ESC — назад', W / 2, H - 22, { align: 'center', color: '#e8e0c8' });
}

function drawLevels(c) {
  if (G.img.street) c.drawImage(G.img.street, 0, 0, W, H);
  c.fillStyle = 'rgba(8,10,14,0.72)'; c.fillRect(0, 0, W, H);
  G.text('ВЫБОР УРОВНЯ', W / 2, 16, { size: 16, align: 'center', color: '#f06a14', outline: true });
  const open = progress();
  // видно три карточки, остальные — прокруткой
  const first = U.clamp(App.lvlSel - 1, 0, Math.max(0, LEVELS.length - 3));
  if (first > 0 && (G.t * 3 | 0) % 2) G.text('<', 6, 170, { size: 16, color: '#ffd84a', outline: true });
  if (first + 3 < LEVELS.length && (G.t * 3 | 0) % 2) G.text('>', W - 18, 170, { size: 16, color: '#ffd84a', outline: true });
  LEVELS.slice(first, first + 3).forEach((L, j) => {
    const i = first + j;
    const cw = 194, x = 16 + j * (cw + 11), y = 50, ch = 260, sel = App.lvlSel === i, locked = !L.start || L.id > open;
    Art.R(c, x - 2, y - 2, cw + 4, ch + 4, sel ? (locked ? '#8a2a2a' : '#ffd84a') : '#2a2e34');
    Art.R(c, x, y, cw, ch, 'rgba(20,22,26,0.95)');
    const px = x + 6, py = y + 6, pw = cw - 12, ph = 150;
    c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
    if (L.id === 1 && G.bg.hall) { c.drawImage(G.bg.hall, 200, 0, 880, 720, px, py, pw, ph); Spr.draw(c, 'sub', 0, px + pw / 2 + 10, py + 120, 1, { scale: 0.35 }); }
    else if (L.id === 2 && L2.img.sky) { c.drawImage(L2.img.sky, 0, 0, 900, 720, px, py, pw * 1.3, ph * 1.3); if (L2.img.b_shop) c.drawImage(L2.img.b_shop, px + 10, py + 10, pw - 20, (pw - 20) * 0.99); }
    else if (L.id === 4 && L4.img.l4_sq) { const im = L4.img.l4_sq, sh = im.width * ph / pw; c.drawImage(im, 0, (im.height - sh) * 0.6, im.width, sh, px, py, pw, ph); }
    else if (L.id === 5 && L5.img.l5_card) c.drawImage(L5.img.l5_card, 200, 0, 880, 720, px, py, pw, ph);
    else if (L.id === 3 && L3.img.comic4) c.drawImage(L3.img.comic4, 200, 0, 880, 720, px, py, pw, ph);
    else { c.fillStyle = '#0c0d10'; c.fillRect(px, py, pw, ph); G.text('?', px + pw / 2, py + 55, { align: 'center', size: 32, color: '#3a3f45' }); }
    if (locked) {
      c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(px, py, pw, ph);
      // замок
      const lx = px + pw / 2, ly = py + ph / 2;
      c.strokeStyle = '#c8a020'; c.lineWidth = 4; c.beginPath(); c.arc(lx, ly - 8, 11, Math.PI, 0); c.stroke();
      Art.R(c, lx - 16, ly - 8, 32, 26, '#c8a020'); Art.R(c, lx - 3, ly, 6, 10, '#3a2a10');
    }
    c.restore();
    G.text('УРОВЕНЬ ' + L.id, x + cw / 2, y + 164, { align: 'center', color: locked ? '#6a6e74' : '#ffd84a' });
    G.text(L.name, x + cw / 2, y + 180, { align: 'center', size: L.name.length > 10 ? 12 : 16, color: locked ? '#6a6e74' : '#f4f0e4', outline: true });
    G.wrap(L.sub, cw - 14, 8).slice(0, 2).forEach((ln, k) => G.text(ln, x + cw / 2, y + 202 + k * 11, { align: 'center', color: '#9aa4ae' }));
    let best = null; try { best = JSON.parse(localStorage.getItem('valera_best_l' + L.id) || 'null'); } catch (e) {}
    if (best && !locked) G.text('Рекорд: ' + best.total + ' (' + best.rank + ')', x + cw / 2, y + 226, { align: 'center', size: 8, color: '#8cf08c' });
    if (locked) G.text(L.start ? 'Пройди уровень ' + (L.id - 1) : 'В разработке', x + cw / 2, y + 226, { align: 'center', size: 8, color: '#a86a5a' });
  });
  if (App.lockedT > 0) G.text('ЭТОТ УРОВЕНЬ ЕЩЁ ЗАКРЫТ!', W / 2, 322, { align: 'center', color: '#ff5a3a', outline: true });
  else if ((G.t * 2 | 0) % 2) G.text('ENTER — выбрать     ESC — назад', W / 2, H - 22, { align: 'center', color: '#e8e0c8' });
}

function drawControls(c) {
  Art.R(c, 0, 0, W, H, '#16191e');
  G.text('УПРАВЛЕНИЕ', W / 2, 20, { size: 16, align: 'center', color: '#f06a14', outline: true });
  const rows = [
    ['СТРЕЛКИ / A D', 'Бег'],
    ['ВВЕРХ ВНИЗ / W S', 'Лестницы'],
    ['Z / ПРОБЕЛ / K', 'Прыжок (держи — выше)'],
    ['ВНИЗ', 'Присесть (пули и удары пролетят мимо)'],
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
  G.text('УРОВЕНЬ ' + r.id + ' ПРОЙДЕН!', W / 2, 18, { size: 16, align: 'center', color: '#ffd84a', outline: true });
  G.text(['', '«Севмолот. День первый»', '«Дорога домой»', '«Глюки»', '«Дикие кошки»'][r.id] || '', W / 2, 42, { align: 'center', color: '#c8d0d8' });
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
  G.text('УРОВЕНЬ 5', W / 2, 90, { size: 24, align: 'center', color: '#e03030', outline: true });
  G.text('СКОРО', W / 2, 126, { size: 16, align: 'center', color: '#f4f0e4', outline: true });
  G.text('Клуб «Дикие кошки». Вова ждёт спасения...', W / 2, 180, { align: 'center', color: '#c8d0d8' });
  G.text('(жду описание следующего уровня)', W / 2, 200, { align: 'center', color: '#8a929a' });
  if ((G.t * 2 | 0) % 2) G.text('ENTER — в меню', W / 2, H - 28, { align: 'center' });
}

// отладка: все атласы (?sprites)
function drawSprites(c) {
  Art.R(c, 0, 0, W, H, '#5a6068');
  let x = 4, y = 4, rowH = 0;
  const sc = App.spriteScale || 0.5;
  for (const [name, sh] of Object.entries(Spr.sheets)) {
    sh.f.forEach((f, i) => {
      const w = f[2] / 2 * sc, h = f[3] / 2 * sc;
      if (x + w > W - 4) { x = 4; y += rowH + 4; rowH = 0; }
      Spr.draw(c, name, i, x + f[4] / 2 * sc, y + f[5] / 2 * sc, 1, { scale: sc });
      x += w + 3; rowH = Math.max(rowH, h);
    });
  }
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
  c.setTransform(2, 0, 0, 2, 0, 0);
  c.save();
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  if (G.shakeT > 0) c.translate(Math.round(U.rand(-G.shakeAmt, G.shakeAmt)), Math.round(U.rand(-G.shakeAmt, G.shakeAmt)));
  switch (App.state) {
    case 'loading':
      G.text('ЗАГРУЗКА...', W / 2, H / 2, { align: 'center' });
      break;
    case 'title': drawTitle(c); break;
    case 'controls': drawControls(c); break;
    case 'difficulty': drawDifficulty(c); break;
    case 'levels': drawLevels(c); break;
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
  const [head, street] = await Promise.all([G.loadImage('assets/valera_head.png'), G.loadImage('assets/street.jpg'), Spr.load(), Spr.loadBGs(), L2.load(), L3.load(), L4.load(), L5.load()]);
  G.img.valeraHeadSrc = head; G.img.street = street;
  try { await Promise.race([document.fonts.load('8px "Press Start 2P"'), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
  G.img.valeraHud = G.downscale(head, 52, 54);
  G.img.valeraPortrait = G.downscale(head, 120, 122);
  titleActor.a = new G.Actor('valera', 120, 312, 1);
  titleActor.a.setAnim('walk');
  const q = new URLSearchParams(location.search);
  if (q.has('sprites')) { App.spriteScale = +(q.get('scale') || 0.5); setState('sprites'); return; }
  if (q.has('l5')) startLevel5();
  else if (q.has('l5drive')) startLevel5({ drive: true });
  else if (q.has('l5race')) startLevel5({ race: true });
  else if (q.has('l5end')) startLevel5({ end: true });
  else if (q.has('l4')) startLevel4();
  else if (q.has('l4tower')) startLevel4({ tower: true });
  else if (q.has('l4inner')) startLevel4({ inner: true });
  else if (q.has('l4boss')) startLevel4({ boss: true });
  else if (q.has('l4escort')) startLevel4({ escort: true });
  else if (q.has('l3boss')) startLevel3({ boss: true });
  else if (q.has('l3')) startLevel3();
  else if (q.has('l2boss')) startLevel2({ boss: true });
  else if (q.has('l2')) startLevel2();
  else if (q.has('boss')) { Sound.unlock(); startLevel1({ boss: true }); }
  else if (q.has('climb')) { startLevel1({ skip: true }); }
  else { setState('title'); Music.play('title'); }
})();
