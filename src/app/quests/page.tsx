import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QuestCard } from "@/components/QuestCard";
import { DEMO_QUESTS } from "@/lib/quests";

export const metadata: Metadata = {
  title: "Квесты — Скрипткин",
  description: "Каталог SQL-квестов: выбери историю и уровень сложности.",
};

export default function QuestsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-6 py-16">
          <h1 className="mb-4 font-feather text-heading font-extrabold text-eager-green">
            квесты
          </h1>
          <p className="mb-12 max-w-[480px] text-body font-medium text-pencil-gray">
            Каждый квест — законченная история со своей базой данных.
            Сложность растёт вместе с сюжетом: от простых SELECT до оконных
            функций.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {DEMO_QUESTS.map((quest) => (
              <QuestCard key={quest.slug} quest={quest} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
