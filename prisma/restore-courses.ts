// 一次性腳本：把 data-backup-before-postgres-migration.json 裡備份的課程資料
// （切換到 Postgres 前，從本機 SQLite 匯出的）還原進新的資料庫。
// Sprint 資料不需要還原，直接跑 `npm run db:seed` 就會重新產生一模一樣的內容。
//
// 用法：npx tsx prisma/restore-courses.ts

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

interface BackupCourse {
  title: string;
  costPerPerson: number | null;
  sessions: { startTime: string; endTime: string; locationType: string; location: string | null }[];
  attendees: { name: string }[];
}

async function main() {
  const backupPath = path.join(__dirname, "..", "data-backup-before-postgres-migration.json");
  if (!fs.existsSync(backupPath)) {
    console.log("找不到備份檔，略過還原：", backupPath);
    return;
  }
  const backup = JSON.parse(fs.readFileSync(backupPath, "utf-8")) as { courses: BackupCourse[] };

  for (const c of backup.courses) {
    await prisma.course.create({
      data: {
        title: c.title,
        costPerPerson: c.costPerPerson,
        sessions: {
          create: c.sessions.map((s) => ({
            startTime: s.startTime,
            endTime: s.endTime,
            locationType: s.locationType,
            location: s.location,
          })),
        },
        attendees: { create: c.attendees.map((a) => ({ name: a.name })) },
      },
    });
  }

  console.log(`已還原 ${backup.courses.length} 堂課程`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
