'use strict';
// ============ ПЕРСОНАЖИ: скелетная отрисовка, позы, стили ============
// Углы: 0 — конечность смотрит вниз, «+» — вперёд (по направлению взгляда).
const Hum = {};
G.Hum = Hum;

Hum.STYLES = {
  valera: {
    thigh: 13, shin: 12, torsoH: 21, torsoW: 26, upper: 9, fore: 9, legW: 9, armW: 6, scale: 1,
    jacket: '#f06a14', jacketD: '#b9480c', jacketL: '#ff9540', shirt: '#1c1c26', pants: '#3a5f9a', pantsD: '#2a4674',
    shoe: '#18171a', skin: '#f0b89a', out: '#1a0f0c', head: 'valera', build: 'valera',
  },
  natasha: {
    thigh: 10, shin: 10, torsoH: 22, torsoW: 28, upper: 9, fore: 9, legW: 9, armW: 8, scale: 1,
    jacket: '#4e5d6c', jacketD: '#36424e', jacketL: '#6b7c8c', shirt: '#9c3b52', pants: '#2f3136', pantsD: '#222328',
    shoe: '#3b2a1e', skin: '#e2a987', out: '#1a0f0c', head: 'natasha', build: 'vatnik',
  },
  worker: {
    thigh: 10, shin: 10, torsoH: 20, torsoW: 20, upper: 9, fore: 8, legW: 7, armW: 6, scale: 1,
    jacket: '#35507a', jacketD: '#253a5a', jacketL: '#4a6a98', shirt: '#35507a', pants: '#2c4468', pantsD: '#20324e',
    shoe: '#1b1b1b', skin: '#e0a98a', out: '#12100e', head: 'worker', build: 'overall', helmet: '#e8c21c',
  },
  commando: {
    thigh: 11, shin: 11, torsoH: 22, torsoW: 20, upper: 10, fore: 9, legW: 7, armW: 6, scale: 1,
    jacket: '#23262b', jacketD: '#16181c', jacketL: '#353a42', shirt: '#4c5a3a', pants: '#23262b', pantsD: '#16181c',
    shoe: '#0c0c0c', skin: '#9a6644', out: '#0a0808', head: 'commando', build: 'tactical',
  },
};

