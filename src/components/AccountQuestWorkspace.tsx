import { notFound, redirect } from "next/navigation";
import { AccountShell } from "@/components/AccountShell";
import { PurchaseCard } from "@/components/PurchaseCard";
import { QuestPlayer } from "@/components/QuestPlayer";
import { getSessionUser } from "@/lib/auth";
import { getQuestAccess, hasQuestTesterAccess } from "@/lib/quest-access";
import { COMING_SOON_PRICE_RUB } from "@/lib/quests";
import { getQuestWithSteps, getUserQuestProgress } from "@/lib/quests-db";
import { DIFFICULTY_LABELS } from "@/lib/types";

export async function AccountQuestWorkspace({ slug }: { slug: string }) {
  const user = await getSessionUser();
  const returnTo = `/account/quests/${slug}`;

  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const data = await getQuestWithSteps(slug);
  if (!data) notFound();

  const { quest, steps, scenes } = data;
  const progress = await getUserQuestProgress(user.id, quest.slug);
  const canAccessAllSteps = hasQuestTesterAccess(user.email);
  const access =
    quest.priceKopecks === 0
      ? { allowed: true, purchased: false }
      : await getQuestAccess(user.id, quest.slug, user.email);
  const playable =
    quest.status === "available" && steps.length > 0 && access.allowed;
  const requiresPurchase =
    quest.status === "available" && quest.priceKopecks > 0 && !access.allowed;
  const workspaceTheme = playable
    ? quest.slug.startsWith("prometheus")
      ? "quest-game-workspace prometheus-quest-workspace"
      : quest.slug === "midnight-express"
        ? "quest-game-workspace midnight-quest-workspace"
        : ""
    : "";

  return (
    <AccountShell fullBleed={Boolean(workspaceTheme)}>
      <div
        className={`${
          playable ? "" : "mx-auto max-w-[800px] py-6 sm:py-10"
        } ${workspaceTheme}`}
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

        {!playable && (
          <h1
            className={`font-feather font-extrabold text-eager-green ${
              playable ? "mb-4 text-heading-sm" : "mb-8 text-heading"
            }`}
          >
            {quest.emoji} {quest.title}
          </h1>
        )}

        {playable ? (
          <QuestPlayer
            quest={quest}
            steps={steps}
            scenes={scenes}
            initialStep={progress?.currentStep ?? 1}
            initiallyCompleted={Boolean(progress?.completedAt)}
            isAuthed
            canAccessAllSteps={canAccessAllSteps}
          />
        ) : requiresPurchase ? (
          <>
            <p className="mb-10 text-body font-medium leading-relaxed text-pencil-gray">
              {quest.intro}
            </p>
            <PurchaseCard
              questSlug={quest.slug}
              questTitle={quest.title}
              priceKopecks={quest.priceKopecks}
              isAuthed
            />
          </>
        ) : (
          <>
            <p className="mb-10 text-body font-medium leading-relaxed text-pencil-gray">
              {quest.intro}
            </p>
            <div className="rounded-xl border-2 border-[#e5e5e5] bg-paper-white p-8 text-center">
              <p className="mb-2 text-subheading font-bold text-charcoal">
                История ещё готовится
              </p>
              <p className="text-body font-medium text-pencil-gray">
                Сюжет пишется, база данных наполняется. Выбери пока другую доступную историю.
              </p>
              <p className="mt-6 text-heading-sm font-extrabold text-charcoal">
                {COMING_SOON_PRICE_RUB} ₽
              </p>
              <button
                type="button"
                disabled
                title="Покупка пока недоступна"
                className="mt-3 cursor-not-allowed rounded-xl bg-eager-green px-7 py-3 text-caption font-extrabold uppercase text-paper-white opacity-70"
              >
                Купить
              </button>
            </div>
          </>
        )}
      </div>
    </AccountShell>
  );
}
