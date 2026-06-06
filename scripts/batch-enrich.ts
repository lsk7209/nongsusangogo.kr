import { createGeminiClient } from "@/lib/gemini/client";
import { enrichDraftPage } from "@/lib/enrich/pages";
import { createSampleDrafts } from "@/lib/enrich/sample-drafts";
import { enrichDraftRows } from "@/lib/enrich/batch";
import { createDatabase } from "@/lib/db/client";

const client = createGeminiClient();

if (process.env.TURSO_DATABASE_URL) {
  console.log(JSON.stringify(await enrichDraftRows(createDatabase(), client), null, 2));
  process.exit(0);
}

const results = await Promise.all(
  createSampleDrafts(10).map((draft) => enrichDraftPage(draft, { client })),
);

console.log(
  JSON.stringify(
    {
      enriched: results.filter((result) => result.status === "quality_passed")
        .length,
      rejected: results.filter((result) => result.status === "rejected").length,
    },
    null,
    2,
  ),
);
