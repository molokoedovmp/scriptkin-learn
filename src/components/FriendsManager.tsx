"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SocialDashboardData, SocialFriend } from "@/lib/social";

interface SearchUser {
  id: string;
  name: string;
  joinedAt: string;
}

export function FriendsManager({
  initialSocial,
}: {
  initialSocial: SocialDashboardData;
}) {
  const [social, setSocial] = useState(initialSocial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const incoming = social.requests.filter((item) => item.direction === "incoming");
  const outgoing = social.requests.filter((item) => item.direction === "outgoing");

  useEffect(() => {
    void loadUsers("");
  }, []);

  async function loadUsers(value: string) {
    if (value.length === 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/social/users?q=${encodeURIComponent(value)}`
      );
      const data = (await response.json()) as {
        ok: boolean;
        users?: SearchUser[];
        error?: string;
      };
      if (!data.ok) setError(data.error ?? "Поиск не удался.");
      setResults(data.users ?? []);
    } catch {
      setError("Не удалось выполнить поиск.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    const response = await fetch("/api/social/dashboard");
    const data = (await response.json()) as {
      ok: boolean;
      dashboard?: SocialDashboardData;
    };
    if (data.dashboard) setSocial(data.dashboard);
  }

  async function action(
    type: "request" | "accept" | "decline" | "remove",
    id: string
  ) {
    setBusy(id);
    setError("");
    const body =
      type === "request"
        ? { action: type, targetUserId: id }
        : { action: type, friendshipId: id };
    try {
      const response = await fetch("/api/social/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Действие не выполнено.");
        return;
      }
      await Promise.all([refresh(), loadUsers(query.trim())]);
    } catch {
      setError("Не удалось связаться с сервером.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <section className="rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-5 sm:p-6">
        <p className="text-caption font-extrabold uppercase tracking-wide text-spark-blue">
          Пользователи
        </p>
        <h2 className="mt-1 text-heading-sm font-black text-charcoal">
          Найти новых друзей
        </h2>
        <div className="mt-5 flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void loadUsers(query.trim());
            }}
            placeholder="Имя или полный email"
            className="min-w-0 grow rounded-xl border-2 border-[#dedede] bg-paper-white px-4 py-3 text-body font-bold text-charcoal outline-none focus:border-spark-blue"
          />
          <button
            type="button"
            onClick={() => void loadUsers(query.trim())}
            disabled={loading}
            className="rounded-xl bg-spark-blue px-4 text-caption font-extrabold uppercase text-paper-white disabled:opacity-50"
          >
            {loading ? "Ищу…" : "Найти"}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-caption font-bold text-[#d63b3b]">{error}</p>
        )}

        {incoming.length > 0 && (
          <div className="mt-6 rounded-xl bg-[#f7f2ff] p-4">
            <p className="mb-3 text-caption font-extrabold uppercase text-[#7449bd]">
              Входящие заявки · {incoming.length}
            </p>
            <div className="space-y-2">
              {incoming.map((request) => (
                <div key={request.friendshipId} className="flex items-center gap-3">
                  <Avatar name={request.name} />
                  <Link
                    href={`/account/users/${request.userId}`}
                    className="min-w-0 grow truncate font-extrabold text-charcoal hover:text-spark-blue"
                  >
                    {request.name}
                  </Link>
                  <button
                    onClick={() => void action("accept", request.friendshipId)}
                    disabled={busy === request.friendshipId}
                    className="rounded-lg bg-eager-green px-3 py-2 text-caption font-extrabold text-paper-white disabled:opacity-50"
                  >
                    Принять
                  </button>
                  <button
                    onClick={() => void action("decline", request.friendshipId)}
                    disabled={busy === request.friendshipId}
                    className="text-caption font-bold text-faded-gray hover:text-[#d63b3b]"
                  >
                    Отклонить
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 divide-y divide-[#ececef]">
          {results.map((profile) => (
            <div key={profile.id} className="flex items-center gap-3 py-3 first:pt-0">
              <Avatar name={profile.name} />
              <Link
                href={`/account/users/${profile.id}`}
                className="min-w-0 grow"
              >
                <span className="block truncate font-extrabold text-charcoal hover:text-spark-blue">
                  {profile.name}
                </span>
                <span className="text-caption font-bold text-faded-gray">
                  Открыть профиль
                </span>
              </Link>
              <button
                disabled={busy === profile.id}
                onClick={() => void action("request", profile.id)}
                className="rounded-lg border-2 border-eager-green px-3 py-2 text-caption font-extrabold text-[#3f9900] hover:bg-storybook-green disabled:opacity-50"
              >
                Добавить
              </button>
            </div>
          ))}
          {!loading && results.length === 0 && (
            <Empty text={query.trim() ? "Пользователи не найдены." : "Других пользователей пока нет."} />
          )}
        </div>
      </section>

      <section className="rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-5 sm:p-6 lg:sticky lg:top-[90px]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-caption font-extrabold uppercase tracking-wide text-[#7449bd]">
              Твой круг
            </p>
            <h2 className="mt-1 text-heading-sm font-black text-charcoal">
              Мои друзья
            </h2>
          </div>
          <span className="rounded-full bg-[#f1ecff] px-3 py-1 text-caption font-extrabold text-[#7449bd]">
            {social.friends.length}
          </span>
        </div>
        {social.friends.length === 0 ? (
          <Empty text="Добавь первого друга — он появится в этом списке." />
        ) : (
          <div className="divide-y divide-[#ececef]">
            {social.friends.map((friend) => (
              <FriendRow
                key={friend.friendshipId}
                friend={friend}
                busy={busy === friend.friendshipId}
                onRemove={() => void action("remove", friend.friendshipId)}
              />
            ))}
          </div>
        )}

        {outgoing.length > 0 && (
          <div className="mt-6 border-t-2 border-[#ececef] pt-5">
            <p className="mb-3 text-caption font-extrabold uppercase text-pencil-gray">
              Ожидают ответа · {outgoing.length}
            </p>
            <div className="space-y-3">
              {outgoing.map((request) => (
                <div key={request.friendshipId} className="flex items-center gap-3">
                  <Avatar name={request.name} />
                  <Link
                    href={`/account/users/${request.userId}`}
                    className="min-w-0 grow truncate font-extrabold text-charcoal hover:text-spark-blue"
                  >
                    {request.name}
                  </Link>
                  <button
                    onClick={() => void action("decline", request.friendshipId)}
                    disabled={busy === request.friendshipId}
                    className="text-caption font-bold text-faded-gray hover:text-[#d63b3b]"
                  >
                    Отменить
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function FriendRow({
  friend,
  busy,
  onRemove,
}: {
  friend: SocialFriend;
  busy: boolean;
  onRemove: () => void;
}) {
  const bestProgress = friend.progress[0];
  return (
    <div className="flex items-center gap-3 py-4 first:pt-0">
      <Avatar name={friend.name} />
      <Link href={`/account/users/${friend.id}`} className="min-w-0 grow">
        <span className="block truncate font-extrabold text-charcoal hover:text-spark-blue">
          {friend.name}
        </span>
        <span className="block truncate text-caption font-bold text-faded-gray">
          {bestProgress
            ? `${bestProgress.emoji} ${bestProgress.title} · ${bestProgress.percent}%`
            : "Квесты ещё не начаты"}
        </span>
      </Link>
      <Link
        href={`/account/users/${friend.id}`}
        aria-label={`Открыть профиль ${friend.name}`}
        className="text-xl font-black text-spark-blue"
      >
        →
      </Link>
      <button
        onClick={onRemove}
        disabled={busy}
        className="text-caption font-bold text-faded-gray hover:text-[#d63b3b] disabled:opacity-50"
      >
        Удалить
      </button>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eee9ff] text-caption font-black text-[#7449bd]">
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-[#f7f8fa] p-6 text-center">
      <p className="text-[15px] font-medium text-pencil-gray">{text}</p>
    </div>
  );
}
