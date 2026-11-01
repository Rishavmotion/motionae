#!/bin/bash
# Start a motion project from a template (no After Effects needed).
#   new.sh <template> <project-dir>      e.g. new.sh calendar ./my-calendar
#   new.sh list                          available templates
set -e
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
if [ "$1" = "list" ] || [ -z "$1" ]; then ls "$SKILL/templates"; exit 0; fi
src="$SKILL/templates/$1"; dst="$2"
[ -d "$src" ] || { echo "no template '$1' (try: new.sh list)"; exit 1; }
[ -n "$dst" ] || { echo "usage: new.sh <template> <project-dir>"; exit 1; }
[ -e "$dst/index.html" ] && { echo "$dst/index.html exists: not overwriting"; exit 1; }
mkdir -p "$dst"
cp -R "$src/." "$dst/"
cp "$SKILL/kit/motionkit.js" "$dst/"
echo "created $dst"
echo "preview: open \"$dst/index.html\"   (player bar: Space to play/pause, drag to scrub)"
echo "render:  $SKILL/scripts/render.sh \"$dst\" out.mp4"
