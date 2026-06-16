# Deployment

The Cloudflare Pages runbook for this project: project settings, env vars,
OAuth setup, GitHub PAT, custom domain, cache rules, secret rotation, and
rollback.

If you're standing up a fresh CF Pages project from this repo, work through
the sections top to bottom. If you're maintaining an existing one, jump to
the relevant subhead.

---

## Cloudflare Pages project settings

In the CF dashboard → Pages → your project → **Settings → Builds & deployments**:

| Field                       | Value                              |
|-----------------------------|------------------------------------|
| Production branch           | `main`                             |
| Root directory              | `/website`                         |
| Build command               | `bash build.sh`                    |
| Build output directory      | `.`                                |
| Node version (env var)      | `NODE_VERSION=20` (or newer)       |
| Python version (env var)    | `PYTHON_VERSION=3.11`              |

The project's source is set under **Source** → Git → connect to GitHub →
pick `OnTargetDevs/OnTargetABA.com` → branch `main`.

Pushes to `main` deploy to production. Pushes to any other branch deploy
to a preview URL (`{branch}.{project}.pages.dev`). PRs auto-build a preview.

---

## Environment variables

CF Pages → Settings → **Environment variables**. Set them on **Production**
and (optionally) **Preview**. Production values are used for the live site
at `ontargetaba.com`; Preview values run on the auto-built PR previews.

### Admin layer (required)

| Var                  | What it does                                                                                  |
|----------------------|-----------------------------------------------------------------------------------------------|
| `GOOGLE_CLIENT_ID`   | OAuth client ID from Google Cloud Console. Identifies this app to Google during sign-in.       |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret. Used by `/api/auth/callback` to exchange the auth code for tokens.      |
| `GOOGLE_REDIRECT_URI`| The exact URL Google calls back to. Production: `https://ontargetaba.com/api/auth/callback`. Preview: the preview hostname's equivalent. |
| `ADMIN_EMAILS`       | Comma-separated allow-list of Google account emails permitted into `/admin`. Anyone not on the list is bounced. |
| `JWT_SECRET`         | Random 32+ char string used to sign admin session JWTs. Rotating it logs everyone out.          |
| `GITHUB_TOKEN`       | Fine-grained GitHub PAT scoped to this repo. `Contents: R/W` + `Pull requests: R/W`. Used by every write Function. |
| `GITHUB_REPO`        | `OnTargetDevs/OnTargetABA.com`. Identifies the repo for the GitHub Contents API.                |
| `GITHUB_BRANCH`      | Base branch for admin PRs. Always `main`.                                                       |

### Build (optional)

| Var                  | What it does                                                                                  |
|----------------------|-----------------------------------------------------------------------------------------------|
| `SITEMAP_FULL_PING`  | Set to `1` to swap the IndexNow ping from "last 14 days" to "every URL." Unset (or `0`) afterward. |
| `NODE_VERSION`       | Pin Node version on the build VM.                                                              |
| `PYTHON_VERSION`     | Pin Python version on the build VM.                                                            |

### Setting them

> ⚠️ **Setting an env var does NOT update existing deployments.** CF Pages
> bakes the env-var snapshot in at deploy time; live Functions on the
> currently-serving deploy continue to see the *old* values until a
> fresh deploy is triggered. After any env-var change, manually
> **Retry deployment** on the latest, or push a commit, or `POST
> /pages/projects/{name}/deployments` (see
> `docs/TROUBLESHOOTING.md` → Error 1101 for the API recipe).

For each var:

