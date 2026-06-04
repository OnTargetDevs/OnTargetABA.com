// GET  /api/pages/{slug}/seo — current SEO overrides + sha
// PUT  /api/pages/{slug}/seo — write SEO overrides; open PR
//
// Stored as a JSON file at assets/data/pages/{slug}.seo.json. The runtime
// loader (assets/js/page-overrides.js) reads it on every public page
// view and patches <title>, <meta name="description">, OG / Twitter
// meta, canonical link, and keywords. Search engines that run JS see
// the patched values; the next CF Pages build picks up the static
// version when inject-seo.py runs (TODO: build-time merge).

import {
  badRequest,
  ghGet,
  json,
  openPrWithFiles,
  serverError,
  slugify,
} from "../../../_utils.js";

const KNOWN = [
  "title",
  "description",
  "keywords",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "twitterTitle",
  "twitterDescription",
  "twitterImage",
  "canonical",
];

function path(slug) { return `assets/data/pages/${slug}.seo.json`; }

export const onRequestGet = async ({ params, env }) => {
  const slug = slugify(params.slug || "");
  if (!slug) return badRequest("missing slug");
  try {
    const file = await ghGet(path(slug), env);
    if (!file || !file.content) return json({ seo: {}, sha: null });
    let seo;
    try { seo = JSON.parse(file.content); } catch { seo = {}; }
    return json({ seo, sha: file.sha });
  } catch (e) {
    return serverError(`failed to load seo: ${e.message}`);
  }
};

export const onRequestPut = async ({ params, request, env, data }) => {
  const slug = slugify(params.slug || "");
  if (!slug) return badRequest("missing slug");
  let body;
  try { body = await request.json(); } catch { return badRequest("invalid JSON"); }

  // Whitelist incoming keys to the KNOWN set so callers can't smuggle
  // arbitrary fields into the file.
  const seo = {};
  for (const k of KNOWN) {
    if (body[k] != null && body[k] !== "") seo[k] = String(body[k]).slice(0, 600);
  }

  try {
    const files = [
      { path: path(slug), content: JSON.stringify(seo, null, 2) + "\n" },
    ];
    const pr = await openPrWithFiles({
      branchPrefix: `admin/page-seo-${slug}`,
      files,
      message: `content: update SEO for "${slug}"`,
      prTitle: `content: update SEO for "${slug}"`,
      prSummary: `Updates \`${path(slug)}\`.`,
      email: data?.admin?.email,
    }, env);
    return json({ ok: true, pr });
  } catch (e) {
    return serverError(`failed to save seo: ${e.message}`);
  }
};
