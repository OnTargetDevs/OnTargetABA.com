/* ============================================================
   Lead-bot intake widget
   - Floating launcher + greeting bubble
   - 4-step triage: reason -> location -> child age -> contact
   - Routes to the appropriate Jotform with prefilled URL params
   - Persistence: localStorage so a dismiss/finish doesn't pester

   Loaded lazily by app.js after first paint (requestIdleCallback
   or first user interaction). Do not include this file directly
   from any HTML page.
   ============================================================ */
(() => {
  'use strict';

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // We still mount the widget; we just skip the auto-popup animation.
  }

  // ---- config: Jotform routing per intent ----
  const JOTFORM = {
    intake:    '213614603878157', // generic ABA intake
    autism:    '260534406459156', // autism testing scheduler
    contact:   '210615141890045', // contact form
  };

  // Use the relative path of the form pages (so the panel works from any page).
  // Each entry is an object { local: relative-page, jot: jotform-id }.
  const ROUTES = {
    'autism-testing': { local: 'autism-testing.html', jot: JOTFORM.autism, label: 'Autism testing' },
    'aba-therapy':    { local: 'pre-intake-form.html', jot: JOTFORM.intake, label: 'ABA therapy' },
    'general':        { local: 'contact.html',         jot: JOTFORM.contact, label: 'General' },
    'careers':        { local: 'careers.html',         jot: null,            label: 'Careers' },
  };

  function jotUrl(id, params) {
    const u = new URL('https://form.jotform.com/' + id);
    Object.entries(params || {}).forEach(([k, v]) => { if (v) u.searchParams.set(k, v); });
    return u.toString();
  }

  // Capture UTM attribution from the current URL so it survives the hand-off
  // to Jotform. Map these param names to custom fields in each Jotform's
  // settings to surface them alongside the lead in your CRM / reports.
  function utmParams() {
    const out = {};
    try {
      const q = new URLSearchParams(location.search);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => {
        const v = q.get(k);
        if (v) out[k] = v;
      });
    } catch (_) { /* no-op */ }
    return out;
  }

  // ---- DOM scaffolding ----
  const isPostPage = location.pathname.includes('/blog/post.html');
  const root = isPostPage ? '../' : '';

  const launcher = document.createElement('div');
  launcher.className = 'lb-launcher';
  launcher.setAttribute('aria-live', 'polite');
  // Build the bubble as a native <button> so it gets free Enter/Space keyboard
  // activation and proper focus semantics. The close affordance is also a
  // native <button>; we append it via the DOM API (rather than via the HTML
  // parser, which would auto-close the outer button) so it sits inside the
  // bubble and the existing `.lb-bubble .lb-close` CSS selector still matches.
  const bubbleEl = document.createElement('button');
  bubbleEl.type = 'button';
  bubbleEl.className = 'lb-bubble';
  bubbleEl.setAttribute('aria-label', 'Open intake assistant');
  bubbleEl.appendChild(document.createTextNode('Hi! Looking for help getting started?'));
  const closeEl = document.createElement('button');
  closeEl.type = 'button';
  closeEl.className = 'lb-close';
  closeEl.setAttribute('aria-label', 'Dismiss');
  closeEl.innerHTML = '&times;';
  bubbleEl.appendChild(closeEl);
  launcher.appendChild(bubbleEl);

  const avatarHtml = document.createElement('div');
  avatarHtml.innerHTML = (
    '<button class="lb-avatar" type="button" aria-label="Open intake assistant" aria-expanded="false">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>' +
      '</svg>' +
      '<span class="lb-dot" aria-hidden="true"></span>' +
    '</button>'
  );
  launcher.appendChild(avatarHtml.firstChild);

  const panel = document.createElement('aside');
  panel.className = 'lb-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'On Target ABA intake assistant');
  panel.innerHTML = (
    '<div class="lb-head">' +
      '<div class="lb-team"><span class="lb-pip"></span><span class="lb-team-text">On Target Team &middot; online</span></div>' +
      '<h3>Hi! How can we help your family?</h3>' +
      '<p>Tell us a bit and we&rsquo;ll route you to the right next step.</p>' +
      '<button class="lb-x" type="button" aria-label="Close">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
      '</button>' +
    '</div>' +
    '<div class="lb-body" data-lb-body></div>' +
    '<div class="lb-foot"><span>Powered by On Target ABA</span><a href="tel:8889895011">Call us instead</a></div>'
  );

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  // ---- state ----
  const state = { intent: '', region: '', age: '', name: '', phone: '', email: '' };
  const STORAGE_KEY = 'ota_leadbot_v1';

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function saveState(patch) {
    const prev = loadState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.assign(prev, patch)));
  }

  const persisted = loadState();
  let panelOpen = false;
  let stepIdx = 0;

  // ---- step renderers ----
  const body = panel.querySelector('[data-lb-body]');

  function renderStep() {
    const step = STEPS[stepIdx];
    if (!step) return;
    body.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'lb-step';
    step.render(wrap);
    body.appendChild(wrap);
  }

  function go(n) {
    stepIdx = Math.max(0, Math.min(n, STEPS.length - 1));
    renderStep();
  }

  function msgEl(text) {
    const m = document.createElement('div');
    m.className = 'lb-msg';
    m.textContent = text;
    return m;
  }
  function choiceBtn(label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lb-choice';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  const STEPS = [
    {
      // 0: greeting + intent
      render(w) {
        w.appendChild(msgEl('Welcome! What brings you to On Target ABA today?'));
        [
          ['autism-testing', 'I want to schedule autism testing'],
          ['aba-therapy',    'I want to start ABA therapy'],
          ['general',        'I have a question / just looking around'],
          ['careers',        'I&rsquo;m here about a job / careers'],
        ].forEach(([k, label]) => {
          const b = choiceBtn('', () => { state.intent = k; saveState({ intent: k }); go(1); });
          b.innerHTML = label;
          w.appendChild(b);
        });
      },
    },
    {
      // 1: region (skipped for careers)
      render(w) {
        if (state.intent === 'careers') {
          stepIdx = 2; renderStep(); return;
        }
        w.appendChild(msgEl('Got it. Where are you located?'));
        [
          ['utah',      'Salt Lake Valley / Utah'],
          ['cleveland', 'Cleveland / Akron, Ohio'],
          ['columbus',  'Columbus area, Ohio'],
          ['elsewhere', 'Somewhere else'],
        ].forEach(([k, label]) => {
          w.appendChild(choiceBtn(label, () => { state.region = k; saveState({ region: k }); go(2); }));
        });
      },
    },
    {
      // 2: child age (skipped for careers)
      render(w) {
        if (state.intent === 'careers') {
          stepIdx = 3; renderStep(); return;
        }
        w.appendChild(msgEl("How old is your child?"));
        [
          ['under-2', 'Under 2'],
          ['2-5',     '2&ndash;5 years'],
          ['6-11',    '6&ndash;11 years'],
          ['12-18',   '12&ndash;18 years'],
        ].forEach(([k, label]) => {
          const b = choiceBtn('', () => { state.age = k; saveState({ age: k }); go(3); });
          b.innerHTML = label;
          w.appendChild(b);
        });
      },
    },
    {
      // 3: contact info + route
      render(w) {
        const ctaLabel = (state.intent === 'careers')
          ? 'Open careers page'
          : 'Send my info';
        const lead = (state.intent === 'careers')
          ? "Drop your name and email and we'll follow up about open BCBA &amp; RBT roles."
          : "Last step. We'll text or email you within one business day.";

        const m = document.createElement('div');
        m.className = 'lb-msg';
        m.innerHTML = lead;
        w.appendChild(m);

        const form = document.createElement('form');
        form.addEventListener('submit', (e) => { e.preventDefault(); finish(); });

        const fields = [
          { name: 'name',  label: 'Your name',        type: 'text',  placeholder: 'First & last' },
          { name: 'phone', label: 'Phone',            type: 'tel',   placeholder: 'Mobile preferred' },
          { name: 'email', label: 'Email',            type: 'email', placeholder: 'name@example.com' },
        ];
        fields.forEach(f => {
          const inputId = 'lb-field-' + f.name;
          const lbl = document.createElement('label');
          lbl.className = 'lb-label';
          lbl.textContent = f.label;
          lbl.htmlFor = inputId;
          form.appendChild(lbl);
          const i = document.createElement('input');
          i.id = inputId;
          i.className = 'lb-input';
          i.type = f.type;
          i.placeholder = f.placeholder;
          i.name = f.name;
          i.value = state[f.name] || persisted[f.name] || '';
          i.required = f.name !== 'phone';
          i.addEventListener('input', () => {
            state[f.name] = i.value;
            saveState({ [f.name]: i.value });
          });
          form.appendChild(i);
        });

        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.className = 'lb-submit';
        submit.innerHTML = ctaLabel + ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
        form.appendChild(submit);

        w.appendChild(form);
      },
    },
    {
      // 4: finish / handoff
      render(w) {
        const route = ROUTES[state.intent] || ROUTES.general;
        const m = document.createElement('div');
        m.className = 'lb-msg';
        m.innerHTML = (state.intent === 'careers')
          ? "Thanks! Opening the careers page now &mdash; you can apply directly there."
          : "Thanks " + (state.name || '') + "! We&rsquo;re routing you to the right form so we can verify benefits and schedule fast.";
        w.appendChild(m);

        // Auto-route after a short delay so the user sees the confirmation.
        // UTM params (if present on the landing URL) are passed through so
        // campaign attribution survives the hand-off into Jotform.
        const params = Object.assign({
          name:       state.name,
          phone:      state.phone,
          email:      state.email,
          age:        state.age,
          region:     state.region,
          source:     'leadbot',
        }, utmParams());
        const target = route.jot
          ? jotUrl(route.jot, params)
          : (root + route.local);

        const btn = document.createElement('a');
        btn.className = 'lb-submit';
        btn.style.textDecoration = 'none';
        btn.href = target;
        btn.target = '_blank';
        btn.rel = 'noopener';
        btn.innerHTML = (route.jot ? 'Open the form &rarr;' : 'Continue to careers &rarr;');
        w.appendChild(btn);

        const reset = document.createElement('button');
        reset.type = 'button';
        reset.className = 'lb-choice';
        reset.style.marginTop = '.8rem';
        reset.textContent = 'Start over';
        reset.addEventListener('click', () => { go(0); });
        w.appendChild(reset);

        // Auto-jump for non-career routes
        if (route.jot) {
          setTimeout(() => { window.open(target, '_blank'); }, 1100);
        }

        saveState({ submitted: Date.now() });

        // GA4: fire view_form when the user is handed off to the Jotform
        // (or the careers page). Mirrors the generate_lead event fired in
        // finish() — kept here so we capture even when finish() is bypassed
        // (e.g. user lands directly on step 4 via persisted state).
        try {
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'view_form', {
              form_destination: route.jot ? ('jotform:' + route.jot) : route.local,
              intent: state.intent || '',
              region: state.region || '',
              age: state.age || '',
              source: 'leadbot',
            });
          }
        } catch (_) { /* never block UX on analytics */ }
      },
    },
  ];

  function finish() {
    // GA4: lead generated. Mark this event as a conversion in GA4 Admin >
    // Events. Wrapped in try/catch + typeof check so the widget keeps working
    // when gtag isn't loaded (preview pages, blockers, dev mode).
    try {
      if (typeof window.gtag === 'function') {
        const route = ROUTES[state.intent] || ROUTES.general;
        window.gtag('event', 'generate_lead', {
          intent: state.intent || '',
          region: state.region || '',
          age: state.age || '',
          route: route.label || '',
          has_phone: !!state.phone,
          has_email: !!state.email,
          source: 'leadbot',
        });
      }
    } catch (_) { /* never block UX on analytics */ }
    go(4);
  }

  // ---- open/close + first-time popup ----
  const bubble = launcher.querySelector('.lb-bubble');
  const closeBtn = bubble.querySelector('.lb-close');
  const avatar = launcher.querySelector('.lb-avatar');
  const xBtn = panel.querySelector('.lb-x');

  // Focus management: remember which element opened the dialog so we can
  // restore focus when it closes, and trap Tab cycling inside the panel
  // while it is open (ARIA dialog authoring practices).
  let lastFocusedBeforeOpen = null;
  const FOCUSABLE_SEL = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function getFocusable() {
    return Array.prototype.filter.call(
      panel.querySelectorAll(FOCUSABLE_SEL),
      (el) => el.offsetParent !== null || el === document.activeElement
    );
  }

  function openPanel() {
    lastFocusedBeforeOpen = document.activeElement;
    panel.classList.add('open');
    panelOpen = true;
    avatar.setAttribute('aria-expanded', 'true');
    if (stepIdx === 0 && !persisted.intent) renderStep();
    else if (stepIdx === 0) { go(0); }
    else renderStep();
    // Move focus to the first focusable control inside the panel.
    setTimeout(() => {
      const f = getFocusable();
      if (f.length) { try { f[0].focus(); } catch (_) { /* no-op */ } }
      else { try { panel.focus(); } catch (_) { /* no-op */ } }
    }, 0);
  }
  function closePanel() {
    panel.classList.remove('open');
    panelOpen = false;
    avatar.setAttribute('aria-expanded', 'false');
    // Restore focus to whatever opened the dialog (usually the avatar button).
    const restoreTarget = (lastFocusedBeforeOpen && document.contains(lastFocusedBeforeOpen))
      ? lastFocusedBeforeOpen
      : avatar;
    try { restoreTarget.focus(); } catch (_) { /* no-op */ }
    lastFocusedBeforeOpen = null;
  }

  avatar.addEventListener('click', () => panelOpen ? closePanel() : openPanel());
  xBtn.addEventListener('click', closePanel);

  function hideBubble() { bubble.classList.remove('show'); }
  bubble.addEventListener('click', (e) => {
    if (e.target === closeBtn) return;
    hideBubble();
    openPanel();
  });
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hideBubble();
    saveState({ dismissedBubble: Date.now() });
  });

  // Show the greeting bubble once per ~3 days
  const lastDismiss = persisted.dismissedBubble || 0;
  const lastSubmit = persisted.submitted || 0;
  const THREE_DAYS = 1000 * 60 * 60 * 24 * 3;
  const now = Date.now ? Date.now() : new Date().getTime();
  if (now - lastDismiss > THREE_DAYS && now - lastSubmit > THREE_DAYS) {
    setTimeout(() => { bubble.classList.add('show'); }, 2400);
    setTimeout(hideBubble, 11000);
  }

  // Close panel on outside click (mobile).
  // Use mousedown so the check runs BEFORE any in-panel button handler
  // re-renders the body — otherwise the clicked element is detached by the
  // time we inspect it, and panel.contains() falsely reads "outside."
  document.addEventListener('mousedown', (e) => {
    if (!panelOpen) return;
    if (panel.contains(e.target) || launcher.contains(e.target)) return;
    closePanel();
  });

  // Keyboard: Esc closes; Tab/Shift+Tab traps focus inside the dialog.
  document.addEventListener('keydown', (e) => {
    if (!panelOpen) return;
    if (e.key === 'Escape') { closePanel(); return; }
    if (e.key === 'Tab') {
      const f = getFocusable();
      if (!f.length) { e.preventDefault(); return; }
      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        try { last.focus(); } catch (_) { /* no-op */ }
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        try { first.focus(); } catch (_) { /* no-op */ }
      }
    }
  });

  // Pre-render the first step so it's instant
  renderStep();
})();
