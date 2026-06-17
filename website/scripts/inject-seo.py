"""
Inject schema.org JSON-LD, Open Graph / Twitter meta tags, and visual
breadcrumbs into every HTML page. Idempotent: any prior injected blocks
(marked with auto-generated comments) are stripped before re-injection.

Page types are inferred from filename. Per-page metadata (title, descr,
breadcrumb chain, primary schema type) lives in SEO_PAGES below.

Run from the website/ directory:
    python inject-seo.py
"""
from __future__ import annotations
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
# SITE is the canonical origin used in canonical links, OG URLs, and JSON-LD
# @id values. Override per environment with SITE_DOMAIN (e.g.
# `SITE_DOMAIN=https://beta.ontargetaba.com python inject-seo.py`) so a beta
# build does not bake production URLs into its canonical tags.
SITE = os.environ.get("SITE_DOMAIN", "https://ontargetaba.com").rstrip("/")

# ---------------------------------------------------------------- shared blocks

ORG_LD = {
    "@type": ["MedicalBusiness", "Organization", "LocalBusiness"],
    "@id": f"{SITE}/#organization",
    "name": "On Target ABA",
    "alternateName": "On Target ABA, LLC",
    "legalName": "Target ABA, LLC",
    "url": f"{SITE}/",
    "logo": {
        "@type": "ImageObject",
        "url": f"{SITE}/assets/images/footerImg.png",
        "width": 500,
        "height": 175,
    },
    "image": f"{SITE}/assets/images/footerImg.png",
    "telephone": "+1-888-989-5011",
    "priceRange": "$$",
    "description": (
        "Compassionate, evidence-based ABA therapy and autism testing for "
        "children. Quality care without the wait. Serving Cleveland, Columbus, "
        "and the Salt Lake Valley."
    ),
    "slogan": "Quality care without the wait.",
    "foundingDate": "2022",
    "founder": {
        "@type": "Person",
        "name": "Ilana Gross",
        "jobTitle": "Clinical Director, BCBA",
        "description": (
            "Board Certified Behavior Analyst with over a decade of experience "
            "in Special Education and ABA. Bachelor's in Speech and Language "
            "Pathology from Touro College; dual Master's in Education and "
            "Special Education from Mercy College; advanced certificate in ABA "
            "from the Florida Institute of Technology."
        ),
    },
    "knowsAbout": [
        "Applied Behavior Analysis",
        "Autism Spectrum Disorder",
        "Early Intervention",
        "Autism Diagnosis and Evaluation",
        "Verbal Behavior",
        "Natural Environment Teaching",
        "Functional Behavior Assessment",
        "Discrete Trial Training",
        "Pivotal Response Treatment",
        "Parent Training",
        "Potty Training for Children with Autism",
        "Social Skills Training",
    ],
    "medicalSpecialty": ["Behavioral", "Pediatrics"],
    "currenciesAccepted": "USD",
    "paymentAccepted": "Cash, Credit Card, Insurance, Medicaid",
    "areaServed": [
        {"@type": "State", "name": "Utah"},
        {"@type": "State", "name": "Ohio"},
        {"@type": "City", "name": "Salt Lake City"},
        {"@type": "City", "name": "Murray"},
        {"@type": "City", "name": "Cleveland"},
        {"@type": "City", "name": "Mayfield Village"},
        {"@type": "City", "name": "Columbus"},
        {"@type": "City", "name": "Gahanna"},
        {"@type": "City", "name": "Worthington"},
    ],
    "department": [
        {
            "@type": "MedicalClinic",
            "@id": f"{SITE}/#clinic-utah",
            "name": "On Target ABA &mdash; Murray (Salt Lake Valley)",
            "url": f"{SITE}/murray-utah/",
            "telephone": "+1-385-550-3500",
            "image": f"{SITE}/assets/images/footerImg.png",
            "priceRange": "$$",
            "openingHours": "Mo-Fr 08:00-17:00",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "5444 South Green Street",
                "addressLocality": "Murray",
                "addressRegion": "UT",
                "postalCode": "84123",
                "addressCountry": "US",
            },
            "geo": {"@type": "GeoCoordinates", "latitude": 40.6510, "longitude": -111.8889},
            "medicalSpecialty": "Behavioral",
            "areaServed": [
                "Salt Lake City", "Murray", "West Jordan", "Sandy", "South Jordan",
                "Draper", "Midvale", "Cottonwood Heights", "Holladay", "Taylorsville",
            ],
        },
        {
            "@type": "MedicalClinic",
            "@id": f"{SITE}/#clinic-cleveland",
            "name": "On Target ABA &mdash; Cleveland / Mayfield",
            "url": f"{SITE}/locations/",
            "telephone": "+1-216-343-1198",
            "image": f"{SITE}/assets/images/footerImg.png",
            "priceRange": "$$",
            "openingHours": "Mo-Fr 08:00-17:00",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "767 Beta Dr, Suite C",
                "addressLocality": "Mayfield Village",
                "addressRegion": "OH",
                "postalCode": "44143",
                "addressCountry": "US",
            },
            "geo": {"@type": "GeoCoordinates", "latitude": 41.5187, "longitude": -81.4413},
            "medicalSpecialty": "Behavioral",
            "areaServed": ["Cleveland", "Akron", "Mayfield Village", "Mayfield Heights", "Cleveland Heights"],
        },
        {
            "@type": "MedicalClinic",
            "@id": f"{SITE}/#clinic-gahanna",
            "name": "On Target ABA &mdash; Columbus / Gahanna",
            "url": f"{SITE}/locations/",
            "telephone": "+1-614-681-1030",
            "image": f"{SITE}/assets/images/footerImg.png",
            "priceRange": "$$",
            "openingHours": "Mo-Fr 08:00-17:00",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "2760 Airport Dr, Suite 110",
                "addressLocality": "Columbus",
                "addressRegion": "OH",
                "postalCode": "43219",
                "addressCountry": "US",
            },
            "geo": {"@type": "GeoCoordinates", "latitude": 39.9939, "longitude": -82.8859},
            "medicalSpecialty": "Behavioral",
            "areaServed": ["Columbus", "Gahanna", "Franklin County", "Delaware County"],
        },
        {
            "@type": "MedicalClinic",
            "@id": f"{SITE}/#clinic-worthington",
            "name": "On Target ABA &mdash; Columbus / Worthington",
            "url": f"{SITE}/locations/",
            "telephone": "+1-614-681-1030",
            "image": f"{SITE}/assets/images/footerImg.png",
            "priceRange": "$$",
            "openingHours": "Mo-Fr 08:00-17:00",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "130 E Wilson Bridge Rd, Suite 200",
                "addressLocality": "Worthington",
                "addressRegion": "OH",
                "postalCode": "43085",
                "addressCountry": "US",
            },
            "geo": {"@type": "GeoCoordinates", "latitude": 40.0934, "longitude": -83.0179},
            "medicalSpecialty": "Behavioral",
            "areaServed": ["Worthington", "Columbus", "Union County", "Delaware County"],
        },
    ],
    "contactPoint": [
        {
            "@type": "ContactPoint",
            "telephone": "+1-888-989-5011",
            "contactType": "customer service",
            "availableLanguage": "English",
            "areaServed": "US",
        },
        {
            "@type": "ContactPoint",
            "telephone": "+1-385-550-3500",
            "contactType": "Utah Clinic",
            "areaServed": "UT",
        },
        {
            "@type": "ContactPoint",
            "telephone": "+1-216-343-1198",
            "contactType": "Cleveland Clinic",
            "areaServed": "OH",
        },
        {
            "@type": "ContactPoint",
            "telephone": "+1-614-681-1030",
            "contactType": "Columbus Clinic",
            "areaServed": "OH",
        },
    ],
    "makesOffer": [
        {"@type": "Offer", "name": "Center-Based ABA Therapy", "url": f"{SITE}/center-based-aba-therapy/"},
        {"@type": "Offer", "name": "In-Home ABA Therapy", "url": f"{SITE}/in-home-aba-therapy/"},
        {"@type": "Offer", "name": "Early Intervention Autism Program", "url": f"{SITE}/early-intervention-autism-program/"},
        {"@type": "Offer", "name": "Autism Testing &amp; Evaluations", "url": f"{SITE}/on-target-aba-autism-testing-autism-evaluations/"},
        {"@type": "Offer", "name": "Potty Training Program", "url": f"{SITE}/potty-training-progam/"},
    ],
    "sameAs": [
        "https://www.facebook.com/ontargetaba",
        "https://www.instagram.com/ontargetaba",
        "https://www.linkedin.com/company/ontargetaba/",
    ],
}

