"""Trace the specific failing blog post URL."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(__file__).parent.parent / "figma-refs" / "trace-specific.png"
URL = "https://website.ontargetnotes.com/blog/posts/how-to-talk-to-an-autistic-teenager-a-guide-for-parents-educators-and-caregivers"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await ctx.new_page()
        msgs = []
        page.on("console", lambda m: msgs.append(f"[{m.type}] {m.text[:300]}"))
        page.on("requestfailed", lambda r: msgs.append(f"[reqfail] {r.url} -> {r.failure}"))
        page.on("response", lambda r: msgs.append(f"[{r.status}] {r.url}") if r.status >= 400 else None)

        await page.goto(URL, wait_until="networkidle", timeout=45000)
        await page.wait_for_timeout(3500)

        state = await page.evaluate("""
          () => ({
             pathname: location.pathname,
             title: document.title,
             notfound: !document.getElementById('notfound').classList.contains('hidden'),
             article:  !document.getElementById('article').classList.contains('hidden'),
             h1: (document.querySelector('h1') || {}).textContent,
             post_title: (document.getElementById('post-title') || {}).textContent,
          })
        """)
        print("STATE:", state)

        # What URL did the markdown fetch try?
        # Just attempt the same fetch manually from inside the page
        mdcheck = await page.evaluate("""
          async () => {
            const slug = location.pathname.split('/').pop();
            const url = '/assets/blog/' + slug + '.md';
            try {
              const r = await fetch(url);
              return { url, status: r.status, ok: r.ok, ctype: r.headers.get('content-type'), len: (await r.text()).length };
            } catch (e) { return { url, error: String(e) }; }
          }
        """)
        print("MD FETCH:", mdcheck)

        # Also check what the renderer would parse
        slugcheck = await page.evaluate("""
          () => {
            const m = location.pathname.match(/\\/blog\\/posts\\/([^/?#]+)/);
            let s = m ? decodeURIComponent(m[1]) : '';
            s = s.replace(/[^a-z0-9-]/gi, '');
            return { matched: !!m, slug: s };
          }
        """)
        print("SLUG PARSE:", slugcheck)

        await page.screenshot(path=str(OUT), full_page=False)
        print("\n=== console (filtered) ===")
        for m in msgs[-30:]:
            print(m)
        await browser.close()

asyncio.run(main())
