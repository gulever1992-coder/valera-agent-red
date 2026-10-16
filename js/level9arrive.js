// Уровень 9, часть B «ПРИБЫТИЕ» — катсцена на движке: капсула вылетает из тоннеля, тормозит у отбойника причала,
// Валера встаёт, перелезает через борт, спрыгивает, оглядывается; на мониторе включается Икс («яйцо или курица»),
// ворота лаборатории открываются, Валера бежит внутрь. Фон — кадр Flow (dock9), всё остальное — спрайты.
(() => {
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd;
  const FY = 304;                         // линия пола перрона
  const STOP = 150;                       // где капсула встаёт (нос у отбойника)
  const TV = [362, 106];                  // монитор на стене
  const GATE = [560, 300];                // круглые ворота
  WHO.mrx = WHO.mrx || { name: 'ГОСПОДИН ИКС', color: '#ff4040', voice: 90 };

  const P = L9.PARTS.arrive = {
    noHud: true,
    start(lv) {
      Object.assign(P, { lv, hp: 100, inv: 0, t: 0, cap: { x: -220, fr: 'brake', a: 1, bob: 1 }, v: null, tv: 'off', gate: 0, smoke: [], spark: 0, shake: 0 });
      for (let i = 0; i < 9; i++) P.smoke.push({ x: rnd(0, 640), y: rnd(FY - 60, FY + 20), s: rnd(0.6, 1.1), v: rnd(4, 12), f: i % 2 });
      try { Music.play('alarm'); } catch (e) {}
      Scene.dialogTop = true;
      Scene.run(P.script, () => lv.next());
    },
    *script() {
      const c = P.cap; Sound.play('crane');
      // 1. капсула вылетает из тоннеля и тормозит об магнитную полосу (искры)
      while (c.x < STOP - 4) { const d = STOP - c.x; c.x += Math.max(40, d * 2.6) * 0.016; P.spark = d > 30 ? 1 : 0; if ((P.t * 20 | 0) % 3 === 0 && d > 30) Sound.play('grind', 0.4); yield 0.016; }
      c.x = STOP; P.spark = 0; c.fr = 'open'; P.shake = 0.25; Sound.play('clank'); yield 0.7;
      // 2. крышка открыта: садится, снимает автомат с мехруки, встаёт
      c.fr = 'sit'; Sound.play('door'); yield 0.8;
      c.fr = 'stand'; yield 0.6;
      // 3. спрыгивает на перрон справа от капсулы
      c.fr = 'off'; c.bob = 0; Sound.play('jump');
      const v = P.v = { x: c.x + 40, y: FY - 30, vy: -160, fr: 'rise', sh: 'vJump9', dir: 1 };
      while (v.vy < 0 || v.y < FY) { v.vy += 900 * 0.016; v.x += 70 * 0.016; v.y = Math.min(FY, v.y + v.vy * 0.016); v.fr = v.vy < -40 ? 'rise' : 'fallDiag'; yield 0.016; }
      v.sh = 'vJump9'; v.fr = 'land'; Sound.play('land'); yield 0.25;
      v.sh = 'vAim9'; v.fr = 'stand'; yield 0.5;
      // 4. оглядывается: влево на тоннель, вправо на ворота
      v.dir = -1; yield 0.7; v.dir = 1; yield 0.4;
      yield* Scene.say('valera', 'Так вот где ты прячешься, Икс... Подземная лаборатория прямо под Выборгском.', null);
      // 5. монитор: помехи -> силуэт Икса
      P.tv = 'noise'; Sound.play('zap'); yield 0.8; P.tv = 'x';
      yield* Scene.say('mrx', 'Что было раньше — яйцо или курица? Вы не знаете ответа! Стакан наполовину пуст или наполовину полон? Только я знаю!', null);
      yield* Scene.say('valera', 'Знаю только, что мой автомат наполовину полон. Иду к тебе.', null);
      P.tv = 'noise'; yield 0.4; P.tv = 'off'; c.fr = 'closing'; Sound.play('door'); yield 0.5; c.fr = 'closed';
      // 6. ворота открываются, Валера бежит внутрь
      Sound.play('door'); P.shake = 0.4;
      while (P.gate < 1) { P.gate = Math.min(1, P.gate + 0.016 / 1.4); yield 0.016; }
      v.sh = 'vRun9';
      while (v.x < GATE[0] + 10) { v.x += 150 * 0.016; v.fr = 'r' + ((P.t * 12 | 0) % 8); yield 0.016; }
      v.gone = 1; yield 0.5;
    },
    cutUpdate(lv, dt) {
      P.t += dt; P.shake = Math.max(0, P.shake - dt);
      for (const s of P.smoke) { s.x -= s.v * dt; if (s.x < -80) { s.x = 700; s.y = rnd(FY - 60, FY + 20); } }
    },
    update(lv, dt) { if (!Scene.active) lv.next(); },
    draw(lv, c) {
      const sh = P.shake > 0 ? rnd(-2, 2) : 0;
      c.save(); c.translate(sh, sh * 0.5);
      const bg = L9.img.dock9; if (bg) c.drawImage(bg, -4, -4, 648, 368);
      // монитор: Икс поверх экрана
      if (P.tv !== 'off') S(c, 'tv9', P.tv === 'noise' ? 'noise' : 'x' + ((P.t * 6 | 0) % 4), TV[0], TV[1], 1.25);
      // ворота открываются: проём темнеет, створка уходит вверх (свет из лаборатории)
      if (P.gate > 0) S(c, 'fxA9', 'flash', GATE[0], GATE[1] - 60, 1.6 * P.gate, { add: 1, a: 0.5 * P.gate });
      for (const s of P.smoke) if (s.f) S(c, 'fxL9', 'smoke', s.x, s.y, s.s, { add: 1, a: 0.35 });
      const cp = P.cap, bob = cp.bob ? Math.sin(P.t * 8) * 1.5 : 0;
      S(c, 'props8', 'shadow', cp.x, FY + 2, 0.9, { a: 0.5 });
      if (P.spark) { S(c, 'fxA9', 'spark', cp.x + 50 + rnd(-6, 6), FY - 4, 0.9 + rnd(0, 0.4), { add: 1 }); S(c, 'fxL9', 'spark', cp.x + 20, FY - 2, 0.7, { add: 1 }); }
      S(c, 'capOut9b', cp.fr, cp.x, FY + bob, 0.9);   // 0.9 — рост Валеры в капсуле = рост снаружи
      const v = P.v; if (v && !v.gone) { S(c, 'props8', 'shadow', v.x, FY + 1, 0.35, { a: 0.5 }); S(c, v.sh, v.fr, v.x, v.y, 1, { flip: v.dir < 0 }); }
      for (const s of P.smoke) if (!s.f) S(c, 'fxL9', 'smoke2', s.x, s.y + 20, s.s * 1.2, { add: 1, a: 0.3 });
      c.restore();
      if (P.gate >= 1 && P.v && P.v.gone) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 0, 640, 360); }
    },
  };
})();
