#!/bin/bash
# Render an HTML motion project to MP4 with HyperFrames (headless Chrome + FFmpeg). Needs Node 22+ and FFmpeg.
#   render.sh <project-dir> <out.mp4> [fps=30] [workers=2]
set -e
dir="$1"; out="$2"; fps="${3:-30}"; workers="${4:-2}"
[ -f "$dir/index.html" ] || { echo "no index.html in $dir"; exit 1; }
command -v ffmpeg >/dev/null || { echo "FFmpeg is required (macOS: brew install ffmpeg)"; exit 1; }
command -v npx >/dev/null || { echo "Node.js 22+ is required (https://nodejs.org)"; exit 1; }
outabs="$(cd "$(dirname "$out")" && pwd)/$(basename "$out")"
# low heat by default: 2 Chrome workers, niced
nice -n 10 npx -y hyperframes render "$dir" --fps "$fps" --workers "$workers" --quality looks --output "$outabs" 2>&1 \
  | grep -vE '^\[INFO\]|@hf-progress' | tail -6
ffprobe -v error -show_entries format=duration -of csv=p=0 "$outabs" | sed "s|^|rendered $outabs, seconds: |"
