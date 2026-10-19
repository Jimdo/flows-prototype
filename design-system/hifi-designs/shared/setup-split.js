// Shared behaviour for the split-preview setup anatomy.
//
// A setup step using this layout owns two things that have to stay in step:
// a live artifact preview on one side and the controls that change it on the
// other. This module is the single place that connects them, so a screen only
// has to declare *what* it edits:
//
//   import { initSetupSplit } from '/flows-prototype/design-system/hifi-designs/shared/setup-split.js';
//
//   const split = initSetupSplit({
//     state: () => ({ title: nameInput.value || nameInput.placeholder }),
//   });
//
//   nameInput.addEventListener('input', split.sync);
//
// Which part of the page a control changes is declared on the control:
//
//   <input id="nameInput" data-edits="title">
//
// The preview marks that region only while the control holds focus. A
// highlight that is always on stops reading as "this is what you are
// changing" and becomes decoration.
//
// It owns:
//   · the preview bridge — the bio-config handshake, and marking the region
//     of the page the open control changes
//   · the mobile drawer — three stops, drag between them, and the preview
//     scaling as the drawer moves
//
// Contract with the artifact: design-system/hifi-designs/pages/artifacts/bio-page-v2.html
// accepts {type:'bio-config', title, subtitle, image, highlight, actions,
// address, links, footer}. Everything is optional; it applies what it is given.

const MOBILE = '(max-width: 767px)';

/* The drawer's three stops. 'default' is read off the shell so a step whose
   control is taller than one text field can raise its own resting height. */
const PEEK = 72;
const EXPANDED_PREVIEW_STRIP = 56;

/* Where a tap moves the drawer from each stop. One step at a time, and from
   the resting stop the step is downward: the reason to reach for the handle
   mid-flow is to see more of the page, which is the same thing tapping the
   page itself does. Going up is the rarer intent and still one drag away. */
const STEP_ON_TAP = {
  collapsed: 'default',
  default: 'collapsed',
  expanded: 'default',
};

/* Preview scale at the two ends of the drag. Both come from Figma:
   148/360 with the drawer open, 342/360 at the peek. */
const SCALE_OPEN = 0.4111;
const SCALE_PEEK = 0.95;

/* How far a pointer may wander before a press stops counting as a tap. 3px
   was tight enough that a steady thumb still registered as a drag. */
const TAP_SLOP = 8;

/* How far a drag has to travel before it counts as aimed rather than
   adjusted, and lands on the next stop instead of the nearest one. */