# --------------------------------------------------- reviews + ratings
# Real Google / parent reviews shown on the index.html marquees. Used to
# emit Review + AggregateRating JSON-LD on index.html and autism-testing.html.
# Quotes are stripped of HTML entities and converted to plain ASCII.

REVIEWS = [
    {
        "author": "S. R.",
        "body": "My child runs off to his therapist every time. It's amazing.",
    },
    {
        "author": "A. D.",
        "body": "The therapists are so warm and really knowledgeable.",
    },
    {
        "author": "C. S.",
        "body": "My child loves his therapist. When I pick him up, he doesn't want to leave!",
    },
    {
        "author": "Andreana Tadaj",
        "body": (
            "This is a phenomenal ABA center. Everyone at the center is really "
            "kind and patient with my son. I have seen a huge improvement with "
            "him. I'm truly grateful for everyone at On Target. Thank you."
        ),
    },
    {
        "author": "Carmen E.",
        "body": (
            "My son is a level 3 autistic. He has improved SO much here! He "
            "even found 2 of the therapists he really loves making him want to "
            "come to school."
        ),
    },
    {
        "author": "Zi Zi World Tarpeh",
        "body": (
            "My twins are currently attending one of the centers. We have had "
            "an amazing experience with On Target, especially the airport "
            "location. 5 stars all around - my family appreciates you guys so "
            "much. Very quickly responds to any concerns we have, and always "
            "meets with solutions!"
        ),
    },
    {
        "author": "D. M.",
        "body": (
            "Very professional staff who are very knowledgeable about Autism. "
            "Highly recommend to any parent who wants excellent therapy for "
            "their child."
        ),
    },
    {
        "author": "Jack M.",
        "body": "Beautiful facility. Clean, updated, safe, spacious, with great equipment.",
    },
    {
        "author": "Ruchie Kaplan",
        "body": "Beautifully renovated. Fresh and clean. Attentive, experienced staff. Always a pleasure to go there!",
    },
]

def review_nodes() -> list[dict]:
    nodes = []
    for r in REVIEWS:
        nodes.append({
            "@type": "Review",
            "author": {"@type": "Person", "name": r["author"]},
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": 5,
                "bestRating": 5,
            },
            "reviewBody": r["body"],
            "itemReviewed": {"@id": f"{SITE}/#organization"},
        })
    return nodes

AGGREGATE_RATING_LD = {
    "@type": "AggregateRating",
    "ratingValue": 5.0,
    "reviewCount": len(REVIEWS),
    "bestRating": 5,
    "worstRating": 5,
    "itemReviewed": {"@id": f"{SITE}/#organization"},
}

WEBSITE_LD = {
    "@type": "WebSite",
    "@id": f"{SITE}/#website",
    "url": f"{SITE}/",
    "name": "On Target ABA",
    "description": "ABA therapy and autism testing for children. Quality care without the wait.",
    "publisher": {"@id": f"{SITE}/#organization"},
    "inLanguage": "en-US",
    "potentialAction": [{
        "@type": "SearchAction",
        "target": {
            "@type": "EntryPoint",
            "urlTemplate": f"{SITE}/?s={{search_term_string}}",
        },
        "query-input": "required name=search_term_string",
    }],
}

