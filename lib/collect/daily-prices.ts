import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import {
  collectCheckpoints,
  dataSources,
  itemCodes,
  itemMeta,
  priceDaily,
} from "@/lib/db/schema";
import type { KamisClient } from "@/lib/kamis/types";
import { parseSparseNumber } from "@/lib/normalize/price";
import {
  StubUnitNormalizer,
  type UnitNormalizer,
} from "@/lib/normalize/unit-normalizer";

export type CollectDailyPricesOptions = {
  db: Database;
  client: KamisClient;
  scopeKey: string;
  batchLimit?: number;
  normalizer?: UnitNormalizer;
};

export type CollectDailyPricesResult = {
  fetched: number;
  insertedOrSkipped: number;
  nextCursor: string | null;
  resumedFrom: string | null;
};

export async function collectDailyPrices({
  db,
  client,
  scopeKey,
  batchLimit,
  normalizer = new StubUnitNormalizer(),
}: CollectDailyPricesOptions): Promise<CollectDailyPricesResult> {
  const checkpoint = await db.query.collectCheckpoints.findFirst({
    where: and(
      eq(collectCheckpoints.sourceCode, "KAMIS"),
      eq(collectCheckpoints.scopeKey, scopeKey),
    ),
  });

  const response = await client.fetchDailyPrices({
    cursor: checkpoint?.cursor,
    limit: batchLimit,
  });

  const sourceRows = await db
    .insert(dataSources)
    .values({
      code: response.sourceCode,
      name: "KAMIS",
      licenseStatus: "unconfirmed",
    })
    .onConflictDoUpdate({
      target: dataSources.code,
      set: { name: "KAMIS" },
    })
    .returning();

  const sourceId = sourceRows[0]?.id;

  if (!sourceId) {
    throw new Error("Failed to upsert KAMIS data source.");
  }

  let stored = 0;

  for (const record of response.records) {
    await db
      .insert(itemCodes)
      .values({
        itemCode: record.itemCode,
        itemName: record.itemName,
        kindCode: record.kindCode,
        kindName: record.kindName,
        category: record.category,
        sourceId,
      })
      .onConflictDoUpdate({
        target: itemCodes.itemCode,
        set: {
          itemName: record.itemName,
          kindCode: record.kindCode,
          kindName: record.kindName,
          category: record.category,
          sourceId,
        },
      });

    const normalized = normalizer.normalize({
      unit: record.unit,
      unitType: record.unitType,
      price: parseSparseNumber(record.price),
    });

    await db
      .insert(itemMeta)
      .values({
        itemCode: record.itemCode,
        unit: normalized.unit,
        unitType: normalized.unitType,
        weightG: normalized.weightG,
        category: record.category,
      })
      .onConflictDoUpdate({
        target: itemMeta.itemCode,
        set: {
          unit: normalized.unit,
          unitType: normalized.unitType,
          weightG: normalized.weightG,
          category: record.category,
        },
      });

    const existingObservation = await db.query.priceDaily.findFirst({
      where: and(
        eq(priceDaily.date, record.date),
        eq(priceDaily.itemCode, record.itemCode),
        eq(priceDaily.kindCode, record.kindCode),
        eq(priceDaily.rank, record.rank),
        eq(priceDaily.wsrt, record.wsrt),
        record.regionCode === null
          ? isNull(priceDaily.regionCode)
          : eq(priceDaily.regionCode, record.regionCode),
      ),
    });

    if (!existingObservation) {
      await db.insert(priceDaily).values({
        date: record.date,
        itemCode: record.itemCode,
        kindCode: record.kindCode,
        rank: record.rank,
        wsrt: record.wsrt,
        regionCode: record.regionCode,
        price: parseSparseNumber(record.price),
        pricePerKg: normalized.pricePerKg,
        prevDay: parseSparseNumber(record.prevDay),
        m1Ma5: parseSparseNumber(record.m1Ma5),
        y1Ma5: parseSparseNumber(record.y1Ma5),
        normal3yr: parseSparseNumber(record.normal3yr),
        rawPayload: record,
      });
      stored += 1;
    }
  }

  await db
    .insert(collectCheckpoints)
    .values({
      sourceCode: response.sourceCode,
      scopeKey,
      cursor: response.nextCursor,
      lastSuccessAt: new Date(),
      state: {
        fetched: response.records.length,
      },
    })
    .onConflictDoUpdate({
      target: [collectCheckpoints.sourceCode, collectCheckpoints.scopeKey],
      set: {
        cursor: response.nextCursor,
        lastSuccessAt: new Date(),
        state: {
          fetched: response.records.length,
        },
      },
    });

  return {
    fetched: response.records.length,
    insertedOrSkipped: stored,
    nextCursor: response.nextCursor,
    resumedFrom: checkpoint?.cursor ?? null,
  };
}
