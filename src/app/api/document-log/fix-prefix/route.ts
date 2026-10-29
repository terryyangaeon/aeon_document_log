import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function POST() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const prefix = await prisma.systemCode.findFirst({
    where: { type: { equals: "PREFIX", mode: "insensitive" } },
  });
  if (!prefix) {
    return Response.json({ error: "No PREFIX configured in system codes" }, { status: 400 });
  }

  if (prefix.type !== prefix.type.toUpperCase()) {
    await prisma.systemCode.update({
      where: { id: prefix.id },
      data: { type: prefix.type.toUpperCase() },
    });
  }

  const broken = await prisma.documentLog.findMany({
    where: { prefix: "---" },
    include: { sender: true, draftedBy: true },
  });

  if (broken.length === 0) {
    return Response.json({ message: "No records to fix", fixed: 0 });
  }

  const results = [];
  for (const doc of broken) {
    const seqStr = String(doc.sequence).padStart(3, "0");
    const year = new Date(doc.date).getFullYear();
    const newRef = `${prefix.value}/${doc.sender.initial.toUpperCase()}/${seqStr}/${year}/${doc.draftedBy.initial.toLowerCase()}`;

    await prisma.documentLog.update({
      where: { id: doc.id },
      data: { prefix: prefix.value, reference: newRef },
    });
    results.push({ id: doc.id, oldRef: doc.reference, newRef });
  }

  return Response.json({ message: `Fixed ${results.length} records`, fixed: results.length, results });
}
