// Shared helpers: JWT (HMAC-SHA256 via WebCrypto), GitHub REST client,
// slug normalization, sitemap + blog-index regeneration, YAML frontmatter
// serialization, response helpers. No npm dependencies.

// -----------------------------------------------------------------------------
// Site constants (mirror scripts/build-sitemap.py STATIC_PAGES + SKIP)
// -----------------------------------------------------------------------------

export const SITE = "https://ontargetaba.com";

// Default priority/changefreq when a page registered in pages.json is rendered
// into the sitemap. Specific overrides for the canonical static pages live in
// STATIC_DEFAULTS below.
export const SITEMAP_DEFAULT_PRIORITY = "0.5";
export const SITEMAP_DEFAULT_CHANGEFREQ = "monthly";

// noindex'd pages — omit from sitemap entirely
export const SITEMAP_SKIP = new Set(["/thank-you", "/thank-you-confirmation"]);

// Mirrors STATIC_PAGES from scripts/build-sitemap.py — used when a slug
// matches one of the canonical pages so the sitemap remains identical.
export const STATIC_DEFAULTS = {
  "/":                                  ["1.0",  "weekly"],
  "/autism-testing":                   ["0.95", "weekly"],
  "/our-services":                     ["0.9",  "weekly"],
  "/center-based-aba-therapy":         ["0.85", "monthly"],
  "/in-home-aba-therapy":              ["0.85", "monthly"],
  "/early-intervention-autism-program":["0.85", "monthly"],
  "/potty-training-program":           ["0.8",  "monthly"],
  "/murray-utah":                      ["0.85", "weekly"],
  "/mayfield-ohio":                    ["0.85", "weekly"],
  "/gahanna-ohio":                     ["0.85", "weekly"],
  "/worthington-ohio":                 ["0.85", "weekly"],
  "/locations":                        ["0.8",  "monthly"],
  "/about":                            ["0.75", "monthly"],
  "/our-process":                      ["0.7",  "monthly"],
  "/insurance":                        ["0.85", "monthly"],
  "/faqs":                             ["0.8",  "monthly"],
  "/contact":                          ["0.85", "monthly"],
  "/pre-intake-form":                  ["0.8",  "monthly"],
  "/aba-therapy-guide":                ["0.7",  "monthly"],
  "/careers":                          ["0.7",  "monthly"],
  "/job-application":                  ["0.5",  "yearly"],
  "/employment-application":           ["0.5",  "yearly"],
  "/blog":                             ["0.9",  "daily"],
  "/privacy-policy":                   ["0.3",  "yearly"],
  "/terms-of-service":                 ["0.3",  "yearly"],
  "/cookie-consent":                   ["0.3",  "yearly"],
  "/disclaimer":                       ["0.3",  "yearly"],
  "/icon-attribution":                 ["0.2",  "yearly"],
};

export const BUILTIN_TEMPLATES = ["page-basic", "page-long-form", "page-landing"];

export const COOKIE_NAME = "ota_admin";
export const STATE_COOKIE_NAME = "ota_oauth_state";

// -----------------------------------------------------------------------------
// Generic helpers
// -----------------------------------------------------------------------------

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

export function badRequest(msg, extra = {}) {
  return json({ ok: false, error: msg, ...extra }, { status: 400 });
}

export function serverError(msg, extra = {}) {
  return json({ ok: false, error: msg, ...extra }, { status: 500 });
}

export function unauthorized(msg = "unauthorized") {
  return json({ ok: false, error: msg }, { status: 401 });
}

export function notFound(msg = "not found") {
  return json({ ok: false, error: msg }, { status: 404 });
}

