import { createDatabase } from "@/lib/db/client";
import { generateKeywordDraftPages } from "@/lib/pages/keyword-drafts";

const result = await generateKeywordDraftPages(createDatabase());

console.log(JSON.stringify(result, null, 2));

