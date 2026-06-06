import { and, eq, like } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { pages } from "@/lib/db/schema";
import {
  getKeywordPage,
  getKeywordPagesByIntent,
  getQualityKeywordPages,
  type KeywordIntent,
  type KeywordPage,
} from "@/lib/content/keyword-pages";
import {
  canExposePublicContentForDb,
  canUseFixturePublicFallback,
} from "@/lib/gates/public-launch";

const dbKeywordIntents: KeywordIntent[] = [
  "timing",
  "swap",
  "compare",
  "season",
];

export async function loadKeywordPagesSafe(
  db?: Database,
): Promise<KeywordPage[]> {
  if (!(await canExposePublicContentForDb(db))) {
    return [];
  }

  const fallback = canUseFixturePublicFallback()
    ? getQualityKeywordPages()
    : [];

  if (!db) {
    return fallback;
  }

  try {
    const rows = await db.query.pages.findMany({
      where: eq(pages.status, "published"),
    });
    const dbPages = rows
      .map(rowToKeywordPage)
      .filter((page): page is KeywordPage => Boolean(page));

    return mergeKeywordPages(fallback, dbPages);
  } catch {
    return fallback;
  }
}

export async function findKeywordPageSafe(
  db: Database | undefined,
  intent: KeywordIntent,
  slug: string,
) {
  const pages = await loadKeywordPagesSafe(db);
  return (
    pages.find((page) => page.intent === intent && page.slug === slug) ??
    (canUseFixturePublicFallback() ? getKeywordPage(intent, slug) : undefined)
  );
}

export async function getKeywordPagesByIntentSafe(
  db: Database | undefined,
  intent: KeywordIntent,
) {
  const pages = await loadKeywordPagesSafe(db);
  return pages.filter((page) => page.intent === intent);
}

export async function getDbKeywordStaticParams(
  db: Database | undefined,
  intent: KeywordIntent,
) {
  if (!(await canExposePublicContentForDb(db))) {
    return [];
  }

  const fallbackSlugs = canUseFixturePublicFallback()
    ? getKeywordPagesByIntent(intent).map((page) => page.slug)
    : [];

  if (!db || !dbKeywordIntents.includes(intent)) {
    return fallbackSlugs;
  }

  try {
    const rows = await db.query.pages.findMany({
      where: and(
        eq(pages.status, "published"),
        like(pages.slug, `${intent}-%`),
      ),
    });
    const dbSlugs = rows
      .map((row) => inferKeywordIdentity(row.slug))
      .filter((identity): identity is { intent: KeywordIntent; slug: string } =>
        Boolean(identity && identity.intent === intent),
      )
      .map((identity) => identity.slug);

    return [...new Set([...fallbackSlugs, ...dbSlugs])];
  } catch {
    return fallbackSlugs;
  }
}

type PageRow = typeof pages.$inferSelect;

function rowToKeywordPage(row: PageRow): KeywordPage | null {
  const identity = inferKeywordIdentity(row.slug);
  if (!identity) {
    return null;
  }

  return {
    intent: identity.intent,
    slug: identity.slug,
    path: `/${identity.intent}/${identity.slug}`,
    title: row.title,
    primaryKeyword: row.title,
    secondaryKeywords: Array.isArray(row.uniquePoints)
      ? row.uniquePoints.map(String)
      : [],
    searchSummary:
      typeof row.aiCommentary === "string" && row.aiCommentary.trim()
        ? row.aiCommentary.slice(0, 160)
        : `${row.title} 관련 시세와 비교 지표를 확인합니다.`,
    body: [
      typeof row.aiCommentary === "string" && row.aiCommentary.trim()
        ? row.aiCommentary
        : "품질 게이트를 통과한 키워드 확장 페이지입니다.",
    ],
    relatedLinks: row.itemCode
      ? [{ href: `/items/${row.itemCode}`, label: "관련 품목 시세" }]
      : [],
    status: "quality_passed",
  };
}

function inferKeywordIdentity(slug: string) {
  const [prefix, ...rest] = slug.split("-");

  if (
    !dbKeywordIntents.includes(prefix as KeywordIntent) ||
    rest.length === 0
  ) {
    return null;
  }

  return {
    intent: prefix as KeywordIntent,
    slug: rest.join("-"),
  };
}

function mergeKeywordPages(fallback: KeywordPage[], dbPages: KeywordPage[]) {
  const byPath = new Map<string, KeywordPage>();

  for (const page of [...fallback, ...dbPages]) {
    byPath.set(page.path, page);
  }

  return [...byPath.values()];
}
