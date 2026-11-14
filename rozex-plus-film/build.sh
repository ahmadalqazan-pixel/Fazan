#!/bin/sh
# One command: «Rozex Plus · حبوبك ترجع كل شهر؟» — Tablet Sketch Explainer, 20 s, 1080×1920, 24 fps.
#   fonts (if missing) → glyph data (HarfBuzz-shaped Arabic + Caveat skeletons, if missing) → events → picture →
#   foley + score mix → master (−14 LUFS) → reading-time check → Reels safe-zone check → poster
# Needs the Lemo-Opuscar library set up with `setup.sh deps` (sample libraries freepats + karoryfer are fetched by the
# sampler on first run) and uharfbuzz (installed into .pylib/ here).
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
WORKERS=${WORKERS:-3}
SZ="--size 1080x1920"

# fonts (SIL OFL 1.1): Aref Ruqaa Regular/Bold (Arabic), Caveat Bold (Latin names)
if [ ! -f "$HERE/fonts/ArefRuqaa-Bold.ttf" ] || [ ! -f "$HERE/fonts/Caveat-Bold.ttf" ]; then
  mkdir -p "$HERE/fonts"; G=https://raw.githubusercontent.com/google/fonts/main/ofl; T=$(mktemp -d)
  for f in arefruqaa/ArefRuqaa-Regular.ttf arefruqaa/ArefRuqaa-Bold.ttf; do curl -sfL -o "$HERE/fonts/$(basename $f)" "$G/$f"; done
  curl -sfL -o "$HERE/fonts/OFL-arefruqaa.txt" "$G/arefruqaa/OFL.txt"; curl -sfL -o "$HERE/fonts/OFL-caveat.txt" "$G/caveat/OFL.txt"
  curl -sfL -o "$T/Caveat.ttf" "$G/caveat/Caveat%5Bwght%5D.ttf"
  "$PY" -m fontTools.varLib.instancer "$T/Caveat.ttf" wght=700 -o "$HERE/fonts/Caveat-Bold.ttf" -q; rm -rf "$T"
fi
# HarfBuzz for the Arabic shaping (private to this folder)
[ -d "$HERE/.pylib/uharfbuzz" ] || "$PY" -m pip install -q --target "$HERE/.pylib" uharfbuzz
[ -f "$HERE/glyphs.json" ] || PYTHONPATH="$HERE/.pylib" "$PY" "$HERE/tools/glyphs.py"

cd "$LIB"
"$PY" core/audio/sampler.py --need guitar_nylon jazz_bass world_perc kalimba
node core/render/events.mjs "$HERE" $SZ
node core/render/video.mjs "$HERE" --fps 24 --workers "$WORKERS" $SZ --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh "$HERE/tools/master.sh" "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/rozex-plus.mp4"

node core/render/readcheck.mjs "$HERE" $SZ > "$HERE/out/readcheck.txt" && echo "readcheck ok" || echo "readcheck: see out/readcheck.txt"
node "$HERE/tools/safezone.mjs" "$HERE" > "$HERE/out/safezone.txt" && echo "safe zone ok" || echo "safe zone: see out/safezone.txt"

# poster: the finished page, no stylus
node core/render/still.mjs "$HERE" 19.95 --q clean=1 $SZ --out "$HERE/out/stills" > /dev/null
ffmpeg -v error -y -i "$HERE/out/stills/t_19.95.jpg" -q:v 3 "$HERE/poster.jpg"
echo "done: $HERE/rozex-plus.mp4"
