/* ============================================================
   CLARRO — website-check.js
   Drives the AI website-check tool. Only runs if the form
   markup is present on the page.
   ============================================================ */

(function () {
  'use strict';

  var form = document.getElementById('checkForm');
  if (!form) return;

  var STRINGS = {
    de: {
      checking: 'Wir analysieren deine Website...',
      error: 'Diese Website konnte nicht geprüft werden. Bitte prüfe die URL und versuche es erneut.',
      missingTitle: 'Kein Seitentitel gefunden',
      missingDesc: 'Keine Meta-Beschreibung gefunden',
      viewportOk: 'Für Mobilgeräte optimiert (Viewport-Tag vorhanden)',
      viewportWarn: 'Kein Viewport-Tag — Seite ist evtl. nicht mobiloptimiert',
      h1Ok: function (n) { return n + ' H1-Überschrift gefunden'; },
      h1Warn: 'Keine oder mehrere H1-Überschriften gefunden',
      altOk: function (a, b) { return a + ' von ' + b + ' Bildern haben Alt-Text'; },
      telOk: 'Telefonlink (tel:) vorhanden',
      telWarn: 'Kein klickbarer Telefonlink gefunden',
      loadOk: function (ms) { return 'Ladezeit: ' + ms + ' ms'; },
      titleOk: function (t) { return 'Seitentitel: „' + t + '“'; },
      descOk: function (d) { return 'Meta-Beschreibung: „' + d + '“'; }
    },
    en: {
      checking: 'Analyzing your website...',
      error: 'This website could not be checked. Please verify the URL and try again.',
      missingTitle: 'No page title found',
      missingDesc: 'No meta description found',
      viewportOk: 'Optimized for mobile (viewport tag present)',
      viewportWarn: 'No viewport tag — page may not be mobile-friendly',
      h1Ok: function (n) { return n + ' H1 heading found'; },
      h1Warn: 'No or multiple H1 headings found',
      altOk: function (a, b) { return a + ' of ' + b + ' images have alt text'; },
      telOk: 'Phone link (tel:) present',
      telWarn: 'No clickable phone link found',
      loadOk: function (ms) { return 'Load time: ' + ms + ' ms'; },
      titleOk: function (t) { return 'Page title: "' + t + '"'; },
      descOk: function (d) { return 'Meta description: "' + d + '"'; }
    }
  };

  function getLang() {
    return localStorage.getItem('clarro-lang') === 'en' ? 'en' : 'de';
  }

  var input = document.getElementById('checkUrl');
  var statusEl = document.getElementById('checkStatus');
  var resultsEl = document.getElementById('checkResults');
  var summaryEl = document.getElementById('checkSummary');
  var signalsEl = document.getElementById('checkSignals');
  var submitBtn = form.querySelector('button[type="submit"]');

  var checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
  var warnIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

  function signalRow(ok, label, detail) {
    var div = document.createElement('div');
    div.className = 'check-signal ' + (ok ? 'check-signal--ok' : 'check-signal--warn');
    div.innerHTML = (ok ? checkIcon : warnIcon) +
      '<div><span class="check-signal-label">' + label + '</span>' +
      (detail ? '<span class="check-signal-detail">' + detail + '</span>' : '') +
      '</div>';
    return div;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderSignals(signals, t) {
    signalsEl.innerHTML = '';
    signalsEl.appendChild(signalRow(!!signals.title, signals.title ? t.titleOk(escapeHtml(signals.title)) : t.missingTitle));
    signalsEl.appendChild(signalRow(!!signals.description, signals.description ? t.descOk(escapeHtml(signals.description)) : t.missingDesc));
    signalsEl.appendChild(signalRow(signals.hasViewport, signals.hasViewport ? t.viewportOk : t.viewportWarn));
    signalsEl.appendChild(signalRow(signals.h1Count === 1, t.h1Ok(signals.h1Count) ));
    if (signals.imgCount > 0) {
      signalsEl.appendChild(signalRow(signals.imgWithAltCount === signals.imgCount, t.altOk(signals.imgWithAltCount, signals.imgCount)));
    }
    signalsEl.appendChild(signalRow(signals.hasTel, signals.hasTel ? t.telOk : t.telWarn));
    signalsEl.appendChild(signalRow(signals.loadTimeMs < 1500, t.loadOk(signals.loadTimeMs)));
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var url = input.value.trim();
    if (!url) return;

    var t = STRINGS[getLang()];
    statusEl.textContent = t.checking;
    statusEl.style.display = 'block';
    resultsEl.classList.remove('is-visible');
    submitBtn.disabled = true;

    try {
      var res = await fetch('/.netlify/functions/website-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url, lang: getLang() })
      });
      if (!res.ok) throw new Error('bad_response');
      var data = await res.json();
      if (data.error || !data.signals) throw new Error(data.error || 'no_signals');

      statusEl.style.display = 'none';
      summaryEl.textContent = data.summary || '';
      summaryEl.style.display = data.summary ? 'block' : 'none';
      renderSignals(data.signals, t);
      resultsEl.classList.add('is-visible');
    } catch (err) {
      statusEl.textContent = t.error;
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
