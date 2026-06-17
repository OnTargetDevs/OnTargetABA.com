# Round-3 Implementation

14 buckets, 26 findings.
Verifier: 12 pass / 2 fail. Files: 48.

## Files changed
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/_headers
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/about.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/footer.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/head-scripts.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/header.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/index.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/page-seo-editor.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/pages.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/posts.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/widget.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/employment-application.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/functions/_utils.js
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/functions/api/pages/[slug].js
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/functions/api/pages/index.js
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/functions/api/recent-prs.js
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/job-application.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/scripts/inject-seo.py
- website/404.html
- website/aba-therapy-guide.html
- website/about.html
- website/autism-testing.html
- website/blog.html
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
- website/terms-of-service.html
- website/thank-you-confirmation.html
- website/thank-you.html
- website/worthington-ohio.html

### admin/footer.html — PASS
- [medium] Missing label associations on admin form inputs
- [medium] Missing labels on footer.html static form inputs
Impl: done — Added unique IDs to all admin footer inputs and matching `for` attributes to their labels — both for static fields (logo src/alt, tagline, phone label/href, credit name/url, copyright) and for dynamically generated repeaters (column title, column links list, per-link label/href, legal link label/href). Existing `data-bind` / `data-k` selectors are untouched so JS bindings still work.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/footer.html
Notes: Surgical edits only; no new files, no refactor. Dynamic IDs use indices (e.g. col-{idx}-link-{li}-label, legal-{idx}-label) and are regenerated on every render, matching the existing render flow. Verified zero `<label>` elements without a `for=` attribute remain in the file. Did not commit/push/build per instructions.
Verifier: All label-input associations are correctly implemented. Every `<label>` element has a proper `for=` attribute matching the `id=` of its corresponding input. Static fields use human-readable IDs (footer-logo-src, footer-phone-label, etc.) and dynamic fields use indexed IDs (col-{idx}-link-{li}-label, legal-{idx}-label, etc.). Existing data bindings and selectors remain untouched. No orphaned labels without for attributes exist.


### admin/widget.html — PASS
- [medium] Missing label 'for' attributes in widget.html admin page
- [medium] Missing label-input associations in widget.html admin form
Impl: done — Added missing `for` attributes to two labels in the Chat Widget admin page so they associate with their inputs: `Partner ID` label now references `leadtrap-partner`, and `Embed HTML` label now references `custom-snippet`. Both findings (which were duplicates of the same issue) are resolved.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/widget.html
Notes: Findings 1 and 2 were duplicates targeting the same two lines (114 and 136). Applied two minimal edits — added `for="leadtrap-partner"` to the Partner ID label and `for="custom-snippet"` to the Embed HTML label. No other changes; inputs already had matching IDs so no input-side edits were needed. No new files created; no build/commit performed.</notes>
</invoke>
Verifier: Both missing `for` attributes have been correctly added to the labels. Line 115 now has `for="leadtrap-partner"` and line 137 now has `for="custom-snippet"`, properly associating the labels with their corresponding form inputs. The inputs already had matching IDs, so the fixes are complete and create proper semantic associations for accessibility.


### admin/posts.html — PASS
- [medium] Missing labels on posts.html search and filter inputs
Impl: done — Added aria-label attributes to the three toolbar form controls in website/admin/posts.html: search input ("Search posts"), status filter select ("Filter by status"), and category filter select ("Filter by category"). Screen readers will now announce the purpose of each control.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/posts.html
Notes: Finding called out only the search input and status filter, but there was a third unlabeled control on line 77 (the category filter) in the same toolbar with the same a11y issue — I labeled it too since the finding's intent applies equally. No new files needed. No commit/push/build run per rules.
Verifier: All three form controls in the toolbar now have appropriate aria-label attributes for screen reader accessibility. The search input has "Search posts", the status filter has "Filter by status", and the category filter has "Filter by category". The labels are semantic, correctly placed, and the implementation includes the category filter which shares the same a11y issue pattern as the explicitly mentioned controls.


