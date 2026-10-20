# Lighthouse round — 2026-10-20

Goal (Nate): every Lighthouse category green on the home page (CI gate: performance ≥ 90, accessibility ≥ 95, SEO ≥ 95, best-practices ≥ 90; CI audits the Cloudflare Pages preview root on mobile defaults).

## What merged
- **#19** accessibility: `role="img"` on review stars, `<main>` landmark on every page (`scripts/fix-a11y.py`), contrast tokens `--c-coral-btn #CE4635` (buttons under white text) and `--c-mute #607181`.
- **#22** performance: precompiled Tailwind (`scripts/build-tailwind.mjs` → `assets/css/tailwind.css`, 45 KB; `/admin` keeps the runtime JIT; editor classes safelisted in `tailwind.config.js`), hero photo as WebP (374 KB → 41 KB, `scripts/optimize-images.py`), header-height reserve for CLS and the stylesheet link via `scripts/optimize-pages.py`, Fraunces-400 preload via `scripts/selfhost-fonts.mjs`.

## Measured after the merges (beta.ontargetaba.com, mobile defaults)
| Where | Perf | A11y | Best-practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| Laptop run, Lighthouse latest (loaded machine) | 65 | 100 | 73 | 100 | 3.3 s | 1,020 ms | 0.02 |
| Before this round (CI on PR previews, 2026-10-19/20) | 64–69 | 89–90 | 100 | 100 | — | — | 0.24 |

The laptop's best-practices 73 comes from two audits CI's Lighthouse does not run or hit: "uses third-party cookies" (Google tags / Hotjar) and a console error for `s.wc-data.com` (WhatConverts), which this laptop's web filter blocks. The CI run on this PR's preview is the authoritative post-merge number.

## What is left for performance
Total blocking time is now dominated by third-party analytics on the home page (three Google tag destinations, Hotjar, WhatConverts ≈ 710 ms of main-thread work). Deferring them until the page is interactive is the standard next step, but it changes *when* conversions and pageviews are recorded, so it is a decision for Nate and the ads lane, not a build change.
