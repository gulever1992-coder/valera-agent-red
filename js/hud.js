'use strict';
// ============ ИНТЕРФЕЙС: оружие (как в GTA), здоровье, баланс, очки, значки + ПЕЙДЖЕР ============
// Макет: слева вверху — точки выбора оружия, рамка оружия, патроны (или бесконечность), шкала здоровья, баланс.
// Справа вверху — очки и значки «Ударник» (по 3 на уровень).
const HUD = {};
{
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  HUD.R = R;

  // знак бесконечности (в шрифте его нет — рисуем)
  HUD.inf = function (c, cx, cy, a = 6, col = '#fff') {
    c.save(); c.strokeStyle = 'rgba(0,0,0,0.8)'; c.lineWidth = 3.2;
    const path = () => { c.beginPath(); for (let i = 0; i <= 48; i++) { const t = i / 48 * Math.PI * 2, d = 1 + Math.sin(t) ** 2; const x = cx + a * Math.cos(t) / d, y = cy + a * Math.sin(t) * Math.cos(t) / d; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.stroke(); };
    path(); c.strokeStyle = col; c.lineWidth = 1.4; path(); c.restore();
  };
  // знак рубля: Р с перекладиной
  HUD.rub = function (c, x, y, col) {
    G.text('Р', x, y, { size: 8, color: col });
    R(c, x - 1, y + 5, 6, 1, col);
  };
  const sp = (name, f, s = 1) => (c, x, y) => { if (Spr.sheets[name]) Spr.drawC(c, name, f, x, y, 0, s); };
  const it = (kind, rot = 0, s = 1) => (c, x, y) => Art.item(c, kind, x, y, rot, s);
  const fistIcon = (c, x, y) => { if (Spr.sheets.icons4) Spr.drawC(c, 'icons4', 0, x, y, 0, 1.1); else G.text('КУЛАК', x, y - 3, { size: 7, align: 'center' }); };

  // какое оружие есть у Валеры: [{id, icon, n}] (n — число, строка или Infinity)
  HUD.weapons = function (pl) {
    if (pl.hudWeapons) return pl.hudWeapons();
    if (typeof L6 !== 'undefined' && L6.Player && pl instanceof L6.Player) {
      const l = [{ id: 'fist', icon: sp('hud6', 0, 1), n: Infinity }];
      if (pl.hasWand) l.push({ id: 'wand', icon: sp('hud6', 1, 1.15), n: Infinity, cool: pl.castCool > 0 && !pl.rapid ? 1 - pl.castCool / (pl.castMax || 5) : 0 });
      return { list: l, cur: pl.hasWand && pl.wmode === 'wand' ? 1 : 0 };
    }
    if (pl.ammo3) {
      const l4 = 'seed' in pl.ammo3;
      const l = [{ id: 'swatter', icon: it('swatter', -0.5, 1), n: pl.ammo3.swatter + '%' }];
      if (l4) {
        l.push({ id: 'fists', icon: fistIcon, n: Infinity });
        if (pl.hasSeed) l.push({ id: 'seed', icon: sp('icons4', pl.green ? 2 : 1, 1.1), n: pl.ammo3.seed });
      } else if (pl.ammo3.chalk > 0 || pl.weapon === 'chalk') l.push({ id: 'chalk', icon: it('chalk', 0, 1), n: pl.ammo3.chalk });
      let cur = l.findIndex(w => w.id === pl.weapon); if (cur < 0) cur = 0;
      return { list: l, cur };
    }
    if (pl.ammo) {
      const IC = { nuts: it('nut', 0, 1.3), wrench: it('wrench', 0.7, 1.1), bricks: it('brick', 0, 1.1), bottles: it('bottle', 0, 1.1) };
      const l = [{ id: 'fists', icon: fistIcon, n: Infinity }];
      for (const k of Game.WEAPONS) if (k !== 'fists' && (pl.ammo[k] > 0 || pl.weapon === k)) l.push({ id: k, icon: IC[k], n: pl.ammo[k] | 0 });
      let cur = l.findIndex(w => w.id === pl.weapon); if (cur < 0) cur = 0;
      return { list: l, cur };
    }
    return { list: [{ id: 'fists', icon: fistIcon, n: Infinity }], cur: 0 };
  };

  // левый верхний угол
  HUD.drawLeft = function (c, pl, wsIn) {
    const ws = wsIn || HUD.weapons(pl), w = ws.list[ws.cur] || ws.list[0];
    // точки — сколько вариантов оружия; выбранная крупнее и жёлтая
    ws.list.forEach((_, i) => {
      const y = 8 + i * 8, on = i === ws.cur;
      R(c, on ? 1 : 2, y - (on ? 3 : 2), on ? 6 : 4, on ? 6 : 4, '#000');
      R(c, on ? 2 : 3, y - (on ? 2 : 1), on ? 4 : 2, on ? 4 : 2, on ? '#ffd84a' : '#d8d4c8');
    });
    // рамка оружия
    const bx = 10, by = 4, bw = 38, bh = 32;
    R(c, bx, by, bw, bh, '#000'); R(c, bx + 1, by + 1, bw - 2, bh - 2, '#e8e2d0'); R(c, bx + 2, by + 2, bw - 4, bh - 4, '#23262b');
    R(c, bx + 2, by + 2, bw - 4, 2, 'rgba(255,255,255,0.08)');
    if (HUD.swapT > 0) { c.globalAlpha = HUD.swapT * 2; R(c, bx + 2, by + 2, bw - 4, bh - 4, '#ffd84a'); c.globalAlpha = 1; }
    c.save(); c.beginPath(); c.rect(bx + 2, by + 2, bw - 4, bh - 4); c.clip(); w.icon(c, bx + bw / 2, by + bh / 2); c.restore();
    if (w.cool) { R(c, bx + 2, by + bh - 4, bw - 4, 2, '#101216'); R(c, bx + 2, by + bh - 4, Math.round((bw - 4) * w.cool), 2, '#c8a0ff'); }
    // патроны под рамкой
    if (w.n === Infinity) HUD.inf(c, bx + bw / 2, by + bh + 7, 6);
    else { const empty = typeof w.n === 'number' && w.n <= 0; G.text(String(w.n), bx + bw / 2, by + bh + 2, { size: 8, align: 'center', color: empty ? '#ff6a4a' : '#fff', outline: true }); }
    if (pl.bottleHits > 0 && pl.weapon === 'bottles') G.text('БЬЁТ ' + pl.bottleHits, bx + bw / 2, by + bh + 12, { size: 7, align: 'center', color: '#8cf08c', outline: true });
    // здоровье
    const hx = 54, hy = 6, hw = 116, k = U.clamp(pl.hp / pl.maxHp, 0, 1);
    R(c, hx, hy, hw, 12, '#000'); R(c, hx + 1, hy + 1, hw - 2, 10, '#e8e2d0'); R(c, hx + 2, hy + 2, hw - 4, 8, '#3a1010');
    R(c, hx + 2, hy + 2, Math.round((hw - 4) * k), 8, k > 0.5 ? '#48c048' : k > 0.25 ? '#e0b020' : '#e03030');
    R(c, hx + 2, hy + 2, Math.round((hw - 4) * k), 2, 'rgba(255,255,255,0.35)');
    if (k < 0.3 && (G.t * 4 | 0) % 2) R(c, hx + 2, hy + 2, hw - 4, 8, 'rgba(255,60,60,0.25)');
    // баланс в банке
    const b = Pager.bal, neg = b < 0, col = neg ? ((G.t * 3 | 0) % 2 ? '#ff4a3a' : '#ff9a8a') : Pager.flashT > 0 ? '#ff8a6a' : '#e8e0c8';
    HUD.rub(c, hx, hy + 16, col);
    G.text((neg ? '-' : '') + Pager.fmt(Math.abs(b)), hx + 9, hy + 16, { size: 8, color: col, outline: true });
  };

  // правый верхний угол: очки и значки
  HUD.drawRight = function (c, world) {
    const lv = App.level || {}, st = lv.stats || (world && world.stats) || {};
    const score = world && world.score != null ? world.score : lv.score || 0;
    G.text('ОЧКИ ' + String(score).padStart(6, '0'), W - 8, 6, { size: 8, align: 'right', color: '#ffd84a', outline: true });
    const got = Math.min(3, st.secrets || 0);
    G.text(got + '/3', W - 8, 21, { size: 8, align: 'right', color: got >= 3 ? '#8cf08c' : '#e8e0c8', outline: true });
    for (let i = 0; i < 3; i++) {
      const x = W - 36 - (2 - i) * 15, on = i < got;
      c.save(); c.globalAlpha = on ? 1 : 0.25; Art.item(c, 'badge', x, 25, 0, 0.8); c.restore();
    }
  };

  HUD.swapT = 0; HUD._last = null;
  const swap = id => { if (HUD._last !== id) { if (HUD._last != null) HUD.swapT = 0.25; HUD._last = id; } HUD.swapT = Math.max(0, HUD.swapT - G.dt); };
  HUD.draw = function (c, pl, world) {
    swap(pl.weapon);
    HUD.drawLeft(c, pl);
    HUD.drawRight(c, world);
  };
  // для уровней со своим игроком (5, 8, 9, 10): o = { hp, maxHp, weapons: {list, cur}, score }
  HUD.drawFor = function (c, o) {
    const ws = o.weapons || { list: [{ id: 'fists', icon: fistIcon, n: Infinity }], cur: 0 };
    swap((ws.list[ws.cur] || ws.list[0]).id);
    HUD.drawLeft(c, { hp: o.hp, maxHp: o.maxHp || 100 }, ws);
    HUD.drawRight(c, { score: o.score || 0 });
  };
  HUD.fist = fistIcon;
  // иконка-надпись, когда картинки оружия нет (короткое название в две строки)
  HUD.textIcon = (label, col = '#ffd84a') => (c, x, y) => {
    const ws = String(label).split(' '), sz = Math.max(...ws.map(t => t.length)) > 6 ? 6 : 7;
    ws.forEach((t, i) => G.text(t, x, y - 4 - (ws.length - 1) * 4 + i * 8, { size: sz, align: 'center', color: col }));
  };
}

// ======================= ПЕЙДЖЕР =======================
// Сообщения банка (списания), «никому не говорите код», подсказки по боссам. Пока на экране — игра на паузе.
const Pager = {
  seen: {}, bal: 37420, flashT: 0, msg: null, lv: null, lvId: 0, playT: 0, events: [], queue: [], said: 0,
  // баланс на старте каждого уровня (чтобы выбор уровня тоже был последовательным)
  START: { 1: 37420, 2: 33180, 3: 27950, 4: 21300, 5: 15870, 6: 11240, 7: 6890, 8: 2615, 9: -31740, 10: -48900 },
  BANK: 'ЛЕМУРБАНК',
  WHY: ['Комиссия за обслуживание счёта', 'Абонентская плата за пейджер', 'Подписка «Столичный стиль»', 'Услуга «Мажор-плюс»', 'Страховка от падения кирпича',
    'Перевод: ООО «Столичные мажоры»', 'Комиссия за комиссию', 'Штраф за неуплату штрафа', 'Пожертвование на яхту', 'Обслуживание карты «Золотая»'],
  RAGE: ['Гребаные мажоры из столицы! Все деньги у меня выкачали!', 'Опять?! Да чтоб вас, мажоры столичные!', 'Это ж полсмены! Ворюги столичные!',
    'Я на пельмени копил! Гребаные мажоры!', 'Кто им разрешил?! Все деньги выкачали!'],
  BOSS: {
    1: 'Наташка открыта, когда пьёт или шатается. Бутылку можно отбить ударом обратно!',
    2: 'Кеша открыт, когда шмыгает носом. Апперкот — после серии ударов.',
    3: 'Бей Царя-таракана в голову, когда он опускает лапы. Мел — снизу вверх.',
    4: 'Байкер боится канистр «Осеменителя». После 4 попаданий он побежит — догоняй!',
    6: 'Ванделорд открыт после удара о землю. Не стой под кислотным дождём.',
    '5:race': 'Граблионок на «Матизе» быстрый, но резко поворачивать не умеет. Срезай повороты!',
    '7:chief': 'Главарь спецназа после трёх твоих ударов уходит кувырком. Бей серией и отходи.',
    '8:boss': 'Боссов бей ВОГами — они больнее автомата. От атак уходи перекатом.',
    '9:sanya': 'Профессор Саня прячется за щитом. Взрывай аккумуляторы — щит упадёт.',
    '9:semen': 'Семён открыт, когда шатается. От ракетной руки уходи перекатом.',
    '10:jet': 'Гигант-Семён выдыхается после серии атак — тогда бей изо всех сил.',
    '10:mid': 'Гигант-Семён выдыхается после серии атак — тогда бей изо всех сил.',
    '10:sea': 'Пока у Семёна щит — взрывай станции из гранатомёта. Ракеткой отбивай его снаряды.',
  },
  // как понять, что начался бой с боссом (уровни без явного вызова Pager.boss)
  detect(lv) {
    const id = this.lvId, pn = lv.partName || '';
    if (id === 5) return lv.mode === 'race' ? 'race' : null;
    if (id === 7) return (lv.run && lv.run.boss) ? 'chief' : null;
    if (id === 8) return lv.boss && !lv.boss.gone ? 'boss' : null;
    if (id === 9) return /semen/.test(pn) && (lv.P && (lv.P.B || lv.P.boss)) ? 'semen' : pn === 'sanya' ? 'sanya' : null;
    if (id === 10) return lv.P && lv.P.B && this.BOSS['10:' + pn] ? pn : null;
    return null;
  },
  fmt: n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '),

  levelId(lv) {
    if (lv.id) return lv.id;
    if (typeof L8 !== 'undefined' && lv instanceof L8.Level) return 8;
    if (typeof L9 !== 'undefined' && lv instanceof L9.Level) return 9;
    return 1;
  },
  onLevel(lv) {
    this.lv = lv; this.lvId = this.levelId(lv); this.playT = 0; this.msg = null; this.queue = this.queue.filter(m => m.lv === lv); this.said = 0; this.seen = {};
    this.bal = this.START[this.lvId] != null ? this.START[this.lvId] : this.bal;
    const id = this.lvId, ev = [];
    if (id === 8) ev.push({ t: U.rand(25, 60), kind: 'wipe' });
    else { ev.push({ t: U.rand(25, 90), kind: 'debit' }); if (Math.random() < 0.5) ev.push({ t: U.rand(110, 200), kind: 'debit' }); }
    if (Math.random() < 0.45) ev.push({ t: U.rand(60, 160), kind: 'code' });
    this.events = ev.sort((a, b) => a.t - b.t);
  },
  // внешние вызовы
  boss(id) { const t = this.BOSS[id]; if (this.seen[id]) return; this.seen[id] = 1; if (t && !this.queue.some(m => m.kind === 'boss')) this.queue.push({ kind: 'boss', from: 'ДОБРОЖЕЛАТЕЛЬ', text: t, lv: App.level }); },
  shop() { this.queue.push(Object.assign(this.debitMsg('Магазин «Под горлышко»: покупка', U.randi(18, 34) * 100), { lv: App.level })); },

  debitMsg(why, sum) {
    this.bal -= sum;
    return { kind: 'debit', from: this.BANK, text: 'СПИСАНИЕ ' + this.fmt(sum) + ' Р\n' + why + '\nОСТАТОК: ' + (this.bal < 0 ? '-' : '') + this.fmt(Math.abs(this.bal)) + ' Р', rage: U.choice(this.RAGE) };
  },
  make(e) {
    if (e.kind === 'debit') return this.debitMsg(U.choice(this.WHY), Math.round(U.rand(900, Math.max(1200, Math.min(6500, this.bal * 0.25))) / 10) * 10);
    if (e.kind === 'wipe') {
      const sum = Math.max(0, this.bal) + 34355;
      const m = this.debitMsg('Взыскание задолженности по услуге «Мажор-плюс»', sum);
      m.rage = 'ВСЁ?! В МИНУС?! Гребаные мажоры из столицы, всё до копейки выкачали!'; m.big = true; return m;
    }
    if (e.kind === 'code') return { kind: 'code', from: this.BANK, text: 'Никому не говорите код: 3671. Даже сотруднику банка.', rage: 'Три... шесть... семь... один. Ага, никому не скажу!', calm: true };
  },
  // есть ли сейчас нормальная игра (не катсцена, Валера жив)
  live(lv) {
    if (Scene.active || lv.scene || lv.mode === 'scene' || lv.resetting) return false;
    const pl = this.player(lv); return !(pl && pl.dead);
  },
  player(lv) {
    for (const o of [lv, lv.run, lv.arena, lv.stage, lv.cur]) if (o && o.player && o.player.x != null) return o.player;
    return null;
  },
  // звуки пейджера: выезд — шорох + вибрация + писк; уезд — шорох + щелчок
  sfxIn() {
    if (!Sound.ac) return;
    Sound.noise(0.28, { freq: 900, slide: 2600, vol: 0.14, filter: 'bandpass' });                 // выезжает
    for (let i = 0; i < 3; i++) Sound.tone(70, 0.13, { type: 'sawtooth', vol: 0.12, delay: 0.3 + i * 0.2 });   // вибрирует
    [0, 1, 2, 4, 5, 6].forEach(i => Sound.tone(i % 3 === 2 ? 3100 : 2600, 0.05, { type: 'square', vol: 0.05, delay: 0.32 + i * 0.09 }));  // пи-пи-пи
  },
  sfxOut() {
    if (!Sound.ac) return;
    Sound.tone(1800, 0.03, { type: 'square', vol: 0.06 });                                       // щелчок кнопки
    Sound.noise(0.26, { freq: 2600, slide: 700, vol: 0.13, filter: 'bandpass', delay: 0.04 });    // уезжает
  },
  IN: 0.35, OUT: 0.3,
  show(m) { this.msg = Object.assign({ t: 0, out: null }, m); this.sfxIn(); },
  // вызывается из main.js каждый кадр игры; true — игра на паузе (читаем пейджер)
  update(dt, lv, I) {
    if (this.lv !== lv) this.onLevel(lv);
    this.flashT = Math.max(0, this.flashT - dt);
    if (this.msg) {
      const m = this.msg; m.t += dt;
      if (m.out != null) { m.out += dt; if (m.out >= this.OUT) this.close(lv); return true; }   // уезжает вправо, игра ещё на паузе
      if (m.t > 0.7 && (I.pressed('jump') || I.pressed('start') || I.pressed('punch') || I.pressed('throw'))) { m.out = 0; this.sfxOut(); }
      return true;
    }
    if (!this.live(lv)) return false;
    this.playT += dt;
    const bk = this.detect(lv); if (bk) this.boss(this.lvId + ':' + bk);
    if (this.queue.length) { this.show(this.queue.shift()); return true; }
    const e = this.events.find(e => !e.done && this.playT >= e.t);
    if (e) { e.done = true; const m = this.make(e); if (m) { this.show(m); return true; } }
    return false;
  },
  close(lv) {
    const m = this.msg; this.msg = null;
    if (m.kind === 'debit') this.flashT = 2.5;
    if (!m.rage) return;
    const pl = this.player(lv);
    if (pl && G.say) G.say(pl, m.rage, m.big ? 3.4 : 2.8);
    else this.cap = { text: 'ВАЛЕРА: ' + m.rage, t: 3 };
    if (m.calm) return;
    // топает ногой
    if (pl && 'idleT' in pl && pl.onGround) { pl.idle = { kind: 'hips', t: 0, dur: 2.4 }; pl.idleT = 3.3; }
    [0, 0.35, 0.7].forEach(d => setTimeout(() => { Sound.play('stomp'); G.shake(m.big ? 3 : 2, 0.12); }, d * 1000));
  },

  // рисуется поверх уровня (main.js)
  draw(c) {
    if (this.cap && this.cap.t > 0) {
      this.cap.t -= G.dt;
      const lines = G.wrap(this.cap.text, 420, 8), y = H - 40 - lines.length * 11;
      HUD.R(c, W / 2 - 220, y - 4, 440, lines.length * 11 + 8, 'rgba(0,0,0,0.7)');
      lines.forEach((l, i) => G.text(l, W / 2, y + i * 11, { size: 8, align: 'center', color: '#ffb070' }));
    }
    const m = this.msg; if (!m) return;
    const R = HUD.R, k = Math.min(1, m.t / this.IN), e = m.out != null ? 1 - Math.min(1, m.out / this.OUT) ** 2 : 1 - (1 - k) ** 3;   // выезд справа / уезд вправо
    c.fillStyle = 'rgba(0,0,0,' + (0.35 * e) + ')'; c.fillRect(0, 0, W, H);
    const pw = 190, ph = 124, px = Math.round(W - 8 - pw + (1 - e) * (pw + 20)), py = 62 + (m.t < 0.5 ? Math.round(Math.sin(m.t * 70) * 1.5) : 0);
    // корпус
    R(c, px, py, pw, ph, '#000'); R(c, px + 2, py + 2, pw - 4, ph - 4, '#3a3d44'); R(c, px + 2, py + 2, pw - 4, 3, '#555a63'); R(c, px + 4, py + ph - 6, pw - 8, 2, '#24262b');
    // экран
    const sx = px + 10, sy = py + 10, sw = pw - 20, sh = 74;
    R(c, sx - 2, sy - 2, sw + 4, sh + 4, '#000'); R(c, sx, sy, sw, sh, m.big ? '#c8b070' : '#9cbf6a');
    R(c, sx, sy, sw, 1, 'rgba(255,255,255,0.3)');
    const ink = '#1c2a10';
    G.text(m.from, sx + 4, sy + 3, { size: 7, color: ink, shadow: false });
    R(c, sx + 3, sy + 13, sw - 6, 1, 'rgba(28,42,16,0.5)');
    const lines = G.wrap(m.text, sw - 10, 8).slice(0, 5);
    lines.forEach((l, i) => G.text(l, sx + 4, sy + 17 + i * 11, { size: 8, color: ink, shadow: false }));
    if ((m.t * 2 | 0) % 2 === 0) R(c, px + pw - 14, py + 4, 4, 4, '#ff3a2a');    // мигает лампочка
    // три кнопки
    [[px + 10, 42], [px + 74, 42], [px + 138, 42]].forEach(([x, w], i) => { R(c, x, py + ph - 30, w, 18, '#000'); R(c, x + 2, py + ph - 28, w - 4, 14, i === 1 ? '#6a6f78' : '#4a4e56'); R(c, x + 2, py + ph - 28, w - 4, 2, '#7a808a'); });
    G.text('ОК', px + 95, py + ph - 26, { size: 8, align: 'center', color: '#e8e0c8' });
    if (m.out == null && m.t > 0.7 && (G.t * 2 | 0) % 2 === 0) G.text((Game.keyName ? Game.keyName('jump') : 'Z') + ' — ДАЛЬШЕ', px + pw / 2, py + ph + 6, { size: 8, align: 'center', color: '#ffd84a', outline: true });
  },
};
