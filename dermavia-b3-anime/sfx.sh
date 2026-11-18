#!/usr/bin/env bash
# Sound design for v2 — synthesised with ffmpeg, no music, no credits. Writes music/sfx_v2.wav (length of the v2 render).
# Cue times follow the v2 cut (see S[] in v2/index.html). Usage: ./sfx.sh
set -euo pipefail; cd "$(dirname "$0")"; D=music/sfx; mkdir -p $D
SR=48000; g(){ ffmpeg -y -loglevel error -f lavfi -i "$2" ${3:+-af "$3"} -ac 2 -ar $SR $D/$1.wav; }
g boom   "aevalsrc='sin(2*PI*(38+40*exp(-t*16))*t)*exp(-t*5)':s=$SR:d=1.0"
g snap   "anoisesrc=d=0.08:c=white:r=$SR" "highpass=f=2500,afade=t=out:d=0.08,volume=0.8"
g whoosh "anoisesrc=d=0.32:c=pink:r=$SR" "highpass=f=500,lowpass=f=7000,afade=t=in:d=0.2:curve=exp,afade=t=out:st=0.2:d=0.12"
g swish  "anoisesrc=d=0.7:c=white:r=$SR" "bandpass=f=3500:w=2500,afade=t=in:d=0.3,afade=t=out:st=0.3:d=0.4,volume=0.5"
g ping   "aevalsrc='0.5*sin(2*PI*1760*t)*exp(-t*7)+0.3*sin(2*PI*2640*t)*exp(-t*10)':s=$SR:d=0.9"
g pop    "aevalsrc='0.8*sin(2*PI*(500*t+2600*t*t))*exp(-t*35)':s=$SR:d=0.15"
g click  "anoisesrc=d=0.02:c=white:r=$SR" "highpass=f=3000,afade=t=out:d=0.02,volume=0.5"
g riser  "aevalsrc='0.35*(t/2.4)*sin(2*PI*(70*t+70*t*t))*(0.75+0.25*sin(2*PI*(4+3*t)*t))':s=$SR:d=2.4"
g crash  "anoisesrc=d=1.6:c=pink:r=$SR" "lowpass=f=5000,afade=t=out:d=1.6:curve=exp,volume=0.6"
g thud   "aevalsrc='sin(2*PI*(60+50*exp(-t*25))*t)*exp(-t*12)':s=$SR:d=0.5"
g heart  "aevalsrc='0.9*sin(2*PI*(85+45*exp(-t*30))*t)*exp(-t*14)+0.6*gt(t,0.15)*sin(2*PI*(105+45*exp(-(t-0.15)*30))*(t-0.15))*exp(-(t-0.15)*16)':s=$SR:d=0.6" "lowpass=f=700"
# heartbeat bed: steady in the hook, speeds up into the drop, gap before impact, steady after, stops before the last ping
HEART=$(awk 'BEGIN{
  t=0.40; while(t<6.4){ printf "heart %.3f 0.55\n", t; t+=0.75 }
  t=6.45; i=0.62; while(t<8.5){ printf "heart %.3f 0.65\n", t; t+=i; i=(i>0.26)?i*0.86:0.26 }
  t=9.70; while(t<14.4){ printf "heart %.3f 0.45\n", t; t+=0.6 }
  t=14.95; while(t<17.0){ printf "heart %.3f 0.4\n", t; t+=0.8 } }')
# name start gain
CUES="$HEART
boom 0.00 1.0
snap 0.00 0.9
boom 1.055 0.9
snap 1.055 0.8
whoosh 1.95 0.9
swish 2.58 0.9
ping 3.51 0.55
snap 3.51 0.5
whoosh 4.15 0.9
pop 4.75 0.8
thud 4.82 1.0
riser 6.30 1.0
pop 6.72 0.7
pop 7.21 0.7
pop 7.69 0.7
pop 8.18 0.7
whoosh 8.48 0.7
boom 8.90 1.0
crash 8.90 0.8
snap 8.90 0.9
pop 8.97 0.6
pop 9.03 0.6
pop 9.10 0.6
pop 9.16 0.6
snap 9.04 0.6
whoosh 10.75 0.9
pop 11.05 0.8
pop 11.40 0.8
whoosh 12.35 0.9
snap 12.60 0.6
click 12.75 0.6
click 12.86 0.6
click 12.98 0.6
click 13.07 0.6
pop 13.16 0.9
click 13.71 0.7
click 13.76 0.7
boom 14.60 0.8
snap 14.60 0.6
pop 14.75 0.6
ping 15.10 0.5
thud 15.35 0.5
thud 16.15 0.5
thud 16.95 0.5
ping 17.40 0.35"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 out/dermavia-b3-v2.mp4)
in=(-f lavfi -i "anullsrc=r=$SR:cl=stereo"); f=""; lab="[0:a]"; n=1
while read name st gain; do ms=$(awk "BEGIN{print int($st*1000)}")
  in+=(-i $D/$name.wav); f+="[$n:a]volume=$gain,adelay=${ms}|${ms}[h$n];"; lab+="[h$n]"; n=$((n+1)); done <<< "$CUES"
f+="${lab}amix=inputs=$n:normalize=0,atrim=0:$DUR[o]"
ffmpeg -y -loglevel error "${in[@]}" -filter_complex "$f" -map "[o]" music/sfx_v2.wav
echo "wrote music/sfx_v2.wav ($DUR s, $((n-1)) cues)"
