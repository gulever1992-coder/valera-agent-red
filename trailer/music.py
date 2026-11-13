# Рок-трек для трейлера «Валера: Агент RED». 150 BPM, ми-минор, ~72 с.
# Гитара — модель струны Карплуса-Стронга + перегруз + «кабинет»; бас, барабаны, лид — синтез.
# Запуск: py music.py  ->  music.wav
import numpy as np, wave, os

SR = 44100
BPM = 150
BEAT = 60 / BPM            # 0.4 с
BAR = BEAT * 4             # 1.6 с
E8 = BEAT / 2              # восьмая
TOTAL = 84.0
N = int(SR * TOTAL)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)

def mf(m): return 440.0 * 2 ** ((m - 69) / 12)
def at(t): return int(round(t * SR))

def add(sig, t, gl=1.0, gr=None):
    if gr is None: gr = gl
    i = at(t)
    if i >= N: return
    n = min(len(sig), N - i)
    L[i:i + n] += sig[:n] * gl; R[i:i + n] += sig[:n] * gr

# ---------- простые фильтры ----------
def fft_filter(x, H):
    n = len(x); m = 1 << (n - 1).bit_length()
    X = np.fft.rfft(x, m); f = np.fft.rfftfreq(m, 1 / SR)
    return np.fft.irfft(X * H(f), m)[:n]

def lp(x, fc, order=2): return fft_filter(x, lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * order)))
def hp(x, fc, order=2): return fft_filter(x, lambda f: 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** (2 * order)))
def bp(x, fc, q=1.0): return fft_filter(x, lambda f: 1 / (1 + q * q * (f / fc - fc / np.maximum(f, 1e-3)) ** 2) ** 0.5)
def peak(f, fc, gain_db, w):  # колокол усиления
    return 1 + (10 ** (gain_db / 20) - 1) * np.exp(-0.5 * (np.log2(np.maximum(f, 1) / fc) / w) ** 2)

# ---------- гитара ----------
def ks(freq, dur, decay=0.996, bright=0.5):
    n = int(dur * SR); P = max(2, int(round(SR / freq)))
    buf = rng.uniform(-1, 1, P)
    buf = lp(np.concatenate([buf, buf]), 1500 + 6000 * bright)[:P]
    out = np.zeros(n + P + 1); out[:P] = buf
    k = P
    while k < n + 1:
        seg = out[k - P:k - P + P]
        nxt = out[k - P + 1:k - P + 1 + P]
        m = min(P - 1, n + 1 - k)
        out[k:k + m] = 0.5 * (seg[:m] + nxt[:m]) * decay
        k += m
    return out[P:P + n]

def cab(x):
    return fft_filter(x, lambda f: (1 / np.sqrt(1 + (f / 4800) ** 8)) * (1 / np.sqrt(1 + (90 / np.maximum(f, 1)) ** 4))
                      * peak(f, 2400, 5, 0.6) * peak(f, 120, 3, 0.7) * peak(f, 700, -3, 0.8))

def gtr(root, dur, kind='ch', detune=0.0):
    """kind: ch — аккорд (квинта+октава), pm — глушёная, ring — звенящий аккорд."""
    notes = [root, root + 7, root + 12] if kind != 'pm' else [root, root + 7]
    d = dur + (0.05 if kind != 'ring' else 0)
    sig = np.zeros(int(d * SR))
    for k, m in enumerate(notes):
        f = mf(m) * (1 + detune)
        s = ks(f, d, decay=0.9985 if kind != 'pm' else 0.985, bright=0.75)
        off = int(0.004 * k * SR)
        sig[off:] += s[:len(sig) - off]
    if kind == 'pm':
        sig = lp(sig, 1100)
    drive = 9 if kind != 'pm' else 6
    sig = np.tanh(sig * drive)
    sig = np.tanh(hp(sig, 60) * 2.2)
    env = np.ones(len(sig)); rel = int(0.03 * SR); env[-rel:] = np.linspace(1, 0, rel)
    if kind == 'ring':
        env *= np.exp(-np.arange(len(sig)) / SR / 2.4)
    return cab(sig * env) * 0.35

def gtr_both(root, t, dur, kind='ch', vol=1.0):
    a = gtr(root, dur, kind, 0.0); b = gtr(root, dur, kind, 0.0025)
    add(a, t, 0.95 * vol, 0.35 * vol); add(b, t + 0.008, 0.35 * vol, 0.95 * vol)

