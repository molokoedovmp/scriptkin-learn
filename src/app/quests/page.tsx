import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QuestCard } from "@/components/QuestCard";
import { DEMO_QUESTS } from "@/lib/quests";

export const metadata: Metadata = {
  title: "Истории — Скрипткин",
  description: "Каталог SQL-историй: выбери сюжет и уровень сложности.",
};

export default function QuestsPage() {
  const orderedQuests = [...DEMO_QUESTS].sort((first, second) => {
    if (first.status === second.status) return 0;
    return first.status === "available" ? -1 : 1;
  });

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-6 py-16">
          <h1 className="mb-4 font-feather text-heading font-extrabold text-eager-green">
            истории
          </h1>
          <p className="mb-12 max-w-[480px] text-body font-medium text-pencil-gray">
            Каждая история — законченный сюжет со своей базой данных.
            Сложность растёт вместе с сюжетом: от простых SELECT до оконных
            функций.
          </p>
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {orderedQuests.map((quest) => (
              <QuestCard key={quest.slug} quest={quest} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
