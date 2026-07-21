import Link from "next/link";
import type { Quest } from "@/lib/types";
import { DIFFICULTY_LABELS } from "@/lib/types";

const difficultyColors: Record<Quest["difficulty"], string> = {
  beginner: "text-eager-green",
  intermediate: "text-spark-blue",
  advanced: "text-night-ink",
};

export function QuestCard({ quest }: { quest: Quest }) {
  const isAvailable = quest.status === "available";

  const card = (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border-2 transition-colors ${
        isAvailable
          ? "border-[#e5e5e5] hover:border-eager-green"
          : "border-[#e5e5e5] opacity-70"
      }`}
    >
      {quest.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={quest.previewUrl}
          alt=""
          className="aspect-[2/1] w-full border-b-2 border-[#e5e5e5] object-cover"
        />
      ) : (
        <div className="pt-6 pl-6 text-5xl" aria-hidden>
          {quest.emoji}
        </div>
      )}
      <div className="flex grow flex-col p-6 pt-4">
      <div className="mb-2 flex items-center gap-3">
        <span
          className={`text-caption font-bold uppercase tracking-wide ${difficultyColors[quest.difficulty]}`}
        >
          {DIFFICULTY_LABELS[quest.difficulty]}
        </span>
        <span className="text-caption font-medium text-faded-gray">
          {quest.stepsCount} шагов
        </span>
      </div>
      <h3 className="mb-2 text-subheading font-bold text-charcoal">
        {quest.title}
      </h3>
      <p className="mb-4 grow text-body font-medium text-pencil-gray">
        {quest.tagline}
      </p>
      <span
        className={`text-nav-label font-bold uppercase ${
          isAvailable ? "text-spark-blue" : "text-faded-gray"
        }`}
      >
        {isAvailable ? "Начать квест →" : "Скоро"}
      </span>
      </div>
    </article>
  );

  if (!isAvailable) {
    return card;
  }
  return (
    <Link href={`/quests/${quest.slug}`} className="block h-full">
      {card}
    </Link>
  );
}
