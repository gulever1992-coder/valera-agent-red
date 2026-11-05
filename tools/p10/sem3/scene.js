// «Редактор фазы 3»: вкладки «Сцена» (живая игра + ручки поверх: слои, станции, Семён, вода, плоты, атаки)
// и «Картинки» (ластик / вернуть из оригинала / кисть цветом по любой картинке фазы). Подключается после editor.html.
const ifr = $('ifr'), ov = $('ov'), og = ov.getContext('2d');
let W = null, LAY = null, selL = -1, selSt = -1, sdrag = null, freeze = false;
const LNAME = { sky: 'Небо', sea: 'Море (полоса волн)', ships: 'Корабли и подлодки', img: 'Своя картинка', stFar: 'Станции дальние', stNear: 'Станции ближние', sem: 'Семён', semWater: 'Вода перед Семёном', laser: 'Лазер', rafts: 'Плоты', hose: 'Шланг над водой', actors: 'Валера, миньоны, пули', arms: 'Руки у зрителя', fx: 'Взрывы и брызги', rain: 'Дождь' };
const LFIELDS = {
  sky: [['y', 'верх', -150, 200, 1], ['h', 'высота', 40, 500, 1], ['sp', 'скорость облаков', -600, 600, 5], ['par', 'параллакс', 0, 0.3, 0.005]],
  sea: [['y', 'верх', 40, 340, 1], ['h', 'высота', 40, 450, 1], ['sp', 'скорость', -500, 500, 5], ['dx', 'сдвиг', 0, 1500, 10], ['dy', 'сдвиг Y', -40, 40, 1], ['wave', 'качка', 0, 12, 0.5], ['w', 'частота качки', 0, 4, 0.1], ['par', 'параллакс', 0, 0.3, 0.005]],
  ships: [['n', 'сколько', 0, 20, 1], ['y', 'горизонт', 40, 340, 1], ['dz', 'разброс к зрителю', 0, 250, 1], ['s', 'размер', 0.2, 3, 0.05]],
  img: [['x', 'X', -300, 940, 1], ['y', 'Y', -300, 660, 1], ['s', 'размер', 0.02, 3, 0.005], ['r', 'поворот', -180, 180, 1], ['par', 'параллакс', 0, 1, 0.01], ['sp', 'скорость (если плитка)', -400, 400, 2], ['bob', 'качка', 0, 30, 0.5], ['bobW', 'частота качки', 0, 5, 0.1], ['drift', 'дрейф', 0, 80, 1]],
};
const ATK = { cd: 'пауза между атаками (по сегментам)', tracks: 'атак одновременно', ballLife: 'шар: живёт, с', ballSpeed: 'шар: скорость', ballTurn: 'шар: поворот', ballHp: 'шар: попаданий', ballDmg: 'шар: урон', balls: 'шаров за раз', laserWarn: 'лазер: предупреждение', laserTime: 'лазер: длится', laserDmg: 'лазер: урон', hoseN: 'шланг: ударов', hoseWarn: 'шланг: предупреждение', hoseDmg: 'шланг: урон', clapWarn: 'хлопок: предупреждение', clapDmg: 'хлопок: урон', clapEvery: 'хлопок: частота', minions: 'миньонов максимум', minionEvery: 'миньон каждые, с', minionDmgK: 'урон миньонов ×', dmg: 'урон по Семёну', dmgWeak: 'урон в пасть', splash: 'урон взрывом', breath: 'дыхание под водой, с', stationHp: 'станция: прочность', stationBack: 'новая станция через, с', smashWarn: 'кулаки: предупреждение', smashEvery: 'кулаки: частота', smashDmg: 'кулаки: урон', smashR: 'кулаки: радиус', sweepP: 'шланг метёт: шанс', sweepWarn: 'шланг метёт: предупреждение', sweepTime: 'шланг метёт: длится', sweepDmg: 'шланг метёт: урон' };
const r2 = x => Math.round(x * 100) / 100;

