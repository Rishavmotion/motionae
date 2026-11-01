# motionae

A Claude Code skill for Apple-style motion graphics, **with or without After Effects**.

- **No After Effects:** Claude writes an HTML film (one file plus `motionkit.js`). You preview it in any browser (Space plays, drag to scrub) and render it to MP4 with [HyperFrames](https://github.com/heygen-com/hyperframes).
- **After Effects:** when you want full control, Claude builds a real `.aep` with ExtendScript. Templates come with a `CONTROLS` layer (colors, speed, animate-out), Essential Graphics fields, and reveals keyed to layer in-points, so retiming means sliding layer bars.

Both routes share one motion language (blur-to-sharp reveals, soft type-on, overshoot pops, counters) and a catalog of 23 components: titles, stats, charts, UI cards, a calendar, checklists, notifications and more.

## Install

Copy this folder to `~/.claude/skills/motionae` (all projects) or `<project>/.claude/skills/motionae` (one project). Then ask Claude for a motion graphic.

## Requirements

| Route | Needs |
|---|---|
| Preview | Any browser |
| MP4 render | Node.js 22+ and FFmpeg (HyperFrames runs via `npx`) |
| After Effects | AE 2024+ on macOS. On Windows the scripts run through `AfterFX.exe -r`; see `references/after-effects.md` |
| Sounds | Python 3 (`tools/generate_sfx.py` synthesizes 16 subtle UI sounds, royalty-free) |

## Try it

```bash
scripts/new.sh calendar ./my-calendar        # then open my-calendar/index.html
scripts/render.sh ./my-calendar out.mp4      # 8 s at 1080p in about 10 s
```

## Layout

```
SKILL.md                    what Claude reads first: picks the route
references/style.md         the motion language: palette, type, timing numbers, sound cues
references/web.md           HTML film contract + MotionKit API
references/after-effects.md AE setup, starter script, helpers, gotchas
references/catalog.md       23 components with fields and sound cues
kit/motionkit.js            time-pure helpers for the web route
templates/calendar/         a finished example film
ae/motionkit.jsxinc         ExtendScript helper library (AE route)
ae/edit_engine.jsx          edit.json → kinetic-caption talking-head edit
scripts/new.sh render.sh ae.sh
tools/generate_sfx.py
```

Fonts: designs are set in SF Pro, which Apple licenses for its own platforms, so it isn't included. The web route uses `system-ui`; the AE route falls back to an installed sans.

## License

MIT. See `LICENSE`.
