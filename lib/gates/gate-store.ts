import { desc, eq } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { gateDecisions, gateRuns } from "@/lib/db/schema";
import type { GateStatus } from "@/lib/gates/readiness";
import type { Gate05ProbeReport } from "@/lib/probe/gate05";

export type GateDecisionInput = {
  checkId: string;
  label: string;
  status: GateStatus;
  decision: string;
  measuredValue?: string | null;
};

export async function saveGate05ProbeReport(
  db: Database,
  report: Gate05ProbeReport,
) {
  const insertedRuns = await db
    .insert(gateRuns)
    .values({
      source: report.source,
      status: "success",
      rawReport: report,
    })
    .returning({ id: gateRuns.id });
  const runId = insertedRuns[0]?.id;

  if (!runId) {
    throw new Error("Failed to persist Gate 0.5 probe run.");
  }

  for (const decision of gate05DecisionsFromReport(report)) {
    await upsertGateDecision(db, decision, runId);
  }

  return runId;
}

export async function saveManualGateDecision(
  db: Database,
  decision: GateDecisionInput,
) {
  const insertedRuns = await db
    .insert(gateRuns)
    .values({
      source: "manual",
      status: "success",
      rawReport: {
        type: "manual_gate_decision",
        decision,
        recordedAt: new Date().toISOString(),
      },
    })
    .returning({ id: gateRuns.id });
  const runId = insertedRuns[0]?.id;

  if (!runId) {
    throw new Error("Failed to persist manual gate decision run.");
  }

  await upsertGateDecision(db, decision, runId);

  return runId;
}

export async function upsertGateDecision(
  db: Database,
  decision: GateDecisionInput,
  sourceRunId?: number,
) {
  await db
    .insert(gateDecisions)
    .values({
      checkId: decision.checkId,
      label: decision.label,
      status: decision.status,
      decision: decision.decision,
      measuredValue: decision.measuredValue ?? null,
      sourceRunId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: gateDecisions.checkId,
      set: {
        label: decision.label,
        status: decision.status,
        decision: decision.decision,
        measuredValue: decision.measuredValue ?? null,
        sourceRunId,
        updatedAt: new Date(),
      },
    });
}

export async function getLatestGateRun(db: Database) {
  return db.query.gateRuns.findFirst({
    orderBy: [desc(gateRuns.createdAt)],
  });
}

export async function listGateDecisions(db: Database) {
  return db.select().from(gateDecisions);
}

export async function getGateDecision(db: Database, checkId: string) {
  return db.query.gateDecisions.findFirst({
    where: eq(gateDecisions.checkId, checkId),
  });
}

export function gate05DecisionsFromReport(
  report: Gate05ProbeReport,
): GateDecisionInput[] {
  const analysis = report.analysis;

  return [
    {
      checkId: "region_dimension",
      label: "Gate 0.5 region dimension",
      status: analysis.region.hasRegionFields ? "pass" : "branch",
      measuredValue: analysis.region.suggestedSource,
      decision: analysis.region.hasRegionFields
        ? `Region fields detected: ${analysis.region.detectedFields.join(", ")}.`
        : "No region fields were detected; use B route without regional page multiplication.",
    },
    {
      checkId: "wholesale_retail_join",
      label: "Gate 0.5 wholesale-retail join",
      status: ratioStatus(analysis.wholesaleRetail.matchRate, 0.7),
      measuredValue: formatRatio(analysis.wholesaleRetail.matchRate),
      decision:
        analysis.wholesaleRetail.matchRate === undefined
          ? "Wholesale-retail matching could not be measured from the probe records."
          : `Measured match rate ${analysis.wholesaleRetail.matchRate.toFixed(2)} from ${analysis.wholesaleRetail.observedJoinPairs} paired observations.`,
    },
    {
      checkId: "unit_weight_share",
      label: "Gate 0.5 unit classification",
      status: ratioStatus(analysis.units.weightShare, 0.5),
      measuredValue: formatRatio(analysis.units.weightShare),
      decision:
        analysis.units.weightShare === undefined
          ? "Unit weight share could not be measured from the probe records."
          : `Measured weight-unit share ${analysis.units.weightShare.toFixed(2)} across ${analysis.units.knownUnitCount} known units.`,
    },
    {
      checkId: "backfill_paging",
      label: "Gate 0.5 backfill paging",
      status:
        report.source === "http" &&
        report.paging.observedNextCursor &&
        report.paging.exhausted
          ? "pass"
          : "pending",
      measuredValue: String(report.paging.pagesFetched),
      decision:
        report.source === "http" &&
        report.paging.observedNextCursor &&
        report.paging.exhausted
          ? `HTTP probe followed pagination across ${report.paging.pagesFetched} pages and exhausted the cursor.`
          : "Backfill paging still requires manual confirmation after API probing.",
    },
  ];
}

function ratioStatus(value: number | undefined, threshold: number): GateStatus {
  if (value === undefined) {
    return "pending";
  }

  return value >= threshold ? "pass" : "branch";
}

function formatRatio(value: number | undefined) {
  return value === undefined ? null : value.toFixed(2);
}
