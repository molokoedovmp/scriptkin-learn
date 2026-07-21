"use client";

import { useMemo } from "react";
import type { ActivityDay } from "@/lib/social";

export function AccountActivityView({ activity }: { activity: ActivityDay[] }) {
  const cells = useMemo(() => buildCalendar(activity), [activity]);
  return (
    <div className="min-w-0 max-w-full">
      <section className="min-w-0 max-w-full overflow-hidden rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-4 sm:p-7">
        <div className="mb-6">
          <p className="text-caption font-extrabold uppercase tracking-wide text-eager-green">Последние 365 дней</p>
          <h2 className="mt-1 text-heading-sm font-black text-charcoal">Календарь активности</h2>
          <p className="mt-2 text-[15px] font-medium text-pencil-gray">Зелёная клетка появляется за решённый шаг квеста или упражнение банка.</p>
        </div>
        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain pb-3">
          <div className="min-w-[780px]">
            <div className="mb-2 flex justify-between pl-8 text-[11px] font-bold text-faded-gray">
              {["авг", "сен", "окт", "ноя", "дек", "янв", "фев", "мар", "апр", "май", "июн", "июл"].map((month) => <span key={month}>{month}</span>)}
            </div>
            <div className="flex gap-2">
              <div className="grid grid-rows-7 gap-1 text-[10px] font-bold text-faded-gray"><span /><span>Пн</span><span /><span>Ср</span><span /><span>Пт</span><span /></div>
              <div className="grid grid-flow-col grid-rows-7 gap-1">
                {cells.map((cell, index) => cell ? (
                  <span key={cell.date} title={`${cell.date}: ${cell.count} вкладов`} className="h-3.5 w-3.5 rounded-[3px]" style={{ backgroundColor: color(cell.count) }} />
                ) : <span key={`empty-${index}`} className="h-3.5 w-3.5" />)}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-1 text-caption font-bold text-faded-gray">
          Меньше
          {["#ebedf0", "#d7ffb8", "#a5ed6e", "#58cc02", "#3f9900"].map((item) => <i key={item} className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: item }} />)}
          Больше
        </div>
      </section>
    </div>
  );
}

function buildCalendar(activity: ActivityDay[]) {
  const counts = new Map(activity.map((day) => [day.date, day.count]));
  const end = new Date(); end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - 364);
  const offset = (start.getUTCDay() + 6) % 7;
  const cells: Array<ActivityDay | null> = Array.from({ length: offset }, () => null);
  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10);
    cells.push({ date, count: counts.get(date) ?? 0 });
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

function color(count: number) {
  if (!count) return "#ebedf0";
  if (count === 1) return "#d7ffb8";
  if (count === 2) return "#a5ed6e";
  if (count <= 4) return "#58cc02";
  return "#3f9900";
}
