"use client";

import { useMemo } from "react";
import { CourseDTO } from "@/types";
import { ANNUAL_BUDGET_PER_PERSON, BUDGET_PEOPLE } from "@/lib/budget";

function formatMoney(n: number): string {
  return `NT$ ${Math.round(n).toLocaleString("zh-TW")}`;
}

function BudgetCard({ person, used }: { person: string; used: number }) {
  const pct = Math.round((used / ANNUAL_BUDGET_PER_PERSON) * 100);
  const barPct = Math.min(100, (used / ANNUAL_BUDGET_PER_PERSON) * 100);
  const overBudget = used >= ANNUAL_BUDGET_PER_PERSON;
  const overspend = Math.max(0, used - ANNUAL_BUDGET_PER_PERSON);
  const remaining = Math.max(0, ANNUAL_BUDGET_PER_PERSON - used);

  return (
    <div
      className={`rounded-2xl p-5 shadow-sm transition-colors ${
        overBudget ? "bg-slate-500" : "bg-slate-900"
      }`}
    >
      <p className={`truncate text-2xl font-bold sm:text-3xl ${overBudget ? "text-slate-300" : "text-white"}`}>
        {formatMoney(used)}
      </p>
      <p className={`text-sm ${overBudget ? "text-slate-400" : "text-slate-400"}`}>
        / {formatMoney(ANNUAL_BUDGET_PER_PERSON)}
      </p>
      <p className={`mt-1 text-sm font-medium ${overBudget ? "text-slate-400" : "text-brand-300"}`}>
        {person}
      </p>

      <div className={`mt-4 h-2 overflow-hidden rounded-full ${overBudget ? "bg-slate-400/40" : "bg-white/10"}`}>
        <div
          className={`h-full rounded-full transition-all ${overBudget ? "bg-slate-300" : "bg-brand-400"}`}
          style={{ width: `${barPct}%` }}
        />
      </div>

      <div className={`mt-2 flex items-center justify-between text-xs ${overBudget ? "text-slate-400" : "text-slate-400"}`}>
        <span>{pct}% 已使用</span>
        <span>剩餘 {formatMoney(remaining)}</span>
      </div>

      {overspend > 0 && (
        <p className="mt-2 text-xs font-semibold text-amber-300">已超支 {formatMoney(overspend)}</p>
      )}
    </div>
  );
}

export default function BudgetDashboard({ courses }: { courses: CourseDTO[] }) {
  const usageByPerson = useMemo(() => {
    const map = new Map<string, number>();
    for (const person of BUDGET_PEOPLE) map.set(person, 0);
    for (const course of courses) {
      const cost = course.costPerPerson ?? 0;
      for (const attendee of course.attendees) {
        if (map.has(attendee)) {
          map.set(attendee, (map.get(attendee) ?? 0) + cost);
        }
      }
    }
    return map;
  }, [courses]);

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-base font-semibold text-slate-900">費用儀表板</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BUDGET_PEOPLE.map((person) => (
          <BudgetCard key={person} person={person} used={usageByPerson.get(person) ?? 0} />
        ))}
      </div>
    </section>
  );
}
