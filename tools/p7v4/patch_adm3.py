# -*- coding: utf-8 -*-
# одноразовая правка js/level7v4adm.js под раскладку из 26 комнат (третий отзыв владельца)
import io
p = 'js/level7v4adm.js'
L = io.open(p, encoding='utf-8').read().split('\n')
R = {}   # номер строки (с 1) -> новый текст (None — удалить)

R[9] = "//   4: клетка A | умывальная | пост охраны (спящий, КРАСНАЯ карта, щиток камер) | фотолаборатория | спортзал | [синяя дверь] лифт | радиоузел | архив (вход через окно)"
R[10] = "//   3: клетка A | бойлерная (ВОДОПРОВОД) | медпункт | комната отдыха (спящий) | столовая (двое спина к спине, ЗЕЛЁНАЯ карта) | лифт | бильярдная | клетка B"
R[11] = "//   2: клетка C | галерея (лазеры, СИНЯЯ карта) | касса | бухгалтерия (собака) | серверная (охранник, пульт лазеров) | лифт | класс (на доске мелом — КОД СЕЙФА) | клетка B"
R[12] = "//   1: клетка C | приёмная | музей | гардероб | [красная дверь] кабинет директора (сейф: код -> ЗОЛОТАЯ карта -> ГЛАВАРЬ, бой) [красная дверь] | лифт | вахта (спящий) | холл спец-лифта в зал"
R[13] = "// Порядок: синяя (эт.2) -> синяя дверь (эт.4) -> красная (эт.4) -> по лестнице A в бойлерную -> потоп -> зелёная (эт.3) -> код на доске в классе (эт.2) -> красная дверь (эт.1) -> сейф -> золотая -> бой с главарём -> спец-лифт."
R[19] = "    const f = { mgp: 'mgp.jpg', mgk: 'mgk.jpg', hall: 'afhall.jpg', liftp: 'liftp.jpg', aboss: 'aboss.jpg' };   // hall — фон финального зала (старый ключ был затёрт фоном цеха)"
R[20] = "    for (let i = 1; i <= 4; i++) { f['af' + i] = 'af' + i + '.png'; f['liftd' + i] = 'liftd' + i + '.png'; f['liftc' + i] = 'liftc' + i + '.png'; } f.af1o = 'af1_open.png'; f.af4o = 'af4_open.png';"
R[50] = "    const LOB = [11, 21, 31, 41], LX = LAY.xc, START = X(44, 0.42), SWB = X(43, 0.19), PIPEP = X(32, 0.5), VALVE = X(33, 0.7), BOARD = X(26, 0.49), RADIO = X(48, 0.3), LPAN = X(24, 0.5), LZ = [X(22, 0.08), X(22, 0.62), X(22, 0.93)], SAFE = X(13, 0.86), HLIFT = X(14, 0.77);"
R[52] = "    const SLEEP = [[X(43, 0.62), 3], [X(34, 0.74), 2], [X(16, 0.62), 0]];"
R[53] = "    D.LX = LX; D.KEY = { LOCKER: X(43, 0.335), SWB, PIPEP, VALVE, BOARD, RADIO, LPAN, SAFE, HLIFT, START };"
R[55] = ("    const PR = [['boxes', X(44, 0.22), 3], ['trolley', X(46, 0.5), 3], ['luggage', X(43, 0.92), 3], ['cooler', X(47, 0.85), 3], ['armchair', X(48, 0.78), 3],\n"
         "      ['cooler', X(33, 0.1), 2], ['armchair', X(34, 0.14), 2], ['ficus', LX - 44, 2], ['luggage', X(35, 0.2), 2], ['boxes', X(36, 0.12), 2], ['globe', X(36, 0.9), 2],\n"
         "      ['boxes', X(23, 0.9), 1], ['ficus', X(23, 0.3), 1], ['luggage', X(24, 0.12), 1], ['anchor', X(21, 0.12), 1], ['trolley', X(25, 0.85), 1], ['globe', X(26, 0.1), 1], ['armchair', X(26, 0.9), 1],")
