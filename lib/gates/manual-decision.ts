import type { GateDecisionInput } from "@/lib/gates/gate-store";
import type { GateStatus } from "@/lib/gates/readiness";

export const manualGateDefinitions = {
  license: {
    label: "Gate 0.5 license",
    valueKind: "text",
  },
  region_dimension: {
    label: "Gate 0.5 region dimension",
    valueKind: "region",
  },
  wholesale_retail_join: {
    label: "Gate 0.5 wholesale-retail join",
    valueKind: "ratio",
  },
  unit_weight_share: {
    label: "Gate 0.5 unit classification",
    valueKind: "ratio",
  },
  backfill_paging: {
    label: "Gate 0.5 backfill paging",
    valueKind: "text",
  },
  datalab_intent: {
    label: "Gate 0 DataLab intent",
    valueKind: "text",
  },
  cpa_rate: {
    label: "Gate 0 CPA rate",
    valueKind: "text",
  },
  unit_economics: {
    label: "Gate 0 unit economics",
    valueKind: "text",
  },
  zero_click: {
    label: "Gate 0 zero-click review",
    valueKind: "text",
  },
} as const;

export type ManualGateCheckId = keyof typeof manualGateDefinitions;

const gateStatuses = ["pass", "pending", "fail", "branch"] as const;

export function parseManualGateDecisionArgs(args: string[]): GateDecisionInput {
  const parsed = parseFlagArgs(args);
  const checkId = parsed.check;
  const status = parsed.status;
  const decision = parsed.decision;
  const measuredValue = parsed.value;

  if (!isManualGateCheckId(checkId)) {
    throw new Error(
      `Unknown gate check "${checkId ?? ""}". Expected one of: ${Object.keys(
        manualGateDefinitions,
      ).join(", ")}.`,
    );
  }

  if (!isGateStatus(status)) {
    throw new Error(
      `Invalid gate status "${status ?? ""}". Expected one of: ${gateStatuses.join(
        ", ",
      )}.`,
    );
  }

  if ((status === "pass" || status === "fail") && !decision?.trim()) {
    throw new Error(`--decision is required when status is ${status}.`);
  }

  const definition = manualGateDefinitions[checkId];
  validateMeasuredValue(checkId, definition.valueKind, measuredValue);

  return {
    checkId,
    label: definition.label,
    status,
    decision: decision?.trim() || defaultDecision(status),
    measuredValue: measuredValue?.trim() || null,
  };
}

function parseFlagArgs(args: string[]) {
  const parsed: Record<string, string | undefined> = {};

  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];

    if (!key?.startsWith("--")) {
      throw new Error(
        `Unexpected argument "${key ?? ""}". Use --check, --status, --decision, and --value.`,
      );
    }

    const name = key.slice(2);
    const value = args[index + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${name}.`);
    }

    parsed[name] = value;
    index += 1;
  }

  return parsed;
}

function validateMeasuredValue(
  checkId: ManualGateCheckId,
  valueKind: "text" | "region" | "ratio",
  value: string | undefined,
) {
  if (!value) {
    return;
  }

  if (valueKind === "region" && !["free", "paid", "none"].includes(value)) {
    throw new Error(`${checkId} --value must be one of: free, paid, none.`);
  }

  if (valueKind === "ratio") {
    const ratio = Number(value);

    if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) {
      throw new Error(`${checkId} --value must be a number from 0 to 1.`);
    }
  }
}

function defaultDecision(status: GateStatus) {
  if (status === "pending") {
    return "Manual review is pending.";
  }

  return "Manual review recorded.";
}

function isManualGateCheckId(
  value: string | undefined,
): value is ManualGateCheckId {
  return Boolean(value && value in manualGateDefinitions);
}

function isGateStatus(value: string | undefined): value is GateStatus {
  return gateStatuses.some((status) => status === value);
}
