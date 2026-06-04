// POST /api/images/upload
//
// Accepts a base64-encoded image payload from the admin dashboard, validates
// the extension + size, and commits it to assets/images/uploads/ on a
// dedicated admin/upload-* branch with a PR. Returns { ok, path, pr }.
//
// Body shape:
//   { filename: "hero.jpg", contentType: "image/jpeg", data: "<base64-bytes-only>" }
//
// `data` is the raw base64 — no `data:` URI prefix; the admin UI strips
// that before sending. This keeps the Function below CF's per-request
// memory budget on large uploads.

import {
  badRequest,
  json,
  openPrWithFiles,
  serverError,
  shortUuid,
  slugify,
} from "../../_utils.js";

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"]);
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB — comfortably under CF Pages limits.

function extOf(name) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || "");
  return m ? m[1].toLowerCase() : "";
}

function isoMonth() {
  // Cloudflare Workers expose Date; we just need year-month for grouping.
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const onRequestPost = async ({ request, env, data }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("invalid JSON");
  }

  const rawName = String(body.filename || "");
  const b64 = String(body.data || "");
  if (!rawName) return badRequest("filename is required");
  if (!b64) return badRequest("data (base64) is required");

  const ext = extOf(rawName);
  if (!ALLOWED_EXT.has(ext)) {
    return badRequest(`unsupported extension ".${ext}" — allowed: ${[...ALLOWED_EXT].join(", ")}`);
  }

  // Approximate decoded byte length without decoding to validate cheaply.
  const padPart = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  const approxBytes = Math.floor((b64.length * 3) / 4) - padPart;
  if (approxBytes > MAX_BYTES) {
    return badRequest(`file too large (${(approxBytes / 1024 / 1024).toFixed(1)} MB > 4 MB)`);
  }

  // Build a tidy path: assets/images/uploads/{yyyy-mm}/{slug}-{shorthash}.{ext}
  const baseName = rawName.replace(/\.[^.]+$/, "");
  const slug = slugify(baseName) || "image";
  const tag = shortUuid();
  const path = `assets/images/uploads/${isoMonth()}/${slug}-${tag}.${ext}`;
  // openPrWithFiles writes via the Git Data API; passing the base64 string
  // through b64encodeUtf8 would double-encode the bytes. To keep the helper
  // simple and avoid touching _utils.js shape, we hand the helper the file
  // content as the *decoded* binary string via atob, which b64encodeUtf8
  // then re-encodes correctly.
  let binaryStr;
  try {
    binaryStr = atob(b64.replace(/\s+/g, ""));
  } catch {
    return badRequest("data is not valid base64");
  }

  try {
    const pr = await openPrWithFiles({
      branchPrefix: `admin/upload-${slug}`,
      files: [{ path, content: binaryStr }],
      message: `chore: upload image ${path}`,
      prTitle: `chore: upload image "${rawName}"`,
      prSummary: `Uploads \`${rawName}\` from the admin dashboard to \`${path}\`.`,
      email: data?.admin?.email,
    }, env);

    return json({ ok: true, path: `/${path}`, pr }, { status: 201 });
  } catch (e) {
    return serverError(`upload failed: ${e.message}`);
  }
};
