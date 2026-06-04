"""Ping the IndexNow API with the site's URLs after a deploy.

IndexNow (https://www.indexnow.org) is a free push-notification protocol
that lets search engines (Bing, Yandex, Seznam, Naver, plus crawlers
that proxy it) know about new or updated URLs as they are published.
Submitting the same URL again is harmless — engines de-duplicate.

By default this pings every URL whose <lastmod> in sitemap.xml falls
within the last 14 days, which captures new blog posts + edited pages
without overpaying on freshness. Pass --all to ping every URL once
(useful for initial submission).

The IndexNow key is public by design (it just proves ownership of the
domain via a key file at the site root). The key file is in this repo
at website/c8f5d3a1e947b2f6a4c1b9d8e6f3a2b5.txt.

Run as part of the build chain — failures are logged but don't fail the
deploy.
"""
from __future__ import annotations
import json
import sys
import urllib.request
import urllib.error
from datetime import date, timedelta
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).parent.parent
SITEMAP_PATH = ROOT / "sitemap.xml"

# Public IndexNow key. Must match the filename `{KEY}.txt` at site root.
KEY = "c8f5d3a1e947b2f6a4c1b9d8e6f3a2b5"
HOST = "ontargetaba.com"

# Default freshness window. Override with --since DAYS or --all.
DEFAULT_SINCE_DAYS = 14
# IndexNow accepts up to 10,000 URLs per request; we'll never come close.
BATCH_LIMIT = 1000


def parse_sitemap(path: Path, since_days: int | None) -> list[str]:
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    tree = ET.parse(path)
    cutoff = None
    if since_days is not None:
        cutoff = date.today() - timedelta(days=since_days)

    urls: list[str] = []
    for url in tree.findall(".//sm:url", ns):
        loc_el = url.find("sm:loc", ns)
        if loc_el is None or not loc_el.text:
            continue
        loc = loc_el.text.strip()
        if cutoff is not None:
            lastmod_el = url.find("sm:lastmod", ns)
            if lastmod_el is None or not lastmod_el.text:
                continue
            try:
                if date.fromisoformat(lastmod_el.text.strip()) < cutoff:
                    continue
            except ValueError:
                # Malformed date — include conservatively
                pass
        urls.append(loc)
    return urls


def submit_batch(urls: list[str]) -> None:
    body = {
        "host": HOST,
        "key": KEY,
        "keyLocation": f"https://{HOST}/{KEY}.txt",
        "urlList": urls,
    }
    req = urllib.request.Request(
        "https://api.indexnow.org/IndexNow",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            print(f"  IndexNow: {resp.status} {resp.reason} "
                  f"for {len(urls)} URL(s)")
    except urllib.error.HTTPError as e:
        # 200/202 = ok; 422 = key not found yet (likely first deploy);
        # 400 = bad body. Always non-fatal.
        print(f"  ! IndexNow HTTP {e.code}: {e.reason} (non-fatal)",
              file=sys.stderr)
    except Exception as e:
        print(f"  ! IndexNow ping failed: {e} (non-fatal)", file=sys.stderr)


def main() -> int:
    if not SITEMAP_PATH.exists():
        print("  ! sitemap.xml missing — run build-sitemap.py first")
        return 0

    args = sys.argv[1:]
    since_days: int | None = DEFAULT_SINCE_DAYS
    if "--all" in args:
        since_days = None
    elif "--since" in args:
        i = args.index("--since")
        try:
            since_days = int(args[i + 1])
        except (IndexError, ValueError):
            print("  ! --since expects a positive integer")
            return 0

    urls = parse_sitemap(SITEMAP_PATH, since_days)
    if not urls:
        scope = "all" if since_days is None else f"last {since_days}d"
        print(f"  IndexNow: no URLs to ping ({scope})")
        return 0

    scope = "all" if since_days is None else f"last {since_days}d"
    print(f"  IndexNow: pinging {len(urls)} URL(s) ({scope})")

    for i in range(0, len(urls), BATCH_LIMIT):
        submit_batch(urls[i : i + BATCH_LIMIT])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
