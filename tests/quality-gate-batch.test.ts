import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { markQualityGateResults } from "@/lib/content/db-pages";
import * as schema from "@/lib/db/schema";
import { pages } from "@/lib/db/schema";

describe("batch quality gate transitions", () => {
  it("moves enriched rows into quality_passed or rejected statuses", async () => {
    const db = await createMigratedTestDb();
    await db.insert(pages).values([
      page("passing-page", true),
      page("failing-page", false),
      {
        ...page("draft-page", false),
        status: "draft",
      },
    ]);

    const result = await markQualityGateResults(db);
    const passing = await db.query.pages.findFirst({
      where: eq(pages.slug, "passing-page"),
    });
    const failing = await db.query.pages.findFirst({
      where: eq(pages.slug, "failing-page"),
    });
    const draft = await db.query.pages.findFirst({
      where: eq(pages.slug, "draft-page"),
    });

    expect(result).toEqual({
      checked: 2,
      passed: 1,
      failed: 1,
    });
    expect(passing?.status).toBe("quality_passed");
    expect(failing?.status).toBe("rejected");
    expect(draft?.status).toBe("draft");
  });
});

function page(slug: string, gatePassed: boolean) {
  return {
    slug,
    title: slug,
    status: "enriched" as const,
    gatePassed,
    qualityScore: gatePassed ? 1 : 0.2,
    activeSections: ["comparison_summary"],
    uniquePoints: ["daily delta"],
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
