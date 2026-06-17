// GET /api/recent-prs — list recent admin-generated PRs for the dashboard.
//
// admin/index.html populates the "Recent pull requests" card from this.
// We filter for PRs whose head branch starts with "admin/" so we don't
// drown the list in unrelated hand-authored work.

import { GH_API, badRequest, json, serverError } from "../_utils.js";

const STATE_VALUES = new Set(["open", "closed", "all"]);

function ghHeaders(env) {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "user-agent": "ontargetaba-admin",
    "x-github-api-version": "2022-11-28",
  };
}

export const onRequestGet = async ({ request, env }) => {
  if (!env.GITHUB_REPO || !env.GITHUB_TOKEN) {
    return serverError("GITHUB_REPO or GITHUB_TOKEN env vars missing");
  }

  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "all";
  if (!STATE_VALUES.has(state)) return badRequest("state must be open|closed|all");
  const limit = Math.max(
    1,
    Math.min(50, parseInt(url.searchParams.get("limit") || "10", 10) || 10)
  );

  // The Pulls API doesn't support head-branch globbing, so we ask for the
  // most-recent N (sorted by updated) and filter client-side. 50 max is
  // plenty for the dashboard view; older PRs live on github.com.
  const apiUrl =
    `${GH_API}/repos/${env.GITHUB_REPO}/pulls?` +
    new URLSearchParams({
      state,
      sort: "updated",
      direction: "desc",
      per_page: "50",
    }).toString();

  let prs;
  try {
    const res = await fetch(apiUrl, { headers: ghHeaders(env) });
    if (!res.ok) {
      const text = await res.text();
      return serverError(`GitHub ${res.status}: ${text.slice(0, 300)}`);
    }
    prs = await res.json();
  } catch (e) {
    return serverError(`failed to list PRs: ${e.message}`);
  }

  const filtered = (prs || [])
    .filter((p) => (p.head && p.head.ref && p.head.ref.startsWith("admin/")))
    .slice(0, limit)
    .map((p) => ({
      number: p.number,
      title: p.title,
      url: p.html_url,
      state: p.state,
      merged: !!p.merged_at,
      draft: !!p.draft,
      branch: p.head && p.head.ref,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      mergedAt: p.merged_at,
      closedAt: p.closed_at,
      user: p.user && { login: p.user.login, avatar: p.user.avatar_url },
    }));

  return json({ prs: filtered, total: filtered.length });
};
