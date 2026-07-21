"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./Button";
import type { SessionUser } from "@/lib/types";

/**
 * Правая часть шапки: показывает «Войти / Начать» гостю
 * и ссылку на личный кабинет — залогиненному пользователю.
 * Клиентский fetch, чтобы страницы оставались статическими.
 */
export function AuthNav() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { user: SessionUser | null }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return <div className="h-[44px] w-[44px] rounded-full bg-[#f1f2f5] sm:w-[150px]" aria-hidden />;
  }

  if (user) {
    return (
      <Link
        href="/account"
        title={`Личный кабинет — ${user.name}`}
        aria-label={`Открыть личный кабинет пользователя ${user.name}`}
        className="flex h-[44px] max-w-[170px] items-center gap-2 rounded-full border-2 border-[#dfe1e6] bg-paper-white p-1.5 pr-2.5 text-left hover:border-spark-blue hover:bg-[#f7fbff] sm:min-w-[135px]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-eager-green text-caption font-black uppercase text-paper-white">
          {user.name.trim().charAt(0) || "?"}
        </span>
        <span className="hidden min-w-0 grow sm:block">
          <span className="block text-[10px] font-extrabold uppercase leading-none tracking-wide text-faded-gray">
            Кабинет
          </span>
          <span className="mt-1 block max-w-[112px] truncate text-[13px] font-extrabold leading-none text-charcoal">
            {user.name}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="rounded-xl px-4 py-2.5 text-nav-label font-bold uppercase text-spark-blue hover:bg-[#f7f7f7]"
      >
        Войти
      </Link>
      <Button href="/register">Начать</Button>
    </>
  );
}
