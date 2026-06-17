// POST /api/images/upload
//
// Accepts a (client-side optimized) image from the admin and commits it
// directly to main under assets/images/uploads/{yyyy-mm}/. Unlike content
// edits, image uploads don't go through the PR + auto-merge loop — the
// admin needs the path available immediately so the picker can show it.
// Images are low-risk (no code execution); commits land tagged as
// "chore: upload image" with the admin's email as author.
//
// Body shape:
//   { filename: "hero.webp", contentType: "image/webp", data: "<base64-bytes-only>" }
//
// Returns: { ok, path: "/assets/images/uploads/.../<file>", commit }

import {
  badRequest,
  ghPutFile,
  json,
  serverError,
  shortUuid,
  slugify,
} from "../../_utils.js";

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"]);
const MAX_BYTES = 6 * 1024 * 1024; // 6 MB after client-side optimization should be plenty.

function extOf(name) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || "");
  return m ? m[1].toLowerCase() : "";
}

function isoMonth() {
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
    return badRequest(`file too large (${(approxBytes / 1024 / 1024).toFixed(1)} MB > ${MAX_BYTES / 1024 / 1024} MB)`);
  }

  const baseName = rawName.replace(/\.[^.]+$/, "");
  const slug = slugify(baseName) || "image";
  const tag = shortUuid();
  const path = `assets/images/uploads/${isoMonth()}/${slug}-${tag}.${ext}`;

  // Validate the base64 payload, then pass it through to GitHub
  // verbatim. Older code decoded to a binary string and let ghPutFile
  // re-encode through UTF-8 — that double-encode mangled every byte
  // >= 0x80 (0xB4 -> 0xC2 0xB4), silently corrupting every webp/png/jpg
  // uploaded through this admin.
  const cleanB64 = b64.replace(/\s+/g, "");
  try {
    atob(cleanB64.slice(0, 4));
  } catch {
    return badRequest("data is not valid base64");
  }

  try {
    const commit = await ghPutFile({
      path,
      contentBase64: cleanB64,
      message: `chore: upload image ${path}\n\nUploaded via Admin Dashboard by ${data?.admin?.email || "unknown"}.`,
      branch: env.GITHUB_BRANCH || "main",
    }, env);

    return json({
      ok: true,
      path: `/${path}`,
      filename: rawName,
      size: approxBytes,
      commit: commit?.commit?.sha || null,
    }, { status: 201 });
  } catch (e) {
    return serverError(`upload failed: ${e.message}`);
  }
};
