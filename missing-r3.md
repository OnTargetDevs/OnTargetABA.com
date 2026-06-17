# Round-3 Audit (post-Wave 6)

Trend: R1=111, R2=42, R3=26 (7h/12m/7l).

## Accessibility

### Missing label associations on admin form inputs

**Severity:** medium
**Where:** `C:\Users\nates\Downloads\Claude\Utah Autism Testing\website\admin\footer.html, lines 209-210 and 262-263`

The footer.html admin page has dynamically generated repeater rows with label elements that don't have 'for' attributes, and the associated input elements lack 'id' attributes. This breaks the semantic connection between labels and inputs for screen readers and keyboard navigation. Specifically:

1. In renderLinks() function (line 209-210): Labels for 'Label' and 'Href' inputs in column links have no 'for' attributes
2. In renderLegal() function (line 262-263): Labels for 'Label' and 'Href' inputs in legal links have no 'for' attributes

Both use data-k selectors to connect to inputs but lack proper label/input association.

**Fix:** Add unique IDs to dynamically generated inputs and add corresponding 'for' attributes to labels. Example: For column link inputs at index li in column idx, use IDs like 'col-{idx}-link-{li}-label' and 'col-{idx}-link-{li}-href', then add for="col-{idx}-link-{li}-label" to the label elements.

### Missing label 'for' attributes in widget.html admin page

**Severity:** medium
**Where:** `C:\Users\nates\Downloads\Claude\Utah Autism Testing\website\admin\widget.html, lines 114 and 136`

Two form inputs in the Chat Widget admin page lack proper label associations:

1. Line 114: Label 'Partner ID' has no 'for' attribute for the leadtrap-partner input
2. Line 136: Label 'Embed HTML' has no 'for' attribute for the custom-snippet textarea

While the inputs have IDs, the labels don't reference them, breaking keyboard accessibility and screen reader association.

**Fix:** Add 'for="leadtrap-partner"' to the Partner ID label and 'for="custom-snippet"' to the Embed HTML label.

### Missing labels on posts.html search and filter inputs

**Severity:** medium
**Where:** `C:\Users\nates\Downloads\Claude\Utah Autism Testing\website\admin\posts.html, lines 70-76`

The posts.html admin page has search and filter inputs that lack associated label elements. Line 70 has a search input and lines 71-76 have a filter select element, neither of which have labels. This makes it difficult for screen reader users to understand the purpose of these controls.

**Fix:** Add visible or aria-label attributes to the search input and filter select. Example: Add aria-label="Search posts" to the search input and aria-label="Filter by status" to the filter select, or wrap them in semantic label elements.

### Missing labels on footer.html static form inputs

**Severity:** medium
**Where:** `C:\Users\nates\Downloads\Claude\Utah Autism Testing\website\admin\footer.html, lines 78-82, 101-102, 110`

Several static input fields in footer.html lack proper label associations with 'for' attributes:

1. Lines 78-82: Logo src, Logo alt, Tagline, Phone labels have no 'for' attributes
2. Lines 101-102: Credit Name and URL inputs lack 'for' attributes
3. Line 110: Copyright text label lacks 'for' attribute

While these inputs have data-bind attributes, they lack 'id' attributes that would enable proper label/input association.

**Fix:** Add unique IDs to inputs (e.g., 'footer-logo-src', 'footer-credit-name') and add corresponding 'for' attributes to labels. Example: <label for="footer-logo-src">Logo src</label><input id="footer-logo-src" class="input" data-bind="logo.src" type="text"></div>

## Accessibility/Admin UI

### Missing label-input associations in widget.html admin form

