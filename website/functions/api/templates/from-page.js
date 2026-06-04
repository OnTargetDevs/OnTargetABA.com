// POST /api/templates/from-page  { pageSlug, templateName } — generate a
// custom template by replacing editable regions of an existing page with
// {{TITLE}} / {{DESCRIPTION}} / {{H1}} / {{SUBHEAD}} / {{BODY_INTRO}}
// placeholders. Opens a PR adding assets/templates/{templateName}.html.

import {
  badRequest,
  ghGet,
  json,
  notFound,
  openPrWithFiles,
  serverError,
  slugify,
} from "../../_utils.js";

function replaceFirst(html, regex, fn) {
  let replaced = false;
  return html.replace(regex, (...args) => {
    if (replaced) return args[0];
    replaced = true;
    return fn(...args);
  });
}

function templatize(html) {
  let out = html;

  // <title>…</title>
  out = replaceFirst(out, /<title>([^<]*)<\/title>/i, () => "<title>{{TITLE}} | On Target ABA</title>");

  // <meta name="description" content="…">
  out = replaceFirst(
    out,
    /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
    () => '<meta name="description" content="{{DESCRIPTION}}">',
  );

  // First <h1>…</h1>
  out = replaceFirst(out, /<h1([^>]*)>([\s\S]*?)<\/h1>/i, (_m, attrs) => `<h1${attrs}>{{H1}}</h1>`);

  // First <h2>…</h2> after that h1 — treat as subhead.
  // Replace only the first remaining h2 occurrence.
  out = replaceFirst(out, /<h2([^>]*)>([\s\S]*?)<\/h2>/i, (_m, attrs) => `<h2${attrs}>{{SUBHEAD}}</h2>`);

  // First standalone <p>…</p> after h1 — treat as body intro.
  out = replaceFirst(out, /<p([^>]*)>([\s\S]*?)<\/p>/i, (_m, attrs) => `<p${attrs}>{{BODY_INTRO}}</p>`);

  return out;
}

export const onRequestPost = async ({ request, env, data }) => {
  let body;
  try { body = await request.json(); } catch { return badRequest("invalid JSON"); }
  const pageSlug = slugify(body.pageSlug || "");
  const templateName = slugify(body.templateName || "");
  if (!pageSlug) return badRequest("pageSlug required");
  if (!templateName) return badRequest("templateName required");

  try {
    const pageFile = await ghGet(`${pageSlug}.html`, env);
    if (!pageFile) return notFound(`page "${pageSlug}.html" not found`);

    const tmplPath = `assets/templates/${templateName}.html`;
    const existing = await ghGet(tmplPath, env);
    if (existing) return badRequest(`template "${templateName}" already exists`);

    const tmplContent = templatize(pageFile.content);

    const files = [
      { path: tmplPath, content: tmplContent },
    ];
    const pr = await openPrWithFiles({
      branchPrefix: `admin/template-from-${pageSlug}`,
      files,
      message: `feat: new template "${templateName}" from ${pageSlug}.html`,
      prTitle: `feat: new template "${templateName}"`,
      prSummary: `Derived from \`${pageSlug}.html\` with editable regions replaced by \`{{TITLE}}\`, \`{{DESCRIPTION}}\`, \`{{H1}}\`, \`{{SUBHEAD}}\`, \`{{BODY_INTRO}}\` placeholders.`,
      email: data?.admin?.email,
    }, env);
    return json({ ok: true, pr }, { status: 201 });
  } catch (e) {
    return serverError(`failed to create template: ${e.message}`);
  }
};
