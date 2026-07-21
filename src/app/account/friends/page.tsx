import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AccountSectionHeader } from "@/components/AccountChrome";
import { FriendsManager } from "@/components/FriendsManager";
import { getSessionUser } from "@/lib/auth";
import { getSocialDashboard } from "@/lib/social";

export const metadata: Metadata = { title: "Друзья — Скрипткин" };
export const dynamic = "force-dynamic";

export default async function AccountFriendsPage() {
  const user = await getSessionUser(); if (!user) redirect("/login");
  const social = await getSocialDashboard(user.id);
  return <><Header /><main className="flex-1 bg-[#f7f8fa]"><div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6"><AccountSectionHeader title="Друзья" description="Ищи пользователей, принимай заявки и следи за прогрессом друг друга." /><FriendsManager initialSocial={social} /></div></main><Footer /></>;
}
