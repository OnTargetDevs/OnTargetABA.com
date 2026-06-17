# 22 New SEO Landing Pages — Build Report

## Stats
- Pages requested: 21
- Pages written: 21
- Verifier passes: 20
- Verifier fails: 1

## Pages (status — file — title)

✅ written — `website/salt-lake-city.html` — ABA Therapy in Salt Lake City — On Target ABA
✅ written — `website/cleveland.html` — ABA Therapy in Cleveland — On Target ABA · Serving Greater Cleveland
✅ written — `website/columbus.html` — ABA Therapy in Columbus, Ohio — On Target ABA · Two Metro Clinics
✅ written — `website/insurance-aetna.html` — Does Aetna Cover ABA Therapy? Yes — Here's What to Expect | On Target ABA
✅ written — `website/insurance-anthem.html` — Anthem Blue Cross Coverage for ABA Therapy — On Target ABA
✅ written — `website/insurance-united-healthcare.html` — UnitedHealthcare ABA Therapy Coverage &mdash; On Target ABA
✅ written — `website/insurance-medicaid-utah.html` — Utah Medicaid ABA Therapy: How to Qualify & Get Started | On Target ABA
✅ written — `website/insurance-medicaid-ohio.html` — Ohio Medicaid ABA Therapy Coverage &mdash; On Target ABA
✅ written — `website/autism-scholarship-program-ohio.html` — Ohio Autism Scholarship Program: Funding ABA Therapy for Your Child | On Target ABA
✅ written — `website/signs-of-autism-in-toddlers.html` — Early Signs of Autism in Toddlers: A Parent's Guide &mdash; On Target ABA
❌ written — `website/signs-of-autism-in-girls.html` — Signs of Autism in Girls: The Often-Missed Diagnosis — On Target ABA
✅ written — `website/late-autism-diagnosis.html` — Adult &amp; Late Autism Diagnosis &mdash; What to Know | On Target ABA
✅ written — `website/aba-vs-speech-therapy.html` — ABA vs Speech Therapy: Which Does My Child Need? — On Target ABA
✅ written — `website/aba-vs-occupational-therapy.html` — ABA vs Occupational Therapy: How They Work Together &mdash; On Target ABA
✅ written — `website/cost-of-autism-evaluation.html` — How Much Does an Autism Evaluation Cost? | On Target ABA
✅ written — `website/how-long-does-aba-therapy-take.html` — How Long Does ABA Therapy Take? Hours, Months & Milestones | On Target ABA
✅ written — `website/aba-for-toddlers.html` — ABA Therapy for Toddlers (Ages 0–3) — Early Intervention That Works | On Target ABA
✅ written — `website/aba-for-preschoolers.html` — ABA Therapy for Preschoolers (Ages 3–5) — On Target ABA
✅ written — `website/aba-for-school-age.html` — ABA Therapy for School-Age Children (Ages 6–12) | On Target ABA
✅ written — `website/aba-for-teenagers.html` — ABA Therapy for Teenagers and Adolescents — On Target ABA
✅ written — `website/aba-for-nonverbal-children.html` — ABA Therapy for Nonspeaking Children — Communication Pathways That Work | On Target ABA

## Verifier failures (need follow-up)

### website/signs-of-autism-in-girls.html
CRITICAL ISSUES FOUND:

1. **FABRICATED STATISTICS** (FAIL - Critical Issue)
   - Line 141-142: "4x Boys diagnosed for every 1 girl" — This is a commonly cited ratio but lacks a proper citation in the document
   - Line 145-146: "6+ yrs Average diagnostic delay for girls" — No source cited for this claim
   - These statistics appear in hero section stats cards but lack attribution to peer-reviewed studies or authoritative sources
   - ACTION NEEDED: Add inline citations to published research or remove these claims

