"""
Open beta.ontargetaba.com via Playwright, force the widget loader to
run, and report whether the LeadTrap script ended up in the DOM, what
errors fired in the console, and whether any requests were blocked.
"""
from __future__ import annotations
import time
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

URL = "https://beta.ontargetaba.com/"


def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--disable-cache'])
        ctx = browser.new_context(viewport={"width": 1280, "height": 900}, bypass_csp=False)
        ctx.route("**/*", lambda route: route.continue_(headers={**route.request.headers, "cache-control": "no-cache", "pragma": "no-cache"}))
        page = ctx.new_page()

        console = []
        page.on("console", lambda m: console.append((m.type, m.text)))
        requests = []
        page.on("request", lambda r: requests.append(r.url))
        failed = []
        page.on("requestfailed", lambda r: failed.append((r.url, r.failure)))

        print(f"==> {URL}")
        page.goto(URL, wait_until="load", timeout=30000)

        # Force the loader (which is deferred to idle / first interaction).
        page.mouse.move(640, 400)
        page.evaluate("window.scrollBy(0, 100)")
        time.sleep(5)

        print("\n==> Widget config the runtime saw:")
        cfg = page.evaluate("""
          (() => {
            const slot = document.getElementById('ota-widget-data');
            return slot ? slot.textContent.trim() : '(no inline data block)';
          })()
        """)
        print(f"   {cfg}")

        print("\n==> ALL script tags on the page:")
        all_scripts = page.evaluate(
          "Array.from(document.querySelectorAll('script')).map(s => ({src: s.src || '(inline)', widget: s.dataset.widget, async: s.async, defer: s.defer, leadbot: s.dataset.leadbot}))"
        )
        for s in all_scripts:
            print(f"   widget={s.get('widget') or '-':<8} leadbot={s.get('leadbot') or '-':<3} async={s.get('async')!s:<5} src={s['src'][:90]}")

        print("\n==> Script tags relating to widget loading:")
        scripts = page.evaluate("""
          Array.from(document.querySelectorAll('script')).filter(s => {
            const src = s.src || '';
            return src.includes('leadtrap') || src.includes('leadbot') || s.dataset.widget;
          }).map(s => ({ src: s.src, widget: s.dataset.widget }))
        """)
        if scripts:
            for s in scripts:
                w = s.get('widget') or '-'
                print(f"   widget={w:<10} src={s['src']}")
        else:
            print("   (none — dispatcher didn't inject anything)")

        print("\n==> Iframes from the LeadTrap widget:")
        iframes = page.evaluate("""
          Array.from(document.querySelectorAll('iframe[id^="lead-bot"]')).map(f => f.id)
        """)
        if iframes:
            for i in iframes:
                print(f"   {i}")
        else:
            print("   (none)")

        print("\n==> Network requests to leadtrap or jotfor.ms:")
        for u in requests:
            host = urlparse(u).netloc
            if "leadtrap" in host or "jotfor" in host or "jotform" in host:
                print(f"   {host}  {u[:120]}")

        print("\n==> Failed requests:")
        if failed:
            for u, why in failed:
                print(f"   {u}  → {why}")
        else:
            print("   (none)")

        print("\n==> Console errors:")
        for kind, msg in console:
            if kind in ("error", "warning"):
                print(f"   [{kind}] {msg[:200]}")

        browser.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
