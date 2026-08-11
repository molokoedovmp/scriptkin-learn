import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSectionHeader } from "@/components/AccountChrome";
import { AccountShell } from "@/components/AccountShell";
import { ProfileEditorForm } from "@/components/ProfileEditorForm";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Редактирование профиля — Скрипткин" };
export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <AccountShell>
          <AccountSectionHeader title="Редактирование профиля" description="Измени имя и добавь короткое описание о себе." />
          <ProfileEditorForm user={user} />
    </AccountShell>
  );
}
