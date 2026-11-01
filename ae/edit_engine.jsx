// ============================================================================
// Kinetic edit builder: edit.json -> After Effects comp (ExtendScript, ES3)
//
//   $.global.EDIT_JSON = "/abs/path/edit.json";   // optional, else file dialog
//   osascript -e 'tell application "Adobe After Effects 2026" to DoScriptFile "/abs/path/build_edit.jsx"'
//
// Moves: knockout, aroll, card, split, hold, montage, cards, logos, logowall, scorecard, texts, subs, cta.
// Paths inside edit.json are relative to the json file's folder.
// ============================================================================

var LOGS = [];
function LOG(s) { LOGS.push(s); }
var FX = "ADBE Effect Parade", TR = "ADBE Transform Group";
var KAPPA = 0.5523;
var POP = 'var t=Math.min(Math.max((time-inPoint)/0.22,0),1);var e=1-Math.pow(1-t,4);mul(value,0.93+0.07*e);';

function hex(h) {
    h = h.replace("#", "");
    return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
}
function fontOK(ps) { try { return app.fonts.getFontsByPostScriptName(ps).length > 0; } catch (e) { return true; } }
var FONT = "SFProDisplay-Bold";
if (!fontOK(FONT)) FONT = fontOK("HelveticaNeue-Bold") ? "HelveticaNeue-Bold" : "GoogleSans-Bold";

function readJSON(f) {
    f.encoding = "UTF-8"; f.open("r"); var s = f.read(); f.close();
    return eval("(" + s + ")");
}
function tr(L, name) { return L.property(TR).property(name); }
function span(L, t0, t1) { L.inPoint = t0; L.outPoint = t1; }

// ---------------------------------------------------------------- primitives
function addText(comp, str, o) {
    var L = comp.layers.addText(str);
    var p = L.property("ADBE Text Properties").property("ADBE Text Document");
    var d = p.value;
    d.resetCharStyle();
    d.font = o.font || FONT;
    d.fontSize = o.size || 96;
    d.applyFill = true;
    d.fillColor = hex(o.color || "#FFFFFF");
    d.applyStroke = false;
    d.tracking = (o.tracking === undefined) ? -15 : o.tracking;
    d.justification = o.align == "left" ? ParagraphJustification.LEFT_JUSTIFY : ParagraphJustification.CENTER_JUSTIFY;
    p.setValue(d);
    // centre (or left-align) on x from the text bounds, on y at cap-height middle (no jump on descenders)
    tr(L, "ADBE Anchor Point").expression =
        'var r=sourceRectAtTime(time,false);[' + (o.align == "left" ? 'r.left' : 'r.left+r.width/2') + ',' + (-(o.size || 96) * 0.36) + '];';
    if (o.pop) tr(L, "ADBE Scale").expression = POP;
    tr(L, "ADBE Position").setValue(o.at || [960, 540]);
    if (o.shadow) shadow(L);
    if (o.t0 !== undefined) span(L, o.t0, o.t1);
    L.name = o.name || str;
    return L;
}

function shadow(L) {
    var ds = L.property(FX).addProperty("ADBE Drop Shadow");
    ds = L.property(FX).property("ADBE Drop Shadow");
    ds.property("ADBE Drop Shadow-0002").setValue(45);   // opacity
    ds.property("ADBE Drop Shadow-0004").setValue(0);    // distance
    ds.property("ADBE Drop Shadow-0005").setValue(28);   // softness
}

// rounded-rect mask in layer pixel space, centred on (cx,cy)
function roundMask(L, cx, cy, W, H, r) {
    var x0 = cx - W / 2, y0 = cy - H / 2, x1 = cx + W / 2, y1 = cy + H / 2, k = KAPPA * r;
    var s = new Shape();
    s.vertices = [[x0 + r, y0], [x1 - r, y0], [x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r]];
    s.inTangents = [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]];
    s.outTangents = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]];
    s.closed = true;
    var m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    m.property("ADBE Mask Shape").setValue(s);
}

