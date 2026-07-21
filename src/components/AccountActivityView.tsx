"use client";

import { useMemo } from "react";
import type { ActivityDay } from "@/lib/social";

export function AccountActivityView({ activity }: { activity: ActivityDay[] }) {
  const { cells, total, activeDays, streak } = useMemo(
    () => buildCalendar(activity),
    [activity]
  );
  return (
    <>
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Metric value={total} label="вкладов за год" />
        <Metric value={activeDays} label="активных дней" />
        <Metric value={streak} label="дней подряд" />
      </div>
      <section className="rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-5 sm:p-7">
        <div className="mb-6">
          <p className="text-caption font-extrabold uppercase tracking-wide text-eager-green">Последние 365 дней</p>
          <h2 className="mt-1 text-heading-sm font-black text-charcoal">Календарь активности</h2>
          <p className="mt-2 text-[15px] font-medium text-pencil-gray">Зелёная клетка появляется за решённый шаг квеста или упражнение банка.</p>
        </div>
        <div className="overflow-x-auto pb-3">
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
      <section className="mt-5 rounded-[20px] bg-storybook-green p-6">
        <p className="text-caption font-extrabold uppercase tracking-wide text-[#3f9900]">Как увеличить активность</p>
        <h2 className="mt-2 text-subheading font-black text-charcoal">Решай хотя бы одно задание каждый день</h2>
        <p className="mt-2 text-[15px] font-medium text-[#53723d]">Повторное решение того же упражнения не дублирует вклад — календарь показывает реальное продвижение.</p>
      </section>
    </>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return <div className="rounded-[18px] border-2 border-[#e6e7eb] bg-paper-white p-4"><p className="text-heading-sm font-black text-eager-green">{value}</p><p className="text-caption font-extrabold uppercase text-pencil-gray">{label}</p></div>;
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
  const activeDays = activity.filter((day) => day.count > 0).length;
  const total = activity.reduce((sum, day) => sum + day.count, 0);
  const active = new Set(activity.filter((day) => day.count > 0).map((day) => day.date));
  const cursor = new Date(end);
  if (!active.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (active.has(cursor.toISOString().slice(0, 10))) { streak++; cursor.setUTCDate(cursor.getUTCDate() - 1); }
  return { cells, total, activeDays, streak };
}

function color(count: number) {
  if (!count) return "#ebedf0";
  if (count === 1) return "#d7ffb8";
  if (count === 2) return "#a5ed6e";
  if (count <= 4) return "#58cc02";
  return "#3f9900";
}
