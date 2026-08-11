import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/articles";
import { getPracticeDatabases } from "@/lib/practice";
import { absoluteUrl } from "@/lib/site";
import { PUBLIC_STORY_PAGES } from "@/lib/story-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const contentLastModified = new Date("2026-08-11T00:00:00+03:00");
  const staticPages = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/quests"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/practice"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/articles"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/community"), changeFrequency: "daily", priority: 0.7 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/faq"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/feedback"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/legal/terms"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/legal/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/legal/offer"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/legal/cookies"), changeFrequency: "yearly", priority: 0.2 },
  ] satisfies MetadataRoute.Sitemap;

  const datedStaticPages: MetadataRoute.Sitemap = staticPages.map((page) => ({
    ...page,
    lastModified: contentLastModified,
  }));

  const practicePages: MetadataRoute.Sitemap = getPracticeDatabases().map(
    (database) => ({
      url: absoluteUrl(`/practice/${database.questSlug}`),
      lastModified: contentLastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    })
  );

  const storyPages: MetadataRoute.Sitemap = PUBLIC_STORY_PAGES.map((story) => ({
    url: absoluteUrl(`/stories/${story.slug}`),
    lastModified: contentLastModified,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const articlePages: MetadataRoute.Sitemap = ARTICLES.map((article) => ({
    url: absoluteUrl(`/articles/${article.slug}`),
    lastModified: article.modifiedIso ?? article.publishedIso,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...datedStaticPages, ...storyPages, ...practicePages, ...articlePages];
}
