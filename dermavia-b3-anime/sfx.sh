#!/usr/bin/env bash
# Synthesised hits for v2 (no credits): boom = 55→35 Hz sine with fast decay + click; whoosh = filtered noise swell.
# Writes music/music_v2.wav = music_a + hits at the cut points. Usage: ./sfx.sh
set -euo pipefail; cd "$(dirname "$0")"; mkdir -p music/sfx
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='sin(2*PI*(35+30*exp(-t*18))*t)*exp(-t*6)+0.4*(random(0)*2-1)*exp(-t*90)':s=48000:d=0.9" -ac 2 music/sfx/boom.wav
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=0.5:c=pink:r=48000" -af "highpass=f=800,lowpass=f=6000,afade=t=in:d=0.45:curve=exp,afade=t=out:st=0.45:d=0.05,volume=0.6" -ac 2 music/sfx/whoosh.wav
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='0.5*sin(2*PI*1760*t)*exp(-t*9)+0.3*sin(2*PI*2640*t)*exp(-t*12)':s=48000:d=0.6" -ac 2 music/sfx/ping.wav
# file  start(s)  gain
HITS="boom 0.00 1.0
boom 1.15 0.85
whoosh 2.95 0.6
ping 3.95 0.5
boom 5.00 0.55
whoosh 10.2 0.9
boom 10.70 1.0
boom 17.30 0.6
ping 17.45 0.45"
in=(-i music/music_a.mp3); f=""; lab="[m]"; n=1
f+="[0:a]aformat=sample_rates=48000:channel_layouts=stereo[m];"
while read name st g; do ms=$(awk "BEGIN{print int($st*1000)}")
  in+=(-i music/sfx/$name.wav); f+="[$n:a]volume=$g,adelay=${ms}|${ms}[h$n];"; lab+="[h$n]"; n=$((n+1)); done <<< "$HITS"
f+="${lab}amix=inputs=$n:normalize=0,atrim=0:20[o]"
ffmpeg -y -loglevel error "${in[@]}" -filter_complex "$f" -map "[o]" music/music_v2.wav
echo wrote music/music_v2.wav
