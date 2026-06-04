// GET /api/section-templates — list every section template the admin has
// saved.
//
// Response shape: { templates: [{ name, path, size }] }.

import { ghTree, json, serverError } from "../../_utils.js";

const PREFIX = "assets/templates/sections/";

export const onRequestGet = async ({ env }) => {
  try {
    const items = await ghTree("assets/templates/sections", env);
    const templates = items
      .filter((i) => i.type === "blob" && i.path.endsWith(".html"))
      .map((i) => {
        // i.path is repo-logical (already prefix-stripped by ghTree).
        // Pull the bare name without the trailing .html.
        const name = i.path.slice(PREFIX.length).replace(/\.html$/, "");
        return { name, path: i.path, size: i.size || 0 };
      })
      .filter((t) => t.name);
    templates.sort((a, b) => a.name.localeCompare(b.name));
    return json({ templates });
  } catch (e) {
    return serverError(`failed to list section templates: ${e.message}`);
  }
};
