/* ============================================================
   page-overrides.js
   Runs on every public page right after app.js. Fetches three
   per-page JSON files (if present) and patches the live DOM:

     - assets/data/pages/{slug}.overrides.json  -> text + image edits
     - assets/data/pages/{slug}.seo.json        -> head meta / title
     - assets/data/pages.json                   -> hidden -> noindex

   Override keys can be either:
     * "<data-editable attribute value>"   - tag-based, original style
     * "auto:t<index>"  / "auto:s<index>"  - auto-walk index used by
                                             the admin page-editor

   Override entry shapes:
     { type: "text",         value: "..." }
     { type: "image",        src: "...", alt: "..." }
     { type: "section-hide", hidden: true }
     { type: "section-html", html: "<section>...</section>" }
   ============================================================ */
(() => {
  'use strict';

  function pageSlug() {
    let p = location.pathname;
    if (p === '' || p === '/' || p === '/index.html') return 'index';
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    p = p.replace(/^\//, '').replace(/\.html$/, '');
    return p || 'index';
  }

  // Auto-walk every text-bearing leaf + every section. The page-editor
  // performs the SAME walk and assigns the same indexes, so an
  // "auto:t12" key in the overrides JSON refers to the 13th text leaf
  // in this DOM. Stable as long as the static markup doesn't change
  // shape — content edits don't shift the index.
  function autoWalk(doc) {
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'IFRAME']);
    const TEXT_TAGS = new Set([
      'H1','H2','H3','H4','H5','H6','P','LI','TD','TH','BLOCKQUOTE',
      'BUTTON','A','SUMMARY','FIGCAPTION','LABEL','DD','DT',
      'STRONG','EM','SPAN'
    ]);
    const SECTION_TAGS = new Set(['SECTION', 'ASIDE', 'HEADER', 'FOOTER', 'ARTICLE', 'MAIN']);

    const texts = [];
    const sections = [];
    function walk(el) {
      if (!el || SKIP_TAGS.has(el.tagName)) return;
      if (el.tagName && SECTION_TAGS.has(el.tagName) && el !== doc.body) {
        sections.push(el);
      }
      const isTextLeaf =
        TEXT_TAGS.has(el.tagName) &&
        el.children.length === 0 &&
        el.textContent && el.textContent.trim().length > 0;
      if (isTextLeaf) texts.push(el);
      for (const c of el.children) walk(c);
    }
    walk(doc.body);
    return { texts, sections };
  }

  function applyOverride(node, override) {
    if (!node || !override) return;
    switch (override.type) {
      case 'text':
        if ('value' in override) node.textContent = override.value;
        // classList override carries the full className string. Apply
        // wholesale so admin choices (bold, color, size, etc.) replace
        // the original.
        if (typeof override.classList === 'string' && override.classList) {
          node.className = override.classList;
        }
        break;
      case 'image':
        if (override.src) node.setAttribute('src', override.src);
        if (override.alt != null) node.setAttribute('alt', override.alt);
        break;
      case 'section-hide':
        if (override.hidden) {
          node.style.display = 'none';
          node.setAttribute('aria-hidden', 'true');
        }
        break;
      case 'section-html':
        if (override.html) node.outerHTML = override.html;
        break;
    }
  }

  function cssEscape(s) {
    return String(s).replace(/(["\\])/g, '\\$1');
  }

  function applyOverrides(overrides) {
    if (!overrides) return;
    const { texts, sections } = autoWalk(document);
    // Pass 1: data-editable keys.
    Object.keys(overrides).forEach((key) => {
      if (key.startsWith('auto:')) return;
      const node = document.querySelector('[data-editable="' + cssEscape(key) + '"]');
      if (node) applyOverride(node, overrides[key]);
    });
    // Pass 2: auto-walk keys.
    Object.keys(overrides).forEach((key) => {
      if (!key.startsWith('auto:')) return;
      const tag = key.slice(5, 6);
      const idx = parseInt(key.slice(6), 10);
      const node = tag === 't' ? texts[idx]
                  : tag === 's' ? sections[idx]
                  : null;
      if (node) applyOverride(node, overrides[key]);
    });
  }

  function applySeo(seo) {
    if (!seo) return;
    if (seo.title) document.title = seo.title;
    setMeta('description', seo.description);
    setMeta('keywords', seo.keywords);
    setOg('og:title', seo.ogTitle || seo.title);
    setOg('og:description', seo.ogDescription || seo.description);
    setOg('og:image', seo.ogImage);
    setMeta('twitter:title', seo.twitterTitle || seo.title);
    setMeta('twitter:description', seo.twitterDescription || seo.description);
    setMeta('twitter:image', seo.twitterImage || seo.ogImage);
    setCanonical(seo.canonical);
  }
  function setMeta(name, value) {
    if (!value) return;
    let el = document.querySelector('meta[name="' + name + '"]');
    if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
    el.setAttribute('content', value);
  }
  function setOg(property, value) {
    if (!value) return;
    let el = document.querySelector('meta[property="' + property + '"]');
    if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
    el.setAttribute('content', value);
  }
  function setCanonical(href) {
    if (!href) return;
    let el = document.querySelector('link[rel="canonical"]');
    if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el); }
    el.setAttribute('href', href);
  }

  function applyRegistry(pages) {
    if (!Array.isArray(pages)) return;
    const slug = pageSlug();
    const entry = pages.find((p) => p && (p.slug || '').toLowerCase() === slug.toLowerCase());
    if (entry && entry.hidden) {
      const m = document.createElement('meta');
      m.name = 'robots';
      m.content = 'noindex,nofollow';
      document.head.appendChild(m);
    }
  }

  function jsonOrNull(url) {
    return fetch(url, { credentials: 'same-origin' })
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const slug = pageSlug();
    Promise.all([
      jsonOrNull('/assets/data/pages/' + slug + '.overrides.json'),
      jsonOrNull('/assets/data/pages/' + slug + '.seo.json'),
      jsonOrNull('/assets/data/pages.json'),
    ]).then(([over, seo, pages]) => {
      const overrides = over && (over.overrides || over) ? (over.overrides || over) : null;
      applyOverrides(overrides);
      applySeo(seo);
      applyRegistry(pages && pages.pages ? pages.pages : pages);
    });
  });
})();
