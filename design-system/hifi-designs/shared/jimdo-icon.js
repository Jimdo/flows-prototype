/**
 * jimdo-icon.js
 * <jimdo-icon name="home-11"> — fetches the matching SVG from
 * /design-system/icons/{name}.svg and renders it inline.
 *
 * The SVG files are the single source of truth for icon paths.
 * Stroke colors inherit via currentColor, sizing is controlled
 * by parent CSS (default 24×24 from the SVG viewBox).
 *
 * Usage:
 *   <script type="module" src="/flows-prototype/design-system/hifi-designs/shared/jimdo-icon.js"></script>
 *   <jimdo-icon name="arrow-left-02"></jimdo-icon>
 *
 * Optional attribute: stroke-color="white" sets stroke override.
 *
 * Note: fetch is async — first paint is empty, content swaps in once
 * the SVG resolves. Cached results are reused across instances.
 */

const ICON_BASE = '/flows-prototype/design-system/icons/';
const cache = new Map(); // name -> Promise<string svgInner>

function fetchIcon(name) {
  if (cache.has(name)) return cache.get(name);
  const p = fetch(`${ICON_BASE}${name}.svg`)
    .then(r => r.ok ? r.text() : Promise.reject(new Error(`Icon ${name} not found`)))
    .then(text => {
      // Strip outer <svg> wrapper, keep only the inner paths/circles/etc.
      // This lets the host element's <svg> control viewBox / sizing.
      const match = text.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
      return match ? match[1].trim() : text;
    })
    .catch(err => {
      console.warn('[jimdo-icon]', err.message);
      return '';
    });
  cache.set(name, p);
  return p;
}

class JimdoIcon extends HTMLElement {
  static get observedAttributes() { return ['name']; }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(_n, oldVal, newVal) {
    if (oldVal !== newVal && this.isConnected) this.render();
  }

  async render() {
    const name = this.getAttribute('name');
    if (!name) return;
    // Render empty SVG immediately to reserve space
    if (!this.querySelector('svg')) {
      this.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"></svg>`;
    }
    const inner = await fetchIcon(name);
    // Skip if name changed mid-flight
    if (this.getAttribute('name') !== name) return;
    this.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
  }
}

customElements.define('jimdo-icon', JimdoIcon);

/* Helper for use inside other custom elements that build markup as strings.
   Renders a <jimdo-icon name="..."> tag — the component will hydrate it
   when inserted into the DOM. */
export function iconTag(name) {
  return `<jimdo-icon name="${name}"></jimdo-icon>`;
}
