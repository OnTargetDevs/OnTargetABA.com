// GET /api/templates — list builtin + custom templates.

import {
  BUILTIN_TEMPLATES,
  ghTree,
  json,
  serverError,
} from "../../_utils.js";

export const onRequestGet = async ({ env }) => {
  try {
    const items = await ghTree("assets/templates", env);
    const customNames = items
      .filter((i) => i.type === "blob" && i.path.endsWith(".html"))
      .map((i) => i.path.split("/").pop().replace(/\.html$/, ""));

    const seen = new Set();
    const templates = [];
    for (const name of BUILTIN_TEMPLATES) {
      templates.push({ name, source: "builtin" });
      seen.add(name);
    }
    for (const name of customNames) {
      if (seen.has(name)) continue;
      templates.push({ name, source: "custom" });
      seen.add(name);
    }
    return json({ templates });
  } catch (e) {
    return serverError(`failed to list templates: ${e.message}`);
  }
};