# --------------------------------------------------------- per-page registry

# Each entry: filename -> dict
#   title:    page title (for <title>, og:title, schema)
#   desc:     meta description (for <meta name=description>, og:description)
#   crumbs:   list of (label, slug_or_None_for_current)
#   primary:  optional extra JSON-LD node specific to this page (Service, FAQPage,
#             MedicalProcedure, ContactPage, etc.)
#   image:    OG/Twitter share image (defaults to logo)
#
# `None` slug in a crumb tuple means "this is the current page" (no link).
SEO_PAGES = {
    "index.html": {
        "title": "ABA Therapy &amp; Autism Testing | On Target ABA",
        "desc": "Quality care without the wait. Compassionate, evidence-based ABA therapy and autism testing for children ages 2&ndash;18. Now serving the Salt Lake Valley.",
        "keywords": "ABA therapy, autism testing, applied behavior analysis, autism evaluation Salt Lake City, ABA therapy Cleveland, ABA therapy Columbus, BCBA, early intervention, autism diagnosis Utah",
        "crumbs": [("Home", None)],
        "primary_type": "WebPage",
    },
    "about.html": {
        "title": "About Us — Mission &amp; Founder | On Target ABA",
        "desc": "Learn about On Target ABA: our mission, family-focused approach to ABA therapy, and Clinical Director &amp; BCBA Ilana Gross.",
        "keywords": "On Target ABA about, Ilana Gross BCBA, ABA clinic mission, family-focused autism therapy",
        "crumbs": [("Home", "index.html"), ("About", None)],
        "primary_type": "AboutPage",
    },
    "our-process.html": {
        "title": "Our Process — How ABA Therapy Starts &amp; Progresses at On Target ABA",
        "desc": "From intake to first session in less than 72 hours. Walk through our compassionate, step-by-step ABA therapy process for families.",
        "keywords": "ABA intake process, how to start ABA therapy, ABA therapy steps, On Target ABA process",
        "crumbs": [("Home", "index.html"), ("About", "about.html"), ("Our Process", None)],
        "primary_type": "WebPage",
    },
    "clinical-philosophy.html": {
        "title": "Our Clinical Philosophy — What ABA Looks Like at On Target",
        "desc": "Play-based, family-centered ABA from a BCBA-led team. How we differ from compliance-training ABA and what that means for your child's care.",
        "keywords": "On Target ABA philosophy, play-based ABA, naturalistic ABA, family-centered ABA, Ilana Gross BCBA approach",
        "crumbs": [("Home", "index.html"), ("About", "about.html"), ("Clinical Philosophy", None)],
        "primary_type": "AboutPage",
    },
    "our-services.html": {
        "title": "ABA Therapy Programs &amp; Services | On Target ABA",
        "desc": "Center-based, in-home, school-based, and daycare-based ABA therapy. Early intervention, potty training, autism testing — all evidence-based, all family-focused.",
        "keywords": "ABA therapy services, center-based ABA, in-home ABA, school-based ABA, autism programs Ohio Utah",
        "crumbs": [("Home", "index.html"), ("Services", None)],
        "primary_type": "Service",
    },
    "center-based-aba-therapy.html": {
        "title": "Center-Based ABA Therapy — Structured, Engaging Sessions",
        "desc": "Center-based ABA therapy in dedicated, kid-friendly clinics. Small ratios, structured sessions, real progress.",
        "keywords": "center-based ABA, ABA clinic, autism clinic Cleveland Columbus Utah, 1-on-1 ABA therapy",
        "crumbs": [("Home", "index.html"), ("Services", "our-services.html"), ("Center-Based ABA", None)],
        "primary_type": "Service",
    },
    "in-home-aba-therapy.html": {
        "title": "In-Home &amp; School-Based ABA Therapy — Skills in Real Life",
        "desc": "ABA therapy delivered in your home or your child's school, where life actually happens. Parent coaching built in.",
        "keywords": "in-home ABA therapy, school-based ABA, in-home autism therapy, parent training ABA",
        "crumbs": [("Home", "index.html"), ("Services", "our-services.html"), ("In-Home ABA", None)],
        "primary_type": "Service",
    },
    "early-intervention-autism-program.html": {
        "title": "Early Intervention Autism Program — The Earlier, the Better",
        "desc": "Our specialized early intervention day program. The earlier we see your child, the quicker and greater the success.",
        "keywords": "early intervention autism, autism day program, early ABA therapy, toddler autism therapy",
        "crumbs": [("Home", "index.html"), ("Services", "our-services.html"), ("Early Intervention", None)],
        "primary_type": "Service",
    },
    "potty-training-program.html": {
        "title": "Potty Training Program for Children with Autism",
        "desc": "A structured, gentle, evidence-based potty training program for children with autism.",
        "keywords": "autism potty training, ABA potty training program, toilet training autism",
        "crumbs": [("Home", "index.html"), ("Services", "our-services.html"), ("Potty Training", None)],
        "primary_type": "Service",
    },
    "autism-testing.html": {
        "title": "Autism Testing in Salt Lake City — No Waitlist, $0 for Most Families",
        "desc": "Fast autism evaluations in the Salt Lake Valley. Most families pay $0 through insurance. Usually scheduled within a week.",
        "keywords": "autism testing Salt Lake City, autism evaluation Utah, autism diagnosis Murray, autism testing no waitlist, free autism testing",
        "crumbs": [("Home", "index.html"), ("Services", "our-services.html"), ("Autism Testing", None)],
        "primary_type": "MedicalProcedure",
    },
    "murray-utah.html": {
        "title": "ABA Therapy in Murray, Utah — On Target ABA Salt Lake Valley",
        "desc": "Center-based and in-home ABA therapy plus autism testing in Murray, Utah. Serving the Salt Lake Valley.",
        "keywords": "ABA therapy Murray UT, ABA therapy Salt Lake City, autism clinic Utah, autism services Murray",
        "crumbs": [("Home", "index.html"), ("Locations", "locations.html"), ("Murray, Utah", None)],
        "primary_type": "LocalLocation",
    },
    "mayfield-ohio.html": {
        "title": "ABA Therapy in Mayfield Village &amp; Cleveland, Ohio &mdash; On Target ABA",
        "desc": "Center-based and in-home ABA therapy plus autism testing at our expanded Mayfield Village clinic. Serving Greater Cleveland and Akron.",
        "keywords": "ABA therapy Cleveland OH, ABA therapy Mayfield Village, autism clinic Cleveland, autism services Akron Ohio",
        "crumbs": [("Home", "index.html"), ("Locations", "locations.html"), ("Mayfield Village, Ohio", None)],
        "primary_type": "LocalLocation",
    },
    "gahanna-ohio.html": {
        "title": "ABA Therapy in Gahanna, Ohio | On Target ABA",
        "desc": "Center-based and in-home ABA therapy plus autism testing at our Gahanna / Columbus Airport center. Serving east Columbus and Franklin County.",
        "keywords": "ABA therapy Gahanna OH, ABA therapy Columbus, autism clinic east Columbus, ABA New Albany Westerville",
        "crumbs": [("Home", "index.html"), ("Locations", "locations.html"), ("Gahanna, Ohio", None)],
        "primary_type": "LocalLocation",
    },
    "worthington-ohio.html": {
        "title": "ABA Therapy in Worthington &amp; North Columbus, Ohio &mdash; On Target ABA",
        "desc": "Center-based and in-home ABA therapy plus autism testing at our Worthington center. Serving Dublin, Powell, Lewis Center, and the north Columbus suburbs.",
        "keywords": "ABA therapy Worthington OH, ABA therapy north Columbus, autism clinic Dublin Powell, ABA Delaware County",
        "crumbs": [("Home", "index.html"), ("Locations", "locations.html"), ("Worthington, Ohio", None)],
        "primary_type": "LocalLocation",
    },
    "locations.html": {
        "title": "Our Locations — ABA Therapy Clinics in Utah &amp; Ohio",
        "desc": "Four On Target ABA clinics serving Salt Lake City, Cleveland, and Columbus. Addresses, phone numbers, hours, and coverage areas.",
        "keywords": "ABA therapy locations, autism clinic Ohio Utah, ABA Cleveland Columbus Murray",
        "crumbs": [("Home", "index.html"), ("Locations", None)],
        "primary_type": "WebPage",
    },
    "insurance.html": {
        "title": "Insurance &amp; Coverage — On Target ABA Accepts Most Major Plans",
        "desc": "We accept most major insurance, including Medicaid. Our team verifies your benefits so you know exactly what to expect.",
        "keywords": "ABA therapy insurance, autism insurance coverage, Medicaid ABA, Molina ABA, Ambetter ABA, Buckeye ABA",
        "crumbs": [("Home", "index.html"), ("Insurance", None)],
        "primary_type": "WebPage",
    },
    "faqs.html": {
        "title": "FAQs — Common Questions About ABA Therapy &amp; Autism",
        "desc": "Answers to the most common parent questions about ABA therapy, autism diagnosis, insurance, scheduling, and getting started.",
        "keywords": "ABA therapy FAQ, autism therapy questions, ABA insurance questions, when to start ABA",
        "crumbs": [("Home", "index.html"), ("FAQs", None)],
        "primary_type": "FAQPage",
    },
    "careers.html": {
        "title": "Careers at On Target ABA — Join Our Team",
        "desc": "Join On Target ABA. Open BCBA, RBT, and operations roles. Family-focused culture, flexible scheduling, real impact.",
        "keywords": "BCBA jobs, RBT jobs, ABA careers, autism therapist jobs Ohio Utah",
        "crumbs": [("Home", "index.html"), ("Careers", None)],
        "primary_type": "WebPage",
    },
    "become-an-rbt.html": {
        "title": "Become an RBT at On Target ABA — Training &amp; Hiring",
        "desc": "How to become a Registered Behavior Technician (RBT) at On Target ABA. We provide the 40-hour training, mentor you through the exam, and hire in Utah and Ohio.",
        "keywords": "become an RBT, RBT training, RBT jobs Utah Ohio, behavior technician training, BCBA pathway",
        "crumbs": [("Home", "index.html"), ("Careers", "careers.html"), ("Become an RBT", None)],
        "primary_type": "WebPage",
    },
    "why-work-at-on-target-aba.html": {
        "title": "Why Work at On Target ABA — A BCBA-Led Team",
        "desc": "Lower caseloads, real BCBA mentorship, and a clear growth path from RBT to BCBA. What it's actually like to work at On Target ABA.",
        "keywords": "why work at On Target ABA, ABA company culture, BCBA mentorship, RBT growth pathway",
        "crumbs": [("Home", "index.html"), ("Careers", "careers.html"), ("Why Work Here", None)],
        "primary_type": "WebPage",
    },
    "contact.html": {
        "title": "Contact On Target ABA — We'd Love to Hear From You",
        "desc": "Contact On Target ABA for ABA therapy and autism testing. Call (888) 989-5011 or message our friendly team.",
        "keywords": "contact On Target ABA, ABA therapy contact, autism therapy phone",
        "crumbs": [("Home", "index.html"), ("Contact", None)],
        "primary_type": "ContactPage",
    },
    "pre-intake-form.html": {
        "title": "Pre-Intake Form — Start Your ABA Therapy Journey",
        "desc": "Get started with On Target ABA in under 30 seconds. Quick pre-intake form so we can verify benefits and schedule fast.",
        "keywords": "ABA intake form, autism therapy intake, get started ABA",
        "crumbs": [("Home", "index.html"), ("Contact", "contact.html"), ("Pre-Intake Form", None)],
        "primary_type": "WebPage",
    },
    "aba-therapy-guide.html": {
        "title": "Everything You Need to Know About ABA Therapy — A Parent's Guide",
        "desc": "A complete, parent-friendly guide to ABA therapy: what it is, how it works, what to expect, and how to get started.",
        "keywords": "ABA therapy guide, what is ABA, ABA therapy explained, parent guide to ABA, applied behavior analysis basics",
        "crumbs": [("Home", "index.html"), ("Resources", None), ("ABA Therapy Guide", None)],
        "primary_type": "Article",
    },
    "blog.html": {
        "title": "On Target ABA Blog — ABA Therapy &amp; Autism Resources for Families",
        "desc": "Articles, guides, and resources from On Target ABA's clinical team. Practical advice for parents and caregivers.",
        "keywords": "ABA therapy blog, autism resources, parent guides autism, BCBA articles, ABA tips",
        "crumbs": [("Home", "index.html"), ("Blog", None)],
        "primary_type": "Blog",
    },
    "job-application.html": {
        "title": "Job Application — On Target ABA Careers",
        "desc": "Apply for a position at On Target ABA. BCBA, RBT, and operations openings.",
        "keywords": "ABA job application, BCBA application Ohio Utah",
        "crumbs": [("Home", "index.html"), ("Careers", "careers.html"), ("Job Application", None)],
        "primary_type": "WebPage",
    },
    "employment-application.html": {
        "title": "Employment Application — On Target ABA",
        "desc": "Complete the On Target ABA employment application: credentials, history, and references.",
        "keywords": "ABA employment application, autism therapist application",
        "crumbs": [("Home", "index.html"), ("Careers", "careers.html"), ("Employment Application", None)],
        "primary_type": "WebPage",
    },
    "thank-you.html": {
        "title": "Thank You — We'll Be in Touch",
        "desc": "Thanks for reaching out to On Target ABA. We'll be in touch shortly.",
        "keywords": "thank you On Target ABA",
        "crumbs": [("Home", "index.html"), ("Thank You", None)],
        "primary_type": "WebPage",
        "noindex": True,
    },
    "thank-you-confirmation.html": {
        "title": "Thank You — Submission Confirmed",
        "desc": "Your submission was received. A member of our team will reach out soon.",
        "keywords": "thank you confirmation On Target ABA",
        "crumbs": [("Home", "index.html"), ("Thank You", None)],
        "primary_type": "WebPage",
        "noindex": True,
    },
    "privacy-policy.html": {
        "title": "Privacy Policy — On Target ABA",
        "desc": "Read the On Target ABA privacy policy.",
        "keywords": "On Target ABA privacy policy",
        "crumbs": [("Home", "index.html"), ("Legal", None), ("Privacy Policy", None)],
        "primary_type": "WebPage",
    },
    "terms-of-service.html": {
        "title": "Terms of Service — On Target ABA",
        "desc": "Read the On Target ABA terms of service.",
        "keywords": "On Target ABA terms of service",
        "crumbs": [("Home", "index.html"), ("Legal", None), ("Terms of Service", None)],
        "primary_type": "WebPage",
    },
    "cookie-consent.html": {
        "title": "Cookie &amp; Privacy Preferences — On Target ABA",
        "desc": "Manage your cookie preferences for ontargetaba.com.",
        "keywords": "On Target ABA cookies",
        "crumbs": [("Home", "index.html"), ("Legal", None), ("Cookies", None)],
        "primary_type": "WebPage",
    },
    "disclaimer.html": {
        "title": "Disclaimer — On Target ABA",
        "desc": "Read the On Target ABA disclaimer.",
        "keywords": "On Target ABA disclaimer",
        "crumbs": [("Home", "index.html"), ("Legal", None), ("Disclaimer", None)],
        "primary_type": "WebPage",
    },
    "icon-attribution.html": {
        "title": "Icon &amp; Image Credits — On Target ABA",
        "desc": "Attributions for icons and images used across ontargetaba.com.",
        "keywords": "icon attribution credits",
        "crumbs": [("Home", "index.html"), ("Legal", None), ("Icon Attribution", None)],
        "primary_type": "WebPage",
    },
}

