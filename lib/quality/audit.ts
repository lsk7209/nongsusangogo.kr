import type { Database } from "@/lib/db/client";
import { pages } from "@/lib/db/schema";
import { countPagesByStatus } from "@/lib/content/db-pages";

export type QualityAuditViolation = {
  pageId: number;
  slug: string;
  status: string;
  rule: string;
  message: string;
};

export type QualityAuditReport = {
  counts: Record<string, number>;
  checked: number;
  violations: QualityAuditViolation[];
  passed: boolean;
};

const publishableStatuses = new Set(["quality_passed", "published"]);

export async function auditPageQualityState(
  db: Database,
): Promise<QualityAuditReport> {
  const rows = await db.select().from(pages);
  const violations = rows.flatMap((row) => pageViolations(row));

  return {
    counts: await countPagesByStatus(db),
    checked: rows.length,
    violations,
    passed: violations.length === 0,
  };
}

type PageRow = typeof pages.$inferSelect;

function pageViolations(row: PageRow): QualityAuditViolation[] {
  const violations: QualityAuditViolation[] = [];

  if (publishableStatuses.has(row.status)) {
    if (!row.gatePassed) {
      violations.push(
        violation(
          row,
          "gate_passed",
          "Publishable pages must have gatePassed=true.",
        ),
      );
    }

    if (row.qualityScore === null || row.qualityScore <= 0) {
      violations.push(
        violation(
          row,
          "quality_score",
          "Publishable pages must have a positive quality score.",
        ),
      );
    }

    if (!Array.isArray(row.activeSections) || row.activeSections.length === 0) {
      violations.push(
        violation(
          row,
          "active_sections",
          "Publishable pages must have at least one active section.",
        ),
      );
    }

    if (!Array.isArray(row.uniquePoints) || row.uniquePoints.length < 3) {
      violations.push(
        violation(
          row,
          "unique_points",
          "Publishable pages must have at least three unique points.",
        ),
      );
    }
  }

  if (row.status === "published" && !row.firstPublishedAt) {
    violations.push(
      violation(
        row,
        "first_published_at",
        "Published pages must have firstPublishedAt set.",
      ),
    );
  }

  if (row.status === "rejected" && row.gatePassed) {
    violations.push(
      violation(
        row,
        "rejected_gate_state",
        "Rejected pages must not have gatePassed=true.",
      ),
    );
  }

  return violations;
}

function violation(
  row: PageRow,
  rule: string,
  message: string,
): QualityAuditViolation {
  return {
    pageId: row.id,
    slug: row.slug,
    status: row.status,
    rule,
    message,
  };
}
