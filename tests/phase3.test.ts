import { describe, expect, it } from "vitest";
import { enrichDraftPage } from "@/lib/enrich/pages";
import { createSampleDrafts } from "@/lib/enrich/sample-drafts";
import { MockGeminiClient } from "@/lib/gemini/client";
import { evaluatePageQuality } from "@/lib/quality/gate";
import { titleSimilarity } from "@/lib/quality/similarity";
import { selectConditionalSections } from "@/lib/sections/conditional-sections";

describe("phase 3 enrichment and quality gate", () => {
  it("detects similar titles", () => {
    expect(
      titleSimilarity("배추 오늘 시세와 전년 대비 흐름", "배추 오늘 시세와 전년 대비 흐름"),
    ).toBe(1);
  });

  it("selects conditional sections from raw data", () => {
    const sections = selectConditionalSections(createSampleDrafts(1)[0]!);

    expect(sections).toContain("price_trend");
    expect(sections).toContain("comparison_summary");
  });

  it("branches sample pages into pass and reject outcomes", async () => {
    const client = new MockGeminiClient();
    const results = await Promise.all(
      createSampleDrafts(10).map((draft) =>
        enrichDraftPage(draft, {
          client,
          existingTitles: ["서로 다른 기존 제목"],
        }),
      ),
    );

    expect(results.filter((result) => result.quality.passed)).toHaveLength(8);
    expect(results.filter((result) => !result.quality.passed)).toHaveLength(2);
  });

  it("reports all relevant quality failures", async () => {
    const draft = createSampleDrafts(10)[4]!;
    const enrichment = await new MockGeminiClient().enrichPage(draft);
    const result = evaluatePageQuality({
      draft,
      enrichment,
      activeSections: selectConditionalSections(draft),
      existingTitles: [draft.title],
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("unique_data_points");
    expect(result.failures).toContain("ai_commentary_length");
    expect(result.failures).toContain("title_similarity");
    expect(result.failures).toContain("faq_quality");
  });
});

