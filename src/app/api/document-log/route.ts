import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where = year
    ? {
        date: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${parseInt(year) + 1}-01-01`),
        },
      }
    : {};

  const [logs, total] = await Promise.all([
    prisma.documentLog.findMany({
      where,
      include: { sender: true, draftedBy: true },
      orderBy: { sequence: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.documentLog.count({ where }),
  ]);

  return Response.json({ logs, total, page, limit });
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const docDate = new Date(body.date);
  const year = docDate.getFullYear();

  const sender = await prisma.staff.findUnique({ where: { id: body.senderId } });
  const drafter = await prisma.staff.findUnique({ where: { id: body.draftedById } });

  if (!sender || !drafter) {
    return Response.json({ error: "Invalid sender or drafter" }, { status: 400 });
  }

  const lastDoc = await prisma.documentLog.findFirst({
    where: {
      prefix: body.prefix,
      date: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
    orderBy: { sequence: "desc" },
  });

  const sequence = (lastDoc?.sequence || 0) + 1;
  const seqStr = String(sequence).padStart(3, "0");
  const senderInitial = sender.initial.toUpperCase();
  const drafterInitial = drafter.initial.toLowerCase();
  const reference = `${body.prefix}/${senderInitial}/${seqStr}/${year}/${drafterInitial}`;

  const existing = await prisma.documentLog.findUnique({ where: { reference } });
  if (existing) {
    return Response.json({ error: "Duplicate reference number" }, { status: 409 });
  }

  const doc = await prisma.documentLog.create({
    data: {
      date: docDate,
      prefix: body.prefix,
      senderId: body.senderId,
      sequence,
      draftedById: body.draftedById,
      reference,
      sendTo: body.sendTo,
      description: body.description,
      remarks: body.remarks || null,
    },
    include: { sender: true, draftedBy: true },
  });

  return Response.json(doc, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "0");
  await prisma.documentLog.delete({ where: { id } });
  return Response.json({ success: true });
}
