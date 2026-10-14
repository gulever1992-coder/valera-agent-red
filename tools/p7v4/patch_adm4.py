# -*- coding: utf-8 -*-
import io, re
p = 'js/level7v4adm.js'; s = io.open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    assert s.count(a) >= 1, a[:60]
    s = s.replace(a, b) if n == 0 else s.replace(a, b, n)
# 1. шкафы-укрытия убраны (остались только шубы в гардеробе); на их месте — невысокие предметы, за которыми прячутся приседом
a = s.index("    D.hides = ["); b = s.index("    ];", a) + 6
s = s[:a] + "    D.hides = [{ x: X(15, 0.36), y: T[0], f: 0, a3: 'pic', fr: 0, label: 'в шубы' }];   // шкафов-укрытий на уровне нет (слишком громоздкие) — только шубы в гардеробе\n" + s[b + 1:]
rep("{ id: 'ab1', n: 'badge', x: X(43, 0.8), f: 3, hid: 0 }", "{ id: 'ab1', n: 'badge', x: X(43, 0.8), f: 3 }")
rep("{ id: 'ab3', n: 'badge', x: X(15, 0.36), f: 0, hid: 3 }", "{ id: 'ab3', n: 'badge', x: X(15, 0.36), f: 0, hid: 0 }")
rep("{ id: 'ab4', n: 'badge', x: X(17, 0.15), f: 0, hid: 6 }", "{ id: 'ab4', n: 'badge', x: X(17, 0.2), f: 0 }")
rep("['cooler', X(47, 0.85), 3], ['armchair', X(48, 0.78), 3],", "['cooler', X(47, 0.85), 3], ['armchair', X(48, 0.78), 3], ['boxes', X(43, 0.5), 3], ['ficus', X(42, 0.5), 3],")
rep("['boxes', X(36, 0.12), 2], ['globe', X(36, 0.9), 2],", "['boxes', X(36, 0.12), 2], ['globe', X(36, 0.9), 2], ['trolley', X(33, 0.42), 2], ['armchair', X(35, 0.75), 2], ['anchor', X(32, 0.85), 2],")
rep("['trolley', X(25, 0.85), 1], ['globe', X(26, 0.1), 1], ['armchair', X(26, 0.9), 1],", "['trolley', X(25, 0.85), 1], ['globe', X(26, 0.3), 1], ['boxes', X(23, 0.5), 1], ['cooler', X(24, 0.85), 1],")
rep("['ficus', X(16, 0.9), 0], ['cooler', X(15, 0.85), 0]]", "['ficus', X(16, 0.9), 0], ['cooler', X(15, 0.85), 0], ['ficus', X(17, 0.2), 0], ['boxes', X(12, 0.5), 0]]")
# 2. доска: только цифры
rep("'На доске мелом: «СЕЙФ 3719». Кто-то очень боялся забыть. Запомню.'", "'На доске мелом — четыре цифры: 3719. Похоже на чей-то код. Запомню.'")
# 3. главарь ищет быстрее и чаще приходит на этаж Валеры
rep("let f = Math.random() < 0.6 ? pf : U.randi(0, 3);", "let f = Math.random() < 0.8 ? pf : U.randi(0, 3);")
rep("this.mode = 'look'; this.t = 1.2; }", "this.mode = 'look'; this.t = 0.8; }")
rep("this.rideT = U.rand(3.5, 6);", "this.rideT = U.rand(1.4, 2.6);")
rep("mode: 'ride', rideT: 6,", "mode: 'ride', rideT: 3,")
rep("this.mode = 'out'; this.t = 1.1;", "this.mode = 'out'; this.t = 0.7;")
# 4. лифт: Валера заходит в кабину (уменьшается, уходит вглубь), створки закрываются перед ним; на этаже — выходит
a = s.index("      { const lf = r.lift; if (lf) {"); b = s.index("c.restore(); } } }", a) + len("c.restore(); } } }")
s = s[:a] + ("      { const lf = r.lift; if (lf && lf.ph !== 3) { const f = lf.ph < 3 ? lf.from : lf.to, q = LAY.lift[f], Im2 = I(), cab = Im2['liftc' + (f + 1)], dr = Im2['liftd' + (f + 1)], x = q[0] - cx, y = T[f] - TOP + q[1], w = q[2], h = q[3], k = lf.k, pl = r.player;   // лифт: кабина, Валера в кабине, раздвижные створки\n"
  "        if (cab) c.drawImage(cab, x, y, w, h); else { c.fillStyle = '#2a1a10'; c.fillRect(x, y, w, h); }\n"
  "        if (lf.pk != null && r.hidePlayer) { const sc = 1 - 0.2 * lf.pk, px = pl.x - cx, py = T[f]; c.save(); c.translate(px, py - lf.pk * (TOP - q[1] - q[3] + 1)); c.scale(sc, sc); c.translate(-px, -py); pl.draw(c, cx, 0); c.restore(); }\n"
  "        if (dr) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); const dw = dr.width / 2; c.drawImage(dr, 0, 0, dw, dr.height, x - k * w / 2, y, w / 2, h); c.drawImage(dr, dw, 0, dw, dr.height, x + w / 2 + k * w / 2, y, w / 2, h); c.restore(); } } }") + s[b:]
