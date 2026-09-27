import type { Metadata } from "next";
import { CookieConsent } from "@/components/CookieConsent";
import { YandexMetrika } from "@/components/YandexMetrika";
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
} from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/site";
import "@fontsource/nunito/cyrillic-500.css";
import "@fontsource/nunito/latin-500.css";
import "@fontsource/nunito/cyrillic-700.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/cyrillic-800.css";
import "@fontsource/nunito/latin-800.css";
import "@fontsource/nunito/cyrillic-900.css";
import "@fontsource/nunito/latin-900.css";
import "@fontsource/cormorant-garamond/cyrillic-600.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import "@fontsource/cormorant-garamond/cyrillic-700.css";
import "@fontsource/cormorant-garamond/latin-700.css";
import "./globals.css";

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
  robots: {
    index: true,
    follow: true,
    noarchive: false,
    nosnippet: false,
    noimageindex: false,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
    googleBot: {
      index: true,
      follow: true,
      noarchive: false,
      nosnippet: false,
      noimageindex: false,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-120.png", sizes: "120x120", type: "image/png" },
    ],
    shortcut: "/favicon-120.png",
    apple: [{ url: "/logo.png", sizes: "500x500", type: "image/png" }],
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
        className="flex min-h-screen flex-col pb-[calc(68px+env(safe-area-inset-bottom))] antialiased md:pb-0"
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
