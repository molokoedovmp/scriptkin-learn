import type { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth";
import { AccountSidebar } from "./AccountSidebar";

export async function AccountShell({
  children,
  fullBleed = false,
}: {
  children: ReactNode;
  fullBleed?: boolean;
}) {
  const user = await getSessionUser();

  return (
    <div className="account-dashboard-shell mb-[calc(-68px-env(safe-area-inset-bottom))] flex min-h-screen w-full bg-[#f5f7fa] md:mb-0">
      <AccountSidebar user={user} />
      <main className="account-dashboard-main min-w-0 flex-1 overflow-x-hidden">
        <div
          className={
            fullBleed
              ? "account-content min-h-screen w-full"
              : "account-content mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
          }
        >
          {children}
        </div>
      </main>
    </div>
  );
}
