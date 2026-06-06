import type { PageDraftInput } from "@/lib/gemini/types";

export type ConditionalSection =
  | "price_trend"
  | "missing_data_notice"
  | "comparison_summary";

export function selectConditionalSections(input: PageDraftInput) {
  const sections: ConditionalSection[] = [];
  const hasCurrentPrice = input.rawData.comparisons.some(
    (comparison) => comparison.current !== null,
  );
  const hasMissingPrice = input.rawData.comparisons.some(
    (comparison) => comparison.current === null,
  );
  const hasComparison = input.rawData.comparisons.some(
    (comparison) => comparison.basis !== null,
  );

  if (hasCurrentPrice) {
    sections.push("price_trend");
  }

  if (hasMissingPrice) {
    sections.push("missing_data_notice");
  }

  if (hasComparison) {
    sections.push("comparison_summary");
  }

  return sections;
}

