"""
Page-load optimization sweep. Idempotent.

For every HTML page under website/ (excluding /admin/ which doesn't need
prefetch/transition niceties), this script does these things:

1. Swap the Tailwind CDN <script> for the self-hosted vendored copy at
   /assets/vendor/tailwind.js (production-warning already patched out at
   download time).

2. Inline the contents of assets/data/header.json and footer.json into
   each page as <script type="application/json"> blocks. header.js and
   footer.js read these synchronously — removes the network round-trip
   from every page load and lets the nav paint before app.js even
   downloads.

3. Add <meta name="view-transition" content="same-origin"> so Chromium
   browsers cross-fade between pages instead of white-flashing.

4. Inject <link rel="prefetch"> for the highest-value next destinations
   (Contact, Our Services, Autism Testing, Locations). Skips the link
   for the current page so we don't prefetch ourselves.

Idempotent — re-injectable blocks are wrapped in
<!-- auto-perf-start --> / <!-- auto-perf-end --> markers and stripped
before re-injection. Safe to run as part of build.sh.
"""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent

# Pages to consider for prefetch. Mapped to absolute paths so they work
# from any depth (blog/post.html, for example).
PREFETCH_TARGETS = [
    "/contact.html",
    "/our-services.html",
    "/autism-testing.html",
    "/locations.html",
]


def load_json_safe(rel_path: str) -> str:
    """Read a JSON file and return its compact serialization with `<`
    escaped, so it's safe to drop verbatim inside an HTML <script> tag."""
    try:
        with (ROOT / rel_path).open(encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        return "null"
    return json.dumps(data, separators=(",", ":")).replace("<", "\\u003c")


HEADER_DATA = load_json_safe("assets/data/header.json")
FOOTER_DATA = load_json_safe("assets/data/footer.json")
WIDGET_DATA = load_json_safe("assets/data/widget.json")


def load_head_scripts() -> str:
    """Return the raw HTML the admin pasted into head-scripts.json."""
    try:
        with (ROOT / "assets/data/head-scripts.json").open(encoding="utf-8") as f:
            data = json.load(f)
        return (data.get("scripts") or "").strip()
    except FileNotFoundError:
        return ""


HEAD_SCRIPTS = load_head_scripts()

START = "<!-- auto-perf-start -->"
END = "<!-- auto-perf-end -->"

TAILWIND_CDN_RE = re.compile(
    r'<script\s+src="https://cdn\.tailwindcss\.com"\s*>\s*</script>'
)
TAILWIND_LOCAL = '<script src="/assets/vendor/tailwind.js"></script>'

PERF_BLOCK_RE = re.compile(
    rf"\s*{re.escape(START)}.*?{re.escape(END)}\s*", re.DOTALL
)


def build_perf_block(page_path: str) -> str:
    # header.js / footer.js / app.js read their data from these inlined
    # script blocks. Removes per-page fetch round-trips and lets the nav
    # paint as soon as the script tags are parsed.
    lines = [
        START,
        '<meta name="view-transition" content="same-origin">',
        f'<script id="ota-header-data" type="application/json">{HEADER_DATA}</script>',
        f'<script id="ota-footer-data" type="application/json">{FOOTER_DATA}</script>',
        f'<script id="ota-widget-data" type="application/json">{WIDGET_DATA}</script>',
    ]
    for target in PREFETCH_TARGETS:
        if target == page_path:
            continue
        lines.append(f'<link rel="prefetch" href="{target}">')
    # Admin-pasted scripts (GA, GTag, FB Pixel, etc.) go LAST so they
    # have access to any DOM in head that earlier perf-block items set up.
    if HEAD_SCRIPTS:
        lines.append("<!-- auto-perf head-scripts start -->")
        lines.append(HEAD_SCRIPTS)
        lines.append("<!-- auto-perf head-scripts end -->")
    lines.append(END)
    return "\n".join(lines)


def page_path_for(html_file: Path) -> str:
    """
    Map a filesystem path to its absolute URL path so we can skip the
    self-prefetch entry. website/contact.html -> /contact.html.
    """
    rel = html_file.relative_to(ROOT).as_posix()
    return "/" + rel


def process(html_file: Path) -> tuple[bool, list[str]]:
    text = html_file.read_text(encoding="utf-8")
    changes: list[str] = []
    new_text = text

    # 1. Tailwind CDN -> local vendor
    if TAILWIND_CDN_RE.search(new_text):
        new_text, n = TAILWIND_CDN_RE.subn(TAILWIND_LOCAL, new_text)
        if n:
            changes.append(f"tailwind:{n}")

    # 2/3/4. Wipe any prior perf block, then re-inject before </head>
    new_text = PERF_BLOCK_RE.sub("\n", new_text)

    if "</head>" not in new_text:
        # No head close — skip entirely (admin sub-pages may use partials)
        if changes:
            html_file.write_text(new_text, encoding="utf-8")
        return (bool(changes), changes)

    block = build_perf_block(page_path_for(html_file))
    new_text = new_text.replace("</head>", f"  {block}\n</head>", 1)
    changes.append("perf-block")

    if new_text != text:
        html_file.write_text(new_text, encoding="utf-8")
        return (True, changes)
    return (False, changes)


def process_tailwind_only(html_file: Path) -> bool:
    """Admin pages get the Tailwind swap but not the perf block."""
    text = html_file.read_text(encoding="utf-8")
    new_text, n = TAILWIND_CDN_RE.subn(TAILWIND_LOCAL, text)
    if n:
        html_file.write_text(new_text, encoding="utf-8")
        return True
    return False


def main() -> int:
    pages = list(ROOT.glob("*.html"))
    pages += list((ROOT / "blog").glob("*.html"))
    admin_pages = list((ROOT / "admin").glob("*.html"))

    touched = 0
    for p in pages:
        changed, what = process(p)
        if changed:
            touched += 1
            print(f"  {p.relative_to(ROOT)}: {', '.join(what)}")

    admin_touched = 0
    for p in admin_pages:
        if process_tailwind_only(p):
            admin_touched += 1
            print(f"  {p.relative_to(ROOT)}: tailwind:1 (admin, no perf block)")

    print(
        f"==> optimize-pages: touched {touched} of {len(pages)} public + "
        f"{admin_touched} of {len(admin_pages)} admin files"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
