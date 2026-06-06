import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { pages, publishLog } from "@/lib/db/schema";
import {
  buildReadinessReportFromDb,
  buildReadinessReport,
  type ReadinessReport,
} from "@/lib/gates/readiness";

export type DripFeedResult = {
  published: number;
  blocked: boolean;
  reason: string | null;
};

export async function promoteQualityPassedPages(
  db: Database,
  options: {
    limit: number;
    env?: Partial<Record<string, string | undefined>>;
    readiness?: ReadinessReport;
  },
): Promise<DripFeedResult> {
  if (!Number.isInteger(options.limit) || options.limit < 1) {
    throw new Error("Publish limit must be an integer greater than 0.");
  }

  const readiness =
    options.readiness ??
    (options.env
      ? buildReadinessReport(options.env)
      : await buildReadinessReportFromDb(db));

  if (!readiness.publishAllowed) {
    const pending = readiness.checks
      .filter((check) => check.status === "pending")
      .map((check) => check.id);
    const failed = readiness.checks
      .filter((check) => check.status === "fail")
      .map((check) => check.id);

    return {
      published: 0,
      blocked: true,
      reason: `Gate 0.5 and Gate 0 readiness is incomplete: pending=${formatCheckIds(
        pending,
      )}; fail=${formatCheckIds(failed)}`,
    };
  }

  const candidates = await db.query.pages.findMany({
    where: eq(pages.status, "quality_passed"),
    limit: options.limit,
  });

  for (const page of candidates) {
    await db
      .update(pages)
      .set({
        status: "published",
        firstPublishedAt: page.firstPublishedAt ?? new Date(),
      })
      .where(eq(pages.id, page.id));

    await db.insert(publishLog).values({
      pageId: page.id,
      fromStatus: "quality_passed",
      toStatus: "published",
      reason: "drip_feed",
    });
  }

  return {
    published: candidates.length,
    blocked: false,
    reason: null,
  };
}

function formatCheckIds(ids: string[]) {
  return ids.length > 0 ? ids.join(", ") : "none";
}
