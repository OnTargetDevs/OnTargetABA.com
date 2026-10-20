# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
where it makes sense for a content-driven static site.

Entries are grouped by `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`,
and `Security`. The `changelog.yml` workflow appends new entries to the
`[Unreleased]` block based on Conventional Commit prefixes on `main`.

## [Unreleased]

## [Unreleased] &mdash; 2026-10-20

### Docs

- expand careers-page coverage in website audit (Window 4 request)
- website factual-accuracy audit (2026-10-19)


## [Unreleased] &mdash; 2026-10-20

### Added

- localise 40 hotlinked hero images off the WordPress box

### Changed

- spinner until the Jotform renders, mount it immediately, 20 s fallback link


## [Unreleased] &mdash; 2026-10-19

### Added

- remove the Potty Training Program page and every reference; old URL redirects to services


## [Unreleased] &mdash; 2026-10-19

### Fixed

- use raw-emoji sources for the 4 emoji post permalinks

### Docs

- record emoji-redirect verification result in the parity audit


## [Unreleased] &mdash; 2026-10-19

### Added

- Five Google Ads landing pages mirroring the current WordPress/Elementor PPC
  pages, built on the `landing.html` conversion skeleton at the same slugs:
  `aba-therapy-salt-lake-city-lp-g-new`, `on-target-aba-autism-testing-autism-evaluations`,
  `aba-therapy-col-lp-g`, `aba-therapy-cleveland-lp-g`, and
  `autism-testing-autism-evaluations-columbus-g-lp`. All `noindex, nofollow`
  and excluded from the sitemap, matching `landing.html`.
- `assets/images/landing/insurance/` &mdash; mirrored insurer logos (Humana,
  CareSource, Utah Medicaid, Healthy U, SelectHealth, Health Choice Utah,
  EMI Health) for the landing-page insurance strips.
- **WordPress parity + full blog import.** Imported the 82 blog posts that were
  live on `ontargetaba.com` but missing from beta (now 248 posts total), each as
  `assets/blog/<slug>.md` with locally-downloaded hero images under
  `assets/blog/images/<slug>/` (no `wp-content` hotlinks; body images stripped to
  match the pre-existing posts). Built the one missing WordPress page,
  `aba-therapy-ut-pc.html`, as a `noindex` Murray/Utah PPC conversion page on the
  `landing.html` skeleton (Jotform `252544960929165`), excluded from the sitemap.
  Full audit in `docs/wp_parity_2026-10-19.md`.

### Changed

- `_redirects`: added the current WordPress post-permalink shape
  `/blog/{slug}/` &rarr; `/blog/posts/{slug}` (301) so every live post URL keeps
  working after cutover (previously only legacy `/YYYY/MM/DD/{slug}/` was mapped);
  added `/blog/category/*`, `/blog/author/*`, `/blog/tag/*` &rarr; `/blog`; and
  added specific rules mapping the four emoji-prefixed WP post slugs to their
  clean beta slugs. Regenerated `sitemap.xml` (301 URLs: 53 static + 248 posts).

### Removed

- Dropped the two `_redirects` 301s from `/on-target-aba-autism-testing-autism-evaluations`
  (and its trailing-slash variant) to `/autism-testing`, which would otherwise
  shadow the new same-slug landing page.

## [Unreleased] &mdash; 2026-07-16

### Added