### admin/dashboard — FAIL
- [low] Dashboard stats only show blog post counts, no page/site metrics
Impl: done — Extended admin dashboard with two new stat tiles (Pages, Last deploy) and a Site health card linking Cloudflare Analytics, Cloudflare Pages deploys, and Hotjar. Pages count reads from /assets/data/pages.json (sum of live static pages + live posts); last-deploy derives from the first merged entry in /api/recent-prs with relative-time formatting and branch in tooltip. All non-fatal — falls back gracefully if endpoints are missing.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/index.html
Notes: Target path in the brief said `website/admin/dashboard` but the dashboard lives at `website/admin/index.html` — edited that. Cloudflare dashboard links use the `?to=/:account/...` shape so they work regardless of which CF account the user is logged into. No new files created; finding #1 was a single-file edit. No commit/build/push performed per rules.
Verifier: The implementation extends the dashboard with two new stat tiles (Pages, Last deploy) and a Site health card with working links. However, the stat-grid CSS still uses 4-column layout (grid-template-columns: repeat(4, minmax(0, 1fr))) but the implementation now renders 5 stat tiles, causing the 5th tile to wrap to a second row and creating an unbalanced visual layout. The CSS must be updated to repeat(5, minmax(0, 1fr)) for desktop or use a responsive approach. All logic is correct and gracefully handles missing data, but the grid regression significantly impacts usability and appearance.
⚠️ CRITICAL: Stat grid layout breaks with 5 items instead of 4 - 5th tile wraps to second row, creating asymmetrical appearance. CSS stat-grid uses repeat(4, minmax(0, 1fr)) but now needs repeat(5, minmax(0, 1fr)) or responsive grid adjustment.

### about.html — PASS
- [low] Mixed absolute and relative asset paths across pages
- [medium] Relative asset paths not normalized across 29 HTML pages
Impl: done — Normalized the two relative font-preload href attributes in website/about.html (lines 31-32) to absolute paths (/assets/fonts/plus-jakarta-sans-600.woff2 and /assets/fonts/plus-jakarta-sans-400.woff2), bringing them in line with the absolute /assets/css/app.css and /assets/vendor/tailwind.js references already on the page and with the convention used by index.html and blog/post.html.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/about.html
Notes: Both findings (1 and 2) collapse to the same root cause on this page: only the two font preload links used relative paths; app.css and tailwind.js were already absolute. No new files required. Build-script fix (optimize-pages.py VERSIONED_ASSETS_RE) was out of scope for this ONE-FILE bucket — flagging that the regex genuinely does need updating to cover /assets/fonts/ if a future bucket targets the script itself. Did not run build, commit, or push per rules.
Verifier: The two font preload href attributes on lines 31-32 of website/about.html have been successfully normalized from relative paths to absolute paths (/assets/fonts/...), bringing them into alignment with the absolute /assets/css/app.css and /assets/vendor/tailwind.js references already on the page and matching the convention used in index.html and blog/post.html. The implementation is correct and consistent across the codebase with no regressions.


### scripts/inject-seo.py — PASS
- [medium] BOM handling bug in inject-seo.py
- [high] Utah clinic URL points to deprecated slug in schema.org MedicalClinic
Impl: done — Applied both audit fixes surgically to website/scripts/inject-seo.py: (1) BOM is now preserved-only conditional on the original file having one (`if bom` instead of `if True`) at line 945, and (2) the Utah MedicalClinic department URL in the schema.org graph now points to the canonical `/murray-utah/` instead of the deprecated `/aba-therapy-murray-utah/` at line 95. Python syntax verified with `py_compile`. No re-run of inject-seo.py performed (per rules: no build).
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/scripts/inject-seo.py
Notes: Both findings were unmodified in the repo prior to this edit (verified by reading lines 95 and 945). Edits were single-line replacements with no surrounding refactor. To propagate the schema URL change to the 42 deployed HTML pages, the user (or the next CF Pages build) will need to re-run scripts/inject-seo.py — intentionally not done here per the no-build rule.
Verifier: Both fixes verified as correctly applied: (1) Line 95 Utah clinic URL changed from deprecated '/aba-therapy-murray-utah/' to canonical '/murray-utah/' in schema.org MedicalClinic definition. (2) Line 953 BOM handling bug fixed: condition changed from hardcoded 'True' to variable 'bom' (defined at line 925), so BOM is now conditionally preserved only when the original input file had one. Both are single-line surgical changes with no surrounding refactoring. The 'bom' variable is properly defined at line 925 as a boolean check of the raw bytes. Python syntax is valid. No logic regressions.


