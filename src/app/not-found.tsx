import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-6 py-24 text-center">
          <h1 className="mb-6 font-feather text-heading font-extrabold text-eager-green">
            404: строка не найдена
          </h1>
          <p className="mx-auto mb-8 max-w-[480px] text-body font-medium text-pencil-gray">
            Запрос вернул пустой результат. Похоже, такой страницы нет — но
            квесты на месте.
          </p>
          <Button href="/quests">К квестам</Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
