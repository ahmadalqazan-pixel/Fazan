#!/bin/sh
# One command: «Dermavia · Dark Spots» — Scratchboard Long Take, 26 s, 1080×1920, 30 fps, no voice.
#   fonts (if missing) → events → score + foley mix → picture → master (−14 LUFS) → reading-time check → Reels safe zone → poster
# Needs the Lemo-Opuscar library set up with `setup.sh deps`; the sampler fetches the VCSL and VSCO 2 CE sample packs (CC0).
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
WORKERS=${WORKERS:-3}
SZ="--size 1080x1920"
NAME=dermavia-dark-spots

# fonts (SIL OFL 1.1): Noto Naskh Arabic and Noto Serif, cut to Bold
if [ ! -f "$HERE/fonts/NotoNaskhArabic-Bold.ttf" ] || [ ! -f "$HERE/fonts/NotoSerif-Bold.ttf" ]; then
  mkdir -p "$HERE/fonts"; G=https://raw.githubusercontent.com/google/fonts/main/ofl; T=$(mktemp -d)
  curl -sfL -o "$T/a.ttf" "$G/notonaskharabic/NotoNaskhArabic%5Bwght%5D.ttf"; curl -sfL -o "$T/s.ttf" "$G/notoserif/NotoSerif%5Bwdth,wght%5D.ttf"
  curl -sfL -o "$HERE/fonts/OFL-notonaskharabic.txt" "$G/notonaskharabic/OFL.txt"; curl -sfL -o "$HERE/fonts/OFL-notoserif.txt" "$G/notoserif/OFL.txt"
  "$PY" -m fontTools.varLib.instancer "$T/a.ttf" wght=700 -o "$HERE/fonts/NotoNaskhArabic-Bold.ttf" -q
  "$PY" -m fontTools.varLib.instancer "$T/s.ttf" wght=700 wdth=100 -o "$HERE/fonts/NotoSerif-Bold.ttf" -q; rm -rf "$T"
fi

cd "$LIB"
"$PY" core/audio/sampler.py --need harp contrabass_pizz vibraphone_bowed cellos contrabass timpani glockenspiel horn
node core/render/events.mjs "$HERE" $SZ
"$PY" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 30 --workers "$WORKERS" $SZ --out "$HERE/out/video.mp4"
sh "$HERE/tools/master.sh" "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4"

node core/render/readcheck.mjs "$HERE" $SZ > "$HERE/out/readcheck.txt" && echo "readcheck ok" || echo "readcheck: see out/readcheck.txt"
node "$HERE/tools/safezone.mjs" "$HERE" > "$HERE/out/safezone.txt" && echo "safe zone ok" || echo "safe zone: see out/safezone.txt"

# poster: the shelf with all four ingredients cut
node core/render/still.mjs "$HERE" 19.5 $SZ --out "$HERE/out/stills" > /dev/null
ffmpeg -v error -y -i "$HERE/out/stills/t_19.5.jpg" -q:v 3 "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"
