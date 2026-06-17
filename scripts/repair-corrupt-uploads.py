"""
Repair admin-uploaded images that were corrupted by the UTF-8 double-
encode bug in functions/api/images/upload.js (fixed in commit that
landed this script).

The bug: upload.js decoded the client base64 to a binary string, then
passed that string through ghPutFile which called b64encodeUtf8 on it.
TextEncoder.encode treats the string as a sequence of Unicode code
points and emits UTF-8 bytes — so every byte >= 0x80 in the binary
became two bytes (0xB4 -> 0xC2 0xB4). PNG/WebP/JPEG headers got
mangled, file sizes grew ~30-70%, and most viewers refused to render.

The corruption is fully reversible: the byte sequence is a UTF-8
encoding of a Latin-1 string of the original bytes. To undo it:

    original = corrupted.decode('utf-8').encode('latin-1')

This script walks assets/images/uploads/, detects corruption by
checking the RIFF/PNG/JPEG magic and a size mismatch in the declared
header, and writes the repaired bytes in place. It's idempotent — files
that are already correct are skipped.
"""
from __future__ import annotations
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent / "website" / "assets" / "images" / "uploads"


def looks_corrupted(data: bytes) -> tuple[bool, str]:
    """Return (corrupted?, reason) for a byte blob."""
    if len(data) < 16:
        return (False, "too short to judge")

    # WebP / WAV / AVI: RIFF header has the file size at offset 4-7 (LE,
    # excluding the 8-byte RIFF prefix). A mismatch with the actual size
    # is the unmistakable fingerprint of the bug.
    if data[:4] == b"RIFF":
        declared = struct.unpack("<I", data[4:8])[0]
        actual = len(data) - 8
        if declared != actual:
            return (True, f"RIFF size={declared} but file is {actual}")
        return (False, "RIFF size matches")

    # PNG: the first 8 bytes are the magic 89 50 4E 47 0D 0A 1A 0A. If
    # those bytes got UTF-8 expanded, byte 0x89 became 0xC2 0x89.
    if data[:2] == b"\xc2\x89" or (data[0] == 0xC2 and data[1] in {0x89, 0xC2}):
        return (True, "PNG magic appears UTF-8 mangled")

    # JPEG: starts with FF D8 FF. Same logic — FF -> C3 BF.
    if data[:2] == b"\xc3\xbf":
        return (True, "JPEG magic appears UTF-8 mangled")

    return (False, "unrecognized format or already valid")


def repair(data: bytes) -> bytes | None:
    """Reverse the UTF-8 round-trip. Returns None if the data isn't a
    valid UTF-8 encoding (which would mean it's not from this bug)."""
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        return None
    try:
        return text.encode("latin-1")
    except UnicodeEncodeError:
        return None


def main() -> int:
    if not ROOT.exists():
        print(f"!! uploads dir not found: {ROOT}", file=sys.stderr)
        return 1

    repaired = 0
    skipped = 0
    failed = 0
    examined = 0

    for f in sorted(ROOT.rglob("*")):
        if not f.is_file():
            continue
        if f.suffix.lower() not in {".webp", ".png", ".jpg", ".jpeg", ".gif", ".avif"}:
            continue
        examined += 1

        data = f.read_bytes()
        bad, reason = looks_corrupted(data)
        if not bad:
            print(f"  ok       {f.relative_to(ROOT)}  ({reason})")
            skipped += 1
            continue

        original = repair(data)
        if original is None:
            print(f"  FAIL     {f.relative_to(ROOT)}  ({reason}) — not a valid UTF-8 sequence")
            failed += 1
            continue

        f.write_bytes(original)
        new_size = len(original)
        print(
            f"  repaired {f.relative_to(ROOT)}  "
            f"{len(data)} -> {new_size} bytes  ({reason})"
        )
        repaired += 1

    print(
        f"\n==> repair: examined {examined}, "
        f"repaired {repaired}, ok {skipped}, failed {failed}"
    )
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
