// Catch-all: serves draft pages to authenticated admins, otherwise passes
// through to the static asset handler. Skips API/admin/asset paths.

import { ghGet, verifyJwt } from "./_utils.js";

// Module-scope cache (per worker isolate) for pages.json to avoid hammering
// the GitHub API on every static-path miss.
let _pagesCache = { ts: 0, pages: null };
const PAGES_TTL_MS = 60 * 1000;

async function loadPagesCached(env) {
  const now = Date.now();
  if (_pagesCache.pages && (now - _pagesCache.ts) < PAGES_TTL_MS) {
    return _pagesCache.pages;
  }
  try {
    const file = await ghGet("assets/data/pages.json", env);
    let pages = [];
    if (file && file.content) {
      try {
        const data = JSON.parse(file.content);
        pages = Array.isArray(data) ? data : (Array.isArray(data.pages) ? data.pages : []);
      } catch {
        pages = [];
      }
    }
    _pagesCache = { ts: now, pages };
    return pages;
  } catch {
    return _pagesCache.pages || [];
  }
}

function candidateSlug(pathname) {
  if (!pathname || pathname === "/") return null;
  let s = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!s) return null;
  s = s.replace(/\.html$/i, "");
  if (s.includes("/")) return null;
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(s)) return null;
  return s;
}

function passthrough(context) {
  // env.ASSETS is provided by Cloudflare Pages so the static handler can
  // still serve the file when this function decides not to handle the route.
  if (context.env && context.env.ASSETS && typeof context.env.ASSETS.fetch === "function") {
    return context.env.ASSETS.fetch(context.request);
  }
  return context.next();
}

export const onRequest = async (context) => {
  try {
    const url = new URL(context.request.url);
    const path = url.pathname;

    if (
      path.startsWith("/api/") ||
      path.startsWith("/admin/") ||
      path === "/admin" ||
      path.startsWith("/assets/") ||
      path.startsWith("/blog/") ||
      path.startsWith("/scripts/")
    ) {
      return passthrough(context);
    }

    const slug = candidateSlug(path);
    if (!slug) return passthrough(context);

    const pages = await loadPagesCached(context.env);
    const entry = pages.find((p) => (p.slug || "").toLowerCase() === slug.toLowerCase());
    if (!entry) return passthrough(context);

    if (entry.draft) {
      const admin = await verifyJwt(context.request, context.env);
      if (!admin) {
        return new Response("Not found", {
          status: 404,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
      // Authenticated admin previewing a draft — fetch the .html from the repo.
      const file = await ghGet(`${slug}.html`, context.env);
      if (!file || file.content == null) {
        return passthrough(context);
      }
      const banner =
        '<div style="position:fixed;top:0;left:0;right:0;z-index:99999;' +
        'background:#E84F3B;color:#fff;text-align:center;padding:6px 12px;' +
        'font-family:system-ui,sans-serif;font-size:13px;font-weight:600;' +
        'box-shadow:0 1px 4px rgba(0,0,0,0.2)">' +
        'DRAFT PREVIEW — visible only to signed-in admins' +
        '</div>';
      let html = file.content;
      if (/<body[^>]*>/i.test(html)) {
        html = html.replace(/<body([^>]*)>/i, (m, attrs) => `<body${attrs}>${banner}`);
      } else {
        html = banner + html;
      }
      return new Response(html, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store, private",
          "x-robots-tag": "noindex,nofollow",
        },
      });
    }

    // Hidden or normal — fall through to static handler (page injects its
    // own noindex/nofollow when hidden).
    return passthrough(context);
  } catch {
    return passthrough(context);
  }
};
