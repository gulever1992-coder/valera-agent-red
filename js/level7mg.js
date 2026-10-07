'use strict';
// ============ УРОВЕНЬ 7: мини-игры (щиток камер — провода, пульт лазеров — тумблеры по схеме, кодовый замок) ============
// Интерфейс мини-игр рисуется кодом (это UI, как HUD).
L7.MG = class {
  constructor(kind, run) {
    this.kind = kind; this.run = run; this.t = 0; this.msg = ''; this.msgT = 0; this.done = 0;
    if (kind === 'wires') {
      this.cols = ['#e83030', '#3080f0', '#f0d020'];
      this.right = [0, 1, 2].sort(() => Math.random() - 0.5);
      this.link = [-1, -1, -1]; this.sel = 0; this.stage = 'L'; this.pick = -1; this.rsel = 0; this.err = 0;
    }
    if (kind === 'lasers') {   // 4 тумблера; схема на стене: какие лучи от каких тумблеров. Цель — все лучи погашены
      this.map = [[0, 1], [1, 2], [2, 3], [0, 3]];   // тумблер i переключает лучи map[i]
      this.beam = [true, true, true, true]; this.sw = [0, 0, 0, 0]; this.sel = 0;
      this.toggle(0, true); this.toggle(1, true);   // старт: горят Л2 и Л4 — решение в два щелчка
    }
    if (kind === 'code') { this.dig = [0, 0, 0, 0]; this.sel = 0; }
  }
  toggle(i, silent) { this.sw[i] ^= 1; for (const b of this.map[i]) this.beam[b] = !this.beam[b]; if (!silent) Sound.play('lever'); }
  say(m, t = 1.2) { this.msg = m; this.msgT = t; }
  update(dt, I) {
    this.t += dt; if (this.msgT > 0) this.msgT -= dt;
    if (this.done) { this.done -= dt; return this.done <= 0 ? 'ok' : null; }
    if (I.pressed('throw') || I.pressed('pause')) { I.hit.pause = false; return 'quit'; }
    const ok = I.pressed('jump') || I.pressed('punch');
    if (this.kind === 'wires') {
      if (this.stage === 'L') {
        if (I.pressed('up')) this.sel = (this.sel + 2) % 3;
        if (I.pressed('down')) this.sel = (this.sel + 1) % 3;
        if (ok && this.link[this.sel] < 0) { this.pick = this.sel; this.stage = 'R'; Sound.play('select'); }
      } else {
        if (I.pressed('up')) this.rsel = (this.rsel + 2) % 3;
        if (I.pressed('down')) this.rsel = (this.rsel + 1) % 3;
        if (I.pressed('left')) this.stage = 'L';
        if (ok) {
          if (this.right[this.rsel] === this.pick && !this.link.includes(this.rsel)) { this.link[this.pick] = this.rsel; Sound.play('confirm'); this.stage = 'L'; if (!this.link.includes(-1)) { this.say('КАМЕРЫ ОБЕСТОЧЕНЫ!'); this.done = 1.1; } else this.sel = this.link.indexOf(-1); }
          else { this.err++; Sound.play('zap'); G.shake(3, 0.2); G.flash(0.08, '#fff'); this.say('БЗЗЗТ! НЕ ТОТ ПРОВОД', 1); this.stage = 'L';
            if (this.err >= 3) { this.err = 0; this.link = [-1, -1, -1]; this.right.sort(() => Math.random() - 0.5); this.run.player.hp = Math.max(1, this.run.player.hp - 8); this.say('УДАРИЛО ТОКОМ! ВСЁ ЗАНОВО', 1.6); } }
        }
      }
    }
    if (this.kind === 'lasers') {
      if (I.pressed('left')) this.sel = (this.sel + 3) % 4;
      if (I.pressed('right')) this.sel = (this.sel + 1) % 4;
      if (ok) { this.toggle(this.sel); if (!this.beam.includes(true)) { this.say('ВСЕ ЛУЧИ ПОГАШЕНЫ!'); Sound.play('confirm'); this.done = 1.1; } }
    }
    if (this.kind === 'code') {
      if (I.pressed('left')) this.sel = (this.sel + 3) % 4;
      if (I.pressed('right')) this.sel = (this.sel + 1) % 4;
      if (I.pressed('up')) { this.dig[this.sel] = (this.dig[this.sel] + 1) % 10; Sound.play('blip', 500); }
      if (I.pressed('down')) { this.dig[this.sel] = (this.dig[this.sel] + 9) % 10; Sound.play('blip', 400); }
      if (ok) { if (this.dig.join('') === this.run.code) { this.say('ДОСТУП РАЗРЕШЁН'); Sound.play('lever'); this.done = 0.9; } else { this.say('ДОСТУП ЗАПРЕЩЁН', 1.4); Sound.play('warn'); } }
    }
    return null;
  }
  draw(c) {
    const R = Art.R, bx = 140, by = 70, bw = 360, bh = 220;
    c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, W, H);
    R(c, bx - 3, by - 3, bw + 6, bh + 6, '#0a0a0c'); R(c, bx, by, bw, bh, '#262a30'); R(c, bx, by, bw, 3, '#c8a020');
    const title = { wires: 'ЩИТОК КАМЕР НАБЛЮДЕНИЯ', lasers: 'ПУЛЬТ ЛАЗЕРНОЙ ЗАЩИТЫ', code: 'ГЛАВНЫЙ ЗАЛ. ВВЕДИТЕ КОД' }[this.kind];
    G.text(title, W / 2, by + 10, { align: 'center', color: '#ffd84a' });
    if (this.kind === 'wires') {
      for (let i = 0; i < 3; i++) {
        const y = by + 56 + i * 40;
        R(c, bx + 30, y, 40, 12, this.cols[i]); R(c, bx + bw - 70, y, 40, 12, this.cols[this.right[i]]);
        if (this.stage === 'L' && this.sel === i) R(c, bx + 16, y + 2, 8, 8, '#fff');
        if (this.stage === 'R' && this.rsel === i) R(c, bx + bw - 24, y + 2, 8, 8, '#fff');
        if (this.pick === i && this.stage === 'R') R(c, bx + 30, y - 2, 40, 2, '#fff');
        if (this.link[i] >= 0) { c.strokeStyle = this.cols[i]; c.lineWidth = 4; c.beginPath(); c.moveTo(bx + 70, y + 6); c.bezierCurveTo(W / 2, y + 6, W / 2, by + 62 + this.link[i] * 40, bx + bw - 70, by + 62 + this.link[i] * 40); c.stroke(); }
      }
      G.text(Game.fmtHint(this.stage === 'L' ? 'Провод слева {up}/{down}, {jump} — взять' : 'Куда подключить? {up}/{down}, {jump}'), W / 2, by + 186, { align: 'center', size: 8, color: '#9aa0a8' });
    }
    if (this.kind === 'lasers') {
      // схема: тумблер -> лучи
      G.text('СХЕМА: тумблер переключает два луча', W / 2, by + 28, { align: 'center', size: 8, color: '#9aa0a8' });
      for (let b = 0; b < 4; b++) { const x = bx + 70 + b * 74; R(c, x - 2, by + 44, 6, 60, '#111'); if (this.beam[b]) { R(c, x, by + 44, 2, 60, '#ff4040'); R(c, x - 2, by + 44, 6, 60, 'rgba(255,40,40,0.25)'); } G.text('Л' + (b + 1), x + 1, by + 108, { align: 'center', size: 8, color: this.beam[b] ? '#ff8a8a' : '#556' }); }
      for (let i = 0; i < 4; i++) {
        const x = bx + 70 + i * 74, y = by + 132;
        R(c, x - 14, y, 30, 34, this.sel === i ? '#ffd84a' : '#111'); R(c, x - 12, y + 2, 26, 30, '#3a4048');
        R(c, x - 3, y + (this.sw[i] ? 6 : 18), 8, 10, this.sw[i] ? '#8cf08c' : '#c8d0d8');
        G.text(this.map[i].map(b => 'Л' + (b + 1)).join('+'), x + 1, y + 38, { align: 'center', size: 8, color: '#9aa0a8' });
      }
      G.text(Game.fmtHint('Стрелки — выбор, {jump} — щёлкнуть. Погаси все лучи.'), W / 2, by + 192, { align: 'center', size: 8, color: '#9aa0a8' });
    }
    if (this.kind === 'code') {
      for (let i = 0; i < 4; i++) {
        const x = W / 2 - 100 + i * 52, y = by + 66;
        R(c, x - 2, y - 2, 34, 44, this.sel === i ? '#ffd84a' : '#111'); R(c, x, y, 30, 40, '#14161a');
        G.text(String(this.dig[i]), x + 15, y + 12, { align: 'center', size: 16, color: '#8cf08c' });
      }
      G.text('Код из записки: ' + this.run.code, W / 2, by + 140, { align: 'center', size: 8, color: '#c8d0d8' });
      G.text(Game.fmtHint('{up}/{down} цифра, стрелки — выбор, {jump} — ввод'), W / 2, by + 164, { align: 'center', size: 8, color: '#9aa0a8' });
    }
    if (this.msgT > 0) G.text(this.msg, W / 2, by + bh - 34, { align: 'center', color: this.done ? '#8cf08c' : '#ff8a6a', outline: true });
    G.text(Game.fmtHint('{throw} — отойти'), bx + bw - 8, by + bh - 14, { align: 'right', size: 8, color: '#777' });
  }
};
