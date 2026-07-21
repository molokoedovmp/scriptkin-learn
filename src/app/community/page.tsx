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
        <div className="mx-auto grid min-w-0 max-w-[1040px] items-start gap-4 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[230px_minmax(0,760px)] lg:gap-6">
          <aside className="min-w-0 overflow-hidden rounded-[16px] border-2 border-[#e6e7eb] bg-paper-white p-2.5 lg:sticky lg:top-[90px] lg:p-3">
            <div className="flex w-full min-w-0 flex-nowrap gap-2 overflow-x-auto px-0.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
              <Link
                href="/community"
                className={`inline-flex shrink-0 items-center justify-between gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-extrabold lg:w-full lg:px-3 lg:text-[13px] ${
                  !activeTag
                    ? "bg-night-ink text-paper-white"
                    : "bg-[#f1f2f5] text-charcoal"
                }`}
              >
                <span>Все</span>
                <span>{community.totalPosts}</span>
              </Link>
              {POST_TAGS.map((postTag) => (
                <Link
                  key={postTag.id}
                  href={`/community?tag=${postTag.id}`}
                  className={`inline-flex shrink-0 items-center justify-between gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-extrabold lg:w-full lg:px-3 lg:text-[13px] ${
                    activeTag === postTag.id
                      ? "bg-night-ink text-paper-white"
                      : postTag.className
                  }`}
                >
                  <span>#{postTag.label}</span>
                  <span>{community.tagCounts[postTag.id] ?? 0}</span>
                </Link>
              ))}
            </div>
          </aside>

          <section className="min-w-0 rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white p-4 sm:p-6">
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
                      <div className="min-w-0 max-w-[680px] grow">
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
