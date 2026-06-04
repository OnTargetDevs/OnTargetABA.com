# Plans

A running log of the planning work for this project. The active plan is
listed first; older plans are summarized at the bottom for context.

## How to use this file

- The **Active** section is the source of truth for what's being worked on
  right now. There should usually be exactly one active plan.
- The **Next up** section is for plans we've decided on but haven't started.
- The **Recent (shipped)** section is for plans that landed within the last
  few months &mdash; useful for context when someone asks "wait, why is X
  built that way?"
- Older plans get pruned to a one-paragraph history at the bottom.
- Anything purely speculative belongs in `docs/IDEAS.md`, not here.

---

## Active

### Admin dashboard + repo polish (revised)

**Goal.** Ship a working `/admin/` dashboard on top of the existing static
site so non-developers can edit pages, posts, header, and footer through a
browser instead of a code editor. Tighten the surrounding scripts and docs
in the same effort.

**Scope.**

- **Auth layer.** Google OAuth + JWT cookie + `ADMIN_EMAILS` allow-list.
  Single sign-in page; no separate accounts to manage.
- **Edit flow via PRs.** Every save creates a fresh branch, commits the
  override JSON or markdown, opens a PR back to `main`. No direct writes.
  Merging the PR triggers the normal CF Pages rebuild.
- **Six admin capabilities** &mdash; create page, visually edit page, hide
  page, draft page, edit header, edit footer. Plus "save as template" so
  the admin can build up a reusable library.
- **Draft preview.** A catch-all Cloudflare Pages Function that, on every
  request, checks for a draft override and serves the draft to signed-in
  admins at the real URL while public visitors get a 404.
- **JSON-driven content.** Header, footer, and per-page overrides live in
  `assets/data/` and `assets/page-overrides/`, picked up by `header.js`,
  `footer.js`, and a new `page-overrides.js`.
- **Docs sweep** (this folder). Eight files covering architecture, admin
  use, SEO, indexing, lifecycles, deployment, ideas backlog, and this
  plans file.

**Build order.**

1. Empty Function scaffolding (`/functions/api/auth/*`,
   `/functions/api/pages/*`, etc.) returning stubs.
2. Auth: `/api/auth/login`, `/api/auth/callback`, `/api/auth/me`,
   `/api/auth/logout`. JWT helper, `requireAdmin()`.
3. Admin shell at `/admin/`: sign-in page, dashboard tiles.
4. Pages module: list, create-from-template, edit-region, hide, draft.
5. Posts module: list blog posts, edit frontmatter, edit markdown.
6. Header / Footer modules: simple form UIs over the two JSON files.
7. Template module: list, save-as, delete.
8. Catch-all draft-preview Function.
9. Doc set (this).
10. Polish: stale-deploy banner, pending-PRs strip, optimistic UI.

**Non-goals.**

- Multi-author roles. Flat allow-list for v1.
- Image upload. Manual commit for now.
- Scheduled publish. Manual merge for now.
- Search / analytics / KV view counts. All in `IDEAS.md`.

**Risks.**

- **PR conflicts** if two admins edit the same page at once. Mitigation:
  pre-flight check before save; show pending PRs strip.
- **OAuth misconfig.** Most-likely-bug is `redirect_uri_mismatch`. Doc the
  exact URI in `DEPLOYMENT.md`.
- **Function size limits.** CF Pages Functions have request/response limits;
  unlikely to hit them with JSON-only payloads but worth knowing.

**Definition of done.**

- An admin signs in, edits the home-page hero copy, sees a PR open, merges
  it, and the change is live in under three minutes.
- An admin creates a new page from a template, fills three fields, opens a
  PR, merges it, and the page appears at its slug.
- An admin toggles a page to Draft, saves, merges &mdash; the page is gone
  from public view and visible to them at the same URL.

---

## Next up

### Image upload in the admin

Most editor friction in v1 will be "how do I add an image?" Spec is in
`IDEAS.md`. Likely the second thing we build after the dashboard ships.

### Scheduled publish

The clinic's marketing person wants to queue posts for Tuesday mornings.
Small Function + a timestamp field in the override JSON. Spec in `IDEAS.md`.

### Internal search

Once the blog hits the second hundred posts, an in-site search becomes
worthwhile. Plain client-side fuzzy match over `index.json`. Spec in
`IDEAS.md`.

---

## Recent (shipped)

### UX + perf sweep (June 2026)

Four bundled improvements that landed together:

- **Self-hosted fonts.** Plus Jakarta Sans + Fraunces moved from Google
  Fonts to `assets/fonts/` (variable woff2, Latin subset). New scripts:
  `setup-fonts.sh`, `selfhost-fonts.mjs`. Removed three preconnects, added
  a single preload for the critical 600-weight Plus Jakarta Sans.
