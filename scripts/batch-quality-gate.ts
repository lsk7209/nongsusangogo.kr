import { createDatabase } from "@/lib/db/client";
import { markQualityGateResults } from "@/lib/content/db-pages";

if (!process.env.TURSO_DATABASE_URL) {
  console.log(
    JSON.stringify(
      {
        checked: 0,
        passed: 0,
        failed: 0,
        reason: "TURSO_DATABASE_URL is not configured.",
      },
      null,
      2,
    ),
  );
} else {
  console.log(JSON.stringify(await markQualityGateResults(createDatabase()), null, 2));
}
