import { describe, expect, it } from "vitest";
import { extractRawRecords, mapKamisRecord } from "@/lib/kamis/raw";

describe("KAMIS raw parser mapper", () => {
  it("extracts records from nested API payloads", () => {
    const records = extractRawRecords({
      response: {
        data: {
          item: [
            {
              item_name: "배추",
              item_code: "111",
              kind_code: "01",
              kind_name: "봄",
              unit: "10kg",
              price: "10,000",
            },
          ],
        },
      },
    });

    expect(records).toHaveLength(1);
  });

  it("maps common raw fields into normalized price records", () => {
    const mapped = mapKamisRecord({
      date: "2026-06-05",
      item_code: "111",
      item_name: "배추",
      kind_code: "01",
      kind_name: "봄",
      product_cls_name: "채소",
      unit: "10kg",
      rank: "중품",
      wsrt: "도매",
      p_country_code: "1101",
      price: "10,000",
    });

    expect(mapped).toMatchObject({
      itemCode: "111",
      itemName: "배추",
      rank: "middle",
      wsrt: "wholesale",
      regionCode: "1101",
    });
  });
});

