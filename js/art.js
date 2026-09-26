'use strict';
// ============ ГРАФИКА: фоны Северодвинска/Севмаша, пропсы, предметы ============
const Art = {};
G.Art = Art;
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
Art.R = R;

// ---------- облака ----------
function clouds(c, w, y0, y1, rnd, cols) {
  for (let layer = 0; layer < cols.length; layer++) {
    c.fillStyle = cols[layer];
    const n = Math.floor(w / 30);
    for (let i = 0; i < n; i++) {
      const x = rnd() * w, y = y0 + (y1 - y0) * (layer / cols.length) + rnd() * 30;
      const r = 14 + rnd() * 26;
      c.beginPath(); c.ellipse(x, y, r * 1.8, r * 0.7, 0, 0, Math.PI * 2); c.fill();
    }
  }
}

// ---------- панельная пятиэтажка/девятиэтажка ----------
Art.panelHouse = function (c, x, y, w, floors, col, win, rnd, fh = 9) {
  const h = floors * fh + 4;
  R(c, x, y - h, w, h, col);
  R(c, x, y - h, w, 2, '#3a3e44');
  for (let f = 0; f < floors; f++) {
    for (let wx = x + 3; wx < x + w - 4; wx += 7) {
      const lit = rnd() < 0.12;
      R(c, wx, y - h + 3 + f * fh, fh < 8 ? 3 : 4, fh < 8 ? 3 : 5, lit ? '#d8c890' : win);
    }
  }
  // швы панелей
  c.fillStyle = 'rgba(0,0,0,0.15)';
  for (let f = 1; f < floors; f++) c.fillRect(x, y - h + 2 + f * fh, w, 1);
};

// ---------- подводная лодка (сбоку, в духе «Борея») ----------
Art.submarine = function (c, x, y, len, s = 1, withBottom = true) {
  const hh = 34 * s;
  c.save(); c.translate(x, y);
  const hull = '#1b1d22', hl = '#2f343c', dark = '#101114';
  // корпус
  c.fillStyle = dark;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(-4 * s, -hh * 0.9, 40 * s, -hh);
  c.lineTo(len * 0.62, -hh);
  c.quadraticCurveTo(len * 0.85, -hh * 0.95, len, -hh * 0.35);
  c.lineTo(len, -hh * 0.1);
  c.quadraticCurveTo(len * 0.8, hh * 0.35, len * 0.5, hh * 0.35);
  c.lineTo(40 * s, hh * 0.35);
  c.quadraticCurveTo(0, hh * 0.3, 0, 0);
  c.fill();
  c.fillStyle = hull;
  c.beginPath();
  c.moveTo(2 * s, 0);
  c.quadraticCurveTo(-2 * s, -hh * 0.85, 40 * s, -hh + 2 * s);
  c.lineTo(len * 0.62, -hh + 2 * s);
  c.quadraticCurveTo(len * 0.84, -hh * 0.92, len - 2 * s, -hh * 0.35);
  c.lineTo(len - 2 * s, -hh * 0.12);
  c.quadraticCurveTo(len * 0.8, hh * 0.3, len * 0.5, hh * 0.3);
  c.lineTo(40 * s, hh * 0.3);
  c.quadraticCurveTo(2 * s, hh * 0.25, 2 * s, 0);
  c.fill();
  // блик
  c.fillStyle = hl; c.fillRect(40 * s, -hh + 4 * s, len * 0.55, 2 * s);
  // горб ракетной палубы
  c.fillStyle = hull; c.beginPath(); c.moveTo(len * 0.22, -hh + 1); c.quadraticCurveTo(len * 0.25, -hh - 9 * s, len * 0.32, -hh - 9 * s); c.lineTo(len * 0.58, -hh - 9 * s); c.quadraticCurveTo(len * 0.63, -hh - 8 * s, len * 0.66, -hh + 1); c.fill();
  c.fillStyle = dark;
  for (let i = 0; i < 8; i++) c.fillRect(len * 0.33 + i * len * 0.031, -hh - 8 * s, len * 0.02, 1 * s);
  // рубка
  const rx = len * 0.62;
  c.fillStyle = dark; c.beginPath(); c.moveTo(rx, -hh - 8 * s); c.lineTo(rx + 8 * s, -hh - 38 * s); c.lineTo(rx + 48 * s, -hh - 40 * s); c.lineTo(rx + 58 * s, -hh - 8 * s); c.fill();
  c.fillStyle = hull; c.beginPath(); c.moveTo(rx + 2 * s, -hh - 8 * s); c.lineTo(rx + 9 * s, -hh - 36 * s); c.lineTo(rx + 46 * s, -hh - 38 * s); c.lineTo(rx + 55 * s, -hh - 8 * s); c.fill();
  c.fillStyle = hl; c.fillRect(rx + 10 * s, -hh - 35 * s, 34 * s, 1.5 * s);
  // рули на рубке
  c.fillStyle = dark; c.fillRect(rx + 16 * s, -hh - 26 * s, 36 * s, 3 * s);
  // перископы
  c.fillStyle = '#0c0d10'; c.fillRect(rx + 22 * s, -hh - 50 * s, 2 * s, 12 * s); c.fillRect(rx + 30 * s, -hh - 46 * s, 2 * s, 8 * s);
  // корма и винт
  c.fillStyle = dark; c.beginPath(); c.moveTo(10 * s, -hh * 0.6); c.lineTo(-10 * s, -hh * 1.25); c.lineTo(-4 * s, -hh * 1.25); c.lineTo(22 * s, -hh * 0.8); c.fill();
  // красное днище
  if (withBottom) { c.fillStyle = '#5a1a18'; c.fillRect(40 * s, hh * 0.12, len * 0.45, hh * 0.18); }
  // люки и сварные швы
  c.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 1; i < 12; i++) c.fillRect(i * len / 12, -hh + 3 * s, 1, hh * 1.2);
  c.restore();
};

