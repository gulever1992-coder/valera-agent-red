// WebGL-рендер сеток с весами костей (скиннинг) для рига Семёна. Рисует в свой холст 1280x720 (логика 640x360),
// затем одним drawImage переносится в 2D-холст игры. Без WebGL — L10.Skin.ok = false (игра берёт старый риг).
(() => {
  const VS = `attribute vec2 aP; attribute vec2 aUV; attribute vec3 aB; attribute vec2 aW;
uniform vec4 uM[64]; varying vec2 vUV;
vec2 tf(float b, vec2 p) { int i = int(b + 0.5) * 2; vec4 m0 = uM[i]; vec4 m1 = uM[i + 1]; return vec2(m0.x * p.x + m0.z * p.y + m1.x, m0.y * p.x + m0.w * p.y + m1.y); }
void main() { float w2 = max(0.0, 1.0 - aW.x - aW.y); vec2 q = tf(aB.x, aP) * aW.x + tf(aB.y, aP) * aW.y + tf(aB.z, aP) * w2;
  gl_Position = vec4(q.x / 320.0 - 1.0, 1.0 - q.y / 180.0, 0.0, 1.0); vUV = aUV; }`;
  const FS = `precision mediump float; uniform sampler2D uT; uniform vec4 uTint; uniform float uA; varying vec2 vUV;
void main() { vec4 c = texture2D(uT, vUV); c.rgb = mix(c.rgb, uTint.rgb * c.a, uTint.a); gl_FragColor = c * uA; }`;
  const NB = 32;
  L10.Skin = class {
    constructor(img, data) {
      const cv = this.cv = document.createElement('canvas'); cv.width = 1280; cv.height = 720;
      const gl = this.gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true });
      if (!gl) { this.ok = false; return; }
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      const pr = this.pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
      this.loc = { P: gl.getAttribLocation(pr, 'aP'), UV: gl.getAttribLocation(pr, 'aUV'), B: gl.getAttribLocation(pr, 'aB'), W: gl.getAttribLocation(pr, 'aW'), M: gl.getUniformLocation(pr, 'uM'), T: gl.getUniformLocation(pr, 'uTint'), A: gl.getUniformLocation(pr, 'uA') };
      const tex = this.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.L = {};
      for (const [k, L] of Object.entries(data.layers)) {
        const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(L.v), gl.STATIC_DRAW);
        const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(L.t), gl.STATIC_DRAW);
        this.L[k] = { vb, ib, n: L.t.length };
      }
      this.dvb = gl.createBuffer(); this.dib = gl.createBuffer(); this.dv = []; this.di = [];
      this.M = new Float32Array(NB * 8); this.aw = data.aw; this.ah = data.ah;
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.viewport(0, 0, 1280, 720);
      this.ok = true;
    }
    begin(mats) {     // mats: массив [a,b,c,d,e,f] на кость
      const gl = this.gl; gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      this.setMats(mats);
    }
    setMats(mats) { const M = this.M; M.fill(0); for (let i = 0; i < mats.length && i < NB; i++) { const m = mats[i]; if (!m) continue; M.set([m[0], m[1], m[2], m[3], m[4], m[5], 0, 0], i * 8); } this.gl.uniform4fv(this.loc.M, M); }
    attrs() {
      const gl = this.gl, l = this.loc, st = 36;
      gl.enableVertexAttribArray(l.P); gl.vertexAttribPointer(l.P, 2, gl.FLOAT, false, st, 0);
      gl.enableVertexAttribArray(l.UV); gl.vertexAttribPointer(l.UV, 2, gl.FLOAT, false, st, 8);
      gl.enableVertexAttribArray(l.B); gl.vertexAttribPointer(l.B, 3, gl.FLOAT, false, st, 16);
      gl.enableVertexAttribArray(l.W); gl.vertexAttribPointer(l.W, 2, gl.FLOAT, false, st, 28);
    }
    look(tint, a) { const gl = this.gl; gl.uniform4fv(this.loc.T, tint || [0, 0, 0, 0]); gl.uniform1f(this.loc.A, a == null ? 1 : a); }
    layer(k, tint, a = 1) {
      const L = this.L[k]; if (!L || a <= 0.003) return; const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, L.vb); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, L.ib); this.attrs(); this.look(tint, a);
      gl.drawElements(gl.TRIANGLES, L.n, gl.UNSIGNED_SHORT, 0);
    }
    // динамика: вершины уже в экранных координатах (кость 0 = единичная матрица)
    quad(p, r, tint, a) {     // p: 4 угла [x,y] (лв, пв, пн, лн); r: прямоугольник атласа [x,y,w,h]
      const u0 = r[0] / this.aw, v0 = r[1] / this.ah, u1 = (r[0] + r[2]) / this.aw, v1 = (r[1] + r[3]) / this.ah, uv = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
      const v = []; for (let i = 0; i < 4; i++) v.push(p[i][0], p[i][1], uv[i][0], uv[i][1], 0, 0, 0, 1, 0);
      this.dyn(v, [0, 1, 2, 0, 2, 3], tint, a);
    }
    dyn(v, idx, tint, a = 1) {
      const gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, this.dvb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.dib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.DYNAMIC_DRAW);
      this.attrs(); this.look(tint, a); gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
    }
    end(c) { c.save(); c.imageSmoothingEnabled = true; c.drawImage(this.cv, 0, 0, 1280, 720, 0, 0, 640, 360); c.restore(); }
  };
})();
