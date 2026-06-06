import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";
import { dataSources, itemCodes, priceDaily } from "@/lib/db/schema";
import { generateKeywordDraftPages } from "@/lib/pages/keyword-drafts";

describe("keyword draft generation", () => {
  it("creates timing and swap drafts for strong price movements", async () => {
    const db = await createMigratedTestDb();
    const [source] = await db
      .insert(dataSources)
      .values({ code: "KAMIS", name: "KAMIS" })
      .returning();

    await db.insert(itemCodes).values({
      itemCode: "ITEM-STRONG",
      itemName: "배추",
      kindCode: "KIND",
      kindName: "봄배추",
      category: "vegetable",
      sourceId: source!.id,
    });
    await db.insert(itemCodes).values({
      itemCode: "ITEM-OTHER",
      itemName: "사과",
      kindCode: "KIND",
      kindName: "후지",
      category: "fruit",
      sourceId: source!.id,
    });
    await db.insert(priceDaily).values({
      date: "2026-06-05",
      itemCode: "ITEM-STRONG",
      kindCode: "KIND",
      rank: "middle",
      wsrt: "retail",
      price: 3600,
      normal3yr: 2800,
    });

    const result = await generateKeywordDraftPages(db);

    expect(result).toMatchObject({ scannedItems: 2, created: 4, skipped: 0 });
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