R[56] = "      ['anchor', X(12, 0.1), 0], ['trolley', X(12, 0.92), 0], ['globe', X(13, 0.12), 0], ['armchair', X(13, 0.45), 0], ['luggage', X(14, 0.14), 0], ['boxes', LX + 46, 0], ['anchor', X(17, 0.86), 0], ['ficus', X(16, 0.9), 0], ['cooler', X(15, 0.85), 0]].map(([n, x, f]) => ({ n, x, f, w: (PS[n] || [40, 40])[0], h: (PS[n] || [40, 40])[1] }));"
R[63] = ("      { x: X(23, 0.43), y: T[1], f: 1, a3: 'cab', fr: 0, label: 'в шкаф' }, { x: X(15, 0.36), y: T[0], f: 0, a3: 'pic', fr: 0, label: 'в шубы' },\n"
         "      { x: X(35, 0.78), y: T[2], f: 2, a3: 'cab', fr: 0, label: 'в шкаф' }, { x: X(48, 0.55), y: T[3], f: 3, a3: 'cab', fr: 0, label: 'в шкаф' }, { x: X(17, 0.15), y: T[0], f: 0, a3: 'cab', fr: 0, label: 'в шкаф' },")
R[72] = "      { id: 'ab1', n: 'badge', x: X(43, 0.8), f: 3, hid: 0 }, { id: 'ab2', n: 'badge', x: X(42, 0.3), f: 3 }, { id: 'ab3', n: 'badge', x: X(15, 0.36), f: 0, hid: 3 }, { id: 'ab4', n: 'badge', x: X(17, 0.15), f: 0, hid: 6 },"
R[74] = ("      { id: 'aroll', n: 'roll', x: X(42, 0.72), f: 3, say: 'Туалетка за три рубля! И здесь она. Улика номер два.' },\n"
         "      { id: 'amed', n: 'kefir', x: X(35, 0.45), f: 2, say: 'Кефир в медпункте. Лечит всё, кроме начальства.' }, { id: 'acan2', n: 'can', x: X(36, 0.7), f: 2, say: 'Тушёнка на бильярде. Играли на интерес.' },")
R[85] = ("      egg('aabac', X(23, 0.62), 1, 'Счёты. На них и насчитали туалетку по три рубля.'), egg('aship', X(13, 0.6), 0, 'Модель корабля. Единственное, что тут достроили в срок.'), egg('agym', X(46, 0.72), 3, 'Спортзал начальства. Качают тут в основном бюджет.'),\n"
         "      egg('aphoto', X(47, 0.45), 3, 'Фотолаборатория. Проявляют компромат. В основном — друг на друга.'), egg('aeye', X(35, 0.22), 2, 'Таблица для зрения. Нижняя строка: «премии не будет».'), egg('abill', X(36, 0.5), 2, 'Бильярд. Шары катают — как и рабочих.'),\n"
         "      egg('akassa', X(25, 0.5), 1, 'Касса. Окошко закрыто. Как всегда в день зарплаты.'), egg('amus', X(17, 0.5), 0, 'Музей трудовой славы. Слава есть, труда не видно.'), egg('akeys', X(16, 0.36), 0, 'Доска с ключами. От всего, кроме совести.')];")
R[89] = "      { x: SLEEP[0][0], y: T[3], kind: 'sleep', facing: -1, range: 110, x1: SLEEP[0][0], x2: SLEEP[0][0] },                       // 4: спит на стуле у мониторов"
R[90] = "      { x: X(46, 0.5), y: T[3], x1: X(47, 0.25), x2: X(46, 0.86), facing: 1, range: 115, sp: 30 },                         // 4: фотолаборатория — спортзал"
R[91] = ("      { x: SLEEP[1][0], y: T[2], kind: 'sleep', facing: -1, range: 110, x1: SLEEP[1][0], x2: SLEEP[1][0] },                       // 3: спит перед телевизором\n"
         "      { x: SLEEP[2][0], y: T[0], kind: 'sleep', facing: -1, range: 100, x1: SLEEP[2][0], x2: SLEEP[2][0] },                       // 1: вахтёр спит на вахте\n"
         "      { x: X(36, 0.5), y: T[2], x1: X(36, 0.16), x2: X(36, 0.84), facing: 1, range: 110, sp: 28 },                          // 3: бильярдная\n"
         "      { x: X(26, 0.7), y: T[1], x1: X(26, 0.2), x2: X(26, 0.82), facing: -1, range: 110, sp: 26 },                         // 2: класс с доской")
