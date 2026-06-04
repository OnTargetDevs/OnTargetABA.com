#!/usr/bin/env node
// ============================================================
// add-skip-link.mjs
// Insert a skip-to-content link at the top of every <body>
// and add id="main-content" to the page's first meaningful
// content landmark (the section that follows the breadcrumb,
// or the section right after </header> if no breadcrumb).
//
// Idempotent: a page that already has class="skip-link" in
// its body is left alone.
// ============================================================

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = join(__dirname, '..');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (['node_modules', '.git', 'scraped', 'figma-refs', 'scripts', 'assets'].includes(entry)) continue;
      walk(p, out);
    } else if (entry.endsWith('.html')) {
      out.push(p);
    }
  }
  return out;
}

const SKIP_LINK = '<a href="#main-content" class="skip-link">Skip to main content</a>';

const files = walk(SITE_ROOT);
let touched = 0;
let skipped = 0;

for (const path of files) {
  let html = readFileSync(path, 'utf8');

  // Already done? Bail.
  if (html.includes('class="skip-link"')) {
    skipped++;
    continue;
  }

  const bodyOpenRe = /(<body[^>]*>)/i;
  if (!bodyOpenRe.test(html)) {
    skipped++;
    continue;
  }

  // Drop the skip-link as the very first element inside <body>.
  html = html.replace(bodyOpenRe, `$1\n${SKIP_LINK}\n`);

  // Pick the right anchor for id="main-content".
  // Priority order: (1) first <section> after </header>, which on
  // pages with a breadcrumb sits right after the breadcrumb;
  // (2) first <main>; (3) first <section> anywhere; (4) the
  // announcement-bar wrapper.
  const headerEndIdx = html.search(/<\/header>/i);
  let anchored = false;

  if (headerEndIdx !== -1) {
    const afterHeader = html.slice(headerEndIdx);
    const m = afterHeader.match(/<section\b/i);
    if (m) {
      const localIdx = m.index;
      const absIdx = headerEndIdx + localIdx;
      // Inject id attribute inside the <section ...> opening tag.
      html = injectId(html, absIdx);
      anchored = true;
    }
  }

  if (!anchored) {
    const mMain = html.match(/<main\b/i);
    if (mMain) {
      html = injectId(html, mMain.index);
      anchored = true;
    }
  }
  if (!anchored) {
    const mSec = html.match(/<section\b/i);
    if (mSec) {
      html = injectId(html, mSec.index);
      anchored = true;
    }
  }
  if (!anchored) {
    // Last resort: tag the announcement bar wrapper so the
    // skip-link still has a target instead of jumping to #.
    const mDiv = html.match(/<div\b/i);
    if (mDiv) {
      html = injectId(html, mDiv.index);
      anchored = true;
    }
  }

  writeFileSync(path, html, 'utf8');
  console.log(`  ~ ${relative(SITE_ROOT, path)}`);
  touched++;
}

// Insert id="main-content" into the opening tag at absIdx, but
// only if the tag doesn't already carry an id attribute.
function injectId(html, absIdx) {
  // Find the '>' closing this tag.
  const tagEnd = html.indexOf('>', absIdx);
  if (tagEnd === -1) return html;
  const openTag = html.slice(absIdx, tagEnd + 1);
  if (/\sid\s*=/.test(openTag)) {
    // Don't clobber an existing id; just prepend a wrapping
    // anchor before this element so the skip link still works.
    return html.slice(0, absIdx) + '<span id="main-content"></span>' + html.slice(absIdx);
  }
  // Splice id="main-content" right after the tag name.
  const tagNameMatch = openTag.match(/^<(\w+)/);
  if (!tagNameMatch) return html;
  const insertAt = absIdx + 1 + tagNameMatch[1].length;
  return html.slice(0, insertAt) + ' id="main-content"' + html.slice(insertAt);
}

console.log(`==> add-skip-link: ${touched} updated, ${skipped} already had it.`);
