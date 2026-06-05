// GET  /api/posts          — list of every blog post (parsed frontmatter)
// POST /api/posts          — create a new post + open a PR

import {
  badRequest,
  buildPostFile,
  buildSitemapXml,
  ghGet,
  json,
  loadBlogIndex,
  loadPagesJson,
  openPrWithFiles,
  serverError,
  shortUuid,
  slugify,
} from "../../_utils.js";

const ALLOWED_IMG_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"]);

function extOf(name) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || "");
  return m ? m[1].toLowerCase() : "";
}
function isoMonth() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Convert a pending image upload into a { path, content, publicPath }
// triple ready to commit alongside the post.
function makeAttachmentFile(slug, upload) {
  if (!upload || !upload.base64 || !upload.filename) return null;
  const ext = extOf(upload.filename);
  if (!ALLOWED_IMG_EXT.has(ext)) throw new Error(`unsupported image extension ".${ext}"`);
  const base = slugify(upload.filename.replace(/\.[^.]+$/, "")) || slug || "image";
  const tag = shortUuid();
  const path = `assets/images/uploads/${isoMonth()}/${base}-${tag}.${ext}`;
  let binaryStr;
  try { binaryStr = atob(String(upload.base64).replace(/\s+/g, "")); }
  catch { throw new Error("attachment data is not valid base64"); }
  return { path, content: binaryStr, publicPath: `/${path}` };
}

// Rebuild the blog index by merging an updated entry into the cached
// index.json — one GET instead of 161. The Function-side regen we used
// to do via fetchAllBlogPosts blew through CF's free-plan 50-subrequest
// per-invocation budget; this stays well under it.
function mergedIndex(existingIndex, updatedEntry, mode) {
  const posts = Array.isArray(existingIndex && existingIndex.posts) ? existingIndex.posts.slice() : [];
  const slug = (updatedEntry && updatedEntry.slug) || "";
  if (mode === "delete") {
    return rebuildIndex(posts.filter((p) => p.slug !== slug));
  }
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx >= 0) posts[idx] = updatedEntry;
  else posts.push(updatedEntry);
  return rebuildIndex(posts);
}
function rebuildIndex(posts) {
  const cleaned = posts
    .filter((p) => p && p.title && p.slug)
    .map((p) => ({
      title:       p.title       || "",
      date:        p.date        || "",
      category:    p.category    || "",
      author:      p.author      || "",
      hero_image:  p.hero_image  || "",
      excerpt:     p.excerpt     || "",
      read_time:   p.read_time   || "",
      source_url:  p.source_url  || "",
      slug:        p.slug        || "",
    }))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const counts = {};
  for (const p of cleaned) if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
  const categories = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return { generated_at: null, post_count: cleaned.length, categories, posts: cleaned };
}

export const onRequestGet = async ({ env }) => {
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
  const frontmatter = { ...(body.frontmatter || {}) };
  if (!frontmatter.title) return badRequest("frontmatter.title is required");
  const postBody = body.body || "";
  const path = `assets/blog/${slug}.md`;

  try {
    // Quick pre-flight: don't clobber an existing post.
    const existing = await ghGet(path, env);
    if (existing && existing.sha) return badRequest(`post "${slug}" already exists`);

    // Handle pending hero-image upload (if any): commit it in the same
    // PR and update frontmatter.hero_image to its final path before the
    // .md is serialized.
    const filesToCommit = [];
    if (body.heroImageUpload) {
      try {
        const att = makeAttachmentFile(slug, body.heroImageUpload);
        if (att) {
          filesToCommit.push({ path: att.path, content: att.content });
          frontmatter.hero_image = att.publicPath;
        }
      } catch (err) { return badRequest(err.message); }
    }

    // ONE call to the existing index.json instead of 161 ghGets.
    const existingIndex = await loadBlogIndex(env).then((posts) => ({ posts }));
    const updatedEntry = { ...frontmatter, slug };
    const newIndex = mergedIndex(existingIndex, updatedEntry, "upsert");
    const pages = await loadPagesJson(env);
    const sitemap = buildSitemapXml(pages, newIndex.posts);

    filesToCommit.push(
      { path, content: buildPostFile(frontmatter, postBody) },
      { path: "assets/blog/index.json", content: JSON.stringify(newIndex, null, 2) + "\n" },
      { path: "sitemap.xml", content: sitemap },
    );

    const pr = await openPrWithFiles({
      branchPrefix: `admin/post-new-${slug}`,
      files: filesToCommit,
      message: `content: new blog post "${slug}"`,
      prTitle: `content: new blog post "${frontmatter.title}"`,
      prSummary: `Adds new blog post \`${slug}.md\`, regenerates blog index + sitemap.` +
        (body.heroImageUpload ? `\nBundles hero image at \`${frontmatter.hero_image}\`.` : ""),
      email: data?.admin?.email,
    }, env);

    return json({ ok: true, pr, hero_image: frontmatter.hero_image || null }, { status: 201 });
  } catch (e) {
    return serverError(`failed to create post: ${e.message}`);
  }
};
