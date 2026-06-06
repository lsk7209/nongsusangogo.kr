import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";
import {
  getGateDecision,
  saveManualGateDecision,
} from "@/lib/gates/gate-store";
import { parseManualGateDecisionArgs } from "@/lib/gates/manual-decision";
import { buildReadinessReportFromDb } from "@/lib/gates/readiness";

describe("manual gate decisions", () => {
  it("rejects unknown checks and invalid statuses", () => {
    expect(() =>
      parseManualGateDecisionArgs(["--check", "bad", "--status", "pass"]),
    ).toThrow("Unknown gate check");
    expect(() =>
      parseManualGateDecisionArgs(["--check", "license", "--status", "done"]),
    ).toThrow("Invalid gate status");
  });

  it("requires a decision for pass and fail statuses", () => {
    expect(() =>
      parseManualGateDecisionArgs(["--check", "license", "--status", "pass"]),
    ).toThrow("--decision is required");
    expect(() =>
      parseManualGateDecisionArgs(["--check", "license", "--status", "fail"]),
    ).toThrow("--decision is required");
  });

  it("validates constrained measured values", () => {
    expect(() =>
      parseManualGateDecisionArgs([
        "--check",
        "region_dimension",
        "--status",
        "branch",
        "--value",
        "metro",
      ]),
    ).toThrow("free, paid, none");
    expect(() =>
      parseManualGateDecisionArgs([
        "--check",
        "unit_weight_share",
        "--status",
        "pass",
        "--decision",
        "Enough weight units.",
        "--value",
        "1.4",
      ]),
    ).toThrow("number from 0 to 1");
  });

  it("stores manual decisions with a manual gate run", async () => {
    const db = await createMigratedTestDb();
    const decision = parseManualGateDecisionArgs([
      "--check",
      "license",
      "--status",
      "pass",
      "--decision",
      "KAMIS commercial redistribution confirmed.",
      "--value",
      "public-nuri-type-1",
    ]);

    const runId = await saveManualGateDecision(db, decision);
    const stored = await getGateDecision(db, "license");
    const run = await db.query.gateRuns.findFirst({
      where: (gateRunsTable, { eq }) => eq(gateRunsTable.id, runId),
    });

    expect(run?.source).toBe("manual");
    expect(stored?.status).toBe("pass");
    expect(stored?.sourceRunId).toBe(runId);
    expect(stored?.measuredValue).toBe("public-nuri-type-1");
  });

  it("lets persisted manual decisions drive readiness", async () => {
    const db = await createMigratedTestDb();

    for (const decision of passingDecisions()) {
      await saveManualGateDecision(db, decision);
    }

    const report = await buildReadinessReportFromDb(db, {});

    expect(report.route).toBe("A-free");
    expect(report.publishAllowed).toBe(true);
  });

  it("blocks readiness when a manual kill gate fails", async () => {
    const db = await createMigratedTestDb();
    await saveManualGateDecision(
      db,
      parseManualGateDecisionArgs([
        "--check",
        "license",
        "--status",
        "fail",
        "--decision",
        "Commercial redistribution is not permitted.",
      ]),
    );

    const report = await buildReadinessReportFromDb(db, {
      KAMIS_REGION_SOURCE: "free",
    });

    expect(report.route).toBe("blocked");
    expect(report.publishAllowed).toBe(false);
  });
});

function passingDecisions() {
  return [
    parseManualGateDecisionArgs([
      "--check",
      "license",
      "--status",
      "pass",
      "--decision",
      "License confirmed.",
    ]),
    parseManualGateDecisionArgs([
      "--check",
      "region_dimension",
      "--status",
      "pass",
      "--decision",
      "Free API has region fields.",
      "--value",
      "free",
    ]),
    parseManualGateDecisionArgs([
      "--check",
      "wholesale_retail_join",
      "--status",
      "pass",
      "--decision",
      "Join rate passes.",
      "--value",
      "0.8",
    ]),
    parseManualGateDecisionArgs([
      "--check",
      "unit_weight_share",
      "--status",
      "pass",
      "--decision",
      "Weight share passes.",
      "--value",
      "0.7",
    ]),
    parseManualGateDecisionArgs([
      "--check",
      "backfill_paging",
      "--status",
      "pass",
      "--decision",
      "Paging confirmed.",
    ]),
    parseManualGateDecisionArgs([
      "--check",
      "datalab_intent",
      "--status",
      "pass",
      "--decision",
      "DataLab intent confirmed.",
    ]),
    parseManualGateDecisionArgs([
      "--check",
      "cpa_rate",
      "--status",
      "pass",
      "--decision",
      "CPA rate confirmed.",
    ]),
    parseManualGateDecisionArgs([
      "--check",
      "unit_economics",
      "--status",
      "pass",
      "--decision",
      "Unit economics confirmed.",
    ]),
    parseManualGateDecisionArgs([
      "--check",
      "zero_click",
      "--status",
      "pass",
      "--decision",
      "Zero-click review complete.",
    ]),
  ];
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