R[96] = "      { x: X(12, 0.5), y: T[0], x1: X(12, 0.2), x2: X(17, 0.8), facing: 1, range: 115, sp: 32 },                          // 1: приёмная — музей"
R[100] = "    D.cams = [cam(42, 0.5, { per: 5, range: 140 }), cam(34, 0.3), cam(25, 0.5, { per: 7 }), cam(15, 0.5), cam(14, 0.45, { per: 5 }), cam(35, 0.5, { per: 8, range: 140 })];"
R[112] = ("      { const lf = r.lift; if (lf) { const f = lf.ph < 3 ? lf.from : lf.to, q = LAY.lift[f], Im2 = I(), cab = Im2['liftc' + (f + 1)], dr = Im2['liftd' + (f + 1)], x = q[0] - cx, y = T[f] - TOP + q[1], w = q[2], h = q[3], k = lf.k;   // лифт: кабина и раздвижные створки\n"
          "        if (lf.ph !== 3) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); if (cab) c.drawImage(cab, x, y, w, h); else { c.fillStyle = '#2a1a10'; c.fillRect(x, y, w, h); }\n"
          "          if (dr) { const dw = dr.width / 2; c.drawImage(dr, 0, 0, dw, dr.height, x - k * w / 2, y, w / 2, h); c.drawImage(dr, dw, 0, dw, dr.height, x + w / 2 + k * w / 2, y, w / 2, h); } c.restore(); } } }")
