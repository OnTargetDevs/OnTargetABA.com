# SEO Guide

How SEO is structured on this site, how to edit it, and what to check before
publishing a new page.

The short version: there's a single Python script, `scripts/inject-seo.py`,
that owns every meta tag and every JSON-LD blob on every page. Edit the
registry inside it, run it, and every page is consistent.

---

## What gets injected

For every HTML page in the `SEO_PAGES` registry, `inject-seo.py` writes a
block bracketed by `<!-- auto-seo-start -->` / `<!-- auto-seo-end -->`
containing:

- `<title>` &mdash; from the registry entry.
- `<meta name="description">`, `<meta name="keywords">`.
- Canonical: `<link rel="canonical" href="https://ontargetaba.com/...">`.
- OpenGraph: `og:title`, `og:description`, `og:url`, `og:image`, `og:type`,
  `og:site_name`, `og:locale`.
- Twitter Card: `twitter:card`, `twitter:title`, `twitter:description`,
  `twitter:image`.
- Theme color, robots (default `index,follow`; `noindex,nofollow` for
  `thank-you*` pages).
- A `<script type="application/ld+json">` containing a `@graph` array
  (described next).

The script is **idempotent**: any prior block between the markers is removed
before the new one is written. Running it ten times in a row is the same as
running it once.

---

## The JSON-LD `@graph`

Every page emits a `@graph` array of linked entities. Shared entities (the
organization, the website, the four clinics) appear on every page; per-page
entities (`WebPage`, `BreadcrumbList`, page-type extras) vary.

| Entity                                   | Where it appears | Why                                                     |
|------------------------------------------|------------------|---------------------------------------------------------|
| `Organization` / `MedicalBusiness` / `LocalBusiness` | All pages | The business identity; `@id` is `…/#organization`.      |
| `WebSite`                                | All pages        | Site-level data + the SearchAction pointer.             |
| `LocalBusiness` x 4 (Murray, Cleveland, Gahanna, Worthington) | All pages | Each clinic with address, phone, hours, geo.            |
| `WebPage`                                | All pages        | Per-page metadata, links to the org + breadcrumb.       |
| `BreadcrumbList`                         | All pages        | The chain the visual breadcrumb also renders from.      |
| `Review` array + `AggregateRating`       | Home + autism-testing | Real Google reviews; surfaces star ratings in SERPs.  |
| Per-page-type extras                     | Where applicable | E.g. `FAQPage` (faqs.html), `Service` (services pages), `MedicalProcedure` (autism-testing.html), `Article` (resource pages), `ContactPage` (contact.html). |

Google uses the page-type entity to decide which rich result to attempt:
`FAQPage` gets the FAQ expander, `MedicalProcedure` and `Service` can show
provider info, `Article` is eligible for article carousels.

---

## The per-page registry

All per-page metadata lives in the `SEO_PAGES` dict inside
`scripts/inject-seo.py`. Each entry looks like this:

```python
"autism-testing.html": {
    "title": "Autism Testing in Salt Lake City — No Waitlist, $0 for Most Families",
    "desc": "Fast autism evaluations in the Salt Lake Valley. Most families pay $0 through insurance. Usually scheduled within a week.",
    "keywords": "autism testing Salt Lake City, autism evaluation Utah, autism diagnosis Murray, …",
    "crumbs": [("Home", "index.html"), ("Services", "our-services.html"), ("Autism Testing", None)],
    "primary_type": "MedicalProcedure",
},
```

Fields:

| Field          | Used for                                                                          |
|----------------|-----------------------------------------------------------------------------------|
| `title`        | `<title>`, `og:title`, `twitter:title`, `WebPage.name`.                          |
| `desc`         | `<meta name="description">`, `og:description`, `twitter:description`, `WebPage.description`. |
| `keywords`     | `<meta name="keywords">` (ignored by Google, picked up by Bing in some cases).   |
| `crumbs`       | Both the visual breadcrumb (rendered by `header.js`) and the JSON-LD `BreadcrumbList`. `None` slug = current page (no link). |
| `primary_type` | Switches in the page-type extra entity (`Service`, `FAQPage`, `MedicalProcedure`, `Article`, `ContactPage`, `AboutPage`, `LocalLocation`, &c.). |
| `image`        | Optional OG share image; defaults to `assets/og/{slug}.svg` if it exists, otherwise the logo. |
| `noindex`      | Optional `True` to emit `noindex,nofollow` (e.g. thank-you pages). |

---

## Adding a new page to the SEO config

1. Open `website/scripts/inject-seo.py`.
2. Find `SEO_PAGES`.
3. Add an entry, copying the closest existing page as a starting point.
   Pick a `primary_type` that matches the content:
   - "We do X" service descriptions → `Service`.
   - "How do I…?" question pages → `FAQPage` (only if the body is actually
     structured Q&A).
   - Clinical procedures → `MedicalProcedure`.
   - Long-form parent articles → `Article`.
   - City/clinic pages → `LocalLocation` (a custom mapping that emits
     `LocalBusiness` + `Place` extras tied to the clinic).
4. Make sure the `crumbs` chain matches the nav placement. The last entry
   should have `None` as the slug.
5. Optional: drop a custom OG image at `website/assets/og/{slug}.svg` (or
   let `gen-og-images.mjs` make one).
6. Run from `website/`:

```bash
python3 scripts/inject-seo.py
```

