/**
 * shell-components.js
 * Custom elements for the management-shell anatomy.
 * No Shadow DOM — renders directly into the light DOM so management-shell.css applies normally.
 *
 * Icons come from the SVG registry at /design-system/icons/ via the
 * <jimdo-icon name="…"> component (single source of truth — no duplicated path data here).
 *
 * Usage:
 *   <script type="module" src="/flows-prototype/design-system/hifi-designs/shared/shell-components.js"></script>
 *
 *   <jimdo-topbar></jimdo-topbar>
 *   <jimdo-topbar variant="extended"></jimdo-topbar>
 *   <jimdo-sidebar product="flows" active="flows"></jimdo-sidebar>
 *   <jimdo-sidebar product="flows" active="flows" variant="contextual" back-label="More from Jimdo" title="Flows"></jimdo-sidebar>
 *
 * jimdo-topbar attributes:
 *   variant   — "extended" adds bell + account dropdown (default: standard account button only)
 *   companion — boolean: adds the gradient "Companion AI" button before the account button
 *
 * jimdo-sidebar attributes:
 *   product      — "flows" (default) | "jimdo" | "bookings"
 *   active       — nav item id to mark as current page
 *   variant      — "contextual" adds back-link + section title above nav items
 *   back-label   — text for the back-link (default: "More from Jimdo")
 *   back-product — product slug to navigate to when the back-link is clicked (cross-nav)
 *   back-screen  — optional screen file basename for the back-link target (e.g. "main-navigation.html")
 *   title        — section title above nav items (default: product name)
 *   show-items   — comma-separated id filter (flows only) e.g. "flows,solo-pages,legal-privacy"
 *   hide-icons   — boolean: render text-only nav items (no leading icon)
 *   marker       — boolean: with hide-icons, keep the active fill + blue bar
 *                  (Figma 11769:68383). Omit for the flat treatment (15841:70239).
 *   labels       — per-instance label overrides, semicolon-separated "id=Label" pairs
 *                  e.g. labels="flows=Bio Page"
 *   targets      — per-instance nav-target overrides, same k=v;k=v form
 *                  e.g. targets="flows=flows/home-dashboard-v2.html"
 *
 * Active IDs per product:
 *   flows    : "flows" | "legal-privacy" | "business-profile"
 *   jimdo    : "dashboard" | "website" | "analytics" | "settings"
 *   bookings : "events" | "schedule" | "settings"
 */

import { iconTag } from './jimdo-icon.js';

/* ─── Nav configs ─────────────────────────────────────────────────────────── */

const FLOWS_NAV = {
  product: [
    { id: 'flows',            label: 'Home',               phrase: 'nav.home',           iconName: 'home-11',         screen: 'flows/ai-suggestions.html' },
    { id: 'buttons',          label: 'Buttons',            phrase: 'nav.buttons',        iconName: 'tap-01',          screen: 'flows/buttons-solo-pages.html' },
    { id: 'solo-pages',       label: 'Action Pages',       phrase: 'nav.actionPages',    iconName: 'smart-phone-01',  screen: 'flows/solo-pages.html' },
    { id: 'design',           label: 'Design',             phrase: 'nav.design',         iconName: 'paint-board',     screen: 'flows/design.html' },
    { id: 'legal-privacy',    label: 'Legal &amp; Privacy', phrase: 'legalPages.heading', iconName: 'shield', screen: 'flows/legal-privacy.html' },
    { id: 'business-profile', label: 'Business Profile',   phrase: '',                   iconName: 'user-03' },
  ],
  account: [
    { id: 'help',     label: 'Help',     phrase: '', iconName: 'help-circle' },
    { id: 'projects', label: 'Projects', phrase: '', iconName: 'globe-02' },
  ],
};

// Jimdo platform nav — full 12-item product switcher.
// hasChevron: true = expandable sub-nav exists. badge: string = trailing badge label.
// crossProduct: product slug → fires a cross-nav postMessage to the dashboard when clicked.
// crossScreen: page path relative to /pages/ → deeplinks the workbench on arrival.
const JIMDO_NAV = [
  { id: 'dashboard',        label: 'Dashboard',       phrase: 'core.main-nav.dashboard',        iconName: 'home-11' },
  { id: 'website-builder',  label: 'Website Builder', phrase: 'core.main-nav.website-builder',  iconName: 'layout-grid',    hasChevron: true },
  { id: 'flows',            label: 'Flows',            phrase: 'core.main-nav.flows',            iconName: 'orthogonal-edge', hasChevron: true, crossProduct: 'flows',    crossScreen: 'flows/landing-in-product.html' },
  { id: 'store',            label: 'Store',            phrase: 'core.main-nav.store',            iconName: 'store-02',       hasChevron: true },
  { id: 'bookings',         label: 'Bookings',         phrase: 'core.main-nav.bookings',         iconName: 'calendar-02',    hasChevron: true, crossProduct: 'bookings', crossScreen: 'bookings/landing-in-product.html' },
  { id: 'smart-forms',      label: 'Smart Forms',      phrase: 'core.main-nav.smart-forms',      iconName: 'file-lines' },
  { id: 'statistics',       label: 'Statistics',       phrase: 'core.main-nav.statistics',       iconName: 'analytics-01',   hasChevron: true },
  { id: 'marketing',        label: 'Marketing',        phrase: 'core.main-nav.marketing',        iconName: 'megaphone-03',   hasChevron: true },
  { id: 'contacts',         label: 'Contacts',         phrase: 'core.main-nav.contacts',         iconName: 'contact-01',     hasChevron: true },
  { id: 'email',            label: 'Email',            phrase: 'core.main-nav.email',            iconName: 'mail',           hasChevron: true },
  { id: 'payments',         label: 'Payments',         phrase: 'core.main-nav.payments',         iconName: 'wallet-01',      hasChevron: true, badge: 'NEW', badgePhrase: 'core.main-nav.payments-badge', crossProduct: 'payments', crossScreenId: 'scr-201' },
  { id: 'business-profile', label: 'Business Profile', phrase: 'core.main-nav.business-profile', iconName: 'briefcase-01' },
];

