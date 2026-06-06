import type { ConditionalSection } from "@/lib/sections/conditional-sections";
import type { GeminiEnrichment, PageDraftInput } from "@/lib/gemini/types";
import { titleSimilarity } from "@/lib/quality/similarity";

export type QualityGateInput = {
  draft: PageDraftInput;
  enrichment: GeminiEnrichment;
  activeSections: ConditionalSection[];
  existingTitles?: string[];
};

export type QualityGateResult = {
  passed: boolean;
  score: number;
  failures: string[];
};

export function evaluatePageQuality({
  draft,
  enrichment,
  activeSections,
  existingTitles = [],
}: QualityGateInput): QualityGateResult {
  const checks = [
    {
      name: "unique_data_points",
      passed: enrichment.uniquePoints.length >= 3,
    },
    {
      name: "ai_commentary_length",
      passed: enrichment.commentary.length >= 200,
    },
    {
      name: "title_similarity",
      passed: existingTitles.every(
        (title) => titleSimilarity(draft.title, title) < 0.3,
      ),
    },
    {
      name: "faq_quality",
      passed:
        enrichment.faq.length >= 3 &&
        enrichment.faq.every((entry) => entry.answer.length >= 50),
    },
    {
      name: "conditional_section",
      passed: activeSections.length >= 1,
    },
    {
      name: "comparison_data",
      passed: draft.rawData.comparisons.some(
        (comparison) => comparison.basis !== null,
      ),
    },
    {
      name: "remaining_value_after_item_removed",
      passed: hasUsefulResidualPoints(draft, enrichment.uniquePoints),
    },
  ];

  const failures = checks
    .filter((check) => !check.passed)
    .map((check) => check.name);

  return {
    passed: failures.length === 0,
    score: (checks.length - failures.length) / checks.length,
    failures,
  };
}

function hasUsefulResidualPoints(draft: PageDraftInput, points: string[]) {
  const removable = [draft.itemName, draft.regionName ?? ""].filter(Boolean);

  return points.some((point) => {
    const residual = removable.reduce(
      (current, token) => current.replaceAll(token, ""),
      point,
    );

    return residual.replace(/\s+/g, "").length >= 10;
  });
}

