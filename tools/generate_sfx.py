"""Generate the subtle UI sound-effect set for the Apple-style motion library.
Pure stdlib (no numpy). 48 kHz / 24-bit mono WAVs, peak-normalised quietly."""
import math, random, struct, wave, os, sys

SR = 48000
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "sfx")
rng = random.Random(7)

def silence(sec): return [0.0] * int(SR * sec)

def mix(dst, src, at=0.0, gain=1.0):
    o = int(at * SR)
    need = o + len(src)
    if need > len(dst): dst.extend([0.0] * (need - len(dst)))
    for i, s in enumerate(src): dst[o + i] += s * gain
    return dst

def tone(freqs, dur, decay, attack=0.002, sweep=None):
    """freqs: list of (hz, amp). sweep: (f_start_mult, f_end_mult, sweep_time) exponential."""
    n = int(SR * dur); out = []; ph = [0.0] * len(freqs)
    for i in range(n):
        t = i / SR
        m = 1.0
        if sweep:
            a, b, st = sweep
            x = min(t / st, 1.0)
            m = a * (b / a) ** x
        env = min(t / attack, 1.0) * math.exp(-t / decay)
        s = 0.0
        for k, (f, amp) in enumerate(freqs):
            ph[k] += 2 * math.pi * f * m / SR
            s += amp * math.sin(ph[k])
        out.append(s * env)
    return out

def noise_burst(dur, decay, lo, hi, attack=0.0005):
    """Band-limited noise burst via one-pole HP + LP."""
    n = int(SR * dur); out = []
    lp = hp_prev_in = hp_prev_out = 0.0
    a_lp = math.exp(-2 * math.pi * hi / SR)
    a_hp = math.exp(-2 * math.pi * lo / SR)
    for i in range(n):
        t = i / SR
        x = rng.uniform(-1, 1)
        lp = (1 - a_lp) * x + a_lp * lp
        hp = a_hp * (hp_prev_out + lp - hp_prev_in)
        hp_prev_in, hp_prev_out = lp, hp
        env = min(t / attack, 1.0) * math.exp(-t / decay)
        out.append(hp * env)
    return out

def swept_noise(dur, f0, f1, q=1.4, shape=None):
    """State-variable band-pass on white noise with an exponential centre sweep."""
    n = int(SR * dur); out = []; low = band = 0.0
    for i in range(n):
        x = i / n
        fc = f0 * (f1 / f0) ** x
        f = 2 * math.sin(math.pi * min(fc, SR / 6) / SR)
        inp = rng.uniform(-1, 1)
        high = inp - low - band / q
        band += f * high
        low += f * band
        env = shape(x) if shape else math.sin(math.pi * x) ** 2
        out.append(band * env)
    return out

def reverb(sig, wet=0.15, tail=0.4):
    """Tiny Schroeder reverb for air on tonal sounds."""
    sig = sig + silence(tail)
    combs = [(1557, .78), (1617, .76), (1491, .77), (1422, .75)]
    acc = [0.0] * len(sig)
    for d, g in combs:
        buf = [0.0] * d; idx = 0
        for i, s in enumerate(sig):
            y = buf[idx]; buf[idx] = s + y * g; idx = (idx + 1) % d
            acc[i] += y * 0.25
    for d, g in [(225, .5), (556, .5)]:
        buf = [0.0] * d; idx = 0
        for i, s in enumerate(acc):
            b = buf[idx]; y = -s + b; buf[idx] = s + b * g; idx = (idx + 1) % d
            acc[i] = y
    return [s + wet * r for s, r in zip(sig, acc)]

def finish(sig, peak_db=-8.0, fade_ms=4):
    f = int(SR * fade_ms / 1000)
    for i in range(min(f, len(sig))): sig[-1 - i] *= i / f
    # trim trailing near-silence
    thr = 1e-4 * max(1e-9, max(abs(s) for s in sig))
    end = len(sig)
    while end > 1 and abs(sig[end - 1]) < thr: end -= 1
    sig = sig[:end + int(SR * 0.01)]
    pk = max(abs(s) for s in sig) or 1.0
    g = 10 ** (peak_db / 20) / pk
    return [s * g for s in sig]

def write(name, sig, peak_db=-8.0):
    sig = finish(sig, peak_db)
    path = os.path.join(OUT, name + ".wav")
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(3); w.setframerate(SR)
        frames = bytearray()
        for s in sig:
            v = int(max(-1, min(1, s)) * 8388607)
            frames += struct.pack("<i", v)[:3]
        w.writeframes(bytes(frames))
    print(f"{name:18s} {len(sig)/SR:5.2f}s")

