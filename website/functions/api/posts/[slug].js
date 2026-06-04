// GET    /api/posts/:slug — full markdown + SHA
// PUT    /api/posts/:slug — update post; regen blog index + sitemap; open PR
// DELETE /api/posts/:slug — remove post; regen blog index + sitemap; open PR

import {
  badRequest,
  buildBlogIndex,
  buildPostFile,
  buildSitemapXml,
  fetchAllBlogPosts,
  ghGet,
  json,
  loadPagesJson,
  notFound,
  openPrWithFiles,
  parseFrontmatter,
  serverError,
  slugify,
} from "../../_utils.js";

function readSlug(params) {
  return slugify(params.slug || "");
}

export const onRequestGet = async ({ params, env }) => {
  const slug = readSlug(params);
  if (!slug) return badRequest("missing slug");
  const file = await ghGet(`assets/blog/${slug}.md`, env);
  if (!file) return notFound(`post "${slug}" not found`);
  return json({ markdown: file.content, sha: file.sha });
};

export const onRequestPut = async ({ params, request, env, data }) => {
  const slug = readSlug(params);
  if (!slug) return badRequest("missing slug");
  let body;
  try { body = await request.json(); } catch { return badRequest("invalid JSON"); }
  const fm = body.frontmatter || {};
  if (!fm.title) return badRequest("frontmatter.title is required");
  const postBody = body.body || "";

  try {
    const path = `assets/blog/${slug}.md`;
    const existing = await ghGet(path, env);
    if (!existing) return notFound(`post "${slug}" not found`);

    const allPosts = await fetchAllBlogPosts(env);
    const merged = allPosts.map((p) => p.slug === slug ? { ...fm, slug } : p);
    if (!merged.some((p) => p.slug === slug)) merged.push({ ...fm, slug });
    const newIndex = buildBlogIndex(merged);
    const pages = await loadPagesJson(env);
    const sitemap = buildSitemapXml(pages, newIndex.posts);

    const files = [
      { path, content: buildPostFile(fm, postBody) },
      { path: "assets/blog/index.json", content: JSON.stringify(newIndex, null, 2) + "\n" },
      { path: "sitemap.xml", content: sitemap },
    ];

    const pr = await openPrWithFiles({
      branchPrefix: `admin/post-update-${slug}`,
      files,
      message: `content: update blog post "${slug}"`,
      prTitle: `content: update blog post "${fm.title}"`,
      prSummary: `Updates \`${slug}.md\` and regenerates blog index + sitemap.`,
      email: data?.admin?.email,
    }, env);

    return json({ ok: true, pr });
  } catch (e) {
    return serverError(`failed to update post: ${e.message}`);
  }
};

export const onRequestDelete = async ({ params, env, data }) => {
  const slug = readSlug(params);
  if (!slug) return badRequest("missing slug");
  try {
    const path = `assets/blog/${slug}.md`;
    const existing = await ghGet(path, env);
    if (!existing) return notFound(`post "${slug}" not found`);

    const allPosts = await fetchAllBlogPosts(env);
    const remaining = allPosts.filter((p) => p.slug !== slug);
    const newIndex = buildBlogIndex(remaining);
    const pages = await loadPagesJson(env);
    const sitemap = buildSitemapXml(pages, newIndex.posts);

    const files = [
      { path, delete: true },
      { path: "assets/blog/index.json", content: JSON.stringify(newIndex, null, 2) + "\n" },
      { path: "sitemap.xml", content: sitemap },
    ];

    const pr = await openPrWithFiles({
      branchPrefix: `admin/post-delete-${slug}`,
      files,
      message: `content: delete blog post "${slug}"`,
      prTitle: `content: delete blog post "${slug}"`,
      prSummary: `Deletes \`${slug}.md\` and regenerates blog index + sitemap.`,
      email: data?.admin?.email,
    }, env);

    return json({ ok: true, pr });
  } catch (e) {
    return serverError(`failed to delete post: ${e.message}`);
  }
};
