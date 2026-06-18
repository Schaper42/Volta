(function () {
  'use strict';

  var STRINGS = {
    de: {
      title: 'Frag Clarro',
      placeholder: 'Deine Frage...',
      disclaimer: 'KI-Antworten können Fehler enthalten.',
      greeting: 'Hallo! Ich bin der KI-Assistent von Clarro. Frag mich gern zu Leistungen, Preisen oder lokalem SEO.',
      fallback: 'Der KI-Assistent ist gerade nicht erreichbar. Bitte nutze das Kontaktformular — wir melden uns schnell persönlich zurück.',
      open: 'Chat öffnen',
      close: 'Chat schließen'
    },
    en: {
      title: 'Ask Clarro',
      placeholder: 'Your question...',
      disclaimer: 'AI replies may contain mistakes.',
      greeting: "Hi! I'm Clarro's AI assistant. Ask me about services, pricing, or local SEO.",
      fallback: 'The AI assistant is currently unavailable. Please use the contact form — we\'ll get back to you personally, quickly.',
      open: 'Open chat',
      close: 'Close chat'
    }
  };

  var HISTORY_KEY = 'clarro-chat-history';

  function getLang() {
    return localStorage.getItem('clarro-lang') === 'en' ? 'en' : 'de';
  }

  function getHistory() {
    try {
      return JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {}
  }

  function build() {
    var lang = getLang();
    var t = STRINGS[lang];

    var toggle = document.createElement('button');
    toggle.className = 'ai-chat__toggle';
    toggle.setAttribute('aria-label', t.open);
    toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';

    var panel = document.createElement('div');
    panel.className = 'ai-chat__panel';
    panel.innerHTML =
      '<div class="ai-chat__header">' +
        '<h3>' + t.title + '</h3>' +
        '<button class="ai-chat__close" aria-label="' + t.close + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="ai-chat__messages"></div>' +
      '<p class="ai-chat__disclaimer">' + t.disclaimer + '</p>' +
      '<form class="ai-chat__form">' +
        '<input class="ai-chat__input" type="text" placeholder="' + t.placeholder + '" autocomplete="off" maxlength="500">' +
        '<button type="submit" class="ai-chat__send" aria-label="Send">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z"/></svg>' +
        '</button>' +
      '</form>';

    document.body.appendChild(toggle);
    document.body.appendChild(panel);

    var messagesEl = panel.querySelector('.ai-chat__messages');
    var formEl = panel.querySelector('.ai-chat__form');
    var inputEl = panel.querySelector('.ai-chat__input');
    var closeEl = panel.querySelector('.ai-chat__close');
    var sendEl = panel.querySelector('.ai-chat__send');

    var history = getHistory();
    if (history.length === 0) {
      addMessage(t.greeting, 'bot', false);
    } else {
      history.forEach(function (m) {
        addMessage(m.content, m.role === 'user' ? 'user' : 'bot', false);
      });
    }

    function addMessage(text, kind, persist) {
      var el = document.createElement('div');
      el.className = 'ai-chat__msg ai-chat__msg--' + kind;
      el.textContent = text;
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      if (persist) {
        history.push({ role: kind === 'user' ? 'user' : 'assistant', content: text });
        saveHistory(history);
      }
      return el;
    }

    function setOpen(open) {
      panel.classList.toggle('is-open', open);
      if (open) inputEl.focus();
    }

    toggle.addEventListener('click', function () {
      setOpen(!panel.classList.contains('is-open'));
    });
    closeEl.addEventListener('click', function () { setOpen(false); });

    formEl.addEventListener('submit', async function (e) {
      e.preventDefault();
      var text = inputEl.value.trim();
      if (!text) return;
      inputEl.value = '';
      addMessage(text, 'user', true);
      sendEl.disabled = true;

      var typingEl = document.createElement('div');
      typingEl.className = 'ai-chat__msg ai-chat__msg--bot ai-chat__msg--typing';
      typingEl.innerHTML = '<span></span><span></span><span></span>';
      messagesEl.appendChild(typingEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;

      try {
        var res = await fetch('/.netlify/functions/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, lang: getLang() })
        });
        typingEl.remove();
        if (!res.ok) throw new Error('bad_response');
        var data = await res.json();
        addMessage(data.reply || t.fallback, 'bot', true);
      } catch (err) {
        typingEl.remove();
        addMessage(t.fallback, 'bot', false);
      } finally {
        sendEl.disabled = false;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
