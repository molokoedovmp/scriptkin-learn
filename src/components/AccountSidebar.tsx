"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ACCOUNT_LINKS = [
  { href: "/account", label: "Обзор", icon: "⌂", exact: true },
  { href: "/account/quests", label: "Мои истории", icon: "▤" },
  { href: "/account/payments", label: "Покупки и оплаты", icon: "₽" },
  { href: "/account/activity", label: "Активность", icon: "⌁" },
  { href: "/account/friends", label: "Друзья", icon: "☺" },
  { href: "/account/posts", label: "Публикации", icon: "✎" },
  { href: "/account/profile", label: "Настройки профиля", icon: "⚙" },
] as const;

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="account-sidebar self-start overflow-hidden rounded-[20px] border-2 border-[#e1e3e8] bg-paper-white lg:sticky lg:top-[88px]">
      <div className="account-sidebar-header border-b-2 border-[#ececef] px-5 py-4">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-eager-green">
          Личный кабинет
        </p>
        <p className="mt-1 text-[15px] font-black text-charcoal">
          Управление аккаунтом
        </p>
      </div>

      <nav
        aria-label="Разделы личного кабинета"
        className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-1"
      >
        {ACCOUNT_LINKS.map((item) => {
          const active = "exact" in item && item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`account-sidebar-link group flex min-h-12 items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-[13px] font-extrabold transition-colors sm:px-4 ${
                active
                  ? "is-active bg-eager-green text-paper-white shadow-[inset_4px_0_0_#3e9900]"
                  : "text-pencil-gray hover:bg-[#f1f8ec] hover:text-[#3e870e]"
              }`}
            >
              <span
                aria-hidden="true"
                className={`account-sidebar-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-[17px] font-black ${
                  active
                    ? "bg-white/20 text-paper-white"
                    : "bg-[#f1f3f6] text-spark-blue group-hover:bg-paper-white"
                }`}
              >
                {item.icon}
              </span>
              <span className="leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t-2 border-[#ececef] p-4 lg:block">
        <Link
          href="/quests"
          className="account-sidebar-catalog flex items-center justify-between rounded-xl border border-transparent bg-[#f7f8fa] px-4 py-3 text-[12px] font-extrabold uppercase text-spark-blue hover:bg-[#e9f7ff]"
        >
          Все истории <span aria-hidden="true">→</span>
        </Link>
      </div>
    </aside>
  );
}