// ---------- портальный кран (как на причалах Севмаша) ----------
Art.portalCrane = function (c, x, y, s, col = '#b8342e') {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = col; c.lineWidth = 2;
  // портал-ноги
  c.beginPath(); c.moveTo(-14, 0); c.lineTo(-8, -26); c.moveTo(14, 0); c.lineTo(8, -26); c.stroke();
  R(c, -10, -30, 20, 6, col);
  R(c, -8, -44, 16, 14, '#d8d4c8');
  R(c, -6, -42, 5, 4, '#445');
  // стрела
  c.lineWidth = 2; c.strokeStyle = col;
  c.beginPath(); c.moveTo(4, -40); c.lineTo(52, -92); c.stroke();
  c.lineWidth = 1; c.beginPath(); c.moveTo(-2, -44); c.lineTo(50, -94); c.stroke();
  c.strokeStyle = '#222'; c.beginPath(); c.moveTo(52, -92); c.lineTo(52, -50); c.stroke();
  R(c, 50, -50, 4, 3, '#222');
  // противовес
  R(c, -16, -46, 10, 8, '#555');
  c.restore();
};

// ---------- аэро-вид Севмаша (катсцена «день первый») ----------
Art.buildAerial = function () {
  const Wd = 1100;
  const [cv, c] = G.makeCanvas(Wd, H);
  const rnd = U.seeded(55);
  const g = c.createLinearGradient(0, 0, 0, 170);
  g.addColorStop(0, '#3b4148'); g.addColorStop(1, '#8a939a');
  c.fillStyle = g; c.fillRect(0, 0, Wd, 170);
  clouds(c, Wd, 10, 110, rnd, ['#4a5058', '#565d65', '#646b73', '#70777e']);
  // далёкий берег, дома
  R(c, 0, 150, Wd, 30, '#5d646a');
  for (let x = 0; x < Wd; x += 18 + rnd() * 30) {
    Art.panelHouse(c, x, 168, 18 + rnd() * 20, rnd() < 0.25 ? 9 : 5, rnd() < 0.5 ? '#79808a' : '#838a92', '#646c76', rnd, 5);
  }
  c.fillStyle = 'rgba(138,147,154,0.35)'; c.fillRect(0, 100, Wd, 70);
  // трубы ТЭЦ-2 в красно-белую полоску
  [[150, 1], [168, 1], [860, 0.85], [880, 0.85]].forEach(([x, s]) => {
    const h = 110 * s;
    for (let i = 0; i < 8; i++) R(c, x, 168 - h + i * h / 8, 7 * s, h / 8 + 1, i % 2 ? '#d8d0c8' : '#a8352e');
  });
  // земля
  R(c, 0, 176, Wd, 64, '#51524e');
  for (let i = 0; i < 60; i++) R(c, rnd() * Wd, 178 + rnd() * 55, 6 + rnd() * 30, 2, '#b8bcc0');
  // Никольская церковь (на территории завода)
  (function church(x, y) {
    R(c, x, y - 34, 30, 34, '#d8d4c8'); R(c, x + 30, y - 22, 16, 22, '#cfcabe');
    R(c, x + 6, y - 28, 4, 8, '#5a5e66'); R(c, x + 18, y - 28, 4, 8, '#5a5e66');
    c.fillStyle = '#3e4a44'; c.beginPath(); c.ellipse(x + 15, y - 40, 10, 9, 0, Math.PI, 0); c.fill();
    R(c, x + 14, y - 58, 2, 10, '#c8b060'); R(c, x + 11, y - 54, 8, 2, '#c8b060');
    R(c, x + 34, y - 34, 8, 12, '#d8d4c8'); c.beginPath(); c.ellipse(x + 38, y - 35, 5, 5, 0, Math.PI, 0); c.fill();
  })(70, 236);
  // цеха с «пилой» (шедовые крыши)
  for (let x = 120; x < 390; x += 90) {
    R(c, x, 190, 84, 48, '#7c8286');
    for (let k = 0; k < 6; k++) { c.fillStyle = '#62686c'; c.beginPath(); c.moveTo(x + k * 14, 190); c.lineTo(x + k * 14 + 14, 178); c.lineTo(x + k * 14 + 14, 190); c.fill(); R(c, x + k * 14 + 12, 179, 2, 11, '#a8b4bc'); }
    for (let wx = x + 4; wx < x + 80; wx += 8) R(c, wx, 200, 5, 10, '#4c545a');
  }
  // гигантский эллинг — цех 55
  const hx = 400, hy = 238, hw = 470, hh = 140;
  R(c, hx - 6, hy - hh - 8, hw + 12, 10, '#50565c');
  R(c, hx, hy - hh, hw, hh, '#8b9398');
  for (let x = hx; x < hx + hw; x += 10) R(c, x, hy - hh, 2, hh, '#7a8288');
  R(c, hx, hy - hh, hw, 6, '#5f666c');
  // ворота эллинга
  [[hx + 30, 120], [hx + 180, 130], [hx + 340, 110]].forEach(([gx, gw]) => {
    R(c, gx - 4, hy - 112, gw + 8, 112, '#5f666c');
    R(c, gx, hy - 108, gw, 108, '#2a2e33');
    for (let y = hy - 104; y < hy; y += 8) R(c, gx, y, gw, 1, '#3a3f45');
  });
  // нос лодки выглядывает из ворот
  R(c, hx + 190, hy - 34, 110, 34, '#15171a');
  c.fillStyle = '#15171a'; c.beginPath(); c.ellipse(hx + 300, hy - 17, 20, 17, 0, -Math.PI / 2, Math.PI / 2); c.fill();
  // надпись
  c.font = '16px "Press Start 2P", monospace'; c.textBaseline = 'top';
  c.fillStyle = '#9c2a26'; c.fillText('СЕВМАШ', hx + 170, hy - hh + 12);
  // снег на крыше
  R(c, hx - 6, hy - hh - 10, hw + 12, 3, '#dfe3e6');
  // портальные краны вдоль причала
  [[330, 1.1, '#b8342e'], [560, 1.25, '#c8a020'], [700, 1.1, '#b8342e'], [930, 1.3, '#b8342e'], [1010, 1.0, '#c8a020']].forEach(([x, s, col]) => Art.portalCrane(c, x, 242, s, col));
  // причал
  R(c, 0, 238, Wd, 6, '#6c6e6c'); R(c, 0, 244, Wd, 3, '#3e4040');
  // вода
  const wg = c.createLinearGradient(0, 247, 0, H);
  wg.addColorStop(0, '#3b4750'); wg.addColorStop(1, '#232b31');
  c.fillStyle = wg; c.fillRect(0, 247, Wd, H - 247);
  // отражения
  c.globalAlpha = 0.18;
  c.save(); c.translate(0, 247 * 2 + 4); c.scale(1, -1); c.drawImage(cv, 0, 100, Wd, 147, 0, 100, Wd, 147); c.restore();
  c.globalAlpha = 1;
  for (let i = 0; i < 160; i++) R(c, rnd() * Wd, 250 + rnd() * 110, 6 + rnd() * 20, 1, rnd() < 0.5 ? '#56646e' : '#1c2328');
  // лодка у причала + буксир
  Art.submarine(c, 560, 292, 300, 0.9, false);
  (function tug(x, y) {
    R(c, x, y - 8, 46, 8, '#1f2b36'); R(c, x + 4, y - 3, 40, 3, '#8a2a24'); R(c, x + 12, y - 18, 18, 10, '#d8d4c8'); R(c, x + 14, y - 16, 4, 3, '#3a4650'); R(c, x + 22, y - 26, 4, 8, '#222');
  })(220, 318);
  // лёд/снег у причала
  for (let i = 0; i < 40; i++) R(c, rnd() * Wd, 247 + rnd() * 6, 10 + rnd() * 30, 2, '#b8c2c8');
  return cv;
};

