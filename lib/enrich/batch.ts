import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { pages } from "@/lib/db/schema";
import { enrichDraftPage } from "@/lib/enrich/pages";
import type { GeminiClient, PageDraftInput } from "@/lib/gemini/types";

export async function enrichDraftRows(db: Database, client: GeminiClient) {
  const drafts = await db.query.pages.findMany({
    where: eq(pages.status, "draft"),
  });
  let enriched = 0;
  let rejected = 0;

  for (const row of drafts) {
    const draft = pageRowToDraft(row);
    const result = await enrichDraftPage(draft, { client });

    await db
      .update(pages)
      .set({
        status: result.status,
        qualityScore: result.quality.score,
        gatePassed: result.quality.passed,
        activeSections: result.activeSections,
        uniquePoints: result.enrichment.uniquePoints,
        rawData: result.draft.rawData,
        aiCommentary: result.enrichment.commentary,
        faq: result.enrichment.faq,
      })
      .where(eq(pages.id, row.id));

    if (result.status === "quality_passed") {
      enriched += 1;
    } else {
      rejected += 1;
    }
  }

  return {
    checked: drafts.length,
    enriched,
    rejected,
  };
}

type PageRow = typeof pages.$inferSelect;

function pageRowToDraft(row: PageRow): PageDraftInput {
  const rawData = normalizeRawData(row.rawData);

  return {
    slug: row.slug,
    title: row.title,
    itemCode: row.itemCode ?? `page-${row.id}`,
    itemName: row.title,
    rawData,
  };
}

function normalizeRawData(value: unknown): PageDraftInput["rawData"] {
  if (
    typeof value === "object" &&
    value !== null &&
    "uniqueDataPoints" in value &&
    "comparisons" in value
  ) {
    return value as PageDraftInput["rawData"];
  }

  return {
    uniqueDataPoints: [],
    comparisons: [],
  };
}

