import "server-only";

import { cookies } from "next/headers";

export async function hasAuthorizedSession() {
  const cookieStore = await cookies();

  return cookieStore.get("scp_auth")?.value === "authorized";
}
