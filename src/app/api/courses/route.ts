import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CourseInput } from "@/types";
import { ValidationError, parseCostPerPerson, validateCourseInput } from "@/lib/validation";

function toDTO<T extends { attendees: { name: string }[] }>(course: T) {
  return { ...course, attendees: course.attendees.map((a) => a.name) };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const locationType = searchParams.get("locationType"); // "onsite" | "online" | null
  const startDate = searchParams.get("startDate"); // "YYYY-MM-DD"
  const endDate = searchParams.get("endDate");

  const courses = await prisma.course.findMany({
    include: {
      sessions: { orderBy: { startTime: "asc" } },
      attendees: { orderBy: { id: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const filtered = courses.filter((c) => {
    if (q) {
      const haystack = `${c.title} ${c.attendees.map((a) => a.name).join(" ")} ${c.sessions
        .map((s) => s.location ?? "")
        .join(" ")}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (locationType) {
      if (!c.sessions.some((s) => s.locationType === locationType)) return false;
    }
    if (startDate || endDate) {
      const lo = startDate ?? "0000-01-01";
      const hi = endDate ?? "9999-12-31";
      const overlaps = c.sessions.some(
        (s) => s.startTime.slice(0, 10) <= hi && s.endTime.slice(0, 10) >= lo
      );
      if (!overlaps) return false;
    }
    return true;
  });

  return NextResponse.json(filtered.map(toDTO));
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CourseInput;
  try {
    validateCourseInput(body);
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }

  const created = await prisma.course.create({
    data: {
      title: body.title.trim(),
      costPerPerson: parseCostPerPerson(body.costPerPerson ?? ""),
      sessions: {
        create: body.sessions.map((s) => ({
          startTime: s.startTime,
          endTime: s.endTime,
          locationType: s.locationType,
          location: s.location?.trim() || null,
        })),
      },
      attendees: {
        create: (body.attendees ?? [])
          .map((name) => name.trim())
          .filter((name) => name.length > 0)
          .map((name) => ({ name })),
      },
    },
    include: { sessions: true, attendees: true },
  });

  return NextResponse.json(toDTO(created), { status: 201 });
}
