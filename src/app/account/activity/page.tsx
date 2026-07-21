import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AccountSectionHeader } from "@/components/AccountChrome";
import { AccountActivityView } from "@/components/AccountActivityView";
import { AccountFriendsSummary } from "@/components/AccountFriendsSummary";
import { getSessionUser } from "@/lib/auth";
import { getSocialDashboard } from "@/lib/social";

export const metadata: Metadata = { title: "Моя активность — Скрипткин" };
export const dynamic = "force-dynamic";

export default async function AccountActivityPage() {
  const user = await getSessionUser(); if (!user) redirect("/login");
  const social = await getSocialDashboard(user.id);
  return <><Header /><main className="min-w-0 flex-1 bg-[#f7f8fa]"><div className="mx-auto min-w-0 max-w-[1200px] px-4 py-10 sm:px-6"><AccountSectionHeader title="Активность" description="Календарь занятий в стиле GitHub: шаги квестов и решённые упражнения за каждый день." /><div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(230px,1fr)]"><div className="min-w-0"><AccountActivityView activity={social.activity} /></div><AccountFriendsSummary friends={social.friends} requests={social.requests} /></div></div></main><Footer /></>;
}
