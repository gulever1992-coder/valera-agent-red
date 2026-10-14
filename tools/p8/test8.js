// Тест-бот уровня 8. В превью: eval(await (await fetch('/tools/p8/test8.js?'+Date.now())).text()); await __t8.run('hall', 70, [20, 45])
// Бот стреляет «напрямую» (lv.shootAt) каждые every кадров по ближайшей цели на экране, гранаты сбивает; снимки шлёт на приёмник 8783.
window.__t8 = {
  shot() { const c = G.ctx; c.setTransform(2, 0, 0, 2, 0, 0); App.level.draw(c); },
  async save(name) { this.shot(); const cv = document.querySelector('canvas'); const r = await fetch('http://127.0.0.1:8783/', { method: 'POST', body: name + '|' + cv.toDataURL('image/jpeg', 0.88) }); return (await r.text()).slice(-20); },
  async run(stage, sec, shots = [], o = {}) {
    G.Input.down = {}; const every = o.every || 5, god = o.god;
    if (stage) { startLevel8({ stage }); for (let i = 0; i < 200 && App.level.loading; i++) await new Promise(r => setTimeout(r, 50)); }
    const lv = App.level, I = G.Input, out = []; let err = null, stages = [lv.stage];
    try {
      for (let i = 0; i < sec * 60; i++) {
        if (god) lv.pl.hp = 100;
        if (i % every === 0 && !lv.dead && !lv.done) {
          const on = x => x - lv.cam > 14 && x - lv.cam < 626;
          const g = lv.grens.find(g => g.t > 0.5 && on(g.x));
          if (g) lv.shootAt(g.x, g.y);
          else { const fs = lv.foes.filter(f => !f.dead && !f.inv && f.box()[2] > 0 && on(f.x)).sort((a, b) => (b.z || 0) - (a.z || 0)); if (fs.length) { const b = fs[0].box(); lv.shootAt(b[0] + b[2] / 2, b[1] + b[3] / 2); lv.cx = b[0] + b[2] / 2 - lv.cam; lv.cy = b[1] + b[3] / 2; } else if (lv.picks.length) lv.take(lv.picks[0]); }
          if (o.boss && lv.bossTargets) for (const t of lv.bossTargets()) lv.shootAt(t[0], t[1]);
        }
        if (Scene.active && i % 30 === 0) { I.press('punch'); } else I.release('punch');
        if (lv.cling > 0) { I.release('left'); I.release('right'); if (i % 4 === 0) I.press(i % 8 ? 'left' : 'right'); } else if (o.dodge && i % 90 === 0) { I.release('left'); I.release('right'); I.press(Math.random() < 0.5 ? 'left' : 'right'); }
        if (o.cuts && lv.cutImg && lv.cutImg !== lv._ci) { lv._ci = lv.cutImg; lv._ciT = i + 20; } if (lv._ciT === i) out.push(await this.save('_l8_cut_' + lv.cutImg + '.jpg'));
        if (o.snap && Scene.active && !lv._sn) { lv._sn = 1; lv._snT = i + 150; } if (lv._snT === i) out.push(await this.save('_l8_scene_' + lv.stage + '.jpg'));
        lv.update(1 / 60); I.endFrame();
        if (App.level !== lv) break;
        if (stages[stages.length - 1] !== lv.stage) stages.push(lv.stage);
        const tt = Math.round(lv.t * 10) / 10, s = shots.findIndex(q => q[0] === lv.stage && q[1] === tt); if (s >= 0 && !shots[s][2]) { shots[s][2] = 1; out.push(await this.save('_l8_' + lv.stage + '_' + tt + '.jpg')); }
        if (lv.done) break;
      }
    } catch (e) { err = e.stack.slice(0, 600); }
    return JSON.stringify({ err, stages, t: +lv.t.toFixed(1), cam: lv.cam | 0, panW: lv.panW, hp: lv.pl.hp, kills: lv.stats.kills, deaths: lv.stats.deaths, alive: lv.foes.filter(f => !f.dead).length, done: lv.done, out });
  },
};
'ok';
