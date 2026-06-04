/* ============================================================
   On Target ABA — shared site footer
   Renders into <div id="site-footer"></div> with no fetch round-trip.
   Includes the AddressItLED-style "Built by Shalom Karr" credit chip.
   ============================================================ */
(() => {
  'use strict';

  const slot = document.getElementById('site-footer');
  if (!slot) return;

  const html =
    '<footer class="bg-ink text-white">' +
      '<div class="max-w-7xl mx-auto px-5 py-16 grid lg:grid-cols-12 gap-10">' +
        '<div class="lg:col-span-4">' +
          '<div class="flex items-center">' +
            '<img src="/assets/images/footerImg.png" alt="On Target ABA" class="h-11 w-auto" />' +
          '</div>' +
          '<p class="mt-4 text-white/70 max-w-sm">Compassionate, evidence-based ABA therapy and autism evaluations. Quality care without the wait.</p>' +
          '<a href="tel:8889895011" class="mt-5 inline-flex items-center gap-2 font-semibold text-sun">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>' +
            '1-888-989-5011' +
          '</a>' +
        '</div>' +

        '<div class="lg:col-span-2">' +
          '<div class="text-xs uppercase tracking-widest text-white/50 font-semibold mb-4">Services</div>' +
          '<ul class="space-y-2.5 text-white/80">' +
            '<li><a href="/center-based-aba-therapy.html" class="link-uline">Center-Based ABA</a></li>' +
            '<li><a href="/in-home-aba-therapy.html" class="link-uline">In-Home ABA</a></li>' +
            '<li><a href="/early-intervention-autism-program.html" class="link-uline">Early Intervention</a></li>' +
            '<li><a href="/potty-training-program.html" class="link-uline">Potty Training</a></li>' +
            '<li><a href="/autism-testing.html" class="link-uline">Autism Testing</a></li>' +
          '</ul>' +
        '</div>' +

        '<div class="lg:col-span-2">' +
          '<div class="text-xs uppercase tracking-widest text-white/50 font-semibold mb-4">Company</div>' +
          '<ul class="space-y-2.5 text-white/80">' +
            '<li><a href="/about.html" class="link-uline">About</a></li>' +
            '<li><a href="/our-process.html" class="link-uline">Our Process</a></li>' +
            '<li><a href="/locations.html" class="link-uline">Locations</a></li>' +
            '<li><a href="/careers.html" class="link-uline">Careers</a></li>' +
            '<li><a href="/blog.html" class="link-uline">Blog</a></li>' +
          '</ul>' +
        '</div>' +

        '<div class="lg:col-span-2">' +
          '<div class="text-xs uppercase tracking-widest text-white/50 font-semibold mb-4">Resources</div>' +
          '<ul class="space-y-2.5 text-white/80">' +
            '<li><a href="/aba-therapy-guide.html" class="link-uline">ABA Therapy Guide</a></li>' +
            '<li><a href="/insurance.html" class="link-uline">Insurance</a></li>' +
            '<li><a href="/faqs.html" class="link-uline">FAQs</a></li>' +
            '<li><a href="/contact.html" class="link-uline">Contact</a></li>' +
            '<li><a href="/pre-intake-form.html" class="link-uline">Pre-Intake Form</a></li>' +
          '</ul>' +
        '</div>' +

        '<div class="lg:col-span-2">' +
          '<div class="text-xs uppercase tracking-widest text-white/50 font-semibold mb-4">Locations</div>' +
          '<ul class="space-y-2.5 text-white/80 text-sm">' +
            '<li><a href="/murray-utah.html" class="hover:text-white"><span class="text-white font-semibold">Utah</span><br/>Murray, UT</a></li>' +
            '<li><a href="/mayfield-ohio.html" class="hover:text-white"><span class="text-white font-semibold">Cleveland</span><br/>Mayfield Village, OH</a></li>' +
            '<li><a href="/gahanna-ohio.html" class="hover:text-white"><span class="text-white font-semibold">Columbus</span><br/>Gahanna, OH</a></li>' +
            '<li><a href="/worthington-ohio.html" class="hover:text-white"><span class="text-white font-semibold">Worthington</span><br/>Worthington, OH</a></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +

      '<div class="border-t border-white/10">' +
        '<div class="max-w-7xl mx-auto px-5 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-white/55">' +
          '<p>&copy;<span data-year>2026</span> ON TARGET ABA, LLC &middot; All rights reserved &middot; Operated by Target ABA, LLC</p>' +

          '<a href="https://shalomkarr.pages.dev/" target="_blank" rel="noopener" ' +
              'class="group inline-flex items-center gap-2 self-start md:self-auto px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/65 hover:text-white transition-colors">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="h-3.5 w-3.5 text-[color:var(--c-coral)] group-hover:text-[color:var(--c-sun)] transition-colors">' +
              '<path d="M12 2l2.39 7.36H22l-6.18 4.49 2.36 7.36L12 16.71l-6.18 4.5 2.36-7.36L2 9.36h7.61L12 2z"/>' +
            '</svg>' +
            '<span class="tracking-wide">Built by</span>' +
            '<span class="relative font-display italic font-semibold text-white">' +
              'Shalom Karr' +
              '<span aria-hidden="true" class="pointer-events-none absolute inset-x-0 -bottom-0.5 h-px bg-gradient-to-r from-[color:var(--c-coral)] via-[color:var(--c-sun)] to-[color:var(--c-teal)] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>' +
            '</span>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true">' +
              '<path d="M7 17L17 7M7 7h10v10"/>' +
            '</svg>' +
          '</a>' +

          '<div class="flex gap-5 text-white/60">' +
            '<a href="/privacy-policy.html" class="hover:text-white">Privacy</a>' +
            '<a href="/terms-of-service.html" class="hover:text-white">Terms</a>' +
            '<a href="/cookie-consent.html" class="hover:text-white">Cookies</a>' +
            '<a href="/disclaimer.html" class="hover:text-white">Disclaimer</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</footer>';

  slot.outerHTML = html;

  // Stamp the current year on the just-injected element.
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
