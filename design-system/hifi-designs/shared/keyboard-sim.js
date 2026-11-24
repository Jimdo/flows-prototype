/*
 * Keyboard simulator for the workbench's mobile device frame.
 *
 * When a text field inside the prototype iframe gets focus, an iOS-style
 * on-screen keyboard slides up over the bottom of the device frame — the way
 * iOS Safari does it: the keyboard OVERLAYS the page, the layout viewport does
 * not shrink, so anything pinned to the bottom (CTAs, footers) ends up behind
 * it. If the focused field would be covered, the page is scrolled first and,
 * when it can't scroll far enough, the whole page is panned up (iOS's
 * visual-viewport pan), which is what pushes headers out of view on device.
 *
 * The point is to make the keyboard state visible while designing, so every
 * screen with a text field gets looked at with the keyboard open.
 *
 * Wiring (index.html): KeyboardSim.init({...}) once, KeyboardSim.sync() when
 * the device or the Normal/Inspect mode changes, KeyboardSim.toggleFirstField()
 * for the K shortcut. Same-origin prototypes only; cross-origin frames
 * (react:, embed URLs) are silently ignored.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'flows-dash:keyboard-sim';

  // Frame-pixel dimensions (the mobile frame is 360 wide).
  var BAR_H = 44;      // Safari's form accessory bar (‹ › Done)
  var KEYS_H = 205;    // four key rows
  var SYS_H = 70;      // globe / mic strip + home indicator
  var KEYBOARD_H = BAR_H + KEYS_H + SYS_H;
  var FIELD_MARGIN = 12;

  var TEXT_INPUT_TYPES = { '': 1, text: 1, search: 1, email: 1, url: 1, tel: 1, password: 1, number: 1 };
  var BLUE_ACTIONS = { go: 1, search: 1, send: 1, done: 1, next: 1 };

  var ROWS = [
    'qwertyuiop'.split(''),
    'asdfghjkl'.split(''),
    'zxcvbnm'.split(''),
  ];

  // iOS number/phone pad: digit + the letters printed under it.
  var PAD = [
    [['1', ''], ['2', 'ABC'], ['3', 'DEF']],
    [['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO']],
    [['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ']],
  ];

  var ICONS = {
    shift: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 4l8 8h-4.5v7h-7v-7H4z"/></svg>',
    shiftOn: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 4l8 8h-4.5v7h-7v-7H4z"/></svg>',
    del: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M9 5h11a1 1 0 011 1v12a1 1 0 01-1 1H9l-6-7z"/><path d="M12 9l6 6M18 9l-6 6"/></svg>',
    globe: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/></svg>',
    mic: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"/></svg>',
    up: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  };

  var CSS = [
    '.device-frame .browser-chrome-top { position: relative; z-index: 2; }',
    '.device-frame iframe#viewport { transition: transform 250ms cubic-bezier(.2,.8,.2,1); }',
    '.kbsim { position: absolute; left: 0; right: 0; bottom: 0; z-index: 3; height: ' + KEYBOARD_H + 'px;',
    '  transform: translateY(100%); transition: transform 250ms cubic-bezier(.2,.8,.2,1);',
    '  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;',
    '  user-select: none; -webkit-user-select: none; pointer-events: none; color: #000; }',
    '.device-frame.kbsim-open .kbsim { transform: translateY(0); pointer-events: auto; }',
    '.kbsim button { font-family: inherit; color: inherit; border: 0; padding: 0; margin: 0; cursor: pointer; }',
    '.kbsim-bar { height: ' + BAR_H + 'px; display: flex; align-items: center; padding: 0 6px 0 4px;',
    '  background: #f6f6f7; border-top: 0.5px solid #b9b9be; box-sizing: border-box; }',
    '.kbsim-nav { width: 40px; height: 40px; background: none; color: #007aff !important; display: grid; place-items: center; }',
    '.kbsim-nav:disabled { color: #c4c4c7 !important; cursor: default; }',
    '.kbsim .kbsim-done { margin-left: auto; background: none; color: #007aff !important; font-size: 17px; font-weight: 600; padding: 0 10px !important; height: 40px; }',
    '.kbsim-board { height: ' + (KEYS_H + SYS_H) + 'px; background: #d1d4da; padding: 8px 3px 0; box-sizing: border-box; display: flex; flex-direction: column; }',
    '.kbsim-row { display: flex; gap: 6px; justify-content: center; margin-bottom: 11px; }',
    '.kbsim-row--split { justify-content: space-between; }',
    '.kbsim-group { display: flex; gap: 6px; }',
    '.kbsim-key { flex: 0 0 30px; height: 40px; border-radius: 5px; background: #fff; box-shadow: 0 1px 0 rgba(0,0,0,.35);',
    '  font-size: 22px; line-height: 1; display: grid; place-items: center; }',
    '.kbsim-key:active { background: #abb0bc; }',
    '.kbsim-key--fn { flex-basis: 42px; background: #abb0bc; }',
    '.kbsim-key--fn:active { background: #fff; }',
    '.kbsim-key--label { font-size: 16px; }',
    '.kbsim-key--123 { flex-basis: 76px; }',
    '.kbsim-key--space { flex: 1 1 auto; }',
    '.kbsim-key--action { flex-basis: 84px; }',
    '.kbsim-key--blue { background: #007aff; color: #fff !important; }',
    '.kbsim-key--blue:active { background: #abb0bc; color: #000 !important; }',
    '.kbsim-pad { display: none; }',
    '.kbsim--pad .kbsim-alpha { display: none; }',
    '.kbsim--pad .kbsim-pad { display: block; }',
    '.kbsim-pad .kbsim-row { gap: 6px; margin-bottom: 7px; padding: 0 3px; }',
    '.kbsim-pad .kbsim-key { flex: 1 1 0; height: 44px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; font-size: 25px; }',
    '.kbsim-pad .kbsim-key small { font-size: 10px; font-weight: 600; letter-spacing: 2px; line-height: 1; }',
    '.kbsim-pad .kbsim-key--label { font-size: 18px; }',
    '.kbsim-pad .kbsim-key--blank { background: none; box-shadow: none; cursor: default; }',
    '.kbsim-pad .kbsim-key--fn { background: none; box-shadow: none; }',
    '.kbsim-pad .kbsim-key--fn:active { background: #abb0bc; }',
    '.kbsim-sys { flex: 1; position: relative; display: flex; justify-content: space-between; align-items: flex-start; padding: 4px 20px 0; color: #4b4f57; }',
    '.kbsim-sys span { display: grid; place-items: center; width: 40px; height: 40px; }',
    '.kbsim-home { position: absolute; left: 50%; bottom: 8px; width: 124px; height: 5px; margin-left: -62px; border-radius: 3px; background: #000; }',
    '#btnKeyboardSim:disabled { opacity: .4; cursor: default; }',
  ].join('\n');

  var opts = null;
  var root = null;
  var state = { open: false, field: null, shift: false, closeTimer: null, doc: null };

  function readEnabled() {
    try { return localStorage.getItem(STORAGE_KEY) !== '0'; } catch (e) { return true; }
  }
  function writeEnabled(on) {
    try { localStorage.setItem(STORAGE_KEY, on ? '1' : '0'); } catch (e) { /* storage unavailable */ }
  }
  var enabled = readEnabled();

  function active() { return enabled && !!opts && opts.isActive(); }

  function frameDoc() {
    try { return opts.viewport.contentDocument; } catch (e) { return null; }
  }

  function isTextField(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.isContentEditable) return true;
    if (el.disabled || el.readOnly) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName !== 'INPUT') return false;
    return !!TEXT_INPUT_TYPES[(el.getAttribute('type') || '').toLowerCase()];
  }

  function isVisible(el) { return el.getClientRects().length > 0; }

  function textFields(doc) {
    var all = doc.querySelectorAll('input, textarea, [contenteditable=""], [contenteditable="true"]');
    return Array.prototype.filter.call(all, function (el) { return isTextField(el) && isVisible(el); });
  }

  // What iOS prints on the return key.
  function returnLabel(el) {
    var hint = (el.getAttribute('enterkeyhint') || '').toLowerCase();
    if (hint === 'go' || hint === 'next' || hint === 'done' || hint === 'search' || hint === 'send') return hint;
    if (hint === 'enter' || hint === 'previous') return 'return';
    if (el.tagName === 'TEXTAREA' || el.isContentEditable) return 'return';
    if ((el.getAttribute('type') || '').toLowerCase() === 'search') return 'search';
    if (el.form) return 'go';
    return 'return';
  }

  // Which iOS pad replaces the letters, if any. The pad has no return key —
  // a field that opens it can't be submitted from the keyboard.
  function padKind(el) {
    var mode = (el.getAttribute('inputmode') || '').toLowerCase();
    if (mode === 'tel' || mode === 'numeric' || mode === 'decimal') return mode;
    if (!mode && (el.getAttribute('type') || '').toLowerCase() === 'tel') return 'tel';
    return null;
  }

  function autoCapitalize(el) {
    var type = (el.getAttribute('type') || '').toLowerCase();
    if (type === 'email' || type === 'url' || type === 'password') return false;
    var ac = (el.getAttribute('autocapitalize') || '').toLowerCase();
    if (ac === 'none' || ac === 'off') return false;
    var value = el.isContentEditable ? el.textContent : el.value;
    return !value;
  }

  // ─── DOM ───

  function key(label, cls, action, value) {
    return '<button type="button" tabindex="-1" class="kbsim-key ' + (cls || '') + '" data-action="' + action + '"' +
      (value != null ? ' data-value="' + value + '"' : '') + '>' + label + '</button>';
  }

  function render() {
    var letters = function (row) {
      return row.map(function (ch) { return key(ch, 'kbsim-letter', 'char', ch); }).join('');
    };
    root = document.createElement('div');
    root.className = 'kbsim';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML =
      '<div class="kbsim-bar">' +
        '<button type="button" tabindex="-1" class="kbsim-nav" data-action="prev" title="Previous field">' + ICONS.up + '</button>' +
        '<button type="button" tabindex="-1" class="kbsim-nav" data-action="next-field" title="Next field">' + ICONS.down + '</button>' +
        '<button type="button" tabindex="-1" class="kbsim-done" data-action="done">Done</button>' +
      '</div>' +
      '<div class="kbsim-board">' +
        '<div class="kbsim-pad">' +
          PAD.map(function (row) {
            return '<div class="kbsim-row">' + row.map(function (d) {
              return key(d[0] + '<small>' + (d[1] || '&nbsp;') + '</small>', '', 'char', d[0]);
            }).join('') + '</div>';
          }).join('') +
          '<div class="kbsim-row">' +
            '<span class="kbsim-pad-corner" style="display:contents"></span>' +
            key('0<small>&nbsp;</small>', '', 'char', '0') +
            key(ICONS.del, 'kbsim-key--fn', 'delete') +
          '</div>' +
        '</div>' +
        '<div class="kbsim-alpha">' +
        '<div class="kbsim-row">' + letters(ROWS[0]) + '</div>' +
        '<div class="kbsim-row">' + letters(ROWS[1]) + '</div>' +
        '<div class="kbsim-row kbsim-row--split">' +
          key(ICONS.shift, 'kbsim-key--fn kbsim-shift', 'shift') +
          '<div class="kbsim-group">' + letters(ROWS[2]) + '</div>' +
          key(ICONS.del, 'kbsim-key--fn', 'delete') +
        '</div>' +
        '<div class="kbsim-row">' +
          key('123', 'kbsim-key--fn kbsim-key--label kbsim-key--123', 'noop') +
          '<span class="kbsim-extra" style="display:contents"></span>' +
          key('space', 'kbsim-key--label kbsim-key--space', 'char', ' ') +
          key('return', 'kbsim-key--fn kbsim-key--label kbsim-key--action', 'return') +
        '</div>' +
        '</div>' +
        '<div class="kbsim-sys"><span>' + ICONS.globe + '</span><span>' + ICONS.mic + '</span><div class="kbsim-home"></div></div>' +
      '</div>';

    // Keep focus in the prototype: a mousedown in the parent document would
    // otherwise blur the field and close the keyboard.
    root.addEventListener('mousedown', function (e) { e.preventDefault(); });
    root.addEventListener('click', onKey);
    opts.frame.appendChild(root);
  }

  function paint() {
    var el = state.field;
    if (!el || !root) return;
    var pad = padKind(el);
    root.classList.toggle('kbsim--pad', !!pad);
    root.querySelector('.kbsim-pad-corner').innerHTML =
      pad === 'tel' ? key('+*#', 'kbsim-key--fn kbsim-key--label', 'char', '+')
      : pad === 'decimal' ? key('.', 'kbsim-key--fn', 'char', '.')
      : key('', 'kbsim-key--blank', 'noop');

    var label = returnLabel(el);
    var action = root.querySelector('.kbsim-key--action');
    action.textContent = label;
    action.classList.toggle('kbsim-key--blue', !!BLUE_ACTIONS[label]);
    action.classList.toggle('kbsim-key--fn', !BLUE_ACTIONS[label]);

    var isEmail = (el.getAttribute('type') || '').toLowerCase() === 'email' ||
      (el.getAttribute('inputmode') || '').toLowerCase() === 'email';
    root.querySelector('.kbsim-extra').innerHTML = isEmail
      ? key('@', 'kbsim-key--label', 'char', '@') + key('.', 'kbsim-key--label', 'char', '.')
      : '';

    var shiftBtn = root.querySelector('.kbsim-shift');
    shiftBtn.innerHTML = state.shift ? ICONS.shiftOn : ICONS.shift;
    Array.prototype.forEach.call(root.querySelectorAll('.kbsim-letter'), function (b) {
      b.textContent = state.shift ? b.dataset.value.toUpperCase() : b.dataset.value;
    });

    var fields = textFields(el.ownerDocument);
    var i = fields.indexOf(el);
    root.querySelector('[data-action="prev"]').disabled = i <= 0;
    root.querySelector('[data-action="next-field"]').disabled = i < 0 || i >= fields.length - 1;
  }

  // ─── Behaviour ───

  function scrollParent(el) {
    var doc = el.ownerDocument;
    var win = doc.defaultView;
    for (var n = el.parentElement; n && n !== doc.body && n !== doc.documentElement; n = n.parentElement) {
      var oy = win.getComputedStyle(n).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight) return n;
    }
    return doc.scrollingElement || doc.documentElement;
  }

  function setPan(px) {
    opts.viewport.style.transform = px ? 'translateY(' + (-px) + 'px)' : '';
  }

  // iOS keeps the focused field above the keyboard: scroll first, then pan
  // the whole page for whatever scrolling couldn't cover.
  function ensureVisible(el) {
    var overlap = KEYBOARD_H - opts.chromeBottom;
    var visibleH = opts.viewport.clientHeight - overlap;
    var scroller = scrollParent(el);
    var rect = el.getBoundingClientRect();
    // Focus is preventScroll, so a field above the fold (K, ‹) comes down first.
    if (rect.top < FIELD_MARGIN) {
      scroller.scrollTop += rect.top - FIELD_MARGIN;
      rect = el.getBoundingClientRect();
    }
    var need = rect.bottom + FIELD_MARGIN - visibleH;
    if (need > 0) {
      scroller.scrollTop += need;
      rect = el.getBoundingClientRect();
      need = rect.bottom + FIELD_MARGIN - visibleH;
    }
    var pan = Math.max(0, Math.min(need, overlap, rect.top - FIELD_MARGIN));
    setPan(pan > 0 ? Math.round(pan) : 0);
  }

  function open(el) {
    clearTimeout(state.closeTimer);
    var refocus = state.open && state.field !== el;
    if (!state.open || refocus) state.shift = autoCapitalize(el);
    state.field = el;
    state.open = true;
    paint();
    opts.frame.classList.add('kbsim-open');
    ensureVisible(el);
  }

  function close() {
    clearTimeout(state.closeTimer);
    state.open = false;
    state.field = null;
    if (opts) {
      opts.frame.classList.remove('kbsim-open');
      setPan(0);
    }
  }

  function focusField(el) {
    try { opts.viewport.contentWindow.focus(); } catch (e) { return; }
    el.focus({ preventScroll: true });
  }

  function moveField(step) {
    if (!state.field) return;
    var fields = textFields(state.field.ownerDocument);
    var next = fields[fields.indexOf(state.field) + step];
    if (next) focusField(next);
  }

  function exec(cmd, value) {
    var doc = state.field && state.field.ownerDocument;
    if (doc) doc.execCommand(cmd, false, value);
  }

  function onKey(e) {
    var btn = e.target.closest('button[data-action]');
    if (!btn || !state.field) return;
    var el = state.field;
    switch (btn.dataset.action) {
      case 'char':
        var ch = btn.dataset.value;
        exec('insertText', state.shift ? ch.toUpperCase() : ch);
        if (state.shift && ch !== ' ') { state.shift = false; paint(); }
        break;
      case 'delete':
        exec('delete');
        break;
      case 'shift':
        state.shift = !state.shift;
        paint();
        break;
      case 'return':
        if (el.tagName === 'TEXTAREA') { exec('insertText', '\n'); break; }
        if (el.isContentEditable) { exec('insertLineBreak'); break; }
        if (returnLabel(el) === 'next') { moveField(1); break; }
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }));
        el.blur();
        close();
        break;
      case 'prev': moveField(-1); break;
      case 'next-field': moveField(1); break;
      case 'done': el.blur(); close(); break;
    }
  }

  function onFocusIn(e) {
    if (!active()) return;
    if (isTextField(e.target)) open(e.target);
  }

  function onFocusOut() {
    if (!state.open) return;
    var doc = state.doc;
    clearTimeout(state.closeTimer);
    // Wait a beat so moving between fields doesn't flash the keyboard.
    state.closeTimer = setTimeout(function () {
      if (!doc || !doc.hasFocus() || !isTextField(doc.activeElement)) close();
    }, 100);
  }

  // Typing on the physical keyboard: drop the one-shot shift like iOS does.
  function onInput(e) {
    if (!state.open || e.target !== state.field) return;
    var shift = autoCapitalize(state.field);
    if (shift !== state.shift) { state.shift = shift; paint(); }
  }

  function attach() {
    close();
    var doc = frameDoc();
    state.doc = doc;
    if (!doc) return;
    doc.addEventListener('focusin', onFocusIn, true);
    doc.addEventListener('focusout', onFocusOut, true);
    doc.addEventListener('input', onInput, true);
  }

  function syncButton() {
    var btn = opts.button;
    if (!btn) return;
    btn.classList.toggle('active', enabled);
    btn.disabled = !opts.isActive();
    btn.setAttribute('aria-pressed', String(enabled));
  }

  window.KeyboardSim = {
    // opts: { frame, viewport, button, chromeBottom, isActive: () => bool }
    init: function (o) {
      opts = o;
      var style = document.createElement('style');
      style.id = 'kbsim-style';
      style.textContent = CSS;
      document.head.appendChild(style);
      render();
      opts.viewport.addEventListener('load', attach);
      attach();
      if (opts.button) {
        opts.button.addEventListener('click', function () {
          enabled = !enabled;
          writeEnabled(enabled);
          if (!enabled) close();
          syncButton();
        });
      }
      syncButton();
    },
    // Call when the device or the Normal/Inspect mode changes.
    sync: function () {
      if (!opts) return;
      if (!active()) close();
      syncButton();
    },
    // K shortcut: open the keyboard on the first text field, or close it.
    toggleFirstField: function () {
      if (!opts || !active()) return;
      if (state.open) {
        if (state.field) state.field.blur();
        close();
        return;
      }
      var doc = frameDoc();
      if (!doc) return;
      var first = textFields(doc)[0];
      if (first) focusField(first);
    },
  };
})();
