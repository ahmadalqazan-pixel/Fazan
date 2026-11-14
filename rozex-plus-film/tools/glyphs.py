"""Glyph data for the pencil lettering of «Rozex Plus · ليش ترجع؟».

Latin (Caveat Bold): one skeleton per character, as in the style's demo (render big, thin to a centre line, walk it
like a pencil).  Arabic (Aref Ruqaa): every line is shaped as a whole with HarfBuzz (script Arab, direction RTL), so
letters join and take their contextual forms; the shaped outlines are kept as vector contours (the page fills them),
and the skeleton is built from the shaped line, then ordered the way a hand writes Arabic: connected letter groups
from right to left, each traced from its rightmost free end, its dots and marks (shadda, hamza) right after it.

Output: glyphs.json = {
  lat: {hw, g: {char: [[x,y,...], ...]}},                      (em units, y down, origin = baseline left)
  ar:  {id: {text, f, w, hw, contours: [[x,y,...]], strokes: [[x,y,...]], words: [[x0,x1], ...]}}
}                                                              (em units, origin = baseline left of the shaped line)
Run:  PYTHONPATH=.pylib <LIB>/.venv/bin/python tools/glyphs.py      (build.sh does when glyphs.json is missing)
"""
import json, os
import numpy as np
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = 220                                           # bitmap pixels per em for skeletons
LATIN = ''.join(chr(c) for c in range(33, 127)) + '·'

# every Arabic run on the page (exact strings from TREATMENT.md §4); Latin parts are written separately, left of them
AR = {
    'Q1':  ('حبوبك ترجع', 'B'),           # Q «حبوبك ترجع كل شهر؟», set on two lines
    'Q2':  ('كل شهر؟', 'B'),
    'P1':  ('مسامة مسدودة', 'R'),
    'A1':  ('يهدّي الالتهاب', 'R'),
    'A2':  ('ضد البكتيريا', 'R'),
    'A3':  ('ينظّم الدهون', 'R'),
    'A4':  ('يرطّب', 'R'),
    'U1':  ('مرة باليوم', 'R'),
    'U2':  ('وبالنهار واقي', 'R'),
    'C':   ('اطلب بالواتساب', 'R'),
}
FONTS = {'B': 'fonts/ArefRuqaa-Bold.ttf', 'R': 'fonts/ArefRuqaa-Regular.ttf'}


# ---------------- skeleton helpers (as in the style's demo tools/skeleton.py) ----------------
def thin(img):
    I = np.pad(img.astype(np.uint8), 1)
    while True:
        changed = False
        for step in (0, 1):
            P2 = I[:-2, 1:-1]; P3 = I[:-2, 2:]; P4 = I[1:-1, 2:]; P5 = I[2:, 2:]
            P6 = I[2:, 1:-1]; P7 = I[2:, :-2]; P8 = I[1:-1, :-2]; P9 = I[:-2, :-2]
            nb = [P2, P3, P4, P5, P6, P7, P8, P9]
            B = sum(n.astype(int) for n in nb)
            seq = nb + [P2]
            A = sum(((seq[i] == 0) & (seq[i + 1] == 1)).astype(int) for i in range(8))
            c = ((P2 * P4 * P6 == 0) & (P4 * P6 * P8 == 0)) if step == 0 else ((P2 * P4 * P8 == 0) & (P2 * P6 * P8 == 0))
            m = (I[1:-1, 1:-1] == 1) & (B >= 2) & (B <= 6) & (A == 1) & c
            if m.any():
                I[1:-1, 1:-1][m] = 0; changed = True
        if not changed:
            break
    return I[1:-1, 1:-1].astype(bool)


NB = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]


