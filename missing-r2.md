# Round-2 Audit — Post Wave-1..5

After waves 1-5 (redirects + 110 findings implemented across 3 waves + tour),
this round looked for: regressions, live-site bugs, CSP gaps, residual a11y/perf
issues, and admin gaps. 42 confirmed: 10 high / 18 medium / 14 low.

## Accessibility - Focus Management

### Missing focus trap and focus restoration in leadbot modal dialog

**Severity:** high
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/js/leadbot.js (lines 362-414)`

The leadbot panel is marked with role='dialog' and aria-label, but lacks keyboard focus management: (1) when opened, focus is not moved to the first focusable element inside the panel, (2) no focus trap to keep Tab/Shift+Tab cycling within the dialog, (3) when closed, focus is not restored to the trigger button. This violates ARIA authoring practices for dialogs.

**Fix:** Add focus management: In openPanel(), find first focusable element (button, input, a) and call focus(). Implement keydown listener for Tab/Shift+Tab to trap focus within panel. In closePanel(), restore focus to the avatar button using a saved reference.

## Accessibility - Form Inputs

### Leadbot inputs lack proper form field association

**Severity:** medium
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/js/leadbot.js (lines 243-254)`

Input elements in the leadbot widget are created without explicit associations to their labels. While the inputs are functionally usable, screen reader users may not hear the label when focusing the input. The label needs a 'for' attribute matching the input's 'id'.

**Fix:** Ensure each input gets a unique id attribute and each label gets a matching for attribute. This allows assistive technology to announce field names properly when focused.

## Accessibility - Form Labels

### Missing label-to-input associations in leadbot contact form

**Severity:** high
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/js/leadbot.js (lines 238-255)`

The leadbot widget creates labels and inputs programmatically, but the labels lack 'for' attributes and inputs lack 'id' attributes. This breaks the semantic connection for screen reader users. Lines 239-254 create label elements with textContent only (no for=), then create inputs without IDs.

**Fix:** Generate unique IDs for each input and set label.htmlFor = inputId. Example: i.id = 'lb-' + f.name + '-' + Date.now(); lbl.htmlFor = i.id;

## Accessibility / Form Handling

### Job application form still uses alert() with no form submission

**Severity:** high
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/job-application.html:516`

job-application.html still contains inline alert() in the form's onsubmit handler: onsubmit="event.preventDefault(); alert('Thank you &mdash; we will be in touch.'); this.reset();". This is flagged as a high-severity regression from Wave 2-4 work (was supposed to be fixed). Users cannot actually submit this form; it only resets and shows a fake success message.

**Fix:** Replace the inline alert with actual form submission logic (POST to an API endpoint or redirect to thank-you page). Remove the alert() entirely and implement proper form validation + submission handler.

## Admin Dashboard Metrics

### "Posts" stat counts all posts instead of only published posts

**Severity:** medium
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/index.html, lines 164-166`

The dashboard shows "Posts", "Drafts", and "Hidden" as three separate stats. However, "Posts" currently displays the total count of all posts (including drafts and hidden ones). Logically, "Posts" should show only live (published) posts, similar to how WordPress separates "Published", "Draft", and "Trash". Currently: Posts = 50 would actually mean 50 total, with some being drafts/hidden, making the stat confusing.

**Fix:** Change line 166 to: `const live = posts.filter(p => !p.draft && !p.hidden).length;` and display `live` instead of `posts.length`.

## Architecture / Data Wiring

### Widget loading controlled by mode but leadbot localStorage persists anyway

**Severity:** high
**Where:** `assets/js/app.js (loadWidget, lines 260-303), assets/js/leadbot.js (lines 114-123), assets/data/widget.json`

The app.js loadWidget() function checks widget.json, finds mode='leadtrap', and loads the LeadTrap script from app.leadtrap.ai. However, leadbot.js (which is NOT loaded) still defines a localStorage key 'ota_leadbot_v1' that persists client-side. If an admin later switches from leadtrap back to leadbot mode, or if there are any fallback paths, orphaned localStorage data will exist and may cause confusion or unexpected behavior. More critically, there is a mismatch: leadbot.js (lines 114-123) actively saves state to localStorage even though the widget is configured to use leadtrap, meaning the investment in stateful widget flow is wasted.

**Fix:** Either: (A) Remove the localStorage persistence from leadbot.js since it is not active (if leadtrap is the definitive choice), OR (B) add a cleanup function in app.js that clears 'ota_leadbot_v1' localStorage when leadtrap mode is active, OR (C) switch back to leadbot and remove the leadtrap partner ID from widget.json. Document which widget system is the canonical choice.

## CSP & Security

### Protocol-relative URL in WhatConverts tracking script

**Severity:** high
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/data/head-scripts.json (line 3, within the scripts string)`