// ---------- позы ----------
const BASE = { bob: 0, lean: 0, rot: 0, hl: 0, kl: 0, hr: 0, kr: 0, sl: 0, el: 0, sr: 0, er: 0, head: 0 };
Hum.pose = o => Object.assign({}, BASE, o);
Hum.lerpPose = (a, b, k) => {
  const r = {};
  for (const key in BASE) r[key] = a[key] + (b[key] - a[key]) * k;
  r.face = b.face; r.item = b.item; r.itemBack = b.itemBack; r.mouth = b.mouth;
  return r;
};
const S = Math.sin, C = Math.cos, PI = Math.PI;
// sl/el — дальняя рука, sr/er — ближняя; hl/kl — дальняя нога, hr/kr — ближняя
Hum.P = {
  stand: t => Hum.pose({ bob: S(t * 2.4) * 0.6, hl: -0.08, hr: 0.1, sl: -0.12, el: 0.25, sr: 0.12, er: 0.3, head: S(t * 1.2) * 0.02 }),
  run: t => {
    const p = t * 11;
    return Hum.pose({
      bob: -Math.abs(S(p)) * 2.2 + 1, lean: 0.14,
      hl: S(p) * 0.75, kl: 0.3 + Math.max(0, -C(p)) * 1.2,
      hr: -S(p) * 0.75, kr: 0.3 + Math.max(0, C(p)) * 1.2,
      sl: -S(p) * 0.8, el: 0.9, sr: S(p) * 0.8, er: 0.9,
    });
  },
  walk: t => {
    const p = t * 7;
    return Hum.pose({
      bob: -Math.abs(S(p)) * 1.2 + 0.5, lean: 0.05,
      hl: S(p) * 0.45, kl: 0.15 + Math.max(0, -C(p)) * 0.6,
      hr: -S(p) * 0.45, kr: 0.15 + Math.max(0, C(p)) * 0.6,
      sl: -S(p) * 0.45, el: 0.35, sr: S(p) * 0.45, er: 0.35,
    });
  },
  jump: () => Hum.pose({ bob: -2, lean: 0.1, hl: -0.3, kl: 0.8, hr: 0.9, kr: 1.4, sl: -2.3, el: -0.4, sr: 2.5, er: 0.5 }),
  fall: t => Hum.pose({ bob: -1, lean: -0.05, hl: -0.2 + S(t * 14) * 0.15, kl: 0.4, hr: 0.35, kr: 0.6, sl: -2.0 + S(t * 16) * 0.3, el: 0.3, sr: 2.2 + C(t * 16) * 0.3, er: 0.4 }),
  crouch: () => Hum.pose({ bob: 6, lean: 0.3, hl: 1.0, kl: 1.9, hr: 1.2, kr: 2.0, sl: 0.6, el: 0.7, sr: 0.8, er: 0.9 }),
  punch: (k, side) => {
    const ext = k < 0.5 ? k / 0.5 : 1 - (k - 0.5) * 0.6;
    const e = U.clamp(ext, 0, 1);
    const p = Hum.pose({ bob: 0.5, lean: 0.12 + e * 0.12, hl: -0.35, kl: 0.25, hr: 0.45, kr: 0.2 });
    if (side === 0) { p.sr = U.lerp(0.4, 1.62, e); p.er = U.lerp(1.8, 0, e); p.sl = -0.4; p.el = 1.6; }
    else { p.sl = U.lerp(0.4, 1.62, e); p.el = U.lerp(1.8, 0, e); p.sr = -0.3; p.er = 1.7; }
    return p;
  },
  uppercut: k => {
    const e = U.clamp(k / 0.45, 0, 1);
    return Hum.pose({ bob: U.lerp(3, -2, e), lean: U.lerp(0.35, -0.1, e), hl: -0.4, kl: 0.4, hr: 0.5, kr: U.lerp(1.0, 0.1, e), sr: U.lerp(0.2, 2.9, e), er: U.lerp(2.2, 0.2, e), sl: -0.5, el: 1.4 });
  },
  throw: k => {
    const e = U.clamp(k / 0.5, 0, 1);
    return Hum.pose({ bob: 0, lean: U.lerp(-0.12, 0.25, e), hl: -0.3, kl: 0.2, hr: 0.4, kr: 0.2, sr: U.lerp(-2.6, 1.3, e), er: U.lerp(-0.8, 0.1, e), sl: U.lerp(0.9, -0.5, e), el: 0.5 });
  },
  hurt: t => Hum.pose({ bob: 1, lean: -0.35, hl: 0.3, kl: 0.4, hr: 0.6, kr: 0.8, sl: -2.4 + S(t * 30) * 0.2, el: 0.8, sr: 2.6 + S(t * 30) * 0.2, er: 0.6 }),
  climb: t => {
    const p = t * 7;
    return Hum.pose({ bob: 0, lean: 0.04, hl: 0.3 + S(p) * 0.4, kl: 0.7 + S(p) * 0.4, hr: 0.3 - S(p) * 0.4, kr: 0.7 - S(p) * 0.4, sl: 2.8 + S(p) * 0.3, el: 0.3, sr: 2.8 - S(p) * 0.3, er: 0.3 });
  },
  // руки в боки + топает ногой, злится
  hips: t => {
    const ph = (t * 2.2) % 1;
    const lift = ph < 0.55 ? U.easeOut(ph / 0.55) : 1 - (ph - 0.55) / 0.12;
    const l = U.clamp(lift, 0, 1);
    return Hum.pose({ bob: 0, lean: -0.05, hl: -0.1, kl: 0, hr: 0.55 * l, kr: 0.9 * l, sl: -0.95, el: 1.55, sr: -0.9, er: 1.5, head: S(t * 9) * 0.03, face: 'angry' });
  },
  shout: t => Hum.pose({ bob: -1, lean: 0.12, hl: -0.3, kl: 0.1, hr: 0.35, kr: 0.1, sl: 2.25, el: 1.35, sr: 2.2, er: 1.25, head: -0.12 + S(t * 25) * 0.03, face: 'shout', mouth: 2 }),
  point: t => Hum.pose({ bob: 0, lean: 0.08, hl: -0.2, kl: 0.1, hr: 0.3, kr: 0.1, sr: 1.8 + S(t * 12) * 0.08, er: 0, sl: -0.4, el: 1.8, face: 'angry', item: 'finger' }),
  work: t => Hum.pose({ bob: 1, lean: 0.3, hl: -0.2, kl: 0.4, hr: 0.4, kr: 0.5, sl: 1.2 + S(t * 8) * 0.3, el: 0.5 + S(t * 8) * 0.3, sr: 1.1 + C(t * 8) * 0.3, er: 0.6 + C(t * 8) * 0.3 }),
  scratch: t => Hum.pose({ bob: S(t * 2) * 0.5, hl: -0.08, hr: 0.1, sl: -0.1, el: 0.3, sr: 2.7, er: 2.3 + S(t * 20) * 0.25, head: 0.1 }),
  yawn: t => Hum.pose({ bob: -1, lean: -0.15, hl: -0.08, hr: 0.1, sl: 2.9 + S(t * 3) * 0.1, el: 0.4, sr: 2.8 + S(t * 3) * 0.1, er: 0.5, head: -0.2, mouth: 2, face: 'closed' }),
  belly: t => Hum.pose({ bob: S(t * 2) * 0.5, hl: -0.08, hr: 0.1, sl: 0.4, el: 1.1 + S(t * 14) * 0.2, sr: 0.5, er: 1.2 + S(t * 14 + 1) * 0.25, head: 0.08 }),
  sitChair: t => Hum.pose({ bob: 11, lean: -0.05, hl: 1.45, kl: 1.45, hr: 1.55, kr: 1.55, sl: 1.0, el: 0.6, sr: 1.1 + S(t * 3) * 0.05, er: 0.6 }),
  sitFloor: t => Hum.pose({ bob: 19, lean: -0.1, hl: 1.5, kl: 0.1, hr: 1.4, kr: 0.2, sl: 2.7, el: 2.2, sr: 2.6, er: 2.3, head: S(t * 3) * 0.1, face: 'dizzy' }),
  drink: t => Hum.pose({ bob: 0, lean: -0.15, hl: -0.15, kl: 0.1, hr: 0.2, kr: 0.1, sr: 2.5, er: 1.9, sl: -0.2, el: 0.4, head: -0.35, item: 'bottle' }),
  holdItem: t => Hum.pose({ bob: S(t * 2.4) * 0.6, hl: -0.08, hr: 0.1, sl: -0.12, el: 0.25, sr: 0.5, er: 1.2 }),
  throwDown: k => {
    const e = U.clamp(k, 0, 1);
    return Hum.pose({ bob: 1, lean: U.lerp(-0.2, 0.45, e), hl: -0.3, kl: 0.2, hr: 0.4, kr: 0.3, sr: U.lerp(2.9, 0.5, e), er: U.lerp(0.6, 0.1, e), sl: -0.3, el: 1.0, face: 'angry' });
  },
  helmetOff: k => Hum.pose({ bob: 0, lean: 0, hl: -0.1, hr: 0.1, sr: U.lerp(0.2, 2.9, U.clamp(k, 0, 1)), er: U.lerp(0.3, 2.3, U.clamp(k, 0, 1)), sl: -0.1, el: 0.3 }),
  scared: t => Hum.pose({ bob: -3, lean: -0.3, hl: -0.3, kl: 0.2, hr: 0.8, kr: 1.3, sl: -2.6, el: 0.4, sr: 2.8, er: 0.4, face: 'scared', mouth: 2 }),
  lookUp: t => Hum.pose({ bob: 0, lean: -0.1, hl: -0.1, hr: 0.1, sl: -0.2, el: 0.3, sr: 0.2, er: 0.3, head: -0.35 }),
  ko: t => Hum.pose({ rot: -1.45, bob: 0, hl: 0.2, kl: 0.4, hr: 0.5, kr: 0.2, sl: 2.8, el: 0.4, sr: 2.4, er: 0.8, face: 'closed' }),
  rifle: t => Hum.pose({ bob: S(t * 2.4) * 0.5, hl: -0.2, kl: 0.1, hr: 0.25, kr: 0.1, sl: 0.9, el: 0.6, sr: 0.55, er: 1.5, item: 'rifle' }),
  rappel: t => Hum.pose({ bob: 0, lean: 0.1, hl: 0.7, kl: 1.0, hr: 0.9, kr: 1.2, sl: 3.05, el: 0.1, sr: 2.95, er: 0.2 }),
  slapWind: t => Hum.pose({ bob: 0, lean: -0.2, hl: -0.3, kl: 0.2, hr: 0.4, kr: 0.2, sr: -2.4 + S(t * 30) * 0.1, er: 0.6, sl: 0.6, el: 0.6, face: 'angry', mouth: 2 }),
  slap: t => Hum.pose({ bob: 0, lean: 0.35, hl: -0.4, kl: 0.2, hr: 0.6, kr: 0.2, sr: 1.4, er: 0.2, sl: -0.4, el: 0.9, face: 'angry', mouth: 2 }),
  flail: t => {
    const p = t * 14;
    return Hum.pose({
      bob: -Math.abs(S(p)) * 2, lean: 0.25, hl: S(p) * 0.9, kl: 0.3 + Math.max(0, -C(p)) * 1.3, hr: -S(p) * 0.9, kr: 0.3 + Math.max(0, C(p)) * 1.3,
      sl: 2.6 + S(p * 1.3) * 0.6, el: 0.4, sr: 2.4 + C(p * 1.3) * 0.6, er: 0.4, face: 'angry', mouth: 2,
    });
  },
  dizzy: t => Hum.pose({ bob: 0, lean: S(t * 5) * 0.2, hl: -0.1 + S(t * 5) * 0.2, hr: 0.2 - S(t * 5) * 0.2, sl: -1.8 + S(t * 6) * 0.4, el: 0.6, sr: 1.9 + C(t * 6) * 0.4, er: 0.6, head: S(t * 5) * 0.15, face: 'dizzy' }),
  weld: t => Hum.pose({ bob: 4, lean: 0.45, hl: 0.4, kl: 1.2, hr: 1.0, kr: 1.7, sl: 1.1, el: 0.4, sr: 1.3 + S(t * 3) * 0.1, er: 0.3, item: 'torch' }),
  lathe: t => Hum.pose({ bob: 0, lean: 0.2, hl: -0.1, hr: 0.2, sl: 1.3 + S(t * 3) * 0.25, el: 0.3, sr: 1.1 + C(t * 3.3) * 0.3, er: 0.5 }),
  argue: t => Hum.pose({ bob: -Math.abs(S(t * 8)) * 1.5, lean: 0.12, hl: -0.1, hr: 0.2, sl: 1.5 + S(t * 9) * 0.9, el: 0.6, sr: 2.2 + C(t * 7) * 0.8, er: 0.3, mouth: (t * 8 | 0) % 2 ? 2 : 0 }),
  sitBench: t => Hum.pose({ bob: 10, lean: 0.1, hl: 1.45, kl: 1.45, hr: 1.5, kr: 1.5, sl: 0.9, el: 0.8, sr: 1.0, er: 0.9 }),
  sleep: t => Hum.pose({ bob: 10, lean: 0.5, hl: 1.45, kl: 1.45, hr: 1.5, kr: 1.5, sl: 1.5, el: 1.8, sr: 1.4, er: 1.9, head: 0.4, face: 'closed' }),
  smoke: t => { const k = (t % 4) < 1.2; return Hum.pose({ bob: 0, lean: -0.05, hl: -0.1, hr: 0.15, sl: -0.6, el: 2.1, sr: k ? 2.5 : 0.6, er: k ? 2.0 : 1.2, item: 'cig' }); },
  lever: t => Hum.pose({ bob: 11, lean: 0.1, hl: 1.45, kl: 1.45, hr: 1.55, kr: 1.55, sl: 1.0, el: 0.6, sr: 1.3 + S(t * 6) * 0.5, er: 0.2 }),
};

