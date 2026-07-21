import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProfileFriendAction } from "@/components/ProfileFriendAction";
import { PostTags } from "@/components/PostTags";
import { RichPostContent } from "@/components/RichPostContent";
import { getSessionUser } from "@/lib/auth";
import { getPublicUserProfile } from "@/lib/social";

export const metadata: Metadata = { title: "Профиль пользователя — Скрипткин" };
export const dynamic = "force-dynamic";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const { userId } = await params;
  const profile = await getPublicUserProfile(viewer.id, userId);
  if (!profile) notFound();

  const completed = profile.progress.filter((quest) => quest.completedAt).length;

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#f7f8fa]">
        <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 sm:py-10">
          <Link
            href="/account/friends"
            className="mb-5 inline-flex text-caption font-extrabold uppercase text-spark-blue hover:underline"
          >
            ← К списку друзей
          </Link>

          <section className="relative mb-6 overflow-hidden rounded-[24px] bg-night-ink p-6 text-paper-white sm:p-8">
            <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#7449bd]/25 blur-3xl" />
            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-5">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[20px] bg-[#7449bd] font-feather text-heading font-black shadow-[0_8px_0_#56358e]">
                  {initials(profile.name)}
                </span>
                <div>
                  <p className="text-caption font-extrabold uppercase tracking-[0.12em] text-[#cdb9f2]">
                    Профиль пользователя
                  </p>
                  <h1 className="mt-1 font-feather text-heading-sm font-black sm:text-heading">
                    {profile.name}
                  </h1>
                  <p className="mt-1 text-[14px] font-medium text-[#aeb5dc]">
                    На Скрипткине с {formatJoined(profile.joinedAt)}
                  </p>
                  {profile.bio && (
                    <p className="mt-3 max-w-[560px] whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-[#dfe3ff]">
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>
              {profile.isSelf ? (
                <span className="w-fit rounded-full bg-paper-white/10 px-4 py-2 text-caption font-extrabold uppercase text-[#dfe3ff]">
                  Это ваш профиль
                </span>
              ) : (
                <ProfileFriendAction
                  profileUserId={profile.id}
                  initialRelationship={profile.relationship}
                  friendshipId={profile.friendshipId}
                />
              )}
            </div>
          </section>

          <div className="mb-6 grid grid-cols-3 gap-3">
            <Metric value={profile.activityPoints} label="вкладов" />
            <Metric value={completed} label="квестов пройдено" />
            <Metric value={profile.friends.length} label="друзей" />
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_360px]">
            <div className="space-y-6">
              <section className="rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-5 sm:p-6">
                <h2 className="text-heading-sm font-black text-charcoal">
                  Прогресс в квестах
                </h2>
                {profile.progress.length === 0 ? (
                  <Empty text="Пользователь ещё не начал квесты." />
                ) : (
                  <div className="mt-5 space-y-5">
                    {profile.progress.map((quest) => (
                      <div key={quest.questSlug}>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <p className="font-extrabold text-charcoal">
                            {quest.emoji} {quest.title}
                          </p>
                          <span className="text-caption font-extrabold text-pencil-gray">
                            {quest.percent}%
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[#e6e7eb]">
                          <div
                            className="h-full rounded-full bg-eager-green"
                            style={{ width: `${quest.percent}%` }}
                          />
                        </div>
                        <p className="mt-2 text-caption font-bold text-faded-gray">
                          {quest.completedAt
                            ? "Квест пройден"
                            : `Открыт шаг ${quest.currentStep} из ${quest.stepsCount}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-heading-sm font-black text-charcoal">
                    Публикации
                  </h2>
                  <span className="rounded-full bg-[#fff4cf] px-3 py-1 text-caption font-extrabold text-[#a67800]">
                    {profile.posts.length}
                  </span>
                </div>
                {profile.posts.length === 0 ? (
                  <Empty text="Публикаций пока нет." />
                ) : (
                  <div className="divide-y divide-[#ececef]">
                    {profile.posts.map((post) => (
                      <article key={post.id} className="py-5 first:pt-0 last:pb-0">
                        <RichPostContent content={post.content} />
                        <div className="mt-4">
                          <PostTags tags={post.tags} linked />
                        </div>
                        <p className="mt-3 text-caption font-bold text-faded-gray">
                          {formatPostDate(post.createdAt)}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-5 lg:sticky lg:top-[90px]">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-subheading font-black text-charcoal">
                  Друзья пользователя
                </h2>
                <span className="rounded-full bg-[#f1ecff] px-3 py-1 text-caption font-extrabold text-[#7449bd]">
                  {profile.friends.length}
                </span>
              </div>
              {profile.friends.length === 0 ? (
                <Empty text="Список друзей пока пуст." />
              ) : (
                <div className="divide-y divide-[#ececef]">
                  {profile.friends.map((friend) => (
                    <Link
                      key={friend.id}
                      href={`/account/users/${friend.id}`}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eee9ff] text-caption font-black text-[#7449bd]">
                        {friend.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 grow truncate font-extrabold text-charcoal hover:text-spark-blue">
                        {friend.name}
                      </span>
                      <span className="font-black text-spark-blue">→</span>
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[18px] border-2 border-[#e6e7eb] bg-paper-white p-4 text-center sm:text-left">
      <p className="text-heading-sm font-black text-eager-green">{value}</p>
      <p className="text-caption font-extrabold uppercase text-pencil-gray">
        {label}
      </p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="mt-5 rounded-xl bg-[#f7f8fa] p-6 text-center">
      <p className="text-[15px] font-medium text-pencil-gray">{text}</p>
    </div>
  );
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

function formatJoined(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}

function formatPostDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}
