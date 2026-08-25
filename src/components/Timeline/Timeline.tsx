"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CourseDTO, CourseSessionDTO, LaneFilter, PRODUCT_LABEL, SprintDTO } from "@/types";
import {
  diffDays,
  formatDateTimeRangeDisplay,
  formatDateDisplay,
  parseLocal,
  toDateOnly,
} from "@/lib/date";
import { courseColor, SPRINT_COLOR_BY_PRODUCT } from "@/lib/colors";
import { looksLikeUrl } from "@/lib/url";
import { packRows } from "./rowPacking";

const ROW_HEIGHT = 40;
const ROW_GAP = 8;
const LANE_HEADER_HEIGHT = 26;
const DAY_MS = 24 * 60 * 60 * 1000;
const TOOLTIP_WIDTH = 260;
const TOOLTIP_MAX_HEIGHT = 220;

interface SessionBlock {
  course: CourseDTO;
  session: CourseSessionDTO;
  startDate: Date;
  endDate: Date;
}

type HoverTarget =
  | { type: "session"; id: number; rect: DOMRect }
  | { type: "sprint"; id: number; rect: DOMRect };

function buildMonthSegments(rangeStart: Date, rangeEnd: Date) {
  const segments: { label: string; startOffset: number; days: number }[] = [];
  let cursor = new Date(rangeStart);
  const totalDays = diffDays(rangeStart, rangeEnd) + 1;
  let offset = 0;
  while (cursor <= rangeEnd) {
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const segEnd = monthEnd < rangeEnd ? monthEnd : rangeEnd;
    const days = diffDays(cursor, segEnd) + 1;
    segments.push({
      label: `${cursor.getFullYear()}/${cursor.getMonth() + 1}`,
      startOffset: offset,
      days,
    });
    offset += days;
    cursor = new Date(segEnd.getFullYear(), segEnd.getMonth(), segEnd.getDate() + 1);
  }
  // 防呆：確保總天數一致
  if (offset !== totalDays && segments.length > 0) {
    segments[segments.length - 1].days += totalDays - offset;
  }
  return segments;
}