// image card: cover-fit into box, rounded corners, quick scale-in
function addCard(comp, item, o) {
    var L = comp.layers.add(item);
    if (item.duration > 0) { L.startTime = o.t0 - (o.src || 0); if (L.hasAudio) L.audioEnabled = false; }
    var W = o.box[0], H = o.box[1];
    var s = Math.max(W / item.width, H / item.height);
    var fy = (o.focusY === undefined) ? 0.5 : o.focusY;
    var cy = item.height / 2;
    var visH = H / s;
    cy = Math.min(Math.max(item.height * fy, visH / 2), item.height - visH / 2);
    roundMask(L, item.width / 2, cy, W / s, visH, (o.radius || 0) / s);
    tr(L, "ADBE Anchor Point").setValue([item.width / 2, cy]);
    tr(L, "ADBE Position").setValue(o.at || [960, 540]);
    tr(L, "ADBE Scale").setValue([s * 100, s * 100]);
    if (o.pop !== false)
        tr(L, "ADBE Scale").expression = POP;
    span(L, o.t0, o.t1);
    return L;
}

function addAroll(comp, item, b, face) {
    var L = comp.layers.add(item);
    L.startTime = 0;
    span(L, b.t0, b.t1);
    L.audioEnabled = false;
    L.name = "A-roll " + b.t0;
    tr(L, "ADBE Anchor Point").setValue(face);
    tr(L, "ADBE Position").setValue(face);
    var z = b.zoom || [100, 100], sc = tr(L, "ADBE Scale");
    sc.setValueAtTime(b.t0, [z[0], z[0]]);
    sc.setValueAtTime(b.t1, [z[1], z[1]]);
    return L;
}


// logo: fit inside [maxW, h], pop in
function addLogo(comp, item, at, h, maxW, t0, t1) {
    var L = comp.layers.add(item);
    var s = Math.min(h / item.height, maxW / item.width) * 100;
    tr(L, "ADBE Position").setValue(at);
    tr(L, "ADBE Scale").setValue([s, s]);
    tr(L, "ADBE Scale").expression = POP;
    tr(L, "ADBE Opacity").expression = 'linear(time,inPoint,inPoint+0.12,0,100);';
    span(L, t0, t1);
    return L;
}

// drawn check / cross in a filled circle
function addMark(comp, ok, at, t0, t1) {
    var L = comp.layers.addShape();
    L.name = ok ? "Check" : "Cross";
    var root = L.property("ADBE Root Vectors Group");
    // first group in Contents draws on top: stroke group before the circle
    var g2 = root.addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    var paths = ok ? [[[-16, 1], [-5, 12], [17, -11]]] : [[[-12, -12], [12, 12]], [[12, -12], [-12, 12]]];
    for (var i = 0; i < paths.length; i++) {
        var sh = new Shape(); sh.vertices = paths[i]; sh.closed = false;
        g2.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(sh);
    }
    var st = g2.addProperty("ADBE Vector Graphic - Stroke");
    st.property("ADBE Vector Stroke Color").setValue([1, 1, 1]);
    st.property("ADBE Vector Stroke Width").setValue(8);
    st.property("ADBE Vector Stroke Line Cap").setValue(2);
    st.property("ADBE Vector Stroke Line Join").setValue(2);
    var g = root.addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    g.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([76, 76]);
    g.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(hex(ok ? "#34C759" : "#FF3B30"));
    tr(L, "ADBE Position").setValue(at);
    tr(L, "ADBE Scale").expression = 'var t=Math.min(Math.max((time-inPoint)/0.3,0),1);var e=1-Math.pow(1-t,3);var o=Math.sin(t*Math.PI)*0.12;[100*(0.6+0.4*e+o),100*(0.6+0.4*e+o)];';
    span(L, t0, t1);
    return L;
}

