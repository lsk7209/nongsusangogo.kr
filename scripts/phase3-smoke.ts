import { createGeminiClient } from "@/lib/gemini/client";
import { enrichDraftPage } from "@/lib/enrich/pages";
import { createSampleDrafts } from "@/lib/enrich/sample-drafts";

const client = createGeminiClient({});
const results = await Promise.all(
  createSampleDrafts(10).map((draft) =>
    enrichDraftPage(draft, {
      client,
      existingTitles: ["무난한 기존 시세 페이지"],
    }),
  ),
);

const passed = results.filter((result) => result.quality.passed).length;
const rejected = results.filter((result) => !result.quality.passed).length;

if (passed === 0 || rejected === 0) {
  throw new Error("Phase 3 smoke failed: pass/reject branching did not run.");
}

console.log(`Phase 3 smoke test passed: ${passed} passed, ${rejected} rejected`);

