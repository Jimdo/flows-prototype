// The celebration burst.
//
// Forty-five dots thrown from a point, each on its own three-part animation:
// a horizontal drift, a vertical arc, and a fade that also spins and flips
// the dot so it reads as a piece of paper rather than a ball. Seeded rather
// than random, so the same screen bursts the same way every time it is
// opened and a screenshot of it is worth comparing.
//
//   <div class="confetti" id="confetti" aria-hidden="true"></div>
//   initConfetti(document.getElementById('confetti'));
//
// The styles live with the rest of the design system (.confetti* in
// components.css). This was ported by hand into four screens before it was
// lifted here; anything that needs it now imports it.

const COLORS = ['#8DA7FF', '#B5F2CE', '#A350D9', '#FFC77B', '#336BFF', '#7DEAAF', '#E4B5FF'];
const DOT_COUNT = 45;

function seededRandom(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function initConfetti(root) {
  if (!root) return;
  root.textContent = '';
  for (let i = 0; i < DOT_COUNT; i++) {
    const rand = (offset) => seededRandom(i * 7 + offset);
    // The three elements share a delay and a duration: they are one dot
    // moving, split up only because the three motions need different curves.
    const delay = (rand(1) * 0.06) + 's';
    const duration = (2.5 + rand(2) * 1.5) + 's';

    const x = document.createElement('div');
    x.className = 'confetti-x';
    x.style.setProperty('--dot-left', (-5 + rand(0) * 10) + '%');
    x.style.setProperty('--dot-delay', delay);
    x.style.setProperty('--dot-duration', duration);
    x.style.setProperty('--dot-x-drift', ((rand(3) - 0.5) * 500) + 'px');

    const y = document.createElement('div');
    y.className = 'confetti-y';
    y.style.setProperty('--dot-delay', delay);
    y.style.setProperty('--dot-duration', duration);
    y.style.setProperty('--dot-y-peak', (-(120 + rand(4) * 160)) + 'px');
    y.style.setProperty('--dot-y-end', (80 + rand(5) * 120) + 'px');

    const dot = document.createElement('div');
    dot.className = 'confetti-dot';
    dot.style.setProperty('--dot-color', COLORS[i % COLORS.length]);
    dot.style.setProperty('--dot-delay', delay);
    dot.style.setProperty('--dot-duration', duration);
    dot.style.setProperty('--dot-size', (3 + rand(6) * 2) + 'px');
    dot.style.setProperty('--dot-rotate', (rand(7) * 360) + 'deg');

    y.appendChild(dot);
    x.appendChild(y);
    root.appendChild(x);
  }
}
