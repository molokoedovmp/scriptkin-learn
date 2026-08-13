import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ARTICLES, type ArticleAccent } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Статьи и уроки по SQL для начинающих — Скрипткин",
  description:
    "Читайте понятные статьи по SQL: план обучения с нуля, SELECT, JOIN, GROUP BY, задачи аналитика и советы по самостоятельной практике.",
  alternates: {
    canonical: "/articles",
  },
};

const accentStyles: Record<
  ArticleAccent,
  { badge: string; panel: string; line: string }
> = {
  green: {
    badge: "bg-storybook-green text-[#3f9900]",
    panel: "bg-[#efffdf]",
    line: "border-eager-green",
  },
  blue: {
    badge: "bg-[#e8f7ff] text-[#0784bf]",
    panel: "bg-[#eef9ff]",
    line: "border-spark-blue",
  },
  amber: {
    badge: "bg-[#fff4cf] text-[#936900]",
    panel: "bg-[#fff4cf]",
    line: "border-[#e8b321]",
  },
};

export default function ArticlesPage() {
  const [featuredArticle, ...articles] = ARTICLES;
  const featuredStyle = accentStyles[featuredArticle.accent];

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="articles-hero border-b-2 border-[#e5e5e5]">
          <div className="mx-auto max-w-[1200px] px-6 py-10 sm:py-14">
            <Breadcrumbs
              className="mb-6"
              items={[
                { name: "Главная", path: "/" },
                { name: "Статьи о SQL", path: "/articles" },
              ]}
            />
            <span className="mb-4 inline-flex rounded-full bg-storybook-green px-4 py-2 text-caption font-extrabold uppercase tracking-wide text-[#3f9900]">
              Библиотека знаний
            </span>
            <h1 className="max-w-[760px] font-feather text-[40px] font-black leading-[1.08] text-charcoal sm:text-heading">
              Статьи о SQL без лишней теории
            </h1>
            <p className="mt-5 max-w-[680px] text-body font-medium text-pencil-gray">
              Разбирай команды на коротких примерах, закрепляй материал в
              историях и возвращайся к статье, когда нужна подсказка.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 py-12 sm:py-16">
          <h2 className="mb-6 font-feather text-heading-sm font-black text-charcoal">
            Начни с основы
          </h2>
          <Link
            href={`/articles/${featuredArticle.slug}`}
            className={`group grid overflow-hidden rounded-[24px] border-2 ${featuredStyle.line} bg-paper-white transition-transform hover:-translate-y-1 lg:grid-cols-[1.15fr_0.85fr]`}
          >
            <div className="p-7 sm:p-10">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1.5 text-caption font-extrabold ${featuredStyle.badge}`}
                >
                  {featuredArticle.category}
                </span>
                <span className="text-caption font-bold text-pencil-gray">
                  {featuredArticle.readMinutes} минут
                </span>
              </div>
              <h3 className="max-w-[650px] font-feather text-[30px] font-black leading-tight text-charcoal sm:text-[38px]">
                {featuredArticle.title}
              </h3>
              <p className="mt-4 max-w-[650px] text-body font-medium text-pencil-gray">
                {featuredArticle.excerpt}
              </p>
              <span className="mt-7 inline-flex items-center gap-2 text-nav-label font-extrabold uppercase tracking-wide text-spark-blue">
                Читать статью <span aria-hidden>→</span>
              </span>
            </div>
            <div
              className={`flex min-h-[230px] items-center justify-center p-8 ${featuredStyle.panel}`}
              aria-hidden="true"
            >
              <div className="w-full max-w-[390px] rotate-[-2deg] rounded-2xl border-2 border-[#273455] bg-night-ink p-5 font-mono text-sm shadow-[0_18px_35px_rgba(0,4,55,0.22)]">
                <p className="text-[#ff5fa2]">SELECT name, arrival_time</p>
                <p className="mt-2 text-[#c5a8ff]">FROM stations</p>
                <p className="mt-2 text-[#f7c948]">WHERE arrival_time &gt;= &apos;02:30&apos;</p>
                <p className="mt-2 text-[#72d572]">ORDER BY arrival_time;</p>
              </div>
            </div>
          </Link>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 pb-20">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-caption font-extrabold uppercase tracking-wide text-eager-green">
                Продолжай изучение
              </p>
              <h2 className="mt-1 font-feather text-heading-sm font-black text-charcoal">
                Все статьи
              </h2>
            </div>
            <span className="text-caption font-bold text-pencil-gray">
              {ARTICLES.length} материала
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {articles.map((article) => {
              const style = accentStyles[article.accent];
              return (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className={`group flex min-h-[300px] flex-col rounded-[22px] border-2 border-[#e5e5e5] border-t-4 ${style.line} bg-paper-white p-7 transition hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(16,24,40,0.10)]`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1.5 text-caption font-extrabold ${style.badge}`}
                    >
                      {article.category}
                    </span>
                    <span className="font-mono text-lg font-black text-faded-gray">
                      {article.keyword}
                    </span>
                  </div>
                  <h3 className="mt-7 font-feather text-[27px] font-black leading-tight text-charcoal">
                    {article.title}
                  </h3>
                  <p className="mt-3 flex-1 text-body font-medium text-pencil-gray">
                    {article.excerpt}
                  </p>
                  <div className="mt-7 flex items-center justify-between border-t-2 border-[#e5e5e5] pt-5">
                    <span className="text-caption font-bold text-pencil-gray">
                      {article.level} · {article.readMinutes} минут
                    </span>
                    <span className="font-extrabold text-spark-blue transition-transform group-hover:translate-x-1">
                      Читать →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
