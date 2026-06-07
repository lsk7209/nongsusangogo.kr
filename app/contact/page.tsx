import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문의",
  description:
    "농수산고고 서비스, 데이터 출처, 콘텐츠 정정, 광고 관련 문의 안내입니다.",
  alternates: {
    canonical: "https://nongsusangogo.kr/contact",
  },
};

export default function ContactPage() {
  return (
    <main className="legal-page">
      <h1>문의</h1>
      <p>
        농수산고고는 농수산물 가격 정보, 장보기 기준, 보관과 대체재 콘텐츠를
        다룹니다. 데이터 출처, 콘텐츠 정정, 광고, 제휴 관련 문의는 아래 기준에
        맞춰 접수합니다.
      </p>
      <section className="panel">
        <h2>문의 범위</h2>
        <p>
          잘못된 표현, 출처 보강 요청, 삭제 요청, 광고 게재 관련 문의, 사이트
          오류 제보를 접수합니다. 특정 판매처의 실시간 재고나 개별 거래 가격은
          확인하지 않습니다.
        </p>
      </section>
      <section className="panel">
        <h2>연락처</h2>
        <p>
          운영자: 농수산고고 편집팀
          <br />
          이메일: contact@nongsusangogo.kr
        </p>
      </section>
      <section className="panel">
        <h2>정정 요청</h2>
        <p>
          콘텐츠 정정 요청 시 URL, 문제가 되는 문장, 확인 가능한 공식 출처를
          함께 보내면 더 빠르게 검토할 수 있습니다.
        </p>
      </section>
    </main>
  );
}
