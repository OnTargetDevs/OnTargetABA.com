// Verifies the admin JWT on every /api/* request except /api/auth/*.
// Attaches the decoded payload to context.data.admin for downstream handlers.

import { verifyJwt, unauthorized } from "./_utils.js";

export const onRequest = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Auth endpoints don't require an existing session (they create it).
  // /OAuth/Callback is the path Google was whitelisted with — case-sensitive.
  if (path.startsWith("/api/auth/") || path === "/OAuth/Callback") {
    return context.next();
  }

  // Everything else under /api/ requires a valid session.
  if (path.startsWith("/api/")) {
    const admin = await verifyJwt(context.request, context.env);
    if (!admin) return unauthorized();
    context.data = { ...(context.data || {}), admin };
    return context.next();
  }

  return context.next();
};
