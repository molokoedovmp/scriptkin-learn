import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QuestPlayer } from "@/components/QuestPlayer";
import { getQuestWithSteps, getUserQuestProgress } from "@/lib/quests-db";
import { getDemoQuest } from "@/lib/quests";
import { getSessionUser } from "@/lib/auth";
import { DIFFICULTY_LABELS } from "@/lib/types";

// Страница зависит от cookie сессии (прогресс игрока)
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quest = getDemoQuest(slug);
  return {
    title: quest ? `${quest.title} — Скрипткин` : "Квест не найден — Скрипткин",
  };
}

export default async function QuestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getQuestWithSteps(slug);
  if (!data) notFound();
  const { quest, steps, scenes } = data;

  const user = await getSessionUser();
  const progress = user
    ? await getUserQuestProgress(user.id, quest.slug)
    : null;

  const playable = quest.status === "available" && steps.length > 0;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div
          className={`mx-auto ${
            playable
              ? "max-w-[1440px] px-3 py-5 md:px-5"
              : "max-w-[800px] px-6 py-16"
          }`}
        >
          {!playable && (
            <div className="mb-2 flex items-center gap-3">
              <span className="text-nav-label font-bold uppercase text-spark-blue">
                {DIFFICULTY_LABELS[quest.difficulty]}
              </span>
              <span className="text-nav-label font-medium text-faded-gray">
                {quest.stepsCount} шагов
              </span>
            </div>
          )}
          <h1
            className={`font-feather font-extrabold text-eager-green ${
              playable ? "mb-4 text-heading-sm" : "mb-8 text-heading"
            }`}
          >
            {quest.emoji} {quest.title}
          </h1>

          {playable ? (
            <QuestPlayer
              quest={quest}
              steps={steps}
              scenes={scenes}
              initialStep={progress?.currentStep ?? 1}
              initiallyCompleted={Boolean(progress?.completedAt)}
              isAuthed={Boolean(user)}
            />
          ) : (
            <>
              <p className="mb-10 text-body font-medium leading-relaxed text-pencil-gray">
                {quest.intro}
              </p>
              <div className="rounded-xl border-2 border-[#e5e5e5] p-8 text-center">
                <p className="mb-2 text-subheading font-bold text-charcoal">
                  Квест ещё готовится
                </p>
                <p className="text-body font-medium text-pencil-gray">
                  Сюжет пишется, база данных наполняется. Начни пока с
                  «Полночного экспресса».
                </p>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
