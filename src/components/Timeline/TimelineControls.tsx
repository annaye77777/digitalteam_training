"use client";

import { LaneFilter, ViewMode } from "@/types";

export default function TimelineControls({
  viewMode,
  onViewModeChange,
  rangeLabel,
  onPrev,
  onNext,
  onToday,
  laneFilter,
  onLaneFilterChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  onClearCustom,
}: {
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  rangeLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  laneFilter: LaneFilter;
  onLaneFilterChange: (v: LaneFilter) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (v: string) => void;
  onCustomEndChange: (v: string) => void;
  onClearCustom: () => void;
}) {
  const isCustom = viewMode === "custom";

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="flex overflow-hidden rounded-md border border-slate-300">
        <button
          type="button"
          onClick={() => onViewModeChange("month")}
          className={`px-3 py-1.5 text-sm ${
            viewMode === "month" ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          月檢視
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("quarter")}
          className={`border-l border-slate-300 px-3 py-1.5 text-sm ${
            viewMode === "quarter" ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          季檢視
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={isCustom}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={onToday}
          disabled={isCustom}
          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          今天
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isCustom}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          ›
        </button>
      </div>

      <span className="min-w-[110px] text-sm font-medium text-slate-700">{rangeLabel}</span>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-slate-500">
          <input
            type="date"
            value={customStart}
            onChange={(e) => onCustomStartChange(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <span>至</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          {isCustom && (
            <button
              type="button"
              onClick={onClearCustom}
              className="text-xs text-brand-600 hover:underline"
            >
              清除自訂區間
            </button>
          )}
        </div>

        <div className="flex overflow-hidden rounded-md border border-slate-300">
          {(
            [
              ["both", "兩者疊圖"],
              ["courses", "只看課程"],
              ["sprints", "只看 Sprint"],
            ] as [LaneFilter, string][]
          ).map(([value, label], i) => (
            <button
              key={value}
              type="button"
              onClick={() => onLaneFilterChange(value)}
              className={`px-3 py-1.5 text-sm ${i > 0 ? "border-l border-slate-300" : ""} ${
                laneFilter === value ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
