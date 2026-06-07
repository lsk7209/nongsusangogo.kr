import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";
import { gateDecisions, gateRuns, pages } from "@/lib/db/schema";

describe("/api/status", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@/lib/db/client");
  });

  it("reports env readiness when database is not configured", async () => {
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
    delete process.env.CRON_SECRET;
    delete process.env.KAMIS_BASE_URL;
    delete process.env.KAMIS_CERT_ID;
    delete process.env.KAMIS_CERT_KEY;

    const { GET, dynamic } = await import("@/app/api/status/route");
    const response = await GET();
    const body = await response.json();

    expect(dynamic).toBe("force-dynamic");
    expect(body.service).toBe("nongsusangogo");
    expect(body.readinessSource).toBe("env");
    expect(body.cronAuthConfigured).toBe(false);
    expect(body.dataMode).toBe("fixture_fallback");
    expect(body.kamisApiConfigured).toBe(false);
    expect(body.operationalWarnings).toContain(
      "KAMIS API credentials are not configured; price pages use fixture fallback data.",
    );
    expect(body.db.connected).toBe(false);
    expect(
      body.blockedChecks.map((check: { id: string }) => check.id),
    ).toContain("license");
  });

  it("reports DB readiness and latest gate run when database is configured", async () => {
    vi.stubEnv("TURSO_DATABASE_URL", ":memory:");
    const db = await createMigratedTestDb();
    vi.doMock("@/lib/db/client", () => ({
      createDatabase: () => db,
    }));
    const insertedRuns = await db
      .insert(gateRuns)
      .values({
        source: "manual",
        status: "success",
        rawReport: { type: "test" },
      })
      .returning({ id: gateRuns.id });
    const runId = insertedRuns[0]?.id;

    if (!runId) {
      throw new Error("Failed to seed gate run.");
    }

    await db
      .insert(gateDecisions)
      .values([
        decision("license", "Gate 0.5 license", "pass", null, runId),
        decision(
          "region_dimension",
          "Gate 0.5 region dimension",
          "pass",
          "free",
          runId,
        ),
        decision(
          "wholesale_retail_join",
          "Gate 0.5 wholesale-retail join",
          "pass",
          "0.8",
          runId,
        ),
        decision(
          "unit_weight_share",
          "Gate 0.5 unit classification",
          "pass",
          "0.7",
          runId,
        ),
        decision(
          "backfill_paging",
          "Gate 0.5 backfill paging",
          "pass",
          null,
          runId,
        ),
        decision(
          "datalab_intent",
          "Gate 0 DataLab intent",
          "pass",
          null,
          runId,
        ),
        decision("cpa_rate", "Gate 0 CPA rate", "pass", null, runId),
        decision(
          "unit_economics",
          "Gate 0 unit economics",
          "pass",
          null,
          runId,
        ),
        decision("zero_click", "Gate 0 zero-click review", "pass", null, runId),
      ]);
    await db.insert(pages).values({
      slug: "published-status-page",
      title: "Published status page",
      status: "published",
      gatePassed: true,
      activeSections: ["comparison_summary"],
      uniquePoints: ["daily delta"],
    });

    const { GET } = await import("@/app/api/status/route");
    const response = await GET();
    const body = await response.json();

    expect(body.readinessSource).toBe("db");
    expect(body.publicLaunchAllowed).toBe(true);
    expect(body.cronAuthConfigured).toBe(false);
    expect(body.dataMode).toBe("fixture_fallback");
    expect(body.kamisApiConfigured).toBe(false);
    expect(body.db.connected).toBe(true);
    expect(body.db.latestGateRun).toMatchObject({
      id: runId,
      source: "manual",
      status: "success",
    });
    expect(body.db.pageCounts.published).toBe(1);
    expect(body.samplePages.published).toBe(1);
    expect(body.blockedChecks).toEqual([]);
  });
});

function decision(
  checkId: string,
  label: string,
  status: (typeof schema.gateStatuses)[number],
  measuredValue: string | null,
  sourceRunId: number,
) {
  return {
    checkId,
    label,
    status,
    decision: "Confirmed by route test.",
    measuredValue,
    sourceRunId,
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
