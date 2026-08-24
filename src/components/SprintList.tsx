"use client";

import { useMemo, useState } from "react";
import { PRODUCT_LABEL, Product, SprintDTO } from "@/types";
import { formatDateDisplay } from "@/lib/date";

const BADGE_CLASS: Record<Product, string> = {
  navi: "bg-blue-50 text-blue-700 border-blue-200",
  ifrs: "bg-violet-50 text-violet-700 border-violet-200",
};

export default function SprintList({
  sprints,
  onEdit,
  onDelete,
}: {
  sprints: SprintDTO[];
  onEdit: (sprint: SprintDTO) => void;
  onDelete: (sprint: SprintDTO) => void;
}) {
  const [product, setProduct] = useState<"" | Product>("");

  const filtered = useMemo(
    () => (product ? sprints.filter((s) => s.product === product) : sprints),
    [sprints, product]
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={product}
          onChange={(e) => setProduct(e.target.value as "" | Product)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">所有產品</option>
          {(Object.keys(PRODUCT_LABEL) as Product[]).map((p) => (
            <option key={p} value={p}>
              {PRODUCT_LABEL[p]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">產品</th>
              <th className="px-3 py-2">Sprint 名稱</th>
              <th className="px-3 py-2">開始日期</th>
              <th className="px-3 py-2">結束日期</th>
              <th className="px-3 py-2">備註</th>
              <th className="px-3 py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                  沒有符合條件的 Sprint
                </td>
              </tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/60">
                <td className="px-3 py-2">
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${BADGE_CLASS[s.product]}`}
                  >
                    {PRODUCT_LABEL[s.product]}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                <td className="px-3 py-2 text-slate-600">{formatDateDisplay(s.startDate)}</td>
                <td className="px-3 py-2 text-slate-600">{formatDateDisplay(s.endDate)}</td>
                <td className="px-3 py-2 text-slate-500">{s.note || "—"}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(s)}
                    className="mr-3 text-brand-600 hover:underline"
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(s)}
                    className="text-red-500 hover:underline"
                  >
                    刪除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