// Bookings product nav.
// `screen` is the data-nav-to target (relative to design-system/hifi-designs/pages/),
// picked up by prototype-nav.js so clicks navigate the iframe within Bookings.
const BOOKINGS_NAV = {
  product: [
    { id: 'events',   label: 'Events',   phrase: 'bookings.nav.events',   iconName: 'calendar-02',  screen: 'bookings/events-list.html' },
    { id: 'schedule', label: 'Schedule', phrase: 'bookings.nav.schedule', iconName: 'clock-02',     screen: 'bookings/schedule.html' },
    { id: 'settings', label: 'Settings', phrase: 'bookings.nav.settings', iconName: 'settings-02',  screen: 'bookings/settings.html' },
  ],
  account: [
    { id: 'help',     label: 'Help',     phrase: '', iconName: 'help-circle' },
    { id: 'projects', label: 'Projects', phrase: '', iconName: 'globe-02' },
  ],
};

// Sub-nav configs for Jimdo platform nav items with hasChevron: true.
// Keyed by the JIMDO_NAV item id. Clicking a chevron item slides to this panel.
const JIMDO_SUB_NAVS = {
  'website-builder': {
    title: 'Website Builder',
    items: [
      { id: 'wb-pages',    label: 'Pages',    phrase: 'websiteBuilder.nav.pages',    iconName: 'file-02' },
      { id: 'wb-design',   label: 'Design',   phrase: 'websiteBuilder.nav.design',   iconName: 'layout-grid' },
      { id: 'wb-settings', label: 'Settings', phrase: 'websiteBuilder.nav.settings', iconName: 'settings-02' },
    ],
  },
  'flows': {
    title: 'Flows',
    items: [
      { id: 'flows-home',    label: 'Home',            phrase: 'nav.home',           iconName: 'home-11', crossProduct: 'flows', crossScreen: 'flows/landing-in-product.html' },
      { id: 'legal-privacy', label: 'Legal &amp; Privacy', phrase: 'legalPages.heading', iconName: 'file-02' },
    ],
  },
  'store': {
    title: 'Store',
    items: [
      { id: 'store-products', label: 'Products', phrase: 'store.nav.products', iconName: 'store-02' },
      { id: 'store-orders',   label: 'Orders',   phrase: 'store.nav.orders',   iconName: 'file-lines' },
      { id: 'store-settings', label: 'Settings', phrase: 'store.nav.settings', iconName: 'settings-02' },
    ],
  },
  'bookings': {
    title: 'Bookings',
    items: [
      { id: 'bookings-home',     label: 'Events',   phrase: 'bookings.nav.events',   iconName: 'calendar-02', crossProduct: 'bookings', crossScreen: 'bookings/landing-in-product.html' },
      { id: 'bookings-schedule', label: 'Schedule', phrase: 'bookings.nav.schedule', iconName: 'clock-02' },
      { id: 'bookings-settings', label: 'Settings', phrase: 'bookings.nav.settings', iconName: 'settings-02' },
    ],
  },
  'statistics': {
    title: 'Statistics',
    items: [
      { id: 'stats-overview',  label: 'Overview',  phrase: 'stats.nav.overview',  iconName: 'analytics-01' },
      { id: 'stats-visitors',  label: 'Visitors',  phrase: 'stats.nav.visitors',  iconName: 'user-03' },
      { id: 'stats-reports',   label: 'Reports',   phrase: 'stats.nav.reports',   iconName: 'file-02' },
    ],
  },
  'marketing': {
    title: 'Marketing',
    items: [
      { id: 'mktg-seo',    label: 'SEO',     phrase: 'marketing.nav.seo',    iconName: 'globe-02' },
      { id: 'mktg-social', label: 'Social',  phrase: 'marketing.nav.social', iconName: 'megaphone-03' },
      { id: 'mktg-email',  label: 'Email',   phrase: 'marketing.nav.email',  iconName: 'mail' },
    ],
  },
  'contacts': {
    title: 'Contacts',
    items: [
      { id: 'contacts-all',    label: 'All contacts', phrase: 'contacts.nav.list',   iconName: 'contact-01' },
      { id: 'contacts-groups', label: 'Groups',        phrase: 'contacts.nav.groups', iconName: 'user-03' },
    ],
  },
  'email': {
    title: 'Email',
    items: [
      { id: 'email-campaigns',   label: 'Campaigns',   phrase: 'email.nav.campaigns',   iconName: 'mail' },
      { id: 'email-templates',   label: 'Templates',   phrase: 'email.nav.templates',   iconName: 'file-02' },
      { id: 'email-subscribers', label: 'Subscribers', phrase: 'email.nav.subscribers', iconName: 'user-03' },
    ],
  },
  'payments': {
    title: 'Payments',
    items: [
      { id: 'pay-overview',      label: 'Overview',     phrase: 'payments.nav.overview',     iconName: 'wallet-01' },
      { id: 'pay-transactions',  label: 'Transactions', phrase: 'payments.nav.transactions', iconName: 'file-lines' },
      { id: 'pay-settings',      label: 'Settings',     phrase: 'payments.nav.settings',     iconName: 'settings-02' },
    ],
  },
};

/* ─── Shared topbar HTML helpers ─────────────────────────────────────────── */
/* Jimdo brand logos are kept inline — they are not generic icons and have
   custom viewBoxes (24×24 compact J, 650×241 wordmark with bordered frame). */

