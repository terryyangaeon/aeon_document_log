import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/api-auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "active";

  const where = status === "all" ? {} : { isActive: status !== "inactive" };

  const staff = await prisma.staff.findMany({
    where,
    orderBy: { name: "asc" },
  });
  return Response.json(staff);
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });

  const body = await request.json();
  const staff = await prisma.staff.create({
    data: {
      name: body.name,
      initial: body.initial,
      staffNo: body.staffNo,
      email: body.email,
      isActive: body.isActive ?? true,
    },
  });
  return Response.json(staff, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });

  const body = await request.json();
  const staff = await prisma.staff.update({
    where: { id: body.id },
    data: {
      name: body.name,
      initial: body.initial,
      staffNo: body.staffNo,
      email: body.email,
      isActive: body.isActive,
    },
  });
  return Response.json(staff);
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "0");
  await prisma.staff.update({
    where: { id },
    data: { isActive: false },
  });
  return Response.json({ success: true });
}
