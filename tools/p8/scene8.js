// Снимки катсцен ур.8 в превью: eval(await (await fetch('/tools/p8/scene8.js?'+Date.now())).text()); await __sc.boss()
// Кадры шагаются вручную (1/60 с), диалоги пролистываются; снимки -> приёмник 8783 (art_src/l7, переносить в art_src/l8).
window.__sc = {
  async start(stage) { G.Input.down = {}; startLevel8({ stage }); for (let i = 0; i < 200 && App.level.loading; i++) await new Promise(r => setTimeout(r, 50)); return App.level; },
  async step(n, saves = {}, until) {
    const lv = App.level, o = [];
    for (let i = 0; i < n; i++) {
      if (Scene.active && i % 40 === 0) G.Input.press('punch'); else G.Input.release('punch');
      lv.update(1 / 60); G.Input.endFrame();
      if (saves[i]) o.push(await __t8.save(saves[i]));
      if (App.level !== lv || (until && until(lv))) break;
    }
    return o.join(',');
  },
  async boss() {
    const lv = await this.start('boss'); await this.step(3000, {}, l => l.A && l.A.on);
    lv.pl.hp = 100; await this.step(240, { 200: '_s_boss_fight.jpg' });
    lv.A.roo.hp = lv.A.roo.half - 1; lv.A.spi.hp = lv.A.spi.half - 1; lv.A.roo.inv = lv.A.spi.inv = true;
    return this.step(900, { 30: '_s_crk0.jpg', 100: '_s_crk1.jpg', 230: '_s_crk3a.jpg', 290: '_s_crk3b.jpg', 360: '_s_crk4.jpg' }, l => l.stage === 'mega');
  },
  async mega() {
    const lv = await this.start('mega');
    return this.step(3000, { 60: '_s_lab0.jpg', 200: '_s_lab1.jpg' }, l => l.cutVal && l.cutVal.asm).then(async a => a + ',' + await this.step(400, { 40: '_s_asm.jpg', 300: '_s_mega.jpg' }));
  },
  async dock() { await this.start('dock'); return this.step(300, { 200: '_s_dock.jpg' }); },
};
'ok';
