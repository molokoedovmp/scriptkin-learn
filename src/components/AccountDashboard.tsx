import Link from "next/link";
import type { QuestProgressEntry, SessionUser } from "@/lib/types";
import type { SocialDashboardData } from "@/lib/social";
import { AccountActivityView } from "./AccountActivityView";
import { AccountHero } from "./AccountChrome";
import { PostsManager } from "./PostsManager";

export interface AccountStats {
  completedQuests: number;
  solvedSteps: number;
  availableQuests: number;
}

export function AccountDashboard({
  user,
  progress,
  stats,
  initialSocial,
}: {
  user: SessionUser;
  progress: QuestProgressEntry[];
  stats: AccountStats;
  initialSocial: SocialDashboardData;
}) {
  const currentQuest =
    progress.find((entry) => !entry.completedAt) ?? progress[0];

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-10">
      <AccountHero user={user} />

      <nav aria-label="Разделы личного кабинета" className="mb-7 flex gap-2">
        <Link
          href="/account/quests"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-[#cceeb4] bg-paper-white px-3.5 py-2 text-caption font-extrabold text-[#3f9900] hover:bg-storybook-green"
        >
          <span aria-hidden="true">🚂</span>
          Мои квесты
        </Link>
        <Link
          href="/account/friends"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-[#e0d5f5] bg-paper-white px-3.5 py-2 text-caption font-extrabold text-[#7449bd] hover:bg-[#f7f2ff]"
        >
          <span aria-hidden="true">☺</span>
          Друзья
        </Link>
      </nav>

      <section className="mb-7 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-6">
          <p className="text-caption font-extrabold uppercase tracking-wide text-eager-green">
            Продолжить обучение
          </p>
          {currentQuest ? (
            <div className="mt-4 flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#f3f4f6] text-3xl">
                {currentQuest.emoji}
              </span>
              <div className="min-w-0 grow">
                <p className="text-subheading font-black text-charcoal">
                  {currentQuest.title}
                </p>
                <p className="mt-1 text-[14px] font-bold text-pencil-gray">
                  {currentQuest.completedAt
                    ? "Квест пройден"
                    : `Открыт шаг ${currentQuest.currentStep} из ${currentQuest.stepsCount}`}
                </p>
              </div>
              <Link
                href={`/quests/${currentQuest.questSlug}`}
                className="rounded-xl bg-eager-green px-4 py-2.5 text-caption font-extrabold uppercase text-paper-white"
              >
                Открыть
              </Link>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-[#f7f8fa] p-4">
              <p className="text-[15px] font-bold text-pencil-gray">
                Начни первый SQL-квест
              </p>
              <Link
                href="/quests/midnight-express"
                className="font-extrabold text-spark-blue"
              >
                Начать →
              </Link>
            </div>
          )}
        </div>
        <div className="rounded-[20px] bg-storybook-green p-6">
          <p className="text-caption font-extrabold uppercase tracking-wide text-[#3f9900]">
            Твой результат
          </p>
          <p className="mt-3 text-heading-sm font-black text-charcoal">
            {stats.solvedSteps} решённых шагов
          </p>
          <p className="mt-2 text-[15px] font-medium text-[#53723d]">
            Пройдено квестов: {stats.completedQuests} из {stats.availableQuests} доступных.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-4">
          <p className="text-caption font-extrabold uppercase tracking-wide text-eager-green">
            Твоя учёба
          </p>
          <h2 className="mt-1 font-feather text-heading-sm font-black text-charcoal">
            Активность
          </h2>
        </div>
        <AccountActivityView activity={initialSocial.activity} />
      </section>

      <section>
        <div className="mb-4">
          <p className="text-caption font-extrabold uppercase tracking-wide text-[#a67800]">
            Сообщество
          </p>
          <h2 className="mt-1 font-feather text-heading-sm font-black text-charcoal">
            Публикации
          </h2>
        </div>
        <PostsManager user={user} initialPosts={initialSocial.posts} />
      </section>
    </div>
  );
}
