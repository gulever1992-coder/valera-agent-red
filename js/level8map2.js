// Уровень 8: локации B–E (закулисье с щитовиком, кран Наташки, техпомещение, темнота).
(() => {
  const { Zombie, Rifle, Grenadier, Trooper, Shield, rnd, clamp, zy, zs } = L8.K;
  const pan = n => window.L8D._bg[n].w / 2;

  // ---------------------------------------------------------------- B. Закулисье
  L8.STAGES.back = {
    bg: 'back', title: 'ЗАКУЛИСЬЕ', trickle: 3.4, fgSheet: 'fgBack8',
    skins: ['zombE1', 'zombA0', 'zombC1', 'zombE1', 'zombD0', 'zombB1', 'zombC0'],
    fg: () => [['cases', 420, 60], ['drum', 760, 30], ['bags', 1120, 40], ['spot', 1480, 70], ['throne', 1820, 80], ['rack', 2200, 90], ['manneq', 2500, 80], ['cases', 2840, 60]],
    build(lv) {
      const m = L8.mk(lv), CAT = { fy: 78, fs: 0.4 };          // мостик над сценой
      const cat = x => () => lv.foes.push(new Rifle(lv, x, Object.assign({ from: lv.cam + 690, wait: 0.5 }, CAT)));
      m.prop('sandbag', 250, { y: 82, hp: 2, fallZ: 0.3 }); m.prop('lights', 505, { y: 80, hp: 3, fallZ: 0.25 }); m.prop('sandbag', 742, { y: 82, hp: 2, fallZ: 0.35 }); m.prop('lights', 905, { y: 80, hp: 3, fallZ: 0.3 });
      const c1 = m.prop('case', 318, { z: 0.36, hp: 10, drop: 'mag' }), c2 = m.prop('case', 655, { z: 0.27, hp: 10, drop: 'vog' }), f1 = m.prop('flat', 470, { z: 0.18, hp: 8, drop: 'kefir' }), f2 = m.prop('flat', 840, { z: 0.32, hp: 8, drop: 'mag' });
      return [
        [1.0, m.zomb(1, 0.25, 2)], [3.0, cat(300)], [5.0, m.zomb(-1, 0.3, 2)], [7.0, m.behind(c1, 0.4)], [9.0, m.troop(1, 480)],
        [11.0, m.zomb(1, 0.2, 3)], [13.0, m.gren(1e4, 0, { z: 0.06, rel: 520 })], [16.0, cat(560)], [18.0, m.zomb(-1, 0.35, 2)], [20.0, m.behind(f1, 0.3)],
        [22.0, m.troop(-1, 160)], [25.0, m.zomb(1, 0.25, 4)], [28.0, cat(690)], [30.0, m.behind(c2, 0.3)], [31.5, m.gren(1e4, 0, { z: 0.1, rel: 470 })],
        [34.0, m.zomb(-1, 0.3, 3)], [36.5, m.troop(1, 430)], [39.0, cat(850)], [40.0, m.behind(f2, 0.3)], [42.0, m.zomb(1, 0.25, 4)],
        [47.0, () => { lv.say('ЩИТОВИК! ЖДИ, КОГДА ОТКРОЕТСЯ', 3.5); lv.foes.push(new Shield(lv, lv.cam + 420, { from: lv.cam + 720 })); }],
        [52.0, m.zomb(-1, 0.3, 2)], [58.0, m.zomb(1, 0.3, 2)], [64.0, m.zomb(-1, 0.3, 2)],
      ];
    },
    // пролом стены: Наташка на кране
    next(lv) {
      lv.cut = { t: 0, ph: 0 };
      Scene.run(function* () {
        Scene.dialogTop = false; const wx = lv.panW - 110;
        G.shake(5, 0.5); Sound.play('crumble'); lv.puff(wx - 30, 150, 2, 1); yield 0.45; G.shake(7, 0.5); Sound.play('crumble'); lv.puff(wx + 20, 110, 2.4, 1); lv.puff(wx - 10, 200, 2, 1); yield 0.45;
        lv.cut.ph = 1; lv.cut.t = 0; G.shake(10, 0.9); Sound.play('crash'); lv.boom(wx, 170, 1.5); lv.boom(wx - 40, 120, 1.1); yield 1.3;
        lv.cut.ph = 2; Sound.play('honk');
        yield* Scene.say('natasha', 'ВАЛЕРА! ЗАБИРАЙСЯ НА КРАН, ЖИВО!');
        yield* Scene.say('valera', 'Наташка?! Ты же на смене была...');
        yield* Scene.say('natasha', 'Смена подождёт. Тут зомби прут, а у меня кран не глушится!');
        lv.cut.ph = 3; lv.cut.t = 0; yield 0.9;
      }, () => { lv.cut = null; lv.stage = 'dock'; lv.reset(); });
    },
    drawMid(lv, c, cam) {
      const q = lv.cut; if (!q || !q.ph) return;
      const x = lv.panW - 120 - cam + (q.ph === 1 ? Math.max(0, 1 - q.t / 0.35) * 160 : 0);
      L8.spr(c, q.ph === 1 ? 'craneA8' : 'craneN8', 0, x, 268, 0.78);
    },
    drawFront(lv, c) { const q = lv.cut; if (q && q.ph === 3) { c.fillStyle = `rgba(0,0,0,${clamp(q.t / 0.8, 0, 1)})`; c.fillRect(0, 0, 640, 360); } },
  };

  // ---------------------------------------------------------------- C. Кран задним ходом
  L8.STAGES.dock = {
    bg: 'dock', title: 'НА КРАНЕ', speed: 22, fgSheet: 'fgTech8',
    fg: () => { const a = []; for (let x = 500; x < 3000; x += 330) a.push([x % 660 ? 'pipe' : 'lamp', x, 150]); return a; }, trickle: 1.5, zMax: 0.42, zSpeed: 2.3, bite: 5, xmin: 160, xmax: 480,
    build(lv) {
      const m = L8.mk(lv), N = s => () => lv.say('НАТАШКА: ' + s, 3.2);
      return [
        [0.6, N('ДЕРЖИСЬ, ВАЛЕРА! СДАЮ НАЗАД!')], [1.5, m.zomb(1, 0.05, 3)], [4.0, m.zomb(-1, 0.05, 3)], [7.0, m.zomb(1, 0.1, 4)],
        [10.0, m.troop(1, 470, { stopZ: 0.28 })], [12.0, m.zomb(-1, 0.05, 4)], [15.0, N('ОНИ ЛЕЗУТ НА КРАН! СБИВАЙ!')], [16.0, m.zomb(1, 0.1, 5)],
        [19.0, m.gren(1e4, 0, { z: 0.04, rel: 150 })], [21.0, m.zomb(-1, 0.05, 4)], [24.0, m.troop(-1, 170, { stopZ: 0.3 })], [26.0, m.zomb(1, 0.05, 5)],
        [30.0, N('ПОМНЁШЬ КРАН - СЛУЖЕБНУЮ ЗАПИСКУ НАПИШУ!')], [31.0, m.zomb(-1, 0.1, 5)], [34.0, m.gren(1e4, 0, { z: 0.05, rel: 500 })], [36.0, m.zomb(1, 0.05, 5)],
        [39.0, m.troop(1, 420, { stopZ: 0.3 })], [41.0, m.zomb(-1, 0.05, 5)], [44.0, N('ВОРОТА! ПОЧТИ ПРИЕХАЛИ!')], [45.0, m.zomb(1, 0.1, 6)], [48.0, m.zomb(-1, 0.1, 4)],
      ];
    },
    drawMid(lv, c) { L8.spr(c, 'craneB8', 0, 320, 366 + Math.sin(lv.t * 9) * 1.2, 0.8); },
    next(lv) {
      Scene.run(function* () {
        Sound.play('crane'); G.shake(4, 0.4); yield 0.5;
        yield* Scene.say('natasha', 'Приехали. Дальше ножками, у меня обед.');
        yield* Scene.say('valera', 'Спасибо, Наташ. С меня кефир.');
      }, () => { lv.stage = 'tech'; lv.reset(); });
    },
  };

  // ---------------------------------------------------------------- D + E. Техпомещение, потом гаснет свет
  L8.STAGES.tech = {
    bg: 'tech', title: 'ТЕХПОМЕЩЕНИЕ', trickle: 3.0, fgSheet: 'fgTech8', lamps: [150, 420, 700, 980, 1250],
    skins: ['zombE0', 'zombC1', 'zombE0', 'zombE1', 'zombA1', 'zombE0', 'zombC0'],
    fg: () => [['barrels', 430, 60], ['cables', 800, 20], ['pallet', 1180, 50], ['gas', 1560, 90], ['console', 1900, 70], ['barrels', 2300, 60], ['pallet', 2650, 50], ['cables', 2960, 20]],
    build(lv) {
      const m = L8.mk(lv);
      const out = p => lv.foes.push(Object.assign(new Zombie(lv, p.x, 0.03, 'zombE0'), { fade: 0 }));     // зомби из капсулы
      const caps = [300, 545, 705, 1085, 1215].map(x => m.prop('capsule', x, { z: 0.01, hp: 4, spawn: out }));
      const k1 = m.prop('crate', 255, { z: 0.32, hp: 10, drop: 'mag' }), k2 = m.prop('crate', 628, { z: 0.38, hp: 10, drop: 'vog' }), k3 = m.prop('crate', 990, { z: 0.3, hp: 10, drop: 'mag' }), k4 = m.prop('crate', 1190, { z: 0.4, hp: 10, drop: 'kefir' });
      m.prop('powder', 385, { z: 0.16, hp: 3 }); m.prop('powder', 815, { z: 0.22, hp: 3 }); m.prop('powder', 1130, { z: 0.14, hp: 3 });
      m.prop('vodka', 455, { z: 0.26, hp: 3 }); m.prop('vodka', 575, { z: 0.34, hp: 3 }); m.prop('vodka', 900, { z: 0.24, hp: 3 }); m.prop('vodka', 955, { z: 0.19, hp: 3 }); m.prop('vodka', 1040, { z: 0.3, hp: 3, drop: 'vest' });
      const flare = rel => () => lv.pickup('flare', lv.cam + rel, 0.5);
      const pop = i => () => { if (!caps[i].broken && caps[i].x > lv.cam - 20 && caps[i].x < lv.cam + 660) caps[i].hit(99); };
      return [
        [1.0, m.zomb(1, 0.2, 2)], [3.0, m.zomb(-1, 0.3, 2)], [5.5, m.behind(k1, 0.4)], [8.0, m.zomb(1, 0.15, 3)], [10.0, m.troop(1, 460)],
        [12.0, pop(0)], [13.0, m.zomb(-1, 0.3, 3)], [16.0, m.gren(1e4, 0, { z: 0.08, rel: 500 })], [18.0, m.zomb(1, 0.2, 4)], [20.0, m.troop(-1, 150)],
        [23.0, pop(1)], [24.0, m.behind(k2, 0.3)], [26.0, m.zomb(-1, 0.3, 3)], [29.0, m.zomb(1, 0.2, 4)], [31.0, pop(2)], [33.0, m.troop(1, 440)],
        [36.0, m.zomb(-1, 0.25, 4)], [39.0, m.gren(1e4, 0, { z: 0.06, rel: 180 })], [41.0, m.zomb(1, 0.2, 3)],
        // ---- свет гаснет
        [44.0, () => { lv.dark = 1; lv.say('СВЕТ ПОГАС!', 3); Sound.play('lever'); G.flash(0.15, '#000'); }], [45.0, flare(330)],
        [46.0, m.zomb(1, 0.15, 3)], [48.5, m.zomb(-1, 0.3, 3)], [51.0, m.troop(1, 430)], [53.0, m.zomb(1, 0.2, 4)], [55.0, pop(3)], [56.0, m.behind(k3, 0.3)],
        [58.0, flare(250)], [59.0, m.zomb(-1, 0.25, 4)], [62.0, m.troop(-1, 180)], [64.0, m.zomb(1, 0.2, 4)], [66.0, pop(4)], [68.0, m.behind(k4, 0.3)],
        [70.0, flare(380)], [71.0, m.zomb(-1, 0.3, 4)], [74.0, m.zomb(1, 0.2, 5)], [77.0, m.zomb(-1, 0.3, 3)],
      ];
    },
    next(lv) {
      Scene.run(function* () {
        lv.dark = 0; Sound.play('lever'); G.flash(0.25, '#fff'); yield 1.0;
        yield* Scene.say('valera', 'Свет дали... И что это за дверь, как в банке?');
      }, () => { if (L8.STAGES.boss) { lv.stage = 'boss'; lv.reset(); } else { lv.done = true; lv.doneT = 0; } });
    },
  };
})();
