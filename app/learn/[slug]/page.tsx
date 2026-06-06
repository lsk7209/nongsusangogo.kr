import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KeywordPageView } from "@/components/keyword-page-view";
import { readEnv } from "@/lib/config/env";
import { getKeywordPage, getKeywordPagesByIntent } from "@/lib/content/keyword-pages";
import { canUseFixturePublicFallback } from "@/lib/gates/public-launch";

type PageProps = { params: { slug: string } };

export function generateStaticParams() {
  if (!canUseFixturePublicFallback()) {
    return [];
  }

  return getKeywordPagesByIntent("learn").map((page) => ({ slug: page.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  if (!canUseFixturePublicFallback()) return {};

  const page = getKeywordPage("learn", params.slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.searchSummary,
    alternates: { canonical: `${readEnv().SITE_URL}${page.path}` },
  };
}

export default function LearnPage({ params }: PageProps) {
  if (!canUseFixturePublicFallback()) notFound();

  const page = getKeywordPage("learn", params.slug);
  if (!page) notFound();
  return <KeywordPageView page={page} />;
}
