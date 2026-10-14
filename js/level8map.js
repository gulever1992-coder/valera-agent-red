// Уровень 8: локации-рельсы. Каждая локация — панорама (js/l8_data.js _bg) + расписание событий [время, функция].
(() => {
  const { Zombie, Rifle, Grenadier, Trooper, Prop, rnd, clamp } = L8.K;
  const SK = ['zombA0', 'zombC0', 'zombA1', 'zombD0', 'zombB0', 'zombC1', 'zombB1'];
  // общие помощники расписания
  L8.mk = lv => {
    let sk = 0; const SKS = (lv.S && lv.S.skins) || SK;
    const o = {
      zomb: (side, z, n = 1, skins = SKS) => () => { for (let i = 0; i < n; i++) lv.foes.push(new Zombie(lv, lv.cam + (side < 0 ? -30 - i * 46 : 670 + i * 46) + rnd(-8, 8), clamp(z + rnd(-0.06, 0.1) + i * 0.04, 0, 0.6), skins[sk++ % skins.length])); },
      prop: (kind, x, opt) => { const p = new Prop(lv, kind, x, opt); lv.props.push(p); return p; },
      behind: (t, w, side = 1) => () => lv.foes.push(new Rifle(lv, t.x + rnd(-14, 14), { z: t.z - 0.03, cover: t, wait: w, from: lv.cam + (side < 0 ? -40 : 680) })),
      troop: (side, tx, opt) => () => lv.foes.push(new Trooper(lv, lv.cam + tx, Object.assign({ from: lv.cam + (side < 0 ? -40 : 680), tx: lv.cam + tx }, opt))),
      loge: (x, L) => () => lv.foes.push(new Rifle(lv, x, { fy: L.y, fs: L.s, clipY: L.clip, off: 26 })),
      far: () => { const z = new Zombie(lv, lv.cam + rnd(90, 550), rnd(0, 0.08), SKS[sk++ % SKS.length]); z.fade = 0; lv.foes.push(z); },
      gren: (from, tx, opt = {}) => () => { const T = opt.rel != null ? lv.cam + opt.rel : tx, F = opt.rel != null ? lv.cam + 700 : from; lv.foes.push(new Grenadier(lv, T, Object.assign({}, opt, { from: F, tx: T }))); },
    };
    return o;
  };

  // ---------------------------------------------------------------- A. Главный зал: сцена слева -> ложи -> выход за кулисы
  L8.STAGES.hall = {
    bg: 'hall', trickle: 3.2, title: 'ГЛАВНЫЙ ЗАЛ', outro: 'ЗА КУЛИСЫ!', next: 'back', fgSheet: 'fgHall8',
    // передний план: [предмет, x (едет в 1.7 раза быстрее фона), сдвиг вниз, масштаб]
    fg: () => [['seats', 380, 40], ['column', 700, 150], ['palm', 1040, 60], ['seats', 1330, 44], ['ctable', 1560, 60], ['candle', 1800, 70], ['palm', 2110, 60], ['tvcam', 2380, 90], ['seats', 2640, 44]],
    build(lv) {
      const m = L8.mk(lv), LOGE = { y: 204, clip: 181, s: 0.42 }, LOGE2 = { y: 158, clip: 134, s: 0.4 }, STAGE = { fy: 224, fs: 0.5 };
      // окна лож (центры, мир): три блока — прямой, зеркальный, прямой
      const W1 = [210, 253, 297, 340, 383, 427], W2 = W1.map(x => 912 - x), W3 = W1.map(x => x + 543);
      m.prop('chand', 440, { y: 2, hp: 5, sc: 1.15 }); m.prop('chand', 745, { y: 10, hp: 5, sc: 0.85 }); m.prop('chand', 1000, { y: 4, hp: 5 });
      m.prop('vase', 168, { z: 0.08, hp: 2, drop: 'mag' }); m.prop('vase', 405, { z: 0.2, hp: 2, drop: 'kefir', sc: 1.1 }); m.prop('vase', 668, { z: 0.06, hp: 2, drop: 'vest' }); m.prop('vase', 1046, { z: 0.14, hp: 2, drop: 'mag' });
      const t1 = m.prop('table', 296, { z: 0.4, hp: 10, drop: 'mag' }), t2 = m.prop('table', 590, { z: 0.26, hp: 10, drop: 'vog' }), t3 = m.prop('table', 884, { z: 0.44, hp: 10, drop: 'kefir' });
      return [
        [1.0, m.zomb(1, 0.25, 2)], [2.5, m.zomb(-1, 0.3, 1)], [4.5, m.zomb(1, 0.15, 2)],
        [6.0, m.gren(-20, 70, STAGE)], [8.0, m.zomb(1, 0.35, 2)], [9.5, m.behind(t1, 0.4)],
        [12.0, m.zomb(-1, 0.3, 2)], [13.0, m.loge(W1[2], LOGE)], [15.0, m.zomb(1, 0.2, 3)], [16.5, m.loge(W1[4], LOGE)],
        [19.0, m.gren(-20, 140, STAGE)], [20.0, m.zomb(-1, 0.4, 2)], [22.0, m.zomb(1, 0.3, 3)],
        [25.0, m.loge(W2[4], LOGE)], [26.0, m.behind(t2, 0.3)], [27.5, m.loge(W2[1], LOGE)], [29.0, m.zomb(-1, 0.35, 3)],
        [32.0, m.zomb(1, 0.2, 4)], [17.5, m.troop(1, 470)], [31.0, m.troop(-1, 180)], [44.0, m.troop(1, 420)], [52.0, m.troop(-1, 220)], [34.0, m.loge(W2[0], LOGE)], [36.0, m.gren(1160, 900, { z: 0.08 })],
        [38.0, m.zomb(-1, 0.3, 2)], [40.0, m.loge(W3[1], LOGE)], [41.0, m.zomb(1, 0.3, 3)], [43.0, m.loge(W3[3], LOGE)],
        [45.0, m.behind(t3, 0.3)], [46.0, m.zomb(-1, 0.4, 3)], [48.5, m.gren(1160, 1040, { z: 0.1 })], [50.0, m.zomb(1, 0.25, 4)],
        [53.0, m.loge(W3[5], LOGE)], [10.5, m.loge(W1[0], LOGE2)], [21.0, m.loge(W1[5], LOGE2)], [30.0, m.loge(W2[3], LOGE2)], [37.0, m.loge(W2[5], LOGE2)], [47.5, m.loge(W3[2], LOGE2)], [57.0, m.loge(W3[4], LOGE2)], [54.0, m.zomb(-1, 0.35, 3)], [56.5, m.zomb(1, 0.3, 3)],
      ];
    },
  };
})();