# ---------------------------------------------------- per-page-type extras

def service_node(name: str, url: str, desc: str) -> dict:
    return {
        "@type": "Service",
        "name": name,
        "url": url,
        "description": desc,
        "provider": {"@id": f"{SITE}/#organization"},
        "serviceType": "Applied Behavior Analysis",
        "areaServed": [{"@type": "State", "name": "Utah"}, {"@type": "State", "name": "Ohio"}],
        "audience": {"@type": "PeopleAudience", "suggestedMinAge": 2, "suggestedMaxAge": 18},
    }

def medical_procedure_autism_testing(url: str) -> dict:
    return {
        "@type": "MedicalProcedure",
        "name": "Autism Spectrum Disorder Evaluation",
        "url": url,
        "procedureType": "https://schema.org/DiagnosticProcedure",
        "howPerformed": (
            "Parent interview &amp; developmental history; standardized autism "
            "assessment using validated tools; structured observation by a "
            "licensed psychologist; written diagnostic report; clear next steps."
        ),
        "preparation": "Bring developmental history, any prior reports, and your insurance information.",
        "followup": (
            "If diagnosed, we coordinate ABA therapy services so families do not "
            "have to start over with a new provider."
        ),
        "provider": {"@id": f"{SITE}/#organization"},
        "performer": {"@id": f"{SITE}/#organization"},
    }