// white rounded pill with text
function addPill(comp, str, at, W, H, t0, t1) {
    var L = comp.layers.addShape();
    L.name = "Pill";
    var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    var r = g.addProperty("ADBE Vector Shape - Rect");
    r.property("ADBE Vector Rect Size").setValue([W, H]);
    r.property("ADBE Vector Rect Roundness").setValue(H / 2);
    g.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]);
    tr(L, "ADBE Position").setValue(at);
    tr(L, "ADBE Scale").expression = POP;
    shadow(L);
    span(L, t0, t1);
    addText(comp, str, { size: H * 0.42, color: "#000000", at: at, t0: t0, t1: t1, tracking: -5, pop: true });
}

function captions(comp, b, o) {
    var c = b.captions || [];
    for (var i = 0; i < c.length; i++) {
        var t1 = b.t1;
        if (c[i].length > 2) t1 = c[i][2];
        else if (i + 1 < c.length) t1 = c[i + 1][1];
        addText(comp, c[i][0], { size: o.size, color: o.color, at: [960, o.y], t0: c[i][1], t1: t1, shadow: o.shadow });
    }
}

function setMatte(fill, matte) {
    try { fill.setTrackMatte(matte, TrackMatteType.ALPHA); matte.enabled = false; }
    catch (e) { matte.moveBefore(fill); fill.trackMatteType = TrackMatteType.ALPHA; }
}

function counterExpr(from, to, t, dur, suffix) {
    return 'var t=Math.min(Math.max((time-' + t + ')/' + dur + ',0),1);var e=1-Math.pow(1-t,4);' +
        'Math.round(' + from + '+(' + (to - from) + ')*e)+"' + (suffix || "") + '";';
}

