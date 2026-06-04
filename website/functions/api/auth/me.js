// Returns the current admin profile or 401.

import { verifyJwt, json, unauthorized } from "../../_utils.js";

export const onRequestGet = async ({ request, env }) => {
  const payload = await verifyJwt(request, env);
  if (!payload) return unauthorized();
  return json({ ok: true, email: payload.email, name: payload.name });
};
