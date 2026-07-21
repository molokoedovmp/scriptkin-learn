import Link from "next/link";
import type { SocialFriend, SocialFriendRequest } from "@/lib/social";

export function AccountFriendsSummary({
  friends,
  requests,
}: {
  friends: SocialFriend[];
  requests: SocialFriendRequest[];
}) {
  const incoming = requests.filter((request) => request.direction === "incoming");

  return (
    <aside className="h-fit rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-5 lg:sticky lg:top-[90px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-caption font-extrabold uppercase tracking-wide text-[#7449bd]">
            Твой круг
          </p>
          <h3 className="mt-1 text-subheading font-black text-charcoal">
            Друзья
          </h3>
        </div>
        <span className="rounded-full bg-[#f1ecff] px-3 py-1 text-caption font-extrabold text-[#7449bd]">
          {friends.length}
        </span>
      </div>

      {incoming.length > 0 && (
        <Link
          href="/account/friends"
          className="mt-4 flex items-center justify-between rounded-xl bg-[#fff4cf] px-3 py-2.5 text-[13px] font-extrabold text-[#936900]"
        >
          <span>Новые заявки</span>
          <span>{incoming.length}</span>
        </Link>
      )}

      {friends.length === 0 ? (
        <div className="mt-5 rounded-xl bg-[#f7f8fa] p-4 text-center">
          <p className="text-3xl">☺</p>
          <p className="mt-2 text-[14px] font-bold text-pencil-gray">
            Добавь друзей и следи за их прогрессом.
          </p>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-[#ececef]">
          {friends.slice(0, 5).map((friend) => (
            <Link
              key={friend.id}
              href={`/account/users/${friend.id}`}
              className="flex items-center gap-3 py-3 first:pt-0 hover:text-spark-blue"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1ecff] font-black uppercase text-[#7449bd]">
                {friend.name.charAt(0)}
              </span>
              <span className="min-w-0 grow">
                <span className="block truncate text-[14px] font-extrabold text-charcoal">
                  {friend.name}
                </span>
                <span className="block text-[12px] font-bold text-faded-gray">
                  {friend.activityPoints} вкладов
                </span>
              </span>
              <span className="font-black text-spark-blue">→</span>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/account/friends"
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-[#dfe1e6] bg-paper-white px-4 py-2.5 text-caption font-extrabold uppercase text-charcoal hover:border-spark-blue hover:text-spark-blue"
      >
        {friends.length ? "Все друзья" : "Найти друзей"}
      </Link>
    </aside>
  );
}