// ---------- игра в iframe ----------
function loadGame() {
  W = null; LAY = null; buildSide();
  ifr.onload = async () => {
    const w = ifr.contentWindow, ready = () => { try { return w.eval("typeof L10 !== 'undefined' && L10.PARTS && L10.PARTS.sea && !!L10.PARTS.sea.R && !!L10.PARTS.sea.B"); } catch (e) { return false; } };
    for (let i = 0; i < 240 && !ready(); i++) await new Promise(r => setTimeout(r, 250));
    if (!ready()) return status('Игра не загрузилась', 1);
    W = { w, L10: w.eval('L10'), P: w.eval('L10.PARTS.sea') }; LAY = W.L10.SEA3;
    if (!LAY.layers) LAY.layers = JSON.parse(JSON.stringify(W.P.LAYERS));
    W.P.freeze = freeze; SEM = { x: LAY.sem.x, y: LAY.sem.y, H: LAY.sem.H }; buildSide(); status('Игра загружена. Тащи объекты мышью, колесо — размер.');
  };
  ifr.src = ROOT + 'index.html?l10=sea&seaedit=1&t=' + Date.now();
}
function gameRect() { try { const c = W.w.document.querySelector('canvas'), r = c.getBoundingClientRect(), o = ifr.getBoundingClientRect(), b = ov.getBoundingClientRect(); return { x: r.left + o.left - b.left, y: r.top + o.top - b.top, k: r.width / 640 }; } catch (e) { return { x: 0, y: 0, k: 1 }; } }
const toG = e => { const b = ov.getBoundingClientRect(), g = gameRect(); return [(e.clientX - b.left - g.x) / g.k, (e.clientY - b.top - g.y) / g.k]; };
function stBox(s) { const sz = W.L10.size ? W.L10.size('stat10', 'ok') : [147, 95], w = sz[0] * s.s, h = sz[1] * s.s; return [s.x - w / 2, s.y - h, w, h]; }
function imgOf(ly) { return W && W.L10.img['sea3_' + ly.img]; }
function lyBox(ly) { const im = imgOf(ly); if (!im) return null; const s = ly.s ?? 0.5, w = im.width * s, h = im.height * s; return [(ly.x ?? 320) - w / 2, (ly.y ?? 180) - h / 2, w, h]; }
function handles() {
  if (!LAY) return []; const H = [];
  LAY.layers.forEach((ly, i) => { if (ly.k === 'img' && !ly.tile && !ly.hide) { const b = lyBox(ly); if (b) H.push({ k: 'img', i, box: b }); } });
  LAY.stations.forEach((s, i) => H.push({ k: 'st', i, box: stBox(s) }));
  try { H.push({ k: 'sem', box: W.P.R.box() }); } catch (e) {}
  H.push({ k: 'wy', line: LAY.WY, c: '#5ab0ff', t: 'вода у плотов' }); H.push({ k: 'sea', line: (LAY.bg || {}).seaY ?? 150, c: '#9fe', t: 'горизонт' });
  (LAY.lanes || []).forEach((l, i) => H.push({ k: 'lane', i, line: l.y, c: '#c9a', t: 'ряд плотов ' + (i + 1) }));
  H.push({ k: 'semy', line: LAY.sem.y, c: '#fc3', t: 'вода у Семёна' });
  return H;
}
function hitH(p) {
  const H = handles(), inB = b => p[0] > b[0] && p[0] < b[0] + b[2] && p[1] > b[1] && p[1] < b[1] + b[3];
  for (const h of H) if (h.line != null && Math.abs(p[1] - h.line) < 3) return h;
  for (const h of H) if (h.k === 'st' && inB(h.box)) return h;
  for (let i = H.length - 1; i >= 0; i--) if (H[i].k === 'img' && inB(H[i].box) && H[i].i === selL) return H[i];
  for (const h of H) if (h.k === 'sem' && inB(h.box)) return h;
  for (let i = H.length - 1; i >= 0; i--) if (H[i].k === 'img' && inB(H[i].box)) return H[i];
  return null;
}
ov.addEventListener('mousedown', e => {
  if (!LAY) return; const p = toG(e), h = hitH(p); if (!h) return; e.preventDefault();
  sceneUndo(); const L0 = JSON.parse(JSON.stringify(LAY));
  if (h.k === 'st') { selSt = h.i; } if (h.k === 'img') selL = h.i; buildSide();
  sdrag = { h, p0: p, L0 };
});
ov.addEventListener('mousemove', e => {
  if (!sdrag) { ov.style.cursor = LAY && hitH(toG(e)) ? 'move' : 'default'; return; }
  const p = toG(e), { h, p0, L0 } = sdrag, dx = p[0] - p0[0], dy = p[1] - p0[1], L = LAY, R = Math.round;
  if (h.k === 'sem') { L.sem.x = R(L0.sem.x + dx); L.sem.y = R(L0.sem.y + dy); SEM.x = L.sem.x; SEM.y = L.sem.y; }
  if (h.k === 'st') { L.stations[h.i].x = R(L0.stations[h.i].x + dx); L.stations[h.i].y = R(L0.stations[h.i].y + dy); const s = W.P.stations.find(q => q.slot === h.i); if (s) s.x = L.stations[h.i].x; }
  if (h.k === 'img') { L.layers[h.i].x = R((L0.layers[h.i].x ?? 320) + dx); L.layers[h.i].y = R((L0.layers[h.i].y ?? 180) + dy); }
  if (h.k === 'wy') L.WY = R(L0.WY + dy);
  if (h.k === 'sea') { L.bg = L.bg || {}; L.bg.seaY = R(((L0.bg || {}).seaY ?? 150) + dy); }
  if (h.k === 'lane') L.lanes[h.i].y = R(L0.lanes[h.i].y + dy);
  if (h.k === 'semy') { L.sem.y = R(L0.sem.y + dy); SEM.y = L.sem.y; }
});
addEventListener('mouseup', () => { if (sdrag) { sdrag = null; buildSide(); } });
ov.addEventListener('wheel', e => {
  if (!LAY) return; const h = hitH(toG(e)); if (!h) return; e.preventDefault(); const k = Math.exp(-e.deltaY * 0.001);
  if (h.k === 'sem') { LAY.sem.H = Math.round(LAY.sem.H * k); SEM.H = LAY.sem.H; }
  if (h.k === 'st') LAY.stations[h.i].s = r3(LAY.stations[h.i].s * k);
  if (h.k === 'img') { const ly = LAY.layers[h.i]; ly.s = r3((ly.s ?? 0.5) * k); }
}, { passive: false });
function drawOverlay() {
  const r = ov.getBoundingClientRect(); if (ov.width !== Math.round(r.width * dpr) || ov.height !== Math.round(r.height * dpr)) { ov.width = r.width * dpr; ov.height = r.height * dpr; }
  const showH = !!($('showH') && $('showH').checked); ov.style.pointerEvents = showH ? 'auto' : 'none';     // без рамок — можно играть мышью/клавишами в самой игре
  og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, ov.width, ov.height); if (!LAY || !showH) return;
  const g = gameRect(); og.setTransform(dpr * g.k, 0, 0, dpr * g.k, dpr * g.x, dpr * g.y); og.lineWidth = 1 / g.k; og.font = `${11 / g.k}px system-ui`;
  for (const h of handles()) {
    if (h.line != null) { og.strokeStyle = h.c; og.setLineDash([6 / g.k, 4 / g.k]); og.beginPath(); og.moveTo(0, h.line); og.lineTo(640, h.line); og.stroke(); og.setLineDash([]); og.fillStyle = h.c; og.fillText(h.t, 4, h.line - 3 / g.k); continue; }
    const sel = (h.k === 'st' && h.i === selSt) || (h.k === 'img' && h.i === selL); og.strokeStyle = h.k === 'sem' ? '#fc3' : h.k === 'st' ? '#6ef' : '#f8c'; og.lineWidth = (sel ? 2.5 : 1) / g.k;
    og.strokeRect(h.box[0], h.box[1], h.box[2], h.box[3]); og.fillStyle = og.strokeStyle;
    og.fillText(h.k === 'sem' ? 'Семён' : h.k === 'st' ? 'станция ' + (h.i + 1) + ' → лапа ' + ((LAY.stations[h.i].leg ?? h.i) + 1) : (LAY.layers[h.i].img || 'картинка'), h.box[0] + 3 / g.k, h.box[1] + 12 / g.k);
  }
}
function sceneUndo() { if (LAY) { undoSt.push({ lay: JSON.stringify(LAY) }); if (undoSt.length > 60) undoSt.shift(); } }
function applyLay(json) { const o = JSON.parse(json); for (const k of Object.keys(LAY)) delete LAY[k]; Object.assign(LAY, o); SEM = { x: LAY.sem.x, y: LAY.sem.y, H: LAY.sem.H }; buildSide(); }

