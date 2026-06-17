# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
where it makes sense for a content-driven static site.

Entries are grouped by `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`,
and `Security`. The `changelog.yml` workflow appends new entries to the
`[Unreleased]` block based on Conventional Commit prefixes on `main`.

## [Unreleased]

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
