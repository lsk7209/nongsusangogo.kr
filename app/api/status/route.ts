import { getQualityPassedPages, sitePages } from "@/lib/content/site-pages";
import {
  countPagesByStatus,
  getLatestCheckpoint,
} from "@/lib/content/db-pages";
import { createDatabase } from "@/lib/db/client";
import {
  buildReadinessReport,
  buildReadinessReportFromDb,
  type ReadinessReport,
} from "@/lib/gates/readiness";
import { canUseFixturePublicFallback } from "@/lib/gates/public-launch";
import { getLatestGateRun } from "@/lib/gates/gate-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbConfigured = Boolean(process.env.TURSO_DATABASE_URL);
  const cronAuthConfigured = Boolean(process.env.CRON_SECRET);
  const kamisApiConfigured = Boolean(
    process.env.KAMIS_CERT_ID && process.env.KAMIS_CERT_KEY,
  );
  const db = dbConfigured ? createDatabase() : null;
  const readinessResult = await getReadiness(db);
  const readiness = readinessResult.readiness;
  const dbStatus = await getDbStatus(db);

  return Response.json({
    service: "nongsusangogo",
    phase: 5,
    licenseConfirmed: process.env.DATA_LICENSE_CONFIRMED === "true",
    readiness,
    readinessSource: readiness.source,
    readinessError: readinessResult.error,
    publicLaunchAllowed: readiness.publicLaunchAllowed,
    fixtureFallbackEnabled: canUseFixturePublicFallback(),
    dataMode: kamisApiConfigured ? "kamis_api" : "fixture_fallback",
    kamisApiConfigured,
    cronAuthConfigured,
    operationalWarnings: operationalWarnings({
      cronAuthConfigured,
      kamisApiConfigured,
    }),
    blockedChecks: readiness.checks.filter(
      (check) => check.status === "pending" || check.status === "fail",
    ),
    branchChecks: readiness.checks.filter((check) => check.status === "branch"),
    db: dbStatus,
    samplePages: {
      total: sitePages.length,
      qualityPassed: getQualityPassedPages().length,
      published: publishedPageCount(dbStatus.pageCounts),
    },
  });
}

function publishedPageCount(pageCounts: Record<string, number> | undefined) {
  return pageCounts?.published ?? 0;
}

function operationalWarnings(options: {
  cronAuthConfigured: boolean;
  kamisApiConfigured: boolean;
}) {
  const warnings: string[] = [];

  if (process.env.NODE_ENV === "production" && !options.cronAuthConfigured) {
    warnings.push(
      "CRON_SECRET is not configured; publish cron is unauthenticated.",
    );
  }

  if (!options.kamisApiConfigured) {
    warnings.push(
      "KAMIS API credentials are not configured; price pages use fixture fallback data.",
    );
  }

  return warnings;
}

async function getReadiness(
  db: ReturnType<typeof createDatabase> | null,
): Promise<{
  readiness: ReadinessReport;
  error?: string;
}> {
  if (!db) {
    return { readiness: buildReadinessReport() };
  }

  try {
    return { readiness: await buildReadinessReportFromDb(db) };
  } catch (error) {
    return {
      readiness: buildReadinessReport(),
      error: error instanceof Error ? error.message : "Unknown readiness error",
    };
  }
}

async function getDbStatus(db: ReturnType<typeof createDatabase> | null) {
  if (!db) {
    return {
      connected: false,
      pageCounts: {},
    };
  }

  try {
    const checkpoint = await getLatestCheckpoint(db);
    const gateRun = await getLatestGateRun(db);

    return {
      connected: true,
      pageCounts: await countPagesByStatus(db),
      latestGateRun: gateRun
        ? {
            id: gateRun.id,
            source: gateRun.source,
            status: gateRun.status,
            createdAt: gateRun.createdAt,
          }
        : null,
      latestCheckpoint: checkpoint
        ? {
            sourceCode: checkpoint.sourceCode,
            scopeKey: checkpoint.scopeKey,
            cursor: checkpoint.cursor,
            lastSuccessAt: checkpoint.lastSuccessAt,
          }
        : null,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown database error",
      pageCounts: {},
    };
  }
}
