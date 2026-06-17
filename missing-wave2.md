# HIGH Severity Implementation — Wave 2

## Stats
- Total HIGH findings parsed: 34
- Findings dispatched to agents: 34
- Buckets: 14 (13 file-scoped + 1 site-wide)
- Implementer status: 10 done / 2 partial / 2 skipped
- Verifier passes: 12
- Verifier fails: 2
- Unique files changed: 38

## Files changed
- website/_headers
- website/aba-therapy-guide.html
- website/about.html
- website/assets/data/head-scripts.json
- website/assets/js/header.js
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
- website/mayfield-ohio.html
- website/murray-utah.html
- website/our-process.html
- website/our-services.html
- website/potty-training-program.html
- website/pre-intake-form.html
- website/privacy-policy.html
- website/scripts/inject-seo.py
- website/sitemap.xml
- website/terms-of-service.html
- website/test.html
- website/thank-you-confirmation.html
- website/thank-you.html
- website/worthington-ohio.html

## Per-bucket detail

### job-application.html — PASS

Findings (1):
- Job application form also lacks label associations

Implementer: done — Added unique id attributes (ja-* namespace) plus matching for attributes to every form control wrapper label in job-application.html. All 25 inputs/selects/textareas/checkboxes now have explicit label associations. Also added name and where applicable autocomplete attributes (given-name, family-name, email, tel, street-address, address-level2) for better form semantics and browser autofill, without changing visual structure or behavior.
Files: website/job-application.html
Notes: Note: employment-application.html still uses implicit-only label wrapping (no explicit for/id pairs) — the finding text references it as the model fix, but that file actually has not been similarly hardened. The pattern applied here (wrapping label retained, plus explicit `for`/`id` for redundant association + name + autocomplete) is the standard a11y-best-practice approach. If employment-application.html should be brought to parity, that's a separate target file.

Verifier: The job application form accessibility fix has been properly implemented. All 25 form controls now have explicit label associations via unique id attributes (ja-* namespace) and corresponding for attributes on labels. Name and appropriate autocomplete attributes have been added. HTML structure is valid with no regressions. The implementation addresses the finding completely and follows accessibility best practices.


### admin/head-scripts.html — FAIL

Findings (1):
- Head-scripts admin page is ready but unconfigured

Implementer: skipped — Finding requires editing a different file and user-supplied tracking IDs/snippets — no changes made to head-scripts.html.
Files: (none)
Notes: Skipped — two blockers:

1. **Wrong file for the fix.** The target file `website/admin/head-scripts.html` is the admin UI, and it's already production-ready: it loads `/api/head-scripts`, renders the textarea, lists the legacy IDs in the Quick Reference card (lines 93-104), and PRs changes. The actual fix (pasting GA4/Ads/Facebook/Hotjar/WhatConverts snippets) would write to `website/assets/data/head-scripts.json` via the admin save flow — a different file, which the ONE-FILE rule prohibits touching here.

2. **Needs user-supplied credentials.** Even if scope allowed editing the JSON, populating it requires data this agent can't generate:
   - Two GA4 measurement IDs are noted as "partial" in the existing doc (`G-PHLC29WGVN`, `G-D3RBZZ5WPL`) — need confirmation they're complete.
   - Facebook Pixel ID is unknown — the doc says "copy from PixelYourSite settings in the WP admin."
   - WhatConverts snippet must be copied from account 159348's dashboard.
   - Google Ads tag `AW-354317910` is known but pasting just the ID without the full gtag snippet shape isn't useful.

   Faking IDs would silently break tracking; the rules say don't fake secrets.

**Recommended next step (for a human):** Log into https://beta.ontargetaba.com/admin/head-scripts.html and paste the real snippets from each vendor dashboard. The admin page already documents what's needed — no code change required.

