import { createDatabase } from "@/lib/db/client";
import { generateDraftPagesFromPrices } from "@/lib/pages/draft-from-prices";

const result = await generateDraftPagesFromPrices(createDatabase());

console.log(JSON.stringify(result, null, 2));

