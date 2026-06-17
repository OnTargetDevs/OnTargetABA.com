# Round-2 Implementation — Wave 6

## Stats
- Total findings: 42
- Buckets: 21
- Implementer: 17 done / 3 partial / 1 skipped
- Verifier: 20 pass / 1 fail
- Files changed: 19

## Files changed
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/_headers
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/about.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/head-scripts.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/header.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/index.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/data/head-scripts.json
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/data/pages.json
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/js/app.js
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/js/header.js
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/js/leadbot.js
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/blog.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/employment-application.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/functions/api/recent-prs.js
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/index.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/job-application.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/pre-intake-form.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/privacy-policy.html
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/scripts/optimize-pages.py
- C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/thank-you.html

## Per-bucket
### assets/js/leadbot.js — PASS
Findings (8):
- [high] Missing focus trap and focus restoration in leadbot modal dialog
- [medium] Leadbot inputs lack proper form field association
- [high] Missing label-to-input associations in leadbot contact form
- [medium] Leadbot widget code loaded but widget.json configured to use leadtrap
- [medium] window.open() called with invalid 'noopener' parameter
- [low] Leadbot listener delegates click events but uses 'click' instead of delegated pattern on nested buttons
- [low] leadbot localStorage key persists even though leadtrap is active
- [medium] window.open() called with invalid 'noopener' third parameter

Impl: done — Applied surgical edits to website/assets/js/leadbot.js: (1) dialog focus management — store opener, focus first focusable on open, restore on close, Tab/Shift+Tab focus trap added to existing keydown listener; (2/3) form labels now use htmlFor with matching input id ('lb-field-<name>'); (5/8) removed invalid 'noopener' third arg from window.open. Skipped 4, 6, 7: cross-file scope (widget.json/app.js) or fragility-only with no current bug — restricted to one-file bucket.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/js/leadbot.js
Notes: Verified with `node --check` (OK). Focus trap uses a FOCUSABLE_SEL query filtered to currently-rendered elements so it adapts as steps re-render the body. closePanel falls back to focusing the avatar if the original opener was detached. Bubble close button still stops propagation so dismiss does not also open the panel. No new deps, no build scripts run, no commits.
Verifier: All in-scope findings were fixed: (1) Focus management with trap and restoration implemented (lines 365-402, 440-458); (2/3) Form field labels now have htmlFor attributes matching unique input IDs (lines 238-257); (5/8) Invalid 'noopener' third argument removed from window.open() call (line 314). Syntax validation passed. No regressions detected in focus logic, form functionality, event handlers, or accessibility attributes.


### job-application.html — PASS
Findings (2):
- [high] Job application form still uses alert() with no form submission
- [high] Job application form uses inline alert() and doesn't submit

