#!/usr/bin/env node
/**
 * Compile the site's Tailwind utilities into a static stylesheet.
 *
 * Replaces the runtime (CDN) Tailwind JIT — a ~400 KB browser-side
 * compiler that every public page loaded and ran on first paint — with a
 * content-scanned, minified stylesheet at assets/css/tailwind.css.
 *
 * Idempotent: re-running regenerates the same bytes for the same inputs.
 * Pinned to tailwindcss@3.4.17 so the CF Pages build produces exactly the
 * stylesheet committed to the repo.
 *
 * Wired into build.sh BEFORE optimize-pages.py (which rewrites the page
 * <head> to link this file instead of the runtime script). The generated
 * CSS is COMMITTED, so file:// previews and deploys where the Tailwind CLI
 * is unavailable still have a correct stylesheet — this step only refreshes
 * it. On any tooling failure it warns and exits 0 so the deploy proceeds
 * on the committed CSS.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const TAILWIND_VERSION = '3.4.17';
const __dirname = dirname(fileURLToPath(import.meta.url));
const WEBSITE = resolve(__dirname, '..');

const config = resolve(WEBSITE, 'tailwind.config.js');
const input = resolve(WEBSITE, 'scripts/tailwind.input.css');
const output = resolve(WEBSITE, 'assets/css/tailwind.css');

if (!existsSync(config) || !existsSync(input)) {
  console.warn('[build-tailwind] config or input missing; skipping (using committed CSS)');
  process.exit(0);
}

const args = [
  '-y', `tailwindcss@${TAILWIND_VERSION}`,
  '-c', config,
  '-i', input,
  '-o', output,
  '--minify',
];

console.log(`[build-tailwind] tailwindcss@${TAILWIND_VERSION} -> assets/css/tailwind.css`);
// shell:true so Windows resolves npx.cmd via PATHEXT; harmless on POSIX.
// Paths here contain no spaces (repo lives under a space-free path).
const res = spawnSync('npx', args, {
  cwd: WEBSITE, stdio: 'inherit', env: process.env, shell: true,
});

if (res.status !== 0) {
  console.warn(
    `[build-tailwind] Tailwind CLI unavailable or failed (exit ${res.status}); ` +
    'deploy proceeds on the committed assets/css/tailwind.css',
  );
  process.exit(0);
}
console.log('[build-tailwind] done');
