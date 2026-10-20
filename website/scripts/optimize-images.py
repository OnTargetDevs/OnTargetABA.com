"""
Image optimization sweep. Idempotent.

Converts a small manifest of heavy PNG photos to WebP (same pixel
dimensions, so nothing about how the page looks changes — only the byte
weight on the wire) and rewrites every HTML reference from the .png to the
.webp filename.

The hero photo is the home page's LCP element on mobile; a 372x399 photo
stored as a 374 KB RGBA PNG is ~10x larger than the equivalent WebP. The
WebP is committed to the repo; the original PNG is removed from the deploy
(git history keeps it). Re-running is a no-op once the WebP exists and the
references are already rewritten.

Wired into build.sh before optimize-pages.py.
"""
from __future__ import annotations
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # Pillow not present in some minimal build envs
    Image = None

ROOT = Path(__file__).parent.parent

# (source png, webp quality). Output is the same stem with .webp.
MANIFEST = [
    ("assets/images/jessica-rockowitz-jbiInQGY8og-unsplash.png", 82),
]


def convert(rel_png: str, quality: int) -> tuple[str, str] | None:
    """Return (png_name, webp_name) for reference rewriting. Generates the
    WebP if the PNG is present and the WebP is missing."""
    png = ROOT / rel_png
    webp = png.with_suffix(".webp")
    png_name = png.name
    webp_name = webp.name
    if webp.exists():
        return (png_name, webp_name)
    if not png.exists() or Image is None:
        # WebP already committed (png removed) or no Pillow: skip convert,
        # still return the rename pair so references stay consistent.
        return (png_name, webp_name) if webp.exists() else None
    im = Image.open(png)
    # Flatten to RGB when the alpha channel is fully opaque (smaller file).
    if im.mode == "RGBA":
        alpha = im.getchannel("A")
        if alpha.getextrema()[0] == 255:
            im = im.convert("RGB")
    im.save(webp, "WEBP", quality=quality, method=6)
    print(f"  converted {rel_png} -> {webp.name} "
          f"({png.stat().st_size // 1024} KB -> {webp.stat().st_size // 1024} KB)")
    return (png_name, webp_name)


def rewrite_refs(renames: list[tuple[str, str]]) -> int:
    pages = list(ROOT.glob("*.html")) + list((ROOT / "blog").glob("*.html"))
    touched = 0
    for p in pages:
        text = p.read_text(encoding="utf-8")
        new = text
        for png_name, webp_name in renames:
            new = new.replace(png_name, webp_name)
        if new != text:
            p.write_text(new, encoding="utf-8")
            touched += 1
            print(f"  rewrote refs in {p.relative_to(ROOT)}")
    return touched


def main() -> int:
    renames = []
    for rel_png, q in MANIFEST:
        pair = convert(rel_png, q)
        if pair:
            renames.append(pair)
    touched = rewrite_refs(renames)
    print(f"==> optimize-images: {len(renames)} image(s), rewrote {touched} page(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
