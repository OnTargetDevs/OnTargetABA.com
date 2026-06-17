"""Build sitemap.xml + robots.txt for the On Target ABA site.

Reads assets/blog/index.json for blog post slugs + dates, combines with
the static-page registry below, and emits website/sitemap.xml.
Idempotent — re-run any time pages are added or blog content is updated.

URLs use the production canonical domain and the cleanUrls form (no
trailing .html) so they match vercel.json's `cleanUrls: true` setting
and the SEO injection's canonical links.
"""
from __future__ import annotations
import datetime as _dt
import json
import os
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).parent.parent
# Mirror inject-seo.py: SITE_DOMAIN env var (set on CF Pages to the
# current deploy host) overrides the legacy ontargetaba.com default
# so the sitemap reflects beta.ontargetaba.com until production
# cuts over from the WP install.
SITE = (os.environ.get("SITE_DOMAIN") or "https://ontargetaba.com").rstrip("/")
SITEMAP_PATH = ROOT / "sitemap.xml"
ROBOTS_PATH = ROOT / "robots.txt"
INDEX_JSON = ROOT / "assets" / "blog" / "index.json"

# (path, priority, changefreq) — paths are URLs without the .html
# Thank-you confirmations are intentionally skipped (noindex'd in
# scripts/inject-seo.py).
STATIC_PAGES = [
    ("/",                                 "1.0", "weekly"),
    ("/autism-testing",                   "0.95", "weekly"),
    ("/our-services",                     "0.9",  "weekly"),
    ("/center-based-aba-therapy",         "0.85", "monthly"),
    ("/in-home-aba-therapy",              "0.85", "monthly"),
    ("/early-intervention-autism-program","0.85", "monthly"),
    ("/potty-training-program",           "0.8",  "monthly"),
    ("/murray-utah",                      "0.85", "weekly"),
    ("/mayfield-ohio",                    "0.85", "weekly"),
    ("/gahanna-ohio",                     "0.85", "weekly"),
    ("/worthington-ohio",                 "0.85", "weekly"),
    ("/locations",                        "0.8",  "monthly"),
    ("/about",                            "0.75", "monthly"),
    ("/our-process",                      "0.7",  "monthly"),
    ("/insurance",                        "0.85", "monthly"),
    ("/faqs",                             "0.8",  "monthly"),
    ("/contact",                          "0.85", "monthly"),
    ("/pre-intake-form",                  "0.8",  "monthly"),
    ("/aba-therapy-guide",                "0.7",  "monthly"),
    ("/careers",                          "0.7",  "monthly"),
    ("/become-an-rbt",                    "0.65", "monthly"),
    ("/why-work-at-on-target-aba",        "0.6",  "monthly"),
    ("/clinical-philosophy",              "0.65", "monthly"),
    ("/job-application",                  "0.5",  "yearly"),
    ("/employment-application",           "0.5",  "yearly"),
    ("/blog",                             "0.9",  "daily"),
    ("/privacy-policy",                   "0.3",  "yearly"),
    ("/terms-of-service",                 "0.3",  "yearly"),
    ("/cookie-consent",                   "0.3",  "yearly"),
    ("/disclaimer",                       "0.3",  "yearly"),
    ("/icon-attribution",                 "0.2",  "yearly"),
]

# noindex'd pages — omit from sitemap entirely
SKIP = {"/thank-you", "/thank-you-confirmation"}


def today_iso() -> str:
    return _dt.date.today().isoformat()


def url_node(loc: str, lastmod: str, changefreq: str, priority: str) -> str:
    return (
        "  <url>\n"
        f"    <loc>{escape(loc)}</loc>\n"
        f"    <lastmod>{lastmod}</lastmod>\n"
        f"    <changefreq>{changefreq}</changefreq>\n"
        f"    <priority>{priority}</priority>\n"
        "  </url>\n"
    )


def load_blog_posts() -> list[dict]:
    if not INDEX_JSON.exists():
        print(f"  ! {INDEX_JSON.relative_to(ROOT)} missing; "
              f"run build-blog-index.py first")
        return []
    try:
        data = json.loads(INDEX_JSON.read_text(encoding="utf-8"))
        return data.get("posts", []) or []
    except Exception as e:
        print(f"  ! failed to parse index.json: {e}")
        return []


def main() -> int:
    today = today_iso()

    parts: list[str] = []
    parts.append('<?xml version="1.0" encoding="UTF-8"?>\n')
    parts.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')

    # Static pages
    static_count = 0
    for path, priority, changefreq in STATIC_PAGES:
        if path in SKIP:
            continue
        loc = SITE if path == "/" else SITE + path
        parts.append(url_node(loc, today, changefreq, priority))
        static_count += 1

    # Blog posts
    posts = load_blog_posts()
    post_count = 0
    for p in posts:
        slug = (p.get("slug") or "").strip()
        if not slug:
            continue
        lastmod = (p.get("date") or today).strip() or today
        loc = f"{SITE}/blog/posts/{slug}"
        parts.append(url_node(loc, lastmod, "monthly", "0.6"))
        post_count += 1

    parts.append("</urlset>\n")

    SITEMAP_PATH.write_text("".join(parts), encoding="utf-8")
    print(f"  + sitemap.xml: {static_count} static + {post_count} blog "
          f"= {static_count + post_count} URLs")

    robots = (
        "# On Target ABA\n"
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /test.html\n"
        "\n"
        "# Bots that misbehave can be blocked individually here.\n"
        "\n"
        f"Sitemap: {SITE}/sitemap.xml\n"
    )
    ROBOTS_PATH.write_text(robots, encoding="utf-8")
    print(f"  + robots.txt")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
