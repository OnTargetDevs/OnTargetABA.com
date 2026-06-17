/* ============================================================
   On Target ABA — shared client behaviors
   - scroll-reveal via IntersectionObserver
   - sticky nav scroll state
   - mobile nav toggle
   - FAQ accordions
   - active-link highlight
   - smooth-scroll for in-page anchors
   - lazy-loads /assets/js/leadbot.js after first paint
   ============================================================ */

(() => {
  'use strict';

  // ---------- Scroll reveal ----------
  // We don't hide .reveal in CSS — above-the-fold content paints
  // immediately. Here we stamp `.r-hide` only on elements that are
  // below the fold at first paint, and the observer removes it via
  // `.in` as they enter the viewport.
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fold = window.innerHeight + 80;
  document.querySelectorAll('.reveal').forEach((el) => {
    if (!reducedMotion && el.getBoundingClientRect().top > fold) {
      el.classList.add('r-hide');
    }
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // ---------- Sticky nav ----------
  const nav = document.querySelector('.nav-bar');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 12) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Mobile nav (event-delegated) ----------
  // header.js injects the toggle + panel after fetching header.json, so a
  // direct querySelector at DOMContentLoaded time misses them. Delegate
  // on document so the handler works no matter when the markup lands.
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-mnav-toggle]');
    if (toggle) {
      const panel = document.querySelector('[data-mnav-panel]');
      if (panel) {
        const open = panel.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
      }
      return;
    }
    // Close the mobile panel when a nav link inside it is clicked.
    const linkInPanel = e.target.closest('[data-mnav-panel] a');
    if (linkInPanel) {
      const panel = document.querySelector('[data-mnav-panel]');
      const t = document.querySelector('[data-mnav-toggle]');
      if (panel) panel.classList.remove('open');
      if (t) t.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  // ---------- FAQ accordion ----------
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const opened = item.classList.toggle('open');
      q.setAttribute('aria-expanded', String(opened));
    });
  });

  // ---------- Active link ----------
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav-link]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    if (href === here || (here === 'index.html' && href === './') || (href !== '#' && here === href.replace('./',''))) {
      a.classList.add('text-[color:var(--c-coral)]');
    }
  });

  // ---------- Year stamp ----------
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // ---------- Counter (stats) ----------
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const end = parseFloat(el.dataset.count);
        const dur = parseInt(el.dataset.dur || '1400', 10);
        const suffix = el.dataset.suffix || '';
        const start = performance.now();
        const step = (t) => {
          const k = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - k, 3);
          const val = (end * eased);
          el.textContent = (Number.isInteger(end) ? Math.round(val) : val.toFixed(1)) + suffix;
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach((c) => cio.observe(c));
  }

  // ---------- Lazy-load Jotform iframes ----------
  // Replaces the old <script src="form.jotform.com/jsform/{id}"> sync
  // tag, which used document.write and blocked render. We render an
  // iframe when the placeholder is within ~800px of the viewport (or
  // 2.5s after first paint as a failsafe), then attach Jotform's
  // auto-resize handler once so the iframe grows with its content.
  const jotPlaceholders = document.querySelectorAll('[data-jotform-id]');
  if (jotPlaceholders.length) {
    let handlerLoaded = false;
    const loadHandler = () => {
      if (handlerLoaded) return Promise.resolve();
      handlerLoaded = true;
      return new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jotfor.ms/s/umd/latest/for-form-embed-handler.js';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => resolve();
        document.head.appendChild(s);
      });
    };
    const mountForm = async (host) => {
      if (host.dataset.jotMounted) return;
      host.dataset.jotMounted = '1';
      const id = host.dataset.jotformId;
      const minH = host.dataset.jotformMinHeight || '600';
      const iframe = document.createElement('iframe');
      iframe.id = 'JotFormIFrame-' + id;
      iframe.title = 'Form';
      iframe.allowTransparency = 'true';
      iframe.setAttribute('allow', 'geolocation; microphone; camera; fullscreen; payment');
      iframe.src = 'https://form.jotform.com/' + id;
      iframe.setAttribute('frameborder', '0');
      iframe.scrolling = 'no';
      iframe.setAttribute('style',
        'min-width:100%;max-width:100%;width:100%;height:' + minH + 'px;border:none;'
      );
      const ph = host.querySelector('[data-jotform-placeholder]');
      if (ph) ph.remove();
      host.appendChild(iframe);
      await loadHandler();
      if (window.jotformEmbedHandler) {
        try {
          window.jotformEmbedHandler("iframe[id='JotFormIFrame-" + id + "']", "https://form.jotform.com/");
        } catch (e) { /* swallow */ }
      }
    };
    const jotIo = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) { mountForm(e.target); obs.unobserve(e.target); }
      });
    }, { rootMargin: '800px' });
    jotPlaceholders.forEach(el => jotIo.observe(el));
    setTimeout(() => jotPlaceholders.forEach(mountForm), 2500);
  }

  // ---------- Lazy-load the configured chat widget ----------
  // Which widget loads is controlled by assets/data/widget.json (inlined
  // into <script id="ota-widget-data"> at build time by optimize-pages.py).
  // Modes: "leadbot" (in-repo), "leadtrap" (SaaS), "custom" (paste-in HTML
  // snippet — e.g. a Jotform AI agent), "none" (no widget at all).
  function getWidgetConfig() {
    const slot = document.getElementById('ota-widget-data');
    if (slot && slot.textContent.trim()) {
      try { return JSON.parse(slot.textContent); } catch (e) { /* fall through */ }
    }
    return { mode: 'leadbot' };
  }

  function injectHtmlWithScripts(html, target) {
    // template.innerHTML preserves <script> tags but doesn't execute them.
    // Clone each <script> into a fresh element so the browser runs it.
    const tmpl = document.createElement('template');
    tmpl.innerHTML = html;
    tmpl.content.querySelectorAll('script').forEach(function (old) {
      const s = document.createElement('script');
      for (let i = 0; i < old.attributes.length; i++) {
        s.setAttribute(old.attributes[i].name, old.attributes[i].value);
      }
      if (old.textContent) s.textContent = old.textContent;
      old.replaceWith(s);
    });
    target.appendChild(tmpl.content);
  }

  const loadWidget = () => {
    if (window.__otaWidgetLoaded) return;
    window.__otaWidgetLoaded = true;

    const cfg = getWidgetConfig();

    if (cfg.mode === 'none') return;

    if (cfg.mode === 'leadtrap') {
      const partnerId = cfg.leadtrap && cfg.leadtrap.partnerId;
      if (!partnerId) return;
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://app.leadtrap.ai/platform/script?partner_id=' +
              encodeURIComponent(partnerId);
      s.dataset.widget = 'leadtrap';
      document.head.appendChild(s);
      return;
    }

    if (cfg.mode === 'custom') {
      const snippet = cfg.custom && cfg.custom.snippet;
      if (!snippet || !snippet.trim()) return;
      const wrap = document.createElement('div');
      wrap.dataset.widget = 'custom';
      document.body.appendChild(wrap);
      injectHtmlWithScripts(snippet, wrap);
      return;
    }

    // Default: in-repo leadbot. Path resolution handles three URL shapes:
    //   /foo.html             -> "assets/js/leadbot.js"
    //   /blog/post.html       -> "../assets/js/leadbot.js"
    //   /blog/posts/{slug}    -> "../assets/js/leadbot.js"
    //                            (rewritten to /blog/post.html with
    //                             <base href="/blog/">, so "../" resolves
    //                             to root)
    const inBlog = location.pathname.indexOf('/blog/') !== -1;
    const s = document.createElement('script');
    s.src = (inBlog ? '../' : '') + 'assets/js/leadbot.js';
    s.async = true;
    s.dataset.widget = 'leadbot';
    document.head.appendChild(s);
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadWidget, { timeout: 2000 });
  } else {
    setTimeout(loadWidget, 1500);
  }
  // Also load on first user interaction for users on slow connections.
  const interactionEvents = ['mousemove', 'touchstart', 'keydown', 'scroll'];
  const earlyLoad = () => {
    loadWidget();
    interactionEvents.forEach((e) => removeEventListener(e, earlyLoad));
  };
  interactionEvents.forEach((e) => addEventListener(e, earlyLoad, { once: true, passive: true }));
})();

