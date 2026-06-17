# Troubleshooting

Issues that have actually hit production, with root cause and the fix that
worked. If you hit something new, add it here so the next person doesn't
have to rediscover it.

---

## Error 1101 ("Worker threw exception") on `/api/auth/google`

### Symptom

Clicking **Sign in with Google** at `/admin` lands on a Cloudflare error
page:

> Error 1101 Ray ID: ... Worker threw exception. You've requested a page
> on a website that is on the Cloudflare network. An unknown error
> occurred while rendering the page.

### Why this happens

`/api/auth/google` is a Pages Function. The first thing it does is read
env vars (`env.JWT_SECRET`, `env.GOOGLE_CLIENT_ID`, `env.GOOGLE_REDIRECT_URI`),
sign a state cookie with `JWT_SECRET`, and 302 to Google's consent screen.

If **any** of those env vars resolves to `undefined`, `signJwt()` throws
`TypeError: Cannot read properties of undefined` (or similar). The thrown
exception escapes the Function and Cloudflare returns 1101.

The almost-always cause: **the env var was set on the Pages project
*after* the currently-serving deployment was built.** CF Pages env-var
changes don't apply retroactively to existing deployments — they take
effect on the *next* deploy.

A close second: a typo / wrong case in the var name (env vars are
case-sensitive — `JWT_Secret` is not `JWT_SECRET`).

### How to fix it right now

1. Confirm all required env vars are present, all marked **Secret**
   (not Plaintext — see below):

   ```
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   GOOGLE_REDIRECT_URI
   ADMIN_EMAILS
   JWT_SECRET
   GITHUB_TOKEN
   GITHUB_REPO
   GITHUB_BRANCH
   ```

2. **Trigger a fresh deployment.** Either:

   - Push any commit to `main`, OR
   - In CF dashboard → Workers & Pages → ontargetaba → Deployments →
     **Retry deployment** on the latest, OR
   - Via API:

     ```bash
     TOKEN=$(awk -F'"' '/oauth_token/{print $2}' \
       "$APPDATA/xdg.config/.wrangler/config/default.toml")
     curl --ssl-no-revoke -X POST \
       -H "Authorization: Bearer $TOKEN" \
       -F "branch=main" \
       https://api.cloudflare.com/client/v4/accounts/8c5c2baf2cd46499b5989ef288febd82/pages/projects/ontargetaba/deployments
     ```

3. Wait for the deploy to finish (~1-3 minutes). The new deployment
   inherits the current env-var values at build time.

### How to prevent it next time

- **Set env vars *before* the first deploy** of a new Pages project. The
  permanent fix is to bake them in before the project ever serves traffic.
- **After any env-var change, manually retry the latest deployment** if
  no other change is coming. Don't assume the change "takes effect" on
  the running deploy — it doesn't.
- **Monitor `wrangler pages deployment tail`** during testing — Function
  exceptions log there with a real stack trace, which beats guessing
  from a 1101.

---

## `redirect_uri_mismatch` from Google after sign-in

### Symptom

After clicking Sign in, Google returns:

> Error 400: redirect_uri_mismatch. The redirect URI in the request does
> not match the ones authorized for the OAuth client.

### Why

The value of `GOOGLE_REDIRECT_URI` on CF Pages must **exactly** match
one of the **Authorized redirect URIs** on the OAuth client in Google
Cloud Console. Mismatches happen on:

- **Case.** `OAuth/Callback` is not the same as `oauth/callback`. Our
  Function file lives at `functions/OAuth/Callback.js`, so the URL has
  capital `O` and `C`.
- **Host.** Each environment (preview, production, custom domain) is a
  different URI. If you start using `beta.ontargetaba.com`, you must
  add `https://beta.ontargetaba.com/OAuth/Callback` to the OAuth client
  separately — the wildcard isn't honored.
- **Trailing slash.** `https://example.com/OAuth/Callback/` is rejected
  if you authorized `https://example.com/OAuth/Callback`.

### Fix

1. https://console.cloud.google.com/apis/credentials → your OAuth 2.0
   Client ID
