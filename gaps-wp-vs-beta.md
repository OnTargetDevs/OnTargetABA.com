# Content gaps — legacy WP vs new beta site

Compared every URL on the legacy WordPress site at https://ontargetaba.com
against the new static site at https://beta.ontargetaba.com.

- WP URLs inventoried: 242
- Beta URLs inventoried: 192
- Slug-level candidates not on beta: 61
- Deep-dive findings: 61
- Plausibly missing (high+medium): 30
- **Verified missing: 22** (7 high / 15 medium)

Low-severity items (WP plumbing — taxonomy archives, author pages, attachments, paginated category pages) are intentionally excluded; the new site doesn't replicate that WP-specific structure.

## HIGH severity (7)

### Full Day ABA Therapy - On Target + Clever Bee

**WP URL:** https://ontargetaba.com/full-day-aba-therapy-on-target-clever-bee/
**Purpose:** Promotes the Clever Bee Childcare partnership full-day ABA model — a distinct service offering, not just a location.
**New-site equivalent:** https://beta.ontargetaba.com/full-day-aba-therapy-on-target-clever-bee/ (serves the generic /our-services page; no Clever Bee mention)
**Why a gap:** URL resolves but the Clever Bee Childcare partnership content is GONE from beta — the generic services page makes no mention of Clever Bee, full-day daycare-style ABA, or the partnership angle. This is the most substantive gap in this batch: a distinct service offering / co-branded program has been silently dropped. Confirm with user whether the Clever Bee partnership still exists; if so, rebuild this page (and its -g/-typ siblings).
**Content summary:** Partnership / service landing page promoting full-day ABA therapy in daycare-like settings via the On Target ABA + Clever Bee Childcare partnership. CTAs: 'GET STARTED TODAY!', 'CALL NOW!' (216-770-9560 and 888-989-5011). Pre-intake form link. Highlights 48-hour start, dedicated classrooms, insurance acceptance, Cleveland/Columbus/SLC coverage.

---

### Full Day ABA Therapy - On Target + Clever Bee (Google Ads variant)

**WP URL:** https://ontargetaba.com/full-day-aba-therapy-on-target-clever-bee-g/
**Purpose:** Google Ads conversion destination for the Clever Bee full-day partnership program.
**New-site equivalent:** https://beta.ontargetaba.com/full-day-aba-therapy-on-target-clever-bee-g/ (serves generic /our-services page; no Clever Bee mention)
**Why a gap:** Same as the non-g variant - the Clever Bee partnership content is entirely missing from beta. If Google Ads campaigns are still running against this URL, they now hit a generic services overview instead of the partnership-specific landing page.
**Content summary:** Google Ads variant of the Clever Bee partnership page. Same partnership angle, 48-hour start messaging, multi-location coverage, 6 value props, insurance logos, customer testimonials. CTAs: 'GET STARTED TODAY!', 'CALL NOW! 216-770-9560', Intake Form link.

---

### Mismatch Shoe Tuesday: How On Target ABA Celebrated Autism Awareness & Acceptance Week

**WP URL:** https://ontargetaba.com/2026/04/15/mismatch-shoe-tuesday-how-on-target-aba-celebrated-autism-awareness-acceptance-week/
**Purpose:** Values/culture post tied to a major sector observance (Autism Acceptance Month); aligns brand voice with neurodiversity-affirming language - strategically important content.
**New-site equivalent:** (none found)
**Why a gap:** Recent (April 2026) values-forward post missing on beta (404 at /blog/posts/mismatch-shoe-tuesday-how-on-target-aba-celebrated-autism-awareness-acceptance-week; no slug in index.json). Higher severity than other recap posts because it carries explicit brand positioning around acceptance/neurodiversity and is tied to a recognized seasonal awareness event - worth porting before the next Autism Acceptance Month cycle.
**Content summary:** Staff-led Mismatch Shoe Tuesday during Autism Awareness & Acceptance Week. Frames the gesture around 'difference is not a deficit - it is a gift' and distinguishes autism awareness from acceptance.

---

### Bubble & Music Party: How On Target ABA's Gahanna EL Center Kicked Off Autism Acceptance Month