/* ============================================================
   Site enhancements (runs after the main behavior IIFE).
   - Mirror any single-row review marquee into a 2-row pattern
     with the mirror scrolling the opposite direction. Pages that
     already shipped a 2-row layout (e.g. index.html) are left alone.
   - Inject a "Built by Shalom Karr" credit fallback in case a page
     ships without the shared footer for some reason.
   ============================================================ */
(() => {
  'use strict';

  // ---- Mirror review marquees ----
  document.querySelectorAll('.review-marquee').forEach((m) => {
    const prev = m.previousElementSibling;
    const next = m.nextElementSibling;
    if ((prev && prev.classList.contains('review-marquee')) ||
        (next && next.classList.contains('review-marquee'))) return;

    const clone = m.cloneNode(true);
    // The original .reveal is wired to an IntersectionObserver that has
    // already run by now; strip it from the clone so the mirror appears
    // alongside the original instead of staying invisible.
    clone.classList.remove('reveal');
    clone.classList.add('mt-4');

    const baseLabel = m.getAttribute('aria-label') || 'Parent reviews';
    clone.setAttribute('aria-label', baseLabel + ' — reverse row');

    const track = clone.querySelector('.review-track');
    if (track) {
      track.classList.add('reverse');
      // De-sync so the two rows don't visibly tick together.
      track.style.setProperty('--dur', '75s');
    }
    if (!/\bmb-\d/.test(m.className)) m.classList.add('mb-4');
    m.insertAdjacentElement('afterend', clone);
  });

  // ---- "Built by Shalom Karr" credit (JS fallback only) ----
  // The canonical chip lives in /assets/partials/footer.html. This
  // fallback fires if a page somehow renders without the partial.
  const footer = document.querySelector('footer');
  if (footer && !/shalomkarr\.pages\.dev/i.test(footer.innerHTML)) {
    const credit = document.createElement('div');
    credit.setAttribute('data-built-by', '');
    credit.className = 'text-center pb-4';
    credit.innerHTML =
      '<a href="https://shalomkarr.pages.dev/" target="_blank" rel="noopener" ' +
      'class="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/65 hover:text-white text-xs transition-colors">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="h-3.5 w-3.5 text-[color:var(--c-coral)] group-hover:text-[color:var(--c-sun)] transition-colors"><path d="M12 2l2.39 7.36H22l-6.18 4.49 2.36 7.36L12 16.71l-6.18 4.5 2.36-7.36L2 9.36h7.61L12 2z"/></svg>' +
        '<span class="tracking-wide">Built by</span>' +
        '<span class="font-display italic font-semibold text-white">Shalom Karr</span>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3"><path d="M7 17L17 7M7 7h10v10"/></svg>' +
      '</a>';
    const bottomBar = footer.querySelector('.border-t.border-white\\/10') ||
                      footer.querySelector('.border-t') ||
                      footer;
    bottomBar.appendChild(credit);
  }
})();