// ---------- голова Валеры ----------
// Изображение — вырезано из присланного спрайта (лицо не меняем).
Hum.HEAD = { w: 22, h: 23, anchorX: 14, anchorY: 21, mouth: [15, 16.5], eyes: [[12.5, 11.4], [16.6, 11.4]] };
Hum.initHead = function () {
  const src = G.img.valeraHeadSrc;
  if (!src) return;
  G.img.valeraHead = G.downscale(src, Hum.HEAD.w, Hum.HEAD.h);
  G.img.valeraPortrait = G.downscale(src, 60, 61);
  G.img.valeraHud = G.downscale(src, 26, 27);
};

// выражение лица поверх (рот, брови, глаза) — в координатах картинки головы
Hum.faceOverlay = function (c, face, mouth, k, t) {
  const hd = Hum.HEAD;
  const [mx, my] = hd.mouth;
  if (face === 'angry' || face === 'shout') {
    c.fillStyle = '#4a2a18';
    c.fillRect(11 * k, 9 * k, 3 * k, 1 * k); c.fillRect(13 * k, 9.8 * k, 1 * k, 1 * k);
    c.fillRect(15.5 * k, 9.8 * k, 1 * k, 1 * k); c.fillRect(16 * k, 9 * k, 3 * k, 1 * k);
  }
  if (face === 'closed' || face === 'dizzy') {
    c.fillStyle = '#ecaf92';
    c.fillRect(11 * k, 10 * k, 8 * k, 3 * k);
    c.fillStyle = '#3a2418';
    if (face === 'dizzy') { c.fillRect(11.5 * k, 11 * k, 2 * k, 1 * k); c.fillRect(15.5 * k, 11 * k, 2 * k, 1 * k); }
    else { c.fillRect(11 * k, 11.5 * k, 3 * k, 1 * k); c.fillRect(15 * k, 11.5 * k, 3 * k, 1 * k); }
  }
  if (face === 'scared') {
    c.fillStyle = '#fff';
    c.fillRect(11.5 * k, 10.2 * k, 2.2 * k, 2.4 * k); c.fillRect(15.6 * k, 10.2 * k, 2.2 * k, 2.4 * k);
    c.fillStyle = '#111'; c.fillRect(12.3 * k, 11 * k, 1 * k, 1 * k); c.fillRect(16.4 * k, 11 * k, 1 * k, 1 * k);
  }
  if (mouth === 1) { c.fillStyle = '#3a0e0e'; c.fillRect((mx - 1.5) * k, (my - 0.5) * k, 3 * k, 1.6 * k); }
  else if (mouth === 2) {
    c.fillStyle = '#3a0e0e'; c.fillRect((mx - 2) * k, (my - 1) * k, 4 * k, 3 * k);
    c.fillStyle = '#c24848'; c.fillRect((mx - 1) * k, (my + 1) * k, 2 * k, 1 * k);
  }
};

