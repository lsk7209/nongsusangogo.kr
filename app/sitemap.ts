import type { MetadataRoute } from "next";
import { readEnv } from "@/lib/config/env";
import { loadKeywordPagesSafe } from "@/lib/content/db-keyword-pages";
import {
  getOptionalDatabase,
  loadPublicPagesSafe,
} from "@/lib/content/db-pages";
import { createDatabase } from "@/lib/db/client";
import { canExposePublicContentForDb } from "@/lib/gates/public-launch";
import { buildSitemapEntries } from "@/lib/seo/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = getOptionalDatabase(createDatabase);

  if (!(await canExposePublicContentForDb(db))) {
    return [];
  }

  const pages = await loadPublicPagesSafe(db);
  const keywordPages = await loadKeywordPagesSafe(db);
  return buildSitemapEntries(readEnv().SITE_URL, pages, keywordPages);
}