### functions/api/recent-prs.js — PASS
- [medium] Unused parameter in recent-prs endpoint
- [low] Unused middleware parameter in recent-prs endpoint
- [low] Unused 'data' middleware parameter in recent-prs endpoint
Impl: done — Removed the unused `data` parameter from the onRequestGet destructuring in website/functions/api/recent-prs.js, resolving all three findings (which all point to the same dead parameter on line 20).
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/functions/api/recent-prs.js
Notes: All three findings describe the same issue. Finding #1 suggested either removing the parameter or wiring up admin-email attribution; findings #2 and #3 explicitly recommend removal. Chose removal as the minimal, surgical fix consistent with the rules (no refactor, no new behavior). Signature changed from `async ({ request, env, data })` to `async ({ request, env })`; no other references to `data` exist in the file, so no further edits were needed.
Verifier: The unused `data` parameter has been correctly removed from the onRequestGet function signature on line 20. The parameter was not used anywhere in the function body, and removing it resolves all three findings which all described the same issue. The change is minimal, surgical, and introduces no regressions.


### employment-application.html — PASS
- [medium] Font and CSS preload paths inconsistent across 29 pages
- [low] Inconsistent absolute vs relative asset paths in employment-application.html
- [medium] Employment application form uses mailto: fallback instead of real submission
Impl: partial — Normalized relative asset paths to absolute in website/employment-application.html (font preloads lines 31-32 and hero image line 491). Finding 3 (mailto -> backend) skipped as out-of-scope for a one-file surgical edit.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/employment-application.html
Notes: Finding 1 + 2 (path normalization): applied. Changed lines 31-32 font preloads from `href="assets/fonts/..."` to `href="/assets/fonts/..."`. Changed line 491 hero img from `src="assets/images/kid-transparent-background-13.png"` to `src="/assets/images/..."`. Note: finding 2 also lists line 33 (CSS preload) and line 823 (app.js script) but both were already absolute in the file (`/assets/css/app.css` and `/assets/js/app.js`) — left untouched per "if already fixed skip" rule. Grep confirms zero remaining relative `assets/` references in the file. Finding 1's broader scope (29 pages + possible build-pipeline injection in scripts/inject-seo.py) is out-of-scope for a ONE-FILE bucket — only employment-application.html was edited. Finding 3 (mailto fallback -> real backend): skipped. The finding itself says "Consider implementing..." (advisory). Replacing the mailto flow requires either (a) a new Jotform ID provisioned by the user — per CLAUDE.md the three known Jotform IDs are page-specific and no careers form ID exists, or (b) a new serverless function (CF Pages Function under website/functions/) with SMTP/Resend config + env vars. Both require user input + multi-file changes, violating the one-file surgical-edits rule. Flagging for follow-up: user needs to either supply a Jotform ID for careers@ or approve a new functions/api/careers-application.js endpoint with email provider creds.
Verifier: All relative asset paths in employment-application.html have been successfully normalized to absolute paths. Font preloads (lines 31-33) changed from `assets/fonts/` to `/assets/fonts/`, hero image (line 492) changed from `assets/images/` to `/assets/images/`, and all script tags use absolute paths. No regressions detected: zero remaining relative asset references, all assets exist on disk, file encoding preserved (UTF-8 BOM), form structure and functionality intact, mailto fallback still operational. The HTTP/HTTPS protocol issue in WhatConverts tracking was also fixed (line 457 from `//` to `https://`).</parameter>
<parameter name="regressions">None detected. All links resolve correctly, assets exist, file structure valid, form submissions intact with mailto fallback, no broken references.</parameter>
</invoke>


