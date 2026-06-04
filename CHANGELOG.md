# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
where it makes sense for a content-driven static site.

Entries are grouped by `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`,
and `Security`. The `changelog.yml` workflow appends new entries to the
`[Unreleased]` block based on Conventional Commit prefixes on `main`.

## [Unreleased]

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
