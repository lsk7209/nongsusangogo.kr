import type { Metadata } from "next";
import { Disclosure } from "@/components/disclosure";

export const metadata: Metadata = {
  title: "농수산고고 소개",
  description:
    "농수산고고는 농수산물 가격 흐름, 장보기 타이밍, 보관 손실, 대체재 선택 기준을 설명하는 생활형 정보 사이트입니다.",
  alternates: {
    canonical: "https://nongsusangogo.kr/about",
  },
};

export default function AboutPage() {
  return (
    <main className="legal-page">
      <h1>농수산고고 소개</h1>
      <p>
        농수산고고는 농수산물 가격 흐름을 생활 장보기 관점으로 해석하는
        정보 사이트입니다. 단순히 가격 숫자를 나열하기보다 언제 사고, 얼마나
        나누어 보관하고, 어떤 대체재를 함께 봐야 하는지 설명합니다.
      </p>
      <section className="panel">
        <h2>다루는 주제</h2>
        <p>
          채소, 과일, 수산물, 축산물, 곡물, 양념류의 가격 변동과 가정용 구매
          기준을 다룹니다. 폭염, 장마, 명절, 외식 수요처럼 가격에 영향을 주는
          상황도 함께 설명합니다.
        </p>
      </section>
      <section className="panel">
        <h2>편집 기준</h2>
        <p>
          글은 독자가 바로 적용할 수 있는 의사결정 기준, 보관 체크리스트,
          비교표, FAQ, 내부 관련 글, 공식 출처 링크를 포함하도록 관리합니다.
          확인되지 않은 실시간 가격은 확정값처럼 표현하지 않습니다.
        </p>
      </section>
      <Disclosure />
    </main>
  );
}
