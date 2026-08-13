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

const SPOILER_FREE_TOPICS = {
  "midnight-express": [
    {
      title: "Чтение данных с помощью SELECT",
      description:
        "Вы научитесь выбирать нужные столбцы из таблицы и понимать структуру результата. Это основа, на которой строятся все последующие запросы.",
    },
    {
      title: "Фильтрация строк",
      description:
        "Вы будете отбирать записи через WHERE, объединять несколько требований оператором AND и сравнивать числовые значения. Запросы начнут отвечать на конкретные вопросы, а не возвращать всю таблицу.",
    },
    {
      title: "Сортировка и диапазоны",
      description:
        "Вы разберётесь с ORDER BY и BETWEEN, чтобы располагать события в нужной последовательности и искать данные внутри заданного интервала.",
    },
    {
      title: "Связи между таблицами",
      description:
        "Вы познакомитесь с LEFT JOIN и научитесь находить записи, для которых связанная информация отсутствует. Отдельно разберёте корректную проверку значений NULL.",
    },
    {
      title: "Подсчёт и группировка",
      description:
        "Вы примените COUNT и GROUP BY для получения итогов по группам данных. Это позволит перейти от просмотра отдельных строк к простому анализу таблиц.",
    },
  ],
  "submarine-crash": [
    {
      title: "Чтение и фильтрация данных",
      description:
        "Вы начнёте с SELECT и FROM, а затем научитесь отбирать строки через WHERE. Все конструкции вводятся постепенно и не требуют предыдущего опыта.",
    },
    {
      title: "Условия и сортировка",
      description:
        "Вы объедините несколько требований с помощью AND и OR, освоите сравнения и ORDER BY. Это позволит находить нужные записи и быстро замечать аномальные значения.",
    },
    {
      title: "Подсчёты и группировка",
      description:
        "Вы примените COUNT, SUM и MAX вместе с GROUP BY и HAVING. Запросы будут превращать отдельные строки в понятные сводки по группам данных.",
    },
    {
      title: "Условные вычисления",
      description:
        "CASE поможет рассчитывать новое значение по заданному условию, сохраняя исходные данные. Вы также дадите вычисляемым столбцам понятные имена через AS.",
    },
    {
      title: "Объединение связанных таблиц",
      description:
        "Вы познакомитесь с JOIN и подзапросами, чтобы сопоставлять сведения из нескольких реестров. На практике станет понятно, зачем базе нужны связи между таблицами.",
    },
    {
      title: "Многоэтапные запросы",
      description:
        "С помощью WITH и CTE вы разделите сложную задачу на последовательные части. К финалу сможете читать и собирать запросы из нескольких логических шагов.",
    },
  ],
  "prometheus-beginner": [
    {
      title: "Уверенная работа с выборкой",
      description:
        "Вы последовательно освоите SELECT, WHERE, ORDER BY, LIMIT, IN и BETWEEN. Каждый новый оператор будет добавляться к уже знакомым конструкциям на небольших понятных шагах.",
    },
    {
      title: "Агрегаты и группировка",
      description:
        "Вы научитесь считать строки, искать минимальные и максимальные значения, группировать данные и фильтровать полученные группы через HAVING.",
    },
    {
      title: "Текст, NULL и условные значения",
      description:
        "Вы разберёте поиск по тексту через ILIKE, проверку отсутствующих значений и замену NULL с помощью COALESCE. Конструкция CASE поможет формировать понятные категории прямо в запросе.",
    },
    {
      title: "Объединение связанных данных",
      description:
        "Вы научитесь соединять таблицы через JOIN и LEFT JOIN, а также объединять однотипные результаты оператором UNION ALL. На практике станет понятно, когда нужен каждый подход.",
    },
    {
      title: "Подзапросы и проверки существования",
      description:
        "Вы освоите вложенные запросы, EXISTS и NOT EXISTS для проверки связанных записей. Эти конструкции помогут формулировать более сложные условия без дублирования данных.",
    },
    {
      title: "CTE, даты и составные запросы",
      description:
        "Вы познакомитесь с WITH и CTE, вычислениями дат и времени, а затем соберёте несколько операций в один читаемый запрос. В финальной части будет рассмотрен рекурсивный CTE.",
    },
  ],
  prometheus: [
    {
      title: "Многотабличные запросы",
      description:
        "Вы будете уверенно соединять данные через JOIN и FULL OUTER JOIN. Для выбора подходящей связанной строки познакомитесь с LATERAL.",
    },
    {
      title: "Операции над наборами",
      description:
        "Вы разберёте UNION ALL, INTERSECT и EXCEPT и научитесь выбирать оператор в зависимости от задачи сравнения нескольких источников.",
    },
    {
      title: "Оконные функции",
      description:
        "Вы примените LEAD, LAG, FIRST_VALUE и LAST_VALUE для анализа последовательностей без сворачивания исходных строк. Это полезно при сравнении состояний и событий во времени.",
    },
    {
      title: "Продвинутая агрегация",
      description:
        "Вы научитесь считать уникальные значения и сопоставлять показатели до и после выбранной точки. Запросы будут объединять группировку, условия и несколько источников данных.",
    },
    {
      title: "Рекурсивные CTE",
      description:
        "Вы освоите рекурсивные запросы для обхода связанных записей и построения маршрутов. Отдельное внимание уделяется ограничению глубины и защите от циклов.",
    },
    {
      title: "Сложные проверки данных",
      description:
        "Вы объедините EXISTS, подзапросы, оконные функции и операции над наборами в комплексных аналитических задачах. Акцент сделан на читаемости и проверяемом результате запроса.",
    },
  ],
} as const;

