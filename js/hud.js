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
      const l = [{ id: 'fist', icon: fistIcon, n: Infinity }];     // кулак — один значок на всю игру
      if (pl.hasWand) l.push({ id: 'wand', icon: HUD.imgIcon('wand', 'ПАЛОЧКА'), n: Infinity, cool: pl.rapid ? (pl.heat || 0) : pl.castCool > 0 ? 1 - pl.castCool / (pl.castMax || 5) : 0, hot: pl.rapid ? (pl.overheat ? 2 : 1) : 0 });   // на арене ур.6 — шкала нагрева палочки
      return { list: l, cur: pl.hasWand && pl.wmode === 'wand' ? 1 : 0 };
    }
    if (pl.ammo3) {
      const l4 = 'seed' in pl.ammo3;
      const l = [{ id: 'swatter', icon: HUD.imgIcon('racket', 'МУХОБОЙКА'), n: pl.ammo3.swatter + '%' }];     // та же электромухобойка, что в руках (и ракетка ур.10)
      if (l4) {
        l.push({ id: 'fists', icon: fistIcon, n: Infinity });
        if (pl.hasSeed) l.push({ id: 'seed', icon: HUD.imgIcon(pl.green ? 'o3000g' : 'o3000', 'О-3000'), n: pl.ammo3.seed });
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
    if (w.cool) { R(c, bx + 2, by + bh - 4, bw - 4, 2, '#101216'); R(c, bx + 2, by + bh - 4, Math.round((bw - 4) * w.cool), 2, w.hot === 2 ? ((G.t * 8 | 0) % 2 ? '#ff3020' : '#ffd84a') : w.hot ? (w.cool > 0.7 ? '#ff6040' : '#ffb040') : '#c8a0ff'); }
    // патроны под рамкой
    if (w.n === Infinity) HUD.inf(c, bx + bw / 2, by + bh + 7, 6);
    else { const empty = typeof w.n === 'number' && w.n <= 0; G.text(String(w.n), bx + bw / 2, by + bh + 2, { size: 8, align: 'center', color: empty ? '#ff6a4a' : '#fff', outline: true }); }
    if (pl.bottleHits > 0 && pl.weapon === 'bottles') G.text('БЬЁТ ' + pl.bottleHits, bx + bw / 2, by + bh + 12, { size: 7, align: 'center', color: '#8cf08c', outline: true });
    // здоровье
    const hx = 74, hy = 6, hw = 96, k = U.clamp(pl.hp / pl.maxHp, 0, 1);
    // сердечко (Flow: assets/spr/hud_heart.png); при малом здоровье бьётся
    const hb = k < 0.3 ? 1 + Math.abs(Math.sin(G.t * 7)) * 0.18 : 1 + Math.abs(Math.sin(G.t * 2.5)) * 0.06;
    const boost = pl.growT > 0 ? pl.growT : 0;     // ур.6: съел мухомор — сердце крупное, в белых венах, с таймером (рисуется поверх, ниже)
    if (!boost && HUD.img.heart) { const s = 16 * hb / HUD.img.heart.height, w = HUD.img.heart.width * s; c.drawImage(HUD.img.heart, 61 - w / 2, 12 - 8 * hb, w, 16 * hb); }     // между рамкой оружия (до 48) и шкалой (с 74)
    R(c, hx, hy, hw, 12, '#000'); R(c, hx + 1, hy + 1, hw - 2, 10, '#e8e2d0'); R(c, hx + 2, hy + 2, hw - 4, 8, '#3a1010');
    R(c, hx + 2, hy + 2, Math.round((hw - 4) * k), 8, k > 0.5 ? '#48c048' : k > 0.25 ? '#e0b020' : '#e03030');
    R(c, hx + 2, hy + 2, Math.round((hw - 4) * k), 2, 'rgba(255,255,255,0.35)');
    if (k < 0.3 && (G.t * 4 | 0) % 2) R(c, hx + 2, hy + 2, hw - 4, 8, 'rgba(255,60,60,0.25)');
    if (boost) {     // вдвое больше, жёсткий пульс (двойной удар), внутри — секунды до конца эффекта
      const im = HUD.img.heartv || HUD.img.heart, ph = (G.t * 2.2) % 1, beat = 1 + 0.2 * Math.max(Math.exp(-ph * 14), 0.75 * Math.exp(-Math.max(0, ph - 0.22) * 14) * (ph > 0.22 ? 1 : 0));
      if (im) { const h = 32 * beat, w = im.width * h / im.height; c.drawImage(im, 61 - w / 2, 19 - h / 2, w, h); }
      G.text(String(Math.ceil(boost)), 61, 14, { size: 8, align: 'center', color: '#fff', outline: true });
    }
    // баланс в банке
    const b = Pager.bal, neg = b < 0, col = neg ? ((G.t * 3 | 0) % 2 ? '#ff4a3a' : '#ff9a8a') : Pager.flashT > 0 ? '#ff8a6a' : '#e8e0c8';
    const by2 = hy + (G.t - HUD._subT < 0.3 ? 29 : 16);     // баланс — нижней строкой; нет строки гранат/газа (HUD.sub / HUD.useRow) — подтягивается к здоровью
    HUD.rub(c, hx, by2, col);
    G.text((neg ? '-' : '') + Pager.fmt(Math.abs(b)), hx + 9, by2, { size: 8, color: col, outline: true });
  };

  // правый верхний угол: очки и значки
  HUD.drawRight = function (c, world) {
    const lv = App.level || {}, st = lv.stats || (world && world.stats) || {};
    const score = world && world.score != null ? world.score : lv.score || 0;
    G.text('ОЧКИ ' + String(score).padStart(6, '0'), W - 8, 6, { size: 8, align: 'right', color: '#ffd84a', outline: true });
    // значки «Ударник»: плашка с подписью, 3 ячейки и счёт
    const got = Math.min(3, st.secrets || 0), lw = Math.ceil(Math.max(G.textWidth('УДАРНИК', 7), G.textWidth('3/3', 8))) + 10, pw = lw + 3 * 19 + 6, px = W - 6 - pw, py = 17, ph = 24;     // ширина — по тексту, ячейки после подписи
    // без рамки: подпись, счёт и 3 значка; несобранный — серый и тёмный, поднятый — загорается
    G.text('УДАРНИК', px + 5, py + 4, { size: 7, color: '#ffd84a', outline: true });
    G.text(got + '/3', px + 5, py + 13, { size: 8, color: got >= 3 ? '#8cf08c' : '#fff', outline: true });
    if (HUD.badgeT > 0) HUD.badgeT -= G.dt;
    if (got > HUD._got) HUD.badgeT = 1; HUD._got = got;
    for (let i = 0; i < 3; i++) {
      const x = px + lw + 10 + i * 19, y = py + ph / 2, on = i < got, fresh = on && i === got - 1 && HUD.badgeT > 0;
      const pop = fresh ? 1 + Math.sin(HUD.badgeT * 12) * 0.25 * HUD.badgeT : 1;
      if (fresh) { c.save(); c.globalAlpha = HUD.badgeT * 0.6; c.fillStyle = '#fff6a0'; c.beginPath(); c.arc(x, y, 12 * pop, 0, Math.PI * 2); c.fill(); c.restore(); }     // вспышка при подборе
      c.save(); if (!on) { c.filter = 'grayscale(1) brightness(0.75)'; c.globalAlpha = 0.85; } Art.item(c, 'badge', x, y, 0, 0.95 * pop); c.restore();
    }
  };

  // вторая способность — строка сразу под здоровьем (баланс уходит ниже):
  // { n } — столько картинок гранат, без цифр; { k } — подпись и шкала перезарядки 0..1
  // icon(c, x, y) — картинка одной гранаты (центр)
  HUD._subT = -9;
  HUD.sub = function (c, label, o = {}) {
    HUD._subT = G.t;
    let x = 74; const y = 21;
    if (o.k == null) {
      const n = Math.min(10, Math.max(0, o.n | 0)), ic = o.icon || HUD.grenIcon;
      for (let i = 0; i < n; i++) ic(c, x + 6 + i * 13, y + 5);
      if (!n) { c.save(); c.globalAlpha = 0.35; c.filter = 'grayscale(1)'; ic(c, x + 6, y + 5); c.restore(); }     // кончились — бледный силуэт
      return;
    }
    const ready = o.k >= 1, ic = o.icon || (label === 'ГАЗ' && HUD.gasIcon);
    if (ic) {     // значок вместо подписи (газ — облачко из спрайтов игры)
      c.save(); ic(c, x + 7, y + 4); c.restore(); x += 17;     // значок неподвижный (владелец)
    } else {
      G.text(label, x, y, { size: 7, color: ready ? '#b8ff70' : '#8a948a', outline: true });
      x += Math.ceil(G.textWidth(label, 7)) + 4;
    }
    const w = 170 - x, k = U.clamp(o.k, 0, 1);
    R(c, x, y + 1, w, 7, '#000'); R(c, x + 1, y + 2, w - 2, 5, '#1c2418');
    R(c, x + 1, y + 2, Math.round((w - 2) * k), 5, ready ? ((G.t * 3 | 0) % 2 ? '#b8ff70' : '#9cff40') : '#587030');
  };
  HUD.grenIcon = () => {};
  HUD.useRow = () => { HUD._subT = G.t; };     // уровень пишет свой текст в строку под здоровьем — баланс уходит ниже
  HUD.gasIcon = (c, x, y) => Spr.drawC(c, 'gas', 0, x, y - 1, 0, 0.27);     // облачко газа (лист gas, кадр 96x76)
  HUD.swapT = 0; HUD._last = null; HUD.badgeT = 0; HUD._got = 0;
  // картинки интерфейса из Flow
  HUD.img = {};
  for (const [k, f] of [['heart', 'hud_heart'], ['heartv', 'hud_heart_veins'], ['pager', 'hud_pager'], ...['rifle', 'pist', 'mini', 'plasma', 'rocket', 'o3000', 'o3000g', 'racket', 'wand'].map(n => ['w_' + n, 'hud_i_' + n])]) G.loadImage('assets/spr/' + f + '.png').then(im => HUD.img[k] = im, () => {});
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
  // миниатюра оружия (assets/spr/hud_i_*.png — из тех же спрайтов, что оружие в руках; tools/build_hud_icons.py) — вписывается в рамку 30x22; пока не загрузилась — подпись
  HUD.imgIcon = (name, label) => (c, x, y) => {
    const im = HUD.img['w_' + name];
    if (!im) return HUD.textIcon(label || name)(c, x, y);
    const k = Math.min(30 / im.width, 22 / im.height), w = im.width * k, h = im.height * k;
    c.save(); c.imageSmoothingEnabled = true; c.drawImage(im, x - w / 2, y - h / 2, w, h); c.restore();
  };
  HUD.textIcon = (label, col = '#ffd84a') => (c, x, y) => {     // каждое слово ужимается до ширины рамки (30 px)
    const ws = String(label).split(' ');
    ws.forEach((t, i) => {
      const k = Math.min(1, 30 / Math.max(1, G.textWidth(t, 7))), yy = y - 4 - (ws.length - 1) * 4 + i * 8;
      c.save(); c.translate(x, yy); c.scale(k, 1); G.text(t, 0, 0, { size: 7, align: 'center', color: col }); c.restore();
    });
  };
}

