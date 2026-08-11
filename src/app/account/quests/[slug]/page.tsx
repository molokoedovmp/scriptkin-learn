import type { Metadata } from "next";
import { AccountQuestWorkspace } from "@/components/AccountQuestWorkspace";
import { getDemoQuest } from "@/lib/quests";

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
  };
}

export default async function AccountQuestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AccountQuestWorkspace slug={slug} />;
}

