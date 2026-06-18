/* ============================================================
   CLARRO — i18n.js
   Lightweight DE/EN language switch, no build step required.
   Translatable elements carry data-de="..." / data-en="..." with
   the exact markup to swap in. Persisted in localStorage so the
   choice survives page navigation across the site.
   ============================================================ */

(function () {
  'use strict';

  var STORAGE_KEY = 'clarro-lang';

  function detectLang() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'de' || saved === 'en') return saved;
    var nav = (navigator.language || navigator.userLanguage || 'de').toLowerCase();
    return nav.indexOf('en') === 0 ? 'en' : 'de';
  }

  function applyLang(lang) {
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-de]').forEach(function (el) {
      var text = el.getAttribute('data-' + lang);
      if (text !== null) el.innerHTML = text;
    });

    document.querySelectorAll('[data-de-placeholder]').forEach(function (el) {
      var text = el.getAttribute('data-' + lang + '-placeholder');
      if (text !== null) el.setAttribute('placeholder', text);
    });

    document.querySelectorAll('[data-de-alt]').forEach(function (el) {
      var text = el.getAttribute('data-' + lang + '-alt');
      if (text !== null) el.setAttribute('alt', text);
    });

    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      var isActive = btn.getAttribute('data-lang-btn') === lang;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    var titleEl = document.querySelector('title[data-de]');
    if (titleEl) document.title = titleEl.getAttribute('data-' + lang) || document.title;

    var metaDesc = document.querySelector('meta[name="description"][data-de]');
    if (metaDesc) metaDesc.setAttribute('content', metaDesc.getAttribute('data-' + lang) || '');

    localStorage.setItem(STORAGE_KEY, lang);
  }

  function init() {
    applyLang(detectLang());
    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyLang(btn.getAttribute('data-lang-btn'));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