function drawValeraHead(c, face, mouth, t) {
  const hd = Hum.HEAD;
  const img = G.img.valeraHead;
  c.save();
  c.translate(-hd.anchorX, -hd.anchorY);
  if (img) c.drawImage(img, 0, 0);
  else { c.fillStyle = '#f0b89a'; c.fillRect(4, 2, 16, 20); c.fillStyle = '#7a5530'; c.fillRect(2, 0, 20, 6); }
  Hum.faceOverlay(c, face, mouth, 1, t);
  c.restore();
}

function drawNatashaHead(c, face, mouth, t) {
  // якорь — низ подбородка
  c.save();
  c.translate(-2, 0);
  const o = '#1a0f0c';
  // платок (задняя часть)
  c.fillStyle = o; c.beginPath(); c.ellipse(-1, -11, 11, 11, 0, 0, PI * 2); c.fill();
  c.fillStyle = '#b3262e'; c.beginPath(); c.ellipse(-1, -11, 10, 10, 0, 0, PI * 2); c.fill();
  // лицо
  c.fillStyle = o; c.beginPath(); c.ellipse(4, -9, 8, 9, 0, 0, PI * 2); c.fill();
  c.fillStyle = '#e2a987'; c.beginPath(); c.ellipse(4, -9, 7, 8, 0, 0, PI * 2); c.fill();
  // платок спереди (лоб)
  c.fillStyle = '#b3262e'; c.beginPath(); c.ellipse(1, -17, 9, 4.5, -0.15, 0, PI * 2); c.fill();
  c.fillStyle = '#f2e6d8';
  [[-6, -15], [-2, -18], [3, -17], [-7, -9], [-4, -5], [6, -18]].forEach(([x, y]) => c.fillRect(x, y, 1, 1));
  // седые кудри
  c.fillStyle = '#b8b4ad'; c.fillRect(8, -15, 3, 2); c.fillRect(6, -14, 2, 2);
  // глаза (пьяненькие)
  c.fillStyle = '#2a1a14';
  if (face === 'closed' || face === 'dizzy') { c.fillRect(5, -11, 3, 1); c.fillRect(9, -11, 2, 1); }
  else { c.fillRect(6, -12, 2, 2); c.fillRect(9.5, -12, 1.5, 2); c.fillStyle = '#c98a70'; c.fillRect(5, -13, 3, 1); c.fillRect(9, -13, 2, 1); }
  if (face === 'angry') { c.fillStyle = '#3a2a24'; c.fillRect(5, -14, 3, 1); c.fillRect(9, -13.5, 2, 1); }
  // нос-картошка красный
  c.fillStyle = '#c8434a'; c.beginPath(); c.arc(11, -8, 2.4, 0, PI * 2); c.fill();
  c.fillStyle = '#ff7e84'; c.fillRect(11, -9, 1, 1);
  // румянец
  c.fillStyle = 'rgba(220,80,90,0.6)'; c.fillRect(5, -7, 3, 2);
  // морщины
  c.fillStyle = '#b77e66'; c.fillRect(4, -5, 2, 1); c.fillRect(8, -14.5, 1, 1);
  // рот
  if (mouth === 2) { c.fillStyle = '#3a0e0e'; c.fillRect(7, -4, 4, 3); c.fillStyle = '#e8e0c8'; c.fillRect(8, -4, 1, 1); }
  else if (mouth === 1) { c.fillStyle = '#3a0e0e'; c.fillRect(7, -4, 3, 2); }
  else { c.fillStyle = '#7a3a34'; c.fillRect(7, -3, 3, 1); }
  // узел платка под подбородком
  c.fillStyle = '#b3262e'; c.fillRect(-3, -2, 5, 3); c.fillRect(-5, 0, 3, 3);
  c.restore();
}

