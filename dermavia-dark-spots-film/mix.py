"""Sound for «Dermavia · Dark Spots» (26 s): no voice. Reads events.json (node core/render/events.mjs), writes out/mix.wav
(48 kHz stereo, exactly the film length, about -16 LUFS before the master).

Cue map (TREATMENT §6): 84 bpm in 3/4, beat 0.714 s, A minor to A major.
  0–4.3      harp on two notes, pizzicato bass on each downbeat; the ❌ seal on the downbeat of bar 2
  4.3–8.1    + bowed vibraphone with the sunrise
  8.1–13.6   low strings swell in steps, one step on each pulse of sun (9.5, 10.7)
  13.6–14.0  silence
  14.0       one timpani stroke; then harp, a glockenspiel note on every tile cut
  21.15–26   small ensemble with low horn, resolving to A major on the D seal (24.0); strings ring out under the peel
Foley (TREATMENT §7) from the picture's events: the knife through paper, the seal's thump, a door and steps on the roof,
morning birds, steam, ink spreading on each pulse, the bottle set down, a tap drip, the window whoosh, the paper tear.
Run:  <LIB>/.venv/bin/python mix.py   (build.sh does)
"""
import json, os, sys
import numpy as np, soundfile as sf
LIB = os.environ.get('LIB') or '/root/lemo-opuscar'
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio import sfx as X
from core.audio.sfx import SR, bp, lp, hp, add, limit, noise, env_exp, t_, norm, thump, step, whoosh, creak, brown

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'events.json')))
DUR = float(D['dur']); EV = D['ev']; N = int(round(DUR * SR))
tt = np.arange(N) / SR
X._rng = np.random.default_rng(26); S.seed(26); R = np.random.default_rng(84)
ev = lambda ty: [e for e in EV if e['type'] == ty]
one = lambda ty: ev(ty)[0]['t']
B = 60 / 84
def env(a, b, fi=.3, fo=.3): return np.clip((tt - a) / max(fi, 1e-3), 0, 1) * np.clip((b - tt) / max(fo, 1e-3), 0, 1)
def st(x, pan=0.): l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); return np.stack([x * l, x * r], 1)
def fit(x): y = np.zeros(N); y[:min(N, len(x))] = x[:N]; return y

T_SKIN, T_STOP, T_TIMP, T_BATH, T_DAY, T_SEAL, T_PEEL = one('skin'), one('silence'), one('timpani'), one('bath'), one('day'), [e['t'] for e in ev('seal') if e.get('big')][0], one('peel')
T_SEALX = [e['t'] for e in ev('seal') if not e.get('big')][0]

# ================================================================== music
sc = []
n = lambda t, i, p, d, v, pan=0, g=1: sc.append((t, i, p, d, v, pan, g))
# night: harp on two notes, pizz bass on the downbeats
for k in range(6):
    t = k * B; n(t, 'harp', ['A4', 'E5', 'C5'][k % 3], 1.4, .5, -.2)
for bar in range(4):
    t = bar * 3 * B
    if t < T_SKIN: n(t, 'contrabass_pizz', 'A1' if bar % 2 == 0 else 'E1', 1.5, .75, .1)
for k in range(6, 11):
    n(k * B, 'harp', ['A4', 'E5', 'F5', 'E5', 'C5'][k - 6], 1.3, .42, -.2)
# dawn: bowed vibraphone over the sunrise
n(3 * 3 * B * 0 + 4.3, 'vibraphone_bowed', 'E4', 3.6, .55, .3); n(4.3, 'vibraphone_bowed', 'A4', 3.6, .45, -.3)
n(6.3, 'vibraphone_bowed', 'F4', 2.0, .55, .3); n(6.3, 'vibraphone_bowed', 'C5', 2.0, .45, -.3)
n(T_SEALX, 'contrabass_pizz', 'A1', 1.5, .95, .0)
# skin: low strings in steps, one step on each pulse; cut dead at the silence
for (a, notes, v) in [(T_SKIN, ['A2', 'E3'], .45), (9.5, ['Bb2', 'F3'], .6), (10.7, ['B2', 'F#3', 'D4'], .75)]:
    end = {T_SKIN: 9.5, 9.5: 10.7, 10.7: T_STOP}[a]
    for p in notes: n(a, 'cellos', p, end - a + .05, v, .2 if p[-1] == '3' else -.2)
    n(a, 'contrabass', notes[0][:-1] + '1' if notes[0][0] != 'B' else 'B1', end - a + .05, v * .9, 0)
