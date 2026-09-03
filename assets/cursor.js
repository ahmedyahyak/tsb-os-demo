/* The approval ring.

   Madar's whole thesis is one sentence: it does the work, and it waits for
   your yes on anything it cannot undo. So the cursor is that sentence made
   physical. An ice ring follows the hand with the damped lag of a machine
   tracking an input. Over anything you can act on it warms to copper, the
   colour this system reserves for "this needs you", and over the one primary
   action on a page it says the word. Nothing else on the page ever borrows
   that colour from it, which is the discipline that keeps copper meaning
   something.

   This is not the TSB Labs cursor. TSB's is a surveying instrument with a
   reticle and coordinates, and it stays on TSB. Madar's speaks Madar's own
   vocabulary: copper for the human side, ice for the machine side, never both
   on one element.

   Discipline, so it stays a signal and never becomes decoration:
   - fine pointers with real hover only; a phone never runs a line of this
   - prefers-reduced-motion keeps the colour change, which carries meaning,
     and drops the lag, which is the spatial part
   - text fields keep the native I-beam, because editing beats theatre
   - three fixed elements, one rAF, transform and opacity only, no DOM churn
   - tokens are read from the page's own :root so the live app and the demo
     stay in step, with the brand values as fallbacks for pages that do not
     load the design system */
