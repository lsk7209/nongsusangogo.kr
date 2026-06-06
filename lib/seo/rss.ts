import type { EditorialPost } from "@/lib/content/editorial-posts";

type BuildRssOptions = {
  siteUrl: string;
  posts: EditorialPost[];
  now?: Date;
};

export function buildRssFeed({ siteUrl, posts, now = new Date() }: BuildRssOptions) {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");
  const items = posts
    .map((post) => {
      const url = `${normalizedSiteUrl}/blog/${post.slug}`;

      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <description>${escapeXml(post.excerpt)}</description>`,
        `      <pubDate>${new Date(post.publishAt).toUTCString()}</pubDate>`,
        `      <category>${escapeXml(post.category)}</category>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    "    <title>농수산고고</title>",
    `    <link>${escapeXml(normalizedSiteUrl)}</link>`,
    "    <description>농산물 시세, 장보기 타이밍, 보관 손실, 대체재 기준을 정리하는 농수산고고 RSS입니다.</description>",
    "    <language>ko-KR</language>",
    `    <lastBuildDate>${now.toUTCString()}</lastBuildDate>`,
    "    <ttl>60</ttl>",
    items,
    "  </channel>",
    "</rss>",
  ]
    .filter(Boolean)
    .join("\n");
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
