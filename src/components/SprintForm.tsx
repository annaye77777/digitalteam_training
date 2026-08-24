"use client";

import { useState } from "react";
import { PRODUCT_LABEL, Product, SprintDTO, SprintInput } from "@/types";

function toInput(sprint?: SprintDTO): SprintInput {
  if (!sprint) return { name: "", product: "navi", startDate: "", endDate: "", note: "" };
  return {
    name: sprint.name,
    product: sprint.product,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    note: sprint.note ?? "",
  };
}

export default function SprintForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: SprintDTO;
  onSubmit: (input: SprintInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<SprintInput>(() => toInput(initial));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (!form.name.trim()) return "Sprint 名稱為必填";
    if (!form.startDate) return "開始日期為必填";
    if (!form.endDate) return "結束日期為必填";
    if (form.endDate < form.startDate) return "結束日期不能早於開始日期";
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
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Sprint 名稱／編號 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="例如：Sprint 24"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            產品 <span className="text-red-500">*</span>
          </label>
          <select
            value={form.product}
            onChange={(e) => setForm((f) => ({ ...f, product: e.target.value as Product }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {(Object.keys(PRODUCT_LABEL) as Product[]).map((p) => (
              <option key={p} value={p}>
                {PRODUCT_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            開始日期 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            結束日期 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">備註</label>
        <input
          type="text"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

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