R[146] = "    const WESTF = (r, f) => f === 3 && !r.flags.door_b ? X(41, 0) + 22 : f === 0 && !r.flags.door_r ? X(13, 1) + 22 : 236, EAST = f => f === 0 ? X(14, 1) - 28 : f === 3 ? X(44, 1) - 28 : X(f === 1 ? 26 : 36, 1) - 12;"
R[149] = "      if (this.state === 'catch' || this.mode === 'scene') return;"
R[152] = "        if (this.rideT <= 0) { let f = Math.random() < 0.6 ? pf : U.randi(0, 3); if (f === this.lastF && Math.random() < 0.7) f = (f + 1 + U.randi(0, 2)) % 4; if (this.forceF != null) { f = this.forceF; this.forceF = null; }"
R[153] = "          if ((pf === f && Math.abs(pl.x - LX) < 250 && !(pl.seq && pl.seq.phase === 'hid')) || r.lift) { this.rideT = 1.5; return; }   // не выходит из лифта прямо на Валеру"
R[162] = "      if (pf === this.f) { this.stepT -= dt; if (this.stepT <= 0) { this.stepT = 0.3; const d = Math.abs(pl.x - this.x); if (d < 520) { Sound.play('land'); if (d < 300) G.shake(0.6, 0.06); } } }"
R[163] = "      if (Math.abs(this.x - tx) < 2) { if (this.mode === 'sweep') { this.legs.shift(); this.mode = 'look'; this.t = 1.2; } else { this.mode = 'ride'; this.rideT = U.rand(3.5, 6); if (pf === this.f) Sound.play('door'); } }"
R[165] = "    const BSC = 169 / 177, chiefDraw = function (c, cx, cy) { if (this.y < -1000) return; Spr.drawAnim(c, 'boss4', this.anim, this.animT, this.x - cx, this.y - cy, this.facing, { scale: BSC });   // ростом как рядовые (кадры boss4 выше кадров cmd4)"
R[166] = "      if (this.see > 0.05 || this.mark > 0) G.text(this.see > 0.6 ? '!' : '?', this.x - cx, this.y - cy - 100, { align: 'center', size: 16, color: this.see > 0.6 ? '#ff4030' : '#ffd84a', outline: true }); };"
R[167] = "    const addChief = r => { if (r.guards.some(g => g.chief)) return; const g = new L7.Guard({ x: LX, y: -5000, range: 190, sp: 98 });"
R[168] = "      Object.assign(g, { chief: true, id: 'chief', cmd4: true, mode: 'ride', rideT: 6, stepT: 0, lastF: -1, headH: 92, voice: 110, update: chiefUpd, draw: chiefDraw, hear: () => {}, ko: () => {}, sees: function (run, pl) { return this.mode === 'out' || this.mode === 'ride' || this.mode === 'scene' || run.lift ? 0 : L7.Guard.prototype.sees.call(this, run, pl); } });"
R[169] = "      r.guards.push(g); };"
R[176] = "      r.storm.update(dt, false); if (r.stairT > 0) r.stairT -= dt; if (r.chiefSayT > 0) r.chiefSayT -= dt; if (r.radioT > 0) r.radioT -= dt; if (r.flags.flood) r.floodT = (r.floodT || 0) + dt; liftUpd(dt, r);"
R[177] = "      if (r.flags.chief && !r.flags.bossDone && !r.level.scene) addChief(r);"
R[181] = "        if (!r.flags.note && f === 1 && Math.abs(pl.x - BOARD) < 30) { r.flags.note = 1; save(r); Sound.play('coin'); G.say(pl, 'На доске мелом: «СЕЙФ 3719». Кто-то очень боялся забыть. Запомню.', 3.2); }"
R[203] = "      r.flags.chairs = SLEEP.map(s => [s[0], s[1]]); r.code = '3719'; r.lift = null; r.hidePlayer = false; r.camLock = false;   // код сейфа нарисован мелом на доске в классе (эт.2)"
R[206] = ("      r.drawMenu = function (c) { const m = this.menu, im = I().liftp; if (!m.lift || !im) return V4.Run.prototype.drawMenu.call(this, c);   // панель лифта — картинка из Flow, подсвечивается выбранная кнопка\n"
          "        const k = 300 / im.height, pw = im.width * k, px = (W - pw) / 2, py = 30, BY = [133, 241, 351, 462]; c.fillStyle = 'rgba(0,0,0,0.62)'; c.fillRect(0, 0, W, H); c.drawImage(im, px, py, pw, 300);\n"
          "        c.save(); c.globalCompositeOperation = 'lighter'; m.items.forEach((it, i) => { const x = px + 400 * k, y = py + BY[i] * k; if (i === m.sel) { glow(c, x, y, 46, '255,190,70', 0.55 + 0.25 * Math.sin(G.t * 7)); glow(c, x, y, 20, '255,240,190', 0.5); } else if (it.cur) glow(c, x, y, 26, '70,255,110', 0.35); }); c.restore();\n"
          "        const it = m.items[m.sel]; G.text(it.cur ? 'ЭТАЖ ' + (it.n + 1) + ' — ВЫ ЗДЕСЬ' : 'ЭТАЖ ' + (it.n + 1), W / 2, 12, { align: 'center', size: 8, color: '#ffd84a' }); G.text(Game.fmtHint('{up}/{down}, {jump} — ехать, {throw} — выйти'), W / 2, H - 14, { align: 'center', size: 8, color: '#b8b0a0' }); };\n"
          + L[205])
