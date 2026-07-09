import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const session = await requireAuth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session as { user: { role?: string } }).user.role || "user";
  return Response.json({ role });
}
