# On Target ABA website — factual-accuracy audit (2026-10-19)

Audit only. No site copy was changed by this document; the single commit on
`docs/content-audit-2026-10-19` is this file. Scope: every `website/*.html` page
(incl. the five Google Ads landing pages, `landing.html`, `aba-therapy-ut-pc.html`),
`assets/data/header.json` / `footer.json`, and company-fact mentions in the 248
blog `.md` files. Each claim is **VERIFIED** (matches a written source),
**CONTRADICTED** (a written source says otherwise), or **UNVERIFIED** (no written
source — never assumed "probably fine").

## Written sources used (abbreviations in the tables)

- **CLAUDE.md** — `D:/Claude/OnTargetABA-wt-audit/CLAUDE.md` (addresses, phones, hours, founder credentials, Jotform ids, real-reviewer names).
- **Nate 2026-10-19** — tonight's instruction: community clients accepted for Cleveland/Akron/Columbus & nearby; RBT starting pay **$23–$27.50**; "there are many more clinics"; no Akron *center*; client counts never public.
- **Joshua 2026-10-19** — via the comms window: every detail on `become-an-rbt.html` is "hallucinatory / off" and the career path "makes no sense"; CareSource must be fixed; the Potty Training *Program* page was pulled as a liability (blog posts still open).
- **Portal table (Window 4) 2026-10-19** — the nine-site location table handed to this audit (system of record for sites).
- **Portal repo** — `origin/main` of `D:/Claude/ontarget-portal`: `core/intake_reference.py` (public-facing per-site addresses, phones, ages, scholarship IRNs), `core/auth_submission_routing.py` (center list + directors), `core/client_location.py` (building seeds). Cited as "intake_reference.py".

## Summary (claim groups by status)

| Status | Count | The headline items |
|---|---:|---|
| VERIFIED | 14 | 4 core addresses, 4 main phones, founder credentials, reviewer names, legal-entity wording, SMS boilerplate, community/area coverage, review authenticity |
| CONTRADICTED | 11 | CareSource (undistinguished, 7 pages), "Opening Soon" banner for an operating site, "three states" (×3), only "four clinics" listed, ASP-provider-in-Cleveland, $18–22 RBT pay, Mayfield "Heights" vs "Village", whole become-an-rbt detail set |
| UNVERIFIED | 16 | per-site hours, ages served (inconsistent), all start-time/waitlist promises, Murray "opened 2026 / 10,000 sq ft", in-house psychologist, Jon Peterson scholarship, $32,455 ASP figure, 216-770-9560 tracking line, "New Expanded Center" wording, payer lists, founded-2022, "10+ years", public naming of EL/SA/Nela Park/Reynoldsburg, "On Target ABA, LLC" entity |

Several groups are both CONTRADICTED and UNVERIFIED (e.g. `become-an-rbt.html`: pay is CONTRADICTED, the rest UNVERIFIED). They are filed under their dominant status and cross-noted.

---

## 1. Locations — which centers exist / are listed