// ---------- фон внутри цеха (для катсцены со стропами) ----------
Art.buildHallScene = function () {
  const [cv, c] = G.makeCanvas(W, H);
  const rnd = U.seeded(7);
  R(c, 0, 0, W, H, '#3a3f45');
  // окна-ленты
  for (let x = 0; x < W; x += 64) {
    R(c, x + 6, 70, 52, 90, '#5a646c');
    for (let wy = 72; wy < 158; wy += 14) for (let wx = x + 8; wx < x + 56; wx += 12) R(c, wx, wy, 10, 12, rnd() < 0.1 ? '#23282c' : rnd() < 0.5 ? '#8894a0' : '#98a4ae');
  }
  // фермы крыши
  R(c, 0, 0, W, 34, '#24282d');
  c.strokeStyle = '#4a5058'; c.lineWidth = 2;
  for (let x = 0; x < W; x += 40) { c.beginPath(); c.moveTo(x, 34); c.lineTo(x + 20, 10); c.lineTo(x + 40, 34); c.stroke(); }
  R(c, 0, 32, W, 4, '#4a5058'); R(c, 0, 8, W, 3, '#4a5058');
  // колонны
  for (let x = 20; x < W; x += 150) {
    R(c, x, 36, 16, 270, '#4c5258'); R(c, x + 2, 36, 3, 270, '#5c636a'); R(c, x + 13, 36, 3, 270, '#3a3f45');
    for (let y = 50; y < 300; y += 24) R(c, x + 7, y, 2, 2, '#2a2e33');
  }
  // лозунг
  R(c, 60, 176, 230, 22, '#8c2420'); R(c, 60, 176, 230, 2, '#a83430');
  c.font = '8px "Press Start 2P", monospace'; c.textBaseline = 'top'; c.fillStyle = '#e8dcc0';
  c.fillText('СЛАВА КОРАБЕЛАМ!', 78, 184);
  // плакат ТБ
  R(c, 30, 214, 44, 56, '#d8cfb4'); R(c, 34, 218, 36, 20, '#b8342e'); R(c, 34, 244, 36, 3, '#333'); R(c, 34, 250, 28, 3, '#333'); R(c, 34, 256, 32, 3, '#333');
  // пол
  R(c, 0, 300, W, 60, '#4a4744');
  for (let x = 0; x < W; x += 80) R(c, x, 300, 1, 60, '#3a3835');
  R(c, 0, 318, W, 3, '#c8a020');
  for (let i = 0; i < 40; i++) R(c, rnd() * W, 302 + rnd() * 56, 4 + rnd() * 14, 1, '#3c3a37');
  // кильблоки
  for (let x = 300; x < 640; x += 70) { R(c, x, 280, 30, 20, '#5a4a3a'); R(c, x, 280, 30, 2, '#6a5a4a'); }
  return cv;
};

