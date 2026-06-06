import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { itemCodes, pages, priceDaily } from "@/lib/db/schema";

export type KeywordDraftGenerationResult = {
  scannedItems: number;
  created: number;
  skipped: number;
};

export async function generateKeywordDraftPages(
  db: Database,
): Promise<KeywordDraftGenerationResult> {
  const items = await db.select().from(itemCodes);
  let created = 0;
  let skipped = 0;

  for (const item of items) {
    const observations = await db
      .select()
      .from(priceDaily)
      .where(eq(priceDaily.itemCode, item.itemCode));
    const latest = observations.at(-1);
    const candidates = [
      {
        slug: slugify(`timing-${item.itemName}-${item.itemCode}`),
        title: `${item.itemName} 언제 사야 싸나: 평년 대비 가격 흐름`,
        uniquePoints: [
          `${item.itemName} 최신 가격 ${latest?.price ?? "결측"}`,
          `${item.itemName} 전일 비교 ${latest?.prevDay ?? "결측"}`,
          `${item.itemName} 평년 비교 ${latest?.normal3yr ?? "결측"}`,
        ],
      },
      ...(isStrongAgainstNormal(latest)
        ? [
            {
              slug: slugify(`swap-${item.itemName}-${item.itemCode}`),
              title: `${item.itemName} 비쌀 때 대체재 비교`,
              uniquePoints: [
                `${item.itemName} 평년 대비 강세`,
                `${item.itemName} 대체재 비교 필요`,
                "가격 강세 구간 대체 품목 검토",
              ],
            },
          ]
        : []),
    ];

    for (const candidate of candidates) {
      const existing = await db.query.pages.findFirst({
        where: eq(pages.slug, candidate.slug),
      });

      if (existing) {
        skipped += 1;
        continue;
      }

      await db.insert(pages).values({
        slug: candidate.slug,
        itemCode: item.itemCode,
        title: candidate.title,
        status: "draft",
        qualityScore: null,
        gatePassed: false,
        activeSections: [],
        uniquePoints: candidate.uniquePoints,
        rawData: {
          uniqueDataPoints: candidate.uniquePoints,
          comparisons: [
            {
              label: "평년",
              current: latest?.price ?? null,
              basis: latest?.normal3yr ?? null,
            },
          ],
        },
        faq: [],
      });
      created += 1;
    }
  }

  for (let index = 0; index < items.length - 1; index += 1) {
    const left = items[index]!;
    const right = items[index + 1]!;
    const slug = slugify(`compare-${left.itemName}-vs-${right.itemName}`);
    const existing = await db.query.pages.findFirst({
      where: eq(pages.slug, slug),
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await db.insert(pages).values({
      slug,
      itemCode: left.itemCode,
      title: `${left.itemName} vs ${right.itemName} 가격 흐름 비교`,
      status: "draft",
      qualityScore: null,
      gatePassed: false,
      activeSections: [],
      uniquePoints: [
        `${left.itemName} 비교 기준 품목`,
        `${right.itemName} 비교 대상 품목`,
        "단위 검증 전 직접 가격 단정 금지",
      ],
      rawData: {
        uniqueDataPoints: [
          `${left.itemName} 비교 기준 품목`,
          `${right.itemName} 비교 대상 품목`,
          "단위 검증 전 직접 가격 단정 금지",
        ],
        comparisons: [
          {
            label: "품목 비교",
            current: null,
            basis: null,
          },
        ],
      },
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

type PriceRow = typeof priceDaily.$inferSelect | undefined;

function isStrongAgainstNormal(row: PriceRow) {
  return (
    row?.price !== null &&
    row?.price !== undefined &&
    row.normal3yr !== null &&
    row.normal3yr !== undefined &&
    row.price > row.normal3yr * 1.2
  );
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "") || "keyword-draft"
  );
}
