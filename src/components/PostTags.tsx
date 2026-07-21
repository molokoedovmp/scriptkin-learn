import Link from "next/link";
import { getPostTag } from "@/lib/post-tags";

export function PostTags({
  tags,
  linked = false,
}: {
  tags: string[];
  linked?: boolean;
}) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((id) => {
        const tag = getPostTag(id);
        if (!tag) return null;
        const className = `rounded-full px-3 py-1 text-caption font-extrabold ${tag.className}`;
        return linked ? (
          <Link key={id} href={`/community?tag=${id}`} className={`${className} hover:opacity-75`}>
            #{tag.label}
          </Link>
        ) : (
          <span key={id} className={className}>#{tag.label}</span>
        );
      })}
    </div>
  );
}