1. Click **Add variable**.
2. Pick the environment (Production or Preview).
3. For secrets (`GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `GITHUB_TOKEN`),
   check **Encrypt** so the value is masked in the dashboard.
4. Save.

After changing env vars you must trigger a redeploy (Deployments tab →
**Retry deployment** on the latest, or push an empty commit) for the new
values to be picked up by Functions.

---

## Google OAuth setup

For the admin sign-in to work, you need a Google Cloud project with an OAuth
2.0 web client.

1. Go to **console.cloud.google.com** → create a project (e.g. "On Target
   ABA Admin").
2. **APIs & Services → OAuth consent screen.** Pick **External**. Fill in:
   - App name: "On Target ABA Admin"
   - User support email: an address you control
   - Developer contact: the same
   - Logo (optional): the bullseye mark
   - Authorized domain: `ontargetaba.com`
   - Save.
3. Add scopes: `openid`, `email`, `profile`. (You don't need anything
   broader &mdash; the Function only needs to know who signed in.)
4. Add test users while the app is in **Testing** mode (every admin's
   Google email). When you're ready, click **Publish App** so any
   allow-listed Google account can sign in. (Publishing doesn't make the
   app "available to the world" &mdash; `ADMIN_EMAILS` still gates entry.)
5. **APIs & Services → Credentials → Create credentials → OAuth client ID:**
   - Application type: **Web application**
   - Name: "On Target ABA Admin (Production)"
   - **Authorized JavaScript origins:** `https://ontargetaba.com`
   - **Authorized redirect URIs:**
     - `https://ontargetaba.com/api/auth/callback` (production)
     - (optional) the preview deploy's callback URL, e.g.
       `https://website.ontargetnotes.com/api/auth/callback`
   - Create.
6. Copy the Client ID and Client Secret. Paste into CF Pages env vars
   (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`). Set
   `GOOGLE_REDIRECT_URI` to match exactly what you authorized.

If the redirect URI in CF Pages doesn't *exactly* match one of the
authorized URIs in Google (scheme, host, path, no trailing slash
mismatches), sign-in fails with `redirect_uri_mismatch`. This is the
single most common setup mistake.

---

## GitHub PAT (fine-grained)

The admin Functions write to the repo through the GitHub Contents API.
They need a token scoped only as far as needed.

1. github.com → **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. **Token name:** "OnTargetABA admin writes".
3. **Expiration:** 90 days or 1 year. Set a calendar reminder to rotate.
4. **Resource owner:** `OnTargetDevs` (the org that owns the repo).
5. **Repository access:** **Only select repositories** →
   `OnTargetDevs/OnTargetABA.com`.
6. **Repository permissions:**
   - **Contents:** Read and write
   - **Pull requests:** Read and write
   - Everything else: No access
7. Generate. Copy the `github_pat_...` token immediately (you can't view
   it again).
8. Paste into CF Pages → `GITHUB_TOKEN` (Production env, Encrypted).

A coarse classic PAT also works, but fine-grained is safer &mdash; the
blast radius if it leaks is exactly two permissions on exactly one repo.

---

## Custom domain

CF Pages projects deploy to `{project}.pages.dev` by default. The custom
domain mapping for this site:

- `website.ontargetnotes.com` → the CF Pages project (preview-style domain
  the user owns).
- `ontargetaba.com` → the production domain (once cut over from WordPress).

To add a custom domain:

1. CF Pages → your project → **Custom domains** → **Set up a custom domain**.
2. Enter the domain (e.g. `ontargetaba.com`).
3. CF inspects DNS. If the domain is on Cloudflare DNS, it offers a
   one-click setup. If it's elsewhere, it gives you a CNAME or A record to
   add at the registrar.
4. Wait for DNS propagation. SSL is automatic.

The site's canonical URLs (in `inject-seo.py`, `build-sitemap.py`, and
`gen-og-images.mjs`) always point at `https://ontargetaba.com`. If you
rename the production domain you have to change the `SITE` constant in
each of those scripts.

---

## Cache rules (`_headers`)

`_headers` declares CDN cache policy. Current rules:

| Path                                  | Cache                                    | Why                                          |
|---------------------------------------|------------------------------------------|----------------------------------------------|
| `/*`                                  | (no Cache-Control set; default short)    | HTML is short-lived; edits should propagate. |
| `/sitemap.xml`                        | `public, max-age=3600`                   | Updated on every deploy. 1h is fine.         |
| `/robots.txt`                         | `public, max-age=86400`                  | Changes rarely.                              |
| `/{indexnow-key}.txt`                 | `public, max-age=300`                    | Search engines must see updates quickly.     |
| `/assets/images/*`                    | `public, max-age=31536000, immutable`    | Filenames are effectively content-hashed.    |
| `/assets/css/*`                       | `public, max-age=86400`                  | We edit these; a day is enough.              |
| `/assets/js/*`                        | `public, max-age=86400`                  | Same.                                        |
| `/assets/blog/*`                      | `public, max-age=600`                    | Editors expect blog changes to show fast.    |

Plus the security headers at the top of `_headers`:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), camera=(), microphone=()`

To purge the cache after an emergency edit:

1. CF dashboard → the zone for the production domain → **Caching → Configuration**.
2. **Purge Everything**, or **Custom Purge** with the specific URL.

For routine edits, just wait for the cache TTL to expire (or hard-refresh
in the browser). Most edits don't need a manual purge because the affected
URL is already short-cached.

---

## Rotating secrets

### Rotate `JWT_SECRET`

1. Generate a new random 32+ char string:
   `openssl rand -base64 48`.
2. Update `JWT_SECRET` in CF Pages → Environment variables (Production).
3. Trigger a redeploy.
4. Every existing admin session is now invalid &mdash; admins must sign in
   again. Their data isn't lost; they're just bounced to Google.

Rotate any time you suspect the secret leaked, or on a schedule (every
90 days is a reasonable cadence).

### Rotate `GITHUB_TOKEN`

1. Generate a new fine-grained PAT (same scopes as the old one).
2. Update `GITHUB_TOKEN` in CF Pages.
3. Redeploy.
4. Revoke the old PAT in github.com → Developer settings.

Do this every 90 days or when the existing PAT is about to expire (GitHub
emails you a heads-up). If you rotate without revoking, both tokens stay
valid for a bit &mdash; not great hygiene but not an outage.

### Rotate `GOOGLE_CLIENT_SECRET`

1. Google Cloud Console → Credentials → your OAuth client → **Reset secret**.
2. Copy the new secret.
3. Update `GOOGLE_CLIENT_SECRET` in CF Pages.
4. Redeploy.
5. The old secret stops working after a grace period; existing sessions
   keep working because the secret is only used during sign-in.

### Rotate the IndexNow key

1. Pick a new 32-hex-char key.
2. Update the `KEY` constant in `scripts/indexnow-ping.py`.
3. Rename `website/c8f5d3a1e947b2f6a4c1b9d8e6f3a2b5.txt` to
   `website/{new-key}.txt` and set its contents to `{new-key}`.
4. Update `_headers` to match the new path.
5. Commit, push, deploy.
6. Search engines verify the new key the next time you ping. The old key
   stops being honored once they re-verify.

---

## Rollback

If a deploy breaks production:

1. CF Pages → your project → **Deployments**.
2. Find the last known-good deploy (the green one before the red one).
3. Click the `...` menu → **Rollback to this deployment**.

The rollback is instant (CF flips the alias to the prior bundle). You then:

- Either fix the breaking change on `main` (revert the bad PR, push the
  fix, let CF redeploy), or
- Revert the bad PR and accept that the rolled-back deploy is now the
  current state until the revert ships.

Pages doesn't auto-redeploy after a rollback; the rollback *is* the new
active deploy. The next push to `main` will replace it.

For breaking admin Function bugs (where the site itself loads but `/admin`
or `/api/*` is broken), rollback is the same procedure &mdash; the
Function code ships with the static bundle, so reverting the deploy
reverts the Function too.