**WP URL:** https://ontargetaba.com/2026/04/24/bubble-music-party-how-on-target-abas-gahanna-el-center-kicked-off-autism-acceptance-month/
**Purpose:** Center-specific (Gahanna EL) content that doubles as Autism Acceptance Month positioning; supports local SEO/community signal for the Gahanna location.
**New-site equivalent:** (none found)
**Why a gap:** Recent (April 2026) location-tagged blog post missing on beta (404 at /blog/posts/bubble-music-party-how-on-target-abas-gahanna-el-center-kicked-off-autism-acceptance-month; no slug in index.json). Higher severity because it ties the Gahanna location to current Autism Acceptance Month positioning, and it's one of the most recent posts on the WP site - missing it makes beta look stale next to legacy.
**Content summary:** Recap of a Tuesday sensory-celebration series at the Gahanna EL Center, leading with a Bubble & Music Party that targets visual tracking, motor development, and social connection - framed as autism acceptance in practice.

---

### What Is Extended School Year (ESY)? A Complete Guide for Families of Children with Autism

**WP URL:** https://ontargetaba.com/2026/06/05/what-is-extended-school-year-esy-a-complete-guide-for-families-of-children-with-autism/
**Purpose:** Evergreen SEO-oriented parent-education blog post on a specific special-education entitlement (ESY) that parents commonly search for around year-end and summer.
**New-site equivalent:** (none found)
**Why a gap:** No equivalent post on beta. ESY is a high-intent search topic distinct from general IDEA/education rights coverage; this evergreen guide should be ported.
**Content summary:** Long-form blog post explaining Extended School Year (ESY) services that provide eligible students with disabilities continued educational support beyond the standard school calendar to prevent skill regression. Covers eligibility, how ESY differs from summer school, and how ABA therapy complements these services.

---

### Why Does My Child with Autism Throw Things? Understanding and Addressing Throwing Behavior

**WP URL:** https://ontargetaba.com/2026/06/08/why-does-my-child-with-autism-throw-things-understanding-and-addressing-throwing-behavior/
**Purpose:** Long-tail SEO post answering a high-volume parent question about a specific challenging behavior.
**New-site equivalent:** (none found)
**Why a gap:** No equivalent on beta. Closest posts (meltdowns vs tantrums, autism and aggression) cover adjacent but distinct behaviors. Throwing-specific search intent is unmet.
**Content summary:** Blog post framing throwing as a communication behavior with specific functions (wants, sensory input), outlining Functional Communication Training and environmental-modification strategies from ABA.

---

### Autism and Heart Health: What New Research Means for Your Child's Long-Term Wellbeing

**WP URL:** https://ontargetaba.com/2026/06/10/autism-and-heart-health-what-new-research-means-for-your-childs-long-term-wellbeing/
**Purpose:** Topical/newsy evergreen post tying recent medical research to long-term family planning — strong topical SEO value and differentiated content.
**New-site equivalent:** (none found)
**Why a gap:** No equivalent on beta. This is a distinctive, research-driven post with no thematic replacement; missing it leaves a hole in the longevity/health-outcomes content cluster.
**Content summary:** Blog post summarizing American Heart Association and Autism Speaks research showing elevated cardiovascular, hypertension and diabetes risk in autistic individuals, with guidance on proactive health monitoring and how ABA supports whole-child wellness.


## MEDIUM severity (15)

### Cleveland's Leading ABA Center (Google Ads landing page)

**WP URL:** https://ontargetaba.com/cleveland-aba-therapy-center-g/
**Purpose:** Conversion-optimized landing destination for Google Ads campaigns targeting Cleveland ABA keywords.
**New-site equivalent:** https://beta.ontargetaba.com/cleveland-aba-therapy-center-g/ (serves Mayfield Village location page, not the PPC variant)
**Why a gap:** URL resolves on beta but serves the standard Mayfield location page, NOT a dedicated PPC variant with 'NO WAITLIST!' hero, urgency banners, ClickUp form, or the Clever Bee partnership angle. If Google Ads campaigns are still running against this URL, conversion rate will likely drop vs. the original landing page. Rebuild as a PPC-tuned variant if ads remain live, or update ad destinations to the location page.
**Content summary:** PPC landing page targeting Cleveland/Akron families via Google Ads. Heavy urgency messaging: 'Now Enrolling: Full-Day Autism Services', 'Start services within 48 hours', no waitlist. Multiple Get Started CTAs, phone (216) 770-9560, ClickUp intake form, parent testimonials, insurance logos. Mentions Clever Bee Childcare partnership.