// ======================= МЕНЮ ОРУЖИЯ (долгое удержание Q) =======================
// Держишь Q — время останавливается, по центру меню оружия; стрелки — выбор, отпустил Q (или Z) — взял.
const WeaponWheel = {
  open: false, holdT: 0, sel: 0, ws: null, set: null, t: 0, HOLD: 0.35,
  source(lv) {
    const pl = Pager.player(lv);
    if (pl && (pl.ammo || pl.ammo3 || (typeof L6 !== 'undefined' && pl instanceof L6.Player)))
      return { ws: HUD.weapons(pl), set: id => { if (typeof L6 !== 'undefined' && pl instanceof L6.Player) pl.wmode = id === 'wand' ? 'wand' : 'fist'; else pl.weapon = id; } };
    const P = lv.P;
    if (P && P.hudWeap && P.wpn !== undefined) return { ws: P.hudWeap(), set: id => { P.wpn = id; P.swingT = 0; } };
    return null;
  },
  update(dt, lv, I) {
    if (!this.open) {
      if (I.held('switch') && Pager.live(lv)) {
        this.holdT += dt;
        if (this.holdT >= this.HOLD) {
          const s = this.source(lv);
          if (s && s.ws.list.length > 1) { Object.assign(this, s); this.open = true; this.t = 0; this.sel = s.ws.cur; Sound.play('select'); Sound.noise && Sound.noise(0.18, { freq: 3000, slide: 600, vol: 0.08, filter: 'bandpass' }); }
          else this.holdT = -99;     // выбирать не из чего — не открываем до отпускания
        }
      } else this.holdT = 0;
      return false;
    }
    this.t += dt;
    const n = this.ws.list.length;
    if (I.pressed('left') || I.pressed('up')) { this.sel = (this.sel + n - 1) % n; Sound.play('blip', 900); }
    if (I.pressed('right') || I.pressed('down')) { this.sel = (this.sel + 1) % n; Sound.play('blip', 1100); }
    if (!I.held('switch') || I.pressed('jump') || I.pressed('start')) {
      this.set(this.ws.list[this.sel].id); this.open = false; this.holdT = -99; Sound.play('pickup');
    }
    return true;
  },
  draw(c) {
    if (!this.open) return;
    const R = HUD.R, e = Math.min(1, this.t / 0.15), list = this.ws.list, n = list.length;
    c.fillStyle = 'rgba(0,0,0,' + 0.55 * e + ')'; c.fillRect(0, 0, W, H);
    const cw = 52, ch = 48, gap = 8, pw = n * cw + (n - 1) * gap + 24, ph = ch + 52, px = Math.round(W / 2 - pw / 2), py = Math.round(H / 2 - ph / 2 - 10 + (1 - e) * 12);
    c.globalAlpha = e;
    R(c, px, py, pw, ph, '#000'); R(c, px + 1, py + 1, pw - 2, ph - 2, '#e8e2d0'); R(c, px + 2, py + 2, pw - 4, ph - 4, '#23262b');
    G.text('ВЫБОР ОРУЖИЯ', W / 2, py + 6, { size: 8, align: 'center', color: '#ffd84a' });
    list.forEach((w, i) => {
      const x = px + 12 + i * (cw + gap), y = py + 20, on = i === this.sel, bob = on ? Math.round(Math.sin(G.t * 8) * 1) : 0;
      R(c, x - 1, y - 1 + bob, cw + 2, ch + 2, on ? '#ffd84a' : '#000'); R(c, x, y + bob, cw, ch, on ? '#3a3020' : '#16181c');
      c.save(); c.beginPath(); c.rect(x, y + bob, cw, ch); c.clip(); if (!on) c.globalAlpha = e * 0.55; c.translate(x + cw / 2, y + bob + ch / 2 - 5); c.scale(1.5, 1.5); w.icon(c, 0, 0); c.restore();
      if (w.n === Infinity) HUD.inf(c, x + cw / 2, y + bob + ch - 7, 5, on ? '#fff' : '#999');
      else G.text(String(w.n), x + cw / 2, y + bob + ch - 11, { size: 8, align: 'center', color: on ? '#fff' : '#999' });
    });
    G.text('СТРЕЛКИ — ВЫБОР   ОТПУСТИ ' + (Game.keyName ? Game.keyName('switch') : 'Q') + ' — ВЗЯТЬ', W / 2, py + ph - 12, { size: 7, align: 'center', color: '#c8d0d8' });
    c.globalAlpha = 1;
  },
};

