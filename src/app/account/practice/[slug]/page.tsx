import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AccountShell } from "@/components/AccountShell";
import { PracticeWorkspace } from "@/components/PracticeWorkspace";
import { getSessionUser } from "@/lib/auth";
import { getPracticeDatabase } from "@/lib/practice";

export const metadata: Metadata = {
  title: "Практика SQL — личный кабинет",
};

export default async function AccountPracticeDatabasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?returnTo=/account/practice");

  const { slug } = await params;
  const database = getPracticeDatabase(slug);
  if (!database) notFound();

  return (
    <AccountShell>
      <Link
        href="/account/practice"
        className="mb-6 inline-flex items-center gap-2 text-nav-label font-extrabold uppercase text-spark-blue hover:underline"
      >
        ← Все базы
      </Link>
      <PracticeWorkspace databases={[database]} />
    </AccountShell>
  );
}
