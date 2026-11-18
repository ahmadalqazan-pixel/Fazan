"""Sound for «Dermavia · Dark Spots» (26 s): no voice. Reads events.json (node core/render/events.mjs), writes out/mix.wav
(48 kHz stereo, exactly the film length, about -16 LUFS before the master).

Cue map: 96 bpm in 3/4 (beat 0.625 s, bar 1.875 s), A minor to A major.
  0           a low string stab with the first knife: the hook starts at once
  0–6.6       harp ostinato on every beat, pizzicato bass on each downbeat; the ❌ seal on the downbeat of bar 2;
              bowed vibraphone with the sunrise (1.9), a three-note horn call as the hook leaves (3.75)
  6.6–11.55   into her cheek: low strings hold and climb a step on each pulse of sun (7.9, 9.0), the harp thins out
  11.55–11.9  silence
  11.9        timpani; the low strings bloom into A major as the ink is carved open on the pack
  12.5–18.35  the pack: harp and pizzicato in A major, a glockenspiel note on every ingredient cut
  18.35–26    the rise into the sky: horn melody over strings, the D seal with timpani, ringing out under the peel
Foley from the picture's events: knife through paper, seals, dawn birds, the sun's shimmer, ink spreading, the dive into ink,
the carving, the pack set down, the tear of the peeled sheet. The print sounds are the loudest events; music sits under them.
Run:  <LIB>/.venv/bin/python mix.py   (build.sh does)
"""
import json, os, sys
import numpy as np, soundfile as sf
LIB = os.environ.get('LIB') or '/root/lemo-opuscar'
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio import sfx as X
from core.audio.sfx import SR, bp, lp, hp, add, limit, noise, env_exp, t_, norm, thump, whoosh, brown

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'events.json')))
DUR = float(D['dur']); EV = D['ev']; N = int(round(DUR * SR))
tt = np.arange(N) / SR
X._rng = np.random.default_rng(26); S.seed(26); R = np.random.default_rng(96)
ev = lambda ty: [e for e in EV if e['type'] == ty]
one = lambda ty: ev(ty)[0]['t']
B = 60 / 96; BAR = 3 * B
def env(a, b, fi=.3, fo=.3): return np.clip((tt - a) / max(fi, 1e-3), 0, 1) * np.clip((b - tt) / max(fo, 1e-3), 0, 1)
def st(x, pan=0.): l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); return np.stack([x * l, x * r], 1)

T_PUSH = one('push'); T_P1, T_P2 = [e['t'] for e in ev('pulse')]
T_SIL, T_TIMP, T_CARVE, T_PACK, T_TILT, T_PEEL = one('silence'), one('timpani'), one('carve'), one('pack'), one('tilt'), one('peel')
T_SEALX = [e['t'] for e in ev('seal') if not e.get('big')][0]; T_SEALD = [e['t'] for e in ev('seal') if e.get('big')][0]
T_SUN = one('sunrise')

sc = []
n = lambda t, i, p, d, v, pan=0, g=1: sc.append((t, i, p, d, v, pan, g))
# ---- 0–6.6: the hook and the dawn
n(0, 'cellos', 'A2', .9, .8, -.2, 1.2); n(0, 'contrabass', 'A1', .9, .8, 0, 1.2); n(0, 'timpani', 'A2', 1.2, .6, 0, .9)
arp = ['A4', 'C5', 'E5', 'A4', 'C5', 'F5', 'A4', 'C5', 'E5', 'G4', 'B4', 'E5']
k, t = 0, 0.0
while t < T_PUSH - .05:
    n(t, 'harp', arp[k % len(arp)], 1.2, .48 + (.08 if k % 3 == 0 else 0), -.25); k += 1; t += B
for bar in range(int(T_PUSH / BAR) + 1):
    t = bar * BAR
    if t < T_PUSH: n(t, 'contrabass_pizz', ['A1', 'A1', 'F1', 'E1'][bar % 4], 1.4, .8, .1)
n(T_SEALX, 'timpani', 'A2', 1.0, .7, 0, 1.0)
n(T_SUN, 'vibraphone_bowed', 'E4', T_PUSH - T_SUN + .6, .5, .35); n(T_SUN + .02, 'vibraphone_bowed', 'A4', T_PUSH - T_SUN + .6, .42, -.35)
n(3.75, 'horn', 'E3', .55, .55, -.1); n(4.375, 'horn', 'A3', .55, .6, -.1); n(5.0, 'horn', 'C4', 1.4, .62, -.1)
# ---- 6.6–11.55: into the cheek, strings climbing a step at each pulse; harp thins to the downbeats
for (a, b_, notes, v) in [(T_PUSH, T_P1, ['A2', 'E3'], .45), (T_P1, T_P2, ['Bb2', 'F3', 'D4'], .62), (T_P2, T_SIL, ['B2', 'F#3', 'D4', 'G#4'], .78)]:
    for p in notes: n(a, 'cellos' if p[-1] in '23' else 'violins', p, b_ - a + .05, v, .25 if p.endswith('3') else -.2)
    n(a, 'contrabass', {'A2': 'A1', 'Bb2': 'Bb1', 'B2': 'B1'}[notes[0]], b_ - a + .05, v * .9, 0)
