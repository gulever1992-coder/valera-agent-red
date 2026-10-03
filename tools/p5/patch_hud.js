const fs = require('fs'); let s = fs.readFileSync('js/level5logic.js', 'utf8');
const a = s.indexOf("    R(c, 6, 6, 142, 30, '#0a0a0c');"), b = s.indexOf("    const boss = this.cars.find(b => b.d.boss");
if (a < 0 || b < 0) throw new Error('нет HUD');
const hud = `    // шкала здоровья копейки — как на прошлых уровнях: портрет-аватар в рамке + полоса с делениями
    const hp = U.clamp(pl.hp / pl.maxhp, 0, 1), kp = G.portraits && (hp < 0.35 ? G.portraits.kop2 : G.portraits.kop);
    R(c, 5, 5, 34, 34, '#0a0a0c'); R(c, 6, 6, 32, 32, '#c8601a'); R(c, 7, 7, 30, 30, '#3a2414');
    if (kp) { c.save(); c.beginPath(); c.rect(7, 7, 30, 30); c.clip(); c.drawImage(kp, 4, 6, 36, 36); c.restore(); }
    if (hp < 0.3 && (G.t * 4 | 0) % 2) R(c, 7, 7, 30, 30, 'rgba(220,40,40,0.35)');
    R(c, 42, 8, 124, 12, '#111'); R(c, 44, 10, 120, 8, '#3a1010');
    R(c, 44, 10, Math.round(120 * hp), 8, hp > 0.5 ? '#48c048' : hp > 0.25 ? '#e0b020' : '#e03030'); R(c, 44, 10, Math.round(120 * hp), 2, 'rgba(255,255,255,0.35)');
    for (let i = 1; i < 10; i++) R(c, 44 + i * 12, 10, 1, 8, 'rgba(0,0,0,0.4)');
    G.text('КОПЕЙКА', 42, 23, { size: 8, color: '#ffb070' });
    // оружие Вовы: патроны «Осеменителя» и газовая граната
    R(c, 172, 6, 64, 22, '#111'); R(c, 173, 7, 62, 20, '#23262b');
    Spr.drawC(c, Spr.sheets.seedcan ? 'seedcan' : 'icons4', Spr.sheets.seedcan ? 0 : 2, 186, 17, 0, 1);
    G.text('x' + Math.floor(this.ammo), 198, 13, { size: 8, color: this.ammo >= 1 ? '#fff' : '#777' });
    const gk = 1 - this.gasCd / 7;
    R(c, 240, 6, 60, 22, '#111'); R(c, 241, 7, 58, 20, '#1c2a1c'); G.text('C', 246, 13, { size: 8, color: gk >= 1 ? '#9cff40' : '#667' }); R(c, 258, 14, 36, 6, '#111'); R(c, 259, 15, Math.round(34 * gk), 4, gk >= 1 ? '#9cff40' : '#587030');
    if (pl.nitro > 0) { R(c, 42, 36, 124, 8, '#0a0a0c'); R(c, 44, 38, Math.round(120 * pl.nitro / 3.2), 4, '#60b0ff'); }
    G.text('МЕНТОВОЗОВ: ' + this.stats.kills, 172, 32, { size: 8, color: '#ffd84a' });
    G.text(Math.round(pl.speed * 0.4) + ' км/ч', 172, 43, { size: 8, color: '#c8d0d8' });
`;
s = s.slice(0, a) + hud + s.slice(b);
fs.writeFileSync('js/level5logic.js', s);
let m = fs.readFileSync('js/level5.js', 'utf8');
m = m.replace("  try { G.portraits.cop = await G.loadImage('assets/spr/p_cmd.png'); } catch (e) {}", "  for (const k of ['cop', 'cop2', 'kop', 'kop2']) { try { G.portraits[k] = await G.loadImage('assets/spr/p_' + k + '.png'); } catch (e) {} }");
fs.writeFileSync('js/level5.js', m);
console.log('ok');
