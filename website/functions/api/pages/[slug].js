// GET    /api/pages/:slug — registry + overrides + sha
// PUT    /api/pages/:slug — write overrides; open PR
// DELETE /api/pages/:slug — delete .html + overrides + registry; open PR

import {
  badRequest,
  buildSitemapXml,
  ghGet,
  json,
  loadBlogIndex,
  loadPagesJson,
  notFound,
  openPrWithFiles,
  serverError,
  slugify,
} from "../../_utils.js";

function readSlug(params) {
  return slugify(params.slug || "");
}

export const onRequestGet = async ({ params, env }) => {
  const slug = readSlug(params);
  if (!slug) return badRequest("missing slug");
  try {
    const pages = await loadPagesJson(env);
    const registry = pages.find((p) => (p.slug || "").toLowerCase() === slug.toLowerCase()) || null;

    const overridesPath = `assets/data/pages/${slug}.overrides.json`;
    const overridesFile = await ghGet(overridesPath, env);
    let overrides = {};
    let overridesSha = null;
    if (overridesFile && overridesFile.content) {
      try { overrides = JSON.parse(overridesFile.content); } catch { overrides = {}; }
      overridesSha = overridesFile.sha;
    }

    return json({ registry, overrides, sha: { overrides: overridesSha } });
  } catch (e) {
    return serverError(`failed to load page: ${e.message}`);
  }
};

export const onRequestPut = async ({ params, request, env, data }) => {
  const slug = readSlug(params);
  if (!slug) return badRequest("missing slug");
  let body;
  try { body = await request.json(); } catch { return badRequest("invalid JSON"); }
  const overrides = body.overrides || {};

  try {
    const path = `assets/data/pages/${slug}.overrides.json`;
    const files = [
      { path, content: JSON.stringify(overrides, null, 2) + "\n" },
    ];
    const pr = await openPrWithFiles({
      branchPrefix: `admin/page-overrides-${slug}`,
      files,
      message: `content: update ${slug} overrides`,
      prTitle: `content: update "${slug}" page overrides`,
      prSummary: `Updates \`assets/data/pages/${slug}.overrides.json\`.`,
      email: data?.admin?.email,
    }, env);
    return json({ ok: true, pr });
  } catch (e) {
    return serverError(`failed to update overrides: ${e.message}`);
  }
};

export const onRequestDelete = async ({ params, env, data }) => {
  const slug = readSlug(params);
  if (!slug) return badRequest("missing slug");
  try {
    const pages = await loadPagesJson(env);
    const entry = pages.find((p) => (p.slug || "").toLowerCase() === slug.toLowerCase());
    if (!entry) return notFound(`page "${slug}" not registered`);

    const htmlFile = await ghGet(`${slug}.html`, env);
    const overridesFile = await ghGet(`assets/data/pages/${slug}.overrides.json`, env);

    const newPages = pages.filter((p) => (p.slug || "").toLowerCase() !== slug.toLowerCase());
    const posts = await loadBlogIndex(env);
    const sitemap = buildSitemapXml(newPages, posts);

    const files = [
      { path: "assets/data/pages.json", content: JSON.stringify({ schemaVersion: 1, pages: newPages }, null, 2) + "\n" },
      { path: "sitemap.xml", content: sitemap },
    ];
    if (htmlFile) files.push({ path: `${slug}.html`, delete: true });
    if (overridesFile) files.push({ path: `assets/data/pages/${slug}.overrides.json`, delete: true });

    const pr = await openPrWithFiles({
      branchPrefix: `admin/page-delete-${slug}`,
      files,
      message: `chore: delete page "${slug}"`,
      prTitle: `chore: delete page "${slug}"`,
      prSummary: `Removes \`${slug}.html\` + overrides, unregisters from \`pages.json\`, regenerates sitemap.`,
      email: data?.admin?.email,
    }, env);
    return json({ ok: true, pr });
  } catch (e) {
    return serverError(`failed to delete page: ${e.message}`);
  }
};
