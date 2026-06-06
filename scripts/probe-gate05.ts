import { runGate05Probe } from "@/lib/probe/gate05";
import { readEnv } from "@/lib/config/env";
import { createDatabase } from "@/lib/db/client";
import { saveGate05ProbeReport } from "@/lib/gates/gate-store";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const env = readEnv();

const report = await runGate05Probe({
  source:
    process.env.KAMIS_BASE_URL && process.env.KAMIS_CERT_ID && process.env.KAMIS_CERT_KEY
      ? "http"
      : "mock",
});

const outputPath = path.resolve(env.KAMIS_PROBE_OUTPUT_PATH);
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (env.TURSO_DATABASE_URL) {
  const runId = await saveGate05ProbeReport(createDatabase(), report);
  console.log(`Gate 0.5 probe report stored in DB as run ${runId}`);
}

console.log(JSON.stringify(report, null, 2));
console.log(`Gate 0.5 probe report written to ${outputPath}`);
