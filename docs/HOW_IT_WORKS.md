# How It Works

A guided tour of the codebase. If you've never seen this repo before, read
this first; you'll know where to look for everything else.

---

## Layout

The full directory tree is in `README.md` (the "Repo layout" section). The
quick mental model:

- `website/` &mdash; everything Cloudflare Pages serves. The deploy root.
  - `*.html` &mdash; 31 public pages (home, about, services, locations, blog
    listing, legal, application forms, &c.).
  - `blog/post.html` &mdash; one shared renderer for all 161 blog posts.
  - `admin/` &mdash; the admin dashboard UI.
  - `functions/api/` &mdash; Cloudflare Pages Functions (the only code that
    talks to GitHub).
  - `assets/` &mdash; CSS, JS, images, fonts, blog markdown, OG SVGs,
    `data/header.json`, `data/footer.json`, `page-overrides/*.json`.
  - `scripts/` &mdash; build-time scripts (Python + Node, no dependencies).
  - `_redirects`, `_headers` &mdash; CF Pages routing and headers.
  - `build.sh` &mdash; the CF Pages build entry point.
- `docs/` &mdash; this folder.
- `CLAUDE.md`, `README.md` &mdash; root context.

---

## Lifecycles

There are four lifecycles to keep straight:

1. **Page request lifecycle** &mdash; what happens when a browser loads any
   public page.
2. **Blog request lifecycle** &mdash; the same for `/blog/posts/{slug}`.
3. **Build lifecycle** &mdash; what happens when you push to `main`.
4. **Admin edit lifecycle** &mdash; what happens when you save an edit in
   `/admin`.

---

### 1. Page request lifecycle

Concrete example: a user opens `https://ontargetaba.com/about.html`.

1. **Edge resolution.** Cloudflare's edge receives the request. The catch-all
   admin Function runs first &mdash; for a public visitor with no admin
   cookie, it's a no-op pass-through.
2. **Static file served.** CF Pages returns `about.html` straight from the
   deploy bundle. The HTML is cached at the edge per `_headers`.
3. **Inline `<head>` runs.** Tailwind CDN loads; the inlined Tailwind
   config block configures the palette. The preloaded self-hosted Plus
   Jakarta Sans font starts fetching. `app.css` loads.
4. **Header / footer placeholders fill in.**
   - The page contains `<div id="site-header"></div>` and
     `<div id="site-footer"></div>`.
   - `header.js` fetches `assets/data/header.json`. It paints the
     announcement bar, nav, mobile menu, breadcrumb, and active-page state.
   - `footer.js` fetches `assets/data/footer.json`. It paints the columns,
     credit chip, copyright, social icons.
5. **Page-level overrides apply.** A small `page-overrides.js` checks for
   `assets/page-overrides/{slug}.json`. If one exists, it walks the page's
   `data-editable` regions and swaps in the override values (text, image
   src, link href, &c.).
6. **App scripts wire up.** `app.js` runs `IntersectionObserver`-driven
   scroll-reveal, sticky nav shrink, mobile menu toggles, FAQ accordion,
   marquee mirroring, and various widget initializers.
7. **`leadbot.js` lazy-loads.** `app.js` queues it via `requestIdleCallback`
   (or `setTimeout(1500)`) and on the first user gesture (`mousemove`,
   `touchstart`, `keydown`, `scroll`). The launcher button appears
   bottom-right; the panel opens on click.

That's the entire page lifecycle: one HTML file, two JSON fetches, a CSS
file, four JS files, and the lazy widget. No origin compute on the request
path.

---

### 2. Blog request lifecycle

Concrete example: `https://ontargetaba.com/blog/posts/aba-therapy-explained`.

1. **Edge resolution.** Same catch-all pass-through as above.
2. **Rewrite.** `_redirects` matches `/blog/posts/*` and rewrites to
   `/blog/post` with status 200. Note: **extensionless** destination, on
   purpose. CF Pages auto-strips `.html` from served URLs, so
   `/blog/post.html` as a destination would be turned into a 308 redirect
   that drops the slug.
