import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSectionHeader } from "@/components/AccountChrome";
import { AccountShell } from "@/components/AccountShell";
import { PostsManager } from "@/components/PostsManager";
import { getSessionUser } from "@/lib/auth";
import { getSocialDashboard } from "@/lib/social";

export const metadata: Metadata = { title: "Публикации — Скрипткин" };
export const dynamic = "force-dynamic";

export default async function AccountPostsPage() {
  const user = await getSessionUser(); if (!user) redirect("/login");
  const social = await getSocialDashboard(user.id);
  return <AccountShell><AccountSectionHeader title="Публикации" description="Рассказывай о прогрессе и читай посты друзей." /><PostsManager user={user} initialPosts={social.posts} /></AccountShell>;
}