const COMMIT = 48;

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export function initSetupSplit(options) {
  const opts = options || {};
  const shell = document.querySelector('.app-shell-setup-split');
  if (!shell) return { sync: function () {} };

  const main = shell.querySelector('.setup-split-main');
  const preview = shell.querySelector('.setup-split-preview');
  const form = shell.querySelector('.setup-split-form');
  const grip = shell.querySelector('.setup-drawer-grip');
  const frame = shell.querySelector('.bp-frame iframe');

  /* ── Preview bridge ───────────────────────────────────────────────── */

  let ready = false;

  /* The region the focused control edits, or null when focus is somewhere
     that changes nothing on the page — the handle field, a button, the page
     itself. Null is a real answer: it clears the highlight. */
  let activeRegion = null;

  function regionFor(el) {
    const owner = el && el.closest ? el.closest('[data-edits]') : null;
    return owner && shell.contains(owner) ? owner.getAttribute('data-edits') : null;
  }

  /* Announced once, the first time the artifact reports in. Mobile uses it to
     name the preview briefly — see .setup-preview-tag. */
  function markPreviewReady() {
    if (shell.getAttribute('data-preview-ready') === 'true') return;
    shell.setAttribute('data-preview-ready', 'true');
  }

  function sync() {
    if (!ready || !frame || !frame.contentWindow) return;
    markPreviewReady();
    const state = typeof opts.state === 'function' ? opts.state() : {};
    frame.contentWindow.postMessage(
      Object.assign(
        {
          type: 'bio-config',
          highlight: activeRegion,
          // Nothing below has been set up yet at this point in onboarding;
          // the preview shows the page as it actually is, not a dressed
          // version of it.
          address: { on: false },
          links: 'none',
        },
        state,
      ),
      '*',
    );
  }

  // Two ways in, because they race: the artifact announces itself with
  // bio-ready, but a module script can be parsed after that message has
  // already gone past. The iframe's own load event is the backstop.
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'bio-ready') { ready = true; sync(); }
  });

  if (frame) {
    frame.addEventListener('load', function () { ready = true; sync(); });
    if (frame.contentDocument && frame.contentDocument.readyState === 'complete') {
      ready = true;
      sync();
    }
  }

  /* ── Drawer ───────────────────────────────────────────────────────── */

  function restHeight() {
    const v = getComputedStyle(shell).getPropertyValue('--setup-drawer-rest-h');
    return parseFloat(v) || 283;
  }

  function maxHeight() {
    return Math.max(restHeight(), main.clientHeight - EXPANDED_PREVIEW_STRIP);
  }

  function stops() {
    return { collapsed: PEEK, default: restHeight(), expanded: maxHeight() };
  }

  /* Preview scale for a given drawer height. Above the resting stop the
     preview is simply being covered, so it holds its size; below it the page
     grows into the space the drawer gives back. */
  function scaleFor(height) {
    const rest = restHeight();
    if (height >= rest) return SCALE_OPEN;
    const t = (rest - height) / (rest - PEEK);
    return SCALE_OPEN + t * (SCALE_PEEK - SCALE_OPEN);
  }

  function nearestStop(height, known) {
    const s = known || stops();
    let best = 'default';
    let bestGap = Infinity;
    for (const name of Object.keys(s)) {
      const gap = Math.abs(s[name] - height);
      if (gap < bestGap) { bestGap = gap; best = name; }
    }
    return best;
  }

  /* The next stop past `from` in `dir` (+1 up, -1 down), or the end of the
     run if there is none. */
  function stopToward(from, dir, known) {
    const s = known || stops();
    const ordered = Object.keys(s).sort((a, b) => s[a] - s[b]);
    const ahead = dir > 0
      ? ordered.filter((n) => s[n] > from + 1)
      : ordered.filter((n) => s[n] < from - 1).reverse();
    return ahead[0] || nearestStop(from, s);
  }

  const fields = shell.querySelector('.setup-split-fields');

  function setState(name) {
    shell.setAttribute('data-drawer', name);
    shell.setAttribute('data-grip', name);
    form.style.height = '';
    shell.style.removeProperty('--bp-scale');
    // At the peek only the question shows, so a scrolled list would come
    // back up starting halfway down with no way to have known it.
    if (name === 'collapsed' && fields) fields.scrollTop = 0;
  }

  /* ── Drag ──
     Pointer events so the same path covers touch, pen and mouse. The height
     follows the finger between the peek and the expanded stop, the preview
     scales with it, and the grip shows the stop it would land on. */

  let dragging = false;
  let startY = 0;
  let startH = 0;
  let moved = false;
  let dragStops = null;   // frozen for the gesture; see onPointerDown
  let dragMax = 0;

  function onPointerDown(e) {
    if (!window.matchMedia(MOBILE).matches) return;

    // Freeze before measuring. A drawer caught mid-transition is still
    // moving, so reading its height and leaving the transition running has
    // the two fight each other for the rest of the gesture; the drawer
    // lurches to wherever the animation had got to and then jumps back.
    const here = form.getBoundingClientRect().height;
    shell.classList.add('is-dragging');
    form.style.height = here + 'px';

    dragging = true;
    moved = false;
    startY = e.clientY;
    startH = here;
    // The stops cost a getComputedStyle each; reading them once per gesture
    // rather than once per pointermove keeps the drag off the layout path.
    dragStops = stops();
    dragMax = dragStops.expanded;
    grip.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const delta = startY - e.clientY;
    if (Math.abs(delta) > TAP_SLOP) moved = true;
    const height = clamp(startH + delta, PEEK, dragMax);
    form.style.height = height + 'px';
    shell.style.setProperty('--bp-scale', scaleFor(height).toFixed(4));
    shell.setAttribute('data-grip', nearestStop(height, dragStops));
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    shell.classList.remove('is-dragging');
    if (grip.hasPointerCapture(e.pointerId)) grip.releasePointerCapture(e.pointerId);

    // A tap that never moved is still a tap: it steps one stop. From the
    // peek that means half open, never straight to fully open — a tap should
    // not cover the page it was just uncovering.
    if (!moved) {
      dragStops = null;
      setState(STEP_ON_TAP[shell.getAttribute('data-drawer')] || 'default');
      return;
    }

    const height = form.getBoundingClientRect().height;
    const stopsNow = dragStops || stops();
    dragStops = null;

    // A deliberate pull deserves to land where it was aimed. Snapping to the
    // nearest stop alone means a long drag that stops just short of halfway
    // springs back under the finger, which is the single thing that makes a
    // sheet feel broken.
    const travelled = height - startH;
    setState(Math.abs(travelled) >= COMMIT
      ? stopToward(startH, travelled > 0 ? 1 : -1, stopsNow)
      : nearestStop(height, stopsNow));
  }

  if (grip) {
    grip.addEventListener('pointerdown', onPointerDown);
    grip.addEventListener('pointermove', onPointerMove);
    grip.addEventListener('pointerup', onPointerUp);
    grip.addEventListener('pointercancel', onPointerUp);
  }

  /* At the peek the whole bar is the target, not just the grip — there is
     nothing else in it to hit, and aiming for a 44px handle to undo a tap on
     the page is a worse deal than the tap that got you there. */
  if (form) {
    form.addEventListener('click', function (e) {
      if (!window.matchMedia(MOBILE).matches) return;
      // The grip is inside this bar, and a press on it produces a click here
      // once the gesture is over. Without this, every drag down landed on the
      // peek and was immediately undone by its own click — the drawer sprang
      // back up and looked like it refused to stay. Pointer capture keeps the
      // target on the grip for drags too, so one check covers both.
      if (grip && grip.contains(e.target)) return;
      if (shell.getAttribute('data-drawer') !== 'collapsed') return;
      setState('default');
    });
  }

  /* ── Preview scrolling ──
     Relayed rather than handed to the frame: an iframe keeps its events to
     itself, so giving the page pointer events would take the collapse tap
     with it. This way the page scrolls at every drawer height and the tap
     still lands. The divide by scale is because a finger crossing N screen
     pixels crosses N/scale pixels of a page drawn at --bp-scale. */
  function currentScale() {
    return parseFloat(getComputedStyle(shell).getPropertyValue('--bp-scale')) || 1;
  }

  function scrollPreview(by) {
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.scrollBy({ top: by / currentScale() });
  }

  let touchY = null;
  let touchMoved = false;

  if (preview) {
    preview.addEventListener('wheel', function (e) {
      if (!frame || !frame.contentWindow) return;
      scrollPreview(e.deltaY);
      e.preventDefault();
    }, { passive: false });

    preview.addEventListener('touchstart', function (e) {
      touchY = e.touches[0].clientY;
      touchMoved = false;
    }, { passive: true });

    preview.addEventListener('touchmove', function (e) {
      if (touchY === null) return;
      const y = e.touches[0].clientY;
      if (Math.abs(y - touchY) > 3) touchMoved = true;
      scrollPreview(touchY - y);
      touchY = y;
      e.preventDefault();
    }, { passive: false });

    preview.addEventListener('touchend', function () { touchY = null; }, { passive: true });

    /* Tapping the page sends the drawer down — the quickest way to see the
       whole thing you are making. A drag was a scroll, not a tap. */
    preview.addEventListener('click', function () {
      if (!window.matchMedia(MOBILE).matches) return;
      if (touchMoved) { touchMoved = false; return; }
      if (shell.getAttribute('data-drawer') === 'collapsed') return;
      setState('collapsed');
    });
  }

  function recomputeRegion() {
    const next = regionFor(document.activeElement);
    if (next === activeRegion) return;
    activeRegion = next;
    sync();
  }

  shell.addEventListener('focusin', function (e) {
    recomputeRegion();
    /* A control that has just been focused needs its own room. */
    if (!window.matchMedia(MOBILE).matches) return;
    if (!form.contains(e.target)) return;
    if (shell.getAttribute('data-drawer') === 'collapsed') setState('default');
  });

  /* Deferred: on focusout document.activeElement is still the old node, and
     focus moving between two controls should not blink the highlight off. */
  shell.addEventListener('focusout', function () {
    window.setTimeout(recomputeRegion, 0);
  });

  setState(shell.getAttribute('data-drawer') || 'default');

  return { sync, setState, shell, frame };
}
