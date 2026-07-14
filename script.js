(function () {
  'use strict';

  var TABS = ['home', 'blog', 'code', 'help', 'user'];
  var radios = TABS.map(function (id) { return document.getElementById(id); });
  var panels = {};
  TABS.forEach(function (id) {
    panels[id] = document.getElementById('panel-' + id);
  });

  var STORAGE_KEY = 'nav-active-tab';
  var STYLE_KEY = 'nav-style-underline';
  var LAYOUT_KEY = 'nav-layout-sidebar';

  // ---------- routing: radio <-> hash <-> panel ----------

  function activateTab(id, opts) {
    opts = opts || {};
    if (TABS.indexOf(id) === -1) return;

    var radio = document.getElementById(id);
    if (radio && !radio.checked) radio.checked = true;

    TABS.forEach(function (tabId) {
      panels[tabId].classList.toggle('is-active', tabId === id);
    });

    if (!opts.skipHash) {
      history.replaceState(null, '', '#' + id);
    }
    if (!opts.skipStorage) {
      try { localStorage.setItem(STORAGE_KEY, id); } catch (e) { /* ignore */ }
    }
    if (id === 'help') clearHelpBadge();
  }

  function clearHelpBadge() {
    var badges = document.querySelectorAll('label.help .badge');
    badges.forEach(function (badge) {
      badge.classList.add('is-cleared');
    });
  }

  radios.forEach(function (radio) {
    if (!radio) return;
    radio.addEventListener('change', function () {
      activateTab(radio.id);
    });
  });

  window.addEventListener('hashchange', function () {
    var id = location.hash.replace('#', '');
    if (TABS.indexOf(id) !== -1) activateTab(id, { skipHash: true });
  });

  // initial tab priority: URL hash > localStorage > default checked radio
  (function initTab() {
    var hashId = location.hash.replace('#', '');
    if (TABS.indexOf(hashId) !== -1) {
      activateTab(hashId, { skipHash: true });
      return;
    }
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    if (stored && TABS.indexOf(stored) !== -1) {
      activateTab(stored);
      return;
    }
    activateTab('home', { skipHash: true, skipStorage: true });
  })();

  // ---------- swipe support (mobile) ----------

  var panelsContainer = document.querySelector('.panels');
  var touchStartX = null;
  var touchStartY = null;
  var SWIPE_THRESHOLD = 50;

  panelsContainer.addEventListener('touchstart', function (e) {
    var t = e.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  panelsContainer.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStartX;
    var dy = t.clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;

    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

    var currentId = TABS.find(function (id) { return panels[id].classList.contains('is-active'); });
    var idx = TABS.indexOf(currentId);
    if (dx < 0 && idx < TABS.length - 1) {
      activateTab(TABS[idx + 1]); // swipe left -> next tab
    } else if (dx > 0 && idx > 0) {
      activateTab(TABS[idx - 1]); // swipe right -> previous tab
    }
  }, { passive: true });

  // ---------- settings toggles ----------

  function applyPersistedToggle(key, className, buttonId) {
    var btn = document.getElementById(buttonId);
    var stored = null;
    try { stored = localStorage.getItem(key); } catch (e) { /* ignore */ }
    var active = stored === '1';
    document.body.classList.toggle(className, active);
    if (btn) btn.setAttribute('aria-pressed', String(active));
    return btn;
  }

  function wireToggle(key, className, buttonId) {
    var btn = applyPersistedToggle(key, className, buttonId);
    if (!btn) return;
    btn.addEventListener('click', function () {
      var active = document.body.classList.toggle(className);
      btn.setAttribute('aria-pressed', String(active));
      try { localStorage.setItem(key, active ? '1' : '0'); } catch (e) { /* ignore */ }
    });
  }

  wireToggle(STYLE_KEY, 'style-underline', 'styleToggle');
  wireToggle(LAYOUT_KEY, 'layout-sidebar', 'layoutToggle');

  // icon-only breakpoint: enable tooltips when space is tight
  function updateCompactState() {
    document.body.classList.toggle('compact-icons', window.innerWidth <= 450);
  }
  updateCompactState();
  window.addEventListener('resize', updateCompactState);

})();