// ---------- мостовой кран (для катсцены) ----------
Art.drawOverheadCrane = function (c, hookY, trolleyX) {
  // мост
  R(c, 0, 40, W, 20, '#1a1a1a'); R(c, 0, 41, W, 18, '#d8a820');
  for (let x = 0; x < W; x += 24) { c.fillStyle = '#1a1a1a'; c.beginPath(); c.moveTo(x, 59); c.lineTo(x + 12, 41); c.lineTo(x + 16, 41); c.lineTo(x + 4, 59); c.fill(); }
  R(c, 0, 58, W, 3, '#8a6a10');
  // тележка
  R(c, trolleyX - 30, 28, 60, 14, '#1a1a1a'); R(c, trolleyX - 28, 30, 56, 10, '#e0b428'); R(c, trolleyX - 20, 32, 14, 6, '#3a3a3a');
  // тросы
  R(c, trolleyX - 4, 60, 1, hookY - 60, '#2a2a2a'); R(c, trolleyX + 3, 60, 1, hookY - 60, '#2a2a2a');
  // крюк
  R(c, trolleyX - 9, hookY, 18, 12, '#1a1a1a'); R(c, trolleyX - 7, hookY + 2, 14, 8, '#e0b428');
  c.strokeStyle = '#1a1a1a'; c.lineWidth = 4; c.beginPath(); c.arc(trolleyX, hookY + 20, 7, -Math.PI / 2, Math.PI * 0.9); c.stroke();
  c.strokeStyle = '#8a8a8a'; c.lineWidth = 2; c.beginPath(); c.arc(trolleyX, hookY + 20, 7, -Math.PI / 2, Math.PI * 0.9); c.stroke();
};

