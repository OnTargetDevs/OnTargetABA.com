// GET /api/header — current header.json + sha
// PUT /api/header — update header.json; open PR

import {
  badRequest,
  ghGet,
  json,
  notFound,
  openPrWithFiles,
  serverError,
} from "../_utils.js";

const PATH = "assets/data/header.json";

export const onRequestGet = async ({ env }) => {
  try {
    const file = await ghGet(PATH, env);
    if (!file) return notFound("header.json not found");
    let data;
    try { data = JSON.parse(file.content); } catch { data = {}; }
    return json({ ...data, sha: file.sha });
  } catch (e) {
    return serverError(`failed to load header: ${e.message}`);
  }
};

export const onRequestPut = async ({ request, env, data }) => {
  let body;
  try { body = await request.json(); } catch { return badRequest("invalid JSON"); }
  // strip sha out of the persisted body
  const { sha: _sha, ...payload } = body || {};

  try {
    const files = [
      { path: PATH, content: JSON.stringify(payload, null, 2) + "\n" },
    ];
    const pr = await openPrWithFiles({
      branchPrefix: "admin/header-update",
      files,
      message: "content: update header.json",
      prTitle: "content: update header configuration",
      prSummary: "Updates `assets/data/header.json` (nav, announcement, breadcrumbs).",
      email: data?.admin?.email,
    }, env);
    return json({ ok: true, pr });
  } catch (e) {
    return serverError(`failed to update header: ${e.message}`);
  }
};
