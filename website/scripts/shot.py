"""Quick Playwright screenshot for a single URL.

Usage:
    python scripts/shot.py URL [OUTPUT.png] [--full] [--width WIDTH]

Defaults: 1440x900 viewport, viewport-only screenshot, output to
website/figma-refs/shot.png.

`--full` forces all scroll-reveal elements to be visible (by scrolling
the page top->bottom and waiting for each section's IntersectionObserver
to fire) before taking a full-page screenshot.
"""
from __future__ import annotations
import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "figma-refs"


async def force_reveal_all(page) -> None:
    """Scroll top->bottom in steps so IntersectionObserver-based reveals
    actually fire. Then scroll back to top for the screenshot."""
    height = await page.evaluate("document.body.scrollHeight")
    step = 600
    y = 0
    while y < height:
        await page.evaluate(f"window.scrollTo(0, {y})")
        await page.wait_for_timeout(140)
        y += step
    # Settle at bottom, then return to top
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await page.wait_for_timeout(400)
    await page.evaluate("window.scrollTo(0, 0)")
    await page.wait_for_timeout(400)


async def shoot(url: str, out: Path, width: int, full: bool) -> None:
    OUT_DIR.mkdir(exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(
            viewport={"width": width, "height": 900},
            device_scale_factor=1,
            user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/124.0.0.0 Safari/537.36"),
            reduced_motion="reduce",  # animations off so opacity is final immediately
        )
        page = await ctx.new_page()
        print(f"  navigating to {url} ...", flush=True)
        try:
            await page.goto(url, wait_until="networkidle", timeout=45000)
        except Exception as e:
            print(f"  networkidle timeout ({e}); continuing", flush=True)
        await page.wait_for_timeout(1500)

        if full:
            print(f"  scrolling page to fire reveals ...", flush=True)
            await force_reveal_all(page)

        await page.screenshot(path=str(out), full_page=full)
        size_kb = out.stat().st_size // 1024
        print(f"  wrote {out.name} ({size_kb} KB, full={full}, width={width})",
              flush=True)
        await browser.close()


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    url = sys.argv[1]
    out_arg = next((a for a in sys.argv[2:] if not a.startswith("--")
                    and not a.isdigit()), None)
    width = 1440
    if "--width" in sys.argv:
        i = sys.argv.index("--width")
        try:
            width = int(sys.argv[i + 1])
        except Exception:
            pass
    full = "--full" in sys.argv
    out = OUT_DIR / (out_arg or "shot.png")
    asyncio.run(shoot(url, out, width, full))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