// ---------- каска на полу / кирпич и т.п. (иконки предметов) ----------
Art.item = function (c, kind, x, y, rot = 0, s = 1) {
  c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(rot); c.scale(s, s);
  switch (kind) {
    case 'brick': R(c, -7, -4, 14, 8, '#1a0f0c'); R(c, -6, -3, 12, 6, '#a8452e'); R(c, -6, -3, 12, 1, '#c8664a'); R(c, -1, -3, 1, 6, '#7a2e1e'); break;
    case 'bolt': R(c, -2, -5, 5, 10, '#1a1a1a'); R(c, -1, -4, 3, 8, '#8a939c'); R(c, -4, -6, 9, 3, '#1a1a1a'); R(c, -3, -6, 7, 2, '#aab4bc'); break;
    case 'wrench': R(c, -2, -8, 4, 16, '#1a1a1a'); R(c, -1, -7, 2, 14, '#9aa4ae'); R(c, -4, -9, 8, 4, '#1a1a1a'); R(c, -3, -8, 6, 2, '#9aa4ae'); R(c, -1, -9, 2, 2, '#1a1a1a'); break;
    case 'bottle': R(c, -3, -7, 6, 13, '#0c1a0c'); R(c, -2, -6, 4, 11, '#2f8a3a'); R(c, -1, -10, 2, 4, '#2f8a3a'); R(c, -1, -5, 1, 7, '#7fd08a'); R(c, -2, -2, 4, 3, '#e8d8a0'); break;
    case 'nut': R(c, -3, -3, 6, 6, '#1a1a1a'); R(c, -2, -2, 4, 4, '#b8c0c8'); R(c, -1, -1, 2, 2, '#1a1a1a'); break;
    case 'pie': c.fillStyle = '#1a0f0c'; c.beginPath(); c.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#d8983a'; c.beginPath(); c.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2); c.fill(); R(c, -4, -2, 8, 1, '#f0c060'); break;
    case 'kefir': R(c, -5, -9, 10, 17, '#1a1a1a'); R(c, -4, -8, 8, 15, '#f4f4f0'); R(c, -4, -8, 8, 3, '#2a7a3a'); R(c, -3, -1, 6, 4, '#2a7a3a'); break;
    case 'pelmeni': R(c, -8, -6, 16, 12, '#1a1a1a'); R(c, -7, -5, 14, 10, '#e05030'); R(c, -5, -3, 10, 6, '#f4ecd8'); R(c, -4, -2, 3, 2, '#d8c8a8'); R(c, 1, -1, 3, 2, '#d8c8a8'); break;
    case 'coin': c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(0, 0, 5, 0, Math.PI * 2); c.fill(); c.fillStyle = '#e8c040'; c.beginPath(); c.arc(0, 0, 4, 0, Math.PI * 2); c.fill(); R(c, -1, -2, 2, 4, '#b08820'); break;
    case 'badge': c.fillStyle = '#1a1a1a'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3.5 : 8; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); c.fillStyle = '#d8282a'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.5 : 6.5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); R(c, -1, -1, 2, 2, '#f0d040'); break;
    case 'nutsbox': R(c, -8, -6, 16, 12, '#1a1a1a'); R(c, -7, -5, 14, 10, '#6a7a4a'); for (let i = 0; i < 3; i++) Art.item(c, 'nut', -4 + i * 4, -6, 0, 0.7); break;
    case 'bricks': Art.item(c, 'brick', 0, 2); Art.item(c, 'brick', 1, -5); break;
    case 'wrenchpk': Art.item(c, 'wrench', 0, 0, 0.6); break;
    case 'helmet': Art.item(c, 'helmetRaw', 0, 0); break;
    case 'helmetRaw':
      c.fillStyle = '#1a0f0c'; c.beginPath(); c.ellipse(0, 2, 8, 6, 0, Math.PI, 0); c.fill(); R(c, -10, 1, 20, 3, '#1a0f0c');
      c.fillStyle = '#f2f2ee'; c.beginPath(); c.ellipse(0, 2, 7, 5, 0, Math.PI, 0); c.fill(); R(c, -9, 1, 18, 1, '#f2f2ee');
      break;
    case 'shard': R(c, -2, -1, 4, 2, '#2f8a3a'); break;
  }
  c.restore();
};

