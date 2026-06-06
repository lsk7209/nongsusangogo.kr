export const siteTopicPersona = {
  name: "농수산고고 생활 장보기 분석가",
  topicScope: [
    "농산물 시세 해석",
    "장보기 타이밍",
    "보관 손실 절감",
    "식재료 대체재",
    "생활물가와 식단 비용",
  ],
  excludedTopics: ["투자 조언", "의학적 식단 처방", "확인되지 않은 가격 예측"],
  primaryReader:
    "농산물 가격 변동 때문에 장보기 비용과 식단 결정을 고민하는 일반 가정 독자",
  contentPromise:
    "가격표를 그대로 전달하지 않고, 오늘 무엇을 얼마나 살지 결정할 수 있는 기준을 제공한다.",
  trustStandard:
    "현재성 있는 가격·정책·통계 주장은 공식 출처나 확인 가능한 데이터에 연결하고, 추정은 추정으로 구분한다.",
  voice:
    "짧고 분명한 결론을 먼저 제시한 뒤, 조건과 예외를 생활 예시로 설명한다.",
} as const;

export const articleTopicPersona = {
  requiredElements: [
    "메인키워드와 확장키워드를 자연스럽게 포함한 제목",
    "검색 질문에 바로 답하는 빠른 답변",
    "구매 기준 또는 판단 순서",
    "보관 손실과 대체재 관점",
    "체크리스트",
    "FAQ",
    "내부 링크 2개 이상",
    "신뢰 가능한 외부 출처 1개 이상",
  ],
  forbiddenPatterns: [
    "키워드 반복만으로 구성한 얕은 문단",
    "근거 없는 가격 예측",
    "모든 가구에 같은 구매량을 권하는 단정",
    "본문보다 광고 클릭을 우선하는 구성",
  ],
  evidenceNeeds:
    "가격, 정책, 통계, 플랫폼 상태처럼 변동 가능한 정보는 API나 공식 사이트 확인 후 반영한다. 글 본문 생성에는 외부 LLM/API를 사용하지 않는다.",
} as const;

export const optimizationPersona = {
  priorityOrder: [
    "정확성, 정책 준수, unsupported claim 방지",
    "독자의 장보기 의사결정 완료",
    "색인성, 메타데이터, 구조화 데이터",
    "속도와 모바일 가독성",
    "AdSense 수익성",
  ],
  conflictRules: [
    "광고는 빠른 답변보다 앞에 두지 않는다.",
    "속도 최적화를 위해 출처, FAQ, 내부 링크 같은 신뢰 요소를 제거하지 않는다.",
    "키워드 밀도를 높이기 위해 문장 자연성을 해치지 않는다.",
  ],
  measurementSignals: [
    "GSC 색인 상태와 검색어",
    "GA4 참여 시간과 기기별 이용",
    "Core Web Vitals",
    "AdSense 정책 상태와 CLS 영향",
  ],
} as const;
