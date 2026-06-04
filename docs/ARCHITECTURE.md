# Architecture

A bird's-eye view of how the On Target ABA site is put together: what's static,
what's dynamic, how a request flows from a browser to a rendered page, and how
the admin layer plugs into the same repo without a build step at runtime.

---

## The system in one paragraph

The public site is a folder of plain HTML files served by Cloudflare Pages.
Tailwind is loaded from a CDN, JavaScript is vanilla, and there is no bundler.
A small set of build-time scripts (Python + Node, stdlib only) regenerate the
blog index, OG share images, SEO meta, sitemap, and webfont files on every push
to `main`. An admin dashboard lives at `/admin` and talks to Cloudflare Pages
Functions, which in turn talk to the GitHub Contents API to open pull requests
against this repo. Merging those PRs triggers another CF Pages build, and the
site updates a minute or two later.

---

## Layers

```
                    +---------------------------------------+
   Browser ─────►   |          Cloudflare edge              |
                    |                                       |
                    |  /*.html           → static asset     |
                    |  /assets/*         → static asset     |
                    |  /blog/posts/{s}   → rewrite to       |
                    |                      /blog/post       |
                    |  /api/*            → Pages Function   |
                    |  /admin/*          → static asset     |
                    |                                       |
                    |  (catch-all Function checks every     |
                    |   request: if the path matches a      |
                    |   draft page and the visitor has a    |
                    |   valid admin JWT, render the draft;  |
                    |   otherwise pass through to static.)  |
                    +-------------------+-------------------+
                                        │
                                        ▼
                          +--------------------------+
                          |   GitHub Contents API    |
                          |   (admin writes only)    |
                          +--------------------------+
```

Three layers, each with its own job:

1. **Static site** &mdash; the marketing pages, blog renderer, CSS, images, and JS.
   Deployed straight from `/website/` after the build script finishes.
2. **Build pipeline** &mdash; `bash build.sh`, eight ordered steps that derive
   sitemap, SEO, OG images, fonts, and the blog index.
3. **Admin layer** &mdash; `/admin/` UI + `/functions/` (CF Pages Functions) +
   GitHub API. The admin never writes to a database; it opens PRs against this
   same repo and lets the build pipeline pick up the change on next deploy.

---

## The static site

- **HTML.** Every page under `website/` is hand-authored and openable from
  `file://`. Nav and footer are *placeholders* (`<div id="site-header">` /
  `<div id="site-footer">`) populated at runtime by `header.js` / `footer.js`,
  so editing the nav once changes it everywhere.
- **Tailwind via CDN.** The Tailwind config block is inlined per page (so
  Tailwind utilities work without a build). `scripts/sync-tailwind-config.ps1`
  used to keep these in sync; the registry now lives in shared helpers.
- **CSS.** `assets/css/app.css` holds design tokens, animations, the marquee,
  the bullseye mark, lead-bot widget styles, the skip-link, and `@font-face`
  declarations for the self-hosted Plus Jakarta Sans + Fraunces files.
- **JS.** Four scripts:
  - `header.js` &mdash; renders the announcement bar, nav, and breadcrumbs.
  - `footer.js` &mdash; renders the footer with credit + copyright.
  - `app.js` &mdash; scroll reveal, sticky nav, mobile menu, FAQ accordion,
    marquee mirror, and the lazy-loader for `leadbot.js`.
  - `leadbot.js` &mdash; the floating intake widget. Lazy-loaded on idle or
    first user interaction so it doesn't block the first paint.

### Header / footer / page-overrides architecture

The nav and footer are JSON-driven. Each page contains a placeholder div and a
`<script src="…/header.js">`. At runtime, `header.js` fetches `header.json` (and
a per-page override if one exists), merges them, and injects the rendered HTML
into `#site-header`. The same pattern runs for the footer.

That setup is what makes admin edits possible:

- "Edit the header" in `/admin` writes a new `header.json`.
- "Edit this page" writes a per-page override under
  `assets/page-overrides/{slug}.json` describing the changed regions.