| Claim | Where (page:line) | Status + source |
|---|---|---|
| Site presents **only four centers** (Murray; Mayfield/Cleveland; Columbus–Gahanna @2760; Worthington) | shared pre-footer location band on every content page (e.g. `about.html:166–263`); `locations.html` cards + JSON-LD (131–276); `careers.html:755`; `become-an-rbt.html:668–686`; `footer.json` Locations column | **CONTRADICTED** — Nate: "there are many more clinics." Portal table lists 9 sites incl. **COL- Airport EL** (2740, open), **CLE- Nela Park / East Cleveland** (operating, active clients), **COL- Reynoldsburg** (4707 Hilton, first clients 2026-10-19), plus CLE/COL Community (in-home). None listed as centers. |
| Announcement bar: **"New East Cleveland Location (Nela Park) Opening Soon!"** | `header.json` → inlined on every page (e.g. `index.html:575`, `locations.html:413`) | **CONTRADICTED** — Nela Park is *operating* with active clients (portal table). The same site already treats it as open: `meet-the-team.html:778–780` shows its Center Director (Rachel Shantery), and `aba-therapy-cleveland-lp-g.html:183,243` sells it as an operating center. |
| **"three states"** / "across three states" | `careers.html:755`; `center-based-aba-therapy.html:757`; `locations.html:484` | **CONTRADICTED** — On Target operates in **two** states (OH + UT). The correct "two states" is used at `become-an-rbt.html:672`, `meet-the-team.html:604`, `why-work-at-on-target-aba.html:500`. |
| Homepage shows **two identical "Columbus — Airport" cards** (2760 Airport Dr and 2740 Airport Dr) with no distinguishing name | `index.html:~1306` (2760) and `index.html:1315` (2740) | **UNVERIFIED** — 2740 = Early Learners (EL), 2760 = School-Age (SAI/SAP). Both labelled generically "Columbus — Airport"; `locations.html` + footer list only 2760. Needs a public-naming decision. |
| "New Expanded Center" badge / "Expanded ABA clinic — Mayfield Village" | `contact.html:595`; `locations.html:589` | **UNVERIFIED** — what "expanded" refers to is unstated; confirm wording. |
| 5444 South Green Street, Murray, UT 84123 | shared band + `murray-utah.html`, `salt-lake-city.html`, UT landing pages | **VERIFIED** — CLAUDE.md / intake_reference ("5444 S Green St"). |
| 767 Beta Dr, Suite C, **Mayfield Village**, OH 44143 | shared band; `cleveland.html:737`; `contact.html:597`; `aba-therapy-cleveland-lp-g.html:456` | **VERIFIED** — CLAUDE.md + portal table. |
| 767 Beta Dr, **Mayfield Heights**, OH 44143 | `aba-therapy-cleveland-lp-g.html:251` | **CONTRADICTED** (internal) — 44143 is Mayfield *Village* (CLAUDE.md). Portal site *name* is "Mayfield Heights" but the street city is Mayfield Village; the LP mixes the two. |
| 2760 Airport Dr, Suite 110, Columbus, OH 43219 | shared band; `columbus.html:547`; `gahanna-ohio.html`; `index.html` | **VERIFIED** — intake_reference + portal table. |
| 130 E Wilson Bridge Rd, Suite 200, Worthington, OH 43085 | shared band; `worthington-ohio.html`; `autism-scholarship-program-ohio.html:764` | **VERIFIED** — intake_reference + portal table. |
| 2740 Airport Dr, Columbus, OH 43219 (no suite, no program name) | `index.html:1315` | **VERIFIED address** (intake_reference: "2740 Airport Dr, Suite 240" = COL- Airport EL / Early Learners) but suite omitted and program not named. |
| 1975 Noble Rd, Bldg 329, East Cleveland (Nela Park) | `aba-therapy-cleveland-lp-g.html:251` | **VERIFIED** — intake_reference: "1975 Noble Rd, Bldg 329, Cleveland OH 44112". NB: the portal table handed to this audit said Nela Park's address is "not recorded" — it **is** recorded in intake_reference.py (flagged to Window 4). |
| Reynoldsburg center (4707 Hilton Corporate Dr) | not listed as a center anywhere; appears only as an area-served chip (`gahanna-ohio.html:739,811`) | **CONTRADICTED (omission)** — new operating center absent from the site. |

## 2. Phone numbers

| Claim | Where | Status + source |
|---|---|---|
| Main **(888) 989-5011** | site-wide (`header.json` cta, `footer.json`, all pages) | **VERIFIED** — CLAUDE.md. |
| Cleveland/Mayfield **(216) 343-1198** | shared band; `contact.html:611` | **VERIFIED** — CLAUDE.md / intake_reference. |
| Columbus **(614) 681-1030** (Gahanna + Worthington) | shared band; landing + metro pages | **VERIFIED** — intake_reference (Columbus main line). |
| Murray **(385) 550-3500** | shared band; UT pages | **VERIFIED** — CLAUDE.md / intake_reference. |
| **216-770-9560** used instead of 216-343-1198 | `aba-therapy-cleveland-lp-g.html:161,164,186,203,443,457` (Cleveland Google Ads LP only) | **UNVERIFIED** — looks like a call-tracking DID; confirm it routes to the Cleveland line. (No other page uses it; the other LPs use the standard numbers.) |

*(The "614-603-8781" my first sweep flagged on `aba-for-teenagers.html:827` is a false positive — it is the Jotform id `213614603878157`, not a phone.)*

## 3. Hours