def key_click(var=1.0):
    c = noise_burst(0.03, 0.004 * var, 1800, 7000)
    return mix(c, tone([(2600 * var, 0.25)], 0.02, 0.003))

os.makedirs(OUT, exist_ok=True)

# 1. Single soft UI tick (counters, small reveals)
write("ui_tick", mix(noise_burst(0.03, 0.0025, 2500, 9000), tone([(3400, .5)], .03, .004)), -14)
# 2. Soft tap (buttons, pills landing)
write("ui_tap", reverb(mix(tone([(1250, 1), (2500, .25)], .12, .018), noise_burst(.02, .002, 800, 5000), gain=.5), .08, .2), -10)
# 3. Pop (badges, bubbles, avatars)
write("ui_pop", reverb(tone([(520, 1), (1040, .15)], .14, .035, sweep=(.6, 1.9, .05)), .1, .25), -9)
# 4. Bubble in (tooltips / callouts)
write("bubble_in", reverb(tone([(330, 1), (660, .2)], .2, .06, attack=.004, sweep=(.7, 1.8, .09)), .12, .3), -10)
# 5. Soft whoosh in (cards entering)
write("whoosh_in", swept_noise(.55, 350, 2600, shape=lambda x: (x ** 1.6) * (1 - x) ** .35 * 2.2), -12)
# 6. Soft whoosh out
write("whoosh_out", swept_noise(.45, 2600, 450, shape=lambda x: (x ** .35) * (1 - x) ** 1.6 * 2.2), -13)
# 7. Quick swipe (slide transitions, highlight bar moving)
write("swipe", swept_noise(.22, 900, 4500, q=1.0), -14)
# 8. Single key click
write("type_key", key_click(), -14)
# 9. Typing roll ~1s (text reveals)
roll = silence(0.05); t = 0.0
for i in range(14):
    mix(roll, key_click(rng.uniform(.85, 1.15)), t, rng.uniform(.55, 1.0)); t += rng.uniform(.055, .085)
write("type_roll", roll, -13)
# 10. Counter roll: ticks decelerating, settle tick at the end
cr = silence(0.05); n = 26
for i in range(n):
    x = i / (n - 1); at = 1.35 * (1 - (1 - x) ** 0.5) ** 1.0
    at = 1.35 * x ** 2.2
    mix(cr, mix(noise_burst(.025, .002, 3000, 9000), tone([(3000 + 900 * x, .4)], .02, .003)), at, .45 + .3 * x)
mix(cr, reverb(tone([(1568, .9), (3136, .2)], .2, .06), .1, .25), 1.42, 1.0)
write("counter_roll", cr, -11)
# 11. Check / complete (two-note chime)
ck = silence(0.0)
mix(ck, tone([(1046.5, 1), (2093, .18)], .35, .09), 0)
mix(ck, tone([(1568, 1), (3136, .15)], .45, .12), .075)
write("check", reverb(ck, .14, .4), -10)
# 12. Soft ding (notifications, highlight date)
write("ding", reverb(tone([(1760, 1), (2647, .32), (4410, .12), (880, .25)], .9, .28, attack=.003), .16, .5), -11)
# 13. Sparkle (stat reveal accent, subtle)
sp = silence(.05)
for i in range(7):
    f = rng.uniform(3200, 6200)
    mix(sp, tone([(f, 1)], .12, .03, attack=.003), .02 + i * .065 + rng.uniform(0, .02), rng.uniform(.3, .7))
write("sparkle", reverb(sp, .2, .5), -16)
# 14. Toggle / confirm (two low→high clicks)
tg = silence(0)
mix(tg, tone([(900, 1)], .05, .008), 0); mix(tg, tone([(1500, 1)], .06, .01), .055)
write("toggle", reverb(tg, .08, .2), -12)
# 15. Rise (bars growing / lines drawing) - airy, tonal undertone
rs = swept_noise(.7, 300, 1800, q=2.2, shape=lambda x: math.sin(math.pi * x ** .8) ** 2)
mix(rs, tone([(220, .25), (330, .12)], .7, 1.2, attack=.25, sweep=(1, 1.5, .7)), 0, .25)
write("rise", rs, -14)
# 16. Draw (line / connector drawing) - thin pencil-like texture
dr = swept_noise(.5, 2500, 5000, q=3.0, shape=lambda x: (1 - x) ** .3 * min(x * 12, 1))
write("draw", dr, -18)
print("done ->", os.path.abspath(OUT))
