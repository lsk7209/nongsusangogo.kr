import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";
import { gateDecisions, pages, publishLog } from "@/lib/db/schema";
import { promoteQualityPassedPages } from "@/lib/publish/drip-feed";

describe("phase 5 publishing guard", () => {
  it("blocks publishing when license is not confirmed", async () => {
    const db = await createMigratedTestDb();
    await seedQualityPassedPage(db);

    const result = await promoteQualityPassedPages(db, {
      limit: 5,
      env: { DATA_LICENSE_CONFIRMED: "false" },
    });
    const page = await db.query.pages.findFirst({
      where: eq(pages.slug, "publish-candidate"),
    });

    expect(result.blocked).toBe(true);
    expect(result.published).toBe(0);
    expect(page?.status).toBe("quality_passed");
  });

  it("still blocks publishing when license passes but other gates are pending", async () => {
    const db = await createMigratedTestDb();
    await seedQualityPassedPage(db);

    const result = await promoteQualityPassedPages(db, {
      limit: 5,
      env: { DATA_LICENSE_CONFIRMED: "true" },
    });
    const page = await db.query.pages.findFirst({
      where: eq(pages.slug, "publish-candidate"),
    });

    expect(result.blocked).toBe(true);
    expect(result.published).toBe(0);
    expect(result.reason).toContain("pending=");
    expect(result.reason).toContain("fail=none");
    expect(page?.status).toBe("quality_passed");
  });

  it("publishes quality passed pages only after all gates pass", async () => {
    const db = await createMigratedTestDb();
    await seedQualityPassedPage(db);

    const result = await promoteQualityPassedPages(db, {
      limit: 5,
      env: {
        DATA_LICENSE_CONFIRMED: "true",
        KAMIS_REGION_SOURCE: "free",
        WHOLESALE_RETAIL_MATCH_RATE: "0.8",
        UNIT_WEIGHT_SHARE: "0.7",
        BACKFILL_PAGING_CONFIRMED: "true",
        DATALAB_INTENT_CONFIRMED: "true",
        CPA_RATE_CONFIRMED: "true",
        UNIT_ECONOMICS_CONFIRMED: "true",
        ZERO_CLICK_REVIEWED: "true",
      },
    });
    const page = await db.query.pages.findFirst({
      where: eq(pages.slug, "publish-candidate"),
    });
    const logs = await db.select().from(publishLog);

    expect(result.blocked).toBe(false);
    expect(result.published).toBe(1);
    expect(page?.status).toBe("published");
    expect(logs).toHaveLength(1);
  });

  it("uses persisted gate decisions when env override is not supplied", async () => {
    const db = await createMigratedTestDb();
    await seedQualityPassedPage(db);
    await seedPassingGateDecisions(db);

    const result = await promoteQualityPassedPages(db, { limit: 5 });
    const page = await db.query.pages.findFirst({
      where: eq(pages.slug, "publish-candidate"),
    });

    expect(result.blocked).toBe(false);
    expect(result.published).toBe(1);
    expect(page?.status).toBe("published");
  });

  it("publishes only up to the requested limit", async () => {
    const db = await createMigratedTestDb();
    await seedQualityPassedPage(db, "publish-candidate-1");
    await seedQualityPassedPage(db, "publish-candidate-2");
    await seedPassingGateDecisions(db);

    const result = await promoteQualityPassedPages(db, { limit: 1 });
    const logs = await db.select().from(publishLog);

    expect(result.blocked).toBe(false);
    expect(result.published).toBe(1);
    expect(logs).toHaveLength(1);
  });

  it("rejects invalid publish limits", async () => {
    const db = await createMigratedTestDb();

    await expect(
      promoteQualityPassedPages(db, {
        limit: 0,
        env: {},
      }),
    ).rejects.toThrow("Publish limit");
  });
});

async function seedQualityPassedPage(
  db: ReturnType<typeof drizzle<typeof schema>>,
  slug = "publish-candidate",
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
