import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSectionHeader } from "@/components/AccountChrome";
import { AccountShell } from "@/components/AccountShell";
import { AccountActivityView } from "@/components/AccountActivityView";
import { AccountFriendsSummary } from "@/components/AccountFriendsSummary";
import { getSessionUser } from "@/lib/auth";
import { getSocialDashboard } from "@/lib/social";

export const metadata: Metadata = {
  title: "Моя активность — Скрипткин",
};

export const dynamic = "force-dynamic";

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function WeeklyActivityChart({
  activity,
}: {
  activity: Array<{
    created_at?: string;
    date?: string;
    points?: number;
  }>;
}) {
  const today = new Date();

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);

    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));

    return {
      date,
      key: getDateKey(date),
      label: new Intl.DateTimeFormat("ru-RU", {
        weekday: "short",
      })
        .format(date)
        .replace(".", ""),
      value: 0,
    };
  });

  const byDate = new Map(days.map((day) => [day.key, day]));

  for (const item of activity ?? []) {
    const rawDate = item.created_at ?? item.date;

    if (!rawDate) continue;

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) continue;

    const day = byDate.get(getDateKey(date));

    if (day) {
      day.value += item.points ?? 1;
    }
  }

  const width = 700;
  const height = 230;

  const padding = {
    top: 30,
    right: 25,
    bottom: 40,
    left: 25,
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...days.map((day) => day.value), 1);

  const points = days.map((day, index) => {
    const x =
      padding.left +
      (index / Math.max(days.length - 1, 1)) * chartWidth;

    const y =
      padding.top +
      chartHeight -
      (day.value / maxValue) * chartHeight;

    return {
      ...day,
      x,
      y,
    };
  });

  /*
   * Плавная кривая Catmull-Rom -> cubic Bézier.
   * В отличие от обычного L график будет именно кривой.
   */
  const createSmoothPath = () => {
    if (points.length === 0) return "";
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  const path = createSmoothPath();

  const areaPath = `
    ${path}
    L ${points[points.length - 1].x} ${padding.top + chartHeight}
    L ${points[0].x} ${padding.top + chartHeight}
    Z
  `;

  const total = days.reduce((sum, day) => sum + day.value, 0);

  return (
    <section className="account-weekly-chart overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Активность за последние 7 дней
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Выполненные задания по дням
          </p>
        </div>

        <div className="text-right">
          <div className="text-xl font-semibold text-slate-900">
            {total}
          </div>

          <div className="text-xs text-slate-500">
            всего
          </div>
        </div>
      </div>

      <div className="overflow-x-auto px-4 pb-3 pt-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[600px]"
          role="img"
          aria-label="Активность за последние семь дней"
        >
          <defs>
            <linearGradient
              id="activityGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#22c55e"
                stopOpacity="0.2"
              />

              <stop
                offset="100%"
                stopColor="#22c55e"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartHeight * ratio;

            return (
              <line
                key={ratio}
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            );
          })}

          <path d={areaPath} fill="url(#activityGradient)" />

          <path
            d={path}
            fill="none"
            stroke="#16a34a"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point) => (
            <g key={point.key}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="#ffffff"
                stroke="#16a34a"
                strokeWidth="3"
              />

              <text
                className="activity-chart-value"
                x={point.x}
                y={point.y - 12}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
              >
                {point.value}
              </text>

              <text
                className="activity-chart-label"
                x={point.x}
                y={height - 12}
                textAnchor="middle"
                fontSize="11"
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}

export default async function AccountActivityPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const social = await getSocialDashboard(user.id);

  return (
    <AccountShell>
          <AccountSectionHeader
            title="Активность"
            description="Отслеживай свою активность в изучении SQL."
          />

          <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(230px,1fr)]">
            <div className="min-w-0 space-y-5">
              <AccountActivityView activity={social.activity} />

              <WeeklyActivityChart activity={social.activity} />
            </div>

            <AccountFriendsSummary
              friends={social.friends}
              requests={social.requests}
            />
          </div>
    </AccountShell>
  );
}
