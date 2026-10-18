// Уровень 9, карта лаборатории (часть C): склад капсул -> конвейерный зал -> подъёмник -> верхний ярус -> сброс вниз -> отстойник -> сортировка -> цех охраны (арена). Пол y=330, ярусы 230 и 130, верх подъёмника -170.
// solids: [x, y, w, h]; walks: [x, y, w] (мостки, сквозь них можно спрыгнуть); ladders: [x, верх, низ].
(() => {
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd, F = () => L9.FOES;
  const ZONES = [   // [x0, x1, подпись]
    [0, 2300, 'СКЛАД КАПСУЛ'],
    [2300, 4500, 'КОНВЕЙЕРНЫЙ ЗАЛ'],
    [4500, 6200, 'ГРУЗОВОЙ ПОДЪЁМНИК'],
    [6200, 6880, 'ЦЕХ ПРЕССОВ'],
    [6880, 8950, 'ОТСТОЙНИК'],
    [8950, 10330, 'СОРТИРОВКА'],
    [10330, 11400, 'ЦЕХ ОХРАНЫ'],
    [11400, 12420, 'ОГНЕННЫЙ КОРИДОР'],
    [12420, 15740, 'НАКЛОННЫЙ СПУСК'],
    [15740, 17800, 'РЕАКТОРНАЯ'],
  ];
  const BELTS = [     // конвейеры вместо пола: тянут влево; рука-разгрузчик кладёт тела, в конце лента сбрасывает их в чан
    { x0: 2380, x1: 3520, v: -70, arm: 3175, vat: 2325, n: 0 },
    { x0: 9060, x1: 10250, v: -70, arm: 10120, vat: 9005, n: 1 },
  ];
  const BODY = ['bum', 'drunk', 'thug', 'lady'];
  const UNL = 2.6;
  const DRIPS = [3000, 8070, 9420, 9900];     // протечки с потолка: капли кислоты
  const ARENA = [10330, 11400];
  let AR_SAVE = 0, LEV_SAVE = 0;     // сколько волн цеха охраны отбито и рычагов переключено (после смерти не сбрасываются)
  const HOOKS = [3330, 3560];            // крюки только там, где цепь не проходит сквозь мостки
  const LIFT_X = 4700, LIFT_TOP = -170;
  const DY = 1230, RY = DY - 130;           // пол реакторной и настил мостков в ней

  const WY = 200, UY = LIFT_TOP - 130;     // настил мостков — 130 px над полом
  const CW = [     // [x, y, пролётов, пролёт(ы) с лестницей]; опоры над чаном/лентой становятся подвесами к потолку
    [250, WY, 2, 1], [820, WY, 3, 2], [1440, WY, 3, 2], [2040, WY, 8, 0], [3600, WY, 6, 3],
    [5260, UY, 2, 1], [5690, UY, 2, 0],
    [7700, WY, 6, 0],                         // отстойник: мост над вторым чаном (первый — бесконечные лифты)
    [10480, WY, 3, 1], [10960, WY, 2, 0],     // цех охраны
    [16030, RY, 3, 1],                        // реакторная: мостки с первым рычагом
  ];
  L9.MAPS.lab = () => {
    const M = {
      x0: 0, x1: 17800, y0: -420, y1: 1360, killY: 1400, killAt: x => x < 12420 ? 430 : 1400,
      solids: [
        [0, 330, 955, 80], [1045, 330, 1235, 80], [2370, 330, 1245, 80], [3705, 330, 1215, 80],
        [4920, 330, 300, 80], [4840, LIFT_TOP, 2160, 40], [4600, LIFT_TOP - 260, 2500, 30, 'hide'],     // верхний этаж (обрывается сбросом у 7000); потолок
        [-40, -420, 40, 830, 'hide'], [17800, -420, 40, 2100, 'hide'], [5210, -130, 40, 540, 'hide'],     // за нижним ярусом подъёмника — стена шахты
        [6866, -130, 20, 460, 'hide'],     // под верхним этажом после сброса — глухо
        [6870, 330, 430, 80], [7550, 330, 400, 80], [8200, 330, 760, 80], [9050, 330, 2350, 80],     // отстойник и сортировка
        [ARENA[0], -170, 0, 500, 'hide'], [ARENA[1] - 20, -170, 0, 500, 'hide'],     // заслоны арены: ширина 0, пока не заперто
        [11400, 330, 1040, 80],     // огненный коридор — до верхней площадки наклонного лифта
        [15740, DY, 960, 80], [17150, DY, 650, 80],     // реакторная (низ спуска); между ними — чан с колесом
        [17090, DY - 240, 160, 20],     // уступ со вторым рычагом
      ],
      walks: [], ladders: [],     // строятся из CW (мостки v5: опоры и лестница — часть рисунка)
      lifts: [{ x: LIFT_X, w: 140, y: 330, y0: 330, y1: LIFT_TOP, on: 0 }],
      cks: [[140, 330], [2380, 330], [4560, 330], [5000, LIFT_TOP], [6160, LIFT_TOP], [6950, 330], [8890, 330], [10390, 330], [11470, 330], [12360, 330], [15790, DY], [16650, DY]],
      picks: [
        { kind: 'pist', x: 1600, y: WY }, { kind: 'pelmeni', x: 1220, y: WY }, { kind: 'kefir', x: 2100, y: 330 }, { kind: 'grenades', x: 2700, y: WY },
        { kind: 'pelmeni', x: 3760, y: 330 }, { kind: 'rocket', x: 4200, y: WY }, { kind: 'kefir', x: 3850, y: WY }, { kind: 'pies', x: 4640, y: 330 },
        { kind: 'pelmeni', x: 5300, y: LIFT_TOP }, { kind: 'plasma', x: 5950, y: UY }, { kind: 'kefir', x: 6150, y: LIFT_TOP }, { kind: 'pies', x: 6600, y: LIFT_TOP },
        { kind: 'pelmeni', x: 7120, y: 330 }, { kind: 'kefir', x: 7700, y: 330 }, { kind: 'grenades', x: 8300, y: WY }, { kind: 'pelmeni', x: 8420, y: 330 }, { kind: 'kefir', x: 8905, y: 330 },
        { kind: 'pelmeni', x: 9620, y: 330 }, { kind: 'kefir', x: 10180, y: 330 }, { kind: 'mini', x: 10400, y: 330 }, { kind: 'rocket', x: 11060, y: WY },
        { kind: 'kefir', x: 11450, y: 330 }, { kind: 'pelmeni', x: 12260, y: 330 },
        { kind: 'kefir', x: 15790, y: DY }, { kind: 'rocket', x: 16400, y: DY }, { kind: 'pelmeni', x: 16220, y: RY }, { kind: 'kefir', x: 17190, y: DY - 240 }, { kind: 'pelmeni', x: 17360, y: DY },
      ],
      pits: [[955, 1045], [2280, 2370], [3615, 3705], [7300, 7550], [7950, 8200], [8960, 9050], [16700, 17150, DY]],     // широкие (>120) — только по мосту, лифтам или колесу
      noFloor: BELTS.map(b => [b.x0, b.x1]),     // здесь вместо плиты пола — лента конвейера
      vats: [[180, 330], [420, 330], [640, 330], [1420, 330], [1702, 330], [2128, 330], [5100, LIFT_TOP], [5430, LIFT_TOP], [6080, LIFT_TOP],
        [7020, 330], [7660, 330], [8320, 330], [8640, 330], [10560, 330], [11180, 330], [15800, DY], [17500, DY]],
      tvs: [{ x: 2560, y: 70, line: 'Ваш Выборгск прогнил! Все блага должны достаться столице! Должны быть люди и черви! Я выжму все соки, все деньги из всех вас!' },
        { x: 4400, y: 60, line: 'Знаете, Валера, как-то раз я набрался храбрости и зашёл в чёрную комнату...' },
        { x: 7760, y: 70, line: 'Валера, вы как таракан. Но и из тараканов у меня выжимают сок. Всё идёт в дело!' },
        { x: 10700, y: 50, line: 'Охрана! Заприте его в цехе. Живым не выпускать... Ну или выпускать, но в банке.' },
        { x: 16500, y: DY - 270, line: 'Реактор, Валера! Сердце моей империи. Дёрнете рычаги — и дверь откроется. Если доживёте.' }],
      covers: [{ x: 1300, y: 330, kind: 'crates' }, { x: 1610, y: 330, kind: 'barrier' }, { x: 3562, y: 330, kind: 'crates' }, { x: 4130, y: 330, kind: 'barrier' }, { x: 5640, y: LIFT_TOP, kind: 'crates' },
        { x: 6910, y: 330, kind: 'crates' }, { x: 8300, y: 330, kind: 'barrier' }, { x: 11000, y: 330, kind: 'crates' }, { x: 11720, y: 330, kind: 'barrier' }, { x: 15960, y: DY, kind: 'crates' }, { x: 17280, y: DY, kind: 'barrier' }],
      props: [{ x: 820, y: 330, kind: 'console' }, { x: 1470, y: 330, kind: 'console' }, { x: 2000, y: 330, kind: 'waste' }, { x: 3760, y: 330, kind: 'gas' }, { x: 3950, y: 330, kind: 'waste' }, { x: 5200, y: LIFT_TOP, kind: 'console' }, { x: 5950, y: LIFT_TOP, kind: 'waste' },
        { x: 6930, y: LIFT_TOP, kind: 'gas' }, { x: 7860, y: 330, kind: 'gas' }, { x: 10700, y: 330, kind: 'waste' }, { x: 16580, y: DY, kind: 'console' }, { x: 17700, y: DY, kind: 'gas' }],
      riders: [], acid: [], drops: [],
      traps: {     // ловушки (level9traps.js) — по зонам: в каждой своё
        press: [[3020, 330, 0.5], [6300, LIFT_TOP, 0], [6480, LIFT_TOP, 0.85], [6660, LIFT_TOP, 1.7], [9560, 330, 0.2]],
        laser: [[1130, 330, 222, 0], [2800, 330, 222, 0.7], [9760, 330, 150, 0.4], [11840, 330, 160, 0], [11920, 330, 160, 0.45], [12000, 330, 160, 0.9]],
        fcol: [[7600, 330, 0], [7780, 330, 1.2], [11500, 330, 0], [11580, 330, 0.3], [11660, 330, 0.6], [15900, DY, 0], [16450, DY, 1.1]],
        hlaser: [[5470, 5590, LIFT_TOP, 8, 112, 2.6, 0], [12080, 12200, 330, 8, 112, 2.2, 0.8], [12260, 12380, 330, 8, 112, 2.4, 0.3], [17400, 17520, DY, 8, 112, 2.4, 0.5]],
        saw: [[8480, 8860, 330]],
      }, door: { x: 17740, y: DY, open: 0 }, gateL: { x: ARENA[0] + 20, y: 330 }, gateR: { x: ARENA[1] - 30, y: 330 },
      movers: {
        big: { x: 12440, w: 300, y0: 330, y1: DY, dx: 3000, waves: [[440, [['Hat', 60], ['Hat', 240]]], [580, [['Stump', 150], ['Fly', 200]]], [720, [['Hat', 50], ['Spit', 250]]], [880, [['Hat', 90], ['Stump', 210], ['Fly', 150]]], [1040, [['Fly', 80], ['Fly', 220]]]] },
        pater: [{ x: 7360, up: 1, top: 40, bot: 440 }, { x: 7490, up: 0, top: 40, bot: 440 }],
        wheel: [{ x: 16870, y: DY - 210, r: 160, n: 4, w: 0.45 }],
      },
      levers: [{ x: 16220, y: RY }, { x: 17190, y: DY - 240 }],
    };
    for (const [x, y, n, l] of CW) { const r = L9.LAB.cwBuild(x, y, n, l); M.walks.push(r.w); for (const l of r.lads) { l[2] = y < 0 ? LIFT_TOP : y > 1000 ? DY : 330; M.ladders.push(l); } }
    // ---------- враги по зонам ----------
    M.spawnList = [
      ['Hat', 760, 330], ['Hat', 1210, WY], ['Arm', 1500, 330], ['Turret', 1910, 330], ['Hat', 1700, WY], ['Stump', 2050, 330],
      ['Spit', 2600, WY], ['Stump', 2600, 330], ['Stump', 2900, 330], ['Weld', 3300, 330], ['Fly', 3500, 120], ['Crawl', 3900, 60, { ceil: 60 }], ['Hat', 4150, WY], ['Weld', 4100, 330], ['Turret', 4380, 330],
      ['Super', 5550, LIFT_TOP], ['Spit', 5900, UY], ['Arm', 6000, LIFT_TOP], ['Turret', 5800, LIFT_TOP],
      ['Hat', 6430, LIFT_TOP], ['Fly', 6700, -330], ['Arm', 6840, LIFT_TOP],
      ['Stump', 7200, 330], ['Hat', 7720, 330], ['Spit', 7860, WY], ['Fly', 8100, 90], ['Hat', 8250, WY], ['Weld', 8380, 330], ['Turret', 8900, 330],
      ['Stump', 9450, 330], ['Fly', 9650, 120], ['Stump', 9800, 330], ['Hat', 10050, 330], ['Crawl', 9900, 60, { ceil: 60 }], ['Turret', 10290, 330],
      ['Hat', 330, 330], ['Stump', 620, 330], ['Spit', 1000, WY], ['Fly', 1900, 100], ['Hat', 2700, 330], ['Fly', 3050, 100], ['Hat', 3800, WY], ['Stump', 4300, 330],
      ['Fly', 7600, 100], ['Stump', 8620, 330], ['Hat', 9300, 330], ['Fly', 10120, 100],
      ['Turret', 11760, 330], ['Fly', 11900, 110], ['Hat', 12160, 330], ['Turret', 12330, 330],
      ['Turret', 16150, DY], ['Fly', 16100, DY - 230], ['Spit', 16300, RY], ['Hat', 16500, DY], ['Fly', 16850, DY - 300], ['Crawl', 16950, DY - 330, { ceil: DY - 330 }],
      ['Hat', 17220, DY - 240], ['Hat', 17320, DY], ['Turret', 17600, DY], ['Super', 17680, DY],
    ];
    const WAVES = [     // цех охраны: волны прыгают сверху (с мостков и из-за края экрана), пока заслон закрыт
      [['Hat', 10750, 240], ['Hat', 11220, 240], ['Stump', 10600, 240]],
      [['Spit', 10560, 0], ['Fly', 10900, 100], ['Weld', 11150, 240], ['Stump', 10820, 240]],
      [['Super', 11100, 240], ['Hat', 10540, 240], ['Fly', 10700, 90]],
    ];
    M.init = (P, lv, ck) => {
      const x0 = M.cks[ck][0];
      for (const [tp, x, y, o] of M.spawnList) if (x > x0 + 200) P.foes.push(new (F()[tp])(M, x, y, o || {}));
      if (ck >= 3) { M.lifts[0].y = LIFT_TOP; M.lifts[0].on = 2; }
      const arCk = M.cks.findIndex(c => c[0] === 10390), rkCk = M.cks.findIndex(c => c[0] === 15790);
      L9.LAB.moversInit(M, ck >= rkCk);
      if (ck < rkCk) LEV_SAVE = 0; M.levers.forEach((l, i) => l.on = i < LEV_SAVE ? 1 : 0);
      M.picks = M.picks.filter(k => k.x > x0 + 40); M.picks.forEach(k => k.t = k.t || 0);     // без начального t координата анимации — NaN, предмет не рисуется
      M.covers.forEach(c => c.hp = 6); M.props.forEach(p => p.hp = 2);
      M.lastZone = null; M.tvIdx = 0; M.ar = ck > arCk ? { w: WAVES.length, t: 0, gate: 0, done: 1 } : null; if (ck < arCk) AR_SAVE = 0;
      if (!ck) lv.say('ПРИЦЕЛ {up}/{down}+СТРЕЛКИ   КУВЫРОК [Q]   ГРАНАТА {throw}', 4);
    };
    M.zoneAt = x => ZONES.find(z => x >= z[0] && x < z[1]) || ZONES[ZONES.length - 1];
    M.beltAt = (x, y) => { if (Math.abs(y - 330) >= 2) return 0; for (const b of BELTS) if (x > b.x0 && x < b.x1) return b.v; return 0; };
    M.hazAt = (x, y, P) => {
      for (const p of M.pits) { const fy = p[2] || 330; if (x > p[0] && x < p[1] && y > fy + 4 && y < fy + 70) {
        if (p[1] - p[0] > 120) { P.x = p[0] - 30; P.y = fy; P.vy = 0; return [25, x + 40]; }     // широкий чан: выбрасывает на ближний край
        return [12, x];
      } }
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
      
      if (M.unlPrev < UNL * 0.55 && ut >= UNL * 0.55) BELTS.forEach(b => { M.riders.push({ x: b.arm, y: 330, b, k: BODY[b.n % 4] }); b.n++; });     // кладёт ровно того, кого держала
      M.unlPrev = ut;
      for (const r of M.riders) {
        if (!r.fall) { r.x += r.b.v * dt; if (r.x < r.b.x0 + 8) { r.fall = 1; r.vx = -(r.x - r.b.vat) / 0.42; r.vy = -160; r.rot = 0; }     /* падает точно в середину чана в конце ленты */ }
        else { if (r.y > 340) r.vx *= 0.8; r.x += r.vx * dt; r.vy += 900 * dt; r.y += r.vy * dt; r.rot = Math.max(-1.4, r.rot - 3 * dt); if (r.y > 336 && !r.spl) { r.spl = 1; Sound.play('splash', 0.35); P.fx.push({ sh: 'fxL9', fr: ['acidHit'], x: r.x, y: 334, s: 0.7, t: 0, life: 0.5, fade: 1 }); } }
      }
      M.riders = M.riders.filter(r => r.y < 420);
      L9.LAB.trapsUpdate(M, P, dt);
      // протечки: капля срывается с потолка (из-за края экрана), падает до пола или мостка, обжигает
      for (let i = 0; i < DRIPS.length; i++) { const x = DRIPS[i]; if (Math.abs(x - P.x) > 420) continue; const ph = (P.t + i * 0.53) % 1.7, pp = ((P.t - dt) + i * 0.53) % 1.7; if (ph < pp) M.drops.push({ x, y: P.cam.y - 10, vy: 120 }); }
      for (const d of M.drops) {
        d.vy += 900 * dt; const ny = d.y + d.vy * dt, f = L9.LAB.floorBelow(M, d.x, d.y, ny);
        if (Math.abs(P.x - d.x) < 14 && ny > P.y - 76 && d.y < P.y) { d.dead = 1; P.hurt(8, d.x); }
        else if (f != null) { d.dead = 1; P.fx.push({ sh: 'fxL9', fr: ['acidHit'], x: d.x, y: f - 2, s: 0.35, t: 0, life: 0.35, fade: 1 }); if (Math.abs(P.x - d.x) < 300) Sound.play('splash', 0.12); }
        else d.y = ny;
      }
      M.drops = M.drops.filter(d => !d.dead && d.y < 420);
      // цех охраны: войдя, Валера оказывается взаперти — решётка падает, сверху сыплются волны охраны
      const gw = M.solids.find(r => r[4] === 'hide' && r[0] === ARENA[0] && r[1] === -170), gr = M.solids.find(r => r[4] === 'hide' && r[0] === ARENA[1] - 20 && r[1] === -170);
      if (!M.ar && P.x > ARENA[0] + 90 && P.x < ARENA[1] - 40 && P.y > 250 && P.y < 400) { M.ar = { w: AR_SAVE, t: 0, gate: 0 }; gw[2] = 24; gr[2] = 24; Sound.play('door'); lv.say('ЗАПЕРТО! ОТБИВАЙСЯ!', 2); }
      if (M.ar && !M.ar.done) {
        const a = M.ar; a.t += dt; a.gate = Math.min(1, a.gate + dt * 2);
        const alive = P.foes.some(f => !f.dead && f.x > ARENA[0] && f.x < ARENA[1] && f.y < 420);     // только враги внутри цеха
        if (!alive && a.t > 1) {
          if (a.w < WAVES.length) { for (const [tp, x, y, o] of WAVES[a.w]) P.foes.push(new (F()[tp])(M, x, y, o || {})); AR_SAVE = a.w; a.w++; a.t = 0; if (a.w > 1) lv.say('ВОЛНА ' + a.w + '!', 1.4); if (a.w === WAVES.length) M.picks.push({ kind: 'kefir', x: 10760, y: WY, t: 0 }); }
          else { a.done = 1; gw[2] = 0; gr[2] = 0; Sound.play('door'); lv.say('ЦЕХ ЗАЧИЩЕН! ДАЛЬШЕ — К КОНВЕЙЕРУ', 2.4); }
        }
      }
      if (M.ar && M.ar.done) M.ar.gate = Math.max(0, M.ar.gate - dt);
      // выход: дверь в конце цеха охраны
      L9.LAB.moversUpdate(M, P, dt, lv); L9.LAB.leversUpdate(M, P, lv); LEV_SAVE = Math.max(LEV_SAVE, M.levers.filter(l => l.on).length);
      const d = M.door; if (!d.open && P.x > d.x - 120 && Math.abs(P.y - d.y) < 10) { if (M.levers.some(l => !l.on)) P.hintAt('Дверь заперта — найди и переключи рычаги (' + M.levers.filter(l => l.on).length + '/' + M.levers.length + ')', 2); else { d.open = 1; d.t = 0; Sound.play('door'); } }
      if (d.open) d.t = (d.t || 0) + dt;
      if (d.open && d.t > 1.4 && P.x > d.x - 30 && !M.leaving) { M.leaving = 1; lv.next(); }
      if (d.open && d.t <= 1.4 && P.x > d.x - 46) P.x = d.x - 46;     // пока створки не разъехались — не пройти
    };
    M.take = (k, P, lv) => {
      k.dead = true; Sound.play('pickup'); lv.score += 100;
      const W = L9.WEAP;
      if (W[k.kind]) { P.weap = k.kind; P.ammo[k.kind] = (P.ammo[k.kind] || 0) + W[k.kind].ammo; lv.say(W[k.kind].name + '!', 1.6); }
      else if (k.kind === 'kefir') { P.hp = Math.min(100, P.hp + 45); lv.stats.food++; lv.say('Кефир! +45', 1.2); }
      else if (k.kind === 'pelmeni') { P.hp = Math.min(100, P.hp + 60); lv.stats.food++; lv.say('Пельмешки!!! +60', 1.4); }
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
      if (Math.random() < 0.5) M.picks.push({ kind: Math.random() < 0.7 ? 'kefir' : 'grenades', x: p.x, y: p.y, t: 0 });
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
    // портал входа в наклонный тоннель: граница фона цеха и тоннеля стоит в мире здесь, её закрывают арка и колонна
    M.exitX = () => (M.movers && M.movers.big ? M.movers.big.x + M.movers.big.dx : 15440) + 330;     // выход из тоннеля внизу спуска
    M.portalX = () => (M.movers && M.movers.big ? M.movers.big.x : 12440) - 40;
    M.drawPortal = (c, P) => {
      const X = M.portalX(), [aw, ah] = L9.size('part9', 'arch'), k = 310 / aw;
      if (Math.abs(X - P.cam.x - 320) < 700) S(c, 'part9', 'arch', X + 150, 392 - ah * k / 2, k);     // полукруглая арка над стартом тележки: левая нога — на границе фонов
      if (Math.abs(X - P.cam.x - 320) < 700) L9.LAB.drawColumn(c, X, P.cam.y - 40, 338, 1.25);     // массивная колонна-откос портала закрывает шов во всю высоту
      const X2 = M.exitX(); if (Math.abs(X2 - P.cam.x - 320) < 700) { S(c, 'part9', 'arch', X2 + 150, DY + 62 - ah * k / 2, k); L9.LAB.drawColumn(c, X2, P.cam.y - 40, DY + 8, 1.25); }     // такой же портал на выходе из тоннеля в реакторную
    };
    // наклонный спуск: тоннель повёрнут вдоль рельса (уклон 0.3). Кадр тоннеля: x — вдоль рельса, y — поперёк; fy — где в этом кадре проходит рельс
    M.tunFrame = (c, cx, cy, fn) => {
      const b = M.movers && M.movers.big; if (!b) return; const th = Math.atan(0.3), ux = Math.cos(th), uy = Math.sin(th), mx = cx + 320, my = cy + 180;
      const along = mx * ux + my * uy, n = -mx * uy + my * ux, nR = -(b.x + 108) * uy + (b.y0 + 90) * ux;
      c.save(); c.translate(320, 180); c.rotate(th); fn(nR - n, along); c.restore();
    };
    M.drawOver = (c, cx, cy) => {     // передний план спуска: тёмные рёбра крепи поперёк тоннеля, быстрее игрового плана (объём)
      const mid = cx + 320, r = (v, a0, a1) => clamp((v - a0) / (a1 - a0), 0, 1), bI = clamp((cx + 640 - M.portalX()) / 640, 0, 1), bO = clamp((cx + 640 - M.exitX()) / 640, 0, 1); if (bI <= bO) return;
      const fc = M.fgCv || (M.fgCv = document.createElement('canvas')); fc.width = 640; fc.height = 360; const g = fc.getContext('2d');     // рёбра рисуем отдельно и затемняем до силуэта
      M.tunFrame(g, cx, cy, (fy, along) => { const step = 1100, off = along * 1.4; for (let i = Math.floor((off - 900) / step); i * step < off + 900; i++) S(g, 'arch9', 'pillar', i * step - off, fy + 230, 1.5); });
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(3,7,10,0.72)'; g.fillRect(0, 0, 640, 360);
      c.save(); c.beginPath(); c.rect(640 * (1 - bI), 0, 640 * (bI - bO), 360); c.clip(); c.globalAlpha = 0.82; c.drawImage(fc, 0, 0); c.restore();     // чуть просвечивают — Валеру за ребром видно
    };
    M.drawBack = (c, cx, cy) => {
      const fy = (cx > 12300 ? 330 + clamp((cy - 100) / 900, 0, 1) * 900 : 330) - cy;     // экранная высота пола (в грузовой шахте и реакторной пол уходит на 1200 вниз)
      { const im = L9.img.px1, d = PX().px1; if (im && d) { const h = 400, w = d[0] * h / d[1], y = clamp(-20 - cy * 0.06, 360 - h, 0); for (let x = -((cx * 0.12 % w) + w) % w; x < 640; x += w) c.drawImage(im, Math.floor(x), Math.round(y), Math.ceil(w) + 1, h); } }
      c.fillStyle = 'rgba(2,6,10,0.15)'; c.fillRect(0, 0, 640, 360);
      layer(c, 'px2', 250, 0.32, cx, 268 + (fy - 260) * 0.3);
      c.fillStyle = 'rgba(2,6,10,0.22)'; c.fillRect(0, 0, 640, 360);
      // фоны зон: шахта с ярусами у подъёмника, наклонный тоннель, зал реактора — плавно сменяют общий план; по вертикали свой параллакс
      const ramp = (v, a0, a1) => clamp((v - a0) / (a1 - a0), 0, 1), mid = cx + 320;
      const bI = clamp((cx + 640 - M.portalX()) / 640, 0, 1), bO = clamp((cx + 640 - M.exitX()) / 640, 0, 1), cI = bO;
      const wA = 0, wB = bI * (1 - bO), wC = cI;
      // фон зоны не просвечивает сквозь соседний, а сменяет его «шторкой»: видимая полоса экрана от 640*(1-вход) до 640*(1-выход), край мягкий (40 px)
      // наклонный спуск — тоннель как в погоне: дальняя стена и свод с трубами отдельными слоями (свой параллакс по x и y — объём)
      const tl = (n, kx, y, h) => { const im = L9.img[n]; if (!im) return; const w = im.width / im.height * h; for (let x = -((cx * kx % w) + w) % w - w; x < 700; x += w) c.drawImage(im, Math.floor(x), Math.round(y), Math.ceil(w) + 1, h); };
      const tunBg = () => { c.fillStyle = '#04070a'; c.fillRect(0, 0, 640, 360); M.tunFrame(c, cx, cy, (fy, along) => {
          tl2('tunWall', along * 0.3, fy - 660, 400); tl2('tunWall', along * 0.3, fy - 260, 400); c.fillStyle = 'rgba(2,6,10,0.25)'; c.fillRect(-800, -800, 1600, 1600); tl2('tunCeil', along * 0.5, fy - 460, 190); }); };
      const tl2 = (n, off, y, h) => { const im = L9.img[n]; if (!im) return; const w = im.width / im.height * h; for (let x = -((off % w) + w) % w - 2 * w; x < 760; x += w) c.drawImage(im, Math.floor(x) - 380, Math.round(y), Math.ceil(w) + 1, h); };
      // реакторная — слоями, как в погоне: дальний зал bgC почти неподвижен, ряд колб (средний) и балки под сводом (ближний) едут быстрее
      const reactBg = () => {     // реакторная — слоями, как общий план цеха: дальний зал (rx1), средний ряд башен и сосудов (rx2), ближние машины (rx3)
        const cy2 = cy - (DY - 330), f2 = DY - cy; c.fillStyle = '#04070a'; c.fillRect(0, 0, 640, 360);
        { const im = L9.img.rx1, d = PX().rx1; if (im && d) { const h = 400, w = d[0] * h / d[1], y = clamp(-20 - cy2 * 0.06, 360 - h, 0); for (let x = -((cx * 0.12 % w) + w) % w; x < 640; x += w) c.drawImage(im, Math.floor(x), Math.round(y), Math.ceil(w) + 1, h); } }
        c.fillStyle = 'rgba(2,6,10,0.15)'; c.fillRect(0, 0, 640, 360); layer(c, 'rx2', 250, 0.32, cx, 268 + (f2 - 260) * 0.3);
        c.fillStyle = 'rgba(2,6,10,0.22)'; c.fillRect(0, 0, 640, 360); layer(c, 'rx3', 215, 0.6, cx, 300 + (f2 - 260) * 0.62); };
      const zoneBg = (n, wIn, wOut, kx, yy) => { const im = L9.img[n], d = PX()[n]; if (!im || !d || wIn <= wOut) return; const h = d[1], w = d[0], y = clamp(yy, 360 - h, 0);
        const x0 = 640 * (1 - wIn), x1 = 640 * (1 - wOut), draw = n === 'bgB' ? tunBg : n === 'bgC' ? reactBg : () => { for (let x = -((cx * kx % w) + w) % w; x < 640; x += w) c.drawImage(im, Math.floor(x), Math.round(y), Math.ceil(w) + 1, h); };
        for (let i = 0; i < 4; i++) { const e = 10 * (4 - i), a = x0 > 0 ? x0 - e : 0, b = x1 < 640 ? x1 + e : 640; if (i < 3 && a <= 0 && b >= 640) continue;
          c.save(); c.globalAlpha = i < 3 ? 0.25 : 1; c.beginPath(); c.rect(i < 3 ? a : x0, 0, (i < 3 ? b - a : x1 - x0), 360); c.clip(); draw(); c.restore(); } };
      zoneBg('bgB', bI, bO, 0.16, -(cy - 100) * 0.2); zoneBg('bgC', cI, 0, 0.14, -(cy - 700) * 0.3);
      if (false) {     // наклонный тоннель (арки отключены: фон теперь тоннель как в погоне): средний план — арки крепи вдоль спуска, сдвигаются медленнее игрового плана (объём)
        const f = 0.6, [aw, ah] = L9.size('part9', 'arch'), ak = 2.2; c.save(); c.beginPath(); c.rect(640 * (1 - bI), 0, 640 * (bI - bO), 360); c.clip();
        for (let ax = 12000; ax < 16200; ax += 420) { const ay = 330 + (ax - 12440) * 0.3 + 120, sx = (ax - (cx + 320)) * f + 320, sy = (ay - (cy + 180)) * f + 180; if (sx < -aw * ak || sx > 640 + aw * ak) continue; S(c, 'part9', 'arch', sx, sy - ah * ak / 2, ak); }
        c.restore(); c.fillStyle = 'rgba(2,6,10,' + 0.3 * wB + ')'; c.fillRect(0, 0, 640, 360);
      }
      if (wA + wB + wC > 0) { c.fillStyle = 'rgba(2,6,10,' + (0.18 * Math.max(wA, wB, wC)) + ')'; c.fillRect(0, 0, 640, 360); }
      if (bI < 1) { c.save(); c.beginPath(); c.rect(0, 0, 640 * (1 - bI), 360); c.clip(); layer(c, 'px3', 215, 0.6, cx, 300 + (fy - 260) * 0.62); c.restore(); }     // машины общего плана уходят той же шторкой, что входит тоннель
      if (cx > 3500 && cy < -60) { c.globalAlpha = clamp((cx - 3500) / 600, 0, 1) * clamp((-cy - 60) / 220, 0, 1); layer(c, 'px3', 215, 0.6, cx + 300, 300 + (fy - 500 - 260) * 0.62, true); c.globalAlpha = 1; }     // у подъёмника второй ряд машин на уровне верхнего этажа: проявляется плавно, без скачка
      c.fillStyle = 'rgba(2,6,10,0.12)'; c.fillRect(0, 0, 640, 360);
    };
    // рука-разгрузчик с потолка: опускает тело на ленту, раскрывает клешню, поднимается за следующим (цикл UNL)
    M.drawUnloader = (c, P) => { for (const b of BELTS) if (Math.abs(b.arm - P.cam.x - 320) < 480) M.drawArm(c, P, b.arm, b); };
    M.drawArm = (c, P, ARM_X, B) => {
      const im = L9.img.unload9, D = L9D.unload9; if (!im || !D) return;
      const u = (M.unlT || 0) % UNL / UNL, low = 300, high = Math.min(150, P.cam.y - 70);     // сверху — из-за края экрана
      const clawY = u < 0.35 ? high + (low - high) * (u / 0.35) : u < 0.7 ? low : high + (low - high) * (1 - (u - 0.7) / 0.3);
      const fr = u < 0.55 ? 'closed' : u < 0.62 ? 'release' : 'open', f = D.f[L9.N.unload9[fr]], k = 0.5, w = f[2] * k, h = f[3] * k, cut = 0.5, top = Math.min(P.cam.y - 20, clawY - h);
      const x = ARM_X - f[4] * k;
      c.imageSmoothingEnabled = true;
      const skip = f[3] * 0.12;      // без рельса сверху: цилиндр и шток тянутся вверх за край экрана
      c.drawImage(im, f[0], f[1] + skip, f[2], f[3] * cut - skip, x, top, w, clawY - h * (1 - cut) - top + 1);
      c.drawImage(im, f[0], f[1] + f[3] * cut, f[2], f[3] * (1 - cut), x, clawY - h * (1 - cut), w, h * (1 - cut));   // клешня как нарисована
      c.imageSmoothingEnabled = false;
      if (u < 0.55) S(c, 'body9', BODY[B.n % 4], ARM_X, clawY + 30, 0.85);     // несёт тело (за шиворот)
    };
    M.drawOnFloor = (c, P) => {     // поверх плиты пола: лента конвейера с телами, цистерны в ямах
      const t = P.t;
      // лента конвейера: бесшовная середина крутится влево, по краям торцы с барабанами; на ней лежат тела
      for (const B of BELTS) { if (B.x1 < P.cam.x - 100 || B.x0 > P.cam.x + 740) continue; const BELT = [B.x0, B.x1]; const BK = 1.8, [ew] = L9.size('belt9b', 'endL'), [mw, mh] = L9.size('belt9b', 'mid'), y = 316 + mh * BK / 2, x0 = BELT[0] + ew * BK * 0.45, x1 = BELT[1] - ew * BK * 0.45, PER = mw * BK - 1, sh = ((t * -B.v) % PER + PER) % PER;
        c.save(); c.beginPath(); c.rect(x0, y - 40, x1 - x0, 80); c.clip(); for (let x = x0 - sh; x < x1; x += mw * BK - 1) S(c, 'belt9b', 'mid', x + mw * BK / 2, y, BK); c.restore();     /* лента одним куском едет по всей длине */
        S(c, 'belt9b', 'endL', BELT[0] + ew * BK / 2, y, BK); S(c, 'belt9b', 'endR', BELT[1] - ew * BK / 2, y, BK); }
      for (const r of M.riders) {     // упавшее тело уходит под поверхность жижи (рисуем только то, что выше неё)
        if (r.fall && r.y > 326) { c.save(); c.beginPath(); c.rect(r.x - 80, r.y - 120, 160, 336 - (r.y - 120)); c.clip(); S(c, 'body9', r.k, r.x, r.y + 1, 0.85, { rot: r.rot || 0 }); c.restore(); }
        else S(c, 'body9', r.k, r.x, r.y + 1, 0.85, { rot: r.rot || 0 });
      }
      M.drawUnloader && M.drawUnloader(c, P);
      // ямы: утопленные цистерны с кислотой (кадры поверхности 0-1-2-1)
      for (const p of M.pits) {      // глубокий чан целиком (без растяжки): кромка на уровне пола, стенки уходят вниз; кипение — пузыри поверх
        const [vw, vh] = L9.size('vatD9', 'v'), k = (p[1] - p[0] + 14) / vw, cx = (p[0] + p[1]) / 2, top = (p[2] || 330) - 3;
        { const im = L9.img.vatD9, F = L9D.vatD9.f[0], dw = F[2] * 0.5 * k, dh = F[3] * 0.5 * k, s0 = 0.62, s1 = 0.9, sh = (s1 - s0) * dh;     // стенки чана уходят до низа экрана
          if (im) { c.imageSmoothingEnabled = true; for (let y = top + dh * s1 - 2; y < P.cam.y + 380; y += sh - 2) c.drawImage(im, F[0], F[1] + F[3] * s0, F[2], F[3] * (s1 - s0), cx - dw / 2, y, dw, sh); c.imageSmoothingEnabled = false; } }
        S(c, 'vatD9', 'v', cx, top + vh * k / 2, k);
        for (let i = 0; i < 3; i++) { const ph = (t * 0.7 + i * 0.37 + p[0] * 0.001) % 1; S(c, 'fxL9', 'acid', cx + Math.sin(i * 2.3 + p[0]) * (p[1] - p[0]) * 0.3, top + 9 - ph * 6, 0.12 + ph * 0.06, { add: 1, a: Math.sin(ph * Math.PI) * 0.8 }); }
      }
    };
    M.drawMid = (c, P) => {
      M.drawPortal(c, P);
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
      for (const d of M.drops) S(c, 'fxL9', 'acid', d.x, d.y, 0.09, { add: 1 });
      for (const x of DRIPS) if (Math.abs(x - P.cam.x - 320) < 400) { const f = L9.LAB.floorBelow(M, x, P.cam.y, 400); if (f != null) S(c, 'fxL9', 'acidHit', x, f - 1, 0.22, { a: 0.35 + Math.sin(t * 3 + x) * 0.1 }); }     // лужа под протечкой — предупреждение
      L9.LAB.moversDraw(c, M, P); L9.LAB.leversDraw(c, M, P);
      L9.LAB.trapsDraw(c, M, P);
      // подборы
      for (const k of M.picks) {
        const bob = Math.sin(k.t * 4) * 2;
        if (L9.WEAP[k.kind] || k.kind === 'grenades') {     // оружие: светящийся круг под ним, как в играх
          const pu = 0.5 + Math.sin(k.t * 5) * 0.5; c.save(); c.globalCompositeOperation = 'lighter';
          c.fillStyle = 'rgba(255,214,90,' + (0.18 + pu * 0.12) + ')'; c.beginPath(); c.ellipse(k.x, k.y - 2, 26, 7, 0, 0, Math.PI * 2); c.fill();
          c.strokeStyle = 'rgba(255,236,140,' + (0.55 + pu * 0.4) + ')'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(k.x, k.y - 2, 22 + pu * 4, 6 + pu, 0, 0, Math.PI * 2); c.stroke();
          c.fillStyle = 'rgba(255,220,120,0.10)'; c.beginPath(); c.arc(k.x, k.y - 18, 20 + pu * 3, 0, Math.PI * 2); c.fill(); c.restore();
        }
        if (k.kind === 'pelmeni' || k.kind === 'kefir') { c.save(); c.globalAlpha = 0.25 + Math.sin(k.t * 6) * 0.12; c.fillStyle = '#fff6a0'; c.beginPath(); c.arc(k.x, k.y - 14 + bob, 13, 0, Math.PI * 2); c.fill(); c.restore(); Art.item(c, k.kind, k.x, k.y - 14 + bob, 0, 1); continue; }     // еда как на прошлых уровнях
        S(c, 'fxL9', 'spark', k.x, k.y - 14, 0.4 + Math.sin(k.t * 5) * 0.08, { add: 1 }); S(c, 'pick9', k.kind, k.x, k.y - 16 + bob, 1);
      }
      // шахта подъёмника: две цельные стойки от лебёдки до дна, лебёдка под потолком, тросы до траверсы кабины
      const L = M.lifts[0]; M.drawShaft(c, L);
      if (M.ar && M.ar.gate > 0) for (const g of [M.gateL, M.gateR]) { const k = M.ar.gate; c.save(); c.beginPath(); c.rect(g.x - 60, g.y - 120, 120, 122); c.clip(); for (let i = 0; i < 2; i++) S(c, 'cover9', 'barrier', g.x, g.y + 2 - i * 40 + (1 - k) * 90, 1); c.restore(); }     // заслон входа в цех охраны: выезжает из пола
      { const d = M.door, f = d.open ? Math.min(5, (d.t || 0) / 1.4 * 6 | 0) : 0; S(c, 'gate9', 'g' + f, d.x, d.y + 2, 0.62); }     // ворота выхода: открываются по кадрам
    };
    const LK = 1.76, strip = (c, sh, fr, x, y0, y1, k) => { const h = L9.size(sh, fr)[1] * k; if (y1 > y0) S(c, sh, fr, x, (y0 + y1) / 2, k, { sy: (y1 - y0) / h }); };
    M.drawShaft = (c, L) => {
      const cxl = L.x + L.w / 2, wTop = LIFT_TOP - 235, [, wh] = L9.size('lift9', 'winch'), wb = wTop + wh * LK, carTop = L.y - L9D.lift9.carDeck * 0.5 * LK;
      strip(c, 'lift9', 'post', L.x + 21, wb - 6, 338, LK); strip(c, 'lift9', 'post', L.x + L.w - 14, wb - 6, 338, LK);     // направляющие стоят на полу
      L9.LAB.drawColumn(c, 5232, LIFT_TOP - 250, 338, 1.1);     // торец шахты: колонна от потолка до пола там, где кончается нижний ярус
      strip(c, 'lift9', 'cable', cxl + 3, wb - 4, carTop + 4, LK);     // тросы — точно над креплениями кабины (у кабины и лебёдки они на 3 px правее центра)
      S(c, 'lift9', 'winch', cxl, wTop + wh * LK / 2, LK);
    };
    M.drawCar = (c, L) => { if (L.kind === 'big') return L9.LAB.bigLiftDraw(c, L, L9.PARTS.lab); if (L.kind) return; const [, ch] = L9.size('lift9', 'car'), top = L.y - L9D.lift9.carDeck * 0.5 * LK; S(c, 'lift9', 'car', L.x + L.w / 2, top + ch * LK / 2, LK); };
    M.drawHud = (c, P) => { if (M.lifts[0].on === 1) G.text('ПОДЪЁМ: ' + Math.round((1 - (M.lifts[0].y - M.lifts[0].y1) / (M.lifts[0].y0 - M.lifts[0].y1)) * 100) + '%', 320, 30, { align: 'center', size: 8, color: '#ffd84a' }); };
    return M;
  };
})();
