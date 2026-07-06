import { Disclosure } from "@/components/disclosure";
import { PriceSourceGuide } from "@/components/price-source-guide";
import { PriceChart } from "@/components/price-chart";
import { readEnv } from "@/lib/config/env";
import { loadKeywordPagesSafe } from "@/lib/content/db-keyword-pages";
import { getOptionalDatabase, loadPublicPagesSafe } from "@/lib/content/db-pages";
import { getPublishedEditorialPosts } from "@/lib/content/editorial-posts";
import { hubs } from "@/lib/content/site-pages";
import { createDatabase } from "@/lib/db/client";
import { buildReadinessReport } from "@/lib/gates/readiness";

export function generateMetadata() {
  return {
    title: "농수산물 시세와 장보기 가격 기준",
    description:
      "농수산물 시세, 농산물 가격, 장보기 타이밍, 보관 손실, 대체재 기준을 실생활 관점으로 정리합니다.",
    alternates: {
      canonical: readEnv().SITE_URL,
    },
  };
}

export default async function Home() {
  const env = readEnv();
  const hasKamisApi = Boolean(
    env.KAMIS_CERT_ID && env.KAMIS_CERT_KEY,
  );
  const db = getOptionalDatabase(createDatabase);
  const pages = await loadPublicPagesSafe(db);
  const pricePages = hasKamisApi ? pages : [];
  const featured = pricePages[0];
  const keywordPages = await loadKeywordPagesSafe(db);
  const editorialPosts = getPublishedEditorialPosts().slice(0, 4);
  const readiness = buildReadinessReport();

  if (!featured && editorialPosts.length === 0) {
    return (
      <main>
        <section className="hero-grid">
          <div>
            <p className="eyebrow">Launch readiness</p>
            <h1>공개 발행 전 검증 대기 상태입니다</h1>
            <p>
              실데이터 라이선스, 지역 차원, 수익성, 검색 의도 검증이 끝나기 전에는
              샘플 가격 페이지와 키워드 페이지를 검색 노출하지 않습니다.
            </p>
          </div>
          <section className="panel" aria-label="readiness status">
            <h2>차단 중인 게이트</h2>
            <ul>
              {readiness.checks
                .filter((check) => check.status === "pending" || check.status === "fail")
                .map((check) => (
                  <li key={check.id}>{check.label}</li>
                ))}
            </ul>
          </section>
        </section>
        <Disclosure />
      </main>
    );
  }

  return (
    <main>
      <section className="hero-grid">
        <div>
          <p className="eyebrow">농수산물 장보기 가이드</p>
          <h1>농수산물 가격 흐름을 장보기 기준으로 풀어봅니다.</h1>
          <p>
            채소, 과일, 수산물, 축산물의 가격 변동을 생활비 관점에서 해석하고
            구매 타이밍, 보관 손실, 대체재 선택 기준을 함께 정리합니다.
          </p>
        </div>
        {featured ? (
          <section className="panel" aria-label="featured price">
            <h2>{featured.itemName} 시세 흐름</h2>
            <PriceChart observations={featured.observations} />
          </section>
        ) : (
          <section className="panel" aria-label="latest articles">
            <h2>최근 공개 글</h2>
            <div className="compact-link-list">
              {editorialPosts.slice(0, 3).map((post) => (
                <a href={`/blog/${post.slug}`} key={post.slug}>
                  <span>{post.category}</span>
                  <strong>{post.title}</strong>
                </a>
              ))}
            </div>
          </section>
        )}
      </section>

      <section className="metric-grid" aria-label="quality metrics">
        <div className="metric">
          <span>공개 콘텐츠</span>
          <strong>{editorialPosts.length}</strong>
        </div>
        <div className="metric">
          <span>편집 기준</span>
          <strong>출처 확인</strong>
        </div>
        <div className="metric">
          <span>독자 목표</span>
          <strong>생활비 절감</strong>
        </div>
      </section>

      <PriceSourceGuide />

      <section className="panel">
        <h2>홈에서 가격을 읽는 순서</h2>
        <p>
          농수산고고의 홈은 오늘 가격 하나를 정답처럼 제시하기보다 장보기 결정을 하기 전 확인해야 할
          기준을 정리합니다. 농산물과 수산물은 산지, 등급, 포장 단위, 조사일, 도매와 소매 구분에 따라
          같은 품목도 가격 차이가 커질 수 있습니다.
        </p>
        <p>
          실제 구매 전에는 KAMIS, 농넷, 공공기관 발표, 거주 지역 마트와 시장 가격을 함께 확인해야 합니다.
          홈의 허브와 키워드 페이지는 평년 대비 위치, 대체재 가능성, 보관 손실, 제철 수요를 나누어 보는
          출발점입니다.
        </p>
        <p>
          가격이 싸다는 말은 필요한 양과 보관 가능 기간을 함께 볼 때만 의미가 있습니다. 많이 사서 버리면
          단가 절감 효과가 사라지고, 등급이나 단위가 다른 가격을 비교하면 실제 장바구니 비용을 잘못 판단할
          수 있습니다.
        </p>
      </section>

      <section className="section-stack">
        <div>
          <h2>허브</h2>
          <div className="card-grid">
            {hubs.map((hub) => (
              <a className="card" href={`/hubs/${hub.slug}`} key={hub.slug}>
                <span>{hub.category}</span>
                <h3>{hub.title}</h3>
                <p>{hub.description}</p>
              </a>
            ))}
          </div>
        </div>
        {pricePages.length > 0 ? (
          <div>
            <h2>가격 기준 예시</h2>
            <div className="card-grid">
              {pricePages.map((page) => (
                <a className="card" href={`/items/${page.slug}`} key={page.slug}>
                  <span>{page.category}</span>
                  <h3>{page.title}</h3>
                  <p>{page.summary}</p>
                </a>
              ))}
            </div>
          </div>
        ) : null}
        <div>
          <h2>최신 블로그</h2>
          <div className="card-grid">
            {editorialPosts.map((post) => (
              <a className="card" href={`/blog/${post.slug}`} key={post.slug}>
                <span>{post.category}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </a>
            ))}
          </div>
        </div>
        <div>
          <h2>키워드 탐색</h2>
          <div className="card-grid">
            {keywordPages.map((page) => (
              <a className="card" href={page.path} key={page.path}>
                <span>{page.intent}</span>
                <h3>{page.primaryKeyword}</h3>
                <p>{page.searchSummary}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Disclosure />
    </main>
  );
}