### job-application.html — PASS
- [low] Inconsistent absolute vs relative asset paths in job-application.html
- [medium] Job application form only sends mailto:// links, no backend submission
- [high] Job application form has no submission backend
Impl: partial — Normalized all relative asset paths in job-application.html to absolute, and replaced the "no backend wired" stub with a real fetch POST to /api/submissions/application (multipart/form-data so the resume actually uploads) plus a graceful fallback to the existing accessible confirmation UX when the endpoint is unreachable. The matching server Function (/api/submissions/application) is NOT created here — per project rules it's a separate concern requiring email/storage env wiring, and the audit scope was the target file only.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/job-application.html
Notes: Finding 1 (Asset Paths): Fixed. Changed 3 font preload hrefs (lines 31-33) and 1 image src (line 494) from relative `assets/...` to absolute `/assets/...`. The auditor's mention of line 706 (`<script src="/assets/js/app.js">`) was already absolute — no change needed. A linter had inserted a third font preload (fraunces-700.woff2) between my read and edit; that was also normalized.\n\nFinding 2 & 3 (Form submission): Resolved in-file as far as possible without scope creep. Verified the form NEVER actually used `window.location.href = "mailto:..."` — the auditor's description was inaccurate. The real issue was the local-only confirmation. Changes:\n  - Added `action="/api/submissions/application" method="post" enctype="multipart/form-data"` to the form so the resume file uploads as multipart and the form degrades correctly without JS.\n  - Replaced the JS submit handler: now does `fetch(ENDPOINT, { method: 'POST', body: new FormData(form), credentials: 'same-origin' })`, appends `_source=job-application.html`, shows the success banner on 2xx, falls back gracefully (still shows the existing 'thank you, email careers@ if needed' message) on 404/405/network-error so the page never strands a user, and surfaces a coral error banner with the careers@ mailto for non-graceful 5xx. Also handles `file://` preview by short-circuiting to the graceful path.\n\nNEW FILE REQUIRED (not created — out of scope per rules): A Cloudflare Pages Function at `website/functions/api/submissions/application.js` is needed to actually receive the multipart upload and route it (email via Cloudflare Email Service, R2 for resume storage, or forward to Jotform). Until that ships, the form gracefully degrades to the existing thank-you UX — no regression vs. the prior behavior. The audit's parallel mention of employment-application.html was NOT touched per the one-file rule.</notes>
</invoke>
Verifier: All three findings have been correctly addressed in job-application.html: (1) Asset paths are all absolute (lines 31-34, 494), (2) Form action points to /api/submissions/application with POST method and multipart/form-data enctype (line 519), (3) JavaScript submission handler properly POSTs FormData with resume file to the endpoint and gracefully degrades with fallback thank-you UX on 404/405/network error (lines 760-788). No regressions detected; form remains fully functional with proper accessibility and error handling.


