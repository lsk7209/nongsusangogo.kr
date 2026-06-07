import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관",
  description:
    "농수산고고 서비스 이용 기준, 콘텐츠 책임 범위, 데이터 출처와 광고 정책 안내입니다.",
  alternates: {
    canonical: "https://nongsusangogo.kr/terms",
  },
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <h1>이용약관</h1>
      <p>
        농수산고고는 농수산물 가격 흐름과 장보기 판단 기준을 설명하는 정보
        사이트입니다. 사이트 이용자는 아래 기준에 동의한 것으로 봅니다.
      </p>
      <section className="panel">
        <h2>콘텐츠 이용</h2>
        <p>
          본 사이트의 글, 표, 체크리스트, FAQ는 생활 정보 제공을 목적으로 합니다.
          실제 구매 가격, 판매 가격, 재고, 품질은 지역과 시점, 판매처에 따라
          달라질 수 있습니다.
        </p>
      </section>
      <section className="panel">
        <h2>책임 범위</h2>
        <p>
          농수산고고는 정확한 정보를 제공하기 위해 공식 출처와 편집 검토를
          활용하지만, 모든 가격과 상황을 실시간으로 보증하지 않습니다. 이용자는
          최종 구매 전 판매처 표시 가격과 상품 상태를 직접 확인해야 합니다.
        </p>
      </section>
      <section className="panel">
        <h2>광고와 외부 링크</h2>
        <p>
          사이트에는 광고와 외부 공식 출처 링크가 포함될 수 있습니다. 외부
          사이트의 정책, 가격, 상품 정보, 개인정보 처리에 대해서는 해당 사이트의
          고지와 약관이 적용됩니다.
        </p>
      </section>
      <section className="panel">
        <h2>변경</h2>
        <p>
          약관은 서비스 운영 상황에 따라 변경될 수 있으며, 변경 시 본 페이지에
          반영합니다. 본 약관은 2026년 6월 7일부터 적용됩니다.
        </p>
      </section>
    </main>
  );
}
