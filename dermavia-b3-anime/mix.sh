#!/usr/bin/env bash
# Mix Ahmed's VO (vo/vo1..vo5, any audio format) onto the silent render -> final.mp4
# Usage: ./mix.sh [music.wav]      (music optional; sits ~10 dB under the voice)
# Start times come from HANDOFF.md. Output normalised to -14 LUFS, true peak -1.5 dBTP.
#        ./mix.sh --music-only music.mp3   (no VO; music at full level, fades out in the last 0.6 s)
set -euo pipefail
cd "$(dirname "$0")"
VIDEO=${VIDEO:-out/dermavia-b3-anime.mp4}
NOVO=0; [ "${1:-}" = "--music-only" ] && { NOVO=1; shift; }
MUSIC=${1:-}
STARTS=(3.5 7.9 10.0 15.0 17.5)   # vo1..vo5, seconds
DUR=20

[ -f "$VIDEO" ] || { echo "missing $VIDEO — run: npm run render"; exit 1; }

if [ $NOVO = 1 ]; then
  [ -f "$MUSIC" ] || { echo "usage: ./mix.sh --music-only music.mp3"; exit 1; }
  ffmpeg -y -loglevel error -i "$MUSIC" -af "aformat=sample_rates=48000:channel_layouts=stereo,apad,atrim=0:${DUR},afade=t=in:d=0.05,afade=t=out:st=$(awk "BEGIN{print $DUR-0.6}"):d=0.6,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000,alimiter=limit=0.82:level=false" -t $DUR mix.wav
  ffmpeg -y -loglevel error -i "$VIDEO" -i mix.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart final.mp4
  ffprobe -v error -show_entries format=duration -of default=nw=1 final.mp4
  echo "wrote final.mp4 (music only)"; exit 0
fi

GAP=0.08   # min silence between lines; last line must end by DUR-0.05
mkdir -p vo/fit
inputs=(); filters=(); labels=""
for i in 1 2 3 4 5; do
  f=$(ls vo/vo$i.* 2>/dev/null | head -1 || true)
  [ -n "$f" ] || { echo "missing vo/vo$i.*"; exit 1; }
  start=${STARTS[$((i-1))]}
  if [ $i -lt 5 ]; then win=$(awk "BEGIN{print ${STARTS[$i]}-$start-$GAP}"); else win=$(awk "BEGIN{print $DUR-0.05-$start}"); fi
  # trim leading/trailing silence, then speed up (pitch kept) only if the line overruns its slot
  ffmpeg -y -loglevel error -i "$f" -af "aformat=sample_rates=48000:channel_layouts=stereo,silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse" vo/fit/t$i.wav
  len=$(ffprobe -v error -show_entries format=duration -of csv=p=0 vo/fit/t$i.wav)
  tempo=$(awk "BEGIN{t=$len/$win; print (t>1?t:1)}")
  ffmpeg -y -loglevel error -i vo/fit/t$i.wav -af "atempo=$tempo" vo/fit/vo$i.wav
  printf 'vo%s  start %5.2fs  speech %4.2fs  slot %4.2fs  tempo x%.2f\n' $i $start $len $win $tempo
  awk "BEGIN{exit !($tempo>1.25)}" && echo "  ! vo$i needs >1.25x — consider a shorter read"
  ms=$(awk "BEGIN{print int($start*1000)}")
  inputs+=(-i vo/fit/vo$i.wav)
  filters+=("[$((i-1)):a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${ms}|${ms}[v$i]")
  labels+="[v$i]"
done
filters+=("${labels}amix=inputs=5:normalize=0,apad,atrim=0:${DUR}[voice]")

if [ -n "$MUSIC" ]; then
  inputs+=(-i "$MUSIC")
  filters+=("[5:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=-10dB,apad,atrim=0:${DUR},afade=t=out:st=$((DUR-1)):d=1[mus]")
  filters+=("[voice][mus]amix=inputs=2:normalize=0[pre]")
else
  filters+=("[voice]anull[pre]")
fi
filters+=("[pre]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[out]")

IFS=';'; fc="${filters[*]}"; unset IFS
ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "$fc" -map "[out]" -t $DUR mix.wav
ffmpeg -y -loglevel error -i "$VIDEO" -i mix.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart final.mp4
ffprobe -v error -show_entries format=duration -of default=nw=1 final.mp4
echo "wrote final.mp4"
