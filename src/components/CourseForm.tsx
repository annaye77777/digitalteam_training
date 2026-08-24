"use client";

import { useState } from "react";
import { CourseDTO, CourseInput, CourseSessionInput, LocationType } from "@/types";
import { TEAM_MEMBERS } from "@/lib/teamMembers";

function emptySession(): CourseSessionInput {
  return { startTime: "", endTime: "", locationType: "onsite", location: "" };
}

function toInput(course?: CourseDTO): CourseInput {
  if (!course) {
    return { title: "", attendees: [""], costPerPerson: "", sessions: [emptySession()] };
  }
  return {
    title: course.title,
    attendees: course.attendees.length > 0 ? course.attendees : [""],
    costPerPerson: course.costPerPerson != null ? String(course.costPerPerson) : "",
    sessions: course.sessions.map((s) => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      locationType: s.locationType,
      location: s.location ?? "",
    })),
  };
}

export default function CourseForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: CourseDTO;
  onSubmit: (input: CourseInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CourseInput>(() => toInput(initial));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateSession(index: number, patch: Partial<CourseSessionInput>) {
    setForm((f) => ({
      ...f,
      sessions: f.sessions.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }

  function addSession() {
    setForm((f) => ({ ...f, sessions: [...f.sessions, emptySession()] }));
  }

  function removeSession(index: number) {
    setForm((f) => ({ ...f, sessions: f.sessions.filter((_, i) => i !== index) }));
  }

  function updateAttendee(index: number, value: string) {
    setForm((f) => ({
      ...f,
      attendees: f.attendees.map((a, i) => (i === index ? value : a)),
    }));
  }

  function addAttendee() {
    setForm((f) => ({ ...f, attendees: [...f.attendees, ""] }));
  }

  function removeAttendee(index: number) {
    setForm((f) => ({ ...f, attendees: f.attendees.filter((_, i) => i !== index) }));
  }

  function validate(): string | null {
    if (!form.title.trim()) return "課程名稱為必填";
    if (form.costPerPerson.trim() !== "") {
      const n = Number(form.costPerPerson);
      if (!Number.isFinite(n)) return "課程費用需為數字";
      if (n < 0) return "課程費用不能為負數";
    }
    if (form.sessions.length < 1) return "至少需要一個上課時段";
    for (let i = 0; i < form.sessions.length; i++) {
      const s = form.sessions[i];
      const label = `第 ${i + 1} 個時段`;
      if (!s.startTime) return `${label}：開始日期時間為必填`;
      if (!s.endTime) return `${label}：結束日期時間為必填`;
      if (s.endTime < s.startTime) return `${label}：結束時間不能早於開始時間`;
      if (s.locationType === "onsite" && !s.location.trim())
        return `${label}：選擇「實體」時地點為必填`;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clientError = validate();
    if (clientError) {
      setError(clientError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        attendees: form.attendees.map((a) => a.trim()).filter((a) => a.length > 0),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          課程名稱 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="例如：敏捷專案管理實戰工作坊"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">上課人</label>
          <button
            type="button"
            onClick={addAttendee}
            className="rounded-md border border-brand-300 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            ＋ 新增上課人
          </button>
        </div>
        <div className="space-y-2">
          {form.attendees.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={a}
                onChange={(e) => updateAttendee(i, e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">請選擇</option>
                {TEAM_MEMBERS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                {/* 舊資料若不在目前名單內（例如名單異動前留下的紀錄），仍保留原值可選，避免編輯時被覆蓋掉 */}
                {a && !TEAM_MEMBERS.includes(a) && (
                  <option value={a}>{a}（非目前名單成員）</option>
                )}
              </select>
              <button
                type="button"
                onClick={() => removeAttendee(i)}
                disabled={form.attendees.length <= 1}
                className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                移除
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">課程費用（新台幣/人）</label>
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={form.costPerPerson}
          onChange={(e) => setForm((f) => ({ ...f, costPerPerson: e.target.value }))}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="例如：3000"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">
            上課時段 <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={addSession}
            className="rounded-md border border-brand-300 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            ＋ 新增時段
          </button>
        </div>

        <div className="space-y-3">
          {form.sessions.map((s, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">第 {i + 1} 個時段</span>
                <button
                  type="button"
                  onClick={() => removeSession(i)}
                  disabled={form.sessions.length <= 1}
                  className="text-xs font-medium text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  刪除時段
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">開始日期時間</label>
                  <input
                    type="datetime-local"
                    value={s.startTime}
                    onChange={(e) => updateSession(i, { startTime: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">結束日期時間</label>
                  <input
                    type="datetime-local"
                    value={s.endTime}
                    onChange={(e) => updateSession(i, { endTime: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="mt-2">
                <label className="mb-1 block text-xs text-slate-500">上課地點類型</label>
                <div className="flex gap-4">
                  {(["onsite", "online"] as LocationType[]).map((lt) => (
                    <label key={lt} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="radio"
                        name={`locationType-${i}`}
                        checked={s.locationType === lt}
                        onChange={() => updateSession(i, { locationType: lt })}
                      />
                      {lt === "onsite" ? "實體" : "線上"}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-2">
                <label className="mb-1 block text-xs text-slate-500">
                  {s.locationType === "onsite" ? (
                    <>
                      地點 <span className="text-red-500">*</span>
                    </>
                  ) : (
                    "會議連結（選填）"
                  )}
                </label>
                <input
                  type="text"
                  value={s.location}
                  onChange={(e) => updateSession(i, { location: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder={s.locationType === "onsite" ? "例如：台北總部 3F 教室" : "例如：Google Meet 連結"}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? "儲存中…" : "儲存"}
        </button>
      </div>
    </form>
  );
}