R[224] = ("    // ---------- лифт: створки расходятся, Валера заходит, камера едет по шахте на нужный этаж, створки открываются (без перезагрузки карты) ----------\n"
          "    const ride = (r, to) => { if (r.level.scene || r.lift) return; const pl = r.player; pl.controls = false; pl.vx = 0; pl.crouch = false; pl.auto = null; r.lift = { ph: 0, t: 0, k: 0, from: floorOf(pl.y), to }; Sound.play('door'); };\n"
          "    const liftUpd = (dt, r) => { const lf = r.lift; if (!lf) return; const pl = r.player, wd = r.world; lf.t += dt; pl.vx = 0; pl.controls = false;\n"
          "      if (r.caught) { r.lift = null; r.hidePlayer = false; r.camLock = false; return; }\n"
          "      const next = () => { lf.ph++; lf.t = 0; }, ease = k => k * k * (3 - 2 * k);\n"
          "      if (lf.ph === 0) { lf.k = Math.min(1, lf.t / 0.5); pl.x = U.approach(pl.x, LX, 70 * dt); pl.facing = 1; if (lf.t > 0.55) next(); }\n"
          "      else if (lf.ph === 1) { pl.x = LX; if (lf.t > 0.25) { r.hidePlayer = true; next(); } }\n"
          "      else if (lf.ph === 2) { lf.k = 1 - Math.min(1, lf.t / 0.45); r.susp = 0; if (lf.t > 0.5) { r.camLock = true; lf.y0 = wd.cam.y; lf.y1 = U.clamp(T[lf.to] - 236, D.topY, 0); lf.x0 = wd.cam.x; lf.dur = 0.5 + 0.55 * Math.abs(lf.to - lf.from); Sound.play('lever'); next(); } }\n"
          "      else if (lf.ph === 3) { const k = ease(Math.min(1, lf.t / lf.dur)); wd.cam.y = lf.y0 + (lf.y1 - lf.y0) * k; wd.cam.x = lf.x0 + (U.clamp(LX - W / 2, 0, D.w - W) - lf.x0) * k; r.susp = 0;\n"
          "        lf.hum = (lf.hum || 0) - dt; if (lf.hum <= 0) { lf.hum = 0.5; Sound.play('land'); }\n"
          "        if (lf.t >= lf.dur) { pl.x = LX; pl.y = T[lf.to]; pl.vy = 0; pl.onGround = true; r.prevX = null; Sound.play('bell'); next(); } }\n"
          "      else if (lf.ph === 4) { lf.k = Math.min(1, lf.t / 0.5); r.susp = 0; if (lf.t > 0.55) { r.hidePlayer = false; r.camLock = false; pl.facing = 1; next(); } }\n"
          "      else if (lf.ph === 5) { if (lf.t > 0.3) { pl.controls = true; next(); } }\n"
          "      else { pl.controls = !r.level.scene && !r.menu && !r.mg; lf.k = 1 - Math.min(1, lf.t / 0.45); if (lf.t > 0.5) { r.lift = null; Sound.play('door'); } } };")
R[225] = None
R[226] = "    const liftMenu = r => { if (r.lift) return; const cur = floorOf(r.player.y); Sound.play('bell');"
R[227] = "      r.openMenu('ЛИФТ', [3, 2, 1, 0].map(n => ({ label: 'Этаж ' + (n + 1) + (n === cur ? ' (вы здесь)' : ''), n, cur: n === cur })), it => { if (it.n !== cur) ride(r, it.n); }); r.menu.lift = true; r.menu.sel = 3 - cur; };"
R[234] = "      ...LOB.map((n, f) => ({ x: LX, y: T[f], r: 22, label: 'лифт', cond: r => !r.lift, act: liftMenu })),"
R[240] = ("      { x: RADIO, y: T[3], r: 20, label: 'радиоузел', cond: r => !!r.flags.chief && !r.flags.bossDone, act: r => { const ch = r.guards.find(g => g.chief), pf = floorOf(r.player.y);\n"
          "        if (r.radioT > 0 || !ch) { G.say(r.player, 'Передатчик ещё греется. Лампы старые.', 1.8); return; } r.radioT = 30; const f = pf >= 2 ? 0 : 3; ch.forceF = f; if (ch.mode !== 'ride') { ch.mode = 'back'; } else ch.rideT = Math.min(ch.rideT, 1.5);\n"
          "        Sound.play('warn'); G.say({ x: r.player.x, y: r.player.y - 150, headH: 0, voice: 170 }, 'ГРОМКАЯ СВЯЗЬ: «Главного просят срочно пройти на этаж ' + (f + 1) + '!»', 3, { shout: true }); G.say(r.player, 'Пусть побегает. Радио — великая сила.', 2.4); } },\n"
          "      { x: SAFE, y: T[0], r: 20, label: 'сейф', cond: r => !has(r, 'y') && !alive(r, 0, X(13, 0), X(13, 1)), act: r => {")
