"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import Balancer from "react-wrap-balancer";
import type { QuestDifficulty, QuestStatus } from "@/lib/types";

export interface HeroStory {
  slug: string;
  title: string;
  description: string;
  image: string;
  difficulty: QuestDifficulty;
  stepsCount: number;
  status: QuestStatus;
  priceKopecks: number;
}

export interface StoryHeroProps {
  eyebrow: string;
  title: string;
  titleLine2: string;
  titleHighlight: string;
  description: string;
  socialProof: string;
  stories: HeroStory[];
}

const DIFFICULTY_LABELS: Record<QuestDifficulty, string> = {
  beginner: "Новичок",
  intermediate: "Средний",
  advanced: "Продвинутый",
};

const FAN_SLOTS = [
  { layout: "sm:-mr-8 sm:z-10", rotate: -6, y: 22 },
  { layout: "sm:z-20", rotate: 0, y: -8 },
  { layout: "sm:-ml-8 sm:z-10", rotate: 6, y: 22 },
] as const;

export function StoryHero({
  eyebrow,
  title,
  titleLine2,
  titleHighlight,
  description,
  socialProof,
  stories,
}: StoryHeroProps) {
  const reduceMotion = useReducedMotion();
  const animate = !reduceMotion;

  return (
    <section className="story-hero relative isolate overflow-hidden">
      <div className="story-hero-grid absolute inset-0" aria-hidden="true" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-eager-green/10 blur-3xl" />
      <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-spark-blue/10 blur-3xl" />

      <div
        className="relative z-10 mx-auto flex max-w-[1240px] flex-col items-center gap-9 px-5 py-16 text-center sm:gap-12 sm:px-6 sm:py-24"
      >
        <div className="flex max-w-[820px] flex-col items-center gap-5">
          <p className="inline-flex rounded-full border-2 border-[#d8e8cf] bg-paper-white/80 px-4 py-2 text-caption font-extrabold uppercase tracking-[0.12em] text-eager-green shadow-sm backdrop-blur">
            {eyebrow}
          </p>

          <h1 className="font-feather text-[38px] font-black leading-[1.04] tracking-[-0.035em] text-charcoal sm:text-[54px] md:text-[66px]">
            <Balancer>{title}</Balancer>
            <br />
            <Balancer>
              {titleLine2} <span className="text-eager-green">{titleHighlight}</span>
            </Balancer>
          </h1>

          <p className="max-w-[680px] text-body font-medium leading-relaxed text-pencil-gray">
            <Balancer>{description}</Balancer>
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/quests/midnight-express"
              className="hero-primary-cta inline-flex min-h-12 items-center justify-center rounded-xl bg-eager-green px-7 py-3 text-nav-label font-extrabold uppercase text-paper-white shadow-[0_5px_0_#3e9900] transition-transform hover:-translate-y-0.5"
            >
              Начать историю
            </Link>
            <Link
              href="/quests"
              className="hero-secondary-cta inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-[#d8dce3] bg-paper-white px-7 py-3 text-nav-label font-extrabold uppercase text-charcoal transition-colors hover:border-spark-blue hover:text-spark-blue"
            >
              Выбрать историю
            </Link>
          </div>
          <p className="text-caption font-bold text-faded-gray">{socialProof}</p>
        </div>

        <div
          className="mx-auto flex w-full max-w-[930px] items-center justify-center px-1 pt-4 sm:px-8 sm:pt-7"
        >
          {stories.slice(0, 3).map((story, index) => {
            const slot = FAN_SLOTS[index] ?? FAN_SLOTS[1];
            return (
              <StoryFanCard
                key={story.slug}
                story={story}
                slot={slot}
                animate={animate}
                priority={index === 1}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StoryFanCard({
  story,
  slot,
  animate,
  priority,
}: {
  story: HeroStory;
  slot: (typeof FAN_SLOTS)[number];
  animate: boolean;
  priority: boolean;
}) {
  const card = (
    <motion.article
      initial={{ x: 0, y: slot.y, rotate: slot.rotate, opacity: 1 }}
      whileHover={animate ? { y: slot.y - 12, rotate: slot.rotate * 0.45, scale: 1.025 } : undefined}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative aspect-[4/5] w-[38%] min-w-0 shrink-0 overflow-hidden rounded-[18px] bg-night-ink text-left shadow-[0_24px_60px_rgba(15,23,42,0.28)] outline outline-1 outline-black/15 sm:rounded-[24px] ${slot.layout}`}
    >
      <Image
        src={story.image}
        alt={`Обложка истории «${story.title}»`}
        fill
        priority={priority}
        sizes="(max-width: 639px) 38vw, 310px"
        className="object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/15 to-black/95" />
      <div className="absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-black via-black/65 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-between p-2.5 sm:p-4 md:p-5">
        <div className="flex items-start justify-between gap-1 sm:gap-2">
          <span className="rounded-full bg-black/65 px-2 py-1 text-[7px] font-extrabold uppercase tracking-wide text-white backdrop-blur sm:px-2.5 sm:text-[10px]">
            {DIFFICULTY_LABELS[story.difficulty]}
          </span>
          <span className="rounded-full bg-black/65 px-2 py-1 text-[7px] font-extrabold uppercase tracking-wide text-white/85 backdrop-blur sm:px-2.5 sm:text-[10px]">
            {story.stepsCount} шагов
          </span>
        </div>

        <div>
          <p className={`mb-1 text-[7px] font-extrabold uppercase tracking-[0.1em] sm:mb-2 sm:text-[10px] ${story.status === "available" ? "text-fresh-leaf" : "text-[#ffd76a]"}`}>
            {story.status === "available"
              ? story.priceKopecks > 0
                ? `${story.priceKopecks / 100} ₽`
                : "Доступна"
              : "Скоро"}
          </p>
          <h2 className="text-[13px] font-black leading-tight text-white drop-shadow sm:text-[18px] md:text-[21px]">
            {story.title}
          </h2>
          <p className="mt-2 hidden text-[12px] font-semibold leading-snug text-white/75 md:line-clamp-3 md:block">
            {story.description}
          </p>
          <span className="mt-3 hidden text-[11px] font-extrabold uppercase text-white sm:inline-flex">
            {story.status === "available"
              ? story.priceKopecks > 0
                ? "Купить →"
                : "Открыть →"
              : "Узнать больше"}
          </span>
        </div>
      </div>
    </motion.article>
  );

  return story.status === "available" ? (
    <Link href={`/quests/${story.slug}`} className="contents">
      {card}
    </Link>
  ) : (
    card
  );
}

export default StoryHero;