const TOPBAR_LOGOS = `
  <div class="topbar-close-icon" aria-hidden="true">
    ${iconTag('cancel-01')}
  </div>
  <div class="jimdo-logo jimdo-logo--compact" aria-label="Jimdo">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="currentColor" fill-rule="evenodd" d="M12 22.8c5.965 0 10.8-4.835 10.8-10.8 0-5.965-4.835-10.8-10.8-10.8C6.035 1.2 1.2 6.035 1.2 12c0 5.965 4.835 10.8 10.8 10.8Zm1.334-16.82h3.02v7.31a5.13 5.13 0 0 1-10.26 0h3.02a2.11 2.11 0 0 0 4.221 0V5.98Z"/>
    </svg>
  </div>
  <div class="jimdo-logo jimdo-logo--wordmark" aria-label="Jimdo">
    <svg viewBox="0 0 650 241" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M536 64.9905C505.071 64.9905 480 89.8375 480 120.49C480 151.143 505.071 175.99 536 175.99C566.929 175.99 592 151.143 592 120.49C592.01 89.8474 566.929 64.9905 536 64.9905ZM536 151.621C518.656 151.621 504.589 137.689 504.589 120.49C504.589 103.302 518.646 89.3595 536 89.3595C553.344 89.3595 567.411 103.292 567.411 120.49C567.411 137.689 553.354 151.621 536 151.621Z" fill="currentColor"/>
      <path d="M228 67.9905H251.456L287.001 134.519L322.385 67.9905H346.002V174.99H319.633V117.819L289.613 174.99H284.399L254.378 117.969V174.99H228.01V67.9905H228Z" fill="currentColor"/>
      <path d="M149 67.9905H122.515V132.046C122.515 142.257 114.224 150.538 104 150.538C93.7764 150.538 85.4853 142.257 85.4853 132.046H59C59 156.869 79.1469 176.99 104 176.99C128.853 176.99 149 156.869 149 132.046V67.9905Z" fill="currentColor"/>
      <path d="M412.514 67.9905H373V174.99H412.514C442.054 174.99 466 151.039 466 121.49C466 91.9423 442.054 67.9905 412.514 67.9905ZM409.302 152.665H399.289V90.2963H409.302C426.516 90.2963 440.479 104.252 440.479 121.48C440.479 138.709 426.526 152.665 409.302 152.665Z" fill="currentColor"/>
      <path d="M202 67.9905H175V173.99H202V67.9905Z" fill="currentColor"/>
      <path d="M633.989 16.9798V225.001H16.0111V16.9798H633.989ZM650 0.990479H0V240.99H650V0.990479Z" fill="currentColor"/>
    </svg>
  </div>
  <span class="topbar-menu-label" data-inspect-phrase="">Menu</span>`;

/* ─── jimdo-topbar ────────────────────────────────────────────────────────── */

class JimdoTopbar extends HTMLElement {
  connectedCallback() {
    const extended = this.getAttribute('variant') === 'extended';
    const companion = this.hasAttribute('companion');

    // Companion AI — gradient pill button (Figma 707:4949). Opt-in via attribute.
    // Icon: @jimdo/ui SparklesStrokeStandardIcon (two 4-point stars), inlined.
    const sparklesSvg = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 2C15.944 6.19089 17.579 8.00412 22 9C17.8091 9.94405 15.9959 11.579 15 16C14.056 11.8091 12.421 9.99588 8 9C12.421 8.00412 14.056 6.19089 15 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 12C7.71134 15.1579 9.00651 16.3257 12 17C8.84214 17.7113 7.67432 19.0065 7 22C6.28866 18.8421 4.99349 17.6743 2 17C5.15786 16.2887 6.32568 14.9935 7 12Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
    const companionBtn = companion ? `
      <button class="topbar-companion" aria-label="Companion AI" data-inspect-phrase="companion.aiButton">
        ${sparklesSvg}
        <span class="topbar-companion-label">Companion AI</span>
      </button>` : '';

    const accountRight = extended ? `
      <div class="topbar-icon-buttons">
        <button class="icon-btn topbar-bell" aria-label="News from Jimdo">
          ${iconTag('notification-01')}
        </button>
        <div class="topbar-account-wrapper">
          <button class="icon-btn topbar-account" aria-label="Account" aria-haspopup="true" aria-expanded="false">
            <div class="topbar-account-circle">
              ${iconTag('user-03')}
            </div>
          </button>
          <div class="account-menu" role="menu" aria-label="Account menu">
            <div class="account-menu-drag-handle" aria-hidden="true"></div>
            <div class="account-menu-header">
              <div class="account-menu-user">
                <div class="account-menu-avatar">${iconTag('user-03')}</div>
                <div class="account-menu-user-text">
                  <div class="account-menu-name">Ricardo Hintze</div>
                  <div class="account-menu-email">ricardo.hintze@jimdo.com</div>
                </div>
              </div>
              <button class="account-menu-close icon-btn" aria-label="Close account menu">
                ${iconTag('cancel-01')}
              </button>
            </div>
            <hr class="account-menu-divider">
            <button class="account-menu-item" role="menuitem">
              ${iconTag('settings-02')}
              Account settings
            </button>
            <button class="account-menu-item" role="menuitem">
              ${iconTag('cookie')}
              Cookie preferences
            </button>
            <button class="account-menu-item" role="menuitem">
              ${iconTag('logout-03')}
              Logout
            </button>
          </div>
        </div>
      </div>` : `
      <div class="topbar-icon-buttons">
        <button class="icon-btn topbar-account" aria-label="Account">
          <div class="topbar-account-circle">
            ${iconTag('user-03')}
          </div>
        </button>
      </div>`;

    this.innerHTML = `
      <div class="topbar">
        <button class="topbar-left" aria-label="Menu">
          ${TOPBAR_LOGOS}
        </button>
        <div class="topbar-right">
          <nav class="topbar-nav-links" aria-label="Global">
            <button class="btn-subtle topbar-nav-btn upgrade" data-inspect-phrase="upgrade.ctaPrimary">Upgrade</button>
            <button class="btn-subtle topbar-nav-btn" data-inspect-phrase="">Help</button>
            <button class="btn-subtle topbar-nav-btn" data-inspect-phrase="">Projects</button>
          </nav>
          ${companionBtn}
          ${accountRight}
        </div>
      </div>`;

    // Inject backdrop as the next sibling (needed for mobile drawer overlay)
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    this.after(backdrop);

    // Wire mobile menu toggle — scoped to the closest management-shell
    const menuBtn = this.querySelector('.topbar-left');
    const toggle = () => {
      const shell = this.closest('.management-shell') || document.querySelector('.management-shell');
      if (shell) shell.classList.toggle('menu-open');
    };
    menuBtn?.addEventListener('click', toggle);
    backdrop.addEventListener('click', toggle);

    // Wire account dropdown (extended variant only)
    if (extended) {
      const accountBtn = this.querySelector('.topbar-account[aria-haspopup]');
      const accountMenu = this.querySelector('.account-menu');
      const closeBtn = this.querySelector('.account-menu-close');
      const backdrop = document.querySelector('.sidebar-backdrop');

      const openMenu = () => {
        accountMenu.classList.add('open');
        accountBtn.setAttribute('aria-expanded', 'true');
        if (backdrop) backdrop.classList.add('account-menu-backdrop');
      };
      const closeMenu = () => {
        accountMenu.classList.remove('open');
        accountBtn.setAttribute('aria-expanded', 'false');
        if (backdrop) backdrop.classList.remove('account-menu-backdrop');
      };

      accountBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        accountMenu.classList.contains('open') ? closeMenu() : openMenu();
      });
      closeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMenu();
      });
      document.addEventListener('click', (e) => {
        if (accountMenu.classList.contains('open') && !accountBtn.contains(e.target) && !accountMenu.contains(e.target)) {
          closeMenu();
        }
      }, { capture: true });
    }
  }
}

