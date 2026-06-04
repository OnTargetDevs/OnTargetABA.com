"""Replace placeholder forms with real Jotform embeds.

Live form IDs (from the legacy WordPress site):
  213614603878157 -> pre-intake-form.html
  210615141890045 -> contact.html
  260534406459156 -> autism-testing.html (autism evaluation scheduler)

The Jotform `jsform` script self-replaces with an iframe at runtime.
We wrap it in a styled container so it sits cleanly in the design.
Idempotent: re-running detects an existing embed and leaves it alone.
"""
from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent

JOTFORM_TPL = '''<div class="relative bg-white ring-1 ring-line rounded-[32px] p-4 sm:p-6 lg:p-8 shadow-soft overflow-hidden" data-jotform-wrap>
        <script type="text/javascript" src="https://form.jotform.com/jsform/{fid}"></script>
        <noscript>
          <div class="text-center py-10">
            <p class="text-ink-soft mb-4">Our form needs JavaScript to load.</p>
            <a href="https://form.jotform.com/{fid}" target="_blank" rel="noopener" class="btn btn-coral">Open the form &rarr;</a>
          </div>
        </noscript>
      </div>'''


def write_utf8_bom(path: Path, text: str) -> None:
    bom = b"\xef\xbb\xbf"
    path.write_bytes(bom + text.encode("utf-8"))


def read_html(path: Path) -> str:
    raw = path.read_bytes()
    if raw[:3] == b"\xef\xbb\xbf":
        raw = raw[3:]
    return raw.decode("utf-8")


def swap_form(text: str, fid: str) -> tuple[str, bool]:
    """Replace the first <form action='#'...>...</form> block with the Jotform embed."""
    if f"form.jotform.com/jsform/{fid}" in text:
        return text, False  # already embedded
    # Match the placeholder form: a <form action="#" ...>...</form> block.
    # The inner content can include any tags but no nested <form> (HTML disallows it).
    pattern = re.compile(
        r'<form\s+action="#"[^>]*>[\s\S]*?</form>',
        re.MULTILINE,
    )
    new_text, n = pattern.subn(JOTFORM_TPL.format(fid=fid), text, count=1)
    return new_text, n > 0


def insert_eval_form(text: str, fid: str) -> tuple[str, bool]:
    """Insert a new 'Schedule your evaluation' section into autism-testing.html.

    Anchor: the section comment for the final CTA (or the testimonials marquee).
    Idempotent: bail if the form id is already on the page.
    """
    if f"form.jotform.com/jsform/{fid}" in text:
        return text, False

    section = (
        "<!-- ============ EVAL SCHEDULER FORM ============ -->\n"
        '<section class="py-20 lg:py-24 bg-white border-y border-line">\n'
        '  <div class="max-w-4xl mx-auto px-5">\n'
        '    <div class="text-center mb-10">\n'
        '      <div class="reveal eyebrow inline-flex"><span class="dot"></span> Schedule your evaluation</div>\n'
        '      <h2 class="reveal reveal-delay-1 mt-4 font-display text-4xl sm:text-5xl font-700 tracking-tight">Start here. We&rsquo;ll handle the rest.</h2>\n'
        '      <p class="reveal reveal-delay-2 mt-4 text-ink-soft text-lg max-w-2xl mx-auto">Takes less than 30 seconds. Most families pay $0 through insurance.</p>\n'
        '    </div>\n'
        '    <div class="reveal reveal-delay-3">\n'
        '      ' + JOTFORM_TPL.format(fid=fid) + '\n'
        '    </div>\n'
        '  </div>\n'
        '</section>\n\n'
    )

    # Insert before the testimonials marquee (so the form lives between
    # warning-signs/process content and social proof). Anchor on the
    # comment that introduces the marquee or the parents-saying section.
    anchors = [
        '<!-- ============ TESTIMONIALS ============ -->',
        '<!-- ============ FINAL CTA ============ -->',
        '<!-- ============ FOOTER ============ -->',
    ]
    for anchor in anchors:
        if anchor in text:
            new_text = text.replace(anchor, section + anchor, 1)
            return new_text, True
    # Fallback: insert before the closing </body>
    new_text = text.replace("</body>", section + "</body>", 1)
    return new_text, "</body>" in text


def main() -> int:
    targets = [
        ("pre-intake-form.html", "213614603878157", swap_form),
        ("contact.html",         "210615141890045", swap_form),
        ("autism-testing.html",  "260534406459156", insert_eval_form),
    ]
    for filename, fid, fn in targets:
        path = ROOT / filename
        if not path.exists():
            print(f"  ! {filename} not found, skipping")
            continue
        text = read_html(path)
        new_text, changed = fn(text, fid)
        if changed:
            write_utf8_bom(path, new_text)
            print(f"  + {filename}: embedded Jotform {fid}")
        else:
            print(f"    {filename}: Jotform {fid} already in place (no change)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
