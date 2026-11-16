// Тест-бот обучения ур.1 (?tut): вставить в консоль превью, затем __tut.bot() -> отчёт
window.__step = (sec, onFrame) => { const n = Math.round(sec * 60); for (let i = 0; i < n; i++) { const dt = 1 / 60; G.t += dt; G.dt = dt; if (G.shakeT > 0) { G.shakeT -= dt; if (G.shakeT <= 0) G.shakeAmt = 0; } if (onFrame) { const r = onFrame(i); if (r === 'stop') break; } try { update(dt); } catch (e) { return 'ERR ' + e.message + ' ' + e.stack.split('\n')[1]; } G.Input.endFrame(); } try { draw(); } catch (e) { return 'DRAWERR ' + e.message + ' ' + e.stack.split('\n')[1]; } return 'ok'; };
window.__tut = {
  bot(maxSec = 240) {
    const I = G.Input, log = [], seen = {}; let f = 0, thrown = 0;
    const set = (a, on) => { if (on && !I.held(a)) I.press(a); if (!on && I.held(a)) I.release(a); };
    const go = (pl, x) => { const d = x - pl.x; set('right', d > 3); set('left', d < -3); return Math.abs(d) <= 3; };
    const r = __step(maxSec, () => {
      f++;
      const T = L1.tut, pl = T.pl;
      if (Scene.dialog) { ['left', 'right', 'down', 'jump', 'punch', 'throw'].forEach(a => set(a, false)); if (Scene.dialog.shown >= Scene.dialog.text.length) Scene.closeDialog(); return; }
      if (App.level.mode !== 'scene') return 'stop';
      if (T.step && !seen[T.step]) { seen[T.step] = 1; log.push(T.step + '@' + (f / 60).toFixed(1)); }
      if (!T.step || !pl.controls) { ['left', 'right', 'down', 'jump', 'punch', 'throw'].forEach(a => set(a, false)); return; }
      if (T.step === 'squat') set('down', f % 14 < 7);
      else if (T.step === 'crawl') { set('down', true); set('right', true); }
      else if (T.step === 'jump') { set('down', false); set('right', false); set('jump', pl.onGround && f % 8 < 2); }
      else if (T.step === 'birds') {
        set('jump', false); set('throw', false); set('punch', false); set('down', false);
        const [bx, gl, fl] = T.birds;
        if (pl.ammo.bricks <= 0 && T.brick && (!bx.dead || !gl.dead)) { go(pl, T.brick.x); return; }
        if (!bx.dead) { if (T.world.projs.length) return; if (go(pl, bx.x + 138)) { if (pl.facing > 0) { I.press('left'); return; } set('throw', true); thrown++; } }
        else if (!gl.dead) {
          if (T.world.projs.length) return;
          if (pl.onGround) { if (go(pl, gl.x0 - 80)) { if (pl.facing < 0) { I.press('right'); return; } set('jump', true); } }
          else { set('jump', true); if (pl.vy > -120) { set('throw', true); thrown++; } }
        }
        else if (!fl.dead) { if (go(pl, fl.x - 22)) { if (pl.facing < 0) { I.press('right'); return; } set('down', true); if (pl.crouch && f % 20 === 0) set('punch', true); } }
      }
    });
    ['left', 'right', 'down', 'jump', 'punch', 'throw'].forEach(a => set(a, false));
    return JSON.stringify({ r, sec: (f / 60).toFixed(1), log, thrown, mode: App.level.mode, left: L1.tut.left, step: L1.tut.step, n: L1.tut.n });
  },
};