// ---------- панель сцены ----------
function rng(path, label, mn, mx, st, v) { return `<div class="row"><span>${label}</span><input type="range" min="${mn}" max="${mx}" step="${st}" value="${v}" data-p="${path}"><input type="number" step="${st}" value="${v}" data-p="${path}" style="width:64px"></div>`; }
function getP(o, p) { return p.split('.').reduce((a, k) => a == null ? a : a[k], o); }
function setP(o, p, v) { const ks = p.split('.'), last = ks.pop(); let a = o; for (const k of ks) a = a[k] ?? (a[k] = {}); a[last] = v; }
function sceneSide() {
  if (!LAY) return '<div class="hint">Игра загружается… (если долго — «⟳ Перезапустить игру»)</div><div class="grp"><button id="gReload">⟳ Перезапустить игру</button></div>';
  let h = `<div class="hint">Справа — живая игра. Тащи мышью Семёна, станции, свои картинки и линии (вода, горизонт, ряды плотов). Колесо над объектом — размер. Всё сохраняется кнопкой «Сохранить и посмотреть».</div>
    <div class="grp"><label><input type="checkbox" id="showH" checked> рамки</label><label><input type="checkbox" id="frz"${freeze ? ' checked' : ''}> стоп-кадр</label><button id="gReload">⟳ Перезапустить игру</button></div>
    <h4>Слои (сверху — ближе к зрителю)</h4><div class="grp"><button id="lAdd">＋ Картинка-слой…</button><button id="lUp">▲</button><button id="lDn">▼</button><button id="lDel" class="bad">✕</button><button id="lReset" title="Порядок слоёв как в игре по умолчанию">↺ порядок</button></div>
    <div class="list" id="llist">${LAY.layers.map((ly, i) => [ly, i]).reverse().map(([ly, i]) => `<div data-l="${i}" class="${i === selL ? 'sel' : ''}"><span class="eye" data-leye="${i}">${ly.hide ? '◌' : '●'}</span>${LNAME[ly.k] || ly.k}${ly.img ? ' · ' + ly.img : ''}<span class="tag">${ly.a != null && ly.a < 1 ? Math.round(ly.a * 100) + '%' : ''}</span></div>`).join('')}</div>`;
  const ly = LAY.layers[selL];
  if (ly) {
    h += `<h4>${LNAME[ly.k] || ly.k}</h4>` + rng('a', 'прозрачность', 0, 1, 0.05, ly.a ?? 1);
    for (const f of LFIELDS[ly.k] || []) h += rng(f[0], f[1], f[2], f[3], f[4], ly[f[0]] ?? defL(ly, f[0]));
    if (ly.k === 'img') h += `<div class="grp"><label><input type="checkbox" data-c="tile"${ly.tile ? ' checked' : ''}> плиткой по ширине</label><label><input type="checkbox" data-c="flip"${ly.flip ? ' checked' : ''}> зеркально</label><label><input type="checkbox" data-c="add"${ly.add ? ' checked' : ''}> светится (сложение)</label></div>`;
    if (['sky', 'sea', 'semWater', 'img'].includes(ly.k)) h += `<div class="grp"><button id="lImg">🔁 ${ly.k === 'img' ? 'Заменить' : 'Своя'} картинка…</button>${ly.img && ly.k !== 'img' ? '<button id="lImgOff">вернуть стандартную</button>' : ''}${ly.img || ['sky', 'sea', 'semWater'].includes(ly.k) ? '<button id="lEdit">🖌️ Подтереть / дорисовать</button>' : ''}</div>`;
    if (ly.k === 'stFar' || ly.k === 'stNear') h += '<div class="grp"><button id="lEdit">🖌️ Подтереть / дорисовать станции</button></div>';
    if (ly.k === 'rafts') h += '<div class="grp"><button id="lEdit">🖌️ Подтереть / дорисовать плоты</button></div>';
    if (ly.k === 'ships') h += '<div class="grp"><button id="lEdit">🖌️ Подтереть / дорисовать корабли</button></div>';
  }
  h += `<h4>Станции</h4><div class="grp"><button id="stAdd">＋ Станция</button><button id="stDel" class="bad"${selSt < 0 ? ' disabled' : ''}>✕ Удалить выбранную</button></div>`
    + LAY.stations.map((s, i) => `<div class="row" style="${i === selSt ? 'color:var(--acc)' : ''}"><span data-st="${i}" style="cursor:pointer">Станция ${i + 1}</span>лапа <select data-sl="${i}">${[0, 1, 2, 3].map(k => `<option value="${k}"${(s.leg ?? i) === k ? ' selected' : ''}>${k + 1}</option>`).join('')}</select> размер <input type="number" step="0.05" style="width:58px" data-ss="${i}" value="${s.s}"></div>`).join('');
  h += `<h4>Семён</h4><div class="grp"><label><input type="checkbox" id="gUse"${D.use ? ' checked' : ''}> <b>новый Семён</b> (из вкладок Части/Кости/Анимации)</label></div>`
    + rng('sem.x', 'X центр', 0, 640, 1, LAY.sem.x) + rng('sem.y', 'Y линия воды', 100, 380, 1, LAY.sem.y) + rng('sem.H', 'Высота над водой', 60, 500, 1, LAY.sem.H) + rng('gunK', 'Миниган ×', 0.2, 2, 0.01, LAY.gunK ?? 1);
  h += '<h4>Валера и плоты</h4>' + rng('valeraK', 'Размер Валеры', 0.2, 1.5, 0.01, LAY.valeraK ?? 1) + rng('raftW.0', 'Плот: ширина от', 30, 300, 1, LAY.raftW[0]) + rng('raftW.1', 'Плот: ширина до', 30, 300, 1, LAY.raftW[1])
    + rng('raftSpeed.0', 'Течение от', 0, 150, 1, LAY.raftSpeed[0]) + rng('raftSpeed.1', 'Течение до', 0, 150, 1, LAY.raftSpeed[1]) + rng('raftEvery.0', 'Новый плот, с от', 0.3, 6, 0.1, LAY.raftEvery[0]) + rng('raftEvery.1', 'Новый плот, с до', 0.3, 6, 0.1, LAY.raftEvery[1])
    + '<h4>Ряды плотов</h4>' + LAY.lanes.map((l, i) => `<div class="grp"><b>Ряд ${i + 1}</b> <button data-lanedel="${i}" title="Убрать этот ряд">✕ убрать ряд</button></div>` + rng('lanes.' + i + '.y', 'Ряд ' + (i + 1) + ': Y', 150, 360, 1, l.y) + rng('lanes.' + i + '.k', 'Ряд ' + (i + 1) + ': размер', 0.3, 1.5, 0.01, l.k)).join('')
    + '<div class="grp"><button id="laneAdd">+ добавить ряд</button></div>';
  h += `<h4>Атаки</h4><div class="grp">${[['plasma', 'Плазма'], ['laser', 'Лазер'], ['hose', 'Шланг'], ['clap', 'Хлопок'], ['smash', 'Кулаки']].map(a => `<button data-atk="${a[0]}">${a[1]}</button>`).join('')}<button id="gAuto">Авто-бой</button></div>
    <div class="grp"><label>Сегмент HP</label>${[0, 1, 2].map(i => `<button data-seg="${i}">${i + 1}</button>`).join('')}</div>` + rng('hp', 'HP Семёна', 200, 6000, 50, LAY.hp);
  for (const k of Object.keys(LAY.atk || {})) { const v = LAY.atk[k], lab = ATK[k] || k, big = /Every|Life|Time|Back|breath|Warn|cd/.test(k);
    if (Array.isArray(v)) v.forEach((x, i) => { h += rng('atk.' + k + '.' + i, lab + ' · сегм. ' + (i + 1), 0, big ? 10 : Math.max(10, x * 3), big ? 0.05 : 1, x); });
    else h += rng('atk.' + k, lab, 0, /P$/.test(k) ? 1 : big ? 10 : Math.max(10, v * 3), /P$/.test(k) || big ? 0.05 : 1, v); }
  return h;
}
function defL(ly, k) { const bg = LAY.bg || {}; const D0 = { sky: { y: -24, h: (bg.seaY ?? 150) + 56, sp: 260, par: 0.01 }, sea: { y: bg.seaY ?? 150, h: bg.seaH ?? 230, sp: 140, dx: 0, dy: 0, wave: 1.5, w: 0.9, par: 0.05 }, ships: { n: bg.ships ?? 7, y: bg.seaY ?? 150, dz: bg.shipZ ?? 70, s: 1 }, img: { x: 320, y: 180, s: 0.5, r: 0, par: 0, sp: 0, bob: 0, bobW: 1, drift: 0 } }; return (D0[ly.k] || {})[k] ?? 0; }
async function upload(file) {
  const c = await fileToCanvas(file), n = 'l_' + uniqName(file.name).toLowerCase();
  const r = await (await fetch(SRV + '/upload', { method: 'POST', body: JSON.stringify({ name: n, url: c.toDataURL('image/png') }) })).json(); if (!r.ok) throw new Error(r.log);
  await new Promise(ok => { const im = new W.w.Image(); im.onload = () => { W.L10.img['sea3_' + n] = im; ok(); }; im.src = ROOT + 'assets/l10/sea3/' + n + '.png?' + Date.now(); });
  return { n, c };
}
function pickFile() { return new Promise(ok => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = () => ok(i.files[0]); i.click(); }); }
function sceneWire() {
  const box = $('side'); on('gReload', 'onclick', loadGame); if (!LAY) return;
  on('frz', 'onchange', e => { freeze = e.target.checked; W.P.freeze = freeze; });
  box.querySelectorAll('#llist [data-l]').forEach(d => d.onclick = e => { const i = +d.dataset.l; if (e.target.dataset.leye) { sceneUndo(); LAY.layers[i].hide = !LAY.layers[i].hide; } selL = i; buildSide(); });
  const mv = d => { const i = selL, j = i + d; if (i < 0 || j < 0 || j >= LAY.layers.length) return; sceneUndo(); const a = LAY.layers; [a[i], a[j]] = [a[j], a[i]]; selL = j; buildSide(); };
  on('lUp', 'onclick', () => mv(1)); on('lDn', 'onclick', () => mv(-1));
  on('lDel', 'onclick', () => { const ly = LAY.layers[selL]; if (!ly) return; if (ly.k !== 'img') return status('Стандартный слой не удаляется — его можно скрыть (●) или сделать прозрачным.', 1); sceneUndo(); LAY.layers.splice(selL, 1); selL = -1; buildSide(); });
  on('lReset', 'onclick', () => { if (!confirm('Вернуть стандартный порядок слоёв? Свои картинки удалятся из сцены.')) return; sceneUndo(); LAY.layers = JSON.parse(JSON.stringify(W.P.LAYERS)); selL = -1; buildSide(); });
  on('lAdd', 'onclick', async () => { const f = await pickFile(); if (!f) return; try { const { n, c } = await upload(f); sceneUndo(); const ly = { k: 'img', img: n, x: 320, y: 180, s: r3(Math.min(1, 300 / c.width)) }; const at = selL >= 0 ? selL + 1 : LAY.layers.findIndex(l => l.k === 'sem'); LAY.layers.splice(Math.max(0, at), 0, ly); selL = LAY.layers.indexOf(ly); buildSide(); status('Картинка добавлена слоем. Тащи её мышью, ▲▼ — ближе/дальше.'); } catch (e) { status('Ошибка загрузки: ' + e.message, 1); } });
  on('lImg', 'onclick', async () => { const f = await pickFile(); if (!f) return; try { const { n } = await upload(f); sceneUndo(); LAY.layers[selL].img = n; buildSide(); } catch (e) { status('Ошибка: ' + e.message, 1); } });
  box.querySelectorAll('[data-lanedel]').forEach(b => b.onclick = () => { if (LAY.lanes.length < 2) return status('Должен остаться хотя бы один ряд.', 1); const i = +b.dataset.lanedel; sceneUndo(); LAY.lanes.splice(i, 1);
    if (W && W.P) { const P = W.P; P.rafts = P.rafts.filter(r => r.lane !== i || r === P.raft); for (const r of P.rafts) { if (r.lane > i) r.lane--; else if (r.lane === i) r.lane = Math.max(0, i - 1); const LN = LAY.lanes[r.lane]; r.ly = LN.y; } }
    buildSide(); status('Ряд убран. Не забудь «Сохранить».'); });
  on('laneAdd', 'onclick', () => { sceneUndo(); const a = LAY.lanes, last = a[a.length - 1]; a.push({ y: Math.max(150, last.y - 30), k: r3(Math.max(0.3, last.k - 0.1)) }); buildSide(); });
  on('lImgOff', 'onclick', () => { sceneUndo(); delete LAY.layers[selL].img; buildSide(); });
  on('lEdit', 'onclick', () => { const ly = LAY.layers[selL]; const p = ly.img ? 'assets/l10/sea3/' + ly.img + '.png' : { sky: 'assets/l10/bg1sky.jpg', sea: 'assets/l10/bg1sea.jpg', semWater: 'assets/l10/bg1sea.jpg', stFar: 'assets/l10/stat10.png', stNear: 'assets/l10/stat10.png', rafts: 'assets/l10/' + (LAY.raftSheet || 'slab10') + '.png', ships: 'assets/l10/bg1ships.png' }[ly.k]; if (p) openImgTab(p); });
  box.querySelectorAll('input[data-p]').forEach(inp => inp.oninput = () => {
    const p = inp.dataset.p, v = +inp.value, tgt = p.includes('.') || LAY[p] !== undefined || !LAY.layers[selL] ? LAY : null;
    if (!inp._u) { sceneUndo(); inp._u = 1; }
    if (LAY.layers[selL] && (p === 'a' || (LFIELDS[LAY.layers[selL].k] || []).some(f => f[0] === p))) LAY.layers[selL][p] = v; else setP(LAY, p, v);
    if (p.startsWith('sem.')) SEM[p.slice(4)] = v;
    if (p === 'hp' && W) { const B = W.P.B; B.maxHp = v; B.segHp = v / B.segs; B.hp = Math.min(B.hp, v); }
    box.querySelectorAll(`input[data-p="${p}"]`).forEach(o => { if (o !== inp) o.value = v; });
  });
  box.querySelectorAll('input[data-c]').forEach(c => c.onchange = () => { sceneUndo(); LAY.layers[selL][c.dataset.c] = c.checked ? 1 : undefined; });
  box.querySelectorAll('[data-st]').forEach(s => s.onclick = () => { selSt = +s.dataset.st; buildSide(); });
  box.querySelectorAll('[data-sl]').forEach(s => s.onchange = () => { sceneUndo(); const i = +s.dataset.sl; LAY.stations[i].leg = +s.value; const st = W.P.stations.find(q => q.slot === i); if (st) st.leg = +s.value; });
  box.querySelectorAll('[data-ss]').forEach(s => s.onchange = () => { sceneUndo(); LAY.stations[+s.dataset.ss].s = +s.value; });
  on('stAdd', 'onclick', () => { sceneUndo(); const i = LAY.stations.length, s = { x: 320, y: 300, s: 0.6, leg: i % 4 }; LAY.stations.push(s); W.P.stations.push({ slot: i, leg: s.leg, x: s.x, y: s.y, s: s.s, hp: 30, st: 'plug', t: 0, link: 0, dmgT: 0, sink: 0 }); selSt = i; buildSide(); });
  on('stDel', 'onclick', () => { if (selSt < 0) return; sceneUndo(); LAY.stations.splice(selSt, 1); W.P.stations = W.P.stations.filter(q => q.slot !== selSt); W.P.stations.forEach(q => { if (q.slot > selSt) q.slot--; }); selSt = -1; buildSide(); });
  on('gUse', 'onchange', e => { pushUndo(); D.use = e.target.checked; status('Нажми «Сохранить и посмотреть» — игра перезапустится с ' + (D.use ? 'новым' : 'старым') + ' Семёном.'); });
  box.querySelectorAll('[data-atk]').forEach(b => b.onclick = () => { if (W.P.startAtk) W.P.startAtk(b.dataset.atk); });
  on('gAuto', 'onclick', () => { W.P.edit = !W.P.edit; if (!W.P.edit && W.P.A) W.P.A.cd = 1; status(W.P.edit ? 'Атаки только по кнопкам' : 'Авто-бой: Семён атакует сам'); });
  box.querySelectorAll('[data-seg]').forEach(b => b.onclick = () => { const B = W.P.B; B.hp = B.maxHp - (+b.dataset.seg) * B.segHp - 1; });
}

