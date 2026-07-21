"use client";

import { useState, type FormEvent } from "react";
import type { SessionUser } from "@/lib/types";

export function ProfileEditorForm({ user }: { user: SessionUser }) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Не удалось сохранить профиль.");
        return;
      }
      window.location.assign("/account");
    } catch {
      setError("Не удалось связаться с сервером.");
    } finally {
      setLoading(false);
    }
  }

  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "?";

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-[20px] bg-night-ink p-6 text-center text-paper-white lg:sticky lg:top-[90px]">
        <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-[24px] bg-eager-green font-feather text-heading font-black shadow-[0_8px_0_#3e9900]">
          {initials}
        </span>
        <p className="mt-5 text-subheading font-black">{name.trim() || "Ваш никнейм"}</p>
        <p className="mt-1 break-all text-caption font-medium text-[#aeb5dc]">{user.email}</p>
        <p className="mt-5 rounded-xl bg-paper-white/5 p-3 text-[13px] font-medium leading-relaxed text-[#cbd0ec]">
          Никнейм и описание видны другим пользователям на странице профиля.
        </p>
      </aside>

      <form onSubmit={submit} className="rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-5 sm:p-7">
        <div>
          <label htmlFor="profile-name" className="text-caption font-extrabold uppercase text-charcoal">Никнейм</label>
          <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={40} required className="mt-2 w-full rounded-xl border-2 border-[#dedede] bg-paper-white px-4 py-3 text-body font-bold text-charcoal outline-none focus:border-spark-blue" />
          <p className="mt-2 text-caption font-medium text-faded-gray">Уникальный никнейм виден в друзьях, публикациях и сообществе.</p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="profile-bio" className="text-caption font-extrabold uppercase text-charcoal">О себе</label>
            <span className={`text-caption font-bold ${bio.length > 450 ? "text-[#d63b3b]" : "text-faded-gray"}`}>{bio.length}/500</span>
          </div>
          <textarea id="profile-bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={500} rows={7} placeholder="Например: изучаю аналитику данных, сейчас разбираюсь с JOIN и подзапросами…" className="mt-2 w-full resize-y rounded-xl border-2 border-[#dedede] bg-paper-white p-4 text-body font-medium leading-relaxed text-charcoal outline-none focus:border-spark-blue" />
        </div>

        <div className="mt-6">
          <label className="text-caption font-extrabold uppercase text-charcoal">Email</label>
          <div className="mt-2 rounded-xl border-2 border-[#ececef] bg-[#f7f8fa] px-4 py-3 text-body font-bold text-pencil-gray">{user.email}</div>
          <p className="mt-2 text-caption font-medium text-faded-gray">Email используется для входа и не показывается другим пользователям.</p>
        </div>

        {error && <p className="mt-5 rounded-xl bg-[#fff0f0] p-3 text-caption font-bold text-[#d63b3b]">{error}</p>}

        <div className="mt-7 flex flex-wrap justify-end gap-3 border-t-2 border-[#ececef] pt-5">
          <a href="/account" className="rounded-xl px-5 py-3 text-caption font-extrabold uppercase text-pencil-gray">Отмена</a>
          <button type="submit" disabled={loading || name.trim().length < 2} className="rounded-xl bg-eager-green px-6 py-3 text-caption font-extrabold uppercase text-paper-white disabled:opacity-50">
            {loading ? "Сохраняю…" : "Сохранить профиль"}
          </button>
        </div>
      </form>
    </div>
  );
}
