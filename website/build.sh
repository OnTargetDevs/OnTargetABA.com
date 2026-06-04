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
#   2. Re-generate sitemap.xml from index.json + the static-page registry
#   3. Push fresh URLs to IndexNow (Bing / Yandex / Seznam / Naver)
#
# The IndexNow ping is non-fatal: if the API is down or rate-limits the
# deploy still succeeds. Pass `--all` (via SITEMAP_FULL_PING=1) on first
# deploy or after a large content change to submit every URL.

set -e

cd "$(dirname "$0")"

echo "==> Building blog index..."
python3 scripts/build-blog-index.py

echo "==> Building sitemap.xml + robots.txt..."
python3 scripts/build-sitemap.py

echo "==> Pinging IndexNow..."
if [ "${SITEMAP_FULL_PING:-0}" = "1" ]; then
  python3 scripts/indexnow-ping.py --all || true
else
  python3 scripts/indexnow-ping.py || true
fi

echo "==> Build complete."