2. **Authorized redirect URIs** → add every host you'll redirect from:

   - `https://ontargetaba.pages.dev/OAuth/Callback`
   - `https://beta.ontargetaba.com/OAuth/Callback`
   - `https://ontargetaba.com/OAuth/Callback` (when you cut over)

3. **Authorized JavaScript origins** → mirror those without the path:

   - `https://ontargetaba.pages.dev`
   - `https://beta.ontargetaba.com`
   - `https://ontargetaba.com`

4. Save. Google takes a few seconds to propagate.

---

## DNS shows `NXDOMAIN` after adding a new subdomain

### Symptom

You added a CNAME for `something.ontargetaba.com` in Cloudflare DNS, but
your browser still gets "site can't be reached" / `NXDOMAIN`. Other
people / phones on cellular load the site fine.

### Why

Your ISP's recursive DNS resolver (e.g. `dsldevice6.attlocal.net` on AT&T
fiber) cached the **NXDOMAIN response** from before the record existed.
NXDOMAIN responses are cached by the upstream resolver against the `.com`
TLD's `SOA.minimum` TTL — typically 30-60 minutes — and a `flushdns` on
your machine doesn't clear the resolver's cache, only your local one.

### Verify

```powershell
# Query Cloudflare authoritative nameservers directly — bypasses caches:
Resolve-DnsName beta.ontargetaba.com -Server vivienne.ns.cloudflare.com -DnsOnly
```

If the authoritative answer is correct, the record is live globally.
It's just your network's cache that's stale.

### Fix (pick one)

- Switch your machine's DNS to 1.1.1.1 / 8.8.8.8 (won't have your stale
  cache):

  ```powershell
  Set-DnsClientServerAddress -InterfaceAlias "Wi-Fi" -ServerAddresses 1.1.1.1,8.8.8.8
  ipconfig /flushdns
  ```

- Test from a phone on cellular (different resolver).
- Wait 30-60 minutes for your ISP's cache to expire.

---

## Wrangler refuses to `login` ("You are logged in with an API Token")

### Symptom

```
✘ [ERROR] You are logged in with an API Token. Unset the
CLOUDFLARE_API_TOKEN in the environment to log in via OAuth.
```

…even after you `unset CLOUDFLARE_API_TOKEN` in the shell.

### Why

Wrangler 4.x auto-loads `.env` from the current working directory via
dotenv. The token-removal you did in the shell is meaningless because
wrangler re-reads `.env` on every invocation.

### Fix

Run wrangler from a directory with no `.env`:

```powershell
cd $env:TEMP
$env:CLOUDFLARE_API_TOKEN = $null
npx wrangler login
```

After OAuth is stored at `~/.wrangler/config/default.toml`, subsequent
wrangler commands work from anywhere — **but** if `CLOUDFLARE_API_TOKEN`
is in env when you run them, wrangler prefers the token over OAuth.
Either rename the var in `.env` (e.g. `CLOUDFLARE_API_TOKEN_OLD=`) or
keep running from a dir without a `.env`.

---

## Wrangler sees a different CF account than expected

### Symptom

`wrangler pages project list` shows projects you don't own, or you get
"Authentication error" calling the CF API with the wrangler-stored token.

### Why

You're logged in to a different Cloudflare account than you intended.
Wrangler shows the accounts your OAuth login is authorized for at the
top of `wrangler whoami` output. The `ontargetaba` project lives under
account ID `8c5c2baf2cd46499b5989ef288febd82`
(`Joshua@ontargetaba.com's Account`), **not** the personal account
(`Shalomkarr@gmail.com's Account` = `536d945663a8a3a20a671cf695c2e027`).

### Fix

When calling the CF REST API directly, always pass the right account ID
explicitly:

```bash
ACCOUNT=8c5c2baf2cd46499b5989ef288febd82
curl --ssl-no-revoke -H "Authorization: Bearer $TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/pages/projects/ontargetaba"
```

For wrangler commands that need account context, set
`CLOUDFLARE_ACCOUNT_ID` in the call:

