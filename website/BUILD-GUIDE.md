# Builder agent guide — On Target ABA redesign

You are building a single HTML page (or a small batch) for the new On Target ABA site. The homepage at `C:\Users\nates\Downloads\Claude\Utah Autism Testing\website\index.html` is the design reference — **read it first** to understand the design system, then mirror its structure, nav, footer, and component patterns in your page(s).

## Hard rules

1. **Read `index.html` first.** Copy its `<head>` block, the `<header class="nav-bar...">` nav (with mobile panel), and the `<footer>` VERBATIM into your page so headers/footers stay consistent across the site. Update the `<title>` and `<meta name="description">` for your page.
2. **Same stack:** Tailwind CDN (already configured inline in `<head>`), shared CSS at `assets/css/app.css`, shared JS at `assets/js/app.js`. Do NOT add other libraries.
3. **Read your scraped content file(s)** from `scraped/{pagename}.md`. Preserve the wording — do not paraphrase. You may improve structure, add icons, or split into prettier sections.
4. **Use the design system tokens** defined in `app.css`:
   - Colors via Tailwind: `text-ink`, `text-ink-soft`, `text-mute`, `bg-cream`, `bg-teal`, `bg-teal-deep`, `bg-teal-soft`, `bg-coral`, `bg-coral-soft`, `bg-sun`, `bg-sun-soft`, `text-coral`, etc.
   - Display font on big headings: `font-display` (Fraunces). Body uses default sans.
   - Buttons: `.btn .btn-coral`, `.btn .btn-ink`, `.btn .btn-ghost`, `.btn .btn-sun`
   - Eyebrow tags: `<div class="eyebrow"><span class="dot"></span> Label here</div>`
   - Cards hover: add `.lift` class
   - Scroll reveal: add `.reveal` (and `.reveal-delay-1`, `-2`, `-3` for staggered)
   - FAQ accordions: `<div class="faq-item"><button class="faq-q">Q <span class="chev">+</span></button><div class="faq-a">A</div></div>` — JS auto-binds.
   - Underline link: `.link-uline`
   - Blob backgrounds: `<div class="blob blob-coral w-[420px] h-[420px] -left-20 top-20"></div>`
5. **Images.** Use local paths: `assets/images/{filename}` where `{filename}` is the basename from the asset URL in the scraped file. Add `onerror="this.style.display='none'"` so missing images don't break layout. Use alt text. Use `assets/images/footerImg.png` for any "footerImg" reference.
6. **Phones / addresses** stay as in the scraped content. Use `tel:` links.
7. **CTAs** point to local pages — convert ontargetaba.com URLs to local filenames:
   - `https://ontargetaba.com/contact/` → `contact.html`
   - `https://ontargetaba.com/our-services/` → `our-services.html`
   - `https://ontargetaba.com/center-based-aba-therapy/` → `center-based-aba-therapy.html`
   - `https://ontargetaba.com/in-home-aba-therapy/` → `in-home-aba-therapy.html`
   - `https://ontargetaba.com/early-intervention-autism-program/` → `early-intervention-autism-program.html`
   - `https://ontargetaba.com/potty-training-progam/` → `potty-training-program.html`
   - `https://ontargetaba.com/about/` → `about.html`
   - `https://ontargetaba.com/our-process/` → `our-process.html`
   - `https://ontargetaba.com/locations_/` and `locations/` → `locations.html`
   - `https://ontargetaba.com/insurance/` → `insurance.html`
   - `https://ontargetaba.com/faqs/` → `faqs.html`
   - `https://ontargetaba.com/careers/` → `careers.html`
   - `https://ontargetaba.com/blogs/` or `/blog/` → `blog.html`
   - `https://ontargetaba.com/pre-intake-form/` → `pre-intake-form.html`
   - `https://ontargetaba.com/everything-you-need-to-know-aba-therapy/` → `aba-therapy-guide.html`
   - `https://ontargetaba.com/on-target-aba-autism-testing-autism-evaluations/` → `autism-testing.html`
   - `https://ontargetaba.com/aba-therapy-murray-utah/` → `murray-utah.html`
   - `https://ontargetaba.com/privacy-policy/` → `privacy-policy.html`
   - `https://ontargetaba.com/terms-of-service/` → `terms-of-service.html`
   - `https://ontargetaba.com/cookie-consent/` → `cookie-consent.html`
   - `https://ontargetaba.com/disclaimer/` → `disclaimer.html`
   - `https://ontargetaba.com/icon-attribution/` → `icon-attribution.html`
   - `https://ontargetaba.com/job-application/` → `job-application.html`
   - `https://ontargetaba.com/employment-application/` → `employment-application.html`
   - `https://ontargetaba.com/thankyou/` → `thank-you.html`
   - `https://ontargetaba.com/thank-you-confirmation/` → `thank-you-confirmation.html`
8. **Section pattern** for content pages: 1 hero with eyebrow + headline + subhead + CTA + visual accent → 2-4 content sections with cards/lists/visuals → testimonial/insurance/CTA bands as relevant → final CTA → footer. Use space, color contrast, and decorative blobs to keep pages from feeling boring.

## Animation guidance
Subtle, not noisy:
- Add `.reveal` to section heads, hero blocks, cards
- Stagger card grids with `.reveal-delay-1` / `-2` / `-3`
- Use `.float` on decorative target/sun blobs
- Use `.pulse-ring` only on bullseye highlights (sparingly)
- Don't animate body text

## Page-specific notes

### Service pages (center-based, in-home, early-intervention, potty-training)
Each should have: bold hero with relevant photo, 3-4 feature blocks, a "What to expect" steps row (4 numbered steps), testimonial, CTA band.

### Autism Testing page (KEY page — extra polish)
Lead with the "$0" + "no waitlist" benefit. Include the 5-step evaluation process. Salt Lake Valley callouts. Strong Schedule Evaluation CTAs.

### FAQs / Insurance / About pages
Use FAQ accordions for question/answer content. For About, feature the founder Ilana Gross prominently.

### Contact page
Three location cards with phone, hours, address. Include a stylized contact form (action="#" target="_blank" is fine — placeholder).

### Pre-intake / Job-application / Employment-application pages
Build a real, styled form. Use clean inputs styled like:
```html
<label class="block">
  <span class="text-sm font-semibold text-ink mb-1.5 block">Field label</span>
  <input class="w-full rounded-xl border border-line bg-white px-4 py-3 focus:border-coral focus:ring-2 focus:ring-coral-soft outline-none transition" />
</label>
```

### Legal pages (privacy, terms, cookie, disclaimer)
Simple: hero with title, then well-typed prose. Use `prose-soft` class on container, max-width ~ 4xl, generous spacing. Keep all legal text verbatim from scraped file.

### Thank-you pages
Centered, friendly, minimal: big checkmark icon, headline, subhead, "Back to home" CTA, and maybe one "while you wait" link to ABA guide or autism-testing page.

### Blog page
If the scraped file shows no posts, build a clean "coming soon" with an email subscribe field + 3 placeholder feature cards linking to resources.

## File output
Save each page directly to: `C:\Users\nates\Downloads\Claude\Utah Autism Testing\website\{filename}.html`

End your work by returning ONLY a comma-separated list of files written. No prose.