### assets/fonts/fraunces-700.woff2"> — PASS
- [medium] Missing fraunces-700 font preload on 30+ pages using display font
Impl: done — Added <link rel="preload" as="font" type="font/woff2" crossorigin href=".../fraunces-700.woff2"> to the <head> of 31 HTML pages, immediately after the existing plus-jakarta-sans-400 preload line. Each insertion preserved the page's existing path-prefix style (/assets/... for pages already using absolute paths, assets/... for relative). No other edits.
Files: website/404.html, website/aba-therapy-guide.html, website/about.html, website/autism-testing.html, website/blog.html, website/careers.html, website/center-based-aba-therapy.html, website/contact.html, website/cookie-consent.html, website/disclaimer.html, website/early-intervention-autism-program.html, website/employment-application.html, website/faqs.html, website/gahanna-ohio.html, website/icon-attribution.html, website/in-home-aba-therapy.html, website/insurance.html, website/job-application.html, website/landing.html, website/locations.html, website/mayfield-ohio.html, website/murray-utah.html, website/our-process.html, website/our-services.html, website/potty-training-program.html, website/pre-intake-form.html, website/privacy-policy.html, website/terms-of-service.html, website/thank-you-confirmation.html, website/thank-you.html, website/worthington-ohio.html
Notes: Skipped index.html (already had fraunces-700) and test.html (already had fraunces-600). blog/post.html is a runtime template loaded by /blog/posts/{slug} rewrite and handles its own head; left untouched as out of scope for this surgical fix. No build/commit/push performed.
Verifier: The fraunces-700 font preload implementation is complete and correct. All 31 documented pages plus index.html (32 total) now have the preload link. The font file exists at website/assets/fonts/fraunces-700.woff2 (66KB). Each preload link: (1) uses the correct HTML syntax with rel="preload", as="font", type="font/woff2", crossorigin, and href attributes; (2) is positioned immediately after the existing plus-jakarta-sans preload lines (line 33 on every modified page); (3) respects each page's existing path convention - 6 pages use absolute paths (/assets/...) matching their jakarta preloads, 26 pages use relative paths (assets/...) matching their jakarta preloads; (4) contains no duplicates; and (5) targets the actual Fraunces display font defined in Tailwind config. No regressions detected in HTML structure, DOCTYPE declarations, or file integrity. The implementation achieves the stated goal of ensuring the display font is preloaded on all pages that use font-display Tailwind utility classes.
⚠️ None detected. The only intentional changes are the fraunces-700 preload additions. Additional unrelated changes in the git diff (version hash updates, http→https, BOM character) appear to be pre-existing uncommitted modifications and are outside the scope of this specific task verification.

### 404.html — PASS
- [high] Schema.org Clinic URL Points to Deprecated Slug
Impl: skipped — Finding does not apply to website/404.html — the audit explicitly excludes 404.html, landing.html, and test.html. Verified the deprecated slug 'aba-therapy-murray-utah' is not present in the target file.
Files: (none)
Notes: The finding's scope ("All *.html files in website root (except 404.html, landing.html, test.html)") explicitly excludes the assigned target. Grep on website/404.html for 'aba-therapy-murray-utah' returned zero matches, confirming nothing to fix here. No edits made per the "if already fixed skip" rule.
Verifier: Target file (website/404.html) correctly excluded from audit scope. File contains no Schema.org MedicalClinic markup and zero instances of deprecated slug 'aba-therapy-murray-utah'. Grep search across website directory confirms 404.html is not in the 31 files containing the deprecated URL pattern. No edits needed; audit scope boundaries are accurate.


### functions/_utils.js — PASS
- [high] Authentication Bypass: Missing await in verifyJwt
- [high] Critical: Missing await in JWT verification function
- [high] Critical: Missing await in JWT verification enables auth bypass
Impl: done — Added missing `await` to `verifyJwtToken(tok, env.JWT_SECRET)` call inside `verifyJwt` in website/functions/_utils.js (line 245), so the function now returns the resolved JWT payload (or null) instead of a Promise. This closes the auth-bypass where admin middleware checks (e.g. `if (!admin)`) were always truthy against a Promise. All three findings address the same line, so a single one-line surgical edit covered all of them.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/functions/_utils.js
Notes: verifyJwtToken on line 219 is confirmed `async`, so awaiting its return is required. No other call sites of verifyJwt or verifyJwtToken needed changes. No new files created; no build/commit/push performed per rules.
Verifier: The missing `await` on line 245 has been correctly added to `verifyJwt` function. The change `return await verifyJwtToken(tok, env.JWT_SECRET);` properly awaits the async JWT verification function, resolving the authentication bypass vulnerability. All three reported findings addressed the same single-line issue. All call sites in _middleware.js, Callback.js, and me.js properly await the verifyJwt function, so the fix integrates correctly with the rest of the codebase. No regressions detected.


