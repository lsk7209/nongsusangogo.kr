import { readEnv } from "@/lib/config/env";
import { getPublishedEditorialPosts } from "@/lib/content/editorial-posts";
import { buildRssFeed } from "@/lib/seo/rss";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = readEnv();
  const rss = buildRssFeed({
    siteUrl: env.SITE_URL,
    posts: getPublishedEditorialPosts(),
  });

  return new Response(rss, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
