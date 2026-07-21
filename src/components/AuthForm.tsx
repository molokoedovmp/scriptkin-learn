"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "./Button";

const inputCls =
  "w-full rounded-xl border-2 border-faded-gray px-4 py-3 text-body font-medium text-charcoal outline-none placeholder:text-faded-gray focus:border-spark-blue";

const labelCls =
  "mb-1.5 block text-caption font-bold uppercase tracking-wide text-pencil-gray";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register"
            ? { name, email, password, pdConsent: consent }
            : { email, password }
        ),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Что-то пошло не так. Попробуй ещё раз.");
        return;
      }
      router.push("/account");
      router.refresh();
    } catch {
      setError("Не удалось связаться с сервером.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-[400px]">
      {mode === "register" && (
        <div className="mb-4">
          <label htmlFor="name" className={labelCls}>
            Никнейм
          </label>
          <input
            id="name"
            type="text"
            required
            minLength={2}
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Капитан Немо"
            className={inputCls}
          />
        </div>
      )}
      <div className="mb-4">
        <label htmlFor="email" className={labelCls}>
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputCls}
        />
      </div>
      <div className="mb-6">
        <label htmlFor="password" className={labelCls}>
          Пароль
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Минимум 8 символов"
          className={inputCls}
        />
        {mode === "login" && (
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-caption font-bold text-spark-blue hover:underline">
              Забыли пароль?
            </Link>
          </div>
        )}
      </div>

      {mode === "register" && (
        <label className="mb-6 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-eager-green"
          />
          <span className="text-caption font-medium leading-relaxed text-pencil-gray">
            Я принимаю{" "}
            <Link
              href="/legal/terms"
              target="_blank"
              className="font-bold text-spark-blue"
            >
              Пользовательское соглашение
            </Link>{" "}
            и даю{" "}
            <Link
              href="/legal/privacy"
              target="_blank"
              className="font-bold text-spark-blue"
            >
              согласие на обработку персональных данных
            </Link>
          </span>
        </label>
      )}

      {error && (
        <p className="mb-4 text-body font-bold text-[#ea2b2b]">{error}</p>
      )}

      <Button
        type="submit"
        disabled={loading || (mode === "register" && !consent)}
        className="w-full"
      >
        {loading
          ? "Секунду…"
          : mode === "register"
            ? "Создать аккаунт"
            : "Войти"}
      </Button>

      <p className="mt-6 text-center text-body font-medium text-pencil-gray">
        {mode === "register" ? (
          <>
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-bold text-spark-blue">
              Войти
            </Link>
          </>
        ) : (
          <>
            Ещё нет аккаунта?{" "}
            <Link href="/register" className="font-bold text-spark-blue">
              Зарегистрироваться
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