- "Hide this page" sets a flag on the override; `header.js` skips it in the
  nav, `build-sitemap.py` skips it in the sitemap, and the page itself adds
  `<meta name="robots" content="noindex">` when it loads its override.

No HTML file is regenerated at admin-edit time. The static HTML stays put and
the override JSON layers visible changes on top of it.

---

## The build pipeline (`build.sh`)

Eight steps, in order. CF Pages runs `bash build.sh` from `/website/` on every
push to `main`. Each step is idempotent; re-running a deploy without source
changes is a no-op.

| # | Step                                 | Why it runs before the next step                                         |
|---|--------------------------------------|--------------------------------------------------------------------------|
| 1 | `build-blog-index.py`                | Walks `assets/blog/*.md`, parses frontmatter, emits `index.json`.        |
| 2 | `gen-og-images.mjs`                  | Needs `index.json` to know which posts need OG SVGs.                     |
| 3 | `inject-seo.py`                      | Reads `index.json` for the blog landing JSON-LD; emits per-page schema.  |
| 4 | `setup-fonts.sh`                     | Downloads woff2 files. Skips files that already exist.                   |
| 5 | `selfhost-fonts.mjs`                 | Strips Google Fonts `<link>` tags, injects `<link rel="preload">`.       |
| 6 | `add-skip-link.mjs`                  | Inserts the skip-to-content link as the first child of `<body>`.         |
| 7 | `build-sitemap.py`                   | Reads `index.json` + the static-page registry, emits `sitemap.xml`.      |
| 8 | `indexnow-ping.py`                   | Reads `sitemap.xml`; pings recent URLs to api.indexnow.org.              |

The pipeline is strictly ordered because each step consumes output from a
previous one. `build.sh` uses `set -e` so a failing step kills the deploy &mdash;
except for step 8, which is wrapped in `|| true` so a flaky IndexNow endpoint
doesn't block a publish.

`SITEMAP_FULL_PING=1` in the CF Pages environment swaps step 8 from "ping URLs
modified in the last 14 days" to `--all` (ping every URL). Set it once after a
large content change, then unset.

---

## Blog architecture

The blog is one HTML template plus markdown source files. Adding a post is
"drop a `.md` file in `assets/blog/`."

- **Source:** `assets/blog/{slug}.md` &mdash; YAML frontmatter (`title`, `date`,
  `category`, `author`, `hero_image`, `excerpt`, `read_time`, `source_url`)
  followed by Markdown body.
- **Index:** `assets/blog/index.json` &mdash; generated by step 1 of the build.
- **Renderer:** `blog/post.html` &mdash; loads `marked.min.js` + `DOMPurify` from
  a CDN, reads the slug from the URL, fetches the matching `.md`, renders it.
- **Listing:** `blog.html` &mdash; fetches `index.json`, paints the cards.
- **Pretty URLs:** `/blog/posts/{slug}` is rewritten to `/blog/post` (no `.html`)
  by `_redirects` with a 200 (rewrite, not redirect). Using `/blog/post.html`
  as the destination would trigger CF Pages' auto-strip and turn the rewrite
  into a 308 that drops the slug &mdash; hence the extensionless form.

That's the entire blog &mdash; 161 markdown files and one template.

---

## Admin dashboard layer

Three pieces, all in this same repo:

1. **`website/admin/`** &mdash; the dashboard UI. Tailwind via CDN, vanilla JS.
   Public assets that anyone can request, but every action calls a Function
   that enforces auth.
2. **`website/functions/`** &mdash; Cloudflare Pages Functions
   (`functions/api/...`). These are the only things that talk to GitHub. Auth,
   page edits, post edits, header/footer edits, template management, and the
   draft-preview catch-all all live here.
3. **GitHub Contents API** &mdash; the destination for every admin write. The
   Function creates or updates a file on a fresh branch, opens a PR, and
   returns the PR URL. The admin reviews and merges on github.com.

### Auth

- **Sign in:** Google OAuth (web client). The user clicks "Sign in" on
  `/admin`, gets redirected to Google, comes back to `/api/auth/callback`.
- **Allow-list:** the callback Function checks the verified email against
  `ADMIN_EMAILS` (a comma-separated env var). Anyone not on the list gets a 403.
