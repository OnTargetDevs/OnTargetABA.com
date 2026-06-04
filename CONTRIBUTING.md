# Contributing

This repo powers the On Target ABA marketing site, deployed to Cloudflare
Pages from `main`. This guide is for maintainers and any future contributor
working in the codebase (including the admin dashboard's automated PRs).

## PR workflow

- **Every change goes through a Pull Request.** Nothing pushes to `main`
  directly &mdash; not hand-authored commits, and not content edits made
  through the admin dashboard.
- The admin dashboard at `/admin` opens PRs against
  `Shalom-Karr/OnTargetABA.com` on your behalf. The PR itself is the audit
  log for any content change.
- Keep PRs scoped. One feature, one fix, or one content change per PR.
- Wait for CI (`validate-content`, `lighthouse`, `broken-links`) to pass
  before merging.

## Commit messages

Use Conventional Commit prefixes so the changelog workflow can categorize
entries automatically:

| Prefix      | Meaning                                                          |
|-------------|------------------------------------------------------------------|
| `feat:`     | New user-visible feature or page                                 |
| `fix:`      | Bug fix (rendering, links, accessibility, build script, etc.)    |
| `chore:`    | Repo / tooling / dependency updates with no user-facing effect   |
| `content:`  | Blog post, copy, or marketing-text changes                       |
| `docs:`     | README, CONTRIBUTING, docs/ updates                              |

Write the **why**, not the **what** &mdash; the diff already shows the what.

## Branch naming

- **Admin-generated PRs:** `admin/<kind>-<slug>-<short-uuid>`, e.g.
  `admin/blog-aba-tips-for-parents-9f3a2b`. The dashboard generates these.
- **Hand-authored work:** freeform, but keep it descriptive
  (`fix/header-active-state`, `feat/insurance-page-faq`,
  `chore/upgrade-tailwind-cdn`).

## Code style

No formatter is enforced. Match the surrounding file.

- **JSON / YAML / HTML / JS / CSS:** 2-space indent.
- **Markdown:** 2-space indent for nested lists. Tabs are fine inside
  markdown tables if they help alignment.
- **HTML entities** for arrows, em-dashes, and curly quotes in body copy
  (`&mdash;`, `&rarr;`, `&hellip;`) &mdash; this protects against mojibake
  if a CDN serves the wrong charset.

## Adding a page template

Page templates live in `website/assets/templates/*.html` and are consumed
by the admin dashboard's "new page" flow.

- **Placeholders** (mustache-style, replaced by the dashboard before the PR
  is opened):
  - `{{TITLE}}` &mdash; HTML `<title>` and OpenGraph title
  - `{{DESCRIPTION}}` &mdash; meta description and OG description
  - `{{H1}}` &mdash; main hero heading
  - `{{SUBHEAD}}` &mdash; hero subhead
  - `{{BODY_INTRO}}` &mdash; opening paragraph block
- **Editable regions** are marked with `data-editable="<key>"` on the
  containing element. The dashboard rehydrates these regions when the page
  is later edited; the key must be unique within the page.
- **Required script tags** at the bottom of every template:
  - `/assets/js/app.js` (scroll reveal, sticky nav, FAQ, lead-bot loader)
  - `/assets/js/header.js` and `/assets/js/footer.js` (shared chrome)
- **Required head tags:** the auto-SEO markers
  `<!-- auto-seo-start -->` / `<!-- auto-seo-end -->` so
  `scripts/inject-seo.py` can fill them in on the next build.

## Local development

The site itself has no build step &mdash; open any `website/*.html` from
`file://` to preview. For the admin dashboard and CF Pages Functions:

1. Install the Cloudflare Wrangler CLI: `npm i -g wrangler`.
2. Create `website/.dev.vars` with the secrets your Functions need
   (`GITHUB_TOKEN`, `JWT_SECRET`, `ADMIN_EMAILS`, OAuth client IDs, etc.).
   **This file is gitignored** &mdash; never commit it.
3. From `website/`: `wrangler pages dev .` to serve the site with Functions
   on `localhost:8788`.
4. Visit `http://localhost:8788/admin` to exercise the dashboard against
   your local Functions.

For pure content preview without Functions, `python -m http.server 8000`
from `website/` is enough.

## Testing

Before pushing, run the same checks CI will run:

```bash
# Frontmatter + JSON validation
python3 -c "import yaml, pathlib, sys; \
  [yaml.safe_load(p.read_text().split('---',2)[1]) \
   for p in pathlib.Path('website/assets/blog').glob('*.md')]"

# Build scripts dry-run
python3 website/scripts/build-blog-index.py
python3 website/scripts/build-sitemap.py
```

The `validate-content` workflow in `.github/workflows/` runs these on every
push and PR. Reproducing it locally before pushing avoids round-tripping
through CI for an obvious typo.

## Further reading

See `docs/` for the user-facing walkthroughs (admin dashboard, deployment
checklist, architecture notes).
