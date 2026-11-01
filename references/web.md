# Web route: HTML films with MotionKit

A film is one `index.html` plus `motionkit.js` next to it.

- **Preview:** opening the file plays it with a player bar.
- **Render:** `npx hyperframes render` (wrapped by `scripts/render.sh`) captures it frame-exact in headless Chrome and encodes MP4.
- **One clock for both:** MotionKit registers one paused GSAP timeline that drives your `render(t)`. The preview plays that timeline, and HyperFrames seeks it.

## The contract (HyperFrames lint enforces most of this)

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script src="motionkit.js"></script>
<div id="root" data-composition-id="main" data-start="0" data-width="1920" data-height="1080" data-duration="8"></div>
<script>
  // build the DOM once into #root, then:
  function render(t) { /* set every style from t alone */ }
  MK.film({ id: 'main', dur: 8, render });
</script>
```

- **`render(t)` is pure and synchronous.** Every varying style comes from `t` alone, so scrubbing backwards gives the same picture.
- **Clocks and randomness:**
  - No `Date.now()`, `performance.now()`, `requestAnimationFrame`, timers, CSS transitions or CSS animations.
  - No unseeded `Math.random`. Lint rejects the clock calls even in helper files.
  - `new Date(y, m, d)` for date math is fine.
- **Positioning:** position elements inside `#root` with `class="abs"`-style absolute CSS and **no `data-start`**. HyperFrames pins timed root children to the top-left.
- **`data-duration`** on `#root` must equal `dur`.
- **Fonts:**
  - A named `font-family` needs an `@font-face` pointing at a local file in the project; otherwise use `system-ui, sans-serif`.
  - Never ship SF Pro files.
- **Images and video:**
  - Images: `<img>` with a local `src`.
  - Video inside a film: a `<video id=… data-start=… data-duration=… muted>` element. HyperFrames owns its playback; never call `.play()`. Don't put it inside an element that also has `data-start`.
- **Sound:** `<audio id="sfx-pop" src="sfx/ui_pop.wav" data-start="2.35" data-duration="1"></audio>`. Every `<audio>` needs an `id`. The render mixes it; the browser preview stays silent.

## MotionKit API (`MK`)

| Call | Does |
|---|---|
| `MK.seg(t,a,b)` | 0..1 progress across [a,b] |
| `MK.lerp(a,b,p)` | Linear interpolation |
| `MK.clamp01` | Clamp to 0..1 |
| `MK.eo` / `ei` / `eio` | Quartic out, cubic in, cubic in-out |
| `MK.eb(x, c=1.6)` | Back-out overshoot |
| `MK.wobble(t, t0, amp, freq=13, decay=5)` | Decaying rotation in degrees |
| `MK.breathe(t, amt, period)` | Scale for holds |
| `MK.reveal(el, t, t0, {d, x, y, s, pop, rot, blur, wobble, out:[t1,dur]})` | The house reveal: sets opacity, transform and filter |
| `MK.typeOn(el, t, t0, {cps, band, blur, y})` | Soft-edge type-on. It splits the element's text into characters once and returns the end time |
| `MK.count(el, t, t0, {from, to, dur, fmt:'#K', decimals, sep})` | Counter text |
| `MK.h(html)` / `MK.$(sel, root)` / `MK.$$(sel, root)` | DOM helpers |
| `MK.film({id, dur, render})` | Registers the timeline (render) or the player (preview) |

`MK.reveal` writes `transform`. To add more (a push, a breathe), append after the call: `el.style.transform += ' translateY(40px)'`.

## Workflow

1. **Start:** `scripts/new.sh <template> ./film`, or write a new `index.html` following the calendar template's structure:
   - a CONFIG block;
   - CSS variables for colors;
   - build once;
   - `render(t)`;
   - `MK.film`.
2. **Lay out the end state first** (the most visible moment), then add entrances with staggered `t0`s from `references/style.md`.
3. **Lint and look:**
   ```bash
   cd film
   npx hyperframes lint
   npx hyperframes snapshot --at 0,1,2,3,4,6
   ```
   Look at the contact sheet. Check that frame 0 shows the subject, nothing overlaps and nothing clips.
4. **Render:** `scripts/render.sh ./film out.mp4 30 2`. Use 60 fps for very fast motion. Expect about 1–2 s of render per second of film at 1080p.
5. **Vertical (9:16):** set `data-width="1080" data-height="1920"` and recompose; never crop.

## Building a component from the catalog

Take its row in `references/catalog.md`:
- its fields become the CONFIG keys;
- its sounds become `<audio>` cues at the listed times;
- its theme gives the colors.

Keep the motion numbers from `references/style.md`.