def faq_extras() -> list[dict]:
    """Pull the canonical FAQs from the scraped file if available."""
    md = ROOT / "scraped" / "faqs.md"
    if not md.exists():
        return []
    text = md.read_text(encoding="utf-8", errors="ignore")
    qa: list[tuple[str, str]] = []
    sections = re.split(r"^###\s+", text, flags=re.M)
    for s in sections[1:]:
        first_nl = s.find("\n")
        if first_nl < 0:
            continue
        q = s[:first_nl].strip()
        a = s[first_nl + 1 :].split("##")[0].strip()
        a = re.sub(r"\n+", " ", a).strip()
        if q and a and "?" in q:
            qa.append((q, a))
    if not qa:
        return []
    return [{
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a},
            }
            for q, a in qa
        ],
    }]

def per_page_extras(slug: str, page: dict, page_url: str) -> list[dict]:
    t = page.get("primary_type")
    nodes: list[dict] = []
    if t == "AboutPage":
        nodes.append({
            "@type": "AboutPage",
            "@id": f"{page_url}#aboutpage",
            "name": page["title"],
            "url": page_url,
            "about": {"@id": f"{SITE}/#organization"},
            "mainEntity": ORG_LD["founder"],
        })
    elif t == "ContactPage":
        nodes.append({
            "@type": "ContactPage",
            "@id": f"{page_url}#contactpage",
            "name": page["title"],
            "url": page_url,
            "about": {"@id": f"{SITE}/#organization"},
        })
    elif t == "FAQPage":
        nodes.extend(faq_extras())
    elif t == "MedicalProcedure":
        nodes.append(medical_procedure_autism_testing(page_url))
    elif t == "Service":
        # Map filename -> service description
        services = {
            "center-based-aba-therapy.html": ("Center-Based ABA Therapy", "Structured 1-on-1 and group ABA sessions in a dedicated, kid-friendly clinic environment."),
            "in-home-aba-therapy.html": ("In-Home &amp; School-Based ABA Therapy", "ABA therapy delivered in the home or school setting with built-in parent coaching."),
            "early-intervention-autism-program.html": ("Early Intervention Autism Program", "Specialized day program for young children with autism focused on maximal early gains."),
            "potty-training-program.html": ("Potty Training Program", "Structured, gentle, evidence-based potty training for children with autism."),
            "our-services.html": ("ABA Therapy Services", "Comprehensive ABA therapy programs including center-based, in-home, school-based, early intervention, and autism testing."),
        }
        info = services.get(slug)
        if info:
            nodes.append(service_node(info[0], page_url, info[1]))
    elif t == "LocalLocation":
        clinics = {
            "murray-utah.html": {
                "name": "On Target ABA &mdash; Murray (Salt Lake Valley)",
                "telephone": "+1-385-550-3500",
                "streetAddress": "5444 South Green Street",
                "addressLocality": "Murray",
                "addressRegion": "UT",
                "postalCode": "84123",
                "latitude": 40.6510,
                "longitude": -111.8889,
            },
            "mayfield-ohio.html": {
                "name": "On Target ABA &mdash; Cleveland / Mayfield Village",
                "telephone": "+1-216-343-1198",
                "streetAddress": "767 Beta Dr, Suite C",
                "addressLocality": "Mayfield Village",
                "addressRegion": "OH",
                "postalCode": "44143",
                "latitude": 41.5187,
                "longitude": -81.4413,
            },
            "gahanna-ohio.html": {
                "name": "On Target ABA &mdash; Columbus / Gahanna (Airport)",
                "telephone": "+1-614-681-1030",
                "streetAddress": "2760 Airport Dr, Suite 110",
                "addressLocality": "Columbus",
                "addressRegion": "OH",
                "postalCode": "43219",
                "latitude": 39.9939,
                "longitude": -82.8859,
            },
            "worthington-ohio.html": {
                "name": "On Target ABA &mdash; Columbus / Worthington",
                "telephone": "+1-614-681-1030",
                "streetAddress": "130 E Wilson Bridge Rd, Suite 200",
                "addressLocality": "Worthington",
                "addressRegion": "OH",
                "postalCode": "43085",
                "latitude": 40.0934,
                "longitude": -83.0179,
            },
        }
        c = clinics.get(slug, clinics["murray-utah.html"])
        nodes.append({
            "@type": "MedicalClinic",
            "@id": f"{page_url}#localbusiness",
            "name": c["name"],
            "url": page_url,
            "telephone": c["telephone"],
            "image": f"{SITE}/assets/images/footerImg.png",
            "priceRange": "$$",
            "openingHours": "Mo-Fr 08:00-17:00",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": c["streetAddress"],
                "addressLocality": c["addressLocality"],
                "addressRegion": c["addressRegion"],
                "postalCode": c["postalCode"],
                "addressCountry": "US",
            },
            "geo": {"@type": "GeoCoordinates", "latitude": c["latitude"], "longitude": c["longitude"]},
            "parentOrganization": {"@id": f"{SITE}/#organization"},
        })
    elif t == "Article":
        nodes.append({
            "@type": "Article",
            "@id": f"{page_url}#article",
            "headline": page["title"],
            "description": page["desc"],
            "url": page_url,
            "author": {"@id": f"{SITE}/#organization"},
            "publisher": {"@id": f"{SITE}/#organization"},
            "image": f"{SITE}/assets/images/footerImg.png",
            "datePublished": "2024-01-01",
            "dateModified": "2026-06-04",
        })
    elif t == "Blog":
        nodes.append({
            "@type": "Blog",
            "@id": f"{page_url}#blog",
            "name": "On Target ABA Blog",
            "url": page_url,
            "publisher": {"@id": f"{SITE}/#organization"},
            "description": page["desc"],
        })
    return nodes

