// Уровень 9, лаборатория: платформер как Terminator 2D (ярусы, лестницы, стрельба в 8 сторон, кувырок, приклад, гранаты, спецоружие).
// Карта — L9.MAPS[имя] (js/level9labmap.js), враги — L9.FOES (js/level9foes.js). Координаты мира логические, y вниз.
(() => {
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd;
  const GRAV = 1300, RUN = 150, JUMP = 520, PW = 13, PH = 78, PHC = 50;
  // оружие: скорострельность, урон, скорость пули, патроны (null — бесконечно), эффект
  const WEAP = {
    rifle: { name: 'АВТОМАТ', rate: 0.13, dmg: 1, sp: 640, ammo: null, fx: 'tracer' },
    pist: { name: 'ПИСТОЛЕТ', rate: 0.09, dmg: 1, sp: 760, ammo: 140, fx: 'tracer' },
    mini: { name: 'МИНИГАН', rate: 0.055, dmg: 0.8, sp: 700, ammo: 320, fx: 'tracer', spread: 0.09 },
    plasma: { name: 'ПЛАЗМОГАН', rate: 0.32, dmg: 3.5, sp: 460, ammo: 40, fx: 'plasma', pierce: 1 },
    rocket: { name: 'РАКЕТНИЦА', rate: 0.75, dmg: 6, sp: 380, ammo: 12, fx: 'rocket', blast: 46 },
    seed: { name: 'ОСЕМЕНИТЕЛЬ 6000', rate: 0.2, dmg: 1, sp: 520, ammo: 30, fx: 'seed', seed: 1 },
  };
  L9.WEAP = WEAP;
  // направления прицела -> [кадр стоя, кадр бега-префикс, смещение дула (вперёд, вверх), угол]
  const AIM = {
    fwd: { a: 0, mx: 40, my: 58 }, diag: { a: -Math.PI / 4, mx: 34, my: 76 }, up: { a: -Math.PI / 2 + 0.25, mx: 18, my: 86 },
    down: { a: Math.PI / 4, mx: 34, my: 36 }, crouch: { a: 0, mx: 42, my: 40 }, cdiag: { a: -Math.PI / 4, mx: 34, my: 56 }, air: { a: Math.PI / 2, mx: 4, my: 20 },
  };

  const LAB = L9.LAB = {
    // ---------- мир ----------
    solidAt(M, x, y) { for (const r of M.solids) if (x >= r[0] && x < r[0] + r[2] && y >= r[1] && y < r[1] + r[3]) return r; return null; },
    // пол под точкой: ближайшая поверхность с top >= y0 (сплошные и мостки)
    floorBelow(M, x, y0, y1, oneWay = true) {
      let best = null;
      for (const r of M.solids) if (x >= r[0] && x < r[0] + r[2] && r[1] >= y0 && r[1] <= y1 && (!best || r[1] < best)) best = r[1];
      if (oneWay) for (const w of M.walks) if (!w.gone && x >= w[0] && x < w[0] + w[2] && w[1] >= y0 && w[1] <= y1 && (!best || w[1] < best)) best = w[1];
      for (const l of M.lifts || []) if (x >= l.x && x < l.x + l.w && l.y >= y0 && l.y <= y1 && (!best || l.y < best)) best = l.y;
      return best;
    },
    ladderAt(M, x, y) { for (const l of M.ladders) if (Math.abs(x - l[0]) < 12 && y >= l[1] - 2 && y <= l[2] + 2) return l; return null; },
  };

  const P = L9.PARTS.lab = {
    deathText: 'ВАЛЕРУ ПЕРЕРАБОТАЛИ',
    start(lv, ck, map) {
      const M = P.M = L9.MAPS[map || 'lab'](); P.lv = lv;
      const cp = M.cks[ck || 0] || M.cks[0];
      Object.assign(P, { hp: 100, inv: 1.2, x: cp[0], y: cp[1], vx: 0, vy: 0, dir: 1, st: 'stand', stT: 0, onG: true, aim: 'fwd', fireT: 0, fireA: 0, rollT: 0, rollCd: 0, buttT: 0,
        climb: null, gren: 5, weap: 'rifle', ammo: {}, t: 0, ck: ck || 0, dropT: 0, cam: { x: cp[0] - 220, y: cp[1] - 250 }, bul: [], ebul: [], fx: [], foes: [], hint: null, hintT: 0, cover: false, web: 0, hide: 0 });
      for (const k in WEAP) P.ammo[k] = 0;
      M.init && M.init(P, lv, ck || 0);
      try { Music.play('alarm'); } catch (e) {}
    },
    onDie(lv) { lv.ck = P.ck; },
    deadUpdate(lv, dt) { P.updFx(dt); },
    feet() { return [P.x, P.y]; },
    box() { const h = P.st === 'crouch' || P.st === 'roll' ? PHC : PH; return [P.x - PW, P.y - h, PW * 2, h]; },
    hurt(d, fromX) {
      if (P.inv > 0 || P.st === 'roll' || P.lv.dead) return;
      P.lv.hurt(Math.ceil(d * 0.7 * (P.M.dmgK || 1))); if (P.lv.dead) { P.st = 'dead'; return; }     // лаборатория длинная: урон по Валере x0.7
      P.st = 'hurt'; P.stT = 0; P.vx = (fromX != null ? Math.sign(P.x - fromX) || -P.dir : -P.dir) * 120; P.vy = -180; P.onG = false; P.climb = null;
    },
    hintAt(s, t = 3) { if (P.hint !== s) { P.hint = s; P.hintT = t; } },
    update(lv, dt) {
      const I = G.Input, M = P.M; P.t += dt; P.inv -= dt; P.fireT -= dt; P.fireA -= dt; P.rollCd -= dt; P.stT += dt; P.hintT -= dt; P.dropT -= dt;
      const L = I.held('left'), R = I.held('right'), U = I.held('up'), Dn = I.held('down');
      // ---- состояния
      if (P.st === 'hurt') { if (P.stT > 0.35 && P.onG) P.st = 'stand'; }
      else if (P.web > 0) {     // опутан паутиной паука: стоит, жми стрелки, чтобы порвать
        P.vx = 0; P.st = 'stand'; P.web -= dt * 0.2;
        if (['left', 'right', 'up', 'down'].some(a => I.pressed(a))) { P.web -= 0.11; Sound.play('clank', 0.25); }
        if (P.web <= 0) { P.web = 0; P.inv = Math.max(P.inv, 0.5); Sound.play('punch', 0.5); }
      }
      else if (P.climb) {
        const l = P.climb; P.vx = 0; P.vy = 0; P.x = l[0];
        const dy = (Dn ? 1 : 0) - (U ? 1 : 0); P.y += dy * 95 * dt; P.climbT = (P.climbT || 0) + Math.abs(dy) * dt;
        if (P.y < l[1]) { P.y = l[1]; P.climb = null; P.st = 'stand'; P.onG = true; }        // вылез наверх
        else if (P.y > l[2]) { P.y = l[2]; P.climb = null; P.st = 'stand'; }
        if (I.pressed('jump') && !U) { P.climb = null; P.st = 'jump'; P.vy = -220; P.vx = (R ? 1 : L ? -1 : 0) * RUN; }
      } else if (P.st === 'roll') { P.vx = P.dir * 300; if (P.stT > 0.38) P.st = 'stand'; }
      else if (P.st === 'butt') { P.vx = 0; if (P.stT > 0.32) P.st = 'stand'; }
      else {
        // лестница
        const lad = LAB.ladderAt(M, P.x, P.y);
        if (lad && U && !L && !R && (P.y > lad[1] + 4)) { P.climb = lad; P.st = 'climb'; }
        else if (lad && Dn && P.onG && Math.abs(P.y - lad[1]) < 4) { P.climb = lad; P.st = 'climb'; P.y += 4; }
        if (!P.climb) {
          const mv = (R ? 1 : 0) - (L ? 1 : 0);
          if (mv) P.dir = mv;
          const crouch = Dn && P.onG && !mv;
          P.vx = crouch ? 0 : mv * RUN * (M.pushAt ? 1 : 1);
          if (P.onG && M.beltAt) P.vx += M.beltAt(P.x, P.y);
          if (I.pressed('jump')) {
            if (P.onG && Dn && LAB.floorBelow(M, P.x, P.y - 1, P.y + 2, true) !== null && !LAB.solidTop(M, P.x, P.y)) { P.dropT = 0.25; P.onG = false; P.y += 3; }   // спрыгнуть с мостка
            else if (P.onG) { P.vy = -JUMP; P.onG = false; P.st = 'jump'; P.stT = 0; Sound.play('jump'); }
          }
          if (I.pressed('switch') && P.onG && P.rollCd <= 0) { P.st = 'roll'; P.stT = 0; P.rollCd = 0.6; Sound.play('punch'); }
          if (P.st !== 'roll') P.st = !P.onG ? 'jump' : crouch ? 'crouch' : mv ? 'run' : 'stand';
          // прицел
          P.aim = !P.onG ? (Dn ? 'air' : U && mv ? 'diag' : U ? 'up' : 'fwd') : crouch ? (U ? 'cdiag' : 'crouch') : U && mv ? 'diag' : U ? 'up' : Dn && mv ? 'down' : 'fwd';
          // огонь / приклад
          if (I.held('punch') && P.fireT <= 0) P.fire(lv);
          if (I.pressed('throw') && P.gren > 0) { P.gren--; P.throwGren(); }
        }
      }
      // ---- физика
      if (!P.climb) {
        P.vy = Math.min(900, P.vy + GRAV * dt);
        // горизонталь
        const nx = P.x + P.vx * dt, h = P.st === 'crouch' ? PHC : PH;
        const hit = [-h + 4, -h / 2, -6].some(o => LAB.solidAt(M, nx + Math.sign(P.vx || 1) * PW, P.y + o));
        if (!hit) P.x = clamp(nx, M.x0 + PW, M.x1 - PW); else if (P.st === 'roll') P.st = 'stand';
        // вертикаль
        const ny = P.y + P.vy * dt;
        if (P.vy >= 0) {
          const f = LAB.floorBelow(M, P.x, P.y - 1, ny, P.dropT <= 0);
          if (f !== null) { if (!P.onG && P.vy > 300) { Sound.play('land'); P.landT = 0.12; } P.y = f; P.vy = 0; P.onG = true; }
          else { P.y = ny; P.onG = false; }
        } else {
          const hy = P.y - PH, nh = ny - PH, deck = M.walks.find(w => !w.gone && !w.thru && P.x + PW * 0.6 > w[0] && P.x - PW * 0.6 < w[0] + w[2] && hy >= w[1] + 8 && nh < w[1] + 8 && !(M.pits || []).some(q => P.x > q[0] - 70 && P.x < q[1] + 70));     // над ямой под мостком пропускаем — иначе её не перепрыгнуть     // мостки снизу твёрдые: в прыжке Валера бьётся о них головой (наверх — только по лестнице)
          const pc = LAB.pressCeil ? LAB.pressCeil(M, P, P.x) : null;     // головка пресса снизу тоже твёрдая
          if (LAB.solidAt(M, P.x, nh)) P.vy = 0; else if (pc !== null && hy >= pc - 2 && nh < pc) { P.y = pc + PH; P.vy = 30; Sound.play('clank', 0.4); } else if (deck) { P.y = deck[1] + 8 + PH; P.vy = 30; Sound.play('clank', 0.4); } else P.y = ny;
          P.onG = false;
        }
        if (P.onG) { const lf = (M.lifts || []).find(l => P.x >= l.x && P.x < l.x + l.w && Math.abs(P.y - l.y) < 2); if (lf) P.y = lf.y; }
      }
      // пропасть / жижа
      if (P.y > (M.killAt ? M.killAt(P.x) : M.killY)) { lv.hurt(20); const c = M.cks[P.ck]; if (!lv.dead) { P.x = c[0]; P.y = c[1]; P.vy = 0; M.onFall && M.onFall(P, lv); } }
      if (M.hazAt) { const hz = M.hazAt(P.x, P.y, P); if (hz) P.hurt(hz[0], hz[1]); }
      // чекпоинты
      for (let i = P.ck + 1; i < M.cks.length; i++) if (P.x > M.cks[i][0] - 10 && Math.abs(P.y - M.cks[i][1]) < 200) { P.ck = i; lv.ck = i; Sound.play('checkpoint'); lv.say('КОНТРОЛЬНАЯ ТОЧКА', 1.5); }
      // ---- остальное
      P.updBullets(lv, dt);
      for (const f of P.foes) if (!f.gone) f.update(dt, P, lv);
      P.foes = P.foes.filter(f => !f.gone);
      M.update && M.update(dt, P, lv);
      P.updFx(dt);
      P.camera(dt);
    },
    camera(dt) {
      const M = P.M, c = P.cam, look = P.dir * 70;
      const tx = clamp(P.x - 320 + look, M.x0, M.x1 - 640), gy = P.onG || P.climb ? (P.camGY = P.y) : Math.max(P.camGY ?? P.y, P.y), ty = clamp(M.camY ? M.camY(gy) : gy - (Math.abs(gy - 330) < 3 ? 272 : P.x > 16500 && gy > 1200 ? 292 : 230), M.y0, M.y1 - 360);     // по опоре, а не по прыжку; на основном полу ниже — меньше пустоты под ним
      c.x += (tx - c.x) * Math.min(1, dt * 4); c.y += (ty - c.y) * Math.min(1, dt * 4.5);
      if (M.camLock) { const k = M.camLock(P); if (k) { c.x = clamp(c.x, k[0], k[1] - 640); } }
    },
    // ---- стрельба
    muzzle() { const a = AIM[P.aim]; return [P.x + P.dir * a.mx, P.y - a.my, a.a]; },
    fire(lv) {
      const w = WEAP[P.weap]; if (w.ammo != null && P.ammo[P.weap] <= 0) { P.weap = 'rifle'; lv.say('ПАТРОНЫ КОНЧИЛИСЬ — АВТОМАТ', 1.4); return; }
      // вплотную — приклад
      const near = P.foes.find(f => !f.dead && Math.abs(f.x - (P.x + P.dir * 30)) < 26 && Math.abs(f.y - P.y) < 30 && P.aim === 'fwd' && P.onG);
      if (near) { P.st = 'butt'; P.stT = 0; P.fireT = 0.35; Sound.play('punch'); near.hit(3, P.dir, 'melee'); return; }
      P.fireT = w.rate; P.fireA = 0.1; lv.stats.shots++;
      if (w.ammo != null) P.ammo[P.weap]--;
      const [mx, my, a0] = P.muzzle(), ang = P.dir > 0 ? a0 : Math.PI - a0;
      const shoot = (ang, oy = 0) => P.bul.push({ x: mx, y: my + oy, vx: Math.cos(ang) * w.sp, vy: Math.sin(ang) * w.sp, dmg: w.dmg, w: P.weap, t: 0, hits: [] });
      if (w.dual) { shoot(ang, -3); shoot(ang + 0.06, 3); } else shoot(ang + (w.spread ? rnd(-w.spread, w.spread) : 0));
      Sound.play(P.weap === 'rocket' ? 'boom' : P.weap === 'plasma' ? 'zap' : 'shot', P.weap === 'rocket' ? 0.4 : 1);
      P.fx.push({ sh: 'fxL9', fr: ['muzzle'], x: mx, y: my, s: P.weap === 'mini' ? 0.5 : 0.35, t: 0, life: 0.06, rot: ang, add: 1 });
    },
    throwGren() { const [mx, my] = P.muzzle(); P.bul.push({ x: mx, y: my - 6, vx: P.dir * 230, vy: -320, grav: 1, dmg: 6, w: 'gren', t: 0, hits: [], blast: 52 }); Sound.play('throw'); },
    blast(x, y, r, dmg) {
      P.fx.push({ sh: 'fxA9', fr: ['boom0', 'boom1', 'boom2', 'boom3'], x, y, s: r / 46, t: 0, life: 0.55 }); Sound.play('boom'); G.shake(4, 0.25);
      for (const f of P.foes) if (!f.dead && Math.hypot(f.x - x, f.y - f.h / 2 - y) < r + 12) f.hit(dmg, Math.sign(f.x - x), 'blast');
      P.M.blast && P.M.blast(x, y, r, dmg, P);
      if (Math.hypot(P.x - x, P.y - 40 - y) < r * 0.6 && P.lv) P.hurt(10, x);
    },
    updBullets(lv, dt) {
      const M = P.M;
      for (const b of P.bul) {
        b.t += dt; if (b.grav) b.vy += GRAV * 0.8 * dt;
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.w === 'seed' && b.stuck) continue;
        // стены и полы
        if (LAB.solidAt(M, b.x, b.y) || (b.grav && LAB.floorBelow(M, b.x, b.y - 4, b.y + 2) !== null)) {
          if (b.w === 'gren' || b.w === 'rocket') { b.dead = true; P.blast(b.x, b.y, b.blast || WEAP.rocket.blast, b.dmg); continue; }
          if (b.w === 'seed') { b.stuck = 1; b.vx = b.vy = 0; b.boomT = 1; continue; }
          b.dead = true; P.fx.push({ sh: 'fxL9', fr: ['spark'], x: b.x, y: b.y, s: 0.35, t: 0, life: 0.12, add: 1 }); continue;
        }
        // враги
        for (const f of P.foes) {
          if (f.dead || b.hits.includes(f)) continue; const bx = f.box();
          if (b.x > bx[0] && b.x < bx[0] + bx[2] && b.y > bx[1] && b.y < bx[1] + bx[3]) {
            if (b.w === 'rocket' || b.w === 'gren') { b.dead = true; P.blast(b.x, b.y, b.blast || WEAP.rocket.blast, b.dmg); break; }
            if (b.w === 'seed') { b.stuck = f; b.ox = b.x - f.x; b.oy = b.y - f.y; b.boomT = 1; f.hit(1, Math.sign(b.vx), 'seed'); break; }
            const blocked = f.blocks && f.blocks(b);
            if (blocked) { b.dead = true; Sound.play('deflect'); P.fx.push({ sh: 'fxL9', fr: ['spark'], x: b.x, y: b.y, s: 0.4, t: 0, life: 0.1, add: 1 }); break; }
            f.hit(b.dmg, Math.sign(b.vx), b.w); lv.stats.hits++; b.hits.push(f);
            P.fx.push({ sh: 'fxL9', fr: [b.w === 'plasma' ? 'plasmaHit' : 'spark'], x: b.x, y: b.y, s: 0.4, t: 0, life: 0.12, add: 1 });
            if (!WEAP[b.w] || !WEAP[b.w].pierce) { b.dead = true; break; }
          }
        }
        if (!b.dead && M.shootProps) M.shootProps(b, P);
        if (b.t > 1.6 || b.x < P.cam.x - 60 || b.x > P.cam.x + 700 || b.y < P.cam.y - 80 || b.y > P.cam.y + 440) b.dead = true;
      }
      // семечки: прорастают в подсолнух-мину и взрываются (цепная реакция)
      for (const b of P.bul) if (b.w === 'seed' && b.stuck) { if (b.stuck !== 1) { b.x = b.stuck.x + b.ox; b.y = b.stuck.y + b.oy; } b.boomT -= dt; if (b.boomT <= 0) { b.dead = true; P.blast(b.x, b.y, 34, 4); } }
      P.bul = P.bul.filter(b => !b.dead);
      // вражеские снаряды
      for (const e of P.ebul) {
        e.t += dt; if (e.grav) e.vy += GRAV * e.grav * dt; e.x += e.vx * dt; e.y += e.vy * dt;
        const bx = P.box(); if (P.lv && e.x > bx[0] && e.x < bx[0] + bx[2] && e.y > bx[1] && e.y < bx[1] + bx[3]) {
          if (P.cover && e.y > P.y - 44 && Math.sign(e.vx) === -Math.sign(P.coverDir || 0)) { e.dead = true; continue; }
          e.dead = true; P.hurt(e.dmg || 10, e.x); if (e.onHit) e.onHit(e, P); continue; }
        if (LAB.solidAt(M, e.x, e.y) || (e.grav && LAB.floorBelow(M, e.x, e.y - 3, e.y + 2) !== null)) { e.dead = true; if (e.onLand) e.onLand(e, P); else P.fx.push({ sh: 'fxL9', fr: ['spark'], x: e.x, y: e.y, s: 0.35, t: 0, life: 0.1, add: 1 }); }
        if (e.t > (e.life || 4)) e.dead = true;
      }
      P.ebul = P.ebul.filter(e => !e.dead);
    },
    updFx(dt) { for (const f of P.fx) { f.t += dt; if (f.vx != null) { f.x += f.vx * dt; f.vy += (f.g || 0) * dt; f.y += f.vy * dt; } } P.fx = P.fx.filter(f => f.t < f.life); },
    // ---------- отрисовка ----------
    draw(lv, c) {
      const M = P.M, cx = Math.round(P.cam.x), cy = Math.round(P.cam.y);
      c.fillStyle = '#04070a'; c.fillRect(0, 0, 640, 360);
      M.drawBack(c, cx, cy, P);
      c.save(); c.translate(-cx, -cy);
      P.drawFloor(c);
      P.drawWalks(c);     // мостки (опоры, лестницы) — позади предметов: капсулы, пульты, укрытия стоят перед опорами
      M.drawMid && M.drawMid(c, P);
      P.drawWorld(c);
      for (const f of P.foes) if (f.behind) f.draw(c);
      for (const f of P.foes) if (!f.behind) f.draw(c);
      P.drawValera(c);
      P.drawRails(c);
      for (const b of P.bul) P.drawBullet(c, b);
      for (const e of P.ebul) { if (e.draw) e.draw(c, e); else S(c, 'fxL9', e.fr || 'fireball', e.x, e.y, e.s || 0.4, { rot: Math.atan2(e.vy, e.vx) }); }
      for (const f of P.fx) { const i = Math.min(f.fr.length - 1, f.t / f.life * f.fr.length | 0); S(c, f.sh, f.fr[i], f.x, f.y, f.s, { rot: f.rot || 0, add: f.add, a: f.fade ? clamp((f.life - f.t) / (f.life * 0.4), 0, 1) : 1 }); }
      M.drawFront && M.drawFront(c, P);
      c.restore();
      M.drawOver && M.drawOver(c, cx, cy, P);
      if (P.hintT > 0 && P.hint) G.text(Game.fmtHint(P.hint), 320, 46, { align: 'center', size: 8, color: '#9cf', outline: true });
    },
    drawFloor(c) {     // пол, опоры под ним, лента и цистерны — раньше всех предметов: всё стоит ПОВЕРХ пола
      const M = P.M, x0 = P.cam.x - 100, x1 = P.cam.x + 740;
      M.drawBackWorld && M.drawBackWorld(c, P);
      // пол — тонкая металлическая плита (бесшовная полоса labFloor), под ней виден дальний план; торцы плиты на опорных колоннах
      const fim = L9.img.labFloor, FH = 34;
      for (const r of M.solids) {
        if (r[0] > x1 || r[0] + r[2] < x0 || r[4] === 'hide') continue;
        if (fim) {      // плита пола; там, где лента конвейера, пола нет — лента лежит вместо него
          const fw = fim.width / fim.height * FH; c.save(); c.beginPath();
          const seg = []; let a = r[0]; for (const [n0, n1] of (M.noFloor || []).filter(n => r[1] === 330 && n[1] > r[0] && n[0] < r[0] + r[2]).sort((p, q) => p[0] - q[0])) { if (n0 > a) seg.push([a, n0]); a = Math.max(a, n1); }
          if (a < r[0] + r[2]) seg.push([a, r[0] + r[2]]);
          for (const [s0, s1] of seg) { const rl = s0 === r[0] && (r[3] >= 40 || r[4] === 'ledge') ? 7 : 0, rr = s1 === r[0] + r[2] && (r[3] >= 40 || r[4] === 'ledge') ? 7 : 0; c.roundRect(s0, r[1] - 7, s1 - s0, FH, [rl, rr, rr, rl]); }     // на настоящих краях плиты угол скруглён
          c.clip(); for (let x = r[0] - ((r[0] % fw) + fw) % fw; x < r[0] + r[2]; x += fw) c.drawImage(fim, Math.floor(x), r[1] - 7, Math.ceil(fw) + 1, FH); c.restore();
          if (L9.img.flE9 && (r[3] >= 40 || r[4] === 'ledge')) for (const [s0, s1] of seg) { const [ew] = L9.size('flE9', 'endL'), k = FH / 48, w = ew * k;     // законченные торцы плиты (скруглённый угол, уголок на болтах)
            if (s1 - s0 > w * 2) { if (s0 === r[0]) S(c, 'flE9', 'endL', s0 + w / 2, r[1] - 7 + FH / 2, k); if (s1 === r[0] + r[2]) S(c, 'flE9', 'endR', s1 - w / 2, r[1] - 7 + FH / 2, k); } } }     // у ленты конвейера торцов нет — там стык
      }
      LAB.drawPillars(c, M, x0, x1, FH);
      M.drawOnFloor && M.drawOnFloor(c, P);
    },
    drawWalks(c) {
      const M = P.M, x0 = P.cam.x - 100, x1 = P.cam.x + 740;
      // мостки v5 (cw9): опоры, лестница и настил — один рисунок; передние перила (F) — после Валеры в drawRails
      LAB.camY = P.cam.y; for (const w of M.walks) if (!w.gone && !w.own && w[0] < x1 && w[0] + w[2] > x0) LAB.cwLayer(c, M, w, 'B');
    },
    drawWorld(c) {
      const M = P.M;
      for (const l of M.lifts || []) M.drawCar ? M.drawCar(c, l) : S(c, 'plat9', 'lift', l.x + l.w / 2, l.y + 24, l.w / 53);
    },
    drawRails(c) {     // передние перила мостков — перед Валерой и врагами
      const M = P.M, x0 = P.cam.x - 100, x1 = P.cam.x + 740;
      for (const w of M.walks) if (!w.gone && !w.own && w[0] < x1 && w[0] + w[2] > x0) LAB.cwLayer(c, M, w, 'F');
    },
    drawValera(c) {
      if (P.lv.dead && P.lv.dead > 0.3 && !P.melted) { S(c, 'vClimb9', 'down', P.x, P.y, 1, { flip: P.dir < 0 }); return; }     // растворившийся в котле — без тела
      if (P.hide) return;     // спрятан картой (например, внутри капсулы-лифта)
      if (P.inv > 0 && (P.t * 16 | 0) % 2 && P.st !== 'hurt') return;
      const fl = P.dir < 0; let sh = 'vAim9', fr = 'stand';
      const run4 = (P.t * 10 | 0) % 4, run8 = (P.t * 12 | 0) % 8;
      if (P.st === 'climb') { sh = 'vClimb9'; fr = 'c' + ((P.climbT * 8 | 0) % 4); }
      else if (P.st === 'hurt') { sh = 'vClimb9'; fr = P.stT < 0.15 ? 'hit' : 'stagger'; }
      else if (P.st === 'roll') { sh = 'vRoll9'; fr = 'roll' + Math.min(3, P.stT / 0.38 * 4 | 0); }
      else if (P.st === 'butt') { sh = 'vRoll9'; fr = 'butt' + Math.min(3, P.stT / 0.32 * 4 | 0); }
      else if (P.st === 'jump') { sh = 'vJump9'; fr = P.aim === 'air' ? 'fallDown' : P.aim === 'diag' || P.aim === 'up' ? (sh = 'vAim9', P.aim) : P.vy < -200 ? 'rise' : P.vy < 150 ? ['flip1', 'flip2', 'flip3'][(P.t * 9 | 0) % 3] : 'fallDiag'; }
      else if (P.st === 'crouch') fr = P.aim === 'cdiag' ? 'crouchDiag' : P.fireA > 0 ? 'crouchFire' : 'crouch';
      else if (P.st === 'run') { if (P.aim === 'diag') { sh = 'vRunUD9'; fr = 'u' + run4; } else if (P.aim === 'down') { sh = 'vRunUD9'; fr = 'd' + run4; } else { sh = 'vRun9'; fr = 'r' + run8; } }
      else fr = P.aim === 'diag' ? 'diag' : P.aim === 'up' ? 'up' : P.aim === 'down' ? 'down' : P.fireA > 0 ? 'fire' : 'stand';
      if (P.weap !== 'rifle' && L9D[sh + '_' + P.weap]) sh += '_' + P.weap;     // в руках то оружие, которое подобрал
      S(c, sh, fr, P.x, P.y + 1, 1, { flip: fl });     // присед в том же масштабе, что и стойка (голова и тело не уменьшаются)
    },
    drawBullet(c, b) {
      const a = Math.atan2(b.vy, b.vx);
      if (b.w === 'gren') { S(c, 'pick9', 'grenades', b.x, b.y, 0.35, { rot: b.t * 10 }); return; }
      if (b.w === 'seed') { S(c, 'fxL9', 'seed', b.x, b.y, b.stuck ? 0.5 + Math.sin(b.t * 30) * 0.1 : 0.4, { rot: a }); return; }
      S(c, 'fxL9', b.w === 'plasma' ? 'plasma' : b.w === 'rocket' ? 'rocket' : 'tracer', b.x, b.y, b.w === 'plasma' ? 0.5 : b.w === 'rocket' ? 0.45 : 0.32, { rot: a });
    },
    drawHud(lv, c) {
      const w = WEAP[P.weap];
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(6, 25, 148, 16);
      G.text(w.name + (w.ammo != null ? ' ' + P.ammo[P.weap] : ''), 12, 29, { size: 8, color: '#ffd84a' });
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(6, 43, 60, 14); G.text('ГРАНАТЫ ' + P.gren, 10, 46, { size: 8 });
      if (P.M.drawHud) P.M.drawHud(c, P, lv);
    },
  };
  // раскладка мостка: [x, y, пролётов, индекс пролёта с лестницей] -> куски cw9 и лестница
  // опоры под полом: по сетке мира (без двойных на стыках плит); капитель — как нарисована, ствол повторяется вниз, база — если ниже есть пол
  LAB.drawPillars = (c, M, x0, x1, FH) => {     // металлические опоры под полом (двутавр с подкосом, как ноги мостков): капитель под плитой, ствол повторяется, плита-база на полу ниже
    const im = L9.img.pilM9; if (!im) return; const F = L9D.pilM9.f, C = F[0], Sh = F[1], B = F[2], s = 0.5 * 1.1, W = C[2] * s, ch = C[3] * s, sh = Sh[3] * s, bh = B[3] * s, AX = 85 * s, seen = new Set(), bot = P.cam.y + 380;
    c.imageSmoothingEnabled = true;
    for (const r of M.solids) {
      if (r[4] === 'hide' || (r[3] < 40 && r[4] !== 'ledge') || r[0] > x1 || r[0] + r[2] < x0) continue;
      const xs = r[4] === 'ledge' ? [r[5] ?? r[0] + r[2] / 2] : []; if (!xs.length) for (let x = Math.ceil((r[0] + 40 - 150) / 300) * 300 + 150; x < r[0] + r[2] - 40; x += 300) xs.push(x);     // у уступа одна опора
      for (const x of xs) {
        if (x < x0 - 60 || x > x1 + 60 || seen.has(x + ':' + r[1])) continue; seen.add(x + ':' + r[1]);
        const y0 = r[1] + FH - 6, fb = LAB.floorBelow(M, x, r[1] + r[3] + 2, 2000, false), end = fb != null ? fb + 3 : bot, sEnd = fb != null ? end - bh + 2 : end, L = x - AX;
        if (end < y0 + 20) continue;
        for (let y = y0 + ch - 1; y < sEnd; y += sh - 1) { const hh = Math.min(sh, sEnd - y + 1); c.drawImage(im, Sh[0], Sh[1], Sh[2], Sh[3] * hh / sh, L, y, W, hh); }
        c.drawImage(im, C[0], C[1], C[2], C[3], L, y0, W, ch);
        if (fb != null) c.drawImage(im, B[0], B[1], B[2], B[3], L, end - bh, W, bh);
      }
    }
    c.imageSmoothingEnabled = false;
  };
  LAB.drawColumn = (c, x, y0, y1, k = 1) => {     // отдельная колонна во всю высоту (капитель сверху, ствол повторяется, база на полу)
    const im = L9.img.part9; if (!im) return; const F = L9D.part9.f[L9.fi('part9', 'pillar')], w = F[2] * 0.5 * k, h = F[3] * 0.5 * k, sh = 0.56 * h; c.imageSmoothingEnabled = true;
    c.drawImage(im, F[0], F[1], F[2], F[3] * 0.2, x - w / 2, y0, w, h * 0.2); const stop = y1 - h * 0.1;
    for (let y = y0 + h * 0.2 - 1; y < stop; y += sh - 1) { const hh = Math.min(sh, stop - y + 1); c.drawImage(im, F[0], F[1] + F[3] * 0.3, F[2], F[3] * 0.56 * hh / sh, x - w / 2, y, w, hh); }
    c.drawImage(im, F[0], F[1] + F[3] * 0.9, F[2], F[3] * 0.1, x - w / 2, stop, w, h * 0.1); c.imageSmoothingEnabled = false;
  };
  LAB.cwBuild = (x, y, n, lad) => {
    const g = L9D.cw9.geo, W = g.w, parts = [['endL', x]], ls = [].concat(lad ?? []), lads = []; let cx = x + W.endL;
    for (let i = 0; i < n; i++) { const nm = ls.includes(i) ? 'lad' : 'mid'; if (nm === 'lad') lads.push([Math.round(cx + g.lad), y, null]); parts.push([nm, cx]); cx += W[nm]; }
    parts.push(['endR', cx]); cx += W.endR;
    const w = [x, y, Math.round(cx - x)]; w.parts = parts; return { w, lads };
  };
  // один слой мостка: B — настил, задние перила, опоры, лестница; F — передние перила. Опора над чаном/лентой — подвес к потолку
  LAB.cwLayer = (c, M, w, L) => {
    const d = L9D.cw9, g = d.geo, im = L9.img.cw9; if (!im || !w.parts) return;
    const top = w[1] - g.feet;
    c.imageSmoothingEnabled = true;
    for (const [nm, px] of w.parts) {
      const f = d.f[L9.N.cw9[nm + L]], dw = f[2] * 0.5, x = Math.floor(px) - 0.5, lgx = px + g.legs[nm];
      const fy = LAB.floorBelow(M, lgx, w[1] + 8, 900, false), solid = fy != null && !(M.noFloor || []).some(n => lgx > n[0] - 12 && lgx < n[1] + 12) && !(M.pits || []).some(p => lgx > p[0] - 12 && lgx < p[1] + 12);
      const sy = k => f[1] + k * 2;      // логич. y внутри кадра -> пиксели листа
      if (L === 'F') { c.drawImage(im, f[0], f[1], f[2], f[3], x, top, dw + 1, f[3] * 0.5); continue; }
      if (!solid) {      // подвес над чаном: ствол опоры от настила вверх за край экрана, ног нет; над конвейером подвеса нет — настил держат соседние ноги
        const hf = d.f[L9.N.cw9.hang], hw = hf[2] * 0.5 * 0.55, hh = hf[3] * 0.5;
        if (!(M.noFloor || []).some(n => lgx > n[0] - 12 && lgx < n[1] + 12)) for (let yy = top + g.deckBot - 20 - hh; yy > (LAB.camY ?? M.y0) - 20 - hh; yy -= hh - 1) c.drawImage(im, hf[0], hf[1], hf[2], hf[3], lgx - hw / 2, yy, hw, hh);
        c.drawImage(im, f[0], f[1], f[2], g.deckBot * 2, x, top, dw + 1, g.deckBot); continue;
      }
      const floorY = fy + 5 - top, [s0, s1] = g.legStr, flo = 175.3;      // низ плит в кадре (логич.)
      if (Math.abs(floorY - flo) < 1) { c.drawImage(im, f[0], f[1], f[2], f[3], x, top, dw + 1, f[3] * 0.5); continue; }
      const mid = s1 - s0 + (floorY - flo); if (mid < 4) { c.drawImage(im, f[0], f[1], f[2], f[3], x, top, dw + 1, f[3] * 0.5); continue; }
      c.drawImage(im, f[0], sy(0), f[2], s0 * 2, x, top, dw + 1, s0);
      c.drawImage(im, f[0], sy(s0), f[2], (s1 - s0) * 2, x, top + s0 - 0.5, dw + 1, mid + 1);
      c.drawImage(im, f[0], sy(s1), f[2], f[3] - s1 * 2, x, top + s0 + mid, dw + 1, f[3] * 0.5 - s1);
    }
    c.imageSmoothingEnabled = false;
  };
  // верх сплошного блока ровно под ногами (с мостка можно спрыгнуть, со сплошного пола — нет)
  LAB.solidTop = (M, x, y) => M.solids.some(r => x >= r[0] && x < r[0] + r[2] && Math.abs(r[1] - y) < 2);
  L9.MAPS = L9.MAPS || {};
})();
