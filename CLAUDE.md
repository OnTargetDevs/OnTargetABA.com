# CLAUDE.md

Context-only notes for future Claude sessions. Things you can't infer from
just reading the folder — facts the user stated in conversation, decisions
that were made, and integrations that are wired up to specific live IDs.

---

## Who / where

- **Client:** On Target ABA (the user's own company). User email: `nate.karr@ontargetaba.com`.
- **Live legacy site:** https://ontargetaba.com (WordPress + Elementor + Fluent Forms + Jotform + Hotjar + Facebook Pixel + GTM-N2RP5GST / GTM-W42536PM).
- **Redesigned static site (this repo):** https://github.com/OnTargetDevs/OnTargetABA.com — `main` branch. (Originally forked from `Shalom-Karr/OnTargetABA.com`; the company-org fork is now canonical and deploys from there.)
- **Deployed preview:** originally `website.ontargetnotes.com` on a personal CF account. The project has since moved to a **company CF account** (`Joshua@ontargetaba.com's Account`, account ID `8c5c2baf2cd46499b5989ef288febd82`), Pages project name **`ontargetaba`** (not `ontargetaba-com`), serving at `https://ontargetaba.pages.dev` and the custom domain `https://beta.ontargetaba.com`. Production source: `OnTargetDevs/OnTargetABA.com`, branch `main`.
- **Figma source of truth** for visual direction: file `1BS1Qg0H4ToqKZXLAeNX1P` ("On Target ABA"). The node IDs we previewed in earlier sessions were `32-2` (home), `634-2` (about), `634-194` (services), `634-457` (Cleveland location), `634-666` (careers). Figma proto links require login — if a future session needs to look at the board again, drive Chromium via Playwright and re-introduce a small screenshot helper.

## Locations + phone numbers (real, not placeholders)

| Region | Address | Phone |
|---|---|---|
| Main / general | — | **(888) 989-5011** |
| Murray, Utah | 5444 South Green Street, Murray, UT 84123 | (385) 550-3500 |
| Cleveland / Mayfield | 767 Beta Dr, Suite C, Mayfield Village, OH 44143 | (216) 343-1198 |
| Columbus / Gahanna (airport) | 2760 Airport Dr, Suite 110, Columbus, OH 43219 | (614) 681-1030 |
| Columbus / Worthington | 130 E Wilson Bridge Rd, Suite 200, Worthington, OH 43085 | (614) 681-1030 |

Hours at all clinics: **Mon–Fri 8:00 AM – 5:00 PM**.

Founder / Clinical Director: **Ilana Gross, BCBA**. Bachelor's in Speech & Language Pathology (Touro College), dual Master's in Education + Special Education (Mercy College), ABA certificate (Florida Institute of Technology).

## Brand palette (Figma-aligned, not what the live site exposes in CSS)

Source: the user's Figma board for the redesign (the live WordPress CSS uses a brighter, less-coordinated palette). When in doubt, the Figma file is authoritative.

| Token | Hex | Purpose |
|---|---|---|
| `cream` | `#FAF5E6` | Warm page background |
| `ink` | `#163243` | Body type, footer |
| `teal` | `#00B7EA` | Bright accent (used sparingly — links, accents) |
| `teal-deep` | `#0E5E6E` | Body emphasis, dark gradient ends |
| `coral` | `#E84F3B` | Primary CTA, italic emphasis in headlines |
| `sun` | `#F4C842` | Big circle hero device, secondary CTA |
| `sage` | `#C5E0D5` | 5th accent — backgrounds, sage-soft cards |

The display font in the Figma is a chunky humanist (Recoleta-style). Closest free fit is Bricolage Grotesque or Caprasimo. **The current site uses Fraunces and stays on Fraunces** — the user previewed a Bricolage Grotesque swap in `demo.html` and explicitly rejected it. Don't propose this swap again.

Similarly, the user **rejected the big yellow-sun hero device** (large `#F4C842` circle behind a child photo, riffed from the Figma board). Keep the existing target-mark + blob hero treatments.

## Logo — IMPORTANT

The site shows the **real wordmark** at `assets/images/footerImg.png` (mirrored from `https://ontargetaba.com/wp-content/uploads/2022/04/footerImg.png`). Earlier in this project I used a custom SVG bullseye-and-text as a placeholder; the user explicitly rejected it. The placeholder is wiped by `scripts/swap-logo.ps1` if it ever creeps back in. **Do not** generate a new logo.

## Jotform IDs (production forms — already in use on the live site)

These are the real Jotform IDs you should embed in the corresponding pages:

| Page | Form ID | Embed script |
|---|---|---|
| `pre-intake-form.html` | `213614603878157` | `<script src="https://form.jotform.com/jsform/213614603878157"></script>` |
| `contact.html` | `210615141890045` | `<script src="https://form.jotform.com/jsform/210615141890045"></script>` |
| `autism-testing.html` (eval scheduler) | `260534406459156` | `<script src="https://form.jotform.com/jsform/260534406459156"></script>` |
| `job-application.html` + `employment-application.html` (job application) | `210610411740034` | `<script src="https://form.jotform.com/jsform/210610411740034"></script>` |

When you embed, wrap the script in a styled container (matching `.bg-white ring-1 ring-line rounded-3xl shadow-soft p-6`-style) so the form drops into the design language. The Jotform script self-replaces with the form iframe at load time.

## "AI intake agent" = lead-bot widget

When the user says "the AI intake agent from ontargetaba.com," they mean the floating widget in the bottom-right of every page on the legacy site. Its DOM shows iframes named:
- `lead-bot-launcher`, `lead-bot-avatar`, `lead-bot-notification`, `lead-bot-engagement`, `lead-bot-message-frame`

This isn't a Crisp / Intercom / Drift widget — the class naming is unique. Probably a custom or white-labeled lead-gen chat. **No vendor identifier is in the page source** I've seen so far, so when building an equivalent, build it as a standalone component (don't try to embed someone else's SDK). Style it as a floating launcher → chat panel that triages and links to the appropriate Jotform.

## Blog architecture

**161 blog posts** live as markdown with YAML frontmatter in `website/assets/blog/{slug}.md` and render at runtime in `website/blog/post.html` via `marked.js` + `DOMPurify` (same pattern as the user's other project, `~/Downloads/Claude/Agudah-MD/posts.html`).

Two derived artifacts:
- `website/assets/blog/index.json` — generated by `scripts/build-blog-index.py`. The blog landing page and post-page "related" widget both fetch this.
- The frontmatter format the post template parses: `title`, `date` (YYYY-MM-DD), `category`, `author`, `hero_image`, `excerpt`, `read_time`, `source_url`.

The original WordPress scrape that produced these .md files is no longer in the repo — `build.sh` regenerates `index.json` from whatever .md files are present, so adding/removing posts is just edits in `assets/blog/`. Re-run `python scripts/build-blog-index.py` whenever those files change.

## Reference projects (these are other repos by the same user)

If you're stuck on a pattern, check these in order:

1. **`~/Downloads/Claude/Agudah-MD/`** — the cleanest reference for: markdown blog post rendering (`posts.html`), prose styling, Tailwind extension, sticky table-of-contents, reading progress bar, share buttons.
2. **`~/Downloads/Claude/newbridgesaba/`** — Tailwind-via-CDN + AOS + Alpine.js patterns, glass-nav backdrop, schema.org JSON-LD breadcrumbs.
3. **`~/Downloads/Claude/Darabaner-ABA-Website/`** — another ABA brand site by the same user; useful for cross-checking voice and CTA patterns.

## Deployment (Cloudflare Pages)

Host is CF Pages — **not Vercel**. Don't ship `vercel.json`; it's noise.

Project settings to verify in the CF dashboard
(account `8c5c2baf2cd46499b5989ef288febd82`, project `ontargetaba`):
- **Root directory:** `/website` (the project lives in a subfolder)
- **Build command:** `bash build.sh`
- **Build output directory:** `.` (deploy from `/website` itself)

⚠️ The new CF account inherited the source connection but **NOT** the
build settings. After any new-account migration (or any time you find
that `sitemap.xml` is stale or OG images are missing for new posts),
verify `build_command` is set to `bash build.sh` and `destination_dir`
to `.`. The PATCH:

```bash
TOKEN=$(awk -F'"' '/oauth_token/{print $2}' \
  "$APPDATA/xdg.config/.wrangler/config/default.toml")
curl --ssl-no-revoke -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"build_config":{"build_command":"bash build.sh","destination_dir":".","root_dir":"website"}}' \
  https://api.cloudflare.com/client/v4/accounts/8c5c2baf2cd46499b5989ef288febd82/pages/projects/ontargetaba
```

`build.sh` chains the maintenance scripts so every push refreshes the
derived artifacts (blog index → sitemap → IndexNow ping). Override the
default 14-day IndexNow window with `SITEMAP_FULL_PING=1` (env var in
the CF dashboard) to ping every URL after a large content change.

### Routing files (CF Pages reads these from the deploy root)

- **`_redirects`** — rewrites `/blog/posts/{slug}` → `/blog/post` (status 200).
  **Do not** use `/blog/post.html` as the destination: CF Pages strips
  `.html` from anything it serves, which would turn the rewrite into a
  308 redirect and drop the slug. The extensionless destination resolves
  to `/blog/post.html` internally without changing the URL bar.
- **`_headers`** — security headers (CSP-lite), correct MIME types for
  `sitemap.xml` / `robots.txt` / the IndexNow key file, long cache for
  immutable images, short cache for blog markdown.

### IndexNow

- **Key:** `c8f5d3a1e947b2f6a4c1b9d8e6f3a2b5`
- **Key file:** `website/c8f5d3a1e947b2f6a4c1b9d8e6f3a2b5.txt` at the
  deploy root (search engines GET this to verify ownership).
- **Endpoint:** `https://api.indexnow.org/IndexNow` (fan-out to Bing,
  Yandex, Seznam, Naver, and any other participating crawlers).
- **Default behavior:** `scripts/indexnow-ping.py` parses `sitemap.xml`
  and submits every URL whose `<lastmod>` falls within the last 14 days.
  Pass `--all` for an initial submission of every URL.
- **Failure mode:** non-fatal. A failed ping logs a warning but doesn't
  break the deploy.

## The scripts folder is load-bearing

`website/scripts/` holds idempotent maintenance scripts. Each one operates on `website/` from a sibling directory:

| Script | What it does |
|---|---|
| `download-assets.ps1` | Downloads a manifest of asset URLs to `assets/images/`. Emits `assets/asset-manifest.json`. Was originally used when migrating from WordPress; kept for re-mirroring rounds. |
| `recolor.ps1` | Swaps any old palette hex values across HTML/CSS/SVG to the current brand palette. |
| `swap-logo.ps1` | Replaces placeholder bullseye lockup with real `footerImg.png` wordmark in every page. |
| `fix-encoding.ps1` | Normalizes UTF-8 (writes BOM), decodes mojibake (`â†'` → `→`), replaces literal Unicode glyphs with HTML entities so the page renders even if a server picks the wrong charset. **Run this any time after agents touch HTML.** |
| `sync-tailwind-config.ps1` | Rewrites the inline `<script>tailwind.config = {...}</script>` block in every page to match the current palette. |
| `qa-check.ps1` | Sweeps for broken local links, missing image references, leftover old palette hex. |
| `inject-seo.py` | Re-injects schema.org JSON-LD `@graph` + OpenGraph + Twitter + canonical meta into every page. Idempotent (uses `<!-- auto-seo-start -->` / `<!-- auto-seo-end -->` markers). Visual breadcrumbs are now rendered by `assets/js/header.js` and no longer injected here. |
| `build-blog-index.py` | Generates `assets/blog/index.json` from `assets/blog/*.md` frontmatter. |
| `build-sitemap.py` | Reads `index.json` + the static-page registry → emits `sitemap.xml` and `robots.txt`. |
| `indexnow-ping.py` | Submits recent (last 14d) URLs from `sitemap.xml` to api.indexnow.org. `--all` pings every URL. |
| `embed-jotforms.py` | Swaps placeholder forms for real Jotform `jsform` embeds. Idempotent. |
| `add-blog-nav.py` | Inserts a Blog link into the desktop nav on every page. Idempotent. |
| `optimize-pages.py` | Self-hosts Tailwind (`assets/vendor/tailwind.js` — production warning stripped), injects `<meta name="view-transition">`, preloads `header.json`/`pages.json`, and prefetches top-nav destinations. Idempotent via `auto-perf-start`/`auto-perf-end` markers. |

**Order when running a refresh:** `download-assets` → `swap-logo` → `recolor` → `sync-tailwind-config` → `fix-encoding` → `inject-seo` → `build-blog-index` → `qa-check`.

`optimize-pages.py` MUST run *after* every HTML-touching script
(`inject-seo`, `selfhost-fonts`, `add-skip-link`) or its idempotent
markers can be clobbered. `build.sh` orders it correctly between
`add-skip-link.mjs` and `build-sitemap.py` — don't reorder.

For end-to-end common-issue diagnosis (1101, redirect_uri_mismatch,
NXDOMAIN caching, empty `build_command`, wrangler-login deadlocks),
see `docs/TROUBLESHOOTING.md`.

### Open Graph image pipeline

Per-page 1200x630 OG share images are generated at build time by
`scripts/gen-og-images.mjs` (Node ESM, stdlib only — CF Pages always has
Node). Output lives in `website/assets/og/`: `home.svg`, `about.svg`,
`autism-testing.svg`, `our-services.svg`, `locations.svg`, `contact.svg`,
plus `blog-{slug}.svg` for every entry in `assets/blog/index.json`.

The SVGs are pure templated XML — cream background, a sun arc top-right, a
coral blob bottom-left, a white rounded card with the post title (Fraunces,
wrapped to 3 lines), the "ON TARGET ABA · BLOG" eyebrow, and a bullseye mark
in the corner. No Pillow/Sharp/Canvas dependency.

`inject-seo.py` picks up the per-page SVG automatically (its
`resolve_og_image()` looks for `assets/og/{page-slug}.svg` and falls back
to `footerImg.png` if none exists). The blog post template
(`blog/post.html`) sets `og:image`/`twitter:image` to
`/assets/og/blog-${slug}.svg` at runtime and falls back to `footerImg.png`
if the SVG fails to load. The script is idempotent (mtime-vs-index.json
check) and runs after `build-blog-index.py` in `build.sh`.

## UX + perf improvements (June 2026)

Four shipped changes that the build pipeline now enforces on every deploy:
**Self-hosted fonts** — `assets/fonts/` holds Latin-only woff2 files for
Plus Jakarta Sans + Fraunces (five weights each; both families are
variable fonts so the per-weight files are copies of one master).
`scripts/setup-fonts.sh` downloads them with a Chrome UA at build time,
`scripts/selfhost-fonts.mjs` strips the Google Fonts `<link>` and
`<preconnect>` tags from every HTML page and injects a
`<link rel="preload" as="font" ...plus-jakarta-sans-600.woff2 crossorigin>`
above the `app.css` link. `@font-face` declarations live at the top of
`assets/css/app.css`. **Skip-to-content link** — `scripts/add-skip-link.mjs`
inserts `<a href="#main-content" class="skip-link">Skip to main content</a>`
as the very first element inside `<body>` of every page, and adds
`id="main-content"` to the first `<section>` after `</header>` (which is
the first section after the breadcrumb on pages that have one); CSS lives
in `app.css` under the `:focus-visible` block. **Deferred lead-bot** —
the chat widget moved from `app.js` IIFE 2 into its own
`assets/js/leadbot.js`. `app.js` now lazy-loads it via
`requestIdleCallback` (or `setTimeout(1500)`) and on first user
interaction (`mousemove`/`touchstart`/`keydown`/`scroll`). The loader
prefixes the src with `../` when `location.pathname` includes `/blog/`,
covering both `/blog/post.html` and the `/blog/posts/{slug}` rewrite
(which sets `<base href="/blog/">`). **Call-CTA on form pages** —
`pre-intake-form.html`, `contact.html`, and `autism-testing.html` each
have a `data-call-cta` sidebar card next to the Jotform with the
"Prefer to talk?" eyebrow, a 3-bullet reassurance list (live pickup /
insurance on the call / start in 72 hours), a coral phone button
(`(888) 989-5011` on the first two pages, `(385) 550-3500` on
autism-testing) and "Mon–Fri 8:00 AM – 5:00 PM" hours. The standard
layout is `grid lg:grid-cols-3 gap-8 items-start` with Jotform
`lg:col-span-2` and the sticky aside `lg:col-span-1 lg:sticky lg:top-24`;
`contact.html` stacks the call card under the form instead because its
right column already hosts location cards. Build order in `build.sh`:
`setup-fonts.sh` → `selfhost-fonts.mjs` → `add-skip-link.mjs`.

## Things the user has corrected / preferred

- **Real customer reviews only** — don't fabricate testimonials. Currently in the marquee (sources are real Google reviews provided by the user): S. R., A. D., C. S., D. M., Carmen E., Jack M., **Andreana Tadaj**, **Ruchie Kaplan** (Cleveland), **Zi Zi World Tarpeh** (Columbus airport).
- **Markdown blog rendering at runtime** — don't generate 161 static HTML files. Use the single `blog/post.html` template + the `marked.js`/DOMPurify pattern, like Agudah-MD.
- **No puzzle-piece imagery** for autism content — the autism community has moved away from it. Stick to the brand's target/bullseye + warm photography.
- **HTML entities for arrows / em-dashes / quotes** in body text — protects against mojibake when a CDN or server picks the wrong charset. `fix-encoding.ps1` enforces this.
- **Move tools to `scripts/`** — keep the website folder clean of `.ps1` / `.py` build artifacts.
- **The user owns the Figma file and the blog content** — mirroring is at their explicit direction; preserve wording verbatim.

## Things to ask vs. assume

- **AI widget vendor.** I never identified the "lead-bot" provider with certainty. If the user wants the real widget back (not a custom-built equivalent), ask which service to embed and whether they have a workspace ID / install snippet.
- **Cookie consent.** The original is a Termageddon runtime embed; I built a placeholder shell. If they want real consent flow, get the Termageddon site ID.
- **Form submission target.** The Jotform IDs are wired in this repo, but if the user moves off Jotform, all three pages need updating in lockstep.

## Conventions in this codebase

- **No build step.** Tailwind via CDN; Fonts via Google Fonts; everything else is raw HTML/CSS/JS. Pages must be openable directly from disk with `file://`.
- **Every page is self-contained.** Nav and footer are inlined (not injected via JS) so `file://` works without a fetch.
- **Display font** is loaded via the `.font-display` utility (`Fraunces` currently). Change once in `assets/css/app.css` to swap site-wide.
- **Animations** all gate on `prefers-reduced-motion: reduce`. Keep that pattern.
- **Forms** in the prototype use `onsubmit="event.preventDefault(); ..."` placeholders. The real form lives in Jotform; the styled wrapper is just chrome.

## Admin dashboard

Lives at `/admin` (static HTML + JS in `website/admin/`). Auth is Google OAuth against `ADMIN_EMAILS`; session is a JWT in an HttpOnly cookie. CF Pages Functions in `website/functions/` implement the API + a catch-all draft-preview Function.

Every edit opens a Pull Request on `OnTargetDevs/OnTargetABA.com` &mdash; content does NOT push to `main` directly. The PR is the audit log. See `docs/ADMIN_DASHBOARD.md` for the user-facing walkthrough and `docs/DEPLOYMENT.md` for the env-var checklist.

### Capabilities (as of editor v2)

1. **Create a new page** — `/admin/new-page.html`. Pick a template (built-ins `page-basic`, `page-long-form`, `page-landing` + any custom ones), fill in slug + title + description, optionally mark as draft. Function scaffolds the new `.html`, registers it in `pages.json`, regenerates `sitemap.xml`.
2. **Visually edit any text** — `/admin/page-editor.html?slug=<x>` loads the live URL in an iframe and overlays edit handles on **every** text-bearing element (h1-h6, p, li, td, button, a, span/strong/em with direct text, etc.). Hand-tagged `data-editable` keys take precedence; everything else uses auto-walk keys `auto:t<N>`. Edits queue in the right pane and submit as one PR.
3. **Visual Tailwind text styling** — when a text element is being edited, a floating toolbar appears with toggles for bold/italic/underline/line-through/uppercase, mutually-exclusive groups for size (xs–7xl), font family (sans / display), brand color (8 swatches), and border-radius. Stores the resulting full `className` string on the override so the runtime applies it on every public view.
4. **Hide any section** — every `<section>`, `<aside>`, `<header>`, `<footer>`, `<article>`, `<main>` gets a coral corner toolbar in the editor. Hide writes a `{ type: "section-hide", hidden: true }` override.
5. **Save a section as a template** — same toolbar's "Save as template" action POSTs the section's `outerHTML` to `/api/section-templates/save`, which commits to `assets/templates/sections/{name}.html` via PR.
6. **Replace or insert a saved section template** — the toolbar lists every saved section template; choose Replace (swap in place) or Insert after.
7. **Image edits** — every `<img>` gets an Image handle. Modal accepts file upload (committed to `assets/images/uploads/{yyyy-mm}/{slug}-{hash}.{ext}` via `/api/images/upload`) **or** direct URL paste.
8. **SEO per page** — collapsible panel in the page editor for title, meta description, keywords, canonical, OG title/description/image, Twitter image. Saves to `assets/data/pages/{slug}.seo.json` via `/api/pages/{slug}/seo`; `page-overrides.js` applies them on DOMContentLoaded.
9. **Hide / draft / delete page** — `/admin/pages.html` row actions. Hide / draft flip the corresponding bool in `pages.json` (always serialized as `{ schemaVersion: 1, pages: [...] }`) and regenerate sitemap.xml in the same PR. Delete removes the `.html`, overrides, and registry entry.
10. **Edit header + footer** — form-driven editors at `/admin/header.html` and `/admin/footer.html` that round-trip `assets/data/header.json` / `footer.json`.
11. **Mobile / Tablet / Desktop preview** — viewport toggle in the editor topbar resizes the iframe to 390 / 820 / full-width so you can sanity-check layout on each form factor without leaving the admin.

### The full automation loop

  Save in /admin  →  Function commits files to `admin/<kind>-<slug>-<uuid>` branch
                  →  Function opens PR with the change(s) + regenerated artifacts
                  →  `validate-content.yml` workflow lints frontmatter + JSON
                  →  `auto-merge-admin.yml` watches workflow_run; on success
                     it squash-merges the PR (free-plan equivalent of GitHub's
                     native auto-merge, which Pro-gates private repos)
                  →  push to main triggers CF Pages deploy
                  →  `purge-cache.yml` polls CF deployments for the matching
                     commit; on success it purges the ontargetnotes.com zone
                  →  custom domain serves the new state.

End-to-end is typically 60–120 s. The PR is the audit log; nothing pushes
straight to `main`.

### Architecture quirks worth remembering

- **REPO_PREFIX = "website/"** in `functions/_utils.js`. The site lives in a `website/` subdirectory but CF Pages builds from `website/` as the deploy root — so static fetches at `/assets/...` work, but every GitHub Contents API call from a Function needs the full path. The helper functions prepend it automatically; callers stay clean.
- **All CF Pages env vars must be `secret_text`.** Mixing `plain_text` and `secret_text` in one PATCH to `deployment_configs.production.env_vars` silently drops the `plain_text` ones. Use `secret_text` for everything, even URLs and email allow-lists.
- **OAuth callback URL is `/OAuth/Callback` — case sensitive.** Matches the file-system route at `functions/OAuth/Callback.js`. If you change it, you must change all three: Google Cloud Console allow-list, `GOOGLE_REDIRECT_URI` env var, and the Function file name.
- **`pages.json` shape** is `{ schemaVersion: 1, pages: [...] }`. Every mutation Function writes the wrapper, not a bare array.
- **`assets/blog/index.json`** is the source of truth for `/api/posts`. With 161 posts, walking each `.md` via the Contents API blows CF's per-Function subrequest budget; the pre-built index works in one call. `scripts/normalize-posts.py` keeps all frontmatter on the canonical shape.
- **Auto-walk keys** (`auto:t<N>`, `auto:s<N>`, `auto:i<N>`) are computed by a deterministic DOM walk performed by **both** the editor and the runtime (`page-overrides.js`). They're stable across content edits but shift if the static markup's element structure changes. Hand-tag a critical region with `data-editable="something-stable"` if you want a key that survives layout refactors.