a = s.index("      if (lf.ph === 0) { lf.k = Math.min(1, lf.t / 0.5);"); b = s.index("if (lf.t > 0.5) { r.lift = null; Sound.play('door'); } } };", a)
s = s[:a] + ("      const walk = () => { pl.setAnim('walk'); pl.animT += dt; };\n"
  "      if (lf.ph === 0) { lf.k = Math.min(1, lf.t / 0.5); if (Math.abs(pl.x - LX) > 1) { pl.facing = Math.sign(LX - pl.x); pl.x = U.approach(pl.x, LX, 70 * dt); walk(); } else pl.setAnim('stand'); if (lf.t > 0.55 && Math.abs(pl.x - LX) <= 1) { r.hidePlayer = true; lf.pk = 0; next(); } }\n"
  "      else if (lf.ph === 1) { pl.x = LX; lf.pk = Math.min(1, lf.t / 0.6); walk(); if (lf.t > 0.6) { pl.setAnim('stand'); pl.facing = 1; next(); } }   // заходит в кабину\n"
  "      else if (lf.ph === 2) { lf.k = 1 - Math.min(1, lf.t / 0.45); r.susp = 0; if (lf.t > 0.5) { r.camLock = true; lf.y0 = wd.cam.y; lf.y1 = U.clamp(T[lf.to] - 236, D.topY, 0); lf.x0 = wd.cam.x; lf.dur = 0.5 + 0.55 * Math.abs(lf.to - lf.from); Sound.play('lever'); next(); } }\n"
  "      else if (lf.ph === 3) { const k = ease(Math.min(1, lf.t / lf.dur)); wd.cam.y = lf.y0 + (lf.y1 - lf.y0) * k; wd.cam.x = lf.x0 + (U.clamp(LX - W / 2, 0, D.w - W) - lf.x0) * k; r.susp = 0;\n"
  "        lf.hum = (lf.hum || 0) - dt; if (lf.hum <= 0) { lf.hum = 0.5; Sound.play('land'); }\n"
  "        if (lf.t >= lf.dur) { pl.x = LX; pl.y = T[lf.to]; pl.vy = 0; pl.onGround = true; r.prevX = null; Sound.play('bell'); next(); } }\n"
  "      else if (lf.ph === 4) { lf.k = Math.min(1, lf.t / 0.5); r.susp = 0; if (lf.t > 0.55) { r.camLock = false; next(); } }\n"
  "      else if (lf.ph === 5) { lf.pk = 1 - Math.min(1, lf.t / 0.5); walk(); if (lf.t > 0.5) { r.hidePlayer = false; lf.pk = null; pl.setAnim('stand'); pl.controls = true; next(); } }   // выходит из кабины\n"
  "      else { pl.controls = !r.level.scene && !r.menu && !r.mg; lf.k = 1 - Math.min(1, lf.t / 0.45); ") + s[b:]
io.open(p, 'w', encoding='utf-8', newline='\n').write(s); print('ok')
