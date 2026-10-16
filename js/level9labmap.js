// Уровень 9, карта лаборатории (часть C): склад капсул -> конвейерный зал -> подъёмник. Пол y=330, ярусы 230 и 130, верх подъёмника -170.
// solids: [x, y, w, h]; walks: [x, y, w] (мостки, сквозь них можно спрыгнуть); ladders: [x, верх, низ].
(() => {
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd, F = () => L9.FOES;
  const ZONES = [   // [x0, x1, фоны, подпись]; в зоне один кадр, чередуется со своим зеркалом — стыки бесшовные
    [0, 2300, ['lab1a'], 'СКЛАД КАПСУЛ'],
    [2300, 4500, ['lab2a'], 'КОНВЕЙЕРНЫЙ ЗАЛ'],
    [4500, 6200, ['lab1c'], 'ГРУЗОВОЙ ПОДЪЁМНИК'],
  ];
  const BELT = [2380, 3560];               // конвейер на полу: тянет влево
  const LIFT_X = 4700, LIFT_TOP = -170;

  L9.MAPS.lab = () => {
    const M = {
      x0: 0, x1: 6200, y0: -420, y1: 400, killY: 430,
      solids: [
        [0, 330, 940, 80], [1060, 330, 1240, 80], [2300, 330, 1300, 80], [3720, 330, 1200, 80],
        [4920, 330, 300, 80], [4840, LIFT_TOP, 1360, 40], [4600, LIFT_TOP - 260, 1600, 30, 'hide'],     // верхний этаж; потолок
        [-40, -420, 40, 830, 'hide'], [6200, -420, 40, 830, 'hide'], [5210, -130, 40, 540, 'hide'],     // за нижним ярусом подъёмника — стена шахты
      ],
      walks: [
        [300, 230, 260], [760, 230, 420], [1240, 230, 460], [1520, 130, 420], [1960, 230, 300],
        [2420, 220, 360], [2860, 190, 260], [3230, 220, 420], [3560, 260, 160], [3820, 220, 300], [4180, 150, 240],
        [5300, LIFT_TOP - 100, 300], [5700, LIFT_TOP - 100, 280],
      ],
      ladders: [[400, 230, 330], [1340, 230, 330], [1620, 130, 230], [2060, 230, 330], [2520, 220, 330], [3330, 220, 330], [3920, 220, 330], [4300, 150, 330], [5400, LIFT_TOP - 100, LIFT_TOP], [5800, LIFT_TOP - 100, LIFT_TOP]],     // не под торцами мостков; каждая от настила до пола
      lifts: [{ x: LIFT_X, w: 140, y: 330, y0: 330, y1: LIFT_TOP, on: 0 }],
      cks: [[140, 330], [2380, 330], [4560, 330], [5000, LIFT_TOP]],
      picks: [
        { kind: 'pist', x: 1700, y: 130 }, { kind: 'kefir', x: 2100, y: 330 }, { kind: 'grenades', x: 2950, y: 190 },
        { kind: 'rocket', x: 4300, y: 150 }, { kind: 'kefir', x: 3900, y: 220 }, { kind: 'pies', x: 4640, y: 330 }, { kind: 'plasma', x: 5800, y: LIFT_TOP - 100 },
      ],
      pits: [[940, 1060], [3600, 3720], [4610, 4920]],     // ямы с жижей (кроме шахты подъёмника — там пропасть)
      vats: [[180, 330], [460, 330], [640, 330], [1130, 330], [1420, 330], [1840, 330], [2160, 330], [5100, LIFT_TOP], [5500, LIFT_TOP], [6000, LIFT_TOP]],
      tvs: [{ x: 2560, y: 120, line: 'Ваш Выборгск прогнил! Все блага должны достаться столице! Должны быть люди и черви! Я выжму все соки, все деньги из всех вас!' },
        { x: 4400, y: 60, line: 'Знаете, Валера, как-то раз я набрался храбрости и зашёл в чёрную комнату...' }],
      covers: [{ x: 1080, y: 330, kind: 'crates' }, { x: 1760, y: 330, kind: 'barrier' }, { x: 3000, y: 330, kind: 'crates' }, { x: 4050, y: 330, kind: 'barrier' }, { x: 5600, y: LIFT_TOP, kind: 'crates' }],
      props: [{ x: 820, y: 330, kind: 'console' }, { x: 1600, y: 330, kind: 'tube' }, { x: 2700, y: 330, kind: 'waste' }, { x: 3400, y: 330, kind: 'gas' }, { x: 3950, y: 330, kind: 'tube' }, { x: 5200, y: LIFT_TOP, kind: 'console' }, { x: 5900, y: LIFT_TOP, kind: 'waste' }],
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
      for (const p of M.pits) if (x > p[0] && x < p[1] && y > 334 && y < 400 && !(p[0] === 4610)) return [12, x];
      for (const a of M.acid) if (Math.abs(a.x - x) < 22 && Math.abs(a.y - y) < 4) return [8, a.x];
      return null;
    };
    M.update = (dt, P, lv) => {
      const z = M.zoneAt(P.x); if (z !== M.lastZone) { M.lastZone = z; lv.say(z[3], 2); }
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
      M.rideT = (M.rideT || 0) - dt;
      if (M.rideT <= 0) { M.rideT = rnd(1.6, 2.6); M.riders.push({ x: BELT[1] - 10, k: ['bum', 'drunk', 'thug', 'lady'][Math.random() * 4 | 0] }); }
      for (const r of M.riders) r.x -= 70 * dt; M.riders = M.riders.filter(r => r.x > BELT[0] + 30);
      // выход: дверь в конце верхнего этажа
      const d = M.door; if (!d.open && P.x > d.x - 120 && Math.abs(P.y - d.y) < 10) { if (P.foes.some(f => !f.dead && f.x > 5200)) P.hintAt('Дверь заблокирована — зачисти этаж!', 2); else { d.open = 1; Sound.play('door'); } }
      if (d.open && P.x > d.x - 30 && !M.leaving) { M.leaving = 1; lv.next(); }
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
    const TW = 645 * 1.3, TH = 360 * 1.3;
    M.drawBack = (c, cx, cy) => {     // дальний план зала: параллакс 0.45 по x, 0.3 по y; стык залов закрыт колонной
      const off = cx * 0.45, i0 = Math.floor(off / TW), oy = -40 - (cy + 60) * 0.3;
      for (let i = i0; i * TW - off < 640; i++) {
        const tw = j => (j * TW + TW / 2 - 320) / 0.45 + 320, wx = tw(i), z = M.zoneAt(wx), v = z[2], im = L9.img[v[((i % v.length) + v.length) % v.length]], x = Math.round(i * TW - off);
        if (!im) continue; c.save(); if (i & 1) { c.translate(x + TW, oy); c.scale(-1, 1); c.drawImage(im, 0, 0, TW, TH); } else c.drawImage(im, x, oy, TW, TH); c.restore();
        const zp = M.zoneAt(tw(i - 1)); if (zp !== z) { for (const dx of [-44, 44]) S(c, 'fgT9', 'pipe', x + dx, 380, 1.5); S(c, 'fgT9', 'pillar', x, 380, 1.5); S(c, 'fgT9', 'pillar', x, 102, 1.5, { flip: 1 }); for (const dx of [-44, 44]) S(c, 'fgT9', 'pipe', x + dx, 102, 1.5, { flip: 1 }); }     // стык залов закрыт колонной во всю высоту
      }
      c.fillStyle = 'rgba(2,6,8,0.25)'; c.fillRect(0, 0, 640, 360);
    };
    M.drawMid = (c, P) => {
      const t = P.t;
      // капсулы-прессы с людьми (цикл: человек -> пресс -> жижа -> слив)
      for (const [x, y] of M.vats) S(c, 'vat9', 'v' + (((t * 2.2 + x * 0.013) | 0) % 8), x, y + 2, 1);
      // конвейер: лента прокруткой + наездники
      for (let x = BELT[0]; x < BELT[1]; x += 84) S(c, 'belt9', 'b' + ((t * 8 | 0) % 4), x + 42, 344, 1);
      for (const r of M.riders) S(c, 'conv9', r.k, r.x, 318, 1);
      // крюки и манипуляторы над лентой
      for (let x = BELT[0] + 120; x < BELT[1]; x += 300) { S(c, 'conv9', 'hook', x + Math.sin(t + x) * 6, 120, 1, { rot: Math.sin(t * 1.5 + x) * 0.08 }); S(c, 'conv9', (t * 1.2 + x | 0) % 2 ? 'arm0' : 'arm1', x + 140, 300, 1); }
      // ямы с жижей
      for (const p of M.pits) for (let x = p[0]; x < p[1]; x += 30) for (let r = 0; r < 3; r++) S(c, 'prop9', 'slime', x + 15 + r * 9, 352 + r * 26 + Math.sin(t * 3 + x + r) * 2, 0.7 + r * 0.15);   // жижа до дна — без голой ямы
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
      // шахта подъёмника: направляющие, дверь
      const L = M.lifts[0]; for (let y = L.y1 - 40; y < 400; y += 58) { S(c, 'plat9', 'column', L.x - 6, y, 1); S(c, 'plat9', 'column', L.x + L.w + 6, y, 1); }
      S(c, 'cover9', M.door.open ? 'doorOpen' : 'door', M.door.x, M.door.y + 2, 1.3);
    };
    M.drawFront = (c, P) => {      // ближний план: тёмные трубы и колонны у нижнего края (параллакс 1.3)
      const k = 1.3, cx = P.cam.x;
      for (let i = Math.floor(cx * 0.3 / 520) - 1; i < Math.floor(cx * 0.3 / 520) + 3; i++) {
        const wx = i * 520 + cx * 1 - cx * 0.3 + 200, h = ((i * 2654435761) >>> 0) % 5;
        S(c, 'fgT9', ['pipe', 'broken', 'crates', 'fence', 'pipe'][h], wx - (cx * 0.3), P.cam.y + 392, 0.7, { a: 0.95 });
      }
    };
    M.drawHud = (c, P) => { if (M.lifts[0].on === 1) G.text('ПОДЪЁМ: ' + Math.round((1 - (M.lifts[0].y - M.lifts[0].y1) / (M.lifts[0].y0 - M.lifts[0].y1)) * 100) + '%', 320, 30, { align: 'center', size: 8, color: '#ffd84a' }); };
    return M;
  };
})();
