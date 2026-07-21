import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ResetPasswordForm } from "@/components/PasswordRecoveryForm";
export const metadata: Metadata = { title: "Новый пароль — Скрипткин" };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const { token } = await searchParams; return <><Header /><main className="flex-1"><div className="mx-auto max-w-[1200px] px-6 py-20"><h1 className="mb-4 text-center font-feather text-heading font-extrabold text-eager-green">новый пароль</h1><p className="mx-auto mb-10 max-w-[440px] text-center text-body font-medium text-pencil-gray">Придумай новый пароль. После сохранения вход на других устройствах будет завершён.</p><ResetPasswordForm token={token ?? ""} /></div></main><Footer /></>; }
