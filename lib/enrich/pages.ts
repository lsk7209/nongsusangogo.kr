import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { pages } from "@/lib/db/schema";
import type { GeminiClient, PageDraftInput } from "@/lib/gemini/types";
import { evaluatePageQuality } from "@/lib/quality/gate";
import { selectConditionalSections } from "@/lib/sections/conditional-sections";

export async function enrichDraftPage(
  draft: PageDraftInput,
  options: {
    client: GeminiClient;
    existingTitles?: string[];
  },
) {
  const activeSections = selectConditionalSections(draft);
  const enrichment = await options.client.enrichPage(draft);
  const quality = evaluatePageQuality({
    draft,
    enrichment,
    activeSections,
    existingTitles: options.existingTitles,
  });

  return {
    draft,
    enrichment,
    activeSections,
    quality,
    status: quality.passed ? "quality_passed" : "rejected",
  } as const;
}

export async function saveEnrichedPage(
  db: Database,
  result: Awaited<ReturnType<typeof enrichDraftPage>>,
) {
  await db
    .insert(pages)
    .values({
      slug: result.draft.slug,
      itemCode: result.draft.itemCode,
      title: result.draft.title,
      status: result.status,
      qualityScore: result.quality.score,
      gatePassed: result.quality.passed,
      activeSections: result.activeSections,
      uniquePoints: result.enrichment.uniquePoints,
      rawData: result.draft.rawData,
      aiCommentary: result.enrichment.commentary,
      faq: result.enrichment.faq,
    })
    .onConflictDoUpdate({
      target: pages.slug,
      set: {
        status: result.status,
        qualityScore: result.quality.score,
        gatePassed: result.quality.passed,
        activeSections: result.activeSections,
        uniquePoints: result.enrichment.uniquePoints,
        rawData: result.draft.rawData,
        aiCommentary: result.enrichment.commentary,
        faq: result.enrichment.faq,
      },
    });

  return db.query.pages.findFirst({
    where: eq(pages.slug, result.draft.slug),
  });
}