// ---------------------------------------------------------------- moves
var MOVES = {
    // 1-3 cards (video or still) in a row, optional labels under, staggered in
    cards: function (comp, b, A) {
        var n = b.items.length, W = b.box[0], H = b.box[1], gap = b.gap || 40;
        var x0 = 960 - ((n - 1) * (W + gap)) / 2, y = b.y || 470;
        for (var i = 0; i < n; i++) {
            var it = b.items[i], t = it.t !== undefined ? it.t : b.t0, x = x0 + i * (W + gap);
            addCard(comp, A[it.clip], { box: b.box, at: [x, y], radius: b.radius || 28, t0: t, t1: b.t1, src: it.src || 0, focusY: it.focusY });
            if (it.label) addText(comp, it.label, { size: b.labelSize || 36, color: "#6E6E73", at: [x, y + H / 2 + 52], t0: t, t1: b.t1, tracking: 0 });
        }
        if (b.tag) addText(comp, b.tag, { size: 42, color: "#86868B", at: [960, b.tagY || 120], t0: b.t0, t1: b.t1, tracking: 0 });
        captions(comp, b, { size: b.capSize || 72, color: "#000000", y: b.capY || 950 });
    },
    // logos in a centred row, each popping in at its time
    logos: function (comp, b, A) {
        var n = b.items.length, h = b.h || 120, cell = b.cell || 620;
        var x0 = 960 - ((n - 1) * cell) / 2;
        for (var i = 0; i < n; i++)
            addLogo(comp, A[b.items[i][0]], [x0 + i * cell, b.y || 500], h, cell - 100, b.items[i][1], b.t1);
        captions(comp, b, { size: b.capSize || 72, color: "#000000", y: b.capY || 900 });
    },
    // grid wall of logos, staggered
    logowall: function (comp, b, A) {
        var cols = b.cols || 4, cw = b.cell[0], ch = b.cell[1], n = b.items.length, rows = Math.ceil(n / cols);
        var x0 = 960 - ((cols - 1) * cw) / 2, y0 = (b.y || 470) - ((rows - 1) * ch) / 2;
        for (var i = 0; i < n; i++) {
            var c = i % cols, r = Math.floor(i / cols);
            addLogo(comp, A[b.items[i]], [x0 + c * cw, y0 + r * ch], b.h || 80, cw - 110, b.t0 + i * (b.stagger || 0.04), b.t1);
        }
        captions(comp, b, { size: b.capSize || 72, color: "#000000", y: b.capY || 960 });
    },
    // questions x versions grid; marks optional
    scorecard: function (comp, b) {
        var cx = b.cols || [1250, 1450, 1650], qx = b.qx || 240, ys = b.ys || [430, 590, 750];
        if (b.title) addText(comp, b.title, { size: 64, color: "#000000", at: [qx, 210], t0: b.titleT || b.t0, t1: b.t1, align: "left" });
        for (var c = 0; c < cx.length; c++)
            addText(comp, b.heads[c], { size: 44, color: "#86868B", at: [cx[c], 290], t0: b.headT || b.t0, t1: b.t1, tracking: 0, pop: true });
        for (var r = 0; r < b.rows.length; r++) {
            var rt = b.rows[r][1];
            addText(comp, b.rows[r][0], { size: 56, color: "#000000", at: [qx, ys[r]], t0: rt, t1: b.t1, align: "left", pop: true });
            if (b.marks) for (var c2 = 0; c2 < cx.length; c2++)
                addMark(comp, b.marks[r][c2], [cx[c2], ys[r]], b.markT[c2] + r * 0.12, b.t1);
        }
        captions(comp, b, { size: b.capSize || 64, color: "#000000", y: b.capY || 960 });
    },
    // overlay texts (no footage): [str, t0, t1, [x,y], size]
    texts: function (comp, b) {
        for (var i = 0; i < b.items.length; i++) {
            var it = b.items[i];
            addText(comp, it[0], { size: it[4] || 96, at: it[3], t0: it[1], t1: it[2], shadow: true, pop: true });
        }
    },
    // overlay captions (white over A-roll by default)
    subs: function (comp, b) {
        captions(comp, b, { size: b.capSize || 84, color: b.capColor || "#FFFFFF", y: b.capY || 965, shadow: b.shadow !== false });
    },
    cta: function (comp, b) {
        addPill(comp, b.text, b.at || [960, 940], b.w || 760, b.h || 120, b.t0, b.t1);
    },
    knockout: function (comp, b, A) {
        var img = addCard(comp, A[b.fill], { box: [comp.width, comp.height], at: [960, 540], t0: b.t0, t1: b.t1, pop: false });
        var sc = tr(img, "ADBE Scale"), s0 = sc.value[0];
        var p = b.push || [100, 108];
        sc.setValueAtTime(b.t0, [s0 * p[0] / 100, s0 * p[0] / 100]);
        sc.setValueAtTime(b.t1, [s0 * p[1] / 100, s0 * p[1] / 100]);
        var txt = addText(comp, b.text, { size: b.size || 520, color: "#000000", at: [960, 540], t0: b.t0, t1: b.t1, tracking: -30 });
        setMatte(img, txt);
    },
    aroll: function (comp, b, A, E) {
        addAroll(comp, A.__aroll, b, E.face);
        captions(comp, b, { size: b.capSize || 84, color: "#FFFFFF", y: b.capY || 965, shadow: true });
    },
    card: function (comp, b, A) {
        addCard(comp, A[b.image], b);
        if (b.tag) addText(comp, b.tag, { size: 42, color: "#86868B", at: [960, b.tagY || 120], t0: b.t0, t1: b.t1, tracking: 0 });
        captions(comp, b, { size: b.capSize || 104, color: b.capColor || "#000000", y: b.capY || 540, shadow: b.shadow });
    },
    split: function (comp, b, A, E) {
        addAroll(comp, A.__aroll, b, E.face);
        addText(comp, b.left.text, { size: 78, at: b.left.at, t0: b.left.t, t1: b.t1, shadow: true });
        var c = b.counter;
        var L = addText(comp, c.from + c.suffix, { size: 78, at: c.at, t0: b.left.t, t1: b.t1, shadow: true, name: "Counter" });
        L.property("ADBE Text Properties").property("ADBE Text Document").expression =
            counterExpr(c.from, c.to, c.t, c.dur || 0.7, c.suffix);
    },
    hold: function (comp, b) {
        var acc = "";
        for (var i = 0; i < b.words.length; i++) {
            acc += (i ? " " : "") + b.words[i][0];
            var t1 = (i + 1 < b.words.length) ? b.words[i + 1][1] : b.t1;
            addText(comp, acc, { size: b.size || 110, color: "#000000", at: [960, 540], t0: b.words[i][1], t1: t1 });
        }
    },
    montage: function (comp, b, A) {
        var n = b.images.length, d = (b.t1 - b.t0) / n;
        for (var i = 0; i < n; i++)
            addCard(comp, A[b.images[i]], { box: b.box, at: b.at, radius: b.radius, t0: b.t0 + i * d, t1: b.t0 + (i + 1) * d, pop: false });
        if (b.counter) {
            var c = b.counter;
            var L = addText(comp, String(c.from), { size: c.size || 260, at: b.at, t0: b.t0, t1: b.t1, shadow: true, name: "Year", tracking: -20 });
            L.property("ADBE Text Properties").property("ADBE Text Document").expression =
                counterExpr(c.from, c.to, b.t0, (b.t1 - b.t0) * 0.9, "");
        }
        if (b.caption) addText(comp, b.caption, { size: 72, color: "#000000", at: [960, b.capY || 950], t0: b.t0, t1: b.t1 });
    }
};

