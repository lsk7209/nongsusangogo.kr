import type { Metadata } from "next";
import { AnalyticsScripts } from "@/components/analytics-scripts";
import { readEnv } from "@/lib/config/env";
import "./globals.css";

const env = readEnv();
const googleSiteVerification =
  env.GOOGLE_SITE_VERIFICATION ??
  "NMjcqkG5xC8wts9aniDfqyrzvET4JIFFknFZvQIbIpM";
const naverSiteVerification =
  env.NAVER_SITE_VERIFICATION ?? "06c0f17cbec9a0356acac84e2d1b57e8656f8bd6";
const adsenseClientId =
  env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID ??
  env.GOOGLE_ADSENSE_CLIENT_ID ??
  "ca-pub-3050601904412736";

export const metadata: Metadata = {
  title: {
    default: "농수산고고",
    template: "%s | 농수산고고",
  },
  description:
    "농산물 시세, 장보기 타이밍, 보관 손실, 대체재 기준을 실생활 관점으로 정리하는 농수산고고입니다.",
  metadataBase: new URL(env.SITE_URL),
  verification: {
    google: googleSiteVerification,
  },
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
        <meta
          name="naver-site-verification"
          content={naverSiteVerification}
        />
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          crossOrigin="anonymous"
        />
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
              <a href="/about">소개</a>
              <a href="/contact">문의</a>
            </div>
          </nav>
          {children}
          <footer className="site-footer">
            <div>
              <strong>농수산고고</strong>
              <p>
                농수산물 가격 흐름, 장보기 타이밍, 보관 손실, 대체재 선택
                기준을 생활 관점으로 정리합니다.
              </p>
            </div>
            <nav aria-label="사이트 정보">
              <a href="/about">소개</a>
              <a href="/contact">문의</a>
              <a href="/privacy">개인정보 처리방침</a>
              <a href="/terms">이용약관</a>
              <a href="/rss.xml">RSS</a>
            </nav>
          </footer>
        </div>
        <nav className="bottom-tabs" aria-label="모바일 주요 메뉴">
          <a href="/">홈</a>
          <a href="/hubs/vegetable">카테고리</a>
          <a href="/blog">블로그</a>
          <a href="/contact">문의</a>
        </nav>
      </body>
    </html>
  );
}
