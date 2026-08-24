import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CourseInput } from "@/types";
import { ValidationError, parseCostPerPerson, validateCourseInput } from "@/lib/validation";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const courseId = Number(params.id);
  if (!Number.isInteger(courseId)) {
    return NextResponse.json({ error: "不正確的課程 id" }, { status: 400 });
  }

  const body = (await req.json()) as CourseInput;
  try {
    validateCourseInput(body);
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }

  const existing = await prisma.course.findUnique({
    where: { id: courseId },
    include: { sessions: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "課程不存在，可能已被刪除" }, { status: 404 });
  }

  const existingIds = new Set(existing.sessions.map((s) => s.id));
  const keptIds = new Set(
    body.sessions.filter((s) => s.id && existingIds.has(s.id)).map((s) => s.id as number)
  );
  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));

  const attendeeNames = (body.attendees ?? [])
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  const updated = await prisma.$transaction(async (tx) => {
    if (toDelete.length > 0) {
      await tx.courseSession.deleteMany({ where: { id: { in: toDelete } } });
    }
    for (const s of body.sessions) {
      const data = {
        startTime: s.startTime,
        endTime: s.endTime,
        locationType: s.locationType,
        location: s.location?.trim() || null,
      };
      if (s.id && keptIds.has(s.id)) {
        await tx.courseSession.update({ where: { id: s.id }, data });
      } else {
        await tx.courseSession.create({ data: { ...data, courseId } });
      }
    }
    // 上課人沒有需要保留的其他欄位，直接整批替換最簡單也最不容易出錯
    await tx.courseAttendee.deleteMany({ where: { courseId } });
    if (attendeeNames.length > 0) {
      await tx.courseAttendee.createMany({
        data: attendeeNames.map((name) => ({ courseId, name })),
      });
    }
    return tx.course.update({
      where: { id: courseId },
      data: {
        title: body.title.trim(),
        costPerPerson: parseCostPerPerson(body.costPerPerson ?? ""),
      },
      include: {
        sessions: { orderBy: { startTime: "asc" } },
        attendees: { orderBy: { id: "asc" } },
      },
    });
  });

  return NextResponse.json({ ...updated, attendees: updated.attendees.map((a) => a.name) });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const courseId = Number(params.id);
  if (!Number.isInteger(courseId)) {
    return NextResponse.json({ error: "不正確的課程 id" }, { status: 400 });
  }

  const existing = await prisma.course.findUnique({ where: { id: courseId } });
  if (!existing) {
    return NextResponse.json({ error: "課程不存在，可能已被刪除" }, { status: 404 });
  }

  // schema.prisma 對 CourseSession 設定 onDelete: Cascade，刪除課程會連同所有時段一併刪除。
  await prisma.course.delete({ where: { id: courseId } });
  return NextResponse.json({ ok: true });
}
