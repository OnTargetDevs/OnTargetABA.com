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

  // ---------- Mobile nav ----------
  const mToggle = document.querySelector('[data-mnav-toggle]');
  const mPanel  = document.querySelector('[data-mnav-panel]');
  if (mToggle && mPanel) {
    mToggle.addEventListener('click', () => {
      const open = mPanel.classList.toggle('open');
      mToggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mPanel.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        mPanel.classList.remove('open');
        mToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      })
    );
  }

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

  // ---------- Lazy-load the lead-bot widget ----------
  // The widget is ~7KB of JS + a chunk of DOM and is purely a
  // conversion helper — never blocking. We defer it until the
  // browser is idle (or first user interaction on slow devices).
  const loadLeadBot = () => {
    if (document.querySelector('script[data-leadbot]')) return;
    // Path resolution covers three URL shapes:
    //   /foo.html             -> "assets/js/leadbot.js"
    //   /blog/post.html       -> "../assets/js/leadbot.js"
    //   /blog/posts/{slug}    -> "../assets/js/leadbot.js"
    //                            (rewritten to /blog/post.html
    //                             with <base href="/blog/"> set,
    //                             so "../" resolves to root)
    const inBlog = location.pathname.indexOf('/blog/') !== -1;
    const s = document.createElement('script');
    s.src = (inBlog ? '../' : '') + 'assets/js/leadbot.js';
    s.async = true;
    s.dataset.leadbot = '1';
    document.head.appendChild(s);
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadLeadBot, { timeout: 2000 });
  } else {
    setTimeout(loadLeadBot, 1500);
  }
  // Also load on first user interaction for users on slow connections.
  const interactionEvents = ['mousemove', 'touchstart', 'keydown', 'scroll'];
  const earlyLoad = () => {
    loadLeadBot();
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
