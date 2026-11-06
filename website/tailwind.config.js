/**
 * Tailwind config for the precompiled stylesheet (assets/css/tailwind.css).
 *
 * This MIRRORS the inline `tailwind.config` block that every public page
 * used to ship for the runtime (CDN) Tailwind JIT. Replacing that 400 KB
 * browser-side compiler with a static, content-scanned stylesheet is the
 * single biggest page-load win (removes the download + the main-thread
 * JIT pass). See scripts/build-tailwind.mjs + the PR for the before/after.
 *
 * theme.extend is a byte-for-byte copy of the old inline config so the
 * generated utilities are identical — nothing about the site changes.
 */

// Brand tokens the /admin page-editor toolbar can apply to any element at
// runtime (text/bg colour swatches). They are only safelisted — not used
// in the static markup — so they survive content purging for saved
// overrides even though the editor assigns them after build time.
const brandColors = [
  'ink', 'ink-soft', 'teal', 'teal-deep', 'teal-soft',
  'coral', 'coral-soft', 'sun', 'sun-soft', 'sage', 'sage-soft',
  'cream', 'mute', 'line',
];

const editorSafelist = [
  // size toggles (xs–7xl)
  'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl',
  'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl',
  // font family toggles
  'font-sans', 'font-display',
  // inline formatting toggles
  'font-normal', 'font-semibold', 'font-bold',
  'italic', 'not-italic', 'underline', 'line-through', 'no-underline',
  'uppercase', 'normal-case',
  // border-radius toggles
  'rounded-none', 'rounded-sm', 'rounded', 'rounded-md', 'rounded-lg',
  'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-full',
  // brand colour swatches (text + background)
  ...brandColors.map((c) => `text-${c}`),
  ...brandColors.map((c) => `bg-${c}`),
];

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './blog/*.html',
    './assets/js/*.js',
    './assets/templates/**/*.html',
  ],
  safelist: editorSafelist,
  theme: {
    extend: {
      colors: {
        // 2026 palette nudge; values mirror the --c-* tokens in assets/css/app.css.
        ink:   { DEFAULT: '#08424C', soft: '#2D5257' },
        teal:  { DEFAULT: '#36776D', deep: '#0B5961', soft: '#DAEEEB' },
        coral: { DEFAULT: '#C73636', soft: '#FDEFEE' },
        sun:   { DEFAULT: '#F2C50C', soft: '#FCF0C2' },
        sage:  { DEFAULT: '#C5E0D5', soft: '#E6F1EB' },
        cream: '#FBFAEA',
        mute:  '#52676B',
        line:  '#E6E1CC',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
