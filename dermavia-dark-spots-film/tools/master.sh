#!/bin/sh
# Master for this film on any ffmpeg ≥ 6: master.sh video.mp4 mix.wav out.mp4
# Same targets as the library's core/render/mux.sh (two-pass loudnorm → −14 LUFS / TP −1.2, a 4× oversampled limiter,
# light film grain 1, x264 CRF 19, AAC 256k), but the audio is mastered to its own WAV first and trimmed/padded to the
# picture's exact length, so ffmpeg 6's length misreport through loudnorm cannot cut the film short.
set -e; LC_ALL=C; export LC_ALL
V="$1"; A="$2"; O="$3"; FPS=30; GR=0
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
M=$(ffmpeg -hide_banner -nostats -i "$A" -af loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json -f null - 2>&1)
g() { echo "$M" | sed -n '/{/,/}/p' | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
LN="loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true"
T=$(dirname "$O")/.master.$$; mkdir -p "$T"; trap 'rm -rf "$T"' EXIT
ffmpeg -v error -y -i "$A" -af "$LN,aresample=192000,alimiter=limit=0.8318:attack=10:release=200:level=disabled,aresample=48000,apad,atrim=0:$D" -c:a pcm_s24le "$T/a.wav"
ffmpeg -v error -y -i "$V" -i "$T/a.wav" -map 0:v -map 1:a -vf "fps=$FPS" -c:v libx264 -preset slow -crf 19 -pix_fmt yuvj420p \
  -c:a aac -b:a 256k -movflags +faststart -t "$D" "$T/o.mp4"
mv "$T/o.mp4" "$O"
ffmpeg -hide_banner -nostats -i "$O" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p' | grep -E "I:|Peak:|LRA:" | tr -s ' '
echo "durations: video $(ffprobe -v error -select_streams v -show_entries stream=duration -of csv=p=0 "$O") audio $(ffprobe -v error -select_streams a -show_entries stream=duration -of csv=p=0 "$O")"
echo "$O"
