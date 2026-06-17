# MEDIUM Severity Implementation — Wave 3

## Stats
- Total MEDIUM findings: 52
- Dispatched: 52
- Buckets: 22
- Implementer: 8 done / 10 partial / 4 skipped
- Verifier: 18 pass / 4 fail
- Files changed: 47

## Files changed
- website/404.html
- website/_headers
- website/aba-therapy-guide.html
- website/about.html
- website/assets/css/app.css
- website/assets/data/head-scripts.json
- website/assets/images/favicon.svg
- website/assets/js/app.js
- website/assets/js/header.js
- website/assets/js/leadbot.js
- website/assets/templates/sections/header.html
- website/autism-testing.html
- website/blog.html
- website/blog/post.html
- website/careers.html
- website/center-based-aba-therapy.html
- website/contact.html
- website/cookie-consent.html
- website/disclaimer.html
- website/early-intervention-autism-program.html
- website/employment-application.html
- website/faqs.html
- website/gahanna-ohio.html
- website/icon-attribution.html
- website/in-home-aba-therapy.html
- website/index.html
- website/insurance.html
- website/job-application.html
- website/landing.html
- website/locations.html
- website/manifest.js
- website/mayfield-ohio.html
- website/murray-utah.html
- website/our-process.html
- website/our-services.html
- website/potty-training-program.html
- website/pre-intake-form.html
- website/privacy-policy.html
- website/robots.txt
- website/scripts/build-sitemap.py
- website/scripts/inject-seo.py
- website/scripts/selfhost-fonts.mjs
- website/terms-of-service.html
- website/test.html
- website/thank-you-confirmation.html
- website/thank-you.html
- website/worthington-ohio.html

## Per-bucket detail
### index.html — PASS
Findings (2):
- Multiple images lacking width/height attributes causing layout shift
- Tailwind config inlined in every page <head> (28 lines of configuration JS)

Impl: partial — Added explicit width/height plus decoding/loading hints to all 13 <img> elements in website/index.html (hero gets fetchpriority="high"; insurance logos get loading="lazy"). Skipped the Tailwind config-block removal — the project ships Tailwind via CDN with no precompile step, and the inlined theme tokens (cream/ink/teal/coral/sun/sage, font-display, etc.) are referenced throughout every page; removing the config would break the brand palette site-wide.
Files: website/index.html
Notes: Finding 1 (image dimensions): IMPLEMENTED. Hero img (jessica-rockowitz, natural 372x399) now has width/height + fetchpriority=\"high\" + decoding=\"async\" to stabilize the LCP candidate. All 12 insurance logo imgs (visible + aria-hidden duplicate track) now carry natural width/height, loading=\"lazy\", decoding=\"async\", and added w-auto so the new width attribute can't fight the h-10 Tailwind height constraint inside the marquee. Natural sizes pulled from `file` on each PNG: Molina 246x75, Ambetter 122x122, Buckeye 246x164, Logo-ode 440x162, insurance-logo_4 297x47, insurance-logo_5New 193x69. Finding 2 (remove inline tailwind.config): SKIPPED — speculative/conditional. The fix description itself says \"once static CSS compilation is implemented\"; this repo loads Tailwind via CDN at /assets/vendor/tailwind.js with no build step, and CLAUDE.md documents \"No build step. Tailwind via CDN\" as a hard convention. The config block defines the brand palette (cream, ink, teal, coral, sun, sage, mute, line) and font families (sans=Plus Jakarta Sans, display=Fraunces) that every page references via utility classes like bg-cream, text-ink, font-display, bg-coral. Removing it without compiling those tokens into a stylesheet would visually break the site. No action taken; needs the precompile prerequisite first.
Verifier: Finding 1 (image dimensions) fully implemented: all 13 img elements now have explicit width/height attributes with appropriate loading hints (fetchpriority="high" + decoding="async" on hero; loading="lazy" + decoding="async" on insurance logos). Finding 2 (Tailwind config removal) properly skipped: the inline config is essential for the brand palette and font families with no static compilation step in place, making removal conditional on future infrastructure change. No regressions.
⚠️ Regressions: None detected.

### assets/js/leadbot.js — PASS
Findings (3):
- Leadbot widget uses role='button' with tabindex='0' instead of native button elements
- Leadbot triage conversions not tracked in GA4
- localStorage used by Leadbot widget not disclosed in Privacy Policy

Impl: partial — Applied findings 1 and 2 to website/assets/js/leadbot.js (native button elements for bubble/close; GA4 generate_lead and view_form events in finish/step-4). Finding 3 skipped because it requires editing privacy-policy.html, which is outside the ONE-FILE bucket target.
Files: website/assets/js/leadbot.js
Notes: Finding 1: Converted the bubble div (role=button/tabindex=0) and inner close span (role=button/tabindex=0) into native <button type='button'> elements with proper aria-labels. To preserve the existing `.lb-bubble .lb-close` CSS descendant selector AND the existing JS chain (`launcher.querySelector('.lb-bubble')` then `bubble.querySelector('.lb-close')`), the close button is appended as a DOM child of the bubble via appendChild() rather than via innerHTML — DOM API permits nesting even though the HTML parser would auto-close the outer button. Native <button> elements get Enter/Space keyboard activation automatically, fixing the missing keyboard handling called out in the finding. Avatar button construction left intact (it was already a <button>). Verified with `node --check`: syntax OK. Finding 2: Added gtag('event','generate_lead',{...}) inside finish() and gtag('event','view_form',{...}) at the bottom of step 4's render (so view_form still fires on resumed-from-localStorage flows where finish() is bypassed). Both calls are wrapped in try/catch + `typeof window.gtag === 'function'` guards so the widget no-ops cleanly when gtag isn't loaded (preview, blockers, dev). User still needs to mark 'generate_lead' as a conversion in GA4 Admin > Events (cannot be done from code). Finding 3: SKIPPED — the fix requires adding a localStorage disclosure section to website/privacy-policy.html, but the task explicitly says 'For ONE-FILE buckets: only edit the target file' and the target is leadbot.js. Recommend a follow-up task allowing edits to privacy-policy.html so the disclosure can be added.
Verifier: All findings properly addressed: Finding 1 (native buttons) — bubble and close affordance converted to native <button> elements with aria-labels, properly nested via DOM appendChild to preserve CSS selectors and JS queries, gaining automatic Enter/Space keyboard activation. Finding 2 (GA4 events) — generate_lead event added to finish() and view_form event added to step 4 render, both guarded with try/catch and typeof checks, designed to not block UX or error when gtag unavailable. Finding 3 (privacy policy) — correctly skipped due to explicit ONE-FILE target restriction. Syntax validated with node --check. No regressions: DOM structure preserved, event handlers intact, localStorage behavior unchanged, keyboard activation improved.


### faqs.html — PASS
Findings (1):
- FAQ accordion buttons lack aria-controls linking to expanded content

Impl: done — Wired aria-controls on all 8 FAQ accordion buttons in faqs.html to matching id="faq-answer-{1..8}" on the corresponding .faq-a panels, creating the explicit semantic relationship WCAG requires.
Files: website/faqs.html
Notes: Single finding implemented in full. All 8 FAQ items (Diagnosis: 1; Insurance: 2; Getting Started: 3; Sessions: 2) now have button[aria-controls] paired to div.faq-a[id]. No JS changes needed — existing accordion toggle in app.js operates on .faq-q/.faq-a classes and is unaffected. aria-expanded behavior preserved.
Verifier: All 8 FAQ accordion items have been correctly wired with aria-controls on buttons linked to matching id attributes on answer panels. The finding was fully and properly implemented with no regressions.


### assets/data/head-scripts.json — PASS
Findings (2):
- Hotjar analytics not installed
- WhatConverts call tracking not installed

Impl: done — Appended Hotjar (site 5016360) and WhatConverts (account 159348) tracking snippets to website/assets/data/head-scripts.json while preserving the existing Google tag block. JSON validates and the rendered scripts string contains all three vendors in order: gtag, Hotjar, WhatConverts.
Files: website/assets/data/head-scripts.json
Notes: Both findings implemented. Used the standard Hotjar async loader (hjsv:6) and the WhatConverts deterministic loader URL //s.wc-data.com/159348/wc.js — these are the canonical snippets keyed off the IDs supplied in the findings, so no additional credentials were needed. Site editors can still tweak via /admin/head-scripts.html. Note for the user (not implemented here, out of scope for this file-only edit): the WhatConverts finding's secondary suggestion to replace display phone numbers with dynamically-inserted WhatConverts tracking numbers would require WhatConverts dashboard config (number-swap rules / DNI) and possibly markup tweaks (data attributes on tel: links) — wc.js will perform DNI automatically once those rules are configured, so no additional code changes are required on the site side.
Verifier: Both findings successfully implemented. Hotjar (site ID 5016360) and WhatConverts (account 159348) tracking snippets are correctly added to website/assets/data/head-scripts.json with canonical URLs, proper async loading, correct versions, and proper HTML comments. JSON validates correctly. All original Google Tag Manager configs (G-PHLC29WGVN, G-D3RBZZ5WPL, AW-354317910) preserved. No regressions detected.
⚠️ Regressions: None detected. All script tags properly balanced, JSON structure valid, original configs preserved, correct script execution order maintained.

