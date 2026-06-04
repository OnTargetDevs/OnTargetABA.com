#!/usr/bin/env bash
# ============================================================
# setup-fonts.sh — download Plus Jakarta Sans + Fraunces woff2
# (Latin subset only) into website/assets/fonts/.
#
# Both families are variable fonts on Google's CDN: a single
# Latin woff2 carries the full weight axis (200-800 / 9-144),
# so we only need ONE file per family. We still emit per-weight
# filenames (`plus-jakarta-sans-{w}.woff2` etc.) as copies so
# the @font-face rules in app.css can preload an explicit weight
# without browsers fighting over a shared variable file.
#
# Idempotent: skips any weight that's already on disk.
# Run during initial setup AND on every build (build.sh) so a
# missing file gets re-fetched without a manual step.
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FONT_DIR="$SCRIPT_DIR/../assets/fonts"
mkdir -p "$FONT_DIR"

UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

# Pick up extra curl flags from the environment (e.g. proxies,
# --ssl-no-revoke on Windows where schannel can't reach a CRL).
CURL_OPTS="${CURL_OPTS:-}"
case "${OS:-}${OSTYPE:-}" in
  *Windows*|*msys*|*cygwin*|*mingw*)
    CURL_OPTS="$CURL_OPTS --ssl-no-revoke"
    ;;
esac

WEIGHTS=(400 500 600 700 800)

all_present() {
  local family="$1"
  for w in "${WEIGHTS[@]}"; do
    if [ ! -s "$FONT_DIR/${family}-${w}.woff2" ]; then
      return 1
    fi
  done
  return 0
}

# Fetch one family. $1=filename slug, $2=Google CSS URL.
# Google ships one @font-face block per subset (Latin,
# Latin-Ext, Vietnamese, etc.) per weight. For variable
# fonts the URL is the same across all weights of the same
# subset. We pick the Latin block of the first weight we
# find, download once, then copy to each per-weight filename.
fetch_family() {
  local family_slug="$1"
  local css_url="$2"

  if all_present "$family_slug"; then
    echo "  - $family_slug: all weights present, skipping download."
    return 0
  fi

  local tmpcss
  tmpcss="$(mktemp)"
  curl -sSL $CURL_OPTS -H "User-Agent: $UA" "$css_url" -o "$tmpcss"

  # awk: walk @font-face blocks (RS="@font-face"); emit the
  # first url(...woff2) whose block contains U+0000-00FF.
  local latin_url
  latin_url="$(awk '
    BEGIN { RS="@font-face"; FS="\n" }
    /U\+0000-00FF/ {
      for (i=1; i<=NF; i++) {
        if (match($i, /url\((https:\/\/[^)]+\.woff2)\)/, m)) { print m[1]; exit }
      }
    }
  ' "$tmpcss")"

  rm -f "$tmpcss"

  if [ -z "$latin_url" ]; then
    echo "  ! could not find Latin woff2 URL for $family_slug" >&2
    return 1
  fi

  local master="$FONT_DIR/${family_slug}.woff2"
  echo "  - downloading ${family_slug}.woff2 (variable, all weights)"
  curl -sSL $CURL_OPTS -H "User-Agent: $UA" "$latin_url" -o "$master"

  # Mirror per-weight filenames so each @font-face rule has a
  # stable, predictable href to preload.
  for w in "${WEIGHTS[@]}"; do
    local out="$FONT_DIR/${family_slug}-${w}.woff2"
    if [ ! -s "$out" ]; then
      cp "$master" "$out"
      echo "  - ${family_slug}-${w}.woff2"
    fi
  done
}

echo "==> Fetching Plus Jakarta Sans (Latin)..."
fetch_family "plus-jakarta-sans" \
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"

echo "==> Fetching Fraunces (Latin)..."
fetch_family "fraunces" \
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&display=swap"

echo "==> Fonts ready in $FONT_DIR"