def trace(sk, rtl=False):
    """Walk a 1-px skeleton as a pencil would. LTR: start top-left; RTL: start at the rightmost free end."""
    left = set(zip(*np.nonzero(sk.T)))
    def nbrs(p, pool):
        return [(p[0] + dx, p[1] + dy) for dx, dy in NB if (p[0] + dx, p[1] + dy) in pool]
    strokes = []; cur = None
    while left:
        ends = [p for p in left if len(nbrs(p, left)) <= 1]
        cand = ends if ends else list(left)
        if cur is None:
            start = min(cand, key=lambda p: (-p[0] + p[1] * 0.35) if rtl else (p[0] + p[1] * 0.6))
        else:   # nearest free end; writing right to left, prefer ends that lie to the left
            start = min(cand, key=lambda p: (p[0] - cur[0]) ** 2 + (p[1] - cur[1]) ** 2 + (max(0, p[0] - cur[0]) * 3) ** 2 * rtl)
        path = [start]; left.discard(start); d = None
        while True:
            nx = nbrs(path[-1], left)
            if not nx:
                break
            if d is None:
                q = min(nx, key=lambda p: (p[0] - path[-1][0]) if rtl else abs(p[0] - path[-1][0]) + abs(p[1] - path[-1][1]))
            else:
                q = max(nx, key=lambda p: ((p[0] - path[-1][0]) * d[0] + (p[1] - path[-1][1]) * d[1]) /
                        max(1e-6, np.hypot(p[0] - path[-1][0], p[1] - path[-1][1])))
            for r in nbrs(path[-1], left):
                if r != q and abs(r[0] - q[0]) <= 1 and abs(r[1] - q[1]) <= 1:
                    left.discard(r)
            path.append(q); left.discard(q)
            k = min(len(path) - 1, 4); d = (path[-1][0] - path[-1 - k][0], path[-1][1] - path[-1 - k][1])
        cur = path[-1]
        if rtl or len(path) >= 3 or not strokes:   # RTL: never glue a short piece onto the last stroke (no jumps)
            strokes.append(path)
        else:
            strokes[-1].extend(path)
    return strokes


def rdp(P, eps):
    if len(P) < 3:
        return P
    a, b = np.array(P[0], float), np.array(P[-1], float)
    ab = b - a; L = np.hypot(*ab)
    d = [abs(ab[0] * (p[1] - a[1]) - ab[1] * (p[0] - a[0])) / L if L else np.hypot(*(np.array(p, float) - a)) for p in P]
    i = int(np.argmax(d))
    if d[i] > eps:
        return rdp(P[:i + 1], eps)[:-1] + rdp(P[i:], eps)
    return [P[0], P[-1]]


# ---------------- Latin: per character ----------------
def latin():
    font = ImageFont.truetype(os.path.join(HERE, 'fonts/Caveat-Bold.ttf'), S)
    g = {}; hws = []
    for ch in LATIN:
        pad = S
        img = Image.new('L', (S * 3, S * 3), 0)
        ImageDraw.Draw(img).text((pad, pad * 2), ch, font=font, fill=255, anchor='ls')
        a = np.array(img) > 110
        if not a.any():
            continue
        dt = ndimage.distance_transform_edt(a)
        sk = thin(a)
        hws.append(np.percentile(dt[sk], 90))
        g[ch] = [[round(v, 4) for p in rdp(st, 0.9) for v in ((p[0] - pad) / S, (p[1] - pad * 2) / S)] for st in trace(sk)]
    return {'hw': round(float(np.median(hws)) / S, 4), 'g': g}


