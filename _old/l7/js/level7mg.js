'use strict';
// ============ УРОВЕНЬ 7: мини-игры (сейф, проводка щитка, пульт камер «повтори») ============
// UI мини-игр рисуется кодом (интерфейс), как HUD.
L7.MG = class {
  constructor(kind, run) {
    this.kind = kind; this.run = run; this.t = 0; this.msg = ''; this.msgT = 0; this.done = 0;
    if (kind === 'safe') { this.dig = [0, 0, 0]; this.sel = 0; }
    if (kind === 'wires') {
      this.cols = ['#e83030', '#3080f0', '#f0d020', '#40c040'];
      this.right = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      this.link = [-1, -1, -1, -1]; this.sel = 0; this.stage = 'L'; this.pick = -1; this.rsel = 0; this.err = 0;
    }
    if (kind === 'simon') { this.newSeq(); }
  }
  newSeq() { this.seq = Array.from({ length: 6 }, () => U.choice(['up', 'down', 'left', 'right'])); this.pos = 0; this.show = 0; this.phase = 'show'; this.st = -0.5; }
  say(m, t = 1.2) { this.msg = m; this.msgT = t; }
  update(dt, I) {
    this.t += dt; if (this.msgT > 0) this.msgT -= dt;
    if (this.done) { this.done -= dt; return this.done <= 0 ? 'ok' : null; }
    if (I.pressed('throw') || I.pressed('pause')) { I.hit.pause = false; return 'quit'; }
    const ok = I.pressed('jump') || I.pressed('punch');
    if (this.kind === 'safe') {
      if (I.pressed('left')) this.sel = (this.sel + 2) % 3;
      if (I.pressed('right')) this.sel = (this.sel + 1) % 3;
      if (I.pressed('up')) { this.dig[this.sel] = (this.dig[this.sel] + 1) % 10; Sound.play('blip', 500); }
      if (I.pressed('down')) { this.dig[this.sel] = (this.dig[this.sel] + 9) % 10; Sound.play('blip', 400); }
      if (ok) {
        if (this.dig.join('') === this.run.code) { this.say('ОТКРЫТО!'); Sound.play('lever'); this.done = 0.9; }
        else { this.say(this.run.flags.note ? 'НЕВЕРНО' : 'НЕВЕРНО. КОД ГДЕ-ТО ЗАПИСАН...', 1.6); Sound.play('warn'); }
      }
    }
    if (this.kind === 'wires') {
      if (this.stage === 'L') {
        if (I.pressed('up')) this.sel = (this.sel + 3) % 4;
        if (I.pressed('down')) this.sel = (this.sel + 1) % 4;
        if (ok && this.link[this.sel] < 0) { this.pick = this.sel; this.stage = 'R'; Sound.play('select'); }
      } else {
        if (I.pressed('up')) this.rsel = (this.rsel + 3) % 4;
        if (I.pressed('down')) this.rsel = (this.rsel + 1) % 4;
        if (I.pressed('left')) this.stage = 'L';
        if (ok) {
          if (this.right[this.rsel] === this.pick && !this.link.includes(this.rsel)) { this.link[this.pick] = this.rsel; Sound.play('confirm'); this.stage = 'L'; if (!this.link.includes(-1)) { this.say('ЩИТОК ОБЕСТОЧЕН!'); this.done = 1.1; } else this.sel = this.link.indexOf(-1); }
          else { this.err++; Sound.play('zap'); G.shake(3, 0.2); G.flash(0.08, '#fff'); this.say('БЗЗЗТ! НЕ ТОТ ПРОВОД', 1); this.stage = 'L';
            if (this.err >= 3) { this.err = 0; this.link = [-1, -1, -1, -1]; this.right.sort(() => Math.random() - 0.5); this.run.player.hp = Math.max(1, this.run.player.hp - 8); this.say('УДАРИЛО ТОКОМ! ВСЁ ЗАНОВО', 1.6); } }
        }
      }
    }
    if (this.kind === 'simon') {
      if (this.phase === 'show') {
        this.st += dt;
        const i = Math.floor(this.st / 0.6);
        if (this.st >= 0 && i !== this.lastI && i < this.seq.length) { this.lastI = i; Sound.play('blip', { up: 600, down: 300, left: 400, right: 500 }[this.seq[i]]); }
        if (i >= this.seq.length) { this.phase = 'input'; this.lastI = -1; }
      } else {
        for (const k of ['up', 'down', 'left', 'right']) if (I.pressed(k)) {
          this.flashK = k; this.flashT = 0.2;
          if (k === this.seq[this.pos]) { this.pos++; Sound.play('blip', { up: 600, down: 300, left: 400, right: 500 }[k]); if (this.pos >= this.seq.length) { this.say('КАМЕРЫ ОТКЛЮЧЕНЫ!'); this.done = 1.1; } }
          else { Sound.play('warn'); this.say('ОШИБКА! СМОТРИ ЕЩЁ РАЗ', 1.4); this.newSeq(); this.lastI = -1; }
          break;
        }
      }
      if (this.flashT > 0) this.flashT -= dt;
    }
    return null;
  }
  draw(c) {
    const R = Art.R, bx = 140, by = 70, bw = 360, bh = 220;
    c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, W, H);
    R(c, bx - 3, by - 3, bw + 6, bh + 6, '#0a0a0c'); R(c, bx, by, bw, bh, '#262a30'); R(c, bx, by, bw, 3, '#c8a020');
    const title = { safe: 'СЕЙФ ЗАМ. ЗАМ. ДИРЕКТОРА', wires: 'ЩИТОК ЛАЗЕРОВ 2 ЭТАЖА', simon: 'ПУЛЬТ КАМЕР 1 ЭТАЖА' }[this.kind];
    G.text(title, W / 2, by + 10, { align: 'center', color: '#ffd84a' });
    if (this.kind === 'safe') {
      for (let i = 0; i < 3; i++) {
        const x = W / 2 - 75 + i * 60, y = by + 70;
        R(c, x - 2, y - 2, 34, 44, this.sel === i ? '#ffd84a' : '#111'); R(c, x, y, 30, 40, '#14161a');
        G.text(String(this.dig[i]), x + 15, y + 12, { align: 'center', size: 16, color: '#8cf08c' });
        if (this.sel === i && (this.t * 3 | 0) % 2) { G.text('+', x + 15, y - 14, { align: 'center' }); G.text('-', x + 15, y + 46, { align: 'center' }); }
      }
      G.text(this.run.flags.note ? 'Код с календаря: ' + this.run.code : 'Кода нет... Может, записан где-то рядом?', W / 2, by + 150, { align: 'center', size: 8, color: '#c8d0d8' });
      G.text(Game.fmtHint('{up}/{down} цифра, стрелки — выбор, {jump} — открыть'), W / 2, by + 170, { align: 'center', size: 8, color: '#9aa0a8' });
    }
    if (this.kind === 'wires') {
      for (let i = 0; i < 4; i++) {
        const y = by + 46 + i * 34;
        R(c, bx + 30, y, 40, 12, this.cols[i]); R(c, bx + bw - 70, y, 40, 12, this.cols[this.right[i]]);
        if (this.stage === 'L' && this.sel === i) R(c, bx + 16, y + 2, 8, 8, '#fff');
        if (this.stage === 'R' && this.rsel === i) R(c, bx + bw - 24, y + 2, 8, 8, '#fff');
        if (this.pick === i && this.stage === 'R') R(c, bx + 30, y - 2, 40, 2, '#fff');
        if (this.link[i] >= 0) { c.strokeStyle = this.cols[i]; c.lineWidth = 4; c.beginPath(); c.moveTo(bx + 70, y + 6); c.bezierCurveTo(W / 2, y + 6, W / 2, by + 52 + this.link[i] * 34, bx + bw - 70, by + 52 + this.link[i] * 34); c.stroke(); }
      }
      G.text(Game.fmtHint(this.stage === 'L' ? 'Выбери провод слева {up}/{down}, {jump}' : 'Куда подключить? {up}/{down}, {jump}'), W / 2, by + 186, { align: 'center', size: 8, color: '#9aa0a8' });
    }
    if (this.kind === 'simon') {
      const pos = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }, lab = { up: 'ВВЕРХ', down: 'ВНИЗ', left: 'ВЛЕВО', right: 'ВПРАВО' };
      const i = Math.floor(this.st / 0.6), lit = this.phase === 'show' && this.st >= 0 && (this.st % 0.6) < 0.42 ? this.seq[i] : (this.flashT > 0 ? this.flashK : null);
      for (const k in pos) { const x = W / 2 + pos[k][0] * 58 - 26, y = by + 96 + pos[k][1] * 40 - 14; R(c, x - 2, y - 2, 56, 32, '#111'); R(c, x, y, 52, 28, lit === k ? '#ffd84a' : '#3a4048'); G.text(lab[k], x + 26, y + 10, { align: 'center', size: 8, color: lit === k ? '#111' : '#c8d0d8' }); }
      G.text(this.phase === 'show' ? 'ЗАПОМИНАЙ...' : 'ПОВТОРИ: ' + this.pos + '/' + this.seq.length, W / 2, by + 30, { align: 'center', size: 8, color: '#c8d0d8' });
    }
    if (this.msgT > 0) G.text(this.msg, W / 2, by + bh - 34, { align: 'center', color: this.done ? '#8cf08c' : '#ff8a6a', outline: true });
    G.text(Game.fmtHint('{throw} — отойти'), bx + bw - 8, by + bh - 14, { align: 'right', size: 8, color: '#777' });
  }
};