R[241] = "        if (!r.flags.note) G.say(r.player, 'Кодовый замок. Код где-то написан — начальство вечно забывает...', 2.2);"
R[242] = "        r.player.setAnim('panel4'); r.startMG('code', ok => { if (ok) { Sound.play('door'); giveCard(r, 'y', SAFE, T[0]); r.level.playOnMap(bossCall(r)); } }); } },"
R[243] = "      { x: HLIFT, y: T[0], r: 22, label: 'лифт в зал', act: r => { const n = ncards(r); if (n < 4) { G.say(r.player, 'Лифт в главный зал. Нужны все четыре ключ-карты — у меня ' + n + '.', 2.4); Sound.play('warn'); return; } if (!r.flags.bossDone) { r.level.playOnMap(bossCall(r)); return; } r.level.toHall(r); } },"
R[246] = ("    // сейф открыт — главарь находит Валеру: катсцена и бой в зале совещаний (карта FB)\n"
          "    const say4 = (who, text, actor, auto = 2.4) => Scene.say(who, text, actor, { auto });\n"
          "    const bossCall = r => function* () { const pl = r.player; addChief(r); const ch = r.guards.find(g => g.chief); r.camLock = false; pl.controls = false; pl.vx = 0;\n"
          "      yield 0.9; G.say(pl, 'Золотая карта директора! Теперь — к лифту в главный зал.', 2.2); yield 1.6;\n"
          "      Sound.play('door'); G.shake(3, 0.25); ch.mode = 'scene'; ch.state = 'patrol'; ch.see = 0; ch.x = pl.x < X(13, 0.5) ? X(13, 1) - 14 : X(13, 0) + 14; ch.y = T[0]; ch.f = 0; ch.facing = Math.sign(pl.x - ch.x) || 1; ch.anim = 'run'; pl.facing = -ch.facing; r.susp = 0;\n"
          "      const tx = pl.x - ch.facing * 86; while (Math.abs(ch.x - tx) > 3) { ch.x = U.approach(ch.x, tx, 190 * (G.dt || 1 / 60)); ch.animT += G.dt || 1 / 60; yield 0.001; }\n"
          "      ch.anim = 'point'; yield* say4('cmdr7', 'Вот ты где, Мистер Рэд. Весь завод из-за тебя на ушах.', ch, 2.6);\n"
          "      yield* say4('valera', 'Главный... А я как раз закончил. Сейф у вас — одно название.', pl, 2.6);\n"
          "      ch.anim = 'laugh'; yield* say4('cmdr7', 'Карту — на стол. Или пройдём в зал совещаний: там просторнее, есть где тебя размазать.', ch, 3.2);\n"
          "      yield* say4('valera', 'Я стропальщик шестого разряда. Я и тебя застроплю!', pl, 2.4);\n"
          "      ch.anim = 'taunt'; yield 0.5; r.flags.bossGo = 1; save(r); r.go('FB', 110, 'Зал совещаний', 1); };\n"
          "    D.hints = [];")

out = []
for i, s in enumerate(L, 1):
    if i in R:
        if R[i] is not None: out.append(R[i])
    else: out.append(s)
s = '\n'.join(out)