// ======================= КАРТИНКИ: подтереть / дорисовать =======================
const IMGS = [['assets/l10/bg1sky.jpg', 'Небо'], ['assets/l10/bg1sea.jpg', 'Море'], ['assets/l10/bg1ships.png', 'Корабли'], ['assets/l10/stat10.png', 'Электростанции', 'stat10'], ['assets/l10/slab10.png', 'Плоты', 'slab10'], ['assets/l10/sub10.png', 'Подлодки', 'sub10'], ['assets/l10/fx10.png', 'Эффекты (шары, лазер, брызги)', 'fx10'], ['assets/l10/boom10.png', 'Взрывы', 'boom10']];
let ED = null, edMode = 'erase', edSize = 20, edHard = 0.6, edColor = '#7a5a40', edUndo = [], L10D = null;
async function openImgTab(path) { document.querySelector('#tabs [data-t=img]').click(); await loadEd(path); }
async function loadEd(path) {
  if (ED && ED.dirty && !confirm('В «' + ED.path + '» есть несохранённые правки. Бросить их?')) return;
  try {
    if (!L10D) { await loadScript(ROOT + 'js/l10_data.js'); L10D = window.L10D || {}; }
    const im = await loadImg(ROOT + path + '?' + Date.now()), cv2 = toCanvas(im);
    let orig; try { orig = toCanvas(await loadImg(ROOT + 'art_src/l10/sea3/_orig/' + path.replace(/\//g, '__') + '?' + Date.now())); } catch (e) { orig = toCanvas(im); }
    const sheet = (IMGS.find(x => x[0] === path) || [])[2], fr = sheet && L10D[sheet] ? L10D[sheet] : null;
    ED = { path, cv: cv2, orig, fr, dirty: false, jpg: /\.jpg$/.test(path), view: null }; edUndo = []; edFit(); buildSide(); status('Открыта ' + path + (ED.jpg ? ' (JPG: без прозрачности — ластик закрашивает чёрным, лучше кисть и «вернуть»)' : ''));
  } catch (e) { status('Не открылась картинка: ' + e.message, 1); }
}
function edFit() { if (!ED) return; const r = cv.getBoundingClientRect(), k = Math.min(r.width / ED.cv.width, r.height / ED.cv.height) * 0.95; ED.view = { k, ox: (r.width - ED.cv.width * k) / 2, oy: (r.height - ED.cv.height * k) / 2 }; }
function drawImgTab() {
  const Wd = cv.width / dpr, Hd = cv.height / dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#1a2028'; ctx.fillRect(0, 0, Wd, Hd);
  if (!ED) { ctx.fillStyle = '#8b96a6'; ctx.font = '14px system-ui'; ctx.fillText('Выбери картинку слева', 20, 30); return; }
  const v = ED.view, w = ED.cv.width * v.k, h = ED.cv.height * v.k;
  const s = 12; for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) { ctx.fillStyle = ((x + y) / s) % 2 ? '#3a3f47' : '#2a2e35'; ctx.fillRect(v.ox + x, v.oy + y, Math.min(s, w - x), Math.min(s, h - y)); }
  ctx.imageSmoothingEnabled = v.k < 2; ctx.drawImage(ED.cv, v.ox, v.oy, w, h); ctx.imageSmoothingEnabled = true;
  if (ED.fr && $('edFr') && $('edFr').checked) { ctx.strokeStyle = '#6ef8'; ctx.fillStyle = '#6ef'; ctx.font = '11px system-ui'; ED.fr.f.forEach((f, i) => { ctx.strokeRect(v.ox + f[0] * v.k, v.oy + f[1] * v.k, f[2] * v.k, f[3] * v.k); ctx.fillText((ED.fr.n || [])[i] ?? i, v.ox + f[0] * v.k + 3, v.oy + f[1] * v.k + 12); }); }
  ctx.strokeStyle = edMode === 'erase' ? '#ff7a3a' : edMode === 'restore' ? '#5aff9a' : edColor; ctx.beginPath(); ctx.arc(mouse[0], mouse[1], edSize * v.k, 0, 7); ctx.stroke();
}
function edPt(m) { const v = ED.view; return [(m[0] - v.ox) / v.k, (m[1] - v.oy) / v.k]; }
function edDab(p) {
  const g = ED.cv.getContext('2d'), r = edSize, x = p[0], y = p[1];
  const mask = (ctx2) => { const gr = ctx2.createRadialGradient(x, y, r * edHard, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); return gr; };
  if (edMode === 'erase') { g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = mask(g); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore(); }
  else if (edMode === 'paint') { const t = document.createElement('canvas'); t.width = t.height = Math.ceil(r * 2 + 2); const tg = t.getContext('2d'); tg.fillStyle = edColor; tg.fillRect(0, 0, t.width, t.height); tg.globalCompositeOperation = 'destination-in'; const gr = tg.createRadialGradient(r + 1, r + 1, r * edHard, r + 1, r + 1, r); gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)'); tg.fillStyle = gr; tg.fillRect(0, 0, t.width, t.height); g.drawImage(t, x - r - 1, y - r - 1); }
  else if (edMode === 'restore') { const t = document.createElement('canvas'), d = Math.ceil(r * 2 + 2); t.width = t.height = d; const tg = t.getContext('2d'); tg.drawImage(ED.orig, -(x - r - 1), -(y - r - 1)); tg.globalCompositeOperation = 'destination-in'; const gr = tg.createRadialGradient(r + 1, r + 1, r * edHard, r + 1, r + 1, r); gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)'); tg.fillStyle = gr; tg.fillRect(0, 0, d, d);
    g.save(); g.globalCompositeOperation = 'destination-out'; const g2 = g.createRadialGradient(x, y, r * edHard, x, y, r); g2.addColorStop(0, '#000'); g2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = g2; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore(); g.drawImage(t, x - r - 1, y - r - 1); }
  ED.dirty = true;
}
function imgDown(e, m) {
  if (!ED) return; const p = edPt(m);
  if (edMode === 'pick' || e.altKey) { const d = ED.cv.getContext('2d').getImageData(p[0] | 0, p[1] | 0, 1, 1).data; edColor = '#' + [0, 1, 2].map(i => d[i].toString(16).padStart(2, '0')).join(''); if (edMode === 'pick') edMode = 'paint'; buildSide(); return; }
  edUndo.push(ED.cv.getContext('2d').getImageData(0, 0, ED.cv.width, ED.cv.height)); if (edUndo.length > 25) edUndo.shift();
  let last = p; edDab(p);
  drag = { fn: m2 => { const q = edPt(m2), d = Math.hypot(q[0] - last[0], q[1] - last[1]), n = Math.ceil(d / Math.max(1, edSize * 0.3)); for (let i = 1; i <= n; i++) edDab([last[0] + (q[0] - last[0]) * i / n, last[1] + (q[1] - last[1]) * i / n]); last = q; } };
}
function imgUndo() { const u = edUndo.pop(); if (!u || !ED) return false; ED.cv.getContext('2d').putImageData(u, 0, 0); ED.dirty = true; return true; }
function imgSide() {
  let h = '<div class="hint">Любая картинка фазы 3. <b>Ластик</b> — подтереть, <b>Вернуть</b> — восстановить из оригинала (он хранится отдельно и не портится), <b>Кисть</b> — дорисовать цветом (Alt+клик — взять цвет с картинки). Колесо — масштаб, правая кнопка — сдвиг.</div>';
  const custom = LAY ? [...new Set(LAY.layers.map(l => l.img).filter(Boolean))].map(n => ['assets/l10/sea3/' + n + '.png', 'Своя: ' + n]) : [];
  h += '<div class="list">' + IMGS.concat(custom).map(x => `<div data-ip="${x[0]}" class="${ED && ED.path === x[0] ? 'sel' : ''}">${x[1]}<span class="tag">${x[0].split('/').pop()}</span></div>`).join('') + '</div>';
  if (ED) h += `<h4>${ED.path.split('/').pop()}${ED.dirty ? ' • изменено' : ''}</h4>
    <div class="grp"><button data-em="erase" class="${edMode === 'erase' ? 'on' : ''}">🧽 Ластик</button><button data-em="restore" class="${edMode === 'restore' ? 'on' : ''}">↩ Вернуть</button><button data-em="paint" class="${edMode === 'paint' ? 'on' : ''}">🖌️ Кисть</button><button data-em="pick" class="${edMode === 'pick' ? 'on' : ''}">💧 Пипетка</button></div>
    <div class="row"><span>Размер кисти</span><input type="range" id="edS" min="1" max="200" value="${edSize}"><b>${edSize}</b></div>
    <div class="row"><span>Жёсткость края</span><input type="range" id="edH" min="0" max="0.98" step="0.02" value="${edHard}"></div>
    <div class="row"><span>Цвет</span><input type="color" id="edC" value="${edColor}"></div>
    <div class="grp">${ED.fr ? '<label><input type="checkbox" id="edFr" checked> рамки кадров</label>' : ''}<button id="edFit">⤢ Целиком</button><button id="edAll">↩ Вернуть всю картинку</button></div>
    <div class="hint">Сохраняется общей кнопкой «Сохранить и посмотреть». Если картинку потом пересобрать скриптом (build_*.py), правки затрутся.</div>`;
  return h;
}
function imgWire() {
  const box = $('side');
  box.querySelectorAll('[data-ip]').forEach(d => d.onclick = () => loadEd(d.dataset.ip));
  box.querySelectorAll('[data-em]').forEach(b => b.onclick = () => { edMode = b.dataset.em; buildSide(); });
  on('edS', 'oninput', e => { edSize = +e.target.value; e.target.nextElementSibling.textContent = edSize; }); on('edH', 'oninput', e => edHard = +e.target.value); on('edC', 'oninput', e => edColor = e.target.value);
  on('edFit', 'onclick', edFit);
  on('edAll', 'onclick', () => { if (!confirm('Вернуть всю картинку к оригиналу?')) return; edUndo.push(ED.cv.getContext('2d').getImageData(0, 0, ED.cv.width, ED.cv.height)); const g = ED.cv.getContext('2d'); g.clearRect(0, 0, ED.cv.width, ED.cv.height); g.drawImage(ED.orig, 0, 0); ED.dirty = true; buildSide(); });
}
async function saveScene() {
  if (ED && ED.dirty) { const r = await (await fetch(SRV + '/img', { method: 'POST', body: JSON.stringify({ path: ED.path, url: ED.cv.toDataURL('image/png') }) })).json(); if (!r.ok) throw new Error(r.log); ED.dirty = false; }
  if (LAY) { const r = await (await fetch(SRV + '/layout', { method: 'POST', body: JSON.stringify({ layout: JSON.parse(JSON.stringify(LAY)) }) })).json(); if (!r.ok) throw new Error(r.log); }
}
