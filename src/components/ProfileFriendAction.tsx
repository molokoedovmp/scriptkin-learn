"use client";

import { useState } from "react";

type Relationship = "none" | "incoming" | "outgoing" | "friend";

export function ProfileFriendAction({
  profileUserId,
  initialRelationship,
  friendshipId,
}: {
  profileUserId: string;
  initialRelationship: Relationship;
  friendshipId: string | null;
}) {
  const [relationship, setRelationship] = useState(initialRelationship);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (relationship === "friend" || relationship === "outgoing") return;
    setLoading(true);
    setError("");
    const body =
      relationship === "incoming"
        ? { action: "accept", friendshipId }
        : { action: "request", targetUserId: profileUserId };
    try {
      const response = await fetch("/api/social/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Не удалось выполнить действие.");
        return;
      }
      setRelationship(relationship === "incoming" ? "friend" : "outgoing");
    } catch {
      setError("Не удалось связаться с сервером.");
    } finally {
      setLoading(false);
    }
  }

  const label =
    relationship === "friend"
      ? "✓ Уже в друзьях"
      : relationship === "outgoing"
        ? "Заявка отправлена"
        : relationship === "incoming"
          ? "Принять в друзья"
          : "+ Добавить в друзья";

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading || relationship === "friend" || relationship === "outgoing"}
        className={`rounded-xl px-5 py-3 text-caption font-extrabold uppercase transition-colors disabled:cursor-default ${
          relationship === "friend"
            ? "bg-eager-green/20 text-fresh-leaf"
            : relationship === "outgoing"
              ? "bg-paper-white/10 text-[#cbd0ec]"
              : "bg-eager-green text-paper-white hover:bg-[#4cb002]"
        }`}
      >
        {loading ? "Сохраняю…" : label}
      </button>
      {error && <p className="text-caption font-bold text-[#ff9c9c]">{error}</p>}
    </div>
  );
}