- **Skip-to-content link.** `add-skip-link.mjs` injects a visually-hidden
  skip link as the first child of `<body>` on every page; reveals on focus.
- **Deferred lead-bot.** Moved the chat widget into its own `leadbot.js`
  and made `app.js` lazy-load it on idle or first user gesture. Shaved
  hundreds of KB off the first paint.
- **Call CTA on form pages.** `pre-intake-form.html`, `contact.html`, and
  `autism-testing.html` got a sticky "Prefer to talk?" sidebar next to
  the Jotform.

### OG image pipeline (May 2026)

Replaced manual share images with `gen-og-images.mjs`: 1200x630 SVG per
post + per main page, regenerated at build time when `index.json` changes.
`inject-seo.py` auto-resolves the per-page SVG; `blog/post.html` does the
same at runtime.

### CF Pages migration (April 2026)

Moved the deploy from a hand-rolled VPS to Cloudflare Pages. Settled the
`Root directory: /website`, `Build command: bash build.sh`, `Build output: .`
incantation. Added `_redirects` (pretty blog URLs) and `_headers` (security
+ cache + correct MIME for sitemap/robots/key file). Wired IndexNow into
the deploy pipeline.

### Blog migration (March 2026)

161 WordPress posts scraped and rewritten as markdown with YAML
frontmatter under `assets/blog/`. Built `blog/post.html` as a single
runtime renderer using `marked` + `DOMPurify`. Added `build-blog-index.py`
to derive `index.json` from frontmatter on every build. Removed the
WordPress scraper from the repo once the markdown was in place.

### Site redesign (Jan&ndash;Feb 2026)

Hand-rebuilt the marketing site against the Figma source of truth: new
palette (cream, ink, teal, coral, sun, sage), new typography (Fraunces
display + Plus Jakarta Sans body), bullseye / target-mark visual system
replacing the old puzzle-piece imagery. New nav structure with a
shared `header.js` / `footer.js` injection model so a nav edit is a
one-place change.

---

## Archived (one-paragraph history)

The original site lived on WordPress + Elementor with Fluent Forms,
Jotform, Hotjar, FB Pixel, and two Google Tag Manager containers
(`GTM-N2RP5GST`, `GTM-W42536PM`). In late 2025 the decision was made to
rebuild as a static site for performance, maintainability, and lower
ongoing cost. Cloudflare Pages was chosen over Vercel for cost and for
Pages Functions (which let the admin layer ship without a separate
backend). The Jotform IDs were preserved end-to-end so existing form
submissions continued to land in the same back-office workflow.

---

## Plan-writing conventions

A few patterns to follow when adding a new plan to this file, so the
running log stays useful as it grows.

### Anatomy of a plan entry

- **Goal.** One or two sentences. What does "done" look like, in business
  terms?
- **Scope.** A bulleted list of in-scope deliverables. Be specific enough
  that a future reader can tell what was actually built.
- **Build order.** A numbered list of steps that minimize work-in-flight.
  This is the working order, not necessarily the merge order &mdash; some
  steps can ship to `main` independently as long as feature flags hide
  them from users.
- **Non-goals.** What we explicitly decided not to do this round. Equally
  important as the goals. Forgetting this section is how scope creeps.
- **Risks.** Two to four. Mitigations for each, if known.
- **Definition of done.** Specific, testable. "An admin can do X in under
  Y seconds." If you can't write this, the plan isn't ready.

### When to move a plan from Active → Recent

When every Definition-of-done bullet is checked off in production. Not
when the PR is merged &mdash; when the user-visible behavior actually
matches.

### When to prune an old plan

If it's older than ~6 months and the codebase has moved on enough that
reading it would mislead a new contributor, collapse it into the
Archived paragraph at the bottom. The goal is for this file to be
*useful*, not exhaustive.

### When to add a "Next up" entry

Only when:

1. The active plan has a clear off-ramp date or milestone.
2. A specific decision (not just an idea) has been made about what's next.

If it's "we should do X eventually," that's `IDEAS.md`, not here.

### Inter-doc cross-references

- Implementation specifics live in `ARCHITECTURE.md` or `HOW_IT_WORKS.md`,
  not here. Plans describe intent and ordering; the other docs describe
  the resulting system.
- Backlog items live in `IDEAS.md`. Promote here only when the decision
  to do them is final and the work is sized.
- Deployment / runbook details live in `DEPLOYMENT.md`. Don't repeat
  "set this env var" inside a plan; reference the deployment section.
