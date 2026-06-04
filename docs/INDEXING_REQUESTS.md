# Indexing Requests

How to ask search engines to discover and re-crawl pages on this site. Two
protocols cover most engines: IndexNow (Bing + Yandex + Seznam + Naver, push)
and the Search Console / Webmaster Tools dashboards (Google + Bing, manual).

---

## IndexNow

IndexNow is a free, open push-notification protocol. Instead of waiting for
crawlers to discover changes, the site tells them: "Hey, these URLs changed.
Please recrawl."

- **Endpoint:** `https://api.indexnow.org/IndexNow`
- **Participating engines:** Bing, Yandex, Seznam, Naver (and any crawler
  that proxies the IndexNow feed). Google does **not** participate.
- **Cost:** zero. No account required.

### How ownership is proved

Each domain proves it controls the IndexNow key by serving a text file at the
deploy root whose name *is* the key, whose contents *are* the key.

- **Key:** `c8f5d3a1e947b2f6a4c1b9d8e6f3a2b5`
- **Key file:** `website/c8f5d3a1e947b2f6a4c1b9d8e6f3a2b5.txt`
- **Public URL:** `https://ontargetaba.com/c8f5d3a1e947b2f6a4c1b9d8e6f3a2b5.txt`
- **Contents:** the single line `c8f5d3a1e947b2f6a4c1b9d8e6f3a2b5`

When the IndexNow API receives a submission, it does a one-time fetch of
that file and confirms the contents match the `key` in the JSON body. Once
verified, submissions go through for the lifetime of the key.

The key file is served as `Content-Type: text/plain` with a 5-minute cache
(see `_headers`). If you ever rotate the key, change the filename, the
contents, and the constant at the top of `scripts/indexnow-ping.py`.

### The ping script

`scripts/indexnow-ping.py` does three things:

1. Reads `sitemap.xml`.
2. Filters URLs by `<lastmod>`: by default, only those modified in the last
   14 days survive.
3. POSTs them in batches of up to 1000 to the IndexNow endpoint.

Failures are non-fatal &mdash; a flaky IndexNow API can't break a deploy.

Flags:

- `python3 scripts/indexnow-ping.py` &mdash; default: last 14 days.
- `python3 scripts/indexnow-ping.py --all` &mdash; every URL in the sitemap.
- `python3 scripts/indexnow-ping.py --since 30` &mdash; last 30 days.

### The full-ping override

For a one-shot "ping every URL on the next deploy," set the env var:

```
SITEMAP_FULL_PING=1
```

in the CF Pages dashboard (Settings → Environment variables, Production
environment). On the next deploy, `build.sh` swaps in `--all`:

```bash
if [ "${SITEMAP_FULL_PING:-0}" = "1" ]; then
  python3 scripts/indexnow-ping.py --all || true
else
  python3 scripts/indexnow-ping.py || true
fi
```

After the deploy succeeds, unset the var (or change it to `0`). Otherwise
every subsequent build re-pings the entire sitemap, which doesn't hurt
anything but is wasteful.

Use cases for `--all`:

- First deploy after launch.
- Migrating the canonical domain (e.g. swapping the production host).
- A site-wide content refresh that changed every page's lastmod.

---

## Google Search Console

Google ignores IndexNow. To get Google to re-crawl, use Search Console.

### Verifying ownership

Pick one of three methods. DNS is the most durable; an HTML file is the
easiest if you already control the deploy.

**DNS TXT record (recommended):**

1. In Search Console → Settings → Ownership verification, pick DNS TXT.
2. Copy the TXT record value Google gives you.
3. In Cloudflare DNS, add a TXT record on `ontargetaba.com` with that value.
4. Wait a few minutes, click Verify.

**HTML file:**

1. Google gives you a filename like `google1234abcd.html`.
2. Drop it at the deploy root (`website/google1234abcd.html`).
3. Commit, push, wait for CF Pages to deploy, click Verify.

**HTML meta tag:**

1. Google gives you a `<meta name="google-site-verification" content="...">`.
2. Add it to `inject-seo.py` so every page gets it (or just `index.html`).
3. Re-run the build, click Verify.

### Submitting the sitemap

Once ownership is verified:

1. Search Console → **Sitemaps** in the left rail.
2. Enter the path: `sitemap.xml`.
3. Submit.

Google fetches `https://ontargetaba.com/sitemap.xml` and queues the URLs for
crawling. Status shows up in the sitemap list ("Success", "Couldn't fetch",
"Has errors"). Re-submit any time the sitemap changes substantially &mdash;
otherwise Google rechecks it on its own schedule (every few days for active
sites).

### URL Inspection (force a recrawl of one URL)

The URL Inspection tool is how you nudge Google when you need a specific
page indexed *now* (e.g. you fixed an error, or you launched a high-value
page and don't want to wait the usual day or two).

1. In Search Console, paste the full URL into the search bar at the top
   ("Inspect any URL in `ontargetaba.com`").
2. Wait for the live test.
3. Click **Request Indexing**.

Limits:

- ~10&ndash;20 requests per day, per property. Don't use it for bulk.
- "Request Indexing" puts the URL in a priority crawl queue; it does not
  guarantee indexing or position.
- If the page has crawl errors (e.g. blocked by `robots.txt`, returns a 5xx),
  fix those first &mdash; the request will fail.

For bulk indexing (e.g. the 161 blog posts after launch), let the sitemap
do the work; don't try to one-by-one through URL Inspection.

---

## Bing Webmaster Tools

Bing reads IndexNow, so for most purposes you don't need to touch this. But
Bing Webmaster Tools is useful for:

- Verifying ownership and seeing per-URL index status.
- Catching errors Bing finds (it has stricter expectations around some
  schema fields than Google does).
- Manually re-submitting a URL the way Google's URL Inspection lets you.

### Verifying ownership

Same three methods: XML file, meta tag, or CNAME / DNS. Pick whichever is
easiest. If you already verified Google via DNS, doing Bing via DNS too is
two more clicks.

### Submitting the sitemap

Webmaster Tools → Sitemaps → **Submit Sitemap** → enter
`https://ontargetaba.com/sitemap.xml`. Bing fetches and queues immediately.

You only need to submit once per sitemap URL; Bing rechecks the same
sitemap on its own cadence.

### URL Submission

Webmaster Tools → URL Submission → paste up to 10 URLs at a time. This is
the manual equivalent of an IndexNow ping. Use it when:

- You suspect IndexNow didn't fire (check the build log).
- A specific URL is slow to recrawl and you want to nudge it.

---

## Runbook: I just published a new page

1. **Merge the admin PR** (or the manual commit).
2. **Wait for the CF Pages build.** Watch the deploy log; should take 60&ndash;120
   seconds. The build emits:
   - `==> Building sitemap.xml + robots.txt...` &mdash; new page added.
   - `==> Pinging IndexNow...` &mdash; the URL is pushed to Bing & friends.
3. **Verify the page is live.** Visit `https://ontargetaba.com/{slug}.html`
   in an incognito window. Check title, meta description, breadcrumb, OG
   image (use a debugger like `opengraph.xyz`).
4. **Confirm the sitemap.** Open `https://ontargetaba.com/sitemap.xml` and
   search for the slug. Should have a fresh `<lastmod>`.
5. **Confirm IndexNow accepted.** The build log shows `IndexNow: 200 OK` or
   `202 Accepted`. A 422 here usually means the key file isn't yet visible at
   the public URL &mdash; recheck `_headers` and re-deploy.
6. **(Optional, urgent only) Nudge Google.** Search Console → URL Inspection
   → paste the URL → Request Indexing. Skip this for routine launches;
   Google will pick it up from the sitemap within a day or two.

### When to use `SITEMAP_FULL_PING=1`

- After the very first deploy.
- After moving the canonical domain.
- After a content refresh that touched most or all pages.

Otherwise leave it off &mdash; the 14-day default catches everything that
actually changed.

### When to not bother

- Edits to drafts. Drafts emit `noindex` and aren't in the sitemap, so they
  don't ping.
- Edits to thank-you pages. They emit `noindex,nofollow` (the `noindex` flag
  in `SEO_PAGES` does that) and aren't in the sitemap either.
- Local-only tweaks (color, copy fixes that don't change SEO meta). Crawlers
  will see these on the next normal crawl.