(function () {
  'use strict';
  if (!window.matchMedia) return;
  if (!matchMedia('(pointer: fine)').matches || !matchMedia('(hover: hover)').matches) return;
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cs = getComputedStyle(document.documentElement);
  var tok = function (name, fallback) { var v = cs.getPropertyValue(name).trim(); return v || fallback; };
  var COPPER = tok('--copper', '#F2926B');
  var ICE = tok('--ice', '#9BC1E0');
  var EASE = tok('--ease', 'cubic-bezier(.2,.7,.3,1)');
  var MONO = tok('--mono', '"IBM Plex Mono", ui-monospace, monospace');

  var css = document.createElement('style');
  css.textContent =
    'html.mdc-on, html.mdc-on a, html.mdc-on button, html.mdc-on summary, html.mdc-on label, html.mdc-on [role="button"]{cursor:none}' +
    'html.mdc-on input, html.mdc-on textarea, html.mdc-on select, html.mdc-on [contenteditable="true"], html.mdc-on [data-cursor="text"]{cursor:auto}' +
    '#mdc{position:fixed;left:0;top:0;z-index:2147483000;pointer-events:none;contain:layout style}' +
    '#mdc>*{position:absolute;left:0;top:0;will-change:transform}' +
    /* the core: exactly where the pointer is, no lag, so precision never suffers */
    '.mdc-core{width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%;background:' + ICE + ';' +
      'transition:background-color .14s ' + EASE + ',opacity .14s ' + EASE + '}' +
    /* the ring: the machine tracking the hand */
    '.mdc-ring{width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:1px solid ' + ICE + ';opacity:.62;' +
      'transition:width .18s ' + EASE + ',height .18s ' + EASE + ',margin .18s ' + EASE + ',border-color .16s ' + EASE + ',background-color .16s ' + EASE + ',opacity .16s ' + EASE + '}' +
    /* over something you can act on: the approval ring, copper, tighter, filled at 13% */
    '#mdc.hot .mdc-ring{border-color:' + COPPER + ';background:rgba(242,146,107,.13);opacity:1;width:40px;height:40px;margin:-20px 0 0 -20px}' +
    '#mdc.hot .mdc-core{background:' + COPPER + '}' +
    /* pressed: the ring closes on the thing, the way a decision does */
    '#mdc.down .mdc-ring{width:22px;height:22px;margin:-11px 0 0 -11px;opacity:1}' +
    /* over the orbit or any canvas: the machine side opens up and keeps ice */
    '#mdc.scene .mdc-ring{width:54px;height:54px;margin:-27px 0 0 -27px;border-style:dashed;opacity:.5}' +
    '#mdc.scene .mdc-core{opacity:.7}' +
    /* over text: hand the field back to the native I-beam */
    '#mdc.text .mdc-ring,#mdc.text .mdc-core{opacity:0}' +
    '#mdc.off .mdc-ring,#mdc.off .mdc-core,#mdc.off .mdc-tag{opacity:0}' +
    /* the word, only over the one primary action on a page */
    '.mdc-tag{font-family:' + MONO + ';font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:' + COPPER + ';' +
      'transform-origin:0 0;opacity:0;white-space:nowrap;transition:opacity .16s ' + EASE + '}' +
    '#mdc.yes .mdc-tag{opacity:1}' +
    '@media (prefers-reduced-motion:reduce){.mdc-ring{transition-property:border-color,background-color,opacity}}';
  document.head.appendChild(css);

  var root = document.createElement('div');
  root.id = 'mdc';
  root.setAttribute('aria-hidden', 'true');
  root.className = 'off';
  root.innerHTML = '<div class="mdc-ring"></div><div class="mdc-core"></div><div class="mdc-tag">yes</div>';
  document.body.appendChild(root);
  document.documentElement.classList.add('mdc-on');

  var ring = root.children[0], core = root.children[1], tag = root.children[2];

  var HOT = 'a, button, summary, label, [role="button"], [role="tab"], [role="menuitem"], input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"], select, .nb, .ft, .btn, .modesw a, .themeBtn, .strandLink, [data-cursor="hot"]';
  var YES = '.btn.primary, .primary, [data-cursor="yes"], #run, .go';
  var TEXT = 'input:not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"], [data-cursor="text"]';
  var SCENE = 'canvas, #orbit, .orbit, [data-cursor="scene"]';

  var mx = -100, my = -100;   // the pointer
  var rx = -100, ry = -100;   // the ring, which arrives a moment later
  var mode = 'idle', yes = false, down = false, seen = false;
  /* 0.22 per frame is the lag of a gauge needle, not a rubber band: the ring
     is visibly following, never visibly late. Reduced motion removes the lag
     entirely and keeps the colour, which is the part that carries meaning. */
  var LAG = REDUCE ? 1 : 0.22;

  function classify(t) {
    if (!t || t.nodeType !== 1) return 'idle';
    if (t.closest(TEXT)) return 'text';
    if (t.closest(HOT)) return 'hot';
    if (t.closest(SCENE)) return 'scene';
    return 'idle';
  }

  document.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    if (!seen) { seen = true; rx = mx; ry = my; root.classList.remove('off'); }
    var t = e.target;
    var m = classify(t);
    var y = m === 'hot' && !!t.closest(YES);
    if (m !== mode) {
      root.classList.remove(mode);
      mode = m;
      if (mode !== 'idle') root.classList.add(mode);
    }
    if (y !== yes) { yes = y; root.classList.toggle('yes', yes); }
  }, { passive: true });

  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    down = true; root.classList.add('down');
  }, { passive: true });
  document.addEventListener('pointerup', function () { down = false; root.classList.remove('down'); }, { passive: true });

  /* Leaving the window hides everything; a ring parked at the last known
     position while the hand is elsewhere reads as a stuck interface. */
  document.addEventListener('mouseleave', function () { root.classList.add('off'); });
  document.addEventListener('mouseenter', function () { if (seen) root.classList.remove('off'); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) root.classList.add('off'); });

  var raf = 0;
  function frame() {
    rx += (mx - rx) * LAG;
    ry += (my - ry) * LAG;
    core.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
    /* the word sits under the ring's right shoulder, where a label would be
       set on an instrument, and follows the ring rather than the pointer */
    tag.style.transform = 'translate3d(' + (rx + 16) + 'px,' + (ry + 18) + 'px,0)';
    raf = requestAnimationFrame(frame);
  }
  /* One loop, and only while the tab can be seen. A cursor animating for a
     hidden tab is the exact kind of cost nobody sees and everybody pays. */
  function start() { if (!raf) raf = requestAnimationFrame(frame); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  start();
})();
