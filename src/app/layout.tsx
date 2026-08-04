import type { Metadata } from "next";
import { Cormorant_Garamond, Nunito } from "next/font/google";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-nunito",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Скрипткин — учи SQL, проходя квесты",
  description:
    "Скрипткин — интерактивная платформа для обучения SQL: выбирай квест с сюжетом и продвигай историю настоящими SQL-запросами прямо в браузере.",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${nunito.variable} ${cormorant.variable} flex min-h-screen flex-col pb-[calc(68px+env(safe-area-inset-bottom))] antialiased md:pb-0`}
      >
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
