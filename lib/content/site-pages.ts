export type PriceObservation = {
  label: string;
  price: number | null;
};

export type SitePage = {
  slug: string;
  title: string;
  itemCode: string;
  itemName: string;
  category: "vegetable" | "fruit";
  status: "quality_passed" | "rejected";
  summary: string;
  unit: string;
  price: number | null;
  pricePerKg: number | null;
  observations: PriceObservation[];
  activeSections: string[];
  faq: Array<{ question: string; answer: string }>;
};

export const sitePages: SitePage[] = [
  {
    slug: "baechu-price",
    title: "배추 오늘 시세와 전년 대비 흐름",
    itemCode: "KAMIS-BAECHU",
    itemName: "배추",
    category: "vegetable",
    status: "quality_passed",
    summary: "전일, 전월 이동평균, 평년 값을 함께 보는 배추 시세 샘플입니다.",
    unit: "1포기",
    price: 3200,
    pricePerKg: null,
    observations: [
      { label: "현재", price: 3200 },
      { label: "전일", price: 3100 },
      { label: "전월", price: 3050 },
      { label: "평년", price: 2850 },
    ],
    activeSections: ["price_trend", "comparison_summary"],
    faq: commonFaq("배추"),
  },
  {
    slug: "apple-price",
    title: "사과 도매 시세와 평년 대비 흐름",
    itemCode: "KAMIS-APPLE",
    itemName: "사과",
    category: "fruit",
    status: "quality_passed",
    summary: "도매 관측값을 기준으로 평년 대비 가격 위치를 비교합니다.",
    unit: "10개",
    price: 28000,
    pricePerKg: null,
    observations: [
      { label: "현재", price: 28000 },
      { label: "전일", price: 27500 },
      { label: "전월", price: 26900 },
      { label: "평년", price: 23300 },
    ],
    activeSections: ["price_trend", "comparison_summary"],
    faq: commonFaq("사과"),
  },
  {
    slug: "mu-price",
    title: "무 시세 결측 구간 점검",
    itemCode: "KAMIS-MU",
    itemName: "무",
    category: "vegetable",
    status: "quality_passed",
    summary: "결측값을 보간하지 않고 비교 가능한 지표만 분리해 보여줍니다.",
    unit: "1개",
    price: null,
    pricePerKg: null,
    observations: [
      { label: "현재", price: null },
      { label: "전월", price: 1450 },
      { label: "전년", price: 1300 },
      { label: "평년", price: 1250 },
    ],
    activeSections: ["missing_data_notice", "comparison_summary"],
    faq: commonFaq("무"),
  },
  {
    slug: "weak-sample",
    title: "품질 미달 샘플",
    itemCode: "WEAK",
    itemName: "품질 미달",
    category: "vegetable",
    status: "rejected",
    summary: "sitemap과 허브에 포함되지 않아야 하는 샘플입니다.",
    unit: "unknown",
    price: null,
    pricePerKg: null,
    observations: [],
    activeSections: [],
    faq: [],
  },
];

export const hubs = [
  {
    slug: "vegetable",
    title: "채소 시세 허브",
    category: "vegetable",
    description: "채소 품목의 가격 흐름과 결측 구간을 비교합니다.",
  },
  {
    slug: "fruit",
    title: "과일 시세 허브",
    category: "fruit",
    description: "과일 품목의 도매·소매 관측값을 검증 가능한 범위에서 봅니다.",
  },
] as const;

export function getQualityPassedPages() {
  return sitePages.filter((page) => page.status === "quality_passed");
}

export function getSitePage(slug: string) {
  return getQualityPassedPages().find((page) => page.slug === slug);
}

export function getHub(slug: string) {
  return hubs.find((hub) => hub.slug === slug);
}

export function getHubPages(slug: string) {
  const hub = getHub(slug);

  if (!hub) {
    return [];
  }

  return getQualityPassedPages().filter((page) => page.category === hub.category);
}

function commonFaq(itemName: string) {
  return [
    {
      question: `${itemName} 가격은 어떤 기준으로 표시되나요?`,
      answer:
        "현재 구현은 검증용 샘플 기준입니다. 실제 연동 후에는 조사일, 등급, 거래 구분, 지역 차원 확인 결과에 따라 표시 범위가 달라집니다.",
    },
    {
      question: "결측 가격은 어떻게 처리하나요?",
      answer:
        "결측값은 임의로 보간하지 않습니다. 비교 가능한 이동평균이나 평년 지표가 있을 때만 별도 섹션에서 분리해 보여줍니다.",
    },
    {
      question: "원/kg 환산은 언제 활성화되나요?",
      answer:
        "단위 의미와 무게 기준이 확인되면 정규화 구현을 교체해 활성화합니다. 확인 전에는 환산 결과를 공개하지 않습니다.",
    },
  ];
}