# the timpani stroke after the silence
n(T_TIMP, 'timpani', 'A2', 3.0, 1.0, 0, 2.4)
# shelf: harp, lighter, and a glockenspiel note on each tile
for k in range(int((T_DAY - (T_TIMP + B)) / B)):
    t = T_TIMP + B + k * B
    n(t, 'harp', ['A3', 'E4', 'A4', 'C#5', 'E4', 'A4'][k % 6], 1.2, .38, -.25)
tiles = sorted({round(e['t'], 2) for e in ev('knife') if 15.3 < e['t'] < 18.9})
for i, t in enumerate([15.43, 16.14, 16.86, 17.57, 18.29]):
    n(t, 'glockenspiel', ['E6', 'A6', 'C#7', 'E7', 'A6'][i], 1.6, .5, .3)
# return: horn, strings, harp; A major on the seal; rings out under the peel
n(T_DAY + .1, 'horn', 'E3', 1.8, .55, -.1); n(T_DAY + 1.95, 'horn', 'A3', 1.3, .6, -.1); n(T_DAY + 3.3, 'horn', 'C#4', 1.2, .6, -.1)
for p in ['A2', 'E3']: n(T_DAY + .05, 'cellos', p, T_SEAL - T_DAY, .45, .2)
n(T_DAY + .05, 'contrabass', 'A1', T_SEAL - T_DAY, .45, 0)
for k in range(4): n(T_DAY + .3 + k * B, 'harp', ['A4', 'C#5', 'E5', 'A5'][k], 1.4, .45, -.3)
for p, pan in [('A2', -.1), ('E3', .2), ('A3', -.2), ('C#4', .25)]: n(T_SEAL, 'cellos', p, DUR - T_SEAL, .65, pan)
n(T_SEAL, 'contrabass', 'A1', DUR - T_SEAL, .65, 0); n(T_SEAL, 'horn', 'E4', DUR - T_SEAL - .2, .6, -.1)
n(T_SEAL, 'timpani', 'A2', 2.0, .8, 0, 1.1); n(T_SEAL, 'harp', 'A5', 2.5, .55, .3); n(T_SEAL + .02, 'glockenspiel', 'A6', 2.5, .4, .3)

mus = S.render([(t, i, p, d, v, pan, g) for t, i, p, d, v, pan, g in sc], dur=DUR, master=False)[:N]
mus = np.pad(mus, ((0, max(0, N - len(mus))), (0, 0)))[:N]
mus = S.room(mus, size=.42, mix=.16)
# the silence: everything stops before the timpani (a 30 ms fade so it doesn't click)
gate = np.ones(N); a, b = int(T_STOP * SR), int((T_TIMP - .005) * SR); gate[a:b] = 0; gate[a - 1440:a] = np.linspace(1, 0, 1440)
mus *= gate[:, None]

# ================================================================== the world
amb = np.zeros((N, 2)); fx = np.zeros((N, 2))
w = noise(DUR + .1)[:N]
amb += st(hp(lp(w, 2400), 700) * .03 * env(0, 4.5, .4, 1.2))                         # night wind
amb += st(bp(np.roll(w, 7000), 150, 1200) * .05 * env(3.6, T_SKIN, 1.2, .2))          # the city waking
amb += st(lp(brown(DUR + .1)[:N], 140) * .25 * env(T_SKIN, T_STOP, .3, .05))           # skin: low air
amb += st(np.sin(2 * np.pi * 96 * tt) * .02 * env(T_SKIN, T_STOP, .6, .05))           #       and a soft heat hum
amb += st(bp(np.roll(w, 3000), 300, 3000) * .012 * env(T_BATH, T_DAY, .3, .2))         # bathroom room tone
amb += st(bp(np.roll(w, 13000), 200, 2400) * .05 * env(T_DAY, DUR, .4, .8))            # the city by day
# morning birds: short synthesised chirps scattered over the dawn
for t in np.arange(4.6, 8.0, .23):
    if R.random() < .55:
        d = .06 + R.random() * .08; s = t_(d); f0 = 2800 + R.random() * 1800
        x = np.sin(2 * np.pi * np.cumsum(f0 * (1 + .4 * np.sin(np.pi * s / d) * (R.random() - .3))) / SR) * np.sin(np.pi * s / d) ** 2
        add(amb, x * .05, t, 1, R.uniform(-.8, .8))
