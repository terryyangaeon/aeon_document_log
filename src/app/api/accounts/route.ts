import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.appUser.findMany({
    orderBy: { name: "asc" },
  });
  return Response.json(users);
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  const existing = await prisma.appUser.findUnique({
    where: { email: body.email },
  });
  if (existing) {
    return Response.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  const user = await prisma.appUser.create({
    data: {
      email: body.email,
      name: body.name,
      role: body.role || "admin",
      isActive: true,
    },
  });
  return Response.json(user, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const user = await prisma.appUser.update({
    where: { id: body.id },
    data: {
      email: body.email,
      name: body.name,
      role: body.role,
      isActive: body.isActive,
    },
  });
  return Response.json(user);
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "0");

  await prisma.appUser.update({
    where: { id },
    data: { isActive: false },
  });
  return Response.json({ success: true });
}
