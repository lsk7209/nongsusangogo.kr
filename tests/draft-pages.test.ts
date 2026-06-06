import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";
import { dataSources, itemCodes, pages, priceDaily } from "@/lib/db/schema";
import { generateDraftPagesFromPrices } from "@/lib/pages/draft-from-prices";

describe("draft page generation from collected prices", () => {
  it("creates one draft page per item and skips duplicates", async () => {
    const db = await createMigratedTestDb();
    const [source] = await db
      .insert(dataSources)
      .values({
        code: "KAMIS",
        name: "KAMIS",
      })
      .returning();

    await db.insert(itemCodes).values({
      itemCode: "ITEM-1",
      itemName: "배추",
      kindCode: "KIND-1",
      kindName: "봄배추",
      category: "vegetable",
      sourceId: source!.id,
    });
    await db.insert(priceDaily).values({
      date: "2026-06-05",
      itemCode: "ITEM-1",
      kindCode: "KIND-1",
      rank: "middle",
      wsrt: "retail",
      price: 3200,
      prevDay: 3100,
      normal3yr: 2800,
    });

    const first = await generateDraftPagesFromPrices(db);
    const second = await generateDraftPagesFromPrices(db);
    const page = await db.query.pages.findFirst({
      where: eq(pages.itemCode, "ITEM-1"),
    });

    expect(first).toMatchObject({ scannedItems: 1, created: 1, skipped: 0 });
    expect(second).toMatchObject({ scannedItems: 1, created: 0, skipped: 1 });
    expect(page?.status).toBe("draft");
    expect(page?.rawData).toMatchObject({
      comparisons: expect.arrayContaining([
        expect.objectContaining({ label: "평년", basis: 2800 }),
      ]),
    });
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

