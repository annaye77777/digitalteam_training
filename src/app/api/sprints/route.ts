import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SprintInput } from "@/types";
import { ValidationError, validateSprintInput } from "@/lib/validation";

export async function GET() {
  const sprints = await prisma.sprint.findMany({ orderBy: { startDate: "asc" } });
  return NextResponse.json(sprints);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SprintInput;
  try {
    validateSprintInput(body);
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }

  const created = await prisma.sprint.create({
    data: {
      name: body.name.trim(),
      product: body.product,
      startDate: body.startDate,
      endDate: body.endDate,
      note: body.note?.trim() || null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