# ---------- бас ----------
def bass(m, dur, vol=0.5):
    n = int(dur * SR); t = np.arange(n) / SR; f = mf(m - 12)
    s = 2 * ((t * f) % 1) - 1 + 0.6 * np.sin(2 * np.pi * f * t)
    s = np.tanh(lp(s, 900) * 2)
    env = np.minimum(1, t / 0.005) * np.exp(-t / 0.9); env[-min(n, 300):] *= np.linspace(1, 0, min(n, 300))
    return s * env * vol

# ---------- барабаны ----------
def kick(v=1.0):
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 48 + 130 * np.exp(-t / 0.03); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t / 0.22) + 0.4 * rng.uniform(-1, 1, n) * np.exp(-t / 0.003)
    return np.tanh(s * 1.6) * 0.9 * v

def snare(v=1.0):
    n = int(0.4 * SR); t = np.arange(n) / SR
    nz = bp(rng.uniform(-1, 1, n), 3200, 0.7) * np.exp(-t / 0.13)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.06) + 0.5 * np.sin(2 * np.pi * 330 * t) * np.exp(-t / 0.04)
    return np.tanh((nz * 1.9 + tone * 0.8) * 1.4) * 0.7 * v

def hat(v=1.0, open_=False):
    n = int((0.25 if open_ else 0.06) * SR); t = np.arange(n) / SR
    return hp(rng.uniform(-1, 1, n), 7500) * np.exp(-t / (0.09 if open_ else 0.018)) * 0.32 * v

def crash(v=1.0):
    n = int(2.6 * SR); t = np.arange(n) / SR
    s = hp(rng.uniform(-1, 1, n), 4200) * np.exp(-t / 0.9) + 0.3 * bp(rng.uniform(-1, 1, n), 9000, 1) * np.exp(-t / 0.3)
    return s * 0.42 * v

def tom(m, v=1.0):
    n = int(0.5 * SR); t = np.arange(n) / SR
    f = mf(m) * (1 + 0.5 * np.exp(-t / 0.04)); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(np.sin(ph) * np.exp(-t / 0.2) * 1.5) * 0.7 * v

def boom():  # кинематографичный удар интро
    n = int(3.0 * SR); t = np.arange(n) / SR
    f = 32 + 70 * np.exp(-t / 0.08); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t / 1.1) + lp(rng.uniform(-1, 1, n), 300) * np.exp(-t / 0.5) * 0.8
    return np.tanh(s * 1.3) * 0.9

def riser(dur):
    n = int(dur * SR); t = np.arange(n) / SR; x = t / dur
    nz = rng.uniform(-1, 1, n); out = np.zeros(n); seg = int(0.05 * SR)
    for i in range(0, n, seg):  # шум с поднимающимся фильтром
        fc = 300 + 9000 * (i / n) ** 2
        out[i:i + seg] = bp(nz[i:i + seg + 1], fc, 2.0)[:len(out[i:i + seg])]
    f = 100 + 900 * x ** 2; saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    return (out * 1.5 + lp(saw, 2500) * 0.25) * x ** 1.5 * 0.5

def impact():
    n = int(2.5 * SR); t = np.arange(n) / SR
    s = boom()[:n] + crash(1.0)[:n]
    return s

# ---------- лид ----------
def lead(m, dur, vol=0.22, bend=False):
    n = int(dur * SR); t = np.arange(n) / SR
    vib = 1 + 0.008 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.25)
    f = mf(m) * vib
    if bend: f = f * (2 ** ((-2 + 2 * np.minimum(1, t / 0.12)) / 12))
    ph = np.cumsum(f) / SR
    s = (2 * (ph % 1) - 1) + 0.5 * (2 * ((ph * 1.003) % 1) - 1)
    s = np.tanh(s * 3.5); s = cab(s)
    env = np.minimum(1, t / 0.01); env[-min(n, 600):] *= np.linspace(1, 0, min(n, 600))
    return s * env * vol

# ================== АРАНЖИРОВКА ==================
E, G2, A2, B2, C3, D3 = 40, 43, 45, 47, 48, 50
def bar_t(b): return b * BAR