customElements.define('jimdo-topbar', JimdoTopbar);

/* ─── jimdo-sidebar ───────────────────────────────────────────────────────── */

class JimdoSidebar extends HTMLElement {
  connectedCallback() {
    const product = this.getAttribute('product') || 'flows';
    const active = this.getAttribute('active') || '';
    const hideIcons = this.hasAttribute('hide-icons');
    // marker — keep the active fill + blue bar on an icon-less nav (Figma 11769:68383).
    // Without it, hide-icons follows Figma 15841:70239 and renders the current item flat.
    const activeMarker = this.hasAttribute('marker');

    // Per-instance label overrides: labels="flows=Bio Page;solo-pages=Pages"
    const labelOverrides = {};
    (this.getAttribute('labels') || '').split(';').forEach(pair => {
      const [k, v] = pair.split('=');
      if (k && v) labelOverrides[k.trim()] = v.trim();
    });

    // Per-instance nav-target overrides: targets="flows=flows/home-dashboard-v2.html".
    // Lets one nav item point at a different screen without changing FLOWS_NAV for
    // every screen that shares it — e.g. the proposed nav sends "Bio Page" to the
    // planned dashboard (scr-131) while live screens keep the shipped target.
    const targetOverrides = {};
    (this.getAttribute('targets') || '').split(';').forEach(pair => {
      const [k, v] = pair.split('=');
      if (k && v) targetOverrides[k.trim()] = v.trim();
    });

    // Per-instance screen ids: screen-ids="flows=scr-131;solo-pages=scr-139".
    // data-nav-to alone moves the iframe but leaves the workbench's right
    // panel on the screen you came from, because prototype-nav posts
    // screenId: null. The rail is the main way between these screens, so a
    // stale panel is most of the time it is wrong.
    const screenIdOverrides = {};
    (this.getAttribute('screen-ids') || '').split(';').forEach(pair => {
      const [k, v] = pair.split('=');
      if (k && v) screenIdOverrides[k.trim()] = v.trim();
    });

    const CHEVRON_SVG = `<svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>`;

    const navItem = ({ id, label, phrase, iconName, hasChevron, badge, badgePhrase, crossProduct, crossScreen, crossScreenId, subNavKey, screen }) => {
      const isActive = id === active;
      const navLabel = labelOverrides[id] || label;
      const badgeHtml = badge ? `<span class="badge badge--primary" data-inspect-phrase="${badgePhrase || ''}">${badge}</span>` : '';
      const chevronHtml = hasChevron ? CHEVRON_SVG : '';
      const crossAttr = crossProduct ? ` data-cross-product="${crossProduct}"` : '';
      const screenAttr = crossScreen ? ` data-cross-screen="${crossScreen}"` : '';
      const screenIdAttr = crossScreenId ? ` data-cross-screen-id="${crossScreenId}"` : '';
      const subAttr = subNavKey ? ` data-sub-product="${subNavKey}"` : '';
      // Intra-product nav: render data-nav-to so prototype-nav.js handles the click.
      const navScreen = targetOverrides[id] || screen;
      const navToAttr = navScreen && !crossProduct ? ` data-nav-to="${navScreen}"` : '';
      const navIdAttr = screenIdOverrides[id] && !crossProduct
        ? ` data-nav-screen-id="${screenIdOverrides[id]}"` : '';
      return `
        <button
          class="sidebar-nav-item${isActive ? ' active' : ''}${hideIcons ? ' sidebar-nav-item--text' : ''}${hideIcons && activeMarker ? ' sidebar-nav-item--text-marker' : ''}"
          ${isActive ? 'aria-current="page"' : ''}
          ${phrase ? `data-inspect-phrase="${phrase}"` : 'data-inspect-phrase=""'}${crossAttr}${screenAttr}${screenIdAttr}${subAttr}${navToAttr}${navIdAttr}
        >
          ${hideIcons ? '' : iconTag(iconName)}
          <span class="nav-item-label">${navLabel}</span>
          ${badgeHtml}${chevronHtml}
        </button>`;
    };

    const variant = this.getAttribute('variant') || '';
    const backLabel = this.getAttribute('back-label') || 'More from Jimdo';
    const defaultTitle = product === 'flows' ? 'Flows' : product === 'bookings' ? 'Bookings' : '';
    const title = this.getAttribute('title') || defaultTitle;

    const contextualHeader = variant === 'contextual' ? `
      <div class="sidebar-back-container">
        <button class="sidebar-back-link" data-inspect-phrase="sidebar.mainMenu">
          ${iconTag('arrow-left-02')}
          <span>${backLabel}</span>
        </button>
      </div>
      <div class="sidebar-section-title" data-inspect-phrase="dashboard.heading">${title}</div>` : '';

    // show-items="flows,buttons-activity" — optional comma-separated ID filter (flows only)
    const showItems = this.getAttribute('show-items');

    if (product === 'flows') {
      const productItems = showItems
        ? FLOWS_NAV.product.filter(item => showItems.split(',').map(s => s.trim()).includes(item.id))
        : FLOWS_NAV.product;
      this.innerHTML = `
        <aside class="shell-side-menu">
          <div class="sidebar-product-links">
            ${contextualHeader}
            <nav class="sidebar-nav" aria-label="Scope">
              ${productItems.map(navItem).join('')}
            </nav>
          </div>
          <div class="sidebar-account-links">
            <nav class="sidebar-nav" aria-label="Account">
              ${FLOWS_NAV.account.map(navItem).join('')}
            </nav>
          </div>
        </aside>`;
    } else if (product === 'bookings') {
      this.innerHTML = `
        <aside class="shell-side-menu">
          <div class="sidebar-product-links">
            ${contextualHeader}
            <nav class="sidebar-nav" aria-label="Scope">
              ${BOOKINGS_NAV.product.map(navItem).join('')}
            </nav>
          </div>
          <div class="sidebar-account-links">
            <nav class="sidebar-nav" aria-label="Account">
              ${BOOKINGS_NAV.account.map(navItem).join('')}
            </nav>
          </div>
        </aside>`;
    } else {
      // Jimdo context sidebar — two-panel slide layout.
      // Main panel shows the full JIMDO_NAV. Clicking a chevron item slides to
      // the sub-panel which shows product-specific pages. Back returns to main.
      // Items with crossProduct navigate directly (cross-nav preserved).
      // Items with hasChevron but no crossProduct open the sub-nav panel.
      const jimdoNavHtml = JIMDO_NAV.map(item => navItem({
        ...item,
        subNavKey: item.hasChevron && !item.crossProduct && JIMDO_SUB_NAVS[item.id] ? item.id : undefined,
      })).join('');

      this.innerHTML = `
        <aside class="shell-side-menu">
          <div class="sidebar-panels">
            <div class="sidebar-panel sidebar-panel--main">
              <nav class="sidebar-nav" aria-label="Jimdo">
                ${jimdoNavHtml}
              </nav>
            </div>
            <div class="sidebar-panel sidebar-panel--sub" aria-hidden="true">
              <div class="sidebar-back-container">
                <button class="sidebar-back-link" data-inspect-phrase="sidebar.mainMenu">
                  ${iconTag('arrow-left-02')}
                  <span>More from Jimdo</span>
                </button>
              </div>
              <div class="sidebar-section-title sidebar-sub-title"></div>
              <nav class="sidebar-nav sidebar-sub-nav" aria-label="Product"></nav>
            </div>
          </div>
        </aside>`;

      const panels = this.querySelector('.sidebar-panels');
      const subTitle = this.querySelector('.sidebar-sub-title');
      const subNav = this.querySelector('.sidebar-sub-nav');
      const subPanel = this.querySelector('.sidebar-panel--sub');
      const mainPanel = this.querySelector('.sidebar-panel--main');

      const wireSubNavCrossProduct = () => {
        subNav.querySelectorAll('[data-cross-product]').forEach(btn => {
          btn.addEventListener('click', () => {
            window.parent?.postMessage(
              {
                type: 'cross-nav',
                targetProduct: btn.dataset.crossProduct,
                targetScreen: btn.dataset.crossScreen || '',
                targetScreenId: btn.dataset.crossScreenId || '',
              },
              '*'
            );
          });
        });
      };

      // Chevron items — slide to sub-panel
      this.querySelectorAll('[data-sub-product]').forEach(btn => {
        btn.addEventListener('click', () => {
          const subConfig = JIMDO_SUB_NAVS[btn.dataset.subProduct];
          if (!subConfig) return;
          subTitle.textContent = subConfig.title;
          subNav.innerHTML = subConfig.items.map(navItem).join('');
          wireSubNavCrossProduct();
          panels.classList.add('sub-active');
          subPanel.removeAttribute('aria-hidden');
          mainPanel.setAttribute('aria-hidden', 'true');
        });
      });

      // Back button — return to main panel
      this.querySelector('.sidebar-back-link').addEventListener('click', () => {
        panels.classList.remove('sub-active');
        mainPanel.removeAttribute('aria-hidden');
        subPanel.setAttribute('aria-hidden', 'true');
      });
    }

    // ── Cross-product navigation ──────────────────────────────────────────────
    // Nav items with a crossProduct mapping fire a cross-nav postMessage to the
    // workbench parent, which relays it to the dashboard to switch product tabs.
    // crossScreen deeplinks the workbench to a specific page on arrival.
    // Items with data-sub-product open the sub-panel (no crossProduct on those).
    // Items with data-cross-product fire cross-nav directly.
    this.querySelectorAll('[data-cross-product]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.parent?.postMessage(
          {
            type: 'cross-nav',
            targetProduct: btn.dataset.crossProduct,
            targetScreen: btn.dataset.crossScreen || '',
            targetScreenId: btn.dataset.crossScreenId || '',
          },
          '*'
        );
      });
    });

    // Contextual back-link cross-nav (back-product + back-screen attributes)
    const backProduct = this.getAttribute('back-product') || '';
    const backScreen  = this.getAttribute('back-screen')  || '';
    if (variant === 'contextual' && backProduct) {
      const backBtn = this.querySelector('.sidebar-back-link');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          window.parent?.postMessage(
            { type: 'cross-nav', targetProduct: backProduct, targetScreen: backScreen }, '*'
          );
        });
      }
    }
  }
}

