import type { KeywordPage } from "@/lib/content/keyword-pages";
import { Disclosure } from "@/components/disclosure";

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
        <h2>핵심 키워드</h2>
        <p>{page.primaryKeyword}</p>
        <p>{page.secondaryKeywords.join(", ")}</p>
      </section>
      <section className="section-stack">
        {page.body.map((paragraph) => (
          <section className="panel" key={paragraph}>
            <p>{paragraph}</p>
          </section>
        ))}
      </section>
      <section className="panel">
        <h2>관련 페이지</h2>
        <div className="card-grid">
          {page.relatedLinks.map((link) => (
            <a className="card" href={link.href} key={link.href}>
              <h3>{link.label}</h3>
              <p>{link.href}</p>
            </a>
          ))}
        </div>
      </section>
      <Disclosure />
    </main>
  );
}

