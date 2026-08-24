// 課程色彩：以課程 id 決定固定色票，讓同一堂課程的多個時段區塊呈現相同顏色，
// 且不同課程之間顏色盡量可辨識（無障礙友善的色票，避免純紅/純綠語意衝突）。

export interface CourseColor {
  bg: string;
  border: string;
  text: string;
}

const PALETTE: CourseColor[] = [
  { bg: "#dbeafe", border: "#3b82f6", text: "#1e3a8a" }, // blue
  { bg: "#dcfce7", border: "#22c55e", text: "#14532d" }, // green
  { bg: "#fef3c7", border: "#f59e0b", text: "#78350f" }, // amber
  { bg: "#fce7f3", border: "#ec4899", text: "#831843" }, // pink
  { bg: "#e0e7ff", border: "#6366f1", text: "#312e81" }, // indigo
  { bg: "#ffedd5", border: "#f97316", text: "#7c2d12" }, // orange
  { bg: "#ccfbf1", border: "#14b8a6", text: "#134e4a" }, // teal
  { bg: "#f3e8ff", border: "#a855f7", text: "#581c87" }, // purple
  { bg: "#fee2e2", border: "#ef4444", text: "#7f1d1d" }, // red
  { bg: "#e2e8f0", border: "#64748b", text: "#1e293b" }, // slate
];

export function courseColor(courseId: number): CourseColor {
  return PALETTE[Math.abs(courseId) % PALETTE.length];
}

// Sprint 一律用斜紋底色跟課程區塊做出區隔；不同產品再用不同色相區分。
import { Product } from "@/types";

function stripe(rgb: string): string {
  return `repeating-linear-gradient(45deg, rgba(${rgb},0.18) 0px, rgba(${rgb},0.18) 6px, rgba(${rgb},0.32) 6px, rgba(${rgb},0.32) 12px)`;
}

export const SPRINT_COLOR_BY_PRODUCT: Record<Product, { bg: string; border: string; text: string }> = {
  navi: { bg: stripe("37,99,235"), border: "#1d4ed8", text: "#1e3a8a" }, // blue
  ifrs: { bg: stripe("124,58,237"), border: "#6d28d9", text: "#4c1d95" }, // violet
};
