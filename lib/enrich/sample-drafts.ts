import type { PageDraftInput } from "@/lib/gemini/types";

export function createSampleDrafts(count = 10): PageDraftInput[] {
  return Array.from({ length: count }, (_, index) => {
    const weak = index % 5 === 4;
    const itemName = weak ? `취약품목${index + 1}` : `테스트품목${index + 1}`;

    return {
      slug: `sample-${index + 1}`,
      title: `${itemName} 오늘 시세와 전년 대비 흐름`,
      itemCode: weak ? `WEAK-${index + 1}` : `ITEM-${index + 1}`,
      itemName,
      regionName: null,
      rawData: {
        uniqueDataPoints: weak
          ? [`${itemName} 단일 가격`]
          : [
              `${itemName} 현재가는 전일 대비 120원 변동`,
              `${itemName} 전월 이동평균 대비 4% 높은 구간`,
              `${itemName} 평년 가격보다 8% 높은 관측값`,
            ],
        comparisons: [
          {
            label: "전일",
            current: weak ? null : 3200 + index * 100,
            basis: 3080 + index * 100,
          },
          {
            label: "전년",
            current: weak ? null : 3200 + index * 100,
            basis: weak ? null : 2900 + index * 100,
          },
        ],
      },
    };
  });
}