| Claim | Where | Status + source |
|---|---|---|
| **"Mon–Fri 8:00 AM – 5:00 PM"** stated for every site | shared band; `contact.html:618`; `careers.html` ("Hours at every clinic"); JSON-LD `openingHours Mo-Fr 08:00-17:00` on location pages | **UNVERIFIED** — CLAUDE.md states it site-wide but the portal table confirms it for *no individual site*; intake_reference marks OH/UT phone hours as `unconfirmed_soft_quote` ("never state as policy until confirmed"). Per-site hours need confirmation. |

## 4. Service areas / "Cleveland–Akron–Columbus" coverage

| Claim | Where | Status + source |
|---|---|---|
| Community / in-home & school coverage for **Greater Cleveland and Akron** | `contact.html:597,620` ("Cleveland / Akron", "home & school based ABA throughout Greater Cleveland and Akron"); `areaServed` JSON-LD incl. "Akron" on all pages (`:216`) | **VERIFIED** — Nate: community clients accepted for Cleveland/Akron/Columbus & nearby; no Akron *center* (site frames Akron as coverage, not a center). |
| Columbus/Franklin & Delaware county community coverage (Gahanna, Worthington, Westerville, Reynoldsburg, Bexley, New Albany…) | `gahanna-ohio.html:739,811`; `columbus.html:483`; areaServed arrays | **VERIFIED** — Nate (community for Columbus & nearby). |
| Greater Cleveland suburb coverage (Beachwood, Cleveland Heights, Pepper Pike, Lyndhurst…) | `cleveland.html:566–580` | **VERIFIED** — community coverage. |

## 5. Insurance & payers — CareSource is the key issue

| Claim | Where | Status + source |
|---|---|---|
| **"CareSource"** listed as an accepted **Medicaid** plan, with no Marketplace-vs-Medicaid distinction | `aba-therapy-cleveland-lp-g.html:310,339,346,367`; `aba-therapy-col-lp-g.html:308,337,344,365`; `autism-testing-autism-evaluations-columbus-g-lp.html:271,278,298`; `columbus.html:709,838`; `insurance.html:677`; `insurance-medicaid-ohio.html:516,606,649,785` | **CONTRADICTED** — Nate + Joshua ("So fix that!!!!"): CareSource **Medicaid is NOT accepted**; CareSource **Marketplace IS**. intake_reference corroborates ("…accepted on Molina and Buckeye — **not CareSource**"). A caller abandoned the intake form over this. Joshua also wants an **"Other → free-text"** option added to the site's insurance lists. |
| Commercial/Medicaid payer set listed (Molina, Buckeye, Humana, Aetna, Medical Mutual, Anthem, UnitedHealthcare / Community Plan, AmeriHealth Caritas, Cigna) | `insurance*.html`, `columbus.html:709,838`, landing pages | **UNVERIFIED** — no written source confirms the exact accepted-payer set; confirm the authoritative list (and whether to add "Other"). |
| Utah: "all Utah Medicaid plans" incl. Healthy U, SelectHealth Community, Health Choice Utah, EMI Health | `aba-therapy-salt-lake-city-lp-g-new.html:296–324`; `insurance-medicaid-utah.html` | **UNVERIFIED** — confirm the Utah payer set. |
| "ABA is covered by … Medicaid in all 50 states" | `aba-for-toddlers.html:906`; `aba-for-school-age.html:806` | **UNVERIFIED** (general ABA-coverage marketing, not an On Target operating claim; low priority). |

## 6. Scholarship & Medicaid statements

| Claim | Where | Status + source |
|---|---|---|
| "On Target ABA is an approved Ohio Autism Scholarship Program provider **in Cleveland and Columbus**" | `autism-scholarship-program-ohio.html:482`; and "we serve eligible students through the Ohio Autism Scholarship" on the **Cleveland** LP `aba-therapy-cleveland-lp-g.html:348` | **CONTRADICTED** — intake_reference: the ASP-registered sites are the **Columbus** ones only (Gahanna EL IRN 022290, School-Age IRN 021405, Worthington IRN 020894). Mayfield and East Cleveland are explicitly **not** scholarship-eligible ("no current-year provider application"). Claiming ASP in Cleveland is inaccurate. |
| Ohio Autism Scholarship pays **up to $32,455/year** (for ABA, evaluation, speech, OT…) | `autism-scholarship-program-ohio.html:478,364`; `insurance.html:668` | **UNVERIFIED** — confirm the current ASP maximum. |
| **Jon Peterson Special Needs Scholarship** offered | `insurance.html:672` | **UNVERIFIED** — no written source confirms On Target participates in Jon Peterson (portal references only the Autism Scholarship / DEW). |
| Ohio Medicaid managed-care plan list | `insurance-medicaid-ohio.html:606`; `columbus.html:709,838` | **VERIFIED as a list of OH MCPs**, but "we accept" each is subject to the CareSource correction above. |