3. **Resolution.** CF Pages internally resolves `/blog/post` to
   `/blog/post.html` and serves it. The URL bar still shows
   `/blog/posts/aba-therapy-explained`.
4. **Base href set.** `post.html` has `<base href="/blog/">` so relative
   asset paths still resolve from the actual document location.
5. **Header / footer / overrides** apply the same way as a normal page.
6. **Slug parsed.** `post.html`'s init script reads `location.pathname`,
   strips `/blog/posts/`, and gets the slug `aba-therapy-explained`.
7. **Markdown fetched.** `fetch('/assets/blog/aba-therapy-explained.md')`.
8. **Rendered.** `marked.parse(body)` → `DOMPurify.sanitize(html)` →
   `articleEl.innerHTML = clean`. Frontmatter (title, hero image, date,
   author, read time, category) populates the title block, hero banner, and
   meta strip.
9. **OG / Twitter tags updated.** The script overwrites `og:image` to
   `/assets/og/blog-{slug}.svg` (falling back to `footerImg.png`), updates
   `og:title`, `og:description`, and the canonical link.
10. **Related posts.** `index.json` is fetched. The post's category and tags
    are used to pick three related posts; they render in the right rail.

The whole thing is two fetches (markdown + index) on top of the normal page
lifecycle. No build step needed to add or edit a post &mdash; just write the
`.md` file.

---

### 3. Build lifecycle

When you push to `main` (or merge a PR), Cloudflare Pages does this:

1. **Clone the repo.**
2. **`cd /website`** (root directory).
3. **Run `bash build.sh`.** The eight steps, in order:
   1. `python3 scripts/build-blog-index.py` &mdash; (re)builds `assets/blog/index.json` from frontmatter.
   2. `node scripts/gen-og-images.mjs` &mdash; (re)generates per-post and per-page OG SVGs.
   3. `python3 scripts/inject-seo.py` &mdash; rewrites SEO meta + JSON-LD on every page.
   4. `bash scripts/setup-fonts.sh` &mdash; downloads any missing webfonts.
   5. `node scripts/selfhost-fonts.mjs` &mdash; sweeps HTML to remove Google
      Fonts requests, injects preload tags.
   6. `node scripts/add-skip-link.mjs` &mdash; ensures every page starts with
      a `<a href="#main-content" class="skip-link">`.
   7. `python3 scripts/build-sitemap.py` &mdash; rebuilds `sitemap.xml` and
      `robots.txt`.
   8. `python3 scripts/indexnow-ping.py` &mdash; pings recent URLs (or all
      URLs if `SITEMAP_FULL_PING=1`).
4. **Deploy.** Whatever's now in `/website/` becomes the new live deploy.

The whole pipeline takes 60&ndash;120 seconds. Failures in steps 1&ndash;7
kill the deploy; step 8 is wrapped in `|| true`.

---

### 4. Admin edit lifecycle

A user is signed into `/admin/`, edits a paragraph on `about.html`, clicks
**Save changes**:

1. **Browser** sends `POST /api/pages/about`, body = the updated override
   JSON.
2. **Function** (`functions/api/pages/[slug].ts` or similar) runs at the edge:
   1. Verify the JWT cookie.
   2. Hit the GitHub Contents API, read the current
      `assets/page-overrides/about.json`.
   3. Merge the change.
   4. Create a new branch `admin/about-{timestamp}`.
   5. Commit the file.
   6. Open a PR back to `main`.
   7. Return the PR URL to the browser.
3. **Dashboard** shows the PR URL and the "Open on GitHub" link.
4. **Admin** clicks through, reviews the diff, clicks **Merge**.
5. **GitHub** records the merge to `main`.
6. **Cloudflare Pages** picks up the push, runs `bash build.sh`, deploys.
7. **Public visitor** sees the change about 90 seconds later.

The admin never writes to a database. The repo *is* the database; the PR
list *is* the audit log.

