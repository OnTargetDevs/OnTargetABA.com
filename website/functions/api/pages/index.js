// GET  /api/pages — list of pages from assets/data/pages.json
// POST /api/pages — create a new page from a template; open PR

import {
  BUILTIN_TEMPLATES,
  badRequest,
  buildSitemapXml,
  ghGet,
  json,
  loadBlogIndex,
  loadPagesJson,
  openPrWithFiles,
  serverError,
  slugify,
} from "../../_utils.js";

export const onRequestGet = async ({ env }) => {
  try {
    const pages = await loadPagesJson(env);
    return json({ pages });
  } catch (e) {
    return serverError(`failed to load pages.json: ${e.message}`);
  }
};

function substitute(html, fields) {
  return html
    .replaceAll("{{TITLE}}",       fields.title       || "")
    .replaceAll("{{DESCRIPTION}}", fields.description || "")
    .replaceAll("{{H1}}",          fields.h1          || fields.title || "")
    .replaceAll("{{SUBHEAD}}",     fields.subhead     || "")
    .replaceAll("{{BODY_INTRO}}",  fields.body_intro  || fields.description || "");
}

export const onRequestPost = async ({ request, env, data }) => {
  let body;
  try { body = await request.json(); } catch { return badRequest("invalid JSON"); }

  const slug = slugify(body.slug || body.title || "");
  if (!slug) return badRequest("slug or title is required");
  const title = body.title || slug;
  const template = body.template || "page-basic";
  const description = body.description || "";
  const draft = !!body.draft;

  try {
    // Read the template — first the repo's assets/templates/{template}.html,
    // then fall back to a minimal builtin if missing.
    const tmplPath = `assets/templates/${template}.html`;
    let tmplFile = await ghGet(tmplPath, env);
    if (!tmplFile && BUILTIN_TEMPLATES.includes(template)) {
      tmplFile = { content: builtinTemplate(template), sha: null };
    }
    if (!tmplFile) return badRequest(`template "${template}" not found`);

    const rendered = substitute(tmplFile.content, {
      title, description, h1: title, subhead: description, body_intro: description,
    });

    // Make sure the page doesn't already exist.
    const existingHtml = await ghGet(`${slug}.html`, env);
    if (existingHtml) return badRequest(`page "${slug}.html" already exists`);

    // pages.json: add new entry.
    const pages = await loadPagesJson(env);
    if (pages.some((p) => (p.slug || "").toLowerCase() === slug.toLowerCase())) {
      return badRequest(`page "${slug}" already registered`);
    }
    const newPages = [
      ...pages,
      {
        slug,
        title,
        template,
        description,
        draft,
        hidden: false,
        createdAt: new Date().toISOString(),
      },
    ];

    const posts = await loadBlogIndex(env);
    const sitemap = buildSitemapXml(newPages, posts);

    const files = [
      { path: `${slug}.html`, content: rendered },
      { path: "assets/data/pages.json", content: JSON.stringify({ schemaVersion: 1, pages: newPages }, null, 2) + "\n" },
      { path: "sitemap.xml", content: sitemap },
    ];

    const pr = await openPrWithFiles({
      branchPrefix: `admin/page-new-${slug}`,
      files,
      message: `feat: new page "${slug}"`,
      prTitle: `feat: new page "${title}"`,
      prSummary: `Creates \`${slug}.html\` from template \`${template}\` and registers it in \`pages.json\`.`,
      email: data?.admin?.email,
    }, env);

    return json({ ok: true, pr }, { status: 201 });
  } catch (e) {
    return serverError(`failed to create page: ${e.message}`);
  }
};

// Minimal fallback so the API still works before the repo ships explicit
// template files. Matches the existing visual style (Tailwind via CDN).
function builtinTemplate(name) {
  const inner = name === "page-landing"
    ? '<section class="bg-cream"><div class="mx-auto max-w-5xl px-6 py-24 text-center"><p class="text-xs tracking-widest uppercase text-teal-deep">On Target ABA</p><h1 class="font-display text-5xl md:text-6xl text-ink mt-3">{{H1}}</h1><p class="text-lg text-ink-soft mt-6 max-w-2xl mx-auto">{{SUBHEAD}}</p><a href="/contact.html" class="inline-block mt-8 px-8 py-4 rounded-full bg-coral text-white font-semibold">Get Started</a></div></section><section class="bg-white"><div class="mx-auto max-w-3xl px-6 py-16 prose"><p>{{BODY_INTRO}}</p></div></section>'
    : name === "page-long-form"
    ? '<section class="bg-cream"><div class="mx-auto max-w-3xl px-6 py-16"><h1 class="font-display text-4xl text-ink">{{H1}}</h1><p class="text-ink-soft mt-3 text-lg">{{SUBHEAD}}</p></div></section><section><div class="mx-auto max-w-3xl px-6 py-12 prose"><p>{{BODY_INTRO}}</p></div></section>'
    : '<section class="bg-cream"><div class="mx-auto max-w-3xl px-6 py-16"><h1 class="font-display text-4xl text-ink">{{H1}}</h1><p class="text-ink-soft mt-3">{{SUBHEAD}}</p><div class="mt-6 prose"><p>{{BODY_INTRO}}</p></div></div></section>';

  return (
    '<!doctype html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<title>{{TITLE}} | On Target ABA</title>\n' +
    '<meta name="description" content="{{DESCRIPTION}}">\n' +
    '<link rel="stylesheet" href="/assets/css/app.css">\n' +
    '<script src="https://cdn.tailwindcss.com"></script>\n' +
    '</head>\n' +
    '<body class="bg-cream text-ink">\n' +
    '<a href="#main-content" class="skip-link">Skip to main content</a>\n' +
    '<div id="site-header"></div>\n' +
    '<main id="main-content">\n' +
    inner + "\n" +
    '</main>\n' +
    '<div id="site-footer"></div>\n' +
    '<script src="/assets/js/header.js" defer></script>\n' +
    '<script src="/assets/js/footer.js" defer></script>\n' +
    '<script src="/assets/js/app.js" defer></script>\n' +
    '</body>\n' +
    '</html>\n'
  );
}
