/* ══════════════════════════════════════════
   Prototype cross-file navigation

   Usage in any hifi HTML file:
     <button data-trigger="primary-cta" data-nav-to="onboarding-name.html">…</button>

   Behaviour:
   1. If a workflow is active (workflow-context received from parent) AND the
      clicked element has data-trigger that exists in the workflow's nextMap,
      navigate to the mapped screen's hifi src.
   2. Else, fall back to data-nav-to (legacy / standalone path).
   3. After any navigation, post 'prototype-nav' (legacy) and, when in workflow
      mode, also 'workflow-advance' so the parent's runner strip can update.

   Loaded once by each page with:
     <script src="/flows-prototype/design-system/hifi-designs/prototype-nav.js"></script>
   ══════════════════════════════════════════ */
(function () {
  'use strict';

  var PAGES_BASE = '/flows-prototype/design-system/hifi-designs/pages/';
  var workflowCtx = null; // { workflowId, stepIndex, screenId, nextMap, registry }

  function resolveTarget(target) {
    if (!target) return null;
    if (target.indexOf('/') === 0 || /^https?:/.test(target)) return target;
    return PAGES_BASE + target;
  }

  // Translate a target scr-NNN into a hifi src using the registry sent by parent.
  function resolveScreenId(screenId) {
    if (!workflowCtx || !workflowCtx.registry) return null;
    var entry = workflowCtx.registry[screenId];
    if (!entry || !entry.prototype || !entry.prototype.src) return null;
    return '/' + entry.prototype.src; // registry paths are repo-relative
  }

  function postToParent(payload) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
      }
    } catch (err) { /* noop */ }
  }

  function onNavClick(e) {
    var trigger = e.target.closest('[data-trigger], [data-nav-to]');
    if (!trigger) return;

    var triggerName = trigger.getAttribute('data-trigger');
    var navTarget = trigger.getAttribute('data-nav-to');

    // 1. Workflow-mapped path
    if (workflowCtx && triggerName && workflowCtx.nextMap && workflowCtx.nextMap[triggerName]) {
      var nextScreenId = workflowCtx.nextMap[triggerName];
      var url = resolveScreenId(nextScreenId);
      if (url) {
        e.preventDefault();
        postToParent({
          type: 'workflow-advance',
          workflowId: workflowCtx.workflowId,
          fromScreenId: workflowCtx.screenId || null,
          toScreenId: nextScreenId,
          trigger: triggerName
        });
        postToParent({ type: 'prototype-nav', target: nextScreenId, url: url, screenId: nextScreenId });
        window.location.href = url;
        return;
      }
    }

    // 2. Fallback: legacy data-nav-to
    if (!navTarget) return;
    var fallbackUrl = resolveTarget(navTarget);
    if (!fallbackUrl) return;

    e.preventDefault();
    postToParent({
      type: 'prototype-nav',
      target: navTarget,
      url: fallbackUrl,
      displayUrl: trigger.getAttribute('data-nav-display-url') || null,
      screenId: trigger.getAttribute('data-nav-screen-id') || null
    });
    window.location.href = fallbackUrl;
  }

  function onMessage(ev) {
    var msg = ev.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'workflow-context') {
      workflowCtx = {
        workflowId: msg.workflowId,
        stepIndex: msg.stepIndex,
        screenId: msg.screenId || null,
        nextMap: msg.nextMap || {},
        registry: msg.registry || {}
      };
    } else if (msg.type === 'workflow-clear') {
      workflowCtx = null;
    }
  }

  document.addEventListener('click', onNavClick);
  window.addEventListener('message', onMessage);

  // Announce ready so the parent can resend context on iframe reload.
  postToParent({ type: 'prototype-nav-ready' });
})();