**Severity:** medium
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/admin/widget.html:114,136`

In admin/widget.html, the Partner ID label (line 114) and Embed HTML label (line 136) are not properly associated with their inputs via for/id attributes. The labels have no for attribute, breaking keyboard navigation and screen reader functionality for these form controls.

**Fix:** Add for attributes to both labels: line 114 change `<label>Partner ID</label>` to `<label for="leadtrap-partner">Partner ID</label>`, and line 136 change `<label>Embed HTML</label>` to `<label for="custom-snippet">Embed HTML</label>`

## Admin Completeness

### No per-page SEO editor in admin dashboard

**Severity:** high

24 static HTML pages have hardcoded meta tags (title, description, og:*, twitter:*) that currently require code edits to update. While blog posts can be edited via /admin/posts, critical landing pages like /contact, /about, /autism-testing, /pre-intake-form, /insurance, /locations, /careers cannot have their SEO metadata edited from the admin UI. This blocks marketers from updating page descriptions, OG titles, keywords, etc. without developer intervention.

**Fix:** Build a new /admin/pages.html editor (sibling to /admin/posts.html) that lists all static pages, shows their current meta, and allows inline editing of title, description, og:title, og:description, keywords, og:image. POST to a new /api/pages/:slug endpoint that commits changes via GitHub API and regenerates the HTML with updated meta tags. Functions should use the same pattern as post-editor: frontmatter parsing, git commit, PR workflow.

### Dashboard stats only show blog post counts, no page/site metrics

**Severity:** low

The /admin dashboard only displays post/draft/hidden blog counts. No visibility into total page count, deployment status, last deploy time, recent site errors, or traffic metrics. This leaves admins without basic site health visibility.

**Fix:** Extend the dashboard stats section to show: (1) total published pages (count static + blog pages), (2) last deploy timestamp + branch from recent-prs, (3) optional: link to Cloudflare Analytics or Hotjar dashboard for traffic/session data. These are optional quality-of-life improvements, not blocking.

## Asset Path Inconsistency

### Mixed absolute and relative asset paths across pages

**Severity:** low
**Where:** `Inconsistent across ~30 pages (about.html, autism-testing.html, etc.) vs. index.html`

30 pages use relative asset paths (e.g., href="assets/fonts/...") while index.html uses absolute paths (e.g., href="/assets/fonts/..."). While both work from root-level pages, this inconsistency could cause issues if URL structure changes or blog posts are served from nested routes.

**Fix:** Standardize to absolute paths (/assets/...) across all HTML pages for consistency and future-proofing. This prevents potential breakage if routing is changed.

## Build Process

### BOM handling bug in inject-seo.py

**Severity:** medium
**Where:** `website/scripts/inject-seo.py:945`

The inject function detects whether a file has a UTF-8 BOM on line 917, but line 945 always adds a BOM unconditionally ('if True' instead of 'if bom'). This causes files that did not originally have a BOM to be re-written with one added, which can break text editors or build tools that expect consistent line endings.

**Fix:** Change line 945 from 'out = (b"\xef\xbb\xbf" if True else b"") + text.encode("utf-8")' to 'out = (b"\xef\xbb\xbf" if bom else b"") + text.encode("utf-8")'

## Code Quality

### Unused parameter in recent-prs endpoint

**Severity:** medium
**Where:** `website/functions/api/recent-prs.js:20`

The onRequestGet function receives a 'data' parameter (which would contain admin credentials from middleware) but never uses it. All other similar endpoints use it to capture the admin's email for PR attribution.

**Fix:** Either remove the unused 'data' parameter from the function signature, or capture the admin email to include in PR attribution/logging if needed.

## Code Quality / Asset Paths

### Font and CSS preload paths inconsistent across 29 pages

**Severity:** medium
**Where:** `employment-application.html, job-application.html, about.html, aba-therapy-guide.html, blog.html, careers.html, and 23 others; lines 31-33 in each file`

29 HTML pages use RELATIVE paths for font and CSS preloads (e.g., href="assets/fonts/plus-jakarta-sans-600.woff2") while the Tailwind script uses ABSOLUTE paths (src="/assets/vendor/tailwind.js"). This was flagged in Round 2 but remains unfixed. Relative paths work from root-level pages but fail from nested URL contexts (e.g., /blog/posts/my-post). The other ~10 pages correctly use absolute paths.

**Fix:** Normalize all font and CSS link/script tags to use absolute paths: change href="assets/..." to href="/assets/..." on all 29 affected pages. Or update the build pipeline (scripts/inject-seo.py or similar) to inject the preload blocks with absolute paths.

## Code Quality / Dead Parameters

### Unused middleware parameter in recent-prs endpoint

**Severity:** low
**Where:** `functions/api/recent-prs.js line 20`

The onRequestGet handler in functions/api/recent-prs.js destructures the `data` parameter from the middleware context but never uses it. The parameter is always available for authenticated endpoints, but this one does not access data.admin.email or any other middleware-injected value.

**Fix:** Remove `data` from the destructuring: change `async ({ request, env, data })` to `async ({ request, env })`.

## Code Quality / Inconsistency

### Relative asset paths not normalized across 29 HTML pages

**Severity:** medium
**Where:** `website/about.html, website/autism-testing.html, website/contact.html, website/employment-application.html, website/job-application.html, and 24 other pages - affected lines contain: `href="assets/css/app.css?v=..."` and `href="assets/fonts/..."` instead of `/assets/css/app.css?v=...` and `/assets/fonts/...``

The optimize-pages.py build script contains a regex pattern intended to normalize relative asset paths (e.g., `assets/css/app.css`) to absolute paths (`/assets/css/app.css`). However, 29 pages still contain relative stylesheet and font preload references after the build process. While this works correctly for pages accessed at root URLs (e.g., `/about.html`), it creates inconsistency with pages like blog/post.html which correctly use absolute paths. The regex successfully adds cache-bust parameters (evidence that it runs), but fails to normalize the leading slash for some paths.

**Fix:** Update the VERSIONED_ASSETS_RE regex in website/scripts/optimize-pages.py (line 88-90) to also match font files and ensure all relative paths are normalized. The current regex pattern `r'((?:href|src)=")(/?assets/(?:js|css|vendor)/...'` restricts matching to js/css/vendor directories only and excludes fonts. Alternatively, run the build script on all pages to verify the normalization succeeds, or manually normalize paths across all static pages to use leading slashes.

## Code Quality/Asset Paths

### Inconsistent absolute vs relative asset paths in job-application.html

**Severity:** low
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/job-application.html:31-33,493,706`

