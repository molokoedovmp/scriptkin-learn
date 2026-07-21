"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function FeedbackForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = {
      name: form.get("name"),
      email: form.get("email"),
      topic: form.get("topic"),
      message: form.get("message"),
      website: form.get("website"),
      pdConsent: form.get("pdConsent") === "on",
    };
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Не удалось отправить сообщение.");
        return;
      }
      setSent(true);
    } catch {
      setError("Не удалось связаться с сервером.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-[24px] border-2 border-[#cceeb4] bg-storybook-green p-8 text-center sm:p-12">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-eager-green text-3xl text-paper-white">✓</span>
        <h2 className="mt-5 text-heading-sm font-black text-charcoal">Сообщение отправлено</h2>
        <p className="mx-auto mt-3 max-w-[440px] text-body font-medium text-[#53723d]">
          Спасибо за обратную связь. Ответ придёт на указанный email.
        </p>
        <button onClick={() => setSent(false)} className="mt-6 rounded-xl border-2 border-[#78bd42] bg-paper-white px-5 py-3 text-caption font-extrabold uppercase text-[#3f9900]">
          Отправить ещё
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[24px] border-2 border-[#e6e7eb] bg-paper-white p-5 shadow-[0_10px_30px_rgba(0,4,55,0.06)] sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Имя" name="name" placeholder="Как к тебе обращаться?" autoComplete="name" />
        <Field label="Email для ответа" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
      </div>
      <label className="mt-5 block">
        <span className="mb-2 block text-caption font-extrabold uppercase text-charcoal">Тема</span>
        <select name="topic" required defaultValue="Предложение" className="w-full rounded-xl border-2 border-[#dedede] bg-paper-white px-4 py-3 text-body font-bold text-charcoal outline-none focus:border-spark-blue">
          <option>Предложение</option>
          <option>Ошибка на сайте</option>
          <option>Вопрос</option>
          <option>Другое</option>
        </select>
      </label>
      <label className="mt-5 block">
        <span className="mb-2 flex justify-between gap-3 text-caption font-extrabold uppercase text-charcoal">
          Сообщение <span className="normal-case text-faded-gray">до 3000 символов</span>
        </span>
        <textarea name="message" required minLength={10} maxLength={3000} rows={8} placeholder="Расскажи, что понравилось, что не работает или чего не хватает…" className="w-full resize-y rounded-xl border-2 border-[#dedede] bg-paper-white p-4 text-body font-medium text-charcoal outline-none focus:border-spark-blue" />
      </label>
      <label className="sr-only" aria-hidden="true">
        Сайт
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="mt-4 flex items-start gap-3 text-[14px] font-medium text-pencil-gray">
        <input name="pdConsent" type="checkbox" required className="mt-1 h-4 w-4 accent-eager-green" />
        <span>
          Согласен на обработку имени и email для получения ответа согласно{" "}
          <Link href="/legal/privacy" className="font-bold text-spark-blue hover:underline">политике персональных данных</Link>.
        </span>
      </label>
      {error && <p className="mt-4 rounded-xl bg-[#fff0f0] p-3 text-caption font-bold text-[#d63b3b]">{error}</p>}
      <button type="submit" disabled={loading} className="mt-6 w-full rounded-xl bg-eager-green px-6 py-4 text-nav-label font-extrabold uppercase text-paper-white shadow-[0_5px_0_#3f9900] disabled:opacity-50 sm:w-auto">
        {loading ? "Отправляю…" : "Отправить сообщение"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-caption font-extrabold uppercase text-charcoal">{label}</span>
      <input name={name} type={type} required minLength={type === "text" ? 2 : undefined} maxLength={type === "text" ? 80 : 254} placeholder={placeholder} autoComplete={autoComplete} className="w-full rounded-xl border-2 border-[#dedede] bg-paper-white px-4 py-3 text-body font-bold text-charcoal outline-none focus:border-spark-blue" />
    </label>
  );
}