const STORY_BACKGROUNDS: Record<string, string> = {
  "midnight-express": "/quests/midnight-express/bacground-lesson.webp",
  "prometheus-beginner": "/quests/prometheus/background-lesson.webp",
  prometheus: "/quests/prometheus/background-lesson.webp",
  "submarine-crash": "/quests/submarine-crash/ackground-for-lesson.png",
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
  const isSubmarineStory = story.slug === "submarine-crash";
  const pageBackground = STORY_BACKGROUNDS[story.slug];
  const heroImage = isSubmarineStory
    ? "/quests/submarine-crash/preview.png"
    : quest.previewUrl ?? "/logo.png";
  const learningTopics = SPOILER_FREE_TOPICS[story.slug];
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
      <main
        className="story-detail-page flex-1 bg-[#031321] bg-cover bg-center bg-fixed bg-no-repeat py-6 sm:py-10"
        style={{ backgroundImage: `url('${pageBackground}')` }}
      >
        <section className="story-detail-panel story-detail-hero mx-auto max-w-[1200px] rounded-t-[28px] border-x border-t shadow-2xl">
          <div className="mx-auto max-w-[1200px] px-6 py-8 sm:px-10 sm:py-11">
            <Breadcrumbs className="mb-7" items={breadcrumbItems} />

            <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
              <div>
                <p className="mb-4 text-caption font-extrabold uppercase tracking-[0.14em] text-eager-green">
                  {DIFFICULTY_LABELS[quest.difficulty]} · {quest.stepsCount} уроков · {price}
                </p>

                <h1 className="font-feather text-[42px] font-black leading-[1.06] text-charcoal sm:text-[58px]">
                  {quest.title}
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
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[20px] bg-night-ink">
                <Image
                  src={heroImage}
                  alt={`Обложка интерактивной SQL-истории «${quest.title}»`}
                  width={1677}
                  height={938}
                  priority
                  className="aspect-[16/10] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="story-detail-panel mx-auto max-w-[1200px] rounded-b-[28px] border-x border-b px-6 py-14 shadow-2xl sm:px-10 sm:py-20">
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
            <p className="mt-3 text-body font-medium leading-relaxed text-pencil-gray">
              Каждый приём сначала объясняется, затем применяется к данным истории и проверяется по фактическому результату запроса.
            </p>
            <ul className="mt-8 divide-y-2 divide-[#e5e5e5] border-y-2 border-[#e5e5e5]">
              {learningTopics.map((topic) => (
                <li key={topic.title} className="flex gap-4 py-6 sm:gap-5 sm:py-7">
                  <span className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full bg-eager-green" aria-hidden="true" />
                  <div>
                    <h3 className="text-subheading font-black text-charcoal">{topic.title}</h3>
                    <p className="mt-2 max-w-none text-body font-medium leading-relaxed text-pencil-gray">
                      {topic.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="story-database" className="mt-16 border-t border-[#d9dfe5] pt-10 sm:mt-20">
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

          <section className="mt-14 border-t border-[#d9dfe5] pt-10 sm:mt-16 sm:flex sm:items-end sm:justify-between sm:gap-8">
            <div>
              <p className="text-caption font-extrabold uppercase tracking-[0.12em] text-eager-green">
                Начать обучение
              </p>
              <h2 className="mt-2 font-feather text-heading-sm font-black text-charcoal">
                Готовы начать историю «{quest.title}»?
              </h2>
              <p className="mt-2 max-w-[700px] text-body font-medium text-pencil-gray">
                {isPaid
                  ? `Полный доступ ко всем ${quest.stepsCount} урокам стоит ${price}.`
                  : `Все ${quest.stepsCount} уроков доступны бесплатно.`}
                {" "}После прохождения можно продолжить практику на этой базе в банке заданий.
              </p>
            </div>
            <Link
              href={`/account/quests/${quest.slug}`}
              className="mt-6 inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-eager-green px-7 py-3 text-nav-label font-extrabold uppercase text-[#173a05] transition hover:bg-[#58c900] sm:mt-0"
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
