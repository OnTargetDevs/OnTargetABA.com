// GET /api/pages/:slug — current SEO meta for a static HTML page.
// PUT /api/pages/:slug — update meta tags in the live HTML AND persist
//                        the override to assets/data/page-seo.json so
//                        inject-seo.py re-applies them on every deploy.
//
// One PR per save. Edits patch the meta tags in-place inside the
// <!-- auto-seo-start -->...<!-- auto-seo-end --> block (and the <title>
// tag, which lives outside the block). page-seo.json is the durable
// override layer the build script reads at deploy time.

import {
  badRequest,
  ghGet,
  json,
  notFound,
  openPrWithFiles,
  serverError,
  slugify,
} from "../../_utils.js";

const FIELDS = [
  "title",
  "description",
  "keywords",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "twitterTitle",
  "twitterDescription",
  "twitterImage",
];

function readSlug(params) {
  const raw = String(params.slug || "").replace(/\.html$/i, "");
  return slugify(raw);
}

function readMeta(html) {
  const out = {};
  FIELDS.forEach((f) => { out[f] = ""; });
  if (!html) return out;
  const titleM = /<title>([\s\S]*?)<\/title>/i.exec(html);
  if (titleM) out.title = titleM[1].trim();
  function pick(re) { const m = re.exec(html); return m ? m[1] : ""; }
  out.description        = pick(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  out.keywords           = pick(/<meta\s+name=["']keywords["']\s+content=["']([^"']*)["']/i);
  out.ogTitle            = pick(/<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i);
  out.ogDescription      = pick(/<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i);
  out.ogImage            = pick(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i);
  out.twitterTitle       = pick(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']*)["']/i);
  out.twitterDescription = pick(/<meta\s+name=["']twitter:description["']\s+content=["']([^"']*)["']/i);
  out.twitterImage       = pick(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']*)["']/i);
  return out;
}

// Patch a single meta tag's content="..." in place. If the tag is missing,
// append it right before the closing </head> tag. Returns the new HTML.
function patchMeta(html, matcher, replacer, fallbackTag) {
  if (matcher.test(html)) {
    return html.replace(matcher, replacer);
  }
  if (fallbackTag && /<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${fallbackTag}\n</head>`);
  }
  return html;
}

function escAttr(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function applyMetaToHtml(html, meta) {
  let out = html;
  if (typeof meta.title === "string" && meta.title.length) {
    // Escape so admins can't inject HTML/script via the page title.
    // The escAttr helper also handles "<", ">" which is what matters
    // here (preventing </title> followed by <script>).
    out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escAttr(meta.title)}</title>`);
  }
  const patches = [
    {
      val: meta.description,
      re:  /(<meta\s+name=["']description["']\s+content=["'])([^"']*)(["'])/i,
      fb:  (v) => `<meta name="description" content="${escAttr(v)}" />`,
    },
    {
      val: meta.keywords,
      re:  /(<meta\s+name=["']keywords["']\s+content=["'])([^"']*)(["'])/i,
      fb:  (v) => `<meta name="keywords" content="${escAttr(v)}" />`,
    },
    {
      val: meta.ogTitle,
      re:  /(<meta\s+property=["']og:title["']\s+content=["'])([^"']*)(["'])/i,
      fb:  (v) => `<meta property="og:title" content="${escAttr(v)}" />`,
    },
    {
      val: meta.ogDescription,
      re:  /(<meta\s+property=["']og:description["']\s+content=["'])([^"']*)(["'])/i,
      fb:  (v) => `<meta property="og:description" content="${escAttr(v)}" />`,
    },
    {
      val: meta.ogImage,
      re:  /(<meta\s+property=["']og:image["']\s+content=["'])([^"']*)(["'])/i,
      fb:  (v) => `<meta property="og:image" content="${escAttr(v)}" />`,
    },
    {
      val: meta.twitterTitle,
      re:  /(<meta\s+name=["']twitter:title["']\s+content=["'])([^"']*)(["'])/i,
      fb:  (v) => `<meta name="twitter:title" content="${escAttr(v)}" />`,
    },
    {
      val: meta.twitterDescription,
      re:  /(<meta\s+name=["']twitter:description["']\s+content=["'])([^"']*)(["'])/i,
      fb:  (v) => `<meta name="twitter:description" content="${escAttr(v)}" />`,
    },
    {
      val: meta.twitterImage,
      re:  /(<meta\s+name=["']twitter:image["']\s+content=["'])([^"']*)(["'])/i,
      fb:  (v) => `<meta name="twitter:image" content="${escAttr(v)}" />`,
    },
  ];

  for (const p of patches) {
    if (typeof p.val !== "string") continue;
    out = patchMeta(out, p.re, `$1${escAttr(p.val)}$3`, p.fb(p.val));
  }
  return out;
}

async function loadOverrideFile(env) {
  const f = await ghGet("assets/data/page-seo.json", env);
  if (!f) return { obj: { schemaVersion: 1, pages: {} }, sha: null };
  try {
    const parsed = JSON.parse(f.content || "{}");
    if (!parsed.pages || typeof parsed.pages !== "object") parsed.pages = {};
    if (!parsed.schemaVersion) parsed.schemaVersion = 1;
    return { obj: parsed, sha: f.sha };
  } catch {
    return { obj: { schemaVersion: 1, pages: {} }, sha: f.sha };
  }
}

export const onRequestGet = async ({ params, env }) => {
  const slug = readSlug(params);
  if (!slug) return badRequest("missing slug");
  const path = `${slug}.html`;
  const file = await ghGet(path, env);
  if (!file) return notFound(`page "${slug}" not found`);
  const live = readMeta(file.content);
  const { obj } = await loadOverrideFile(env);
  const override = obj.pages[slug] || null;
  return json({
    slug,
    url: slug === "index" ? "/" : "/" + slug,
    meta: live,
    override,
    sha: file.sha,
  });
};

export const onRequestPut = async ({ params, request, env, data }) => {
  const slug = readSlug(params);
  if (!slug) return badRequest("missing slug");

  let body;
  try { body = await request.json(); }
  catch { return badRequest("invalid JSON"); }

  // Whitelist + trim incoming fields so callers can't smuggle keys into
  // the override file or HTML.
  const meta = {};
  for (const k of FIELDS) {
    if (typeof body[k] === "string") meta[k] = body[k].trim();
  }
  if (!Object.keys(meta).length) return badRequest("no editable fields supplied");

  try {
    const path = `${slug}.html`;
    const file = await ghGet(path, env);
    if (!file) return notFound(`page "${slug}" not found`);

    const newHtml = applyMetaToHtml(file.content, meta);

    // Build / merge the override file so inject-seo.py picks the same
    // values up on the next deploy. Without this layer the build script
    // would overwrite our HTML edits.
    const { obj } = await loadOverrideFile(env);
    const prev = obj.pages[slug] || {};
    obj.pages[slug] = { ...prev, ...meta };
    const overrideContent = JSON.stringify(obj, null, 2) + "\n";

    const files = [];
    if (newHtml !== file.content) {
      files.push({ path, content: newHtml });
    }
    files.push({
      path: "assets/data/page-seo.json",
      content: overrideContent,
    });

    if (files.length === 1 && files[0].path === "assets/data/page-seo.json") {
      // HTML was unchanged but the override still moved — fall through.
    }

    const pr = await openPrWithFiles({
      branchPrefix: `admin/page-seo-${slug}`,
      files,
      message: `seo: update meta for ${slug}`,
      prTitle: `seo: update meta tags for /${slug === "index" ? "" : slug}`,
      prSummary:
        `Updates ${Object.keys(meta).length} meta field(s) on \`${slug}.html\` ` +
        `and persists the values to \`assets/data/page-seo.json\` so ` +
        `\`scripts/inject-seo.py\` keeps them across redeploys.`,
      email: data?.admin?.email,
    }, env);

    return json({ ok: true, pr });
  } catch (e) {
    return serverError(`failed to update page SEO: ${e.message}`);
  }
};
