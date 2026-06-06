import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { loadKeywordPagesSafe } from "@/lib/content/db-keyword-pages";
import { loadPublicPagesSafe } from "@/lib/content/db-pages";
import * as schema from "@/lib/db/schema";
import { gateDecisions, pages } from "@/lib/db/schema";

const launchEnv = {
  DATA_LICENSE_CONFIRMED: "true",
  KAMIS_REGION_SOURCE: "free",
  WHOLESALE_RETAIL_MATCH_RATE: "0.8",
  UNIT_WEIGHT_SHARE: "0.7",
  BACKFILL_PAGING_CONFIRMED: "true",
  DATALAB_INTENT_CONFIRMED: "true",
  CPA_RATE_CONFIRMED: "true",
  UNIT_ECONOMICS_CONFIRMED: "true",
  ZERO_CLICK_REVIEWED: "true",
};

describe("public launch exposure policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks fixture pages and sitemap entries in production before launch", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await expect(loadPublicPagesSafe()).resolves.toEqual([]);
    await expect(loadKeywordPagesSafe()).resolves.toEqual([]);
    await expect(sitemap()).resolves.toEqual([]);
    await expect(robots()).resolves.toMatchObject({
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    });
  });

  it("allows published DB pages when DB gate decisions pass", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const db = await createMigratedTestDb();
    await seedPassingGateDecisions(db);
    await db.insert(pages).values({
      slug: "db-gated-published",
      title: "DB gated published",
      status: "published",
      gatePassed: true,
      activeSections: ["comparison_summary"],
      uniquePoints: ["daily delta", "monthly delta", "normal-year delta"],
    });

    const publicPages = await loadPublicPagesSafe(db);

    expect(publicPages.map((page) => page.slug)).toContain(
      "db-gated-published",
    );
  });

  it("keeps env-only robots blocked before launch", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const result = await robots();

    expect(result.rules).toEqual({
      userAgent: "*",
      disallow: "/",
    });
  });

  it("allows fixture preview when explicitly enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_FIXTURE_PUBLIC", "true");

    await expect(loadPublicPagesSafe()).resolves.not.toHaveLength(0);
    await expect(loadKeywordPagesSafe()).resolves.not.toHaveLength(0);
  });

  it("keeps quality-passed DB pages hidden until drip-feed publishes them", async () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const [key, value] of Object.entries(launchEnv)) {
      vi.stubEnv(key, value);
    }

    const db = await createMigratedTestDb();
    await db.insert(pages).values({
      slug: "production-candidate",
      title: "Production candidate",
      status: "quality_passed",
      gatePassed: true,
      activeSections: ["comparison_summary"],
      uniquePoints: ["daily delta", "monthly delta", "normal-year delta"],
    });

    const publicPages = await loadPublicPagesSafe(db);

    expect(publicPages).toEqual([]);
  });

  it("exposes published DB pages after launch gates pass", async () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const [key, value] of Object.entries(launchEnv)) {
      vi.stubEnv(key, value);
    }

    const db = await createMigratedTestDb();
    await db.insert(pages).values({
      slug: "production-candidate",
      title: "Production candidate",
      status: "published",
      gatePassed: true,
      activeSections: ["comparison_summary"],
      uniquePoints: ["daily delta", "monthly delta", "normal-year delta"],
    });

    const publicPages = await loadPublicPagesSafe(db);

    expect(publicPages).toHaveLength(1);
    expect(publicPages[0]?.slug).toBe("production-candidate");
  });

  it("exposes DB keyword pages only after they are published", async () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const [key, value] of Object.entries(launchEnv)) {
      vi.stubEnv(key, value);
    }

    const db = await createMigratedTestDb();
    await db.insert(pages).values([
      {
        slug: "timing-hidden-candidate",
        title: "Hidden timing candidate",
        status: "quality_passed",
        gatePassed: true,
        activeSections: ["comparison_summary"],
        uniquePoints: ["daily delta"],
      },
      {
        slug: "timing-published-candidate",
        title: "Published timing candidate",
        status: "published",
        gatePassed: true,
        activeSections: ["comparison_summary"],
        uniquePoints: ["monthly delta"],
      },
    ]);

    const keywordPages = await loadKeywordPagesSafe(db);

    expect(keywordPages.map((page) => page.slug)).toContain(
      "published-candidate",
    );
    expect(keywordPages.map((page) => page.slug)).not.toContain(
      "hidden-candidate",
    );
  });
});

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
    decision: "Confirmed by public launch test.",
    measuredValue,
  };
}
