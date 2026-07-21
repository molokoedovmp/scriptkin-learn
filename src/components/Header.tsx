import Link from "next/link";
import { AuthNav } from "./AuthNav";
import { MobileNav } from "./MobileNav";

export function Header() {
  return (
    <>
      <header className="sticky top-0 z-10 hidden border-b-2 border-[#e5e5e5] bg-paper-white md:block">
        <div className="mx-auto flex h-[70px] max-w-[1200px] items-center justify-between px-6">
          <Link
            href="/"
            className="font-feather text-heading-sm font-extrabold lowercase tracking-tight text-eager-green"
          >
            скрипткин
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/quests"
              className="rounded-xl px-3 py-2.5 text-nav-label font-bold uppercase text-pencil-gray hover:text-charcoal"
            >
              Квесты
            </Link>
            <Link
              href="/practice"
              className="rounded-xl px-3 py-2.5 text-nav-label font-bold uppercase text-pencil-gray hover:text-charcoal"
            >
              Банк заданий
            </Link>
            <Link
              href="/community"
              className="rounded-xl px-3 py-2.5 text-nav-label font-bold uppercase text-pencil-gray hover:text-charcoal"
            >
              Сообщество
            </Link>
            <Link
              href="/how-it-works"
              className="hidden rounded-xl px-3 py-2.5 text-nav-label font-bold uppercase text-pencil-gray hover:text-charcoal lg:block"
            >
              Как это работает
            </Link>
            <AuthNav />
          </nav>
        </div>
      </header>
      <MobileNav />
    </>
  );
}
