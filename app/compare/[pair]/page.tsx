import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KeywordPageView } from "@/components/keyword-page-view";
import { readEnv } from "@/lib/config/env";
import {
  findKeywordPageSafe,
  getDbKeywordStaticParams,
} from "@/lib/content/db-keyword-pages";
import { getOptionalDatabase } from "@/lib/content/db-pages";
import { createDatabase } from "@/lib/db/client";
import { buildKeywordSeo } from "@/lib/seo/adsense-metadata";

type PageProps = { params: { pair: string } };

export async function generateStaticParams() {
  const slugs = await getDbKeywordStaticParams(
    getOptionalDatabase(createDatabase),
    "compare",
  );
  return slugs.map((pair) => ({ pair }));
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const page = await findKeywordPageSafe(
    getOptionalDatabase(createDatabase),
    "compare",
    params.pair,
  );
  if (!page) return {};
  return {
    ...buildKeywordSeo(page),
    alternates: { canonical: `${readEnv().SITE_URL}${page.path}` },
  };
}

export default async function ComparePage({ params }: PageProps) {
  const page = await findKeywordPageSafe(
    getOptionalDatabase(createDatabase),
    "compare",
    params.pair,
  );
  if (!page) notFound();
  return <KeywordPageView page={page} />;
}
