# Style: the Apple-style motion language

Distilled from a 52 s reference of Apple-like UI cards and used by both routes.

## Look

- **Palette:** Apple greys plus ONE accent.
  - Light: background #F5F5F7, card #FFFFFF, ink #1D1D1F, secondary #86868B, accent iOS blue #0A84FF.
  - Dark: #1E1E1E / #2C2C2E cards, ink #F5F5F7, secondary #98989D.
  - Per-component accents are fine (the calendar uses #F04E63 with a purple event: #B65CF2 icon, fill mixed 38 % into the ground).
- **Type:** SF Pro Display (system-ui on Apple devices).
  - Headlines bold, tracking −2 to −3 %, sentence case.
  - Labels medium or semibold.
  - Uppercase eyebrows with wide tracking (+30 %).
  - Numbers use tabular figures.
- **Shapes:**
  - Rounded cards (radius 24–32 at 1080p), no borders, shadows very soft (8 % black, 70 px blur) or none.
  - Pills hug their text (padding about 24 px; height = 2 × text cap height).
- **Icons:** 4–5 px strokes, round caps and joins, drawn as SVG paths. No icon fonts, no emoji.

## Motion rules (the numbers)

| Move | Recipe |
|---|---|
| **Reveal** (everything) | Blur to sharp: opacity 0→1, blur 12–22 px→0, travel y +12…60 px→0, scale 0.9–0.96→1, over **0.7 s**, quartic ease-out `1-(1-x)^4` |
| **Stagger** | Parent first, children 0.1–0.2 s apart (avatar → name → badge → stats → button). Grid cells: row × 0.13 s + column × 0.025 s |
| **Pop** (small things: dots, badges, icons, pills) | Scale from 0.2–0.6 with back-out overshoot `1+(c+1)(x-1)^3+c(x-1)^2`, c = 1.6–1.9, over 0.3–0.45 s |
| **Wobble** (bubbles, tooltips, tilted tiles) | Rotation `amp·e^(−5u)·cos(13u)`, amp 8–10°, u = time since the pop |
| **Type-on** | Characters left to right at about 30 cps (titles 12–16 cps); the leading 2–4 characters are faded, blurred 10–14 px and 10 px low |
| **Counter** | Counts with the same quartic ease over 1.4 s; format `#K`, `$#`, `#%`; thousands separator |
| **Make room** | When something appears inside a layout, neighbours slide away (ease-in-out, 0.5 s). Never overlap content |
| **Hold** | Nothing frozen: a 1–2 % push over the whole film, or `breathe` ±0.8 % on a 3.2 s sine |
| **Out** (optional) | Reverse reveal over 0.45 s, quicker than the in |

## Sound cues (subtle, about −12 dB peaks)

Sounds are made by `tools/generate_sfx.py`:

| Moment | Sound |
|---|---|
| Card arrives | `whoosh_in` |
| Type-on | `type_roll` |
| A pop | `ui_pop` / `bubble_in` |
| Highlight | `ding` |
| Toggle or check | `toggle` / `check` |
| Line draw | `draw` |
| Counter | `counter_roll` |
| Swipe | `swipe` |
| Tick | `ui_tick` |

Put one cue on each visible event, at its exact time.
