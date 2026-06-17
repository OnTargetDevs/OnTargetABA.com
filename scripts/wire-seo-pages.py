"""
Bulk-wire the 21 new SEO landing pages from wf wl8nrre13 into:
- website/scripts/inject-seo.py SEO_PAGES
- website/assets/data/header.json breadcrumbs + activeSectionMap
- website/scripts/build-sitemap.py STATIC_PAGES

Idempotent-ish: re-running adds the entries again, so only run once.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent / "website"

# (slug, title, desc, crumb_chain [(label, slug_or_None), ...], sitemap_priority, primary_type, active_section)
NEW = [
    # CITY landings
    ("salt-lake-city",
     "ABA Therapy in Salt Lake City — On Target ABA",
     "ABA therapy and autism testing serving Salt Lake City, Sandy, West Jordan, South Jordan, Draper, and the Salt Lake Valley. Family-focused care from our Murray clinic.",
     [("Home", "index.html"), ("Locations", "locations.html"), ("Salt Lake City", None)],
     "0.85", "WebPage", "Locations"),
    ("cleveland",
     "ABA Therapy in Cleveland — On Target ABA",
     "ABA therapy and autism testing serving Greater Cleveland: Beachwood, Cleveland Heights, Pepper Pike, Lyndhurst, and more from our Mayfield Village clinic.",
     [("Home", "index.html"), ("Locations", "locations.html"), ("Cleveland", None)],
     "0.85", "WebPage", "Locations"),
    ("columbus",
     "ABA Therapy in Columbus, Ohio — On Target ABA",
     "ABA therapy and autism testing in Columbus, with two metro clinics (Gahanna + Worthington) serving Westerville, Bexley, Dublin, Upper Arlington, and beyond.",
     [("Home", "index.html"), ("Locations", "locations.html"), ("Columbus", None)],
     "0.85", "WebPage", "Locations"),
    # INSURANCE pages
    ("insurance-aetna",
     "Does Aetna Cover ABA Therapy? Yes — On Target ABA",
     "Aetna covers ABA therapy for autism in Utah and Ohio. What is covered, prior auth, co-pay expectations, and how we verify your benefits for free.",
     [("Home", "index.html"), ("Insurance", "insurance.html"), ("Aetna", None)],
     "0.75", "WebPage", "Insurance"),
    ("insurance-anthem",
     "Anthem Blue Cross Coverage for ABA Therapy — On Target ABA",
     "Anthem Blue Cross Blue Shield covers ABA therapy in Utah and Ohio. Prior auth, diagnosis codes, and how we handle the paperwork for you.",
     [("Home", "index.html"), ("Insurance", "insurance.html"), ("Anthem", None)],
     "0.75", "WebPage", "Insurance"),
    ("insurance-united-healthcare",
     "UnitedHealthcare ABA Therapy Coverage — On Target ABA",
     "UnitedHealthcare and Optum cover ABA therapy for autism. What plans accept ABA, how to verify benefits, and what to expect for co-pay.",
     [("Home", "index.html"), ("Insurance", "insurance.html"), ("UnitedHealthcare", None)],
     "0.75", "WebPage", "Insurance"),
    ("insurance-medicaid-utah",
     "Utah Medicaid ABA Therapy: How to Qualify and Get Started — On Target ABA",
     "Utah Medicaid and CHIP cover ABA therapy for children under 21 with an autism diagnosis. How to qualify, get evaluated, and start services.",
     [("Home", "index.html"), ("Insurance", "insurance.html"), ("Utah Medicaid", None)],
     "0.8", "WebPage", "Insurance"),
    ("insurance-medicaid-ohio",
     "Ohio Medicaid ABA Therapy Coverage — On Target ABA",
     "Ohio Medicaid covers ABA therapy via the Autism Spectrum Disorder benefit. MyCare Ohio plans, MCO options, qualifying, and starting services.",
     [("Home", "index.html"), ("Insurance", "insurance.html"), ("Ohio Medicaid", None)],
     "0.8", "WebPage", "Insurance"),
    # PROGRAM
    ("autism-scholarship-program-ohio",
     "Ohio Autism Scholarship Program: Funding ABA Therapy — On Target ABA",
     "The Ohio Autism Scholarship Program provides up to $32,455/year per child for autism services including ABA. Eligibility, applying, and using it at On Target.",
     [("Home", "index.html"), ("Insurance", "insurance.html"), ("Ohio Autism Scholarship", None)],
     "0.7", "WebPage", "Insurance"),
    # TIER 2 INFORMATIONAL
    ("signs-of-autism-in-toddlers",
     "Early Signs of Autism in Toddlers: A Parent Guide — On Target ABA",
     "Real red flags of autism by age (12mo, 18mo, 24mo, 36mo): joint attention, name response, language, sensory differences. What to do next.",
     [("Home", "index.html"), ("Resources", None), ("Signs of Autism in Toddlers", None)],
     "0.7", "Article", ""),
    ("signs-of-autism-in-girls",
     "Signs of Autism in Girls: The Often-Missed Diagnosis — On Target ABA",
     "Girls present autism differently than boys: masking, social mimicry, intense interests. Why girls are often diagnosed late and what to watch for.",
     [("Home", "index.html"), ("Resources", None), ("Signs of Autism in Girls", None)],
     "0.7", "Article", ""),
    ("late-autism-diagnosis",
     "Adult and Late Autism Diagnosis: What to Know — On Target ABA",
     "Autism diagnosis in adolescents and adults: what it looks like, the evaluation process, and what comes next after a late diagnosis.",
     [("Home", "index.html"), ("Resources", None), ("Late Autism Diagnosis", None)],
     "0.65", "Article", ""),
    ("aba-vs-speech-therapy",
     "ABA vs Speech Therapy: Which Does My Child Need? — On Target ABA",
     "What ABA and speech therapy each address, when both help, and how we coordinate. A clear comparison for parents choosing services.",
     [("Home", "index.html"), ("Resources", None), ("ABA vs Speech Therapy", None)],
     "0.7", "Article", ""),
    ("aba-vs-occupational-therapy",
     "ABA vs Occupational Therapy: How They Work Together — On Target ABA",
     "ABA addresses behavior and communication; OT covers sensory, motor, and daily living. Most kids benefit from both. How we coordinate.",
     [("Home", "index.html"), ("Resources", None), ("ABA vs Occupational Therapy", None)],
     "0.7", "Article", ""),
    ("cost-of-autism-evaluation",
     "How Much Does an Autism Evaluation Cost? — On Target ABA",
     "Most families pay $0 through insurance. Without insurance, typical costs run $2,000-$4,000. Our process: free benefits check, no waitlist.",
     [("Home", "index.html"), ("Resources", None), ("Cost of Autism Evaluation", None)],
     "0.7", "Article", ""),
    ("how-long-does-aba-therapy-take",
     "How Long Does ABA Therapy Take? Hours, Months and Milestones — On Target ABA",
     "Comprehensive vs focused ABA, weekly hours (10-40), typical duration (1-3 years), and how progress is measured. A clear timeline for parents.",
     [("Home", "index.html"), ("Resources", None), ("How Long Does ABA Take", None)],
     "0.7", "Article", ""),
    # TIER 3 AGE-SPECIFIC
    ("aba-for-toddlers",
     "ABA Therapy for Toddlers (Ages 0-3): Early Intervention — On Target ABA",
     "Why early intervention matters, what 0-3 ABA looks like (play-based), and what parents see in the first 3-6 months.",
     [("Home", "index.html"), ("Services", "our-services.html"), ("ABA for Toddlers", None)],
     "0.8", "Service", "Services"),
    ("aba-for-preschoolers",
     "ABA Therapy for Preschoolers (Ages 3-5) — On Target ABA",
     "Kindergarten readiness, social skills with peers, language development, and behavior support for preschool-age children with autism.",
     [("Home", "index.html"), ("Services", "our-services.html"), ("ABA for Preschoolers", None)],
     "0.8", "Service", "Services"),
    ("aba-for-school-age",
     "ABA Therapy for School-Age Children (Ages 6-12) — On Target ABA",
     "After-school and summer ABA programs for school-age kids. Homework support, peer skills, IEP coordination with teachers, and behavior management.",
     [("Home", "index.html"), ("Services", "our-services.html"), ("ABA for School-Age", None)],
     "0.8", "Service", "Services"),
    ("aba-for-teenagers",
     "ABA Therapy for Teenagers and Adolescents — On Target ABA",
     "ABA is not just for little kids. Independence, executive functioning, social communication, and transition skills for teens with autism.",
     [("Home", "index.html"), ("Services", "our-services.html"), ("ABA for Teenagers", None)],
     "0.75", "Service", "Services"),
    ("aba-for-nonverbal-children",
     "ABA Therapy for Nonspeaking Children: Communication Pathways That Work — On Target ABA",
     "AAC devices, PECS, sign language, verbal behavior. We expand whatever communication path works for your nonspeaking child.",
     [("Home", "index.html"), ("Services", "our-services.html"), ("ABA for Nonspeaking Children", None)],
     "0.75", "Service", "Services"),
]


def crumb_repr(chain):
    parts = []
    for label, target in chain:
        if target is None:
            parts.append(f'("{label}", None)')
        else:
            parts.append(f'("{label}", "{target}")')
    return "[" + ", ".join(parts) + "]"


# -------- inject-seo.py --------
inject_path = ROOT / "scripts" / "inject-seo.py"
text = inject_path.read_text(encoding="utf-8")
m = re.search(r"^SEO_PAGES\s*=\s*\{", text, re.MULTILINE)
if not m:
    raise SystemExit("SEO_PAGES not found")
i = m.end()
depth = 1
while i < len(text) and depth > 0:
    if text[i] == "{":
        depth += 1
    elif text[i] == "}":
        depth -= 1
    i += 1
close_pos = i - 1

new_lines = []
for slug, title, desc, crumbs, prio, ptype, active in NEW:
    key = f'{slug}.html'
    if f'"{key}":' in text:
        # Skip if already present
        continue
    new_lines.append(f'    "{key}": {{')
    new_lines.append(f'        "title": {title!r},')
    new_lines.append(f'        "desc": {desc!r},')
    new_lines.append('        "keywords": "",')
    new_lines.append(f'        "crumbs": {crumb_repr(crumbs)},')
    new_lines.append(f'        "primary_type": "{ptype}",')
    new_lines.append('    },')

if new_lines:
    addition = "\n".join(new_lines) + "\n"
    text = text[:close_pos] + addition + text[close_pos:]
    inject_path.write_text(text, encoding="utf-8")
    print(f"inject-seo.py: added {len(new_lines)//6} SEO_PAGES entries")
else:
    print("inject-seo.py: all entries already present")

# -------- header.json --------
header_path = ROOT / "assets" / "data" / "header.json"
header = json.load(open(header_path, encoding="utf-8"))
b = header["breadcrumbs"]
asm = header["activeSectionMap"]
added_b = 0
added_a = 0
for slug, title, desc, crumbs, prio, ptype, active in NEW:
    chain = []
    for label, target in crumbs:
        if target is None:
            chain.append([label, None])
        else:
            if target == "index.html":
                chain.append([label, "/"])
            else:
                chain.append([label, "/" + target.replace(".html", "")])
    key = f"/{slug}"
    if key not in b:
        b[key] = chain
        added_b += 1
    if active and key not in asm:
        asm[key] = active
        added_a += 1
json.dump(header, open(header_path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
open(header_path, "a", encoding="utf-8").write("\n")
print(f"header.json: +{added_b} breadcrumbs, +{added_a} active-section entries")

# -------- build-sitemap.py --------
sitemap_path = ROOT / "scripts" / "build-sitemap.py"
stext = sitemap_path.read_text(encoding="utf-8")
m2 = re.search(r"^STATIC_PAGES\s*=\s*\[", stext, re.MULTILINE)
if not m2:
    raise SystemExit("STATIC_PAGES not found")
i = m2.end()
depth = 1
while i < len(stext) and depth > 0:
    if stext[i] == "[":
        depth += 1
    elif stext[i] == "]":
        depth -= 1
    i += 1
close_pos2 = i - 1

new_lines2 = []
for slug, _t, _d, _c, prio, _p, _a in NEW:
    needle = f'("/{slug}",'
    if needle in stext:
        continue
    new_lines2.append(f'    ("/{slug}", "{prio}", "monthly"),')

if new_lines2:
    addition2 = "\n".join(new_lines2) + "\n"
    stext = stext[:close_pos2] + addition2 + stext[close_pos2:]
    sitemap_path.write_text(stext, encoding="utf-8")
    print(f"build-sitemap.py: added {len(new_lines2)} STATIC_PAGES entries")
else:
    print("build-sitemap.py: all entries already present")
