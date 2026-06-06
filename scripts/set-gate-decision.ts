import { readEnv } from "@/lib/config/env";
import { createDatabase } from "@/lib/db/client";
import { saveManualGateDecision } from "@/lib/gates/gate-store";
import { parseManualGateDecisionArgs } from "@/lib/gates/manual-decision";

const env = readEnv();

if (!env.TURSO_DATABASE_URL) {
  throw new Error(
    "TURSO_DATABASE_URL is required to store manual gate decisions.",
  );
}

const decision = parseManualGateDecisionArgs(process.argv.slice(2));
const runId = await saveManualGateDecision(createDatabase(), decision);

console.log(
  JSON.stringify(
    {
      stored: true,
      runId,
      decision,
    },
    null,
    2,
  ),
);
