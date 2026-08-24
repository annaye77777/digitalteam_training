import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Navi / IFRS 兩個產品的 Sprint 都是「每 2 週一輪」，以現有的當前 Sprint
// 日期為錨點（2026-08-14 ~ 2026-08-27，兩產品目前剛好落在同一個日曆區間），
// 往前往後以 14 天為單位回推 / 推算整個系列。
const DAY_MS = 24 * 60 * 60 * 1000;
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) + days * DAY_MS);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(
    dt.getUTCDate()
  ).padStart(2, "0")}`;
}

interface SprintSeed {
  name: string;
  product: "navi" | "ifrs";
  startDate: string;
  endDate: string;
}

function buildSprintSeries(opts: {
  product: "navi" | "ifrs";
  currentNumber: number;
  anchorStart: string;
  anchorEnd: string;
  fromNumber: number;
  toNumber: number;
}): SprintSeed[] {
  const { product, currentNumber, anchorStart, anchorEnd, fromNumber, toNumber } = opts;
  const list: SprintSeed[] = [];
  for (let n = fromNumber; n <= toNumber; n++) {
    const shift = (n - currentNumber) * 14;
    list.push({
      name: `Sprint ${n}`,
      product,
      startDate: addDays(anchorStart, shift),
      endDate: addDays(anchorEnd, shift),
    });
  }
  return list;
}

async function main() {
  await prisma.courseSession.deleteMany();
  await prisma.courseAttendee.deleteMany();
  await prisma.course.deleteMany();
  await prisma.sprint.deleteMany();

  await prisma.course.create({
    data: {
      title: "敏捷專案管理實戰工作坊",
      costPerPerson: 8500,
      attendees: { create: [{ name: "王小明" }, { name: "林佳玲" }] },
      sessions: {
        create: [
          { startTime: "2026-08-24T09:00", endTime: "2026-08-24T17:00", locationType: "onsite", location: "台北總部 3F 教室" },
          { startTime: "2026-08-26T09:00", endTime: "2026-08-26T17:00", locationType: "onsite", location: "台北總部 3F 教室" },
          { startTime: "2026-08-28T09:00", endTime: "2026-08-28T12:00", locationType: "online", location: "" },
        ],
      },
    },
  });

  await prisma.course.create({
    data: {
      title: "資料視覺化基礎",
      costPerPerson: 3200,
      attendees: { create: [{ name: "陳美玲" }] },
      sessions: {
        create: [
          { startTime: "2026-09-02T13:00", endTime: "2026-09-02T17:00", locationType: "online", location: "https://meet.example.com/dataviz" },
        ],
      },
    },
  });

  await prisma.course.create({
    data: {
      title: "雲端架構設計課程",
      costPerPerson: 24000,
      attendees: { create: [{ name: "李大華" }, { name: "張凱文" }, { name: "吳宗翰" }] },
      sessions: {
        create: [
          { startTime: "2026-09-07T09:00", endTime: "2026-09-11T17:00", locationType: "onsite", location: "新竹分公司訓練中心" },
        ],
      },
    },
  });

  await prisma.course.create({
    data: {
      title: "溝通與衝突管理",
      attendees: { create: [{ name: "張怡君" }] },
      sessions: {
        create: [
          { startTime: "2026-08-25T14:00", endTime: "2026-08-25T17:00", locationType: "onsite", location: "台北總部 5F 會議室" },
          { startTime: "2026-09-01T14:00", endTime: "2026-09-01T17:00", locationType: "onsite", location: "台北總部 5F 會議室" },
        ],
      },
    },
  });

  // 目前（本週）兩產品剛好都落在 2026-08-14 ~ 2026-08-27 這個 2 週區間，
  // 只是各自的 Sprint 編號不同（Navi 第 13 輪、IFRS 第 9 輪）。
  const naviSprints = buildSprintSeries({
    product: "navi",
    currentNumber: 13,
    anchorStart: "2026-08-14",
    anchorEnd: "2026-08-27",
    fromNumber: 1,
    toNumber: 22, // Sprint 22 剛好在 2026-12-31 結束
  });
  const ifrsSprints = buildSprintSeries({
    product: "ifrs",
    currentNumber: 9,
    anchorStart: "2026-08-14",
    anchorEnd: "2026-08-27",
    fromNumber: 1,
    toNumber: 18, // Sprint 18 剛好在 2026-12-31 結束
  });

  for (const s of [...naviSprints, ...ifrsSprints]) {
    await prisma.sprint.create({ data: s });
  }

  console.log(`Seed 完成：4 堂課程、${naviSprints.length} 個 Navi Sprint、${ifrsSprints.length} 個 IFRS Sprint`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