- **Session:** the Function signs a short JWT with `JWT_SECRET` and sets it as
  an `HttpOnly`, `Secure`, `SameSite=Lax` cookie. Every protected `/api/*`
  Function calls a shared `requireAdmin()` helper that verifies the cookie.
- **Logout:** clears the cookie. Rotating `JWT_SECRET` invalidates every
  existing session immediately.

### Edit flow

```
   Admin clicks "Save" in /admin
            │
            ▼
   POST /api/pages/{slug}         (Function)
            │
            ├── verify JWT
            ├── read current file via GitHub Contents API
            ├── apply the edit (override JSON or markdown body)
            ├── write to a branch  admin/{slug}-{ts}
            └── open a PR back to main
            │
            ▼
   Admin reviews PR on github.com, clicks merge
            │
            ▼
   CF Pages rebuilds → site updates
```

Every save = one PR = one merge = one deploy. The repo gets a full audit log
"for free" because the PR list *is* the audit log.

### Draft-preview catch-all

There's a catch-all Function in `functions/[[path]].ts` (or equivalent) that
runs on every request. For static-asset requests it just passes through to the
edge. For requests that match a page slug:

- If a draft override exists for that slug *and* the visitor has a valid admin
  JWT, the Function serves the page with the draft content applied. Signed-in
  admins see the in-progress version at the real URL.
- Everyone else gets a 404 for draft-only pages, or the published version for
  pages that are already live.

This is how "preview a draft" works without spinning up a separate preview
deploy per draft.

---

## SEO layer

SEO is regenerated on every build, never edited by hand in HTML:

- **`inject-seo.py`** &mdash; for each page in `SEO_PAGES`, builds a JSON-LD
  `@graph` (Organization + MedicalBusiness + four LocalBusiness clinics +
  WebPage + BreadcrumbList + Review + AggregateRating + per-page-type extras
  like FAQPage / Service / MedicalProcedure / Article). Also injects
  OpenGraph + Twitter + canonical + theme-color tags. Output is bracketed by
  `<!-- auto-seo-start -->` / `<!-- auto-seo-end -->` so the script can rip
  and replace its own output on the next run.
- **`gen-og-images.mjs`** &mdash; 1200x630 SVG share images, one per main
  page + one per blog post. Cream background, sun arc, coral blob, white card,
  Fraunces title wrapped to three lines, bullseye corner mark.
- **`build-sitemap.py`** &mdash; emits `sitemap.xml` from `index.json` + the
  static-page registry. URLs always use the production canonical
  `https://ontargetaba.com`.
- **`indexnow-ping.py`** &mdash; pushes new and changed URLs to IndexNow
  (Bing, Yandex, Seznam, Naver) on every deploy.

See `docs/SEO_GUIDE.md` for how to edit, and `docs/INDEXING_REQUESTS.md` for
the indexing protocol details.

---

## Request flow, end-to-end

A user types `https://ontargetaba.com/blog/posts/aba-therapy-explained`:

1. Cloudflare edge receives the request, hits the catch-all admin Function
   first. The visitor has no admin JWT, the path isn't a draft, so the
   Function passes through.
2. CF Pages applies `_redirects`. The pattern `/blog/posts/*` matches and
   rewrites to `/blog/post` (200, internal).
3. CF Pages resolves `/blog/post` to `/blog/post.html` from the deploy.
4. The browser receives the HTML. The inlined `<script>` for Tailwind config
   runs; `header.js`, `footer.js`, and the marked/DOMPurify libs all begin
   loading.
5. `header.js` fetches `assets/data/header.json`, paints the nav, marks the
   active link.
6. `post.html`'s init reads the slug from `location.pathname`, fetches
   `/assets/blog/aba-therapy-explained.md`, runs marked → DOMPurify →
   `innerHTML`. The "related posts" widget fetches `index.json`.
7. `app.js` wires up scroll reveal and queues `leadbot.js` for idle load.

Every step is either a static asset fetch or a CDN library load &mdash; no
origin compute on the request path unless an admin is signed in.
