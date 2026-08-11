import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PracticeWorkspace } from "@/components/PracticeWorkspace";
import { getPracticeDatabase, getPracticeDatabases } from "@/lib/practice";

export function generateStaticParams() {
  return getPracticeDatabases().map((database) => ({
    slug: database.questSlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const database = getPracticeDatabase(slug);

  if (!database) {
    return {
      title: "База заданий не найдена — Скрипткин",
      description:
        "Запрошенная учебная база SQL не найдена. Выберите доступную базу в банке заданий Скрипткина.",
    };
  }

  return {
    title: `Практика SQL на базе «${database.title}» — Скрипткин`,
    description: `Решайте ${database.tasks.length} задач по SQL на базе «${database.title}»: ${database.tables.length} связанных таблиц, три уровня сложности, подсказки и проверка запросов онлайн.`,
    alternates: { canonical: `/practice/${database.questSlug}` },
  };
}

export default async function PracticeDatabasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const database = getPracticeDatabase(slug);
  if (!database) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#fbfbfb]">
        <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
          <Breadcrumbs
            className="mb-5"
            items={[
              { name: "Главная", path: "/" },
              { name: "Задачи по SQL", path: "/practice" },
              {
                name: `Практика SQL на базе «${database.title}»`,
                path: `/practice/${database.questSlug}`,
              },
            ]}
          />
          <Link
            href="/practice"
            className="mb-6 inline-flex items-center gap-2 text-nav-label font-extrabold uppercase text-spark-blue hover:underline"
          >
            ← Все базы
          </Link>
          <PracticeWorkspace databases={[database]} />
        </section>
      </main>
      <Footer />
    </>
  );
}
