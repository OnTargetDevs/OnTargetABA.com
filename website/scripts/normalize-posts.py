"""Normalize every blog post's YAML frontmatter to the canonical shape.

The admin dashboard, blog landing, and runtime post renderer all read the
same fields out of `assets/blog/*.md` frontmatter. Posts that came in via
scraping, hand-authored migration, or other sources sometimes have
slightly different shapes (missing fields, inconsistent date formats,
unquoted commas, etc.). This script:

  1. Walks every .md file under `website/assets/blog/`.
  2. Parses the frontmatter.
  3. Fills in any missing required field with a sensible default
     (slug derived from filename, today's date if missing, etc.).
  4. Re-serializes the frontmatter in a stable key order so future
     diffs are minimal.
  5. Leaves the body untouched.

Idempotent — safe to re-run any time.

Usage:
    python scripts/normalize-posts.py              # report + write changes
    python scripts/normalize-posts.py --dry-run    # report only

Run from inside `website/` (so paths line up with build.sh's working dir):
    cd website && python scripts/normalize-posts.py
"""
from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
from pathlib import Path

BLOG_DIR = Path("assets/blog")

# Canonical field order. Missing fields get added with the default below.
# Extra fields the script doesn't know about are preserved at the end so we
# never lose data.
FIELDS = [
    ("title",       lambda slug, _meta: slug.replace("-", " ").title()),
    ("date",        lambda _slug, _meta: dt.date.today().isoformat()),
    ("category",    lambda _slug, _meta: "Resources"),
    ("author",      lambda _slug, _meta: "On Target ABA"),
    ("hero_image",  lambda _slug, _meta: ""),
    ("excerpt",     lambda _slug, _meta: ""),
    ("read_time",   lambda _slug, meta: _estimate_read_time(meta.get("_body", ""))),
    ("source_url",  lambda _slug, _meta: ""),
    ("draft",       lambda _slug, _meta: "false"),
    ("hidden",      lambda _slug, _meta: "false"),
]

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n?", re.DOTALL)
KV_RE = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$")


def _estimate_read_time(body: str) -> str:
    words = len(re.findall(r"\S+", body))
    minutes = max(1, round(words / 220))
    return f"{minutes} min read"


def parse_md(text: str) -> tuple[dict[str, str], str]:
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}, text
    meta: dict[str, str] = {}
    for line in m.group(1).splitlines():
        if not line.strip():
            continue
        kv = KV_RE.match(line.strip())
        if not kv:
            continue
        val = kv.group(2).strip()
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        meta[kv.group(1)] = val
    return meta, text[m.end():]


def yaml_quote(value: str) -> str:
    s = str(value)
    if s == "":
        return '""'
    if any(c in s for c in ':#"\n') or s != s.strip():
        return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'
    return s


def serialize(meta: dict[str, str], body: str) -> str:
    known_keys = [k for k, _ in FIELDS]
    extra_keys = [k for k in meta if k not in known_keys]
    lines = ["---"]
    for k, _ in FIELDS:
        if k in meta:
            lines.append(f"{k}: {yaml_quote(meta[k])}")
    for k in extra_keys:
        lines.append(f"{k}: {yaml_quote(meta[k])}")
    lines.append("---")
    return "\n".join(lines) + "\n" + body.lstrip("\n")


def normalize_one(path: Path) -> tuple[bool, list[str]]:
    slug = path.stem
    raw = path.read_text(encoding="utf-8")
    meta, body = parse_md(raw)
    notes: list[str] = []
    # Carry the body for read_time estimation only — strip before serializing.
    meta_with_body = dict(meta, _body=body)
    for key, default_fn in FIELDS:
        if key not in meta or meta[key] == "":
            meta[key] = default_fn(slug, meta_with_body)
            notes.append(f"+ {key}={meta[key][:50]!r}")
    new_text = serialize(meta, body)
    changed = new_text != raw
    return changed, notes


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="report changes but don't write")
    args = parser.parse_args()

    if not BLOG_DIR.exists():
        print(f"error: {BLOG_DIR} not found — run from website/", file=sys.stderr)
        return 2

    posts = sorted(BLOG_DIR.glob("*.md"))
    print(f"Scanning {len(posts)} posts...")
    total_changed = 0
    for p in posts:
        changed, notes = normalize_one(p)
        if changed:
            total_changed += 1
            print(f"  {'(dry) ' if args.dry_run else ''}{p.name}")
            for n in notes:
                print(f"      {n}")
            if not args.dry_run:
                # Re-derive new content after the normalize and write.
                raw = p.read_text(encoding="utf-8")
                meta, body = parse_md(raw)
                meta_with_body = dict(meta, _body=body)
                for key, default_fn in FIELDS:
                    if key not in meta or meta[key] == "":
                        meta[key] = default_fn(p.stem, meta_with_body)
                p.write_text(serialize(meta, body), encoding="utf-8")

    print()
    print(f"Done. {total_changed}/{len(posts)} posts needed changes.")
    if total_changed and not args.dry_run:
        print("Re-run scripts/build-blog-index.py to refresh assets/blog/index.json.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