# --- Интро: такты 0-3 — гул, удары, часы ---
drone_n = int(bar_t(8) * SR); tt = np.arange(drone_n) / SR
drone = (np.sin(2 * np.pi * mf(28) * tt) * 0.5 + lp(rng.uniform(-1, 1, drone_n), 180) * 1.5) * np.minimum(1, tt / 2.0)
drone *= np.where(tt < bar_t(8) - 0.3, 1, np.linspace(1, 0, drone_n)) * 0.35
add(drone, 0)
for b in range(4):
    add(boom(), bar_t(b), 0.9)
    for k in range(16):
        if b >= 1: add(hat(0.35 if k % 4 else 0.6), bar_t(b) + k * BEAT / 4, 0.7, 0.4)
add(gtr(E, BAR * 2, 'ring'), bar_t(2), 0.5, 0.2)            # дальний звенящий аккорд
add(gtr(E, BAR * 2, 'ring', 0.003), bar_t(2) + 0.01, 0.2, 0.5)

# --- Нарастание: такты 4-7 — глушёные восьмые, бочка, в конце дробь и райзер ---
for b in range(4, 8):
    for k in range(8):
        t = bar_t(b) + k * E8
        vol = 0.55 + 0.15 * (b - 4)
        if b == 7 and k >= 4: break
        gtr_both(E, t, E8 * 0.9, 'pm', vol)
        add(bass(E, E8 * 0.9, 0.35), t)
    for q in range(4):
        add(kick(0.9), bar_t(b) + q * BEAT)
    if b >= 6: add(snare(0.6), bar_t(b) + BEAT); add(snare(0.6), bar_t(b) + 3 * BEAT)
# дробь малого: ускоряющаяся
for k in range(16):
    add(snare(0.35 + 0.04 * k), bar_t(7) + BEAT * 2 + k * BEAT / 8)
add(riser(BAR * 2), bar_t(6), 0.8)

# --- Рифф ---
RIFF_A = [(0, E, 1, 'pm'), (1, E, 1, 'pm'), (2, G2, 2, 'ch'), (4, E, 1, 'pm'), (5, E, 1, 'pm'), (6, A2, 2, 'ch'),
          (8, E, 1, 'pm'), (9, E, 1, 'pm'), (10, B2, 1, 'ch'), (11, C3, 1, 'ch'), (12, D3, 2, 'ch'), (14, B2, 2, 'ch')]
RIFF_B = RIFF_A[:10] + [(10, G2, 1, 'ch'), (11, A2, 1, 'ch'), (12, C3, 2, 'ch'), (14, D3, 2, 'ch')]

def riff(b0, which, vol=1.0):
    for (k, m, ln, kind) in which:
        t = bar_t(b0) + k * E8
        gtr_both(m, t, ln * E8 * 0.95, kind, vol)
        add(bass(m, ln * E8 * 0.95, 0.45), t)

def beat_rock(b, fill=False, dbl=False):
    t0 = bar_t(b)
    kicks = [0, 1.5, 2, 3.5] if not dbl else [i * 0.5 for i in range(8)]
    for q in kicks: add(kick(1.0), t0 + q * BEAT)
    for q in (1, 3): add(snare(1.0), t0 + q * BEAT)
    for k in range(8): add(hat(0.8 if k % 2 == 0 else 0.5), t0 + k * E8, 0.45, 0.8)
    if fill:
        for i, m in enumerate([50, 50, 45, 45, 41, 41, 38, 38]):
            add(tom(m, 0.9), t0 + 2 * BEAT + i * BEAT / 4, 0.8 - i * 0.07, 0.3 + i * 0.07)