---

## "Where do I add X?"

A cheat sheet for common edits.

| Task                                                  | File(s) to touch                                  |
|-------------------------------------------------------|---------------------------------------------------|
| Change the color palette                              | `assets/css/app.css` (tokens) + inline `tailwind.config` on every page (one PowerShell sweep) |
| Add a new public page                                 | Create `{slug}.html`, add to `SEO_PAGES` in `inject-seo.py`, add to static-page registry in `build-sitemap.py` |
| Add a blog post                                       | Drop `assets/blog/{slug}.md` with frontmatter. The build does the rest. |
| Change a nav link                                     | `assets/data/header.json` (or use `/admin` → Header) |
| Change footer columns                                 | `assets/data/footer.json` (or `/admin` → Footer)  |
| Edit a page region from the dashboard                 | `/admin/` → Pages → click region → save → PR     |
| Change the phone number on a CTA                      | `header.json` for the nav CTA, or the page's CTA section directly |
| Add a JSON-LD entity for a new content type           | `inject-seo.py`: add a branch in the `build_primary_node` switch, then assign the new `primary_type` in `SEO_PAGES` |
| Regenerate OG share images                            | `node scripts/gen-og-images.mjs`                 |
| Force re-ping the entire sitemap                      | Set `SITEMAP_FULL_PING=1` in CF Pages env, redeploy, unset |
| Change the IndexNow key                               | Edit `scripts/indexnow-ping.py` (the `KEY` constant), rename the `.txt` key file at the deploy root to match, redeploy |
| Tweak cache rules                                     | `_headers`                                       |
| Add a rewrite                                         | `_redirects`                                     |
| Adjust the OG image visual style                      | `scripts/gen-og-images.mjs` (palette + SVG template) |
| Add a new admin email                                 | CF Pages dashboard → env vars → `ADMIN_EMAILS`   |
| Rotate the admin session secret                       | CF Pages dashboard → env vars → `JWT_SECRET`     |
| Rotate the GitHub PAT                                 | CF Pages dashboard → env vars → `GITHUB_TOKEN`   |
| Change the breadcrumb for a page                      | `assets/data/header.json` → `breadcrumbs[{slug}]` (also flows into JSON-LD) |
| Update a clinic address / phone                       | `inject-seo.py` (the `department` array in `ORG_LD`) plus the location page's content |
| Swap the display font                                 | `assets/css/app.css` (`@font-face` + `.font-display` rule). Then add the new woff2 to `setup-fonts.sh`. |
| Disable the lead-bot site-wide                        | Remove the loader in `app.js`. Or, for a single page, add `data-no-leadbot` to `<body>` (the loader checks for it). |

---

## A few "why is it like that?" notes

- **Every page inlines its Tailwind config.** Because there's no build step,
  Tailwind has to know the palette at run time. The config lives in a
  `<script>` block in each page's `<head>`. A sweep script keeps them in
  sync &mdash; don't hand-edit one.
- **Header and footer JSON-driven instead of inlined HTML.** The legacy
  version inlined nav into every page so `file://` would work. We kept the
  placeholders inlined (so the page never has a flash of empty nav) but the
  content comes from JSON so the admin can edit it without touching HTML.
- **Pretty blog URLs use a 200 rewrite, not a 301.** Because users share
  the slug URL and search engines have indexed it. A redirect would change
  the URL in the bar.
- **`_redirects` destination has no `.html`.** Because CF Pages auto-strips
  `.html` and would convert the rewrite into a 308 that drops the slug.
- **OG images are SVG, not PNG.** Because we can generate them with Node
  stdlib (no Sharp / Canvas / Pillow). Social previewers all accept SVG.
- **Auth uses a JWT cookie, not a session table.** Because there's no
  database. The Function can verify a JWT with `JWT_SECRET` alone.
- **Admin writes go through a PR, not a direct commit.** Because the PR is
  the audit log, the review surface, and the rollback handle.
