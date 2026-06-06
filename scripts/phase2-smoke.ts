import { and, count, eq, isNull } from "drizzle-orm";
import { collectDailyPrices } from "@/lib/collect/daily-prices";
import { priceDaily } from "@/lib/db/schema";
import { createKamisClient } from "@/lib/kamis/client";
import { createSmokeDatabase } from "@/scripts/smoke-db";

const db = await createSmokeDatabase();
const client = createKamisClient({});
const scopeKey = `phase2-smoke-${Date.now()}`;

const first = await collectDailyPrices({
  db,
  client,
  scopeKey,
});

const second = await collectDailyPrices({
  db,
  client,
  scopeKey,
});

const total = await db.select({ value: count() }).from(priceDaily);
const sparseRows = await db.select().from(priceDaily).where(andIsSparseMu());

if (first.fetched !== 2 || first.nextCursor !== "page-2") {
  throw new Error("Phase 2 smoke failed: first checkpoint page mismatch.");
}

if (second.fetched !== 1 || second.resumedFrom !== "page-2") {
  throw new Error("Phase 2 smoke failed: checkpoint resume mismatch.");
}

if ((total[0]?.value ?? 0) < 3) {
  throw new Error("Phase 2 smoke failed: collected rows were not stored.");
}

if (!sparseRows[0] || sparseRows[0].price !== null) {
  throw new Error("Phase 2 smoke failed: sparse '-' price was not preserved.");
}

console.log(
  `Phase 2 smoke test passed: ${first.fetched + second.fetched} mock rows collected`,
);

function andIsSparseMu() {
  return and(eq(priceDaily.itemCode, "KAMIS-MU"), isNull(priceDaily.price));
}
