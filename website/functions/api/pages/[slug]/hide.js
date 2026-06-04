// POST /api/pages/:slug/hide  { hidden: bool } — flip the hidden flag,
// regenerate sitemap, open PR.

import {
  badRequest,
  buildSitemapXml,
  json,
  loadBlogIndex,
  loadPagesJson,
  notFound,
  openPrWithFiles,
  serverError,
  slugify,
} from "../../../_utils.js";

export const onRequestPost = async ({ params, request, env, data }) => {
  const slug = slugify(params.slug || "");
  if (!slug) return badRequest("missing slug");
  let body;
  try { body = await request.json(); } catch { return badRequest("invalid JSON"); }
  const hidden = !!body.hidden;

  try {
    const pages = await loadPagesJson(env);
    const idx = pages.findIndex((p) => (p.slug || "").toLowerCase() === slug.toLowerCase());
    if (idx < 0) return notFound(`page "${slug}" not registered`);
    const newPages = pages.slice();
    newPages[idx] = { ...newPages[idx], hidden };

    const posts = await loadBlogIndex(env);
    const sitemap = buildSitemapXml(newPages, posts);

    const files = [
      { path: "assets/data/pages.json", content: JSON.stringify({ schemaVersion: 1, pages: newPages }, null, 2) + "\n" },
      { path: "sitemap.xml", content: sitemap },
    ];

    const action = hidden ? "hide" : "unhide";
    const pr = await openPrWithFiles({
      branchPrefix: `admin/page-${action}-${slug}`,
      files,
      message: `content: ${action} page "${slug}"`,
      prTitle: `content: ${action} page "${slug}"`,
      prSummary: `Sets \`hidden: ${hidden}\` on \`${slug}\` and regenerates the sitemap.`,
      email: data?.admin?.email,
    }, env);
    return json({ ok: true, pr });
  } catch (e) {
    return serverError(`failed to toggle hidden: ${e.message}`);
  }
};