function drawWorkerHead(c, face, mouth, t, st) {
  const o = st.out;
  c.fillStyle = o; c.beginPath(); c.ellipse(2, -8, 7, 8, 0, 0, PI * 2); c.fill();
  c.fillStyle = st.skin; c.beginPath(); c.ellipse(2, -8, 6, 7, 0, 0, PI * 2); c.fill();
  c.fillStyle = '#2a1a14'; c.fillRect(5, -10, 1, 2); c.fillRect(8, -10, 1, 2);
  if (st.mustache) { c.fillStyle = st.mustache; c.fillRect(4, -5, 6, 2); }
  if (mouth === 2) { c.fillStyle = '#3a0e0e'; c.fillRect(5, -4, 3, 2); }
  c.fillStyle = '#d4927a'; c.fillRect(8, -8, 2, 2);
  // каска
  c.fillStyle = o; c.beginPath(); c.ellipse(1, -13, 8, 5.5, 0, PI, 0); c.fill(); c.fillRect(-7, -14, 17, 3);
  c.fillStyle = st.helmet || '#e8c21c'; c.beginPath(); c.ellipse(1, -13, 7, 4.5, 0, PI, 0); c.fill(); c.fillRect(-6, -13, 15, 2);
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-2, -16, 3, 1);
}

function drawCommandoHead(c, face, mouth, t, st) {
  const o = st.out;
  c.fillStyle = o; c.beginPath(); c.ellipse(2, -8, 7, 8, 0, 0, PI * 2); c.fill();
  c.fillStyle = st.skin; c.beginPath(); c.ellipse(2, -8, 6, 7, 0, 0, PI * 2); c.fill();
  c.fillStyle = '#140c08'; c.fillRect(5, -10, 2, 1); c.fillRect(8, -10, 1, 1);
  c.fillStyle = '#6e4630'; c.fillRect(9, -8, 2, 2);
  // усы
  c.fillStyle = '#0d0907'; c.fillRect(4, -5, 7, 2); c.fillRect(3, -4, 2, 2);
  if (st.beard) { c.fillRect(-2, -5, 10, 4); c.fillRect(0, -2, 7, 2); }
  if (mouth === 2) { c.fillStyle = '#3a0e0e'; c.fillRect(6, -3, 3, 2); }
  // чёрная повязка-патка
  c.fillStyle = '#0e0e10'; c.beginPath(); c.ellipse(1, -12, 8, 6, 0, PI, 0); c.fill(); c.fillRect(-7, -13, 16, 3);
  c.fillRect(-9, -12, 3, 5);
  c.fillStyle = '#2a2a30'; c.fillRect(-3, -17, 5, 1);
}

