import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSectionHeader } from "@/components/AccountChrome";
import { AccountPaymentsView } from "@/components/AccountPaymentsView";
import { AccountShell } from "@/components/AccountShell";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getAccountPayments } from "@/lib/account";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Покупки и оплаты — Скрипткин",
  description: "История покупок SQL-историй, платежей, чеков и возвратов.",
};

export const dynamic = "force-dynamic";

export default async function AccountPaymentsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const payments = await getAccountPayments(user.id);

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#f7f8fa]">
        <AccountShell>
          <AccountSectionHeader
            title="Покупки и оплаты"
            description="Купленные истории, история операций, электронные чеки и возвраты в одном месте."
          />
          <AccountPaymentsView payments={payments} />
        </AccountShell>
      </main>
      <Footer />
    </>
  );
}