for t in np.arange(T_PUSH, T_SIL - .3, BAR): n(t, 'harp', 'A3', 1.5, .4, -.3)
n(T_P1, 'timpani', 'A2', 1.2, .75, 0, 1.0); n(T_P2, 'timpani', 'A2', 1.2, .85, 0, 1.1)
# ---- 11.9: the stroke after the silence, blooming into A major
n(T_TIMP, 'timpani', 'A2', 3.0, 1.0, 0, 2.2)
for p, pan in [('A2', -.2), ('E3', .2), ('A3', -.1), ('C#4', .25)]: n(T_TIMP + .02, 'cellos', p, T_PACK + 1.2 - T_TIMP, .55, pan)
n(T_TIMP + .02, 'contrabass', 'A1', T_PACK + 1.2 - T_TIMP, .6, 0)
# ---- 12.5–18.35: the pack, light and bright
arp2 = ['A4', 'C#5', 'E5', 'A5', 'E5', 'C#5', 'D5', 'F#5', 'A5', 'E5', 'G#5', 'B5']
for k, t in enumerate(np.arange(T_CARVE + .6, T_TILT - .05, B)): n(t, 'harp', arp2[k % len(arp2)], 1.1, .45, -.25)
for i, t in enumerate(np.arange(T_CARVE + .6, T_TILT, BAR)): n(t, 'contrabass_pizz', ['A1', 'A1', 'D2', 'E1'][i % 4], 1.3, .75, .1)
for i, t in enumerate([13.125, 13.75, 14.375, 15.0, 15.625]): n(t, 'glockenspiel', ['E6', 'A6', 'C#7', 'E7', 'A6'][i], 1.8, .55, .3)
# ---- 18.35–26: up into the sky; horn melody over strings, the seal, ringing out
for i, p in enumerate(['A3', 'C#4', 'E4', 'A4', 'C#5', 'E5', 'A5']): n(T_TILT + i * .08, 'harp', p, 1.0, .45, -.3)
for p, pan in [('A2', -.2), ('E3', .2), ('C#4', .25)]: n(T_TILT + .6, 'cellos', p, T_SEALD - T_TILT - .6, .5, pan)
n(T_TILT + .6, 'contrabass', 'A1', T_SEALD - T_TILT - .6, .5, 0)
for t, p, d in [(T_TILT + .6, 'E3', .55), (T_TILT + 1.25, 'A3', .55), (T_TILT + 1.85, 'C#4', 1.2), (T_TILT + 3.1, 'B3', .55), (T_TILT + 3.7, 'A3', .55)]: n(t, 'horn', p, d, .62, -.1)
for k, t in enumerate(np.arange(T_TILT + .6, T_SEALD - .05, B)): n(t, 'harp', ['A4', 'C#5', 'E5'][k % 3], 1.0, .38, -.3)
for p, pan in [('A2', -.1), ('E3', .2), ('A3', -.2), ('C#4', .25), ('E4', -.25)]: n(T_SEALD, 'cellos' if p[-1] in '23' else 'violins', p, DUR - T_SEALD, .66, pan)
n(T_SEALD, 'contrabass', 'A1', DUR - T_SEALD, .66, 0); n(T_SEALD, 'horn', 'E4', DUR - T_SEALD - .3, .6, -.1)
n(T_SEALD, 'timpani', 'A2', 2.5, .95, 0, 1.6); n(T_SEALD, 'harp', 'A5', 2.6, .55, .3); n(T_SEALD + .02, 'glockenspiel', 'A6', 2.6, .5, .3)
n(T_PEEL + .5, 'glockenspiel', 'E7', 2.4, .45, .3); n(T_PEEL + .5, 'harp', 'E5', 2.4, .45, -.3)

mus = S.render(sc, dur=DUR, master=False)
mus = np.pad(mus, ((0, max(0, N - len(mus))), (0, 0)))[:N]
mus = S.room(mus, size=.45, mix=.17)
gate = np.ones(N); a, b = int(T_SIL * SR), int((T_TIMP - .004) * SR); gate[a:b] = 0; gate[a - 1440:a] = np.linspace(1, 0, 1440)
mus *= gate[:, None]

