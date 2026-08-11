import Image from "next/image";
import Link from "next/link";
import type { Quest } from "@/lib/types";
import { DIFFICULTY_LABELS } from "@/lib/types";
import { COMING_SOON_PRICE_RUB } from "@/lib/quests";

const difficultyStyles: Record<Quest["difficulty"], string> = {
  beginner: "bg-eager-green text-paper-white",
  intermediate: "bg-spark-blue text-paper-white",
  advanced: "bg-night-ink text-paper-white",
};

export function QuestCard({
  quest,
  priority = false,
}: {
  quest: Quest;
  priority?: boolean;
}) {
  const isAvailable = quest.status === "available";
  const isPaid = quest.priceKopecks > 0;

  const card = (
    <article
      id={`story-${quest.slug}`}
      className="group relative isolate min-h-[470px] overflow-hidden rounded-[24px] bg-night-ink shadow-[0_16px_45px_rgba(15,23,42,0.16)] ring-1 ring-black/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,23,42,0.24)]"
    >
      {quest.previewUrl ? (
        <Image
          src={quest.previewUrl}
          alt={`Обложка истории «${quest.title}»`}
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw"
          quality={76}
          priority={priority}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#182433] to-[#090d14] text-8xl"
          aria-hidden
        >
          {quest.emoji}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/95" />
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black via-black/70 to-transparent" />

      <div className="relative z-10 flex min-h-[470px] flex-col justify-between p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] shadow-sm ${difficultyStyles[quest.difficulty]}`}
          >
            {DIFFICULTY_LABELS[quest.difficulty]}
          </span>
          <span className="rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {quest.stepsCount} шагов
          </span>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white/70">
            <span>{isAvailable ? "Доступна" : "Скоро"}</span>
            <span className="h-1 w-1 rounded-full bg-eager-green" />
            <span>SQL-история</span>
          </div>
          <h3 className="mb-3 text-[27px] font-extrabold leading-tight text-white drop-shadow-md">
            {quest.title}
          </h3>
          <p className="mb-5 text-[15px] font-semibold leading-relaxed text-white/80">
            {quest.tagline}
          </p>

          {isAvailable ? (
            isPaid ? (
              <div className="flex items-end justify-between gap-4 border-t border-white/20 pt-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Цена</span>
                  <strong className="text-[26px] font-extrabold leading-none text-white">
                    {quest.priceKopecks / 100} ₽
                  </strong>
                </div>
                <span className="inline-flex rounded-xl bg-eager-green px-5 py-3 text-nav-label font-extrabold uppercase text-paper-white shadow-lg shadow-black/20">
                  Купить →
                </span>
              </div>
            ) : (
              <span className="inline-flex rounded-xl bg-eager-green px-5 py-3 text-nav-label font-extrabold uppercase text-paper-white shadow-lg shadow-black/20">
                Открыть историю →
              </span>
            )
          ) : (
            <div className="flex items-end justify-between gap-4 border-t border-white/20 pt-4">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                  Цена
                </span>
                <strong className="text-[26px] font-extrabold leading-none text-white">
                  {COMING_SOON_PRICE_RUB} ₽
                </strong>
              </div>
              <button
                type="button"
                disabled
                title="Покупка пока недоступна"
                className="cursor-not-allowed rounded-xl bg-white px-5 py-3 text-nav-label font-extrabold uppercase text-charcoal opacity-80"
              >
                Купить
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );

  if (!isAvailable) {
    return card;
  }
  return (
    <Link href={`/stories/${quest.slug}`} className="block h-full">
      {card}
    </Link>
  );
}
