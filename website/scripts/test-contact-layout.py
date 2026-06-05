"""Screenshot + measure /contact at desktop + tablet + mobile so we can
see whatever layout issue the user spotted ("some sections too long
under the content").

Outputs full-page PNGs into website/figma-refs/contact-* and prints
the bounding boxes of every <section> + height totals so we can spot
sections that have huge empty trailing space or content that overruns.
"""
from __future__ import annotations

import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = "https://website.ontargetnotes.com/contact"
SHOTS = Path(__file__).resolve().parent.parent / "figma-refs"
SHOTS.mkdir(parents=True, exist_ok=True)

VIEWPORTS = [
    ("desktop", {"width": 1440, "height": 900}, False),
    ("tablet",  {"width": 820,  "height": 1180}, True),
    ("mobile",  {"width": 390,  "height": 844},  True),
]


def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for name, viewport, is_mobile in VIEWPORTS:
            ctx = browser.new_context(
                viewport=viewport,
                device_scale_factor=2,
                is_mobile=is_mobile,
                has_touch=is_mobile,
                user_agent=(
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) "
                    "AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1"
                    if is_mobile else
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
                ),
            )
            page = ctx.new_page()
            print(f"\n=== {name} {viewport['width']}x{viewport['height']} ===")
            page.goto(URL, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(800)

            full_h = page.evaluate("() => document.documentElement.scrollHeight")
            print(f"  full page height: {full_h}px")
            page.screenshot(path=str(SHOTS / f"contact-{name}.png"), full_page=True)

            # Capture geometry for every <section> on the page so we can
            # spot sections that are too tall vs their content.
            geoms = page.evaluate("""() => {
              const out = [];
              document.querySelectorAll('section, main, aside, footer').forEach((s) => {
                const r = s.getBoundingClientRect();
                const cs = getComputedStyle(s);
                // Best-effort: the highest bottom of any direct child
                let contentBottom = r.top;
                for (const c of s.children) {
                  const cr = c.getBoundingClientRect();
                  if (cr.bottom > contentBottom) contentBottom = cr.bottom;
                }
                const trailing = Math.max(0, Math.round(r.bottom - contentBottom));
                out.push({
                  tag: s.tagName.toLowerCase(),
                  cls: (s.className || '').slice(0, 80),
                  top: Math.round(r.top + window.scrollY),
                  h: Math.round(r.height),
                  trailing: trailing,
                  pt: cs.paddingTop, pb: cs.paddingBottom,
                });
              });
              return out;
            }""")
            print("  layout (top  h    trailing-empty  pad-y       tag.class):")
            for g in geoms:
                marker = " ← TALL TRAILING" if g["trailing"] > 80 else ""
                print(f"    {g['top']:5d}  {g['h']:4d}  {g['trailing']:4d}            {g['pt']:>4}/{g['pb']:<4}  {g['tag']}.{g['cls']}{marker}")

            ctx.close()
        browser.close()
    print(f"\nscreenshots -> {SHOTS}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
