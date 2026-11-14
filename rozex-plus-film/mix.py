"""Sound for «Rozex Plus» (20 s): no voice. Pencil-on-paper foley from the page's marks + a small acoustic score.

Cue map (TREATMENT §7): 96 bpm, bar = 2.5 s, A major.
  bar 1 (0–2.5)      near-silence: pencil only; one muted guitar harmonic at 2.1 (the coral underline)
  bar 2 (2.5–5)      guitar pattern enters on the pan; double bass on beats 1 and 3
  bars 3–5 (5–12.5)  + soft shaker; kalimba accents 6.25 / 8.125 / 10.0 / 11.875, each on its arrow
  13.0–13.6          drop out: room and pencil only
  13.6               reveal: full chord + kalimba on the pinch-out to the whole page
  13.6–20            warm loop, lighter; last kalimba note on the coral tick (18.9); rings out to 20.0
Foley (TREATMENT §8) is driven by events.json: pencil, construction, lettering, colouring, lead taps, sheet slides
(gestures), the bacteria «shatter» skitter, the eraser rub on the oil plug. Music sits ~4 dB under the foley in the
busy middle. Run:  <LIB>/.venv/bin/python mix.py   (build.sh does)
"""
import json, os, sys
import numpy as np, soundfile as sf
LIB = os.environ.get('LIB') or '/root/lemo-opuscar'
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'events.json')))
DUR = float(D['dur']); EV = D['ev']; N = int(round(DUR * SR)); FULL = 20.0
tt = np.arange(N) / SR
rng = np.random.default_rng(14)


# ---------------- pencil foley (as in the style: band noise × paper tooth × the hand's rhythm) ----------------
def activity(kinds):
    a = np.zeros(N); pw = np.zeros(N)
    for e in EV:
        if e['type'] not in kinds: continue
        i0 = int(e['t'] * SR); i1 = min(N, int((e['t'] + max(e['d'], 0.035)) * SR))
        if i1 <= i0: continue
        n = i1 - i0; env = np.ones(n); r = min(n // 3, int(0.01 * SR))
        if r > 0: env[:r] = np.linspace(0, 1, r); env[-r:] = np.linspace(1, 0, r)
        a[i0:i1] += env; pw[i0:i1] += env * e.get('pan', 0)
    pan = np.where(a > 1e-6, pw / np.maximum(a, 1e-6), 0)
    k = int(0.015 * SR); ker = np.ones(k) / k
    return np.convolve(1 - np.exp(-a * 1.1), ker, 'same'), np.convolve(pan, ker, 'same')


def tooth_noise(lo, hi, grain_hz, depth, seed):
    r = np.random.default_rng(seed)
    x = bp(r.standard_normal(N), lo, hi, 2)
    g = lp(np.abs(r.standard_normal(N)), grain_hz, 1); g = g / (np.percentile(g, 95) + 1e-9)
    return x * ((1 - depth) + depth * np.clip(g, 0, 2.5))


def hand(rate, seed, sharp=1.0):
    r = np.random.default_rng(seed)
    ph = np.cumsum(rate * (1 + 2.5 * lp(r.standard_normal(N), 3, 1)) / SR) * 2 * np.pi
    return (0.5 + 0.5 * np.abs(np.sin(ph))) ** sharp


def pan_st(x, pan):
    th = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)], 1)


fol = np.zeros((N, 2))
lv, pn = activity(['pencil']); fol += pan_st(tooth_noise(700, 4200, 380, 0.9, 1) * hand(5, 2) * lv, pn * 0.5) * 0.28
lv, pn = activity(['light']); fol += pan_st(tooth_noise(1400, 5200, 500, 0.9, 3) * hand(7, 4) * lv, pn * 0.5) * 0.11
lv, pn = activity(['write']); fol += pan_st(tooth_noise(900, 4800, 450, 0.92, 5) * hand(10, 6, 1.6) * lv, pn * 0.5) * 0.27
lv, pn = activity(['color']); fol += pan_st(tooth_noise(320, 2600, 220, 0.75, 7) * hand(13, 8, 2.0) * lv, pn * 0.5) * 0.23
lv, pn = activity(['erase']); fol += pan_st(tooth_noise(250, 3000, 160, 0.7, 9) * hand(17, 10, 1.4) * lv, pn * 0.5) * 0.30
for e in EV:
    t, d, p = e['t'], e['d'], e.get('pan', 0)
    if e['type'] == 'tap':
        add(fol, hp(click(pitch=0.7 + rng.random() * 0.25, v=1.0), 1800) * 0.035, t, 1.0, p * 0.5)
    elif e['type'] == 'gesture':   # the sheet sliding under two fingers
        n = int(d * SR); x = lp(hp(rng.standard_normal(n), 150), 1300, 2)
        env = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
        i0 = int(t * SR); i1 = min(N, i0 + n); fol[i0:i1] += (np.stack([x * env, np.roll(x, 211) * env], 1) * 0.05)[:i1 - i0]
    elif e['type'] == 'shatter':   # a tiny paper skitter as the chips fly off the page
        for k in range(110):
            tk = t + rng.uniform(0, d) ** 1.4 * d ** -0.4
            g = hp(rng.standard_normal(int(0.004 * SR)), 2600) * np.exp(-np.arange(int(0.004 * SR)) / (0.0011 * SR))
            add(fol, g * 0.06 * rng.uniform(0.3, 1), tk, 1.0, float(np.clip(-0.1 - (tk - t) / d * 0.8 + rng.normal(0, 0.2), -1, 1)))
