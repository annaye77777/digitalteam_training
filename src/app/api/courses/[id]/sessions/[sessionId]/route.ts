import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CourseSessionInput } from "@/types";
import { ValidationError, validateSession } from "@/lib/validation";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
) {
  const courseId = Number(params.id);
  const sessionId = Number(params.sessionId);
  if (!Number.isInteger(courseId) || !Number.isInteger(sessionId)) {
    return NextResponse.json({ error: "不正確的 id" }, { status: 400 });
  }

  const existing = await prisma.courseSession.findUnique({ where: { id: sessionId } });
  if (!existing || existing.courseId !== courseId) {
    return NextResponse.json({ error: "時段不存在，可能已被刪除" }, { status: 404 });
  }

  const body = (await req.json()) as CourseSessionInput;
  try {
    validateSession(body, 0);
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }

  const updated = await prisma.courseSession.update({
    where: { id: sessionId },
    data: {
      startTime: body.startTime,
      endTime: body.endTime,
      locationType: body.locationType,
      location: body.location?.trim() || null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
) {
  const courseId = Number(params.id);
  const sessionId = Number(params.sessionId);
  if (!Number.isInteger(courseId) || !Number.isInteger(sessionId)) {
    return NextResponse.json({ error: "不正確的 id" }, { status: 400 });
  }

  const existing = await prisma.courseSession.findUnique({ where: { id: sessionId } });
  if (!existing || existing.courseId !== courseId) {
    return NextResponse.json({ error: "時段不存在，可能已被刪除" }, { status: 404 });
  }

  const remaining = await prisma.courseSession.count({ where: { courseId } });
  if (remaining <= 1) {
    return NextResponse.json(
      { error: "課程至少需保留一個上課時段，請改用刪除課程" },
      { status: 400 }
    );
  }

  await prisma.courseSession.delete({ where: { id: sessionId } });
  return NextResponse.json({ ok: true });
}