---

### Cleveland's Leading ABA Center (Facebook Ads variant)

**WP URL:** https://ontargetaba.com/cleveland-aba-therapy-center-fb/
**Purpose:** Facebook Ads landing destination for Cleveland ABA campaigns.
**New-site equivalent:** https://beta.ontargetaba.com/cleveland-aba-therapy-center-fb/ (serves Mayfield Village location page)
**Why a gap:** URL resolves but to the standard location page; the FB-specific PPC variant (different ad-platform messaging, no-waitlist hero, ClickUp form) is not preserved. Same risk as the -g variant if FB ads are still active.
**Content summary:** Facebook Ads sibling of cleveland-aba-therapy-center-g. Same Cleveland targeting, conversion focus, Clever Bee Childcare partnership mention, 'Get Started in Days, Not Weeks!' urgency. ClickUp intake form + (216) 770-9560.

---

### Landing Page - Mayfield - FB - On Target ABA

**WP URL:** https://ontargetaba.com/aba-therapy-cleveland-lp-fb/
**Purpose:** FB Ads conversion landing page for Cleveland ABA, sibling of the -g variant.
**New-site equivalent:** https://beta.ontargetaba.com/aba-therapy-cleveland-lp-fb/ (serves Mayfield Village location page)
**Why a gap:** URL resolves to the standard Mayfield page rather than the FB-tuned PPC variant. Loss of the conversion-optimized layout (urgency hero, big NO WAITLIST banner, single-CTA flow) likely hurts paid-traffic conversion rate.
**Content summary:** Facebook Ads landing page. Headlines: 'Start ABA Therapy in Days, Not Weeks!', 'One of Cleveland's Largest Autism Centers', 'NO WAITLIST'. Big urgency-driven CTAs: 'CALL NOW! 216-770-9560', 'GET STARTED TODAY!'. 4-step intake visualization, insurance logos, testimonials.

---

### ABA Therapy CLEVELAND (Google Ads landing page)

**WP URL:** https://ontargetaba.com/aba-therapy-cleveland-lp-g/
**Purpose:** Google Ads conversion landing destination for Cleveland ABA campaigns.
**New-site equivalent:** https://beta.ontargetaba.com/aba-therapy-cleveland-lp-g/ (serves Mayfield Village location page)
**Why a gap:** URL works but content is the standard location page, not the PPC variant. Same conversion-loss concern if Google Ads still send traffic here.
**Content summary:** Google Ads variant of the Cleveland LP. 'Start ABA Therapy in Days, Not Weeks!', 'NO WAITLIST!', 'GET STARTED TODAY!' x multiple. (216) 770-9560 click-to-call, header form, 6 differentiators, parent testimonials, insurance row.

---

### ABA Therapy COLUMBUS (Facebook Ads landing page)

**WP URL:** https://ontargetaba.com/aba-therapy-col-lp-fb/
**Purpose:** Facebook Ads conversion destination for Columbus ABA campaigns.
**New-site equivalent:** https://beta.ontargetaba.com/aba-therapy-col-lp-fb/ (serves Gahanna/Airport location page)
**Why a gap:** URL resolves to Gahanna location page; FB-tuned PPC variant not preserved. Same paid-traffic conversion concern.
**Content summary:** Facebook Ads sibling of aba-therapy-col-lp-g. Same Columbus targeting, 'Gold-Standard', 'NO WAITLIST', urgency CTAs, (614) 681-1030. Mentions both Columbus and Cleveland phone numbers.

---

### COL LP New Google Ads Page (Columbus, refreshed)