room = lp(rng.standard_normal(N), 420, 2) * 0.003
fol += np.stack([room, np.roll(room, 1013)], 1)

# ---------------- score ----------------
BEAT = 60 / 96; BAR = 4 * BEAT
CH = {'Amaj7': ([57, 61, 64, 68], 33, 40), 'F#m7': ([54, 57, 61, 64], 42, 49), 'Dmaj7': ([50, 57, 61, 66], 38, 45),
      'E7sus': ([52, 57, 59, 62], 40, 47), 'Amaj9': ([57, 61, 64, 71], 33, 40), 'Bm7': ([50, 54, 57, 62], 35, 42)}
CHART = ['Amaj7', 'Amaj7', 'F#m7', 'Dmaj7', 'E7sus', 'Amaj9', 'F#m7', 'Dmaj7', 'Amaj9']   # bar k starts at k × 2.5 s
QUIET = (13.0, 13.6)
quiet = lambda t: QUIET[0] <= t < QUIET[1]
ev = []
gpat = [[1, 3, 4, 6], [1, 3, 5, 6]]   # eighth-note slots of a light bossa comp
for b, name in enumerate(CHART):
    t0 = b * BAR
    if t0 >= FULL: break
    vo, root, fifth = CH[name]
    if b == 0: continue                       # bar 1: near-silence
    light = b >= 6                            # after the reveal: lighter
    for beat, pch in ((0, root), (2, fifth)):
        t = t0 + beat * BEAT
        if quiet(t) or abs(t - 13.6) < 0.3 or t > 18.5: continue
        ev.append((t, 'jazz_bass', pch, BEAT * 1.6, 0.55 if light else 0.62, -0.05, 0.95))
    for k in gpat[b % 2]:
        t = t0 + k / 2 * BEAT
        if quiet(t) or abs(t - 13.6) < 0.3 or t > 18.6 or (light and k == 3): continue
        for j, pch in enumerate(vo):
            ev.append((t + j * 0.011, 'guitar_nylon', pch, 0.32, (0.28 if light else 0.33) + 0.05 * (k % 2), -0.18 + j * 0.06, 0.62))
# the muted harmonic on the coral underline (2.1 s)
ev.append((2.10, 'guitar_nylon', 76, 0.6, 0.22, 0.25, 0.6))
# shaker: bars 3–5, then lighter after the reveal
for i in range(int(FULL / (BEAT / 2))):
    t = i * BEAT / 2
    if t < 2 * BAR or quiet(t) or 12.9 < t < 14.2 or t > 18.4: continue
    ev.append((t, 'world_perc', 'egg_shaker_soft', 0.2, (0.16 if t > 14 else 0.2) + 0.08 * (i % 2), 0.3, 0.45))
# kalimba: one accent per active, landing on its arrow; the reveal; the coral tick
for t, pch, v in [(6.25, 69, 0.5), (8.125, 71, 0.5), (10.0, 73, 0.52), (11.875, 68, 0.5),
                  (13.6, 64, 0.5), (13.62, 69, 0.46), (13.64, 73, 0.42), (18.9, 73, 0.5), (18.92, 69, 0.36)]:
    ev.append((t, 'kalimba', pch, 2.0, v, 0.2, 0.6))
# the reveal: the first sound after the silence, a full soft chord
for j, pch in enumerate([45, 52, 57, 61, 64, 68, 71]):
    ev.append((13.6 + j * 0.03, 'guitar_nylon', pch, 2.4, 0.46, -0.25 + j * 0.08, 0.7))
ev.append((13.6, 'jazz_bass', 33, 2.0, 0.66, 0, 1.0))
# the last chord under the tick, left to ring
for j, pch in enumerate([45, 52, 57, 61, 64, 71]):
    ev.append((18.9 + j * 0.035, 'guitar_nylon', pch, 2.0, 0.34, -0.2 + j * 0.08, 0.7))
S.seed(11)
music = S.render(ev, dur=FULL + 2.0, master=False)
music = S.room(music, size=0.3, mix=0.16)[:N]
if len(music) < N: music = np.vstack([music, np.zeros((N - len(music), 2))])
music *= np.clip((FULL + 0.15 - tt) / 0.9, 0, 1)[:, None] ** 1.2    # rings out to 20.0

# ---------------- balance: music ~4 dB under the pencil foley in the busy middle (5–12.5 s) ----------------
rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12)
w = (tt >= 5.0) & (tt < 12.5)
fol_r, mus_r = rms(fol[w].mean(1)), rms(music[w].mean(1))
music *= 10 ** (-4 / 20) * fol_r / mus_r
mix = music + fol
mix = np.stack([compress(mix[:, c], thr=0.35, ratio=2.2) for c in (0, 1)], 1)
mix = np.stack([limit(mix[:, c]) for c in (0, 1)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
db = lambda x: 20 * np.log10(rms(x))
print('mix', mix.shape, 'peak', round(float(np.abs(mix).max()), 3),
      '| music vs foley 5–12.5 s dB', round(db(music[w].mean(1)) - db(fol[w].mean(1)), 1),
      '| silence 13.0–13.6 music dB', round(db(music[(tt >= 13.05) & (tt < 13.55)].mean(1)), 1))
cr = S.credits(['guitar_nylon', 'jazz_bass', 'world_perc', 'kalimba'])
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
