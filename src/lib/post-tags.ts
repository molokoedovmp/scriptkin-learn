export const POST_TAGS = [
  { id: "sql", label: "SQL", className: "bg-[#e9f7ff] text-[#087eae]" },
  { id: "question", label: "Вопрос", className: "bg-[#fff4cf] text-[#936900]" },
  { id: "solution", label: "Решение", className: "bg-storybook-green text-[#3f850c]" },
  { id: "progress", label: "Прогресс", className: "bg-[#f1ecff] text-[#7449bd]" },
  { id: "help", label: "Нужна помощь", className: "bg-[#fff0f0] text-[#c33d3d]" },
  { id: "useful", label: "Полезное", className: "bg-[#eef0f5] text-[#596078]" },
] as const;

export type PostTagId = (typeof POST_TAGS)[number]["id"];

const TAG_IDS = new Set<string>(POST_TAGS.map((tag) => tag.id));

export function normalizePostTags(value: unknown): PostTagId[] | null {
  if (!Array.isArray(value)) return [];
  const tags = [...new Set(value.filter((tag): tag is string => typeof tag === "string"))];
  if (tags.length > 3 || tags.some((tag) => !TAG_IDS.has(tag))) return null;
  return tags as PostTagId[];
}

export function getPostTag(id: string) {
  return POST_TAGS.find((tag) => tag.id === id);
}