**WP URL:** https://ontargetaba.com/aba-therapy-columbus-lp-g-new/
**Purpose:** Refreshed Google Ads landing page for Columbus, possibly the current live destination.
**New-site equivalent:** https://beta.ontargetaba.com/aba-therapy-columbus-lp-g-new/ (serves Gahanna/Airport location page)
**Why a gap:** URL resolves to the standard Gahanna page. The refreshed PPC layout ('Days, Not Months', dual-phone fallback, Schedule-a-Tour CTA) is not preserved. This is likely the currently active Google Ads destination, so worth confirming with the user whether ads are still live and need a PPC-tuned rebuild.
**Content summary:** Newer Google Ads variant for Columbus. 'START ABA THERAPY IN DAYS, NOT MONTHS!', 'A Faster, More Supportive Start for Your Child'. Two phones in CTAs ((614) 681-1030 and (385) 550-3500 - Murray UT mistakenly included). Pre-Intake Form link + 'Schedule a Tour'. Mentions a 10,000+ sq ft facility.

---

### Spirit Week at Worthington: Building Confidence and Community Through Dress-Up Fun

**WP URL:** https://ontargetaba.com/2025/10/29/%f0%9f%8e%83spirit-week-at-worthington-building-confidence-and-community-through-dress-up-fun/
**Purpose:** Clinic-life recap / community engagement blog post that doubles as soft marketing showing the Worthington center's culture and therapy-through-play approach.
**New-site equivalent:** (none found)
**Why a gap:** Real blog content from Oct 2025 missing from beta. /blog/posts/spirit-week-at-worthington-building-confidence-and-community-through-dress-up-fun returns 'Post not found' and the slug does not appear in assets/blog/index.json. The emoji-prefixed WP slug likely wasn't included in the scrape that built the markdown blog corpus.
**Content summary:** Recap of a themed dress-up Spirit Week at the Worthington center, framing the activities as opportunities for children with autism to practice social skills, flexibility, and self-expression in a supportive therapeutic setting.

---

### Smiles, Costumes, and Community: Inside the On Target ABA Halloween Party 2025

**WP URL:** https://ontargetaba.com/2025/11/05/%f0%9f%8e%83-smiles-costumes-and-community-inside-the-on-target-aba-halloween-party-2025/
**Purpose:** Cross-clinic community/PR post showcasing how all four On Target ABA centers celebrate together; useful for parent trust and recruiting.
**New-site equivalent:** (none found)
**Why a gap:** Real blog post missing on beta (404 at /blog/posts/smiles-costumes-and-community-inside-the-on-target-aba-halloween-party-2025; no matching slug in index.json). Emoji-prefixed WP slug almost certainly skipped during the markdown scrape.
**Content summary:** Multi-center Halloween party recap covering Cleveland, Columbus, Worthington and Utah, framing the event as structured social engagement and skill-building (turn-taking, communication, flexibility) inside a sensory-friendly environment.

---

### Pajama Day & Holiday Tree Decorating - A Fun, Meaningful Learning Experience at On Target ABA

**WP URL:** https://ontargetaba.com/2025/12/30/pajama-day-holiday-tree-decorating-a-fun-meaningful-learning-experience-at-on-target-aba/
**Purpose:** Clinic-life recap that ties seasonal/holiday programming to concrete ABA goals; soft-sell content for parents evaluating the program.
**New-site equivalent:** (none found)
**Why a gap:** Real Dec 2025 blog post missing on beta (404 at /blog/posts/pajama-day-holiday-tree-decorating-a-fun-meaningful-learning-experience-at-on-target-aba; no matching slug in index.json).
**Content summary:** Pajama-day + edible-tree-decorating recap explaining how the festive activity targeted transitions, communication, social skills, and fine-motor coordination for children with autism.

---

### Movie Night at On Target ABA - A Sensory-Friendly Experience That Builds Skills

**WP URL:** https://ontargetaba.com/2025/12/30/movie-night-at-on-target-aba-a-sensory-friendly-experience-that-builds-skills/
**Purpose:** Clinic-life recap demonstrating sensory-friendly programming; supports the brand's family-engagement positioning.
**New-site equivalent:** (none found)
**Why a gap:** Real Dec 2025 blog post missing on beta (404 at /blog/posts/movie-night-at-on-target-aba-a-sensory-friendly-experience-that-builds-skills; no matching slug in index.json).
**Content summary:** Recap of a sensory-friendly Movie Night event, framing it as practice for social skills, communication, emotional regulation, and flexible thinking ('learning happens everywhere - especially in moments of joy').

---

### Color, Connection & Confidence: How Group Coloring Activities Support Growth in ABA Therapy