Verifier: The implementer reported "skipped" but actually modified website/assets/data/head-scripts.json (empty "" → populated with GA4 and Google Ads scripts). This contradicts their stated decision. Additionally, the implementation is incomplete: only GA4 (G-PHLC29WGVN, G-D3RBZZ5WPL) and Google Ads (AW-354317910) scripts are present. Missing are Facebook Pixel ID, Hotjar (site ID 5016360 was documented in Quick Reference but not added), and WhatConverts (account 159348 snippet not added). The finding requirements called for all five: GA4, Ads, Facebook, Hotjar, and WhatConverts. The target file website/admin/head-scripts.html was correctly left unchanged (it's the UI that loads/displays the JSON content). The JSON structure is syntactically valid, but implementation is only ~40% complete and contradicts the implementer's own report.
⚠️ Regressions: No syntax errors or broken HTML/JSON detected. The head-scripts.html file remains properly formed and functional.

### assets/data/head-scripts.json — FAIL

Findings (3):
- Google Analytics 4 not installed
- Google Ads conversion tracking not installed
- Facebook Pixel not installed

Implementer: partial — Added Google Analytics 4 (G-PHLC29WGVN + G-D3RBZZ5WPL) and Google Ads (AW-354317910) tags to website/assets/data/head-scripts.json. Facebook Pixel skipped — requires real Pixel ID from user.
Files: website/assets/data/head-scripts.json
Notes: Findings 1 & 2 (GA4 + Google Ads) implemented. JSON validated; renders well-formed HTML. The single gtag.js loader handles both GA4 properties and the Ads config via three gtag('config', ...) calls, plus a second loader for AW-354317910 per the finding's literal instructions. optimize-pages.py will inject this verbatim into every page's <head> on next build.\n\nFinding 3 (Facebook Pixel) SKIPPED — needs-user: the finding text says 'Replace YOUR_PIXEL_ID with the actual ID' and the audit itself flags it as unknown. The legacy site used PixelYourSite WP plugin; the actual numeric Pixel ID was not provided. I did not invent one — embedding the snippet with the placeholder 'YOUR_PIXEL_ID' would 404 against connect.facebook.net and pollute console errors on every page. User should retrieve the Pixel ID from Facebook Ads Manager (Events Manager → Data Sources) or the legacy WP PixelYourSite settings, then paste the snippet via /admin/head-scripts.html (append to the existing scripts string).

Verifier: Findings 1 & 2 (GA4 and Google Ads) are implemented and functional, with correct property/conversion IDs added. Finding 3 (Facebook Pixel) is appropriately skipped with valid justification. However, there is a **critical regression**: the gtag.js library is loaded twice (once with id=G-PHLC29WGVN and again with id=AW-354317910). The first loader is sufficient to handle both GA4 properties and the Ads conversion ID via the three gtag('config') calls in the script block. The second loader at the end is redundant, will cause duplicate initialization, and may generate browser console errors. This is a technical defect that will cause issues in production.
⚠️ Regressions: gtag.js loaded twice: First at https://www.googletagmanager.com/gtag/js?id=G-PHLC29WGVN (correct and necessary) and again at https://www.googletagmanager.com/gtag/js?id=AW-354317910 (redundant). The Google Ads conversion ID (AW-354317910) is already properly configured via gtag('config', 'AW-354317910') in the first script block, so a second loader is unnecessary and will cause duplicate initialization warnings in browser console and potential race conditions. File: website/assets/data/head-scripts.json, line 4 in the JSON (the final script tag should be removed).

### insurance.html — PASS

Findings (3):
- Insurance verification form has no action endpoint
- Insurance form with target='_blank' lacks rel='noopener' attribute
- Form with target='_blank' missing rel='noopener'

Implementer: done — Updated the insurance verification <form> on website/insurance.html to fix all three findings in one surgical edit: replaced action="#" with action="/contact" (routes prospective leads to the existing contact intake page that hosts the real Jotform-backed insurance team form, rather than inventing a non-existent /api/insurance endpoint), added rel="noopener noreferrer" to remove the reverse-tabnabbing window.opener vulnerability associated with target="_blank", and made the submission method explicit with method="get".
Files: website/insurance.html
Notes: Finding 1 (no action endpoint): The site uses Jotform embeds (not /api/* endpoints) for real submissions per CLAUDE.md. The user has not supplied an insurance-specific Jotform ID, so I did NOT swap in a Jotform iframe — that would require a real form ID (needs-user if they want a true intake form here). Instead I pointed action to /contact, the page that already hosts the real Jotform-backed insurance/contact intake (form ID 210615141890045). This is a minimal, non-fabricated, non-breaking change that gives the form a legitimate destination instead of action='#'. If the user wants a dedicated insurance Jotform embed on insurance.html instead, they need to provide the Jotform ID. Findings 2 & 3 (target='_blank' missing rel='noopener'): Fully addressed by adding rel='noopener noreferrer' to the form element.

Verifier: All three findings were successfully addressed. Finding 1: action attribute changed from "#" to "/contact" (valid endpoint). Findings 2 & 3: rel="noopener noreferrer" attribute added to form element to eliminate reverse-tabnabbing vulnerability. Form syntax is correct, all elements properly nested, no regressions detected.


### privacy-policy.html — PASS

Findings (1):
- Privacy policy contains placeholder email addresses

Implementer: done — Replaced both placeholder '[email protected]' occurrences in privacy-policy.html (the inline paragraph and the contact card) with 'privacy@ontargetaba.com', wired as mailto links so users have a working contact path for privacy requests as required by GDPR/CCPA.
Files: website/privacy-policy.html
Notes: Used 'privacy@ontargetaba.com' as a standard privacy-contact alias since no existing alias was found in the repo. If the business prefers a different inbox (e.g., nate.karr@ontargetaba.com or info@ontargetaba.com), swap the two strings on lines 664 and 670 — the alias needs to be live at the mail provider for the page's mailto links to deliver. Out of scope for this one-file bucket: 'website/icon-attribution.html:531' has the same '[email protected]' placeholder and should be addressed in a separate pass.

Verifier: Both placeholder email addresses have been successfully replaced with privacy@ontargetaba.com on lines 664 and 670. Both are properly configured as working mailto links. HTML syntax is valid, all tags are properly closed, and no important code was removed. The change fully addresses the finding requirement to provide working contact paths for privacy requests.


### assets/js/header.js — PASS

Findings (1):
- No safe-area-inset handling for notched devices (iPhone X+, Android)

Implementer: done — Added safe-area-inset handling to the sticky mobile CTA bar in header.js. The bar now uses env(safe-area-inset-bottom/left/right) so it stays clear of home indicators and curved-edge / landscape notches, and the body padding-bottom rule expands by the same inset.
Files: website/assets/js/header.js
Notes: Implemented within the one-file scope:\n- renderMobileCta() now sets inline style padding-bottom: max(env(safe-area-inset-bottom), 0px) plus padding-left/right: env(safe-area-inset-*). Used inline style instead of Tailwind arbitrary utilities because env() inside arbitrary values requires a Tailwind safelist/build step, which this no-build site doesn't have.\n- Body padding-bottom rule (mobile-only) changed from a flat 68px to calc(68px + env(safe-area-inset-bottom, 0px)) so the home-indicator area is also cleared.\n\nSkipped (out of scope for ONE-FILE bucket):\n- Adding viewport-fit=cover to the viewport meta tag. This would require editing every HTML page (the project has dozens) plus the page-template scaffolding under scripts/. Without viewport-fit=cover, browsers in landscape/notched layouts may not extend the layout into the safe-area, in which case the env() values resolve to 0 and the bar still renders correctly (no regression). Recommend a follow-up bucket that touches HTML files / scripts/inject-seo.py or a new selfhost-* style script to add viewport-fit=cover site-wide.\n- The mobile nav hamburger button (line 150) is inline-grid inside the sticky header, not fixed-positioned, so it sits in the normal max-w-7xl px-5 container and doesn't need its own safe-area handling. Left untouched to keep the edit surgical.

Verifier: The implementer successfully addressed the safe-area-inset finding within scope. The renderMobileCta() function (lines 173-174) correctly uses inline styles with env(safe-area-inset-bottom/left/right) with proper fallbacks. The body padding-bottom rule (line 218) was correctly updated to calc(68px + env(safe-area-inset-bottom, 0px)) and is injected only on mobile via media query. The skip of viewport-fit=cover is properly justified as out-of-scope for a single-file edit. No syntax errors or regressions detected.


### _headers — PASS

Findings (2):
- Missing Content-Security-Policy (CSP) Header
- Missing Content-Security-Policy (CSP) header on all public pages

Implementer: done — Added Content-Security-Policy headers to website/_headers for both the public `/*` block and the `/admin/*` block. The policy is calibrated to actual third-party usage observed in the codebase (Jotform form.jotform.com + cdn.jotfor.ms, LeadTrap app.leadtrap.ai, jsdelivr for marked/dompurify, Google Maps iframes on location pages, plus GTM/GA4/FB Pixel/Hotjar hosts the /admin head-scripts injector pastes). Both findings 1 and 2 are duplicates of the same underlying gap and are resolved by this single edit.
Files: website/_headers
Notes: Deviated from the literal example CSP in the findings for two reasons: (1) the example omitted 'unsafe-inline' for script-src, which would have instantly broken every page — the codebase has heavy inline <script> usage (per-page tailwind.config, JSON-LD @graph blocks, hero animation IIFEs, page-overrides bootstrap). (2) the example omitted hosts that are actually loaded: LeadTrap (lead-bot widget), cdn.jotfor.ms (Jotform CDN), Google Maps iframes on location pages, and the analytics hosts (GTM/GA4/Hotjar/FB) the admin can inject. Also added 'unsafe-eval' because tailwind.js runtime CDN compiles class names at runtime (needed even though it's self-hosted at /assets/vendor/tailwind.js). Added frame-ancestors 'none' on /admin (clickjacking) and 'self' on public. Did not switch to CSP-Report-Only — the brief was to add a real CSP. Recommend monitoring the deployed site for unexpected console violations and tightening (drop 'unsafe-inline' via nonces) in a follow-up if desired.

Verifier: Both findings (missing CSP headers) have been properly addressed. CSP headers have been added to both the /admin/* and /* blocks with comprehensive directives covering all observed third-party hosts (Jotform, LeadTrap, analytics services, CDNs). The policies are properly calibrated to actual codebase usage with justified deviations from example templates ('unsafe-inline' and 'unsafe-eval' are necessary for the heavy inline script usage and Tailwind runtime). Additional security headers (HSTS, X-Frame-Options improvements) were also added to public pages. Syntax is correct with proper formatting, no regressions, and clear documentation via comments explaining the rationale.


### index.html — PASS

Findings (1):
- JSON-LD logo URL points to old WordPress domain

Implementer: done — Replaced 6 stale `https://ontargetaba.com/wp-content/uploads/2022/04/footerImg.png` references inside JSON-LD `@graph` blocks (Organization `logo.url` + `image`, and four location `image` fields) with `https://ontargetaba.com/assets/images/footerImg.png`. Verified the asset exists at `website/assets/images/footerImg.png`, and confirmed zero remaining wp-content references in index.html.
Files: website/index.html
Notes: Bucket scope was a single file (website/index.html), so sibling pages (about.html, our-services.html, locations.html, autism-testing.html, contact.html, careers.html, blog/*.html, and any location pages) likely have the same stale URL and will need parallel fixes in their own buckets — out-of-scope here. The migrated asset path was inferred from `website/assets/images/footerImg.png` existing in the repo; if the production site serves assets under a different prefix this may need a follow-up tweak, but it matches how the rest of the codebase references the wordmark.

Verifier: All 6 JSON-LD logo URL references were correctly replaced from the old WordPress wp-content domain to the new assets path (https://ontargetaba.com/assets/images/footerImg.png). No old wp-content references remain in index.html. The asset file exists at the expected location. JSON-LD syntax is valid with no broken tags or regressions.


### sitemap.xml — PASS

Findings (1):
- Test page (test.html) indexed in sitemap and accessible from navigation

Implementer: done — Removed the public-facing test URL (https://ontargetaba.com/blog/posts/test) from website/sitemap.xml so crawlers can no longer discover it via the sitemap.
Files: website/sitemap.xml
Notes: The finding referenced 'test.html' but the actual sitemap entry at line 172 was '/blog/posts/test' (a blog post slug), not a test.html page. Removed that URL block (loc + lastmod + changefreq + priority). Bucket scope is one-file (sitemap.xml), so robots.txt disallow and noindex meta on the underlying blog post were not added here. Follow-ups for the orchestrator/user: (1) consider deleting or marking 'website/assets/blog/test.md' as draft so build-blog-index.py + build-sitemap.py don't re-emit the URL on the next deploy; (2) optionally add 'Disallow: /blog/posts/test' to robots.txt and/or add the post to a draft list. Did not run build scripts per instructions — build.sh on deploy will regenerate sitemap from index.json, so removing/draft-flagging the underlying .md is required for the fix to persist.

Verifier: The implementer successfully removed the test page URL from sitemap.xml. The file shows a clean removal of the `/blog/posts/test` URL block (6 lines deleted). Additionally, the test.html file now includes proper `noindex, nofollow` robots meta tags to prevent indexing. The underlying test.md file is already marked as draft and hidden. The XML syntax is valid with 189 URL entries and proper closing tags. The implementer correctly noted that robots.txt changes and build script behavior are outside the sitemap scope and documented these as follow-up items. No syntax errors or regressions detected.


### test.html — PASS

Findings (2):
- test.html is production-accessible and lacks noindex/nofollow protection
- test.html lacks noindex protection in production

Implementer: done — Added noindex,nofollow robots meta tag to website/test.html head to prevent search engine indexing of the test page.
Files: website/test.html
Notes: Both findings resolved with the same single edit: inserted `<meta name=\"robots\" content=\"noindex, nofollow\" />` immediately after the existing description meta tag in test.html head. Sitemap removal portion of finding #1/#2 is out of scope for this one-file bucket — sitemap.xml is regenerated at deploy time by scripts/build-sitemap.py, which would need to be updated to exclude test.html (or test.html should be deleted entirely). Recommend follow-up: either delete website/test.html or update scripts/build-sitemap.py to skip it. The noindex meta tag will protect crawlers from indexing the page in the meantime even if it remains in the sitemap.

Verifier: The implementer correctly addressed both findings: (1) Added <meta name="robots" content="noindex, nofollow" /> to line 8 of website/test.html head section with proper syntax, preventing search engine indexing, and (2) confirmed test.html is not in sitemap generation (verified in website/scripts/build-sitemap.py where STATIC_PAGES does not include "/test"). HTML syntax is valid with no regressions.


### landing.html — PASS

Findings (2):
- landing.html lacks canonical, OpenGraph, and JSON-LD tags
- landing.html missing canonical, og:, and twitter: meta tags

Implementer: done — Added canonical, OpenGraph, Twitter Card, and WebPage schema.org JSON-LD tags to website/landing.html head. Both findings were duplicates of the same gap and are resolved in a single insertion block. The existing noindex directive is preserved.
Files: website/landing.html
Notes: Tags inserted directly after the robots meta (lines 12-57), modeled on the SEO block in autism-testing.html for consistency. Used the existing assets/og/autism-testing.svg as the og:image (no landing-specific OG image exists; gen-og-images.mjs only generates for pages in the registry). Did NOT wrap in auto-seo-start/end markers because landing.html isn't in inject-seo.py's SITE_PAGES registry — that keeps the build script from clobbering these tags. JSON-LD intentionally minimal (WebPage + Organization publisher only) since the page is noindex; no breadcrumbs, no MedicalBusiness/LocalBusiness graph, no AggregateRating. Site-wide schema.org markup for the org already lives on indexable pages. If you later want gen-og-images.mjs to produce a landing.svg, that'd be a separate change to scripts/gen-og-images.mjs and is out of scope for a one-file edit.

Verifier: Both findings comprehensively addressed. Lines 12-57 of landing.html now contain: (1) canonical link to https://ontargetaba.com/landing/, (2) complete OpenGraph meta tags (og:type, og:url, og:title, og:description, og:image with dimensions and alt text, og:site_name, og:locale), (3) Twitter Card tags (twitter:card, twitter:site, twitter:title, twitter:description, twitter:image), and (4) properly structured JSON-LD WebPage schema with publisher Organization. The noindex directive is preserved. All tags use consistent, valid values. No syntax errors or missing closing tags detected.


### blog/post.html — PASS

Findings (1):
- Third-party scripts (marked.js, dompurify) lack Subresource Integrity (SRI) checksums

Implementer: done — Added Subresource Integrity (SHA-384) and crossorigin="anonymous" attributes to the marked.js and DOMPurify CDN script tags in website/blog/post.html. Also pinned marked from the floating "latest" tag to v12.0.2 (required for SRI to be meaningful — an unpinned URL can change content and break SRI). Hashes were computed locally from files fetched directly from cdn.jsdelivr.net and the marked v12 API (marked.setOptions / marked.parse) matches the existing usage in the file.
Files: website/blog/post.html
Notes: Scope: this run targeted only post.html per the ONE-FILE bucket rule. The finding also references admin/post-editor.html:33-34 with the same issue — that should be implemented in a separate pass against that file. Hashes used: marked@12.0.2 marked.min.js => sha384-/TQbtLCAerC3jgaim+N78RZSDYV7ryeoBCVqTuzRrFec2akfBkHS7ACQ3PQhvMVi; dompurify@3.0.8 purify.min.js => sha384-vdScihEZCfbPnBQf+lc7LgXUdJVYyhC3yWHUW5C5P5GpHRqVnaM6HJELJxT6IqwM. Both computed via openssl sha384 against the actual files served by cdn.jsdelivr.net.

Verifier: The implementer successfully addressed the SRI finding in website/blog/post.html. Both CDN scripts (marked.js and dompurify) now include integrity attributes with SHA-384 hashes and crossorigin="anonymous". The marked library was properly version-pinned from floating "latest" to v12.0.2, which is critical for SRI meaningfulness. HTML syntax is valid, code integration is intact, and no regressions were introduced. The changes match exactly what was specified in the expected fix.


### autism-testing.html — PASS

Findings (1):
- Jotform script embeds lack integrity verification

Implementer: skipped — Finding does not apply to autism-testing.html as described. The page has no static Jotform <script src=...> tag at line 1059 (that line is an HTML comment); the Jotform iframe is created dynamically by assets/js/app.js from a [data-jotform-id] placeholder. SRI/integrity cannot be applied to a dynamic iframe URL, and Jotform does not publish SRI hashes for their embed script. The recommended CSP-based mitigation already exists in website/_headers (script-src/frame-src/form-action restrict Jotform origins).
Files: (none)
Notes: Verified: grep for "jotform" in autism-testing.html shows only a preconnect link (line 578), a div with data-jotform-id (line 1062), a placeholder div (1063), and a noscript fallback link (1068). No <script src="...jotform..."> tag exists. The actual loader is in website/assets/js/app.js (the "Lazy-load Jotform iframes" block ~line 126) which builds the iframe at runtime — this is a different file and outside this ONE-FILE bucket. Existing CSP in website/_headers already enumerates form.jotform.com / cdn.jotfor.ms in script-src, script-src-elem, frame-src, connect-src, and form-action, which is exactly the CSP mitigation the finding recommends. If follow-up is desired: (1) add sandbox="allow-forms allow-scripts allow-same-origin allow-popups" to the dynamic iframe in assets/js/app.js (~line 152), and (2) consider tightening CSP further in _headers — both out of scope for this one-file bucket.

Verifier: The implementer correctly identified that the finding does not apply to autism-testing.html. Verification confirms: (1) No static Jotform script tag exists at line 1059 (it's an HTML comment); (2) Jotform uses dynamic iframe creation via assets/js/app.js, outside this file's scope; (3) SRI/integrity attributes cannot be applied to dynamically-generated iframe URLs; (4) CSP mitigation already exists in website/_headers with script-src/frame-src restrictions on form.jotform.com and cdn.jotfor.ms; (5) File has no broken HTML syntax or regressions; (6) The skip status is properly justified with accurate technical reasoning.


### __site_wide__ — PASS

Findings (14):
- No active cookie consent banner or consent manager on public pages
- robots.txt still points to old WordPress domain
- inject-seo.py hardcodes production domain in SEO script generation
- No HIPAA Business Associate Agreements (BAA) listed for third-party processors handling patient data
- Tailwind JIT at runtime (398 KB uncompressed) instead of static precompilation
- No defer or async on critical JS; render-blocking script execution at end of document
- Hero image (jessica-rockowitz) at 366 KB with no lazy-loading or modern format fallback
- Large images throughout site without modern formats (NewAbout 241 KB, multiple 200+ KB PNGs)
- Missing Content-Security-Policy (CSP) header
- Missing Strict-Transport-Security (HSTS) header
- Public pages lack X-Frame-Options header (clickjacking vulnerability)
- Missing X-Frame-Options header for public pages
- Public pages missing X-Frame-Options header (clickjacking vulnerability)
- Blog post dynamic SEO fails static crawler analysis

Implementer: partial — Implemented 5 of 14 findings with surgical edits (security headers, defer scripts, env-configurable SITE, blog canonical pre-fill). Skipped the rest with explicit reasons: CMP/HIPAA need product+vendor decisions, image+Tailwind optimizations need new build deps (prohibited), and CSP + legacy redirects + robots.txt sitemap URL are already correctly addressed in the repo.
Files: website/_headers, website/scripts/inject-seo.py, website/blog/post.html, website/index.html, website/about.html, website/aba-therapy-guide.html, website/autism-testing.html, website/blog.html, website/careers.html, website/center-based-aba-therapy.html, website/contact.html, website/cookie-consent.html, website/disclaimer.html, website/early-intervention-autism-program.html, website/employment-application.html, website/faqs.html, website/gahanna-ohio.html, website/icon-attribution.html, website/in-home-aba-therapy.html, website/insurance.html, website/job-application.html, website/landing.html, website/locations.html, website/mayfield-ohio.html, website/murray-utah.html, website/our-process.html, website/our-services.html, website/potty-training-program.html, website/pre-intake-form.html, website/privacy-policy.html, website/terms-of-service.html, website/test.html, website/thank-you.html, website/thank-you-confirmation.html, website/worthington-ohio.html
Notes: IMPLEMENTED:
- #3 (SITE hardcoding): inject-seo.py now reads SITE_DOMAIN from env, falling back to https://ontargetaba.com. Beta builds can override with `SITE_DOMAIN=https://beta.ontargetaba.com python inject-seo.py`.
- #6 (defer on JS): Added `defer` to all `<script src=".../header.js|footer.js|app.js"></script>` tags across 33 HTML files. Verified inline scripts that follow (blog.html, blog/post.html) are independent IIFEs that don't rely on app.js globals — safe.
- #10 (HSTS): Added `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` to /* in _headers.
- #11/#12/#13 (X-Frame-Options on public pages): Added `X-Frame-Options: SAMEORIGIN` to /* in _headers (Jotform iframes are embedded by us, not framing us, so SAMEORIGIN is safe). These three findings are duplicates of each other.
- #14 (Blog post canonical): Changed default canonical from /blogs/ → /blog and added an early inline `<script>` that updates canonical + og:url to /blog/posts/{slug} from URL pattern before the markdown fetch. Also added a new <meta property=og:url id=seo-og-url> tag (was missing entirely). Static crawlers running even minimal JS will now see post-specific canonicals. A full static-build of one HTML per slug was out of scope (would require new build step + 161 files); a CF Worker for server-side injection is the recommended longer-term fix.

SKIPPED (with reason):
- #1 (CMP banner): Requires choosing a vendor (Osano/OneTrust/etc) and integration credentials. needs-user — which CMP product to embed? No tracking scripts are currently firing (head-scripts.json empty) so this is not actively leaking PII today, but the moment GA/FB Pixel are added it becomes a GDPR risk.
- #2 (robots.txt sitemap URL + legacy WP redirects): robots.txt already correctly points to https://ontargetaba.com/sitemap.xml (the canonical production domain). _redirects already contains comprehensive WP-legacy → new URL mappings for /aba-therapy-murray-utah/, /on-target-aba-autism-testing-autism-evaluations/, /everything-you-need-to-know-aba-therapy/, /potty-training-progam/, /locations_/, /thankyou/, /blogs/, all the PPC landing variants, and the WP feed/category/author/tag archives. Finding is already addressed.
- #4 (HIPAA BAAs): Legal/operational task — needs business owner to execute BAAs with Jotform, Cloudflare, etc. Cannot be implemented in code. needs-user. A privacy-policy HIPAA section could be drafted but the underlying BAAs must exist first.
- #5 (Tailwind precompilation): Requires adding `npx tailwindcss` to the build, which means npm install + a new build step. Explicitly prohibited by task rules ("Don't introduce new dependencies — no npm install, no new build steps"). Skipped.
- #7 (hero image WebP/AVIF) and #8 (bulk image conversion): Require ImageMagick/cwebp/avifenc in the build pipeline — new dependencies, prohibited by task rules. Skipped. Could be done manually offline and committed as assets, but that's not a code change the orchestrator can run.
- #9 (CSP header): Already present in _headers for both /admin/* and /* with appropriate allow-lists for Jotform, LeadTrap, jsdelivr, Google Maps, GA, FB Pixel, Hotjar. Already addressed.

Build pipeline note: The instructions said not to run build scripts. The deploy will run build.sh which executes inject-seo.py — at that point the SITE_DOMAIN env override will be honored (CF Pages env var, set per environment).

Verifier: Implementer's work is legitimate and well-executed. All 5 implemented findings (#3, #6, #10, #11/#12/#13, #14) are correctly verified in code with no syntax errors or regressions. The SITE_DOMAIN environment variable override is properly implemented in inject-seo.py (line 23), all 33 HTML files consistently include defer attributes on external scripts, HSTS and X-Frame-Options headers are correctly configured in _headers, and blog canonical pre-fill uses a pragmatic IIFE approach that static crawlers will recognize. The implementer's rationale for skipping findings #1, #4, #5, #7, #8 is sound (vendor selection, legal requirements, build system constraints). Findings #2 and #9 were already correctly addressed in the repo. No breaking changes introduced.
⚠️ Regressions: None detected. All HTML files properly closed. Python script valid. No broken syntax or missing closing tags.

## Notes needing user action
- [job-application.html] Note: employment-application.html still uses implicit-only label wrapping (no explicit for/id pairs) — the finding text references it as the model fix, but that file actually has not been similarly hardened. The pattern applied here (wrapping label retained, plus explicit `for`/`id` for redundant association + name + autocomplete) is the standard a11y-best-practice approach. If employment-application.html should be brought to parity, that's a separate target file.
- [admin/head-scripts.html] Skipped — two blockers:

1. **Wrong file for the fix.** The target file `website/admin/head-scripts.html` is the admin UI, and it's already production-ready: it loads `/api/head-scripts`, renders the textarea, lists the legacy IDs in the Quick Reference card (lines 93-104), and PRs changes. The actual fix (pasting GA4/Ads/Facebook/Hotjar/WhatConverts snippets) would write to `website/assets/data/head-scripts.json` via the admin save flow — a different file, which the ONE-FILE rule prohibits touching here.

2. **Needs user-supplied credentials.** Even if scope allowed editing the JSON, populating it requires data this agent can't generate:
   - Two GA4 measurement IDs are noted as "partial" in the existing doc (`G-PHLC29WGVN`, `G-D3RBZZ5WPL`) — need confirmation they're complete.
   - Facebook Pixel ID is unknown — the doc says "copy from PixelYourSite settings in the WP admin."
   - WhatConverts snippet must be copied from account 159348's dashboard.
   - Google Ads tag `AW-354317910` is known but pasting just the ID without the full gtag snippet shape isn't useful.

   Faking IDs would silently break tracking; the rules say don't fake secrets.

**Recommended next step (for a human):** Log into https://beta.ontargetaba.com/admin/head-scripts.html and paste the real snippets from each vendor dashboard. The admin page already documents what's needed — no code change required.
- [assets/data/head-scripts.json] Findings 1 & 2 (GA4 + Google Ads) implemented. JSON validated; renders well-formed HTML. The single gtag.js loader handles both GA4 properties and the Ads config via three gtag('config', ...) calls, plus a second loader for AW-354317910 per the finding's literal instructions. optimize-pages.py will inject this verbatim into every page's <head> on next build.\n\nFinding 3 (Facebook Pixel) SKIPPED — needs-user: the finding text says 'Replace YOUR_PIXEL_ID with the actual ID' and the audit itself flags it as unknown. The legacy site used PixelYourSite WP plugin; the actual numeric Pixel ID was not provided. I did not invent one — embedding the snippet with the placeholder 'YOUR_PIXEL_ID' would 404 against connect.facebook.net and pollute console errors on every page. User should retrieve the Pixel ID from Facebook Ads Manager (Events Manager → Data Sources) or the legacy WP PixelYourSite settings, then paste the snippet via /admin/head-scripts.html (append to the existing scripts string).
- [insurance.html] Finding 1 (no action endpoint): The site uses Jotform embeds (not /api/* endpoints) for real submissions per CLAUDE.md. The user has not supplied an insurance-specific Jotform ID, so I did NOT swap in a Jotform iframe — that would require a real form ID (needs-user if they want a true intake form here). Instead I pointed action to /contact, the page that already hosts the real Jotform-backed insurance/contact intake (form ID 210615141890045). This is a minimal, non-fabricated, non-breaking change that gives the form a legitimate destination instead of action='#'. If the user wants a dedicated insurance Jotform embed on insurance.html instead, they need to provide the Jotform ID. Findings 2 & 3 (target='_blank' missing rel='noopener'): Fully addressed by adding rel='noopener noreferrer' to the form element.
- [privacy-policy.html] Used 'privacy@ontargetaba.com' as a standard privacy-contact alias since no existing alias was found in the repo. If the business prefers a different inbox (e.g., nate.karr@ontargetaba.com or info@ontargetaba.com), swap the two strings on lines 664 and 670 — the alias needs to be live at the mail provider for the page's mailto links to deliver. Out of scope for this one-file bucket: 'website/icon-attribution.html:531' has the same '[email protected]' placeholder and should be addressed in a separate pass.
- [assets/js/header.js] Implemented within the one-file scope:\n- renderMobileCta() now sets inline style padding-bottom: max(env(safe-area-inset-bottom), 0px) plus padding-left/right: env(safe-area-inset-*). Used inline style instead of Tailwind arbitrary utilities because env() inside arbitrary values requires a Tailwind safelist/build step, which this no-build site doesn't have.\n- Body padding-bottom rule (mobile-only) changed from a flat 68px to calc(68px + env(safe-area-inset-bottom, 0px)) so the home-indicator area is also cleared.\n\nSkipped (out of scope for ONE-FILE bucket):\n- Adding viewport-fit=cover to the viewport meta tag. This would require editing every HTML page (the project has dozens) plus the page-template scaffolding under scripts/. Without viewport-fit=cover, browsers in landscape/notched layouts may not extend the layout into the safe-area, in which case the env() values resolve to 0 and the bar still renders correctly (no regression). Recommend a follow-up bucket that touches HTML files / scripts/inject-seo.py or a new selfhost-* style script to add viewport-fit=cover site-wide.\n- The mobile nav hamburger button (line 150) is inline-grid inside the sticky header, not fixed-positioned, so it sits in the normal max-w-7xl px-5 container and doesn't need its own safe-area handling. Left untouched to keep the edit surgical.
- [_headers] Deviated from the literal example CSP in the findings for two reasons: (1) the example omitted 'unsafe-inline' for script-src, which would have instantly broken every page — the codebase has heavy inline <script> usage (per-page tailwind.config, JSON-LD @graph blocks, hero animation IIFEs, page-overrides bootstrap). (2) the example omitted hosts that are actually loaded: LeadTrap (lead-bot widget), cdn.jotfor.ms (Jotform CDN), Google Maps iframes on location pages, and the analytics hosts (GTM/GA4/Hotjar/FB) the admin can inject. Also added 'unsafe-eval' because tailwind.js runtime CDN compiles class names at runtime (needed even though it's self-hosted at /assets/vendor/tailwind.js). Added frame-ancestors 'none' on /admin (clickjacking) and 'self' on public. Did not switch to CSP-Report-Only — the brief was to add a real CSP. Recommend monitoring the deployed site for unexpected console violations and tightening (drop 'unsafe-inline' via nonces) in a follow-up if desired.
- [sitemap.xml] The finding referenced 'test.html' but the actual sitemap entry at line 172 was '/blog/posts/test' (a blog post slug), not a test.html page. Removed that URL block (loc + lastmod + changefreq + priority). Bucket scope is one-file (sitemap.xml), so robots.txt disallow and noindex meta on the underlying blog post were not added here. Follow-ups for the orchestrator/user: (1) consider deleting or marking 'website/assets/blog/test.md' as draft so build-blog-index.py + build-sitemap.py don't re-emit the URL on the next deploy; (2) optionally add 'Disallow: /blog/posts/test' to robots.txt and/or add the post to a draft list. Did not run build scripts per instructions — build.sh on deploy will regenerate sitemap from index.json, so removing/draft-flagging the underlying .md is required for the fix to persist.
- [landing.html] Tags inserted directly after the robots meta (lines 12-57), modeled on the SEO block in autism-testing.html for consistency. Used the existing assets/og/autism-testing.svg as the og:image (no landing-specific OG image exists; gen-og-images.mjs only generates for pages in the registry). Did NOT wrap in auto-seo-start/end markers because landing.html isn't in inject-seo.py's SITE_PAGES registry — that keeps the build script from clobbering these tags. JSON-LD intentionally minimal (WebPage + Organization publisher only) since the page is noindex; no breadcrumbs, no MedicalBusiness/LocalBusiness graph, no AggregateRating. Site-wide schema.org markup for the org already lives on indexable pages. If you later want gen-og-images.mjs to produce a landing.svg, that'd be a separate change to scripts/gen-og-images.mjs and is out of scope for a one-file edit.
- [autism-testing.html] Verified: grep for "jotform" in autism-testing.html shows only a preconnect link (line 578), a div with data-jotform-id (line 1062), a placeholder div (1063), and a noscript fallback link (1068). No <script src="...jotform..."> tag exists. The actual loader is in website/assets/js/app.js (the "Lazy-load Jotform iframes" block ~line 126) which builds the iframe at runtime — this is a different file and outside this ONE-FILE bucket. Existing CSP in website/_headers already enumerates form.jotform.com / cdn.jotfor.ms in script-src, script-src-elem, frame-src, connect-src, and form-action, which is exactly the CSP mitigation the finding recommends. If follow-up is desired: (1) add sandbox="allow-forms allow-scripts allow-same-origin allow-popups" to the dynamic iframe in assets/js/app.js (~line 152), and (2) consider tightening CSP further in _headers — both out of scope for this one-file bucket.
- [__site_wide__] IMPLEMENTED:
- #3 (SITE hardcoding): inject-seo.py now reads SITE_DOMAIN from env, falling back to https://ontargetaba.com. Beta builds can override with `SITE_DOMAIN=https://beta.ontargetaba.com python inject-seo.py`.
- #6 (defer on JS): Added `defer` to all `<script src=".../header.js|footer.js|app.js"></script>` tags across 33 HTML files. Verified inline scripts that follow (blog.html, blog/post.html) are independent IIFEs that don't rely on app.js globals — safe.
- #10 (HSTS): Added `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` to /* in _headers.
- #11/#12/#13 (X-Frame-Options on public pages): Added `X-Frame-Options: SAMEORIGIN` to /* in _headers (Jotform iframes are embedded by us, not framing us, so SAMEORIGIN is safe). These three findings are duplicates of each other.
- #14 (Blog post canonical): Changed default canonical from /blogs/ → /blog and added an early inline `<script>` that updates canonical + og:url to /blog/posts/{slug} from URL pattern before the markdown fetch. Also added a new <meta property=og:url id=seo-og-url> tag (was missing entirely). Static crawlers running even minimal JS will now see post-specific canonicals. A full static-build of one HTML per slug was out of scope (would require new build step + 161 files); a CF Worker for server-side injection is the recommended longer-term fix.

SKIPPED (with reason):
- #1 (CMP banner): Requires choosing a vendor (Osano/OneTrust/etc) and integration credentials. needs-user — which CMP product to embed? No tracking scripts are currently firing (head-scripts.json empty) so this is not actively leaking PII today, but the moment GA/FB Pixel are added it becomes a GDPR risk.
- #2 (robots.txt sitemap URL + legacy WP redirects): robots.txt already correctly points to https://ontargetaba.com/sitemap.xml (the canonical production domain). _redirects already contains comprehensive WP-legacy → new URL mappings for /aba-therapy-murray-utah/, /on-target-aba-autism-testing-autism-evaluations/, /everything-you-need-to-know-aba-therapy/, /potty-training-progam/, /locations_/, /thankyou/, /blogs/, all the PPC landing variants, and the WP feed/category/author/tag archives. Finding is already addressed.
- #4 (HIPAA BAAs): Legal/operational task — needs business owner to execute BAAs with Jotform, Cloudflare, etc. Cannot be implemented in code. needs-user. A privacy-policy HIPAA section could be drafted but the underlying BAAs must exist first.
- #5 (Tailwind precompilation): Requires adding `npx tailwindcss` to the build, which means npm install + a new build step. Explicitly prohibited by task rules ("Don't introduce new dependencies — no npm install, no new build steps"). Skipped.
- #7 (hero image WebP/AVIF) and #8 (bulk image conversion): Require ImageMagick/cwebp/avifenc in the build pipeline — new dependencies, prohibited by task rules. Skipped. Could be done manually offline and committed as assets, but that's not a code change the orchestrator can run.
- #9 (CSP header): Already present in _headers for both /admin/* and /* with appropriate allow-lists for Jotform, LeadTrap, jsdelivr, Google Maps, GA, FB Pixel, Hotjar. Already addressed.

Build pipeline note: The instructions said not to run build scripts. The deploy will run build.sh which executes inject-seo.py — at that point the SITE_DOMAIN env override will be honored (CF Pages env var, set per environment).
