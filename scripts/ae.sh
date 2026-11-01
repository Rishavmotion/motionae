#!/bin/bash
# After Effects from the terminal (macOS). Finds the newest installed AE (override: AE_APP="Adobe After Effects 2025").
# Windows: no osascript; run scripts with "AfterFX.exe -r file.jsx" and render with aerender.exe (see references/after-effects.md).
#   ae.sh ping                                  # is AE open and scriptable? (prints AE version)
#   ae.sh run <file.jsx> ['<js globals>']       # run a script in the open AE, e.g. '$.global.EDIT_JSON="/abs/edit.json";'
#   ae.sh eval '<one line of ExtendScript>'     # run a snippet; prints its return value
#   ae.sh render <project.aep> "<comp>" <out.mp4> [startFrame endFrame]   # aerender -> ProRes -> H.264 (low heat)
#   ae.sh stills <project.aep> "<comp>" <outdir> <t1> [t2 ...]            # PNG stills at times (s), via the open AE
set -e
if [ -z "$AE_APP" ]; then
  AE_APP=$(ls -d "/Applications/Adobe After Effects "* 2>/dev/null | sed 's|/Applications/||' | sort -V | tail -1)
fi
[ -n "$AE_APP" ] || { echo "After Effects not found in /Applications (set AE_APP=\"Adobe After Effects 20xx\")"; exit 1; }
AERENDER="/Applications/$AE_APP/aerender"
cmd="$1"; shift || true

OUT="$HOME/Library/Caches/ae_skill_out.txt"   # AE can write here (it can't write into sandboxed temp dirs)
# Run ExtendScript in the open AE and print its result (or "ERROR line N: ..."). DoScript itself returns nothing useful.
doscript() {
  rm -f "$OUT"
  local js; js=$(python3 -c 'import json,sys; c=json.dumps(sys.argv[1]); o=json.dumps(sys.argv[2])
print("var __o;try{__o=String(eval(%s));}catch(e){__o=\"ERROR line \"+e.line+\": \"+e.toString();}var __f=new File(%s);__f.encoding=\"UTF-8\";__f.open(\"w\");__f.write(__o);__f.close();" % (c, o))' "$1" "$OUT")
  osascript - "$js" >/dev/null <<OSA
on run argv
  tell application "$AE_APP" to DoScript (item 1 of argv)
end run
OSA
  for i in $(seq 50); do [ -f "$OUT" ] && break; sleep 0.2; done
  [ -f "$OUT" ] && { cat "$OUT"; echo; } || echo "(no result: AE busy, a modal dialog is open, or the script crashed)"
}

case "$cmd" in
  ping)
    pgrep -f "After Effects" >/dev/null || { echo "AE is not running: open -a \"$AE_APP\" first"; exit 1; }
    doscript 'app.version + " | project: " + (app.project.file ? app.project.file.fsName : "(unsaved)")' ;;
  eval)
    doscript "$1" ;;
  run)
    f="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
    doscript "${2:-}\$.evalFile(\"$f\");" ;;
  render)
    proj="$1"; comp="$2"; out="$3"; tmp="${out%.*}.render.mov"
    range=(); [ -n "$4" ] && range=(-s "$4" -e "$5")
    nice -n 15 "$AERENDER" -project "$(cd "$(dirname "$proj")" && pwd)/$(basename "$proj")" -comp "$comp" "${range[@]}" \
      -RStemplate "Best Settings" -OMtemplate "High Quality" -output "$(cd "$(dirname "$out")" && pwd)/$(basename "$tmp")" 2>&1 \
      | grep -E "ERROR|Total Time" || true
    nice -n 15 ffmpeg -v error -y -i "$tmp" -c:v h264_videotoolbox -b:v 14M -c:a aac -b:a 256k "$out" && rm -f "$tmp"
    ffprobe -v error -show_entries format=duration -of csv=p=0 "$out" | sed "s|^|rendered $out, seconds: |" ;;
  stills)
    proj="$1"; comp="$2"; dir="$(mkdir -p "$3" && cd "$3" && pwd)"; shift 3
    times=$(IFS=,; echo "$*")
    pf="$(cd "$(dirname "$proj")" && pwd)/$(basename "$proj")"
    doscript "var P=new File(\"$pf\");if(!app.project.file&&app.project.dirty){throw new Error('an unsaved untitled project is open in AE: save or close it first');}if(!app.project.file||app.project.file.fsName!=P.fsName){if(app.project.file){app.project.save();}app.open(P);}var c=null;for(var i=1;i<=app.project.numItems;i++){var it=app.project.item(i);if(it instanceof CompItem&&it.name==\"$comp\")c=it;}
if(!c){'no comp $comp in open project'}else{var T=[$times];for(var k=0;k<T.length;k++)c.saveFrameToPng(T[k],new File(\"$dir/\"+\"$comp\".replace(/[^A-Za-z0-9]+/g,'_')+\"_\"+T[k]+\"s.png\"));'queued '+T.length}"
    # saveFrameToPng is async: wait for the files
    n=$#; for i in $(seq 60); do [ "$(ls "$dir"/*.png 2>/dev/null | wc -l)" -ge "$n" ] && break; sleep 2; done
    ls "$dir"/*.png ;;
  *)
    sed -n 2,7p "$0"; exit 1 ;;
esac