function SessionDetail({
  course,
  session,
  overlapsPlanning,
}: {
  course: CourseDTO;
  session: CourseSessionDTO;
  overlapsPlanning: boolean;
}) {
  return (
    <div>
      <p className="font-semibold text-slate-800">{course.title}</p>
      <p className="mt-1 text-slate-600">
        {formatDateTimeRangeDisplay(session.startTime, session.endTime)}
      </p>
      <p className="mt-1 text-slate-600">
        {session.locationType === "onsite" ? "實體" : "線上"}
        {session.location ? ` · ${session.location}` : ""}
      </p>
      {course.attendees.length > 0 && (
        <p className="mt-1 text-slate-500">上課人：{course.attendees.join("、")}</p>
      )}
      {course.costPerPerson != null && (
        <p className="mt-1 text-slate-500">
          費用：NT$ {course.costPerPerson.toLocaleString("zh-TW")} / 人
        </p>
      )}
      {course.introUrl && (
        <p className="mt-1 text-slate-500">
          課程介紹：
          {looksLikeUrl(course.introUrl) ? (
            <a
              href={course.introUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-brand-600 underline"
            >
              {course.introUrl}
            </a>
          ) : (
            <span className="break-all">{course.introUrl}</span>
          )}
        </p>
      )}
      {overlapsPlanning && (
        <p className="mt-1.5 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800">
          ⚠ 與 Planning 重疊
        </p>
      )}
    </div>
  );
}

function SprintDetail({ sprint }: { sprint: SprintDTO }) {
  return (
    <div>
      <p className="font-semibold text-slate-800">
        {PRODUCT_LABEL[sprint.product]} · {sprint.name}
      </p>
      <p className="mt-1 text-slate-600">
        {formatDateDisplay(sprint.startDate)} → {formatDateDisplay(sprint.endDate)}
      </p>
      {sprint.note && <p className="mt-1 text-slate-500">備註：{sprint.note}</p>}
    </div>
  );
}

export default function Timeline({
  courses,
  sprints,
  rangeStart,
  rangeEnd,
  laneFilter,
}: {
  courses: CourseDTO[];
  sprints: SprintDTO[];
  rangeStart: Date;
  rangeEnd: Date;
  laneFilter: LaneFilter;
}) {
  // 已釘選（點擊展開）的區塊；一旦釘選會持續顯示在時間軸下方，不會因為
  // 點擊別的區塊或切換月/季檢視而被取代或收合，需手動按 X 關閉。
  const [pinnedSessionIds, setPinnedSessionIds] = useState<Set<number>>(new Set());
  const [pinnedSprintIds, setPinnedSprintIds] = useState<Set<number>>(new Set());
  // Hover 提示改用 portal 直接掛到 <body>，用 fixed 定位，
  // 避免被外層 overflow-x-auto 卷軸容器裁切（CSS 規則：只要
  // overflow-x 不是 visible，overflow-y 就會被瀏覽器強制視為 auto，
  // 導致往下彈出的提示框被裁掉一截）。
  const [hover, setHover] = useState<HoverTarget | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  // 滑鼠從區塊移到下方彈出的提示框中間，會短暫離開兩者的範圍；
  // 用一個小延遲讓「離開」延後生效，讓使用者來得及把滑鼠移進提示框
  // 裡點擊課程介紹連結，而不會提示框秒消失。
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setHover(null), 200);
  }

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const clear = () => setHover(null);
    el.addEventListener("scroll", clear);
    window.addEventListener("resize", clear);
    return () => {
      el.removeEventListener("scroll", clear);
      window.removeEventListener("resize", clear);
    };
  }, []);

  useEffect(() => cancelClose, []);

  function toggleSession(id: number) {
    setPinnedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSprint(id: number) {
    setPinnedSprintIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totalDays = diffDays(rangeStart, rangeEnd) + 1;
  const pxPerDay = totalDays <= 35 ? 40 : totalDays <= 100 ? 16 : Math.max(6, Math.floor(2400 / totalDays));
  const totalWidth = totalDays * pxPerDay;
  const showDayNumbers = pxPerDay >= 24;

  const monthSegments = useMemo(() => buildMonthSegments(rangeStart, rangeEnd), [rangeStart, rangeEnd]);

  // Planning = 每個 Sprint 結束的那一天（不限目前顯示範圍內的 Sprint，
  // 因為就算 Sprint 本身不在畫面上，課程時段仍可能跟它的結束日重疊）。
  const planningDates = useMemo(() => new Set(sprints.map((s) => s.endDate)), [sprints]);

  function overlapsPlanning(startDateOnly: string, endDateOnly: string): boolean {
    for (const d of planningDates) {
      if (d >= startDateOnly && d <= endDateOnly) return true;
    }
    return false;
  }

  const sessionById = useMemo(() => {
    const m = new Map<number, { course: CourseDTO; session: CourseSessionDTO }>();
    for (const course of courses) {
      for (const session of course.sessions) {
        m.set(session.id, { course, session });
      }
    }
    return m;
  }, [courses]);

  const sprintById = useMemo(() => new Map(sprints.map((s) => [s.id, s])), [sprints]);

  const sessionBlocks: SessionBlock[] = useMemo(() => {
    const blocks: SessionBlock[] = [];
    for (const course of courses) {
      for (const session of course.sessions) {
        const startDate = parseLocal(toDateOnly(session.startTime));
        const endDate = parseLocal(toDateOnly(session.endTime));
        if (endDate < rangeStart || startDate > rangeEnd) continue;
        blocks.push({ course, session, startDate, endDate });
      }
    }
    return blocks;
  }, [courses, rangeStart, rangeEnd]);

  const visibleSprints = useMemo(() => {
    return sprints.filter((s) => {
      const start = parseLocal(s.startDate);
      const end = parseLocal(s.endDate);
      return end >= rangeStart && start <= rangeEnd;
    });
  }, [sprints, rangeStart, rangeEnd]);

  const { packed: packedSessions, rowCount: sessionRowCount } = useMemo(
    () =>
      packRows(
        sessionBlocks,
        (b) => b.startDate.getTime(),
        // 區塊是以「整天」為單位呈現，結束日當天也算佔用，所以要多加一天
        // 讓行程包裝把「結束日 = 下一個開始日」視為同一天佔用而不是相鄰不衝突
        (b) => b.endDate.getTime() + DAY_MS - 1
      ),
    [sessionBlocks]
  );

  const { packed: packedSprints, rowCount: sprintRowCount } = useMemo(
    () =>
      packRows(
        visibleSprints,
        (s) => parseLocal(s.startDate).getTime(),
        (s) => parseLocal(s.endDate).getTime() + DAY_MS - 1
      ),
    [visibleSprints]
  );

  function offsetOf(date: Date): number {
    const clamped = date < rangeStart ? rangeStart : date > rangeEnd ? rangeEnd : date;
    return diffDays(rangeStart, clamped);
  }

  function blockStyle(start: Date, end: Date, row: number) {
    const clampedStart = start < rangeStart ? rangeStart : start;
    const clampedEnd = end > rangeEnd ? rangeEnd : end;
    const left = offsetOf(clampedStart) * pxPerDay;
    const widthDays = diffDays(clampedStart, clampedEnd) + 1;
    return {
      left,
      width: Math.max(widthDays * pxPerDay - 3, pxPerDay >= 24 ? 6 : 2),
      top: row * (ROW_HEIGHT + ROW_GAP),
    };
  }

  const today = new Date();
  const showTodayMarker = today >= rangeStart && today <= rangeEnd;
  const todayLeft = offsetOf(today) * pxPerDay + pxPerDay / 2;

  const showCourses = laneFilter !== "sprints";
  const showSprints = laneFilter !== "courses";

  const courseLaneHeight = showCourses
    ? Math.max(sessionRowCount, 1) * (ROW_HEIGHT + ROW_GAP)
    : 0;
  const sprintLaneHeight = showSprints
    ? Math.max(sprintRowCount, 1) * (ROW_HEIGHT + ROW_GAP)
    : 0;

  const pinnedSessions = [...pinnedSessionIds]
    .map((id) => sessionById.get(id))
    .filter((v): v is { course: CourseDTO; session: CourseSessionDTO } => !!v);
  const pinnedSprints = [...pinnedSprintIds]
    .map((id) => sprintById.get(id))
    .filter((v): v is SprintDTO => !!v);

  function hoverContent() {
    if (!hover) return null;
    if (hover.type === "session") {
      const found = sessionById.get(hover.id);
      if (!found) return null;
      const conflict = overlapsPlanning(
        toDateOnly(found.session.startTime),
        toDateOnly(found.session.endTime)
      );
      return (
        <SessionDetail course={found.course} session={found.session} overlapsPlanning={conflict} />
      );
    }
    const sprint = sprintById.get(hover.id);
    if (!sprint) return null;
    return <SprintDetail sprint={sprint} />;
  }

  function tooltipPosition(rect: DOMRect) {
    let top = rect.bottom + 6;
    if (top + TOOLTIP_MAX_HEIGHT > window.innerHeight) {
      top = Math.max(8, rect.top - TOOLTIP_MAX_HEIGHT - 6);
    }
    let left = rect.left;
    if (left + TOOLTIP_WIDTH > window.innerWidth - 8) {
      left = window.innerWidth - TOOLTIP_WIDTH - 8;
    }
    if (left < 8) left = 8;
    return { top, left };
  }

  return (
    <div className="relative rounded-lg border border-slate-200 bg-white">
      <div ref={scrollRef} className="overflow-x-auto">
        <div style={{ width: totalWidth, minWidth: totalWidth }} className="relative">
          {/* 月份刻度標頭 */}
          <div className="relative flex border-b border-slate-200 text-xs text-slate-500" style={{ height: LANE_HEADER_HEIGHT }}>
            {monthSegments.map((seg, i) => (
              <div
                key={i}
                className="flex items-center border-r border-slate-100 px-2 font-medium text-slate-600"
                style={{ width: seg.days * pxPerDay }}
              >
                {seg.label}
              </div>
            ))}
          </div>

          {/* 日刻度（僅月檢視顯示數字） */}
          {showDayNumbers && (
            <div className="relative flex border-b border-slate-100 text-[10px] text-slate-400" style={{ height: 18 }}>
              {Array.from({ length: totalDays }).map((_, i) => {
                const d = new Date(rangeStart);
                d.setDate(d.getDate() + i);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-center border-r border-slate-50"
                    style={{ width: pxPerDay }}
                  >
                    {d.getDate()}
                  </div>
                );
              })}
            </div>
          )}

          {/* 今天標記線 */}
          {showTodayMarker && (
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-red-400"
              style={{ left: todayLeft }}
            >
              <span className="absolute -left-4 top-0 rounded bg-red-400 px-1 text-[10px] text-white">
                今天
              </span>
            </div>
          )}

          {/* 課程軌道 */}
          {showCourses && (
            <div className="border-b border-slate-100">
              <div className="px-2 py-1 text-xs font-semibold text-slate-500">外訓課程</div>
              <div className="relative" style={{ height: courseLaneHeight }}>
                {packedSessions.length === 0 && (
                  <p className="px-2 py-2 text-xs text-slate-300">此區間內沒有課程時段</p>
                )}
                {packedSessions.map(({ item, row }) => {
                  const color = courseColor(item.course.id);
                  const style = blockStyle(item.startDate, item.endDate, row);
                  const startOnly = toDateOnly(item.session.startTime);
                  const endOnly = toDateOnly(item.session.endTime);
                  const planningConflict = overlapsPlanning(startOnly, endOnly);
                  return (
                    <div
                      key={item.session.id}
                      className="absolute"
                      style={{ left: style.left, width: style.width, top: style.top, height: ROW_HEIGHT }}
                      onMouseEnter={(e) => {
                        cancelClose();
                        setHover({
                          type: "session",
                          id: item.session.id,
                          rect: e.currentTarget.getBoundingClientRect(),
                        });
                      }}
                      onMouseLeave={scheduleClose}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSession(item.session.id)}
                        className="block h-full w-full overflow-hidden rounded-md border px-2 text-left text-xs shadow-sm transition hover:brightness-95"
                        style={{
                          backgroundColor: color.bg,
                          borderColor: color.border,
                          color: color.text,
                        }}
                      >
                        <span className="block truncate leading-[38px]">
                          {planningConflict && "⚠ "}
                          {item.course.title}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sprint 軌道 */}
          {showSprints && (
            <div>
              <div className="px-2 py-1 text-xs font-semibold text-slate-500">Sprint</div>
              <div className="relative" style={{ height: sprintLaneHeight }}>
                {packedSprints.length === 0 && (
                  <p className="px-2 py-2 text-xs text-slate-300">此區間內沒有 Sprint</p>
                )}
                {packedSprints.map(({ item, row }) => {
                  const start = parseLocal(item.startDate);
                  const end = parseLocal(item.endDate);
                  const style = blockStyle(start, end, row);
                  const color = SPRINT_COLOR_BY_PRODUCT[item.product];
                  const label = `${PRODUCT_LABEL[item.product]} · ${item.name}`;
                  return (
                    <div
                      key={item.id}
                      className="absolute"
                      style={{ left: style.left, width: style.width, top: style.top, height: ROW_HEIGHT }}
                      onMouseEnter={(e) => {
                        cancelClose();
                        setHover({
                          type: "sprint",
                          id: item.id,
                          rect: e.currentTarget.getBoundingClientRect(),
                        });
                      }}
                      onMouseLeave={scheduleClose}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSprint(item.id)}
                        className="block h-full w-full overflow-hidden rounded-md border-2 px-2 text-left text-xs font-medium shadow-sm transition hover:brightness-95"
                        style={{
                          backgroundImage: color.bg,
                          borderColor: color.border,
                          color: color.text,
                        }}
                      >
                        <span className="block truncate leading-[36px]">{label}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 詳細資訊面板：所有被點擊釘選的區塊會持續列在這裡，直到手動關閉 */}
      {(pinnedSessions.length > 0 || pinnedSprints.length > 0) && (
        <div className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50">
          {pinnedSessions.map(({ course, session }) => {
            const planningConflict = overlapsPlanning(
              toDateOnly(session.startTime),
              toDateOnly(session.endTime)
            );
            return (
              <div key={`session-${session.id}`} className="px-4 py-3 text-sm">
                <div className="flex items-start justify-between">
                  <SessionDetail course={course} session={session} overlapsPlanning={planningConflict} />
                  <button
                    type="button"
                    onClick={() => toggleSession(session.id)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
          {pinnedSprints.map((sprint) => (
            <div key={`sprint-${sprint.id}`} className="px-4 py-3 text-sm">
              <div className="flex items-start justify-between">
                <SprintDetail sprint={sprint} />
                <button
                  type="button"
                  onClick={() => toggleSprint(sprint.id)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hover 提示：用 portal 掛到 body，fixed 定位，不受任何祖先的
          overflow/卷軸裁切影響，一定完整顯示。可以互動（不是
          pointer-events-none），滑鼠移進提示框裡也會取消關閉，
          這樣才點得到裡面的課程介紹連結。 */}
      {mounted &&
        hover &&
        createPortal(
          <div
            className="fixed z-[9999] rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg"
            style={{ ...tooltipPosition(hover.rect), width: TOOLTIP_WIDTH }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            {hoverContent()}
          </div>,
          document.body
        )}
    </div>
  );
}
