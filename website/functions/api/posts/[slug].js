// GET    /api/posts/:slug — full markdown + SHA
// PUT    /api/posts/:slug — update post; regen blog index + sitemap; open PR
// DELETE /api/posts/:slug — remove post; regen blog index + sitemap; open PR

import {
  badRequest,
  buildPostFile,
  buildSitemapXml,
  ghGet,
  json,
  loadBlogIndex,
  loadPagesJson,
  notFound,
  openPrWithFiles,
  serverError,
  shortUuid,
  slugify,
} from "../../_utils.js";

const ALLOWED_IMG_EXT = new Set(["jpg","jpeg","png","webp","gif","svg","avif"]);
function extOf(name) { const m = /\.([a-zA-Z0-9]+)$/.exec(name||""); return m ? m[1].toLowerCase() : ""; }
function isoMonth() { const d = new Date(); return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}`; }

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

function mergedIndexUpsert(existingPosts, updatedEntry) {
  const posts = existingPosts.slice();
  const slug = updatedEntry.slug;
  const i = posts.findIndex((p) => p.slug === slug);
  if (i >= 0) posts[i] = updatedEntry; else posts.push(updatedEntry);
  return rebuildIndex(posts);
}
function mergedIndexDelete(existingPosts, slug) { return rebuildIndex(existingPosts.filter((p) => p.slug !== slug)); }
function rebuildIndex(posts) {
  const cleaned = posts.filter((p)=>p && p.title && p.slug).map((p)=>({
    title:p.title||"",date:p.date||"",category:p.category||"",author:p.author||"",
    hero_image:p.hero_image||"",excerpt:p.excerpt||"",read_time:p.read_time||"",
    source_url:p.source_url||"",slug:p.slug||"",
  })).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const counts={}; for (const p of cleaned) if (p.category) counts[p.category]=(counts[p.category]||0)+1;
  const categories = Object.entries(counts).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
  return { generated_at:null, post_count:cleaned.length, categories, posts:cleaned };
}

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
  const fm = { ...(body.frontmatter || {}) };
  if (!fm.title) return badRequest("frontmatter.title is required");
  const postBody = body.body || "";

  try {
    const path = `assets/blog/${slug}.md`;
    const existing = await ghGet(path, env);
    if (!existing) return notFound(`post "${slug}" not found`);

    const filesToCommit = [];
    if (body.heroImageUpload) {
      try {
        const att = makeAttachmentFile(slug, body.heroImageUpload);
        if (att) {
          filesToCommit.push({ path: att.path, content: att.content });
          fm.hero_image = att.publicPath;
        }
      } catch (err) { return badRequest(err.message); }
    }

    // ONE call to index.json. fetchAllBlogPosts (161 ghGets) blew through
    // CF's 50-subrequest budget on the free plan.
    const existingPosts = await loadBlogIndex(env);
    const newIndex = mergedIndexUpsert(existingPosts, { ...fm, slug });
    const pages = await loadPagesJson(env);
    const sitemap = buildSitemapXml(pages, newIndex.posts);

    filesToCommit.push(
      { path, content: buildPostFile(fm, postBody) },
      { path: "assets/blog/index.json", content: JSON.stringify(newIndex, null, 2) + "\n" },
      { path: "sitemap.xml", content: sitemap },
    );

    const pr = await openPrWithFiles({
      branchPrefix: `admin/post-update-${slug}`,
      files: filesToCommit,
      message: `content: update blog post "${slug}"`,
      prTitle: `content: update blog post "${fm.title}"`,
      prSummary: `Updates \`${slug}.md\` and regenerates blog index + sitemap.` +
        (body.heroImageUpload ? `\nBundles new hero image at \`${fm.hero_image}\`.` : ""),
      email: data?.admin?.email,
    }, env);

    return json({ ok: true, pr, hero_image: fm.hero_image || null });
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

    const existingPosts = await loadBlogIndex(env);
    const newIndex = mergedIndexDelete(existingPosts, slug);
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
