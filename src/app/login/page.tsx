import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Вход — Скрипткин",
};

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h1 className="mb-4 text-center font-feather text-heading font-extrabold text-eager-green">
            с возвращением
          </h1>
          <p className="mx-auto mb-10 max-w-[400px] text-center text-body font-medium text-pencil-gray">
            Экипаж всё ещё ждёт. Войди, чтобы продолжить с того шага, где
            остановился.
          </p>
          <AuthForm mode="login" />
        </div>
      </main>
      <Footer />
    </>
  );
}
