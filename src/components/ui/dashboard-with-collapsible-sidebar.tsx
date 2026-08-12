"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import {
  Activity,
  BookOpen,
  ChevronLeft,
  CreditCard,
  Database,
  FilePenLine,
  Home,
  House,
  LibraryBig,
  LogOut,
  Moon,
  MessageCircle,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import type { SessionUser } from "@/lib/types";
import { UserAvatar } from "@/components/UserAvatar";

const THEME_STORAGE_KEY = "skriptkin-theme";

type SidebarIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

type SidebarLink = {
  href: string;
  label: string;
  icon: SidebarIcon;
  exact?: boolean;
  alsoMatches?: string[];
};

const MAIN_LINKS: SidebarLink[] = [
  { href: "/account", label: "Обзор", icon: Home, exact: true },
  { href: "/account/quests", label: "Мои истории", icon: BookOpen },
  { href: "/account/payments", label: "Покупки и оплаты", icon: CreditCard },
  { href: "/account/activity", label: "Активность", icon: Activity },
  {
    href: "/account/friends",
    label: "Друзья",
    icon: Users,
    alsoMatches: ["/account/users"],
  },
  { href: "/account/posts", label: "Публикации", icon: FilePenLine },
  { href: "/account/community", label: "Сообщество", icon: MessageCircle },
];

const ACCOUNT_LINKS: SidebarLink[] = [
  { href: "/account/profile", label: "Настройки профиля", icon: Settings },
  { href: "/quests", label: "Все истории", icon: LibraryBig },
  { href: "/account/practice", label: "Банк заданий", icon: Database },
  { href: "/", label: "На главную", icon: House },
];

export function AccountCollapsibleSidebar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [dark, setDark] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    localStorage.setItem(THEME_STORAGE_KEY, nextDark ? "dark" : "light");
    setDark(nextDark);
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside
      className={`account-dashboard-sidebar sticky top-0 z-40 flex h-dvh shrink-0 flex-col border-r transition-[width] duration-300 ease-in-out ${
        open ? "w-[76px] lg:w-64" : "w-[76px]"
      }`}
    >
      <div className="flex h-[76px] shrink-0 items-center border-b px-[17px]">
        <Link
          href="/account"
          aria-label={`${user?.name ?? "Пользователь"} — личный кабинет`}
          className="flex min-w-0 items-center gap-3 rounded-xl"
        >
          {user ? (
            <UserAvatar user={user} className="h-10 w-10 border border-eager-green shadow-[0_3px_0_#2f8500]" />
          ) : (
            <span className="grid h-10 w-10 shrink-0 place-content-center rounded-xl bg-eager-green font-black text-white">?</span>
          )}
          <span
            className={`hidden min-w-0 transition-opacity lg:block ${
              open ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <span className="block truncate text-[17px] font-black leading-tight text-charcoal">
              {user?.name ?? "Пользователь"}
            </span>
            <span className="block max-w-[150px] truncate text-[10px] font-bold text-pencil-gray">
              {user?.email ?? "Личный кабинет"}
            </span>
          </span>
        </Link>
      </div>

      <nav
        aria-label="Разделы личного кабинета"
        className="account-dashboard-nav min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-5"
      >
        <SidebarGroup links={MAIN_LINKS} pathname={pathname} open={open} />

        <div className="my-5 border-t" />
        <p
          className={`mb-2 hidden px-3 text-[10px] font-black uppercase tracking-[0.14em] text-faded-gray lg:block ${
            open ? "opacity-100" : "opacity-0"
          }`}
        >
          Аккаунт
        </p>
        <SidebarGroup links={ACCOUNT_LINKS} pathname={pathname} open={open} />
      </nav>

      <div className="shrink-0 space-y-1 border-t p-3">
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          aria-label={loggingOut ? "Выполняется выход" : "Выйти из аккаунта"}
          className="account-dashboard-sidebar-action flex h-11 w-full items-center rounded-xl text-pencil-gray transition-colors disabled:cursor-wait disabled:opacity-60"
        >
          <span className="grid h-11 w-12 shrink-0 place-content-center">
            <LogOut className="h-[19px] w-[19px]" />
          </span>
          <span className={`hidden whitespace-nowrap text-[13px] font-extrabold lg:block ${open ? "opacity-100" : "opacity-0"}`}>
            {loggingOut ? "Выходим…" : "Выйти"}
          </span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"}
          className="account-dashboard-sidebar-action flex h-11 w-full items-center rounded-xl text-pencil-gray transition-colors"
        >
          <span className="grid h-11 w-12 shrink-0 place-content-center">
            {dark ? <Sun className="h-[19px] w-[19px]" /> : <Moon className="h-[19px] w-[19px]" />}
          </span>
          <span className={`hidden whitespace-nowrap text-[13px] font-extrabold lg:block ${open ? "opacity-100" : "opacity-0"}`}>
            {dark ? "Светлая тема" : "Тёмная тема"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Свернуть боковое меню" : "Развернуть боковое меню"}
          className="account-dashboard-sidebar-action hidden h-11 w-full items-center rounded-xl text-pencil-gray transition-colors lg:flex"
        >
          <span className="grid h-11 w-12 shrink-0 place-content-center">
            <ChevronLeft
              className={`h-[19px] w-[19px] transition-transform duration-300 ${open ? "" : "rotate-180"}`}
            />
          </span>
          <span className={`whitespace-nowrap text-[13px] font-extrabold ${open ? "opacity-100" : "opacity-0"}`}>
            Свернуть меню
          </span>
        </button>
      </div>
    </aside>
  );
}

function SidebarGroup({
  links,
  pathname,
  open,
}: {
  links: SidebarLink[];
  pathname: string;
  open: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {links.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href ||
            pathname.startsWith(`${item.href}/`) ||
            item.alsoMatches?.some(
              (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
            );
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            title={!open ? item.label : undefined}
            aria-current={active ? "page" : undefined}
            className={`account-dashboard-sidebar-link group relative flex h-11 items-center rounded-xl border border-transparent transition-colors ${
              active ? "is-active" : ""
            }`}
          >
            <span className="grid h-11 w-12 shrink-0 place-content-center">
              <Icon className="h-[19px] w-[19px]" strokeWidth={2.25} />
            </span>
            <span
              className={`hidden whitespace-nowrap pr-3 text-[13px] font-extrabold transition-opacity lg:block ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
