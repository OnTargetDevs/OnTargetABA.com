# Admin Dashboard

A practical guide to `https://ontargetaba.com/admin/` &mdash; the in-browser
console for editing pages, posts, header, and footer without touching code.

Everything you do in the dashboard becomes a pull request on GitHub. You
review the PR and click "Merge" to publish. That's it.

---

## Signing in

1. Open `https://ontargetaba.com/admin/` in any browser.
2. Click **Sign in with Google**.
3. Pick the Google account whose email is in the `ADMIN_EMAILS` allow-list
   (for the production site, that's the addresses your CF Pages dashboard
   has configured, e.g. `nate.karr@ontargetaba.com`).
4. You're redirected back to `/admin/` and the tiles load.

If your email isn't on the allow-list you'll see a 403 page. Adding a new
admin is a one-line change in CF Pages env vars; see `docs/DEPLOYMENT.md`.

Sessions last about a day and are stored in an `HttpOnly` cookie. If you sit
on the dashboard for several days, you'll get bounced back to the Google
sign-in page; just sign in again.

---

## Dashboard layout

The `/admin/` home screen has four tiles, each linking to a sub-tool:

| Tile        | What it manages                                                         |
|-------------|-------------------------------------------------------------------------|
| **Pages**   | The 31 marketing pages (`index.html`, `about.html`, location pages, &c.). Create, edit, hide, draft. |
| **Posts**   | The 161 blog posts under `assets/blog/`. Edit frontmatter, edit body, publish. |
| **Header**  | The shared announcement bar + nav + breadcrumb map. One file: `assets/data/header.json`. |
| **Footer**  | The shared footer: columns, credit chip, copyright. One file: `assets/data/footer.json`. |

A "Pending PRs" strip across the top of every screen lists open admin PRs so
you can jump straight to GitHub to review the queue.

---

## The six core workflows

### 1. Create a new page

1. **Pages** tile → **New page**.
2. **Pick a template.** You'll see the system templates ("Service page,"
   "Location page," "Resource article") plus any saved templates from
   prior pages. Click one.
3. **Fill the meta:**
   - **Slug** &mdash; the URL segment, e.g. `aba-therapy-toledo`. Lowercase,
     hyphenated, no `.html`.
   - **Title** &mdash; goes into `<title>`, `<h1>`, and the breadcrumb.
   - **Description** &mdash; meta description, 140&ndash;160 chars.
   - **Hero image** &mdash; pick from `assets/images/` or upload.
4. **Click "Open PR."** A spinner runs while the Function creates the file,
   the override JSON, and opens the PR.
5. **Review on GitHub.** The dashboard shows the PR URL. Click it, scan the
   diff, and click **Merge**.
6. **Wait ~90 seconds** for Cloudflare Pages to rebuild. The new page goes
   live at `https://ontargetaba.com/{slug}.html`.

### 2. Visually edit a page

1. **Pages** tile → click any page in the list.
2. The page loads in an iframe with admin chrome around it. Every
   `data-editable` region gets a dashed outline on hover.
3. **Click a region** to edit. A floating toolbar gives you bold, italic,
   link, and image controls. Type or paste; the change shows live.
4. (To edit something not yet marked editable, add `data-editable="region-id"`
   to the element in HTML &mdash; a one-time setup step per region.)
5. **Click "Save changes."** The Function writes a per-page override JSON to
   `assets/page-overrides/{slug}.json` and opens a PR.
6. **Review and merge** on GitHub.

The HTML file itself is never changed by an edit. Overrides layer on top of it
at render time, which is why your edits don't break the page template.

### 3. Hide a page

1. Open the page in the editor.
2. Toggle **Visible → Hidden** in the right rail.
3. Click **Save changes** → review PR → merge.

What "hidden" actually does:

- The page is removed from the nav (`header.js` skips it).
- The page is removed from `sitemap.xml` on the next build.
- The page itself emits `<meta name="robots" content="noindex,nofollow">`
  when it loads its override.
- The URL still works for anyone who has it, but search engines stop
  indexing it.

To fully delete a page you have to remove the HTML file in a normal commit
(out of scope for the dashboard).

### 4. Create a draft

1. Create a new page as in #1.
2. On the meta screen, toggle **Draft on**.
3. Open PR → merge.

After merge:

- Public visitors get a 404 at the URL.
- You (and anyone else signed into `/admin`) see the draft when you visit the
  real URL. This is the catch-all draft-preview Function at work: it checks
  every incoming request for a draft override, and if you're an admin it
  swaps the draft content in at the real path.
- When you're happy, open the page in the editor and toggle **Draft off**, save,
  merge. The page is now live.

