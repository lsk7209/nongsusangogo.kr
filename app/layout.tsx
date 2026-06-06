import type { Metadata } from "next";
import { AnalyticsScripts } from "@/components/analytics-scripts";
import { readEnv } from "@/lib/config/env";
import "./globals.css";

const env = readEnv();

export const metadata: Metadata = {
  title: {
    default: "농수산고고",
    template: "%s | 농수산고고",
  },
  description:
    "농산물 시세, 장보기 타이밍, 보관 손실, 대체재 기준을 실생활 관점으로 정리하는 농수산고고입니다.",
  metadataBase: new URL(env.SITE_URL),
  verification: env.GOOGLE_SITE_VERIFICATION
    ? {
        google: env.GOOGLE_SITE_VERIFICATION,
      }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="농수산고고 RSS"
          href={`${env.SITE_URL}/rss.xml`}
        />
        {env.NAVER_SITE_VERIFICATION ? (
          <meta
            name="naver-site-verification"
            content={env.NAVER_SITE_VERIFICATION}
          />
        ) : null}
      </head>
      <body>
        <AnalyticsScripts />
        <div className="shell">
          <nav className="top-nav" aria-label="주요 메뉴">
            <a className="brand" href="/">
              <span className="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img">
                  <path d="M12 21c-4.9-2.4-7.3-5.6-7.3-9.5 0-3.7 2.8-6.6 6.5-6.6 1.3 0 2.5.4 3.5 1.1.8-.7 1.9-1.1 3.1-1.1 2.9 0 5.2 2.4 5.2 5.4 0 4.4-3.6 7.7-11 10.7Z" />
                  <path d="M9 9.4c2.4.7 4.2 2 5.6 4.1M14.4 9.2c-.2 2-.9 3.6-2.2 4.9" />
                </svg>
              </span>
              농수산고고
            </a>
            <form className="site-search" action="/blog">
              <span aria-hidden="true">⌕</span>
              <input
                aria-label="농산물 검색"
                name="q"
                placeholder="배추, 사과, 삼겹살 검색"
              />
            </form>
            <div className="nav-links">
              <a href="/">홈</a>
              <a href="/hubs/vegetable">채소</a>
              <a href="/hubs/fruit">과일</a>
              <a href="/blog">블로그</a>
              <a href="/items/baechu-price">품목 상세</a>
            </div>
          </nav>
          {children}
        </div>
        <nav className="bottom-tabs" aria-label="모바일 주요 메뉴">
          <a href="/">홈</a>
          <a href="/hubs/vegetable">카테고리</a>
          <a href="/blog">블로그</a>
          <a href="/items/baechu-price">품목</a>
        </nav>
      </body>
    </html>
  );
}
