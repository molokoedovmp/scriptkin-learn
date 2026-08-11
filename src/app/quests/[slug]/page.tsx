import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDemoQuest } from "@/lib/quests";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quest = getDemoQuest(slug);

  return {
    title: quest
      ? `${quest.title} — Скрипткин`
      : "История не найдена — Скрипткин",
    robots: PRIVATE_ROBOTS,
  };
}

export default async function LegacyQuestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/account/quests/${slug}`);
}
