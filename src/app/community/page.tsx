import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PostTags } from "@/components/PostTags";
import { RichPostContent } from "@/components/RichPostContent";
import { getSessionUser } from "@/lib/auth";
import { POST_TAGS } from "@/lib/post-tags";
import { getCommunityPosts } from "@/lib/social";

export const metadata: Metadata = {
  title: "Сообщество — Скрипткин",
  description: "Публикации пользователей Скрипткина: решения, вопросы, SQL и учебный прогресс.",
};
export const dynamic = "force-dynamic";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const [{ tag }, user] = await Promise.all([searchParams, getSessionUser()]);
  const activeTag = POST_TAGS.some((item) => item.id === tag) ? tag! : null;
  const community = await getCommunityPosts(user?.id ?? null, activeTag);

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#f7f8fa]">
        <section className="bg-night-ink text-paper-white">
          <div className="mx-auto flex max-w-[1120px] flex-col justify-between gap-6 px-4 py-10 sm:px-6 sm:py-14 md:flex-row md:items-end">
            <div>
              <p className="text-caption font-extrabold uppercase tracking-[0.12em] text-fresh-leaf">Лента пользователей</p>
              <h1 className="mt-2 font-feather text-heading-sm font-black sm:text-heading">Сообщество Скрипткина</h1>
              <p className="mt-3 max-w-[660px] text-body font-medium text-[#b9c0e6]">Обсуждай задания, показывай решения, задавай вопросы и следи за прогрессом других пользователей.</p>
            </div>
            <Link href={user ? "/account/posts?compose=1" : "/login"} className="inline-flex w-fit shrink-0 rounded-xl bg-eager-green px-5 py-3 text-caption font-extrabold uppercase text-paper-white">
              {user ? "Создать публикацию" : "Войти и написать"}
            </Link>
          </div>
        </section>

        <div className="mx-auto grid max-w-[1120px] items-start gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_290px]">
          <section className="rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-5 sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-caption font-extrabold uppercase text-spark-blue">{activeTag ? "Выбранный тег" : "Все темы"}</p>
                <h2 className="mt-1 text-heading-sm font-black text-charcoal">
                  {activeTag ? `#${POST_TAGS.find((item) => item.id === activeTag)?.label}` : "Свежие публикации"}
                </h2>
              </div>
              <span className="rounded-full bg-[#f1f2f5] px-3 py-1 text-caption font-extrabold text-pencil-gray">{community.posts.length}</span>
            </div>

            {community.posts.length === 0 ? (
              <div className="rounded-xl bg-[#f7f8fa] p-10 text-center">
                <p className="text-4xl">💬</p>
                <p className="mt-3 font-extrabold text-charcoal">По этому тегу публикаций пока нет</p>
                <Link href="/community" className="mt-3 inline-flex font-extrabold text-spark-blue hover:underline">Показать всю ленту</Link>
              </div>
            ) : (
              <div className="divide-y divide-[#ececef]">
                {community.posts.map((post) => (
                  <article key={post.id} className="py-6 first:pt-0 last:pb-0">
                    <div className="flex gap-3">
                      <Link href={`/account/users/${post.authorId}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eee9ff] font-black text-[#7449bd]">
                        {post.authorName.charAt(0).toUpperCase()}
                      </Link>
                      <div className="min-w-0 grow">
                        <div>
                          <Link href={`/account/users/${post.authorId}`} className="font-extrabold text-charcoal hover:text-spark-blue">{post.authorName}</Link>
                          <p className="text-caption font-bold text-faded-gray">{formatDate(post.createdAt)}</p>
                        </div>
                        <div className="mt-3"><RichPostContent content={post.content} /></div>
                        <div className="mt-4"><PostTags tags={post.tags} linked /></div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-5 lg:sticky lg:top-[90px]">
            <h2 className="text-subheading font-black text-charcoal">Темы сообщества</h2>
            <p className="mt-1 text-[14px] font-medium text-pencil-gray">Выбери тег, чтобы отфильтровать ленту.</p>
            <div className="mt-5 space-y-2">
              <Link href="/community" className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-extrabold ${!activeTag ? "bg-night-ink text-paper-white" : "bg-[#f7f8fa] text-charcoal"}`}>
                <span>Все публикации</span>
                <span>{community.totalPosts}</span>
              </Link>
              {POST_TAGS.map((postTag) => (
                <Link key={postTag.id} href={`/community?tag=${postTag.id}`} className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-extrabold ${activeTag === postTag.id ? "bg-night-ink text-paper-white" : postTag.className}`}>
                  <span>#{postTag.label}</span>
                  <span>{community.tagCounts[postTag.id] ?? 0}</span>
                </Link>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-storybook-green p-4">
              <p className="font-extrabold text-charcoal">До трёх тегов на пост</p>
              <p className="mt-1 text-[13px] font-medium text-[#53723d]">Так публикацию проще найти тем, кому она действительно полезна.</p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}
