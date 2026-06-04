/* ============================================================
   On Target ABA — shared client behaviors
   - scroll-reveal via IntersectionObserver
   - sticky nav scroll state
   - mobile nav toggle
   - FAQ accordions
   - active-link highlight
   - smooth-scroll for in-page anchors
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
})();