customElements.define('jimdo-sidebar', JimdoSidebar);

/* ─── flows-button-card ───────────────────────────────────────────────────── */
/**
 * <flows-button-card> — renders a flow card in review or live state.
 *
 * Attributes:
 *   variant        — "review" (default) | "live"
 *   title          — display name of the flow / button
 *   img            — image src
 *   status-phrase  — data-inspect-phrase for status label (default: flow.status.hidden)
 *   status-text    — visible status text (default: Hidden)
 *   action-phrase  — data-inspect-phrase for review footer action (review variant only)
 *   action-text    — visible review footer action text (review variant only)
 *   edit-label     — aria-label for edit button (default: "Edit <title>")
 *   more-label     — aria-label for more button (default: "More options for <title>")
 */
class FlowsButtonCard extends HTMLElement {
  connectedCallback() {
    const variant      = this.getAttribute('variant') || 'review';
    const title        = this.getAttribute('title') || '';
    const img          = this.getAttribute('img') || '';
    const statusPhrase = this.getAttribute('status-phrase') || 'flow.status.hidden';
    const statusText   = this.getAttribute('status-text') || 'Hidden';
    const actionPhrase = this.getAttribute('action-phrase') || '';
    const actionText   = this.getAttribute('action-text') || '';
    const editLabel    = this.getAttribute('edit-label') || `Edit ${title}`;
    const moreLabel    = this.getAttribute('more-label') || `More options for ${title}`;

    const actionBtns = `
      <div class="flow-card-actions">
        <button class="flow-card-action-btn" aria-label="${editLabel}">
          ${iconTag('pencil-edit-02')}
        </button>
        <button class="flow-card-action-btn" aria-label="${moreLabel}">
          ${iconTag('more-vertical')}
        </button>
      </div>`;

    if (variant === 'live') {
      this.innerHTML = `
        <div class="flow-card flow-card--live">
          <div class="flow-card-inner">
            <div class="flow-card-image-wrap">
              <img class="flow-card-img" src="${img}" alt="${title} thumbnail">
            </div>
            <div class="flow-card-body">
              <div class="flow-card-title">${title}</div>
              <div class="flow-card-activity">
                <div class="flow-card-live-stats">
                  <div class="stat-group">
                    <span class="stat-count">0</span>
                    <span class="stat-label" data-inspect-phrase="statsCounter.views">Views</span>
                  </div>
                  <div class="stat-group">
                    <span class="stat-count">0</span>
                    <span class="stat-label" data-inspect-phrase="statsCounter.clicks">Clicks</span>
                  </div>
                  <div class="stat-group">
                    <span class="stat-count">0</span>
                    <span class="stat-label" data-inspect-phrase="statsCounter.clients">Clients</span>
                  </div>
                </div>
                ${actionBtns}
              </div>
            </div>
          </div>
        </div>`;
    } else {
      this.innerHTML = `
        <div class="flow-card flow-card--review">
          <div class="flow-card-inner">
            <div class="flow-card-image-wrap">
              <img class="flow-card-img" src="${img}" alt="${title} thumbnail">
            </div>
            <div class="flow-card-body">
              <div class="flow-card-title">${title}</div>
              <div class="flow-card-activity">
                <div class="flow-card-status">
                  ${iconTag('view-off')}
                  <span data-inspect-phrase="${statusPhrase}">${statusText}</span>
                </div>
                ${actionBtns}
              </div>
            </div>
          </div>
          <div class="flow-card-context">
            <span class="flow-card-context-dot" aria-hidden="true"></span>
            <span class="flow-card-context-label" data-inspect-phrase="flow.needsReview.label">Needs review</span>
            <span class="flow-card-context-text" data-inspect-phrase="${actionPhrase}">${actionText}</span>
          </div>
        </div>`;
    }
  }
}

