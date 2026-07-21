import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ForgotPasswordForm } from "@/components/PasswordRecoveryForm";
export const metadata: Metadata = { title: "Восстановление пароля — Скрипткин" };
export default function ForgotPasswordPage() { return <><Header /><main className="flex-1"><div className="mx-auto max-w-[1200px] px-6 py-20"><h1 className="mb-4 text-center font-feather text-heading font-extrabold text-eager-green">восстановить пароль</h1><p className="mx-auto mb-10 max-w-[460px] text-center text-body font-medium text-pencil-gray">Укажи email аккаунта. Мы отправим одноразовую ссылку, которая действует один час.</p><ForgotPasswordForm /></div></main><Footer /></>; }
