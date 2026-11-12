// Reordering a list by dragging a row.
//
//   <ul class="edit-list">
//     <li><button class="edit-row">
//       <span class="edit-row-grip">…</span> …
//     </button></li>
//   </ul>
//
//   initDragList(document);
//
// Pointer events, so one path covers touch, pen and mouse. A row only moves
// inside its own list: the zones on a bio page are places the page gives
// them, so a contact button cannot be dragged out of the contact row.
//
// The rows are buttons that open an editor when clicked, and a drag ends in a
// click. Anything that actually moved swallows that click once — otherwise
// every reorder would finish by opening a dialog nobody asked for.
//
// Direction-free. This used to assume a vertical stack — one pitch read off
// the first two rows, translateY only, and a target index from how far the
// finger had travelled divided by that pitch. A list that wraps breaks every
// one of those: the pitch between items 1 and 2 is horizontal, item 3 may be
// on the next line, and shuffling means moving in both axes at once.
//
// So the geometry is read from the rects themselves. Every item's resting
// place is where one of the original rects is; a reorder is a permutation of
// those places; and an item's offset is the difference between the rect it
// is going to and the rect it came from. That covers a column, a row and a
// wrapping grid with the same lines, and reproduces exactly what the stack
// did before.

const COMMIT = 3;   // px of travel before a press counts as a drag
const EASE = 'transform 160ms cubic-bezier(0.32, 0.72, 0, 1)';

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/* Where the item at original index `i` ends up once the carried one has been
   lifted out of `from` and dropped at `to`. Everything between the two slides
   along by one place; everything outside stays. */
function slotFor(i, from, to) {
  if (i === from) return to;
  if (from < to) return (i > from && i <= to) ? i - 1 : i;
  if (from > to) return (i >= to && i < from) ? i + 1 : i;
  return i;
}

/* Where each item sits while one of them is being carried: at the rect of the
   slot it would take, so the gap under the finger is always the size and the
   shape of the thing being dropped. Both axes, because a wrapping list
   shuffles sideways and down the moment a row end is crossed. */
function layout(d) {
  d.items.forEach((node, i) => {
    if (node === d.li) return;
    const here = d.rects[i];
    const there = d.rects[slotFor(i, d.from, d.to)];
    const x = there.left - here.left;
    const y = there.top - here.top;
    node.style.transition = EASE;
    node.style.transform = (x || y) ? `translate(${x}px, ${y}px)` : '';
  });
}

/* Which slot the carried item is nearest, measured from its own centre rather
   than from the pointer: the finger lands somewhere inside the handle, and an
   index read off the pointer would be that offset wrong from the first pixel.
   Nearest-centre is what the pitch arithmetic did in a column, and it is
   still right when the next slot is sideways. */
function slotNearest(d, dx, dy) {
  const me = d.rects[d.from];
  const cx = me.left + dx + me.width / 2;
  const cy = me.top + dy + me.height / 2;
  let best = d.from;
  let bestGap = Infinity;
  d.rects.forEach((r, i) => {
    const gx = r.left + r.width / 2 - cx;
    const gy = r.top + r.height / 2 - cy;
    const gap = gx * gx + gy * gy;
    if (gap < bestGap) { bestGap = gap; best = i; }
  });
  return best;
}

function setupList(list) {
  let drag = null;

  list.addEventListener('pointerdown', (e) => {
    /* .edit-row-grip is also a look; [data-drag-handle] is only a hook, so
       a list can carry its own handle styling and still be draggable. */
    const grip = e.target.closest('.edit-row-grip, [data-drag-handle]');
    if (!grip || !list.contains(grip)) return;
    const li = grip.closest('li');
    if (!li) return;

    // Only the rows that are actually on screen. A list can carry wrappers
    // for rows it is not showing, and counting those put the pitch and the
    // drop index against things nobody can see.
    const items = Array.from(list.children).filter((n) => n.getClientRects().length);
    if (items.length < 2) return;
    const rects = items.map((n) => n.getBoundingClientRect());

    e.preventDefault();
    drag = {
      li, items, grip, rects,
      from: items.indexOf(li),
      to: items.indexOf(li),
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
    grip.setPointerCapture(e.pointerId);
    list.classList.add('is-reordering');
    li.classList.add('is-dragging');
  });

  list.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > COMMIT || Math.abs(dy) > COMMIT) drag.moved = true;

    // The carried row follows the finger exactly and never eases — an easing
    // row lags behind the pointer and reads as a dropped frame.
    drag.li.style.transition = '';
    drag.li.style.transform = `translate(${dx}px, ${dy}px)`;

    const to = clamp(slotNearest(drag, dx, dy), 0, drag.items.length - 1);
    if (to !== drag.to) {
      drag.to = to;
      layout(drag);
    }
  });

  function end(e) {
    if (!drag) return;
    const { li, items, from, to, grip, moved } = drag;
    drag = null;

    items.forEach((n) => { n.style.transition = ''; n.style.transform = ''; });
    li.classList.remove('is-dragging');
    list.classList.remove('is-reordering');
    if (grip.hasPointerCapture(e.pointerId)) grip.releasePointerCapture(e.pointerId);

    if (to !== from) {
      // insertBefore wants the node that should end up after this one. Moving
      // down, that is the one past the target, because the target itself is
      // still above us at the moment of the move.
      list.insertBefore(li, to > from ? items[to].nextSibling : items[to]);
      // Lists whose order lives in a model rather than in the DOM need to be
      // told, or the next render puts the row back where it was.
      list.dispatchEvent(new CustomEvent('reorder', {
        bubbles: true, detail: { from, to },
      }));
    }
    if (moved) {
      li.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      }, { capture: true, once: true });
    }
  }

  list.addEventListener('pointerup', end);
  list.addEventListener('pointercancel', end);
}

export function initDragList(root) {
  (root || document)
    .querySelectorAll('.edit-list, [data-drag-list]')
    .forEach(setupList);
}
