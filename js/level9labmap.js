// Уровень 9, карта лаборатории (часть C): склад капсул -> конвейерный зал -> подъёмник. Пол y=330, ярусы 230 и 130, верх подъёмника -170.
// solids: [x, y, w, h]; walks: [x, y, w] (мостки, сквозь них можно спрыгнуть); ladders: [x, верх, низ].
(() => {
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd, F = () => L9.FOES;
  const ZONES = [   // [x0, x1, подпись]
    [0, 2300, 'СКЛАД КАПСУЛ'],
    [2300, 4500, 'КОНВЕЙЕРНЫЙ ЗАЛ'],
    [4500, 6200, 'ГРУЗОВОЙ ПОДЪЁМНИК'],
  ];
  const BELT = [2380, 3520];               // конвейер вместо пола: тянет влево
  const ARM_X = 3175, UNL = 2.6;           // (там, где над лентой нет мостков)
  const HOOKS = [2820, 3780];            // крюки только там, где цепь не проходит сквозь мостки;           // рука-разгрузчик над правым краем ленты, цикл выгрузки
  const LIFT_X = 4700, LIFT_TOP = -170;

  L9.MAPS.lab = () => {
    const M = {
      x0: 0, x1: 6200, y0: -420, y1: 400, killY: 430,
      solids: [
        [0, 330, 940, 80], [1060, 330, 1190, 80], [2370, 330, 1230, 80], [3720, 330, 1200, 80],
        [4920, 330, 300, 80], [4840, LIFT_TOP, 1360, 40], [4600, LIFT_TOP - 260, 1600, 30, 'hide'],     // верхний этаж; потолок
        [-40, -420, 40, 830, 'hide'], [6200, -420, 40, 830, 'hide'], [5210, -130, 40, 540, 'hide'],     // за нижним ярусом подъёмника — стена шахты
      ],
      walks: [
        [300, 230, 260], [760, 230, 420], [1240, 230, 460], [1520, 130, 420], [1960, 230, 300],
        [2420, 220, 360], [2860, 190, 260], [3230, 220, 360], [3820, 220, 300], [4180, 150, 240],
        [5300, LIFT_TOP - 100, 300], [5700, LIFT_TOP - 100, 280],
      ],
      ladders: [[400, 230, 330], [1340, 230, 330], [1620, 130, 230], [2060, 230, 330], [2520, 220, 330], [3330, 220, 330], [3920, 220, 330], [4300, 150, 330], [5400, LIFT_TOP - 100, LIFT_TOP], [5800, LIFT_TOP - 100, LIFT_TOP]],     // не под торцами мостков; каждая от настила до пола
      lifts: [{ x: LIFT_X, w: 140, y: 330, y0: 330, y1: LIFT_TOP, on: 0 }],
      cks: [[140, 330], [2380, 330], [4560, 330], [5000, LIFT_TOP]],
      picks: [
        { kind: 'pist', x: 1700, y: 130 }, { kind: 'kefir', x: 2100, y: 330 }, { kind: 'grenades', x: 2950, y: 190 },
        { kind: 'rocket', x: 4300, y: 150 }, { kind: 'kefir', x: 3900, y: 220 }, { kind: 'pies', x: 4640, y: 330 }, { kind: 'plasma', x: 5800, y: LIFT_TOP - 100 },
      ],
      pits: [[940, 1060], [2250, 2370], [3600, 3720]],     // ямы — в них утоплены цистерны с кислотой (средняя — чан в конце конвейера)
      noFloor: [[BELT[0], BELT[1]]],     // здесь вместо плиты пола — лента конвейера
      vats: [[180, 330], [460, 330], [640, 330], [1130, 330], [1420, 330], [1840, 330], [2160, 330], [5100, LIFT_TOP], [5500, LIFT_TOP], [6000, LIFT_TOP]],
      tvs: [{ x: 2560, y: 120, line: 'Ваш Выборгск прогнил! Все блага должны достаться столице! Должны быть люди и черви! Я выжму все соки, все деньги из всех вас!' },
        { x: 4400, y: 60, line: 'Знаете, Валера, как-то раз я набрался храбрости и зашёл в чёрную комнату...' }],
      covers: [{ x: 1080, y: 330, kind: 'crates' }, { x: 1760, y: 330, kind: 'barrier' }, { x: 3562, y: 330, kind: 'crates' }, { x: 4050, y: 330, kind: 'barrier' }, { x: 5600, y: LIFT_TOP, kind: 'crates' }],
      props: [{ x: 820, y: 330, kind: 'console' }, { x: 1600, y: 330, kind: 'tube' }, { x: 2200, y: 330, kind: 'waste' }, { x: 3760, y: 330, kind: 'gas' }, { x: 3950, y: 330, kind: 'tube' }, { x: 5200, y: LIFT_TOP, kind: 'console' }, { x: 5900, y: LIFT_TOP, kind: 'waste' }],
      riders: [], acid: [], door: { x: 6140, y: LIFT_TOP, open: 0 },
    };
    // ---------- враги по зонам ----------
    M.spawnList = [
      ['Hat', 760, 330], ['Hat', 1000, 230], ['Arm', 1500, 330], ['Turret', 2270, 260, { dir: -1 }], ['Hat', 1700, 130], ['Stump', 2050, 330],
      ['Spit', 2700, 220], ['Stump', 2600, 330], ['Stump', 2900, 330], ['Weld', 3300, 330], ['Fly', 3500, 120], ['Crawl', 3900, 60, { ceil: 60 }], ['Hat', 4250, 150], ['Weld', 4100, 330],
      ['Super', 5550, LIFT_TOP], ['Spit', 5800, LIFT_TOP - 100], ['Arm', 6000, LIFT_TOP],
    ];
    M.init = (P, lv, ck) => {
      const x0 = M.cks[ck][0];
      for (const [tp, x, y, o] of M.spawnList) if (x > x0 + 200) P.foes.push(new (F()[tp])(M, x, y, o || {}));
      if (ck >= 3) { M.lifts[0].y = LIFT_TOP; M.lifts[0].on = 2; }
      M.picks = M.picks.filter(k => k.x > x0 + 40);
      M.covers.forEach(c => c.hp = 6); M.props.forEach(p => p.hp = 2);
      M.lastZone = null; M.tvIdx = 0;
      if (!ck) lv.say('ПРИЦЕЛ {up}/{down}+СТРЕЛКИ   КУВЫРОК [Q]   ГРАНАТА {throw}', 4);
    };
    M.zoneAt = x => ZONES.find(z => x >= z[0] && x < z[1]) || ZONES[ZONES.length - 1];
    M.beltAt = (x, y) => (x > BELT[0] && x < BELT[1] && Math.abs(y - 330) < 2) ? -70 : 0;
    M.hazAt = (x, y, P) => {
      for (const p of M.pits) if (x > p[0] && x < p[1] && y > 334 && y < 400) return [12, x];
      for (const a of M.acid) if (Math.abs(a.x - x) < 22 && Math.abs(a.y - y) < 4) return [8, a.x];
      return null;
    };
    M.update = (dt, P, lv) => {
      const z = M.zoneAt(P.x); if (z !== M.lastZone) { M.lastZone = z; lv.say(z[2], 2); }
      // подъёмник: едет вверх, когда на нём Валера; по дороге запрыгивают враги
      const L = M.lifts[0];
      if (L.on === 0 && P.onG && P.x > L.x && P.x < L.x + L.w && Math.abs(P.y - L.y) < 3) { L.on = 1; L.t = 0; Sound.play('crane'); lv.say('ПОДЪЁМНИК! ДЕРЖИСЬ!', 2); }
      if (L.on === 1) {
        L.t += dt; const vy = -38; L.y = Math.max(L.y1, L.y + vy * dt);
        if (P.onG && P.x > L.x - 4 && P.x < L.x + L.w + 4) P.y = L.y;
        // волны врагов на подъёмнике: летуны и потолочники с шахты
        if (!L.w1 && L.y < 220) { L.w1 = 1; P.foes.push(new (F().Fly)(M, L.x - 120, L.y - 140)); P.foes.push(new (F().Fly)(M, L.x + 260, L.y - 160)); }
        if (!L.w2 && L.y < 60) { L.w2 = 1; const c = new (F().Crawl)(M, L.x + 70, L.y - 260, { ceil: L.y - 260 }); P.foes.push(c); P.foes.push(new (F().Stump)(M, L.x + 120, L.y - 2)); }
        if (!L.w3 && L.y < -80) { L.w3 = 1; P.foes.push(new (F().Hat)(M, L.x + 20, L.y - 2)); }
        if (L.y <= L.y1) { L.on = 2; Sound.play('clank'); }
        if (P.y > L.y + 60 && !P.climb && P.onG) { L.on = 3; lv.say('ПОДЪЁМНИК ВОЗВРАЩАЕТСЯ...', 1.6); }     // сбили с площадки — едет вниз за Валерой
        for (const f of P.foes) if (!f.dead && !f.air && f.x > L.x && f.x < L.x + L.w && f.y > L.y - 30 && f.y < L.y + 30) f.y = L.y;
      }
      if (L.on === 2 && P.onG && P.y > 250 && P.x > 4300 && P.x < 5220) { L.on = 3; Sound.play('crane'); }     // Валера внизу, а подъёмник наверху — спускается
      if (L.on === 3) { L.y = Math.min(L.y0, L.y + 140 * dt); if (L.y >= L.y0) L.on = 0; }
      // подборы
      for (const k of M.picks) { k.t += dt; if (!k.dead && Math.abs(P.x - k.x) < 22 && Math.abs(P.y - k.y) < 40) M.take(k, P, lv); }
      M.picks = M.picks.filter(k => !k.dead);
      for (const a of M.acid) a.t += dt; M.acid = M.acid.filter(a => a.t < a.life);
      // наездники конвейера (бомжи едут влево к капсулам) — живой фон на ленте
      // конвейер: рука с потолка кладёт тело на ленту (цикл UNL сек), лента везёт влево, в конце тело падает в чан с жижей
      M.unlT = (M.unlT || 0) + dt; const ut = M.unlT % UNL;
      if (ut < M.unlPrev) { M.rideN = (M.rideN || 0) + 1; }
      if (M.unlPrev < UNL * 0.55 && ut >= UNL * 0.55) M.riders.push({ x: ARM_X, y: 330, k: ['bum', 'drunk', 'thug', 'lady'][M.rideN % 4] });
      M.unlPrev = ut;
      for (const r of M.riders) {
        if (!r.fall) { r.x -= 70 * dt; if (r.x < BELT[0] + 8) { r.fall = 1; r.vx = -60; r.vy = -40; r.rot = 0; } }
        else { r.x += r.vx * dt; r.vy += 900 * dt; r.y += r.vy * dt; r.rot -= 2.5 * dt; if (r.y > 352 && !r.spl) { r.spl = 1; Sound.play('splash', 0.35); P.fx.push({ sh: 'fxL9', fr: ['acidHit'], x: r.x, y: 340, s: 0.7, t: 0, life: 0.5, fade: 1 }); } }
      }
      M.riders = M.riders.filter(r => r.y < 420);
      // выход: дверь в конце верхнего этажа
      const d = M.door; if (!d.open && P.x > d.x - 120 && Math.abs(P.y - d.y) < 10) { if (P.foes.some(f => !f.dead && f.x > 5200)) P.hintAt('Дверь заблокирована — зачисти этаж!', 2); else { d.open = 1; d.t = 0; Sound.play('door'); } }
      if (d.open) d.t = (d.t || 0) + dt;
      if (d.open && d.t > 1.4 && P.x > d.x - 30 && !M.leaving) { M.leaving = 1; lv.next(); }
      if (d.open && d.t <= 1.4 && P.x > d.x - 46) P.x = d.x - 46;     // пока створки не разъехались — не пройти
    };
    M.take = (k, P, lv) => {
      k.dead = true; Sound.play('pickup'); lv.score += 100;
      const W = L9.WEAP;
      if (W[k.kind]) { P.weap = k.kind; P.ammo[k.kind] = (P.ammo[k.kind] || 0) + W[k.kind].ammo; lv.say(W[k.kind].name + '!', 1.6); }
      else if (k.kind === 'kefir') { P.hp = Math.min(100, P.hp + 35); lv.stats.food++; lv.say('Кефир! +35', 1.2); }
      else if (k.kind === 'pies') { P.hp = Math.min(100, P.hp + 25); lv.stats.food++; lv.say('Пирожки! +25', 1.2); }
      else if (k.kind === 'grenades') { P.gren = Math.min(9, P.gren + 3); lv.say('Гранаты +3', 1.2); }
      else if (k.kind === 'seed') { P.weap = 'seed'; P.ammo.seed += 30; lv.stats.secrets++; lv.say('ОСЕМЕНИТЕЛЬ 6000!!! СЕКРЕТ!', 2.5); }
    };
    // выстрелы по укрытиям, предметам и телевизорам
    M.shootProps = (b, P) => {
      for (const c of M.covers) { if (c.hp <= 0) continue; if (Math.abs(b.x - c.x) < 28 && b.y > c.y - 44 && b.y < c.y) { b.dead = true; c.hp -= b.dmg; Sound.play('clank', 0.5); if (c.hp <= 0) { Sound.play('crash'); P.lv.score += 50; } return; } }
      for (const p of M.props) { if (p.hp <= 0) continue; if (Math.abs(b.x - p.x) < 22 && b.y > p.y - 56 && b.y < p.y) { b.dead = true; p.hp -= b.dmg; if (p.hp <= 0) M.breakProp(p, P); return; } }
      for (const t of M.tvs) { if (t.broken) continue; if (Math.abs(b.x - t.x) < 30 && Math.abs(b.y - t.y) < 28) { b.dead = true; t.broken = 1; Sound.play('glass'); P.lv.score += 150; if (!M.tvBroke) { M.tvBroke = 1; P.lv.xsay('Я устал прощать.', 3); } return; } }
    };
    M.breakProp = (p, P) => {
      Sound.play(p.kind === 'tube' ? 'glass' : 'crash'); P.lv.score += 50;
      if (p.kind === 'waste' || p.kind === 'gas') P.blast(p.x, p.y - 30, 50, 6);
      if (p.kind === 'tube') { M.acid.push({ x: p.x, y: p.y, t: 0, life: 2 }); }
      if (Math.random() < 0.35) M.picks.push({ kind: Math.random() < 0.6 ? 'kefir' : 'grenades', x: p.x, y: p.y, t: 0 });
    };
    M.blast = (x, y, r, dmg, P) => { for (const p of M.props) if (p.hp > 0 && Math.hypot(p.x - x, p.y - 30 - y) < r + 20) { p.hp = 0; M.breakProp(p, P); } for (const c of M.covers) if (c.hp > 0 && Math.hypot(c.x - x, c.y - 20 - y) < r + 10) c.hp -= dmg; };

    // ---------- отрисовка ----------
    // многослойный параллакс (как на ур.2): дальний свод пещеры -> средний ряд резервуаров и ферм -> ближний ряд машин -> игровой план
    const PX = () => L9D._px || {};
    const layer = (c, n, h, kx, off, bottom, noFill) => {     // тайл-полоса высотой h, низом на bottom; ниже низа — тёмное основание слоя
      const im = L9.img[n], d = PX()[n]; if (!im || !d) return;
      const w = d[0] * h / d[1], top = Math.round(bottom - h);
      for (let x = -((off * kx % w) + w) % w; x < 640; x += w) c.drawImage(im, Math.floor(x), top, Math.ceil(w) + 1, h);
      if (bottom < 360 && !noFill) { c.fillStyle = d[2] || '#04080b'; c.fillRect(0, Math.round(bottom) - 1, 640, 362 - bottom); }
    };
    M.drawBack = (c, cx, cy) => {
      const fy = 330 - cy;                             // экранная высота пола первого этажа
      { const im = L9.img.px1, d = PX().px1; if (im && d) { const h = 400, w = d[0] * h / d[1], y = clamp(-20 - cy * 0.06, 360 - h, 0); for (let x = -((cx * 0.12 % w) + w) % w; x < 640; x += w) c.drawImage(im, Math.floor(x), Math.round(y), Math.ceil(w) + 1, h); } }
      c.fillStyle = 'rgba(2,6,10,0.15)'; c.fillRect(0, 0, 640, 360);
      layer(c, 'px2', 250, 0.32, cx, 268 + (fy - 260) * 0.3);
      c.fillStyle = 'rgba(2,6,10,0.22)'; c.fillRect(0, 0, 640, 360);
      layer(c, 'px3', 215, 0.6, cx, 300 + (fy - 260) * 0.62);
      if (cx > 3500 && cy < -60) { c.globalAlpha = clamp((cx - 3500) / 600, 0, 1) * clamp((-cy - 60) / 220, 0, 1); layer(c, 'px3', 215, 0.6, cx + 300, 300 + (fy - 500 - 260) * 0.62, true); c.globalAlpha = 1; }     // у подъёмника второй ряд машин на уровне верхнего этажа: проявляется плавно, без скачка
      c.fillStyle = 'rgba(2,6,10,0.12)'; c.fillRect(0, 0, 640, 360);
    };
    // рука-разгрузчик с потолка: опускает тело на ленту, раскрывает клешню, поднимается за следующим (цикл UNL)
    M.drawUnloader = (c, P) => {
      const im = L9.img.unload9, D = L9D.unload9; if (!im || !D) return;
      const u = (M.unlT || 0) % UNL / UNL, low = 300, high = 150;
      const clawY = u < 0.35 ? high + (low - high) * (u / 0.35) : u < 0.7 ? low : high + (low - high) * (1 - (u - 0.7) / 0.3);
      const fr = u < 0.55 ? 'closed' : u < 0.62 ? 'release' : 'open', f = D.f[L9.N.unload9[fr]], k = 0.5, w = f[2] * k, h = f[3] * k, cut = 0.5, top = Math.min(P.cam.y - 20, clawY - h);
      const x = ARM_X - f[4] * k;
      c.imageSmoothingEnabled = true;
      const skip = f[3] * 0.12;      // без рельса сверху: цилиндр и шток тянутся вверх за край экрана
      c.drawImage(im, f[0], f[1] + skip, f[2], f[3] * cut - skip, x, top, w, clawY - h * (1 - cut) - top + 1);
      c.drawImage(im, f[0], f[1] + f[3] * cut, f[2], f[3] * (1 - cut), x, clawY - h * (1 - cut), w, h * (1 - cut));   // клешня как нарисована
      c.imageSmoothingEnabled = false;
      if (u < 0.55) S(c, 'body9', ['bum', 'drunk', 'thug', 'lady'][(M.rideN || 0) % 4], ARM_X, clawY + 30, 0.85);     // несёт тело (за шиворот)
    };
    M.drawOnFloor = (c, P) => {     // поверх плиты пола: лента конвейера с телами, цистерны в ямах
      const t = P.t;
      // лента конвейера: бесшовная середина крутится влево, по краям торцы с барабанами; на ней лежат тела
      { const BK = 1.8, [ew] = L9.size('belt9b', 'endL'), [mw, mh] = L9.size('belt9b', 'mid'), y = 327 + mh * BK / 2, x0 = BELT[0] + ew * BK, x1 = BELT[1] - ew * BK, sh = (t * 70) % (mw * BK);
        c.save(); c.beginPath(); c.rect(x0, y - 30, x1 - x0, 60); c.clip(); for (let x = x0 - sh; x < x1; x += mw * BK - 1) S(c, 'belt9b', 'mid', x + mw * BK / 2, y, BK); c.restore();
        S(c, 'belt9b', 'endL', BELT[0] + ew * BK / 2, y, BK); S(c, 'belt9b', 'endR', BELT[1] - ew * BK / 2, y, BK); }
      for (const r of M.riders) if (!r.held) S(c, 'body9', r.k, r.x, r.y + 1, 0.85, { rot: r.rot || 0 });
      M.drawUnloader && M.drawUnloader(c, P);
      // ямы: утопленные цистерны с кислотой (кадры поверхности 0-1-2-1)
      for (const p of M.pits) {      // верх (кромка и кислота) — как нарисован, стенки ниже растянуты до дна ямы
        const fi = [0, 1, 2, 1][(t * 3 | 0) % 4], f = L9D.tank9.f[fi], im = L9.img.tank9, w = p[1] - p[0] + 10, k = w / f[2], h = f[3] * k, cut = 0.62, x = p[0] - 5, y = 323;
        if (!im) continue; c.imageSmoothingEnabled = true;
        c.drawImage(im, f[0], f[1], f[2], f[3] * cut, x, y, w, h * cut);
        c.drawImage(im, f[0], f[1] + f[3] * cut - 1, f[2], f[3] * (1 - cut), x, y + h * cut - 0.5, w, 430 - y - h * cut);
        c.imageSmoothingEnabled = false;
      }
    };
    M.drawMid = (c, P) => {
      const t = P.t;
      // капсулы-прессы с людьми (цикл: человек -> пресс -> жижа -> слив)
      // пресс-капсулы: один раз, когда Валера рядом — пресс выжимает «сок», дальше капсула стоит полной зелёной жижи
      M.vatT = M.vatT || {};
      for (const [x, y] of M.vats) {
        const id = x + ':' + y; if (M.vatT[id] == null && Math.abs(P.x - x) < 240 && Math.abs(P.y - y) < 160) { M.vatT[id] = t; Sound.play('crane'); }
        const e = M.vatT[id] == null ? -1 : t - M.vatT[id];
        const fr = e < 0.5 ? 'p0' : e < 1.5 ? 'p2' : 'p3';     // кадры на одном основании: стоит -> выжимает -> полная жижи
        S(c, 'vatP9', fr, x, y + 2, 0.9);
      }
      // цепи с крюками над лентой: от крюка вверх до потолка звеньями ровно по шагу цепи (без обрыва)
      const CK = 1.3, [, chH] = L9.size('chain9', 'hook'), [, lkH] = L9.size('chain9', 'link');
      for (let i = 0; i < HOOKS.length; i++) { const x = HOOKS[i];
        const fr = 'hook', hb = 150 + (i % 3) * 14, top = hb - chH * CK;
        S(c, 'chain9', fr, x, hb - chH * CK / 2, CK);
        for (let y = top; y > P.cam.y - lkH * CK; y -= lkH * CK) S(c, 'chain9', 'link', x, y - lkH * CK / 2, CK);
      }
      // ТВ с Иксом
      for (const tv of M.tvs) {
        const on = Math.abs(P.x - tv.x) < 300;
        if (on && !tv.said && !tv.broken) { tv.said = 1; P.lv.xsay(tv.line, 6); }
        S(c, 'tv9', tv.broken ? ((t * 3 | 0) % 2 ? 'broken' : 'smoke') : !on ? 'off' : 'x' + ((t * 6 | 0) % 4), tv.x, tv.y, 1);
      }
      // укрытия и предметы
      for (const cv of M.covers) if (cv.hp > -20) S(c, 'cover9', cv.hp > 0 ? (cv.hp < 3 && cv.kind === 'crates' ? 'cratesHit' : cv.kind) : 'cratesHit', cv.x, cv.y + 2, 1, { a: cv.hp > 0 ? 1 : 0.5 });
      for (const p of M.props) S(c, 'cover9', p.hp > 0 ? p.kind : ({ console: 'consoleDead', tube: 'tubeDead', waste: 'wasteBoom', gas: 'wasteBoom' })[p.kind], p.x, p.y + 2, 1);
      for (const a of M.acid) S(c, 'fxL9', 'acidHit', a.x, a.y - 4, 0.45, { a: clamp((a.life - a.t) / 0.6, 0, 1) });
      // подборы
      for (const k of M.picks) { S(c, 'fxL9', 'spark', k.x, k.y - 14, 0.4 + Math.sin(k.t * 5) * 0.08, { add: 1 }); S(c, 'pick9', k.kind, k.x, k.y - 16 + Math.sin(k.t * 4) * 2, 1); }
      // шахта подъёмника: две цельные стойки от лебёдки до дна, лебёдка под потолком, тросы до траверсы кабины
      const L = M.lifts[0]; M.drawShaft(c, L);
      { const d = M.door, f = d.open ? Math.min(5, (d.t || 0) / 1.4 * 6 | 0) : 0; S(c, 'gate9', 'g' + f, d.x, d.y + 2, 0.62); }     // ворота выхода: открываются по кадрам
    };
    const LK = 1.76, strip = (c, sh, fr, x, y0, y1, k) => { const h = L9.size(sh, fr)[1] * k; if (y1 > y0) S(c, sh, fr, x, (y0 + y1) / 2, k, { sy: (y1 - y0) / h }); };
    M.drawShaft = (c, L) => {
      const cxl = L.x + L.w / 2, wTop = LIFT_TOP - 235, [, wh] = L9.size('lift9', 'winch'), wb = wTop + wh * LK, carTop = L.y - L9D.lift9.carDeck * 0.5 * LK;
      strip(c, 'lift9', 'post', L.x + 21, wb - 6, 410, LK); strip(c, 'lift9', 'post', L.x + L.w - 14, wb - 6, 410, LK);
      strip(c, 'lift9', 'cable', cxl, wb - 4, carTop + 4, LK);
      S(c, 'lift9', 'winch', cxl, wTop + wh * LK / 2, LK);
    };
    M.drawCar = (c, L) => { const [, ch] = L9.size('lift9', 'car'), top = L.y - L9D.lift9.carDeck * 0.5 * LK; S(c, 'lift9', 'car', L.x + L.w / 2, top + ch * LK / 2, LK); };
    M.drawHud = (c, P) => { if (M.lifts[0].on === 1) G.text('ПОДЪЁМ: ' + Math.round((1 - (M.lifts[0].y - M.lifts[0].y1) / (M.lifts[0].y0 - M.lifts[0].y1)) * 100) + '%', 320, 30, { align: 'center', size: 8, color: '#ffd84a' }); };
    return M;
  };
})();