# ----------------------------------------------------------- HTML helpers

START_MARK = "<!-- auto-seo-start -->"
END_MARK = "<!-- auto-seo-end -->"
CRUMB_START = "<!-- auto-crumb-start -->"
CRUMB_END = "<!-- auto-crumb-end -->"

AUTO_SEO_RE = re.compile(
    re.escape(START_MARK) + r"[\s\S]*?" + re.escape(END_MARK) + r"\s*", re.M
)
AUTO_CRUMB_RE = re.compile(
    re.escape(CRUMB_START) + r"[\s\S]*?" + re.escape(CRUMB_END) + r"\s*", re.M
)

def resolve_og_image(slug: str) -> str:
    """Return the SVG OG image URL for this page if one exists in
    assets/og/, else fall back to the global logo.

    Slug mapping: `index.html` -> `home.svg`; everything else strips the
    `.html` suffix. Generated by scripts/gen-og-images.mjs.
    """
    default = f"{SITE}/assets/images/footerImg.png"
    if slug == "index.html":
        og_name = "home.svg"
    else:
        og_name = slug.replace(".html", "") + ".svg"
    og_path = ROOT / "assets" / "og" / og_name
    if og_path.exists():
        return f"{SITE}/assets/og/{og_name}"
    return default


def build_head_block(slug: str, page: dict) -> str:
    page_url = f"{SITE}/" if slug == "index.html" else f"{SITE}/{slug.replace('.html', '/')}"
    title = page["title"]
    desc = page["desc"]
    keywords = page.get("keywords", "")
    # Prefer per-page generated OG image (1200x630 SVG); fall back to logo.
    image = page.get("image") or resolve_og_image(slug)
    noindex = page.get("noindex", False)
    # Admin overrides (assets/data/page-seo.json) can split og:* and
    # twitter:* away from the default title/desc. Fall back to title/desc
    # when no override is set so the existing pages are byte-identical.
    og_title = page.get("og_title") or title
    og_description = page.get("og_description") or desc
    twitter_title = page.get("twitter_title") or title
    twitter_description = page.get("twitter_description") or desc
    twitter_image = page.get("twitter_image") or image

    crumb_items = []
    for i, (label, href) in enumerate(page["crumbs"], start=1):
        if href is None:
            item_url = page_url
        elif href == "index.html":
            item_url = f"{SITE}/"
        else:
            item_url = f"{SITE}/{href.replace('.html', '/')}"
        crumb_items.append({
            "@type": "ListItem",
            "position": i,
            "name": label,
            "item": item_url,
        })

    webpage_node = {
        "@type": "WebPage",
        "@id": f"{page_url}#webpage",
        "url": page_url,
        "name": title,
        "description": desc,
        "isPartOf": {"@id": f"{SITE}/#website"},
        "about": {"@id": f"{SITE}/#organization"},
        "inLanguage": "en-US",
        "breadcrumb": {"@id": f"{page_url}#breadcrumb"},
        "primaryImageOfPage": {"@type": "ImageObject", "url": image},
    }

    breadcrumb_node = {
        "@type": "BreadcrumbList",
        "@id": f"{page_url}#breadcrumb",
        "itemListElement": crumb_items,
    }

    graph_nodes = [ORG_LD, WEBSITE_LD, webpage_node, breadcrumb_node]
    graph_nodes.extend(per_page_extras(slug, page, page_url))

    # Reviews + AggregateRating only on the highest-intent landing pages.
    if slug in ("index.html", "autism-testing.html"):
        graph_nodes.append(AGGREGATE_RATING_LD)
        graph_nodes.extend(review_nodes())

    jsonld = {
        "@context": "https://schema.org",
        "@graph": graph_nodes,
    }

    jsonld_str = json.dumps(jsonld, indent=2, ensure_ascii=False)

    robots_line = ""
    if noindex:
        robots_line = '<meta name="robots" content="noindex, nofollow" />'

    head_lines = [
        START_MARK,
        f'<link rel="canonical" href="{page_url}" />',
        # Self-referential hreflang on every page. Site is currently
        # English-only (en-US) for US-Utah and US-Ohio regions. If/when
        # Spanish or other language variants ship, add additional
        # <link rel="alternate" hreflang="..."> entries here.
        f'<link rel="alternate" hreflang="en-us" href="{page_url}" />',
        f'<link rel="alternate" hreflang="x-default" href="{page_url}" />',
        '<meta name="theme-color" content="#00B7EA" />',
        f'<meta name="keywords" content="{keywords}" />',
        '<meta name="author" content="On Target ABA" />',
        '<meta name="publisher" content="On Target ABA, LLC" />',
        robots_line,
        '<meta property="og:type" content="website" />',
        '<meta property="og:site_name" content="On Target ABA" />',
        '<meta property="og:locale" content="en_US" />',
        f'<meta property="og:url" content="{page_url}" />',
        f'<meta property="og:title" content="{og_title}" />',
        f'<meta property="og:description" content="{og_description}" />',
        f'<meta property="og:image" content="{image}" />',
        ('<meta property="og:image:width" content="1200" />'
         if image.endswith('.svg') else
         '<meta property="og:image:width" content="500" />'),
        ('<meta property="og:image:height" content="630" />'
         if image.endswith('.svg') else
         '<meta property="og:image:height" content="175" />'),
        '<meta name="twitter:card" content="summary_large_image" />',
        '<meta name="twitter:site" content="@ontargetaba" />',
        f'<meta name="twitter:title" content="{twitter_title}" />',
        f'<meta name="twitter:description" content="{twitter_description}" />',
        f'<meta name="twitter:image" content="{twitter_image}" />',
        '<meta name="geo.region" content="US-UT" />',
        '<meta name="geo.placename" content="Murray, Utah" />',
        '<meta name="geo.position" content="40.6510;-111.8889" />',
        '<meta name="ICBM" content="40.6510, -111.8889" />',
        '<script type="application/ld+json">',
        jsonld_str,
        '</script>',
        END_MARK,
    ]
    return "\n".join(l for l in head_lines if l).strip() + "\n"


