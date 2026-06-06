import { eq } from "drizzle-orm";
import { dataSources, itemCodes, itemMeta } from "@/lib/db/schema";
import { createSmokeDatabase } from "@/scripts/smoke-db";

const db = await createSmokeDatabase();

const source = await db
  .insert(dataSources)
  .values({
    code: "KAMIS",
    name: "KAMIS mock source",
    baseUrl: "https://www.kamis.or.kr",
    licenseStatus: "unconfirmed",
  })
  .onConflictDoUpdate({
    target: dataSources.code,
    set: { name: "KAMIS mock source" },
  })
  .returning();

const sourceId = source[0]?.id;

if (!sourceId) {
  throw new Error("Failed to seed data source.");
}

await db
  .insert(itemCodes)
  .values({
    itemCode: "MOCK-001",
    itemName: "테스트 배추",
    kindCode: "KIND-001",
    kindName: "테스트 품종",
    category: "vegetable",
    sourceId,
  })
  .onConflictDoNothing();

await db
  .insert(itemMeta)
  .values({
    itemCode: "MOCK-001",
    unit: "unknown",
    unitType: "unknown",
    category: "vegetable",
  })
  .onConflictDoNothing();

const seeded = await db.query.itemCodes.findFirst({
  where: eq(itemCodes.itemCode, "MOCK-001"),
  with: {
    meta: true,
  },
});

if (!seeded?.meta) {
  throw new Error("Phase 1 smoke test failed: seeded item was not readable.");
}

console.log(
  `Phase 1 smoke test passed: ${seeded.itemCode} / ${seeded.itemName}`,
);
