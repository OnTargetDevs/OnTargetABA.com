# On Target ABA — redesigned site

A modern static rebuild of [ontargetaba.com](https://ontargetaba.com), keeping the original brand palette and verbatim copy while modernizing the layout, typography, animations, and accessibility.

> Quality care without the wait.
> ABA therapy &amp; autism testing for kids in Cleveland, Columbus, and Salt Lake City.

## What's in this repo

```
website/                  Production-ready static site (no build step)
  index.html              Homepage — design exemplar
  *.html                  All public pages (services, autism testing, about, etc.)
  assets/
    css/app.css           Shared design system (tokens, animations, components)
    js/app.js             Scroll reveal, sticky nav, mobile nav, FAQ accordion
    images/               Every image pulled from the original site (relinked locally)
    asset-manifest.json   Original URL → local path mapping
  scraped/                Verbatim markdown content extracted from the live site
  BUILD-GUIDE.md          Component &amp; styling rules used by the builder agents
  download-assets.ps1     One-shot script that downloaded every image
  recolor.ps1             Sweeps HTML/CSS/SVG for old palette hex → new palette
billboard.svg             Highway billboard concept for Utah Autism Testing
```

## Tech

- **HTML + Tailwind CSS** (via CDN, configured inline in each page)
- **Custom CSS** at `assets/css/app.css` for design tokens, scroll animations, marquee, accordion, target/bullseye mark
- **Vanilla JavaScript** at `assets/js/app.js` — no frameworks, no build step
- **Fonts:** Fraunces (display) + Plus Jakarta Sans (body), loaded from Google Fonts

## Brand palette

Pulled from the live site's stylesheets:

| Token       | Hex       | Use                                 |
|-------------|-----------|-------------------------------------|
| teal        | `#00B7EA` | Primary brand — links, accents      |
| teal-deep   | `#009EC3` | Hover, dark gradient                |
| coral       | `#FF6900` | CTA buttons, accents                |
| sun         | `#FFDD17` | Highlights, announcement bar        |
| cream       | `#EEEADD` | Warm background                     |
| ink         | `#1B2733` | Body type, footer                   |
| ink-soft    | `#34495E` | Secondary text                      |

## Animations

All animations are subtle, GPU-friendly, and respect `prefers-reduced-motion`:

- **Scroll reveal** — `.reveal` fades content up as it enters the viewport
- **Sticky-nav glass** — translucent + blur when scrolled
- **Floating decorations** — slow vertical drift on target/sun blobs
- **Pulse ring** — radiating coral pulse behind featured CTAs
- **Marquee** — auto-scrolling insurance carrier band
- **Card lift** — translateY + shadow on hover
- **Counter** — number tweens when stat blocks enter view
- **FAQ accordion** — height + chevron rotation

## How the site was built

1. Crawled `page-sitemap.xml` to discover every public URL.
2. Six parallel scraper agents pulled verbatim content for ~26 pages into `website/scraped/*.md`.
3. A PowerShell asset-downloader (`download-assets.ps1`) grabbed every referenced image (111 files, ~21 MB) into `assets/images/` and emitted `asset-manifest.json`.
4. The homepage was hand-built as the design exemplar.
5. Five parallel builder agents read the design guide + scraped content, then produced the remaining pages — copying the nav and footer verbatim from `index.html` for cross-page consistency.
6. `recolor.ps1` ran a final sweep to swap any palette drift from the in-flight build to the live brand colors.

## Local preview

No build step — just open the file:

```powershell
ii website\index.html
```

Or serve it with any static server:

```powershell
cd website
python -m http.server 8000
# → http://localhost:8000
```

## Pages

| URL                                  | Source                                                                          |
|--------------------------------------|---------------------------------------------------------------------------------|
| `index.html`                         | https://ontargetaba.com/                                                        |
| `our-services.html`                  | https://ontargetaba.com/our-services/                                           |
| `center-based-aba-therapy.html`      | https://ontargetaba.com/center-based-aba-therapy/                               |
| `in-home-aba-therapy.html`           | https://ontargetaba.com/in-home-aba-therapy/                                    |
| `early-intervention-autism-program.html` | https://ontargetaba.com/early-intervention-autism-program/                  |
| `autism-testing.html`                | https://ontargetaba.com/on-target-aba-autism-testing-autism-evaluations/        |
| `murray-utah.html`                   | https://ontargetaba.com/aba-therapy-murray-utah/                                |
| `potty-training-program.html`        | https://ontargetaba.com/potty-training-progam/                                  |
| `about.html`                         | https://ontargetaba.com/about/                                                  |
| `our-process.html`                   | https://ontargetaba.com/our-process/                                            |
| `locations.html`                     | https://ontargetaba.com/locations_/ &amp; /locations/                          |
| `insurance.html`                     | https://ontargetaba.com/insurance/                                              |
| `faqs.html`                          | https://ontargetaba.com/faqs/                                                   |
| `careers.html`                       | https://ontargetaba.com/careers/                                                |
| `contact.html`                       | https://ontargetaba.com/contact/                                                |
| `pre-intake-form.html`               | https://ontargetaba.com/pre-intake-form/                                        |
| `aba-therapy-guide.html`             | https://ontargetaba.com/everything-you-need-to-know-aba-therapy/                |
| `blog.html`                          | https://ontargetaba.com/blogs/                                                  |
| `job-application.html`               | https://ontargetaba.com/job-application/                                        |
| `employment-application.html`        | https://ontargetaba.com/employment-application/                                 |
| `thank-you.html`                     | https://ontargetaba.com/thankyou/                                               |
| `thank-you-confirmation.html`        | https://ontargetaba.com/thank-you-confirmation/                                 |
| `privacy-policy.html`                | https://ontargetaba.com/privacy-policy/                                         |
| `terms-of-service.html`              | https://ontargetaba.com/terms-of-service/                                       |
| `cookie-consent.html`                | https://ontargetaba.com/cookie-consent/                                         |
| `disclaimer.html`                    | https://ontargetaba.com/disclaimer/                                             |
| `icon-attribution.html`              | https://ontargetaba.com/icon-attribution/                                       |

## Notes

- All forms use `onsubmit="event.preventDefault(); ..."` placeholder handlers — wire to your real backend (Fluent Forms, Formspree, etc.) before launch.
- `cookie-consent.html` is a placeholder shell — the original is a Termageddon runtime embed.
- Images are mirrored from the live site for parity; replace with optimized assets before production.

## License

Content © On Target ABA, LLC. Markup and design © 2026.
