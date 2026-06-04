"""Add a Blog link to the desktop nav across every HTML page.

The site's desktop nav block is byte-identical across pages (copy-paste
from index.html). One match + one insertion per page does the job.
Idempotent — bails out if the Blog link is already present in the nav.
"""
from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).parent.parent

# The Blog link to insert. The unqualified `blog.html` href works for
# every page at the website root.
DESKTOP_LINK = '\n      <a data-nav-link href="blog.html" class="link-uline hover:text-coral">Blog</a>'

# Insertion anchor: the existing Careers link followed by the nav's close.
ANCHOR = '<a data-nav-link href="careers.html" class="link-uline hover:text-coral">Careers</a>'

def patch(text: str) -> tuple[str, str]:
    """Returns (new_text, status). status is one of:
       'inserted', 'already-present', 'no-anchor'."""
    # Detect if a Blog desktop-nav link is already there. Mobile-panel
    # blog links exist already on most pages; distinguish by the
    # `data-nav-link` attribute, which only appears in the desktop nav.
    if 'data-nav-link href="blog.html"' in text:
        return text, 'already-present'
    if ANCHOR not in text:
        return text, 'no-anchor'
    new_text = text.replace(ANCHOR, ANCHOR + DESKTOP_LINK, 1)
    return new_text, 'inserted'


def main() -> int:
    pages = sorted(ROOT.glob("*.html"))
    counts = {'inserted': 0, 'already-present': 0, 'no-anchor': 0}
    for p in pages:
        raw = p.read_bytes()
        had_bom = raw[:3] == b"\xef\xbb\xbf"
        text = raw[3:].decode("utf-8") if had_bom else raw.decode("utf-8")
        new_text, status = patch(text)
        counts[status] += 1
        if status == 'inserted':
            out = (b"\xef\xbb\xbf" if had_bom else b"") + new_text.encode("utf-8")
            p.write_bytes(out)
            print(f"  + {p.name}")
        elif status == 'no-anchor':
            print(f"  ! {p.name}: nav anchor not found")
    print(f"\nDone. Inserted={counts['inserted']}, "
          f"already-present={counts['already-present']}, "
          f"no-anchor={counts['no-anchor']}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
