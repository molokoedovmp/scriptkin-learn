import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RichText } from "@/components/RichText";
import {
  ArticleJsonLd,
} from "@/components/seo/JsonLd";
import { ARTICLES, getArticleBySlug } from "@/lib/articles";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) return {};

  return {
    title: article.seoTitle ?? `${article.title} — Скрипткин`,
    description: article.seoDescription ?? article.excerpt,
    alternates: {
      canonical: `/articles/${article.slug}`,
    },
    openGraph: {
      type: "article",
      locale: "ru_RU",
      siteName: "Скрипткин",
      title: article.seoTitle ?? article.title,
      description: article.seoDescription ?? article.excerpt,
      url: `/articles/${article.slug}`,
      publishedTime: article.publishedIso,
      modifiedTime: article.modifiedIso,
      authors: ["Скрипткин"],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

  return (
    <>
      <ArticleJsonLd
        title={article.title}
        description={article.seoDescription ?? article.excerpt}
        path={`/articles/${article.slug}`}
        published={article.publishedIso!}
        section={article.category}
      />
      <Header />
      <main className="flex-1">
        <article>
          <header className="border-b-2 border-[#e5e5e5] bg-[#f7f8fa]">
            <div className="mx-auto max-w-[900px] px-6 py-12 sm:py-16">
              <Breadcrumbs
                className="mb-6"
                items={[
                  { name: "Главная", path: "/" },
                  { name: "Статьи о SQL", path: "/articles" },
                  { name: article.title, path: `/articles/${article.slug}` },
                ]}
              />
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 text-nav-label font-extrabold uppercase tracking-wide text-spark-blue hover:text-eager-green"
              >
                ← Все статьи
              </Link>
              <div className="mt-7 flex flex-wrap items-center gap-3 text-caption font-bold">
                <span className="rounded-full bg-storybook-green px-3 py-1.5 text-[#3f9900]">
                  {article.category}
                </span>
                <span className="text-pencil-gray">{article.level}</span>
                <span className="text-faded-gray" aria-hidden>
                  •
                </span>
                <span className="text-pencil-gray">
                  {article.readMinutes} минут чтения
                </span>
              </div>
              <h1 className="mt-5 font-feather text-[38px] font-black leading-[1.08] text-charcoal sm:text-heading">
                {article.title}
              </h1>
              <p className="mt-5 max-w-[760px] text-body font-medium text-pencil-gray">
                {article.excerpt}
              </p>
              <p className="mt-6 text-caption font-bold text-faded-gray">
                Опубликовано {article.publishedAt}
              </p>
            </div>
          </header>

          <div className="mx-auto max-w-[900px] px-6 py-12 sm:py-16">
            <div className="grid gap-10">
              {article.sections.map((section, index) => (
                <section key={section.heading}>
                  <div className="mb-4 flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-storybook-green text-caption font-black text-[#3f9900]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h2 className="pt-0.5 font-feather text-[27px] font-black leading-tight text-charcoal sm:text-heading-sm">
                      {section.heading}
                    </h2>
                  </div>
                  <div className="pl-0 sm:pl-[52px]">
                    <RichText
                      text={section.content}
                      className="text-body font-medium leading-relaxed text-pencil-gray"
                    />
                  </div>
                </section>
              ))}
            </div>

            <aside className="mt-14 rounded-[22px] border-2 border-eager-green bg-[#efffdf] p-7 sm:flex sm:items-center sm:justify-between sm:gap-8">
              <div>
                <p className="text-caption font-extrabold uppercase tracking-wide text-[#3f9900]">
                  Закрепи материал
                </p>
                <h2 className="mt-2 font-feather text-[26px] font-black text-charcoal">
                  Попробуй написать запрос самостоятельно
                </h2>
                <p className="mt-2 text-body font-medium text-pencil-gray">
                  В банке заданий можно тренироваться на базах из историй.
                </p>
              </div>
              <Link
                href="/practice"
                className="mt-5 inline-flex shrink-0 rounded-xl bg-eager-green px-6 py-3.5 text-nav-label font-extrabold uppercase text-[#173a05] shadow-[0_4px_0_#3f9900] transition hover:translate-y-0.5 hover:shadow-[0_2px_0_#3f9900] sm:mt-0"
              >
                В банк заданий
              </Link>
            </aside>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
