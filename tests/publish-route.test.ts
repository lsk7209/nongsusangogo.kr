import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";
import { gateDecisions, pages } from "@/lib/db/schema";

describe("/api/cron/publish", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@/lib/db/client");
  });

  it("blocks unauthenticated requests when CRON_SECRET is configured", async () => {
    vi.stubEnv("CRON_SECRET", "secret");
    const { GET, dynamic } = await import("@/app/api/cron/publish/route");

    const response = await GET(
      new Request("https://example.com/api/cron/publish"),
    );
    const body = await response.json();

    expect(dynamic).toBe("force-dynamic");
    expect(response.status).toBe(401);
    expect(body.blocked).toBe(true);
  });

  it("accepts bearer auth and publishes up to the requested limit", async () => {
    const db = await createMigratedTestDb();
    await seedPassingGateDecisions(db);
    await seedQualityPassedPage(db, "candidate-1");
    await seedQualityPassedPage(db, "candidate-2");
    vi.stubEnv("TURSO_DATABASE_URL", ":memory:");
    vi.stubEnv("CRON_SECRET", "secret");
    vi.doMock("@/lib/db/client", () => ({
      createDatabase: () => db,
    }));
    const { GET } = await import("@/app/api/cron/publish/route");

    const response = await GET(
      new Request("https://example.com/api/cron/publish?limit=1", {
        headers: { Authorization: "Bearer secret" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.blocked).toBe(false);
    expect(body.published).toBe(1);
  });

  it("accepts query secret auth", async () => {
    vi.stubEnv("TURSO_DATABASE_URL", ":memory:");
    vi.stubEnv("CRON_SECRET", "secret");
    vi.doMock("@/lib/db/client", () => ({
      createDatabase: () => {
        throw new Error("DB call proves auth passed.");
      },
    }));
    const { GET } = await import("@/app/api/cron/publish/route");

    const response = await GET(
      new Request("https://example.com/api/cron/publish?secret=secret"),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.reason).toBe("DB call proves auth passed.");
  });

  it("rejects invalid limits", async () => {
    const { GET } = await import("@/app/api/cron/publish/route");

    const response = await GET(
      new Request("https://example.com/api/cron/publish?limit=999"),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.reason).toContain("limit");
  });

  it("keeps DB-missing requests safely blocked", async () => {
    const { GET } = await import("@/app/api/cron/publish/route");

    const response = await GET(
      new Request("https://example.com/api/cron/publish"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.blocked).toBe(true);
    expect(body.reason).toContain("TURSO_DATABASE_URL");
  });
});

async function seedQualityPassedPage(
  db: ReturnType<typeof drizzle<typeof schema>>,
  slug: string,
) {
  await db.insert(pages).values({
    slug,
    title: "Publish candidate",
    status: "quality_passed",
    qualityScore: 1,
    gatePassed: true,
    activeSections: ["price_trend"],
    uniquePoints: ["daily delta", "monthly delta", "normal-year delta"],
  });
}

async function seedPassingGateDecisions(
  db: ReturnType<typeof drizzle<typeof schema>>,
) {
  await db
    .insert(gateDecisions)
    .values([
      gateDecision("license", "Gate 0.5 license", "pass"),
      gateDecision(
        "region_dimension",
        "Gate 0.5 region dimension",
        "pass",
        "free",
      ),
      gateDecision(
        "wholesale_retail_join",
        "Gate 0.5 wholesale-retail join",
        "pass",
        "0.8",
      ),
      gateDecision(
        "unit_weight_share",
        "Gate 0.5 unit classification",
        "pass",
        "0.7",
      ),
      gateDecision("backfill_paging", "Gate 0.5 backfill paging", "pass"),
      gateDecision("datalab_intent", "Gate 0 DataLab intent", "pass"),
      gateDecision("cpa_rate", "Gate 0 CPA rate", "pass"),
      gateDecision("unit_economics", "Gate 0 unit economics", "pass"),
      gateDecision("zero_click", "Gate 0 zero-click review", "pass"),
    ]);
}

function gateDecision(
  checkId: string,
  label: string,
  status: (typeof schema.gateStatuses)[number],
  measuredValue?: string,
) {
  return {
    checkId,
    label,
    status,
    decision: "Confirmed by route test.",
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
