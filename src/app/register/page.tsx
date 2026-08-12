import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { AuthPageShell } from "@/components/AuthPageShell";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = { title: "Регистрация — Скрипткин", robots: PRIVATE_ROBOTS };

export default function RegisterPage() {
  return <AuthPageShell mode="register"><AuthForm mode="register" /></AuthPageShell>;
}