// ---------- платформы ----------
Art.platform = function (c, p, t) {
  const x = Math.round(p.x), y = Math.round(p.y), w = p.w;
  switch (p.look) {
    case 'girder':
      R(c, x, y, w, 9, '#15171a'); R(c, x + 1, y + 1, w - 2, 3, '#c8a020'); R(c, x + 1, y + 4, w - 2, 4, '#5c636a');
      for (let i = x + 4; i < x + w - 3; i += 16) { R(c, i, y + 5, 2, 2, '#2a2e33'); }
      for (let i = x; i < x + w - 6; i += 12) { c.fillStyle = '#1a1a1a'; c.beginPath(); c.moveTo(i + 2, y + 1); c.lineTo(i + 6, y + 1); c.lineTo(i + 4, y + 4); c.lineTo(i, y + 4); c.fill(); }
      break;
    case 'scaffold':
      R(c, x, y, w, 6, '#15171a'); R(c, x + 1, y + 1, w - 2, 4, '#9a7448');
      for (let i = x + 1; i < x + w - 1; i += 20) R(c, i, y + 1, 1, 4, '#6a4c2c');
      R(c, x + 3, y + 6, 3, 14, '#6e757c'); R(c, x + w - 6, y + 6, 3, 14, '#6e757c');
      c.strokeStyle = '#6e757c'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 5, y + 6); c.lineTo(x + w - 5, y + 20); c.stroke();
      break;
    case 'pipe':
      R(c, x, y, w, 10, '#15171a'); R(c, x + 1, y + 1, w - 2, 8, '#5a7a6a'); R(c, x + 1, y + 2, w - 2, 2, '#7a9a8a');
      for (let i = x + 18; i < x + w - 5; i += 40) R(c, i, y, 4, 10, '#3a4a42');
      break;
    case 'pallet': {
      const sh = p.crumbling ? Math.sin(t * 60) * 1 : 0;
      R(c, x + sh, y, w, 7, '#15120e'); R(c, x + 1 + sh, y + 1, w - 2, 2, '#b89060'); R(c, x + 1 + sh, y + 4, w - 2, 2, '#a07a4c');
      for (let i = x + 2; i < x + w - 4; i += 14) R(c, i + sh, y + 1, 3, 5, '#7a5a34');
      R(c, x + 4 + sh, y + 7, 6, 4, '#7a5a34'); R(c, x + w - 10 + sh, y + 7, 6, 4, '#7a5a34');
      break;
    }
    case 'hook': {
      // платформа, подвешенная на крюке крана
      R(c, x + w / 2 - 1, y - 400, 2, 382, '#2a2a2a');
      R(c, x + w / 2 - 8, y - 24, 16, 10, '#1a1a1a'); R(c, x + w / 2 - 6, y - 22, 12, 6, '#e0b428');
      c.strokeStyle = '#3a3a3a'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x + w / 2, y - 14); c.lineTo(x + 3, y); c.moveTo(x + w / 2, y - 14); c.lineTo(x + w - 3, y); c.stroke();
      R(c, x, y, w, 8, '#15171a'); R(c, x + 1, y + 1, w - 2, 6, '#7a8088'); R(c, x + 1, y + 1, w - 2, 1, '#9aa0a8');
      for (let i = x + 3; i < x + w - 3; i += 8) { R(c, i, y + 3, 4, 3, i % 16 < 8 ? '#e0b428' : '#1a1a1a'); }
      break;
    }
    case 'lift':
      R(c, x, y, w, 8, '#15171a'); R(c, x + 1, y + 1, w - 2, 6, '#6a727a');
      R(c, x, y - 30, 2, 30, '#3a3f45'); R(c, x + w - 2, y - 30, 2, 30, '#3a3f45'); R(c, x, y - 30, w, 2, '#3a3f45');
      R(c, x + w / 2 - 1, y - 800, 2, 770, '#2a2a2a');
      break;
    case 'crate':
      R(c, x, y, w, p.h, '#1a120c'); R(c, x + 1, y + 1, w - 2, p.h - 2, '#8a6a42');
      R(c, x + 2, y + 2, w - 4, 2, '#a4845a'); c.strokeStyle = '#5a4428'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 3, y + 3); c.lineTo(x + w - 3, y + p.h - 3); c.stroke();
      R(c, x + 2, y + p.h / 2 - 1, w - 4, 2, '#5a4428');
      break;
    case 'floor':
      R(c, x, y, w, p.h, '#46433f'); R(c, x, y, w, 3, '#5c5853'); R(c, x, y + 14, w, 3, '#c8a020');
      for (let i = x; i < x + w; i += 80) R(c, i, y, 1, p.h, '#35322f');
      break;
    case 'cab':
      R(c, x, y, w, 10, '#1a1a1a'); R(c, x + 1, y + 1, w - 2, 8, '#6a6e72'); R(c, x + 1, y + 1, w - 2, 2, '#8a8e92');
      break;
    default:
      R(c, x, y, w, p.h || 8, '#555');
  }
};

