"""
Make the meet-the-team draft publish-ready:

1. Remove noindex meta + DRAFT comment.
2. Strip the 2 unnamed [NAME NEEDED] cards (Airport SA / EL) so the
   public page only shows named people.
3. Replace remaining [PLACEHOLDER bio: ...] strings with a polite
   "Full bio coming soon." line so the published page doesn't show
   literal placeholder syntax.
"""
from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent / "website"
TEAM = ROOT / "meet-the-team.html"

text = TEAM.read_text(encoding="utf-8")

# 1. Drop the noindex meta.
text = re.sub(
    r'<meta name="robots" content="noindex, nofollow"\s*/?>\s*\n?',
    "",
    text,
    count=1,
)

# 2. Drop the <!-- DRAFT --> comment block at top of body.
text = re.sub(
    r'<!--\s*DRAFT:[^>]*-->\s*\n?',
    "",
    text,
    count=1,
)

# 3. Remove the two unnamed Airport SA + EL placeholder cards entirely.
# Each <article> with class "...lift bg-white rounded-3xl..." that contains
# [NAME NEEDED] gets stripped. Use a non-greedy match anchored on the
# article start + the [NAME NEEDED] sentinel + the closing </article>.
pattern = re.compile(
    r'\s*<article\s+class="reveal[^"]*lift bg-white[^"]*">\s*'
    r'<div class="flex items-start gap-4">.*?'
    r'\[NAME NEEDED\].*?'
    r'</article>\s*',
    re.DOTALL,
)
text, n_removed = pattern.subn("", text)

# 4. Replace any remaining [PLACEHOLDER bio: ...] strings with a polite
# "Full bio coming soon." pull-line. The placeholder structure is
# always like "[PLACEHOLDER bio: ...]" wrapped in a single paragraph.
text, n_polished = re.subn(
    r'\[PLACEHOLDER bio[^\]]*\]',
    "Full bio coming soon.",
    text,
)

# 5. Also catch the freestanding "[PLACEHOLDER bio]" markers without details.
text, n_simple = re.subn(
    r'\[PLACEHOLDER\b[^\]]*\]',
    "Full bio coming soon.",
    text,
)

TEAM.write_text(text, encoding="utf-8")
print(f"removed {n_removed} unnamed-placeholder cards")
print(f"polished {n_polished + n_simple} placeholder bio strings")
