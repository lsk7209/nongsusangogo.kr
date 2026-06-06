import { Disclosure } from "@/components/disclosure";
import { PriceChart } from "@/components/price-chart";
import { loadKeywordPagesSafe } from "@/lib/content/db-keyword-pages";
import { getOptionalDatabase, loadPublicPagesSafe } from "@/lib/content/db-pages";
import { hubs } from "@/lib/content/site-pages";
import { createDatabase } from "@/lib/db/client";
import { buildReadinessReport } from "@/lib/gates/readiness";

export default async function Home() {
  const db = getOptionalDatabase(createDatabase);
  const pages = await loadPublicPagesSafe(db);
  const featured = pages[0];
  const keywordPages = await loadKeywordPagesSafe(db);
  const readiness = buildReadinessReport();

  if (!featured) {
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
          <p className="eyebrow">KAMIS price intelligence</p>
          <h1>농수산물 시세를 품질 게이트 뒤에서 비교합니다.</h1>
          <p>
            현재 화면은 검증용 샘플 데이터로 구성된 SSR 사이트입니다. 단위,
            지역, 등급, 도소매 조인은 확인 전까지 격리되어 있습니다.
          </p>
        </div>
        <section className="panel" aria-label="featured price">
          <h2>{featured.itemName} 시세 흐름</h2>
          <PriceChart observations={featured.observations} />
        </section>
      </section>

      <section className="metric-grid" aria-label="quality metrics">
        <div className="metric">
          <span>품질 통과 샘플</span>
          <strong>{pages.length}</strong>
        </div>
        <div className="metric">
          <span>발행 상태</span>
          <strong>보류</strong>
        </div>
        <div className="metric">
          <span>지역 차원</span>
          <strong>옵션</strong>
        </div>
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
        <div>
          <h2>품질 통과 페이지</h2>
          <div className="card-grid">
            {pages.map((page) => (
              <a className="card" href={`/items/${page.slug}`} key={page.slug}>
                <span>{page.category}</span>
                <h3>{page.title}</h3>
                <p>{page.summary}</p>
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