customElements.define('flows-button-card', FlowsButtonCard);

/* ─── flows-checkin-item ─────────────────────────────────────────────────── */
/**
 * <flows-checkin-item> — renders one step in the check-in list.
 *
 * State is controlled by the parent `<flows-checkin-card>`, which classifies
 * each child after every toggle:
 *   - "done"    — completed. Green check button + strikethrough title + primary
 *                 nav action only. No "Done" affordance (already done).
 *                 Clicking the green check reverts to incomplete.
 *   - "active"  — first incomplete row (top-down). Blue-10 bg + NEXT badge.
 *                 Expanded by default; shows desc + primary action + Done.
 *   - "pending" — any other incomplete row. Gray bg, collapsed by default.
 *                 Expanded shows desc + primary + Done.
 *
 * Mark-complete affordances on non-done rows:
 *   - Circle button (always visible)
 *   - "Done" gray text button (in expanded actions) — explicit verb for
 *     discoverability; mirrors clicking the circle.
 *
 * On done rows the only revert path is clicking the green check button.
 *
 * Tab order per row: circle → (if expanded) primary action → Done → chevron.
 * Done row tab order: check button → (if expanded) primary → chevron.
 *
 * Attributes:
 *   state             — "done" | "active" | "pending"     (set by parent card)
 *   title             — task title
 *   title-phrase      — data-inspect-phrase for title
 *   desc              — description paragraph (active/pending — hidden on done)
 *   next-badge-phrase — phrase key for NEXT badge (default: checkin.nextBadge)
 *   primary-phrase / primary-text — primary action label and inspect phrase
 *   primary-href      — if set, primary action renders as <a target="_blank">
 *                       (handles Instagram universal links on mobile)
 *   complete-phrase   — phrase key for the gray "Done" button (default: checkin.action.markDone)
 */
