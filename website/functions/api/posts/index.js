// GET  /api/posts          — list of every blog post (parsed frontmatter)
// POST /api/posts          — create a new post + open a PR

import {
  badRequest,
  buildBlogIndex,
  buildPostFile,
  buildSitemapXml,
  fetchAllBlogPosts,
  ghTree,
  ghGet,
  json,
  loadPagesJson,
  openPrWithFiles,
  parseFrontmatter,
  serverError,
  slugify,
} from "../../_utils.js";

export const onRequestGet = async ({ env }) => {
  // Read from the pre-built blog index instead of iterating every .md
  // file via the Contents API. With 161+ posts, the per-file approach
  // blows past CF Pages Functions' subrequest budget and times out.
  // The index.json is rebuilt on every push by scripts/build-blog-index.py
  // (and by /api/posts mutations regenerating it in-memory), so it's
  // always current.
  try {
    const file = await ghGet("assets/blog/index.json", env);
    if (!file || !file.content) return json({ posts: [] });
    let data;
    try { data = JSON.parse(file.content); } catch { return json({ posts: [] }); }
    const raw = Array.isArray(data) ? data : (Array.isArray(data.posts) ? data.posts : []);
    const posts = raw.map((p) => ({
      slug:     p.slug     || "",
      title:    p.title    || "",
      date:     p.date     || "",
      category: p.category || "",
      excerpt:  p.excerpt  || "",
      draft:    p.draft === "true" || p.draft === true,
      hidden:   p.hidden === "true" || p.hidden === true,
    })).filter((p) => p.slug);
    posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return json({ posts });
  } catch (e) {
    return serverError(`failed to list posts: ${e.message}`);
  }
};

export const onRequestPost = async ({ request, env, data }) => {
  let body;
  try { body = await request.json(); } catch { return badRequest("invalid JSON"); }
  const slug = slugify(body.slug || body.frontmatter?.title || "");
  if (!slug) return badRequest("slug or title is required");
  const frontmatter = body.frontmatter || {};
  if (!frontmatter.title) return badRequest("frontmatter.title is required");
  const postBody = body.body || "";
  const path = `assets/blog/${slug}.md`;

  try {
    const existing = await ghGet(path, env);
    if (existing && existing.sha) return badRequest(`post "${slug}" already exists`);

    // Regenerate blog index + sitemap including the new post.
    const existingPosts = await fetchAllBlogPosts(env);
    const merged = [...existingPosts.filter((p) => p.slug !== slug), { ...frontmatter, slug }];
    const newIndex = buildBlogIndex(merged);
    const pages = await loadPagesJson(env);
    const sitemap = buildSitemapXml(pages, newIndex.posts);

    const files = [
      { path, content: buildPostFile(frontmatter, postBody) },
      { path: "assets/blog/index.json", content: JSON.stringify(newIndex, null, 2) + "\n" },
      { path: "sitemap.xml", content: sitemap },
    ];

    const pr = await openPrWithFiles({
      branchPrefix: `admin/post-new-${slug}`,
      files,
      message: `content: new blog post "${slug}"`,
      prTitle: `content: new blog post "${frontmatter.title}"`,
      prSummary: `Adds new blog post \`${slug}.md\` and regenerates blog index + sitemap.`,
      email: data?.admin?.email,
    }, env);

    return json({ ok: true, pr }, { status: 201 });
  } catch (e) {
    return serverError(`failed to create post: ${e.message}`);
  }
};