## 7. Services offered

| Claim | Where | Status + source |
|---|---|---|
| Center-based, in-home, school-based, daycare-based, early intervention, parent training, social-skills training | `our-services.html:100–364`; `index.html:114–122,748` | **VERIFIED** — consistent with the practice. |
| **School-based** ABA (general, site-wide) | `our-services.html` meta/desc; service pages | **UNVERIFIED for Utah** — intake_reference: Utah does **not** offer in-school services (Ohio does). UT pages themselves say only "center-based + in-home" (consistent); confirm school-based is framed OH-only. |
| "In-house licensed psychologist(s)" perform autism diagnosis | `aba-therapy-ut-pc.html:234,183`; `aba-therapy-salt-lake-city-lp-g-new.html:234`; `autism-testing-autism-evaluations-columbus-g-lp.html:183,215,321`; `autism-testing.html:832` | **UNVERIFIED** — specific staffing claim; no written source confirms in-house licensed psychologists in UT and Columbus. |
| Autism testing / evaluations offered | footer service link; eval Jotform `260534406459156`; `autism-testing.html` | **VERIFIED** (service exists). Which locations offer it (Columbus + Murray per the LPs; Cleveland unclear) — **UNVERIFIED**. |

## 8. Ages served

| Claim | Where | Status + source |
|---|---|---|
| "ages 2–18" | `about.html:7`; `mayfield-ohio.html:696`; `worthington-ohio.html:696`; `murray-utah.html:703`; `cleveland.html:551`; `columbus.html:828` | **UNVERIFIED + inconsistent** — exceeds portal intake age caps (Murray ≤14; Mayfield / East Cleveland ≤10; Columbus ≤12 per intake_reference). |
| "Ages 2–5" (early-intervention sub-cards) | `cleveland.html:629`; `columbus.html:685`; `gahanna-ohio.html:627`; `salt-lake-city.html:676`; `murray-utah.html:650` | **UNVERIFIED** — contradicts the same pages' "2–18". |
| "ages 2 to 7" (Murray / SLC) | `aba-therapy-salt-lake-city-lp-g-new.html:42`; `on-target-aba-autism-testing-autism-evaluations.html:25` | **UNVERIFIED** — vs intake_reference Murray cap ≤14. |
| Dedicated **"ABA for Teenagers"** page | `aba-for-teenagers.html` | **UNVERIFIED** — implies serving teens, vs portal caps (≤10–14). Needs a public age-range decision (overall + per site). |

## 9. Waitlist / start-time / live-pickup promises

| Claim | Where | Status + source |
|---|---|---|
| "No waitlist" / "Quality care without the wait" (tagline) | site-wide; `footer.json` tagline; `aba-for-school-age.html:728`; `aba-therapy-ut-pc.html:180` | **UNVERIFIED** — confirm it may stay (Nate flagged for Joshua). |
| "Get started in under 72 hours" / "start within 72 hours" | `aba-for-teenagers.html:841,863`; `aba-vs-occupational-therapy.html:959` | **UNVERIFIED** — confirm it may stay. |
| "We can start within the week" / "within 7 days" | `aba-for-school-age.html:730,733` | **UNVERIFIED + inconsistent** with "72 hours". |
| "Intake call within 48 hours" / "Start in days, not months" | `aba-for-toddlers.html:779,785`; `aba-therapy-col-lp-g.html:42` | **UNVERIFIED + inconsistent**. |
| "We pick up live" / "Live pickup, every time" | `aba-for-preschoolers.html:816`; `aba-for-school-age.html:836` | **UNVERIFIED** — confirm. |

