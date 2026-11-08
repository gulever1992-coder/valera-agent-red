'use strict';
// ============ МУЗЫКА v3: всё в духе саундтрека Serious Sam 3 (эпичный металл, хор, струнные, большой барабан) ============
// Всё синтезируется WebAudio, без файлов. Темы уровней — постоянный «сид» (тема узнаваемая),
// боссы — у каждого свой стиль металла, а рифф/соло/темп генерируются заново при каждом заходе в бой.
// Подмена имён: старые вызовы Music.play('boss'|'level'|'city'|...) превращаются в трек текущего уровня (resolve).
// Тест-плеер всех треков: ?jukebox
(function () {
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // ---------- студия: общие шины (эхо, реверб, два гитарных усилителя, усилитель соло) ----------
  const curve = k => { const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } return c; };
  const DIST = curve(12), SOFT = curve(4);
  let FX = null;
  function impulse(a, sec) {
    const n = a.sampleRate * sec | 0, b = a.createBuffer(2, n, a.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
    return b;
  }
  function studio() {
    const a = Sound.ac; if (!a) return null;
    if (FX && FX.ac === a) return FX;
    const B = (type, f, q, g) => { const n = a.createBiquadFilter(); n.type = type; n.frequency.value = f; if (q != null) n.Q.value = q; if (g != null) n.gain.value = g; return n; };
    const out = a.createGain(); out.gain.value = 1.35; out.connect(Sound.musG);
    const comp = a.createDynamicsCompressor(); comp.threshold.value = -18; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2; comp.connect(out);
    const bus = a.createGain(); bus.gain.value = 1; bus.connect(comp);
    const echo = a.createGain(), dl = a.createDelay(2), fb = a.createGain(), ef = B('lowpass', 2600), er = a.createGain();
    fb.gain.value = 0.34; er.gain.value = 0.5; dl.delayTime.value = 0.3;
    echo.connect(dl); dl.connect(ef); ef.connect(fb); fb.connect(dl); ef.connect(er); er.connect(bus);
    const rev = a.createGain(), cv = a.createConvolver(), rr = a.createGain(); cv.buffer = impulse(a, 2.4); rr.gain.value = 0.45;
    rev.connect(cv); cv.connect(rr); rr.connect(bus);
    const nb = a.createBuffer(1, a.sampleRate * 2, a.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const pan = (node, p) => { if (!a.createStereoPanner) { node.connect(bus); return; } const s = a.createStereoPanner(); s.pan.value = p; node.connect(s); s.connect(bus); };
    // гитарный усилитель: фильтр -> перегруз -> «кабинет»
    const amp = p => {
      const inp = a.createGain(), hp = B('highpass', 100, 0.7), pre = a.createGain(), sh = a.createWaveShaper(),
        lo = B('peaking', 400, 1.1, -5), mid = B('peaking', 1600, 0.9, 4), lp = B('lowpass', 5200, 0.8), o = a.createGain();
      pre.gain.value = 7; sh.curve = DIST; sh.oversample = '2x'; o.gain.value = 0.085;
      inp.connect(hp); hp.connect(pre); pre.connect(sh); sh.connect(lo); lo.connect(mid); mid.connect(lp); lp.connect(o); pan(o, p);
      return inp;
    };
    const lead = (() => {
      const inp = a.createGain(), pre = a.createGain(), sh = a.createWaveShaper(), lp = B('lowpass', 4600, 0.7), o = a.createGain(), e = a.createGain(), r = a.createGain();
      pre.gain.value = 9; sh.curve = DIST; sh.oversample = '2x'; lp.frequency.value = 3400; o.gain.value = 0.16; e.gain.value = 0.22; r.gain.value = 0.2;
      inp.connect(pre); pre.connect(sh); sh.connect(lp); lp.connect(o); o.connect(bus); lp.connect(e); e.connect(echo); lp.connect(r); r.connect(rev);
      return inp;
    })();
    FX = { ac: a, bus, echo, rev, dl, noise: nb, gL: amp(-0.6), gR: amp(0.6), lead };
    return FX;
  }

  // ---------- инструменты ----------
  function syn(t, m, dur, v, P) {
    const a = Sound.ac, F = FX;
    const A = P.a != null ? P.a : 0.005, D = P.d != null ? P.d : 0.15, Su = P.s != null ? P.s : 0.7, Rl = P.r != null ? P.r : 0.1;
    const g = a.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + A);
    g.gain.setTargetAtTime(v * Su, t + A, D / 3 + 0.001);
    const end = t + Math.max(dur, A + 0.01), stopT = end + Rl * 2 + 0.05;
    g.gain.setTargetAtTime(0, end, Rl / 3 + 0.001);
    let dst = g;
    if (P.cut) {
      const f = a.createBiquadFilter(); f.type = P.ft || 'lowpass'; f.Q.value = P.q || 0.8;
      if (P.fenv) { f.frequency.setValueAtTime(Math.min(15000, P.cut * P.fenv), t); f.frequency.setTargetAtTime(P.cut, t + 0.002, P.fd || 0.08); }
      else f.frequency.value = P.cut;
      f.connect(g); dst = f;
    }
    const fr = mf(m), oscs = [];
    const mk = (type, det, semi, gain) => {
      const o = a.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(fr * Math.pow(2, (semi || 0) / 12), t); o.detune.value = det || 0;
      if (P.slide) o.frequency.exponentialRampToValueAtTime(fr * Math.pow(2, ((semi || 0) + P.slide) / 12), t + (P.slideT || dur));
      if (gain != null && gain !== 1) { const gg = a.createGain(); gg.gain.value = gain; o.connect(gg); gg.connect(dst); } else o.connect(dst);
      o.start(t); o.stop(stopT); oscs.push(o);
    };
    mk(P.w || 'square', -(P.det || 0) / 2, 0);
    if (P.w2) mk(P.w2, (P.det || 0) / 2, P.oct2 || 0, P.m2 != null ? P.m2 : 1);
    if (P.vib) {
      const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = P.vibR || 5.5;
      lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(P.vib, t + (P.vibD || 0.25));
      l.connect(lg); oscs.forEach(o => lg.connect(o.detune)); l.start(t); l.stop(stopT);
    }
    let out = P.amp === 'lead' ? F.lead : F.bus;
    if (P.pan && a.createStereoPanner) { const p = a.createStereoPanner(); p.pan.value = P.pan; p.connect(out); out = p; }
    g.connect(out);
    if (P.echo) { const e = a.createGain(); e.gain.value = P.echo; g.connect(e); e.connect(F.echo); }
    if (P.rev) { const r = a.createGain(); r.gain.value = P.rev; g.connect(r); r.connect(F.rev); }
  }
  // перегруженная гитара: два дубля (лево/право); mute — глушёный «чаг», iv — интервалы (квинта+октава)
  function gtr(t, m, dur, o) {
    const a = Sound.ac, F = FX, iv = o.iv || (o.mute ? [0, 7] : [0, 7, 12]), v = o.v || 1;
    for (let side = 0; side < 2; side++) {
      const t0 = t + side * 0.008, g = a.createGain(), f = a.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = o.mute ? 480 : (o.cut || 3200); f.Q.value = o.mute ? 2.2 : 0.7;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + 0.003);
      let stopT;
      if (o.mute) { g.gain.setTargetAtTime(0, t0 + 0.02, 0.045); stopT = t0 + 0.32; }
      else { g.gain.setTargetAtTime(v * 0.75, t0 + 0.01, 0.25); g.gain.setTargetAtTime(0, t0 + dur, 0.035); stopT = t0 + dur + 0.22; }
      f.connect(g); g.connect(side ? F.gR : F.gL);
      for (const i of iv) {
        const os = a.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(mf(m + i), t0);
        if (o.slide) os.frequency.exponentialRampToValueAtTime(mf(m + i + o.slide), t0 + dur);
        os.detune.value = (side ? 7 : -7) + (Math.random() * 6 - 3); os.connect(f); os.start(t0); os.stop(stopT);
      }
    }
  }
  function nz(t, dur, v, type, f, q, f2) {
    const a = Sound.ac, s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
    s.buffer = FX.noise; fl.type = type; fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    if (q) fl.Q.value = q;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(FX.bus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
    return g;
  }
  function boom(t, f1, f2, dec, v, type) {
    const a = Sound.ac, o = a.createOscillator(), g = a.createGain(); o.type = type || 'sine';
    o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dec * 0.3);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dec);
    o.connect(g); g.connect(FX.bus); o.start(t); o.stop(t + dec + 0.05); return g;
  }
  const DR = {
    k: (t, v) => { boom(t, 170, 46, 0.32, v * 0.95); nz(t, 0.012, v * 0.35, 'highpass', 2600); },
    s: (t, v) => { nz(t, 0.17, v * 0.5, 'bandpass', 1900, 0.6).connect(FX.rev); boom(t, 220, 150, 0.09, v * 0.4, 'triangle'); },
    h: (t, v) => nz(t, 0.035, v * 0.2, 'highpass', 7800),
    o: (t, v) => nz(t, 0.24, v * 0.16, 'highpass', 7000),
    r: (t, v) => { nz(t, 0.4, v * 0.1, 'bandpass', 6400, 1.3); boom(t, 3200, 3150, 0.35, v * 0.025); },
    c: (t, v) => nz(t, 1.6, v * 0.28, 'highpass', 4200).connect(FX.rev),
    x: (t, v) => { for (let i = 0; i < 3; i++) nz(t + i * 0.011, i < 2 ? 0.02 : 0.16, v * 0.4, 'bandpass', 1500, 1.2); },
    m: (t, v) => { boom(t, 1800, 1700, 0.035, v * 0.18, 'triangle'); nz(t, 0.015, v * 0.12, 'highpass', 3000); },
    t: (t, v) => boom(t, 230, 150, 0.28, v * 0.6),
    T: (t, v) => boom(t, 140, 90, 0.34, v * 0.7),
    f: (t, v) => boom(t, 92, 58, 0.42, v * 0.75),
    b: (t, v) => nz(t, 0.05, v * 0.12, 'bandpass', 5200, 1),
    D: (t, v) => { boom(t, 120, 68, 0.3, v * 0.7); nz(t, 0.03, v * 0.15, 'lowpass', 400); },                  // дарбука: «дум»
    q: (t, v) => { nz(t, 0.05, v * 0.3, 'bandpass', 3200, 2.5); boom(t, 900, 700, 0.04, v * 0.12, 'triangle'); },  // дарбука: «тек»
    G: (t, v) => { boom(t, 95, 38, 0.9, v * 0.9).connect(FX.rev); nz(t, 0.25, v * 0.2, 'lowpass', 300); },      // большой военный барабан
    a: (t, v) => { boom(t, 2350, 2300, 0.5, v * 0.06, 'sine').connect(FX.rev); boom(t, 3410, 3400, 0.35, v * 0.04, 'sine'); boom(t, 5900, 5850, 0.2, v * 0.025, 'square'); },   // наковальня
  };

  // ---------- пресеты ----------
  const I = {
    sq: { w: 'square', a: 0.004, d: 0.12, s: 0.6, r: 0.07, cut: 3800, vib: 10, echo: 0.22 },
    sqb: { w: 'square', w2: 'triangle', oct2: -12, a: 0.003, d: 0.15, s: 0.5, r: 0.05, cut: 1400 },
    saw: { w: 'sawtooth', w2: 'sawtooth', det: 10, a: 0.01, d: 0.2, s: 0.7, r: 0.12, cut: 2400, q: 2, fenv: 2, fd: 0.1, vib: 14, echo: 0.28, rev: 0.2 },
    sax: { w: 'sawtooth', w2: 'square', det: 6, a: 0.035, d: 0.2, s: 0.75, r: 0.12, cut: 1500, q: 3, fenv: 1.8, fd: 0.12, vib: 18, vibR: 5, rev: 0.3 },
    flute: { w: 'sine', w2: 'triangle', oct2: 12, m2: 0.25, a: 0.06, d: 0.2, s: 0.85, r: 0.18, vib: 22, vibR: 5, vibD: 0.35, rev: 0.45, echo: 0.2 },
    pluck: { w: 'triangle', w2: 'square', oct2: 12, m2: 0.3, a: 0.002, d: 0.22, s: 0, r: 0.1, cut: 2600, fenv: 3, fd: 0.05, echo: 0.3, rev: 0.2 },
    harp: { w: 'triangle', w2: 'sine', oct2: 12, m2: 0.5, a: 0.002, d: 0.5, s: 0, r: 0.3, rev: 0.45, echo: 0.15 },
    epiano: { w: 'sine', w2: 'triangle', oct2: 12, m2: 0.35, a: 0.003, d: 0.6, s: 0.25, r: 0.3, rev: 0.3 },
    vibes: { w: 'sine', w2: 'sine', oct2: 24, m2: 0.18, a: 0.002, d: 0.7, s: 0.1, r: 0.4, vib: 9, vibR: 6, rev: 0.4, echo: 0.15 },
    bell: { w: 'sine', w2: 'sine', oct2: 19, m2: 0.4, a: 0.002, d: 0.8, s: 0, r: 0.5, rev: 0.5, echo: 0.35 },
    pad: { w: 'sawtooth', w2: 'sawtooth', det: 16, a: 0.45, d: 0.6, s: 0.9, r: 0.7, cut: 1100, rev: 0.55 },
    dark: { w: 'sawtooth', w2: 'square', det: 20, oct2: -12, a: 0.6, d: 0.8, s: 0.9, r: 0.9, cut: 650, q: 2, rev: 0.6 },
    choir: { w: 'sawtooth', w2: 'sawtooth', det: 12, a: 0.35, d: 0.5, s: 0.9, r: 0.6, cut: 1250, q: 1.2, vib: 7, rev: 0.65 },
    organ: { w: 'sine', w2: 'square', oct2: 12, m2: 0.22, a: 0.01, d: 0.1, s: 0.95, r: 0.08, cut: 3000, vib: 12, vibR: 6.5, rev: 0.25 },
    brass: { w: 'sawtooth', w2: 'sawtooth', det: 8, a: 0.04, d: 0.25, s: 0.75, r: 0.12, cut: 900, q: 1.5, fenv: 3, fd: 0.15, rev: 0.2 },
    stab: { w: 'sawtooth', w2: 'sawtooth', det: 28, a: 0.002, d: 0.22, s: 0.2, r: 0.12, cut: 3200, fenv: 1.6, rev: 0.3, echo: 0.2 },
    acid: { w: 'sawtooth', a: 0.002, d: 0.16, s: 0.35, r: 0.05, cut: 320, q: 13, fenv: 7, fd: 0.09 },
    wob: { w: 'square', w2: 'sawtooth', det: 30, a: 0.01, d: 0.3, s: 0.7, r: 0.2, cut: 2000, vib: 45, vibR: 7, vibD: 0.05, echo: 0.45, rev: 0.3 },
    harpsi: { w: 'sawtooth', w2: 'square', oct2: 12, m2: 0.5, a: 0.001, d: 0.25, s: 0, r: 0.1, cut: 4200, fenv: 1.5, fd: 0.05, echo: 0.18, rev: 0.2 },
    siren: { w: 'square', w2: 'square', det: 12, a: 0.02, d: 0.1, s: 0.9, r: 0.1, cut: 2600, rev: 0.2 },
    lead: { w: 'sawtooth', w2: 'sawtooth', det: 10, a: 0.004, d: 0.25, s: 0.8, r: 0.08, cut: 4200, vib: 14, vibR: 6, vibD: 0.35, amp: 'lead' },
    str: { w: 'sawtooth', w2: 'sawtooth', det: 14, a: 0.006, d: 0.1, s: 0.5, r: 0.06, cut: 2600, q: 0.9, rev: 0.35 },          // струнные стаккато
    strL: { w: 'sawtooth', w2: 'sawtooth', det: 18, a: 0.25, d: 0.5, s: 0.9, r: 0.5, cut: 1800, rev: 0.55 },   // струнные легато
    strM: { w: 'sawtooth', w2: 'sawtooth', det: 14, a: 0.06, d: 0.3, s: 0.85, r: 0.3, cut: 2200, rev: 0.5, echo: 0.12 },  // струнные-мелодия
    ney: { w: 'sine', w2: 'sawtooth', m2: 0.12, a: 0.07, d: 0.2, s: 0.85, r: 0.2, cut: 2400, vib: 28, vibR: 5.5, vibD: 0.3, rev: 0.6, echo: 0.25 }, // восточная флейта
    // басы
    bass: { w: 'sawtooth', w2: 'square', oct2: -12, m2: 0.6, a: 0.003, d: 0.2, s: 0.6, r: 0.05, cut: 700, q: 1.2, fenv: 2.5, fd: 0.06 },
    bassR: { w: 'triangle', w2: 'sine', oct2: -12, m2: 0.8, a: 0.004, d: 0.3, s: 0.5, r: 0.08 },
    bassW: { w: 'triangle', w2: 'sawtooth', m2: 0.25, a: 0.005, d: 0.25, s: 0.35, r: 0.1, cut: 900 },
    bassM: { w: 'sawtooth', w2: 'sawtooth', det: 8, oct2: -12, m2: 0.7, a: 0.002, d: 0.15, s: 0.7, r: 0.04, cut: 900, q: 1, fenv: 2, fd: 0.04 },
  };

  // ---------- песня: сетка шагов с событиями ----------
  class Song {
    constructor(bpm, sub, bars) { this.bpm = bpm; this.sub = sub || 4; this.spb = this.sub * 4; this.len = bars * this.spb; this.ev = Array.from({ length: this.len }, () => []); this.loopFrom = 0; this.swing = 0; this.echo = 0; }
    at(step, fn) { step = Math.round(step); if (step >= 0 && step < this.len) this.ev[step].push(fn); }
    note(step, inst, m, len, v) { const P = typeof inst === 'string' ? I[inst] : inst; this.at(step, (t, sd) => syn(t, m, len * sd * 0.95, v, P)); }
    gtr(step, m, len, o) { this.at(step, (t, sd) => gtr(t, m, len * sd, o)); }
    hit(step, k, v) { const f = DR[k]; if (f) this.at(step, t => f(t, v)); }
    drums(bar0, n, lanes, vol = 1) {
      for (let b = bar0; b < bar0 + n; b++) for (const k in lanes) {
        const s = lanes[k];
        for (let i = 0; i < this.spb; i++) { const ch = s[i % s.length]; if (ch !== '.') this.hit(b * this.spb + i, k, vol * (ch === 'X' ? 1.25 : ch === '-' ? 0.45 : 1)); }
      }
    }
    fill(bar, beats = 1, vol = 1) {
      const n = beats * this.sub, st = (bar + 1) * this.spb - n, seq = ['t', 't', 'T', 'T', 'f', 'f'];
      for (let i = 0; i < n; i++) this.hit(st + i, n > 4 ? seq[Math.floor(i / n * 6)] : (i < n / 2 ? 't' : 'T'), vol * (0.7 + 0.3 * i / n));
    }
  }

  // ---------- гармония и мелодия ----------
  const QUAL = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], sus: [0, 5, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], M7: [0, 4, 7, 11], m7b5: [0, 3, 6, 10] };
  const SC = {
    min: [0, 2, 3, 5, 7, 8, 10], maj: [0, 2, 4, 5, 7, 9, 11], dor: [0, 2, 3, 5, 7, 9, 10], phr: [0, 1, 3, 5, 7, 8, 10],
    harm: [0, 2, 3, 5, 7, 8, 11], phrd: [0, 1, 4, 5, 7, 8, 10], mix: [0, 2, 4, 5, 7, 9, 10], blues: [0, 3, 5, 6, 7, 10], weird: [0, 1, 4, 6, 7, 10],
  };
  function chord(sp, c) {
    let tones;
    if (Array.isArray(c)) tones = QUAL[c[1]].map(x => c[0] + x);
    else { const sc = sp.scale, n = sc.length, tn = d => sc[d % n] + 12 * Math.floor(d / n); tones = [tn(c), tn(c + 2), tn(c + 4)]; if (sp.sev) tones.push(tn(c + 6)); }
    return { r: ((tones[0] % 12) + 12) % 12, tones, pcs: new Set(tones.map(x => ((sp.key + x) % 12 + 12) % 12)) };
  }
  const inRange = (lo, hi, pcs) => { const r = []; for (let m = lo; m <= hi; m++) if (pcs.has(m % 12)) r.push(m); return r; };
  const nearest = (list, x) => { let b = list[0], d = 1e9; for (const m of list) { const e = Math.abs(m - x); if (e < d) { d = e; b = m; } } return b; };
  const C4 = [[], [0], [0, 2], [0, 3], [2], [0, 2, 3], [0, 1, 2], [0, 1, 2, 3]], C3 = [[], [0], [0, 2], [0, 1], [2], [0, 1, 2]];
  function motif(R, sub, dens) {
    const cells = sub === 3 ? C3 : C4, out = [];
    for (let b = 0; b < 8; b++) {
      let c;
      if (b === 0) c = cells[1 + (R() * 3 | 0)];
      else if (b === 7) c = R() < 0.6 ? cells[1] : cells[0];
      else c = cells[clamp(Math.round(dens * (cells.length - 1) + (R() - 0.5) * 3.2), 0, cells.length - 1)];
      for (const s of c) out.push(b * sub + s);
    }
    return out;
  }
  // мелодия: 8 тактов = A, A (секвенция на новых аккордах), B, A с каденцией; 4 такта = A, B-каденция
  function phrase(S, bar0, chords, sp, R, inst, lo, hi, dens, v) {
    const spb = S.spb, sub = S.sub, scale = inRange(lo, hi, sp.pcs);
    const chordAt = s => chords[clamp(Math.floor(s / spb), 0, chords.length - 1)];
    const ctAbs = ch => inRange(lo, hi, ch.pcs);
    const mA = motif(R, sub, dens), mB = motif(R, sub, Math.min(1, dens + 0.15));
    const plan = chords.length >= 8 ? [[mA, 0, ''], [mA, 2, 'seq'], [mB, 4, ''], [mA, 6, 'cad']] : [[mA, 0, ''], [mB, 2, 'cad']];
    let p = nearest(scale, (lo + hi) >> 1), dir = R() < 0.5 ? 1 : -1, memo = null;
    for (const [mt, bar, kind] of plan) {
      let notes = [];
      if (kind === 'seq' && memo) {
        let sh = chordAt(bar * spb).r - chordAt(memo.bar * spb).r; sh = ((sh + 6) % 12 + 12) % 12 - 6;
        notes = memo.notes.map(n => { const s = n.s, st = s % sub === 0 && (s / sub) % 2 === 0; return { s, m: nearest(st ? ctAbs(chordAt(bar * spb + s)) : scale, n.m + sh) }; });
      } else {
        for (const s of mt) {
          const abs = bar * spb + s, strong = s % sub === 0 && (s / sub) % 2 === 0;
          let m;
          if (strong) m = nearest(ctAbs(chordAt(abs)), p + Math.round((R() - 0.5) * 8));
          else { let i = scale.indexOf(nearest(scale, p)); if (R() < 0.3) dir = -dir; i = clamp(i + dir * (R() < 0.72 ? 1 : 2), 0, scale.length - 1); if (i === 0 || i === scale.length - 1) dir = -dir; m = scale[i]; }
          p = m; notes.push({ s, m });
        }
        if (kind === 'cad') {
          notes = notes.filter(n => n.s < spb + sub);
          const last = chords[Math.min(chords.length - 1, bar + 1)], tonic = inRange(lo, hi, new Set([sp.key % 12]));
          notes.push({ s: spb + sub, m: nearest(R() < 0.7 ? tonic : ctAbs(last), p), hold: spb - sub });
        }
      }
      if (!memo && mt === mA) memo = { notes, bar };
      for (let i = 0; i < notes.length; i++) {
        const n = notes[i], nx = notes[i + 1], len = n.hold || Math.min(8, (nx ? nx.s : 2 * spb) - n.s);
        S.note((bar0 + bar) * spb + n.s, inst, n.m, len, v);
      }
    }
  }
  const pcOf = (sp, ch) => (sp.key + ch.r) % 12;
  const lowNote = (pc, lo) => { let m = lo; while (((m % 12) + 12) % 12 !== pc) m++; return m; };
  function bassBar(S, bar, ch, nx, sp, pat, inst, v) {
    const spb = S.spb, b0 = bar * spb, br = lowNote(pcOf(sp, ch), sp.bassLo || 33);
    const third = ch.tones.length > 1 ? br + ((ch.tones[1] - ch.tones[0]) % 12) : br + 4, fifth = br + 7;
    const N = (s, m, l, vv = 1) => S.note(b0 + s, inst, m, l, v * vv);
    switch (pat) {
      case 'root8': for (let i = 0; i < spb; i += 2) N(i, br, 1.6, i % 4 ? 0.8 : 1); break;
      case 'oct8': for (let i = 0; i < spb; i += 2) N(i, i % 4 ? br + 12 : br, 1.5); break;
      case 'drive16': for (let i = 0; i < spb; i++) N(i, i === 14 ? fifth : br, 0.9, i % 4 ? 0.7 : 1); break;
      case 'sync': [[0, br, 2], [3, br, 1], [6, br + 12, 1], [8, br, 2], [10, fifth, 2], [14, br, 1]].forEach(([s, m, l]) => N(s, m, l)); break;
      case 'walk': { const nr = nx ? lowNote(pcOf(sp, nx), sp.bassLo || 33) : br; [br, R1(third, fifth), fifth + (R1(0, 1) ? 2 : 0), nr + (nr > br ? -1 : 1)].forEach((m, i) => N(i * 4, m, 3.6, i ? 0.85 : 1)); break; }
      case 'half': N(0, br, 7.5); N(8, fifth, 7.5, 0.85); break;
      case 'off': for (let i = 2; i < spb; i += 4) N(i, br, 1.5); break;
      case 'pulse': for (let i = 0; i < spb; i += 2) N(i, br, 0.8, i % 8 ? 0.7 : 1); break;
      case 'disco': for (let i = 0; i < spb; i += 2) N(i, i % 4 ? br + 12 : br, 1, i % 4 ? 0.85 : 1); break;
      case 'waltz': N(0, br, 5); N(6, fifth, 5, 0.8); break;
      case 'six8': N(0, br, 2); N(3, br + 12, 1, 0.7); N(5, fifth, 1, 0.7); N(6, br, 2); N(9, fifth, 2, 0.8); break;
      case 'long': N(0, br, spb); break;
    }
    function R1(a, b) { return ((bar * 7 + 3) % 5) < 2 ? a : b; }
  }
  function padBar(S, bar, ch, sp, inst, lo, v, len) {
    const pcs = [...ch.pcs], ns = pcs.map(pc => lowNote(pc, lo));
    for (const m of ns) S.note(bar * S.spb, inst, m, len || S.spb, v);
  }
  function arpBar(S, bar, ch, sp, inst, lo, pat, v) {
    const ns = inRange(lo, lo + 19, ch.pcs), b0 = bar * S.spb, n = ns.length;
    const seq = pat === 'updown' ? ns.concat(ns.slice(1, -1).reverse()) : pat === 'down' ? ns.slice().reverse() : ns;
    const stepN = pat === 'eighth' ? 2 : 1;
    for (let i = 0, k = 0; i < S.spb; i += stepN, k++) S.note(b0 + i, inst, seq[k % seq.length], stepN * 1.6, v * (i % 4 ? 0.75 : 1));
  }
  function compBar(S, bar, ch, sp, inst, lo, rhythm, v) {
    const ns = [...ch.pcs].map(pc => lowNote(pc, lo));
    for (let i = 0; i < S.spb; i++) if (rhythm[i % rhythm.length] === 'x') { let l = 1; while (rhythm[(i + l) % rhythm.length] === '-') l++; for (const m of ns) S.note(bar * S.spb + i, inst, m, l, v); }
  }

  // ---------- тема уровня ----------
  function theme(sp) {
    sp.pcs = new Set(sp.scale.map(x => (sp.key + x) % 12));
    return seed => {
      const R = rng(seed), sub = sp.sub || 4, nA = sp.A.length, nB = sp.B.length;
      const S = new Song(sp.bpm, sub, nA + nB); S.swing = sp.swing || 0; S.echo = sp.echo || 60 / sp.bpm * 0.75;
      const ch = sp.A.concat(sp.B).map(c => chord(sp, c));
      const L = sp.lead;
      phrase(S, 0, ch.slice(0, nA), sp, R, L.i, L.lo, L.hi, L.dens, L.v);
      phrase(S, nA, ch.slice(nA), sp, R, L.iB || L.i, L.lo + (L.upB || 0), L.hi + (L.upB || 0), Math.min(1, L.dens + 0.1), L.v);
      for (let b = 0; b < nA + nB; b++) {
        const inB = b >= nA, c = ch[b], nx = ch[(b + 1) % ch.length];
        const want = x => x && (x.on == null || x.on === 'AB' || (x.on === 'A' && !inB) || (x.on === 'B' && inB));
        if (sp.bass) bassBar(S, b, c, nx, sp, inB && sp.bass.patB || sp.bass.pat, sp.bass.i, sp.bass.v);
        if (want(sp.pad)) padBar(S, b, c, sp, sp.pad.i, sp.pad.lo, sp.pad.v);
        if (want(sp.arp)) arpBar(S, b, c, sp, sp.arp.i, sp.arp.lo, sp.arp.pat, sp.arp.v);
        if (want(sp.comp)) compBar(S, b, c, sp, sp.comp.i, sp.comp.lo, sp.comp.r, sp.comp.v);
        if (want(sp.gtr)) { const r = lowNote(pcOf(sp, c), 40), pt = sp.gtr.r; for (let i = 0; i < S.spb; i++) { const k = pt[i % pt.length]; if (k === 'm' || k === 'o') { let l = 1; while (pt[(i + l) % pt.length] === '-') l++; S.gtr(b * S.spb + i, r, l, { mute: k === 'm', v: sp.gtr.v || 0.6 }); } } }
      }
      S.drums(0, nA, sp.dA); S.drums(nA, nB, sp.dB || sp.dA);
      if (sp.fill !== false) { S.fill(nA - 1, 1, 0.8); S.fill(nA + nB - 1, sp.sub === 3 ? 1 : 2, 0.9); }
      S.hit(0, 'c', 0.8); S.hit(nA * S.spb, 'c', 0.9);
      if (sp.extra) sp.extra(S, ch, R);
      return S;
    };
  }

  // ---------- металл для боссов ----------
  const VOC = {
    thrash: ['mmmm', 'm.m.', 'mm.m', 'o.m.', 'mmo.', 'm.mm', 'o---', 'nnnn'],
    gallop: ['m.mm', 'm.mm', 'o.mm', 'mmm.', 'o---', 'm.mm'],
    punk: ['o.o.', 'o.o.', 'oooo', 'o-o.', 'o.oo'],
    chug: ['m..m', '.m.m', 'm.mm', 'o...', 'm...', 'mm..', 'o.m.'],
    groove: ['m..m', '..m.', 'o..m', '.mm.', 'o---', 'm.o.', 'm-.m'],
    trem: ['nnnn', 'nnnn', 'nnnn', 'nnnn', 'o---'],
    doom: ['o---', 'o---', 'o--.', 'm.m.', 'n---', '----'],
    shuffle: ['m.m', 'o.m', 'm.o', 'o--', 'mmm', 'm.m'],
    neo: ['mmmm', 'nnnn', 'm.m.', 'nnnn', 'o.m.'],
  };
  const CHORUS = { 4: ['o-------o---o-o-', 'o-o-o-o-o-o-o-o-', 'o--o--o-o--o--o-', 'o-------o-------', 'o-mmo-mmo-mmo-mm'], 3: ['o-----o-----', 'o--o--o--o--', 'o-mo-mo-mo-m'] };
  const BREAK = { 4: ['m..m..m.m..m.o--', 'm.m...m.m...o---', 'm..m..m...m.m.m.', 'o-----m.m.m.o---'], 3: ['m..m..m.mo--', 'm.mm..m.mo--'] };
  const TURN = [[0, 0, 0, 5], [0, 0, 3, 5], [0, 0, 0, -2], [0, -4, 0, -2], [0, 0, 1, 0], [0, 3, 0, 6], [0, 0, -4, -5]];
  const PROG = { min: [[0, 8, 3, 10], [0, 10, 8, 7], [0, 5, 8, 7], [0, 8, 10, 0], [0, 3, 10, 8]], harm: [[0, 8, 5, 7], [0, 5, 7, 0], [0, 8, 1, 7], [0, 3, 8, 7]], phr: [[0, 1, 0, 3], [0, 1, 8, 1], [0, 3, 1, 0]], blues: [[0, 5, 0, 7], [0, 3, 5, 0], [0, 10, 5, 7]] };
  const DRUM = {
    4: {
      thrash: { k: 'x...x...x...x...', s: '..x...x...x...x.', h: 'x.x.x.x.x.x.x.x.' },
      double: { k: 'xxxxxxxxxxxxxxxx', s: '....X.......X...', r: 'x.x.x.x.x.x.x.x.' },
      blast: { k: 'x.x.x.x.x.x.x.x.', s: '.x.x.x.x.x.x.x.x', r: 'x...x...x...x...' },
      dbeat: { k: 'x.xx..x.x.xx..x.', s: '....X.......X...', h: 'x.x.x.x.x.x.x.x.' },
      groove: { k: 'x..x..x...x.x...', s: '....X.......X...', h: 'x.x.x.x.x.x.x.x.' },
      half: { k: 'x.....x.x.......', s: '........X.......', h: 'x...x...x...x...' },
      four: { k: 'x...x...x...x...', s: '....X.......X...', o: '..x...x...x...x.' },
      gallopK: { k: 'x.xxx.xxx.xxx.xx', s: '....X.......X...', r: 'x.x.x.x.x.x.x.x.' },
      djent: { s: '........X.......', h: 'x...x...x...x...' },
    },
    3: {
      shuffle: { k: 'x.....x..x..', s: '...X.....X..', h: 'x.xx.xx.xx.x' },
      double: { k: 'xxxxxxxxxxxx', s: '...X.....X..', r: 'x..x..x..x..' },
      half: { k: 'x.....x.....', s: '......X.....', h: 'x..x..x..x..' },
      thrash: { k: 'x..x..x..x..', s: '.x..x..x..x.', h: 'x.xx.xx.xx.x' },
    },
  };
  function mkRiff(R, sp, sub) {
    const spb = sub * 4, voc = VOC[sp.riff] || VOC.thrash, acc = sp.acc || [3, 5, 7, 10, 12], pick = a => a[R() * a.length | 0];
    const sc = SC[sp.scale] || SC.min, notes = []; for (let o = 0; o < 2; o++) for (const x of sc) notes.push(12 + x + o * 12);
    let ni = R() * 5 | 0;
    const toks = [];
    if (sp.riff === 'djent') {
      const g = pick(['m.m', 'm..', 'mm.m.', 'm.mm.', 'm..m.m.', 'm.m.m..']);
      for (let i = 0; i < spb * 2; i++) { const c = g[i % g.length]; toks.push(c === 'm' && i % g.length === 0 && R() < 0.3 ? { k: 'o', off: pick([1, 6, 3]) } : { k: c, off: 0 }); }
      for (let i = spb * 2 - 4; i < spb * 2; i++) toks[i] = i === spb * 2 - 4 ? { k: 'o', off: pick([1, 6]) } : { k: '-', off: 0 };
      return toks;
    }
    const cellsFor = (bar, from) => {
      for (let b = from; b < 4; b++) {
        let c = b === 0 && bar === 0 ? (voc[0].replace(/n/g, 'm')) : pick(voc);
        if (b === 0 && bar === 0 && sp.riff === 'trem') c = 'nnnn';
        if (b === 0 && bar === 0 && (sp.riff === 'doom' || sp.riff === 'punk')) c = sp.riff === 'doom' ? 'o---' : 'o.o.';
        const bn = notes[ni = clamp(ni + (R() < 0.5 ? 1 : -1) * (1 + (R() * 2 | 0)), 0, notes.length - 1)];
        const ao = b === 0 && bar === 0 ? 0 : pick(acc);
        for (let i = 0; i < sub; i++) {
          const k = c[i % c.length];
          if (k === 'n') toks[bar * spb + b * sub + i] = { k, off: sp.riff === 'trem' ? bn : notes[ni = clamp(ni + (R() < 0.6 ? 1 : -1), 0, notes.length - 1)] };
          else toks[bar * spb + b * sub + i] = { k, off: k === 'o' ? ao : 0 };
        }
      }
    };
    cellsFor(0, 0);
    for (let i = 0; i < spb; i++) toks[spb + i] = Object.assign({}, toks[i]);
    cellsFor(1, 2);
    return toks;
  }
  function playRiff(S, bar0, toks, root, sp, vol = 1, kickFollow) {
    const n = toks.length;
    for (let i = 0; i < n; i++) {
      const tk = toks[i]; if (tk.k === '.' || tk.k === '-') continue;
      let l = 1; while (i + l < n && toks[i + l].k === '-') l++;
      const st = bar0 * S.spb + i;
      if (tk.k === 'n') S.gtr(st, root + tk.off, l, { iv: [0, 12], v: 0.75 * vol, cut: 4000 });
      else S.gtr(st, root + tk.off, l, { mute: tk.k === 'm', v: vol, slide: sp.riff === 'doom' && l >= 6 && i % 3 === 0 ? -1 : 0 });
      S.note(st, 'bassM', root - 12 + (tk.k === 'o' ? tk.off : 0), tk.k === 'm' ? Math.min(l, 1) : l, 0.2);
      if (kickFollow && tk.k !== 'n') S.hit(st, 'k', 0.9);
    }
  }
  function solo(S, bar0, nb, sp, root, R, v) {
    const sub = S.sub, sc = SC[sp.scale] || SC.min, ns = [];
    for (let m = 52; m <= 79; m++) if (sc.includes(((m - root) % 12 + 12) % 12)) ns.push(m);
    let i = (ns.length / 2) | 0;
    for (let b = 0; b < nb; b++) for (let bt = 0; bt < 4; bt++) {
      const st = (bar0 + b) * S.spb + bt * sub, last = b === nb - 1 && bt >= 2;
      if (last) { if (bt === 2) S.note(st, 'lead', nearest(ns.filter(m => (m - root) % 12 === 0), ns[i]), sub * 2, v); continue; }
      const f = R();
      if (f < 0.32) { const d = R() < 0.5 ? 1 : -1; for (let k = 0; k < sub; k++) { i = clamp(i + d, 0, ns.length - 1); S.note(st + k, 'lead', ns[i], 1, v * 0.9); } }
      else if (f < 0.5) { const b0 = i; for (let k = 0; k < sub; k++) S.note(st + k, 'lead', ns[clamp(b0 + [0, 2, 4, 2, 0, 2][k], 0, ns.length - 1)], 1, v * 0.9); i = clamp(b0 + 2, 0, ns.length - 1); }
      else if (f < 0.65) { const a = ns[i], c = ns[clamp(i + 1, 0, ns.length - 1)]; for (let k = 0; k < sub; k++) S.note(st + k, 'lead', k % 2 ? c : a, 1, v * 0.85); }
      else if (f < 0.85) { i = clamp(i + (R() < 0.5 ? 2 : -2), 0, ns.length - 1); S.note(st, 'lead', ns[i], sub, v); }
      else { i = clamp(i + (R() < 0.5 ? 1 : -1), 0, ns.length - 1); S.note(st, 'lead', ns[i], sub / 2, v); S.note(st + sub / 2, 'lead', ns[clamp(i + 1, 0, ns.length - 1)], sub / 2, v); }
    }
  }
  function metal(sp) {
    return seed => {
      const R = rng(seed), sub = sp.sub || 4, spb = sub * 4, pick = a => a[R() * a.length | 0];
      const bpm = sp.bpm + Math.round((R() - 0.5) * 6);
      const root = sp.root + pick([0, 0, 1, -1, 2, -2]);
      const scName = sp.scale || 'min', scale = SC[scName];
      const ctx = { key: root, scale, pcs: new Set(scale.map(x => (root + x) % 12)) };
      const S = new Song(bpm, sub, 30); S.loopFrom = 2 * spb; S.echo = 60 / bpm * 0.75;
      const D = DRUM[sub], dA = D[sp.drA] || D.thrash, dB = D[sp.drB] || D.double, dH = D.half;
      const riffA = mkRiff(R, sp, sub), riffD = R() < 0.45 ? riffA : mkRiff(R, sp, sub);
      const turn = pick(sp.turn || TURN), kf = sp.riff === 'djent' || sp.kick === 'follow';
      const pw = off => { const r = (root + off) % 12, third = ctx.pcs.has((r + 3) % 12) ? 3 : 4; return { r: off, tones: [off, off + third, off + 7], pcs: new Set([r, (r + third) % 12, (r + 7) % 12]) }; };
      // интро (2 такта)
      S.gtr(0, root, spb * 1.5, { v: 1 }); S.note(0, 'bassM', root - 12, spb * 1.5, 0.22); S.hit(0, 'c', 1.1); S.hit(0, 'k', 1);
      if (sp.choir) padBar(S, 0, pw(0), ctx, 'choir', root + 24, 0.05, spb * 2);
      for (let i = spb; i < spb * 2; i++) S.hit(i, 's', 0.25 + 0.75 * (i - spb) / spb);
      S.fill(0, 2, 0.8);
      playRiff(S, 1, riffA.slice(spb * 2 - Math.floor(spb / 2)).map((t, i) => i ? t : { k: 'o', off: 0 }).concat([]), root, sp, 0.9);
      // A: рифф x4 с разворотом
      for (let r = 0; r < 4; r++) { playRiff(S, 2 + r * 2, riffA, root + turn[r], sp, 1, kf); }
      S.drums(2, 8, kf ? D.djent || dH : dA); S.fill(9, 1);
      // B: припев на открытых аккордах + соло-мелодия (+ хор)
      const prog = sp.prog || pick(PROG[scName] || PROG.min), cr = pick(CHORUS[sub]);
      const chB = [];
      for (let b = 0; b < 8; b++) {
        const off = prog[(b >> 1) % 4], m = root + off; chB.push(pw(off));
        for (let i = 0; i < spb; i++) { const k = cr[i]; if (k === 'o' || k === 'm') { let l = 1; while (cr[i + l] === '-') l++; S.gtr((10 + b) * spb + i, m, l, { mute: k === 'm' }); } }
        for (let i = 0; i < spb; i += 2) S.note((10 + b) * spb + i, 'bassM', m - 12, 1.8, 0.2);
        if (sp.choir && b % 2 === 0) padBar(S, 10 + b, chB[b], ctx, 'choir', root + 24, 0.045, spb * 2);
        if (sp.keys && b % 2 === 0) arpBar(S, 10 + b, chB[b], ctx, sp.keys, root + 36, 'updown', 0.045), arpBar(S, 11 + b, chB[b], ctx, sp.keys, root + 36, 'up', 0.045);
      }
      phrase(S, 10, chB, ctx, R, 'lead', root + 12, root + 33, 0.45, 0.11);
      S.drums(10, 8, dB); S.hit(10 * spb, 'c', 1.1); S.hit(14 * spb, 'c', 1); S.fill(17, 2);
      // C: брейкдаун (половинный размер)
      const br = pick(BREAK[sub]);
      for (let b = 0; b < 4; b++) {
        for (let i = 0; i < spb; i++) { const k = br[i]; if (k === 'm' || k === 'o') { let l = 1; while (br[i + l] === '-') l++; const off = k === 'o' ? pick([1, 6, 0, 3]) : 0; S.gtr((18 + b) * spb + i, root + off, l, { mute: k === 'm' }); S.note((18 + b) * spb + i, 'bassM', root - 12 + off, Math.max(1, l), 0.22); S.hit((18 + b) * spb + i, 'k', 0.9); } }
        S.hit((18 + b) * spb, 'c', 1);
      }
      S.drums(18, 4, { s: dH.s, h: dH.h });
      for (let i = spb * 3 + spb / 2; i < spb * 4; i++) S.hit(18 * spb + i, 's', 0.4 + 0.6 * (i - spb * 3.5) / (spb / 2));
      // D: рифф + быстрое соло
      for (let r = 0; r < 4; r++) playRiff(S, 22 + r * 2, riffD, root + turn[r], sp, 1, kf);
      S.drums(22, 4, kf ? D.djent || dH : dA); S.drums(26, 4, dB); S.hit(22 * spb, 'c', 1.1); S.hit(26 * spb, 'c', 1.1); S.fill(29, 2);
      solo(S, 22, 8, sp, root, R, 0.1);
      if (sp.choir) for (let b = 26; b < 30; b += 2) padBar(S, b, pw(turn[(b - 22) >> 1]), ctx, 'choir', root + 24, 0.04, spb * 2);
      S.meta = { root, turn, chB, ctx };
      if (sp.extra) sp.extra(S, R, root);
      return S;
    };
  }

  // ---------- в духе Serious Sam 3: металл + струнное остинато, хор, томы, большой барабан (минор, без востока) ----------
  const OST = { 4: [[0, 0, 3, 0, 0, 0, 3, 0, 7, 0, 8, 7, 3, 0, 2, 0], [0, 2, 3, 2, 0, 2, 3, 5, 7, 5, 3, 2, 0, 2, 0, -2], [0, 0, 7, 0, 8, 0, 7, 0, 3, 0, 5, 0, 3, 0, -2, 0], [0, 3, 7, 3, 0, 3, 7, 12, 10, 7, 3, 0, 8, 7, 3, 2]],
    3: [[0, 3, 7, 3, 0, 3], [0, 0, 3, 0, 7, 8], [0, 2, 3, 5, 3, 2]] };
  const DARB = { 4: [{ T: 'x.....x.x.......', t: '..........x...x.' }, { T: 'x.....xx........', t: '...........x..x.' }, { T: 'x..x..x.........', t: '..........x.x...' }], 3: [{ T: 'x.....x.....', t: '.........x.x' }, { T: 'x..x..x.....', t: '..........x.' }] };
  function sam(sp) {
    const gen = metal(Object.assign({ choir: true, scale: 'min' }, sp));
    return seed => {
      const S = gen(seed), M = S.meta, R = rng(seed ^ 0x5a5a5a), pick = a => a[R() * a.length | 0], spb = S.spb, sub = S.sub;
      const ost = pick(OST[sub]), dr = pick(DARB[sub]), dv = (sp.darbV || 0.5) * 0.6;
      const strBars = b0 => { for (let b = 0; b < 8; b++) { const r = M.root + 24 + M.turn[(b >> 1) % 4]; for (let i = 0; i < spb; i++) S.note((b0 + b) * spb + i, 'str', r + ost[i % ost.length], 0.9, 0.028 * (i % sub ? 0.75 : 1)); } };
      strBars(2); strBars(22);
      for (let b = 10; b < 18; b += 2) padBar(S, b, M.chB[b - 10], M.ctx, 'strL', M.root + 12, 0.03, spb * 2);
      S.drums(0, 2, dr, dv * 1.2); S.drums(18, 4, dr, dv * 1.1);
      for (const b of [10, 12, 14, 16, 18, 19, 20, 21, 26, 28]) S.hit(b * spb, 'G', 1);
      return S;
    };
  }

  // ---------- треки ----------
  const SONGS = {};
  const off8 = '.x.x.x.x', E = { k: '.', s: '.' };
  // Все уровни — в духе саундтрека Serious Sam 3 (эпичный металл, без восточного лада). Стелс и лаборатория — спокойные.
  const sirens = S => { for (let b = 6; b < 30; b += 8) for (let i = 0; i < 4; i++) S.note(b * S.spb + i * 4, 'siren', i % 2 ? 76 : 81, 4, 0.025); };
  const calmDr = { T: 'x.........x.....', m: '....x.......x...' };
  SONGS.L1 = sam({ bpm: 150, root: 40, riff: 'thrash', drA: 'thrash', drB: 'double', extra: S => { for (let i = 2 * S.spb + 12; i < S.len; i += 2 * S.spb) S.hit(i, 'a', 0.8); } }); // Севмолот + наковальня
  SONGS.L2 = sam({ bpm: 132, root: 45, riff: 'groove', drA: 'groove', drB: 'double' });                   // Дорога домой
  SONGS.L3 = sam({ bpm: 120, root: 37, riff: 'chug', drA: 'four', drB: 'half', kick: 'follow', acc: [3, 6, 5, 7] }); // Глюки
  SONGS.L4 = sam({ bpm: 140, root: 41, riff: 'chug', drA: 'four', drB: 'double', acc: [3, 5, 7, 8] });     // Дикие кошки
  SONGS.L5 = sam({ bpm: 176, root: 40, riff: 'gallop', drA: 'gallopK', drB: 'double', acc: [3, 5, 7, 8], extra: sirens }); // Погоня
  SONGS.L6 = sam({ bpm: 120, sub: 3, root: 38, riff: 'shuffle', drA: 'shuffle', drB: 'double', acc: [3, 5, 7, 10], keys: 'harp' }); // Грибной дождь 12/8
  SONGS.L7 = theme({ bpm: 92, key: 50, scale: SC.min, A: [[0, 'min'], [8, 'maj'], [0, 'min'], [10, 'maj'], [0, 'min'], [8, 'maj'], [5, 'min'], [7, 'min']], B: [[5, 'min'], [8, 'maj'], [10, 'maj'], [0, 'min'], [3, 'maj'], [8, 'maj'], [10, 'maj'], [0, 'min']],
    lead: { i: 'str', lo: 57, hi: 74, dens: 0.35, v: 0.06 }, bass: { i: 'bassR', pat: 'long', v: 0.2 }, pad: { i: 'strL', lo: 50, v: 0.02 }, arp: { i: 'str', lo: 62, pat: 'eighth', v: 0.016, on: 'B' },
    dA: calmDr, dB: { T: 'x.........x.....', m: '....x.......x.x.', h: '..x...x...x...x.' }, fill: false, extra: S => { for (let b = 0; b < 16; b += 4) S.hit(b * 16, 'G', 0.7); } }); // Заводоуправление (стелс)
  SONGS.L7alarm = sam({ bpm: 168, root: 40, riff: 'trem', drA: 'double', drB: 'blast', extra: sirens });   // Тревога
  SONGS.L7fight = sam({ bpm: 150, root: 43, riff: 'thrash', drA: 'dbeat', drB: 'double' });                // Драка с охраной
  SONGS.L8 = sam({ bpm: 138, root: 40, riff: 'neo', drA: 'thrash', drB: 'double', keys: 'harpsi', extra: S => { for (let i = 2 * S.spb; i < S.len; i += 4 * S.spb) S.hit(i, 'a', 0.7); } }); // Закулисье
  SONGS.L9 = sam({ bpm: 160, root: 42, riff: 'trem', drA: 'double', drB: 'blast' });                       // Тоннель
  SONGS.L9lab = theme({ bpm: 100, key: 48, scale: SC.min, A: [[0, 'min'], [8, 'maj'], [5, 'min'], [0, 'min'], [0, 'min'], [8, 'maj'], [3, 'maj'], [7, 'min']], B: [[10, 'maj'], [8, 'maj'], [5, 'min'], [0, 'min'], [10, 'maj'], [3, 'maj'], [8, 'maj'], [0, 'min']],
    lead: { i: 'bell', lo: 60, hi: 79, dens: 0.3, v: 0.065 }, bass: { i: 'bassR', pat: 'half', v: 0.2 }, pad: { i: 'dark', lo: 48, v: 0.028 }, arp: { i: 'str', lo: 60, pat: 'updown', v: 0.016 },
    dA: calmDr, dB: { T: 'x.....x...x.....', m: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' }, fill: false, extra: S => { for (let b = 0; b < 16; b += 2) S.hit(b * 16, 'G', 0.6); } }); // Лаборатория

  // боссы: у каждого свой стиль
  const clank = S => { for (let i = 2 * S.spb + 12; i < S.len; i += S.spb) S.hit(i, 'a', 1); };
  const glitch = (S, R, root) => { for (let b = 3; b < 30; b += 4) S.at(b * S.spb + S.spb - 4, (t, sd) => { for (let i = 0; i < 8; i++) gtr(t + i * sd / 2, root + i, sd / 2, { mute: true, v: 0.9 }); }); };
  const keysOrgan = (S, R, root) => { for (let b = 2; b < 10; b++) S.note(b * S.spb, 'organ', root + 24 + (b % 2 ? 5 : 0), S.spb, 0.03), S.note(b * S.spb, 'organ', root + 31 + (b % 2 ? 5 : 0), S.spb, 0.025); };
  const ambient = (S, R, root) => { const ns = [0, 3, 7, 10, 14, 15].map(x => root + 36 + x); for (let b = 2; b < 10; b++) for (let i = 0; i < S.spb; i += 3) S.note(b * S.spb + i, 'bell', ns[(R() * ns.length) | 0], 3, 0.03); };
  // заставки: громкость как у остальной музыки (старый чиптюн main.js был почти не слышен)
  SONGS.cutscene = theme({ bpm: 76, key: 45, scale: SC.min, A: [[0, 'min'], [8, 'maj'], [3, 'maj'], [10, 'maj'], [0, 'min'], [8, 'maj'], [5, 'min'], [7, 'maj']], B: [[8, 'maj'], [10, 'maj'], [3, 'maj'], [7, 'maj'], [8, 'maj'], [5, 'min'], [10, 'maj'], [7, 'maj']],
    lead: { i: 'strM', lo: 60, hi: 77, dens: 0.3, v: 0.06 }, bass: { i: 'bassR', pat: 'half', v: 0.22 }, pad: { i: 'choir', lo: 57, v: 0.022 }, arp: { i: 'str', lo: 57, pat: 'eighth', v: 0.014, on: 'B' },
    dA: { G: 'x...............' }, dB: { G: 'x.......x.......', T: '..........x...x.' }, fill: false });
  SONGS.intro = theme({ bpm: 70, key: 50, scale: SC.min, A: [[0, 'min'], [0, 'min'], [8, 'maj'], [8, 'maj'], [5, 'min'], [5, 'min'], [7, 'maj'], [7, 'maj']], B: [[3, 'maj'], [10, 'maj'], [8, 'maj'], [7, 'maj'], [3, 'maj'], [10, 'maj'], [5, 'min'], [7, 'maj']],
    lead: { i: 'strM', lo: 62, hi: 79, dens: 0.25, v: 0.06 }, bass: { i: 'bassR', pat: 'long', v: 0.22 }, pad: { i: 'dark', lo: 50, v: 0.026 }, arp: { i: 'str', lo: 62, pat: 'updown', v: 0.012, on: 'B' },
    dA: { G: 'x...............' }, dB: { G: 'x.......x.......', T: '............x.x.' }, fill: false });

  // боссы по нарастающей: чем круче босс, тем быстрее и жёстче; финал ур.10 — самый эпичный
  const epic = (S, R, root) => { const M = S.meta;      // хор и струнные на всю песню, большой барабан каждый такт
    for (let b = 2; b < 30; b += 2) { const c = b >= 10 && b < 18 ? M.chB[b - 10] : { pcs: new Set([root % 12, (root + 4) % 12, (root + 7) % 12]) }; padBar(S, b, c, M.ctx, 'choir', root + 24, 0.045, S.spb * 2); padBar(S, b, c, M.ctx, 'strL', root + 12, 0.025, S.spb * 2); }
    for (let b = 2; b < 30; b++) S.hit(b * S.spb, 'G', 1.1); };
  Object.assign(SONGS, {
    'boss:1': sam({ bpm: 124, root: 40, riff: 'groove', drA: 'groove', drB: 'four' }),                                    // Наташа
    'boss:2': sam({ bpm: 132, root: 45, riff: 'punk', drA: 'dbeat', drB: 'thrash', acc: [5, 7, 3, 10] }),                    // Кеша
    'boss:3': sam({ bpm: 138, root: 37, riff: 'chug', drA: 'four', drB: 'double', acc: [3, 6, 5, 7], kick: 'follow', extra: glitch }), // глюк-таракан
    'boss:4': sam({ bpm: 146, sub: 3, root: 43, riff: 'shuffle', drA: 'shuffle', drB: 'double', acc: [3, 5, 7, 10], extra: keysOrgan }), // байкер
    'boss:5': sam({ bpm: 154, root: 42, riff: 'gallop', drA: 'gallopK', drB: 'double', acc: [3, 5, 7, 8] }),               // гонка с Граблионком
    'boss:6': sam({ bpm: 162, root: 38, riff: 'trem', drA: 'double', drB: 'double', keys: 'harpsi' }),                       // Ванделорд
    'boss:7a': sam({ bpm: 168, root: 38, riff: 'chug', drA: 'thrash', drB: 'double', acc: [3, 6, 5], kick: 'follow', extra: clank }), // охрана
    'boss:7b': sam({ bpm: 174, root: 39, riff: 'trem', drA: 'double', drB: 'blast', acc: [3, 5, 7, 8] }),                    // начальник охраны
    'boss:8': sam({ bpm: 180, root: 35, riff: 'thrash', drA: 'thrash', drB: 'blast', extra: ambient }),                       // петух и паук
    'boss:9a': sam({ bpm: 188, root: 37, riff: 'trem', drA: 'blast', drB: 'double', darbV: 0.6 }),                          // Саня
    'boss:9b': sam({ bpm: 196, root: 38, riff: 'gallop', drA: 'gallopK', drB: 'blast', darbV: 0.6, extra: keysOrgan }),     // Семён
    'boss:10a': sam({ bpm: 204, root: 40, riff: 'gallop', drA: 'gallopK', drB: 'blast', darbV: 0.7, extra: epic }),        // гигант-Семён: крыши
    'boss:10b': sam({ bpm: 212, root: 45, riff: 'neo', drA: 'double', drB: 'blast', keys: 'harpsi', darbV: 0.7, extra: epic }), // небо
    'boss:10c': sam({ bpm: 220, root: 38, riff: 'trem', drA: 'blast', drB: 'gallopK', keys: 'harpsi', darbV: 0.8, extra: epic }), // море — финал, самый эпичный
  });

  // ---------- подмена имён: общий вызов -> трек текущего уровня ----------
  const THEME = { 1: { level: 'L1' }, 2: { city: 'L2' }, 3: { epic: 'L3' }, 4: { epic: 'L4' }, 5: { chase: 'L5' }, 6: { city: 'L6' },
    7: { stealth: 'L7', alarm: 'L7alarm', fight: 'L7fight' }, 8: { alarm: 'L8' }, 9: { chase: 'L9', alarm: 'L9lab' } };
  function resolve(name) {
    if (!name || SONGS[name]) return name;
    let lv = null; try { lv = App.level; } catch (e) {}
    const id = lv && lv.id; if (!id) return name;
    if (id === 5 && name === 'chase' && lv.raceStarted) return 'boss:5';
    if (id === 9 && (name === 'alarm' || name === 'boss' || name === 'epicBoss')) { if (lv.partName === 'semen') return 'boss:9b'; if (lv.partName === 'sanya') return 'boss:9a'; }
    if (name === 'boss' || name === 'epicBoss' || (id === 10 && name === 'alarm')) {     // ф1 ур.10 идёт на движке ур.9 — тот зовёт 'alarm', а такого трека у ур.10 нет (была тишина)
      if (id === 10) return 'boss:10' + ({ jet: 'b', sea: 'c' }[lv.partName] || 'a');
      if (id === 7) return 'boss:7a';
      if (id === 9) return 'boss:9a';
      return SONGS['boss:' + id] ? 'boss:' + id : name;
    }
    const t = THEME[id]; return (t && t[name]) || name;
  }

  const basePlay = Music.play, baseUpdate = Music.update, baseStop = Music.stop;
  Music.att = {};
  Music.play = function (name) {
    const r = resolve(name), gen = SONGS[r];
    if (!gen) { this.v2 = null; return basePlay.call(this, r); }
    const now = performance.now();
    if (this.name === r && this.v2) {
      const again = r.startsWith('boss:') && now - this.v2.req > 2500;      // повторный заход в бой (рестарт) — новый рифф
      this.v2.req = now; if (!again) return;
    }
    if (!Sound.ac) { this.pending = name; this.name = null; return; }
    studio();
    const n = (this.att[r] = (this.att[r] || 0) + 1);
    const song = gen(r.startsWith('boss:') ? hash(r) + n * 7919 + (Date.now() & 0xffff) : hash(r));
    this.name = r; this.cur = null;
    this.v2 = { song, step: 0, next: Sound.ac.currentTime + 0.08, req: now, name: r };
    FX.dl.delayTime.setValueAtTime(clamp(song.echo || 0.3, 0.05, 1.9), Sound.ac.currentTime);
  };
  Music.stop = function () { this.v2 = null; baseStop.call(this); };
  Music.update = function () {
    let sc = null; try { sc = G.Scene; } catch (e) {}
    if (sc && sc.active && !this.v2 && !this.cur && Sound.ac) {
      const now = performance.now(); this.quietT = this.quietT || now;
      if (now - this.quietT > 1500) { this.quietT = 0; this.play('cutscene'); }
    } else this.quietT = 0;
    if (!this.v2) return baseUpdate.call(this);
    if (!Sound.ac || !FX) return;
    const v = this.v2, S = v.song, sd = 60 / S.bpm / S.sub, now = Sound.ac.currentTime;
    if (v.next < now - 0.3) v.next = now + 0.05;                          // вкладка спала — не играть пачкой
    while (v.next < now + 0.15) {
      const i = v.step, t = v.next + (S.swing && i % 2 ? S.swing * sd : 0);
      const evs = S.ev[i]; for (let k = 0; k < evs.length; k++) evs[k](t, sd);
      v.step = i + 1 >= S.len ? S.loopFrom : i + 1; v.next += sd;
    }
  };
  Music.v2songs = SONGS; Music.resolve = resolve;

  // ---------- тест-плеер: ?jukebox ----------
  if (/[?&]jukebox\b/.test(location.search)) window.addEventListener('load', () => {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:8px;top:8px;z-index:99;background:rgba(0,0,0,.85);color:#fff;font:13px monospace;padding:8px;border-radius:6px;max-width:360px';
    const NAMES = { cutscene: 'Заставки', intro: 'Вступление ур.1', L1: '1 Севмолот', L2: '2 Дорога домой', L3: '3 Глюки', L4: '4 Дикие кошки', L5: '5 Погоня', L6: '6 Грибной дождь', L7: '7 Заводоуправление', L7alarm: '7 Тревога', L7fight: '7 Драка с охраной', L8: '8 Закулисье', L9: '9 Тоннель', L9lab: '9 Лаборатория',
      'boss:1': 'Босс 1 Наташа', 'boss:2': 'Босс 2 Кеша', 'boss:3': 'Босс 3 Таракан', 'boss:4': 'Босс 4 Байкер', 'boss:5': 'Босс 5 Граблионок', 'boss:6': 'Босс 6 Ванделорд', 'boss:7a': 'Босс 7 Охрана', 'boss:7b': 'Босс 7 Начальник',
      'boss:8': 'Босс 8 Петух+Паук', 'boss:9a': 'Босс 9 Саня', 'boss:9b': 'Босс 9 Семён', 'boss:10a': 'Финал: крыши', 'boss:10b': 'Финал: небо', 'boss:10c': 'Финал: море' };
    box.innerHTML = '<b>Музыка игры</b> (боссы: повторный клик — новый рифф)<br>';
    for (const k in SONGS) { const b = document.createElement('button'); b.textContent = NAMES[k] || k; b.style.cssText = 'display:block;margin:2px 0;width:100%;text-align:left'; b.onclick = () => { Sound.unlock(); if (Music.v2) Music.v2.req = 0; Music.play(k); }; box.appendChild(b); }
    const st = document.createElement('button'); st.textContent = 'СТОП'; st.onclick = () => Music.stop(); box.appendChild(st);
    document.body.appendChild(box);
  });
})();