class FlowsCheckinItem extends HTMLElement {
  static get observedAttributes() {
    return ['state', 'title', 'desc', 'primary-text', 'primary-href', 'primary-phrase'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== null && oldVal !== newVal && this.isConnected) this.render();
  }

  connectedCallback() { this.render(); }

  render() {
    const state           = this.getAttribute('state') || 'pending';
    const title           = this.getAttribute('title') || '';
    const titlePhrase     = this.getAttribute('title-phrase') || '';
    const desc            = this.getAttribute('desc') || '';
    const nextBadgePhrase = this.getAttribute('next-badge-phrase') || 'checkin.nextBadge';
    const primaryPhrase   = this.getAttribute('primary-phrase') || '';
    const primaryText     = this.getAttribute('primary-text') || '';
    const primaryHref     = this.getAttribute('primary-href') || '';
    const completePhrase  = this.getAttribute('complete-phrase') || 'checkin.action.markDone';

    const isDone   = state === 'done';
    const isActive = state === 'active';
    const expanded = isActive;

    const circleHTML = isDone
      ? `<button type="button" class="checkin-mark-btn checkin-mark-btn--done" aria-label="Mark ${title} as not done">
           <span class="checkin-check" aria-hidden="true">${iconTag('tick-02')}</span>
         </button>`
      : `<button type="button" class="checkin-mark-btn" aria-label="Mark ${title} as complete">
           <span class="checkin-ring" aria-hidden="true"></span>
         </button>`;

    const titleHTML = isDone
      ? `<span class="checkin-done-text" data-inspect-phrase="${titlePhrase}">${title}</span>`
      : `<span class="checkin-title" data-inspect-phrase="${titlePhrase}">${title}</span>`;

    const badgeHTML = isActive
      ? `<span class="checkin-next-badge" data-inspect-phrase="${nextBadgePhrase}">Next</span>`
      : '';

    const primaryHTML = primaryText
      ? (primaryHref
          ? `<a class="checkin-action-primary" href="${primaryHref}" target="_blank" rel="noopener" data-inspect-phrase="${primaryPhrase}">${primaryText}</a>`
          : `<button type="button" class="checkin-action-primary" data-inspect-phrase="${primaryPhrase}">${primaryText}</button>`)
      : '';

    // Gray "Done" text button — visible on incomplete rows so users see a verb
    // hint for marking complete. Hidden on done rows (the green check is the only revert).
    const doneActionHTML = isDone
      ? ''
      : `<button type="button" class="checkin-action-done" data-inspect-phrase="${completePhrase}">Done</button>`;

    const actionsHTML = (primaryHTML || doneActionHTML)
      ? `<div class="checkin-actions">${primaryHTML}${doneActionHTML}</div>`
      : '';

    const stateClass = isDone ? 'done' : isActive ? 'active' : 'pending';

    this.innerHTML = `
      <div class="checkin-item checkin-item--${stateClass}" data-expanded="${expanded}">
        ${circleHTML}
        <div class="checkin-body">
          <div class="checkin-title-block">
            <div class="checkin-title-row">
              ${titleHTML}
              ${badgeHTML}
            </div>
            ${desc && !isDone ? `<p class="checkin-desc">${desc}</p>` : ''}
          </div>
          ${actionsHTML}
        </div>
        <button type="button" class="checkin-chevron" aria-expanded="${expanded}" aria-label="${expanded ? 'Collapse' : 'Expand'} ${title}">
          ${iconTag(expanded ? 'chevron-up' : 'chevron-down')}
        </button>
      </div>`;

    this.wire(title);
  }

  wire(title) {
    const item    = this.querySelector('.checkin-item[data-expanded]');
    const chevron = this.querySelector('.checkin-chevron');
    const markBtn = this.querySelector('.checkin-mark-btn');
    const doneBtn = this.querySelector('.checkin-action-done');
    if (!item) return;

    // toggleExpand(advanceFocus):
    //   advanceFocus = true  → after opening, move focus into the first interior
    //                         action (WAI disclosure pattern). Used when the
    //                         chevron triggers the toggle (keyboard or mouse).
    //   advanceFocus = false → leave focus alone. Used for row-body clicks so
    //                         mouse users don't see focus jump around.
    // On collapse, focus is never moved — the user stays where they were.
    const toggleExpand = (advanceFocus) => {
      const next = item.dataset.expanded !== 'true';
      item.dataset.expanded = String(next);
      if (chevron) {
        chevron.setAttribute('aria-expanded', String(next));
        chevron.setAttribute('aria-label', `${next ? 'Collapse' : 'Expand'} ${title}`);
        chevron.innerHTML = iconTag(next ? 'chevron-up' : 'chevron-down');
      }
      if (next && advanceFocus) {
        const firstAction = this.querySelector('.checkin-actions :is(button, a)');
        if (firstAction) firstAction.focus();
      }
    };

    const toggleDone = () => {
      const nowCompleted = this.getAttribute('state') !== 'done';
      this.dispatchEvent(new CustomEvent('checkin-item-toggle', {
        bubbles: true,
        detail: { title, completed: nowCompleted }
      }));
    };

    item.addEventListener('click', (e) => {
      if (e.target.closest('.checkin-mark-btn, .checkin-action-primary, .checkin-action-done, .checkin-chevron')) return;
      toggleExpand(false);
    });

    chevron?.addEventListener('click', (e) => { e.stopPropagation(); toggleExpand(true); });
    markBtn?.addEventListener('click', (e) => { e.stopPropagation(); toggleDone(); });
    doneBtn?.addEventListener('click', (e) => { e.stopPropagation(); toggleDone(); });
  }
}

