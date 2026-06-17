#!/usr/bin/env node
// ============================================================
// selfhost-fonts.mjs
// Sweep every *.html page (incl. blog/post.html). Strip the
// two <link rel="preconnect"> hits to Google + the
// fonts.googleapis.com stylesheet link, and inject a single
// preload tag for our most-used weight (Plus Jakarta Sans 600).
//
// Idempotent: a page with the preload already present is left
// alone. Safe to run on every build.
// ============================================================

import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = join(__dirname, '..');

// Walk the site root for *.html (excluding scraped/, figma-refs/, scripts/).
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

const PRECONNECT_GFONTS = /^\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*\r?\n/gm;
const PRECONNECT_GSTATIC = /^\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*\r?\n/gm;
const GFONTS_STYLESHEET = /^\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*" rel="stylesheet">\s*\r?\n/gm;

const PRELOAD_MARK = 'assets/fonts/plus-jakarta-sans-600.woff2';
const PRELOAD_MARK_BODY = 'assets/fonts/plus-jakarta-sans-400.woff2';

const files = walk(SITE_ROOT);
let touched = 0;
let skipped = 0;

for (const path of files) {
  let html = readFileSync(path, 'utf8');
  const before = html;

  // For blog/post.html the relative root is "../" because the
  // page lives in /blog/. For everything else the assets path
  // is "assets/fonts/..." relative to the page.
  const isInBlogDir = /[\\/]blog[\\/]/.test(path) && !path.endsWith(`${'blog'}.html`);
  const preloadHref = (isInBlogDir ? '../' : '') + PRELOAD_MARK;
  const preloadHrefBody = (isInBlogDir ? '../' : '') + PRELOAD_MARK_BODY;

  // Strip Google Fonts requests.
  html = html.replace(PRECONNECT_GFONTS, '');
  html = html.replace(PRECONNECT_GSTATIC, '');
  html = html.replace(GFONTS_STYLESHEET, '');

  // Idempotent preload injection. Insert immediately before the
  // <link rel="stylesheet" href="...app.css"> so the font fetch
  // can start in parallel with the stylesheet that references it.
  if (!html.includes(preloadHref)) {
    const preloadTag = `<link rel="preload" as="font" type="font/woff2" crossorigin href="${preloadHref}">`;
    // Use the page's existing app.css link as the anchor; both
    // top-level pages (`assets/css/app.css`) and the blog renderer
    // (`../assets/css/app.css`) match this regex.
    const cssLinkRe = /(<link rel="stylesheet" href="(?:\.\.\/)?assets\/css\/app\.css"\s*\/?>)/;
    if (cssLinkRe.test(html)) {
      html = html.replace(cssLinkRe, `${preloadTag}\n$1`);
    } else {
      // Fall back: inject just before </head>.
      html = html.replace(/<\/head>/i, `${preloadTag}\n</head>`);
    }
  }

  // Also preload the 400 (body) weight — fonts at 400 are used for body
  // text on every page, so paying the byte cost up-front prevents the
  // brief FOIT/swap at first paint. Anchored to the 600 preload so they
  // stay adjacent in <head>.
  if (!html.includes(preloadHrefBody)) {
    const bodyPreloadTag = `<link rel="preload" as="font" type="font/woff2" crossorigin href="${preloadHrefBody}">`;
    const sixHundredRe = new RegExp(`(<link rel="preload" as="font" type="font/woff2" crossorigin href="${preloadHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">)`);
    if (sixHundredRe.test(html)) {
      html = html.replace(sixHundredRe, `$1\n${bodyPreloadTag}`);
    } else {
      html = html.replace(/<\/head>/i, `${bodyPreloadTag}\n</head>`);
    }
  }

  if (html === before) {
    skipped++;
    continue;
  }
  writeFileSync(path, html, 'utf8');
  console.log(`  ~ ${relative(SITE_ROOT, path)}`);
  touched++;
}

console.log(`==> selfhost-fonts: ${touched} updated, ${skipped} already clean.`);