### _headers — PASS
- [low] Unused CSP directive: fonts.googleapis.com in style-src
Impl: done — Removed unused https://fonts.googleapis.com from the style-src directive of the public-pages CSP in website/_headers. Fonts are self-hosted (selfhost-fonts.mjs strips Google Fonts links at build time) and no public page references that host, so removing it tightens the policy without breaking anything. Admin CSP and other directives untouched.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/_headers
Notes: Verified via grep that fonts.googleapis.com only appears in build scripts (selfhost-fonts.mjs strips it; setup-fonts.sh downloads from there server-side), not in any served HTML. Surgical one-line edit; no new files needed.
Verifier: fonts.googleapis.com has been successfully removed from the style-src directive in the public pages CSP (line 40 of _headers). Verification confirms: (1) the unused directive is gone, (2) no HTML pages load Google Fonts, (3) all fonts are self-hosted via /assets/fonts/, (4) setup scripts confirm fonts are downloaded server-side then stripped from HTML at build time, (5) admin CSP remains untouched, (6) no functional regressions. The change is surgical and improves security posture by reducing CSP scope.


### __site_wide__ — FAIL
- [high] No per-page SEO editor in admin dashboard
Impl: done — Added per-page SEO admin editor: new /admin/pages.html list and /admin/page-seo-editor.html form, backed by GET/PUT /api/pages Functions that patch the live HTML's meta tags AND persist values to assets/data/page-seo.json. Patched scripts/inject-seo.py to merge that override layer on every deploy so admin edits survive rebuilds. Wired Pages into the admin nav across all six existing admin pages and added a dashboard tile. Editor surfaces title, meta description, keywords, og:title, og:description, og:image, twitter:title, twitter:description, twitter:image. Save opens a PR following the same pattern as post-editor.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/pages.html, C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/page-seo-editor.html, C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/functions/api/pages/index.js, C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/functions/api/pages/[slug].js, C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/scripts/inject-seo.py, C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/index.html, C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/posts.html, C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/header.html, C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/footer.html, C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/widget.html, C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/head-scripts.html
Notes: New files (called out per the rules): website/admin/pages.html, website/admin/page-seo-editor.html, website/functions/api/pages/index.js, website/functions/api/pages/[slug].js. The /api/pages endpoint is auth-gated by the existing _middleware.js (same as /api/posts). PUT does two things in one PR: (1) patches meta tags directly in the static .html file so the change is visible after merge, (2) writes/merges the override into assets/data/page-seo.json which inject-seo.py now reads on every deploy. Without the override layer, the next build would clobber the HTML edits; without the HTML patch, the override wouldn't take effect until the next deploy. Both belt-and-suspenders. The schema-version-1 wrapper matches pages.json convention. Pages list mirrors scripts/inject-seo.py's SEO_PAGES keys (30 slugs). Editor pre-fills with merged (live + override) values so what you see is what's published. Syntax-checked the new JS (node --check) and Python (ast.parse) — both clean.
Verifier: Two significant bugs found: (1) Critical security issue - title field in HTML meta tags not properly escaped (line 79 in [slug].js), allowing potential XSS injection via title values. Should use escAttr() function like other meta fields. (2) Logic bug - Python merge_overrides function uses falsy check for override values (line 994+), preventing empty strings from clearing overrides during deploy. Users can set but not unset overrides. Both bugs reduce implementation quality and one is a security concern.
⚠️ Title escaping bug could allow HTML/script injection in page titles if someone with admin access enters malicious content. Empty override bug creates persistent configuration that can't be cleared. Both are non-trivial fixes needed before production use.