# ================================================================== the world
amb = np.zeros((N, 2)); fx = np.zeros((N, 2))
w = noise(DUR + .1)[:N]
amb += st(hp(lp(w, 2400), 700) * .025 * env(0, T_PUSH, .2, .8))                             # pre-dawn air over the roofs
amb += st(bp(np.roll(w, 7000), 150, 1200) * .045 * env(T_SUN, T_PUSH + .5, 1.0, .8))        # the city waking
amb += st(lp(brown(DUR + .1)[:N], 160) * .22 * env(T_PUSH, T_SIL, .8, .05))                 # close to the skin: low air
amb += st(np.sin(2 * np.pi * 96 * tt) * .018 * env(T_PUSH + .5, T_SIL, .6, .05))            # a soft heat hum
amb += st(bp(np.roll(w, 13000), 250, 2400) * .03 * env(T_CARVE, DUR, .5, .8))               # a morning ledge outside
for t in list(np.arange(T_SUN, T_PUSH, .21)) + list(np.arange(T_CARVE + .4, DUR - .5, .55)):   # birds
    if R.random() < (.55 if t < T_PUSH else .3):
        d = .05 + R.random() * .08; s = t_(d); f0 = 2800 + R.random() * 1900
        x = np.sin(2 * np.pi * np.cumsum(f0 * (1 + .4 * np.sin(np.pi * s / d) * (R.random() - .3))) / SR) * np.sin(np.pi * s / d) ** 2
        add(amb, x * (.045 if t < T_PUSH else .025), t, 1, R.uniform(-.8, .8))
amb *= gate[:, None]

def knife(v=1.):
    d = .07 + R.random() * .05; s = t_(d)
    x = bp(noise(d), 2200, 7000) * np.minimum(1, s / .004) * np.exp(-s / (d * .5)) + bp(noise(d), 600, 1600) * np.exp(-s / .01) * .4
    return norm(x) * v
def seal(big):
    d = .55; s = t_(d)
    x = np.sin(2 * np.pi * (58 if big else 68) * s * (1 - .25 * s)) * env_exp(d, .1) + lp(noise(d), 500) * env_exp(d, .025) * .8 + hp(noise(d), 2000) * env_exp(d, .004) * .5
    return norm(x)
def ink_spread():
    d = 1.1; s = t_(d); x = lp(noise(d), 700) * np.sin(np.pi * np.minimum(1, s / 1.0)) ** 2 * .6
    for k in range(12):
        dd = .04; ss_ = t_(dd); b_ = np.sin(2 * np.pi * (170 + R.random() * 230) * ss_ * (1 + ss_ * 8)) * env_exp(dd, .012)
        i = int((.05 + R.random() * .8) * SR); x[i:i + len(b_)] += b_[:max(0, min(len(b_), len(x) - i))] * .5
    return norm(x)
def tear():
    d = .6; s = t_(d); x = bp(noise(d), 900, 6000)
    crack = (X._rng.random(len(s)) > .985) * 1.0; return norm(x * (.35 + lp(crack, 300) * 6) * np.sin(np.pi * s / d) ** .5)
def shimmer(d=1.2):
    s = t_(d); return sum(np.sin(2 * np.pi * f * s) for f in (1760, 2217, 2637)) * np.sin(np.pi * s / d) ** 2 / 3
for e in EV:
    t, ty, pan = e['t'], e['type'], e.get('pan', 0)
    if ty == 'knife': add(fx, knife(.5 + R.random() * .2), t, .55, pan)
    elif ty == 'seal': add(fx, seal(e.get('big')), t, 1.0 if e.get('big') else .85, -.2)
    elif ty == 'ray': add(fx, shimmer(), t, .05, .2)
    elif ty == 'push': add(fx, lp(whoosh(1.2, 1), 1500), t, .3, 0)
    elif ty == 'pulse': add(fx, ink_spread(), t, .6, 0); add(fx, shimmer(.8), t, .06, .2)
    elif ty == 'dive': add(fx, lp(whoosh(.45, 1), 700), t, .5, 0)
    elif ty == 'carve':
        for i in range(10): add(fx, knife(.6), t + i * .055, .5, (i % 2 - .5) * .6)
    elif ty == 'pack': add(fx, X.clack(.5, 1) * .6, t, .4, -.2); add(fx, lp(thump(.4, 140), 600), t, .4, -.2)
    elif ty == 'tilt': add(fx, whoosh(.7, 1), t, .3, 0)
    elif ty == 'peel': add(fx, tear(), t, .7, -.3)

mix = mus * .6 + amb + fx
mix = np.stack([limit(mix[:, 0], .89), limit(mix[:, 1], .89)], 1)
mix *= (10 ** (-19 / 20)) / max(np.sqrt(np.mean(mix ** 2)), 1e-9)
mix = np.stack([limit(mix[:, 0], .89), limit(mix[:, 1], .89)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
print('mix.wav', f'{len(mix) / SR:.2f}s', 'peak', f'{np.abs(mix).max():.3f}')
print('\n'.join(S.credits(sorted({x[1] for x in sc}))))