// ---------- отрисовка персонажа ----------
function limb(c, x, y, a, len, w, col, out) {
  const ex = x + S(a) * len, ey = y + C(a) * len;
  c.lineCap = 'round';
  c.strokeStyle = out; c.lineWidth = w + 2;
  c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
  c.strokeStyle = col; c.lineWidth = w;
  c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
  return [ex, ey];
}
function rotP(x, y, a) { return [x * C(a) - y * S(a), x * S(a) + y * C(a)]; }

function drawLeg(c, st, hx, hy, ha, ka, back) {
  const col = back ? st.pantsD : st.pants;
  const [kx, ky] = limb(c, hx, hy, ha, st.thigh, st.legW, col, st.out);
  const sa = ha - ka;
  const [fx, fy] = limb(c, kx, ky, sa, st.shin, st.legW - 1, col, st.out);
  // ботинок
  c.save(); c.translate(fx, fy); c.rotate(-sa);
  c.fillStyle = st.out; c.fillRect(-4, -2, 11, 5);
  c.fillStyle = back ? '#0e0e10' : st.shoe; c.fillRect(-3, -1, 9, 3);
  c.fillStyle = '#3a3a40'; c.fillRect(-3, 1, 9, 1);
  c.restore();
}

function drawHand(c, st, x, y) {
  c.fillStyle = st.out; c.beginPath(); c.arc(x, y, 3.3, 0, PI * 2); c.fill();
  c.fillStyle = st.skin; c.beginPath(); c.arc(x, y, 2.4, 0, PI * 2); c.fill();
}

function drawItem(c, item, x, y, a, t) {
  if (!item) return;
  c.save(); c.translate(x, y); c.rotate(-a);
  switch (item) {
    case 'bottle':
      c.fillStyle = '#0c1a0c'; c.fillRect(-3, -2, 6, 12); c.fillRect(-1.5, 9, 3, 5);
      c.fillStyle = '#2f8a3a'; c.fillRect(-2, -1, 4, 10); c.fillRect(-1, 9, 2, 4);
      c.fillStyle = '#7fd08a'; c.fillRect(-1, 0, 1, 7);
      c.fillStyle = '#e8d8a0'; c.fillRect(-2, 2, 4, 3);
      break;
    case 'finger':
      c.fillStyle = '#1a0f0c'; c.fillRect(-1.5, 1, 3, 6);
      c.fillStyle = '#f0b89a'; c.fillRect(-0.5, 1, 1.5, 5);
      break;
    case 'rifle':
      c.rotate(a - 1.45);
      c.fillStyle = '#0c0c0c'; c.fillRect(-8, -3, 30, 4); c.fillRect(-12, -2, 6, 6); c.fillRect(4, 0, 3, 7); c.fillRect(12, 0, 2, 5);
      c.fillStyle = '#5a3a22'; c.fillRect(-12, -1, 5, 4);
      c.fillStyle = '#2d2d33'; c.fillRect(-6, -2, 26, 1);
      break;
    case 'torch':
      c.fillStyle = '#333'; c.fillRect(-1, 0, 3, 8);
      if ((t * 20 | 0) % 2) { c.fillStyle = '#bff'; c.fillRect(-2, 8, 5, 3); c.fillStyle = '#fff'; c.fillRect(-1, 9, 2, 2); }
      break;
    case 'cig':
      c.fillStyle = '#eee'; c.fillRect(0, -1, 4, 1); c.fillStyle = '#f84'; c.fillRect(4, -1, 1, 1);
      break;
    case 'wrench':
      c.fillStyle = '#1a1a1a'; c.fillRect(-2, -2, 4, 14);
      c.fillStyle = '#9aa4ae'; c.fillRect(-1, -1, 2, 12); c.fillRect(-3, 10, 6, 3);
      break;
    case 'helmet':
      c.fillStyle = '#1a0f0c'; c.beginPath(); c.ellipse(0, 4, 8, 5.5, 0, PI, 0); c.fill(); c.fillRect(-9, 3, 18, 3);
      c.fillStyle = '#f2f2ee'; c.beginPath(); c.ellipse(0, 4, 7, 4.5, 0, PI, 0); c.fill(); c.fillRect(-8, 4, 16, 1);
      break;
  }
  c.restore();
}

