import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getPracticeDatabases } from "@/lib/practice";

export const metadata: Metadata = {
  title: "Банк заданий по SQL — Скрипткин",
  description:
    "Тренируй SQL на базах данных из квестов: задания разных уровней, настоящая PostgreSQL-песочница и автоматическая проверка.",
};

export default function PracticePage() {
  const databases = getPracticeDatabases();

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#fbfbfb]">
        <section className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-caption font-extrabold uppercase tracking-[0.12em] text-spark-blue">
                Свободная практика
              </p>
              <h1 className="mb-4 font-feather text-heading-sm font-extrabold text-eager-green sm:text-heading">
                банк заданий
              </h1>
              <p className="max-w-[650px] text-body font-medium text-pencil-gray">
                Выбирай базу из квеста и решай задачи в своём темпе. Здесь нет
                сюжетных блокировок: можно сразу перейти к JOIN, агрегатам или
                оконным функциям.
              </p>
            </div>
            <div className="flex shrink-0 gap-6 rounded-xl border-2 border-[#e5e5e5] bg-paper-white px-5 py-4">
              <div>
                <p className="text-heading-sm font-extrabold text-charcoal">
                  {databases.length}
                </p>
                <p className="text-caption font-bold uppercase text-faded-gray">
                  База
                </p>
              </div>
              <div className="border-l-2 border-[#e5e5e5] pl-6">
                <p className="text-heading-sm font-extrabold text-charcoal">
                  {databases.reduce((sum, database) => sum + database.tasks.length, 0)}
                </p>
                <p className="text-caption font-bold uppercase text-faded-gray">
                  Заданий
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {databases.map((database) => {
              const easy = database.tasks.filter(
                (task) => task.difficulty === "easy"
              ).length;
              const medium = database.tasks.filter(
                (task) => task.difficulty === "medium"
              ).length;
              const hard = database.tasks.filter(
                (task) => task.difficulty === "hard"
              ).length;

              return (
                <Link
                  key={database.questSlug}
                  href={`/practice/${database.questSlug}`}
                  className="group overflow-hidden rounded-xl border-2 border-[#e5e5e5] bg-paper-white transition-colors hover:border-eager-green"
                >
                  <div className="flex aspect-[2/1] items-center justify-center border-b-2 border-[#e5e5e5] bg-night-ink text-7xl">
                    {database.emoji}
                  </div>
                  <div className="p-6">
                    <p className="mb-2 text-caption font-extrabold uppercase tracking-wide text-spark-blue">
                      База из квеста
                    </p>
                    <h2 className="mb-3 text-subheading font-extrabold text-charcoal">
                      {database.title}
                    </h2>
                    <p className="mb-5 text-[15px] font-medium leading-relaxed text-pencil-gray">
                      {database.description}
                    </p>
                    <div className="mb-5 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#efffdf] px-3 py-1 text-caption font-bold text-[#3f9900]">
                        {easy} легко
                      </span>
                      <span className="rounded-full bg-[#e8f7ff] px-3 py-1 text-caption font-bold text-[#0784bf]">
                        {medium} средне
                      </span>
                      <span className="rounded-full bg-[#eeeff8] px-3 py-1 text-caption font-bold text-night-ink">
                        {hard} сложно
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t-2 border-[#ededed] pt-4">
                      <span className="text-caption font-bold uppercase text-faded-gray">
                        {database.tables.length} таблиц · {database.tasks.length} заданий
                      </span>
                      <span className="text-nav-label font-extrabold uppercase text-eager-green group-hover:translate-x-1 transition-transform">
                        Открыть →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 rounded-xl border-2 border-dashed border-[#d9d9d9] bg-paper-white p-6 text-center">
            <p className="text-body font-extrabold text-charcoal">
              Новые базы появятся вместе с квестами
            </p>
            <p className="mt-1 text-[15px] font-medium text-pencil-gray">
              «Крушение подлодки», «Ограбление галереи» и «Арес-9» уже в плане.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
