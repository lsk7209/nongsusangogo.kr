import { getPublishedEditorialPosts } from "@/lib/content/editorial-posts";
import { readEnv } from "@/lib/config/env";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return {
    title: "농산물 시세와 장보기 인사이트",
    description:
      "농산물 시세, 장보기 보관, 대체재, 가격 읽기 기준을 정리한 농수산고고 SEO/AEO 콘텐츠 모음입니다.",
    alternates: {
      canonical: `${readEnv().SITE_URL}/blog`,
    },
  };
}

export default function BlogIndex() {
  const posts = getPublishedEditorialPosts();
  const [featuredPost, ...remainingPosts] = posts;
  const filters = ["전체", "제철", "가격 읽기", "보관", "대체재"];

  return (
    <main>
      <header className="blog-header">
        <p className="eyebrow">농수산고고 인사이트</p>
        <h1>가격을 읽으면, 장보기가 쉬워집니다</h1>
        <p>
          품목별 가격, 보관 손실, 대체재, 계절 변동을 함께 보며 실제
          장바구니 판단에 도움이 되는 글만 순차 공개합니다.
        </p>
      </header>

      {posts.length > 0 ? (
        <>
          <section className="featured-post" aria-label="대표 글">
            <div>
              <span className="blog-card-meta">
                {featuredPost.category} · {featuredPost.intent}
              </span>
              <h2>{featuredPost.title}</h2>
              <p>{featuredPost.excerpt}</p>
            </div>
            <a className="read-more-link" href={`/blog/${featuredPost.slug}`}>
              대표 글 보기
            </a>
          </section>

          <div className="filter-pills" aria-label="글 주제">
            {filters.map((filter) => (
              <span key={filter}>{filter}</span>
            ))}
          </div>

          <section className="blog-card-grid" aria-label="블로그 글 목록">
            {remainingPosts.map((post) => (
              <a className="blog-card" href={`/blog/${post.slug}`} key={post.slug}>
                <span className="blog-card-meta">
                  {post.category} · {post.intent}
                </span>
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                <div className="blog-card-keywords" aria-label="주요 키워드">
                  <span>{post.mainKeyword}</span>
                  {post.expandedKeywords.slice(0, 2).map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))}
                </div>
              </a>
            ))}
          </section>
        </>
      ) : (
        <section className="panel">
          <h2>공개 예정 글을 준비 중입니다</h2>
          <p>
            품질 기준을 통과한 글만 예약 시간에 맞춰 공개합니다. 다음 공개
            글은 농산물 장보기 판단에 바로 활용할 수 있는 형식으로 제공됩니다.
          </p>
        </section>
      )}
    </main>
  );
}
