// gen-og-images.mjs
//
// Generate 1200x630 Open Graph share images as standalone SVGs for every
// blog post (slugs from assets/blog/index.json) and for the main funnel
// pages. Output goes to assets/og/ in the website root.
//
// Run from any CWD; paths are resolved relative to this file.
// No npm dependencies — Node stdlib only.
//
// Idempotent: a slug's SVG is regenerated only if it is missing or older
// than index.json (so a fresh blog index triggers fresh OG images, but
// repeated builds without content changes are cheap).

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INDEX_JSON = path.join(ROOT, 'assets', 'blog', 'index.json');
const OUT_DIR = path.join(ROOT, 'assets', 'og');

// Brand palette (Figma source of truth)
const C = {
  cream: '#FAF5E6',
  ink: '#163243',
  inkSoft: '#34495E',
  tealDeep: '#0E5E6E',
  coral: '#E84F3B',
  sun: '#F4C842',
};

// XML/attribute-safe escape. We also decode the common HTML entities the
// scraper / inject-seo writes into titles so the SVG renders as plain text.
function decodeEntities(s) {
  return String(s ?? '')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
}
function escapeXml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Greedy wrap: pack words into up to `maxLines` lines, each visually no wider
// than ~`maxCharsPerLine` characters. Last line gets an ellipsis if more
// words remain. The character cap is a coarse approximation; the SVG renders
// at the listed font-size so this is calibrated for ~880px usable width.
function wrapTitle(title, maxLines, maxCharsPerLine) {
  const words = String(title).trim().split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const candidate = cur ? cur + ' ' + w : w;
    if (candidate.length <= maxCharsPerLine) {
      cur = candidate;
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) {
        // Last line: pack the rest, then truncate with ellipsis if needed.
        const rest = [w].concat(words.slice(words.indexOf(w) + 1)).join(' ');
        if (rest.length > maxCharsPerLine) {
          lines.push(rest.slice(0, maxCharsPerLine - 1).replace(/\s+\S*$/, '') + '…');
        } else {
          lines.push(rest);
        }
        return lines;
      }
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

// Pick a font-size based on how long the title is, so big titles still fit
// in the card without overflowing.
function pickFontSize(lineCount, longestLineChars) {
  if (lineCount >= 3 || longestLineChars > 28) return 60;
  if (longestLineChars > 22) return 68;
  return 72;
}

function buildSvg(title) {
  const clean = decodeEntities(title);
  const lines = wrapTitle(clean, 3, 32);
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const fontSize = pickFontSize(lines.length, longest);
  const lineHeight = Math.round(fontSize * 1.12);

  // Card geometry: 960 x 440, centered on a 1200 x 630 canvas.
  const cardX = (1200 - 960) / 2; // 120
  const cardY = (630 - 440) / 2;  // 95
  const cardW = 960;
  const cardH = 440;
  const padX = 56;
  const eyebrowY = cardY + 70;

  // Vertically center the title block within the card (between eyebrow and
  // footer). Title block top:
  const titleBlockHeight = lines.length * lineHeight;
  const titleStartY = cardY + 150 + (fontSize * 0.8); // first line baseline
  // (Eyebrow at top, footer at bottom, title roughly mid-card.)

  const titleTspans = lines.map((line, i) => {
    const y = titleStartY + i * lineHeight;
    return `<text x="${cardX + padX}" y="${y.toFixed(1)}" font-family="'Fraunces', Georgia, serif" font-weight="700" font-size="${fontSize}" fill="${C.ink}" letter-spacing="-0.5">${escapeXml(line)}</text>`;
  }).join('\n    ');

  const footerY = cardY + cardH - 50;

  // Target/bullseye mark in bottom-right of card
  const targetCx = cardX + cardW - 70;
  const targetCy = cardY + cardH - 70;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="14"/>
      <feOffset dx="0" dy="10" result="offsetBlur"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.18"/></feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="${C.cream}"/>

  <!-- Decorative sun circle anchored top-right, partially off-canvas -->
  <circle cx="1140" cy="60" r="260" fill="${C.sun}" opacity="0.95"/>

  <!-- Decorative coral blob anchored bottom-left, partially off-canvas -->
  <circle cx="60" cy="600" r="180" fill="${C.coral}" opacity="0.9"/>
  <circle cx="160" cy="640" r="120" fill="${C.coral}" opacity="0.6"/>

  <!-- White rounded card with shadow -->
  <g filter="url(#cardShadow)">
    <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="32" ry="32" fill="#FFFFFF"/>
  </g>

  <!-- Eyebrow -->
  <text x="${cardX + padX}" y="${eyebrowY}" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="700" font-size="22" fill="${C.tealDeep}" letter-spacing="3">ON TARGET ABA  &#183;  BLOG</text>

  <!-- Title (up to 3 wrapped lines) -->
  ${titleTspans}

  <!-- Footer attribution -->
  <text x="${cardX + padX}" y="${footerY}" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="500" font-size="24" fill="${C.inkSoft}">On Target ABA &#8212; ABA Therapy &amp; Autism Testing</text>

  <!-- Target / bullseye brand mark in bottom-right of card -->
  <circle cx="${targetCx}" cy="${targetCy}" r="34" fill="none" stroke="${C.tealDeep}" stroke-width="3"/>
  <circle cx="${targetCx}" cy="${targetCy}" r="22" fill="none" stroke="${C.tealDeep}" stroke-width="3"/>
  <circle cx="${targetCx}" cy="${targetCy}" r="11" fill="none" stroke="${C.tealDeep}" stroke-width="3"/>
  <circle cx="${targetCx}" cy="${targetCy}" r="5" fill="${C.coral}"/>
</svg>
`;
}

async function fileMtime(p) {
  try {
    const st = await fs.stat(p);
    return st.mtimeMs;
  } catch {
    return 0;
  }
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function maybeWrite(outPath, content, indexMtime) {
  const existing = await fileMtime(outPath);
  if (existing && existing >= indexMtime) {
    return false; // up to date
  }
  await fs.writeFile(outPath, content, 'utf8');
  return true;
}

async function main() {
  await ensureDir(OUT_DIR);

  const indexMtime = await fileMtime(INDEX_JSON);
  if (!indexMtime) {
    console.error('gen-og-images: cannot find ' + INDEX_JSON);
    process.exit(1);
  }

  const raw = await fs.readFile(INDEX_JSON, 'utf8');
  const idx = JSON.parse(raw);
  const posts = Array.isArray(idx.posts) ? idx.posts : [];

  // Static-page OG images (titles from the spec).
  const staticPages = [
    { name: 'home', title: 'Quality care without the wait.' },
    { name: 'autism-testing', title: 'Autism Testing with NO Waitlist' },
    { name: 'about', title: 'Family-focused ABA, from people who do it every day.' },
    { name: 'our-services', title: 'ABA programs built around your child.' },
    { name: 'locations', title: 'Now serving Utah and Ohio.' },
    { name: 'contact', title: "Let's get your family started." },
  ];

  let made = 0;
  let skipped = 0;

  for (const page of staticPages) {
    const out = path.join(OUT_DIR, page.name + '.svg');
    const svg = buildSvg(page.title);
    if (await maybeWrite(out, svg, indexMtime)) made++;
    else skipped++;
  }

  for (const p of posts) {
    if (!p.slug) continue;
    const out = path.join(OUT_DIR, 'blog-' + p.slug + '.svg');
    const svg = buildSvg(p.title || p.slug);
    if (await maybeWrite(out, svg, indexMtime)) made++;
    else skipped++;
  }

  console.log('Generated ' + made + ' new OG images (skipped ' + skipped + ' unchanged).');
}

main().catch(err => {
  console.error('gen-og-images failed:', err);
  process.exit(1);
});
