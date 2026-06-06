import { collectDailyPrices } from "@/lib/collect/daily-prices";
import { createDatabase } from "@/lib/db/client";
import { createKamisClient } from "@/lib/kamis/client";
import { generateDraftPagesFromPrices } from "@/lib/pages/draft-from-prices";

const db = createDatabase();

const result = await collectDailyPrices({
  db,
  client: createKamisClient(),
  scopeKey: process.env.COLLECT_SCOPE_KEY ?? "daily-production",
  batchLimit: process.env.COLLECT_BATCH_LIMIT
    ? Number(process.env.COLLECT_BATCH_LIMIT)
    : undefined,
});

const draftResult =
  process.env.COLLECT_BUILD_DRAFTS === "false"
    ? null
    : await generateDraftPagesFromPrices(db);

console.log(JSON.stringify({ collect: result, drafts: draftResult }, null, 2));