The job-application.html page uses a mix of absolute paths (`/assets/...`) and relative paths (`assets/...`). Lines 31-33 use relative paths for fonts and CSS, while most other asset references use absolute paths. Lines 493 and 706 use relative paths for image and script.

**Fix:** Normalize all asset paths to use absolute paths starting with `/`: change line 31 to `href="/assets/fonts/..."`, line 32 similarly, line 33 to `href="/assets/css/app.css?v=..."`, line 493 to `src="/assets/images/..."`, line 706 to `src="/assets/js/app.js?v=..."`

### Inconsistent absolute vs relative asset paths in employment-application.html

**Severity:** low
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/employment-application.html:31-33,491,823`

The employment-application.html page has the same asset path inconsistency as job-application.html. Lines 31-33 use relative paths while other references use absolute paths. Lines 491 and 823 use relative paths.

**Fix:** Normalize all asset paths to use absolute paths: change lines 31-33 and lines 491, 823 from relative to `/assets/...` paths to match the rest of the site

## Code Quality/Unused Parameters

### Unused 'data' middleware parameter in recent-prs endpoint

**Severity:** low
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/functions/api/recent-prs.js:20`

The onRequestGet handler in functions/api/recent-prs.js accepts a 'data' parameter on line 20 that is never used within the function. This parameter comes from the middleware but is not referenced, indicating dead code.

**Fix:** Remove the unused 'data' parameter from the function signature: change `async ({ request, env, data })` to `async ({ request, env })`

## Forms & Submissions

### Job application form only sends mailto:// links, no backend submission

**Severity:** medium

The /job-application.html form uses window.location.href with mailto: to have users email careers@ontargetaba.com. This works but forces users to open their email client, attach the resume manually, and send. No submission is recorded server-side. Employment application has the same issue.

**Fix:** Wire both job-application.html and employment-application.html to POST form data + resume file to a new /api/submissions/application endpoint (or use Jotform if preferred). Store in a database or email delivery service (e.g., Cloudflare Email Service). This is noted in prior audit as 'needs-user' but still unresolved. Medium severity because the forms technically work, just with poor UX.

## Functional Issue

### Job application form has no submission backend

**Severity:** high
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/job-application.html (lines 734-739)`

The job-application.html form shows a success message locally without actually submitting the data anywhere. The code at lines 734-739 contains a comment stating 'No backend wired for this form yet' and displays a fake success message while instructing users to email their resume separately.

**Fix:** Either integrate Jotform (use a data-jotform-id attribute like other forms) or implement a real fetch POST endpoint to capture the form data and send it to careers@ontargetaba.com. Currently the form collects data but discards it.

### Employment application form uses mailto: fallback instead of real submission

**Severity:** medium
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/employment-application.html (lines 883-903)`

The employment-application.html form (lines 883-903) is designed to open the user's email client via mailto: links and requires the user to manually send their email with an attached resume. While this is a documented design choice, it means form data is never captured server-side and relies entirely on the user following through with email.

**Fix:** Consider implementing a proper form backend (Jotform or serverless function) that captures the employment application data and sends it to careers@ontargetaba.com, so no applicant data is lost if they don't complete the email step.

## Performance Issue

### Missing fraunces-700 font preload on 30+ pages using display font

**Severity:** medium
**Where:** `All .html files except index.html that contain font-display classes. Preload link should be in <head>: <link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/fonts/fraunces-700.woff2">`

Only index.html preloads the Fraunces font weight (fraunces-700), but 30+ other pages (about.html, autism-testing.html, blog.html, careers.html, etc.) use the font-display Tailwind class extensively for headings without preloading any Fraunces weight. This causes font loading delay and layout shift on initial render.

