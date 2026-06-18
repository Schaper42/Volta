'use strict';

/* ============================================================
   CLARRO — chat.js (Netlify Function)
   Proxies chat messages to the Anthropic API so the API key
   never reaches the browser. Requires ANTHROPIC_API_KEY to be
   set as an environment variable in the Netlify site settings.
   ============================================================ */

var SYSTEM_PROMPT = [
  'Du bist der KI-Assistent von Clarro, einer Webdesign-Agentur aus Köln, die Websites für kleine und mittelständische Unternehmen in der gesamten DACH-Region (Deutschland, Österreich, Schweiz) baut.',
  '',
  'Über Clarro:',
  '- Leistungen: individuelle Website-Erstellung, lokales SEO, laufende Wartung & Hosting, Anbindung an Social Media.',
  '- Kostenloser ROI-Rechner unter /roi-rechner.html zeigt, ob sich eine neue Website lohnt.',
  '- Genaue Preise stehen unter /preise.html — erfinde hier keine eigenen Zahlen.',
  '- Interessenten können ein kostenloses, unverbindliches Erstgespräch über /kontakt.html buchen.',
  '- Gegründet von Tobias Schaper.',
  '',
  'Deine Aufgabe:',
  '- Beantworte Fragen zu Leistungen, Ablauf und lokalem SEO präzise, freundlich und kurz (2-4 Sätze).',
  '- Wenn jemand konkretes Interesse zeigt, schlage proaktiv den ROI-Rechner oder ein kostenloses Gespräch vor.',
  '- Antworte in der Sprache der Anfrage (Deutsch oder Englisch).',
  '- Wenn du etwas nicht sicher weißt (z. B. exakte Preise oder Verfügbarkeit), sag das ehrlich und verweise auf das kostenlose Gespräch.',
  '- Erfinde keine Fakten, Studien oder Zahlen.'
].join('\n');

var MAX_HISTORY = 12;
var MODEL = 'claude-haiku-4-5-20251001';

function mergeConsecutive(messages) {
  var merged = [];
  messages.forEach(function (m) {
    var last = merged[merged.length - 1];
    if (last && last.role === m.role) {
      last.content += '\n' + m.content;
    } else {
      merged.push({ role: m.role, content: m.content });
    }
  });
  if (merged.length && merged[0].role !== 'user') {
    merged.shift();
  }
  return merged;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  var payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'invalid_json' }) };
  }

  var rawMessages = Array.isArray(payload.messages) ? payload.messages : [];
  var cleaned = rawMessages
    .slice(-MAX_HISTORY)
    .filter(function (m) {
      return m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0;
    })
    .map(function (m) {
      return { role: m.role, content: m.content.slice(0, 2000) };
    });

  var messages = mergeConsecutive(cleaned);
  if (messages.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'no_valid_messages' }) };
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reply: 'Der KI-Assistent ist aktuell nicht konfiguriert. Bitte nutze das Kontaktformular — wir melden uns schnell persönlich zurück.'
      })
    };
  }

  try {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    });

    if (!res.ok) {
      var errText = await res.text();
      console.error('Anthropic API error', res.status, errText);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: 'Entschuldigung, der Assistent hat gerade ein technisches Problem. Bitte versuche es in einem Moment erneut oder schreib uns direkt über das Kontaktformular.'
        })
      };
    }

    var data = await res.json();
    var reply = (data.content && data.content[0] && data.content[0].text) || 'Entschuldigung, ich konnte keine Antwort generieren.';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: reply })
    };
  } catch (err) {
    console.error('chat function error', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'internal_error' })
    };
  }
};
