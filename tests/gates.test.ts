import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";
import { gateDecisions } from "@/lib/db/schema";
import {
  buildReadinessReport,
  buildReadinessReportFromDb,
} from "@/lib/gates/readiness";

describe("v0.3 gate readiness", () => {
  it("defaults to pending and blocks public launch", () => {
    const report = buildReadinessReport({});

    expect(report.route).toBe("pending");
    expect(report.publicLaunchAllowed).toBe(false);
    expect(report.publishAllowed).toBe(false);
    expect(report.checks.map((check) => check.id)).toContain("license");
  });

  it("allows publish only when Gate 0.5 and Gate 0 checks are complete", () => {
    const report = buildReadinessReport({
      DATA_LICENSE_CONFIRMED: "true",
      KAMIS_REGION_SOURCE: "free",
      WHOLESALE_RETAIL_MATCH_RATE: "0.8",
      UNIT_WEIGHT_SHARE: "0.7",
      BACKFILL_PAGING_CONFIRMED: "true",
      DATALAB_INTENT_CONFIRMED: "true",
      CPA_RATE_CONFIRMED: "true",
      UNIT_ECONOMICS_CONFIRMED: "true",
      ZERO_CLICK_REVIEWED: "true",
    });

    expect(report.route).toBe("A-free");
    expect(report.publicLaunchAllowed).toBe(true);
    expect(report.publishAllowed).toBe(true);
  });

  it("uses DB decisions before env values when available", async () => {
    const db = await createMigratedTestDb();
    await db.insert(gateDecisions).values([
      decision("license", "Gate 0.5 license", "pass"),
      decision("region_dimension", "Gate 0.5 region dimension", "pass", "free"),
      decision("wholesale_retail_join", "Gate 0.5 wholesale-retail join", "pass", "0.82"),
      decision("unit_weight_share", "Gate 0.5 unit classification", "pass", "0.68"),
      decision("backfill_paging", "Gate 0.5 backfill paging", "pass"),
      decision("datalab_intent", "Gate 0 DataLab intent", "pass"),
      decision("cpa_rate", "Gate 0 CPA rate", "pass"),
      decision("unit_economics", "Gate 0 unit economics", "pass"),
      decision("zero_click", "Gate 0 zero-click review", "pass"),
    ]);

    const report = await buildReadinessReportFromDb(db, {});

    expect(report.source).toBe("db");
    expect(report.route).toBe("A-free");
    expect(report.publishAllowed).toBe(true);
  });

  it("keeps missing DB decisions pending", async () => {
    const db = await createMigratedTestDb();
    await db.insert(gateDecisions).values([
      decision("license", "Gate 0.5 license", "pass"),
    ]);

    const report = await buildReadinessReportFromDb(db, {});

    expect(report.publishAllowed).toBe(false);
    expect(report.checks.find((check) => check.id === "license")?.status).toBe("pass");
    expect(report.checks.find((check) => check.id === "datalab_intent")?.status).toBe("pending");
  });
});

function decision(
  checkId: string,
  label: string,
  status: (typeof schema.gateStatuses)[number],
  measuredValue?: string,
) {
  return {
    checkId,
    label,
    status,
    decision: "Confirmed by test.",
    measuredValue,
  };
}

async function createMigratedTestDb() {
  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, { schema });
  const migrationFiles = readdirSync(path.join(process.cwd(), "drizzle"))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const migration = readFileSync(
      path.join(process.cwd(), "drizzle", file),
      "utf8",
    );
    const statements = migration
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await client.execute(statement);
    }
  }

  return db;
}