# ---------------- Arabic: shaped lines ----------------
def flatten(rec, upm, ox, n=8):
    """RecordingPen operations of one glyph → closed polygons in em units (y down), shifted by ox (font units)."""
    polys = []; cur = []; last = None
    def P(p): return ((p[0] + ox) / upm, -p[1] / upm)
    for op, args in rec.value:
        if op == 'moveTo':
            cur = [P(args[0])]; last = args[0]
        elif op == 'lineTo':
            cur.append(P(args[0])); last = args[0]
        elif op == 'qCurveTo':
            pts = list(args)
            if pts[-1] is None:
                pts = pts[:-1]
            # implied on-curve points between consecutive off-curve points
            on = last
            offs = pts[:-1]; end = pts[-1]
            seq = []
            for i, c in enumerate(offs):
                nxt = end if i == len(offs) - 1 else ((c[0] + offs[i + 1][0]) / 2, (c[1] + offs[i + 1][1]) / 2)
                seq.append((c, nxt))
            for c, e in seq:
                for k in range(1, n + 1):
                    t = k / n; u = 1 - t
                    cur.append(P((u * u * on[0] + 2 * u * t * c[0] + t * t * e[0], u * u * on[1] + 2 * u * t * c[1] + t * t * e[1])))
                on = e
            last = end
        elif op == 'curveTo':
            c1, c2, e = args
            for k in range(1, n + 1):
                t = k / n; u = 1 - t
                cur.append(P((u ** 3 * last[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * e[0],
                              u ** 3 * last[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * e[1])))
            last = e
        elif op in ('closePath', 'endPath'):
            if len(cur) > 2:
                polys.append(cur)
            cur = []
    return polys


def shape_line(text, fpath):
    blob = hb.Blob.from_file_path(fpath)
    face = hb.Face(blob); font = hb.Font(face)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    buf.direction = 'rtl'; buf.script = 'Arab'; buf.language = 'ar'
    hb.shape(font, buf, {'kern': True, 'liga': True})
    tt = TTFont(fpath); upm = tt['head'].unitsPerEm; gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
    infos, pos = buf.glyph_infos, buf.glyph_positions
    # glyphs come out in visual order (left to right) for an RTL buffer
    x = 0; polys = []; clus = {}
    for info, p in zip(infos, pos):
        name = order[info.codepoint]
        rec = DecomposingRecordingPen(gs); gs[name].draw(rec)
        gx = x + p.x_offset
        for poly in flatten(rec, upm, gx):
            polys.append([(px, py - p.y_offset / upm) for px, py in poly])
        c = clus.setdefault(info.cluster, [1e9, -1e9]); c[0] = min(c[0], x / upm); c[1] = max(c[1], (x + p.x_advance) / upm)
        x += p.x_advance
    width = x / upm
    # word extents (by cluster = character index) for underlines
    words = []; i = 0
    for wtxt in text.split(' '):
        idx = range(i, i + len(wtxt)); xs = [clus[k] for k in idx if k in clus]
        if xs:
            words.append([round(min(a for a, _ in xs), 4), round(max(b for _, b in xs), 4)])
        i += len(wtxt) + 1
    return polys, width, words


def ar_skeleton(polys, width):
    pad = 0.6
    Wp, Hp = int((width + 2 * pad) * S), int(2.6 * S)
    base = 1.7 * S
    img = Image.new('L', (Wp, Hp), 0); dr = ImageDraw.Draw(img)
    # nonzero winding fill of all contours (joined letters overlap; counters wind the other way)
    wind = np.zeros((Hp, Wp), np.int16)
    for poly in polys:
        P = [((px + pad) * S, py * S + base) for px, py in poly]
        a = sum(P[i][0] * P[(i + 1) % len(P)][1] - P[(i + 1) % len(P)][0] * P[i][1] for i in range(len(P)))
        m = Image.new('L', (Wp, Hp), 0); ImageDraw.Draw(m).polygon(P, fill=255)
        wind += (1 if a > 0 else -1) * (np.array(m) > 127)
    mask = wind != 0
    a = ndimage.binary_closing(mask, iterations=1)
    dt = ndimage.distance_transform_edt(a)
    lab, n = ndimage.label(a, structure=np.ones((3, 3)))
    comps = []
    for k in range(1, n + 1):
        m = lab == k; ys, xs = np.nonzero(m)
        comps.append({'k': k, 'area': int(m.sum()), 'x0': xs.min(), 'x1': xs.max(), 'y0': ys.min(), 'y1': ys.max()})
    big = max(c['area'] for c in comps)
    mains = [c for c in comps if c['area'] > big * 0.12 or (c['y1'] - c['y0']) > 0.42 * S]
    marks = [c for c in comps if c not in mains]
    for c in marks:   # a dot or mark belongs to the letter group it sits over (most overlap, else nearest centre)
        cx = (c['x0'] + c['x1']) / 2
        c['owner'] = min(mains, key=lambda m: 0 if m['x0'] - 4 <= cx <= m['x1'] + 4 else min(abs(cx - m['x0']), abs(cx - m['x1'])) + 1e3)['k']
    order = []
    for m in sorted(mains, key=lambda c: -c['x1']):
        order.append(m)
        order += sorted([c for c in marks if c['owner'] == m['k']], key=lambda c: -c['x1'])
    sk = thin(a)
    hw = float(np.percentile(dt[sk], 92)) / S
    strokes = []
    for c in order:
        sub = sk & (lab == c['k'])
        if not sub.any():
            ys, xs = np.nonzero(lab == c['k']); sub = np.zeros_like(sk); sub[int(ys.mean()), int(xs.mean())] = True
        for st in trace(sub, rtl=True):
            strokes.append([round(v, 4) for p in rdp(st, 0.9) for v in (p[0] / S - pad, (p[1] - base) / S)])
    return strokes, hw


def main():
    out = {'lat': latin(), 'ar': {}}
    print('latin', len(out['lat']['g']), 'glyphs, hw', out['lat']['hw'])
    for k, (txt, f) in AR.items():
        polys, w, words = shape_line(txt, os.path.join(HERE, FONTS[f]))
        strokes, hw = ar_skeleton(polys, w)
        out['ar'][k] = {'text': txt, 'f': f, 'w': round(w, 4), 'hw': round(hw, 4), 'words': words,
                        'contours': [[round(v, 4) for p in P for v in p] for P in polys], 'strokes': strokes}
        print(k, txt, 'w', round(w, 3), 'em ·', len(polys), 'contours ·', len(strokes), 'strokes · hw', round(hw, 4))
    with open(os.path.join(HERE, 'glyphs.json'), 'w') as fh:
        json.dump(out, fh, separators=(',', ':'), ensure_ascii=False)


if __name__ == '__main__':
    main()
