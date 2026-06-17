"""
Visit every public page on beta.ontargetaba.com via Playwright, follow
every same-origin link found, and produce a report covering:

- HTTP status of every URL hit (incl. follow-through of 301/308 redirects)
- Web Vitals per page: TTFB, FCP, LCP, DCL, load
- Console errors / warnings per page
- Network-failed requests per page
- A 404 list (anything that returned >= 400)
- A redirect map (anything that returned 3xx + final URL)
- A slowest-page leaderboard

Writes the report to tour-results.md at the repo root.

This is intentionally read-only: no auth, no form fills, no admin pages.
"""
from __future__ import annotations
import json
import time
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse, urlunparse

from playwright.sync_api import sync_playwright

BASE = "https://beta.ontargetaba.com"
ORIGIN_HOST = "beta.ontargetaba.com"
SEED_PATHS = [
    "/",
    "/about", "/our-process", "/our-services",
    "/center-based-aba-therapy", "/in-home-aba-therapy",
    "/early-intervention-autism-program", "/potty-training-program",
    "/autism-testing",
    "/locations", "/murray-utah", "/mayfield-ohio", "/gahanna-ohio", "/worthington-ohio",
    "/insurance", "/faqs", "/aba-therapy-guide",
    "/careers", "/job-application", "/employment-application",
    "/contact", "/pre-intake-form",
    "/blog", "/landing",
    "/privacy-policy", "/terms-of-service", "/cookie-consent", "/disclaimer", "/icon-attribution",
    "/thank-you", "/thank-you-confirmation",
    "/404",
]
# A few sample blog posts (random, since there are 161+)
SAMPLE_BLOG_POSTS = [
    "/blog/posts/autism-and-school-your-childs-rights-a-complete-guide-for-families",
    "/blog/posts/aba-therapy-and-potty-training-what-parents-should-expect",
    "/blog/posts/early-signs-of-autism-a-parent-friendly-guide-to-understanding-development",
]

# Probe a couple of legacy WP URLs to confirm redirects are wired.
LEGACY_PROBES = [
    "/2026/06/01/autism-and-school-your-childs-rights-a-complete-guide-for-families/",
    "/aba-therapy-murray-utah/",
    "/potty-training-progam/",
    "/blogs/",
]

MAX_PAGES = 60
EXCLUDE_LINK_PREFIXES = (
    "/admin", "/api/", "/OAuth/", "/_redirects",
)


def normalize(path: str) -> str:
    if path.startswith("http"):
        u = urlparse(path)
        if u.netloc and u.netloc != ORIGIN_HOST:
            return ""
        path = u.path or "/"
    path = path.split("#")[0]
    path = path.split("?")[0]
    if path.endswith("/") and path != "/":
        path = path[:-1]
    return path


