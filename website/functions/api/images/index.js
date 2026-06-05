// GET /api/images — list every admin-uploaded image so the post editor's
// picker can show what's already available.
//
// Walks the assets/images/uploads/ subtree via the GitHub Tree API. Each
// returned item carries the public path (rooted at /assets/...), the
// file size in bytes, and the year-month bucket so the picker can group.
//
// Response: { images: [{ path, name, size, month }] }

import { ghTree, json, serverError } from "../../_utils.js";

const PREFIX = "assets/images/uploads/";

export const onRequestGet = async ({ env }) => {
  try {
    const items = await ghTree("assets/images/uploads", env);
    const images = items
      .filter((i) => i.type === "blob")
      .map((i) => {
        const rel = i.path.slice(PREFIX.length); // e.g. "2026-06/foo-1a2b.webp"
        const slash = rel.indexOf("/");
        const month = slash > 0 ? rel.slice(0, slash) : "";
        const name = slash > 0 ? rel.slice(slash + 1) : rel;
        return {
          path: `/${i.path}`,
          name,
          size: i.size || 0,
          month,
        };
      })
      .filter((it) => /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(it.name));
    images.sort((a, b) => (b.month || "").localeCompare(a.month || "") || a.name.localeCompare(b.name));
    return json({ images });
  } catch (e) {
    return serverError(`failed to list images: ${e.message}`);
  }
};
