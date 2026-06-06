import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";
import { pages } from "@/lib/db/schema";
import {
  findKeywordPageSafe,
  getDbKeywordStaticParams,
} from "@/lib/content/db-keyword-pages";

describe("DB-backed keyword pages", () => {
  it("loads published keyword pages from DB slug prefixes", async () => {
    const db = await createMigratedTestDb();
    await db.insert(pages).values({
      slug: "timing-radish-item-1",
      title: "무 언제 사야 싸나",
      status: "published",
      gatePassed: true,
      activeSections: ["comparison_summary"],
      uniquePoints: ["무 최신 가격", "무 평년 비교", "무 전일 비교"],
    });

    const page = await findKeywordPageSafe(db, "timing", "radish-item-1");
    const params = await getDbKeywordStaticParams(db, "timing");

    expect(page?.path).toBe("/timing/radish-item-1");
    expect(params).toContain("radish-item-1");
  });

  it("does not expose quality-passed keyword pages before publish", async () => {
    const db = await createMigratedTestDb();
    await db.insert(pages).values({
      slug: "timing-hidden-item-1",
      title: "숨김 후보",
      status: "quality_passed",
      gatePassed: true,
      activeSections: ["comparison_summary"],
      uniquePoints: ["무 최신 가격"],
    });

    const page = await findKeywordPageSafe(db, "timing", "hidden-item-1");
    const params = await getDbKeywordStaticParams(db, "timing");

    expect(page).toBeUndefined();
    expect(params).not.toContain("hidden-item-1");
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