```powershell
$env:CLOUDFLARE_ACCOUNT_ID = '8c5c2baf2cd46499b5989ef288febd82'
npx wrangler pages secret put GITHUB_TOKEN --project-name=ontargetaba
```

---

## CF Pages build doesn't run `build.sh`

### Symptom

After deploy, generated files are stale: `sitemap.xml` doesn't include
new pages, blog index missing recent posts, OG images missing for new
posts.

### Why

`build_command` on the Pages project is **empty**. CF Pages then just
copies the static files from the repo verbatim — your build script
never runs.

This happened when migrating the Pages project to a new CF account: the
build settings didn't carry over.

### Fix

Set the build config via API (or in the dashboard at Settings → Builds
& deployments):

```bash
TOKEN=$(awk -F'"' '/oauth_token/{print $2}' \
  "$APPDATA/xdg.config/.wrangler/config/default.toml")
curl --ssl-no-revoke -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"build_config":{"build_command":"bash build.sh","destination_dir":".","root_dir":"website"}}' \
  https://api.cloudflare.com/client/v4/accounts/8c5c2baf2cd46499b5989ef288febd82/pages/projects/ontargetaba
```

Then trigger a fresh deployment.

### How to detect

The first symptom is usually that `sitemap.xml` (regenerated by
`scripts/build-sitemap.py` during `build.sh`) doesn't include pages you
recently added. If you find this kind of stale-derived-artifact problem,
check `build_command` first — it's almost always the cause.

---

## CF env-var changes silently disappear

### Symptom

You PATCHed `deployment_configs.production.env_vars` via API to add a
new variable, the API returned `success: true`, but other variables in
the same env disappear or revert.

### Why

CF's API silently drops env vars marked `plain_text` when mixed with
`secret_text` in a single PATCH. Anything not explicitly typed as
`secret_text` may go missing.

### Fix

Always use `type: "secret_text"` for every var — even non-sensitive ones
like `GITHUB_BRANCH=main`. The overhead is zero and the failure mode is
gone.

Pushing via wrangler avoids this entirely — `wrangler pages secret put`
and `wrangler pages secret bulk` both use `secret_text` by default.

---

## `git push` rejected — "remote contains work that you do not have locally"

### Symptom

You just committed a fix, push, and Git says:

```
hint: Updates were rejected because the remote contains work that you
hint: do not have locally...
```

You didn't expect anyone else to be pushing.

### Why

`.github/workflows/changelog.yml` auto-commits a `CHANGELOG.md` update
on every push to `main`. That commit (subject ends `[skip ci]`) lands
on the remote within seconds of your push. Your next local push from
the same branch is then non-fast-forward — the remote has the bot's
commit, you don't.

### Fix

```bash
git pull --rebase origin main
git push origin main
```

Don't force-push — the changelog commit is real work; rebasing
preserves both. Build this into your workflow on this repo:

```bash
git commit -m "..."
git pull --rebase origin main   # absorb the auto-changelog if any
git push origin main
```

---

## Conventions on this project

(things that aren't obvious from reading the code, learned the hard way)

- **`scripts/optimize-pages.py`** must run *after* every HTML-touching
  script (`inject-seo.py`, `selfhost-fonts.mjs`, `add-skip-link.mjs`) so
  its idempotent markers don't get clobbered. `build.sh` already orders
  it correctly — don't reorder without checking.
- **Tailwind is self-hosted** at `assets/vendor/tailwind.js` (the CDN's
  `console.warn` about production use is patched out at download time).
  Don't re-introduce the CDN script tag in new pages.
- **Header / footer markup is *not* in each page** — it's rendered by
  `assets/js/header.js` / `footer.js` from `assets/data/header.json` and
  `footer.json`. To add a nav link, edit `header.json`, not 30 HTML files.
- **Admin pages skip the perf-injection step** (no view-transition, no
  prefetch). They're authenticated UI, not public, so the optimization
  doesn't matter and the prefetch links would point to the public site.
- **`.env` and `website/.dev.vars`** are gitignored and only used for
  `wrangler pages dev` locally. Production env lives only in the CF
  Pages dashboard / wrangler secret push.
