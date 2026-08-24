"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CourseDTO,
  CourseInput,
  LaneFilter,
  SprintDTO,
  SprintInput,
  ViewMode,
} from "@/types";
import {
  addMonths,
  addQuarters,
  endOfMonth,
  endOfQuarter,
  formatMonthLabel,
  formatQuarterLabel,
  parseLocal,
  startOfMonth,
  startOfQuarter,
} from "@/lib/date";
import Timeline from "@/components/Timeline/Timeline";
import TimelineControls from "@/components/Timeline/TimelineControls";
import CourseList from "@/components/CourseList";
import SprintList from "@/components/SprintList";
import CourseForm from "@/components/CourseForm";
import SprintForm from "@/components/SprintForm";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";

async function readJsonOrThrow(res: Response) {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? "發生錯誤，請稍後再試");
  }
  return body;
}

export default function HomePage() {
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [sprints, setSprints] = useState<SprintDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [laneFilter, setLaneFilter] = useState<LaneFilter>("both");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [courseModal, setCourseModal] = useState<{ mode: "add" | "edit"; course?: CourseDTO } | null>(
    null
  );
  const [sprintModal, setSprintModal] = useState<{ mode: "add" | "edit"; sprint?: SprintDTO } | null>(
    null
  );
  const [deleteCourseTarget, setDeleteCourseTarget] = useState<CourseDTO | null>(null);
  const [deleteSprintTarget, setDeleteSprintTarget] = useState<SprintDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [coursesRes, sprintsRes] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/sprints"),
      ]);
      const [coursesData, sprintsData] = await Promise.all([
        readJsonOrThrow(coursesRes),
        readJsonOrThrow(sprintsRes),
      ]);
      setCourses(coursesData);
      setSprints(sprintsData);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "資料載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- 時間軸顯示區間 ----
  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => {
    if (viewMode === "custom" && customStart && customEnd) {
      return {
        rangeStart: parseLocal(customStart),
        rangeEnd: parseLocal(customEnd),
        rangeLabel: "自訂區間",
      };
    }
    if (viewMode === "quarter") {
      return {
        rangeStart: startOfQuarter(anchorDate),
        rangeEnd: endOfQuarter(anchorDate),
        rangeLabel: formatQuarterLabel(anchorDate),
      };
    }
    return {
      rangeStart: startOfMonth(anchorDate),
      rangeEnd: endOfMonth(anchorDate),
      rangeLabel: formatMonthLabel(anchorDate),
    };
  }, [viewMode, anchorDate, customStart, customEnd]);

  function handleViewModeChange(v: ViewMode) {
    setViewMode(v);
  }

  function handlePrev() {
    setAnchorDate((d) => (viewMode === "quarter" ? addQuarters(d, -1) : addMonths(d, -1)));
  }

  function handleNext() {
    setAnchorDate((d) => (viewMode === "quarter" ? addQuarters(d, 1) : addMonths(d, 1)));
  }

  function handleToday() {
    setAnchorDate(new Date());
  }

  function handleCustomStartChange(v: string) {
    setCustomStart(v);
    if (v && customEnd) setViewMode("custom");
  }

  function handleCustomEndChange(v: string) {
    setCustomEnd(v);
    if (customStart && v) setViewMode("custom");
  }

  function handleClearCustom() {
    setCustomStart("");
    setCustomEnd("");
    setViewMode("month");
  }

  // ---- 課程 CRUD ----
  async function submitCourse(input: CourseInput) {
    if (courseModal?.mode === "edit" && courseModal.course) {
      const res = await fetch(`/api/courses/${courseModal.course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      await readJsonOrThrow(res);
    } else {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      await readJsonOrThrow(res);
    }
    setCourseModal(null);
    await loadData();
  }

  async function confirmDeleteCourse() {
    if (!deleteCourseTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/courses/${deleteCourseTarget.id}`, { method: "DELETE" });
      await readJsonOrThrow(res);
      setDeleteCourseTarget(null);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setDeleting(false);
    }
  }

  // ---- Sprint CRUD ----
  async function submitSprint(input: SprintInput) {
    if (sprintModal?.mode === "edit" && sprintModal.sprint) {
      const res = await fetch(`/api/sprints/${sprintModal.sprint.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      await readJsonOrThrow(res);
    } else {
      const res = await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      await readJsonOrThrow(res);
    }
    setSprintModal(null);
    await loadData();
  }

  async function confirmDeleteSprint() {
    if (!deleteSprintTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sprints/${deleteSprintTarget.id}`, { method: "DELETE" });
      await readJsonOrThrow(res);
      setDeleteSprintTarget(null);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">外訓時間軸比對系統</h1>
        <p className="mt-1 text-sm text-slate-500">
          登記外訓課程時間地點，並與 Sprint 時間軸疊圖比對，快速判斷是否有時間衝突。
        </p>
      </header>

      {loadError && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
          {loadError}
          <button type="button" onClick={loadData} className="ml-3 underline">
            重新載入
          </button>
        </div>
      )}

      <section className="mb-8">
        <TimelineControls
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          rangeLabel={rangeLabel}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          laneFilter={laneFilter}
          onLaneFilterChange={setLaneFilter}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={handleCustomStartChange}
          onCustomEndChange={handleCustomEndChange}
          onClearCustom={handleClearCustom}
        />
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            載入中…
          </div>
        ) : (
          <Timeline
            courses={courses}
            sprints={sprints}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            laneFilter={laneFilter}
          />
        )}
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">外訓課程列表</h2>
          <button
            type="button"
            onClick={() => setCourseModal({ mode: "add" })}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            ＋ 新增課程
          </button>
        </div>
        <CourseList
          courses={courses}
          onEdit={(course) => setCourseModal({ mode: "edit", course })}
          onDelete={(course) => setDeleteCourseTarget(course)}
        />
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Sprint 列表</h2>
          <button
            type="button"
            onClick={() => setSprintModal({ mode: "add" })}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            ＋ 新增 Sprint
          </button>
        </div>
        <SprintList
          sprints={sprints}
          onEdit={(sprint) => setSprintModal({ mode: "edit", sprint })}
          onDelete={(sprint) => setDeleteSprintTarget(sprint)}
        />
      </section>

      <Modal
        open={!!courseModal}
        onClose={() => setCourseModal(null)}
        title={courseModal?.mode === "edit" ? "編輯課程" : "新增課程"}
        maxWidthClassName="max-w-2xl"
      >
        {courseModal && (
          <CourseForm
            initial={courseModal.course}
            onSubmit={submitCourse}
            onCancel={() => setCourseModal(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!sprintModal}
        onClose={() => setSprintModal(null)}
        title={sprintModal?.mode === "edit" ? "編輯 Sprint" : "新增 Sprint"}
      >
        {sprintModal && (
          <SprintForm
            initial={sprintModal.sprint}
            onSubmit={submitSprint}
            onCancel={() => setSprintModal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteCourseTarget}
        title="刪除課程"
        message={`確定要刪除《${deleteCourseTarget?.title ?? ""}》嗎？此動作無法復原。`}
        onConfirm={confirmDeleteCourse}
        onCancel={() => setDeleteCourseTarget(null)}
        busy={deleting}
      />

      <ConfirmDialog
        open={!!deleteSprintTarget}
        title="刪除 Sprint"
        message={`確定要刪除《${deleteSprintTarget?.name ?? ""}》嗎？此動作無法復原。`}
        onConfirm={confirmDeleteSprint}
        onCancel={() => setDeleteSprintTarget(null)}
        busy={deleting}
      />
    </main>
  );
}
