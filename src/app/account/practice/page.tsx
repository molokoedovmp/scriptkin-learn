import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/AccountShell";
import { PracticeCatalog } from "@/components/PracticeCatalog";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Банк заданий — личный кабинет",
};

export default async function AccountPracticePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?returnTo=/account/practice");

  return (
    <AccountShell>
      <PracticeCatalog basePath="/account/practice" embedded />
    </AccountShell>
  );
}