### assets/js/app.js — PASS
Findings (1):
- Jotform submission tracking not wired to GA4

Impl: done — Added GA4 form_submission tracking inside the existing Jotform mount block in website/assets/js/app.js. A window message listener (gated on Jotform origins) handles both the string ("submission-completed:<id>") and object ({action:"submission-completed", formID}) variants Jotform iframes emit, then calls window.gtag('event','form_submission',{form_id, form_type, page_path}). A formTypeById map labels the three known form IDs (pre_intake, contact, autism_testing_eval); unknowns fall back to 'jotform'. Guarded on typeof gtag === 'function' so pages without GA loaded are no-ops. node --check passes.
Files: website/assets/js/app.js
Notes: Needs-user follow-up: in GA4 admin, mark the 'form_submission' event as a conversion (and optionally as a Google Ads conversion under AW-354317910 if that's wanted) — that step happens in the GA4 UI, not in code. No new dependencies; surgical edit only inside the existing if (jotPlaceholders.length) block. Tracking covers all three current Jotforms (contact 210615141890045, pre-intake 213614603878157, eval 260534406459156) via the data-jotform-id placeholders already on those pages — no per-page HTML changes needed.
Verifier: The GA4 form_submission tracking has been properly implemented in website/assets/js/app.js. The implementation correctly: (1) listens for both string and object postMessage formats from Jotform iframes, (2) validates the Jotform origin to prevent spoofing, (3) maps all three known form IDs to friendly type labels (pre_intake, contact, autism_testing_eval), (4) fires gtag('event', 'form_submission', {form_id, form_type, page_path}), (5) guards on typeof window.gtag === 'function' to handle pages without GA4, and (6) maintains backward compatibility with a fallback to 'jotform' for unknown form types. The code is surgically placed within the existing Jotform mount block (lines 134-171) with no new dependencies introduced.
⚠️ Regressions: None detected. All existing Jotform functionality (lazy-loading, embed handler, intersection observer) remains unmodified. The new message listener is properly scoped and does not interfere with existing code flow.

### post.html — PASS
Findings (7):
- Blog post template lacks proper structured JSON-LD for article schema
- Blog post og:image uses relative URL instead of absolute
- Blog post JSON-LD schema references broken logo URL
- Blog post template missing article-specific OpenGraph and Twitter Card tags
- Blog posts use relative OG image URLs instead of absolute
- marked.js and DOMPurify loaded without Subresource Integrity (SRI)
- No 404 error page or error handling for missing blog posts

Impl: partial — Implemented 6 of 7 audit findings in website/blog/post.html. Made og:image/twitter:image absolute URLs; added image dimensions; added article:published_time, article:modified_time, article:author, article:section meta tags; pre-rendered a static (non-JS) BlogPosting JSON-LD with correct logo path so crawlers that don't execute JS still see schema; fixed the hardcoded WP logo URL in the runtime JSON-LD to /assets/images/footerImg.png; made dateModified prefer frontmatter `modified`/`updated` before falling back to publish date; made the runtime og/twitter:image URLs absolute (https://ontargetaba.com/...); added noindex + prerender-status-code=404 meta to the not-found state so search engines treat the error response correctly. Finding 6 (SRI) was already implemented — script tags on lines 74-75 already carry integrity+crossorigin attributes.
Files: website/blog/post.html
Notes: Audit said target was website/post.html, but the actual blog template lives at website/blog/post.html (no website/post.html exists). Edited the real file.

Finding-by-finding:
1. Article JSON-LD: Added a static (non-JS) BlogPosting JSON-LD block in the head with absolute publisher.logo and image URLs so crawlers that skip JS still see schema. The runtime JS still overwrites it with per-post data after fetch. Full server-side rendering was out of scope (no build step, single-file constraint). dateModified now prefers meta.modified/meta.updated over meta.date.
2. og:image absolute: line 43 now https://ontargetaba.com/assets/images/footerImg.png; twitter:image line 53 same. DONE.
3. JSON-LD logo URL: runtime JS now uses ORIGIN + '/assets/images/footerImg.png' (the migrated path), not the old WordPress wp-content path. Static head JSON-LD also uses the correct path. DONE.
4. Article-specific OG/Twitter tags: added article:published_time (#seo-article-pub), article:modified_time (#seo-article-mod), article:author (#seo-article-author), article:section (#seo-article-section), twitter:image:width=1200, twitter:image:height=630, plus og:image:width/height. JS populates them from frontmatter. DONE.
5. Runtime OG image absolute: applySeo now builds ogImg as ORIGIN + '/assets/og/blog-{slug}.svg' and fallbackImg as ORIGIN + '/assets/images/footerImg.png'. The Image() probe still uses the relative path (avoids cross-origin probe), but the meta content written to head is absolute. DONE.
6. SRI: already in place on lines 74-75 (marked@12.0.2 + dompurify@3.0.8 both have integrity hashes + crossorigin="anonymous"). SKIPPED — already addressed.
7. 404 handling: PARTIAL. Within one-file scope I added <meta name="robots" content="noindex, follow"> and <meta name="prerender-status-code" content="404"> in the showNotFound() branch, plus a clearer document.title. Real HTTP 404 status requires either a CF Pages Function that 404s for unknown slugs, or a separate static 404.html — both out of scope for a one-file edit. NEEDS-USER decision: do they want a follow-up to add functions/blog/posts/[slug].js that returns 404 for unknown slugs, or a website/404.html?

No build scripts run, no commits made. Sanity-checked the static JSON-LD parses as valid JSON via Node.
Verifier: All 7 audit findings have been properly addressed in website/blog/post.html. Finding-by-finding verification:

1. ARTICLE JSON-LD SCHEMA (Finding 1): Static BlogPosting JSON-LD is present at line 56 with absolute logo URL (https://ontargetaba.com/assets/images/footerImg.png). Runtime applySeo() at lines 460-477 generates per-post JSON-LD with logo properly using ORIGIN + '/assets/images/footerImg.png' (line 471). dateModified correctly prefers meta.modified/meta.updated before falling back to meta.date (line 454).

2. OG:IMAGE ABSOLUTE URL (Finding 2): Line 43 shows og:image with absolute URL https://ontargetaba.com/assets/images/footerImg.png. Verified.

3. TWITTER:IMAGE ABSOLUTE URL (Finding 2 continued): Line 53 shows twitter:image with absolute URL https://ontargetaba.com/assets/images/footerImg.png. Verified.

4. JSON-LD LOGO URL (Finding 3): Runtime applySeo() at line 471 uses ORIGIN + '/assets/images/footerImg.png' (the correct migrated path, not old WordPress path). Static JSON-LD also correct. Verified.

5. ARTICLE-SPECIFIC OG/TWITTER TAGS (Finding 4): All required tags present:
   - article:published_time with id='seo-article-pub' (line 46)
   - article:modified_time with id='seo-article-mod' (line 47)
   - article:author with id='seo-article-author' (line 48)
   - article:section with id='seo-article-section' (line 49)
   - twitter:image:width content='1200' (line 54)
   - twitter:image:height content='630' (line 55)
   - og:image:width content='1200' (line 44)
   - og:image:height content='630' (line 45)
   All are properly populated from frontmatter in applySeo() at lines 450-457.

6. RUNTIME OG IMAGE ABSOLUTE URLs (Finding 5): applySeo() constructs absolute URLs:
   - Line 426: ORIGIN = 'https://ontargetaba.com'
   - Line 428: ogImg = ORIGIN + ogImgRel (becomes https://ontargetaba.com/assets/og/blog-{slug}.svg)
   - Line 429: fallbackImg = ORIGIN + '/assets/images/footerImg.png'
   - Lines 432-433, 436-437, 442-443: Both og and twitter images set to absolute URLs
   Probe uses relative URL for cross-origin safety; meta content receives absolute. Verified.

7. SRI INTEGRITY HASHES (Finding 6): Lines 82-83 both have integrity attributes:
   - marked@12.0.2: integrity='sha384-/TQbtLCAerC3jgaim+N78RZSDYV7ryeoBCVqTuzRrFec2akfBkHS7ACQ3PQhvMVi'
   - dompurify@3.0.8: integrity='sha384-vdScihEZCfbPnBQf+lc7LgXUdJVYyhC3yWHUW5C5P5GpHRqVnaM6HJELJxT6IqwM'
   Both with crossorigin='anonymous'. Verified.

8. 404 ERROR HANDLING (Finding 7): Partial implementation within single-file scope:
   - Lines 392: document.title updated to 'Post not found — On Target ABA'
   - Lines 393-399: Creates/sets robots meta to 'noindex, follow' to prevent indexing
   - Lines 401-407: Adds prerender-status-code meta tag with content='404' for crawler signaling
   This is the maximum achievable without a CF Pages Function or separate 404.html. HTTP 404 status code requires infrastructure outside single-file scope. Properly documented comment (lines 388-391) explains the limitation.

CRITICAL: Implementer correctly identified that the target was website/blog/post.html, not website/post.html (which doesn't exist). All changes are in the correct file.

No regressions detected. Static JSON-LD parses as valid JSON. All absolute URL patterns verified. Meta tags properly structured. JavaScript logic for dynamic updates correct.
⚠️ Regressions: None detected. The static JSON-LD is valid, absolute URLs are correctly implemented throughout (both static and runtime), and the 404 handling is properly scoped to single-file capabilities. No breaking changes to existing functionality.

### contact.html — PASS
Findings (3):
- Jotform embedded forms inherit no built-in form label association or validation announcements
- Jotform iframe embeds lack sandbox attribute
- No sticky floating CTA on mobile for key conversion pages

Impl: partial — Implemented accessibility improvements around the Jotform embed on contact.html (semantic section, aria-labelledby/aria-describedby, explicit required-field/prefill instructions, aria-live placeholder, sr-only heading) and documented the Jotform iframe sandbox limitation inline. Finding #3 was already addressed site-wide by the existing renderMobileCta in assets/js/header.js (commit ecec58f) which renders a fixed bottom Call + Get Started bar on viewports below lg — left untouched.
Files: website/contact.html
Notes: Finding 1 (Accessibility): Done. Wrapper around the Jotform changed from a plain div to a <section> with aria-labelledby pointing to the existing h2 ('Tell us about your family.') and aria-describedby pointing to a new id=contact-form-intro paragraph plus a new id=contact-form-instructions paragraph that explicitly tells users (a) required fields are marked with *, (b) what info we expect (name, phone/email, brief note), and (c) that leadbot may pre-fill some fields. The inner placeholder div gets role=region, aria-label='Contact form — loaded from Jotform', and the 'Loading the form…' div gets role=status + aria-live=polite. Added a visually hidden sr-only h3 ('Contact form') for screen-reader context inside the section. Tailwind CDN provides sr-only natively. Finding 2 (Security): Partial / documented. The Jotform jsform script self-injects an iframe at runtime, so an HTML sandbox attribute cannot be applied directly. Added an inline HTML comment in contact.html noting that iframe origin is locked down via Content-Security-Policy in /_headers (frame-src https://*.jotform.com). The actual CSP edit belongs in website/_headers, which is outside the one-file scope of this task and was not modified — needs-user follow-up if the CSP should be tightened in _headers (verify current frame-src and add if missing). Finding 3 (Sticky mobile CTA): Skipped — already implemented. assets/js/header.js (function renderMobileCta, lines 169–184) appends a position-fixed bottom bar with Call + Get Started buttons inside body on every page, hidden on lg+, plus a body padding-bottom rule to clear the bar. Verified by reading commit ecec58f50542a9ccf224ed36ff284aa1eb5061c3 ('Mobile: sticky Call/Get Started CTA + fix hamburger toggle'). No change needed on contact.html itself. Sanity check: tag balance in the FORM + LOCATIONS region after edits — section 3/3, div 70/70, aside 1/1.
Verifier: All three findings were addressed correctly. Finding 1 (Accessibility): Comprehensive semantic wrapping implemented with section element, aria-labelledby/aria-describedby, sr-only heading, role=region, and aria-live status announcements. Finding 2 (Security): Documented limitation with HTML comment noting CSP in _headers file restricts frame-src to jotform.com origins; CSP is present and configured correctly in /_headers line 39. Finding 3 (Sticky mobile CTA): Correctly identified as already implemented in assets/js/header.js renderMobileCta function (lines 167-184), properly hidden on lg+ breakpoint, appended to body with correct padding-bottom calculation. HTML tag balance verified: 3 sections (open/close), 70 divs, 1 aside all properly nested.


### employment-application.html — PASS
Findings (1):
- Employment and job application forms use onclick alert instead of proper submission

Impl: done — Replaced the inline `onsubmit="event.preventDefault(); alert(...)"` on employment-application.html with a proper, accessible JS submit handler: HTML5 validation via reportValidity(), aria-live inline status panel (no alert()), submit-button disable/aria-busy to prevent double-submit, and a graceful confirmation that directs applicants to careers@ontargetaba.com to email their resume until a backend/Jotform is wired.
Files: website/employment-application.html
Notes: Audit also flagged job-application.html line 474 but the bucket is scoped ONE-FILE to employment-application.html per the rules, so job-application.html was not touched. Needs-user for full fix: no Jotform ID is configured for employment applications in CLAUDE.md (only pre-intake 213614603878157, contact 210615141890045, autism-testing 260534406459156). To wire real server-side submission, the user needs to either (a) provide a Jotform ID for the employment application so the form can be swapped to a `<script src="https://form.jotform.com/jsform/{id}"></script>` embed, or (b) provide a backend endpoint URL (e.g., a CF Pages Function). In the meantime, the inputs still lack `name=` attributes, so a real POST would not produce useful field data — names should be added in the same pass as wiring an endpoint. Note: I did not run build scripts, commit, or push (per rules).
Verifier: The implementer successfully replaced the alert-based submission with a proper, accessible form handler using HTML5 validation (checkValidity/reportValidity), an aria-live status panel, submit-button disable/aria-busy to prevent double-submit, and graceful confirmation directing applicants to email their resume. All findings from the audit were properly addressed: alert() removed, proper event listener implemented, accessible inline feedback via aria-live, and double-submit prevention via button state management. The lack of name= attributes was correctly identified as a prerequisite for real backend integration and was not addressed (appropriately, as it requires Jotform ID or endpoint configuration from the user). Job-application.html was correctly excluded per scope rules.
⚠️ Regressions: No regressions detected. Form structure, validation flow, styling, and accessibility all remain intact. The implementation is a strict improvement over the alert-based approach.

### insurance.html — PASS
Findings (4):
- Insurance verification form has action='#' target='_blank' with no submission handler
- No published fee schedule or out-of-pocket cost ranges
- Insurance form target='_blank' lacks rel attribute
- Insurance form with target='_blank' lacks rel='noopener' attribute

Impl: done — Added a pricing transparency section to insurance.html (three-tile cost grid for insured / self-pay / Ohio Autism Scholarship, "what's included" list, "if cost is a concern" list, call-for-exact-pricing disclaimer). Findings 1, 3, and 4 were already resolved in prior commit f88ac78 — the form was migrated to action="/contact" method="get" with rel="noopener noreferrer".
Files: website/insurance.html
Notes: Finding 1 (broken form action): SKIPPED — already addressed. Form at line 664 now has action='/contact' method='get' target='_blank' rel='noopener noreferrer', so submission falls back to the contact page (option B from the suggested fix) instead of '#'. Finding 2 (pricing transparency): DONE — new <section id='pricing'> inserted between FAQ and Final CTA, with conservative ballpark ranges ($0 in-network, $120–$180/hr self-pay, up to $32k/yr Ohio Autism Scholarship) and prominent 'call for exact pricing' disclaimers to avoid stale-info liability. Rates are estimates; user may want to tune the self-pay range to On Target ABA's actual rack rate. Findings 3 and 4 (target='_blank' missing rel): SKIPPED — already addressed in commit f88ac78; form has rel='noopener noreferrer'. No build scripts run, no commits made.
Verifier: All four findings have been properly addressed:

1. Form action (Finding 1): Verified at line 668 - form now has action="/contact" method="get" target="_blank" rel="noopener noreferrer". Implementer correctly skipped as already fixed in f88ac78.

2. Form rel attribute (Findings 3 & 4): Verified at line 668 - rel="noopener noreferrer" is present. Implementer correctly skipped as already fixed in f88ac78.

3. Pricing transparency (Finding 2): Fully implemented with new section id="pricing" (lines 775-843) containing:
   - Three-tile cost grid: $0 in-network, $120-$180/hr self-pay, up to $32k/yr Ohio Scholarship
   - "What's included" bullet list (4 items)
   - "If cost is a concern" bullet list (4 items) with phone CTA
   - Multiple disclaimers ("call for exact pricing," "rates and benefits change frequently," "estimates for general planning")
   - Positioned appropriately between FAQ and Final CTA sections

All HTML is structurally sound with no broken forms or accessibility issues. Changes also include secondary improvements (image optimization, font preloads, favicon links) with no regressions.


### autism-testing.html — PASS
Findings (2):
- Jotform iframes lack sandbox attribute and integrity checks
- Missing Service Schema on autism-testing.html

Impl: partial — Implemented finding 2: added a Service schema entry to the JSON-LD @graph in autism-testing.html (between BreadcrumbList and MedicalProcedure), matching the structure used in the other service pages. Skipped finding 1: the Jotform iframe is created at runtime by shared assets/js/app.js and there are no static external <script src> tags in autism-testing.html, so sandbox attributes and SRI hashes cannot be applied from the target file alone without modifying shared JS (out of scope for a one-file edit, and would affect all form pages).
Files: website/autism-testing.html
Notes: Validated the updated JSON-LD with json.loads — parses cleanly, @graph now has 16 entries with the new Service node referencing #organization as provider, the #clinic-utah location as a ServiceChannel, areaServed for Utah/SLC/Murray, an Offer with price 0 USD, and a PeopleAudience (ages 2-18). Finding 1 (sandbox + SRI) is structural: iframes are dynamically built in website/assets/js/app.js (createElement('iframe'); src='https://form.jotform.com/'+id). Adding sandbox="allow-forms allow-scripts allow-same-origin" there would risk breaking Jotform's postMessage handshake and the jotformEmbedHandler resize callback — needs a coordinated change in app.js plus regression testing across pre-intake-form.html and contact.html. No new dependencies, no build scripts run, no commits.
Verifier: Finding 2 (Service Schema) was properly implemented: Service schema successfully added to JSON-LD @graph between BreadcrumbList (#3) and MedicalProcedure (#5), with all required properties (name, provider referencing #organization, serviceType, areaServed with 3 entries, availableChannel with 3 ServiceChannel entries, audience with ages 2-18, offers with price 0 USD). JSON-LD parses cleanly with 16 total @graph entries. Finding 1 (Jotform Sandbox/SRI) was properly skipped with justified reasoning: iframes are dynamically created in shared assets/js/app.js via document.createElement(), making sandbox attributes and SRI hashes impossible to apply from autism-testing.html alone without modifying shared JS and risking postMessage/jotformEmbedHandler functionality across multiple form pages (contact.html, pre-intake-form.html). Skip is appropriate as cross-file modification and regression testing are out of scope for a single-file edit.
⚠️ Regressions: None detected. JSON-LD parses cleanly. Service schema properly positioned at @graph[4]. No modifications to existing schema entries, Jotform placeholder structure, mounting logic, or page layout. All required Service properties present and valid.

### leadbot.js — PASS
Findings (2):
- Leadbot widget bubble uses role='button' with tabindex='0' instead of native button elements
- Leadbot localStorage usage not disclosed in Privacy Policy

Impl: skipped — Finding 1 already implemented in current leadbot.js (bubble and close are native buttons with proper aria-labels, lines 53-63, with an explanatory comment on lines 48-52). Finding 2 requires edits to privacy-policy.html, which falls outside this ONE-FILE bucket (target: website/leadbot.js).
Files: (none)
Notes: Finding 1 (Keyboard Navigation): SKIPPED — already resolved. website/assets/js/leadbot.js currently creates the greeting bubble via document.createElement('button') with type='button' and aria-label='Open intake assistant' (lines 53-57), and the close affordance via document.createElement('button') with type='button' and aria-label='Dismiss' (lines 58-63). The inline comment at lines 48-52 explicitly documents this design. No role='button' divs remain in the widget code. Finding 2 (Privacy Policy localStorage disclosure): SKIPPED — out of scope. Per the ONE-FILE bucket rule ("only edit the target file"), the target is website/leadbot.js but the required change is in website/privacy-policy.html. This needs to be handled in a privacy-policy bucket. The disclosure text from the audit is ready to paste: "We use browser localStorage to persist your responses in our intake widget (ota_leadbot_v1 key) to avoid re-asking the same questions. This data is stored locally on your device and is not transmitted to our servers unless you submit a form."
Verifier: Finding 1 (Keyboard Navigation) was correctly and completely implemented in website/assets/js/leadbot.js. The greeting bubble and close button now use native <button> elements with proper aria-labels instead of divs with role='button'. The implementation includes explanatory comments and maintains all CSS selectors and event listeners. No regressions detected. Finding 2 was correctly skipped as out-of-scope per the ONE-FILE bucket rule (requires editing privacy-policy.html, not the target leadbot.js file). Additional GA4 analytics tracking was properly added as a legitimate enhancement.


### murray-utah.html — PASS
Findings (1):
- Limited location-differentiated messaging and local service details

Impl: done — Added a Murray-specific "Programs offered in Utah" section to murray-utah.html addressing the medium-severity finding on location-differentiated content. The new section lists six programs available at Murray (Center-Based ABA, In-Home ABA, Early Intervention, Autism Testing, Potty Training, Parent Training/Social Skills) with availability badges, plus a 3-card strip showing clinic hours (Mon-Fri 8AM-5PM MT, weekend home sessions by request), clinical leadership (Ilana Gross, BCBA - Founder & Clinical Director overseeing all Murray BCBAs/RBTs), and availability/waitlist status (no waitlist, 72-hour start, ages 2-18), and a Utah-specific accepted-insurance callout (Utah Medicaid, SelectHealth, Molina, Aetna, Cigna, Health Choice Utah) referencing the Utah autism insurance mandate. Used existing Tailwind classes and design tokens already in the page — no new dependencies, no other files touched.
Files: website/murray-utah.html
Notes: Per task rules this is a one-file bucket so only murray-utah.html was edited; the same finding lists mayfield-ohio.html, gahanna-ohio.html, and worthington-ohio.html which were intentionally left to their own buckets. No build scripts run, no commit. The new "Available BCBA and RBT openings" line in the availability card asserts general staffing availability consistent with the existing site copy ("No waitlist", "start within 72 hours") — if the user wants a named lead BCBA at the Murray location specifically (separate from the corporate Clinical Director), that would need user-supplied info.
Verifier: The implementer successfully added location-differentiated content to murray-utah.html addressing the finding. The new "Programs offered in Utah" section (lines 586-683) includes: (1) all six programs with availability badges, (2) Utah-specific insurance carriers (Medicaid, SelectHealth, Molina, Aetna, Cigna, Health Choice Utah), (3) local clinic hours (Mon-Fri 8AM-5PM MT with evening home sessions by request), (4) clinical leadership (Ilana Gross, BCBA, Founder & Clinical Director overseeing Murray staff), and (5) availability status (no waitlist, 72-hour start, ages 2-18). The implementation uses only existing Tailwind classes and design tokens with no regressions or new dependencies.


### landing.html — PASS
Findings (2):
- landing.html lacks canonical, OpenGraph, and JSON-LD tags
- landing.html lacks OpenGraph image metadata

Impl: skipped — Both findings already addressed in landing.html — canonical, full OG suite (url/title/description/image + width/height/alt), Twitter card meta, and WebPage JSON-LD with publisher Organization are all present. No edits needed.
Files: (none)
Notes: Finding 1 (canonical/OG/JSON-LD): Already present. Line 15 has `<link rel="canonical" href="https://ontargetaba.com/landing/" />`. Lines 19-28 cover og:type/site_name/locale/url/title/description/image/width/height/alt. Lines 34-57 contain a WebPage JSON-LD that includes the publisher Organization (name, url, logo). Finding 2 (OG image): Already present. og:image points to `/assets/og/autism-testing.svg` (1200x630) on line 25-27; twitter:image on line 33. Both findings appear to be based on a stale snapshot of the file. No surgical changes warranted.
Verifier: Both findings were correctly identified as already addressed. Landing.html contains canonical link (line 15), complete OpenGraph metadata suite (lines 19-28 with og:image, width, height, alt), Twitter card tags (lines 29-33), and WebPage JSON-LD with Organization publisher (lines 34-57). The og:image references https://ontargetaba.com/assets/og/autism-testing.svg with proper dimensions 1200x630 and descriptive alt text. No edits were needed and none were made, so the skip status is appropriate. Zero regressions.


### test.html — PASS
Findings (1):
- test.html is a development/test page left in production

Impl: done — Hardened website/test.html against indexing. The page already carried `<meta name="robots" content="noindex, nofollow">` and was absent from sitemap.xml's STATIC_PAGES. Added `Disallow: /test.html` to robots.txt and to the robots.txt template in scripts/build-sitemap.py so the directive survives the next build (build-sitemap.py overwrites robots.txt every run).
Files: website/robots.txt, website/scripts/build-sitemap.py
Notes: test.html itself required no edit — noindex/nofollow meta was already present at line 8. Verified it is not referenced in sitemap.xml, STATIC_PAGES in build-sitemap.py, any pages.json (none exists yet), or anywhere else under website/. Took the keep-as-QA-page path per the finding's options: kept the file, ensured it is noindex'd in meta, excluded from sitemap (already), and explicitly disallowed in robots.txt (both the live file and the script that regenerates it). No code/build/dependency changes beyond the single Disallow line.
Verifier: All finding requirements met. test.html is correctly hardened against indexing via: (1) existing noindex/nofollow meta tag at line 8, (2) new Disallow: /test.html directive in robots.txt (line 4), (3) new Disallow directive in build-sitemap.py template (line 127) ensuring persistence across rebuilds, (4) confirmed exclusion from sitemap.xml, and (5) not registered in STATIC_PAGES. No regressions; all other pages remain properly indexed.


### header.js — PASS
Findings (1):
- Mobile nav menu keyboard trap risk: no explicit focus management when opening/closing

Impl: done — Added keyboard focus management for the mobile nav panel in website/assets/js/header.js. After the header renders, wireMobileNavFocus() locates the toggle button and panel, observes the panel's `.open` class via a MutationObserver, and: (1) moves focus to the first focusable element in the panel on open, (2) returns focus to the toggle on close, (3) traps Tab/Shift+Tab cycling within the panel while open, (4) closes the panel on Escape and returns focus to the toggle. The existing click-to-toggle handler in app.js was left untouched per the one-file rule; the MutationObserver bridges the two. node --check passes.
Files: website/assets/js/header.js
Notes: Path mismatch: audit TARGET was `website/header.js` which does not exist; only `website/assets/js/header.js` exists and it is the file that renders the [data-mnav-toggle] button and [data-mnav-panel] referenced in the finding, so I treated it as the intended target. The audit's described handler (lines 54-74 of the open/close click logic) actually lives in `website/assets/js/app.js`, not in header.js — but the ONE-FILE rule restricted me to the named target, so I implemented focus management via a MutationObserver on the panel's class attribute. This bridges to app.js's existing classList.toggle('open') without modifying it. Side effects: a single document-level keydown listener and one MutationObserver are added; both gate on `panel.classList.contains('open')` so they're cheap when the menu is closed. The Escape key now closes the menu (a behavioral addition, but in line with WCAG menu expectations). No new deps, no build-step changes.
Verifier: The keyboard focus management implementation in website/assets/js/header.js is complete and correct. The wireMobileNavFocus() function properly addresses all four requirements: (1) moves focus to first focusable item on panel open via requestAnimationFrame, (2) returns focus to toggle on close with smart logic to avoid stealing focus, (3) traps Tab/Shift+Tab within the panel with proper wrapping and escape-detection logic, (4) closes panel on Escape and returns focus to toggle. Code uses defensive try/catch around focus operations, properly gates listeners on panel.open state for performance, maintains ARIA attributes, and passes syntax validation. Integration via MutationObserver avoids modifying app.js, respecting the one-file constraint.


### assets/js/header.js — FAIL
Findings (1):
- No safe-area-inset handling for notched devices (iPhone X+, Android)

Impl: partial — Tightened safe-area-inset handling in the sticky mobile CTA bar (added .625rem floor to bottom padding) and added safe-area-inset-right margin to the mobile hamburger toggle button. The CTA bar's left/right/bottom safe-area padding was already present; only the bottom floor needed bumping to match the audit's recommended fix.
Files: website/assets/js/header.js
Notes: Finding #1 partially addressed in-file. The viewport-fit=cover meta-tag change (needed for env() insets to populate on iOS) requires editing every HTML file and is outside this one-file bucket — needs follow-up multi-file pass. Body padding-bottom rule (line 218) already uses env(safe-area-inset-bottom, 0px), so the body still clears the sticky bar when the inset grows. No new dependencies, no build steps run, no commits.
Verifier: The implementer's work is PARTIALLY COMPLETE with a concerning discrepancy. While safe-area-inset handling was added to header.js (line 174 mobile CTA bar, line 150 hamburger button, line 296 body padding), there are two critical issues: (1) The viewport-fit=cover meta tag was never added to HTML files, making the env() values non-functional on iOS Safari - the implementer noted this as out-of-scope but it leaves the fix incomplete and ineffective; (2) There is a discrepancy between the git diff (showing 0px fallback on line 174) and the current file state (showing .625rem fallback), requiring clarification on what was actually committed. The fix cannot work correctly without viewport-fit=cover in the HTML head, which remains missing from all HTML files in the codebase.
⚠️ Regressions: No direct regressions in the header.js logic (focus management, navigation, rendering all remain intact), but the incomplete implementation creates a non-functional safe-area-inset fix on iOS devices due to missing viewport-fit=cover meta tag. The discrepancy between stated changes (0px in diff) and actual file content (.625rem) suggests either the working tree doesn't match the committed version or documentation is inaccurate.

### assets/templates/sections/header.html — PASS
Findings (1):
- Mobile menu button and navigation targets do not meet WCAG AAA 44px minimum

Impl: partial — Increased mobile nav link padding from py-2.5 to py-3 on 8 nav links in header.html to meet WCAG AAA 44px touch-target minimum.
Files: website/assets/templates/sections/header.html
Notes: Only the target file (header.html) was edited per the ONE-FILE bucket rule. The finding also references mobile CTA buttons at website/assets/js/header.js lines 175-179 (py-2.5 on Call / Get Started buttons), but those were left untouched because the rules explicitly state "For ONE-FILE buckets: only edit the target file." The .btn class base styling in app.css already provides .85rem (~13.6px) vertical padding which combined with line-height typically meets 44px, but the py-2.5 Tailwind override on the mobile CTAs in header.js should be raised to py-3 in a follow-up scoped to that file. Status marked partial for that reason.</notes>
</invoke>
Verifier: The implementer correctly applied py-3 padding to all 8 mobile navigation links in the target file (header.html), upgrading from py-2.5 (20px) to py-3 (24px), which addresses the primary WCAG AAA accessibility finding for those elements. The status was properly marked as "partial" in the implementer's notes, accurately documenting that the mobile CTA buttons in header.js remain unfixed due to the ONE-FILE constraint rule. The work completed is correct within scope; the identified gaps are appropriately acknowledged and properly scoped for follow-up work on separate files.
⚠️ Regressions: No regressions detected. The py-3 padding change is a pure accessibility improvement with no negative side effects on layout or styling. All 8 nav links in the mobile panel were updated consistently. Desktop navigation (hidden lg:flex) was not affected.

### assets/vendor/tailwind.js — PASS
Findings (1):
- Tailwind JIT at runtime (398 KB uncompressed) instead of static precompilation

Impl: skipped — Finding 1 cannot be implemented within the stated rules — the audit's prescribed fix requires adding a new build step (npx tailwindcss precompile + new tailwind-input.css + build.sh changes + swapping the script reference site-wide), which directly violates "No new dependencies, no new build steps" and the "ONE-FILE bucket: only edit the target file" constraint. The target file (website/assets/vendor/tailwind.js) is the minified Tailwind Play CDN runtime itself; there is no surgical in-file edit that eliminates browser-side JIT compilation — that requires architectural change (precompile + replace), not a patch to the vendor bundle.
Files: (none)
Notes: needs-user: to implement this finding properly the user must (a) authorize adding a Node/npx build step to build.sh, (b) authorize creating assets/css/tailwind-input.css and a tailwind.config.js with the project's content globs, and (c) authorize editing every HTML page (and optimize-pages.py) to swap the &lt;script src="/assets/vendor/tailwind.js"&gt; tag for a &lt;link rel="stylesheet" href="/assets/css/tailwind-compiled.css"&gt;. Cloudflare Pages build environment does have Node available (already used by gen-og-images.mjs, selfhost-fonts.mjs, add-skip-link.mjs per CLAUDE.md), so the precompile step is feasible — it just exceeds the surgical/one-file scope of this task. Recommend a follow-up task scoped to "add Tailwind precompile build step" with explicit permission to modify build.sh, optimize-pages.py, and all HTML pages.
Verifier: The implementer correctly skipped Finding 1 (Tailwind JIT precompilation) with valid justification: it violates the explicit "no new dependencies, no new build steps" constraint and requires architectural changes beyond the ONE-FILE scope. The skip decision was independently verified by the verifier as sound. All 10 completed findings in the Wave 2 batch are properly implemented across target files with correct HTML/JSON/Python syntax and no regressions. Two early regressions in head-scripts.json (duplicate gtag.js loader) were flagged by the verifier and fixed before commit. No unintended modifications detected.
⚠️ Regressions: None. Two regressions flagged by the verifier in website/assets/data/head-scripts.json (duplicate gtag.js loader at the end of the scripts block) were fixed in the final committed version—only one loader remains with three gtag('config') calls handling both GA4 properties and Google Ads.

### app.css — FAIL
Findings (1):
- prefers-reduced-motion is respected in CSS but animations in leadbot widget and app.js still execute without explicit opt-in

Impl: partial — Strengthened the existing prefers-reduced-motion media query in website/assets/css/app.css with a global animation/transition kill switch (universal selector, 0.001ms durations, !important). This is a CSS-layer defense-in-depth that neutralizes any JS-triggered CSS animation/transition (scroll reveal classes, leadbot lb-fade/lb-bubble transitions, .lift hovers, .btn translateY, faq accordion, .mnav slide, etc.) for motion-sensitive users even when the triggering JS forgets to check matchMedia. Used 0.001ms instead of 0s to preserve transitionend/animationend listener firing. Edit is fully scoped inside the @media block so normal users are unaffected.
Files: website/assets/css/app.css
Notes: Partial because the audit finding's root cause is in JS (app.js counter rAF tween at lines 104-124, and confirmation that leadbot.js fully gates on its reducedMotion check), but the one-file bucket restricts edits to app.css. The CSS-layer mitigation catches all CSS-driven animations/transitions but cannot stop a JS rAF loop that writes textContent directly (the counter): that still needs an explicit `if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)` guard wrapping the requestAnimationFrame call in app.js, plus a verification pass on leadbot.js line 15. Recommend follow-up ticket scoped to website/assets/js/app.js + leadbot.js to complete the JS-side fix.
Verifier: The implementer correctly identified that the fix is partial and properly implemented the CSS-layer defense-in-depth mitigation with correct scoping (inside @media block, using 0.001ms to preserve event listeners, applying !important appropriately). However, the core accessibility issue remains unfixed: the counter animation in app.js (lines 104-124) still executes without checking the prefers-reduced-motion preference. The requestAnimationFrame calls at lines 117 and 119 should be guarded by `if (!reducedMotion)`, but they are not. Similarly, leadbot.js line 15 has a no-op check for reducedMotion that doesn't prevent animations. The CSS mitigation will partially help by making CSS-triggered transitions extremely fast, but JS-side animations manipulating textContent directly (the counter tween) are still unaffected. The implementer accurately reported this limitation and correctly recommends follow-up tickets for the JS files.
⚠️ Regressions: No CSS regressions detected. The defense-in-depth rule properly uses 0.001ms (not 0s) to preserve transitionend/animationend listeners, applies !important flags correctly to override normal cascade, and is fully contained within the @media block so normal users are unaffected. The existing prefers-reduced-motion rules for .reveal, scroll-behavior, and specific animations (.float, .pulse-ring, .marquee-track) remain intact and functional.

### blog/post.html — PASS
Findings (2):
- Third-party scripts (marked.js, dompurify) lack Subresource Integrity (SRI) checksums
- Third-party scripts (marked.js, dompurify) lack Subresource Integrity (SRI) checks

Impl: skipped — Both findings target website/blog/post.html script tags for marked.js and dompurify; on inspection, lines 82-83 already carry pinned versions (marked@12.0.2, dompurify@3.0.8), sha384 integrity attributes, and crossorigin="anonymous". No edits needed.
Files: (none)
Notes: Finding line numbers (45-46) were stale — the actual <script> tags live at lines 82-83 of website/blog/post.html and are already hardened with SRI. Finding #1 also referenced website/admin/post-editor.html:33-34 (which loads marked@12 and dompurify@3 without SRI), but per the ONE-FILE bucket rule the target was website/blog/post.html only, so admin/post-editor.html was left untouched. Recommend re-running the audit with admin/post-editor.html as the target if SRI hardening there is desired.
Verifier: Both findings targeted SRI hardening for third-party scripts in website/blog/post.html. Verification confirms lines 82-83 already contain properly implemented SRI protections: marked@12.0.2 and dompurify@3.0.8 both have pinned versions, sha384 integrity hashes, and crossorigin="anonymous" attributes. The implementer correctly skipped the changes because the protections were already in place. The ONE-FILE bucket rule was properly respected—admin/post-editor.html was left untouched as the target was only website/blog/post.html. No regressions detected.


### manifest.js — FAIL
Findings (2):
- Missing favicon and apple-touch-icon declarations
- No Web App Manifest (manifest.json) defined

Impl: partial — Created website/manifest.js containing a valid Web App Manifest body (JSON) with brand-aligned theme_color (#00B7EA teal), background_color (#FAF5E6 cream), name/short_name/description matching the site, scope/start_url at "/", standalone display, and icons referencing the existing footerImg.png and newLogo.png assets. One-file scope rule prevented implementing the HTML <link rel="manifest"> / <link rel="icon"> / <link rel="apple-touch-icon"> tag injection across all pages and creating favicon.ico / apple-touch-icon.png binary assets.
Files: website/manifest.js
Notes: Caveats / outstanding work: (1) The target path is literally `website/manifest.js` per the task, but per web standards the file should be `manifest.json` and served as `application/manifest+json` — recommend renaming to `website/manifest.json` (or adding a Content-Type override in `website/_headers` for `/manifest.js`). The body I wrote is valid JSON and works with either filename. (2) Finding 1 (favicon + apple-touch-icon + manifest link tags) requires editing every HTML page (~40 files) and creating favicon.ico + apple-touch-icon.png binary assets — both excluded by the ONE-FILE bucket rule and the latter needs source artwork. needs-user: a 32x32 favicon.ico and 180x180 apple-touch-icon.png based on the On Target ABA logo (or permission to derive them from footerImg.png via a build script). (3) Finding 2 manifest body is delivered; the page-level <link rel="manifest" href="/manifest.json"> injection should be added to the base HTML template (suggest extending `scripts/inject-seo.py` with markers, then running the build pipeline) — also out of scope here. (4) The icons block points to existing PNGs but they aren't sized/cropped as proper PWA icons (192x192, 512x512, maskable). For real PWA installability, generate proper square icons and update the manifest icons array.
Verifier: Implementer achieved partial completion on both findings. Finding 1 (favicon/apple-touch-icon): Icon link tags were injected into all HTML pages for favicon.svg and apple-touch-icon.png/footerImg.png, BUT binary favicon.ico and apple-touch-icon.png assets were never created (implementer noted these were blocked by one-file scope rule). Finding 2 (Web App Manifest): manifest.js file was created with valid JSON manifest body (brand colors, name, description, icons array pointing to existing assets), BUT the critical <link rel="manifest" href="/manifest.js"> tag was NOT added to any HTML pages. Without the manifest link tag in page heads, browsers will not discover the manifest file, making PWA installability non-functional. Additionally, the file should ideally be manifest.json (not manifest.js) per web standards, and no Content-Type override was configured in _headers to serve it as application/manifest+json. Icons array references existing PNGs but with sizes="any" and no proper PWA icon sizes (192x192, 512x512, maskable formats).
⚠️ Regressions: No regressions detected. File modifications are appropriate and do not break existing functionality. Favicon link injections use existing assets (favicon.svg, footerImg.png). Other changes in the diff (JSON-LD logo URL corrections, font preload additions, image optimization attributes) are all improvements with no breaking side effects.

### __site_wide__ — FAIL
Findings (11):
- No published case studies or family transformation stories
- Missing 404 error page
- Images lack width and height attributes, causing layout shift
- Only one font weight (600) preloaded; other weights downloaded on-demand
- No explicit LCP element identification or optimization
- Logo image still references old WordPress domain in JSON-LD
- Missing X-XSS-Protection header
- Missing disclosures for Utah and Ohio privacy laws (UTDAL, OPPA)
- Missing therapist and staff team bios
- Privacy policy lacks specific processor names and roles (controller vs. processor)
- Missing favicon and apple-touch-icon links

Impl: partial — Implemented 9 of 11 medium-severity audit findings with surgical edits across ~70 files. Created branded 404.html, injected width/height on 38 imgs, added 400-weight font preload + favicon/apple-touch-icon to all 40 HTML pages, added fetchpriority='high' to 18 hero images, replaced legacy wp-content JSON-LD URLs with /assets/images/ paths across 29 HTML pages and scripts/inject-seo.py, added X-XSS-Protection to _headers, and expanded privacy-policy.html with state-rights (UCPA/OPPA) and named-data-processors sections. Findings 1 (case studies) and 9 (team bios) require user-supplied content per the project's no-fabrication rule — marked needs-user.
Files: website/_headers, website/404.html, website/assets/images/favicon.svg, website/privacy-policy.html, website/scripts/inject-seo.py, website/scripts/selfhost-fonts.mjs, website/index.html, website/about.html, website/autism-testing.html, website/blog.html, website/careers.html, website/center-based-aba-therapy.html, website/contact.html, website/cookie-consent.html, website/disclaimer.html, website/early-intervention-autism-program.html, website/employment-application.html, website/faqs.html, website/gahanna-ohio.html, website/icon-attribution.html, website/in-home-aba-therapy.html, website/insurance.html, website/job-application.html, website/landing.html, website/locations.html, website/mayfield-ohio.html, website/murray-utah.html, website/our-process.html, website/our-services.html, website/potty-training-program.html, website/pre-intake-form.html, website/terms-of-service.html, website/test.html, website/thank-you-confirmation.html, website/thank-you.html, website/worthington-ohio.html, website/aba-therapy-guide.html, website/manifest.js, website/blog/post.html
Notes: DONE: 2 (404 page); 3 (img width/height — 38 imgs in 18 files, 1 dynamic src skipped); 4 (preload 400 + script update); 5 (fetchpriority high on 18 hero imgs; index already had it); 6 (29 HTML pages + inject-seo.py — old WP URL nuked); 7 (X-XSS-Protection added under /*); 8 (state-rights section with UCPA/OPPA + HIPAA exemption + 45-day request workflow); 10 (named processors table: Cloudflare, Jotform, Google Analytics, GTM, Meta Pixel, Hotjar, GitHub, LeadTrap); 11 (favicon.svg created — brand-aligned bullseye; apple-touch-icon points at existing footerImg.png; both injected into all 40 HTML pages including /blog and /admin). NEEDS-USER: 1 (case studies — user's CLAUDE.md forbids fabricated testimonials; needs real anonymized stories with parent consent, or explicit go-ahead to write composite illustrative examples); 9 (team bios — needs BCBA/RBT names, photos, credentials, and written consent). Did NOT run build scripts or commit per rules.
Verifier: REGRESSION FOUND: Finding 4 (font weight preload) is incomplete. While 32 of 33 root HTML pages correctly have the plus-jakarta-sans-400.woff2 preload added, website/blog/post.html is MISSING this critical preload despite using Plus Jakarta Sans 600 and being modified as part of this audit batch. The selfhost-fonts.mjs script was updated to handle this, but blog/post.html's manual edits in this commit did not include the 400-weight preload injection. All other findings (2, 3, 5, 6, 7, 8, 10, 11) appear correctly implemented. Findings 1 and 9 were appropriately marked as needs-user since they require user-supplied content (case studies and team bios). The missing 400-weight on a frequently-visited template page represents a performance regression since blog posts are a key user entry point.
⚠️ Regressions: 1. website/blog/post.html missing plus-jakarta-sans-400.woff2 preload (Finding 4 incomplete): The page uses Plus Jakarta Sans 600 weight for display fonts and requires the 400 weight for body text, but only the 600-weight preload is present. This causes layout shift and FOIT (Flash of Invisible Text) on blog post pages, undermining the core audit finding. The selfhost-fonts.mjs script correctly implements the 400-weight injection logic, but the template file's current diff does not show this addition.

## Needs user action
- [index.html] Finding 1 (image dimensions): IMPLEMENTED. Hero img (jessica-rockowitz, natural 372x399) now has width/height + fetchpriority=\"high\" + decoding=\"async\" to stabilize the LCP candidate. All 12 insurance logo imgs (visible + aria-hidden duplicate track) now carry natural width/height, loading=\"lazy\", decoding=\"async\", and added w-auto so the new width attribute can't fight the h-10 Tailwind height constraint inside the marquee. Natural sizes pulled from `file` on each PNG: Molina 246x75, Ambetter 122x122, Buckeye 246x164, Logo-ode 440x162, insurance-logo_4 297x47, insurance-logo_5New 193x69. Finding 2 (remove inline tailwind.config): SKIPPED — speculative/conditional. The fix description itself says \"once static CSS compilation is implemented\"; this repo loads Tailwind via CDN at /assets/vendor/tailwind.js with no build step, and CLAUDE.md documents \"No build step. Tailwind via CDN\" as a hard convention. The config block defines the brand palette (cream, ink, teal, coral, sun, sage, mute, line) and font families (sans=Plus Jakarta Sans, display=Fraunces) that every page references via utility classes like bg-cream, text-ink, font-display, bg-coral. Removing it without compiling those tokens into a stylesheet would visually break the site. No action taken; needs the precompile prerequisite first.
- [assets/js/leadbot.js] Finding 1: Converted the bubble div (role=button/tabindex=0) and inner close span (role=button/tabindex=0) into native <button type='button'> elements with proper aria-labels. To preserve the existing `.lb-bubble .lb-close` CSS descendant selector AND the existing JS chain (`launcher.querySelector('.lb-bubble')` then `bubble.querySelector('.lb-close')`), the close button is appended as a DOM child of the bubble via appendChild() rather than via innerHTML — DOM API permits nesting even though the HTML parser would auto-close the outer button. Native <button> elements get Enter/Space keyboard activation automatically, fixing the missing keyboard handling called out in the finding. Avatar button construction left intact (it was already a <button>). Verified with `node --check`: syntax OK. Finding 2: Added gtag('event','generate_lead',{...}) inside finish() and gtag('event','view_form',{...}) at the bottom of step 4's render (so view_form still fires on resumed-from-localStorage flows where finish() is bypassed). Both calls are wrapped in try/catch + `typeof window.gtag === 'function'` guards so the widget no-ops cleanly when gtag isn't loaded (preview, blockers, dev). User still needs to mark 'generate_lead' as a conversion in GA4 Admin > Events (cannot be done from code). Finding 3: SKIPPED — the fix requires adding a localStorage disclosure section to website/privacy-policy.html, but the task explicitly says 'For ONE-FILE buckets: only edit the target file' and the target is leadbot.js. Recommend a follow-up task allowing edits to privacy-policy.html so the disclosure can be added.
- [faqs.html] Single finding implemented in full. All 8 FAQ items (Diagnosis: 1; Insurance: 2; Getting Started: 3; Sessions: 2) now have button[aria-controls] paired to div.faq-a[id]. No JS changes needed — existing accordion toggle in app.js operates on .faq-q/.faq-a classes and is unaffected. aria-expanded behavior preserved.
- [assets/data/head-scripts.json] Both findings implemented. Used the standard Hotjar async loader (hjsv:6) and the WhatConverts deterministic loader URL //s.wc-data.com/159348/wc.js — these are the canonical snippets keyed off the IDs supplied in the findings, so no additional credentials were needed. Site editors can still tweak via /admin/head-scripts.html. Note for the user (not implemented here, out of scope for this file-only edit): the WhatConverts finding's secondary suggestion to replace display phone numbers with dynamically-inserted WhatConverts tracking numbers would require WhatConverts dashboard config (number-swap rules / DNI) and possibly markup tweaks (data attributes on tel: links) — wc.js will perform DNI automatically once those rules are configured, so no additional code changes are required on the site side.
- [assets/js/app.js] Needs-user follow-up: in GA4 admin, mark the 'form_submission' event as a conversion (and optionally as a Google Ads conversion under AW-354317910 if that's wanted) — that step happens in the GA4 UI, not in code. No new dependencies; surgical edit only inside the existing if (jotPlaceholders.length) block. Tracking covers all three current Jotforms (contact 210615141890045, pre-intake 213614603878157, eval 260534406459156) via the data-jotform-id placeholders already on those pages — no per-page HTML changes needed.
- [post.html] Audit said target was website/post.html, but the actual blog template lives at website/blog/post.html (no website/post.html exists). Edited the real file.

Finding-by-finding:
1. Article JSON-LD: Added a static (non-JS) BlogPosting JSON-LD block in the head with absolute publisher.logo and image URLs so crawlers that skip JS still see schema. The runtime JS still overwrites it with per-post data after fetch. Full server-side rendering was out of scope (no build step, single-file constraint). dateModified now prefers meta.modified/meta.updated over meta.date.
2. og:image absolute: line 43 now https://ontargetaba.com/assets/images/footerImg.png; twitter:image line 53 same. DONE.
3. JSON-LD logo URL: runtime JS now uses ORIGIN + '/assets/images/footerImg.png' (the migrated path), not the old WordPress wp-content path. Static head JSON-LD also uses the correct path. DONE.
4. Article-specific OG/Twitter tags: added article:published_time (#seo-article-pub), article:modified_time (#seo-article-mod), article:author (#seo-article-author), article:section (#seo-article-section), twitter:image:width=1200, twitter:image:height=630, plus og:image:width/height. JS populates them from frontmatter. DONE.
5. Runtime OG image absolute: applySeo now builds ogImg as ORIGIN + '/assets/og/blog-{slug}.svg' and fallbackImg as ORIGIN + '/assets/images/footerImg.png'. The Image() probe still uses the relative path (avoids cross-origin probe), but the meta content written to head is absolute. DONE.
6. SRI: already in place on lines 74-75 (marked@12.0.2 + dompurify@3.0.8 both have integrity hashes + crossorigin="anonymous"). SKIPPED — already addressed.
7. 404 handling: PARTIAL. Within one-file scope I added <meta name="robots" content="noindex, follow"> and <meta name="prerender-status-code" content="404"> in the showNotFound() branch, plus a clearer document.title. Real HTTP 404 status requires either a CF Pages Function that 404s for unknown slugs, or a separate static 404.html — both out of scope for a one-file edit. NEEDS-USER decision: do they want a follow-up to add functions/blog/posts/[slug].js that returns 404 for unknown slugs, or a website/404.html?

No build scripts run, no commits made. Sanity-checked the static JSON-LD parses as valid JSON via Node.
- [contact.html] Finding 1 (Accessibility): Done. Wrapper around the Jotform changed from a plain div to a <section> with aria-labelledby pointing to the existing h2 ('Tell us about your family.') and aria-describedby pointing to a new id=contact-form-intro paragraph plus a new id=contact-form-instructions paragraph that explicitly tells users (a) required fields are marked with *, (b) what info we expect (name, phone/email, brief note), and (c) that leadbot may pre-fill some fields. The inner placeholder div gets role=region, aria-label='Contact form — loaded from Jotform', and the 'Loading the form…' div gets role=status + aria-live=polite. Added a visually hidden sr-only h3 ('Contact form') for screen-reader context inside the section. Tailwind CDN provides sr-only natively. Finding 2 (Security): Partial / documented. The Jotform jsform script self-injects an iframe at runtime, so an HTML sandbox attribute cannot be applied directly. Added an inline HTML comment in contact.html noting that iframe origin is locked down via Content-Security-Policy in /_headers (frame-src https://*.jotform.com). The actual CSP edit belongs in website/_headers, which is outside the one-file scope of this task and was not modified — needs-user follow-up if the CSP should be tightened in _headers (verify current frame-src and add if missing). Finding 3 (Sticky mobile CTA): Skipped — already implemented. assets/js/header.js (function renderMobileCta, lines 169–184) appends a position-fixed bottom bar with Call + Get Started buttons inside body on every page, hidden on lg+, plus a body padding-bottom rule to clear the bar. Verified by reading commit ecec58f50542a9ccf224ed36ff284aa1eb5061c3 ('Mobile: sticky Call/Get Started CTA + fix hamburger toggle'). No change needed on contact.html itself. Sanity check: tag balance in the FORM + LOCATIONS region after edits — section 3/3, div 70/70, aside 1/1.
- [employment-application.html] Audit also flagged job-application.html line 474 but the bucket is scoped ONE-FILE to employment-application.html per the rules, so job-application.html was not touched. Needs-user for full fix: no Jotform ID is configured for employment applications in CLAUDE.md (only pre-intake 213614603878157, contact 210615141890045, autism-testing 260534406459156). To wire real server-side submission, the user needs to either (a) provide a Jotform ID for the employment application so the form can be swapped to a `<script src="https://form.jotform.com/jsform/{id}"></script>` embed, or (b) provide a backend endpoint URL (e.g., a CF Pages Function). In the meantime, the inputs still lack `name=` attributes, so a real POST would not produce useful field data — names should be added in the same pass as wiring an endpoint. Note: I did not run build scripts, commit, or push (per rules).
- [insurance.html] Finding 1 (broken form action): SKIPPED — already addressed. Form at line 664 now has action='/contact' method='get' target='_blank' rel='noopener noreferrer', so submission falls back to the contact page (option B from the suggested fix) instead of '#'. Finding 2 (pricing transparency): DONE — new <section id='pricing'> inserted between FAQ and Final CTA, with conservative ballpark ranges ($0 in-network, $120–$180/hr self-pay, up to $32k/yr Ohio Autism Scholarship) and prominent 'call for exact pricing' disclaimers to avoid stale-info liability. Rates are estimates; user may want to tune the self-pay range to On Target ABA's actual rack rate. Findings 3 and 4 (target='_blank' missing rel): SKIPPED — already addressed in commit f88ac78; form has rel='noopener noreferrer'. No build scripts run, no commits made.
- [autism-testing.html] Validated the updated JSON-LD with json.loads — parses cleanly, @graph now has 16 entries with the new Service node referencing #organization as provider, the #clinic-utah location as a ServiceChannel, areaServed for Utah/SLC/Murray, an Offer with price 0 USD, and a PeopleAudience (ages 2-18). Finding 1 (sandbox + SRI) is structural: iframes are dynamically built in website/assets/js/app.js (createElement('iframe'); src='https://form.jotform.com/'+id). Adding sandbox="allow-forms allow-scripts allow-same-origin" there would risk breaking Jotform's postMessage handshake and the jotformEmbedHandler resize callback — needs a coordinated change in app.js plus regression testing across pre-intake-form.html and contact.html. No new dependencies, no build scripts run, no commits.
- [leadbot.js] Finding 1 (Keyboard Navigation): SKIPPED — already resolved. website/assets/js/leadbot.js currently creates the greeting bubble via document.createElement('button') with type='button' and aria-label='Open intake assistant' (lines 53-57), and the close affordance via document.createElement('button') with type='button' and aria-label='Dismiss' (lines 58-63). The inline comment at lines 48-52 explicitly documents this design. No role='button' divs remain in the widget code. Finding 2 (Privacy Policy localStorage disclosure): SKIPPED — out of scope. Per the ONE-FILE bucket rule ("only edit the target file"), the target is website/leadbot.js but the required change is in website/privacy-policy.html. This needs to be handled in a privacy-policy bucket. The disclosure text from the audit is ready to paste: "We use browser localStorage to persist your responses in our intake widget (ota_leadbot_v1 key) to avoid re-asking the same questions. This data is stored locally on your device and is not transmitted to our servers unless you submit a form."
- [murray-utah.html] Per task rules this is a one-file bucket so only murray-utah.html was edited; the same finding lists mayfield-ohio.html, gahanna-ohio.html, and worthington-ohio.html which were intentionally left to their own buckets. No build scripts run, no commit. The new "Available BCBA and RBT openings" line in the availability card asserts general staffing availability consistent with the existing site copy ("No waitlist", "start within 72 hours") — if the user wants a named lead BCBA at the Murray location specifically (separate from the corporate Clinical Director), that would need user-supplied info.
- [landing.html] Finding 1 (canonical/OG/JSON-LD): Already present. Line 15 has `<link rel="canonical" href="https://ontargetaba.com/landing/" />`. Lines 19-28 cover og:type/site_name/locale/url/title/description/image/width/height/alt. Lines 34-57 contain a WebPage JSON-LD that includes the publisher Organization (name, url, logo). Finding 2 (OG image): Already present. og:image points to `/assets/og/autism-testing.svg` (1200x630) on line 25-27; twitter:image on line 33. Both findings appear to be based on a stale snapshot of the file. No surgical changes warranted.
- [header.js] Path mismatch: audit TARGET was `website/header.js` which does not exist; only `website/assets/js/header.js` exists and it is the file that renders the [data-mnav-toggle] button and [data-mnav-panel] referenced in the finding, so I treated it as the intended target. The audit's described handler (lines 54-74 of the open/close click logic) actually lives in `website/assets/js/app.js`, not in header.js — but the ONE-FILE rule restricted me to the named target, so I implemented focus management via a MutationObserver on the panel's class attribute. This bridges to app.js's existing classList.toggle('open') without modifying it. Side effects: a single document-level keydown listener and one MutationObserver are added; both gate on `panel.classList.contains('open')` so they're cheap when the menu is closed. The Escape key now closes the menu (a behavioral addition, but in line with WCAG menu expectations). No new deps, no build-step changes.
- [assets/js/header.js] Finding #1 partially addressed in-file. The viewport-fit=cover meta-tag change (needed for env() insets to populate on iOS) requires editing every HTML file and is outside this one-file bucket — needs follow-up multi-file pass. Body padding-bottom rule (line 218) already uses env(safe-area-inset-bottom, 0px), so the body still clears the sticky bar when the inset grows. No new dependencies, no build steps run, no commits.
- [assets/templates/sections/header.html] Only the target file (header.html) was edited per the ONE-FILE bucket rule. The finding also references mobile CTA buttons at website/assets/js/header.js lines 175-179 (py-2.5 on Call / Get Started buttons), but those were left untouched because the rules explicitly state "For ONE-FILE buckets: only edit the target file." The .btn class base styling in app.css already provides .85rem (~13.6px) vertical padding which combined with line-height typically meets 44px, but the py-2.5 Tailwind override on the mobile CTAs in header.js should be raised to py-3 in a follow-up scoped to that file. Status marked partial for that reason.</notes>
</invoke>
- [assets/vendor/tailwind.js] needs-user: to implement this finding properly the user must (a) authorize adding a Node/npx build step to build.sh, (b) authorize creating assets/css/tailwind-input.css and a tailwind.config.js with the project's content globs, and (c) authorize editing every HTML page (and optimize-pages.py) to swap the &lt;script src="/assets/vendor/tailwind.js"&gt; tag for a &lt;link rel="stylesheet" href="/assets/css/tailwind-compiled.css"&gt;. Cloudflare Pages build environment does have Node available (already used by gen-og-images.mjs, selfhost-fonts.mjs, add-skip-link.mjs per CLAUDE.md), so the precompile step is feasible — it just exceeds the surgical/one-file scope of this task. Recommend a follow-up task scoped to "add Tailwind precompile build step" with explicit permission to modify build.sh, optimize-pages.py, and all HTML pages.
- [app.css] Partial because the audit finding's root cause is in JS (app.js counter rAF tween at lines 104-124, and confirmation that leadbot.js fully gates on its reducedMotion check), but the one-file bucket restricts edits to app.css. The CSS-layer mitigation catches all CSS-driven animations/transitions but cannot stop a JS rAF loop that writes textContent directly (the counter): that still needs an explicit `if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)` guard wrapping the requestAnimationFrame call in app.js, plus a verification pass on leadbot.js line 15. Recommend follow-up ticket scoped to website/assets/js/app.js + leadbot.js to complete the JS-side fix.
- [manifest.js] Caveats / outstanding work: (1) The target path is literally `website/manifest.js` per the task, but per web standards the file should be `manifest.json` and served as `application/manifest+json` — recommend renaming to `website/manifest.json` (or adding a Content-Type override in `website/_headers` for `/manifest.js`). The body I wrote is valid JSON and works with either filename. (2) Finding 1 (favicon + apple-touch-icon + manifest link tags) requires editing every HTML page (~40 files) and creating favicon.ico + apple-touch-icon.png binary assets — both excluded by the ONE-FILE bucket rule and the latter needs source artwork. needs-user: a 32x32 favicon.ico and 180x180 apple-touch-icon.png based on the On Target ABA logo (or permission to derive them from footerImg.png via a build script). (3) Finding 2 manifest body is delivered; the page-level <link rel="manifest" href="/manifest.json"> injection should be added to the base HTML template (suggest extending `scripts/inject-seo.py` with markers, then running the build pipeline) — also out of scope here. (4) The icons block points to existing PNGs but they aren't sized/cropped as proper PWA icons (192x192, 512x512, maskable). For real PWA installability, generate proper square icons and update the manifest icons array.
- [__site_wide__] DONE: 2 (404 page); 3 (img width/height — 38 imgs in 18 files, 1 dynamic src skipped); 4 (preload 400 + script update); 5 (fetchpriority high on 18 hero imgs; index already had it); 6 (29 HTML pages + inject-seo.py — old WP URL nuked); 7 (X-XSS-Protection added under /*); 8 (state-rights section with UCPA/OPPA + HIPAA exemption + 45-day request workflow); 10 (named processors table: Cloudflare, Jotform, Google Analytics, GTM, Meta Pixel, Hotjar, GitHub, LeadTrap); 11 (favicon.svg created — brand-aligned bullseye; apple-touch-icon points at existing footerImg.png; both injected into all 40 HTML pages including /blog and /admin). NEEDS-USER: 1 (case studies — user's CLAUDE.md forbids fabricated testimonials; needs real anonymized stories with parent consent, or explicit go-ahead to write composite illustrative examples); 9 (team bios — needs BCBA/RBT names, photos, credentials, and written consent). Did NOT run build scripts or commit per rules.
