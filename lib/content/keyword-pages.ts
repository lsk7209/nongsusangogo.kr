export type KeywordIntent =
  | "timing"
  | "compare"
  | "swap"
  | "season"
  | "guide"
  | "learn";

export type KeywordPage = {
  intent: KeywordIntent;
  slug: string;
  path: string;
  title: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchSummary: string;
  body: string[];
  relatedLinks: Array<{ href: string; label: string }>;
  status: "quality_passed" | "rejected";
};

export const keywordPages: KeywordPage[] = [
  {
    intent: "timing",
    slug: "baechu",
    path: "/timing/baechu",
    title: "배추 언제 사야 싸나: 평년 대비 가격 흐름",
    primaryKeyword: "배추 언제 사야 싸나",
    secondaryKeywords: ["배추 가격 타이밍", "배추 평년 대비", "배추 지금 비싼가"],
    searchSummary: "배추 현재가를 전일, 전월, 평년과 비교해 구매 타이밍을 서술형으로 점검합니다.",
    body: [
      "배추 가격은 오늘 시세만 보면 판단이 어렵습니다. 평년 대비 높거나 낮은 구간인지 함께 봐야 합니다.",
      "이 페이지는 가격 예측이나 구매 지시가 아니라, 관측값 기준의 타이밍 판단 근거를 정리합니다.",
    ],
    relatedLinks: [
      { href: "/blog/radish-soup-seasonal-choice", label: "국거리 채소 선택" },
      { href: "/swap/baechu", label: "배추 대체재" },
    ],
    status: "quality_passed",
  },
  {
    intent: "swap",
    slug: "baechu",
    path: "/swap/baechu",
    title: "배추 비쌀 때 대체재 비교",
    primaryKeyword: "배추 비쌀 때 대체",
    secondaryKeywords: ["배추 대체재", "양배추 배추 대체", "김장 배추 대안"],
    searchSummary: "배추 강세 구간에서 비교해볼 수 있는 대체재와 확인 기준을 정리합니다.",
    body: [
      "배추가 평년보다 높은 구간이면 같은 용도에 가까운 품목을 비교해볼 수 있습니다.",
      "대체재 추천은 가격과 용도 차이를 함께 보는 참고 정보이며 구매 지시가 아닙니다.",
    ],
    relatedLinks: [
      { href: "/blog/soup-vegetable-cost", label: "국거리 채소 비용" },
      { href: "/compare/baechu-vs-apple", label: "품목 가격 비교 예시" },
    ],
    status: "quality_passed",
  },
  {
    intent: "compare",
    slug: "baechu-vs-apple",
    path: "/compare/baechu-vs-apple",
    title: "배추 vs 사과 가격 흐름 비교",
    primaryKeyword: "배추 사과 가격 비교",
    secondaryKeywords: ["농산물 가격 비교", "품목별 시세 비교", "채소 과일 시세 비교"],
    searchSummary: "서로 다른 품목의 현재가와 평년 대비 위치를 같은 화면에서 비교합니다.",
    body: [
      "비교 페이지는 같은 품목군이 아니더라도 생활물가 체감 흐름을 나란히 볼 수 있게 합니다.",
      "단위가 다르면 원/kg 환산이 확인되기 전까지 직접 가격 비교로 단정하지 않습니다.",
    ],
    relatedLinks: [
      { href: "/blog/soup-vegetable-cost", label: "채소 비용 기준" },
      { href: "/blog/salad-greens-price-map", label: "샐러드 채소 가격" },
    ],
    status: "quality_passed",
  },
  {
    intent: "season",
    slug: "kimjang",
    path: "/season/kimjang",
    title: "김장 배추 가격 시기와 확인 포인트",
    primaryKeyword: "김장 배추 언제",
    secondaryKeywords: ["김장 배추 가격", "김장철 배추 시세", "김장 준비 시기"],
    searchSummary: "김장철 전후 배추 가격을 볼 때 확인해야 할 평년 대비, 결측, 등급 기준을 정리합니다.",
    body: [
      "제철이라고 항상 저점은 아닙니다. 실제 저점은 과거 시계열과 평년 대비 위치로 확인해야 합니다.",
      "시즌 페이지는 에디토리얼 영역이며 시세 팩트 페이지와 URL을 분리합니다.",
    ],
    relatedLinks: [
      { href: "/timing/baechu", label: "배추 구매 타이밍" },
      { href: "/blog/root-vegetable-budget", label: "뿌리채소 예산" },
    ],
    status: "quality_passed",
  },
  {
    intent: "guide",
    slug: "normal-price",
    path: "/guide/normal-price",
    title: "평년가격 뜻과 농산물 시세에서 보는 법",
    primaryKeyword: "평년가격 뜻",
    secondaryKeywords: ["농산물 평년가격", "평년 대비 뜻", "시세 평년 비교"],
    searchSummary: "농산물 시세에서 평년가격이 어떤 비교 기준으로 쓰이는지 설명합니다.",
    body: [
      "평년가격은 단순한 전년도 가격과 다릅니다. 여러 해의 관측값을 기준으로 현재 가격 위치를 해석할 때 사용합니다.",
      "정확한 산식은 데이터 제공 방식 확인 후 각주로 고지해야 합니다.",
    ],
    relatedLinks: [{ href: "/blog/tomato-retail-wholesale-gap", label: "가격 비교 예시" }],
    status: "quality_passed",
  },
  {
    intent: "learn",
    slug: "rank-difference",
    path: "/learn/rank-difference",
    title: "농산물 등급 상중하 차이와 시세 해석",
    primaryKeyword: "농산물 등급 상중하 차이",
    secondaryKeywords: ["농산물 등급 뜻", "상품 중품 하품 가격 차이", "시세 등급 기준"],
    searchSummary: "같은 품목이라도 등급에 따라 가격이 달라지는 이유와 대표 등급 정책을 설명합니다.",
    body: [
      "농산물 가격은 품목명만으로 같다고 볼 수 없습니다. 등급, 품종, 거래 구분이 함께 필요합니다.",
      "이 사이트는 대표 등급을 설정으로 선택하고, 나머지 등급은 검증 후 확장합니다.",
    ],
    relatedLinks: [{ href: "/guide/normal-price", label: "평년가격 뜻" }],
    status: "quality_passed",
  },
];

export function getQualityKeywordPages() {
  return keywordPages.filter((page) => page.status === "quality_passed");
}

export function getKeywordPage(intent: KeywordIntent, slug: string) {
  return getQualityKeywordPages().find(
    (page) => page.intent === intent && page.slug === slug,
  );
}

export function getKeywordPagesByIntent(intent: KeywordIntent) {
  return getQualityKeywordPages().filter((page) => page.intent === intent);
}
