import "server-only";
import { getAdminUser } from "@/lib/auth";

/** Call at the top of EVERY admin server action / route handler. Throws if the caller isn't an admin. */
export async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) throw new Error("UNAUTHORIZED");
  return admin;
}
