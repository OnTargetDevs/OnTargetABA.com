/* ============================================================
   On Target ABA — shared site header (data-driven)
   Fetches /assets/data/header.json and renders into
   <div id="site-header">:
     - announcement bar
     - sticky nav (with active-page highlight)
     - mobile slide-down panel
     - per-page breadcrumb
   Falls back silently (no markup, console.warn) if the fetch fails.
   Note: per-page SEO metadata is not managed by this admin; static
   pages own their <title>/<meta> tags directly in HTML.
   ============================================================ */
(() => {
  'use strict';

  const slot = document.getElementById('site-header');
  if (!slot) return;

  // Normalize current URL into a comparison slug.
  //   /                            -> "/"
  //   /index.html                  -> "/"
  //   /about.html or /about        -> "/about"
  //   /blog/posts/some-slug        -> "/blog/posts/some-slug"
  function pageSlug() {
    let p = location.pathname;
    if (p === '' || p === '/' || p === '/index.html') return '/';
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    if (p.endsWith('/index.html')) p = p.slice(0, -11);
    if (p.endsWith('.html')) p = p.slice(0, -5);
    return p;
  }

  // Strip ".html" + leading slash from an href so it matches page paths.
  //   /about.html  -> /about
  //   /            -> /
  function hrefToPath(href) {
    if (!href) return '';
    let p = href;
    if (p.endsWith('/index.html')) p = p.slice(0, -11);
    else if (p.endsWith('.html')) p = p.slice(0, -5);
    if (p === '') p = '/';
    return p;
  }

  const SEP = '<svg class="w-3 h-3 text-mute shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 5l7 7-7 7"/></svg>';

  const phoneSvg =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/>' +
    '</svg>';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getCrumbs(headerData) {
    const slug = pageSlug();
    const map = (headerData && headerData.breadcrumbs) || {};
    if (slug.indexOf('/blog/posts/') === 0) return map['/blog/post'] || null;
    if (slug in map) return map[slug];
    return null;
  }

  function getActiveSection(headerData) {
    const slug = pageSlug();
    const map = (headerData && headerData.activeSectionMap) || {};
    if (slug.indexOf('/blog/') === 0) return 'Blog';
    return map[slug] || '';
  }

  function renderCrumbs(headerData) {
    const crumbs = getCrumbs(headerData);
    if (!crumbs || crumbs.length < 2) return '';
    const parts = crumbs.map((entry, i) => {
      const label = entry[0];
      const href = entry[1];
      const isLast = i === crumbs.length - 1;
      if (isLast || !href) {
        return '<span class="text-ink font-semibold" aria-current="page">' + esc(label) + '</span>';
      }
      return '<a href="' + esc(href) + '" class="hover:text-coral transition">' + esc(label) + '</a>';
    });
    return (
      '<nav aria-label="Breadcrumb" class="bg-cream/60 border-b border-line">' +
        '<div class="max-w-7xl mx-auto px-5 py-3 text-sm text-mute flex items-center gap-2 flex-wrap">' +
          parts.join(SEP) +
        '</div>' +
      '</nav>'
    );
  }

  function navLinkHtml(link, activeSection, opts) {
    const isActive = link.section === activeSection || link.label === activeSection;
    const baseCls = opts && opts.mobile
      ? 'py-2.5 border-b border-line'
      : 'link-uline hover:text-coral';
    const activeCls = isActive
      ? (opts && opts.mobile ? ' text-coral font-bold' : ' text-coral font-semibold')
      : '';
    const ariaCurrent = isActive ? ' aria-current="page"' : '';
    return (
      '<a data-nav-link href="' + esc(link.href) + '"' + ariaCurrent +
      ' class="' + baseCls + activeCls + '">' + esc(link.label) + '</a>'
    );
  }

  function renderAnnouncement(announcement) {
    if (!announcement || !announcement.text) return '';
    let link = '';
    if (announcement.linkHref && announcement.linkLabel) {
      link = ' <a href="' + esc(announcement.linkHref) + '" class="underline underline-offset-2 hover:text-sun">' + esc(announcement.linkLabel) + '</a>';
    }
    return (
      '<div class="bg-ink text-white text-sm">' +
        '<div class="max-w-7xl mx-auto px-5 py-2.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">' +
          '<span class="inline-flex items-center gap-2">' +
            '<span class="relative flex h-2 w-2">' +
              '<span class="absolute inline-flex h-full w-full rounded-full bg-coral opacity-75 animate-ping"></span>' +
              '<span class="relative inline-flex rounded-full h-2 w-2 bg-coral"></span>' +
            '</span>' +
            '<span class="font-semibold tracking-wide">' + esc(announcement.text) + '</span>' +
            link +
          '</span>' +
        '</div>' +
      '</div>'
    );
  }

  function renderHeader(headerData, navLinks) {
    const activeSection = getActiveSection(headerData);
    const logo = headerData.logo || {};
    const cta = headerData.cta || {};
    const phone = cta.phone || {};
    const primary = cta.primary || {};
    return (
      '<header class="nav-bar sticky top-0 z-40 border-b border-transparent transition">' +
        '<div class="max-w-7xl mx-auto px-5 py-3.5 flex items-center justify-between gap-6">' +
          '<a href="' + esc(logo.href || '/') + '" class="flex items-center group" aria-label="' + esc(logo.alt || 'On Target ABA') + ' &mdash; home">' +
            '<img src="' + esc(logo.src) + '" alt="' + esc(logo.alt) + '" class="h-10 w-auto transition-transform group-hover:scale-[1.02]" />' +
          '</a>' +
          '<nav class="hidden lg:flex items-center gap-7 text-[15px] text-ink/85" aria-label="Primary">' +
            navLinks.map((l) => navLinkHtml(l, activeSection)).join('') +
          '</nav>' +
          '<div class="hidden lg:flex items-center gap-2">' +
            '<a href="' + esc(phone.href) + '" class="btn btn-ghost text-sm">' + phoneSvg + ' ' + esc(phone.label) + '</a>' +
            '<a href="' + esc(primary.href) + '" class="btn btn-coral text-sm">' + esc(primary.label) + '</a>' +
          '</div>' +
          '<button class="lg:hidden inline-grid place-items-center w-11 h-11 rounded-full bg-white shadow ring-1 ring-line" data-mnav-toggle aria-expanded="false" aria-label="Menu" style="margin-right: env(safe-area-inset-right, 0px);">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#163243" stroke-width="2.2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="mnav lg:hidden absolute top-full left-0 right-0 bg-white border-y border-line shadow-lg" data-mnav-panel>' +
          '<div class="px-5 py-5 grid gap-1 text-[15px]">' +
            navLinks.map((l) => navLinkHtml(l, activeSection, { mobile: true })).join('') +
            '<div class="grid grid-cols-2 gap-2 mt-3">' +
              '<a href="' + esc(phone.href) + '" class="btn btn-ghost justify-center text-sm">Call</a>' +
              '<a href="' + esc(primary.href) + '" class="btn btn-coral justify-center text-sm">' + esc(primary.label) + '</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</header>'
    );
  }

  // Sticky mobile CTA — call + Get Started anchored to the bottom on
  // phones. Hidden on lg+ where the desktop header CTAs are visible.
  function renderMobileCta(data) {
    const phone   = (data.cta && data.cta.phone)   || { href: 'tel:8889895011', label: 'Call' };
    const primary = (data.cta && data.cta.primary) || { href: '/contact.html',  label: 'Get Started' };
    return (
      '<div class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-line shadow-[0_-4px_18px_rgba(22,50,67,.08)]" data-mobile-cta' +
        ' style="padding-bottom: max(env(safe-area-inset-bottom), .625rem); padding-right: env(safe-area-inset-right); padding-left: env(safe-area-inset-left);">' +
        '<div class="grid grid-cols-2 gap-2 px-3 py-2.5 max-w-[640px] mx-auto">' +
          '<a href="' + esc(phone.href) + '" class="btn btn-ghost justify-center text-sm py-2.5" aria-label="Call ' + esc(phone.label) + '">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>' +
            ' Call' +
          '</a>' +
          '<a href="' + esc(primary.href) + '" class="btn btn-coral justify-center text-sm py-2.5">' + esc(primary.label) + '</a>' +
        '</div>' +
      '</div>'
    );
  }

  // Prefer header data inlined at build time by scripts/optimize-pages.py
  // (no network round-trip). Fall back to fetch if the inline block was
  // stripped (older deploys, dev preview, etc).
  function loadHeaderData() {
    const inline = document.getElementById('ota-header-data');
    if (inline && inline.textContent.trim()) {
      try { return Promise.resolve(JSON.parse(inline.textContent)); }
      catch (e) { /* fall through to fetch */ }
    }
    return fetch('/assets/data/header.json', { credentials: 'same-origin' })
      .then((r) => {
        if (!r.ok) throw new Error('header.json ' + r.status);
        return r.json();
      });
  }

  // Keyboard focus management for the mobile nav panel.
  // The open/close click handler lives in app.js (it toggles .open on the
  // panel). We observe that class change here and:
  //   - on open: move focus to the first focusable item in the panel
  //   - on close: return focus to the toggle button
  //   - while open: trap Tab/Shift+Tab inside the panel and close on Escape
  function wireMobileNavFocus() {
    const toggle = document.querySelector('[data-mnav-toggle]');
    const panel  = document.querySelector('[data-mnav-panel]');
    if (!toggle || !panel) return;

    const focusableSel =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled])';
    const getFocusable = () => Array.prototype.slice
      .call(panel.querySelectorAll(focusableSel))
      .filter((el) => el.offsetParent !== null || el === document.activeElement);

    function closePanel() {
      if (!panel.classList.contains('open')) return;
      panel.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    document.addEventListener('keydown', (e) => {
      if (!panel.classList.contains('open')) return;
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        closePanel();
        try { toggle.focus(); } catch (_) {}
        return;
      }
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last  = items[items.length - 1];
      const active = document.activeElement;
      // If focus has escaped the panel entirely, pull it back in.
      if (!panel.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    });

    let wasOpen = panel.classList.contains('open');
    const obs = new MutationObserver(() => {
      const isOpen = panel.classList.contains('open');
      if (isOpen === wasOpen) return;
      wasOpen = isOpen;
      if (isOpen) {
        // Defer one frame so the panel is laid out / visible before focusing.
        requestAnimationFrame(() => {
          const items = getFocusable();
          if (items.length > 0) {
            try { items[0].focus(); } catch (_) {}
          }
        });
      } else {
        // Only restore focus to the toggle if focus is currently inside the
        // panel (avoid stealing focus from wherever the user clicked next).
        if (panel.contains(document.activeElement) || document.activeElement === document.body) {
          try { toggle.focus(); } catch (_) {}
        }
      }
    });
    obs.observe(panel, { attributes: true, attributeFilter: ['class'] });
  }

  loadHeaderData()
    .then((headerData) => {
      const navLinks = headerData.navLinks || [];
      const html =
        renderAnnouncement(headerData.announcementBar) +
        renderHeader(headerData, navLinks) +
        renderCrumbs(headerData);
      slot.outerHTML = html;
      wireMobileNavFocus();
      // Sticky mobile CTA: append once, after the rest of the body's
      // already-rendered footer/leadbot, so it floats above them.
      if (!document.querySelector('[data-mobile-cta]')) {
        const stick = document.createElement('div');
        stick.innerHTML = renderMobileCta(headerData);
        document.body.appendChild(stick.firstElementChild);
        // Add bottom padding to clear the sticky bar on mobile only.
        const style = document.createElement('style');
        style.textContent = '@media (max-width: 1023.98px) { body { padding-bottom: calc(68px + env(safe-area-inset-bottom, 0px)); } }';
        document.head.appendChild(style);
      }
    })
    .catch((err) => {
      console.warn('[header] failed to load header data:', err);
    });
})();
