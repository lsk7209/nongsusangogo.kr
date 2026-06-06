import { readEnv } from "@/lib/config/env";
import type { Database } from "@/lib/db/client";
import {
  buildReadinessReport,
  buildReadinessReportFromDb,
} from "@/lib/gates/readiness";

type EnvSource = Partial<Record<string, string | undefined>>;

export function isPublicLaunchAllowed(source: EnvSource = process.env) {
  return buildReadinessReport(source).publicLaunchAllowed;
}

export function canUseFixturePublicFallback(source: EnvSource = process.env) {
  return (
    readEnv(source).ALLOW_FIXTURE_PUBLIC ||
    (source.NODE_ENV ?? process.env.NODE_ENV) !== "production"
  );
}

export function canExposePublicContent(source: EnvSource = process.env) {
  return isPublicLaunchAllowed(source) || canUseFixturePublicFallback(source);
}

export async function isPublicLaunchAllowedForDb(
  db: Database | undefined,
  source: EnvSource = process.env,
) {
  if (!db) {
    return isPublicLaunchAllowed(source);
  }

  try {
    return (await buildReadinessReportFromDb(db, source)).publicLaunchAllowed;
  } catch {
    return isPublicLaunchAllowed(source);
  }
}

export async function canExposePublicContentForDb(
  db: Database | undefined,
  source: EnvSource = process.env,
) {
  return (
    (await isPublicLaunchAllowedForDb(db, source)) ||
    canUseFixturePublicFallback(source)
  );
}
