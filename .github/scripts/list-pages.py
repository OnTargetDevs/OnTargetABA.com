#!/usr/bin/env python3
"""Generate page URL list for Lighthouse CI audits.

Scans website/ for *.html (excluding non-pages) and also generates /blog/<slug>
URLs from website/assets/blog/*.md (client-side-rendered posts). Outputs
newline-separated URLs for a given base URL. Supports sharding for parallel
matrix jobs.

Usage:
    # All pages for production
    python3 list-pages.py --base-url https://beta.ontargetaba.com

    # Shard 2 of 12 for a matrix job
    python3 list-pages.py --base-url https://... --shard 2 --total 12

    # Map changed files (from git diff) to URL paths
    python3 list-pages.py --changed-files /tmp/changed.txt --base-url https://...

    # Just print the count
    python3 list-pages.py --count
"""
import argparse, pathlib, sys

EXCLUDE_NAMES = {"404.html", "test.html", "landing.html"}
EXCLUDE_TOP_DIRS = {"admin", "functions", "assets", "node_modules"}
EXCLUDE_PATHS = {"blog/post.html"}


def collect_blog_posts(website: pathlib.Path) -> list[str]:
    """Return sorted /blog/<slug> URL paths from website/assets/blog/*.md."""
    blog_dir = website / "assets" / "blog"
    if not blog_dir.is_dir():
        return []
    return sorted(
        "/blog/" + md.stem
        for md in blog_dir.glob("*.md")
    )


def collect_pages(website: pathlib.Path) -> list[str]:
    """Return sorted URL paths for all auditable pages under website/."""
    paths: set[str] = set()
    for html in website.rglob("*.html"):
        rel = html.relative_to(website)
        parts = rel.parts
        if parts[0] in EXCLUDE_TOP_DIRS:
            continue
        if html.name in EXCLUDE_NAMES:
            continue
        rel_posix = "/".join(parts)
        if rel_posix in EXCLUDE_PATHS:
            continue
        if html.name == "index.html":
            if len(parts) == 1:
                paths.add("/")
            elif len(parts) == 2:
                paths.add("/" + parts[0])
            # Deeper nested index.html (e.g. functions/) already excluded above
        elif len(parts) == 1:
            paths.add("/" + html.stem)
        # Pages more than 1 level deep with non-index names are sub-templates; skip
    html_pages = sorted(paths, key=lambda p: ("" if p == "/" else p.lstrip("/")))
    blog_pages = collect_blog_posts(website)
    return html_pages + blog_pages


def changed_to_paths(changed_files_path: pathlib.Path, base: str) -> list[str]:
    """Read a newline-separated file of changed git paths and return URLs."""
    lines = changed_files_path.read_text().splitlines()
    urls: list[str] = []
    seen: set[str] = set()
    for line in lines:
        line = line.strip()
        if not line.startswith("website/") or not line.endswith(".html"):
            continue
        rel = line[len("website/"):]
        parts = pathlib.PurePosixPath(rel).parts
        if not parts or parts[0] in EXCLUDE_TOP_DIRS:
            continue
        if pathlib.PurePosixPath(rel).name in EXCLUDE_NAMES:
            continue
        if rel in EXCLUDE_PATHS:
            continue
        if pathlib.PurePosixPath(rel).name == "index.html":
            path = ("/" + parts[0]) if len(parts) == 2 else "/"
        elif len(parts) == 1:
            path = "/" + pathlib.PurePosixPath(rel).stem
        else:
            continue  # Nested non-index page; skip
        if path not in seen:
            seen.add(path)
            urls.append(base + path)
    return urls


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default="https://beta.ontargetaba.com")
    ap.add_argument("--website-dir", default="website")
    ap.add_argument("--shard", type=int, default=None, help="0-indexed shard")
    ap.add_argument("--total", type=int, default=6, help="Total shards")
    ap.add_argument("--count", action="store_true", help="Print page count and exit")
    ap.add_argument("--changed-files", default=None,
                    help="File of git-diff paths; maps HTML files to URL paths")
    args = ap.parse_args()

    base = args.base_url.rstrip("/")

    if args.changed_files:
        cf = pathlib.Path(args.changed_files)
        if not cf.exists():
            sys.exit(0)  # No changed files file → nothing to print
        for url in changed_to_paths(cf, base):
            print(url)
        return

    website = pathlib.Path(args.website_dir)
    if not website.exists():
        print(f"::error::website dir not found: {website.resolve()}", file=sys.stderr)
        sys.exit(1)

    pages = collect_pages(website)

    if args.count:
        print(len(pages))
        return

    if args.shard is not None:
        pages = [p for i, p in enumerate(pages) if i % args.total == args.shard]

    for p in pages:
        print(base + p)


if __name__ == "__main__":
    main()
