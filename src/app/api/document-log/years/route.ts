import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const session = await requireAuth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const results = await prisma.$queryRaw<{ year: number }[]>`
    SELECT DISTINCT EXTRACT(YEAR FROM date)::int AS year
    FROM document_log
    ORDER BY year DESC
  `;

  const years = results.map((r) => r.year);
  const currentYear = new Date().getFullYear();
  if (!years.includes(currentYear)) {
    years.unshift(currentYear);
  }

  return Response.json(years);
}