// ---------------------------------------------------------------- main
function build(jsonPath) {
    var jf = new File(jsonPath), base = jf.parent.fsName + "/";
    var E = readJSON(jf), C = E.comp;
    app.beginSuppressDialogs();
    app.beginUndoGroup("Build edit");

    var folder = app.project.items.addFolder(C.name + " assets");
    function imp(rel) {
        var it = app.project.importFile(new ImportOptions(new File(base + rel)));
        it.parentFolder = folder;
        return it;
    }
    var A = {};
    for (var k in E.assets) A[k] = imp(E.assets[k]);
    A.__aroll = imp(E.aroll);

    var comp = app.project.items.addComp(C.name, C.w, C.h, 1, C.dur, C.fps);
    comp.bgColor = [1, 1, 1];
    var bg = comp.layers.addSolid([1, 1, 1], "White", C.w, C.h, 1, C.dur);

    for (var i = 0; i < E.beats.length; i++) {
        var b = E.beats[i];
        if (!MOVES[b.move]) { LOG("unknown move " + b.move); continue; }
        try { MOVES[b.move](comp, b, A, E); LOG("beat " + i + " " + b.move + " ok"); }
        catch (err) { LOG("beat " + i + " " + b.move + " FAILED line " + err.line + ": " + err.toString()); }
    }
    // full-length voice track
    var au = comp.layers.add(A.__aroll);
    au.startTime = 0; au.enabled = false; au.audioEnabled = true; au.name = "VO";
    au.moveToEnd();
    bg.moveToEnd();

    app.endUndoGroup();
    if (E.save) app.project.save(new File(base + E.save));
    comp.openInViewer();
    app.endSuppressDialogs(false);
    return comp;
}

try {
    var P = $.global.EDIT_JSON;
    if (!P) { var f = File.openDialog("Pick edit.json"); P = f ? f.fsName : null; }
    if (P) build(P);
} catch (e) {
    LOG("ERROR line " + e.line + ": " + e.toString());
}
var lf = new File((new File($.fileName)).parent.fsName + "/build.log");
lf.open("w"); lf.write(LOGS.join("\n")); lf.close();