function drawTorso(c, st, flash) {
  const T = st.torsoH, hw = st.torsoW / 2, o = st.out;
  if (st.build === 'valera') {
    // капюшон за головой
    c.fillStyle = o; c.beginPath(); c.ellipse(-5, -T - 1, 8, 6, 0, 0, PI * 2); c.fill();
    c.fillStyle = st.jacketD; c.beginPath(); c.ellipse(-5, -T - 1, 7, 5, 0, 0, PI * 2); c.fill();
    // куртка
    c.fillStyle = o;
    c.beginPath();
    c.moveTo(-hw, 4); c.lineTo(-hw - 1, -T + 6); c.quadraticCurveTo(-hw, -T - 1, -4, -T - 1);
    c.lineTo(6, -T - 1); c.quadraticCurveTo(hw + 1, -T + 1, hw + 2, -T + 10);
    c.quadraticCurveTo(hw + 5, -6, hw + 1, 4); c.closePath(); c.fill();
    c.fillStyle = st.jacket;
    c.beginPath();
    c.moveTo(-hw + 1, 3); c.lineTo(-hw, -T + 6); c.quadraticCurveTo(-hw + 1, -T, -4, -T);
    c.lineTo(6, -T); c.quadraticCurveTo(hw, -T + 2, hw + 1, -T + 10);
    c.quadraticCurveTo(hw + 4, -6, hw, 3); c.closePath(); c.fill();
    // тень сзади и подсветка
    c.fillStyle = st.jacketD; c.fillRect(-hw + 1, -T + 6, 4, T + 1);
    c.fillStyle = st.jacketL; c.fillRect(-2, -T + 2, 3, 8);
    // чёрная футболка (куртка расстёгнута)
    c.fillStyle = st.shirt;
    c.beginPath(); c.moveTo(4, -T); c.lineTo(9, -T); c.quadraticCurveTo(hw + 4, -8, hw - 1, 2); c.lineTo(5, 2); c.quadraticCurveTo(7, -10, 4, -T); c.fill();
    // подол-резинка
    c.fillStyle = st.jacketD; c.fillRect(-hw + 1, 0, st.torsoW - 3, 3);
    // шнурки капюшона
    c.fillStyle = '#111'; c.fillRect(3, -T + 1, 1, 7); c.fillRect(9, -T + 1, 1, 6);
    // капюшон-воротник
    c.fillStyle = st.jacketD; c.fillRect(-6, -T - 1, 9, 3);
  } else if (st.build === 'vatnik') {
    c.fillStyle = o; c.beginPath(); c.roundRect(-hw - 1, -T - 1, st.torsoW + 4, T + 7, 7); c.fill();
    c.fillStyle = st.jacket; c.beginPath(); c.roundRect(-hw, -T, st.torsoW + 2, T + 5, 6); c.fill();
    c.fillStyle = st.jacketD;
    for (let y = -T + 5; y < 4; y += 5) c.fillRect(-hw + 1, y, st.torsoW, 1);
    c.fillStyle = st.shirt; c.fillRect(hw - 6, -T + 1, 5, T - 4);
    c.fillStyle = '#e0c040'; c.fillRect(hw - 1, -T + 5, 1, 1); c.fillRect(hw - 1, -T + 11, 1, 1);
    // оранжевая сигнальная полоса
    c.fillStyle = '#f07820'; c.fillRect(-hw, -8, st.torsoW + 2, 3);
    c.fillStyle = '#e0e0d0'; c.fillRect(-hw, -7, st.torsoW + 2, 1);
  } else if (st.build === 'overall') {
    c.fillStyle = o; c.beginPath(); c.roundRect(-hw - 1, -T - 1, st.torsoW + 2, T + 6, 4); c.fill();
    c.fillStyle = st.jacket; c.beginPath(); c.roundRect(-hw, -T, st.torsoW, T + 4, 3); c.fill();
    c.fillStyle = st.jacketD; c.fillRect(-hw, -T + 8, st.torsoW, 2); c.fillRect(2, -T + 10, 5, 5);
    c.fillStyle = '#d8d0b0'; c.fillRect(-hw + 2, -T + 12, 4, 1);
  } else if (st.build === 'tactical') {
    c.fillStyle = o; c.beginPath(); c.roundRect(-hw - 1, -T - 1, st.torsoW + 2, T + 6, 4); c.fill();
    c.fillStyle = st.jacket; c.beginPath(); c.roundRect(-hw, -T, st.torsoW, T + 4, 3); c.fill();
    c.fillStyle = st.shirt; c.fillRect(-hw + 2, -T + 3, st.torsoW - 3, 13);
    c.fillStyle = '#3a4630'; c.fillRect(-hw + 3, -T + 8, 5, 5); c.fillRect(2, -T + 8, 5, 5);
    c.fillStyle = '#111'; c.fillRect(-hw, -2, st.torsoW, 2);
  }
  if (flash) { c.globalCompositeOperation = 'source-atop'; }
}

