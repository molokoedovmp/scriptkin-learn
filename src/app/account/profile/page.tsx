import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSectionHeader } from "@/components/AccountChrome";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProfileEditorForm } from "@/components/ProfileEditorForm";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Редактирование профиля — Скрипткин" };
export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#f7f8fa]">
        <div className="mx-auto max-w-[1000px] px-4 py-10 sm:px-6">
          <AccountSectionHeader title="Редактирование профиля" description="Измени имя и добавь короткое описание о себе." />
          <ProfileEditorForm user={user} />
        </div>
      </main>
      <Footer />
    </>
  );
}