export function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function shortUuid() {
  // 8-hex-char random tag, e.g. "a1b2c3d4".
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken(bytes = 16) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function today() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function parseCookies(request) {
  const header = request.headers.get("cookie") || "";
  const out = {};
  for (const part of header.split(/;\s*/)) {
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    out[decodeURIComponent(part.slice(0, eq).trim())] =
      decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

// -----------------------------------------------------------------------------
// Base64url (encode strings + Uint8Array; decode to Uint8Array)
// -----------------------------------------------------------------------------

const _enc = new TextEncoder();
const _dec = new TextDecoder();

export function b64urlEncodeBytes(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function b64urlEncodeStr(s) {
  return b64urlEncodeBytes(_enc.encode(s));
}

export function b64urlDecodeBytes(s) {
  let pad = s.length % 4;
  if (pad === 2) s += "==";
  else if (pad === 3) s += "=";
  else if (pad === 1) throw new Error("invalid b64url");
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function b64urlDecodeStr(s) {
  return _dec.decode(b64urlDecodeBytes(s));
}

// btoa on UTF-8: needed because file content for GitHub Contents API must be
// base64-encoded UTF-8 (not just btoa of a JS string, which assumes latin-1).
export function b64encodeUtf8(s) {
  const bytes = _enc.encode(s);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export function b64decodeUtf8(s) {
  const bin = atob(s.replace(/\s+/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return _dec.decode(bytes);
}

// -----------------------------------------------------------------------------
// JWT (HS256)
// -----------------------------------------------------------------------------

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    _enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signJwt(payload, secret, expiresInSeconds = 86400) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + expiresInSeconds, ...payload };
  const h = b64urlEncodeStr(JSON.stringify(header));
  const p = b64urlEncodeStr(JSON.stringify(body));
  const data = `${h}.${p}`;
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, _enc.encode(data)));
  return `${data}.${b64urlEncodeBytes(sig)}`;
}

export async function verifyJwtToken(token, secret) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  try {
    const key = await hmacKey(secret);
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecodeBytes(s),
      _enc.encode(`${h}.${p}`),
    );
    if (!ok) return null;
    const payload = JSON.parse(b64urlDecodeStr(p));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function verifyJwt(request, env) {
  const cookies = parseCookies(request);
  const tok = cookies[COOKIE_NAME];
  if (!tok) return null;
  return await verifyJwtToken(tok, env.JWT_SECRET);
}

export function adminCookie(token, maxAge = 86400) {
  return `${COOKIE_NAME}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearAdminCookie() {
  return `${COOKIE_NAME}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// -----------------------------------------------------------------------------
// GitHub REST + Git Data API client
// -----------------------------------------------------------------------------

export const GH_API = "https://api.github.com";

// Every site file lives under `website/` in the repo (the rest of the
// repo root holds docs, LICENSE, .github/, etc.). CF Pages serves
// from `website/` as the deploy root, which is why callers think in
// paths like "assets/data/header.json" — but the GitHub Contents +
// Git Data APIs need the *repo*-relative path. So we prepend this
// prefix in every API-side helper. Callers stay clean.
const REPO_PREFIX = "website/";

function repoPath(p) {
  const s = String(p || "").replace(/^\/+/, "");
  return s.startsWith(REPO_PREFIX) ? s : REPO_PREFIX + s;
}

function ghHeaders(env) {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "user-agent": "ota-admin-functions",
    "x-github-api-version": "2022-11-28",
  };
}

function repoBase(env) {
  return `${GH_API}/repos/${env.GITHUB_REPO}`;
}

function mainBranch(env) {
  return env.GITHUB_BRANCH || "main";
}

async function ghFetch(url, init, env) {
  const res = await fetch(url, {
    ...init,
    headers: { ...ghHeaders(env), ...(init && init.headers ? init.headers : {}) },
  });
  return res;
}

async function ghJson(url, init, env) {
  const res = await ghFetch(url, init, env);
  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { /* leave null */ }
  }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || text || res.statusText;
    const err = new Error(`GitHub ${res.status}: ${msg}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

// GET a file via the Contents API. Returns { sha, content (decoded text), raw }
// or null if the file is missing.
export async function ghGet(path, env, ref) {
  const branch = ref || mainBranch(env);
  const url = `${repoBase(env)}/contents/${encodeContentsPath(repoPath(path))}?ref=${encodeURIComponent(branch)}`;
  const res = await ghFetch(url, { method: "GET" }, env);
  if (res.status === 404) return null;
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub GET ${path} ${res.status}: ${t}`);
  }
  const data = await res.json();
  if (Array.isArray(data)) {
    // Directory listing — return raw array (callers must handle).
    return { sha: null, content: null, raw: data, isDir: true };
  }
  let content = "";
  if (data && data.content) {
    content = b64decodeUtf8(data.content);
  }
  return { sha: data.sha, content, raw: data };
}

// PUT (create/update) a single file via Contents API.
//
// Pass `contentBase64` when uploading binary (images, fonts) so the
// payload isn't re-encoded through UTF-8 — that double-encode mangles
// every byte >= 0x80 (0xB4 -> 0xC2 0xB4) and was silently corrupting
// every webp/png/jpg uploaded through the admin.
//
// Pass `content` for plain text (HTML, JSON, MD) — it'll be UTF-8
// encoded then base64'd, which is correct for non-ASCII text.
export async function ghPutFile({ path, content, contentBase64, message, branch, sha }, env) {
  const body = {
    message,
    branch,
    content: contentBase64 != null ? contentBase64 : b64encodeUtf8(content),
  };
  if (sha) body.sha = sha;
  return ghJson(`${repoBase(env)}/contents/${encodeContentsPath(repoPath(path))}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }, env);
}

// DELETE a file via Contents API.
export async function ghDeleteFile({ path, sha, message, branch }, env) {
  return ghJson(`${repoBase(env)}/contents/${encodeContentsPath(repoPath(path))}`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, sha, branch }),
  }, env);
}

function encodeContentsPath(p) {
  return p
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

// Get current SHA of main's HEAD commit (used to fork a new branch from).
export async function getMainSha(env) {
  const branch = mainBranch(env);
  const data = await ghJson(`${repoBase(env)}/git/ref/heads/${encodeURIComponent(branch)}`, {
    method: "GET",
  }, env);
  return data.object.sha;
}

// Create a new branch (ref) from main's current HEAD.
export async function createBranchFromMain(branchName, env) {
  const sha = await getMainSha(env);
  await ghJson(`${repoBase(env)}/git/refs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
  }, env);
  return { sha, branch: branchName };
}

// Open a Pull Request.
export async function createPr({ title, body, head, base }, env) {
  const data = await ghJson(`${repoBase(env)}/pulls`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title,
      body,
      head,
      base: base || mainBranch(env),
    }),
  }, env);
  return { number: data.number, url: data.html_url, branch: head };
}

