import type { Metadata } from "next";
import { Cormorant_Garamond, Nunito } from "next/font/google";
import { CookieConsent } from "@/components/CookieConsent";
import { YandexMetrika } from "@/components/YandexMetrika";
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
} from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/site";
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

const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem("skriptkin-theme");
    var dark = saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  } catch (_) {}
})();`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Скрипткин — учи SQL, проходя истории",
  description:
    "Скрипткин — интерактивная платформа для обучения SQL: выбирай историю с сюжетом и продвигай её настоящими SQL-запросами прямо в браузере.",
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
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${nunito.variable} ${cormorant.variable} flex min-h-screen flex-col pb-[calc(68px+env(safe-area-inset-bottom))] antialiased md:pb-0`}
      >
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        {children}
        <YandexMetrika />
        <CookieConsent />
      </body>
    </html>
  );
}
