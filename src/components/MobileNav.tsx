"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const items: {
  href: string;
  label: string;
  icon: Icon;
  active: (pathname: string) => boolean;
}[] = [
  {
    href: "/",
    label: "Главная",
    icon: HomeIcon,
    active: (pathname) => pathname === "/",
  },
  {
    href: "/quests",
    label: "Квесты",
    icon: QuestIcon,
    active: (pathname) => pathname.startsWith("/quests"),
  },
  {
    href: "/practice",
    label: "Банк",
    icon: DatabaseIcon,
    active: (pathname) => pathname.startsWith("/practice"),
  },
  {
    href: "/community",
    label: "Лента",
    icon: CommunityIcon,
    active: (pathname) => pathname.startsWith("/community"),
  },
  {
    href: "/account",
    label: "Кабинет",
    icon: AccountIcon,
    active: (pathname) =>
      pathname.startsWith("/account") ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password" ||
      pathname === "/reset-password",
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Основная мобильная навигация"
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-[#e5e5e5] bg-paper-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid h-[68px] max-w-[560px] grid-cols-5 px-1.5">
        {items.map((item) => {
          const selected = item.active(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={selected ? "page" : undefined}
              className={`group flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors ${
                selected
                  ? "text-eager-green"
                  : "text-pencil-gray hover:bg-[#f5f6f7] hover:text-charcoal"
              }`}
            >
              <span
                className={`flex h-8 w-11 items-center justify-center rounded-xl transition-colors ${
                  selected ? "bg-storybook-green" : "bg-transparent"
                }`}
              >
                <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
              </span>
              <span className="max-w-full truncate text-[10px] font-extrabold leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function QuestIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22Z" />
    </svg>
  );
}

function DatabaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  );
}

function CommunityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.4-4.2A8.5 8.5 0 1 1 21 12Z" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" strokeWidth="3" />
    </svg>
  );
}

function AccountIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
