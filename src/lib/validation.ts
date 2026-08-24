import { CourseInput, CourseSessionInput, SprintInput } from "@/types";

export class ValidationError extends Error {}

function isNonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateSession(s: CourseSessionInput, index: number): void {
  const label = `第 ${index + 1} 個時段`;
  if (!isNonEmpty(s.startTime) || !DATE_TIME_RE.test(s.startTime)) {
    throw new ValidationError(`${label}：開始日期時間為必填`);
  }
  if (!isNonEmpty(s.endTime) || !DATE_TIME_RE.test(s.endTime)) {
    throw new ValidationError(`${label}：結束日期時間為必填`);
  }
  if (s.endTime < s.startTime) {
    throw new ValidationError(`${label}：結束時間不能早於開始時間`);
  }
  if (s.locationType !== "onsite" && s.locationType !== "online") {
    throw new ValidationError(`${label}：地點類型不正確`);
  }
  if (s.locationType === "onsite" && !isNonEmpty(s.location)) {
    throw new ValidationError(`${label}：選擇「實體」時地點為必填`);
  }
}

// 課程費用（新台幣/人）：空字串代表未填，回傳 null；否則需為 >= 0 的數字。
export function parseCostPerPerson(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) {
    throw new ValidationError("課程費用需為數字");
  }
  if (n < 0) {
    throw new ValidationError("課程費用不能為負數");
  }
  return Math.round(n);
}

export function validateCourseInput(input: CourseInput): void {
  if (!isNonEmpty(input.title)) {
    throw new ValidationError("課程名稱為必填");
  }
  parseCostPerPerson(input.costPerPerson ?? "");
  if (!Array.isArray(input.sessions) || input.sessions.length < 1) {
    throw new ValidationError("至少需要一個上課時段");
  }
  input.sessions.forEach((s, i) => validateSession(s, i));
}

export function validateSprintInput(input: SprintInput): void {
  if (!isNonEmpty(input.name)) {
    throw new ValidationError("Sprint 名稱為必填");
  }
  if (input.product !== "navi" && input.product !== "ifrs") {
    throw new ValidationError("產品為必填");
  }
  if (!isNonEmpty(input.startDate) || !DATE_RE.test(input.startDate)) {
    throw new ValidationError("開始日期為必填");
  }
  if (!isNonEmpty(input.endDate) || !DATE_RE.test(input.endDate)) {
    throw new ValidationError("結束日期為必填");
  }
  if (input.endDate < input.startDate) {
    throw new ValidationError("結束日期不能早於開始日期");
  }
}