Impl: done — Removed the inline alert()/onsubmit on job-application.html and replaced it with a delegated submit handler matching employment-application.html: form gains id + novalidate, an aria-live status region renders validation errors and a success confirmation, and the submit button is disabled with an aria-busy state while submitting. No backend endpoint is wired (no Jotform ID for this form) — success state directs applicants to careers@ontargetaba.com, identical to the employment-application.html pattern. Both findings (#1 and #2) describe the same regression and are fixed by this single edit.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/job-application.html
Notes: needs-user: a real submission target (Jotform ID or POST endpoint) for the job application form — current handler shows an accessible confirmation but does not transmit the application. Pattern was lifted verbatim from website/employment-application.html (lines 824-870) so future wiring can be done in one place per page. No build scripts or commits were run, per instructions.
Verifier: Both findings were successfully fixed. The job-application.html form no longer uses inline alert() or onsubmit handlers. Instead, it now has a proper delegated form submission handler with HTML5 validation, accessible error/success messaging via an aria-live region, and appropriate ARIA busy states. The implementation correctly matches the pattern from employment-application.html, with the intentional difference that the job form displays a success confirmation message instead of opening a mailto: link (appropriate since no backend endpoint is configured). All form fields, styling, and accessibility features remain intact with no regressions.
⚠️ Regressions: None detected. All form functionality preserved, including required field validation, file upload, contact cards, and styling.

### admin/index.html — PASS
Findings (1):
- [medium] "Posts" stat counts all posts instead of only published posts

Impl: done — Admin dashboard "Posts" stat now counts only live (published) posts — excluding drafts and hidden — matching the WordPress-style Published/Draft/Trash separation.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/index.html
Notes: Added `const live = posts.filter(p => !p.draft && !p.hidden).length;` and changed the [data-stat="posts"] textContent to display `live` instead of `posts.length`. Drafts and Hidden stats remain unchanged. Surgical 2-line change; no refactor, no new deps.
Verifier: The fix was correctly implemented on lines 166-167. Line 166 adds the live filter (`const live = posts.filter(p => !p.draft && !p.hidden).length;`) and line 167 displays it (`document.querySelector('[data-stat="posts"]').textContent = live;`). The logic correctly counts only published posts (excluding both drafts and hidden), matching the specified requirement. Drafts and Hidden stats remain unchanged and properly isolated.


### assets/js/app.js — PASS
Findings (4):
- [high] Widget loading controlled by mode but leadbot localStorage persists anyway
- [medium] data-hide-on-error attribute used on index.html but not handled by JavaScript
- [high] Unsanitized HTML injection in custom widget mode
- [high] Unsanitized HTML injection in custom widget mode

Impl: done — Patched website/assets/js/app.js with three surgical changes: (1) sweep ota_leadbot_v1 localStorage when widget mode is not leadbot, (2) add capture-phase delegated error handler that hides <img data-hide-on-error>, (3) add sanitizeCustomSnippet() that strips inline on* event handlers and javascript: URLs from the custom widget snippet before script execution. No new dependencies, no build-step changes; node -c passes.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/js/app.js
Notes: Finding 1 implemented as option (B) cleanup — does not touch leadbot.js or widget.json since leadtrap is canonical per widget.json. Finding 2 uses capture-phase since `error` does not bubble. Findings 3 and 4 (duplicates) addressed together via a DOM-walk sanitizer rather than DOMPurify, because DOMPurify is only loaded on blog/post.html and adding it site-wide would violate the no-new-deps/no-build-step rule. Sanitizer strips on* attributes and javascript: URLs on href/src/xlink:href/action/formaction; legitimate <script> tags still execute as before. Custom snippet field is currently empty in widget.json so no behavioral change today.
Verifier: All three findings were properly implemented: (1) localStorage cleanup for stale leadbot session when switching widget modes (lines 305-310), (2) capture-phase error handler for data-hide-on-error images (lines 111-121), and (3) DOM-walk sanitizer that strips on* attributes and javascript: URLs from the custom widget snippet before execution (lines 256-280, called at line 287). The code is syntactically valid, mutation-safe, uses no new dependencies, and preserves legitimate functionality.
⚠️ Regressions: None detected. The implementations are surgical and isolated. Error handler only affects images on load failure. localStorage cleanup only triggers when mode is not leadbot. HTML sanitizer preserves legitimate attributes and allows script execution while preventing attribute-based XSS.

### assets/data/head-scripts.json — PASS
Findings (2):
- [high] Protocol-relative URL in WhatConverts tracking script
- [medium] Facebook Pixel ID not configured (blank placeholder)

Impl: partial — Fixed WhatConverts protocol-relative URL to explicit https:// in head-scripts.json (CSP host matching). Facebook Pixel integration deferred — requires user to retrieve numeric Pixel ID from Facebook Events Manager and paste the snippet via /admin/head-scripts.html.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/data/head-scripts.json
Notes: Finding 1 (high/CSP): src=\"//s.wc-data.com/159348/wc.js\" → src=\"https://s.wc-data.com/159348/wc.js\". JSON revalidated with python json.load — well-formed. No other edits made (minimal/surgical). Finding 2 (medium): needs-user. The admin UI already supports adding the FB Pixel snippet through the textarea save flow at /admin/head-scripts.html; no code path change is needed until the ID is supplied. Did not commit, push, or run build scripts per instructions.
Verifier: Finding 1 (protocol-relative URL) is completely fixed: //s.wc-data.com/159348/wc.js → https://s.wc-data.com/159348/wc.js in head-scripts.json, with valid JSON. Finding 2 (Facebook Pixel) is correctly deferred as "needs-user" — the admin UI at /admin/head-scripts.html already documents the Pixel requirement (line 102) and the textarea save flow supports user-supplied snippets. No regressions detected.
⚠️ Regressions: None detected. JSON remains valid. WhatConverts script now uses explicit HTTPS. Admin interface is ready for Facebook Pixel when user provides the ID.

### _headers — PASS
Findings (1):
- [low] Unused iframe hosts in CSP may indicate over-permission or incomplete cleanup

Impl: done — Removed unused https://www.youtube.com host from the public pages CSP frame-src directive in website/_headers. Verified via grep that no YouTube iframe embeds exist anywhere in the site (only plain-text mentions in 4 blog markdown posts), so the host can be safely dropped to reduce CSP attack surface.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/_headers
Notes: Single-line surgical edit to the /* CSP header (line 40). Other frame-src hosts (jotform, leadtrap, google, doubleclick) preserved. Admin CSP and all other directives untouched. If YouTube embeds are added later, re-add the host to frame-src.
Verifier: The implementer successfully removed the unused https://www.youtube.com host from the public pages CSP frame-src directive via a surgical single-line edit. The removal is verified by: (1) git diff showing the exact change on line 40, (2) no YouTube iframe embeds anywhere in the codebase (only Google Maps iframes which are already covered), (3) all other frame-src hosts preserved, (4) admin CSP untouched, (5) no regressions to existing functionality.


### functions/api/recent-prs.js — PASS
Findings (4):
- [low] API endpoint signature inconsistency - recent-prs missing data parameter
- [medium] PR branch name not displaying on admin dashboard due to API/frontend naming mismatch
- [high] Recent PRs branch field name mismatch
- [medium] Inconsistent field name in recent-prs API response

Impl: done — Applied two minimal edits to website/functions/api/recent-prs.js: (1) added `data` to the onRequestGet destructured params for consistency with other protected /api/* endpoints, and (2) renamed the response field `headBranch` to `branch` so it matches what admin/index.html (line 202) and admin/admin.js (line 185) actually read, restoring the branch column in the dashboard. Findings #2 and #3 are resolved by the rename. Finding #4's secondary suggestion (trim unused metadata fields like createdAt/updatedAt/mergedAt/closedAt/user/draft) was intentionally skipped — those fields don't cause bugs, removing them is a refactor beyond the minimal-surgical rule, and the camelCase convention is now consistent (branch, mergedAt, createdAt, updatedAt, closedAt) with `_utils.js createPr()` and the rest of the codebase.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/functions/api/recent-prs.js
Notes: Verified consumers: admin/index.html:202 and admin/admin.js:185 both read `pr.branch`, so the rename fixes the regression. No remaining `headBranch` references anywhere under website/. No other endpoints, build scripts, or tests touched. Per rules: no commit, push, or build run.
Verifier: Both fixes correctly applied: (1) Added 'data' parameter to onRequestGet function signature for consistency with other protected API endpoints, and (2) Renamed 'headBranch' to 'branch' in the response object to match what the frontend consumers (admin/index.html:202 and admin/admin.js:185) actually expect. No remaining references to 'headBranch' exist in the codebase. The changes are minimal, surgical, and address findings #1-3 completely. Finding #4's refactoring suggestion was appropriately deferred as non-critical.


### post.html — FAIL
Findings (1):
- [medium] Many pages use relative href attributes without leading slash

Impl: skipped — Target file website/post.html does not exist; only website/blog/post.html exists, and the finding explicitly excludes blog/post.html from the fix scope. No edit applicable to a one-file bucket targeting this path.
Files: (none)
Notes: Verified via `ls`: `website/post.html` is absent; the actual template is `website/blog/post.html`, which the finding explicitly lists as already exempt ("All pages except blog/post.html and admin pages"). Per the one-file-bucket rule, I will not edit any other file. If the intent was to roll the relative-href fix across the 28 listed pages, that should be a multi-file bucket (likely scripted) — flagging as needs-clarification, but reporting as skipped per the stated rules. No changes made; no build scripts run.

result: skipped — target website/post.html does not exist and the listed exclusion already covers website/blog/post.html.
Verifier: FINDING NOT FIXED. The implementer correctly identified that website/post.html does not exist, but the finding is inherently a multi-file task affecting 28 pages (aba-therapy-guide.html, about.html, autism-testing.html, blog.html, careers.html, center-based-aba-therapy.html, contact.html, cookie-consent.html, disclaimer.html, early-intervention-autism-program.html, employment-application.html, faqs.html, gahanna-ohio.html, in-home-aba-therapy.html, index.html, insurance.html, locations.html, mayfield-ohio.html, murray-utah.html, our-process.html, our-services.html, potty-training-program.html, pre-intake-form.html, privacy-policy.html, terms-of-service.html, thank-you-confirmation.html, thank-you.html, worthington-ohio.html). Verification shows these pages still contain unfixed relative href attributes like href="contact.html" and href="assets/css/app.css" without leading slashes. Example: website/about.html lines 498 and 804 still have href="contact.html"; website/aba-therapy-guide.html lines 31-33 still have href="assets/..." without leading slash. The task should have been either clarified (since the single-file TARGET doesn't exist) or treated as a multi-file bucket. As presented, it was an ill-specified one-file bucket for a non-existent file, which the implementer appropriately flagged as unapplicable.
⚠️ Regressions: None detected - no changes were made, so no regressions could occur. However, the underlying issue (unfixed relative hrefs across 28 pages) remains unresolved.

### about.html — PASS
Findings (2):
- [medium] 17 pages use relative image src paths without leading slash
- [medium] 38 img tags use inline onerror handlers instead of delegated listeners

Impl: done — Applied both round-2 findings to website/about.html: (1) converted 3 relative image src paths to root-relative absolute paths (/assets/images/NewAbout.png, /assets/images/mission-s13.png, /assets/images/mother-1.png); (2) replaced inline onerror="this.style.display='none'" on all 3 imgs with the existing data-hide-on-error delegated pattern (handler already wired in assets/js/app.js at line 116, capture-phase document listener that adds .hidden class).
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/about.html
Notes: Finding 1 scoped to image src only; the remaining relative path on line 818 is the app.js script tag, not an image, so left untouched. Delegated error handler in app.js already covers data-hide-on-error — no JS changes needed. No commits/pushes/builds performed.
Verifier: Both findings were correctly fixed in website/about.html: (1) All 3 image src paths (NewAbout.png, mission-s13.png, mother-1.png) are now root-relative absolute paths with leading slashes; (2) All 3 img tags now use data-hide-on-error attribute instead of inline onerror handlers, delegating to the properly wired error listener in app.js (lines 116-121) that adds .hidden class on error. The script src on line 818 was correctly left untouched as it's not an image. No regressions detected.


### employment-application.html — PASS
Findings (4):
- [medium] Two employment application pages with conflicting implementations
- [high] employment-application.html form inputs lack name attributes
- [high] Employment application form misleads users with fake success message
- [medium] Employment application form lacks name attributes for backend integration

Impl: partial — Added name/id/autocomplete attributes to every input/select/textarea in employment-application.html (matching job-application.html's naming convention) and replaced the misleading fake success message with an honest mailto: handoff that opens the user's email client pre-populated with all form data and addressed to careers@ontargetaba.com. Cross-page consolidation (finding 1) was out of scope for a one-file edit and needs a user decision (delete vs. retain both).
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/employment-application.html
Notes: Finding 2 (missing name attrs) and Finding 4 (same issue) — FIXED. All 30+ form fields now have name + id + label[for] + autocomplete (where applicable). Naming mirrors job-application.html exactly (first-name, last-name, email, phone, street, city, state, zip, dob, position, location, salary, start-date, school-1..3, year-1..3, degree-1..3, employer-1..3, role-1..3, dates-1..3, certifications, licenses, trainings, ref-name-1..3, ref-relationship-1..3, ref-contact-1..3, resume, interest). Verified by grep — 0 unnamed form controls remaining.

Finding 3 (fake success message) — FIXED. The submit handler no longer lies. It now: (1) validates via HTML5; (2) builds a labelled key:value body from every named field; (3) constructs a mailto: URL with subject "Employment application — {name} ({position})" addressed to careers@ontargetaba.com; (4) navigates to that mailto: so the user's email client opens with the application data pre-filled; (5) shows an honest status message telling the user the email client should have opened, instructing them to attach the resume (mailto can't carry files) and press Send, with a fallback "click here" link in case the client didn't launch. Inline JS validated with node Function() — JS_OK.

Finding 1 (consolidation) — NEEDS USER. Rule said ONE-FILE buckets only edit the target file. Consolidation requires editing careers.html links and either deleting employment-application.html or rewiring routes. Naming convention is now aligned with job-application.html, so the two forms are at least structurally compatible. Recommend the user pick: (a) delete employment-application.html and point /employment-application redirects to /job-application, or (b) keep both with distinct purposes (long form vs. short form — current CTA copy "Short form instead" → job-application.html already implies this intent).

Backend wiring: still NEEDS USER for a real fetch()/Jotform endpoint. Until then, the mailto: pattern is the most honest no-backend option — it really does deliver the data to careers@ontargetaba.com via the applicant's own mail client. When a Jotform ID or CF Pages Function endpoint arrives, swap the window.location.href = href line for a fetch(endpoint, { method:'POST', body: new FormData(form) }) call.
Verifier: All three fixable findings (2, 3, 4) have been correctly implemented. Finding 2 (missing name attributes) - FIXED: All 30+ form fields now have name attributes matching job-application.html naming convention (first-name, last-name, email, phone, street, city, state, zip, dob, position, location, salary, start-date, school-1/2/3, year-1/2/3, degree-1/2/3, employer-1/2/3, role-1/2/3, dates-1/2/3, certifications, licenses, trainings, ref-name-1/2/3, ref-relationship-1/2/3, ref-contact-1/2/3, resume, interest). All 45 labels properly paired via for/id. Finding 3 (fake success message) - FIXED: Submission handler now uses honest mailto: workflow with labelled key:value pairs, addresses to careers@ontargetaba.com, shows truthful status message instructing user to attach resume and press Send, and provides fallback "click here" link. No false success message. Finding 4 (backend integration) - FIXED: Same as Finding 2; name attributes enable future Jotform/CF Pages Function integration. Finding 1 (consolidation) correctly deferred to user decision per one-file scope. JavaScript validated, accessibility intact, HTML5 validation guards submission, no regressions.</parameter>
<parameter name="regressions">None detected. Form structure, field count, styling, and submit handler all intact. All 45 form controls remain accessible with matching labels. Resume file input correctly excluded from mailto body. No fields lost or renamed.


### assets/data/ — PASS
Findings (1):
- [low] Missing assets/data/pages.json file referenced in code

Impl: done — Created website/assets/data/pages.json placeholder with the canonical { schemaVersion: 1, pages: [] } wrapper that loadPagesJson / loadPagesJsonWithSha / buildSitemapXml and the admin Functions all expect.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/data/pages.json
Notes: Chose the create-placeholder option over the strip-references option because: (1) buildSitemapXml uses pages to mark drafts/hidden and append admin-added pages, (2) admin "create page" / "hide page" Functions write back to this same file, (3) loadPagesJsonWithSha needs a sha to do safe updates. An empty pages array is a no-op for sitemap (all STATIC_DEFAULTS emitted) and gives admin write paths a real file to update. Did not touch the stale header.js comment claiming it fetches pages.json (header.js only fetches header.json) — out of scope for this minimal fix.
Verifier: The pages.json placeholder file was correctly created with the canonical schema { schemaVersion: 1, pages: [] }. The implementation is sound: the file structure is compatible with loadPagesJson and loadPagesJsonWithSha functions which handle both array-only and object-with-pages formats. The empty pages array is a safe no-op for sitemap generation (only STATIC_DEFAULTS emitted) and provides the necessary foundation for future admin write operations. The file is properly formatted with valid JSON, correct newlines, and appropriate permissions. No regressions were introduced.


### thank-you.html — PASS
Findings (1):
- [low] favicon.svg linked twice in some pages

Impl: done — Removed the duplicate <link rel="icon" type="image/svg+xml" href="/assets/images/favicon.svg"> from the auto-seo region of website/thank-you.html. The auto-perf-start block retains the complete favicon set (svg, 32x32, 192x192 PNG, apple-touch 270x270, shortcut ico, manifest), so no icon is lost.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/thank-you.html
Notes: Removed 3 lines between auto-seo-end and auto-perf-start: the duplicate svg favicon plus a redundant PNG icon and apple-touch-icon that both pointed at footerImg.png (the auto-perf block already provides properly-sized 32x32, 192x192, 270x270 variants). Grep confirms exactly one rel=icon type=image/svg+xml link remains. Other pages may have the same duplication but were out of scope (target was thank-you.html only per ONE-FILE bucket rule). No commit, no push, no build script run.</notes>
</invoke>
Verifier: The duplicate SVG favicon link was successfully removed from the auto-seo section of thank-you.html. The file now contains exactly one rel="icon" type="image/svg+xml" link, located in the auto-perf-start block (line 431). All other favicon variants (32x32 PNG, 192x192 PNG, apple-touch-icon, shortcut ico, manifest) remain intact. No regressions detected.


### pre-intake-form.html — PASS
Findings (1):
- [low] Font preload uses relative href without leading slash

Impl: done — Added leading slashes to font preload and CSS stylesheet hrefs in pre-intake-form.html so they resolve correctly from nested URLs (e.g., /pre-intake-form/).
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/pre-intake-form.html
Notes: Per one-file scope rule, only pre-intake-form.html was edited. The other files mentioned in the finding (contact.html, employment-application.html, job-application.html, etc.) were NOT modified. Changed lines 31-33: relative paths assets/fonts/... and assets/css/app.css became /assets/fonts/... and /assets/css/app.css. No commit/push performed.
Verifier: All three hrefs specified in the finding were correctly updated with leading slashes. Line 31 (plus-jakarta-sans-600.woff2), line 32 (plus-jakarta-sans-400.woff2), and line 33 (app.css) now all have the correct absolute paths starting with /assets/. The fix allows these resources to resolve correctly from nested URLs like /pre-intake-form/.
⚠️ Regressions: Potential inconsistency: Line 515 has an image src (assets/images/kid-transparent-background-13.png) and line 598 has a script src (assets/js/app.js) that still use relative paths without leading slashes. These could break when accessed from nested URLs, but they were not part of the original finding scope, so they are not considered regressions of the specified fix.

### admin/head-scripts.html — PASS
Findings (1):
- [medium] Missing label association for scripts textarea in head-scripts.html

Impl: done — Wrapped the "HTML content" heading text in a <label for="scripts"> inside the existing <h2> so the scripts textarea has a proper associated label for screen readers, while preserving the heading's visual styling and all existing JS behavior.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/head-scripts.html
Notes: Minimal surgical change: only the <h2> on line 76 was modified — text became <label for="scripts">HTML content</label> inside the same <h2 class="admin-h2"> so it stays visually identical. Textarea id="scripts" and all event bindings unchanged. No new deps, no build steps, no commit/push.
Verifier: The label association fix was correctly implemented on line 76 of head-scripts.html. The textarea now has a proper <label for="scripts"> element wrapping the "HTML content" text inside the <h2> heading. This establishes the required semantic relationship for screen readers while preserving visual styling and all existing JS behavior. The change is minimal, surgical, and introduces no regressions.


### admin/header.html — PASS
Findings (1):
- [low] Form fields in header.html and footer.html lack proper label-to-input associations

Impl: done — Added id attributes to every data-bind/data-k/data-path-key input in website/admin/header.html and matching for="" attributes on their <label> tags. Static fields use stable string ids (announcement-text, logo-src, cta-phone-href, etc.); dynamic repeater rows (nav links, breadcrumb paths, crumbs, section map) compute unique ids per index so each row's label associates with its own input. JS selectors continue to use the data-* attributes, so behavior is unchanged.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/header.html
Notes: Only the requested target file (header.html) was edited per the ONE-FILE bucket rule; footer.html was mentioned in the finding text but is out of scope for this round. Verified post-edit: zero labels without a for="" attribute remain in header.html. No build/commit/push performed.
Verifier: The implementer correctly added id attributes to every form input and matching for="" attributes to all labels in header.html. Static fields use stable string ids (announcement-text, logo-src, cta-phone-href, etc.) and dynamic repeater rows (nav links, breadcrumb paths, crumbs, section map) compute unique ids per index. All 10 static input fields + all dynamically-generated repeater rows have proper label-to-input associations via id/for attributes. JavaScript behavior remains unchanged—data-* attributes are still used for functional bindings. No regressions detected.


### index.html — PASS
Findings (3):
- [low] 14 images use data-hide-on-error attribute but no JavaScript handler exists
- [low] Inconsistent asset path formats across pages (relative vs absolute)
- [low] Duplicate favicon and apple-touch-icon links in index.html

Impl: done — Implemented audit findings round-2 on website/index.html. Finding 1 already addressed (delegated error listener for data-hide-on-error exists at lines 1651-1656). Finding 2: switched the 3 font preloads, app.css link, and app.js script tag in the head from relative to absolute paths. Finding 3: removed the exact-duplicate favicon.svg <link> (former line 574 was identical to line 567).
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/index.html
Notes: Finding 1 was a no-op: index.html already contains a delegated `img[data-hide-on-error]` error handler in a `<script>` block just before `</body>` (lines 1651-1656). No JS edit needed; skipped per "If already addressed in current code, skip with reason" rule.

Finding 2 scope: normalized head-resource paths (3 font preloads, app.css stylesheet, app.js script) from `assets/...` to `/assets/...`. Did NOT change the 14 inline `<img src="assets/...">` content references because (a) the finding's Fix explicitly listed "fonts and CSS" and (b) touching 14 unrelated img tags exceeds the "minimal surgical edits" rule.

Finding 3 nuance: the finding cited lines 572-573 as duplicates with identical hrefs, but inspection showed those two lines were actually unique 32x32 and 192x192 PNG favicons. The TRUE exact duplicate was former line 574 (`<link rel="icon" type="image/svg+xml" href="/assets/images/favicon.svg">`), identical to line 566/567. Removed that one only; the size-specific PNG entries on (former) 572-573 and the apple-touch-icon size variant on 575 are content-distinct and kept.

No commits, pushes, or build scripts run, per instructions.
Verifier: All three audit findings have been correctly addressed. Finding 1 (data-hide-on-error handler) was already present in the code (lines 1651-1656) and requires no action. Finding 2 (asset path standardization) has been correctly implemented - all preload font links (lines 31-33), the app.css stylesheet (line 34), and the app.js script (line 1650) now use absolute paths with leading slash (/assets/...). Finding 3 (duplicate favicon removal) is correct - line 568 contains the generic PNG favicon, lines 573-575 contain size-specific and apple-touch variants with unique hrefs, and no exact duplicate SVG favicon entry exists. All changes are consistent with the audit requirements and represent proper, minimal surgical edits.
⚠️ Regressions: None detected. The changes are minimal, focused, and do not introduce any regressions. The delegated error handler for data-hide-on-error was already in place and functioning correctly. Asset paths remain consistent within their intended scope (head resources vs. inline image sources), and favicon entries are now properly deduplicated without affecting any functional links.

### admin/ — PASS
Findings (1):
- [low] No admin page for per-page SEO metadata editing

Impl: done — Applied option 2 of the finding: removed the misleading /assets/data/pages.json reference from the header.js file-header comment and added a one-line clarification that per-page SEO metadata is not managed by this admin. Option 1 (building /admin/pages.html + /api/pages endpoints) would be a major feature addition, not a surgical edit, and is therefore out of scope. The remaining pages.json references in website/functions/_utils.js are legitimate (sitemap/page-registry pipeline reading the existing {schemaVersion:1, pages:[]} stub) and untouched.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/js/header.js
Notes: Premise of the finding was partly wrong: pages.json DOES exist at website/assets/data/pages.json (empty stub: {schemaVersion:1, pages:[]}) and is used by functions/_utils.js for sitemap generation. The actual bug was the comment in assets/js/header.js claiming to fetch pages.json when the code only ever fetches header.json. The actual admin folder is much smaller than CLAUDE.md describes (only Posts/Header/Footer/Widget/Head-Scripts editors exist) — CLAUDE.md is aspirational. No new files, no new endpoints, no commits.
Verifier: The implementer correctly addressed the finding using surgical comment updates. The misleading claim that header.js fetches pages.json was removed from the file-header comment, and a clarification was added that per-page SEO metadata is not managed by this admin. The actual code was already correct (fetch was removed in commit c2c5cf1), and the remaining pages.json references in _utils.js are legitimate uses for sitemap generation. The empty pages.json stub was properly restored with the correct schema structure expected by the codebase.


### privacy-policy.html — PASS
Findings (1):
- [medium] Leadbot localStorage usage not disclosed in Privacy Policy

Impl: done — Added a localStorage disclosure to website/privacy-policy.html covering the leadbot widget's ota_leadbot_v1 key, and renamed the section/TOC entry to "Cookies & local storage".
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/privacy-policy.html
Notes: Inserted a new paragraph in the existing #cookies section explaining that browser localStorage (key: ota_leadbot_v1) is used to persist intake widget responses, that data stays local until a form is submitted, and that users can clear it via browser settings. Updated the heading and TOC link from "Cookies" to "Cookies & local storage" so the disclosure is discoverable. No other files modified; no build scripts run; no commits.</notes>
</invoke>
Verifier: The localStorage disclosure for ota_leadbot_v1 has been properly added to the "Cookies & local storage" section (lines 658-662). The section heading and TOC entry were correctly renamed to reflect the expanded scope. The disclosure accurately explains that browser localStorage persists intake widget responses locally on the user's device and is only transmitted if a form is submitted, plus how users can clear it via browser settings. This fully addresses the finding with no regressions.


### index.html) — PASS
Findings (1):
- [low] Fraunces display font not preloaded (only Plus Jakarta Sans preloaded)

Impl: done — Added preload link for fraunces-700.woff2 in the <head> of website/index.html, immediately after the existing Plus Jakarta Sans preloads. Uses the same relative path convention (assets/fonts/...) and crossorigin attribute as the existing entries. Scope was limited to the single target file per the ONE-FILE bucket rule.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/index.html
Notes: Verified fraunces-700.woff2 exists in website/assets/fonts/. The finding mentions "all HTML pages" but the task explicitly targets only website/index.html (ONE-FILE bucket). Other pages would need the same preload added in a separate pass — consider adding it to scripts/selfhost-fonts.mjs so the build pipeline injects it across every page consistently.
Verifier: Fraunces-700.woff2 preload link was successfully added to website/index.html on line 33, correctly positioned after existing Plus Jakarta Sans preloads, with matching syntax and valid relative path to an existing font file. No regressions detected.


### blog.html — PASS
Findings (1):
- [medium] Inline onerror attributes still present in blog.html and blog/post.html

Impl: partial — Removed inline onerror attribute from the dynamic card template in website/blog.html. Cards now carry data-fallback-src; a delegated capture-phase 'error' listener on els.grid swaps to the fallback image. The blog/post.html occurrence in the finding is out of scope for this one-file bucket (TARGET = website/blog.html).
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/blog.html
Notes: Two edits in blog.html: (1) cardHtml() template: replaced onerror=\"this.src='...'\" with data-fallback-src=\"...\"; (2) attachHandlers(): added els.grid.addEventListener('error', ..., true) — uses capture phase because the error event does not bubble. Guarded against fallback-loop with a src !== fallback check. The featuredImg.onerror line (742) is a JS property assignment, not an inline HTML attribute, so it's CSP-compliant and left alone. blog/post.html line 247 was listed in the finding but is outside the one-file TARGET scope.
Verifier: The implementer successfully fixed the primary finding: replaced the inline onerror attribute in the card template (line 725) with a data-fallback-src attribute and implemented a proper delegated capture-phase error handler (lines 792-797) to manage image fallbacks. The implementation is correct, properly guards against infinite loops, and handles event delegation on a non-bubbling error event. The note about blog/post.html (line 250) was correctly identified as out of scope for the single-file TARGET. The featuredImg.onerror property assignment (line 742) is correctly left alone as it's CSP-compliant JavaScript and not an inline HTML attribute.
⚠️ Regressions: No regressions detected. The changes are minimal and focused: (1) removed one inline onerror from the dynamic card template, (2) added a delegated error listener to the grid element. The handler attachment happens before rendering, timing is correct, HTML escaping is properly applied, and loop prevention guards are in place.

### optimize-pages.py — PASS
Findings (1):
- [low] CSS and vendor JS use relative paths without leading slash

Impl: done — Patched optimize-pages.py add_cache_bust() to prepend a leading slash to in-repo asset paths (assets/css|js|vendor/...) when injecting the ?v=<sha> cache-bust. The existing regex already matches both relative and absolute forms; the surgical change normalizes the captured path to absolute in the replacement. On the next build.sh run this rewrites every relative href/src in HTML pages (e.g. contact.html line 33, employment-application.html line 33, and the universal app.js src) to /assets/... so they resolve correctly under nested routes like /blog/posts/{slug} (which sets <base href="/blog/">). No HTML pages edited per the "do not run build" rule; the build pipeline self-heals on next deploy. Verified the file still compiles via py_compile.
Files: C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/scripts/optimize-pages.py
Notes: Finding addressed by fixing the build script (root cause) rather than hand-editing 30 HTML files; the HTML normalizes on the next build.sh run. Scope verified: regex matches in-repo assets/{js,css,vendor}/ only (no third-party CDNs). Blog post.html already uses absolute paths so behavior there is unchanged. No new deps, no new build steps, no functional change beyond the leading-slash normalization.</notes>
</invoke>
Verifier: The implementer successfully fixed the finding by adding 4 lines to normalize relative asset paths to absolute paths in optimize-pages.py's add_cache_bust() function. The fix correctly prepends a leading slash to relative paths (like "assets/css/app.css") before appending cache-bust parameters, ensuring assets resolve from the root domain even when pages are served from nested routes with <base href> attributes. The change is surgical, idempotent, maintains scope (only matching in-repo assets), excludes third-party CDNs and non-js/css files, and introduces no regressions.
⚠️ Regressions: None detected. The fix is idempotent (already-absolute paths unchanged, no double-slashing), properly scoped (regex excludes CDNs and non-matching assets), and does not affect any other files or build pipeline components.
