import Link from "next/link";
import type { QuestProgressEntry, SessionUser } from "@/lib/types";
import type { SocialDashboardData } from "@/lib/social";
import { AccountActivityView } from "./AccountActivityView";
import { AccountFriendsSummary } from "./AccountFriendsSummary";
import { AccountHero } from "./AccountChrome";
import { PostsManager } from "./PostsManager";

export function AccountDashboard({
  user,
  progress,
  initialSocial,
}: {
  user: SessionUser;
  progress: QuestProgressEntry[];
  initialSocial: SocialDashboardData;
}) {
  const currentQuest =
    progress.find((entry) => !entry.completedAt) ?? progress[0];

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-10">
      <AccountHero user={user} />

      <nav
        aria-label="Разделы личного кабинета"
        className="mb-7 grid grid-cols-2 gap-3 sm:flex"
      >
        <Link
          href="/account/quests"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#dfe1e6] bg-paper-white px-4 py-2.5 text-caption font-extrabold uppercase text-charcoal hover:border-spark-blue hover:text-spark-blue"
        >
          <span aria-hidden="true">🚂</span>
          Мои квесты
        </Link>
        <Link
          href="/account/friends"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#dfe1e6] bg-paper-white px-4 py-2.5 text-caption font-extrabold uppercase text-charcoal hover:border-spark-blue hover:text-spark-blue"
        >
          <span aria-hidden="true">☺</span>
          Друзья
        </Link>
      </nav>

      <section className="mb-7 grid items-stretch gap-5 md:grid-cols-2">
        <div className="flex h-full flex-col rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-5 sm:p-6">
          <p className="text-caption font-extrabold uppercase tracking-wide text-eager-green">
            Продолжить обучение
          </p>
          {currentQuest ? (
            <div className="mt-4 flex grow flex-col gap-4 sm:flex-row sm:items-center">
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
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-eager-green px-4 py-2.5 text-caption font-extrabold uppercase text-paper-white hover:bg-[#4cb002]"
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
        <div className="flex h-full flex-col rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-5 sm:p-6">
          <p className="text-caption font-extrabold uppercase tracking-wide text-spark-blue">
            Банк заданий
          </p>
          <div className="mt-4 flex grow flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#e9f7ff] text-3xl">
              ▦
            </span>
            <div className="min-w-0 grow">
              <p className="text-subheading font-black text-charcoal">
                Практика SQL
              </p>
              <p className="mt-1 text-[14px] font-bold text-pencil-gray">
                50 заданий разной сложности на базе квеста
              </p>
            </div>
            <Link
              href="/practice"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-eager-green px-4 py-2.5 text-caption font-extrabold uppercase text-paper-white hover:bg-[#4cb002]"
            >
              Открыть
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(230px,1fr)]">
          <div className="min-w-0">
            <AccountActivityView activity={initialSocial.activity} />
          </div>
          <AccountFriendsSummary
            friends={initialSocial.friends}
            requests={initialSocial.requests}
          />
        </div>
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
