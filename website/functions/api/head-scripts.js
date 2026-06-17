// GET /api/head-scripts — current head-scripts.json + sha
// PUT /api/head-scripts — update head-scripts.json; open PR
//
// The content of `scripts` is dropped verbatim into every public page's
// <head>, right before </head>, by scripts/optimize-pages.py.

import {
  badRequest,
  ghGet,
  json,
  notFound,
  openPrWithFiles,
  serverError,
} from "../_utils.js";

const PATH = "assets/data/head-scripts.json";

export const onRequestGet = async ({ env }) => {
  try {
    const file = await ghGet(PATH, env);
    if (!file) return notFound("head-scripts.json not found");
    let data;
    try { data = JSON.parse(file.content); } catch { data = {}; }
    return json({ ...data, sha: file.sha });
  } catch (e) {
    return serverError(`failed to load head-scripts: ${e.message}`);
  }
};

export const onRequestPut = async ({ request, env, data }) => {
  let body;
  try { body = await request.json(); } catch { return badRequest("invalid JSON"); }
  const { sha: _sha, ...payload } = body || {};

  const clean = {
    schemaVersion: 1,
    scripts: typeof payload.scripts === "string" ? payload.scripts : "",
  };

  try {
    const files = [
      { path: PATH, content: JSON.stringify(clean, null, 2) + "\n" },
    ];
    const pr = await openPrWithFiles({
      branchPrefix: "admin/head-scripts-update",
      files,
      message: "content: update head scripts",
      prTitle: "content: update <head> scripts (analytics / pixels)",
      prSummary:
        "Updates `assets/data/head-scripts.json`. The `scripts` value is " +
        "injected verbatim into every public page's `<head>` by " +
        "`scripts/optimize-pages.py` on the next build.",
      email: data?.admin?.email,
    }, env);
    return json({ ok: true, pr });
  } catch (e) {
    return serverError(`failed to update head-scripts: ${e.message}`);
  }
};
