import type { CSSProperties } from "react";
import type { Metadata } from "next";
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
  const tocItems = [...bodyHeadings, ...deepDiveHeadings];
  const wordCount = [
    post.quickAnswer,
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

      <section className="panel article-answer">
        <h2>빠른 답변</h2>
        <p>{post.quickAnswer}</p>
      </section>

      <section className="article-elements" aria-label="글 구성 요소">
        {post.contentElements.map((element) => (
          <span key={element}>{element}</span>
        ))}
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
              <p>{link.href}</p>
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
      </section>
      <Disclosure />
    </main>
  );
}
