import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { AuthPageShell } from "@/components/AuthPageShell";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = { title: "Вход — Скрипткин", robots: PRIVATE_ROBOTS };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; oauthError?: string }> }) {
  const { returnTo, oauthError } = await searchParams;
  return <AuthPageShell mode="login"><AuthForm mode="login" returnTo={returnTo} oauthError={oauthError} /></AuthPageShell>;
}
