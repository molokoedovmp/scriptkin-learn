import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  return {
    title: database
      ? `${database.title}: практика SQL — Скрипткин`
      : "База не найдена — Скрипткин",
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
