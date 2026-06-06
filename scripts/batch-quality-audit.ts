import { createDatabase } from "@/lib/db/client";
import { auditPageQualityState } from "@/lib/quality/audit";

if (!process.env.TURSO_DATABASE_URL) {
  console.log(
    JSON.stringify(
      {
        reason: "TURSO_DATABASE_URL is not configured.",
        counts: {},
      },
      null,
      2,
    ),
  );
} else {
  const report = await auditPageQualityState(createDatabase());
  console.log(JSON.stringify(report, null, 2));

  if (!report.passed) {
    process.exitCode = 1;
  }
}
