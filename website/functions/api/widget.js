// GET /api/widget — current widget.json + sha
// PUT /api/widget — update widget.json; open PR

import {
  badRequest,
  ghGet,
  json,
  notFound,
  openPrWithFiles,
  serverError,
} from "../_utils.js";

const PATH = "assets/data/widget.json";

const VALID_MODES = new Set(["leadbot", "leadtrap", "custom", "none"]);

export const onRequestGet = async ({ env }) => {
  try {
    const file = await ghGet(PATH, env);
    if (!file) return notFound("widget.json not found");
    let data;
    try { data = JSON.parse(file.content); } catch { data = {}; }
    return json({ ...data, sha: file.sha });
  } catch (e) {
    return serverError(`failed to load widget config: ${e.message}`);
  }
};

export const onRequestPut = async ({ request, env, data }) => {
  let body;
  try { body = await request.json(); } catch { return badRequest("invalid JSON"); }
  const { sha: _sha, ...payload } = body || {};

  if (!VALID_MODES.has(payload.mode)) {
    return badRequest(
      `mode must be one of: ${[...VALID_MODES].join(", ")}`
    );
  }

  // Trim down to the canonical shape so the JSON stays readable.
  const clean = {
    schemaVersion: 1,
    mode: payload.mode,
    leadtrap: {
      partnerId: (payload.leadtrap && payload.leadtrap.partnerId) || "",
    },
    custom: {
      snippet: (payload.custom && payload.custom.snippet) || "",
    },
  };

  try {
    const files = [
      { path: PATH, content: JSON.stringify(clean, null, 2) + "\n" },
    ];
    const pr = await openPrWithFiles({
      branchPrefix: "admin/widget-update",
      files,
      message: `content: set chat widget to ${clean.mode}`,
      prTitle: `content: switch chat widget to ${clean.mode}`,
      prSummary:
        `Updates \`assets/data/widget.json\` to mode \`${clean.mode}\`.\n\n` +
        `Modes:\n` +
        `- \`leadbot\` — load the in-repo custom widget (\`assets/js/leadbot.js\`).\n` +
        `- \`leadtrap\` — load LeadTrap.ai with the configured partner ID.\n` +
        `- \`custom\` — inject the user-provided snippet (Jotform AI agent, etc).\n` +
        `- \`none\` — load no chat widget.`,
      email: data?.admin?.email,
    }, env);
    return json({ ok: true, pr });
  } catch (e) {
    return serverError(`failed to update widget config: ${e.message}`);
  }
};
