// POST /api/section-templates/save
//
// body: { name: "feature-grid", html: "<section>...</section>" }
//
// Commits the HTML to assets/templates/sections/{slugified-name}.html as
// part of an admin PR. The page editor's "Insert template" picker then
// surfaces it for one-click insertion onto other pages.

import {
  badRequest,
  json,
  openPrWithFiles,
  serverError,
  slugify,
} from "../../_utils.js";

const MAX_HTML_BYTES = 256 * 1024; // 256 KB — section templates are small.

export const onRequestPost = async ({ request, env, data }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid JSON");
  }

  const name = slugify(body.name || "");
  const html = String(body.html || "");
  if (!name) return badRequest("name is required");
  if (!html) return badRequest("html is required");
  if (html.length > MAX_HTML_BYTES) {
    return badRequest(`html too large (${(html.length / 1024).toFixed(1)} KB > 256 KB)`);
  }

  // Defense in depth: refuse anything that's obviously trying to ship a
  // <script> tag through. Static site, no inline JS in saved sections.
  if (/<script\b/i.test(html)) {
    return badRequest("inline <script> tags are not allowed in section templates");
  }

  const path = `assets/templates/sections/${name}.html`;
  try {
    const pr = await openPrWithFiles({
      branchPrefix: `admin/section-template-${name}`,
      files: [{ path, content: html.trim() + "\n" }],
      message: `feat: section template "${name}"`,
      prTitle: `feat: section template "${name}"`,
      prSummary: `Saves a new section template to \`${path}\` for reuse from the page editor.`,
      email: data?.admin?.email,
    }, env);
    return json({ ok: true, name, path, pr }, { status: 201 });
  } catch (e) {
    return serverError(`save failed: ${e.message}`);
  }
};
