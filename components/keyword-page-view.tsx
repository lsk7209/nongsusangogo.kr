import type { KeywordPage } from "@/lib/content/keyword-pages";
import { Disclosure } from "@/components/disclosure";
import { PriceSourceGuide } from "@/components/price-source-guide";

const intentLabels = {
  timing: "구매 타이밍",
  compare: "가격 비교",
  swap: "대체재 선택",
  season: "제철·행사 준비",
  guide: "개념 가이드",
  learn: "기초 학습",
} as const;

const officialLinks = [
  {
    href: "https://www.kamis.or.kr/",
    label: "KAMIS 농산물유통정보",
    description: "품목별 도매·소매 가격과 기간별 흐름을 확인합니다.",
  },
  {
    href: "https://www.mafra.go.kr/",
    label: "농림축산식품부",
    description: "수급 안정 대책, 농산물 정책, 명절·계절 수요 배경을 확인합니다.",
  },
  {
    href: "https://www.nongnet.or.kr/",
    label: "농넷",
    description: "농산물 수급과 유통 통계를 보조 지표로 대조합니다.",
  },
];

function buildParagraphHeading(page: KeywordPage, index: number) {
  const labels = [
    `${page.primaryKeyword} 판단 기준`,
    `${page.primaryKeyword} 확인할 한계`,
    `${page.primaryKeyword} 장보기 적용 방법`,
    `${page.primaryKeyword} 다음 점검`,
  ];

  return labels[index] ?? `${page.primaryKeyword} 참고 메모 ${index + 1}`;
}

