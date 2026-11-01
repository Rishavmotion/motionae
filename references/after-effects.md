# AE route: ExtendScript builds

## Setup (once)

- **AE 2024 or later**, with *Settings → Scripting & Expressions → Allow Scripts to Write Files and Access Network* turned on.
- **macOS:** `scripts/ae.sh` drives the open AE through `osascript … DoScript` and prints results back.
- **Windows:**
  - Run a script with `"C:\Program Files\Adobe\Adobe After Effects <ver>\Support Files\AfterFX.exe" -r C:/abs/build.jsx`.
  - Render with `aerender.exe` from the same folder.
  - Results come back only through files your script writes.
  - Use forward slashes in ExtendScript paths.
- **Sounds:** `python3 tools/generate_sfx.py ./sfx` writes 16 subtle UI sounds (48 kHz WAV, stdlib only).

## Starter build script

Save it next to `motionkit.jsxinc`, then run `scripts/ae.sh run build.jsx '$.global.OUT="/abs/out.aep";'`.

```js
#include "motionkit.jsxinc"
(function () {
  if (app.project.dirty && !app.project.file) return "ERROR: unsaved untitled project open, ask the user first";
  if (app.project.file) app.project.save();             // never lose the user's work
  app.newProject();                                      // build into a fresh project
  app.project.expressionEngine = "javascript-1.0";
  app.beginSuppressDialogs();
  try {
    FOLD.templates = app.project.items.addFolder("Motion");
    var here = new File($.fileName).parent;
    var wavs = new Folder(here.fsName + "/sfx").getFiles("*.wav");   // optional: tools/generate_sfx.py output
    for (var i = 0; i < wavs.length; i++) { var it = app.project.importFile(new ImportOptions(wavs[i])); SFX[it.name.replace(/\.wav$/i, "")] = it; }
    begin("Kinetic Title", THEMES.light, 5);
    A(at(T("Eyebrow", "CHAPTER 01", { font: "semi", size: 26, col: "Accent", x: 960, y: 420, just: "C", track: 300, egp: "Eyebrow" }), 0), { y: 16 });
    typeLayer(T("Headline", "Design is how it works.", { font: "bold", size: 118, x: 960, y: 560, just: "C", track: -20, egp: "Headline" }), 0.25);
    sfx("type_roll", 0.25, 0);
    end();
    if ($.global.OUT) app.project.save(new File($.global.OUT));
  } catch (e) { LOG("ERROR line " + e.line + ": " + e); }
  app.endSuppressDialogs(false);
  return LOGS.join("\n") || "ok";
})();
```

Then `ae.sh stills /abs/out.aep "Kinetic Title" ./stills 0.5 1.5 3`, look at the stills, and run `ae.sh render`.

## `motionkit.jsxinc` helpers

| Helper | Does |
|---|---|
| `begin(name, THEMES.light, dur, {Extra:"#hex"})` / `end()` | Comp, plus a BG solid, plus a `CONTROLS` null: colors, Speed, Animate Out, Show Background, Blur Amount, Type Speed, SFX volume and mute. `end()` publishes Essential Graphics |
| `T(name, str, {font:"reg|med|semi|bold", size, col, x, y, just:"C|R", track, leading, egp:"Label"})` | Text layer whose colour is linked to a CONTROLS colour |
| `A(at(L, t), {y, x, s, pop, rot, blur, d})` | The house reveal as expressions keyed to the layer's in-point. Animate-out is automatic |
| `typeLayer(L, t, delay, mult)` | Soft-edge type-on |
| `counterExpr(numSlider, decSlider, fmtLayer)` + `slider/check/color/point` + `guideText` | Counters and controls |
| `pill(name, str, {x, y, h, px, fill, tcol, anchor})` | Pill that sizes to its text |
| `card(...)`, `shape()` + `addRect/addEllipse/addPath/addStar/addFill/addStroke/addTrim`, `icon(name, type, x, y, size, col)`, `media(name, w, h, r, x, y)` | Shapes, icons and media slots |
| `sfx(key, t, volDb)` | A sound layer, controlled by CONTROLS |

`ae/edit_engine.jsx` is a separate engine. It turns an `edit.json` (beats such as aroll, card, cards, hold, logos, scorecard, subs, cta) into a kinetic-caption talking-head edit; its header lists the moves.

## Gotchas (each one cost a debugging round)

1. **Expression arrays:** `value + [0,10]` is string concatenation. Use `add()`, `mul()` or index math.
2. **Nested ternaries in ExtendScript** have thrown "undefined is not an object". Use if/else.
3. **Stale references:** after `addProperty`, held property references can go stale ("Object is invalid"). Re-fetch by name.
4. **Anchors:** footage and precomp layers anchor at the centre. Text anchors at the baseline; centre it with a `sourceRectAtTime` anchor expression.
5. **Position expressions:** a reveal that writes a Position expression overwrites an existing computed one. On linked layers, reveal with opacity, scale or blur only.
6. **`saveFrameToPng` is asynchronous**, so poll for the files. AE can't write into sandboxed temp dirs; use `~/Library/Caches` or the project folder.
7. **Audio Levels expressions:** use plain arithmetic only. A ternary there made renders silent.
8. **Modal dialogs and the screensaver block AppleEvents.** Use `app.beginSuppressDialogs()`. "No result" from `ae.sh` usually means a dialog is open in AE.
9. **Track mattes:** `fill.setTrackMatte(matte, TrackMatteType.ALPHA)`, with the old `trackMatteType` as fallback.
10. **Glyphs:** ✓ and ✗ may be missing from a font. Draw them as shapes.
11. **ES3 only:** no `let`, no arrow functions, no `JSON`. Use `eval("(" + text + ")")` with `f.encoding = "UTF-8"`.
12. **MOGRT export** (`exportAsMotionGraphicsTemplate`) treats its path as a folder and takes minutes per comp.