2. **TESTIMONIAL CONCERNS** (FAIL - Critical Issue)
   - Line 411: "Andreana Tadaj" — Name is present but the quote needs verification against CLAUDE.md approved list
   - CLAUDE.md line 235 lists real testimonials: "S. R., A. D., C. S., D. M., Carmen E., Jack M., **Andreana Tadaj**, Ruchie Kaplan, Zi Zi World Tarpeh"
   - The quote attributed to Andreana Tadaj on line 411 ("This is a phenomenal ABA center...") should be verified as the actual quote from the real person
   - Line 413 lists "A. D." — This is an acceptable abbreviated form from the approved list
   - ACTION NEEDED: Verify that the Andreana Tadaj quote exactly matches the real review

3. **PHONE NUMBER REGION MISMATCH** (FAIL - Minor Issue)
   - Page topic: "Signs of Autism in Girls" — This is a general guide, not location-specific
   - Primary phone (888) 989-5011 is correct for general inquiries (CLAUDE.md line 21)
   - However, the page lacks location context, so the phone number is appropriate
   - NOTE: This is acceptable since it's a general resource page

4. **POTENTIAL MEDICAL CLAIMS** (PASS with caution)
   - The page avoids making direct medical diagnoses but discusses diagnostic signs
   - Language like "Signs," "What to look for," and "evaluation is worth doing" frames content appropriately
   - No fabricated medical claims detected

ITEMS THAT PASS:

✓ Valid HTML — All tags properly closed, no orphan elements, DOCTYPE present
✓ Complete <head> — Has title, description, Tailwind script, app.css link, auto-seo markers, auto-perf markers, font preloads (lines 31-33)
✓ <div id="site-header"></div> present (line 89)
✓ <div id="site-footer"></div> present (line 527)
✓ Required script tags at bottom with defer (lines 529-531)
✓ Hero section present with h1 (line 113), subhead (line 124), CTAs (lines 129-137)
✓ Multiple body sections (6 major sections: Why Girls Get Missed, Real Signs, Bias in Evaluation, Age-by-Age, What To Do Now, plus FAQ)
✓ FAQ section present with 5 Q&A pairs (lines 427-497) with proper schema.org markup
✓ Final CTA section present (lines 500-524)
✓ Word count exceeds 500 (estimated 1800+ words in body content)

FIXES REQUIRED TO PASS:

1. Either add citations to the "4x boys diagnosed" and "6+ yrs delay" statistics, or replace them with cited statistics (e.g., from DSM-5, recent meta-analyses)
2. Verify that the Andreana Tadaj testimonial quote exactly matches the real Google review provided by the user
3. Optional but recommended: Add a disclaimer/disclaimer note about why specific numbers weren't cited if they're based on clinical observation rather than formal studies
Fixes: To pass verification:

1. ADD CITATIONS TO STATISTICS (Critical - Lines 141-146):
   - Option A: Add a subtle citation like: <div class="mt-2 text-xs uppercase tracking-widest text-mute font-semibold">Boys diagnosed for every 1 girl <span class="text-[10px]">(DSM-5, 2013)</span></div>
   - Option B: Replace with conservative language: "Girls often diagnosed later" without specific ratio
   
2. VERIFY ANDREANA TADAJ TESTIMONIAL (Critical - Line 411):
   - Confirm the exact quote matches the real Google review
   - If quote differs, update to match the actual review text

3. OPTIONAL MEDICAL DISCLAIMER (Recommended):
   - No changes strictly required, but consider adding near the opening: "This guide is for informational purposes and should not replace professional diagnosis. Only a qualified healthcare provider can diagnose autism."

## Wiring still needed (orchestrator to do)

1. Add each new slug to scripts/inject-seo.py SEO_PAGES (title, description, crumbs, type)
2. Add breadcrumb entry to assets/data/header.json for each
3. Add to scripts/build-sitemap.py STATIC_PAGES list
4. Optionally add to assets/data/pages.json admin registry
5. Run inject-seo.py + build-sitemap.py + optimize-pages.py
6. Commit + push
