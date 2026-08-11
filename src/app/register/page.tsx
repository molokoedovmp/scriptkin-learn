import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthForm } from "@/components/AuthForm";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Регистрация — Скрипткин",
  robots: PRIVATE_ROBOTS,
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
            После регистрации подтверди email по ссылке из письма. Затем
            прогресс по историям будет сохраняться на всех устройствах.
          </p>
          <AuthForm mode="register" />
        </div>
      </main>
      <Footer />
    </>
  );
}