- update footer.json (#10)


## [Unreleased] &mdash; 2026-06-23

### Added

- delete blog post "test" (#8)


## [Unreleased] &mdash; 2026-06-17

### Fixed

- recover Executive Team cards (Brittany, Jordan, Cerys)

### Chore

- cache-bust refresh after exec recovery


## [Unreleased] &mdash; 2026-06-17

### Fixed

- restore Regional Clinical Directors + Clinic Leadership sections


## [Unreleased] &mdash; 2026-06-17

### Added

- publish /meet-the-team


## [Unreleased] &mdash; 2026-06-17

### Added

- update header.json (#7)


## [Unreleased] &mdash; 2026-06-17

### Added

- port 5 missing WP blog posts + restructure meet-the-team draft


## [Unreleased] &mdash; 2026-06-17

### Added

- wire all 21 new SEO landing pages + fix girls-page issues


## [Unreleased] &mdash; 2026-06-17

### Added

- 3 culture pages live + meet-the-team draft + WP-gap audit


## [Unreleased] &mdash; 2026-06-17

### Fixed

- build-sitemap.py honors SITE_DOMAIN env override


## [Unreleased] &mdash; 2026-06-17

### Fixed

- broken-links — feed sitemap.xml + fail loudly when lychee crashes


## [Unreleased] &mdash; 2026-06-17

### Fixed

- real LinkedIn slug is /ontargetaba/ (no hyphen)


## [Unreleased] &mdash; 2026-06-17

### Fixed

- broken-links cleanup — recurse, exclude socials, kill .html 308s


## [Unreleased] &mdash; 2026-06-17

### Fixed

- drop --exclude-mail from lychee args (default in current release)


## [Unreleased] &mdash; 2026-06-17

### Fixed

- broken-links issue body — closing fence on its own line


## [Unreleased] &mdash; 2026-06-17

### Fixed

- broken-links workflow now crawls beta.ontargetaba.com


## [Unreleased] &mdash; 2026-06-17

### Fixed

- blog post ReferenceError was tripping noindex on real articles


## [Unreleased] &mdash; 2026-06-17

### Fixed

- fail fast in purge-cache workflow when CF secrets missing


## [Unreleased] &mdash; 2026-06-17

### Added

- server-render visible breadcrumbs + BreadcrumbList on blog posts


## [Unreleased] &mdash; 2026-06-17

### Fixed

- meta write regexes also need [^"]* (not [^"']*)


## [Unreleased] &mdash; 2026-06-17

### Fixed

- meta regex apostrophe truncation + hero image UTF-8 + post race

### Chore

- refresh tour-results.md after R4 fixes


## [Unreleased] &mdash; 2026-06-17

### Added

- round-3 implementation (Wave 7) + per-page SEO admin


## [Unreleased] &mdash; 2026-06-17

### Fixed

- cover LeadTrap full dep tree (fonts.bunny.net, github.io, doubleclick)


## [Unreleased] &mdash; 2026-06-17

### Chore

- gitignore __pycache__


## [Unreleased] &mdash; 2026-06-17

### Added

- round-2 implementation (Wave 6) — 42 findings


## [Unreleased] &mdash; 2026-06-17

### Fixed

- real branded favicon + per-deploy asset cache-busting


## [Unreleased] &mdash; 2026-06-17

### Fixed

- allow Google Ads conversion + WhatConverts hosts


## [Unreleased] &mdash; 2026-06-17

### Added

- implement LOW severity findings from missing.md (Wave 4)


## [Unreleased] &mdash; 2026-06-17

### Added

- implement MEDIUM severity findings from missing.md (Wave 3)


## [Unreleased] &mdash; 2026-06-17

### Added

- implement HIGH severity findings from missing.md (Wave 2)


## [Unreleased] &mdash; 2026-06-17

### Added

- WP-legacy URL redirects (date archives, renamed pages, PPC LPs)


## [Unreleased] &mdash; 2026-06-17

### Docs

- add missing.md from multi-agent audit (111 findings)


## [Unreleased] &mdash; 2026-06-17

### Fixed

- shorter cache-control on /assets/js + css


## [Unreleased] &mdash; 2026-06-17

### Changed

- lazy-load Jotform iframes + preconnect to form hosts


## [Unreleased] &mdash; 2026-06-17

### Added

- set chat widget to leadtrap (#3)

### Fixed

- WebP/PNG/JPG uploads were UTF-8 double-encoded + add /api/recent-prs


## [Unreleased] &mdash; 2026-06-17

### Added

- chat widget chooser + head scripts editor
- update blog post "test" (#2)
- new blog post "test" (#1)


## [Unreleased] &mdash; 2026-06-17

### Added

- landing.html — Google Ads-targeted conversion page


## [Unreleased] &mdash; 2026-06-17

### Changed

- fix reveal flash, inline header/footer JSON

### Fixed

- preload only the JSON files actually fetched, match CORS mode


## [Unreleased] &mdash; 2026-06-16

### Changed

- self-host Tailwind + nav preload/prefetch + repo move docs


## [Unreleased] &mdash; 2026-06-05

### Chore

- upload image assets/images/uploads/2026-06/cmh-schedule-2026-06-05-d11a2a7f.webp


## [Unreleased] &mdash; 2026-06-05

### Added

- section template "header" (#6)


## [Unreleased] &mdash; 2026-06-04

### Added

- new page "test" (#5)


## [Unreleased] &mdash; 2026-06-04

### Chore

- remove orphan assets/blog/test.md (was at repo root, not under website/)


## [Unreleased] &mdash; 2026-06-04

### Added

- update blog post "test" (#4)
- update blog post "test" (#3)


## [Unreleased] &mdash; 2026-06-04

### Added

- new blog post "test" (#2)


### Added

- 2026-06-04 &mdash; Admin dashboard release. Static admin UI at `/admin`
  backed by Cloudflare Pages Functions in `website/functions/`. Google
  OAuth against `ADMIN_EMAILS`, HttpOnly JWT session cookie, draft preview
  via a catch-all Function, and a PR-per-edit workflow against
  `Shalom-Karr/OnTargetABA.com`.
- CI: `validate-content`, `lighthouse`, `broken-links`, and `changelog`
  GitHub Actions workflows.
- Repo polish: `LICENSE`, `CONTRIBUTING.md`, and this `CHANGELOG.md`.

### Changed

- `_headers`: `/api/*` and `/admin/*` are now `no-cache, no-store,
  must-revalidate` and `noindex`. `/assets/js/header.js` and
  `/assets/js/footer.js` shortened to a 5-minute cache so banner / nav
  changes propagate within minutes.

### Removed

- Nothing yet.
