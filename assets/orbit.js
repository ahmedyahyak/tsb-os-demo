/* ═══════════════════════════════════════════════════════════════════════════
   The orbit.

   مدار means orbit, and the mark is already a ring with a copper satellite.
   So the scene is the mark, animated, and it is also the product: your
   business held in orbit around you, which is what the context graph is.

   The colour rule carries the meaning and is not decoration. Copper is human,
   ice is machine. You are the copper point at the centre. Everything the
   system holds orbits in ice. When something needs your word it warms to
   copper and pulls forward, which is the permission ring, shown.

   Hand written projection, no libraries.

   ── one object, not two ──────────────────────────────────────────────────
   This used to be a canvas sitting inside the context-graph section, which
   put it 1,479px down the page. Nobody scrolled that far, so the site read
   as flat. Now a single fixed, full-viewport canvas draws the scene behind
   the hero, dim and untouchable, and the same scene walks down and lands
   inside the section box as you scroll. Two canvases cross-fading would have
   been easier and would have looked like two canvases cross-fading.

   Everything is driven off the live rect of the landing box, so at the end
   of the scroll the drawing simply tracks the box and appears pinned to it.
   That is also why the sections it passes are translucent rather than solid:
   a fixed layer behind an opaque band is an invisible fixed layer.

   ── why the canvas cannot take pointer events ────────────────────────────
   It covers the whole viewport, so it would eat every click on the page. It
   is pointer-events:none, and .orbit-hit inside the section is the only
   place that listens.

   That hit layer is touch-action:pan-y, not none. With none, a phone user
   swiping up over the graph rotated it instead of scrolling, and on a 380px
   tall full-width block that meant getting stuck. pan-y gives vertical
   swipes back to the browser and keeps horizontal drags for rotation, so
   tilt is mouse-only now. Scrolling past matters more than tilting.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var cv = document.getElementById('orbit');
  if (!cv) return;
  var hit = document.getElementById('orbitHit');
  var hero = document.getElementById('heroTop');
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function token(n) {
    return getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* Blends two colours so a body can be given a lit side and a dark side.
     Reads #rgb, #rrggbb and rgb(), because these come from CSS tokens and the
     browser is free to hand any of those back. */
  function rgbOf(c) {
    c = String(c).trim();
    var m = c.match(/^#([0-9a-f]{3})$/i);
    if (m) return [0, 1, 2].map(function (i) { return parseInt(m[1][i] + m[1][i], 16); });
    m = c.match(/^#([0-9a-f]{6})$/i);
    if (m) return [0, 2, 4].map(function (i) { return parseInt(m[1].substr(i, 2), 16); });
    m = c.match(/(-?[\d.]+)\D+(-?[\d.]+)\D+(-?[\d.]+)/);
    if (m) return [+m[1], +m[2], +m[3]];
    return [155, 193, 224];
  }
  var mixCache = {};
  function mix(a, b, t) {
    var k = a + '|' + b + '|' + t;
    if (mixCache[k]) return mixCache[k];
    var x = rgbOf(a), y = rgbOf(b);
    var o = 'rgb(' + [0, 1, 2].map(function (i) {
      return Math.round(lerp(x[i], y[i], t));
    }).join(',') + ')';
    mixCache[k] = o;
    return o;
  }

  /* The same sample company the rest of the site uses, so the story holds. */
  var BODIES = [
    { l: 'Marina Foods',  ring: 0, k: 'company', d: 'Client since March. Pays on 30 days, always late by four. Omar is the contact, not Hassan.' },
    { l: 'Pulse Fitness', ring: 0, k: 'company', d: 'Ramadan campaign runs from the 12th. Approvals go through Sara before anything is scheduled.' },
    { l: 'Northline',     ring: 0, k: 'company', d: 'Quoted in February, went quiet. Two follow ups sent. Do not chase a third without a reason.' },
    { l: 'Al Noor',       ring: 0, k: 'company', d: 'Site visit Sep 04. Deposit cleared. The brief changed twice, latest version is the one from the 19th.' },

    { l: 'Omar',    ring: 1, k: 'person', d: 'Owns the campaign calendar at Marina Foods. Replies on WhatsApp, never on email.' },
    { l: 'Sara',    ring: 1, k: 'person', d: 'Signs off creative at Pulse Fitness. Wants the Arabic version first, then the English.' },
    { l: 'Hassan',  ring: 1, k: 'person', d: 'Finance at Marina Foods. Invoice 2214 is with him, chased twice, still open.' },
    { l: 'Fatima',  ring: 1, k: 'person', d: 'Operations at Al Noor. The only person who can confirm a site date.' },

    { l: 'No price without you', ring: 2, k: 'rule', d: 'A standing rule you set. No department may put a number in front of a client until you have seen it.' },
    { l: 'Arabic first, Gulf dialect',      ring: 2, k: 'rule', d: 'Learned from three corrections. Gulf dialect, not Egyptian, and the market named in every brief.' },
    { l: 'Invoice 2214',  ring: 2, k: 'open',  d: 'Drafted the chase, matched it to payment 8841, and stopped. It is waiting on your word before it sends.', hot: true },
    { l: 'Sep 04 deadline', ring: 2, k: 'open', d: 'Al Noor site date. Nothing has slipped yet, and the system is watching the two tasks that could slip it.' }
  ];

  var RINGS = [78, 124, 172];
  BODIES.forEach(function (b, i) {
    var per = BODIES.filter(function (x) { return x.ring === b.ring; }).length;
    var idx = BODIES.filter(function (x, j) { return x.ring === b.ring && j < i; }).length;
    b.a = (idx / per) * Math.PI * 2 + b.ring * 0.7;   // start angle
    b.sp = 0.00013 - b.ring * 0.000028;               // outer rings drift slower
    b.tilt = 0.42 + b.ring * 0.22;                    // each shell on its own plane
    b.r = RINGS[b.ring];
  });

  var st = { ang: -0.5, tilt: 0.46, spin: 0 };
  var W = 0, H = 0, sel = null, hover = null, pulse = 0;

  /* Where the scene is drawn this frame, and how loudly. Recomputed from the
     scroll position before every draw, so `project` stays pure. */
  var view = { cx: 0, cy: 0, S: 700, alpha: 0.26, lab: 0, dot: 0.72, on: false };

  function fit() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* The scroll drive. p is 0 while the landing box is still below the fold
     and 1 once its centre reaches the middle of the viewport, after which it
     stays 1 and the scene simply follows the box up the page. */
  function frameView() {
    var vh = window.innerHeight, vw = window.innerWidth;
    var hr = hit ? hit.getBoundingClientRect() : null;
    if (!hr) { view.on = false; return; }
    var boxC = hr.top + hr.height / 2;
    var p = 1 - clamp((boxC - vh * 0.5) / (vh * 0.9), 0, 1);
    var pe = p * p * (3 - 2 * p);                       // smoothstep

    var heroC = vh * 0.46;
    if (hero) { var e = hero.getBoundingClientRect(); heroC = e.top + e.height * 0.5; }

    view.cx = lerp(vw * 0.5, hr.left + hr.width / 2, pe);
    view.cy = lerp(heroC, boxC, pe);
    view.S = lerp(Math.max(vw, vh) * 0.95, Math.min(hr.width, hr.height * 1.5), pe);
    view.alpha = lerp(0.26, 1, pe);
    view.dot = lerp(0.5, 1, pe);          // finer behind the headline
    view.lab = clamp((p - 0.55) / 0.35, 0, 1);
    /* Twelve mono labels do not fit across a phone: they landed on top of each
       other and read as a broken render. Narrow screens label only what is
       live, and tapping a dot is how you name the rest. */
    view.dense = W >= 700;
    /* Labels are clamped to the box the scene has landed in, not to the
       viewport. The canvas is full width now, so a viewport clamp let a label
       on the right hand side run underneath the panel column. */
    view.L = lerp(8, hr.left + 8, pe);
    view.R = lerp(vw - 8, hr.right - 8, pe);
    view.on = p > 0.72;                                 // interaction gate
    /* Nothing on screen, nothing to draw. */
    view.skip = view.cy < -vh * 0.9 || view.cy > vh * 1.9;
  }

  function project(x, y, z) {
    var ca = Math.cos(st.ang), sa = Math.sin(st.ang);
    var rx = x * ca - z * sa, rz = x * sa + z * ca;
    var ct = Math.cos(st.tilt), stl = Math.sin(st.tilt);
    var ry = y * ct - rz * stl, rzz = y * stl + rz * ct;
    var tz = rzz + 300, f = (view.S * 0.60) / Math.max(tz, 1);
    // s is the perspective scale, used directly as a radius multiplier.
    // Scaling it by 300 made the centre dot 2300px wide and filled the canvas.
    return { X: view.cx + rx * f, Y: view.cy + ry * f * 1.05, s: f, z: tz };
  }
  function place(b) {
    var x = Math.cos(b.a) * b.r;
    var z = Math.sin(b.a) * b.r;
    var y = Math.sin(b.a) * b.r * Math.sin(b.tilt) * 0.5;
    return project(x, y * 0.6, z);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (view.skip) { BODIES.forEach(function (b) { b._hit = null; }); return; }
    var copper = token('--copper') || '#F2926B';
    var ice = token('--ice') || '#9BC1E0';
    var faint = token('--faint') || '#7A8497';
    var A = view.alpha;

    /* The rings, drawn segment by segment rather than as one closed path.
       A path stroked at a single alpha reads as a flat ellipse, because the
       near half and the far half look identical and nothing tells the eye
       which is which. Fading each segment by its own depth is what makes the
       ring pass in front of and behind the centre, and it is most of the
       reason this looks three dimensional at all. */
    RINGS.forEach(function (r, ri) {
      var tl = 0.30 + ri * 0.16;
      var prev = null;
      for (var t = 0; t <= 64; t++) {
        var a = (t / 64) * Math.PI * 2;
        var p = project(Math.cos(a) * r, Math.sin(a) * r * Math.sin(tl) * 0.3, Math.sin(a) * r);
        if (prev) {
          var depth = clamp((420 - (p.z + prev.z) / 2) / 260, 0, 1);
          ctx.beginPath(); ctx.moveTo(prev.X, prev.Y); ctx.lineTo(p.X, p.Y);
          ctx.strokeStyle = ice;
          ctx.globalAlpha = (0.05 + depth * 0.17) * A;
          ctx.lineWidth = 0.7 + depth * 0.7;
          ctx.stroke();
        }
        prev = p;
      }
    });
    ctx.globalAlpha = 1;

    var pts = BODIES.map(function (b) { return { b: b, p: place(b) }; })
                    .sort(function (m, n) { return n.p.z - m.p.z; });

    /* a thread from centre to anything waiting on the owner */
    var c0 = project(0, 0, 0);
    pts.forEach(function (o) {
      if (!o.b.hot) return;
      ctx.beginPath(); ctx.moveTo(c0.X, c0.Y); ctx.lineTo(o.p.X, o.p.Y);
      ctx.strokeStyle = copper; ctx.globalAlpha = (0.20 + Math.sin(pulse) * 0.12) * A;
      ctx.lineWidth = 1; ctx.stroke();
    });
    ctx.globalAlpha = 1;

    pts.forEach(function (o) {
      var b = o.b, p = o.p;
      var live = b.hot || sel === b || hover === b;
      /* Capped. Perspective spreads p.s across nearly 4x, and unclamped the
         near bodies rendered as 36px copper discs that read as planets rather
         than as points of data. The floor keeps the far ones from vanishing. */
      var rad = clamp((live ? 5.4 : 3.4) * p.s * view.dot, 2.4, live ? 9 : 6.5);
      ctx.globalAlpha = Math.max(0.28, Math.min(1, (420 - p.z) / 200)) * A;
      var col = live ? copper : ice;

      /* A flat disc is a dot on a screen. A radial gradient with the light
         off the top left is a small sphere, and it costs one gradient. */
      var g = ctx.createRadialGradient(
        p.X - rad * 0.34, p.Y - rad * 0.34, rad * 0.08, p.X, p.Y, rad);
      g.addColorStop(0, mix(col, '#ffffff', 0.55));
      g.addColorStop(0.55, col);
      g.addColorStop(1, mix(col, '#000000', 0.34));
      ctx.fillStyle = g;
      if (b.hot) { ctx.shadowColor = copper; ctx.shadowBlur = (10 + Math.sin(pulse) * 6) * A; }
      ctx.beginPath(); ctx.arc(p.X, p.Y, rad, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      /* Bloom, additively, so overlapping light adds up the way light does.
         Only on what is lit and near, which keeps it a highlight rather than
         a haze over the whole scene. */
      if (live && p.z < 340) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var bl = ctx.createRadialGradient(p.X, p.Y, rad * 0.5, p.X, p.Y, rad * 4.2);
        bl.addColorStop(0, mix(col, '#000000', 0.62));
        bl.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = (0.5 + Math.sin(pulse) * 0.16) * A;
        ctx.fillStyle = bl;
        ctx.beginPath(); ctx.arc(p.X, p.Y, rad * 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      /* Labels are the part that would turn the hero into noise, so they only
         arrive once the scene is most of the way into its box. */
      if (view.lab > 0.02 && (view.dense || live) && (p.z < 300 || live)) {
        ctx.globalAlpha = (live ? 1 : Math.max(0.25, Math.min(0.72, (420 - p.z) / 190))) * view.lab;
        ctx.fillStyle = live ? copper : faint;
        ctx.font = (live ? '600 ' : '') + '11px "IBM Plex Mono", ui-monospace, monospace';
        // Flip the label to the left when it would run off the canvas, so a
        // body near the right edge is still readable instead of clipped.
        var lw = ctx.measureText(b.l).width;
        var lx = p.X + rad + 7;
        if (lx + lw > view.R) lx = p.X - rad - 7 - lw;
        ctx.fillText(b.l, clamp(lx, view.L, Math.max(view.L, view.R - lw)), p.Y + 3.5);
      }
      b._hit = { x: p.X, y: p.Y, r: Math.max(13, rad + 9) };
    });

    /* you, at the centre, and the ring that is the mark */
    var ringR = Math.min(17 * c0.s, 30);
    var youR = Math.min(5.6 * c0.s * view.dot, 8);
    ctx.beginPath(); ctx.arc(c0.X, c0.Y, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = copper; ctx.globalAlpha = 0.34 * A; ctx.lineWidth = 1; ctx.stroke();
    /* You are the only light source in the scene, so the centre gets the
       bloom whether or not anything is waiting on you. */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var cg = ctx.createRadialGradient(c0.X, c0.Y, youR * 0.4, c0.X, c0.Y, ringR * 2.6);
    cg.addColorStop(0, mix(copper, '#000000', 0.66));
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.6 * A; ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(c0.X, c0.Y, ringR * 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = A;
    var yg = ctx.createRadialGradient(
      c0.X - youR * 0.34, c0.Y - youR * 0.34, youR * 0.08, c0.X, c0.Y, youR);
    yg.addColorStop(0, mix(copper, '#ffffff', 0.6));
    yg.addColorStop(0.55, copper);
    yg.addColorStop(1, mix(copper, '#000000', 0.3));
    ctx.fillStyle = yg;
    ctx.beginPath(); ctx.arc(c0.X, c0.Y, youR, 0, Math.PI * 2); ctx.fill();
    if (view.lab > 0.02) {
      ctx.globalAlpha = view.lab;
      ctx.font = '600 11px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillText('you', c0.X + 13, c0.Y + 4);
    }
    ctx.globalAlpha = 1;
  }

  /* ── panel ─────────────────────────────────────────────────────────── */
  var kEl = document.getElementById('obKind');
  var tEl = document.getElementById('obTitle');
  var dEl = document.getElementById('obBody');
  function say(b) {
    if (!kEl) return;
    var KIND = { company: 'a client it knows', person: 'a person it knows',
                 rule: 'a standing rule you set', open: 'waiting on your word' };
    kEl.textContent = KIND[b.k] || '';
    kEl.style.color = b.hot ? 'var(--copper)' : 'var(--ice)';
    tEl.textContent = b.l;
    dEl.textContent = b.d;
  }
  say(BODIES.filter(function (b) { return b.hot; })[0] || BODIES[0]);

  /* The canvas is fixed to the viewport, so a body's drawn X/Y already are
     client coordinates and the pointer needs no conversion. */
  function at(e) {
    var x = e.clientX, y = e.clientY, best = null, bd = 1e9;
    BODIES.forEach(function (b) {
      if (!b._hit) return;
      var d = Math.hypot(b._hit.x - x, b._hit.y - y);
      if (d < b._hit.r && d < bd) { bd = d; best = b; }
    });
    return best;
  }

  if (hit) {
    var down = false, px = 0, py = 0, moved = 0, hinted = false, mouse = false;
    hit.addEventListener('pointerdown', function (e) {
      if (!view.on) return;
      down = true; moved = 0; px = e.clientX; py = e.clientY;
      mouse = e.pointerType === 'mouse';
      hit.classList.add('drag');
      try { hit.setPointerCapture(e.pointerId); } catch (_) {}
      var h = document.getElementById('obHint');
      if (!hinted && h) { hinted = true; h.classList.add('gone'); }
    });
    hit.addEventListener('pointermove', function (e) {
      if (down) {
        moved += Math.abs(e.clientX - px) + Math.abs(e.clientY - py);
        st.ang -= (e.clientX - px) * 0.006;
        /* Touch keeps its vertical axis for scrolling, so tilt is mouse only. */
        if (mouse) st.tilt = clamp(st.tilt + (e.clientY - py) * 0.004, -0.2, 1.05);
        st.spin = -(e.clientX - px) * 0.0004;
        px = e.clientX; py = e.clientY;
      } else if (view.on) {
        var h = at(e);
        if (h !== hover) { hover = h; hit.style.cursor = h ? 'pointer' : 'grab'; }
      }
    });
    function up(e) {
      if (down && moved < 6) { var b = at(e); if (b) { sel = b; say(b); } }
      down = false; hit.classList.remove('drag');
      try { hit.releasePointerCapture(e.pointerId); } catch (_) {}
    }
    hit.addEventListener('pointerup', up);
    hit.addEventListener('pointercancel', function () {
      down = false; hit.classList.remove('drag');
    });
  }

  var last = 0;
  function frame(ts) {
    if (!last) last = ts;
    var dt = Math.min(ts - last, 50); last = ts;
    pulse += dt * 0.004;
    if (!reduce) {
      BODIES.forEach(function (b) { b.a += b.sp * dt; });
      st.ang += dt * 0.00004 + st.spin;
      st.spin *= 0.94;
    }
    frameView();
    draw();
    requestAnimationFrame(frame);
  }
  fit();
  window.addEventListener('resize', fit, { passive: true });
  requestAnimationFrame(frame);
})();