// Commit multiple files in ONE commit on `branch` (created from main).
// files: [{ path, content, mode?: '100644', type?: 'blob', delete?: true }]
export async function commitMultipleFiles({ branch, files, message, parentSha }, env) {
  if (!files || !files.length) return null;
  const parent = parentSha || (await ghJson(
    `${repoBase(env)}/git/ref/heads/${encodeURIComponent(branch)}`,
    { method: "GET" },
    env,
  )).object.sha;

  // Get the commit object so we know its tree.
  const parentCommit = await ghJson(
    `${repoBase(env)}/git/commits/${parent}`,
    { method: "GET" },
    env,
  );
  const baseTree = parentCommit.tree.sha;

  // Create blobs for each non-delete file.
  const treeItems = [];
  for (const f of files) {
    if (f.delete) {
      treeItems.push({
        path: repoPath(f.path),
        mode: f.mode || "100644",
        type: "blob",
        sha: null,
      });
      continue;
    }
    const blob = await ghJson(`${repoBase(env)}/git/blobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content: b64encodeUtf8(f.content),
        encoding: "base64",
      }),
    }, env);
    treeItems.push({
      path: repoPath(f.path),
      mode: f.mode || "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  // Build a new tree.
  const tree = await ghJson(`${repoBase(env)}/git/trees`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ base_tree: baseTree, tree: treeItems }),
  }, env);

  // Create the commit.
  const commit = await ghJson(`${repoBase(env)}/git/commits`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, tree: tree.sha, parents: [parent] }),
  }, env);

  // Move branch ref forward.
  await ghJson(`${repoBase(env)}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sha: commit.sha, force: false }),
  }, env);

  return commit;
}

// Fetch the recursive tree for a directory at a ref. Returns array of { path, sha, type }.
export async function ghTree(prefix, env, ref) {
  const branch = ref || mainBranch(env);
  // Walk via Git Trees API at the root of the branch.
  const ref_ = await ghJson(`${repoBase(env)}/git/ref/heads/${encodeURIComponent(branch)}`, {
    method: "GET",
  }, env);
  const commit = await ghJson(`${repoBase(env)}/git/commits/${ref_.object.sha}`, {
    method: "GET",
  }, env);
  const tree = await ghJson(`${repoBase(env)}/git/trees/${commit.tree.sha}?recursive=1`, {
    method: "GET",
  }, env);
  const items = tree.tree || [];
  // Strip the website/ prefix from each path so callers see logical
  // paths matching what they passed in.
  const stripped = items.map((i) => ({
    ...i,
    path: i.path.startsWith(REPO_PREFIX) ? i.path.slice(REPO_PREFIX.length) : i.path,
  }));
  if (!prefix) return stripped;
  const pfx = prefix.replace(/\/+$/, "") + "/";
  return stripped.filter((i) => i.path.startsWith(pfx));
}

