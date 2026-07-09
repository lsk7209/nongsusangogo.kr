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
import { buildArticleSeo } from "@/lib/seo/adsense-metadata";

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

  const articleHero = getArticleHeroImage(post);
  const seo = buildArticleSeo({
    title: post.metaTitle,
    description: post.metaDescription,
  });

  return {
    ...seo,
    alternates: {
      canonical: `${readEnv().SITE_URL}/blog/${post.slug}`,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "article",
      images: [
        {
          url: `${readEnv().SITE_URL}${articleHero.src}`,
          width: 1200,
          height: 675,
          alt: articleHero.alt,
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
  const articleHero = getArticleHeroImage(post);
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
  const comparisonRows = buildArticleComparisonRows(post);
  const reviewedAt = "2026-06-07";
  const tocItems = [
    { id: "decision-table", label: `${post.mainKeyword} 판단표` },
    { id: "scenario-table", label: "상황별 실행 기준" },
    { id: "comparison-table", label: "비교표" },
    { id: "source-interpretation", label: "출처 해석 기준" },
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
        image: `${siteUrl}${articleHero.src}`,
        datePublished: post.publishAt,
        dateModified: reviewedAt,
        isAccessibleForFree: true,
        wordCount,
        citation: post.externalSource.href,
        publisher: {
          "@type": "Organization",
          name: "농수산고고",
          url: siteUrl,
          logo: `${siteUrl}/images/nongsusan-article-hero.jpg`,
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
          src={articleHero.src}
          alt={articleHero.alt}
          width={1200}
          height={675}
          priority
          sizes="(max-width: 768px) 100vw, 960px"
        />
      </figure>

      <section className="panel article-answer">
        <h2>빠른 답변</h2>
        <p>{post.quickAnswer}</p>
        <p className="article-source-note">
          참고 출처:{" "}
          <a href={post.externalSource.href}>{post.externalSource.label}</a>
          <span> · 마지막 검토일: 2026년 6월 7일</span>
        </p>
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

      <section className="panel article-comparison-card" id="comparison-table">
        <h2>{post.mainKeyword} 비교표</h2>
        <div className="responsive-table" role="region" aria-label="비교표">
          <table>
            <thead>
              <tr>
                <th>선택지</th>
                <th>좋은 경우</th>
                <th>주의할 점</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.option}>
                  <th scope="row">{row.option}</th>
                  <td>{row.bestFor}</td>
                  <td>{row.watch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel article-source-card" id="source-interpretation">
        <h2>공식 출처는 이렇게 해석합니다</h2>
        <p>
          {post.externalSource.label} 같은 공식 자료는 가격 흐름과 안전 기준을
          확인하는 출발점입니다. 다만 실제 장보기에서는 포장 단위, 보관 공간,
          조리 일정이 함께 달라지므로 이 글은 {post.mainKeyword}을
          생활 기준으로 다시 풀어 설명합니다.
        </p>
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

function buildArticleComparisonRows(
  post: NonNullable<ReturnType<typeof getEditorialPost>>,
) {
  const customRows: Record<
    string,
    Array<{ option: string; bestFor: string; watch: string }>
  > = {
    "cucumber-summer-price-buying-window": [
      {
        option: "오이 낱개 구매",
        bestFor: "2~3일 안에 냉국, 무침, 샐러드를 바로 만들 때",
        watch: "묶음보다 단가가 높아 보여도 폐기 손실은 줄어듭니다.",
      },
      {
        option: "오이 묶음 구매",
        bestFor: "가족 식단에서 생채, 절임, 냉국을 연속으로 쓸 때",
        watch: "장마철에는 표면 물기와 끝부분 마름을 먼저 확인해야 합니다.",
      },
      {
        option: "샐러드 대체 채소",
        bestFor: "오이 가격이 높고 아삭한 식감만 필요할 때",
        watch: "수분감이 필요한 냉국 메뉴에는 대체 만족도가 낮을 수 있습니다.",
      },
    ],
    "zucchini-rainy-season-price-risk": [
      {
        option: "애호박 통상품",
        bestFor: "찌개나 볶음을 1~2일 안에 조리할 때",
        watch: "굵기보다 단단함과 표면 흠집이 더 중요합니다.",
      },
      {
        option: "두부·버섯 대체",
        bestFor: "찌개 부피와 부드러운 식감을 유지하고 싶을 때",
        watch: "애호박 특유의 단맛은 줄어들 수 있습니다.",
      },
      {
        option: "가지·양파 볶음",
        bestFor: "볶음 반찬에서 양과 식감을 채울 때",
        watch: "기름 사용량이 늘면 체감 비용이 올라갈 수 있습니다.",
      },
    ],
    "tomato-retail-wholesale-gap": [
      {
        option: "팩 소매가",
        bestFor: "오늘 바로 먹을 샐러드나 도시락 과일을 고를 때",
        watch: "팩 가격만 보지 말고 100g 기준으로 환산해야 합니다.",
      },
      {
        option: "도매 흐름 확인",
        bestFor: "며칠 뒤 행사 가능성을 가늠할 때",
        watch: "소매가는 재고와 포장 단위 때문에 바로 따라오지 않습니다.",
      },
      {
        option: "소스용 토마토",
        bestFor: "외관보다 양과 익은 정도가 중요할 때",
        watch: "완숙 상품은 보관 시간이 짧아 바로 조리해야 합니다.",
      },
    ],
    "green-onion-price-spike-response": [
      {
        option: "생대파",
        bestFor: "국물 첫 향, 고명, 양념장 향이 중요할 때",
        watch: "사용량이 적은 집은 남는 부분이 빠르게 마를 수 있습니다.",
      },
      {
        option: "냉동 대파",
        bestFor: "국물, 볶음 초반, 라면처럼 익혀 쓰는 메뉴",
        watch: "생고명처럼 식감을 살리는 용도에는 맞지 않습니다.",
      },
      {
        option: "양파·부추 대체",
        bestFor: "볶음밥, 부침개, 계란말이에서 양을 채울 때",
        watch: "대파 향을 완전히 대체하지는 못합니다.",
      },
    ],
    "onion-storage-loss-cost": [
      {
        option: "양파 박스 구매",
        bestFor: "가족 식단에서 국, 볶음, 양념을 자주 만들 때",
        watch: "습기와 싹이 생기면 실제 단가가 빠르게 올라갑니다.",
      },
      {
        option: "소포장 양파",
        bestFor: "1~2인 가구나 조리 빈도가 낮은 집",
        watch: "단가는 높아도 버리는 양이 적으면 더 경제적일 수 있습니다.",
      },
      {
        option: "손질 양파",
        bestFor: "조리 시간이 부족하고 바로 쓸 메뉴가 정해졌을 때",
        watch: "보관 기간이 짧아 미리 사두기에는 불리합니다.",
      },
    ],
    "garlic-bulk-buy-checklist": [
      {
        option: "통마늘",
        bestFor: "장기 보관과 직접 손질이 가능한 집",
        watch: "손질 시간이 없으면 구매 후 부담이 커집니다.",
      },
      {
        option: "깐마늘",
        bestFor: "양념과 볶음에 바로 쓰는 빈도가 높을 때",
        watch: "수분과 냄새 변화가 빠르므로 소분이 필요합니다.",
      },
      {
        option: "냉동 다진 마늘",
        bestFor: "소량씩 자주 쓰고 손질 시간을 줄이고 싶을 때",
        watch: "생마늘 향이 필요한 메뉴에는 만족도가 낮을 수 있습니다.",
      },
    ],
    "lettuce-restaurant-demand-price": [
      {
        option: "상추",
        bestFor: "쌈 메뉴에서 부드러운 식감이 필요할 때",
        watch: "외식 수요가 몰리면 체감 가격이 쉽게 흔들립니다.",
      },
      {
        option: "깻잎",
        bestFor: "적은 양으로 향을 강하게 내고 싶을 때",
        watch: "보관 중 마름과 검은 반점을 확인해야 합니다.",
      },
      {
        option: "양배추 쌈",
        bestFor: "쌈채소 비용을 낮추고 보관성을 높이고 싶을 때",
        watch: "생채소 쌈과 식감이 달라 메뉴에 맞춰야 합니다.",
      },
    ],
    "salad-greens-price-map": [
      {
        option: "양상추 중심",
        bestFor: "부피와 아삭함이 필요한 샐러드",
        watch: "한 통 구매 후 남는 양이 커질 수 있습니다.",
      },
      {
        option: "오이·토마토 혼합",
        bestFor: "수분감과 색감을 함께 채우고 싶을 때",
        watch: "각 품목의 보관 기간이 달라 먼저 먹을 순서를 정해야 합니다.",
      },
      {
        option: "냉동·데친 채소 보완",
        bestFor: "생채소 가격이 높은 주간",
        watch: "샐러드보다는 곁들임이나 따뜻한 메뉴에 더 잘 맞습니다.",
      },
    ],
    "soup-vegetable-cost": [
      {
        option: "무 중심 국거리",
        bestFor: "시원한 국물 맛을 유지하고 싶을 때",
        watch: "무 가격이 높으면 한 냄비 단가가 크게 흔들립니다.",
      },
      {
        option: "대파·양파 소량 유지",
        bestFor: "향과 단맛만 보완할 때",
        watch: "향 재료를 모두 줄이면 국물 맛이 밋밋해질 수 있습니다.",
      },
      {
        option: "버섯·콩나물 보완",
        bestFor: "부피를 채우면서 비용을 낮출 때",
        watch: "조리 시간이 짧아 과하게 끓이면 식감이 흐려집니다.",
      },
    ],
    "stir-fry-vegetable-choice": [
      {
        option: "애호박",
        bestFor: "부드러운 볶음과 빠른 조리가 필요할 때",
        watch: "수분이 많아 과하게 볶으면 질척해질 수 있습니다.",
      },
      {
        option: "가지",
        bestFor: "식감과 양을 채우는 볶음 반찬",
        watch: "기름 흡수가 많아 조리비까지 고려해야 합니다.",
      },
      {
        option: "양파",
        bestFor: "단맛과 향을 안정적으로 보완할 때",
        watch: "주재료보다 보조 재료로 쓰는 편이 자연스럽습니다.",
      },
    ],
    "radish-soup-seasonal-choice": [
      {
        option: "겨울 무",
        bestFor: "시원한 국물과 단맛을 살리고 싶을 때",
        watch: "크기보다 단단함과 표면 상태를 먼저 봐야 합니다.",
      },
      {
        option: "소포장 무",
        bestFor: "1~2인 가구에서 국거리만 조금 필요할 때",
        watch: "절단면 수분과 갈변을 확인해야 합니다.",
      },
      {
        option: "콩나물·버섯 보완",
        bestFor: "무 가격이 높아 국물 부피를 채울 때",
        watch: "무 특유의 단맛은 줄어듭니다.",
      },
    ],
    "potato-sprout-loss": [
      {
        option: "소량 감자",
        bestFor: "감자 메뉴가 1~2번만 예정된 집",
        watch: "단가보다 싹 손실을 줄이는 효과가 큽니다.",
      },
      {
        option: "묶음 감자",
        bestFor: "카레, 조림, 찜을 연속으로 만들 때",
        watch: "빛과 습기를 피하지 못하면 손실이 커집니다.",
      },
      {
        option: "고구마·무 대체",
        bestFor: "뿌리채소 식감을 유지하며 메뉴를 바꿀 때",
        watch: "맛 방향이 달라 국물·볶음 용도를 구분해야 합니다.",
      },
    ],
    "root-vegetable-budget": [
      {
        option: "감자",
        bestFor: "포만감과 조림·카레 활용이 필요할 때",
        watch: "싹과 녹변이 생기면 할인 이점이 사라집니다.",
      },
      {
        option: "무",
        bestFor: "국물, 생채, 김치 재료를 함께 고려할 때",
        watch: "절단 후 보관 기간을 길게 잡기 어렵습니다.",
      },
      {
        option: "당근",
        bestFor: "색감과 도시락 반찬을 안정적으로 채울 때",
        watch: "대량 구매보다 사용 빈도가 중요합니다.",
      },
    ],
    "freezer-vegetable-strategy": [
      {
        option: "대파·양파 냉동",
        bestFor: "국물, 볶음, 양념 베이스처럼 익혀 쓰는 메뉴",
        watch: "생고명이나 샐러드 식감은 기대하기 어렵습니다.",
      },
      {
        option: "데친 잎채소 냉동",
        bestFor: "나물, 된장국, 볶음밥에 소량씩 넣을 때",
        watch: "물기를 충분히 빼지 않으면 얼음 결정이 커집니다.",
      },
      {
        option: "생식 채소 소량 구매",
        bestFor: "오이, 상추처럼 아삭함이 핵심인 메뉴",
        watch: "냉동보다 2~3일치만 사는 편이 품질 유지에 유리합니다.",
      },
    ],
    "substitute-food-map": [
      {
        option: "향 대체재",
        bestFor: "대파, 마늘, 깻잎처럼 향이 메뉴의 중심일 때",
        watch: "완전 대체보다 소량 유지가 만족도를 지키기 쉽습니다.",
      },
      {
        option: "부피 대체재",
        bestFor: "국거리, 볶음, 샐러드에서 양을 채워야 할 때",
        watch: "맛보다 식감과 조리 시간이 더 중요합니다.",
      },
      {
        option: "보관성 대체재",
        bestFor: "잎채소 가격이 높거나 날씨 리스크가 클 때",
        watch: "메뉴 성격이 바뀌므로 CTA나 내부 링크로 다음 행동을 안내해야 합니다.",
      },
    ],
    "weekly-market-note": [
      {
        option: "구매 날짜",
        bestFor: "가격 흐름과 장보기 주기를 비교할 때",
        watch: "날짜만 적으면 행동으로 이어지기 어렵습니다.",
      },
      {
        option: "남긴 양",
        bestFor: "다음 구매량을 줄일지 늘릴지 판단할 때",
        watch: "정확한 무게보다 절반, 조금, 없음 같은 기록도 충분합니다.",
      },
      {
        option: "대체재 결과",
        bestFor: "다음번 같은 가격 상승에 빠르게 대응할 때",
        watch: "가족 반응이나 조리 난이도까지 함께 적어야 오래갑니다.",
      },
    ],
    "leafy-vegetable-risk": [
      {
        option: "상추",
        bestFor: "쌈 메뉴에서 부드러운 생식 식감이 필요할 때",
        watch: "외식 수요와 날씨에 따라 가격 체감이 크게 흔들립니다.",
      },
      {
        option: "시금치",
        bestFor: "데쳐서 나물, 국, 김밥 재료로 쓸 때",
        watch: "데친 뒤 양이 줄어드는 손실을 계산해야 합니다.",
      },
      {
        option: "깻잎",
        bestFor: "소량으로 향을 강하게 보완할 때",
        watch: "마름과 검은 반점이 생기기 쉬워 소포장이 안전합니다.",
      },
    ],
    "bulk-buying-failure": [
      {
        option: "묶음 할인",
        bestFor: "이번 주 메뉴가 두 번 이상 확정됐을 때",
        watch: "남는 양이 생기면 할인률보다 폐기 손실이 큽니다.",
      },
      {
        option: "박스 구매",
        bestFor: "가족 단위 반복 소비와 보관 공간이 충분할 때",
        watch: "습기, 상처, 숙도 차이를 구매 직후 분리해야 합니다.",
      },
      {
        option: "소포장 전환",
        bestFor: "식단이 불확실하거나 1~2인 가구일 때",
        watch: "단가가 높아 보여도 실패 비용을 줄일 수 있습니다.",
      },
    ],
    "rainy-day-shopping-list": [
      {
        option: "잎채소 줄이기",
        bestFor: "비 오는 주에 생식 메뉴가 많지 않을 때",
        watch: "물기 제거와 빠른 소비 계획이 없으면 손실이 커집니다.",
      },
      {
        option: "뿌리채소 보완",
        bestFor: "국거리와 볶음 부피를 안정적으로 채울 때",
        watch: "무겁고 오래가지만 메뉴가 단조로워질 수 있습니다.",
      },
      {
        option: "버섯·콩나물 활용",
        bestFor: "짧은 조리 시간으로 국물과 볶음을 보완할 때",
        watch: "보관 기간이 길지 않으므로 사용일을 정해야 합니다.",
      },
    ],
    "heatwave-produce-risk": [
      {
        option: "생식 채소 소량",
        bestFor: "오늘 바로 먹을 샐러드나 쌈 메뉴",
        watch: "이동 시간이 길면 냉장 전환이 늦어져 품질이 떨어집니다.",
      },
      {
        option: "냉동·손질 채소",
        bestFor: "폭염기에 손실을 줄이고 조리 시간을 줄일 때",
        watch: "생식 식감이 필요한 메뉴에는 맞지 않습니다.",
      },
      {
        option: "보관성 좋은 재료",
        bestFor: "며칠치 식단을 안정적으로 짤 때",
        watch: "가격만 낮다고 많이 사면 메뉴 피로도가 생길 수 있습니다.",
      },
    ],
    "cold-wave-vegetable-price": [
      {
        option: "무·대파 소량 확보",
        bestFor: "한파 뒤 국거리 메뉴를 유지하고 싶을 때",
        watch: "대량 구매보다 반복 메뉴 수가 먼저입니다.",
      },
      {
        option: "버섯·콩나물 대체",
        bestFor: "국물 부피와 식감을 저렴하게 보완할 때",
        watch: "무의 단맛이나 대파 향은 줄어들 수 있습니다.",
      },
      {
        option: "냉동 채소 활용",
        bestFor: "출하 지연 구간에 기본 재료를 유지할 때",
        watch: "해동 후 식감이 필요한 메뉴에는 피하는 편이 좋습니다.",
      },
    ],
    "rice-10kg-price-family-budget": [
      {
        option: "쌀 10kg",
        bestFor: "밥을 자주 해 먹는 3~4인 가구",
        watch: "보관 공간과 밀폐 용기가 없으면 품질 손실이 생깁니다.",
      },
      {
        option: "쌀 5kg 이하",
        bestFor: "1~2인 가구나 외식이 잦은 집",
        watch: "단가는 높아도 신선도와 보관 안정성이 좋을 수 있습니다.",
      },
      {
        option: "잡곡 혼합",
        bestFor: "식단 변화를 주면서 포만감을 높이고 싶을 때",
        watch: "가족이 실제로 먹는 비율부터 작게 시험해야 합니다.",
      },
    ],
    "brown-rice-mix-cost-health-meal": [
      {
        option: "현미 10~20%",
        bestFor: "처음 현미를 섞는 집이나 아이 식단",
        watch: "식감 적응이 안 되면 밥을 남길 수 있습니다.",
      },
      {
        option: "현미 30% 이상",
        bestFor: "불림 시간과 씹는 식감에 익숙한 집",
        watch: "조리 시간이 늘고 외식으로 빠질 가능성을 봐야 합니다.",
      },
      {
        option: "백미 중심 유지",
        bestFor: "가족 반응이 아직 불확실할 때",
        watch: "건강식 이미지만 보고 대량 구매하면 실패할 수 있습니다.",
      },
    ],
  };

  return (
    customRows[post.slug] ?? [
      {
        option: post.mainKeyword,
        bestFor: "오늘 바로 쓸 메뉴가 있고 구매 목적이 분명할 때",
        watch: "가격만 보지 말고 남을 가능성과 보관 시간을 같이 봐야 합니다.",
      },
      {
        option: post.expandedKeywords[0] ?? post.category,
        bestFor: "대체재나 보완 재료를 함께 검토할 때",
        watch: "맛, 식감, 조리 시간이 달라질 수 있습니다.",
      },
      {
        option: post.expandedKeywords[2] ?? "보관 기준",
        bestFor: "며칠 뒤까지 품질을 유지해야 할 때",
        watch: "구매 직후 처리하지 않으면 할인 효과가 줄어듭니다.",
      },
    ]
  );
}

function getArticleHeroImage(
  post: NonNullable<ReturnType<typeof getEditorialPost>>,
) {
  if (post.slug.includes("freezer") || post.slug.includes("meal-prep")) {
    return {
      src: "/images/nongsusan-freezer-hero.jpg",
      alt: `${post.category} 냉동 보관 장보기 이미지`,
    };
  }

  if (
    post.slug.includes("leafy") ||
    post.slug.includes("lettuce") ||
    post.slug.includes("salad") ||
    post.slug.includes("rainy-day") ||
    post.slug.includes("heatwave")
  ) {
    return {
      src: "/images/nongsusan-leafy-hero.jpg",
      alt: `${post.category} 잎채소 장보기 이미지`,
    };
  }

  if (
    post.slug.includes("root") ||
    post.slug.includes("potato") ||
    post.slug.includes("radish") ||
    post.slug.includes("onion") ||
    post.slug.includes("garlic") ||
    post.slug.includes("rice") ||
    post.slug.includes("grain") ||
    post.slug.includes("storage") ||
    post.slug.includes("bulk-buying") ||
    post.slug.includes("cold-wave")
  ) {
    return {
      src: "/images/nongsusan-root-storage-hero.jpg",
      alt: `${post.category} 저장 채소 장보기 이미지`,
    };
  }

  if (post.category.includes("수산")) {
    return {
      src: "/images/nongsusan-seafood-hero.jpg",
      alt: `${post.category} 수산물 장보기 이미지`,
    };
  }

  if (post.category.includes("과일") || post.category.includes("과채")) {
    return {
      src: "/images/nongsusan-fruit-hero.jpg",
      alt: `${post.category} 과일 장보기 이미지`,
    };
  }

  if (
    post.category.includes("채소") ||
    post.category.includes("양념") ||
    post.category.includes("곡물")
  ) {
    return {
      src: "/images/nongsusan-vegetable-hero.jpg",
      alt: `${post.category} 채소 장보기 이미지`,
    };
  }

  return {
    src: "/images/nongsusan-article-hero.jpg",
    alt: `${post.category} 농수산품 장보기 이미지`,
  };
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
