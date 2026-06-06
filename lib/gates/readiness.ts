import { readEnv, type AppEnv } from "@/lib/config/env";
import type { Database } from "@/lib/db/client";
import { gateDecisions } from "@/lib/db/schema";

export type GateStatus = "pass" | "fail" | "pending" | "branch";

export type GateCheck = {
  id: string;
  label: string;
  status: GateStatus;
  decision: string;
};

export type ReadinessReport = {
  route: "A-free" | "A-paid-candidate" | "B" | "blocked" | "pending";
  publicLaunchAllowed: boolean;
  publishAllowed: boolean;
  checks: GateCheck[];
  source: "env" | "db";
};

export type StoredGateDecision = {
  checkId: string;
  label: string;
  status: GateStatus;
  decision: string;
  measuredValue?: string | null;
};

export function buildReadinessReport(
  source: Partial<Record<string, string | undefined>> = process.env,
): ReadinessReport {
  return evaluateReadiness(readEnv(source), {});
}

export async function buildReadinessReportFromDb(
  db: Database,
  source: Partial<Record<string, string | undefined>> = process.env,
): Promise<ReadinessReport> {
  const rows = await db.select().from(gateDecisions);
  const decisions = Object.fromEntries(
    rows.map((row) => [
      row.checkId,
      {
        checkId: row.checkId,
        label: row.label,
        status: row.status,
        decision: row.decision,
        measuredValue: row.measuredValue,
      },
    ]),
  );

  return evaluateReadiness(readEnv(source), decisions, "db");
}

export function evaluateReadiness(
  env: AppEnv,
  storedDecisions: Record<string, StoredGateDecision | undefined> = {},
  source: "env" | "db" = "env",
): ReadinessReport {
  const checks = [
    withStoredDecision(licenseCheck(env), storedDecisions),
    withStoredDecision(regionCheck(env.KAMIS_REGION_SOURCE), storedDecisions),
    withStoredDecision(ratioCheck(
      "wholesale_retail_join",
      "Gate 0.5 wholesale-retail join",
      env.WHOLESALE_RETAIL_MATCH_RATE,
      0.7,
      "Margin sections stay disabled until matching rate is measured.",
    ), storedDecisions),
    withStoredDecision(ratioCheck(
      "unit_weight_share",
      "Gate 0.5 unit classification",
      env.UNIT_WEIGHT_SHARE,
      0.5,
      "Won/kg tools stay disabled until weight-based units are useful enough.",
    ), storedDecisions),
    withStoredDecision(booleanCheck(
      "backfill_paging",
      "Gate 0.5 backfill paging",
      env.BACKFILL_PAGING_CONFIRMED,
      "Long-term stitching remains fixture-only until paging is probed.",
    ), storedDecisions),
    withStoredDecision(booleanCheck(
      "datalab_intent",
      "Gate 0 DataLab intent",
      env.DATALAB_INTENT_CONFIRMED,
      "Search intent for timing, trend, season, and substitutes is unverified.",
    ), storedDecisions),
    withStoredDecision(booleanCheck(
      "cpa_rate",
      "Gate 0 CPA rate",
      env.CPA_RATE_CONFIRMED,
      "CPA stays secondary until grocery commission economics are measured.",
    ), storedDecisions),
    withStoredDecision(booleanCheck(
      "unit_economics",
      "Gate 0 unit economics",
      env.UNIT_ECONOMICS_CONFIRMED,
      "Paid data or heavy automation is blocked until revenue covers costs.",
    ), storedDecisions),
    withStoredDecision(booleanCheck(
      "zero_click",
      "Gate 0 zero-click review",
      env.ZERO_CLICK_REVIEWED,
      "Pages must keep tool, timing, and substitute value beyond instant answers.",
    ), storedDecisions),
  ];

  const hardBlocked = checks.some((check) => check.status === "fail");
  const allRequiredPassed = checks.every(
    (check) => check.status === "pass" || check.status === "branch",
  );

  return {
    route: hardBlocked
      ? "blocked"
      : routeFromRegionDecision(env.KAMIS_REGION_SOURCE, storedDecisions),
    publicLaunchAllowed: allRequiredPassed,
    publishAllowed: allRequiredPassed,
    checks,
    source,
  };
}

function withStoredDecision(
  fallback: GateCheck,
  storedDecisions: Record<string, StoredGateDecision | undefined>,
): GateCheck {
  const stored = storedDecisions[fallback.id];

  if (!stored) {
    return fallback;
  }

  return {
    id: stored.checkId,
    label: stored.label,
    status: stored.status,
    decision: stored.decision,
  };
}

function licenseCheck(env: AppEnv): GateCheck {
  return {
    id: "license",
    label: "Gate 0.5 license",
    status: env.DATA_LICENSE_CONFIRMED ? "pass" : "pending",
    decision: env.DATA_LICENSE_CONFIRMED
      ? "Commercial redistribution is confirmed."
      : "Publishing real data is blocked until KAMIS/KADX license is confirmed.",
  };
}

function regionCheck(source: AppEnv["KAMIS_REGION_SOURCE"]): GateCheck {
  if (source === "free") {
    return {
      id: "region_dimension",
      label: "Gate 0.5 region dimension",
      status: "pass",
      decision: "Free KAMIS API supports regional scale-out.",
    };
  }

  if (source === "paid") {
    return {
      id: "region_dimension",
      label: "Gate 0.5 region dimension",
      status: "branch",
      decision: "A-paid remains a candidate, but KADX license and economics must pass.",
    };
  }

  if (source === "none") {
    return {
      id: "region_dimension",
      label: "Gate 0.5 region dimension",
      status: "branch",
      decision: "Use B route without regional page multiplication.",
    };
  }

  return {
    id: "region_dimension",
    label: "Gate 0.5 region dimension",
    status: "pending",
    decision: "Region fields such as mrkt_nm, ctnp_nm, and sggu_nm are not probed yet.",
  };
}

function routeFromRegion(
  source: AppEnv["KAMIS_REGION_SOURCE"],
): ReadinessReport["route"] {
  if (source === "free") return "A-free";
  if (source === "paid") return "A-paid-candidate";
  if (source === "none") return "B";
  return "pending";
}

function routeFromRegionDecision(
  fallback: AppEnv["KAMIS_REGION_SOURCE"],
  storedDecisions: Record<string, StoredGateDecision | undefined>,
): ReadinessReport["route"] {
  const storedValue = storedDecisions.region_dimension?.measuredValue;

  if (storedValue === "free" || storedValue === "paid" || storedValue === "none") {
    return routeFromRegion(storedValue);
  }

  return routeFromRegion(fallback);
}

function booleanCheck(
  id: string,
  label: string,
  passed: boolean,
  pendingDecision: string,
): GateCheck {
  return {
    id,
    label,
    status: passed ? "pass" : "pending",
    decision: passed ? "Confirmed." : pendingDecision,
  };
}

function ratioCheck(
  id: string,
  label: string,
  value: number | undefined,
  threshold: number,
  pendingDecision: string,
): GateCheck {
  if (value === undefined) {
    return {
      id,
      label,
      status: "pending",
      decision: pendingDecision,
    };
  }

  return {
    id,
    label,
    status: value >= threshold ? "pass" : "branch",
    decision:
      value >= threshold
        ? `Measured ratio ${value} passes threshold ${threshold}.`
        : `Measured ratio ${value} is below ${threshold}; dependent sections remain disabled.`,
  };
}
