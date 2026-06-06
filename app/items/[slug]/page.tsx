import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { Disclosure } from "@/components/disclosure";
import { PriceChart } from "@/components/price-chart";
import { PriceTool } from "@/components/price-tool";
import { WholesaleRetailGauge } from "@/components/wholesale-retail-gauge";
import { readEnv } from "@/lib/config/env";
import {
  findPublicPageSafe,
  getOptionalDatabase,
} from "@/lib/content/db-pages";
import { getQualityPassedPages } from "@/lib/content/site-pages";
import { createDatabase } from "@/lib/db/client";
import { canUseFixturePublicFallback } from "@/lib/gates/public-launch";

type PageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  if (!canUseFixturePublicFallback()) {
    return [];
  }

  return getQualityPassedPages().map((page) => ({ slug: page.slug }));
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const page = await findPublicPageSafe(
    getOptionalDatabase(createDatabase),
    params.slug,
  );

  if (!page) {
    return {};
  }

  return {
    title: page.title,
    description: page.summary,
    alternates: {
      canonical: `${readEnv().SITE_URL}/items/${page.slug}`,
    },
    openGraph: {
      title: page.title,
      description: page.summary,
      type: "article",
    },
  };
}

export default async function ItemPage({ params }: PageProps) {
  const page = await findPublicPageSafe(
    getOptionalDatabase(createDatabase),
    params.slug,
  );

  if (!page) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: page.title,
    description: page.summary,
    variableMeasured: page.activeSections,
    isBasedOn: "KAMIS",
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="eyebrow">{page.category}</p>
      <h1>{page.title}</h1>
      <p>{page.summary}</p>

      <section className="metric-grid" aria-label="price summary">
        <div className="metric">
          <span>현재가</span>
          <strong>
            {page.price === null
              ? "결측"
              : `${page.price.toLocaleString("ko-KR")}원`}
          </strong>
        </div>
        <div className="metric">
          <span>단위</span>
          <strong>{page.unit}</strong>
        </div>
        <div className="metric">
          <span>상태</span>
          <strong>품질 통과</strong>
        </div>
      </section>

      <div className="section-stack">
        <section className="panel">
          <h2>시계열 비교</h2>
          <PriceChart observations={page.observations} />
        </section>
        <section className="panel">
          <h2>가격 표시</h2>
          <PriceTool
            price={page.price}
            unit={page.unit}
            pricePerKg={page.pricePerKg}
          />
        </section>
        <section className="panel">
          <h2>도소매 참고 게이지</h2>
          <WholesaleRetailGauge value={page.price === null ? 0 : 58} />
        </section>
        <AdSlot label="시세 페이지 광고 슬롯" />
        {page.price === null ? (
          <section className="notice">
            <p>현재 가격은 결측입니다. 결측값은 보간하지 않습니다.</p>
          </section>
        ) : null}
        <section className="panel">
          <h2>FAQ</h2>
          {page.faq.map((entry) => (
            <article key={entry.question}>
              <h3>{entry.question}</h3>
              <p>{entry.answer}</p>
            </article>
          ))}
        </section>
      </div>

      <Disclosure />
    </main>
  );
}
