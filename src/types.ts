export type LocationType = "onsite" | "online";
export type Product = "navi" | "ifrs";

export const PRODUCT_LABEL: Record<Product, string> = {
  navi: "Navi",
  ifrs: "IFRS",
};

export interface CourseSessionDTO {
  id: number;
  courseId: number;
  startTime: string; // "YYYY-MM-DDTHH:mm"
  endTime: string; // "YYYY-MM-DDTHH:mm"
  locationType: LocationType;
  location: string | null;
}

export interface CourseDTO {
  id: number;
  title: string;
  costPerPerson: number | null; // 新台幣/人
  introUrl: string | null; // 備註：課程介紹連結
  createdAt: string;
  attendees: string[]; // 上課人姓名列表
  sessions: CourseSessionDTO[];
}

export interface SprintDTO {
  id: number;
  name: string;
  product: Product;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  note: string | null;
  createdAt: string;
}

// 表單用（尚未儲存的時段可能沒有 id）
export interface CourseSessionInput {
  id?: number;
  startTime: string;
  endTime: string;
  locationType: LocationType;
  location: string;
}

export interface CourseInput {
  title: string;
  attendees: string[]; // 上課人姓名列表，空字串會在送出前被過濾掉
  costPerPerson: string; // 表單原始輸入（新台幣/人），空字串代表未填
  introUrl: string; // 備註：課程介紹連結，選填
  sessions: CourseSessionInput[];
}

export interface SprintInput {
  name: string;
  product: Product;
  startDate: string;
  endDate: string;
  note: string;
}

export type ViewMode = "month" | "quarter" | "custom";
export type LaneFilter = "both" | "courses" | "sprints";
