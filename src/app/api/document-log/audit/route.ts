import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const documentId = parseInt(searchParams.get("documentId") || "0");

  if (!documentId) return Response.json({ error: "Missing documentId" }, { status: 400 });

  const logs = await prisma.auditLog.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(logs);
}
