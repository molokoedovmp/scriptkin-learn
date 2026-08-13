import Image from "next/image";
import Link from "next/link";
import { getPracticeDatabases } from "@/lib/practice";
import { Breadcrumbs } from "./Breadcrumbs";

export function PracticeCatalog({
  basePath,
  embedded = false,
}: {
  basePath: string;
  embedded?: boolean;
}) {
  const databases = getPracticeDatabases();

  return (
    <section
      className={
        embedded
          ? "w-full"
          : "mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-14"
      }
    >
      {!embedded && (
        <Breadcrumbs
          className="mb-7"
          items={[
            { name: "Главная", path: "/" },
            { name: "Задачи по SQL", path: "/practice" },
          ]}
        />
      )}
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-caption font-extrabold uppercase tracking-[0.12em] text-spark-blue">
            Свободная практика
          </p>
          <h1 className="mb-4 font-feather text-heading-sm font-extrabold text-eager-green sm:text-heading">
            задачи по SQL для практики
          </h1>
          <p className="max-w-[650px] text-body font-medium text-pencil-gray">
            Выбирай базу из истории и решай задачи в своём темпе. Здесь нет
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
              Базы
            </p>
          </div>
          <div className="border-l-2 border-[#e5e5e5] pl-6">
            <p className="text-heading-sm font-extrabold text-charcoal">
              {databases.reduce(
                (sum, database) => sum + database.tasks.length,
                0
              )}
            </p>
            <p className="text-caption font-bold uppercase text-faded-gray">
              Заданий
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {databases.map((database, index) => {
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
              href={`${basePath}/${database.questSlug}`}
              className="group overflow-hidden rounded-xl border-2 border-[#e5e5e5] bg-paper-white transition-colors hover:border-eager-green"
            >
              {database.previewUrl ? (
                <span className="relative block aspect-video overflow-hidden border-b-2 border-[#e5e5e5]">
                <Image
                  src={database.previewUrl}
                  alt={`Обложка базы заданий «${database.title}»`}
                  fill
                  sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw"
                  unoptimized
                  priority={index < 3}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                </span>
              ) : (
                <div className="flex aspect-video items-center justify-center border-b-2 border-[#e5e5e5] bg-night-ink text-7xl">
                  {database.emoji}
                </div>
              )}
              <div className="p-6">
                <p className="mb-2 text-caption font-extrabold uppercase tracking-wide text-spark-blue">
                  База из истории
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
                    {database.tables.length} таблиц · {database.tasks.length}{" "}
                    заданий
                  </span>
                  <span className="text-nav-label font-extrabold uppercase text-eager-green transition-transform group-hover:translate-x-1">
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
          Новые базы появятся вместе с историями
        </p>
        <p className="mt-1 text-[15px] font-medium text-pencil-gray">
          База «Крушения подлодки» уже доступна. Следующими появятся
          «Ограбление галереи» и «Арес-9».
        </p>
      </div>
    </section>
  );
}
