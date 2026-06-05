"""Playwright test for the mobile hamburger + sticky CTA on the live site.

Run with: python scripts/test-mobile-nav.py
"""
from __future__ import annotations

import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

URL = "https://website.ontargetnotes.com/"
SHOTS = Path(__file__).resolve().parent.parent / "figma-refs"
SHOTS.mkdir(parents=True, exist_ok=True)


def main() -> int:
    fails = []
    with sync_playwright() as p:
        # iPhone 14 viewport so we trip the lg:hidden / mobile rules.
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True,
            user_agent=(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) "
                "Version/17.5 Mobile/15E148 Safari/604.1"
            ),
        )
        page = ctx.new_page()

        print(f"loading {URL} at iPhone 14 viewport...")
        page.goto(URL, wait_until="networkidle", timeout=30000)

        # Wait for header.js to inject the toggle.
        try:
            toggle = page.wait_for_selector("[data-mnav-toggle]", state="visible", timeout=10000)
        except PWTimeout:
            fails.append("hamburger button [data-mnav-toggle] never appeared")
            page.screenshot(path=str(SHOTS / "mobile-load-fail.png"))
            browser.close()
            print("\n".join(fails))
            return 1
        print("✓ hamburger toggle present + visible")
        page.screenshot(path=str(SHOTS / "mobile-1-closed.png"), full_page=False)

        # Sticky CTA should be present right from the start.
        sticky = page.query_selector("[data-mobile-cta]")
        if not sticky:
            fails.append("sticky [data-mobile-cta] not in DOM")
        else:
            box = sticky.bounding_box()
            if not box:
                fails.append("sticky CTA has no bounding box (not laid out)")
            else:
                # Should be anchored near the bottom of the viewport.
                vh = page.viewport_size["height"]
                if box["y"] + box["height"] < vh - 5:
                    fails.append(f"sticky CTA not at bottom (y={box['y']} h={box['height']} vh={vh})")
                else:
                    print(f"✓ sticky CTA visible at bottom (y={int(box['y'])}, h={int(box['height'])}, vh={vh})")

        # CTA buttons inside.
        call_btn  = page.query_selector('[data-mobile-cta] a[href^="tel:"]')
        get_started = page.query_selector('[data-mobile-cta] a[href="/contact.html"]')
        if not call_btn:     fails.append("sticky CTA: Call link missing")
        if not get_started:  fails.append("sticky CTA: Get Started link missing")
        if call_btn and get_started: print("✓ sticky CTA has both Call and Get Started")

        # Click hamburger.
        toggle.click()
        # Wait for the .open class on the panel.
        try:
            page.wait_for_function(
                "() => document.querySelector('[data-mnav-panel]')?.classList.contains('open')",
                timeout=2000,
            )
            print("✓ hamburger click opens the mnav panel")
        except PWTimeout:
            fails.append("panel did not gain .open class after click")

        page.screenshot(path=str(SHOTS / "mobile-2-open.png"), full_page=False)

        # Confirm nav links visible.
        nav_links = page.query_selector_all("[data-mnav-panel] a")
        print(f"✓ {len(nav_links)} links visible in open panel")
        if len(nav_links) < 6:
            fails.append(f"only {len(nav_links)} links in panel (expected ~8+)")

        # Click a nav link should close the panel.
        if nav_links:
            first_link_href = nav_links[0].get_attribute("href")
            print(f"clicking first nav link ({first_link_href}) to verify auto-close...")
            # Prevent navigation so we can re-check the panel after click.
            page.evaluate("""
              document.querySelectorAll('[data-mnav-panel] a').forEach(a => a.addEventListener('click', e => e.preventDefault(), { once: true }));
            """)
            nav_links[0].click()
            try:
                page.wait_for_function(
                    "() => !document.querySelector('[data-mnav-panel]').classList.contains('open')",
                    timeout=2000,
                )
                print("✓ clicking a nav link auto-closes the panel")
            except PWTimeout:
                fails.append("panel did not auto-close after nav-link click")

        # Click toggle again to re-open + close.
        toggle.click()
        try:
            page.wait_for_function(
                "() => document.querySelector('[data-mnav-panel]').classList.contains('open')",
                timeout=2000,
            )
        except PWTimeout:
            fails.append("re-opening: panel did not gain .open class")
        toggle.click()
        try:
            page.wait_for_function(
                "() => !document.querySelector('[data-mnav-panel]').classList.contains('open')",
                timeout=2000,
            )
            print("✓ toggle reliably opens AND closes the panel")
        except PWTimeout:
            fails.append("toggle did not close the panel on second click")

        browser.close()

    print()
    if fails:
        print("=== FAILURES ===")
        for f in fails:
            print(f"  - {f}")
        return 1
    print("=== ALL CHECKS PASSED ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
