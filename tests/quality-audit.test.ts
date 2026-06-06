import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";
import { pages } from "@/lib/db/schema";
import { auditPageQualityState } from "@/lib/quality/audit";

describe("quality audit", () => {
  it("passes valid publishable page states", async () => {
    const db = await createMigratedTestDb();
    await db.insert(pages).values([
      validPage("ready-page", "quality_passed"),
      {
        ...validPage("published-page", "published"),
        firstPublishedAt: new Date("2026-06-06T00:00:00.000Z"),
      },
    ]);

    const report = await auditPageQualityState(db);

    expect(report.passed).toBe(true);
    expect(report.violations).toEqual([]);
    expect(report.counts.quality_passed).toBe(1);
    expect(report.counts.published).toBe(1);
  });

  it("reports invalid publishable and rejected states", async () => {
    const db = await createMigratedTestDb();
    await db.insert(pages).values([
      {
        slug: "bad-published",
        title: "Bad published",
        status: "published",
        gatePassed: false,
        qualityScore: null,
        activeSections: [],
        uniquePoints: ["only one"],
      },
      {
        slug: "bad-rejected",
        title: "Bad rejected",
        status: "rejected",
        gatePassed: true,
        activeSections: [],
        uniquePoints: [],
      },
    ]);

    const report = await auditPageQualityState(db);

    expect(report.passed).toBe(false);
    expect(report.violations.map((violation) => violation.rule)).toEqual(
      expect.arrayContaining([
        "gate_passed",
        "quality_score",
        "active_sections",
        "unique_points",
        "first_published_at",
        "rejected_gate_state",
      ]),
    );
  });
});

function validPage(slug: string, status: "quality_passed" | "published") {
  return {
    slug,
    title: slug,
    status,
    gatePassed: true,
    qualityScore: 1,
    activeSections: ["comparison_summary"],
    uniquePoints: ["daily delta", "monthly delta", "normal-year delta"],
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
