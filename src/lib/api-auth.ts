import { auth } from "./auth";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  const role = (session as { user: { role?: string } }).user.role;
  if (role !== "admin") {
    return null;
  }
  return session;
}
