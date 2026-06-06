import { getQualityPassedPages } from "@/lib/content/site-pages";
import type { SitePage } from "@/lib/content/site-pages";
import {
  getQualityKeywordPages,
  type KeywordPage,
} from "@/lib/content/keyword-pages";
import { getPublishedEditorialPosts } from "@/lib/content/editorial-posts";

export function buildSitemapEntries(
  baseUrl: string,
  pages = getQualityPassedPages(),
  keywordPages = getQualityKeywordPages(),
  now = new Date(),
) {
  return [
    {
      url: baseUrl,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    ...pages.map((page: SitePage) => ({
      url: `${baseUrl}/items/${page.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...keywordPages.map((page: KeywordPage) => ({
      url: `${baseUrl}${page.path}`,
      changeFrequency: "weekly" as const,
      priority: page.intent === "guide" || page.intent === "learn" ? 0.5 : 0.7,
    })),
    ...getPublishedEditorialPosts(now).map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
