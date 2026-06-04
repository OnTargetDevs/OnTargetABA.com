// Clears the admin cookie.

import { clearAdminCookie } from "../../_utils.js";

export const onRequestPost = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "set-cookie": clearAdminCookie(),
      "cache-control": "no-store",
    },
  });
};

// Allow GET as a convenience for direct browser navigation.
export const onRequestGet = onRequestPost;
