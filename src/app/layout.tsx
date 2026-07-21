import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Скрипткин — учи SQL, проходя квесты",
  description:
    "Скрипткин — интерактивная платформа для обучения SQL: выбирай квест с сюжетом и продвигай историю настоящими SQL-запросами прямо в браузере.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${nunito.variable} flex min-h-screen flex-col pb-[calc(68px+env(safe-area-inset-bottom))] antialiased md:pb-0`}
      >
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
