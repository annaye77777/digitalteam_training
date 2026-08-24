import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CourseSessionInput } from "@/types";
import { ValidationError, validateSession } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const courseId = Number(params.id);
  if (!Number.isInteger(courseId)) {
    return NextResponse.json({ error: "不正確的課程 id" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "課程不存在，可能已被刪除" }, { status: 404 });
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

  const created = await prisma.courseSession.create({
    data: {
      courseId,
      startTime: body.startTime,
      endTime: body.endTime,
      locationType: body.locationType,
      location: body.location?.trim() || null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
