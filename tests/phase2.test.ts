import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { count, eq } from "drizzle-orm";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { collectDailyPrices } from "@/lib/collect/daily-prices";
import * as schema from "@/lib/db/schema";
import { collectCheckpoints, priceDaily } from "@/lib/db/schema";
import { MockKamisClient } from "@/lib/kamis/client";
import { parseSparseNumber } from "@/lib/normalize/price";
import { StubUnitNormalizer } from "@/lib/normalize/unit-normalizer";
import { canJoinWholesaleRetail } from "@/lib/price/wholesale-retail";

describe("phase 2 data layer", () => {
  it("preserves sparse missing values", () => {
    expect(parseSparseNumber("-")).toBeNull();
    expect(parseSparseNumber("3,200")).toBe(3200);
  });

  it("keeps uncertain semantics behind guards and stubs", () => {
    const normalized = new StubUnitNormalizer().normalize({
      unit: "1포기",
      unitType: "unknown",
      price: 3200,
    });

    expect(normalized.weightG).toBeNull();
    expect(normalized.pricePerKg).toBeNull();
    expect(canJoinWholesaleRetail()).toBe(false);
  });

  it("collects mock pages and resumes from checkpoint", async () => {
    const db = await createMigratedTestDb();
    const client = new MockKamisClient();

    const first = await collectDailyPrices({
      db,
      client,
      scopeKey: "daily-test",
    });
    const second = await collectDailyPrices({
      db,
      client,
      scopeKey: "daily-test",
    });

    const rows = await db.select({ value: count() }).from(priceDaily);
    const sparse = await db
      .select()
      .from(priceDaily)
      .where(eq(priceDaily.itemCode, "KAMIS-MU"));
    const checkpoint = await db.query.collectCheckpoints.findFirst({
      where: eq(collectCheckpoints.scopeKey, "daily-test"),
    });

    expect(first).toMatchObject({
      fetched: 2,
      nextCursor: "page-2",
      resumedFrom: null,
    });
    expect(second).toMatchObject({
      fetched: 1,
      nextCursor: null,
      resumedFrom: "page-2",
    });
    expect(rows[0]?.value).toBe(3);
    expect(sparse[0]?.price).toBeNull();
    expect(checkpoint?.cursor).toBeNull();
  });
});

async function createMigratedTestDb() {
  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, { schema });
  const migration = readFileSync(
    path.join(process.cwd(), "drizzle", "0000_daily_molten_man.sql"),
    "utf8",
  );

  const statements = migration
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await client.execute(statement);
  }

  await client.execute(
    "CREATE UNIQUE INDEX IF NOT EXISTS collect_checkpoints_unique_scope ON collect_checkpoints (source_code, scope_key)",
  );

  return db;
}
