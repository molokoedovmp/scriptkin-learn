import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductJsonLd } from "@/components/seo/JsonLd";
import { DIFFICULTY_LABELS } from "@/lib/types";
import {
  PUBLIC_STORY_PAGES,
  getPublicStoryPage,
} from "@/lib/story-pages";

type StoryPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return PUBLIC_STORY_PAGES.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({
  params,
}: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = getPublicStoryPage(slug);

  if (!story) return {};

  const canonical = `/stories/${story.slug}`;
  const image = story.quest.previewUrl ?? "/logo.png";

  return {
    title: story.seoTitle,
    description: story.seoDescription,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      siteName: "Скрипткин",
      title: story.seoTitle,
      description: story.seoDescription,
      url: canonical,
      images: [{ url: image, alt: `Обложка истории «${story.quest.title}»` }],
    },
    twitter: {
      card: "summary_large_image",
      title: story.seoTitle,
      description: story.seoDescription,
      images: [image],
    },
  };
}

function formatPrice(priceKopecks: number) {
  if (priceKopecks === 0) return "Бесплатно";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(priceKopecks / 100);
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = getPublicStoryPage(slug);

  if (!story) notFound();

  const { quest } = story;
  const canonical = `/stories/${story.slug}`;
  const price = formatPrice(quest.priceKopecks);
  const isPaid = quest.priceKopecks > 0;
  const breadcrumbItems = [
    { name: "Главная", path: "/" },
    { name: "Истории для изучения SQL", path: "/quests" },
    { name: quest.title, path: canonical },
  ];

  return (
    <>
      <ProductJsonLd
        name={quest.title}
        description={story.seoDescription}
        path={canonical}
        imagePath={quest.previewUrl ?? "/logo.png"}
        priceKopecks={quest.priceKopecks}
      />
      <Header />
      <main className="flex-1">
        <section className="border-b-2 border-[#e5e5e5] bg-[#f7f8fa]">
          <div className="mx-auto max-w-[1200px] px-6 py-10 sm:py-14">
            <Breadcrumbs className="mb-7" items={breadcrumbItems} />

            <div className="grid items-center gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
              <div>
                <div className="mb-5 flex flex-wrap gap-2 text-caption font-extrabold uppercase tracking-wide">
                  <span className="rounded-full bg-storybook-green px-3 py-1.5 text-[#3f9900]">
                    {DIFFICULTY_LABELS[quest.difficulty]}
                  </span>
                  <span className="rounded-full bg-[#e8f7ff] px-3 py-1.5 text-[#0784bf]">
                    {quest.stepsCount} уроков
                  </span>
                  <span className="rounded-full bg-[#eeeff8] px-3 py-1.5 text-[#7449bd]">
                    PostgreSQL
                  </span>
                </div>

                <h1 className="font-feather text-[40px] font-black leading-[1.06] text-charcoal sm:text-[54px]">
                  {quest.title}: интерактивное обучение SQL
                </h1>
                <p className="mt-5 max-w-[690px] text-body font-semibold leading-relaxed text-pencil-gray">
                  {story.lead}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <Link
                    href={`/account/quests/${quest.slug}`}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-eager-green px-7 py-3 text-nav-label font-extrabold uppercase text-[#173a05] shadow-[0_4px_0_#3f9900] transition hover:translate-y-0.5 hover:shadow-[0_2px_0_#3f9900]"
                  >
                    {isPaid ? "Купить и начать" : "Начать бесплатно"}
                  </Link>
                  <div>
                    <span className="block text-caption font-bold uppercase tracking-wide text-faded-gray">
                      Стоимость доступа
                    </span>
                    <strong className="text-[28px] font-black text-charcoal">{price}</strong>
                  </div>
                </div>
                <p className="mt-4 text-caption font-medium text-pencil-gray">
                  Для сохранения прогресса нужен аккаунт с подтверждённой почтой.
                  {isPaid ? " Доступ откроется после успешной оплаты." : " Оплата не требуется."}
                </p>
              </div>

              <div className="relative overflow-hidden rounded-[24px] bg-night-ink shadow-[0_22px_60px_rgba(15,23,42,0.24)] ring-1 ring-black/10">
                <Image
                  src={quest.previewUrl ?? "/logo.png"}
                  alt={`Обложка интерактивной SQL-истории «${quest.title}»`}
                  width={1677}
                  height={938}
                  priority
                  className="aspect-video w-full object-cover"
                />
                <div className="flex items-center justify-between gap-5 p-5 text-white">
                  <div>
                    <p className="text-caption font-extrabold uppercase tracking-[0.12em] text-fresh-leaf">
                      Сюжет + практика
                    </p>
                    <p className="mt-1 text-subheading font-black">
                      {quest.stepsCount} последовательных SQL-уроков
                    </p>
                  </div>
                  <span className="text-4xl" aria-hidden="true">{quest.emoji}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1200px] px-6 py-14 sm:py-20">
          <section aria-labelledby="about-story" className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:gap-14">
            <div>
              <p className="text-caption font-extrabold uppercase tracking-[0.12em] text-eager-green">
                О программе
              </p>
              <h2 id="about-story" className="mt-2 font-feather text-heading-sm font-black text-charcoal">
                Что представляет собой эта история
              </h2>
              <p className="mt-4 text-body font-medium leading-relaxed text-pencil-gray">
                {quest.intro}
              </p>
              <p className="mt-4 text-body font-medium leading-relaxed text-pencil-gray">
                {story.audience}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border-2 border-[#e5e5e5] bg-[#e5e5e5]">
              {[
                ["Уровень", DIFFICULTY_LABELS[quest.difficulty]],
                ["Уроков", String(quest.stepsCount)],
                ["Таблиц в базе", String(story.tableCount)],
                ["Формат", "Сюжет и SQL"],
                ["СУБД", "PostgreSQL"],
                ["Цена", price],
              ].map(([term, value]) => (
                <div key={term} className="bg-paper-white p-5">
                  <dt className="text-caption font-bold uppercase tracking-wide text-faded-gray">{term}</dt>
                  <dd className="mt-1 text-body font-extrabold text-charcoal">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="learning-topics" className="mt-16 sm:mt-20">
            <p className="text-caption font-extrabold uppercase tracking-[0.12em] text-spark-blue">
              Результат обучения
            </p>
            <h2 id="learning-topics" className="mt-2 font-feather text-heading-sm font-black text-charcoal">
              Что вы изучите
            </h2>
            <p className="mt-3 max-w-[760px] text-body font-medium leading-relaxed text-pencil-gray">
              Каждый приём сначала объясняется, затем применяется к данным истории и проверяется по фактическому результату запроса.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {story.topics.map((topic, index) => (
                <article key={topic.title} className="rounded-[18px] border-2 border-[#e5e5e5] bg-paper-white p-6">
                  <span className="text-caption font-black text-eager-green">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-subheading font-black text-charcoal">{topic.title}</h3>
                  <p className="mt-2 text-body font-medium leading-relaxed text-pencil-gray">
                    {topic.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="story-database" className="mt-16 rounded-[24px] border-2 border-[#d8e8cf] bg-[#efffdf] p-7 sm:mt-20 sm:p-9">
            <p className="text-caption font-extrabold uppercase tracking-[0.12em] text-[#3f9900]">
              Учебная база данных
            </p>
            <h2 id="story-database" className="mt-2 font-feather text-heading-sm font-black text-charcoal">
              Запросы выполняются на связанных данных
            </h2>
            <p className="mt-3 max-w-[900px] text-body font-medium leading-relaxed text-pencil-gray">
              {story.databaseDescription} Встроенный редактор принимает настоящие SELECT-запросы PostgreSQL, а проверка учитывает колонки, строки и требуемый порядок результата.
            </p>
          </section>

          <section aria-labelledby="story-lessons" className="mt-16 sm:mt-20">
            <p className="text-caption font-extrabold uppercase tracking-[0.12em] text-eager-green">
              Содержание
            </p>
            <h2 id="story-lessons" className="mt-2 font-feather text-heading-sm font-black text-charcoal">
              Программа из {quest.stepsCount} уроков
            </h2>
            <ol className="mt-8 grid gap-3 md:grid-cols-2">
              {story.lessons.map((lesson, index) => (
                <li key={lesson} className="flex items-center gap-4 rounded-2xl border-2 border-[#e5e5e5] bg-paper-white p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-storybook-green text-caption font-black text-[#3f9900]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-body font-extrabold text-charcoal">{lesson}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-16 rounded-[24px] bg-night-ink p-7 text-white sm:mt-20 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-9">
            <div>
              <h2 className="font-feather text-heading-sm font-black">
                Готовы начать историю «{quest.title}»?
              </h2>
              <p className="mt-2 max-w-[700px] text-body font-medium text-white/75">
                {isPaid
                  ? `Полный доступ ко всем ${quest.stepsCount} урокам стоит ${price}.`
                  : `Все ${quest.stepsCount} уроков доступны бесплатно.`}
                {" "}После прохождения можно продолжить практику на этой базе в банке заданий.
              </p>
            </div>
            <Link
              href={`/account/quests/${quest.slug}`}
              className="mt-6 inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-eager-green px-7 py-3 text-nav-label font-extrabold uppercase text-[#173a05] shadow-[0_4px_0_#3f9900] sm:mt-0"
            >
              {isPaid ? `Купить за ${price}` : "Начать бесплатно"}
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
