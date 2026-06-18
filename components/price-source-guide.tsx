const OFFICIAL_SOURCES = [
  {
    name: "KAMIS 농산물유통정보",
    href: "https://www.kamis.or.kr/",
    description: "품목별 도매·소매 가격과 기간별 흐름을 확인하는 기본 출처입니다.",
  },
  {
    name: "농림축산식품부",
    href: "https://www.mafra.go.kr/",
    description: "수급 안정 대책, 농산물 정책, 계절별 가격 변동 배경을 확인합니다.",
  },
  {
    name: "농넷",
    href: "https://www.nongnet.or.kr/",
    description: "농산물 수급과 유통 관련 통계를 보조 지표로 대조합니다.",
  },
];

export function PriceSourceGuide({ itemName = "농수산물" }: { itemName?: string }) {
  return (
    <section className="panel">
      <h2>공식 출처와 가격 해석 기준</h2>
      <p>
        {itemName} 가격은 하루 숫자만 보면 장보기 판단에 도움이 되기 어렵습니다. 농수산고고는
        KAMIS와 공공 통계를 우선 기준으로 보고, 도매가와 소매가의 차이, 산지·시장·소비지
        가격차, 날씨와 명절 수요 같은 변동 요인을 함께 설명합니다.
      </p>
      <p>
        실제 구매 전에는 거주 지역의 마트·시장 가격, 포장 단위, 보관 가능 기간을 함께 확인해야
        합니다. 특히 잎채소·과일·수산물은 신선도 손실이 빠르기 때문에 낮은 단가보다 소비 시점과
        보관 조건이 더 중요한 경우가 많습니다.
      </p>
      <div className="card-grid">
        {OFFICIAL_SOURCES.map((source) => (
          <a className="card" href={source.href} key={source.href} target="_blank" rel="noopener noreferrer">
            <h3>{source.name}</h3>
            <p>{source.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
