import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AccountSectionHeader } from "@/components/AccountChrome";
import { PostsManager } from "@/components/PostsManager";
import { getSessionUser } from "@/lib/auth";
import { getSocialDashboard } from "@/lib/social";

export const metadata: Metadata = { title: "Публикации — Скрипткин" };
export const dynamic = "force-dynamic";

export default async function AccountPostsPage() {
  const user = await getSessionUser(); if (!user) redirect("/login");
  const social = await getSocialDashboard(user.id);
  return <><Header /><main className="flex-1 bg-[#f7f8fa]"><div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6"><AccountSectionHeader title="Публикации" description="Рассказывай о прогрессе и читай посты друзей." /><PostsManager user={user} initialPosts={social.posts} /></div></main><Footer /></>;
}
