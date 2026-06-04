# Ideas

A backlog of things that aren't on the active plan but are worth doing later.

## How to use this file

- **Read it before starting a new feature.** If something here matches what
  you're about to build, it might have notes on prior thinking or a half-formed
  spec.
- **Add to it freely.** Anything that comes up in a conversation as "we could
  do X someday" belongs here, not in PLANS.md. PLANS.md is for things we've
  committed to; this file is the lukewarm bin.
- **Each entry has:** a one-line summary, a longer "why bother," and a rough
  effort tier (S / M / L). No deadlines. No owners.
- **Promote to PLANS.md when ready.** When you actually decide to do one of
  these, move it (or summarize it) into PLANS.md as a new active or "next
  up" entry.
- **Delete entries that no longer make sense.** Don't let dead ideas linger.

---

## Backlog

### AI-assisted blog post titles (S)

When an admin starts a new post draft, hit an LLM with the body and offer
three suggested titles + meta descriptions optimized for click-through. The
admin picks one or writes their own. Cost is trivial (a few cents per post)
and the lift on CTR from search results is real. Could extend to suggested
internal-link anchors and category tagging.

### Internal search (M)

Add a `/search?q=` route that fetches `assets/blog/index.json` plus a
`pages-index.json` (new), runs a client-side fuzzy match (Fuse.js or a
50-line homegrown ranking), and renders a results list. No backend, no
analytics needed. Wire the WebSite JSON-LD's `SearchAction.urlTemplate` to
point at it so Google may show a sitelinks search box. Currently the schema
points at `?s={search_term_string}` which is a WordPress legacy.

### View counters via Cloudflare KV (M)

