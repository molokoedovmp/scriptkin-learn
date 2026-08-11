import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PracticeCatalog } from "@/components/PracticeCatalog";

export const metadata: Metadata = {
  title: "Задачи по SQL с проверкой решений — Скрипткин",
  description:
    "Решайте задачи по SQL разной сложности на учебных базах: встроенный PostgreSQL-редактор, подсказки, готовые решения и автоматическая проверка.",
  alternates: { canonical: "/practice" },
};

export default function PracticePage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#fbfbfb]">
        <PracticeCatalog basePath="/practice" />
      </main>
      <Footer />
    </>
  );
}
