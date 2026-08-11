import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountDashboard } from "@/components/AccountDashboard";
import { AccountShell } from "@/components/AccountShell";
import { getSessionUser } from "@/lib/auth";
import { getAccountProgress } from "@/lib/account";
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

  const [progress, social] = await Promise.all([
    getAccountProgress(user.id),
    getSocialDashboard(user.id).catch((error) => {
      console.error("Failed to load social account data:", error);
      return EMPTY_SOCIAL;
    }),
  ]);

  return (
    <AccountShell>
      <AccountDashboard
        user={user}
        progress={progress}
        initialSocial={social}
      />
    </AccountShell>
  );
}
