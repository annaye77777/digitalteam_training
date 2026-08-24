// 全站日期時間工具。
// 所有日期時間一律以「無時區」字串處理 (YYYY-MM-DD / YYYY-MM-DDTHH:mm)，
// 代表台北時間的牆上時鐘時間，不做任何 UTC 轉換。
// 用 new Date(...) 解析這類字串時，瀏覽器會以「本機時區」當作牆上時間解析，
// 只要伺服器與使用者都設定在台北時區，即可正確顯示；這是本產品刻意選擇
// 「固定單一時區、不處理跨時區」的簡化作法。

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function toDateOnly(dateStr: string): string {
  return dateStr.slice(0, 10);
}

/** 解析 "YYYY-MM-DD" 或 "YYYY-MM-DDTHH:mm" 為本機 Date（純日曆運算用） */
export function parseLocal(dateStr: string): Date {
  const [datePart, timePart] = dateStr.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  if (timePart) {
    const [hh, mm] = timePart.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm);
  }
  return new Date(y, m - 1, d);
}

export function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function dateTimeToStr(d: Date): string {
  return `${dateToStr(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function startOfQuarter(d: Date): Date {
  const qMonth = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), qMonth, 1);
}

export function endOfQuarter(d: Date): Date {
  const qMonth = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), qMonth + 3, 0);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
}

export function addQuarters(d: Date, n: number): Date {
  return addMonths(d, n * 3);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function diffDays(a: Date, b: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((db - da) / MS);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatMonthLabel(d: Date): string {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
}

export function formatQuarterLabel(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()} 年 第 ${q} 季`;
}

export function formatDateDisplay(dateStr: string): string {
  const d = parseLocal(dateStr);
  return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function formatDateTimeDisplay(dateTimeStr: string): string {
  const d = parseLocal(dateTimeStr);
  return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}（${
    WEEKDAYS[d.getDay()]
  }）${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatDateTimeRangeDisplay(startStr: string, endStr: string): string {
  const start = parseLocal(startStr);
  const end = parseLocal(endStr);
  const sameDay = isSameDay(start, end);
  if (sameDay) {
    return `${dateToStr(start)}（${WEEKDAYS[start.getDay()]}）${pad2(start.getHours())}:${pad2(
      start.getMinutes()
    )} - ${pad2(end.getHours())}:${pad2(end.getMinutes())}`;
  }
  return `${formatDateTimeDisplay(startStr)} → ${formatDateTimeDisplay(endStr)}`;
}
