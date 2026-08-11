import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSectionHeader } from "@/components/AccountChrome";
import { AccountShell } from "@/components/AccountShell";
import { FriendsManager } from "@/components/FriendsManager";
import { getSessionUser } from "@/lib/auth";
import { getSocialDashboard } from "@/lib/social";

export const metadata: Metadata = { title: "Друзья — Скрипткин" };
export const dynamic = "force-dynamic";

export default async function AccountFriendsPage() {
  const user = await getSessionUser(); if (!user) redirect("/login");
  const social = await getSocialDashboard(user.id);
  return <AccountShell><AccountSectionHeader title="Друзья" description="Ищи пользователей, принимай заявки и следи за прогрессом друг друга." /><FriendsManager initialSocial={social} /></AccountShell>;
}
