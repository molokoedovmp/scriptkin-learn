import type { ReactNode } from "react";
import { AccountSidebar } from "./AccountSidebar";

export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <AccountSidebar />
        <div className="account-content min-w-0">{children}</div>
      </div>
    </div>
  );
}