# Дроп: такты 8-23
add(impact(), bar_t(8), 1.0)
for b in range(8, 24, 2):
    riff(b, RIFF_A if (b // 2) % 2 == 0 else RIFF_B)
for b in range(8, 24):
    beat_rock(b, fill=(b % 4 == 3))
    if b % 4 == 0: add(crash(), bar_t(b), 0.8, 0.6)

# Брейк: такты 24-27 — звенящие аккорды, фидбэк, «сердцебиение», дробь томов
add(crash(1.2), bar_t(24))
gtr_both(E, bar_t(24), BAR * 2, 'ring', 1.0)
add(bass(E, BAR * 1.6, 0.5), bar_t(24))
fb_n = int(BAR * 4 * SR); ft = np.arange(fb_n) / SR
fb = np.tanh(np.sin(2 * np.pi * mf(76) * ft * (1 + 0.004 * np.sin(2 * np.pi * 5 * ft))) * 3) * np.minimum(1, ft / 2.5) * 0.12
add(cab(fb), bar_t(24) + 0.3, 0.5, 0.7)
add(boom(), bar_t(26), 0.9)
gtr_both(C3 - 12, bar_t(26), BAR * 2, 'ring', 0.9)
add(bass(C3 - 12, BAR * 1.6, 0.5), bar_t(26))
for q in range(8):
    add(kick(0.6 + 0.05 * q), bar_t(26) + q * BEAT)
for i, m in enumerate([52, 52, 50, 50, 47, 47, 45, 45, 43, 43, 40, 40, 38, 38, 36, 36]):
    add(tom(m, 0.6 + 0.025 * i), bar_t(27) + 2 * BEAT + i * BEAT / 8, 0.8 - i * 0.03, 0.3 + i * 0.03)
add(riser(BAR * 2), bar_t(26), 0.7)

# Второй взрыв: такты 28-43 — рифф, двойная бочка, лид
add(impact(), bar_t(28), 1.0)
for b in range(28, 42, 2):
    riff(b, RIFF_A if (b // 2) % 2 == 0 else RIFF_B, 0.95)
for b in range(28, 44):
    beat_rock(b, fill=(b % 4 == 3), dbl=(b >= 32))
    if b % 2 == 0: add(crash(0.8), bar_t(b), 0.7, 0.8)
# мелодия (в четвертях): героическая фраза в ми-миноре
PHR = [(76, 2), (74, 1), (71, 1), (69, 2), (71, 1), (67, 1), (64, 1), (67, 1), (69, 1), (71, 1), (74, 4)]
PHR2 = [(76, 2), (79, 1), (78, 1), (76, 2), (74, 1), (71, 1), (69, 1), (71, 1), (74, 1), (76, 1), (76, 4)]
def melody(b0, phr, oct_=0):
    t = bar_t(b0)
    for m, q in phr:
        add(lead(m + oct_, q * BEAT * 0.97, bend=(q >= 2)), t, 0.6, 0.6); t += q * BEAT
melody(32, PHR); melody(36, PHR2); melody(40, PHR2[:6])
# такты 42-43 — подъём: аккорды на каждую восьмую
for b in (42, 43):
    for k in range(8):
        m = [E, E, G2, G2, A2, A2, B2, B2][k] if b == 42 else [C3, C3, D3, D3, E + 12, E + 12, E + 12, E + 12][k]
        gtr_both(m, bar_t(b) + k * E8, E8 * 0.9, 'ch', 0.95)
        add(bass(m, E8 * 0.9, 0.45), bar_t(b) + k * E8)

# Финал: такт 44 — три удара под логотип; 45 и 49 — большие удары со звенящим аккордом
for h in [0, 1.5, 3]:
    t = bar_t(44) + h * BEAT
    gtr_both(E, t, BEAT * 1.2, 'ch', 1.0); add(kick(1.2), t); add(snare(1.0), t); add(crash(0.9), t)
    add(bass(E, BEAT * 1.2, 0.5), t)
for b0 in (45, 49):
    add(impact(), bar_t(b0), 1.1)
    gtr_both(E, bar_t(b0), 7.0, 'ring', 1.0)
    add(bass(E, 4.0, 0.5), bar_t(b0))
add(lead(88, 5.5, 0.12), bar_t(45) + 0.4, 0.5, 0.6)
add(lead(91, 5.5, 0.10), bar_t(49) + 0.4, 0.6, 0.5)

# ---------- мастер ----------
def reverb(x, sec=1.6, mix=0.18):
    n = int(sec * SR); t = np.arange(n) / SR
    ir = rng.uniform(-1, 1, n) * np.exp(-t / (sec / 5)); ir = lp(ir, 5000); ir /= np.sqrt(np.sum(ir ** 2))
    m = 1 << (len(x) + n).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[:len(x)]
    return x + y * mix

L = reverb(L); R = reverb(R)
st = np.stack([L, R])
st = hp(st[0], 30), hp(st[1], 30)
st = np.stack(st)
st /= np.max(np.abs(st)) + 1e-9
st = np.tanh(st * 1.6) / np.tanh(1.6)          # мягкий лимитер
fade = int(1.5 * SR); st[:, -fade:] *= np.linspace(1, 0, fade)
st *= 0.93
pcm = (st.T * 32767).astype(np.int16)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'music.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', out, TOTAL)
