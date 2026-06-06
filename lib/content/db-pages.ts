import { desc, eq } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { collectCheckpoints, pages } from "@/lib/db/schema";
import { getQualityPassedPages, type SitePage } from "@/lib/content/site-pages";
import {
  canExposePublicContentForDb,
  canUseFixturePublicFallback,
} from "@/lib/gates/public-launch";

export async function loadPublicPages(db?: Database): Promise<SitePage[]> {
  if (!(await canExposePublicContentForDb(db))) {
    return [];
  }

  const fallback = canUseFixturePublicFallback() ? getQualityPassedPages() : [];

  if (!db) {
    return fallback;
  }

  const rows = await db.query.pages.findMany({
    where: eq(pages.status, "published"),
  });

  if (rows.length === 0) {
    return fallback;
  }

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    itemCode: row.itemCode ?? "unknown",
    itemName: row.title,
    category: "vegetable",
    status: "quality_passed",
    summary:
      typeof row.aiCommentary === "string"
        ? row.aiCommentary.slice(0, 120)
        : "품질 게이트를 통과한 시세 페이지입니다.",
    unit: "unknown",
    price: null,
    pricePerKg: null,
    observations: [],
    activeSections: Array.isArray(row.activeSections)
      ? row.activeSections.map(String)
      : [],
    faq: Array.isArray(row.faq) ? row.faq.filter(isFaq) : [],
  }));
}

export async function findPublicPage(db: Database | undefined, slug: string) {
  const publicPages = await loadPublicPages(db);
  return publicPages.find((page) => page.slug === slug);
}

export async function loadPublicPagesSafe(db?: Database): Promise<SitePage[]> {
  try {
    return await loadPublicPages(db);
  } catch {
    return canUseFixturePublicFallback() ? getQualityPassedPages() : [];
  }
}

export async function findPublicPageSafe(
  db: Database | undefined,
  slug: string,
) {
  const publicPages = await loadPublicPagesSafe(db);
  return publicPages.find((page) => page.slug === slug);
}

export async function countPagesByStatus(db: Database) {
  const rows = await db.select().from(pages);
  return rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
    return counts;
  }, {});
}

export async function getLatestCheckpoint(db: Database) {
  return db.query.collectCheckpoints.findFirst({
    orderBy: desc(collectCheckpoints.updatedAt),
  });
}

export async function markQualityGateResults(db: Database) {
  const rows = await db.query.pages.findMany({
    where: eq(pages.status, "enriched"),
  });
  let passed = 0;
  let failed = 0;

  for (const row of rows) {
    const nextStatus = row.gatePassed ? "quality_passed" : "rejected";

    await db
      .update(pages)
      .set({
        status: nextStatus,
      })
      .where(eq(pages.id, row.id));

    if (nextStatus === "quality_passed") {
      passed += 1;
    } else {
      failed += 1;
    }
  }

  return {
    checked: rows.length,
    passed,
    failed,
  };
}

function isFaq(value: unknown): value is { question: string; answer: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "question" in value &&
    "answer" in value
  );
}

export function getOptionalDatabase(createDatabase: () => Database) {
  if (!process.env.TURSO_DATABASE_URL) {
    return undefined;
  }

  return createDatabase();
}