**WP URL:** https://ontargetaba.com/2025/11/17/%f0%9f%96%8d%ef%b8%8f-color-connection-confidence-how-group-coloring-activities-support-growth-in-aba-therapy/
**Purpose:** Educational/SEO post explaining ABA mechanics to parents through a relatable everyday activity (coloring). More evergreen than the pure event recaps - useful for organic search and parent education.
**New-site equivalent:** (none found)
**Why a gap:** Educational blog post missing on beta (404 at /blog/posts/color-connection-confidence-how-group-coloring-activities-support-growth-in-aba-therapy; no slug in index.json). Emoji-prefixed WP slug likely dropped by the markdown scrape. Evergreen content - worth porting for SEO.
**Content summary:** Explainer on how structured group coloring activities target social interaction, communication, fine motor skills, and emotional regulation, with practical strategies therapists use during group sessions.

---

### Finding Calm: How Downtime Supports Progress in ABA Therapy

**WP URL:** https://ontargetaba.com/2025/11/19/%f0%9f%8c%bf-finding-calm-how-downtime-supports-progress-in-aba-therapy/
**Purpose:** Educational/SEO post that pushes back on the assumption that more drilling = more progress. Strong parent-education and trust-building content.
**New-site equivalent:** (none found)
**Why a gap:** Educational blog post missing on beta (404 at /blog/posts/finding-calm-how-downtime-supports-progress-in-aba-therapy; no slug in index.json). Emoji-prefixed WP slug likely dropped by the markdown scrape. Evergreen, parent-facing - worth porting.
**Content summary:** Argues that downtime is integral to ABA therapy - quiet moments help children with autism with emotional regulation, processing learning, and confidence-building - with practical at-home strategies for parents.

---

### A Look Back at Autism Awareness Month: Chuck E. Cheese's Sensory Sensitive Birthdays and What Inclusion Really Looks Like

**WP URL:** https://ontargetaba.com/2026/06/11/a-look-back-at-autism-awareness-month-chuck-e-cheeses-sensory-sensitive-birthdays-and-what-inclusion-really-looks-like/
**Purpose:** Timely commentary / brand-voice post tying a real-world inclusion initiative to ABA practice; less evergreen but useful for social shares and topical authority.
**New-site equivalent:** (none found)
**Why a gap:** Topic is event-tied (April Awareness Month) and somewhat time-limited, but no comparable sensory-friendly-outings or inclusion-commentary post exists on beta. Worth porting if the editorial calendar values that voice.
**Content summary:** Commentary post on Chuck E. Cheese's Sensory Sensitive Birthdays program (in partnership with Autism Speaks), arguing it represents meaningful progress beyond awareness, and discussing how ABA supports skill-building for social celebrations.

---

### Autism Stigma: What It Really Looks Like and How Families Can Respond

**WP URL:** https://ontargetaba.com/2026/06/12/autism-stigma-what-it-really-looks-like-and-how-families-can-respond/
**Purpose:** Parent-emotional-support / advocacy voice piece that helps the brand stand on neurodiversity-aligned values.
**New-site equivalent:** (none found)
**Why a gap:** No stigma-focused post on beta. Adjacent ethics and sibling-support posts touch the area but don't replace it. Reasonable to port for brand voice and emotional-support cluster.
**Content summary:** Blog post exploring everyday autism stigma (dismissive comments, unsolicited advice) and its impact on parents and children, advocating a 'support the child' rather than 'fix the child' mindset with practical response strategies.

---

### ABA Therapy Isn't Just for Autism: History, Origins, and Broader Uses

**WP URL:** https://ontargetaba.com/2026/06/16/aba-therapy-was-not-created-for-autism-and-its-not-exclusive-to-it/
**Purpose:** Authority/education post that broadens the brand's expertise framing and addresses common misconceptions about ABA.
**New-site equivalent:** (none found)
**Why a gap:** No equivalent on beta. This is a credibility/expertise post (history of ABA, broader applications) with no thematic replacement; reasonable to port as it differentiates the brand from autism-only ABA providers.
**Content summary:** Blog post tracing ABA's origins to B.F. Skinner's research, explaining how the field became associated with autism via Lovaas, and detailing other conditions (ADHD, OCD, anxiety, trauma) where ABA is effective.