The WhatConverts tracking script uses a protocol-relative URL (//s.wc-data.com/159348/wc.js) instead of https://. This appears in assets/data/head-scripts.json and is injected into all pages. While the CSP allowlist includes https://s.wc-data.com, protocol-relative URLs may not match CSP host directives correctly in all browsers, potentially causing the script to be blocked or fail to load properly. This is a common CSP bypass vector that can manifest inconsistently across browsers.

**Fix:** Replace the protocol-relative URL with an absolute HTTPS URL: //s.wc-data.com/159348/wc.js → https://s.wc-data.com/159348/wc.js in assets/data/head-scripts.json. This ensures consistent CSP matching across all browsers and explicitly declares that only HTTPS is accepted.

## CSP Configuration

### Unused iframe hosts in CSP may indicate over-permission or incomplete cleanup

**Severity:** low
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/_headers (line 40, public pages CSP, frame-src directive)`

The public pages CSP includes https://www.youtube.com in frame-src, but no YouTube embeds exist anywhere on the site (verified across all HTML files). While this doesn't cause immediate issues and future pages might use YouTube, it represents unnecessary permission that increases the attack surface if another vulnerability is discovered.

**Fix:** Optionally remove https://www.youtube.com from frame-src in _headers if no plans exist to use YouTube embeds in the near future. If YouTube will be added soon, document this in a comment in _headers. Current allowance: frame-src 'self' https://form.jotform.com https://www.jotform.com https://app.leadtrap.ai https://www.google.com https://www.youtube.com ... — remove the YouTube entry if not needed.

## Code Quality / Fragility

### API endpoint signature inconsistency - recent-prs missing data parameter

**Severity:** low
**Where:** `functions/api/recent-prs.js line 20: 'export const onRequestGet = async ({ request, env })' should include 'data'`

/api/recent-prs onRequestGet signature is missing the 'data' parameter that the middleware provides to all other protected /api/* endpoints. While the middleware auth check still works (auth is enforced), the function doesn't accept the data object, making it fragile and inconsistent with other endpoints. If the code evolves, someone might mistakenly think data isn't available here.

**Fix:** Add 'data' to the function signature: 'export const onRequestGet = async ({ request, env, data })' for consistency with other protected API endpoints, even though it's not currently used. This follows the Cloudflare Pages pattern and makes it clear auth is enforced.

## Code Quality/Fragility

### Many pages use relative href attributes without leading slash

**Severity:** medium
**Where:** `All pages except blog/post.html and admin pages: aba-therapy-guide.html, about.html, autism-testing.html, blog.html, careers.html, center-based-aba-therapy.html, contact.html, cookie-consent.html, disclaimer.html, early-intervention-autism-program.html, employment-application.html, faqs.html, gahanna-ohio.html, in-home-aba-therapy.html, index.html, insurance.html, locations.html, mayfield-ohio.html, murray-utah.html, our-process.html, our-services.html, potty-training-program.html, pre-intake-form.html, privacy-policy.html, terms-of-service.html, thank-you-confirmation.html, thank-you.html, worthington-ohio.html`

28 pages use relative links like href="contact.html" instead of href="/contact.html". While these work currently due to Cloudflare Pages' URL rewriting (which strips .html), this is fragile and could break if the site structure changes or during local development. Additionally, if the pretty-URL rewriting fails, links would resolve incorrectly on pages served at deeper paths.

**Fix:** Replace all relative href attributes like `href="contact.html"` with absolute root-relative paths `href="/contact.html"` or `/contact` (both work with CF Pages). This ensures links work consistently regardless of page depth or URL structure.

### 17 pages use relative image src paths without leading slash

**Severity:** medium
**Where:** `about.html, autism-testing.html, careers.html, center-based-aba-therapy.html, early-intervention-autism-program.html, employment-application.html, gahanna-ohio.html, in-home-aba-therapy.html, index.html, insurance.html, job-application.html, mayfield-ohio.html, murray-utah.html, our-services.html, potty-training-program.html, pre-intake-form.html, worthington-ohio.html`

17 pages load images with relative paths like src="assets/images/image.png" instead of src="/assets/images/image.png". While this works for root-level pages, it would fail on pages served at deeper paths. This is less critical than links (since these pages aren't served at deeper paths currently), but it's still fragile.

**Fix:** Replace all relative image src attributes like `src="assets/images/..."` with absolute root-relative paths `src="/assets/images/..."`. This ensures images load correctly regardless of page depth.

## Cross-File Scope / Widget Architecture

### Leadbot widget code loaded but widget.json configured to use leadtrap

**Severity:** medium
**Where:** `assets/js/leadbot.js (entire file unused), assets/js/app.js:260-303 (loadWidget function checks mode='leadtrap' and skips leadbot), assets/data/widget.json (mode is hardcoded to 'leadtrap')`

assets/js/leadbot.js exists and loads successfully on all pages, but widget.json is set to mode: 'leadtrap' with a partnerId, meaning the in-repo leadbot code runs but is never actually used. This is not technically broken (leadtrap widget loads and works), but it represents dead code in the repository and potential confusion about which widget is active. The localStorage key 'ota_leadbot_v1' still accumulates data even though leadtrap is the active widget.

**Fix:** Either (a) remove assets/js/leadbot.js if leadtrap is the permanent choice, or (b) update widget.json to mode='leadbot' if the intent is to use the in-repo widget. Clean up any localStorage pollution from the unused widget.

## Cross-Page Consistency

### Two employment application pages with conflicting implementations

**Severity:** medium
**Where:** `employment-application.html (full page), job-application.html (full page), careers.html (links to both)`

employment-application.html and job-application.html serve the same business purpose but are implemented completely differently. employment-application.html has no name attributes and a fake success modal; job-application.html has proper names and an alert() + reset (lines 516, 677). Users visiting one vs. the other will experience radically different UX and data capture. The /employment-application page is linked from the careers page hero (line 482). This creates confusion about which form is canonical.

**Fix:** Consolidate: delete employment-application.html and link all CTAs to job-application.html (which already has proper field names), OR update employment-application.html to match job-application.html's naming and submission pattern, then remove the duplicate from the site. If both are meant for different audiences, add clear labeling and ensure both are fully wired.

## Data Integrity

### Missing assets/data/pages.json file referenced in code

**Severity:** low
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/data/ (file does not exist)`

The codebase references pages.json in multiple places (header.js, _utils.js loadPagesJson() function) but the file does not exist in assets/data/. This file is used for sitemap generation and per-page config. Currently loadPagesJson() gracefully returns [] if missing, so there's no runtime error, but the comment in header.js suggests it should exist.

**Fix:** Either create an empty assets/data/pages.json file with [] or {} as a placeholder, or remove all references to pages.json from code comments and the API if this feature is not being used.

## Duplicate favicon link (benign)

### favicon.svg linked twice in some pages

**Severity:** low
**Where:** `website/thank-you.html lines 426 and 432, and likely other pages`

Wave 4 site-wide implementation added favicon links in two separate sections (auto-seo-start and auto-perf-start blocks), resulting in duplicate <link rel="icon" type="image/svg+xml" href="/assets/images/favicon.svg"> tags on some pages. This has no functional impact (browsers ignore duplicates), but is minor redundancy.

**Fix:** Optional: Remove the duplicate favicon link from one of the two sections (either auto-seo-end or auto-perf-start) to clean up the head. No functional issue if left as-is.

## Font Loading / Performance

### Font preload uses relative href without leading slash

**Severity:** low
**Where:** `pre-intake-form.html:31-32, contact.html:31-32, employment-application.html:31-32, job-application.html:31-32, and many others`

CSS and font preload links use relative paths: href="assets/fonts/..." instead of href="/assets/fonts/...". While fonts may load on root pages, this breaks on nested pages.

**Fix:** Add leading slashes: href="/assets/fonts/plus-jakarta-sans-600.woff2"

## Form Accessibility

### Missing label association for scripts textarea in head-scripts.html

**Severity:** medium
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/head-scripts.html, line 80`

The textarea with id="scripts" does not have an associated <label> element with a for="scripts" attribute. The <h2> heading says "HTML content" but this is not semantically linked to the form control. Screen reader users may not understand what this textarea is for.

**Fix:** Add <label for="scripts">HTML content</label> as a proper form label (not just relying on the section heading). Or wrap the textarea in a <label> element with the text.

### Form fields in header.html and footer.html lack proper label-to-input associations

**Severity:** low
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/header.html and footer.html (lines 78-110+)`

Fields using data-bind or data-k attributes have labels but no proper for="" attributes linking them to input IDs. For example: <label>Text</label><input data-bind="announcementBar.text" />. While the label text is visible, screen readers and keyboard navigation may not properly associate label with input. This works for wrapping patterns but these are not wrapped.

**Fix:** Add id attributes to all form inputs and matching for="" attributes to labels. Example: <label for="announcement-text">Text</label><input id="announcement-text" data-bind="announcementBar.text" /> (applies to all data-bind and data-k inputs)

## Form Data Collection / Backend Integration

### employment-application.html form inputs lack name attributes

**Severity:** high
**Where:** `employment-application.html (sections 1-7, lines 524-792)`

All input fields in employment-application.html are missing name attributes (lines 524, 528, 532, 536, 540, 544, 548, 552, 556, 569, 584, 592, 596, and more in sections 3-7). Without name attributes, form data cannot be submitted to a backend endpoint—form.submit() or fetch() will not bind values. The form shows a fake success message (lines 854-859) instead of actually posting data. This blocks the entire employment application workflow. Job-application.html (which was already fixed) correctly includes name attributes on all inputs.

**Fix:** Add name attributes matching the job-application.html naming convention: first-name, last-name, email, phone, street, city, state, zip, dob, position, location, salary, start-date, education fields (school-1, year-1, degree-1, etc.), employment fields (employer-1, role-1, dates-1, etc.), certifications, licenses, trainings, references (name, relationship, contact), resume. Also wire a real form submission handler that posts to a backend endpoint or integrates with Jotform.

## Functionality

### Employment application form misleads users with fake success message

**Severity:** high
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/employment-application.html:823-866`

employment-application.html form shows a success message saying 'Thank you — your application was received' (line 853), but it doesn't actually submit the form data anywhere. The inline comment (lines 848-850) states 'No backend wired for this form yet'. This misleads users into thinking their application was submitted when it wasn't.

**Fix:** Wire the form to actually submit to a backend endpoint, Jotform, or email service. Do not show a success message unless the submission actually succeeded. Consider redirecting to a thank-you page on successful submission.

## Functionality/User Experience

### Job application form uses inline alert() and doesn't submit

**Severity:** high
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/job-application.html:513`

job-application.html line 513 has an inline onsubmit attribute with `onsubmit="event.preventDefault(); alert('Thank you &mdash; we will be in touch.'); this.reset();"` This is a regression from the previous audit which moved away from inline event handlers. The alert() provides poor UX and the form doesn't actually submit anywhere.

**Fix:** Replace the inline onsubmit handler with a delegated event listener in a separate <script> block that sends the form data to a backend endpoint or Jotform, matching the pattern used in employment-application.html.

## Image Performance / Attribute Mismatch

### 14 images use data-hide-on-error attribute but no JavaScript handler exists

**Severity:** low
**Where:** `index.html (14 images with data-hide-on-error attribute, primarily in insurance/partner logos section)`

14 images in index.html use the custom data-hide-on-error attribute (found via grep). This attribute is not handled by any JavaScript in app.js, so broken images are not hidden. This overlaps with the onerror issue but represents a different strategy that was never completed.

**Fix:** Either (a) add a delegated listener in app.js to handle data-hide-on-error, or (b) remove the attribute and use inline onerror like the rest of the site (inconsistent but works), or (c) use the proper delegated pattern for all images.

## Incomplete Data Integration - Needs User Action

### Facebook Pixel ID not configured (blank placeholder)

**Severity:** medium
**Where:** `website/assets/data/head-scripts.json (no Facebook Pixel entry)`

Wave 2 report notes that head-scripts.json has GA4 and Google Ads configured, but Facebook Pixel was intentionally skipped because no numeric Pixel ID was provided. The JSON contains only Hotjar and WhatConverts, missing Facebook Pixel entirely.

**Fix:** User must retrieve the Facebook Pixel ID from Facebook Ads Manager (Events Manager > Data Sources) or legacy WP PixelYourSite settings, then log into https://beta.ontargetaba.com/admin/head-scripts.html and paste the Facebook Pixel snippet. The admin UI already supports this via the textarea save flow.

## Inline Event Handlers / Accessibility

### 38 img tags use inline onerror handlers instead of delegated listeners

**Severity:** medium
**Where:** `about.html (3), autism-testing.html (1), blog/post.html (1), blog.html (1), careers.html (1), center-based-aba-therapy.html (1), early-intervention-autism-program.html (2), employment-application.html (1), faqs.html (4), gahanna-ohio.html (2), icon-attribution.html (1), in-home-aba-therapy.html (1), index.html (0 checked but likely has data-hide-on-error), insurance.html (1), locations.html (1), mayfield-ohio.html (1), murray-utah.html (1), our-process.html (1), our-services.html (1), potty-training-program.html (1), worthington-ohio.html (1) — 38 total`

38 images across the site use inline onerror attributes (e.g., onerror="this.style.display='none'") to handle broken images. This was flagged in the earlier audit as needing conversion to delegated event listeners in app.js. The first audit noted this as a regression in blog.html and blog/post.html, but it persists across many other pages (about.html, careers.html, center-based-aba-therapy.html, etc.).

**Fix:** Replace all inline onerror="this.style.display='none'" with a delegated listener in app.js that watches for error events and hides images, similar to how FAQ accordions are wired.

## JavaScript / API Design

### window.open() called with invalid 'noopener' parameter

**Severity:** medium
**Where:** `assets/js/leadbot.js:311`

In assets/js/leadbot.js:311, window.open(target, '_blank', 'noopener') uses 'noopener' as the third argument. The third parameter of window.open() is windowFeatures (a comma-separated list like 'width=800,height=600'), not a security feature. 'noopener' is only valid as rel="noopener" on anchor tags. This call likely fails silently or the third parameter is ignored by browsers.

**Fix:** Remove the third 'noopener' argument: window.open(target, '_blank'). The security is already set on the anchor tag at line 297 with btn.rel = 'noopener'.

## JavaScript / Event Binding

### Leadbot listener delegates click events but uses 'click' instead of delegated pattern on nested buttons

**Severity:** low
**Where:** `assets/js/leadbot.js (lines 357-414)`

In leadbot.js (lines 358-389), the code directly attaches event listeners to bubble.querySelector('.lb-close') and panel.querySelector('.lb-x'), which works because these elements exist at initialization time. However, the closeBtn and xBtn references are cached, meaning if the panel is removed and re-added from the DOM (unlikely but possible), the listeners are orphaned. While not a current bug (the panel is appended once at line 110), this is fragile compared to delegated event patterns used elsewhere in app.js.

**Fix:** No immediate fix required if panel is never re-added. For robustness, consider using event delegation: attach a single click listener to the launcher or panel that checks for closest('.lb-close') or closest('.lb-x'), matching the pattern in app.js lines 54-74.

## Missing Admin Features

### No admin page for per-page SEO metadata editing

**Severity:** low
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/`

The admin dashboard does not have a dedicated CRUD page for editing per-page SEO metadata (title, description, OG tags) for static pages. The header comments in header.js reference /assets/data/pages.json (which does not exist), suggesting this feature was planned but never built. Currently, each page's SEO metadata must be edited directly in the HTML or the feature is missing entirely.

**Fix:** Either: (1) Build /admin/pages.html to manage per-page SEO metadata and create /api/pages endpoints (GET/PUT), or (2) Remove the pages.json reference from code comments and clarify that per-page SEO editing is not supported in this admin.

## Missing Implementation - Cross-File Scope

### Employment application form lacks name attributes for backend integration

**Severity:** medium
**Where:** `website/employment-application.html (lines ~350-450)`

The employment-application.html form was fixed to remove alert() and add accessible validation (Wave 3 finding), but the form inputs still lack 'name' attributes. This means even with a backend Jotform or API endpoint wired, the submission would not include field data. The Wave 3 report correctly notes this requires either a Jotform ID or backend endpoint configuration from the user.

**Fix:** User must either provide a Jotform ID for employment applications so the form can be converted to a Jotform embed, or provide a CF Pages Function endpoint. Once provided, add name attributes to all form inputs (name, email, phone, position, etc.) to match the field structure expected by the backend.

## Missing Privacy Disclosure - Out of Scope for Single-File Edits

### Leadbot localStorage usage not disclosed in Privacy Policy

**Severity:** medium
**Where:** `website/privacy-policy.html (missing localStorage disclosure in 'Data We Collect' section)`

Wave 3 and Wave 4 reports note that leadbot.js uses localStorage to persist responses (key: ota_leadbot_v1) but this was intentionally not added to privacy-policy.html due to ONE-FILE bucket constraints. The leadbot.js file was edited without modifying privacy-policy.html, per the single-file rule.

**Fix:** Add the following disclosure to privacy-policy.html in the 'Data We Collect' or 'Cookies & Local Storage' section: 'We use browser localStorage to persist your responses in our intake widget (ota_leadbot_v1 key) to avoid re-asking the same questions. This data is stored locally on your device and is not transmitted to our servers unless you submit a form.'

## Performance - Font Loading

### Fraunces display font not preloaded (only Plus Jakarta Sans preloaded)

**Severity:** low
**Where:** `All HTML pages (e.g., C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/index.html)`

The site preloads Plus Jakarta Sans (body font) in the <head> but does not preload Fraunces (display font used for all headings). This can cause text reflow/flash when Fraunces loads, especially on slower connections. Fraunces is critical for above-the-fold headings on all pages.

**Fix:** Add preload links for Fraunces font in the <head> of all pages. At minimum, preload fraunces-700.woff2 (the weight used for h1/h2 on hero sections). Example: <link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/fonts/fraunces-700.woff2">

## Performance - Image Handling

### data-hide-on-error attribute used on index.html but not handled by JavaScript

**Severity:** medium
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/js/app.js`

index.html uses data-hide-on-error attribute on 14 images (mainly insurance logos), but app.js does not contain any handler for this attribute. The attribute is rendered but inactive, meaning broken images will not be hidden as intended. This looks unfinished from the refactoring.

**Fix:** Add a delegated error handler in app.js that listens for error events on images with data-hide-on-error and hides them via classList.add('hidden'). Example: document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG' && e.target.hasAttribute('data-hide-on-error')) { e.target.classList.add('hidden'); } }, true);

## Regression - Event Handlers

### Inline onerror attributes still present in blog.html and blog/post.html

**Severity:** medium
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/blog.html (line 722) and blog/post.html (line 247)`

Despite documentation stating that inline onerror attributes were replaced with delegated listeners, two files still contain inline onerror handlers. blog.html line 722 has inline onerror in a dynamically generated HTML template string, and blog/post.html line 247 has inline onerror on the hero image. This violates CSP best practices and is harder to maintain than delegated listeners.

**Fix:** Replace inline onerror with delegated event listeners. In blog.html line 722, remove the onerror attribute from the template and add a delegated error handler. In blog/post.html line 247, remove the inline onerror and handle the error in JavaScript via addEventListener('error'). Alternatively, use data-* attributes and process them with a delegated listener in app.js.

## Regression / Data Structure Mismatch

### PR branch name not displaying on admin dashboard due to API/frontend naming mismatch

**Severity:** medium
**Where:** `functions/api/recent-prs.js line 67 returns 'headBranch', but admin/index.html line 201 and admin/admin.js line 185 read 'pr.branch'`

/api/recent-prs returns { headBranch, ... } but admin/index.html and admin/admin.js expect { branch, ... }. The branch column in the dashboard PR table displays empty, and the PR-submitted modal doesn't show the branch name. This is a regression introduced in the recent-prs API implementation.

**Fix:** Change line 67 in functions/api/recent-prs.js from 'headBranch: p.head && p.head.ref,' to 'branch: p.head && p.head.ref,' to match the naming convention established by _utils.js createPr() which returns { branch: head }

## Relative Path Consistency

### CSS and vendor JS use relative paths without leading slash

**Severity:** low
**Where:** `Every HTML page (auto-generated by optimize-pages.py): pre-intake-form.html:33, contact.html:33, employment-application.html:33, job-application.html:33, etc.`

Link and script tags reference assets with relative paths: href="assets/css/app.css" and src="assets/vendor/tailwind.js" instead of absolute paths. Works on root but breaks on nested routes. This is systematic across pages generated by the build process.

**Fix:** Update optimize-pages.py to generate absolute asset paths when injecting the perf block, or ensure all pages are served from the root level only (not nested routes).

## Security

### Unsanitized HTML injection in custom widget mode

**Severity:** medium
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/assets/js/app.js (lines 244-258, injectHtmlWithScripts function)`

The app.js loadWidget() function accepts arbitrary HTML snippets from widget.json and injects them via injectHtmlWithScripts(). While the custom.snippet field is currently empty and widget.json is admin-controlled, there is no client-side HTML sanitization. If the admin panel is compromised or if user input is ever allowed, this could enable XSS attacks. The function uses template.innerHTML which can parse malicious content.

**Fix:** Add client-side HTML sanitization using DOMPurify (already loaded on blog/post.html for markdown). In app.js injectHtmlWithScripts(), sanitize the snippet before parsing: tmpl.innerHTML = DOMPurify.sanitize(html) before querySelectorAll. Alternatively, only allow specific whitelist of attributes/elements via DOMPurify config.

## Structure - Asset Path Inconsistency

### Inconsistent asset path formats across pages (relative vs absolute)

**Severity:** low
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/index.html and other pages`

index.html uses relative paths for fonts and CSS (e.g., href="assets/css/app.css"), while other pages use absolute paths (e.g., href="/assets/css/app.css"). While both work, the inconsistency indicates the pages were generated by different processes or not fully normalized. This can cause issues during migrations or when pages are moved.

**Fix:** Standardize all asset paths to use absolute paths with leading slash (e.g., /assets/css/app.css, /assets/fonts/...). Update index.html preload and stylesheet links.

## Structure - Duplicate Elements

### Duplicate favicon and apple-touch-icon links in index.html

**Severity:** low
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/index.html (lines 572-573)`

index.html contains duplicate favicon and apple-touch-icon declarations (lines 566, 572-573), with identical href values. While browsers ignore duplicates, this wastes bytes and indicates incomplete cleanup.

**Fix:** Remove the duplicate declarations on lines 572-573. Keep only one set of favicon/apple-touch-icon links.

## Widget Initialization / Dead Code

### leadbot localStorage key persists even though leadtrap is active

**Severity:** low
**Where:** `assets/js/leadbot.js:114-123 (STORAGE_KEY and persistence logic), assets/js/app.js:242 (loadWidget fallback to 'leadbot' mode if widget config is missing)`

leadbot.js still writes to localStorage key 'ota_leadbot_v1' (saveState() calls at lines 122, 252, 388, 314), but this storage is never read by any active code because leadtrap is the configured widget. This accumulates stale data over time and may confuse debugging.

**Fix:** If leadtrap is permanent, remove all localStorage calls from leadbot.js or add a guard to skip persistence when the widget is not active. If leadbot will be used in the future, clear the localStorage entry during the transition.

## Window API Misuse / Spec Violation

### window.open() called with invalid 'noopener' third parameter

**Severity:** medium
**Where:** `assets/js/leadbot.js (lines 296-311), specifically line 311`

In leadbot.js (line 311), window.open() is called with three arguments: window.open(target, '_blank', 'noopener'). The third parameter should be a comma-separated list of window features (e.g., 'width=800,height=600,menubar=no'). 'noopener' is a rel attribute for <a> tags and window.open() links, not a valid third-parameter feature string. The code attempts to set rel='noopener' on an <a> tag at line 297, so the intent is correct, but the window.open() call syntax is broken and will be ignored by browsers.

**Fix:** Remove the third parameter from window.open() call. Instead, ensure the <a> tag uses rel='noopener noreferrer' (already set at line 297), which is the standard way to prevent window.opener access. Alternatively, in modern browsers, remove the third parameter entirely: window.open(target, '_blank')—browsers handle rel attributes on dynamically created links correctly.

## high/API-Frontend Data Mismatch

### Recent PRs branch field name mismatch

**Severity:** high
**Where:** `/functions/api/recent-prs.js line 67 and /admin/index.html line 201`

/api/recent-prs.js returns 'headBranch' but admin/index.html expects 'branch', causing branch names to not display in the admin dashboard recent PRs table

**Fix:** Either rename the returned field from 'headBranch' to 'branch' in the API, or update admin/index.html to expect 'headBranch'

## high/Security - XSS Vulnerability

### Unsanitized HTML injection in custom widget mode

**Severity:** high
**Where:** `/assets/js/app.js lines 244-258 (injectHtmlWithScripts function) and lines 280-286 (custom widget injection)`

The custom widget snippet injection in app.js uses template.innerHTML which parses HTML but doesn't sanitize event handlers on elements like img, svg, etc. An admin pasting a malicious snippet could execute arbitrary JavaScript. While template.innerHTML prevents direct <script> tag execution (the code clones scripts separately), event handlers on other HTML elements (onerror, onload, etc.) are not stripped.

**Fix:** Use DOMPurify or similar HTML sanitization library to sanitize the custom snippet before injecting, or use textContent instead of innerHTML for the custom snippet mode to prevent any HTML injection

## medium/Code Quality - Variable Naming

### Inconsistent field name in recent-prs API response

**Severity:** medium
**Where:** `/functions/api/recent-prs.js lines 60-73`

The API endpoint returns additional PR metadata fields (createdAt, updatedAt, mergedAt, closedAt, user, draft) that are not used in the admin dashboard. The field naming convention is inconsistent: some fields use camelCase (headBranch, mergedAt) while GitHub API uses snake_case. This inconsistency adds maintenance burden.

**Fix:** Decide on a consistent naming convention and apply it throughout. Either keep camelCase but rename 'headBranch' to 'branch', or standardize on a simpler response shape that only includes used fields (number, title, url, state)

