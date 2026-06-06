import type { MetadataRoute } from "next";
import { readEnv } from "@/lib/config/env";
import { getOptionalDatabase } from "@/lib/content/db-pages";
import { createDatabase } from "@/lib/db/client";
import { canExposePublicContentForDb } from "@/lib/gates/public-launch";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = readEnv().SITE_URL;
  const db = getOptionalDatabase(createDatabase);

  if (!(await canExposePublicContentForDb(db))) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: ["GPTBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot"],
        allow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
