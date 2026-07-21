import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AccountDashboard } from "@/components/AccountDashboard";
import { getSessionUser } from "@/lib/auth";
import {
  calculateQuestStats,
  getAccountProgress,
  getAvailableQuestsCount,
} from "@/lib/account";
import { getSocialDashboard, type SocialDashboardData } from "@/lib/social";

export const metadata: Metadata = {
  title: "Личный кабинет — Скрипткин",
  description:
    "Прогресс в SQL, календарь активности, друзья и публикации пользователя Скрипткина.",
};

export const dynamic = "force-dynamic";

const EMPTY_SOCIAL: SocialDashboardData = {
  friends: [],
  requests: [],
  posts: [],
  activity: [],
};

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [progress, availableQuests, social] = await Promise.all([
    getAccountProgress(user.id),
    getAvailableQuestsCount(),
    getSocialDashboard(user.id).catch((error) => {
      console.error("Failed to load social account data:", error);
      return EMPTY_SOCIAL;
    }),
  ]);

  const { completedQuests, solvedSteps } = calculateQuestStats(progress);

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#f7f8fa]">
        <AccountDashboard
          user={user}
          progress={progress}
          stats={{ completedQuests, solvedSteps, availableQuests }}
          initialSocial={social}
        />
      </main>
      <Footer />
    </>
  );
}
