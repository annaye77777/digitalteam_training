-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "cost_per_person" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_sessions" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "location_type" TEXT NOT NULL,
    "location" TEXT,

    CONSTRAINT "course_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_attendees" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "course_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_sessions_course_id_idx" ON "course_sessions"("course_id");

-- CreateIndex
CREATE INDEX "course_attendees_course_id_idx" ON "course_attendees"("course_id");

-- AddForeignKey
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_attendees" ADD CONSTRAINT "course_attendees_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
