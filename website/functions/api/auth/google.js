// Begin Google OAuth: redirect to the consent screen with a signed state.

import { randomToken, signJwt, STATE_COOKIE_NAME } from "../../_utils.js";

export const onRequestGet = async ({ env }) => {
  const state = randomToken(16);
  const nonce = randomToken(16);

  // Sign a short-lived cookie binding state+nonce so /callback can verify.
  const stateJwt = await signJwt({ state, nonce }, env.JWT_SECRET, 600);

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
    nonce,
  });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return new Response(null, {
    status: 302,
    headers: {
      location: url,
      "set-cookie": `${STATE_COOKIE_NAME}=${stateJwt}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=600`,
      "cache-control": "no-store",
    },
  });
};
