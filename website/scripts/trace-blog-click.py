"""Open the live blog, click the first post card, dump the final URL +
console errors so we can pinpoint why the renderer shows 'Post not found'.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT_DIR = Path(__file__).parent.parent / "figma-refs"
OUT_DIR.mkdir(exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await ctx.new_page()
        console_msgs = []
        page.on("console", lambda m: console_msgs.append(f"[{m.type}] {m.text}"))
        page.on("requestfailed", lambda r: console_msgs.append(f"[reqfail] {r.url} -> {r.failure}"))

        await page.goto("https://website.ontargetnotes.com/blog", wait_until="networkidle", timeout=45000)
        await page.wait_for_timeout(3000)

        # Find the first .post-card link
        href = await page.evaluate("""
          () => {
            const a = document.querySelector('a.post-card');
            return a ? { href: a.href, displayed: a.getAttribute('href') } : null;
          }
        """)
        print(f"first card href: {href}")

        if href and href.get("href"):
            await page.goto(href["href"], wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(3500)
            url = page.url
            title = await page.title()
            visible_h1 = await page.evaluate("""
              () => {
                const a = document.getElementById('article');
                const nf = document.getElementById('notfound');
                return {
                  article_visible: a && !a.classList.contains('hidden'),
                  notfound_visible: nf && !nf.classList.contains('hidden'),
                  h1_text: (document.querySelector('h1') || {}).textContent || '',
                  pathname: location.pathname,
                  search: location.search,
                };
              }
            """)
            print(f"final URL:    {url}")
            print(f"title:        {title}")
            print(f"page state:   {visible_h1}")
            await page.screenshot(path=str(OUT_DIR / "trace-post.png"), full_page=False)

        print("\n=== console (last 25) ===")
        for m in console_msgs[-25:]:
            print(m)
        await browser.close()

asyncio.run(main())
