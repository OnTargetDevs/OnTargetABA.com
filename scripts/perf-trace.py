"""
Measure where time goes on https://beta.ontargetaba.com/autism-testing.
Captures resource timing per request + the headline Web Vitals.
"""
from __future__ import annotations
import json
import time
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

URL = "https://beta.ontargetaba.com/autism-testing"


def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent="Mozilla/5.0 (perf-trace)",
        )
        page = ctx.new_page()

        timings = []

        def record(resp):
            t = resp.request.timing
            timings.append({
                "url": resp.url,
                "type": resp.request.resource_type,
                "status": resp.status,
                "size": int(resp.headers.get("content-length", 0) or 0),
                "start": t["startTime"],
                "end": t["responseEnd"],
                "duration": t["responseEnd"] - t["startTime"],
            })

        page.on("response", record)

        print(f"==> loading {URL}")
        t0 = time.time()
        page.goto(URL, wait_until="load", timeout=45000)
        load_done = time.time() - t0

        # Web Vitals via PerformanceObserver
        vitals = page.evaluate("""
            new Promise((resolve) => {
              const v = {LCP: null, FCP: null, DCL: null, load: null, TTFB: null};
              const nav = performance.getEntriesByType('navigation')[0];
              if (nav) {
                v.TTFB = nav.responseStart;
                v.DCL  = nav.domContentLoadedEventEnd;
                v.load = nav.loadEventEnd;
              }
              const paints = performance.getEntriesByType('paint');
              for (const p of paints) {
                if (p.name === 'first-contentful-paint') v.FCP = p.startTime;
              }
              try {
                const lcpObs = new PerformanceObserver((list) => {
                  for (const e of list.getEntries()) v.LCP = e.startTime;
                });
                lcpObs.observe({type: 'largest-contentful-paint', buffered: true});
              } catch (e) {}
              setTimeout(() => resolve(v), 800);
            });
        """)

        print("\n==> Web Vitals (ms):")
        for k, v in vitals.items():
            if v is not None:
                print(f"   {k:<5} {v:.0f}")

        print(f"\n==> wall-clock load: {load_done*1000:.0f}ms")

        # Resource budget summary
        by_host = {}
        for r in timings:
            host = urlparse(r["url"]).netloc
            by_host.setdefault(host, {"bytes": 0, "count": 0, "ms_max": 0})
            by_host[host]["bytes"] += r["size"]
            by_host[host]["count"] += 1
            by_host[host]["ms_max"] = max(by_host[host]["ms_max"], r["duration"])

        print(f"\n==> Resources by host ({len(timings)} requests):")
        for host, info in sorted(by_host.items(), key=lambda kv: -kv[1]["bytes"]):
            kb = info["bytes"] / 1024
            print(f"   {host:<40} {info['count']:>3} reqs  {kb:>7.1f} KB  worst {info['ms_max']:>5.0f}ms")

        # Slowest individual requests
        slowest = sorted(timings, key=lambda r: -r["duration"])[:10]
        print("\n==> Slowest 10 requests:")
        for r in slowest:
            kb = r["size"] / 1024
            host = urlparse(r["url"]).netloc
            tail = r["url"].split("/")[-1].split("?")[0][:50]
            print(f"   {r['duration']:>5.0f}ms  {kb:>6.1f}KB  {host:<30} {tail}")

        browser.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
