import { createKamisClient } from "@/lib/kamis/client";
import type { KamisClient, KamisPriceRecord } from "@/lib/kamis/types";

export type Gate05ProbeAnalysis = {
  totalRecords: number;
  region: {
    hasRegionFields: boolean;
    detectedFields: string[];
    suggestedSource: "free" | "none" | "unknown";
  };
  units: {
    knownUnitCount: number;
    weightUnitCount: number;
    weightShare: number | undefined;
    unknownUnits: string[];
  };
  prices: {
    missingPriceCount: number;
    missingPriceShare: number | undefined;
  };
  rank: {
    detected: boolean;
    values: string[];
  };
  discount: {
    detected: boolean;
    fields: string[];
  };
  wholesaleRetail: {
    observedJoinPairs: number;
    matchRate: number | undefined;
  };
};

export type Gate05ProbeReport = {
  source: "mock" | "http";
  analysis: Gate05ProbeAnalysis;
  paging: {
    pagesFetched: number;
    observedNextCursor: boolean;
    exhausted: boolean;
  };
  readinessEnv: Record<string, string>;
  blockers: string[];
};

const regionFields = [
  "mrkt_nm",
  "ctnp_nm",
  "sggu_nm",
  "p_country_code",
  "region_code",
  "regionCode",
];
const discountFields = ["is_discount", "isDiscount", "discount", "sale_yn"];

export async function runGate05Probe(
  options: {
    client?: KamisClient;
    source?: "mock" | "http";
  } = {},
): Promise<Gate05ProbeReport> {
  const client = options.client ?? createKamisClient();
  const records: KamisPriceRecord[] = [];
  let cursor: string | null | undefined = null;
  let pagesFetched = 0;
  let observedNextCursor = false;

  for (let page = 0; page < 5; page += 1) {
    const response = await client.fetchDailyPrices({ cursor });
    pagesFetched += 1;
    records.push(...response.records);
    observedNextCursor ||= Boolean(response.nextCursor);
    cursor = response.nextCursor;

    if (!cursor) {
      break;
    }
  }

  const analysis = analyzeGate05Records(records);
  return {
    source: options.source ?? "mock",
    analysis,
    paging: {
      pagesFetched,
      observedNextCursor,
      exhausted: !cursor,
    },
    readinessEnv: suggestReadinessEnv(analysis),
    blockers: listProbeBlockers(analysis),
  };
}

export function analyzeGate05Records(
  records: Array<Record<string, unknown>>,
): Gate05ProbeAnalysis {
  const detectedRegionFields = fieldsPresent(records, regionFields);
  const detectedDiscountFields = fieldsPresent(records, discountFields);
  const units = records
    .map((record) => stringValue(record.unit))
    .filter((unit): unit is string => Boolean(unit));
  const weightUnitCount = units.filter(isWeightUnit).length;
  const prices = records.map((record) => record.price);
  const missingPriceCount = prices.filter(isMissingValue).length;
  const rankValues = unique(
    records
      .map(
        (record) => stringValue(record.rank) ?? stringValue(record.item_rank),
      )
      .filter((rank): rank is string => Boolean(rank)),
  );
  const matchRate = estimateWholesaleRetailMatchRate(records);

  return {
    totalRecords: records.length,
    region: {
      hasRegionFields: detectedRegionFields.length > 0,
      detectedFields: detectedRegionFields,
      suggestedSource: detectedRegionFields.length > 0 ? "free" : "none",
    },
    units: {
      knownUnitCount: units.length,
      weightUnitCount,
      weightShare:
        units.length === 0 ? undefined : weightUnitCount / units.length,
      unknownUnits: unique(units.filter((unit) => !isWeightUnit(unit))).slice(
        0,
        20,
      ),
    },
    prices: {
      missingPriceCount,
      missingPriceShare:
        records.length === 0 ? undefined : missingPriceCount / records.length,
    },
    rank: {
      detected: rankValues.length > 0,
      values: rankValues,
    },
    discount: {
      detected: detectedDiscountFields.length > 0,
      fields: detectedDiscountFields,
    },
    wholesaleRetail: {
      observedJoinPairs: matchRate.pairs,
      matchRate: matchRate.rate,
    },
  };
}

export function suggestReadinessEnv(analysis: Gate05ProbeAnalysis) {
  return {
    KAMIS_REGION_SOURCE: analysis.region.suggestedSource,
    WHOLESALE_RETAIL_MATCH_RATE:
      analysis.wholesaleRetail.matchRate === undefined
        ? ""
        : analysis.wholesaleRetail.matchRate.toFixed(2),
    UNIT_WEIGHT_SHARE:
      analysis.units.weightShare === undefined
        ? ""
        : analysis.units.weightShare.toFixed(2),
    BACKFILL_PAGING_CONFIRMED: "false",
  };
}

export function listProbeBlockers(analysis: Gate05ProbeAnalysis) {
  const blockers: string[] = [];

  if (analysis.totalRecords === 0) {
    blockers.push(
      "No records were returned; API credentials or endpoint need review.",
    );
  }

  if (!analysis.rank.detected) {
    blockers.push(
      "Rank dimension was not detected; headline rank policy cannot be validated.",
    );
  }

  if (
    analysis.prices.missingPriceShare !== undefined &&
    analysis.prices.missingPriceShare > 0.3
  ) {
    blockers.push(
      "Missing price share is high; sparse display policy must be reviewed.",
    );
  }

  if (
    analysis.wholesaleRetail.matchRate !== undefined &&
    analysis.wholesaleRetail.matchRate < 0.7
  ) {
    blockers.push(
      "Wholesale-retail match rate is below margin-section threshold.",
    );
  }

  return blockers;
}

function fieldsPresent(
  records: Array<Record<string, unknown>>,
  fields: string[],
) {
  return fields.filter((field) =>
    records.some(
      (record) => record[field] !== undefined && record[field] !== null,
    ),
  );
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function isMissingValue(value: unknown) {
  return value === null || value === undefined || value === "" || value === "-";
}

function isWeightUnit(unit: string) {
  return (
    /\b(kg|g)\b/i.test(unit) ||
    /\d+\s*(kg|g)/i.test(unit) ||
    unit.includes("\uadfc") ||
    unit.includes("\ud0ac\ub85c") ||
    unit.includes("\uadf8\ub7a8")
  );
}

function estimateWholesaleRetailMatchRate(
  records: Array<Record<string, unknown>>,
) {
  const groups = new Map<string, Set<string>>();

  for (const record of records) {
    const wsrt = stringValue(record.wsrt);
    const itemCode =
      stringValue(record.itemCode) ?? stringValue(record.item_code);
    const kindCode =
      stringValue(record.kindCode) ?? stringValue(record.kind_code);
    const rank = stringValue(record.rank) ?? "unknown";
    const region =
      stringValue(record.regionCode) ??
      stringValue(record.region_code) ??
      "all";
    const date = stringValue(record.date);

    if (!wsrt || !itemCode || !kindCode || !date) {
      continue;
    }

    const key = `${date}:${itemCode}:${kindCode}:${rank}:${region}`;
    groups.set(key, (groups.get(key) ?? new Set()).add(wsrt));
  }

  if (groups.size === 0) {
    return { pairs: 0, rate: undefined };
  }

  const pairs = [...groups.values()].filter(
    (group) => group.has("wholesale") && group.has("retail"),
  ).length;

  return {
    pairs,
    rate: pairs / groups.size,
  };
}
