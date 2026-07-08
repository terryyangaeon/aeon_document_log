import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const staff = await prisma.staff.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return Response.json(staff);
}

export async function POST(request: NextRequest) {
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
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "0");
  await prisma.staff.update({
    where: { id },
    data: { isActive: false },
  });
  return Response.json({ success: true });
}
