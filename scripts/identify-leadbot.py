"""
Open https://ontargetaba.com via Playwright, capture every network
request that fires during page load + 12s after, and surface anything
that looks like the lead-bot widget (iframe srcs, JS loaders, API calls).

Goal: identify the SaaS vendor behind the floating bottom-right chat
that uses iframes named lead-bot-* on the legacy WordPress site.

(We tried selenium-wire first but its bundled mitmproxy is incompatible
with current pyOpenSSL. Playwright's CDP-based network capture works
natively — no TLS interception needed.)
"""
from __future__ import annotations
import re
import time
from collections import defaultdict
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


URL = "https://ontargetaba.com/"
LEADBOT_HINTS = re.compile(
    r"lead.?bot|leadbot|chatbot|chat-bot|widget|launcher|engage|crisp"
    r"|intercom|drift|tidio|landbot|tawk|hubspot|tars|botpress|userlike",
    re.IGNORECASE,
)
IGNORE_HOSTS = re.compile(
    r"^(ontargetaba\.com|.*\.ontargetaba\.com|"
    r"fonts\.googleapis\.com|fonts\.gstatic\.com|"
    r"www\.google-analytics\.com|www\.googletagmanager\.com|"
    r"www\.google\.com|stats\.g\.doubleclick\.net|"
    r"connect\.facebook\.net|.*\.facebook\.com|.*\.facebook\.net|"
    r"static\.hotjar\.com|.*\.hotjar\.com|"
    r"stats\.wp\.com|.*\.wp\.com|s\.w\.org)$"
)


def main() -> int:
    requests_by_host: dict[str, list[str]] = defaultdict(list)
    suspicious_urls: set[str] = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 1280, "height": 1000},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/138.0.0.0 Safari/537.36"
            ),
        )
        page = ctx.new_page()

        def record(req):
            host = urlparse(req.url).netloc
            requests_by_host[host].append(req.url)
            if LEADBOT_HINTS.search(req.url):
                suspicious_urls.add(req.url)

        page.on("request", record)

        print(f"==> opening {URL}")
        page.goto(URL, wait_until="domcontentloaded", timeout=30000)

        # Lazy widgets often defer until first idle or first interaction.
        # Wiggle the mouse + scroll a bit and wait.
        for waited in range(15):
            time.sleep(1)
            try:
                count = page.evaluate(
                    "document.querySelectorAll('[id^=\"lead-bot\"]').length"
                )
                if count:
                    print(f"   lead-bot elements appeared after {waited+1}s "
                          f"(count={count})")
                    page.mouse.move(640, 500)
                    page.evaluate("window.scrollBy(0, 200)")
                    time.sleep(4)
                    break
            except Exception:
                pass

        # Snapshot every iframe whose id starts with lead-bot; show src
        iframe_info = page.evaluate(
            """
            Array.from(document.querySelectorAll('iframe'))
              .filter(f => f.id && f.id.startsWith('lead-bot'))
              .map(f => ({id: f.id, src: f.src, name: f.name}))
            """
        )
        print("\n==> lead-bot iframes currently in DOM:")
        if iframe_info:
            for f in iframe_info:
                print(f"   id={f['id']:<30} src={f['src']}")
        else:
            print("   (none — widget may not have mounted)")

        # Scripts on the page (where the loader lives)
        scripts = page.evaluate(
            """Array.from(document.querySelectorAll('script[src]')).map(s => s.src)"""
        )
        suspicious_scripts = [s for s in scripts if LEADBOT_HINTS.search(s)]
        print("\n==> script[src] matching lead-bot-ish hints:")
        for s in suspicious_scripts:
            print(f"   {s}")
        if not suspicious_scripts:
            print("   (none — loader is likely inline JS injection)")

        browser.close()

    print("\n==> third-party hosts (excluding obvious WP / analytics):")
    for host in sorted(requests_by_host):
        if not host or IGNORE_HOSTS.match(host):
            continue
        urls = requests_by_host[host]
        print(f"   {host}  ({len(urls)} request{'s' if len(urls) != 1 else ''})")
        for u in urls[:2]:
            print(f"      - {u}")

    print("\n==> network requests matching lead-bot-ish patterns:")
    for u in sorted(suspicious_urls):
        print(f"   {u}")
    if not suspicious_urls:
        print("   (none matched the regex — third-party-host list above "
              "is your best clue)")

    print("\n==> done")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
