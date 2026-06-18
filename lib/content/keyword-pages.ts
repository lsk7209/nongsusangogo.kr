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
      "김치, 겉절이, 국거리처럼 용도가 정해져 있다면 필요한 포기 수와 보관 가능 기간을 먼저 계산합니다. 가격이 내려갈 때까지 기다리다 품질이 떨어진 배추를 사면 실제 식탁 비용은 더 높아질 수 있습니다.",
      "최종 구매 전에는 KAMIS 기준 가격과 집 근처 마트·시장 가격의 단위가 같은지 확인하세요. 포기, 망, kg 단위가 섞이면 체감 가격 비교가 크게 흔들립니다.",
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
      "쌈용이라면 양배추나 상추류를, 국물용이라면 무나 알배추를 비교할 수 있지만 식감과 조리 시간이 다릅니다. 단가만 보고 바꾸기보다 실제 메뉴에서 버리는 부분과 손질 시간을 함께 계산해야 합니다.",
      "대체재를 고를 때는 같은 주의 소매가, 보관 기간, 가족이 실제로 소비할 양을 함께 보세요. 싸게 산 품목을 남겨 버리면 절약 효과가 사라집니다.",
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
      "배추와 사과는 조리 목적도, 유통 단위도 다르기 때문에 단순 가격 우열을 말하기 어렵습니다. 대신 평년 대비 얼마나 높은지, 전월 대비 상승 폭이 어느 정도인지, 장바구니 예산에서 차지하는 비중이 커졌는지를 분리해 봅니다.",
      "서로 다른 품목을 비교할 때는 대체 구매가 가능한지부터 확인해야 합니다. 반찬 재료와 간식 과일은 역할이 다르므로 생활비 압박을 읽는 참고 지표로만 사용하는 편이 안전합니다.",
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
      "김장철에는 수요가 한꺼번에 몰리고 날씨, 산지 출하, 예약 판매가 함께 움직입니다. 날짜만 보고 사기보다 필요한 양, 절임 여부, 보관 공간, 가족 일정까지 같이 정해야 실패 확률이 낮아집니다.",
      "김장 준비 가격을 볼 때는 배추뿐 아니라 무, 고춧가루, 마늘, 젓갈, 소금 가격도 함께 확인하세요. 한 품목이 싸도 부재료가 급등하면 전체 예산은 달라질 수 있습니다.",
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
      "현재가가 평년보다 높다는 말은 무조건 비싸다는 뜻이 아니라, 비교 기준 기간의 평균적인 위치보다 위에 있다는 의미입니다. 조사 품목, 등급, 지역, 단위가 같지 않으면 평년 대비 수치도 다르게 읽힐 수 있습니다.",
      "장보기에서는 평년가격을 절대 기준으로 쓰기보다 가격 변동의 방향을 이해하는 보조 지표로 쓰는 편이 좋습니다. 실제 구매 판단은 신선도, 필요한 양, 대체재 여부, 보관 손실까지 함께 봐야 합니다.",
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
      "상·중·하 같은 등급은 크기, 외관, 손상 정도, 용도 적합성을 반영하는 경우가 많습니다. 같은 사과나 배추라도 선물용, 가정용, 가공용의 가격 차이가 생기는 이유가 여기에 있습니다.",
      "등급이 낮다고 항상 나쁜 선택은 아닙니다. 바로 조리할 채소나 손질해 먹을 과일은 중품이 더 합리적일 수 있습니다. 반대로 보관 기간이 길거나 선물 목적이라면 외관과 균일성이 더 중요해집니다.",
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