def main() -> int:
    report_lines: list[str] = []
    visited: set[str] = set()
    queue: list[str] = []
    seen_link_targets: set[str] = set()

    page_data: list[dict] = []
    redirects: list[tuple[str, str, int]] = []
    errors_404: list[tuple[str, int, str]] = []
    legacy_probe_results: list[tuple[str, int, str]] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent="Mozilla/5.0 (Playwright site tour)",
        )

        # Seed the queue
        for path in SEED_PATHS + SAMPLE_BLOG_POSTS:
            n = normalize(path)
            if n:
                queue.append(n)
                seen_link_targets.add(n)

        # Pre-check legacy URLs for redirect behavior (separate from BFS)
        page_for_probes = ctx.new_page()
        for path in LEGACY_PROBES:
            try:
                resp = page_for_probes.goto(BASE + path, wait_until="domcontentloaded", timeout=20000)
                if resp:
                    legacy_probe_results.append((path, resp.status, page_for_probes.url))
            except Exception as e:
                legacy_probe_results.append((path, 0, f"ERR: {e}"))
        page_for_probes.close()

        while queue and len(visited) < MAX_PAGES:
            path = queue.pop(0)
            if path in visited:
                continue
            visited.add(path)

            page = ctx.new_page()
            url = BASE + path
            console_errs: list[str] = []
            failed_reqs: list[str] = []
            page.on("console", lambda m, c=console_errs: c.append(f"[{m.type}] {m.text[:160]}") if m.type in ("error", "warning") else None)
            page.on("requestfailed", lambda r, f=failed_reqs: f.append(f"{r.url} → {r.failure}"))

            t0 = time.time()
            status = 0
            final_url = url
            err = None
            try:
                resp = page.goto(url, wait_until="load", timeout=30000)
                if resp:
                    status = resp.status
                    final_url = page.url
                    if resp.status >= 300 and resp.status < 400:
                        redirects.append((path, final_url, resp.status))
                    elif resp.status >= 400:
                        errors_404.append((path, resp.status, final_url))
            except Exception as e:
                err = str(e)[:200]
            wall_ms = int((time.time() - t0) * 1000)

            vitals = {"TTFB": None, "FCP": None, "LCP": None, "DCL": None, "load": None}
            try:
                vitals = page.evaluate("""
                    new Promise((resolve) => {
                      const v = {LCP: null, FCP: null, DCL: null, load: null, TTFB: null};
                      const nav = performance.getEntriesByType('navigation')[0];
                      if (nav) {
                        v.TTFB = nav.responseStart;
                        v.DCL  = nav.domContentLoadedEventEnd;
                        v.load = nav.loadEventEnd;
                      }
                      for (const p of performance.getEntriesByType('paint')) {
                        if (p.name === 'first-contentful-paint') v.FCP = p.startTime;
                      }
                      try {
                        new PerformanceObserver((list) => {
                          for (const e of list.getEntries()) v.LCP = e.startTime;
                        }).observe({type: 'largest-contentful-paint', buffered: true});
                      } catch (e) {}
                      setTimeout(() => resolve(v), 600);
                    });
                """)
            except Exception:
                pass

            # Collect internal links to add to the BFS queue
            new_links = []
            try:
                hrefs = page.evaluate(
                    "Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href'))"
                )
                for h in hrefs:
                    if not h or h.startswith(("mailto:", "tel:", "javascript:")):
                        continue
                    n = normalize(h)
                    if not n or any(n.startswith(p) for p in EXCLUDE_LINK_PREFIXES):
                        continue
                    if n not in seen_link_targets:
                        seen_link_targets.add(n)
                        queue.append(n)
                        new_links.append(n)
            except Exception:
                pass

            page_data.append({
                "path": path,
                "status": status,
                "final_url": final_url,
                "wall_ms": wall_ms,
                "vitals": vitals,
                "console": console_errs[:10],
                "failed": failed_reqs[:8],
                "new_links": len(new_links),
                "err": err,
            })

            page.close()

        browser.close()

    # ---- write report ----
    n_pages = len(page_data)
    n_4xx_5xx = len(errors_404)
    n_redirects = len(redirects)
    slowest = sorted(page_data, key=lambda d: -(d["vitals"].get("LCP") or d["wall_ms"]))[:10]
    pages_with_errors = [d for d in page_data if d["console"] or d["failed"]]

    lines = [
        "# Site Tour — Playwright Crawl Report",
        "",
        f"Crawled `{BASE}` starting from {len(SEED_PATHS) + len(SAMPLE_BLOG_POSTS)} seeds, ",
        f"following same-origin links breadth-first (cap: {MAX_PAGES} pages).",
        "",
        "## Summary",
        f"- Pages visited: **{n_pages}**",
        f"- Pages with 4xx/5xx status: **{n_4xx_5xx}**",
        f"- Pages with 3xx redirects mid-tour: **{n_redirects}**",
        f"- Pages with console errors/warnings: **{len(pages_with_errors)}**",
        f"- Pages with failed network requests: **{sum(1 for d in page_data if d['failed'])}**",
        "",
        "## Legacy WP redirect probes",
        "",
        "| Old URL | Status | Final URL |",
        "| --- | --- | --- |",
    ]
    for path, status, final in legacy_probe_results:
        lines.append(f"| `{path}` | {status} | `{final.replace(BASE, '')}` |")

    lines.extend(["", "## 4xx / 5xx URLs (must fix)", ""])
    if errors_404:
        for path, st, fin in errors_404:
            lines.append(f"- **{st}** `{path}` → `{fin}`")
    else:
        lines.append("_None — every visited URL returned 2xx._")

    lines.extend(["", "## Slowest 10 pages (by LCP / wall)", "",
                  "| Path | Status | LCP (ms) | FCP (ms) | Load (ms) | Wall (ms) |",
                  "| --- | ---: | ---: | ---: | ---: | ---: |"])
    for d in slowest:
        v = d["vitals"]
        lines.append(
            f"| `{d['path']}` | {d['status']} | "
            f"{int(v['LCP']) if v['LCP'] else '-'} | "
            f"{int(v['FCP']) if v['FCP'] else '-'} | "
            f"{int(v['load']) if v['load'] else '-'} | "
            f"{d['wall_ms']} |"
        )

    lines.extend(["", "## Pages with console errors / failed requests", ""])
    if pages_with_errors:
        for d in pages_with_errors:
            lines.append(f"### `{d['path']}` (status {d['status']})")
            if d["console"]:
                lines.append("Console:")
                for c in d["console"]:
                    lines.append(f"- {c}")
            if d["failed"]:
                lines.append("Failed requests:")
                for f in d["failed"]:
                    lines.append(f"- {f}")
            lines.append("")
    else:
        lines.append("_Every page tour was clean — no console errors and no failed requests._")

    lines.extend(["", "## All pages visited", "",
                  "| Path | Status | LCP (ms) | Wall (ms) | New links |",
                  "| --- | ---: | ---: | ---: | ---: |"])
    for d in sorted(page_data, key=lambda d: d["path"]):
        v = d["vitals"]
        lines.append(
            f"| `{d['path']}` | {d['status']} | "
            f"{int(v['LCP']) if v['LCP'] else '-'} | "
            f"{d['wall_ms']} | {d['new_links']} |"
        )

    report = "\n".join(lines) + "\n"
    out = Path(__file__).parent.parent / "tour-results.md"
    out.write_text(report, encoding="utf-8")
    print(f"==> wrote {out} ({len(report)} chars)")
    print(f"==> {n_pages} pages, {n_4xx_5xx} errors, {n_redirects} redirects")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