# бой с главарём: арена FB (фон из Flow), усиленный босс
BOSS = r'''
  // ---------- БОЙ С ГЛАВАРЁМ (карта FB, фон assets/l7v4/aboss.jpg): очень живучий, очень быстрый, почти не оглушается ----------
  const BSC = 169 / 177;   // ростом как рядовые спецназовцы
  V4.Chief = class extends V4.Boss {
    constructor(x, run) { super(x, run); this.hp = this.max = 22; this.table = { x1: 214, x2: 426, y: V4.GY - 42 }; this.row = 0; }
    get box() { return { x: this.x - 13, y: this.y - 78, w: 26, h: 78 }; }
    update(dt, run) { const pl = run.player;
      if (this.state === 'escape') { this.set('roll'); this.rollDir = Math.sign(this.x - pl.x) || 1; if (this.ammo <= 0) this.ammo = 4; this.row = 0; if (Math.random() < 0.5) G.say(this, U.choice(['Не дождёшься!', 'Хватит с тебя!', 'Дважды — и хватит!']), 0.9); }
      if (!this.vuln) this.row = 0;
      super.update(dt * (this.vuln ? 1.2 : this.hp <= this.max / 2 ? 1.85 : 1.6), run); }   // всё делает быстрее; во второй половине боя — ещё быстрее
    playerHit(hb, dmg, atk, pl) { const hp0 = this.hp; super.playerHit(hb, dmg, atk, pl);
      if (this.hp < hp0 && this.state === 'hurt') { this.row++; if (this.combo >= 3 && Math.random() > 0.08) this.combo = 0;   // оглушить почти нереально
        if (this.row >= 3) { this.row = 0; this.after = 'escape'; } } }
    draw(c, cx) { const d0 = Spr.drawAnim; Spr.drawAnim = (c2, sh, an, t, x, y, f, o) => d0.call(Spr, c2, sh, an, t, x, y, f, sh === 'boss4' ? Object.assign({ scale: BSC }, o) : o); try { super.draw(c, cx); } finally { Spr.drawAnim = d0; } }
  };
  const say4 = (who, text, actor, auto = 2.4) => Scene.say(who, text, actor, { auto });
  V4.MAPS.FB = run => ({
    w: W, minX: 16, maxX: W - 16, music: false, suspK: 0, dark: 0, ints: [], hints: [], plats: [{ x: 214, y: V4.GY - 42, w: 212, h: 8 }],
    bgFn: (c, cx, r) => { const im = V4.img.aboss; if (im) c.drawImage(im, 0, 0, W, H); },
    onLoad: r => { const pl = r.player; r.arrow = null; r.lift = null; r.hidePlayer = false; r.camLock = false; r.cp = { id: 'FB', x: 110, face: 1 }; r.saved = { flags: Object.assign({}, r.flags), ko: new Set(r.ko) };
      if (r.flags.bossDone) { r.boss = null; return; } r.boss = new V4.Chief(500, r); r.bossWon = false;
      if (r.level.chiefSeen) { r.boss.set('idle'); Music.play('boss'); r.bossHint = 5; } else { r.level.chiefSeen = true; r.level.playOnMap(function* () { const b = r.boss; r.camLock = true; pl.facing = 1; b.set('wait', 'stand'); b.facing = -1; yield 0.7;
        yield* say4('cmdr7', 'Двери заперты. Отсюда выйдет один. И это буду я.', b, 2.6); b.set('wait', 'taunt'); yield 0.6; G.hint = null; b.set('idle'); Music.play('boss'); r.bossHint = 7; }); } },
    update: (dt, r) => { const b = r.boss; if (b && b.state === 'ko' && !r.level.scene && !r.bossWon) { r.bossWon = true; r.level.playOnMap(function* () { const pl = r.player; r.camLock = true; b.bullets = []; b.nades = []; b.smokes = []; yield 1.0;
        yield* say4('cmdr7', 'Ох... Кто ж знал, что стропальщики... так бьют...', b, 2.6); yield* say4('valera', 'Отдыхай, Главный. Мне ещё в главный зал — на собрание.', pl, 2.6);
        r.flags.bossDone = 1; r.flags.fAt = 0; Music.play('stealth'); r.go('F', window.V4_LAYF.xc - 120, 'Этаж 1', 1); }); }
      if (r.bossHint > 0) { r.bossHint -= dt; r.hint = 'Бей, когда перезаряжается или ест! Пули: {down} — пригнись, {jump} — прыгай'; r.hintA = 1; } },
  });
'''
a = s.index("  // ---------- мини-игры: «водопровод»")
s = s[:a] + BOSS.lstrip('\n') + '\n' + s[a:]
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok', len(s))
