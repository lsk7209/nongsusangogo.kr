import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { Disclosure } from "@/components/disclosure";
import { readEnv } from "@/lib/config/env";
import {
  getEditorialPost,
  getPublishedEditorialPosts,
} from "@/lib/content/editorial-posts";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

type PageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return getPublishedEditorialPosts().map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const post = getEditorialPost(params.slug);

  if (!post) {
    return {};
  }

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: {
      canonical: `${readEnv().SITE_URL}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: [
        {
          url: `${readEnv().SITE_URL}/images/nongsusan-article-hero.png`,
          width: 1200,
          height: 675,
          alt: "농수산고고 농수산품 대표 이미지",
        },
      ],
    },
  };
}

export default function BlogPostPage({ params }: PageProps) {
  const post = getEditorialPost(params.slug);

  if (!post) {
    notFound();
  }

  const siteUrl = readEnv().SITE_URL;
  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;
  const articleStyle = {
    "--article-accent": post.accentColors[0],
    "--article-warm": post.accentColors[1],
  } as CSSProperties;
  const bodyHeadings = post.body.map((_, index) => ({
    id: `section-${index + 1}`,
    label:
      index === 0
        ? post.mainKeyword
        : post.expandedKeywords[(index - 1) % post.expandedKeywords.length],
  }));
  const deepDiveHeadings = post.deepDives.map((section, index) => ({
    id: `deep-dive-${index + 1}`,
    label: section.heading,
  }));
  const decisionRows = buildDecisionRows(post);
  const scenarioRows = buildScenarioRows(post);
  const tocItems = [
    { id: "decision-table", label: `${post.mainKeyword} 판단표` },
    { id: "scenario-table", label: "상황별 실행 기준" },
    ...bodyHeadings,
    ...deepDiveHeadings,
  ];
  const wordCount = [
    post.quickAnswer,
    ...decisionRows.flatMap((row) => [row.signal, row.meaning, row.action]),
    ...scenarioRows.flatMap((row) => [row.situation, row.buyingRule, row.note]),
    ...post.body,
    ...post.deepDives.map((section) => section.body),
    ...post.checklist,
    ...post.faq.flatMap((item) => [item.question, item.answer]),
  ]
    .join(" ")
    .split(/\s+/).length;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${canonicalUrl}#blogposting`,
        mainEntityOfPage: canonicalUrl,
        headline: post.title,
        description: post.excerpt,
        articleSection: post.category,
        keywords: [post.mainKeyword, ...post.expandedKeywords],
        datePublished: post.publishAt,
        dateModified: post.publishAt,
        isAccessibleForFree: true,
        wordCount,
        citation: post.externalSource.href,
        publisher: {
          "@type": "Organization",
          name: "농수산고고",
          url: siteUrl,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        mainEntity: post.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "홈",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "블로그",
            item: `${siteUrl}/blog`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="article-page" style={articleStyle}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="eyebrow">
        {post.category} · {post.intent}
      </p>
      <h1>{post.title}</h1>
      <p className="subtitle">{post.subtitle}</p>

      <figure className="article-hero-image">
        <Image
          src="/images/nongsusan-article-hero.png"
          alt={`${post.category} 농수산품 장보기 이미지`}
          width={1200}
          height={675}
          priority
          sizes="(max-width: 768px) 100vw, 960px"
        />
      </figure>

      <section className="panel article-answer">
        <h2>빠른 답변</h2>
        <p>{post.quickAnswer}</p>
      </section>

      <section className="article-elements" aria-label="글 구성 요소">
        {post.contentElements.map((element) => (
          <span key={element}>{element}</span>
        ))}
      </section>

      <section className="panel article-data-card" id="decision-table">
        <h2>{post.mainKeyword} 판단표</h2>
        <p>
          가격표를 보기 전에 아래 세 가지 신호를 먼저 확인하면 오늘 살지,
          대체할지, 보관량을 줄일지 빠르게 정할 수 있습니다.
        </p>
        <div className="responsive-table" role="region" aria-label="가격 판단표">
          <table>
            <thead>
              <tr>
                <th>확인 신호</th>
                <th>해석</th>
                <th>권장 행동</th>
              </tr>
            </thead>
            <tbody>
              {decisionRows.map((row) => (
                <tr key={row.signal}>
                  <th scope="row">{row.signal}</th>
                  <td>{row.meaning}</td>
                  <td>{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel article-scenario-card" id="scenario-table">
        <h2>상황별 실행 기준</h2>
        <div className="scenario-grid">
          {scenarioRows.map((row) => (
            <article key={row.situation}>
              <span>{row.situation}</span>
              <h3>{row.buyingRule}</h3>
              <p>{row.note}</p>
            </article>
          ))}
        </div>
      </section>

      <nav className="panel article-toc" aria-label="글 목차">
        <h2>목차</h2>
        <ol>
          {tocItems.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.label}</a>
            </li>
          ))}
        </ol>
      </nav>

      <AdSlot label="본문 중간 광고" />

      <section className="section-stack">
        {post.body.map((paragraph, index) => (
          <section
            className={
              index % 2 === 0
                ? "panel article-panel-accent"
                : "panel article-panel-warm"
            }
            key={paragraph}
            id={`section-${index + 1}`}
          >
            <h2>
              {index === 0
                ? post.mainKeyword
                : post.expandedKeywords[(index - 1) % post.expandedKeywords.length]}
            </h2>
            <p>{paragraph}</p>
          </section>
        ))}
      </section>

      <section className="section-stack article-deep-dives">
        {post.deepDives.map((section, index) => (
          <section
            className={
              index % 2 === 0
                ? "panel article-panel-warm"
                : "panel article-panel-accent"
            }
            key={section.heading}
            id={`deep-dive-${index + 1}`}
          >
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </section>

      <section className="panel article-checklist">
        <h2>체크리스트</h2>
        <ul>
          {post.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel article-faq">
        <h2>자주 묻는 질문</h2>
        {post.faq.map((item) => (
          <div className="faq-item" key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>함께 보면 좋은 글</h2>
        <div className="card-grid">
          {post.internalLinks.map((link) => (
            <a className="card" href={link.href} key={link.href}>
              <h3>{link.label}</h3>
            </a>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>출처와 다음 행동</h2>
        <p>
          참고 출처:{" "}
          <a href={post.externalSource.href}>{post.externalSource.label}</a>
        </p>
        <p>{post.externalSource.note}</p>
        <p>{post.cta}</p>
        <a className="read-more-link" href="/blog">
          장보기 인사이트 더 보기
        </a>
      </section>
      <Disclosure />
    </main>
  );
}

function buildDecisionRows(
  post: NonNullable<ReturnType<typeof getEditorialPost>>,
) {
  const [firstKeyword, secondKeyword, thirdKeyword] = post.expandedKeywords;
  const guidance = getIntentGuidance(post.intent);

  return [
    {
      signal: post.mainKeyword,
      meaning: guidance.primaryMeaning,
      action: guidance.primaryAction,
    },
    {
      signal: firstKeyword,
      meaning: guidance.secondaryMeaning,
      action: guidance.secondaryAction,
    },
    {
      signal: `${secondKeyword} / ${thirdKeyword}`,
      meaning: `${post.category} 품목의 먹는 방식, 보관 가능성, 대체 선택지를 동시에 확인하는 실행 신호입니다.`,
      action: guidance.finalAction,
    },
  ];
}

function buildScenarioRows(
  post: NonNullable<ReturnType<typeof getEditorialPost>>,
) {
  const [firstKeyword, secondKeyword, thirdKeyword] = post.expandedKeywords;
  const guidance = getIntentGuidance(post.intent);

  return [
    {
      situation: "오늘 바로 조리",
      buyingRule: `${post.mainKeyword}이 높아도 소량 구매 가능`,
      note: guidance.todayNote,
    },
    {
      situation: "이번 주 식단 미정",
      buyingRule: `${firstKeyword} 확인 후 대체재 우선`,
      note: `${secondKeyword}처럼 같은 역할을 할 수 있는 재료를 먼저 비교합니다.`,
    },
    {
      situation: "묶음 할인 발견",
      buyingRule: `${thirdKeyword} 손실까지 계산`,
      note: "할인율보다 끝까지 먹을 수 있는 비율이 실제 장보기 단가를 결정합니다.",
    },
  ];
}

function getIntentGuidance(intent: string) {
  if (intent.includes("대체")) {
    return {
      primaryMeaning:
        "현재 가격을 단독 숫자로 보지 않고 같은 메뉴에서 역할이 비슷한 재료와 비교합니다.",
      primaryAction:
        "맛의 핵심 재료는 소량 유지하고, 양을 채우는 재료부터 대체합니다.",
      secondaryMeaning:
        "대체재가 실제 조리법에서 같은 식감이나 향을 낼 수 있는지 좁혀 보는 보조 신호입니다.",
      secondaryAction:
        "완전 대체보다 절반 혼합을 먼저 적용해 맛과 비용 변화를 함께 확인합니다.",
      finalAction:
        "메뉴 역할이 비슷한 재료를 1개만 고르고, 맛 차이가 큰 조합은 다음 장보기에서 비교합니다.",
      todayNote:
        "오늘 먹을 메뉴라면 핵심 향이나 식감을 유지하는 범위에서만 대체하는 편이 안전합니다.",
    };
  }

  if (intent.includes("데이터") || intent.includes("해석")) {
    return {
      primaryMeaning:
        "현재 가격을 단위, 등급, 도소매 차이와 함께 해석해야 하는 핵심 신호입니다.",
      primaryAction:
        "팩 가격을 그대로 비교하지 말고 kg, 개수, 용도 기준 중 하나로 통일합니다.",
      secondaryMeaning:
        "가격 차이가 실제 부담인지 단위 차이에서 생긴 착시인지 확인하는 보조 신호입니다.",
      secondaryAction:
        "같은 기준으로 환산한 뒤 바로 살지, 며칠 더 볼지 결정합니다.",
      finalAction:
        "비교 단위를 하나로 맞추고, 보관 손실이 큰 품목은 예상 사용량을 먼저 줄입니다.",
      todayNote:
        "오늘 필요한 양이 명확하면 환산 가격보다 선도와 용도 적합성을 먼저 봅니다.",
    };
  }

  if (intent.includes("비용") || intent.includes("리스크")) {
    return {
      primaryMeaning:
        "가격 상승보다 보관 실패와 조리 손실까지 포함해 실제 단가를 보는 신호입니다.",
      primaryAction:
        "싸게 보이는 묶음보다 끝까지 먹을 수 있는 분량을 먼저 정합니다.",
      secondaryMeaning:
        "손실이 커지는 구간인지, 단순히 체감 가격만 높은지 구분하는 보조 신호입니다.",
      secondaryAction:
        "보관 기간이 불확실하면 대량 구매를 늦추고 소포장으로 전환합니다.",
      finalAction:
        "구매량, 대체재, 보관법 중 하나만 바꿔 다음 장보기에서 효과를 비교합니다.",
      todayNote:
        "오늘 바로 쓰면 손실 위험이 낮으므로 가격보다 필요한 양과 품질을 우선합니다.",
    };
  }

  return {
    primaryMeaning:
      "현재 가격을 단독 숫자가 아니라 오늘 필요한 메뉴와 소비 속도 기준으로 해석합니다.",
    primaryAction:
      "당일 또는 3일 안에 쓸 양만 먼저 정하고, 남을 가능성이 있으면 구매량을 줄입니다.",
    secondaryMeaning:
      "가격 상승 원인이나 계절 변동을 좁혀 보는 보조 신호입니다.",
    secondaryAction:
      "일시적 부담이면 소량 구매, 반복 상승이면 대체재를 함께 장바구니에 넣습니다.",
    finalAction:
      "메뉴 역할이 비슷한 재료를 1개 정하고, 보관 손실이 큰 품목은 대량 구매를 피합니다.",
    todayNote:
      "메뉴가 확정되어 있으면 최저가보다 선도와 필요한 양이 우선입니다.",
  };
}
