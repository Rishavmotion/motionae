/* MotionKit: time-pure motion helpers for HTML motion graphics.
 * Everything on screen is a function of t (seconds), so a film scrubs, previews and renders frame-exact.
 * Same motion language as the After Effects library (lib.jsxinc): blur-to-sharp reveals, soft type-on,
 * overshoot pops, counters. Open the HTML file directly to preview (player bar), or render it with
 * HyperFrames (`npx hyperframes render`), which drives the same render(t).
 */
(function () {
  var MK = {};
  // ---------------------------------------------------------------- time and easing
  MK.clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  MK.seg = function (t, a, b) { return MK.clamp01((t - a) / (b - a)); };          // 0..1 across [a,b]
  MK.lerp = function (a, b, p) { return a + (b - a) * p; };
  MK.eo = function (x) { x = MK.clamp01(x); return 1 - Math.pow(1 - x, 4); };      // quartic out (the house ease)
  MK.ei = function (x) { x = MK.clamp01(x); return x * x * x; };
  MK.eio = function (x) { x = MK.clamp01(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  MK.eb = function (x, c) { x = MK.clamp01(x); c = c || 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }; // back out
  MK.wobble = function (t, t0, amp, freq, decay) {                                 // decaying rotation, degrees
    var u = t - t0; return u <= 0 ? amp : amp * Math.exp(-(decay || 5) * u) * Math.cos((freq || 13) * u);
  };
  MK.breathe = function (t, amt, period) { return 1 + (amt || .01) * Math.sin(2 * Math.PI * t / (period || 3.2)); };

  // ---------------------------------------------------------------- DOM
  MK.h = function (html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
  MK.$ = function (sel, root) { return (root || document).querySelector(sel); };
  MK.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // Reveal: opacity + travel + scale + rotation + blur, keyed to t0 (the AE A() helper).
  // o: d (dur .7), x, y (travel px), s (scale from, 0..1), pop (overshoot), rot (deg from), blur (px, default 12),
  //    wobble (deg, decaying), out: [t1, dur] fade-out
  MK.reveal = function (el, t, t0, o) {
    o = o || {}; var d = o.d || .7, p = MK.seg(t, t0, t0 + d);
    var e = MK.eo(p), k = o.pop ? MK.eb(p, o.pop === true ? 1.6 : o.pop) : e;
    var op = MK.eo(MK.seg(t, t0, t0 + Math.min(d, .35)));
    if (o.out) { var q = MK.seg(t, o.out[0], o.out[0] + (o.out[1] || .45)); op *= 1 - MK.eo(q); }
    var sc = o.s !== undefined ? MK.lerp(o.s, 1, k) : 1;
    var rot = (o.rot ? o.rot * (1 - k) : 0) + (o.wobble ? MK.wobble(t, t0, o.wobble) : 0);
    var bl = (o.blur === undefined ? 12 : o.blur) * (1 - e);
    el.style.opacity = op;
    el.style.transform = 'translate(' + (o.x || 0) * (1 - k) + 'px,' + (o.y || 0) * (1 - k) + 'px) scale(' + sc + ') rotate(' + rot + 'deg)';
    el.style.filter = bl > .05 ? 'blur(' + bl.toFixed(2) + 'px)' : 'none';
  };

  // Type-on with a soft blurred leading edge (characters). Text stays authored as one string.
  // o: cps (30), band (3 chars of softness), blur (10), y (10)
  MK.typeOn = function (el, t, t0, o) {
    o = o || {};
    if (!el._mkChars) {
      var s = el.textContent; el.textContent = ''; el.setAttribute('aria-label', s);
      el._mkChars = Array.prototype.map.call(s, function (c) {
        var sp = document.createElement('span'); sp.textContent = c; sp.style.display = 'inline-block';
        sp.style.whiteSpace = 'pre'; sp.setAttribute('aria-hidden', 'true'); el.appendChild(sp); return sp;
      });
    }
    var cps = o.cps || 30, band = (o.band || 3) / cps;
    el._mkChars.forEach(function (sp, i) {
      var p = MK.eo(MK.seg(t, t0 + i / cps, t0 + i / cps + band));
      sp.style.opacity = p; sp.style.transform = 'translateY(' + (o.y === undefined ? 10 : o.y) * (1 - p) + 'px)';
      sp.style.filter = p < 1 ? 'blur(' + ((o.blur || 10) * (1 - p)).toFixed(2) + 'px)' : 'none';
    });
    return t0 + el._mkChars.length / cps + band;   // end time
  };

  // Counter: '#' in fmt is the number. o: from (0), to, dur (1.4), decimals (0), sep (true)
  MK.count = function (el, t, t0, o) {
    var v = MK.lerp(o.from || 0, o.to, MK.eo(MK.seg(t, t0, t0 + (o.dur || 1.4))));
    var s = v.toFixed(o.decimals || 0);
    if (o.sep !== false) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    el.textContent = (o.fmt || '#').replace('#', s);
  };

  // ---------------------------------------------------------------- the film
  // MK.film({ id:'main', dur: 8, render(t) {} }) after the DOM is built.
  // In HyperFrames (window.__timelines exists) it registers a paused GSAP timeline whose tween drives render(t).
  // Opened as a plain file it adds a player bar and scales the stage to the window.
  MK.film = function (cfg) {
    var id = cfg.id || 'main', dur = cfg.dur, render = cfg.render;
    var root = document.querySelector('[data-composition-id="' + id + '"]');
    // one paused timeline drives render(t): HyperFrames seeks it frame by frame, the preview plays it
    var tl = null, P = { _t: 0, get t() { return this._t; }, set t(v) { this._t = v; render(v); } };
    if (window.gsap) {
      tl = gsap.timeline({ paused: true });
      tl.fromTo(P, { t: 0 }, { t: dur, duration: dur, ease: 'none' }, 0);
    }
    render(0);
    if (window.__timelines) { window.__timelines[id] = tl; return; }   // rendering: nothing else
    // ---- preview player (never part of a render)
    var W = +root.getAttribute('data-width') || 1920, H = +root.getAttribute('data-height') || 1080;
    document.documentElement.style.cssText += ';height:100%;background:#111';
    document.body.style.cssText += ';margin:0;height:100%;overflow:hidden;background:#111;width:auto';
    root.style.position = 'absolute'; root.style.width = W + 'px'; root.style.height = H + 'px';
    root.style.transformOrigin = '0 0';
    var bar = MK.h('<div style="position:fixed;left:0;right:0;bottom:0;height:52px;display:flex;align-items:center;gap:12px;padding:0 16px;background:#1c1c1e;color:#f5f5f7;font:13px -apple-system,system-ui,sans-serif;z-index:9">' +
      '<button style="width:64px;height:32px;border:0;border-radius:8px;background:#3a3a3c;color:#f5f5f7;font:inherit;cursor:pointer">Play</button>' +
      '<input type="range" min="0" max="' + dur + '" step="0.001" value="0" style="flex:1" aria-label="Scrub">' +
      '<span style="width:96px;text-align:right;font-variant-numeric:tabular-nums">0.00 s</span></div>');
    document.body.appendChild(bar);
    var btn = bar.children[0], rng = bar.children[1], lab = bar.children[2];
    function fit() { var s = Math.min(innerWidth / W, (innerHeight - 52) / H); root.style.transform = 'scale(' + s + ')';
      root.style.left = (innerWidth - W * s) / 2 + 'px'; root.style.top = (innerHeight - 52 - H * s) / 2 + 'px'; }
    addEventListener('resize', fit); fit();
    function label() { rng.value = P.t; lab.textContent = P.t.toFixed(2) + ' s'; }
    if (!tl) { btn.disabled = true; btn.textContent = 'GSAP?'; rng.oninput = function () { P.t = +rng.value; label(); }; return; }
    tl.repeat(-1).eventCallback('onUpdate', label);
    function toggle() { if (tl.paused()) { tl.play(); btn.textContent = 'Pause'; } else { tl.pause(); btn.textContent = 'Play'; } }
    btn.onclick = toggle;
    rng.oninput = function () { tl.pause(); btn.textContent = 'Play'; tl.seek(+rng.value); label(); };
    addEventListener('keydown', function (e) { if (e.code === 'Space') { e.preventDefault(); toggle(); } });
    toggle();
  };

  window.MK = MK;
})();
