// Shared client helper that resolves [data-pattern-ref="pattern-xxx"] elements
// by looking up the named entry in /data/patterns.json and turning it into the
// inline data-pattern JSON the loader expects.
//
// Usage in a hifi screen:
//   <div class="hero" data-pattern-ref="pattern-mint-doodle"></div>
//   <script type="module" src="/flows-prototype/design-system/hifi-designs/shared/pattern-ref.js"></script>
//   <script type="module" src="/flows-prototype/design-system/pattern-studio/pattern-loader.js"></script>
//
// Order matters: this resolver runs first and writes data-pattern attributes,
// then pattern-loader.js scans them and renders the SVGs.
//
// Resolution is async — registry is fetched once and cached. Elements are
// processed in two passes: existing nodes on first run, plus a MutationObserver
// for any added later. The loader's own MutationObserver picks up the
// data-pattern attribute we set and handles rendering + offscreen pausing.

const REGISTRY_URL = '/data/patterns.json';

let registryPromise = null;
function getRegistry() {
  if (!registryPromise) {
    registryPromise = fetch(REGISTRY_URL, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { patterns: [] })
      .then(j => {
        const map = new Map();
        for (const p of (j.patterns || [])) map.set(p.id, p);
        return map;
      })
      .catch(err => {
        console.warn('[pattern-ref] failed to load registry:', err);
        return new Map();
      });
  }
  return registryPromise;
}

async function resolve(el) {
  if (!el || !el.getAttribute) return;
  const id = el.getAttribute('data-pattern-ref');
  if (!id) return;
  // Skip if already resolved (loader has set data-pattern from us before)
  if (el.dataset.patternRefResolved === id) return;
  const map = await getRegistry();
  const entry = map.get(id);
  if (!entry) {
    console.warn(`[pattern-ref] no registry entry for "${id}"`);
    return;
  }
  el.setAttribute('data-pattern', JSON.stringify(entry.config));
  el.dataset.patternRefResolved = id;
}

function init() {
  document.querySelectorAll('[data-pattern-ref]').forEach(resolve);
  const mo = new MutationObserver(records => {
    for (const r of records) {
      if (r.type === 'attributes' && r.attributeName === 'data-pattern-ref') {
        // Allow re-resolution when the ref changes
        delete r.target.dataset.patternRefResolved;
        resolve(r.target);
      } else if (r.type === 'childList') {
        r.addedNodes.forEach(n => {
          if (n.nodeType !== 1) return;
          if (n.matches?.('[data-pattern-ref]')) resolve(n);
          n.querySelectorAll?.('[data-pattern-ref]').forEach(resolve);
        });
      }
    }
  });
  mo.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-pattern-ref'],
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
