import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Регистрация — Скрипткин",
};

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h1 className="mb-4 text-center font-feather text-heading font-extrabold text-eager-green">
            создай аккаунт
          </h1>
          <p className="mx-auto mb-10 max-w-[400px] text-center text-body font-medium text-pencil-gray">
            Аккаунт сохраняет прогресс по квестам — сможешь вернуться к
            истории с любого устройства.
          </p>
          <AuthForm mode="register" />
        </div>
      </main>
      <Footer />
    </>
  );
}
