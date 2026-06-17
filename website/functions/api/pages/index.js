// GET /api/pages — list of editable static HTML pages with current SEO meta.
//
// Source of truth for the canonical list lives in scripts/inject-seo.py
// (SEO_PAGES dict). The list below mirrors the file-system slugs that
// have entries in that dict; the actual title/description/og:* values
// are pulled live from each .html in the repo so the editor always
// reflects what's deployed.
//
// Overrides written through this endpoint live in assets/data/page-seo.json
// — inject-seo.py merges them on top of its built-in defaults at build
// time so the changes survive every redeploy.

import {
  ghGet,
  ghTree,
  json,
  serverError,
} from "../../_utils.js";

// Canonical list of editable pages. Mirrors scripts/inject-seo.py SEO_PAGES.
// Used so the editor surfaces the same set even before page-seo.json exists.
const EDITABLE_SLUGS = [
  "index",
  "about",
  "our-process",
  "our-services",
  "center-based-aba-therapy",
  "in-home-aba-therapy",
  "early-intervention-autism-program",
  "potty-training-program",
  "autism-testing",
  "murray-utah",
  "mayfield-ohio",
  "gahanna-ohio",
  "worthington-ohio",
  "locations",
  "insurance",
  "faqs",
  "careers",
  "contact",
  "pre-intake-form",
  "aba-therapy-guide",
  "blog",
  "job-application",
  "employment-application",
  "thank-you",
  "thank-you-confirmation",
  "privacy-policy",
  "terms-of-service",
  "cookie-consent",
  "disclaimer",
  "icon-attribution",
];

const PAGE_LABELS = {
  "index": "Home",
  "about": "About",
  "our-process": "Our Process",
  "our-services": "Our Services",
  "center-based-aba-therapy": "Center-Based ABA Therapy",
  "in-home-aba-therapy": "In-Home ABA Therapy",
  "early-intervention-autism-program": "Early Intervention",
  "potty-training-program": "Potty Training Program",
  "autism-testing": "Autism Testing",
  "murray-utah": "Murray, Utah",
  "mayfield-ohio": "Mayfield, Ohio",
  "gahanna-ohio": "Gahanna, Ohio",
  "worthington-ohio": "Worthington, Ohio",
  "locations": "Locations",
  "insurance": "Insurance",
  "faqs": "FAQs",
  "careers": "Careers",
  "contact": "Contact",
  "pre-intake-form": "Pre-Intake Form",
  "aba-therapy-guide": "ABA Therapy Guide",
  "blog": "Blog",
  "job-application": "Job Application",
  "employment-application": "Employment Application",
  "thank-you": "Thank You",
  "thank-you-confirmation": "Thank You (Confirmation)",
  "privacy-policy": "Privacy Policy",
  "terms-of-service": "Terms of Service",
  "cookie-consent": "Cookie Consent",
  "disclaimer": "Disclaimer",
  "icon-attribution": "Icon Attribution",
};

// Minimal HTML meta-tag extractor. Returns {title, description, keywords,
// ogTitle, ogDescription, ogImage, twitterTitle, twitterDescription, twitterImage}.
function readMeta(html) {
  const out = {
    title: "",
    description: "",
    keywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
  };
  if (!html) return out;
  const titleM = /<title>([\s\S]*?)<\/title>/i.exec(html);
  if (titleM) out.title = titleM[1].trim();

  // The audit's R4 regex character class `[^"']` truncated content
  // values that contain an apostrophe ("A Parent's Guide" -> "A Parent").
  // inject-seo.py always emits content="..." with double quotes, so the
  // bounded-by-double-quote `[^"]*` is the right read pattern.
  function pickContent(re) {
    const m = re.exec(html);
    return m ? m[1] : "";
  }
  out.description = pickContent(
    /<meta\s+name=["']description["']\s+content="([^"]*)"/i,
  );
  out.keywords = pickContent(
    /<meta\s+name=["']keywords["']\s+content="([^"]*)"/i,
  );
  out.ogTitle = pickContent(
    /<meta\s+property=["']og:title["']\s+content="([^"]*)"/i,
  );
  out.ogDescription = pickContent(
    /<meta\s+property=["']og:description["']\s+content="([^"]*)"/i,
  );
  out.ogImage = pickContent(
    /<meta\s+property=["']og:image["']\s+content="([^"]*)"/i,
  );
  out.twitterTitle = pickContent(
    /<meta\s+name=["']twitter:title["']\s+content="([^"]*)"/i,
  );
  out.twitterDescription = pickContent(
    /<meta\s+name=["']twitter:description["']\s+content="([^"]*)"/i,
  );
  out.twitterImage = pickContent(
    /<meta\s+name=["']twitter:image["']\s+content="([^"]*)"/i,
  );
  return out;
}

async function loadOverrides(env) {
  const f = await ghGet("assets/data/page-seo.json", env);
  if (!f || !f.content) return { overrides: {}, sha: null };
  try {
    const parsed = JSON.parse(f.content);
    return { overrides: parsed.pages || {}, sha: f.sha };
  } catch {
    return { overrides: {}, sha: f.sha };
  }
}

export const onRequestGet = async ({ env }) => {
  try {
    // Pull all .html files at the repo root once via the Tree API.
    const tree = await ghTree("", env);
    const htmls = new Set(
      tree
        .filter((t) => t.type === "blob" && /^[^/]+\.html$/.test(t.path))
        .map((t) => t.path.replace(/\.html$/, "")),
    );

    const { overrides } = await loadOverrides(env);

    // For each editable slug, return a lightweight summary. Title is the
    // single most-useful field for the list view; full meta loads in the
    // editor via GET /api/pages/:slug.
    const pages = [];
    for (const slug of EDITABLE_SLUGS) {
      if (!htmls.has(slug)) continue;
      // Read just enough to surface the title. We avoid ghGet on every
      // page here to stay well under the subrequest budget; the file
      // path is enough for the list. (Editor view fetches the rest.)
      pages.push({
        slug,
        label: PAGE_LABELS[slug] || slug,
        url: slug === "index" ? "/" : "/" + slug,
        hasOverride: !!overrides[slug],
      });
    }

    return json({ pages });
  } catch (e) {
    return serverError(`failed to list pages: ${e.message}`);
  }
};