// -----------------------------------------------------------------------------
// YAML frontmatter (minimal: flat string scalars)
// -----------------------------------------------------------------------------

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
const KV_RE = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/;

export function parseFrontmatter(text) {
  const m = FRONTMATTER_RE.exec(text || "");
  if (!m) return { frontmatter: {}, body: text || "" };
  const meta = {};
  for (const rawLine of m[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const kv = KV_RE.exec(line);
    if (!kv) continue;
    let v = kv[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    meta[kv[1]] = v;
  }
  return { frontmatter: meta, body: text.slice(m[0].length) };
}

function yamlQuote(v) {
  const s = String(v);
  if (s === "") return '""';
  if (/[:#'"\n]/.test(s) || /^\s|\s$/.test(s)) {
    return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return s;
}

export function serializeFrontmatter(meta) {
  const lines = ["---"];
  for (const [k, v] of Object.entries(meta || {})) {
    if (v === undefined || v === null) continue;
    lines.push(`${k}: ${yamlQuote(v)}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

export function buildPostFile(frontmatter, body) {
  return serializeFrontmatter(frontmatter) + (body || "");
}

// -----------------------------------------------------------------------------
// Sitemap + blog-index regeneration
// -----------------------------------------------------------------------------

function urlNode(loc, lastmod, changefreq, priority) {
  return (
    "  <url>\n" +
    `    <loc>${escapeXml(loc)}</loc>\n` +
    `    <lastmod>${lastmod}</lastmod>\n` +
    `    <changefreq>${changefreq}</changefreq>\n` +
    `    <priority>${priority}</priority>\n` +
    "  </url>\n"
  );
}

// Build sitemap.xml from a snapshot of pages.json + blog index.
// `pages`     : array of { slug, draft, hidden, ... }
// `blogPosts` : array of { slug, date }
export function buildSitemapXml(pages, blogPosts) {
  const t = today();
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>\n');
  parts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');

  // Static pages first — every entry in STATIC_DEFAULTS that isn't skipped.
  // If pages.json marks one of those slugs as draft/hidden, omit.
  const omitted = new Set();
  for (const p of pages || []) {
    const s = canonicalPath(p.slug);
    if (p.draft || p.hidden) omitted.add(s);
  }
  for (const [path, [priority, changefreq]] of Object.entries(STATIC_DEFAULTS)) {
    if (SITEMAP_SKIP.has(path)) continue;
    if (omitted.has(path)) continue;
    const loc = path === "/" ? SITE : SITE + path;
    parts.push(urlNode(loc, t, changefreq, priority));
  }

  // Extra (non-static) pages added via the admin dashboard
  for (const p of pages || []) {
    const path = canonicalPath(p.slug);
    if (path === "/") continue;
    if (path in STATIC_DEFAULTS) continue;
    if (SITEMAP_SKIP.has(path)) continue;
    if (p.draft || p.hidden) continue;
    const loc = SITE + path;
    parts.push(urlNode(loc, t, SITEMAP_DEFAULT_CHANGEFREQ, SITEMAP_DEFAULT_PRIORITY));
  }

  // Blog posts
  for (const p of blogPosts || []) {
    const slug = (p.slug || "").trim();
    if (!slug) continue;
    if (p.draft || p.hidden) continue;
    const lastmod = (p.date || t).trim() || t;
    parts.push(urlNode(`${SITE}/blog/posts/${slug}`, lastmod, "monthly", "0.6"));
  }

  parts.push("</urlset>\n");
  return parts.join("");
}

function canonicalPath(slug) {
  if (!slug) return "/";
  const s = String(slug).replace(/^\/+|\.html$/g, "").replace(/^index$/, "");
  if (!s) return "/";
  return "/" + s;
}

// Build blog index.json given an updated set of posts. Sorts by date desc,
// computes category counts. Matches the existing build-blog-index.py shape.
export function buildBlogIndex(posts) {
  const cleaned = (posts || []).map((p) => ({
    title:       p.title       || "",
    date:        p.date        || "",
    category:    p.category    || "",
    author:      p.author      || "",
    hero_image:  p.hero_image  || "",
    excerpt:     p.excerpt     || "",
    read_time:   p.read_time   || "",
    source_url:  p.source_url  || "",
    slug:        p.slug        || "",
  })).filter((p) => p.title && p.slug);
  cleaned.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const counts = {};
  for (const p of cleaned) {
    if (!p.category) continue;
    counts[p.category] = (counts[p.category] || 0) + 1;
  }
  const categories = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return {
    generated_at: null,
    post_count: cleaned.length,
    categories,
    posts: cleaned,
  };
}

// Pull every blog post's frontmatter via Tree API + Contents API (batched).
// Returns array of post entries (same shape buildBlogIndex expects).
export async function fetchAllBlogPosts(env) {
  const items = await ghTree("assets/blog", env);
  const mds = items.filter((i) => i.type === "blob" && i.path.endsWith(".md"));
  const out = [];
  // Sequential fetches keep us well under the GitHub rate limit and avoid
  // burning the worker's subrequest budget when blog files grow.
  for (const it of mds) {
    const file = await ghGet(it.path, env);
    if (!file || !file.content) continue;
    const { frontmatter } = parseFrontmatter(file.content);
    if (!frontmatter.title) continue;
    out.push({
      ...frontmatter,
      slug: it.path.split("/").pop().replace(/\.md$/, ""),
    });
  }
  return out;
}

// Convenience: produce { path, content } for the regenerated sitemap.xml.
export async function regenerateSitemapFile(pagesOverride, env, postsOverride) {
  const pages = pagesOverride !== undefined
    ? pagesOverride
    : await loadPagesJson(env);
  const posts = postsOverride !== undefined
    ? postsOverride
    : await loadBlogIndex(env);
  return {
    path: "sitemap.xml",
    content: buildSitemapXml(pages, posts),
  };
}

export async function regenerateBlogIndexFile(postsOverride, env) {
  const posts = postsOverride !== undefined
    ? postsOverride
    : await fetchAllBlogPosts(env);
  const idx = buildBlogIndex(posts);
  return {
    path: "assets/blog/index.json",
    content: JSON.stringify(idx, null, 2) + "\n",
  };
}

export async function loadPagesJson(env) {
  const file = await ghGet("assets/data/pages.json", env);
  if (!file || !file.content) return [];
  try {
    const data = JSON.parse(file.content);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.pages)) return data.pages;
    return [];
  } catch {
    return [];
  }
}

export async function loadPagesJsonWithSha(env) {
  const file = await ghGet("assets/data/pages.json", env);
  if (!file) return { pages: [], sha: null };
  let pages = [];
  try {
    const data = JSON.parse(file.content || "[]");
    pages = Array.isArray(data) ? data : (Array.isArray(data.pages) ? data.pages : []);
  } catch {
    pages = [];
  }
  return { pages, sha: file.sha };
}

export async function loadBlogIndex(env) {
  const file = await ghGet("assets/blog/index.json", env);
  if (!file || !file.content) return [];
  try {
    const data = JSON.parse(file.content);
    return Array.isArray(data.posts) ? data.posts : [];
  } catch {
    return [];
  }
}

// -----------------------------------------------------------------------------
// PR body helper
// -----------------------------------------------------------------------------

export function prBody(summary, email, files) {
  const list = (files || [])
    .map((f) => `- \`${f}\``)
    .join("\n");
  return [
    summary,
    "",
    "Files changed:",
    list || "- (multiple)",
    "",
    `Authored via Admin Dashboard by ${email || "unknown@ontargetaba.com"}.`,
  ].join("\n");
}

// One-shot helper: create branch, commit all files atomically, open PR.
export async function openPrWithFiles({
  branchPrefix, // e.g. "admin/post-update-myslug"
  files,        // [{ path, content, delete? }]
  message,      // commit message
  prTitle,
  prSummary,
  email,
}, env) {
  const branch = `${branchPrefix}-${shortUuid()}`;
  const { sha: parentSha } = await createBranchFromMain(branch, env);
  await commitMultipleFiles({ branch, files, message, parentSha }, env);
  const pr = await createPr({
    title: prTitle,
    body: prBody(prSummary, email, files.map((f) => f.path)),
    head: branch,
  }, env);
  return pr;
}

// -----------------------------------------------------------------------------
// Admin allowlist
// -----------------------------------------------------------------------------

export function isAdminEmail(email, env) {
  if (!email) return false;
  const list = String(env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(String(email).trim().toLowerCase());
}
