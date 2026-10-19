// Shared client helper for the Google Business AI POC.
// - Reads/writes the entity from localStorage under key 'flows.businessEntity'
// - On DOMContentLoaded, prefills any element with [data-prefill="<field>"].
//
// Supported field names:
//   "name"        -> entity.name
//   "handle"      -> slugify(entity.name)
//   "description" -> entity.description
//
// Supported elements:
//   <input>, <textarea>          -> set .value
//   <span contenteditable="...">  -> set .textContent
//
// Usage in a screen:
//   <input type="text" data-prefill="name">
//   <script type="module" src="/flows-prototype/design-system/hifi-designs/shared/business-entity.js"></script>

const STORAGE_KEY = 'flows.businessEntity';

export function readEntity() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeEntity(entity) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entity));
}

export function clearEntity() {
  localStorage.removeItem(STORAGE_KEY);
}

export function slugify(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

function valueFor(entity, field) {
  if (!entity) return '';
  switch (field) {
    case 'name':        return entity.name || '';
    case 'handle':      return slugify(entity.name || '');
    case 'description': return entity.description || '';
    default:            return '';
  }
}

function fillElement(el, value) {
  if (!value) return;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (el.isContentEditable) {
    el.textContent = value;
  } else {
    el.textContent = value;
  }
}

export function prefillFromEntity(root = document) {
  const entity = readEntity();
  if (!entity) return;
  root.querySelectorAll('[data-prefill]').forEach((el) => {
    const field = el.getAttribute('data-prefill');
    fillElement(el, valueFor(entity, field));
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => prefillFromEntity());
  } else {
    prefillFromEntity();
  }
}
