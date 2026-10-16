// Уровень 9, лаборатория: платформер как Terminator 2D (ярусы, лестницы, стрельба в 8 сторон, кувырок, приклад, гранаты, спецоружие).
// Карта — L9.MAPS[имя] (js/level9labmap.js), враги — L9.FOES (js/level9foes.js). Координаты мира логические, y вниз.
(() => {
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd;
  const GRAV = 1300, RUN = 150, JUMP = 520, PW = 13, PH = 78, PHC = 50;
  // оружие: скорострельность, урон, скорость пули, патроны (null — бесконечно), эффект
  const WEAP = {
    rifle: { name: 'АВТОМАТ', rate: 0.13, dmg: 1, sp: 640, ammo: null, fx: 'tracer' },
    pist: { name: 'ПИСТОЛЕТЫ', rate: 0.09, dmg: 1, sp: 760, ammo: 140, fx: 'tracer', dual: 1 },
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
    start(lv, ck) {
      const M = P.M = L9.MAPS.lab(); P.lv = lv;
      const cp = M.cks[ck || 0] || M.cks[0];
      Object.assign(P, { hp: 100, inv: 1.2, x: cp[0], y: cp[1], vx: 0, vy: 0, dir: 1, st: 'stand', stT: 0, onG: true, aim: 'fwd', fireT: 0, fireA: 0, rollT: 0, rollCd: 0, buttT: 0,
        climb: null, gren: 5, weap: 'rifle', ammo: {}, t: 0, ck: ck || 0, dropT: 0, cam: { x: cp[0] - 220, y: cp[1] - 250 }, bul: [], ebul: [], fx: [], foes: [], hint: null, hintT: 0, cover: false });
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
      P.lv.hurt(d); if (P.lv.dead) { P.st = 'dead'; return; }
      P.st = 'hurt'; P.stT = 0; P.vx = (fromX != null ? Math.sign(P.x - fromX) || -P.dir : -P.dir) * 120; P.vy = -180; P.onG = false; P.climb = null;
    },
    hintAt(s, t = 3) { if (P.hint !== s) { P.hint = s; P.hintT = t; } },
    update(lv, dt) {
      const I = G.Input, M = P.M; P.t += dt; P.inv -= dt; P.fireT -= dt; P.fireA -= dt; P.rollCd -= dt; P.stT += dt; P.hintT -= dt; P.dropT -= dt;
      const L = I.held('left'), R = I.held('right'), U = I.held('up'), Dn = I.held('down');
      // ---- состояния
      if (P.st === 'hurt') { if (P.stT > 0.35 && P.onG) P.st = 'stand'; }
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
          if (LAB.solidAt(M, P.x, ny - PH)) P.vy = 0; else P.y = ny;
          P.onG = false;
        }
        if (P.onG) { const lf = (M.lifts || []).find(l => P.x >= l.x && P.x < l.x + l.w && Math.abs(P.y - l.y) < 2); if (lf) P.y = lf.y; }
      }
      // пропасть / жижа
      if (P.y > M.killY) { lv.hurt(30); const c = M.cks[P.ck]; if (!lv.dead) { P.x = c[0]; P.y = c[1]; P.vy = 0; } }
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
      const tx = clamp(P.x - 320 + look, M.x0, M.x1 - 640), ty = clamp(P.y - 230, M.y0, M.y1 - 360);
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
      M.drawMid && M.drawMid(c, P);
      P.drawWorld(c);
      for (const f of P.foes) if (f.behind) f.draw(c);
      for (const f of P.foes) if (!f.behind) f.draw(c);
      P.drawValera(c);
      for (const b of P.bul) P.drawBullet(c, b);
      for (const e of P.ebul) { if (e.draw) e.draw(c, e); else S(c, 'fxL9', e.fr || 'fireball', e.x, e.y, e.s || 0.4, { rot: Math.atan2(e.vy, e.vx) }); }
      for (const f of P.fx) { const i = Math.min(f.fr.length - 1, f.t / f.life * f.fr.length | 0); S(c, f.sh, f.fr[i], f.x, f.y, f.s, { rot: f.rot || 0, add: f.add, a: f.fade ? clamp((f.life - f.t) / (f.life * 0.4), 0, 1) : 1 }); }
      M.drawFront && M.drawFront(c, P);
      c.restore();
      M.drawOver && M.drawOver(c, cx, cy, P);
      if (P.hintT > 0 && P.hint) G.text(Game.fmtHint(P.hint), 320, 46, { align: 'center', size: 8, color: '#9cf', outline: true });
    },
    drawWorld(c) {
      const M = P.M, x0 = P.cam.x - 100, x1 = P.cam.x + 740;
      // сплошные блоки пола/стен — плитка 'block' (60x52)
      for (const r of M.solids) {
        if (r[0] > x1 || r[0] + r[2] < x0 || r[4] === 'hide') continue;
        for (let x = r[0]; x < r[0] + r[2]; x += 58) for (let y = r[1]; y < Math.min(r[1] + r[3], P.cam.y + 380); y += 50) {
          if (y + 50 < P.cam.y - 20) continue;
          const w = Math.min(58, r[0] + r[2] - x); c.save(); c.beginPath(); c.rect(x, y, w, 52); c.clip(); S(c, 'plat9', 'block', x + 30, y + 26, 1); c.restore();
        }
      }
      // лестницы (за мостками)
      // лестница ровно от пола до настила: ни выше мостка, ни ниже пола
      for (const l of M.ladders) { if (l[0] < x0 || l[0] > x1) continue; c.save(); c.beginPath(); c.rect(l[0] - 24, l[1] - 2, 48, l[2] - l[1] + 2); c.clip(); for (let y = l[1] + 28; y < l[2] + 30; y += 58) S(c, 'plat9', 'ladder', l[0], y, 1); c.restore(); }
      // мостки: середина плиткой 82, по краям — законченные торцы с опорами (walkL / walkR)
      for (const w of M.walks) {
        if (w.gone || w[0] > x1 || w[0] + w[2] < x0) continue;
        // опорные колонны под концами мостка — до ближайшего пола ниже
        for (const ex of [w[0] + 12, w[0] + w[2] - 12]) { const fy = LAB.floorBelow(M, ex, w[1] + 8, 420, false) ?? 330; c.save(); c.beginPath(); c.rect(ex - 16, w[1], 32, fy - w[1]); c.clip(); for (let y = w[1] + 18; y < fy + 40; y += 35) S(c, 'plat9', 'column', ex, y, 0.6); c.restore(); }
        for (let x = w[0]; x < w[0] + w[2]; x += 82) { const ww = Math.min(82, w[0] + w[2] - x); c.save(); c.beginPath(); c.rect(x, w[1] - 30, ww, 60); c.clip(); S(c, 'plat9', 'walk', x + 42, w[1] + 15, 1); c.restore(); }
      }
      for (const l of M.lifts || []) S(c, 'plat9', 'lift', l.x + l.w / 2, l.y + 24, l.w / 53);
    },
    drawValera(c) {
      if (P.lv.dead && P.lv.dead > 0.3) { S(c, 'vClimb9', 'down', P.x, P.y, 1, { flip: P.dir < 0 }); return; }
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
      S(c, sh, fr, P.x, P.y + 1, 1, { flip: fl });
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
  // верх сплошного блока ровно под ногами (с мостка можно спрыгнуть, со сплошного пола — нет)
  LAB.solidTop = (M, x, y) => M.solids.some(r => x >= r[0] && x < r[0] + r[2] && Math.abs(r[1] - y) < 2);
  L9.MAPS = L9.MAPS || {};
})();