def build_breadcrumb_html(page: dict) -> str:
    """Server-render visible breadcrumb nav into static HTML so bots
    without JS, link previewers, and Lighthouse all see it. header.js
    detects the existing nav and skips its own runtime render to avoid
    duplicates. JSON-LD BreadcrumbList ships separately via the @graph
    in build_head_block()."""
    crumbs = page["crumbs"]
    if len(crumbs) <= 1:
        return ""  # no breadcrumb on the homepage
    parts = []
    for i, (label, href) in enumerate(crumbs):
        is_last = i == len(crumbs) - 1
        if href is None or is_last:
            parts.append(
                f'<span class="text-ink font-semibold" aria-current="page">{label}</span>'
            )
        else:
            parts.append(
                f'<a href="{href}" class="hover:text-coral transition">{label}</a>'
            )
    sep = '<svg class="w-3 h-3 text-mute shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
    inner = f' {sep} '.join(parts)
    return (
        f'{CRUMB_START}\n'
        f'<nav aria-label="Breadcrumb" class="bg-cream/60 border-b border-line" data-static-breadcrumb>\n'
        f'  <div class="max-w-7xl mx-auto px-5 py-3 text-sm text-mute flex items-center gap-2 flex-wrap">\n'
        f'    {inner}\n'
        f'  </div>\n'
        f'</nav>\n'
        f'{CRUMB_END}\n'
    )