customElements.define('flows-checkin-item', FlowsCheckinItem);

/* ─── flows-checkin-card ─────────────────────────────────────────────────── *
 * Renders the full "Make it sell" card: progress ring + title + counter + items list.
 * Child <flows-checkin-item> elements are preserved and moved into .checkin-items.
 * Uses setTimeout(0) to defer rendering until the HTML parser has added all children.
 *
 * Attributes:
 *   title           — heading text ("Make it sell")
 *   title-phrase    — data-inspect-phrase for title (default: "checkin.title")
 *   done            — number of completed steps (drives progress arc)
 *   total           — total steps (default: 3)
 *   counter-phrase  — data-inspect-phrase for counter (default: "checkin.counter")
 */
class FlowsCheckinCard extends HTMLElement {
  connectedCallback() {
    // Defer so the HTML parser has time to add child elements first
    setTimeout(() => {
      this._title         = this.getAttribute('title') || '';
      this._titlePhrase   = this.getAttribute('title-phrase') || 'checkin.title';
      this._total         = parseInt(this.getAttribute('total') || '3', 10);
      this._counterPhrase = this.getAttribute('counter-phrase') || 'checkin.counter';

      const items = Array.from(this.children).filter(c => c.tagName.toLowerCase() === 'flows-checkin-item');

      // Seed each child's completion from its initial state attribute.
      items.forEach(item => {
        item.dataset.completed = String(item.getAttribute('state') === 'done');
      });

      this.innerHTML = `
        <div class="checkin-card">
          <div class="checkin-progress-header">
            <svg class="checkin-progress-arc" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" style="flex-shrink:0;">
              <circle cx="16" cy="16" r="12" stroke="var(--jui-color-gray-200)" stroke-width="3" fill="none"/>
              <circle class="checkin-progress-fill" cx="16" cy="16" r="12" stroke="var(--jui-color-green-400)" stroke-width="3" fill="none"
                stroke-linecap="round" transform="rotate(-90 16 16)"/>
            </svg>
            <div class="checkin-progress-labels">
              <span class="checkin-progress-title" data-inspect-phrase="${this._titlePhrase}">${this._title}</span>
              <span class="checkin-progress-counter" data-inspect-phrase="${this._counterPhrase}"></span>
            </div>
          </div>
          <div class="checkin-items"></div>
        </div>`;

      const container = this.querySelector('.checkin-items');
      items.forEach(item => container.appendChild(item));

      this._recompute();

      // Each item dispatches checkin-item-toggle on circle click. The card
      // is the source of truth for positions — first incomplete (top-down)
      // becomes active, rest become pending, completed become done.
      this.addEventListener('checkin-item-toggle', (e) => {
        const target = e.target.closest('flows-checkin-item');
        if (target) target.dataset.completed = String(e.detail.completed);
        this._recompute();
      });
    }, 0);
  }

  _recompute() {
    const items = Array.from(this.querySelectorAll('flows-checkin-item'));
    let foundActive = false;
    let doneCount = 0;
    items.forEach(item => {
      const completed = item.dataset.completed === 'true';
      if (completed) {
        item.setAttribute('state', 'done');
        doneCount++;
      } else if (!foundActive) {
        item.setAttribute('state', 'active');
        foundActive = true;
      } else {
        item.setAttribute('state', 'pending');
      }
    });
    this._done = doneCount;
    this._updateProgress();
  }

  _updateProgress() {
    const circ = 2 * Math.PI * 12;
    const filled = (this._done / this._total) * circ;
    const fillEl = this.querySelector('.checkin-progress-fill');
    if (fillEl) fillEl.setAttribute('stroke-dasharray', `${filled.toFixed(2)} ${(circ - filled).toFixed(2)}`);
    const counterEl = this.querySelector('.checkin-progress-counter');
    if (counterEl) counterEl.textContent = `${this._done} of ${this._total}`;
  }
}

customElements.define('flows-checkin-card', FlowsCheckinCard);

/* ─── flows-companion-input ───────────────────────────────────────────────── *
 * Renders the Companion section: logo header row + pill-shaped AI input bar.
 *
 * Attributes:
 *   placeholder-phrase  — data-inspect-phrase for placeholder (default: "companion.placeholder")
 *   placeholder-text    — visible placeholder text
 *   help-phrase         — data-inspect-phrase for help link (default: "companion.helpLink")
 *   help-text           — visible help link text
 */
class FlowsCompanionInput extends HTMLElement {
  connectedCallback() {
    const placeholderPhrase = this.getAttribute('placeholder-phrase') || 'companion.placeholder';
    const placeholderText = this.getAttribute('placeholder-text') || 'How can I help your business?';
    const helpPhrase = this.getAttribute('help-phrase') || 'companion.helpLink';
    const helpText = this.getAttribute('help-text') || 'Learn how to use Companion';

    this.innerHTML = `
      <div class="companion-section">
        <div class="companion-header-row">
          <div class="companion-logo-group">
            <img class="companion-logo-img"
              src="/flows-prototype/design-system/hifi-designs/shared/companion_beta_logo.svg"
              alt="Companion">
          </div>
          <a class="companion-help-link" href="#" data-inspect-phrase="${helpPhrase}">${helpText}</a>
        </div>
        <div class="companion-input-bar" role="button" tabindex="0" aria-label="Open Companion">
          <span class="companion-input-placeholder" data-inspect-phrase="${placeholderPhrase}">${placeholderText}</span>
          <button class="companion-send-btn" type="button" aria-label="Send" tabindex="-1">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>`;

    // Open Companion Chat Full as a workbench popup overlay
    this.querySelector('.companion-input-bar').addEventListener('click', () => {
      window.parent?.postMessage(
        { type: 'popup-nav', src: 'pages/core/companion-chat-full.html' }, '*'
      );
    });
  }
}

customElements.define('flows-companion-input', FlowsCompanionInput);
