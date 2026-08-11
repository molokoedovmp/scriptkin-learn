import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountSectionHeader } from "@/components/AccountChrome";
import { AccountShell } from "@/components/AccountShell";
import { getAccountProgress, getAvailableQuestsCount } from "@/lib/account";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Мои истории — Скрипткин" };
export const dynamic = "force-dynamic";

export default async function AccountQuestsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [progress, available] = await Promise.all([
    getAccountProgress(user.id),
    getAvailableQuestsCount(),
  ]);

  return (
    <AccountShell>
          <AccountSectionHeader
            title="Мои истории"
            description="Все начатые расследования, открытые главы и завершённые истории."
          />
          <div className="mb-5 rounded-xl bg-storybook-green p-4 text-[15px] font-bold text-[#53723d]">
            Доступно историй: {available}. Решённый шаг автоматически появляется
            в календаре активности.
          </div>

          {progress.length === 0 ? (
            <div className="rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-10 text-center">
              <p className="text-5xl">🚂</p>
              <h2 className="mt-4 text-heading-sm font-black text-charcoal">
                Истории ещё не начаты
              </h2>
              <p className="mt-2 text-body font-medium text-pencil-gray">
                Начни с «Полуночного экспресса» и раскрой дело запросами.
              </p>
              <Link
                href="/quests/midnight-express"
                className="mt-6 inline-flex rounded-xl bg-eager-green px-6 py-3 text-caption font-extrabold uppercase text-paper-white"
              >
                Начать историю
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {progress.map((entry) => {
                const done = Boolean(entry.completedAt);
                const percent = done
                  ? 100
                  : Math.round(
                      (Math.max(entry.currentStep - 1, 0) /
                        Math.max(entry.stepsCount, 1)) *
                        100
                    );

                return (
                  <Link
                    key={entry.questSlug}
                    href={`/account/quests/${entry.questSlug}`}
                    className="group flex items-center gap-5 rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-5 hover:border-eager-green"
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#f3f4f6] text-4xl">
                      {entry.emoji}
                    </span>
                    <span className="min-w-0 grow">
                      <span className="flex justify-between gap-3">
                        <b className="text-subheading text-charcoal">
                          {entry.title}
                        </b>
                        <small className="font-extrabold uppercase text-pencil-gray">
                          {done
                            ? "Пройдена"
                            : `Шаг ${entry.currentStep} из ${entry.stepsCount}`}
                        </small>
                      </span>
                      <span className="mt-3 block h-3 overflow-hidden rounded-full bg-[#e5e5e5]">
                        <span
                          className="block h-full rounded-full bg-eager-green"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span className="mt-2 block text-caption font-bold text-pencil-gray">
                        {percent}% завершено
                      </span>
                    </span>
                    <span className="text-2xl font-black text-spark-blue group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
    </AccountShell>
  );
}
