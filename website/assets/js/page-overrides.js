/* ============================================================
   On Target ABA — per-page content overrides
   On DOMContentLoaded:
     - derive slug from location.pathname ("/" -> "index")
     - fetch /assets/data/pages/{slug}.overrides.json (404 OK, silent)
     - for each key in `overrides`, find [data-editable="{key}"] and
       apply: text -> textContent, image -> src + alt
     - fetch /assets/data/pages.json; if this page is hidden, inject
       <meta name="robots" content="noindex,nofollow"> into <head>
   ============================================================ */
(() => {
  'use strict';

  function pageSlug() {
    let p = location.pathname || '/';
    if (p === '' || p === '/' || p === '/index.html') return 'index';
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    if (p.endsWith('/index.html')) p = p.slice(0, -11);
    if (p.endsWith('.html')) p = p.slice(0, -5);
    if (p.startsWith('/')) p = p.slice(1);
    return p || 'index';
  }

  function applyOverrides(payload) {
    if (!payload || !payload.overrides || typeof payload.overrides !== 'object') return;
    Object.keys(payload.overrides).forEach((key) => {
      const entry = payload.overrides[key];
      if (!entry || typeof entry !== 'object') return;
      const el = document.querySelector('[data-editable="' + CSS.escape(key) + '"]');
      if (!el) return;
      if (entry.type === 'text' && typeof entry.value === 'string') {
        el.textContent = entry.value;
      } else if (entry.type === 'image') {
        const img = el.tagName === 'IMG' ? el : el.querySelector('img');
        if (!img) return;
        if (typeof entry.src === 'string') img.src = entry.src;
        if (typeof entry.alt === 'string') img.alt = entry.alt;
      }
    });
  }

  function injectNoindex() {
    if (document.querySelector('meta[name="robots"]')) return;
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'robots');
    meta.setAttribute('content', 'noindex,nofollow');
    (document.head || document.documentElement).appendChild(meta);
  }

  function run() {
    const slug = pageSlug();

    // Overrides — 404 is fine.
    fetch('/assets/data/pages/' + encodeURIComponent(slug) + '.overrides.json', {
      credentials: 'same-origin',
      cache: 'no-cache',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) applyOverrides(data); })
      .catch(() => { /* silent */ });

    // Pages registry — used to set noindex on hidden pages.
    fetch('/assets/data/pages.json', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data.pages)) return;
        const entry = data.pages.find((p) => p.slug === slug);
        if (entry && entry.hidden) injectNoindex();
      })
      .catch(() => { /* silent */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
