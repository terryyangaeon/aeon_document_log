import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const rows: { name: string; initial: string; staffNo: string; email: string }[] = body.rows;

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return Response.json({ error: "No records to import" }, { status: 400 });
  }

  const errors: string[] = [];
  const valid: typeof rows = [];

  const existingStaff = await prisma.staff.findMany({
    where: { isActive: true },
    select: { name: true },
  });
  const existingNames = new Set(existingStaff.map((s) => s.name.toLowerCase()));
  const batchNames = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    if (!row.name || !row.initial || !row.email) {
      errors.push(`Row ${rowNum}: Name, Initial, and Email are required`);
      continue;
    }

    const nameLower = row.name.toLowerCase();
    if (existingNames.has(nameLower)) {
      errors.push(`Row ${rowNum}: "${row.name}" already exists`);
      continue;
    }
    if (batchNames.has(nameLower)) {
      errors.push(`Row ${rowNum}: "${row.name}" is duplicated in the import file`);
      continue;
    }

    batchNames.add(nameLower);
    valid.push(row);
  }

  if (errors.length > 0 && valid.length === 0) {
    return Response.json({ error: "All records failed validation", errors }, { status: 400 });
  }

  const created = await prisma.staff.createMany({
    data: valid.map((r) => ({
      name: r.name,
      initial: r.initial,
      staffNo: r.staffNo || "",
      email: r.email,
      isActive: true,
    })),
  });

  return Response.json({
    imported: created.count,
    errors,
  });
}
