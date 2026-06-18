'use strict';

/* ============================================================
   CLARRO — website-check.js (Netlify Function)
   Fetches a visitor-supplied URL server-side, extracts basic
   technical/SEO signals, and asks Claude for a short human
   summary. Requires ANTHROPIC_API_KEY in Netlify env vars.
   ============================================================ */

var dns = require('dns');
var MODEL = 'claude-haiku-4-5-20251001';
var FETCH_TIMEOUT_MS = 8000;
var MAX_BYTES = 2 * 1024 * 1024;

function isPrivateIP(ip) {
  if (ip.indexOf(':') !== -1) {
    var lower = ip.toLowerCase();
    if (lower === '::1') return true;
    if (lower.indexOf('fe80:') === 0) return true;
    if (lower.indexOf('fc') === 0 || lower.indexOf('fd') === 0) return true;
    return false;
  }
  var parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(function (n) { return isNaN(n); })) return true;
  var a = parts[0], b = parts[1];
  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

async function assertSafeUrl(rawUrl) {
  var url;
  try {
    url = new URL(rawUrl);
  } catch (e) {
    throw new Error('invalid_url');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('invalid_protocol');
  }
  var hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    throw new Error('blocked_host');
  }
  var addresses;
  try {
    addresses = await dns.promises.lookup(hostname, { all: true });
  } catch (e) {
    throw new Error('dns_failed');
  }
  if (!addresses.length || addresses.some(function (a) { return isPrivateIP(a.address); })) {
    throw new Error('blocked_host');
  }
  return url;
}

function extractSignals(html, loadTimeMs, byteSize) {
  var titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  var descMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i);
  var viewportMatch = html.match(/<meta[^>]+name=["']viewport["']/i);
  var langMatch = html.match(/<html[^>]+lang=["']([a-zA-Z-]+)["']/i);
  var h1Matches = html.match(/<h1[\s>]/gi) || [];
  var imgMatches = html.match(/<img\b[^>]*>/gi) || [];
  var imgsWithAlt = imgMatches.filter(function (tag) {
    return /alt=["'][^"']+["']/i.test(tag);
  });
  var hasTel = /href=["']tel:/i.test(html);
  var hasMailto = /href=["']mailto:/i.test(html);
  var hasViewport = !!viewportMatch;

  return {
    title: titleMatch ? titleMatch[1].trim().slice(0, 200) : null,
    description: descMatch ? descMatch[1].trim().slice(0, 300) : null,
    hasViewport: hasViewport,
    lang: langMatch ? langMatch[1] : null,
    h1Count: h1Matches.length,
    imgCount: imgMatches.length,
    imgWithAltCount: imgsWithAlt.length,
    hasTel: hasTel,
    hasMailto: hasMailto,
    loadTimeMs: loadTimeMs,
    byteSize: byteSize
  };
}

async function fetchPage(url) {
  var controller = new AbortController();
  var timeout = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS);
  var start = Date.now();
  try {
    var res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'ClarroWebsiteCheckBot/1.0 (+https://clarro.de)' }
    });
    if (!res.ok) {
      throw new Error('fetch_failed');
    }
    var reader = res.body ? res.body.getReader() : null;
    var chunks = [];
    var received = 0;
    if (reader) {
      while (true) {
        var step = await reader.read();
        if (step.done) break;
        received += step.value.length;
        if (received > MAX_BYTES) {
          controller.abort();
          break;
        }
        chunks.push(step.value);
      }
      var buffer = Buffer.concat(chunks.map(function (c) { return Buffer.from(c); }));
      var html = buffer.toString('utf-8');
    } else {
      html = await res.text();
      received = Buffer.byteLength(html, 'utf-8');
    }
    var loadTimeMs = Date.now() - start;
    return { html: html, loadTimeMs: loadTimeMs, byteSize: received };
  } finally {
    clearTimeout(timeout);
  }
}

function buildPrompt(signals, lang) {
  var langName = lang === 'en' ? 'English' : 'German';
  var lines = [
    'Title: ' + (signals.title || '(missing)'),
    'Meta description: ' + (signals.description || '(missing)'),
    'Mobile viewport tag present: ' + (signals.hasViewport ? 'yes' : 'no'),
    'HTML lang attribute: ' + (signals.lang || '(missing)'),
    'Number of H1 headings: ' + signals.h1Count,
    'Images: ' + signals.imgCount + ' total, ' + signals.imgWithAltCount + ' with alt text',
    'Phone link (tel:) present: ' + (signals.hasTel ? 'yes' : 'no'),
    'Email link (mailto:) present: ' + (signals.hasMailto ? 'yes' : 'no'),
    'Load time: ' + signals.loadTimeMs + ' ms',
    'Page size: ' + Math.round(signals.byteSize / 1024) + ' KB'
  ];
  return [
    'You are a website auditor for Clarro, a German web design agency. Below are technical signals scraped from a visitor\'s website.',
    'Write a short, friendly, honest summary (3-5 sentences) in ' + langName + ' covering: overall impression, the biggest weakness, and one concrete next step. Do not invent facts beyond the data given. Do not mention exact prices.',
    '',
    lines.join('\n')
  ].join('\n');
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

  var rawUrl = typeof payload.url === 'string' ? payload.url.trim() : '';
  var lang = payload.lang === 'en' ? 'en' : 'de';
  if (!rawUrl) {
    return { statusCode: 400, body: JSON.stringify({ error: 'missing_url' }) };
  }
  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = 'https://' + rawUrl;
  }

  var url;
  try {
    url = await assertSafeUrl(rawUrl);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'unsafe_or_invalid_url' }) };
  }

  var page;
  try {
    page = await fetchPage(url);
  } catch (e) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'fetch_failed' }) };
  }

  var signals = extractSignals(page.html, page.loadTimeMs, page.byteSize);

  var apiKey = process.env.ANTHROPIC_API_KEY;
  var summary = null;

  if (apiKey) {
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
          max_tokens: 300,
          messages: [{ role: 'user', content: buildPrompt(signals, lang) }]
        })
      });
      if (res.ok) {
        var data = await res.json();
        summary = (data.content && data.content[0] && data.content[0].text) || null;
      } else {
        console.error('Anthropic API error', res.status, await res.text());
      }
    } catch (err) {
      console.error('website-check AI error', err);
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signals: signals, summary: summary })
  };
};