// главная функция: x,y — точка между стопами на земле
Hum.draw = function (c, x, y, pose, st, facing, opt = {}) {
  const t = opt.t || 0;
  c.save();
  c.translate(Math.round(x), Math.round(y));
  if (opt.alpha != null) c.globalAlpha = opt.alpha;
  c.scale(facing * st.scale, st.scale);
  const L = st.thigh + st.shin;
  const hipY = -L + pose.bob;
  if (pose.rot) { c.translate(0, hipY); c.rotate(pose.rot); c.translate(0, -hipY); }
  const lean = pose.lean;
  const T = st.torsoH;
  const shB = rotP(-2, -T + 5, lean), shF = rotP(3, -T + 5, lean);
  const neck = rotP(2, -T + 1, lean);

  // дальняя рука
  const sbx = shB[0], sby = hipY + shB[1];
  const [ebx, eby] = limb(c, sbx, sby, pose.sl + lean, st.upper, st.armW, st.jacketD, st.out);
  const [hbx, hby] = limb(c, ebx, eby, pose.sl + pose.el + lean, st.fore, st.armW - 1, st.jacketD, st.out);
  if (pose.itemBack) drawItem(c, pose.itemBack, hbx, hby, pose.sl + pose.el + lean, t);
  drawHand(c, st, hbx, hby);
  // ноги
  drawLeg(c, st, -2, hipY, pose.hl, pose.kl, true);
  drawLeg(c, st, 3, hipY, pose.hr, pose.kr, false);
  // туловище
  c.save(); c.translate(0, hipY); c.rotate(lean); drawTorso(c, st); c.restore();
  // голова
  c.save();
  c.translate(neck[0], hipY + neck[1]);
  c.rotate(lean * 0.5 + pose.head);
  const face = pose.face || opt.face;
  const mouth = opt.talking ? ((t * 10 | 0) % 2 ? 1 : 0) + (pose.mouth === 2 ? 1 : 0) : (pose.mouth || 0);
  if (st.head === 'valera') {
    drawValeraHead(c, face, Math.min(2, mouth), t);
    if (opt.helmet) { drawItem(c, 'helmet', 1, -17, 0, t); }
  } else if (st.head === 'natasha') drawNatashaHead(c, face, Math.min(2, mouth), t);
  else if (st.head === 'worker') drawWorkerHead(c, face, Math.min(2, mouth), t, st);
  else if (st.head === 'commando') drawCommandoHead(c, face, Math.min(2, mouth), t, st);
  c.restore();
  // ближняя рука
  const sfx = shF[0], sfy = hipY + shF[1];
  const [efx, efy] = limb(c, sfx, sfy, pose.sr + lean, st.upper, st.armW, st.jacket, st.out);
  const fa = pose.sr + pose.er + lean;
  const [hfx, hfy] = limb(c, efx, efy, fa, st.fore, st.armW - 1, st.jacket, st.out);
  if (pose.item) drawItem(c, pose.item, hfx, hfy, fa, t);
  drawHand(c, st, hfx, hfy);
  c.restore();
  // белая вспышка при попадании
  if (opt.flash) {
    c.save(); c.globalCompositeOperation = 'source-atop'; c.restore();
  }
};

// экземпляр персонажа с плавным переходом между позами
Hum.Rig = class {
  constructor(styleName, extra) {
    this.st = Object.assign({}, Hum.STYLES[styleName], extra || {});
    this.pose = Hum.P.stand(0);
    this.t = 0;
  }
  update(dt, target, snap) {
    this.t += dt;
    const k = snap ? 1 : Math.min(1, dt * 20);
    this.pose = Hum.lerpPose(this.pose, target, k);
  }
  draw(c, x, y, facing, opt = {}) {
    Hum.draw(c, x, y, this.pose, this.st, facing, Object.assign({ t: this.t }, opt));
  }
};

// рисование силуэта персонажа белым (вспышка урона) — рендер в буфер
const [flashCv, flashCx] = G.makeCanvas(140, 140);
Hum.drawFlash = function (c, rig, x, y, facing, opt = {}) {
  flashCx.clearRect(0, 0, 140, 140);
  Hum.draw(flashCx, 70, 110, rig.pose, rig.st, facing, Object.assign({ t: rig.t }, opt));
  flashCx.globalCompositeOperation = 'source-atop';
  flashCx.fillStyle = opt.flashColor || '#fff';
  flashCx.fillRect(0, 0, 140, 140);
  flashCx.globalCompositeOperation = 'source-over';
  c.drawImage(flashCv, Math.round(x) - 70, Math.round(y) - 110);
};

// портрет Натальи для диалогов
Hum.drawPortrait = function (c, who, x, y, talking, t, face) {
  c.save();
  c.fillStyle = '#12151a'; c.fillRect(x - 2, y - 2, 68, 68);
  c.fillStyle = who === 'valera' ? '#5a2a10' : who === 'natasha' ? '#4a1a22' : '#1a2a1a';
  c.fillRect(x, y, 64, 64);
  c.beginPath(); c.rect(x, y, 64, 64); c.clip();
  const mouth = talking ? ((t * 10 | 0) % 2) : 0;
  if (who === 'valera' && G.img.valeraPortrait) {
    // плечи-куртка
    c.fillStyle = '#f06a14'; c.fillRect(x + 4, y + 52, 58, 14);
    c.fillStyle = '#1c1c26'; c.fillRect(x + 30, y + 52, 14, 14);
    c.drawImage(G.img.valeraPortrait, x + 1, y + 2);
    c.save(); c.translate(x + 1, y + 2);
    Hum.faceOverlay(c, face, mouth ? (face === 'shout' ? 2 : 1) : 0, 60 / 22, t);
    c.restore();
  } else {
    c.translate(x + (who === 'natasha' ? 22 : 26), y + 62);
    c.scale(2.6, 2.6);
    const st = Hum.STYLES[who] || Hum.STYLES.worker;
    const sty = who === 'commando2' ? Object.assign({}, Hum.STYLES.commando, { beard: true }) : st;
    c.fillStyle = sty.jacket; c.fillRect(-12, -4, 24, 8);
    if (who === 'natasha') drawNatashaHead(c, face, mouth, t);
    else if (who === 'commando' || who === 'commando2') drawCommandoHead(c, face, mouth ? 2 : 0, t, sty);
    else drawWorkerHead(c, face, mouth ? 2 : 0, t, sty);
  }
  c.restore();
};
