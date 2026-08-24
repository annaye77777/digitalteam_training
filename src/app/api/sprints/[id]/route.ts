import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SprintInput } from "@/types";
import { ValidationError, validateSprintInput } from "@/lib/validation";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const sprintId = Number(params.id);
  if (!Number.isInteger(sprintId)) {
    return NextResponse.json({ error: "不正確的 Sprint id" }, { status: 400 });
  }

  const body = (await req.json()) as SprintInput;
  try {
    validateSprintInput(body);
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }

  const existing = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!existing) {
    return NextResponse.json({ error: "Sprint 不存在，可能已被刪除" }, { status: 404 });
  }

  const updated = await prisma.sprint.update({
    where: { id: sprintId },
    data: {
      name: body.name.trim(),
      product: body.product,
      startDate: body.startDate,
      endDate: body.endDate,
      note: body.note?.trim() || null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sprintId = Number(params.id);
  if (!Number.isInteger(sprintId)) {
    return NextResponse.json({ error: "不正確的 Sprint id" }, { status: 400 });
  }

  const existing = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!existing) {
    return NextResponse.json({ error: "Sprint 不存在，可能已被刪除" }, { status: 404 });
  }

  await prisma.sprint.delete({ where: { id: sprintId } });
  return NextResponse.json({ ok: true });
}