**Fix:** Add fraunces-700 (or at minimum fraunces-600 or fraunces-700) preload to the <head> of all pages that use the font-display Tailwind utility class. This is critical for pages like about.html, autism-testing.html, careers.html, insurance.html, and others.

## SEO / Schema.org

### Schema.org Clinic URL Points to Deprecated Slug

**Severity:** high
**Where:** `All *.html files in website root (except 404.html, landing.html, test.html) in the 'department' array within the organization schema`

The MedicalClinic object in JSON-LD on 28 pages references the old URL 'https://ontargetaba.com/aba-therapy-murray-utah/' instead of the current canonical 'https://ontargetaba.com/murray-utah/'. While _redirects handles the 301 properly for user navigation, JSON-LD should reference the canonical URL directly for search engines. This affects all pages except 404.html, landing.html, and test.html.

**Fix:** Update the URL in the MedicalClinic @id object from 'https://ontargetaba.com/aba-therapy-murray-utah/' to 'https://ontargetaba.com/murray-utah/' across all affected pages. The exact line to change: change `"url": "https://ontargetaba.com/aba-therapy-murray-utah/"` to `"url": "https://ontargetaba.com/murray-utah/"` in each page's schema.org section around line 156-171 (in the @id clinic-utah department section).

### Utah clinic URL points to deprecated slug in schema.org MedicalClinic

**Severity:** high
**Where:** `scripts/inject-seo.py line 95; deployed across all 42 HTML pages in their injected JSON-LD`

The Murray (Salt Lake Valley) clinic schema.org department entry points to /aba-therapy-murray-utah/ on ALL 42 pages, but the canonical page URL is /murray-utah/. The actual file is murray-utah.html and resolves to /murray-utah/ under Cloudflare Pages cleanUrls. While _redirects includes a 301 redirect from the deprecated URL, canonical schema data should reference the current URL, not the old one. This affects search engine understanding of clinic location and business entity.

**Fix:** Change line 95 in scripts/inject-seo.py from `"url": f"{SITE}/aba-therapy-murray-utah/"` to `"url": f"{SITE}/murray-utah/"`. Re-run inject-seo.py to regenerate all pages.

## Security

### Authentication Bypass: Missing await in verifyJwt

**Severity:** high
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/functions/_utils.js:245`

Line 245 of functions/_utils.js has a missing 'await' statement that causes a critical security vulnerability. The verifyJwt() function calls verifyJwtToken() without awaiting it. Since both functions are async, this returns a Promise<Promise<Payload>> instead of Promise<Payload>. When callers await this result, they receive a Promise object (which is always truthy) instead of the actual JWT payload. This causes all authentication checks to pass even for unauthenticated requests, bypassing admin-only protection on endpoints like POST /api/posts, PUT /api/footer, PUT /api/widget, and image/script uploads.

**Fix:** Change line 245 from 'return verifyJwtToken(tok, env.JWT_SECRET);' to 'return await verifyJwtToken(tok, env.JWT_SECRET);' to properly await the async token verification function before returning.

### Critical: Missing await in JWT verification function

**Severity:** high
**Where:** `website/functions/_utils.js:245`

The verifyJwt function is declared async but returns the result of verifyJwtToken without awaiting it. This causes the function to return a Promise instead of the resolved payload, allowing admin middleware to receive a Promise object instead of null/payload. Any truthy check (if (!admin)) will pass even for invalid tokens because Promises are truthy.

**Fix:** Change line 245 from 'return verifyJwtToken(tok, env.JWT_SECRET);' to 'return await verifyJwtToken(tok, env.JWT_SECRET);'

## Security / CSP

### Unused CSP directive: fonts.googleapis.com in style-src

**Severity:** low
**Where:** `_headers line 40, style-src segment`

The CSP header in _headers includes https://fonts.googleapis.com in the style-src directive, but no pages actually load Google Fonts. All font families (Plus Jakarta Sans, Fraunces) are self-hosted via /assets/fonts/. The CSP should be minimal to reduce attack surface.

**Fix:** Remove 'https://fonts.googleapis.com' from the style-src CSP list in _headers.

## Security/Authentication

### Critical: Missing await in JWT verification enables auth bypass

**Severity:** high
**Where:** `C:/Users/nates/Downloads/Claude/Utah Autism Testing/website/functions/_utils.js:245`

In functions/_utils.js line 245, the verifyJwt() function calls verifyJwtToken() without awaiting it. Since verifyJwtToken() is async, this causes the function to return a Promise instead of the resolved JWT payload, allowing unauthenticated access to protected admin endpoints.

**Fix:** Change `return verifyJwtToken(tok, env.JWT_SECRET);` to `return await verifyJwtToken(tok, env.JWT_SECRET);`