This means you can prepare a launch page (with the right slug, OG image, schema,
and content) in advance, share the link with a colleague who's also an admin
for review, and flip a single toggle to publish.

### 5. Edit the header

The header has three sections, all in `assets/data/header.json`:

| Field                | What it controls                                                        |
|----------------------|-------------------------------------------------------------------------|
| `announcement.text`  | The sun-yellow announcement bar across the top.                         |
| `announcement.link`  | Where the bar links to. Leave empty for no link.                        |
| `nav[]`              | The desktop + mobile nav. Each item is `{ label, href, children? }`.    |
| `cta`                | The coral "Get started" button in the top right.                        |
| `breadcrumbs`        | A map of `{ slug -> [(label, href), ...] }` used by `header.js` to render the visual breadcrumb above each page. |

Edit any field in the form. The "Preview" pane shows the rendered header live.
Save → review PR → merge.

The breadcrumb map matters because `inject-seo.py` builds the JSON-LD
`BreadcrumbList` from the same data. Edit once, both the visual and the
structured-data breadcrumbs update.

### 6. Edit the footer

`assets/data/footer.json` drives:

- **Columns** &mdash; each column has a heading and a list of links. Drag to
  reorder, click "+" to add an item.
- **Credit chip** &mdash; the "Built by Shalom Karr" line. Editable.
- **Copyright** &mdash; the legal line at the bottom.
- **Social links** &mdash; the icon row.

Save → review PR → merge. Footer changes show on every page after the rebuild.

---

## "Save as template"

After you've built and styled a page you're happy with, you can promote it
to a reusable template:

1. Open the page in the editor.
2. Click **... → Save as template**.
3. Give it a name ("Location page v2") and a description ("Hero with map,
   address card, three services, two reviews, CTA").
4. Submit → review PR → merge.

The Function strips the page-specific content (title, hero image, slug-bound
links) and saves the skeleton under `admin/templates/{name}.json`. Next time
you click **New page**, it appears in the template picker.

---

## "Why don't my changes show up immediately?"

Every save opens a pull request. We chose this over "save = publish" for three
reasons:

1. **Version history.** Every edit has a commit, an author, a diff, and a
   timestamp. If something breaks you can revert one PR.
2. **Review.** Two admins can vet a tricky edit before it goes live.
3. **Safety.** A merge is a deliberate click, not an accident.

After you click **Save** in the dashboard:

- A new branch is created on GitHub (`admin/{slug}-{timestamp}`).
- A commit is added.
- A PR is opened against `main`.
- The dashboard shows the PR URL and copies it to the clipboard.
- **You merge the PR on github.com.** That's the publish step.
- Cloudflare Pages picks up the merge and rebuilds in 60&ndash;120 seconds.

For very small typo fixes there's a planned "fast-merge" path that opens and
auto-merges in one click; until then, all edits route through the PR step.

---

## Troubleshooting

### "There's a yellow banner that says my view is stale"

You're looking at a version of `/admin` that was loaded before the most
recent deploy. Hit **Reload** in the banner (or hard-refresh) to pull the
latest UI.

### "I get a 401 / I'm bounced to sign-in repeatedly"

- Your session JWT expired or was rotated.
- Sign in again. If sign-in itself fails:
  - Check that your email is still in `ADMIN_EMAILS` on CF Pages.
  - Check that the Google OAuth client's authorized redirect URI matches
    `https://ontargetaba.com/api/auth/callback` exactly (including scheme).
- Clearing site cookies and signing in fresh fixes most stuck states.

### "My PR has a merge conflict"

Two admins edited the same page at the same time. Either:

- Open the PR, click **Resolve conflicts** on GitHub's editor, pick the
  winning version, commit, and merge; or
- Close the PR and re-do your edit (the other PR has already merged or will
  merge first).

The dashboard pre-flights "is there a pending PR for this page" before letting
you save, so true conflicts are rare in practice.

### "The page edit saved but the site still shows the old text"

- Did the PR merge? Check the **Pending PRs** strip.
- Did the build finish? Check the CF Pages dashboard. Builds normally take
  60&ndash;120 seconds.
- Is your browser caching? `_headers` caches HTML for a minute and assets for
  longer. A hard refresh (Ctrl+Shift+R) clears it.

### "I edited the header but the breadcrumb on one page still looks wrong"

The breadcrumb map in `header.json` keys by page slug. If your slug doesn't
have an entry, `header.js` falls back to a generated chain (Home → Page Title).
Add an explicit entry to fix it.

### "The OG image didn't update after I changed the title"

OG images are regenerated by the build, not the admin Function. The build
runs on PR merge; wait for it to finish. If you really need a re-render
without an edit, push an empty commit.
