#!/usr/bin/env bash
# Cloudflare Pages build entry point.
#
# Set this as the build command in the CF Pages project settings:
#   Build command:     bash build.sh
#   Build output:      .            (deploy from /website)
#   Root directory:    /website     (project lives in a subfolder)
#
# Steps:
#   1. Re-scan assets/blog/*.md and rebuild assets/blog/index.json
#   2. Generate per-page Open Graph SVGs into assets/og/ (Node, no deps)
#   3. Re-inject schema.org JSON-LD + OG/Twitter meta into every HTML page
#   4. Fetch self-hosted webfonts (idempotent) and sweep HTML to remove
#      Google Fonts requests + inject the preload tag.
#   5. Sweep HTML for the skip-to-content accessibility link.
#   6. Re-generate sitemap.xml from index.json + the static-page registry
#   7. Push fresh URLs to IndexNow (Bing / Yandex / Seznam / Naver)
#
# The IndexNow ping is non-fatal: if the API is down or rate-limits the
# deploy still succeeds. Pass `--all` (via SITEMAP_FULL_PING=1) on first
# deploy or after a large content change to submit every URL.

set -e

cd "$(dirname "$0")"

echo "==> Building blog index..."
python3 scripts/build-blog-index.py

echo "==> Generating per-page Open Graph SVGs..."
node scripts/gen-og-images.mjs

echo "==> Re-injecting SEO meta + JSON-LD..."
python3 scripts/inject-seo.py

echo "==> Ensuring self-hosted fonts..."
bash scripts/setup-fonts.sh

echo "==> Sweeping HTML for self-hosted-font references..."
node scripts/selfhost-fonts.mjs

echo "==> Sweeping HTML for skip-to-content links..."
node scripts/add-skip-link.mjs

echo "==> Building sitemap.xml + robots.txt..."
python3 scripts/build-sitemap.py

echo "==> Pinging IndexNow..."
if [ "${SITEMAP_FULL_PING:-0}" = "1" ]; then
  python3 scripts/indexnow-ping.py --all || true
else
  python3 scripts/indexnow-ping.py || true
fi

echo "==> Build complete."