## 10. Careers / RBT page — treat every detail as suspect (Joshua)

Joshua, on a screenshot of `become-an-rbt.html`: "No!" to $18; "$23-27.50"; "Career path makes no sense"; "Where'd you get this info from? It's hallucinatory"; "The concept is good. The details are off."

| Claim | Where | Status + source |
|---|---|---|
| "**$18–22 / hr** starting" | `become-an-rbt.html:509` (hero stat), `:644` (benefits) | **CONTRADICTED** → **$23–$27.50** (Nate + Joshua). Lane owner fixing in a separate PR. |
| "We were **founded in 2022** by a BCBA" | `become-an-rbt.html:635` | **UNVERIFIED** (Joshua: "hallucinatory"). |
| Career path "From day one to BCBA" (4 steps) | `become-an-rbt.html:518–524` | **UNVERIFIED** (Joshua: "makes no sense"). |
| "Path to RBT … about **4–6 weeks**": apply + 30-min video chat w/ hiring lead & BCBA → 40-hr online self-paced BACB-approved training "we cover the cost", finish 2–3 weeks → in-person skills check → **$45 RBT exam fee** to BACB | `become-an-rbt.html:585–616` | **UNVERIFIED / CONTRADICTED** (Joshua: "details are off"). |
| Benefits: free 40-hr training; BCBA weekly 1:1 mentorship; tuition assistance; lower caseloads; FT health/dental/vision/PTO | `become-an-rbt.html:639–644` | **UNVERIFIED** (Joshua). |
| Whether **paid training** may be mentioned at all | — | **OPEN** — Nate asked Joshua; unanswered (on the form). |

## 11. Founder & staff credentials

| Claim | Where | Status + source |
|---|---|---|
| Ilana Gross, Clinical Director & BCBA; BA Speech & Language Pathology (Touro College, Brooklyn); dual Master's Education + Special Education (**Mercy College, Yonkers**); advanced ABA certificate (**Florida Institute of Technology**) | `about.html:700–701`; `meet-the-team.html:94`; JSON-LD `founder` on multiple pages | **VERIFIED** — CLAUDE.md. |
| "over a decade of experience" / "10+ years" in Special Education & ABA | `about.html:701`; `meet-the-team.html:578,95` | **UNVERIFIED** — not in any written source (minor). |
| Center Directors: Rachel Shantery (East Cleveland / Nela Park); Payton Orr (Worthington) | `meet-the-team.html:778–780,792–816` | **VERIFIED** — match `auth_submission_routing.py`. Other team cards are "Full bio coming soon" placeholders. |
| Internal label error: EL program shown "at 2760 Airport Dr" | `meet-the-team.html:816` (HTML comment) | **UNVERIFIED / minor** — EL is at 2740 per portal; comment only, not visible copy. |

## 12. Legal entity & SMS consent

| Claim | Where | Status + source |
|---|---|---|
| "Target ABA, LLC (dba On Target ABA)" / "Operated by Target ABA, LLC" | `terms-of-service.html:609`; `disclaimer.html:490`; `footer.json` copyright | **VERIFIED** — matches the handed legal-entity wording. |
| JSON-LD `legalName: Target ABA, LLC`; `alternateName: On Target ABA, LLC`; `<meta publisher="On Target ABA, LLC">` | all pages `:45,76–77` | **UNVERIFIED** — "On Target ABA, LLC" as an LLC entity is not confirmed; the registered entity is Target ABA, LLC dba On Target ABA (minor). |
| SMS consent / STOP opt-out / "no mobile info shared with third parties" boilerplate | `privacy-policy.html:685–696`; `terms-of-service.html:578–613`; `disclaimer.html:490–497` | **VERIFIED** — standard, consistent with the dba. |

## 13. Reviews & reviewer names

| Claim | Where | Status + source |
|---|---|---|
| Reviewer names: Andreana Tadaj, Ruchie Kaplan, Carmen E., Zi Zi World Tarpeh, Jack M. (+ S.R., A.D., C.S., D.M. in marquees) | `autism-testing.html:1226–1294,481–561`; `cleveland.html:673` (Ruchie Kaplan · Cleveland); `columbus.html:779,784`; `gahanna-ohio.html:933`; service-page testimonials | **VERIFIED** — CLAUDE.md real-reviewer list (incl. Ruchie Kaplan = Cleveland, Zi Zi World Tarpeh = Columbus). |
| "Verified 5-star reviews" / "Google review" labels | `autism-testing.html:1139,1227` | **VERIFIED** — sourced from real Google reviews (CLAUDE.md). |

