import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { itemCodes, pages, priceDaily } from "@/lib/db/schema";

export type DraftGenerationResult = {
  scannedItems: number;
  created: number;
  skipped: number;
};

export async function generateDraftPagesFromPrices(
  db: Database,
): Promise<DraftGenerationResult> {
  const items = await db.select().from(itemCodes);
  let created = 0;
  let skipped = 0;

  for (const item of items) {
    const existing = await db.query.pages.findFirst({
      where: eq(pages.itemCode, item.itemCode),
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    const observations = await db
      .select()
      .from(priceDaily)
      .where(eq(priceDaily.itemCode, item.itemCode));
    const latest = observations.at(-1);
    const rawData = buildRawData(item.itemName, observations);

    await db.insert(pages).values({
      slug: slugify(`${item.itemName}-${item.kindName}-${item.itemCode}`),
      itemCode: item.itemCode,
      title: `${item.itemName} ${item.kindName} 시세와 평년 대비 흐름`,
      status: "draft",
      qualityScore: null,
      gatePassed: false,
      activeSections: [],
      uniquePoints: rawData.uniqueDataPoints,
      rawData,
      aiCommentary: latest?.price
        ? `${item.itemName} ${item.kindName}의 최신 관측 가격은 ${latest.price.toLocaleString("ko-KR")}원입니다.`
        : null,
      faq: [],
    });
    created += 1;
  }

  return {
    scannedItems: items.length,
    created,
    skipped,
  };
}

type ItemRow = typeof itemCodes.$inferSelect;
type PriceRow = typeof priceDaily.$inferSelect;

function buildRawData(itemName: string, observations: PriceRow[]) {
  const latest = observations.at(-1);
  const points = [
    latest?.price !== null && latest?.price !== undefined
      ? `${itemName} 최신 관측 가격 ${latest.price}원`
      : `${itemName} 최신 가격 결측`,
    latest?.prevDay !== null && latest?.prevDay !== undefined
      ? `${itemName} 전일 비교값 ${latest.prevDay}원`
      : `${itemName} 전일 비교값 결측`,
    latest?.normal3yr !== null && latest?.normal3yr !== undefined
      ? `${itemName} 평년 비교값 ${latest.normal3yr}원`
      : `${itemName} 평년 비교값 결측`,
  ];

  return {
    uniqueDataPoints: points,
    comparisons: [
      {
        label: "전일",
        current: latest?.price ?? null,
        basis: latest?.prevDay ?? null,
      },
      {
        label: "평년",
        current: latest?.price ?? null,
        basis: latest?.normal3yr ?? null,
      },
    ],
  };
}

function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "draft-page";
}

