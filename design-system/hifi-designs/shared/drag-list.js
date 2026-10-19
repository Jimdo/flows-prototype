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

const COMMIT = 3;   // px of travel before a press counts as a drag
const EASE = 'transform 160ms cubic-bezier(0.32, 0.72, 0, 1)';

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/* Where each row sits while one of them is being carried: everything between
   the row's old index and its current one shuffles by exactly one step, so
   the gap under the finger is always the size of the thing being dropped. */
function layout(d) {
  d.items.forEach((node, i) => {
    if (node === d.li) return;
    let y = 0;
    if (d.from < d.to && i > d.from && i <= d.to) y = -d.step;
    else if (d.from > d.to && i >= d.to && i < d.from) y = d.step;
    node.style.transition = EASE;
    node.style.transform = y ? `translateY(${y}px)` : '';
  });
}

function setupList(list) {
  let drag = null;

  list.addEventListener('pointerdown', (e) => {
    const grip = e.target.closest('.edit-row-grip');
    if (!grip || !list.contains(grip)) return;
    const li = grip.closest('li');
    if (!li) return;

    const items = Array.from(list.children);
    if (items.length < 2) return;
    const rects = items.map((n) => n.getBoundingClientRect());

    e.preventDefault();
    drag = {
      li, items, grip,
      from: items.indexOf(li),
      to: items.indexOf(li),
      // Row pitch, not row height: the list has a gap and the rows have to
      // travel past it to land on the next slot.
      step: rects[1].top - rects[0].top,
      startY: e.clientY,
      moved: false,
    };
    grip.setPointerCapture(e.pointerId);
    list.classList.add('is-reordering');
    li.classList.add('is-dragging');
  });

  list.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dy) > COMMIT) drag.moved = true;

    // The carried row follows the finger exactly and never eases — an easing
    // row lags behind the pointer and reads as a dropped frame.
    drag.li.style.transition = '';
    drag.li.style.transform = `translateY(${dy}px)`;

    const to = clamp(drag.from + Math.round(dy / drag.step), 0, drag.items.length - 1);
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
  (root || document).querySelectorAll('.edit-list').forEach(setupList);
}
