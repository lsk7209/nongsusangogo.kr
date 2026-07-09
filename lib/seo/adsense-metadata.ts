import type { KeywordPage } from "@/lib/content/keyword-pages";

const SITE_IDENTITY = "농수산고고 nongsusangogo.kr";

function trimDescription(value: string) {
  return value.length > 155 ? `${value.slice(0, 152)}...` : value;
}

export function buildKeywordSeo(page: Pick<KeywordPage, "title" | "searchSummary">) {
  return {
    title: `${SITE_IDENTITY} | ${page.title}`,
    description: trimDescription(
      `nongsusangogo.kr 농수산고고는 ${page.searchSummary} 공식 시세, 평년 비교, 보관 손실, 장보기 판단 기준을 함께 정리합니다.`,
    ),
  };
}

export function buildHomeSeo() {
  return {
    title: "농수산고고 nongsusangogo.kr 농수산물 시세와 장보기 가격 기준",
    description:
      "nongsusangogo.kr 농수산고고는 농산물, 수산물, 축산물 가격 흐름을 공식 시세와 생활 장보기 기준으로 비교합니다.",
  };
}

export function buildArticleSeo(page: { title: string; description: string }) {
  return {
    title: `${SITE_IDENTITY} | ${page.title}`,
    description: trimDescription(
      `nongsusangogo.kr 농수산고고는 ${page.description} 공식 출처, 보관 손실, 장보기 판단 기준을 함께 확인합니다.`,
    ),
  };
}