// ======================= ПЕЙДЖЕР =======================
// Сообщения банка (списания), «никому не говорите код», подсказки по боссам. Пока на экране — игра на паузе.
const Pager = {
  seen: {}, tips: {}, bal: 37420, flashT: 0, msg: null, lv: null, lvId: 0, playT: 0, events: [], queue: [], said: 0,
  // баланс на старте каждого уровня (выбор уровня тоже последователен): к ур.7 — ноль, к ур.9 — минус 4 500
  START: { 1: 37420, 2: 31600, 3: 25200, 4: 18900, 5: 12700, 6: 6400, 7: 0, 8: -2100, 9: -4500, 10: -6900, 11: -9400 },
  BANK: 'ЛЕМУРБАНК',
  WHY: ['Налог на плитку для столицы', 'Сбор на подогрев столичных тротуаров', 'Налог на воздух (не столичный)', 'Взнос на фонтан для мажоров',
    'Сбор за проживание вне столицы', 'Налог на дождь', 'Взнос на ёлку главной площади', 'Налог на пельмени', 'Сбор на парковку столичных мажоров',
    'Налог на усталость', 'Взнос на столичный салют', 'Сбор за тишину', 'Налог на гордость за столицу', 'Взнос на яхту для столичного фонда',
    'Сбор за пользование солнцем', 'Налог на отсутствие налогов', 'Взнос на новый газон столицы', 'Сбор за дыхание'],
  RAGE: ['Гребаные мажоры из столицы! Все деньги у меня выкачали!', 'Опять?! Да чтоб вас, мажоры столичные!', 'Это ж полсмены! Ворюги столичные!',
    'Я на пельмени копил! Гребаные мажоры!', 'Кто им разрешил?! Все деньги выкачали!'],
  BOSS: {
    4: 'Байкер боится канистр «Осеменителя». После 4 попаданий он побежит — догоняй!',
    '5:race': 'Граблионок на «Матизе» быстрый, но резко поворачивать не умеет. Срезай повороты!',
    '7:chief': 'Не стой на месте! Бей, когда главарь выдохся, промахнулся рывком или перезаряжается.',
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
    this.lv = lv; this.lvId = this.levelId(lv); this.playT = 0; this.lastT = -99; this.msg = null; this.queue = this.queue.filter(m => m.lv === lv); this.said = 0; this.seen = {}; this.tips = {};
    this.bal = this.START[this.lvId] != null ? this.START[this.lvId] : this.bal;
    const id = this.lvId, ev = [];
    // 2-3 налога за уровень, суммы сходятся к балансу следующего уровня
    ev.push({ t: U.rand(40, 100), kind: 'debit' }, { t: U.rand(170, 260), kind: 'debit' });
    if (id === 6 || Math.random() < 0.25) ev.push({ t: U.rand(320, 400), kind: 'debit' });
    if (Math.random() < 0.3) ev.push({ t: U.rand(110, 230), kind: 'code' });
    this.events = ev.sort((a, b) => a.t - b.t);
  },
  // внешние вызовы
  // подсказка уровня (из Game.drawHint): один раз за уровень, без повторов в очереди
  tip(text) {
    if (!text || this.tips[text]) return; this.tips[text] = 1;
    this.queue.push({ kind: 'tip', from: 'ДОБРОЖЕЛАТЕЛЬ', text, lv: App.level });
  },
  boss(id) { const t = this.BOSS[id]; if (this.seen[id]) return; this.seen[id] = 1; if (t && !this.queue.some(m => m.kind === 'boss')) this.queue.push({ kind: 'boss', from: 'ДОБРОЖЕЛАТЕЛЬ', text: t, lv: App.level }); },
  shop() { this.queue.push(Object.assign(this.debitMsg('Магазин «Под горлышко»: покупка', U.randi(18, 34) * 100), { lv: App.level })); },

  debitMsg(why, sum) {
    this.bal -= sum;
    return { kind: 'debit', from: this.BANK, text: 'СПИСАНИЕ ' + this.fmt(sum) + ' Р\n' + why + '\nОСТАТОК: ' + (this.bal < 0 ? '-' : '') + this.fmt(Math.abs(this.bal)) + ' Р', rage: U.choice(this.RAGE) };
  },
  make(e) {
    if (e.kind === 'debit') {
      const id = this.lvId, end = this.START[id + 1] != null ? this.START[id + 1] : this.bal - 2500, was = this.bal;
      const left = 1 + this.events.filter(x => x.kind === 'debit' && !x.done).length;     // +1: текущий уже отмечен done
      let sum = (this.bal - end) / Math.max(1, left);
      if (left > 1) sum *= U.rand(0.7, 1.25);
      sum = Math.max(300, Math.round(sum / 10) * 10);
      const m = this.debitMsg(U.choice(this.WHY), sum);
      if (was > 0 && this.bal === 0) { m.rage = 'НОЛЬ?! Гребаные мажоры из столицы, всё до копейки выкачали!'; m.big = true; }
      else if (was >= 0 && this.bal < 0) { m.text += '\nСЧЁТ УШЁЛ В МИНУС'; m.rage = 'В минус?! Я теперь ещё и должен этим мажорам?!'; m.big = true; }
      return m;
    }
    if (e.kind === 'code') return { kind: 'code', from: this.BANK, text: 'Никому не говорите код: 3671. Даже сотруднику банка.', rage: 'Три... шесть... семь... один. Ага, никому не скажу!', calm: true };
  },
  // есть ли сейчас нормальная игра (не катсцена, Валера жив)
  live(lv) {
    if (Scene.active || lv.scene || lv.mode === 'scene' || lv.resetting) return false;
    // экран в затемнении (вход в комнату, переход, возрождение) — пейджер ждёт, иначе пауза замораживает чёрный экран
    for (const o of [lv, lv.run, lv.arena, lv.stage, lv.cur]) if (o && (o.fade > 0.02 || o.cutFade > 0.02 || o.respawning || o.transT > 0 || o.trans)) return false;
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
  SCR: [0.1577, 0.2792, 0.8515, 0.6168],     // экран на картинке пейджера (доли), см. tools/build_ui.py
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
    if (!this.live(lv)) { this.calmT = 0; return false; }
    this.playT += dt;
    const bk = this.detect(lv); if (bk) this.boss(this.lvId + ':' + bk);
    // не дёргать игрока: подсказки не чаще раза в 12 с, банк — не чаще раза в 50 с и не во время боя с боссом
    this.calmT = (this.calmT || 0) + dt; if (this.calmT < 2.5) return false;     // после затемнения дать игроку 2,5 с осмотреться
    const gap = this.playT - this.lastT, qi = this.queue.findIndex(m => m.kind === 'boss' || gap >= 12);
    if (qi >= 0) { this.show(this.queue.splice(qi, 1)[0]); return true; }
    const e = !bk && !this.queue.length && gap >= 50 && this.events.find(e => !e.done && this.playT >= e.t);
    if (e) { e.done = true; const m = this.make(e); if (m) { this.show(m); return true; } }
    return false;
  },
  close(lv) {
    const m = this.msg; this.msg = null; this.lastT = this.playT;
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
    const pw = 190, ph = 124, px = Math.round(W - 8 - pw + (1 - e) * (pw + 20)), py = 62 + (m.t < 0.5 ? Math.round(Math.sin(m.t * 70) * 1.5) : 0);
    const im = HUD.img.pager;
    if (im) {     // корпус — картинка из Flow (assets/spr/hud_pager.png, tools/build_ui.py); экран — доли SCR
      const S = this.SCR, iw = 200, ih = Math.round(iw * im.height / im.width), ix = Math.round(W - 8 - iw + (1 - e) * (iw + 20)), iy = Math.round(H / 2 - ih / 2 - 20) + (m.t < 0.5 ? Math.round(Math.sin(m.t * 70) * 1.5) : 0);
      c.save(); c.imageSmoothingEnabled = true; c.drawImage(im, ix, iy, iw, ih); c.restore();
      const sx = ix + Math.round(iw * S[0]), sy = iy + Math.round(ih * S[1]), sw = Math.round(iw * (S[2] - S[0])), sh = Math.round(ih * (S[3] - S[1]));
      if (m.big) { c.fillStyle = 'rgba(255,120,40,' + (0.25 + 0.15 * Math.sin(m.t * 8)) + ')'; c.fillRect(sx, sy, sw, sh); }
      const ink = '#1c2a10';
      G.text(m.from, sx + 3, sy + 2, { size: 6, color: ink, shadow: false });
      R(c, sx + 2, sy + 10, sw - 4, 1, 'rgba(28,42,16,0.45)');
      // текст ползёт титрами снизу вверх по экрану (по кругу), шапка с отправителем стоит
      const lines = G.wrap(m.text, sw - 6, 7), LH = 9, top = sy + 12, bot = sy + sh - 1, hgt = lines.length * LH, run = hgt + (bot - top);
      const off = (m.t * 13) % (run + 6), y0 = bot - off;
      c.save(); c.beginPath(); c.rect(sx, top, sw, bot - top); c.clip();
      lines.forEach((l, i) => G.text(l, sx + 3, y0 + i * LH, { size: 7, color: ink, shadow: false }));
      c.restore();
      if ((m.t * 2 | 0) % 2 === 0) { c.fillStyle = 'rgba(255,60,40,0.85)'; c.fillRect(ix + Math.round(iw * 0.815), iy + Math.round(ih * 0.13), 7, 5); }     // мигает лампочка
      if (m.out == null && m.t > 0.7 && (G.t * 2 | 0) % 2 === 0) G.text((Game.keyName ? Game.keyName('jump') : 'Z') + ' — ДАЛЬШЕ', ix + iw / 2, iy + ih + 4, { size: 8, align: 'center', color: '#ffd84a', outline: true });
      return;
    }
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
