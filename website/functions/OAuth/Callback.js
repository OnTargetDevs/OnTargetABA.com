// Google OAuth callback: verify state, exchange code, check admin
// allowlist, set ota_admin cookie, redirect to /admin/.

import {
  signJwt,
  verifyJwtToken,
  parseCookies,
  adminCookie,
  isAdminEmail,
  STATE_COOKIE_NAME,
} from "../_utils.js";

function htmlError(status, title, detail) {
  const body =
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${title}</title>` +
    `<style>body{font-family:system-ui,sans-serif;background:#FAF5E6;color:#163243;margin:0;padding:48px 24px;display:flex;align-items:center;justify-content:center;min-height:100vh}` +
    `.card{background:#fff;border-radius:18px;padding:32px;max-width:480px;box-shadow:0 10px 40px rgba(22,50,67,.1)}h1{margin:0 0 12px;font-size:22px}p{margin:0 0 12px;line-height:1.5}a{color:#0E5E6E}</style></head><body>` +
    `<div class="card"><h1>${title}</h1><p>${detail}</p>` +
    `<p><a href="/admin/">Back to admin sign-in</a></p></div></body></html>`;
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "set-cookie": `${STATE_COOKIE_NAME}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`,
    },
  });
}

export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return htmlError(400, "Sign-in failed", "Missing OAuth code or state.");
  }

  const cookies = parseCookies(request);
  const stateJwt = cookies[STATE_COOKIE_NAME];
  const stateClaims = stateJwt ? await verifyJwtToken(stateJwt, env.JWT_SECRET) : null;
  if (!stateClaims || stateClaims.state !== state) {
    return htmlError(400, "Sign-in failed", "OAuth state could not be verified. Please try again.");
  }

  // Exchange code for tokens.
  let tokenData;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return htmlError(401, "Sign-in failed", `Google rejected the code: ${text.slice(0, 200)}`);
    }
    tokenData = await tokenRes.json();
  } catch (e) {
    return htmlError(500, "Sign-in failed", "Could not contact Google to exchange the code.");
  }

  // Fetch user profile.
  let profile;
  try {
    const pRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!pRes.ok) {
      return htmlError(401, "Sign-in failed", "Could not fetch your Google profile.");
    }
    profile = await pRes.json();
  } catch (e) {
    return htmlError(500, "Sign-in failed", "Could not contact Google for the profile.");
  }

  const email = (profile.email || "").toLowerCase();
  const name = profile.name || profile.given_name || email;
  const sub = profile.sub || email;

  if (!isAdminEmail(email, env)) {
    return htmlError(
      403,
      "Not authorized",
      `${email} is not on the admin allowlist. Ask the site owner to add it.`,
    );
  }

  const jwt = await signJwt({ sub, email, name }, env.JWT_SECRET, 86400);

  return new Response(null, {
    status: 302,
    headers: new Headers([
      ["location", "/admin/"],
      ["set-cookie", adminCookie(jwt)],
      ["set-cookie", `${STATE_COOKIE_NAME}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`],
      ["cache-control", "no-store"],
    ]),
  });
};
