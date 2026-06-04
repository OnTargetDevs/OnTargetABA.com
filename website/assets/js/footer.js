/* ============================================================
   On Target ABA — shared site footer (data-driven)
   Fetches /assets/data/footer.json and renders into
   <div id="site-footer">, including the AddressItLED-style
   "Built by Shalom Karr" credit chip.
   Falls back silently (no markup, console.warn) on fetch failure.
   ============================================================ */
(() => {
  'use strict';

  const slot = document.getElementById('site-footer');
  if (!slot) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Footer location links use a "Region | City" label convention so we
  // can render two stacked lines without bloating the JSON shape.
  // Split on " | " if present; otherwise treat the whole label as the
  // sub-text and leave the region empty.
  function renderLocationLink(link) {
    const label = link.label || '';
    const parts = label.split(' | ');
    const region = parts.length > 1 ? parts[0] : '';
    const city = parts.length > 1 ? parts.slice(1).join(' | ') : label;
    return (
      '<li><a href="' + esc(link.href) + '" class="hover:text-white">' +
        (region ? '<span class="text-white font-semibold">' + esc(region) + '</span><br/>' : '') +
        esc(city) +
      '</a></li>'
    );
  }

  function renderColumn(col, isLocations) {
    const links = (col.links || []).map((l) => {
      if (isLocations) return renderLocationLink(l);
      return '<li><a href="' + esc(l.href) + '" class="link-uline">' + esc(l.label) + '</a></li>';
    }).join('');
    const ulCls = isLocations
      ? 'space-y-2.5 text-white/80 text-sm'
      : 'space-y-2.5 text-white/80';
    return (
      '<div class="lg:col-span-2">' +
        '<div class="text-xs uppercase tracking-widest text-white/50 font-semibold mb-4">' + esc(col.title) + '</div>' +
        '<ul class="' + ulCls + '">' + links + '</ul>' +
      '</div>'
    );
  }

  function render(data) {
    const logo = data.logo || {};
    const phone = data.phone || {};
    const credit = data.credit || {};
    const columns = data.columns || [];
    const legalLinks = data.legalLinks || [];

    const cols = columns.map((c, i) => renderColumn(c, i === 3 || /location/i.test(c.title))).join('');

    const legal = legalLinks.map((l) =>
      '<a href="' + esc(l.href) + '" class="hover:text-white">' + esc(l.label) + '</a>'
    ).join('');

    return (
      '<footer class="bg-ink text-white">' +
        '<div class="max-w-7xl mx-auto px-5 py-16 grid lg:grid-cols-12 gap-10">' +
          '<div class="lg:col-span-4">' +
            '<div class="flex items-center">' +
              '<img src="' + esc(logo.src) + '" alt="' + esc(logo.alt) + '" class="h-11 w-auto" />' +
            '</div>' +
            '<p class="mt-4 text-white/70 max-w-sm">' + esc(data.tagline) + '</p>' +
            '<a href="' + esc(phone.href) + '" class="mt-5 inline-flex items-center gap-2 font-semibold text-sun">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>' +
              esc(phone.label) +
            '</a>' +
          '</div>' +
          cols +
        '</div>' +

        '<div class="border-t border-white/10">' +
          '<div class="max-w-7xl mx-auto px-5 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-white/55">' +
            '<p>&copy;<span data-year>2026</span> ' + esc((data.copyright || '').replace(/^©\s*/, '')) + '</p>' +

            '<a href="' + esc(credit.url) + '" target="_blank" rel="noopener" ' +
                'class="group inline-flex items-center gap-2 self-start md:self-auto px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/65 hover:text-white transition-colors">' +
              '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="h-3.5 w-3.5 text-[color:var(--c-coral)] group-hover:text-[color:var(--c-sun)] transition-colors">' +
                '<path d="M12 2l2.39 7.36H22l-6.18 4.49 2.36 7.36L12 16.71l-6.18 4.5 2.36-7.36L2 9.36h7.61L12 2z"/>' +
              '</svg>' +
              '<span class="tracking-wide">Built by</span>' +
              '<span class="relative font-display italic font-semibold text-white">' +
                esc(credit.name) +
                '<span aria-hidden="true" class="pointer-events-none absolute inset-x-0 -bottom-0.5 h-px bg-gradient-to-r from-[color:var(--c-coral)] via-[color:var(--c-sun)] to-[color:var(--c-teal)] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>' +
              '</span>' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true">' +
                '<path d="M7 17L17 7M7 7h10v10"/>' +
              '</svg>' +
            '</a>' +

            '<div class="flex gap-5 text-white/60">' + legal + '</div>' +
          '</div>' +
        '</div>' +
      '</footer>'
    );
  }

  fetch('/assets/data/footer.json', { credentials: 'same-origin' })
    .then((r) => {
      if (!r.ok) throw new Error('footer.json ' + r.status);
      return r.json();
    })
    .then((data) => {
      slot.outerHTML = render(data);
      document.querySelectorAll('[data-year]').forEach((el) => {
        el.textContent = new Date().getFullYear();
      });
    })
    .catch((err) => {
      console.warn('[footer] failed to load footer data:', err);
    });
})();