def inject(path: Path, slug: str, page: dict) -> bool:
    raw = path.read_bytes()
    # strip BOM if present so regex operates on plain text
    bom = raw.startswith(b"\xef\xbb\xbf")
    text = raw[3:].decode("utf-8") if bom else raw.decode("utf-8")
    orig = text

    # 1) Strip any prior auto-injection
    text = AUTO_SEO_RE.sub("", text)
    text = AUTO_CRUMB_RE.sub("", text)

    # 2) Build new blocks
    head_block = build_head_block(slug, page)
    crumb_block = build_breadcrumb_html(page)

    # 3) Inject SEO block right before </head>
    if "</head>" not in text:
        print(f"  ! no </head> in {slug}, skipping")
        return False
    text = text.replace("</head>", head_block + "</head>", 1)

    # 4) Inject breadcrumbs immediately after the closing </header>.
    # Most pages now use the data-driven `<div id="site-header">` slot
    # filled by assets/js/header.js at runtime, so we anchor to that
    # if the static </header> isn't present.
    if crumb_block:
        if "</header>" in text:
            text = text.replace("</header>", "</header>\n" + crumb_block, 1)
        elif '<div id="site-header"></div>' in text:
            text = text.replace(
                '<div id="site-header"></div>',
                '<div id="site-header"></div>\n' + crumb_block,
                1,
            )
        else:
            print(f"  ! no </header> or #site-header in {slug}, breadcrumb skipped")

    if text == orig:
        return False

    out = (b"\xef\xbb\xbf" if bom else b"") + text.encode("utf-8")
    path.write_bytes(out)
    return True


def load_admin_overrides() -> dict:
    """Per-page SEO overrides written by the admin dashboard
    (/admin/page-seo-editor.html). File shape:
        { "schemaVersion": 1,
          "pages": {
            "contact": { "title": "...", "description": "...",
                         "ogTitle": "...", "ogDescription": "...",
                         "ogImage": "...", "keywords": "...",
                         "twitterTitle": "...", "twitterDescription": "...",
                         "twitterImage": "..." }, ... } }

    Keys here are slugs without the .html extension; the merge below
    handles the .html lookup. Missing file = no overrides, no error.
    """
    f = ROOT / "assets" / "data" / "page-seo.json"
    if not f.exists():
        return {}
    try:
        with f.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
        return data.get("pages") if isinstance(data, dict) else {}
    except Exception as e:
        print(f"  ! could not read assets/data/page-seo.json: {e}")
        return {}


def merge_overrides(slug: str, cfg: dict, overrides: dict) -> dict:
    """Apply an admin override entry on top of the built-in SEO_PAGES row.
    Returns a new dict; the underlying SEO_PAGES dict stays untouched.
    """
    key = slug.replace(".html", "")
    o = overrides.get(key) or {}
    if not o:
        return cfg
    out = dict(cfg)
    # Map the editor's camelCase field names to inject-seo's keys.
    # Use `in o` checks (not truthiness) so an admin clearing a field
    # to "" actually unsets the override instead of being a no-op.
    mapping = {
        "title": "title",
        "description": "desc",
        "keywords": "keywords",
        "ogImage": "image",
        "ogTitle": "og_title",
        "ogDescription": "og_description",
        "twitterTitle": "twitter_title",
        "twitterDescription": "twitter_description",
        "twitterImage": "twitter_image",
    }
    for src, dst in mapping.items():
        if src not in o:
            continue
        val = o[src]
        if val == "" or val is None:
            # Admin explicitly cleared this field — remove the override
            # so the built-in default takes over again.
            out.pop(dst, None)
        else:
            out[dst] = val
    return out


def main():
    pages = sorted(ROOT.glob("*.html"))
    overrides = load_admin_overrides()
    if overrides:
        print(f"  i loaded {len(overrides)} admin SEO override(s)")
    touched = 0
    for p in pages:
        slug = p.name
        cfg = SEO_PAGES.get(slug)
        if not cfg:
            print(f"  - {slug}: no SEO config, skipping")
            continue
        cfg = merge_overrides(slug, cfg, overrides)
        if inject(p, slug, cfg):
            print(f"  + {slug}")
            touched += 1
        else:
            print(f"    {slug} (no changes)")
    print(f"Done. {touched}/{len(pages)} files updated.")


if __name__ == "__main__":
    main()
