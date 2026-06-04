/* ============================================================
   On Target ABA — shared site header
   Renders into <div id="site-header"></div>:
     - announcement bar
     - sticky nav (with active-page highlight)
     - mobile slide-down panel
     - per-page breadcrumb
   Pure inline injection, no fetch — avoids CF Pages .html quirks.
   ============================================================ */
(() => {
  'use strict';

  const slot = document.getElementById('site-header');
  if (!slot) return;

  // Normalize the current URL into a comparison slug.
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

  // Per-page breadcrumb chain (label, href). The last entry is the
  // current page and rendered without a link. `null` = no breadcrumb.
  const CRUMBS = {
    '/':                                   null,
    '/about':                              [['Home','/'], ['About', null]],
    '/our-process':                        [['Home','/'], ['About','/about'], ['Our Process', null]],
    '/our-services':                       [['Home','/'], ['Services', null]],
    '/center-based-aba-therapy':           [['Home','/'], ['Services','/our-services'], ['Center-Based ABA', null]],
    '/in-home-aba-therapy':                [['Home','/'], ['Services','/our-services'], ['In-Home ABA', null]],
    '/early-intervention-autism-program':  [['Home','/'], ['Services','/our-services'], ['Early Intervention', null]],
    '/potty-training-program':             [['Home','/'], ['Services','/our-services'], ['Potty Training', null]],
    '/autism-testing':                     [['Home','/'], ['Services','/our-services'], ['Autism Testing', null]],
    '/locations':                          [['Home','/'], ['Locations', null]],
    '/murray-utah':                        [['Home','/'], ['Locations','/locations'], ['Murray, UT', null]],
    '/mayfield-ohio':                      [['Home','/'], ['Locations','/locations'], ['Mayfield Village, OH', null]],
    '/gahanna-ohio':                       [['Home','/'], ['Locations','/locations'], ['Gahanna, OH', null]],
    '/worthington-ohio':                   [['Home','/'], ['Locations','/locations'], ['Worthington, OH', null]],
    '/insurance':                          [['Home','/'], ['Insurance', null]],
    '/faqs':                               [['Home','/'], ['FAQs', null]],
    '/careers':                            [['Home','/'], ['Careers', null]],
    '/job-application':                    [['Home','/'], ['Careers','/careers'], ['Job Application', null]],
    '/employment-application':             [['Home','/'], ['Careers','/careers'], ['Employment Application', null]],
    '/contact':                            [['Home','/'], ['Contact', null]],
    '/pre-intake-form':                    [['Home','/'], ['Contact','/contact'], ['Pre-Intake Form', null]],
    '/aba-therapy-guide':                  [['Home','/'], ['Resources', null], ['ABA Therapy Guide', null]],
    '/blog':                               [['Home','/'], ['Blog', null]],
    '/blog/post':                          [['Home','/'], ['Blog','/blog'], ['Article', null]],
    '/privacy-policy':                     [['Home','/'], ['Legal', null], ['Privacy Policy', null]],
    '/terms-of-service':                   [['Home','/'], ['Legal', null], ['Terms of Service', null]],
    '/cookie-consent':                     [['Home','/'], ['Legal', null], ['Cookies', null]],
    '/disclaimer':                         [['Home','/'], ['Legal', null], ['Disclaimer', null]],
    '/icon-attribution':                   [['Home','/'], ['Legal', null], ['Icon Attribution', null]],
    '/thank-you':                          null,
    '/thank-you-confirmation':             null,
  };

  function getCrumbs() {
    const slug = pageSlug();
    if (slug.indexOf('/blog/posts/') === 0) {
      return CRUMBS['/blog/post'];
    }
    if (slug in CRUMBS) return CRUMBS[slug];
    return null;
  }

  const SEP = '<svg class="w-3 h-3 text-mute shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 5l7 7-7 7"/></svg>';

  function renderCrumbs() {
    const crumbs = getCrumbs();
    if (!crumbs || crumbs.length < 2) return '';
    const parts = crumbs.map(([label, href], i) => {
      const isLast = i === crumbs.length - 1;
      if (isLast || !href) {
        return '<span class="text-ink font-semibold" aria-current="page">' + label + '</span>';
      }
      return '<a href="' + href + '" class="hover:text-coral transition">' + label + '</a>';
    });
    return (
      '<nav aria-label="Breadcrumb" class="bg-cream/60 border-b border-line">' +
        '<div class="max-w-7xl mx-auto px-5 py-3 text-sm text-mute flex items-center gap-2 flex-wrap">' +
          parts.join(SEP) +
        '</div>' +
      '</nav>'
    );
  }

  // ---------- main header markup ----------

  const phoneSvg =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/>' +
    '</svg>';

  const NAV_LINKS = [
    { href: '/our-services.html',           label: 'Services',       match: '/our-services'                       },
    { href: '/autism-testing.html',         label: 'Autism Testing', match: '/autism-testing'                     },
    { href: '/about.html',                  label: 'About',          match: '/about'                              },
    { href: '/insurance.html',              label: 'Insurance',      match: '/insurance'                          },
    { href: '/locations.html',              label: 'Locations',      match: '/locations'                          },
    { href: '/faqs.html',                   label: 'FAQs',           match: '/faqs'                               },
    { href: '/careers.html',                label: 'Careers',        match: '/careers'                            },
    { href: '/blog.html',                   label: 'Blog',           match: '/blog'                               },
  ];

  // Match the current page to a top-level section so its nav link
  // gets highlighted. A page like /center-based-aba-therapy lives
  // under Services; we mark Services active.
  const ACTIVE_SECTION = (() => {
    const slug = pageSlug();
    const map = {
      '/our-services': 'Services',
      '/center-based-aba-therapy': 'Services',
      '/in-home-aba-therapy': 'Services',
      '/early-intervention-autism-program': 'Services',
      '/potty-training-program': 'Services',
      '/autism-testing': 'Autism Testing',
      '/about': 'About',
      '/our-process': 'About',
      '/insurance': 'Insurance',
      '/locations': 'Locations',
      '/murray-utah': 'Locations',
      '/mayfield-ohio': 'Locations',
      '/gahanna-ohio': 'Locations',
      '/worthington-ohio': 'Locations',
      '/faqs': 'FAQs',
      '/careers': 'Careers',
      '/job-application': 'Careers',
      '/employment-application': 'Careers',
      '/blog': 'Blog',
    };
    if (slug.indexOf('/blog/') === 0) return 'Blog';
    return map[slug] || '';
  })();

  function navLinkHtml(link, opts) {
    const isActive = link.label === ACTIVE_SECTION;
    const baseCls = opts && opts.mobile
      ? 'py-2.5 border-b border-line'
      : 'link-uline hover:text-coral';
    const activeCls = isActive
      ? (opts && opts.mobile
          ? ' text-coral font-bold'
          : ' text-coral font-semibold')
      : '';
    const ariaCurrent = isActive ? ' aria-current="page"' : '';
    return (
      '<a data-nav-link href="' + link.href + '"' + ariaCurrent +
      ' class="' + baseCls + activeCls + '">' + link.label + '</a>'
    );
  }

  const announcementBar =
    '<div class="bg-ink text-white text-sm">' +
      '<div class="max-w-7xl mx-auto px-5 py-2.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">' +
        '<span class="inline-flex items-center gap-2">' +
          '<span class="relative flex h-2 w-2">' +
            '<span class="absolute inline-flex h-full w-full rounded-full bg-coral opacity-75 animate-ping"></span>' +
            '<span class="relative inline-flex rounded-full h-2 w-2 bg-coral"></span>' +
          '</span>' +
          '<span class="font-semibold tracking-wide">NEW SALT LAKE CITY LOCATION NOW OPEN</span>' +
        '</span>' +
        '<a href="/autism-testing.html" class="link-uline text-sun font-semibold">Free autism testing &mdash; most families pay $0 &rarr;</a>' +
      '</div>' +
    '</div>';

  const headerBlock =
    '<header class="nav-bar sticky top-0 z-40 border-b border-transparent transition">' +
      '<div class="max-w-7xl mx-auto px-5 py-3.5 flex items-center justify-between gap-6">' +
        '<a href="/" class="flex items-center group" aria-label="On Target ABA &mdash; home">' +
          '<img src="/assets/images/footerImg.png" alt="On Target ABA" class="h-10 w-auto transition-transform group-hover:scale-[1.02]" />' +
        '</a>' +
        '<nav class="hidden lg:flex items-center gap-7 text-[15px] text-ink/85" aria-label="Primary">' +
          NAV_LINKS.map((l) => navLinkHtml(l)).join('') +
        '</nav>' +
        '<div class="hidden lg:flex items-center gap-2">' +
          '<a href="tel:8889895011" class="btn btn-ghost text-sm">' + phoneSvg + ' (888) 989-5011</a>' +
          '<a href="/contact.html" class="btn btn-coral text-sm">Get Started</a>' +
        '</div>' +
        '<button class="lg:hidden inline-grid place-items-center w-11 h-11 rounded-full bg-white shadow ring-1 ring-line" data-mnav-toggle aria-expanded="false" aria-label="Menu">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#163243" stroke-width="2.2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="mnav lg:hidden absolute top-full left-0 right-0 bg-white border-y border-line shadow-lg" data-mnav-panel>' +
        '<div class="px-5 py-5 grid gap-1 text-[15px]">' +
          NAV_LINKS.map((l) => navLinkHtml(l, { mobile: true })).join('') +
          '<div class="grid grid-cols-2 gap-2 mt-3">' +
            '<a href="tel:8889895011" class="btn btn-ghost justify-center text-sm">Call</a>' +
            '<a href="/contact.html" class="btn btn-coral justify-center text-sm">Get Started</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</header>';

  slot.outerHTML = announcementBar + headerBlock + renderCrumbs();

  // After injection, ensure the sticky-nav scroll handler and mobile
  // toggle from app.js find their targets. app.js runs after this
  // script, so its querySelectors will pick up these freshly-added
  // elements.
})();
