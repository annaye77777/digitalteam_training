"use client";

import React, { useMemo, useState } from "react";
import { CourseDTO, CourseSessionDTO } from "@/types";
import { formatDateTimeRangeDisplay } from "@/lib/date";
import { courseColor } from "@/lib/colors";

function locationSummary(session: CourseSessionDTO): string {
  const typeLabel = session.locationType === "onsite" ? "實體" : "線上";
  return session.location ? `${typeLabel}・${session.location}` : typeLabel;
}

function formatCost(cost: number | null): string {
  if (cost == null) return "—";
  return `NT$ ${cost.toLocaleString("zh-TW")} / 人`;
}

export default function CourseList({
  courses,
  onEdit,
  onDelete,
}: {
  courses: CourseDTO[];
  onEdit: (course: CourseDTO) => void;
  onDelete: (course: CourseDTO) => void;
}) {
  const [q, setQ] = useState("");
  const [locationType, setLocationType] = useState<"" | "onsite" | "online">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return courses.filter((c) => {
      if (qLower) {
        const haystack = `${c.title} ${c.attendees.join(" ")} ${c.sessions
          .map((s) => s.location ?? "")
          .join(" ")}`.toLowerCase();
        if (!haystack.includes(qLower)) return false;
      }
      if (locationType && !c.sessions.some((s) => s.locationType === locationType)) {
        return false;
      }
      if (startDate || endDate) {
        const lo = startDate || "0000-01-01";
        const hi = endDate || "9999-12-31";
        const overlaps = c.sessions.some(
          (s) => s.startTime.slice(0, 10) <= hi && s.endTime.slice(0, 10) >= lo
        );
        if (!overlaps) return false;
      }
      return true;
    });
  }, [courses, q, locationType, startDate, endDate]);

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋課程名稱、上課人、地點"
          className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <select
          value={locationType}
          onChange={(e) => setLocationType(e.target.value as "" | "onsite" | "online")}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">所有地點類型</option>
          <option value="onsite">實體</option>
          <option value="online">線上</option>
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <span className="self-center text-sm text-slate-400">至</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-8 px-3 py-2"></th>
              <th className="px-3 py-2">課程名稱</th>
              <th className="px-3 py-2">上課人</th>
              <th className="px-3 py-2">時段數</th>
              <th className="px-3 py-2">最近時段</th>
              <th className="px-3 py-2">地點</th>
              <th className="px-3 py-2">費用</th>
              <th className="px-3 py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                  沒有符合條件的課程
                </td>
              </tr>
            )}
            {filtered.map((c) => {
              const color = courseColor(c.id);
              const isOpen = expanded.has(c.id);
              const firstSession = c.sessions[0];
              return (
                <React.Fragment key={c.id}>
                  <tr className="hover:bg-slate-50/60">
                    <td className="px-3 py-2 align-top">
                      <button
                        type="button"
                        onClick={() => toggle(c.id)}
                        aria-label="展開時段"
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {isOpen ? "▾" : "▸"}
                      </button>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: color.border }}
                        />
                        <span className="font-medium text-slate-800">{c.title}</span>
                      </div>
                    </td>
                    <td className="max-w-[160px] px-3 py-2 align-top text-slate-600">
                      {c.attendees.length > 0 ? (
                        <span
                          className="block truncate"
                          title={c.attendees.join("、")}
                        >
                          {c.attendees.join("、")}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-600">{c.sessions.length}</td>
                    <td className="px-3 py-2 align-top text-slate-600">
                      {firstSession
                        ? formatDateTimeRangeDisplay(firstSession.startTime, firstSession.endTime)
                        : "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-600">
                      {firstSession ? locationSummary(firstSession) : "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-600">
                      {formatCost(c.costPerPerson)}
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        className="mr-3 text-brand-600 hover:underline"
                      >
                        編輯
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(c)}
                        className="text-red-500 hover:underline"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-slate-50/40">
                      <td></td>
                      <td colSpan={7} className="px-3 py-2">
                        <table className="w-full text-xs">
                          <thead className="text-slate-400">
                            <tr>
                              <th className="py-1 text-left">時間</th>
                              <th className="py-1 text-left">類型</th>
                              <th className="py-1 text-left">地點</th>
                            </tr>
                          </thead>
                          <tbody>
                            {c.sessions.map((s) => (
                              <tr key={s.id} className="border-t border-slate-100">
                                <td className="py-1.5">
                                  {formatDateTimeRangeDisplay(s.startTime, s.endTime)}
                                </td>
                                <td className="py-1.5">
                                  {s.locationType === "onsite" ? "實體" : "線上"}
                                </td>
                                <td className="py-1.5">{s.location || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
