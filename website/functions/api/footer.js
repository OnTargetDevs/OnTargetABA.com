// GET /api/footer — current footer.json + sha
// PUT /api/footer — update footer.json; open PR

import {
  badRequest,
  ghGet,
  json,
  notFound,
  openPrWithFiles,
  serverError,
} from "../_utils.js";

const PATH = "assets/data/footer.json";

export const onRequestGet = async ({ env }) => {
  try {
    const file = await ghGet(PATH, env);
    if (!file) return notFound("footer.json not found");
    let data;
    try { data = JSON.parse(file.content); } catch { data = {}; }
    return json({ ...data, sha: file.sha });
  } catch (e) {
    return serverError(`failed to load footer: ${e.message}`);
  }
};

export const onRequestPut = async ({ request, env, data }) => {
  let body;
  try { body = await request.json(); } catch { return badRequest("invalid JSON"); }
  const { sha: _sha, ...payload } = body || {};

  try {
    const files = [
      { path: PATH, content: JSON.stringify(payload, null, 2) + "\n" },
    ];
    const pr = await openPrWithFiles({
      branchPrefix: "admin/footer-update",
      files,
      message: "content: update footer.json",
      prTitle: "content: update footer configuration",
      prSummary: "Updates `assets/data/footer.json` (columns, legal links, copyright).",
      email: data?.admin?.email,
    }, env);
    return json({ ok: true, pr });
  } catch (e) {
    return serverError(`failed to update footer: ${e.message}`);
  }
};