7. Check the page: `grep -A 5 auto-seo-start {slug}.html` should show your
   new tags.
8. If you also want it in the sitemap, add it to the static-page registry in
   `scripts/build-sitemap.py` (it's a separate list because not every page
   in `SEO_PAGES` is meant for the sitemap &mdash; thank-you pages, for
   example).

The next deploy will run both scripts automatically.

---

## OG share images

`scripts/gen-og-images.mjs` generates 1200x630 SVG share images. Output lives
in `website/assets/og/`:

- `home.svg`, `about.svg`, `autism-testing.svg`, `our-services.svg`,
  `locations.svg`, `contact.svg` &mdash; main funnel pages.
- `blog-{slug}.svg` &mdash; one per entry in `assets/blog/index.json`.

The template is pure templated XML: cream background, sun arc top-right, coral
blob bottom-left, white rounded card with the page or post title (Fraunces,
wrapped to three lines), a "ON TARGET ABA · BLOG" or "ON TARGET ABA · PAGE"
eyebrow, and a bullseye corner mark. No Pillow / Sharp / Canvas dependencies
&mdash; just Node stdlib so CF Pages can run it.

To tweak the visual style:

1. Open `scripts/gen-og-images.mjs`.
2. The `C` constant at the top is the palette &mdash; edit hex values to retheme.
3. The `svgFor(title, eyebrow)` function builds the markup. Change the arc
   path, blob path, font sizes, or layout there.
4. `wrapTitle(...)` controls how titles wrap; tune `maxCharsPerLine` to fit
   the new layout.
5. Re-run the script to regenerate every image:

```bash
node scripts/gen-og-images.mjs
```

The script skips slugs whose SVG is newer than `index.json`, so to force a
full regeneration delete `assets/og/` first (or `touch assets/blog/index.json`).

`inject-seo.py` automatically picks up the per-page SVG (its `resolve_og_image()`
looks for `assets/og/{slug}.svg` and falls back to `footerImg.png`).
`blog/post.html` does the same at runtime for blog posts.

---

## Canonical URLs

Every canonical points at the production domain:

```html
<link rel="canonical" href="https://ontargetaba.com/{slug}.html">
```

Even from a preview deploy (`website.ontargetnotes.com`) the canonical points
at `ontargetaba.com`. This is deliberate: it prevents duplicate-content
penalties when search engines stumble on the preview URL, and it keeps
internal-link equity flowing to the canonical domain.

If you ever fork this site for a different brand, change the `SITE` constant
at the top of `inject-seo.py` (and the same constant in `build-sitemap.py`
and `gen-og-images.mjs`).

---

## When to bump `primary_type` for a new content type

Google's rich-result eligibility is gated on schema type. Picking the right
one is the difference between "appears as a generic blue link" and "appears
with star ratings / FAQ accordion / breadcrumb chip."

| Content                                | Type to pick                  | Rich result you might get             |
|----------------------------------------|-------------------------------|---------------------------------------|
| Service offering                       | `Service`                     | Service listings, sitelinks           |
| Clinical procedure / evaluation        | `MedicalProcedure`            | Medical info panel                    |
| Long-form parent article               | `Article`                     | Top stories, article carousel         |
| Genuine question-and-answer page       | `FAQPage`                     | FAQ accordion in SERP                 |
| Clinic location / city page            | `LocalBusiness` (LocalLocation) | Local pack, map pin                  |
| About / team                           | `AboutPage`                   | Organization knowledge panel          |
| Contact / get-in-touch                 | `ContactPage`                 | Sitelinks                             |
| Generic informational                  | `WebPage`                     | Plain link result                     |

Don't lie about the type. Google's structured-data testing tool will flag
mismatches (e.g. `FAQPage` without a `mainEntity` array of `Question`s) and
will revoke rich-result eligibility for the page.

---

## Checklist before publishing a new page

A quick sweep before you merge the PR for a new public page:

- [ ] **Title** is 50&ndash;65 characters, includes the primary keyword,
      reads like a sentence (not "keyword | keyword | brand").
- [ ] **Description** is 140&ndash;160 characters, includes a verb and a CTA.
- [ ] **Canonical** points at `https://ontargetaba.com/{slug}.html`.
- [ ] **OG image** exists at `assets/og/{slug}.svg`. Verify the title fits
      and the eyebrow text is right.
- [ ] **Hero photo** has a real `alt` attribute (not "image" or "" &mdash;
      a few words describing what's in the photo).
- [ ] **H1** matches `schema.name` and is close to `<title>` (avoid wildly
      different phrasing &mdash; Google will rewrite your title if it doesn't
      match the H1).
- [ ] **Breadcrumb chain** in `crumbs` matches the page's nav position.
- [ ] **`primary_type`** matches the actual content (don't claim `FAQPage`
      unless the page is Q&A).
- [ ] **Internal links** to at least three related pages (services →
      locations, locations → autism-testing, blog post → relevant services).
- [ ] **The page is in `sitemap.xml`** &mdash; add it to the static-page
      registry in `build-sitemap.py` and re-run the build.
- [ ] **Trigger an IndexNow ping** (the build does this automatically on
      merge &mdash; or run `python3 scripts/indexnow-ping.py --all` from a
      shell if you want to nudge it immediately).
- [ ] If the page is high-priority, **submit the URL in Google Search
      Console** via URL Inspection → Request Indexing.

See `docs/INDEXING_REQUESTS.md` for the indexing details.
