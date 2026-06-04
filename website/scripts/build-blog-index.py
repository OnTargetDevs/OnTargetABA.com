"""Scan assets/blog/*.md, parse frontmatter, emit assets/blog/index.json.

Re-run any time new posts are added. The blog landing page fetches the
JSON to render its card grid; blog/post.html uses it for related-posts.
"""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
BLOG_DIR = ROOT / "assets" / "blog"
INDEX_PATH = BLOG_DIR / "index.json"

# Match common metadata keys at the top of each .md file
FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.S)
KV_RE = re.compile(r"^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$")

KEYS = ("title", "date", "category", "author", "hero_image",
        "excerpt", "read_time", "source_url")


def parse_frontmatter(text: str) -> dict[str, str]:
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}
    meta: dict[str, str] = {}
    for line in m.group(1).splitlines():
        kv = KV_RE.match(line.strip())
        if not kv:
            continue
        k, v = kv.group(1), kv.group(2).strip()
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        meta[k] = v
    return meta


def main() -> int:
    if not BLOG_DIR.exists():
        print("assets/blog does not exist; nothing to index")
        return 0

    posts: list[dict] = []
    skipped: list[str] = []
    for md in sorted(BLOG_DIR.glob("*.md")):
        try:
            text = md.read_text(encoding="utf-8", errors="ignore")
        except Exception as e:
            skipped.append(f"{md.name}: read failed ({e})")
            continue
        meta = parse_frontmatter(text)
        if not meta.get("title"):
            skipped.append(f"{md.name}: no title")
            continue
        entry = {k: meta.get(k, "") for k in KEYS}
        entry["slug"] = md.stem
        posts.append(entry)

    # Sort newest first by date (lexical sort works for YYYY-MM-DD)
    posts.sort(key=lambda p: p.get("date", ""), reverse=True)

    # Distinct categories (with counts) for the filter pills
    cat_counts: dict[str, int] = {}
    for p in posts:
        c = p.get("category") or ""
        if c:
            cat_counts[c] = cat_counts.get(c, 0) + 1
    categories = [
        {"name": name, "count": count}
        for name, count in sorted(cat_counts.items(), key=lambda kv: (-kv[1], kv[0]))
    ]

    index = {
        "generated_at": None,  # leave null so the file is reproducible
        "post_count": len(posts),
        "categories": categories,
        "posts": posts,
    }

    INDEX_PATH.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {INDEX_PATH.name} with {len(posts)} posts, {len(categories)} categories.")
    if skipped:
        print(f"Skipped {len(skipped)}:")
        for s in skipped[:10]:
            print("  -", s)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
