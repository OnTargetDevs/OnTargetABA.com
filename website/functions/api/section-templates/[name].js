// GET /api/section-templates/{name} — returns the raw HTML of a saved
// section template so the page editor can insert it into the iframe.

import { badRequest, ghGet, notFound, serverError } from "../../_utils.js";

export const onRequestGet = async ({ params, env }) => {
  const name = String(params.name || "").replace(/[^a-z0-9-]/gi, "");
  if (!name) return badRequest("missing name");

  try {
    const file = await ghGet(`assets/templates/sections/${name}.html`, env);
    if (!file || !file.content) return notFound("section template not found");
    return new Response(file.content, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return serverError(`failed to load section template: ${e.message}`);
  }
};
