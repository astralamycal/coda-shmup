# Generates original sound effects and music with numpy (no third-party recordings)
import sys, wave
import numpy as np
OUT = sys.argv[1]
SR = 44100
def t(d): return np.arange(int(SR * d)) / SR
def saw(f, tt): return 2 * ((tt * f) % 1) - 1
def square(f, tt): return np.sign(np.sin(2 * np.pi * f * tt))
def env(n, attack=0.01, release=0.05):
    e = np.ones(n); a = int(SR * attack); r = int(SR * release)
    e[:a] = np.linspace(0, 1, a); e[-r:] = np.linspace(1, 0, r); return e
def lowpass(x, alpha):
    y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x): acc += alpha * (v - acc); y[i] = acc
    return y
def save(name, x, gain=0.8):
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    with wave.open(f'{OUT}/{name}.wav', 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
tt = t(0.6); noise = np.random.default_rng(1).uniform(-1, 1, len(tt))
boom = lowpass(noise, 0.15) * np.exp(-tt * 7) + 0.8 * np.sin(2 * np.pi * (70 - 40 * tt) * tt) * np.exp(-tt * 9)
save('sfx_explosion', boom)
tt = t(0.09); save('sfx_pickup', square(880 + 4000 * tt, tt) * env(len(tt), 0.002, 0.03), 0.5)
notes = [523, 659, 784, 1046]
save('sfx_levelup', np.concatenate([square(f, t(0.09)) * env(len(t(0.09)), 0.003, 0.03) for f in notes]), 0.5)
# Music: a 16 s synthwave loop, 120 BPM, A minor - F - C - G
beat = 0.5; bar = 4 * beat
roots = [110.0, 87.31, 130.81, 98.0]
music = np.zeros(int(SR * bar * 8))
for b in range(8):
    root = roots[b % 4]; start = int(SR * bar * b)
    for i in range(8):  # bass eighth notes, octave jumps
        f = root * (2 if i % 2 else 1); tt = t(beat / 2)
        note = lowpass(saw(f, tt), 0.25) * env(len(tt), 0.005, 0.05) * 0.5
        s = start + int(SR * beat / 2 * i); music[s:s + len(note)] += note
    for i in range(4):  # kick on every beat, noise snare on 2 and 4
        tt = t(0.25); s = start + int(SR * beat * i)
        kick = np.sin(2 * np.pi * (45 + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 12)
        music[s:s + len(kick)] += 0.9 * kick
        if i % 2:
            sn = np.random.default_rng(b * 10 + i).uniform(-1, 1, len(tt)) * np.exp(-tt * 20) * 0.35
            music[s:s + len(sn)] += sn
    tt = t(bar)  # soft pad: the chord, two octaves up
    pad = sum(np.sin(2 * np.pi * root * 2 * m * tt) for m in (1, 1.2, 1.5)) * 0.08 * env(len(tt), 0.3, 0.3)
    music[start:start + len(pad)] += pad
save('music', music, 0.6)
print('sounds ok')
