import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const where = type ? { type } : {};
  const codes = await prisma.systemCode.findMany({
    where,
    orderBy: [{ type: "asc" }, { value: "asc" }],
  });
  return Response.json(codes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const code = await prisma.systemCode.create({
    data: {
      type: body.type,
      value: body.value,
    },
  });
  return Response.json(code, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const code = await prisma.systemCode.update({
    where: { id: body.id },
    data: {
      type: body.type,
      value: body.value,
    },
  });
  return Response.json(code);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "0");
  await prisma.systemCode.delete({ where: { id } });
  return Response.json({ success: true });
}