# a tap drip in the bathroom
for t in np.arange(T_BATH + .6, T_DAY, 1.37):
    d = .08; s = t_(d); add(amb, np.sin(2 * np.pi * (900 + 600 * s / d) * s) * env_exp(d, .015) * .12, t, 1, .4)
amb *= gate[:, None] * 1 + (1 - gate[:, None]) * 0

# ================================================================== the print (loudest) and the foley
def knife(v=1.):
    d = .07 + R.random() * .05; s = t_(d)
    x = bp(noise(d), 2200, 7000) * (np.minimum(1, s / .004)) * np.exp(-s / (d * .5))
    x += bp(noise(d), 600, 1600) * np.exp(-s / .01) * .4
    return norm(x) * v
def seal(big):
    d = .5; s = t_(d)
    x = np.sin(2 * np.pi * (58 if big else 70) * s * (1 - .25 * s)) * env_exp(d, .09) * 1.0 + lp(noise(d), 500) * env_exp(d, .025) * .8
    x += hp(noise(d), 2000) * env_exp(d, .004) * .5
    return norm(x) * (1. if big else .8)
def ink_spread():
    d = 1.0; s = t_(d)
    x = lp(noise(d), 700) * np.sin(np.pi * np.minimum(1, s / .9)) ** 2 * .6
    for k in range(10):
        dd = .04; ss_ = t_(dd); b = np.sin(2 * np.pi * (180 + R.random() * 220) * ss_ * (1 + ss_ * 8)) * env_exp(dd, .012)
        i = int((.05 + R.random() * .7) * SR); x[i:i + len(b)] += b[:max(0, min(len(b), len(x) - i))] * .5
    return norm(x)
def tear():
    d = .55; s = t_(d); x = bp(noise(d), 900, 6000)
    crack = (X._rng.random(len(s)) > .985) * 1.0; x = x * (.35 + lp(crack, 300) * 6) * np.sin(np.pi * s / d) ** .5
    return norm(x)
for e in EV:
    t, ty, pan = e['t'], e['type'], e.get('pan', 0)
    if ty == 'knife': add(fx, knife(.5 + R.random() * .2), t, .55, pan)
    elif ty == 'seal': add(fx, seal(e.get('big')), t, 1.0 if e.get('big') else .85, -.2)
    elif ty == 'door': add(fx, creak(.5), t, .5, -.4); add(fx, thump(.4, 110), t + .32, .35, -.4)
    elif ty == 'step': add(fx, lp(step(.6), 3000) + lp(noise(.05), 600) * env_exp(.05, .01), t, .25, pan)
    elif ty == 'ray': add(fx, np.sin(2 * np.pi * 1320 * t_(1.0)) * np.sin(np.pi * t_(1.0)) ** 2 * .05, t, 1, .2)
    elif ty == 'steam': add(fx, whoosh(.6, 1), t, .45, 0)
    elif ty == 'pulse': add(fx, ink_spread(), t, .55, 0)
    elif ty == 'arch': add(fx, lp(whoosh(.5, 1), 900), t, .4, 0)
    elif ty == 'bottle': add(fx, X.clack(.55, 1) * .6, t, .45, -.2); add(fx, lp(thump(.4, 140), 600), t, .45, -.2)
    elif ty == 'window': add(fx, whoosh(.5, 1), t, .45, 0)
    elif ty == 'peel': add(fx, tear(), t, .7, -.3)

# ================================================================== mix: music under the world, the print loudest
mix = mus * .55 + amb * 1.0 + fx * 1.0
mix = np.stack([limit(mix[:, 0], .89), limit(mix[:, 1], .89)], 1)
# measure and set to about -16 LUFS (simple K-weighted estimate is left to ffmpeg's master; here RMS-normalise)
rms = np.sqrt(np.mean(mix ** 2)); mix *= (10 ** (-19 / 20)) / max(rms, 1e-9)
mix = np.stack([limit(mix[:, 0], .89), limit(mix[:, 1], .89)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
print('mix.wav', f'{len(mix) / SR:.2f}s', 'peak', f'{np.abs(mix).max():.3f}')
print('\n'.join(S.credits(sorted({i for _, i, *_ in sc}))))