## 14. Blog company facts (248 posts — company-fact mentions only)

| Claim | Where | Status + source |
|---|---|---|
| Blog footers "Serving families across Ohio (Gahanna, Worthington…) and Utah" | ~8 posts (e.g. `autism-parenting-hacks-…md:157`) | **VERIFIED-ish** — OH + UT correct; they omit Cleveland/new centers (minor staleness; out of scope to rewrite). No blog states $18 pay, "three states", "four clinics", a founding year, or CareSource-Medicaid. |
| Two **potty-training** posts still live in the repo | `assets/blog/7-potty-training-tips-for-nonverbal-kids-with-autism.md`; `assets/blog/aba-therapy-and-potty-training-what-parents-should-expect.md` | **OPEN (Joshua)** — match the WordPress posts (ids 14884, 11739). The Potty Training *Program* page was already removed as a liability; Joshua to decide whether these two posts go too. |
| `how-to-become-an-rbt-a-complete-guide…md` | blog | **UNVERIFIED / low priority** — generic RBT guide; may echo pay/career claims; review alongside the RBT page rewrite. |

---

## Open questions

### (a) For the operations manager — QA Note Checker & Communications Window 4
(Each answerable in a word/number. No client counts, no PHI. Replies go to Website & Marketing Window 9.)

1. Confirm the public street + suite + phone for each operating site the website should list: **Mayfield Village** (767 Beta Dr, Ste C / 216-343-1198), **East Cleveland–Nela Park** (1975 Noble Rd, Bldg 329 / 216-343-1198), **Gahanna Early Learners** (2740 Airport Dr, Ste 240 / 614-681-1030), **Gahanna School-Age** (2760 Airport Dr, Ste 110 / 614-681-1030), **Worthington** (130 E Wilson Bridge Rd, Ste 200 / 614-681-1030), **Reynoldsburg** (4707 Hilton Corporate Dr / phone?), **Murray** (5444 S Green St / 385-550-3500).
2. Is the Cleveland LP tracking number **216-770-9560** a legitimate On Target call-tracking line? (Y/N)
3. Should the city for 767 Beta Dr read **Mayfield Village** (not "Mayfield Heights")? (confirm)
4. Per-site hours — is **Mon–Fri 8–5** correct for every site, or do any differ?
5. Which payers should the site list as accepted, and should an **"Other → free text"** option be added to the insurance lists?
6. Service areas: confirm **Akron / Columbus / Cleveland + nearby = community (in-home) coverage only**, with centers only where addresses exist.
7. Which locations offer **autism testing / evaluations** (Columbus, Murray, Cleveland?) and is the **in-house licensed psychologist** claim accurate?
8. Does the site's Reynoldsburg center need a phone number, or should it route to the Columbus main line?

### (b) For Joshua (CEO) — delivered as a form (see below)
1. Public naming for each program/site: **Early Learners**, **School-Age (SAI / SAP)**, **East Cleveland (Nela Park)**, **Reynoldsburg** — and should Nela Park and Reynoldsburg be listed publicly **now**?
2. Replace the site-wide "Nela Park Opening Soon" banner with what (it's already operating)?
3. **CareSource** wording — confirm "CareSource Marketplace accepted; CareSource Medicaid not accepted," and whether the insurance lists carry an "Other" option.
4. Which promises may stay: **"no waitlist"**, **"start within 72 hours"**, **"live pickup"**? (and the inconsistent 48h / 7-day / "days not months" variants)
5. **Ages served** — what range should the site state overall and per location?
6. **Become-an-RBT**: real career-path steps / what this section should say; and may **paid training** be mentioned?
7. The two **potty-training blog posts** (14884, 11739) — remove like the Potty Training Program page, or keep?
8. **$32,455** Ohio Autism Scholarship figure and **Jon Peterson** scholarship participation — correct?
9. Anything CONTRADICTED above you want prioritized or overruled.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01UroTbVcMmfTRS6ZWX85vsH
