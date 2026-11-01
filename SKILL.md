---
name: motionae
description: Make Apple-style motion graphics (kinetic titles, stat counters, charts, UI cards, calendars, checklists, lower thirds, notifications) either without After Effects, as HTML that previews in a browser and renders to MP4, or inside After Effects when the user wants full layer control and editable templates. Use for any "make a motion graphic / animation / animated title / overlay" request, and for anything After Effects.
---

# motionae: motion graphics with or without After Effects

One motion language, two routes. Pick the route first, then build.

## 1. Pick the route

| Situation | Route |
|---|---|
| Default. The user wants a video or a preview, doesn't mention AE, or has no AE | **Web**: an HTML film, previewed in the browser and rendered to MP4 |
| The user asks for After Effects, editable layers, Essential Graphics, MOGRTs, or wants to keyframe it themselves | **AE**: ExtendScript builds a real `.aep` |
| Unsure | Build Web first (fast, no install), then offer: "Want this as an editable After Effects project too?" |

Both routes share the style rules (`references/style.md`) and the component catalog (`references/catalog.md`: 23 proven designs with their fields and sound cues). A component built in one route can be rebuilt in the other from the same spec.

## 2. Web route (no After Effects)

Needs only a browser to preview. To render MP4: Node 22+ and FFmpeg (HyperFrames, which runs via `npx`).

1. **Start from a template if one fits:** `scripts/new.sh list`, then `scripts/new.sh calendar ./my-film`. Otherwise write `index.html` from scratch using `kit/motionkit.js` (copy it next to the file).
2. **Edit the CONFIG block and styles.** Everything on screen is a pure function of `t` in one `render(t)`. Read `references/web.md` before writing a new film.
3. **Preview:** open `index.html` in a browser. It has a player bar: Space plays and pauses, the slider scrubs.
4. **Check frames:** `npx hyperframes snapshot --at 0,1,2.5,4` inside the project, then look at the contact sheet before calling it done.
5. **Render:** `scripts/render.sh ./my-film out.mp4 [fps=30] [workers=2]`. The 8 s calendar renders in about 10 s.

**Inside claude.ai, with no terminal:** an Artifact "Motion" type (if offered) plays the same kind of `render(t)` film. Port the scene there and use the type's own instructions.

## 3. AE route

Needs After Effects on macOS (Windows: see `references/after-effects.md`). With AE open:

- `scripts/ae.sh ping`: AE version and open project. It finds the newest installed AE; override with `AE_APP="Adobe After Effects 2025"`.
- `scripts/ae.sh run build.jsx`: run a build script. `ae.sh eval '<code>'` runs a snippet and prints its result or `ERROR line N`.
- `scripts/ae.sh stills proj.aep "Comp" outdir 0.5 2 4`: review frames.
- `scripts/ae.sh render proj.aep "Comp" out.mp4`: render to MP4.

Build with `ae/motionkit.jsxinc`. It gives a `CONTROLS` layer with colors and speed, Essential Graphics fields, and expression reveals keyed to in-points, so retiming means sliding layer bars. Sounds come from `python3 tools/generate_sfx.py <dir>`. `references/after-effects.md` has the starter script and the gotchas that each cost a debugging round. Read it before writing ExtendScript.

## 4. Always

- **Look before you claim it works.** Use a contact sheet of frames (web: `hyperframes snapshot`; AE: `ae.sh stills`).
- **Frame 0 is the thumbnail.** Start the first entrance slightly before 0 so frame 0 already shows the title.
- **Nothing sits frozen:** add a slow push (1–2 %) or breathe on holds.
- **Keep the machine cool:** 2 render workers, `nice`, one heavy job at a time.
- **Fonts:** SF Pro is Apple-licensed. Never bundle or ship it. The web route uses `system-ui` (SF on Apple devices); the AE route falls back to any installed sans (`FONT_FALLBACK` in the jsxinc).
