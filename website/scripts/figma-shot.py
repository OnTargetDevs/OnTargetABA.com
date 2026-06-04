"""Screenshot a set of Figma proto pages via Playwright headless Chromium."""
import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright

OUT_DIR = Path(__file__).parent.parent / "figma-refs"
OUT_DIR.mkdir(exist_ok=True)

TARGETS = [
    ("home",      "https://www.figma.com/proto/1BS1Qg0H4ToqKZXLAeNX1P/On-Target-ABA?node-id=32-2&t=YQPCm4iGQXS6zWHk-0&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1"),
    ("about",     "https://www.figma.com/proto/1BS1Qg0H4ToqKZXLAeNX1P/On-Target-ABA?node-id=634-2&t=YQPCm4iGQXS6zWHk-0&scaling=min-zoom&content-scaling=fixed&page-id=634%3A2"),
    ("services",  "https://www.figma.com/proto/1BS1Qg0H4ToqKZXLAeNX1P/On-Target-ABA?node-id=634-194&t=YQPCm4iGQXS6zWHk-0&scaling=min-zoom&content-scaling=fixed&page-id=634%3A194"),
    ("cleveland", "https://www.figma.com/proto/1BS1Qg0H4ToqKZXLAeNX1P/On-Target-ABA?node-id=634-457&t=YQPCm4iGQXS6zWHk-0&scaling=min-zoom&content-scaling=fixed&page-id=634%3A456"),
    ("careers",   "https://www.figma.com/proto/1BS1Qg0H4ToqKZXLAeNX1P/On-Target-ABA?node-id=634-666&t=YQPCm4iGQXS6zWHk-0&scaling=min-zoom&content-scaling=fixed&page-id=634%3A666"),
]


async def shoot(page, name, url):
    print(f"[{name}] navigating...", flush=True)
    try:
        await page.goto(url, wait_until="networkidle", timeout=60000)
    except Exception as e:
        print(f"[{name}] networkidle timed out: {e}; continuing", flush=True)

    # Give Figma's React app + canvas time to finish painting
    await page.wait_for_timeout(8000)

    # Try to dismiss any auth/welcome banner if present
    for sel in ['button:has-text("View only")', 'button:has-text("Dismiss")', 'button[aria-label="Close"]']:
        try:
            btn = await page.query_selector(sel)
            if btn:
                await btn.click()
                await page.wait_for_timeout(500)
        except Exception:
            pass

    out_path = OUT_DIR / f"{name}.png"
    await page.screenshot(path=str(out_path), full_page=False)
    size_kb = out_path.stat().st_size // 1024
    print(f"[{name}] saved {out_path.name} ({size_kb} KB)", flush=True)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(
            viewport={"width": 1600, "height": 1000},
            device_scale_factor=1,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        )
        page = await ctx.new_page()
        for name, url in TARGETS:
            try:
                await shoot(page, name, url)
            except Exception as e:
                print(f"[{name}] FAILED: {e}", flush=True)
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
