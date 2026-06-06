import { readEnv } from "@/lib/config/env";
import { createDatabase } from "@/lib/db/client";
import { getLatestGateRun, listGateDecisions } from "@/lib/gates/gate-store";
import { buildReadinessReportFromDb } from "@/lib/gates/readiness";

const env = readEnv();

if (!env.TURSO_DATABASE_URL) {
  throw new Error("TURSO_DATABASE_URL is required to list gate decisions.");
}

const db = createDatabase();
const [decisions, latestGateRun, readiness] = await Promise.all([
  listGateDecisions(db),
  getLatestGateRun(db),
  buildReadinessReportFromDb(db),
]);

console.log(
  JSON.stringify(
    {
      latestGateRun,
      decisions,
      readiness,
    },
    null,
    2,
  ),
);
