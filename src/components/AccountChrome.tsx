import Link from "next/link";
import type { SessionUser } from "@/lib/types";
import { LogoutButton } from "./LogoutButton";
import { Button } from "./Button";

export function AccountHero({ user }: { user: SessionUser }) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-[24px] bg-night-ink p-6 text-paper-white sm:p-8">
      <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-spark-blue/15 blur-3xl" />
      <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-eager-green/15 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[20px] bg-eager-green font-feather text-heading font-black shadow-[0_8px_0_#3e9900]">
            {initials(user.name)}
          </div>
          <div>
            <p className="mb-1 text-caption font-extrabold uppercase tracking-[0.12em] text-fresh-leaf">
              Личный кабинет
            </p>
            <h1 className="font-feather text-heading-sm font-black sm:text-heading">
              {user.name}
            </h1>
            <p className="mt-1 text-[15px] font-medium text-[#aeb5dc]">
              {user.email}
            </p>
            {user.bio && (
              <p className="mt-2 max-w-[560px] text-[14px] font-medium leading-relaxed text-[#d5d9f0]">
                {user.bio}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href="/account/profile">
            Редактировать профиль
          </Button>
          <LogoutButton />
        </div>
      </div>
    </section>
  );
}

export function AccountSectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <Link href="/account" className="mb-3 inline-flex text-caption font-extrabold uppercase text-spark-blue hover:underline">← В кабинет</Link>
        <h1 className="font-feather text-heading-sm font-black text-charcoal sm:text-heading">{title}</h1>
        <p className="mt-2 max-w-[680px] text-body font-medium text-pencil-gray">{description}</p>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}
