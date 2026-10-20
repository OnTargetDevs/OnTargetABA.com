"""
fix-a11y.py — idempotent accessibility fixes for the On Target ABA static site.

Fixes addressed:
  1. aria-prohibited-attr  — adds role="img" to div.review-stars[aria-label] so
                             aria-label is permitted on that element.
  2. landmark-one-main     — wraps page content in <main>…</main> on every page
                             that is missing the landmark.

Run from website/ sibling directory or the website/ root; it locates files by
the WEBSITE_DIR constant below (relative to this script's location).

Idempotent: re-running is safe — already-fixed pages are skipped.
"""

import os
import re
import glob
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WEBSITE_DIR = os.path.normpath(os.path.join(SCRIPT_DIR, ".."))

# ── helpers ──────────────────────────────────────────────────────────────────

def fix_review_stars(content):
    """Add role="img" to div.review-stars that carry aria-label (fix 1)."""
    OLD = 'class="review-stars" aria-label="'
    NEW = 'class="review-stars" role="img" aria-label="'
    if OLD in content and NEW not in content:
        return content.replace(OLD, NEW), True
    return content, False


def fix_main_landmark(content):
    """Wrap page sections in <main>…</main> when the landmark is absent (fix 2)."""
    if "<main>" in content or "<main\n" in content or "<main " in content:
        return content, False  # already has landmark

    if 'id="site-footer"' not in content:
        return content, False  # not a full-page template

    idx_section = content.find('<section id="main-content"')
    if idx_section < 0:
        return content, False  # no recognisable content anchor

    before = content[:idx_section]
    after  = content[idx_section:]

    # Find the last bare </div> in the "header zone" (between site-header and
    # the first content section).  This is a stray closing tag left over from
    # an earlier page structure; replacing it with <main> fixes the malformed
    # HTML at the same time.
    bare_div = re.compile(r'(?m)^</div>[ \t]*$')
    matches = list(bare_div.finditer(before))

    if matches:
        last = matches[-1]
        before = before[:last.start()] + "<main>" + before[last.end():]
    else:
        # No stray </div> — just prepend <main> before the section.
        before = before + "<main>\n\n"

    content = before + after

    # Insert </main> after the last </section> that precedes site-footer.
    footer_idx = content.find('<div id="site-footer"')
    if footer_idx < 0:
        return content, False

    last_sec_end = content.rfind("</section>", 0, footer_idx)
    if last_sec_end >= 0:
        insert_at = last_sec_end + len("</section>")
        content = content[:insert_at] + "\n\n</main>" + content[insert_at:]
    else:
        # Fallback: insert directly before site-footer div.
        content = content.replace(
            '\n<div id="site-footer"',
            '\n</main>\n\n<div id="site-footer"',
            1
        )

    return content, True


# ── main ─────────────────────────────────────────────────────────────────────

def process_file(filepath):
    with open(filepath, encoding="utf-8") as fh:
        original = fh.read()

    content = original
    changed = False

    content, c1 = fix_review_stars(content)
    changed = changed or c1

    content, c2 = fix_main_landmark(content)
    changed = changed or c2

    if changed:
        with open(filepath, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(content)
        fixes = []
        if c1: fixes.append("review-stars role=img")
        if c2: fixes.append("main landmark")
        print(f"  FIXED  {os.path.relpath(filepath, WEBSITE_DIR)}  [{', '.join(fixes)}]")
    return changed


def main():
    # Top-level .html pages only (skip admin/, blog/post.html — different templates)
    pattern = os.path.join(WEBSITE_DIR, "*.html")
    files   = sorted(glob.glob(pattern))

    # Also fix blog/post.html (single template, shares the same landmark gap)
    blog_post = os.path.join(WEBSITE_DIR, "blog", "post.html")
    if os.path.isfile(blog_post):
        files.append(blog_post)

    fixed = 0
    for filepath in files:
        if process_file(filepath):
            fixed += 1

    total = len(files)
    print(f"\nDone — {fixed} of {total} files modified.")


if __name__ == "__main__":
    main()
