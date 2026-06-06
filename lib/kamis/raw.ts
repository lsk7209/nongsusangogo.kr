import { XMLParser } from "fast-xml-parser";
import {
  type KamisPriceRecord,
  type KamisPriceResponse,
  kamisPriceRecordSchema,
} from "@/lib/kamis/types";

export type KamisResponseFormat = "auto" | "xml" | "json";
export type KamisRawRecord = Record<string, unknown>;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
});

export async function parseKamisRawResponse(
  response: Response,
  format: KamisResponseFormat = "auto",
): Promise<KamisPriceResponse> {
  const text = await response.text();
  const parsed =
    format === "json" || (format === "auto" && looksLikeJson(text))
      ? JSON.parse(text)
      : parser.parse(text);
  const rawRecords = extractRawRecords(parsed);

  return {
    sourceCode: "KAMIS",
    records: rawRecords.map(mapKamisRecord),
    nextCursor: extractNextCursor(parsed),
  };
}

export function extractRawRecords(payload: unknown): KamisRawRecord[] {
  const candidates = findArrays(payload).flat();
  const records = candidates.filter(
    (value): value is KamisRawRecord =>
      isObject(value) &&
      hasAnyKey(value, [
        "item_name",
        "itemName",
        "productName",
        "product_cls_name",
        "품목명",
        "price",
        "dpr1",
      ]),
  );

  if (records.length > 0) {
    return records;
  }

  return isObject(payload) ? [payload] : [];
}

export function mapKamisRecord(raw: KamisRawRecord): KamisPriceRecord {
  const record = {
    date: pickString(raw, ["date", "yyyy", "regday", "조회일자", "day"]) ?? "",
    itemCode: pickString(raw, ["itemCode", "item_code", "itemcode", "품목코드"]) ?? "unknown",
    itemName: pickString(raw, ["itemName", "item_name", "productName", "품목명"]) ?? "unknown",
    kindCode: pickString(raw, ["kindCode", "kind_code", "kindcode", "품종코드"]) ?? "unknown",
    kindName: pickString(raw, ["kindName", "kind_name", "kindName", "품종명"]) ?? "unknown",
    category: pickString(raw, ["category", "category_name", "product_cls_name", "부류명"]) ?? "unknown",
    unit: pickString(raw, ["unit", "unitName", "단위"]) ?? "unknown",
    unitType: "unknown",
    rank: normalizeRank(pickString(raw, ["rank", "rank_name", "grade", "등급"])),
    wsrt: normalizeWsrt(pickString(raw, ["wsrt", "product_cls_code", "구분", "kind"])),
    regionCode: pickString(raw, [
      "regionCode",
      "region_code",
      "p_country_code",
      "county_code",
      "지역코드",
    ]),
    price: pickString(raw, ["price", "dpr1", "조회일자가격", "당일", "가격"]),
    prevDay: pickString(raw, ["prevDay", "dpr2", "1일전가격", "전일"]),
    m1Ma5: pickString(raw, ["m1Ma5", "dpr6", "1개월전가격", "전월"]),
    y1Ma5: pickString(raw, ["y1Ma5", "dpr7", "1년전가격", "전년"]),
    normal3yr: pickString(raw, ["normal3yr", "dpr8", "평년가격", "평년"]),
  };

  return kamisPriceRecordSchema.parse(record);
}

function extractNextCursor(payload: unknown) {
  if (!isObject(payload)) {
    return null;
  }

  return pickString(payload, ["nextCursor", "next_cursor", "cursor"]) ?? null;
}

function looksLikeJson(text: string) {
  const trimmed = text.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function findArrays(value: unknown): unknown[][] {
  if (Array.isArray(value)) {
    return [value, ...value.flatMap(findArrays)];
  }

  if (!isObject(value)) {
    return [];
  }

  return Object.values(value).flatMap(findArrays);
}

function hasAnyKey(value: KamisRawRecord, keys: string[]) {
  return keys.some((key) => value[key] !== undefined);
}

function pickString(value: KamisRawRecord, keys: string[]) {
  for (const key of keys) {
    const candidate = value[key];

    if (candidate !== undefined && candidate !== null && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }

  return null;
}

function normalizeRank(value: string | null) {
  if (!value) return "unknown";
  if (/상|high/i.test(value)) return "high";
  if (/중|middle/i.test(value)) return "middle";
  if (/하|low/i.test(value)) return "low";
  return "unknown";
}

function normalizeWsrt(value: string | null) {
  if (/도매|wholesale|01/i.test(value ?? "")) return "wholesale";
  return "retail";
}

function isObject(value: unknown): value is KamisRawRecord {
  return typeof value === "object" && value !== null;
}

