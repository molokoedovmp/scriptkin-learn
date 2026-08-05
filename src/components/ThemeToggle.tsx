"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "skriptkin-theme";

type ThemeToggleProps = {
  mobile?: boolean;
};

export function ThemeToggle({ mobile = false }: ThemeToggleProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    localStorage.setItem(STORAGE_KEY, nextDark ? "dark" : "light");
    setDark(nextDark);
  }

  if (mobile) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"}
        aria-pressed={dark}
        className="group flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-pencil-gray transition-colors hover:bg-[#f5f6f7] hover:text-charcoal"
      >
        <span className="flex h-8 w-11 items-center justify-center rounded-xl transition-colors group-hover:bg-[#eef0f3]">
          {dark ? <SunIcon /> : <MoonIcon />}
        </span>
        <span className="max-w-full truncate text-[10px] font-extrabold leading-none">
          Тема
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"}
      aria-pressed={dark}
      title={dark ? "Светлая тема" : "Тёмная тема"}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#dfe1e6] bg-paper-white text-pencil-gray transition-colors hover:border-eager-green hover:text-eager-green"
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[22px] w-[22px]"
      aria-hidden="true"
    >
      <path d="M20.4 15.2A8.5 8.5 0 0 1 8.8 3.6 8.5 8.5 0 1 0 20.4 15.2Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[22px] w-[22px]"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