// ---------- лестница ----------
Art.ladder = function (c, l) {
  const x = Math.round(l.x), y = Math.round(l.y);
  R(c, x - 1, y, 3, l.h, '#15171a'); R(c, x + l.w - 2, y, 3, l.h, '#15171a');
  R(c, x, y, 1, l.h, '#8a929a'); R(c, x + l.w - 1, y, 1, l.h, '#8a929a');
  for (let yy = y + 4; yy < y + l.h; yy += 8) { R(c, x, yy, l.w, 2, '#15171a'); R(c, x, yy, l.w, 1, '#8a929a'); }
};

// ---------- флаг-чекпоинт ----------
Art.checkpoint = function (c, x, y, active, t) {
  R(c, x, y - 44, 2, 44, '#2a2a2a'); R(c, x - 3, y - 3, 8, 3, '#2a2a2a');
  const col = active ? '#d8282a' : '#6a6a6a';
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x + 2, y - 44);
  for (let i = 0; i <= 18; i += 3) c.lineTo(x + 2 + i, y - 44 + Math.sin(t * 6 + i * 0.4) * (active ? 2 : 0.5));
  for (let i = 18; i >= 0; i -= 3) c.lineTo(x + 2 + i, y - 32 + Math.sin(t * 6 + i * 0.4) * (active ? 2 : 0.5));
  c.fill();
  if (active) R(c, x + 5, y - 41, 3, 3, '#f0d040');
};