export function KeywordPageView({ page }: { page: KeywordPage }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": page.intent === "guide" || page.intent === "learn" ? "Article" : "FAQPage",
    headline: page.title,
    description: page.searchSummary,
    keywords: [page.primaryKeyword, ...page.secondaryKeywords],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="eyebrow">{page.intent}</p>
      <h1>{page.title}</h1>
      <p>{page.searchSummary}</p>
      <nav className="panel article-toc table-of-contents" aria-label="페이지 목차">
        <ol>
          <li><a href="#market-check">공식 시세 확인</a></li>
          <li><a href="#buying-decision">장보기 판단 기준</a></li>
          <li><a href="#household-risk">가구별 손실 점검</a></li>
          <li><a href="#official-sources">공식 자료 대조</a></li>
        </ol>
      </nav>
      <section className="panel" id="market-check">
        <h2>{page.primaryKeyword} 먼저 확인할 기준</h2>
        <p>
          이 페이지는 {intentLabels[page.intent]} 검색 의도에 맞춰 하루 가격만
          단정하지 않고, 평년 대비 위치, 거래 단위, 신선도 손실, 대체재 가능성,
          공식 출처 확인 여부를 함께 보는 장보기 기준을 정리합니다.
        </p>
        <p>
          농수산물 가격은 지역, 등급, 포장 단위, 조사일에 따라 달라집니다.
          따라서 이 글은 구매 지시가 아니라 확인 순서를 제공하며, 실제 결제
          전에는 거주 지역의 마트·시장 가격과 보관 가능 기간을 함께 확인해야
          합니다.
        </p>
      </section>
      <section className="panel" id="buying-decision">
        <h2>{page.primaryKeyword} 장보기 판단 기준</h2>
        <p>
          {page.primaryKeyword} 가격을 볼 때는 오늘 가격 하나보다 비교 기준을 먼저 정해야 합니다.
          KAMIS 같은 공식 시세는 조사 지역, 등급, 거래 단위, 도매와 소매 구분에 따라 숫자가 달라질 수
          있으므로, 실제 구매 전에는 현재가, 전월 평균, 평년 범위, 최근 등락 방향을 나눠 확인하는 편이
          안전합니다. nongsusangogo.kr 농수산고고는 이 과정을 생활 장보기 기준으로 풀어, 가격표를 본 뒤
          바로 살지, 며칠 기다릴지, 대체 품목으로 바꿀지 판단할 수 있게 정리합니다.
        </p>
        <p>
          특히 {page.primaryKeyword} 관련 검색은 품목 가격만 확인하고 끝나는 경우가 많지만, 실제
          지출은 보관 손실과 조리 계획에서 크게 달라집니다. 싸게 산 품목이라도 가족 구성원이 먹는
          속도보다 많이 사면 냉장고 안에서 손실이 생기고, 손질 후 버리는 부분이 많으면 체감 단가는
          올라갑니다. 따라서 공식 시세가 낮아 보일 때도 소포장, 대용량, 대체재, 냉동 가능 여부를 함께
          비교해야 합니다.
        </p>
      </section>
      <section className="panel" id="household-risk">
        <h2>{page.primaryKeyword} 가구별 손실 점검</h2>
        <ul>
          <li>1인가구는 최저가보다 소포장과 소비 속도를 먼저 봅니다.</li>
          <li>2인가구는 한 주 식단에서 같은 재료를 두 번 이상 쓸 수 있는지 확인합니다.</li>
          <li>4인가족은 대량 구매가 유리할 수 있지만 냉장 공간과 손질 시간을 같이 계산합니다.</li>
          <li>명절, 김장, 캠핑처럼 수요가 몰리는 시기는 전주 가격과 당일 가격을 분리해 봅니다.</li>
        </ul>
        <p>
          이 기준은 검색 상위에 노출되는 단순 가격 요약보다 실제 사용성이 높은 정보입니다. 독자는
          공식 데이터의 숫자를 확인한 뒤 자신의 가구 규모와 메뉴 계획에 맞춰 구매량을 줄이거나 늘릴 수
          있고, 같은 예산 안에서 낭비를 줄이는 선택을 할 수 있습니다.
        </p>
      </section>
      <section className="panel">
        <h2>{page.primaryKeyword} 실제 비교 예시</h2>
        <p>
          예를 들어 {page.primaryKeyword} 가격이 평년보다 높게 보이면 바로 비싸다고 단정하지 말고,
          조사 단위가 1kg인지 한 포기인지, 도매 기준인지 소매 기준인지, 같은 등급의 상품인지 먼저
          맞춰야 합니다. 단위가 다르면 같은 금액처럼 보여도 실제 장바구니 비용은 달라지고, 도매가는
          소비자가 계산대에서 만나는 가격과 시간차가 생길 수 있습니다.
        </p>
        <p>
          가격이 오르는 구간에서는 구매를 미루는 것만 답이 아닙니다. 이번 주 식단에서 꼭 필요한
          양만 사고, 남는 재료를 국거리, 볶음, 절임, 냉동 보관으로 돌릴 수 있는지 확인하면 손실을
          줄일 수 있습니다. 반대로 가격이 내려간 구간이라도 보관 기간이 짧거나 손질 후 버리는 양이
          많은 품목은 대량 구매가 불리할 수 있습니다.
        </p>
        <p>
          nongsusangogo.kr 농수산고고는 이런 판단 과정을 독자가 다시 확인할 수 있도록 공식 출처,
          생활비 관점, 대체재, 보관 손실을 같은 페이지 안에서 연결합니다. 검색자는 단순한 오늘의
          가격표가 아니라 왜 그 가격을 조심해서 읽어야 하는지, 어떤 조건에서 구매 결정을 바꿔야
          하는지까지 확인할 수 있습니다.
        </p>
        <p>
          마지막으로 실제 매장 가격을 볼 때는 할인 행사, 묶음 판매, 배송비, 손질 비용을 분리해서
          적어두면 좋습니다. 표시 가격은 낮아도 필요한 양보다 많거나 보관이 어려우면 총비용은
          올라갈 수 있고, 반대로 단가가 조금 높아도 바로 먹을 수 있는 소량 상품이 더 합리적일 수
          있습니다.
        </p>
        <p>
          기록을 남길 때는 날짜, 구매처, 단위, 실제 결제 금액, 남은 양을 함께 적어두면 다음 장보기
          판단이 쉬워집니다. 같은 {page.primaryKeyword}라도 온라인 배송, 동네 마트, 전통시장,
          대형마트 행사가 서로 다른 비용 구조를 가지므로 한 번의 가격표만으로 결론을 내리기보다
          두세 곳의 조건을 비교하는 것이 안전합니다.
        </p>
      </section>
      <section className="panel">
        <h2>핵심 키워드</h2>
        <p>{page.primaryKeyword}</p>
        <p>{page.secondaryKeywords.join(", ")}</p>
      </section>
      <section className="section-stack">
        {page.body.map((paragraph, index) => (
          <section className="panel" key={paragraph}>
            <h2>{buildParagraphHeading(page, index)}</h2>
            <p>{paragraph}</p>
          </section>
        ))}
      </section>
      <section className="panel">
        <h2>{page.primaryKeyword} 장보기 확인 순서</h2>
        <ol>
          <li>현재 가격을 전일·전월·평년 기준과 분리해서 봅니다.</li>
          <li>같은 품목이라도 등급, 산지, 포장 단위가 같은지 확인합니다.</li>
          <li>보관 중 버릴 가능성이 있으면 낮은 단가보다 필요한 양을 우선합니다.</li>
          <li>대체재가 있다면 조리 목적과 손질 시간을 함께 비교합니다.</li>
        </ol>
      </section>
      <PriceSourceGuide itemName={page.primaryKeyword} />
      <section className="panel" id="official-sources">
        <h2>{page.primaryKeyword} 공식 자료 대조</h2>
        <p>
          검색 결과나 커뮤니티 체감 가격은 빠르게 변하지만 기준이 섞이기 쉽습니다.
          아래 공식 자료를 함께 열어 조사일, 지역, 거래 구분, 단위가 같은지
          확인하면 과장된 가격 해석을 줄일 수 있습니다.
        </p>
        <div className="card-grid">
          {officialLinks.map((link) => (
            <a className="card" href={link.href} key={link.href} target="_blank" rel="noopener noreferrer">
              <h3>{link.label}</h3>
              <p>{link.description}</p>
            </a>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>관련 페이지</h2>
        <div className="card-grid">
          {page.relatedLinks.map((link) => (
            <a className="card" href={link.href} key={link.href}>
              <h3>{link.label}</h3>
            </a>
          ))}
        </div>
      </section>
      <Disclosure />
    </main>
  );
}
