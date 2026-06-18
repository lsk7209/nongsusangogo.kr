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
      <section className="panel">
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
      <section className="panel">
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
