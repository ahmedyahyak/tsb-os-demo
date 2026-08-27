/* ═══════════════════════════════════════════════════════════════════════════
   The orbit.

   مدار means orbit, and the mark is already a ring with a copper satellite.
   So the scene is the mark, animated, and it is also the product: your
   business held in orbit around you, which is what the context graph is.

   The colour rule carries the meaning and is not decoration. Copper is human,
   ice is machine. You are the copper point at the centre. Everything the
   system holds orbits in ice. When something needs your word it warms to
   copper and pulls forward, which is the permission ring, shown.

   Hand written projection, no libraries. Drag to rotate, click a body to see
   what is known about it.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var cv = document.getElementById('orbit');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function token(n) {
    return getComputedStyle(document.documentElement).getPropertyValue(n).trim();
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

  function fit() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function project(x, y, z) {
    var ca = Math.cos(st.ang), sa = Math.sin(st.ang);
    var rx = x * ca - z * sa, rz = x * sa + z * ca;
    var ct = Math.cos(st.tilt), stl = Math.sin(st.tilt);
    var ry = y * ct - rz * stl, rzz = y * stl + rz * ct;
    var tz = rzz + 300, f = (Math.min(W, H * 1.5) * 0.60) / Math.max(tz, 1);
    // s is the perspective scale, used directly as a radius multiplier.
    // Scaling it by 300 made the centre dot 2300px wide and filled the canvas.
    return { X: W / 2 + rx * f, Y: H / 2 + ry * f * 1.05, s: f, z: tz };
  }
  function place(b) {
    var x = Math.cos(b.a) * b.r;
    var z = Math.sin(b.a) * b.r;
    var y = Math.sin(b.a) * b.r * Math.sin(b.tilt) * 0.5;
    return project(x, y * 0.6, z);
  }

  function draw() {
    var copper = token('--copper') || '#F2926B';
    var ice = token('--ice') || '#9BC1E0';
    var faint = token('--faint') || '#525C6E';
    ctx.clearRect(0, 0, W, H);

    /* the rings themselves, drawn as paths so the geometry reads as orbit */
    RINGS.forEach(function (r, ri) {
      ctx.beginPath();
      for (var t = 0; t <= 64; t++) {
        var a = (t / 64) * Math.PI * 2;
        var tl = 0.30 + ri * 0.16;
        var p = project(Math.cos(a) * r, Math.sin(a) * r * Math.sin(tl) * 0.3, Math.sin(a) * r);
        t === 0 ? ctx.moveTo(p.X, p.Y) : ctx.lineTo(p.X, p.Y);
      }
      ctx.closePath();
      ctx.strokeStyle = ice; ctx.globalAlpha = 0.09; ctx.lineWidth = 1; ctx.stroke();
    });
    ctx.globalAlpha = 1;

    var pts = BODIES.map(function (b) { return { b: b, p: place(b) }; })
                    .sort(function (m, n) { return n.p.z - m.p.z; });

    /* a thread from centre to anything waiting on the owner */
    var c0 = project(0, 0, 0);
    pts.forEach(function (o) {
      if (!o.b.hot) return;
      ctx.beginPath(); ctx.moveTo(c0.X, c0.Y); ctx.lineTo(o.p.X, o.p.Y);
      ctx.strokeStyle = copper; ctx.globalAlpha = 0.20 + Math.sin(pulse) * 0.12;
      ctx.lineWidth = 1; ctx.stroke();
    });
    ctx.globalAlpha = 1;

    pts.forEach(function (o) {
      var b = o.b, p = o.p;
      var live = b.hot || sel === b || hover === b;
      var rad = Math.max(2.4, (live ? 5.4 : 3.4) * p.s);
      ctx.globalAlpha = Math.max(0.28, Math.min(1, (420 - p.z) / 200));
      ctx.fillStyle = live ? copper : ice;
      if (b.hot) { ctx.shadowColor = copper; ctx.shadowBlur = 10 + Math.sin(pulse) * 6; }
      ctx.beginPath(); ctx.arc(p.X, p.Y, rad, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      if (p.z < 300 || live) {
        ctx.globalAlpha = live ? 1 : Math.max(0.25, Math.min(0.72, (420 - p.z) / 190));
        ctx.fillStyle = live ? copper : faint;
        ctx.font = (live ? '600 ' : '') + '11px "IBM Plex Mono", ui-monospace, monospace';
        // Flip the label to the left when it would run off the canvas, so a
        // body near the right edge is still readable instead of clipped.
        var lw = ctx.measureText(b.l).width;
        var lx = p.X + rad + 7;
        if (lx + lw > W - 10) lx = p.X - rad - 7 - lw;
        ctx.fillText(b.l, Math.max(8, lx), p.Y + 3.5);
      }
      b._hit = { x: p.X, y: p.Y, r: Math.max(13, rad + 9) };
    });

    /* you, at the centre, and the ring that is the mark */
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(c0.X, c0.Y, 17 * c0.s, 0, Math.PI * 2);
    ctx.strokeStyle = copper; ctx.globalAlpha = 0.34; ctx.lineWidth = 1; ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = copper;
    ctx.beginPath(); ctx.arc(c0.X, c0.Y, 5.6 * c0.s, 0, Math.PI * 2); ctx.fill();
    ctx.font = '600 11px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText('you', c0.X + 13, c0.Y + 4);
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

  function at(e) {
    var r = cv.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top, best = null, bd = 1e9;
    BODIES.forEach(function (b) {
      if (!b._hit) return;
      var d = Math.hypot(b._hit.x - x, b._hit.y - y);
      if (d < b._hit.r && d < bd) { bd = d; best = b; }
    });
    return best;
  }

  var down = false, px = 0, py = 0, moved = 0, hinted = false;
  cv.addEventListener('pointerdown', function (e) {
    down = true; moved = 0; px = e.clientX; py = e.clientY;
    cv.classList.add('drag');
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    var h = document.getElementById('obHint');
    if (!hinted && h) { hinted = true; h.classList.add('gone'); }
  });
  cv.addEventListener('pointermove', function (e) {
    if (down) {
      moved += Math.abs(e.clientX - px) + Math.abs(e.clientY - py);
      st.ang -= (e.clientX - px) * 0.006;
      st.tilt = Math.max(-0.2, Math.min(1.05, st.tilt + (e.clientY - py) * 0.004));
      st.spin = -(e.clientX - px) * 0.0004;
      px = e.clientX; py = e.clientY;
    } else {
      var h = at(e);
      if (h !== hover) { hover = h; cv.style.cursor = h ? 'pointer' : 'grab'; }
    }
  });
  function up(e) {
    if (down && moved < 6) { var b = at(e); if (b) { sel = b; say(b); } }
    down = false; cv.classList.remove('drag');
    try { cv.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', function () { down = false; cv.classList.remove('drag'); });

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
    draw();
    requestAnimationFrame(frame);
  }
  fit();
  window.addEventListener('resize', fit, { passive: true });
  requestAnimationFrame(frame);
})();
