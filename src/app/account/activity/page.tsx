import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AccountSectionHeader } from "@/components/AccountChrome";
import { AccountActivityView } from "@/components/AccountActivityView";
import { getSessionUser } from "@/lib/auth";
import { getSocialDashboard } from "@/lib/social";

export const metadata: Metadata = { title: "Моя активность — Скрипткин" };
export const dynamic = "force-dynamic";

export default async function AccountActivityPage() {
  const user = await getSessionUser(); if (!user) redirect("/login");
  const social = await getSocialDashboard(user.id);
  return <><Header /><main className="flex-1 bg-[#f7f8fa]"><div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6"><AccountSectionHeader title="Активность" description="Календарь занятий в стиле GitHub: шаги квестов и решённые упражнения за каждый день." /><AccountActivityView activity={social.activity} /></div></main><Footer /></>;
}