A tiny Function that increments a counter in CF KV per page view and
exposes a `/api/views/{slug}` endpoint. Display "1,247 reads" on blog posts
once a threshold is met. KV is cheap and the writes can be debounced
(server-side `wait until` so the request isn't delayed). Bonus: a small
"most read this week" rail on the blog landing.

### Spanish translation (L)

The Salt Lake Valley and Cleveland clinics serve significant Spanish-speaking
populations. Spec: side-by-side language toggle in the nav, mirrored URL
structure (`/es/{slug}` or `?lang=es`), translated page content stored as
`assets/page-overrides-es/{slug}.json`, `hreflang` alternates in the head,
`og:locale_alternate` for OG. The admin dashboard would need a side-by-side
edit view. Real work; do it right or not at all.

### Scheduled publish (M)

Currently a post or page edit goes live whenever the admin merges the PR.
Add an optional "publish at" timestamp in the admin UI; the Function stores
the draft as merged-but-scheduled (a flag in the override JSON). A cron-style
Function that runs every five minutes flips scheduled-to-live overrides at
the right time. Useful for "publish Tuesday morning while I'm asleep."

### Image upload in the admin (M)

Right now images live in `assets/images/` and have to be committed by a
developer. Add an upload flow: admin picks a file → Function streams it to
GitHub Contents API as a new blob → it's available in subsequent picker
dropdowns. Add basic optimization (strip EXIF, resize > 2000px, convert to
WebP) using a Function-side library.

### Multi-author roles (S → M)

Today, `ADMIN_EMAILS` is a flat allow-list. Split into roles:

- **Owner** &mdash; everything, including header/footer + template management.
- **Editor** &mdash; can edit pages and posts but not header/footer/templates.
- **Author** &mdash; can only edit blog posts and only their own drafts.

Implementation: a second env var like `ADMIN_ROLES_JSON` with
`{ email: role }`. Functions check the role before allowing the write.

### Audit log (S)

The PR list on github.com is the de facto audit log, but a friendlier
in-dashboard view would be nice. List the last 50 admin PRs (open + recent
merged), color-coded by status, with a one-line summary ("edited
`about.html`," "hid `careers.html`," "added blog post `aba-explained.md`").
Just a wrapper over the GitHub Pulls API.

### Analytics with Plausible or Umami (S)

The legacy site uses GTM + Hotjar + FB Pixel. For the new site, install a
single privacy-friendly analytics script (Plausible or self-hosted Umami).
One `<script>` in the shared head, no cookie banner needed because no PII
is collected. Dashboard at analytics.{domain}.com.

### A11y audit + autofix sweep (S)

Run axe-core or Lighthouse over every public page during the build (the
dashboard's "Verify" job can do this). Fail the build on critical violations.
The skip link, focus rings, and reduced-motion gates are already in place;
this would lock the bar in.

### A "send to phone" / SMS preview for marketing pages (S)

For sales conversations: a clinic intake person types a phone number,
Function sends a text with a link to the relevant page (e.g. autism-testing).
Twilio-cheap. Useful for converting in-call leads. Pair with a per-source UTM
tag so we can see which conversations turn into form fills.

### Form abandonment recovery (M)

The Jotforms emit a `pageStart` event when they open. A small Function logs
that the form was opened with the visitor's anonymous fingerprint, and if
no submission follows within 24 hours, the next time that visitor returns,
the site shows a soft "Need help finishing?" prompt with a phone number.
Borderline creepy if overdone &mdash; keep the tone gentle.

### Per-clinic landing page A/B testing (M)

Cloudflare Workers can route a percentage of traffic to a B variant of a
landing page (e.g. murray-utah.html vs. murray-utah.b.html). Track which
variant produces more form fills via a UTM tag in the Jotform submission.
Run experiments two weeks at a time. Could be expanded to test hero copy,
CTA phrasing, and review marquee composition.

### Click-to-call analytics (S)

The phone numbers on the site are bare `tel:` links. Wrap them with a
click handler that logs a "phone-cta-click" event before the browser
launches the dialer, keyed by which page and which CTA. Pair with the
Plausible / Umami install above so we can answer "do the location pages
generate more calls than the home page?" without guessing.

### Sitemap segmentation (S)

The single `sitemap.xml` is fine for now (~200 URLs), but if the blog
grows past 1000 posts we should split into `sitemap-pages.xml` +
`sitemap-posts.xml` referenced from a `sitemap-index.xml`. Lets Google
Search Console show per-segment coverage metrics, which is much easier to
debug than the aggregate view. Trivial change to `build-sitemap.py`.

### Inline "report a typo" link (S)

A tiny "spot a typo? let us know" link in the page footer that opens a
prefilled GitHub issue with the page slug and selected text. Catches the
long tail of small content errors without requiring the visitor to know
who to email. Zero infra; just a URL template targeting the repo's
`issues/new`.

### Lead-bot replacement (M)

The legacy `lead-bot-*` widget is gone; the current `leadbot.js` is a
placeholder shell. Decide whether to rebuild it as a triage flow
(qualifying question → "we'd like to talk" → opens Jotform with phone
pre-filled) or replace with a vendor (Tidio, Crisp, &c.). Either way,
keep the lazy-load + reduced-motion gating that's already in place.

### Pre-rendered blog HTML fallback (L)

For browsers with JavaScript disabled or for crawlers that don't run JS,
the blog renderer returns an empty page. Add a build step that
pre-renders each post into a static HTML mirror (`/blog/posts-static/{slug}.html`)
that the dynamic page is wired to fall back to with a `<noscript>` link.
Doubles the post storage but is a defensive move for indexing.

### Per-page redirect editor in the admin (S)

Right now `_redirects` is edited by hand. Add an admin module that
manages redirects (especially for the legacy WordPress URLs that should
forward to the new equivalents). Same PR flow as everything else.

### "Last updated" stamps on blog posts (S)

Posts already have a `date` in frontmatter but no `last_updated`. Add an
optional `updated:` field; if present, render "Last updated MMM D, YYYY"
below the byline and emit `dateModified` in the Article JSON-LD. Helps
older evergreen posts hold their position in search results when refreshed.

### Newsletter signup with double opt-in (S → M)

Add a simple "get parent guides in your inbox" email capture in the
footer and on blog post pages. A small Function writes the address to a
provider (Buttondown, Beehiiv, or a self-hosted Listmonk) and triggers a
confirm email. No GDPR landmines as long as double opt-in is enforced.
Pair with a monthly "best of the blog" digest from the marketing person.

### Resource downloads (S)

Several blog posts conceptually pair with downloadable PDFs (intake
checklists, IEP-prep worksheets, &c.). Drop the PDFs in
`assets/downloads/`, add a `download:` field to post frontmatter, and
render a download card at the bottom of qualifying posts. Track downloads
with the analytics install above to learn which resources matter.

### Per-clinic phone-number tracking (S → M)

Right now every page shows the main number `(888) 989-5011` *and* the
local clinic number. A small CallRail-style swap lets us measure which
acquisition source produced which call. Cheap if we use a single
tracking-number provider; otherwise drop and rely on the click-to-call
analytics idea above.

---

## Promoting an idea to a plan

When you decide to actually build one of these:

1. **Sketch the work.** Goal / scope / non-goals / build order / risks /
   definition of done. The template is in `PLANS.md` under "Plan-writing
   conventions."
2. **Add it to `PLANS.md`** under **Next up** (if not started) or
   **Active** (if starting now).
3. **Strike or remove** the entry here so the backlog stays a backlog.
4. **Link the PR.** Once a PR is open, drop the URL into the plan entry
   so the trail is clickable later.

Don't let plans live in two places &mdash; once it's in `PLANS.md`, this
file forgets about it.
