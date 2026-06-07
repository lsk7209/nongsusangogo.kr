import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description:
    "농수산고고의 개인정보 수집 항목, 이용 목적, 보관 기준, 광고 및 분석 도구 사용 방침입니다.",
  alternates: {
    canonical: "https://nongsusangogo.kr/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <h1>개인정보 처리방침</h1>
      <p>
        농수산고고는 농수산물 가격 정보와 장보기 기준을 제공하는 콘텐츠
        사이트입니다. 회원가입 기능을 운영하지 않으며, 이름, 주민등록번호,
        결제정보 같은 민감한 개인정보를 직접 요구하지 않습니다.
      </p>
      <section className="panel">
        <h2>수집하는 정보</h2>
        <p>
          사이트 이용 과정에서 브라우저, 기기, 접속 시간, 방문 페이지, 대략적인
          지역 등 비식별 이용 정보가 분석과 보안 목적으로 처리될 수 있습니다.
          문의가 접수되는 경우 답변을 위해 사용자가 제공한 연락처와 문의 내용을
          필요한 기간 동안 보관할 수 있습니다.
        </p>
      </section>
      <section className="panel">
        <h2>광고와 쿠키</h2>
        <p>
          농수산고고는 Google AdSense를 사용할 수 있습니다. Google을 포함한
          제3자 광고 사업자는 쿠키를 사용해 사용자의 이전 방문 기록을 기반으로
          맞춤형 광고를 게재할 수 있습니다. 사용자는 브라우저 설정 또는 Google
          광고 설정에서 맞춤형 광고 사용을 제한할 수 있습니다.
        </p>
      </section>
      <section className="panel">
        <h2>이용 목적과 보관</h2>
        <p>
          수집된 정보는 콘텐츠 품질 개선, 서비스 안정성 확인, 부정 이용 방지,
          문의 응대, 광고 성과 측정 목적으로만 사용합니다. 법령상 보관 의무가
          있는 경우를 제외하고 목적 달성 후 지체 없이 삭제하거나 비식별화합니다.
        </p>
      </section>
      <section className="panel">
        <h2>문의</h2>
        <p>
          개인정보 처리와 관련한 요청은 문의 페이지를 통해 접수할 수 있습니다.
          본 방침은 2026년 6월 7일부터 적용됩니다.
        </p>
      </section>
    </main>
  );
}
