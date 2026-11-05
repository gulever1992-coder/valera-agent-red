// Уровень 10, фаза 3: Семён анфас из «Редактора Семёна» (Редактор Семёна.bat -> tools/p10/sem3/editor.html).
// Данные — js/sem3_data.js (L10.SEM3): кости, части-картинки (assets/l10/sem3/*.png), точки, анимации по ключам.
// Часть «жёсткая» (едет с одной костью) или «гибкая» (сетка с весами нескольких костей — гнётся без швов).
// Поверх анимации из редактора игра добавляет: взгляд на Валеру, IK рук (хлопок), лапы к станциям, физику шланга.
// API совпадает с L10.RigFront: setPose/update/draw/drawHoseOnly/P/box/fireGun, поля ovr, watch, aimL/aimR, hoseT, gunT, legs, shield, flashT, gunK, hoseW, v.mouth/eye.
(() => {
  const D2R = Math.PI / 180, clamp = (x, a, b) => x < a ? a : x > b ? b : x, lerp = (a, b, t) => a + (b - a) * t;
  const sm = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const wrap = d => ((d % 360) + 540) % 360 - 180;
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  const ap = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
  const inv = m => { const d = m[0] * m[3] - m[1] * m[2] || 1e-9; return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d, (m[2] * m[5] - m[3] * m[4]) / d, (m[1] * m[4] - m[0] * m[5]) / d]; };
  const tr = (x, y) => [1, 0, 0, 1, x, y], ID = [1, 0, 0, 1, 0, 0];
  const rot = a => { const c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, 0, 0]; };
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]), dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const segD = (p, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], l = vx * vx + vy * vy || 1, t = clamp(((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / l, 0, 1); return Math.hypot(p[0] - a[0] - vx * t, p[1] - a[1] - vy * t); };
  const Z = { r: 0, x: 0, y: 0, s: 1 };

  // ---------- ядро: общее для игры и редактора ----------
  const Core = L10.Sem3Core = {
    mul, ap, inv, tr, rot, ID, wrap, sm, ang, dist,
    partMat(p) { const w = p.w, h = p.h; return mul(mul(mul(tr(p.x, p.y), rot((p.r || 0) * D2R)), [p.sx ?? 1, 0, 0, p.sy ?? 1, 0, 0]), tr(-w / 2, -h / 2)); },
    tip(R, id) { const b = R.B[id]; if (b.tx != null) return [b.tx, b.ty]; const k = b.kids[0]; return k ? [R.B[k].x, R.B[k].y] : [b.x, b.y + 40]; },
    // R — подготовленный риг: кости по порядку обхода, части с сетками и весами
    prep(D, getImg) {
      const R = { D, B: {}, order: [], parts: [], grpDef: {} };
      for (const b of D.bones) R.B[b.id] = Object.assign({}, b, { kids: [] });
      for (const b of Object.values(R.B)) if (b.p && R.B[b.p]) R.B[b.p].kids.push(b.id);
      const visit = id => { R.order.push(id); for (const k of R.B[id].kids) visit(k); };
      for (const b of Object.values(R.B)) if (!b.p || !R.B[b.p]) visit(b.id);
      for (const id of R.order) { const b = R.B[id], t = Core.tip(R, id); b.a0 = Math.atan2(t[1] - b.y, t[0] - b.x); b.len = Math.hypot(t[0] - b.x, t[1] - b.y) || 1; b.t = t; }
      for (const p of D.parts) { if (p.grp && R.grpDef[p.grp] == null) R.grpDef[p.grp] = p.var; R.parts.push(Core.prepPart(R, p, getImg(p.img))); }
      return R;
    },
    prepPart(R, p, img) {
      const q = { p, img, M: Core.partMat(p) };
      const bones = (p.skin || []).filter(id => R.B[id]);
      if (!img || bones.length < 1 || p.mode !== 'skin') { q.bone = R.B[p.bone] ? p.bone : R.order[0]; return q; }
      // сетка по картинке, пустые клетки выкидываются
      const g = p.grid || 40, nx = Math.max(1, Math.ceil(p.w / g)), ny = Math.max(1, Math.ceil(p.h / g));
      let alpha = null;
      try { const cv = document.createElement('canvas'); cv.width = p.w; cv.height = p.h; const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, p.w, p.h); alpha = cx.getImageData(0, 0, p.w, p.h).data; } catch (e) {}
      const filled = (x0, y0, x1, y1) => { if (!alpha) return true; x0 = Math.max(0, x0 - 3 | 0); y0 = Math.max(0, y0 - 3 | 0); x1 = Math.min(p.w, x1 + 3 | 0); y1 = Math.min(p.h, y1 + 3 | 0);
        for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) if (alpha[(y * p.w + x) * 4 + 3] > 8) return true; return false; };
      const V = [], UV = [], W = [], T = [], soft = p.soft ?? 30;
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
        const u = Math.min(p.w, i * g), v = Math.min(p.h, j * g), m = ap(q.M, [u, v]); UV.push([u, v]); V.push(m);
        let ws = bones.map(id => { const b = R.B[id]; return [id, 1 / Math.pow(segD(m, [b.x, b.y], b.t) + soft, 3)]; }).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const s = ws.reduce((a, w) => a + w[1], 0); W.push(ws.map(w => [w[0], w[1] / s]));
      }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        if (!filled(i * g, j * g, (i + 1) * g, (j + 1) * g)) continue;
        const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; T.push([a, b, d], [a, d, c]);
      }
      Object.assign(q, { V, UV, W, T, skin: bones }); return q;
    },
    // мировые (модельные) матрицы костей по позе {id: {r,x,y,s}}
    mats(R, pose) {
      const M = {};
      for (const id of R.order) {
        const b = R.B[id], q = pose[id] || Z, s = q.s ?? 1;
        const L = mul(mul(mul(tr(b.x + (q.x || 0), b.y + (q.y || 0)), rot((q.r || 0) * D2R)), [s * (q.fx || 1), 0, 0, s, 0, 0]), tr(-b.x, -b.y));     // fx=-1 — зеркально (пулемёт к Валере)
        M[id] = b.p && M[b.p] ? mul(M[b.p], L) : L;
      }
      return M;
    },
    // анимация: ключи костей k{id:[[t,r,x,y,s]]}, каналы c{mouth|eye:[[t,v]]}, варианты v{группа:[[t,имя]]}
    keyAt(K, t, len, loop) {
      if (!K || !K.length) return null; if (K.length === 1 || t <= K[0][0] && !loop) return K[0];
      let i = K.length - 1; while (i > 0 && K[i][0] > t) i--;
      let a = K[i], b = K[i + 1], ta = a[0], tb;
      if (t < K[0][0]) { if (!loop) return K[0]; a = K[K.length - 1]; b = K[0]; ta = a[0] - len; tb = b[0]; }
      else if (!b) { if (!loop) return a; b = K[0]; tb = b[0] + len; } else tb = b[0];
      const u = sm((t - ta) / Math.max(1e-4, tb - ta)), r = [t];
      for (let j = 1; j < a.length; j++) r.push(j === 1 ? a[1] + wrap(b[1] - a[1]) * u : lerp(a[j] ?? (j === 4 ? 1 : 0), b[j] ?? (j === 4 ? 1 : 0), u));
      return r;
    },
    sample(clip, t, pose, st, w = 1, add = false) {
      if (!clip) return; const len = clip.len || 1, loop = !!clip.loop; if (loop) t = ((t % len) + len) % len; else t = Math.min(t, len);
      for (const id in clip.k || {}) {
        const k = Core.keyAt(clip.k[id], t, len, loop); if (!k) continue;
        const q = pose[id] || (pose[id] = { r: 0, x: 0, y: 0, s: 1 });
        if (add) { q.r += k[1] * w; q.x += (k[2] || 0) * w; q.y += (k[3] || 0) * w; q.s *= 1 + ((k[4] ?? 1) - 1) * w; }
        else { q.r = k[1]; q.x = k[2] || 0; q.y = k[3] || 0; q.s = k[4] ?? 1; }
      }
      if (!st) return;
      for (const c in clip.c || {}) { const k = Core.keyAt(clip.c[c], t, len, loop); if (k) st.ch[c] = add ? (st.ch[c] || 0) + k[1] * w : k[1]; }
      if (!add) for (const g in clip.v || {}) { const K = clip.v[g]; let v = K[0] && K[0][1]; for (const e of K) if (e[0] <= t + 1e-4) v = e[1]; if (v != null) st.vars[g] = v; }
    },
    // поза клипа: кости без ключей берутся из idle (дыхание, поджатые лапы)
    base(D, t, name, ct, st) {
      const pose = {}; if (D.clips.idle) Core.sample(D.clips.idle, t, pose, st);
      if (name !== 'idle' && D.clips[name]) Core.sample(D.clips[name], ct, pose, st);
      return pose;
    },
    blend(A, B, u) {
      const O = {};
      for (const id of new Set(Object.keys(A).concat(Object.keys(B)))) { const a = A[id] || Z, b = B[id] || Z; O[id] = { r: a.r + wrap(b.r - a.r) * u, x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), s: lerp(a.s ?? 1, b.s ?? 1, u) }; }
      return O;
    },
    clone(P) { const O = {}; for (const id in P) O[id] = Object.assign({}, P[id]); return O; },
    // видимость части: варианты (ладонь/кулак), каналы (пасть открыта, свечение глаз), ф-я o.alpha(part) от игры
    alpha(R, q, st, o) {
      const p = q.p; if (p.hide) return 0;
      let a = p.a ?? 1;
      if (p.grp) {     // вариант группы; при смене позы старая растворяется, новая проявляется (st.xf от игры)
        const cur = st.vars[p.grp] ?? R.grpDef[p.grp], x = st.xf && st.xf[p.grp];
        if (p.var === cur) { if (x) a *= clamp(x.t / x.d * 2, 0, 1); }
        else if (x && p.var === x.from) a *= 1 - sm(x.t / x.d); else return 0;
      } const m = sm(((st.ch.mouth || 0) - 0.45) / 0.1);
      if (p.show === 'mouth') a *= m; else if (p.show === 'mouth0') a *= 1 - m; else if (p.show === 'eye') a *= clamp(st.ch.eye || 0, 0, 1);
      if (o && o.alpha) a *= o.alpha(p);
      return a;
    },
    // рисование: base — текущая матрица контекста, T0 — модель -> мир (экран игры). WebGL на отдельном холсте, без него — Canvas 2D.
    draw(c, R, M, T0, st, o = {}) { if (!Core.drawGL(c, R, M, T0, st, o)) Core.draw2d(c, R, M, T0, st, o); },
    gl: null,
    initGL() {
      if (Core.gl !== null) return Core.gl;
      try {
        const cv = document.createElement('canvas'), gl = cv.getContext('webgl2', { premultipliedAlpha: true, antialias: false }) || cv.getContext('webgl', { premultipliedAlpha: true, antialias: false });
        if (!gl) return (Core.gl = false);
        const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
        const pr = gl.createProgram();
        gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p;attribute vec2 uv;uniform vec2 vs;varying vec2 v;void main(){v=uv;gl_Position=vec4(p.x/vs.x*2.0-1.0,1.0-p.y/vs.y*2.0,0.0,1.0);}'));
        gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, 'precision mediump float;uniform sampler2D t;uniform float a;uniform vec4 tn;varying vec2 v;void main(){vec4 c=texture2D(t,v)*a;c.rgb=mix(c.rgb,tn.rgb*c.a,tn.a);gl_FragColor=c;}'));
        gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
        gl.useProgram(pr); const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        const lp = gl.getAttribLocation(pr, 'p'), lu = gl.getAttribLocation(pr, 'uv');
        gl.enableVertexAttribArray(lp); gl.enableVertexAttribArray(lu); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 16, 0); gl.vertexAttribPointer(lu, 2, gl.FLOAT, false, 16, 8);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        return (Core.gl = { gl, cv, pr, vs: gl.getUniformLocation(pr, 'vs'), ua: gl.getUniformLocation(pr, 'a'), tn: gl.getUniformLocation(pr, 'tn'), gl2: typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext });
      } catch (e) { console.warn('sem3 webgl', e); return (Core.gl = false); }
    },
    tex(G, R, img) {
      const m = R.tex || (R.tex = new Map()); let t = m.get(img); if (t) return t; const gl = G.gl;
      t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (G.gl2) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      m.set(img, t); return t;
    },
    dropTex(R) { if (R && R.tex && Core.gl) { for (const t of R.tex.values()) Core.gl.gl.deleteTexture(t); R.tex = null; } },
    drawGL(c, R, M, T0, st, o) {
      const G = Core.initGL(); if (!G) return false; const gl = G.gl, W = c.canvas.width, H = c.canvas.height; if (!W || !H) return true;
      if (G.cv.width !== W || G.cv.height !== H) { G.cv.width = W; G.cv.height = H; }
      const bt = c.getTransform(), S0 = mul([bt.a, bt.b, bt.c, bt.d, bt.e, bt.f], T0);
      gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(G.pr); gl.uniform2f(G.vs, W, H);
      const tn = o.tint || [0, 0, 0, 0]; gl.uniform4f(G.tn, tn[0], tn[1], tn[2], tn[3]);
      for (const q of R.parts) {
        if (o.only && !o.only(q.p)) continue;
        const a = Core.alpha(R, q, st, o); if (a < 0.01 || !q.img) continue;
        let v;
        if (!q.T) { const m = mul(mul(S0, M[q.bone] || ID), q.M), w = q.p.w, h = q.p.h, P = [[0, 0], [w, 0], [w, h], [0, h]].map(p => ap(m, p));
          v = new Float32Array([P[0][0], P[0][1], 0, 0, P[1][0], P[1][1], 1, 0, P[2][0], P[2][1], 1, 1, P[0][0], P[0][1], 0, 0, P[2][0], P[2][1], 1, 1, P[3][0], P[3][1], 0, 1]); }
        else {
          const n = q.V.length, X = new Float32Array(n * 2);
          for (let i = 0; i < n; i++) { const vv = q.V[i]; let x = 0, y = 0; for (const [id, w] of q.W[i]) { const m = M[id] || ID; x += (m[0] * vv[0] + m[2] * vv[1] + m[4]) * w; y += (m[1] * vv[0] + m[3] * vv[1] + m[5]) * w; }
            X[i * 2] = S0[0] * x + S0[2] * y + S0[4]; X[i * 2 + 1] = S0[1] * x + S0[3] * y + S0[5]; }
          v = new Float32Array(q.T.length * 12); let k = 0; const iw = 1 / q.p.w, ih = 1 / q.p.h;
          for (const t of q.T) for (const i of t) { v[k++] = X[i * 2]; v[k++] = X[i * 2 + 1]; v[k++] = q.UV[i][0] * iw; v[k++] = q.UV[i][1] * ih; }
        }
        gl.bindTexture(gl.TEXTURE_2D, Core.tex(G, R, q.img)); gl.uniform1f(G.ua, Math.min(1, a));
        gl.bufferData(gl.ARRAY_BUFFER, v, gl.STREAM_DRAW); gl.drawArrays(gl.TRIANGLES, 0, v.length / 4);
      }
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(G.cv, 0, 0); c.restore();
      return true;
    },
    draw2d(c, R, M, T0, st, o = {}) {
      const bt = c.getTransform(), S0 = mul([bt.a, bt.b, bt.c, bt.d, bt.e, bt.f], T0);
      c.save();
      for (const q of R.parts) {
        if (o.only && !o.only(q.p)) continue;
        const a = Core.alpha(R, q, st, o); if (a < 0.01 || !q.img) continue;
        c.globalAlpha = Math.min(1, a);
        if (!q.T) { const m = mul(mul(S0, M[q.bone] || ID), q.M); c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]); c.drawImage(q.img, 0, 0, q.p.w, q.p.h); continue; }
        const P = q.V.map((v, i) => { let x = 0, y = 0; for (const [id, w] of q.W[i]) { const m = M[id] || ID; x += (m[0] * v[0] + m[2] * v[1] + m[4]) * w; y += (m[1] * v[0] + m[3] * v[1] + m[5]) * w; } return ap(S0, [x, y]); });
        for (const t of q.T) Core.tri(c, q.img, q.UV[t[0]], q.UV[t[1]], q.UV[t[2]], P[t[0]], P[t[1]], P[t[2]], q.p);
      }
      c.restore();
    },
    // треугольник картинки с аффинным переносом (чуть раздут, чтобы не было щелей)
    tri(c, img, s0, s1, s2, d0, d1, d2, p) {
      const cx = (d0[0] + d1[0] + d2[0]) / 3, cy = (d0[1] + d1[1] + d2[1]) / 3, ex = q => { const dx = q[0] - cx, dy = q[1] - cy, l = Math.hypot(dx, dy) || 1, k = (l + 0.8) / l; return [cx + dx * k, cy + dy * k]; };
      const e0 = ex(d0), e1 = ex(d1), e2 = ex(d2);
      const den = (s1[0] - s0[0]) * (s2[1] - s0[1]) - (s2[0] - s0[0]) * (s1[1] - s0[1]); if (Math.abs(den) < 1e-6) return;
      const a = ((d1[0] - d0[0]) * (s2[1] - s0[1]) - (d2[0] - d0[0]) * (s1[1] - s0[1])) / den, b = ((d1[1] - d0[1]) * (s2[1] - s0[1]) - (d2[1] - d0[1]) * (s1[1] - s0[1])) / den;
      const cc = ((d2[0] - d0[0]) * (s1[0] - s0[0]) - (d1[0] - d0[0]) * (s2[0] - s0[0])) / den, d = ((d2[1] - d0[1]) * (s1[0] - s0[0]) - (d1[1] - d0[1]) * (s2[0] - s0[0])) / den;
      const e = d0[0] - a * s0[0] - cc * s0[1], f = d0[1] - b * s0[0] - d * s0[1];
      c.setTransform(1, 0, 0, 1, 0, 0); c.save(); c.beginPath(); c.moveTo(e0[0], e0[1]); c.lineTo(e1[0], e1[1]); c.lineTo(e2[0], e2[1]); c.closePath(); c.clip();
      c.setTransform(a, b, cc, d, e, f);
      const x0 = Math.max(0, Math.min(s0[0], s1[0], s2[0]) - 2), y0 = Math.max(0, Math.min(s0[1], s1[1], s2[1]) - 2), x1 = Math.min(p.w, Math.max(s0[0], s1[0], s2[0]) + 2), y1 = Math.min(p.h, Math.max(s0[1], s1[1], s2[1]) + 2);
      const kx = (img.naturalWidth || img.width) / p.w, ky = (img.naturalHeight || img.height) / p.h;
      if (x1 > x0 && y1 > y0) c.drawImage(img, x0 * kx, y0 * ky, (x1 - x0) * kx, (y1 - y0) * ky, x0, y0, x1 - x0, y1 - y0);
      c.restore();
    },
    // CCD: цепочка костей тянет кончик (tipLocal — точка в покое последней кости) к цели tq (модель)
    // рука для IK: целая нарисованная поза (часть с hand) — крутится вся от плеча; иначе старая цепочка костей до кисти
    armIK(R, side, vars) {
      const D = R.D, ch = (D.roles || {})['arm' + side]; if (!ch || !ch.length || !R.B[ch[0]]) return null;
      const g = 'arm' + side, v = (vars || {})[g] ?? R.grpDef[g], p = D.parts.find(q => q.grp === g && q.var === v && q.hand);
      if (p) return { chain: [ch[0]], tip: p.hand, lim: 35 };
      if (ch.length < 2 || !R.B[ch[ch.length - 1]]) return null; const e = R.B[ch[ch.length - 1]]; return { chain: ch.slice(0, -1), tip: [e.x, e.y] };
    },
    // o: lim — предел поворота целой руки (°), st — [мин, макс] растяжения (рука «летит на зрителя» — крупнее)
    reach(R, pose, side, vars, tq, it = 6, o = {}) {
      const a = Core.armIK(R, side, vars); if (!a) return; const id = a.chain[0], lim = o.lim ?? a.lim, r0 = lim ? (pose[id] || {}).r || 0 : 0;
      Core.ccd(R, pose, a.chain, a.tip, tq, it);
      if (lim) { const q = pose[id]; q.r = clamp(q.r, r0 - lim, r0 + lim); }
      if (o.st && a.lim) {
        const q = pose[id] || (pose[id] = { r: 0, x: 0, y: 0, s: 1 }), M = Core.mats(R, pose), b = R.B[id], pv = ap(M[id], [b.x, b.y]), tp = ap(M[id], a.tip);
        const k = Math.hypot(tq[0] - pv[0], tq[1] - pv[1]) / Math.max(1, Math.hypot(tp[0] - pv[0], tp[1] - pv[1])); q.s = clamp((q.s ?? 1) * k, o.st[0], o.st[1]);
      }
    },
    ccd(R, pose, chain, tipLocal, tq, it = 8) {
      for (let n = 0; n < it; n++) for (let j = chain.length - 1; j >= 0; j--) {
        const M = Core.mats(R, pose), b = R.B[chain[j]], pv = ap(M[chain[j]], [b.x, b.y]), tp = ap(M[chain[chain.length - 1]], tipLocal);
        const d = wrap((ang(pv, tq) - ang(pv, tp)) / D2R), q = pose[chain[j]] || (pose[chain[j]] = { r: 0, x: 0, y: 0, s: 1 }); q.r += clamp(d, -40, 40);
      }
    },
  };

  // ---------- Семён в игре ----------
  L10.Sem3 = class {
    constructor(o = {}) {
      this.D = o.D || L10.SEM3; this.getImg = o.img || (n => L10.img['s3_' + n]);
      this.x = o.x || 320; this.y = o.y || 260; this.H = o.H || 240; this.t = 0;
      this.pose = 'idle'; this.poseT = 0; this.prev = null; this.cur = {}; this.st = { ch: {}, vars: {} };
      this.ovr = {}; this.watch = null; this.aimL = null; this.aimR = null; this.hoseT = null; this.gunT = null;
      this.v = { mouth: 0, eye: 0, legs: 0 }; this.hoseW = 0; this.mgRec = 0; this.mgFlash = 0; this.flashT = 0; this.shield = 0; this.gunK = 1;
      this.legs = [0, 1, 2, 3].map(() => ({ reach: 0, tgt: null, grow: 1, hot: 0, gs: 1, brk: 0, k: 1, a: null }));
      this.hA = null; this.hAV = null; this.M = null;
    }
    rig() { if (!this.R) this.R = Core.prep(this.D, this.getImg); return this.R; }
    role(k) { return (this.D.roles || {})[k]; }
    setPose(p) { if (!this.D.clips[p]) p = 'idle'; if (p !== this.pose) { this.prev = Core.clone(this.cur); this.pose = p; this.poseT = 0; } }
    scale() { return this.H / (this.D.water - this.D.top); }
    T0() { const s = this.scale(); return mul(mul(tr(this.x, this.y), [s, 0, 0, s, 0, 0]), tr(-this.D.cx, -this.D.water)); }
    toModel(p) { return ap(inv(this.T0()), Array.isArray(p) ? p : [p.x, p.y]); }
    m() { if (!this.M) this.M = Core.mats(this.rig(), this.cur); return this.M; }
    W(id, p) { return ap(this.T0(), ap(this.m()[id] || ID, p)); }
    P(k) {
      const R = this.rig(), D = this.D;
      if (k === 'h') k = 'mg';
      if (k === 'hose') { const h = this.role('hose') || []; const id = h[h.length - 1]; return id ? this.W(id, R.B[id].t) : this.P('belly'); }
      if (k[0] === 'l' && k[1] === 'g') { const ch = (this.role('legs') || [])[+k[2]]; if (!ch) return this.P('belly'); const j = k.length > 3 ? +k[4] : 4;
        if (j >= ch.length) { const id = ch[ch.length - 1]; return this.W(id, R.B[id].t); } const id = ch[Math.max(0, j)]; return this.W(id, [R.B[id].x, R.B[id].y]); }
      if ((k === 'hL' || k === 'hR') && !(D.pts || {})[k]) { const a = Core.armIK(R, k[1], (this.st || {}).vars); if (a) return this.W(a.chain[a.chain.length - 1], a.tip); }
      const q = (D.pts || {})[k] || (D.pts || {}).belly; if (!q) return [this.x, this.y - this.H / 2];
      return this.W(q.b, [q.x, q.y]);
    }
    box() { const b = this.D.box || [this.D.cx - 200, this.D.top + 60, this.D.cx + 200, this.D.water], t = (this.role('torso') || 'torso'), pts = [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]].map(p => this.W(t, p)); const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; }
    lookX(p) { return clamp((p.x != null ? p.x : p[0]) - this.x, -400, 400) / 400; }
    fireGun() { this.mgRec = 1; this.mgFlash = 0.06; this.M = null; return this.P('mg'); }
    update(dt) {
      const R = this.rig(), D = this.D, t = (this.t += dt); this.poseT += dt; this.flashT = Math.max(0, this.flashT - dt);
      const clip = D.clips[this.pose] || D.clips.idle, f = clip.f || {}, st = { ch: {}, vars: {} };
      let pose = Core.base(D, t, this.pose, this.poseT, st);
      const fade = clip.fade ?? 0.25; if (this.prev && this.poseT < fade) pose = Core.blend(this.prev, pose, sm(this.poseT / fade));
      const q = id => pose[id] || (pose[id] = { r: 0, x: 0, y: 0, s: 1 });
      // смена позы рук (вариантов) — растворение за f.xf с (по умолчанию 0.12)
      this.vc = this.vc || {}; this.xf = this.xf || {};
      for (const g in R.grpDef) { const v = st.vars[g] ?? R.grpDef[g];
        if (this.vc[g] != null && this.vc[g] !== v) this.xf[g] = { from: this.vc[g], t: 0, d: f.xf ?? 0.12 };
        this.vc[g] = v; const x = this.xf[g]; if (x) { x.t += dt; if (x.t >= x.d) delete this.xf[g]; } }
      st.xf = this.xf;
      // качка на волне и дыхание
      const bob = D.bob || {}, root = R.order[0], torso = this.role('torso') || 'torso';
      q(root).x += Math.sin(t * 0.55) * (bob.x ?? 4); q(root).y += Math.sin(t * 1.3) * (bob.y ?? 5); if (R.B[torso]) q(torso).r += Math.sin(t * 0.8) * (bob.r ?? 1.4);
      if (f.shake) { q(root).x += Math.sin(t * 53) * 3; q(root).y += Math.sin(t * 61) * 2; if (R.B[this.role('head') || 'head']) q(this.role('head') || 'head').r += Math.sin(t * 47) * 3;     // рёв: всё тело трясётся
        for (const s of ['armL', 'armR']) { const ch = this.role(s), b = ch && (ch[1] || ch[0]); if (b && R.B[b]) q(b).r += Math.sin(t * (s === 'armL' ? 37 : 41)) * 6; } }
      // каналы: пасть, глаза; наложения атак, идущих одновременно
      const O = this.ovr || {}, k = clamp(dt * 12, 0, 1);
      this.v.mouth = lerp(this.v.mouth, clamp(Math.max(st.ch.mouth || 0, O.mouth || 0), 0, 1), k);
      this.v.eye = lerp(this.v.eye, clamp(Math.max(st.ch.eye || 0, O.eye || 0), 0, 1), k);
      this.v.legs = lerp(this.v.legs, O.legs || 0, clamp(dt * 4, 0, 1));
      for (const [c, w] of [['+mouth', this.v.mouth], ['+eye', this.v.eye], ['+legs', this.v.legs]]) if (w > 0.01 && D.clips[c]) Core.sample(D.clips[c], t, pose, null, w, true);
      st.ch.mouth = this.v.mouth; st.ch.eye = this.v.eye;
      // взгляд на Валеру
      const head = this.role('head') || 'head', look = f.look && (this.gunT || this.aimL) ? (this.gunT || this.aimL) : this.watch;
      if (look) { const lx = this.lookX(look); if (R.B[head]) q(head).r += lx * (f.look ? 16 : 8); if (R.B[torso]) q(torso).r += lx * 3; }
      const gun = this.role('gun') || 'gun';
      if (R.B[gun]) { if (this.gunT) { const lx = this.lookX(this.gunT), fl = lx < 0 ? -1 : 1; q(gun).fx = fl; if (f.gun) q(gun).r += clamp(Math.abs(lx) * 22, 0, 22) * fl; } q(gun).s *= (this.gunK || 1) * (1 + this.mgRec * 0.05); }
      // IK рук (хлопок, хватание)
      if (f.ik) for (const s of ['L', 'R']) {
        if (!f.ik.includes(s)) continue; const tg = s === 'L' ? this.aimL : (this.aimR || this.aimL); if (!tg) continue;
        Core.reach(R, pose, s, st.vars, this.toModel(tg), 6, { lim: f.ikLim, st: f.ikSt });
      }
      this.legUpd(dt, pose);
      this.hoseUpd(dt, pose, O.hose || f.hose);
      this.mgRec = Math.max(0, this.mgRec - dt * 12); this.mgFlash = Math.max(0, this.mgFlash - dt);
      this.cur = pose; this.st = st; this.M = null;
    }
    // лапы к станциям: из позы анимации (поджаты) -> IK когтя в гнездо; растёт (grow), отрывается (brk), под током дрожит
    legUpd(dt, pose) {
      const R = this.rig(), chs = this.role('legs') || [], t = this.t;
      this.legs.forEach((lg, i) => {
        const ch = (chs[i] || []).filter(id => R.B[id]); if (!ch.length) return;
        const g = i < 2 ? -1 : 1, base = ch.map(id => Object.assign({}, pose[id] || Z));
        if (!lg.a) lg.a = base.map(b => b.r);
        if (lg.grow < 0.05 && lg.gs > 0.3 && !lg.brk) { lg.brk = 1e-3; lg.a0 = lg.a.slice(); }
        let A = base.map(b => b.r), stretch = 1;
        if (lg.brk) {
          lg.brk += dt; const b = lg.brk, e = sm(b / 0.25), sh = Math.sin(b * 34) * (1 - sm(b / 0.9));
          A = lg.a0.map((a, j) => a + g * ([-40, 50, 40, 60][j] ?? 40) * e + g * sh * ([10, 26, -30, 0][j] ?? 0));
          lg.gs = 1 - sm((b - 0.35) / 0.6); if (b > 1) { lg.brk = 0; lg.gs = 0; }
        } else {
          lg.gs = lg.grow; const u = sm(lg.reach);
          if (lg.tgt && u > 0.001) {
            const P2 = Core.clone(pose), last = R.B[ch[ch.length - 1]], tq = this.toModel(lg.tgt);
            const M = Core.mats(R, P2), r0 = ap(M[ch[0]], [R.B[ch[0]].x, R.B[ch[0]].y]); let L = 0; for (const id of ch) L += R.B[id].len;
            stretch = clamp(dist(r0, tq) / (L * 0.97), 1, 1.3);
            for (let j = 1; j < ch.length; j++) { const pb = R.B[ch[j - 1]], o = P2[ch[j]] || (P2[ch[j]] = { r: 0, x: 0, y: 0, s: 1 }); o.x += Math.cos(pb.a0) * pb.len * (stretch - 1); o.y += Math.sin(pb.a0) * pb.len * (stretch - 1); }
            Core.ccd(R, P2, ch, last.t, tq, 8);
            const wob = lg.hot ? Math.sin(t * 47 + i * 3) * 0.7 : Math.sin(t * 9 + i) * 2 * (1 - u);
            A = A.map((a, j) => a + wrap((P2[ch[j]] || Z).r - a) * u + (j ? wob : 0));
            stretch = lerp(1, stretch, u);
          } else if (lg.grow < 1) A = A.map((a, j) => a + g * (1 - lg.grow) * ([20, 40, 30, 30][j] ?? 30));
        }
        const h = clamp(dt * 14, 0, 1); lg.a = lg.a.map((x, j) => x + wrap((A[j] ?? x) - x) * h); lg.k = lerp(lg.k, stretch, h);
        ch.forEach((id, j) => { const o = pose[id] || (pose[id] = { r: 0, x: 0, y: 0, s: 1 }); o.r = lg.a[j];
          if (j) { const pb = R.B[ch[j - 1]]; o.x = (base[j].x || 0) + Math.cos(pb.a0) * pb.len * (lg.k - 1); o.y = (base[j].y || 0) + Math.sin(pb.a0) * pb.len * (lg.k - 1); } });
        const r0 = pose[ch[0]]; r0.s = (r0.s ?? 1) * Math.max(0.001, lg.gs);
      });
    }
    // шланг: углы звеньев догоняют анимацию с запаздыванием (пружины); 'up' — занесён над головой, 'hit' — бьёт в hoseT
    hoseUpd(dt, pose, mode) {
      const R = this.rig(), ch = (this.role('hose') || []).filter(id => R.B[id]); if (!ch.length) return;
      const n = ch.length, a0 = ch.map(id => R.B[id].a0 / D2R), t = this.t;
      if (!this.hA || this.hA.length !== n) { this.hA = a0.slice(); this.hAV = a0.map(() => 0); }
      const hit = mode === 'hit' || mode === 'sweep'; this.hoseW = lerp(this.hoseW, mode ? 1 : 0, clamp(dt * (hit ? 12 : 3), 0, 1));
      let acc = 0; const want = ch.map((id, i) => { acc += (pose[id] || Z).r; const f = i / Math.max(1, n - 1); return a0[i] + acc + 14 * Math.sin(t * 0.9 - f * 4) * f + 8 * Math.sin(t * 0.4) * f; });
      const b0 = R.B[ch[0]], par = b0.p && R.B[b0.p] ? b0.p : null;
      const Mp = par ? Core.mats(R, pose)[par] : ID, root = [b0.x, b0.y]; let tq = null, L = 0; for (const id of ch) L += R.B[id].len;
      const toPar = p => ap(inv(Mp), this.toModel(p));
      const hk = this.D.water - this.D.top; if (mode === 'up') tq = [root[0] + (this.hoseT ? clamp((toPar(this.hoseT)[0] - root[0]) * 0.3, -0.17 * hk, 0.17 * hk) : 0), this.D.top - 0.24 * hk];
      else if (hit && this.hoseT) tq = toPar(this.hoseT);
      const stretch = tq ? clamp(dist(root, tq) / L * 1.05, 1, 2.4) : 1;
      if (tq) { let px = root[0], py = root[1];
        for (let i = 0; i < n; i++) { const f = i / Math.max(1, n - 1), len = R.B[ch[i]].len * stretch; let aim = ang([px, py], tq) / D2R; if (mode === 'up') aim += (f - 0.5) * 60 * (tq[0] < root[0] ? -1 : 1);
          want[i] += wrap(aim - want[i]) * this.hoseW * (0.25 + 0.75 * sm(f / 0.35)); px += Math.cos(want[i] * D2R) * len; py += Math.sin(want[i] * D2R) * len; } }
      const h = Math.min(dt, 1 / 30);
      for (let i = 0; i < n; i++) { const f = i / Math.max(1, n - 1), k = lerp(60, 16, f) * (1 + this.hoseW * (hit ? 6 : 1.5)), d = wrap(want[i] - this.hA[i]); this.hAV[i] += (k * d - 2 * 0.7 * Math.sqrt(k) * this.hAV[i]) * h; this.hA[i] += this.hAV[i] * h; }
      const sk = lerp(1, stretch, this.hoseW);
      ch.forEach((id, i) => { const o = pose[id] || (pose[id] = { r: 0, x: 0, y: 0, s: 1 }); o.r = wrap((this.hA[i] - a0[i]) - (i ? this.hA[i - 1] - a0[i - 1] : 0));
        if (i) { const pb = R.B[ch[i - 1]]; o.x = Math.cos(pb.a0) * pb.len * (sk - 1); o.y = Math.sin(pb.a0) * pb.len * (sk - 1); } });
    }
    alphaFn() { return p => { if (p.tag && p.tag.startsWith('leg')) { const lg = this.legs[+p.tag[3]]; return lg ? (lg.gs < 0.02 ? 0 : Math.min(1, lg.gs * 2)) : 1; } return 1; }; }
    // рисуем на отдельный холст, чтобы тонировать целиком (вспышка урона, щит)
    render(c, only) {
      const tint = this.flashT > 0 ? [1, 0.27, 0.16, 0.4] : this.shield > 0 ? [0.35, 0.78, 1, 0.22 + Math.sin(this.t * 12) * 0.1] : null;
      Core.draw(c, this.rig(), this.m(), this.T0(), this.st, { alpha: this.alphaFn(), only, tint });
    }
    drawHoseOnly(c) { this.render(c, p => p.tag === 'hose'); }
    // руки «у зрителя» (флаг анимации front): части с ролью arm рисуются отдельным проходом поверх плотов
    armsFront() { const c = this.D.clips[this.pose]; return !!(c && c.f && c.f.front); }
    draw(c, o = {}) {
      if (o.arms === 'only') return this.render(c, p => p.tag === 'arm');
      this.render(c, o.arms === 'skip' ? p => p.tag !== 'arm' : null);
      c.save(); c.globalCompositeOperation = 'lighter';
      const glow = (p, r, col, a) => { const g = c.createRadialGradient(p[0], p[1], 0.5, p[0], p[1], r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); };
      if (this.v.eye > 0.05) for (const e of ['e', 'e2']) glow(this.P(e), this.H * 0.06 * (0.6 + this.v.eye), '255,90,40', this.v.eye * 0.8);
      if (this.v.mouth > 0.55) glow(this.P('m'), this.H * 0.12, '120,255,220', (this.v.mouth - 0.55) * 1.3);
      if (this.mgFlash > 0) glow(this.P('mg'), this.H * 0.1, '255,220,120', 1);
      this.legs.forEach((lg, i) => { if (!lg.hot || lg.gs < 0.5) return;
        const pts = [4, 3, 2, 1].map(j => this.P('lg' + i + '.' + j)), ph = (this.t * 2.2 + i * 0.37) % 1;
        c.strokeStyle = 'rgba(150,240,255,0.85)'; c.lineWidth = 1.2; c.beginPath();
        for (let j = 0; j < pts.length - 1; j++) { const a = pts[j], b = pts[j + 1]; for (let n = 0; n <= 4; n++) { const f = n / 4, x = lerp(a[0], b[0], f) + (n % 4 ? (Math.random() - 0.5) * 5 : 0), y = lerp(a[1], b[1], f) + (n % 4 ? (Math.random() - 0.5) * 5 : 0); if (!j && !n) c.moveTo(x, y); else c.lineTo(x, y); } }
        c.stroke();
        const s0 = Math.min(2, Math.floor(ph * 3)), q = pts[s0], q2 = pts[s0 + 1], f = ph * 3 - s0; glow([lerp(q[0], q2[0], f), lerp(q[1], q2[1], f)], this.H * 0.07, '120,230,255', 0.9);
        glow(pts[0], this.H * 0.05, '160,250,255', 0.6 + Math.random() * 0.4); });
      c.restore();
    }
  };
})();
