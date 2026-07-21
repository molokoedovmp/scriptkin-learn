import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "outline";

const base =
  "inline-flex items-center justify-center rounded-xl px-6 py-3 text-nav-label font-bold uppercase transition-colors";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-eager-green text-paper-white hover:bg-[#4cb002] active:bg-[#439c02]",
  outline:
    "border-2 border-faded-gray text-spark-blue hover:bg-[#f7f7f7] active:bg-[#efefef]",
};

export function Button({
  href,
  variant = "primary",
  children,
  type,
  disabled,
  onClick,
  className = "",
}: {
  href?: string;
  variant?: ButtonVariant;
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const cls = `${base} ${variants[variant]} ${disabled ? "opacity-50 pointer-events-none" : ""} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type ?? "button"} disabled={disabled} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
